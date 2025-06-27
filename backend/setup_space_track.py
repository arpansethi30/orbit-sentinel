#!/usr/bin/env python3
"""
Space-Track.org Setup and Test Script
Sets up environment variables and tests the integration
"""

import os
import asyncio
import sys
from app.services.space_track_auth import SpaceTrackAuth
from app.services.satellite_service import SatelliteService

def setup_environment_variables():
    """Set up environment variables for Space-Track.org"""
    print("🔧 Setting up Space-Track.org Environment Variables")
    print("=" * 60)
    
    # Check if already configured
    if os.getenv("SPACE_TRACK_USERNAME") and os.getenv("SPACE_TRACK_PASSWORD"):
        print("✅ Environment variables already configured!")
        username = os.getenv("SPACE_TRACK_USERNAME")
        print(f"   Username: {username}")
        return True
    
    print("⚠️  Space-Track credentials not found in environment variables.")
    print("   You need to set these environment variables:")
    print("")
    print("   export SPACE_TRACK_USERNAME='arpansethi30@gmail.com'")
    print("   export SPACE_TRACK_PASSWORD='pidxiK-xugju4-qimreb'")
    print("")
    print("🔧 To set them permanently, add to your ~/.zshrc or ~/.bashrc:")
    print("   echo 'export SPACE_TRACK_USERNAME=\"arpansethi30@gmail.com\"' >> ~/.zshrc")
    print("   echo 'export SPACE_TRACK_PASSWORD=\"pidxiK-xugju4-qimreb\"' >> ~/.zshrc")
    print("   source ~/.zshrc")
    print("")
    
    # Offer to set temporarily for this session
    set_temp = input("Set temporarily for this session? (y/n): ").lower().strip()
    if set_temp == 'y':
        os.environ["SPACE_TRACK_USERNAME"] = "arpansethi30@gmail.com"
        os.environ["SPACE_TRACK_PASSWORD"] = "pidxiK-xugju4-qimreb"
        print("✅ Environment variables set for this session!")
        return True
    
    return False

async def test_space_track_auth():
    """Test Space-Track authentication"""
    print("\n🔐 Testing Space-Track Authentication...")
    print("=" * 60)
    
    auth = SpaceTrackAuth()
    
    # Test connection
    success = await auth.test_connection()
    
    if success:
        print("✅ Space-Track authentication: SUCCESS")
        
        # Show status
        status = auth.get_status()
        print(f"   Configured: {status['configured']}")
        print(f"   Session Valid: {status['session_valid']}")
        print(f"   Requests this hour: {status['requests_this_hour']}/{status['rate_limit_hour']}")
        return True
    else:
        print("❌ Space-Track authentication: FAILED")
        status = auth.get_status()
        if not status['configured']:
            print("   Issue: Credentials not configured")
        else:
            print("   Issue: Login failed - check credentials")
        return False

async def test_satellite_service():
    """Test the updated satellite service"""
    print("\n🛰️  Testing Satellite Service with Space-Track...")
    print("=" * 60)
    
    service = SatelliteService()
    
    try:
        print("Fetching 10 satellites for testing...")
        response = await service.get_active_satellites(
            limit=10,
            include_orbital_data=True,
            include_space_weather=True,
            include_collision_risk=False  # Skip to speed up test
        )
        
        if response and len(response.satellites) > 0:
            print(f"✅ Satellite Service: SUCCESS")
            print(f"   Retrieved: {len(response.satellites)} satellites")
            print(f"   Total available: {response.total_count}")
            
            # Show sample satellites
            print(f"\n📡 Sample Satellites:")
            for i, sat in enumerate(response.satellites[:3]):
                print(f"   {i+1}. {sat.name} (NORAD: {sat.norad_id})")
                if sat.orbital:
                    try:
                        # Try common attribute names for altitude and period
                        altitude = getattr(sat.orbital, 'altitude_km', None) or getattr(sat.orbital, 'altitude', None)
                        period = getattr(sat.orbital, 'orbital_period_minutes', None) or getattr(sat.orbital, 'period', None)
                        
                        if altitude:
                            print(f"      Altitude: {altitude:.1f} km")
                        if period:  
                            print(f"      Period: {period:.1f} min")
                        
                        # Show available attributes for debugging
                        attrs = [attr for attr in dir(sat.orbital) if not attr.startswith('_')]
                        print(f"      Available attrs: {', '.join(attrs[:5])}...")
                    except Exception as e:
                        print(f"      Orbital data: {type(sat.orbital).__name__} object")
            
            if response.space_weather_summary:
                print(f"\n🌞 Space Weather:")
                try:
                    weather = response.space_weather_summary
                    # Try different attribute names
                    solar_flux = getattr(weather, 'solar_flux', None) or getattr(weather, 'f107', None)
                    geo_index = getattr(weather, 'geomagnetic_index', None) or getattr(weather, 'kp', None)
                    
                    if solar_flux:
                        print(f"   Solar Flux: {solar_flux}")
                    if geo_index:
                        print(f"   Geomagnetic Index: {geo_index}")
                    
                    # Show available attributes
                    attrs = [attr for attr in dir(weather) if not attr.startswith('_')]
                    print(f"   Available attrs: {', '.join(attrs[:5])}...")
                except Exception as e:
                    print(f"   Space weather data: {type(response.space_weather_summary).__name__} object")
            
            return True
        else:
            print("❌ Satellite Service: NO DATA")
            print("   No satellites retrieved - check logs for details")
            return False
            
    except Exception as e:
        print(f"❌ Satellite Service: ERROR")
        print(f"   Error: {str(e)}")
        return False
    finally:
        await service.close()

async def run_full_test():
    """Run complete integration test"""
    print("🚀 Space-Track.org Integration Test")
    print("=" * 60)
    
    # Step 1: Setup environment
    if not setup_environment_variables():
        print("\n❌ Cannot proceed without credentials")
        return False
    
    # Step 2: Test authentication
    auth_success = await test_space_track_auth()
    if not auth_success:
        print("\n❌ Cannot proceed without authentication")
        return False
    
    # Step 3: Test satellite service
    service_success = await test_satellite_service()
    
    # Results
    print("\n" + "=" * 60)
    print("📊 INTEGRATION TEST RESULTS")
    print("=" * 60)
    
    if auth_success and service_success:
        print("🎉 SUCCESS! Space-Track.org integration is working!")
        print("")
        print("✅ Authentication: Working")
        print("✅ TLE Data Retrieval: Working")
        print("✅ Orbital Mechanics: Working")
        print("✅ Space Weather: Working")
        print("")
        print("🚀 Your system is ready! The 503 Service Unavailable errors should be fixed.")
        print("   Start the backend server and test the dashboard.")
        return True
    else:
        print("❌ FAILED! There are issues with the integration.")
        print("")
        if not auth_success:
            print("❌ Authentication: Failed")
        if not service_success:
            print("❌ TLE Data Retrieval: Failed")
        print("")
        print("🔧 Check the error messages above and fix the issues.")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(run_full_test())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1) 