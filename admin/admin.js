/* CDSU admin portal: payments queue, book serials, inbox, members, online book upload, staff and activity.
   Every action goes through permission-checked database functions; this page only renders and calls them. */
(function () {
  "use strict";
  const db = window.CDSU_DB;
  const D = window.CDSU_DATA;
  const app = document.getElementById("admin-app");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (d, time) => (d ? new Date(d).toLocaleString("en-GB", time ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short", year: "numeric" }) : "—");
  const money = (n, cur = "UGX") => `${cur} ${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: cur === "USD" ? 2 : 0 })}`;
  const METHODS = window.CDSU_METHODS;
  const STATUS = { pending: "Pending", confirmed: "Confirmed", rejected: "Rejected", new: "New", read: "Read", replied: "Replied", archived: "Archived", issued: "Issued", available: "Available", redeemed: "Redeemed", revoked: "Revoked" };
  const chip = (s) => `<span class="chip-status is-${esc(s)}">${esc(STATUS[s] || s)}</span>`;
  const SITE = location.origin + location.pathname.replace(/admin\/?(index\.html)?$/, "");
  const ORG = D.organization.shortName;
  let me = null, role = "member", view = "overview";

  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("show"), 2800);
  };
  const call = async (fn, args) => {
    const { data, error } = await db.rpc(fn, args);
    if (error) throw error;
    return data;
  };
  const firstName = (n) => String(n || "").trim().split(/\s+/)[0] || "there";
  // WhatsApp needs an international number without "+" (Ugandan 07XX… becomes 2567XX…)
  const waNumber = (raw) => {
    let d = String(raw || "").replace(/\D/g, "");
    if (d.length === 10 && d.startsWith("0")) d = "256" + d.slice(1);
    if (d.length === 9 && d.startsWith("7")) d = "256" + d;
    return d.length >= 11 ? d : "";
  };
  const isEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(s || "").trim());
  const waHref = (phone, text) => `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;
  const mailHref = (email, subject, body) => `mailto:${encodeURIComponent(String(email).trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const icon = {
    overview: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
    payments: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    serials: '<path d="M4 6h16M4 12h16M4 18h10"/><path d="M18 16v4M16 18h4"/>',
    messages: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    members: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>',
    staff: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'
  };
  const svg = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon[k]}</svg>`;
  const VIEWS = {
    overview: { title: "Overview", lead: "What needs your attention today." },
    payments: { title: "Payments", lead: "Check each payment against CDSU's statements, then confirm or reject it." },
    serials: { title: "Book serials", lead: "Serial numbers issued online and generated for printed copies." },
    messages: { title: "Messages", lead: "Messages sent from the website's contact form." },
    members: { title: "Members", lead: "Everyone with a CDSU account." },
    book: { title: "Online book", lead: "Upload the book once; readers see it page by page, never as a file." },
    staff: { title: "Staff", lead: "Who can sign in to this portal.", admin: true },
    activity: { title: "Activity log", lead: "Every staff action, newest first.", admin: true }
  };

  /* ---------- sign in ---------- */
  function renderLogin(note = "") {
    app.innerHTML = `
      <div class="admin-login">
        <div class="acct-card">
          <a class="admin-brand" href="../index.html"><img src="../assets/images/cdsu_emblem.png" alt=""><span><small>${esc(ORG)}</small><strong>Admin Portal</strong></span></a>
          ${note ? `<p class="auth-note">${note}</p>` : ""}
          <form class="form form-light" id="login-form" novalidate>
            <label>Email<input name="email" type="email" required autocomplete="email"></label>
            <label>Password<input name="password" type="password" required autocomplete="current-password"></label>
            <button type="submit" class="btn btn-primary">Sign in</button>
            <p class="form-msg" role="status"></p>
          </form>
          <p class="small muted">Staff sign in with their CDSU account. Forgot your password? <a href="../account.html">Reset it here</a>.</p>
        </div>
      </div>`;
    $("#login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, msg = $(".form-msg", f);
      msg.textContent = "Signing in…";
      const { error } = await db.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value });
      if (error) msg.textContent = window.CDSU_ERR(error);
      else boot();
    });
  }

  async function boot() {
    if (!db) { app.innerHTML = `<p class="empty">The portal couldn't connect. Please refresh the page.</p>`; return; }
    const { data: { session } } = await db.auth.getSession();
    if (!session) return renderLogin();
    me = session.user;
    role = await call("my_role").catch(() => "member");
    if (role === "member") {
      await db.auth.signOut();
      return renderLogin(`<strong>${esc(me.email)}</strong> doesn't have staff access. Ask a CDSU administrator to add you under Staff.`);
    }
    renderShell();
    route();
    refreshBadges();
    setInterval(refreshBadges, 60000);
  }

  /* ---------- layout ---------- */
  function renderShell() {
    const link = (k) => (VIEWS[k].admin && role !== "admin" ? "" : `<a href="#${k}" data-view="${k}">${svg(k)}<span>${VIEWS[k].title}</span><span class="badge" data-badge="${k}"></span></a>`);
    app.innerHTML = `
      <div class="admin-shell">
        <aside class="admin-side" id="admin-side">
          <a class="admin-brand" href="../index.html" title="Open the website"><img src="../assets/images/cdsu_emblem.png" alt=""><span><small>${esc(ORG)}</small><strong>Admin Portal</strong></span></a>
          <nav class="admin-nav" aria-label="Admin sections">
            ${link("overview")}${link("payments")}${link("serials")}${link("messages")}${link("members")}${link("book")}
            ${role === "admin" ? `<div class="admin-nav-label">Administration</div>${link("staff")}${link("activity")}` : ""}
          </nav>
          <div class="admin-me">
            <strong>${esc(me.user_metadata?.full_name || me.email)}</strong>${esc(me.email)}<br>
            <span class="role">${role === "admin" ? "Administrator" : "Secretariat"}</span>
            <button type="button" class="btn btn-outline-light btn-sm" id="sign-out">Sign out</button>
          </div>
        </aside>
        <main class="admin-main">
          <div class="admin-top">
            <div><h1 id="view-title"></h1><p id="view-lead"></p></div>
            <button type="button" class="btn btn-outline btn-sm admin-menu-btn" id="menu-btn">Menu</button>
          </div>
          <div id="view"></div>
        </main>
      </div>
      <div class="drawer" id="drawer" aria-hidden="true"><div class="drawer-box" role="dialog" aria-modal="true"><button type="button" class="drawer-close" aria-label="Close">&times;</button><div id="drawer-body"></div></div></div>`;
    $("#sign-out").addEventListener("click", async () => { await db.auth.signOut(); renderLogin("You've signed out."); });
    $("#menu-btn").addEventListener("click", () => $("#admin-side").classList.toggle("open"));
    $("#drawer").addEventListener("click", (e) => { if (e.target.id === "drawer" || e.target.closest(".drawer-close")) closeDrawer(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });
  }

  function route() {
    const k = location.hash.slice(1);
    view = VIEWS[k] && !(VIEWS[k].admin && role !== "admin") ? k : "overview";
    $$(".admin-nav a").forEach((a) => a.classList.toggle("active", a.dataset.view === view));
    $("#view-title").textContent = VIEWS[view].title;
    $("#view-lead").textContent = VIEWS[view].lead;
    $("#admin-side").classList.remove("open");
    $("#view").innerHTML = `<p class="empty">Loading…</p>`;
    ({ overview, payments, serials, messages, members, book, staff, activity })[view]().catch((err) => {
      $("#view").innerHTML = `<p class="empty">${esc(window.CDSU_ERR(err))}</p>`;
    });
  }
  window.addEventListener("hashchange", () => app.querySelector(".admin-shell") && route());

  async function refreshBadges() {
    const s = await call("admin_stats").catch(() => null);
    if (!s) return;
    const set = (k, n) => { const b = $(`[data-badge="${k}"]`); if (b) b.textContent = n > 0 ? n : ""; };
    set("payments", s.pending);
    set("messages", s.new_messages);
    set("serials", s.serials_unsent);
    document.title = `${s.pending > 0 ? `(${s.pending}) ` : ""}Admin Portal — ${ORG}`;
  }

  const openDrawer = (html) => { $("#drawer-body").innerHTML = html; $("#drawer").classList.add("open"); $("#drawer").setAttribute("aria-hidden", "false"); };
  const closeDrawer = () => { const d = $("#drawer"); if (d) { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); } };

  /* ---------- overview ---------- */
  async function overview() {
    const [s, pending] = await Promise.all([
      call("admin_stats"),
      db.from("payments").select("id, reference, payer_name, amount, currency, created_at, services(label)").eq("status", "pending").order("created_at").limit(6)
    ]);
    const max = Math.max(1, ...s.by_service.map((x) => +x.ugx));
    $("#view").innerHTML = `
      <div class="stat-grid">
        <a class="stat ${s.pending ? "is-alert" : ""}" href="#payments"><small>Payments to review</small><strong>${s.pending}</strong><span>awaiting confirmation</span></a>
        <div class="stat"><small>Confirmed this month</small><strong>${money(s.confirmed_month_ugx)}</strong><span>${new Date().toLocaleString("en-GB", { month: "long", year: "numeric" })}</span></div>
        <div class="stat"><small>Confirmed in total</small><strong>${money(s.confirmed_total_ugx)}</strong><span>${+s.confirmed_total_usd ? `+ ${money(s.confirmed_total_usd, "USD")}` : "since launch"}</span></div>
        <a class="stat ${s.new_messages ? "is-alert" : ""}" href="#messages"><small>New messages</small><strong>${s.new_messages}</strong><span>unread in the inbox</span></a>
        <a class="stat" href="#members"><small>Members</small><strong>${s.members}</strong><span>accounts created</span></a>
        <div class="stat"><small>Online readers</small><strong>${s.readers}</strong><span>books unlocked</span></div>
        <a class="stat ${s.serials_unsent ? "is-alert" : ""}" href="#serials"><small>Serials to send</small><strong>${s.serials_unsent}</strong><span>confirmed, not yet sent</span></a>
        <div class="stat"><small>Seminar seats left</small><strong>${s.seminar_seats_left ?? "—"}</strong><span>of ${D.seminar ? 100 : "—"} ·${esc(D.seminar?.dates || "")}</span></div>
      </div>
      <div class="panel-grid">
        <section class="panel">
          <h2>Oldest payments waiting</h2>
          ${pending.data?.length ? `<div class="table-wrap"><table class="data"><tbody>${pending.data.map((p) => `
            <tr class="clickable" data-payment="${p.id}"><td><strong>${esc(p.payer_name)}</strong><small>${esc(p.services?.label || "")}</small></td>
            <td>${money(p.amount, p.currency)}<small>${esc(p.reference)} · ${fmtDate(p.created_at)}</small></td></tr>`).join("")}</tbody></table></div>`
          : `<p class="empty">Nothing waiting — all payments are reviewed.</p>`}
        </section>
        <section class="panel">
          <h2>Confirmed income by service (UGX)</h2>
          <div class="bars-list">${s.by_service.map((x) => `
            <div class="row"><div>${esc(x.label)}<small class="muted"> · ${x.count} payment${x.count == 1 ? "" : "s"}</small><div class="track"><span style="width:${(+x.ugx / max) * 100}%"></span></div></div><strong>${Number(x.ugx).toLocaleString("en-US")}</strong></div>`).join("")}</div>
        </section>
      </div>`;
  }

  /* ---------- payments ---------- */
  let payFilter = "pending", payQuery = "";
  async function payments() {
    let q = db.from("payments").select("*, services(label, kind)").order("created_at", { ascending: payFilter === "pending" }).limit(500);
    if (payFilter !== "all") q = q.eq("status", payFilter);
    const { data, error } = await q;
    if (error) throw error;
    const term = payQuery.toLowerCase();
    const rows = data.filter((p) => !term || [p.reference, p.payer_name, p.phone, p.email, p.transaction_id, p.institution].some((x) => String(x || "").toLowerCase().includes(term)));
    $("#view").innerHTML = `
      <div class="toolbar">
        <div class="seg" role="group" aria-label="Filter payments">${["pending", "confirmed", "rejected", "all"].map((f) => `<button type="button" data-pay-filter="${f}" aria-pressed="${payFilter === f}">${f === "all" ? "All" : STATUS[f]}</button>`).join("")}</div>
        <input class="search" type="search" placeholder="Search name, reference, phone, transaction ID…" value="${esc(payQuery)}" data-pay-search>
      </div>
      <section class="panel">
        ${rows.length ? `<div class="table-wrap"><table class="data">
          <thead><tr><th>Payer</th><th>For</th><th>Amount</th><th>Paid with</th><th>Submitted</th><th>Status</th></tr></thead>
          <tbody>${rows.map((p) => `
            <tr class="clickable" data-payment="${p.id}">
              <td><strong>${esc(p.payer_name)}</strong><small>${esc(p.phone || "")}${p.phone && p.email ? " · " : ""}${esc(p.email || "")}</small></td>
              <td>${esc(p.services?.label || p.service_code)}${p.quantity > 1 ? ` × ${p.quantity}` : ""}<small>${esc(p.reference)}</small></td>
              <td><strong>${money(p.amount, p.currency)}</strong></td>
              <td>${esc(METHODS[p.method] || p.method)}<small class="mono">${esc(p.transaction_id)}</small></td>
              <td>${fmtDate(p.created_at, true)}</td>
              <td>${chip(p.status)}</td>
            </tr>`).join("")}</tbody></table></div>`
        : `<p class="empty">${payFilter === "pending" ? "No payments waiting for review." : "No payments match."}</p>`}
      </section>`;
  }

  async function openPayment(id) {
    const [{ data: p, error }, { data: codes }] = await Promise.all([
      db.from("payments").select("*, services(label, kind)").eq("id", id).single(),
      db.from("book_serials").select("code, status, issued_via, issued_at").eq("payment_id", id).order("created_at")
    ]);
    if (error) return toast(window.CDSU_ERR(error));
    const svc = p.services || {};
    openDrawer(`
      <h2>${esc(p.payer_name)}</h2>
      <p>${chip(p.status)} <span class="muted small">${esc(p.reference)}</span></p>
      <dl class="kv-list">
        <dt>For</dt><dd>${esc(svc.label || p.service_code)}${p.quantity > 1 ? ` × ${p.quantity}` : ""}</dd>
        <dt>Amount</dt><dd><strong>${money(p.amount, p.currency)}</strong></dd>
        <dt>Paid with</dt><dd>${esc(METHODS[p.method] || p.method)}</dd>
        <dt>Transaction ID</dt><dd class="mono">${esc(p.transaction_id)}</dd>
        <dt>Phone</dt><dd>${esc(p.phone || "—")}</dd>
        <dt>Email</dt><dd>${esc(p.email || "—")}</dd>
        ${p.institution ? `<dt>Organisation</dt><dd>${esc(p.institution)}</dd>` : ""}
        <dt>Submitted</dt><dd>${fmtDate(p.created_at, true)}${p.user_id ? " · signed-in member" : ""}</dd>
        ${p.reviewed_at ? `<dt>Reviewed</dt><dd>${fmtDate(p.reviewed_at, true)}${p.admin_note ? ` — ${esc(p.admin_note)}` : ""}</dd>` : ""}
      </dl>
      ${p.status === "pending" ? `
        <div class="check-hint">Before confirming, find transaction <strong class="mono">${esc(p.transaction_id)}</strong> for <strong>${money(p.amount, p.currency)}</strong> in the ${esc(METHODS[p.method] || "")} statement.</div>
        <form class="form form-light" id="review-form" novalidate>
          <label>Note (optional, saved with the decision)<textarea name="note" rows="2" placeholder="e.g. Matched on MoMo statement, 1 Nov"></textarea></label>
          <div class="btn-row">
            <button type="submit" class="btn btn-primary" data-decision="confirmed">Confirm payment</button>
            <button type="submit" class="btn btn-danger" data-decision="rejected">Reject</button>
          </div>
          <p class="form-msg" role="status"></p>
        </form>` : ""}
      <div id="payment-after">${p.status === "confirmed" ? afterConfirmHtml(p, codes || []) : p.status === "rejected" ? notifyHtml(p, "rejected") : ""}</div>`);

    const form = $("#review-form");
    if (form) {
      let decision = "confirmed";
      $$("[data-decision]", form).forEach((b) => b.addEventListener("click", () => { decision = b.dataset.decision; }));
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (decision === "rejected" && !confirm("Reject this payment? The payer will not receive anything.")) return;
        const msg = $(".form-msg", form);
        $$("button", form).forEach((b) => (b.disabled = true));
        msg.textContent = "Saving…";
        try {
          const res = await call("review_payment", { p_payment: p.id, p_decision: decision, p_note: form.note.value });
          toast(decision === "confirmed" ? `Confirmed ${res.reference}` : `Rejected ${res.reference}`);
          refreshBadges();
          if (view === "payments" || view === "overview") route();
          openPayment(p.id);
        } catch (err) {
          msg.textContent = window.CDSU_ERR(err);
          $$("button", form).forEach((b) => (b.disabled = false));
        }
      });
    }
  }

  const serialMessage = (p, code) =>
    `Hello ${firstName(p.payer_name)}, thank you for buying "Career Development: A Path to Wealth". Your payment (${p.reference}) is confirmed.\n\nYour book serial number:\n${code}\n\nTo read the book online, create or sign in to your CDSU account at ${SITE}account.html and enter this serial number under "My book". It works for one account only, so please keep it private.\n\n— ${D.organization.fullName}`;

  function serialCardHtml(p, s) {
    const text = serialMessage(p, s.code);
    return `
      <div class="serial-card">
        <span class="mono">${esc(s.code)}</span>
        <div class="btn-row">
          ${waNumber(p.phone) ? `<a class="btn btn-primary btn-xs" target="_blank" rel="noopener" href="${waHref(p.phone, text)}" data-sent="${esc(s.code)}" data-via="whatsapp">Send on WhatsApp</a>` : ""}
          ${isEmail(p.email) ? `<a class="btn btn-outline btn-xs" href="${mailHref(p.email, "Your CDSU book serial number", text)}" data-sent="${esc(s.code)}" data-via="email">Send by email</a>` : ""}
          <button type="button" class="copy-btn" data-copy-text="${esc(text)}">Copy message</button>
        </div>
        <small>${s.status === "redeemed" ? "Redeemed by the buyer." : s.issued_at ? `Sent by ${esc(s.issued_via)} on ${fmtDate(s.issued_at, true)}.` : "Not sent yet."}</small>
      </div>`;
  }

  function afterConfirmHtml(p, codes) {
    if (p.services?.kind === "book") {
      return `<h3 class="sub-head" style="margin-top:1.2rem">Book serial${codes.length > 1 ? "s" : ""}</h3>${codes.map((s) => serialCardHtml(p, s)).join("")}`;
    }
    return notifyHtml(p, "confirmed");
  }

  function notifyHtml(p, outcome) {
    const label = p.services?.label || "your payment";
    const text = outcome === "confirmed"
      ? (p.services?.kind === "donation"
        ? `Hello ${firstName(p.payer_name)}, we have received your donation of ${money(p.amount, p.currency)} (${p.reference}). Thank you for supporting ${D.organization.fullName}.`
        : `Hello ${firstName(p.payer_name)}, your payment ${p.reference} for ${label} is confirmed and now active. Thank you for joining ${ORG}. You can follow it in your account at ${SITE}account.html.`) + `\n\n— ${ORG} Secretariat`
      : `Hello ${firstName(p.payer_name)}, we could not match your payment ${p.reference} (transaction ${p.transaction_id}) to our records. Please reply with a screenshot of your payment message or bank slip so we can check again.\n\n— ${ORG} Secretariat`;
    if (!waNumber(p.phone) && !isEmail(p.email)) return "";
    return `
      <h3 class="sub-head" style="margin-top:1.2rem">Let the payer know</h3>
      <div class="message-body">${esc(text)}</div>
      <div class="btn-row">
        ${waNumber(p.phone) ? `<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="${waHref(p.phone, text)}">Send on WhatsApp</a>` : ""}
        ${isEmail(p.email) ? `<a class="btn btn-outline btn-sm" href="${mailHref(p.email, `${ORG} payment ${p.reference}`, text)}">Send by email</a>` : ""}
      </div>`;
  }

  /* ---------- serials ---------- */
  let serialFilter = "all", serialQuery = "";
  async function serials() {
    let q = db.from("book_serials").select("*, payments(reference, payer_name, phone, email)").order("created_at", { ascending: false }).limit(1000);
    if (serialFilter === "unsent") q = q.eq("status", "issued").is("issued_at", null);
    else if (serialFilter !== "all") q = q.eq("status", serialFilter);
    const { data, error } = await q;
    if (error) throw error;
    const term = serialQuery.toLowerCase();
    const rows = data.filter((s) => !term || [s.code, s.issued_to, s.issued_contact, s.batch].some((x) => String(x || "").toLowerCase().includes(term)));
    $("#view").innerHTML = `
      <div class="panel-grid">
        <section class="panel">
          <h2>Generate serials for printed copies</h2>
          <p class="small muted">For books sold in person: print each code inside a copy. Buyers redeem it in their account exactly like an online purchase.</p>
          <form class="form form-light" id="batch-form" novalidate>
            <div class="form-grid">
              <label>How many<input name="count" type="number" min="1" max="500" value="20" required></label>
              <label>Batch label<input name="label" placeholder="e.g. Seeta HS order, Jan 2027"></label>
            </div>
            <button type="submit" class="btn btn-primary btn-sm">Generate serials</button>
            <p class="form-msg" role="status"></p>
          </form>
          <div id="batch-result"></div>
        </section>
        <section class="panel">
          <h2>At a glance</h2>
          <div class="bars-list">${["issued", "available", "redeemed", "revoked"].map((st) => `<div class="row"><div>${STATUS[st]}</div><strong>${data.filter((s) => s.status === st).length}</strong></div>`).join("")}</div>
        </section>
      </div>
      <div class="toolbar">
        <div class="seg" role="group">${[["all", "All"], ["unsent", "Not sent"], ["issued", "Issued"], ["available", "Printed"], ["redeemed", "Redeemed"], ["revoked", "Revoked"]].map(([f, l]) => `<button type="button" data-serial-filter="${f}" aria-pressed="${serialFilter === f}">${l}</button>`).join("")}</div>
        <input class="search" type="search" placeholder="Search code, buyer, batch…" value="${esc(serialQuery)}" data-serial-search>
      </div>
      <section class="panel">
        ${rows.length ? `<div class="table-wrap"><table class="data">
          <thead><tr><th>Serial</th><th>Status</th><th>Issued to</th><th>Sent</th><th>Redeemed</th><th></th></tr></thead>
          <tbody>${rows.map((s) => `<tr>
            <td class="mono"><strong>${esc(s.code)}</strong><small>${esc(s.batch)}</small></td>
            <td>${chip(s.status)}</td>
            <td>${esc(s.issued_to || "—")}<small>${esc(s.issued_contact || "")}${s.payments ? ` · ${esc(s.payments.reference)}` : ""}</small></td>
            <td>${s.issued_at ? `${esc(s.issued_via)}<small>${fmtDate(s.issued_at)}</small>` : "—"}</td>
            <td>${s.redeemed_at ? fmtDate(s.redeemed_at) : "—"}</td>
            <td><div class="btn-row">
              <button type="button" class="copy-btn" data-copy-text="${esc(s.code)}">Copy</button>
              ${s.payment_id && s.status === "issued" ? `<button type="button" class="copy-btn" data-payment="${s.payment_id}">Send</button>` : ""}
              ${role === "admin" && s.status !== "revoked" ? `<button type="button" class="copy-btn" data-revoke="${esc(s.code)}">Revoke</button>` : ""}
            </div></td></tr>`).join("")}</tbody></table></div>`
        : `<p class="empty">No serials here yet.</p>`}
      </section>`;

    $("#batch-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, msg = $(".form-msg", f);
      msg.textContent = "Generating…";
      try {
        const codes = await call("generate_serial_batch", { p_count: +f.count.value, p_label: f.label.value });
        msg.textContent = `${codes.length} serials created.`;
        const csv = "serial,batch\n" + codes.map((c) => `${c},"${(f.label.value || "printed").replace(/"/g, '""')}"`).join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        $("#batch-result").innerHTML = `
          <div class="btn-row" style="margin-top:.8rem"><a class="btn btn-outline btn-sm" href="${url}" download="cdsu-serials-${new Date().toISOString().slice(0, 10)}.csv">Download CSV for printing</a>
          <button type="button" class="btn btn-outline btn-sm" data-copy-text="${esc(codes.join("\n"))}">Copy all</button></div>
          <p class="mono small" style="margin-top:.8rem">${codes.map(esc).join("<br>")}</p>`;
      } catch (err) { msg.textContent = window.CDSU_ERR(err); }
    });
  }

  /* ---------- messages ---------- */
  let msgFilter = "open";
  async function messages() {
    let q = db.from("messages").select("*").order("created_at", { ascending: false }).limit(500);
    if (msgFilter === "open") q = q.in("status", ["new", "read"]);
    else if (msgFilter !== "all") q = q.eq("status", msgFilter);
    const { data, error } = await q;
    if (error) throw error;
    $("#view").innerHTML = `
      <div class="toolbar"><div class="seg" role="group">${[["open", "To answer"], ["replied", "Replied"], ["archived", "Archived"], ["all", "All"]].map(([f, l]) => `<button type="button" data-msg-filter="${f}" aria-pressed="${msgFilter === f}">${l}</button>`).join("")}</div></div>
      <section class="panel">
        ${data.length ? `<div class="table-wrap"><table class="data">
          <thead><tr><th>From</th><th>Topic</th><th>Message</th><th>Received</th><th>Status</th></tr></thead>
          <tbody>${data.map((m) => `<tr class="clickable" data-message="${m.id}">
            <td><strong>${esc(m.name)}</strong><small>${esc(m.contact)}</small></td>
            <td>${esc(m.topic)}</td>
            <td>${esc(m.body.length > 90 ? m.body.slice(0, 90) + "…" : m.body)}</td>
            <td>${fmtDate(m.created_at, true)}</td>
            <td>${chip(m.status)}</td></tr>`).join("")}</tbody></table></div>`
        : `<p class="empty">No messages here.</p>`}
      </section>`;
  }

  async function openMessage(id) {
    const { data: m, error } = await db.from("messages").select("*").eq("id", id).single();
    if (error) return toast(window.CDSU_ERR(error));
    if (m.status === "new") { await call("set_message_status", { p_id: id, p_status: "read" }).catch(() => {}); refreshBadges(); }
    const reply = `Hello ${firstName(m.name)}, thank you for contacting ${ORG} about "${m.topic}".\n\n\n— ${ORG} Secretariat`;
    openDrawer(`
      <h2>${esc(m.name)}</h2>
      <p class="muted small">${esc(m.topic)} · ${fmtDate(m.created_at, true)}</p>
      <dl class="kv-list"><dt>Contact</dt><dd>${esc(m.contact)}</dd></dl>
      <div class="message-body">${esc(m.body)}</div>
      <div class="btn-row">
        ${waNumber(m.contact) ? `<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="${waHref(m.contact, reply)}" data-msg-replied="${m.id}">Reply on WhatsApp</a>` : ""}
        ${isEmail(m.contact) ? `<a class="btn btn-outline btn-sm" href="${mailHref(m.contact, `Re: ${m.topic}`, reply)}" data-msg-replied="${m.id}">Reply by email</a>` : ""}
      </div>
      <div class="btn-row" style="margin-top:1rem">
        <button type="button" class="copy-btn" data-msg-status="replied" data-id="${m.id}">Mark as replied</button>
        <button type="button" class="copy-btn" data-msg-status="archived" data-id="${m.id}">Archive</button>
        <button type="button" class="copy-btn" data-msg-status="new" data-id="${m.id}">Mark unread</button>
      </div>`);
    if (view === "messages") messages();
  }

  /* ---------- members ---------- */
  let memberQuery = "";
  async function members() {
    const data = await call("list_members");
    const term = memberQuery.toLowerCase();
    const rows = data.filter((m) => !term || [m.full_name, m.email, m.phone, m.institution].some((x) => String(x || "").toLowerCase().includes(term)));
    $("#view").innerHTML = `
      <div class="toolbar"><input class="search" type="search" placeholder="Search name, email, phone, school…" value="${esc(memberQuery)}" data-member-search><span class="muted small">${data.length} account${data.length === 1 ? "" : "s"}</span></div>
      <section class="panel">
        ${rows.length ? `<div class="table-wrap"><table class="data">
          <thead><tr><th>Name</th><th>Contact</th><th>Category</th><th>School / organisation</th><th>Joined</th><th>Book</th><th>Active</th></tr></thead>
          <tbody>${rows.map((m) => `<tr>
            <td><strong>${esc(m.full_name || "—")}</strong></td>
            <td>${esc(m.email)}<small>${esc(m.phone || "")}</small></td>
            <td>${esc(m.category)}</td>
            <td>${esc(m.institution || "—")}</td>
            <td>${fmtDate(m.created_at)}</td>
            <td>${m.has_book ? chip("redeemed") : "—"}</td>
            <td>${m.active_enrolments || "—"}</td></tr>`).join("")}</tbody></table></div>`
        : `<p class="empty">No members yet.</p>`}
      </section>`;
  }

  /* ---------- online book ---------- */
  async function book() {
    const { data: meta } = await db.from("book_meta").select("*").single();
    $("#view").innerHTML = `
      <div class="panel-grid">
        <section class="panel">
          <h2>Upload the book</h2>
          <p class="small muted">Choose the book's PDF. Your browser turns each page into an image and uploads the pages to private storage; the PDF itself is never uploaded or stored. Keep this tab open until it finishes. Uploading again replaces the current pages.</p>
          <div class="upload-box">
            <strong>Career Development: A Path to Wealth (PDF)</strong>
            <input type="file" id="pdf-file" accept="application/pdf">
          </div>
          <div id="upload-progress" hidden>
            <div class="progress-lg"><span></span></div>
            <p class="small muted" id="upload-status"></p>
          </div>
        </section>
        <section class="panel">
          <h2>Current online edition</h2>
          <dl class="kv-list">
            <dt>Title</dt><dd>${esc(meta.title)}</dd>
            <dt>Pages online</dt><dd><strong>${meta.total_pages || "None yet"}</strong></dd>
            <dt>Last updated</dt><dd>${meta.total_pages ? fmtDate(meta.updated_at, true) : "—"}</dd>
          </dl>
          ${meta.total_pages ? `<form class="form form-light" id="preview-form" novalidate><div class="form-grid"><label>Preview page<input name="page" type="number" min="1" max="${meta.total_pages}" value="1"></label></div><button type="submit" class="btn btn-outline btn-sm">Show page</button></form><div id="preview" style="margin-top:1rem"></div>` : `<p class="small muted">Readers who unlock the book see "being prepared" until pages are uploaded.</p>`}
        </section>
      </div>`;
    $("#pdf-file").addEventListener("change", (e) => e.target.files[0] && uploadBook(e.target.files[0]));
    $("#preview-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const n = String(e.target.page.value).padStart(4, "0");
      const { data, error } = await db.storage.from("book").createSignedUrl(`pages/${n}.${meta.page_format}`, 60);
      $("#preview").innerHTML = error ? `<p class="small">${esc(window.CDSU_ERR(error))}</p>` : `<img src="${data.signedUrl}" alt="Page preview" style="max-width:100%;border:1px solid var(--line);border-radius:6px">`;
    });
  }

  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      s.onerror = () => reject(new Error("Could not load the PDF tools. Check your connection."));
      document.head.appendChild(s);
    });
  }

  async function uploadBook(file) {
    if (!confirm(`Upload "${file.name}" as the online edition? This replaces any pages already online.`)) return;
    const box = $("#upload-progress"), bar = $("span", box), status = $("#upload-status");
    box.hidden = false;
    $("#pdf-file").disabled = true;
    try {
      const pdfjs = await loadPdfJs();
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const total = pdf.numPages;
      for (let n = 1; n <= total; n++) {
        status.textContent = `Preparing and uploading page ${n} of ${total}…`;
        const pg = await pdf.getPage(n);
        const base = pg.getViewport({ scale: 1 });
        const vp = pg.getViewport({ scale: 1500 / base.width });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(vp.width);
        canvas.height = Math.round(vp.height);
        await pg.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
        const blob = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.82));
        const { error } = await db.storage.from("book").upload(`pages/${String(n).padStart(4, "0")}.webp`, blob, { upsert: true, contentType: "image/webp", cacheControl: "60" });
        if (error) throw error;
        bar.style.width = `${(n / total) * 100}%`;
        pg.cleanup();
      }
      await call("set_book_pages", { p_total: total, p_format: "webp" });
      status.textContent = `Done — ${total} pages are online.`;
      toast("The online book is updated.");
      setTimeout(book, 1200);
    } catch (err) {
      status.textContent = window.CDSU_ERR(err);
      $("#pdf-file").disabled = false;
    }
  }

  /* ---------- staff (administrators) ---------- */
  async function staff() {
    const data = await call("list_staff");
    $("#view").innerHTML = `
      <div class="panel-grid">
        <section class="panel">
          <h2>Current staff</h2>
          <div class="table-wrap"><table class="data"><thead><tr><th>Name</th><th>Role</th><th></th></tr></thead><tbody>
          ${data.map((s) => `<tr><td><strong>${esc(s.full_name || s.email)}</strong><small>${esc(s.email)}</small></td>
            <td>${s.role === "admin" ? "Administrator" : "Secretariat"}</td>
            <td>${s.user_id === me.id ? `<span class="muted small">You</span>` : `<button type="button" class="copy-btn" data-staff-remove="${esc(s.email)}">Remove</button>`}</td></tr>`).join("")}
          </tbody></table></div>
        </section>
        <section class="panel">
          <h2>Add or change staff</h2>
          <p class="small muted">The person first creates a normal account on the website (My Account), then you add their email here.</p>
          <form class="form form-light" id="staff-form" novalidate>
            <label>Email<input name="email" type="email" required></label>
            <label>Role<select name="role"><option value="secretariat">Secretariat — confirm payments, send serials, answer messages</option><option value="admin">Administrator — everything, including staff and activity</option></select></label>
            <button type="submit" class="btn btn-primary btn-sm">Save</button>
            <p class="form-msg" role="status"></p>
          </form>
        </section>
      </div>`;
    $("#staff-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target, msg = $(".form-msg", f);
      try { await call("set_staff_role", { p_email: f.email.value, p_role: f.role.value }); toast("Staff updated."); staff(); }
      catch (err) { msg.textContent = window.CDSU_ERR(err); }
    });
  }

  /* ---------- activity log (administrators) ---------- */
  async function activity() {
    const [{ data, error }, people] = await Promise.all([
      db.from("audit_log").select("*").order("created_at", { ascending: false }).limit(300),
      call("list_staff").catch(() => [])
    ]);
    if (error) throw error;
    const who = Object.fromEntries(people.map((p) => [p.user_id, p.full_name || p.email]));
    const describe = (a) => ({
      "payment.confirmed": `Confirmed payment ${a.entity_id}${a.details?.serials?.length ? ` and issued ${a.details.serials.length} serial(s)` : ""}`,
      "payment.rejected": `Rejected payment ${a.entity_id}`,
      "serial.sent": `Sent serial ${a.entity_id} by ${a.details?.via}`,
      "serial.batch": `Generated ${a.details?.count} serials${a.details?.label ? ` (${a.details.label})` : ""}`,
      "serial.revoked": `Revoked serial ${a.entity_id}`,
      "staff.role": `Set ${a.entity_id} as ${a.details?.role}`,
      "book.pages": `Uploaded the online book (${a.details?.pages} pages)`
    }[a.action] || `${a.action} ${a.entity_id || ""}`);
    $("#view").innerHTML = `<section class="panel">${data.length ? `<div class="table-wrap"><table class="data">
      <thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead>
      <tbody>${data.map((a) => `<tr><td>${fmtDate(a.created_at, true)}</td><td>${esc(who[a.actor] || "Former staff")}</td><td>${esc(describe(a))}</td></tr>`).join("")}</tbody></table></div>`
      : `<p class="empty">No activity yet.</p>`}</section>`;
  }

  /* ---------- shared clicks ---------- */
  document.addEventListener("click", async (e) => {
    const el = (s) => e.target.closest(s);
    if (el("[data-payment]")) return openPayment(el("[data-payment]").dataset.payment);
    if (el("[data-message]")) return openMessage(el("[data-message]").dataset.message);
    if (el("[data-pay-filter]")) { payFilter = el("[data-pay-filter]").dataset.payFilter; return payments(); }
    if (el("[data-serial-filter]")) { serialFilter = el("[data-serial-filter]").dataset.serialFilter; return serials(); }
    if (el("[data-msg-filter]")) { msgFilter = el("[data-msg-filter]").dataset.msgFilter; return messages(); }
    if (el("[data-copy-text]")) {
      const text = el("[data-copy-text]").dataset.copyText;
      navigator.clipboard?.writeText(text).then(() => toast("Copied."), () => toast(text));
      return;
    }
    if (el("[data-sent]")) {
      // the link opens WhatsApp or email; record that the serial went out
      const s = el("[data-sent]");
      call("mark_serial_sent", { p_code: s.dataset.sent, p_via: s.dataset.via }).then(() => { refreshBadges(); toast("Marked as sent."); }).catch((err) => toast(window.CDSU_ERR(err)));
      return;
    }
    if (el("[data-msg-replied]")) { call("set_message_status", { p_id: el("[data-msg-replied]").dataset.msgReplied, p_status: "replied" }).then(() => view === "messages" && messages()); return; }
    if (el("[data-msg-status]")) {
      const b = el("[data-msg-status]");
      await call("set_message_status", { p_id: b.dataset.id, p_status: b.dataset.msgStatus }).catch((err) => toast(window.CDSU_ERR(err)));
      closeDrawer(); refreshBadges(); if (view === "messages") messages();
      return;
    }
    if (el("[data-revoke]")) {
      const code = el("[data-revoke]").dataset.revoke;
      const reason = prompt(`Revoke ${code}? Whoever unlocked the book with it loses access. Reason:`);
      if (reason === null) return;
      try { await call("revoke_serial", { p_code: code, p_reason: reason }); toast("Serial revoked."); serials(); } catch (err) { toast(window.CDSU_ERR(err)); }
      return;
    }
    if (el("[data-staff-remove]")) {
      const email = el("[data-staff-remove]").dataset.staffRemove;
      if (!confirm(`Remove ${email} from staff? Their account stays, but they lose portal access.`)) return;
      try { await call("set_staff_role", { p_email: email, p_role: "none" }); toast("Removed."); staff(); } catch (err) { toast(window.CDSU_ERR(err)); }
    }
  });
  let searchTimer;
  document.addEventListener("input", (e) => {
    const t = e.target;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      if (t.matches("[data-pay-search]")) { payQuery = t.value; payments().then(() => { const s = $("[data-pay-search]"); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }); }
      if (t.matches("[data-serial-search]")) { serialQuery = t.value; serials().then(() => { const s = $("[data-serial-search]"); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }); }
      if (t.matches("[data-member-search]")) { memberQuery = t.value; members().then(() => { const s = $("[data-member-search]"); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }); }
    }, 300);
  });

  db?.auth.onAuthStateChange((event) => { if (event === "SIGNED_OUT" && app.querySelector(".admin-shell")) renderLogin("Your session ended. Please sign in again."); });
  boot();
})();
