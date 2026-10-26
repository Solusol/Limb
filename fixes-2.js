"use strict";

(() => {
  const D = window.LIMB || {};

  const PATHS = {
    paper: D.art?.paper || "assets/decor/paper-sheet.png",
    frame: "assets/frames/article-panel.png",
    open: "assets/buttons/open.png"
  };

  /* ---------- Стили ---------- */

  const style = document.createElement("style");
  style.id = "limb-fixes-2";

  style.textContent = `
    /* Параметры для точной подгонки (в % от ширины бумаги) */
    :root {
      --paper-text-left: 17%;
      --paper-text-top: 56%;
      --paper-text-width: 58%;
      --tape-overlap: 6vw;
    }

    /* 1. Фикбук и TikTok — руки выровнены по одной левой линии */
    .external-links {
      justify-items: start !important;
      justify-self: end;
    }

    .external-links a {
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
    }

    /* 2. Бумага: пропорции сохраняются, без зазоров по краям */
    #home .paper-section {
      width: 100% !important;
      margin-inline: 0 !important;
      padding: 0 !important;

      background-image: none !important;
      background-color: transparent !important;

      aspect-ratio: var(--paper-ratio, 2 / 1);
      height: auto !important;
    }

    #home .paper-section::after {
      content: none !important;
    }

    #home .paper-section > .paper-art {
      position: absolute;
      inset: 0;

      display: block;
      width: 100%;
      height: 100%;
      max-width: none;

      object-fit: contain;
      pointer-events: none;
      z-index: 0;
    }

    /* Текст — в отмеченном поле */
    #home .paper-content {
      position: absolute !important;
      z-index: 1;

      left: var(--paper-text-left);
      top: var(--paper-text-top);
      width: var(--paper-text-width);

      margin: 0 !important;
      padding: 0 !important;
    }

    #home .annotation {
      font-size: clamp(11px, 1.35vw, 26px) !important;
      line-height: 1.45 !important;
    }

    #home .annotation p + p {
      margin-top: 1.4em !important;
    }

    /* 3. Скотч выше — верхний край перекрывает бумагу */
    #home .home-tape {
      position: relative;
      z-index: 3;
      margin-top: calc(-1 * var(--tape-overlap)) !important;
    }

    /* 4. Рамка поверх обложки */
    #home .section-picture {
      position: relative;
      padding: 6% !important;
      background-image: none !important;
    }

    #home .section-picture > img {
      position: relative;
      z-index: 0;
    }

    #home .section-picture::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 1;

      background-image: url("${PATHS.frame}");
      background-repeat: no-repeat;
      background-size: 100% 100%;

      pointer-events: none;
    }

    /* Кнопка «Открыть» вместо руки */
    #home .section-cards .open-image-link {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
    }

    #home .section-cards .open-image-link img {
      display: block;
      width: clamp(80px, 9vw, 130px);
      height: auto;
    }

    @media (max-width: 700px) {
      :root {
        --tape-overlap: 8vw;
      }

      #home .annotation {
        font-size: clamp(8px, 1.6vw, 14px) !important;
      }
    }
  `;

  document.head.append(style);

  /* ---------- Бумага как <img> с реальными пропорциями ---------- */

  const paper = document.querySelector("#home .paper-section");

  if (paper && !paper.querySelector(".paper-art")) {
    const art = new Image();
    art.className = "paper-art";
    art.alt = "";
    art.decoding = "async";

    art.addEventListener("load", () => {
      paper.style.setProperty(
        "--paper-ratio",
        `${art.naturalWidth} / ${art.naturalHeight}`
      );
    }, { once: true });

    art.src = PATHS.paper;
    paper.prepend(art);
  }

  /* ---------- Рука → open.png в карточках разделов ---------- */

  document
    .querySelectorAll("#home .section-cards .hand-open-link")
    .forEach(oldLink => {
      const link = document.createElement("a");
      link.className = "open-image-link";
      link.href = oldLink.getAttribute("href");
      link.setAttribute(
        "aria-label",
        oldLink.getAttribute("aria-label") || "Открыть"
      );

      const img = new Image();
      img.src = PATHS.open;
      img.alt = "";
      img.decoding = "async";

      link.append(img);
      oldLink.replaceWith(link);
    });
})();