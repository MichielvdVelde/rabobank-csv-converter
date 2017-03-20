const Transform = require('stream').Transform
const crypto = require('crypto')

class BatchConverter extends Transform {
  constructor (options) {
    super(options)

    this._bank = options.bank
    this._account = options.account
    this._currency = options.currency || 'EUR'
    this._rows = {}
  }

  /**
   * Creates a hash from the given data.
   * @param {Buffer} row           The data to hash
   * @param {String} [algo=sha256] The algorithm to use
   * @param {String} [enc=hex]     The output encoding
   * @return {String}              The generated hash
   */
  _createHash (row, algo = 'sha256', enc = 'hex') {
    return crypto.createHash(algo).update(row).digest(enc)
  }

  /**
   * Converts the transaction type.
   */
  _convertType (type) {
    switch (type) {
      case 'C':
        return 'credit'
      case 'D':
        return 'debit'
    }
  }

  /**
   * Converts the description fields to one field.
   */
  _convertDescription (...desc) {
    return desc.join(' ').trim()
  }

  _transform (data, encoding, cb) {
    const hash = this._createHash(data)

    if (hash in this._rows) {
      process.nextTick(() => this.emit('error', new Error('duplicate transaction hash')))
    }

    const raw = JSON.parse(data.toString())
    const row = {
      _hash: hash,
      _bank: this._bank,
      _account: raw.account_iban || this._account,
      type: this._convertType(raw.credit_or_debit),
      currency: raw.currency || this._currency,
      amount: parseFloat(raw.amount),
      transaction_date: new Date(raw.date),
      description: this._convertDescription(raw.desc1, raw.desc2, raw.desc3, raw.desc4, raw.desc5, raw.desc6),
      interest_date: raw.interest_date ? new Date(raw.interest_date) : new Date(raw.date)
    }

    if (raw.code) row.code = raw.code
    if (raw.counter_iban || raw.counter_name) {
      row.counter_account = {}
      if (raw.counter_iban) row.counter_account.iban = raw.counter_iban
      if (raw.counter_name) row.counter_account.name = raw.counter_name
    }

    this._rows[hash] = 1
    this.push(Buffer.from(JSON.stringify(row)))
    cb()
  }
}

exports = module.exports = BatchConverter
