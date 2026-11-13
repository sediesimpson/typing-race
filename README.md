# 👻 Typing Race

A typing test where you race against a **ghost of your past self**. Every run is saved, and the next time you type the same passage, a second cursor replays your best run in real time, so you can see whether you're ahead or behind as you type.

## Features

- **Typing test** with live colouring of correct and incorrect characters, plus Backspace support
- **WPM and accuracy** shown at the end of each run
- **Ghost replay**: a blue underline replays your best run at its exact pace
- **Live ahead/behind readout** (`▲ 0.8s ahead` / `▼ 1.2s behind`)
- **Personal bests**: beat your ghost and it becomes your new ghost 🏆
- **Random passages**, with a separate ghost for each one

## How the ghost works

Instead of recording every keystroke, each run stores a **timeline**: the number of milliseconds after the start at which each character was reached.

```
[0, 142, 260, 395, 510, ... 8730]
```

To replay a run, the page checks how much time has passed on every animation frame and moves the ghost past every character whose recorded time has already gone by. Backspaces and typos sort themselves out, because the timeline only records forward progress.

The same timeline makes the ahead/behind readout a single subtraction: your time at character `i` minus the ghost's time at character `i`.

## Tech stack

- **Backend:** Python, [FastAPI](https://fastapi.tiangolo.com/), SQLite
- **Frontend:** plain HTML, CSS and JavaScript (no framework)

## Getting started

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/typing-race.git
cd typing-race

# 2. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the server
uvicorn main:app --reload
```

Then open **http://localhost:8000**.

The SQLite database (`typing.db`) is created automatically the first time the server starts.

## API

FastAPI generates interactive docs at **http://localhost:8000/docs**.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/passages/random` | Returns a random passage: `{ id, text }` |
| `POST` | `/runs` | Saves a finished run: `{ passage_id, wpm, accuracy, timeline }` |
| `GET` | `/runs/best?passage_id=…` | Returns the fastest run for a passage, or `null` |

`POST /runs` rejects a run whose timeline length doesn't match the passage.

## Project structure

```
typing-race/
├── main.py            # FastAPI app: API routes, SQLite, serves the frontend
├── requirements.txt
└── static/
    ├── index.html
    ├── style.css
    └── script.js      # typing logic, timeline recording, ghost replay
```

## Ideas for later

- [ ] Shareable `/race/:run_id` links so friends can race **your** ghost
- [ ] More passages, stored in the database
- [ ] A history page with a chart of WPM over time
- [ ] Deploy it online