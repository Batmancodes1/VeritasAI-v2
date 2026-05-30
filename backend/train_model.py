"""
VeritasAI — ML Training Script (Stabilization Pass)
Model: TF-IDF + Logistic Regression
Dataset: Kaggle Fake and Real News Dataset

Steps:
  1. Download Fake.csv and True.csv from:
     https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset
  2. Place both files in the same folder as this script (backend/)
  3. Run: python train_model.py
  4. This saves model.pkl — Flask loads it automatically on next start

Expected results: ~98–99% accuracy on this dataset.
"""

import pandas as pd
import numpy as np
import pickle
import re
import time
import os
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    classification_report, accuracy_score,
    confusion_matrix, roc_auc_score
)


# ─────────────────────────────────────────────
# PREPROCESSING
# ─────────────────────────────────────────────

def preprocess(text):
    """
    Clean and normalize article text.
    Must match exactly what app.py uses at inference time.
    """
    text = str(text).lower()
    text = re.sub(r'https?://\S+|www\.\S+', '', text)   # Remove URLs
    text = re.sub(r'<.*?>', '', text)                     # Remove HTML tags
    text = re.sub(r'[^a-zA-Z\s]', ' ', text)             # Letters only
    text = re.sub(r'\s+', ' ', text).strip()
    return text


# ─────────────────────────────────────────────
# DATA LOADING
# ─────────────────────────────────────────────

def load_dataset():
    print("📂 Loading dataset...")
    try:
        fake_df = pd.read_csv('Fake.csv')
        true_df = pd.read_csv('True.csv')
    except FileNotFoundError:
        print("\n❌ Dataset not found!")
        print("   Download from: https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset")
        print("   Place Fake.csv and True.csv in the backend/ folder, then re-run.\n")
        raise

    fake_df['label'] = 1   # 1 = Fake
    true_df['label'] = 0   # 0 = Real

    df = pd.concat([fake_df, true_df], ignore_index=True)
    df = df[['title', 'text', 'label']].dropna()

    # Combine title + body for richer feature space
    # Title carries strong signal (sensationalist headlines) — include it weighted
    df['combined'] = df['title'] + ' ' + df['title'] + ' ' + df['text']
    df['combined'] = df['combined'].apply(preprocess)

    # Shuffle
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    print(f"   Total articles : {len(df):,}")
    print(f"   Fake           : {fake_df.shape[0]:,}")
    print(f"   Real           : {true_df.shape[0]:,}")
    print(f"   Balance        : {fake_df.shape[0]/len(df)*100:.1f}% fake / {true_df.shape[0]/len(df)*100:.1f}% real\n")

    return df


# ─────────────────────────────────────────────
# MODEL TRAINING — best possible settings
# ─────────────────────────────────────────────

def build_pipeline():
    """
    TF-IDF + Logistic Regression pipeline tuned for maximum accuracy.
    """
    return Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=100_000,
            ngram_range=(1, 3),
            stop_words='english',
            min_df=2,
            max_df=0.95,
            sublinear_tf=True,
            analyzer='word',
            token_pattern=r'\b[a-zA-Z][a-zA-Z]+\b',
        )),
        ('clf', LogisticRegression(
            C=10.0,
            max_iter=2000,
            solver='lbfgs',
            class_weight='balanced',
            random_state=42,
            n_jobs=-1,
        )),
    ])


def train(df):
    X = df['combined']
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.15,       # 85/15 split — more training data
        random_state=42,
        stratify=y,
    )

    print(f"📊 Train size : {len(X_train):,}")
    print(f"   Test size  : {len(X_test):,}\n")

    pipeline = build_pipeline()

    print("⚙️  Training pipeline (this takes ~60 seconds)...")
    start = time.time()
    pipeline.fit(X_train, y_train)
    elapsed = time.time() - start
    print(f"   Done in {elapsed:.1f}s\n")

    # ── Evaluation ──────────────────────────────
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    acc     = accuracy_score(y_test, y_pred)
    auc     = roc_auc_score(y_test, y_prob)
    cm      = confusion_matrix(y_test, y_pred)

    print("═" * 50)
    print(f"  Accuracy  : {acc*100:.2f}%")
    print(f"  ROC-AUC   : {auc:.4f}")
    print("═" * 50)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Real', 'Fake']))

    print("Confusion Matrix:")
    print(f"  True Real  (TN): {cm[0][0]:>6,}")
    print(f"  False Fake (FP): {cm[0][1]:>6,}  ← real articles incorrectly flagged as fake")
    print(f"  False Real (FN): {cm[1][0]:>6,}  ← fake articles incorrectly flagged as real")
    print(f"  True Fake  (TP): {cm[1][1]:>6,}")

    return pipeline


def save_model(pipeline, path='model.pkl'):
    with open(path, 'wb') as f:
        pickle.dump(pipeline, f, protocol=pickle.HIGHEST_PROTOCOL)
    size_mb = os.path.getsize(path) / 1_000_000 if os.path.exists(path) else 0
    print(f"\n✅ Model saved → {path}")
    print(f"   File size : {size_mb:.1f} MB")


def demo_predictions(pipeline):
    """Quick sanity check on a few sample headlines using the stabilized logic format"""
    samples = [
        ("Reuters Science", "Scientists confirm new vaccine is safe after large clinical trials"),
        ("Fake Conspiracy", "SHOCKING: Government HIDING miracle cure Big Pharma doesn't want you to know!!"),
        ("Clickbait",       "You won't believe what this politician did — jaw-dropping scandal REVEALED"),
        ("AP News",         "Federal Reserve holds interest rates steady amid economic uncertainty"),
        ("Misinformation",  "WAKE UP SHEEPLE!! Deep state CENSORING truth about plandemic cure!!"),
    ]

    print("\n=== Sample Predictions ===")
    for label, text in samples:
        cleaned = preprocess(text)
        prob = pipeline.predict_proba([cleaned])[0]
        fake_prob, real_prob = float(prob[1]), float(prob[0])
        
        # Apply the new >= 65% verification threshold used in app.py
        if real_prob >= 0.65:
            verdict = "VERIFIED REAL"
            icon = "✅"
        elif fake_prob >= 0.65:
            verdict = "VERIFIED FAKE"
            icon = "❌"
        else:
            verdict = "CLAIM NOT ESTABLISHED"
            icon = "⚠️"

        print(f"\n  {icon} [{label}]")
        print(f"     Text    : {text[:70]}...")
        print(f"     Verdict : {verdict}")
        # Developer output only
        print(f"     [Internal Probs] Real={real_prob*100:.1f}% | Fake={fake_prob*100:.1f}%")


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == '__main__':
    print("\n╔══════════════════════════════════╗")
    print("║  VeritasAI — Model Training      ║")
    print("╚══════════════════════════════════╝\n")

    df       = load_dataset()
    pipeline = train(df)
    save_model(pipeline)
    demo_predictions(pipeline)

    print("\n🚀 Next step: python app.py")
    print("   The Flask server will auto-load model.pkl on startup.\n")