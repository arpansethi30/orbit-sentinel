import logging
from datetime import datetime, timezone
from typing import Optional, Tuple
import math

from skyfield.api import load, EarthSatellite, wgs84
from skyfield.timelib import Time
import numpy as np

from ..models.satellite import OrbitalData, SatelliteType

logger = logging.getLogger(__name__)

class OrbitalMechanicsService:
    """Service for calculating orbital mechanics using Skyfield"""
    
    def __init__(self):
        """Initialize the orbital mechanics service"""
        self.ts = load.timescale()
        self._ephemeris = None
        
    def _get_ephemeris(self):
        """Load JPL ephemeris for Sun calculations (lazy loading)"""
        if self._ephemeris is None:
            try:
                self._ephemeris = load('de421.bsp')
            except Exception as e:
                logger.warning(f"Could not load JPL ephemeris: {e}")
                self._ephemeris = None
        return self._ephemeris
    
    def calculate_orbital_data(
        self, 
        line1: str, 
        line2: str, 
        name: str,
        calculation_time: Optional[datetime] = None
    ) -> Optional[OrbitalData]:
        """
        Calculate comprehensive orbital data from TLE
        
        Args:
            line1: First line of TLE
            line2: Second line of TLE  
            name: Satellite name
            calculation_time: Time for calculations (defaults to now)
            
        Returns:
            OrbitalData with calculated orbital parameters
        """
        try:
            # Create satellite object
            satellite = EarthSatellite(line1, line2, name, self.ts)
            
            # Use provided time or current time
            if calculation_time is None:
                calculation_time = datetime.now(timezone.utc)
            
            # Convert to Skyfield time
            t = self.ts.from_datetime(calculation_time)
            
            # Calculate position
            geocentric = satellite.at(t)
            
            # Get geodetic coordinates
            subpoint = wgs84.subpoint_of(geocentric)
            latitude = subpoint.latitude.degrees
            longitude = subpoint.longitude.degrees  
            altitude = subpoint.elevation.km
            
            # Calculate velocity
            position, velocity = satellite.at(t).position.km, satellite.at(t).velocity.km_per_s
            velocity_magnitude = np.linalg.norm(velocity)
            velocity_kmh = velocity_magnitude * 3.6  # Convert to km/h
            velocity_ms = velocity_magnitude * 1000   # Convert to m/s
            
            # Extract orbital elements from TLE
            orbital_elements = self._extract_orbital_elements(line1, line2)
            
            # Calculate period (Kepler's third law approximation)
            # For circular orbit: T = 2π√(a³/μ) where μ = 398600.4418 km³/s² for Earth
            earth_mu = 398600.4418  # km³/s²
            semi_major_axis = altitude + 6371  # Earth radius approximation
            period_seconds = 2 * math.pi * math.sqrt((semi_major_axis ** 3) / earth_mu)
            period_minutes = period_seconds / 60
            
            # Calculate apogee/perigee (rough estimation)
            # These are approximations - real calculation requires full orbital elements
            eccentricity = orbital_elements.get('eccentricity', 0.0)
            perigee_km = altitude - (altitude * eccentricity)
            apogee_km = altitude + (altitude * eccentricity)
            
            # Check if satellite is in sunlight
            is_sunlit = self._calculate_sunlight_status(satellite, t)
            
            # Calculate footprint radius (simplified)
            footprint_radius_km = self._calculate_footprint_radius(altitude)
            
            return OrbitalData(
                latitude=latitude,
                longitude=longitude,
                altitude=altitude,
                velocity_kmh=velocity_kmh,
                velocity_ms=velocity_ms,
                period_minutes=period_minutes,
                apogee_km=apogee_km,
                perigee_km=perigee_km,
                inclination=orbital_elements.get('inclination'),
                eccentricity=eccentricity,
                is_sunlit=is_sunlit,
                footprint_radius_km=footprint_radius_km
            )
            
        except Exception as e:
            logger.error(f"Error calculating orbital data for {name}: {e}")
            return None
    
    def _extract_orbital_elements(self, line1: str, line2: str) -> dict:
        """Extract orbital elements from TLE lines"""
        try:
            # TLE format parsing
            # Line 1: positions 8-16 = inclination
            # Line 2: positions 26-33 = eccentricity, etc.
            inclination = float(line2[8:16].strip())
            eccentricity = float('0.' + line2[26:33].strip())
            
            return {
                'inclination': inclination,
                'eccentricity': eccentricity
            }
        except Exception as e:
            logger.warning(f"Could not parse orbital elements: {e}")
            return {}
    
    def _calculate_sunlight_status(self, satellite: EarthSatellite, t: Time) -> Optional[bool]:
        """Check if satellite is in sunlight"""
        try:
            eph = self._get_ephemeris()
            if eph is None:
                return None
                
            position = satellite.at(t)
            return position.is_sunlit(eph)
        except Exception as e:
            logger.warning(f"Could not calculate sunlight status: {e}")
            return None
    
    def _calculate_footprint_radius(self, altitude_km: float) -> float:
        """
        Calculate ground footprint radius for satellite
        Simple geometric calculation
        """
        earth_radius = 6371  # km
        # For a satellite at altitude h, the horizon distance is:
        # d = √(2Rh + h²) where R is Earth radius
        horizon_distance = math.sqrt(2 * earth_radius * altitude_km + altitude_km**2)
        return horizon_distance
    
    def calculate_distance_between_satellites(
        self,
        sat1_line1: str, sat1_line2: str, sat1_name: str,
        sat2_line1: str, sat2_line2: str, sat2_name: str,
        calculation_time: Optional[datetime] = None
    ) -> Optional[float]:
        """
        Calculate distance between two satellites in km
        
        Returns:
            Distance in kilometers, or None if calculation fails
        """
        try:
            # Create satellite objects
            sat1 = EarthSatellite(sat1_line1, sat1_line2, sat1_name, self.ts)
            sat2 = EarthSatellite(sat2_line1, sat2_line2, sat2_name, self.ts)
            
            # Use provided time or current time
            if calculation_time is None:
                calculation_time = datetime.now(timezone.utc)
            
            t = self.ts.from_datetime(calculation_time)
            
            # Calculate positions
            pos1 = sat1.at(t).position.km
            pos2 = sat2.at(t).position.km
            
            # Calculate distance
            distance = np.linalg.norm(pos1 - pos2)
            return float(distance)
            
        except Exception as e:
            logger.error(f"Error calculating distance between {sat1_name} and {sat2_name}: {e}")
            return None
    
    def classify_satellite_type(self, name: str, norad_id: int) -> SatelliteType:
        """
        Classify satellite type based on name and NORAD ID
        This is a simplified classification - real-world would use a database
        """
        name_lower = name.lower()
        
        # Common patterns for classification
        if any(keyword in name_lower for keyword in ['rocket', 'r/b', 'stage', 'booster']):
            return SatelliteType.ROCKET_BODY
        elif any(keyword in name_lower for keyword in ['debris', 'fragment', 'piece']):
            return SatelliteType.DEBRIS
        elif any(keyword in name_lower for keyword in ['starlink', 'satellite', 'sat', 'mission']):
            return SatelliteType.PAYLOAD
        else:
            return SatelliteType.UNKNOWN

# Global service instance
orbital_service = OrbitalMechanicsService() 