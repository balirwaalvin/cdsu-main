/* CDSU Mail — webmail for ed@, info@ and support@cdsu.online.
   Reading, filing and drafts go straight to the database, where row-level security keeps each mailbox private
   to its own sign-in. Sending goes through the mail-send Edge Function; new mail arrives through the
   mail-inbound webhook and shows up here live. The composer lives in mail-compose.js. */
(function () {
  "use strict";
  const db = window.CDSU_DB;
  const app = document.getElementById("mail-app");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ERR = (e) => window.CDSU_ERR(e);
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* private mode */ } }
  };

  const MAILBOXES = [
    { address: "ed@cdsu.online", label: "Executive Director" },
    { address: "info@cdsu.online", label: "Information" },
    { address: "support@cdsu.online", label: "Support" }
  ];
  const FOLDERS = {
    inbox: { title: "Inbox", icon: "inbox", empty: ["Your inbox is empty", "New mail appears here as soon as it arrives."] },
    starred: { title: "Starred", icon: "star", empty: ["Nothing starred", "Star a message to keep it close at hand."] },
    sent: { title: "Sent", icon: "send", empty: ["Nothing sent yet", "Mail you send from this mailbox is kept here."] },
    drafts: { title: "Drafts", icon: "file", empty: ["No drafts", "Unsent messages are saved here automatically."] },
    archive: { title: "Archive", icon: "archive", empty: ["Archive is empty", "Archive mail to clear your inbox without removing it."] },
    spam: { title: "Spam", icon: "alert", empty: ["No spam", "Mail that fails the sender's security checks lands here."] },
    trash: { title: "Trash", icon: "trash", empty: ["Trash is empty", "Messages you remove wait here until you empty Trash."] }
  };
  const ICONS = {
    inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    archive: '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    reply: '<polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
    replyAll: '<polyline points="7 17 2 12 7 7"/><polyline points="12 17 7 12 12 7"/><path d="M22 18v-2a4 4 0 0 0-4-4H7"/>',
    forward: '<polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    clip: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    restore: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    maximize: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .01-1 1.03V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>'
  };
  const svg = (k) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k]}</svg>`;

  const S = { user: null, box: null, folder: "inbox", list: [], limit: 50, hasMore: false, query: "", openId: null, current: null, thread: [], seq: 0, channel: null, poll: null };

  /* ---------- small helpers ---------- */
  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("show"), 3200);
  };
  const PALETTE = ["#0B1F54", "#1E4E91", "#2F6B5E", "#6B3FA0", "#9A4A1F", "#3D5A80", "#7A5B00", "#4F5A73"];
  const colorFor = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PALETTE[h % PALETTE.length]; };
  const initials = (name) => {
    const n = String(name || "?").replace(/@.*/, "").replace(/[^\p{L}\p{N}\s._-]/gu, " ").trim();
    const parts = n.split(/[\s._-]+/).filter(Boolean);
    return esc(((parts[0]?.[0] || "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase());
  };
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  const fmtShort = (d) => {
    const x = new Date(d), now = new Date();
    if (sameDay(x, now)) return x.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    if (x.getFullYear() === now.getFullYear()) return x.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return x.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  const fmtLong = (d) => new Date(d).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const fmtSize = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : n >= 1024 ? `${Math.round(n / 1024)} KB` : `${n || 0} B`);
  const typing = (el) => el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  const STATUS_TAG = {
    draft: ["Draft", "is-draft"], delivered: ["Delivered", "is-good"], delayed: ["Delayed", ""],
    bounced: ["Bounced", "is-bad"], failed: ["Not sent", "is-bad"], complained: ["Marked as spam", "is-bad"]
  };
  const statusTag = (m, full) => {
    const t = STATUS_TAG[m.status];
    if (!t || (!full && m.status === "delivered")) return "";
    return `<span class="tag ${t[1]}">${t[0]}</span> `;
  };

  // Everything the composer (mail-compose.js) needs from here
  const M = (window.CDSU_MAIL = { db, S, $, $$, esc, svg, toast, ERR, fmtLong, fmtSize, refresh: () => { refreshCounts(); loadList(); } });

  /* ---------- sign in ---------- */
  function renderLogin(note = "") {
    const last = store.get("cdsu-mail-last") || MAILBOXES[0].address;
    app.innerHTML = `
      <div class="mail-login">
        <div class="acct-card">
          <a class="mail-brand" href="../index.html"><img src="../assets/images/cdsu_emblem.png" alt=""><span><small>CDSU</small><strong>Mail</strong></span></a>
          ${note ? `<p class="auth-note">${note}</p>` : ""}
          <form class="form form-light" id="login-form" novalidate>
            <fieldset class="box-pick"><legend>Mailbox</legend>
              ${MAILBOXES.map((b) => `<label><input type="radio" name="box" value="${b.address}" ${b.address === last ? "checked" : ""}><span><strong>${esc(b.label)}</strong><span>${esc(b.address)}</span></span></label>`).join("")}
            </fieldset>
            <label>Password<input name="password" type="password" required autocomplete="current-password"></label>
            <button type="submit" class="btn btn-primary">Sign in</button>
            <p class="form-msg" role="status"></p>
          </form>
          <p class="small muted">Forgotten the password? A CDSU administrator can set a new one in the Admin Portal under Mailboxes.</p>
        </div>
      </div>`;
    const f = $("#login-form");
    f.password.focus();
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $(".form-msg", f), email = f.box.value;
      if (!f.password.value) { msg.textContent = "Enter the mailbox password."; return; }
      msg.textContent = "Signing in…";
      store.set("cdsu-mail-last", email);
      const { error } = await db.auth.signInWithPassword({ email, password: f.password.value });
      if (error) msg.textContent = ERR(error);
      else boot();
    });
  }

  async function boot() {
    if (!db) { app.innerHTML = `<p class="mail-loading">CDSU Mail couldn't load. Check your connection and reload the page.</p>`; return; }
    const { data: { session } } = await db.auth.getSession();
    if (!session) return renderLogin();
    S.user = session.user;
    const { data: box, error } = await db.from("mailboxes").select("id, address, display_name, signature, purpose").maybeSingle();
    if (error) return renderLogin(esc(ERR(error)));
    if (!box) {
      await db.auth.signOut();
      return renderLogin(`<strong>${esc(S.user.email)}</strong> isn't a CDSU mailbox. Sign in with ed@, info@ or support@cdsu.online.`);
    }
    S.box = box;
    renderShell();
    if (!location.hash) history.replaceState(null, "", "#inbox");
    route();
    refreshCounts();
    subscribe();
    clearInterval(S.poll);
    S.poll = setInterval(() => { if (document.visibilityState === "visible") { refreshCounts(); if (!S.query) loadList(); } }, 60000);
  }

  /* ---------- layout ---------- */
  function renderShell() {
    app.innerHTML = `
      <div class="mail-app" id="shell">
        <aside class="mail-side" id="side">
          <a class="mail-brand" href="../index.html" title="Open the CDSU website"><img src="../assets/images/cdsu_emblem.png" alt=""><span><small>CDSU</small><strong>Mail</strong></span></a>
          <button type="button" class="btn btn-primary compose-btn" data-compose>${svg("pen")} Compose</button>
          <nav class="folders" aria-label="Folders">
            ${Object.entries(FOLDERS).map(([k, f]) => `<a href="#${k}" data-folder="${k}">${svg(f.icon)}<span>${f.title}</span><span class="count" data-count="${k}"></span></a>`).join("")}
          </nav>
          <div class="side-me">
            <strong id="me-name">${esc(S.box.display_name)}</strong>${esc(S.box.address)}
            <div class="row">
              <button type="button" class="btn btn-outline-light btn-sm" data-settings>Settings</button>
              <button type="button" class="btn btn-outline-light btn-sm" data-signout>Sign out</button>
            </div>
          </div>
        </aside>
        <section class="list-pane" aria-label="Messages">
          <div class="list-head">
            <div class="top">
              <button type="button" class="icon-btn menu-btn" data-menu aria-label="Show folders">${svg("menu")}</button>
              <h1 id="folder-title">Inbox</h1>
              <button type="button" class="icon-btn" data-refresh aria-label="Refresh" title="Refresh">${svg("refresh")}</button>
            </div>
            <label class="mail-search">${svg("search")}<input type="search" id="search" placeholder="Search this folder" aria-label="Search this folder" autocomplete="off"></label>
            <div class="list-tools" id="list-tools"></div>
          </div>
          <ul class="msg-list" id="msg-list"></ul>
        </section>
        <section class="read-pane" id="read-pane" aria-label="Message" aria-live="polite"></section>
      </div>`;
    emptyReading();
  }

  function emptyReading() {
    $("#read-pane").innerHTML = `<div class="read-empty"><div><img src="../assets/images/cdsu_emblem.png" alt=""><p>Choose a message to read it.</p></div></div>`;
  }

  /* ---------- routing: #folder or #folder/message-id ---------- */
  function route() {
    if (!S.box) return;
    const [f, id] = location.hash.slice(1).split("/");
    const folder = FOLDERS[f] ? f : "inbox";
    if (folder !== S.folder || !S.list.length) {
      const changed = folder !== S.folder;
      S.folder = folder;
      if (changed) { S.limit = 50; S.query = ""; const s = $("#search"); if (s) s.value = ""; }
      $$(".folders a").forEach((a) => a.classList.toggle("active", a.dataset.folder === folder));
      $("#folder-title").textContent = FOLDERS[folder].title;
      $("#shell").classList.remove("side-open");
      loadList();
      setTitle();
    }
    if (id && id !== S.openId) openMessage(id);
    if (!id && S.openId) closeReading();
  }
  window.addEventListener("hashchange", route);
  const go = (folder, id) => { location.hash = id ? `${folder}/${id}` : folder; };

  function setTitle() {
    const n = S.counts?.inbox || 0;
    document.title = `${n ? `(${n}) ` : ""}${FOLDERS[S.folder].title} — ${S.box.address}`;
  }

  async function refreshCounts() {
    const { data } = await db.rpc("mail_counts");
    if (!data) return;
    S.counts = data;
    for (const k of ["inbox", "spam", "drafts"]) {
      const el = $(`[data-count="${k}"]`);
      if (!el) continue;
      el.textContent = data[k] ? data[k] : "";
      el.classList.toggle("is-unread", k === "inbox" && data[k] > 0);
    }
    setTitle();
  }

  /* ---------- message list ---------- */
  const LIST_COLS = "id, thread_id, direction, folder, status, from_address, from_name, to_addrs, subject, snippet, attachments, is_read, is_starred, sent_at";

  async function loadList() {
    const turn = ++S.seq;
    let q = db.from("mail_messages").select(LIST_COLS).order("sent_at", { ascending: false }).limit(S.limit + 1);
    if (S.folder === "starred") q = q.eq("is_starred", true).in("folder", ["inbox", "sent", "archive", "drafts"]);
    else q = q.eq("folder", S.folder);
    const term = S.query.replace(/[%*,()"\\]/g, " ").trim();
    if (term) q = q.or(["subject", "from_address", "from_name", "snippet", "body_text"].map((c) => `${c}.ilike.*${term}*`).join(","));
    const { data, error } = await q;
    if (turn !== S.seq) return; // a newer request has replaced this one
    const el = $("#msg-list");
    if (!el) return;
    if (error) { el.innerHTML = `<li class="list-empty">${esc(ERR(error))}</li>`; return; }
    S.hasMore = data.length > S.limit;
    S.list = data.slice(0, S.limit);
    renderTools();
    if (!S.list.length) {
      const [a, b] = term ? ["No matches", `Nothing in ${FOLDERS[S.folder].title} matches “${esc(term)}”.`] : FOLDERS[S.folder].empty;
      el.innerHTML = `<li class="list-empty"><strong>${a}</strong>${b}</li>`;
      return;
    }
    el.innerHTML = S.list.map(rowHtml).join("") +
      (S.hasMore ? `<li class="more-wrap"><button type="button" class="btn btn-outline btn-sm" data-more>Show older messages</button></li>` : "");
  }

  function rowHtml(m) {
    const out = m.direction === "out";
    const other = out ? (m.to_addrs[0] || "") : (m.from_name || m.from_address);
    const who = out ? `To: ${m.to_addrs.join(", ") || "(no recipient yet)"}` : other;
    const unread = !out && !m.is_read;
    return `<li class="msg-row${unread ? " unread" : ""}${m.id === S.openId ? " active" : ""}" data-open="${m.id}" tabindex="0">
      <span class="avatar" style="background:${colorFor(out ? other : m.from_address)}">${initials(other)}</span>
      <span class="who">${esc(who)}</span>
      <span class="when">${m.attachments?.length ? svg("clip") : ""}${m.is_starred ? `<span class="star-on">${svg("star")}</span>` : ""}${fmtShort(m.sent_at)}</span>
      <span class="line">${statusTag(m)}<b>${esc(m.subject || "(no subject)")}</b>${m.snippet ? ` — ${esc(m.snippet)}` : ""}</span>
    </li>`;
  }

  function renderTools() {
    const el = $("#list-tools");
    if (!el) return;
    const n = S.list.length;
    const label = `${n}${S.hasMore ? "+" : ""} message${n === 1 ? "" : "s"}`;
    let action = "";
    if (S.folder === "inbox" && S.list.some((m) => !m.is_read)) action = `<button type="button" class="text-btn" data-all-read>Mark all as read</button>`;
    if (S.folder === "trash" && n) action = `<button type="button" class="text-btn danger" data-empty-trash>Empty Trash</button>`;
    el.innerHTML = `<span>${n ? label : ""}</span>${action}`;
  }

  /* ---------- reading ---------- */
  async function openMessage(id) {
    S.openId = id;
    $$(".msg-row").forEach((r) => r.classList.toggle("active", r.dataset.open === id));
    const pane = $("#read-pane");
    pane.innerHTML = `<div class="read-empty"><p>Opening…</p></div>`;
    const { data: m, error } = await db.from("mail_messages").select("*").eq("id", id).maybeSingle();
    if (S.openId !== id) return;
    if (error || !m) { pane.innerHTML = `<div class="read-empty"><p>${error ? esc(ERR(error)) : "This message isn't available any more."}</p></div>`; return; }
    if (m.status === "draft") {
      go(S.folder);
      return M.compose ? M.compose({ draft: m }) : toast("The composer is still loading.");
    }
    let thread = [m];
    if (m.thread_id) {
      const r = await db.from("mail_messages").select("*").eq("thread_id", m.thread_id).neq("status", "draft").order("sent_at");
      if (r.data?.length) thread = r.data;
    }
    // Keep Trash and Spam apart from the rest of a conversation
    const bin = (x) => x.folder === "trash" || x.folder === "spam";
    thread = thread.filter((x) => x.id === m.id || bin(x) === bin(m));
    if (S.openId !== id) return;
    S.current = m;
    S.thread = thread;
    $("#shell").classList.add("reading");
    renderReading();

    const unread = thread.filter((x) => !x.is_read).map((x) => x.id);
    if (unread.length) {
      await db.from("mail_messages").update({ is_read: true }).in("id", unread);
      unread.forEach((u) => { const r = $(`.msg-row[data-open="${u}"]`); if (r) r.classList.remove("unread"); const l = S.list.find((x) => x.id === u); if (l) l.is_read = true; });
      refreshCounts();
      renderTools();
    }
  }

  function closeReading() {
    S.openId = null; S.current = null; S.thread = [];
    $("#shell")?.classList.remove("reading");
    $$(".msg-row.active").forEach((r) => r.classList.remove("active"));
    emptyReading();
  }

  function readBar(m) {
    const b = (attr, icon, label) => `<button type="button" class="icon-btn" ${attr} aria-label="${label}" title="${label}">${svg(icon)}</button>`;
    const inbound = m.direction === "in", f = m.folder;
    const parts = [`<button type="button" class="icon-btn back-btn" data-back aria-label="Back to ${FOLDERS[S.folder].title}">${svg("back")}</button>`];
    if (f === "trash") {
      parts.push(b(`data-move="${inbound ? "inbox" : "sent"}"`, "restore", "Restore"));
      parts.push(`<button type="button" class="text-btn danger" data-purge>Remove forever</button>`);
    } else {
      if (f === "inbox" || (f === "sent")) parts.push(b('data-move="archive"', "archive", "Archive"));
      if (f === "archive") parts.push(b(`data-move="${inbound ? "inbox" : "sent"}"`, "inbox", inbound ? "Move to Inbox" : "Move to Sent"));
      if (inbound && f !== "spam") parts.push(b('data-move="spam"', "alert", "Report spam"));
      if (f === "spam") parts.push(`<button type="button" class="text-btn" data-move="inbox">Not spam</button>`);
      parts.push(b('data-move="trash"', "trash", "Move to Trash"));
      if (inbound) parts.push(b("data-unread", "mail", "Mark as unread"));
    }
    parts.push(`<button type="button" class="icon-btn${m.is_starred ? " is-on" : ""}" data-star aria-pressed="${m.is_starred}" aria-label="Star" title="${m.is_starred ? "Remove star" : "Star"}">${svg("star")}</button>`);
    parts.push(`<span class="spacer"></span>`);
    parts.push(b(`data-reply="${m.id}"`, "reply", "Reply"), b(`data-reply-all="${m.id}"`, "replyAll", "Reply all"), b(`data-forward="${m.id}"`, "forward", "Forward"));
    return `<div class="read-bar">${parts.join("")}</div>`;
  }

  function renderReading() {
    const m = S.current;
    const last = S.thread[S.thread.length - 1];
    $("#read-pane").innerHTML = `${readBar(m)}
      <div class="read-inner">
        <h2 class="read-subject">${esc(m.subject || "(no subject)")}</h2>
        ${S.thread.map((x) => cardHtml(x, x.id === m.id || x.id === last.id || !x.is_read)).join("")}
      </div>`;
    S.thread.forEach((x) => { if (!$(`[data-card="${x.id}"]`).classList.contains("collapsed")) renderBody(x); });
    const opened = $(`[data-card="${m.id}"]`);
    if (S.thread.length > 1 && opened) opened.scrollIntoView({ block: "nearest" });
  }

  function cardHtml(x, expanded) {
    const out = x.direction === "out";
    const name = out ? (x.from_name || S.box.display_name) : (x.from_name || x.from_address);
    const addr = out ? x.from_address : x.from_address;
    const list = (a) => a.map(esc).join(", ");
    const to = `to ${list(x.to_addrs) || "—"}${x.cc_addrs.length ? ` · cc ${list(x.cc_addrs)}` : ""}${out && x.bcc_addrs.length ? ` · bcc ${list(x.bcc_addrs)}` : ""}`;
    return `<article class="msg-card${expanded ? "" : " collapsed"}" data-card="${x.id}">
      <header class="msg-card-head" data-toggle="${x.id}">
        <span class="avatar" style="background:${colorFor(addr)}">${initials(name)}</span>
        <div class="from"><strong>${esc(name)}</strong> ${name !== addr ? `<span>&lt;${esc(addr)}&gt;</span>` : ""}</div>
        <div class="date">${out ? statusTag(x, true) : ""}${fmtLong(x.sent_at)}</div>
        <div class="to">${to}</div>
      </header>
      <div class="msg-card-body" data-body="${x.id}"></div>
    </article>`;
  }

  // Remote pictures in received mail can tell the sender when and where it was opened, so they wait for a click
  const trusted = () => new Set(JSON.parse(store.get("cdsu-mail-trusted") || "[]"));
  const showPics = new Set();
  const REMOTE = /<img[^>]+src\s*=\s*["']?\s*(https?:)?\/\/|url\(\s*["']?\s*(https?:)?\/\//i;

  function frameDoc(html, remote) {
    const clean = window.DOMPurify
      ? window.DOMPurify.sanitize(html, {
          WHOLE_DOCUMENT: true, ADD_TAGS: ["style"], ADD_ATTR: ["target"],
          FORBID_TAGS: ["meta", "base", "link", "form", "input", "button", "textarea", "select", "script", "iframe", "object", "embed"]
        })
      : esc(html);
    const src = remote ? " https: http:" : "";
    const head = `<meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: cid:${src}; style-src 'unsafe-inline'${src}; font-src data:${src}"><base target="_blank">` +
      `<style>html,body{margin:0;padding:0}body{font:15px/1.6 Inter,Arial,sans-serif;color:#141B3A;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}pre{white-space:pre-wrap}blockquote{margin:.5em 0;padding-left:.9em;border-left:3px solid #E2E7F0;color:#4F5A73}a{color:#1E4E91}</style>`;
    return /<head[^>]*>/i.test(clean) ? clean.replace(/<head[^>]*>/i, (h) => h + head) : `<!DOCTYPE html><html><head>${head}</head><body>${clean}</body></html>`;
  }

  const linkify = (t) => esc(t).replace(/\bhttps?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g, (u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${u}</a>`);

  function renderBody(x) {
    const el = $(`[data-body="${x.id}"]`);
    if (!el || el.dataset.ready) return;
    el.dataset.ready = "1";
    const out = x.direction === "out";
    const notes = [];
    if (out && ["bounced", "failed", "complained"].includes(x.status)) {
      notes.push(`<div class="warn-note">${x.status === "complained" ? "The recipient marked this message as spam." : "This message wasn't delivered."}${x.error ? ` ${esc(x.error)}` : ""}</div>`);
    }
    if (!out && x.folder === "spam") notes.push(`<div class="warn-note">This message failed the sender's domain checks (DMARC), so it may not really be from ${esc(x.from_address)}. Be careful with links and attachments.</div>`);
    const html = x.body_html;
    const remote = Boolean(html && REMOTE.test(html));
    const allowRemote = out || showPics.has(x.id) || trusted().has(x.from_address);
    if (remote && !allowRemote) {
      notes.push(`<div class="img-note">Pictures from the sender are hidden to protect your privacy.
        <button type="button" class="text-btn" data-pics="${x.id}">Show pictures</button>
        <button type="button" class="text-btn" data-trust="${esc(x.from_address)}">Always show from ${esc(x.from_address)}</button></div>`);
    }
    const atts = (x.attachments || []).map((a, i) => `<button type="button" class="att" data-att="${x.id}:${i}" ${a.path ? "" : "disabled"} title="${a.path ? "Download" : "Too large to keep"}">${svg("clip")}<span>${esc(a.name)}</span><small>${fmtSize(a.size)}${a.path ? "" : " · not kept"}</small></button>`).join("");
    const multi = (x.to_addrs.length + x.cc_addrs.length) > 1;
    el.innerHTML = `${notes.join("")}<div data-content></div>
      ${atts ? `<div class="atts">${atts}</div>` : ""}
      <div class="card-actions">
        <button type="button" class="btn btn-outline btn-sm" data-reply="${x.id}">${svg("reply")} Reply</button>
        ${multi ? `<button type="button" class="btn btn-outline btn-sm" data-reply-all="${x.id}">${svg("replyAll")} Reply all</button>` : ""}
        <button type="button" class="btn btn-outline btn-sm" data-forward="${x.id}">${svg("forward")} Forward</button>
      </div>`;
    const box = $("[data-content]", el);
    if (html) {
      const f = document.createElement("iframe");
      f.className = "mail-frame";
      f.title = `Message from ${x.from_name || x.from_address}`;
      f.setAttribute("sandbox", "allow-same-origin allow-popups allow-popups-to-escape-sandbox");
      f.setAttribute("referrerpolicy", "no-referrer");
      f.addEventListener("load", () => {
        const d = f.contentDocument;
        if (!d) return;
        const fit = () => { f.style.height = `${Math.max(48, d.documentElement.scrollHeight)}px`; };
        fit();
        if (window.ResizeObserver) new ResizeObserver(fit).observe(d.body);
        $$("img", d).forEach((i) => i.addEventListener("load", fit));
      });
      f.srcdoc = frameDoc(html, allowRemote);
      box.appendChild(f);
    } else {
      box.innerHTML = `<pre class="mail-text">${linkify(x.body_text || "")}</pre>`;
    }
  }

  /* ---------- filing ---------- */
  const MOVED = { archive: "Archived.", inbox: "Moved to Inbox.", sent: "Moved to Sent.", spam: "Reported as spam.", trash: "Moved to Trash." };
  async function move(id, folder) {
    const { error } = await db.from("mail_messages").update({ folder }).eq("id", id);
    if (error) return toast(ERR(error));
    toast(MOVED[folder] || "Moved.");
    go(S.folder);
    refreshCounts();
    loadList();
  }

  async function downloadAttachment(key) {
    const [id, i] = key.split(":");
    const msg = S.thread.find((x) => x.id === id);
    const a = msg?.attachments?.[+i];
    if (!a?.path) return;
    const { data, error } = await db.storage.from("mail").createSignedUrl(a.path, 120, { download: a.name });
    if (error) return toast(ERR(error));
    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /* ---------- live updates ---------- */
  let refreshTimer;
  function subscribe() {
    if (S.channel) db.removeChannel(S.channel);
    S.channel = db.channel(`mail-${S.box.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "mail_messages", filter: `mailbox_id=eq.${S.box.id}` }, (p) => {
        if (p.eventType === "INSERT" && p.new.direction === "in" && p.new.folder === "inbox") {
          toast(`New email from ${p.new.from_name || p.new.from_address}`);
        }
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => { refreshCounts(); loadList(); }, 500);
      })
      .subscribe();
  }

  /* ---------- settings ---------- */
  function openSettings() {
    const wrap = document.createElement("div");
    wrap.className = "modal";
    wrap.id = "modal";
    wrap.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true" aria-labelledby="set-title">
        <h2 id="set-title">Mailbox settings</h2>
        <form class="form form-light" id="set-form" novalidate>
          <label>Name people see<input name="display_name" maxlength="80" required value="${esc(S.box.display_name)}"></label>
          <p class="small muted" style="margin:-.4rem 0 0">Your mail shows as <span id="from-preview"></span></p>
          <label>Signature<textarea name="signature" maxlength="2000" rows="5" placeholder="Name&#10;Role&#10;Career Development Society of Uganda">${esc(S.box.signature)}</textarea></label>
          <p class="small muted" style="margin:-.4rem 0 0">Added to the end of new messages, replies and forwards.</p>
          <div class="actions"><button type="button" class="btn btn-outline btn-sm" data-close>Close</button><button type="submit" class="btn btn-primary btn-sm">Save</button></div>
          <p class="form-msg" role="status"></p>
        </form>
        <h3>Change password</h3>
        <form class="form form-light" id="pw-form" novalidate>
          <input type="email" name="username" value="${esc(S.box.address)}" autocomplete="username" hidden>
          <label>New password<input name="pw" type="password" minlength="10" autocomplete="new-password" required></label>
          <label>Type it again<input name="pw2" type="password" autocomplete="new-password" required></label>
          <div class="actions"><button type="submit" class="btn btn-primary btn-sm">Change password</button></div>
          <p class="form-msg" role="status"></p>
        </form>
      </div>`;
    document.body.appendChild(wrap);
    const sf = $("#set-form"), pf = $("#pw-form");
    const preview = () => { $("#from-preview").textContent = `${sf.display_name.value.trim() || "…"} <${S.box.address}>`; };
    preview();
    sf.display_name.addEventListener("input", preview);
    sf.display_name.focus();
    sf.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $(".form-msg", sf);
      const display_name = sf.display_name.value.trim(), signature = sf.signature.value.trim();
      if (!display_name) { msg.textContent = "Enter a name."; return; }
      const { error } = await db.from("mailboxes").update({ display_name, signature }).eq("id", S.box.id);
      if (error) { msg.textContent = ERR(error); return; }
      Object.assign(S.box, { display_name, signature });
      $("#me-name").textContent = display_name;
      msg.textContent = "Saved.";
    });
    pf.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $(".form-msg", pf);
      if (pf.pw.value.length < 10) { msg.textContent = "Use at least 10 characters."; return; }
      if (pf.pw.value !== pf.pw2.value) { msg.textContent = "The two passwords don't match."; return; }
      msg.textContent = "Saving…";
      const { error } = await db.auth.updateUser({ password: pf.pw.value });
      msg.textContent = error ? ERR(error) : "Password changed. Use it next time you sign in.";
      if (!error) pf.reset();
    });
  }
  const closeModal = () => $("#modal")?.remove();

  async function signOut() {
    if (M.closeComposer) await M.closeComposer();
    if (S.channel) { db.removeChannel(S.channel); S.channel = null; }
    clearInterval(S.poll);
    Object.assign(S, { box: null, list: [], openId: null, current: null, thread: [], folder: "inbox" });
    await db.auth.signOut();
    history.replaceState(null, "", location.pathname);
    renderLogin("You've signed out.");
  }

  /* ---------- clicks ---------- */
  document.addEventListener("click", async (e) => {
    const el = (s) => e.target.closest(s);
    if (!S.box) return;
    if (el("[data-close]") || e.target.id === "modal") return closeModal();
    if (el("[data-compose]")) return M.compose?.({});
    if (el("[data-menu]")) return $("#shell").classList.toggle("side-open");
    if (e.target.id === "shell" && $("#shell").classList.contains("side-open")) return $("#shell").classList.remove("side-open");
    if (el("[data-refresh]")) { refreshCounts(); return loadList().then(() => toast("Up to date.")); }
    if (el("[data-more]")) { S.limit += 50; return loadList(); }
    if (el("[data-open]")) return go(S.folder, el("[data-open]").dataset.open);
    if (el("[data-back]")) return go(S.folder);
    if (el("[data-settings]")) return openSettings();
    if (el("[data-signout]")) return signOut();
    if (el("[data-toggle]")) {
      const id = el("[data-toggle]").dataset.toggle;
      const card = $(`[data-card="${id}"]`);
      card.classList.toggle("collapsed");
      if (!card.classList.contains("collapsed")) renderBody(S.thread.find((x) => x.id === id));
      return;
    }
    if (el("[data-att]")) return downloadAttachment(el("[data-att]").dataset.att);
    if (el("[data-pics]")) {
      const id = el("[data-pics]").dataset.pics;
      showPics.add(id);
      const body = $(`[data-body="${id}"]`);
      delete body.dataset.ready;
      return renderBody(S.thread.find((x) => x.id === id));
    }
    if (el("[data-trust]")) {
      const t = trusted();
      t.add(el("[data-trust]").dataset.trust);
      store.set("cdsu-mail-trusted", JSON.stringify([...t]));
      $$("[data-body]").forEach((b) => delete b.dataset.ready);
      return S.thread.forEach((x) => { if (!$(`[data-card="${x.id}"]`).classList.contains("collapsed")) renderBody(x); });
    }
    const pick = (attr) => S.thread.find((x) => x.id === el(`[${attr}]`).getAttribute(attr));
    if (el("[data-reply]")) return M.compose?.({ mode: "reply", parent: pick("data-reply") });
    if (el("[data-reply-all]")) return M.compose?.({ mode: "replyAll", parent: pick("data-reply-all") });
    if (el("[data-forward]")) return M.compose?.({ mode: "forward", parent: pick("data-forward") });
    if (el("[data-move]") && S.current) return move(S.current.id, el("[data-move]").dataset.move);
    if (el("[data-star]") && S.current) {
      const v = !S.current.is_starred;
      const { error } = await db.from("mail_messages").update({ is_starred: v }).eq("id", S.current.id);
      if (error) return toast(ERR(error));
      S.current.is_starred = v;
      const b = el("[data-star]");
      b.classList.toggle("is-on", v);
      b.setAttribute("aria-pressed", v);
      b.title = v ? "Remove star" : "Star";
      return loadList();
    }
    if (el("[data-unread]") && S.current) {
      await db.from("mail_messages").update({ is_read: false }).eq("id", S.current.id);
      go(S.folder);
      refreshCounts();
      return loadList();
    }
    if (el("[data-purge]") && S.current) {
      if (!confirm("Remove this message forever? This can't be undone.")) return;
      const { error } = await db.from("mail_messages").update({ purged: true }).eq("id", S.current.id);
      if (error) return toast(ERR(error));
      toast("Removed.");
      go(S.folder);
      return loadList();
    }
    if (el("[data-empty-trash]")) {
      if (!confirm("Remove everything in Trash forever? This can't be undone.")) return;
      const { error } = await db.from("mail_messages").update({ purged: true }).eq("folder", "trash");
      if (error) return toast(ERR(error));
      toast("Trash emptied.");
      closeReading();
      return loadList();
    }
    if (el("[data-all-read]")) {
      await db.from("mail_messages").update({ is_read: true }).eq("folder", "inbox").eq("is_read", false);
      refreshCounts();
      return loadList();
    }
  });

  let searchTimer;
  document.addEventListener("input", (e) => {
    if (e.target.id !== "search") return;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { S.query = e.target.value; S.limit = 50; loadList(); }, 300);
  });

  /* ---------- keyboard ---------- */
  document.addEventListener("keydown", (e) => {
    if (!S.box) return;
    if (e.key === "Escape") {
      if ($("#modal")) return closeModal();
      if ($("#shell")?.classList.contains("side-open")) return $("#shell").classList.remove("side-open");
      if (S.openId && !$(".composer")) return go(S.folder);
      return;
    }
    if (e.key === "Enter" && e.target.matches?.(".msg-row")) return go(S.folder, e.target.dataset.open);
    if (typing(e.target) || e.ctrlKey || e.metaKey || e.altKey || $("#modal")) return;
    const step = (d) => {
      if (!S.list.length) return;
      const i = S.list.findIndex((m) => m.id === S.openId);
      const next = S.list[Math.min(S.list.length - 1, Math.max(0, i + d))];
      if (next) { go(S.folder, next.id); $(`.msg-row[data-open="${next.id}"]`)?.scrollIntoView({ block: "nearest" }); }
    };
    const map = {
      c: () => M.compose?.({}),
      "/": () => $("#search")?.focus(),
      j: () => step(1), k: () => step(-1),
      r: () => S.current && M.compose?.({ mode: "reply", parent: S.current }),
      a: () => S.current && M.compose?.({ mode: "replyAll", parent: S.current }),
      f: () => S.current && M.compose?.({ mode: "forward", parent: S.current }),
      e: () => S.current && ["inbox", "sent"].includes(S.current.folder) && move(S.current.id, "archive"),
      "#": () => S.current && S.current.folder !== "trash" && move(S.current.id, "trash")
    };
    if (map[e.key]) { e.preventDefault(); map[e.key](); }
  });

  db?.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT" && S.box) {
      S.box = null;
      renderLogin("Your session ended. Please sign in again.");
    }
  });
  boot();
})();
