"use strict";

const $app = document.getElementById("app");
const $timer = document.getElementById("timer");
const COUNTS = [5, 10, 15, 20, 30, 40];
const COUNT_KEY = "kviz-pocet";
const TYPE_LABEL = {
  single: "Výber z možností (ABCD)", tf: "Pravda / Nepravda", multi: "Viac správnych odpovedí",
  num: "Číselná odpoveď", text: "Doplňte slovo", select: "Doplňte kód / rozbaľovacie polia",
  order: "Zoraďte do správneho poradia", match: "Priraďovanie",
};
const LETTERS = "abcdefgh";
// cieľové zastúpenie typov v teste (súčet 20)
const QUOTA = [["single", 5], ["multi", 2], ["tf", 2], ["num", 4], ["single", 2], ["select", 1], ["order", 1], ["match", 1], ["single", 1], ["num", 1]];

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

// stabilné ID šablóny = číslo prednášky + poradie v banke (nové otázky sa pridávajú len na koniec questions.js)
(() => { const c = {}; BANK.forEach((d, i) => { d.id = d.lec + "." + (c[d.lec] = (c[d.lec] || 0) + 1); d.src = i >= BOOK_FROM ? "kniha" : "prezentacie"; }); })();
const BOOK_KEY = "kviz-kniha";
// prepínač „Kniha“ (zdieľaný medzi kapitolami a záložkou Na precvičenie)
function bookSwitch(onChange) {
  let on = false;
  try { on = localStorage.getItem(BOOK_KEY) === "1"; } catch (e) {}
  const input = el("input", { type: "checkbox", role: "switch", checked: on, "aria-label": "Zahrnúť otázky z knihy" });
  input.addEventListener("change", () => {
    try { localStorage.setItem(BOOK_KEY, input.checked ? "1" : "0"); } catch (e) {}
    if (onChange) onChange(input.checked);
  });
  return { input, node: el("label", { class: "switch", title: "Zahrnúť otázky z knihy" }, el("span", {}, "Kniha"), input, el("span", { class: "track" })) };
}


function inst(d) {
  const q = d.make();
  q.type = d.type; q.lec = d.lec; q.topic = d.topic; q.id = d.id; q.src = d.src;
  if (q.type === "order") q.shuf = shuffle(q.items.map((_, i) => i));
  if (q.type === "match") q.rights = shuffle(q.pairs.map((p) => p[1]));
  return q;
}

/* ------------------------------------------------------------------ výber otázok */
function buildTest(lectures, TOTAL, useBook) {
  const pool = BANK.filter((d) => lectures.includes(d.lec) && (useBook || d.src !== "kniha"));
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
  return shuffle(chosen).map(inst);
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
      const lab = el("label", { class: cls }, inp, el("b", {}, q.type === "tf" ? "" : LETTERS[i]), el("span", {}, o));
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
    const t = el("table", { class: "qt" }, el("thead", {}, el("tr", {}, el("th", { class: "c-sel" }, "Poradie"), el("th", {}, "Krok"), review ? el("th", { class: "c-res" }, "") : null)));
    const tb = el("tbody");
    q.shuf.forEach((pos, k) => {
      const s = el("select", { disabled: review, "aria-label": "Poradie" }, el("option", { value: "" }, "—"), opts.map((o) => el("option", { value: o, selected: a[k] === o }, o)));
      s.addEventListener("change", () => { state.answers[idx][k] = s.value; touch(); });
      const tr = el("tr", {}, el("td", { class: "c-sel" }, s), el("td", {}, q.items[pos]));
      if (review) { const ok = a[k] === String(pos + 1); tr.append(el("td", { class: "c-res " + (ok ? "ok" : "bad") }, ok ? "✓" : `✗ správne: ${pos + 1}.`)); }
      tb.append(tr);
    });
    t.append(tb); box.append(el("div", { class: "qt-wrap" }, t));
  } else if (q.type === "match") {
    const t = el("table", { class: "qt" }, el("thead", {}, el("tr", {}, el("th", {}, "Pojem"), el("th", {}, "Priradenie"), review ? el("th", { class: "c-res" }, "") : null)));
    const tb = el("tbody");
    q.pairs.forEach((p, i) => {
      const s = el("select", { disabled: review, "aria-label": "Priradenie: " + p[0] }, el("option", { value: "" }, "— vyberte —"), q.rights.map((o) => el("option", { value: o, selected: a[i] === o }, o)));
      s.addEventListener("change", () => { state.answers[idx][i] = s.value; touch(); });
      const tr = el("tr", {}, el("td", { class: "c-key" }, p[0]), el("td", {}, s));
      if (review) { const ok = a[i] === p[1]; tr.append(el("td", { class: "c-res " + (ok ? "ok" : "bad") }, ok ? "✓" : `✗ správne: ${p[1]}`)); }
      tb.append(tr);
    });
    t.append(tb); box.append(el("div", { class: "qt-wrap" }, t));
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

function setNav(id) {
  document.querySelectorAll("#menu button").forEach((b) => b.classList.toggle("on", b.dataset.v === id));
}

function showBoard() {
  stopTimer();
  state = null;
  setNav("rebricek");
  $app.replaceChildren(el("div", { class: "page-title" }, el("h1", {}, "Rebríček")), boardCard());
  window.scrollTo({ top: 0 });
}

function showStart() {
  stopTimer();
  setNav("kapitoly");
  state = null;
  $app.replaceChildren();
  const chosen = new Set(Object.keys(LECTURES).map(Number));
  const bs = bookSwitch(() => refreshCounts());
  const book = bs.input;
  $app.append(el("div", { class: "page-title" }, el("h1", {}, "Kapitoly"), bs.node));

  const lectures = el("div", { class: "lecs" });
  const counts = {};
  const start = el("button", { class: "primary go" }, "Spustiť test");
  for (const [n, name] of Object.entries(LECTURES)) {
    const cb = el("input", { type: "checkbox", checked: true, "aria-label": `Prednáška ${n}` });
    cb.addEventListener("change", () => { cb.checked ? chosen.add(+n) : chosen.delete(+n); start.disabled = chosen.size === 0; });
    lectures.append(el("label", { class: "lec" }, cb,
      el("span", { class: "t" }, `${n}. ${name}`),
      counts[n] = el("span", { class: "count" })));
  }
  $app.append(el("div", { class: "field" }, lectures));

  const m1 = el("input", { type: "radio", name: "mode", value: "test", checked: true });
  const m2 = el("input", { type: "radio", name: "mode", value: "train" });
  let saved = 20;
  try { saved = +localStorage.getItem(COUNT_KEY) || 20; } catch (e) {}
  const countSeg = el("div", { class: "seg", role: "radiogroup", "aria-label": "Počet otázok" }, COUNTS.map((n) =>
    el("label", {}, el("input", { type: "radio", name: "cnt", value: n, checked: n === saved }), String(n))));
  $app.append(el("div", { class: "opts" },
    el("div", { class: "field" }, el("h2", {}, "Režim"), el("div", { class: "seg" }, el("label", {}, m1, "Test"), el("label", {}, m2, "Tréning"))),
    el("div", { class: "field" }, el("h2", {}, "Počet otázok"), countSeg)));

  const refreshCounts = () => {
    for (const n of Object.keys(LECTURES)) {
      const all = BANK.filter((d) => d.lec === +n);
      const pres = all.filter((d) => d.src !== "kniha").length;
      counts[n].textContent = book.checked ? `${all.length} otázok (z toho ${all.length - pres} z knihy)` : `${pres} otázok`;
    }
  };
  refreshCounts();

  start.addEventListener("click", () => {
    if (!getName()) { askName(true); return; }
    const n = +countSeg.querySelector("input:checked").value;
    try { localStorage.setItem(COUNT_KEY, n); } catch (e) {}
    const qs = buildTest([...chosen], n, book.checked);
    state = { qs, answers: qs.map(emptyAnswer), checked: qs.map(() => false), cur: 0, train: m2.checked, t0: Date.now(), done: false };
    startTimer();
    showQuiz();
  });
  $app.append(start);
}

function startTimer() {
  $timer.hidden = false;
  document.body.classList.add("in-quiz"); // na mobile skryje menu počas testu
  const upd = () => { const s = Math.floor((Date.now() - state.t0) / 1000); $timer.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`; };
  upd(); tick = setInterval(upd, 1000);
}
function stopTimer() { clearInterval(tick); $timer.hidden = true; document.body.classList.remove("in-quiz"); }

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
  setNav(null);
  const { qs, cur } = state;
  const q = qs[cur];
  $app.replaceChildren();
  const nav = el("div", { class: "card nav" }, el("h2", {}, "Otázky"));
  navEl = el("div", { class: "grid" }, qs.map((_, i) => el("button", { onclick: () => { state.cur = i; showQuiz(); }, "aria-label": "Otázka " + (i + 1) }, String(i + 1))));
  nav.append(navEl);
  nav.append(el("div", { class: "hint" }, `Zodpovedané: ${qs.filter((qq, i) => answered(qq, state.answers[i])).length} / ${qs.length}`));
  nav.append(el("div", { style: "margin-top:12px" }, el("button", { class: "primary", onclick: finish }, "Skončiť test")));

  const rev = state.train && state.checked[cur];
  const main = el("div", { class: "card" });
  main.append(el("div", { class: "qhead" }, el("div", { class: "qno" }, `Otázka ${cur + 1} `, el("span", {}, `/ ${qs.length}`)), el("span", {}, el("span", { class: "tag" }, TYPE_LABEL[q.type]), " ", el("span", { class: "tag" }, `Prednáška ${q.lec}`), q.src === "kniha" ? el("span", { class: "tag" }, "Kniha") : null)));
  main.append(renderQuestion(q, cur, rev));
  const pager = el("div", { class: "pager" },
    el("button", { disabled: cur === 0, onclick: () => { state.cur--; showQuiz(); } }, "← Späť"),
    state.train && !rev ? el("button", { onclick: () => { state.checked[cur] = true; showQuiz(); } }, "Skontrolovať") : null,
    cur < qs.length - 1 ? el("button", { class: "primary", onclick: () => { state.cur++; showQuiz(); } }, "Ďalšia →") : el("button", { class: "primary", onclick: finish }, "Skončiť test"));
  main.append(pager);
  const done = qs.filter((qq, i) => answered(qq, state.answers[i])).length;
  $app.append(el("div", { class: "progress", role: "progressbar", "aria-valuenow": done, "aria-valuemax": qs.length }, el("i", { style: `width:${(done / qs.length) * 100}%` })));
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
  // do rebríčka sa ráta každá zodpovedaná otázka (aj z tréningu); správna = plný počet bodov
  const given = state.qs.map((q, i) => (answered(q, state.answers[i]) ? grade(q, state.answers[i]) : null)).filter((x) => x !== null);
  state.right = given.filter((x) => x >= 0.999).length;
  if (given.length) state.submit = await submitScore(state.right, given.length);
  syncWrong(state.qs.filter((q, i) => answered(q, state.answers[i]) && q.id));
  showResults();
}

function showResults(onlyWrong = false) {
  setNav(null);
  const { qs, answers } = state;
  const scores = qs.map((q, i) => grade(q, answers[i]));
  const sum = scores.reduce((x, y) => x + y, 0);
  const pct = Math.round((sum / qs.length) * 100);
  $app.replaceChildren();
  const fmtN = (n) => round(n, 2).toString().replace(".", ",");
  const stat = (v, l) => el("div", { class: "stat" }, el("b", {}, String(v)), l);
  const head = el("div", { class: "card result" },
    el("h1", {}, `${fmtN(sum)} / ${qs.length}`, el("span", {}, `${pct} %`)),
    el("div", { class: "stats" },
      stat(`${Math.floor(state.secs / 60)}:${String(state.secs % 60).padStart(2, "0")}`, "čas"),
      stat(scores.filter((s) => s >= 0.999).length, "správne"),
      stat(scores.filter((s) => s > 0 && s < 0.999).length, "čiastočne"),
      stat(scores.filter((s) => s === 0).length, "nesprávne")),
    state.submit
      ? el("p", { class: "earned" }, `+${state.right} ${state.right === 1 ? "správna odpoveď" : state.right > 0 && state.right < 5 ? "správne odpovede" : "správnych odpovedí"} do rebríčka`)
      : el("p", { class: "hint" }, "Body sa nepodarilo uložiť do rebríčka."),
    state.wrongAdded ? el("p", { class: "hint" }, `${state.wrongAdded} ${state.wrongAdded === 1 ? "chybná otázka uložená" : "chybných otázok uložených"} na precvičenie (záložka Na precvičenie).`) : null,
    el("div", { class: "row" },
      el("button", { class: "primary", onclick: showStart }, "Nový test"),
      el("button", { onclick: () => showResults(!onlyWrong) }, onlyWrong ? "Zobraziť všetky" : "Zobraziť len chybné")));
  $app.append(head);
  $app.append(boardCard(state.submit && state.submit.board));
  qs.forEach((q, i) => {
    if (onlyWrong && scores[i] >= 0.999) return;
    const card = el("div", { class: "card res-item" });
    card.append(el("div", { class: "qhead" }, el("div", { class: "qno" }, `Otázka ${i + 1}`), el("span", {}, el("span", { class: "tag" }, TYPE_LABEL[q.type]), " ", el("span", { class: "tag" }, `Prednáška ${q.lec} · ${q.topic}`), q.src === "kniha" ? el("span", { class: "tag" }, "Kniha") : null)));
    state.cur = i;
    card.append(renderQuestion(q, i, true));
    $app.append(card);
  });
  window.scrollTo({ top: 0 });
}

/* ------------------------------------------------------------------ meno a rebríček */
const NAME_KEY = "kviz-meno";
let memName = ""; // záloha, ak je localStorage nedostupný
const getName = () => { try { return localStorage.getItem(NAME_KEY) || memName; } catch (e) { return memName; } };
function updateWho() {
  const b = document.getElementById("who");
  b.textContent = getName() || "bez mena";
  b.onclick = () => askName(false);
}
// meno sa ukladá aj do dlhodobej cookie na serveri, aby prežilo vymazanie localStorage
const rememberName = (v) => { fetch("/api/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: v }) }).catch(() => {}); };
async function restoreName() {
  if (getName()) { rememberName(getName()); return; } // obnoví cookie, ak už vypršala
  try {
    const r = await fetch("/api/me", { cache: "no-store" });
    const n = r.ok ? ((await r.json()).name || "").trim().slice(0, 20) : "";
    if (n) { memName = n; try { localStorage.setItem(NAME_KEY, n); } catch (e) {} }
  } catch (e) {}
}

function askName(first) {
  if (document.querySelector(".modal")) return;
  first = first || !getName(); // bez mena sa modál nedá zavrieť
  const lock = (on) => document.querySelectorAll("header.top, main").forEach((n) => { n.inert = on; });
  const inp = el("input", { type: "text", maxlength: "20", value: getName(), placeholder: "Tvoje meno", "aria-label": "Meno" });
  const ok = el("button", { class: "primary" }, "Uložiť");
  const m = el("div", { class: "modal" }, el("div", { class: "card" },
    el("h1", {}, first ? "Ako sa voláš?" : "Zmeniť meno"),
    el("p", { class: "muted" }, "Pod týmto menom sa ti budú počítať správne odpovede."),
    el("div", { class: "line" }, inp),
    el("div", { class: "row" }, ok, first ? null : el("button", { onclick: () => { lock(false); m.remove(); } }, "Zrušiť"))));
  const save = () => {
    const v = inp.value.trim().slice(0, 20);
    if (!v) { inp.focus(); return; }
    memName = v;
    try { localStorage.setItem(NAME_KEY, v); } catch (e) {}
    rememberName(v);
    lock(false); m.remove(); updateWho();
    if (!state) showStart();
  };
  ok.addEventListener("click", save);
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); });
  m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
  if (!first) m.addEventListener("keydown", (e) => { if (e.key === "Escape") { lock(false); m.remove(); } });
  lock(true);
  document.body.append(m);
  inp.focus();
}
async function fetchBoard() {
  const r = await fetch("/api/scores", { cache: "no-store" });
  if (!r.ok) throw new Error();
  return r.json();
}
async function submitScore(correct, answered) {
  try {
    const r = await fetch("/api/scores", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: getName() || "Anonym", correct, answered }) });
    if (!r.ok) throw new Error();
    return await r.json();
  } catch (e) { return null; }
}
/* ------------------------------------------------------------------ otázky na precvičenie (chyby) */
const wrongKey = () => "kviz-chyby-" + getName().toLowerCase();
const readWrongCache = () => { try { return JSON.parse(localStorage.getItem(wrongKey())) || []; } catch (e) { return []; } };
const writeWrongCache = (ids) => { try { localStorage.setItem(wrongKey(), JSON.stringify(ids)); } catch (e) {} };

async function fetchWrong() {
  try {
    const r = await fetch("/api/wrong?name=" + encodeURIComponent(getName()), { cache: "no-store" });
    if (!r.ok) throw new Error();
    const ids = (await r.json()).ids;
    writeWrongCache(ids);
    return ids;
  } catch (e) { return readWrongCache(); }
}
// po teste: pomýlené otázky sa pridajú do zoznamu, správne zodpovedané sa z neho odoberú
async function syncWrong(answeredQs) {
  const add = [], remove = [];
  for (const q of answeredQs) (grade(q, state.answers[state.qs.indexOf(q)]) >= 0.999 ? remove : add).push(q.id);
  state.wrongAdded = add.length;
  if (!add.length && !remove.length) return;
  const cur = new Set(readWrongCache());
  add.forEach((x) => cur.add(x)); remove.forEach((x) => cur.delete(x));
  writeWrongCache([...cur]);
  try {
    const r = await fetch("/api/wrong", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: getName(), add, remove }) });
    if (r.ok) writeWrongCache((await r.json()).ids);
  } catch (e) {}
}

const stripTags = (h) => h.replace(/<pre>[\s\S]*?<\/pre>/g, " … ").replace(/<[^>]+>/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

async function showWrong() {
  stopTimer();
  state = null;
  setNav("chyby");
  let ids = null;
  const body = el("div", {}, el("p", { class: "muted" }, "Načítavam…"));
  const bs = bookSwitch(() => draw());
  $app.replaceChildren(el("div", { class: "page-title" }, el("h1", {}, "Na precvičenie"), bs.node), body);
  let lecSel = "all";
  const draw = () => {
    if (ids === null) return;
    const all = ids.map((id) => BANK.find((d) => d.id === id)).filter((d) => d && (bs.input.checked || d.src !== "kniha"))
      .sort((a, b) => a.lec - b.lec || a.id.localeCompare(b.id, undefined, { numeric: true }));
    if (!all.length) {
      body.replaceChildren(el("p", { class: "muted" }, ids.length
        ? "Zatiaľ máš chybné otázky len z knihy. Zapni prepínač Kniha, ak ich chceš vidieť."
        : "Zatiaľ tu nemáš žiadne chybné otázky. Keď sa v teste pomýliš, otázka sa uloží sem. Správna odpoveď ju zo zoznamu odstráni."));
      return;
    }
    const cnt = (n) => all.filter((d) => d.lec === n).length;
    if (lecSel !== "all" && !cnt(+lecSel)) lecSel = "all";
    const defs = lecSel === "all" ? all : all.filter((d) => d.lec === +lecSel);
    const opt = (v, label, n) => {
      const inp = el("input", { type: "radio", name: "wl", value: v, checked: String(lecSel) === String(v), disabled: n === 0 });
      inp.addEventListener("change", () => { lecSel = v; draw(); });
      return el("label", { class: n === 0 ? "off" : "" }, inp, label, el("small", {}, ` ${n}`));
    };
    const filter = el("div", { class: "seg wrap", role: "radiogroup", "aria-label": "Téma" },
      opt("all", "Všetky", all.length), Object.keys(LECTURES).map((n) => opt(n, `Téma ${n}`, cnt(+n))));
    const list = el("div", { class: "lecs" }, defs.map((d) => {
      let t = "";
      try { t = stripTags(d.make().text); } catch (e) {}
      return el("div", { class: "lec wrongrow" }, el("span", { class: "lecno" }, String(d.lec)),
        el("span", { class: "t" }, t.length > 130 ? t.slice(0, 127) + "…" : t, el("small", {}, `${d.topic} · ${TYPE_LABEL[d.type]}${d.src === "kniha" ? " · Kniha" : ""}`)));
    }));
    const go = el("button", { class: "primary go" }, `Precvičiť${lecSel === "all" ? "" : " tému " + lecSel} (${Math.min(defs.length, 30)})`);
    go.addEventListener("click", () => {
      const qs = shuffle(defs).slice(0, 30).map(inst);
      state = { qs, answers: qs.map(emptyAnswer), checked: qs.map(() => false), cur: 0, train: true, t0: Date.now(), done: false };
      startTimer();
      showQuiz();
    });
    body.replaceChildren(filter, el("p", { class: "muted", style: "margin:16px 0 12px" }, `${defs.length} ${defs.length === 1 ? "otázka" : defs.length < 5 ? "otázky" : "otázok"} na precvičenie.`), list, go);
  };
  const got = await fetchWrong();
  if (state || !document.querySelector('#menu [data-v="chyby"].on')) return; // medzitým sa odišlo inam
  ids = got;
  draw();
}

function boardCard(rows) {
  const card = el("div", {}, el("h2", {}, "Rebríček · správne odpovede"));
  const body = el("div", { class: "card" }, el("p", { class: "muted", style: "margin:0" }, "Načítavam…"));
  card.append(body);
  const draw = (list) => {
    if (!list.length) { body.replaceChildren(el("p", { class: "muted", style: "margin:0" }, "Zatiaľ tu nikto nie je. Buď prvý!")); return; }
    const me = getName().toLowerCase();
    const mine = list.find((r) => r.name.toLowerCase() === me);
    const out = [];
    if (mine) out.push(el("p", { class: "mine" }, "Tvoj výsledok: ", el("b", {}, `${mine.correct} správnych`), ` · úspešnosť ${Math.round(mine.pct * 100)} %`));
    out.push(el("table", { class: "board" },
      el("thead", {}, el("tr", {}, el("th", {}, "#"), el("th", {}, "Meno"), el("th", { class: "num" }, "Úspešnosť"), el("th", { class: "num" }, "Správne"))),
      el("tbody", {}, list.map((r, i) => el("tr", { class: r.name.toLowerCase() === me ? "me" : "" },
        el("td", { class: "rk" }, String(i + 1)), el("td", { class: "nm" }, r.name),
        el("td", { class: "num muted" }, Math.round(r.pct * 100) + " %"), el("td", { class: "num" }, String(r.correct)))))));
    body.replaceChildren(...out);
  };
  if (rows) draw(rows);
  else fetchBoard().then(draw).catch(() => body.replaceChildren(el("p", { class: "muted", style: "margin:0" }, "Rebríček nie je dostupný.")));
  return card;
}

const leave = (view) => () => {
  if (state && !state.done && !confirm("Test ešte nie je dokončený. Ak odídeš, rozpracované odpovede sa stratia. Naozaj odísť?")) return;
  view();
};
document.getElementById("home").addEventListener("click", leave(showStart));
document.querySelector('#menu [data-v="kapitoly"]').addEventListener("click", leave(showStart));
document.querySelector('#menu [data-v="rebricek"]').addEventListener("click", leave(showBoard));
document.querySelector('#menu [data-v="chyby"]').addEventListener("click", leave(showWrong));
(async () => {
  await restoreName();
  updateWho();
  showStart();
  if (!getName()) askName(true);
})();
