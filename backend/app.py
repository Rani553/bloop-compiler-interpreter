"""
app.py — Flask backend for the BLOOP Interpreter
=================================================
Routes:
  POST /run   →  Accepts BLOOP source code, runs it through
                 the Java interpreter, returns JSON output/error.
  GET  /      →  Serves the frontend (index.html)
  GET  /<file>→  Serves static frontend files (CSS, JS)

How it works:
  1. On first run, Flask compiles all *.java files in java_src/
  2. For each /run request, it writes the code to a temp file,
     calls  `java -cp java_src/bin Main <tempfile>`  via subprocess,
     captures stdout/stderr, cleans up, and returns JSON.
"""

import os
import subprocess
import tempfile
import threading
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# ── Paths ────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
JAVA_SRC_DIR  = os.path.join(BASE_DIR, "java_src")
JAVA_BIN_DIR  = os.path.join(BASE_DIR, "java_src", "bin")
FRONTEND_DIR  = os.path.join(BASE_DIR, "..", "frontend")

# ── Flask app setup ──────────────────────────────────────────
app = Flask(__name__, static_folder=None)
CORS(app)   # Allow requests from any origin (needed when running frontend separately)

# ── Compilation lock — prevents concurrent compile races ─────
_compile_lock = threading.Lock()
_compiled     = False   # compile once per server lifetime


def compile_java():
    """
    Compiles all .java files in java_src/ into java_src/bin/.
    Called once at startup (and again if bin/ is missing).
    Returns (success: bool, error_message: str)
    """
    global _compiled

    os.makedirs(JAVA_BIN_DIR, exist_ok=True)

    java_files = [
        os.path.join(JAVA_SRC_DIR, f)
        for f in os.listdir(JAVA_SRC_DIR)
        if f.endswith(".java")
    ]

    if not java_files:
        return False, "No .java files found in java_src/"

    cmd = ["javac", "-d", JAVA_BIN_DIR] + java_files

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        timeout=30
    )

    if result.returncode != 0:
        return False, f"Compilation failed:\n{result.stderr}"

    _compiled = True
    print("[BLOOP] Java compilation successful.")
    return True, ""


def ensure_compiled():
    """Thread-safe: compile Java source once, reuse after that."""
    global _compiled
    with _compile_lock:
        if not _compiled:
            ok, err = compile_java()
            if not ok:
                raise RuntimeError(err)


# ── Compile at startup ───────────────────────────────────────
try:
    ensure_compiled()
except RuntimeError as e:
    print(f"[BLOOP] WARNING: Startup compilation failed — {e}")
    print("[BLOOP] Will retry on first /run request.")


# ════════════════════════════════════════════════════════════
#  API Route: POST /run
# ════════════════════════════════════════════════════════════

@app.route("/run", methods=["POST"])
def run_bloop():
    """
    Expects JSON body:  { "code": "<bloop source>" }
    Returns JSON:       { "output": "...", "error": "..." }
    """

    # ── 1. Parse request body ───────────────────────────────
    data = request.get_json(silent=True)
    if not data or "code" not in data:
        return jsonify({"output": "", "error": "Missing 'code' field in request body."}), 400

    source_code = data["code"].strip()

    if not source_code:
        return jsonify({"output": "", "error": "No code provided."}), 400

    # ── 2. Ensure Java is compiled ──────────────────────────
    try:
        ensure_compiled()
    except RuntimeError as compile_err:
        return jsonify({"output": "", "error": str(compile_err)}), 500

    # ── 3. Write code to a temp .bloop file ─────────────────
    tmp_file = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".bloop",
            delete=False,
            encoding="utf-8"
        ) as f:
            f.write(source_code)
            tmp_file = f.name

        # ── 4. Run the Java interpreter ──────────────────────
        result = subprocess.run(
            ["java", "-cp", JAVA_BIN_DIR, "Main", tmp_file],
            capture_output=True,
            text=True,
            timeout=10      # kill runaway programs after 10 seconds
        )

        output = result.stdout.strip()
        error  = result.stderr.strip()

        # ── 5. Return result ─────────────────────────────────
        return jsonify({"output": output, "error": error})

    except subprocess.TimeoutExpired:
        return jsonify({
            "output": "",
            "error": "Execution timed out (10s limit). Check for infinite loops."
        }), 200

    except FileNotFoundError:
        return jsonify({
            "output": "",
            "error": "Java runtime not found. Make sure Java is installed and on your PATH."
        }), 500

    except Exception as e:
        return jsonify({"output": "", "error": f"Server error: {str(e)}"}), 500

    finally:
        # Always clean up the temp file
        if tmp_file and os.path.exists(tmp_file):
            os.remove(tmp_file)


# ════════════════════════════════════════════════════════════
#  Static Frontend Serving
# ════════════════════════════════════════════════════════════

@app.route("/")
def serve_index():
    """Serve the main frontend page."""
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_static(filename):
    """Serve CSS, JS, and any other frontend static files."""
    return send_from_directory(FRONTEND_DIR, filename)


# ════════════════════════════════════════════════════════════
#  Entry Point
# ════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("╔══════════════════════════════════════════╗")
    print("║   BLOOP Interpreter — Flask Backend      ║")
    print("║   http://localhost:5000                  ║")
    print("╚══════════════════════════════════════════╝")
    app.run(host="0.0.0.0", port=5000, debug=True)
