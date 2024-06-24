import mysql from 'mysql2';
import dotenv from 'dotenv';
import fs from 'fs';

import { getFormattedDate } from './utils.js';
import { updateClosePrice } from './batchClosePrice.js';
import { updateDividendCalendar } from './batchDividendCalendar.js';

const pool = mysql.createPool({
  connectionLimit: 150,
  host: process.env.STOCK_DB_HOST,
  user: process.env.STOCK_DB_USER,
  password: process.env.STOCK_DB_PASSWORD,
  database: process.env.STOCK_DB_DATABASE,
});

const main = async () => {
  try {
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 14);

    const from = getFormattedDate(oneWeekAgo);
    const to = getFormattedDate(today);

    console.log(`batch date: ${from} ~ ${to}`);

    await Promise.all([
      // updateClosePrice('kr', from, to, pool),
      // updateClosePrice('us', from, to, pool),
      // updateDividendCalendar('kr', '2023-01-01', pool),
      updateDividendCalendar('us', '2023-01-01', pool),
    ]);
  } catch (error) {
    console.error('Error updating close prices:', error);
  } finally {
    pool.end();
  }
};

main();
