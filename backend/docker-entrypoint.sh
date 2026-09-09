#!/bin/sh
# Applies pending Alembic migrations, then starts the API.
# MySQL may still be starting when this container comes up, so the
# `alembic upgrade` is retried for a while before giving up.
set -e

echo "[entrypoint] applying database migrations..."
attempt=0
until alembic upgrade head; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 30 ]; then
        echo "[entrypoint] database not reachable after $attempt attempts — aborting." >&2
        exit 1
    fi
    echo "[entrypoint] alembic upgrade failed (attempt $attempt/30) — retrying in 2s..."
    sleep 2
done

echo "[entrypoint] migrations applied — starting uvicorn on :8000"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
