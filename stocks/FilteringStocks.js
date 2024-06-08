import fs from 'fs';

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

// filter nasdaq, nyse, ksc
const filterStocksInUsingMarket = () => {
  try {
    const allStocksFile = 'stocks/result/allStocks.json';
    const allStocks = JSON.parse(fs.readFileSync(allStocksFile, 'utf8'));

    const stocksInUsingMarket = allStocks.filter((stock) =>
      isStockToUse(stock)
    );

    fs.writeFileSync(
      'stocks/result/stocksInUsingMarket.json',
      JSON.stringify(stocksInUsingMarket, null, 2)
    );

    console.log('stocksInUsingMarket: ', stocksInUsingMarket.length);
  } catch (err) {
    console.log(err);
  }
};

// filter stocks gave dividend
const filterDividendStocks = () => {
  try {
    const stocksInUsingMarketFile = 'stocks/result/stocks_in_using_market.json';
    const dividendCalendarFile =
      'stocks/result/processed_dividend_calendar.json';

    const stocksInUsingMarket = JSON.parse(
      fs.readFileSync(stocksInUsingMarketFile, 'utf8')
    );
    const dividendCalendar = JSON.parse(
      fs.readFileSync(dividendCalendarFile, 'utf8')
    );

    const stockSymbolsInUsingMarket = new Set(
      stocksInUsingMarket.map((dividend) => dividend.symbol)
    );

    const filtereddividendCalendar = dividendCalendar.filter((dividend) =>
      stockSymbolsInUsingMarket.has(dividend.symbol)
    );

    fs.writeFileSync(
      'stocks/result/final/dividend_calendar.json',
      JSON.stringify(filtereddividendCalendar, null, 2)
    );

    console.log('dividendStocks: ', filtereddividendCalendar.length);
  } catch (err) {
    console.log(err);
  }
};

// filtering response of dart api
const filterStocksHaveStockCode = () => {
  const corpsFile = 'stocks/result/used/corpCodes.json';

  const corps = JSON.parse(fs.readFileSync(corpsFile, 'utf8')).result.list;

  const filteredCorps = corps
    .filter((corp) => corp.stock_code[0].trim() !== '')
    .map((corp) => ({
      corp_code: corp.corp_code[0],
      corp_name: corp.corp_name[0],
      stock_code: corp.stock_code[0],
      modify_date: corp.modify_date[0],
    }));

  fs.writeFileSync(
    'stocks/result/final/dartCorps.json',
    JSON.stringify(filteredCorps, null, 2)
  );
};

const filterEconomicCalendar = () => {
  const calendarFile = 'stocks/result/final/economic_calendar_krw_usd.json';

  const calendar = JSON.parse(fs.readFileSync(calendarFile, 'utf8'));

  const filteredCalendar = calendar.filter((issue) => issue.impact !== 'Low');

  fs.writeFileSync(
    'stocks/result/final/economic_calendar_not_low',
    JSON.stringify(filteredCalendar, null, 2)
  );
};

filterEconomicCalendar();

// filterStocksInUsingMarket();
// filterDividendStocks();
// filterStocksHaveStockCode();
