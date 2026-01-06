export type TableKind = "matrix" | "fixed-columns"

export interface MatrixTableConfig {
  id: string
  title: string
  kind: "matrix"
  rows: string[] // e.g., ["MS", "Power", "HSD TK1", "HSD TK2"]
  cols: string[] // e.g., ["DIP", "STOCK", "TOTAL", "App. Dip", "Final Dip", "Tank Stock (After Final Dip)"]
}

export interface FixedColumnsTableConfig {
  id: string
  title: string
  kind: "fixed-columns"
  rowLabels: string[] // e.g., ["MS", "Power", "HSD"]
  columns: string[] // e.g., ["Density", "Tank Farm No", "Loading Bay"]
  columnsLocked?: boolean
}

export type AnyTableConfig = MatrixTableConfig | FixedColumnsTableConfig

export interface AppConfig {
  version: number
  tables: AnyTableConfig[]
}

export type CellValue = string

export interface MatrixTableData {
  kind: "matrix"
  values: CellValue[][] // rows x cols
}

export interface FixedColumnsTableData {
  kind: "fixed-columns"
  values: CellValue[][] // rowLabels x columns
}

export type AnyTableData = MatrixTableData | FixedColumnsTableData

export interface DailyDecantationEntry {
  id: string
  // Fixed header fields as per new model structure
  date_id: string // YYYY-MM-DD (DATEONLY)
  invoice_no: string // Invoice number (STRING)
  load_details: string // Load details (STRING)
  tt_arrival_time: string // Tanker arrival time (STRING)
  // Configurable table data stored as JSON
  table_data: Record<string, AnyTableData> // Contains all configurable table values
  // Metadata
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export interface DecantationFilter {
  fromDate: string
  toDate: string
  invoiceNo?: string
  tankerNumber?: string
}
