import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';

const app = express();
const port = 3000;

const urls = {
    korea: 'https://finance.naver.com/sise/',
    nasdaq: 'https://finance.naver.com/world/sise.naver?symbol=NAS@IXIC',
    sp500: 'https://finance.naver.com/world/sise.naver?symbol=SPI@SPX'
};

const parseChangeAndPercent = (changeStr) => {
    const [change, percent] = changeStr.split(' ');
    const parsedChange = parseFloat(change.replace(/,/g, ''));
    const parsedPercent = parseFloat(percent.replace('%', ''));

    return {
        change: parsedPercent < 0 ? -Math.abs(parsedChange) : parsedChange,
        percent: parsedPercent
    };
};

const fetchKoreanStockData = async () => {
    try {
        const response = await axios.get(urls.korea);
        const html = response.data;
        const $ = cheerio.load(html);

        const kospiData = $('#KOSPI_change').text().trim().replace(/\s+/g, ' ');
        const kosdaqData = $('#KOSDAQ_change').text().trim().replace(/\s+/g, ' ');

        const kospiParsed = parseChangeAndPercent(kospiData);
        const kosdaqParsed = parseChangeAndPercent(kosdaqData);

        const kospi = {
            index: parseFloat($('#KOSPI_now').text().replace(/,/g, '')),
            change: kospiParsed.change,
            percent: kospiParsed.percent
        };

        const kosdaq = {
            index: parseFloat($('#KOSDAQ_now').text().replace(/,/g, '')),
            change: kosdaqParsed.change,
            percent: kosdaqParsed.percent
        };

        return { kospi, kosdaq };
    } catch (error) {
        console.error('한국 주식 오류:', error);
    }
};

const parseWorldStockData = ($) => {
    const index = $('.no_today .no_up span, .no_today .no_down span')
        .map((i, el) => $(el).text())
        .get()
        .join('')
        .replace(/,/g, '');

    const change = $('.no_exday .no_up, .no_exday .no_down').first().text().trim();
    const percentElement = $('#content > div.rate_info > div.today > p.no_exday > em:nth-child(3) > span.parenthesis1')
        .nextUntil('span.parenthesis2')
        .map((i, el) => $(el).text())
        .get()
        .join('');
    const percent = percentElement.replace('(', '').replace(')', '').trim();

    return {
        index: parseFloat(index),
        ...parseChangeAndPercent(`${change} ${percent}`)
    };
};

const fetchNasdaqData = async () => {
    try {
        const response = await axios.get(urls.nasdaq);
        const html = response.data;
        const $ = cheerio.load(html);

        return parseWorldStockData($);
    } catch (error) {
        console.error('나스닥 오류:', error);
    }
};

const fetchSp500Data = async () => {
    try {
        const response = await axios.get(urls.sp500);
        const html = response.data;
        const $ = cheerio.load(html);

        return parseWorldStockData($);
    } catch (error) {
        console.error('S&P 500 오류:', error);
    }
};

const fetchStockData = async () => {
    const koreanStockData = await fetchKoreanStockData();
    const nasdaqData = await fetchNasdaqData();
    const sp500Data = await fetchSp500Data();

    return {
        korean: koreanStockData,
        world: {
            nasdaq: nasdaqData,
            sp500: sp500Data
        }
    };
};

app.get('/stocks/index', async (req, res) => {
    try {
        const data = await fetchStockData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: '데이터를 가져오는 중 오류가 발생했습니다.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
