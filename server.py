#!/usr/bin/env python3
"""Jednoduchý server: servíruje kvíz a ukladá najlepšie výsledky do scores.json (bez databázy)."""
import json, os, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(HERE, "scores.json")
LOCK = threading.Lock()


def load():
    try:
        with open(FILE, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def valid(r):
    return all(k in r for k in ("pct", "total", "score", "secs", "name"))


def board(data):
    rows = sorted((r for r in data.values() if valid(r)), key=lambda r: (-r["pct"], r["secs"]))
    return rows[:50]


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=HERE, **kw)

    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?")[0] == "/api/scores":
            with LOCK:
                return self._json(board(load()))
        if self.path.split("?")[0] in ("/scores.json", "/server.py"):
            return self.send_error(404)
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/scores":
            return self.send_error(404)
        try:
            n = int(self.headers.get("Content-Length", 0))
            d = json.loads(self.rfile.read(min(n, 4096)))
            name = str(d["name"]).strip()[:20]
            score = round(float(d["score"]), 2)
            secs = max(0, int(d["secs"]))
            total = int(d["total"])
            assert name and 10 <= total <= 100 and 0 <= score <= total
        except Exception:
            return self._json({"error": "bad request"}, 400)
        key = name.lower()
        with LOCK:
            data = load()
            old = data.get(key)
            pct = score / total
            improved = old is None or pct > old["pct"] or (pct == old["pct"] and secs < old["secs"])
            if improved:
                data[key] = {"name": name, "score": score, "total": total, "pct": pct, "secs": secs, "date": time.strftime("%Y-%m-%d %H:%M")}
                tmp = FILE + ".tmp"
                with open(tmp, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=1)
                os.replace(tmp, FILE)
            return self._json({"improved": improved, "board": board(data)})


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
