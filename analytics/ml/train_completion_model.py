"""
PrintPulse Analytics — Job Completion Time Prediction Model Training
=====================================================================
Trains a regression model to accurately predict the actual completion
turnaround days and completion date for print jobs based on physical specs.

Target:
    actual_days = (actual_completion_date - job_date).days

Key Features (Pure Creation Specs — No Delivery Date Leakage):
    - job_type (complexity mapping)
    - base_days (complexity * 2)
    - quantity (scale & log)
    - priority (priority turnaround discount)
    - print_type (Digital vs Offset vs UV)
    - print_lamination (has lamination)
    - print_finishing (Foil, Emboss, Spot UV)
    - print_sides (Single vs Double Side)

Artifacts Saved:
    analytics/ml/models/completion_model.pkl
    analytics/ml/models/completion_model_info.json
    analytics/ml/reports/completion_evaluation_report.txt
"""

from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, median_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import train_test_split
import joblib

THIS_DIR = Path(__file__).resolve().parent
MODELS_DIR = THIS_DIR / "models"
REPORTS_DIR = THIS_DIR / "reports"
OUTPUT_DIR = THIS_DIR.parent / "output"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("completion_model")

JOB_TYPE_COMPLEXITY = {
    "Visiting Card": 1, "Sticker": 1, "Letterhead": 1, "Envelope": 1, "Label": 1,
    "Flex": 2, "Poster": 2, "Standee": 2, "Bill Book": 2,
    "Brochure": 3, "Invitation": 3, "Carry Bag": 3,
    "Offset": 4, "Catalogue": 5, "Packaging Box": 5,
}

PRIORITY_DISCOUNT = {"Urgent": 2, "High": 1, "Medium": 0, "Low": -1}

PRINT_TYPE_MAP = {
    "Digital": 0, "Wide Format Outdoor": 1, "Screen Print": 2, "Offset": 3, "UV Print": 4
}


def build_feature_vector(data: pd.DataFrame) -> pd.DataFrame:
    """Build pure spec feature vector."""
    X = pd.DataFrame(index=data.index)
    job_type = data.get("job_type", "Visiting Card")
    X["complexity"] = job_type.map(JOB_TYPE_COMPLEXITY).fillna(2)
    X["base_days"] = X["complexity"] * 2

    qty = pd.to_numeric(data.get("quantity", 1), errors="coerce").fillna(1)
    X["quantity"] = qty
    X["qty_factor"] = (qty // 1000).clip(lower=0)
    X["qty_log"] = np.log1p(qty)

    priority = data.get("priority", "Medium")
    X["priority_val"] = priority.map(PRIORITY_DISCOUNT).fillna(0)

    lamination = data.get("print_lamination", "").astype(str).str.lower()
    X["has_lamination"] = (~lamination.isin(["none", "", "nan"])).astype(int)

    sides = data.get("print_sides", "Single Side")
    X["is_double_sided"] = (sides == "Double Side").astype(int)

    finishing = data.get("print_finishing", "").astype(str)
    X["has_foil"] = finishing.str.contains("Foil|Emboss|UV", case=False).astype(int)

    print_type = data.get("print_type", "Digital")
    X["print_type_code"] = print_type.map(PRINT_TYPE_MAP).fillna(0)

    return X


def train():
    csv_path = OUTPUT_DIR / "synthetic_jobs_clean.csv"
    if not csv_path.exists():
        log.error(f"Data file not found at {csv_path}")
        return

    log.info(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    delivered = df[df["status"] == "Delivered"].copy()

    delivered["job_dt"] = pd.to_datetime(delivered["job_date"])
    delivered["comp_dt"] = pd.to_datetime(delivered["actual_completion_date"])
    delivered["actual_days"] = (delivered["comp_dt"] - delivered["job_dt"]).dt.days

    delivered = delivered[delivered["actual_days"] > 0]
    log.info(f"Training on {len(delivered):,} delivered jobs...")

    X = build_feature_vector(delivered)
    y = delivered["actual_days"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    log.info("Training GradientBoostingRegressor on physical turnaround specs...")
    model = GradientBoostingRegressor(
        n_estimators=250,
        max_depth=5,
        learning_rate=0.04,
        subsample=0.9,
        random_state=42,
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    errors = np.abs(y_test - preds)

    r2 = r2_score(y_test, preds)
    mae = mean_absolute_error(y_test, preds)
    med_ae = median_absolute_error(y_test, preds)
    rmse = root_mean_squared_error(y_test, preds)
    acc_1day = float((errors <= 1.0).mean() * 100)
    acc_2days = float((errors <= 2.0).mean() * 100)

    log.info("=" * 60)
    log.info(f"  R2 Score:                     {r2:.4f}")
    log.info(f"  Mean Absolute Error (MAE):    {mae:.2f} days")
    log.info(f"  Median Absolute Error:        {med_ae:.2f} days")
    log.info(f"  RMSE:                         {rmse:.2f} days")
    log.info(f"  Accuracy (within +/- 1 day):  {acc_1day:.1f}%")
    log.info(f"  Accuracy (within +/- 2 days): {acc_2days:.1f}%")
    log.info("=" * 60)

    model_path = MODELS_DIR / "completion_model.pkl"
    joblib.dump(model, model_path)
    log.info(f"Model saved to {model_path}")

    feature_names = list(X.columns)
    importances = dict(zip(feature_names, [round(float(v), 4) for v in model.feature_importances_]))
    sorted_importances = dict(sorted(importances.items(), key=lambda item: item[1], reverse=True))

    info = {
        "model_name": "Gradient Boosting Regressor (Turnaround Completion Predictor)",
        "target": "actual_completion_days",
        "trained_at": datetime.now().isoformat(),
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "metrics": {
            "r2_score": round(float(r2), 4),
            "mae_days": round(float(mae), 2),
            "median_ae_days": round(float(med_ae), 2),
            "rmse_days": round(float(rmse), 2),
            "acc_within_1_day_pct": round(acc_1day, 1),
            "acc_within_2_days_pct": round(acc_2days, 1),
        },
        "feature_names": feature_names,
        "feature_importances": sorted_importances,
    }

    info_path = MODELS_DIR / "completion_model_info.json"
    with open(info_path, "w", encoding="utf-8") as f:
        json.dump(info, f, indent=2)
    log.info(f"Model metadata saved to {info_path}")

    report_path = REPORTS_DIR / "completion_evaluation_report.txt"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("=================================================================\n")
        f.write("PrintPulse Analytics — Job Completion Time Prediction Report\n")
        f.write("=================================================================\n")
        f.write(f"Trained:        {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Model:          Gradient Boosting Regressor (Physical Specs)\n")
        f.write(f"Train Samples:  {len(X_train):,}\n")
        f.write(f"Test Samples:   {len(X_test):,}\n\n")
        f.write("--- Metrics ---\n")
        f.write(f"R2 Score:                    {r2:.4f}\n")
        f.write(f"Mean Absolute Error (MAE):   {mae:.2f} days\n")
        f.write(f"Median Absolute Error:       {med_ae:.2f} days\n")
        f.write(f"Root Mean Squared Error:     {rmse:.2f} days\n")
        f.write(f"Accuracy (within +/- 1 day): {acc_1day:.1f}%\n")
        f.write(f"Accuracy (within +/- 2 days):{acc_2days:.1f}%\n\n")
        f.write("--- Feature Importance ---\n")
        for k, v in sorted_importances.items():
            f.write(f"  {k:<22} {v:.4f}\n")

    log.info(f"Evaluation report written to {report_path}")


if __name__ == "__main__":
    train()
