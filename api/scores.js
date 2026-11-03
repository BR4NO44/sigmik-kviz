// Vercel serverless funkcia: rebríček podľa počtu správnych odpovedí (Upstash Redis cez REST API).
// Premenné prostredia pridá Vercel sám po pripojení Upstash Redis (Marketplace → Storage).
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
// hashe: meno (malými písmenami) → hodnota
const K = { name: "kviz:n", correct: "kviz:c", answered: "kviz:a", tests: "kviz:t" };

async function pipeline(cmds) {
  const r = await fetch(URL_.replace(/\/$/, "") + "/pipeline", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return (await r.json()).map((x) => x.result);
}

const toMap = (flat) => {
  const m = {};
  for (let i = 0; i + 1 < (flat || []).length; i += 2) m[flat[i]] = flat[i + 1];
  return m;
};

async function readBoard() {
  const [names, c, a, t] = (await pipeline([
    ["HGETALL", K.name], ["HGETALL", K.correct], ["HGETALL", K.answered], ["HGETALL", K.tests],
  ])).map(toMap);
  const rows = Object.keys(c).map((k) => {
    const correct = +c[k] || 0, answered = +a[k] || 0;
    return { name: names[k] || k, correct, answered, tests: +t[k] || 0, pct: answered ? correct / answered : 0 };
  });
  rows.sort((x, y) => y.correct - x.correct || y.pct - x.pct);
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
    const correct = parseInt(d.correct, 10);
    const answered = parseInt(d.answered, 10);
    if (!name || !(answered >= 1 && answered <= 1000) || !(correct >= 0 && correct <= answered)) {
      return res.status(400).json({ error: "bad request" });
    }
    const key = name.toLowerCase();
    await pipeline([
      ["HSET", K.name, key, name],
      ["HINCRBY", K.correct, key, correct],
      ["HINCRBY", K.answered, key, answered],
      ["HINCRBY", K.tests, key, 1],
    ]);
    return res.status(200).json({ board: await readBoard() });
  } catch (e) {
    return res.status(500).json({ error: "server error" });
  }
};
