"use strict";
/* ============================================================
   NỐI BỘ CHẤM LO THEO NODE vào API D (14-10): ROOT tuần 1–9, TRUNK tuần 1–2, BUD tuần 1

   Bộ chấm là lo-trunk-bud.js: LO của tuần = node "Dạy & đo" trên bản đồ Node kiến thức, mỗi câu qua
   NGUYÊN hội đồng 4 lượt của gói anh Trung (bắt lỗi → khó tính ∥ nhân từ → trọng tài), model họ Gemini
   3.8. File này chỉ NỐI: nhận job → tìm tuần → câu đề của tuần trong hw-spec → tách bài làm → chấm từng
   câu → tongKet của lo-trunk-bud.js → results của API D. Tách câu, ghép LO dùng chung hàm với
   cham-lo-root.js (R.chung). Từ 14-10 (user chốt "toàn bộ root đều chấm theo node") đây là đường DUY
   NHẤT chấm ROOT: gói anh Trung qua cham-lo-root.js không còn chấm job nào.

   Chỉ dùng khi đủ các điều kiện sau. Thiếu một cái thì thuChamTrunkBud trả { dung: false, ly_do }
   và cả job về bộ chấm tạm (cham-lo.js ghi log lý do):
     1. Job là HW2 của một tuần có trong TUAN của lo-trunk-bud.js: content_key "root|trunk|bud-writing-week-N",
        hoặc class_level + lesson_number N; homework_kind (nếu có) là "sentence".
     2. Tách được bài làm thành đúng số câu của đề (8; ROOT tuần 9: 10). Số câu không có = câu bỏ trống.
     3. Ít nhất một LO YouPass khớp LO của tuần: theo mã node ("R1.1", ở code hoặc đầu nội dung; nội
        dung không quá khác), rồi theo nội dung (gần như trùng chữ). LO không khớp thì bản tạm chấm riêng.
        Hội đồng chỉ chấm các LO khớp (sổ con của tuần), mỗi lượt tối đa 8 LO (hỏi nhiều hơn thì chia đều thành
        nhiều nhóm, ghép lại trước khi tính mức): đo 14-10, prompt 16 LO làm lượt gọi quá 150 giây và hai job song
        song đều quá trần 10 phút; 3 LO thì job ROOT tuần 9 (10 câu) xong trong 6 phút.

   ⚠ CÂU ĐỀ LUÔN LẤY TỪ hw-spec (Mastery Cham/data/hw-spec/<KEY>.json: bản chị Linh 08/10, cũng là đề đang
   có trên trang Mastery), KHÔNG đọc chữ đề trong job (user chốt 14-10 "toàn bộ lấy đề mới đang có sẵn trên
   mastery"). Đề gửi model = prompt_vi + yêu cầu chung của tuần (deCuaCau), đáp án tham khảo = dap_an_goi_y,
   y như trang chấm thử. Bản sáng 14-10 đọc đề trong job (nền tảng lúc 08/10 còn đề cũ 5–6 câu): đã bỏ.

   Câu bỏ trống tính không đạt mọi LO, không gọi model (như ROOT). Lượt nào của hội đồng hỏng thì
   lo-trunk-bud.js tự thử lại riêng lượt đó (tối đa 3 lần); vẫn hỏng thì job báo failed, retryable;
   YouPass gửi lại cùng job_id thì chỉ chấm các câu còn thiếu (giữ trong RAM 6 giờ, như ROOT).

   Mức của LO KHÁC ROOT, cố ý (đầu lo-trunk-bud.js): tính trên các câu CÓ DÙNG LO đó, quy về thang
   8 câu rồi làm tròn. Không câu nào dùng tới → level null, comment nói rõ.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const R = { chung: require("./chung.js") };

const C = R.chung;
const GOI = path.join(__dirname, "..", "vendor", "homework-grading");
const HW_SPEC = path.join(__dirname, "..", "data", "hw-spec");
const UPSTREAM = "https://tech-proxy.youpass.vn/v1/chat/completions";
const SONG_SONG = 3;   // lượt hội đồng chạy cùng lúc (một lượt = một câu × một nhóm LO); gói anh Trung dùng 2
const GIU_NHO_MS = 6 * 3600 * 1000;
const NHO_TOI_DA = 200;

function loi(code, message, retryable) {
  const e = new Error(message);
  e.code = code;
  e.retryable = !!retryable;
  return e;
}

/* ---- nạp bộ chấm + câu đề hw-spec (một lần; hỏng thì mọi job của đường này dùng bản tạm) ------- */
let bo;   // undefined: chưa nạp; null: nạp hỏng
function napBoCham() {
  if (bo !== undefined) return bo;
  try {
    const L = require("./lo-trunk-bud.js");
    const spec = {};
    Object.keys(L.TUAN).forEach((key) => {
      const j = JSON.parse(fs.readFileSync(path.join(HW_SPEC, key + ".json"), "utf8"));
      const items = j && Array.isArray(j.parts) && j.parts[0] && j.parts[0].items;
      if (!Array.isArray(items) || !items.length) throw new Error("hw-spec " + key + " không có câu đề");
      spec[key] = items.slice().sort((a, b) => a.n - b.n);
    });
    const { createModelTransport } = require(path.join(GOI, "lib", "transport.cjs"));
    bo = { L: L, spec: spec, createModelTransport: createModelTransport };
  } catch (e) {
    console.warn("[tich-hop] chấm LO: không nạp được bộ chấm theo node (" + (e && e.message) + "), job ROOT/TRUNK/BUD dùng bộ chấm tạm");
    bo = null;
  }
  return bo;
}
function tenBoCham(b) { return b.L.PHIEN_BAN + " (gemini-3.8)"; }

/* ---- 1. job nào là HW2 của tuần có sổ LO (key dạng "TRUNK-W01", có trong TUAN hay không thì bước sau xét) ---- */
function tuanCuaJob(yc) {
  const ls = yc.lesson && typeof yc.lesson === "object" ? yc.lesson : {};
  const ck = String(ls.content_key || "").trim().toLowerCase();
  let khoa;
  let so;
  if (ck) {
    const m = /^(trunk|bud|root)-writing-week-(\d{1,2})$/.exec(ck);
    if (!m) return null;
    khoa = m[1].toUpperCase();
    so = Number(m[2]);
  } else {
    khoa = String(ls.class_level || "").trim().toUpperCase();
    so = ls.lesson_number == null || ls.lesson_number === "" ? NaN : Number(ls.lesson_number);
    if (["TRUNK", "BUD", "ROOT"].indexOf(khoa) < 0 || !Number.isInteger(so)) return null;
  }
  return { khoa: khoa, so: so, key: khoa + "-W" + String(so).padStart(2, "0") };
}

/* ---- 2. câu đề của tuần: hw-spec (bản chị Linh 08/10, đề đang có trên trang Mastery) ---------------- */
// lo-trunk-bud.js tự dựng đề gửi model từ câu hw-spec (deCuaCau: prompt_vi + yêu cầu chung của tuần) và đáp án tham khảo.
function cauDe(b, key) { return b.spec[key]; }

/* ---- 3. tách bài làm thành n câu: cách của gói trước, rồi cách lỏng (như tachCau của ROOT) ---- */
// parseAnswers của gói (vendor/hw2-helpers.cjs) với n câu thay vì 8: đánh số mỗi câu đúng một lần, không
// thiếu câu nào, không có chữ trước số đầu tiên; không đánh số thì phải đúng n dòng.
function tachChat(text, n) {
  const dong = String(text || "").replace(/\r\n?/g, "\n").trim().split("\n");
  if (!dong.some((x) => C.DAU_SO_GOI.test(x))) {
    const ds = dong.map((x) => x.trim()).filter(Boolean);
    return ds.length === n ? ds : null;
  }
  const cau = Array(n).fill(null);
  let dang = -1;
  for (const x of dong) {
    const m = C.DAU_SO_GOI.exec(x);
    if (m) {
      const so = Number(m[1]);
      if (so < 1 || so > n || cau[so - 1] !== null) return null;
      dang = so - 1;
      cau[dang] = m[2];
    } else if (dang >= 0) cau[dang] += "\n" + x;
    else if (x.trim()) return null;
  }
  const kq = cau.map((x) => (x || "").trim());
  return kq.every(Boolean) ? kq : null;
}
function tachCau(text, n) {
  const dong = String(text || "").replace(/\r\n?/g, "\n").split("\n");
  let cau = null;
  let cach = "goi";
  if (dong.some((x) => C.DAU_SO_GOI.test(x)) || !dong.some((x) => C.DAU_SO.test(x))) cau = tachChat(text, n);
  if (!cau) { cau = C.tachLong(text, n); cach = "long"; }
  if (!Array.isArray(cau) || cau.length !== n) return null;
  const sach = cau.map(C.donCau);
  return sach.some(Boolean) ? { cau: sach, cach: cach } : null;
}

/* ---- 4. LO YouPass ↔ LO (node) của tuần ----------------------------------------------- */
// Mã node: ở code ("R1.1", "TRUNK-R1.1", "1.1", "L1.1"), hoặc đầu nội dung ("R1.1 — Nhận diện…").
// Mã T…/B… (node riêng của TRUNK/BUD) chưa thuộc sổ nào ở đây nên không nhận.
function maNode(lo) {
  const code = String(lo.code == null ? "" : lo.code).trim();
  let m = /(?:^|[^A-Za-z0-9])[LR]?\s*(\d{1,2})\s*\.\s*(\d{1,2})\s*$/i.exec(code);
  if (!m) m = /^\s*R(\d{1,2})\.(\d{1,2})(?!\d)/.exec(String(lo.content == null ? "" : lo.content));
  return m ? "R" + Number(m[1]) + "." + Number(m[2]) : null;
}
// Trả mảng cùng thứ tự learning_outcomes: mã node của tuần hoặc null. Mỗi node ghép tối đa một LO YouPass.
function ghepLO(L, los, key) {
  const dsLo = L.TUAN[key].lo;
  const daDung = new Set();
  const out = los.map(() => null);
  los.forEach((lo, i) => {
    const ma = maNode(lo);
    if (!ma || dsLo.indexOf(ma) < 0 || daDung.has(ma)) return;
    if (C.dice(C.tuCua(String(lo.content || "").replace(/^\s*R\d{1,2}\.\d{1,2}\s*[-–—:]?\s*/, "")), C.tuCua(L.NODE[ma])) < 0.3) return;
    out[i] = ma;
    daDung.add(ma);
  });
  // Theo nội dung như ROOT (≥ 0.6, hơn LO kế tiếp ≥ 0.15). Thêm một lối: TRÙNG HẲN bộ chữ của một node thì
  // nhận dù node kề chỉ kém một chữ: R4.1 / R4.2 chỉ khác "adjective" / "adverb", luật cách biệt sẽ bỏ cả hai.
  los.forEach((lo, i) => {
    if (out[i]) return;
    const a = C.tuCua(lo.content);
    const diem = dsLo.filter((ma) => !daDung.has(ma))
      .map((ma) => ({ ma: ma, d: C.dice(a, C.tuCua(L.NODE[ma])) }))
      .sort((x, y) => y.d - x.d);
    const ro = diem.length && diem[0].d >= 0.6 && (!diem[1] || diem[0].d - diem[1].d >= 0.15 || (diem[0].d === 1 && diem[1].d < 1));
    if (!ro) return;
    out[i] = diem[0].ma;
    daDung.add(diem[0].ma);
  });
  return out;
}

/* ---- gọi model: hạn 150 giây mỗi lượt (lo-trunk-bud.js), huỷ theo trần của job --------- */
async function goiCoHan(goiModel, body, stage, signal, hetGio) {
  if (signal && signal.aborted) throw new Error("Grading cancelled");
  const ac = new AbortController();
  const huy = () => ac.abort();
  if (signal) signal.addEventListener("abort", huy, { once: true });
  let hen;
  const dung = new Promise((_, reject) => {
    ac.signal.addEventListener("abort", () => reject(new Error(signal && signal.aborted ? "Grading cancelled" : "Model request timed out")), { once: true });
    hen = setTimeout(() => ac.abort(), hetGio);
  });
  try {
    return await Promise.race([goiModel(body, { stage: stage, signal: ac.signal }), dung]);
  } finally {
    clearTimeout(hen);
    if (signal) signal.removeEventListener("abort", huy);
  }
}

/* ---- câu đã chấm của job chưa xong, để lượt gửi lại chỉ chấm tiếp phần thiếu ----------- */
const nho = new Map();   // job_id → { het, khoa, cau: { n: kết quả chamCau } }
function layNho(jobId, khoa) {
  const bayGio = Date.now();
  nho.forEach((v, k) => { if (v.het < bayGio) nho.delete(k); });
  const v = nho.get(jobId);
  return v && v.khoa === khoa ? v.cau : {};
}
function ghiNho(jobId, khoa, cau) {
  if (!jobId) return;
  nho.delete(jobId);
  nho.set(jobId, { het: Date.now() + GIU_NHO_MS, khoa: khoa, cau: cau });
  while (nho.size > NHO_TOI_DA) nho.delete(nho.keys().next().value);
}

/* ---- kết quả một LO → comment + bằng chứng (khuôn của cham-lo-root.js) ------------------ */
function nhanXet(lo) {
  if (lo.muc == null) return "Chưa câu nào trong bài cần dùng kiến thức này, nên chưa đánh giá được.";
  const trong = [];
  const sai = [];
  lo.cau.forEach((x) => {
    if (x.ly_do === "bo_trong") trong.push(x.n);
    else if (x.ket_qua === "khong_dat") sai.push(x);
  });
  let s = "Đạt " + lo.dat + "/" + lo.ap_dung + " câu có dùng kiến thức này";
  if (lo.khong_yeu_cau) s += " (" + lo.khong_yeu_cau + " câu còn lại không cần dùng)";
  s += ".";
  if (trong.length) s += " Câu " + C.noiSo(trong) + " bỏ trống.";
  for (const x of sai) {
    let gt = String(x.giai_thich || "").replace(/\s+/g, " ").trim();
    if (!gt) continue;
    if (!/[.!?…]$/.test(gt)) gt += ".";
    const them = " Câu " + x.n + ": " + gt;
    if (Array.from(s + them).length > 600) break;
    s += them;
  }
  return s;
}
// Mức thấp: trích chỗ sai trước; mức khá trở lên: trích chỗ dùng đúng trước. Tối đa 3.
function bangChung(lo) {
  const tach = (s) => String(s || "").split("|").map((x) => x.trim().replace(/^[.…]+|[.…]+$/g, "").trim()).filter(Boolean);
  const sai = [];
  const dung = [];
  lo.cau.forEach((x) => {
    if (x.ket_qua === "khong_dat" && x.ly_do === "dung_sai") sai.push(...tach(x.bang_chung));
    else if (x.ket_qua === "dat" && x.ly_do === "dung") dung.push(...tach(x.bang_chung));
  });
  const ds = lo.muc != null && lo.muc <= 1 ? sai.concat(dung) : dung.concat(sai);
  return ds.slice(0, 3).map((q) => ({ quote: q }));
}

/* ---- đếm cho healthz -------------------------------------------------------------- */
const dem = { dung: 0, tam: 0 };
const demLyDo = {};

/* Chấm job bằng bộ chấm theo node nếu đủ điều kiện.
   → { dung: false, ly_do, ghi }   không dùng (ghi = nên ghi log: job của khoá có sổ mà không dùng được)
   → { dung: true, key, so_lo, so_nhom, so_cau, cach_tach, model, results, conLai, ma_lo }
   Ném lỗi { code, message, retryable, boCham } khi đã vào chấm mà chưa xong.
   opts.goiModel(body, { stage, signal }), opts._choThuLaiMs: chỉ bộ kiểm truyền vào (model giả, khỏi chờ thử lại). */
async function thuChamTrunkBud(yc, opts) {
  const o = opts || {};
  const signal = o.signal;
  const khong = (lyDo, ghi) => {
    dem.tam++;
    demLyDo[lyDo.split(":")[0]] = (demLyDo[lyDo.split(":")[0]] || 0) + 1;
    return { dung: false, ly_do: lyDo, ghi: !!ghi };
  };
  const tuan = tuanCuaJob(yc);
  if (!tuan) return khong("khong_co_so_lo");
  const b = napBoCham();
  if (!b) return khong("chua_nap_bo_cham", true);
  const key = tuan.key;
  if (!b.L.TUAN[key]) return khong("tuan_ngoai_bo_cham: " + tuan.khoa + " tuần " + tuan.so + " (bộ chấm có " + Object.keys(b.L.TUAN).filter((k) => k.indexOf("#") < 0).join(", ") + ")", true);
  const kind = yc.ai_review && typeof yc.ai_review === "object" ? yc.ai_review.homework_kind : null;
  if (kind && kind !== "sentence") return khong("khong_phai_bai_cau: homework_kind " + String(kind).slice(0, 40), true);
  const de = cauDe(b, key);
  const n = de.length;
  const tach = tachCau(String((yc.answer && yc.answer.content) || ""), n);
  if (!tach) return khong("khong_tach_duoc_" + n + "_cau", true);
  const maLO = ghepLO(b.L, yc.learning_outcomes, key);
  if (!maLO.some(Boolean)) return khong("khong_ghep_duoc_lo: không LO YouPass nào khớp LO của " + key, true);
  // Chỉ chấm các LO của tuần mà job hỏi (sổ con, soCon trong lo-trunk-bud.js), và mỗi lượt hội đồng tối đa
  // L.LO_MOT_LUOT LO, chia đều (chiaNhom): đo 14-10, prompt 16 LO làm lượt gọi quá 150 giây, 3 LO thì 10 câu xong trong 6 phút.
  const keyCham = b.L.soCon(key, maLO.filter(Boolean));
  const loCham = b.L.TUAN[keyCham].lo;
  const nhom = b.L.chiaNhom(key, loCham);

  const boCham = tenBoCham(b);
  const khoa = keyCham + "|" + nhom.join(",") + "|" + b.L.PHIEN_BAN + "|" + crypto.createHash("sha256")
    .update(JSON.stringify(de.map((it) => [it.n, it.prompt_vi, it.dap_an_goi_y]))).digest("hex").slice(0, 16);
  const daCo = layNho(yc.job_id, khoa);
  const phan = {};   // n → { khoá nhóm → kết quả chamCau }
  const viec = [];
  de.forEach((c, i) => {
    const cau = String(tach.cau[i]).trim();
    phan[c.n] = {};
    nhom.forEach((kn) => {
      const cu = daCo[c.n] && daCo[c.n][kn];
      if (cu && cu.cau === cau) phan[c.n][kn] = cu;
      else viec.push({ c: c, cau: tach.cau[i], kn: kn });
    });
  });
  let goiModel = o.goiModel;
  // Câu bỏ trống không gọi model (lo-trunk-bud.js tự xử), nên chỉ cần khoá AI khi có câu viết.
  if (!goiModel && viec.some((v) => v.cau.replace(/[^\p{L}]/gu, "").length >= 2)) {
    const khoaAi = process.env.YOUPASS_KEY || "";
    if (!khoaAi) throw Object.assign(loi("AI_NOT_CONFIGURED", "Máy chủ chưa có khoá gọi AI.", true), { boCham: boCham });
    goiModel = require("./cong-du-phong.js").boc(b.createModelTransport({ url: UPSTREAM, apiKey: khoaAi }));
  }
  const goi = (body, stage) => goiCoHan(goiModel, body, stage, signal, b.L.HET_GIO_MS);
  const loiCau = [];
  let ke = 0;
  async function tho() {
    while (ke < viec.length) {
      if (signal && signal.aborted) return;
      const v = viec[ke++];
      try {
        const kq = await b.L.chamCau(v.kn, v.c, v.cau, { goiModel: goi, signal: signal, choThuLaiMs: o._choThuLaiMs });
        phan[v.c.n][v.kn] = kq;
        if (!kq.bo_trong) ghiNho(yc.job_id, khoa, phan);
      } catch (e) {
        if (signal && signal.aborted) return;
        if (!loiCau.some((x) => x.so === v.c.n)) loiCau.push({ so: v.c.n, buoc: (e && e.stage) || null });
      }
    }
  }
  await Promise.all(Array.from({ length: SONG_SONG }, tho));
  if (signal && signal.aborted) throw Object.assign(loi("MODEL_TIMEOUT", "Quá giờ chấm.", true), { boCham: boCham });
  if (loiCau.length) {
    const so = loiCau.map((x) => x.so).sort((a, b2) => a - b2);
    throw Object.assign(loi("LO_GRADING_INCOMPLETE", "Chưa chấm xong câu " + C.noiSo(so) +
      " (cổng AI chậm hoặc trả sai khuôn). Gửi lại job thì chỉ chấm tiếp các câu này.", true), { boCham: boCham, cau_loi: loiCau });
  }
  // Ghép kết quả các nhóm của một câu thành một, theo thứ tự LO của sổ con, để tongKet đọc như một lượt chấm.
  const ketQua = de.map((c) => b.L.ghepNhom(loCham, b.L.TUAN[keyCham].id, nhom.map((kn) => phan[c.n][kn])));
  let tong;
  try { tong = b.L.tongKet(keyCham, ketQua); }
  catch (e) { throw Object.assign(loi("GRADER_ERROR", "Bộ chấm LO gặp lỗi khi tổng hợp.", true), { boCham: boCham }); }
  nho.delete(yc.job_id);
  const results = [];
  const conLai = [];
  yc.learning_outcomes.forEach((lo, i) => {
    const x = maLO[i] ? tong.lo.find((y) => y.ma === maLO[i]) : null;
    if (!x) { conLai.push(i + 1); return; }
    results.push({ idx: i + 1, level: x.muc, confidence: null, comment: nhanXet(x), evidence: bangChung(x) });
  });
  dem.dung++;
  return { dung: true, key: key, so_lo: loCham.length, so_nhom: nhom.length, so_cau: n, cach_tach: tach.cach, model: boCham, results: results, conLai: conLai, ma_lo: maLO };
}

/* Cho healthz: nạp được không, phiên bản, tuần, model từng vai, đếm job theo đường chấm. */
function moTa() {
  const b = napBoCham();
  if (!b) return { co_bo_cham: false, dem: Object.assign({}, dem), ly_do_tam: Object.assign({}, demLyDo) };
  const model = {};
  Object.keys(b.L.MODEL_THEO_VAI).forEach((k) => { model[k] = b.L.MODEL_THEO_VAI[k].model; });
  return {
    co_bo_cham: true, phien_ban: b.L.PHIEN_BAN, tuan: Object.keys(b.L.TUAN).filter((k) => k.indexOf("#") < 0), model: model,
    dem: Object.assign({}, dem), ly_do_tam: Object.assign({}, demLyDo),
  };
}

module.exports = {
  thuChamTrunkBud, moTa, napBoCham,
  _kiem: { tuanCuaJob, cauDe, tachCau, tachChat, maNode, ghepLO, nhanXet, bangChung, nho },
};
