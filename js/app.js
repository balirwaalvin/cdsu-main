/* CDSU site — renders all content from window.CDSU_DATA (js/cdsuData.js). No build step required. */
(function () {
  "use strict";
  const D = window.CDSU_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const get = (path) => path.split(".").reduce((o, k) => (o ? o[k] : undefined), D);
  const C = D.contact;

  const waLink = (text) => `https://wa.me/${C.whatsappClean}?text=${encodeURIComponent(text)}`;
  const mailLink = (subject, body) => `mailto:${C.emailPrimary}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- simple text bindings ---------- */
  $$("[data-bind]").forEach((el) => { el.textContent = get(el.dataset.bind) ?? ""; });

  /* ---------- header ---------- */
  const navToggle = $(".nav-toggle");
  const nav = $("#site-nav");
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open);
  });
  $$("#site-nav a").forEach((a) => a.addEventListener("click", () => { nav.classList.remove("open"); navToggle.setAttribute("aria-expanded", "false"); }));

  /* ---------- partners marquee (only partner/sponsor entries; linked only if a URL is set) ---------- */
  const partners = D.sponsors.filter((s) => s.status === "partner" || s.status === "sponsor");
  const chip = (s) => {
    const inner = `${s.logo ? `<img src="${esc(s.logo)}" alt="">` : ""}<span><strong>${esc(s.name)}</strong> <small>${esc(s.note || "")}</small></span>`;
    return s.url
      ? `<a class="partner-chip" href="${esc(s.url)}" target="_blank" rel="noopener" title="Visit ${esc(s.name)}">${inner}</a>`
      : `<span class="partner-chip">${inner}</span>`;
  };
  // duplicated once so the CSS loop is seamless
  $("#partner-track").innerHTML = partners.map(chip).join("") + partners.map(chip).join("").replace(/<a /g, '<a tabindex="-1" aria-hidden="true" ').replace(/<span class="partner-chip"/g, '<span class="partner-chip" aria-hidden="true"');

  /* ---------- objectives ---------- */
  $("#objectives").innerHTML = D.organization.coreObjectives.map((o, i) => `
    <article class="obj-card reveal">
      <div class="num">0${i + 1}</div>
      <h4>${esc(o.title)}</h4>
      <ul>${o.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </article>`).join("");

  /* ---------- programme phases ---------- */
  const tabs = $("#phase-tabs");
  tabs.innerHTML = D.cdpPhases.map((p, i) => `
    <button class="phase-tab" role="tab" id="phase-tab-${i}" aria-controls="phase-panel" aria-selected="${i === 0}" data-i="${i}" data-color="${esc(p.color)}">
      <small>${esc(p.badge)}</small><strong>${esc(p.title)}</strong>
    </button>`).join("");
  function showPhase(i) {
    const p = D.cdpPhases[i];
    $$(".phase-tab", tabs).forEach((t) => t.setAttribute("aria-selected", t.dataset.i == i));
    $("#phase-panel").setAttribute("aria-labelledby", `phase-tab-${i}`);
    $("#phase-panel").innerHTML = `<h3>${esc(p.phaseCode)}: ${esc(p.title)}</h3><p>${esc(p.summary)}</p><ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`;
  }
  tabs.addEventListener("click", (e) => { const b = e.target.closest(".phase-tab"); if (b) showPhase(+b.dataset.i); });
  showPhase(0);

  $("#products").innerHTML = D.products.map((p) => `
    <article class="product-card reveal">
      <div class="num">${p.id}</div>
      <h4>${esc(p.title)}</h4>
      <p>${esc(p.description)}</p>
      <a href="#contact" class="btn btn-outline btn-sm" data-topic="${p.id === 1 ? "Ordering books" : "General enquiry"}">${esc(p.ctaText)}</a>
    </article>`).join("");

  /* ---------- endorsements ---------- */
  const initials = (n) => n.replace(/^(Prof\.|Dr\.|Mr\.|Ms\.)\s*/, "").split(" ").map((w) => w[0]).slice(0, 2).join("");
  $("#endorsements").innerHTML = D.endorsements.map((e) => `
    <article class="endorse-card reveal">
      <blockquote>${esc(e.quote)}</blockquote>
      <div class="endorser">
        ${e.image ? `<img src="${esc(e.image)}" alt="${esc(e.name)}">` : `<span class="avatar">${esc(initials(e.name))}</span>`}
        <div><strong>${esc(e.name)}</strong><small>${esc(e.title)}</small></div>
      </div>
    </article>`).join("");

  /* ---------- chapters accordion (summaries only — full content stays in the book) ---------- */
  $("#chapters").innerHTML = D.bookChapters.map((c, i) => `
    <div class="acc-item">
      <button class="acc-btn" aria-expanded="false" aria-controls="acc-${i}">
        <span class="ch">${esc(c.number.replace("Chapter ", "Ch "))}</span><span class="t">${esc(c.title)}</span><span class="chev" aria-hidden="true">▾</span>
      </button>
      <div class="acc-body" id="acc-${i}"><p>${esc(c.summary)}</p><ul>${c.keyTakeaways.map((k) => `<li>${esc(k)}</li>`).join("")}</ul></div>
    </div>`).join("");
  $("#chapters").addEventListener("click", (e) => {
    const b = e.target.closest(".acc-btn"); if (!b) return;
    const item = b.parentElement; const open = item.classList.toggle("open");
    b.setAttribute("aria-expanded", open);
  });

  /* ---------- forms (no backend: hand off to WhatsApp or email) ---------- */
  function wireForm(form, build) {
    let channel = "whatsapp";
    $$("button[data-channel]", form).forEach((b) => b.addEventListener("click", () => { channel = b.dataset.channel; }));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = $(".form-msg", form);
      let ok = true;
      $$("[required]", form).forEach((f) => { const bad = !f.value.trim(); f.classList.toggle("invalid", bad); if (bad) ok = false; });
      if (!ok) { msg.textContent = "Please fill in the highlighted fields."; return; }
      const { subject, body } = build(Object.fromEntries(new FormData(form)));
      window.open(channel === "whatsapp" ? waLink(body) : mailLink(subject, body), "_blank", "noopener");
      msg.textContent = channel === "whatsapp" ? "Opening WhatsApp with your message…" : "Opening your email app…";
    });
  }
  wireForm($("#access-form"), (v) => ({
    subject: "CDP Access Code Request",
    body: `Hello CDSU, I would like to register my book serial number for a CDP access code.\n\nName: ${v.name}\nSchool/Community: ${v.org || "-"}\nContact: ${v.contact}\nSerial number: ${v.serial}`
  }));
  wireForm($("#contact-form"), (v) => ({
    subject: `CDSU Website: ${v.topic}`,
    body: `Hello CDSU,\n\nTopic: ${v.topic}\nName: ${v.name}\nContact: ${v.contact}\n\n${v.message}`
  }));
  // product buttons preselect the contact topic
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-topic]"); if (!t) return;
    const sel = $("#contact-form select[name=topic]");
    [...sel.options].forEach((o) => { if (o.text === t.dataset.topic) sel.value = o.text; });
  });

  /* ---------- career cluster quiz (Annexure 3, short form) ---------- */
  const A = D.careerAssessment;
  const keys = Object.keys(A.clusters);
  const state = { interests: new Set(), abilities: new Set(), values: {}, work: {} };
  const steps = [
    { id: "interests", title: "What I like doing", hint: "Tap everything you enjoy." },
    { id: "abilities", title: "What I'm good at", hint: "Tap your strengths." },
    { id: "values", title: "What matters to me", hint: "Tap once = Important, twice = Very important, three times to clear." },
    { id: "work", title: "How I like to work", hint: "Pick one answer per question." }
  ];
  let step = 0;
  const root = $("#quiz-root");

  function renderStep() {
    const s = steps[step];
    let body = "";
    if (s.id === "interests" || s.id === "abilities") {
      body = `<div class="chips">${A[s.id].map((it, i) => `<button type="button" class="chip" data-i="${i}" aria-pressed="${state[s.id].has(i)}">${esc(it.label)}</button>`).join("")}</div>`;
    } else if (s.id === "values") {
      body = `<div class="chips">${A.values.map((it, i) => { const lv = state.values[i] || 0; return `<button type="button" class="chip" data-i="${i}" data-level="${lv}" aria-label="${esc(it.label)}: ${["not selected", "important", "very important"][lv]}">${esc(it.label)}${lv === 2 ? " ★★" : lv === 1 ? " ★" : ""}</button>`; }).join("")}</div>`;
    } else {
      body = A.workStyle.map((q, qi) => `<p style="margin:.8rem 0 .4rem;font-weight:600">${esc(q.question)}</p><div class="chips">${q.options.map((o, oi) => `<button type="button" class="chip" data-q="${qi}" data-i="${oi}" aria-pressed="${state.work[qi] === oi}">${esc(o.label)}</button>`).join("")}</div>`).join("");
    }
    root.innerHTML = `
      <div class="quiz-step">
        <h4>Step ${step + 1} of ${steps.length}: ${esc(s.title)}</h4>
        <p class="hint">${esc(s.hint)}</p>${body}
      </div>
      <div class="quiz-progress"><span style="width:${((step + 1) / steps.length) * 100}%"></span></div>
      <div class="quiz-nav">
        <button type="button" class="btn btn-outline-light btn-sm" data-act="back" ${step === 0 ? "disabled" : ""}>Back</button>
        <button type="button" class="btn btn-gold btn-sm" data-act="next">${step === steps.length - 1 ? "See my result" : "Next"}</button>
      </div>`;
  }

  function score() {
    const sc = Object.fromEntries(keys.map((k) => [k, 0]));
    const add = (clusters, pts) => clusters.forEach((c) => { sc[c] += pts; });
    state.interests.forEach((i) => add(A.interests[i].clusters, 1));
    state.abilities.forEach((i) => add(A.abilities[i].clusters, 1));
    Object.entries(state.values).forEach(([i, lv]) => add(A.values[i].clusters, lv));
    Object.entries(state.work).forEach(([qi, oi]) => add(A.workStyle[qi].options[oi].clusters, 1));
    return sc;
  }

  function renderResult() {
    const sc = score();
    const ranked = keys.slice().sort((a, b) => sc[b] - sc[a]);
    const max = Math.max(1, ...Object.values(sc));
    if (sc[ranked[0]] === 0) {
      root.innerHTML = `<p>You didn't select anything yet — go back and tap the options that describe you.</p><button class="btn btn-gold btn-sm" data-act="restart">Start again</button>`;
      return;
    }
    const top = ranked.slice(0, 2).map((k) => { const c = A.clusters[k]; return `
      <div class="result-card">
        <h4 style="color:var(--charcoal)"><span class="code">${esc(c.code)}</span>${esc(c.name)}</h4>
        <p><strong>Example careers:</strong> ${esc(c.careers)}</p>
        <p><strong>Next step:</strong> ${esc(c.nextSteps)}</p>
      </div>`; }).join("");
    root.innerHTML = `
      <h4 style="color:var(--gold)">Your top 2 career clusters</h4>${top}
      <div class="bars">${ranked.map((k) => `<div class="bar"><span>${esc(A.clusters[k].code)}. ${esc(A.clusters[k].name.split(",")[0].split("(")[0])}</span><span class="track"><span style="width:${(sc[k] / max) * 100}%"></span></span><span>${sc[k]}</span></div>`).join("")}</div>
      <p class="small" style="opacity:.75;margin-top:1rem">This is a short version. The full tool in the book adds a guidance recommendation and should be completed with a career guide, mentor or parent.</p>
      <div class="form-actions"><a href="#join" class="btn btn-gold btn-sm">Get the book</a><button class="btn btn-outline-light btn-sm" data-act="restart">Start again</button></div>`;
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const s = steps[step]?.id;
    if (b.dataset.act === "next") { if (step < steps.length - 1) { step++; renderStep(); } else renderResult(); return; }
    if (b.dataset.act === "back") { step--; renderStep(); return; }
    if (b.dataset.act === "restart") { state.interests.clear(); state.abilities.clear(); state.values = {}; state.work = {}; step = 0; renderStep(); return; }
    if (!b.classList.contains("chip")) return;
    const i = +b.dataset.i;
    if (s === "interests" || s === "abilities") { state[s].has(i) ? state[s].delete(i) : state[s].add(i); }
    else if (s === "values") { state.values[i] = ((state.values[i] || 0) + 1) % 3; }
    else if (s === "work") { const q = +b.dataset.q; state.work[q] = state.work[q] === i ? undefined : i; if (state.work[q] === undefined) delete state.work[q]; }
    renderStep();
  });
  renderStep();

  /* ---------- success stories ---------- */
  $("#story-grid").innerHTML = D.successStories.map((s) => `
    <article class="story-card reveal">
      <img src="${esc(s.image)}" alt="${esc(s.name)}" loading="lazy">
      <div class="body">
        <span class="cluster">${esc(s.cluster)}</span>
        <h3>${esc(s.headline)}</h3>
        <div class="who">${esc(s.name)}<small>${esc(s.role)}</small></div>
        <blockquote>“${esc(s.quote)}”</blockquote>
        <button class="btn btn-outline btn-sm" data-story="${esc(s.id)}">Read the story</button>
      </div>
    </article>`).join("");

  /* ---------- modals ---------- */
  let lastFocus = null;
  function openModal(id) { lastFocus = document.activeElement; const m = $(id); m.classList.add("open"); m.setAttribute("aria-hidden", "false"); $(".modal-close", m).focus(); document.body.style.overflow = "hidden"; }
  function closeModal(m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; lastFocus?.focus(); }
  $$(".modal").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m || e.target.closest(".modal-close")) closeModal(m); }));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") $$(".modal.open").forEach(closeModal); });

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-story]"); if (!b) return;
    const s = D.successStories.find((x) => x.id === b.dataset.story);
    $("#story-body").innerHTML = `
      <div class="story-full">
        <img src="${esc(s.image)}" alt="${esc(s.name)}">
        <div>
          <span class="pill">${esc(s.cluster)}</span>
          <h2 style="font-size:1.6rem">${esc(s.headline)}</h2>
          <p><strong>${esc(s.name)}</strong> — ${esc(s.role)}<br><span class="muted small">${esc(s.location)}</span></p>
          <div class="badges">${s.badges.map((x) => `<span>${esc(x)}</span>`).join("")}</div>
          <p>${esc(s.summary)}</p>
          ${s.fullStory.map((p) => `<p>${esc(p)}</p>`).join("")}
          <blockquote style="font-family:var(--font-serif);font-style:italic;border-left:4px solid var(--red);padding-left:1rem;margin:1rem 0">“${esc(s.quote)}”</blockquote>
          <p class="small muted">From <em>Career Development: A Path to Wealth</em>.</p>
        </div>
      </div>`;
    openModal("#story-modal");
  });

  /* ---------- gallery ---------- */
  const cats = { all: "All", school: "School Seminars", clubs: "Career Clubs & Mentorship", tvet: "TVET", exhibitions: "Exhibitions & Enterprise" };
  const used = new Set(D.galleryItems.map((g) => g.category));
  $("#gallery-filters").innerHTML = Object.entries(cats).filter(([k]) => k === "all" || used.has(k))
    .map(([k, v]) => `<button class="filter-btn ${k === "all" ? "active" : ""}" data-cat="${k}">${esc(v)}</button>`).join("");
  function renderGallery(cat) {
    $("#gallery-grid").innerHTML = D.galleryItems.filter((g) => cat === "all" || g.category === cat).map((g) => `
      <button class="gallery-item" data-gal="${esc(g.id)}" aria-label="${esc(g.title)}">
        <img src="${esc(g.image)}" alt="" loading="lazy"><span class="cap">${esc(g.title)}</span>
      </button>`).join("");
  }
  $("#gallery-filters").addEventListener("click", (e) => {
    const b = e.target.closest(".filter-btn"); if (!b) return;
    $$(".filter-btn").forEach((x) => x.classList.toggle("active", x === b));
    renderGallery(b.dataset.cat);
  });
  $("#gallery-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-gal]"); if (!b) return;
    const g = D.galleryItems.find((x) => x.id === b.dataset.gal);
    $("#lightbox-body").innerHTML = `<img src="${esc(g.image)}" alt="${esc(g.title)}"><h3 style="margin-top:1rem">${esc(g.title)}</h3><p class="muted small">${esc(g.location)}</p><p>${esc(g.description)}</p>`;
    openModal("#lightbox");
  });
  renderGallery("all");

  /* ---------- tiers + payment modal ---------- */
  $("#tiers").innerHTML = D.impactTiers.map((t) => `
    <article class="tier-card ${t.featured ? "featured" : ""} reveal">
      <span class="badge">${esc(t.badge)}</span>
      <h3>${esc(t.title)}</h3>
      <div class="price">${esc(t.priceFormatted)}</div>
      <div class="aud">${esc(t.audience)}</div>
      <p class="muted small" style="margin-top:.6rem">${esc(t.description)}</p>
      <ul>${t.perks.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      <button class="btn ${t.featured ? "btn-red" : "btn-outline"}" data-open-pay="${esc(t.id)}">${esc(t.ctaLabel)}</button>
    </article>`).join("");

  const P = D.payments;
  const row = (label, value, copy = true) => `<div class="kv-row"><div><small>${esc(label)}</small><strong>${esc(value)}</strong></div>${copy ? `<button class="copy-btn" data-copy="${esc(value)}">Copy</button>` : ""}</div>`;
  $("#pane-bank").innerHTML = `<div class="kv">
    ${row("Bank", `${P.bank.bankName}, ${P.bank.branch}`, false)}
    ${row("Account name", P.bank.accountName)}
    ${row("UGX account no.", P.bank.ugxAccount)}
    ${row("USD account no. (international donors)", P.bank.usdAccount)}
  </div>`;
  const momo = (m, cls) => `<div class="momo-card ${cls}"><div><strong>${esc(m.provider)}</strong><br>${m.merchantCode ? `<span class="small">Merchant code: <strong>${esc(m.merchantCode)}</strong></span>` : `<span class="small muted">Merchant code coming soon</span>`}</div>${m.merchantCode ? `<button class="copy-btn" data-copy="${esc(m.merchantCode)}">Copy</button>` : `<span class="tag">Pending</span>`}</div>`;
  $("#pane-momo").innerHTML = momo(P.mobileMoney.mtn, "momo-mtn") + momo(P.mobileMoney.airtel, "momo-airtel") +
    ((P.mobileMoney.mtn.merchantCode || P.mobileMoney.airtel.merchantCode) ? "" : `<p class="small muted">Our Mobile Money merchant codes are being finalised. Meanwhile please use bank transfer, or call <a href="tel:+${C.primaryPhoneClean}">${esc(C.phones[0])}</a>.</p>`);

  $$(".pay-tabs button").forEach((b) => b.addEventListener("click", () => {
    $$(".pay-tabs button").forEach((x) => x.classList.toggle("active", x === b));
    $("#pane-bank").hidden = b.dataset.tab !== "bank";
    $("#pane-momo").hidden = b.dataset.tab !== "momo";
  }));

  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-copy]");
    if (c) {
      const text = c.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast(`Copied: ${text}`), () => toast(text));
      return;
    }
    const b = e.target.closest("[data-open-pay]"); if (!b) return;
    e.preventDefault();
    const t = D.impactTiers.find((x) => x.id === b.dataset.openPay);
    const label = t ? `${t.title} — ${t.priceFormatted}` : "Donation to CDSU — any amount";
    $("#pay-title").textContent = t ? t.ctaLabel : "Donate to CDSU";
    $("#pay-summary").textContent = label;
    const note = `Hello CDSU, I have paid for: ${label}.\nName: \nTransaction reference: `;
    $("#pay-confirm").innerHTML = `<a class="btn btn-red btn-sm" target="_blank" rel="noopener" href="${waLink(note)}">Confirm via WhatsApp</a><a class="btn btn-outline btn-sm" href="${mailLink("Payment confirmation: " + label, note)}">Confirm via Email</a>`;
    openModal("#pay-modal");
  });

  /* ---------- authors ---------- */
  $("#authors").innerHTML = D.authors.map((a) => `
    <article class="author-card reveal">
      <img src="${esc(a.image)}" alt="${esc(a.name)}" loading="lazy">
      <div class="body">
        <h4>${esc(a.name)}</h4>
        <div class="role">${esc(a.role)}</div>
        <details><summary>Profile</summary><p>${esc(a.credentials)}</p><p>${esc(a.bio)}</p></details>
      </div>
    </article>`).join("");
  $("#reviewers").innerHTML = D.reviewBoard.map((r) => `<li><strong>${esc(r.name)}</strong><small>${esc(r.role)}</small></li>`).join("");

  /* ---------- contact ---------- */
  const ico = { pin: "📍", phone: "📞", wa: "💬", mail: "✉️" };
  $("#contact-list").innerHTML = `
    <li><span class="ico">${ico.pin}</span><div><strong>Physical address</strong>${esc(C.physicalAddress)}</div></li>
    <li><span class="ico">${ico.phone}</span><div><strong>Telephone</strong>${C.phones.map((p) => `<a href="tel:${p.replace(/\s/g, "")}">${esc(p)}</a>`).join(" / ")}</div></li>
    <li><span class="ico">${ico.wa}</span><div><strong>WhatsApp only</strong><a href="https://wa.me/${C.whatsappClean}" target="_blank" rel="noopener">${esc(C.whatsappNumber)}</a></div></li>
    <li><span class="ico">${ico.mail}</span><div><strong>Email</strong><a href="mailto:${esc(C.emailPrimary)}">${esc(C.emailPrimary)}</a></div></li>`;
  $("#footer-contact").insertAdjacentHTML("beforeend", `
    <p>${esc(C.physicalAddress)}</p>
    <a href="tel:${C.phones[0].replace(/\s/g, "")}">${esc(C.phones[0])}</a>
    <a href="https://wa.me/${C.whatsappClean}" target="_blank" rel="noopener">WhatsApp: ${esc(C.whatsappNumber)}</a>
    <a href="mailto:${esc(C.emailPrimary)}">${esc(C.emailPrimary)}</a>`);

  /* ---------- scroll reveal + active nav ---------- */
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => { 
      if (en.isIntersecting || en.intersectionRatio > 0) { 
        en.target.classList.add("in"); 
        io.unobserve(en.target); 
      } 
    }), { threshold: 0.01, rootMargin: "0px 0px 300px 0px" });
    // Fallback: automatically reveal all cards after 1.5s if not triggered
    setTimeout(() => { $$(".reveal:not(.in)").forEach((el) => el.classList.add("in")); }, 1500);
    $$(".reveal").forEach((el) => io.observe(el));
    const links = $$("#site-nav a[href^='#']");
    const so = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => so.observe(s));
  } else {
    $$(".reveal").forEach((el) => el.classList.add("in"));
  }
})();
