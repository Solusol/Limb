"use strict";

(() => {
  const C = window.LIMB_BOARD;
  const main = document.querySelector("#main");
  const nav = document.querySelector(".site-header nav");

  if (!C || !main) {
    console.error("Доска: подключи board-config.js и проверь наличие #main.");
    return;
  }

  if (document.querySelector("#bulletin-board")) {
    console.warn("Доска уже создана: board.js подключён повторно.");
    return;
  }

  const W = 1200;
  const H = 1600;

  const ART = {
    background: C.assets?.background || "doska-fon.png",
    panel: "fon.png",
    textField: "fon-tekst.png",
    paperHeading: C.assets?.paperHeading || "bumaga.png",
    stickerHeading: C.assets?.stickerHeading || "stikeri.png",

    newNote: "doska-knopka.png",
    newNoteHover: "doska-knopka-hover.png",

    publish: "opublikovat.png",
    publishHover: "opublikovat-hover.png",

    cancel: "otmena.png",
    cancelHover: "otmena-hover.png",
    cancelDisabled: "otmena-na.png",

    place: "doska-knopka-blue.png"
  };

  const base = (C.base || "assets/doska/").replace(/\/?$/, "/");
  const asset = file => base + file;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const clone = value => JSON.parse(JSON.stringify(value));

  const papers = Array.isArray(C.papers) ? C.papers : [];

  const stickers = [
    ...(Array.isArray(C.specialStickers) ? C.specialStickers : []),
    ...(Array.isArray(C.stickerNumbers) ? C.stickerNumbers : []).map(n => ({
      id: `sticker-${n}`,
      file: `Sticker (${n}) 1.png`
    }))
  ];

  if (!papers.length) {
    console.error("Доска: в board-config.js не задан список papers.");
    return;
  }

  const paperMap = new Map(papers.map(item => [item.id, item]));
  const stickerMap = new Map(stickers.map(item => [item.id, item]));
  const paperRatios = new Map();

  const state = {
    session: null,
    authPromise: null,

    rows: [],
    draft: null,
    placing: false,
    selected: null,
    editing: false,
    part: "text",

    dragging: false,
    writing: false,
    loadSequence: 0,
    suppressClickUntil: 0,

    captchaToken: "",
    captchaWidget: null,
    captchaPromise: null,

    history: [],
    historyKey: null
  };

  /* ---------- Вспомогательные функции ---------- */

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function picture(file, alt = "") {
    const img = new Image();

    img.alt = alt;
    img.width = 200;
    img.height = 200;
    img.loading = "lazy";
    img.decoding = "async";
    img.draggable = false;

    img.addEventListener("load", () => {
      img.width = img.naturalWidth;
      img.height = img.naturalHeight;
    }, { once: true });

    img.addEventListener("error", () => {
      img.hidden = true;
      console.warn("Доска: не найден файл", asset(file));
    }, { once: true });

    img.src = asset(file);
    return img;
  }

  /*
   * Кнопка из PNG.
   * normal — обычная, hover — наведение, disabled — неактивная.
   */
  function artButton(button, files) {
    button.type = "button";
    button.classList.add("bn-art-button");
    button.replaceChildren();

    const normal = picture(files.normal);
    normal.className = "bn-button-normal";
    button.append(normal);

    if (files.hover) {
      const hover = picture(files.hover);
      hover.className = "bn-button-hover";
      hover.addEventListener("load", () => {
        button.classList.add("bn-has-hover");
      }, { once: true });
      button.append(hover);
    }

    if (files.disabled) {
      const disabled = picture(files.disabled);
      disabled.className = "bn-button-disabled";
      disabled.addEventListener("load", () => {
        button.classList.add("bn-has-disabled");
      }, { once: true });
      button.append(disabled);
    }

    return normal;
  }

  /* ---------- Меню ---------- */

  if (nav && !nav.querySelector('a[href="#board"]')) {
    const link = node("a", "", "Доска объявлений");
    link.href = "#board";
    nav.append(link);
  }

  /* ---------- Разметка ---------- */

  const page = node("section", "page");
  page.id = "bulletin-board";
  page.hidden = true;
  page.setAttribute("aria-labelledby", "bn-page-title");

  page.innerHTML = `
    <h1 id="bn-page-title">Доска<br>объявлений</h1>

    <div class="bn-cork">
      <p class="bn-status" id="bn-status" role="status"></p>

      <div id="bn-board-view">
        <div class="bn-toolbar">
          <button id="bn-new" type="button"
                  aria-label="Оставить записку"></button>
          <button id="bn-publish" type="button" hidden
                  aria-label="Опубликовать записку для всех"></button>
        </div>

        <p class="bn-help" id="bn-board-help">
          На телефоне доску можно прокручивать вбок.
          Нажми на записку, чтобы прочитать её крупнее.
        </p>

        <div class="bn-scroll">
          <div id="bn-world" class="bn-world"
               aria-label="Общая доска записок"></div>
        </div>
      </div>

      <section id="bn-editor" class="bn-editor" hidden
               aria-label="Редактор записки">

        <img id="bn-paper-heading" class="bn-heading-art"
             alt="Выбрать бумагу" width="500" height="90">

        <div class="bn-editor-top">
          <button id="bn-cancel" type="button"
                  aria-label="Отменить последнее действие"
                  title="Отменить последнее действие"></button>
        </div>

        <div id="bn-papers" class="bn-papers"
             role="group" aria-label="Варианты бумаги"></div>

        <img id="bn-sticker-heading" class="bn-heading-art"
             alt="Добавить стикеры" width="500" height="90"
             loading="lazy">

        <div id="bn-stickers" class="bn-stickers"
             role="group" aria-label="Стикеры для записки"></div>

        <div class="bn-editor-grid">
          <div class="bn-preview-holder">
            <div id="bn-preview" aria-label="Предпросмотр записки"></div>
          </div>

          <div class="bn-fields">
            <label>
              Текст записки — до 280 символов
              <textarea id="bn-text" maxlength="280"
                        spellcheck="true"></textarea>
            </label>

            <label>
              Размер бумаги
              <input id="bn-width" type="range"
                     min="120" max="420" step="10" value="280">
            </label>

            <label>
              Размер текста
              <input id="bn-font" type="range"
                     min="3" max="8" step="0.25" value="4.5">
            </label>

            <label>
              Размер выбранного стикера
              <input id="bn-sticker-size" type="range"
                     min="0.06" max="0.45" step="0.01" value="0.2">
            </label>

            <div id="bn-captcha"></div>

            <button id="bn-place" type="button"
                    aria-label="Перейти к размещению"></button>
          </div>
        </div>
      </section>
    </div>
  `;

  main.append(page);

  const $ = id => page.querySelector(`#${id}`);
  const world = $("bn-world");
  const preview = $("bn-preview");
  const editor = $("bn-editor");

  page.style.setProperty("--bn-bg", `url(${JSON.stringify(asset(ART.background))})`);
  page.style.setProperty("--bn-panel", `url(${JSON.stringify(asset(ART.panel))})`);
  page.style.setProperty("--bn-text-bg", `url(${JSON.stringify(asset(ART.textField))})`);

  $("bn-paper-heading").src = asset(ART.paperHeading);
  $("bn-sticker-heading").src = asset(ART.stickerHeading);

  artButton($("bn-new"), {
    normal: ART.newNote,
    hover: ART.newNoteHover
  });

  artButton($("bn-publish"), {
    normal: ART.publish,
    hover: ART.publishHover
  });

  artButton($("bn-cancel"), {
    normal: ART.cancel,
    hover: ART.cancelHover,
    disabled: ART.cancelDisabled
  });

  /* Нижняя голубая кнопка: исходная ширина PNG */
  const placeImage = artButton($("bn-place"), { normal: ART.place });

  function applyPlaceSize() {
    if (placeImage.naturalWidth) {
      $("bn-place").style.setProperty(
        "--bn-place-width",
        `${placeImage.naturalWidth}px`
      );
    }
  }

  placeImage.addEventListener("load", applyPlaceSize, { once: true });
  if (placeImage.complete) applyPlaceSize();

  /* ---------- Стили, необходимые этому файлу ---------- */

  const style = node("style");
  style.id = "bn-board-js-styles";

  style.textContent = `
    #bulletin-board { --bn-accent: #516D79; }

    #bulletin-board #bn-editor {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: start;
      gap: 24px;

      background-color: transparent;
      background-image: var(--bn-panel);
      background-position: center;
      background-repeat: no-repeat;
      background-size: 100% 100%;
      box-shadow: none;
      filter: none;
    }

    #bulletin-board #bn-editor::before,
    #bulletin-board #bn-editor::after {
      content: none;
      display: none;
    }

    #bulletin-board #bn-editor > * {
      grid-column: 1 / -1;
      min-width: 0;
    }

    #bulletin-board #bn-editor > #bn-paper-heading {
      grid-column: 1;
      grid-row: 1;
      align-self: center;
      width: min(420px, 100%);
      height: auto;
      margin: 0;
    }

    #bulletin-board #bn-editor > .bn-editor-top {
      grid-column: 2;
      grid-row: 1;
      align-self: center;
      justify-self: end;
      margin: 0;
    }

    #bulletin-board #bn-editor > #bn-sticker-heading {
      margin: 0;
    }

    #bulletin-board .bn-art-button {
      display: inline-grid;
      grid-template-columns: minmax(0, 1fr);
      min-width: 44px;
      min-height: 44px;
      margin: 0;
      padding: 0;
      border: 0;
      background: none;
      box-shadow: none;
      line-height: 0;
    }

    #bulletin-board .bn-art-button[hidden] {
      display: none !important;
    }

    #bulletin-board .bn-art-button > img {
      grid-area: 1 / 1;
      display: block;
      align-self: center;
      width: 100%;
      max-width: 100%;
      height: auto;
      margin: 0;
      object-fit: contain;
      pointer-events: none;
      user-select: none;
      transition: opacity 160ms ease;
    }

    #bulletin-board .bn-button-hover,
    #bulletin-board .bn-button-disabled {
      opacity: 0;
    }

    #bulletin-board .bn-art-button:not(:disabled):hover {
      opacity: 1;
    }

    @media (hover: hover) {
      #bulletin-board .bn-art-button.bn-has-hover:not(:disabled):hover .bn-button-normal {
        opacity: 0;
      }
      #bulletin-board .bn-art-button.bn-has-hover:not(:disabled):hover .bn-button-hover {
        opacity: 1;
      }
    }

    #bulletin-board .bn-art-button.bn-has-hover:not(:disabled):focus-visible .bn-button-normal {
      opacity: 0;
    }

    #bulletin-board .bn-art-button.bn-has-hover:not(:disabled):focus-visible .bn-button-hover {
      opacity: 1;
    }

    #bulletin-board .bn-art-button:disabled {
      opacity: 1;
      cursor: default;
    }

    #bulletin-board .bn-art-button.bn-has-disabled:disabled .bn-button-normal,
    #bulletin-board .bn-art-button.bn-has-disabled:disabled .bn-button-hover {
      opacity: 0 !important;
    }

    #bulletin-board .bn-art-button.bn-has-disabled:disabled .bn-button-disabled {
      opacity: 1;
    }

    #bulletin-board .bn-art-button:not(.bn-has-disabled):disabled {
      opacity: .45;
    }

    /* Кнопки над доской: одно место, справа */
    #bulletin-board #bn-board-view > .bn-toolbar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      min-height: 100px;
      margin: 0;
      padding: 32px 16px 16px;
      gap: 12px;
    }

    #bulletin-board #bn-new,
    #bulletin-board #bn-publish {
      width: clamp(180px, 24vw, 280px);
      max-width: 100%;
    }

    #bulletin-board #bn-cancel {
      width: clamp(100px, 16vw, 190px);
    }

    #bulletin-board #bn-place {
      justify-self: center;
      width: var(--bn-place-width, max-content);
      max-width: 100%;
      margin-top: 16px;
    }

    /* Выбор бумаги и стикеров */
    #bulletin-board .bn-paper-choice,
    #bulletin-board .bn-sticker-choice {
      border: 1px dashed transparent;
      border-radius: 0;
      box-shadow: none;
    }

    #bulletin-board .bn-paper-choice[aria-pressed="true"],
    #bulletin-board .bn-sticker-choice[aria-pressed="true"] {
      border-color: var(--bn-accent);
    }

    @media (hover: hover) {
      #bulletin-board .bn-paper-choice:hover,
      #bulletin-board .bn-sticker-choice:hover {
        border-color: var(--bn-accent);
        opacity: 1;
      }
    }

    #bulletin-board .bn-paper-choice:focus-visible,
    #bulletin-board .bn-sticker-choice:focus-visible,
    #bulletin-board #bn-preview .bn-active-part {
      outline: 1px dashed var(--bn-accent);
      outline-offset: 2px;
    }

    #bulletin-board .bn-stickers {
      max-height: none;
      overflow: visible;
      grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
      gap: 8px;
    }

    /* Поле текста */
    #bulletin-board #bn-text {
      width: 100%;
      min-height: 190px;
      padding: 20px;
      border: 1px dashed transparent;
      border-radius: 0;
      background-color: transparent;
      background-image: var(--bn-text-bg);
      background-position: center;
      background-repeat: no-repeat;
      background-size: 100% 100%;
      color: #292a25;
      font: inherit;
      line-height: 1.5;
      box-shadow: none;
      resize: vertical;
    }

    #bulletin-board #bn-text:focus-visible {
      outline: 1px dashed var(--bn-accent);
      outline-offset: 3px;
    }

    /* Ползунки */
    #bulletin-board #bn-editor input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 44px;
      margin: 0;
      padding: 0;
      background: transparent;
      border: 0;
      accent-color: var(--bn-accent);
      cursor: pointer;
    }

    #bulletin-board #bn-editor input[type="range"]::-webkit-slider-runnable-track {
      height: 4px;
      background: var(--bn-accent);
    }

    #bulletin-board #bn-editor input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      margin-top: -7px;
      border: 0;
      border-radius: 50%;
      background: var(--bn-accent);
    }

    #bulletin-board #bn-editor input[type="range"]::-moz-range-track {
      height: 4px;
      background: var(--bn-accent);
    }

    #bulletin-board #bn-editor input[type="range"]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border: 0;
      border-radius: 50%;
      background: var(--bn-accent);
    }

    #bulletin-board #bn-editor input[type="range"]:focus:not(:focus-visible) {
      outline: none;
    }

    #bulletin-board #bn-editor input[type="range"]:focus-visible {
      outline: 1px dashed var(--bn-accent);
      outline-offset: 3px;
    }

    #bulletin-board #bn-editor input[type="range"]:disabled {
      opacity: .45;
      cursor: default;
    }

    @media (max-width: 760px) {
      #bulletin-board #bn-editor { gap: 16px 12px; }
      #bulletin-board #bn-board-view > .bn-toolbar {
        min-height: 80px;
        padding: 20px 8px 12px;
      }
      #bulletin-board .bn-stickers {
        grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #bulletin-board .bn-art-button > img { transition: none; }
    }
  `;

  style.textContent += `
    /* Нижняя кнопка: уменьшение и подъём к отмеченной линии. */
    #bulletin-board #bn-editor .bn-fields {
      grid-template-columns: minmax(0, 1fr);
    }
    #bulletin-board #bn-editor .bn-fields > * {
      grid-column: 1 / -1;
    }
    #bulletin-board #bn-editor .bn-fields > #bn-place {
      grid-column: 1 / -1;
      justify-self: center;
      align-self: auto;
      width: clamp(140px, 14vw, 250px) !important;
      max-width: 100%;
      min-width: 0;
      min-height: 44px;
      margin-top: 16px;
      padding: 0;
      transform: translateY(-36px);
    }
    #bulletin-board #bn-editor #bn-place > img {
      width: 100%;
      height: auto;
    }
    /* Верхние кнопки остаются над доской, а не в редакторе. */
    #bulletin-board #bn-board-view > .bn-toolbar {
      display: flex !important;
      align-items: center;
      justify-content: flex-end;
      min-height: 100px;
      padding: 32px 16px 16px;
      margin: 0;
    }
    #bulletin-board #bn-board-view .bn-toolbar > button[hidden] {
      display: none !important;
    }
`;

  document.head.append(style);

  /* ---------- Окно чтения ---------- */

  const reader = document.createElement("dialog");
  reader.id = "bn-reader";
  reader.setAttribute("aria-label", "Просмотр записки");

  const closeReader = node("button", "bn-reader-close", "Закрыть");
  closeReader.type = "button";
  closeReader.addEventListener("click", () => reader.close());

  const readerBody = node("div");
  reader.append(closeReader, readerBody);
  document.body.append(reader);

  function status(text) {
    $("bn-status").textContent = text;
  }

  /* ---------- Supabase ---------- */

  function configured() {
    return /^https:\/\/[^/]+/.test(C.supabaseUrl || "")
      && Boolean(C.publicKey)
      && !C.publicKey.startsWith("ВСТАВЬ");
  }

  function apiRoot() {
    return C.supabaseUrl.replace(/\/+$/, "");
  }

  async function fetchJSON(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      const text = await response.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.msg ||
          data?.message ||
          data?.error_description ||
          "Не удалось выполнить запрос к базе."
        );
      }

      return data;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Сервер долго не отвечает. Попробуй снова.");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function saveSession(data) {
    state.session = {
      token: data.access_token,
      refreshToken: data.refresh_token,
      userId: data.user.id,
      expiresAt: Date.now() + data.expires_in * 1000
    };
  }

  async function performSignIn() {
    if (!configured()) {
      throw new Error("Заполни supabaseUrl и publicKey в board-config.js.");
    }

    if (state.session && state.session.expiresAt > Date.now() + 60000) {
      return;
    }

    if (state.session) {
      const data = await fetchJSON(
        `${apiRoot()}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            apikey: C.publicKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            refresh_token: state.session.refreshToken
          })
        }
      );

      saveSession(data);
      return;
    }

    if (C.captchaSiteKey && !state.captchaToken) {
      throw new Error("Пройди проверку CAPTCHA в редакторе.");
    }

    const body = { data: {} };

    if (state.captchaToken) {
      body.gotrue_meta_security = {
        captcha_token: state.captchaToken
      };
    }

    let data;

    try {
      data = await fetchJSON(`${apiRoot()}/auth/v1/signup`, {
        method: "POST",
        headers: {
          apikey: C.publicKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
    } finally {
      state.captchaToken = "";

      if (window.turnstile && state.captchaWidget !== null) {
        window.turnstile.reset(state.captchaWidget);
      }
    }

    if (!data?.access_token || !data?.user?.id) {
      throw new Error(
        "Гостевой вход не выполнен. Проверь Anonymous Sign-Ins в Supabase."
      );
    }

    saveSession(data);
  }

  function signIn() {
    if (!state.authPromise) {
      state.authPromise = performSignIn().finally(() => {
        state.authPromise = null;
      });
    }

    return state.authPromise;
  }

  async function request(query, method = "GET", body = null) {
    if (!configured()) {
      throw new Error("Не заполнена конфигурация Supabase.");
    }

    if (state.session) await signIn();

    const headers = { apikey: C.publicKey };

    if (state.session) {
      headers.Authorization = `Bearer ${state.session.token}`;
    }

    if (body !== null) {
      headers["Content-Type"] = "application/json";
      headers.Prefer = "return=representation";
    }

    return fetchJSON(`${apiRoot()}/rest/v1/limb_board_notes${query}`, {
      method,
      headers,
      body: body === null ? undefined : JSON.stringify(body)
    });
  }

  async function setupCaptcha() {
    if (!C.captchaSiteKey || state.captchaWidget !== null) return;
    if (state.captchaPromise) return state.captchaPromise;

    state.captchaPromise = (async () => {
      if (!window.turnstile) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src =
            "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
          script.onload = resolve;
          script.onerror = () => {
            script.remove();
            reject(new Error("Не удалось загрузить CAPTCHA."));
          };
          document.head.append(script);
        });
      }

      state.captchaWidget = window.turnstile.render($("bn-captcha"), {
        sitekey: C.captchaSiteKey,
        theme: "dark",
        callback: token => { state.captchaToken = token; },
        "expired-callback": () => { state.captchaToken = ""; },
        "error-callback": () => {
          state.captchaToken = "";
          status("Ошибка CAPTCHA. Попробуй пройти проверку ещё раз.");
        }
      });
    })();

    try {
      await state.captchaPromise;
    } finally {
      state.captchaPromise = null;
    }
  }

  /* ---------- Данные записки ---------- */

  function freshDraft() {
    if (!window.crypto?.randomUUID) {
      throw new Error(
        "Открой сайт по HTTPS или через localhost в современном браузере."
      );
    }

    const first = papers[0];

    return {
      id: crypto.randomUUID(),
      x: 400,
      y: 80,
      width: 280,
      payload: {
        kind: "note",
        paperId: first.id,
        ratio: paperRatios.get(first.id) ||
          clamp(first.ratio || 1.414, 0.45, 1.8),
        text: "",
        font: 4.5,
        tx: 0.12,
        ty: 0.12,
        stickers: []
      }
    };
  }

  function mine(row) {
    return Boolean(state.session && row.owner_id === state.session.userId);
  }

  function bounded(row) {
    row.x = clamp(Number(row.x) || 0, 0, W - row.width);
    row.y = clamp(Number(row.y) || 0, 0, H - row.width * row.payload.ratio);
    return row;
  }

  function boundSticker(sticker, ratio) {
    sticker.w = clamp(Number(sticker.w) || 0.2, 0.06, Math.min(1, ratio));
    sticker.x = clamp(Number(sticker.x) || 0, 0, 1 - sticker.w);
    sticker.y = clamp(Number(sticker.y) || 0, 0, 1 - sticker.w / ratio);
  }

  /*
   * Старые записи kind: "sticker" по-прежнему отображаются,
   * но новые отдельные стикеры не создаются.
   */
  function renderNote(row, editable = false) {
    const p = row.payload;
    const note = node("article", "bn-note");

    note.style.aspectRatio = `1 / ${p.ratio}`;
    note.style.setProperty("--bn-font", p.font);

    if (p.kind === "note") {
      const paper = paperMap.get(p.paperId);

      if (paper) {
        const bg = picture(paper.file);
        bg.className = "bn-paper";
        note.append(bg);
      }

      const text = node("p", "bn-note-text", p.text);
      text.style.left = `${p.tx * 100}%`;
      text.style.top = `${p.ty * 100}%`;
      text.dataset.part = "text";

      if (editable && state.part === "text") {
        text.classList.add("bn-active-part");
      }

      note.append(text);
    }

    p.stickers.forEach((sticker, index) => {
      const data = stickerMap.get(sticker.id);
      if (!data) return;

      const wrapper = node("div", "bn-sticker");
      wrapper.style.left = `${sticker.x * 100}%`;
      wrapper.style.top = `${sticker.y * 100}%`;
      wrapper.style.width = `${sticker.w * 100}%`;
      wrapper.dataset.part = String(index);

      if (editable && state.part === index) {
        wrapper.classList.add("bn-active-part");
      }

      wrapper.append(picture(data.file));
      note.append(wrapper);
    });

    return note;
  }

  function showRead(row) {
    readerBody.replaceChildren(renderNote(row));
    if (!reader.open) reader.showModal();
  }

  /* ---------- Кнопки над доской ---------- */

  function syncToolbar() {
    const placingDraft = Boolean(state.placing && state.draft);

    $("bn-new").hidden = placingDraft;
    $("bn-publish").hidden = !placingDraft;
    $("bn-publish").disabled = state.writing;
    $("bn-new").disabled = state.writing;

    $("bn-board-help").textContent = placingDraft
      ? "Перетащи записку на нужное место и нажми «Опубликовать»."
      : "На телефоне доску можно прокручивать вбок. " +
        "Нажми на записку, чтобы прочитать её крупнее.";
  }

  /* ---------- Доска ---------- */

  function renderBoard() {
    world.replaceChildren();

    const rows = state.placing && state.draft
      ? [...state.rows, state.draft]
      : state.rows;

    rows.forEach(row => {
      const isDraft = state.placing && row === state.draft;
      const movable = Boolean(isDraft || (state.editing && mine(row)));
      const note = renderNote(row);

      note.dataset.id = row.id;
      note.tabIndex = 0;
      note.setAttribute(
        "aria-label",
        isDraft
          ? "Неопубликованная записка"
          : row.payload.kind === "sticker"
            ? "Стикер"
            : `Записка: ${row.payload.text.slice(0, 70)}`
      );

      note.style.left = `${row.x / W * 100}%`;
      note.style.top = `${row.y / H * 100}%`;
      note.style.width = `${row.width / W * 100}%`;

      note.classList.toggle("draft", isDraft);
      note.classList.toggle("movable", movable);
      note.classList.toggle("selected", state.selected === row.id);

      note.addEventListener("click", () => {
        if (Date.now() < state.suppressClickUntil) return;
        if (!movable) showRead(row);
      });

      note.addEventListener("keydown", event => {
        if (event.key === "Enter" && !movable) {
          event.preventDefault();
          showRead(row);
        }
      });

      world.append(note);
    });

    syncToolbar();
  }

  function invalidateLoading() {
    state.loadSequence++;
  }

  async function loadBoard() {
    if (!configured()) return;

    if (state.dragging || state.writing) return;

    const sequence = ++state.loadSequence;

    try {
      const rows = await request(
        "?select=id,owner_id,x,y,width,payload,version,created_at" +
        "&order=created_at.asc&limit=500"
      );

      if (sequence !== state.loadSequence || state.dragging || state.writing) {
        return;
      }

      state.rows = Array.isArray(rows) ? rows : [];
      renderBoard();
    } catch (error) {
      if (sequence === state.loadSequence) status(error.message);
    }
  }

  async function savePosition(row) {
    if (!mine(row) || state.writing) return;

    invalidateLoading();
    state.writing = true;
    syncToolbar();

    try {
      const updated = await request(
        `?id=eq.${row.id}&version=eq.${row.version}`,
        "PATCH",
        { x: row.x, y: row.y }
      );

      if (!updated?.length) {
        throw new Error("Записка уже изменилась. Обнови страницу.");
      }

      Object.assign(row, updated[0]);
      status("Положение сохранено для всех посетителей.");
    } catch (error) {
      status(error.message);
    } finally {
      state.writing = false;
      syncToolbar();
      await loadBoard();
    }
  }

  /* Перемещение записки по доске */
  let boardDrag = null;

  world.addEventListener("pointerdown", event => {
    if (event.button !== 0 || state.writing) return;

    const item = event.target.closest(".bn-note.movable");
    if (!item) return;

    const row = state.placing && item.dataset.id === state.draft?.id
      ? state.draft
      : state.rows.find(n => n.id === item.dataset.id);

    if (!row) return;

    invalidateLoading();
    state.dragging = true;
    state.selected = row.id;

    const rect = world.getBoundingClientRect();

    boardDrag = {
      row,
      item,
      id: event.pointerId,
      px: event.clientX,
      py: event.clientY,
      x: row.x,
      y: row.y,
      sx: W / rect.width,
      sy: H / rect.height,
      moved: false
    };

    world.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  world.addEventListener("pointermove", event => {
    if (!boardDrag || boardDrag.id !== event.pointerId) return;

    const d = boardDrag;
    const dx = event.clientX - d.px;
    const dy = event.clientY - d.py;

    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;

    d.row.x = d.x + dx * d.sx;
    d.row.y = d.y + dy * d.sy;
    bounded(d.row);

    d.item.style.left = `${d.row.x / W * 100}%`;
    d.item.style.top = `${d.row.y / H * 100}%`;
  });

  world.addEventListener("pointerup", async event => {
    if (!boardDrag || boardDrag.id !== event.pointerId) return;

    const d = boardDrag;
    boardDrag = null;
    state.dragging = false;

    if (d.moved) {
      state.suppressClickUntil = Date.now() + 300;
      if (d.row !== state.draft) await savePosition(d.row);
    }
  });

  world.addEventListener("pointercancel", () => {
    if (boardDrag) {
      boardDrag.row.x = boardDrag.x;
      boardDrag.row.y = boardDrag.y;
    }

    boardDrag = null;
    state.dragging = false;
    renderBoard();
  });

  /* ---------- История действий редактора ---------- */

  /*
   * Сохраняет состояние перед изменением.
   * key объединяет серию изменений в один шаг:
   * одно движение ползунка, одно перетаскивание,
   * один период ввода текста.
   */
  function remember(key = null) {
    if (!state.draft) return;
    if (key && state.historyKey === key) return;

    state.history.push({
      draft: clone(state.draft),
      part: state.part
    });

    if (state.history.length > 100) state.history.shift();

    state.historyKey = key;
    updateControls();
  }

  function endHistoryGroup() {
    state.historyKey = null;
  }

  function resetHistory() {
    state.history = [];
    state.historyKey = null;
  }

  function undo() {
    if (!state.draft || state.writing) return;

    const previous = state.history.pop();
    endHistoryGroup();

    if (!previous) {
      updateControls();
      return;
    }

    partDrag = null;
    state.draft = previous.draft;
    state.part = previous.part;
    $("bn-text").value = state.draft.payload.text;

    renderPreview();
    status("Последнее действие отменено.");
  }

  $("bn-cancel").addEventListener("click", undo);

  /* ---------- Редактор ---------- */

  function updateControls() {
    const draft = state.draft;
    if (!draft) return;

    $("bn-width").value = draft.width;
    $("bn-font").value = draft.payload.font;

    const selected = Number.isInteger(state.part)
      ? draft.payload.stickers[state.part]
      : null;

    $("bn-sticker-size").disabled = !selected;
    if (selected) $("bn-sticker-size").value = selected.w;

    $("bn-cancel").disabled = state.writing || state.history.length === 0;

    $("bn-papers").querySelectorAll("button").forEach(button => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.paper === draft.payload.paperId)
      );
    });

    $("bn-stickers").querySelectorAll("button").forEach(button => {
      button.setAttribute(
        "aria-pressed",
        String(Boolean(selected && button.dataset.sticker === selected.id))
      );
    });
  }

  function updatePreviewParts() {
    const draft = state.draft;
    const note = preview.querySelector(".bn-note");
    if (!draft || !note) return;

    const p = draft.payload;

    note.style.aspectRatio = `1 / ${p.ratio}`;
    note.style.width = `${draft.width / 420 * 100}%`;
    note.style.setProperty("--bn-font", p.font);

    const text = note.querySelector(".bn-note-text");

    if (text) {
      text.textContent = p.text;
      text.style.left = `${p.tx * 100}%`;
      text.style.top = `${p.ty * 100}%`;
    }

    note.querySelectorAll("[data-part]").forEach(part => {
      const key = part.dataset.part;
      const active = key === "text"
        ? state.part === "text"
        : state.part === Number(key);

      part.classList.toggle("bn-active-part", active);

      if (key !== "text") {
        const sticker = p.stickers[Number(key)];
        if (!sticker) return;

        part.style.left = `${sticker.x * 100}%`;
        part.style.top = `${sticker.y * 100}%`;
        part.style.width = `${sticker.w * 100}%`;
      }
    });

    updateControls();
  }

  function renderPreview() {
    if (!state.draft) return;

    const note = renderNote(state.draft, true);
    note.classList.add("bn-preview");
    note.style.width = `${state.draft.width / 420 * 100}%`;

    preview.replaceChildren(note);
    updateControls();
  }

  function choosePaper(paper, withHistory = true) {
    const draft = state.draft;
    if (!draft || !paper) return;
    if (withHistory && draft.payload.paperId === paper.id) return;

    if (withHistory) {
      endHistoryGroup();
      remember();
      endHistoryGroup();
    }

    draft.payload.kind = "note";
    draft.payload.paperId = paper.id;
    draft.payload.ratio = paperRatios.get(paper.id) ||
      clamp(paper.ratio || 1.414, 0.45, 1.8);

    draft.payload.stickers.forEach(s => boundSticker(s, draft.payload.ratio));
    renderPreview();

    if (paperRatios.has(paper.id)) return;

    const img = new Image();

    img.onload = () => {
      const ratio = clamp(img.naturalHeight / img.naturalWidth, 0.45, 1.8);
      paperRatios.set(paper.id, ratio);

      if (state.draft !== draft || draft.payload.paperId !== paper.id) return;

      draft.payload.ratio = ratio;
      draft.payload.stickers.forEach(s => boundSticker(s, ratio));
      renderPreview();
    };

    img.onerror = () => {
      status(`Не найдена бумага: ${asset(paper.file)}.`);
    };

    img.src = asset(paper.file);
  }

  papers.forEach(paper => {
    const button = node("button", "bn-paper-choice");
    button.type = "button";
    button.dataset.paper = paper.id;
    button.setAttribute("aria-label", `Выбрать бумагу ${paper.id}`);
    button.setAttribute("aria-pressed", "false");
    button.append(picture(paper.file));
    button.addEventListener("click", () => choosePaper(paper));
    $("bn-papers").append(button);
  });

  /* Стикеры добавляются только на бумагу */
  stickers.forEach(sticker => {
    const button = node("button", "bn-sticker-choice");
    button.type = "button";
    button.dataset.sticker = sticker.id;
    button.setAttribute("aria-label", `Добавить стикер ${sticker.id}`);
    button.setAttribute("aria-pressed", "false");
    button.append(picture(sticker.file));

    button.addEventListener("click", () => {
      const p = state.draft?.payload;
      if (!p) return;

      if (p.stickers.length >= 8) {
        status("На одной записке можно разместить до восьми стикеров.");
        return;
      }

      endHistoryGroup();
      remember();
      endHistoryGroup();

      const added = { id: sticker.id, x: 0.65, y: 0.12, w: 0.2 };
      boundSticker(added, p.ratio);

      p.kind = "note";
      p.stickers.push(added);
      state.part = p.stickers.length - 1;

      renderPreview();
    });

    $("bn-stickers").append(button);
  });

  /* Текст: весь ввод до потери фокуса — один шаг */
  $("bn-text").addEventListener("input", event => {
    if (!state.draft) return;

    remember("text");
    state.draft.payload.text = event.target.value;
    updatePreviewParts();
  });

  $("bn-text").addEventListener("blur", endHistoryGroup);

  /* Ползунки: одно движение — один шаг */
  [
    ["bn-width", value => { state.draft.width = value; }],
    ["bn-font", value => { state.draft.payload.font = value; }],
    ["bn-sticker-size", value => {
      const p = state.draft.payload;
      const sticker = p.stickers[state.part];
      if (!sticker) return;
      sticker.w = value;
      boundSticker(sticker, p.ratio);
    }]
  ].forEach(([id, apply]) => {
    const input = $(id);

    input.addEventListener("input", () => {
      if (!state.draft) return;
      if (id === "bn-sticker-size" && !Number.isInteger(state.part)) return;

      remember(id);
      apply(Number(input.value));
      updatePreviewParts();
    });

    input.addEventListener("change", endHistoryGroup);
    input.addEventListener("pointerup", endHistoryGroup);
    input.addEventListener("blur", endHistoryGroup);
  });

  /* Перемещение текста и стикеров внутри бумаги */
  let partDrag = null;

  preview.addEventListener("pointerdown", event => {
    if (event.button !== 0 || !state.draft) return;

    const part = event.target.closest("[data-part]");
    const note = preview.querySelector(".bn-note");
    if (!part || !note) return;

    endHistoryGroup();

    state.part = part.dataset.part === "text"
      ? "text"
      : Number(part.dataset.part);

    const p = state.draft.payload;
    const sticker = Number.isInteger(state.part) ? p.stickers[state.part] : null;
    if (state.part !== "text" && !sticker) return;

    const rect = note.getBoundingClientRect();

    partDrag = {
      id: event.pointerId,
      px: event.clientX,
      py: event.clientY,
      width: rect.width,
      height: rect.height,
      x: state.part === "text" ? p.tx : sticker.x,
      y: state.part === "text" ? p.ty : sticker.y,
      remembered: false
    };

    preview.setPointerCapture(event.pointerId);
    event.preventDefault();
    updatePreviewParts();
  });

  preview.addEventListener("pointermove", event => {
    if (!partDrag || partDrag.id !== event.pointerId || !state.draft) return;

    const d = partDrag;
    const dx = event.clientX - d.px;
    const dy = event.clientY - d.py;

    /* Простой щелчок только выбирает элемент и не попадает в историю */
    if (!d.remembered) {
      if (Math.abs(dx) + Math.abs(dy) < 3) return;
      remember();
      d.remembered = true;
    }

    const p = state.draft.payload;
    const x = d.x + dx / d.width;
    const y = d.y + dy / d.height;

    if (state.part === "text") {
      p.tx = clamp(x, 0, 0.24);
      p.ty = clamp(y, 0, 0.26);
    } else {
      const sticker = p.stickers[state.part];
      if (!sticker) return;
      sticker.x = x;
      sticker.y = y;
      boundSticker(sticker, p.ratio);
    }

    updatePreviewParts();
  });

  ["pointerup", "pointercancel"].forEach(type => {
    preview.addEventListener(type, () => {
      partDrag = null;
      endHistoryGroup();
    });
  });

  function editorValid() {
    const p = state.draft?.payload;
    if (!p) return false;

    if (!p.text.trim() && !p.stickers.length) {
      status("Добавь текст или хотя бы один стикер на бумагу.");
      return false;
    }

    const text = preview.querySelector(".bn-note-text");

    if (
      text &&
      (text.scrollHeight > text.clientHeight + 2 ||
       text.scrollWidth > text.clientWidth + 2)
    ) {
      status("Текст не помещается на бумаге. Уменьши шрифт или сократи записку.");
      return false;
    }

    return true;
  }

  /* ---------- Переходы ---------- */

  $("bn-new").addEventListener("click", () => {
    if (state.writing) return;

    try {
      state.draft = freshDraft();
    } catch (error) {
      status(error.message);
      return;
    }

    resetHistory();
    state.part = "text";
    state.placing = false;
    state.selected = null;
    $("bn-text").value = "";

    location.hash = "#board/edit";
    choosePaper(papers[0], false);
    status("Выбери бумагу, добавь текст и стикеры.");
  });

  $("bn-place").addEventListener("click", async () => {
    if (!state.draft || state.writing) return;

    endHistoryGroup();

    if (document.fonts?.ready) await document.fonts.ready;
    if (!state.draft || !editorValid()) return;

    state.draft.payload.kind = "note";
    state.placing = true;
    state.editing = false;
    state.selected = state.draft.id;
    bounded(state.draft);

    if (location.hash === "#board") syncRoute();
    else location.hash = "#board";

    status(
      "Перетащи записку на нужное место. " +
      "Другие посетители увидят её только после публикации."
    );
  });

  $("bn-publish").addEventListener("click", async () => {
    if (!state.draft || state.writing) return;

    const draft = state.draft;

    invalidateLoading();
    state.writing = true;
    syncToolbar();

    try {
      if (!configured()) {
        bounded(draft);
        state.rows.push({
          ...clone(draft),
          owner_id: "local-preview",
          version: 1,
          created_at: new Date().toISOString()
        });
        state.draft = null;
        state.placing = false;
        state.selected = null;
        state.part = "text";
        resetHistory();
        status(
          "Записка размещена только в этой вкладке до перезагрузки. " +
          "Для общей публикации подключи Supabase."
        );
        return;
      }

      await signIn();

      bounded(draft);
      draft.payload.kind = "note";

      /* Один id на черновик: повторная попытка не создаёт копию */
      const existing = await request(`?id=eq.${draft.id}&select=id,owner_id`);

      if (existing?.length) {
        if (existing[0].owner_id !== state.session.userId) {
          throw new Error("Не удалось подтвердить авторство записки.");
        }
      } else {
        await request("", "POST", {
          id: draft.id,
          x: draft.x,
          y: draft.y,
          width: draft.width,
          payload: clone(draft.payload)
        });
      }

      state.draft = null;
      state.placing = false;
      state.selected = null;
      state.part = "text";
      resetHistory();

      status("Опубликовано. Записка сохранена в общей базе.");
    } catch (error) {
      status(
        `${error.message} Черновик сохранён — можно повторить публикацию.`
      );
    } finally {
      state.writing = false;
      renderBoard();
      await loadBoard();
    }
  });

  function syncRoute() {
    const parts = location.hash.slice(1).split("/");
    const active = parts[0] === "board";

    page.hidden = !active;

    if (!active) {
      if (reader.open) reader.close();
      return;
    }

    document.querySelectorAll("#main .page").forEach(section => {
      section.hidden = section !== page;
    });

    document.body.dataset.page = "board";
    document.title = "Лимб — Доска объявлений";

    document.querySelectorAll(".site-header nav a").forEach(link => {
      if (link.hash === "#board") link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });

    const isEditor = parts[1] === "edit";

    $("bn-board-view").hidden = isEditor;
    editor.hidden = !isEditor;

    if (isEditor) {
      if (!state.draft) {
        try {
          state.draft = freshDraft();
          resetHistory();
        } catch (error) {
          status(error.message);
          editor.hidden = true;
          $("bn-board-view").hidden = false;
          return;
        }
      }

      /* При возврате в редактор черновик снова не размещается */
      state.placing = false;
      state.draft.payload.kind = "note";
      $("bn-text").value = state.draft.payload.text;

      renderPreview();
      setupCaptcha().catch(error => status(error.message));
    } else {
      renderBoard();
      loadBoard();
    }
  }

  window.addEventListener("hashchange", syncRoute);

  setInterval(() => {
    if (!page.hidden && !document.hidden && editor.hidden && configured()) {
      loadBoard();
    }
  }, 20000);

  status(
    configured()
      ? "Записки сохраняются в общей базе. Не публикуй личные данные."
      : "Оформление доступно. Для общей публикации заполни Supabase в board-config.js."
  );

  syncRoute();
})();