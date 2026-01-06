import React, { useEffect, useState } from 'react'
import type { AppConfig, AnyTableConfig, AnyTableData } from '../../../types/decantation'
import DecantationTable from './DecantationTable'
import { generateId, loadEntry, saveEntry } from '../../../utils/modules/decantination-logs/decantationUtils'

function emptyDataFor(config: AnyTableConfig): AnyTableData {
  if (config.kind === 'matrix') {
    return {
      kind: 'matrix',
      values: config.rows.map(() => config.cols.map(() => '')),
    }
  }
  return {
    kind: 'fixed-columns',
    values: config.rowLabels.map(() => config.columns.map(() => '')),
  }
}

interface DailyDecantationEntryProps {
  config: AppConfig
  onEntrySaved?: () => void
}

export const DailyDecantationEntry: React.FC<DailyDecantationEntryProps> = ({ config, onEntrySaved }) => {
  const [dateId, setDateId] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [entryData, setEntryData] = useState<any>(() => ({
    id: generateId(),
    date_id: dateId,
    invoice_no: '',
    load_details: '',
    tt_arrival_time: '',
    table_data: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const initializeEntryData = () => {
      // Create empty data for all configured tables
      const tableDataById = Object.fromEntries(
        config.tables.map((t) => [t.id, emptyDataFor(t)])
      )
      
      setEntryData((prev: any) => ({
        ...prev,
        date_id: dateId,
        table_data: tableDataById,
        updated_at: new Date().toISOString()
      }))
    }

    const loadEntryData = async () => {
      try {
        setLoading(true)
        const loaded = await loadEntry(dateId)
        if (loaded) {
          // Merge loaded data with current config structure
          const updatedTableData = { ...(loaded.table_data || {}) }
          
          // Add any new tables from config that weren't in saved data
          config.tables.forEach(table => {
            if (!updatedTableData[table.id]) {
              updatedTableData[table.id] = emptyDataFor(table)
            }
          })
          
          setEntryData({
            ...loaded,
            table_data: updatedTableData
          })
        } else {
          initializeEntryData()
        }
      } catch (error) {
        console.error('Error loading entry:', error)
        initializeEntryData()
      } finally {
        setLoading(false)
      }
    }

    if (config.tables.length > 0) {
      loadEntryData()
    } else {
      // No tables configured yet
      setEntryData((prev: any) => ({
        ...prev,
        date_id: dateId,
        table_data: {},
        updated_at: new Date().toISOString()
      }))
    }
  }, [dateId, config.tables])

  function updateCell(tableId: string, r: number, c: number, v: string) {
    setEntryData((prev: any) => {
      const next = { ...prev }
      const t = next.table_data[tableId]
      if (t && (t.kind === 'matrix' || t.kind === 'fixed-columns')) {
        t.values[r][c] = v
        next.table_data[tableId] = t
      }
      next.updated_at = new Date().toISOString()
      return next
    })
  }

  function updateHeaderField(field: string, value: string) {
    setEntryData((prev: any) => {
      // Ensure time is always in 24-hour format
      if (field === 'tt_arrival_time' && value) {
        // Import formatting helper and format time
        import('../../../utils/modules/decantination-logs/decantationUtils').then(({ formatTime24Hour }) => {
          const formattedTime = formatTime24Hour(value)
          setEntryData((current: any) => ({
            ...current,
            [field]: formattedTime,
            updated_at: new Date().toISOString()
          }))
        })
        return prev
      }
      
      return {
        ...prev,
        [field]: value,
        updated_at: new Date().toISOString()
      }
    })
  }


  async function handleSave() {
    // Import validation function from utils
    const { validateEntry } = await import('../../../utils/modules/decantination-logs/decantationUtils')
    
    // Validate entry
    const validation = validateEntry(entryData)
    if (!validation.isValid) {
      alert('Validation failed:\n' + validation.errors.join('\n'))
      return
    }

    try {
      setLoading(true)
      const success = await saveEntry(entryData)
      if (success) {
        alert('Decantation entry saved successfully!')
        onEntrySaved?.() // Trigger refresh of history
      } else {
        alert('Failed to save entry. Please try again.')
      }
    } catch (error) {
      console.error('Error saving entry:', error)
      alert('Failed to save entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    const emptyTables = Object.fromEntries(config.tables.map((t) => [t.id, emptyDataFor(t)]))
    setEntryData({
      id: generateId(),
      date_id: dateId,
      invoice_no: '',
      load_details: '',
      tt_arrival_time: '',
      table_data: emptyTables,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }


  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Show message when no tables are configured
  if (config.tables.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Tables Configured</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Please configure your tables first to start daily entry.</p>
        <div className="mt-6">
          <p className="text-xs text-gray-400 dark:text-gray-500">Go to "Configure Tables" tab to create your table structure</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Fixed Header Fields */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Entry Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="entry-date">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="entry-date"
              type="date"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={dateId}
              onChange={(e) => setDateId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="invoice-no">
              Invoice No <span className="text-red-500">*</span>
            </label>
            <input
              id="invoice-no"
              type="text"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={entryData.invoice_no || ''}
              onChange={(e) => updateHeaderField('invoice_no', e.target.value)}
              placeholder="Enter invoice number"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="load-details">
              Load Details <span className="text-red-500">*</span>
            </label>
            <input
              id="load-details"
              type="text"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={entryData.load_details || ''}
              onChange={(e) => updateHeaderField('load_details', e.target.value)}
              placeholder="Enter load details"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="tt-arrival-time">
              TT Arrival Time <span className="text-red-500">*</span>
            </label>
            <input
              id="tt-arrival-time"
              type="time"
              step="60"
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={entryData.tt_arrival_time || ''}
              onChange={(e) => updateHeaderField('tt_arrival_time', e.target.value)}
              required
            />
          </div>
        </div>
      </div>



      {/* Data Tables */}
      <div className="space-y-8">
        {config.tables.map((t) => (
          <section key={t.id} className="space-y-3">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-4">{t.title}</h3>
              <DecantationTable
                config={t}
                data={entryData.table_data?.[t.id] ?? emptyDataFor(t)}
                onChange={(r: number, c: number, v: string) => updateCell(t.id, r, c, v)}
              />
            </div>
          </section>
        ))}
      </div>

      {/* Action Buttons at Bottom */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Clear All
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-600 rounded-md hover:bg-blue-700 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Entry'}
        </button>
      </div>
    </div>
  )
}
