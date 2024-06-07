import mysql from 'mysql2';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const stockConnectionConfig = {
  host: process.env.STOCK_DB_HOST,
  user: process.env.STOCK_DB_USER,
  password: process.env.STOCK_DB_PASSWORD,
  database: table,
};

const saveTest = async () => {
  try {
    const stockConnection = await mysql.createConnection(stockConnectionConfig);

    const testStock = {};
  } catch (err) {
    console.log(err);
  }
};
