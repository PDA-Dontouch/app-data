import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

const getStockList = async () => {
  try {
    const url = `https://financialmodelingprep.com/api/v3/symbol/available-indexes?apikey=${process.env.FMP_API_KEY}`;
    const resp = await axios.get(url);
    const stocks = resp.data;

    fs.writeFileSync('allStocks.json', JSON.stringify(stocks, null, 2));
    // const filteredStocks = stocks.filter(stock => stock.exchange === 'KSE' || stock.exchange === )
    console.log(stocks);
  } catch (err) {
    console.log(err);
  }
};

dotenv.config();
