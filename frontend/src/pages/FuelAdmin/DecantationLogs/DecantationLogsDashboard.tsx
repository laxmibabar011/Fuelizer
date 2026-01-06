import React, { useState, useEffect } from 'react'
import type { AppConfig } from '../../../types/decantation'
import { getDefaultConfig, loadConfig } from '../../../utils/modules/decantination-logs/decantationUtils'
import { DailyDecantationEntry } from './DailyDecantationEntry'
import { DecantationHistory } from './DecantationHistory'
import { DecantationConfiguration } from './DecantationConfiguration'

type Tab = 'daily' | 'history' | 'configure'

export const DecantationLogsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('history')
  const [config, setConfig] = useState<AppConfig>(getDefaultConfig())
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  console.log('DecantationLogsDashboard rendering with config:', config)

  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        console.log('Loading config...')
        const savedConfig = await loadConfig()
        console.log('Loaded config:', savedConfig)
        setConfig(savedConfig || getDefaultConfig())
      } catch (err) {
        console.error('Error loading config:', err)
        setError('Failed to load configuration')
        setConfig(getDefaultConfig())
      }
    }
    loadConfiguration()
  }, [])

  const tabs = [
    { id: 'history', name: 'History', icon: '📊' },
    { id: 'daily', name: 'Daily Entry', icon: '📝' },
    { id: 'configure', name: 'Configure Tables', icon: '⚙️' }
  ]

  const handleConfigChange = (newConfig: AppConfig) => {
    setConfig(newConfig)
  }

  const handleEntrySaved = () => {
    // Trigger refresh of history when an entry is saved
    setRefreshTrigger(prev => prev + 1)
  }

  const renderTabContent = () => {
    try {
      console.log('Rendering tab content for:', activeTab)
      switch (activeTab) {
        case 'daily':
          return <DailyDecantationEntry config={config} onEntrySaved={handleEntrySaved} />
        case 'history':
          return <DecantationHistory config={config} refreshTrigger={refreshTrigger} />
        case 'configure':
          return <DecantationConfiguration config={config} onConfigChange={handleConfigChange} />
        default:
          return <DailyDecantationEntry config={config} />
      }
    } catch (err) {
      console.error('Error rendering tab content:', err)
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800">Error Loading Content</h3>
          <p className="text-red-600 mt-2">There was an error loading this tab. Please try refreshing the page.</p>
          <pre className="mt-4 text-sm text-red-500 bg-red-100 p-3 rounded overflow-auto">
            {err instanceof Error ? err.message : String(err)}
          </pre>
        </div>
      )
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Configuration Error</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">


      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Decantation Logs</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Manage fuel decantation records, tank readings, and operational data
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Decantation Logs System • Track fuel operations and tank readings</p>
            <p className="mt-1">Export data to CSV or print for physical records</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
