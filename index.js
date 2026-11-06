"use strict";
/* ============================================================
   CHẤM NODE HW2: đầu vào của repo.

   chamNode(yeuCau, opts) → { model, results: [{ idx, level, confidence, comment, evidence }] }
     yeuCau: { job_id, answer: { content }, lesson: { content_key: "trunk-writing-week-6" } hoặc { class_level, lesson_number },
               learning_outcomes: [{ id, code, content }], ai_review?: { homework_kind } }
     level: 0 Chưa ứng dụng được · 1 Sai nhiều · 2 Khá · 3 Tốt · null chưa đánh giá được (comment nói lý do).
     Cùng khuôn với API D / webhook F của tích hợp YouPass.
     opts: signal (huỷ giữa chừng) · goiModel(body, ...) → chữ model trả (bộ kiểm truyền model giả; không truyền thì gọi cổng
           bằng YOUPASS_KEY) · _choThuLaiMs (bộ kiểm).
   Ném LoiCham { code, message, retryable, boCham } khi đã vào chấm mà chưa xong (cổng AI chậm, model trả sai khuôn ba lần).

   Chọn bộ chấm theo đúng thứ tự của cham-lo.js bên writing-extra-1984. Tuần ngoài PHAM_VI không bộ nào nhận: mọi LO level null,
   model MODEL_CHUA_CHAM, không gọi model.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const TrunkBud = require("./src/cham-lo-trunk-bud.js");
const TrunkDoan = require("./src/cham-lo-trunk-doan.js");
const Bloom = require("./src/cham-lo-bloom.js");
const Bud = require("./src/cham-lo-bud-doan.js");
const HoiDong = require("./src/hoi-dong-doan.js");
const DuPhong = require("./src/cong-du-phong.js");

const { pham_vi: PHAM_VI } = JSON.parse(fs.readFileSync(path.join(__dirname, "NGUON.json"), "utf8"));
const MODEL_CHUA_CHAM = "chua-co-bo-cham";
const MODEL_SAI_KHUON = "bai-sai-khuon";
const CHUA_CO_BO_CHAM = "Bài này chưa có bộ chấm điểm kiến thức.";
const KHONG_CO_TRONG_TUAN = "Điểm kiến thức này chưa có trong bộ chấm của bài.";
function chuSaiKhuon(n) {
  return "Bài làm chưa tách được thành " + n + " câu theo đề, nên chưa chấm được điểm kiến thức. " +
    "Cần ghi số câu ở đầu mỗi câu (1., 2., …) và viết đúng các câu của đề.";
}

class LoiCham extends Error {
  constructor(code, message, retryable) {
    super(message);
    this.code = code;
    this.retryable = !!retryable;
  }
}
function veLoiCham(e, boCham) {
  const coMa = e && typeof e.code === "string" && /^[A-Z][A-Z0-9_]{2,40}$/.test(e.code) && typeof e.retryable === "boolean";
  const l = coMa ? new LoiCham(e.code, e.message, e.retryable) : new LoiCham("GRADER_ERROR", "Bộ chấm LO gặp lỗi.", true);
  l.boCham = (e && e.boCham) || boCham;
  return l;
}

async function chamNode(yeuCau, opts) {
  const o = opts || {};
  const chung = { signal: o.signal, goiModel: o.goiModel, _choThuLaiMs: o._choThuLaiMs };
  const duong = [
    { boCham: "lo-trunk-bud", thu: () => TrunkBud.thuChamTrunkBud(yeuCau, chung) },
    { boCham: "lo-trunk-doan", thu: () => TrunkDoan.thuChamDoan(yeuCau, chung) },
    { boCham: "lo-bloom", thu: () => Bloom.thuChamBloom(yeuCau, chung) },
    { boCham: "lo-bud", thu: () => Bud.thuChamBud(yeuCau, chung) },
  ];
  let dac = null;
  let saiKhuon = null;      // số câu của đề, khi lý do là không tách được
  let chuRieng = "";        // câu riêng của bộ chấm
  for (const d of duong) {
    let r;
    try { r = await d.thu(); } catch (e) { throw veLoiCham(e, d.boCham); }
    if (r.dung) { dac = r; break; }
    const m = /^khong_tach_duoc_(\d+)_cau/.exec(String(r.ly_do || ""));
    if (r.chu_sai_khuon) chuRieng = r.chu_sai_khuon;
    else if (m) saiKhuon = Number(m[1]);
  }
  const trong = (idx, chu) => ({ idx, level: null, confidence: null, comment: chu, evidence: [] });
  const tatCa = (model, chu) => ({ model, results: yeuCau.learning_outcomes.map((lo, i) => trong(i + 1, chu)) });
  if (!dac && chuRieng) return tatCa(MODEL_SAI_KHUON, chuRieng);
  if (!dac && saiKhuon) return tatCa(MODEL_SAI_KHUON, chuSaiKhuon(saiKhuon));
  if (!dac) return tatCa(MODEL_CHUA_CHAM, CHUA_CO_BO_CHAM);
  const results = dac.results.concat(dac.conLai.map((idx) => trong(idx, KHONG_CO_TRONG_TUAN)));
  results.sort((a, b) => a.idx - b.idx);
  return { model: dac.model, results };
}

/* Danh sách LO của một tuần theo đúng mã và chữ trong bộ chấm: [{ id, code, content }]. */
function loCuaTuan(key) {
  const L = require("./src/lo-trunk-bud.js");
  const D = require("./src/lo-trunk-doan.js");
  const BD = require("./src/lo-bud-doan.js");
  const CB = Bloom.napBoCham();
  let ds;
  if (L.TUAN[key]) ds = L.TUAN[key].lo.map((ma) => [ma, L.NODE[ma]]);
  else if (D.TUAN[key]) ds = D.TUAN[key].nodes.map((ma) => [ma, D.TUAN[key].noi_dung[ma]]);
  else if (BD.TUAN[key]) ds = BD.TUAN[key].nodes.map((ma) => [ma, BD.TUAN[key].noi_dung[ma]]);
  else if (CB && CB[key]) ds = CB[key].nodes.map((ma) => [ma, CB[key].noi_dung[ma]]);
  else throw new Error("Tuần ngoài phạm vi: " + key);
  return ds.map(([code, content], i) => ({ id: i + 1, code, content }));
}

/* Dựng yêu cầu chấm từ tên tuần và bài làm: "TRUNK-W06" → content_key "trunk-writing-week-6". */
function yeuCauTuBai(key, baiLam) {
  const m = /^(ROOT|TRUNK|BUD|BLOOM)-W(\d{2})$/.exec(key);
  if (!m) throw new Error("Tên tuần phải có dạng TRUNK-W06: " + key);
  return {
    job_id: "bai-" + Date.now(),
    answer: { content: String(baiLam == null ? "" : baiLam) },
    lesson: { content_key: m[1].toLowerCase() + "-writing-week-" + Number(m[2]) },
    learning_outcomes: loCuaTuan(key),
  };
}

function moTa() {
  return {
    pham_vi: PHAM_VI,
    theo_cau: TrunkBud.moTa(),
    doan_van: TrunkDoan.moTa(),
    bloom: Bloom.moTa(),
    bud: Bud.moTa(),
    hoi_dong_doan: HoiDong.moTa(),
    du_phong: DuPhong.moTa(),
  };
}

module.exports = { chamNode, loCuaTuan, yeuCauTuBai, moTa, LoiCham, PHAM_VI, MODEL_CHUA_CHAM, MODEL_SAI_KHUON, CHUA_CO_BO_CHAM, KHONG_CO_TRONG_TUAN };
