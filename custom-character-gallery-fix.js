"use strict";
/* Полная замена предыдущего custom-character-gallery-fix.js. */
(() => {
  const card=document.querySelector("#cc-card");
  const page=document.querySelector("#custom-character");
  const C=window.LIMB_CUSTOM_CHARACTER;
  if(!card || !page || !C || document.querySelector("#cc-gallery-fix-styles")) return;
  const oldArt=card.querySelector(".cc-card-art");
  const mainPhoto=page.querySelector(".cc-main-photo");
  const profileName=page.querySelector('.cc-data input[name="cc-name"]');
  const fileInput=page.querySelector('input[type="file"]');
  const photo=card.querySelector(".cc-card-photo");
  const frame=card.querySelector(".cc-card-frame");
  if(!oldArt || !mainPhoto || !profileName || !fileInput || !photo || !frame) return;
  const path=file=>C.base.replace(/\/?$/, "/")+file;
  const style=document.createElement("style"); style.id="cc-gallery-fix-styles";
  style.textContent=`
    #cc-card .cc-card-art.cc-gallery-art {
      display:block; position:relative; width:100%; max-width:100%;
      height:var(--cc-gallery-height,auto); aspect-ratio:var(--cc-gallery-ratio,3 / 4);
      margin:0; padding:0; border:0; border-radius:0;
      background:transparent !important; box-shadow:none;
      overflow:visible; isolation:isolate; box-sizing:border-box;
      mask:none !important; -webkit-mask:none !important;
      filter:none; opacity:1;
    }
    #cc-card .cc-gallery-art::before, #cc-card .cc-gallery-art::after {
      content:none !important; display:none !important;
    }
    #cc-card .cc-gallery-art > .cc-gallery-underlay {
      position:absolute; inset:0; display:block; width:100%; height:100%;
      max-width:none; margin:0; padding:0; object-fit:fill;
      z-index:0; pointer-events:none; border:0; background:transparent;
    }
    #cc-card .cc-gallery-art > .cc-card-photo {
      position:absolute; left:21%; top:27%; width:54%; height:53%;
      max-width:none; margin:0; padding:0; object-fit:cover; z-index:1;
    }
    #cc-card .cc-gallery-art > .cc-card-frame {
      position:absolute; left:6%; top:1%; width:88%; height:92%;
      max-width:none; margin:0; padding:0; object-fit:fill; z-index:2;
      pointer-events:none;
    }
    #cc-card .cc-gallery-upload {
      position:absolute; left:48%; top:53.5%; transform:translate(-50%,-50%);
      display:grid; grid-template-columns:minmax(0,1fr);
      width:25%; max-width:120px; min-width:44px; min-height:44px;
      margin:0; padding:0; border:0; border-radius:0; background:transparent;
      box-shadow:none; z-index:3; line-height:0; cursor:pointer;
      touch-action:manipulation; opacity:1; filter:none;
    }
    #cc-card .cc-gallery-upload > img {
      grid-area:1/1; display:block; align-self:center; width:100%; height:auto;
      max-width:100%; margin:0; pointer-events:none; transition:opacity 120ms ease;
    }
    #cc-card .cc-gallery-normal { opacity:1; }
    #cc-card .cc-gallery-hover { opacity:0; }
    #cc-card .cc-gallery-upload:active .cc-gallery-normal,
    #cc-card .cc-gallery-upload:focus-visible .cc-gallery-normal,
    #cc-card .cc-gallery-upload.cc-pressed .cc-gallery-normal { opacity:0; }
    #cc-card .cc-gallery-upload:active .cc-gallery-hover,
    #cc-card .cc-gallery-upload:focus-visible .cc-gallery-hover,
    #cc-card .cc-gallery-upload.cc-pressed .cc-gallery-hover { opacity:1; }
    @media(hover:hover) {
      #cc-card .cc-gallery-upload:hover .cc-gallery-normal { opacity:0; }
      #cc-card .cc-gallery-upload:hover .cc-gallery-hover { opacity:1; }
    }
    /* После успешной загрузки кнопка исчезает, а не перемещается. */
    #cc-card .cc-gallery-art.cc-photo-ready .cc-gallery-upload,
    #cc-card .cc-gallery-upload[hidden] { display:none !important; }
    #cc-card .cc-name-heading { margin-block:.5em; }
    #cc-card .cc-gallery-name {
      display:block; width:100%; min-width:0; max-width:100%; min-height:44px;
      margin:0; padding:0; box-sizing:border-box; border:0; border-radius:0;
      background:transparent; color:inherit; font:inherit; line-height:inherit;
      text-transform:inherit; box-shadow:none;
    }
    #cc-card .cc-gallery-name::placeholder { color:inherit; opacity:1; }
    #cc-card .cc-gallery-name:focus-visible,
    #cc-card .cc-gallery-upload:focus-visible {
      outline:1px dashed #87a6b0; outline-offset:4px;
    }
    #cc-card a.cc-card-open.cc-exact-open {
      display:inline-block; position:relative; width:var(--cc-open-width,160px);
      max-width:100%; min-height:0; margin:0; padding:0;
      border:0 !important; border-radius:0; background:transparent !important;
      box-shadow:none; line-height:0; text-decoration:none;
    }
    #cc-card a.cc-exact-open::before, #cc-card a.cc-exact-open::after {
      content:none !important; display:none !important;
    }
    #cc-card a.cc-exact-open > img {
      display:block; width:100%; max-width:100%; height:auto; margin:0;
      object-fit:contain; pointer-events:none;
    }
    #cc-card .cc-gallery-message { color:#eee7d5; font-size:16px; }
    #cc-card .cc-gallery-message:empty { display:none; }
    @media(prefers-reduced-motion:reduce) {
      #cc-card .cc-gallery-upload > img { transition:none; }
    }
  `;
  document.head.append(style);
  const art=document.createElement("div"); art.className="cc-card-art cc-gallery-art";
  art.setAttribute("aria-label","Портрет твоего персонажа");
  const underlay=new Image(); underlay.className="cc-gallery-underlay";
  underlay.alt=""; underlay.draggable=false;
  underlay.src="assets/frames/portrait.webp";
  // Точный файл подложки: без canvas, масок и подбора цвета.
  art.append(underlay,photo,frame); oldArt.replaceWith(art);
  const upload=document.createElement("button"); upload.type="button";
  upload.className="cc-gallery-upload";
  upload.setAttribute("aria-label","Загрузить фотографию персонажа");
  const normal=new Image(); normal.alt=""; normal.className="cc-gallery-normal";
  normal.src=path(C.assets.upload);
  const hover=new Image(); hover.alt=""; hover.className="cc-gallery-hover";
  hover.src=path(C.assets.uploadHover);
  hover.addEventListener("error",()=>{hover.src=normal.src;hover.style.filter="brightness(.7)";},{once:true});
  upload.append(normal,hover);art.append(upload);
  upload.addEventListener("pointerdown",()=>upload.classList.add("cc-pressed"));
  ["pointerup","pointercancel","blur"].forEach(type=>upload.addEventListener(type,()=>upload.classList.remove("cc-pressed")));
  upload.addEventListener("click",()=>fileInput.click());
  const heading=document.createElement("h2");heading.className="cc-name-heading";
  const name=document.createElement("input");name.type="text";
  name.className="cc-gallery-name";name.placeholder="Ввести имя";name.maxLength=80;
  name.autocomplete="off";name.setAttribute("aria-label","Имя твоего персонажа");
  name.value=profileName.value;heading.append(name);card.querySelector("h2").replaceWith(heading);
  name.addEventListener("input",()=>{
    profileName.value=name.value;profileName.dispatchEvent(new Event("input",{bubbles:true}));
  });
  name.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();name.blur();}});
  profileName.addEventListener("input",()=>{name.value=profileName.value;});
  const open=card.querySelector(".cc-card-open");
  if(open){
    open.classList.add("cc-exact-open");
    open.setAttribute("aria-label","Открыть профайл своего персонажа");
    const img=new Image();img.alt="Открыть";img.draggable=false;
    img.src="assets/buttons/open.webp";open.replaceChildren(img);
  }
  const message=document.createElement("p");message.className="cc-gallery-message";
  message.setAttribute("role","status");card.append(message);
  const profileError=page.querySelector(".cc-error");
  function mirror(){
    const url=mainPhoto.getAttribute("src");const ready=Boolean(url&&!mainPhoto.hidden);
    if(ready){
      if(photo.getAttribute("src")!==url)photo.src=url;
      photo.hidden=false;
    }else{photo.hidden=true;photo.removeAttribute("src");}
    art.classList.toggle("cc-photo-ready",ready);upload.hidden=ready;
    if(name.value!==profileName.value)name.value=profileName.value;
    message.textContent=profileError?.textContent||"";
  }
  new MutationObserver(mirror).observe(mainPhoto,{attributes:true,attributeFilter:["src","hidden"]});
  if(profileError)new MutationObserver(mirror).observe(profileError,{childList:true,subtree:true,characterData:true});
  const reference=()=>[...document.querySelectorAll("#characters-grid .person-card")]
    .filter(n=>n!==card).map(n=>n.querySelector(".portrait")).find(Boolean);
  function matchGeometry(){
    const ref=reference();if(!ref)return;
    const rect=ref.getBoundingClientRect();if(rect.width<=0||rect.height<=0)return;
    art.style.setProperty("--cc-gallery-ratio",`${rect.width} / ${rect.height}`);
    const ownWidth=art.getBoundingClientRect().width;
    if(ownWidth>0)art.style.setProperty("--cc-gallery-height",`${ownWidth*rect.height/rect.width}px`);
    const otherFrame=ref.querySelector(".portrait-frame");
    if(otherFrame){
      const fr=otherFrame.getBoundingClientRect();
      if(fr.width>0&&fr.height>0){
        frame.style.left=`${(fr.left-rect.left)/rect.width*100}%`;
        frame.style.top=`${(fr.top-rect.top)/rect.height*100}%`;
        frame.style.width=`${fr.width/rect.width*100}%`;
        frame.style.height=`${fr.height/rect.height*100}%`;
        if(otherFrame.currentSrc||otherFrame.src)frame.src=otherFrame.currentSrc||otherFrame.src;
      }
    }
    const article=ref.closest(".person-card");
    const otherOpen=article?.querySelector('a.image-button[href^="#character/"]');
    if(open&&otherOpen){
      const w=otherOpen.getBoundingClientRect().width;
      if(w>0)open.style.setProperty("--cc-open-width",`${w}px`);
    }
  }
  if("ResizeObserver"in window){
    const observer=new ResizeObserver(matchGeometry);
    const ref=reference();if(ref)observer.observe(ref);observer.observe(card);
  }
  window.addEventListener("resize",matchGeometry);
  window.addEventListener("hashchange",()=>requestAnimationFrame(matchGeometry));
  document.addEventListener("load",event=>{
    if(event.target instanceof HTMLImageElement&&event.target.closest("#characters-grid")&&!card.contains(event.target))matchGeometry();
  },true);
  matchGeometry();mirror();
})();
/* ===== Выравнивание имени и кнопки по соседней карточке ===== */

(() => {
  const card = document.querySelector("#cc-card");

  if (!card) return;

  let scheduled = false;

  function set(element, property, value) {
    element.style.setProperty(property, value, "important");
  }

  function alignCard() {
    scheduled = false;

    const grid = card.closest("#characters-grid");

    if (!grid || !card.getBoundingClientRect().width) return;

    const reference = [...grid.querySelectorAll(".person-card")]
      .filter(item => item !== card)
      .reverse()
      .find(item => item.getBoundingClientRect().width > 0);

    if (!reference) return;

    const referenceName = reference.querySelector("h2");
    const heading = card.querySelector(".cc-name-heading");
    const input = card.querySelector(".cc-gallery-name");
    const button = card.querySelector(".cc-card-open");

    const referenceButton = [...reference.querySelectorAll("a")]
      .find(link =>
        !link.classList.contains("portrait") &&
        link.getAttribute("href")?.startsWith("#character/")
      );

    if (
      !referenceName ||
      !heading ||
      !input ||
      !button ||
      !referenceButton
    ) {
      return;
    }

    const nameStyle = getComputedStyle(referenceName);
    const nameRect = referenceName.getBoundingClientRect();
    const buttonRect = referenceButton.getBoundingClientRect();

    if (!nameRect.height || !buttonRect.width || !buttonRect.height) {
      return;
    }

    /* Одинаковые размеры и отступы строки имени */
    set(heading, "display", "block");
    set(heading, "box-sizing", "border-box");
    set(heading, "height", `${nameRect.height}px`);
    set(heading, "min-height", "0");
    set(heading, "padding", "0");
    set(heading, "border", "0");

    set(heading, "margin-top", nameStyle.marginTop);
    set(heading, "margin-bottom", nameStyle.marginBottom);
    set(heading, "font-family", nameStyle.fontFamily);
    set(heading, "font-size", nameStyle.fontSize);
    set(heading, "font-weight", nameStyle.fontWeight);
    set(heading, "line-height", nameStyle.lineHeight);

    /* Поле больше не увеличивает высоту заголовка */
    set(input, "display", "block");
    set(input, "box-sizing", "border-box");
    set(input, "width", "100%");
    set(input, "height", "100%");
    set(input, "min-height", "0");
    set(input, "margin", "0");
    set(input, "padding", "0");
    set(input, "border", "0");
    set(input, "font", "inherit");
    set(input, "line-height", nameStyle.lineHeight);

    /* Размер всей кнопки — точно как у соседней */
    set(button, "display", "block");
    set(button, "box-sizing", "border-box");
    set(button, "width", `${buttonRect.width}px`);
    set(button, "height", `${buttonRect.height}px`);
    set(button, "min-height", "0");
    set(button, "margin", "0");
    set(button, "padding", "0");
    set(button, "border", "0");

    const buttonImage = button.querySelector("img");

    if (buttonImage) {
      set(buttonImage, "display", "block");
      set(buttonImage, "width", "100%");
      set(buttonImage, "height", "100%");
      set(buttonImage, "object-fit", "contain");
    }

    /*
      Сначала убираем прошлое смещение.
      Иначе при повторном расчёте оно накапливалось бы.
    */
    set(heading, "position", "relative");
    set(heading, "top", "0px");
    set(button, "position", "relative");
    set(button, "top", "0px");

    const referenceTop = reference.getBoundingClientRect().top;
    const cardTop = card.getBoundingClientRect().top;

    /* Сравниваем координаты внутри карточек, а не всей страницы */
    const nameOffset =
      referenceName.getBoundingClientRect().top -
      referenceTop -
      (heading.getBoundingClientRect().top - cardTop);

    set(heading, "top", `${nameOffset}px`);

    const buttonOffset =
      referenceButton.getBoundingClientRect().top -
      referenceTop -
      (button.getBoundingClientRect().top - cardTop);

    set(button, "top", `${buttonOffset}px`);
  }

  function schedule() {
    if (scheduled) return;

    scheduled = true;
    requestAnimationFrame(alignCard);
  }

  window.addEventListener("resize", schedule);
  window.addEventListener("hashchange", schedule);

  document.addEventListener("load", event => {
    if (
      event.target instanceof HTMLImageElement &&
      event.target.closest("#characters-grid")
    ) {
      schedule();
    }
  }, true);

  if ("ResizeObserver" in window) {
    const grid = card.closest("#characters-grid");

    if (grid) {
      const observer = new ResizeObserver(schedule);
      observer.observe(grid);
    }
  }

  if (document.fonts?.ready) {
    document.fonts.ready.then(schedule);
  }

  schedule();
})();
/* ===== Цвет оригинальной кнопки «Открыть» ===== */

(() => {
  if (document.querySelector("#cc-open-color-filters")) return;

  const NS = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(NS, "svg");
  svg.id = "cc-open-color-filters";

  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  svg.style.cssText =
    "position:absolute;width:0;height:0;" +
    "overflow:hidden;pointer-events:none;";

  const defs = document.createElementNS(NS, "defs");

  function addColorFilter(id, color) {
    const filter = document.createElementNS(NS, "filter");

    filter.id = id;
    filter.setAttribute("x", "0%");
    filter.setAttribute("y", "0%");
    filter.setAttribute("width", "100%");
    filter.setAttribute("height", "100%");
    filter.setAttribute("color-interpolation-filters", "sRGB");

    const flood = document.createElementNS(NS, "feFlood");

    flood.setAttribute("flood-color", color);
    flood.setAttribute("flood-opacity", "1");
    flood.setAttribute("result", "buttonColor");

    const composite = document.createElementNS(NS, "feComposite");

    composite.setAttribute("in", "buttonColor");
    composite.setAttribute("in2", "SourceAlpha");
    composite.setAttribute("operator", "in");

    filter.append(flood, composite);
    defs.append(filter);
  }

  addColorFilter("cc-open-normal-color", "#FFFFFF");
  addColorFilter("cc-open-hover-color", "#5D6444");

  svg.append(defs);
  document.body.append(svg);

  const style = document.createElement("style");

  style.id = "cc-open-color-styles";

  style.textContent = `
    /* Отключаем предыдущую версию с CSS-маской */
    #cc-card a.cc-card-open.cc-exact-open::before,
    #cc-card a.cc-card-open.cc-exact-open::after {
      content: none !important;
      display: none !important;
    }

    /* Не меняем размеры и положение самой ссылки */
    #cc-card a.cc-card-open.cc-exact-open {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      opacity: 1 !important;
      filter: none !important;
    }

    /* Возвращаем оригинальное изображение */
    #cc-card a.cc-card-open.cc-exact-open > img {
      visibility: visible !important;
      opacity: 1 !important;

      filter: url("#cc-open-normal-color") !important;

      pointer-events: none;
    }

    /* Зелёный ховер мышью */
    @media (hover: hover) {
      #cc-card a.cc-card-open.cc-exact-open:hover > img {
        filter: url("#cc-open-hover-color") !important;
      }
    }

    /* Нажатие и управление клавиатурой */
    #cc-card a.cc-card-open.cc-exact-open:active > img,
    #cc-card a.cc-card-open.cc-exact-open:focus-visible > img,
    #cc-card a.cc-card-open.cc-exact-open.tap > img {
      filter: url("#cc-open-hover-color") !important;
    }
  `;

  document.head.append(style);
})();