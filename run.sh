#!/bin/bash

# ================================
# 🚀 Full-Stack Project Runner
# ================================

set -e

# --- 1. CONFIGURATION CHECK ---
if [ ! -f .env ]; then
  echo "❌ .env file not found! Please create a .env file from .env.template."
  exit 1
fi

echo "📄 Loading environment variables from .env..."
set -a
source .env
set +a

# --- 2. DEPENDENCY SETUP ---

echo "🛠️ Checking dependencies..."

if [ ! -d "backend/.venv" ]; then
  echo "🐍 Python virtual environment not found. Creating and installing dependencies..."
  python3 -m venv backend/.venv
  # Corrected: Activate the virtual environment immediately after creation
  source backend/.venv/bin/activate
  pip install -r backend/requirements.txt
else
  echo "✅ Python virtual environment found."
  # Corrected: Activate the virtual environment
  source backend/.venv/bin/activate
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Node.js dependencies not found. Installing..."
  cd frontend
  npm install
  cd ..
else
  echo "✅ Node.js dependencies found."
fi

# --- Database creation & seeding (only if missing) ---
DB_FILE="backend/sales_portal.db"
if [ ! -f "$DB_FILE" ]; then
    echo "🗄️ No database found. Creating tables..."
    # This command will now run inside the activated virtual environment
    python3 -m backend.create_db

    echo "🌱 Seeding initial data..."
    # This command will also run inside the activated virtual environment
    python3 -m backend.seed_db
else
    echo "✅ Database already exists. Skipping creation and seeding."
fi

# --- 3. ENVIRONMENT VARIABLE DISTRIBUTION ---
# First, update root .env with correct API URL
if [ -n "$NGROK_DOMAIN" ]; then
  echo "🌐 Using Ngrok domain for API base URL: https://$NGROK_DOMAIN"
  # 'sed -i' may not work on all systems. Using a temporary file is more portable.
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' '/^VITE_API_BASE_URL=/d' .env
  else
    # Linux
    sed -i '/^VITE_API_BASE_URL=/d' .env
  fi
  echo "VITE_API_BASE_URL=https://$NGROK_DOMAIN" >> .env
else
  echo "💻 Using localhost for API base URL"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' '/^VITE_API_BASE_URL=/d' .env
  else
    sed -i '/^VITE_API_BASE_URL=/d' .env
  fi
  echo "VITE_API_BASE_URL=http://localhost:8000" >> .env
fi

# Now copy the updated .env to backend & frontend
echo "📋 Copying updated .env file to backend/ and frontend/..."
cp .env backend/.env || echo "Could not copy .env to backend/, check permissions."
cp .env frontend/.env || echo "Could not copy .env to frontend/, check permissions."

# --- 4. CONDITIONAL EXECUTION & CLEANUP ---

# Use an array to store PIDs of all background processes
PIDS=()

# Cleanup function to kill all tracked PIDs
cleanup() {
  echo "🛑 Shutting down processes..."
  # Deactivate the virtual environment on cleanup
  deactivate
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      echo "Killing PID: $pid"
      kill "$pid" 2>/dev/null
    fi
  done
  exit 0
}

# Trap SIGINT (Ctrl+C) and call the cleanup function
trap cleanup SIGINT

if [ -n "$NGROK_DOMAIN" ]; then
  # =================================
  # 🌐 NGrok Mode
  # =================================
  echo "🚀 Starting in Ngrok mode with domain: $NGROK_DOMAIN"

  # Use a more specific kill command
  pkill -f "uvicorn.*main:app" 2>/dev/null || true
  pkill -f "ngrok http" 2>/dev/null || true

  echo "📦 Building frontend for production..."
  cd frontend && npm run build && cd ..

  echo "🚀 Starting backend..."
  # Use the virtual environment's uvicorn
  uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
  PIDS+=($!)
  sleep 2

  echo "🌐 Starting ngrok with reserved domain: $NGROK_DOMAIN"
  ngrok http --domain="$NGROK_DOMAIN" 8000 > /dev/null &
  PIDS+=($!)
  sleep 2

  MAX_RETRIES=10
  for i in $(seq 1 $MAX_RETRIES); do
    NGROK_URL=$(curl --silent http://127.0.0.1:4040/api/tunnels | grep -o 'https://[a-zA-Z0-9.-]*.ngrok-free.app' | head -n 1)
    if [ -n "$NGROK_URL" ]; then
      echo "🎉 App is live at: $NGROK_URL"
      break
    fi
    sleep 1
  done

  if [ -z "$NGROK_URL" ]; then
    echo "❌ Ngrok failed to start or URL not found."
    cleanup
  fi

else
  # =================================
  # 💻 Local Development Mode
  # =================================
  echo "🚀 Starting in Local Development mode..."

  echo "📦 Building frontend..."
  cd frontend && npm run build && cd ..

  echo "Backend starting at http://localhost:8000 ..."
  # Use the virtual environment's uvicorn
  uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000 &
  PIDS+=($!)
  sleep 1

  echo "Frontend starting at http://localhost:5173 ..."
  cd frontend
  npm run dev &
  PIDS+=($!)
  cd ..

  echo "🎉 Project is running locally. Press CTRL+C to exit."
fi

# Wait for all background processes to finish
wait
