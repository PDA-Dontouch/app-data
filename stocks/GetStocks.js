import mysql from 'mysql2';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.STOCK_DB_HOST,
  user: process.env.STOCK_DB_USER,
  password: process.env.STOCK_DB_PASSWORD,
  database: process.env.STOCK_DB_DATABASE,
});

export const getQueryResponse = async () => {
  try {
    const query = `SELECT symbol, count(*)
    FROM us_stock_prices
    GROUP BY symbol
    having count(*) < 1200;`;

    connection.query(query, (err, result) => {
      if (err) {
        console.error('Error selecting data:', err);
        return;
      }

      fs.writeFileSync(
        `stocks/result/us_price_symbols_less_than_1200.json`,
        JSON.stringify(result, null, 2)
      );
    });
  } catch (err) {
    console.log(err);
  }
};

getQueryResponse();

connection.end();
