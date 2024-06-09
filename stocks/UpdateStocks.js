import mysql from 'mysql2';
import dotenv from 'dotenv';
import axios from 'axios';

import { getStocks } from './GetStocks';

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.STOCK_DB_HOST,
  user: process.env.STOCK_DB_USER,
  password: process.env.STOCK_DB_PASSWORD,
  database: process.env.STOCK_DB_DATABASE,
});

// 주가 변동 업데이트 (전체)

// stock에 배당률 업데이트

connection.end();
