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
