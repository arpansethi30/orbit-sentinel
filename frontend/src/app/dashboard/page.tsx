'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Satellite, 
  AlertTriangle, 
  CloudLightning, 
  Globe,
  Activity,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react';

interface DashboardMetrics {
  total_satellites: number;
  active_satellites: number;
  high_risk_objects: number;
  collision_alerts: number;
  space_weather_kp: number;
  data_sources_active: number;
  data_sources_list: string[];
  tracking_coverage: number;
  last_updated: string;
}

interface PredictiveAnalytics {
  collision_probability_24h: number;
  high_risk_events: number;
  orbital_decay_predictions: number;
  space_weather_impact_score: number;
  active_tracking_satellites: number;
}

interface CollisionPrediction {
  probability_score: number;
  high_risk_pairs: Array<{
    satellite1: { name: string; norad_id: number };
    satellite2: { name: string; norad_id: number };
    combined_risk: number;
    closest_approach_km: number;
  }>;
  critical_time_windows: Array<{
    satellite: { name: string; norad_id: number };
    time_window_start: string;
    time_window_end: string;
    risk_level: string;
    probability: number;
  }>;
  risk_assessment: string;
  confidence_level: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<PredictiveAnalytics | null>(null);
  const [collisionPrediction, setCollisionPrediction] = useState<CollisionPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [metricsRes, analyticsRes, collisionRes] = await Promise.all([
          fetch('http://localhost:8000/api/dashboard/metrics'),
          fetch('http://localhost:8000/api/dashboard/analytics'),
          fetch('http://localhost:8000/api/dashboard/collision-prediction')
        ]);

        if (!metricsRes.ok || !analyticsRes.ok || !collisionRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [metricsData, analyticsData, collisionData] = await Promise.all([
          metricsRes.json(),
          analyticsRes.json(),
          collisionRes.json()
        ]);

        setMetrics(metricsData);
        setAnalytics(analyticsData);
        setCollisionPrediction(collisionData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading real-time space data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-2">⚠️ Dashboard Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-12"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Advanced Analytics
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {' '}Dashboard
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Predictive intelligence with real-time orbital calculations, 24-hour collision probability models, 
            and advanced space weather integration powered by Space-Track.org.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              ✅ {metrics?.total_satellites || 0} Satellites Tracked
            </div>
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              🧠 Predictive Intelligence Active
            </div>
            <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
              📊 {((analytics?.collision_probability_24h || 0) * 100).toFixed(1)}% 24h Collision Risk
            </div>
            <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
              ⚡ {metrics?.tracking_coverage?.toFixed(1)}% Tracking Coverage
            </div>
          </div>
        </div>
      </motion.div>

      {/* Real-time Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Satellites</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics?.active_satellites || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Live tracking</p>
            </div>
            <div className="p-3 rounded-xl text-blue-600 bg-blue-50">
              <Satellite className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Risk Objects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics?.high_risk_objects || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Collision alerts</p>
            </div>
            <div className="p-3 rounded-xl text-red-600 bg-red-50">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Space Weather</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics?.space_weather_kp?.toFixed(2) || 'N/A'}</p>
              <p className="text-sm text-gray-500 mt-1">Kp Index</p>
            </div>
            <div className="p-3 rounded-xl text-orange-600 bg-orange-50">
              <CloudLightning className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Sources</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metrics?.data_sources_active || 0}</p>
              <p className="text-sm text-gray-500 mt-1">{metrics?.data_sources_list?.join(' • ') || 'Loading...'}</p>
            </div>
            <div className="p-3 rounded-xl text-green-600 bg-green-50">
              <Globe className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
            Predictive Analytics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">24h Collision Probability</span>
              <span className="text-lg font-bold text-purple-600">
                {((analytics?.collision_probability_24h || 0) * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">High Risk Events</span>
              <span className="text-lg font-bold text-red-600">{analytics?.high_risk_events || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Orbital Decay Predictions</span>
              <span className="text-lg font-bold text-orange-600">{analytics?.orbital_decay_predictions || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Space Weather Impact</span>
              <span className="text-lg font-bold text-blue-600">{analytics?.space_weather_impact_score?.toFixed(1) || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-red-600" />
            Collision Risk Assessment
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Overall Risk</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                collisionPrediction?.risk_assessment === 'HIGH' ? 'bg-red-100 text-red-700' :
                collisionPrediction?.risk_assessment === 'MODERATE' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {collisionPrediction?.risk_assessment || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Confidence Level</span>
              <span className="text-lg font-bold text-green-600">
                {((collisionPrediction?.confidence_level || 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">High-Risk Pairs</span>
              <span className="text-lg font-bold text-red-600">
                {collisionPrediction?.high_risk_pairs?.length || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Critical Time Windows</span>
              <span className="text-lg font-bold text-orange-600">
                {collisionPrediction?.critical_time_windows?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Risk Satellite Pairs */}
      {collisionPrediction?.high_risk_pairs && collisionPrediction.high_risk_pairs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            High-Risk Satellite Pairs
          </h3>
          <div className="space-y-3">
            {collisionPrediction.high_risk_pairs.slice(0, 5).map((pair, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {pair.satellite1.name} ↔ {pair.satellite2.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      NORAD IDs: {pair.satellite1.norad_id} & {pair.satellite2.norad_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      {(pair.combined_risk * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {pair.closest_approach_km.toFixed(1)} km
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Time Windows */}
      {collisionPrediction?.critical_time_windows && collisionPrediction.critical_time_windows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-orange-600" />
            Critical Time Windows
          </h3>
          <div className="space-y-3">
            {collisionPrediction.critical_time_windows.slice(0, 5).map((window, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{window.satellite.name}</p>
                    <p className="text-sm text-gray-600">NORAD ID: {window.satellite.norad_id}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(window.time_window_start).toLocaleString()} - 
                      {new Date(window.time_window_end).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      window.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      window.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {window.risk_level}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {(window.probability * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">🎉 Real-Time Dashboard Active!</h3>
        <p className="text-green-700">
          Your dashboard is now displaying live data from {metrics?.data_sources_active || 0} sources: {metrics?.data_sources_list?.join(', ') || 'Loading...'}. 
          Space Weather Kp Index: {metrics?.space_weather_kp?.toFixed(2) || 'N/A'}. 
          Last updated: {metrics?.last_updated ? new Date(metrics.last_updated).toLocaleString() : 'Unknown'}
        </p>
      </div>
    </div>
  );
} 