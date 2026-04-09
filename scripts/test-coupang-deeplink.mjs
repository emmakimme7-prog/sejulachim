import crypto from "node:crypto";

const accessKey = process.env.COUPANG_PARTNERS_ACCESS_KEY?.trim();
const secretKey = process.env.COUPANG_PARTNERS_SECRET_KEY?.trim();

if (!accessKey || !secretKey) {
  console.error("Missing Coupang Partners API credentials.");
  process.exit(1);
}

const method = "POST";
const path = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink";
const now = new Date();
const signedDate = `${String(now.getUTCFullYear()).slice(-2)}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;
const message = `${signedDate}${method}${path}`;
const signature = crypto.createHmac("sha256", secretKey).update(message, "utf8").digest("hex");
const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${signedDate}, signature=${signature}`;

const response = await fetch(`https://api-gateway.coupang.com${path}`, {
  method,
  headers: {
    Authorization: authorization,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    coupangUrls: ["https://www.coupang.com/np/search?component=&q=%EA%B0%80%EC%A0%95%EC%9A%A9%20%EC%9E%90%EB%8F%99%20%ED%98%88%EC%95%95%EA%B3%84"]
  })
});

const body = await response.text();
console.log(JSON.stringify({ status: response.status, body }, null, 2));
