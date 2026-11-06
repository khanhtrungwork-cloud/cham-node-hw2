#!/usr/bin/env node
"use strict";
/* Chấm một bài HW2 từ file: node bin/cham.js TRUNK-W06 bai-lam.txt [--json]
   Cần YOUPASS_KEY trong môi trường (hoặc file .env ở thư mục repo). Bài chấm qua hội đồng 4 lượt nên thường mất vài phút. */
const fs = require("fs");
const path = require("path");
try { process.loadEnvFile(path.join(__dirname, "..", ".env")); } catch (e) { /* không có .env thì đọc biến môi trường */ }
const { chamNode, yeuCauTuBai, PHAM_VI } = require("../index.js");

const NHAN = { 0: "Chưa ứng dụng được", 1: "Sai nhiều", 2: "Khá", 3: "Tốt" };
const ts = process.argv.slice(2);
const json = ts.includes("--json");
const [key, file] = ts.filter((x) => x !== "--json");
if (!key || !file || !PHAM_VI.includes(key)) {
  console.error("Cách dùng: node bin/cham.js <tuần> <file bài làm> [--json]\nTuần: " + PHAM_VI.join(", "));
  process.exit(2);
}
(async () => {
  const yc = yeuCauTuBai(key, fs.readFileSync(file, "utf8"));
  const kq = await chamNode(yc);
  if (json) { console.log(JSON.stringify(kq, null, 2)); return; }
  console.log(key + " · " + kq.model);
  kq.results.forEach((r) => {
    const lo = yc.learning_outcomes[r.idx - 1];
    console.log("\n" + lo.code + "  " + (r.level == null ? "Chưa đánh giá" : NHAN[r.level]) + "\n  " + lo.content + "\n  " + r.comment);
  });
})().catch((e) => {
  console.error((e.code || "LOI") + ": " + e.message);
  process.exit(1);
});
