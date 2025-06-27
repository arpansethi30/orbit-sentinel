import httpx
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import logging
import asyncio
import re
import aiohttp
from concurrent.futures import ThreadPoolExecutor
import threading

from ..models.satellite import SatelliteData, SatelliteResponse, SatelliteType
from .orbital_mechanics import orbital_service, OrbitalMechanicsService
from .space_weather import space_weather_service, SpaceWeatherService
from .collision_detection import collision_service, CollisionDetectionService

# Set up logging
logger = logging.getLogger(__name__)

class SatelliteService:
    """Enhanced service for fetching and analyzing satellite data"""
    
    def __init__(self):
        self.base_url = "https://celestrak.org"
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # TLE Cache - Cache data for 30 minutes to reduce API calls
        self._tle_cache: Dict[str, Any] = {}
        self._cache_duration = 1800  # 30 minutes in seconds
    
    def _get_cache_key(self, limit: int) -> str:
        """Generate cache key for TLE data"""
        return f"tle_active_{limit}"
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid"""
        if cache_key not in self._tle_cache:
            return False
        
        cached_time = self._tle_cache[cache_key].get('timestamp')
        if not cached_time:
            return False
        
        time_diff = (datetime.now() - cached_time).total_seconds()
        return time_diff < self._cache_duration
    
    def _get_cached_data(self, cache_key: str) -> Optional[List[dict]]:
        """Get cached TLE data if valid"""
        if self._is_cache_valid(cache_key):
            logger.info(f"Using cached TLE data for {cache_key}")
            return self._tle_cache[cache_key]['data']
        return None

    def _cache_data(self, cache_key: str, data: List[dict]):
        """Cache TLE data with timestamp"""
        self._tle_cache[cache_key] = {
            'data': data,
            'timestamp': datetime.now()
        }
        logger.info(f"Cached TLE data for {cache_key} ({len(data)} satellites)")

    async def get_active_satellites(
        self, 
        limit: int = 100,
        include_orbital_data: bool = True,
        include_space_weather: bool = True,
        include_collision_risk: bool = True
    ) -> Optional[SatelliteResponse]:
        """
        Fetch enhanced active satellites with full intelligence
        
        Args:
            limit: Maximum number of satellites to return
            include_orbital_data: Whether to calculate orbital mechanics
            include_space_weather: Whether to include space weather data
            include_collision_risk: Whether to assess collision risks
            
        Returns:
            SatelliteResponse with comprehensive satellite data
        """
        try:
            cache_key = self._get_cache_key(limit)
            
            # Try to get from cache first
            cached_satellites = self._get_cached_data(cache_key)
            if cached_satellites:
                satellites = cached_satellites[:limit]  # Ensure we don't exceed limit
            else:
                # Fetch fresh data
                satellites = await self._fetch_tle_data(limit)
                if satellites:
                    self._cache_data(cache_key, satellites)
            
            if not satellites:
                logger.warning("No satellite data available")
                return None
            
            logger.info(f"Retrieved {len(satellites)} satellites from TLE data")
            
            # Get space weather data (once for all satellites)
            space_weather = None
            if include_space_weather:
                space_weather = await space_weather_service.get_current_space_weather()
                logger.info("Retrieved space weather data")
            
            # Process satellites with enhanced data
            enhanced_satellites = []
            
            for sat_data in satellites[:limit]:
                try:
                    # Create enhanced satellite object
                    satellite = SatelliteData(
                        name=sat_data["name"],
                        norad_id=sat_data["norad_id"],
                        line1=sat_data["line1"],
                        line2=sat_data["line2"],
                        epoch=sat_data["epoch"],
                        object_type=orbital_service.classify_satellite_type(
                            sat_data["name"], sat_data["norad_id"]
                        ),
                        space_weather=space_weather
                    )
                    
                    # Calculate orbital mechanics
                    if include_orbital_data:
                        orbital_data = orbital_service.calculate_orbital_data(
                            sat_data["line1"],
                            sat_data["line2"], 
                            sat_data["name"]
                        )
                        satellite.orbital = orbital_data
                    
                    enhanced_satellites.append(satellite)
                    
                except Exception as e:
                    logger.warning(f"Error processing satellite {sat_data.get('name', 'unknown')}: {e}")
                    continue
            
            logger.info(f"Enhanced {len(enhanced_satellites)} satellites with orbital data")
            
            # Assess collision risks (computationally intensive, so do in parallel)
            if include_collision_risk and len(enhanced_satellites) > 1:
                await self._assess_collision_risks(enhanced_satellites)
                logger.info("Completed collision risk assessment")
            
            # Find high-risk satellites
            high_risk_ids = await collision_service.find_high_risk_satellites(enhanced_satellites)
            
            response = SatelliteResponse(
                satellites=enhanced_satellites,
                total_count=len(enhanced_satellites),
                space_weather_summary=space_weather,
                high_risk_satellites=high_risk_ids
            )
            
            logger.info(f"Returning {len(enhanced_satellites)} enhanced satellites")
            return response
            
        except Exception as e:
            logger.error(f"Error fetching active satellites: {e}")
            return None
    
    async def _fetch_tle_data(self, limit: int) -> List[dict]:
        """Fetch TLE data from CelesTrak - only called when cache miss"""
        try:
            # Use active satellites endpoint
            url = f"{self.base_url}/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
            
            logger.info(f"Fetching fresh TLE data from CelesTrak (limit={limit})")
            response = await self.client.get(url)
            response.raise_for_status()
            
            tle_text = response.text
            satellites = self._parse_tle_data(tle_text, limit)
            
            return satellites
            
        except Exception as e:
            logger.error(f"Error fetching TLE data: {e}")
            return []

    def _parse_tle_data(self, tle_text: str, limit: int) -> List[dict]:
        """Parse TLE text format into structured data"""
        try:
            lines = tle_text.strip().split('\n')
            satellites = []
            
            # TLE format: Name, Line1, Line2 (3 lines per satellite)
            for i in range(0, len(lines), 3):
                if i + 2 >= len(lines):
                    break
                    
                if len(satellites) >= limit:
                    break
                    
                name = lines[i].strip()
                line1 = lines[i + 1].strip()
                line2 = lines[i + 2].strip()
                
                # Validate TLE format
                if not line1.startswith('1 ') or not line2.startswith('2 '):
                    logger.warning(f"Invalid TLE format for satellite: {name}")
                    continue
                
                # Extract NORAD ID from line1 (positions 2-7)
                try:
                    norad_id = int(line1[2:7].strip())
                except ValueError:
                    logger.warning(f"Could not parse NORAD ID for satellite: {name}")
                    continue
                
                # Extract epoch from line1 (positions 18-32)
                try:
                    epoch_str = line1[18:32].strip()
                    epoch = self._parse_tle_epoch(epoch_str)
                except Exception as e:
                    logger.warning(f"Could not parse epoch for satellite {name}: {e}")
                    epoch = datetime.now(timezone.utc)
                
                satellite_data = {
                    "name": name,
                    "norad_id": norad_id,
                    "line1": line1,
                    "line2": line2,
                    "epoch": epoch
                }
                
                satellites.append(satellite_data)
            
            logger.info(f"Parsed {len(satellites)} satellites from TLE data")
            return satellites

        except Exception as e:
            logger.error(f"Error parsing TLE data: {e}")
            return []
    
    def _parse_tle_epoch(self, epoch_str: str) -> datetime:
        """Parse TLE epoch format (YYDDD.DDDDDDDD) to datetime"""
        try:
            # TLE epoch format: YY DDD.DDDDDDDD
            # YY = last two digits of year
            # DDD.DDDDDDDD = day of year and fractional day
            
            year_part = int(epoch_str[:2])
            day_part = float(epoch_str[2:])
            
            # Convert 2-digit year to 4-digit
            if year_part < 57:  # Arbitrary cutoff, adjust as needed
                year = 2000 + year_part
            else:
                year = 1900 + year_part
            
            # Create datetime from year and day of year
            base_date = datetime(year, 1, 1, tzinfo=timezone.utc)
            epoch = base_date + timedelta(days=day_part - 1)
            
            return epoch
            
        except Exception as e:
            logger.error(f"Error parsing TLE epoch {epoch_str}: {e}")
            return datetime.now(timezone.utc)

    def _classify_satellite_type(self, name: str) -> SatelliteType:
        """Classify satellite based on name patterns"""
        name_upper = name.upper()
        
        # Check for debris indicators
        debris_patterns = ['DEB', 'DEBRIS', 'FRAGMENT', 'FRAG']
        if any(pattern in name_upper for pattern in debris_patterns):
            return SatelliteType.DEBRIS
        
        # Check for rocket body indicators  
        rocket_patterns = ['R/B', 'ROCKET BODY', 'STAGE', 'CENTAUR']
        if any(pattern in name_upper for pattern in rocket_patterns):
            return SatelliteType.ROCKET_BODY
        
        # Check for payload indicators
        payload_patterns = ['PAYLOAD', 'SAT', 'SATELLITE']
        if any(pattern in name_upper for pattern in payload_patterns):
            return SatelliteType.PAYLOAD
        
        # Default classification
        return SatelliteType.PAYLOAD if not any(x in name_upper for x in ['UNKNOWN', 'TBD']) else SatelliteType.UNKNOWN

    async def _assess_collision_risks(self, satellites: List[SatelliteData]):
        """Assess collision risks for all satellites"""
        try:
            # Limit concurrent risk assessments to avoid overload
            semaphore = asyncio.Semaphore(5)  # Max 5 concurrent assessments
            
            async def assess_single_satellite(satellite: SatelliteData):
                async with semaphore:
                    risk = await collision_service.assess_collision_risk(satellite, satellites)
                    satellite.risk = risk
            
            # Run assessments in parallel
            tasks = [assess_single_satellite(sat) for sat in satellites]
            await asyncio.gather(*tasks, return_exceptions=True)
            
        except Exception as e:
            logger.error(f"Error assessing collision risks: {e}")
    
    async def get_satellite_by_norad_id(self, norad_id: int) -> Optional[SatelliteData]:
        """
        Get detailed information for a specific satellite by NORAD ID
        
        Args:
            norad_id: NORAD catalog ID
            
        Returns:
            Enhanced SatelliteData or None if not found
        """
        try:
            # Fetch from a larger dataset to find the specific satellite
            satellites_response = await self.get_active_satellites(limit=1000)
            
            if not satellites_response:
                return None
            
            # Find the requested satellite
            for satellite in satellites_response.satellites:
                if satellite.norad_id == norad_id:
                    return satellite
            
            return None
            
        except Exception as e:
            logger.error(f"Error fetching satellite {norad_id}: {e}")
            return None
    
    async def get_high_risk_satellites(self) -> List[SatelliteData]:
        """
        Get all satellites with high collision risk
        
        Returns:
            List of high-risk satellites
        """
        try:
            satellites_response = await self.get_active_satellites(
                limit=500,
                include_collision_risk=True
            )
            
            if not satellites_response:
                return []
            
            high_risk = [
                sat for sat in satellites_response.satellites 
                if sat.risk and sat.risk.collision_risk_level in ["HIGH", "CRITICAL"]
            ]
            
            return high_risk
            
        except Exception as e:
            logger.error(f"Error fetching high-risk satellites: {e}")
            return []
    
    async def close(self):
        """Close HTTP client connections"""
        await self.client.aclose()

# Global service instance
satellite_service = SatelliteService() 