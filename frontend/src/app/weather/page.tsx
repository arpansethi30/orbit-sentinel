'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, 
  Zap,
  Wind,
  Activity,
  RefreshCw
} from 'lucide-react';
import { satelliteApi, SpaceWeatherData, handleApiError } from '@/lib/api';
import { cn, formatNumber } from '@/lib/utils';

const Card = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => (
  <div className={cn(
    'bg-white rounded-2xl border border-gray-100 shadow-sm',
    className
  )}>
    {children}
  </div>
);

export default function WeatherPage() {
  const [weatherData, setWeatherData] = useState<SpaceWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await satelliteApi.getCurrentSpaceWeather();
      setWeatherData(data);
    } catch (err) {
      console.error('Error fetching space weather:', err);
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading space weather data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Space Weather Monitoring
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Real-time space weather conditions and their impact on satellite operations.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Sun className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Solar Flux</p>
              <p className="text-2xl font-bold text-gray-900">
                {weatherData?.solar_flux_f107 ? formatNumber(weatherData.solar_flux_f107, 1) : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Kp Index</p>
              <p className="text-2xl font-bold text-gray-900">
                {weatherData?.geomagnetic_kp ? formatNumber(weatherData.geomagnetic_kp, 1) : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Wind className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Solar Wind</p>
              <p className="text-2xl font-bold text-gray-900">
                {weatherData?.solar_wind_speed ? formatNumber(weatherData.solar_wind_speed, 0) : 'N/A'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Drag Factor</p>
              <p className="text-2xl font-bold text-gray-900">
                {weatherData?.atmospheric_drag_factor ? formatNumber(weatherData.atmospheric_drag_factor, 2) : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Current Space Weather Status</h3>
          <button
            onClick={fetchWeatherData}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
        
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="text-gray-600">
            <p>Space weather data is being monitored from NOAA sources.</p>
            <p className="mt-2">Current conditions: {weatherData?.geomagnetic_storm_level || 'Normal'}</p>
          </div>
        )}
      </Card>
    </div>
  );
} 