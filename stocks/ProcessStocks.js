import fs from 'fs';

const processStocks1 = () => {
  try {
    const stocksFile = 'stocks/result/dividendStocks.json';
    const stocks = JSON.parse(fs.readFileSync(stocksFile, 'utf8'));

    const filteredStocks = stocks.map((stock) => ({
      symbol: stock.symbol,
      name: stock.name,
      exchange: stock.exchangeShortName,
      type: stock.type,
    }));

    fs.writeFileSync(
      'stocks/result/final/stocks.json',
      JSON.stringify(filteredStocks, null, 2)
    );
  } catch (err) {
    console.log(err);
  }
};

const processStocks2 = () => {
  try {
    const stocksFile = 'stocks/result/final/stocks.json';
    const stocks = JSON.parse(fs.readFileSync(stocksFile, 'utf8'));

    const dartCorpsFile = 'stocks/result/dartCorps.json';
    const dartCorps = JSON.parse(fs.readFileSync(dartCorpsFile, 'utf8'));

    const processedStocks = stocks.map((stock) => {
      const filteredCorp = dartCorps.filter(
        (corp) => corp.stock_code === stock.symbol.slice(0, -3)
      );

      if (filteredCorp.length > 0) {
        console.log(stock.symbol, ' === ');
        console.log(filteredCorp, '\n\n');

        return {
          symbol: stock.symbol,
          name: filteredCorp[0].corp_name,
          exchange: stock.exchange,
          type: stock.type,
          corp_code: filteredCorp[0].corp_code,
        };
      }

      return stock;
    });

    fs.writeFileSync(
      'stocks/result/final/stocks_dart_update.json',
      JSON.stringify(processedStocks, null, 2)
    );
  } catch (err) {
    console.log(err);
  }
};

// processStocks2();
