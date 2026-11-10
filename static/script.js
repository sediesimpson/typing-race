const text = "The quick brown fox jumps over the lazy dog.";
const passageEl = document.getElementById("passage");

text.split("").forEach(ch => {
  const span = document.createElement("span");
  span.textContent = ch;
  passageEl.appendChild(span);
});

const spans = passageEl.querySelectorAll("span");
let current = 0;
spans[current].classList.add("current");

let startTime = null;
let keystrokes = 0;
let mistakes = 0;

document.addEventListener("keydown", (e) => {
  
  if (e.key === "Backspace") {
    if (current === 0 || current >= text.length) return;
    e.preventDefault();
    spans[current].classList.remove("current");
    current--;
    spans[current].classList.remove("correct", "incorrect");
    spans[current].classList.add("current");
    return;
  }

  if (e.ctrlKey || e.metaKey) return;
  if (e.key.length !== 1) return;
  if (current >= text.length) return;
  e.preventDefault();

  if (startTime === null) startTime = performance.now();

  keystrokes++;
  const span = spans[current];
  span.classList.remove("current");

  if (e.key == text[current]) {
    span.classList.add("correct");
  } else {
    span.classList.add("incorrect");
    mistakes++
  }


  current++;
  if (current < text.length) {
    spans[current].classList.add("current");
  } else {
    finish()
  }
});

function finish() {
  const minutes = (performance.now() - startTime) / 60000;
  const wpm = Math.round((text.length / 5) / minutes);
  const accuracy = Math.round(((keystrokes -  mistakes) / keystrokes) *100)

  document.getElementById("stats").textContent = 
  `${wpm} WPM · ${accuracy}% accuracy`;
}

const restartBtn = document.getElementById("restart");

function restart() {
  spans.forEach(s => s.classList.remove("correct", "incorrect", "current"));
  current = 0;
  startTime = null;
  keystrokes = 0;
  mistakes = 0;
  document.getElementById("stats").textContent = "";
  spans[current].classList.add("current");
}

restartBtn.addEventListener("click", () => {
  restart();
  restartBtn.blur();   // so pressing Enter later doesn't click it again
});