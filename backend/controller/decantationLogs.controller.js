import { sendResponse } from '../util/response.util.js'
import { DecantationLogsRepository } from '../repository/decantationLogs.repository.js'

export default class DecantationLogsController {
  // Table Configuration Methods
  static async createTable(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { title, kind, rows, cols, rowLabels, columns, columnsLocked } = req.body
      
      if (!title || !kind) {
        return sendResponse(res, { 
          success: false, 
          error: 'title and kind are required', 
          status: 400 
        })
      }

      if (kind === 'matrix' && (!rows || !cols)) {
        return sendResponse(res, { 
          success: false, 
          error: 'rows and cols are required for matrix tables', 
          status: 400 
        })
      }

      if (kind === 'fixed-columns' && (!rowLabels || !columns)) {
        return sendResponse(res, { 
          success: false, 
          error: 'rowLabels and columns are required for fixed-columns tables', 
          status: 400 
        })
      }

      const table = await repo.createTable({
        title,
        kind,
        rows: kind === 'matrix' ? rows : null,
        cols: kind === 'matrix' ? cols : null,
        rowLabels: kind === 'fixed-columns' ? rowLabels : null,
        columns: kind === 'fixed-columns' ? columns : null,
        columnsLocked: columnsLocked || false
      })

      return sendResponse(res, { 
        data: table, 
        message: 'Table configuration created', 
        status: 201 
      })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to create table configuration', 
        status: 500 
      })
    }
  }

  static async listTables(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { is_active } = req.query
      
      const filter = {}
      if (typeof is_active !== 'undefined') {
        filter.is_active = (is_active === 'true' || is_active === true)
      }

      const tables = await repo.listTables(filter)
      return sendResponse(res, { data: tables })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch table configurations', 
        status: 500 
      })
    }
  }

  static async getTableById(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { id } = req.params
      
      const table = await repo.getTableById(id)
      if (!table) {
        return sendResponse(res, { 
          success: false, 
          error: 'Table not found', 
          status: 404 
        })
      }

      return sendResponse(res, { data: table })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch table configuration', 
        status: 500 
      })
    }
  }

  static async updateTable(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { id } = req.params
      
      const table = await repo.updateTable(id, req.body)
      if (!table) {
        return sendResponse(res, { 
          success: false, 
          error: 'Table not found', 
          status: 404 
        })
      }

      return sendResponse(res, { 
        data: table, 
        message: 'Table configuration updated' 
      })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to update table configuration', 
        status: 500 
      })
    }
  }

  static async deleteTable(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { id } = req.params
      
      const table = await repo.deleteTable(id)
      if (!table) {
        return sendResponse(res, { 
          success: false, 
          error: 'Table not found', 
          status: 404 
        })
      }

      return sendResponse(res, { 
        data: table, 
        message: 'Table configuration deleted' 
      })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to delete table configuration', 
        status: 500 
      })
    }
  }

  static async restoreTable(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { id } = req.params
      
      const table = await repo.restoreTable(id)
      if (!table) {
        return sendResponse(res, { 
          success: false, 
          error: 'Table not found', 
          status: 404 
        })
      }

      return sendResponse(res, { 
        data: table, 
        message: 'Table configuration restored' 
      })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to restore table configuration', 
        status: 500 
      })
    }
  }

  // Entry Methods
  static async createEntry(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { 
        date_id, 
        invoice_no,
        load_details,
        tt_arrival_time,
        table_data 
      } = req.body

      // Enhanced validation
      const errors = []
      
      if (!date_id?.trim()) {
        errors.push('Date is required')
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date_id)) {
        errors.push('Date must be in YYYY-MM-DD format')
      }

      if (!invoice_no?.trim()) {
        errors.push('Invoice number is required')
      }

      if (!load_details?.trim()) {
        errors.push('Load details are required')
      }

      if (!tt_arrival_time?.trim()) {
        errors.push('TT arrival time is required')
      } else if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(tt_arrival_time)) {
        errors.push('TT arrival time must be in HH:MM format (24-hour)')
      }

      if (errors.length > 0) {
        return sendResponse(res, { 
          success: false, 
          error: 'Validation failed', 
          errors: errors,
          status: 400 
        })
      }

      const entryPayload = {
        date_id,
        invoice_no,
        load_details,
        tt_arrival_time,
        table_data: table_data || {},
        created_by: req.user?.user_id
      }

      const entry = await repo.createEntry(entryPayload)

      return sendResponse(res, { 
        data: entry, 
        message: 'Decantation entry created', 
        status: 201 
      })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to create decantation entry', 
        status: 500 
      })
    }
  }

  static async listEntries(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { 
        date_id, 
        start_date, 
        end_date,
        search 
      } = req.query

      let entries
      if (search) {
        entries = await repo.searchEntries(search, { date_id })
      } else if (start_date && end_date) {
        entries = await repo.getEntriesByDateRange(start_date, end_date)
      } else {
        const filter = {}
        if (date_id) filter.date_id = date_id
        entries = await repo.listEntries(filter)
      }

      return sendResponse(res, { data: entries })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch decantation entries', 
        status: 500 
      })
    }
  }

  static async getEntryById(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { id } = req.params
      
      const entry = await repo.getEntryById(id)
      if (!entry) {
        return sendResponse(res, { 
          success: false, 
          error: 'Entry not found', 
          status: 404 
        })
      }

      return sendResponse(res, { data: entry })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch decantation entry', 
        status: 500 
      })
    }
  }

  static async getEntryByDateId(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { dateId } = req.params
      
      const entry = await repo.getEntryByDateId(dateId)
      if (!entry) {
        return sendResponse(res, { 
          success: false, 
          error: 'Entry not found for this date', 
          status: 404 
        })
      }

      return sendResponse(res, { data: entry })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch decantation entry', 
        status: 500 
      })
    }
  }

  static async updateEntry(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { id } = req.params
      const { 
        date_id, 
        invoice_no,
        load_details,
        tt_arrival_time,
        table_data 
      } = req.body

      // Enhanced validation for updates
      const errors = []
      
      if (date_id !== undefined && !date_id?.trim()) {
        errors.push('Date cannot be empty')
      } else if (date_id && !/^\d{4}-\d{2}-\d{2}$/.test(date_id)) {
        errors.push('Date must be in YYYY-MM-DD format')
      }

      if (invoice_no !== undefined && !invoice_no?.trim()) {
        errors.push('Invoice number cannot be empty')
      }

      if (load_details !== undefined && !load_details?.trim()) {
        errors.push('Load details cannot be empty')
      }

      if (tt_arrival_time !== undefined && !tt_arrival_time?.trim()) {
        errors.push('TT arrival time cannot be empty')
      } else if (tt_arrival_time && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(tt_arrival_time)) {
        errors.push('TT arrival time must be in HH:MM format (24-hour)')
      }

      if (errors.length > 0) {
        return sendResponse(res, { 
          success: false, 
          error: 'Validation failed', 
          errors: errors,
          status: 400 
        })
      }

      const entryPayload = req.body
      entryPayload.updated_by = req.user?.user_id

      const entry = await repo.updateEntry(id, entryPayload)

      if (!entry) {
        return sendResponse(res, { 
          success: false, 
          error: 'Entry not found', 
          status: 404 
        })
      }

      return sendResponse(res, { 
        data: entry, 
        message: 'Decantation entry updated' 
      })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to update decantation entry', 
        status: 500 
      })
    }
  }

  static async deleteEntry(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { id } = req.params
      
      const entry = await repo.deleteEntry(id)
      if (!entry) {
        return sendResponse(res, { 
          success: false, 
          error: 'Entry not found', 
          status: 404 
        })
      }

      return sendResponse(res, { 
        data: entry, 
        message: 'Decantation entry deleted' 
      })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to delete decantation entry', 
        status: 500 
      })
    }
  }

  // Statistics Methods
  static async getEntryStats(req, res) {
    try {
      const repo = new DecantationLogsRepository(req.tenantSequelize)
      const { start_date, end_date } = req.query

      let totalCount
      if (start_date && end_date) {
        totalCount = await repo.getEntryCountByDateRange(start_date, end_date)
      } else {
        totalCount = await repo.getEntryCount()
      }

      return sendResponse(res, { 
        data: { 
          total_entries: totalCount,
          date_range: start_date && end_date ? { start_date, end_date } : null
        } 
      })
    } catch (err) {
      return sendResponse(res, { 
        success: false, 
        error: err.message, 
        message: 'Failed to fetch entry statistics', 
        status: 500 
      })
    }
  }

  // Removed default tables functionality - users will create their own tables
}
