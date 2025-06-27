import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional, Tuple
import math

from ..models.satellite import SatelliteData, RiskAssessment
from .orbital_mechanics import orbital_service

logger = logging.getLogger(__name__)

class CollisionDetectionService:
    """Service for detecting collision risks between satellites"""
    
    def __init__(self):
        """Initialize collision detection service"""
        self.risk_thresholds = {
            "critical": 5.0,    # km - immediate danger
            "high": 25.0,       # km - high risk
            "medium": 100.0,    # km - moderate risk  
            "low": 500.0        # km - monitoring range
        }
        
    async def assess_collision_risk(
        self, 
        satellite: SatelliteData, 
        all_satellites: List[SatelliteData]
    ) -> Optional[RiskAssessment]:
        """
        Assess collision risk for a single satellite against all others
        
        Args:
            satellite: Target satellite to assess
            all_satellites: List of all satellites for comparison
            
        Returns:
            RiskAssessment with risk analysis
        """
        try:
            if not satellite.line1 or not satellite.line2:
                logger.warning(f"Missing TLE data for satellite {satellite.name}")
                return None
            
            nearby_objects = []
            closest_distance = float('inf')
            
            # Check distance to all other satellites
            for other_sat in all_satellites:
                if other_sat.norad_id == satellite.norad_id:
                    continue  # Skip self
                    
                if not other_sat.line1 or not other_sat.line2:
                    continue  # Skip satellites without TLE
                
                # Calculate current distance
                distance = orbital_service.calculate_distance_between_satellites(
                    satellite.line1, satellite.line2, satellite.name,
                    other_sat.line1, other_sat.line2, other_sat.name
                )
                
                if distance is None:
                    continue
                
                # Track closest approach
                if distance < closest_distance:
                    closest_distance = distance
                
                # Count nearby objects
                if distance <= self.risk_thresholds["low"]:
                    nearby_objects.append({
                        "norad_id": other_sat.norad_id,
                        "name": other_sat.name,
                        "distance_km": distance,
                        "object_type": other_sat.object_type.value
                    })
            
            # Determine risk level
            risk_level = self._calculate_risk_level(closest_distance)
            
            # Calculate collision probability (simplified model)
            collision_probability = self._calculate_collision_probability(
                closest_distance, 
                len(nearby_objects),
                satellite.object_type.value
            )
            
            # Calculate debris environment score
            debris_score = self._calculate_debris_environment_score(
                satellite, nearby_objects
            )
            
            risk_assessment = RiskAssessment(
                collision_risk_level=risk_level,
                collision_probability=collision_probability,
                nearby_objects_count=len(nearby_objects),
                closest_approach_km=closest_distance if closest_distance != float('inf') else None,
                debris_environment_score=debris_score
            )
            
            return risk_assessment
            
        except Exception as e:
            logger.error(f"Error assessing collision risk for {satellite.name}: {e}")
            return None
    
    def _calculate_risk_level(self, closest_distance: float) -> str:
        """Determine risk level based on closest approach distance"""
        if closest_distance <= self.risk_thresholds["critical"]:
            return "CRITICAL"
        elif closest_distance <= self.risk_thresholds["high"]:
            return "HIGH"
        elif closest_distance <= self.risk_thresholds["medium"]:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _calculate_collision_probability(
        self, 
        closest_distance: float, 
        nearby_count: int,
        object_type: str
    ) -> float:
        """
        Calculate collision probability over next 24 hours
        This is a simplified model - real implementation would use sophisticated orbital mechanics
        
        Args:
            closest_distance: Distance to closest object in km
            nearby_count: Number of nearby objects
            object_type: Type of satellite (affects collision cross-section)
            
        Returns:
            Probability as a percentage (0-100)
        """
        try:
            base_probability = 0.0
            
            # Distance-based risk
            if closest_distance <= 5:
                base_probability = 25.0  # Very high risk
            elif closest_distance <= 25:
                base_probability = 10.0  # High risk
            elif closest_distance <= 100:
                base_probability = 2.0   # Medium risk
            elif closest_distance <= 500:
                base_probability = 0.1   # Low risk
            else:
                base_probability = 0.01  # Very low risk
            
            # Adjust based on object density
            density_multiplier = 1.0 + (nearby_count * 0.1)  # More objects = higher risk
            
            # Adjust based on object type
            type_multiplier = 1.0
            if object_type == "DEBRIS":
                type_multiplier = 1.5  # Debris is harder to track/predict
            elif object_type == "ROCKET_BODY":
                type_multiplier = 1.2  # Large objects, higher impact
            
            final_probability = base_probability * density_multiplier * type_multiplier
            
            # Cap at 100%
            return min(final_probability, 100.0)
            
        except Exception as e:
            logger.warning(f"Error calculating collision probability: {e}")
            return 0.0
    
    def _calculate_debris_environment_score(
        self, 
        satellite: SatelliteData, 
        nearby_objects: List[Dict]
    ) -> float:
        """
        Calculate debris environment score (0-100, higher is more dangerous)
        
        Args:
            satellite: Target satellite
            nearby_objects: List of nearby objects with their data
            
        Returns:
            Score from 0-100
        """
        try:
            base_score = 0.0
            
            # Score based on altitude (some altitudes are more crowded)
            if satellite.orbital and satellite.orbital.altitude:
                altitude = satellite.orbital.altitude
                
                # LEO congestion hotspots
                if 400 <= altitude <= 600:  # ISS/Starlink region
                    base_score += 30
                elif 700 <= altitude <= 900:  # Common satellite altitudes  
                    base_score += 20
                elif altitude >= 35000:  # GEO belt
                    base_score += 25
                else:
                    base_score += 10
            
            # Score based on nearby object count and types
            debris_count = sum(1 for obj in nearby_objects if obj["object_type"] == "DEBRIS")
            rocket_count = sum(1 for obj in nearby_objects if obj["object_type"] == "ROCKET_BODY")
            
            # More debris = higher score
            base_score += debris_count * 3
            base_score += rocket_count * 2
            base_score += len(nearby_objects) * 1
            
            # Score based on closest distances
            very_close = sum(1 for obj in nearby_objects if obj["distance_km"] <= 50)
            base_score += very_close * 5
            
            return min(base_score, 100.0)
            
        except Exception as e:
            logger.warning(f"Error calculating debris environment score: {e}")
            return 0.0
    
    async def find_high_risk_satellites(
        self, 
        satellites: List[SatelliteData]
    ) -> List[int]:
        """
        Find all satellites with high collision risk
        
        Args:
            satellites: List of all satellites
            
        Returns:
            List of NORAD IDs with high or critical risk
        """
        high_risk_ids = []
        
        try:
            for satellite in satellites:
                if satellite.risk and satellite.risk.collision_risk_level in ["HIGH", "CRITICAL"]:
                    high_risk_ids.append(satellite.norad_id)
            
            logger.info(f"Found {len(high_risk_ids)} high-risk satellites")
            return high_risk_ids
            
        except Exception as e:
            logger.error(f"Error finding high-risk satellites: {e}")
            return []
    
    async def predict_conjunction_events(
        self,
        satellite1: SatelliteData,
        satellite2: SatelliteData,
        hours_ahead: int = 24
    ) -> List[Dict]:
        """
        Predict when two satellites will have close approaches
        This is a simplified prediction - real implementation needs numerical integration
        
        Args:
            satellite1: First satellite
            satellite2: Second satellite  
            hours_ahead: How many hours to look ahead
            
        Returns:
            List of conjunction events with times and distances
        """
        try:
            events = []
            current_time = datetime.now(timezone.utc)
            
            # Sample at regular intervals (simplified approach)
            for hour in range(0, hours_ahead, 1):
                check_time = current_time + timedelta(hours=hour)
                
                distance = orbital_service.calculate_distance_between_satellites(
                    satellite1.line1, satellite1.line2, satellite1.name,
                    satellite2.line1, satellite2.line2, satellite2.name,
                    check_time
                )
                
                if distance and distance <= self.risk_thresholds["medium"]:
                    events.append({
                        "time": check_time,
                        "distance_km": distance,
                        "risk_level": self._calculate_risk_level(distance)
                    })
            
            return events
            
        except Exception as e:
            logger.error(f"Error predicting conjunction events: {e}")
            return []

# Global service instance
collision_service = CollisionDetectionService() 