#!/usr/bin/env node
"use strict";
/* ============================================================
   ĐỐI CHIẾU VỚI BẢN NGUỒN: bản cắt trong repo này có chấm RA ĐÚNG như writing-extra-1984 không.

   Chạy: node tools/doi-chieu-nguon.cjs <thư mục checkout writing-extra-1984>

   Không gọi mạng. Bài mẫu chỉ đọc từ checkout nguồn, repo này không chứa bài nào. Ba phép đo:
     1. Prompt và cấu hình từng tuần của repo trùng từng ký tự với nguồn.
     2. Với mỗi bài mẫu đã lưu (phần model đọc lưu trong file), đưa qua cả hai bên bằng cùng một model giả:
        hai bên phải ra đúng cùng results (mức, nhận xét, trích dẫn).
     3. File không cắt gì thì chỉ được khác nhau ở đường dẫn.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const NGUON = path.resolve(process.argv[2] || "");
const TH = path.join(NGUON, "Mastery Hub", "tich-hop");
if (!fs.existsSync(path.join(TH, "cham-lo.js"))) { console.error("Cần đường dẫn checkout writing-extra-1984."); process.exit(2); }
const GOC = path.resolve(__dirname, "..");
const R = require(path.join(GOC, "index.js"));
const NG = {
  cham: require(path.join(TH, "cham-lo.js")),
  doan: require(path.join(TH, "lo-trunk-doan.js")),
  bud: require(path.join(TH, "lo-bud-doan.js")),
  cau: require(path.join(TH, "lo-trunk-bud.js")),
  bloom: require(path.join(TH, "lo-bloom.js")),
  hd: require(path.join(TH, "hoi-dong-doan.js")),
};
const RE = {
  doan: require(path.join(GOC, "src", "lo-trunk-doan.js")),
  bud: require(path.join(GOC, "src", "lo-bud-doan.js")),
  cau: require(path.join(GOC, "src", "lo-trunk-bud.js")),
  bloom: require(path.join(GOC, "src", "lo-bloom.js")),
};
let dat = 0, hong = 0;
function kq(ten, fn) { return Promise.resolve().then(fn).then(() => { dat++; }, (e) => { hong++; console.log("✗ " + ten + "\n   " + String(e.message).slice(0, 400)); }); }
const job = (key, bai, lo) => {
  const m = /^(\w+)-W(\d+)$/.exec(key);
  return { job_id: "doi-chieu-" + key, answer: { content: bai }, lesson: { content_key: m[1].toLowerCase() + "-writing-week-" + Number(m[2]) }, learning_outcomes: lo };
};
const gia = (doc) => async (body) => (NG.hd.vaiCua(body) === "bat_loi" ? '{"flags":[]}' : JSON.stringify(doc));

(async () => {
  // 1. prompt và cấu hình
  for (const k of Object.keys(RE.doan.TUAN)) {
    await kq("prompt " + k, () => assert.equal(RE.doan.SYSTEM[k], NG.doan.SYSTEM[k]));
    await kq("cấu hình " + k, () => assert.deepEqual(JSON.parse(JSON.stringify(RE.doan.TUAN[k])), JSON.parse(JSON.stringify(NG.doan.TUAN[k]))));
  }
  for (const k of Object.keys(RE.bud.TUAN)) {
    await kq("prompt " + k, () => assert.equal(RE.bud.SYSTEM[k], NG.bud.SYSTEM[k]));
    await kq("cấu hình " + k, () => assert.deepEqual(JSON.parse(JSON.stringify(RE.bud.TUAN[k])), JSON.parse(JSON.stringify(NG.bud.TUAN[k]))));
  }
  for (const k of R.PHAM_VI.filter((x) => RE.cau.TUAN[x])) {
    const a = RE.cau.TUAN[k], b = NG.cau.TUAN[k];
    await kq("sổ LO " + k, () => assert.deepEqual(a.lo, b.lo));
    await kq("luật " + k, () => assert.deepEqual(RE.cau.luatCuaTuan(a), NG.cau.luatCuaTuan(b)));
    await kq("prompt hội đồng " + k, () => assert.equal(RE.cau.G.buildSystemPrompt(a.id), NG.cau.G.buildSystemPrompt(b.id)));
  }
  await kq("prompt BLOOM tuần 1", () => assert.equal(JSON.stringify(RE.bloom.SYSTEM), JSON.stringify(NG.bloom.SYSTEM)));

  // 2. bài mẫu qua cả hai bên (đoạn văn TRUNK, BUD: model giả trả đúng phần đọc đã lưu)
  let soBai = 0;
  for (const k of R.PHAM_VI.filter((x) => RE.doan.TUAN[x] || RE.bud.TUAN[x])) {
    const dir = path.join(NGUON, "Mastery Cham", "lo-doan", k);
    if (!fs.existsSync(dir)) { console.log("(không có bài mẫu " + k + ")"); continue; }
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      const m = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
      const lo = R.loCuaTuan(k);
      await kq(k + "/" + f, async () => {
        const moHinh = gia(m.doc);
        const a = await R.chamNode(job(k, m.doan_van, lo), { goiModel: moHinh, _choThuLaiMs: 0 });
        const b = await NG.cham.chamLO(job(k, m.doan_van, lo), { _goiModelTrunkBud: async () => { throw new Error("không gọi"); }, _goiModelTrunkDoan: moHinh, _goiModelBud: moHinh, _goiModelBloom: moHinh, _goiModelTam: moHinh, _choThuLaiMs: 0 });
        assert.equal(a.model, b.model);
        assert.deepEqual(a.results, b.results);
        assert.ok(a.results.some((x) => x.level != null), "không ra mức nào");
      });
      soBai++;
    }
  }
  // BLOOM tuần 1: cùng phần đọc → cùng mức từng node
  const dirB = path.join(NGUON, "Mastery Cham", "lo-bloom", "BLOOM-W01");
  const CBr = require(path.join(GOC, "src", "cham-lo-bloom.js"));
  const CBn = require(path.join(TH, "cham-lo-bloom.js"));
  if (fs.existsSync(dirB)) for (const f of fs.readdirSync(dirB).filter((x) => x.endsWith(".json"))) {
    const m = JSON.parse(fs.readFileSync(path.join(dirB, f), "utf8"));
    await kq("BLOOM-W01/" + f, () => {
      const a = CBr._kiem.ketQuaW1(RE.bloom, m.doan.map((d) => Object.assign({}, d)));
      const b = CBn._kiem.ketQuaW1(NG.bloom, m.doan.map((d) => Object.assign({}, d)));
      assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
    });
    soBai++;
  }

  // 3. file không cắt chỉ khác đường dẫn
  const doi = (s) => s
    .split('path.join(__dirname, "..", "..", "packages", "homework-grading")').join('path.join(__dirname, "..", "vendor", "homework-grading")')
    .split('path.join(__dirname, "..", "..", "Mastery Cham", "data", "hw-spec")').join('path.join(__dirname, "..", "data", "hw-spec")')
    .split('const R = require("./cham-lo-root.js");').join('const R = { chung: require("./chung.js") };');
  for (const f of ["cham-lo-trunk-bud.js", "cham-lo-trunk-doan.js", "lo-trunk-bud.js", "lo-trunk-doan.js", "lo-bloom.js", "hoi-dong-doan.js", "cong-du-phong.js"]) {
    await kq("file " + f, () => assert.equal(fs.readFileSync(path.join(GOC, "src", f), "utf8"), doi(fs.readFileSync(path.join(TH, f), "utf8"))));
  }

  console.log("Đối chiếu " + soBai + " bài mẫu: " + dat + " phép đạt, " + hong + " phép hỏng");
  process.exit(hong ? 1 : 0);
})();
