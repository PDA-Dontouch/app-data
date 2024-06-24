import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';

const urlTemplate = "https://www.solarbridge.kr/product/detail/A000{}";
const allData = [];

const fieldMapping = {
    "투자기간": "investment_period",
    "모집금액": "funding_amount",
    "자금용도": "fund_usage",
    "총투자금": "total_investment_amount",
    "상환방식": "repayment_method",
    "중도상환수수료": "early_repayment_fee",
    "사업명": "project_name",
    "사업부지": "project_site",
    "설비용량": "facility_capacity",
    "시공사": "contractor",
    "사업내용": "business_description",
    "신용도": "credit_rating",
    "재무현황": "financial_status",
    "동일차주 대출현황": "same_borrower_loan_status",
    "담보물 가치": "collateral_value",
    "선순위 채권": "senior_debt",
};

const translateFields = (data) => {
    const translatedData = {};
    for (const key in data) {
        if (fieldMapping[key]) {
            translatedData[fieldMapping[key]] = processField(data[key], fieldMapping[key]);
        } else {
            translatedData[key] = processField(data[key], key);
        }
    }
    return translatedData;
};

const processField = (value, key) => {
    const stringFields = ['fund_usage', 'repayment_method', 'early_repayment_fee', 'project_name', 'project_site', 'facility_capacity', 'contractor', 'business_description', 'credit_rating', 'financial_status', 'same_borrower_loan_status', 'collateral_value', 'senior_debt'];
    const intFields = ['investment_period'];
    const doubleFields = ['funding_amount', 'total_investment_amount', 'annual_return_rate', 'gross_return_rate', 'net_return_rate', 'expected_total_return_rate'];

    if (stringFields.includes(key)) {
        return removeUnmatchedBrackets(value);
    } else if (intFields.includes(key)) {
        return parseNumber(value, 'int');
    } else if (doubleFields.includes(key)) {
        return parseNumber(value, 'double');
    }
    return value;
};

const removeUnmatchedBrackets = (value) => {
    if (typeof value !== 'string') return value;

    const brackets = {
        '(': ')',
        '{': '}',
        '[': ']'
    };

    const openBrackets = Object.keys(brackets);
    const closeBrackets = Object.values(brackets);

    const stack = [];
    let cleanedValue = '';

    for (const char of value) {
        if (openBrackets.includes(char)) {
            stack.push(char);
            cleanedValue += char;
        } else if (closeBrackets.includes(char)) {
            if (stack.length > 0 && brackets[stack[stack.length - 1]] === char) {
                stack.pop();
                cleanedValue += char;
            }
        } else {
            cleanedValue += char;
        }
    }

    while (stack.length > 0) {
        const lastOpenBracket = stack.pop();
        cleanedValue = cleanedValue.replace(lastOpenBracket, '');
    }

    return cleanedValue;
};

const parseNumber = (value, type) => {
    if (typeof value !== 'string') return value;
    const cleanedValue = value.replace(/[^0-9.]/g, '');
    return type === 'int' ? parseInt(cleanedValue, 10) : parseFloat(cleanedValue);
};

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
        const annualYield = parseNumber(tableData.eq(0).text().trim().replace(/- /g, ''), 'double') || 0;
        const investmentPeriod = parseNumber(tableData.eq(1).text().trim().replace(/- /g, ''), 'int') || 0;
        const fundingAmount = parseNumber(tableData.eq(2).text().trim().replace(/- /g, ''), 'double') || 0;

        const borrowerInfoSection = $('div.border-1.p-40');
        const borrowerInfoItems = { "borrower_info_1_title": "", "borrower_info_1_content": "", "borrower_info_2_title": "", "borrower_info_2_content": "", "borrower_info_3_title": "", "borrower_info_3_content": "" };
        borrowerInfoSection.find('div.m-t-20').each((index, element) => {
            const title = $(element).find('div.border-left-4-navy').text().trim().replace(/- /g, '');
            const details = $(element).find('div.p-l-30.c-gray').text().trim().replace(/- /g, '');
            if (title && details) {
                borrowerInfoItems[`borrower_info_${index + 1}_title`] = title;
                borrowerInfoItems[`borrower_info_${index + 1}_content`] = details;
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
                    additionalYieldItems['gross_return_rate'] = parseNumber(value, 'double');
                } else if (key.includes('순수익률(세후)')) {
                    additionalYieldItems['net_return_rate'] = parseNumber(value, 'double');
                } else if (key.includes('총 예상수익률')) {
                    additionalYieldItems['expected_total_return_rate'] = parseNumber(value, 'double');
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
                        "permit_1": admissionHtml[0] || " ",
                        "permit_2": admissionHtml[1] || " ",
                        "permit_3": admissionHtml[2] || " ",
                        "permit_4": admissionHtml[3] || " ",
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
            "project_overview_image_link_1": businessSummaryImages[0] || " ",
            "project_overview_image_link_2": businessSummaryImages[1] || " ",
            "project_overview_image_link_3": businessSummaryImages[2] || " ",
            "project_overview_image_link_4": businessSummaryImages[3] || " ",
        };

        const repaymentResourcesSection = $('#ivqm_3_focus > div.m-t-10.f-14.c-gray-200');
        const repaymentResourcesHtml = repaymentResourcesSection.html().split('<br>').map(text => text.trim().replace(/- /g, ''));

        const repaymentResources = {
            "repayment_source_1": repaymentResourcesHtml[0] || " ",
            "repayment_source_2": repaymentResourcesHtml[1] || " "
        };

        const collateralManagementSection = $('#ivqm_4_focus > div:nth-child(3)');
        const collateralManagementHtml = collateralManagementSection.html()
            .split('<br><br>')
            .flatMap(text => text.split('<br>').map(item => item.trim().replace(/- /g, '')));

        const collateralManagement = {
            "collateral_management_1": collateralManagementHtml[0] || " ",
            "collateral_management_2": collateralManagementHtml[1] || " ",
            "collateral_management_3": collateralManagementHtml[2] || " "
        };

        const collateralListSection = $('#ivqm_4_focus > div:nth-child(9) > div:nth-child(1) > div.col-sm-8.col-xs-12.xs-padding-5');
        const collateralListHtml = collateralListSection.html().split('<br>').map(text => text.trim().replace(/- /g, ''));

        const collateralList = {
            "collateral_list_1": collateralListHtml[0] || " ",
            "collateral_list_2": collateralListHtml[1] || " ",
            "collateral_list_3": collateralListHtml[2] || " ",
            "collateral_list_4": collateralListHtml[3] || " ",
            "collateral_list_5": collateralListHtml[4] || " "
        };

        const collateralRecoveryValueSection = $('#ivqm_4_focus > div:nth-child(9) > div:nth-child(4) > div.col-sm-8.col-xs-12.xs-padding-5');
        const collateralRecoveryValueHtml = collateralRecoveryValueSection.html().split('<br>').map(text => text.trim().replace(/- /g, ''));

        const collateralRecoveryValue = {
            "collateral_recovery_value_1": collateralRecoveryValueHtml[0] || " ",
            "collateral_recovery_value_2": collateralRecoveryValueHtml[1] || " ",
            "collateral_recovery_value_3": collateralRecoveryValueHtml[2] || " ",
            "collateral_recovery_value_4": collateralRecoveryValueHtml[3] || " ",
        };

        const creditEnhancementSection = $('#ivqm_4_focus > div:nth-child(5)');
        const creditEnhancementHtml = creditEnhancementSection.html().split('<br>').map(text => text.trim().replace(/- /g, ''));

        const creditEnhancement = {
            "credit_enhancement_1": creditEnhancementHtml[0] || " ",
            "credit_enhancement_2": creditEnhancementHtml[1] || " ",
            "credit_enhancement_3": creditEnhancementHtml[2] || " ",
            "credit_enhancement_4": creditEnhancementHtml[3] || " ",
            "credit_enhancement_5": creditEnhancementHtml[4] || " "
        };

        const investorProtectionSection = $('#ivqm_4_focus');
        const investorProtectionItems = {};
        investorProtectionSection.find('div.row.m-0').each((index, element) => {
            const key = $(element).find('div.col-sm-3.col-xs-12.f-600').text().trim().replace(/- /g, '');
            const value = $(element).find('div.col-sm-8.col-xs-12').text().trim().replace(/- /g, '');
            if (key && value && key !== "담보물 목록" && key !== "담보물 회수가액") {
                investorProtectionItems[key] = value;
            }

        });

        const imageUrls = [
            "https://kr1-sec-api-storage.cloud.toast.com/v1/AUTH_f102c9c0b0c1467bb71ee822a2fa9751/solarpublic/prodThumbnail/A000463/2024061113/20240611133119605_506.png",
            "https://kr1-sec-api-storage.cloud.toast.com/v1/AUTH_f102c9c0b0c1467bb71ee822a2fa9751/solarpublic/prodThumbnail/A000461/2024061013/20240610135339193_806.png",
            "https://kr1-sec-api-storage.cloud.toast.com/v1/AUTH_f102c9c0b0c1467bb71ee822a2fa9751/solarpublic/prodThumbnail/A000460/2024060514/20240605144709114_242.png",
            "https://kr1-sec-api-storage.cloud.toast.com/v1/AUTH_f102c9c0b0c1467bb71ee822a2fa9751/solarpublic/prodThumbnail/A000459/2024060413/20240604130028248_352.png",
            "https://kr1-sec-api-storage.cloud.toast.com/v1/AUTH_f102c9c0b0c1467bb71ee822a2fa9751/solarpublic/prodThumbnail/A000441/2024051012/20240510125945658_526.png",
            "https://kr1-sec-api-storage.cloud.toast.com/v1/AUTH_f102c9c0b0c1467bb71ee822a2fa9751/solarpublic/prodThumbnail/A000437/2024050713/20240507131947026_280.png",
            "https://kr1-sec-api-storage.cloud.toast.com/v1/AUTH_f102c9c0b0c1467bb71ee822a2fa9751/solarpublic/prodThumbnail/A000436/2024050318/20240503182806062_050.png",
            "https://kr1-sec-api-storage.cloud.toast.com/v1/AUTH_f102c9c0b0c1467bb71ee822a2fa9751/solarpublic/prodThumbnail/A000422/2024041611/20240416113025878_114.png"
        ];
        
        const getRandomImageUrl = () => {
            const randomIndex = Math.floor(Math.random() * imageUrls.length);
            return imageUrls[randomIndex];
        };
        
        return {
            "product_id": `A000${i}`,
            "product_name": productName,
            "title_image_url": getRandomImageUrl(),
            "sum_of_investment_and_reservation": 0,
            "annual_return_rate": parseNumber(annualYield, 'double'),
            "investment_period": investmentPeriod,
            "funding_amount": parseNumber(fundingAmount, 'double'),
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

const saveData = (allData) => {
    const translatedData = allData.map(translateFields);
    fs.writeFileSync('solarbridge_product_details.json', JSON.stringify(translatedData, null, 2), 'utf8');
    console.log("모든 데이터가 파일로 저장되었습니다.");
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
        saveData(allData);
    }
})();
