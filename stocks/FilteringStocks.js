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

const filterStocksToUse = () => {
  try {
    const allStocksFile = 'stocks/result/allStocks.json';
    const allStocks = JSON.parse(fs.readFileSync(allStocksFile, 'utf8'));

    const filteredStocks = allStocks.filter((stock) => isStockToUse(stock));

    fs.writeFileSync(
      '/stocks/result/filteredStocks2.json',
      JSON.stringify(filteredStocks, null, 2)
    );

    console.log(filteredStocks.length);
  } catch (err) {
    console.log(err);
  }
};

const filterDividendStocksToUse = async () => {
  try {
    const allStocksFile = 'stocks/result/allStocks.json';
    const dividendStocksFile = 'stocks/result/dividendStocks.json';

    const allStocks = JSON.parse(fs.readFileSync(allStocksFile, 'utf8'));
    const dividendStocks = JSON.parse(
      fs.readFileSync(dividendStocksFile, 'utf8')
    );

    console.log(filteredStocks.length);
  } catch (err) {
    console.log(err);
  }
};
