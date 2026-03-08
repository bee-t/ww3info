'use client'

import { useState } from 'react'
import EnhancedWorldMap from '@/components/EnhancedWorldMap'
import Link from 'next/link'

export default function MapPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-black border-b-2 border-cyber-amber/50 p-3 sm:p-4">
        <div className="max-w-[2000px] mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-4xl font-bold neon-amber font-mono tracking-wider">
              ENHANCED TACTICAL MAP
            </h1>
            <p className="text-gray-500 text-[10px] sm:text-xs md:text-sm font-mono tracking-widest mt-1">
              INTERACTIVE GLOBAL THREAT VISUALIZATION
            </p>
          </div>
          <Link 
            href="/"
            className="px-3 sm:px-4 py-2 bg-gradient-to-r from-cyber-amber to-amber-600 text-black font-mono font-bold uppercase tracking-wider hover:scale-105 transition-transform border-2 border-amber-500 shadow-lg shadow-amber-500/50 text-xs sm:text-sm whitespace-nowrap"
          >
            ← BACK TO DASHBOARD
          </Link>
        </div>
      </div>

      {/* Enhanced Map */}
      <div className="p-2 sm:p-4">
        <EnhancedWorldMap />
      </div>
    </div>
  )
}
