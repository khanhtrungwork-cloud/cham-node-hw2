"use strict";
/* ============================================================
   NỐI BỘ CHẤM BLOOM THEO NODE vào API D (02-11, user: "sử dụng làm cách chấm chính cho database của team tech luôn")

     · HW2 BLOOM tuần 1 (2 đoạn thân bài cho 2 đề) → lo-bloom.js, tiêu chí của giáo viên (docx): T4.1, T3.1, T3.2. Mức theo bảng
       "Quy ra 4 mức ứng dụng". Các LO khác của tuần (B4.7, B4.2, B2.2) tiêu chí không chấm: để trống.

   Chỉ dùng khi: job là HW2 BLOOM tuần có bộ chấm (content_key "bloom-writing-week-N"; content_key dạng khác thì class_level BLOOM + lesson_number N) ·
   ít nhất một LO khớp node đã chấm (theo mã ở code hoặc đầu nội dung, rồi theo chữ, luật
   ngưỡng chép cham-lo-trunk-doan.js). Thiếu điều kiện thì { dung: false } và cham-lo.js báo "chưa có bộ chấm" như mọi tuần khác.

   ⚠ ĐỀ LẤY TỪ hw-spec, không đọc chữ đề trong job; đầu vào gửi model dựng bằng ĐÚNG hàm dauVao mà script bài mẫu dùng: kết quả bài
   mẫu mới nói được gì về job thật.

   ⚠ TUẦN 1: BÀI GỘP HAI ĐOẠN TRONG MỘT CHUỖI. Từ 03-11 (user: "làm mọi cách để bloom chấm node được", TRUNK không có cửa từ chối này) job
   LUÔN được chấm: chiaBai (lo-bloom.js) thử dấu "Đề 1:", rồi từ khoá theo dòng, theo câu; không cắt được thì coi cả bài là một đoạn, đề còn
   lại tính là chưa viết (mục của đoạn đó trượt, không gọi model). Trước đó bài như vậy ra bai-sai-khuon, mọi LO để trống. Hai đoạn đọc song
   song (mỗi đoạn một hội đồng 4 lượt, hoi-dong-doan.js, 05-11); một lượt hỏng ba lần thì cả job failed, retryable.
   ⚠ KHÔNG xét homework_kind: bài BLOOM tuần nào cũng là đoạn hoặc essay, nhãn kind không đổi được cách đọc (03-11).
   ============================================================ */
const fs = require("fs");
const path = require("path");
const TD = require("./cham-lo-trunk-doan.js");
const R = { chung: require("./chung.js") };

const C = R.chung;
const HW_SPEC = path.join(__dirname, "..", "data", "hw-spec");
const TU_TOI_THIEU = 20;
const NODE_W1 = ["T4.1", "T3.1", "T3.2"];
/* Bốn LO còn lại của tuần 1 (05-11, user: "bài nào thiếu LO thì sửa, chưa có bộ chấm thì dựng tạm"). Tiêu chí docx của giáo viên không chấm mấy node này,
   nên đây là ĐO TẠM, giáo viên chưa duyệt: code suy từ phần model đã đọc (ketQuaW1), không gọi thêm model, không vào mức cả bài. */
const NODE_W1_TAM = ["B2.1", "B4.7", "B4.2", "B2.2"];

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
    const W1 = require("./lo-bloom.js");
    const doc = (key) => JSON.parse(fs.readFileSync(path.join(HW_SPEC, key + ".json"), "utf8"));
    const s1 = doc("BLOOM-W01");
    if (!Array.isArray(s1.parts) || s1.parts.length !== 2) throw new Error("hw-spec BLOOM-W01 phải có 2 phần");
    const noiDung = (s, nodes) => {
      const m = {};
      nodes.forEach((ma) => {
        const dong = (s.lo || []).find((x) => String(x).split(" ")[0] === ma);
        if (!dong) throw new Error("hw-spec " + s.key + " thiếu node " + ma);
        m[ma] = String(dong).replace(/^\S+\s*[-–—:]?\s*/, "");
      });
      return m;
    };
    bo = {
      "BLOOM-W01": { spec: s1, nodes: NODE_W1.concat(NODE_W1_TAM), noi_dung: noiDung(s1, NODE_W1.concat(NODE_W1_TAM)), ten: W1.PHIEN_BAN + " (" + W1.MODEL + ")", W: W1 },
    };
  } catch (e) {
    console.warn("[tich-hop] chấm LO: không nạp được bộ chấm BLOOM (" + (e && e.message) + "), job BLOOM báo chưa có bộ chấm");
    bo = null;
  }
  return bo;
}

/* ---- tìm tuần ---- */
function tuanCuaJob(yc) {
  const ls = yc.lesson && typeof yc.lesson === "object" ? yc.lesson : {};
  const ck = String(ls.content_key || "").trim().toLowerCase();
  let so;
  if (ck) {
    const m = /^bloom-writing-week-(\d{1,2})$/.exec(ck);
    if (m) so = Number(m[1]);
    else if (/^(root|trunk|bud)\b/.test(ck)) return null;   // content_key nói rõ khoá khác: thắng class_level
  }
  if (so == null) {
    if (!/^BLOOM\b/.test(String(ls.class_level || "").trim().toUpperCase())) return null;
    so = ls.lesson_number == null || ls.lesson_number === "" ? NaN : Number(ls.lesson_number);
    if (!Number.isInteger(so)) return null;
  }
  return { so: so, key: "BLOOM-W" + String(so).padStart(2, "0") };
}

/* ---- LO YouPass ↔ node ---- */
function maNode(lo) {
  const code = String(lo.code == null ? "" : lo.code).trim();
  let m = /(?:^|[^A-Za-z0-9])((?:BL|B|T)\d{1,2}\.\d{1,2})$/i.exec(code);
  if (!m) m = /^\s*((?:BL|B|T)\d{1,2}\.\d{1,2})(?!\d)/i.exec(String(lo.content == null ? "" : lo.content));
  return m ? m[1].toUpperCase() : null;
}
function ghepLO(t, los) {
  const daDung = new Set();
  const out = los.map(() => null);
  los.forEach((lo, i) => {
    const ma = maNode(lo);
    if (!ma || t.nodes.indexOf(ma) < 0 || daDung.has(ma)) return;
    if (C.dice(C.tuCua(String(lo.content || "").replace(/^\s*(?:BL|B|T)\d{1,2}\.\d{1,2}\s*[-–—:]?\s*/i, "")), C.tuCua(t.noi_dung[ma])) < 0.3) return;
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

/* ---- tuần 1: phần model đọc + code đếm → nodes và hàng theo khuôn của nhanXet / bangChung ------------------------------ */
function ketQuaW1(W1, doanDaTinh) {
  const tong = W1.tongKet(doanDaTinh);
  const hang = [];
  const t41 = [], t31 = [], t32 = [];
  doanDaTinh.forEach((d, i) => {
    const tenD = "Đoạn " + (i + 1);
    const hTs = { ten: tenD + ", topic sentence", nhom: {} };
    const m41 = { ok: d.ts.dat, chu: d.ts.co ? "Topic sentence nêu X + lợi/hại, cùng chiều 2 supporting idea" + (!d.ts.dat && W1.LOI_TS[d.ts.loi] ? " · " + W1.LOI_TS[d.ts.loi] : "") : "Đoạn chưa có topic sentence",
      trich: d.ts.trich || "", giai: d.ts.giai_thich };
    hTs.nhom["T4.1"] = [m41];
    t41.push(m41);
    hang.push(hTs);
    [0, 1].forEach((k) => {
      const x = d.si[k];
      const h = { ten: tenD + ", supporting idea " + (k + 1), nhom: {} };
      let m31, m32;
      if (!x) {
        m31 = { ok: false, chu: "Đoạn thiếu supporting idea này" };
        m32 = { ok: false, chu: "Đoạn thiếu supporting idea này" };
      } else {
        const thieu31 = [];
        if (!d.cau_truc_dung) thieu31.push(d.ts.co ? "đoạn phải có đúng 2 supporting idea" : "đoạn thiếu topic sentence");
        if (!x.core_nhan_dien) thieu31.push("chưa rõ core idea");
        if (!x.co_phat_trien || !String(x.development || "").trim()) thieu31.push("chưa có development");
        if (!x.dev_bam_core) thieu31.push("development lạc khỏi core idea");
        m31 = { ok: x.dat_t31, chu: x.dat_t31 ? "Đúng cấu trúc core idea + development" : "Cấu trúc: " + thieu31.join(", "), trich: x.core, giai: x.dat_t31 ? "" : x.giai_thich };
        const thieu32 = [];
        if (!x.du_tu) thieu32.push("độ dài (" + x.so_tu + " từ, cần ít nhất " + W1.TU_TOI_THIEU + ")");
        if (!x.toi_dich) thieu32.push("chưa tới một lợi/hại rõ đối tượng và khía cạnh");
        if (!x.trong_pham_vi || x.dung_gioi_han === false) thieu32.push("lệch phạm vi đề");
        if (!x.noi_mach) thieu32.push("chưa mạch lạc");
        if (!x.co_phat_trien || !String(x.development || "").trim()) thieu32.push("chưa có development");
        // Trượt CHỈ vì số từ thì không kèm lời của model: nó đánh giá lập luận (thường là khen), đứng sau "chưa đạt" đọc ra nói ngược.
        const chiThieuTu = !x.du_tu && thieu32.length === 1;
        m32 = { ok: x.dat_t32, chu: x.dat_t32 ? "Development đạt đủ 4 mục" : "Development: " + thieu32.join(", "), trich: x.development, giai: x.dat_t32 || chiThieuTu ? "" : x.giai_thich };
      }
      h.nhom["T3.1"] = [m31];
      h.nhom["T3.2"] = [m32];
      t31.push(m31);
      t32.push(m32);
      hang.push(h);
    });
  });
  const dv = { "T4.1": "topic sentence", "T3.1": "supporting idea", "T3.2": "development" };
  const ds = { "T4.1": t41, "T3.1": t31, "T3.2": t32 };
  const nodes = NODE_W1.map((ma) => {
    const n = tong.node[ma];
    return { ma, dat: n.dat, tong: n.tong, muc: n.muc, don_vi: dv[ma], chan: "", muc_kiem: ds[ma] };
  });
  return { nodes: nodes.concat(nodeTamW1(W1, doanDaTinh, hang)), hang, tong };
}

/* Bốn node đo tạm của tuần 1, chỉ dựng từ phần model đã đọc. Mỗi mục gắn vào đúng hàng để nhận xét theo thứ tự đoạn văn. */
function nodeTamW1(W1, doanDaTinh, hang) {
  const theoTen = (ten) => hang.find((h) => h.ten === ten);
  const gan = (ten, ma, m) => { const h = theoTen(ten); if (h) h.nhom[ma] = (h.nhom[ma] || []).concat(m); };
  const b21 = [], b47 = [], b42 = [], b22 = [];
  doanDaTinh.forEach((d, i) => {
    const tenD = "Đoạn " + (i + 1);
    const mVt = { ok: d.cau_truc_dung, chu: d.cau_truc_dung ? "Đoạn đúng vai trò Body: topic sentence + 2 supporting idea" : "Đoạn chưa đúng vai trò Body: " + (d.ts.co ? "phải có đúng 2 supporting idea" : "thiếu topic sentence"), trich: d.ts.trich || "" };
    b21.push(mVt);
    gan(tenD + ", topic sentence", "B2.1", mVt);
    const mDe = { ok: d.ts.co && d.ts.loi !== "chep_de", chu: !d.ts.co ? "Đoạn chưa có topic sentence để xét việc viết lại đề" : d.ts.loi === "chep_de" ? "Topic sentence đang chép đề, chưa viết lại bằng lời của mình" : "Topic sentence viết lại đề bằng lời của mình", trich: d.ts.trich || "" };
    b42.push(mDe);
    gan(tenD + ", topic sentence", "B4.2", mDe);
    [0, 1].forEach((k) => {
      const x = d.si[k];
      const tenO = tenD + ", supporting idea " + (k + 1);
      const okDe = !!x && x.trong_pham_vi === true && x.dung_gioi_han !== false;
      const mPv = { ok: okDe, chu: !x ? "Đoạn thiếu supporting idea này" : okDe ? "Bám đúng chủ đề chính và thông tin giới hạn của đề" : "Lợi hoặc hại cuối chuỗi đã ra ngoài chủ đề chính hoặc phần giới hạn của đề", trich: x ? x.development : "", giai: okDe || !x ? "" : x.giai_thich };
      b47.push(mPv);
      gan(tenO, "B4.7", mPv);
      if (x && (x.loai === "example" || String(x.example_ghi_chu || "").trim())) {
        const lech = String(x.example_ghi_chu || "").trim();
        const mVd = { ok: !lech, chu: lech ? "Example chưa ổn: " + lech : "Example đúng lúc, không quá cá nhân", trich: x.development };
        b22.push(mVd);
        gan(tenO, "B2.2", mVd);
      }
    });
  });
  const ra = (ma, ds, muc, donVi) => ({ ma, dat: ds.filter((x) => x.ok).length, tong: ds.length, muc: muc, don_vi: donVi, chan: "", muc_kiem: ds });
  const dem = (ds) => ds.filter((x) => x.ok).length;
  const mucVd = !b22.length ? null : W1.mucBon(Math.round(dem(b22) / b22.length * 4));
  return [
    ra("B2.1", b21, W1.mucHai(dem(b21)), "đoạn"),
    ra("B4.7", b47, W1.mucBon(dem(b47)), "supporting idea"),
    ra("B4.2", b42, W1.mucHai(dem(b42)), "topic sentence"),
    ra("B2.2", b22, mucVd, "lần dùng example"),
  ];
}

/* ---- đếm cho healthz ---- */
const dem = { dung: 0, khong: 0 };
const demLyDo = {};

/* → { dung: false, ly_do, ghi, chu_sai_khuon? } không dùng
   → { dung: true, key, so_tu, model, results, conLai, ma_lo }
   Ném lỗi { code, message, retryable, boCham } khi đã vào chấm mà chưa xong. opts.goiModel, opts._choThuLaiMs: chỉ bộ kiểm. */
async function thuChamBloom(yc, opts) {
  const o = opts || {};
  const khong = (lyDo, ghi, them) => {
    dem.khong++;
    demLyDo[lyDo.split(":")[0]] = (demLyDo[lyDo.split(":")[0]] || 0) + 1;
    return Object.assign({ dung: false, ly_do: lyDo, ghi: !!ghi }, them || {});
  };
  const tuan = tuanCuaJob(yc);
  if (!tuan) return khong("khong_phai_bloom");
  const b = napBoCham();
  if (!b) return khong("chua_nap_bo_cham", true);
  const key = tuan.key;
  const t = b[key];
  if (!t) return khong("tuan_ngoai_bo_cham_bloom: " + key, true);
  const maLO = ghepLO(t, yc.learning_outcomes);
  if (!maLO.some(Boolean)) return khong("khong_ghep_duoc_lo: không LO YouPass nào khớp node của " + key, true);

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
    return { dung: true, key: key, so_tu: soTu, model: t.ten, results: results, conLai: conLai, ma_lo: maLO };
  }

  const docMot = async (fn) => {
    try { return await fn(); }
    catch (e) {
      if (o.signal && o.signal.aborted) throw Object.assign(loi("MODEL_TIMEOUT", "Quá giờ chấm.", true), { boCham: t.ten });
      if (e && /YOUPASS_KEY/.test(String(e.message))) throw Object.assign(loi("AI_NOT_CONFIGURED", "Máy chủ chưa có khoá gọi AI.", true), { boCham: t.ten });
      throw Object.assign(loi("LO_GRADING_INCOMPLETE", "Chưa đọc xong bài (cổng AI chậm hoặc trả sai khuôn ba lần). Gửi lại job để chấm lại.", true), { boCham: t.ten });
    }
  };
  const dsChon = { goiModel: o.goiModel, signal: o.signal, choThuLaiMs: o._choThuLaiMs };
  let nodes, hang;
  if (key === "BLOOM-W01") {
    const tach = t.W.chiaBai(bai);
    const inputs = t.spec.parts.map((part, i) => t.W.dauVao(part, t.spec, tach[i]));
    // Đoạn dưới 5 từ (hoặc đề chưa viết) không đưa model: đoạn rỗng, mọi mục trượt.
    const docRong = { ts: { trich: "", x_loi_hai_ro: false, cung_chieu: false, giai_thich: "Bài chưa có đoạn cho đề này." }, si: [] };
    const docs = await docMot(() => Promise.all(inputs.map((input) => (t.W.soTu(input.doan_van) >= 5 ? t.W.docDoan(input, dsChon) : docRong))));
    try {
      const daTinh = docs.map((doc, i) => t.W.tinhDoan(doc, !!inputs[i].thong_tin_gioi_han));
      const kq = ketQuaW1(t.W, daTinh);
      nodes = kq.nodes;
      hang = kq.hang;
    } catch (e) { throw Object.assign(loi("GRADER_ERROR", "Bộ chấm LO gặp lỗi khi tổng hợp.", true), { boCham: t.ten }); }
  }
  yc.learning_outcomes.forEach((lo, i) => {
    const n = maLO[i] ? nodes.find((x) => x.ma === maLO[i]) : null;
    if (!n) { conLai.push(i + 1); return; }
    results.push({ idx: i + 1, level: n.muc, confidence: null, comment: TD._kiem.nhanXet(n, hang), evidence: TD._kiem.bangChung(n, bai, hang) });
  });
  dem.dung++;
  return { dung: true, key: key, so_tu: soTu, model: t.ten, results: results, conLai: conLai, ma_lo: maLO };
}

function moTa() {
  const b = napBoCham();
  if (!b) return { co_bo_cham: false, dem: Object.assign({}, dem), ly_do_khong: Object.assign({}, demLyDo) };
  return { co_bo_cham: true, tuan: Object.keys(b), phien_ban: Object.fromEntries(Object.keys(b).map((k) => [k, b[k].ten])),
    dem: Object.assign({}, dem), ly_do_khong: Object.assign({}, demLyDo) };
}

module.exports = { thuChamBloom, moTa, napBoCham, _kiem: { maNode, ghepLO, tuanCuaJob, ketQuaW1 } };
