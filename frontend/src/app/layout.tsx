import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ClientNavigation from "@/components/ClientNavigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Orbit Sentinel - Enterprise Space Collision Avoidance Platform",
  description: "Advanced satellite tracking and collision risk assessment system. Protect critical space infrastructure with AI-powered orbital mechanics and real-time monitoring.",
  keywords: ["satellites", "space", "collision", "tracking", "orbital mechanics", "space debris", "enterprise", "AI", "real-time monitoring"],
  authors: [{ name: "Orbit Sentinel" }],
  openGraph: {
    title: "Orbit Sentinel - Enterprise Space Collision Avoidance",
    description: "Protect billions in space infrastructure with advanced satellite tracking and AI-powered collision prediction",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
          {/* Navigation */}
          <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                {/* Logo */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">OS</span>
                  </div>
                  <Link href="/" className="text-xl font-bold text-gray-900">
                    Orbit Sentinel
                  </Link>
                </div>

                {/* Navigation Links */}
                <ClientNavigation />

                {/* Status */}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gray-900 text-white mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Main Footer Content */}
              <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Company Info */}
                <div className="lg:col-span-2">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">OS</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Orbit Sentinel</h3>
                      <p className="text-gray-400 text-sm">Space Collision Avoidance Platform</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-6 max-w-md">
                    Advanced satellite tracking and collision risk assessment system powered by AI 
                    and real-time data. Protecting critical space infrastructure worldwide.
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400 text-sm font-medium">Live Monitoring</span>
                    </div>
                    <div className="text-gray-400 text-sm">99.9% Uptime</div>
                  </div>
                </div>

                {/* Product Links */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Platform</h4>
                  <ul className="space-y-3 text-gray-300">
                    <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                    <li><Link href="/satellites" className="hover:text-white transition-colors">Satellite Tracking</Link></li>
                    <li><Link href="/risks" className="hover:text-white transition-colors">Risk Assessment</Link></li>
                    <li><Link href="/weather" className="hover:text-white transition-colors">Space Weather</Link></li>
                  </ul>
                </div>

                {/* Company Links */}
                <div>
                  <h4 className="text-lg font-semibold mb-4">Company</h4>
                  <ul className="space-y-3 text-gray-300">
                    <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Contact Sales</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                  </ul>
                </div>
              </div>

              {/* Bottom Bar */}
              <div className="border-t border-gray-800 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-6 text-sm text-gray-400">
                    <span>© 2024 Orbit Sentinel. All rights reserved.</span>
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-400">
                    <span className="flex items-center space-x-2">
                      <span>Data Sources:</span>
                      <span className="text-gray-300">CelesTrak • NOAA SWPC • JPL</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
