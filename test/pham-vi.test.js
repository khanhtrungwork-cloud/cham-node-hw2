"use strict";
// Kiểm phạm vi và đầu vào của repo, không gọi mạng: đúng 20 tuần, tuần ngoài phạm vi không gọi model, không có bài học sinh.
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const N = require("../index.js");
const HD = require("../src/hoi-dong-doan.js");
const D = require("../src/lo-trunk-doan.js");
const L = require("../src/lo-trunk-bud.js");

const GOC = path.join(__dirname, "..");
let dat = 0, hong = 0;
async function ca(ten, fn) {
  try { await fn(); dat++; console.log("✓ " + ten); }
  catch (e) { hong++; console.log("✗ " + ten + "\n   " + String(e && e.stack || e).split("\n").slice(0, 4).join("\n   ")); }
}
const khongGoi = async () => { throw new Error("không được gọi model"); };
const NGOAI = [["TRUNK", 8], ["TRUNK", 9], ["BUD", 4], ["BUD", 5], ["BUD", 6], ["BUD", 7], ["BUD", 8], ["BUD", 9], ["BLOOM", 2], ["BLOOM", 3], ["BLOOM", 4], ["BLOOM", 10], ["ROOT", 10]];

(async () => {
  await ca("phạm vi đúng 20 tuần: ROOT 1–9, TRUNK 1–7, BUD 1–3, BLOOM 1", () => {
    assert.equal(N.PHAM_VI.length, 20);
    assert.deepEqual(N.PHAM_VI.filter((k) => k.startsWith("ROOT")).length, 9);
    assert.deepEqual(N.PHAM_VI.filter((k) => k.startsWith("TRUNK")).length, 7);
    assert.deepEqual(N.PHAM_VI.filter((k) => k.startsWith("BUD")).length, 3);
    assert.deepEqual(N.PHAM_VI.filter((k) => k.startsWith("BLOOM")), ["BLOOM-W01"]);
  });
  await ca("đề hw-spec có đúng 20 file của phạm vi", () => {
    const co = fs.readdirSync(path.join(GOC, "data", "hw-spec")).map((f) => f.replace(".json", "")).sort();
    assert.deepEqual(co, N.PHAM_VI.slice().sort());
  });
  await ca("cả bốn bộ chấm nạp được, không còn tuần ngoài phạm vi", () => {
    const mt = N.moTa();
    assert.ok(mt.theo_cau.co_bo_cham && mt.doan_van.co_bo_cham && mt.bloom.co_bo_cham && mt.bud.co_bo_cham, JSON.stringify(mt));
    assert.deepEqual(mt.doan_van.tuan, ["TRUNK-W03", "TRUNK-W04", "TRUNK-W05", "TRUNK-W06", "TRUNK-W07"]);
    assert.deepEqual(mt.bloom.tuan, ["BLOOM-W01"]);
    assert.deepEqual(mt.bud.tuan, ["BUD-W02", "BUD-W03"]);
    const tb = mt.theo_cau.tuan.filter((k) => !N.PHAM_VI.includes(k));
    assert.deepEqual(tb, []);
    assert.equal(mt.hoi_dong_doan.luot, 4);
  });
  await ca("mỗi tuần có LO, và LO của tuần ghép được với chính bộ chấm", async () => {
    for (const k of N.PHAM_VI) {
      const lo = N.loCuaTuan(k);
      assert.ok(lo.length >= 2, k);
      lo.forEach((x) => assert.ok(x.code && x.content, k + " " + x.code));
    }
    const bo = require("../src/cham-lo-trunk-doan.js");
    const b = bo.napBoCham();
    for (const k of Object.keys(b.D.TUAN)) assert.ok(bo._kiem.ghepLO(b.D, N.loCuaTuan(k), k).every(Boolean), k);
  });
  await ca("tuần ngoài phạm vi: mọi LO để trống, không gọi model", async () => {
    for (const [khoa, so] of NGOAI) {
      const kq = await N.chamNode({ job_id: "x", answer: { content: "Word ".repeat(120) }, lesson: { content_key: khoa.toLowerCase() + "-writing-week-" + so },
        learning_outcomes: [{ id: 1, code: "T8.1", content: "Tả đúng thông tin số liệu" }] }, { goiModel: khongGoi });
      assert.equal(kq.model, N.MODEL_CHUA_CHAM, khoa + so);
      assert.equal(kq.results[0].level, null);
    }
  });
  await ca("bài đoạn văn dưới 20 từ: mức 0, không gọi model; bài câu rời không tách được: báo sai khuôn, level null", async () => {
    for (const k of ["TRUNK-W03", "TRUNK-W07", "BUD-W02", "BUD-W03", "BLOOM-W01"]) {
      const kq = await N.chamNode(N.yeuCauTuBai(k, "Too short."), { goiModel: khongGoi });
      assert.ok(kq.results.every((r) => r.level === 0), k + " " + JSON.stringify(kq.results));
    }
    for (const k of ["ROOT-W01", "TRUNK-W02", "BUD-W01"]) {
      const kq = await N.chamNode(N.yeuCauTuBai(k, "Too short."), { goiModel: khongGoi });
      assert.equal(kq.model, N.MODEL_SAI_KHUON, k);
      assert.ok(kq.results.every((r) => r.level === null), k);
    }
  });
  await ca("đầu vào chấm trọn một đoạn TRUNK tuần 6 qua hội đồng 4 lượt, mức do code đếm, đề lấy từ hw-spec", async () => {
    const TS = "There are several advantages to switching university education to online learning.";
    const C1 = "Firstly, studying online allows students to adjust their learning pace.";
    const C2 = "In addition, online courses cost less than traditional classes.";
    const bai = [TS, C1, "Flexible schedules give them more time to review difficult lessons.", C2, "Students do not have to pay for rent or transport."].join(" ");
    const doc = { ts: { trich: TS, co_dummy: true, dung_khuon: true, y_chinh: true, sua: "", giai_thich: "Đúng khuôn." },
      si: [{ core: C1, development: "Flexible schedules give them more time to review difficult lessons.", loai_dev: "impact", giai_thich: "x" },
        { core: C2, development: "Students do not have to pay for rent or transport.", loai_dev: "reason", giai_thich: "x" }],
      ngoai_khung: [], dummy_khac: [], goi_y_doi: { trich: "", sua: "" },
      doi_chu_ngu: [{ trich: "studying online allows students", kieu: "ving", chu_ngu: "studying online", fv: "allows", dung: true, sua: "", giai_thich: "x" }] };
    const vai = [];
    const yc = N.yeuCauTuBai("TRUNK-W06", bai);
    yc.quiz = { question: "ĐỀ CŨ TRONG JOB, KHÔNG ĐƯỢC DÙNG" };
    const gui = [];
    const kq = await N.chamNode(yc, { goiModel: async (body) => {
      vai.push(HD.vaiCua(body));
      gui.push(body.messages[1].content);
      return HD.vaiCua(body) === "bat_loi" ? '{"flags":[]}' : JSON.stringify(doc);
    } });
    assert.deepEqual(vai.slice().sort(), ["bat_loi", "kho_tinh", "nhan_tu", "trong_tai"]);
    assert.ok(gui.every((x) => !x.includes("ĐỀ CŨ TRONG JOB")), "không đọc đề trong job");
    assert.match(kq.model, /^lo-trunk-doan-/);
    assert.deepEqual(kq.results.map((r) => [yc.learning_outcomes[r.idx - 1].code, r.level]), [["T6.1", 2], ["T6.2", 3]], "mới đổi 1 câu nên T6.1 tối đa Khá");
  });
  await ca("đầu vào chấm trọn bài câu rời ROOT tuần 1 với model giả: mỗi LO ra mức, LO lạ để trống", async () => {
    const spec = JSON.parse(fs.readFileSync(path.join(GOC, "data", "hw-spec", "ROOT-W01.json"), "utf8"));
    const n = spec.parts[0].items.length;
    const bai = Array.from({ length: n }, (_, i) => (i + 1) + ". Students who study abroad gain independence.").join("\n");
    const id = L.TUAN["ROOT-W01"].id;
    const vai = [];
    const gia = async (body, ctx) => {
      vai.push(ctx.stage);
      if (ctx.stage === "bat_loi") return JSON.stringify({ lesson: id, flags: [] });
      const ra = { lesson: id, ket_qua_lo: L.G.maLO(id).map((ma) => ({ ma_lo: ma, ket_qua: "dat", ly_do: "dung", yeu_cau_de: "", bang_chung: "Students", giai_thich: "Dùng đúng.", goi_y_sua: "" })), ghi_chu_khac: [] };
      if (ctx.stage !== "trong_tai") ra.kiem_tra_flag = [];
      return JSON.stringify(ra);
    };
    const yc = N.yeuCauTuBai("ROOT-W01", bai);
    yc.learning_outcomes.push({ id: 99, code: "Z9.9", content: "Điểm không có trong tuần này" });
    let kq;
    try { kq = await N.chamNode(yc, { goiModel: gia, _choThuLaiMs: 0 }); }
    catch (e) { assert.fail("chấm câu rời lỗi: " + e.code + " " + e.message); }
    assert.equal(vai.length, 4 * n, "4 lượt mỗi câu");
    const cuoi = kq.results[kq.results.length - 1];
    assert.equal(cuoi.level, null);
    assert.equal(cuoi.comment, N.KHONG_CO_TRONG_TUAN);
    assert.deepEqual(kq.results.slice(0, -1).map((r) => r.level), [3, 3, 3]);
  });
  await ca("repo không có bài học sinh: không thư mục bài mẫu, không trường bài làm trong dữ liệu", () => {
    ["mau", "lo-mau", "lo-doan", "lo-bloom", "bai-that"].forEach((d) => assert.ok(!fs.existsSync(path.join(GOC, d)), d));
    N.PHAM_VI.forEach((k) => {
      const j = fs.readFileSync(path.join(GOC, "data", "hw-spec", k + ".json"), "utf8");
      ["bai_lam", "em_viet", "doan_van", "comment_chung"].forEach((t) => assert.ok(!j.includes('"' + t + '"'), k + " có " + t));
    });
  });
  await ca("prompt của phạm vi có mặt đủ, BUD không còn prompt tuần sau", () => {
    const BD = require("../src/lo-bud-doan.js");
    assert.deepEqual(Object.keys(BD.SYSTEM), ["BUD-W02", "BUD-W03"]);
    assert.deepEqual(Object.keys(BD.TUAN), ["BUD-W02", "BUD-W03"]);
    assert.deepEqual(Object.keys(D.SYSTEM), Object.keys(D.TUAN));
  });
  console.log("\n" + dat + " ca đạt, " + hong + " ca hỏng");
  if (hong) process.exitCode = 1;
})();
