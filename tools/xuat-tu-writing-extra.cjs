#!/usr/bin/env node
"use strict";
/* ============================================================
   XUẤT PHẦN CHẤM NODE HW2 TỪ writing-extra-1984 SANG REPO NÀY

   Chạy: node tools/xuat-tu-writing-extra.cjs <thư mục checkout writing-extra-1984>

   Ghi lại src/, vendor/, data/hw-spec/, test/*.sinh.test.js, PHAM-VI.md, NGUON.json. KHÔNG đụng index.js, bin/, README.md,
   các test viết tay. Mỗi phép cắt đều neo vào đúng chuỗi nguồn: nguồn đổi mà neo không còn khớp thì script dừng và báo,
   không lặng lẽ xuất ra một bản lệch.

   Nguồn chấm vẫn ở writing-extra-1984 (đang chạy thật trên .vn). Sửa tiêu chí ở đó rồi chạy lại script này.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const NGUON = path.resolve(process.argv[2] || "");
if (!process.argv[2] || !fs.existsSync(path.join(NGUON, "Mastery Hub", "tich-hop", "cham-lo.js"))) {
  console.error("Cần đường dẫn checkout writing-extra-1984: node tools/xuat-tu-writing-extra.cjs <thư mục>");
  process.exit(2);
}
const RA = path.resolve(__dirname, "..");
const TH = path.join(NGUON, "Mastery Hub", "tich-hop");
const so = (n) => String(n).padStart(2, "0");
const day = (khoa, a, b) => Array.from({ length: b - a + 1 }, (_, i) => khoa + "-W" + so(a + i));
const PHAM_VI = [...day("ROOT", 1, 9), ...day("TRUNK", 1, 7), ...day("BUD", 1, 3), "BLOOM-W01"];

const doc = (f) => fs.readFileSync(f, "utf8");
function ghi(rel, s) {
  const f = path.join(RA, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, s);
}
function soLan(s, x) { return s.split(x).length - 1; }
function thay(s, cu, moi) {
  if (soLan(s, cu) !== 1) throw new Error("Neo phải khớp đúng 1 lần, thấy " + soLan(s, cu) + ": " + cu.slice(0, 80));
  return s.replace(cu, () => moi);
}
function thayHet(s, cu, moi) {
  if (!soLan(s, cu)) throw new Error("Không thấy neo: " + cu.slice(0, 80));
  return s.split(cu).join(moi);
}
// Bỏ cả dòng bắt đầu (sau khoảng trắng) bằng dau; phải có đúng 1 dòng.
function boDong(s, dau) {
  const ds = s.split("\n");
  const i = ds.map((d, k) => (d.trimStart().startsWith(dau) ? k : -1)).filter((k) => k >= 0);
  if (i.length !== 1) throw new Error("Dòng phải khớp đúng 1 lần, thấy " + i.length + ": " + dau.slice(0, 80));
  ds.splice(i[0], 1);
  return ds.join("\n");
}
// Cắt [dau, cuoi): cuoi giữ lại.
function catKhoi(s, dau, cuoi) {
  if (soLan(s, dau) !== 1) throw new Error("Neo đầu phải khớp đúng 1 lần, thấy " + soLan(s, dau) + ": " + dau.slice(0, 80));
  const a = s.indexOf(dau);
  const b = s.indexOf(cuoi, a + dau.length);
  if (b < 0) throw new Error("Không thấy neo cuối: " + cuoi.slice(0, 80));
  return s.slice(0, a) + s.slice(b);
}

/* ---- đường dẫn: khác nhau giữa hai repo ---- */
function doiDuongDan(s) {
  return s
    .split('path.join(__dirname, "..", "..", "packages", "homework-grading")').join('path.join(__dirname, "..", "vendor", "homework-grading")')
    .split('path.join(__dirname, "..", "..", "Mastery Cham", "data", "hw-spec")').join('path.join(__dirname, "..", "data", "hw-spec")')
    .split('path.join(__dirname, "..", "..", "Mastery Cham", "data", "chart-keys")').join('path.join(__dirname, "..", "data", "chart-keys")')
    .split('const R = require("./cham-lo-root.js");').join('const R = { chung: require("./chung.js") };');
}

/* ---- chung.js: đúng phần R.chung của cham-lo-root.js (đọc đề, tách câu, ghép LO). Phần còn lại của file đó là đường
   chấm cũ theo gói anh Trung, từ 14-10 không còn job nào đi qua. ---- */
function dungChung() {
  const s = doc(path.join(TH, "cham-lo-root.js"));
  const cat = (a, b) => {
    const i = s.indexOf(a);
    const j = s.indexOf(b, i);
    if (i < 0 || j < 0) throw new Error("cham-lo-root.js đổi, không cắt được: " + a);
    return s.slice(i, j).trimEnd();
  };
  const noiSo = /^function noiSo\(ds\).*$/m.exec(s);
  if (!noiSo) throw new Error("cham-lo-root.js đổi: không thấy noiSo");
  const xuat = "module.exports = { giaiMa, khungChu, capTu, laTiengViet, donCau, tachLong, DAU_SO_GOI, DAU_SO, tuCua, dice, noiSo };";
  if (!/chung: \{ giaiMa, khungChu, capTu, laTiengViet, donCau, tachLong, DAU_SO_GOI, DAU_SO, tuCua, dice, noiSo \}/.test(s)) throw new Error("R.chung đổi danh sách hàm, xem lại chung.js");
  return ['"use strict";', "/* Hàm dùng chung: đọc chữ đề, tách câu, ghép LO. Cắt nguyên văn từ cham-lo-root.js của writing-extra-1984. */", "const SO_CAU = 8;", "",
    cat("const THUC_THE = ", "/* Số câu đề của gói có mặt"), "",
    cat("const CHU_VIET = ", "/* Cách của gói trước."), "",
    cat("function tuCua(s)", "/* Trả mảng cùng thứ tự learning_outcomes"), "",
    noiSo[0], "", xuat, ""].join("\n");
}

/* ---- BLOOM: chỉ tuần 1 ---- */
function catBloom(s) {
  s = boDong(s, 'const W2 = require("./lo-bloom-w2.js");');
  s = boDong(s, 'const W3 = require("./lo-bloom-w3.js");');
  s = boDong(s, 'const s2 = doc("BLOOM-W02");');
  s = boDong(s, 'const s3 = doc("BLOOM-W03");');
  s = boDong(s, 'const nodesW2 = W2.TUAN["BLOOM-W02"].nodes;');
  s = boDong(s, 'if ((s2.lo || [])');
  s = boDong(s, 'const nodesW3 = W3.TUAN["BLOOM-W03"].nodes;');
  s = boDong(s, 'if ((s3.lo || [])');
  s = boDong(s, '"BLOOM-W02": { spec: s2,');
  s = boDong(s, '"BLOOM-W03": { spec: s3,');
  s = boDong(s, '· HW2 BLOOM tuần 2 (một bài essay');
  s = boDong(s, '· HW2 BLOOM tuần 3 (một bài essay');
  s = catKhoi(s, '  } else {\n    const input = t.W.dauVao(t.spec, bai);', '  }\n  yc.learning_outcomes.forEach');
  return s;
}

/* ---- BUD: chỉ tuần 2, 3. Tuần 1 đi lo-trunk-bud.js. ---- */
const NODE_BUD_NGOAI = ["B4.2", "B4.6", "T4.6", "B4.1", "B4.4", "B4.3", "B4.5", "B4.7", "B5.1", "T6.1", "B6.2", "B6.1", "B7.2", "B7.3", "B7.4", "B7.5", "T8.1", "T8.2", "T8.3", "B8.1", "B8.2", "B8.3"];
function boKhoaTrongBang(s, tenBang) {
  const a = s.indexOf("const " + tenBang + " = {");
  const b = s.indexOf("\n};", a);
  if (a < 0 || b < 0) throw new Error("Không thấy bảng " + tenBang);
  let than = s.slice(a, b);
  NODE_BUD_NGOAI.forEach((ma) => {
    const re = new RegExp('[ \\t]*"' + ma.replace(".", "\\.") + '": "[^"]*",?[ \\t]*');
    if (re.test(than)) than = than.replace(re, "");
  });
  than = than.split("\n").filter((d) => d.trim()).map((d) => d.replace(/\s+$/, "")).join("\n");
  return s.slice(0, a) + than + s.slice(b);
}
function catBud(s) {
  // đầu file: tóm cho đúng phạm vi, bản đầy đủ nói cả tiêu chí các tuần sau
  const het = s.indexOf("============================================================ */");
  if (het < 0) throw new Error("lo-bud-doan.js đổi đầu file");
  s = '"use strict";\n/* ============================================================\n   CHẤM HW2 BUD TUẦN 2, 3 THEO NODE, BỐN MỨC. Cắt từ lo-bud-doan.js của writing-extra-1984: bảng tiêu chí và prompt chỉ còn hai tuần này.\n   Tuần 1 là 8 câu rời, chấm bằng lo-trunk-bud.js. Model ĐỌC bài (tách phần, trích nguyên văn, phán mục định tính); CODE ĐẾM (mức, số từ, số câu).\n   MỨC: tỉ lệ quy về thang 8 (mucTheoTiLe của lo-trunk-bud.js); riêng mẫu số 2 thì 1/2 là Khá (mucBud).\n   ⚠ Các nhánh code `dang === "essay"`, `dang === "task1"` và `key === "BUD-W0x"` là code dùng chung của bản nguồn, không có tuần nào đi vào.\n   ' + s.slice(het);
  ["BUD-W04", "BUD-W05", "BUD-W06", "BUD-W07", "BUD-W08", "BUD-W09"].forEach((k) => { s = boDong(s, '"' + k + '": { dang: '); });
  s = boDong(s, "// Ở tuần 2 \"đơn vị\" của T3.2");
  s = boDong(s, 'TUAN["BUD-W09"].don_vi = ');
  ["NOI_DUNG", "TEN_NGAN", "DON_VI"].forEach((b) => { s = boKhoaTrongBang(s, b); });
  // prompt các tuần sau
  const a = s.indexOf('  "BUD-W04": DAU.concat([');
  const hetHam = s.indexOf("function userMessage", a);
  const dong = s.lastIndexOf("\n};", hetHam);
  if (a < 0 || dong < a) throw new Error("lo-bud-doan.js đổi khối SYSTEM");
  s = s.slice(0, a) + s.slice(dong + 1);
  ["BUD-W04", "BUD-W05", "BUD-W06", "BUD-W09"].forEach((k) => { s = boDong(s, '"' + k + '": { ts: '); });
  ["BUD-W04", "BUD-W05", "BUD-W06", "BUD-W07", "BUD-W08", "BUD-W09"].forEach((k) => { s = boDong(s, '"' + k + '": "Tuần '); });
  // cách tính từng node của các tuần sau: từ node đầu tiên ngoài phạm vi tới hết bảng HAM
  const h = s.indexOf("const HAM = {");
  const dau = s.indexOf('\n  "B4.2":', h);
  const cuoi = s.indexOf("\n};", dau);
  if (h < 0 || dau < 0 || cuoi < 0) throw new Error("lo-bud-doan.js đổi bảng HAM");
  s = s.slice(0, dau) + s.slice(cuoi);
  // mảnh prompt chỉ các tuần sau dùng
  let doi = true;
  while (doi) {
    doi = false;
    for (const m of s.matchAll(/^const ((?:P_[A-Z_]+)|KHUNG_ESSAY) = /gm)) {
      if (soLan(s, m[1]) > 1) continue;
      const tu = m.index;
      const sau = /\n(?=const |function |\/\*|\/\/)/g;
      sau.lastIndex = tu + 1;
      const k = sau.exec(s);
      s = s.slice(0, tu) + s.slice(k.index + 1);
      doi = true;
      break;
    }
  }
  return s;
}

/* ---- src ---- */
const SUA = {
  "cham-lo-bloom.js": catBloom,
  "lo-bud-doan.js": catBud,
  "cham-lo-bud-doan.js": (s) => thay(s, 'const KHOA_LO = ["BUD-W02", "BUD-W03", "BUD-W04", "BUD-W05", "BUD-W06"];', 'const KHOA_LO = ["BUD-W02", "BUD-W03"];'),
};
["cham-lo-trunk-bud.js", "cham-lo-trunk-doan.js", "cham-lo-bloom.js", "cham-lo-bud-doan.js", "lo-trunk-bud.js", "lo-trunk-doan.js", "lo-bud-doan.js", "lo-bloom.js", "hoi-dong-doan.js", "cong-du-phong.js"].forEach((f) => {
  let s = doc(path.join(TH, f));
  if (SUA[f]) s = SUA[f](s);
  ghi(path.join("src", f), doiDuongDan(s));
});
ghi(path.join("src", "chung.js"), dungChung());

/* ---- vendor: hai file của gói homework-grading mà bộ chấm thật sự gọi ---- */
["lib/transport.cjs", "vendor/root-lo-council.js"].forEach((f) => {
  ghi(path.join("vendor", "homework-grading", f), doc(path.join(NGUON, "packages", "homework-grading", f)));
});

/* ---- đề ---- */
fs.rmSync(path.join(RA, "data", "hw-spec"), { recursive: true, force: true });
PHAM_VI.forEach((k) => ghi(path.join("data", "hw-spec", k + ".json"), doc(path.join(NGUON, "Mastery Cham", "data", "hw-spec", k + ".json"))));

/* ---- bộ kiểm: lấy từ scripts/kiem-*.js, bỏ các ca đối chiếu với bài học sinh và ca của tuần ngoài phạm vi ---- */
const DAU_TEST = "// Sinh bằng tools/xuat-tu-writing-extra.cjs từ bộ kiểm của writing-extra-1984. Đừng sửa tay.\n";
function testTrunkBud() {
  let s = doc(path.join(NGUON, "scripts", "kiem-lo-trunk-bud.js"));
  s = thay(s, "require('../Mastery Hub/tich-hop/lo-trunk-bud.js')", "require('../src/lo-trunk-bud.js')");
  s = thayHet(s, "path.join(GOC, 'Mastery Cham', 'data', 'hw-spec', ", "path.join(GOC, 'data', 'hw-spec', ");
  s = catKhoi(s, "  await phan('kết quả bài mẫu", "  console.log(hong ?");
  return DAU_TEST + s;
}
function testTrunkDoan() {
  let s = doc(path.join(NGUON, "scripts", "kiem-lo-trunk-doan.js"));
  s = thay(s, "require('../Mastery Hub/tich-hop/lo-trunk-doan.js')", "require('../src/lo-trunk-doan.js')");
  s = thay(s, "require('../Mastery Hub/tich-hop/lo-trunk-bud.js')", "require('../src/lo-trunk-bud.js')");
  s = thay(s, "path.resolve(__dirname, '..', 'Mastery Cham')", "path.resolve(__dirname, '..')");
  s = thay(s, "require(path.join(GOC, '..', 'Mastery Hub', 'tich-hop', 'hoi-dong-doan.js'))", "require('../src/hoi-dong-doan.js')");
  s = catKhoi(s, "  await ca('file kết quả bài mẫu (lo-doan)", "  console.log((hong ?");
  return DAU_TEST + s;
}
function testBud() {
  let s = doc(path.join(NGUON, "scripts", "kiem-lo-bud.js"));
  s = thay(s, "require('../Mastery Hub/tich-hop/lo-bud-doan.js')", "require('../src/lo-bud-doan.js')");
  s = thay(s, "require('../Mastery Hub/tich-hop/lo-bloom.js')", "require('../src/lo-bloom.js')");
  s = thayHet(s, "require('../Mastery Hub/tich-hop/hoi-dong-doan.js')", "require('../src/hoi-dong-doan.js')");
  s = thay(s, "path.resolve(__dirname, '..', 'Mastery Cham')", "path.resolve(__dirname, '..')");
  s = catKhoi(s, "// Tuần 4, 6: một essay dựng tay.", "(async () => {");
  s = thay(s, "'node tuần 2–6 trùng KHÍT", "'node tuần 2, 3 trùng KHÍT");
  s = thay(s, "['BUD-W02', 'BUD-W03', 'BUD-W04', 'BUD-W05', 'BUD-W06'].forEach", "['BUD-W02', 'BUD-W03'].forEach");
  s = catKhoi(s, "  await ca('tuần 4: bài đủ thì Tốt", "  await ca('docBai nhận ngoai_khung");
  s = catKhoi(s, "  await ca('tuần 4: B4.6 trượt then chốt", "  await ca('kiem: bắt trích");
  s = catKhoi(s, "    assert.deepEqual(D.kiem('BUD-W04', doc4()", "  });\n  await ca('docBai: sai khuôn");
  s = catKhoi(s, "    kiemHang(D.tinh('BUD-W04', dem(BAI4, 200), doc4()), 'W4');", "  });\n  await ca('file kết quả lo-doan");
  s = catKhoi(s, "  await ca('file kết quả lo-doan", "  console.log('\\n' + so");
  return DAU_TEST + s;
}
function testHoiDong() {
  let s = doc(path.join(NGUON, "scripts", "kiem-hoi-dong-doan.js"));
  s = thay(s, 'const TH = path.join(GOC, "Mastery Hub", "tich-hop");', 'const TH = path.join(GOC, "src");');
  s = boDong(s, 'const CAM = path.join(GOC, "Mastery Cham");');
  s = boDong(s, 'const mau = (thu, key, c) =>');
  s = catKhoi(s, "  const BO = [\n", '  await ca("BLOOM-W01 (lo-bloom.js)');
  s = catKhoi(s, '  await ca("healthz có hội đồng', '  console.log("\\n" + dat');
  return s.replace(/^(#!.*\n)?/, (m) => m + DAU_TEST);
}
ghi(path.join("test", "trunk-bud.sinh.test.js"), testTrunkBud());
ghi(path.join("test", "trunk-doan.sinh.test.js"), testTrunkDoan());
ghi(path.join("test", "bud.sinh.test.js"), testBud());
ghi(path.join("test", "hoi-dong.sinh.test.js"), testHoiDong());

/* ---- bảng phạm vi, dựng từ chính bộ chấm vừa xuất ---- */
function bangPhamVi() {
  const L = require(path.join(RA, "src", "lo-trunk-bud.js"));
  const D = require(path.join(RA, "src", "lo-trunk-doan.js"));
  const BD = require(path.join(RA, "src", "lo-bud-doan.js"));
  const CB = require(path.join(RA, "src", "cham-lo-bloom.js")).napBoCham();
  const hang = PHAM_VI.map((k) => {
    const spec = JSON.parse(doc(path.join(RA, "data", "hw-spec", k + ".json")));
    let bo, nodes;
    if (L.TUAN[k]) { bo = "lo-trunk-bud.js, chấm từng câu"; nodes = L.TUAN[k].lo; }
    else if (D.TUAN[k]) { bo = "lo-trunk-doan.js, chấm đoạn văn"; nodes = D.TUAN[k].nodes; }
    else if (BD.TUAN[k]) { bo = "lo-bud-doan.js, chấm đoạn văn"; nodes = BD.TUAN[k].nodes; }
    else if (CB && CB[k]) { bo = "lo-bloom.js, chấm hai đoạn"; nodes = CB[k].nodes; }
    else throw new Error("Tuần không có bộ chấm: " + k);
    return "| " + k + " | " + String(spec.title || "").replace(/\|/g, "/") + " | " + nodes.join(", ") + " | " + bo + " |";
  });
  return ["# Phạm vi chấm node", "", "Sinh bằng `tools/xuat-tu-writing-extra.cjs` từ chính bộ chấm, đừng sửa tay. " + PHAM_VI.length + " tuần.", "",
    "| Tuần | Đề | Node | Bộ chấm |", "|---|---|---|---|", ...hang, ""].join("\n");
}
ghi("PHAM-VI.md", bangPhamVi());

let commit = "";
try { commit = cp.execSync("git rev-parse HEAD", { cwd: NGUON, encoding: "utf8" }).trim(); } catch (e) { /* không phải checkout git */ }
ghi("NGUON.json", JSON.stringify({ repo: "youpassvn/writing-extra-1984", commit, pham_vi: PHAM_VI }, null, 2) + "\n");
console.log("Đã xuất " + PHAM_VI.length + " tuần từ commit " + commit.slice(0, 8));
