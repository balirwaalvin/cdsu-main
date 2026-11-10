// CDSU Mail — send an email from the signed-in mailbox through Resend.
// The caller's session decides which mailbox it sends from; the browser never sees the Resend key.
// Body: { draft_id?, parent_id?, to[], cc[], bcc[], subject, html, text, attachments: [{ path, name, type, size }] }
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { encodeBase64 } from "jsr:@std/encoding@1.0.5/base64";

const ORIGINS = ["https://cdsu.online", "https://www.cdsu.online", "http://localhost:8000", "http://127.0.0.1:8000"];
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") || "";
const EMAIL = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/;
const MAX_RECIPIENTS = 50;
const MAX_ATTACH_BYTES = 28 * 1024 * 1024; // stays under Resend's 40 MB limit once Base64-encoded

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

const cleanList = (v: unknown): string[] =>
  [...new Set((Array.isArray(v) ? v : []).map((x) => String(x).trim().toLowerCase()).filter(Boolean))];

const snippetOf = (text: string) => text.replace(/\s+/g, " ").trim().slice(0, 200);

// Outgoing HTML: the message itself in a plain wrapper that mail apps render consistently
const wrapHtml = (inner: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>` +
  `<body style="margin:0;padding:0;"><div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#141B3A;">` +
  `${inner}</div></body></html>`;

Deno.serve(async (req) => {
  const h = corsHeaders(req);
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return reply(405, { error: "Use POST." });

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: auth, error: authErr } = await db.auth.getUser(token);
  const user = auth?.user;
  if (authErr || !user) return reply(401, { error: "Your session has ended. Please sign in again." });

  const { data: box } = await db.from("mailboxes").select("id, address, display_name, signature")
    .eq("user_id", user.id).eq("active", true).maybeSingle();
  if (!box) return reply(403, { error: "This account isn't linked to a CDSU mailbox." });
  if (!RESEND_KEY) return reply(503, { error: "Sending isn't switched on yet: the Resend API key hasn't been added." });

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch (_) { return reply(400, { error: "Bad request." }); }

  const to = cleanList(b.to), cc = cleanList(b.cc), bcc = cleanList(b.bcc);
  const all = [...to, ...cc, ...bcc];
  if (!to.length) return reply(400, { error: "Add at least one recipient in To." });
  const bad = all.find((a) => !EMAIL.test(a));
  if (bad) return reply(400, { error: `"${bad}" isn't a valid email address.` });
  if (all.length > MAX_RECIPIENTS) return reply(400, { error: `You can send to at most ${MAX_RECIPIENTS} people at once.` });

  const subject = String(b.subject || "").replace(/[\r\n]+/g, " ").trim().slice(0, 998);
  const html = String(b.html || "");
  const text = String(b.text || "");
  if (html.length > 3_000_000) return reply(400, { error: "The message is too long." });
  if (!subject && !text.trim()) return reply(400, { error: "Write a subject or a message first." });

  // Replying or forwarding: keep the conversation together in the recipient's mail app and here
  let inReplyTo: string | null = null, refs: string | null = null, threadId: string | null = null;
  const parentId = b.parent_id ? String(b.parent_id) : null;
  if (parentId) {
    const { data: parent } = await db.from("mail_messages")
      .select("id, message_id, ref_headers, thread_id").eq("id", parentId).eq("mailbox_id", box.id).maybeSingle();
    if (parent) {
      threadId = parent.thread_id || parent.id;
      if (parent.message_id) {
        inReplyTo = parent.message_id;
        refs = [parent.ref_headers, parent.message_id].filter(Boolean).join(" ").slice(-1900);
      }
    }
  }

  // Attachments: only files in this mailbox's own folder of the private bucket
  const files = Array.isArray(b.attachments) ? b.attachments as { path: string; name: string; type?: string; size?: number }[] : [];
  const resendFiles: { filename: string; content: string; content_type?: string }[] = [];
  const kept: { name: string; type: string; size: number; path: string }[] = [];
  let total = 0;
  for (const f of files.slice(0, 20)) {
    const path = String(f.path || "");
    if (!path.startsWith(`${box.id}/`) || path.includes("..")) return reply(400, { error: "One of the attachments isn't available." });
    const { data: blob, error } = await db.storage.from("mail").download(path);
    if (error || !blob) return reply(400, { error: `Couldn't attach "${f.name}". Try adding it again.` });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    total += bytes.length;
    if (total > MAX_ATTACH_BYTES) return reply(400, { error: "Attachments can add up to 28 MB per email." });
    const name = String(f.name || path.split("/").pop() || "attachment").slice(0, 200);
    const type = String(f.type || blob.type || "application/octet-stream");
    resendFiles.push({ filename: name, content: encodeBase64(bytes), content_type: type });
    kept.push({ name, type, size: bytes.length, path });
  }

  const draftId = b.draft_id ? String(b.draft_id) : null;
  if (draftId) {
    const { data: draft } = await db.from("mail_messages").select("id, status")
      .eq("id", draftId).eq("mailbox_id", box.id).maybeSingle();
    if (!draft) return reply(404, { error: "That draft no longer exists." });
    if (draft.status !== "draft") return reply(409, { error: "This message has already been sent." });
  }

  const headers: Record<string, string> = {};
  if (inReplyTo) headers["In-Reply-To"] = inReplyTo;
  if (refs) headers["References"] = refs;

  const payload: Record<string, unknown> = {
    from: `${box.display_name.replace(/[<>"]/g, "")} <${box.address}>`,
    to, subject: subject || "(no subject)",
    html: wrapHtml(html || text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!)).replace(/\n/g, "<br>")),
    text: text || undefined,
  };
  if (cc.length) payload.cc = cc;
  if (bcc.length) payload.bcc = bcc;
  if (Object.keys(headers).length) payload.headers = headers;
  if (resendFiles.length) payload.attachments = resendFiles;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
      ...(draftId || b.send_id ? { "Idempotency-Key": `cdsu-mail-${draftId || String(b.send_id)}`.slice(0, 256) } : {}),
    },
    body: JSON.stringify(payload),
  });
  const res = await r.json().catch(() => ({}));
  if (!r.ok || !res.id) {
    return reply(502, { error: res.message ? `Resend: ${res.message}` : "The email couldn't be sent. Please try again." });
  }

  const row = {
    direction: "out", folder: "sent", status: "sent", resend_id: res.id,
    in_reply_to: inReplyTo, ref_headers: refs, parent_id: parentId,
    from_address: box.address, from_name: box.display_name,
    to_addrs: to, cc_addrs: cc, bcc_addrs: bcc, subject,
    body_html: html || null, body_text: text || null, snippet: snippetOf(text),
    attachments: kept, sent_at: new Date().toISOString(), is_read: true,
  };
  let saved;
  if (draftId) {
    saved = await db.from("mail_messages").update({ ...row, thread_id: threadId || draftId }).eq("id", draftId).select("id").single();
  } else {
    const id = crypto.randomUUID();
    saved = await db.from("mail_messages").insert({ id, mailbox_id: box.id, ...row, thread_id: threadId || id }).select("id").single();
  }
  // The email has gone even if saving the copy failed, so report success either way
  return reply(200, { ok: true, id: saved.data?.id ?? null, resend_id: res.id });
});
