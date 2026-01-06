import { initDecantationLogsModels } from '../models/decantationLogs.model.js'

export class DecantationLogsRepository {
  constructor(sequelize) {
    this.models = initDecantationLogsModels(sequelize)
    this.sequelize = sequelize
  }

  // Table Configuration Methods
  async createTable(payload) {
    return this.models.DecantationTable.create(payload)
  }

  async listTables(filter = {}) {
    const where = { ...filter }
    if (typeof where.is_active === 'undefined') {
      where.is_active = true
    }
    return this.models.DecantationTable.findAll({ 
      where, 
      order: [['id', 'ASC']] 
    })
  }

  async getTableById(id) {
    return this.models.DecantationTable.findByPk(id)
  }

  async updateTable(id, patch) {
    const table = await this.getTableById(id)
    if (!table) return null
    await table.update(patch)
    return table
  }

  async deleteTable(id) {
    const table = await this.getTableById(id)
    if (!table) return null
    await table.update({ is_active: false }) // Soft delete - mark as inactive
    return table
  }

  async restoreTable(id) {
    const table = await this.getTableById(id)
    if (!table) return null
    await table.update({ is_active: true })
    return table
  }

  // Entry Methods
  async createEntry(payload) {
    return this.models.DecantationEntry.create(payload)
  }

  async listEntries(filter = {}) {
    const where = { ...filter }
    return this.models.DecantationEntry.findAll({ 
      where,
      order: [['date_id', 'DESC'], ['created_at', 'DESC']]
    })
  }

  async getEntryById(id) {
    return this.models.DecantationEntry.findByPk(id)
  }

  async getEntryByDateId(dateId) {
    return this.models.DecantationEntry.findOne({
      where: { date_id: dateId }
    })
  }

  async updateEntry(id, patch) {
    const entry = await this.getEntryById(id)
    if (!entry) return null
    await entry.update(patch)
    return entry
  }

  async deleteEntry(id) {
    const entry = await this.getEntryById(id)
    if (!entry) return null
    await entry.destroy()
    return entry
  }

  // Simplified - all data is now in the main entry table

  // Search and Filter Methods
  async searchEntries(searchTerm, filters = {}) {
    const where = { ...filters }
    const { Op } = this.sequelize
    
    if (searchTerm) {
      // Search across all text fields including table_data JSON
      where[Op.or] = [
        { invoice_no: { [Op.iLike]: `%${searchTerm}%` } },
        { load_details: { [Op.iLike]: `%${searchTerm}%` } },
        { tt_arrival_time: { [Op.iLike]: `%${searchTerm}%` } },
        { date_id: { [Op.iLike]: `%${searchTerm}%` } },
        // Search within JSON table_data field (PostgreSQL specific)
        this.sequelize.where(
          this.sequelize.cast(this.sequelize.col('table_data'), 'text'),
          { [Op.iLike]: `%${searchTerm}%` }
        )
      ]
    }
    
    return this.listEntries(where)
  }

  async getEntriesByDateRange(startDate, endDate) {
    const { Op } = this.sequelize
    return this.models.DecantationEntry.findAll({
      where: {
        date_id: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['date_id', 'DESC']]
    })
  }

  // Statistics Methods
  async getEntryCount() {
    return this.models.DecantationEntry.count()
  }

  async getEntryCountByDateRange(startDate, endDate) {
    const { Op } = this.sequelize
    return this.models.DecantationEntry.count({
      where: {
        date_id: {
          [Op.between]: [startDate, endDate]
        }
      }
    })
  }
}
