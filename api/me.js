// Zapamätanie mena zariadenia: meno sa uloží do dlhodobej cookie (400 dní), aby ho stránka poznala
// aj po vymazaní localStorage alebo po dlhšej neprítomnosti (Safari maže úložisko stránok po 7 dňoch).
const COOKIE = "kviz_name";
const MAX_AGE = 400 * 24 * 3600;

module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    const m = new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]*)").exec(req.headers.cookie || "");
    let name = "";
    try { name = m ? decodeURIComponent(m[1]) : ""; } catch (e) { /* poškodená cookie */ }
    return res.status(200).json({ name: name.slice(0, 20) });
  }
  if (req.method === "POST") {
    const d = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const name = String(d.name ?? "").trim().slice(0, 20);
    if (!name) return res.status(400).json({ error: "bad request" });
    res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(name)}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax; Secure; HttpOnly`);
    return res.status(200).json({ name });
  }
  return res.status(405).json({ error: "method" });
};
