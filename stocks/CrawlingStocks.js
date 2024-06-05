import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const getAllStock = async () => {
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

const isStockToUse = (stock) => {
  if (stock.type != 'stock' && stock.type != 'etf') {
    return false;
  }

  if (
    stock.exchangeShortName != 'NASDAQ' &&
    stock.exchangeShortName != 'NYSE' &&
    stock.exchangeShortName != 'KSC'
  ) {
    return false;
  }

  return true;
};

const filterStockToUse = () => {
  try {
    const allStocksFile = 'stocks/result/allStocks.json';
    const jsonArray = JSON.parse(fs.readFileSync(allStocksFile, 'utf8'));

    const filteredStocks = jsonArray.filter((stock) => isStockToUse(stock));

    fs.writeFileSync(
      '/stocks/result/filteredStocks2.json',
      JSON.stringify(filteredStocks, null, 2)
    );

    console.log(filteredStocks.length);
  } catch (err) {
    console.log(err);
  }
};

const getDividendStock = async () => {
  try {
    const url = `https://financialmodelingprep.com/api/v3/stock_dividend_calendar?from=2024-12-04&to=2024-06-04&apikey=${process.env.FMP_API_KEY}`;
    const resp = await axios.get(url);
    const dividendStocks = resp.data;

    fs.writeFileSync(
      'stocks/result/dividendStocks.json',
      JSON.stringify(dividendStocks, null, 2)
    );
  } catch (err) {
    console.log(err);
  }
};
