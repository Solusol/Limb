"use strict";

(() => {
  /*
   * ЛИМБ — исправления оформления.
   * Подключение: после content.js и app.js.
   */

  const D = window.LIMB;

  if (!D) {
    console.error(
      "Лимб: fixes.js необходимо подключить после content.js и app.js."
    );
    return;
  }

  const PATHS = {
    portraitBackground: "assets/frames/portrait.webp",
    coverBackground: "assets/frames/article-panel.webp",

    handActive: "assets/icons/pointing-hand-active.webp",
    handInactive: "assets/icons/pointing-hand-inactive.webp",

    tape: D.art?.tape || "assets/decor/duct-tape.webp",

    covers: [
      "assets/covers/Oblozhka_1.webp",
      "assets/covers/Oblozhka_2.webp",
      "assets/covers/Oblozhka_3.webp"
    ]
  };

  if (D.ui) {
    D.ui.hand = PATHS.handActive;
    D.ui.open = PATHS.handActive;
  }

  if (D.art) {
    D.art.bibleCard = PATHS.covers[0];
    D.art.mapCard = PATHS.covers[1];
    D.art.charactersCard = PATHS.covers[2];
  }

  if (D.frames) {
    D.frames.portrait = PATHS.portraitBackground;
    D.frames.article = PATHS.coverBackground;
  }

  if (D.composition) {
    /*
     * portrait.webp — красная ПОДЛОЖКА.
     * Серебряная рама уже находится в изображении портрета.
     */
    D.composition.separatePortraitFrame = false;
  }

  D.showCoverCarousel = false;

  const root = document.documentElement;

  root.style.setProperty(
    "--fix-portrait-background",
    `url("${PATHS.portraitBackground}")`
  );

  root.style.setProperty(
    "--fix-cover-background",
    `url("${PATHS.coverBackground}")`
  );

  const style = document.createElement("style");
  style.id = "limb-layout-fixes";

  style.textContent = `
    :root {
      --fix-paper-overlap: clamp(48px, 7vw, 150px);
      --fix-paper-label-space: clamp(170px, 23vw, 460px);
      --fix-tape-overlap: clamp(32px, 4.5vw, 96px);

      --fix-portrait-padding: 7%;
      --fix-cover-padding: 8%;

      --fix-cards-width: 1180px;
    }

    body > footer {
      display: none !important;
    }

    #tags,
    .home-page .tags,
    #home .tags {
      display: none !important;
    }

    #home.page,
    #home.home-page {
      width: 100%;
      max-width: none;
      margin-inline: 0;
      padding-inline: 0;
      overflow: visible;
    }

    #home .home-heading {
      width: min(1280px, 100%);
      margin-inline: auto;
      padding-inline: clamp(16px, 4vw, 64px);
    }

    .home-collage {
      position: relative;
      width: 100%;
      isolation: isolate;
    }

    #home .hero-creature {
      position: relative;
      z-index: 1;
      display: block;
      width: 100%;
      max-width: none;
      height: auto;
      max-height: none;
      margin: 0;
      padding: 0;
      object-fit: contain;
      object-position: center bottom;
    }

    #home .paper-section {
      position: relative;
      z-index: 2;
      width: 100%;
      margin-top: calc(-1 * var(--fix-paper-overlap));
      margin-inline: 0;
      padding:
        clamp(24px, 3vw, 64px)
        0
        clamp(56px, 6vw, 128px);
      background-color: transparent;
      background-repeat: no-repeat;
      background-position: center;
      background-size: 100% 100%;
      isolation: isolate;
    }

    #home .paper-section::after {
      z-index: 0;
      pointer-events: none;
    }

    #home .paper-content {
      position: relative;
      z-index: 1;
      width: 100%;
      margin: 0;
      padding:
        var(--fix-paper-label-space)
        clamp(24px, 12vw, 260px)
        clamp(24px, 3vw, 64px);
      background: transparent;
      clip-path: none;
    }

    #home .annotation {
      margin: 0;
      padding: 0;
      color: var(--paper-text, #34372f);
      font-size: clamp(16px, 1.4vw, 28px);
      line-height: 1.7;
    }

    #home .annotation p {
      max-width: none;
      margin: 0;
    }

    #home .annotation p + p {
      margin-top: clamp(16px, 2vw, 36px);
    }

    .home-tape {
      position: relative;
      z-index: 3;
      width: 100%;
      margin-top: calc(-1 * var(--fix-tape-overlap));
      line-height: 0;
      pointer-events: none;
    }

    .home-tape img {
      display: block;
      width: 100%;
      max-width: none;
      height: auto;
      margin: 0;
    }

    #home .section-cards::before,
    #home .section-cards::after {
      content: none !important;
      display: none !important;
    }

    #home .section-cards {
      position: relative;
      z-index: 4;
      width: min(var(--fix-cards-width), 100%);
      max-width: none;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: clamp(20px, 3vw, 48px);
      margin:
        calc(-1 * clamp(24px, 4vw, 80px))
        auto
        0;
      padding:
        0
        clamp(20px, 5vw, 64px)
        clamp(40px, 6vw, 96px);
      isolation: isolate;
    }

    #home .section-cards article {
      min-width: 0;
      margin: 0;
    }

    #home .section-picture {
      position: relative;
      display: block;
      width: 100%;
      margin: 0;
      padding: var(--fix-cover-padding);
      border: 0;
      background-color: transparent;
      background-image: var(--fix-cover-background);
      background-repeat: no-repeat;
      background-position: center;
      background-size: 100% 100%;
    }

    #home .section-picture img {
      position: static;
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      margin: 0;
      aspect-ratio: 3 / 4;
      object-fit: contain;
    }

    #home .section-cards h2 {
      margin:
        clamp(12px, 1.6vw, 24px)
        0
        clamp(8px, 1vw, 16px);
      font-size: clamp(19px, 2.7vw, 42px);
      line-height: 1.2;
      text-transform: uppercase;
      overflow-wrap: normal;
    }

    .hand-open-link {
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      width: 76px;
      min-width: 44px;
      min-height: 44px;
      padding: 0;
      border: 0;
      background: none;
      text-decoration: none;
    }

    .hand-open-link img {
      display: block;
      width: 64px;
      height: auto;
      max-height: 48px;
      object-fit: contain;
    }

    .hand-open-link:hover {
      opacity: .8;
    }

    .characters-grid .portrait {
      position: relative;
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: auto;
      margin: 0;
      padding: var(--fix-portrait-padding);
      background-color: transparent;
      background-image: var(--fix-portrait-background);
      background-repeat: no-repeat;
      background-position: center;
      background-size: 100% 100%;
      border: 0;
    }

    .characters-grid .portrait > img {
      position: relative;
      inset: auto;
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      margin: 0;
      object-fit: contain;
    }

    .characters-grid .portrait-frame {
      display: none !important;
    }

    .characters-grid .portrait-photo {
      position: static !important;
      inset: auto !important;
      display: block;
      width: 100%;
      height: auto;
    }

    .characters-grid .portrait-photo img {
      width: 100%;
      height: auto;
      object-fit: contain;
    }

    .hand-open-link:focus-visible {
      outline: 2px solid var(--text, #e4dfcd);
      outline-offset: 5px;
    }

    @media (max-width: 700px) {
      :root {
        --fix-paper-overlap: clamp(32px, 8vw, 56px);
        --fix-paper-label-space: clamp(130px, 26vw, 190px);
        --fix-tape-overlap: clamp(20px, 5vw, 36px);
      }

      #home .paper-content {
        padding-inline: clamp(24px, 9vw, 64px);
      }

      #home .annotation {
        font-size: 16px;
        line-height: 1.65;
      }

      #home .section-cards {
        gap: 12px;
        padding-inline: 16px;
        margin-top: calc(-1 * clamp(12px, 3vw, 24px));
      }

      #home .section-cards h2 {
        font-size: clamp(16px, 3vw, 22px);
      }

      .hand-open-link {
        width: 56px;
      }

      .hand-open-link img {
        width: 48px;
        max-height: 40px;
      }

      .characters-grid .portrait {
        padding: 7%;
      }
    }

    @media (max-width: 360px) {
      #home .section-cards {
        grid-template-columns: 1fr;
        gap: 32px;
      }

      #home .section-cards article {
        width: min(260px, 100%);
        margin-inline: auto;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .hand-open-link {
        transition: none;
      }
    }
  `;

  document.head.append(style);

  function makeImage(path, alt = "", width = 600, height = 800) {
    const img = document.createElement("img");

    img.src = path;
    img.alt = alt;
    img.width = width;
    img.height = height;
    img.loading = "lazy";
    img.decoding = "async";

    img.addEventListener("load", () => {
      img.width = img.naturalWidth;
      img.height = img.naturalHeight;
    }, { once: true });

    img.addEventListener("error", () => {
      console.warn(`Лимб: не найден материал ${path}`);
    }, { once: true });

    return img;
  }

  function makeHandLink(href, label) {
    const link = document.createElement("a");

    link.className = "hand-open-link";
    link.href = href;
    link.setAttribute("aria-label", label);
    link.title = label;

    link.append(makeImage(PATHS.handActive, "", 80, 56));

    return link;
  }

  /* 1. Красная подложка портретов */

  document.querySelectorAll(".characters-grid .portrait").forEach(
    portrait => {
      portrait.classList.remove("layered");

      portrait.querySelectorAll(".portrait-frame").forEach(
        frame => frame.remove()
      );

      const oldPhotoWrapper = portrait.querySelector(".portrait-photo");

      if (oldPhotoWrapper) {
        const portraitImage = oldPhotoWrapper.querySelector("img");
        if (portraitImage) oldPhotoWrapper.replaceWith(portraitImage);
      }
    }
  );

  /* 2. Убираем нижние служебные ссылки */

  document.querySelectorAll("body > footer").forEach(
    footer => footer.remove()
  );

  /* 3. Иконки в оглавлениях */

  document.querySelectorAll(".menu-row").forEach(row => {
    const oldHand = row.querySelector(".hand-icon");

    const isDisabled =
      row.disabled ||
      row.getAttribute("aria-disabled") === "true";

    const hand = makeImage(
      isDisabled ? PATHS.handInactive : PATHS.handActive,
      "",
      80,
      56
    );

    hand.className = "hand-icon";

    if (oldHand) {
      oldHand.replaceWith(hand);
    } else {
      row.prepend(hand);
    }

    row.querySelectorAll(".ui-fallback").forEach(
      fallback => fallback.remove()
    );
  });

  [
    { selector: "#ficbook-link", title: "Фикбук", href: D.links?.ficbook },
    { selector: "#tiktok-link", title: "TikTok", href: D.links?.tiktok }
  ].forEach(item => {
    const link = document.querySelector(item.selector);
    if (!link) return;

    const hand = makeImage(PATHS.handActive, "", 48, 32);
    hand.className = "hand-icon";

    const text = document.createElement("span");
    text.textContent = item.title;

    link.replaceChildren(hand, text);

    if (item.href) link.href = item.href;

    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  document.querySelectorAll(".person-card").forEach(card => {
    const portrait = card.querySelector(".portrait");
    const oldButton = card.querySelector(".image-button, .open-button");

    const href =
      oldButton?.getAttribute("href") ||
      portrait?.getAttribute("href");

    if (!href) return;

    const name =
      card.querySelector("h2")?.textContent?.trim() || "персонажа";

    const hand = makeHandLink(href, `Открыть: ${name}`);

    if (oldButton) {
      oldButton.replaceWith(hand);
    } else {
      card.append(hand);
    }
  });

  /* 4. Удаляем HTML-метки */

  document.querySelectorAll("#home #tags, #home .tags").forEach(
    tags => tags.remove()
  );

  /* 5. Порядок слоёв главной */

  const home = document.querySelector("#home");
  const creature = home?.querySelector(".hero-creature");
  const paper = home?.querySelector(".paper-section");

  if (home && creature && paper) {
    let collage = home.querySelector(".home-collage");

    if (!collage) {
      collage = document.createElement("div");
      collage.className = "home-collage";
      creature.before(collage);
    }

    collage.append(creature, paper);

    creature.loading = "eager";
    creature.setAttribute("fetchpriority", "high");

    let tape = home.querySelector(".home-tape");

    if (!tape) {
      tape = document.createElement("div");
      tape.className = "home-tape";
      tape.setAttribute("aria-hidden", "true");
    }

    tape.replaceChildren(makeImage(PATHS.tape, "", 1600, 320));
    collage.after(tape);
  }

  /*
   * 6. Три обложки в article-panel.webp.
   * Oblozhka_1.webp -> Библия
   * Oblozhka_2.webp -> Карта
   * Oblozhka_3.webp -> Персонажи
   */

  const sections = [
    { title: "Библия", href: "#bible", file: PATHS.covers[0] },
    { title: "Карта", href: "#maps", file: PATHS.covers[1] },
    { title: "Персонажи", href: "#characters", file: PATHS.covers[2] }
  ];

  const sectionCards =
    document.querySelector("#section-cards") ||
    document.querySelector("#home .section-cards");

  if (sectionCards) {
    sectionCards.replaceChildren();

    sections.forEach(section => {
      const article = document.createElement("article");

      const picture = document.createElement("a");
      picture.className = "section-picture";
      picture.href = section.href;
      picture.setAttribute("aria-label", `Перейти в раздел: ${section.title}`);

      picture.append(
        makeImage(section.file, `Обложка раздела «${section.title}»`, 600, 800)
      );

      const heading = document.createElement("h2");
      heading.textContent = section.title;

      const hand = makeHandLink(section.href, `Открыть раздел: ${section.title}`);

      article.append(picture, heading, hand);
      sectionCards.append(article);
    });

    const tape = home?.querySelector(".home-tape");
    if (tape) tape.after(sectionCards);
  }

  document.querySelectorAll("#cover-section, #covers").forEach(
    section => section.remove()
  );

  /*
   * Объединённое изображение: бумага + декор + скотч.
   */
  (() => {
    const D = window.LIMB;
    const home = document.querySelector("#home");
    const paper = home?.querySelector(".paper-section");

    if (!D || !home || !paper) return;

    const source = D.art?.paper;

    if (!source) {
      console.error("Лимб: не указан путь art.paper в content.js.");
      return;
    }

    home.querySelectorAll(".home-tape").forEach(node => node.remove());
    paper.querySelectorAll("[data-paper-error]").forEach(node => node.remove());
    paper.style.setProperty("background", "none", "important");
    paper.querySelectorAll(".combined-paper-image").forEach(node => node.remove());

    const img = document.createElement("img");
    img.className = "combined-paper-image";
    img.alt = "";
    img.loading = "eager";
    img.decoding = "async";

    img.addEventListener("load", () => {
      img.width = img.naturalWidth;
      img.height = img.naturalHeight;
    }, { once: true });

    img.addEventListener("error", () => {
      paper.classList.add("combined-paper-failed");
      console.error(`Лимб: не загружен объединённый коллаж: ${source}`);
    }, { once: true });

    paper.prepend(img);
    img.src = source;

    document.querySelector("#combined-paper-styles")?.remove();

    const style = document.createElement("style");
    style.id = "combined-paper-styles";

    style.textContent = `
      :root {
        --combined-paper-overlap: clamp(40px, 7vw, 130px);
        --combined-text-top: 41%;
        --combined-text-left: 14%;
        --combined-text-width: 66%;
        --combined-cards-overlap: clamp(48px, 16vw, 220px);
      }

      #main {
        width: 100%;
        max-width: none;
        margin-inline: 0;
        padding-inline: 0;
      }

      #home.page,
      #home.home-page,
      #home .home-collage {
        width: 100%;
        max-width: none;
        margin-inline: 0;
        padding-inline: 0;
      }

      #home .home-collage {
        position: relative;
        isolation: isolate;
      }

      #home .hero-creature {
        position: relative;
        z-index: 1;
        display: block;
        width: 100%;
        max-width: none;
        height: auto;
        max-height: none;
        margin: 0;
        padding: 0;
      }

      #home .paper-section {
        position: relative;
        z-index: 2;
        display: block;
        width: 100%;
        max-width: none;
        height: auto;
        min-height: 0;
        margin: calc(-1 * var(--combined-paper-overlap)) 0 0 !important;
        padding: 0 !important;
        border: 0 !important;
        background: none !important;
        isolation: isolate;
      }

      #home .paper-section::before,
      #home .paper-section::after,
      #home .section-cards::before,
      #home .section-cards::after {
        content: none !important;
        display: none !important;
        background: none !important;
      }

      #home .home-tape {
        display: none !important;
      }

      #home .combined-paper-image {
        position: relative;
        z-index: 0;
        display: block;
        width: 100% !important;
        max-width: none !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 0;
        transform: none !important;
      }

      #home .paper-section .paper-content {
        position: absolute !important;
        z-index: 1;
        top: var(--combined-text-top);
        left: var(--combined-text-left);
        right: auto;
        bottom: auto;
        width: var(--combined-text-width);
        max-width: none;
        margin: 0 !important;
        padding: 0 !important;
        background: none !important;
        clip-path: none !important;
      }

      #home .paper-section .annotation {
        margin: 0 !important;
        padding: 0 !important;
        color: #34372f;
        font-size: clamp(16px, 1.35vw, 26px);
        line-height: 1.65;
      }

      #home .paper-section .annotation p {
        max-width: none;
        margin: 0;
      }

      #home .paper-section .annotation p + p {
        margin-top: 16px;
      }

      #home .paper-section .tags,
      #home #tags {
        display: none !important;
      }

      #home .section-cards {
        position: relative;
        z-index: 3;
        margin-top: calc(-1 * var(--combined-cards-overlap)) !important;
        padding-top: 0 !important;
      }

      @media (max-width: 700px) {
        #home .paper-section .paper-content {
          position: relative !important;
          top: auto;
          left: auto;
          right: auto;
          bottom: auto;
          width: auto;
          margin: 0 16px !important;
          padding: 20px !important;
          background: #e7e4db !important;
        }

        #home .paper-section .annotation {
          font-size: 16px;
          line-height: 1.65;
        }

        #home .section-cards {
          margin-top: 24px !important;
        }
      }

      #home .combined-paper-failed .paper-content {
        position: relative !important;
        top: auto;
        left: auto;
        width: auto;
        margin: 16px !important;
        padding: 24px !important;
        background: #e7e4db !important;
      }

      #home .combined-paper-failed .combined-paper-image {
        display: none;
      }
    `;

    document.head.append(style);
  })();
})();

/*
 * Аннотация на главной — как на макете.
 */
(() => {
  document.querySelector("#annotation-layout-fix")?.remove();

  const style = document.createElement("style");
  style.id = "annotation-layout-fix";

  style.textContent = `
    :root {
      --combined-text-top: 40%;
      --combined-text-left: 16.5%;
      --combined-text-width: 57%;
    }

    #home .paper-section .annotation {
      color: #2a2b26 !important;
      font-size: clamp(16px, 1.75vw, 34px) !important;
      line-height: 1.45 !important;
      letter-spacing: 0.03em;
    }

    #home .paper-section .annotation p + p {
      margin-top: 1.4em !important;
    }

    @media (max-width: 700px) {
      #home .paper-section .annotation {
        font-size: 16px !important;
        line-height: 1.6 !important;
        letter-spacing: 0.02em;
      }
    }
  `;

  document.head.append(style);
})();

/*
 * Неактивный пункт «Таймлайн»: цвет как у указателя, без прозрачности.
 */
(() => {
  document.querySelector("#timeline-disabled-fix")?.remove();

  const style = document.createElement("style");
  style.id = "timeline-disabled-fix";

  style.textContent = `
    .menu-row:disabled,
    .menu-row[aria-disabled="true"] {
      opacity: 1 !important;
      color: #454E52 !important;
      cursor: default;
    }

    .menu-row:disabled span,
    .menu-row[aria-disabled="true"] span {
      color: #454E52 !important;
    }

    .menu-row:disabled .hand-icon,
    .menu-row[aria-disabled="true"] .hand-icon {
      opacity: 1 !important;
    }

    .menu-row:disabled:hover {
      opacity: 1 !important;
    }
  `;

  document.head.append(style);
})();

/*
 * КАРТА ЛИМБА — карта в рамке + кнопки глав картинками.
 */
(() => {
  const page = document.querySelector("#map-view");
  if (!page) return;

  const PATHS = {
    frame: "assets/frames/menu-karta.webp",
    buttonsDir: "assets/buttons/",
    zoomIn: "assets/buttons/zoom-in.webp",
    zoomOut: "assets/buttons/zoom-out.webp",
    baseMap: "assets/maps/Karta.webp",
    chapterMaps: {
      1: "assets/maps/Karta-po-glavam.webp"
      // 2: "assets/maps/glava-2.webp"  — добавлять по мере готовности
    }
  };

  const state = { chapter: null, scale: 1, x: 0, y: 0, drag: null };

  page.innerHTML = `
    <h1>Карта Лимба</h1>

    <div class="lm-layout">
      <div class="lm-map-box">
        <div class="lm-map-area" tabindex="0"
             aria-label="Карта Лимба. Масштаб — кнопками плюс и минус,
             перемещение — перетаскиванием или стрелками.">
          <img class="lm-map" src="${PATHS.baseMap}"
               alt="Карта Лимба" draggable="false">
        </div>

        <img class="lm-frame" src="${PATHS.frame}"
             alt="" aria-hidden="true" draggable="false">

        <div class="lm-zoom">
          <button type="button" data-zoom="in" aria-label="Приблизить карту">
            <img src="${PATHS.zoomIn}" alt="" draggable="false">
          </button>
          <button type="button" data-zoom="out" aria-label="Отдалить карту">
            <img src="${PATHS.zoomOut}" alt="" draggable="false">
          </button>
        </div>
      </div>

      <ol class="lm-chapters" aria-label="Главы"></ol>
    </div>
  `;

  const box = page.querySelector(".lm-map-box");
  const area = page.querySelector(".lm-map-area");
  const map = page.querySelector(".lm-map");
  const frame = page.querySelector(".lm-frame");
  const list = page.querySelector(".lm-chapters");

  function fitFrame() {
    if (frame.naturalWidth && frame.naturalHeight) {
      box.style.aspectRatio = `${frame.naturalWidth} / ${frame.naturalHeight}`;
    }
  }
  frame.complete ? fitFrame() : frame.addEventListener("load", fitFrame);

  for (let i = 1; i <= 10; i++) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    const img = document.createElement("img");

    btn.type = "button";
    btn.className = "lm-chapter";
    btn.dataset.chapter = String(i);
    btn.setAttribute("aria-label", `Глава ${i}`);

    img.src = `${PATHS.buttonsDir}glava${i}.webp`;
    img.alt = "";
    img.draggable = false;

    if (PATHS.chapterMaps[i]) {
      btn.setAttribute("aria-pressed", "false");
    } else {
      btn.disabled = true;
      btn.title = "Маршрут этой главы пока не добавлен";
    }

    btn.append(img);
    li.append(btn);
    list.append(li);
  }

  function apply() {
    const maxX = (area.clientWidth * (state.scale - 1)) / 2;
    const maxY = (area.clientHeight * (state.scale - 1)) / 2;
    state.x = Math.max(-maxX, Math.min(maxX, state.x));
    state.y = Math.max(-maxY, Math.min(maxY, state.y));
    map.style.transform =
      `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
  }

  function zoom(delta) {
    state.scale = Math.max(1, Math.min(6, state.scale + delta));
    if (state.scale === 1) { state.x = 0; state.y = 0; }
    apply();
  }

  page.querySelectorAll("[data-zoom]").forEach(btn => {
    btn.addEventListener("click", () => {
      zoom(btn.dataset.zoom === "in" ? 0.5 : -0.5);
    });
  });

  area.addEventListener("pointerdown", e => {
    if (state.scale <= 1) return;
    state.drag = { id: e.pointerId, x: e.clientX, y: e.clientY,
                   sx: state.x, sy: state.y };
    area.setPointerCapture(e.pointerId);
  });

  area.addEventListener("pointermove", e => {
    const d = state.drag;
    if (!d || d.id !== e.pointerId) return;
    state.x = d.sx + e.clientX - d.x;
    state.y = d.sy + e.clientY - d.y;
    apply();
  });

  ["pointerup", "pointercancel"].forEach(t =>
    area.addEventListener(t, () => { state.drag = null; })
  );

  area.addEventListener("keydown", e => {
    const s = 48;
    if (e.key === "+" || e.key === "=") zoom(0.5);
    else if (e.key === "-") zoom(-0.5);
    else if (e.key === "ArrowLeft") state.x += s;
    else if (e.key === "ArrowRight") state.x -= s;
    else if (e.key === "ArrowUp") state.y += s;
    else if (e.key === "ArrowDown") state.y -= s;
    else return;
    e.preventDefault();
    apply();
  });

  window.addEventListener("resize", apply);

  function setChapter(n) {
    state.chapter = n;

    list.querySelectorAll(".lm-chapter").forEach(btn => {
      const i = Number(btn.dataset.chapter);
      const active = i === n;
      const img = btn.querySelector("img");

      if (!btn.disabled) btn.setAttribute("aria-pressed", String(active));

      img.src = active
        ? `${PATHS.buttonsDir}glava${i}-active.webp`
        : `${PATHS.buttonsDir}glava${i}.webp`;
    });

    map.src = n ? PATHS.chapterMaps[n] : PATHS.baseMap;
    map.alt = n ? `Карта Лимба: маршрут главы ${n}` : "Карта Лимба";

    state.scale = 1; state.x = 0; state.y = 0;
    apply();
  }

  list.addEventListener("click", e => {
    const btn = e.target.closest(".lm-chapter");
    if (!btn || btn.disabled) return;
    const n = Number(btn.dataset.chapter);
    setChapter(state.chapter === n ? null : n);
  });

  map.addEventListener("error", () => {
    console.error(`Лимб: не найден файл карты ${map.getAttribute("src")}`);
  });

  function resetOnOpen() {
    if (location.hash.startsWith("#maps/limb")) setChapter(null);
  }
  window.addEventListener("hashchange", resetOnOpen);
  resetOnOpen();

  document.querySelector("#lm-styles")?.remove();
  const style = document.createElement("style");
  style.id = "lm-styles";

  style.textContent = `
    #map-view {
      --cut-top: 2%;
      --cut-right: 1.6%;
      --cut-bottom: 2%;
      --cut-left: 1.6%;
      --chapters-width: 24%;
      --layout-gap: 0px;
      --chapter-gap: 0px;
      width: min(1240px, 100%);
      max-width: none;
    }

    #map-view > h1 {
      margin-bottom: clamp(32px, 6vw, 80px);
    }

    .lm-layout {
      display: grid;
      grid-template-columns: 1fr var(--chapters-width);
      gap: var(--layout-gap);
      align-items: stretch;
    }

    .lm-map-box {
      position: relative;
      isolation: isolate;
    }

    .lm-map-area {
      position: absolute;
      z-index: 1;
      top: var(--cut-top);
      right: var(--cut-right);
      bottom: var(--cut-bottom);
      left: var(--cut-left);
      overflow: hidden;
      background: #050505;
      cursor: grab;
      touch-action: none;
    }

    .lm-map-area:active { cursor: grabbing; }

    .lm-map {
      display: block;
      width: 100%;
      height: 100%;
      max-width: none;
      object-fit: cover;
      transform-origin: center;
      user-select: none;
    }

    .lm-frame {
      position: absolute;
      inset: 0;
      z-index: 2;
      width: 100%;
      height: 100%;
      max-width: none;
      object-fit: contain;
      pointer-events: none;
      user-select: none;
    }

    .lm-zoom {
      position: absolute;
      z-index: 3;
      top: calc(var(--cut-top) + clamp(12px, 2.5%, 32px));
      left: calc(var(--cut-left) + clamp(12px, 2.5%, 32px));
      display: flex;
      gap: clamp(8px, 1vw, 16px);
    }

    .lm-zoom button {
      width: clamp(40px, 4.4vw, 60px);
      height: clamp(40px, 4.4vw, 60px);
      padding: 0;
      background: none;
      border: 0;
    }

    .lm-zoom img,
    .lm-chapter img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      user-select: none;
    }

    .lm-chapters {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-rows: repeat(10, 1fr);
      gap: var(--chapter-gap);
    }

    .lm-chapters li { min-height: 0; }

    .lm-chapter {
      width: 100%;
      height: 100%;
      min-height: 44px;
      padding: 0;
      background: none;
      border: 0;
    }

    .lm-chapter:disabled {
      opacity: 1;
      cursor: default;
    }

    .lm-chapter:focus:not(:focus-visible) { outline: none; }

    @media (max-width: 760px) {
      .lm-layout { grid-template-columns: 1fr; }

      .lm-chapters {
        grid-template-rows: none;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;
        margin-top: 12px;
      }

      .lm-chapter { height: 56px; }
    }
  `;

  document.head.append(style);
})();

/*
 * ПЕРСОНАЖИ — кнопка open.webp вместо руки.
 */
(() => {
  const OPEN = "assets/buttons/open.webp";

  document.querySelectorAll(".person-card .hand-open-link").forEach(link => {
    const img = link.querySelector("img");
    if (!img) return;

    img.src = OPEN;
    img.alt = "";
    link.classList.add("person-open-link");
  });

  document.querySelector("#person-open-styles")?.remove();

  const style = document.createElement("style");
  style.id = "person-open-styles";

  style.textContent = `
    .person-card .person-open-link {
      width: auto;
      min-width: 44px;
      min-height: 44px;
    }

    .person-card .person-open-link img {
      width: clamp(90px, 9vw, 130px);
      height: auto;
      max-height: none;
      object-fit: contain;
    }

    @media (max-width: 700px) {
      .person-card .person-open-link img {
        width: 80px;
      }
    }
  `;

  document.head.append(style);
})();