"use strict";

/*
  Главный экран: заголовок LIMB и подпись под ним
  появляются по буквам, как будто печатаются.

  Анимация идёт один раз за открытие страницы — когда главная
  впервые становится видимой. Системная настройка «уменьшить
  движение» здесь не учитывается: эффект не связан с движением
  элементов, буквы просто проявляются на своих местах.
*/

(() => {
  const title = document.getElementById("home-title");
  const note = title?.parentElement?.querySelector("p");
  const home = document.getElementById("home");

  if (!title || !note || !home) return;

  const SETTINGS = {
    /* Пауза перед первой буквой */
    startDelay: 350,

    /* Заголовок: интервал между буквами и разброс */
    titleStep: 260,
    titleJitter: 120,

    /* Пауза между заголовком и подписью */
    gap: 450,

    /* Подпись: интервал между символами и разброс */
    noteStep: 42,
    noteJitter: 40,

    /* Пауза на пробелах и знаках препинания */
    notePause: 120,

    /* Сколько курсор мигает после окончания, мс */
    cursorLinger: 1800
  };

  const style = document.createElement("style");
  style.id = "limb-intro-styles";
  style.textContent = `
    .type-char {
      visibility: hidden;
    }

    .type-char.is-shown {
      visibility: visible;
    }

    /* Курсор печати — тонкая вертикальная черта цветом текста */
    .type-cursor {
      display: inline-block;
      width: .06em;
      height: .9em;
      margin-left: .08em;
      vertical-align: -.08em;
      background: currentColor;
      opacity: 0;
    }

    .type-cursor.is-active {
      opacity: 1;
    }

    .type-cursor.is-blinking {
      animation: type-cursor-blink 1s steps(1, end) infinite !important;
    }

    @keyframes type-cursor-blink {
      50% { opacity: 0; }
    }

    .type-cursor.is-done {
      opacity: 0;
      animation: none;
      transition: opacity 300ms ease;
    }
  `;
  document.head.append(style);

  /*
    Разбиваем текст на символы. Пробелы остаются обычными,
    чтобы перенос строк в подписи работал как прежде.
  */
  function splitToChars(element) {
    const text = element.textContent;
    element.setAttribute("aria-label", text);
    element.textContent = "";

    const spans = [];

    for (const char of text) {
      const span = document.createElement("span");
      span.className = "type-char";
      span.setAttribute("aria-hidden", "true");
      span.textContent = char;
      element.append(span);
      spans.push(span);
    }

    /* Курсор вставляется перед первой буквой и движется за текстом */
    const cursor = document.createElement("span");
    cursor.className = "type-cursor";
    cursor.setAttribute("aria-hidden", "true");
    element.prepend(cursor);

    return { spans, cursor };
  }

  function jitter(base, spread) {
    return base + (Math.random() * 2 - 1) * spread;
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function typeOut(parts, step, spread, pauseOn) {
    const { spans, cursor } = parts;
    cursor.classList.add("is-active");

    for (const span of spans) {
      await wait(jitter(step, spread));
      span.classList.add("is-shown");
      span.after(cursor);

      if (pauseOn && pauseOn.test(span.textContent)) {
        await wait(SETTINGS.notePause);
      }
    }
  }

  const titleParts = splitToChars(title);
  const noteParts = splitToChars(note);

  let started = false;

  async function play() {
    if (started) return;
    started = true;

    await wait(SETTINGS.startDelay);

    await typeOut(titleParts, SETTINGS.titleStep, SETTINGS.titleJitter);
    titleParts.cursor.classList.add("is-done");

    await wait(SETTINGS.gap);

    await typeOut(
      noteParts,
      SETTINGS.noteStep,
      SETTINGS.noteJitter,
      /[\s,—*]/
    );

    noteParts.cursor.classList.add("is-blinking");
    await wait(SETTINGS.cursorLinger);
    noteParts.cursor.classList.add("is-done");
  }

  function startWhenVisible() {
    if (started) return;

    /* Главная может быть скрыта, если открыли сайт по прямой ссылке */
    if (!home.hidden && document.body.dataset.page === "home") {
      play();
    }
  }

  /* app.js выставляет страницу синхронно; ждём его завершения */
  requestAnimationFrame(startWhenVisible);
  window.addEventListener("hashchange", () => {
    requestAnimationFrame(startWhenVisible);
  });

  /* Если вкладка открыта в фоне — не тратим анимацию впустую */
  if (document.hidden) {
    started = true;

    document.addEventListener("visibilitychange", function onVisible() {
      if (document.hidden) return;
      document.removeEventListener("visibilitychange", onVisible);
      started = false;
      startWhenVisible();
    });
  }
})();
