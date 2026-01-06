import { initSalesModels } from "../models/sales.model.js";
import { initTransactionModels } from "../models/transaction.model.js";
import { initProductModels } from "../models/product.model.js";
import { Op } from "sequelize";

export class SalesRepository {
  constructor(sequelize) {
    this.sequelize = sequelize;
    const { Sales } = initSalesModels(sequelize);
    const { Transaction, PaymentMethod } = initTransactionModels(sequelize);
    const { Product, ProductCategory } = initProductModels(sequelize);
    this.Sales = Sales;
    this.PaymentMethod = PaymentMethod;
    this.Transaction = Transaction;
    this.Product = Product;
    this.ProductCategory = ProductCategory;
  }

  async listSales(filter = {}, options = {}) {
    const where = {};
    if (filter.date_from && filter.date_to) {
      where.Date = {
        [this.sequelize.Op.between]: [filter.date_from, filter.date_to],
      };
    } else if (filter.date) {
      where.Date = filter.date;
    }
    if (filter.bill_mode) where["Bill Mode"] = filter.bill_mode;
    if (filter.item_name) where["Item Name"] = filter.item_name;
    if (filter.status) where.status = filter.status;

    const includeOptions = [];
    if (this.PaymentMethod) {
      includeOptions.push({ model: this.PaymentMethod, as: "PaymentMethod" });
    }

    return this.Sales.findAll({
      where,
      include: includeOptions,
      order: [
        ["Date", "DESC"],
        ["BillNo", "ASC"],
      ],
      limit: options.limit || 500,
    });
  }

  async createManualSale(row, opts = {}) {
    // If payment_method_id is provided, fetch the PaymentMethod to get bill_mode
    if (row.payment_method_id && this.PaymentMethod) {
      const paymentMethod = await this.PaymentMethod.findByPk(
        row.payment_method_id
      );
      if (paymentMethod) {
        row["Bill Mode"] = paymentMethod.bill_mode;
      }
    }

    // Auto-split if amount > 30000 and autoSplit is true
    if (row.autoSplit && row["Invoice Value"] > 30000) {
      return await this._createManualSplitSale(row, opts);
    }

    return this.Sales.create(
      { ...row, source: "Manual", status: row.status || "Posted" },
      opts
    );
  }

  async _createManualSplitSale(row, opts = {}) {
    const {
      "Invoice Value": totalAmount,
      Qty: totalQty,
      Rate: rate,
      product_id,
    } = row;
    const threshold = 30000;

    // Get product to determine if it's fuel
    const product = await this.Product.findByPk(product_id, {
      include: [
        {
          model: this.ProductCategory,
          as: "ProductCategory",
          attributes: ["name", "category_type"],
        },
      ],
    });
    const isFuel = product?.ProductCategory?.category_type === "Fuel";

    const t = await this.sequelize.transaction();
    const created = [];

    try {
      if (isFuel) {
        // Fuel splitting: keep rate constant, split by quantity
        const maxQtyPerInvoice = Math.floor(threshold / rate);
        let remainingQty = totalQty;
        let remainingAmount = totalAmount;

        while (remainingQty > 0) {
          const currentQty = Math.min(remainingQty, maxQtyPerInvoice);
          const currentAmount = currentQty * rate;

          // Last invoice gets any rounding adjustment
          if (remainingQty - currentQty <= 0.001) {
            const adjustment =
              totalAmount -
              created.reduce((sum, sale) => sum + sale["Invoice Value"], 0) -
              currentAmount;
            const finalAmount = currentAmount + adjustment;

            const salesRow = await this._createSingleSalesRow({
              product,
              payment_method_id: row.payment_method_id,
              bill_mode: row["Bill Mode"],
              qty: currentQty,
              amount: finalAmount,
              rate,
              isFuel,
              transactions: [],
              created_by_id: row.created_by_id,
              transaction: t,
            });
            created.push(salesRow);
            break;
          }

          const salesRow = await this._createSingleSalesRow({
            product,
            payment_method_id: row.payment_method_id,
            bill_mode: row["Bill Mode"],
            qty: currentQty,
            amount: currentAmount,
            rate,
            isFuel,
            transactions: [],
            created_by_id: row.created_by_id,
            transaction: t,
          });
          created.push(salesRow);

          remainingQty -= currentQty;
          remainingAmount -= currentAmount;
        }
      } else {
        // Non-fuel splitting: proportional split
        const numInvoices = Math.ceil(totalAmount / threshold);
        const amountPerInvoice = totalAmount / numInvoices;

        for (let i = 0; i < numInvoices; i++) {
          const isLast = i === numInvoices - 1;
          const currentAmount = isLast
            ? totalAmount - amountPerInvoice * (numInvoices - 1)
            : amountPerInvoice;

          const salesRow = await this._createSingleSalesRow({
            product,
            payment_method_id: row.payment_method_id,
            bill_mode: row["Bill Mode"],
            qty: (currentAmount / totalAmount) * totalQty,
            amount: currentAmount,
            rate,
            isFuel,
            transactions: [],
            created_by_id: row.created_by_id,
            transaction: t,
          });
          created.push(salesRow);
        }
      }

      await t.commit();
      return created;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async previewPosGroups(params = {}) {
    const { date, shift_id, threshold = 30000 } = params;

    // Build where clause for transactions
    const where = {};
    if (date) {
      where.transaction_time = {
        [Op.gte]: new Date(date + " 00:00:00"),
        [Op.lte]: new Date(date + " 23:59:59"),
      };
    }
    if (shift_id) {
      where.operator_group_id = shift_id;
    }

    // Get transactions with related data
    const transactions = await this.Transaction.findAll({
      where,
      include: [
        { model: this.PaymentMethod, as: "PaymentMethod" },
        {
          model: this.sequelize.models.Nozzle,
          as: "Nozzle",
          include: [
            {
              model: this.Product,
              as: "Product",
              include: [
                {
                  model: this.ProductCategory,
                  as: "ProductCategory",
                  attributes: ["name", "category_type"],
                },
              ],
            },
          ],
        },
      ],
      order: [["transaction_time", "ASC"]],
    });

    // Group by product + payment method (+ credit customer when applicable)
    const groups = {};
    transactions.forEach((txn) => {
      const product = txn.Nozzle?.Product;
      const paymentMethod = txn.PaymentMethod;

      if (!product || !paymentMethod) return;

      // If PM strategy is credit_customer, group additionally by credit_customer_id
      const creditId =
        paymentMethod.party_name_strategy === "credit_customer" &&
        txn.credit_customer_id
          ? txn.credit_customer_id
          : null;
      const key = `${product.id}_${paymentMethod.id}_${creditId ?? "na"}`;
      if (!groups[key]) {
        groups[key] = {
          product_id: product.id,
          product_name: product.name,
          payment_method_id: paymentMethod.id,
          payment_method_name: paymentMethod.name,
          bill_mode: paymentMethod.bill_mode,
          party_name_strategy: paymentMethod.party_name_strategy,
          party_name_uppercase: paymentMethod.party_name_uppercase,
          default_party_name: paymentMethod.default_party_name,
          credit_customer_id: creditId,
          is_fuel: product.ProductCategory?.category_type === "Fuel",
          transactions: [],
          total_qty: 0,
          total_amount: 0,
          avg_rate: 0,
          needs_split: false,
        };
      }

      groups[key].transactions.push(txn);
      groups[key].total_qty += parseFloat(txn.litres_sold);
      groups[key].total_amount += parseFloat(txn.total_amount);
    });

    // Calculate averages and check if splitting needed
    const groupList = Object.values(groups);
    for (const group of groupList) {
      group.avg_rate =
        group.total_qty > 0 ? group.total_amount / group.total_qty : 0;
      group.needs_split = group.total_amount > threshold;
      // Resolve credit customer name if present
      if (group.credit_customer_id) {
        const CreditAccount = this.sequelize.models.CreditAccount;
        if (CreditAccount) {
          const acc = await CreditAccount.findByPk(group.credit_customer_id);
          if (acc) {
            group.credit_customer_name =
              acc.companyName || acc.contactName || null;
          }
        }
      }
    }

    return {
      groups: groupList,
      threshold,
      total_transactions: transactions.length,
      total_groups: groupList.length,
      groups_needing_split: groupList.filter((g) => g.needs_split).length,
    };
  }

  async exportPosGroups(params = {}) {
    const { groups, threshold = 30000, created_by_id } = params;

    if (!groups || !Array.isArray(groups)) {
      throw new Error("Groups array is required");
    }

    const created = [];
    const t = await this.sequelize.transaction();

    try {
      for (const group of groups) {
        const salesRows = await this._createSalesFromGroup(
          group,
          threshold,
          created_by_id,
          t
        );
        created.push(...salesRows);
      }

      await t.commit();
      return { created, count: created.length };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async _createSalesFromGroup(group, threshold, created_by_id, transaction) {
    const {
      product_id,
      payment_method_id,
      bill_mode,
      total_qty,
      total_amount,
      avg_rate,
      transactions,
      credit_customer_id,
    } = group;

    // Get product details for tax calculation
    const product = await this.Product.findByPk(product_id, {
      include: [
        {
          model: this.ProductCategory,
          as: "ProductCategory",
          attributes: ["name", "category_type"],
        },
      ],
      transaction,
    });

    if (!product) throw new Error(`Product ${product_id} not found`);

    const isFuel = product.ProductCategory?.category_type === "Fuel";
    const salesRows = [];

    // Determine sale date from the first transaction in group (fallback: today)
    const firstTxn =
      Array.isArray(transactions) && transactions.length > 0
        ? transactions[0]
        : null;
    const saleDate = firstTxn?.transaction_time
      ? new Date(firstTxn.transaction_time).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    if (total_amount <= threshold) {
      // Single invoice
      const salesRow = await this._createSingleSalesRow({
        product,
        payment_method_id,
        bill_mode,
        qty: total_qty,
        amount: total_amount,
        rate: avg_rate,
        isFuel,
        transactions,
        credit_customer_id,
        saleDate,
        created_by_id,
        transaction,
      });
      salesRows.push(salesRow);
    } else {
      // Split into multiple invoices
      const splitRows = await this._createSplitSalesRows({
        product,
        payment_method_id,
        bill_mode,
        total_qty,
        total_amount,
        rate: avg_rate,
        threshold,
        isFuel,
        transactions,
        credit_customer_id,
        saleDate,
        created_by_id,
        transaction,
      });
      salesRows.push(...splitRows);
    }

    return salesRows;
  }

  async _createSingleSalesRow({
    product,
    payment_method_id,
    bill_mode,
    qty,
    amount,
    rate,
    isFuel,
    transactions,
    created_by_id,
    credit_customer_id,
    saleDate,
    transaction,
  }) {
    const dateStr = saleDate || new Date().toISOString().split("T")[0];
    const billNo = await this._getNextBillNumber(transaction);
    // Resolve Party Name from payment method strategy or credit customer
    const partyName = await this._resolvePartyName(
      payment_method_id,
      credit_customer_id,
      transaction
    );

    const salesData = {
      Date: dateStr,
      BillNo: billNo,
      "Bill Mode": bill_mode,
      "Party Name": partyName,
      "Registration Type": "unregistered/consumer",
      GSTIN: null,
      "Item Name": product.name,
      Qty: qty,
      Rate: rate,
      Amount: amount,
      "GST Rate": isFuel ? 0 : product.gst_rate || 0,
      "Taxable Value": amount,
      SGST: isFuel ? 0 : ((product.sgst_rate || 0) * amount) / 100,
      CGST: isFuel ? 0 : ((product.cgst_rate || 0) * amount) / 100,
      IGST: isFuel ? 0 : ((product.igst_rate || 0) * amount) / 100,
      "Cess Rate": isFuel ? 0 : product.cess_rate || 0,
      "Cess Amt": isFuel ? 0 : ((product.cess_rate || 0) * amount) / 100,
      "TCS Rate": isFuel ? 0 : product.tcs_rate || 0,
      "TCS Amt": isFuel ? 0 : ((product.tcs_rate || 0) * amount) / 100,
      "Invoice Value":
        amount + (isFuel ? 0 : this._calculateTotalTax(product, amount)),

      // System fields
      source: "POS",
      status: "Posted",
      product_id: product?.id || null,
      payment_method_id,
      product_type: isFuel ? "Fuel" : "NonFuel",
      pos_txn_ids: transactions.map((t) => t.id),
      credit_customer_id: credit_customer_id ?? null,
      created_by_id,
      posted_by_id: created_by_id,
      posted_at: new Date(),
    };

    return await this.Sales.create(salesData, { transaction });
  }

  async _createSplitSalesRows({
    product,
    payment_method_id,
    bill_mode,
    total_qty,
    total_amount,
    rate,
    threshold,
    isFuel,
    transactions,
    created_by_id,
    credit_customer_id,
    saleDate,
    transaction,
  }) {
    const dateStr = saleDate || new Date().toISOString().split("T")[0];
    const salesRows = [];

    if (isFuel) {
      // Fuel splitting: keep rate constant, split by quantity
      const maxQtyPerInvoice = Math.floor(threshold / rate);
      let remainingQty = total_qty;
      let remainingAmount = total_amount;

      while (remainingQty > 0) {
        const currentQty = Math.min(remainingQty, maxQtyPerInvoice);
        const currentAmount = currentQty * rate;

        // Last invoice gets any rounding adjustment
        if (remainingQty - currentQty <= 0.001) {
          const adjustment =
            total_amount -
            salesRows.reduce((sum, row) => sum + row.Amount, 0) -
            currentAmount;
          const finalAmount = currentAmount + adjustment;

          const salesRow = await this._createSingleSalesRow({
            product,
            payment_method_id,
            bill_mode,
            qty: currentQty,
            amount: finalAmount,
            rate,
            isFuel,
            transactions: [], // Split transactions proportionally if needed
            credit_customer_id,
            saleDate: dateStr,
            created_by_id,
            transaction,
          });
          salesRows.push(salesRow);
          break;
        }

        const salesRow = await this._createSingleSalesRow({
          product,
          payment_method_id,
          bill_mode,
          qty: currentQty,
          amount: currentAmount,
          rate,
          isFuel,
          transactions: [],
          credit_customer_id,
          saleDate: dateStr,
          created_by_id,
          transaction,
        });
        salesRows.push(salesRow);

        remainingQty -= currentQty;
        remainingAmount -= currentAmount;
      }
    } else {
      // Non-fuel splitting: proportional split with tax allocation
      const numInvoices = Math.ceil(total_amount / threshold);
      const amountPerInvoice = total_amount / numInvoices;

      for (let i = 0; i < numInvoices; i++) {
        const isLast = i === numInvoices - 1;
        const currentAmount = isLast
          ? total_amount - amountPerInvoice * (numInvoices - 1)
          : amountPerInvoice;

        const salesRow = await this._createSingleSalesRow({
          product,
          payment_method_id,
          bill_mode,
          qty: (currentAmount / total_amount) * total_qty,
          amount: currentAmount,
          rate,
          isFuel,
          transactions: [],
          credit_customer_id,
          saleDate: dateStr,
          created_by_id,
          transaction,
        });
        salesRows.push(salesRow);
      }
    }

    return salesRows;
  }

  _calculateTotalTax(product, amount) {
    const sgst = ((product.sgst_rate || 0) * amount) / 100;
    const cgst = ((product.cgst_rate || 0) * amount) / 100;
    const igst = ((product.igst_rate || 0) * amount) / 100;
    const cess = ((product.cess_rate || 0) * amount) / 100;
    const tcs = ((product.tcs_rate || 0) * amount) / 100;
    return sgst + cgst + igst + cess + tcs;
  }

  async _resolvePartyName(payment_method_id, credit_customer_id, transaction) {
    try {
      let paymentMethod = null;
      if (this.PaymentMethod && payment_method_id) {
        paymentMethod = await this.PaymentMethod.findByPk(payment_method_id, {
          transaction,
        });
      }

      // If credit sale and we have credit_customer_id, prefer that name
      if (credit_customer_id) {
        const CreditAccount = this.sequelize.models.CreditAccount;
        if (CreditAccount) {
          const acc = await CreditAccount.findByPk(credit_customer_id, {
            transaction,
          });
          if (acc) {
            let name = acc.companyName || acc.contactName || "CREDIT CUSTOMER";
            if (paymentMethod?.party_name_uppercase)
              name = String(name).toUpperCase();
            return name;
          }
        }
      }

      // Fallback to payment method configured defaults
      if (paymentMethod) {
        if (paymentMethod.party_name_strategy === "fixed") {
          let name = paymentMethod.default_party_name || "Cash";
          if (paymentMethod.party_name_uppercase)
            name = String(name).toUpperCase();
          return name;
        }
      }

      return "Cash";
    } catch (e) {
      return "Cash";
    }
  }

  async _getNextBillNumber(transaction) {
    // Global continuous sequence across all dates and sources
    const lastSale = await this.Sales.findOne({
      order: [["id", "DESC"]],
      transaction,
    });

    if (!lastSale || !lastSale.BillNo) {
      return "0001";
    }

    const lastRaw = String(lastSale.BillNo);
    const lastNumber = parseInt(lastRaw.replace(/\D/g, ""), 10) || 0;
    const next = lastNumber + 1;
    return String(next).padStart(4, "0");
  }

  async getPaymentMethods() {
    if (!this.PaymentMethod) {
      return [];
    }
    return this.PaymentMethod.findAll({
      where: { is_active: true },
      order: [["name", "ASC"]],
    });
  }
}
