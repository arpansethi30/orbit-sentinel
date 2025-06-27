'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Satellite, 
  Search, 
  Filter, 
  AlertTriangle, 
  Activity,
  Globe,
  Zap,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { satelliteApi, SatelliteData, handleApiError } from '@/lib/api';
import { cn, formatNumber, formatDistance, formatVelocity, getRiskColor, getSatelliteTypeColor } from '@/lib/utils';

// Card component
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

export default function SatellitesPage() {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteData | null>(null);

  useEffect(() => {
    const fetchSatellites = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await satelliteApi.getSatellites({ 
          limit: 200, 
          include_orbital: true, 
          include_weather: true, 
          include_risk: true 
        });
        
        setSatellites(response.satellites);
      } catch (err) {
        console.error('Error fetching satellites:', err);
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchSatellites();
  }, []);

  // Filter satellites based on search and type
  const filteredSatellites = satellites.filter(sat => {
    const matchesSearch = sat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sat.norad_id.toString().includes(searchTerm);
    const matchesType = filterType === 'ALL' || sat.object_type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading satellite data...</p>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Satellites</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Satellite Tracking
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Real-time monitoring of active satellites with orbital mechanics, collision risk assessment, and space weather data.
        </p>
      </motion.div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Satellite className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tracked</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(satellites.length, 0)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-50 rounded-xl">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Payloads</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(satellites.filter(s => s.object_type === 'PAYLOAD').length, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(satellites.filter(s => s.risk?.collision_risk_level === 'HIGH' || s.risk?.collision_risk_level === 'CRITICAL').length, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Debris Objects</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(satellites.filter(s => s.object_type === 'DEBRIS').length, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search satellites by name or NORAD ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="ALL">All Types</option>
              <option value="PAYLOAD">Payloads</option>
              <option value="ROCKET_BODY">Rocket Bodies</option>
              <option value="DEBRIS">Debris</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Satellites Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Satellites ({formatNumber(filteredSatellites.length, 0)} results)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Satellite</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Altitude</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Velocity</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Risk Level</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSatellites.map((satellite, index) => (
                <motion.tr
                  key={satellite.norad_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{satellite.name}</p>
                      <p className="text-sm text-gray-500">NORAD {satellite.norad_id}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium border',
                      getSatelliteTypeColor(satellite.object_type)
                    )}>
                      {satellite.object_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {satellite.orbital?.altitude ? formatDistance(satellite.orbital.altitude) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {satellite.orbital?.velocity_kmh ? formatVelocity(satellite.orbital.velocity_kmh) : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {satellite.risk?.collision_risk_level ? (
                      <span className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border',
                        getRiskColor(satellite.risk.collision_risk_level)
                      )}>
                        {satellite.risk.collision_risk_level}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedSatellite(satellite)}
                      className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <span>View Details</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Satellite Detail Modal */}
      {selectedSatellite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedSatellite.name}</h3>
                  <p className="text-gray-600">NORAD ID: {selectedSatellite.norad_id}</p>
                </div>
                <button
                  onClick={() => setSelectedSatellite(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Object Type</p>
                    <span className={cn(
                      'inline-block px-3 py-1 rounded-full text-xs font-medium border mt-1',
                      getSatelliteTypeColor(selectedSatellite.object_type)
                    )}>
                      {selectedSatellite.object_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data Source</p>
                    <p className="font-medium">{selectedSatellite.data_source}</p>
                  </div>
                </div>
              </div>

              {/* Orbital Data */}
              {selectedSatellite.orbital && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Orbital Mechanics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Altitude</p>
                      <p className="font-medium">{formatDistance(selectedSatellite.orbital.altitude || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Velocity</p>
                      <p className="font-medium">{formatVelocity(selectedSatellite.orbital.velocity_kmh || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Orbital Period</p>
                      <p className="font-medium">{formatNumber(selectedSatellite.orbital.period_minutes || 0, 1)} min</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Inclination</p>
                      <p className="font-medium">{formatNumber(selectedSatellite.orbital.inclination || 0, 2)}°</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Risk Assessment */}
              {selectedSatellite.risk && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Risk Assessment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Risk Level</p>
                      <span className={cn(
                        'inline-block px-3 py-1 rounded-full text-xs font-medium border mt-1',
                        getRiskColor(selectedSatellite.risk.collision_risk_level || '')
                      )}>
                        {selectedSatellite.risk.collision_risk_level || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Collision Probability</p>
                      <p className="font-medium">{formatNumber(selectedSatellite.risk.collision_probability || 0, 2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nearby Objects</p>
                      <p className="font-medium">{selectedSatellite.risk.nearby_objects_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Closest Approach</p>
                      <p className="font-medium">{formatDistance(selectedSatellite.risk.closest_approach_km || 0)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 