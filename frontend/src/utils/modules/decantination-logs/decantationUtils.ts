import type { AppConfig, DailyDecantationEntry, AnyTableConfig, AnyTableData } from '../../../types/decantation'
import { decantationLogsService, decantationLogsHelpers } from '../../../services/decantationLogsService'

const CONFIG_KEY = 'decantation-config'
const ENTRIES_KEY = 'decantation-entries'

// Helper to create empty data for a given table config
export function createEmptyDataForConfig(config: AnyTableConfig): AnyTableData {
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

// Default configuration for decantation logs - empty by default
export function getDefaultConfig(): AppConfig {
  return {
    version: 3, // Increment version to clear existing configs
    tables: [], // Start with empty tables - user will add their own
  }
}

export async function loadConfig(): Promise<AppConfig | null> {
  try {
    // Try to load from API first
    const response = await decantationLogsService.listTables(true)
    if (response.success && response.data && response.data.length > 0) {
      const tables = response.data.map((table: any) => decantationLogsHelpers.transformTableConfigFromAPI(table))
      const apiConfig = {
        version: 3,
        tables
      }
      // Save to localStorage as backup
      localStorage.setItem(CONFIG_KEY, JSON.stringify(apiConfig))
      return apiConfig
    }
    
    // If API returns empty, check localStorage
    const item = localStorage.getItem(CONFIG_KEY)
    if (item) {
      const savedConfig: AppConfig = JSON.parse(item)
      // Clear localStorage if version is outdated
      if (savedConfig.version < getDefaultConfig().version) {
        console.warn('Config version outdated, clearing localStorage and using default config.')
        localStorage.removeItem(CONFIG_KEY)
        return getDefaultConfig()
      }
      return savedConfig
    }
  } catch (error) {
    console.error('Error loading config from API:', error)
    // On API error, try localStorage as fallback
    try {
      const cached = localStorage.getItem(CONFIG_KEY)
      if (cached) {
        const savedConfig: AppConfig = JSON.parse(cached)
        console.log('Using cached config from localStorage due to API error')
        return savedConfig
      }
    } catch (localError) {
      console.error('Error parsing cached config:', localError)
    }
  }
  return getDefaultConfig()
}

// Saves config to API and returns the normalized config with server IDs
export async function saveConfig(config: AppConfig): Promise<AppConfig | null> {
  try {
    // Normalize: create or update, and ensure local IDs match server IDs
    const updatedTables: AnyTableConfig[] = []

    for (const table of config.tables) {
      const apiTable = decantationLogsHelpers.transformTableConfigToAPI(table)
      const numericId = Number(table.id)
      if (table.id && !Number.isNaN(numericId)) {
        const updated = await decantationLogsService.updateTable(numericId, apiTable)
        if (updated.success && updated.data) {
          updatedTables.push(decantationLogsHelpers.transformTableConfigFromAPI(updated.data))
        } else {
          updatedTables.push(table)
        }
      } else {
        const created = await decantationLogsService.createTable(apiTable)
        if (created.success && created.data) {
          updatedTables.push(decantationLogsHelpers.transformTableConfigFromAPI(created.data))
        } else {
          updatedTables.push(table)
        }
      }
    }

    const normalized: AppConfig = { ...config, tables: updatedTables }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(normalized))
    return normalized
  } catch (error) {
    console.error('Error saving config to API, falling back to localStorage', error)
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
      return config
    } catch (localError) {
      console.error('Error saving config to localStorage', localError)
      return null
    }
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export async function loadAllEntries(): Promise<DailyDecantationEntry[]> {
  try {
    // Try to load from API first
    const response = await decantationLogsService.listEntries()
    if (response.success && response.data) {
      const entries = response.data.map((entry: any) => decantationLogsHelpers.transformEntryFromAPI(entry))
      // Cache to localStorage as backup
      localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
      return entries
    }
    
    // Fallback to localStorage if API fails
    const item = localStorage.getItem(ENTRIES_KEY)
    return item ? JSON.parse(item) : []
  } catch (error) {
    console.error('Error loading entries from API:', error)
    // Fallback to localStorage on error
    try {
      const item = localStorage.getItem(ENTRIES_KEY)
      return item ? JSON.parse(item) : []
    } catch (localError) {
      console.error('Error loading entries from localStorage:', localError)
      return []
    }
  }
}

export function saveAllEntries(entries: DailyDecantationEntry[]) {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
  } catch (error) {
    console.error('Error saving entries to localStorage', error)
  }
}

// Load entry by dateId (YYYY-MM-DD)
export async function loadEntry(dateId: string): Promise<DailyDecantationEntry | null> {
  try {
    // Try to load by dateId first from API
    const response = await decantationLogsService.getEntryByDateId(dateId)
    if (response.success && response.data) {
      return decantationLogsHelpers.transformEntryFromAPI(response.data)
    }
    
    // Fallback to localStorage
    const entries = await loadAllEntries()
    return entries.find((entry) => entry.date_id === dateId) || null
  } catch (error) {
    console.error('Error loading entry from API, falling back to localStorage', error)
    const entries = await loadAllEntries()
    return entries.find((entry) => entry.date_id === dateId) || null
  }
}

// Fixed save entry logic - check if entry exists by date_id and update/create accordingly
export async function saveEntry(entry: DailyDecantationEntry): Promise<boolean> {
  try {
    // First check if an entry exists for this date_id
    const existingEntry = await loadEntry(entry.date_id)
    const apiEntry = decantationLogsHelpers.transformEntryToAPI(entry)
    
    let response
    if (existingEntry && existingEntry.id) {
      // Update existing entry
      const numericId = Number(existingEntry.id)
      if (!Number.isNaN(numericId)) {
        response = await decantationLogsService.updateEntry(numericId, apiEntry)
      } else {
        // Fallback to create if ID is invalid
        response = await decantationLogsService.createEntry(apiEntry)
      }
    } else {
      // Create new entry
      response = await decantationLogsService.createEntry(apiEntry)
    }
    
    if (response.success && response.data) {
      // Update the entry with the server-generated ID
      entry.id = response.data.id?.toString()
      
      // Update localStorage cache
      const entries = await loadAllEntries()
      const index = entries.findIndex((e) => e.date_id === entry.date_id)
      if (index > -1) {
        entries[index] = { ...entry, updated_at: new Date().toISOString() }
      } else {
        entries.push({ ...entry, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      }
      saveAllEntries(entries)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error saving entry to API, falling back to localStorage', error)
    try {
      const entries = await loadAllEntries()
      const index = entries.findIndex((e) => e.date_id === entry.date_id)
      if (index > -1) {
        entries[index] = { ...entry, updated_at: new Date().toISOString() }
      } else {
        entries.push({ ...entry, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      }
      saveAllEntries(entries)
      return true
    } catch (localError) {
      console.error('Error saving entry to localStorage', localError)
      return false
    }
  }
}

export async function deleteEntry(id: string): Promise<boolean> {
  try {
    // Try to delete from API first
    const numericId = Number(id)
    if (!Number.isNaN(numericId)) {
      await decantationLogsService.deleteEntry(numericId)
    }
    
    // Also delete from localStorage cache
    const entries = await loadAllEntries()
    const filteredEntries = entries.filter((entry) => entry.id !== id)
    saveAllEntries(filteredEntries)
    return true
  } catch (error) {
    console.error('Error deleting entry from API, falling back to localStorage', error)
    try {
      const entries = await loadAllEntries()
      const filteredEntries = entries.filter((entry) => entry.id !== id)
      saveAllEntries(filteredEntries)
      return true
    } catch (localError) {
      console.error('Error deleting entry from localStorage', localError)
      return false
    }
  }
}

// Validation helpers
export function validateEntry(entry: Partial<DailyDecantationEntry>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!entry.date_id?.trim()) {
    errors.push('Date is required')
  }
  
  if (!entry.invoice_no?.trim()) {
    errors.push('Invoice number is required')
  }
  
  if (!entry.load_details?.trim()) {
    errors.push('Load details are required')
  }
  
  if (!entry.tt_arrival_time?.trim()) {
    errors.push('TT arrival time is required')
  }
  
  // Validate date format (YYYY-MM-DD)
  if (entry.date_id && !/^\d{4}-\d{2}-\d{2}$/.test(entry.date_id)) {
    errors.push('Date must be in YYYY-MM-DD format')
  }
  
  // Validate time format (HH:MM)
  if (entry.tt_arrival_time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(entry.tt_arrival_time)) {
    errors.push('Time must be in HH:MM format (24-hour)')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateTableConfig(config: Partial<AnyTableConfig>): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!config.title?.trim()) {
    errors.push('Table title is required')
  }
  
  if (!config.kind) {
    errors.push('Table kind is required')
  }
  
  if (config.kind === 'matrix') {
    if (!config.rows || config.rows.length === 0) {
      errors.push('Matrix tables must have at least one row')
    }
    if (!config.cols || config.cols.length === 0) {
      errors.push('Matrix tables must have at least one column')
    }
  }
  
  if (config.kind === 'fixed-columns') {
    if (!config.rowLabels || config.rowLabels.length === 0) {
      errors.push('Fixed-columns tables must have at least one row label')
    }
    if (!config.columns || config.columns.length === 0) {
      errors.push('Fixed-columns tables must have at least one column')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Helper function to safely convert string ID to number for API calls
export function safeIdToNumber(id: string | number): number | null {
  if (typeof id === 'number') return id
  const num = Number(id)
  return Number.isNaN(num) ? null : num
}

// Helper function to format date consistently as DD/MM/YYYY
export function formatDateDDMMYYYY(dateString: string): string {
  try {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}

// Helper function to validate and format time in 24-hour format
export function formatTime24Hour(timeString: string): string {
  try {
    // If it's already in HH:MM 24-hour format, return as is
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
      return timeString
    }
    
    // Handle 12-hour format (e.g., "03:12 PM", "11:30 AM")
    const ampmMatch = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10)
      const minutes = parseInt(ampmMatch[2], 10)
      const period = ampmMatch[3].toUpperCase()
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12
      } else if (period === 'AM' && hours === 12) {
        hours = 0
      }
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }
    
    // Try to parse as HH:MM without AM/PM
    const [hours, minutes] = timeString.split(':')
    const h = parseInt(hours, 10)
    const m = parseInt(minutes, 10)
    
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }
    
    return timeString
  } catch (error) {
    console.error('Error formatting time:', error)
    return timeString
  }
}