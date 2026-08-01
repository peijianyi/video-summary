const mysql = require("mysql2/promise");

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.end(JSON.stringify(payload));
}

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, message: "只支持 POST 提交。" });
    return;
  }

  const { data, text } = request.body || {};

  if (!data || !text || typeof data !== "string" || typeof text !== "string") {
    sendJson(response, 400, { ok: false, message: "请填写日期和备注。" });
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    sendJson(response, 400, { ok: false, message: "日期格式不正确。" });
    return;
  }

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || "ppforv_com",
    ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  });

  try {
    await connection.execute(
      "INSERT INTO `ppforvcom` (`data`, `text`) VALUES (?, ?)",
      [data, text.trim()],
    );
    sendJson(response, 200, { ok: true, message: "已写入数据库。" });
  } finally {
    await connection.end();
  }
};
