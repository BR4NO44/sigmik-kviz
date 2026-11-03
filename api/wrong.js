// Otázky, v ktorých sa hráč pomýlil (na precvičenie). Uložené v Upstash Redis ako množina na meno hráča.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ID = /^[1-9]\.\d{1,4}$/;

async function redis(...cmd) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return (await r.json()).result;
}

const clean = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === "string" && ID.test(x)).slice(0, 200) : []);

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!URL_ || !TOKEN) return res.status(503).json({ error: "Databáza nie je pripojená" });
  try {
    let name;
    let add = [], remove = [];
    if (req.method === "GET") {
      name = String((req.query && req.query.name) ?? "");
    } else if (req.method === "POST") {
      const d = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      name = String(d.name ?? "");
      add = clean(d.add);
      remove = clean(d.remove);
    } else return res.status(405).json({ error: "method" });
    name = name.trim().slice(0, 20).toLowerCase();
    if (!name) return res.status(400).json({ error: "bad request" });
    const key = "kviz:w:" + name;
    if (add.length) await redis("SADD", key, ...add);
    if (remove.length) await redis("SREM", key, ...remove);
    return res.status(200).json({ ids: (await redis("SMEMBERS", key)) || [] });
  } catch (e) {
    return res.status(500).json({ error: "server error" });
  }
};
