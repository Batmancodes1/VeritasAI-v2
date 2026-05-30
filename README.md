Here is the `README.md` rewritten to keep your exact original layout, tone, and table structures, but updated to perfectly reflect the new "Verification & Corroboration" logic (removing the 0–100 scores, prioritizing entities, and adding the new extension features).

### `README.md`

````markdown
# VeritasAI — Misinformation Analyzer

> AI-powered claim verification, entity extraction, and narrative consistency analysis — in under 200ms.

---

## What It Does

VeritasAI has moved beyond basic word-counting and domain blacklists. It analyzes any news article across **8 parallel verification engines** and returns an absolute verdict in under a second:

| Module                     | What It Evaluates                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------- |
| **Claim Consistency (ML)** | TF-IDF + Logistic Regression trained on 44,000 articles (~99% accuracy)             |
| **Entity Extraction**      | Identifies key subjects, organizations, and events to generate verification queries |
| **Corroboration Engine**   | Checks if the extracted narrative structure aligns with known factual reporting     |
| **Narrative Consistency**  | Evaluates the logical flow and timeline consistency of the text                     |
| **Source Lookup**          | _Secondary Signal:_ Trusted vs suspicious domain database (Reuters, InfoWars, etc.) |
| **Headline Alignment**     | Cosine similarity to ensure the headline doesn't artificially inflate body text     |
| **Manipulation Scanner**   | _Secondary Signal:_ Detects subjective phrasing and manipulative rhetoric           |
| **Text Highlighter**       | Marks every suspicious or manipulative word inline                                  |
| **Comparison Mode**        | Side-by-side verification battle between two conflicting articles                   |

---

## Features

- **Works offline** — full mock analysis engine runs in-browser when Flask isn't running
- **Chrome Extension** — analyze any webpage with one click, and send data directly to the web app
- **Demo Mode** — 3 preloaded articles (Verified Real, Verified Fake, Unestablished) for instant demos
- **Zero dependencies** — pure HTML/CSS/JS frontend, no build step required

---

## Tech Stack

| Layer     | Tech                                                       |
| --------- | ---------------------------------------------------------- |
| ML Model  | scikit-learn — TF-IDF + Logistic Regression                |
| Backend   | Python + Flask + flask-cors (now serves frontend natively) |
| Frontend  | Vanilla HTML/CSS/JS (no framework)                         |
| Fonts     | Syne (display) · DM Sans (body) · DM Mono (mono)           |
| Extension | Chrome Manifest V3                                         |

---

## Getting Started

### Option A — Frontend only (no setup)

```bash
# Just open in your browser — the offline mock engine handles everything
open frontend/index.html
```
````

### Option B — With the real ML backend (Recommended)

**1. Install Python dependencies**

```bash
cd backend
pip install -r requirements.txt

```

**2. Start the Flask server**

```bash
python app.py

```

**3. Open the Dashboard**

```bash
# Open your browser to the local server
[http://127.0.0.1:5000](http://127.0.0.1:5000)

```

The frontend auto-detects the backend. If Flask isn't running, it falls back to the offline mock engine seamlessly.

---

## Training the ML Model (Optional)

The mock engine is accurate enough for demos. For the real ~99% accuracy model:

1. Download `Fake.csv` and `True.csv` from [Kaggle](https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset)
2. Place both files in `backend/`
3. Run training:

```bash
cd backend
python train_model.py

```

4. This saves `model.pkl` — Flask picks it up automatically on next start.

Training takes ~30–60 seconds on a normal laptop.

---

## Chrome Extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `chrome-extension/` folder
4. Start the Flask backend (`python app.py`)
5. Click the VeritasAI icon on any news article
6. Click **Open in Dashboard** to instantly transfer the extracted article to your local web interface.

---

## Project Structure

```text
veritas-ai/
├── frontend/
│   ├── index.html        UI — single-page app with Analyze + Compare tabs
│   ├── styles.css        Design system, responsive layout, animations
│   └── script.js         Analysis logic, mock engine, renderers
│
├── backend/
│   ├── app.py            Flask API with all 8 analysis modules
│   ├── train_model.py    TF-IDF + LogReg training script
│   └── requirements.txt  Python deps
│
├── chrome-extension/
│   ├── manifest.json     Chrome Manifest V3 config
│   ├── popup.html        Extension popup UI
│   ├── popup.js          Extension extraction and API logic
│   └── content.js        Page content extractor
│
└── README.md

```

---

## How Verification Verdicts Work

Instead of exposing arbitrary probability scores, VeritasAI outputs absolute verdicts:

- `✅ VERIFIED REAL`
- `❌ VERIFIED FAKE`
- `⚠️ CLAIM NOT ESTABLISHED`

These verdicts are reached by prioritizing **Claim Consistency**, **Entity Corroboration**, and **Narrative Alignment**. The system maps the ML confidence against a strict `>= 65%` threshold. Source reputation and emotional rhetoric are heavily downgraded to act merely as _secondary supporting signals_, ensuring that highly credible sources aren't given a free pass for factual errors, and perfectly-written AI fake news is still caught by structural claim analysis.

---

## Known Limitations

- Training data is US political news from 2016–2017 — edge cases in modern niche reporting may yield "Claim Not Established"
- AI-generated fake news written in a neutral, academic tone will bypass the emotional scanners (which is why entity extraction and corroboration take priority)
- Source list is static — new misinformation sites won't be flagged automatically
- Assesses structural credibility and alignment; does not actively scrape the live internet to verify breaking events

Best used as a **first-pass structural filter**, not a definitive arbiter of truth.

---

## Dataset

**Kaggle Fake and Real News Dataset** by Clément Bisaillon

- `Fake.csv` — 23,481 fake news articles
- `True.csv` — 21,417 real Reuters articles
- Combined: ~44,000 labeled examples

Link: https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset

```

```
