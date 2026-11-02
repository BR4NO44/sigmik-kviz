#!/bin/bash
# Spustí kvíz na sieti. Dvojklik v Finderi alebo ./spusti.command
cd "$(dirname "$0")"
HOST="$(scutil --get LocalHostName).local"
echo "Kvíz beží na:  http://$HOST:8080"
echo "(Ukončenie: Ctrl+C)"
exec python3 server.py
