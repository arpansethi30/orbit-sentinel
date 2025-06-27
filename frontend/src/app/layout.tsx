import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ClientNavigation from "@/components/ClientNavigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Orbit Sentinel - Space Collision Avoidance Platform",
  description: "Advanced satellite tracking and collision risk assessment system powered by AI and real-time data.",
  keywords: ["satellites", "space", "collision", "tracking", "orbital mechanics", "space debris"],
  authors: [{ name: "Orbit Sentinel Team" }],
  openGraph: {
    title: "Orbit Sentinel - Space Collision Avoidance",
    description: "Real-time satellite tracking and collision prediction platform",
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
          <footer className="bg-white border-t border-gray-100 mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-xs">OS</span>
                  </div>
                  <div>
                    <p className="text-gray-900 font-semibold">Orbit Sentinel</p>
                    <p className="text-gray-500 text-sm">Built for H*QUOTIENT SPACE x SEA Hackathon</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span>Data: CelesTrak • NOAA • JPL</span>
                  <span>•</span>
                  <span>Real-time satellite tracking</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
