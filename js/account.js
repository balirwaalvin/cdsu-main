/* CDSU member account: sign in / sign up, payments, memberships, profile and the online book. */
(function () {
  "use strict";
  const db = window.CDSU_DB;
  const root = document.getElementById("account-app");
  if (!root) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
  const money = (n, cur) => `${cur || "UGX"} ${Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: cur === "USD" ? 2 : 0 })}`;
  const params = new URLSearchParams(location.search);
  const CATEGORIES = { student: "Student", adult: "Adult / parent", teacher: "Teacher / counsellor", institution: "Institution representative", other: "Other" };
  const STATUS = { pending: "Awaiting confirmation", confirmed: "Confirmed", rejected: "Not confirmed", active: "Active", expired: "Expired", cancelled: "Cancelled" };
  const chip = (s) => `<span class="chip-status is-${esc(s)}">${esc(STATUS[s] || s)}</span>`;

  if (!db) {
    root.innerHTML = `<div class="acct-card"><p>Accounts are unavailable right now because the site couldn't load its secure connection. Please refresh the page or try again later.</p></div>`;
    return;
  }

  /* ---------- signed out: sign in, create account, reset password ---------- */
  function renderAuth(mode = "signin", note = "") {
    const email = params.get("email") || "";
    root.innerHTML = `
      <div class="auth-wrap">
        <div class="acct-card auth-card">
          <div class="auth-tabs" role="tablist">
            <button type="button" role="tab" data-mode="signin" aria-selected="${mode === "signin"}">Sign in</button>
            <button type="button" role="tab" data-mode="signup" aria-selected="${mode === "signup"}">Create account</button>
          </div>
          ${note ? `<p class="auth-note">${note}</p>` : ""}
          ${mode === "signin" ? `
          <form class="form form-light" data-form="signin" novalidate>
            <label>Email<input name="email" type="email" required autocomplete="email" value="${esc(email)}"></label>
            <label>Password<input name="password" type="password" required autocomplete="current-password"></label>
            <button type="submit" class="btn btn-primary">Sign in</button>
            <button type="button" class="link-btn" data-mode="reset">Forgot your password?</button>
            <p class="form-msg" role="status"></p>
          </form>` : mode === "signup" ? `
          <form class="form form-light" data-form="signup" novalidate>
            <div class="form-grid">
              <label>Full name<input name="full_name" required autocomplete="name"></label>
              <label>I am a<select name="category">${Object.entries(CATEGORIES).map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></label>
              <label>Phone (WhatsApp)<input name="phone" type="tel" autocomplete="tel" placeholder="+256 7XX XXX XXX"></label>
              <label>School / organisation<input name="institution" autocomplete="organization"></label>
              <label>Email<input name="email" type="email" required autocomplete="email" value="${esc(email)}"></label>
              <label>Password<input name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="At least 8 characters"></label>
            </div>
            <label class="check"><input type="checkbox" name="agree" required> I agree to the <a href="terms.html" target="_blank" rel="noopener">Terms &amp; Conditions</a>, including how CDSU uses my personal information.</label>
            <button type="submit" class="btn btn-primary">Create my account</button>
            <p class="small muted">Use the same email you gave when confirming a payment, so your payments appear here.</p>
            <p class="form-msg" role="status"></p>
          </form>` : `
          <form class="form form-light" data-form="reset" novalidate>
            <p class="small muted">Enter your account email and we'll send you a link to choose a new password.</p>
            <label>Email<input name="email" type="email" required autocomplete="email" value="${esc(email)}"></label>
            <button type="submit" class="btn btn-primary">Send reset link</button>
            <button type="button" class="link-btn" data-mode="signin">Back to sign in</button>
            <p class="form-msg" role="status"></p>
          </form>`}
        </div>
        <aside class="auth-aside">
          <h3>Your CDSU account</h3>
          <ul>
            <li><strong>Read the book online</strong> with your serial number, on any device, from the page you stopped at.</li>
            <li><strong>Follow your payments</strong> from "awaiting confirmation" to confirmed.</li>
            <li><strong>See your memberships</strong>, training and seminar registrations in one place.</li>
          </ul>
        </aside>
      </div>`;
  }

  root.addEventListener("click", (e) => {
    const t = e.target.closest("[data-mode]");
    if (t && !root.querySelector(".acct-dash")) renderAuth(t.dataset.mode);
  });

  root.addEventListener("submit", async (e) => {
    const form = e.target.closest("form[data-form]");
    if (!form) return;
    e.preventDefault();
    const kind = form.dataset.form;
    const msg = $(".form-msg", form);
    const v = Object.fromEntries(new FormData(form));
    const required = $$("[required]", form).filter((el) => (el.type === "checkbox" ? !el.checked : !el.value.trim()));
    $$("input", form).forEach((el) => el.classList.toggle("invalid", required.includes(el)));
    if (required.length) { msg.textContent = "Please complete the highlighted fields."; return; }
    const btn = $("button[type=submit]", form);
    btn.disabled = true;
    msg.textContent = "Please wait…";
    try {
      if (kind === "signin") {
        const { error } = await db.auth.signInWithPassword({ email: v.email.trim(), password: v.password });
        if (error) throw error;
      } else if (kind === "signup") {
        if (v.password.length < 8) throw new Error("Password should be at least 8 characters");
        const { data, error } = await db.auth.signUp({
          email: v.email.trim(),
          password: v.password,
          options: {
            emailRedirectTo: location.origin + location.pathname,
            data: { full_name: v.full_name.trim(), category: v.category, phone: v.phone.trim(), institution: v.institution.trim() }
          }
        });
        if (error) throw error;
        if (!data.session) renderAuth("signin", "Account created. We've sent a confirmation link to <strong>" + esc(v.email) + "</strong> — open it, then sign in here.");
      } else if (kind === "reset") {
        const { error } = await db.auth.resetPasswordForEmail(v.email.trim(), { redirectTo: location.origin + location.pathname });
        if (error) throw error;
        msg.textContent = "If an account uses that email, a reset link is on its way. Check your inbox.";
      } else if (kind === "newpass") {
        if (v.password.length < 8) throw new Error("Password should be at least 8 characters");
        const { error } = await db.auth.updateUser({ password: v.password });
        if (error) throw error;
        history.replaceState(null, "", location.pathname);
        load();
      } else if (kind === "redeem") {
        const { error } = await db.rpc("redeem_serial", { p_code: v.serial });
        if (error) throw error;
        load("book");
      } else if (kind === "profile") {
        const { data: s } = await db.auth.getSession();
        const { error } = await db.from("profiles").update({
          full_name: v.full_name.trim(), phone: v.phone.trim() || null, institution: v.institution.trim() || null, category: v.category, updated_at: new Date().toISOString()
        }).eq("id", s.session.user.id);
        if (error) throw error;
        msg.textContent = "Saved.";
      }
    } catch (err) {
      msg.textContent = window.CDSU_ERR(err);
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------- signed in: the member dashboard ---------- */
  async function load(focus) {
    const { data: { session } } = await db.auth.getSession();
    if (!session) {
      renderAuth(location.hash === "#signup" ? "signup" : "signin");
      return;
    }
    root.innerHTML = `<div class="acct-card"><p class="muted">Loading your account…</p></div>`;
    await db.rpc("claim_my_records");
    const uid = session.user.id;
    const [profile, payments, enrolments, access, progress, meta, role] = await Promise.all([
      db.from("profiles").select("*").eq("id", uid).maybeSingle(),
      db.from("payments").select("reference, service_code, quantity, amount, currency, method, status, created_at, services(label)").order("created_at", { ascending: false }),
      db.from("enrolments").select("status, starts_on, expires_on, quantity, services(label, kind)").order("created_at", { ascending: false }),
      db.from("book_access").select("serial_code, granted_at, revoked_at").maybeSingle(),
      db.from("reading_progress").select("page, updated_at").maybeSingle(),
      db.from("book_meta").select("title, total_pages").maybeSingle(),
      db.rpc("my_role")
    ]);
    const p = profile.data || {};
    const hasBook = access.data && !access.data.revoked_at;
    const page = progress.data?.page || 1;
    const total = meta.data?.total_pages || 0;
    const pct = total ? Math.min(100, Math.round((page / total) * 100)) : 0;
    const isStaff = role.data === "admin" || role.data === "secretariat";

    root.innerHTML = `
      <div class="acct-dash">
        <div class="acct-head">
          <div>
            <span class="pill">${esc(CATEGORIES[p.category] || "Member")}</span>
            <h2>Welcome, ${esc((p.full_name || session.user.email).split(" ")[0])}</h2>
            <p class="muted">${esc(session.user.email)}</p>
          </div>
          <div class="acct-head-actions">
            ${isStaff ? `<a class="btn btn-primary btn-sm" href="admin/">Open admin portal</a>` : ""}
            <button type="button" class="btn btn-outline btn-sm" data-signout>Sign out</button>
          </div>
        </div>

        <div class="acct-grid">
          <section class="acct-card acct-book" id="book">
            <h3>My book</h3>
            ${hasBook ? `
              <div class="book-row">
                <img src="assets/images/book_3d.png" alt="" width="84">
                <div>
                  <strong>${esc(meta.data?.title || "Career Development: A Path to Wealth")}</strong>
                  <p class="small muted">Serial ${esc(access.data.serial_code)} · unlocked ${fmtDate(access.data.granted_at)}</p>
                  ${total ? `<div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div>
                  <p class="small muted">Page ${page} of ${total} · ${pct}% read</p>` : `<p class="small muted">The online edition is being prepared. You'll be able to read it here very soon.</p>`}
                </div>
              </div>
              ${total ? `<a class="btn btn-primary btn-go" href="reader.html">${page > 1 ? `Continue from page ${page}` : "Start reading"}</a>` : ""}`
            : `
              <p class="muted small">Enter the serial number you received after your payment was confirmed, or the one printed in your copy.</p>
              <form class="form form-light" data-form="redeem" novalidate>
                <label>Book serial number<input name="serial" required autocomplete="off" placeholder="CDSU-XXXX-XXXX-XXXX" class="serial-input"></label>
                <button type="submit" class="btn btn-primary">Unlock the book</button>
                <p class="form-msg" role="status"></p>
              </form>
              <p class="small muted">No serial yet? <button type="button" class="link-btn" data-buy="tier-book">Buy the book — UGX 50,000</button></p>`}
          </section>

          <section class="acct-card">
            <h3>Memberships &amp; registrations</h3>
            ${enrolments.data?.length ? `<ul class="acct-list">${enrolments.data.map((e) => `
              <li><div><strong>${esc(e.services?.label || "")}</strong><small>Since ${fmtDate(e.starts_on)}${e.expires_on ? ` · until ${fmtDate(e.expires_on)}` : ""}${e.quantity > 1 ? ` · ${e.quantity} places` : ""}</small></div>${chip(e.status)}</li>`).join("")}</ul>`
            : `<p class="muted small">Nothing yet. When we confirm a membership, training or seminar payment, it appears here.</p>
               <a class="btn btn-outline btn-sm" href="join.html#tiers-section">See membership options</a>`}
          </section>

          <section class="acct-card acct-wide">
            <h3>My payments</h3>
            ${payments.data?.length ? `<div class="table-wrap"><table class="acct-table">
              <thead><tr><th>Reference</th><th>For</th><th>Amount</th><th>Paid with</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>${payments.data.map((x) => `<tr>
                <td><strong>${esc(x.reference)}</strong></td>
                <td>${esc(x.services?.label || x.service_code)}${x.quantity > 1 ? ` × ${x.quantity}` : ""}</td>
                <td>${money(x.amount, x.currency)}</td>
                <td>${esc(window.CDSU_METHODS[x.method] || x.method)}</td>
                <td>${fmtDate(x.created_at)}</td>
                <td>${chip(x.status)}</td></tr>`).join("")}</tbody></table></div>`
            : `<p class="muted small">Payments you confirm on this site appear here. Payments confirmed while signed out appear once your email address is confirmed.</p>`}
          </section>

          <section class="acct-card acct-wide">
            <h3>My details</h3>
            <form class="form form-light" data-form="profile" novalidate>
              <div class="form-grid">
                <label>Full name<input name="full_name" required value="${esc(p.full_name)}"></label>
                <label>I am a<select name="category">${Object.entries(CATEGORIES).map(([v, l]) => `<option value="${v}" ${p.category === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
                <label>Phone (WhatsApp)<input name="phone" type="tel" value="${esc(p.phone || "")}"></label>
                <label>School / organisation<input name="institution" value="${esc(p.institution || "")}"></label>
              </div>
              <button type="submit" class="btn btn-outline btn-sm">Save changes</button>
              <p class="form-msg" role="status"></p>
            </form>
          </section>
        </div>
      </div>`;
    if (focus === "book" || location.hash === "#book") $("#book")?.scrollIntoView({ block: "start" });
  }

  root.addEventListener("click", async (e) => {
    if (e.target.closest("[data-signout]")) {
      await db.auth.signOut();
      renderAuth("signin");
    }
    const buy = e.target.closest("[data-buy]");
    if (buy) {
      // reuse the site-wide payment pop-up
      const opener = document.createElement("button");
      opener.dataset.openPay = buy.dataset.buy;
      opener.hidden = true;
      document.body.appendChild(opener);
      opener.click();
      opener.remove();
    }
  });

  db.auth.onAuthStateChange((event) => {
    if (event === "PASSWORD_RECOVERY") {
      root.innerHTML = `
        <div class="auth-wrap"><div class="acct-card auth-card">
          <h3>Choose a new password</h3>
          <form class="form form-light" data-form="newpass" novalidate>
            <label>New password<input name="password" type="password" required minlength="8" autocomplete="new-password"></label>
            <button type="submit" class="btn btn-primary">Save new password</button>
            <p class="form-msg" role="status"></p>
          </form>
        </div></div>`;
    } else if (event === "SIGNED_IN" && !root.querySelector(".acct-dash") && !root.querySelector('[data-form="newpass"]')) {
      load();
    }
  });

  load();
})();
