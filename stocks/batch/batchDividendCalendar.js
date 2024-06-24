import mysql from 'mysql2';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

import { getFormattedDate } from './utils.js';

dotenv.config();

export const updateDividendCalendar = async (nation, startDate, pool) => {
  try {
    const symbolFile = `stocks/batch/symbols/${nation}_stock_symbols.json`;
    const symbols = JSON.parse(fs.readFileSync(symbolFile, 'utf8'));

    for (const symbolObj of symbols) {
      const dataSymbol = symbolObj.symbol;
      const searchSymbol = nation == 'kr' ? dataSymbol + '.KS' : dataSymbol;

      const url = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${searchSymbol}?apikey=${process.env.FMP_API_KEY}`;
      console.log(`requsted ${dataSymbol}`);

      const dividends = (await axios.get(url)).data.historical;

      if (!dividends) {
        console.log(`passed ${dataSymbol}`);
        continue;
      }

      dividends.reverse();

      for (const dividend of dividends) {
        if (new Date(dividend.date) < new Date(startDate)) {
          continue;
        }

        const insertQuery = `insert into ${nation}_stock_dividend_fixed (symbol, dividend, dividend_date, payment_date) values (?, ?, ?, ?)`;
        const values = [
          searchSymbol,
          dividend.dividend || null,
          dividend.date || null,
          dividend.paymentDate || null,
        ];

        await new Promise((resolve, reject) => {
          pool.query(insertQuery, values, (err, result) => {
            if (err) {
              reject(err);
              return;
            }
            resolve();
          });
        });
      }
    }
  } catch (err) {
    console.log(err);
  }
};
