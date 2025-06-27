#!/bin/bash

echo "🚀 Starting Orbit Sentinel Full-Stack Development Environment..."
echo ""

# Function to kill background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    pkill -f "python -m app.main"
    pkill -f "next-server"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "📦 Activating Python virtual environment..."
source venv/bin/activate

echo "🛰️ Starting FastAPI backend server..."
cd backend
python -m app.main &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 3

echo "🎨 Starting Next.js frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Orbit Sentinel is now running!"
echo "📊 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📖 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for any process to finish
wait 