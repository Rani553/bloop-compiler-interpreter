# BLOOP Interpreter — Full Stack (Flask + Java + HTML/CSS/JS)

A custom programming language interpreter written in Java,
served through a Flask (Python) backend, with a browser-based frontend.

---
## Click here:- https://bloop-compiler-interpreter.onrender.com


## Project Structure

```
bloop-complete/
│
├── frontend/
│   ├── index.html          ← Browser UI (code editor + console)
│   ├── style.css           ← Dark IDE styling
│   └── script.js           ← fetch API, console logic, line numbers
│
├── backend/
│   ├── app.py              ← Flask server  (POST /run + serves frontend)
│   ├── requirements.txt    ← Python dependencies
│   └── java_src/           ← Your original BLOOP Java interpreter
│       ├── Main.java
│       ├── Interpreter.java
│       ├── Parser.java
│       ├── Tokenizer.java
│       ├── Token.java
│       ├── TokenType.java
│       ├── Expression.java
│       ├── Instruction.java
│       ├── Environment.java
│       └── bin/            ← (auto-created) compiled .class files
│
├── run.sh                  ← One-click start (Mac / Linux)
├── run.bat                 ← One-click start (Windows)
└── README.md
```

---

## Requirements

| Tool   | Version  | Check with         |
|--------|----------|--------------------|
| Python | 3.8+     | `python --version` |
| Java   | 11+      | `java -version`    |
| pip    | any      | `pip --version`    |

---

## Quick Start

### Mac / Linux
```bash
chmod +x run.sh
./run.sh
```

### Windows
```bat
run.bat
```

Then open your browser → **http://localhost:5000**

---

## Manual Start (step by step)

```bash
# 1. Install Python dependencies
cd backend
pip install -r requirements.txt

# 2. Start the Flask server
#    (Flask auto-compiles the Java source on first run)
python app.py

# 3. Open browser
#    http://localhost:5000
```

Flask will:
- Compile all `.java` files in `java_src/` into `java_src/bin/`
- Serve the frontend at `http://localhost:5000`
- Handle `POST /run` requests from the browser

---

## API Reference

### `POST /run`

**Request body (JSON):**
```json
{ "code": "print \"Hello, World!\"" }
```

**Response (JSON):**
```json
{ "output": "Hello, World!", "error": "" }
```

- `output` — everything the BLOOP program printed to stdout  
- `error`  — parse or runtime error message (empty string on success)

---

## Sample BLOOP Code

```bloop
# Hello World
print "Hello from BLOOP!"

# Variables and arithmetic
put 10 into x
put 3 into y
put x + y into result
print result

# Conditionals
if x > y then:
    print "x is bigger"

# Loops
repeat 3 times:
    print "Looping!"
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `java: command not found` | Install Java 11+ and add it to your PATH |
| `python: command not found` | Try `python3 app.py` instead |
| `ModuleNotFoundError: flask` | Run `pip install -r requirements.txt` |
| Port 5000 already in use | Edit `app.py` — change `port=5000` to another port |
| Compilation error on startup | Check the error message; a Java file may have a syntax issue |
