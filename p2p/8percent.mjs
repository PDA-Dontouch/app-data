import axios from 'axios';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import fs from 'fs';

const DEALS_API_URL = "https://events.8percent.kr/api/deals?category=real-estate-special&closed=true&page=1&page_size=50&ordering=-completed_datetime";
const API_URL_TEMPLATE = "https://core-api.8percent.kr/api/deals/";

async function fetchDealIds() {
    try {
        const response = await axios.get(DEALS_API_URL);
        const deals = response.data.results;
        return deals.map(deal => deal.id);
    } catch (error) {
        console.error(`Deal IDs 불러오기 실패: ${error.response ? error.response.status : error.message}`);
        return [];
    }
}

async function fetchDealData(dealId) {
    const url = `${API_URL_TEMPLATE}${dealId}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(` ${dealId} 번 불러오기 실패: ${error.response ? error.response.status : error.message}`);
        return null;
    }
}

function serializeObject(ob) {
    const toReturn = {};

    for (let i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if (typeof ob[i] === 'object' && ob[i] !== null) {
            toReturn[i] = JSON.stringify(ob[i]);
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

async function saveToCsv(dataList, filename) {
    if (dataList.length === 0) {
        console.log("종목이 존재하지 않습니다.");
        return;
    }

    const serializedDataList = dataList.map(data => serializeObject(data));
    const headers = Object.keys(serializedDataList[0]).map(key => ({ id: key, title: key }));
    const csvWriter = createCsvWriter({
        path: filename,
        header: headers
    });

    await csvWriter.writeRecords(serializedDataList);

    const BOM = '\uFEFF';
    const csvData = fs.readFileSync(filename, 'utf8');
    fs.writeFileSync(filename, BOM + csvData, 'utf8');

    console.log(`저장 완료`);
}

async function main() {
    const dealIds = await fetchDealIds();
    if (dealIds.length === 0) {
        console.log("Deal IDs를 찾을 수 없습니다.");
        return;
    }

    const allData = [];
    for (const dealId of dealIds) {
        console.log(`${dealId}번 종목 저장 중`);
        const data = await fetchDealData(dealId);
        if (data) {
            allData.push(data);  
        }
    }

    if (allData.length > 0) {
        await saveToCsv(allData, "8percent.csv");
    }
}

main();
