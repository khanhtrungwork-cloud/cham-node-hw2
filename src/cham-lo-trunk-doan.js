"use strict";
/* ============================================================
   NỐI BỘ CHẤM ĐOẠN VĂN THEO NODE vào API D (01-11, user chốt "commit, nối API D"): TRUNK tuần 3, 4, 5; tuần 6, 7 thêm 05-11

   HW2 các tuần này là MỘT đoạn thân bài, không phải 8 câu rời như TRUNK tuần 1–2, nên không đi qua hội đồng từng câu
   của cham-lo-trunk-bud.js. Bộ chấm là lo-trunk-doan.js (model ĐỌC đoạn, CODE ĐẾM, mức theo thang ROOT); file này chỉ
   NỐI: nhận job → tìm tuần → đề + ngân hàng ý của tuần trong hw-spec → docDoan → tinh → results của API D.

   Chỉ dùng khi đủ các điều kiện sau; thiếu thì thuChamDoan trả { dung: false, ly_do } và cham-lo.js báo
   "chưa có bộ chấm" như mọi tuần khác:
     1. Job là HW2 TRUNK tuần có trong TUAN của lo-trunk-doan.js (content_key "trunk-writing-week-N", hoặc
        class_level TRUNK + lesson_number N; tìm tuần bằng đúng hàm của cham-lo-trunk-bud.js).
     2. homework_kind (nếu có) KHÔNG phải "sentence…": bài câu rời không đọc như một đoạn được.
     3. Ít nhất một LO YouPass khớp node của tuần: theo mã ("T5.1" ở code, hoặc đầu nội dung), rồi theo nội dung
        (gần như trùng chữ node). LO không khớp thì để trống (cham-lo.js: KHONG_CO_TRONG_TUAN).

   ⚠ ĐỀ LẤY TỪ hw-spec, không đọc chữ đề trong job (cùng luật 14-10 của ROOT / TRUNK 1–2), và đầu vào gửi model dựng
   bằng ĐÚNG hàm dauVao mà script bài mẫu dùng: kết quả 27 bài mẫu (Mastery Cham/lo-doan/) mới nói được gì về job thật.
   Bài quá ngắn (dưới 20 từ) không gọi model: mọi node khớp ra mức 0 kèm câu nói rõ.

   Hội đồng 4 lượt đọc cả đoạn (05-11, hoi-dong-doan.js, cùng model với ROOT); lượt hỏng thử lại riêng lượt đó tối đa 3 lần. Vẫn hỏng thì
   job failed, retryable; YouPass gửi lại là chấm lại cả đoạn.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const TB = require("./cham-lo-trunk-bud.js");
const R = { chung: require("./chung.js") };

const C = R.chung;
const HW_SPEC = path.join(__dirname, "..", "data", "hw-spec");
const TU_TOI_THIEU = 20;

function loi(code, message, retryable) {
  const e = new Error(message);
  e.code = code;
  e.retryable = !!retryable;
  return e;
}

/* ---- nạp bộ chấm + hw-spec của các tuần (một lần; hỏng thì các job này báo "chưa có bộ chấm") ---- */
let bo;   // undefined: chưa nạp; null: nạp hỏng
function napBoCham() {
  if (bo !== undefined) return bo;
  try {
    const D = require("./lo-trunk-doan.js");
    const spec = {};
    Object.keys(D.TUAN).forEach((key) => {
      const j = JSON.parse(fs.readFileSync(path.join(HW_SPEC, key + ".json"), "utf8"));
      if (!j || !Array.isArray(j.parts) || !j.parts[0] || !Array.isArray(j.topics) || !j.topics[0]) throw new Error("hw-spec " + key + " thiếu đề");
      const ma = (j.lo || []).map((x) => String(x).split(" ")[0]).sort().join(",");
      if (ma !== D.TUAN[key].nodes.slice().sort().join(",")) throw new Error("hw-spec " + key + " lệch node của bộ chấm");
      spec[key] = j;
    });
    bo = { D: D, spec: spec };
  } catch (e) {
    console.warn("[tich-hop] chấm LO: không nạp được bộ chấm đoạn văn (" + (e && e.message) + "), job TRUNK tuần 3+ báo chưa có bộ chấm");
    bo = null;
  }
  return bo;
}
function tenBoCham(b) { return b.D.PHIEN_BAN + " (" + b.D.MODEL + ")"; }

/* ---- LO YouPass ↔ node của tuần ------------------------------------------------------------ */
// Mã: ở code ("T5.1", "TRUNK-T5.1") hoặc đầu nội dung ("T5.1 — Hình thành chuỗi…").
function maNode(lo) {
  const code = String(lo.code == null ? "" : lo.code).trim();
  let m = /(?:^|[^A-Za-z0-9])T(\d{1,2})\.(\d{1,2})$/i.exec(code) || /^T(\d{1,2})\.(\d{1,2})$/i.exec(code);
  if (!m) m = /^\s*T(\d{1,2})\.(\d{1,2})(?!\d)/.exec(String(lo.content == null ? "" : lo.content));
  return m ? "T" + Number(m[1]) + "." + Number(m[2]) : null;
}
// Mảng cùng thứ tự learning_outcomes: mã node của tuần hoặc null. Mỗi node ghép tối đa một LO. Luật ngưỡng chép
// ghepLO của cham-lo-trunk-bud.js (mã + nội dung không quá khác ≥ 0.3; chỉ nội dung thì ≥ 0.6 và hơn node kề ≥ 0.15).
function ghepLO(D, los, key) {
  const t = D.TUAN[key];
  const daDung = new Set();
  const out = los.map(() => null);
  los.forEach((lo, i) => {
    const ma = maNode(lo);
    if (!ma || t.nodes.indexOf(ma) < 0 || daDung.has(ma)) return;
    if (C.dice(C.tuCua(String(lo.content || "").replace(/^\s*T\d{1,2}\.\d{1,2}\s*[-–—:]?\s*/, "")), C.tuCua(t.noi_dung[ma])) < 0.3) return;
    out[i] = ma;
    daDung.add(ma);
  });
  los.forEach((lo, i) => {
    if (out[i]) return;
    const a = C.tuCua(lo.content);
    const diem = t.nodes.filter((ma) => !daDung.has(ma))
      .map((ma) => ({ ma: ma, d: C.dice(a, C.tuCua(t.noi_dung[ma])) }))
      .sort((x, y) => y.d - x.d);
    if (!(diem.length && diem[0].d >= 0.6 && (!diem[1] || diem[0].d - diem[1].d >= 0.15))) return;
    out[i] = diem[0].ma;
    daDung.add(diem[0].ma);
  });
  return out;
}

/* ---- một node → comment + bằng chứng ------------------------------------------------------- */
const cau = (s) => { const x = String(s || "").replace(/\s+/g, " ").trim(); return x && !/[.!?…]$/.test(x) ? x + "." : x; };
/* Các mục kiểm của node theo thứ tự đoạn văn, mỗi mục kèm tên hàng chứa nó ("Supporting idea 2", "Topic sentence"):
   tinh() đã gắn từng mục vào đúng hàng (hang[].nhom), kể cả các dòng phụ (`phu`: chỗ đứt mắt xích của tuần 5, không
   tính vào số mục nhưng là thứ học sinh cần đọc nhất). Mục không nằm hàng nào (không có) thì theo thứ tự muc_kiem. */
function mucTheoHang(n, hang) {
  const ds = [];
  const da = new Set();
  (hang || []).forEach((h) => ((h.nhom || {})[n.ma] || []).forEach((m) => { ds.push({ m: m, ten: h.ten }); da.add(m); }));
  n.muc_kiem.forEach((m) => { if (!da.has(m)) ds.push({ m: m, ten: "" }); });
  return ds;
}
function nhanXet(n, hang) {
  if (n.muc == null) return "Bài chưa dùng tới kiến thức này, nên chưa đánh giá được.";
  let s = "Đạt " + n.dat + "/" + n.tong + " " + n.don_vi + ".";
  if (n.chan) s += " " + cau(n.chan);
  // Trần 600 ký tự (như cham-lo-root.js): tên mọi mục chưa đạt luôn có mặt; lời giải, gợi ý thêm theo thứ tự đoạn
  // khi còn chỗ. Bản đầu dừng hẳn ở mục đầu tiên vượt trần, nên chỗ đứt mắt xích (dòng dài nhất) rơi mất.
  const truot = mucTheoHang(n, hang).filter((x) => !x.m.ok).map(({ m, ten }) => ({
    dau: " " + (ten && ten !== "Ngoài khung" ? ten + ", chưa đạt: " : "Chưa đạt: ") + cau(m.chu),
    giai: (m.giai ? " " + cau(m.giai) : "") + (m.sua ? " Gợi ý: " + cau(m.sua) : ""),
  }));
  const dai = (x) => Array.from(x).length;
  let du = 600 - dai(s) - truot.reduce((t, x) => t + dai(x.dau), 0);
  truot.forEach((x) => { if (x.giai && dai(x.giai) <= du) du -= dai(x.giai); else x.giai = ""; });
  truot.forEach((x) => { if (dai(s + x.dau + x.giai) <= 600) s += x.dau + x.giai; });
  return s;
}
// Mức thấp: trích chỗ sai trước; mức khá trở lên: chỗ đúng trước. Chỉ lấy trích nằm nguyên văn trong bài (lo-job.js
// tự tìm vị trí). Tối đa 3.
function bangChung(n, doan, hang) {
  const tach = (s) => String(s || "").split("|").map((x) => x.trim().replace(/^[.…]+|[.…]+$/g, "").trim()).filter(Boolean);
  const coTrong = (q) => doan.toLowerCase().indexOf(q.toLowerCase()) >= 0;
  const sai = [], dung = [];
  mucTheoHang(n, hang).forEach(({ m }) => tach(m.trich).filter(coTrong).forEach((q) => (m.ok ? dung : sai).push(q)));
  const ds = n.muc != null && n.muc <= 1 ? sai.concat(dung) : dung.concat(sai);
  return [...new Set(ds)].slice(0, 3).map((q) => ({ quote: q }));
}

/* ---- đếm cho healthz ------------------------------------------------------------------------ */
const dem = { dung: 0, khong: 0 };
const demLyDo = {};

/* Chấm job bằng bộ chấm đoạn văn nếu đủ điều kiện.
   → { dung: false, ly_do, ghi }   không dùng
   → { dung: true, key, so_tu, model, results, conLai, ma_lo }
   Ném lỗi { code, message, retryable, boCham } khi đã vào chấm mà chưa xong.
   opts.goiModel(body, signal), opts._choThuLaiMs: chỉ bộ kiểm truyền vào (model giả). */
async function thuChamDoan(yc, opts) {
  const o = opts || {};
  const khong = (lyDo, ghi) => {
    dem.khong++;
    demLyDo[lyDo.split(":")[0]] = (demLyDo[lyDo.split(":")[0]] || 0) + 1;
    return { dung: false, ly_do: lyDo, ghi: !!ghi };
  };
  const tuan = TB._kiem.tuanCuaJob(yc);
  if (!tuan) return khong("khong_co_so_lo");
  const b = napBoCham();
  if (!b) return khong("chua_nap_bo_cham", true);
  const key = tuan.key;
  if (!b.D.TUAN[key]) return khong("tuan_ngoai_bo_cham_doan: " + key);
  const kind = yc.ai_review && typeof yc.ai_review === "object" ? String(yc.ai_review.homework_kind || "") : "";
  if (/^sentence/.test(kind)) return khong("khong_phai_bai_doan: homework_kind " + kind.slice(0, 40), true);
  const maLO = ghepLO(b.D, yc.learning_outcomes, key);
  if (!maLO.some(Boolean)) return khong("khong_ghep_duoc_lo: không LO YouPass nào khớp node của " + key, true);

  const boCham = tenBoCham(b);
  const spec = b.spec[key];
  const doan = String((yc.answer && yc.answer.content) || "").replace(/\r\n?/g, "\n").trim();
  const soTu = doan.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const results = [];
  const conLai = [];
  if (soTu < TU_TOI_THIEU) {
    yc.learning_outcomes.forEach((lo, i) => {
      if (!maLO[i]) { conLai.push(i + 1); return; }
      results.push({ idx: i + 1, level: 0, confidence: null, evidence: [],
        comment: "Bài làm mới có " + soTu + " từ, chưa đủ một đoạn thân bài để đánh giá kiến thức này." });
    });
    dem.dung++;
    return { dung: true, key: key, so_tu: soTu, model: boCham, results: results, conLai: conLai, ma_lo: maLO };
  }
  const input = b.D.dauVao(spec, doan);
  let doc;
  try {
    doc = await b.D.docDoan(key, input, { goiModel: o.goiModel, signal: o.signal, choThuLaiMs: o._choThuLaiMs });
  } catch (e) {
    if (o.signal && o.signal.aborted) throw Object.assign(loi("MODEL_TIMEOUT", "Quá giờ chấm.", true), { boCham: boCham });
    if (e && /YOUPASS_KEY/.test(String(e.message))) throw Object.assign(loi("AI_NOT_CONFIGURED", "Máy chủ chưa có khoá gọi AI.", true), { boCham: boCham });
    throw Object.assign(loi("LO_GRADING_INCOMPLETE", "Chưa đọc xong đoạn văn (cổng AI chậm hoặc trả sai khuôn ba lần). Gửi lại job để chấm lại.", true), { boCham: boCham });
  }
  let kq;
  try { kq = b.D.tinh(key, input.doan_van, doc, spec); }
  catch (e) { throw Object.assign(loi("GRADER_ERROR", "Bộ chấm LO gặp lỗi khi tổng hợp.", true), { boCham: boCham }); }
  yc.learning_outcomes.forEach((lo, i) => {
    const n = maLO[i] ? kq.nodes.find((x) => x.ma === maLO[i]) : null;
    if (!n) { conLai.push(i + 1); return; }
    results.push({ idx: i + 1, level: n.muc, confidence: null, comment: nhanXet(n, kq.hang), evidence: bangChung(n, input.doan_van, kq.hang) });
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

module.exports = { thuChamDoan, moTa, napBoCham, _kiem: { maNode, ghepLO, nhanXet, bangChung } };
