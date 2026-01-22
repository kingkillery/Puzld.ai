const promptEl = document.getElementById('prompt');
const agentEl = document.getElementById('agent');
const runBtn = document.getElementById('run-btn');
const outputEl = document.getElementById('output');
const statusEl = document.getElementById('status');
const statsEl = document.getElementById('stats');
const themeToggle = document.getElementById('theme-toggle');

// New status panel elements
const statusPanel = document.getElementById('status-panel');
const statusText = document.getElementById('status-text');
const timerEl = document.getElementById('timer');
const summaryEl = document.getElementById('summary');

// Timer state
let timerStartTime = null;
let timerAnimationId = null;
let serverElapsed = 0;

// Theme
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.dataset.theme = savedTheme;

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('theme', next);
});

/**
 * Format milliseconds as MM:SS
 */
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Smooth timer animation using requestAnimationFrame
 * Syncs with server elapsed time for accuracy
 */
function startTimer() {
  timerStartTime = performance.now();
  serverElapsed = 0;

  function updateTimer() {
    const clientElapsed = performance.now() - timerStartTime;
    // Use server elapsed as base, add client-side delta for smooth updates
    const displayElapsed = serverElapsed > 0
      ? serverElapsed + (clientElapsed % 1000) // Sync with server every second
      : clientElapsed;

    timerEl.textContent = formatTime(displayElapsed);
    timerAnimationId = requestAnimationFrame(updateTimer);
  }

  updateTimer();
}

function stopTimer() {
  if (timerAnimationId) {
    cancelAnimationFrame(timerAnimationId);
    timerAnimationId = null;
  }
  timerStartTime = null;
}

function showStatusPanel() {
  statusPanel.classList.remove('hidden');
}

function hideStatusPanel() {
  statusPanel.classList.add('hidden');
  stopTimer();
}

function updateStatus(status, summary, elapsed) {
  // Update server elapsed for timer sync
  if (elapsed) {
    serverElapsed = elapsed;
  }

  // Update status text
  statusText.textContent = status || 'Processing';

  // Update summary with AI-generated text
  if (summary) {
    summaryEl.textContent = summary;
  }
}

// Run task
runBtn.addEventListener('click', async () => {
  const prompt = promptEl.value.trim();
  if (!prompt) return;

  runBtn.disabled = true;
  outputEl.textContent = '';
  outputEl.className = '';
  statsEl.textContent = '';
  statusEl.textContent = 'Submitting...';
  statusEl.className = '';

  // Show status panel and start timer
  showStatusPanel();
  summaryEl.textContent = '📋 Task queued, waiting in line...';
  startTimer();

  try {
    const agent = agentEl.value === 'auto' ? undefined : agentEl.value;

    const response = await fetch('/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, agent })
    });

    if (!response.ok) throw new Error('Failed to submit task');

    const { id, queuePosition } = await response.json();

    if (queuePosition > 1) {
      summaryEl.textContent = `📋 Queued at position ${queuePosition}...`;
    }

    statusEl.textContent = 'Processing...';

    const eventSource = new EventSource(`/task/${id}/stream`);

    eventSource.addEventListener('status', (e) => {
      const data = JSON.parse(e.data);
      statusEl.textContent = data.status;
      updateStatus(data.status, data.summary, data.elapsed);
    });

    eventSource.addEventListener('complete', (e) => {
      const data = JSON.parse(e.data);
      outputEl.textContent = data.result;
      statusEl.textContent = 'Complete';
      statusEl.className = 'success';
      statsEl.textContent = `Model: ${data.model}`;

      // Hide status panel on completion
      hideStatusPanel();

      eventSource.close();
      runBtn.disabled = false;
    });

    eventSource.addEventListener('error', (e) => {
      if (e.data) {
        const data = JSON.parse(e.data);
        outputEl.textContent = data.error;
        outputEl.className = 'error';
      }
      statusEl.textContent = 'Failed';
      statusEl.className = 'error';

      // Hide status panel on error
      hideStatusPanel();

      eventSource.close();
      runBtn.disabled = false;
    });

    eventSource.onerror = () => {
      statusEl.textContent = 'Connection lost';
      statusEl.className = 'error';

      hideStatusPanel();

      eventSource.close();
      runBtn.disabled = false;
    };

  } catch (err) {
    outputEl.textContent = err.message;
    outputEl.className = 'error';
    statusEl.textContent = 'Failed';
    statusEl.className = 'error';

    hideStatusPanel();

    runBtn.disabled = false;
  }
});

// Ctrl+Enter to run
promptEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    runBtn.click();
  }
});
