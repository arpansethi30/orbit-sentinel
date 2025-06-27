#!/usr/bin/env python3
"""
Test script for exploring TLE data sources and CelesTrak alternatives
This helps us find working data sources before modifying the main application
"""

import asyncio
import httpx
import json
from datetime import datetime
from typing import Dict, List, Optional

class TLESourceTester:
    def __init__(self):
        self.results = {}
        
    async def test_celestrak_variations(self):
        """Test different CelesTrak endpoints and parameters"""
        print("🛰️  Testing CelesTrak Variations...")
        
        variations = [
            # Original endpoint
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
            
            # Different groups
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle",
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle", 
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle",
            
            # Different formats
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=csv",
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json",
            "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=xml",
            
            # Legacy endpoints
            "https://celestrak.org/NORAD/elements/stations.txt",
            "https://celestrak.org/NORAD/elements/visual.txt",
            "https://celestrak.org/NORAD/elements/active.txt",
            
            # HTTP instead of HTTPS
            "http://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle",
        ]
        
        user_agents = [
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Orbit-Sentinel/1.0 (Educational Research) Python/httpx",
            "Python/3.9 httpx/0.25.0",
            "curl/7.68.0",
            "",  # No user agent
        ]
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for i, url in enumerate(variations):
                for j, ua in enumerate(user_agents):
                    try:
                        headers = {"User-Agent": ua} if ua else {}
                        print(f"  Testing {i+1}.{j+1}: {url[:60]}... with UA: {ua[:30]}...")
                        
                        response = await client.get(url, headers=headers)
                        
                        print(f"    ✅ Status: {response.status_code}")
                        if response.status_code == 200:
                            content = response.text[:200] + "..." if len(response.text) > 200 else response.text
                            print(f"    📄 Content preview: {content}")
                            self.results[f"celestrak_{i}_{j}"] = {
                                "url": url,
                                "user_agent": ua,
                                "status": response.status_code,
                                "content_length": len(response.text),
                                "working": True
                            }
                            return response.text  # Return first working result
                        else:
                            print(f"    ❌ Failed: {response.status_code} {response.reason_phrase}")
                            
                    except Exception as e:
                        print(f"    💥 Error: {str(e)[:50]}...")
                    
                    # Small delay to be respectful
                    await asyncio.sleep(1)
        
        return None

    async def test_space_track_org(self):
        """Test Space-Track.org (official US government source)"""
        print("\n🇺🇸 Testing Space-Track.org...")
        
        # Space-Track requires authentication, but we can test the login endpoint
        login_url = "https://www.space-track.org/ajaxauth/login"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get("https://www.space-track.org/")
                print(f"  Space-Track.org status: {response.status_code}")
                if response.status_code == 200:
                    print("  ✅ Space-Track.org is accessible (requires free registration)")
                    self.results["space_track"] = {
                        "accessible": True,
                        "requires_auth": True,
                        "note": "Free registration required at https://www.space-track.org/auth/createAccount"
                    }
                    return True
        except Exception as e:
            print(f"  ❌ Space-Track.org error: {e}")
        
        return False

    async def test_n2yo_api(self):
        """Test N2YO.com API"""
        print("\n🌍 Testing N2YO API...")
        
        # N2YO has free tier but requires API key
        test_url = "https://api.n2yo.com/rest/v1/satellite/positions/25544/41.702/-76.014/0/2"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(test_url)
                print(f"  N2YO API status: {response.status_code}")
                if response.status_code == 401:
                    print("  ✅ N2YO API is accessible (requires free API key)")
                    self.results["n2yo"] = {
                        "accessible": True,
                        "requires_api_key": True,
                        "note": "Free API key available at https://www.n2yo.com/api/"
                    }
                    return True
                elif response.status_code == 200:
                    print("  ✅ N2YO API working without key (limited)")
                    return True
        except Exception as e:
            print(f"  ❌ N2YO API error: {e}")
        
        return False

    async def test_amateur_radio_sources(self):
        """Test amateur radio satellite tracking sources"""
        print("\n📡 Testing Amateur Radio Sources...")
        
        sources = [
            "https://www.amsat.org/tle/current/nasabare.txt",
            "https://amsat.org/tle/current/nasabare.txt", 
            "https://celestrak.org/NORAD/elements/amateur.txt",
            "https://www.dk3wn.info/files/elements.txt",
        ]
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            for i, url in enumerate(sources):
                try:
                    print(f"  Testing amateur source {i+1}: {url}")
                    response = await client.get(url)
                    
                    if response.status_code == 200:
                        content_preview = response.text[:200].replace('\n', ' ')
                        print(f"    ✅ Working! Preview: {content_preview}...")
                        self.results[f"amateur_{i}"] = {
                            "url": url,
                            "status": 200,
                            "content_length": len(response.text),
                            "working": True
                        }
                        return response.text
                    else:
                        print(f"    ❌ Status: {response.status_code}")
                        
                except Exception as e:
                    print(f"    💥 Error: {str(e)[:50]}...")
                
                await asyncio.sleep(1)
        
        return None

    async def test_esa_sources(self):
        """Test European Space Agency data sources"""
        print("\n🇪🇺 Testing ESA Sources...")
        
        esa_urls = [
            "https://discosweb.esoc.esa.int/",
            "https://sscweb.gsfc.nasa.gov/",
        ]
        
        # These typically require authentication, but we can check availability
        async with httpx.AsyncClient() as client:
            for url in esa_urls:
                try:
                    print(f"  Testing: {url}")
                    response = await client.get(url, timeout=10)
                    print(f"    Status: {response.status_code}")
                    if response.status_code == 200:
                        print("    ✅ Accessible")
                except Exception as e:
                    print(f"    Error: {str(e)[:50]}...")

    async def create_mock_tle_data(self):
        """Create realistic mock TLE data for development"""
        print("\n🎭 Creating Mock TLE Data...")
        
        mock_tle = """ISS (ZARYA)             
1 25544U 98067A   24179.50000000  .00002182  00000-0  40768-4 0  9990
2 25544  51.6461 339.7939 0001220  92.8340 267.3124 15.49309711123456
STARLINK-1007           
1 44713U 19074A   24179.50000000  .00001643  00000-0  12345-4 0  9990
2 44713  53.0532  74.4851 0001384  94.8039 265.3463 15.06431235123456
NOAA 18                 
1 28654U 05018A   24179.50000000  .00000123  00000-0  71234-4 0  9990
2 28654  99.0642 167.7634 0013866  73.8282 286.4687 14.12501637123456
HUBBLE SPACE TELESCOPE  
1 20580U 90037B   24179.50000000  .00000654  00000-0  12345-4 0  9990
2 20580  28.4691 287.4950 0002649 321.7771  38.2830 15.09277318123456
GPS BIIR-2  (PRN 13)    
1 24876U 97035A   24179.50000000 -.00000012  00000-0  00000+0 0  9990
2 24876  55.4627 201.7623 0048593 312.4556  47.0920  2.00561720123456"""
        
        print("  📄 Mock TLE data created successfully")
        print(f"     Contains {len(mock_tle.split('\\n')) // 3} satellites")
        
        self.results["mock_data"] = {
            "satellites_count": len(mock_tle.split('\n')) // 3,
            "data_length": len(mock_tle),
            "suitable_for_demo": True
        }
        
        return mock_tle

    async def run_all_tests(self):
        """Run all TLE source tests"""
        print("🚀 Starting TLE Data Source Testing...")
        print("=" * 60)
        
        # Test CelesTrak variations first
        celestrak_data = await self.test_celestrak_variations()
        
        # Test alternative sources
        await self.test_space_track_org()
        await self.test_n2yo_api()
        amateur_data = await self.test_amateur_radio_sources()
        await self.test_esa_sources()
        
        # Create mock data as fallback
        mock_data = await self.create_mock_tle_data()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        working_sources = []
        if celestrak_data:
            working_sources.append("✅ CelesTrak (found working variation)")
        if amateur_data:
            working_sources.append("✅ Amateur Radio Sources")
        
        print(f"Working sources: {len(working_sources)}")
        for source in working_sources:
            print(f"  {source}")
        
        print(f"\nAlternative options:")
        for key, result in self.results.items():
            if key.startswith(("space_track", "n2yo")):
                print(f"  📋 {key}: {result.get('note', 'Available with registration')}")
        
        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")
        
        if celestrak_data:
            print("1. ✅ Use the working CelesTrak variation found")
        elif amateur_data:
            print("1. ✅ Use Amateur Radio sources for satellite subset")
        else:
            print("1. 🔑 Register for Space-Track.org (free, official US govt source)")
            print("2. 🔑 Get N2YO API key (free tier available)")
        
        print("3. 🎭 Use mock data for development/demo")
        print("4. 📁 Cache TLE data locally to reduce API dependency")
        
        return {
            "celestrak_working": celestrak_data is not None,
            "amateur_working": amateur_data is not None,
            "alternatives_available": len([k for k in self.results.keys() if k.startswith(("space_track", "n2yo"))]) > 0,
            "mock_data_ready": mock_data is not None
        }

async def main():
    tester = TLESourceTester()
    results = await tester.run_all_tests()
    
    # Save results to file for reference
    with open("tle_source_test_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "results": tester.results,
            "summary": results
        }, f, indent=2)
    
    print(f"\n💾 Results saved to: tle_source_test_results.json")

if __name__ == "__main__":
    asyncio.run(main()) 