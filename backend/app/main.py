from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Import routers
from .api.satellites import router as satellites_router
from .api.dashboard import router as dashboard_router

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Orbit Sentinel API",
    description="Space Collision Avoidance System - Real-time satellite tracking and collision prediction",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(satellites_router)
app.include_router(dashboard_router)

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "🛰️ Orbit Sentinel API is running!",
        "status": "active",
        "version": "1.0.0",
        "description": "Space Collision Avoidance System",
        "endpoints": {
            "docs": "/docs",
            "satellites": "/satellites/",
            "dashboard": "/api/dashboard/",
            "health": "/health"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "service": "orbit-sentinel",
        "message": "All systems operational 🚀"
    }

@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    logger.info("🚀 Orbit Sentinel API starting up...")
    logger.info("✅ Satellite tracking service initialized")

@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    logger.info("🛑 Orbit Sentinel API shutting down...")
    # Clean up resources
    from .services.satellite_service import satellite_service
    await satellite_service.close()
    logger.info("✅ Resources cleaned up")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info") 