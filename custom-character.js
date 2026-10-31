"use strict";
(() => {
  const C = window.LIMB_CUSTOM_CHARACTER;
  const main = document.querySelector("#main");
  const grid = document.querySelector("#characters-grid");
  if (!C || !main || !grid || document.querySelector("#custom-character")) return;
  const base = C.base.replace(/\/?$/, "/");
  const path = file => base + file;
  const make = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const image = (file, cls, alt = "") => {
    const n = make("img", cls);
    n.alt = alt; n.decoding = "async"; n.draggable = false;
    n.addEventListener("error", () => {
      n.hidden = true;
      console.warn("Конструктор: не найден файл", path(file));
      if (n.parentElement?.classList.contains("cc-upload")) {
        if (!n.parentElement.querySelector(".cc-fallback")) {
          const t = make("span", "cc-fallback", "Загрузить фото");
          t.style.cssText = "display:block;color:#eee7d5;line-height:1.3;font-size:18px";
          n.parentElement.append(t);
        }
      }
    }, {once: true});
    n.src = path(file); return n;
  };
  // Только память текущего документа. Никакой записи и сетевой отправки анкеты.
  let state;
  const fresh = () => ({ name: "", age: "", city: "", traits: "", icon: Math.min(1,C.icons.length-1), main: "", secondary: "", stats: C.stats.map(() => 0) });
  state = fresh();
  const versions = {main:0, secondary:0};
  const page = make("section", "page");
  page.id = "custom-character"; page.hidden = true;
  page.setAttribute("aria-labelledby", "cc-title");
  const title = make("h1", "", "Создай себя в Лимбе"); title.id = "cc-title";
  const tools = make("div", "cc-tools");
  const back = make("a", "back-link", "Все персонажи"); back.href = "#characters";
  const reset = make("button", "", "Сбросить персонажа"); reset.type = "button";
  tools.append(back, reset);
  const notice = make("p", "cc-note", "Персонаж виден только тебе. После обновления страницы анкета и фотографии сбросятся. Нажми на иконку, чтобы выбрать другую; на ячейки шкал — чтобы задать уровень.");
  const error = make("p", "cc-error"); error.setAttribute("role", "status");
  const canvas = make("div", "cc-canvas");
  canvas.style.setProperty("--cc-cross", `url(${JSON.stringify(path(C.assets.cross))})`);
  canvas.append(image(C.assets.base, "cc-base"));
  const mainPhoto = make("img", "cc-main-photo"); mainPhoto.alt = "Портрет твоего персонажа"; mainPhoto.hidden = true;
  canvas.append(mainPhoto, image(C.assets.frame, "cc-frame"));
  const photoInput = {};
  function uploadButton(slot, cls) {
    const input = make("input"); input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp"; input.hidden = true;
    photoInput[slot] = input;
    const button = make("button", "cc-upload " + cls); button.type = "button";
    button.setAttribute("aria-label", slot === "main" ? "Выбрать или заменить портрет" : "Выбрать или заменить вторую фотографию");
    button.append(image(C.assets.upload, "cc-normal"),image(C.assets.uploadHover, "cc-hover"));
    button.addEventListener("click", () => input.click());
    input.addEventListener("change", () => selectPhoto(slot, input.files?.[0]));
    page.append(input);
    return button;
  }
  const mainUpload = uploadButton("main", "cc-main-upload"); canvas.append(mainUpload);
  const stats = make("div", "cc-stats");
  const cells = [];
  C.stats.forEach((stat, i) => {
    const row = make("div", "cc-stat"); row.setAttribute("role", "group"); row.setAttribute("aria-label", stat.label);
    row.append(image(stat.file, "cc-stat-art"));
    const line = make("div", "cc-cells"); cells[i] = [];
    for (let level=1; level<=10; level++) {
      const button = make("button", "cc-cell"); button.type = "button";
      button.setAttribute("aria-label", `${stat.label}: ${level} из 10; повторное нажатие на текущий уровень — сброс`);
      button.addEventListener("click", () => {
        state.stats[i] = state.stats[i] === level ? 0 : level; syncStats();
      });
      cells[i].push(button); line.append(button);
    }
    row.append(line); stats.append(row);
  });
  canvas.append(stats);
  const iconButton = make("button", "cc-icon-select"); iconButton.type = "button";
  iconButton.setAttribute("aria-label", "Выбрать иконку персонажа");
  const iconImage = make("img"); iconImage.alt = "Выбранная иконка";
  iconButton.append(iconImage); canvas.append(iconButton);
  const fields = make("div", "cc-data");
  const inputs = {};
  [["name","Имя Фамилия",80],["age","Возраст (дд месяц гггг)",80],["city","Город, страна",100],["traits","Знак зодиака, MBTI",80]].forEach(([key,label,max]) => {
    const input = make("input"); input.type = "text"; input.placeholder = label;
    input.setAttribute("aria-label",label); input.maxLength = max;
    input.autocomplete = "off"; input.name = "cc-"+key;
    input.addEventListener("input", () => {state[key] = input.value; syncCard();});
    inputs[key] = input; fields.append(input);
  });
  canvas.append(fields);
  const secondary = make("div", "cc-secondary");
  const secondPhoto = make("img", "cc-secondary-photo"); secondPhoto.alt = "Дополнительная фотография персонажа"; secondPhoto.hidden = true;
  secondary.append(secondPhoto,uploadButton("secondary", "")); canvas.append(secondary);
  page.append(title,tools,notice,error,canvas); main.append(page);

  const card = make("article", "person-card"); card.id = "cc-card";
  const cardArt = make("a", "cc-card-art"); cardArt.href = "#custom-character";
  cardArt.setAttribute("aria-label", "Создать своего персонажа");
  const cardPhoto = make("img", "cc-card-photo"); cardPhoto.alt = "Твой персонаж"; cardPhoto.hidden = true;
  const placeholder = image(C.assets.upload,"cc-card-placeholder");
  cardArt.append(cardPhoto,image(C.assets.frame,"cc-card-frame"),placeholder);
  const cardName = make("h2", "", "Ввести имя");
  const cardOpen = make("a", "cc-card-open", "Открыть"); cardOpen.href = "#custom-character";
  card.append(cardArt,cardName,cardOpen); grid.append(card);

  const dialog = make("dialog"); dialog.id = "cc-icons"; dialog.setAttribute("aria-label", "Выбор иконки персонажа");
  const close = make("button", "cc-close", "Закрыть"); close.type = "button";
  close.addEventListener("click", () => dialog.close());
  const iconGrid = make("div", "cc-icon-grid"); const iconChoices = [];
  C.icons.forEach((file,i) => {
    const b = make("button", "cc-icon-choice"); b.type = "button";
    b.setAttribute("aria-label", `Иконка ${i+1}`);
    b.append(image(file,""));
    b.addEventListener("click", () => {state.icon=i; syncIcon(); dialog.close();});
    iconChoices.push(b); iconGrid.append(b);
  });
  dialog.append(close,iconGrid); document.body.append(dialog);
  iconButton.addEventListener("click", () => {if(!dialog.open) dialog.showModal();});
  function syncIcon() {
    const file = C.icons[state.icon];
    if(file) iconImage.src = path(file);
    iconChoices.forEach((b,i) => b.setAttribute("aria-pressed",String(i === state.icon)));
  }
  function syncStats() {
    cells.forEach((row,i) => row.forEach((b,j) => b.setAttribute("aria-pressed",String(j < state.stats[i]))));
  }
  function showPhoto(img,url) {
    img.hidden = !url;
    if(url) img.src = url; else img.removeAttribute("src");
  }
  function syncCard() {
    cardName.textContent = state.name.trim() || "Ввести имя";
    showPhoto(cardPhoto,state.main); placeholder.hidden = Boolean(state.main);
    cardArt.setAttribute("aria-label",state.name.trim() ? `Открыть своего персонажа: ${state.name.trim()}` : "Создать своего персонажа");
  }
  function syncPhotos() {
    showPhoto(mainPhoto,state.main); showPhoto(secondPhoto,state.secondary);
    mainUpload.classList.toggle("cc-filled",Boolean(state.main));
    secondary.classList.toggle("cc-filled",Boolean(state.secondary)); syncCard();
  }
  async function selectPhoto(slot,file) {
    if(!file) return;
    const ticket = ++versions[slot]; error.textContent = "";
    photoInput[slot].value = "";
    if(!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 15*1024*1024) {
      error.textContent = "Выбери JPEG, PNG или WebP размером до 15 МБ."; return;
    }
    const url = URL.createObjectURL(file);
    try {
      await new Promise((resolve,reject) => {const test = new Image(); test.onload=resolve; test.onerror=reject; test.src=url;});
      if(ticket !== versions[slot]) {URL.revokeObjectURL(url); return;}
      const previous=state[slot]; state[slot]=url; syncPhotos();
      if(previous) URL.revokeObjectURL(previous);
    } catch {
      URL.revokeObjectURL(url);
      if(ticket === versions[slot]) error.textContent="Не удалось открыть изображение. Попробуй другой файл.";
    }
  }
  reset.addEventListener("click", () => {
    if(!window.confirm("Сбросить анкету, фотографии и характеристики персонажа?")) return;
    versions.main++; versions.secondary++;
    if(state.main) URL.revokeObjectURL(state.main);
    if(state.secondary) URL.revokeObjectURL(state.secondary);
    state=fresh(); Object.values(inputs).forEach(input => {input.value="";});
    Object.values(photoInput).forEach(input => {input.value="";});
    error.textContent="Персонаж сброшен."; syncIcon(); syncStats(); syncPhotos();
  });
  function route() {
    const active=location.hash.split("/")[0] === "#custom-character";
    page.hidden=!active;
    if(!active) {if(dialog.open) dialog.close(); return;}
    main.querySelectorAll(".page").forEach(section => {section.hidden=section !== page;});
    document.body.dataset.page="character";
    document.title="Лимб — Создай себя";
    document.querySelectorAll(".site-header nav a").forEach(a => {
      if(a.hash === "#characters") a.setAttribute("aria-current","page");
      else a.removeAttribute("aria-current");
    });
  }
  window.addEventListener("hashchange",route);
  syncIcon(); syncStats(); syncPhotos(); route();
})();