"""
Space-Track.org Authentication Service
Handles login, session management, and API queries for satellite TLE data
"""

import asyncio
import httpx
import logging
import os
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class SpaceTrackConfig:
    """Space-Track.org configuration"""
    base_url: str = "https://www.space-track.org"
    username: str = ""
    password: str = ""
    rate_limit_per_hour: int = 300
    rate_limit_per_minute: int = 30
    session_timeout_minutes: int = 30

class SpaceTrackAuth:
    """Space-Track.org authentication and API service"""
    
    def __init__(self, config: Optional[SpaceTrackConfig] = None):
        self.config = config or self._load_config()
        self.session_cookies: Dict[str, str] = {}
        self.session_expires: Optional[datetime] = None
        self.last_request_time: Optional[datetime] = None
        self.request_count_hour = 0
        self.request_count_minute = 0
        self.rate_limit_reset_hour: Optional[datetime] = None
        self.rate_limit_reset_minute: Optional[datetime] = None
        
    def _load_config(self) -> SpaceTrackConfig:
        """Load configuration from environment variables"""
        return SpaceTrackConfig(
            base_url=os.getenv("SPACE_TRACK_BASE_URL", "https://www.space-track.org"),
            username=os.getenv("SPACE_TRACK_USERNAME", ""),
            password=os.getenv("SPACE_TRACK_PASSWORD", ""),
            rate_limit_per_hour=int(os.getenv("SPACE_TRACK_RATE_LIMIT_PER_HOUR", "300")),
            rate_limit_per_minute=int(os.getenv("SPACE_TRACK_RATE_LIMIT_PER_MINUTE", "30"))
        )
    
    def _check_credentials(self) -> bool:
        """Check if credentials are available"""
        if not self.config.username or not self.config.password:
            logger.error("Space-Track credentials not configured. Set SPACE_TRACK_USERNAME and SPACE_TRACK_PASSWORD environment variables.")
            return False
        return True
    
    def _is_session_valid(self) -> bool:
        """Check if current session is still valid"""
        if not self.session_cookies:
            return False
        if not self.session_expires:
            return False
        return datetime.now() < self.session_expires
    
    def _check_rate_limits(self) -> bool:
        """Check if we're within rate limits"""
        now = datetime.now()
        
        # Reset hourly counter
        if not self.rate_limit_reset_hour or now >= self.rate_limit_reset_hour:
            self.request_count_hour = 0
            self.rate_limit_reset_hour = now + timedelta(hours=1)
        
        # Reset minute counter  
        if not self.rate_limit_reset_minute or now >= self.rate_limit_reset_minute:
            self.request_count_minute = 0
            self.rate_limit_reset_minute = now + timedelta(minutes=1)
        
        # Check limits
        if self.request_count_hour >= self.config.rate_limit_per_hour:
            logger.warning(f"Space-Track hourly rate limit exceeded ({self.config.rate_limit_per_hour}/hour)")
            return False
        
        if self.request_count_minute >= self.config.rate_limit_per_minute:
            logger.warning(f"Space-Track minute rate limit exceeded ({self.config.rate_limit_per_minute}/minute)")
            return False
            
        return True
    
    async def login(self) -> bool:
        """Login to Space-Track.org and establish session"""
        if not self._check_credentials():
            return False
            
        logger.info("Authenticating with Space-Track.org...")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                login_url = f"{self.config.base_url}/ajaxauth/login"
                login_data = {
                    "identity": self.config.username,
                    "password": self.config.password
                }
                
                response = await client.post(login_url, data=login_data)
                
                if response.status_code == 200:
                    # Check for login errors in response
                    if "login" in response.text.lower() and "error" in response.text.lower():
                        logger.error("Space-Track login failed - check credentials")
                        return False
                    
                    # Store session cookies
                    self.session_cookies = dict(response.cookies)
                    self.session_expires = datetime.now() + timedelta(minutes=self.config.session_timeout_minutes)
                    
                    logger.info(f"✅ Space-Track authentication successful ({len(self.session_cookies)} cookies)")
                    return True
                else:
                    logger.error(f"Space-Track login failed with status {response.status_code}")
                    return False
                    
        except Exception as e:
            logger.error(f"Space-Track login error: {str(e)}")
            return False
    
    async def query_tle_data(self, limit: int = 200, epoch_days: int = 30) -> Optional[str]:
        """
        Query TLE data from Space-Track.org
        
        Args:
            limit: Maximum number of satellites to return
            epoch_days: Get satellites with epochs within this many days
            
        Returns:
            TLE data as string, or None if failed
        """
        if not self._check_rate_limits():
            logger.warning("Rate limit exceeded, skipping Space-Track query")
            return None
        
        # Ensure we have a valid session
        if not self._is_session_valid():
            logger.info("Session invalid, re-authenticating...")
            if not await self.login():
                return None
        
        logger.info(f"Fetching TLE data from Space-Track (limit={limit}, epoch_days={epoch_days})")
        
        try:
            # Build query URL
            query_url = (
                f"{self.config.base_url}/basicspacedata/query/class/gp/"
                f"decay_date/null-val/"  # Only active satellites
                f"epoch/%3Enow-{epoch_days}/"  # Recent TLE data
                f"orderby/norad_cat_id/"
                f"limit/{limit}/"
                f"format/tle"
            )
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Set session cookies
                client.cookies.update(self.session_cookies)
                
                response = await client.get(query_url)
                
                # Update rate limit counters
                self.request_count_hour += 1
                self.request_count_minute += 1
                self.last_request_time = datetime.now()
                
                if response.status_code == 200:
                    content = response.text.strip()
                    if content and len(content) > 100:
                        # Count satellites
                        lines = content.split('\n')
                        satellite_count = len(lines) // 3
                        
                        logger.info(f"✅ Retrieved {satellite_count} satellites from Space-Track ({len(content)} chars)")
                        return content
                    else:
                        logger.warning("Empty response from Space-Track - no data available")
                        return None
                        
                elif response.status_code == 401:
                    logger.warning("Space-Track authentication expired, will retry on next request")
                    self.session_cookies = {}
                    self.session_expires = None
                    return None
                    
                else:
                    logger.error(f"Space-Track query failed with status {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.error(f"Space-Track query error: {str(e)}")
            return None
    
    async def test_connection(self) -> bool:
        """Test connection to Space-Track.org"""
        logger.info("Testing Space-Track.org connection...")
        
        if not await self.login():
            return False
        
        # Try a small query
        test_data = await self.query_tle_data(limit=5, epoch_days=7)
        return test_data is not None
    
    def get_status(self) -> Dict[str, Any]:
        """Get current service status"""
        return {
            "configured": bool(self.config.username and self.config.password),
            "session_valid": self._is_session_valid(),
            "session_expires": self.session_expires.isoformat() if self.session_expires else None,
            "requests_this_hour": self.request_count_hour,
            "requests_this_minute": self.request_count_minute,
            "rate_limit_hour": self.config.rate_limit_per_hour,
            "rate_limit_minute": self.config.rate_limit_per_minute,
            "last_request": self.last_request_time.isoformat() if self.last_request_time else None
        } 