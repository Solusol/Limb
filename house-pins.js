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
    { id: "roof",  title: "Крыша",            note: "Наблюдательный пост, сушка белья, огород.", file: "Крыша.webp",  x: 25.6, y: 8.6 },
    { id: "attic", title: "Этаж 5 (чердак)",  note: "Общая комната с проектором, штаб.",          file: "Чердак.webp", x: 32.4, y: 15.0 },
    { id: "f4",    title: "Этаж 4",           note: "Комнаты Чанбина и Черён, Чана и Феликса, Йеджи и Рюджин, Лии и Юны.", file: "Этаж 4.webp", x: 35.1, y: 26.3 },
    { id: "f3",    title: "Этаж 3",           note: "Комнаты Джисона и Чонина, Хёнджина, Сынмина и Минхо, тренировочный зал.", file: "Этаж 3.webp", x: 35.9, y: 36.0 },
    { id: "f2",    title: "Этаж 2",           note: "Общая комната, кухня и столовая, кладовая, медицинский блок.", file: "Этаж 2.webp", x: 36.3, y: 47.2 },
    { id: "f1",    title: "Этаж 1",           note: "Гараж, мастерская.",                          file: "Этаж 1.webp", x: 35.5, y: 84.2 },
    { id: "f0",    title: "Этаж 0",           note: "Генератор, склад, оружейная.",                file: "Этаж 0.webp", x: 4.2,  y: 90.9 }
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

    const note = document.createElement("p");
    note.className = "house-plan-note";

    const plan = document.createElement("img");
    plan.className = "house-plan-image";
    plan.decoding = "async";

    plan.title = "Нажми, чтобы увеличить";
    plan.addEventListener("click", () => {
      const z = plan.classList.toggle("zoomed");
      plan.title = z ? "Нажми, чтобы уменьшить" : "Нажми, чтобы увеличить";
    });

    dialog.append(close, title, note, plan);
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

      const icon = document.createElement("img");
      icon.src = src("Пин.png");
      icon.alt = "";
      icon.draggable = false;
      pin.append(icon);

      pin.addEventListener("click", () => {
        title.textContent = floor.title;
        note.textContent = floor.note;
        plan.alt = "Схема: " + floor.title;
        plan.classList.remove("zoomed");
        plan.title = "Нажми, чтобы увеличить";
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
