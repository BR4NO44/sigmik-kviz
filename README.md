# Kvíz – Signálové mikrokontroléry

Generátor testu (ABCD, viac správnych, pravda/nepravda, číselné, slovné, dopĺňanie kódu, zoraďovanie, priraďovanie) z prednášok 1–6 predmetu Signálové mikrokontroléry (TMS320F2837xD). Rebríček počíta správne odpovede na meno hráča.

## Lokálne spustenie (rebríček v súbore `scores.json`)
```
./spusti.command      # http://localhost:8080
```

## Nasadenie na Vercel
1. Importuj repozitár vo Verceli (Framework: *Other*, bez build príkazu).
2. V projekte: **Storage → Create → Upstash Redis** (Marketplace) a pripoj ho k projektu – premenné `KV_REST_API_URL` a `KV_REST_API_TOKEN` sa pridajú automaticky.
3. Redeploy. Funkcia `api/scores.js` ukladá rebríček do Redisu.

Bez pripojenej databázy kvíz funguje, len rebríček hlási, že nie je dostupný.
