'use client'

import { useState, useEffect } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { BarChart, Database, AlertTriangle, DollarSign } from 'lucide-react'

interface WarCostData {
  dailyRateBreakdown: {
    components: Array<{
      label: string
      dailyLow: number
      dailyMid: number
      dailyHigh: number
    }>
  }
  casualties: {
    us: { incidents: Array<{ killed: number; wounded: number }> }
    iranMilitary: { incidents: Array<{ killedLow: number; killedHigh: number | null }> }
    iranCivilian: { incidents: Array<{ killedLow: number; killedHigh: number | null; wounded?: number }> }
  }
  munitions: Array<{
    name: string
    unitCost: number
    qty: number
  }>
  broaderCosts: Array<{
    group: string
    label: string
    value: string
  }>
}

const resourceData = [
  {
    resource: 'Personnel',
    cost: 85,
  },
  {
    resource: 'Naval Forces',
    cost: 45,
  },
  {
    resource: 'Aircraft Ops',
    cost: 95,
  },
  {
    resource: 'Fuel & Logistics',
    cost: 35,
  },
  {
    resource: 'Munitions',
    cost: 75,
  },
  {
    resource: 'C4ISR/Cyber',
    cost: 25,
  },
]

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/95 border border-cyber-amber p-3 font-mono text-xs">
        <p className="text-cyber-amber font-bold mb-1">{payload[0].payload.resource}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            Relative Cost Index: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function ResourceDataVisualization() {
  const [warData, setWarData] = useState<WarCostData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://iran-cost-ticker.com/data/events.json?v=' + Date.now())
      .then(res => res.json())
      .then(data => {
        setWarData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load war cost data:', err)
        setLoading(false)
      })
  }, [])

  // Calculate totals from war data
  const calculateTotals = () => {
    if (!warData) return {
      totalUsCasualties: 6,
      totalIranMilitary: 1380,
      totalIranCivilian: 1517,
      totalMunitionsCost: 1.2,
      dailyOperationalCost: 220
    }

    const usKilled = warData.casualties.us.incidents.reduce((sum, i) => sum + i.killed, 0)
    const usWounded = warData.casualties.us.incidents.reduce((sum, i) => sum + i.wounded, 0)
    
    const iranMilKilled = warData.casualties.iranMilitary.incidents.reduce((sum, i) => 
      sum + (i.killedHigh || i.killedLow), 0
    )
    
    const iranCivKilled = warData.casualties.iranCivilian.incidents.reduce((sum, i) => 
      sum + (i.killedHigh || i.killedLow), 0
    )
    
    const munitionsCost = warData.munitions.reduce((sum, m) => 
      sum + (m.unitCost * m.qty), 0
    ) / 1_000_000_000 // Convert to billions

    return {
      totalUsCasualties: usKilled + usWounded,
      totalIranMilitary: iranMilKilled,
      totalIranCivilian: iranCivKilled,
      totalMunitionsCost: munitionsCost,
      dailyOperationalCost: 220
    }
  }

  const totals = calculateTotals()
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Database className="w-8 h-8 text-cyber-amber" />
        <h2 className="text-2xl md:text-3xl font-bold text-center">
          <span className="neon-amber">OPERATION EPIC FURY // COST ANALYSIS</span>
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-pulse text-2xl text-cyber-amber font-mono">
            ⚡ LOADING OPERATIONAL DATA ⚡
          </div>
        </div>
      ) : (
        <>
          {/* Radar Chart */}
          <div className="grid md:grid-cols-1 gap-8 mb-8">
            <div className="border border-cyber-amber/30 p-6 bg-black/50 rounded-lg relative overflow-hidden">
              <div className="scan-overlay absolute inset-0"></div>
              
              <div className="flex items-center gap-2 mb-4">
                <BarChart className="w-5 h-5 text-cyber-amber" />
                <h3 className="text-lg font-semibold text-cyber-amber font-mono">
                  COMPARATIVE RESOURCE INDEX // OPERATIONAL COST DISTRIBUTION
                </h3>
              </div>
              
              <div className="relative z-10" style={{ width: '100%', height: '500px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={resourceData}>
                    <PolarGrid stroke="#333" strokeDasharray="3 3" />
                    <PolarAngleAxis 
                      dataKey="resource" 
                      tick={{ fill: '#e0e0e0', fontSize: 12, fontFamily: 'monospace' }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }}
                    />
                    <Radar 
                      name="Cost Index" 
                      dataKey="cost" 
                      stroke="#ffb000" 
                      fill="#ffb000" 
                      fillOpacity={0.4}
                      strokeWidth={2}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      wrapperStyle={{ 
                        fontFamily: 'monospace', 
                        fontSize: '12px',
                        paddingTop: '20px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <p className="text-xs text-gray-500 font-mono mt-4 text-center relative z-10">
                METHODOLOGY: UNIFIED EARTH GOVERNMENT RESOURCE ASSESSMENT DIVISION // 2100.Q1
              </p>
            </div>
          </div>

          {/* Analysis Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* HIGH-VALUE MUNITIONS */}
            <div className="border border-red-500/30 p-6 bg-black/50 rounded-lg relative overflow-hidden">
              <div className="scanlines absolute inset-0"></div>
              <div className="relative z-10">
                <h4 className="text-lg font-bold text-red-400 font-mono mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  HIGH-VALUE MUNITIONS
                </h4>
                <div className="space-y-3">
                  {warData?.munitions.slice(0, 3).map((munition, idx) => {
                    const totalCost = munition.unitCost * munition.qty
                    const percentage = Math.min((totalCost / 1_000_000_000) * 20, 100) // Scale for visualization
                    
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">{munition.name}</span>
                          <span className="text-red-400 font-mono">
                            ${(totalCost / 1_000_000).toFixed(0)}M
                          </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${percentage}%` }}></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {munition.qty} units @ ${(munition.unitCost / 1_000_000).toFixed(1)}M ea
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-600 font-mono mt-4">
                  Total munitions cost: ${totals.totalMunitionsCost.toFixed(2)}B
                </p>
              </div>
            </div>

            {/* DAILY OPERATIONAL COSTS */}
            <div className="border border-cyber-green/30 p-6 bg-black/50 rounded-lg relative overflow-hidden">
              <div className="scanlines absolute inset-0"></div>
              <div className="relative z-10">
                <h4 className="text-lg font-bold text-cyber-green font-mono mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  DAILY OPERATIONAL COSTS
                </h4>
                <div className="space-y-3">
                  {warData?.dailyRateBreakdown.components.slice(0, 3).map((component, idx) => {
                    const dailyMid = component.dailyMid / 1_000_000 // Convert to millions
                    const percentage = Math.min((component.dailyMid / 70_000_000) * 100, 100)
                    
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">{component.label.substring(0, 25)}</span>
                          <span className="text-cyber-green font-mono">${dailyMid.toFixed(0)}M/day</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded overflow-hidden">
                          <div className="h-full bg-cyber-green animate-pulse" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-gray-600 font-mono mt-4">
                  Estimated total: ${totals.dailyOperationalCost}M/day operational burn
                </p>
              </div>
            </div>

            {/* CASUALTY TRACKING */}
            <div className="border border-cyber-amber/30 p-6 bg-black/50 rounded-lg relative overflow-hidden">
              <div className="scanlines absolute inset-0"></div>
              <div className="relative z-10">
                <h4 className="text-lg font-bold text-cyber-amber font-mono mb-3">CASUALTY TRACKING</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">🇺🇸 U.S. Forces</span>
                      <span className="text-cyber-amber font-mono">{totals.totalUsCasualties}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded overflow-hidden">
                      <div className="h-full bg-cyber-amber" style={{ width: '5%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">🇮🇷 Iranian Military</span>
                      <span className="text-cyber-amber font-mono">{totals.totalIranMilitary.toLocaleString()}+</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded overflow-hidden">
                      <div className="h-full bg-cyber-amber" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">🇮🇷 Iranian Civilians</span>
                      <span className="text-red-400 font-mono">{totals.totalIranCivilian.toLocaleString()}+</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded overflow-hidden">
                      <div className="h-full bg-red-400 animate-pulse" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-mono mt-4">
                  Source: CENTCOM, Hengaw, Iranian Red Crescent
                </p>
              </div>
            </div>
          </div>

          {/* Recent Events Timeline */}
          <div className="mt-8 border border-cyan-500/30 p-6 bg-black/50 rounded-lg relative overflow-hidden">
            <div className="scanlines absolute inset-0"></div>
            <div className="relative z-10">
              <h4 className="text-lg font-bold text-cyan-400 font-mono mb-4">
                RECENT OPERATIONAL EVENTS
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {warData?.events.slice(-10).reverse().map((event, idx) => (
                  <div key={idx} className="border-l-2 border-cyan-500/50 pl-4 pb-3">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-cyan-400 font-mono text-xs">
                        {event.date} {event.time}
                      </span>
                      {event.cost > 0 && (
                        <span className="text-red-400 font-mono text-xs">
                          ${(event.cost / 1_000_000).toFixed(1)}M
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 font-semibold mb-1">
                      {event.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {event.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="mt-8 border border-gray-700 p-6 bg-black/70 rounded-lg">
            <h4 className="text-sm font-bold text-gray-400 font-mono mb-4">EXECUTIVE SUMMARY // OPERATION EPIC FURY</h4>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-red-400 font-mono mb-1">
                  ${totals.totalMunitionsCost.toFixed(1)}B
                </div>
                <div className="text-xs text-gray-500">Munitions Expenditure</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cyber-green font-mono mb-1">
                  ${totals.dailyOperationalCost}M
                </div>
                <div className="text-xs text-gray-500">Daily Operating Cost</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cyber-amber font-mono mb-1">
                  {totals.totalIranCivilian.toLocaleString()}+
                </div>
                <div className="text-xs text-gray-500">Civilian Casualties</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-400 font-mono mb-1">
                  {warData?.events.length || 0}
                </div>
                <div className="text-xs text-gray-500">Major Events Logged</div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
