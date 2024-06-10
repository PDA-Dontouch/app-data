import axios from 'axios';
import cheerio from 'cheerio';
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
        const annualYield = tableData.eq(0).text().trim() || "";
        const investmentPeriod = tableData.eq(1).text().trim() || "";
        const fundingAmount = tableData.eq(2).text().trim() || "";

        const borrowerInfoSection = $('div.border-1.p-40');
        const borrowerInfoItems = { "대출자 정보 1 제목": "", "대출자 정보 1 내용": "", "대출자 정보 2 제목": "", "대출자 정보 2 내용": "", "대출자 정보 3 제목": "", "대출자 정보 3 내용": "" };
        borrowerInfoSection.find('div.m-t-20').each((index, element) => {
            const title = $(element).find('div.border-left-4-navy').text().trim();
            const details = $(element).find('div.p-l-30.c-gray').text().trim();
            if (title && details) {
                borrowerInfoItems[`대출자 정보 ${index + 1} 제목`] = title;
                borrowerInfoItems[`대출자 정보 ${index + 1} 내용`] = details;
            }
        });

        const productSummarySection = $('#ivqm_1_focus');
        const productSummaryItems = {};

        productSummarySection.find('div.row.m-0').each((index, element) => {
            for (let j = 1; j <= 8; j++) { // 최대 12개의 자식 요소를 체크합니다.
                const keySelector = `#ivqm_1_focus > div:nth-child(${4}) > div > div:nth-child(${j * 2 - 1})`;
                const valueSelector = `#ivqm_1_focus > div:nth-child(${4}) > div > div:nth-child(${j * 2})`;

                const key = $(keySelector).text().trim();
                const value = $(valueSelector).text().trim();

                if (key) {
                    console.log(`Key ${j}: ${key}`);
                }
                if (value) {
                    console.log(`Value ${j}: ${value}`);
                }
                
                if (key && value) {
                    productSummaryItems[key] = value;
                }
            }
        });

        const businessSummarySection = $('#ivqm_2_focus');
        const businessSummaryItems = {};
        businessSummarySection.find('div.row.m-0').each((index, element) => {
            const key = $(element).find('div.col-sm-3.col-xs-12.f-600').text().trim();
            const value = $(element).find('div.col-sm-8.col-xs-12').text().trim();
            if (key && value) {
                businessSummaryItems[key] = value;
            }
        });
        const businessSummaryImages = [];
        businessSummarySection.find('img').each((index, element) => {
            businessSummaryImages.push($(element).attr('src'));
        });

        const repaymentResourcesSection = $('#ivqm_3_focus');
        const repaymentResources = repaymentResourcesSection.text().trim() || "";

        const investorProtectionSection = $('#ivqm_4_focus');
        const investorProtectionItems = {};
        investorProtectionSection.find('div.row.m-0').each((index, element) => {
            const key = $(element).find('div.col-sm-3.col-xs-12.f-600').text().trim();
            const value = $(element).find('div.col-sm-8.col-xs-12').text().trim();
            if (key && value) {
                investorProtectionItems[key] = value;
            }
        });

        return {
            "상품명": productName,
            "연수익률": annualYield,
            "투자기간": investmentPeriod,
            "모집금액": fundingAmount,
            ...borrowerInfoItems,
            ...productSummaryItems,
            "사업개요": businessSummarySection.find('div.f-16.c-fund').text().trim().replace('사업 개요', '').replace('현장 분석', '').trim() || "",
            "사업개요 이미지 링크": businessSummaryImages.join(', '),
            ...businessSummaryItems,
            "상환재원": repaymentResources,
            ...investorProtectionItems
        };
    } catch (error) {
        console.log(`존재하지 않는 페이지입니다: ${url}`);
        return null;
    }
};

(async () => {
    for (let i = 400; i <= 500; i++) {
        const data = await fetchProductDetails(i);
        if (data) {
            allData.push(data);
        } else {
            continue;
        }
    }

    if (allData.length > 0) {
        fs.writeFileSync('solarbridge_product_details.json', JSON.stringify(allData, null, 2), 'utf8');
        console.log("모든 데이터가 파일로 저장되었습니다.");
    }
})();
