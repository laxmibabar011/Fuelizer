import React from 'react'
import type { AnyTableConfig, AnyTableData } from '../../../types/decantation'

interface DecantationTableProps {
  config: AnyTableConfig
  data: AnyTableData
  onChange: (row: number, col: number, value: string) => void
  disabled?: boolean
}

export const DecantationTable: React.FC<DecantationTableProps> = ({
  config,
  data,
  onChange,
  disabled = false
}) => {
  if (config.kind === 'matrix' && data.kind === 'matrix') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200"></th>
              {config.cols.map((col: string) => (
                <th key={col} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {config.rows.map((rowLabel: string, rowIdx: number) => (
              <tr key={rowLabel} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 whitespace-nowrap">
                  {rowLabel}
                </th>
                {config.cols.map((colLabel: string, colIdx: number) => (
                  <td key={colLabel} className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      value={data.values?.[rowIdx]?.[colIdx] || ''}
                      onChange={(e) => onChange(rowIdx, colIdx, e.target.value)}
                      disabled={disabled}
                      placeholder="Enter value"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (config.kind === 'fixed-columns' && data.kind === 'fixed-columns') {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200"></th>
              {config.columns.map((col: string) => (
                <th key={col} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {config.rowLabels.map((rowLabel: string, rowIdx: number) => (
              <tr key={rowLabel} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 whitespace-nowrap">
                  {rowLabel}
                </th>
                {config.columns.map((colLabel: string, colIdx: number) => (
                  <td key={colLabel} className="border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-800">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      value={data.values?.[rowIdx]?.[colIdx] || ''}
                      onChange={(e) => onChange(rowIdx, colIdx, e.target.value)}
                      disabled={disabled}
                      placeholder="Enter value"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return null
}

export default DecantationTable
