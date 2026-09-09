# syntax=docker/dockerfile:1
# ============================================================
# Backend image — FastAPI + uvicorn.
# Runs `alembic upgrade head` on start (see docker-entrypoint.sh),
# then serves the app on :8000. Runs as a non-root user.
# ============================================================
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependencies first so the layer caches across app-code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code (see .dockerignore — .env, tests, caches are excluded).
COPY . .

RUN chmod +x docker-entrypoint.sh \
    && adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Liveness probe — stdlib only, no curl in the image.
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/api/health', timeout=4).status == 200 else 1)"

ENTRYPOINT ["./docker-entrypoint.sh"]
