# ── Python ML Service Dockerfile ─────────────────────────────────────────────
FROM python:3.12-slim
WORKDIR /app

# Install only runtime dependencies (no dev tools)
COPY requirements.txt .
RUN pip install --no-cache-dir \
    flask==3.0.0 \
    flask-cors==4.0.0 \
    scikit-learn==1.4.2 \
    joblib==1.4.2 \
    numpy==1.26.4 \
    pandas==2.2.2 \
    python-dotenv==1.0.1

# Copy ML service code and models directory (mounted at runtime if needed)
COPY ml/ ./ml/

ENV PYTHONUNBUFFERED=1
EXPOSE 5001

CMD ["python", "ml/predict_service.py", "--port", "5001"]
