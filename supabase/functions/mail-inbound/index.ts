// CDSU Mail — Resend webhook. Point a Resend webhook at this function's URL with these events:
//   email.received                         new mail for @cdsu.online, filed into the matching mailbox
//   email.delivered, email.delivery_delayed,
//   email.bounced, email.complained,
//   email.failed                           delivery updates for mail CDSU sent
// Every request must carry a valid Svix signature made with RESEND_WEBHOOK_SECRET.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { decodeBase64, encodeBase64 } from "jsr:@std/encoding@1.0.5/base64";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET") || "";
const DOMAIN = "cdsu.online";
const MAX_FILE = 25 * 1024 * 1024;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/* ---------- signature (Svix scheme used by Resend) ---------- */
async function verify(req: Request, raw: string) {
  const id = req.headers.get("svix-id"), ts = req.headers.get("svix-timestamp"), sig = req.headers.get("svix-signature");
  if (!SECRET || !id || !ts || !sig) return false;
  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (!Number.isFinite(age) || age > 300) return false;
  const key = await crypto.subtle.importKey("raw", decodeBase64(SECRET.replace(/^whsec_/, "")),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = encodeBase64(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${raw}`))));
  return sig.split(" ").some((part) => {
    const [ver, value] = part.split(",");
    if (ver !== "v1" || !value || value.length !== mac.length) return false;
    let diff = 0;
    for (let i = 0; i < mac.length; i++) diff |= mac.charCodeAt(i) ^ value.charCodeAt(i);
    return diff === 0;
  });
}

/* ---------- helpers ---------- */
// "Jane Doe <jane@x.org>" → { name: "Jane Doe", address: "jane@x.org" }
function parseAddress(v: unknown) {
  const s = String(v ?? "").trim();
  const m = s.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  return m ? { name: m[1].trim(), address: m[2].trim().toLowerCase() } : { name: "", address: s.toLowerCase() };
}
const addrList = (v: unknown) => (Array.isArray(v) ? v : v ? [v] : []).map((x) => parseAddress(x).address).filter(Boolean);
const normSubject = (s: string) => s.replace(/^\s*((re|fw|fwd|aw|wg)\s*(\[\d+\])?\s*:\s*)+/i, "").trim().toLowerCase();
const htmlToText = (html: string) => html
  .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, " ")
  .replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d)>/gi, "\n")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const safeName = (n: string) => (n || "attachment").replace(/[\/\\?%*:|"<>\x00-\x1f]/g, "_").slice(0, 150) || "attachment";
const header = (headers: Record<string, unknown>, name: string) => {
  const hit = Object.entries(headers || {}).find(([k]) => k.toLowerCase() === name);
  const v = hit?.[1];
  return v == null ? null : String(Array.isArray(v) ? v[0] : v).trim() || null;
};

async function resend(path: string) {
  const r = await fetch(`https://api.resend.com${path}`, { headers: { Authorization: `Bearer ${RESEND_KEY}` } });
  if (!r.ok) throw new Error(`Resend ${path} → ${r.status} ${await r.text()}`);
  return r.json();
}

// Which conversation a new message belongs to, within one mailbox
async function findThread(boxId: string, inReplyTo: string | null, refs: string | null, subject: string, from: string) {
  const ids = [inReplyTo, ...(refs || "").split(/\s+/)].filter(Boolean) as string[];
  if (ids.length) {
    const { data } = await db.from("mail_messages").select("id, thread_id")
      .eq("mailbox_id", boxId).in("message_id", ids.slice(-20)).limit(1);
    if (data?.length) return data[0].thread_id || data[0].id;
  }
  // Replies to mail CDSU sent: match the subject and the person we wrote to, within 90 days
  const base = normSubject(subject);
  if (base && base !== subject.trim().toLowerCase()) {
    const since = new Date(Date.now() - 90 * 864e5).toISOString();
    const { data } = await db.from("mail_messages").select("id, thread_id, subject, to_addrs, cc_addrs, from_address")
      .eq("mailbox_id", boxId).gte("sent_at", since).ilike("subject", `%${base.replace(/[%_]/g, "")}%`)
      .order("sent_at", { ascending: false }).limit(20);
    const hit = (data || []).find((m) => normSubject(m.subject) === base &&
      (m.from_address === from || m.to_addrs.includes(from) || m.cc_addrs.includes(from)));
    if (hit) return hit.thread_id || hit.id;
  }
  return null;
}

/* ---------- email.received ---------- */
async function receive(emailId: string, fallback: Record<string, unknown>) {
  const email = await resend(`/emails/receiving/${emailId}`);
  const { data: boxes, error } = await db.from("mailboxes").select("id, address, catch_all").eq("active", true);
  if (error) throw error;

  // Who at cdsu.online this was for (To, Cc, and envelope recipients, which also covers Bcc)
  const ours = [...new Set([
    ...addrList(email.to ?? fallback.to), ...addrList(email.cc ?? fallback.cc),
    ...addrList(email.bcc ?? fallback.bcc), ...addrList(email.received_for ?? fallback.received_for),
  ])].filter((a) => a.endsWith(`@${DOMAIN}`));
  const targets = new Map<string, { id: string }>();
  for (const a of ours) {
    const box = boxes!.find((b) => b.address === a) || boxes!.find((b) => b.catch_all);
    if (box) targets.set(box.id, box);
  }
  if (!targets.size) {
    const box = boxes!.find((b) => b.catch_all);
    if (box) targets.set(box.id, box);
  }

  const from = parseAddress(header(email.headers, "from") || email.from || fallback.from);
  const subject = String(email.subject ?? fallback.subject ?? "").slice(0, 998);
  const html: string | null = email.html || null;
  const text: string | null = email.text || null;
  const snippet = (text || (html ? htmlToText(html) : "")).replace(/\s+/g, " ").trim().slice(0, 200);
  const inReplyTo = header(email.headers, "in-reply-to");
  const refs = header(email.headers, "references");
  const authRes = email.authentication || null;
  const spam = authRes?.dmarc === "fail";
  const replyTo = addrList(email.reply_to)[0] || null;

  // Attachment files are fetched once and copied into each recipient mailbox's folder
  let files: { meta: Record<string, unknown>; bytes: Uint8Array | null }[] = [];
  if ((email.attachments || []).length) {
    let after: string | null = null;
    do {
      const page = await resend(`/emails/receiving/${emailId}/attachments?limit=100${after ? `&after=${after}` : ""}`);
      for (const a of page.data || []) {
        let bytes: Uint8Array | null = null;
        if ((a.size ?? 0) <= MAX_FILE && a.download_url) {
          const r = await fetch(a.download_url);
          if (r.ok) bytes = new Uint8Array(await r.arrayBuffer());
        }
        files.push({ meta: a, bytes });
      }
      after = page.has_more && page.data?.length ? page.data[page.data.length - 1].id : null;
    } while (after);
  }

  for (const box of targets.values()) {
    const { data: dupe } = await db.from("mail_messages").select("id")
      .eq("mailbox_id", box.id).eq("resend_id", emailId).eq("direction", "in").maybeSingle();
    if (dupe) continue;

    const id = crypto.randomUUID();
    const stored = [];
    for (const f of files) {
      const name = safeName(String(f.meta.filename || ""));
      const entry: Record<string, unknown> = {
        name, type: f.meta.content_type || "application/octet-stream", size: f.meta.size ?? f.bytes?.length ?? 0,
        inline: f.meta.content_disposition === "inline", cid: f.meta.content_id || null, path: null,
      };
      if (f.bytes) {
        const path = `${box.id}/in/${id}/${crypto.randomUUID().slice(0, 8)}-${name}`;
        const up = await db.storage.from("mail").upload(path, f.bytes, { contentType: String(entry.type), upsert: false });
        if (!up.error) entry.path = path;
      } else {
        entry.too_large = true;
      }
      stored.push(entry);
    }

    const thread = await findThread(box.id, inReplyTo, refs, subject, from.address);
    const ins = await db.from("mail_messages").insert({
      id, mailbox_id: box.id, direction: "in", folder: spam ? "spam" : "inbox", status: "received",
      resend_id: emailId, message_id: email.message_id || header(email.headers, "message-id"),
      in_reply_to: inReplyTo, ref_headers: refs, thread_id: thread || id,
      from_address: from.address, from_name: from.name,
      to_addrs: addrList(email.to), cc_addrs: addrList(email.cc), reply_to: replyTo,
      subject, body_html: html, body_text: text, snippet, attachments: stored,
      auth_results: authRes, sent_at: email.created_at || new Date().toISOString(),
    });
    // 23505: the same email arrived twice at once and the other copy won — that's fine
    if (ins.error && ins.error.code !== "23505") throw ins.error;
  }
}

/* ---------- delivery updates for sent mail ---------- */
const RANK: Record<string, number> = { sent: 1, delayed: 2, delivered: 3, bounced: 4, complained: 4, failed: 4 };
const EVENT_STATUS: Record<string, string> = {
  "email.delivered": "delivered", "email.delivery_delayed": "delayed",
  "email.bounced": "bounced", "email.complained": "complained", "email.failed": "failed",
};

async function delivery(type: string, data: Record<string, any>) {
  const status = EVENT_STATUS[type];
  if (!status || !data.email_id) return;
  const { data: rows } = await db.from("mail_messages").select("id, status")
    .eq("resend_id", data.email_id).eq("direction", "out");
  for (const r of rows || []) {
    if ((RANK[r.status] ?? 0) > RANK[status]) continue;
    const error = data.bounce?.message || data.failed?.reason || null;
    await db.from("mail_messages").update({ status, ...(error ? { error: String(error).slice(0, 500) } : {}) }).eq("id", r.id);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Use POST." });
  const raw = await req.text();
  if (!(await verify(req, raw))) return json(401, { error: "Invalid signature." });

  let event: { type?: string; data?: Record<string, any> };
  try { event = JSON.parse(raw); } catch (_) { return json(400, { error: "Bad JSON." }); }
  const type = event.type || "", data = event.data || {};

  try {
    if (type === "email.received") {
      if (!RESEND_KEY) return json(503, { error: "RESEND_API_KEY is not set." });
      await receive(String(data.email_id), data);
    } else if (EVENT_STATUS[type]) {
      await delivery(type, data);
    }
    return json(200, { ok: true });
  } catch (err) {
    console.error(type, err);
    return json(500, { error: "Couldn't process the event; Resend will retry." }); // Resend retries non-2xx responses
  }
});
