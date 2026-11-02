"use strict";

const $app = document.getElementById("app");
const $timer = document.getElementById("timer");
const COUNTS = [5, 10, 15, 20, 30, 40];
const MIN_BOARD = 10; // do rebríčka sa zapisujú testy s aspoň touto dĺžkou
const COUNT_KEY = "kviz-pocet";
const TYPE_LABEL = {
  single: "Výber z možností (ABCD)", tf: "Pravda / Nepravda", multi: "Viac správnych odpovedí",
  num: "Číselná odpoveď", text: "Doplňte slovo", select: "Doplňte kód / rozbaľovacie polia",
  order: "Zoraďte do správneho poradia", match: "Priraďovanie",
};
const LETTERS = "abcdefgh";
// cieľové zastúpenie typov v teste (súčet 20)
const QUOTA = [["single", 5], ["multi", 2], ["tf", 2], ["num", 4], ["text", 2], ["select", 1], ["order", 1], ["match", 1], ["single", 1], ["num", 1]];

let state = null;
let tick = null;

const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? "" : v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
};

/* ------------------------------------------------------------------ výber otázok */
function buildTest(lectures, TOTAL) {
  const pool = BANK.filter((d) => lectures.includes(d.lec));
  const used = new Set();
  const perLec = Object.fromEntries(lectures.map((l) => [l, 0]));
  const chosen = [];
  const takeFrom = (cands) => {
    if (!cands.length) return false;
    const min = Math.min(...cands.map((d) => perLec[d.lec]));
    const best = cands.filter((d) => perLec[d.lec] === min);
    const d = pick(best);
    used.add(d); perLec[d.lec]++; chosen.push(d);
    return true;
  };
  const seq = shuffle(QUOTA.flatMap(([t, n]) => Array(n).fill(t)));
  for (let k = 0; k < TOTAL; k++) {
    takeFrom(pool.filter((d) => d.type === seq[k % seq.length] && !used.has(d)));
  }
  while (chosen.length < TOTAL) {
    if (!takeFrom(pool.filter((d) => !used.has(d)))) break;
  }
  return shuffle(chosen).map((d) => {
    const q = d.make();
    q.type = d.type; q.lec = d.lec; q.topic = d.topic;
    if (q.type === "order") q.shuf = shuffle(q.items.map((_, i) => i));
    if (q.type === "match") q.rights = shuffle(q.pairs.map((p) => p[1]));
    return q;
  });
}

function emptyAnswer(q) {
  switch (q.type) {
    case "single": case "tf": return null;
    case "multi": return [];
    case "num": case "text": return "";
    case "select": return q.blanks.map(() => "");
    case "order": return q.items.map(() => "");
    case "match": return q.pairs.map(() => "");
  }
}
const answered = (q, a) => {
  switch (q.type) {
    case "single": case "tf": return a !== null;
    case "multi": return a.length > 0;
    case "num": case "text": return a.trim() !== "";
    default: return a.some((x) => x !== "");
  }
};

/* ------------------------------------------------------------------ vyhodnotenie */
const norm = (s) => s.toLowerCase().replace(/[\s;.]/g, "");
const parseNum = (s) => {
  const t = s.replace(/\s/g, "").replace(",", ".").replace(/[^\d.\-eE+]/g, "");
  const v = parseFloat(t);
  return Number.isFinite(v) ? v : NaN;
};
function grade(q, a) {
  switch (q.type) {
    case "single": case "tf": return a === q.correct ? 1 : 0;
    case "multi": {
      const hit = a.filter((i) => q.correct.includes(i)).length;
      const bad = a.length - hit;
      return Math.max(0, (hit - bad) / q.correct.length);
    }
    case "num": {
      const v = parseNum(a);
      if (Number.isNaN(v)) return 0;
      return [q.answer, ...q.alt].some((x) => Math.abs(v - x) <= q.tol + 1e-9) ? 1 : 0;
    }
    case "text": return q.accepted.some((x) => norm(x) === norm(a)) ? 1 : 0;
    case "select": return q.blanks.filter((b, i) => a[i] === b.ans).length / q.blanks.length;
    case "order": return q.items.filter((_, pos) => a[q.shuf.indexOf(pos)] === String(pos + 1)).length / q.items.length;
    case "match": return q.pairs.filter((p, i) => a[i] === p[1]).length / q.pairs.length;
  }
}
const verdict = (s) => (s >= 0.999 ? "ok" : s > 0 ? "part" : "no");

/* ------------------------------------------------------------------ render otázky */
function renderQuestion(q, idx, review) {
  const a = state.answers[idx];
  const box = el("div", { class: "qbody" });
  box.append(el("div", { class: "qtext", html: q.text }));
  const touch = () => { refreshNav(); };

  if (q.type === "single" || q.type === "tf" || q.type === "multi") {
    const multi = q.type === "multi";
    q.options.forEach((o, i) => {
      const sel = multi ? a.includes(i) : a === i;
      const isOk = multi ? q.correct.includes(i) : q.correct === i;
      let cls = "opt";
      if (review) { if (sel && isOk) cls += " ok"; else if (sel && !isOk) cls += " bad"; else if (!sel && isOk) cls += " miss"; }
      const inp = el("input", { type: multi ? "checkbox" : "radio", name: "q" + idx, checked: sel, disabled: review });
      inp.addEventListener("change", () => {
        if (multi) { state.answers[idx] = inp.checked ? [...a, i] : a.filter((x) => x !== i); }
        else state.answers[idx] = i;
        rerender();
      });
      const lab = el("label", { class: cls }, inp, el("b", {}, q.type === "tf" ? "" : LETTERS[i] + "."), el("span", {}, o));
      if (review && isOk) lab.append(el("span", { class: "mark ok" }, " ✓"));
      box.append(lab);
    });
  } else if (q.type === "num" || q.type === "text") {
    const inp = el("input", { type: "text", value: a, disabled: review, autocomplete: "off", "aria-label": "Odpoveď", placeholder: "Odpoveď" });
    inp.addEventListener("input", () => { state.answers[idx] = inp.value; touch(); });
    const line = el("div", { class: "line" }, el("span", {}, "Odpoveď:"), inp, q.unit ? el("span", { class: "muted" }, q.unit) : null);
    if (review) line.append(el("span", { class: "mark " + (grade(q, a) ? "ok" : "bad") }, grade(q, a) ? "✓" : "✗"));
    box.append(line);
    if (q.type === "num" && !review) box.append(el("div", { class: "hint" }, "Desatinné číslo môžeš písať s bodkou aj čiarkou."));
  } else if (q.type === "select") {
    const wrap = el("div", { class: "qtext" });
    wrap.innerHTML = "";
    box.querySelector(".qtext").innerHTML = q.text.replace(/\{\{(\d+)\}\}/g, '<span data-b="$1"></span>');
    q.blanks.forEach((b, i) => {
      const slot = box.querySelector(`[data-b="${i}"]`);
      const s = el("select", { disabled: review, "aria-label": "Pole " + (i + 1) }, el("option", { value: "" }, "—"), b.opts.map((o) => el("option", { value: o, selected: a[i] === o }, o)));
      s.addEventListener("change", () => { state.answers[idx][i] = s.value; touch(); });
      slot.replaceWith(s);
      if (review) {
        const ok = a[i] === b.ans;
        s.insertAdjacentElement("afterend", el("span", { class: "mark " + (ok ? "ok" : "bad") }, ok ? " ✓" : ` ✗ (správne: ${b.ans})`));
      }
    });
  } else if (q.type === "order") {
    const n = q.items.length;
    const opts = Array.from({ length: n }, (_, i) => String(i + 1));
    q.shuf.forEach((pos, k) => {
      const s = el("select", { disabled: review, "aria-label": "Poradie" }, el("option", { value: "" }, "—"), opts.map((o) => el("option", { value: o, selected: a[k] === o }, o)));
      s.addEventListener("change", () => { state.answers[idx][k] = s.value; touch(); });
      const line = el("div", { class: "line" }, s, el("span", {}, q.items[pos]));
      if (review) { const ok = a[k] === String(pos + 1); line.append(el("span", { class: "mark " + (ok ? "ok" : "bad") }, ok ? "✓" : `✗ (správne: ${pos + 1}.)`)); }
      box.append(line);
    });
  } else if (q.type === "match") {
    q.pairs.forEach((p, i) => {
      const s = el("select", { disabled: review, "aria-label": "Priradenie" }, el("option", { value: "" }, "—"), q.rights.map((o) => el("option", { value: o, selected: a[i] === o }, o)));
      s.addEventListener("change", () => { state.answers[idx][i] = s.value; touch(); });
      const line = el("div", { class: "line" }, el("b", {}, p[0]), el("span", {}, "→"), s);
      if (review) { const ok = a[i] === p[1]; line.append(el("span", { class: "mark " + (ok ? "ok" : "bad") }, ok ? "✓" : `✗ (správne: ${p[1]})`)); }
      box.append(line);
    });
  }

  if (review) {
    const s = grade(q, a);
    const v = verdict(s);
    let corr = "";
    if (q.type === "num") corr = `Správna odpoveď: <b>${fmt(round(q.answer, 4))}${q.unit ? " " + q.unit : ""}</b>.`;
    if (q.type === "text") corr = `Správna odpoveď: <b>${q.accepted[0]}</b>.`;
    box.append(el("div", { class: "fb " + v, html:
      `<b>${v === "ok" ? "Správne" : v === "part" ? "Čiastočne správne" : "Nesprávne"}</b> (${Math.round(s * 100) / 100} / 1 b.) ${corr}` +
      (q.expl ? `<div>${q.expl}</div>` : "") }));
  }
  return box;
}

/* ------------------------------------------------------------------ obrazovky */
function showStart() {
  stopTimer();
  state = null;
  $app.replaceChildren();
  const chosen = new Set(Object.keys(LECTURES).map(Number));
  const card = el("div", { class: "card" });
  card.append(el("h1", {}, "Generátor testu"),
    el("p", { class: "muted" }, "Otázky sú vytvorené z prednášok 2–6 (prednáška 1 je vynechaná). Typy otázok sú inšpirované demo testom z Moodle: výber ABCD, viac správnych odpovedí, pravda/nepravda, číselné a slovné odpovede, dopĺňanie kódu cez rozbaľovacie polia, zoraďovanie a priraďovanie. Číselné otázky majú pri každom generovaní iné hodnoty."));
  const lectures = el("div", {});
  for (const [n, name] of Object.entries(LECTURES)) {
    const cnt = BANK.filter((d) => d.lec === +n).length;
    const cb = el("input", { type: "checkbox", checked: true });
    cb.addEventListener("change", () => { cb.checked ? chosen.add(+n) : chosen.delete(+n); start.disabled = chosen.size === 0; });
    lectures.append(el("label", { class: "lec" }, cb, el("span", {}, el("b", {}, `Prednáška ${n}`), " – " + name, el("small", {}, `${cnt} typov otázok`))));
  }
  card.append(el("h2", {}, "Témy"), lectures);
  const modes = el("div", { class: "modes" });
  const m1 = el("input", { type: "radio", name: "mode", value: "test", checked: true });
  const m2 = el("input", { type: "radio", name: "mode", value: "train" });
  modes.append(
    el("label", {}, m1, el("span", {}, el("b", {}, "Test"), " – vyhodnotenie až na konci (ako v Moodle), meria sa čas.")),
    el("label", {}, m2, el("span", {}, el("b", {}, "Tréning"), " – po každej otázke môžeš hneď skontrolovať odpoveď a prečítať vysvetlenie."))
  );
  card.append(el("h2", {}, "Režim"), modes);
  let saved = 20;
  try { saved = +localStorage.getItem(COUNT_KEY) || 20; } catch (e) {}
  const cnt = el("select", { id: "cnt", "aria-label": "Počet otázok" }, COUNTS.map((n) => el("option", { value: n, selected: n === saved }, `${n} otázok`)));
  card.append(el("h2", {}, "Počet otázok"), el("div", { class: "line" }, cnt),
    el("div", { class: "hint" }, `Do rebríčka sa zapisujú testy s aspoň ${MIN_BOARD} otázkami. Ak vybrané témy nemajú dosť otázok, test bude kratší.`));
  const start = el("button", { class: "primary" }, "Vygenerovať test");
  start.addEventListener("click", () => {
    const n = +cnt.value;
    try { localStorage.setItem(COUNT_KEY, n); } catch (e) {}
    const qs = buildTest([...chosen], n);
    state = { qs, answers: qs.map(emptyAnswer), checked: qs.map(() => false), cur: 0, train: m2.checked, t0: Date.now(), done: false };
    startTimer();
    showQuiz();
  });
  card.append(el("div", { class: "row", style: "margin-top:14px" }, start));
  $app.append(card);
  $app.append(boardCard());
}

function startTimer() {
  $timer.hidden = false;
  const upd = () => { const s = Math.floor((Date.now() - state.t0) / 1000); $timer.textContent = `⏱ ${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
  upd(); tick = setInterval(upd, 1000);
}
function stopTimer() { clearInterval(tick); $timer.hidden = true; }

let navEl = null;
function refreshNav() {
  if (!navEl) return;
  [...navEl.children].forEach((b, i) => {
    const q = state.qs[i];
    b.className = "";
    if (state.checked[i]) b.classList.add(verdict(grade(q, state.answers[i])));
    else if (answered(q, state.answers[i])) b.classList.add("done");
    if (i === state.cur) b.classList.add("cur");
  });
}
const rerender = () => showQuiz();

function showQuiz() {
  const { qs, cur } = state;
  const q = qs[cur];
  $app.replaceChildren();
  const nav = el("div", { class: "card nav" }, el("h2", {}, "Navigácia"));
  navEl = el("div", { class: "grid" }, qs.map((_, i) => el("button", { onclick: () => { state.cur = i; showQuiz(); }, "aria-label": "Otázka " + (i + 1) }, String(i + 1))));
  nav.append(navEl);
  nav.append(el("div", { class: "hint" }, `Zodpovedané: ${qs.filter((qq, i) => answered(qq, state.answers[i])).length} / ${qs.length}`));
  nav.append(el("div", { style: "margin-top:12px" }, el("button", { class: "primary", onclick: finish }, "Skončiť test")));

  const rev = state.train && state.checked[cur];
  const main = el("div", { class: "card" });
  main.append(el("div", { class: "qhead" }, el("strong", {}, `Otázka ${cur + 1} z ${qs.length}`), el("span", {}, el("span", { class: "tag" }, TYPE_LABEL[q.type]), " ", el("span", { class: "tag" }, `Prednáška ${q.lec}`))));
  main.append(renderQuestion(q, cur, rev));
  const pager = el("div", { class: "pager" },
    el("button", { disabled: cur === 0, onclick: () => { state.cur--; showQuiz(); } }, "← Predchádzajúca"),
    state.train && !rev ? el("button", { onclick: () => { state.checked[cur] = true; showQuiz(); } }, "Skontrolovať") : null,
    cur < qs.length - 1 ? el("button", { class: "primary", onclick: () => { state.cur++; showQuiz(); } }, "Ďalšia →") : el("button", { class: "primary", onclick: finish }, "Skončiť test"));
  main.append(pager);
  $app.append(el("div", { class: "layout" }, nav, main));
  refreshNav();
  window.scrollTo({ top: 0 });
}

async function finish() {
  const un = state.qs.filter((q, i) => !answered(q, state.answers[i])).length;
  if (un && !confirm(`Nezodpovedal si ${un} ${un === 1 ? "otázku" : un < 5 ? "otázky" : "otázok"}. Naozaj chceš test ukončiť a vyhodnotiť?`)) return;
  state.done = true;
  state.secs = Math.floor((Date.now() - state.t0) / 1000);
  stopTimer();
  if (!state.train && state.qs.length >= MIN_BOARD) {
    const sum = state.qs.reduce((x, q, i) => x + grade(q, state.answers[i]), 0);
    state.submit = await submitScore(sum, state.secs, state.qs.length);
  }
  showResults();
}

function showResults(onlyWrong = false) {
  const { qs, answers } = state;
  const scores = qs.map((q, i) => grade(q, answers[i]));
  const sum = scores.reduce((x, y) => x + y, 0);
  const pct = Math.round((sum / qs.length) * 100);
  $app.replaceChildren();
  const head = el("div", { class: "card" },
    el("h1", {}, "Výsledok testu"),
    el("div", { class: "score" }, `${round(sum, 2).toString().replace(".", ",")} / ${qs.length} b. (${pct} %)`),
    el("p", { class: "muted" }, `Čas: ${Math.floor(state.secs / 60)} min ${state.secs % 60} s · Plne správne: ${scores.filter((s) => s >= 0.999).length} · Čiastočne: ${scores.filter((s) => s > 0 && s < 0.999).length} · Nesprávne: ${scores.filter((s) => s === 0).length}`),
    el("div", { class: "row" },
      el("button", { class: "primary", onclick: showStart }, "Nový test"),
      el("button", { onclick: () => showResults(!onlyWrong) }, onlyWrong ? "Zobraziť všetky otázky" : "Zobraziť len chybné")));
  if (state.train) head.append(el("p", { class: "hint" }, "Tréning sa do rebríčka nezapisuje."));
  else if (qs.length < MIN_BOARD) head.append(el("p", { class: "hint" }, `Do rebríčka sa zapisujú testy s aspoň ${MIN_BOARD} otázkami.`));
  else if (state.submit && state.submit.improved) head.append(el("p", { class: "mark ok" }, "🏆 Nový najlepší výsledok uložený do rebríčka!"));
  else if (state.submit) head.append(el("p", { class: "hint" }, "Tvoj najlepší výsledok v rebríčku je lepší – nezmenil sa."));
  else head.append(el("p", { class: "hint" }, "Výsledok sa nepodarilo uložiť (server nie je dostupný)."));
  $app.append(head);
  $app.append(boardCard(state.submit && state.submit.board));
  qs.forEach((q, i) => {
    if (onlyWrong && scores[i] >= 0.999) return;
    const card = el("div", { class: "card res-item" });
    card.append(el("div", { class: "qhead" }, el("strong", {}, `Otázka ${i + 1}`), el("span", {}, el("span", { class: "tag" }, TYPE_LABEL[q.type]), " ", el("span", { class: "tag" }, `Prednáška ${q.lec} · ${q.topic}`))));
    state.cur = i;
    card.append(renderQuestion(q, i, true));
    $app.append(card);
  });
  window.scrollTo({ top: 0 });
}

/* ------------------------------------------------------------------ meno a rebríček */
const NAME_KEY = "kviz-meno";
const getName = () => { try { return localStorage.getItem(NAME_KEY) || ""; } catch (e) { return ""; } };
function updateWho() {
  const b = document.getElementById("who");
  b.textContent = "👤 " + (getName() || "bez mena");
  b.onclick = () => askName(false);
}
function askName(first) {
  const inp = el("input", { type: "text", maxlength: "20", value: getName(), placeholder: "Tvoje meno", "aria-label": "Meno" });
  const ok = el("button", { class: "primary" }, "Uložiť");
  const m = el("div", { class: "modal" }, el("div", { class: "card" },
    el("h2", {}, first ? "Vitaj! Ako sa voláš?" : "Zmeniť meno"),
    el("p", { class: "muted" }, "Meno sa zobrazí v rebríčku najlepších výsledkov."),
    el("div", { class: "line" }, inp),
    el("div", { class: "row" }, ok, first ? null : el("button", { onclick: () => m.remove() }, "Zrušiť"))));
  const save = () => {
    const v = inp.value.trim().slice(0, 20);
    if (!v) { inp.focus(); return; }
    try { localStorage.setItem(NAME_KEY, v); } catch (e) {}
    m.remove(); updateWho();
    if (!state) showStart();
  };
  ok.addEventListener("click", save);
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); });
  document.body.append(m);
  inp.focus();
}
async function fetchBoard() {
  const r = await fetch("/api/scores", { cache: "no-store" });
  if (!r.ok) throw new Error();
  return r.json();
}
async function submitScore(score, secs, total) {
  try {
    const r = await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: getName() || "Anonym", score: round(score, 2), total, secs }) });
    if (!r.ok) throw new Error();
    return await r.json();
  } catch (e) { return null; }
}
function boardCard(rows) {
  const card = el("div", { class: "card" }, el("h2", {}, "🏆 Rebríček najlepších"));
  const body = el("div", {}, el("p", { class: "muted" }, "Načítavam…"));
  card.append(body);
  const draw = (list) => {
    if (!list.length) { body.replaceChildren(el("p", { class: "muted" }, "Zatiaľ tu nikto nie je. Dokonči test a buď prvý!")); return; }
    const me = getName().toLowerCase();
    const t = el("table", { class: "board" }, el("tr", {}, el("th", {}, "#"), el("th", {}, "Meno"), el("th", {}, "Body"), el("th", {}, "Čas")),
      list.map((r, i) => el("tr", { class: r.name.toLowerCase() === me ? "me" : "" },
        el("td", {}, String(i + 1)), el("td", {}, r.name),
        el("td", {}, `${String(r.score).replace(".", ",")} / ${r.total} (${Math.round(r.pct * 100)} %)`),
        el("td", {}, `${Math.floor(r.secs / 60)}:${String(r.secs % 60).padStart(2, "0")}`))));
    body.replaceChildren(t, el("p", { class: "hint" }, `Poradie podľa percent úspešnosti (pri rovnosti rozhoduje čas). Zapisuje sa najlepší výsledok z režimu Test, min. ${MIN_BOARD} otázok.`));
  };
  if (rows) draw(rows);
  else fetchBoard().then(draw).catch(() => body.replaceChildren(el("p", { class: "muted" }, "Rebríček nie je dostupný (spusti stránku cez spusti.command).")));
  return card;
}

updateWho();
showStart();
if (!getName()) askName(true);
