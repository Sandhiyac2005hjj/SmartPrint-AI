# analytics/conftest.py
# Adds the analytics root to sys.path so all test imports resolve correctly.
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
