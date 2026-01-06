import { initLedgerModels } from '../models/ledger.model.js'
import { Op } from 'sequelize'

export class LedgerRepository {
  constructor(sequelize) {
    // Initialize all ledger models
    const { LedgerAccount, JournalVoucher, JournalEntry } = initLedgerModels(sequelize)
    this.LedgerAccount = LedgerAccount
    this.JournalVoucher = JournalVoucher
    this.JournalEntry = JournalEntry
    this.sequelize = sequelize // Store sequelize instance for transactions
  }

  // --- Chart of Accounts Management ---

  /**
   * Create a new ledger account
   * @param {Object} accountData - Account data
   * @returns {Promise<Object>} Created account
   */
  async createAccount(accountData) {
    return this.LedgerAccount.create(accountData)
  }

  /**
   * List all accounts with optional filtering
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Array>} List of accounts
   */
  async listAccounts(filter = {}) {
    const where = {}
    
    if (filter.account_type) where.account_type = filter.account_type
    if (filter.status) where.status = filter.status
    if (filter.is_system_account !== undefined) where.is_system_account = filter.is_system_account
    
    return this.LedgerAccount.findAll({
      where,
      order: [['account_type', 'ASC'], ['name', 'ASC']]
    })
  }

  /**
   * Get account by ID
   * @param {number} id - Account ID
   * @returns {Promise<Object|null>} Account or null
   */
  async getAccountById(id) {
    return this.LedgerAccount.findByPk(id)
  }

  /**
   * Update account
   * @param {number} id - Account ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object|null>} Updated account or null
   */
  async updateAccount(id, updates) {
    const account = await this.getAccountById(id)
    if (!account) return null
    
    // Prevent updating system accounts' critical fields
    if (account.is_system_account) {
      const { name, account_type, is_system_account, ...allowedUpdates } = updates
      await account.update(allowedUpdates)
    } else {
      await account.update(updates)
    }
    
    return account
  }

  /**
   * Delete account (soft delete for system accounts, prevent if has entries)
   * @param {number} id - Account ID
   * @returns {Promise<number>} Number of affected rows
   */
  async deleteAccount(id) {
    const account = await this.getAccountById(id)
    if (!account) return 0

    // Check if account is a system account
    if (account.is_system_account) {
      throw new Error('Cannot delete system account')
    }

    // Check if account has journal entries
    const entryCount = await this.JournalEntry.count({
      where: { ledger_account_id: id }
    })

    if (entryCount > 0) {
      throw new Error('Cannot delete account with existing journal entries. Set status to inactive instead.')
    }

    await account.destroy()
    return 1
  }

  // --- Voucher Management ---

  /**
   * Create voucher with journal entries in a transaction
   * @param {Object} voucherData - Voucher data
   * @param {Array} entries - Journal entries
   * @returns {Promise<Object>} Created voucher with entries
   */
  async createVoucherWithEntries(voucherData, entries) {
    // Validate voucher balance before creating
    const isBalanced = await this.validateVoucherBalance(entries)
    if (!isBalanced.valid) {
      throw new Error(`Voucher does not balance: ${isBalanced.message}`)
    }

    const t = await this.sequelize.transaction()
    try {
      // Create the voucher
      const voucher = await this.JournalVoucher.create(voucherData, { transaction: t })

      // Create journal entries
      const journalEntries = []
      for (const entryData of entries) {
        const entry = await this.JournalEntry.create({
          ...entryData,
          voucher_id: voucher.id
        }, { transaction: t })
        journalEntries.push(entry)
      }

      await t.commit()

      // Return voucher with entries
      return {
        ...voucher.toJSON(),
        entries: journalEntries
      }
    } catch (error) {
      await t.rollback()
      throw error
    }
  }

  /**
   * List vouchers with optional filtering
   * @param {Object} filter - Filter criteria
   * @returns {Promise<Array>} List of vouchers
   */
  async listVouchers(filter = {}) {
    const where = {}
    
    if (filter.voucher_type) where.voucher_type = filter.voucher_type
    if (filter.status) where.status = filter.status
    if (filter.created_by_id) where.created_by_id = filter.created_by_id
    
    // Date range filtering
    if (filter.date_from && filter.date_to) {
      where.date = {
        [Op.between]: [filter.date_from, filter.date_to]
      }
    } else if (filter.date_from) {
      where.date = {
        [Op.gte]: filter.date_from
      }
    } else if (filter.date_to) {
      where.date = {
        [Op.lte]: filter.date_to
      }
    } else if (filter.date) {
      where.date = filter.date
    }

    return this.JournalVoucher.findAll({
      where,
      include: [
        {
          model: this.JournalEntry,
          as: 'entries',
          include: [
            {
              model: this.LedgerAccount,
              as: 'account',
              attributes: ['id', 'name', 'account_type']
            }
          ]
        }
      ],
      order: [['date', 'DESC'], ['id', 'DESC']]
    })
  }

  /**
   * Get voucher by ID with entries
   * @param {number} id - Voucher ID
   * @returns {Promise<Object|null>} Voucher with entries or null
   */
  async getVoucherById(id) {
    return this.JournalVoucher.findByPk(id, {
      include: [
        {
          model: this.JournalEntry,
          as: 'entries',
          include: [
            {
              model: this.LedgerAccount,
              as: 'account',
              attributes: ['id', 'name', 'account_type']
            }
          ]
        }
      ]
    })
  }

  /**
   * Cancel voucher (mark as cancelled)
   * @param {number} id - Voucher ID
   * @returns {Promise<Object|null>} Updated voucher or null
   */
  async cancelVoucher(id) {
    const voucher = await this.getVoucherById(id)
    if (!voucher) return null

    if (voucher.status === 'Cancelled') {
      throw new Error('Voucher is already cancelled')
    }

    await voucher.update({ status: 'Cancelled' })
    return voucher
  }

  // --- Balance Calculations ---

  /**
   * Get account balance as of a specific date
   * @param {number} accountId - Account ID
   * @param {string|null} asOfDate - Date in YYYY-MM-DD format (null for current)
   * @returns {Promise<Object>} Balance information
   */
  async getAccountBalance(accountId, asOfDate = null) {
    const account = await this.getAccountById(accountId)
    if (!account) {
      throw new Error('Account not found')
    }

    const where = {
      ledger_account_id: accountId
    }

    // Add date filter if specified
    if (asOfDate) {
      where['$voucher.date$'] = {
        [Op.lte]: asOfDate
      }
    }

    // Only include entries from posted vouchers
    where['$voucher.status$'] = 'Posted'

    const entries = await this.JournalEntry.findAll({
      where,
      include: [
        {
          model: this.JournalVoucher,
          as: 'voucher',
          attributes: ['date', 'status']
        }
      ]
    })

    let totalDebits = 0
    let totalCredits = 0

    entries.forEach(entry => {
      totalDebits += parseFloat(entry.debit_amount || 0)
      totalCredits += parseFloat(entry.credit_amount || 0)
    })

    // Calculate balance based on account type
    let balance = 0
    let balanceType = 'Debit'

    // For Asset, Expense accounts: Debit balance is positive
    if (['Asset', 'Direct Expense', 'Indirect Expense'].includes(account.account_type)) {
      balance = totalDebits - totalCredits
      balanceType = balance >= 0 ? 'Debit' : 'Credit'
    } 
    // For Liability, Customer, Vendor accounts: Credit balance is positive
    else if (['Liability', 'Customer', 'Vendor'].includes(account.account_type)) {
      balance = totalCredits - totalDebits
      balanceType = balance >= 0 ? 'Credit' : 'Debit'
    }
    // For Bank accounts: Can be either
    else if (account.account_type === 'Bank') {
      balance = totalDebits - totalCredits
      balanceType = balance >= 0 ? 'Debit' : 'Credit'
    }

    return {
      account_id: accountId,
      account_name: account.name,
      account_type: account.account_type,
      total_debits: totalDebits,
      total_credits: totalCredits,
      balance: Math.abs(balance),
      balance_type: balanceType,
      as_of_date: asOfDate || new Date().toISOString().split('T')[0]
    }
  }

  /**
   * Generate trial balance for all accounts
   * @param {string|null} asOfDate - Date in YYYY-MM-DD format (null for current)
   * @returns {Promise<Object>} Trial balance report
   */
  async getTrialBalance(asOfDate = null) {
    const accounts = await this.listAccounts({ status: 'active' })
    const balances = []
    let totalDebits = 0
    let totalCredits = 0

    for (const account of accounts) {
      const balance = await this.getAccountBalance(account.id, asOfDate)
      
      // Only include accounts with non-zero balances
      if (balance.balance > 0) {
        balances.push(balance)
        
        if (balance.balance_type === 'Debit') {
          totalDebits += balance.balance
        } else {
          totalCredits += balance.balance
        }
      }
    }

    return {
      as_of_date: asOfDate || new Date().toISOString().split('T')[0],
      accounts: balances,
      total_debits: totalDebits,
      total_credits: totalCredits,
      is_balanced: Math.abs(totalDebits - totalCredits) < 0.01 // Allow for rounding differences
    }
  }

  // --- Validation Methods ---

  /**
   * Validate that voucher entries balance (debits = credits)
   * @param {Array} entries - Journal entries
   * @returns {Promise<Object>} Validation result
   */
  async validateVoucherBalance(entries) {
    if (!entries || entries.length === 0) {
      return {
        valid: false,
        message: 'Voucher must have at least one journal entry'
      }
    }

    let totalDebits = 0
    let totalCredits = 0

    for (const entry of entries) {
      const debitAmount = parseFloat(entry.debit_amount || 0)
      const creditAmount = parseFloat(entry.credit_amount || 0)

      // Validate that entry has either debit OR credit (not both, not neither)
      if (debitAmount > 0 && creditAmount > 0) {
        return {
          valid: false,
          message: 'Journal entry cannot have both debit and credit amounts'
        }
      }

      if (debitAmount === 0 && creditAmount === 0) {
        return {
          valid: false,
          message: 'Journal entry must have either debit or credit amount'
        }
      }

      totalDebits += debitAmount
      totalCredits += creditAmount
    }

    const difference = Math.abs(totalDebits - totalCredits)
    const isBalanced = difference < 0.01 // Allow for rounding differences

    return {
      valid: isBalanced,
      total_debits: totalDebits,
      total_credits: totalCredits,
      difference: difference,
      message: isBalanced 
        ? 'Voucher is balanced' 
        : `Debits (₹${totalDebits.toFixed(2)}) do not equal Credits (₹${totalCredits.toFixed(2)}). Difference: ₹${difference.toFixed(2)}`
    }
  }

  /**
   * Validate system-wide account integrity
   * @returns {Promise<Object>} Integrity check result
   */
  async validateAccountIntegrity() {
    const trialBalance = await this.getTrialBalance()
    
    const issues = []
    
    // Check if trial balance balances
    if (!trialBalance.is_balanced) {
      issues.push({
        type: 'TRIAL_BALANCE_IMBALANCE',
        message: `Trial balance does not balance. Debits: ₹${trialBalance.total_debits.toFixed(2)}, Credits: ₹${trialBalance.total_credits.toFixed(2)}`
      })
    }

    // Check for vouchers with imbalanced entries
    const vouchers = await this.JournalVoucher.findAll({
      where: { status: 'Posted' },
      include: [
        {
          model: this.JournalEntry,
          as: 'entries'
        }
      ]
    })

    for (const voucher of vouchers) {
      const validation = await this.validateVoucherBalance(voucher.entries)
      if (!validation.valid) {
        issues.push({
          type: 'VOUCHER_IMBALANCE',
          voucher_id: voucher.id,
          voucher_number: voucher.voucher_number,
          message: validation.message
        })
      }
    }

    return {
      is_valid: issues.length === 0,
      issues: issues,
      trial_balance: trialBalance,
      checked_at: new Date().toISOString()
    }
  }

  // --- System Account Protection ---

  /**
   * Check if account can be deleted or modified
   * @param {number} accountId - Account ID
   * @returns {Promise<Object>} Protection status
   */
  async checkAccountProtection(accountId) {
    const account = await this.getAccountById(accountId)
    if (!account) {
      return {
        protected: false,
        reason: 'Account not found'
      }
    }

    if (account.is_system_account) {
      return {
        protected: true,
        reason: 'System account cannot be deleted',
        can_modify: false,
        can_deactivate: true
      }
    }

    // Check for existing entries
    const entryCount = await this.JournalEntry.count({
      where: { ledger_account_id: accountId }
    })

    if (entryCount > 0) {
      return {
        protected: true,
        reason: `Account has ${entryCount} journal entries`,
        can_modify: true,
        can_deactivate: true
      }
    }

    return {
      protected: false,
      reason: 'Account can be safely deleted',
      can_modify: true,
      can_deactivate: true
    }
  }

  // --- Reporting Methods ---

  /**
   * Get cash flow report (receipts and payments)
   * @param {string} dateFrom - Start date
   * @param {string} dateTo - End date
   * @returns {Promise<Object>} Cash flow report
   */
  async getCashFlow(dateFrom, dateTo) {
    const where = {
      date: {
        [Op.between]: [dateFrom, dateTo]
      },
      status: 'Posted'
    }

    // Get all vouchers in date range
    const vouchers = await this.JournalVoucher.findAll({
      where,
      include: [
        {
          model: this.JournalEntry,
          as: 'entries',
          include: [
            {
              model: this.LedgerAccount,
              as: 'account',
              attributes: ['id', 'name', 'account_type']
            }
          ]
        }
      ],
      order: [['date', 'ASC']]
    })

    const receipts = []
    const payments = []
    let totalReceipts = 0
    let totalPayments = 0

    vouchers.forEach(voucher => {
      if (voucher.voucher_type === 'Receipt') {
        receipts.push({
          date: voucher.date,
          voucher_number: voucher.voucher_number,
          narration: voucher.narration,
          amount: voucher.total_amount,
          entries: voucher.entries
        })
        totalReceipts += parseFloat(voucher.total_amount)
      } else if (voucher.voucher_type === 'Payment') {
        payments.push({
          date: voucher.date,
          voucher_number: voucher.voucher_number,
          narration: voucher.narration,
          amount: voucher.total_amount,
          entries: voucher.entries
        })
        totalPayments += parseFloat(voucher.total_amount)
      }
    })

    return {
      date_from: dateFrom,
      date_to: dateTo,
      receipts: receipts,
      payments: payments,
      total_receipts: totalReceipts,
      total_payments: totalPayments,
      net_cash_flow: totalReceipts - totalPayments
    }
  }

  /**
   * Get profit & loss report
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} Profit & loss report
   */
  async getProfitLoss(startDate, endDate) {
    const where = {
      date: {
        [Op.between]: [startDate, endDate]
      },
      status: 'Posted'
    }

    // Get income accounts (Customer accounts represent income in this system)
    const incomeAccounts = await this.LedgerAccount.findAll({
      where: {
        account_type: 'Customer'
      },
      include: [
        {
          model: this.JournalEntry,
          as: 'entries',
          include: [
            {
              model: this.JournalVoucher,
              as: 'voucher',
              where,
              required: false
            }
          ],
          required: false
        }
      ]
    })

    // Get expense accounts
    const expenseAccounts = await this.LedgerAccount.findAll({
      where: {
        account_type: {
          [Op.in]: ['Direct Expense', 'Indirect Expense']
        }
      },
      include: [
        {
          model: this.JournalEntry,
          as: 'entries',
          include: [
            {
              model: this.JournalVoucher,
              as: 'voucher',
              where,
              required: false
            }
          ],
          required: false
        }
      ]
    })

    // Calculate income totals
    const income = {
      accounts: [],
      total: 0
    }

    incomeAccounts.forEach(account => {
      let accountTotal = 0
      account.entries.forEach(entry => {
        if (entry.voucher) {
          accountTotal += (parseFloat(entry.credit_amount || 0) - parseFloat(entry.debit_amount || 0))
        }
      })
      if (accountTotal > 0) {
        income.accounts.push({
          id: account.id,
          name: account.name,
          account_type: account.account_type,
          amount: accountTotal
        })
        income.total += accountTotal
      }
    })

    // Calculate expense totals
    const expenses = {
      accounts: [],
      total: 0
    }

    expenseAccounts.forEach(account => {
      let accountTotal = 0
      account.entries.forEach(entry => {
        if (entry.voucher) {
          accountTotal += (parseFloat(entry.debit_amount || 0) - parseFloat(entry.credit_amount || 0))
        }
      })
      if (accountTotal > 0) {
        expenses.accounts.push({
          id: account.id,
          name: account.name,
          account_type: account.account_type,
          amount: accountTotal
        })
        expenses.total += accountTotal
      }
    })

    return {
      income,
      expenses,
      net_profit: income.total - expenses.total,
      period: { startDate, endDate }
    }
  }

  /**
   * Get balance sheet report
   * @param {string} asOfDate - As of date
   * @returns {Promise<Object>} Balance sheet report
   */
  async getBalanceSheet(asOfDate) {
    const where = {
      date: {
        [Op.lte]: asOfDate
      },
      status: 'Posted'
    }

    // Get asset accounts
    const assetAccounts = await this.LedgerAccount.findAll({
      where: {
        account_type: 'Asset'
      },
      include: [
        {
          model: this.JournalEntry,
          as: 'entries',
          include: [
            {
              model: this.JournalVoucher,
              as: 'voucher',
              where,
              required: false
            }
          ],
          required: false
        }
      ]
    })

    // Get liability accounts
    const liabilityAccounts = await this.LedgerAccount.findAll({
      where: {
        account_type: 'Liability'
      },
      include: [
        {
          model: this.JournalEntry,
          as: 'entries',
          include: [
            {
              model: this.JournalVoucher,
              as: 'voucher',
              where,
              required: false
            }
          ],
          required: false
        }
      ]
    })

    // Calculate assets
    const assets = {
      accounts: [],
      total: 0
    }

    assetAccounts.forEach(account => {
      let accountTotal = 0
      account.entries.forEach(entry => {
        if (entry.voucher) {
          accountTotal += (parseFloat(entry.debit_amount || 0) - parseFloat(entry.credit_amount || 0))
        }
      })
      if (accountTotal > 0) {
        assets.accounts.push({
          id: account.id,
          name: account.name,
          account_type: account.account_type,
          amount: accountTotal
        })
        assets.total += accountTotal
      }
    })

    // Calculate liabilities
    const liabilities = {
      accounts: [],
      total: 0
    }

    liabilityAccounts.forEach(account => {
      let accountTotal = 0
      account.entries.forEach(entry => {
        if (entry.voucher) {
          accountTotal += (parseFloat(entry.credit_amount || 0) - parseFloat(entry.debit_amount || 0))
        }
      })
      if (accountTotal > 0) {
        liabilities.accounts.push({
          id: account.id,
          name: account.name,
          account_type: account.account_type,
          amount: accountTotal
        })
        liabilities.total += accountTotal
      }
    })

    // Calculate retained earnings (simplified - using net profit from all time)
    const profitLoss = await this.getProfitLoss('1900-01-01', asOfDate)
    const equity = {
      accounts: [
        {
          id: 0,
          name: 'Retained Earnings',
          account_type: 'Equity',
          amount: Math.max(0, profitLoss.net_profit)
        }
      ],
      total: Math.max(0, profitLoss.net_profit)
    }

    return {
      assets,
      liabilities,
      equity,
      asOfDate
    }
  }

  /**
   * Get general ledger report for a specific account
   * @param {number} accountId - Account ID
   * @param {string} startDate - Start date
   * @param {string} endDate - End date
   * @returns {Promise<Object>} General ledger report
   */
  async getGeneralLedger(accountId, startDate, endDate) {
    // Get account details
    const account = await this.getAccountById(accountId)
    if (!account) {
      throw new Error('Account not found')
    }

    // Get opening balance
    const openingBalanceEntries = await this.JournalEntry.findAll({
      include: [
        {
          model: this.JournalVoucher,
          as: 'voucher',
          where: {
            date: {
              [Op.lt]: startDate
            },
            status: 'Posted'
          }
        }
      ],
      where: {
        ledger_account_id: accountId
      }
    })

    let openingBalance = 0
    openingBalanceEntries.forEach(entry => {
      openingBalance += (parseFloat(entry.debit_amount || 0) - parseFloat(entry.credit_amount || 0))
    })

    // Get transactions in date range
    const transactions = await this.JournalEntry.findAll({
      include: [
        {
          model: this.JournalVoucher,
          as: 'voucher',
          where: {
            date: {
              [Op.between]: [startDate, endDate]
            },
            status: 'Posted'
          }
        }
      ],
      where: {
        ledger_account_id: accountId
      },
      order: [
        [{ model: this.JournalVoucher, as: 'voucher' }, 'date', 'ASC'],
        [{ model: this.JournalVoucher, as: 'voucher' }, 'id', 'ASC']
      ]
    })

    // Calculate running balances
    let runningBalance = openingBalance
    const transactionsWithBalance = transactions.map(entry => {
      const debitAmount = parseFloat(entry.debit_amount || 0)
      const creditAmount = parseFloat(entry.credit_amount || 0)
      runningBalance += (debitAmount - creditAmount)

      return {
        id: entry.id,
        date: entry.voucher.date,
        voucher_number: entry.voucher.voucher_number,
        voucher_type: entry.voucher.voucher_type,
        narration: entry.narration || entry.voucher.narration,
        debit_amount: debitAmount,
        credit_amount: creditAmount,
        running_balance: runningBalance
      }
    })

    return {
      account: {
        id: account.id,
        name: account.name,
        account_type: account.account_type,
        description: account.description
      },
      transactions: transactionsWithBalance,
      opening_balance: openingBalance,
      closing_balance: runningBalance,
      period: { startDate, endDate }
    }
  }
}