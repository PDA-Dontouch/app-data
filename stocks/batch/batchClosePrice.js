import mysql from 'mysql2';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

dotenv.config();

export const updateClosePrice = async (nation, from, to, connection) => {
  const symbolFile = `stocks/batch/symbols/${nation}_stock_symbols.json`;
  const symbols = JSON.parse(fs.readFileSync(symbolFile, 'utf8'));

  for (const symbolObj of symbols) {
    const dataSymbol = symbolObj.symbol;
    const searchSymbol = nation == 'kr' ? dataSymbol + '.KS' : dataSymbol;

    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${searchSymbol}?from=${from}&to=${to}&apikey=${process.env.FMP_API_KEY}`;
    console.log(`requsted ${dataSymbol}`);

    const data = (await axios.get(url)).data;
    const prices = data.historical;
    const lastestPriceObj = prices[0];

    if (lastestPriceObj == null) {
      continue;
    }

    const updateQuery = `update ${nation}_stocks set close_price = ${lastestPriceObj.close} where symbol = '${dataSymbol}'`;
    await connection.execute(updateQuery);

    console.log(`updated close price of ${dataSymbol}`);
  }
};
