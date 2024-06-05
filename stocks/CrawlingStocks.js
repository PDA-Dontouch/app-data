import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const getAllStocks = async () => {
  try {
    const url = `https://financialmodelingprep.com/api/v3/symbol/available-indexes?apikey=${process.env.FMP_API_KEY}`;
    const resp = await axios.get(url);
    const stocks = resp.data;

    fs.writeFileSync(
      'stocks/result/allStocks.json',
      JSON.stringify(stocks, null, 2)
    );

    console.log(stocks);
  } catch (err) {
    console.log(err);
  }
};

const getDividendCalendar = async () => {
  try {
    const start_date = '2024-12-01';
    const end_date = '2024-06-04';

    const url = `https://financialmodelingprep.com/api/v3/stock_dividend_calendar?from=${start_date}&to=${end_date}&apikey=${process.env.FMP_API_KEY}`;
    const resp = await axios.get(url);
    const dividendCalendar = resp.data;

    fs.writeFileSync(
      'stocks/result/dividendCalendar.json',
      JSON.stringify(dividendCalendar, null, 2)
    );
  } catch (err) {
    console.log(err);
  }
};
