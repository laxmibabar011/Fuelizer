import React, { useState, useEffect } from 'react'
import type { AppConfig, AnyTableConfig, MatrixTableConfig } from '../../../types/decantation'
import { DecantationTableConfig } from './DecantationTableConfig'
import { saveConfig } from '../../../utils/modules/decantination-logs/decantationUtils'
import { decantationLogsService } from '../../../services/decantationLogsService'

interface DecantationConfigurationProps {
  config: AppConfig
  onConfigChange: (config: AppConfig) => void
}

export const DecantationConfiguration: React.FC<DecantationConfigurationProps> = ({ 
  config, 
  onConfigChange 
}) => {
  const [workingConfig, setWorkingConfig] = useState<AppConfig>(config)
  const [loading, setLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Update working config when parent config changes
  useEffect(() => {
    setWorkingConfig(config)
  }, [config])

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(config) !== JSON.stringify(workingConfig)
    setHasUnsavedChanges(hasChanges)
  }, [config, workingConfig])

  const handleSave = async () => {
    try {
      setLoading(true)
      
      // Import validation function from utils
      const { validateTableConfig } = await import('../../../utils/modules/decantination-logs/decantationUtils')
      
      // Validate all table configurations
      const validationErrors: string[] = []
      workingConfig.tables.forEach((table, index) => {
        const validation = validateTableConfig(table)
        if (!validation.isValid) {
          validationErrors.push(`Table ${index + 1} (${table.title || 'Untitled'}): ${validation.errors.join(', ')}`)
        }
      })
      
      if (validationErrors.length > 0) {
        alert('Validation failed:\n' + validationErrors.join('\n'))
        return
      }
      
      const normalized = await saveConfig(workingConfig)
      if (normalized) {
        onConfigChange(normalized) // Update parent state with server ids
        setHasUnsavedChanges(false)
        alert('Configuration saved to database successfully!')
      } else {
        alert('Failed to save configuration to database. Please try again.')
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
      alert('Failed to save configuration. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        setWorkingConfig(config) // Revert to saved config
        setHasUnsavedChanges(false)
      }
    }
  }

  const replaceTable = (updated: AnyTableConfig) => {
    setWorkingConfig((prev) => ({
      ...prev,
      tables: prev.tables.map((t) => (t.id === updated.id ? updated : t)),
    }))
  }

  const addMatrixTable = () => {
    const id = `matrix-${Date.now()}`
    const newTable: MatrixTableConfig = {
      id,
      title: 'New Matrix Table',
      kind: 'matrix',
      rows: ['Row 1', 'Row 2', 'Row 3'],
      cols: ['Column 1', 'Column 2'],
    }
    setWorkingConfig((prev) => ({ ...prev, tables: [...prev.tables, newTable] }))
  }

  const removeTable = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      try {
        setLoading(true)
        // Import safe ID conversion helper
        const { safeIdToNumber } = await import('../../../utils/modules/decantination-logs/decantationUtils')
        
        // Soft delete from database (mark as inactive)
        const numericId = safeIdToNumber(id)
        if (numericId !== null) {
          await decantationLogsService.deleteTable(numericId)
        }
        // Remove from local state (this removes it from the UI)
        setWorkingConfig((prev) => ({ ...prev, tables: prev.tables.filter((t) => t.id !== id) }))
        setHasUnsavedChanges(true)
      } catch (error) {
        console.error('Error deleting table:', error)
        alert('Failed to delete table from database. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  // Removed: Export/Import config features as per request

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Add Table button - always visible */}
        <button
          onClick={addMatrixTable}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-md transition-all duration-200"
        >
          Add Table
        </button>

        {/* Save/Cancel buttons - show when there are unsaved changes */}
        {hasUnsavedChanges && (
          <>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 shadow-md transition-all duration-200"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 shadow-md transition-all duration-200"
            >
              Cancel
            </button>
          </>
        )}

        {/* Removed: Export/Import buttons */}
      </div>

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You have unsaved changes. Don't forget to save your configuration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tables Configuration */}
      {!loading && (
        <div className="space-y-6">
          {workingConfig.tables.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No tables configured</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Use the "Add Table" button above to create your first table.</p>
            </div>
          ) : (
            workingConfig.tables.map((tableConfig) => (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <DecantationTableConfig
                key={tableConfig.id}
                config={tableConfig}
                onChange={replaceTable}
                onDelete={() => removeTable(tableConfig.id)}
              />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}