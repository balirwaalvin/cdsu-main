// CDSU Mail — mailbox administration, called from /admin → Mailboxes.
// Only active staff administrators may call it. It can:
//   status        report whether Resend is configured and the cdsu.online domain's state
//   set_password  create the sign-in account for a mailbox, or reset its password
// It never reads anyone's mail.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const ORIGINS = ["https://cdsu.online", "https://www.cdsu.online", "http://localhost:8000", "http://127.0.0.1:8000"];
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const RESEND_KEY = Deno.env.get("RESEND_API_KEY") || "";

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

async function findUserByEmail(email: string) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email || "").toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 1000) return null;
  }
  return null;
}

async function resendStatus() {
  const out: Record<string, unknown> = {
    api_key: Boolean(RESEND_KEY),
    webhook_secret: Boolean(Deno.env.get("RESEND_WEBHOOK_SECRET")),
    domain: null,
  };
  if (!RESEND_KEY) return out;
  try {
    const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${RESEND_KEY}` } });
    if (r.status === 401 || r.status === 403) {
      out.domain_error = "The Resend API key can only send. Use a full-access key so CDSU Mail can check the domain.";
      return out;
    }
    const j = await r.json();
    const d = (j.data || []).find((x: { name: string }) => x.name === "cdsu.online");
    out.domain = d ? { status: d.status, region: d.region, capabilities: d.capabilities ?? null } : null;
  } catch (_) {
    out.domain_error = "Couldn't reach Resend.";
  }
  return out;
}

Deno.serve(async (req) => {
  const h = corsHeaders(req);
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  if (req.method !== "POST") return reply(405, { error: "Use POST." });

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: auth, error: authErr } = await db.auth.getUser(token);
  const caller = auth?.user;
  if (authErr || !caller) return reply(401, { error: "Please sign in again." });
  const { data: staff } = await db.from("staff").select("role").eq("user_id", caller.id).eq("active", true).maybeSingle();
  if (staff?.role !== "admin") return reply(403, { error: "Only CDSU administrators can manage mailboxes." });

  let body: { action?: string; address?: string; password?: string };
  try { body = await req.json(); } catch (_) { return reply(400, { error: "Bad request." }); }

  if (body.action === "status") return reply(200, await resendStatus());

  if (body.action === "set_password") {
    const address = String(body.address || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (password.length < 10) return reply(400, { error: "Use a password of at least 10 characters." });
    if (password.length > 72) return reply(400, { error: "Use a password of at most 72 characters." });

    const { data: box } = await db.from("mailboxes").select("id, address, display_name, user_id")
      .eq("address", address).eq("active", true).maybeSingle();
    if (!box) return reply(404, { error: "There is no mailbox with that address." });

    let uid: string | null = box.user_id;
    const created = !uid;
    try {
      if (uid) {
        const { error } = await db.auth.admin.updateUserById(uid, { password, email_confirm: true });
        if (error) throw error;
      } else {
        const { data, error } = await db.auth.admin.createUser({
          email: box.address, password, email_confirm: true,
          user_metadata: { full_name: box.display_name, mailbox: box.address },
        });
        if (error) {
          // Someone may already have registered this address on the website: take the account over for the mailbox
          const existing = await findUserByEmail(box.address);
          if (!existing) throw error;
          const upd = await db.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
          if (upd.error) throw upd.error;
          uid = existing.id;
        } else {
          uid = data.user.id;
        }
        const link = await db.from("mailboxes").update({ user_id: uid }).eq("id", box.id);
        if (link.error) throw link.error;
      }
    } catch (err) {
      return reply(500, { error: (err as Error).message || "Couldn't save the password." });
    }

    await db.from("audit_log").insert({
      actor: caller.id, action: "mailbox.password", entity: "mailbox", entity_id: box.address,
      details: { created },
    });
    return reply(200, { ok: true, created });
  }

  return reply(400, { error: "Unknown action." });
});
