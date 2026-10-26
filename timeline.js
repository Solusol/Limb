"use strict";
(() => {
  const root = document.getElementById("timeline");
  if (!root) return;
  const RATIO = 7, START = Date.UTC(2020, 1, 9), DAY = 864e5;
  const $ = id => document.getElementById(id);
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const limb0 = (() => { const d = new Date(0); d.setUTCFullYear(1, 0, 1); return d.getTime(); })();

  function realDate() {
    const d = +$("rD").value, m = +$("rM").value, y = +$("rY").value;
    if (!d || !m || !y || String(y).length < 4) return null;
    const t = Date.UTC(y, m - 1, d), c = new Date(t);
    return c.getUTCDate() === d && c.getUTCMonth() === m - 1 ? t : false;
  }
  function show(d, m, y) { $("lD").textContent = d; $("lM").textContent = m; $("lY").textContent = y; }
  function update() {
    const t = realDate(), note = $("tlNote");
    if (t === null) { note.textContent = ""; show("--", "--", "----"); return; }
    if (t === false) { note.textContent = "Такой даты не существует"; show("--", "--", "----"); return; }
    const days = Math.round((t - START) / DAY);
    if (days < 0) { note.textContent = "До 9 февраля 2020 года Лимба ещё не существует"; show("--", "--", "----"); return; }
    note.textContent = "";
    const l = new Date(limb0 + days * RATIO * DAY);
    show(pad(l.getUTCDate()), pad(l.getUTCMonth() + 1), pad(l.getUTCFullYear(), 4));
  }
  ["rD", "rM", "rY"].forEach(id => {
    const el = $(id);
    el.addEventListener("input", () => {
      const max = id === "rY" ? 4 : 2;
      if (el.value.length > max) el.value = el.value.slice(0, max);
      update();
      if (id !== "rY" && el.value.length === 2) $(id === "rD" ? "rM" : "rY").focus();
    });
    el.addEventListener("blur", () => { if (id !== "rY" && el.value) el.value = pad(+el.value); });
  });
  update();
})();
