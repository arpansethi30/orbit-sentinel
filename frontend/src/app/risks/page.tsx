'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  ShieldAlert,
  Target,
  Clock,
  Activity,
  Satellite,
  ArrowUpRight,
  TrendingUp
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

export default function RisksPage() {
  const [satellites, setSatellites] = useState<SatelliteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteData | null>(null);

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch satellites with risk assessment
        const response = await satelliteApi.getSatellites({ 
          limit: 500, 
          include_orbital: true, 
          include_weather: false, 
          include_risk: true 
        });
        
        // Sort by risk level (Critical > High > Medium > Low)
        const sortedSatellites = response.satellites.sort((a, b) => {
          const riskOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, '': 0 };
          const aRisk = riskOrder[a.risk?.collision_risk_level || ''] || 0;
          const bRisk = riskOrder[b.risk?.collision_risk_level || ''] || 0;
          return bRisk - aRisk;
        });
        
        setSatellites(sortedSatellites);
      } catch (err) {
        console.error('Error fetching risk data:', err);
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchRisks();
  }, []);

  // Calculate statistics
  const highRiskSatellites = satellites.filter(s => 
    s.risk?.collision_risk_level === 'HIGH' || s.risk?.collision_risk_level === 'CRITICAL'
  );
  const criticalRiskSatellites = satellites.filter(s => s.risk?.collision_risk_level === 'CRITICAL');
  const totalRiskAssessed = satellites.filter(s => s.risk?.collision_risk_level).length;
  const averageCollisionProb = satellites.reduce((sum, s) => sum + (s.risk?.collision_probability || 0), 0) / satellites.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing collision risks...</p>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Risk Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
          Collision Risk Assessment
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Advanced collision detection and risk analysis for space objects. Monitoring potential threats and collision probabilities in real-time.
        </p>
      </motion.div>

      {/* Risk Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Critical Risk</p>
              <p className="text-2xl font-bold text-red-600">{formatNumber(criticalRiskSatellites.length, 0)}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-50 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Risk</p>
              <p className="text-2xl font-bold text-orange-600">{formatNumber(highRiskSatellites.length, 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Objects Assessed</p>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(totalRiskAssessed, 0)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-purple-500">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-50 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Collision Prob.</p>
              <p className="text-2xl font-bold text-purple-600">{formatNumber(averageCollisionProb, 3)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* High Risk Alert Section */}
      {highRiskSatellites.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                High-Risk Objects Detected
              </h3>
              <p className="text-red-700 mb-4">
                {highRiskSatellites.length} satellite{highRiskSatellites.length !== 1 ? 's' : ''} currently classified as high or critical collision risk. Immediate attention recommended.
              </p>
              <div className="flex space-x-2">
                {highRiskSatellites.slice(0, 3).map((sat) => (
                  <span
                    key={sat.norad_id}
                    className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-medium"
                  >
                    {sat.name.length > 20 ? sat.name.substring(0, 20) + '...' : sat.name}
                  </span>
                ))}
                {highRiskSatellites.length > 3 && (
                  <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-medium">
                    +{highRiskSatellites.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Risk Assessment Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Risk Assessment Results ({formatNumber(satellites.length, 0)} objects)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Object</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Risk Level</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Collision Prob.</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Nearby Objects</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Closest Approach</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {satellites.slice(0, 50).map((satellite, index) => (
                <motion.tr
                  key={satellite.norad_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "hover:bg-gray-50 transition-colors",
                    satellite.risk?.collision_risk_level === 'CRITICAL' && 'bg-red-50',
                    satellite.risk?.collision_risk_level === 'HIGH' && 'bg-orange-50'
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      {(satellite.risk?.collision_risk_level === 'CRITICAL' || satellite.risk?.collision_risk_level === 'HIGH') && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{satellite.name}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>NORAD {satellite.norad_id}</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs',
                            getSatelliteTypeColor(satellite.object_type)
                          )}>
                            {satellite.object_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
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
                      <span className="text-gray-400 text-sm">Not Assessed</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {satellite.risk?.collision_probability ? 
                      `${formatNumber(satellite.risk.collision_probability, 4)}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {satellite.risk?.nearby_objects_count || 0}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {satellite.risk?.closest_approach_km ? 
                      formatDistance(satellite.risk.closest_approach_km) : 'N/A'}
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
                      <p className="font-medium">{formatNumber(selectedSatellite.risk.collision_probability || 0, 4)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nearby Objects</p>
                      <p className="font-medium">{selectedSatellite.risk.nearby_objects_count || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Closest Approach</p>
                      <p className="font-medium">{formatDistance(selectedSatellite.risk.closest_approach_km || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Debris Environment Score</p>
                      <p className="font-medium">{formatNumber(selectedSatellite.risk.debris_environment_score || 0, 2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Time to Closest Approach</p>
                      <p className="font-medium">{formatNumber(selectedSatellite.risk.time_to_closest_approach_hours || 0, 1)} hours</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Orbital Data */}
              {selectedSatellite.orbital && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Orbital Information</h4>
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
                      <p className="text-sm text-gray-600">Period</p>
                      <p className="font-medium">{formatNumber(selectedSatellite.orbital.period_minutes || 0, 1)} min</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Inclination</p>
                      <p className="font-medium">{formatNumber(selectedSatellite.orbital.inclination || 0, 2)}°</p>
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