import json
import random
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

DB_PATH = "typing.db"

# A passage's id is just its position in this list
PASSAGES = [
    "The quick brown fox jumps over the lazy dog.",
    "Pack my box with five dozen liquor jugs.",
    "How vexingly quick daft zebras jump!",
]


# ---------- Database ----------

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row   # lets us read columns by name
    return conn


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS runs (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                passage_id INTEGER NOT NULL,
                wpm        REAL    NOT NULL,
                accuracy   REAL    NOT NULL,
                timeline   TEXT    NOT NULL,   -- JSON list of ms values
                created_at TEXT    DEFAULT CURRENT_TIMESTAMP
            )
        """)


init_db()
app = FastAPI()


# ---------- Shape of incoming data ----------

class RunIn(BaseModel):
    passage_id: int
    wpm: float
    accuracy: float
    timeline: list[float]


# ---------- Endpoints ----------

@app.get("/passages/random")
def random_passage():
    pid = random.randrange(len(PASSAGES))
    return {"id": pid, "text": PASSAGES[pid]}


@app.post("/runs")
def save_run(run: RunIn):
    if not 0 <= run.passage_id < len(PASSAGES):
        raise HTTPException(404, "Unknown passage")
    if len(run.timeline) != len(PASSAGES[run.passage_id]):
        raise HTTPException(400, "Timeline length doesn't match the passage")

    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO runs (passage_id, wpm, accuracy, timeline) VALUES (?, ?, ?, ?)",
            (run.passage_id, run.wpm, run.accuracy, json.dumps(run.timeline)),
        )
    return {"id": cur.lastrowid}


@app.get("/runs/best")
def best_run(passage_id: int):
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM runs WHERE passage_id = ? ORDER BY wpm DESC LIMIT 1",
            (passage_id,),
        ).fetchone()
    if row is None:
        return None   # no runs yet for this passage
    return {**dict(row), "timeline": json.loads(row["timeline"])}


# Serve the frontend. This must come LAST, or it would catch the API routes.
app.mount("/", StaticFiles(directory="static", html=True), name="static")