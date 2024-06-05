import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

export const getAllStocks = async () => {
  try {
    const url = `https://financialmodelingprep.com/api/v3/symbol/available-indexes?apikey=${process.env.FMP_API_KEY}`;
    const resp = await axios.get(url);
    const allStocks = resp.data;

    fs.writeFileSync(
      'stocks/result/allStocks.json',
      JSON.stringify(allStocks, null, 2)
    );

    console.log('allStocks: ', allStocks.length);
  } catch (err) {
    console.log(err);
  }
};

export const getDividendCalendar = async (start_date, end_date) => {
  try {
    const url = `https://financialmodelingprep.com/api/v3/stock_dividend_calendar?from=${start_date}&to=${end_date}&apikey=${process.env.FMP_API_KEY}`;
    const resp = await axios.get(url);
    const dividendCalendar = resp.data;

    fs.writeFileSync(
      'stocks/result/dividendCalendar.json',
      JSON.stringify(dividendCalendar, null, 2)
    );

    console.log('dividendCalendar: ', dividendCalendar.length);
  } catch (err) {
    console.log(err);
  }
};

getDividendCalendar('2024-01-01', '2024-06-04');
