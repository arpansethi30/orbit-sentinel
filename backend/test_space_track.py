#!/usr/bin/env python3
"""
Test script for Space-Track.org authentication and API access
"""

import asyncio
import httpx
import json
import os
from datetime import datetime
from typing import Optional

class SpaceTrackTester:
    def __init__(self):
        self.base_url = "https://www.space-track.org"
        self.login_url = f"{self.base_url}/ajaxauth/login"
        self.session = None
        
    async def test_login(self, username: str, password: str) -> bool:
        """Test login credentials"""
        print("🔐 Testing Space-Track.org login...")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Attempt login
                login_data = {
                    "identity": username,
                    "password": password
                }
                
                print(f"  📡 Logging in as: {username}")
                response = await client.post(self.login_url, data=login_data)
                
                print(f"  📊 Login response: {response.status_code}")
                
                if response.status_code == 200:
                    # Check if login was successful
                    if "login" in response.text.lower() and "error" in response.text.lower():
                        print("  ❌ Login failed - check credentials")
                        return False
                    else:
                        print("  ✅ Login successful!")
                        
                        # Store session cookies
                        self.session = dict(response.cookies)
                        print(f"  🍪 Session cookies: {len(self.session)} cookies stored")
                        return True
                else:
                    print(f"  ❌ Login failed with status: {response.status_code}")
                    return False
                    
        except Exception as e:
            print(f"  💥 Login error: {str(e)}")
            return False

    async def test_api_query(self) -> Optional[str]:
        """Test API query for TLE data"""
        if not self.session:
            print("❌ No active session - login first")
            return None
            
        print("\n🛰️  Testing TLE data query...")
        
        # Query for recent TLE data (last 30 days, limit 10 for testing)
        query_url = (
            f"{self.base_url}/basicspacedata/query/class/gp/"
            f"decay_date/null-val/"
            f"epoch/%3Enow-30/"
            f"orderby/norad_cat_id/"
            f"limit/10/"
            f"format/tle"
        )
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Set session cookies
                client.cookies.update(self.session)
                
                print(f"  📡 Querying: {query_url}")
                response = await client.get(query_url)
                
                print(f"  📊 Query response: {response.status_code}")
                
                if response.status_code == 200:
                    content = response.text
                    if content and len(content) > 100:
                        print(f"  ✅ TLE data received! ({len(content)} chars)")
                        print(f"  📄 Sample: {content[:200]}...")
                        
                        # Count satellites (TLE format: 3 lines per satellite)
                        lines = content.strip().split('\n')
                        satellite_count = len(lines) // 3
                        print(f"  🛰️  Satellites in response: {satellite_count}")
                        
                        return content
                    else:
                        print("  ⚠️  Empty response - account may need approval")
                        return None
                else:
                    print(f"  ❌ Query failed: {response.status_code}")
                    if response.status_code == 401:
                        print("  🔐 Authentication required - session may have expired")
                    return None
                    
        except Exception as e:
            print(f"  💥 Query error: {str(e)}")
            return None

    async def test_account_status(self, username: str, password: str):
        """Full account test"""
        print("🚀 Starting Space-Track.org Account Test")
        print("=" * 50)
        
        # Test login
        login_success = await self.test_login(username, password)
        
        if login_success:
            # Test API query
            tle_data = await self.test_api_query()
            
            # Results
            print("\n" + "=" * 50)
            print("📊 TEST RESULTS")
            print("=" * 50)
            
            if tle_data:
                print("✅ Account Status: FULLY OPERATIONAL")
                print("✅ Authentication: Working")
                print("✅ API Access: Working")
                print("✅ TLE Data: Available")
                print("\n🎉 Ready to implement Space-Track integration!")
                return True
            else:
                print("⚠️  Account Status: AUTHENTICATED BUT LIMITED")
                print("✅ Authentication: Working")
                print("❌ API Access: May need approval")
                print("\n💡 Your account may still be pending approval.")
                print("   Check your email or try again in a few hours.")
                return False
        else:
            print("\n" + "=" * 50)
            print("📊 TEST RESULTS")
            print("=" * 50)
            print("❌ Account Status: LOGIN FAILED")
            print("❌ Authentication: Check username/password")
            print("\n🔧 Please verify your credentials and try again.")
            return False

async def main():
    print("🔐 Space-Track.org Account Tester")
    print("=" * 50)
    
    # Get credentials from user
    username = input("Enter your Space-Track username: ").strip()
    password = input("Enter your Space-Track password: ").strip()
    
    if not username or not password:
        print("❌ Username and password are required!")
        return
    
    # Test account
    tester = SpaceTrackTester()
    success = await tester.test_account_status(username, password)
    
    if success:
        print("\n💾 Next step: Add credentials to environment variables")
        print("   SPACE_TRACK_USERNAME=your_username")
        print("   SPACE_TRACK_PASSWORD=your_password")
    else:
        print("\n📧 If login works but API fails, check your email for approval status")

if __name__ == "__main__":
    asyncio.run(main()) 