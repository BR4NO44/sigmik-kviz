/* Banka otázok – Signálové mikrokontroléry, prednášky 2–6 (TMS320F2837xD)
   Každá definícia: {lec, topic, type, make()} – make() vráti novú inštanciu otázky
   (parametrické otázky majú pri každom generovaní iné čísla). */
"use strict";

const LECTURES = {
  1: "Úvod, štandardy v C, mikrokontrolér, registre, hodiny, GPIO",
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
   PREDNÁŠKA 1 – o predmete, štandardy v C, mikrokontrolér, registre, hodiny, GPIO
   ===================================================================== */
S(1, "Organizácia", "Koľko bodov je potrebných spolu na získanie zápočtu?", "aspoň 21", ["aspoň 10", "aspoň 15", "aspoň 30", "aspoň 40"],
  "Zápočet: 2× test Moodle (max. 30 b.) + zadanie (max. 10 b.); potrebných je spolu aspoň 21 bodov.");
S(1, "Organizácia", "Aký je maximálny počet bodov z dvoch zápočtových testov Moodle?", "30", ["10", "15", "45", "60"],
  "2× test Moodle spolu max. 30 bodov (v 6. a 11. týždni semestra).");
S(1, "Organizácia", "Za čo možno na zápočet získať maximálne 10 bodov?", "za zadanie (prezentácia v 12. týždni)", ["za prvý test Moodle", "za účasť na prednáškach", "za skúškovú praktickú časť", "za opravný test"],
  "Zadanie je za max. 10 bodov a prezentuje sa v 12. týždni semestra.");
S(1, "Organizácia", "Aké bodové rozdelenie má skúška?", "test Moodle max. 45 b. + praktická časť max. 15 b.", ["test Moodle max. 30 b. + zadanie max. 10 b.", "iba test Moodle max. 60 b.", "iba praktická časť max. 60 b.", "ústna skúška max. 45 b. + test max. 15 b."],
  "Skúška: test Moodle (45 b.) a praktická časť (15 b.), spolu 60 bodov.");
S(1, "Organizácia", "V ktorom programe sa na cvičeniach programuje mikrokontrolér?", "Code Composer Studio", ["MATLAB Simulink", "Arduino IDE", "Keil µVision", "Visual Studio"],
  "Pracuje sa v Code Composer Studio (CCStudio) od Texas Instruments s podporou C2000 a emulátorom XDS100.");
S(1, "Organizácia", "Aký emulátor sa pri inštalácii CCStudia odporúča nainštalovať?", "XDS100", ["XDS560", "ST-Link", "J-Link", "PICkit"],
  "Treba nainštalovať podporu len pre C2000 a len nevyhnutný emulátor (XDS100).");
TF(1, "Organizácia", "Ak máte vo Windows názov používateľského účtu s diakritikou, inštalácia zahraničného softvéru môže robiť problémy.", true,
  "Diakritika v názve účtu často spôsobuje problémy pri inštalácii zahraničného softvéru.");

S(1, "Štandardy v C", "Ktoré z uvedených sú štandardy pre programovanie v jazyku C?", "MISRA, CERT, AUTOSAR", ["MISRA, HTML, USB", "CERT, SPI, I2C", "AUTOSAR, UART, ADC", "ISO 9001, MISRA, PWM"],
  "Existuje viacero štandardov (MISRA, CERT, AUTOSAR…); firmy si často stanovujú aj vlastný „firemný“ štandard.");
S(1, "Štandardy v C", "Čo najviac zohľadňujú štandardy pre programovanie v jazyku C?", "konvencie pomenovania premenných a funkcií", ["rýchlosť kompilácie", "veľkosť zdrojového súboru", "výber operačného systému", "typ použitého emulátora"],
  "Štandardy riešia najmä pomenovanie premenných a funkcií, ale aj spôsob písania funkcií a formátovanie.");
S(1, "Štandardy v C", "Z čoho pozostáva modul pri modulárnom programovaní v C?", "minimálne z hlavičkového súboru (.h) a zdrojového súboru (.c)", ["iba zo súboru .c", "z jedného súboru .exe", "z linkovacieho súboru .cmd a súboru .map", "z viacerých funkcií main()"],
  "Modul = súbor vzájomne súvisiacich funkcií, premenných a definícií; má min. 1 súbor .h a 1 súbor .c.");
S(1, "Štandardy v C", "Čo má byť v hlavičkovom súbore (.h) modulu?", "iba to, čo chce programátor sprístupniť používateľovi modulu", ["celý zdrojový kód všetkých funkcií", "iba komentáre bez deklarácií", "všetky lokálne premenné modulu", "obsah registrov mikrokontroléra"],
  "Hlavičkový súbor obsahuje len verejné rozhranie modulu a v komentároch aj pokyny na používanie funkcií.");
TF(1, "Štandardy v C", "Pri písaní modulov pre opakovanú použiteľnosť je vhodné spoliehať sa na existenciu globálnych premenných.", false,
  "Moduly sa nemajú spoliehať na globálne premenné (výnimkou sú napr. registre); používanie globálnych premenných treba minimalizovať.");
TF(1, "Štandardy v C", "Moduly si často definujú vlastné dátové typy, s ktorými pracujú.", true,
  "Modul by sa nemal spoliehať na existenciu dátových typov definovaných inde.");
S(1, "Štandardy v C", "Aká je štruktúra pomenovania premenných/funkcií podľa prednášky?", "prefix_typNazov_suffix", ["typ.prefix.nazov", "nazov_typ_prefix", "suffix-prefix-typ", "TYP_NAZOV"],
  "Prefix = skratka modulu, typ = skratka dátového typu, suffix (nepovinný) = napr. fyzikálny rozmer.");
S(1, "Štandardy v C", "Čo vyjadruje prefix v mene premennej prefix_typNazov_suffix?", "skratku modulu, ku ktorému premenná/funkcia patrí", ["dátový typ premennej", "fyzikálny rozmer premennej", "adresu premennej v pamäti", "zoznam parametrov funkcie"],
  "Pri lokálnej premennej sa prefix môže vynechať.");
S(1, "Štandardy v C", "Čo udáva suffix v mene premennej, napr. trc_r32SamplingTime_ms?", "napr. fyzikálny rozmer (jednotku) premennej", ["názov modulu", "dátový typ premennej", "poradové číslo funkcie", "prístupové práva k premennej"],
  "Suffix nie je povinný; „_ms“ hovorí, že čas je v milisekundách.");
S(1, "Štandardy v C", "Prečo sa v embedded programovaní používajú typy ako int16, int32, uint16, real32?", "lebo veľkosť pôvodných typov (napr. int) je závislá od implementácie", ["lebo sú rýchlejšie ako pôvodné typy", "lebo ich vyžaduje kompilátor jazyka C", "lebo šetria napätie napájania", "lebo pôvodné typy v C neexistujú"],
  "Napr. int má v MCU 16 bitov, ale v PC 32 bitov – pomenovanie vyjadruje veľkosť typu.");
TF(1, "Štandardy v C", "Dátový typ int má vždy rovnakú veľkosť na všetkých platformách (v MCU aj v PC).", false,
  "int môže mať 16 bitov v MCU a 32 bitov v PC.");
S(1, "Štandardy v C", "Ako sa definuje vlastný typ int32 z príkladu na prednáške?", "typedef long int32;", ["#define int32 = long", "int32 = (long)", "struct int32 long;", "using int32 = long;"],
  "Používateľ knižnice si často musí definície týchto typov napísať sám, napr. typedef long int32.");
M(1, "Štandardy v C", "Ktoré z uvedených zásad formátovania kódu sú podľa prednášky vhodné?",
  ["používať tabulátor a prázdne riadky na oddelenie častí kódu", "deklarovať premenné na začiatku funkcie", "používať komentáre", "medzera pred a za +, -, =, ale nie za * a /"],
  ["písať celý blok if na jeden riadok", "nepoužívať žiadne komentáre", "dávať medzery okolo * a / vždy", "deklarovať všetky premenné až pri ich prvom použití"],
  "Prehľadný kód je základ úspechu – najmä, ak na projekte pracuje viac ľudí.");
TF(1, "Štandardy v C", "Výraz <code>pVoltage->V = 0.86603*pVoltage->Ubeta - 0.5*pVoltage->Ualpha</code> je zapísaný podľa odporúčaného štýlu (medzery okolo =, – ale nie okolo *).", true,
  "Medzery sa dávajú okolo +, –, =, nie však okolo * a /.");
S(1, "Štandardy v C", "Čo je vhodné robiť pri komentovaní kódu?", "používať komentáre, napr. vysvetlenie jednotlivých krokov konfigurácie", ["komentáre vynechať, kód vysvetľuje všetko sám", "komentovať len na konci projektu", "komentáre písať iba v hlavičkových súboroch s binárnymi dátami", "komentáre nahradiť dlhšími názvami súborov"],
  "Prednáška ukazuje komentované kroky konfigurácie SPI (Step 2a, Step 2b…).");
S(1, "Štruktúry", "Ako sa v C označuje dátový typ združujúci viac premenných rôznych typov pod jedným menom?", "štruktúra (struct)", ["pole (array)", "makro (#define)", "smerník (pointer)", "výčet (enum)"],
  "Príklad: typedef struct controller {...} CONTROLLER_TYP;");
S(1, "Štruktúry", "Prečo sa funkcii, ktorá mení štruktúru, odovzdáva smerník na štruktúru?", "aby zmena hodnôt zostala zachovaná aj po skončení funkcie", ["aby funkcia bežala rýchlejšie ako main()", "aby sa štruktúra nemusela deklarovať", "aby sa zmenila veľkosť štruktúry", "aby sa premenné v štruktúre vynulovali"],
  "Cez smerník funkcia pracuje s originálom štruktúry, nie s kópiou.");
S(1, "Štruktúry", "Ako sa pristupuje k členu štruktúry cez smerník, napr. pController?", "pController->r32Target", ["pController.r32Target()", "pController::r32Target", "*pController[r32Target]", "pController<r32Target>"],
  "Operátor -> sa používa na prístup k členu cez smerník na štruktúru.");
TF(1, "Štruktúry", "V niektorých HAL (Hardware Application Layer) sa hardvér nastavuje pomocou parametrov v štruktúre, ktorá môže uchovať aj výstupy výpočtov (napr. hodnotu TBPRD).", true,
  "Štruktúra sa odovzdá funkcii na nastavenie parametrov a môže slúžiť aj na uchovanie dôležitých výstupov.");

S(1, "Mikrokontrolér", "Z čoho sa skladá mikrokontrolér?", "z výpočtovej jednotky (CPU) a periférnych obvodov", ["iba z pamäte RAM a FLASH", "iba z kryštálového oscilátora a PLL", "z CPU a externého operačného systému", "iba z periférií bez CPU"],
  "Mikrokontrolér = CPU + periférne obvody.");
S(1, "Mikrokontrolér", "Čím sa signálový mikrokontrolér (DSC) odlišuje od bežného?", "má špeciálne výpočtové moduly pre spracovanie signálov (násobičky, filtre, tabuľky…)", ["nemá žiadne periférie", "nemá CPU", "pracuje len s analógovými signálmi", "nedá sa programovať v jazyku C"],
  "DSC majú navyše veľa periférií (PWM, ADC, CAP, QEP…).");
S(1, "Mikrokontrolér", "Kde sa bežne používajú signálové mikrokontroléry (DSC)?", "v embedded zariadeniach, napr. riadenie práčky, pohonov, vozidiel", ["iba v stolových počítačoch", "iba v grafických kartách", "iba v serveroch", "iba v mobilných sieťach"],
  "DSC sú súčasťou jednoúčelových zariadení a riadiacich jednotiek (práčky, chladničky, automobily, pohony…).");
S(1, "Mikrokontrolér", "Koľko CPU a pomocných jadier CLA obsahuje TMS320F2837xD?", "2× 32-bitové CPU a 2× CLA", ["1× CPU a 1× CLA", "4× CPU bez CLA", "2× 8-bitové CPU a 2× CLA", "1× 64-bitové CPU a 4× CLA"],
  "Je to dvojjadrový signálový mikrokontrolér od Texas Instruments.");
S(1, "Mikrokontrolér", "Aká je maximálna pracovná frekvencia mikrokontroléra TMS320F2837xD?", "200 MHz", ["50 MHz", "100 MHz", "400 MHz", "1 GHz"],
  "TMS320F2837xD pracuje s taktom max. 200 MHz.");
S(1, "Mikrokontrolér", "Aké napájacie napätia používa TMS320F2837xD?", "3,3 V pre vstupy/výstupy a 1,2 V pre logické obvody", ["5 V pre I/O a 3,3 V pre logiku", "12 V pre I/O a 5 V pre logiku", "1,2 V pre I/O a 3,3 V pre logiku", "iba 24 V"],
  "I/O sú napájané 3,3 V, jadro (logika) 1,2 V.");
S(1, "Mikrokontrolér", "Aký typ aritmetiky podporuje CPU mikrokontroléra TMS320F2837xD?", "plávajúcu desatinnú čiarku (floating point)", ["iba celé čísla", "iba pevnú desatinnú čiarku", "iba 8-bitové čísla", "iba binárne kódovanie BCD"],
  "CPU s jednotkou pre plávajúcu desatinnú čiarku.");
S(1, "Mikrokontrolér", "Koľko individuálne programovateľných a multiplexovaných GPIO má TMS320F2837xD?", "až 169", ["až 16", "až 32", "až 100", "až 512"],
  "GPIO sú rozdelené do portov po 32 pinoch.");
S(1, "Mikrokontrolér", "Koľko AD prevodníkov má TMS320F2837xD a aké majú rozlíšenie?", "4× ADC, 16 bitov (diferenciálne) alebo 12 bitov (single-ended)", ["1× ADC, 8 bitov", "2× ADC, vždy 10 bitov", "8× ADC, vždy 16 bitov", "4× ADC, vždy 12 bitov"],
  "Nastaviteľné: 16 bitov pre diferenciálne vstupy alebo 12 bitov pre single-ended vstupy.");
S(1, "Mikrokontrolér", "Koľko PWM modulov s dvoma výstupmi má TMS320F2837xD?", "12", ["4", "6", "16", "32"],
  "Z toho 8 modulov umožňuje PWM s vysokým rozlíšením.");
S(1, "Mikrokontrolér", "Koľko modulov CAP (zachytenie hrany) a QEP (inkrementálne snímače) má TMS320F2837xD?", "6× CAP a 3× QEP", ["3× CAP a 6× QEP", "12× CAP a 12× QEP", "2× CAP a 2× QEP", "1× CAP a 1× QEP"],
  "6 modulov eCAP a 3 moduly eQEP.");
M(1, "Mikrokontrolér", "Ktoré komunikačné rozhrania má TMS320F2837xD?", ["USB", "CAN", "SPI", "SCI (UART)"], ["Ethernet 10 Gb/s", "HDMI", "Bluetooth", "PCI Express"],
  "Okrem nich aj uPP, McBSP a I2C.");
S(1, "Mikrokontrolér", "Koľko komunikačných rozhraní SCI (UART) má TMS320F2837xD?", "4", ["1", "2", "8", "12"], "K dispozícii sú 4× SCI (UART), 3× SPI, 2× CAN, 2× I2C.");
S(1, "Pamäť", "Ktorá z pamätí mikrokontroléra TMS320F2837xD je rýchla a po vypnutí napájania stratí obsah?", "RAM", ["FLASH", "registre CpuSysRegs", "ROM", "EEPROM"],
  "RAM je rýchla, relatívne malá, znesie veľmi veľa prepisov, ale je nestála.");
S(1, "Pamäť", "Ktorá pamäť je pomalšia, väčšia, trvalá a má menej možných prepisov?", "FLASH", ["RAM", "registre", "vyrovnávacia pamäť CPU", "zásobník"],
  "FLASH uchová obsah aj po vypnutí napájania.");
S(1, "Pamäť", "Čo je to linkovanie pamäte?", "priradenie častí kódu a premenných na definované pamäťové miesta", ["prekladanie zdrojového kódu do strojového kódu", "prepojenie dvoch mikrokontrolérov káblom", "nahrávanie programu cez USB", "mazanie obsahu pamäte FLASH"],
  "Priradenie je dané linkovacím súborom (.cmd), ktorý delí pamäť na bloky a programové sekcie do nich rozdeľuje.");
S(1, "Pamäť", "Prečo je výhodné pri ladení nalinkovať celý program do RAM?", "viac možných prepisov a rýchlejšie nahrávanie programu", ["program sa zachová po vypnutí napájania", "RAM je väčšia ako FLASH", "program beží pomalšie, takže sa ľahšie ladí", "nie je potrebný linkovací súbor"],
  "Pre RAM slúži napr. linkovací súbor 2837xD_RAM_lnk_cpu1.cmd.");
S(1, "Pamäť", "Čo určuje, ako sa programové sekcie rozdelia do pamäťových blokov?", "linkovací súbor (.cmd)", ["hlavičkový súbor registrov", "súbor main.c", "nastavenie PLL", "register GPxDIR"],
  "Linkovací súbor rozdeľuje pamäť na bloky podľa manuálu MCU.");

S(1, "Registre", "Čo je to register mikrokontroléra?", "pamäťové miesto s konkrétnou adresou, ktorého hodnota ovplyvňuje správanie MCU a periférií", ["časť pamäte FLASH, kde je uložený program", "premenná v pamäti RAM", "názov súboru s kódom", "zásobník volaní funkcií"],
  "Pamäťové miesto registrov nie je súčasťou RAM ani FLASH.");
TF(1, "Registre", "Pamäťové miesto registrov je súčasťou pamäte RAM.", false,
  "Registre sú samostatné pamäťové miesta – nie sú súčasťou RAM ani FLASH.");
TF(1, "Registre", "Aj zmena jediného bitu registra môže vyvolať akciu alebo odozvu mikrokontroléra.", true,
  "Hodnota registra priamo ovplyvňuje správanie MCU a periférií.");
S(1, "Registre", "Ako sa v programe symbolicky pristupuje k registrom?", "cez globálne premenné z hlavičkových súborov, ktoré sú linkovaním mapované na presné miesto", ["priamo cez čísla riadkov v súbore .c", "len cez assembler", "cez názvy súborov na disku", "cez systémové volania operačného systému"],
  "Hlavičkové súbory rozdeľujú registre do skupín podľa periférie.");
S(1, "Registre", "Ako sa pristupuje k celému registru naraz (napr. pre časovač CPU)?", "CpuTimer0Regs.TPR.all", ["CpuTimer0Regs.TPR.bit.all()", "CpuTimer0Regs->TPR[]", "CpuTimer0Regs::TPR", "&CpuTimer0Regs.bit"],
  "Prístup k celému registru: .all, k bitovým poliam: .bit.NAZOV.");
S(1, "Registre", "Ako sa pristupuje k bitovému poľu registra, napr. TDDR časovača 0?", "CpuTimer0Regs.TPR.bit.TDDR", ["CpuTimer0Regs.TPR.all.TDDR", "CpuTimer0Regs.TDDR.TPR", "CpuTimer0Regs->bit.TDDR.all", "TDDR(CpuTimer0Regs.TPR)"],
  "Bitové polia sa čítajú/zapisujú cez .bit.");
S(1, "Hodiny", "Čo je hodinový signál?", "povel, kedy sa má vykonať požadovaná strojová inštrukcia", ["pomenovanie funkcie main()", "napájacie napätie jadra", "názov registra časovača", "príkaz jazyka C"],
  "Strojová inštrukcia nie je inštrukcia v jazyku C.");
S(1, "Hodiny", "Čo sa používa na úpravu (zvýšenie/zníženie) frekvencie základného hodinového signálu?", "násobička PLL a deličky", ["iba watchdog", "iba kondenzátor", "pamäť FLASH", "ADC"],
  "Signál z oscilátora alebo externého zdroja sa interne upravuje násobičkou PLL a deličkami.");
S(1, "Hodiny", "Ako sa nazýva hodinový signál privedený po úprave do CPU a periférií?", "systémové hodiny (system clocks)", ["referenčný signál", "bezpečnostný signál", "synchronizačný signál SYNC", "signál WDT"],
  "Základný signál generuje oscilátor alebo ho možno priviesť z externého zdroja.");
S(1, "Hodiny", "Ktoré registre povoľujú/zakazujú hodinový signál do jednotlivých periférií?", "CpuSysRegs.PCLKCRx", ["GpioCtrlRegs.GPxDIR", "ClkCfgRegs.SYSPLLMULT", "GpioDataRegs.GPxSET", "AdcaRegs.ADCCTL1"],
  "Pred každou perifériou je prepínač, ktorý hodinový signál povoľuje alebo zakazuje.");
TF(1, "Hodiny", "Periféria, ktorá nie je časovaná (nemá privedené hodiny), pracuje normálne.", false,
  "Periféria bez hodinového signálu nepracuje!");
S(1, "Hodiny", "Ktoré bitové pole registra sa podľa prednášky používa pre násobičku PLL?", "ClkCfgRegs.SYSPLLMULT.bit.IMULT", ["CpuTimer0Regs.TPR.bit.TDDR", "SpiaRegs.SPICTL.bit.CLK_PHASE", "GpioCtrlRegs.GPADIR.all", "AdcaRegs.ADCCTL1.bit.ADCPWDNZ"],
  "IMULT je celočíselná násobiaca konštanta PLL v ClkCfgRegs.SYSPLLMULT.");

S(1, "GPIO", "Čo je GPIO?", "všeobecný digitálny vstup/výstup, riadený programovo alebo zvolenou perifériou", ["analógový vstup s 12-bitovým prevodníkom", "iba výstup pre PWM", "pamäťový blok FLASH", "komunikačný protokol"],
  "GPIO = General Purpose Input Output.");
S(1, "GPIO", "Ako sa nazýva možnosť priradiť pinu GPIO rôzne periférie?", "multiplexing", ["pull-up", "kvalifikácia vstupu", "linkovanie", "toggle"],
  "Pri TMS320F2837xD je možné vyberať až z 8 možností na jeden GPIO.");
S(1, "GPIO", "Z koľkých možností funkcií na jeden pin je teoreticky možné vyberať pri TMS320F2837xD?", "až 8", ["2", "4", "16", "32"],
  "Funkcia pinu sa volí registrami GPxGMUXn a GPxMUXn.");
S(1, "GPIO", "Z koľkých pinov sa skladá jeden port GPIO (A, B, C…)?", "32", ["8", "16", "64", "169"],
  "Porty A, B, C, D, E majú po 32 pinov.");
G(1, "GPIO", "single", () => {
  const pin = R(0, 159), L = "ABCDE";
  const ok = L[Math.floor(pin / 32)];
  const options = shuffle(L.split("")).slice(0, 5).map((x) => "Port " + x);
  return { text: `Do ktorého portu patrí pin GPIO${pin}? (porty po 32 pinoch)`, options, correct: options.indexOf("Port " + ok),
    expl: `Port = pin ÷ 32 (celočíselne): ${pin} ÷ 32 = ${Math.floor(pin / 32)} → Port ${ok} (A = 0–31, B = 32–63, C = 64–95, D = 96–127, E = 128–159).` };
});
G(1, "GPIO", "single", () => {
  const regs = [["GPxGMUXn / GPxMUXn", "funkcia pinu (GPIO alebo periféria)"], ["GPxDIR", "smer pinu (vstup / výstup)"], ["GPxPUD", "pull-up rezistor zapnutý / vypnutý"], ["GPxQSELn", "kvalifikácia (vyhodnotenie) vstupu"]];
  const r = pick(regs);
  const options = shuffle(regs.map((x) => x[0]));
  return { text: `Ktorým registrom sa nastavuje: <b>${r[1]}</b>?`, options, correct: options.indexOf(r[0]),
    expl: "GPxMUX – funkcia, GPxDIR – smer, GPxPUD – pull-up, GPxQSELn – kvalifikácia vstupu. Sú v skupine GpioCtrlRegs." };
});
S(1, "GPIO", "Ktorý register určuje smer GPIO (vstup alebo výstup)?", "GPxDIR", ["GPxPUD", "GPxDAT", "GPxSET", "GPxQSELn"],
  "GPxDIR – direction; 1 = výstup, 0 = vstup.");
S(1, "GPIO", "Ktorý register zapína alebo vypína pull-up rezistor pinu GPIO?", "GPxPUD", ["GPxDIR", "GPxDAT", "GPxTOGGLE", "GPxMUXn"],
  "PUD = pull-up disable.");
S(1, "GPIO", "Ktorý register zodpovedá za kvalifikáciu (vyhodnotenie) vstupu GPIO?", "GPxQSELn", ["GPxDIR", "GPxPUD", "GPxCLEAR", "GPxMUXn"],
  "Kvalifikácia filtruje krátke rušivé impulzy (napr. na 6 vzoriek).");
S(1, "GPIO", "Ktorý register sa používa na prečítanie hodnoty vstupu GPIO?", "GPxDAT", ["GPxSET", "GPxCLEAR", "GPxDIR", "GPxPUD"],
  "Registre dátových operácií (GPxDAT, SET, CLEAR, TOGGLE) sú v skupine GpioDataRegs.");
S(1, "GPIO", "Ktorý register nastaví výstup GPIO na logickú 1?", "GPxSET", ["GPxCLEAR", "GPxTOGGLE", "GPxDAT", "GPxDIR"],
  "SET → log. 1, CLEAR → log. 0, TOGGLE → opačná hodnota.");
S(1, "GPIO", "Ktorý register nastaví výstup GPIO na logickú 0?", "GPxCLEAR", ["GPxSET", "GPxTOGGLE", "GPxDIR", "GPxPUD"],
  "SET → 1, CLEAR → 0, TOGGLE → negácia.");
S(1, "GPIO", "Čo urobí zápis do registra GPxTOGGLE?", "prepne výstup na opačnú hodnotu", ["nastaví výstup na log. 1", "nastaví výstup na log. 0", "zmení smer pinu", "vypne pull-up"],
  "Do registrov SET/CLEAR/TOGGLE má zmysel zapisovať len hodnotu 1; zápis 0 nemá význam.");
TF(1, "GPIO", "Do registrov GPxSET, GPxCLEAR a GPxTOGGLE sa zapisuje hodnota 1; zápis hodnoty 0 nemá žiadny význam.", true,
  "Zápis 1 vyvolá akciu pre daný pin, zápis 0 pin nezmení.");
S(1, "GPIO", "Čo znamená, že registre GpioCtrlRegs sú „EALLOW protected“?", "sú chránené proti nechcenému prepisu a pred zápisom je potrebné povoliť prístup (EALLOW)", ["možno ich iba čítať", "sú uložené vo FLASH", "sú dostupné iba z jadra CLA", "fungujú iba pri vypnutých hodinách"],
  "EALLOW povoľuje zápis do chránených registrov, EDIS ho opäť zakáže.");
S(1, "GPIO", "V ktorej skupine registrov sú GPxDAT, GPxSET, GPxCLEAR a GPxTOGGLE?", "GpioDataRegs", ["GpioCtrlRegs", "CpuSysRegs", "ClkCfgRegs", "EPwm1Regs"],
  "Konfiguračné registre (MUX, DIR, PUD, QSEL) sú v GpioCtrlRegs, dátové v GpioDataRegs.");
S(1, "GPIO", "V ktorej skupine registrov sú konfiguračné registre GPIO (GPxMUXn, GPxDIR, GPxPUD, GPxQSELn)?", "GpioCtrlRegs", ["GpioDataRegs", "CpuSysRegs", "AdcaRegs", "PieCtrlRegs"],
  "Sú EALLOW protected.");
TF(1, "GPIO", "V označení registrov GPxDIR znamená „x“ číslo pinu.", false,
  "x je písmeno portu (A, B, C…), n je poradie registra.");
O(1, "GPIO", "Zoraďte kroky nastavenia GPIO pinu ako programovo riadeného výstupu.",
  ["povoliť zápis do chránených registrov (EALLOW)", "nastaviť funkciu pinu na všeobecný I/O (GPxMUX)", "nastaviť smer pinu na výstup (GPxDIR)", "zapísať hodnotu na výstup (GPxSET / GPxCLEAR)"],
  "Najprv sa povolí zápis a nastaví funkcia a smer pinu, až potom možno zapisovať na výstup.");
P(1, "GPIO", "Priraďte registre GPIO k ich úlohe.", [
  ["GPxDIR", "smer pinu"], ["GPxPUD", "pull-up rezistor"], ["GPxQSELn", "kvalifikácia vstupu"], ["GPxDAT", "čítanie vstupu"], ["GPxSET", "nastavenie výstupu na 1"], ["GPxCLEAR", "nastavenie výstupu na 0"]],
  "Konfigurácia je v GpioCtrlRegs, práca s hodnotami v GpioDataRegs.");
P(1, "Registre", "Priraďte oblasť k jej charakteristike.", [
  ["RAM", "rýchla, nestála"], ["FLASH", "trvalá, menej prepisov"], ["Linkovací súbor", "rozdeľuje sekcie do pamäťových blokov"], ["Hlavičkový súbor", "mapuje registre na globálne premenné"]],
  "RAM a FLASH sú pamäte, registre nie sú súčasťou ani jednej z nich.");
G(1, "GPIO", "select", () => {
  const pin = pick([5, 17, 20, 31]);
  const code = `EALLOW;\nGpioCtrlRegs.GPAMUX2.bit.GPIO${pin} = {{0}};\nGpioCtrlRegs.GPADIR.bit.GPIO${pin} = {{1}};\nGpioDataRegs.GPASET.bit.GPIO${pin} = {{2}};\nEDIS;`;
  return {
    text: `Doplňte nastavenie pinu GPIO${pin} ako programovo riadeného <b>výstupu</b>, ktorý sa nastaví na log. 1.<pre>${code}</pre>`,
    blanks: [{ opts: ["0", "1", "2", "3"], ans: "0" }, { opts: ["0", "1"], ans: "1" }, { opts: ["0", "1"], ans: "1" }],
    expl: "MUX = 0 → všeobecný GPIO; DIR = 1 → výstup; zápisom 1 do GPASET sa výstup nastaví na log. 1.",
  };
});

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
S(2, "Prerušenia", "Aké kľúčové slovo musí byť uvedené na začiatku hlavičky obslužnej funkcie prerušenia? (jedno slovo)", "interrupt", ["static", "inline", "volatile", "void main"], "Napr. <code>interrupt void timer0_isr(void)</code>.");
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
S(2, "Časovače", "Ktorý bit slúži na zastavenie/spustenie časovača CPU?", "TSS", ["TRB", "TIE", "TIF"], "Zastavenie/spustenie – bit TSS; reset (reload) – bit TRB.");
S(2, "Časovače", "Ktorý bit slúži na reset (reload) časovača CPU?", "TRB", ["TSS", "TIE", "TIF"], "Zastavenie/spustenie – bit TSS; reset – bit TRB.");
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
S(3, "Time-base", "Ako sa volá register, ktorý určuje maximálnu hodnotu (periódu) časovej základne ePWM?", "TBPRD", ["TBCTR", "TBCTL", "CMPA"]);
M(3, "Time-base", "Ktoré udalosti generuje časová základňa ePWM?",
  ["čítač = 0 (CTR = 0)", "čítač = perióda (CTR = PRD)"], ["čítač = CMPA pri počítaní dole", "zhoda s QPOSMAX", "koniec AD konverzie", "pretečenie watchdogu"],
  "Zhody s CMPA/CMPB generuje komparačný submodul.");
M(3, "Time-base", "Kedy môže časová základňa vyslať signál pre synchronizáciu PWM modulov?",
  ["keď príde synchronizačný signál EPWMxSYNCI", "keď CTR = 0", "keď CTR = CMPB"], ["keď CTR = CMPA a počíta dole", "keď sa zmení stav GPIO0", "keď skončí ADC kalibrácia"]);
TF(3, "Time-base", "Synchronizácia časových základní medzi PWM modulmi môže prebiehať len v rámci synchronizačnej schémy.", true);
O(3, "Time-base", "Zoraďte kroky synchronizácie hodinových signálov TBCLK medzi PWM modulmi.",
  ["Povoliť hodiny do požadovaných PWM modulov (PCLKCR2)", "Nastaviť PCLKCR2.TBCLKSYNC = 0", "Nastaviť časové základne PWM modulov", "Nastaviť PCLKCR2.TBCLKSYNC = 1"]);
S(3, "Time-base", "Ktorý bit registra PCLKCR2 sa pri synchronizácii časových základní najprv nuluje a po nastavení modulov nastaví na 1?", "TBCLKSYNC", ["TBCTL", "SWFSYNC", "CLKDIV"]);
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
      `<line x1="${X(e.t)}" x2="${X(e.t)}" y1="${yT - 8}" y2="205" stroke="currentColor" stroke-opacity=".55" stroke-dasharray="3 3"/>` +
      `<text x="${X(e.t) + 3}" y="${yB + 20}" font-size="10" fill="currentColor" fill-opacity=".75" transform="rotate(-90 ${X(e.t) + 3} ${yB + 20})">Event ${events.indexOf(events.find((q) => q.f === e.f)) + 1}</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Priebeh TBCTR a ${name}" font-family="serif">
      <line x1="${x0}" y1="${yB}" x2="${x1 + 6}" y2="${yB}" stroke="currentColor"/>
      <line x1="${x0}" y1="${yT - 8}" x2="${x0}" y2="${yB}" stroke="currentColor"/>
      <line x1="${x0}" x2="${x1}" y1="${Yc(1)}" y2="${Yc(1)}" style="stroke:var(--wv-blue,#1b3df0)"/>
      <line x1="${x0}" x2="${x1}" y1="${Yc(c)}" y2="${Yc(c)}" style="stroke:var(--wv-green,#1a9a1a)"/>
      <text x="4" y="${Yc(1) + 4}" font-size="12" fill="currentColor">TBPRD</text>
      <text x="4" y="${Yc(c) + 4}" font-size="12" fill="currentColor">${cmpName}</text>
      <text x="28" y="${yB + 3}" font-size="12" fill="currentColor">0</text>
      <text x="20" y="14" font-size="12" fill="currentColor">TBCTR</text>
      <polyline points="${tri}" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <line x1="${x0}" y1="${yo(0)}" x2="${x1 + 6}" y2="${yo(0)}" stroke="currentColor"/>
      <line x1="${x0}" y1="${yo(1) - 10}" x2="${x0}" y2="${yo(0)}" stroke="currentColor"/>
      <text x="4" y="${yo(1) + 4}" font-size="12" fill="currentColor">${name}</text>
      <text x="22" y="${yo(0) + 4}" font-size="12" fill="currentColor">0</text>
      <polyline points="${out}" fill="none" style="stroke:var(--wv-red,#e11)" stroke-width="1.8"/>
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
S(4, "Trip-zone", "Ktorý submodul umožňuje PWM modulu reagovať na chybové stavy riadeného hardvéru (napr. nadprúd)?", "Trip-zone", ["Dead-band", "Chopper", "Event-trigger"]);
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
S(4, "Trip-zone", "Ako sa nazýva reakcia trip-zone, ktorá sa automaticky resetuje v každej perióde PWM?", "cycle-by-cycle (CBC)", ["one-shot (OSHT)", "force (FRC)", "direct-drive"]);
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
S(5, "SOC", "Ktorý bit (pole) registra ADCSOCyCTL určuje veľkosť vzorkovacieho okna?", "ACQPS", ["CHSEL", "TRIGSEL", "ADCPWDNZ"]);
S(5, "SOC", "Ktorý bit (pole) registra ADCSOCyCTL určuje udalosť, ktorá spustí prevod?", "TRIGSEL", ["ACQPS", "CHSEL", "ADCPWDNZ"]);
S(5, "SOC", "Ktorý bit (pole) registra ADCSOCyCTL vyberá snímaný kanál?", "CHSEL", ["ACQPS", "TRIGSEL", "ADCPWDNZ"]);
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
S(5, "ADC prerušenia", "Ktorý register slúži na nastavenie prerušení INT3 a INT4 AD prevodníka?", "ADCINTSEL3N4", ["ADCINTSEL1N2", "ADCINTFLG", "ADCINTCTL"]);
S(5, "ADC prerušenia", "Ktorý register slúži na nastavenie prerušení INT1 a INT2 AD prevodníka?", "ADCINTSEL1N2", ["ADCINTSEL3N4", "ADCINTFLG", "ADCINTCTL"]);
O(5, "Zapnutie ADC", "Zoraďte postup zapnutia AD prevodníka.",
  ["Zapnúť hodiny do zvoleného AD prevodníka", "Nastaviť deličky hodín", "Nastaviť bit ADCPWDNZ do log. 1", "Počkať aspoň 500 µs pred prvou konverziou"]);
S(5, "Zapnutie ADC", "Ktorým bitom registra ADCCTL1 sa AD prevodník zapína?", "ADCPWDNZ", ["ADCBSY", "INTPULSEPOS", "ADCEN"]);
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
S(6, "eQEP", "Ako sa volá register, ktorý určuje maximálnu polohu čítača eQEP?", "QPOSMAX", ["QPOSINIT", "QPOSCNT", "QPOSCMP"]);
S(6, "eQEP", "Z ktorého registra sa do čítača polohy skopíruje inicializačná hodnota?", "QPOSINIT", ["QPOSMAX", "QPOSCNT", "QPOSLAT"]);
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


/* =====================================================================
   DOPLNENÉ OTÁZKY Z UČEBNICE (priečinok kniha)
   POZOR: ID šablóny sa odvodzuje od poradia v banke – nové otázky pridávaj vždy len na KONIEC súboru.
   ===================================================================== */

// ---- učebnica: prednáška 1 ----
/* ---- Nové otázky L1 (kapitoly 1–4 učebnice) ---- */
S(1, "Chránené registre", "Ktorý bit sa pri použití makra EALLOW v skutočnosti nastaví na 1?", "bit EALLOW v registri ST1", ["bit EDIS v registri ST0", "bit PLLEN v registri SYSPLLCTL1", "bit EALLOW v registri IER", "bit WDOVERRIDE v registri SCSR"],
  "Makro EALLOW nastaví v registri ST1 bit EALLOW na 1 a povolí tak zápis do chránených registrov; makro EDIS ho vyčistí na 0.");
O(1, "Chránené registre", "Zoraďte kroky zmeny hodnoty registra označeného v manuáli „EALLOW protected“.",
  ["použiť makro EALLOW;", "upraviť hodnotu chráneného registra", "použiť makro EDIS;"],
  "Zápis sa najprv povolí makrom EALLOW, potom sa register zmení a nakoniec sa zápis opäť zakáže makrom EDIS.");
TF(1, "Chránené registre", "Registre sú chránené proti zápisu (EALLOW protected) okrem iného preto, aby ich hodnotu nezmenilo napr. nesprávne použitie smerníkov alebo pretečenie pamäte.", true,
  "Kniha uvádza ochranu proti náhodnému prepisu, napr. nesprávnym použitím smerníkov či pretečením pamäte.");
S(1, "Hlavičkové súbory", "Ako sú registre reprezentované v hlavičkových súboroch C2000Ware?", "ako dátový typ union s celým registrom (.all) a bitovým poľom (.bit)", ["ako pole typu char s adresou v makre", "ako trieda s metódami get/set", "ako enum s hodnotami bitov", "ako funkcie s vstupným parametrom"],
  "Union umožní pristupovať k registru ako k jednému číslu (.all) alebo k jednotlivým bitovým poliam (.bit) pri zachovaní rovnakej veľkosti premennej.");
TF(1, "Hlavičkové súbory", "Ak sa za sebou nastavuje viac bitov jedného registra cez bitové polia (.bit), je potrebných viac inštrukcií ako pri jednom zápise do .all.", true,
  "Prístup cez bitové pole je prehľadnejší, ale pri viacerých bitoch vyžaduje viac inštrukcií, a teda viac výpočtového času.");
S(1, "Hlavičkové súbory", "Ktorým súborom možno vložiť všetky hlavičkové súbory periférií TMS320F2837xD naraz?", "F2837xD_device.h", ["F2837xD_GlobalVariableDefs.c", "F2837xD_epwm.h", "F2837xD_usDelay.asm", "F2837xD_SysCtrl.c"],
  "Include súboru F2837xD_device.h vloží všetky .h súbory periférií; ostatné súbory majú inú úlohu.");
S(1, "Pamäť", "Aká je najmenšia adresovateľná jednotka pamäte TMS320F2837xD, a teda aj veľkosť typu char?", "16 bitov", ["8 bitov", "32 bitov", "64 bitov", "1 bit"],
  "Hoci je CPU 32-bitové, pamäť tvoria 16-bitové bunky, preto je veľkosť typov short a char tiež 16 bitov.");
P(1, "Pamäť", "Priraďte typ pamäte TMS320F2837xD k jeho charakteristike.", [
  ["Dx RAM (M0, M1, D0, D1)", "dedikovaná výlučne pre jedno CPU, bez prístupu DMA"], ["LSx RAM", "zdieľaná medzi CPU a jeho CLA"], ["GSx RAM", "prístupná obom CPU a ich DMA"], ["CPU MSGRAM", "správy medzi CPU1 a CPU2 (IPC RAM)"], ["FLASH", "trvalá pamäť, zachová obsah po strate napájania"]],
  "Dx RAM patrí jednému CPU, LSx sa zdieľa s CLA (LSxMSEL), GSx s oboma CPU (GSxMSEL), MSGRAM slúži na medziprocesorovú komunikáciu a FLASH je trvalá.");
S(1, "Pamäť", "Ktorým registrom sa programovo nastavuje zdieľanie bloku LSx RAM medzi CPU a CLA?", "LSxMSEL", ["GSxMSEL", "LSxCLAMAP", "CLAMSEL", "LSxPUD"],
  "Po resete je LSx RAM priradená len k CPU; zdieľanie s CLA sa nastavuje v registri LSxMSEL (GSxMSEL slúži pre GSx RAM).");
M(1, "Sekcie programu", "Ktoré z uvedených sekcií sú podľa knihy neinicializované (možno ich umiestniť iba do RAM)?", [".bss", ".stack", ".sysmem"], [".cinit", ".text", ".const", ".data"],
  "Neinicializované sekcie sú .bss, .stack a .sysmem; .cinit, .const, .data a .text sú inicializované sekcie.");
S(1, "Sekcie programu", "Do ktorej sekcie sa ukladajú hodnoty explicitne inicializovaných globálnych a statických premenných (napr. číslo 10 z <code>int32_t GlobalVar = 10;</code>)?", ".cinit", [".bss", ".stack", ".sysmem", ".switch"],
  "Samotná premenná je v .bss, ale jej inicializačná hodnota je v .cinit (pri voľbe --rom_model, keď sa inicializácia robí počas behu).");
S(1, "Sekcie programu", "Kam patrí lokálna premenná <code>float LocalVar;</code> deklarovaná vo funkcii main()?", ".stack", [".bss", ".cinit", ".text", ".data"],
  "Lokálne premenné sa ukladajú na zásobník (.stack), globálne a statické do .bss.");
S(1, "Sekcie programu", "Prečo musí byť sekcia .stack v prvých 64K pamäte dát?", "lebo ukazovateľ zásobníka (stack pointer) v C2000 je 16-bitový", ["lebo FLASH začína na adrese 0x10000", "lebo vyššie adresy sú vyhradené pre registre", "lebo zásobník používa iba CLA", "lebo CPU má len 64K RAM"],
  "Stack pointer je 16-bitový, preto zásobník musí ležať v prvých 64K slov pamäte.");
P(1, "Sekcie programu", "Priraďte sekciu programu k jej obsahu.", [
  [".text", "vykonateľný kód"], [".cinit", "inicializačné hodnoty globálnych a statických premenných"], [".bss", "globálne a statické premenné"], [".stack", "zásobník, napr. lokálne premenné"], [".sysmem", "pamäť pre dynamicky alokované funkcie"]],
  "Sekcie rozdeľujú program na kód, inicializačné hodnoty, dáta, zásobník a pamäť pre dynamickú alokáciu.");
S(1, "Linkovanie", "Z akých dvoch častí sa skladá linkovací súbor pre C2000 v CCStudiu?", "Memory a Sections", ["Header a Source", "Code a Data", "Flash a RAM", "Pages a Blocks"],
  "V časti Memory sa pamäť rozdelí na bloky (origin, length) a v časti Sections sa do nich priradia sekcie programu.");
S(1, "Linkovanie", "Ako sa v časti Memory linkovacieho súboru štandardne využívajú stránky PAGE 0 a PAGE 1?", "PAGE 0 ako pamäť programu, PAGE 1 ako pamäť dát", ["PAGE 0 ako FLASH, PAGE 1 ako RAM", "PAGE 0 pre CPU1, PAGE 1 pre CPU2", "PAGE 0 pre registre, PAGE 1 pre zásobník", "PAGE 0 pre jadro, PAGE 1 pre CLA"],
  "PAGE 0 je štandardne pamäť programu a PAGE 1 pamäť dát; delenie na stránky však nie je povinné.");
S(1, "Linkovanie", "Ktoré kľúčové slovo v definícii pamäťového bloku určuje jeho začiatok?", "origin", ["begin", "start", "length", "page"],
  "Kľúčové slovo origin označuje začiatok bloku a length jeho dĺžku.");
S(1, "Linkovanie", "Ktorý štandardný súbor z hlavičkových súborov slúži na nalinkovanie celého programu do RAM pre CPU1?", "2837xD_RAM_lnk_cpu1.cmd", ["2837xD_FLASH_lnk_cpu1.cmd", "F2837xD_Headers_nonBIOS_cpu1.cmd", "F2837xD_GlobalVariableDefs.c", "F2837xD_usDelay.asm"],
  "Verzia _FLASH_ používa FLASH ako pamäť programu, súbor Headers_nonBIOS mapuje registre na adresy.");
G(1, "Linkovanie", "num", () => {
  const len = pick([0x800, 0x1000, 0x2000, 0x8000]);
  return { text: `Pamäťový blok v linkovacom súbore má <code>length = 0x${len.toString(16).toUpperCase().padStart(6, "0")}</code>. Koľko 16-bitových slov (pamäťových buniek) obsahuje?`,
    answer: len, tol: 0, unit: "slov", alt: [], expl: `0x${len.toString(16).toUpperCase()} = ${len} 16-bitových slov (jedna adresa = jedna 16-bitová bunka).` };
});
S(1, "Linkovanie", "Na čo slúži <code>#pragma DATA_SECTION</code> pri definícii premenných registrov (napr. EPwm1Regs)?", "vytvára novú sekciu, takže premenná nebude v .bss a linker ju môže umiestniť na adresu registra", ["zakazuje kompilátoru optimalizovať premennú", "nastavuje register ako EALLOW protected", "vkladá premennú do zásobníka", "povoľuje hodiny príslušnej periférie"],
  "Linker podľa sekcie (napr. EPwm1RegsFile) v súbore .cmd umiestni premennú na pamäťové miesto registrov periférie.");
TF(1, "Registre", "Po resete MCU sa väčšina registrov vráti na prednastavenú hodnotu, ktorá však nemusí byť nula.", true,
  "Kniha upozorňuje, že prednastavená hodnota výrobcu nemusí byť nula.");
G(1, "PLL", "num", () => {
  const f = pick([10, 20]), im = pick(f === 20 ? [6, 8, 10] : [12, 16, 20]), dv = pick([1, 2]);
  const res = f * im / dv;
  return { text: `Kryštál má f<sub>OSCCLK</sub> = ${f} MHz, IMULT = ${im}, FMULT = 0 a delička PLLSYSCLKDIV = ${dv}. Vypočítajte f<sub>PLLSYSCLK</sub> = f<sub>OSCCLK</sub>·(IMULT+FMULT)/PLLSYSCLKDIV.`,
    answer: res, tol: 0.01, unit: "MHz", alt: [], expl: `${f}·(${im}+0)/${dv} = ${fmt(res)} MHz.` };
});
S(1, "PLL", "Aké nastavenie PLL dá pri kryštáli 20 MHz maximálnu frekvenciu 200 MHz?", "IMULT = 10, FMULT = 0, delička /1", ["IMULT = 5, FMULT = 0, delička /1", "IMULT = 10, FMULT = 0, delička /2", "IMULT = 20, FMULT = 0, delička /1", "IMULT = 1, FMULT = 0, delička /10"],
  "20·(10+0)/1 = 200 MHz; ostatné možnosti dávajú 100 MHz, 100 MHz, 400 MHz (nad limitom) alebo 2 MHz.");
S(1, "PLL", "V akom stave sa nachádzajú systémové hodiny TMS320F2837xD po resete?", "interný oscilátor INTOSC2 s 10 MHz, PLL obídená, delička /1", ["kryštál 20 MHz s PLL ×10", "interný oscilátor 200 MHz", "hodiny sú vypnuté, kým sa nenastaví PLL", "externý oscilátor 60 MHz cez AUXPLL"],
  "Po resete alebo strate napájania sa používa INTOSC2 s 10 MHz, ktorý obchádza násobičku PLL, a delička je /1.");
O(1, "PLL", "Zoraďte hlavné kroky nastavenia PLL podľa procedúry v knihe.",
  ["vybrať zdroj hodín OSCCLK a bypassnúť PLL (vyčistiť PLLCLKEN)", "nastaviť deličku PLLSYSCLKDIV na /1", "zapísať násobičku celým SYSPLLMULT.all (IMULT a FMULT súčasne)", "aspoň 5× uzamknúť PLL a čakať na príznak LOCKS", "nastaviť deličku o 1 vyššiu ako požadovanú", "prepnúť na PLL (PLLCLKEN) a nakoniec nastaviť požadovanú deličku"],
  "Najprv sa PLL obíde, nastaví sa delička a násobička, PLL sa opakovane uzamkne, a až potom sa prepne na PLL a nastaví finálna delička.");
S(1, "PLL", "Prečo sa pri nastavovaní PLL zapisujú IMULT a FMULT súčasne cez <code>ClkCfgRegs.SYSPLLMULT.all</code>?", "lebo je nevyhnutné zapísať obe hodnoty naraz; zápisom sa PLL automaticky zapne", ["lebo bitové polia registra SYSPLLMULT sú len na čítanie", "lebo FMULT je iba v registri CpuSysRegs", "lebo zápis cez .bit je pomalší o 20 cyklov", "lebo IMULT nemožno nastaviť na 0"],
  "Procedúra vyžaduje zápis IMULT aj FMULT súčasne cez .all a tento zápis automaticky zapne PLL.");
S(1, "PLL", "Prečo sa delička PLLSYSCLKDIV pred prepnutím na PLL nastaví na hodnotu o 1 vyššiu, než je požadovaná?", "aby sa obmedzil nárast prúdu pri prepínaní na PLL", ["aby sa PLL rýchlejšie uzamkla", "aby sa vypol watchdog", "aby sa zvýšila presnosť kryštálu", "aby sa povolil zápis do EALLOW registrov"],
  "Podľa knihy sa tým obmedzí nárast prúdu pri prepnutí na PLL; požadovaná hodnota deličky sa nastaví až neskôr.");
S(1, "PLL", "Ktoré okolnosti sú pri uzamknutí PLL podľa knihy odporúčané pre istotu správneho štartu?", "uzamknúť PLL aspoň 5 krát po sebe", ["uzamknúť PLL iba raz", "uzamknúť PLL presne 2 krát", "uzamknúť PLL počas behu watchdogu vypnutého", "uzamknúť PLL bez čakania na LOCKS"],
  "Postup uzamknutia sa opakuje aspoň 5×; vyšší počet prispieva k istote správneho štartu PLL.");
TF(1, "PLL", "Funkcia <code>InitSysPll()</code> z hlavičkových súborov (F2837xD_SysCtrl.c) zjednodušuje komplikovanú procedúru nastavenia PLL.", true,
  "Kniha odporúča využiť InitSysPll() namiesto ručného vykonávania celej procedúry.");
M(1, "Hodiny", "Ktoré z uvedených tvrdení o limitoch frekvencií hodinových signálov TMS320F2837xD sú správne?",
  ["frekvencia SYSCLK je najviac 200 MHz (pri externom oscilátore/kryštáli)", "frekvencia z externého kryštálu na X1/X2 je 10 až 20 MHz", "frekvencia EPWMCLK je najviac 100 MHz", "výstup PLL (PLLRAWCLK) má rozsah 120 až 400 MHz"],
  ["frekvencia EPWMCLK môže byť až 200 MHz", "kryštál môže mať frekvenciu 1 až 5 MHz", "PLLRAWCLK môže byť 2 až 10 MHz"],
  "Podľa tab. 3.1: SYSCLK max. 200 MHz, kryštál 10–20 MHz, EPWMCLK max. 100 MHz, PLLRAWCLK 120–400 MHz.");
TF(1, "Hodiny", "Pri použití interného oscilátora je maximálna frekvencia systémových hodín 194 MHz.", true,
  "Hodnota 200 MHz platí pre externý oscilátor/kryštál; pri internom oscilátore je maximum 194 MHz.");
S(1, "Hodiny", "Ak je SYSCLK väčší ako 100 MHz, aká musí byť frekvencia EPWMCLK?", "polovičná ako SYSCLK", ["rovnaká ako SYSCLK", "štvrtinová ako SYSCLK", "dvojnásobná ako SYSCLK", "presne 60 MHz"],
  "EPWMCLK je najviac 100 MHz, preto pri SYSCLK nad 100 MHz musí byť polovičný.");
TF(1, "Hodiny", "Ak periféria nemá povolené hodiny v registri CpuSysRegs.PCLKCRx, často sa jej registre nedajú meniť, a jediným prejavom chyby je, že periféria nepracuje.", true,
  "Kniha zdôrazňuje, že začiatočníci na zapnutie hodín zabúdajú a potom hľadajú neexistujúcu chybu v HW.");
S(1, "GPIO", "Ktoré napätia ohraničujú hysterézne pásmo digitálneho vstupu?", "V<sub>IL</sub> a V<sub>IH</sub>", ["V<sub>OL</sub> a V<sub>OH</sub>", "V<sub>SS</sub> a V<sub>DDIO</sub>", "V<sub>IL</sub> a V<sub>OH</sub>", "V<sub>OL</sub> a V<sub>IH</sub>"],
  "Pásmo medzi V<sub>IL</sub> a V<sub>IH</sub> je hysterézne; napätie v ňom vstup vyhodnotí ako posledný logický stav.");
S(1, "GPIO", "Aký stav vyhodnotí digitálny vstup, ak je privedené napätie v hysteréznom pásme?", "platí posledný logický stav", ["logickú 0", "logickú 1", "nedefinovanú hodnotu, vstup sa vypne", "chybu, ktorá vyvolá prerušenie"],
  "Podľa knihy vstup v takom prípade ponechá posledný platný logický stav.");
S(1, "GPIO", "Aký je účel pull-up rezistora pri tlačidle pripojenom na digitálny vstup?", "definovať napäťovú úroveň na vstupe, keď tlačidlo nie je stlačené", ["zvýšiť rýchlosť čítania vstupu", "odfiltrovať kmitanie kontaktov", "zmeniť smer pinu na výstup", "zvýšiť napätie na výstupe nad V<sub>OH</sub>"],
  "Bez pull-upu by pin pri nestlačenom tlačidle fungoval ako anténa a prečítaná hodnota by bola náhodná.");
TF(1, "GPIO", "Po resete mikrokontroléra sú digitálne vstupy/výstupy často nakonfigurované ako vstupy so zapnutým pull-up rezistorom, čo treba zohľadniť pri návrhu HW.", true,
  "Je to kritické napr. pri riadení výkonových spínačov, ktoré by sa po resete mohli neželane zapnúť.");
S(1, "GPIO", "Koľko bitov je potrebných na zvolenie funkcie pinu pri až 8 možnostiach a do ktorých registrov sa rozdeľujú?", "aspoň 4 bity, rozdelené do registrov GPyGMUXn a GPyMUXn", ["3 bity, v registri GPyDIR", "8 bitov, v registri GPyPUD", "2 bity, v registri GPyQSELn", "1 bit, v registri GPyDAT"],
  "Z dôvodu kompatibility s inými MCU C2000 sa 4 bity delia do GPyGMUXn a GPyMUXn; n = 1 pre spodných a 2 pre horných 16 pinov portu.");
S(1, "GPIO", "Čo označuje n v názve registra GPAMUX<b>n</b> pre pin GPIO17?", "n = 2, lebo pin patrí do horných 16 pinov portu (16–31)", ["n = 1, lebo je to druhý port", "n = 17, číslo pinu", "n = 0, lebo ide o všeobecný vstup", "n = 2, lebo ide o druhý bit funkcie"],
  "n je 1 pre spodných 16 pinov portu a 2 pre horných 16; GPIO17 teda používa GPAMUX2 (ako v príklade v knihe).");
S(1, "GPIO", "Čo znamená nastavenie kvalifikácie vstupu na 6 vzoriek?", "zmena signálu sa prijme ako nová úroveň, až keď je nezmenený počas aspoň 6 po sebe idúcich vzoriek", ["vstup sa číta len každú šiestu periódu SYSCLK a zvyšok sa ignoruje", "vstup sa vyhodnotí ako 1 po šiestich pretečeniach časovača", "výstup sa zmení až po 6 zápisoch do GPxSET", "pin môže riadiť najviac 6 periférií"],
  "Krátke rušenie kratšie ako 6 vzoriek nezmení vyhodnotenú úroveň, takže kvalifikácia čiastočne eliminuje elektrické rušenie.");
S(1, "GPIO", "Ktorá hodnota v registri GPAQSEL2 pre GPIO17 v príklade z knihy zodpovedá kvalifikácii na 6 vzoriek?", "2", ["0", "1", "3", "6"],
  "V príklade je <code>GPAQSEL2.bit.GPIO17 = 2</code> (6 vzoriek), zatiaľ čo hodnota 1 pre GPIO96 znamená 3 vzorky.");
S(1, "GPIO", "Prečo výrobca neodporúča riadiť výstup GPIO zápisom do registra GPyDAT?", "lebo zápis využíva čítaj-modifikuj-zapíš a môže prepísať zmenu iného pinu, ktorú v tom čase urobila periféria", ["lebo GPyDAT je len na čítanie", "lebo GPyDAT je EALLOW protected", "lebo zápis do GPyDAT vypne pull-up", "lebo GPyDAT nemožno použiť pre piny portu A"],
  "Pri read-modify-write môže byť zmena iného pinu (napr. od PWM modulu) prepísaná staršou hodnotou; SET/CLEAR/TOGGLE menia len požadovaný bit.");
TF(1, "GPIO", "Pri čítaní registrov GPySET, GPyCLEAR a GPyTOGGLE sa vráti aktuálny stav výstupov, preto na kontrolu stavu GPIO stačia tieto registre.", false,
  "Tieto registre pri čítaní vždy vrátia 0; stav pinu sa overuje v GPyDAT.");
TF(1, "GPIO", "Hodnotu pinu GPIO možno cez GPyDAT prečítať vždy, aj keď ho riadi nejaká periféria.", true,
  "Pin môže v danom čase riadiť len jedna periféria, ale jeho aktuálnu hodnotu možno prečítať kedykoľvek.");
M(1, "GPIO", "Ktoré tri otázky je potrebné vo všeobecnosti zodpovedať pri konfigurácii digitálneho pinu?",
  ["akú funkciu bude pin mať", "aký bude mať smer (vstup/výstup)", "či zapnúť alebo vypnúť interný pull-up rezistor"],
  ["aký bude mať pin názov v programe", "akú taktovaciu frekvenciu bude pin mať", "či sa pin pripojí k PLL"],
  "Kniha uvádza funkciu, smer a pull-up ako tri základné otázky konfigurácie.");
S(1, "GPIO", "Prečo je v príklade v knihe podmienka stlačeného tlačidla <code>GpioDataRegs.GPADAT.bit.GPIO17 == 0</code>?", "lebo stlačené tlačidlo privedie na vstup V<sub>SS</sub> (log. 0), nestlačené cez pull-up V<sub>DDIO</sub>", ["lebo GPADAT je invertovaný register", "lebo kvalifikácia vstupu invertuje signál", "lebo tlačidlo je pripojené na výstup GPIO31", "lebo makro SB1_PRESSED vždy vracia 0"],
  "Tlačidlo spína vstup k V<sub>SS</sub>, preto je stlačenie zapísané ako porovnanie s 0 (výsledok porovnania je 1).");
S(1, "Tlačidlá", "Čo spôsobuje kmitanie (oscilácie) pri stlačení mechanického tlačidla?", "zakmitanie kontaktov pri ich spojení", ["zlá kvalifikácia vstupu v GPxQSELn", "príliš vysoká frekvencia SYSCLK", "chýbajúci zápis EDIS", "prerušenie od časovača"],
  "Jedno stlačenie sa môže na vstupe vyhodnotiť ako viacnásobné; podobne aj pri uvoľnení tlačidla.");
M(1, "Tlačidlá", "Ktoré spôsoby zmierňujú kmitanie tlačidla podľa knihy?",
  ["kvalitnejšie tlačidlo", "kondenzátor pripojený paralelne k tlačidlu", "po zachytení hrany chvíľu počkať (napr. čakacia slučka alebo DELAY_US)"],
  ["vypnúť pull-up rezistor", "zvýšiť násobičku PLL", "použiť register GPxDAT na zápis výstupu"],
  "Na strane HW pomáha lepšie tlačidlo, kondenzátor alebo iný typ tlačidla; na strane SW počkať niekoľko ms, kým oscilácie odznejú.");
S(1, "Tlačidlá", "Ako program z knihy zachytáva práve nastalú stlačenú hranu tlačidla?", "porovná predchádzajúcu hodnotu (0) s aktuálnou stlačenou hodnotou, uloženú v premennej u16ButtonPrevState", ["číta register GPATOGGLE", "vykoná akciu pri každej iterácii, kým je tlačidlo stlačené", "počká na prerušenie od PLL", "porovná GPADAT s hodnotou GPASET"],
  "Predchádzajúci stav sa ukladá na konci každej iterácie slučky; akcia sa vykoná len pri zmene z nestlačeného na stlačené.");
TF(1, "Tlačidlá", "Čakacia slučka je z pohľadu efektivity nevyužitý výpočtový čas, preto sa používa len minimálne.", true,
  "Navyše pri práci s prerušeniami môže reálne trvať oveľa dlhšie, ako sa predpokladalo.");
G(1, "DELAY_US", "num", () => {
  const a = pick([100, 250, 500, 1000]);
  const ans = round((a * 1000 / 5 - 9) / 5, 1);
  return { text: `Makro <code>DELAY_US(A)</code> volá <code>F28x_usDelay(((A·1000/CPU_RATE) − 9)/5)</code>, kde CPU_RATE = 5 (ns) pre 200 MHz. Aký argument dostane F28x_usDelay pri <code>DELAY_US(${a})</code>?`,
    answer: ans, tol: 1, unit: "(počet slučiek)", alt: [], expl: `(${a}·1000/5 − 9)/5 = (${a * 200} − 9)/5 ≈ ${fmt(ans)}.` };
});
S(1, "DELAY_US", "Aký je argument makra <code>DELAY_US()</code>?", "čas v mikrosekundách", ["počet strojových cyklov", "čas v milisekundách", "čas v nanosekundách", "počet hodinových cyklov PLL"],
  "Makro prepočíta mikrosekundy na strojové cykly a volá funkciu F28x_usDelay() (napísanú v assembleri).");
S(1, "DELAY_US", "Čo je funkcia F28x_usDelay(), ktorú volá makro DELAY_US()?", "čakacia slučka napísaná v assembleri, ktorej argument je počet strojových krokov", ["funkcia na nastavenie PLL", "obsluha prerušenia časovača 0", "funkcia na čítanie GPADAT", "makro na povolenie hodín periférií"],
  "Nachádza sa v súbore F2837xD_usDelay.asm; podobne ako for-slučka počíta, ale premennú dekrementuje z požadovanej hodnoty do nuly.");

// ---- učebnica: prednáška 2 ----
/* Prednáška 2 – doplnkové otázky (kapitoly 5 a 6) */

// ---- Kapitola 5: prerušenia ----
S(2, "PIE", "Aké je teoretické maximum prerušení, ktoré je PIE schopné rozlíšiť?",
  "192 (12 skupín po 16 prerušení)", ["120", "96", "256", "16"],
  "PIE zoskupuje až 16 prerušení do jedného prerušenia CPU a CPU má 12 vstupov z PIE, teda 12 · 16 = 192; reálne je namapovaných len okolo 120.");
S(2, "PIE", "Prečo je reálne namapovaných len okolo 120 prerušení, hoci PIE vie rozlíšiť až 192?",
  "zvyšné voľné miesta sú rezervované pre nové verzie mikrokontrolérov", ["zvyšné prerušenia sú trvalo zablokované watchdogom", "zvyšné prerušenia sú nemaskovateľné", "zvyšné miesta využíva operačný systém cez CpuTimer2", "PIE má len 120 fyzických bitov v registroch PIEIER"],
  "Kniha uvádza, že voľné miesta v mape prerušení sú rezervované do budúcna pre nové verzie mikrokontrolérov.");
S(2, "PIE", "Do ktorého bitu registra IER a ktorého bitu PIEIERx sa mapuje prerušenie EQEP2 (INT5.2)?",
  "bit INT5 v registri IER a bit PieCtrlRegs.PIEIER5.bit.INTx2", ["bit INT2 v registri IER a bit PieCtrlRegs.PIEIER5.bit.INTx5", "bit INT5 v registri IER a bit PieCtrlRegs.PIEIER2.bit.INTx5", "bit INT2 v registri IER a bit PieCtrlRegs.PIEIER2.bit.INTx2", "bit INT5 v registri IER a bit PieCtrlRegs.PIEIER5.bit.INTx5"],
  "Prerušenie INT5.2 je v 5. riadku a 2. stĺpci mapy: na úrovni PIE sa nastaví PIEIER5.INTx2 a na úrovni CPU bit INT5 v IER.");
S(2, "PIE", "Ktoré bity registra IER sú k dispozícii na povolenie prerušení na úrovni CPU?",
  "INT1 až INT14", ["INT1 až INT12", "INT1 až INT16", "INT0 až INT11", "INT1 až INT8"],
  "Register IER obsahuje bity INT1 až INT14 (12 z nich prislúcha riadkom PIE, ďalšie dva časovačom 1 a 2).");
S(2, "PIE", "Čo znamená v inicializácii prerušenia príkaz <code>PieCtrlRegs.PIECTRL.bit.ENPIE = 1;</code>?",
  "zapnutie (povolenie) bloku PIE", ["globálne povolenie prerušení", "povolenie prerušenia INT1 v CPU", "vyčistenie príznaku prerušenia v PIE", "povolenie prerušenia v časovači"],
  "Bit ENPIE zapína PIE; globálne povolenie rieši makro EINT a príznak v PIE sa čistí bitom PIEACK.");
S(2, "Globálne povolenie", "Ktoré makrá sa používajú na globálne povolenie a zakázanie prerušení?",
  "EINT (povolenie) a DINT (zakázanie)", ["EALLOW (povolenie) a EDIS (zakázanie)", "ENPIE (povolenie) a DINT (zakázanie)", "IER (povolenie) a ST1 (zakázanie)", "INTx (povolenie) a ACK (zakázanie)"],
  "Makro EINT (Enable INTerrupts) povolí prerušenia na globálnej úrovni (register ST1), DINT (Disable INTerrupts) ich zakáže. EALLOW/EDIS odomykajú chránené registre.");
S(2, "Čistenie príznakov", "Prečo sa príznaky prerušenia musia čistiť v poradí od periférie cez PIE ku CPU?",
  "inak by príznak z nižšej úrovne znova nastavil príznak vo vyššej úrovni a vznikla by nová požiadavka na prerušenie", ["inak by sa vymazal obsah registra IER", "inak by sa vypol hodinový signál periférie", "inak by sa zmenila adresa obslužnej funkcie vo vektorovej tabuľke", "inak by CPU okamžite skončilo v nemaskovateľnom prerušení"],
  "Príznak nižšej úrovne nastavuje príznak vo vyššej úrovni; ak by sa nižší nevyčistil ako prvý, znova by nastavil vyšší.");
S(2, "Čistenie príznakov", "Čo sa stane, ak sa príznaky prerušenia v obslužnej funkcii nevyčistia?",
  "nemôže prísť nová požiadavka na prerušenie", ["prerušenie sa spracuje dvakrát v tej istej periódy", "mikrokontrolér sa automaticky resetuje", "automaticky sa zakáže PIE natrvalo bez možnosti obnovy", "prerušenie sa preruší nemaskovateľným prerušením"],
  "Kým je príznak nastavený, signalizuje neobslúženú požiadavku a nová požiadavka na prerušenie nemôže prísť.");
M(2, "Čistenie príznakov", "Ako sa môže v závislosti od periférie čistiť príznak prerušenia?",
  ["zápisom hodnoty 1 priamo do príznaku", "zápisom hodnoty 1 do samostatného bitu vyhradeného na vyčistenie príznaku", "zápisom hodnoty 0 do príznaku (pri niektorých perifériách)", "postup treba skontrolovať v manuáli príslušnej periférie"],
  ["reštartom celého mikrokontroléra", "prečítaním registra IER", "zápisom hodnoty do registra ST1", "vypnutím hodinového signálu CPU"],
  "Spôsob čistenia závisí od periférie: zápis 1 do príznaku, zápis 1 do samostatného bitu, niekedy zápis 0 – preto treba vždy skontrolovať manuál.");
S(2, "Vnorené prerušenia", "Prečo sa po vstupe do ISR automaticky vypnú prerušenia na globálnej úrovni?",
  "aby sa zabránilo nežiaducemu prerušeniu prerušenia", ["aby sa ušetrila energia", "aby sa mohol zmeniť obsah registra IER", "aby sa dali čistiť príznaky v PIE", "aby sa zrýchlil návrat do hlavného programu"],
  "Globálne zakázanie pri vstupe do ISR zabráni prerušeniu už bežiacej obsluhy; po skončení ISR sa prerušenia automaticky opäť povolia.");
S(2, "Vnorené prerušenia", "Ako možno dosiahnuť, aby dôležité prerušenie (napr. nadprúd) prerušilo obsluhu menej dôležitého prerušenia (napr. sériovej komunikácie)?",
  "na začiatku obsluhy menej dôležitého prerušenia sa opätovne povolia prerušenia na globálnej úrovni", ["v hlavnej funkcii sa zakáže PIE", "v ISR menej dôležitého prerušenia sa zapíše 0 do všetkých bitov IER", "obslužná funkcia sa zavolá priamo z main", "nie je to možné, CPU vždy dokončí aktuálnu ISR"],
  "Pre detailnejšie nastavenie sa dajú na začiatku ISR aj upraviť povoľovacie bity v PIE či IER a na konci vrátiť do pôvodného stavu.");
TF(2, "Vnorené prerušenia", "Po skončení obslužnej funkcie sa prerušenia na globálnej úrovni opätovne povolia automaticky.", true,
  "Opätovné povolenie, vyčistenie príznaku v CPU a uloženie/obnovenie pomocných registrov doplní prekladač, ak je ISR správne definovaná.");
TF(2, "PIE", "Prerušenia od časovačov 1 a 2 sa povoľujú aj na úrovni PIE.", false,
  "Prerušenia od časovačov 1 a 2 a nemaskovateľné prerušenia idú do CPU priamo, PIE sa pri nich nepoužíva.");
TF(2, "Príklad TIMER0", "Prerušenie od časovača 0 sa v mape PIE nachádza na pozícii INT1.7 a v IER sa povoľuje bit INT1.", true,
  "Podľa príkladu: PieCtrlRegs.PIEIER1.bit.INTx7 = 1 na úrovni PIE a IER |= (1&lt;&lt;0) na úrovni CPU.");
S(2, "Príklad TIMER0", "Aký príkaz povolí prerušenie INT1 na úrovni CPU v príklade pre časovač 0?",
  "<code>IER |= ( 1&lt;&lt;0 );</code>", ["<code>IER |= ( 1&lt;&lt;1 );</code>", "<code>IER |= ( 1&lt;&lt;7 );</code>", "<code>IER = 0;</code>", "<code>PieCtrlRegs.PIEIER1.bit.INTx0 = 1;</code>"],
  "Bit INT1 je nultý bit registra IER (INTn = bit n−1), preto sa použije maska 1&lt;&lt;0. Bit 7 patrí až pozícii INT1.7 v PIE.");
S(2, "Príklad TIMER0", "Ktorý príkaz v ISR vyčistí príznak prerušenia INT1.7 na úrovni PIE?",
  "<code>PieCtrlRegs.PIEACK.bit.ACK1 = 1;</code>", ["<code>PieCtrlRegs.PIEACK.bit.ACK7 = 1;</code>", "<code>PieCtrlRegs.PIEIER1.bit.INTx7 = 0;</code>", "<code>CpuTimer0Regs.TCR.bit.TIF = 0;</code>", "<code>PieCtrlRegs.PIECTRL.bit.ENPIE = 0;</code>"],
  "Obsluhuje sa prerušenie zo skupiny INT1, preto sa potvrdzuje bit ACK1; príznak na úrovni periférie sa čistí v TCR zápisom 1 do TIF.");
S(2, "Príklad TIMER0", "Ako sa v ISR príkladu vyčistí príznak prerušenia na úrovni periférie (časovača 0)?",
  "zápisom hodnoty 1 do bitu TIF v registri TCR", ["zápisom hodnoty 0 do bitu TIE", "zápisom hodnoty 1 do bitu TSS", "zápisom hodnoty 1 do bitu TRB", "zápisom hodnoty 1 do registra IER"],
  "Príznak prerušenia časovača (TIF) sa vyčistí zápisom 1 do neho; TIE je povolenie, TSS stop/štart a TRB reload.");
S(2, "Príklad TIMER0", "Čo urobí riadok <code>PieVectTable.TIMER0_INT = pCpuTimer0;</code> v konfigurácii prerušenia?",
  "nastaví smerník na obslužnú funkciu prerušenia", ["povolí prerušenie v PIE", "spustí časovač 0", "vyčistí príznak prerušenia", "globálne povolí prerušenia"],
  "Do vektorovej tabuľky PIE sa zapíše adresa obslužnej funkcie, na ktorú CPU skočí pri požiadavke na prerušenie.");
S(2, "Príklad TIMER0", "Prečo môže byť nekonečná slučka v main príkladu s časovačom 0 prázdna?",
  "prepínanie LED sa vykonáva v obsluhe prerušenia od časovača", ["lebo LED sa prepína hardvérovo bez účasti CPU", "lebo kompilátor slučku automaticky nahradí prerušením", "lebo časovač 0 sa spúšťa až po skončení main", "lebo funkcia main sa v tomto príklade nikdy nevykoná"],
  "LED HL1 sa prepína v ISR, ktorú zavolá prerušenie od časovača každú sekundu, hlavná slučka teda nemusí nič robiť.");
S(2, "Overenie vedomostí", "Aké nastavenie PIE a CPU je potrebné na povolenie prerušenia od EQEP3 (INT5.3)?",
  "<code>PieVectTable.EQEP3_INT = &amp;isr;</code>, <code>PIEIER5.bit.INTx3 = 1;</code>, <code>IER |= (1&lt;&lt;4);</code>", ["<code>PieVectTable.EQEP3_INT = &amp;isr;</code>, <code>PIEIER3.bit.INTx5 = 1;</code>, <code>IER |= (1&lt;&lt;2);</code>", "<code>PieVectTable.EQEP3_INT = &amp;isr;</code>, <code>PIEIER5.bit.INTx3 = 1;</code>, <code>IER |= (1&lt;&lt;2);</code>", "<code>PieVectTable.EQEP3_INT = &amp;isr;</code>, <code>PIEIER5.bit.INTx5 = 1;</code>, <code>IER |= (1&lt;&lt;3);</code>"],
  "EQEP3 je v 5. riadku a 3. stĺpci mapy (INT5.3): PIEIER5.INTx3 a bit INT5 v IER, t. j. maska 1&lt;&lt;4.");
S(2, "Overenie vedomostí", "Aké nastavenie PIE a CPU je potrebné na povolenie prerušenia od ADCA1 (INT1.1)?",
  "<code>PIEIER1.bit.INTx1 = 1;</code> a <code>IER |= (1&lt;&lt;0);</code>", ["<code>PIEIER1.bit.INTx1 = 1;</code> a <code>IER |= (1&lt;&lt;1);</code>", "<code>PIEIER2.bit.INTx1 = 1;</code> a <code>IER |= (1&lt;&lt;0);</code>", "<code>PIEIER1.bit.INTx0 = 1;</code> a <code>IER |= (1&lt;&lt;1);</code>"],
  "ADCA1 je v 1. riadku a 1. stĺpci mapy PIE, takže INT1.1: PIEIER1.INTx1 a bit INT1 v IER (maska 1&lt;&lt;0).");

// ---- Kapitola 6: časovače ----
S(2, "Časovače", "Čo sa stane s dekrementujúcim časovačom, keď dosiahne nulu?",
  "pretečie, nastaví príznak pretečenia a počíta odznova od maxima (u CpuTimer od nastavenej periódy)", ["zastaví sa a čaká na ručný reštart", "začne inkrementovať od nuly", "automaticky vypne hodinový signál", "vynuluje register PRD"],
  "Dekrementujúci časovač pretečie pri dosiahnutí nuly a znova začne od maxima; CpuTimer nastaví TIF a opäť počíta od nastavenej hodnoty PRD.");
S(2, "Časovače", "Čo vzniká na digitálnom výstupe, ak sa výstup prepne vždy pri pretečení časovača a pri zhode s užívateľom nastavenou premennou?",
  "impulzovo-šírková modulácia (PWM)", ["amplitúdová modulácia", "sériová komunikácia UART", "kvadratúrny signál inkrementálneho snímača", "signál hodín watchdogu"],
  "Frekvenciu určuje maximálna hodnota časovača a delička, šírku impulzu hodnota v premennej.");
S(2, "Časovače", "Aká je šírka časovača CpuTimer v TMS320F2837xD a aká je šírka jeho deličky?",
  "časovač 32-bitový, delička 16-bitová", ["časovač 16-bitový, delička 32-bitová", "časovač 32-bitový, delička 8-bitová", "časovač aj delička 16-bitové", "časovač aj delička 32-bitové"],
  "Troma 32-bitovými dekrementujúcimi časovačmi (CpuTimer0–2) s 16-bitovou deličkou sú časované systémovými hodinami.");
S(2, "Časovače", "Čo je v časovači CPU registrom PRD?",
  "užívateľom nastavená perióda, od ktorej časovač dekrementuje do nuly", ["aktuálna hodnota časovača", "register povolenia prerušenia", "register príznaku pretečenia", "register deličky hodinového signálu"],
  "Časovač dekrementuje od hodnoty PRD (Period) do nuly, potom nastaví TIF a počíta znova od PRD.");
M(2, "Časovače", "Ktoré bity registra TCR sú v knihe popísané ako bity časovača CPU?",
  ["TIF – príznak pretečenia (prerušenia)", "TSS – štart/stop časovača", "TRB – reload časovača hodnotou periódy", "FREE a SOFT – správanie pri krokovaní programu"],
  ["PIEACK – potvrdenie prerušenia v PIE", "ENPIE – povolenie PIE", "EINT – globálne povolenie prerušení", "TPWM – generovanie PWM"],
  "Register TCR obsahuje TIF, TIE, TSS, TRB a bity FREE a SOFT pre ladenie; PIEACK a ENPIE patria PIE a EINT je makro.");
S(2, "Časovače", "Čo nastavuje bit FREE v registri TCR?",
  "voľný beh časovača nezávisle od krokovania programu pri ladení", ["zastavenie časovača pri každom prerušení", "reload časovača pri pretečení", "uvoľnenie chránených registrov", "povolenie prerušenia v časovači"],
  "Bit FREE (voľný beh) a bit SOFT (okamžité zastavenie, alebo dopočítanie do nuly a zastavenie) určujú správanie časovača pri krokovaní.");
S(2, "Časovače", "Čo určuje bit SOFT pri ladení programu krokovaním?",
  "či sa časovač pri krokovaní okamžite zastaví, alebo najprv dopočíta do nuly a potom zastaví", ["či časovač beží voľne bez ohľadu na krokovanie", "šírku deličky hodinového signálu", "povolenie prerušenia od časovača", "spustenie časovača po resete"],
  "SOFT dopĺňa bit FREE: nastavuje okamžité zastavenie alebo dopočítanie do nuly pri krokovaní.");
TF(2, "Časovače", "Príznak TIF časovača sa vyčistí zápisom hodnoty 1 do príznaku.", true,
  "Príznak prerušenia časovača sa podľa knihy čistí zápisom 1.");
TF(2, "Časovače", "Delička časovača je v podstate podradený časovač, ktorý pri pretečení vyšle signál nadradenému časovaču ako hodinový impulz.", true,
  "Nadradený časovač tento signál považuje za hodinový signál s nižšou frekvenciou.");
TF(2, "Časovače", "Mikrokontroléry C2000 majú časovače s mnohými rozšíreniami, ktoré sa dajú nastaviť aj ako PWM a aj ako počítadlo pre inkrementálne snímače.", false,
  "To platí pre napr. Atmel Atmega či ARM; C2000 má pre PWM a snímače samostatné periférie (ePWM, eQEP) s vlastnými časovačmi.");
S(2, "Príklad časovača", "Prečo sa v príklade inicializácie časovača 0 najprv zastaví časovač (<code>TSS = 1</code>)?",
  "ak už bol časovač spustený pred inicializáciou, zabráni sa napr. nežiaducemu prerušeniu", ["aby sa vynuloval register PRD", "aby sa povolili hodiny pre časovač", "aby sa vyčistil príznak v PIE", "aby sa nastavila delička"],
  "Časovač mohol byť omylom spustený už pred inicializáciou; zastavením sa predíde nežiaducemu prerušeniu počas nastavovania.");
S(2, "Príklad časovača", "Aký je účel príkazu <code>CpuTimer0Regs.TCR.bit.TRB = 1;</code> ako posledného kroku inicializácie?",
  "nastavená perióda sa prenesie do aktuálnej hodnoty časovača", ["spustí časovač", "povolí prerušenie v časovači", "povolí hodinový signál pre časovač", "zapne voľný beh pri krokovaní"],
  "Bit TRB (reload) skopíruje hodnotu PRD do čítača časovača; spúšťa a zastavuje bit TSS.");
S(2, "Príklad časovača", "Ako sa v príklade spustí časovač 0 po inicializácii (ktorá ho nechá zastavený)?",
  "vyčistením bitu TSS (<code>TSS = 0</code>)", ["nastavením bitu TSS (<code>TSS = 1</code>)", "nastavením bitu TRB", "vyčistením bitu TIE", "zápisom 1 do bitu TIF"],
  "TSS = 1 časovač zastaví, TSS = 0 ho spustí.");
S(2, "Príklad časovača", "Prečo inicializačná funkcia príkladu povoľuje čas len do 21450 ms?",
  "pri 200 MHz a bez deličky je maximum 2^32 − 1 impulzov, čo je približne 21,47 s", ["pretože register PRD je 16-bitový", "pretože CpuTimer0 vie počítať najviac 20 sekúnd", "pretože ďalší čas je vyhradený pre CpuTimer2", "pretože delička je v príklade nastavená na 1/1000"],
  "Bez deličky stačí 32 bitov: 2^32 / 200·10⁶ ≈ 21,47 s; pri väčšej požiadavke funkcia nenastaví časovač a vráti 1.");
S(2, "Príklad časovača", "Čo vráti inicializačná funkcia <code>tim0_vInit</code>, ak je požadovaný čas príliš veľký?",
  "hodnotu 1 a časovač nenastaví", ["hodnotu 0 a nastaví maximálny čas", "hodnotu 21450", "nič, funkcia sa zacyklí", "hodnotu 0 a spustí časovač"],
  "Po úspešnej inicializácii vráti 0; pri príliš veľkom čase nevykoná nastavenie a vráti 1.");
O(2, "Príklad časovača", "Zoraďte kroky inicializačnej funkcie časovača 0 z príkladu (v správnom poradí).",
  ["Povoliť hodinový signál pre časovač 0 (PCLKCR0)", "Zastaviť časovač (TSS = 1)", "Povoliť voľný beh pri krokovaní (FREE = 1)", "Povoliť prerušenie v časovači (TIE = 1)", "Zapísať periódu do PRD", "Reload časovača (TRB = 1)"],
  "Postup z príkladu: hodiny, stop, voľný beh, povolenie prerušenia, perióda a nakoniec reload (TRB).");
P(2, "Overenie vedomostí", "Priraďte každé prerušenie k jeho pozícii v mape PIE.",
  [["TIMER0", "INT1.7"], ["ADCA1", "INT1.1"], ["EQEP2", "INT5.2"], ["EQEP3", "INT5.3"], ["EPWM1", "INT3.1"], ["ECAP1", "INT4.1"]],
  "Pozície podľa mapy prerušení PIE: ADC a TIMER0 sú v 1. riadku, EPWM v 3., ECAP v 4. a EQEP v 5.");
P(2, "Prerušenia", "Priraďte pojem k jeho významu v prerušovacom systéme.",
  [["PIE", "zoskupuje prerušenia z periférií do max. 12 prerušení CPU"], ["IER", "povoľovací register prerušení na úrovni CPU"], ["ST1", "miesto globálneho povolenia prerušení"], ["interrupt", "kľúčové slovo hlavičky obslužnej funkcie"], ["TIF", "príznak pretečenia/prerušenia časovača"], ["PRD", "perióda, od ktorej časovač dekrementuje"]],
  "Každý pojem patrí inej úrovni prerušovacieho systému alebo časovača podľa kapitol 5 a 6.");

// ---- číselné (parametrické) ----
G(2, "Časovače", "num", () => {
  const f = pick([100, 150, 200]), tpr = pick([1, 3, 4, 9]), ms = pick([10, 20, 40, 100, 200, 500, 1000]);
  const prd = (ms * f * 1000) / (tpr + 1) - 1;
  return {
    text: `Akú hodnotu je potrebné zapísať do registra PRD časovača CPU podľa vzťahu PRD = T<sub>req</sub>·f<sub>SYSCLK</sub> / (TPR + 1) − 1, aby časovač pretiekol po ${ms} ms? Frekvencia f<sub>SYSCLK</sub> = ${f} MHz, hodnota deličky TPR = ${tpr}.`,
    answer: prd, tol: 0, unit: "", alt: [prd + 1],
    expl: `PRD = ${ms}·10⁻³ · ${f}·10⁶ / ${tpr + 1} − 1 = ${fmt(prd + 1)} − 1 = ${fmt(prd)}.`,
  };
});
G(2, "Časovače", "num", () => {
  const f = pick([50, 80, 100, 150, 200]);
  const t = 2 ** 32 / (f * 1e6);
  return {
    text: `Aký najdlhší čas je možné odmerať 32-bitovým časovačom CPU bez použitia deličky pri f<sub>SYSCLK</sub> = ${f} MHz? Výsledok uveďte v sekundách (2<sup>32</sup> impulzov).`,
    answer: round(t, 2), tol: t * 0.01, unit: "s", alt: [],
    expl: `T<sub>max</sub> ≈ 2³² / (${f}·10⁶) = ${fmt(round(t, 2))} s (pri 200 MHz je to približne 21,47 s).`,
  };
});
G(2, "Časovače", "num", () => {
  const f = pick([100, 200]);
  const h = 2 ** 48 / (f * 1e6) / 3600;
  return {
    text: `Aký maximálny čas je možné nastaviť v časovači TMS320F2837xD (32-bitový časovač a 16-bitová delička) pre f<sub>SYSCLK</sub> = ${f} MHz? Výsledok uveďte v hodinách.`,
    answer: round(h, 2), tol: h * 0.005, unit: "hod", alt: [],
    expl: `T<sub>max</sub> ≈ 2³² · 2¹⁶ / (${f}·10⁶) = 2⁴⁸ / (${f}·10⁶) ≈ ${fmt(round(h, 2))} hod (pri 200 MHz približne 390,94 hod).`,
  };
});
G(2, "Časovače", "num", () => {
  const f = 100, T = pick([100, 120, 150, 200, 250]);
  const ticks = T * f * 1e6;
  const tpr = Math.ceil(ticks / 2 ** 32) - 1;
  const prd = ticks / (tpr + 1) - 1;
  return {
    text: `Aspoň akú hodnotu deličky TPR je potrebné nastaviť, aby časovač pretiekol po ${T} sekundách pri f<sub>SYSCLK</sub> = ${f} MHz? (Delička delí frekvenciu číslom TPR + 1; register PRD je 32-bitový.)`,
    answer: tpr, tol: 0, unit: "", alt: [],
    expl: `Potrebný počet taktov je ${T}·${f}·10⁶ = ${fmt(ticks)}, čo je viac ako 2³² ≈ 4,29·10⁹. Delička TPR + 1 = ${tpr + 1} dá PRD = ${fmt(ticks)} / ${tpr + 1} − 1 = ${fmt(prd)}, čo sa zmestí do 32 bitov.`,
  };
});

// ---- učebnica: prednáška 3 ----
/* ---- Prednáška 3 – nové šablóny (kap. 7 po Dead-band) ---- */

// --- Princíp PWM ---
S(3, "PWM", "Čo označuje pojem asymetrická PWM?",
  "PWM s pílovitým priebehom časovej základne, kde sú výstupné signály zarovnané podľa nábežnej alebo dobežnej hrany (edge-aligned)",
  ["PWM s trojuholníkovým priebehom časovej základne, kde sú signály zarovnané na svoj stred", "PWM, pri ktorej majú oba výstupy rôznu frekvenciu", "PWM, pri ktorej sa nepoužíva komparačná hodnota", "PWM s dvoma časovými základňami s fázovým posunom"],
  "Asymetrická PWM = pílovitý (asymetrický) priebeh časovej základne, signály zarovnané podľa nábežnej alebo dobežnej hrany.");
S(3, "PWM", "Čo označuje pojem symetrická PWM?",
  "PWM s trojuholníkovým priebehom časovej základne, kde sú výstupné signály zarovnané na svoj stred (center-aligned)",
  ["PWM s pílovitým priebehom časovej základne zarovnaná na nábežnú hranu", "PWM s rovnakou komparačnou hodnotou pre všetky výstupy", "PWM, pri ktorej sú oba výstupy vždy v rovnakej logickej úrovni", "PWM s polovičnou frekvenciou nosného signálu"],
  "Symetrická PWM využíva symetrický, trojuholníkový priebeh časovej základne, a preto sú výstupy zarovnané na stred (center-aligned).");
TF(3, "PWM", "Pri pílovitom priebehu časovej základne sa udalosti „časová základňa dosiahla maximum“ a „časová základňa dosiahla nulu“ prakticky zhodujú, preto sú k dispozícii len 2 udalosti, kým pri trojuholníkovom priebehu sú k dispozícii všetky 4.", true,
  "Trojuholníkový priebeh ponúka najväčšiu variabilitu – maximum, nula, zhoda pri inkrementovaní aj zhoda pri dekrementovaní.");
S(3, "PWM", "Prečo trojuholníkový priebeh časovej základne znižuje rozlíšenie nastavenia výstupu oproti pílovitému?",
  "pri rovnakej frekvencii je maximálna hodnota časovej základne polovičná, takže je k dispozícii len polovičný počet komparačných hodnôt",
  ["pretože trojuholníkový priebeh sa nedá porovnávať s komparačnou hodnotou", "pretože sa vypne tieňový register", "pretože sa zníži počet bitov čítača z 16 na 8", "pretože sa zdvojnásobí frekvencia hodinového signálu TBCLK"],
  "Trojuholník počíta hore aj dole, preto pre rovnakú frekvenciu stačí polovičné TBPRD, a teda aj polovičný počet úrovní komparačnej hodnoty.");
S(3, "PWM", "Ako súvisí zvýšenie frekvencie nosného signálu (spínacej frekvencie) v meniči s filtrom a stratami?",
  "umožňuje menší výstupný filter, ale zvyšuje spínacie straty výkonových spínačov",
  ["umožňuje menší filter a zároveň znižuje spínacie straty", "vyžaduje väčší filter a zároveň znižuje straty", "nemá vplyv na veľkosť filtra ani na straty", "znižuje spínacie straty, ale vyžaduje väčší filter"],
  "Frekvencia nosného signálu je kompromisom medzi spínacími stratami a požiadavkou na vyhladený výstup.");
S(3, "PWM", "Aký je typický pomer frekvencie nosného signálu k frekvencii modulovaného signálu pri PWM sínusového signálu?",
  "frekvencia modulovaného signálu je desiatky až stovky Hz, nosný signál má jednotky až desiatky kHz",
  ["oba signály majú približne rovnakú frekvenciu", "nosný signál je pomalší ako modulovaný signál", "nosný signál má presne dvojnásobnú frekvenciu ako modulovaný", "nosný signál má rádovo desiatky MHz"],
  "Nosný signál musí mať frekvenciu násobne vyššiu ako požadovaná 1. harmonická výstupu.");

// --- Meniče ---
S(3, "Meniče", "Prečo je pri riadení jednosmerného znižovacieho meniča s jedným spínačom vhodné zvoliť pílovitý priebeh časovej základne?",
  "oproti trojuholníkovému priebehu prináša 2x vyššie rozlíšenie nastavenia výstupu",
  ["pretože trojuholníkový priebeh nemožno použiť s IGBT tranzistorom", "pretože pílovitý priebeh vyžaduje dve časové základne", "pretože pílovitý priebeh vkladá automaticky bezpečnostnú medzeru", "pretože znižuje spínaciu frekvenciu na polovicu"],
  "Menič má jeden spínač a stačí jeden výstup PWM, preto je výhodnejší pílovitý priebeh s dvojnásobným rozlíšením.");
TF(3, "Meniče", "Pri riadení znižovacieho meniča pílovitou časovou základňou zásadne záleží na tom, či je základňa rastúca alebo klesajúca – výsledné priebehy napätí a prúdov sa výrazne líšia.", false,
  "Na výsledné priebehy napätí a prúdov to nemá vplyv, voľba závisí len od preferencií používateľa.");
S(3, "Meniče", "Ako je potrebné upraviť správanie výstupu PWM, ak sa tranzistor spína budičom s negatívnou logikou?",
  "pri pretečení časovej základne výstup nastaviť na log. 0 a pri zhode s komparačnou hodnotou na log. 1, aby so zväčšujúcou sa komparačnou hodnotou rástla stredná hodnota napätia",
  ["nijako, správanie výstupu ostáva rovnaké", "komparačnú hodnotu je nutné zadávať v zápornom tvare", "použiť trojuholníkový priebeh namiesto pílovitého", "vypnúť tieňové registre"],
  "Akcie sa zamenia na opačné, aby pre používateľa platilo, že väčšia komparačná hodnota znamená väčšiu strednú hodnotu napätia.");
G(3, "Meniče", "num", () => {
  const vdc = pick([24, 48, 100, 300, 540]);
  const dp = pick([10, 20, 30, 60, 70, 75, 80, 90]);
  const v = 2 * vdc * (dp / 100 - 0.5);
  return {
    text: `H-mostík je riadený bipolárnym riadením (komplementárne signály v oboch vetvách, rovnaká komparačná hodnota pre obe časové základne). Napätie medziobvodu je V<sub>dc</sub> = ${vdc} V a normovaná komparačná hodnota je ${dp} %. Aká je približná stredná hodnota napätia na záťaži (bez strát)? Zadajte so znamienkom.`,
    answer: round(v, 2), alt: [], tol: 0.05, unit: "V",
    expl: `V_RL ≈ 2·V_dc·(d − 0,5) = 2·${vdc}·(${dp / 100} − 0,5) = ${fmt(round(v, 2))} V.`,
  };
});
S(3, "Meniče", "Aké napätie bude na záťaži H-mostíka pri bipolárnom riadení, ak je komparačná hodnota nastavená na 50 %?",
  "nulová stredná hodnota napätia", ["+V_dc", "−V_dc", "+V_dc/2", "−V_dc/2"],
  "Pri d = 50 % je pomerná doba kladného aj záporného napätia rovnaká, a preto je stredná hodnota napätia nulová (V_RL = 2V_dc(d − 0,5) = 0).");
S(3, "Meniče", "Ktoré signály sú pri bipolárnom riadení H-mostíka s komparačnou hodnotou 100 % trvale v log. 1 a aké napätie je na záťaži?",
  "PWM1 a PWM4 sú trvale v log. 1, PWM2 a PWM3 v log. 0; na záťaži je napätie +V_dc",
  ["PWM1 a PWM2 sú trvale v log. 1; na záťaži je napätie +V_dc", "PWM2 a PWM3 sú trvale v log. 1; na záťaži je napätie +V_dc", "PWM1 a PWM4 sú trvale v log. 1; na záťaži je napätie −V_dc", "všetky štyri signály sú trvale v log. 1; na záťaži je napätie 2V_dc"],
  "Pri 100 % je zapnutá uhlopriečka VT1 + VT4, takže záťaž je pripojená na +V_dc; vetvové signály sú komplementárne.");
S(3, "Meniče", "Koľko časových základní je minimálne potrebných na riadenie H-mostíka (4 samostatné signály) pomocou mikrokontroléra s dvoma výstupmi na jednu časovú základňu?",
  "dve, ktoré musia byť navzájom synchronizované", ["jedna", "štyri", "tri nezávislé", "žiadna, stačí dead-band"],
  "Každá vetva (2 tranzistory) sa riadi jednou časovou základňou, takže pre dve vetvy sú potrebné dve synchronizované základne.");
M(3, "Meniče", "Čo platí pre šírkové riadenie 1-fázového striedača s fázovým posunom časových základní? (môže byť správnych viac možností)",
  ["komparačné hodnoty oboch časových základní sú nastavené na 50 %", "výhodou sú nízke spínacie straty", "nevýhodou je vysoké harmonické skreslenie na nízkych frekvenciách", "používajú sa komplementárne signály s bezpečnostnou medzerou"],
  ["časové základne sú synchronizované bez fázového posunu", "komparačné hodnoty sa menia podľa sínusovej funkcie", "výstupné napätie je jednosmerné"],
  "Striedavé napätie vzniká fázovým posunom časových základní pri komparačných hodnotách 50 %; sínusová modulácia naopak používa základne bez posunu.");
M(3, "Meniče", "Čo platí pre riadenie 1-fázového striedača sínusovou moduláciou? (môže byť správnych viac možností)",
  ["časové základne sú synchronizované bez fázového posunu", "komparačná hodnota d1 sa mení podľa sínusovej funkcie", "pre druhú časovú základňu platí d2 = 1 − d1", "v rámci vetvy sa používajú komplementárne signály s bezpečnostnou medzerou"],
  ["časové základne majú navzájom fázový posun 180°", "komparačné hodnoty sú konštantné 50 %", "bezpečnostná medzera sa nepoužíva"],
  "Pri sínusovej modulácii sa komparačné hodnoty menia podľa d1 = A·sin(2πft) + d_offset a d2 = 1 − d1.");
G(3, "Meniče", "num", () => {
  const off = pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]);
  const a = Math.min(off, 1 - off);
  return {
    text: `Pri sínusovej modulácii striedača sa komparačná hodnota mení ako d<sub>1</sub> = A·sin(2πft) + d<sub>offset</sub> (normovane). Aká je najväčšia amplitúda A (normovane, v rozsahu 0 až 1), pri ktorej ešte nedôjde k orezaniu priebehu, ak d<sub>offset</sub> = ${off}?`,
    answer: a, alt: [], tol: 0.001, unit: "",
    expl: `A môže byť najviac v menšom z intervalov [0; d_offset] a [d_offset; 1], teda min(${off}; ${round(1 - off, 2)}) = ${a}. Preto je vhodné voliť d_offset = 0,5.`,
  };
});
G(3, "Meniče", "num", () => {
  const a = pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.45]);
  return {
    text: `Striedač je riadený sínusovou moduláciou s d<sub>offset</sub> = 0,5 a normovanou amplitúdou komparačnej hodnoty A = ${a}. Aká je približná normovaná amplitúda A<sub>out</sub> strednej hodnoty výstupného napätia (v násobkoch V<sub>dc</sub>)?`,
    answer: round(2 * a, 3), alt: [], tol: 0.001, unit: "",
    expl: `A_out ≈ 2·A = 2·${a} = ${round(2 * a, 3)}; výstup má dvojnásobnú amplitúdu ako komparačná hodnota.`,
  };
});
P(3, "Meniče", "Priraďte spôsob riadenia k zapojeniu / vlastnosti.", [
  ["Znižovací menič", "jeden výstup PWM, pílovitá časová základňa s 2x vyšším rozlíšením"],
  ["H-mostík – bipolárne riadenie", "dve synchronizované časové základne, rovnaká komparačná hodnota, pri 50 % nulové napätie"],
  ["Striedač – šírkové riadenie s fázovým posunom", "posun dvoch časových základní, komparačné hodnoty 50 %"],
  ["Striedač – sínusová modulácia", "synchronizované základne bez posunu, d2 = 1 − d1"],
  ["Vetva v mostíku", "komplementárne signály s bezpečnostnou medzerou"],
], "Podľa podkapitol 7.1.1 až 7.1.3.");

// --- Time-base ---
G(3, "Time-base", "num", () => {
  const e = pick([0, 1]), h = pick([1, 2, 3, 7]), c = pick([0, 1, 2, 3, 5]);
  const n = (e + 1) * (2 * h) * Math.pow(2, c);
  return {
    text: `V registroch sú nastavené bitové hodnoty EPWMCLKDIV = ${e}, HSPCLKDIV = ${h} a CLKDIV = ${c}. Aká je výsledná hodnota súhrnnej deličky N<sub>div</sub> (HSPCLKDIV &gt; 0)?`,
    answer: n, alt: [], tol: 0, unit: "",
    expl: `N_div = (EPWMCLKDIV + 1)·(2·HSPCLKDIV)·2^CLKDIV = ${e + 1}·${2 * h}·${Math.pow(2, c)} = ${n}.`,
  };
});
S(3, "Time-base", "Aká je najväčšia dosiahnuteľná súhrnná delička hodinového signálu pre časovú základňu ePWM (súčin všetkých troch deličiek)?",
  "1/3584", ["1/1792", "1/1024", "1/2048", "1/16384"],
  "2 (EPWMCLKDIV) · 14 (HSPCLKDIV) · 128 (CLKDIV) = 3584.");
G(3, "Time-base", "num", () => {
  const up = Math.random() < 0.5;
  const fp = pick([50, 66, 100, 120, 250]);
  const n = up ? 200e6 / (fp * 65536) : 200e6 / (2 * fp * 65535);
  return {
    text: `Mikrokontrolér pracuje na f<sub>SYSCLK</sub> = 200 MHz. Aká musí byť najmenšia (neokrúhlená) hodnota súhrnnej deličky N<sub>div</sub>, aby sa do 16-bitového TBPRD zmestila hodnota 65535 pre PWM s frekvenciou ${fp} Hz v režime počítania <b>${up ? "hore" : "hore-dole"}</b>?`,
    answer: round(n, 3), alt: [], tol: 0.02, unit: "",
    expl: up ? `Hore: TBPRD = f_SYSCLK/(N_div·f) − 1 → N_div = 200·10⁶/(${fp}·65536) = ${round(n, 2)}. Potom sa zaokrúhli nahor na realizovateľnú deličku.`
             : `Hore-dole: TBPRD = f_SYSCLK/(2·N_div·f) → N_div = 200·10⁶/(2·${fp}·65535) = ${round(n, 2)}. Potom sa zaokrúhli nahor na realizovateľnú deličku.`,
  };
});
S(3, "Time-base", "Ako sa zaokrúhľuje vypočítaná hodnota súhrnnej deličky N_div, ak vychádza neceločíselne (napr. 1,5259)?",
  "smerom nahor na najbližšiu hodnotu realizovateľnú kombináciou deličiek EPWMCLKDIV, HSPCLKDIV a CLKDIV",
  ["smerom nadol, aby bolo TBPRD čo najväčšie", "na najbližšie celé číslo podľa pravidiel zaokrúhľovania", "vždy na 1", "vždy na najbližšiu mocninu 10"],
  "Zaokrúhlenie nahor zaručí, že TBPRD sa zmestí do 16-bitového registra (v príklade N_div = 2).");
S(3, "Time-base", "Prečo je výhodné používať čo najmenšiu možnú deličku hodinového signálu TBCLK?",
  "zachová sa čo najvyššie rozlíšenie nastavenia pomernej doby zapnutia (viac úrovní komparačnej hodnoty)",
  ["zníži sa spínacia frekvencia", "zníži sa spotreba mikrokontroléra na polovicu", "zväčší sa bezpečnostná medzera", "nie je potrebná synchronizácia časových základní"],
  "Pri N_div = 2 je pri 1 kHz (hore-dole, 200 MHz) k dispozícii 50000 úrovní, pri N_div = 32 len 3125 úrovní, t. j. 16-krát menšie rozlíšenie.");
O(3, "Time-base", "Zoraďte postup návrhu časovej základne (výpočet deličky a TBPRD).",
  ["Vypočítať TBPRD pre N_div = 1 z požadovanej frekvencie", "Zistiť, že TBPRD je väčšie ako 65535, a preto nie je možné ho zapísať do 16-bitového registra", "Vyjadriť N_div z TBPRD = 65535", "Zaokrúhliť N_div nahor na realizovateľnú hodnotu a nastaviť deličky", "Znova vypočítať TBPRD a zapísať ho do registra"],
  "Postup podľa príkladu 7.2.1.2: pri 1 kHz a 200 MHz vychádza pre N_div = 1 hodnota 100000, preto je potrebná delička.");
M(3, "Time-base", "Čo môže byť zdrojom synchronizačného signálu časovej základne ePWM? (môže byť správnych viac možností)",
  ["externý signál cez GPIO piny (EXTSYNCIN1 / EXTSYNCIN2)", "softvér pomocou bitu SWFSYNC", "nadradený PWM modul"],
  ["koniec AD konverzie", "pretečenie časovača watchdogu", "signál INDEX z modulu eQEP", "chybový signál Trip-zone"],
  "Zdrojom môže byť externý signál cez GPIO, softvérové forsovanie SWFSYNC alebo nadradený PWM modul.");
S(3, "Time-base", "Čo sa stane s časovou základňou, keď zachytí synchronizačný signál EPWMxSYNCI (pri zapnutej synchronizácii)?",
  "jej aktuálna hodnota sa nastaví na hodnotu uloženú v registri TBPHS a od nej počíta ďalej",
  ["vynuluje sa register TBPRD", "zastaví sa a čaká na ďalší signál", "zmení sa delička CLKDIV na 1", "prepíše sa CMPA hodnotou TBPRD"],
  "TBPHS (time-base phase) určuje hodnotu, na ktorú sa čítač pri synchronizácii nastaví.");
S(3, "Time-base", "Do ktorých modulov vysiela synchronizačný signál modul EPWM1 podľa synchronizačnej schémy TMS320F2837xD?",
  "EPWM2, EPWM4, EPWM7 a EPWM10", ["EPWM2, EPWM3, EPWM4 a EPWM5", "iba EPWM2", "EPWM6, EPWM8 a EPWM12", "do všetkých modulov EPWM2 až EPWM12"],
  "Podľa obr. 7.15 vysiela EPWM1 do EPWM2, EPWM4, EPWM7 a EPWM10; EPWM5 vysiela len do EPWM6.");
TF(3, "Time-base", "Ak majú synchronizované moduly nastavené rôzne deličky TBCLK, synchronizácia pomocou TBCLKSYNC zarovná len prvý hodinový impulz, ostatné už synchronizované nebudú.", true,
  "TBCLKSYNC spustí hodinový signál vo všetkých moduloch naraz, ale pri rôznych deličkách sa ďalšie impulzy rozídu.");

// --- Compare-control ---
M(3, "Counter-compare", "Ktoré signály vysiela submodul Compare-control do submodulu Action-qualifier? (môže byť správnych viac možností)",
  ["TBCTR = CMPA", "TBCTR = CMPB"],
  ["TBCTR = CMPC", "TBCTR = CMPD", "TBCTR = TBPHS"],
  "Signály CMPA a CMPB vstupujú do Action-qualifier aj Event-trigger, CMPC a CMPD len do Event-trigger.");
TF(3, "Counter-compare", "Použitie tieňových komparačných registrov je možné vypnúť, ak to aplikácia vyžaduje.", true,
  "Tieňový register má rovnaký názov a adresu ako aktívny; chráni pred prepísaním aktívneho registra práve v momente zhody, no dá sa vypnúť.");
S(3, "Counter-compare", "S ktorým z registrov sa priamo porovnáva časová základňa v submodule Compare-control?",
  "s aktívnym komparačným registrom", ["s tieňovým registrom", "s registrom TBPHS", "s registrom AQCTLA", "s registrom DBRED"],
  "Tieňový register len uchováva hodnotu a prenesie ju do aktívneho registra vo vhodnom okamihu.");

// --- Action-qualifier ---
TF(3, "Action-qualifier", "Výstup EPWMxA môže byť ovplyvnený aj komparačnou hodnotou CMPB (a naopak výstup EPWMxB hodnotou CMPA).", true,
  "Oba výstupy sa môžu nastaviť na základe ktorejkoľvek zo štyroch udalostí; akcie sa nastavujú v AQCTLA a AQCTLB.");
S(3, "Action-qualifier", "Čo vykoná príkaz <code>EPwm2Regs.AQCTLA.bit.CAU = 2;</code> (hodnoty: 0 nič, 1 clear, 2 set, 3 toggle)?",
  "pri TBCTR = CMPA počas inkrementovania nastaví EPWM2A do log. 1",
  ["pri TBCTR = CMPA počas dekrementovania nastaví EPWM2A do log. 1", "pri TBCTR = CMPA počas inkrementovania nastaví EPWM2B do log. 1", "pri TBCTR = CMPA počas inkrementovania vynuluje EPWM2A", "pri TBCTR = CMPB počas inkrementovania nastaví EPWM2A do log. 1"],
  "CAU = udalosť CMPA pri počítaní hore (Up), AQCTLA ovláda EPWMxA, hodnota 2 znamená set.");
S(3, "Action-qualifier", "EPWM4A má nastavené <code>AQCTLA.CBU = 1</code> a <code>AQCTLA.CBD = 2</code>. Ako treba nastaviť AQCTLB, aby bol EPWM4B komplementárny k EPWM4A?",
  "CBU = 2 a CBD = 1", ["CBU = 1 a CBD = 2", "CBU = 3 a CBD = 3", "CBU = 0 a CBD = 0", "CAU = 2 a CAD = 1"],
  "Komplementárny výstup má opačné akcie pri tých istých udalostiach: pri CBU set a pri CBD clear.");

// --- Dead-band ---
M(3, "Dead-band", "Čo dokáže submodul Dead-band s výstupmi Action-qualifier? (môže byť správnych viac možností)",
  ["oneskoriť nábežnú hranu", "oneskoriť dobežnú hranu", "invertovať signály", "vymeniť poradie výstupných signálov (OUTSWAP)"],
  ["zmeniť frekvenciu nosného signálu", "vyvolať prerušenie pri chybe", "zmeniť maximálnu hodnotu časovej základne"],
  "DB obsahuje bloky oneskorenia nábežnej a dobežnej hrany, negácie a prepínače OUTSWAP.");
P(3, "Dead-band", "Priraďte skupinu prepínačov DB submodulu k jej funkcii.", [
  ["S4 a S5 (IN MODE)", "výber vstupných signálov pre DB submodul"],
  ["S2 a S3 (POLSEL)", "výber polarity signálov za oneskoreniami"],
  ["S1 a S0 (OUT MODE)", "voľba medzi upravenými signálmi a obídením DB"],
  ["S6 a S7 (OUTSWAP)", "výmena poradia výstupných signálov"],
  ["S8", "špeciálny mód, kedy pracuje len B-path"],
], "Prepínače sú v registri DBCTL zoskupené do bitov podľa funkcie.");
S(3, "Dead-band", "Aký je východzí stav (po resete) Dead-band submodulu?",
  "DB je obídený (bypass) a signály z Action-qualifier prechádzajú bez zmeny", ["DB generuje komplementárne signály Active High Complementary", "DB invertuje signál EPWMxB", "DB je zapnutý s nulovou medzerou a vymeneným poradím výstupov", "DB oneskoruje len nábežnú hranu"],
  "Východzí OUT MODE obchádza DB; IN MODE spracúva iba EPWMxA a polarita je neinvertovaná.");
S(3, "Dead-band", "Akú hodnotu POLSEL (S3 S2) je potrebné nastaviť pre režim Active High Complementary?",
  "POLSEL = 2 (S3 = 1, S2 = 0)", ["POLSEL = 0", "POLSEL = 1", "POLSEL = 3", "POLSEL = 4"],
  "AHC: S3 = 1, S2 = 0, OUT MODE = 3; AHL: POLSEL = 1; Active High: POLSEL = 0.");
S(3, "Dead-band", "Aký je rozdiel medzi režimami Active High Complementary (AHC) a Active Low Complementary (AHL)?",
  "pri AHC sa spínače zapínajú log. 1 a medzeru tvoria úseky, kde sú oba signály v log. 0; pri AHL sa zapínajú log. 0 a medzeru tvoria úseky, kde sú oba v log. 1",
  ["pri AHC sa používa EPWMxB ako zdroj a pri AHL EPWMxA", "AHC oneskoruje len nábežnú a AHL len dobežnú hranu", "AHC má medzeru nulovú a AHL nenulovú", "AHC je pre jednosmerné a AHL pre striedavé napätie"],
  "Líšia sa logikou spínania výkonových prvkov, teda tým, v ktorej úrovni je bezpečnostná medzera.");
S(3, "Dead-band", "Čo reprezentuje hodnota v registri DBRED?",
  "oneskorenie nábežnej hrany (v násobkoch hodinového signálu TBCLK)", ["oneskorenie dobežnej hrany", "počet impulzov nosnej frekvencie", "maximálnu hodnotu časovej základne", "fázový posun voči TBPHS"],
  "DBRED = rising edge delay, DBFED = falling edge delay; hodnota je násobok TBCLK.");
G(3, "Dead-band", "num", () => {
  const f = pick([50, 100, 200]);
  const n = pick([100, 150, 200, 300, 450]);
  const t = (n / f);
  return {
    text: `Hodinový signál časovej základne má frekvenciu TBCLK = ${f} MHz. Do registrov DBRED aj DBFED je zapísaná hodnota ${n}. Aká je šírka bezpečnostnej medzery (jedného oneskorenia hrany)?`,
    answer: round(t, 3), alt: [], tol: 0.005, unit: "µs",
    expl: `Hodnota registra je násobok periódy TBCLK: t = ${n} / ${f} MHz = ${round(t, 3)} µs.`,
  };
});
TF(3, "Dead-band", "Ak sa Dead-band submodul časuje hodinovým signálom s polovičnou periódou TBCLK, nie je už možné použiť submodul PWM-Chopper.", true,
  "Polovičná perióda umožní presnejšie nastavenie medzery, ale vylúči súčasné použitie PWM-Chopper.");

// ---- učebnica: prednáška 4 ----
/* ---- PREDNÁŠKA 4 – nové šablóny (PWM chopper, Trip-zone, Event-trigger) ---- */

// ===== PWM chopper =====
S(4, "PWM chopper", "Prečo je potrebné „rozsekať“ (angl. chop) výstupné impulzy submodulom PWM-Chopper?",
  "signálové impulzové transformátory prenesú len striedavý signál (resp. striedavú zložku), preto sa impulz rozdelí na viac kratších impulzov",
  ["aby sa znížila spotreba CPU pri generovaní PWM", "aby sa medzi signály EPWMxA a EPWMxB vložila bezpečnostná medzera", "aby sa výstup vypol pri poruche riadeného systému", "aby sa AD prevodník spúšťal vyššou frekvenciou"],
  "Transformátor neprenesie jednosmernú zložku; dlhý impulz sa preto rozseká na vysokofrekvenčné impulzy, ktoré transformátor prenesie.");
S(4, "PWM chopper", "Aké hodiny časujú submodul PWM-Chopper?",
  "hodiny z deličky EPWMCLK, za ktorou nasleduje ďalšia delička 1/8",
  ["tie isté hodiny TBCLK ako časovú základňu", "hodiny ADCCLK", "externý kryštál mimo mikrokontroléra", "hodiny z modulu eQEP"],
  "PC je časovaný inak ako časová základňa: hodinový signál prichádza z deličky EPWMCLK a za ňou je delička 1/8.");
S(4, "PWM chopper", "Aký je účel prvého (one-shot) impulzu v submodule PWM-Chopper?",
  "nabudiť (magneticky pripraviť) transformátor",
  ["vypnúť PWM výstup pri poruche", "synchronizovať časovú základňu s ostatnými modulmi", "vytvoriť bezpečnostnú medzeru", "spustiť AD prevod"],
  "Prvý, širší impulz má za úlohu nabudiť transformátor; ďalšie impulzy už majú nastaviteľnú pomernú dobu zapnutia.");
S(4, "PWM chopper", "Ktorým registrom a bitovým poľom sa nastavuje frekvencia nosného signálu PWM-Choppera?",
  "PCCTL[CHPFREQ] (3-bitová delička)",
  ["PCCTL[CHPDUTY] (3-bitová delička)", "PCCTL[OSHTWTH] (4-bitová delička)", "TBCTL[CLKDIV] (3-bitová delička)", "ETPS[SOCAPRD] (2-bitová delička)"],
  "Nosná frekvencia sa volí 3-bitovou deličkou CHPFREQ v registri PCCTL; CHPDUTY nastavuje pomernú dobu zapnutia a OSHTWTH šírku prvého impulzu.");
S(4, "PWM chopper", "V akom rozsahu a s akým krokom sa nastavuje šírka prvého impulzu T<sub>OSHT</sub> PWM-Choppera?",
  "8 až 128 periód hodinového signálu EPWMCLK s krokom 8",
  ["1 až 8 periód s krokom 1", "1/8 až 7/8 periódy s krokom 1/8", "8 až 128 ns s krokom 8 ns", "16 až 256 periód s krokom 16"],
  "T<sub>OSHT</sub> = 8·T<sub>EPWMCLK</sub>·(OSHTWTH+1), čiže násobky 8 periód EPWMCLK od 8 po 128.");
G(4, "PWM chopper", "num", () => {
  const d = pick([0, 1]), c = R(0, 7);
  const f = round(200 / ((d + 1) * 8 * (c + 1)), 4);
  return { text: `Pri f<sub>SYSCLK</sub> = 200 MHz, EPWMCLKDIV = ${d} a CHPFREQ = ${c} určte nosnú frekvenciu PWM-Choppera.`,
    answer: f, tol: 0.01, unit: "MHz", alt: [],
    expl: `f = 200 MHz / ((${d}+1)·8·(${c}+1)) = ${fmt(f)} MHz.` };
});
G(4, "PWM chopper", "num", () => {
  const d = pick([0, 1]), o = R(0, 15);
  const t = 40 * (d + 1) * (o + 1);
  return { text: `Pri f<sub>SYSCLK</sub> = 200 MHz a EPWMCLKDIV = ${d} je OSHTWTH = ${o}. Aká je šírka prvého impulzu T<sub>OSHT</sub>?`,
    answer: t, tol: 0.5, unit: "ns", alt: [],
    expl: `T<sub>OSHT</sub> = 8·(${d}+1)/200 MHz·(${o}+1) = ${40 * (d + 1)} ns·${o + 1} = ${t} ns.` };
});
G(4, "PWM chopper", "num", () => {
  const k = R(1, 7);
  return { text: `Pomerná doba zapnutia impulzov nosného signálu PWM-Choppera má byť ${fmt(k * 12.5)} %. Akú hodnotu treba zapísať do CHPDUTY?`,
    answer: k - 1, tol: 0, unit: "", alt: [],
    expl: `dPC = 1/8·(CHPDUTY+1), teda CHPDUTY = 8·${fmt(k * 12.5 / 100)} − 1 = ${k - 1}.` };
});
P(4, "PWM chopper", "Priraďte bitové pole registra PCCTL k jeho významu.", [
  ["CHPFREQ", "frekvencia nosného signálu (3-bitová delička)"],
  ["OSHTWTH", "šírka prvého (one-shot) impulzu"],
  ["CHPDUTY", "pomerná doba zapnutia ďalších impulzov"],
  ["CHPEN", "povolenie činnosti PWM-Choppera"],
  ["EPWMCLKDIV", "delička hodín EPWMCLK pred deličkou 1/8"],
], "CHPFREQ, OSHTWTH, CHPDUTY a CHPEN sú polia PCCTL; EPWMCLKDIV vstupuje do vzťahov pre nosnú frekvenciu a šírku prvého impulzu.");
S(4, "Trip-zone", "Aká je logika signálov TZ1 až TZ6 submodulu Trip-zone?",
  "negatívna – počas bežnej prevádzky sú v log. 1 a pri poruche v log. 0",
  ["pozitívna – pri poruche sú v log. 1", "závisí od registra TZCTL", "jednotná iba pre TZ1–TZ3, ostatné sú pozitívne", "signály sú analógové a porovnávajú sa s referenciou"],
  "TZ signály majú negatívnu logiku, takže porucha = log. 0 (zapisujú sa aj ako !TZ1).");
S(4, "Trip-zone", "Čo sa v režime CBC stane s príznakom TZFLG[CBC], keď porucha pominie?",
  "ostáva nastavený, kým ho softvérovo nevyčistí používateľ (PWM sa však obnoví v ďalšom cykle)",
  ["automaticky sa vyčistí s koncom poruchy", "automaticky sa vyčistí s každým TBPRD", "vyčistí sa zápisom do TZOSTCLR", "príznak sa v CBC režime vôbec nenastavuje"],
  "Príznak TZFLG[CBC] ostáva aj po zániku poruchy a musí ho vyčistiť používateľ; činnosť PWM sa obnovuje po každom cykle nezávisle od neho.");
S(4, "Trip-zone", "Ktorými zápismi sa po odstránení poruchy obnoví činnosť PWM v jednorazovom režime (OSHT)?",
  "softvérovým zápisom do TZCLR[OST] a TZOSTCLR",
  ["zápisom do TZFLG[CBC]", "zápisom do ETCLR[INT]", "zápisom do TZEINT[OST]", "výstupy sa obnovia automaticky v ďalšej perióde"],
  "V režime OSHT sa nastaví TZFLG[OST] aj príslušný príznak v TZOSTFLG; činnosť sa obnoví vyčistením zápisom do TZCLR[OST] a TZOSTCLR.");
S(4, "Trip-zone", "Prečo je pri vážnych poruchách (skrat, veľké preťaženie) vhodný jednorazový režim?",
  "obsluha musí zvážiť ďalší postup a odstránenie poruchy potvrdiť, až potom sa PWM obnoví",
  ["lebo jednorazový režim reaguje rýchlejšie ako cyklický", "lebo sa pri ňom PWM automaticky obnoví v každej perióde", "lebo nevyžaduje nastavenie TZCTL", "lebo nevyvoláva prerušenie"],
  "Pri vážnych poruchách je nevyhnutné, aby obsluha zvážila ďalší postup; PWM sa obnoví až po jej potvrdení.");
S(4, "Trip-zone", "Aká hodnota TZCTL.TZA (a TZB) v príklade nastaví pri poruche výstup do log. 0, a aká do vysokej impedancie?",
  "2 = log. 0; 0 = vysoká impedancia",
  ["0 = log. 0; 2 = vysoká impedancia", "1 = log. 0; 0 = vysoká impedancia", "2 = vysoká impedancia; 0 = log. 1", "3 = log. 0; 1 = vysoká impedancia"],
  "V príklade 7.7 je TZA = 2 pre nastavenie do log. 0; v odpovedi k overeniu vedomostí TZA = 0 nastavuje vysokú impedanciu.");
S(4, "Trip-zone", "Ktoré nastavenie z príkladu 7.7 zmeníte, aby sa namiesto režimu OSHT použil režim CBC?",
  "TZSEL.bit.CBC1 = 1 namiesto OSHT1 a TZEINT.bit.CBC = 1 namiesto OST",
  ["iba TZCTL.TZA a TZCTL.TZB", "iba InputXbarRegs.INPUT1SELECT", "iba GpioCtrlRegs.GPBDIR", "ETSEL a ETPS"],
  "Režim sa volí v TZSEL (CBC1 vs. OSHT1) a príslušné prerušenie v TZEINT (CBC vs. OST); ostatné riadky ostávajú rovnaké.");
M(4, "Trip-zone", "Ktoré tvrdenia o signáloch TZ1 až TZ6 sú pravdivé?",
  ["TZ1 až TZ3 sú externé signály z GPIO (napr. zo snímača prúdu)", "TZ4 pochádza z modulu eQEP (chyba EQEPxERR)", "TZ5 je interný signál z logiky sledujúcej systémové hodiny", "TZ6 je signál EMUSTOP z CPU pri ladení"],
  ["TZ4 je signál z AD prevodníka", "TZ5 je signál z Input X-Bar", "TZ6 je signál z PWM-Choppera"],
  "TZ1–3 prichádzajú z GPIO, TZ4 z eQEP, TZ5 zo sledovania hodín a TZ6 je EMUSTOP.");
TF(4, "Trip-zone", "V režime CBC sa po každej perióde PWM činnosť obnoví, a ak chyba stále trvá, výstupy sa znova nastavia podľa reakcie na poruchu.", true,
  "CBC reaguje okamžite a po cykle obnoví PWM; pri pretrvávajúcej poruche reakcia nastane znova.");
O(4, "Trip-zone", "Zoraďte činnosti pri poruche v jednorazovom režime (OSHT) do správneho poradia.", [
  "externé zariadenie nastaví signál !TZ1 do log. 0",
  "submodul TZ okamžite nastaví výstup (napr. EPWMxA) do log. 0 a nastaví sa TZFLG[OST]",
  "porucha pominie, ale výstupy ostávajú vypnuté",
  "obsluha potvrdí odstránenie poruchy",
  "softvér zapíše do TZCLR[OST] a obnoví sa činnosť PWM",
], "Pri OSHT sa činnosť PWM obnoví až po softvérovom vyčistení príznaku zápisom do TZCLR[OST].");

// ===== Event-trigger =====
M(4, "Event-trigger", "Ktoré z uvedených udalostí môžu spustiť akciu submodulu Event-trigger?",
  ["TBCTR = 0", "TBCTR = TBPRD", "TBCTR = CMPA pri inkrementovaní časovej základne", "TBCTR = CMPB pri dekrementovaní časovej základne"],
  ["TBCTR = TZFLG", "TBCTR = DBRED", "dosiahnutie hodnoty TBPHS pri synchronizácii"],
  "Udalosti: nula, maximum (TBPRD), nula alebo maximum a zhoda s CMPA až CMPD pri počítaní nahor alebo nadol.");
S(4, "Event-trigger", "Aký je rozdiel pri čistení príznakov v ETFLG pre SOC a pre prerušenie?",
  "príznaky SOC netreba čistiť (SOC sa generujú ďalej), príznak prerušenia treba po obsluhe vyčistiť v ETCLR, inak sa nové prerušenie nevyšle",
  ["príznaky SOC aj INT treba čistiť v TZCLR", "príznak INT sa čistí automaticky, SOC treba čistiť po každom prevode", "žiadny príznak sa nikdy nečistí", "oba príznaky sa čistia zápisom do ETSEL"],
  "SOC signály sa generujú aj pri nastavenom príznaku; príznak prerušenia musí používateľ vyčistiť cez ETCLR.");
S(4, "Event-trigger", "Prečo sa pri meraní prúdu snímacím rezistorom v znižovacom meniči spúšťa AD prevodník pri TBCTR = 0 a nie pri TBCTR = CMPA (dekrementuje)?",
  "pri nule sa nezachytia prechodné deje a odmeria sa približne priemerná hodnota prúdu, kým pri CMPA by sa odmerala prakticky len minimálna hodnota",
  ["pri nule tečie rezistorom prúd len cez diódu", "pri CMPA sa AD prevodník vôbec nedá spustiť", "pri nule sa meria maximálna hodnota prúdu", "pri CMPA je EPWM3A v log. 0 a prúd nemožno merať"],
  "Rezistorom tečie prúd len pri zapnutom tranzistore; spúšťanie pri TBCTR = 0 vyhne prechodným dejom a dá približne priemer prúdu.");
S(4, "Event-trigger", "Aké nastavenie v príklade 7.8 spúšťa AD prevodník každú periódu pri TBCTR = 0?",
  "ETSEL.SOCASEL = 1, ETPS.SOCAPRD = 1 a ETSEL.SOCAEN = 1",
  ["ETSEL.INTSEL = 1 a ETSEL.INTEN = 1", "ETSEL.SOCASEL = 2 a ETPS.SOCAPRD = 0", "ETINTPS.INTCNT2 = 1 a ETCLR.INT = 1", "TZSEL.OSHT1 = 1 a TZCTL.TZA = 1"],
  "SOCASEL = 1 vyberá TBCTR = 0, SOCAPRD = 1 znamená SOC pri každej udalosti a SOCAEN = 1 povolí SOC impulz.");
S(4, "Event-trigger", "Ktorými nastaveniami sa vyvolá prerušenie každú druhú periódu pri TBCTR = TBPRD?",
  "ETSEL.INTSEL = 2, ETPS.INTPRD = 2 a ETSEL.INTEN = 1",
  ["ETSEL.INTSEL = 1, ETPS.INTPRD = 1 a ETSEL.INTEN = 1", "ETSEL.INTSEL = 2, ETPS.INTPRD = 0 a ETCLR.INT = 1", "ETSEL.SOCASEL = 2, ETPS.SOCAPRD = 2 a ETSEL.SOCAEN = 1", "ETSEL.INTSEL = 4, ETINTPS.INTCNT2 = 2"],
  "INTSEL = 2 znamená TBCTR = TBPRD, INTPRD = 2 každú druhú udalosť a INTEN = 1 povolí prerušenie.");
S(4, "Event-trigger", "Ako sa zabezpečí prerušenie každú desiatu periódu (pri TBCTR = TBPRD), keď bežná delička nestačí?",
  "ETPS.INTPSSEL = 1 (výber ETINTPS) a ETINTPS.INTCNT2 = 10",
  ["ETPS.INTPRD = 10", "ETSEL.INTSEL = 10", "ETCLR.INT = 10", "ETPS.SOCAPRD = 10"],
  "Druhá (4-bitová) delička ETINTPS sa zvolí cez INTPSSEL = 1 a INTCNT2 = 10 dá prerušenie pri každej desiatej udalosti.");
G(4, "Event-trigger", "num", () => {
  const f = pick([5, 10, 20, 25]), n = R(2, 10);
  return { text: `Modul EPWM má periódu PWM s frekvenciou ${f} kHz a udalosť TBCTR = TBPRD nastáva raz za periódu. Prerušenie je nastavené na každú ${n}. udalosť. Akou frekvenciou sa prerušenie vyvoláva?`,
    answer: round(f / n, 4), tol: 0.01, unit: "kHz", alt: [],
    expl: `f = ${f} kHz / ${n} = ${fmt(round(f / n, 4))} kHz.` };
});
P(4, "Event-trigger", "Priraďte register/pole submodulu Event-trigger k jeho významu.", [
  ["ETSEL.SOCASEL", "výber udalosti pre signál SOCA"],
  ["ETPS.SOCAPRD", "periodicita (delička) signálu SOCA"],
  ["ETSEL.INTEN", "povolenie vyslania požiadavky na prerušenie"],
  ["ETFLG", "príznaky vygenerovaných požiadaviek"],
  ["ETCLR", "čistenie príznaku prerušenia"],
  ["ETINTPS.INTCNT2", "periodicita prerušenia pri druhej deličke"],
], "Výber udalosti a povolenie sa riešia v ETSEL, periodicita v ETPS/ETINTPS, príznaky sa nastavujú v ETFLG a čistia cez ETCLR.");
TF(4, "Event-trigger", "Pre spustenie AD prevodníka samotné správne nastavenie submodulu Event-trigger nestačí – musí byť správne nastavený aj AD prevodník.", true,
  "ET len odošle požiadavku na prerušenie alebo spustenie ADC; ADC (resp. PIE) musí byť na ňu pripravený.");

// ---- učebnica: prednáška 5 ----
// ---- Vzorkovanie, Nyquist, S/H ----
TF(5, "Vzorkovanie", "Frekvencia vzorkovania AD prevodníka musí byť väčšia ako dvojnásobok maximálnej frekvencie vstupného signálu; pri nižšej hrozí zachytenie aliasov.", true,
  "Nyquistovo kritérium: fvzorkovania &gt; 2·fmax. Pri nižšej frekvencii dôjde k skresleniu a k zachyteniu aliasov – neexistujúcich signálov s nižšou frekvenciou.");
S(5, "Vzorkovanie", "Čo určuje minimálnu a čo maximálnu vzorkovaciu frekvenciu AD prevodníka?",
  "minimálnu určuje frekvencia vstupného signálu, maximálnu ovplyvňuje vstupná impedancia (rýchlosť nabíjania S/H kondenzátora)",
  ["minimálnu určuje vstupná impedancia, maximálnu frekvencia vstupného signálu", "obe hodnoty určuje iba rozlíšenie prevodníka", "minimálnu určuje referenčné napätie, maximálnu počet SOC blokov", "obe hodnoty určuje iba frekvencia PWM"],
  "Vstupná impedancia ovplyvňuje rýchlosť nabíjania kondenzátora, teda maximálnu vzorkovaciu frekvenciu; frekvencia signálu udáva minimálnu vzorkovaciu frekvenciu.");
S(5, "Vzorkovanie", "Čo je potrebné urobiť, ak je na vstupe vysoká impedancia a zároveň je potrebná vysoká frekvencia vzorkovania?",
  "impedančne prispôsobiť signál, napr. operačným zosilňovačom v zapojení napäťového sledovača",
  ["zväčšiť vzorkovacie okno na maximum", "zmenšiť referenčné napätie VREFHI", "prepnúť na 16-bitový diferenciálny režim bez ďalších úprav", "zapnúť burst mód"],
  "Bez impedančného prispôsobenia by sa kondenzátor S/H jednotky nestihol nabiť a výsledok by bol značne skreslený.");
O(5, "Vzorkovanie", "Zoraďte priebeh vzorkovania signálu v AD prevodníku.",
  ["Príde signál pre spustenie prevodu", "Vzorkovací kondenzátor sa pripojí k snímanému signálu", "Kondenzátor zostane pripojený po dobu vzorkovacieho okna", "Kondenzátor sa odpojí – jeho napätie je vzorka na ďalšie spracovanie"],
  "Podľa Overenia vedomostí: po skončení okna sa kondenzátor odpojí a napätie, na ktoré sa nabil, je vzorka pre SAR prevod.");
G(5, "Vzorkovanie", "num", () => {
  const f = pick([2, 5, 10, 25, 40]);
  return {
    text: `Signál má maximálnu frekvenciu ${f} kHz. Aká je dolná hranica vzorkovacej frekvencie podľa Nyquistovho kritéria? (Vzorkovať treba nad touto hodnotou.) Výsledok uveďte v kHz.`,
    answer: 2 * f, tol: 0, unit: "kHz", alt: [],
    expl: `fvz &gt; 2·fmax = 2·${f} kHz = ${2 * f} kHz.`,
  };
});
// ---- parametre a hodiny ----
S(5, "ADC hodiny", "Ktorý hodinový signál sa používa na vzorkovanie a ktorý na samotnú konverziu v AD prevodníku TMS320F2837xD?",
  "vzorkovanie časuje SYSCLK, konverziu ADCCLK (za deličkou ADCCTL2[PRESCALE]), aktívny len počas konverzie",
  ["vzorkovanie časuje ADCCLK, konverziu SYSCLK", "obe fázy časuje iba ADCCLK, ktorý je stále aktívny", "vzorkovanie časuje PLL priamo bez SYSCLK, konverziu časuje CPU Timer", "obe fázy časuje SYSCLK vydelený bitmi HSPCLKDIV"],
  "SYSCLK určuje vzorkovacie okno; ADCCLK vzniká za deličkou ADCCTL2[PRESCALE] a je aktívny len počas fázy konverzie.");
S(5, "ADC hodiny", "Aký je rozsah rozdielu referenčných napätí VREFHI − VREFLO podľa tabuľky charakteristík?",
  "od 2,4 V do VDDA", ["od 0 V do 1,2 V", "pevne 3,0 V", "od 5 V do 10 V", "od 1 V do 2 V"],
  "Tab. 8.1: VREFHI − VREFLO má minimum 2,4 V a maximum VDDA; VREFLO je typicky 0 V (VSSA).");
G(5, "ADC hodiny", "num", () => {
  const f = pick([25, 40, 50]);
  const c16 = pick([false, true]);
  const cyc = c16 ? 31 : 11;
  const t = (cyc / f) * 1000;
  return {
    text: `Podľa tab. 8.1 trvá konverzia najviac ${cyc} cyklov ADCCLK (${c16 ? "16-bitový" : "12-bitový"} režim). Aký je čas konverzie pri ADCCLK = ${f} MHz? Výsledok uveďte v ns.`,
    answer: round(t, 1), tol: 1, unit: "ns", alt: [],
    expl: `t = ${cyc}/${f} MHz = ${round(t, 1)} ns.`,
  };
});
TF(5, "ADC hodiny", "Veľkosť vzorkovacieho okna v 16-bitovom režime (min. 320 ns) môže byť kratšia ako v 12-bitovom režime (min. 75 ns).", false,
  "Tab. 8.1: minimálne okno je 75 ns pre 12-bit, ale 320 ns pre 16-bit – vyššie rozlíšenie vyžaduje dlhšie okno.");
// ---- single-ended vs diferenciálny, kanály ----
M(5, "Single-ended vs diferenciálny", "Ktoré tvrdenia o diferenciálnom režime AD prevodníka sú správne?",
  ["snímajú sa dva navzájom opačné signály a vyhodnocuje sa ich rozdiel", "súhlasné rušenie sa pri odčítaní odstráni", "prenos je pomalší, ale odolnejší voči rušeniu"],
  ["je rýchlejší ako single-ended", "rozlíšenie je v ňom obmedzené na 12 bitov", "signál je referencovaný voči VREFLO"],
  "Diferenciálny režim je pomalší, ale odstraňuje súhlasné rušenie; single-ended je rýchlejší, no s nižším rozlíšením a odolnosťou.");
S(5, "Single-ended vs diferenciálny", "Pre aký signál je vhodný single-ended režim?",
  "pre signál, ktorý nie je náchylný na rušenie alebo neprechádza dlhú trasu od zdroja k vstupu",
  ["pre signál s veľkým rušením na dlhom vedení", "pre signál, ktorý vyžaduje 16-bitové rozlíšenie", "iba pre signály z ADCIN14 a ADCIN15", "pre signály väčšie ako VREFHI"],
  "Výhodou single-ended režimu je rýchlosť; nevýhodou nižšie rozlíšenie (12 bitov) a nižšia odolnosť voči rušeniu.");
S(5, "Kanály", "Ktorá dvojica vstupov je platným diferenciálnym párom modulu Adca?",
  "ADCINA2 (kladný) a ADCINA3 (záporný)", ["ADCINA1 (kladný) a ADCINA2 (záporný)", "ADCINA3 (kladný) a ADCINA4 (záporný)", "ADCINA0 (kladný) a ADCINB1 (záporný)", "ADCINA5 (kladný) a ADCINA4 (záporný)"],
  "Páry sú pevné v rámci jedného modulu: y0/y1, y2/y3, y4/y5 … y14/y15; párny vstup je neinvertujúci, nepárny invertujúci.");
S(5, "Kanály", "Čo platí o vstupoch ADCIN14 a ADCIN15 mikrokontroléra TMS320F2837xD?",
  "sú spoločné pre všetky AD prevodníky", ["patria iba modulu Adcd", "sú to vstupy referenčných napätí", "dajú sa použiť iba v diferenciálnom režime ako záporné vstupy", "nie sú dostupné"],
  "Okrem 6 dedikovaných kanálov na modul má mikrokontrolér 2 vstupy ADCIN14 a ADCIN15 spoločné pre všetky moduly.");
S(5, "Kanály", "Akú hodnotu ADCSOCxCTL[CHSEL] možno v diferenciálnom režime použiť na výber páru ADCIN4 (kladný) a ADCIN5 (záporný)?",
  "4 alebo 5", ["iba 4", "iba 5", "iba 2", "8 alebo 9"],
  "Tab. 8.2: v diferenciálnom režime vyberá pár hodnota CHSEL 4 alebo 5 (obe vyberú ADCIN4 ako kladný a ADCIN5 ako záporný vstup).");
// ---- vzorkovacie okno ----
G(5, "Vzorkovacie okno", "num", () => {
  const f = pick([100, 150, 200]);
  const a = pick([14, 29, 59, 99, 149, 199]);
  const t = ((a + 1) / f) * 1000;
  return {
    text: `Systémové hodiny sú fSYSCLK = ${f} MHz a v ADCSOCxCTL je nastavené ACQPS = ${a}. Aká je veľkosť vzorkovacieho okna? Výsledok uveďte v ns.`,
    answer: round(t, 1), tol: 0.5, unit: "ns", alt: [],
    expl: `Tacq = (ACQPS + 1)/fSYSCLK = ${a + 1}/${f} MHz = ${round(t, 1)} ns.`,
  };
});
G(5, "Vzorkovacie okno", "num", () => {
  const ns = pick([300, 500, 1000, 1500, 2500]);
  const a = ns / 5 - 1;
  return {
    text: `Aká hodnota ACQPS je potrebná pre vzorkovacie okno ${ns} ns pri fSYSCLK = 200 MHz?`,
    answer: a, tol: 0, unit: "", alt: [],
    expl: `ACQPS + 1 = Tacq·fSYSCLK = ${ns} ns · 200 MHz = ${ns / 5}, takže ACQPS = ${a}.`,
  };
});
S(5, "Vzorkovacie okno", "Aký rozsah má pole ADCSOCxCTL[ACQPS] a aký to má dôsledok?",
  "9 bitov, takže pri 200 MHz je max. okno 512 cyklov = 2,56 µs", ["4 bity, takže max. okno je 16 cyklov", "16 bitov, takže okno môže mať až 65536 cyklov", "9 bitov, takže pri 200 MHz je max. okno 5,12 µs", "12 bitov, okno je vždy rovnaké"],
  "ACQPS má 9 bitov (0–511), okno = (ACQPS+1)·TSYSCLK, teda max. 512·5 ns = 2,56 µs.");
S(5, "Vzorkovacie okno", "Prečo sa analytický výpočet minimálneho vzorkovacieho okna v praxi zvyčajne nahrádza simuláciou vstupnej časti?",
  "pretože hodnoty charakterizujúce vstupnú impedanciu nie je triviálne získať",
  ["pretože okno je vždy pevných 75 ns", "pretože okno nezávisí od hardvéru", "pretože výpočet je zakázaný v 12-bitovom režime", "pretože ACQPS sa nastavuje iba pri výrobe"],
  "Výpočet v manuáli predpokladá známe hodnoty charakterizujúce vstupnú impedanciu; kniha odporúča nájsť vhodné okno simuláciou.");
// ---- vyhodnotenie výsledkov ----
G(5, "Vyhodnotenie", "num", () => {
  const r = pick([512, 1024, 1536, 2048, 2560, 3072]);
  const v = (3 * r) / 4096;
  const i = v / 0.5;
  return {
    text: `Snímač prúdu má citlivosť 500 mV/A a nulu pri 0 V, je pripojený na ADCINB2 (12-bitový single-ended režim, VREFHI = 3 V, VREFLO = 0 V). V ADCRESULT0 je hodnota ${r}. Aký prúd sa nameral? Výsledok uveďte v A.`,
    answer: round(i, 3), tol: 0.01, unit: "A", alt: [],
    expl: `VADCINB2 = 3·${r}/4096 = ${round(v, 4)} V; Imeas = V/Kcurr = ${round(v, 4)}/0,5 = ${round(i, 3)} A.`,
  };
});
G(5, "Vyhodnotenie", "num", () => {
  const r = pick([256, 512, 683, 1024, 1365]);
  const t = ((3 * r) / 4096) / 0.01;
  return {
    text: `Snímač teploty LM35 (10 mV/°C, 0 V pri 0 °C) je pripojený na ADCINB4 (12-bitový single-ended režim, VREFHI = 3 V). Výsledok prevodu je ${r}. Aká je teplota chladiča? Výsledok uveďte v °C.`,
    answer: round(t, 1), tol: 0.5, unit: "°C", alt: [],
    expl: `V = 3·${r}/4096 = ${round((3 * r) / 4096, 4)} V; T = V/Ktemp = ${round((3 * r) / 4096, 4)}/0,01 = ${round(t, 1)} °C.`,
  };
});
O(5, "Vyhodnotenie", "Zoraďte kroky vyhodnotenia prúdu zo snímača v praktickom príklade.",
  ["Prečítať výsledok prevodu z výsledkového registra ADCRESULT0", "Prepočítať výsledok na napätie podľa vzťahu pre 12-bitový single-ended režim", "Vydeliť napätie citlivosťou snímača Kcurr", "Použiť získaný prúd v regulácii meniča"],
  "Vyhodnotenie prebieha v dvoch krokoch: výsledok prevodu → napätie, napätie → prúd (Imeas = V/Kcurr).");
// ---- SOC, priorita ----
G(5, "Priorita konverzií", "num", () => {
  const last = R(0, 15);
  let a, b;
  do { a = R(0, 15); b = R(0, 15); } while (a === b || a === last || b === last);
  const d = (x) => (x - last - 1 + 16) % 16;
  const first = d(a) < d(b) ? a : b;
  return {
    text: `Posledný vykonaný prevod bol zo SOC${last}. Súčasne prídu požiadavky od SOC${a} a SOC${b} (všetky v kruhovej schéme bez vysokej priority). Číslo ktorého SOC sa obslúži ako prvé?`,
    answer: first, tol: 0, unit: "", alt: [],
    expl: `Najvyššiu prioritu má SOC nasledujúce po poslednom prevode (SOC${(last + 1) % 16}) a ďalej smerom k vyšším číslam (kruhovo). Bližšie je SOC${first}.`,
  };
});
S(5, "Priorita konverzií", "Aký je stav kruhovej priority po resete mikrokontroléra a ktoré SOC má najvyššiu prioritu?",
  "ukazovateľ smeruje na SOC15, preto má najvyššiu prioritu SOC0", ["ukazovateľ smeruje na SOC0, preto má najvyššiu prioritu SOC0", "ukazovateľ smeruje na SOC15, preto má najvyššiu prioritu SOC15", "priorita je po resete náhodná", "ukazovateľ smeruje na SOC8, preto má najvyššiu prioritu SOC8"],
  "Príklad z obr. 8.3: po resete ukazovateľ ukazuje na SOC15, takže ako prvé je na rade SOC0.");
S(5, "Priorita konverzií", "Čo sa stane, keď príde požiadavka od SOC nastaveného s vysokou prioritou počas bežnej kruhovej schémy?",
  "kruhová schéma sa preruší, obslúži sa SOC s vysokou prioritou a potom sa pokračuje od miesta prerušenia",
  ["SOC s vysokou prioritou sa obslúži až po všetkých ostatných", "kruhová schéma sa nenávratne zruší", "ukazovateľ sa resetuje na SOC15", "požiadavka sa ignoruje"],
  "Režim s vysokou prioritou umožňuje vybraným SOC prerušiť kruhovú schému; po obslúžení sa pokračuje od miesta prerušenia.");
// ---- prerušenie ----
S(5, "ADC prerušenia", "V akom prípade je vhodné vysielať EOC už po navzorkovaní signálu (a nie až po skončení prevodu)?",
  "keď sa v prerušení pred čítaním výsledku nachádza ešte niekoľko inštrukcií, ktoré dajú prevodníku čas dokončiť konverziu",
  ["keď sa výsledok číta ešte pred spustením prerušenia", "keď je zapnutý 16-bitový režim", "keď sa nepoužíva výsledkový register", "keď je vypnutá S/H jednotka"],
  "Skorší EOC skracuje latenciu: obsluha sa spustí skôr a výsledok je k dispozícii, keď sa k nemu program dostane.");
TF(5, "ADC prerušenia", "Prerušenie ADCy INT1 má v tabuľke prerušení najvyššiu prioritu, ostatné ADC prerušenia sú zaradené takmer na konci.", true,
  "ADCy_INT1 má najvyššiu prioritu v rámci tabuľky prerušení, INT2–INT4 sú až takmer na konci.");
S(5, "ADC prerušenia", "Čo spôsobí v praktickom príklade nastavenie INT1CONT = 0?",
  "vypne sa kontinuálny režim – príznak prerušenia nespustí novú konverziu", ["prerušenie sa trvale zakáže", "EOC sa vysiela po navzorkovaní", "SOC0 sa spustí od CpuTimer0", "AD prevodník sa vypne"],
  "Pri INT1CONT = 0 príznak ADCINT1 nespúšťa nový prevod; prerušenie samotné zapína INT1E.");
S(5, "ADC prerušenia", "Čo nastavuje v príklade riadok AdcbRegs.ADCCTL1.bit.INTPULSEPOS = 1?",
  "okamih požiadavky o prerušenie – na konci konverzie, keď je k dispozícii výsledok", ["zapnutie hodín pre modul ADCB", "výber kanála ADCINB2", "polaritu vstupného signálu", "veľkosť vzorkovacieho okna"],
  "INTPULSEPOS = 1 vyšle impulz prerušenia až na konci konverzie; výsledok je potom k dispozícii.");
// ---- zapnutie ----
S(5, "Zapnutie ADC", "V ktorom registri sa povoľujú hodiny pre moduly AD prevodníka?",
  "PCLKCR13", ["PCLKCR0", "PCLKCR2", "PCLKCR4", "ADCCTL2"],
  "Prvý krok zapnutia: zapnúť hodiny v registri PCLKCR13 (v príklade CpuSysRegs.PCLKCR13.bit.ADC_B = 1).");
TF(5, "Zapnutie ADC", "Pri zapínaní viacerých modulov ADC sa čakanie aspoň 500 µs vykonáva po každom module zvlášť.", false,
  "Kroky 1 až 3 sa vykonajú pre každý modul, ale čakanie (krok 4) iba raz po zapnutí všetkých potrebných modulov.");
// ---- kalibrácia ----
P(5, "Kalibrácia", "Priraďte systémovú kalibračnú rutinu k jej úlohe.", [
  ["Device_cal()", "kalibrácia referencie ADC, offsetu DAC a interných oscilátorov"],
  ["ADC_calADCAINL()", "kalibrácia linearity modulu ADCA"],
  ["ADC_calADCDINL()", "kalibrácia linearity modulu ADCD"],
  ["ADC_getOffsetTrim()", "kalibrácia offsetu modulov ADCA až ADCD"],
  ["getTempSenseSlope()", "prečítanie sklonu interného snímača teploty"],
  ["getTempSenseOffset()", "prečítanie offsetu interného snímača teploty"],
], "Podľa tab. 8.3; rutiny sú uložené v OTP pamäti a musí ich volať jadro CPU1 pred použitím AD prevodníka.");
TF(5, "Kalibrácia", "Kalibračné rutiny AD prevodníka musia byť zavolané jadrom CPU1 pred použitím AD prevodníka.", true,
  "Rutiny z OTP (tab. 8.3) sa volajú z CPU1 a používajú sa, ak sa prevádzkové hodnoty počas behu prepísali alebo vymazali.");
S(5, "Kalibrácia", "Ako prebieha manuálna (softvérová) kalibrácia offsetu AD prevodníka?",
  "niekoľkokrát sa vyhodnotí výsledok pri čítaní VREFLO (single-ended), resp. pri nakrátko prepojených vstupoch ADCINxP a ADCINxN (diferenciálny režim); výsledok sa použije pre ADCOFFTRIM",
  ["zmeria sa výsledok pri VREFHI a zapíše do ADCSOCxCTL", "prepíše sa OTP pamäť novými hodnotami", "zvýši sa frekvencia ADCCLK nad 50 MHz", "zmení sa počet SOC blokov"],
  "Manuálna kalibrácia určí offset z viacerých meraní nuly a výsledok slúži na nastavenie registrov ADCOFFTRIM.");
S(5, "Kalibrácia", "Prečo môže byť potrebná ďalšia kalibrácia, ak je snímač prúdu pripojený k ADC cez napäťový delič?",
  "delič posúva nulu a mení citlivosť snímača a kvôli tolerancii rezistorov sa vypočítané hodnoty nemusia zhodovať so skutočnými",
  ["delič zvyšuje frekvenciu hodín ADC", "delič mení rozlíšenie na 16 bitov", "pri deliči prestane fungovať S/H jednotka", "hodnoty výrobcu sa vždy zachovajú"],
  "Hodnoty garantované výrobcom snímača už po úprave neplatia; kalibruje sa referenčným prúdom, z ktorého sa určí nový offset a citlivosť.");
S(5, "Kalibrácia", "Ako sa kalibruje snímanie prúdu s pomocnými obvodmi podľa knihy?",
  "zdrojom referenčného prúdu, ktorý potečie snímačom; z prúdu a výsledkov ADC sa stanoví nový offset a citlivosť",
  ["zmenou rozlíšenia ADC na 16 bitov", "volaním Device_cal() po každej konverzii", "vypnutím prerušení od ADC", "predĺžením vzorkovacieho okna na 2560 ns"],
  "Referenčný prúd poskytne dvojicu známych hodnôt, z ktorých sa určia nové parametre prevodu (offset a citlivosť).");
// ---- praktický príklad ----
S(5, "Príklad prúd a teplota", "Prečo sa v príklade s meničom nesníma prúd v okamihu zhody časovej základne s komparačnou hodnotou?",
  "pretože sa pri každej zmene komparačnej hodnoty posúva okamih snímania a nie je konštantná doba vzorkovania",
  ["pretože v tom okamihu prúd v shunt rezistore nikdy netečie", "pretože ADC v tom okamihu nemá referenciu", "pretože zhoda nevyvolá signál ADCSOCA", "pretože EPWM3 nemá komparačný register"],
  "Pri zmene komparačnej hodnoty každú periódu by sa posúvali okamihy vzorkovania, kým riadenie potrebuje konštantnú dobu vzorkovania.");
S(5, "Príklad prúd a teplota", "V ktorom okamihu sa v príklade snímal prúd a aký to má prínos?",
  "keď časová základňa dosiahne 0; zabezpečí sa konštantná doba vzorkovania a odmeria sa približne stredná hodnota prúdu",
  ["pri zhode TBCTR s CMPA; odmeria sa maximálna hodnota prúdu", "pri TBCTR = TBPRD; odmeria sa iba pokojový prúd", "kedykoľvek náhodne; prínos je nižšia spotreba", "pri vypnutí spínača; odmeria sa nulový prúd"],
  "Trojuholníková časová základňa a vzorkovanie pri TBCTR = 0 dávajú pevný časový odstup vzoriek a približne strednú hodnotu prúdu.");
M(5, "Príklad prúd a teplota", "Ktoré nastavenia platia pre inicializáciu AD prevodníka v praktickom príklade (kód 8.1)?",
  ["používa sa modul ADCB", "SOC0 sníma prúd a spúšťa ho EPWM3 ADCSOCA", "SOC1 sníma teplotu a spúšťa ho CpuTimer0", "ADCCLK sa nastaví na 50 MHz"],
  ["SOC0 sníma teplotu a SOC1 prúd", "oba SOC sú spúšťané softvérom", "zvolený je 16-bitový diferenciálny režim", "ADCCLK sa nastaví na 5 MHz"],
  "Prúd je na ADCINB2 (SOC0, EPWM3 SOCA), teplota na ADCINB4 (SOC1, Timer0); 12-bitový single-ended režim a ADCCLK = 50 MHz.");
TF(5, "Príklad prúd a teplota", "Prúd shunt rezistorom tečie iba v čase, keď je výkonový spínač zapnutý, preto je potrebné synchronizovať PWM impulzy s AD prevodníkom.", true,
  "Snímanie prúdu má zmysel len počas zapnutia spínača, preto sa spúšťa od EPWM; teplota sa synchronizovať nemusí.");
G(5, "Príklad prúd a teplota", "num", () => {
  const f = pick([10, 20, 25, 40, 50]);
  const n = 250 * f;
  return {
    text: `Menič pracuje s PWM ${f} kHz a prúd sa vyhodnocuje každú periódu PWM. Teplota sa sníma každých 250 ms. Koľkokrát sa za jednu periódu snímania teploty vyhodnotí prúd?`,
    answer: n, tol: 0, unit: "", alt: [],
    expl: `Perióda PWM je 1/${f} kHz = ${round(1000 / f, 3)} µs; 250 ms / ${round(1000 / f, 3)} µs = ${n}.`,
  };
});
S(5, "Príklad prúd a teplota", "Kde bude v príklade uložený výsledok prevodu zo snímača teploty, ak ho zabezpečuje SOC1 v module ADCB?",
  "v AdcbResultRegs.ADCRESULT1", ["v AdcbResultRegs.ADCRESULT0", "v AdcaResultRegs.ADCRESULT1", "v AdcbRegs.ADCSOC1CTL", "v AdcbResultRegs.ADCRESULT4"],
  "Výsledok bloku SOCx sa ukladá do ADCRESULTx daného modulu, teda pre SOC1 v ADCB do AdcbResultRegs.ADCRESULT1.");
S(5, "Príklad prúd a teplota", "Ako dosiahnuť, aby sa snímanie teploty v príklade uskutočnilo ihneď po zosnímaní prúdu?",
  "nastaviť rovnaký spúšťací signál (TRIGSEL = EPWM3 ADCSOCA) aj pre SOC1; bloky sa vykonajú postupne podľa kruhovej schémy",
  ["nastaviť pre SOC1 spúšťanie od CpuTimer0 s kratšou periódou", "zvýšiť ACQPS pre SOC0", "prepnúť na burst mód a vypnúť SOC0", "zameniť čísla kanálov v CHSEL"],
  "Oba SOC sa spustia tým istým signálom a vykonajú sa za sebou podľa kruhovej priority; stačí zmena TRIGSEL v SOC1.");

// ---- učebnica: prednáška 6 ----
/* ---- Prednáška 6 – nové šablóny (kapitola 9) ---- */
TF(6, "Princíp snímača", "Nulová (referenčná) značka je na celom rozsahu pohybu zvyčajne vyznačená iba jedenkrát a môže vyznačovať nulovú polohu.", true,
  "Kniha uvádza nulovú značku ako najpoužívanejšiu pomocnú značku, ktorá je na celom rozsahu zvyčajne len 1x.");
S(6, "Vyhodnotenie stôp", "Ako sa v stavovom diagrame kvadratúrneho vyhodnotenia (stavy (A,B)) posudzuje prechod, ktorý nie je vyznačený ani v jednom smere?",
  "ako poruchový stav", ["ako zmena smeru otáčania", "ako nulová značka", "ako pretečenie čítača", "ako normálny inkrement"],
  "Medzi stavmi (1,1), (0,1), (0,0), (1,0) je možné prechádzať len podľa vyznačeného smeru; akýkoľvek iný prechod je poruchový stav.");
G(6, "Lineárny snímač", "num", () => {
  const dres = pick([1, 2, 5, 10, 20]), n = R(200, 60000);
  const d = dres * n / 1000;
  return {
    text: `Lineárny inkrementálny snímač má rozlíšenie ${dres} µm medzi dvoma inkrementami (po kvadratúrnom vyhodnotení). Čítač inkrementov má od okamihu homingu hodnotu ${fmt(n)}. Akú vzdialenosť od počiatočnej polohy snímač nameral v milimetroch?`,
    answer: d, alt: [], tol: Math.max(0.01, d * 0.002), unit: "mm",
    expl: `d = d_res · n_ctr = ${dres} µm · ${fmt(n)} = ${fmt(dres * n)} µm = ${fmt(round(d, 3))} mm.`,
  };
});
S(6, "Homing", "Prečo je pri riadení polohy tlačového stola 3D tlačiarne s inkrementálnym snímačom po zapnutí napájania nutné zistiť počiatočnú polohu?",
  "čítač má po zapnutí hodnotu 0 nezávisle od toho, kde sa stôl skutočne nachádza", ["snímač po zapnutí napájania stráca kalibráciu rozlíšenia", "čítač po zapnutí obsahuje náhodnú hodnotu zo Flash", "snímač pošle absolútnu polohu až po 1 s", "mikrokontrolér po zapnutí zakáže eQEP"],
  "Inkrementálny snímač dáva len relatívnu polohu, preto sa stôl presunie na koncový spínač (active homing) a táto poloha sa zapíše ako počiatočná.");
S(6, "Rýchlosť", "Kedy má metóda v = Xs/ΔT (meranie času na definovanej vzdialenosti) veľkú relatívnu chybu?",
  "keď je odmeraný čas veľmi malý (vysoké rýchlosti)", ["keď je odmeraný čas veľmi veľký", "keď sa snímač pohybuje pomaly", "keď má snímač nízke rozlíšenie", "keď sa používa nulová značka"],
  "Pri krátkych časoch je relatívna chyba merania času veľká; naopak je metóda vhodná pre nízke rýchlosti.");
G(6, "Rýchlosť", "num", () => {
  const k1 = R(14, 19), k2 = R(1, 5), Ts = pick([10, 20, 50]);
  const w = (k2 - k1 + 20) * 0.1 * Math.PI / (Ts / 1000);
  return {
    text: `Rotačný snímač s čítačom, ktorého maximum zodpovedá jednej otáčke (0 až 2π), sa otáča v kladnom smere. V dvoch po sebe idúcich vzorkách je poloha φ1 = ${round(k1 * 0.1, 1)}π a φ2 = ${round(k2 * 0.1, 1)}π (medzi nimi nastalo pretečenie čítača). Ts = ${Ts} ms. Aká je uhlová rýchlosť v rad/s?`,
    answer: w, alt: [], tol: Math.max(0.05, Math.abs(w) * 0.005), unit: "rad/s",
    expl: `Pri pretečení sa k Δφ pripočíta maximum: ω = (φ2 − φ1 + 2π)/Ts = (${round(k2 * 0.1, 1)}π − ${round(k1 * 0.1, 1)}π + 2π)/${Ts / 1000} = ${round(w, 2)} rad/s.`,
  };
});
G(6, "Rýchlosť", "num", () => {
  const k1 = R(1, 5), k2 = R(14, 19), Ts = pick([10, 20, 50]);
  const w = (k2 - k1 - 20) * 0.1 * Math.PI / (Ts / 1000);
  return {
    text: `Rotačný snímač s čítačom, ktorého maximum zodpovedá jednej otáčke (0 až 2π), sa otáča v zápornom smere. V dvoch po sebe idúcich vzorkách je poloha φ1 = ${round(k1 * 0.1, 1)}π a φ2 = ${round(k2 * 0.1, 1)}π (medzi nimi nastalo podtečenie čítača). Ts = ${Ts} ms. Aká je uhlová rýchlosť v rad/s (so znamienkom)?`,
    answer: w, alt: [], tol: Math.max(0.05, Math.abs(w) * 0.005), unit: "rad/s",
    expl: `Pri podtečení sa od Δφ odpočíta maximum: ω = (φ2 − φ1 − 2π)/Ts = (${round(k2 * 0.1, 1)}π − ${round(k1 * 0.1, 1)}π − 2π)/${Ts / 1000} = ${round(w, 2)} rad/s.`,
  };
});
TF(6, "Rýchlosť", "Ak sa medzi dvoma vzorkami zmenil smer otáčania, vzorec ω = Δφ/Ts dáva správnu rýchlosť, lebo Δφ obsahuje súčet všetkých pohybov.", false,
  "Pri zmene smeru sa pohyb medzi vzorkami musel zastaviť; Δφ nezachytí prejdenú dráhu, preto sa rýchlosť považuje za nulovú alebo sa použije meranie času.");
S(6, "eQEP – dekódovanie", "Na ktorý vstup eQEP sa pripája strobe signál (napr. z koncového spínača)?",
  "EQEPxSIN", ["EQEPxIIN", "EQEPxAIN", "EQEPxBIN", "EQEPxSOUT"],
  "Stopa A → EQEPxAIN, stopa B → EQEPxBIN, nulová značka → EQEPxIIN a strobe → EQEPxSIN.");
S(6, "eQEP – dekódovanie", "Na čo je v dekódovacej jednotke užitočná možnosť interne prehodiť stopu A a stopu B?",
  "keď je snímač mechanicky otočený a ukazuje opačný smer, než sa očakáva", ["na zvýšenie rozlíšenia na 8x CPR", "na prepnutie z TTL na HTL logiku", "na zapnutie QEP watchdogu", "na zmenu rozsahu čítača QPOSMAX"],
  "Prehodením stôp sa obráti vyhodnotený smer bez zásahu do zapojenia; nastavuje sa v registri QDECCTL.");
S(6, "eQEP – čítač", "Aká hodnota sa nastaví v čítači, ak príde požiadavka na reset pri zápornom smere pohybu?",
  "maximálna hodnota z registra QPOSMAX", ["0", "hodnota z QPOSINIT", "hodnota z QPOSCMP", "zostane nezmenená"],
  "Pri kladnom smere sa reset prejaví nulou, pri zápornom hodnotou QPOSMAX; podobne pri podtečení sa nastaví QPOSMAX.");
S(6, "eQEP – čítač", "Aká je výhoda inicializácie čítača cez QPOSINIT oproti priamemu zápisu do QPOSCNT?",
  "je povolená aj počas pohybu a prebieha na HW úrovni, takže načasovanie je presnejšie", ["nevyžaduje nastavenie registra QEPCTL", "funguje len pri vypnutom čítači", "automaticky zapne watchdog", "zväčší rozlíšenie snímača"],
  "Inicializácia na HW udalosť (nulová značka, strobe, SWI) nevyžaduje softvérové overovanie stavu ani skok do prerušenia.");
M(6, "eQEP – čítač", "Na čo možno využiť komparačnú jednotku (Position-compare unit) v eQEP?",
  ["pri zhode QPOSCNT s QPOSCMP vyslať požiadavku na prerušenie", "pri zhode vyslať fyzický signál PCSOUT cez GPIO", "rýchlo zastaviť pohyb pri prekročení dovoleného rozsahu", "synchronizovať iné zariadenia signálom PCSOUT"],
  ["merať čas medzi dvoma inkrementmi", "invertovať stopy A a B", "generovať PWM signál pre motor"],
  "Zhoda čítača s hodnotou QPOSCMP sa vyhodnocuje v HW opakovane pri každej zhode; nastavuje sa v QPOSCTL.");
M(6, "QEP watchdog", "Aké môžu byť príčiny pretečenia časovača QEP watchdogu (nastavenia príznaku WTO)?",
  ["porucha snímača", "strata signálov zo snímača", "cielené zastavenie riadeného pohybu"],
  ["pretečenie čítača QPOSCNT", "zmena smeru otáčania", "príchod strobe impulzu"],
  "Watchdog sa resetuje každým inkrementom; ak neprichádzajú, nevie rozlíšiť poruchu od cieleného zastavenia, preto sa to musí rozlišovať v aplikácii.");
G(6, "QEP watchdog", "num", () => {
  const f = pick([100, 150, 200]);
  const t = 65536 * 64 / (f * 1e6) * 1000;
  return {
    text: `Časovač QEP watchdogu je 16-bitový a je časovaný systémovými hodinami SYSCLKOUT = ${f} MHz cez deličku 1/64. Za aký čas (bez príchodu inkrementu) pretečie? Výsledok v milisekundách.`,
    answer: t, alt: [], tol: Math.max(0.05, t * 0.005), unit: "ms",
    expl: `t = 65536 · 64 / ${f} MHz = ${fmt(65536 * 64)} / ${fmt(f * 1e6)} Hz = ${round(t, 2)} ms.`,
  };
});
G(6, "Unit timer", "num", () => {
  const f = pick([100, 150, 200]), Ts = pick([0.5, 1, 2, 5]);
  const q = f * 1e6 * Ts / 1000;
  return {
    text: `Unit timer je časovaný systémovými hodinami SYSCLKOUT = ${f} MHz. Akú hodnotu treba zapísať do QUPRD, aby sa požiadavka na prerušenie vysielala s periódou ${Ts} ms? (Pozn.: v knihe je pre 200 MHz a 1 ms zapísané QUPRD = 200000.)`,
    answer: q, alt: [], tol: 0, unit: "",
    expl: `QUPRD = f · Ts = ${fmt(f * 1e6)} Hz · ${Ts / 1000} s = ${fmt(q)}.`,
  };
});
S(6, "Prerušenia eQEP", "Prečo sa v obsluhe prerušenia eQEP čistia príznaky od najnižšej úrovne po najvyššiu (UTO → INT → PIEACK)?",
  "inak by sa prerušenie vyvolalo navyše ešte raz a skôr, ako reálne príde nová požiadavka", ["inak by sa vymazal obsah QPOSCNT", "inak by sa vypol Unit timer", "inak by sa stratila hodnota QCPRD", "inak by sa prerušenie nikdy nepovolilo"],
  "Ak by sa vyčistil vyšší stupeň skôr, nižší príznak stále drží požiadavku a prerušenie by sa ihneď opakovane vyvolalo.");
G(6, "Praktický príklad", "num", () => {
  const bits = pick([10, 11, 12, 13]), jg = pick([16, 32, 64, 100]);
  const nenc = 2 ** bits, n = R(2000, 400000);
  const deg = 360 * n / (nenc * jg);
  return {
    text: `Otočný stôl poháňa motor cez prevodovku s prevodom ${jg}:1 (do pomala). Snímač na hriadeli motora má rozlíšenie ${bits} bitov (n_enc = 2^${bits} inkrementov na otáčku motora). Čítač QPOSCNT obsahuje ${fmt(n)}. Aká je poloha otočného stola v stupňoch? (φ_out = 2π·n_ctr/(n_enc·j_g))`,
    answer: deg, alt: [], tol: Math.max(0.02, deg * 0.002), unit: "°",
    expl: `φ_out = 360° · ${fmt(n)} / (${fmt(nenc)} · ${jg}) = ${round(deg, 3)}°.`,
  };
});
G(6, "Praktický príklad", "num", () => {
  const bits = pick([10, 11, 12, 13]), jg = pick([16, 32, 64, 100]);
  const nenc = 2 ** bits, dphi = 2 * Math.PI / (nenc * jg) * 1e6;
  return {
    text: `Snímač s rozlíšením ${bits} bitov je na hriadeli motora, ktorý otáča stôl cez prevodovku ${jg}:1. Aká je najmenšia detekovateľná zmena polohy stola (o jeden inkrement) v mikroradiánoch (µrad)?`,
    answer: dphi, alt: [], tol: Math.max(0.02, dphi * 0.01), unit: "µrad",
    expl: `Δφ_min = 2π/(n_enc·j_g) = 2π/(${fmt(nenc)}·${jg}) = ${round(dphi, 2)} µrad (pre 12 bitov a 64:1 je to v knihe 23,97 µrad).`,
  };
});
G(6, "Praktický príklad", "num", () => {
  const bits = pick([10, 11, 12, 13]), jg = pick([16, 32, 64, 100]), Ts = pick([0.5, 1, 2, 5]);
  const nenc = 2 ** bits, rpm = 60 / (nenc * jg * Ts / 1000);
  return {
    text: `Snímač s rozlíšením ${bits} bitov (n_enc = 2^${bits}) je na hriadeli motora, prevodovka ${jg}:1, doba vzorkovania Ts = ${Ts} ms. Aké je rozlíšenie rýchlosti otáčania stola pri metóde ω = Δφ/Ts (zmena o jeden inkrement za Ts)? Výsledok v otáčkach za minútu.`,
    answer: rpm, alt: [], tol: Math.max(0.0005, rpm * 0.01), unit: "rpm",
    expl: `ω_min = Δφ_min/Ts, n = 60/(n_enc·j_g·Ts) = 60/(${fmt(nenc)}·${jg}·${Ts / 1000}) = ${round(rpm, 4)} rpm (pre 12 bitov, 64:1, 1 ms ≈ 0,229 rpm).`,
  };
});
S(6, "Praktický príklad", "Prečo sa v praktickom príklade nastavuje QPOSMAX = 64·4096, a nie len 4096?",
  "aby sa čítač resetoval až po jednej celej otáčke stola a počet inkrementov priamo udával polohu stola", ["aby sa zväčšilo rozlíšenie snímača 64-krát", "aby sa nevyžadovala nulová značka", "pretože QPOSMAX nesmie byť menší ako 64", "aby sa zrušilo pretečenie čítača"],
  "Pri QPOSMAX = 4096 by sa čítač resetoval 64-krát počas jednej otáčky stola, pretože motor potrebuje 64 otáčok na 1 otáčku stola.");
O(6, "Praktický príklad", "Zoraďte logické kroky inicializácie modulu eQEP podľa praktického príkladu (od prvého po posledný).",
  ["Nastaviť funkciu GPIO pinov a povoliť hodiny eQEP1", "Nastaviť kvadratúrny režim dekódovania", "Nastaviť režim resetu čítača a hodnotu QPOSMAX", "Nastaviť inicializáciu čítača strobe signálom a QPOSINIT", "Nastaviť deličky Edge capture a periódu Unit timera (QUPRD)", "Zapnúť čítač (QPEN), Edge capture (CEN) a Unit timer (UTE)"],
  "Konfigurácia sa dokončí pred aktiváciou; čítač je po zapnutí hodín neaktívny a zapína sa až nakoniec bitmi QPEN, CEN a UTE.");
O(6, "Praktický príklad", "Zoraďte kroky obslužnej funkcie prerušenia eQEP z praktického príkladu.",
  ["Prečítať QPOSCNT, prepočítať polohu a prečítať smer (QDF)", "Vypočítať zmenu polohy od predchádzajúceho prerušenia", "Upraviť zmenu polohy pri pretečení (PCO) alebo podtečení (PCU)", "Vypočítať rýchlosť priamou a nepriamou metódou", "Uložiť aktuálnu polohu do statickej premennej", "Vyčistiť príznaky (UTO, INT, PIEACK)"],
  "Statická premenná uchová polohu do ďalšieho prerušenia; príznaky sa čistia na konci od najnižšej úrovne po najvyššiu.");
P(6, "Registre eQEP", "Priraďte register eQEP k jeho úlohe.", [
  ["QDECCTL", "režim dekódovania a úpravy vstupných signálov"], ["QEPCTL", "zapnutie čítača, režim resetu a inicializácie čítača"],
  ["QPOSMAX", "maximálna hodnota čítača polohy"], ["QPOSCMP", "porovnávacia hodnota komparačnej jednotky"],
  ["QCPRD", "posledný odmeraný čas medzi udalosťami UPEVNT"], ["QEINT", "povolenie jednotlivých zdrojov prerušenia"],
  ["QCLR", "čistenie príznakov z registra QFLG"],
], "Každý register má v eQEP svoju úlohu: QDECCTL a QEPCTL konfigurujú dekódovanie a čítač, QEINT/QCLR obsluhujú prerušenia, QPOSMAX/QPOSCMP/QCPRD sú dátové registre.");
P(6, "Submoduly eQEP", "Priraďte submodul eQEP k jeho úlohe.", [
  ["Quadrature decoder unit (QDU)", "získa inkrementy, smer a upravené signály zo stôp snímača"], ["Position counter/control unit (PCCU)", "počíta inkrementy a rieši reset a inicializáciu čítača"],
  ["Unit timer (UTIME)", "pravidelné prerušenie pre pevnú dobu vzorkovania"], ["Edge capture (QCAP)", "meranie času pre nízke rýchlosti"],
  ["QEP watchdog", "detekcia zastavenia pohybu (chýbajúcich inkrementov)"],
], "Blok eQEP tvoria dekódovacia jednotka, čítač, Edge capture, Unit timer a watchdog; každý rieši inú časť spracovania snímača.");