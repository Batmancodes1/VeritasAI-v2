# VeritasAI — Setup Guide

---

## Project layout

```
veritas-ai/
├── backend/
│   ├── app.py            Flask API server (also serves frontend)
│   ├── train_model.py    ML training script
│   ├── requirements.txt  Python deps
│   └── model.pkl         created after training
│
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
│
└── chrome-extension/
    ├── manifest.json
    ├── popup.html
    ├── popup.js          extension UI logic
    └── content.js        page content extractor
```

---

## Step 1 — Install Python dependencies

You need Python 3.9+. Check with `python --version`.

```bash
cd backend
pip install -r requirements.txt
```

If you hit permission errors:

```bash
pip install --user -r requirements.txt

# or inside a virtual environment:
python -m venv venv
source venv/bin/activate      # Mac/Linux
venv\Scripts\activate         # Windows
pip install -r requirements.txt
```

---

## Step 2 — Run without training

The frontend has a full offline mock engine built in, so you don't need to train anything to try it out.

**Option A (recommended) — Flask with rule-based fallback**

```bash
cd backend
python app.py
```

Open `http://127.0.0.1:5000`. Flask will warn you:

```
⚠️  model.pkl not found — using rule-based fallback engine
```

Everything still works — entity extraction, corroboration, and verification all run through an NLP fallback.

**Option B — No server at all**

```bash
open frontend/index.html       # Mac
start frontend/index.html      # Windows
xdg-open frontend/index.html   # Linux
```

This opens the UI directly in your browser. Chrome Extension features won't work in this mode, but everything else will.

---

## Step 3 — Train the real model

### 3a. Download the dataset

Go to: https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset

You'll need a free Kaggle account. Download the zip, extract it, and place `Fake.csv` and `True.csv` inside the `backend/` folder:

```
backend/
├── Fake.csv
├── True.csv
├── app.py
├── train_model.py
└── requirements.txt
```

### 3b. Run training

```bash
cd backend
python train_model.py
```

Expected output:

```
╔══════════════════════════════════╗
║  VeritasAI — Model Training      ║
╚══════════════════════════════════╝

📂 Loading dataset...
   Total articles : 44,898
   Fake           : 23,481
   Real           : 21,417

📊 Train size : 38,163
   Test size  :  6,735

⚙️  Training pipeline (this takes ~60 seconds)...
   Done in 54.2s

══════════════════════════════════════════════════
  Accuracy  : 98.94%
  ROC-AUC   : 0.9991
══════════════════════════════════════════════════

✅ Model saved → model.pkl
```

Training takes 30–90 seconds on a normal laptop and saves a `model.pkl` file (~150 MB).

### 3c. Restart the server

```bash
python app.py
```

You should now see:

```
✅ Loaded trained model from model.pkl
 * Running on http://127.0.0.1:5000
```

Open `http://127.0.0.1:5000` — all analysis now uses the real classifier alongside the entity extraction engine.

---

## Step 4 — Verify it's working

**Check the API is alive:**

```bash
curl http://localhost:5000/api/health
```

Expected:

```json
{ "status": "ok", "version": "3.0.0" }
```

**Test a prediction:**

```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Scientists confirm vaccine safe after large clinical trials",
    "headline": "Vaccine confirmed safe",
    "source_url": "https://reuters.com"
  }'
```

---

## Step 5 — Chrome Extension (optional)

1. Open Chrome and go to `chrome://extensions`
2. Toggle **Developer mode** on (top right)
3. Click **Load unpacked** → select the `chrome-extension/` folder
4. Make sure `python app.py` is running
5. Go to any news article, click the VeritasAI toolbar icon, then **Verify Current Page**
6. Click **Open in Dashboard** to transfer the extracted article to your local web interface

---

## Why the accuracy is ~99% (and how we actually use it)

The model scores this high on this dataset because:

- The Kaggle data has a strong stylistic divide — fake articles lean sensationalist, real Reuters articles use neutral wire-service tone
- Training input doubles the title (`title + title + body`), which weights headline features more
- Trigrams (`ngram_range=(1,3)`) capture manipulative phrases as single features
- `C=10.0` uses less regularization, letting the model fit the strong patterns tightly

**Real-world caveat:** The dataset is mostly US political news from 2016–2017. Because credible sources can still publish errors and AI can write convincing neutral-sounding fake news, VeritasAI doesn't expose raw ML percentages. Instead, the confidence score is mapped to a `>= 65%` threshold and combined with entity extraction, corroboration, and narrative consistency to produce a final absolute verdict. The ML score is one structural signal — not the answer.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError: flask` | Run `pip install -r requirements.txt` inside `backend/` |
| `FileNotFoundError: Fake.csv` | Place `Fake.csv` and `True.csv` inside the `backend/` folder |
| `Address already in use` on port 5000 | Kill the old process: `lsof -ti:5000 \| xargs kill` |
| Frontend shows "Backend offline" | Make sure `python app.py` is running, then check `http://localhost:5000/api/health` |
| Chrome extension can't connect | The backend must be running — extensions can't reach `localhost` if Flask isn't started |
| Training is slow | Normal — 60–90 seconds. The vectorizer is building a 100k-feature matrix |
| `pip` is Python 2's pip | Use `pip3` instead |

---

## Quick reference

```bash
# One-time setup
cd backend && pip install -r requirements.txt

# Train (run once after downloading the CSVs)
python train_model.py

# Start the server
python app.py

# Open in browser
http://127.0.0.1:5000
```
