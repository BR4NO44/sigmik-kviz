# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Quiz generator (Slovak UI and content) for the course "Signálové mikrokontroléry" (TMS320F2837xD), lectures 1–6. User-facing text, questions and explanations are in Slovak; keep it that way. The source lecture PDFs are intentionally NOT in this repo (public GitHub repo `BR4NO44/sigmik-kviz`).

## Commands

No build, lint or test tooling. Plain static files, vanilla JS.

- Local run (static + leaderboard in `scores.json`): `./spusti.command` or `python3 server.py` → http://localhost:8080
- Production: Vercel auto-deploys on push to `main` (https://sigmik-kviz.vercel.app). No build command (framework *Other*).

## Architecture

Visual theme (minimal Linear/Notion-like: neutral greys, single blue accent, 1px borders instead of shadows, Inter font, light + dark via `prefers-color-scheme`) lives in `style.css` CSS variables; the UI relies on `:has()` for checked states. The full architecture diagrams (Mermaid) are in `README.md`; keep them in sync when changing architecture.

`index.html` loads, in order: `questions.js` → `expl.js` → `app.js` (globals, no modules; order matters).

- **`questions.js`** – question bank. `BANK` is an array of definitions `{lec, topic, type, make()}`; `make()` returns a fresh instance each call, so parametric questions (random timer periods, ADC values, etc.) differ per generation. Added via helpers `G` (raw), `S` (single), `M` (multi), `TF`, `T` (text, currently unused – register/bit-name recall questions were deliberately replaced with ABCD), `N` (numeric), `O` (order), `P`(and other helpers defined at top). Question types: single, multi, tf, num, text, select (dropdown code completion, incl. SVG waveform), order, match. `LECTURES` maps lecture number → title.
- **`expl.js`** – `EXPL` array of `[substring of question text, short explanation]`. At load it wraps every `BANK` def's `make()` so that questions lacking `q.expl` get one by substring match. Every question must end up with an explanation (shown in review, even for correct answers); when adding a question, either pass `expl` in the helper or add an `EXPL` entry.
- **`app.js`** – all UI/state: `buildTest(lectures, TOTAL)` (greedy lecture-balanced selection with a type-quota sequence), `grade` (partial scoring), `renderQuestion`, `showStart` (lecture checkboxes, Test/Tréning mode, question count from `COUNTS`), `finish()` → `submitScore(correct, answered)` → `showResults`, name modal (`localStorage` key `kviz-meno`), leaderboard (`fetchBoard`, `boardCard`). Every finished test (Test and Tréning, any length) adds its fully-correct count and answered count to the player's running totals; unanswered questions are not counted.
- **Leaderboard backend (two interchangeable implementations of `/api/scores`)**:
  - `server.py` – local ThreadingHTTPServer, accumulates per-name totals (lowercase key) in `scores.json` (gitignored); blocks `/scores.json` and `/server.py`.
  - `api/scores.js` – Vercel serverless function (CommonJS) using Upstash Redis REST (`KV_REST_API_URL`/`KV_REST_API_TOKEN` or `UPSTASH_REDIS_REST_*`); returns 503 if env vars are missing.
  - Both must keep the same contract: POST `{name, correct, answered}` (name ≤ 20 chars, 1 ≤ answered ≤ 1000, 0 ≤ correct ≤ answered) accumulates per lowercase name; GET returns rows `{name, correct, answered, tests, pct}` sorted by correct desc, then pct. Redis keys: `kviz:n` (display names), `kviz:c`, `kviz:a`, `kviz:t` (HINCRBY counters). Change one implementation → change the other.

## Template IDs and practice list

`app.js` assigns each `BANK` def an id `<lec>.<n>` (n = order within that lecture in `BANK`). Players' mistakes are stored by these ids (`/api/wrong`, Redis set `kviz:w:<lowercase-name>`, local `wrong.json`). **Only append new questions at the end of `questions.js`; never delete/reorder existing ones**, or stored ids point to the wrong questions. Book-derived questions are in the block at the end of `questions.js`, starting at `const BOOK_FROM = BANK.length;` – `app.js` marks defs from that index on as `src = "kniha"` (optional in the UI, off by default); everything before it is "prezentacie" (always included). Keep new presentation-based questions before that marker only if you accept shifting ids – otherwise append after it and they count as book questions.

## Notes

- `.vercelignore` excludes `server.py`, `spusti.command`, `scores.json`, `README.md` from the Vercel deployment.
- Test records written to the live Redis can only be removed in the Upstash console (`HDEL kviz:c <lowercase-name>` and the same for `kviz:a`, `kviz:t`, `kviz:n`); there is no delete endpoint.
- Never commit secrets; `.env*`, `.vercel`, `scores.json` are gitignored.
