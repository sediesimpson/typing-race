const passageEl = document.getElementById("passage");
const statsEl = document.getElementById("stats");
const restartBtn = document.getElementById("restart");

let passageId = null;
let text = "";          // empty until the passage loads
let spans = [];
let current = 0;
let startTime = null;
let keystrokes = 0;
let mistakes = 0;
let timeline = [];
let ghost = null;       // best run's timeline, or null if there isn't one yet
let ghostIdx = 0;       // how many characters the ghost has typed
let ghostFrame = null;  // id of the running animation loop

// ---------- Load a passage from the backend ----------

async function loadPassage() {
  const res = await fetch("/passages/random");
  const passage = await res.json();
  passageId = passage.id;
  text = passage.text;

  passageEl.innerHTML = "";               // clear any old passage
  text.split("").forEach(ch => {
    const span = document.createElement("span");
    span.textContent = ch;
    passageEl.appendChild(span);
  });
  spans = passageEl.querySelectorAll("span");

  await loadGhost();
  restart();
}

async function loadGhost() {
  const res = await fetch(`/runs/best?passage_id=${passageId}`);
  const best = await res.json();
  ghost = best ? best.timeline : null;
}

function showGhost() {
  document.querySelector(".ghost")?.classList.remove("ghost");
  if (ghost && ghostIdx < spans.length) spans[ghostIdx].classList.add("ghost");
}

function tickGhost() {
  const elapsed = performance.now() - startTime;
  while (ghostIdx < ghost.length && ghost[ghostIdx] <= elapsed) ghostIdx++;
  showGhost();

  // keep going until the ghost finishes or you do
  if (ghostIdx < ghost.length && current < text.length) {
    ghostFrame = requestAnimationFrame(tickGhost);
  }
}

// ---------- Reset for a new attempt ----------

function restart() {
  spans.forEach(s => s.classList.remove("correct", "incorrect", "current", "ghost"));
  current = 0;
  startTime = null;
  keystrokes = 0;
  mistakes = 0;
  timeline = [];
  statsEl.textContent = "";
  spans[current].classList.add("current");

  cancelAnimationFrame(ghostFrame);   // stop any loop from the last attempt
  ghostIdx = 0;
  showGhost();                        // park the ghost at the start
}

// ---------- Typing ----------

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) return;

  if (e.key === "Backspace") {
    if (current === 0 || current >= text.length) return;
    e.preventDefault();
    spans[current].classList.remove("current");
    current--;
    spans[current].classList.remove("correct", "incorrect");
    spans[current].classList.add("current");
    return;
  }

  if (e.key.length !== 1) return;
  if (current >= text.length) return;     // finished, or passage not loaded yet
  e.preventDefault();

  if (startTime === null) {
    startTime = performance.now();
    if (ghost) ghostFrame = requestAnimationFrame(tickGhost);
  }

  keystrokes++;
  const span = spans[current];
  span.classList.remove("current");

  if (e.key === text[current]) {
    span.classList.add("correct");
  } else {
    span.classList.add("incorrect");
    mistakes++;
  }

  timeline[current] = performance.now() - startTime;
  current++;

  if (current < text.length) {
    spans[current].classList.add("current");
  } else {
    finish();
  }
});

// ---------- Finish and save ----------

async function finish() {
  const minutes = (performance.now() - startTime) / 60000;
  const wpm = Math.round((text.length / 5) / minutes);
  const accuracy = Math.round(((keystrokes - mistakes) / keystrokes) * 100);
  const result = `${wpm} WPM · ${accuracy}% accuracy`;

  statsEl.textContent = `${result} · saving…`;

  try {
    const res = await fetch("/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passage_id: passageId, wpm, accuracy, timeline }),
    });
    if (!res.ok) throw new Error(await res.text());
    statsEl.textContent = `${result} · saved ✓`;
    await loadGhost();
  } catch (err) {
    console.error("Saving failed:", err);
    statsEl.textContent = `${result} · couldn't save`;
  }
}

// ---------- Buttons & start-up ----------

restartBtn.addEventListener("click", () => {
  restart();
  restartBtn.blur();
});

loadPassage();