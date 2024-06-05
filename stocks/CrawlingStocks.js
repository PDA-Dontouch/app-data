import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

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

  console.log('true: ', stock.type, ' ', stock.exchangeShortName);
  return true;
};

const filterStocks = () => {
  try {
    const allStocksFile = 'stocks/allStocks.json';
    const jsonArray = JSON.parse(fs.readFileSync(allStocksFile, 'utf8'));

    const filteredStocks = jsonArray.filter((stock) => isStockToUse(stock));

    fs.writeFileSync(
      'filteredStocks.json',
      JSON.stringify(filteredStocks, null, 2)
    );

    console.log(filteredStocks);
  } catch (err) {
    console.log(err);
  }
};
