from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class SatelliteType(str, Enum):
    """Satellite object type classification"""
    PAYLOAD = "PAYLOAD"
    ROCKET_BODY = "ROCKET_BODY" 
    DEBRIS = "DEBRIS"
    UNKNOWN = "UNKNOWN"

class OrbitalData(BaseModel):
    """Orbital mechanics data calculated from TLE"""
    # Current position
    latitude: Optional[float] = Field(None, description="Current latitude in degrees")
    longitude: Optional[float] = Field(None, description="Current longitude in degrees") 
    altitude: Optional[float] = Field(None, description="Current altitude in km above Earth")
    
    # Velocity and motion
    velocity_kmh: Optional[float] = Field(None, description="Orbital velocity in km/h")
    velocity_ms: Optional[float] = Field(None, description="Orbital velocity in m/s")
    
    # Orbital elements
    period_minutes: Optional[float] = Field(None, description="Orbital period in minutes")
    apogee_km: Optional[float] = Field(None, description="Apogee altitude in km")
    perigee_km: Optional[float] = Field(None, description="Perigee altitude in km")
    inclination: Optional[float] = Field(None, description="Orbital inclination in degrees")
    eccentricity: Optional[float] = Field(None, description="Orbital eccentricity")
    
    # Sun/Earth relationship
    is_sunlit: Optional[bool] = Field(None, description="Whether satellite is in sunlight")
    eclipse_depth: Optional[float] = Field(None, description="Eclipse depth in degrees")
    
    # Ground track
    footprint_radius_km: Optional[float] = Field(None, description="Ground footprint radius in km")
    next_pass_time: Optional[datetime] = Field(None, description="Next pass over ground station")

class SpaceWeatherData(BaseModel):
    """Space weather conditions affecting satellite"""
    solar_flux_f107: Optional[float] = Field(None, description="F10.7 solar flux")
    geomagnetic_kp: Optional[float] = Field(None, description="Kp geomagnetic index")
    solar_wind_speed: Optional[float] = Field(None, description="Solar wind speed km/s")
    magnetic_field_bt: Optional[float] = Field(None, description="Magnetic field Bt nT")
    atmospheric_drag_factor: Optional[float] = Field(None, description="Atmospheric drag multiplier")

class RiskAssessment(BaseModel):
    """Collision and debris risk assessment"""
    collision_risk_level: Optional[str] = Field(None, description="LOW/MEDIUM/HIGH/CRITICAL")
    collision_probability: Optional[float] = Field(None, description="Probability of collision in next 24h")
    nearby_objects_count: Optional[int] = Field(None, description="Number of objects within 50km")
    closest_approach_km: Optional[float] = Field(None, description="Distance to closest object in km")
    debris_environment_score: Optional[float] = Field(None, description="Debris density score 0-100")
    
class SatelliteData(BaseModel):
    """Enhanced satellite data model with orbital mechanics"""
    
    # Basic satellite info
    name: str = Field(..., description="Satellite name")
    norad_id: int = Field(..., description="NORAD catalog ID")
    
    # TLE data (Two-Line Element Set)
    line1: str = Field(..., description="First line of TLE")
    line2: str = Field(..., description="Second line of TLE")
    epoch: datetime = Field(..., description="TLE epoch date")
    
    # Classification
    object_type: SatelliteType = Field(SatelliteType.UNKNOWN, description="Object type classification")
    country: Optional[str] = Field(None, description="Country of origin")
    launch_date: Optional[datetime] = Field(None, description="Launch date")
    mass_kg: Optional[float] = Field(None, description="Mass in kilograms")
    
    # Orbital mechanics (calculated)
    orbital: Optional[OrbitalData] = Field(None, description="Calculated orbital data")
    
    # Space environment 
    space_weather: Optional[SpaceWeatherData] = Field(None, description="Current space weather")
    
    # Risk assessment
    risk: Optional[RiskAssessment] = Field(None, description="Collision risk assessment")
    
    # Metadata
    last_updated: datetime = Field(default_factory=datetime.utcnow, description="Last data update")
    data_source: str = Field("CelesTrak", description="Data source")
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class SatelliteResponse(BaseModel):
    """API response for satellite data"""
    satellites: List[SatelliteData]
    total_count: int
    query_time: datetime = Field(default_factory=datetime.utcnow)
    space_weather_summary: Optional[SpaceWeatherData] = None
    high_risk_satellites: List[int] = Field(default_factory=list, description="NORAD IDs with high collision risk")
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        } 