#!/bin/bash

echo "🚀 Starting Orbit Sentinel Development Server..."
echo "📁 Activating virtual environment..."
source venv/bin/activate

echo "📂 Changing to backend directory..."
cd backend

echo "🛰️ Starting FastAPI server..."
echo "📖 API Documentation: http://localhost:8000/docs"
echo "🌐 API Root: http://localhost:8000/"
echo "🛰️ Satellites: http://localhost:8000/satellites/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python -m app.main 