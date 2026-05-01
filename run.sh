#!/bin/bash
# ─────────────────────────────────────────────
# BLOOP Interpreter — Quick Start (FIXED)
# ─────────────────────────────────────────────

set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     BLOOP Interpreter — Starting Up      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── Check Java ─────────────────────────────
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Install Java 11+."
    exit 1
fi
echo "✔ Java found: $(java -version 2>&1 | head -1)"

# ── Check Python ───────────────────────────
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Python not found."
    exit 1
fi

PYTHON=$(command -v python3 || command -v python)
echo "✔ Python found: $($PYTHON --version)"

# ── Go to backend ──────────────────────────
cd "$(dirname "$0")/backend"

# ── Install dependencies ───────────────────
echo ""
echo "📦 Installing Python dependencies..."
$PYTHON -m pip install -r requirements.txt --quiet

# ── OPTIONAL: Kill existing Flask (port fix) ──
echo ""
echo "🔧 Checking port 5000..."
PID=$(lsof -t -i:5000 || true)
if [ ! -z "$PID" ]; then
    echo "⚠ Port 5000 in use. Killing process $PID"
    kill -9 $PID
fi

# ── Start Flask ────────────────────────────
echo ""
echo "🚀 Starting Flask server..."
echo "   Open → http://localhost:5000"
echo ""

$PYTHON app.py