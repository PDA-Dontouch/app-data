import mysql from 'mysql2';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.STOCK_DB_HOST,
  user: process.env.STOCK_DB_USER,
  password: process.env.STOCK_DB_PASSWORD,
  database: process.env.STOCK_DB_DATABASE,
});

const updateUsStockNames = async () => {
  try {
    const stocksFile = `stocks/result/final/us_stock_names.json`;
    const stocks = JSON.parse(fs.readFileSync(stocksFile, 'utf8'));

    for (const stock of stocks) {
      console.log('update ', stock.name);
      const updateQuery = `update us_stocks set name = '${stock.name}' where symbol = '${stock.symbol}';`;

      connection.query(updateQuery, (err, result) => {
        if (err) {
          console.error('Error selecting data:', err);
          return;
        }
        console.log('updated ', stock.name);
      });
    }
  } catch (err) {
    console.log(err);
  }
};

updateUsStockNames();
