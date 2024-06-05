import axios from 'axios';
import cheerio from 'cheerio';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import fs from 'fs';

const urlTemplate = "https://www.solarbridge.kr/product/detail/A000{}";
const allData = [];

const fetchProductDetails = async (i) => {
    const url = urlTemplate.replace("{}", i);
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const html = response.data.toString('utf8');
        const $ = cheerio.load(html);

        const productNameDiv = $('div.m-t-10.c-white.f-25');
        const productName = productNameDiv.text().trim();
        if (!productName) {
            console.log(`상품명 정보를 찾을 수 없습니다: ${url}`);
            return null;
        }

        const tableData = $('div.m-t-5.c-white.f-32');
        const annualYield = tableData.eq(0).text().trim() || "해당 영역 데이터 반환 오류 발생";
        const investmentPeriod = tableData.eq(1).text().trim() || "해당 영역 데이터 반환 오류 발생";
        const fundingAmount = tableData.eq(2).text().trim() || "해당 영역 데이터 반환 오류 발생";

        const borrowerInfoSection = $('div.border-1.p-40');
        const borrowerInfo = borrowerInfoSection.text().trim() || "해당 영역 데이터 반환 오류 발생";

        const productSummarySection = $('#ivqm_1_focus');
        const productSummary = productSummarySection.text().trim() || "해당 영역 데이터 반환 오류 발생";

        const businessSummarySection = $('#ivqm_2_focus');
        const businessSummary = businessSummarySection.text().trim() || "해당 영역 데이터 반환 오류 발생";
        const businessSummaryImages = [];
        businessSummarySection.find('img').each((index, element) => {
            businessSummaryImages.push($(element).attr('src'));
        });

        const repaymentResourcesSection = $('#ivqm_3_focus');
        const repaymentResources = repaymentResourcesSection.text().trim() || "해당 영역 데이터 반환 오류 발생";

        const investorProtectionSection = $('#ivqm_4_focus');
        const investorProtection = investorProtectionSection.text().trim() || "해당 영역 데이터 반환 오류 발생";

        return {
            "상품명": productName,
            "연수익률": annualYield,
            "투자기간": investmentPeriod,
            "모집금액": fundingAmount,
            "근저당계약 등": borrowerInfo,
            "상품개요": productSummary,
            "사업개요": businessSummary,
            "사업개요 이미지 링크": businessSummaryImages.join(', '),
            "상환재원": repaymentResources,
            "투자자 보호": investorProtection
        };
    } catch (error) {
        console.log(`존재하지 않는 페이지입니다: ${url}`);
        return null;
    }
};

const main = async () => {
    for (let i = 400; i <= 500; i++) {
        const data = await fetchProductDetails(i);
        if (data) {
            allData.push(data);
        } else {
            continue; 
        }
    }

    if (allData.length > 0) {
        const headers = Object.keys(allData[0]).map(key => ({ id: key, title: key }));
        const csvWriter = createCsvWriter({
            path: 'solarbridge_product_details.csv',
            header: headers
        });

        await csvWriter.writeRecords(allData);

        const BOM = '\uFEFF';
        const csvData = fs.readFileSync('solarbridge_product_details.csv', 'utf8');
        fs.writeFileSync('solarbridge_product_details.csv', BOM + csvData, 'utf8');

        console.log("모든 데이터가  파일로 저장되었습니다.");
    }
};

main();
