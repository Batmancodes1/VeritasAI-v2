# VeritasAI

Misinformation analyzer that runs claim verification, entity extraction, and narrative consistency checks — returns a verdict in under a second.

---

## What it does

VeritasAI runs any news article through **8 parallel engines** and outputs one of three absolute verdicts: ✅ **Verified Real**, ❌ **Verified Fake**, or ⚠️ **Claim Not Established**.

| Module | What it checks |
|---|---|
| **Claim Consistency (ML)** | TF-IDF + Logistic Regression trained on 44,000 articles (~99% accuracy) |
| **Entity Extraction** | Pulls out key subjects, orgs, and events to build verification queries |
| **Corroboration Engine** | Checks if the narrative structure lines up with known factual reporting |
| **Narrative Consistency** | Looks at logical flow and timeline consistency across the text |
| **Source Lookup** | *Secondary signal* — trusted vs. suspicious domain database |
| **Headline Alignment** | Cosine similarity to catch headlines that don't match the body |
| **Manipulation Scanner** | *Secondary signal* — flags subjective phrasing and rhetorical tricks |
| **Text Highlighter** | Marks suspicious or manipulative words inline |
| **Comparison Mode** | Side-by-side analysis of two conflicting articles |

---

## Features

- **Works offline** — a full mock engine runs in-browser if Flask isn't running
- **Chrome Extension** — analyze any webpage with one click, send it straight to the dashboard
- **Demo Mode** — 3 preloaded articles (real, fake, unestablished) for quick demos
- **No build step** — pure HTML/CSS/JS frontend, open and go

---

## Tech stack

| Layer | Tech |
|---|---|
| ML model | scikit-learn — TF-IDF + Logistic Regression |
| Backend | Python + Flask + flask-cors |
| Frontend | Vanilla HTML/CSS/JS |
| Fonts | Syne · DM Sans · DM Mono |
| Extension | Chrome Manifest V3 |

---

## Getting started

**Option A — Frontend only (no setup needed)**

```bash
open frontend/index.html
```

The offline mock engine handles everything automatically.

**Option B — With the real ML backend**

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Then open `http://127.0.0.1:5000`. The frontend auto-detects whether Flask is running and falls back to the mock engine if it isn't.

---

## Training the model (optional)

The mock engine works fine for demos. For the full ~99% accuracy classifier:

1. Download `Fake.csv` and `True.csv` from the [Kaggle dataset](https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset)
2. Drop both files into `backend/`
3. Run training:

```bash
cd backend
python train_model.py
```

This generates `model.pkl` — Flask picks it up automatically on the next start. Training takes about 30–60 seconds on a normal laptop.

---

## Chrome Extension

1. Go to `chrome://extensions` in Chrome
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `chrome-extension/` folder
4. Make sure the Flask backend is running (`python app.py`)
5. Visit any news article, click the VeritasAI icon, then hit **Open in Dashboard** to transfer the article to your local web interface

---

## Project structure

```
veritas-ai/
├── frontend/
│   ├── index.html        single-page app — Analyze + Compare tabs
│   ├── styles.css        design system, responsive layout, animations
│   └── script.js         analysis logic, mock engine, renderers
│
├── backend/
│   ├── app.py            Flask API with all 8 analysis modules
│   ├── train_model.py    TF-IDF + LogReg training script
│   └── requirements.txt  Python deps
│
└── chrome-extension/
    ├── manifest.json     Chrome Manifest V3 config
    ├── popup.html        extension popup UI
    ├── popup.js          extraction and API logic
    └── content.js        page content extractor
```

---

## How verdicts work

Raw ML probabilities aren't shown to the user. Instead, the model's confidence is mapped against a strict `>= 65%` threshold and combined with entity extraction, corroboration rules, and narrative consistency checks. Source reputation and emotional rhetoric are treated as secondary signals only — so a credible source doesn't get a free pass for factual errors, and neutral-sounding AI-generated fake news still gets caught by structural analysis.

---

## Limitations

- Training data is US political news from 2016–2017 — niche or modern reporting may come back as "Claim Not Established"
- AI-generated fake news written in a neutral, academic tone will slip past the emotional scanners (which is exactly why entity extraction and corroboration take priority)
- The source list is static — newly spun-up misinformation sites won't be flagged
- This is a structural credibility filter, not a live fact-checker — it doesn't scrape the internet to verify breaking events

Best used as a first-pass filter, not a definitive arbiter of truth.

---

## Dataset

[Fake and Real News Dataset](https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset) by Clément Bisaillon

- `Fake.csv` — 23,481 fake news articles
- `True.csv` — 21,417 real Reuters articles
- Combined: ~44,900 labeled examples
