import React, { useState, useMemo, useEffect } from 'react'
import { loadAllEntries, deleteEntry } from '../../../utils/modules/decantination-logs/decantationUtils'
import type { DailyDecantationEntry, AppConfig } from '../../../types/decantation'
import { DecantationEntryModal } from './DecantationEntryModal'

interface DecantationHistoryProps {
  config: AppConfig
  refreshTrigger?: number // Add this to trigger refresh from parent
}

export const DecantationHistory: React.FC<DecantationHistoryProps> = ({ config, refreshTrigger }) => {
  const [entries, setEntries] = useState<DailyDecantationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'date' | 'dateRange' | 'invoice'>('all')
  const [filterValue, setFilterValue] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<DailyDecantationEntry | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const loadedEntries = await loadAllEntries()
        setEntries(loadedEntries)
      } catch (error) {
        console.error('Error loading entries:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [refreshTrigger]) // Add refreshTrigger as dependency

  const filteredEntries = useMemo(() => {
    let filtered = entries

    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.date_id?.includes(searchTerm) ||
        entry.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.load_details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.tt_arrival_time?.includes(searchTerm) ||
        JSON.stringify(entry.table_data).toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    switch (filterType) {
      case 'date':
        if (filterValue) {
          filtered = filtered.filter(entry => entry.date_id === filterValue)
        }
        break
      case 'dateRange':
        if (filterDateFrom && filterDateTo) {
          filtered = filtered.filter(entry => {
            const entryDate = entry.date_id
            return entryDate >= filterDateFrom && entryDate <= filterDateTo
          })
        }
        break
      case 'invoice':
        if (filterValue) {
          filtered = filtered.filter(entry => 
            entry.invoice_no?.toLowerCase().includes(filterValue.toLowerCase()) ||
            JSON.stringify(entry.table_data).toLowerCase().includes(filterValue.toLowerCase())
          )
        }
        break
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(b.date_id).getTime()
      const dateB = new Date(a.date_id).getTime()
      return dateA - dateB
    })
  }, [entries, searchTerm, filterType, filterValue, filterDateFrom, filterDateTo])

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      try {
        setLoading(true)
        const success = await deleteEntry(id)
        if (success) {
          const updatedEntries = await loadAllEntries()
          setEntries(updatedEntries)
          alert('Entry deleted successfully!')
        } else {
          alert('Failed to delete entry. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting entry:', error)
        alert('Failed to delete entry. Please try again.')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleView = (entry: DailyDecantationEntry) => {
    setSelectedEntry(entry)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedEntry(null)
  }

  const handleSaveEntry = async (updatedEntry: DailyDecantationEntry) => {
    // Update the entry in the list
    setEntries(prev => prev.map(entry => 
      entry.id === updatedEntry.id ? updatedEntry : entry
    ))
    setSelectedEntry(updatedEntry)
  }

  const exportCSV = () => {
    const rows: string[] = []
    // Header row with fixed fields + dynamic table names
    const headers = ['Date', 'Invoice No', 'Load Details', 'TT Arrival Time']
    config.tables.forEach(table => headers.push(`${table.title} (Data)`))
    rows.push(headers.join(','))
    
    filteredEntries.forEach(entry => {
      const rowData = [
        entry.date_id || '',
        entry.invoice_no || '',
        entry.load_details || '',
        entry.tt_arrival_time || ''
      ]
      
      // Add table data status for each configured table
      config.tables.forEach(table => {
        const tableData = entry.table_data?.[table.id]
        const hasData = tableData?.values?.some((row: any[]) => row.some((cell: string) => cell.trim() !== ''))
        rowData.push(hasData ? 'Filled' : 'Empty')
      })
      
      rows.push(
        rowData.map((s) => `"${String(s).replace(/"/g, '""')}"`)
          .join(',')
      )
    })

    const csvBlob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(csvBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `decantation-history-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Decantation History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin-bottom: 10px; }
            .header p { color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-filled { background-color: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; }
            .status-empty { background-color: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 4px; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Decantation History Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>Total Records: ${filteredEntries.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice No</th>
                <th>Load Details</th>
                <th>TT Arrival Time</th>
                ${config.tables.map(table => `<th>${table.title}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${filteredEntries.map(entry => `
                <tr>
                  <td>${(() => {
                    const date = new Date(entry.date_id)
                    const day = String(date.getDate()).padStart(2, '0')
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const year = date.getFullYear()
                    return `${day}/${month}/${year}`
                  })()}</td>
                  <td>${entry.invoice_no || '-'}</td>
                  <td>${entry.load_details || '-'}</td>
                  <td>${entry.tt_arrival_time || '-'}</td>
                  ${config.tables.map(table => {
                    const tableData = entry.table_data?.[table.id]
                    const hasData = tableData?.values?.some((row: any[]) => row.some((cell: string) => cell.trim() !== ''))
                    return `<td><span class="${hasData ? 'status-filled' : 'status-empty'}">${hasData ? 'Data Filled' : 'Empty'}</span></td>`
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Decantation Logs System • Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.print()
      printWindow.close()
    }
  }

  const renderFilterInputs = () => {
    switch (filterType) {
      case 'date':
        return (
          <input
            type="date"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        )
      case 'dateRange':
        return (
          <div className="flex gap-2">
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="From"
            />
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              placeholder="To"
            />
          </div>
        )
      case 'invoice':
        return (
          <input
            type="text"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Enter invoice number"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="flex items-center justify-between gap-4">
        {/* Left Side - Search and Filter */}
        <div className="flex items-center gap-4 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice, load details, or date..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* Filter Options */}
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as any)
                setFilterValue('')
                setFilterDateFrom('')
                setFilterDateTo('')
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Records</option>
              <option value="date">By Date</option>
              <option value="dateRange">By Date Range</option>
              <option value="invoice">By Invoice Number</option>
            </select>
            {renderFilterInputs()}
          </div>
        </div>

        {/* Right Side - Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition-all duration-200"
          >
            Export to CSV
          </button>
          <button
            onClick={exportPDF}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-md transition-all duration-200"
          >
            Export to PDF
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredEntries.length} of {entries.length} entries
      </div>

      {/* Dynamic History Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      ) : config.tables.length === 0 ? (
        // Show message when no tables are configured
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No Tables Configured</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure your tables first to start tracking daily entries.</p>
          <div className="mt-6">
            <p className="text-xs text-gray-400 dark:text-gray-500">Go to "Configure Tables" tab to set up your data structure</p>
          </div>
        </div>
      ) : (
        // Show dynamic table based on configured tables
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {/* Fixed header columns */}
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    Invoice No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    Load Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    TT Arrival Time
                  </th>
                  {/* Removed dynamic table columns - only show in View modal */}
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {entries.length === 0 ? 'No records saved yet' : 'No entries found'}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {entries.length === 0 
                          ? 'Records will appear here automatically after you save daily entries' 
                          : 'Try adjusting your search or filter criteria'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    {/* Fixed header fields */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(() => {
                        // Format date as DD/MM/YYYY
                        const date = new Date(entry.date_id)
                        const day = String(date.getDate()).padStart(2, '0')
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        const year = date.getFullYear()
                        return `${day}/${month}/${year}`
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {entry.invoice_no || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {entry.load_details || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {entry.tt_arrival_time || '-'}
                    </td>
                    {/* Removed dynamic table data preview - only show in View modal */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(entry)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-3 py-1 rounded-md transition-colors duration-150"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 px-3 py-1 rounded-md transition-colors duration-150"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-[100000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Entry Details</h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(() => {
                      // Format date consistently as DD/MM/YYYY
                      const date = new Date(selectedEntry.date_id)
                      const day = String(date.getDate()).padStart(2, '0')
                      const month = String(date.getMonth() + 1).padStart(2, '0')
                      const year = date.getFullYear()
                      return `${day}/${month}/${year}`
                    })()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice No</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.invoice_no || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Load Details</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEntry.load_details || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">TT Arrival Time</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedEntry.tt_arrival_time || '-'}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Table Data</h4>
                <div className="space-y-6">
                  {config.tables.map((table) => {
                    const tableData = selectedEntry.table_data?.[table.id]
                    const hasData = tableData?.values?.some((row: any[]) => row.some((cell: string) => cell.trim() !== ''))
                    
                    return (
                      <div key={table.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{table.title}</h5>
                        {hasData ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-300 dark:border-gray-600">
                                  {table.kind === 'matrix' && table.cols?.map((col, index) => (
                                    <th key={index} className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {table.kind === 'matrix' && table.rows?.map((row, rowIndex) => (
                                  <tr key={rowIndex} className="border-b border-gray-200 dark:border-gray-600">
                                    <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">{row}</td>
                                    {table.cols?.map((_, colIndex) => (
                                      <td key={colIndex} className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                        {tableData?.values?.[rowIndex]?.[colIndex] || '-'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No data filled for this table</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing/editing entry details */}
      {showModal && (
        <DecantationEntryModal
          entry={selectedEntry}
          config={config}
          onClose={handleCloseModal}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  )
}
