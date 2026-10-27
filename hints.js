"use strict";
(() => {
  const pager = document.querySelector("#character .character-pager");
  if (!pager || pager.querySelector(".hint")) return;

  const add = (cls, src) => {
    const img = new Image();
    img.className = `hint ${cls}`;
    img.src = src;
    img.alt = "";
    img.decoding = "async";
    img.setAttribute("aria-hidden", "true");
    pager.append(img);
  };

  add("hint-tuda", "assets/decor/podskazka-tuda-suda.png");
  add("hint-mudbord", "assets/decor/podskazka-mudbord.png");
})();