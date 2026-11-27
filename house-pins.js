"use strict";

/*
  Пины на «Карте Дома».
  Нажатие на пин открывает окно со схемой этажа —
  в том же оформлении, что и просмотр записки на доске объявлений.
  Координаты — кончик пина в процентах от картинки Skhema-doma-snaruzhi.
*/
(() => {
  const BASE = "assets/karta_dom/";

  const FLOORS = [
    { id: "roof",  title: "Крыша",           file: "Крыша.webp",  x: 25.6, y: 8.6 },
    { id: "attic", title: "Этаж 5 (чердак)", file: "Чердак.webp", x: 32.4, y: 15.0 },
    { id: "f4",    title: "Этаж 4",          file: "Этаж 4.webp", x: 35.1, y: 26.3 },
    { id: "f3",    title: "Этаж 3",          file: "Этаж 3.webp", x: 35.9, y: 36.0 },
    { id: "f2",    title: "Этаж 2",          file: "Этаж 2.webp", x: 36.3, y: 47.2 },
    { id: "f1",    title: "Этаж 1",          file: "Этаж 1.webp", x: 35.5, y: 84.2 },
    { id: "f0",    title: "Этаж 0",          file: "Этаж 0.webp", x: 4.2,  y: 90.9 }
  ];

  const src = file => encodeURI(BASE + file);

  function init() {
    const page = document.getElementById("house");
    const img = document.getElementById("house-image");
    if (!page || !img || page.querySelector(".house-pins")) return;

    /* Картинка и пины в общей рамке, чтобы пины держались своих мест при любом размере */
    const frame = document.createElement("div");
    frame.className = "house-pins";
    img.before(frame);
    frame.append(img);

    /* Окно со схемой этажа */
    const dialog = document.createElement("dialog");
    dialog.id = "house-plan";
    dialog.setAttribute("aria-labelledby", "house-plan-title");

    const close = document.createElement("button");
    close.type = "button";
    close.className = "house-plan-close";
    close.textContent = "Закрыть";
    close.addEventListener("click", () => dialog.close());

    const title = document.createElement("h2");
    title.id = "house-plan-title";
    title.className = "house-plan-title";

    const plan = document.createElement("img");
    plan.className = "house-plan-image";
    plan.decoding = "async";

    /* Название этажа и «Закрыть» — в одной строке наверху окна */
    const head = document.createElement("div");
    head.className = "house-plan-head";
    head.append(title, close);

    dialog.append(head, plan);
    document.body.append(dialog);

    /* Клик по затемнению вокруг окна тоже закрывает его */
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });

    FLOORS.forEach(floor => {
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "house-pin";
      pin.style.left = floor.x + "%";
      pin.style.top = floor.y + "%";
      pin.title = floor.title;
      pin.setAttribute("aria-label", "Открыть схему: " + floor.title);

      /* Пин — маска из Пин.png: цвет меняется при наведении */
      const icon = document.createElement("span");
      icon.className = "house-pin-icon";
      icon.setAttribute("aria-hidden", "true");
      pin.append(icon);

      pin.addEventListener("click", () => {
        title.textContent = floor.title;
        plan.alt = "Схема: " + floor.title;
        plan.src = src(floor.file);
        if (!dialog.open) dialog.showModal();
        close.focus();
      });

      /* Схема подгружается заранее при наведении, чтобы окно открывалось сразу */
      pin.addEventListener("pointerenter", () => {
        const pre = new Image();
        pre.src = src(floor.file);
      }, { once: true });

      frame.append(pin);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
