(() => {
  const S = window.STORIES || [];
  const $ = (q, el = document) => el.querySelector(q);
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const used = new Set();
  const take = (ids) => ids.map((i) => { used.add(i); return S[i]; }).filter((s) => s && s.img);
  const headline = (s) => (s.k ? `<span class="card__k">${esc(s.k)}:</span> ` : "") + esc(s.t);

  /* Date */
  const d = new Date();
  $("#today").textContent = d.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase());

  /* HERO */
  const heroIds = [0, 3, 16, 4, 7];
  const hero = take(heroIds);
  const media = $("#heroMedia"), prog = $("#heroProgress");
  hero.forEach((s, i) => {
    media.insertAdjacentHTML("beforeend", `<div class="hero__slide"><img src="${s.img}" alt=""></div>`);
    prog.insertAdjacentHTML("beforeend", `<button aria-label="Sak ${i + 1}"><i></i><span>${esc(s.k || s.t)}</span></button>`);
  });
  const slides = [...media.children], bars = [...prog.children];
  let cur = -1, tl;
  const DUR = 7;
  function splitLines(el, html) {
    el.innerHTML = html;
    // wrap words, then group into visual lines for a masked reveal
    const words = [];
    el.childNodes.forEach((n) => {
      const cls = n.nodeType === 1 ? n.className : "";
      (n.textContent).split(/\s+/).filter(Boolean).forEach((w) => words.push({ w, cls }));
    });
    el.innerHTML = words.map((o) => `<span class="wd ${o.cls}" style="display:inline-block">${esc(o.w)}</span>`).join(" ");
    const lines = [];
    let top = null;
    [...el.children].forEach((sp) => {
      if (sp.offsetTop !== top) { lines.push([]); top = sp.offsetTop; }
      lines[lines.length - 1].push(sp.outerHTML);
    });
    el.innerHTML = lines.map((l) => `<span class="ln"><span>${l.join(" ")}</span></span>`).join("");
    return el.querySelectorAll(".ln > span");
  }
  function go(i) {
    if (i === cur) return;
    cur = (i + hero.length) % hero.length;
    const s = hero[cur];
    slides.forEach((el, j) => el.classList.toggle("is-on", j === cur));
    bars.forEach((b, j) => {
      b.classList.toggle("is-on", j === cur);
      gsap.killTweensOf(b.firstChild);
      gsap.set(b.firstChild, { scaleX: j < cur ? 1 : 0 });
    });
    $("#heroLink").href = s.href;
    $("#heroKicker").textContent = "";
    const title = $("#heroTitle");
    const html = (s.k ? `<span class="hk">${esc(s.k)}:</span> ` : "") + esc(s.t);
    const lines = splitLines(title, html);
    if (!reduce) gsap.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 });
    tl && tl.kill();
    tl = gsap.to(bars[cur].firstChild, { scaleX: 1, duration: DUR, ease: "none", onComplete: () => go(cur + 1) });
  }
  bars.forEach((b, i) => b.addEventListener("click", () => go(i)));
  const style = document.createElement("style");
  style.textContent = ".hero__title .hk{color:rgba(255,255,255,.6)}";
  document.head.appendChild(style);

  /* LIVE */
  const liveIds = [20, 43, 10, 34, 13, 33, 38, 42, 5, 18];
  let t = new Date(); t.setMinutes(t.getMinutes() - 3);
  const items = liveIds.map((i, n) => {
    const tm = new Date(t.getTime() - n * 17 * 60000);
    const hh = tm.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
    return `<a href="${S[i].href}"><time>${hh}</time>${headline(S[i])}</a>`;
  }).join("");
  $("#liveRail").innerHTML = items + items;

  /* LATEST */
  const latest = take([5, 8, 9, 14, 15, 21, 24, 31, 40]);
  const cls = ["card--lead", "card--side", "card--side", "card--third", "card--third", "card--third", "card--quarter", "card--quarter", "card--quarter", "card--quarter"];
  $("#latestGrid").innerHTML = latest.map((s, i) => `
    <a class="card ${cls[i] || "card--quarter"}" href="${s.href}">
      <div class="card__img"><img src="${s.img}" alt="" loading="lazy"></div>
      <span class="card__sec"></span>
      <h3 class="card__t">${headline(s)}</h3>
    </a>`).join("");

  /* SPORT */
  const sport = take([6, 1, 2, 39, 12, 30]);
  $("#sportList").innerHTML = sport.map((s) => `
    <a class="srow" href="${s.href}">
      <div class="srow__img"><img src="${s.img}" alt="" loading="lazy"></div>
      <div><h3>${headline(s)}</h3></div>
    </a>`).join("");

  /* DISTRICT */
  const regions = ["Nordland", "Rogaland", "Troms og Finnmark", "Trøndelag", "Vestfold og Telemark", "Østfold", "Møre og Romsdal"];
  const byReg = {};
  S.forEach((s, i) => { if (regions.includes(s.sec) && s.img) (byReg[s.sec] = byReg[s.sec] || []).push(s); });
  const tabs = $("#districtTabs"), ds = $("#districtStories");
  tabs.innerHTML = regions.map((r, i) => `<li><button role="tab" data-r="${r}" class="${i === 0 ? "is-on" : ""}">${r}<span>${(byReg[r] || []).length} saker</span></button></li>`).join("");
  function showReg(r) {
    const list = (byReg[r] || []).slice(0, 3);
    tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("is-on", b.dataset.r === r));
    ds.innerHTML = list.map((s) => `
      <a class="dcard" href="${s.href}">
        <div class="dcard__img"><img src="${s.img}" alt=""></div>
        <div class="dcard__body"><h3>${headline(s)}</h3></div>
      </a>`).join("");
    if (!reduce) gsap.fromTo(ds.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.07 });
  }
  tabs.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) showReg(b.dataset.r); });
  showReg(regions[0]);
  regions.forEach((r) => (byReg[r] || []).forEach((s) => used.add(S.indexOf(s))));

  /* MORE */
  const rest = S.map((s, i) => [s, i]).filter(([s, i]) => !used.has(i) && !heroIds.includes(i) && !liveIds.includes(i)).map(([s]) => s);
  $("#moreGrid").innerHTML = rest.slice(0, 16).map((s) => `
    <a class="mrow" href="${s.href}">
      <h3>${headline(s)}</h3>
      <div class="mrow__img">${s.img ? `<img src="${s.img}" alt="" loading="lazy">` : ""}</div>
    </a>`).join("");

  /* MENU */
  const burger = $(".nav__burger"), menu = $("#menu");
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") !== "true";
    burger.setAttribute("aria-expanded", open);
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", !open);
  });
  menu.addEventListener("click", (e) => { if (e.target.tagName === "A") burger.click(); });

  /* TV rail controls + drag */
  const rail = $("#tvRail");
  document.querySelectorAll(".tv__ctrl .round").forEach((b) => b.addEventListener("click", () => rail.scrollBy({ left: +b.dataset.dir * rail.clientWidth * 0.6, behavior: "smooth" })));
  let down = false, sx = 0, sl = 0, moved = false;
  rail.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.style.scrollSnapType = "none"; });
  addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = sl - dx; });
  addEventListener("pointerup", () => { if (!down) return; down = false; rail.style.scrollSnapType = ""; });
  rail.addEventListener("click", (e) => { if (moved) e.preventDefault(); }, true);

  /* Smooth scroll */
  gsap.registerPlugin(ScrollTrigger);
  let lenis;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (id.length < 2) return;
      const el = document.querySelector(id); if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: 0, duration: 1.4 });
    }));
  }

  /* Nav state */
  const nav = $("#nav");
  const darkSecs = [".hero", ".live", ".statement", ".tv", ".district", ".weather", ".footer"];
  function navState() {
    const y = 40;
    let mode = "solid";
    darkSecs.forEach((q) => document.querySelectorAll(q).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top <= y && r.bottom > y) mode = q === ".hero" ? "clear" : "dark";
    }));
    nav.classList.toggle("is-solid", mode !== "clear");
    nav.classList.toggle("is-dark", mode === "dark");
  }
  ScrollTrigger.create({ start: 0, end: "max", onUpdate: navState });
  navState();

  /* Scroll animations */
  function scrollFx() {
    if (reduce) return;
    gsap.to(".hero__media", { yPercent: 18, scale: 1.05, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__content", { yPercent: -20, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });

    gsap.utils.toArray(".sec-title").forEach((el) => gsap.from(el, { y: 60, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } }));

    ScrollTrigger.batch(".card, .srow, .mrow", {
      start: "top 90%",
      onEnter: (els) => gsap.fromTo(els, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.08, overwrite: true }),
    });
    gsap.set(".card, .srow, .mrow", { opacity: 0 });

    gsap.utils.toArray(".card__img img, .srow__img img").forEach((img) => gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: img.parentNode, start: "top bottom", end: "bottom top", scrub: true } }));

    // statement word fill
    const st = $(".statement__text");
    st.innerHTML = st.textContent.trim().split(/\s+/).map((w) => `<span class="w">${esc(w)}</span>`).join(" ");
    gsap.to(".statement__text .w", { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: ".statement", start: "top 75%", end: "bottom 60%", scrub: true } });

    gsap.from(".show", { x: 120, opacity: 0, duration: 1.3, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: ".tv__rail", start: "top 85%" } });
    gsap.fromTo(".statement__bg", { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: ".statement", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.fromTo(".sport__img", { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".sport", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".sport__title", { yPercent: 40, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".sport", start: "top 60%" } });
    gsap.fromTo(".district__bg img", { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".district", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.fromTo(".weather__img", { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".weather", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".weather__temp", { yPercent: 30, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".weather", start: "top 40%" } });
    gsap.from(".weather__days div", { y: 40, opacity: 0, duration: 1, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: ".weather", start: "top 30%" } });
    gsap.fromTo(".games__img img", { scale: 1.25, rotate: -4 }, { scale: 1, rotate: 0, ease: "none", scrollTrigger: { trigger: ".games", start: "top bottom", end: "center center", scrub: true } });
    gsap.from(".footer__logo svg", { yPercent: 60, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".footer__logo", start: "top 95%" } });
  }

  /* Loader → start */
  function start() {
    document.body.classList.remove("is-loading");
    lenis && lenis.start();
    go(0);
    scrollFx();
    ScrollTrigger.refresh();
  }
  if (reduce) { $(".loader").remove(); start(); return; }
  const lt = gsap.timeline();
  lt.from(".loader__logo", { scale: 0.85, opacity: 0, duration: 0.9, ease: "expo.out" })
    .to(".loader__bar span", { scaleX: 1, duration: 0.9, ease: "power2.inOut" }, "-=0.4")
    .to(".loader__logo, .loader__bar", { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" })
    .to(".loader", { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, "-=0.1")
    .add(start, "-=0.6")
    .from(".nav > *", { y: -20, opacity: 0, duration: 0.8, ease: "expo.out", stagger: 0.06 }, "-=0.5")
    .add(() => $(".loader").remove());
})();
