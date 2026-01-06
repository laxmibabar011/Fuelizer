import React, { useState, useEffect } from 'react'
import type { AppConfig, DailyDecantationEntry } from '../../../types/decantation'
import { DecantationTable } from './DecantationTable'
import { decantationLogsService, decantationLogsHelpers } from '../../../services/decantationLogsService'
import { Modal } from '../../../components/ui/modal'

interface DecantationEntryModalProps {
  entry: DailyDecantationEntry | null
  config: AppConfig
  onClose: () => void
  onSave?: (updatedEntry: DailyDecantationEntry) => void
}

export const DecantationEntryModal: React.FC<DecantationEntryModalProps> = ({
  entry,
  config,
  onClose,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DailyDecantationEntry | null>(null)
  const [originalEntry, setOriginalEntry] = useState<DailyDecantationEntry | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (entry) {
      // Create deep copy to ensure original data is preserved
      const entryCopy = JSON.parse(JSON.stringify(entry))
      
      // Ensure time is in 24-hour format when loading
      if (entryCopy.tt_arrival_time) {
        // Import formatting helper
        import('../../../utils/modules/decantination-logs/decantationUtils').then(({ formatTime24Hour }) => {
          const formattedTime = formatTime24Hour(entryCopy.tt_arrival_time)
          entryCopy.tt_arrival_time = formattedTime
          setEditingEntry(entryCopy)
        })
      } else {
        setEditingEntry(entryCopy)
      }
      
      setOriginalEntry(JSON.parse(JSON.stringify(entry))) // Deep copy for original
    }
  }, [entry])

  if (!entry || !editingEntry) return null

  const handleSave = async () => {
    // Import validation function from utils
    const { validateEntry } = await import('../../../utils/modules/decantination-logs/decantationUtils')
    
    // Validate entry
    const validation = validateEntry(editingEntry)
    if (!validation.isValid) {
      alert('Validation failed:\n' + validation.errors.join('\n'))
      return
    }

    try {
      setLoading(true)
      const apiEntry = decantationLogsHelpers.transformEntryToAPI(editingEntry)
      const response = await decantationLogsService.updateEntry(entry.id!, apiEntry)
      
      if (response.success) {
        const updatedEntry = decantationLogsHelpers.transformEntryFromAPI(response.data)
        // Update the original entry with the saved data
        setOriginalEntry(updatedEntry)
        setEditingEntry(updatedEntry)
        onSave?.(updatedEntry)
        setIsEditing(false)
        alert('Entry updated successfully!')
      } else {
        const errorMsg = response.errors ? response.errors.join('\n') : 'Failed to update entry. Please try again.'
        alert(errorMsg)
      }
    } catch (error) {
      console.error('Error updating entry:', error)
      alert('Failed to update entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (originalEntry) {
      // Deep copy to ensure complete revert
      setEditingEntry(JSON.parse(JSON.stringify(originalEntry)))
    }
    setIsEditing(false)
  }


  const updateHeaderField = (field: string, value: string) => {
    setEditingEntry(prev => {
      if (!prev) return prev
      return { ...prev, [field]: value }
    })
  }

  const updateCell = (tableId: string, row: number, col: number, value: string) => {
    setEditingEntry(prev => {
      if (!prev) return prev
      const updated = { ...prev }
      
      // Ensure table_data exists
      if (!updated.table_data) {
        updated.table_data = {}
      }
      
      // Get or create table data
      let tableData = updated.table_data[tableId]
      if (!tableData) {
        // Find the table config to create proper empty data
        const tableConfig = config.tables.find(t => t.id === tableId)
        if (tableConfig) {
          tableData = {
            kind: tableConfig.kind,
            values: tableConfig.kind === 'matrix' 
              ? tableConfig.rows.map(() => tableConfig.cols.map(() => ''))
              : tableConfig.rowLabels.map(() => tableConfig.columns.map(() => ''))
          }
        } else {
          tableData = { kind: 'matrix', values: [] }
        }
      }
      
      // Ensure values array exists
      if (!tableData.values) {
        tableData.values = []
      }
      if (!tableData.values[row]) {
        tableData.values[row] = []
      }
      
      tableData.values[row][col] = value
      updated.table_data[tableId] = { ...tableData }
      
      return updated
    })
  }

  return (
    <Modal isOpen={true} onClose={onClose} className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
      <div className="bg-white dark:bg-gray-800">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isEditing ? 'border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isEditing ? 'Edit' : 'View'} Decantation Entry - {editingEntry.date_id}
            </h2>
            {isEditing && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Editing Mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Fixed Header Fields */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Entry Details</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editingEntry.date_id || ''}
                      onChange={(e) => updateHeaderField('date_id', e.target.value)}
                    />
                  ) : (
                    <div className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 flex items-center">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {(() => {
                          // Format date consistently as DD/MM/YYYY
                          const date = new Date(editingEntry.date_id)
                          const day = String(date.getDate()).padStart(2, '0')
                          const month = String(date.getMonth() + 1).padStart(2, '0')
                          const year = date.getFullYear()
                          return `${day}/${month}/${year}`
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice No</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editingEntry.invoice_no || ''}
                      onChange={(e) => updateHeaderField('invoice_no', e.target.value)}
                    />
                  ) : (
                    <div className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 flex items-center">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {editingEntry.invoice_no || '-'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Load Details</label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editingEntry.load_details || ''}
                      onChange={(e) => updateHeaderField('load_details', e.target.value)}
                    />
                  ) : (
                    <div className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 flex items-center">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {editingEntry.load_details || '-'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TT Arrival Time</label>
                  {isEditing ? (
                    <input
                      type="time"
                      step="60"
                      className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={editingEntry.tt_arrival_time || ''}
                      onChange={(e) => updateHeaderField('tt_arrival_time', e.target.value)}
                    />
                  ) : (
                    <div className="w-full h-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 flex items-center">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {editingEntry.tt_arrival_time || '-'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tables */}
          <div className="space-y-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Table Data</h3>
            {config.tables.map((tableConfig) => {
              const tableData = editingEntry.table_data?.[tableConfig.id] || {
                kind: tableConfig.kind,
                values: tableConfig.kind === 'matrix' 
                  ? tableConfig.rows.map(() => tableConfig.cols.map(() => ''))
                  : tableConfig.rowLabels.map(() => tableConfig.columns.map(() => ''))
              }

              return (
                <div key={tableConfig.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">{tableConfig.title}</h4>
                  <DecantationTable
                    config={tableConfig}
                    data={tableData}
                    onChange={(row, col, value) => updateCell(tableConfig.id, row, col, value)}
                    disabled={!isEditing}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}
