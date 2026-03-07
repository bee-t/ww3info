import InteractiveWorldMap from '@/components/InteractiveWorldMap'
import ChronosPeaceClock from '@/components/ChronosPeaceClock'
import ResourceDataVisualization from '@/components/ResourceDataVisualization'
import ConflictNews from '@/components/ConflictNews'
import { Menu, Clock, MapPin, TrendingDown, Archive, AlertTriangle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header Navigation */}
      <header className="fixed w-full top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-cyber-amber/30">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-cyber-amber animate-pulse"></div>
              <h1 className="text-xl md:text-2xl font-bold neon-amber font-mono">CONFLICT ARCHIVE 2100</h1>
            </div>
            <ul className="hidden md:flex space-x-8 text-sm font-semibold tracking-wider">
              <li><a href="#timeline" className="hover:text-cyber-amber transition-colors uppercase flex items-center gap-2">
                <Clock className="w-4 h-4" />Timeline
              </a></li>
              <li><a href="#parties" className="hover:text-cyber-amber transition-colors uppercase flex items-center gap-2">
                <MapPin className="w-4 h-4" />Conflicting Parties
              </a></li>
              <li><a href="#turning-points" className="hover:text-cyber-amber transition-colors uppercase flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />Turning Points
              </a></li>
              <li><a href="#losses" className="hover:text-cyber-amber transition-colors uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />Losses
              </a></li>
              <li><a href="#archive" className="hover:text-cyber-amber transition-colors uppercase flex items-center gap-2">
                <Archive className="w-4 h-4" />Archive Material
              </a></li>
            </ul>
            <button className="md:hidden text-cyber-amber">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-20">
        
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            
            {/* Interactive World Map */}
            <InteractiveWorldMap />
            
            {/* Chronos Peace Clock */}
            <ChronosPeaceClock />
          </div>
        </section>

        {/* Key Stats Widget */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            <span className="neon-amber">QUANTITATIVE OVERVIEW</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Stat Card 1 */}
            <div className="border border-cyber-amber/30 p-6 rounded-lg bg-gradient-to-br from-cyber-amber/5 to-cyber-green/5 hover:transform hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,176,0,0.2)] relative overflow-hidden">
              <div className="scanlines absolute inset-0"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 border-2 border-cyber-amber rounded flex items-center justify-center">
                    <Clock className="w-6 h-6 text-cyber-amber" />
                  </div>
                  <div className="text-xs text-gray-500 font-mono">DURATION</div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-cyber-amber font-mono mb-2 animate-flicker">
                  22.5 <span className="text-lg">YEARS</span>
                </div>
                <p className="text-xs text-gray-400">Total conflict duration</p>
                <div className="mt-4 h-1 bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-cyber-amber animate-pulse" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="border border-cyber-green/30 p-6 rounded-lg bg-gradient-to-br from-cyber-green/5 to-cyber-amber/5 hover:transform hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,255,65,0.2)] relative overflow-hidden">
              <div className="scanlines absolute inset-0"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 border-2 border-cyber-green rounded flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-cyber-green" />
                  </div>
                  <div className="text-xs text-gray-500 font-mono">NATIONS</div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-cyber-green font-mono mb-2 animate-flicker">
                  47
                </div>
                <p className="text-xs text-gray-400">Participating nations</p>
                <div className="mt-4 h-1 bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-cyber-green animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="border border-red-500/30 p-6 rounded-lg bg-gradient-to-br from-red-500/5 to-cyber-amber/5 hover:transform hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,0,102,0.2)] relative overflow-hidden">
              <div className="scanlines absolute inset-0"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 border-2 border-red-500 rounded flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="text-xs text-gray-500 font-mono">MEGACITIES</div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-red-400 font-mono mb-2 animate-flicker">
                  12
                </div>
                <p className="text-xs text-gray-400">Destroyed megacities</p>
                <div className="mt-4 h-1 bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-red-500 animate-pulse" style={{ width: '90%' }}></div>
                </div>
              </div>
            </div>

            {/* Stat Card 4 */}
            <div className="border border-blue-500/30 p-6 rounded-lg bg-gradient-to-br from-blue-500/5 to-cyber-green/5 hover:transform hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,150,255,0.2)] relative overflow-hidden">
              <div className="scanlines absolute inset-0"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 border-2 border-blue-500 rounded flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="text-xs text-gray-500 font-mono">BORDERS</div>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-blue-400 font-mono mb-2 animate-flicker">
                  83
                </div>
                <p className="text-xs text-gray-400">Redrawn borders</p>
                <div className="mt-4 h-1 bg-gray-800 rounded overflow-hidden">
                  <div className="h-full bg-blue-500 animate-pulse" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real-time Conflict News */}
        <ConflictNews />

        {/* Data Visualization */}
        <ResourceDataVisualization />

        {/* Archive Footer */}
        <footer className="container mx-auto px-4 py-12 mt-20 border-t border-gray-800">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-bold text-cyber-amber mb-4 font-mono">ARCHIVE ACCESS</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyber-amber transition-colors">Declassified Documents</a></li>
                <li><a href="#" className="hover:text-cyber-amber transition-colors">Survivor Testimonies</a></li>
                <li><a href="#" className="hover:text-cyber-amber transition-colors">Military Records</a></li>
                <li><a href="#" className="hover:text-cyber-amber transition-colors">Media Archive</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-cyber-green mb-4 font-mono">RESEARCH TOOLS</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-cyber-green transition-colors">Interactive Timeline</a></li>
                <li><a href="#" className="hover:text-cyber-green transition-colors">3D Battle Reconstructions</a></li>
                <li><a href="#" className="hover:text-cyber-green transition-colors">Geopolitical Analysis</a></li>
                <li><a href="#" className="hover:text-cyber-green transition-colors">Statistical Database</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold text-blue-400 mb-4 font-mono">ABOUT THIS ARCHIVE</h4>
              <p className="text-sm text-gray-400 mb-4">
                Established by the United Earth Government Historical Preservation Committee. Mission: To ensure future generations understand the cost of conflict and the value of unity.
              </p>
              <p className="text-xs text-gray-600 font-mono">© 2100 EARTH COALITION ARCHIVES</p>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-900 text-center">
            <p className="text-xs text-gray-600 font-mono">
              CLASSIFICATION: PUBLIC DOMAIN // LAST UPDATED: 2100.03.04 // ARCHIVE VERSION 3.7.2
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
