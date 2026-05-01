/**
 * script.js — BLOOP Interpreter Frontend
 * ─────────────────────────────────────────────────────────────
 * Handles:
 *  • Sending BLOOP code to the Java backend via fetch (/run)
 *  • Rendering stdout / stderr to the console panel
 *  • Line-number sync in the editor
 *  • Keyboard shortcut Ctrl+Enter to run
 *  • UI state management (idle / running / success / error)
 * ─────────────────────────────────────────────────────────────
 */

/* ── Configuration ──────────────────────────────────────── */

/**
 * The backend endpoint that accepts BLOOP code.
 * Expects a POST with JSON body: { "code": "<source>" }
 * Returns JSON: { "output": "...", "error": "..." }
 * Adjust this URL to match your Java server's host/port.
 */
/**
 * Flask backend URL.
 * When Flask serves the frontend directly (via `python app.py`),
 * a relative path '/run' works fine.
 * If you run the frontend separately (e.g. with Live Server on port 5500),
 * change this to: 'http://localhost:5000/run'
 */
const API_ENDPOINT = '/run';

/* ── DOM References ─────────────────────────────────────── */
const codeEditor      = document.getElementById('codeEditor');
const lineNumbers     = document.getElementById('lineNumbers');
const runBtn          = document.getElementById('runBtn');
const clearBtn        = document.getElementById('clearBtn');
const clearOutputBtn  = document.getElementById('clearOutputBtn');
const consoleBody     = document.getElementById('consoleBody');
const statusText      = document.getElementById('statusText');
const execTime        = document.getElementById('execTime');

/* ── Line Numbers Sync ──────────────────────────────────── */

/**
 * Recalculates and redraws line numbers whenever the
 * content in the editor changes.
 */
function updateLineNumbers() {
  const lineCount = codeEditor.value.split('\n').length;
  let nums = '';
  for (let i = 1; i <= lineCount; i++) {
    nums += i + '\n';
  }
  lineNumbers.textContent = nums;
}

// Keep gutter scroll in sync with textarea scroll
codeEditor.addEventListener('scroll', () => {
  lineNumbers.scrollTop = codeEditor.scrollTop;
});

// Rebuild line numbers on every keystroke
codeEditor.addEventListener('input', updateLineNumbers);

// Initialise on page load
updateLineNumbers();

/* ── Tab Key Support ────────────────────────────────────── */

/**
 * Intercepts the Tab key inside the editor and inserts
 * two spaces instead of moving focus away.
 */
codeEditor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = codeEditor.selectionStart;
    const end   = codeEditor.selectionEnd;
    codeEditor.value =
      codeEditor.value.substring(0, start) + '  ' +
      codeEditor.value.substring(end);
    codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;
    updateLineNumbers();
  }

  // Ctrl+Enter (or Cmd+Enter on Mac) → Run code
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    runCode();
  }
});

/* ── Console Helpers ────────────────────────────────────── */

/**
 * Clears all content from the console body.
 */
function clearConsole() {
  consoleBody.innerHTML = '';
}

/**
 * Appends a single line of text to the console.
 * @param {string} text     - The line content
 * @param {string} type     - 'stdout' | 'stderr' | 'info' | 'system'
 * @param {string} prefix   - The gutter character shown before the line
 */
function appendLine(text, type = 'stdout', prefix = '>') {
  const line = document.createElement('span');
  line.className = `output-line ${type}`;
  line.dataset.prefix = prefix;
  line.textContent = text;
  consoleBody.appendChild(line);
  // Auto-scroll to the bottom
  consoleBody.scrollTop = consoleBody.scrollHeight;
}

/**
 * Renders a structured error block (used for backend errors
 * or network failures).
 * @param {string} message - Error description
 */
function appendError(message) {
  const block = document.createElement('div');
  block.className = 'error-block';
  block.innerHTML = `<span class="error-label">⚠ Error</span>${escapeHtml(message)}`;
  consoleBody.appendChild(block);
  consoleBody.scrollTop = consoleBody.scrollHeight;
}

/**
 * Escapes HTML special characters to prevent injection.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Status Bar Helpers ─────────────────────────────────── */

/**
 * Updates the status indicator in the console footer.
 * @param {'idle'|'running'|'ok'|'error'} state
 * @param {string} [label] - Optional override text
 */
function setStatus(state, label) {
  statusText.className = `status-${state}`;
  const labels = {
    idle:    'Idle',
    running: '● Running…',
    ok:      '✔ Done',
    error:   '✖ Error',
  };
  statusText.textContent = label || labels[state] || state;
}

/**
 * Shows or hides the execution time display.
 * @param {number|null} ms - Milliseconds, or null to hide
 */
function setExecTime(ms) {
  execTime.textContent = ms !== null ? `${ms} ms` : '';
}

/* ── Button State ───────────────────────────────────────── */

/**
 * Puts the Run button into a "loading" visual state.
 */
function setRunning(isRunning) {
  runBtn.disabled = isRunning;
  if (isRunning) {
    runBtn.classList.add('running');
    runBtn.querySelector('.btn-icon').textContent = '⟳';
  } else {
    runBtn.classList.remove('running');
    runBtn.querySelector('.btn-icon').textContent = '▶';
  }
}

/* ── Core: Run Code ─────────────────────────────────────── */

/**
 * Reads the editor content, sends it to the Java backend,
 * and renders the result in the console.
 */
async function runCode() {
  const code = codeEditor.value.trim();

  // Guard: don't run empty input
  if (!code) {
    clearConsole();
    appendLine('Nothing to run — write some BLOOP code first.', 'system', '!');
    return;
  }

  // ── Setup: clear console, update UI ──
  clearConsole();
  setRunning(true);
  setStatus('running');
  setExecTime(null);

  // Show a "sent to backend" indicator
  appendLine('Sending code to interpreter…', 'system', '→');

  const startTime = performance.now();

  try {
    /* ── Fetch request to the Java backend ── */
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // The Java backend should read `code` from the JSON body
      body: JSON.stringify({ code }),
    });

    const elapsed = Math.round(performance.now() - startTime);
    setExecTime(elapsed);

    /* ── Handle non-2xx HTTP responses ── */
    if (!response.ok) {
      let errMsg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errBody = await response.json();
        if (errBody.error) errMsg = errBody.error;
      } catch (_) { /* ignore parse errors on error body */ }

      clearConsole();
      appendError(errMsg);
      setStatus('error');
      return;
    }

    /* ── Parse JSON response ── */
    const data = await response.json();

    // Clear the "sending…" line before real output
    clearConsole();

    // ── Render stdout ──
    if (data.output && data.output.trim() !== '') {
      const lines = data.output.split('\n');
      lines.forEach(line => appendLine(line, 'stdout', '>'));
    }

    // ── Render stderr / errors from interpreter ──
    if (data.error && data.error.trim() !== '') {
      appendError(data.error);
      setStatus('error');
    } else {
      // All good — show a subtle completion note
      if (!data.output || data.output.trim() === '') {
        appendLine('(no output)', 'system', '—');
      }
      setStatus('ok');
    }

  } catch (networkError) {
    /* ── Network / fetch failure ── */
    const elapsed = Math.round(performance.now() - startTime);
    setExecTime(elapsed);

    clearConsole();
    appendError(
      `Could not reach the backend.\n\n` +
      `Make sure your Java server is running and listening at: ${API_ENDPOINT}\n\n` +
      `Details: ${networkError.message}`
    );
    setStatus('error');

  } finally {
    /* ── Always re-enable the run button ── */
    setRunning(false);
  }
}

/* ── Button Event Listeners ─────────────────────────────── */

// Run button click
runBtn.addEventListener('click', runCode);

// Clear editor button
clearBtn.addEventListener('click', () => {
  codeEditor.value = '';
  updateLineNumbers();
  codeEditor.focus();
});

// Clear console (✕) button
clearOutputBtn.addEventListener('click', () => {
  clearConsole();
  setStatus('idle');
  setExecTime(null);
  consoleBody.innerHTML =
    '<div class="console-welcome"><span class="dim">// Console cleared.</span></div>';
});

/* ── Initial State ──────────────────────────────────────── */
setStatus('idle');
codeEditor.focus();
