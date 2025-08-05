#!/bin/bash

# Video Reframe API startup script

set -e

echo "Starting Video Reframe API..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Copying from .env.example"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Please update .env file with your API keys before running the server."
        exit 1
    else
        echo "Error: .env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Create necessary directories
mkdir -p uploads logs

# Check if running in development or production
if [ "${DEBUG:-false}" = "true" ]; then
    echo "Starting in development mode..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level info
else
    echo "Starting in production mode..."
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --log-level info
fi