# CSV Transaction Converter for [rabobank-csv-parser](https://github.com/MichielvdVelde/rabobank-csv-parser) (Rabobank)

[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

After coding [rabobank-csv-parser](https://github.com/MichielvdVelde/rabobank-csv-parser) to parse my bank's CSV transaction files,
I was left with a situation where the column named didn't match up with my Mongo database schema.
So I built this module to convert a row from rabobank-csv-parser to a row which I can add to Mongo.

In addition to converting the row into another row structure it also add a `_hash` key
which is the SHA256 hash for the row. I am using this hash to avoid inserting a mutation
multiple times.

The module is designed to be piped to from rabobank-csv-parser.

## Install

```bash
npm i rabobank-csv-converter
```

## Usage

### Example code

I am using [csv-streamify](https://github.com/klaemo/csv-stream) to pre-parse the CSV file.

```js
const fs = require('fs')
const CSVStreamify = require('csv-streamify')
const RaboCSVParser = require('rabobank-csv-parser')
const RaboConverter = require('rabobank-csv-converter')

const csvParser = CSVStreamify()
const raboParser = new RaboCSVParser()
const raboConverter = new RaboConverter({
  bank: 'rabobank', // corresponds to the _id of the Bank documents
  account: 'NL08RABO2952747327', // corresponds to the _id of the Account documents, used if the row doesn't specify one
  currency: 'EUR' // sets a default currency, used if the row doesn't specify one
})

// A `data` event is emitted for each row
raboConverter.on('data', function (row) {
  // `data` is a Buffer, so we first convert it to JSON
  row = JSON.parse(row.toString())

  // Do what you want with it - displaying it, for example
  console.log(row)
})

// Pipe a file stream through csv-streamify, rabobank-csv-parser and then this module
fs.createReadStream('transactions.txt').pipe(csvParser).pipe(raboParser).pipe(raboConverter)
```

### Example output

The data in this example output has been faked (obviously). The ouput is a single row
(or one `data` event).

Depending on the keys in the original row there may be more or fewer keys.

```json
{
  "_hash": "3e012db6535b2826618b5715f693d057752aaeba923bb9a9a5d67b25d4af0412",
  "_bank": "rabobank",
  "_account": "NL08RABO2952747327",
  "type": "debit",
  "currency": "EUR",
  "amount": 2.6,
  "transaction_date": "2015-12-15T00:00:00.000Z",
  "description": "Afschrijving",
  "interest_date": "2015-12-15T00:00:00.000Z",
  "code": "ba"
}
```

### Changelog

* **v0.0.1** (20-03-2017)
  * First published

[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

### License

Copyright 2017 [Michiel van der Velde](http://www.michielvdvelde.nl).

This software is licensed under the [MIT License](LICENSE).
