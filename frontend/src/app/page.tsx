'use client';

import { motion } from 'framer-motion';
import { 
  Satellite, 
  Shield, 
  AlertTriangle, 
  CloudLightning, 
  BarChart3, 
  Zap, 
  Activity,
  Orbit,
  ArrowRight,
  CheckCircle,
  Star,
  Database,
  Radar
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Professional color palette
const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe', 
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    900: '#0c4a6e'
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  }
};

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

// Feature Card Component
const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  gradient 
}: { 
  icon: any; 
  title: string; 
  description: string;
  gradient: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    className="group relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300"
  >
    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mb-6', gradient)}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

// Stats Component
const StatsSection = () => (
  <section className="py-16 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {[
          { number: '2000+', label: 'Satellites Tracked', icon: Satellite },
          { number: '99.9%', label: 'Uptime Reliability', icon: Shield },
          { number: '<1ms', label: 'Detection Latency', icon: Zap },
          { number: '24/7', label: 'Monitoring', icon: Activity }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <stat.icon className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
            <div className="text-gray-600 text-sm">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default function LandingPage() {

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 bg-[size:20px_20px] opacity-40"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
                <Orbit className="w-4 h-4 mr-2" />
                Advanced Space Collision Avoidance
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Prevent Space
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  {' '}Collisions
                </span>
                <br />Before They Happen
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Real-time monitoring and AI-powered risk assessment for 2000+ satellites. 
                Protect critical space infrastructure with precision orbital mechanics and 
                advanced collision prediction.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/dashboard" className="group">
                  <button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center">
                    Launch Dashboard
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                
                <Link href="/satellites" className="group">
                  <button className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-blue-600 hover:text-blue-600 transition-all duration-300 flex items-center justify-center">
                    View Satellites
                    <Satellite className="w-5 h-5 ml-2" />
                  </button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  SOC 2 Compliant
                </div>
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-blue-500 mr-2" />
                  Enterprise Security
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-2" />
                  99.9% Uptime
                </div>
              </div>
            </motion.div>

            {/* Right Column - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-bold text-xl">Live Monitoring</h3>
                    <div className="flex items-center text-green-300">
                      <Activity className="w-4 h-4 mr-2 animate-pulse" />
                      Active
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80 text-sm">Satellites Tracked</span>
                        <span className="text-white font-bold">2,847</span>
                      </div>
                      <div className="bg-white/20 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full w-4/5"></div>
                      </div>
                    </div>
                    
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80 text-sm">Risk Level</span>
                        <span className="text-green-300 font-bold">LOW</span>
                      </div>
                      <div className="bg-white/20 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full w-1/5"></div>
                      </div>
                    </div>
                    
                    <div className="bg-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/80 text-sm">Space Weather</span>
                        <span className="text-blue-300 font-bold">STABLE</span>
                      </div>
                      <div className="bg-white/20 rounded-full h-2">
                        <div className="bg-blue-400 h-2 rounded-full w-3/5"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Advanced Space Monitoring Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive satellite tracking with AI-powered collision prediction, 
              real-time space weather monitoring, and precision orbital mechanics.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Radar}
              title="Real-Time Tracking"
              description="Monitor 2000+ satellites with sub-second precision. Advanced orbital mechanics calculations provide accurate position and velocity data."
              gradient="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            
            <FeatureCard
              icon={AlertTriangle}
              title="Collision Prediction"
              description="AI-powered risk assessment identifies potential collisions days in advance. Automated alerts protect critical space infrastructure."
              gradient="bg-gradient-to-br from-red-500 to-red-600"
            />
            
            <FeatureCard
              icon={CloudLightning}
              title="Space Weather"
              description="Real-time solar activity monitoring affects satellite operations. Track geomagnetic storms and atmospheric drag factors."
              gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            />
            
            <FeatureCard
              icon={Database}
              title="Historical Analysis"
              description="Access years of orbital data for trend analysis. Machine learning models improve prediction accuracy over time."
              gradient="bg-gradient-to-br from-green-500 to-green-600"
            />
            
            <FeatureCard
              icon={Shield}
              title="Enterprise Security"
              description="Bank-grade encryption and SOC 2 compliance. Role-based access controls protect sensitive orbital data."
              gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
            />
            
            <FeatureCard
              icon={BarChart3}
              title="Advanced Analytics"
              description="Comprehensive dashboards and reporting. Export data for regulatory compliance and mission planning."
              gradient="bg-gradient-to-br from-orange-500 to-orange-600"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Secure Your Space Assets?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join leading space agencies and satellite operators using Orbit Sentinel 
              to protect billions in space infrastructure.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all duration-300 flex items-center">
                  Start Monitoring
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </Link>
              
              <button className="border-2 border-gray-400 text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:border-white hover:text-white transition-all duration-300">
                Contact Sales
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mt-6">
              No credit card required • 14-day free trial • SOC 2 compliant
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
