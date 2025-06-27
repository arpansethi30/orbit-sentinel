from fastapi import APIRouter, HTTPException, Query, Path
from typing import Optional, List
import logging

from ..services.satellite_service import satellite_service
from ..services.space_weather import space_weather_service
from ..services.collision_detection import collision_service
from ..models.satellite import SatelliteResponse, SatelliteData, SpaceWeatherData

# Set up logging
logger = logging.getLogger(__name__)

# Create router for satellite endpoints
router = APIRouter(prefix="/satellites", tags=["satellites"])

@router.get("/", response_model=SatelliteResponse)
async def get_satellites(
    limit: int = Query(default=50, ge=1, le=1000, description="Number of satellites to return"),
    include_orbital: bool = Query(default=True, description="Include orbital mechanics calculations"),
    include_weather: bool = Query(default=True, description="Include space weather data"),
    include_risk: bool = Query(default=True, description="Include collision risk assessment")
):
    """
    Get active satellites with comprehensive analysis
    
    This endpoint provides:
    - Real-time satellite positions and orbital data
    - Space weather conditions affecting satellites  
    - Collision risk assessment and proximity alerts
    - Object classification (PAYLOAD/ROCKET_BODY/DEBRIS)
    
    Args:
        limit: Maximum number of satellites to return (1-1000)
        include_orbital: Whether to calculate orbital positions and mechanics
        include_weather: Whether to include current space weather data
        include_risk: Whether to perform collision risk assessment
        
    Returns:
        SatelliteResponse with enhanced satellite data
    """
    try:
        logger.info(f"Fetching {limit} satellites with orbital={include_orbital}, weather={include_weather}, risk={include_risk}")
        
        result = await satellite_service.get_active_satellites(
            limit=limit,
            include_orbital_data=include_orbital,
            include_space_weather=include_weather,
            include_collision_risk=include_risk
        )
        
        if not result:
            raise HTTPException(
                status_code=503, 
                detail="Unable to fetch satellite data from external sources"
            )
        
        logger.info(f"Successfully returned {len(result.satellites)} satellites")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_satellites: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/test")
async def test_endpoint():
    """Simple test endpoint to verify API is working"""
    return {
        "message": "🛰️ Satellite API is operational!",
        "status": "active",
        "features": [
            "Real-time satellite tracking",
            "Orbital mechanics calculations", 
            "Space weather integration",
            "Collision risk assessment"
        ]
    }

@router.get("/count")
async def get_satellite_count():
    """Get total count of active satellites without full data"""
    try:
        # Get basic count without expensive calculations
        result = await satellite_service.get_active_satellites(
            limit=10000,  # High limit to count all
            include_orbital_data=False,
            include_space_weather=False,
            include_collision_risk=False
        )
        
        if not result:
            raise HTTPException(status_code=503, detail="Unable to fetch satellite count")
        
        return {
            "total_active_satellites": result.total_count,
            "timestamp": result.query_time,
            "data_source": "CelesTrak"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting satellite count: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{norad_id}", response_model=SatelliteData)
async def get_satellite_by_id(
    norad_id: int = Path(..., description="NORAD catalog ID")
):
    """
    Get detailed information for a specific satellite by NORAD ID
    
    Args:
        norad_id: NORAD catalog identification number
        
    Returns:
        Complete SatelliteData with all analysis
    """
    try:
        logger.info(f"Fetching detailed data for satellite {norad_id}")
        
        satellite = await satellite_service.get_satellite_by_norad_id(norad_id)
        
        if not satellite:
            raise HTTPException(
                status_code=404,
                detail=f"Satellite with NORAD ID {norad_id} not found"
            )
        
        return satellite
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching satellite {norad_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/risk/high", response_model=List[SatelliteData])
async def get_high_risk_satellites():
    """
    Get all satellites with high collision risk
    
    Returns:
        List of satellites with HIGH or CRITICAL collision risk levels
    """
    try:
        logger.info("Fetching high-risk satellites")
        
        high_risk_satellites = await satellite_service.get_high_risk_satellites()
        
        return high_risk_satellites
        
    except Exception as e:
        logger.error(f"Error fetching high-risk satellites: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weather/current", response_model=Optional[SpaceWeatherData])
async def get_current_space_weather():
    """
    Get current space weather conditions
    
    Provides:
    - Solar flux (F10.7) levels
    - Geomagnetic activity (Kp index)
    - Solar wind conditions
    - Atmospheric drag factors
    
    Returns:
        Current space weather data from NOAA
    """
    try:
        logger.info("Fetching current space weather")
        
        weather = await space_weather_service.get_current_space_weather()
        
        if not weather:
            raise HTTPException(
                status_code=503,
                detail="Space weather data temporarily unavailable"
            )
        
        return weather
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching space weather: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/weather/forecast")
async def get_space_weather_forecast(
    hours: int = Query(default=24, ge=1, le=168, description="Forecast hours ahead (1-168)")
):
    """
    Get space weather forecast
    
    Args:
        hours: Number of hours to forecast ahead (1-168, max 1 week)
        
    Returns:
        Space weather forecast data
    """
    try:
        logger.info(f"Fetching space weather forecast for {hours} hours")
        
        forecast = await space_weather_service.get_space_weather_forecast(hours)
        
        if not forecast:
            raise HTTPException(
                status_code=503,
                detail="Space weather forecast temporarily unavailable"
            )
        
        return forecast
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching space weather forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/collision/predict")
async def predict_collision(
    norad_id1: int = Query(..., description="First satellite NORAD ID"),
    norad_id2: int = Query(..., description="Second satellite NORAD ID"),
    hours_ahead: int = Query(default=24, ge=1, le=168, description="Prediction window in hours")
):
    """
    Predict collision events between two specific satellites
    
    Args:
        norad_id1: NORAD ID of first satellite
        norad_id2: NORAD ID of second satellite  
        hours_ahead: How many hours ahead to predict (1-168)
        
    Returns:
        List of predicted close approach events
    """
    try:
        logger.info(f"Predicting collisions between {norad_id1} and {norad_id2}")
        
        # Get both satellites
        sat1 = await satellite_service.get_satellite_by_norad_id(norad_id1)
        sat2 = await satellite_service.get_satellite_by_norad_id(norad_id2)
        
        if not sat1:
            raise HTTPException(status_code=404, detail=f"Satellite {norad_id1} not found")
        if not sat2:
            raise HTTPException(status_code=404, detail=f"Satellite {norad_id2} not found")
        
        # Predict conjunction events
        events = await collision_service.predict_conjunction_events(
            sat1, sat2, hours_ahead
        )
        
        return {
            "satellite1": {"norad_id": norad_id1, "name": sat1.name},
            "satellite2": {"norad_id": norad_id2, "name": sat2.name},
            "prediction_window_hours": hours_ahead,
            "conjunction_events": events,
            "total_events": len(events)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error predicting collisions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/types/summary")
async def get_satellite_types_summary():
    """
    Get summary of satellite types in orbit
    
    Returns:
        Breakdown of satellites by type (PAYLOAD, ROCKET_BODY, DEBRIS, etc.)
    """
    try:
        logger.info("Generating satellite types summary")
        
        # Get satellites without expensive calculations for counting
        result = await satellite_service.get_active_satellites(
            limit=2000,
            include_orbital_data=False,
            include_space_weather=False,
            include_collision_risk=False
        )
        
        if not result:
            raise HTTPException(status_code=503, detail="Unable to fetch satellite data")
        
        # Count by type
        type_counts = {}
        for satellite in result.satellites:
            obj_type = satellite.object_type.value
            type_counts[obj_type] = type_counts.get(obj_type, 0) + 1
        
        return {
            "total_satellites": len(result.satellites),
            "type_breakdown": type_counts,
            "timestamp": result.query_time
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating types summary: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 