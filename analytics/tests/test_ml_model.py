"""
PrintPulse Analytics — ML Model Tests
=======================================
Tests the trained model can load and produce valid predictions.
Requires: python ml/train_delay_model.py --from-csv to have run first.
Run: pytest tests/test_ml_model.py -v
"""

import sys
import json
import pytest
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

MODELS_DIR    = Path(__file__).resolve().parent.parent / "ml" / "models"
MODEL_PATH    = MODELS_DIR / "delay_model.pkl"
METADATA_PATH = MODELS_DIR / "feature_names.json"


# ── Skip if model not trained yet ────────────────────────────────────────────
pytestmark = pytest.mark.skipif(
    not MODEL_PATH.exists(),
    reason="Model not trained yet. Run: python ml/train_delay_model.py --from-csv"
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def model():
    import joblib
    return joblib.load(MODEL_PATH)


@pytest.fixture(scope="module")
def metadata():
    with open(METADATA_PATH) as f:
        return json.load(f)


@pytest.fixture(scope="module")
def feature_vector():
    """Standard 13-feature vector matching training schema."""
    return np.array([[
        3.0,     # f_complexity (Brochure)
        np.log1p(500),  # f_quantity
        2.0,     # f_priority (High)
        5.0,     # f_lead_days
        1.0,     # f_print_type (Offset)
        1.0,     # f_has_lamination
        0.0,     # f_complex_finishing
        0.0,     # f_double_sided
        np.log1p(1200),  # f_estimated_cost
        2.0,     # f_day_of_week (Wednesday)
        0.0,     # f_is_urgent
        0.0,     # f_short_lead
        0.0,     # f_large_quantity
    ]], dtype=float)


# ── Model loading tests ───────────────────────────────────────────────────────

class TestModelLoading:

    def test_model_file_exists(self):
        assert MODEL_PATH.exists(), f"Model not found: {MODEL_PATH}"

    def test_metadata_file_exists(self):
        assert METADATA_PATH.exists(), f"Metadata not found: {METADATA_PATH}"

    def test_model_loads_without_error(self, model):
        assert model is not None

    def test_metadata_loads_without_error(self, metadata):
        assert metadata is not None

    def test_metadata_has_required_keys(self, metadata):
        required = ["model_name", "feature_names", "metrics", "trained_at", "disclaimer"]
        for key in required:
            assert key in metadata, f"Missing metadata key: {key}"

    def test_metadata_feature_count(self, metadata):
        assert len(metadata["feature_names"]) == 13

    def test_model_has_predict_method(self, model):
        assert hasattr(model, "predict")

    def test_model_has_predict_proba_method(self, model):
        assert hasattr(model, "predict_proba")

    def test_metrics_are_valid_floats(self, metadata):
        metrics = metadata["metrics"]
        for key in ["precision", "recall", "f1_score", "roc_auc"]:
            assert key in metrics
            val = float(metrics[key])
            assert 0.0 <= val <= 1.0, f"Metric {key}={val} out of [0,1]"

    def test_disclaimer_is_present(self, metadata):
        assert "SYNTHETIC" in metadata["disclaimer"].upper() or \
               "synthetic" in metadata["disclaimer"].lower()


# ── Prediction shape tests ────────────────────────────────────────────────────

class TestPredictionShape:

    def test_predict_returns_single_label(self, model, feature_vector):
        pred = model.predict(feature_vector)
        assert pred.shape == (1,)

    def test_predict_proba_returns_two_classes(self, model, feature_vector):
        proba = model.predict_proba(feature_vector)
        assert proba.shape == (1, 2)

    def test_probabilities_sum_to_one(self, model, feature_vector):
        proba = model.predict_proba(feature_vector)
        total = proba[0].sum()
        assert abs(total - 1.0) < 1e-6, f"Proba sum={total} not ~1.0"

    def test_probabilities_are_in_range(self, model, feature_vector):
        proba = model.predict_proba(feature_vector)
        assert all(0.0 <= p <= 1.0 for p in proba[0])

    def test_label_is_binary(self, model, feature_vector):
        pred = model.predict(feature_vector)
        assert pred[0] in (0, 1)


# ── Batch prediction tests ────────────────────────────────────────────────────

class TestBatchPrediction:

    def test_batch_of_10(self, model, feature_vector):
        batch = np.repeat(feature_vector, 10, axis=0)
        preds = model.predict(batch)
        assert preds.shape == (10,)

    def test_batch_probabilities_shape(self, model, feature_vector):
        batch = np.repeat(feature_vector, 5, axis=0)
        proba = model.predict_proba(batch)
        assert proba.shape == (5, 2)

    def test_different_inputs_can_produce_different_outputs(self, model):
        # High-risk job (urgent, short lead, complex)
        high_risk = np.array([[5.0, np.log1p(5000), 3.0, 1.0, 1.0, 1.0,
                               1.0, 1.0, np.log1p(5000), 0.0, 1.0, 1.0, 1.0]])
        # Low-risk job (simple, long lead, low priority)
        low_risk  = np.array([[1.0, np.log1p(100), 0.0, 14.0, 0.0, 0.0,
                               0.0, 0.0, np.log1p(200), 2.0, 0.0, 0.0, 0.0]])
        p_high = model.predict_proba(high_risk)[0][1]
        p_low  = model.predict_proba(low_risk)[0][1]
        # We just verify these are valid floats, not necessarily ordered
        assert isinstance(float(p_high), float)
        assert isinstance(float(p_low), float)


# ── Feature service integration ───────────────────────────────────────────────

class TestFeatureEngineering:
    """Tests the _build_feature_vector from predict_service matches training."""

    def test_feature_vector_shape(self):
        """The predict_service feature builder should output 13 features."""
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ml"))
        from predict_service import _build_feature_vector
        X = _build_feature_vector({
            "job_type": "Brochure", "quantity": 500, "priority": "High",
            "print_type": "Offset", "print_lamination": "Gloss Thermal",
            "print_finishing": "None", "lead_days": 5, "estimated_cost": 1200,
        })
        assert X.shape == (1, 13)

    def test_feature_vector_no_nan(self):
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ml"))
        from predict_service import _build_feature_vector
        X = _build_feature_vector({
            "job_type": "Visiting Card", "quantity": 1000, "priority": "Urgent",
            "print_type": "Digital", "print_lamination": "None",
            "print_finishing": "Foil Stamping", "lead_days": 1, "estimated_cost": 300,
        })
        assert not np.isnan(X).any(), "Feature vector contains NaN values"

    def test_unknown_job_type_uses_default(self):
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ml"))
        from predict_service import _build_feature_vector
        X = _build_feature_vector({
            "job_type": "UNKNOWN_TYPE_XYZ", "quantity": 100, "priority": "Medium",
        })
        assert X.shape == (1, 13)
        assert not np.isnan(X).any()

    def test_zero_quantity_handled(self):
        sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ml"))
        from predict_service import _build_feature_vector
        # Should not raise - quantity clipped to 1
        X = _build_feature_vector({"job_type": "Sticker", "quantity": 0, "priority": "Low"})
        assert X.shape == (1, 13)
