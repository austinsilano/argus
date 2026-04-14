#!/bin/bash
set -e

echo "=== AI Shadow IT Scanner - WSL/Linux Local Setup ==="

# Check Docker is available
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not found. Install Docker Desktop (Windows) or docker.io (Linux)."
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "ERROR: docker compose not found. Make sure Docker Desktop is up to date."
    exit 1
fi

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Building and starting containers..."
docker compose up --build -d

echo ""
echo "Waiting for backend to be ready..."
for i in $(seq 1 30); do
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo ""
        echo "================================================"
        echo " Backend is live at: http://localhost:8000"
        echo " API docs at:        http://localhost:8000/docs"
        echo " Health check:       http://localhost:8000/health"
        echo "================================================"
        exit 0
    fi
    printf "."
    sleep 2
done

echo ""
echo "Backend did not respond in time. Check logs with:"
echo "  docker compose logs backend"
exit 1
