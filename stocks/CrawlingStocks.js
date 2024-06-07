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

const getStockDetails = async () => {
  try {
    const dividendStocksFile = 'stocks/result/dividendStocks.json';
    const stockDetailsFile = 'stocks/result/stockDetails.json';

    const dividendStocks = JSON.parse(
      fs.readFileSync(dividendStocksFile, 'utf8')
    );
    const stockDetails = JSON.parse(fs.readFileSync(stockDetailsFile, 'utf8'));

    const stockDetailSymbols = new Set(
      stockDetails.map((stockDetail) => stockDetail.symbol)
    );

    for (const stock of dividendStocks) {
      if (!stockDetailSymbols.has(stock.symbol)) {
        const symbol = stock.symbol;

        console.log('symbol: ', symbol);

        // growth
        const growthUrl = `https://financialmodelingprep.com/api/v3/financial-growth/${symbol}?period=annual&limit=1&apikey=${process.env.FMP_API_KEY}`;
        const growthResp = await axios.get(growthUrl);
        const growth = growthResp.data[0];

        // score
        const scoreUrl = `https://financialmodelingprep.com/api/v4/score?symbol=${symbol}&apikey=${process.env.FMP_API_KEY}`;
        const scoreResp = await axios.get(scoreUrl);
        const score = scoreResp.data[0];

        // 둘 중 하나라도 null이면 종료
        if (growthResp == null || scoreResp == null) {
          // write
          fs.writeFileSync(
            'stocks/result/stockDetails.json',
            JSON.stringify(stockDetails, null, 2)
          );
          await delay(60000);
        }

        const stockDetail = {
          symbol: symbol,
          market_cap: score.marketCap,
          altman_z_score: score.altmanZScore,
          piotroski_score: score.piotroskiScore,
          ten_y_revenue_growth_per_share: growth.tenYRevenueGrowthPerShare,
          five_y_revenue_growth_per_share: growth.fiveYRevenueGrowthPerShare,
          three_y_revenue_growth_per_share: growth.threeYRevenueGrowthPerShare,
          ten_y_operating_cf_growth_per_share:
            growth.tenYOperatingCFGrowthPerShare,
          five_y_operating_cf_growth_per_share:
            growth.fiveYOperatingCFGrowthPerShare,
          three_y_operating_cf_growth_per_share:
            growth.threeYOperatingCFGrowthPerShare,
          ten_y_net_income_growth_per_share: growth.tenYNetIncomeGrowthPerShare,
          five_y_net_income_growth_per_share:
            growth.fiveYNetIncomeGrowthPerShare,
          three_y_net_income_growth_per_share:
            growth.threeYNetIncomeGrowthPerShare,
          ten_y_shareholders_equity_growth_per_share:
            growth.tenYShareholdersEquityGrowthPerShare,
          five_y_shareholders_equity_growth_per_share:
            growth.fiveYShareholdersEquityGrowthPerShare,
          three_y_shareholders_equity_growth_per_share:
            growth.threeYShareholdersEquityGrowthPerShare,
          ten_y_dividend_per_share_growth_per_share:
            growth.tenYDividendperShareGrowthPerShare,
          five_y_dividend_per_share_growth_per_share:
            growth.fiveYDividendperShareGrowthPerShare,
          three_y_dividend_per_share_growth_per_share:
            growth.threeYDividendperShareGrowthPerShare,
        };

        // push
        stockDetails.push(stockDetail);

        // test
        break;
      }
    }

    // write
    fs.writeFileSync(
      'stocks/result/stockDetails.json',
      JSON.stringify(stockDetails, null, 2)
    );
  } catch (err) {
    console.log(err);
  }
};

// getDividendCalendar('2024-01-01', '2024-06-04');

getStockDetails();
