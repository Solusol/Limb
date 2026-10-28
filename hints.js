"use strict";
(() => {
  const page = document.getElementById("character");
  const pager = page?.querySelector(".character-pager");
  const prev = page?.querySelector("#person-prev");
  const mood = page?.querySelector('[data-person-view="mood"]');
  if (!pager || !prev || !mood) return;

  const PC  = { TUDA_W: 1.5, TUDA_X: 0.30, TUDA_Y: 0.50, MOOD_W: 2.4, MOOD_X: -0.35, MOOD_GAP: 0.15 };
  const MOB = { TUDA_W: 1.5, TUDA_X: 0.35, TUDA_Y: 0.30, MOOD_W: 2.4, MOOD_X: -0.35, MOOD_GAP: 0.10 };

  const cfg = () => document.documentElement.classList.contains("is-touch") ? MOB : PC;

  pager.querySelectorAll(".hint").forEach(n => n.remove());

  const make = (cls, src) => {
    const img = new Image();
    img.className = `hint ${cls}`;
    img.src = src;
    img.alt = "";
    img.decoding = "async";
    img.draggable = false;
    img.setAttribute("aria-hidden", "true");
    img.addEventListener("load", place);
    pager.append(img);
    return img;
  };

  const tuda = make("hint-tuda", "assets/decor/podskazka-tuda-suda.png");
  const mud  = make("hint-mudbord", "assets/decor/podskazka-mudbord.png");

  const target = btn => btn.querySelector("img:not(.hint)") || btn;

  function place() {
    if (page.hidden) return;
    const c = cfg();
    const p = pager.getBoundingClientRect();
    const a = target(prev).getBoundingClientRect();
    const m = target(mood).getBoundingClientRect();
    if (!a.width || !m.width) return;

    tuda.style.width = `${a.width * c.TUDA_W}px`;
    tuda.style.left  = `${a.left - p.left + a.width * c.TUDA_X}px`;
    tuda.style.top   = `${a.top - p.top + a.height * c.TUDA_Y}px`;

    mud.style.width = `${m.width * c.MOOD_W}px`;
    mud.style.left  = `${m.left - p.left + m.width / 2 + m.width * c.MOOD_X}px`;
    mud.style.top   = `${m.bottom - p.top + m.height * c.MOOD_GAP}px`;
  }

  const later = () => requestAnimationFrame(() => requestAnimationFrame(place));

  window.addEventListener("resize", later);
  window.addEventListener("hashchange", later);
  window.addEventListener("load", later);
  pager.addEventListener("click", later);
  if ("ResizeObserver" in window) new ResizeObserver(later).observe(pager);
  pager.querySelectorAll("img:not(.hint)").forEach(img => img.addEventListener("load", later));

  later();
})();