'use client'

import { useState, useEffect } from 'react'
import { Clock, Calendar } from 'lucide-react'

export default function ChronosPeaceClock() {
  const [elapsed, setElapsed] = useState({
    years: 33,
    days: 200,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    // Peace treaty signed: August 15, 2067, 14:33:27 UTC
    // Current year in narrative: 2100
    const peaceTreatyDate = new Date('2067-08-15T14:33:27Z').getTime()
    const currentNarrativeDate = new Date('2100-03-04T00:00:00Z').getTime()

    const updateClock = () => {
      const now = Date.now()
      const diff = currentNarrativeDate - peaceTreatyDate + (now % 86400000)
      
      const seconds = Math.floor((diff / 1000) % 60)
      const minutes = Math.floor((diff / (1000 * 60)) % 60)
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const days = Math.floor((diff / (1000 * 60 * 60 * 24)) % 365)
      const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365))

      setElapsed({ years, days, hours, minutes, seconds })
    }

    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Main Peace Clock */}
      <div className="border border-cyber-green/30 p-6 bg-black/50 relative overflow-hidden">
        <div className="scan-overlay absolute inset-0 pointer-events-none"></div>
        
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <p className="text-sm text-gray-400 font-mono">CHRONOS PROTOCOL // PEACE DURATION COUNTER</p>
        </div>
        
        <div className="digital-clock text-4xl md:text-6xl text-cyber-green neon-green font-bold font-mono crt-flicker">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="text-center">
              <div className="text-5xl md:text-7xl">{String(elapsed.years).padStart(2, '0')}</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">YEARS</div>
            </div>
            <div className="text-5xl md:text-7xl opacity-50">:</div>
            <div className="text-center">
              <div className="text-5xl md:text-7xl">{String(elapsed.days).padStart(3, '0')}</div>
              <div className="text-xs md:text-sm text-gray-500 mt-1">DAYS</div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-2xl md:text-3xl mt-4">
            <span>{String(elapsed.hours).padStart(2, '0')}</span>
            <span className="animate-pulse">:</span>
            <span>{String(elapsed.minutes).padStart(2, '0')}</span>
            <span className="animate-pulse">:</span>
            <span>{String(elapsed.seconds).padStart(2, '0')}</span>
            <span className="text-sm md:text-base ml-2 text-gray-500">UTC</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="text-gray-500">
              <span className="text-cyber-green">TREATY SIGNED:</span> 2067.08.15 // 14:33:27
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyber-green animate-pulse rounded-full"></div>
              <span className="text-cyber-green">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Context Panel */}
      <div className="border border-cyber-amber/30 p-6 bg-black/50 relative">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-cyber-amber" />
          <h3 className="text-xl font-bold text-cyber-amber">ERA OF GLOBAL RESTRUCTURING</h3>
        </div>
        
        <p className="text-sm text-gray-300 leading-relaxed mb-4">
          Archive timestamp indicates 33 years, 200 days since the ratification of the Geneva Convention Treaty. 
          What follows represents a comprehensive analysis of the final global conflict before planetary unification. 
          All records have been declassified per UEG Historical Transparency Act of 2095.
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/70 border border-gray-800 p-3 rounded">
            <div className="text-xs text-gray-500 font-mono mb-1">CONFLICT DESIGNATION</div>
            <div className="text-sm font-semibold text-red-400">CLASS-Ω GLOBAL</div>
          </div>
          
          <div className="bg-black/70 border border-gray-800 p-3 rounded">
            <div className="text-xs text-gray-500 font-mono mb-1">ARCHIVE STATUS</div>
            <div className="text-sm font-semibold text-cyber-green">DECLASSIFIED</div>
          </div>
          
          <div className="bg-black/70 border border-gray-800 p-3 rounded">
            <div className="text-xs text-gray-500 font-mono mb-1">DOCUMENTATION LEVEL</div>
            <div className="text-sm font-semibold text-cyber-amber">COMPLETE</div>
          </div>
          
          <div className="bg-black/70 border border-gray-800 p-3 rounded">
            <div className="text-xs text-gray-500 font-mono mb-1">ACCESS CLEARANCE</div>
            <div className="text-sm font-semibold text-blue-400">PUBLIC DOMAIN</div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 animate-pulse"></div>
          <p className="text-xs text-red-400 font-mono">
            PRESERVATION PRIORITY: MAXIMUM // UEG MANDATE 2100.A-7
          </p>
        </div>
      </div>
    </div>
  )
}
