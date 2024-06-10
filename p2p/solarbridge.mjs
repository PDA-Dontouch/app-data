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
        const productName = productNameDiv.text().trim().replace(/- /g, '');
        if (!productName) {
            console.log(`상품명 정보를 찾을 수 없습니다: ${url}`);
            return null;
        }

        const tableData = $('div.m-t-5.c-white.f-32');
        const annualYield = tableData.eq(0).text().trim().replace(/- /g, '') || "";
        const investmentPeriod = tableData.eq(1).text().trim().replace(/- /g, '') || "";
        const fundingAmount = tableData.eq(2).text().trim().replace(/- /g, '') || "";

        const borrowerInfoSection = $('div.border-1.p-40');
        const borrowerInfoItems = { "대출자 정보 1 제목": "", "대출자 정보 1 내용": "", "대출자 정보 2 제목": "", "대출자 정보 2 내용": "", "대출자 정보 3 제목": "", "대출자 정보 3 내용": "" };
        borrowerInfoSection.find('div.m-t-20').each((index, element) => {
            const title = $(element).find('div.border-left-4-navy').text().trim().replace(/- /g, '');
            const details = $(element).find('div.p-l-30.c-gray').text().trim().replace(/- /g, '');
            if (title && details) {
                borrowerInfoItems[`대출자 정보 ${index + 1} 제목`] = title;
                borrowerInfoItems[`대출자 정보 ${index + 1} 내용`] = details;
            }
        });

        const productSummarySection = $('#ivqm_1_focus');
        const productSummaryItems = {};

        productSummarySection.find('div.row.m-0').each((index, element) => {
            for (let j = 2; j <= 7; j++) { 
                const keySelector = `#ivqm_1_focus > div:nth-child(${4}) > div > div:nth-child(${j * 2 - 1})`;
                const valueSelector = `#ivqm_1_focus > div:nth-child(${4}) > div > div:nth-child(${j * 2})`;

                const key = $(keySelector).text().trim().replace(/- /g, '');
                const value = $(valueSelector).text().trim().replace(/- /g, '');
                
                if (key && value) {
                    productSummaryItems[key] = value;
                }
            }
        });


        const additionalYieldSection = $('#ivqm_1_focus > div:nth-child(4) > div > div:nth-child(16)');
        const additionalYieldHtml = additionalYieldSection.html().split('<br>').map(text => text.trim().replace(/- /g, ''));
        const additionalYieldItems = {};
        
        additionalYieldHtml.forEach(item => {
            const [key, value] = item.split(':').map(text => text.trim());
            if (key && value) {
                if (key.includes('수익률(세전)')) {
                    additionalYieldItems['수익률(세전)'] = value;
                } else if (key.includes('순수익률(세후)')) {
                    additionalYieldItems['순수익률(세후)'] = value;
                } else if (key.includes('총 예상수익률')) {
                    additionalYieldItems['총 예상수익률'] = value;
                }
            }
        });


        const businessSummarySection = $('#ivqm_2_focus');
        const businessSummaryItems = {};
        businessSummarySection.find('div.row.m-0').each((index, element) => {
            for (let j = 1; j <= 5; j++) {
                const keySelector = `#ivqm_2_focus > div:nth-child(${3}) > div > div:nth-child(${j * 2 - 1})`;
                const valueSelector = `#ivqm_2_focus > div:nth-child(${3}) > div > div:nth-child(${j * 2})`;
        
                const key = $(keySelector).text().trim().replace(/- /g, '');
                const value = $(valueSelector).text().trim().replace(/- /g, '');
                
                if (key && value && key !== '인허가') {
                    businessSummaryItems[key] = value;
                }
        
                if (key === '인허가') {
                    const admissionHtml = $(valueSelector).html()
                        .split('<br>')
                        .flatMap(text => text.split(',').map(item => item.trim()));
                    const admissionItems = {
                        "인허가 1": admissionHtml[0] || " ",
                        "인허가 2": admissionHtml[1] || " ",
                        "인허가 3": admissionHtml[2] || " ",
                        "인허가 4": admissionHtml[3] || " ",
                        "인허가 5": admissionHtml[4] || " "
                    };
                    Object.assign(businessSummaryItems, admissionItems);
                }
            }
        });

        const businessSummaryImages = [];
        businessSummarySection.find('img').each((index, element) => {
            businessSummaryImages.push($(element).attr('src'));
        });
        
        const businessSummaryImageLinks = {
            "사업개요 이미지 링크 1": businessSummaryImages[0] || " ",
            "사업개요 이미지 링크 2": businessSummaryImages[1] || " ",
            "사업개요 이미지 링크 3": businessSummaryImages[2] || " ",
            "사업개요 이미지 링크 4": businessSummaryImages[3] || " ",
            "사업개요 이미지 링크 5": businessSummaryImages[4] || " "
        };

        const repaymentResourcesSection = $('#ivqm_3_focus > div.m-t-10.f-14.c-gray-200');
        const repaymentResourcesHtml = repaymentResourcesSection.html().split('<br>').map(text => text.trim().replace(/- /g, ''));
        
        const repaymentResources = {
            "상환재원 1": repaymentResourcesHtml[0] || " ",
            "상환재원 2": repaymentResourcesHtml[1] || " ",
            "상환재원 3": repaymentResourcesHtml[2] || " "
        };

        const collateralManagementSection = $('#ivqm_4_focus > div:nth-child(3)');
        const collateralManagementHtml = collateralManagementSection.html()
            .split('<br><br>')
            .flatMap(text => text.split('<br>').map(item => item.trim().replace(/- /g, '')));
        
        const collateralManagement = {
            "담보 관리 1": collateralManagementHtml[0] || " ",
            "담보 관리 2": collateralManagementHtml[1] || " ",
            "담보 관리 3": collateralManagementHtml[2] || " ",
            "담보 관리 4": collateralManagementHtml[3] || " "
        };

        const collateralListSection = $('#ivqm_4_focus > div:nth-child(9) > div:nth-child(1) > div.col-sm-8.col-xs-12.xs-padding-5');
        const collateralListHtml = collateralListSection.html().split('<br>').map(text => text.trim().replace(/- /g, ''));

        const collateralList = {
            "담보물 목록 1": collateralListHtml[0] || " ",
            "담보물 목록 2": collateralListHtml[1] || " ",
            "담보물 목록 3": collateralListHtml[2] || " ",
            "담보물 목록 4": collateralListHtml[3] || " ",
            "담보물 목록 5": collateralListHtml[4] || " "
        };

        const collateralRecoveryValueSection = $('#ivqm_4_focus > div:nth-child(9) > div:nth-child(4) > div.col-sm-8.col-xs-12.xs-padding-5');
        const collateralRecoveryValueHtml = collateralRecoveryValueSection.html().split('<br>').map(text => text.trim().replace(/- /g, ''));
        
        const collateralRecoveryValue = {
            "담보물 회수가액 1": collateralRecoveryValueHtml[0] || " ",
            "담보물 회수가액 2": collateralRecoveryValueHtml[1] || " ",
            "담보물 회수가액 3": collateralRecoveryValueHtml[2] || " ",
            "담보물 회수가액 4": collateralRecoveryValueHtml[3] || " ",
            "담보물 회수가액 5": collateralRecoveryValueHtml[4] || " "
        };

        const creditEnhancementSection = $('#ivqm_4_focus > div:nth-child(5)');
        const creditEnhancementHtml = creditEnhancementSection.html().split('<br>').map(text => text.trim().replace(/- /g, ''));
    
        const creditEnhancement = {
            "신용 보강안 1": creditEnhancementHtml[0] || " ",
            "신용 보강안 2": creditEnhancementHtml[1] || " ",
            "신용 보강안 3": creditEnhancementHtml[2] || " ",
            "신용 보강안 4": creditEnhancementHtml[3] || " ",
            "신용 보강안 5": creditEnhancementHtml[4] || " "
        };

        const investorProtectionSection = $('#ivqm_4_focus');
        const investorProtectionItems = {};
        investorProtectionSection.find('div.row.m-0').each((index, element) => {
            const key = $(element).find('div.col-sm-3.col-xs-12.f-600').text().trim().replace(/- /g, '');
            const value = $(element).find('div.col-sm-8.col-xs-12').text().trim().replace(/- /g, '');
            if (key && value && key !=="담보물 목록" && key !=="담보물 회수가액") {
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
            ...additionalYieldItems, 
            ...businessSummaryItems,
            ...businessSummaryImageLinks,
            ...repaymentResources,
            ...collateralManagement,
            ...creditEnhancement,
            ...investorProtectionItems,
            ...collateralList,
            ...collateralRecoveryValue,
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
