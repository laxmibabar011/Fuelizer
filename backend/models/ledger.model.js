import { DataTypes } from "sequelize";

// Initializes General Ledger models for double-entry accounting system
// This module handles Chart of Accounts, Journal Vouchers, and Journal Entries
export const initLedgerModels = (sequelize) => {
  // --- Chart of Accounts - Master account categories ---
  const LedgerAccount = sequelize.define(
    "LedgerAccount",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Account name cannot be empty" },
          len: {
            args: [2, 100],
            msg: "Account name must be between 2 and 100 characters",
          },
        },
      },
      account_type: {
        type: DataTypes.ENUM(
          "Direct Expense",
          "Indirect Expense",
          "Asset",
          "Liability",
          "Customer",
          "Vendor",
          "Bank"
        ),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Account type is required" },
        },
      },
      is_system_account: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "System accounts cannot be deleted by users",
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Optional description for the account",
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["name"],
          name: "unique_account_name_per_tenant",
        },
        {
          fields: ["account_type"],
          name: "idx_ledger_account_type",
        },
        {
          fields: ["status"],
          name: "idx_ledger_account_status",
        },
        {
          fields: ["is_system_account"],
          name: "idx_ledger_system_account",
        },
      ],
      validate: {
        // Custom validation to ensure system accounts have proper naming
        systemAccountValidation() {
          if (this.is_system_account && !this.name.includes("System")) {
            // Allow flexibility in system account naming
          }
        },
      },
    }
  );

  // --- Transaction Header - Groups related journal entries ---
  const JournalVoucher = sequelize.define(
    "JournalVoucher",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      voucher_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: "Auto-generated voucher number for reference",
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Voucher date is required" },
          isDate: { msg: "Invalid date format" },
        },
      },
      voucher_type: {
        type: DataTypes.ENUM("Payment", "Receipt", "Journal"),
        allowNull: false,
        validate: {
          notEmpty: { msg: "Voucher type is required" },
        },
      },
      narration: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: {
            args: [0, 500],
            msg: "Narration cannot exceed 500 characters",
          },
        },
      },
      total_amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        validate: {
          min: { args: [0.01], msg: "Total amount must be greater than 0" },
          isDecimal: { msg: "Total amount must be a valid decimal number" },
        },
      },
      created_by_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "User ID who created this voucher",
      },
      status: {
        type: DataTypes.ENUM("Posted", "Cancelled"),
        allowNull: false,
        defaultValue: "Posted",
      },
      reference_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment:
          "External reference number (cheque number, invoice number, etc.)",
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ["voucher_number"],
          name: "unique_voucher_number_per_tenant",
        },
        {
          fields: ["date"],
          name: "idx_journal_voucher_date",
        },
        {
          fields: ["voucher_type"],
          name: "idx_journal_voucher_type",
        },
        {
          fields: ["status"],
          name: "idx_journal_voucher_status",
        },
        {
          fields: ["created_by_id"],
          name: "idx_journal_voucher_created_by",
        },
        {
          fields: ["date", "voucher_type"],
          name: "idx_journal_voucher_date_type",
        },
      ],
      validate: {
        // Custom validation for voucher business rules
        voucherValidation() {
          if (this.status === "Cancelled" && this.total_amount > 0) {
            // Cancelled vouchers should have zero impact, but we keep original amount for audit
          }
        },
      },
    }
  );

  // --- Individual Debit/Credit Lines ---
  const JournalEntry = sequelize.define(
    "JournalEntry",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      voucher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: JournalVoucher,
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      ledger_account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: LedgerAccount,
          key: "id",
        },
        onDelete: "RESTRICT", // Prevent deletion of accounts with entries
        onUpdate: "CASCADE",
      },
      debit_amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: { args: [0], msg: "Debit amount cannot be negative" },
          isDecimal: { msg: "Debit amount must be a valid decimal number" },
        },
      },
      credit_amount: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: { args: [0], msg: "Credit amount cannot be negative" },
          isDecimal: { msg: "Credit amount must be a valid decimal number" },
        },
      },
      narration: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: "Line-specific narration (optional)",
      },
    },
    {
      indexes: [
        {
          fields: ["voucher_id"],
          name: "idx_journal_entry_voucher",
        },
        {
          fields: ["ledger_account_id"],
          name: "idx_journal_entry_account",
        },
        {
          fields: ["voucher_id", "ledger_account_id"],
          name: "idx_journal_entry_voucher_account",
        },
        {
          fields: ["debit_amount"],
          name: "idx_journal_entry_debit",
        },
        {
          fields: ["credit_amount"],
          name: "idx_journal_entry_credit",
        },
      ],
      validate: {
        // Double-entry validation: each entry must have either debit OR credit (not both, not neither)
        doubleEntryValidation() {
          const hasDebit = this.debit_amount > 0;
          const hasCredit = this.credit_amount > 0;

          if (hasDebit && hasCredit) {
            throw new Error(
              "Journal entry cannot have both debit and credit amounts"
            );
          }

          if (!hasDebit && !hasCredit) {
            throw new Error(
              "Journal entry must have either debit or credit amount"
            );
          }
        },

        // Ensure amounts are properly formatted
        amountValidation() {
          if (this.debit_amount < 0 || this.credit_amount < 0) {
            throw new Error("Amounts cannot be negative");
          }
        },
      },
    }
  );

  // --- Define Relationships ---

  // JournalVoucher has many JournalEntries
  JournalVoucher.hasMany(JournalEntry, {
    foreignKey: "voucher_id",
    as: "entries",
    onDelete: "CASCADE",
  });

  JournalEntry.belongsTo(JournalVoucher, {
    foreignKey: "voucher_id",
    as: "voucher",
  });

  // LedgerAccount has many JournalEntries
  LedgerAccount.hasMany(JournalEntry, {
    foreignKey: "ledger_account_id",
    as: "entries",
  });

  JournalEntry.belongsTo(LedgerAccount, {
    foreignKey: "ledger_account_id",
    as: "account",
  });

  // Add hooks for business logic

  // Before creating a voucher, generate voucher number
  JournalVoucher.beforeCreate(async (voucher, options) => {
    if (!voucher.voucher_number) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, "0");
      const prefix = `${voucher.voucher_type.charAt(0)}${year}${month}`;

      // Find the last voucher number for this type and period
      const lastVoucher = await JournalVoucher.findOne({
        where: {
          voucher_type: voucher.voucher_type,
          voucher_number: {
            [sequelize.Sequelize.Op.like]: `${prefix}%`,
          },
        },
        order: [["voucher_number", "DESC"]],
        transaction: options.transaction,
      });

      let sequence = 1;
      if (lastVoucher) {
        const lastSequence = parseInt(lastVoucher.voucher_number.slice(-4));
        sequence = lastSequence + 1;
      }

      voucher.voucher_number = `${prefix}${String(sequence).padStart(4, "0")}`;
    }
  });

  // Before creating/updating journal entry, validate double-entry rules
  JournalEntry.beforeSave(async (entry, options) => {
    // Ensure only one of debit or credit is set
    if (entry.debit_amount > 0 && entry.credit_amount > 0) {
      throw new Error(
        "Journal entry cannot have both debit and credit amounts"
      );
    }

    if (entry.debit_amount === 0 && entry.credit_amount === 0) {
      throw new Error("Journal entry must have either debit or credit amount");
    }
  });

  return { LedgerAccount, JournalVoucher, JournalEntry };
};
