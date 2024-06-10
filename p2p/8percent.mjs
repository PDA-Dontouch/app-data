import axios from 'axios';
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

function flattenObject(ob) {
    const result = {};

    function recurse(cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            for (let i = 0; i < cur.length; i++) {
                recurse(cur[i], prop + "[" + i + "]");
            }
            if (cur.length === 0) result[prop] = [];
        } else {
            let isEmpty = true;
            for (const p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop + "_" + p : p);
            }
            if (isEmpty && prop) result[prop] = {};
        }
    }

    recurse(ob, "");
    return result;
}

async function saveToJson(dataList, filename) {
    if (dataList.length === 0) {
        console.log("종목이 존재하지 않습니다.");
        return;
    }

    const flattenedDataList = dataList.map(data => flattenObject(data));
    fs.writeFileSync(filename, JSON.stringify(flattenedDataList, null, 2), 'utf8');
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
        await saveToJson(allData, "8percent.json");
    }
}

main();
