import logging
import httpx
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import asyncio

from ..models.satellite import SpaceWeatherData

logger = logging.getLogger(__name__)

class SpaceWeatherService:
    """Service for fetching space weather data from NOAA and other free APIs"""
    
    def __init__(self):
        """Initialize the space weather service"""
        self.client = httpx.AsyncClient(timeout=30.0)
        self.noaa_base_url = "https://services.swpc.noaa.gov"
        self.cache = {}  # Simple in-memory cache
        self.cache_duration = 300  # 5 minutes cache
        
    async def get_current_space_weather(self) -> Optional[SpaceWeatherData]:
        """
        Fetch current space weather conditions from multiple sources
        
        Returns:
            SpaceWeatherData with current conditions
        """
        # Check cache first
        cache_key = "current_space_weather"
        if self._is_cached(cache_key):
            logger.info("Returning cached space weather data")
            return self.cache[cache_key]["data"]
        
        try:
            # Fetch data from multiple sources in parallel
            tasks = [
                self._get_solar_flux(),
                self._get_geomagnetic_data(),
                self._get_solar_wind_data(),
            ]
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Combine results
            solar_flux = results[0] if not isinstance(results[0], Exception) else None
            geomagnetic = results[1] if not isinstance(results[1], Exception) else None
            solar_wind = results[2] if not isinstance(results[2], Exception) else None
            
            # Calculate atmospheric drag factor based on space weather
            drag_factor = self._calculate_drag_factor(solar_flux, geomagnetic)
            
            space_weather = SpaceWeatherData(
                solar_flux_f107=solar_flux.get("f107") if solar_flux else None,
                geomagnetic_kp=geomagnetic.get("kp") if geomagnetic else None,
                solar_wind_speed=solar_wind.get("speed") if solar_wind else None,
                magnetic_field_bt=solar_wind.get("bt") if solar_wind else None,
                atmospheric_drag_factor=drag_factor
            )
            
            # Cache the result
            self._cache_data(cache_key, space_weather)
            
            return space_weather
            
        except Exception as e:
            logger.error(f"Error fetching space weather data: {e}")
            return None
    
    async def _get_solar_flux(self) -> Optional[Dict[str, Any]]:
        """Fetch F10.7 solar flux data from NOAA"""
        try:
            # Use current NOAA SWPC JSON API endpoint
            url = "https://services.swpc.noaa.gov/json/f107_cm_flux.json"
            response = await self.client.get(url)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract F10.7 flux from the response
            if isinstance(data, list) and len(data) > 0:
                latest = data[-1]  # Get latest entry
                # NOAA returns arrays with time_tag and flux values
                if isinstance(latest, list) and len(latest) >= 2:
                    return {
                        "f107": float(latest[1]),  # Second element is flux value
                        "timestamp": latest[0]      # First element is timestamp
                    }
                elif isinstance(latest, dict):
                    return {
                        "f107": float(latest.get("flux", latest.get("f10_7", latest.get("f107", 150)))),
                        "timestamp": latest.get("time_tag", latest.get("timestamp"))
                    }
            
            # Fallback to a reasonable default if API fails
            return {
                "f107": 150.0,  # Typical solar minimum value
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except httpx.HTTPStatusError as e:
            logger.warning(f"HTTP error fetching solar flux data: {e.response.status_code} {e.response.reason_phrase}")
            # Return reasonable default
            return {
                "f107": 150.0,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.warning(f"Could not fetch solar flux data: {e}")
            # Return reasonable default
            return {
                "f107": 150.0,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def _get_geomagnetic_data(self) -> Optional[Dict[str, Any]]:
        """Fetch Kp geomagnetic index from NOAA"""
        try:
            # Use current NOAA SWPC JSON API endpoint
            url = "https://services.swpc.noaa.gov/json/planetary_k_index_1m.json"
            response = await self.client.get(url)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract latest Kp index with proper parsing
            if isinstance(data, list) and len(data) > 0:
                latest = data[-1]
                # NOAA planetary K-index returns arrays with [time_tag, kp_index, a_index, station]
                if isinstance(latest, list) and len(latest) >= 2:
                    kp_raw = latest[1]
                    # Parse Kp value - handle non-numeric values like '1P', '2P', etc.
                    kp_value = self._parse_kp_value(kp_raw)
                    return {
                        "kp": kp_value,
                        "timestamp": latest[0]    # First element is timestamp
                    }
                elif isinstance(latest, dict):
                    kp_raw = latest.get("kp", latest.get("kp_index", "2.0"))
                    kp_value = self._parse_kp_value(kp_raw)
                    return {
                        "kp": kp_value,
                        "timestamp": latest.get("time_tag", latest.get("timestamp"))
                    }
            
            # Fallback default
            return {
                "kp": 2.0,  # Quiet geomagnetic conditions
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.warning(f"Could not fetch geomagnetic data: {e}")
            return {
                "kp": 2.0,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    async def _get_solar_wind_data(self) -> Optional[Dict[str, Any]]:
        """Fetch solar wind data from NOAA"""
        try:
            # Use current NOAA SWPC JSON API endpoint  
            url = "https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json"
            response = await self.client.get(url)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract latest solar wind data with safe parsing
            if isinstance(data, list) and len(data) > 0:
                latest = data[-1]
                # NOAA solar wind returns arrays with [time_tag, bx, by, bz, lon, lat, bt]
                if isinstance(latest, list) and len(latest) >= 7:
                    bt_raw = latest[6]
                    bt_value = self._safe_float_parse(bt_raw, 5.0)
                    return {
                        "speed": 400.0,  # Default typical solar wind speed (not in mag data)
                        "bt": bt_value,  # Bt is 7th element
                        "timestamp": latest[0]  # First element is timestamp
                    }
                elif isinstance(latest, dict):
                    speed_raw = latest.get("wind_speed", latest.get("speed", 400.0))
                    bt_raw = latest.get("bt", latest.get("magnetic_field", 5.0))
                    return {
                        "speed": self._safe_float_parse(speed_raw, 400.0),
                        "bt": self._safe_float_parse(bt_raw, 5.0),
                        "timestamp": latest.get("time_tag", latest.get("timestamp"))
                    }
            
            # Fallback default
            return {
                "speed": 400.0,  # km/s - typical solar wind speed
                "bt": 5.0,       # nT - typical magnetic field
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.warning(f"Could not fetch solar wind data: {e}")
            return {
                "speed": 400.0,
                "bt": 5.0,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    def _safe_float_parse(self, value: Any, default: float) -> float:
        """
        Safely parse a value to float, handling null/None values and conversion errors
        
        Args:
            value: Value to parse (could be None, string, number, etc.)
            default: Default value to return if parsing fails
            
        Returns:
            Parsed float value or default if parsing fails
        """
        try:
            if value is None or value == '':
                return default
            return float(value)
        except (ValueError, TypeError):
            logger.warning(f"Could not parse float value '{value}', using default {default}")
            return default
    
    def _parse_kp_value(self, kp_raw: Any) -> float:
        """
        Parse Kp value from NOAA API, handling special codes and non-numeric values
        
        NOAA sometimes returns values like '1P', '2P' where P indicates preliminary data
        or other special codes that need to be handled properly.
        
        Args:
            kp_raw: Raw Kp value from API (could be string, float, or special code)
            
        Returns:
            Parsed Kp value as float (0.0-9.0 range)
        """
        try:
            if kp_raw is None:
                return 2.0  # Default quiet conditions
            
            # Handle string values
            if isinstance(kp_raw, str):
                # Remove common suffixes like 'P' (preliminary), 'E' (estimated), etc.
                kp_clean = kp_raw.rstrip('PEQR-+')
                
                # Handle fractional notation like '1-', '1+', '1o'
                if kp_clean.endswith('-'):
                    base = float(kp_clean[:-1])
                    return max(0.0, base - 0.33)  # '-' means subtract 1/3
                elif kp_clean.endswith('+'):
                    base = float(kp_clean[:-1])
                    return min(9.0, base + 0.33)  # '+' means add 1/3
                elif kp_clean.endswith('o'):
                    return float(kp_clean[:-1])  # 'o' means exact value
                else:
                    return float(kp_clean)
            
            # Handle numeric values
            elif isinstance(kp_raw, (int, float)):
                return float(kp_raw)
            
            # Fallback for unknown types
            else:
                logger.warning(f"Unknown Kp value type: {type(kp_raw)} = {kp_raw}")
                return 2.0
                
        except (ValueError, TypeError) as e:
            logger.warning(f"Could not parse Kp value '{kp_raw}': {e}")
            return 2.0  # Default quiet conditions
    
    def _calculate_drag_factor(
        self, 
        solar_flux: Optional[Dict], 
        geomagnetic: Optional[Dict]
    ) -> float:
        """
        Calculate atmospheric drag factor based on space weather conditions
        
        High solar activity increases atmospheric density at satellite altitudes,
        leading to increased drag.
        
        Returns:
            Drag multiplier factor (1.0 = normal, >1.0 = increased drag)
        """
        try:
            base_factor = 1.0
            
            # Solar flux contribution (F10.7 > 150 increases drag)
            if solar_flux and solar_flux.get("f107"):
                f107 = solar_flux["f107"]
                if f107 > 150:
                    solar_contribution = (f107 - 150) / 100  # Scale factor
                    base_factor += solar_contribution * 0.3  # Up to 30% increase
            
            # Geomagnetic contribution (Kp > 4 increases drag)
            if geomagnetic and geomagnetic.get("kp"):
                kp = geomagnetic["kp"]
                if kp > 4:
                    geo_contribution = (kp - 4) / 5  # Scale factor
                    base_factor += geo_contribution * 0.2  # Up to 20% increase
            
            return min(base_factor, 2.0)  # Cap at 200% of normal drag
            
        except Exception as e:
            logger.warning(f"Could not calculate drag factor: {e}")
            return 1.0
    
    def _is_cached(self, key: str) -> bool:
        """Check if data is cached and still valid"""
        if key not in self.cache:
            return False
        
        cached_time = self.cache[key]["timestamp"]
        age = (datetime.now(timezone.utc) - cached_time).total_seconds()
        
        return age < self.cache_duration
    
    def _cache_data(self, key: str, data: Any):
        """Cache data with timestamp"""
        self.cache[key] = {
            "data": data,
            "timestamp": datetime.now(timezone.utc)
        }
    
    async def get_space_weather_forecast(self, hours_ahead: int = 24) -> Optional[Dict[str, Any]]:
        """
        Get space weather forecast (simplified - real implementation would need more sophisticated APIs)
        
        Args:
            hours_ahead: Number of hours to forecast ahead
            
        Returns:
            Dictionary with forecast data
        """
        try:
            # This is a simplified forecast - real implementation would use
            # NOAA forecast models or machine learning predictions
            current = await self.get_current_space_weather()
            
            if not current:
                return None
            
            # Simple forecast: assume conditions remain similar with small variations
            forecast = {
                "forecast_hours": hours_ahead,
                "solar_flux_trend": "stable",  # stable/rising/falling
                "geomagnetic_risk": "low" if (current.geomagnetic_kp or 0) < 4 else "moderate",
                "atmospheric_drag_trend": "increasing" if (current.atmospheric_drag_factor or 1.0) > 1.1 else "stable"
            }
            
            return forecast
            
        except Exception as e:
            logger.error(f"Error generating space weather forecast: {e}")
            return None
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

# Global service instance
space_weather_service = SpaceWeatherService() 