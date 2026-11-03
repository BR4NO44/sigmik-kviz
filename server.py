#!/usr/bin/env python3
"""Jednoduchý server: servíruje kvíz a ráta správne odpovede na meno do scores.json (bez databázy)."""
import json, os, threading
from http.cookies import SimpleCookie
import re
from urllib.parse import parse_qs, quote, unquote, urlparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
FILE = os.path.join(HERE, "scores.json")
WRONG = os.path.join(HERE, "wrong.json")  # otázky na precvičenie: meno → [id…]
LOCK = threading.Lock()


def load():
    try:
        with open(FILE, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def load_wrong():
    try:
        with open(WRONG, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def wrong_api(name, add=(), remove=()):
    """Rovnaký kontrakt ako api/wrong.js."""
    key = name.strip()[:20].lower()
    if not key:
        return None
    with LOCK:
        data = load_wrong()
        ids = set(data.get(key, []))
        ids |= {x for x in add if isinstance(x, str) and re.fullmatch(r"[1-9]\.\d{1,4}", x)}
        ids -= set(remove)
        if add or remove:
            data[key] = sorted(ids)
            tmp = WRONG + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=1)
            os.replace(tmp, WRONG)
        return sorted(ids)


def board(data):
    rows = []
    for r in data.values():
        if not all(k in r for k in ("name", "correct", "answered", "tests")):
            continue
        rows.append(dict(r, pct=(r["correct"] / r["answered"]) if r["answered"] else 0))
    rows.sort(key=lambda r: (-r["correct"], -r["pct"]))
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

    def _me(self, name=None):
        """Dlhodobá cookie s menom zariadenia (rovnaký kontrakt ako api/me.js)."""
        if name is None:
            c = SimpleCookie(self.headers.get("Cookie", ""))
            return self._json({"name": unquote(c["kviz_name"].value)[:20] if "kviz_name" in c else ""})
        body = json.dumps({"name": name}, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Set-Cookie", "kviz_name=%s; Max-Age=%d; Path=/; SameSite=Lax; HttpOnly" % (quote(name), 400 * 24 * 3600))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.split("?")[0] == "/api/wrong":
            name = parse_qs(urlparse(self.path).query).get("name", [""])[0]
            ids = wrong_api(name)
            return self._json({"ids": ids}) if ids is not None else self._json({"error": "bad request"}, 400)
        if self.path.split("?")[0] == "/api/me":
            return self._me()
        if self.path.split("?")[0] == "/api/scores":
            with LOCK:
                return self._json(board(load()))
        if self.path.split("?")[0] in ("/scores.json", "/wrong.json", "/server.py"):
            return self.send_error(404)
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/wrong":
            try:
                d = json.loads(self.rfile.read(min(int(self.headers.get("Content-Length", 0)), 16384)))
                ids = wrong_api(str(d["name"]), list(d.get("add", []))[:200], list(d.get("remove", []))[:200])
                assert ids is not None
            except Exception:
                return self._json({"error": "bad request"}, 400)
            return self._json({"ids": ids})
        if self.path == "/api/me":
            try:
                d = json.loads(self.rfile.read(min(int(self.headers.get("Content-Length", 0)), 1024)))
                name = str(d["name"]).strip()[:20]
                assert name
            except Exception:
                return self._json({"error": "bad request"}, 400)
            return self._me(name)
        if self.path != "/api/scores":
            return self.send_error(404)
        try:
            n = int(self.headers.get("Content-Length", 0))
            d = json.loads(self.rfile.read(min(n, 4096)))
            name = str(d["name"]).strip()[:20]
            correct = int(d["correct"])
            answered = int(d["answered"])
            assert name and 1 <= answered <= 100 and 0 <= correct <= answered
        except Exception:
            return self._json({"error": "bad request"}, 400)
        key = name.lower()
        with LOCK:
            data = load()
            r = data.get(key)
            if not (r and "correct" in r):
                r = {"correct": 0, "answered": 0, "tests": 0}
            r.update(name=name, correct=r["correct"] + correct, answered=r["answered"] + answered, tests=r["tests"] + 1)
            data[key] = r
            tmp = FILE + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=1)
            os.replace(tmp, FILE)
            return self._json({"board": board(data)})


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", 8080), Handler).serve_forever()
