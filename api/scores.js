// Vercel serverless funkcia: rebríček najlepších výsledkov (uložený v Upstash Redis cez REST API).
// Premenné prostredia pridá Vercel sám po pripojení Upstash Redis (Marketplace → Storage).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "kviz:scores";

async function redis(...cmd) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return (await r.json()).result;
}

async function readBoard() {
  const flat = (await redis("HGETALL", KEY)) || [];
  const rows = [];
  for (let i = 1; i < flat.length; i += 2) {
    try { rows.push(JSON.parse(flat[i])); } catch (e) { /* preskoč poškodený záznam */ }
  }
  rows.sort((a, b) => b.pct - a.pct || a.secs - b.secs);
  return rows.slice(0, 50);
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!URL_ || !TOKEN) return res.status(503).json({ error: "Databáza nie je pripojená" });
  try {
    if (req.method === "GET") return res.status(200).json(await readBoard());
    if (req.method !== "POST") return res.status(405).json({ error: "method" });

    const d = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const name = String(d.name ?? "").trim().slice(0, 20);
    const score = Math.round(Number(d.score) * 100) / 100;
    const total = parseInt(d.total, 10);
    const secs = Math.max(0, parseInt(d.secs, 10));
    if (!name || !(total >= 10 && total <= 100) || !(score >= 0 && score <= total) || !Number.isFinite(secs)) {
      return res.status(400).json({ error: "bad request" });
    }
    const key = name.toLowerCase();
    const pct = score / total;
    const oldRaw = await redis("HGET", KEY, key);
    let improved = true;
    if (oldRaw) {
      const old = JSON.parse(oldRaw);
      improved = pct > old.pct || (pct === old.pct && secs < old.secs);
    }
    if (improved) {
      const date = new Date().toISOString().slice(0, 16).replace("T", " ");
      await redis("HSET", KEY, key, JSON.stringify({ name, score, total, pct, secs, date }));
    }
    return res.status(200).json({ improved, board: await readBoard() });
  } catch (e) {
    return res.status(500).json({ error: "server error" });
  }
};
