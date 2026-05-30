Here is your original `SETUP.md` layout, carefully updated to reflect the new stabilization changes. I kept your exact formatting, structure, and tone, but integrated the new logic (absolute verdicts, entity extraction, native frontend serving, and Chrome Extension dashboard integration).

### `SETUP.md`

````markdown
# VeritasAI — Complete Setup & Training Guide

---

## Project Layout

```text
veritas-ai/
├── backend/
│   ├── app.py            ← Flask API server (now serves frontend natively)
│   ├── train_model.py    ← ML training script
│   ├── requirements.txt  ← Python deps
│   └── model.pkl         ← created after training
│
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
│
└── chrome-extension/
    ├── manifest.json
    ├── popup.html
    ├── popup.js          ← Extension UI logic
    └── content.js        ← Page content extractor
```
````

---

## Step 1 — Install Python dependencies

You need Python 3.9+. Check with: `python --version`

```bash
cd backend
pip install -r requirements.txt

```

If you hit permission errors:

```bash
pip install --user -r requirements.txt
# or inside a virtual environment:
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows
pip install -r requirements.txt

```

---

## Step 2 — Run without training (instant, demo mode)

The frontend has a full offline mock engine built in. You can demo everything without ML training.

**Option A (Recommended): Run Flask with rule-based fallback**

```bash
cd backend
python app.py

```

Then open `http://127.0.0.1:5000` in your browser. Flask will print:

```
⚠️  model.pkl not found — using rule-based fallback engine

```

Everything works — it simulates extraction, corroboration, and verification using a rule-based NLP fallback.

**Option B: No server at all**
Just open the HTML file directly in any browser (Chrome Extension features won't work in this mode, but the UI demo will):

```bash
open frontend/index.html          # Mac
start frontend/index.html         # Windows
xdg-open frontend/index.html      # Linux

```

---

## Step 3 — Train the real ML model (recommended)

### 3a. Download the dataset

Go to: https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset

You need a free Kaggle account. Download the zip, extract it.
You'll get two files: `Fake.csv` and `True.csv`

**Place both files inside the `backend/` folder:**

```text
backend/
├── Fake.csv          ← put here
├── True.csv          ← put here
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

```text
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

Training takes **30–90 seconds** on a normal laptop. It saves `model.pkl` (~150 MB).

### 3c. Start the server with real model

```bash
python app.py

```

You'll now see:

```text
✅ Loaded trained model from model.pkl
 * Running on [http://127.0.0.1:5000](http://127.0.0.1:5000)

```

Open `http://127.0.0.1:5000` — all analysis now uses the ~99% accuracy classifier alongside the entity extraction engine.

---

## Step 4 — Verify everything works

### Check the API is alive:

```bash
curl http://localhost:5000/api/health

```

Expected:

```json
{
  "status": "ok",
  "version": "3.0.0"
}
```

### Test a prediction:

```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Scientists confirm vaccine safe after large clinical trials", "headline": "Vaccine confirmed safe", "source_url": "[https://reuters.com](https://reuters.com)"}'

```

---

## Step 5 — Chrome Extension (optional)

1. Open Chrome → address bar → `chrome://extensions`
2. Toggle **Developer mode** ON (top right)
3. Click **Load unpacked**
4. Select the `chrome-extension/` folder
5. VeritasAI icon appears in your toolbar
6. Make sure `python app.py` is running
7. Go to any news article → click the extension → click **Verify Current Page**
8. Click **Open in Dashboard** to instantly transfer the extracted article to your local web interface.

---

## Why the ML accuracy is ~99% (And how we use it)

The model achieves very high accuracy on this specific dataset because:

- The Kaggle dataset has a strong stylistic divide — fake articles use sensationalist phrasing, real Reuters articles use neutral wire-service style.
- Title doubling in the training input (`title + title + body`) weights headline features more heavily.
- Trigrams (`ngram_range=(1,3)`) capture exact manipulative phrases as single features.
- `C=10.0` uses less regularization, letting the model fit the strong patterns tightly.

**Real-world caveat & Final Verdict Logic:** This dataset is mostly US political news from 2016–2017. Because credible sources can make mistakes, and AI can write convincing fake news, **VeritasAI no longer exposes raw ML percentages to the user.** Instead, the ~99% ML confidence score is mapped into absolute verification thresholds (`>= 65%`). This internal signal is then combined with:

1. **Entity Extraction**
2. **Corroboration Rules**
3. **Narrative Consistency** This creates a final, absolute verdict (`✅ VERIFIED REAL`, `❌ VERIFIED FAKE`, or `⚠️ CLAIM NOT ESTABLISHED`), treating the ML model as just _one_ structural signal rather than the definitive truth.

---

## Troubleshooting

| Problem                               | Fix                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ModuleNotFoundError: flask`          | Run `pip install -r requirements.txt` inside `backend/`                                      |
| `FileNotFoundError: Fake.csv`         | Place `Fake.csv` and `True.csv` inside the `backend/` folder                                 |
| `Address already in use` on port 5000 | Kill the old process: `lsof -ti:5000                                                         |
| Frontend shows "Backend offline"      | Make sure `python app.py` is running and visit `http://localhost:5000/api/health` to confirm |
| Chrome extension can't connect        | Backend must be running. Chrome extensions can't reach `localhost` if Flask isn't started    |
| Training is slow                      | Normal — 60–90 seconds on a laptop. The vectorizer is building a 100k-feature matrix         |
| `pip` is Python 2 pip                 | Use `pip3` instead                                                                           |

---

## Quick reference

```bash
# One-time setup
cd backend && pip install -r requirements.txt

# Train (do once after downloading the CSVs)
python train_model.py

# Start server
python app.py

# Open frontend in your browser
[http://127.0.0.1:5000](http://127.0.0.1:5000)

```

```

```
