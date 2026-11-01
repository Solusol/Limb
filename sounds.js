"use strict";

/*
  Звуки Лимба.

  Короткие звуки действий включены всегда.
  Тихий зацикленный фон включён по умолчанию; одна кнопка-динамик
  в шапке выключает и включает только его.

  Выбор посетителя запоминается в localStorage. Браузеры не дают
  запускать звук без действия человека, поэтому фон стартует
  после первого касания, клика или нажатия клавиши.
*/

(() => {
  const BASE = "assets/sounds/";

  const CONFIG = {
    /* Громкость всех звуков действий: 0–1 */
    effectsVolume: 0.8,

    /* Громкость фона: 0–1 */
    ambienceVolume: 0.55,

    /* Плавное включение фона, секунды */
    ambienceFade: 1.5,

    /* Выключение кнопкой — быстрое, чтобы реакция была сразу */
    ambienceFadeOut: 0.5,

    /*
      Фоновая дорожка. Файлы лежат парами: .ogg и .mp3,
      браузер выбирает поддерживаемый формат.
      Варианты: "ambience-hum" — низкий гул с каплями,
      "ambience-storm" — дождь с грозой, "ambience-wind" — ветер.
    */
    ambience: "ambience-hum",

    /* Кнопка фона: обычное состояние, ховер, выключено, выключено + ховер */
    button: {
      on: "assets/buttons/zvuk.webp",
      onHover: "assets/buttons/zvuk-hover.webp",
      off: "assets/buttons/zvuk-off.webp",
      offHover: "assets/buttons/zvuk-off-hover.webp"
    },

    effects: {
      click: ["ui-click.mp3"],
      clickSoft: ["ui-click-2.mp3"],
      tick: ["tick.mp3"],
      switch: ["switch.mp3"],
      undo: ["undo.mp3"],
      redo: ["redo.mp3"],
      paperOpen: ["paper-open.mp3"],
      paperClose: ["paper-close.mp3"],
      paperFlip: ["paper-flip-1.mp3", "paper-flip-2.mp3"],
      sticker: ["sticker.mp3"],
      rustle: ["rustle.mp3"],
      pin: ["pin.mp3"]
    },

    /*
      Что звучит при клике. Проверяется сверху вниз,
      срабатывает первое совпадение.
    */
    clickMap: [
      ["#bn-cancel.bn-history-button", "undo"],
      ["#bn-redo", "redo"],
      [".bn-paper-choice", "paperFlip"],
      [".bn-sticker-choice", "sticker"],
      ["#bn-publish", null],
      [".bn-note", null],
      [".bn-reader-close", null],
      [".cc-cell", "tick"],
      [".cc-icon-choice", "clickSoft"],
      [".cc-close", "clickSoft"],
      [".cc-upload, .cc-gallery-upload, .cc-image-upload, .cc-live-upload", "clickSoft"],
      ["[data-person-view], #person-prev, #person-next", "paperFlip"],
      ["#cover-prev, #cover-next", "paperFlip"],
      [".portrait, .cc-card-open", "paperOpen"],
      [".section-picture, .menu-row", "click"],
      ["#map-plus, #map-minus, #map-reset", "clickSoft"],
      ["#sound-ambience", null],
      [
        "a[href^='#'], .image-button, .text-button, .back-link, " +
        ".bn-art-button, #bn-new, #bn-place, #bn-cancel, .cc-icon-select, " +
        "button",
        "click"
      ]
    ]
  };

  const STORAGE_KEY = "limb-sound";

  const state = {
    effects: true,
    ambience: true,
    context: null,
    buffers: new Map(),
    pending: new Map(),
    master: null,
    ambienceGain: null,
    ambienceSource: null,
    ambienceFading: null,
    ambienceLoading: false,
    lastPlayed: new Map(),
    unlocked: false
  };

  /* ---------- Сохранение выбора ---------- */

  function readPreference() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.ambience === "boolean") state.ambience = saved.ambience;
    } catch {
      /* Хранилище недоступно — остаёмся с настройками по умолчанию */
    }
  }

  function savePreference() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ambience: state.ambience })
      );
    } catch {
      /* Ничего страшного: настройка проживёт до перезагрузки */
    }
  }

  /* ---------- Web Audio ---------- */

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  function context() {
    if (!AudioContextClass) return null;

    if (!state.context) {
      state.context = new AudioContextClass();

      state.master = state.context.createGain();
      state.master.gain.value = 1;
      state.master.connect(state.context.destination);

      state.ambienceGain = state.context.createGain();
      state.ambienceGain.gain.value = 0;
      state.ambienceGain.connect(state.master);
    }

    if (state.context.state === "suspended") {
      state.context.resume().catch(() => {});
    }

    return state.context;
  }

  function canPlay(type) {
    const probe = document.createElement("audio");
    return Boolean(probe.canPlayType && probe.canPlayType(type));
  }

  const preferOgg = canPlay("audio/ogg; codecs=vorbis");

  const ambienceTrack = Array.isArray(CONFIG.ambience)
    ? pick(CONFIG.ambience)
    : CONFIG.ambience;

  function ambienceFile() {
    return BASE + ambienceTrack + (preferOgg ? ".ogg" : ".mp3");
  }

  function loadBuffer(url) {
    if (state.buffers.has(url)) {
      return Promise.resolve(state.buffers.get(url));
    }

    if (state.pending.has(url)) return state.pending.get(url);

    const ctx = context();
    if (!ctx) return Promise.resolve(null);

    const task = fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`Не найден файл: ${url}`);
        return response.arrayBuffer();
      })
      .then(data => new Promise((resolve, reject) => {
        /* Старый Safari принимает только колбэки */
        const result = ctx.decodeAudioData(data, resolve, reject);
        if (result && result.then) result.then(resolve, reject);
      }))
      .then(buffer => {
        state.buffers.set(url, buffer);
        state.pending.delete(url);
        return buffer;
      })
      .catch(error => {
        state.pending.delete(url);
        console.warn("[Лимб: звуки]", error.message);
        return null;
      });

    state.pending.set(url, task);
    return task;
  }

  function preloadEffects() {
    Object.values(CONFIG.effects).forEach(list => {
      list.forEach(file => loadBuffer(BASE + file));
    });
  }

  /* ---------- Звуки действий ---------- */

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function playEffect(name) {
    if (!state.effects) return;

    const list = CONFIG.effects[name];
    if (!list || !list.length) return;

    /* Защита от дребезга: один и тот же звук не чаще 70 мс */
    const now = performance.now();
    if (now - (state.lastPlayed.get(name) || 0) < 70) return;
    state.lastPlayed.set(name, now);

    const ctx = context();
    if (!ctx) return;

    loadBuffer(BASE + pick(list)).then(buffer => {
      if (!buffer || !state.effects) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.value = CONFIG.effectsVolume;

      source.connect(gain);
      gain.connect(state.master);
      source.start();
    });
  }

  /* ---------- Фон ---------- */

  function startAmbience() {
    const ctx = context();
    if (!ctx || !state.ambience || document.hidden) return;
    if (state.ambienceSource) return;
    if (state.ambienceLoading) return;

    /* Если прошлый фон ещё затихает, обрываем его сразу */
    if (state.ambienceFading) {
      try { state.ambienceFading.stop(); } catch { /* уже остановлен */ }
      state.ambienceFading = null;
    }

    state.ambienceLoading = true;

    loadBuffer(ambienceFile()).then(buffer => {
      state.ambienceLoading = false;

      if (!buffer || !state.ambience || state.ambienceSource) return;
      if (document.hidden) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      /*
        Файл подготовлен с перекрёстным затуханием на стыке.
        Небольшой отступ прячет паузу, которую MP3-кодек
        добавляет по краям дорожки.
      */
      const trim = preferOgg ? 0 : 0.05;
      source.loopStart = trim;
      source.loopEnd = Math.max(trim + 1, buffer.duration - trim);

      source.connect(state.ambienceGain);
      source.start(0, trim);

      state.ambienceSource = source;

      const gain = state.ambienceGain.gain;
      gain.cancelScheduledValues(ctx.currentTime);
      gain.setValueAtTime(Math.max(gain.value, 0.0001), ctx.currentTime);
      gain.linearRampToValueAtTime(
        CONFIG.ambienceVolume,
        ctx.currentTime + CONFIG.ambienceFade
      );
    });
  }

  function stopAmbience(fade = CONFIG.ambienceFade) {
    const ctx = state.context;
    const source = state.ambienceSource;

    if (!ctx || !source) return;

    state.ambienceSource = null;
    state.ambienceFading = source;

    const gain = state.ambienceGain.gain;
    gain.cancelScheduledValues(ctx.currentTime);
    gain.setValueAtTime(gain.value, ctx.currentTime);
    gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fade);

    setTimeout(() => {
      try { source.stop(); } catch { /* уже остановлен */ }
      source.disconnect();
      if (state.ambienceFading === source) state.ambienceFading = null;
    }, fade * 1000 + 100);
  }

  /* Вкладка скрыта — фон плавно затихает, вернулась — возвращается */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAmbience(0.8);
    } else if (state.ambience && state.unlocked) {
      startAmbience();
    }
  });

  /* ---------- Кнопка фона в шапке ---------- */

  const style = document.createElement("style");
  style.id = "limb-sound-styles";
  style.textContent = `
    /* Пункты меню и кнопка выравниваются по общей средней линии */
    .site-header nav:has(#sound-ambience) {
      align-items: center;
    }

    #sound-ambience {
      display: inline-grid;
      grid-template-columns: minmax(0, 1fr);
      align-self: center;

      width: 52px;
      height: 52px;
      min-width: 44px;
      min-height: 44px;

      margin: 0;
      padding: 0;

      border: 0;
      background: transparent;
      box-shadow: none;
      line-height: 0;
      cursor: pointer;
    }

    #sound-ambience > img {
      grid-area: 1 / 1;

      display: block;
      width: 100%;
      height: 100%;

      object-fit: contain;
      pointer-events: none;
      user-select: none;

      opacity: 0;
      transition: opacity 160ms ease;
    }

    /* Фон включён: обычная картинка */
    #sound-ambience[aria-pressed="true"] > .sound-on {
      opacity: 1;
    }

    /* Фон выключен: перечёркнутый динамик */
    #sound-ambience[aria-pressed="false"] > .sound-off {
      opacity: 1;
    }

    @media (hover: hover) {
      #sound-ambience[aria-pressed="true"]:hover > .sound-on,
      #sound-ambience[aria-pressed="false"]:hover > .sound-off {
        opacity: 0;
      }

      #sound-ambience[aria-pressed="true"]:hover > .sound-on-hover,
      #sound-ambience[aria-pressed="false"]:hover > .sound-off-hover {
        opacity: 1;
      }
    }

    /* Нажатие пальцем и управление клавиатурой */
    #sound-ambience[aria-pressed="true"]:is(:active, .tap, :focus-visible) > .sound-on,
    #sound-ambience[aria-pressed="false"]:is(:active, .tap, :focus-visible) > .sound-off {
      opacity: 0;
    }

    #sound-ambience[aria-pressed="true"]:is(:active, .tap, :focus-visible) > .sound-on-hover,
    #sound-ambience[aria-pressed="false"]:is(:active, .tap, :focus-visible) > .sound-off-hover {
      opacity: 1;
    }

    #sound-ambience:focus-visible {
      outline: 1px dashed currentColor;
      outline-offset: 4px;
    }

    html.is-touch #sound-ambience {
      width: calc(52px * var(--m, 1));
      height: calc(52px * var(--m, 1));
    }

    @media (prefers-reduced-motion: reduce) {
      #sound-ambience > img {
        transition: none;
      }
    }
  `;
  document.head.append(style);

  function buttonImage(src, className) {
    const img = new Image(80, 80);
    img.src = src;
    img.alt = "";
    img.className = className;
    img.decoding = "async";
    return img;
  }

  function syncButton(button) {
    button.setAttribute("aria-pressed", String(state.ambience));
    button.setAttribute(
      "aria-label",
      state.ambience ? "Фоновый звук включён. Выключить" : "Фоновый звук выключен. Включить"
    );
    button.title = state.ambience ? "Выключить фон" : "Включить фон";
  }

  function mountControls() {
    const host =
      document.querySelector(".site-header nav") ||
      document.querySelector(".site-header");

    if (!host || document.getElementById("sound-ambience")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.id = "sound-ambience";

    button.append(
      buttonImage(CONFIG.button.on, "sound-on"),
      buttonImage(CONFIG.button.onHover, "sound-on-hover"),
      buttonImage(CONFIG.button.off, "sound-off"),
      buttonImage(CONFIG.button.offHover, "sound-off-hover")
    );

    syncButton(button);

    button.addEventListener("click", () => {
      state.ambience = !state.ambience;
      state.unlocked = true;
      syncButton(button);
      savePreference();

      if (state.ambience) {
        startAmbience();
      } else {
        stopAmbience(CONFIG.ambienceFadeOut);
      }

      playEffect("switch");
    });

    /* Первой в верхнем меню, перед «Библией» */
    host.prepend(button);
  }

  /* ---------- Привязка к действиям ---------- */

  function soundForTarget(target) {
    for (const [selector, name] of CONFIG.clickMap) {
      let element = null;

      try {
        element = target.closest(selector);
      } catch {
        continue;
      }

      if (!element) continue;
      if (element.disabled) return null;
      if (element.getAttribute("aria-disabled") === "true") return null;

      return name;
    }

    return null;
  }

  document.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    /* Перетаскивание записки не должно щёлкать */
    if (event.target.closest(".bn-note.movable")) return;

    const name = soundForTarget(event.target);
    if (name) playEffect(name);
  }, true);

  /* Выбор главы карты из списка */
  document.addEventListener("change", event => {
    if (!(event.target instanceof Element)) return;

    if (event.target.matches("#chapter-select")) {
      playEffect("rustle");
    }
  }, true);

  /* Открытие и закрытие окон: записка и выбор иконки */
  function watchDialog(dialog, openSound, closeSound) {
    if (!dialog || dialog.dataset.soundWatched) return;
    dialog.dataset.soundWatched = "true";

    let wasOpen = dialog.open;

    const observer = new MutationObserver(() => {
      if (dialog.open === wasOpen) return;
      wasOpen = dialog.open;
      playEffect(dialog.open ? openSound : closeSound);
    });

    observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
  }

  /* Успешная публикация записки: ловим сообщение доски */
  function watchBoardStatus(statusNode) {
    if (!statusNode || statusNode.dataset.soundWatched) return;
    statusNode.dataset.soundWatched = "true";

    const observer = new MutationObserver(() => {
      const text = statusNode.textContent || "";

      if (/^Опубликовано|^Записка размещена/.test(text.trim())) {
        playEffect("pin");
      }
    });

    observer.observe(statusNode, { childList: true, characterData: true, subtree: true });
  }

  function bindDynamic() {
    watchDialog(document.getElementById("bn-reader"), "paperOpen", "paperClose");
    watchDialog(document.getElementById("cc-icons"), "clickSoft", "clickSoft");
    watchBoardStatus(document.getElementById("bn-status"));
  }

  /* Доска и конструктор создают свои элементы позже — следим за появлением */
  const bodyObserver = new MutationObserver(bindDynamic);
  bodyObserver.observe(document.body, { childList: true, subtree: true });

  /*
    После перезагрузки с сохранённой настройкой фон можно запустить
    только после первого действия посетителя.
  */
  function unlock() {
    state.unlocked = true;

    context();
    preloadEffects();

    if (state.ambience) startAmbience();

    document.removeEventListener("pointerdown", unlock, true);
    document.removeEventListener("keydown", unlock, true);
  }

  readPreference();
  mountControls();
  bindDynamic();

  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);
})();
