import React, { useState } from 'react'
import type { AnyTableConfig, MatrixTableConfig, FixedColumnsTableConfig } from '../../../types/decantation'

interface DecantationTableConfigProps {
  config: AnyTableConfig
  onChange: (updated: AnyTableConfig) => void
  onDelete: () => void
  disabled?: boolean
}

export const DecantationTableConfig: React.FC<DecantationTableConfigProps> = ({
  config,
  onChange,
  onDelete,
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editingConfig, setEditingConfig] = useState<AnyTableConfig>(config)

  const handleEdit = () => {
    setIsEditing(true)
    setEditingConfig(config)
  }

  const handleSave = () => {
    onChange(editingConfig)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditingConfig(config)
    setIsEditing(false)
  }

  const updateTitle = (title: string) => {
    setEditingConfig(prev => ({ ...prev, title }))
  }

  const addRow = () => {
    if (editingConfig.kind === 'matrix') {
      const newRow = `Row ${(editingConfig as MatrixTableConfig).rows.length + 1}`
      setEditingConfig(prev => ({
        ...prev,
        rows: [...(prev as MatrixTableConfig).rows, newRow]
      }))
    } else if (editingConfig.kind === 'fixed-columns') {
      const newRow = `Item ${(editingConfig as FixedColumnsTableConfig).rowLabels.length + 1}`
      setEditingConfig(prev => ({
        ...prev,
        rowLabels: [...(prev as FixedColumnsTableConfig).rowLabels, newRow]
      }))
    }
  }

  const removeRow = (index: number) => {
    if (editingConfig.kind === 'matrix') {
      setEditingConfig(prev => ({
        ...prev,
        rows: (prev as MatrixTableConfig).rows.filter((_: string, i: number) => i !== index)
      }))
    } else if (editingConfig.kind === 'fixed-columns') {
      setEditingConfig(prev => ({
        ...prev,
        rowLabels: (prev as FixedColumnsTableConfig).rowLabels.filter((_: string, i: number) => i !== index)
      }))
    }
  }

  const updateRow = (index: number, value: string) => {
    if (editingConfig.kind === 'matrix') {
      setEditingConfig(prev => ({
        ...prev,
        rows: (prev as MatrixTableConfig).rows.map((row: string, i: number) => i === index ? value : row)
      }))
    } else if (editingConfig.kind === 'fixed-columns') {
      setEditingConfig(prev => ({
        ...prev,
        rowLabels: (prev as FixedColumnsTableConfig).rowLabels.map((row: string, i: number) => i === index ? value : row)
      }))
    }
  }

  const addColumn = () => {
    if (editingConfig.kind === 'matrix') {
      const newCol = `Column ${(editingConfig as MatrixTableConfig).cols.length + 1}`
      setEditingConfig(prev => ({
        ...prev,
        cols: [...(prev as MatrixTableConfig).cols, newCol]
      }))
    } else if (editingConfig.kind === 'fixed-columns') {
      const newCol = `Property ${(editingConfig as FixedColumnsTableConfig).columns.length + 1}`
      setEditingConfig(prev => ({
        ...prev,
        columns: [...(prev as FixedColumnsTableConfig).columns, newCol]
      }))
    }
  }

  const removeColumn = (index: number) => {
    if (editingConfig.kind === 'matrix') {
      setEditingConfig(prev => ({
        ...prev,
        cols: (prev as MatrixTableConfig).cols.filter((_: string, i: number) => i !== index)
      }))
    } else if (editingConfig.kind === 'fixed-columns') {
      setEditingConfig(prev => ({
        ...prev,
        columns: (prev as FixedColumnsTableConfig).columns.filter((_: string, i: number) => i !== index)
      }))
    }
  }

  const updateColumn = (index: number, value: string) => {
    if (editingConfig.kind === 'matrix') {
      setEditingConfig(prev => ({
        ...prev,
        cols: (prev as MatrixTableConfig).cols.map((col: string, i: number) => i === index ? value : col)
      }))
    } else if (editingConfig.kind === 'fixed-columns') {
      setEditingConfig(prev => ({
        ...prev,
        columns: (prev as FixedColumnsTableConfig).columns.map((col: string, i: number) => i === index ? value : col)
      }))
    }
  }

  const renderConfigurationInterface = () => {
    if (editingConfig.kind === 'matrix') {
      const matrixConfig = editingConfig as MatrixTableConfig
      return (
        <div className="grid grid-cols-2 gap-8">
          {/* Left Side - Rows */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Rows</h4>
              {isEditing && (
                <button
                  onClick={addRow}
                  className="px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  + Add Row
                </button>
              )}
            </div>
            <div className="space-y-2">
              {matrixConfig.rows.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row}
                    onChange={(e) => updateRow(index, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Row label"
                                         disabled={!isEditing}
                  />
                  {isEditing && (
                    <button
                      onClick={() => removeRow(index)}
                      className="px-2 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={matrixConfig.rows.length <= 1}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Columns */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Columns</h4>
              {isEditing && (
                <button
                  onClick={addColumn}
                  className="px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  + Add Column
                </button>
              )}
            </div>
            <div className="space-y-2">
              {matrixConfig.cols.map((col, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={col}
                    onChange={(e) => updateColumn(index, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Column label"
                                         disabled={!isEditing}
                  />
                  {isEditing && (
                    <button
                      onClick={() => removeColumn(index)}
                      className="px-2 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={matrixConfig.cols.length <= 1}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (editingConfig.kind === 'fixed-columns') {
      const fixedConfig = editingConfig as FixedColumnsTableConfig
      return (
        <div className="grid grid-cols-2 gap-8">
          {/* Left Side - Row Labels */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Row Labels</h4>
              {isEditing && (
                <button
                  onClick={addRow}
                  className="px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  + Add Row
                </button>
              )}
            </div>
            <div className="space-y-2">
              {fixedConfig.rowLabels.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row}
                    onChange={(e) => updateRow(index, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Row label"
                                         disabled={!isEditing}
                  />
                  {isEditing && (
                    <button
                      onClick={() => removeRow(index)}
                      className="px-2 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={fixedConfig.rowLabels.length <= 1}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Columns */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Columns</h4>
              {isEditing && (
                <button
                  onClick={addColumn}
                  className="px-3 py-1 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  + Add Column
                </button>
              )}
            </div>
            <div className="space-y-2">
              {fixedConfig.columns.map((col, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={col}
                    onChange={(e) => updateColumn(index, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Column label"
                                         disabled={!isEditing}
                  />
                  {isEditing && (
                    <button
                      onClick={() => removeColumn(index)}
                      className="px-2 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={fixedConfig.columns.length <= 1}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editingConfig.title}
                onChange={(e) => updateTitle(e.target.value)}
                className="text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-md"
                placeholder="Enter table title"
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{config.title}</h3>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isEditing ? (
              <>
                <button
                  onClick={handleEdit}
                  disabled={disabled}
                  className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={onDelete}
                  disabled={disabled}
                  className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Interface */}
      <div className="p-6">
        {renderConfigurationInterface()}
      </div>
    </div>
  )
}
