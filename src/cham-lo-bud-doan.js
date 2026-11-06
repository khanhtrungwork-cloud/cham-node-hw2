"use strict";
/* ============================================================
   NỐI BỘ CHẤM BUD TUẦN 2–9 THEO NODE vào API D (02-11, user chốt "commit, nối chấm thật")

   Tuần 1 là 8 câu rời, vẫn đi hội đồng từng câu của cham-lo-trunk-bud.js. Tuần 2–9 là đoạn văn, essay hoặc report: bộ chấm là
   lo-bud-doan.js (model ĐỌC bài, CODE ĐẾM, mức theo mucBud, tiêu chí https://claude.ai/artifact/1k1imYfCSfu3fJCaJh4jYx, giáo viên
   CHƯA duyệt); file này chỉ NỐI: nhận job → tìm tuần → đề của tuần trong hw-spec → docBai → tinh → results của API D.

   Chỉ dùng khi đủ các điều kiện sau; thiếu thì { dung: false, ly_do } và cham-lo.js báo "chưa có bộ chấm" như mọi tuần khác:
     1. Job là HW2 BUD tuần có trong TUAN của lo-bud-doan.js (content_key "bud-writing-week-N", hoặc class_level BUD + lesson_number N).
     2. homework_kind (nếu có) KHÔNG phải "sentence…": bài câu rời không đọc như một đoạn được.
     3. Ít nhất một LO YouPass khớp node của tuần: theo mã (ở code hoặc đầu nội dung), rồi theo chữ, cùng luật ngưỡng cham-lo-bloom.js.
        LO không khớp thì để trống (cham-lo.js: KHONG_CO_TRONG_TUAN).

   ⚠ ĐỀ LẤY TỪ hw-spec, không đọc chữ đề trong job (cùng luật các đường khác), và đầu vào gửi model dựng bằng ĐÚNG hàm dauVao mà script
   bài mẫu dùng: kết quả 72 bài mẫu (Mastery Cham/lo-doan/BUD-W0x) mới nói được gì về job thật.

   ⚠ Hw-spec tuần 2–6 phải khai đúng node của bộ chấm: lệch thì không nạp, cả đường báo "chưa có bộ chấm" thay vì chấm theo sổ cũ. Tuần 7,
   8, 9 hw-spec chưa khai `lo` (tuần 9 chỉ ghi "chấm checklist tích luỹ"), node lấy từ bản đồ nên không so được.

   Bài quá ngắn (dưới 20 từ) không gọi model: mọi node khớp ra mức 0. Hội đồng 4 lượt đọc cả bài (05-11, hoi-dong-doan.js); lượt hỏng thử lại riêng
   lượt đó tối đa 3 lần. Vẫn hỏng thì job failed, retryable; YouPass gửi lại là chấm lại cả bài.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const TB = require("./cham-lo-trunk-bud.js");
const TD = require("./cham-lo-trunk-doan.js");
const BL = require("./cham-lo-bloom.js");

const HW_SPEC = path.join(__dirname, "..", "data", "hw-spec");
const TU_TOI_THIEU = 20;
const KHOA_LO = ["BUD-W02", "BUD-W03"];   // tuần hw-spec có khai `lo`

function loi(code, message, retryable) {
  const e = new Error(message);
  e.code = code;
  e.retryable = !!retryable;
  return e;
}

/* ---- nạp một lần; hỏng thì các job này báo "chưa có bộ chấm" ---- */
let bo;
function napBoCham() {
  if (bo !== undefined) return bo;
  try {
    const D = require("./lo-bud-doan.js");
    const spec = {};
    Object.keys(D.TUAN).forEach((key) => {
      const j = JSON.parse(fs.readFileSync(path.join(HW_SPEC, key + ".json"), "utf8"));
      if (!j || !Array.isArray(j.parts) || !j.parts[0] || !Array.isArray(j.topics) || !j.topics[0]) throw new Error("hw-spec " + key + " thiếu đề");
      if (KHOA_LO.includes(key)) {
        const ma = (j.lo || []).map((x) => String(x).split(" ")[0]).sort().join(",");
        if (ma !== D.TUAN[key].nodes.slice().sort().join(",")) throw new Error("hw-spec " + key + " lệch node của bộ chấm");
      }
      if (D.TUAN[key].dang === "task1") D.boSo(key);   // thiếu data key thì báo ngay lúc nạp, đừng để tới job đầu tiên
      spec[key] = j;
    });
    bo = { D: D, spec: spec };
  } catch (e) {
    console.warn("[tich-hop] chấm LO: không nạp được bộ chấm BUD (" + (e && e.message) + "), job BUD tuần 2+ báo chưa có bộ chấm");
    bo = null;
  }
  return bo;
}
function tenBoCham(b) { return b.D.PHIEN_BAN + " (" + b.D.MODEL + ")"; }

/* ---- bằng chứng: tối đa 3 câu nguyên văn của chính bài, khuôn { quote } --------------------------------------------------------
   Khác bangChung của cham-lo-trunk-doan.js ở một chỗ: nhiều mục của BUD phán trên CẢ MỘT PHẦN (thesis, topic sentence, supporting idea)
   nên mục không mang `trich`, chữ làm căn cứ nằm ở mảnh của hàng. Dùng bangChung kia thì đo trên 72 bài mẫu chỉ 16/47 node chưa đạt có
   câu trích. Mục trượt không có trich thì lấy mảnh của hàng chứa nó; hai node của Introduction chỉ lấy đúng câu của mình. */
const MANH_CUA_NODE = { "B4.2": "Câu paraphrase", "B4.6": "Thesis" };
function bangChungBud(n, doan, hang) {
  const coTrong = (q) => doan.toLowerCase().indexOf(q.toLowerCase()) >= 0;
  const tach = (s) => String(s || "").split("|").map((x) => x.trim().replace(/^[.…]+|[.…]+$/g, "").trim()).filter((x) => x && coTrong(x));
  const trich = [], manh = [], dung = [];
  const da = new Set();
  const xet = (m, h) => {
    da.add(m);
    const q = tach(m.trich);
    if (m.ok) dung.push(...q);
    else if (q.length) trich.push(...q);
    else if (h) (h.manh || []).forEach((x) => { if (!MANH_CUA_NODE[n.ma] || x.nhan === MANH_CUA_NODE[n.ma]) manh.push(...tach(x.trich)); });
  };
  (hang || []).forEach((h) => ((h.nhom || {})[n.ma] || []).forEach((m) => xet(m, h)));
  (n.muc_kiem || []).forEach((m) => { if (!da.has(m)) xet(m, null); });
  const ds = n.muc != null && n.muc <= 1 ? trich.concat(manh, dung) : dung.concat(trich, manh);
  return [...new Set(ds)].slice(0, 3).map((q) => ({ quote: q }));
}

/* ---- đếm cho healthz ---- */
const dem = { dung: 0, khong: 0 };
const demLyDo = {};

/* Chấm job bằng bộ chấm BUD nếu đủ điều kiện.
   → { dung: false, ly_do, ghi }   không dùng
   → { dung: true, key, so_tu, model, results, conLai, ma_lo }
   Ném lỗi { code, message, retryable, boCham } khi đã vào chấm mà chưa xong.
   opts.goiModel(body, signal), opts._choThuLaiMs: chỉ bộ kiểm truyền vào (model giả). */
async function thuChamBud(yc, opts) {
  const o = opts || {};
  const khong = (lyDo, ghi) => {
    dem.khong++;
    demLyDo[lyDo.split(":")[0]] = (demLyDo[lyDo.split(":")[0]] || 0) + 1;
    return { dung: false, ly_do: lyDo, ghi: !!ghi };
  };
  const tuan = TB._kiem.tuanCuaJob(yc);
  if (!tuan || tuan.khoa !== "BUD") return khong("khong_phai_bud");
  const b = napBoCham();
  if (!b) return khong("chua_nap_bo_cham", true);
  const key = tuan.key;
  const cfg = b.D.TUAN[key];
  if (!cfg) return khong("tuan_ngoai_bo_cham_bud: " + key);
  const kind = yc.ai_review && typeof yc.ai_review === "object" ? String(yc.ai_review.homework_kind || "") : "";
  if (/^sentence/.test(kind)) return khong("khong_phai_bai_doan: homework_kind " + kind.slice(0, 40), true);
  const maLO = BL._kiem.ghepLO(cfg, yc.learning_outcomes);
  if (!maLO.some(Boolean)) return khong("khong_ghep_duoc_lo: không LO YouPass nào khớp node của " + key, true);

  const boCham = tenBoCham(b);
  const bai = String((yc.answer && yc.answer.content) || "").replace(/\r\n?/g, "\n").trim();
  const soTu = bai.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const results = [];
  const conLai = [];
  if (soTu < TU_TOI_THIEU) {
    yc.learning_outcomes.forEach((lo, i) => {
      if (!maLO[i]) { conLai.push(i + 1); return; }
      results.push({ idx: i + 1, level: 0, confidence: null, evidence: [],
        comment: "Bài làm mới có " + soTu + " từ, chưa đủ để đánh giá kiến thức này." });
    });
    dem.dung++;
    return { dung: true, key: key, so_tu: soTu, model: boCham, results: results, conLai: conLai, ma_lo: maLO };
  }
  const input = b.D.dauVao(b.spec[key], bai);
  let doc;
  try {
    doc = await b.D.docBai(key, input, { goiModel: o.goiModel, signal: o.signal, choThuLaiMs: o._choThuLaiMs });
  } catch (e) {
    if (o.signal && o.signal.aborted) throw Object.assign(loi("MODEL_TIMEOUT", "Quá giờ chấm.", true), { boCham: boCham });
    if (e && /YOUPASS_KEY/.test(String(e.message))) throw Object.assign(loi("AI_NOT_CONFIGURED", "Máy chủ chưa có khoá gọi AI.", true), { boCham: boCham });
    throw Object.assign(loi("LO_GRADING_INCOMPLETE", "Chưa đọc xong bài (cổng AI chậm hoặc trả sai khuôn ba lần). Gửi lại job để chấm lại.", true), { boCham: boCham });
  }
  let kq;
  try { kq = b.D.tinh(key, input.doan_van, doc, input); }
  catch (e) { throw Object.assign(loi("GRADER_ERROR", "Bộ chấm LO gặp lỗi khi tổng hợp.", true), { boCham: boCham }); }
  yc.learning_outcomes.forEach((lo, i) => {
    const n = maLO[i] ? kq.nodes.find((x) => x.ma === maLO[i]) : null;
    if (!n) { conLai.push(i + 1); return; }
    results.push({ idx: i + 1, level: n.muc, confidence: null, comment: TD._kiem.nhanXet(n, kq.hang), evidence: bangChungBud(n, input.doan_van, kq.hang) });
  });
  dem.dung++;
  return { dung: true, key: key, so_tu: soTu, model: boCham, results: results, conLai: conLai, ma_lo: maLO };
}

/* Cho healthz: nạp được không, phiên bản, tuần, model, đếm job theo đường chấm. */
function moTa() {
  const b = napBoCham();
  if (!b) return { co_bo_cham: false, dem: Object.assign({}, dem), ly_do_khong: Object.assign({}, demLyDo) };
  return { co_bo_cham: true, phien_ban: b.D.PHIEN_BAN, tuan: Object.keys(b.D.TUAN), model: b.D.MODEL,
    dem: Object.assign({}, dem), ly_do_khong: Object.assign({}, demLyDo) };
}

module.exports = { thuChamBud, moTa, napBoCham, _kiem: { bangChungBud } };
