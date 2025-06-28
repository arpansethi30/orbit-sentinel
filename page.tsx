'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Satellite, 
  AlertTriangle, 
  CloudLightning, 
  BarChart3, 
  Globe, 
  Zap, 
  Activity,
  Shield,
  Orbit,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Brain,
  Calculator,
  Target,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { satelliteApi, SatelliteResponse, SpaceWeatherData, handleApiError } from '@/lib/api';
import { cn, formatNumber, getRiskColor } from '@/lib/utils';

// Types for new analytics data
interface SystemMetrics {
  total_satellites: number;
  active_satellites: number;
  high_risk_objects: number;
  collision_alerts: number;
  space_weather_kp: number;
  data_sources_active: number;
  data_sources_list: string[];
  last_updated: string;
  tracking_coverage: number;
  status: string;
}

interface PredictiveAnalytics {
  collision_probability_24h: number;
  high_risk_events: number;
  orbital_decay_predictions: number;
  space_weather_impact_score: number;
  active_tracking_satellites: number;
  last_calculated: string;
}

interface DashboardSummary {
  system_metrics: SystemMetrics;
  predictive_analytics: PredictiveAnalytics;
  advanced_features: {
    predictive_intelligence: {
      status: string;
      features: string[];
    };
    orbital_calculations: {
      status: string;
      capabilities: string[];
    };
    collision_prediction: {
      status: string;
      models: string[];
    };
    real_time_tracking: {
      status: string;
      coverage: string;
      active_satellites: number;
      update_frequency: string;
    };
  };
}

// Card component with modern styling
const Card = ({ 
  children, 
  className = '', 
  hover = true,
  href = null
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
  href?: string | null;
}) => {
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-white rounded-2xl border border-gray-100 shadow-sm',
        hover && 'hover:shadow-lg hover:border-gray-200 transition-all duration-300',
        className
      )}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

// Stat card component
const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue',
  pulse = false
}: { 
  title: string; 
  value: string; 
  change?: string; 
  icon: any; 
  color?: string;
  pulse?: boolean;
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className="text-sm text-gray-500 mt-1">{change}</p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-xl', 
          colorClasses[color as keyof typeof colorClasses],
          pulse && 'animation-pulse'
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

// API functions for new endpoints
const API_BASE = 'http://localhost:8000';

const fetchDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await fetch(`${API_BASE}/api/dashboard/summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard summary: ${response.statusText}`);
  }
  return response.json();
};

const fetchSystemMetrics = async (): Promise<SystemMetrics> => {
  const response = await fetch(`${API_BASE}/api/dashboard/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch system metrics: ${response.statusText}`);
  }
  return response.json();
};

const fetchPredictiveAnalytics = async (): Promise<PredictiveAnalytics> => {
  const response = await fetch(`${API_BASE}/api/dashboard/analytics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch predictive analytics: ${response.statusText}`);
  }
  return response.json();
};

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [satelliteData, setSatelliteData] = useState<SatelliteResponse | null>(null);
  const [typesSummary, setTypesSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel for performance
        const [dashboard, satellites, types] = await Promise.all([
          fetchDashboardSummary(),
          satelliteApi.getSatellites({ 
            limit: 50, 
            include_orbital: true, 
            include_weather: true, 
            include_risk: true 
          }),
          satelliteApi.getSatelliteTypesSummary(),
        ]);

        setDashboardData(dashboard);
        setSatelliteData(satellites);
        setTypesSummary(types);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const metrics = dashboardData?.system_metrics;
  const analytics = dashboardData?.predictive_analytics;
  const features = dashboardData?.advanced_features;

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
              ✅ {formatNumber(metrics?.total_satellites || 0, 0)} Satellites Tracked
            </div>
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              🧠 Predictive Intelligence Active
            </div>
            <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
              📊 {formatNumber((analytics?.collision_probability_24h || 0) * 100, 2)}% 24h Collision Risk
            </div>
            <div className="px-4 py-2 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
              ⚡ {formatNumber(metrics?.tracking_coverage || 0, 1)}% Tracking Coverage
            </div>
          </div>
        </div>
      </motion.div>

      {/* Real-time Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Satellites"
          value={formatNumber(metrics?.active_satellites || 0, 0)}
          change="Live tracking"
          icon={Satellite}
          color="blue"
          pulse={true}
        />
        <StatCard
          title="High Risk Objects"
          value={formatNumber(metrics?.high_risk_objects || 0, 0)}
          change="Collision alerts"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Space Weather"
          value={metrics?.space_weather_kp ? formatNumber(metrics.space_weather_kp, 1) : 'N/A'}
          change="Kp Index"
          icon={CloudLightning}
          color="orange"
        />
        <StatCard
          title="Data Sources"
          value={formatNumber(metrics?.data_sources_active || 0, 0)}
          change={metrics?.data_sources_list?.join(' • ') || 'Loading...'}
          icon={Globe}
          color="green"
        />
      </div>

      {/* Advanced Analytics Features */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Predictive Intelligence */}
        <Card className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Predictive Intelligence</h3>
              <p className="text-gray-600">Advanced collision probability models</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-gray-600">24h Collision Risk</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatNumber((analytics?.collision_probability_24h || 0) * 100, 3)}%
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl">
                <p className="text-sm text-gray-600">High Risk Events</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatNumber(analytics?.high_risk_events || 0, 0)}
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Orbital Decay Predictions</p>
                <TrendingUp className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">
                {formatNumber(analytics?.orbital_decay_predictions || 0, 0)} satellites at risk
              </p>
            </div>
            
            <div className="flex items-center text-purple-600 text-sm font-medium">
              <span>Real-time Active</span>
              <Activity className="w-4 h-4 ml-1 animate-pulse" />
            </div>
          </div>
        </Card>

        {/* Orbital Calculations */}
        <Card className="p-8" href="/satellites">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Orbital Calculations</h3>
              <p className="text-gray-600">Real-time position tracking</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-gray-600">Active Tracking</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatNumber(analytics?.active_tracking_satellites || 0, 0)}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <p className="text-sm text-gray-600">Coverage</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatNumber(metrics?.tracking_coverage || 0, 1)}%
                </p>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Space Weather Impact</p>
                <CloudLightning className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-lg font-bold text-gray-900">
                {formatNumber(analytics?.space_weather_impact_score || 0, 1)}/10 Impact Score
              </p>
            </div>
            
            <div className="flex items-center text-blue-600 text-sm font-medium">
              <span>View All Satellites</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Card>

        {/* Collision Prediction */}
        <Card className="p-8" href="/risks">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-red-50 rounded-xl">
              <Target className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Collision Prediction</h3>
              <p className="text-gray-600">24-hour probability models</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {metrics?.collision_alerts && metrics.collision_alerts > 0 ? (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="font-semibold text-red-900">Critical Alert</p>
                </div>
                <p className="text-red-700">
                  {metrics.collision_alerts} high-probability collision events detected
                </p>
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-900">All Clear</p>
                </div>
                <p className="text-green-700">No high-risk collisions predicted in next 24 hours</p>
              </div>
            )}
            
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">24h Prediction Models</p>
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-gray-900">Monte Carlo risk assessment active</p>
            </div>
            
            <div className="flex items-center text-red-600 text-sm font-medium">
              <span>View Risk Assessment</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Card>

        {/* Real-time Tracking */}
        <Card className="p-8" href="/weather">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-green-50 rounded-xl">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Real-time Active</h3>
              <p className="text-gray-600">Live environmental monitoring</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">Update Frequency</p>
                <p className="text-lg font-bold text-gray-900">Real-time</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">System Status</p>
                <p className="text-lg font-bold text-green-900">Active</p>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="font-semibold text-green-900">Live Data Stream</p>
              </div>
              <p className="text-green-700">
                {features?.real_time_tracking?.coverage || 'N/A'} tracking coverage
              </p>
            </div>
            
            <div className="flex items-center text-green-600 text-sm font-medium">
              <span>View Space Weather</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Card>
      </div>

      {/* Dynamic Data Sources Status */}
      <Card className="p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Data Sources Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics?.data_sources_list?.map((source, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium text-gray-900">{source}</p>
                <p className="text-sm text-gray-600">
                  {source === 'Space-Track.org' && 'Official US Government TLE Data - Active'}
                  {source === 'NOAA SWPC' && 'Space Weather Data - Active'}
                  {source === 'Orbital Mechanics' && 'Real-time Calculations - Active'}
                </p>
              </div>
            </div>
          ))}
          
          {/* Show if less than 3 sources */}
          {(metrics?.data_sources_active || 0) < 3 && (
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">Additional Sources</p>
                <p className="text-sm text-gray-600">Integration in progress</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-center space-x-2 mb-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <p className="font-semibold text-blue-900">System Performance</p>
          </div>
          <p className="text-blue-700">
            Last updated: {metrics?.last_updated ? new Date(metrics.last_updated).toLocaleString() : 'Loading...'}
          </p>
          <p className="text-blue-700">
            Tracking coverage: {formatNumber(metrics?.tracking_coverage || 0, 1)}% of satellites with fresh data
          </p>
        </div>
      </Card>
    </div>
  );
} 
} 