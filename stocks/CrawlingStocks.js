import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

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

const getDividendCalendar = async (start_date, end_date) => {
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

getStockScores('us');
// getDividendCalendar('2024-01-01', '2024-06-04');
// getStockGrowth('us');
