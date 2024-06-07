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

const getStocks = async (table) => {
  try {
    const getKrStocksQuery = `select * from ${table}`;

    connection.query(getKrStocksQuery, (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }

      fs.writeFileSync(
        `stocks/result/final/${table}.json`,
        JSON.stringify(result, null, 2)
      );
    });
  } catch (err) {
    console.log(err);
  }
};

getStocks('us_stocks');
connection.end();
