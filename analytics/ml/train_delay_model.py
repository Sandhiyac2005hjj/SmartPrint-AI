"""
PrintPulse Analytics — Delay Prediction Model Training
=======================================================
Trains a binary classifier to predict whether a print job will be delayed.

Problem:
    Given information available AT JOB CREATION TIME, predict whether the
    job will miss its promised delivery date (is_delayed = 1).

Target:
    - is_delayed = 1  →  job was late (actual_completion_date > expected_delivery_date)
    - is_delayed = 0  →  job was delivered on time

IMPORTANT:
    ⚠ Trained on SYNTHETIC DATA only. Model performance figures are for
    demonstration purposes. Do NOT use for actual business decisions.

Usage:
    python train_delay_model.py [--db-url URL] [--data-dir DIR] [--from-csv]

Output:
    analytics/ml/models/delay_model.pkl         — best model
    analytics/ml/models/feature_names.json      — feature list
    analytics/ml/reports/evaluation_report.txt  — full metrics
    analytics/ml/reports/feature_importance.csv — feature rankings
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd

# sklearn imports
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
import joblib

# ── Path setup ──────────────────────────────────────────────────────────────
THIS_DIR = Path(__file__).resolve().parent
ANALYTICS_DIR = THIS_DIR.parent
MODELS_DIR = THIS_DIR / "models"
REPORTS_DIR = THIS_DIR / "reports"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

sys.path.insert(0, str(ANALYTICS_DIR))

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(REPORTS_DIR / "training.log", encoding="utf-8"),
    ],
)
log = logging.getLogger("printpulse.ml")

# ── Constants ────────────────────────────────────────────────────────────────
RANDOM_SEED = 42
TEST_SIZE    = 0.20

# ── Categorical mappings ─────────────────────────────────────────────────────
JOB_TYPE_COMPLEXITY = {
    "Visiting Card": 1, "Sticker": 1, "Letterhead": 1, "Envelope": 1, "Label": 1,
    "Flex": 2, "Poster": 2, "Standee": 2, "Bill Book": 2,
    "Brochure": 3, "Invitation": 3, "Carry Bag": 3,
    "Offset": 4, "Catalogue": 5, "Packaging Box": 5,
}

PRIORITY_ORDER = {"Low": 0, "Medium": 1, "High": 2, "Urgent": 3}

PRINT_TYPE_ENC = {
    "Digital": 0, "Offset": 1, "Wide Format Outdoor": 2,
    "Screen Print": 3, "UV Print": 4,
}


# ─────────────────────────────────────────────────────────────────────────────
# DATA LOADING
# ─────────────────────────────────────────────────────────────────────────────

def load_from_csv(data_dir: Path) -> pd.DataFrame:
    """Load from generated synthetic CSV files."""
    csv_path = data_dir / "synthetic_jobs_clean.csv"
    if not csv_path.exists():
        raise FileNotFoundError(
            f"CSV not found: {csv_path}\n"
            "Run: python generate_synthetic_data.py first."
        )
    df = pd.read_csv(csv_path, low_memory=False)
    log.info(f"Loaded {len(df):,} rows from CSV: {csv_path}")
    return df


def load_from_db(db_url: str) -> pd.DataFrame:
    """Load from PostgreSQL database."""
    from sqlalchemy import create_engine, text
    engine = create_engine(db_url, pool_pre_ping=True)
    query = """
        SELECT
            job_type, quantity, paper_size, paper_gsm, paper_type,
            print_type, print_sides, print_color_mode,
            print_lamination, print_binding, print_cutting, print_finishing,
            priority, lead_days, complexity_score,
            estimated_cost, selling_price,
            job_date, expected_delivery_date, actual_completion_date,
            is_on_time, status, will_delay_flag,
            sheets_used, waste_sheets, rework_required
        FROM job_cards
        WHERE status = 'Delivered'
          AND is_on_time IS NOT NULL
          AND is_synthetic = true
    """
    with engine.connect() as conn:
        df = pd.read_sql(text(query), conn)
    log.info(f"Loaded {len(df):,} delivered synthetic jobs from database.")
    return df


# ─────────────────────────────────────────────────────────────────────────────
# FEATURE ENGINEERING  (NO DATA LEAKAGE — only info available at order time)
# ─────────────────────────────────────────────────────────────────────────────

def engineer_features(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """
    Build feature matrix X and target y from raw dataframe.

    LEAK-FREE POLICY:
      - ALLOWED: job_type, quantity, priority, print_type, paper specs,
                 finishing complexity flags, lead_days, complexity_score,
                 estimated_cost, day_of_week (derived from job_date).
      - FORBIDDEN: actual_completion_date, is_on_time (that's the target),
                   status (post-creation info), waste_sheets, rework_required
                   (only known after production).
    """
    df = df.copy()

    # --- Target ---
    # For CSV rows: use 'is_on_time'. Invert to get is_delayed.
    if "is_on_time" in df.columns:
        df["is_delayed"] = df["is_on_time"].map(
            lambda v: 0 if str(v).lower() in ("true", "1", "yes", "t") else 1
        )
    elif "will_delay_flag" in df.columns:
        df["is_delayed"] = df["will_delay_flag"].map(
            lambda v: 1 if str(v).lower() in ("true", "1", "yes", "t") else 0
        )
    else:
        raise ValueError("No target column found (is_on_time / will_delay_flag)")

    # --- Keep only delivered jobs with known outcome ---
    # Filter to rows where we have a valid target
    df = df[df["is_delayed"].notna()].copy()
    y = df["is_delayed"].astype(int)

    # --- Feature: complexity_score ---
    if "complexity_score" in df.columns and df["complexity_score"].notna().any():
        df["f_complexity"] = pd.to_numeric(df["complexity_score"], errors="coerce").fillna(2)
    else:
        df["f_complexity"] = df["job_type"].map(JOB_TYPE_COMPLEXITY).fillna(2)

    # --- Feature: quantity (log-scaled) ---
    df["f_quantity"] = np.log1p(
        pd.to_numeric(df["quantity"], errors="coerce").fillna(1).clip(lower=1)
    )

    # --- Feature: priority encoded ---
    df["f_priority"] = df["priority"].map(PRIORITY_ORDER).fillna(1)

    # --- Feature: lead_days ---
    df["f_lead_days"] = pd.to_numeric(df.get("lead_days", 3), errors="coerce").fillna(3)

    # --- Feature: print_type encoded ---
    df["f_print_type"] = df["print_type"].map(PRINT_TYPE_ENC).fillna(0)

    # --- Feature: has_lamination ---
    df["f_has_lamination"] = (
        df["print_lamination"].str.lower().isin(["none", "nan", ""]).map({True: 0, False: 1})
        if "print_lamination" in df.columns else 0
    )

    # --- Feature: has_foil_or_emboss (complex finishing) ---
    if "print_finishing" in df.columns:
        df["f_complex_finishing"] = df["print_finishing"].apply(
            lambda v: 1 if any(kw in str(v).lower() for kw in ("foil", "emboss", "spot uv")) else 0
        )
    else:
        df["f_complex_finishing"] = 0

    # --- Feature: is_double_sided ---
    if "print_sides" in df.columns:
        df["f_double_sided"] = (df["print_sides"] == "Double Side").astype(int)
    else:
        df["f_double_sided"] = 0

    # --- Feature: estimated_cost (log-scaled) ---
    df["f_estimated_cost"] = np.log1p(
        pd.to_numeric(df.get("estimated_cost", 500), errors="coerce").fillna(500)
    )

    # --- Feature: day_of_week (from job_date) ---
    try:
        df["f_day_of_week"] = pd.to_datetime(df["job_date"], errors="coerce").dt.dayofweek.fillna(0)
    except Exception:
        df["f_day_of_week"] = 0

    # --- Feature: is_urgent ---
    df["f_is_urgent"] = (df["priority"].str.lower() == "urgent").astype(int)

    # --- Feature: short_lead (< 3 days = rush job) ---
    df["f_short_lead"] = (df["f_lead_days"] < 3).astype(int)

    # --- Feature: large_quantity (> 1000) ---
    df["f_large_quantity"] = (pd.to_numeric(df["quantity"], errors="coerce").fillna(0) > 1000).astype(int)

    feature_cols = [
        "f_complexity", "f_quantity", "f_priority", "f_lead_days",
        "f_print_type", "f_has_lamination", "f_complex_finishing",
        "f_double_sided", "f_estimated_cost", "f_day_of_week",
        "f_is_urgent", "f_short_lead", "f_large_quantity",
    ]

    X = df[feature_cols].copy()
    log.info(f"  Feature matrix: {X.shape[0]:,} rows × {X.shape[1]} features")
    log.info(f"  Target balance: delayed={y.sum():,} ({y.mean()*100:.1f}%) | on-time={len(y)-y.sum():,}")

    return X, y, feature_cols


# ─────────────────────────────────────────────────────────────────────────────
# MODEL TRAINING & EVALUATION
# ─────────────────────────────────────────────────────────────────────────────

def train_and_evaluate(X: pd.DataFrame, y: pd.Series,
                       feature_cols: list[str]) -> dict:
    """
    Train multiple classifiers and return the best model with evaluation stats.
    """
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )
    log.info(f"  Train: {len(X_train):,}  |  Test: {len(X_test):,}")

    models = {
        "Logistic Regression (baseline)": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(
                class_weight="balanced", max_iter=500, random_state=RANDOM_SEED
            )),
        ]),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=8, class_weight="balanced",
            min_samples_leaf=20, random_state=RANDOM_SEED
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=100, max_depth=8, class_weight="balanced",
            min_samples_leaf=15, n_jobs=1, random_state=RANDOM_SEED
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=150, max_depth=5, learning_rate=0.05,
            random_state=RANDOM_SEED
        ),
    }

    results = {}
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)

    log.info("\n  ─── Cross-Validation Results ───")
    for name, model in models.items():
        cv_scores = cross_val_score(model, X_train, y_train, cv=cv,
                                    scoring="f1", n_jobs=1)
        results[name] = {
            "model": model,
            "cv_f1_mean": cv_scores.mean(),
            "cv_f1_std": cv_scores.std(),
        }
        log.info(f"  {name:<35}  CV F1: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # Pick best model by CV F1
    best_name = max(results, key=lambda k: results[k]["cv_f1_mean"])
    best_model = results[best_name]["model"]
    log.info(f"\n  ✓ Best model: {best_name}")

    # Final fit on full training set
    best_model.fit(X_train, y_train)
    y_pred   = best_model.predict(X_test)
    y_proba  = best_model.predict_proba(X_test)[:, 1]

    precision = precision_score(y_test, y_pred, zero_division=0)
    recall    = recall_score(y_test, y_pred, zero_division=0)
    f1        = f1_score(y_test, y_pred, zero_division=0)
    roc_auc   = roc_auc_score(y_test, y_proba)
    cm        = confusion_matrix(y_test, y_pred)
    report    = classification_report(y_test, y_pred,
                                      target_names=["On-Time", "Delayed"])

    log.info(f"\n  ─── Test Set Evaluation: {best_name} ───")
    log.info(f"  Precision:  {precision:.4f}")
    log.info(f"  Recall:     {recall:.4f}")
    log.info(f"  F1-Score:   {f1:.4f}")
    log.info(f"  ROC-AUC:    {roc_auc:.4f}")
    log.info(f"  Confusion Matrix:\n  {cm}")

    # Feature importance (for tree-based models)
    feature_importance = _get_feature_importance(best_model, feature_cols)

    return {
        "best_name": best_name,
        "best_model": best_model,
        "results": results,
        "X_train": X_train,
        "X_test": X_test,
        "y_train": y_train,
        "y_test": y_test,
        "y_pred": y_pred,
        "y_proba": y_proba,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc,
        "confusion_matrix": cm,
        "classification_report": report,
        "feature_importance": feature_importance,
    }


def _get_feature_importance(model, feature_cols: list[str]) -> dict[str, float]:
    """Extract feature importances from any model type."""
    try:
        clf = model.named_steps.get("clf") if hasattr(model, "named_steps") else model
        if hasattr(clf, "feature_importances_"):
            return dict(zip(feature_cols, clf.feature_importances_))
        elif hasattr(clf, "coef_"):
            coef = np.abs(clf.coef_[0])
            return dict(zip(feature_cols, coef / coef.sum()))
    except Exception:
        pass
    return {}


# ─────────────────────────────────────────────────────────────────────────────
# SAVE ARTIFACTS
# ─────────────────────────────────────────────────────────────────────────────

def save_artifacts(eval_result: dict, feature_cols: list[str],
                   train_size: int, test_size: int) -> None:
    """Save model, feature names, and evaluation report."""
    model_path = MODELS_DIR / "delay_model.pkl"
    features_path = MODELS_DIR / "feature_names.json"
    report_path = REPORTS_DIR / "evaluation_report.txt"
    importance_path = REPORTS_DIR / "feature_importance.csv"

    # Save model
    joblib.dump(eval_result["best_model"], model_path)
    log.info(f"  ✓ Model saved: {model_path}")

    # Save feature names + metadata
    meta = {
        "model_name": eval_result["best_name"],
        "feature_names": feature_cols,
        "trained_at": datetime.now().isoformat(),
        "train_samples": train_size,
        "test_samples": test_size,
        "random_seed": RANDOM_SEED,
        "disclaimer": (
            "⚠ Trained on SYNTHETIC data only. "
            "For portfolio demonstration purposes. "
            "Not validated on real business data."
        ),
        "metrics": {
            "precision": round(eval_result["precision"], 4),
            "recall": round(eval_result["recall"], 4),
            "f1_score": round(eval_result["f1"], 4),
            "roc_auc": round(eval_result["roc_auc"], 4),
        },
        "all_model_cv_f1": {
            name: {
                "cv_f1_mean": round(r["cv_f1_mean"], 4),
                "cv_f1_std": round(r["cv_f1_std"], 4),
            }
            for name, r in eval_result["results"].items()
        },
    }
    with open(features_path, "w") as f:
        json.dump(meta, f, indent=2)
    log.info(f"  ✓ Feature metadata saved: {features_path}")

    # Evaluation text report
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=" * 65 + "\n")
        f.write("PrintPulse Analytics — Delay Prediction Model Report\n")
        f.write("=" * 65 + "\n")
        f.write(f"Generated:     {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Best Model:    {eval_result['best_name']}\n")
        f.write(f"Train Samples: {train_size:,}\n")
        f.write(f"Test Samples:  {test_size:,}\n")
        f.write(f"Random Seed:   {RANDOM_SEED}\n")
        f.write("\n⚠ SYNTHETIC DATA DISCLAIMER\n")
        f.write("All results are based on synthetic data generated with fixed\n")
        f.write("random seed 42. This is for portfolio demonstration only.\n")
        f.write("\n─── All Models (Cross-Validation F1) ───\n")
        for name, r in eval_result["results"].items():
            f.write(f"  {name:<35}  {r['cv_f1_mean']:.4f} ± {r['cv_f1_std']:.4f}\n")
        f.write(f"\n─── Best Model Test Set Metrics ───\n")
        f.write(f"  Precision:  {eval_result['precision']:.4f}\n")
        f.write(f"  Recall:     {eval_result['recall']:.4f}\n")
        f.write(f"  F1-Score:   {eval_result['f1']:.4f}\n")
        f.write(f"  ROC-AUC:    {eval_result['roc_auc']:.4f}\n")
        f.write(f"\n─── Confusion Matrix ───\n")
        cm = eval_result["confusion_matrix"]
        f.write(f"               Pred On-Time  Pred Delayed\n")
        f.write(f"  Actual On-Time   {cm[0][0]:<10}  {cm[0][1]}\n")
        f.write(f"  Actual Delayed   {cm[1][0]:<10}  {cm[1][1]}\n")
        f.write(f"\n─── Classification Report ───\n")
        f.write(eval_result["classification_report"])
        f.write(f"\n─── Feature Importances ───\n")
        for feat, imp in sorted(eval_result["feature_importance"].items(),
                                key=lambda x: -x[1]):
            bar = "█" * int(imp * 40)
            f.write(f"  {feat:<25}  {imp:.4f}  {bar}\n")
    log.info(f"  ✓ Evaluation report saved: {report_path}")

    # Feature importance CSV
    if eval_result["feature_importance"]:
        rows = sorted(eval_result["feature_importance"].items(), key=lambda x: -x[1])
        with open(importance_path, "w") as f:
            f.write("feature,importance\n")
            for feat, imp in rows:
                f.write(f"{feat},{imp:.6f}\n")
        log.info(f"  ✓ Feature importance CSV saved: {importance_path}")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def build_db_url(args) -> str:
    if hasattr(args, "db_url") and args.db_url:
        return args.db_url
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    host = os.environ.get("DB_HOST", "localhost")
    port = os.environ.get("DB_PORT", "5432")
    db   = os.environ.get("DB_NAME", "jobcard_db")
    user = os.environ.get("DB_USERNAME", "postgres")
    pwd  = os.environ.get("DB_PASSWORD", "postgres")
    return f"postgresql+psycopg2://{user}:{pwd}@{host}:{port}/{db}"


def main():
    parser = argparse.ArgumentParser(
        description="PrintPulse — Train print job delay prediction model"
    )
    parser.add_argument("--db-url", help="SQLAlchemy database URL (overrides env vars)")
    parser.add_argument("--data-dir", default="../output",
                        help="Directory containing synthetic CSVs (default: ../output)")
    parser.add_argument("--from-csv", action="store_true",
                        help="Load from CSV files instead of database (default if DB unreachable)")
    args = parser.parse_args()

    log.info("╔══════════════════════════════════════════════════════════╗")
    log.info("║  PrintPulse Analytics — Delay Prediction Model Training  ║")
    log.info("║  ⚠  SYNTHETIC DATA ONLY — NOT REAL BUSINESS DATA        ║")
    log.info("╚══════════════════════════════════════════════════════════╝")

    # --- Load data ---
    if args.from_csv:
        df = load_from_csv(Path(args.data_dir))
    else:
        try:
            db_url = build_db_url(args)
            log.info(f"Connecting to DB: {db_url.split('@')[-1]}")
            df = load_from_db(db_url)
            if len(df) < 100:
                log.warning("Few DB rows (<100). Falling back to CSV.")
                df = load_from_csv(Path(args.data_dir))
        except Exception as e:
            log.warning(f"DB load failed ({e}), falling back to CSV.")
            df = load_from_csv(Path(args.data_dir))

    # Filter to deliverable subset if loading from full CSV
    if "status" in df.columns:
        delivered = df[df["status"] == "Delivered"].copy()
        if len(delivered) < 50:
            log.warning("Too few Delivered records; using all records with is_on_time flag.")
            delivered = df[df["is_on_time"].notna()].copy()
        df = delivered

    log.info(f"\nDataset size (Delivered jobs): {len(df):,}")

    # --- Feature engineering ---
    log.info("\n── Feature Engineering ──")
    X, y, feature_cols = engineer_features(df)

    # --- Train & evaluate ---
    log.info("\n── Model Training & Evaluation ──")
    eval_result = train_and_evaluate(X, y, feature_cols)

    # --- Save artifacts ---
    log.info("\n── Saving Artifacts ──")
    save_artifacts(
        eval_result, feature_cols,
        train_size=len(eval_result["X_train"]),
        test_size=len(eval_result["X_test"]),
    )

    log.info("\n✅ Training complete!")
    log.info(f"   Best model : {eval_result['best_name']}")
    log.info(f"   F1-Score   : {eval_result['f1']:.4f}")
    log.info(f"   ROC-AUC    : {eval_result['roc_auc']:.4f}")
    log.info(f"   Model file : {MODELS_DIR / 'delay_model.pkl'}")


if __name__ == "__main__":
    main()
