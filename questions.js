/* Banka otázok – Signálové mikrokontroléry, prednášky 2–6 (TMS320F2837xD)
   Každá definícia: {lec, topic, type, make()} – make() vráti novú inštanciu otázky
   (parametrické otázky majú pri každom generovaní iné čísla). */
"use strict";

const LECTURES = {
  2: "Prerušenia, PIE a časovače",
  3: "PWM: časová základňa, komparácia, riadenie akcie, dead-band",
  4: "PWM chopper, Trip-zone, Event-trigger",
  5: "AD prevodník",
  6: "Inkrementálne snímače a modul eQEP",
};

const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const fmt = (n) => Number(n).toLocaleString("sk-SK");
const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

const BANK = [];
const G = (lec, topic, type, make) => BANK.push({ lec, topic, type, make });

/* ---- pomocné konštruktéry ---- */
// jedna správna z ABCD (správna + 3 náhodné z nesprávnych)
const S = (lec, topic, text, ok, bad, expl = "") =>
  G(lec, topic, "single", () => {
    const options = shuffle([ok, ...shuffle(bad).slice(0, 3)]);
    return { text, options, correct: options.indexOf(ok), expl };
  });
// viac správnych odpovedí
const M = (lec, topic, text, oks, bad, expl = "") =>
  G(lec, topic, "multi", () => {
    const good = oks.slice(0, 4);
    const wrong = shuffle(bad).slice(0, Math.max(2, 6 - good.length));
    const options = shuffle([...good, ...wrong]);
    return { text, options, correct: good.map((g) => options.indexOf(g)), expl };
  });
// pravda / nepravda
const TF = (lec, topic, stmt, truth, expl = "") =>
  G(lec, topic, "tf", () => ({
    text: "Posúďte tvrdenie: <em>" + stmt + "</em>",
    options: ["Pravda", "Nepravda"],
    correct: truth ? 0 : 1,
    expl,
  }));
// doplň slovo / výraz
const T = (lec, topic, text, accepted, expl = "") =>
  G(lec, topic, "text", () => ({ text, accepted, expl }));
// číselná odpoveď (fixná)
const N = (lec, topic, text, answer, tol, unit, expl = "") =>
  G(lec, topic, "num", () => ({ text, answer, tol, unit, alt: [], expl }));
// zoradenie krokov
const O = (lec, topic, text, items, expl = "") =>
  G(lec, topic, "order", () => ({ text, items, expl }));
// priraďovanie – náhodne 4 dvojice z poskytnutých
const P = (lec, topic, text, pairs, expl = "") =>
  G(lec, topic, "match", () => ({ text, pairs: shuffle(pairs).slice(0, 4), expl }));

/* =====================================================================
   PREDNÁŠKA 2 – prerušenia, PIE, časovače
   ===================================================================== */
S(2, "Prerušenia", "Čo je to prerušenie (interrupt)?",
  "Udalosť, pri ktorej sa preruší vykonávaný program, spracuje sa obsluha prerušenia (ISR) a potom sa program vráti tam, kde bol prerušený",
  ["Chyba programu, po ktorej sa mikrokontrolér vždy reštartuje", "Trvalé zastavenie jadra CPU do zásahu používateľa", "Funkcia, ktorú musí hlavný program pravidelne volať v cykle", "Zmena taktovacej frekvencie CPU počas behu programu"],
  "Po skončení ISR program pokračuje v činnosti od miesta prerušenia.");
S(2, "Prerušenia", "Koľko prerušení je výpočtové jadro CPU schopné spracovať?",
  "15 (12 pre PIE, 2 pre časovače 1 a 2, 1 nemaskovateľné)", ["12", "16", "120", "32"],
  "12 prerušení pre PIE + 2 pre časovače 1 a 2 + 1 nemaskovateľné prerušenie pre systémové chyby = 15.");
S(2, "Prerušenia", "Čo znamená skratka PIE v prerušovacom systéme?",
  "Peripheral Interrupt Expansion", ["Programmable Interrupt Engine", "Priority Input Enable", "Peripheral Instruction Executor"],
  "PIE zoskupuje množstvo prerušení z periférií do max. 12 prerušení pre CPU.");
S(2, "Prerušenia", "Koľko prerušení z periférií dokáže PIE zoskupiť do jedného prerušenia CPU?",
  "až 16", ["až 4", "až 8", "až 120", "iba 1"],
  "Do 12 skupín (INT1–INT12) po max. 16 prerušení → okolo 120 prerušení z periférií v TMS320F2837xD.");
S(2, "Prerušenia", "Približne koľko prerušení z periférií zoskupuje PIE v TMS320F2837xD?",
  "okolo 120", ["okolo 12", "okolo 15", "okolo 1000", "presne 16"],
  "Zvyšné miesta sú rezervované napr. pre budúce generácie MCU.");
S(2, "Prerušenia", "Na koľkých úrovniach sa povoľuje prerušenie (od periférie po CPU)?",
  "4 úrovne (periféria, PIE, CPU register IER, globálne povolenie ST1)", ["2 úrovne", "3 úrovne", "6 úrovní", "iba 1 úroveň"],
  "Povolenie: periféria → PIE (PIEIERx) → CPU (IER) → globálne (ST1).");
M(2, "Prerušenia", "Na ktorých úrovniach sa povoľuje prerušenie? (môže byť správnych viac možností)",
  ["na úrovni periférie", "na úrovni PIE (PieCtrlRegs.PIEIERx)", "na úrovni CPU (register IER)", "globálne povolenie v registri ST1"],
  ["na úrovni DMA radiča", "na úrovni systémových hodín", "na úrovni watchdogu", "na úrovni ADC kalibrácie"]);
S(2, "Prerušenia", "Pri ktorých prerušeniach sa PIE nepoužíva a nie je ho potrebné konfigurovať?",
  "pri prerušeniach od časovačov 1 a 2 a pri nemaskovateľných prerušeniach", ["pri prerušeniach od ePWM", "pri prerušeniach od ADC", "pri prerušeniach od eQEP", "pri všetkých prerušeniach z periférií"],
  "Tieto prerušenia idú do CPU priamo.");
S(2, "Prerušenia", "V akom poradí je potrebné čistiť príznaky prerušenia?",
  "od najnižšej úrovne po najvyššiu (periféria → PIE → CPU)", ["od najvyššej úrovne po najnižšiu", "poradie nie je dôležité", "iba na úrovni CPU", "iba na úrovni periférie"]);
TF(2, "Prerušenia", "Obslužná funkcia (ISR) má vstupné parametre aj návratovú hodnotu.", false,
  "ISR nemá vstupné parametre ani návratovú hodnotu.");
TF(2, "Prerušenia", "Obslužná funkcia sa v programe priamo nevolá – pri požiadavke na prerušenie na ňu skočí mikrokontrolér.", true);
TF(2, "Prerušenia", "V CCStudiu sa pri skoku do ISR automaticky uložia pomocné registre a vyčistia sa príznaky na úrovni CPU.", true,
  "Príznaky periférie a PIE však treba vyčistiť v ISR ručne.");
TF(2, "Prerušenia", "Príznaky prerušenia na úrovni periférie a PIE netreba čistiť, CCStudio ich vyčistí automaticky.", false,
  "Automaticky sa čistia len príznaky na úrovni CPU.");
T(2, "Prerušenia", "Aké kľúčové slovo musí byť uvedené na začiatku hlavičky obslužnej funkcie prerušenia? (jedno slovo)", ["interrupt"],
  "Napr. <code>interrupt void timer0_isr(void)</code>.");
O(2, "Prerušenia", "Zoraďte kroky inicializácie prerušenia od časovača (TIMER0) do správneho poradia.",
  ["Globálne zakázať prerušenia", "Zapnúť PIE", "Nastaviť smerník pre obslužnú funkciu", "Povoliť prerušenie v PIE", "Globálne povoliť prerušenia", "Povoliť prerušenie v časovači"]);
O(2, "Prerušenia", "Zoraďte kroky v obslužnej funkcii prerušenia (ktorá len prepne výstup GPIO31).",
  ["Definícia hlavičky funkcie", "Prepnutie výstupu", "Vyčistenie príznakov na úrovni periférie", "Vyčistenie príznakov na úrovni PIE"]);
O(2, "Časovače", "Zoraďte kroky inicializácie časovača CPU.",
  ["Povoliť hodiny", "Zastaviť časovač", "Nastaviť deličku", "Nastaviť periódu", "Reload časovača"]);
S(2, "Časovače", "Čo je to časovač (čítač) z pohľadu mikrokontroléra?",
  "počítadlo, ktoré inkrementuje alebo dekrementuje svoju hodnotu s každým hodinovým impulzom na vstupe",
  ["pamäť, do ktorej sa ukladá čas z RTC", "periféria, ktorá generuje len náhodné čísla", "len softvérová premenná inkrementovaná v cykle while", "vstupný filter pre digitálne piny"]);
S(2, "Časovače", "Aký je rozdiel medzi časovačom a čítačom?",
  "časovač počíta impulzy zo systémových hodín/oscilátora, čítač impulzy externého signálu",
  ["časovač je 32-bitový a čítač 16-bitový", "časovač počíta len hore, čítač len dole", "časovač je softvérový, čítač hardvérový", "žiadny, ide o rovnaké pojmy bez rozdielu"]);
S(2, "Časovače", "Čo je to delička na vstupe časovača F2837xD?",
  "podradený časovač, ktorý znižuje frekvenciu hodín pre hlavný časovač",
  ["systém, ktorý delí výstupný signál časovača medzi užívateľom nastaviteľné GPIO", "interný obvod, ktorého úlohou je deliť napäťovú úroveň systémových hodín", "výpočtový blok, ktorý delí periódu časovača na 16 rovnakých častí", "systém, ktorý delí hodnotu časovača na horných a dolných 16 bitov"],
  "Delička pri pretečení namiesto nastavenia príznaku vyšle signál do nadradeného časovača.");
S(2, "Časovače", "Koľko dekrementujúcich CPU časovačov má TMS320F2837xD?",
  "3 (CpuTimer0, CpuTimer1, CpuTimer2)", ["1", "2", "4", "12"]);
S(2, "Časovače", "Na čo je určený CpuTimer2 v TMS320F2837xD?",
  "rezervovaný pre operačný systém / všeobecné použitie", ["výlučne pre generovanie PWM", "výlučne pre AD prevodník", "výlučne pre eQEP", "výlučne pre watchdog"]);
S(2, "Časovače", "Akú deličku má každý z časovačov CpuTimerx v TMS320F2837xD?",
  "16-bitovú", ["2-bitovú", "4-bitovú", "8-bitovú", "žiadnu"]);
TF(2, "Časovače", "Časovače CpuTimerx sa používajú na generovanie PWM signálu.", false,
  "CpuTimerx sú len časovače; PWM generuje periféria ePWM.");
TF(2, "Časovače", "Časovače CpuTimerx v TMS320F2837xD sú dekrementujúce.", true);
T(2, "Časovače", "Ktorý bit slúži na zastavenie/spustenie časovača CPU? (názov bitu)", ["TSS", "tss"],
  "Zastavenie/spustenie – bit TSS; reset (reload) – bit TRB.");
T(2, "Časovače", "Ktorý bit slúži na reset (reload) časovača CPU? (názov bitu)", ["TRB"],
  "Zastavenie/spustenie – bit TSS; reset – bit TRB.");
S(2, "Časovače", "Ako možno z časovača získať PWM podľa prednášky?",
  "porovnávaním hodnoty časovača s premennou a prepínaním výstupu pri zhode/pretečení",
  ["delením frekvencie časovača desiatimi", "pripojením časovača priamo na ADC", "zapisovaním do registra IER v ISR", "použitím iba nemaskovateľného prerušenia"],
  "Frekvenciu určuje max. hodnota časovača a delička, šírku impulzu hodnota premennej.");
S(2, "Časovače", "Ak je na vstupe čítača externý signál z inkrementálneho snímača, čo reprezentuje aktuálna hodnota čítača?",
  "aktuálnu polohu (podľa počtu prijatých impulzov)", ["aktuálne napätie", "aktuálnu teplotu čipu", "aktuálny čas", "frekvenciu hodín CPU"]);

// -- parametrické: perióda časovača
G(2, "Časovače", "num", () => {
  const f = pick([100, 200]), d = pick([1, 2, 4]), ms = pick([1, 2, 5, 10, 20, 50]);
  const ticks = ((f * 1e6) / d) * (ms / 1000);
  return {
    text: `Akú hodnotu je potrebné zapísať do periódy časovača 0 (CpuTimer0Regs.PRD.all), aby časovač pretiekol po ${ms} milisekundách? Frekvencia hodinového signálu mikrokontroléra je ${f} MHz, časovač má nastavenú deličku na 1/${d}.`,
    answer: ticks, alt: [ticks - 1], tol: 0, unit: "",
    expl: `Hodinový signál časovača = ${f} MHz / ${d} = ${f / d} MHz. Počet taktov = ${f / d}·10⁶ · ${ms}·10⁻³ = ${fmt(ticks)}. Keďže časovač počíta PRD → 0, presná hodnota je ${fmt(ticks - 1)}; akceptuje sa aj ${fmt(ticks)}.`,
  };
});
G(2, "Časovače", "num", () => {
  const f = pick([100, 200]), d = pick([1, 2, 4]);
  const ms = pick([1, 2, 5, 10, 25]);
  const ticks = ((f * 1e6) / d) * (ms / 1000);
  return {
    text: `Do periódy časovača 0 je zapísaná hodnota ${fmt(ticks - 1)}. Frekvencia hodín mikrokontroléra je ${f} MHz a delička je nastavená na 1/${d}. Za aký čas časovač pretečie? Výsledok uveďte v milisekundách.`,
    answer: ms, alt: [], tol: ms * 0.005, unit: "ms",
    expl: `Počet taktov = PRD + 1 = ${fmt(ticks)}; f = ${f / d} MHz → t = ${fmt(ticks)} / ${f / d}·10⁶ = ${ms} ms.`,
  };
});

// -- povolenie prerušenia v PIE a IER
G(2, "Prerušenia", "select", () => {
  const list = [
    ["EPWM1_INT", 3, 1], ["EPWM2_INT", 3, 2], ["EPWM3_INT", 3, 3], ["EPWM4_INT", 3, 4], ["EPWM5_INT", 3, 5],
    ["EPWM6_INT", 3, 6], ["EPWM7_INT", 3, 7], ["EPWM8_INT", 3, 8],
    ["ECAP1_INT", 4, 1], ["ECAP2_INT", 4, 2], ["ECAP3_INT", 4, 3],
    ["EQEP1_INT", 5, 1], ["EQEP2_INT", 5, 2], ["EQEP3_INT", 5, 3],
    ["TIMER0_INT", 1, 7], ["ADCA1_INT", 1, 1], ["ADCB1_INT", 1, 2], ["XINT1_INT", 1, 4],
  ];
  const [name, grp, x] = pick(list);
  const per = name.replace("_INT", "");
  const rows = (g, labels) => `<tr><td>INT${g}.y</td>${labels.map((l, i) => `<td>${l}</td>`).join("")}</tr>`;
  const table = `<table><tr><th></th>${[1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<th>INTx.${i}</th>`).join("")}</tr>
    ${rows(1, ["ADCA1", "ADCB1", "ADCC1", "XINT1", "XINT2", "ADCD1", "TIMER0", "WAKE"])}
    ${rows(3, ["EPWM1", "EPWM2", "EPWM3", "EPWM4", "EPWM5", "EPWM6", "EPWM7", "EPWM8"])}
    ${rows(4, ["ECAP1", "ECAP2", "ECAP3", "ECAP4", "ECAP5", "ECAP6", "–", "–"])}
    ${rows(5, ["EQEP1", "EQEP2", "EQEP3", "–", "CLB1", "CLB2", "CLB3", "CLB4"])}</table>`;
  const grpOpts = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const xOpts = Array.from({ length: 16 }, (_, i) => String(i + 1));
  const sh = Array.from({ length: 14 }, (_, i) => String(i));
  return {
    text: `Doplňte kód tak, aby ste povolili prerušenie od ${per}.
<pre>EALLOW;
PieCtrlRegs.PIEIER{{0}}.bit.INTx{{1}} = 1;   // allow interrupt
PieVectTable.${name} = &amp;isr;              // route interrupt
EDIS;
IER |= (1 &lt;&lt; {{2}});                        // enable interrupt</pre>
Mapovanie prerušení v PIE (časť tabuľky):${table}
<span class="small">Register IER: bit 0 = INT1, bit 1 = INT2, … (INTn ↔ bit n−1).</span>`,
    blanks: [{ opts: grpOpts, ans: String(grp) }, { opts: xOpts, ans: String(x) }, { opts: sh, ans: String(grp - 1) }],
    expl: `${per} je v tabuľke v riadku INT${grp}, stĺpci INTx.${x} → PIEIER${grp}.bit.INTx${x}. Do IER sa zapisuje bit (${grp} − 1) = ${grp - 1}.`,
  };
});

/* =====================================================================
   PREDNÁŠKA 3 – PWM: time-base, counter-compare, action-qualifier, dead-band
   ===================================================================== */
S(3, "PWM", "Čo je to PWM (impulzovo-šírková modulácia)?",
  "metóda, ktorou sa digitálnym signálom aproximuje analógový signál zmenou strednej hodnoty výstupného napätia",
  ["metóda prevodu analógového signálu na digitálny", "metóda zmeny frekvencie hodín CPU", "protokol sériovej komunikácie", "metóda filtrovania rušenia na digitálnom vstupe"]);
M(3, "PWM", "Čo platí pri aproximácii analógového signálu pomocou PWM? (môže byť správnych viac možností)",
  ["výstup je stále digitálny", "frekvencia digitálneho signálu musí byť násobne vyššia ako frekvencia prenášaného analógového signálu", "okamžitá stredná hodnota digitálneho signálu je približne rovná okamžitej hodnote analógového signálu"],
  ["výstup je analógový", "frekvencia PWM musí byť nižšia ako frekvencia analógového signálu", "strednú hodnotu mení výlučne zmena amplitúdy impulzov"]);
S(3, "PWM", "S akým signálom sa v PWM porovnáva definovaná hodnota?",
  "s periodickým pílovitým alebo trojuholníkovým nosným signálom", ["so sínusovým signálom siete", "s napätím referencie ADC", "s výstupom DAC prevodníka", "s hodinami watchdogu"]);
M(3, "PWM", "Ktoré udalosti môžu nastať pri porovnávaní nosného signálu s definovanou hodnotou?",
  ["zhoda pri počítaní smerom hore", "zhoda pri počítaní smerom dole", "nosný signál dosiahne periódu", "nosný signál dosiahne nulu"],
  ["pretečenie ADC výsledku", "zmena smeru otáčania snímača", "výpadok napájania periférie"]);
S(3, "ePWM", "Ktorý z uvedených NIE JE submodulom ePWM v TMS320F2837xD?",
  "Quadrature decoder", ["Time-base", "Dead-band", "Trip-zone", "Event-trigger", "Action-qualifier", "PWM-chopper"],
  "Quadrature decoder je súčasť modulu eQEP (prednáška 6).");
S(3, "ePWM", "Koľko PWM modulov má TMS320F2837xD?", "až 12", ["až 4", "až 6", "až 24", "iba 1"]);
P(3, "ePWM", "Priraďte submodul ePWM k jeho úlohe.", [
  ["Time-base", "16-bitový časovač s deličkami a nastaviteľnou periódou"],
  ["Counter-compare", "porovnáva čítač s registrami CMPA–CMPD a pri zhode generuje signál"],
  ["Action-qualifier", "riadi výstupy EPWMxA a EPWMxB akciami set / clear / toggle"],
  ["Dead-band", "vkladá bezpečnostnú medzeru medzi komplementárne signály"],
  ["PWM-chopper", "moduluje výstup vysokofrekvenčným nosným signálom"],
  ["Event-trigger", "vyvoláva prerušenia a spúšťa AD prevod (SOC)"],
  ["Trip-zone", "reaguje na chybové stavy riadeného hardvéru"],
]);
S(3, "Time-base", "Aký typ čítača tvorí časovú základňu ePWM?",
  "16-bitový časovač s nastaviteľným režimom počítania", ["8-bitový čítač len počítajúci hore", "32-bitový čítač len počítajúci dole", "12-bitový SAR čítač", "analógový integrátor"]);
M(3, "Time-base", "Aké režimy počítania má časová základňa ePWM?",
  ["hore", "dole", "hore-dole", "čítač zastavený"], ["iba náhodný režim", "iba cyklický režim cez GPIO", "diferenciálny režim"]);
S(3, "Time-base", "Aké je maximálne delenie deličky CLKDIV v časovej základni ePWM?", "/128", ["/14", "/16", "/64", "/1024"]);
S(3, "Time-base", "Aké je maximálne delenie deličky HSPCLKDIV v časovej základni ePWM?", "/14", ["/128", "/16", "/8", "/64"]);
T(3, "Time-base", "Ako sa volá register, ktorý určuje maximálnu hodnotu (periódu) časovej základne ePWM? (názov registra)", ["TBPRD", "PRD"]);
M(3, "Time-base", "Ktoré udalosti generuje časová základňa ePWM?",
  ["čítač = 0 (CTR = 0)", "čítač = perióda (CTR = PRD)"], ["čítač = CMPA pri počítaní dole", "zhoda s QPOSMAX", "koniec AD konverzie", "pretečenie watchdogu"],
  "Zhody s CMPA/CMPB generuje komparačný submodul.");
M(3, "Time-base", "Kedy môže časová základňa vyslať signál pre synchronizáciu PWM modulov?",
  ["keď príde synchronizačný signál EPWMxSYNCI", "keď CTR = 0", "keď CTR = CMPB"], ["keď CTR = CMPA a počíta dole", "keď sa zmení stav GPIO0", "keď skončí ADC kalibrácia"]);
TF(3, "Time-base", "Synchronizácia časových základní medzi PWM modulmi môže prebiehať len v rámci synchronizačnej schémy.", true);
O(3, "Time-base", "Zoraďte kroky synchronizácie hodinových signálov TBCLK medzi PWM modulmi.",
  ["Povoliť hodiny do požadovaných PWM modulov (PCLKCR2)", "Nastaviť PCLKCR2.TBCLKSYNC = 0", "Nastaviť časové základne PWM modulov", "Nastaviť PCLKCR2.TBCLKSYNC = 1"]);
T(3, "Time-base", "Ktorý bit registra PCLKCR2 sa pri synchronizácii časových základní najprv nuluje a po nastavení modulov nastaví na 1?", ["TBCLKSYNC"]);
S(3, "Time-base", "Čo je výstupom Time-base submodulu pre synchronizáciu viacerých PWM modulov?", "signál EPWMxSYNC", ["signál EPWMxA", "signál ADCSOCA", "signál TZ1", "signál QEPxI"]);

// -- f_TBCLK
G(3, "Time-base", "num", () => {
  const f = pick([100, 200]), e = pick([1, 2]), h = pick([1, 2, 4]), c = pick([1, 2, 4]);
  const r = f / (e * h * c);
  return {
    text: `Frekvencia systémových hodín je ${f} MHz. Aká je frekvencia hodinového signálu časovej základne TBCLK, ak EPWMCLKDIV = ${e}, HSPCLKDIV = ${h} a CLKDIV = ${c}? Výsledok uveďte v MHz.`,
    answer: r, alt: [], tol: 0.01, unit: "MHz",
    expl: `f_TBCLK = f_SYSCLK / (EPWMCLKDIV · HSPCLKDIV · CLKDIV) = ${f} / (${e}·${h}·${c}) = ${round(r, 3)} MHz.`,
  };
});
// -- TBPRD pre hore-dole
G(3, "Time-base", "num", () => {
  let fs, d, fp, prd;
  do {
    fs = pick([100, 200]); d = pick([1, 2, 4]); fp = pick([1, 2, 5, 10, 20]);
    prd = (fs * 1e6) / d / (2 * fp * 1000);
  } while (!Number.isInteger(prd) || prd > 65535);
  return {
    text: `Akú hodnotu je potrebné zadať ako periódu do registra TBPRD, aby frekvencia výstupného signálu bola rovná ${fp} kHz? Časová základňa počíta v režime <b>hore-dole</b>. Systémové hodiny sú nastavené na ${fs} MHz a PWM používa deličku signálu rovnú 1/${d}.`,
    answer: prd, alt: [], tol: 0, unit: "",
    expl: `f_TBCLK = ${fs} MHz / ${d} = ${fs / d} MHz. Hore-dole: f_PWM = f_TBCLK / (2·TBPRD) → TBPRD = ${fs / d}·10⁶ / (2·${fp}·10³) = ${fmt(prd)}.`,
  };
});
// -- TBPRD pre hore
G(3, "Time-base", "num", () => {
  let fs, d, fp, prd;
  do {
    fs = pick([100, 200]); d = pick([1, 2, 4]); fp = pick([1, 2, 5, 10, 20, 50]);
    prd = (fs * 1e6) / d / (fp * 1000) - 1;
  } while (!Number.isInteger(prd) || prd > 65535);
  return {
    text: `Akú hodnotu je potrebné zapísať do registra TBPRD, aby mal PWM signál frekvenciu ${fp} kHz? Časová základňa počíta v režime <b>hore</b>. Systémové hodiny sú ${fs} MHz, delička signálu je 1/${d}.`,
    answer: prd, alt: [], tol: 0, unit: "",
    expl: `f_TBCLK = ${fs / d} MHz. Režim hore: f_PWM = f_TBCLK / (TBPRD + 1) → TBPRD = ${fs / d}·10⁶ / (${fp}·10³) − 1 = ${fmt(prd)}.`,
  };
});
// -- f_PWM z TBPRD
G(3, "Time-base", "num", () => {
  const up = Math.random() < 0.5;
  const ft = pick([25, 50, 100]) ; // MHz
  const prd = up ? pick([999, 1999, 4999, 9999]) : pick([500, 1000, 2500, 5000]);
  const f = up ? (ft * 1e6) / (prd + 1) : (ft * 1e6) / (2 * prd);
  return {
    text: `Hodinový signál časovej základne má frekvenciu TBCLK = ${ft} MHz a v TBPRD je hodnota ${fmt(prd)}. Aká bude frekvencia PWM signálu v režime počítania <b>${up ? "hore" : "hore-dole"}</b>? Výsledok uveďte v kHz.`,
    answer: f / 1000, alt: [], tol: 0.005, unit: "kHz",
    expl: up ? `f_PWM = f_TBCLK / (TBPRD + 1) = ${ft}·10⁶ / ${fmt(prd + 1)} = ${round(f / 1000, 3)} kHz.`
             : `f_PWM = f_TBCLK / (2·TBPRD) = ${ft}·10⁶ / ${fmt(2 * prd)} = ${round(f / 1000, 3)} kHz.`,
  };
});
// -- duty
G(3, "Counter-compare", "num", () => {
  const prd = pick([499, 999, 1999, 3999]);
  const p = pick([10, 20, 25, 40, 50, 75]);
  const cmp = ((prd + 1) * p) / 100;
  return {
    text: `Časová základňa ePWM počíta v režime hore, TBPRD = ${fmt(prd)}. Action-qualifier nastaví výstup EPWMxA na log. 1 pri CTR = ZRO a vynuluje ho pri zhode CTR = CMPA (počas počítania hore). Aké bude približné plnenie (duty cycle) v %, ak CMPA = ${fmt(cmp)}?`,
    answer: p, alt: [], tol: 0.6, unit: "%",
    expl: `Duty ≈ CMPA / (TBPRD + 1) = ${fmt(cmp)} / ${fmt(prd + 1)} = ${p} %.`,
  };
});
S(3, "Counter-compare", "Ktoré komparačné registre riadia pomernú dobu zapnutia (duty cycle)?",
  "CMPA a CMPB", ["CMPC a CMPD", "iba CMPD", "TBPRD a TBCTR", "AQCTLA a AQCTLB"],
  "CMPC a CMPD slúžia len pre spúšťanie udalostí.");
S(3, "Counter-compare", "Na čo slúžia komparačné registre CMPC a CMPD?",
  "iba na spúšťanie udalostí", ["na riadenie duty cycle výstupu EPWMxA", "na riadenie duty cycle výstupu EPWMxB", "na nastavenie bezpečnostnej medzery", "na nastavenie periódy časovej základne"]);
S(3, "Counter-compare", "Prečo majú komparačné registre tzv. tieňové registre?",
  "aby sa prepis z tieňového do aktívneho registra uskutočnil len vo vhodný čas a nenarušil sa plynulý chod PWM",
  ["aby sa zvýšilo rozlíšenie PWM na 32 bitov", "aby sa ušetrila pamäť RAM", "aby bolo možné merať teplotu čipu", "aby sa mohlo PWM generovať bez časovej základne"]);
S(3, "Counter-compare", "Čo robí komparačný submodul ePWM?",
  "neustále porovnáva hodnotu čítača časovej základne s komparačnými registrami a pri zhode generuje signál",
  ["delí frekvenciu systémových hodín", "vkladá bezpečnostnú medzeru", "reaguje na signály TZ1–TZ6", "dekóduje signály A a B inkrementálneho snímača"]);
S(3, "Action-qualifier", "Ktorý submodul riadi hodnoty výstupov EPWMxA a EPWMxB na základe udalostí z časovej základne a komparačného submodulu?",
  "Action-qualifier", ["Dead-band", "PWM-chopper", "Trip-zone", "Event-trigger"]);
M(3, "Action-qualifier", "Aké úlohy má submodul Action-qualifier v periférii ePWM? (môže byť správnych viac možností)",
  ["nastaviť správanie sa signálov EPWMxA a EPWMxB", "pri udalosti nastaviť výstup (set / clear / toggle / do nothing)", "nútene (force) nastaviť výstup pomocou force registrov"],
  ["synchronizovať časové základne viacerých PWM modulov", "vytvoriť nosnú frekvenciu PWM", "vyslať signál SOC pre AD prevodník", "vyhodnotiť zhodu časovej základne a komparačného registra", "nastaviť bezpečnostnú medzeru", "vyvolať prerušenie pri zvolenej udalosti", "špecifikovať pomernú dobu zapnutia"]);
M(3, "Action-qualifier", "Ktoré akcie možno pri udalosti nastaviť na výstupe v Action-qualifier?",
  ["set", "clear", "toggle", "do nothing"], ["invert frequency", "hold high-Z", "divide", "sample"]);
M(3, "Action-qualifier", "Na ktorých udalostiach môže závisieť riadenie výstupu v Action-qualifier?",
  ["CTR = PRD", "CTR = ZRO", "CTR = CMPA pri počítaní hore", "CTR = CMPB pri počítaní dole"],
  ["koniec AD konverzie", "zmena smeru snímača QDC", "zápis do registra IER"]);
S(3, "Action-qualifier", "Čo znamená akcia „toggle“ v Action-qualifier?",
  "výstup sa prepne na opačnú úroveň", ["výstup sa nastaví na log. 1", "výstup sa vynuluje", "výstup sa nezmení", "výstup sa prepne do vysokej impedancie"]);

// -- AQ s grafom (inšpirované Moodle testom)
(function () {
  const VAL = ["Do nothing", "Clear (log. 0)", "Set (log. 1)", "Toggle"];
  const variants = [
    [{ f: "U", a: 2 }, { f: "D", a: 1 }],
    [{ f: "U", a: 1 }, { f: "D", a: 2 }],
    [{ f: "ZRO", a: 2 }, { f: "PRD", a: 1 }],
    [{ f: "ZRO", a: 1 }, { f: "PRD", a: 2 }],
  ];
  function svg(events, c, name, cmpName) {
    const W = 460, H = 230, x0 = 70, x1 = 440, yT = 20, yB = 120, uw = (x1 - x0) / 4;
    const X = (t) => x0 + t * uw;
    const Yc = (v) => yB - v * (yB - yT - 10);
    // pozícia udalostí v rámci periódy (jednotky = polperióda)
    const tm = { ZRO: 0, PRD: 1, U: c, D: 2 - c };
    const evs = events.map((e) => ({ ...e, t: tm[e.f] })).sort((a, b) => a.t - b.t);
    const last = evs[evs.length - 1];
    let lvl = last.a === 2 ? 1 : last.a === 1 ? 0 : 0;
    const segs = []; // [x, level]
    for (let p = 0; p < 2; p++) {
      for (const e of evs) {
        const tt = p * 2 + e.t;
        segs.push([tt, lvl]);
        lvl = e.a === 2 ? 1 : e.a === 1 ? 0 : 1 - lvl;
        segs.push([tt, lvl]);
      }
    }
    segs.unshift([0, segs[0][1]]);
    segs.push([4, lvl]);
    const yo = (l) => 200 - l * 40;
    const out = segs.map((s) => `${X(s[0])},${yo(s[1])}`).join(" ");
    const tri = `${X(0)},${Yc(0)} ${X(1)},${Yc(1)} ${X(2)},${Yc(0)} ${X(3)},${Yc(1)} ${X(4)},${Yc(0)}`;
    const lines = evs.map((e, i) =>
      `<line x1="${X(e.t)}" x2="${X(e.t)}" y1="${yT - 8}" y2="205" stroke="#555" stroke-dasharray="3 3"/>` +
      `<text x="${X(e.t) + 3}" y="${yB + 20}" font-size="10" fill="#333" transform="rotate(-90 ${X(e.t) + 3} ${yB + 20})">Event ${events.indexOf(events.find((q) => q.f === e.f)) + 1}</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Priebeh TBCTR a ${name}" font-family="serif">
      <line x1="${x0}" y1="${yB}" x2="${x1 + 6}" y2="${yB}" stroke="#000"/>
      <line x1="${x0}" y1="${yT - 8}" x2="${x0}" y2="${yB}" stroke="#000"/>
      <line x1="${x0}" x2="${x1}" y1="${Yc(1)}" y2="${Yc(1)}" stroke="#1b3df0"/>
      <line x1="${x0}" x2="${x1}" y1="${Yc(c)}" y2="${Yc(c)}" stroke="#1a9a1a"/>
      <text x="4" y="${Yc(1) + 4}" font-size="12" fill="#000">TBPRD</text>
      <text x="4" y="${Yc(c) + 4}" font-size="12" fill="#000">${cmpName}</text>
      <text x="28" y="${yB + 3}" font-size="12" fill="#000">0</text>
      <text x="20" y="14" font-size="12" fill="#000">TBCTR</text>
      <polyline points="${tri}" fill="none" stroke="#000" stroke-width="1.6"/>
      <line x1="${x0}" y1="${yo(0)}" x2="${x1 + 6}" y2="${yo(0)}" stroke="#000"/>
      <line x1="${x0}" y1="${yo(1) - 10}" x2="${x0}" y2="${yo(0)}" stroke="#000"/>
      <text x="4" y="${yo(1) + 4}" font-size="12" fill="#000">${name}</text>
      <text x="22" y="${yo(0) + 4}" font-size="12" fill="#000">0</text>
      <polyline points="${out}" fill="none" stroke="#e11" stroke-width="1.8"/>
      ${lines}</svg>`;
  }
  G(3, "Action-qualifier", "select", () => {
    const useB = Math.random() < 0.5;
    const L = useB ? "B" : "A";
    const n = R(1, 6);
    const v = pick(variants);
    const c = pick([0.3, 0.45, 0.6]);
    const map = (f) => (f === "U" ? "C" + L + "U" : f === "D" ? "C" + L + "D" : f);
    const regOpts = ["AQCTLA", "AQCTLB"];
    const fOpts = ["CAU", "CAD", "CBU", "CBD", "PRD", "ZRO"];
    const vOpts = ["0", "1", "2", "3"];
    const blanks = [];
    let code = "";
    v.forEach((e, i) => {
      blanks.push({ opts: regOpts, ans: "AQCTL" + L });
      blanks.push({ opts: fOpts, ans: map(e.f) });
      blanks.push({ opts: vOpts, ans: String(e.a) });
      code += `EPwm${n}Regs.{{${i * 3}}}.bit.{{${i * 3 + 1}}} = {{${i * 3 + 2}}}; // Event ${i + 1}\n`;
    });
    const aqt = `<table><tr><th>Hodnota</th><th>Akcia</th></tr>${VAL.map((x, i) => `<tr><td>${i}</td><td>${x}</td></tr>`).join("")}</table>
      <span class="small">CAU/CAD – zhoda s CMPA pri počítaní hore/dole, CBU/CBD – zhoda s CMPB hore/dole, PRD – CTR = TBPRD, ZRO – CTR = 0. Pozor na poradie udalostí v čase (Event 1 nastane skôr).</span>`;
    return {
      text: `Ako je potrebné nastaviť PWM (režim počítania <b>hore-dole</b>), aby výstup EPWM${n}${L} vyzeral ako na obrázku? Doplňte.<pre>${code}</pre>` +
        svg(v, c, `EPWM${n}${L}`, "CMP" + L) + aqt,
      blanks,
      expl: v.map((e, i) => `Event ${i + 1}: AQCTL${L}.${map(e.f)} = ${e.a} (${VAL[e.a]})`).join("; ") +
        ". Význam: 0 = nič, 1 = clear, 2 = set, 3 = toggle.",
    };
  });
})();

S(3, "Dead-band", "Čo dokáže generovať submodul Dead-band?",
  "komplementárne signály na základe jedného signálu EPWMxA s vloženou bezpečnostnou medzerou", ["nosnú frekvenciu PWM", "prerušenie od časovej základne", "synchronizačný signál EPWMxSYNC", "reakciu na chybu TZ1"]);
S(3, "Dead-band", "Aký je rozsah (počet bitov) Dead-band submodulu v TMS320F2837xD?", "14 bitov", ["8 bitov", "10 bitov", "16 bitov", "32 bitov"]);
TF(3, "Dead-band", "Dead-band submodul môže byť úplne vynechaný – signály EPWMxA a EPWMxB prejdú bez zmeny.", true);
S(3, "Dead-band", "S akou periódou môže pracovať Dead-band s vysokým rozlíšením?", "TBCLK/2", ["TBCLK·2", "SYSCLK/128", "TBCLK/14", "TBPRD"]);
S(3, "Dead-band", "Prečo sa do komplementárnych signálov pre polmostík vkladá bezpečnostná medzera?",
  "aby nedošlo k súčasnému vedeniu oboch tranzistorov (skrat v polmostíku)", ["aby sa zvýšila frekvencia PWM", "aby sa znížila rozlíšenie ADC", "aby sa synchronizovali časové základne", "aby sa vynuloval watchdog"]);

/* =====================================================================
   PREDNÁŠKA 4 – PWM chopper, Trip-zone, Event-trigger
   ===================================================================== */
S(4, "PWM chopper", "Na čo slúži PWM chopper?",
  "moduluje výstup vysokofrekvenčným nosným signálom (napr. pri riadení tranzistorov cez impulzové transformátory)",
  ["generuje bezpečnostnú medzeru", "synchronizuje časové základne", "vyhodnocuje chybové stavy hardvéru", "spúšťa AD prevod"]);
M(4, "PWM chopper", "Čo je možné v module PWM chopper nastaviť?",
  ["nosnú („chopping“) frekvenciu", "šírku prvého impulzu", "šírku ostatných impulzov"], ["bezpečnostnú medzeru v 14 bitoch", "mapovanie na PIE", "počet konverzií v burst móde"]);
S(4, "PWM chopper", "Pri prenose riadiacich signálov pre tranzistory cez čo sa používa PWM chopper?",
  "impulzové transformátory", ["optické vlákna", "SPI zbernicu", "kryštálový oscilátor", "DMA radič"]);
T(4, "Trip-zone", "Ktorý submodul umožňuje PWM modulu reagovať na chybové stavy riadeného hardvéru (napr. nadprúd)? (anglický názov)", ["trip-zone", "tripzone", "trip zone", "tz"]);
P(4, "Trip-zone", "Priraďte signál trip-zone k jeho zdroju.", [
  ["TZ1 – TZ3", "signály na digitálnom vstupe z externého snímača/zariadenia"],
  ["TZ4", "chyba vyhodnotenia snímača z modulu eQEP"],
  ["TZ5", "chyba systémových hodín CPU"],
  ["TZ6", "zastavenie programu počas emulácie"],
]);
M(4, "Trip-zone", "Ako môže submodul Trip-zone zareagovať na chybový stav na výstupoch EPWMxA a EPWMxB?",
  ["nastaviť výstup na vysokú úroveň", "nastaviť výstup na nízku úroveň", "nastaviť výstup do vysokej impedancie", "žiadna reakcia"],
  ["znížiť frekvenciu PWM na polovicu", "prepnúť na iný PWM modul", "vynulovať CPU"]);
S(4, "Trip-zone", "Pre aký typ chyby sa používa one-shot reakcia trip-zone?",
  "skrat alebo nadprúd (chyba sa musí resetovať manuálne)", ["obmedzenie prúdu v každej perióde", "zmenu smeru otáčania", "pretečenie AD prevodníka", "synchronizáciu PWM modulov"]);
S(4, "Trip-zone", "Pre čo sa používa cycle-by-cycle (CBC) reakcia trip-zone?",
  "pri obmedzovaní prúdu – akcia sa automaticky resetuje v každej perióde PWM, ak chybový signál už nie je prítomný",
  ["pri skrate – vyžaduje manuálny reset", "pri kalibrácii ADC", "na spúšťanie SOC", "pri synchronizácii TBCLK"]);
TF(4, "Trip-zone", "Pri one-shot reakcii trip-zone je potrebné chybu resetovať manuálne.", true);
TF(4, "Trip-zone", "Pri cycle-by-cycle reakcii trip-zone je potrebné chybu resetovať manuálne.", false,
  "CBC sa resetuje automaticky v každej perióde PWM, ak chybový signál nie je prítomný.");
T(4, "Trip-zone", "Ako sa nazýva reakcia trip-zone, ktorá sa automaticky resetuje v každej perióde PWM? (skratka alebo anglický názov)", ["cbc", "cycle-by-cycle", "cyclebycycle", "cycle by cycle"]);
M(4, "Trip-zone", "Čo podporuje submodul Trip-zone?",
  ["jednorázovú (one-shot) akciu", "opakovanú cycle-by-cycle reakciu", "vyvolanie prerušenia", "softvérové vyvolanie chybového stavu pre testovanie"],
  ["generovanie nosnej frekvencie", "meranie času medzi impulzmi", "reálnu kalibráciu ADC"]);
M(4, "Event-trigger", "Čo umožňuje submodul Event-trigger?",
  ["vyvolať prerušenie od časovej základne / komparačného / digital compare submodulu", "spúšťať AD prevodník signálmi SOCx", "softvérovo vyvolať prerušenie či spustenie AD prevodu (forcing)"],
  ["vložiť bezpečnostnú medzeru medzi signály", "reagovať na signály TZ1–TZ6 nastavením výstupov", "modulovať výstup nosným signálom"]);
S(4, "Event-trigger", "Čo znamená skratka SOC v signáloch SOCx submodulu Event-trigger?",
  "Start of Conversion", ["System On Chip", "State of Control", "Stop of Counter", "Source of Clock"]);
S(4, "Event-trigger", "Aká delička sa nachádza v submodule Event-trigger pre vyvolanie udalostí?",
  "4-bitová (pre kompatibilitu je možné zvoliť aj 2-bitovú)", ["16-bitová", "14-bitová", "iba 1-bitová", "žiadna"]);
S(4, "Event-trigger", "Ktorý submodul ePWM spúšťa AD prevodník?", "Event-trigger", ["Dead-band", "Time-base", "PWM-chopper", "Trip-zone"]);

/* =====================================================================
   PREDNÁŠKA 5 – AD prevodník
   ===================================================================== */
S(5, "ADC", "Čo dokáže AD prevodník previesť do digitálnej podoby?",
  "iba napätie (iné veličiny sa musia najprv previesť na napätie)", ["priamo prúd, teplotu aj tlak bez úpravy", "iba frekvenciu", "iba digitálne signály", "iba signály s napätím väčším ako 5 V"]);
S(5, "ADC", "Čo znamená, že ide o SAR typ AD prevodníka?",
  "navzorkovaný signál sa postupne porovnáva s napätím generovaným interným DA prevodníkom (successive approximation)",
  ["signál sa prevádza integrovaním na kondenzátore", "signál sa delí rezistorovým deličom na 4096 častí a porovnáva naraz", "výsledok sa získava priamym čítaním z časovača", "prevod prebieha pomocou PWM"]);
S(5, "ADC", "Čo robí Sample & Hold (S/H) jednotka?",
  "pri požiadavke na konverziu „uloží“ vstupný signál do kondenzátora na vstupe AD prevodníka", ["zosilňuje signál na 5 V", "mení polaritu vstupu", "deliť frekvenciu hodín", "kalibruje offset po výrobe"]);
N(5, "ADC", "Aká je maximálna frekvencia hodín AD prevodníka v TMS320F28379D? Výsledok uveďte v MHz.", 50, 0, "MHz");
S(5, "ADC", "Koľko AD prevodníkov má TMS320F28379D?", "až 4", ["až 2", "až 8", "až 12", "iba 1"]);
P(5, "ADC", "Priraďte režim AD prevodníka k jeho parametrom.", [
  ["single-ended", "rozlíšenie 12 bitov, 3,5 MSPS na modul"],
  ["diferenciálny", "rozlíšenie 16 bitov, 1,1 MSPS na modul"],
  ["maximálny počet kanálov", "24 single-ended alebo 12 diferenciálnych"],
  ["max. frekvencia hodín ADC", "50 MHz"],
]);
S(5, "ADC", "Koľko kanálov možno navzorkovať súčasne vďaka S/H jednotkám v TMS320F28379D?",
  "až 4 (každý AD prevodník má 1 S/H jednotku)", ["až 24", "až 16", "iba 1", "až 12"]);
TF(5, "ADC", "Referenčné napätie AD prevodníka v TMS320F2837xD je externé a musí byť privedené na piny mikrokontroléra.", true);
TF(5, "ADC", "Referenčné napätie AD prevodníka zvyčajne môže prekročiť napájacie napätie mikrokontroléra.", false);
S(5, "ADC", "Čo ovplyvňuje voľba napäťovej referencie AD prevodníka?",
  "rozsah AD prevodníka aj jeho presnosť", ["iba rýchlosť prevodu", "iba počet kanálov", "iba frekvenciu hodín CPU", "nič, je vždy interná"]);
// výsledky
G(5, "ADC", "num", () => {
  const vh = pick([3.0, 3.3]);
  const vin = pick([0.3, 0.75, 1.0, 1.5, 1.65, 2.0, 2.4]);
  const r = Math.min(4095, Math.round((4096 * vin) / vh));
  return {
    text: `AD prevodník pracuje v 12-bitovom single-ended režime, VREFLO = 0 V, VREFHI = ${vh.toString().replace(".", ",")} V. Aký bude výsledok prevodu (ADCRESULT) pre vstupné napätie ${vin.toString().replace(".", ",")} V? Zaokrúhlite na celé číslo.`,
    answer: r, alt: [], tol: 1, unit: "",
    expl: `ADCRESULT = 4096·(ADCIN − VREFLO)/(VREFHI − VREFLO) = 4096·${vin}/${vh} ≈ ${r}. Pri vstupe ≥ VREFHI je výsledok 4095.`,
  };
});
G(5, "ADC", "num", () => {
  const r = pick([512, 1024, 2048, 3072, 1536]);
  const v = (r / 4096) * 3;
  return {
    text: `AD prevodník (12-bitový single-ended režim, VREFLO = 0 V, VREFHI = 3 V) vrátil výsledok ADCRESULT = ${r}. Aké napätie bolo na vstupe? Výsledok uveďte vo voltoch.`,
    answer: v, alt: [], tol: 0.01, unit: "V",
    expl: `ADCIN = ADCRESULT · (VREFHI − VREFLO) / 4096 = ${r}·3/4096 = ${round(v, 3)} V.`,
  };
});
G(5, "ADC", "num", () => {
  const d = pick([-1.5, -0.75, 0, 0.75, 1.5]);
  const r = (4096 * (d + 3)) / 6;
  return {
    text: `AD prevodník pracuje v 12-bitovom <b>diferenciálnom</b> režime, VREFLO = 0 V, VREFHI = 3 V. Aký bude ADCRESULT, ak ADCINyP − ADCINyN = ${String(d).replace(".", ",")} V?`,
    answer: r, alt: [], tol: 1, unit: "",
    expl: `ADCRESULT = 4096·(ADCINyP − ADCINyN + VREFHI − VREFLO) / (2·(VREFHI − VREFLO)) = 4096·(${d} + 3)/6 = ${r}.`,
  };
});
S(5, "ADC", "Aký je výsledok 12-bitového prevodu (single-ended), ak je vstupné napätie väčšie alebo rovné VREFHI?", "4095", ["4096", "0", "2048", "65535"]);
S(5, "ADC", "Aký je výsledok 16-bitového diferenciálneho prevodu, ak ADCINyP − ADCINyN ≥ (VREFHI − VREFLO)?", "65535", ["4095", "65536", "32768", "0"]);
TF(5, "ADC", "V 16-bitovom režime pracuje AD prevodník v TMS320F2837xD len v diferenciálnom režime (single-ended je neplatný).", true);
S(5, "SOC", "Koľko SOC blokov (start-of-conversion) má každý AD prevodník v TMS320F2837xD?", "16 (SOC0–SOC15)", ["4", "8", "12", "24"]);
P(5, "SOC", "Priraďte nastavenie bloku SOC k jeho významu.", [
  ["ADCSOCyCTL.bit.CHSEL", "ktorý kanál sa bude snímať"],
  ["ADCSOCyCTL.bit.ACQPS", "veľkosť vzorkovacieho okna"],
  ["ADCSOCyCTL.bit.TRIGSEL", "udalosť, ktorá spustí prevod"],
  ["ADCRESULTx", "výsledkový register bloku SOCx"],
]);
T(5, "SOC", "Ktorý bit (pole) registra ADCSOCyCTL určuje veľkosť vzorkovacieho okna? (názov poľa)", ["ACQPS"]);
T(5, "SOC", "Ktorý bit (pole) registra ADCSOCyCTL určuje udalosť, ktorá spustí prevod? (názov poľa)", ["TRIGSEL"]);
T(5, "SOC", "Ktorý bit (pole) registra ADCSOCyCTL vyberá snímaný kanál? (názov poľa)", ["CHSEL"]);
S(5, "SOC", "Ako sa vykonajú viaceré SOC bloky spustené jednou udalosťou?",
  "postupne podľa kruhovej priority", ["súčasne všetky naraz", "náhodne", "vždy len SOC0", "podľa abecedy názvov kanálov"]);
M(5, "SOC", "Ktoré udalosti môžu spustiť AD prevod (SOCx)?",
  ["software", "časovače CPU Timers", "GPIO", "signály ADCSOCA / ADCSOCB z PWM modulov"],
  ["zmena smeru otáčania snímača (QDC)", "signál TZ1 ako priamy trigger", "volanie funkcie Device_cal()"],
  "Každé SOC môže byť navyše spustené aj príznakom ADCINT1 alebo ADCINT2 (kontinuálny režim).");
S(5, "SOC", "Ako sa dá vytvoriť kontinuálny režim prevodov podľa prednášky?",
  "spustením SOC príznakom prerušenia ADCINT1 alebo ADCINT2", ["zakázaním S/H jednotky", "nastavením HSPCLKDIV na 14", "zápisom do registra IER", "nie je to možné"]);
S(5, "ADC", "Od čoho závisí veľkosť vzorkovacieho okna?",
  "od vstupnej impedancie signálu (ako rýchlo nabije vzorkovací kondenzátor v S/H)", ["od teploty okolia", "od dĺžky programu", "od počtu SOC blokov", "od frekvencie PWM"]);
TF(5, "ADC", "Pri vysokej impedancii na vstupe sa vzorkovací kondenzátor nabíja pomalšie, preto je vhodné nastaviť dlhšie vzorkovacie okno.", true);
TF(5, "ADC", "Veľké vzorkovacie okno je výhodné pri vstupnom signáli s vysokou frekvenciou.", false, "Pri vysokej frekvencii signálu spôsobí veľké okno skreslený výsledok.");
N(5, "ADC", "Aká je minimálna veľkosť vzorkovacieho okna pre TMS320F2837xD podľa katalógu? Výsledok uveďte v ns.", 75, 0, "ns");
S(5, "Burst mode", "Čo umožňuje „burst“ mód AD prevodníka?",
  "jednej udalosti spustiť postupne viacero SOC v rámci kruhovej priority", ["súčasný prevod všetkých kanálov bez S/H", "zvýšenie rozlíšenia na 32 bitov", "vypnutie kruhovej priority", "automatickú kalibráciu"]);
M(5, "Burst mode", "Čo platí pre burst mód AD prevodníka?",
  ["počet konverzií v burst móde je nastaviteľný", "ignoruje sa nastavenie spúšte prevodu okrem SOC s vysokou prioritou", "SOC, ktorým sa konverzie začnú, je daný poslednou polohou ukazovateľa v kruhu"],
  ["vždy sa prevádza práve 1 kanál", "burst mód vyžaduje 16-bitový režim", "burst mód funguje len bez prerušení"]);
S(5, "ADC prerušenia", "Čo znamená signál EOC vysielaný SOC blokom?", "end of conversion – môže vyvolať prerušenie", ["end of clock", "enable output control", "error on channel", "edge of counter"]);
S(5, "ADC prerušenia", "Kedy môže byť vyslaný signál EOC?", "po navzorkovaní napätia alebo po celej konverzii", ["iba po celej konverzii", "iba po navzorkovaní", "iba po resete", "iba pri chybe"]);
S(5, "ADC prerušenia", "Koľko nastaviteľných prerušení má každý AD prevodník?", "4 (INT1 až INT4)", ["1", "2", "8", "16"]);
T(5, "ADC prerušenia", "Ktorý register slúži na nastavenie prerušení INT3 a INT4 AD prevodníka?", ["ADCINTSEL3N4"]);
T(5, "ADC prerušenia", "Ktorý register slúži na nastavenie prerušení INT1 a INT2 AD prevodníka?", ["ADCINTSEL1N2"]);
O(5, "Zapnutie ADC", "Zoraďte postup zapnutia AD prevodníka.",
  ["Zapnúť hodiny do zvoleného AD prevodníka", "Nastaviť deličky hodín", "Nastaviť bit ADCPWDNZ do log. 1", "Počkať aspoň 500 µs pred prvou konverziou"]);
T(5, "Zapnutie ADC", "Ktorým bitom registra ADCCTL1 sa AD prevodník zapína? (názov bitu)", ["ADCPWDNZ"]);
N(5, "Zapnutie ADC", "Aspoň ako dlho je potrebné čakať po zapnutí AD prevodníka pred prvou konverziou? Výsledok uveďte v µs.", 500, 0, "µs");
S(5, "Kalibrácia", "Čo sa kalibruje v AD prevodníku počas výrobného procesu?",
  "zisk, offset a linearita", ["iba frekvencia hodín", "iba referencia VREFHI", "iba rozlíšenie", "iba vzorkovacie okno"]);
S(5, "Kalibrácia", "Kde sú uložené kalibračné hodnoty AD prevodníka?", "v OTP pamäti", ["v RAM", "v registri IER", "v tieňových registroch PWM", "v pamäti Flash používateľa"]);
S(5, "Kalibrácia", "Ktorou funkciou sa načítajú kalibračné hodnoty (napr. pri debugovaní, ak nebežala bootovacia sekvencia)?", "Device_cal()", ["InitAdc()", "EALLOW()", "DINT()", "InitPieCtrl()"]);

/* =====================================================================
   PREDNÁŠKA 6 – inkrementálne snímače a eQEP
   ===================================================================== */
S(6, "Snímače", "Aký typ informácie podáva inkrementálny snímač polohy?",
  "relatívnu polohu (prírastok polohy – inkrementy)", ["absolútnu polohu pri zapnutí", "iba rýchlosť", "iba smer otáčania", "teplotu hriadeľa"]);
M(6, "Snímače", "Čo platí o inkrementálnom snímači polohy?",
  ["inkrementy sú periodický signál", "signál môže mať obdĺžnikový alebo sínusový tvar", "obdĺžnikový signál (po úprave úrovne) spracuje čítač mikrokontroléra"],
  ["sínusový signál sa spracuje priamo čítačom bez úpravy", "podáva vždy absolútnu polohu", "nevyžaduje kontrolu napäťových úrovní"]);
P(6, "Snímače", "Priraďte typ logiky snímača k jej napäťovej úrovni.", [
  ["CMOS", "3,3 V"], ["TTL", "5 V"], ["HTL", "15 V (alebo 24 V)"], ["sin/cos", "1 Vpp (peak-to-peak)"],
]);
S(6, "Snímače", "Čo je potrebné spraviť pred pripojením snímača k mikrokontroléru?",
  "skontrolovať a prípadne upraviť napäťovú úroveň signálov (napr. odporovým deličom)", ["nič, všetky snímače pracujú s 3,3 V", "zapnúť PWM chopper", "povoliť prerušenie ADC", "zvýšiť napájanie MCU na 5 V"]);
S(6, "Snímače", "Čo vyjadruje údaj PPR (pulses per revolution)?",
  "počet impulzov na jednu stopu na jednu otáčku snímača", ["počet inkrementov pri počítaní všetkých hrán oboch stôp", "počet otáčok za sekundu", "počet pulzov za sekundu", "počet bitov rozlíšenia ADC"]);
S(6, "Snímače", "Čo vyjadruje údaj CPR (counts per revolution)?",
  "počet inkrementov na otáčku, ak sa počíta každá hrana oboch signálov", ["počet impulzov na jednu stopu na otáčku", "počet vzoriek za periódu", "počet kanálov snímača", "počet impulzov za sekundu"]);
TF(6, "Snímače", "Ak sa rozlíšenie snímača udáva v počte bitov, spravidla sa myslí údaj CPR.", true);
G(6, "Snímače", "num", () => {
  const ppr = pick([100, 250, 500, 1000, 1024, 2500]);
  return {
    text: `Snímač má rozlíšenie ${fmt(ppr)} PPR. Koľko je jeho CPR, ak sa počíta každá hrana oboch signálov A a B?`,
    answer: 4 * ppr, alt: [], tol: 0, unit: "",
    expl: `CPR = 4 · PPR = 4 · ${fmt(ppr)} = ${fmt(4 * ppr)} (kvadratúrne dekódovanie: 2 hrany × 2 stopy).`,
  };
});
S(6, "Vyhodnotenie polohy", "Ako sa mení hodnota čítača pri kladnom a zápornom smere otáčania?",
  "pri kladnom smere sa impulzy pripočítavajú, pri zápornom odpočítavajú", ["opačne", "vždy sa len pripočítavajú", "vždy sa len odpočítavajú", "čítač sa pri zmene smeru vynuluje"]);
S(6, "Vyhodnotenie polohy", "Ako sa nazýva nulovanie čítača (polohy) pri zvolenej udalosti?", "homing", ["tracking", "capture", "watchdog", "strobing"]);
S(6, "Vyhodnotenie polohy", "Čo je aktívny homing?",
  "pohon sa hýbe, kým nenarazí na vybraný snímač, ktorým sa vynuluje poloha", ["poloha sa vynuluje softvérom", "poloha sa vynuluje pri resete MCU", "poloha sa vynuluje po 1 s", "poloha sa nikdy nenuluje"]);
S(6, "Vyhodnotenie polohy", "Čo je priamy homing?", "poloha sa vynuluje na základe softvéru", ["pohon sa hýbe, kým nenarazí na snímač", "vynulovanie signálom STROBE z externého zariadenia", "vynulovanie po pretečení watchdogu", "vynulovanie po zmene smeru"]);
G(6, "Vyhodnotenie polohy", "num", () => {
  const N_ = pick([1000, 2000, 4000, 4096]);
  const X = pick([N_ / 8, N_ / 4, N_ / 2, (3 * N_) / 4, N_]);
  const phi = (2 * Math.PI * X) / N_;
  return {
    text: `Rozlíšenie snímača je ${fmt(N_)} inkrementov na otáčku (CPR). Čítač napočítal X = ${fmt(X)} inkrementov. Aká je relatívna poloha φ v radiánoch? Výsledok zaokrúhlite na dve desatinné miesta.`,
    answer: phi, alt: [], tol: 0.011, unit: "rad",
    expl: `φ = 2π·X/N = 2π·${fmt(X)}/${fmt(N_)} = ${round(phi, 3)} rad.`,
  };
});
G(6, "Vyhodnotenie polohy", "num", () => {
  const ppr = pick([500, 1000, 1250]);
  const rot = pick([0.25, 0.5, 1]);
  const X = 4 * ppr * rot;
  const phi = 2 * Math.PI * rot;
  return {
    text: `Snímač má ${fmt(ppr)} PPR a eQEP počíta všetky hrany oboch stôp (kvadratúrny mód). Čítač napočítal X = ${fmt(X)} inkrementov. Aká je relatívna poloha φ v radiánoch? Výsledok zaokrúhlite na dve desatinné miesta. (Pozor na to, ako je udané rozlíšenie snímača!)`,
    answer: phi, alt: [], tol: 0.011, unit: "rad",
    expl: `N = CPR = 4·PPR = ${fmt(4 * ppr)}; φ = 2π·X/N = 2π·${fmt(X)}/${fmt(4 * ppr)} = ${round(phi, 3)} rad.`,
  };
});
S(6, "Rýchlosť", "Ktorá metóda sa používa na určenie rýchlosti pri vyšších otáčkach?",
  "prírastok impulzov za čas (ΔX/Ts)", ["meranie času medzi impulzmi", "meranie napätia snímača", "výpočet z hodnoty QPOSINIT", "iba priemerovanie polohy"]);
S(6, "Rýchlosť", "Ktorá metóda sa používa na určenie rýchlosti pri nižších otáčkach?",
  "meranie času medzi impulzmi (pre stanovený počet pulzov)", ["prírastok impulzov za pevný čas Ts", "vždy rovnaká ako pri vyšších otáčkach", "nie je možné ich merať", "meranie frekvencie PWM"]);
TF(6, "Rýchlosť", "Metóda v = ΔX/Ts má pri nízkych rýchlostiach nízku presnosť vypočítanej rýchlosti.", true);
TF(6, "Rýchlosť", "Zmena smeru medzi dvoma vzorkami sa môže považovať za nulovú rýchlosť.", true);
G(6, "Rýchlosť", "num", () => {
  const Ts = pick([1, 2, 5, 10]), x1 = R(1000, 3000), dx = R(5, 80);
  return {
    text: `Čítač polohy mal v dvoch po sebe idúcich vzorkách hodnoty X1 = ${fmt(x1)} a X2 = ${fmt(x1 + dx)} inkrementov. Perióda vzorkovania je Ts = ${Ts} ms. Aká je rýchlosť v počte impulzov za sekundu?`,
    answer: (dx / Ts) * 1000, alt: [], tol: 0.5, unit: "pulz/s",
    expl: `v = (X2 − X1)/Ts = ${dx}/${Ts / 1000} = ${fmt((dx / Ts) * 1000)} pulz/s.`,
  };
});
G(6, "Rýchlosť", "num", () => {
  const posmax = pick([3999, 4000, 9999, 10000]);
  const Ts = pick([1, 2, 5]);
  const x3 = posmax - R(10, 80), step = R(20, 90);
  const x4 = step - (posmax - x3);
  return {
    text: `Poloha sa vyhodnocuje čítačom, ktorý po dosiahnutí POSMAX = ${fmt(posmax)} pretečie na 0. Kladná rýchlosť; vzorky: X3 = ${fmt(x3)}, X4 = ${fmt(x4)}, Ts = ${Ts} ms. Aká je rýchlosť v impulzoch za sekundu? (Vzorec: v = (X4 − X3 + POSMAX)/Ts)`,
    answer: ((x4 - x3 + posmax) / Ts) * 1000, alt: [], tol: 0.5, unit: "pulz/s",
    expl: `v = (X4 − X3 + POSMAX)/Ts = (${fmt(x4)} − ${fmt(x3)} + ${fmt(posmax)})/${Ts / 1000} = ${fmt(((x4 - x3 + posmax) / Ts) * 1000)} pulz/s.`,
  };
});
G(6, "Kvantifikačná chyba", "num", () => {
  const ppr = pick([100, 200, 500, 1000]), X = pick([1, 2, 3]), Ts = pick([1, 2, 5]);
  const n = (X / (Ts / 1000) / (4 * ppr)) * 60;
  return {
    text: `Doba vzorkovania je Ts = ${Ts} ms a rozlíšenie snímača ${ppr} ppr. Počas jednej doby vzorkovania čítač napočíta ${X} ${X === 1 ? "impulz" : X < 5 ? "impulzy" : "impulzov"}. Aká bude vypočítaná rýchlosť v otáčkach za minútu? (n = v/(4N)·60)`,
    answer: n, alt: [], tol: Math.max(0.5, n * 0.005), unit: "rpm",
    expl: `v = X/Ts = ${X}/${Ts / 1000} = ${fmt(X / (Ts / 1000))} pulz/s; n = v/(4·${ppr})·60 = ${round(n, 2)} rpm.`,
  };
});
S(6, "Kvantifikačná chyba", "Čo je kvantifikačná chyba?",
  "chyba spôsobená digitalizáciou (vzorkovaním) – napr. k čítaču nie je možné pripočítať 1,3 impulzu", ["chyba spôsobená výpadkom napájania", "chyba spôsobená nesprávnym zapojením snímača", "chyba pretečenia 32-bitového čítača", "chyba vznikajúca iba pri analógových veličinách"]);
M(6, "Kvantifikačná chyba", "Kde sa kvantifikačná chyba vyskytuje?",
  ["AD prevody", "nastavenie frekvencie PWM", "nastavenie časovača", "meranie času ručičkovými hodinkami"],
  ["iba v analógových obvodoch bez digitalizácie", "iba pri sériovej komunikácii", "iba pri GPIO výstupoch"]);
M(6, "Kvantifikačná chyba", "Čo možno urobiť na zmenšenie vplyvu kvantifikačnej chyby pri určovaní rýchlosti?",
  ["použiť filter (napr. 1. rádu)", "zväčšiť Ts", "použiť snímač s vyšším rozlíšením", "kombinovať metódy výpočtu pre vyššie a nižšie rýchlosti"],
  ["zmenšiť rozlíšenie snímača", "znížiť frekvenciu hodín CPU", "vypnúť čítač pri zmene smeru"]);
S(6, "Kvantifikačná chyba", "Pri skutočnej rýchlosti 225 rpm snímač (Ts = 1 ms, 100 ppr) hlási striedavo 150 a 300 rpm. Čo je príčinou?",
  "kvantifikačná chyba – počet impulzov za Ts je len celé číslo (1 alebo 2)", ["porucha snímača", "pretečenie čítača", "chyba referencie ADC", "chyba dead-band"]);
S(6, "eQEP", "Čo znamená skratka eQEP?", "Enhanced Quadrature Encoder Pulse", ["Enhanced Quick Event Processor", "Embedded Queue Event Pipeline", "Extended Quadrature Error Protection", "Enable Quadrature Edge Pulse"]);
S(6, "eQEP", "Koľko modulov eQEP má TMS320F28379D?", "3", ["1", "2", "4", "12"]);
P(6, "eQEP", "Priraďte vstup modulu eQEP k jeho významu.", [
  ["QEPxA", "stopa A"], ["QEPxB", "stopa B"], ["QEPxI", "nulová značka (index)"], ["QEPxS", "strobe značka"],
]);
TF(6, "eQEP", "Každý vstup modulu eQEP môže byť invertovaný (osobitne).", true);
S(6, "eQEP", "Ktorý submodul eQEP prevádza vstupné signály na impulzy a informáciu o smere otáčania pre 32-bitový čítač?",
  "Quadrature decoder unit", ["Capture unit (QCAP)", "QEP watchdog", "Position counter and control unit", "Dead-band unit"]);
M(6, "eQEP", "Ktoré módy má Quadrature decoder unit?",
  ["kvadratúrny mód (štandardný)", "počítanie podľa smeru", "počítanie smerom hore", "počítanie smerom dole"],
  ["počítanie pomocou ADC", "mód PWM chopper", "burst mód"]);
S(6, "eQEP", "V kvadratúrnom móde eQEP sa smer otáčania určuje…",
  "automaticky na základe impulzov stôp A a B; smer je uložený v príznakoch QDIR a QDF", ["zo stavu GPIO0", "z nulovej značky", "podľa hodnoty QPOSMAX", "ručne zápisom do čítača"]);
S(6, "eQEP", "V móde „počítanie podľa smeru“ (direction count) sa…",
  "na QEPxA počítajú nábežné hrany a smer určuje log. úroveň na QEPxB", ["smer určuje nulová značka", "počítajú obe stopy ako v kvadratúrnom móde", "počíta sa iba na QEPxS", "smer určuje QPOSINIT"]);
S(6, "eQEP", "Akú šírku má čítač polohy v module eQEP (Position counter and control unit)?", "32 bitov", ["8 bitov", "16 bitov", "12 bitov", "64 bitov"]);
M(6, "eQEP", "Kedy sa môže čítač polohy resetovať?",
  ["pri každom zachytení nulovej značky", "pri prvom zachytení nulovej značky", "pri dosiahnutí maximálnej polohy (QPOSMAX)", "po uplynutí stanoveného času"],
  ["pri každom čítaní registra QFLG", "pri zmene frekvencie PWM", "pri zapnutí AD prevodníka"]);
T(6, "eQEP", "Ako sa volá register, ktorý určuje maximálnu polohu čítača eQEP? (názov registra)", ["QPOSMAX"]);
T(6, "eQEP", "Z ktorého registra sa do čítača polohy skopíruje inicializačná hodnota? (názov registra)", ["QPOSINIT"]);
M(6, "eQEP", "Kedy môže nastať inicializácia čítača polohy hodnotou z QPOSINIT?",
  ["pri zachytení nulovej značky", "pri externom signáli", "softvérovo nastavením bitu SWI"], ["pri každom prerušení ADC", "pri zmene deličky CLKDIV", "pri signáli TZ5"]);
S(6, "eQEP", "Na čo slúži Capture unit (QCAP) v module eQEP?",
  "na meranie času medzi impulzmi pri vyhodnocovaní rýchlosti", ["na dekódovanie smeru otáčania", "na zálohu polohy do Flash", "na generovanie PWM", "na kalibráciu snímača"]);
S(6, "eQEP", "Aké časovač a deličku obsahuje Capture unit?", "16-bitový časovač a 3-bitovú deličku", ["32-bitový časovač a 16-bitovú deličku", "8-bitový časovač a 2-bitovú deličku", "12-bitový časovač a 4-bitovú deličku", "iba deličku"]);
N(6, "eQEP", "Až medzi koľkými impulzmi dokáže Capture unit merať uplynutý čas?", 2048, 0, "impulzov", "Capture unit meria čas medzi dvoma až 2048 impulzmi.");
S(6, "eQEP", "Čo sleduje QEP watchdog?",
  "či zo snímača prichádzajú impulzy – časovač sa resetuje každým impulzom, pri pretečení sa nastaví príznak prerušenia", ["teplotu čipu", "napätie referencie ADC", "chybu systémových hodín", "stav trip-zone"]);
S(6, "eQEP", "Koľko zdrojov prerušenia má modul QEP?", "11", ["3", "4", "8", "16"]);
P(6, "eQEP", "Priraďte príznak eQEP k jeho významu.", [
  ["QFLG.bit.QDC", "zmena smeru"], ["QFLG.bit.PCO", "pretečenie čítača"], ["QFLG.bit.PCU", "podtečenie čítača"], ["QFLG.bit.INT", "globálny príznak prerušenia"],
]);
O(6, "eQEP", "Zoraďte kroky po obsluhe prerušenia eQEP.",
  ["Vyčistiť príznak, ktorý vyvolal prerušenie (napr. PCO)", "Vyčistiť globálny príznak QEP pre prerušenie (INT)", "Vyčistiť príznak na úrovni PIE"]);
