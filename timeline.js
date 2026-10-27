"use strict";
(() => {
  const root = document.getElementById("timeline");
  if (!root) return;

  root.innerHTML = `
    <h1>Библия</h1>
    <h2>Таймлайн</h2>
    <div class="tl-board">
      <section class="tl-card">
        <h3>Дата в реальности</h3>
        <div class="tl-fields">
          <label class="tl-field s"><input id="rD" type="text" inputmode="numeric" maxlength="2" autocomplete="off" aria-label="День в реальности"><small>день</small></label>
          <label class="tl-field s"><input id="rM" type="text" inputmode="numeric" maxlength="2" autocomplete="off" aria-label="Месяц в реальности"><small>месяц</small></label>
          <label class="tl-field l"><input id="rY" type="text" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="Год в реальности"><small>год</small></label>
        </div>
      </section>
      <img class="tl-hint" src="assets/decor/podskazka-timeline.png" alt="" aria-hidden="true" decoding="async">
      <section class="tl-card">
        <h3>Дата в Лимбе</h3>
        <div class="tl-fields">
          <label class="tl-field s"><input id="lD" type="text" inputmode="numeric" maxlength="2" autocomplete="off" aria-label="День в Лимбе"><small>день</small></label>
          <label class="tl-field s"><input id="lM" type="text" inputmode="numeric" maxlength="2" autocomplete="off" aria-label="Месяц в Лимбе"><small>месяц</small></label>
          <label class="tl-field l"><input id="lY" type="text" inputmode="numeric" maxlength="4" autocomplete="off" aria-label="Год в Лимбе"><small>год</small></label>
        </div>
      </section>
    </div>
    <p class="tl-note" id="tlNote" aria-live="polite"></p>`;

  const RATIO = 7, DAY = 864e5;
  const $ = id => document.getElementById(id);
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const mk = (y, m, d) => { const t = new Date(0); t.setUTCFullYear(y, m - 1, d); return t; };

  const REAL0 = mk(2020, 2, 9).getTime();
  const LIMB0 = mk(1, 1, 1).getTime();

  const sides = {
    real: { ids: ["rD", "rM", "rY"], start: REAL0, early: "До 9 февраля 2020 года Лимба ещё не существует" },
    limb: { ids: ["lD", "lM", "lY"], start: LIMB0, early: "Лимб начинается с 01.01.0001" }
  };

  let last = { real: REAL0, limb: LIMB0 };

  function read(side) {
    const [d, m, y] = sides[side].ids.map(id => $(id).value);
    if (!d || !m || y.length < 4) return null;
    const D = +d, M = +m, Y = +y;
    if (!D || !M || !Y) return false;
    const t = mk(Y, M, D);
    if (t.getUTCDate() !== D || t.getUTCMonth() !== M - 1) return false;
    return t.getTime();
  }

  function write(side, time) {
    const [d, m, y] = sides[side].ids.map($);
    const x = new Date(time);
    d.value = pad(x.getUTCDate());
    m.value = pad(x.getUTCMonth() + 1);
    y.value = pad(x.getUTCFullYear(), 4);
  }

  function showLast() {
    write("real", last.real);
    write("limb", last.limb);
  }

  function update(from) {
    const to = from === "real" ? "limb" : "real";
    const note = $("tlNote");
    const t = read(from);

    if (t === null) { note.textContent = ""; return; }
    if (t === false) { note.textContent = "Такой даты не существует"; return; }
    if (t < sides[from].start) { note.textContent = sides[from].early; return; }

    note.textContent = "";
    const days = Math.round((t - sides[from].start) / DAY);
    const result = from === "real"
      ? LIMB0 + days * RATIO * DAY
      : REAL0 + Math.floor(days / RATIO) * DAY;

    last[from] = t;
    last[to] = result;
    write(to, result);
  }

  Object.entries(sides).forEach(([side, { ids }]) => {
    ids.forEach((id, i) => {
      const el = $(id);
      const max = i === 2 ? 4 : 2;

      el.addEventListener("input", () => {
        el.value = el.value.replace(/\D/g, "").slice(0, max);
        update(side);
        if (i < 2 && el.value.length === max) $(ids[i + 1]).focus();
      });

      el.addEventListener("focus", () => el.select());

      el.addEventListener("blur", () => {
        if (el.value && +el.value) {
          el.value = pad(+el.value, max);
          update(side);
        }
        setTimeout(() => {
          const card = el.closest(".tl-card");
          if (card && card.contains(document.activeElement)) return;
          if (read(side) === null || read(side) === false || read(side) < sides[side].start) {
            $("tlNote").textContent = "";
            showLast();
          }
        }, 0);
      });
    });
  });

  showLast();
  window.addEventListener("hashchange", () => {
    if (location.hash === "#bible/timeline" && !$("rD").value) showLast();
  });
})();