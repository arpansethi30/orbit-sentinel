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
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { satelliteApi, SatelliteResponse, SpaceWeatherData, handleApiError } from '@/lib/api';
import { cn, formatNumber, getRiskColor } from '@/lib/utils';

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
  color = 'blue' 
}: { 
  title: string; 
  value: string; 
  change?: string; 
  icon: any; 
  color?: string;
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
        <div className={cn('p-3 rounded-xl', colorClasses[color as keyof typeof colorClasses])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
};

export default function DashboardPage() {
  const [satelliteData, setSatelliteData] = useState<SatelliteResponse | null>(null);
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeatherData | null>(null);
  const [typesSummary, setTypesSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard data in parallel
        const [satellites, weather, types] = await Promise.all([
          satelliteApi.getSatellites({ 
            limit: 50, 
            include_orbital: true, 
            include_weather: true, 
            include_risk: true 
          }),
          satelliteApi.getCurrentSpaceWeather(),
          satelliteApi.getSatelliteTypesSummary(),
        ]);

        setSatelliteData(satellites);
        setSpaceWeather(weather);
        setTypesSummary(types);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
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

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-12"
      >
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Mission Control
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {' '}Dashboard
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Real-time monitoring of 2000+ satellites with advanced orbital mechanics, 
            collision risk assessment, and space weather integration.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
              ✅ {formatNumber(satelliteData?.total_count || 0, 0)} Satellites Tracked
            </div>
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
              🛰️ Real-time Orbital Data
            </div>
            <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
              ⚡ Live Risk Assessment
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Satellites"
          value={formatNumber(satelliteData?.total_count || 0, 0)}
          change="Live tracking"
          icon={Satellite}
          color="blue"
        />
        <StatCard
          title="High Risk Objects"
          value={formatNumber(satelliteData?.high_risk_satellites?.length || 0, 0)}
          change="Collision alerts"
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Space Weather"
          value={spaceWeather?.geomagnetic_kp ? formatNumber(spaceWeather.geomagnetic_kp, 1) : 'N/A'}
          change="Kp Index"
          icon={CloudLightning}
          color="orange"
        />
        <StatCard
          title="Data Sources"
          value="3"
          change="CelesTrak • NOAA • JPL"
          icon={Globe}
          color="green"
        />
      </div>

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Satellite Tracking */}
        <Card className="p-8" href="/satellites">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Orbit className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Satellite Tracking</h3>
              <p className="text-gray-600">Real-time orbital mechanics</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">Payloads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(typesSummary?.type_breakdown?.PAYLOAD || 0, 0)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">Rocket Bodies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(typesSummary?.type_breakdown?.ROCKET_BODY || 0, 0)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center text-blue-600 text-sm font-medium">
              <span>View All Satellites</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Card>

        {/* Risk Assessment */}
        <Card className="p-8" href="/risks">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-red-50 rounded-xl">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Collision Risk</h3>
              <p className="text-gray-600">Real-time threat assessment</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {satelliteData?.high_risk_satellites && satelliteData.high_risk_satellites.length > 0 ? (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="font-semibold text-red-900">High Risk Alert</p>
                </div>
                <p className="text-red-700">
                  {satelliteData.high_risk_satellites.length} satellites require immediate attention
                </p>
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-900">All Clear</p>
                </div>
                <p className="text-green-700">No high-risk collisions detected</p>
              </div>
            )}
            
            <div className="flex items-center text-red-600 text-sm font-medium">
              <span>View Risk Assessment</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Card>

        {/* Space Weather */}
        <Card className="p-8" href="/weather">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Space Weather</h3>
              <p className="text-gray-600">Environmental conditions</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">Solar Flux</p>
                <p className="text-lg font-bold text-gray-900">
                  {spaceWeather?.solar_flux_f107 ? formatNumber(spaceWeather.solar_flux_f107, 1) : 'N/A'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">Kp Index</p>
                <p className="text-lg font-bold text-gray-900">
                  {spaceWeather?.geomagnetic_kp ? formatNumber(spaceWeather.geomagnetic_kp, 1) : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center text-orange-600 text-sm font-medium">
              <span>View Space Weather</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Card>

        {/* Analytics */}
        <Card className="p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-purple-50 rounded-xl">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Advanced Analytics</h3>
              <p className="text-gray-600">Predictive intelligence</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Orbital Calculations</p>
                <Activity className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-gray-900">Real-time position tracking</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Collision Prediction</p>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-gray-900">24-hour probability models</p>
            </div>
            
            <div className="flex items-center text-purple-600 text-sm font-medium">
              <span>Real-time Active</span>
              <Activity className="w-4 h-4 ml-1" />
            </div>
          </div>
        </Card>
      </div>

      {/* Data Sources Status */}
      <Card className="p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Data Sources Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900">CelesTrak</p>
              <p className="text-sm text-gray-600">Satellite TLE Data - Unavailable</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900">NOAA SWPC</p>
              <p className="text-sm text-gray-600">Space Weather - Active</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900">JPL Horizons</p>
              <p className="text-sm text-gray-600">Orbital Mechanics - Standby</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 