"use strict";

(() => {
  const D = window.LIMB;

  if (!D) {
    document.body.textContent =
      "Не найден content.js. Положи его рядом с limb.html.";
    return;
  }

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];

  const state = {
    person: null,
    personView: "profile",
    cover: 0,
    mapMode: "limb",
    mapFile: "",
    mapRequest: 0,
    chapterId: "",
    scale: 1,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    intrinsicWidth: 0,
    intrinsicHeight: 0
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function assetImage(path, alt, className = "", decorative = false) {
    const img = new Image();
    img.alt = alt;
    img.className = className;
    img.width = 1200;
    img.height = 1200;
    img.loading = "lazy";
    img.decoding = "async";

    img.addEventListener("load", () => {
      img.width = img.naturalWidth;
      img.height = img.naturalHeight;
    }, { once: true });

    img.addEventListener("error", () => {
      if (decorative) {
        img.hidden = true;
      } else {
        img.replaceWith(
          el("p", "asset-error", `Не найден файл: ${path}`)
        );
      }
    }, { once: true });

    img.src = path;
    return img;
  }

  function setCssAsset(variable, path) {
    document.documentElement.style.setProperty(
      variable,
      `url(${JSON.stringify(path)})`
    );
  }

  setCssAsset("--background-main", D.art.backgroundMain);
  setCssAsset("--background-character", D.art.backgroundCharacter);
  setCssAsset("--paper-image", D.art.paper);
  setCssAsset("--paper-decoration", D.art.paperDecoration);
  setCssAsset("--tape-image", D.art.tape);
  setCssAsset("--menu-frame", D.frames.menu);
  setCssAsset("--article-frame", D.frames.article);

  function bindStaticImage(img, path, ui = false) {
    img.addEventListener("error", () => {
      if (ui) {
        const parent = img.closest("button, a");

        if (parent) {
          if (!parent.querySelector(".ui-fallback")) {
            const fallback = el(
              "span",
              "ui-fallback",
              parent.getAttribute("aria-label") || "Открыть"
            );
            parent.append(fallback);
          }
        }
      }

      img.hidden = true;
    }, { once: true });

    img.src = path;
  }

  $$("[data-ui]").forEach(img => {
    const path = D.ui[img.dataset.ui];
    if (path) bindStaticImage(img, path, true);
  });

  $$("[data-art]").forEach(img => {
    const path = D.art[img.dataset.art];
    if (path) bindStaticImage(img, path);
  });

  $("#ficbook-link").href = D.links.ficbook;
  $("#tiktok-link").href = D.links.tiktok;

  function imageLink(href, path, label) {
    const link = el("a", "image-button");
    link.href = href;
    link.setAttribute("aria-label", label);

    const img = assetImage(path, "", "", true);

    img.addEventListener("error", () => {
      link.append(el("span", "ui-fallback", label));
    }, { once: true });

    link.append(img);
    return link;
  }

  function menuItem(label, href, disabled = false) {
    const node = el(disabled ? "button" : "a", "menu-row");

    if (disabled) node.disabled = true;
    else node.href = href;

    const hand = assetImage(D.ui.hand, "", "hand-icon", true);

    node.append(hand, el("span", "", label));
    return node;
  }

  $("#bible-menu").append(
    menuItem("Миросоздание", "#bible/origin"),
    menuItem("Мироустройство", "#bible/rules"),
    menuItem("Таймлайн", "#bible/timeline")
  );

  $("#maps-menu").append(
    menuItem("Карта Лимба", "#maps/limb"),
    menuItem("Карта Дома", "#maps/house")
  );

  D.tags.forEach(text => {
    $("#tags").append(el("li", "", text));
  });

  D.annotation.forEach(text => {
    $("#annotation").append(el("p", "", text));
  });

  D.origin.forEach(text => {
    $("#origin-list").append(el("li", "", text));
  });

  D.rules.forEach(text => {
    $("#rules-list").append(el("li", "", text));
  });

  D.sections.forEach(section => {
    const article = el("article");
    const picture = el("a", "section-picture");

    picture.href = section.route;
    picture.append(
      assetImage(D.art[section.art], `Раздел: ${section.title}`)
    );

    article.append(
      picture,
      el("h2", "", section.title),
      imageLink(
        section.route,
        D.ui.open,
        `Открыть раздел: ${section.title}`
      )
    );

    $("#section-cards").append(article);
  });

  function personPath(person, kind) {
    const stem = person.file;

    if (kind === "portrait") {
      return `assets/characters/portraits/Portret_${stem}.webp`;
    }

    if (kind === "profile") {
      return `assets/characters/profiles/Profail_${stem}.webp`;
    }

    return `assets/characters/moodboards/Mudbord_${stem}.webp`;
  }

  D.people.forEach(person => {
    const article = el("article", "person-card");
    const portrait = el("a", "portrait");

    portrait.href = `#character/${person.id}/profile`;
    portrait.setAttribute("aria-label", `Открыть: ${person.name}`);

    if (D.composition.separatePortraitFrame) {
      portrait.classList.add("layered");

      portrait.style.setProperty(
        "--portrait-inset",
        D.composition.portraitInset
      );

      const photo = el("span", "portrait-photo");

      photo.append(
        assetImage(personPath(person, "portrait"), person.name)
      );

      portrait.append(
        photo,
        assetImage(D.frames.portrait, "", "portrait-frame", true)
      );
    } else {
      portrait.append(
        assetImage(personPath(person, "portrait"), person.name)
      );
    }

    article.append(
      portrait,
      el("h2", "", person.name),
      imageLink(
        `#character/${person.id}/profile`,
        D.ui.open,
        `Открыть: ${person.name}`
      )
    );

    $("#characters-grid").append(article);
  });

  function renderPerson(person, view) {
    state.person = person;
    state.personView = view;

    $("#character-name").textContent =
      `${person.name}: ${view === "profile" ? "профайл" : "мудборд"}`;

    const figure = $("#character-sheet");

    figure.replaceChildren(
      assetImage(
        personPath(person, view),
        `${person.name}: ${view === "profile" ? "профайл" : "мудборд"}`,
        "sheet-image"
      )
    );

    const separateFrame = view === "profile"
      ? D.composition.separateProfileFrame
      : D.composition.separateMoodFrame;

    if (separateFrame) {
      figure.append(
        assetImage(D.frames.character, "", "sheet-frame", true)
      );
    }

    $$("[data-person-view]").forEach(button => {
      const selected = button.dataset.personView === view;

      button.setAttribute("aria-pressed", String(selected));
      button.querySelector("img").src =
        selected ? D.ui.activeDot : D.ui.inactiveDot;
    });
  }

  function setPersonView(view) {
    if (!state.person) return;

    location.hash =
      `character/${state.person.id}/${view}`;
  }

  function switchPersonView() {
    setPersonView(
      state.personView === "profile" ? "mood" : "profile"
    );
  }

  function goToPerson(step) {
  if (!state.person) return;

  const index = D.people.findIndex(p => p.id === state.person.id);
  const next = D.people[(index + step + D.people.length) % D.people.length];

  location.hash = `character/${next.id}/profile`;
  }

$("#person-prev").addEventListener("click", () => goToPerson(-1));
$("#person-next").addEventListener("click", () => goToPerson(1));

  $$("[data-person-view]").forEach(button => {
    button.addEventListener("click", () => {
      setPersonView(button.dataset.personView);
    });

    bindStaticImage(
      button.querySelector("img"),
      button.dataset.personView === "profile"
        ? D.ui.activeDot
        : D.ui.inactiveDot,
      true
    );
  });

  function renderCover() {
    if (!D.showCoverCarousel || !D.covers.length) return;

    $("#cover-section").hidden = false;

    state.cover =
      (state.cover + D.covers.length) % D.covers.length;

    const cover = D.covers[state.cover];

    $("#cover-image").replaceChildren(
      assetImage(cover.file, cover.title)
    );

    $("#cover-counter").textContent =
      `${state.cover + 1} / ${D.covers.length}`;

    $("#cover-prev").disabled = D.covers.length < 2;
    $("#cover-next").disabled = D.covers.length < 2;
  }

  $("#cover-prev").addEventListener("click", () => {
    state.cover--;
    renderCover();
  });

  $("#cover-next").addEventListener("click", () => {
    state.cover++;
    renderCover();
  });

  let coverStart = null;

  $("#cover-image").addEventListener("pointerdown", event => {
    coverStart = { x: event.clientX, y: event.clientY };
  });

  $("#cover-image").addEventListener("pointerup", event => {
    if (!coverStart) return;

    const dx = event.clientX - coverStart.x;
    const dy = event.clientY - coverStart.y;

    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      state.cover += dx < 0 ? 1 : -1;
      renderCover();
    }

    coverStart = null;
  });

  $("#cover-image").addEventListener("pointercancel", () => {
    coverStart = null;
  });

  bindStaticImage($("#house-image"), D.maps.house.file);

  $("#house-image").addEventListener("error", () => {
    $("#house").append(
      el(
        "p",
        "asset-error",
        `Не найден SVG схемы Дома: ${D.maps.house.file}`
      )
    );
  }, { once: true });

  const viewport = $("#map-viewport");
  const layer = $("#map-layer");
  const visibleMap = $("#map-image");

  function applyMapTransform() {
    const maxX = Math.max(
      0,
      (state.width * state.scale - viewport.clientWidth) / 2
    );

    const maxY = Math.max(
      0,
      (state.height * state.scale - viewport.clientHeight) / 2
    );

    state.x = Math.max(-maxX, Math.min(maxX, state.x));
    state.y = Math.max(-maxY, Math.min(maxY, state.y));

    layer.style.transform =
      `translate(calc(-50% + ${state.x}px), ` +
      `calc(-50% + ${state.y}px)) scale(${state.scale})`;

    $("#map-scale").textContent =
      `${Math.round(state.scale * 100)}%`;
  }

  function fitMap() {
    if (!viewport.clientWidth) return;
    if (!state.intrinsicWidth || !state.intrinsicHeight) return;

    const fit = Math.min(
      viewport.clientWidth / state.intrinsicWidth,
      viewport.clientHeight / state.intrinsicHeight
    );

    state.width = state.intrinsicWidth * fit;
    state.height = state.intrinsicHeight * fit;

    layer.style.width = `${state.width}px`;
    layer.style.height = `${state.height}px`;

    applyMapTransform();
  }

  function resetMap() {
    state.scale = 1;
    state.x = 0;
    state.y = 0;
    applyMapTransform();
  }

  function loadMap(config) {
    const request = ++state.mapRequest;

    state.mapFile = config.file;
    state.intrinsicWidth = 0;
    state.intrinsicHeight = 0;

    $("#map-title").textContent = config.title;
    visibleMap.alt = config.title;

    layer.hidden = true;
    $("#map-error").hidden = true;

    resetMap();

    const preload = new Image();

    preload.onload = () => {
      if (request !== state.mapRequest) return;

      state.intrinsicWidth = preload.naturalWidth;
      state.intrinsicHeight = preload.naturalHeight;

      visibleMap.src = config.file;
      layer.hidden = false;
      fitMap();
    };

    preload.onerror = () => {
      if (request !== state.mapRequest) return;

      $("#map-error").textContent =
        `Не найден SVG: ${config.file}`;
      $("#map-error").hidden = false;
    };

    preload.src = config.file;
  }

  function showMap(mode) {
    state.mapMode = mode;

    const chapters = mode === "chapters";
    $("#chapter-control").hidden =
      !chapters || D.chapterMaps.length === 0;

    let config = D.maps[mode];

    if (chapters && state.chapterId) {
      const chapter = D.chapterMaps.find(
        item => item.id === state.chapterId
      );

      if (chapter) {
        config = {
          title: chapter.title,
          file: chapter.file,
          note: chapter.note || ""
        };
      }
    }

    $("#map-note").textContent = chapters
      ? config.note ||
        "Показана готовая авторская карта с нанесённым маршрутом. " +
        "Дополнительные линии кодом не строятся."
      : "Авторская карта Лимба.";

    loadMap(config);
  }

  const allOption = el("option", "", "Общая карта маршрутов");
  allOption.value = "";
  $("#chapter-select").append(allOption);

  D.chapterMaps.forEach(chapter => {
    const option = el("option", "", chapter.title);
    option.value = chapter.id;
    $("#chapter-select").append(option);
  });

  $("#chapter-select").addEventListener("change", event => {
    state.chapterId = event.target.value;
    showMap("chapters");
  });

  $("#map-plus").addEventListener("click", () => {
    state.scale = Math.min(8, state.scale + .5);
    applyMapTransform();
  });

  $("#map-minus").addEventListener("click", () => {
    state.scale = Math.max(1, state.scale - .5);
    applyMapTransform();
  });

  $("#map-reset").addEventListener("click", resetMap);

  let drag = null;

  viewport.addEventListener("pointerdown", event => {
    if (state.scale <= 1) return;

    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: state.x,
      startY: state.y
    };

    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", event => {
    if (!drag || drag.id !== event.pointerId) return;

    state.x = drag.startX + event.clientX - drag.x;
    state.y = drag.startY + event.clientY - drag.y;

    applyMapTransform();
  });

  ["pointerup", "pointercancel"].forEach(type => {
    viewport.addEventListener(type, () => {
      drag = null;
    });
  });

  viewport.addEventListener("keydown", event => {
    if (event.target !== viewport) return;

    const keys = [
      "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      "+", "=", "-"
    ];

    if (!keys.includes(event.key)) return;

    event.preventDefault();

    if (event.key === "+" || event.key === "=") {
      state.scale = Math.min(8, state.scale + .5);
    }

    if (event.key === "-") {
      state.scale = Math.max(1, state.scale - .5);
    }

    if (event.key === "ArrowLeft") state.x += 48;
    if (event.key === "ArrowRight") state.x -= 48;
    if (event.key === "ArrowUp") state.y += 48;
    if (event.key === "ArrowDown") state.y -= 48;

    applyMapTransform();
  });

  if ("ResizeObserver" in window) {
    new ResizeObserver(fitMap).observe(viewport);
  } else {
    window.addEventListener("resize", fitMap);
  }

  if (!D.readerMaterials.length) {
    const article = el("article", "reader-item");

    article.append(
      el("h2", "", "Материалы ещё не опубликованы"),
      el(
        "p",
        "",
        "Тесты и дополнительные материалы добавляются после подготовки содержания."
      )
    );

    $("#reader-materials").append(article);
  } else {
    D.readerMaterials.forEach(material => {
      const article = el("article", "reader-item");

      article.append(
        el("h2", "", material.title),
        el("p", "", material.text || "")
      );

      if (
        typeof material.url === "string" &&
        /^https?:\/\//i.test(material.url)
      ) {
        const link = el("a", "text-button", "Открыть");

        link.href = material.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        article.append(link);
      }

      $("#reader-materials").append(article);
    });
  }

  const pages = [
    "home", "bible", "origin", "rules", "timeline", "maps",
    "map-view", "house", "characters", "character",
    "readers", "materials"
  ];

  function route() {
    const parts = location.hash.slice(1).split("/");
    let page = "home";
    let mapMode = null;

    if (parts[0] === "bible") {
      page = parts[1] === "origin" ? "origin"
: parts[1] === "rules" ? "rules"
: parts[1] === "timeline" ? "timeline"
: "bible";
    } else if (parts[0] === "maps") {
      if (parts[1] === "house") {
        page = "house";
      } else if (["limb", "chapters"].includes(parts[1])) {
        page = "map-view";
        mapMode = parts[1];
      } else {
        page = "maps";
      }
    } else if (parts[0] === "character") {
      const person = D.people.find(
        item => item.id === parts[1]
      );

      if (person) {
        page = "character";
        renderPerson(
          person,
          parts[2] === "mood" ? "mood" : "profile"
        );
      } else {
        page = "characters";
      }
    } else if (
      ["characters", "readers", "materials"].includes(parts[0])
    ) {
      page = parts[0];
    }

    pages.forEach(id => {
      $(`#${id}`).hidden = id !== page;
    });

    document.body.dataset.page = page;

    // Карта Лимба теперь управляется блоком из fixes.js

    const currentSection =
      ["bible", "origin", "rules", "timeline"].includes(page) ? "#bible" :
      ["maps", "map-view", "house"].includes(page) ? "#maps" :
      ["characters", "character"].includes(page) ? "#characters" :
      "";

    $$(".site-header nav a").forEach(link => {
      if (link.hash === currentSection) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    const heading = $(`#${page} h1`);
    document.title =
      `${D.title} — ${heading?.textContent || D.title}`;
  }

  window.addEventListener("hashchange", () => {
    route();
    window.scrollTo({ top: 0, behavior: "instant" });
  });

  function checkImage(path) {
    return new Promise(resolve => {
      const img = new Image();
      let done = false;

      const finish = ok => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(ok);
      };

      const timer = setTimeout(() => finish(false), 8000);

      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = path;
    });
  }

  function assetManifest() {
    const list = [];

    Object.entries(D.art).forEach(([name, path]) => {
      list.push({ title: `Графика: ${name}`, path });
    });

    Object.entries(D.ui).forEach(([name, path]) => {
      list.push({ title: `Интерфейс: ${name}`, path });
    });

    list.push(
      { title: "Рамка меню", path: D.frames.menu },
      { title: "Фон/рамка статьи", path: D.frames.article }
    );

    if (D.composition.separatePortraitFrame) {
      list.push({
        title: "Отдельная портретная рамка",
        path: D.frames.portrait
      });
    }

    if (
      D.composition.separateProfileFrame ||
      D.composition.separateMoodFrame
    ) {
      list.push({
        title: "Отдельная рамка профайла/мудборда",
        path: D.frames.character
      });
    }

    Object.values(D.maps).forEach(map => {
      list.push({ title: map.title, path: map.file });
    });

    D.chapterMaps.forEach(map => {
      list.push({ title: map.title, path: map.file });
    });

    D.people.forEach(person => {
      ["portrait", "profile", "mood"].forEach(kind => {
        list.push({
          title: `${person.name}: ${kind}`,
          path: personPath(person, kind)
        });
      });
    });

    if (D.showCoverCarousel) {
      D.covers.forEach(cover => {
        list.push({ title: cover.title, path: cover.file });
      });
    }

    return list;
  }

  $("#check-assets").addEventListener("click", async () => {
    const button = $("#check-assets");
    button.disabled = true;

    const target = $("#asset-results");
    target.replaceChildren();

    $("#asset-summary").textContent =
      "Проверяю PNG, SVG и beermoney.woff…";

    const results = await Promise.all(
      assetManifest().map(async item => ({
        ...item,
        ok: await checkImage(item.path)
      }))
    );

    results.forEach(item => {
      const row = el("div", "asset-row");

      row.append(
        el(
          "p",
          "",
          `${item.ok ? "Найден" : "НЕ НАЙДЕН"} — ${item.title}`
        ),
        el("span", "asset-path", item.path)
      );

      target.append(row);
    });

    let fontLoaded = false;

    try {
      const font = new FontFace(
        "BeerMoneyDiagnostic",
        `url("${D.font.file}") format("woff")`
      );

      const loaded = await Promise.race([
        font.load(),
        new Promise(resolve => {
          setTimeout(() => resolve(null), 5000);
        })
      ]);

      fontLoaded = Boolean(loaded);
    } catch {
      fontLoaded = false;
    }

    const fontRow = el("div", "asset-row");

    fontRow.append(
      el(
        "p",
        "",
        `Beer Money: ${fontLoaded ? "подключается" : "НЕ НАЙДЕН"}`
      ),
      el("span", "asset-path", D.font.file)
    );

    target.append(fontRow);

    const missing = results.filter(item => !item.ok).length;

    $("#asset-summary").textContent =
      `Не найдено используемых PNG/SVG: ${missing}. ` +
      `Шрифт: ${fontLoaded ? "доступен" : "не доступен"}. ` +
      "Содержимое и векторность SVG этой проверкой не оцениваются.";

    button.disabled = false;
  });

  renderCover();
  route();
})();