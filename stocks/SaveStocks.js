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

// insert symbol, name, exchange, type, corp_code
// kr_stocks
const saveKrStock = (stock) => {
  let corp_code = null;
  if (stock.type === 'stock') {
    corp_code = stock.corp_code;
  }

  const krQuery = `insert into kr_stocks (symbol, name, exchange, type, corp_code) values (?, ?, ?, ?, ?)`;

  connection.query(
    krQuery,
    [stock.symbol, stock.name, stock.exchange, stock.type, corp_code],
    (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      console.log('Data inserted successfully:', result);
    }
  );
};

// insert symbol, name, exchange, type
// us_stocks
const saveUsStock = (stock) => {
  const usQuery = `insert into us_stocks (symbol, name, exchange, type) values (?, ?, ?, ?)`;

  connection.query(
    usQuery,
    [stock.symbol, stock.name, stock.exchange, stock.type],
    (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      console.log('Data inserted successfully:', result);
    }
  );
};

const saveStocks = async () => {
  try {
    const stocksFile = 'stocks/result/final/stocks_dart_update.json';
    const stocks = JSON.parse(fs.readFileSync(stocksFile, 'utf8'));

    for (const stock of stocks) {
      if (stock.exchange === 'KSC') {
        saveKrStock(stock);
        continue;
      }
      saveUsStock(stock);
    }

    connection.end();
  } catch (err) {
    connection.end();
    console.log(err);
  }
};

const saveKrStockDetail = (stock) => {
  const krQuery = `insert into kr_stocks (symbol, name, exchange, type, corp_code) values (?, ?, ?, ?, ?)`;

  connection.query(
    krQuery,
    [stock.symbol, stock.name, stock.exchange, stock.type, corp_code],
    (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      console.log('Data inserted successfully:', result);
    }
  );
};

const saveUsStockDetail = (stock) => {
  const usQuery = `insert into us_stocks (symbol, name, exchange, type) values (?, ?, ?, ?)`;

  connection.query(
    usQuery,
    [stock.symbol, stock.name, stock.exchange, stock.type],
    (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      console.log('Data inserted successfully:', result);
    }
  );
};

connection.end();
