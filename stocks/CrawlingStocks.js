import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import { connect } from 'http2';
import mysql from 'mysql2';

dotenv.config();

const getAllStocks = async () => {
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

const getDividendCalendar = async (nation) => {
  const connection = mysql.createConnection({
    host: process.env.STOCK_DB_HOST,
    user: process.env.STOCK_DB_USER,
    password: process.env.STOCK_DB_PASSWORD,
    database: process.env.STOCK_DB_DATABASE,
  });

  const stocksFile = `stocks/result/final/${nation}_stocks_symbols.json`;

  const stocks = JSON.parse(fs.readFileSync(stocksFile, 'utf8'));

  const insertQuery = `insert ${nation}_stock_dividend_fixed (symbol, dividend, dividend_date, payment_date) values (?, ?, ?, ?)`;

  for (const stock of stocks) {
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${stock.symbol}?apikey=${process.env.FMP_API_KEY}`;
    const dividends = (await axios.get(url)).data.historical;

    console.log('requested ', stock.symbol);

    const filteredDividends = dividends.filter(
      (dividend) =>
        dividend.date.substring(0, 4) === '2023' ||
        dividend.date.substring(0, 4) === '2024'
    );

    filteredDividends.reverse();

    const promises = filteredDividends.map(
      (dividend) =>
        new Promise((resolve, reject) => {
          connection.query(
            insertQuery,
            [
              stock.symbol,
              dividend.dividend,
              dividend.date,
              dividend.paymentDate || null,
            ],
            (err, result) => {
              if (err) {
                console.log(err);
                return reject();
              }

              resolve();
            }
          );
        })
    );

    await Promise.all(promises);
    console.log('saved ', stock.symbol);
  }
  connection.end();
};

const getStockGrowths = async (nation) => {
  try {
    const stocksFile = `stocks/result/final/${nation}_stocks.json`;
    const stocksGrowthFile = `stocks/result/final/${nation}_stocks_growth.json`;

    const stocks = JSON.parse(fs.readFileSync(stocksFile, 'utf8'));
    const stocksGrowth = JSON.parse(fs.readFileSync(stocksGrowthFile, 'utf8'));

    const stockSymbolsAlreadyGot = new Set(
      stocksGrowth.map((stockDetail) => stockDetail.symbol)
    );

    for (const stock of stocks) {
      if (stock.type === 'etf') {
        continue;
      }

      if (!stockSymbolsAlreadyGot.has(stock.symbol)) {
        console.log('symbol: ', stock.symbol, ', type: ', stock.type);

        const growthUrl = `https://financialmodelingprep.com/api/v3/financial-growth/${stock.symbol}?period=annual&limit=1&apikey=${process.env.FMP_API_KEY}`;
        const growthResp = await axios.get(growthUrl);
        const growth = growthResp.data[0];

        if (growth == null) {
          continue;
        }

        const growthToSave = {
          symbol: symbol,
          ten_y_revenue_growth_per_share:
            growth.tenYRevenueGrowthPerShare || null,
          five_y_revenue_growth_per_share:
            growth.fiveYRevenueGrowthPerShare || null,
          three_y_revenue_growth_per_share:
            growth.threeYRevenueGrowthPerShare || null,
          ten_y_operating_cf_growth_per_share:
            growth.tenYOperatingCFGrowthPerShare || null,
          five_y_operating_cf_growth_per_share:
            growth.fiveYOperatingCFGrowthPerShare || null,
          three_y_operating_cf_growth_per_share:
            growth.threeYOperatingCFGrowthPerShare || null,
          ten_y_net_income_growth_per_share:
            growth.tenYNetIncomeGrowthPerShare || null,
          five_y_net_income_growth_per_share:
            growth.fiveYNetIncomeGrowthPerShare || null,
          three_y_net_income_growth_per_share:
            growth.threeYNetIncomeGrowthPerShare || null,
          ten_y_shareholders_equity_growth_per_share:
            growth.tenYShareholdersEquityGrowthPerShare || null,
          five_y_shareholders_equity_growth_per_share:
            growth.fiveYShareholdersEquityGrowthPerShare || null,
          three_y_shareholders_equity_growth_per_share:
            growth.threeYShareholdersEquityGrowthPerShare || null,
          ten_y_dividend_per_share_growth_per_share:
            growth.tenYDividendperShareGrowthPerShare || null,
          five_y_dividend_per_share_growth_per_share:
            growth.fiveYDividendperShareGrowthPerShare || null,
          three_y_dividend_per_share_growth_per_share:
            growth.threeYDividendperShareGrowthPerShare || null,
        };

        stocksGrowth.push(growthToSave);

        console.log('saved ', stock.symbol);
      }
    }

    fs.writeFileSync(
      `stocks/result/final/${nation}_stocks_growth.json`,
      JSON.stringify(stocksGrowth, null, 2)
    );
  } catch (err) {
    console.log(err);
  }
};

const getStockScores = async (nation) => {
  const stocksFile = `stocks/result/${nation}_stock_growths.json`;
  const stockDetailsFile = `stocks/result/final/${nation}_stock_details.json`;

  const stocks = JSON.parse(fs.readFileSync(stocksFile, 'utf8'));
  const stockDetails = JSON.parse(fs.readFileSync(stockDetailsFile, 'utf8'));

  const stockSymbolsAlreadyGot = new Set(
    stockDetails.map((stockDetail) => stockDetail.symbol)
  );

  for (const stock of stocks) {
    if (!stockSymbolsAlreadyGot.has(stock.symbol)) {
      const scoreUrl = `https://financialmodelingprep.com/api/v4/score?symbol=${stock.symbol}&apikey=${process.env.FMP_API_KEY}`;

      const scoreResp = await axios.get(scoreUrl);
      const score = scoreResp.data[0];

      if (score == null) {
        continue;
      }

      const updatedStockDetail = {
        ...stock,
        altman_z_score: score.altmanZScore || null,
        piotroski_score: score.piotroskiScore || null,
        market_cap: score.marketCap || null,
      };

      stockDetails.push(updatedStockDetail);

      console.log('saved ', stock.symbol);
    }
  }

  fs.writeFileSync(
    `stocks/result/final/${nation}_stock_details.json`,
    JSON.stringify(stockDetails, null, 2)
  );
};

const getEconomicCalendar = async (startDate, endDate) => {
  const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${startDate}&to=${endDate}&apikey=${process.env.FMP_API_KEY}`;
  const resp = await axios.get(url);
  const economicCalendar = resp.data;

  fs.writeFileSync(
    `stocks/result/economic_calendar.json`,
    JSON.stringify(economicCalendar, null, 2)
  );
};

// save immediately
const getPrices = async (nation, startDate, endDate) => {
  const connection = mysql.createConnection({
    host: process.env.STOCK_DB_HOST,
    user: process.env.STOCK_DB_USER,
    password: process.env.STOCK_DB_PASSWORD,
    database: process.env.STOCK_DB_DATABASE,
  });
  const insertQuery = `insert into ${nation}_stock_prices (symbol, day, close_price) values (?, ?, ?)`;

  // const stocksFile = `stocks/result/final/${nation}_stocks.json`;

  const stocksFile = `stocks/result/final/us_stocks_3.json`;

  const stocks = JSON.parse(fs.readFileSync(stocksFile, 'utf8'));

  for (const stock of stocks) {
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${stock.symbol}?from=${startDate}&to=${endDate}&apikey=${process.env.FMP_API_KEY}`;

    const prices = (await axios.get(url)).data.historical;
    console.log(`requsted ${stock.symbol}`);

    if (!prices) {
      continue;
    }

    const promises = prices.map(
      (price) =>
        new Promise((resolve, reject) => {
          connection.query(
            insertQuery,
            [stock.symbol, price.date, price.close],
            (err, result) => {
              if (err) {
                console.log(err);
                return reject(err);
              }
              resolve();
            }
          );
        })
    );

    await Promise.all(promises);

    console.log(`saved ${stock.symbol}`);
  }

  connection.end();
};

// getEconomicCalendar('2023-01-01', '2024-06-07');
// getStockScores('us');
// getDividendCalendar('2023-01-01', '2024-06-09');
// getStockGrowth('us');

getDividendCalendar('us');
