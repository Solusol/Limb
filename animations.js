"use strict";

/*
  Лимб: анимации взаимодействий.
  Подключается последним. Не меняет логику app.js, board.js
  и fixes.js: перехватывает клики в фазе захвата и наблюдает
  за изменениями DOM.
*/

(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const motionOk = () => !reduceMotion.matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");

  const EASE = "cubic-bezier(.22,.61,.36,1)";
  const $ = selector => document.querySelector(selector);

  const canAnimate =
    typeof Element !== "undefined" &&
    typeof Element.prototype.animate === "function";

  function onceLoaded(img, timeout = 1500) {
    return new Promise(resolve => {
      if (!img || img.complete) {
        resolve();
        return;
      }

      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve();
      };

      const timer = setTimeout(finish, timeout);

      img.addEventListener("load", finish, { once: true });
      img.addEventListener("error", finish, { once: true });
    });
  }

  /* ===================================================
     1. Мягкая смена страниц
     =================================================== */

  (() => {
    const D = window.LIMB;
    let leaving = false;

    /* Какой раздел покажет маршрутизатор по этому хэшу */
    function pageFor(hash) {
      const parts = hash.replace(/^#/, "").split("/");

      switch (parts[0]) {
        case "":
        case "home":
          return "home";

        case "bible":
          return ["origin", "rules", "timeline"].includes(parts[1])
            ? parts[1]
            : "bible";

        case "maps":
          if (parts[1] === "house") return "house";
          if (["limb", "chapters"].includes(parts[1])) return "map-view";
          return "maps";

        case "character": {
          const known = D?.people?.some(p => p.id === parts[1]);
          return known ? "character" : "characters";
        }

        case "characters":
        case "readers":
        case "materials":
          return parts[0];

        case "board":
          return "bulletin-board";

        case "custom-character":
          return "custom-character";

        default:
          return "home";
      }
    }

    document.addEventListener("click", event => {
      if (!motionOk() || leaving) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      if (!(event.target instanceof Element)) return;

      const link = event.target.closest("a[href]");
      if (!link) return;
      if (link.target && link.target !== "_self") return;

      const href = link.getAttribute("href") || "";

      if (!href.startsWith("#") || href === "#" || href === "#main") return;
      if (href === location.hash) return;

      const current = $("#main > .page:not([hidden])");
      if (!current) return;

      /* Внутри того же раздела ничего не гасим */
      if (pageFor(href) === current.id) return;

      event.preventDefault();
      leaving = true;

      current.classList.add("la-leaving");

      let navigated = false;

      const go = () => {
        if (navigated) return;
        navigated = true;
        leaving = false;
        location.hash = href;
      };

      current.addEventListener("animationend", go, { once: true });
      setTimeout(go, 230);
    }, true);

    window.addEventListener("hashchange", () => {
      leaving = false;

      document.querySelectorAll(".page.la-leaving").forEach(page => {
        page.classList.remove("la-leaving");
      });
    });
  })();

  /* ===================================================
     2. Приподнятая обложка: наклон следует за курсором
     =================================================== */

  (() => {
    const SELECTOR =
      "#home .section-picture, .characters-grid .portrait, #cc-card .cc-card-art";

    const MAX_DEG = 4;

    document.addEventListener("pointermove", event => {
      if (!motionOk() || !finePointer.matches) return;
      if (event.pointerType && event.pointerType !== "mouse") return;
      if (!(event.target instanceof Element)) return;

      const card = event.target.closest(SELECTOR);
      if (!card) return;

      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const px = (event.clientX - rect.left) / rect.width - .5;
      const py = (event.clientY - rect.top) / rect.height - .5;

      card.style.setProperty("--la-ry", `${(px * MAX_DEG * 2).toFixed(2)}deg`);
      card.style.setProperty("--la-rx", `${(-py * MAX_DEG * 2).toFixed(2)}deg`);
    }, { passive: true });

    document.addEventListener("pointerout", event => {
      if (!(event.target instanceof Element)) return;

      const card = event.target.closest(SELECTOR);
      if (!card) return;

      const to = event.relatedTarget;
      if (to instanceof Node && card.contains(to)) return;

      card.style.removeProperty("--la-rx");
      card.style.removeProperty("--la-ry");
    }, { passive: true });
  })();

  /* ===================================================
     3. Профайл → мудборд: растворение композиций
     =================================================== */

  (() => {
    const figure = $("#character-sheet");
    if (!figure || !canAnimate) return;

    let pending = null;

    document.addEventListener("click", event => {
      if (!motionOk()) return;
      if (!(event.target instanceof Element)) return;

      const trigger = event.target.closest(
        "[data-person-view], #person-prev, #person-next"
      );

      if (!trigger) return;

      const current = figure.querySelector(".sheet-image");
      if (!current || !current.currentSrc && !current.src) return;

      pending = {
        src: current.currentSrc || current.src,
        time: Date.now()
      };
    }, true);

    function crossfade(next) {
      const snapshot = pending;
      pending = null;

      if (!snapshot || Date.now() - snapshot.time > 2500) return;
      if (snapshot.src === (next.currentSrc || next.src)) return;

      const ghost = new Image();
      ghost.className = "la-sheet-ghost";
      ghost.alt = "";
      ghost.decoding = "sync";
      ghost.src = snapshot.src;

      next.style.opacity = "0";
      figure.append(ghost);

      let cleared = false;

      const clear = () => {
        if (cleared) return;
        cleared = true;
        next.style.opacity = "";
        ghost.remove();
      };

      /* Страховка: композиция не останется невидимой */
      const guard = setTimeout(clear, 3500);

      onceLoaded(next).then(() => {
        if (cleared) return;

        const options = { duration: 420, easing: "ease-out", fill: "both" };

        const fadeIn = next.animate([{ opacity: 0 }, { opacity: 1 }], options);
        ghost.animate([{ opacity: 1 }, { opacity: 0 }], options);

        fadeIn.onfinish = () => {
          clearTimeout(guard);
          clear();
        };

        fadeIn.oncancel = () => {
          clearTimeout(guard);
          clear();
        };
      });
    }

    new MutationObserver(records => {
      for (const record of records) {
        for (const nodeAdded of record.addedNodes) {
          if (
            nodeAdded instanceof HTMLImageElement &&
            nodeAdded.classList.contains("sheet-image")
          ) {
            crossfade(nodeAdded);
            return;
          }
        }
      }
    }).observe(figure, { childList: true });

    /* Индикатор: мягкая смена активного состояния */
    const dots = document.querySelectorAll(".view-dots button");

    if (dots.length) {
      new MutationObserver(records => {
        if (!motionOk()) return;

        records.forEach(record => {
          const img = record.target.querySelector?.("img");
          if (!img) return;

          img.animate(
            [{ opacity: .3 }, { opacity: 1 }],
            { duration: 280, easing: "ease-out" }
          );
        });
      }).observe(dots[0].parentElement, {
        attributes: true,
        attributeFilter: ["aria-pressed"],
        subtree: true
      });
    }
  })();

  /* ===================================================
     7 и 9. Предпросмотр записки: приклеивание и отмена
     =================================================== */

  (() => {
    const preview = $("#bn-preview");
    if (!preview || !canAnimate) return;

    let pending = null;
    let pendingTimer = 0;

    function partKey(part) {
      if (part.dataset.part === "text") return "text";

      const img = part.querySelector("img");
      return `${part.dataset.part}|${img?.getAttribute("src") || ""}`;
    }

    function snapshot() {
      const note = preview.querySelector(".bn-note");
      if (!note) return null;

      const parts = new Map();

      note.querySelectorAll("[data-part]").forEach(part => {
        parts.set(partKey(part), {
          rect: part.getBoundingClientRect(),
          src: part.querySelector("img")?.getAttribute("src") || ""
        });
      });

      return {
        rect: note.getBoundingClientRect(),
        paper: note.querySelector(".bn-paper")?.getAttribute("src") || "",
        parts
      };
    }

    function arm() {
      if (!motionOk()) return;

      pending = snapshot();
      clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => { pending = null; }, 450);
    }

    document.addEventListener("click", event => {
      if (!(event.target instanceof Element)) return;

      if (
        event.target.closest(
          "#bulletin-board .bn-sticker-choice, " +
          "#bulletin-board .bn-paper-choice, " +
          "#bn-cancel, #bn-redo"
        )
      ) {
        arm();
      }
    }, true);

    function pressIn(part) {
      part.animate(
        [
          {
            transform: "scale(1.18)",
            filter: "drop-shadow(0 8px 8px rgb(0 0 0 / 35%))",
            offset: 0
          },
          {
            transform: "scale(.97)",
            filter: "drop-shadow(0 2px 2px rgb(0 0 0 / 20%))",
            offset: .65
          },
          { transform: "none", filter: "none", offset: 1 }
        ],
        { duration: 320, easing: EASE }
      );
    }

    function slideFrom(part, old, now) {
      const dx = old.left - now.left;
      const dy = old.top - now.top;
      const s = now.width ? old.width / now.width : 1;

      if (Math.abs(dx) < .5 && Math.abs(dy) < .5 && Math.abs(s - 1) < .01) {
        return;
      }

      part.animate(
        [
          {
            transformOrigin: "0 0",
            transform: `translate(${dx}px, ${dy}px) scale(${s})`
          },
          { transformOrigin: "0 0", transform: "none" }
        ],
        { duration: 340, easing: EASE }
      );
    }

    function ghostOut(note, noteRect, old) {
      if (!old.src) return;

      const ghost = document.createElement("div");
      ghost.className = "bn-sticker la-ghost";
      ghost.style.left = `${old.rect.left - noteRect.left}px`;
      ghost.style.top = `${old.rect.top - noteRect.top}px`;
      ghost.style.width = `${old.rect.width}px`;

      const img = new Image();
      img.alt = "";
      img.src = old.src;
      ghost.append(img);
      note.append(ghost);

      const animation = ghost.animate(
        [
          { opacity: 1, transform: "scale(1)" },
          { opacity: 0, transform: "scale(.8)" }
        ],
        { duration: 240, easing: "ease-in" }
      );

      animation.onfinish = () => ghost.remove();
      animation.oncancel = () => ghost.remove();
    }

    function paperFade(note, oldSrc) {
      const paper = note.querySelector(".bn-paper");
      if (!paper) return;

      paper.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 260, easing: "ease-out" }
      );

      if (!oldSrc) return;

      const ghost = new Image();
      ghost.className = "la-paper-ghost";
      ghost.alt = "";
      ghost.src = oldSrc;
      note.prepend(ghost);

      const animation = ghost.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 260, easing: "ease-out" }
      );

      animation.onfinish = () => ghost.remove();
      animation.oncancel = () => ghost.remove();
    }

    function animateRebuild(note) {
      const before = pending;
      pending = null;
      clearTimeout(pendingTimer);

      if (!before || !motionOk()) return;

      const noteRect = note.getBoundingClientRect();
      if (!noteRect.width) return;

      const newPaper = note.querySelector(".bn-paper")?.getAttribute("src") || "";
      if (newPaper !== before.paper) paperFade(note, before.paper);

      /* Отмена изменения ширины: вся записка возвращается к размеру */
      const widthChanged =
        Math.abs(before.rect.width - noteRect.width) > .5;

      if (widthChanged) {
        const s = before.rect.width / noteRect.width;

        note.animate(
          [
            { transformOrigin: "0 0", transform: `scale(${s})` },
            { transformOrigin: "0 0", transform: "none" }
          ],
          { duration: 320, easing: EASE }
        );

        return;
      }

      const seen = new Set();

      note.querySelectorAll("[data-part]").forEach(part => {
        const key = partKey(part);
        seen.add(key);

        const old = before.parts.get(key);
        const now = part.getBoundingClientRect();

        if (!old) {
          if (key !== "text") pressIn(part);
          return;
        }

        slideFrom(part, old.rect, now);
      });

      before.parts.forEach((old, key) => {
        if (key === "text" || seen.has(key)) return;
        ghostOut(note, noteRect, old);
      });
    }

    new MutationObserver(records => {
      for (const record of records) {
        for (const nodeAdded of record.addedNodes) {
          if (
            nodeAdded instanceof Element &&
            nodeAdded.classList.contains("bn-note")
          ) {
            animateRebuild(nodeAdded);
            return;
          }
        }
      }
    }).observe(preview, { childList: true });
  })();

  /* ===================================================
     8. Поднятие записки при захвате
     =================================================== */

  (() => {
    const world = $("#bn-world");
    if (!world) return;

    let lifted = null;

    const drop = () => {
      if (!lifted) return;
      lifted.classList.remove("la-lifted");
      lifted = null;
    };

    world.addEventListener("pointerdown", event => {
      if (!motionOk() || event.button !== 0) return;
      if (!(event.target instanceof Element)) return;

      const note = event.target.closest(".bn-note.movable");
      if (!note) return;

      drop();
      lifted = note;
      note.classList.add("la-lifted");
    }, true);

    ["pointerup", "pointercancel"].forEach(type => {
      window.addEventListener(type, drop, true);
    });

    window.addEventListener("blur", drop);
  })();

  /* ===================================================
     10. Подтверждение публикации
     =================================================== */

  (() => {
    const world = $("#bn-world");
    const publish = $("#bn-publish");
    if (!world || !publish) return;

    let expected = null;

    document.addEventListener("click", event => {
      if (!motionOk()) return;
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest("#bn-publish")) return;

      const draft = world.querySelector(".bn-note.draft");
      if (!draft?.dataset.id) return;

      expected = { id: draft.dataset.id, until: Date.now() + 20000 };
    }, true);

    new MutationObserver(() => {
      if (!expected) return;

      if (Date.now() > expected.until) {
        expected = null;
        return;
      }

      const notes = world.querySelectorAll(".bn-note:not(.draft)");

      for (const note of notes) {
        if (note.dataset.id !== expected.id) continue;

        expected = null;
        note.classList.add("la-published");

        const clean = () => note.classList.remove("la-published");
        note.addEventListener("animationend", clean, { once: true });
        setTimeout(clean, 900);
        return;
      }
    }).observe(world, { childList: true });
  })();

  /* ===================================================
     11. Плавное увеличение карты
     =================================================== */

  (() => {
    let timer = 0;

    const mapNode = () => $(".lm-map") || $("#map-layer");

    function smoothOnce() {
      if (!motionOk()) return;

      const map = mapNode();
      if (!map) return;

      map.classList.add("la-smooth");
      clearTimeout(timer);

      timer = setTimeout(() => map.classList.remove("la-smooth"), 420);
    }

    function instant() {
      const map = mapNode();
      if (!map) return;

      clearTimeout(timer);
      map.classList.remove("la-smooth");
    }

    document.addEventListener("click", event => {
      if (!(event.target instanceof Element)) return;

      if (event.target.closest("[data-zoom], #map-plus, #map-minus, #map-reset")) {
        smoothOnce();
      }
    }, true);

    document.addEventListener("keydown", event => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest(".lm-map-area, #map-viewport")) return;

      if (["+", "=", "-"].includes(event.key)) smoothOnce();
    }, true);

    /* Перетаскивание карты должно следовать за рукой без задержки */
    document.addEventListener("pointerdown", event => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest(".lm-map-area, #map-viewport")) instant();
    }, true);
  })();

  /* ===================================================
     12. Хронология проявляется по пунктам
     =================================================== */

  (() => {
    if (!("IntersectionObserver" in window) || !motionOk()) return;

    const items = document.querySelectorAll("#origin-list > li, #rules-list > li");
    if (!items.length) return;

    document.documentElement.classList.add("la-reveal-ready");

    const observer = new IntersectionObserver(entries => {
      let index = 0;

      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const item = entry.target;
        item.style.setProperty("--la-delay", `${Math.min(index * 70, 420)}ms`);
        item.classList.add("la-seen");
        observer.unobserve(item);
        index++;
      });
    }, { threshold: .12 });

    items.forEach(item => observer.observe(item));
  })();

  /* ===================================================
     13. Рябь разлома по нажатию на иллюстрацию
     =================================================== */

  (() => {
    if (!motionOk()) return;

    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");

    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.style.cssText =
      "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;";

    const filter = document.createElementNS(NS, "filter");
    filter.id = "la-rift";
    filter.setAttribute("x", "-10%");
    filter.setAttribute("y", "-10%");
    filter.setAttribute("width", "120%");
    filter.setAttribute("height", "120%");
    filter.setAttribute("color-interpolation-filters", "sRGB");

    const noise = document.createElementNS(NS, "feTurbulence");
    noise.setAttribute("type", "fractalNoise");
    noise.setAttribute("baseFrequency", "0.012 0.03");
    noise.setAttribute("numOctaves", "2");
    noise.setAttribute("seed", "3");
    noise.setAttribute("result", "noise");

    const displace = document.createElementNS(NS, "feDisplacementMap");
    displace.setAttribute("in", "SourceGraphic");
    displace.setAttribute("in2", "noise");
    displace.setAttribute("scale", "0");
    displace.setAttribute("xChannelSelector", "R");
    displace.setAttribute("yChannelSelector", "G");

    filter.append(noise, displace);
    svg.append(filter);
    document.body.append(svg);

    document.documentElement.classList.add("la-rift-ready");

    /*
      Первое применение фильтра в браузере стоит дорого:
      прогреваем его на крошечном невидимом элементе,
      чтобы первая рябь на иллюстрации не запнулась.
    */
    function warmUp() {
      const probe = document.createElement("div");

      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText =
        "position:fixed;left:-20px;top:-20px;width:4px;height:4px;" +
        "background:#555;pointer-events:none;filter:url('#la-rift');";

      document.body.append(probe);
      displace.setAttribute("scale", "1");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          displace.setAttribute("scale", "0");
          probe.remove();
        });
      });
    }

    if ("requestIdleCallback" in window) {
      requestIdleCallback(warmUp, { timeout: 4000 });
    } else {
      setTimeout(warmUp, 2500);
    }

    const DURATION = 650;
    const AMPLITUDE = 16;
    let active = null;

    function ripple(img) {
      if (active) return;

      active = img;
      img.classList.add("la-rippling");

      const start = performance.now();

      const frame = now => {
        const p = Math.min(1, (now - start) / DURATION);

        /* Одна волна: нарастает, слегка дрожит и затухает */
        const envelope = Math.sin(p * Math.PI);
        const tremor = .75 + .25 * Math.cos(p * Math.PI * 7);

        displace.setAttribute("scale", (AMPLITUDE * envelope * tremor).toFixed(2));
        noise.setAttribute(
          "baseFrequency",
          `${(0.012 + 0.006 * p).toFixed(4)} ${(0.03 + 0.012 * p).toFixed(4)}`
        );

        if (p < 1) {
          requestAnimationFrame(frame);
          return;
        }

        displace.setAttribute("scale", "0");
        noise.setAttribute("baseFrequency", "0.012 0.03");
        img.classList.remove("la-rippling");
        active = null;
      };

      requestAnimationFrame(frame);
    }

    document.addEventListener("click", event => {
      if (!(event.target instanceof Element)) return;

      const img = event.target.closest(".hero-creature, .article-art");
      if (!(img instanceof HTMLImageElement)) return;
      if (img.closest("a, button")) return;

      ripple(img);
    });
  })();
})();
