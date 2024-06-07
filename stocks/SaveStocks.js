import mysql from 'mysql2';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
let connection;

const connect = () => {
  connection = mysql.createConnection({
    host: process.env.STOCK_DB_HOST,
    user: process.env.STOCK_DB_USER,
    password: process.env.STOCK_DB_PASSWORD,
    database: process.env.STOCK_DB_DATABASE,
  });
};

const saveKrStock = (stock) => {
  const krQuery = `insert into kr_stocks (symbol, name, exchange, type, corp_code) values (?, ?, ?, ?, ?)`;

  connection.query(
    krQuery,
    [stock.symbol, stock.name, stock.exchange, stock.type, stock.corp_code],
    (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      console.log('Data inserted successfully:', result);
    }
  );
};

const saveUsStock = (stock) => {
  const usQuery = `insert into us_stocks (symbol, name, exchange, type) values (?, ?, ?, ?)`;
};

const saveStocks = () => {
  try {
    connect();
  } catch (err) {
    console.log(err);
  }
};

saveStocks();
