/* CDSU Mail — the composer: new messages, replies, reply-all and forwards.
   Drafts save themselves to the Drafts folder as you type; attachments upload to the mailbox's private
   storage folder; Send hands everything to the mail-send Edge Function. Loaded after mail.js. */
(function () {
  "use strict";
  const M = window.CDSU_MAIL;
  if (!M) return;
  const { db, S, $, esc, svg, toast, ERR, fmtLong, fmtSize } = M;
  const EMAIL = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/;
  const MAX_FILE = 25 * 1024 * 1024, MAX_TOTAL = 28 * 1024 * 1024;
  let C = null; // the open composer

  try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (_) { /* older browsers */ }

  // "Jane <jane@x.org>, bob@y.org; …" → ["jane@x.org", "bob@y.org"]
  const parseList = (s) => String(s || "").split(/[,;\n]+/)
    .map((p) => { const m = p.match(/<([^>]+)>/); return (m ? m[1] : p).trim().toLowerCase(); })
    .filter(Boolean);
  const unique = (a) => [...new Set(a)];
  const safeName = (n) => (String(n || "file").normalize("NFKD").replace(/[^\w.\-()]+/g, "_").replace(/_+/g, "_").slice(-120)) || "file";
  const cleanForEditor = (html) => (window.DOMPurify
    ? window.DOMPurify.sanitize(html, {
        FORBID_TAGS: ["style", "meta", "base", "link", "title", "form", "input", "button", "textarea", "select", "script", "iframe", "object", "embed"],
        FORBID_ATTR: ["id", "class"]
      })
    : esc(html));
  const sigHtml = () => (S.box.signature ? `<div data-signature><br>${esc(S.box.signature).replace(/\n/g, "<br>")}</div>` : "");
  const quoteOf = (p) => (p.body_html ? cleanForEditor(p.body_html) : esc(p.body_text || "").replace(/\n/g, "<br>"));
  const whoOf = (p) => (p.from_name ? `${p.from_name} <${p.from_address}>` : p.from_address);

  /* ---------- open ---------- */
  M.compose = async function (opts = {}) {
    if (C && !(await close())) return;
    const p = opts.parent, d = opts.draft, mine = S.box.address;
    let to = [], cc = [], bcc = [], subject = "", body = `<p><br></p>${sigHtml()}`, files = [], parentId = null, title = "New message", focus = "to";

    if (d) {
      ({ to_addrs: to, cc_addrs: cc, bcc_addrs: bcc, subject } = d);
      body = d.body_html ? cleanForEditor(d.body_html) : esc(d.body_text || "").replace(/\n/g, "<br>");
      files = d.attachments || [];
      parentId = d.parent_id;
      title = "Draft";
      focus = to.length ? "editor" : "to";
    } else if (p) {
      parentId = p.id;
      const out = p.direction === "out";
      if (opts.mode === "forward") {
        subject = /^\s*fwd?:/i.test(p.subject) ? p.subject : `Fwd: ${p.subject}`;
        files = (p.attachments || []).filter((a) => a.path);
        title = "Forward";
        body = `<p><br></p>${sigHtml()}<br><div>---------- Forwarded message ----------<br>From: ${esc(whoOf(p))}<br>Date: ${esc(fmtLong(p.sent_at))}<br>Subject: ${esc(p.subject)}<br>To: ${esc(p.to_addrs.join(", "))}${p.cc_addrs.length ? `<br>Cc: ${esc(p.cc_addrs.join(", "))}` : ""}</div><br>${quoteOf(p)}`;
      } else {
        to = out ? [...p.to_addrs] : [p.reply_to || p.from_address];
        if (opts.mode === "replyAll") cc = out ? [...p.cc_addrs] : [...p.to_addrs, ...p.cc_addrs];
        cc = unique(cc).filter((a) => a !== mine && !to.includes(a));
        subject = /^\s*re:/i.test(p.subject) ? p.subject : `Re: ${p.subject}`;
        title = opts.mode === "replyAll" ? "Reply all" : "Reply";
        focus = "editor";
        body = `<p><br></p>${sigHtml()}<br><div>On ${esc(fmtLong(p.sent_at))}, ${esc(whoOf(p))} wrote:</div>` +
          `<blockquote style="margin:0 0 0 .8ex;border-left:2px solid #ccc;padding-left:1ex">${quoteOf(p)}</blockquote>`;
      }
    }

    C = {
      id: d?.id || null, parentId, sendId: crypto.randomUUID(), dirty: false, saving: Promise.resolve(), timer: null, sending: false,
      files: files.map((a) => ({ name: a.name, type: a.type, size: a.size, path: a.path, key: crypto.randomUUID() }))
    };
    render(title, { to, cc, bcc, subject, body });
    if (focus === "editor") {
      const ed = $("#c-editor"), r = document.createRange(), sel = getSelection();
      r.setStart(ed, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      ed.focus();
    } else {
      $("#c-to").focus();
    }
  };

  function render(title, v) {
    $("#composer")?.remove();
    const tool = (cmd, label, inner) => `<button type="button" class="icon-btn" data-cmd="${cmd}" aria-label="${label}" title="${label}">${inner}</button>`;
    const el = document.createElement("div");
    el.className = "composer";
    el.id = "composer";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", title);
    el.innerHTML = `
      <div class="composer-head">
        <strong>${esc(title)}</strong>
        <button type="button" class="icon-btn" data-c-max aria-label="Full screen" title="Full screen">${svg("maximize")}</button>
        <button type="button" class="icon-btn" data-c-close aria-label="Save and close" title="Save and close">${svg("x")}</button>
      </div>
      <div class="c-field"><label for="c-to">To</label><input id="c-to" type="text" inputmode="email" autocomplete="off" value="${esc(v.to.join(", "))}" placeholder="name@example.com, …"><button type="button" class="text-btn" data-c-ccbcc>Cc / Bcc</button></div>
      <div class="c-field" data-cc ${v.cc.length || v.bcc.length ? "" : "hidden"}><label for="c-cc">Cc</label><input id="c-cc" type="text" inputmode="email" autocomplete="off" value="${esc(v.cc.join(", "))}"></div>
      <div class="c-field" data-cc ${v.cc.length || v.bcc.length ? "" : "hidden"}><label for="c-bcc">Bcc</label><input id="c-bcc" type="text" inputmode="email" autocomplete="off" value="${esc(v.bcc.join(", "))}"></div>
      <div class="c-field"><label for="c-subject">Subject</label><input id="c-subject" type="text" maxlength="900" value="${esc(v.subject)}"></div>
      <div class="c-tools" role="toolbar" aria-label="Formatting">
        ${tool("bold", "Bold", "<b>B</b>")}${tool("italic", "Italic", "<i>I</i>")}${tool("underline", "Underline", "<u>U</u>")}
        <span class="sep"></span>
        ${tool("insertUnorderedList", "Bulleted list", svg("list"))}${tool("insertOrderedList", "Numbered list", "1.")}${tool("quote", "Quote", svg("quote"))}
        <span class="sep"></span>
        ${tool("link", "Add link", svg("link"))}${tool("removeFormat", "Clear formatting", "T<sub>x</sub>")}
      </div>
      <div class="c-editor" id="c-editor" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Message" data-placeholder="Write your message…">${v.body}</div>
      <div class="c-atts" id="c-atts"></div>
      <div class="composer-foot">
        <button type="button" class="btn btn-primary btn-sm" data-c-send>${svg("send")} Send</button>
        <button type="button" class="icon-btn" data-c-attach aria-label="Attach files" title="Attach files (up to 28 MB)">${svg("clip")}</button>
        <input type="file" id="c-file" multiple hidden>
        <span class="status" id="c-status" role="status"></span>
        <button type="button" class="icon-btn" data-c-discard aria-label="Discard" title="Discard">${svg("trash")}</button>
      </div>`;
    document.body.appendChild(el);
    renderFiles();

    el.addEventListener("input", (e) => { if (e.target.id !== "c-file") changed(); });
    el.addEventListener("mousedown", (e) => { if (e.target.closest("[data-cmd]")) e.preventDefault(); }); // keep the editor's selection
    el.addEventListener("click", onClick);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); send(); }
      if (e.key === "Escape") { e.preventDefault(); close(); }
    });
    $("#c-file").addEventListener("change", (e) => { addFiles([...e.target.files]); e.target.value = ""; });
    const ed = $("#c-editor");
    ed.addEventListener("paste", (e) => {
      const html = e.clipboardData?.getData("text/html");
      if (!html) return;
      e.preventDefault();
      document.execCommand("insertHTML", false, cleanForEditor(html));
    });
    ed.addEventListener("dragover", (e) => { if (e.dataTransfer?.types?.includes("Files")) e.preventDefault(); });
    ed.addEventListener("drop", (e) => {
      if (!e.dataTransfer?.files?.length) return;
      e.preventDefault();
      addFiles([...e.dataTransfer.files]);
    });
  }

  function onClick(e) {
    const el = (s) => e.target.closest(s);
    if (el("[data-c-close]")) return close();
    if (el("[data-c-max]")) return $("#composer").classList.toggle("max");
    if (el("[data-c-ccbcc]")) { document.querySelectorAll("#composer [data-cc]").forEach((f) => { f.hidden = false; }); return $("#c-cc").focus(); }
    if (el("[data-c-send]")) return send();
    if (el("[data-c-attach]")) return $("#c-file").click();
    if (el("[data-c-discard]")) return discard();
    if (el("[data-c-unattach]")) {
      C.files = C.files.filter((f) => f.key !== el("[data-c-unattach]").dataset.cUnattach);
      renderFiles();
      return changed();
    }
    const b = el("[data-cmd]");
    if (!b) return;
    const cmd = b.dataset.cmd;
    $("#c-editor").focus();
    if (cmd === "link") {
      let url = prompt("Link address (for example https://cdsu.online)");
      if (!url) return;
      url = url.trim();
      if (!/^(https?:|mailto:)/i.test(url)) url = /@/.test(url) && !/\//.test(url) ? `mailto:${url}` : `https://${url}`;
      if (getSelection().isCollapsed) document.execCommand("insertHTML", false, `<a href="${esc(url)}">${esc(url)}</a>`);
      else document.execCommand("createLink", false, url);
    } else if (cmd === "quote") {
      document.execCommand("formatBlock", false, "blockquote");
    } else {
      document.execCommand(cmd, false, null);
    }
    changed();
  }

  /* ---------- attachments ---------- */
  function renderFiles() {
    const box = $("#c-atts");
    if (!box || !C) return;
    box.innerHTML = C.files.map((f) => `<span class="c-att${f.uploading ? " busy" : ""}" title="${esc(f.name)}"><span>${esc(f.name)}</span><small>${f.uploading ? "uploading…" : fmtSize(f.size)}</small><button type="button" data-c-unattach="${f.key}" aria-label="Remove ${esc(f.name)}">&times;</button></span>`).join("");
  }

  async function addFiles(list) {
    const c = C;
    if (!c) return;
    for (const file of list) {
      if (file.size > MAX_FILE) { toast(`${file.name} is larger than 25 MB.`); continue; }
      const total = c.files.reduce((s, f) => s + (f.size || 0), 0) + file.size;
      if (total > MAX_TOTAL) { toast("Attachments can add up to 28 MB per email."); break; }
      const f = { name: file.name, type: file.type || "application/octet-stream", size: file.size, path: null, uploading: true, key: crypto.randomUUID() };
      c.files.push(f);
      renderFiles();
      const path = `${S.box.id}/outgoing/${f.key}/${safeName(file.name)}`;
      const { error } = await db.storage.from("mail").upload(path, file, { contentType: f.type, upsert: false });
      f.uploading = false;
      if (error) { c.files = c.files.filter((x) => x !== f); toast(`Couldn't attach ${file.name}: ${ERR(error)}`); }
      else f.path = path;
      if (C === c) { renderFiles(); changed(); }
    }
  }

  /* ---------- drafts ---------- */
  function values() {
    const ed = $("#c-editor");
    const plain = ed.cloneNode(true);
    plain.querySelectorAll("[data-signature]").forEach((s) => s.remove());
    return {
      to: unique(parseList($("#c-to").value)),
      cc: unique(parseList($("#c-cc").value)),
      bcc: unique(parseList($("#c-bcc").value)),
      subject: $("#c-subject").value.replace(/[\r\n]+/g, " ").trim(),
      html: ed.innerHTML,
      text: ed.innerText.replace(/\n{3,}/g, "\n\n").trim(),
      own: plain.innerText.trim()
    };
  }
  const isBlank = (v) => !v.to.length && !v.cc.length && !v.bcc.length && !v.subject && !v.own && !C.files.length;

  const status = (msg, err) => { const s = $("#c-status"); if (s) { s.textContent = msg; s.classList.toggle("err", Boolean(err)); } };

  function changed() {
    if (!C) return;
    C.dirty = true;
    clearTimeout(C.timer);
    C.timer = setTimeout(save, 1500);
  }

  async function save() {
    const c = C;
    if (!c || c.sending || !$("#composer")) return;
    clearTimeout(c.timer);
    const v = values();
    if (!c.id && isBlank(v)) return;
    c.dirty = false;
    const row = {
      to_addrs: v.to, cc_addrs: v.cc, bcc_addrs: v.bcc, subject: v.subject, body_html: v.html, body_text: v.text,
      snippet: v.text.replace(/\s+/g, " ").slice(0, 200), parent_id: c.parentId,
      attachments: c.files.filter((f) => f.path).map(({ name, type, size, path }) => ({ name, type, size, path }))
    };
    status("Saving…");
    c.saving = c.saving.catch(() => {}).then(async () => {
      if (c.id) {
        const { error } = await db.from("mail_messages").update(row).eq("id", c.id);
        if (error) throw error;
      } else {
        const { data, error } = await db.from("mail_messages").insert({
          ...row, mailbox_id: S.box.id, direction: "out", folder: "drafts", status: "draft",
          from_address: S.box.address, from_name: S.box.display_name
        }).select("id").single();
        if (error) throw error;
        c.id = data.id;
      }
    });
    try {
      await c.saving;
      if (C === c && !c.sending) status(`Draft saved at ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`);
    } catch (err) {
      c.dirty = true;
      if (C === c) status(`Couldn't save the draft: ${ERR(err)}`, true);
    }
  }

  async function close() {
    const c = C;
    if (!c) return true;
    if (c.sending) return false;
    clearTimeout(c.timer);
    if (c.dirty || (!c.id && !isBlank(values()))) await save();
    await c.saving.catch(() => {});
    $("#composer")?.remove();
    C = null;
    if (c.id) { toast("Saved to Drafts."); M.refresh(); }
    return true;
  }
  M.closeComposer = close;

  async function discard() {
    const c = C;
    if (!c || c.sending) return;
    clearTimeout(c.timer);
    await c.saving.catch(() => {});
    $("#composer")?.remove();
    C = null;
    if (c.id) {
      const { error } = await db.from("mail_messages").update({ purged: true }).eq("id", c.id);
      if (error) return toast(ERR(error));
      M.refresh();
    }
    toast("Discarded.");
  }

  /* ---------- send ---------- */
  async function send() {
    const c = C;
    if (!c || c.sending) return;
    const v = values();
    if (!v.to.length) { status("Add at least one recipient in To.", true); return $("#c-to").focus(); }
    const bad = [...v.to, ...v.cc, ...v.bcc].find((a) => !EMAIL.test(a));
    if (bad) { status(`“${bad}” isn't a valid email address.`, true); return; }
    if (v.to.length + v.cc.length + v.bcc.length > 50) { status("You can send to at most 50 people at once.", true); return; }
    if (c.files.some((f) => f.uploading)) { status("Wait for the attachments to finish uploading.", true); return; }
    if (!v.subject && !confirm("Send this message without a subject?")) return;

    c.sending = true;
    clearTimeout(c.timer);
    const btn = $("[data-c-send]");
    btn.disabled = true;
    status("Sending…");
    await c.saving.catch(() => {});
    const { error } = await db.functions.invoke("mail-send", {
      body: {
        draft_id: c.id, parent_id: c.parentId, send_id: c.sendId,
        to: v.to, cc: v.cc, bcc: v.bcc, subject: v.subject, html: v.html, text: v.text,
        attachments: c.files.filter((f) => f.path).map(({ name, type, size, path }) => ({ name, type, size, path }))
      }
    });
    if (error) {
      let msg = error.message || "The email couldn't be sent.";
      try { const j = await error.context.json(); if (j?.error) msg = j.error; } catch (_) { /* not JSON */ }
      if (/failed to send a request|fetch/i.test(msg)) msg = ERR("failed to fetch");
      c.sending = false;
      btn.disabled = false;
      status(msg, true);
      return;
    }
    $("#composer")?.remove();
    C = null;
    toast("Message sent.");
    M.refresh();
  }

  window.addEventListener("beforeunload", (e) => {
    if (C && (C.dirty || C.sending)) { save(); e.preventDefault(); e.returnValue = ""; }
  });
})();
