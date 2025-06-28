"""
Dashboard API endpoints for advanced analytics and real-time metrics
"""

import logging
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel

from ..services.analytics_service import analytics_service
from ..services.satellite_service import satellite_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Response models
class SystemMetricsResponse(BaseModel):
    """System metrics response model"""
    total_satellites: int
    active_satellites: int
    high_risk_objects: int
    collision_alerts: int
    space_weather_kp: float
    data_sources_active: int
    data_sources_list: List[str]
    last_updated: datetime
    tracking_coverage: float
    status: str = "active"

class PredictiveAnalyticsResponse(BaseModel):
    """Predictive analytics response model"""
    collision_probability_24h: float
    high_risk_events: int
    orbital_decay_predictions: int
    space_weather_impact_score: float
    active_tracking_satellites: int
    last_calculated: datetime

class CollisionPredictionResponse(BaseModel):
    """24-hour collision prediction response"""
    probability_score: float
    high_risk_pairs: List[Dict[str, Any]]
    critical_time_windows: List[Dict[str, Any]]
    risk_assessment: str
    confidence_level: float
    prediction_horizon: str = "24_hours"

class DashboardSummaryResponse(BaseModel):
    """Complete dashboard summary"""
    system_metrics: SystemMetricsResponse
    predictive_analytics: PredictiveAnalyticsResponse
    advanced_features: Dict[str, Any]

@router.get("/metrics", response_model=SystemMetricsResponse)
async def get_system_metrics():
    """
    Get real-time system metrics for dashboard
    
    Returns dynamic counts instead of hardcoded values:
    - Active satellite count from Space-Track.org
    - High-risk objects from collision analysis  
    - Current space weather from NOAA
    - Data source health status
    """
    try:
        logger.info("API: Getting system metrics")
        
        metrics = await analytics_service.get_system_metrics()
        
        response = SystemMetricsResponse(
            total_satellites=metrics.total_satellites,
            active_satellites=metrics.active_satellites,
            high_risk_objects=metrics.high_risk_objects,
            collision_alerts=metrics.collision_alerts,
            space_weather_kp=metrics.space_weather_kp,
            data_sources_active=metrics.data_sources_active,
            data_sources_list=metrics.data_sources_list,
            last_updated=metrics.last_updated,
            tracking_coverage=metrics.tracking_coverage,
            status="active"
        )
        
        logger.info(f"API: Returning metrics - {metrics.total_satellites} satellites, {metrics.high_risk_objects} high-risk")
        return response
        
    except Exception as e:
        logger.error(f"API error getting system metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve system metrics: {str(e)}")

@router.get("/analytics", response_model=PredictiveAnalyticsResponse)
async def get_predictive_analytics():
    """
    Get predictive intelligence and advanced analytics
    
    Returns:
    - 24-hour collision probability models
    - High-risk event predictions
    - Orbital decay forecasts  
    - Space weather impact analysis
    """
    try:
        logger.info("API: Getting predictive analytics")
        
        analytics = await analytics_service.get_predictive_analytics()
        
        response = PredictiveAnalyticsResponse(
            collision_probability_24h=analytics.collision_probability_24h,
            high_risk_events=analytics.high_risk_events,
            orbital_decay_predictions=analytics.orbital_decay_predictions,
            space_weather_impact_score=analytics.space_weather_impact_score,
            active_tracking_satellites=analytics.active_tracking_satellites,
            last_calculated=datetime.now()
        )
        
        logger.info(f"API: Analytics - {analytics.collision_probability_24h:.3f} collision prob, {analytics.high_risk_events} high-risk events")
        return response
        
    except Exception as e:
        logger.error(f"API error getting predictive analytics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve predictive analytics: {str(e)}")

@router.get("/collision-prediction", response_model=CollisionPredictionResponse)
async def get_collision_prediction():
    """
    Get 24-hour collision prediction model
    
    Returns detailed collision analysis:
    - Overall collision probability 
    - High-risk satellite pairs
    - Critical time windows
    - Risk assessment and confidence levels
    """
    try:
        logger.info("API: Getting collision prediction")
        
        prediction = await analytics_service.get_collision_prediction_24h()
        
        response = CollisionPredictionResponse(
            probability_score=prediction.probability_score,
            high_risk_pairs=prediction.high_risk_pairs,
            critical_time_windows=prediction.critical_time_windows,
            risk_assessment=prediction.risk_assessment,
            confidence_level=prediction.confidence_level,
            prediction_horizon="24_hours"
        )
        
        logger.info(f"API: Collision prediction - {prediction.probability_score:.3f} probability, {len(prediction.high_risk_pairs)} high-risk pairs")
        return response
        
    except Exception as e:
        logger.error(f"API error getting collision prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve collision prediction: {str(e)}")

@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary():
    """
    Get complete dashboard summary with all analytics
    
    Comprehensive endpoint that returns:
    - System metrics (satellite counts, alerts, etc.)
    - Predictive analytics (collision models, predictions)
    - Advanced features status
    """
    try:
        logger.info("API: Getting complete dashboard summary")
        
        # Get all analytics in parallel for performance
        import asyncio
        
        metrics_task = analytics_service.get_system_metrics()
        analytics_task = analytics_service.get_predictive_analytics()
        
        metrics, analytics = await asyncio.gather(metrics_task, analytics_task)
        
        # Build response
        system_metrics_response = SystemMetricsResponse(
            total_satellites=metrics.total_satellites,
            active_satellites=metrics.active_satellites,
            high_risk_objects=metrics.high_risk_objects,
            collision_alerts=metrics.collision_alerts,
            space_weather_kp=metrics.space_weather_kp,
            data_sources_active=metrics.data_sources_active,
            data_sources_list=metrics.data_sources_list,
            last_updated=metrics.last_updated,
            tracking_coverage=metrics.tracking_coverage,
            status="active"
        )
        
        predictive_analytics_response = PredictiveAnalyticsResponse(
            collision_probability_24h=analytics.collision_probability_24h,
            high_risk_events=analytics.high_risk_events,
            orbital_decay_predictions=analytics.orbital_decay_predictions,
            space_weather_impact_score=analytics.space_weather_impact_score,
            active_tracking_satellites=analytics.active_tracking_satellites,
            last_calculated=datetime.now()
        )
        
        # Advanced features status
        advanced_features = {
            "predictive_intelligence": {
                "status": "active",
                "features": [
                    "24-hour collision probability models",
                    "Real-time position tracking", 
                    "Orbital decay predictions",
                    "Space weather impact analysis"
                ]
            },
            "orbital_calculations": {
                "status": "active",
                "capabilities": [
                    "Real-time orbital mechanics",
                    "Position propagation",
                    "Velocity calculations",
                    "Altitude tracking"
                ]
            },
            "collision_prediction": {
                "status": "active",
                "models": [
                    "24-hour probability models",
                    "High-risk pair identification",
                    "Critical time window analysis",
                    "Monte Carlo risk assessment"
                ]
            },
            "real_time_tracking": {
                "status": "active",
                "coverage": f"{metrics.tracking_coverage:.1f}%",
                "active_satellites": metrics.active_satellites,
                "update_frequency": "Real-time"
            }
        }
        
        response = DashboardSummaryResponse(
            system_metrics=system_metrics_response,
            predictive_analytics=predictive_analytics_response,
            advanced_features=advanced_features
        )
        
        logger.info(f"API: Dashboard summary complete - {metrics.total_satellites} satellites, {analytics.high_risk_events} high-risk events")
        return response
        
    except Exception as e:
        logger.error(f"API error getting dashboard summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve dashboard summary: {str(e)}")

@router.get("/health")
async def get_dashboard_health():
    """
    Dashboard health check endpoint
    """
    try:
        # Quick test of core services
        test_metrics = await analytics_service.get_system_metrics()
        
        return {
            "status": "healthy",
            "services": {
                "analytics": "operational",
                "satellite_data": "operational" if test_metrics.total_satellites > 0 else "degraded",
                "space_weather": "operational" if test_metrics.space_weather_kp > 0 else "degraded",
                "data_sources": f"{test_metrics.data_sources_active} active"
            },
            "timestamp": datetime.now(),
            "data_freshness": f"{test_metrics.tracking_coverage:.1f}% fresh"
        }
        
    except Exception as e:
        logger.error(f"Dashboard health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now()
        } 