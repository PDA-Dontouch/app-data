import axios from 'axios';

const url = 'https://openapi.koreainvestment.com:9443/uapi/overseas-price/v1/quotations/price';
const params = {
  AUTH: "",
  EXCD: 'BAQ',
  SYMB: 'AAPL'
};

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Authorization': 'Bearer [TOKEN]',
  'appkey': '[APPKEY]',
  'appsecret': '[APPSECRET]',
  'tr_id': 'HHDFS00000300',
};

axios.get(url, { params, headers })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
