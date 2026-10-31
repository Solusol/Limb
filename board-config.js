"use strict";

window.LIMB_BOARD = {
supabaseUrl: "https://quwquigejhdkymoydjji.supabase.co",
publicKey: "sb_publishable_KUbZ6TNlUyheema5GoDcWQ_Ie6g7Sys",

  // Публичный site key Turnstile, если CAPTCHA включена в Supabase.
  captchaSiteKey: "",

  base: "assets/doska/",

  assets: {
  background: "doska-fon.png",

  /* Красная фактура редактора */
  panel: "fon.png",

  /* Оставить записку */
  postButton: "doska-knopka.png",
  postButtonHover: "doska-knopka-hover.png",

  /* Отмена */
  cancelButton: "otmena.png",
  cancelButtonHover: "otmena-hover.png",

  paperHeading: "bumaga.png",
  stickerHeading: "stikeri.png"
},

  papers: [
    { id: "p01", file: "Paper 01 1.png", ratio: 1.414 },
    { id: "p12", file: "Paper 12 1.png", ratio: 1 },
    { id: "p09", file: "Paper 09 1.png", ratio: 1.414 },
    { id: "p03", file: "Paper 03 1.png", ratio: 0.65 },
    { id: "p02", file: "Paper 02 1.png", ratio: 0.56 }
  ],

  specialStickers: [
    { id: "stamp03", file: "STICKER - STAMPED 03 1.png" },
    { id: "stamp04", file: "STICKER - STAMPED 04 1.png" },
    { id: "zeus", file: "STICKER - Zeus 1.png" }
  ],

  stickerNumbers: [
    1, 4, 5, 7, 8, 9, 10, 12, 13, 16, 17, 33,
    34, 35, 36, 37, 38, 39, 40, 43, 44, 45, 46, 47,
    48, 49, 50, 52, 53, 54, 55, 56, 57, 58, 59, 60,
    62, 70, 71, 72, 73, 74, 75, 76, 78, 80, 81, 83,
    84, 85, 86, 88, 91, 92, 94, 95, 96, 97, 99, 101,
    105, 106, 109, 112, 113, 114, 117, 118, 119, 120,
    121, 122, 124
  ]
};