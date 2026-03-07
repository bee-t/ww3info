'use client'

import { useState, useEffect } from 'react'
import { Newspaper, RefreshCw, AlertCircle, ExternalLink, Clock } from 'lucide-react'

interface NewsArticle {
  id: string
  title: string
  description: string
  url: string
  author: string
  image?: string
  language: string
  category: string[]
  published: string
}

interface NewsData {
  news: NewsArticle[]
  status: string
  cached?: boolean
  callsRemaining?: number
  lastUpdated?: string
  error?: string
}

export default function ConflictNews() {
  const [newsData, setNewsData] = useState<NewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchNews = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/news')
      const data = await response.json()
      
      if (response.ok) {
        setNewsData(data)
        setLastRefresh(new Date())
      } else {
        setError(data.error || 'Failed to fetch news')
        // If we have cached data even on error, still show it
        if (data.data) {
          setNewsData(data.data)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNews()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-cyber-amber" />
          <h2 className="text-2xl md:text-3xl font-bold">
            <span className="neon-amber">LIVE CONFLICT MONITORING</span>
          </h2>
        </div>
        
        <button
          onClick={fetchNews}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-cyber-amber/30 bg-black/50 hover:bg-cyber-amber/10 transition-colors rounded font-mono text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          REFRESH
        </button>
      </div>

      {/* Status Bar */}
      <div className="border border-cyber-green/30 p-4 bg-black/50 mb-6 font-mono text-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${newsData?.cached ? 'bg-yellow-500' : 'bg-cyber-green'} animate-pulse`}></div>
              <span className="text-gray-400">
                STATUS: {newsData?.cached ? 'CACHED' : 'LIVE'}
              </span>
            </div>
            {newsData?.callsRemaining !== undefined && (
              <div className="text-gray-400">
                API CALLS REMAINING: <span className="text-cyber-amber">{newsData.callsRemaining}/20</span>
              </div>
            )}
          </div>
          {lastRefresh && (
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-3 h-3" />
              Last updated: {formatDate(lastRefresh.toISOString())}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 p-4 mb-6 rounded flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-red-500 font-semibold">Error Loading News</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !newsData && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-cyber-amber animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono">SCANNING GLOBAL NEWS FEEDS...</p>
        </div>
      )}

      {/* News Grid */}
      {newsData && newsData.news && newsData.news.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsData.news.slice(0, 12).map((article) => (
            <div
              key={article.id || article.url}
              className="border border-cyber-amber/30 bg-black/50 rounded-lg overflow-hidden hover:border-cyber-amber transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,176,0,0.3)] group"
            >
              {article.image && (
                <div className="relative h-48 overflow-hidden bg-gray-900">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                </div>
              )}
              
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  {article.category && article.category.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/30 rounded font-mono">
                      {article.category[0].toUpperCase()}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 font-mono">
                    {formatDate(article.published)}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-100 mb-2 line-clamp-2 group-hover:text-cyber-amber transition-colors">
                  {article.title}
                </h3>
                
                {article.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                    {article.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  {article.author && (
                    <span className="text-xs text-gray-500 font-mono truncate max-w-[60%]">
                      BY: {article.author}
                    </span>
                  )}
                  
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-cyber-amber hover:text-cyber-green transition-colors font-mono"
                  >
                    READ MORE
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No News State */}
      {newsData && newsData.news && newsData.news.length === 0 && !loading && (
        <div className="text-center py-12 border border-gray-800 bg-black/30 rounded">
          <Newspaper className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 font-mono">NO CONFLICT NEWS AVAILABLE</p>
        </div>
      )}
    </section>
  )
}
