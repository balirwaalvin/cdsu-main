/* CDSU online reader: shows the book page by page to signed-in readers with access.
   Pages come from a private bucket through 60-second links, are drawn onto a canvas with the
   reader's identity watermarked into the pixels, and the reading position is saved as they go. */
(function () {
  "use strict";
  const db = window.CDSU_DB;
  const $ = (s) => document.querySelector(s);
  const canvas = $("#page-canvas");
  const ctx = canvas.getContext("2d");
  const stage = $("#reader-stage");
  const status = $("#reader-status");
  const pageInput = $("#page-input");
  const totalEl = $("#page-total");
  const bar = $("#reader-progress span");
  const cache = new Map(); // page number -> ImageBitmap
  let total = 0, page = 1, format = "webp", mark = "", saveTimer = null, fit = "width", rendering = 0;

  const fail = (html) => {
    stage.innerHTML = `<div class="reader-msg">${html}</div>`;
    $("#reader-controls").hidden = true;
  };
  const pad = (n) => String(n).padStart(4, "0");

  async function bitmapFor(n) {
    if (cache.has(n)) return cache.get(n);
    const { data, error } = await db.storage.from("book").createSignedUrl(`pages/${pad(n)}.${format}`, 60);
    if (error) throw error;
    const res = await fetch(data.signedUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Page could not be loaded");
    const bmp = await createImageBitmap(await res.blob());
    cache.set(n, bmp);
    // keep memory small: only the pages around the current one
    for (const k of cache.keys()) if (Math.abs(k - page) > 2) { cache.get(k).close?.(); cache.delete(k); }
    return bmp;
  }

  function drawWatermark(w, h, scale) {
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = "#0B1F54";
    ctx.font = `600 ${Math.round(15 * scale)}px Inter, sans-serif`;
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 6);
    const step = 150 * scale;
    for (let row = 0, y = -h; y < h; row++, y += step) {
      for (let x = -w; x < w; x += 520 * scale) ctx.fillText(mark, x + (row % 2) * 260 * scale, y);
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#4F5A73";
    ctx.font = `${Math.round(10 * scale)}px Inter, sans-serif`;
    ctx.fillText(`Licensed to ${mark} · Not for distribution`, 14 * scale, h - 10 * scale);
    ctx.restore();
  }

  async function render(n) {
    n = Math.min(Math.max(1, n), total);
    page = n;
    const ticket = ++rendering;
    pageInput.value = n;
    bar.style.width = `${(n / total) * 100}%`;
    $("#prev").disabled = n <= 1;
    $("#next").disabled = n >= total;
    status.textContent = "Loading page…";
    try {
      const bmp = await bitmapFor(n);
      if (ticket !== rendering) return;
      const dpr = window.devicePixelRatio || 1;
      const maxW = Math.min(stage.clientWidth - 24, 980);
      const maxH = stage.clientHeight - 24;
      const ratio = bmp.height / bmp.width;
      let cssW = maxW;
      if (fit === "page") cssW = Math.min(maxW, maxH / ratio);
      const cssH = cssW * ratio;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      drawWatermark(canvas.width, canvas.height, (cssW / 700) * dpr);
      status.textContent = "";
      stage.scrollTop = 0;
      saveProgress();
      if (n < total) bitmapFor(n + 1).catch(() => {}); // prefetch the next page
    } catch (err) {
      status.textContent = window.CDSU_ERR(err);
    }
  }

  function saveProgress() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const { data: s } = await db.auth.getSession();
      if (!s.session) return;
      await db.from("reading_progress").upsert({ user_id: s.session.user.id, page, updated_at: new Date().toISOString() });
    }, 1200);
  }

  async function start() {
    if (!db) return fail("The reader couldn't connect. Please refresh the page.");
    const { data: { session } } = await db.auth.getSession();
    if (!session) { location.replace("account.html#book"); return; }
    const [access, meta, progress] = await Promise.all([
      db.from("book_access").select("serial_code, revoked_at").maybeSingle(),
      db.from("book_meta").select("title, total_pages, page_format").maybeSingle(),
      db.from("reading_progress").select("page").maybeSingle()
    ]);
    if (!access.data || access.data.revoked_at) {
      return fail(`<h2>This book isn't unlocked on your account</h2><p>Enter your serial number in <a href="account.html#book">My Account</a> to start reading.</p>`);
    }
    total = meta.data?.total_pages || 0;
    format = meta.data?.page_format || "webp";
    if (!total) return fail(`<h2>The online edition is being prepared</h2><p>Your access is active. Please check back soon — <a href="account.html">back to My Account</a>.</p>`);
    mark = `${session.user.email} · ${access.data.serial_code}`;
    $("#book-title").textContent = meta.data.title;
    totalEl.textContent = total;
    pageInput.max = total;
    render(progress.data?.page || 1);
  }

  // Navigation
  $("#prev").addEventListener("click", () => render(page - 1));
  $("#next").addEventListener("click", () => render(page + 1));
  $("#page-form").addEventListener("submit", (e) => { e.preventDefault(); render(+pageInput.value || 1); });
  $("#fit").addEventListener("click", (e) => {
    fit = fit === "width" ? "page" : "width";
    e.currentTarget.textContent = fit === "width" ? "Fit page" : "Fit width";
    render(page);
  });
  document.addEventListener("keydown", (e) => {
    if (e.target === pageInput) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") render(page + 1);
    if (e.key === "ArrowLeft" || e.key === "PageUp") render(page - 1);
  });
  let touchX = null;
  stage.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 60) render(page + (dx < 0 ? 1 : -1));
    touchX = null;
  });
  let resizeTimer;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => total && render(page), 200); });

  // Discourage copying: no context menu, dragging, saving or printing
  ["contextmenu", "dragstart", "selectstart", "copy"].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault()));
  document.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ["s", "p", "c", "a"].includes(k)) { e.preventDefault(); status.textContent = "Saving, copying and printing are not available for this book."; }
  });
  // Hide the page while the window is in the background
  document.addEventListener("visibilitychange", () => document.body.classList.toggle("reader-hidden", document.hidden));

  start();
})();
