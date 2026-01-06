import api from "./apiClient";

// Types for Decantation Logs
export type TableKind = "matrix" | "fixed-columns";

export type DecantationTableDTO = {
  id?: number;
  title: string;
  kind: TableKind;
  rows?: string[];
  cols?: string[];
  rowLabels?: string[];
  columns?: string[];
  columnsLocked?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DecantationEntryDTO = {
  id?: number;
  date_id: string;
  invoice_no: string; // Required fixed header field
  load_details: string; // Required fixed header field  
  tt_arrival_time: string; // Required fixed header field
  table_data?: Record<string, any>; // All table data stored as JSON
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
};

// Removed DecantationEntryDataDTO - all data is now stored in DecantationEntryDTO.table_data

export type DecantationEntryStatsDTO = {
  total_entries: number;
  date_range?: {
    start_date: string;
    end_date: string;
  };
};

// Table Configuration API calls
export const decantationLogsService = {
  // Table Configuration Methods
  async createTable(tableData: Omit<DecantationTableDTO, 'id' | 'created_at' | 'updated_at'>) {
    const response = await api.post('/api/tenant/decantation-logs/tables', tableData);
    return response.data;
  },

  async listTables(is_active?: boolean) {
    const params = is_active !== undefined ? { is_active: is_active.toString() } : {};
    const response = await api.get('/api/tenant/decantation-logs/tables', { params });
    return response.data;
  },

  async getTableById(id: number) {
    const response = await api.get(`/api/tenant/decantation-logs/tables/${id}`);
    return response.data;
  },

  async updateTable(id: number, tableData: Partial<DecantationTableDTO>) {
    const response = await api.put(`/api/tenant/decantation-logs/tables/${id}`, tableData);
    return response.data;
  },

  async deleteTable(id: number) {
    const response = await api.delete(`/api/tenant/decantation-logs/tables/${id}`);
    return response.data;
  },

  async restoreTable(id: number) {
    const response = await api.patch(`/api/tenant/decantation-logs/tables/${id}/restore`);
    return response.data;
  },

  // Entry Methods
  async createEntry(entryData: Omit<DecantationEntryDTO, 'id' | 'created_at' | 'updated_at'>) {
    const response = await api.post('/api/tenant/decantation-logs/entries', entryData);
    return response.data;
  },

  async listEntries(filters?: {
    date_id?: string;
    invoice_no?: string;
    load_details?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  }) {
    const response = await api.get('/api/tenant/decantation-logs/entries', { params: filters });
    return response.data;
  },

  async getEntryById(id: number | string) {
    const response = await api.get(`/api/tenant/decantation-logs/entries/${id}`);
    return response.data;
  },

  async getEntryByDateId(dateId: string) {
    const response = await api.get(`/api/tenant/decantation-logs/entries/date/${dateId}`);
    return response.data;
  },

  async updateEntry(id: number | string, entryData: Partial<DecantationEntryDTO>) {
    const response = await api.put(`/api/tenant/decantation-logs/entries/${id}`, entryData);
    return response.data;
  },

  async deleteEntry(id: number | string) {
    const response = await api.delete(`/api/tenant/decantation-logs/entries/${id}`);
    return response.data;
  },

  // Statistics Methods
  async getEntryStats(start_date?: string, end_date?: string) {
    const params: Record<string, string> = {};
    if (start_date) params.start_date = start_date;
    if (end_date) params.end_date = end_date;
    const response = await api.get('/api/tenant/decantation-logs/stats', { params });
    return response.data;
  },

  // Removed: createDefaultTables - users create their own tables via Configure Tables tab
};

// Helper functions for data transformation
export const decantationLogsHelpers = {
  // Transform frontend table config to API format
  transformTableConfigToAPI(config: any): DecantationTableDTO {
    return {
      title: config.title,
      kind: config.kind,
      rows: config.kind === 'matrix' ? config.rows : undefined,
      cols: config.kind === 'matrix' ? config.cols : undefined,
      rowLabels: config.kind === 'fixed-columns' ? config.rowLabels : undefined,
      columns: config.kind === 'fixed-columns' ? config.columns : undefined,
      columnsLocked: config.columnsLocked || false
    };
  },

  // Transform API table config to frontend format
  transformTableConfigFromAPI(apiConfig: DecantationTableDTO): any {
    return {
      id: apiConfig.id?.toString(),
      title: apiConfig.title,
      kind: apiConfig.kind,
      rows: apiConfig.rows || [],
      cols: apiConfig.cols || [],
      rowLabels: apiConfig.rowLabels || [],
      columns: apiConfig.columns || [],
      columnsLocked: apiConfig.columnsLocked || false
    };
  },

  // Transform frontend entry to API format
  transformEntryToAPI(entry: any): DecantationEntryDTO {
    return {
      date_id: entry.date_id,
      invoice_no: entry.invoice_no || '',
      load_details: entry.load_details || '',
      tt_arrival_time: entry.tt_arrival_time || '',
      table_data: entry.table_data || {}
    };
  },

  // Transform API entry to frontend format
  transformEntryFromAPI(apiEntry: DecantationEntryDTO): any {
    // Import the time formatting helper
    const formatTime24Hour = (timeString: string): string => {
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
        
        return timeString
      } catch (error) {
        return timeString
      }
    }

    return {
      id: apiEntry.id?.toString(),
      date_id: apiEntry.date_id,
      invoice_no: apiEntry.invoice_no || '',
      load_details: apiEntry.load_details || '',
      tt_arrival_time: formatTime24Hour(apiEntry.tt_arrival_time || ''),
      table_data: apiEntry.table_data || {},
      created_by: apiEntry.created_by,
      updated_by: apiEntry.updated_by,
      created_at: apiEntry.created_at,
      updated_at: apiEntry.updated_at
    };
  },

  // Create empty table data for a given table config
  createEmptyTableData(config: any): any {
    if (config.kind === 'matrix') {
      return {
        kind: 'matrix',
        values: config.rows.map(() => config.cols.map(() => ''))
      };
    } else {
      return {
        kind: 'fixed-columns',
        values: config.rowLabels.map(() => config.columns.map(() => ''))
      };
    }
  }
};
