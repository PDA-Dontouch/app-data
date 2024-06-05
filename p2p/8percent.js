const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');

const dealIds = [
    58394, 58395, 58416, 58392, 58384, 58390, 58385, 58383, 58388, 58387, 58386, 
    58393, 58321, 58322, 58259, 58317, 58319, 58320, 58257, 58255, 58256, 58221, 
    58253, 58252, 58229, 58219, 58224, 58227, 58225, 58222, 58218, 58156, 58190, 
    58185, 58159, 58158, 58188, 58186, 58152, 58153, 58154, 58121, 58120, 58122, 
    58090, 58087, 58092, 58088, 58093, 58091
];

const API_URL_TEMPLATE = "https://core-api.8percent.kr/api/deals/";

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
