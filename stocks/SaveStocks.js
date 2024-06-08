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

// insert symbol, name, exchange, type, corp_code
// kr_stocks
const saveKrStock = (stock) => {
  let corp_code = null;
  if (stock.type === 'stock') {
    corp_code = stock.corp_code;
  }

  const krQuery = `insert into kr_stocks (symbol, name, exchange, type, corp_code) values (?, ?, ?, ?, ?)`;

  connection.query(
    krQuery,
    [stock.symbol, stock.name, stock.exchange, stock.type, corp_code],
    (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      console.log('Data inserted successfully:', result);
    }
  );
};

// insert symbol, name, exchange, type
// us_stocks
const saveUsStock = (stock) => {
  const usQuery = `insert into us_stocks (symbol, name, exchange, type) values (?, ?, ?, ?)`;

  connection.query(
    usQuery,
    [stock.symbol, stock.name, stock.exchange, stock.type],
    (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      console.log('Data inserted successfully:', result);
    }
  );
};

const saveStocks = async () => {
  try {
    const stocksFile = 'stocks/result/final/stocks_dart_update.json';
    const stocks = JSON.parse(fs.readFileSync(stocksFile, 'utf8'));

    for (const stock of stocks) {
      if (stock.exchange === 'KSC') {
        saveKrStock(stock);
        continue;
      }
      saveUsStock(stock);
    }

    connection.end();
  } catch (err) {
    connection.end();
    console.log(err);
  }
};

const saveStockDetail = (nation, stock) => {
  const query = `insert into ${nation}_stock_details (
    market_cap,
    altman_z_score,
    piotroski_score,
    ten_y_revenue_growth_per_share,
    five_y_revenue_growth_per_share,
    three_y_revenue_growth_per_share,
    ten_y_operating_cf_growth_per_share,
    five_y_operating_cf_growth_per_share,
    three_y_operating_cf_growth_per_share,
    ten_y_net_income_growth_per_share,
    five_y_net_income_growth_per_share,
    three_y_net_income_growth_per_share,
    ten_y_shareholders_equity_growth_per_share,
    five_y_shareholders_equity_growth_per_share,
    three_y_shareholders_equity_growth_per_share,
    ten_y_dividend_per_share_growth_per_share,
    five_y_dividend_per_share_growth_per_share,
    three_y_dividend_per_share_growth_per_share,
    symbol
  ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  connection.query(
    query,
    [
      stock.market_cap,
      stock.altman_z_score,
      stock.piotroski_score,
      stock.ten_y_revenue_growth_per_share,
      stock.five_y_revenue_growth_per_share,
      stock.three_y_revenue_growth_per_share,
      stock.ten_y_operating_cf_growth_per_share,
      stock.five_y_operating_cf_growth_per_share,
      stock.three_y_operating_cf_growth_per_share,
      stock.ten_y_net_income_growth_per_share,
      stock.five_y_net_income_growth_per_share,
      stock.three_y_net_income_growth_per_share,
      stock.ten_y_shareholders_equity_growth_per_share,
      stock.five_y_shareholders_equity_growth_per_share,
      stock.three_y_shareholders_equity_growth_per_share,
      stock.ten_y_dividend_per_share_growth_per_share,
      stock.five_y_dividend_per_share_growth_per_share,
      stock.three_y_dividend_per_share_growth_per_share,
      stock.symbol,
    ],
    (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      console.log('Data inserted successfully:', result);
    }
  );
};

const saveStockDetails = (nation) => {
  try {
    const stockDetailsFile = `stocks/result/final/${nation}_stock_details.json`;
    const stockDetails = JSON.parse(fs.readFileSync(stockDetailsFile, 'utf8'));

    for (const stockDetail of stockDetails) {
      saveStockDetail(nation, stockDetail);
    }
  } catch (err) {
    console.log(err);
  }
};

const saveDividendInfo = (nation, dividendInfo) => {
  const query = `insert into ${nation}_stock_dividend_info (symbol, ${nation}_stock_dividend_payment_date, ${nation}_stock_dividend_date, dividend, is_fixed) values (?, ?, ?, ?, ?)`;

  connection.query(
    query,
    [
      dividendInfo.symbol,
      dividendInfo.payment_date,
      dividendInfo.date,
      dividendInfo.dividend,
      true,
    ],
    (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return;
      }
      console.log('Data inserted successfully:', result);
    }
  );
};

const saveDividendInfos = () => {
  try {
    const dividendsFile = 'stocks/result/final/dividend_calendar.json';
    const dividends = JSON.parse(fs.readFileSync(dividendsFile, 'utf8'));

    for (const dividend of dividends) {
      let nation = 'us';
      if (dividend.symbol.slice(-3) === '.KS') {
        nation = 'kr';
        saveDividendInfo(nation, dividend);
      }

      // saveDividendInfo(nation, dividend);
    }
  } catch (err) {
    console.log(err);
  }
};

// saveDividendInfos();
// saveStockDetails('us');

connection.end();
