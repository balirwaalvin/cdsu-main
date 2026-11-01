/* CDSU multi-page site — renders page-specific and shared components from window.CDSU_DATA (js/cdsuData.js). */
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
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- simple text bindings ---------- */
  $$("[data-bind]").forEach((el) => { el.textContent = get(el.dataset.bind) ?? ""; });

  /* ---------- header & active page nav ---------- */
  const navToggle = $(".nav-toggle");
  const nav = $("#site-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open);
    });
    $$("#site-nav a").forEach((a) => a.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }));

    const rawSegment = (location.pathname.split("/").filter(Boolean).pop() || "index.html").toLowerCase();
    const currentSlug = rawSegment.replace(/\.html$/, "") || "index";
    $$("#site-nav a").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("?")[0].split("#")[0].toLowerCase();
      const hrefSlug = href.replace(/\.html$/, "") || "index";
      const isMatch = hrefSlug === currentSlug;
      a.classList.toggle("active", isMatch);
      if (isMatch) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  /* ---------- home hero continuous automatic slide-over loop ---------- */
  const heroSlider = $("#hero-slider");
  if (heroSlider) {
    const track = $(".hero-track", heroSlider);
    const slides = $$(".hero-slide", heroSlider);
    const count = slides.length;
    const INTERVAL = 5200;
    const TRANSITION_CSS = "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)";
    let pos = 0;

    if (track && count > 1) {
      // Append a seamless clone of the first slide so the loop always slides right-to-left continuously
      const firstClone = slides[0].cloneNode(true);
      firstClone.setAttribute("aria-hidden", "true");
      track.appendChild(firstClone);

      const stepLoop = () => {
        pos += 1;
        track.style.transition = TRANSITION_CSS;
        track.style.transform = `translateX(-${pos * 100}%)`;

        if (pos === count) {
          setTimeout(() => {
            track.style.transition = "none";
            pos = 0;
            track.style.transform = "translateX(0%)";
          }, 920);
        }
      };

      setInterval(stepLoop, INTERVAL);
    }
  }

  /* ---------- official sponsors showcase (one slide per sponsor, in its own brand colours) ---------- */
  const showcase = $("#sponsor-showcase");
  if (showcase && D.sponsors.length) {
    const svg = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
    const spIco = {
      calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
      pin: svg('<path d="M12 21s-7-5.686-7-11a7 7 0 1 1 14 0c0 5.314-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
      phone: svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
      out: svg('<path d="M7 17 17 7"/><path d="M8 7h9v9"/>'),
      gear: `<svg viewBox="0 0 100 100" aria-hidden="true"><path fill="currentColor" d="M43 2h14l2 11a38 38 0 0 1 9 4l9-7 10 10-7 9a38 38 0 0 1 4 9l11 2v14l-11 2a38 38 0 0 1-4 9l7 9-10 10-9-7a38 38 0 0 1-9 4l-2 11H43l-2-11a38 38 0 0 1-9-4l-9 7-10-10 7-9a38 38 0 0 1-4-9L5 57V43l11-2a38 38 0 0 1 4-9l-7-9 10-10 9 7a38 38 0 0 1 9-4zM50 30a20 20 0 1 0 0 40 20 20 0 1 0 0-40z"/></svg>`
    };
    const visual = (sp) =>
      sp.theme === "seeta"
        ? `<div class="sp-visual sp-visual-photos">
            <img class="sp-photo-main" src="${esc(sp.photos[0].src)}" alt="${esc(sp.photos[0].alt)}" loading="lazy">
            <img class="sp-photo-inset" src="${esc(sp.photos[1].src)}" alt="${esc(sp.photos[1].alt)}" loading="lazy">
          </div>`
        : `<div class="sp-visual sp-visual-mark">
            <span class="sp-gear sp-gear-a">${spIco.gear}</span><span class="sp-gear sp-gear-b">${spIco.gear}</span>
            <img src="${esc(sp.logo)}" alt="${esc(sp.logoAlt)}" loading="lazy">
          </div>`;
    const slide = (sp, i) => `
      <article class="sp-slide ${i === 0 ? "is-active" : ""}" data-theme="${esc(sp.theme)}" id="sp-slide-${i}" role="tabpanel" aria-labelledby="sp-tab-${i}" ${i === 0 ? "" : 'aria-hidden="true"'}>
        <div class="sp-copy">
          <span class="sp-kicker">${esc(sp.kicker)}</span>
          ${sp.theme === "seeta"
            ? `<h3 class="sp-name sp-name-logo"><img src="${esc(sp.logo)}" alt="${esc(sp.logoAlt)}"><span class="sr-only">${esc(sp.name)}</span></h3>`
            : `<h3 class="sp-name">${esc(sp.name)}${sp.shortName ? ` <span>(${esc(sp.shortName)})</span>` : ""}</h3>`}
          <p class="sp-headline">${esc(sp.headline)}</p>
          <p class="sp-summary">${esc(sp.summary)}</p>
          <small class="sp-label">${esc(sp.highlightsLabel)}</small>
          <ul class="sp-chips">${sp.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
          <div class="sp-foot">
            <ul class="sp-facts">${sp.facts.map((f) => `<li>${spIco[f.icon]}<span><small>${esc(f.label)}</small>${esc(f.value)}</span></li>`).join("")}</ul>
            <a class="btn sp-cta" href="${esc(sp.url)}" target="_blank" rel="noopener">Visit ${esc(sp.urlLabel)} ${spIco.out}</a>
          </div>
        </div>
        ${visual(sp)}
      </article>`;
    showcase.innerHTML = `
      <div class="sp-head">
        <div>
          <span class="pill">Our official sponsors</span>
          <h2>Proudly supported by</h2>
        </div>
        <div class="sp-controls">
          <div class="sp-tabs" role="tablist" aria-label="Official sponsors">${D.sponsors
            .map((sp, i) => `<button type="button" class="sp-tab" role="tab" id="sp-tab-${i}" aria-controls="sp-slide-${i}" aria-selected="${i === 0}" data-i="${i}">${esc(sp.shortName || sp.name)}<span class="sp-progress"></span></button>`)
            .join("")}</div>
        </div>
      </div>
      <div class="sp-stage">${D.sponsors.map(slide).join("")}</div>`;

    const spSlides = $$(".sp-slide", showcase);
    const spTabs = $$(".sp-tab", showcase);
    const DWELL = 8000;
    let current = 0;
    let timer = null;
    const show = (i) => {
      current = (i + spSlides.length) % spSlides.length;
      spSlides.forEach((el, k) => {
        el.classList.toggle("is-active", k === current);
        el.toggleAttribute("aria-hidden", k !== current);
      });
      spTabs.forEach((t, k) => t.setAttribute("aria-selected", k === current));
      // restart the progress line on the active tab
      showcase.classList.remove("is-timing");
      void showcase.offsetWidth;
      if (timer) showcase.classList.add("is-timing");
    };
    const stop = () => { clearInterval(timer); timer = null; showcase.classList.remove("is-timing"); };
    // Loops continuously; it only holds still while keyboard focus is inside it, so it can be read.
    const start = () => {
      if (spSlides.length < 2) return;
      stop();
      showcase.style.setProperty("--sp-dwell", `${DWELL}ms`);
      timer = setInterval(() => show(current + 1), DWELL);
      showcase.classList.add("is-timing");
    };
    showcase.addEventListener("click", (e) => {
      const tab = e.target.closest(".sp-tab");
      if (!tab) return;
      show(+tab.dataset.i);
      start();
    });
    showcase.addEventListener("focusin", (e) => { if (e.target.matches(":focus-visible")) stop(); });
    showcase.addEventListener("focusout", (e) => { if (!showcase.contains(e.relatedTarget)) start(); });
    start();
  }

  /* ---------- rules to a super career ---------- */
  const rulesEl = $("#rules-grid");
  if (rulesEl && D.organization.rulesToSuperCareer) {
    rulesEl.innerHTML = D.organization.rulesToSuperCareer
      .map(
        (r) => `
      <article class="rule-card reveal">
        <div class="num">${esc(r.number)}</div>
        <h4>${esc(r.title)}</h4>
        <p>${esc(r.detail)}</p>
      </article>`
      )
      .join("");
  }

  /* ---------- about: who CDSU is ---------- */
  const whoEl = $("#who-we-are");
  if (whoEl) {
    const W = D.organization.whoWeAre;
    const deputy = W.deputyExecutiveDirector ? `, deputised by the Deputy Executive Director, ${W.deputyExecutiveDirector}` : "";
    const oversight = `The Executive Committee plays an advisory and oversight role, with the Executive Director, ${W.executiveDirector}, at the helm${deputy}.`;
    whoEl.innerHTML = `
      <h3>Who CDSU Is</h3>
      <p>${esc(W.intro)}</p>
      <p>${esc(W.committee)} ${esc(oversight)}</p>
      <p>Its motto is <em class="who-motto">“${esc(D.organization.motto)}”</em> ${esc(W.reach)}</p>`;
  }

  /* ---------- objectives ---------- */
  const objEl = $("#objectives");
  if (objEl) {
    objEl.innerHTML = D.organization.coreObjectives
      .map(
        (o, i) => `
      <article class="obj-card reveal">
        <div class="num">0${i + 1}</div>
        <h4>${esc(o.title)}</h4>
        <ul>${o.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      </article>`
      )
      .join("");
  }

  /* ---------- programme phases ---------- */
  const tabs = $("#phase-tabs");
  const phasePanel = $("#phase-panel");
  if (tabs && phasePanel) {
    tabs.innerHTML = D.cdpPhases
      .map(
        (p, i) => `
      <button class="phase-tab" role="tab" id="phase-tab-${i}" aria-controls="phase-panel" aria-selected="${i === 0}" data-i="${i}" data-color="${esc(p.color)}">
        <small>${esc(p.badge)}</small><strong>${esc(p.title)}</strong>
      </button>`
      )
      .join("");
    const showPhase = (i) => {
      const p = D.cdpPhases[i];
      $$(".phase-tab", tabs).forEach((t) => t.setAttribute("aria-selected", t.dataset.i == i));
      phasePanel.setAttribute("aria-labelledby", `phase-tab-${i}`);
      phasePanel.innerHTML = `<h3>${esc(p.phaseCode)}: ${esc(p.title)}</h3><p>${esc(p.summary)}</p><ul>${p.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`;
    };
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest(".phase-tab");
      if (b) showPhase(+b.dataset.i);
    });
    showPhase(0);
  }

  /* ---------- products ---------- */
  const productsEl = $("#products");
  if (productsEl) {
    const topicMap = {
      1: "book.html",
      2: "contact.html?topic=" + encodeURIComponent("Referring a school or institution"),
      3: "contact.html?topic=" + encodeURIComponent("General enquiry"),
      4: "contact.html?topic=" + encodeURIComponent("General enquiry"),
      5: "contact.html?topic=" + encodeURIComponent("Becoming a sponsor / partner")
    };
    productsEl.innerHTML = D.products
      .map((p) => {
        const href = topicMap[p.id] || "contact.html";
        return `
      <article class="product-card reveal">
        <div class="num">${p.id}</div>
        <h4>${esc(p.title)}</h4>
        <p>${esc(p.description)}</p>
        <a href="${href}" class="btn btn-outline btn-sm">${esc(p.ctaText)}</a>
      </article>`;
      })
      .join("");
  }

  /* ---------- national seminar (home teaser + programme page details) ---------- */
  const S = D.seminar;
  if (S) {
    const svg = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
    const sIco = {
      calendar: svg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
      pin: svg('<path d="M12 21s-7-5.686-7-11a7 7 0 1 1 14 0c0 5.314-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
      users: svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
      ticket: svg('<path d="M3 9a3 3 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a3 3 0 0 0 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M13 5v2M13 11v2M13 17v2"/>'),
      star: svg('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),
      book: svg('<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>'),
      bulb: svg('<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.74V17h8v-2.26A7 7 0 0 0 12 2z"/>'),
      target: svg('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
      layers: svg('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),
      award: svg('<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>')
    };
    const registerHref = `contact.html?topic=${encodeURIComponent(S.registerTopic)}`;

    const teaserEl = $("#seminar-teaser");
    if (teaserEl) {
      teaserEl.innerHTML = `
      <div class="event-card">
        <div class="event-date"><span>${esc(S.dateBadge.month)}</span><strong>${esc(S.dateBadge.days)}</strong><span>${esc(S.dateBadge.year)}</span></div>
        <div class="event-body">
          <span class="event-kicker">Upcoming national seminar</span>
          <h3>${esc(S.title)} <span>${esc(S.audience)}</span></h3>
          <ul class="event-facts">
            <li>${sIco.pin}${esc(S.venue)}</li>
            <li>${sIco.users}${esc(S.participants)}</li>
            <li>${sIco.star}Keynote: ${esc(S.keynote.name)}</li>
            <li>${sIco.ticket}${esc(S.fee)}${S.feeNote ? ` <em class="fee-note">· ${esc(S.feeNote)}</em>` : ""}</li>
          </ul>
        </div>
        <div class="event-actions">
          <a class="btn btn-primary btn-sm" href="programme.html#seminar">Seminar details</a>
          <a class="btn btn-outline btn-sm" href="${registerHref}">Register interest</a>
        </div>
      </div>`;
    }

    const detailEl = $("#seminar-detail");
    if (detailEl) {
      const fact = (icon, label, value, note) =>
        `<div class="seminar-fact"><span class="icon-disc">${sIco[icon]}</span><div><small>${esc(label)}</small><strong>${esc(value)}</strong>${note ? `<em class="fee-note">${esc(note)}</em>` : ""}</div></div>`;
      const person = (label, p, talk) =>
        `<div class="speaker"><small>${esc(label)}</small><strong>${esc(p.name)}</strong><span>${esc(p.role)}</span>${talk ? `<em>“${esc(talk)}”</em>` : ""}</div>`;
      detailEl.innerHTML = `
      <div class="section-head">
        <span class="pill">Upcoming national seminar</span>
        <h2>${esc(S.title)}</h2>
        <p><strong>${esc(S.audience.replace(/^for /, "For "))}.</strong> ${esc(S.tagline)}</p>
      </div>
      <div class="seminar-facts">
        ${fact("calendar", "Dates", S.dates)}
        ${fact("pin", "Venue", S.venue)}
        ${fact("users", "Participants", S.participants)}
        ${fact("ticket", "Registration fee", S.fee, S.feeNote)}
      </div>
      <div class="seminar-grid">
        <div class="seminar-panel">
          <h3>Seminar objectives</h3>
          <ol class="seminar-list seminar-objectives">${S.objectives.map((o) => `<li>${esc(o)}</li>`).join("")}</ol>
          <h3>Key topics</h3>
          <ul class="seminar-list seminar-topics">${S.topics.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
          <h3>Key features</h3>
          <ul class="seminar-features">${S.features.map((f) => `<li><span class="icon-disc">${sIco[f.icon]}</span>${esc(f.text)}</li>`).join("")}</ul>
        </div>
        <aside class="seminar-panel seminar-people">
          ${person("Keynote speaker", S.keynote, S.keynote.talk)}
          ${person("Guest of honour", S.guestOfHonour)}
          ${person("Technical leadership", S.technicalLead)}
          <p class="seminar-note">${esc(S.participantsNote)}</p>
          <div class="seminar-ctas">
            <a class="btn btn-primary" href="${registerHref}">Register your interest</a>
            <a class="btn btn-outline" href="${waLink(`Hello CDSU, I have a question about the ${S.title} (${S.dates}).`)}" target="_blank" rel="noopener">Ask on WhatsApp</a>
          </div>
        </aside>
      </div>
      <p class="seminar-closing">${esc(S.closing)}</p>`;
    }
  }

  /* ---------- endorsements ---------- */
  const endorseEl = $("#endorsements");
  if (endorseEl) {
    const initials = (n) =>
      n
        .replace(/^(Prof\.|Dr\.|Mr\.|Ms\.)\s*/, "")
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("");
    endorseEl.innerHTML = D.endorsements
      .map(
        (e) => `
      <article class="endorse-card reveal">
        <blockquote>${esc(e.quote)}</blockquote>
        <div class="endorser">
          ${e.image ? `<img src="${esc(e.image)}" alt="${esc(e.name)}">` : `<span class="avatar">${esc(initials(e.name))}</span>`}
          <div><strong>${esc(e.name)}</strong><small>${esc(e.title)}</small></div>
        </div>
      </article>`
      )
      .join("");
  }

  /* ---------- chapters accordion ---------- */
  const chaptersEl = $("#chapters");
  if (chaptersEl) {
    chaptersEl.innerHTML = D.bookChapters
      .map(
        (c, i) => `
      <div class="acc-item ${i === 0 ? "open" : ""}">
        <button class="acc-btn" aria-expanded="${i === 0}" aria-controls="acc-${i}">
          <span class="ch">${esc(c.number.replace("Chapter ", "Ch "))}</span><span class="t">${esc(c.title)}</span><span class="chev" aria-hidden="true">▾</span>
        </button>
        <div class="acc-body" id="acc-${i}"><p>${esc(c.summary)}</p><ul>${c.keyTakeaways.map((k) => `<li>${esc(k)}</li>`).join("")}</ul></div>
      </div>`
      )
      .join("");
    chaptersEl.addEventListener("click", (e) => {
      const b = e.target.closest(".acc-btn");
      if (!b) return;
      const item = b.parentElement;
      const open = item.classList.toggle("open");
      b.setAttribute("aria-expanded", open);
    });
  }

  /* ---------- forms (hand off to WhatsApp or email) ---------- */
  function wireForm(form, build) {
    if (!form) return;
    let channel = "whatsapp";
    $$("button[data-channel]", form).forEach((b) =>
      b.addEventListener("click", () => {
        channel = b.dataset.channel;
      })
    );
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = $(".form-msg", form);
      let ok = true;
      $$("[required]", form).forEach((f) => {
        const bad = !f.value.trim();
        f.classList.toggle("invalid", bad);
        if (bad) ok = false;
      });
      if (!ok) {
        if (msg) msg.textContent = "Please fill in the highlighted fields.";
        return;
      }
      const { subject, body } = build(Object.fromEntries(new FormData(form)));
      window.open(channel === "whatsapp" ? waLink(body) : mailLink(subject, body), "_blank", "noopener");
      if (msg) msg.textContent = channel === "whatsapp" ? "Opening WhatsApp with your message…" : "Opening your email app…";
    });
  }

  wireForm($("#access-form"), (v) => ({
    subject: "CDP Access Code Request",
    body: `Hello CDSU, I would like to register my book serial number for a CDP access code.\n\nName: ${v.name}\nSchool/Community: ${v.org || "-"}\nContact: ${v.contact}\nSerial number: ${v.serial}`
  }));

  const contactForm = $("#contact-form");
  if (contactForm) {
    const params = new URLSearchParams(location.search);
    const topicParam = params.get("topic");
    if (topicParam) {
      const sel = $("select[name=topic]", contactForm);
      if (sel) {
        [...sel.options].forEach((o) => {
          if (o.text.toLowerCase() === topicParam.toLowerCase()) sel.value = o.text;
        });
      }
    }
    wireForm(contactForm, (v) => ({
      subject: `CDSU Website: ${v.topic}`,
      body: `Hello CDSU,\n\nTopic: ${v.topic}\nName: ${v.name}\nContact: ${v.contact}\n\n${v.message}`
    }));
  }

  /* ---------- career cluster quiz (Annexure 3, short form) ---------- */
  const root = $("#quiz-root");
  if (root) {
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

    const renderStep = () => {
      const s = steps[step];
      let body = "";
      if (s.id === "interests" || s.id === "abilities") {
        body = `<div class="chips">${A[s.id].map((it, i) => `<button type="button" class="chip" data-i="${i}" aria-pressed="${state[s.id].has(i)}">${esc(it.label)}</button>`).join("")}</div>`;
      } else if (s.id === "values") {
        body = `<div class="chips">${A.values.map((it, i) => {
          const lv = state.values[i] || 0;
          return `<button type="button" class="chip" data-i="${i}" data-level="${lv}" aria-label="${esc(it.label)}: ${["not selected", "important", "very important"][lv]}">${esc(it.label)}${lv === 2 ? " ★★" : lv === 1 ? " ★" : ""}</button>`;
        }).join("")}</div>`;
      } else {
        body = A.workStyle
          .map(
            (q, qi) =>
              `<p style="margin:.8rem 0 .4rem;font-weight:600">${esc(q.question)}</p><div class="chips">${q.options
                .map((o, oi) => `<button type="button" class="chip" data-q="${qi}" data-i="${oi}" aria-pressed="${state.work[qi] === oi}">${esc(o.label)}</button>`)
                .join("")}</div>`
          )
          .join("");
      }
      root.innerHTML = `
        <div class="quiz-step">
          <h4>Step ${step + 1} of ${steps.length}: ${esc(s.title)}</h4>
          <p class="hint">${esc(s.hint)}</p>${body}
        </div>
        <div class="quiz-progress"><span style="width:${((step + 1) / steps.length) * 100}%"></span></div>
        <div class="quiz-nav">
          <button type="button" class="btn btn-outline-light btn-sm" data-act="back" ${step === 0 ? "disabled" : ""}>Back</button>
          <button type="button" class="btn btn-primary btn-sm" data-act="next">${step === steps.length - 1 ? "See my result" : "Next"}</button>
        </div>`;
    };

    const score = () => {
      const sc = Object.fromEntries(keys.map((k) => [k, 0]));
      const add = (clusters, pts) => clusters.forEach((c) => { sc[c] += pts; });
      state.interests.forEach((i) => add(A.interests[i].clusters, 1));
      state.abilities.forEach((i) => add(A.abilities[i].clusters, 1));
      Object.entries(state.values).forEach(([i, lv]) => add(A.values[i].clusters, lv));
      Object.entries(state.work).forEach(([qi, oi]) => add(A.workStyle[qi].options[oi].clusters, 1));
      return sc;
    };

    const renderResult = () => {
      const sc = score();
      const ranked = keys.slice().sort((a, b) => sc[b] - sc[a]);
      const max = Math.max(1, ...Object.values(sc));
      if (sc[ranked[0]] === 0) {
        root.innerHTML = `<p>You didn't select anything yet — go back and tap the options that describe you.</p><button class="btn btn-primary btn-sm" data-act="restart">Start again</button>`;
        return;
      }
      const top = ranked
        .slice(0, 2)
        .map((k) => {
          const c = A.clusters[k];
          return `
        <div class="result-card">
          <h4><span class="code">${esc(c.code)}</span>${esc(c.name)}</h4>
          <p><strong>Example careers:</strong> ${esc(c.careers)}</p>
          <p><strong>Next step:</strong> ${esc(c.nextSteps)}</p>
        </div>`;
        })
        .join("");
      root.innerHTML = `
        <h4 style="color:var(--white)">Your top 2 career clusters</h4>${top}
        <div class="bars">${ranked
          .map(
            (k) =>
              `<div class="bar"><span>${esc(A.clusters[k].code)}. ${esc(A.clusters[k].name.split(",")[0].split("(")[0])}</span><span class="track"><span style="width:${(sc[k] / max) * 100}%"></span></span><span>${sc[k]}</span></div>`
          )
          .join("")}</div>
        <p class="small" style="opacity:.75;margin-top:1rem">This is a short version. The full tool in the book adds a guidance recommendation and should be completed with a career guide, mentor or parent.</p>
        <div class="form-actions"><a href="join.html" class="btn btn-primary btn-sm">Get the book</a><button class="btn btn-outline-light btn-sm" data-act="restart">Start again</button></div>`;
    };

    root.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      const s = steps[step]?.id;
      if (b.dataset.act === "next") {
        if (step < steps.length - 1) {
          step++;
          renderStep();
        } else renderResult();
        return;
      }
      if (b.dataset.act === "back") {
        step--;
        renderStep();
        return;
      }
      if (b.dataset.act === "restart") {
        state.interests.clear();
        state.abilities.clear();
        state.values = {};
        state.work = {};
        step = 0;
        renderStep();
        return;
      }
      if (!b.classList.contains("chip")) return;
      const i = +b.dataset.i;
      if (s === "interests" || s === "abilities") {
        state[s].has(i) ? state[s].delete(i) : state[s].add(i);
      } else if (s === "values") {
        state.values[i] = ((state.values[i] || 0) + 1) % 3;
      } else if (s === "work") {
        const q = +b.dataset.q;
        state.work[q] = state.work[q] === i ? undefined : i;
        if (state.work[q] === undefined) delete state.work[q];
      }
      renderStep();
    });
    renderStep();
  }

  /* ---------- modals ---------- */
  let lastFocus = null;
  function openModal(id) {
    const m = $(id);
    if (!m) return;
    lastFocus = document.activeElement;
    m.classList.add("open");
    m.setAttribute("aria-hidden", "false");
    $(".modal-close", m)?.focus();
    document.body.style.overflow = "hidden";
  }
  function closeModal(m) {
    m.classList.remove("open");
    m.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocus?.focus();
  }
  $$(".modal").forEach((m) =>
    m.addEventListener("click", (e) => {
      if (e.target === m || e.target.closest(".modal-close")) closeModal(m);
    })
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $$(".modal.open").forEach(closeModal);
  });

  /* ---------- success stories ---------- */
  const storyGrid = $("#story-grid");
  if (storyGrid) {
    const limit = storyGrid.dataset.limit ? +storyGrid.dataset.limit : D.successStories.length;
    storyGrid.innerHTML = D.successStories
      .slice(0, limit)
      .map(
        (s) => `
      <article class="story-card reveal">
        <img src="${esc(s.image)}" alt="${esc(s.name)}" loading="lazy">
        <div class="body">
          <span class="cluster">${esc(s.cluster)}</span>
          <h3>${esc(s.headline)}</h3>
          <div class="who">${esc(s.name)}<small>${esc(s.role)}</small></div>
          <blockquote>“${esc(s.quote)}”</blockquote>
          <button class="btn btn-outline btn-sm" data-story="${esc(s.id)}">Read the story</button>
        </div>
      </article>`
      )
      .join("");
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-story]");
    if (!b) return;
    const s = D.successStories.find((x) => x.id === b.dataset.story);
    if (!s || !$("#story-body")) return;
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
          <blockquote style="font-family:var(--font-serif);font-style:italic;border-left:3px solid var(--navy);padding-left:1rem;margin:1rem 0">“${esc(s.quote)}”</blockquote>
          <p class="small muted">From <em>Career Development: A Path to Wealth</em>.</p>
        </div>
      </div>`;
    openModal("#story-modal");
  });

  /* ---------- gallery ---------- */
  const galleryGrid = $("#gallery-grid");
  const galleryFilters = $("#gallery-filters");
  if (galleryGrid && galleryFilters) {
    const cats = { all: "All", school: "School Seminars", clubs: "Career Clubs & Mentorship", tvet: "TVET", exhibitions: "Exhibitions & Enterprise" };
    const used = new Set(D.galleryItems.map((g) => g.category));
    galleryFilters.innerHTML = Object.entries(cats)
      .filter(([k]) => k === "all" || used.has(k))
      .map(([k, v]) => `<button class="filter-btn ${k === "all" ? "active" : ""}" data-cat="${k}">${esc(v)}</button>`)
      .join("");
    const renderGallery = (cat) => {
      galleryGrid.innerHTML = D.galleryItems
        .filter((g) => cat === "all" || g.category === cat)
        .map(
          (g) => `
        <button class="gallery-item" data-gal="${esc(g.id)}" aria-label="${esc(g.title)}">
          <img src="${esc(g.image)}" alt="" loading="lazy"><span class="cap">${esc(g.title)}</span>
        </button>`
        )
        .join("");
    };
    galleryFilters.addEventListener("click", (e) => {
      const b = e.target.closest(".filter-btn");
      if (!b) return;
      $$(".filter-btn", galleryFilters).forEach((x) => x.classList.toggle("active", x === b));
      renderGallery(b.dataset.cat);
    });
    galleryGrid.addEventListener("click", (e) => {
      const b = e.target.closest("[data-gal]");
      if (!b) return;
      const g = D.galleryItems.find((x) => x.id === b.dataset.gal);
      if (!g || !$("#lightbox-body")) return;
      $("#lightbox-body").innerHTML = `<img src="${esc(g.image)}" alt="${esc(g.title)}"><h3 style="margin-top:1rem">${esc(g.title)}</h3><p class="muted small">${esc(g.location)}</p><p>${esc(g.description)}</p>`;
      openModal("#lightbox");
    });
    renderGallery("all");
  }

  /* ---------- tiers + payment modal ---------- */
  const tiersEl = $("#tiers");
  if (tiersEl) {
    tiersEl.innerHTML = D.impactTiers
      .map(
        (t) => `
      <article class="tier-card ${t.featured ? "featured" : ""} reveal">
        <span class="badge">${esc(t.badge)}</span>
        <h3>${esc(t.title)}</h3>
        <div class="price">${esc(t.priceFormatted)}</div>
        <div class="aud">${esc(t.audience)}</div>
        <p class="muted small" style="margin-top:.6rem">${esc(t.description)}</p>
        <ul>${t.perks.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <button class="btn ${t.featured ? "btn-primary" : "btn-outline"}" data-open-pay="${esc(t.id)}">${esc(t.ctaLabel)}</button>
      </article>`
      )
      .join("");
  }

  const P = D.payments;
  const row = (label, value, copy = true) =>
    `<div class="kv-row"><div><small>${esc(label)}</small><strong>${esc(value)}</strong></div>${copy ? `<button class="copy-btn" data-copy="${esc(value)}">Copy</button>` : ""}</div>`;
  const bankHtml = `<div class="kv">
    ${row("Bank", P.bank.bankName, false)}
    ${row("Account name", P.bank.accountName)}
    ${row("UGX account no.", P.bank.ugxAccount)}
    ${row("USD account no. (international donors)", P.bank.usdAccount)}
  </div>`;
  const momo = (m, cls) => {
    if (!m.merchantCode) {
      return `<div class="momo-card ${cls}"><div><strong>${esc(m.provider)}</strong><br><span class="small muted">Merchant code coming soon</span></div><span class="tag">Pending</span></div>`;
    }
    // "#" must be percent-encoded or the dialer drops everything after it
    const label = m.codeLabel.replace(/^\w+/, (w) => w.toLowerCase()); // "merchant code" / "merchant ID"
    const dial = `tel:${m.ussd.replace(/#/g, "%23")}`;
    return `<div class="momo-card momo-live ${cls}">
      <div class="momo-top"><strong>${esc(m.provider)}</strong><span class="tag">${esc(m.codeLabel)}</span></div>
      <div class="momo-code" aria-label="${esc(m.codeLabel)} ${esc(m.merchantCode.split("").join(" "))}">${esc(m.merchantCode)}</div>
      <ol class="momo-steps">
        <li>Dial <strong>${esc(m.ussd)}</strong> or open the ${esc(m.app)}</li>
        <li>Enter ${esc(label)} <strong>${esc(m.merchantCode)}</strong></li>
        <li>Enter the amount and confirm with your PIN</li>
      </ol>
      <div class="momo-actions"><a class="btn btn-sm momo-dial" href="${dial}">Dial ${esc(m.ussd)}</a><button class="copy-btn" data-copy="${esc(m.merchantCode)}">Copy ${esc(label)}</button></div>
    </div>`;
  };
  const momoHtml =
    momo(P.mobileMoney.mtn, "momo-mtn") +
    momo(P.mobileMoney.airtel, "momo-airtel") +
    (P.mobileMoney.mtn.merchantCode || P.mobileMoney.airtel.merchantCode
      ? ""
      : `<p class="small muted">Our Mobile Money merchant codes are being finalised. Meanwhile please use bank transfer, or call <a href="tel:+${C.primaryPhoneClean}">${esc(C.phones[0])}</a>.</p>`);

  if ($("#pane-bank")) $("#pane-bank").innerHTML = bankHtml;
  if ($("#pane-momo")) $("#pane-momo").innerHTML = momoHtml;
  if ($("#direct-bank-card")) $("#direct-bank-card").innerHTML = bankHtml;
  if ($("#direct-momo-card")) $("#direct-momo-card").innerHTML = momoHtml;

  $$(".pay-tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      $$(".pay-tabs button").forEach((x) => x.classList.toggle("active", x === b));
      if ($("#pane-bank")) $("#pane-bank").hidden = b.dataset.tab !== "bank";
      if ($("#pane-momo")) $("#pane-momo").hidden = b.dataset.tab !== "momo";
    })
  );

  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-copy]");
    if (c) {
      const text = c.dataset.copy;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(
        () => toast(`Copied: ${text}`),
        () => toast(text)
      );
      return;
    }
    const b = e.target.closest("[data-open-pay]");
    if (!b) return;
    e.preventDefault();
    const t = D.impactTiers.find((x) => x.id === b.dataset.openPay);
    const label = t ? `${t.title} — ${t.priceFormatted}` : "Donation to CDSU — any amount";
    if ($("#pay-title")) $("#pay-title").textContent = t ? t.ctaLabel : "Donate to CDSU";
    if ($("#pay-summary")) $("#pay-summary").textContent = label;
    const note = `Hello CDSU, I have paid for: ${label}.\nName: \nTransaction reference: `;
    if ($("#pay-confirm")) {
      $("#pay-confirm").innerHTML = `<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="${waLink(note)}">Confirm via WhatsApp</a><a class="btn btn-outline btn-sm" href="${mailLink(
        "Payment confirmation: " + label,
        note
      )}">Confirm via Email</a>`;
    }
    openModal("#pay-modal");
  });

  /* ---------- authors ---------- */
  const authorsEl = $("#authors");
  if (authorsEl) {
    authorsEl.innerHTML = D.authors
      .map(
        (a) => `
      <article class="author-card reveal">
        <img src="${esc(a.image)}" alt="${esc(a.name)}" loading="lazy">
        <div class="body">
          <h4>${esc(a.name)}</h4>
          <div class="role">${esc(a.role)}</div>
          <details><summary>Profile</summary><p>${esc(a.credentials)}</p><p>${esc(a.bio)}</p></details>
        </div>
      </article>`
      )
      .join("");
  }
  const reviewersEl = $("#reviewers");
  if (reviewersEl) {
    reviewersEl.innerHTML = D.reviewBoard.map((r) => `<li><strong>${esc(r.name)}</strong><small>${esc(r.role)}</small></li>`).join("");
  }

  /* ---------- contact & footer ---------- */
  const ico = {
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-5.686-7-11a7 7 0 1 1 14 0c0 5.314-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    wa: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/><path d="M9.5 9.5c.3 1.8 1.7 3.2 3.5 3.5l1.2-.8c.3-.2.7-.1.9.1l1.1 1.1c.3.3.3.8 0 1.1-.8.8-2 1.1-3.1.8-2.8-.7-5.1-3-5.8-5.8-.3-1.1 0-2.3.8-3.1.3-.3.8-.3 1.1 0l1.1 1.1c.2.2.3.6.1.9l-.9 1.1z"/></svg>`,
    mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2.5"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`
  };
  const contactListEl = $("#contact-list");
  if (contactListEl) {
    contactListEl.innerHTML = `
      <li><span class="ico ico-pin">${ico.pin}</span><div><strong>Physical address</strong>${esc(C.physicalAddress)}</div></li>
      <li><span class="ico ico-phone">${ico.phone}</span><div><strong>Telephone</strong>${C.phones.map((p) => `<a href="tel:${p.replace(/\s/g, "")}">${esc(p)}</a>`).join(" / ")}</div></li>
      <li><span class="ico ico-wa">${ico.wa}</span><div><strong>WhatsApp only</strong><a href="https://wa.me/${C.whatsappClean}" target="_blank" rel="noopener">${esc(C.whatsappNumber)}</a></div></li>
      <li><span class="ico ico-mail">${ico.mail}</span><div><strong>Email</strong><a href="mailto:${esc(C.emailPrimary)}">${esc(C.emailPrimary)}</a></div></li>`;
  }
  const footerContact = $("#footer-contact");
  if (footerContact && !footerContact.querySelector(".footer-contact-list")) {
    footerContact.insertAdjacentHTML(
      "beforeend",
      `
      <ul class="footer-contact-list">
        <li><span class="f-ico f-ico-pin">${ico.pin}</span><div><strong>Head Office</strong>${esc(C.physicalAddress)}</div></li>
        <li><span class="f-ico f-ico-phone">${ico.phone}</span><div><strong>Telephones</strong>${C.phones.map((p) => `<a href="tel:${p.replace(/\s/g, "")}">${esc(p)}</a>`).join(" / ")}</div></li>
        <li><span class="f-ico f-ico-wa">${ico.wa}</span><div><strong>WhatsApp Only</strong><a href="https://wa.me/${C.whatsappClean}" target="_blank" rel="noopener">${esc(C.whatsappNumber)}</a></div></li>
        <li><span class="f-ico f-ico-mail">${ico.mail}</span><div><strong>Official Email</strong><a href="mailto:${esc(C.emailPrimary)}">${esc(C.emailPrimary)}</a></div></li>
      </ul>`
    );
  }
})();
