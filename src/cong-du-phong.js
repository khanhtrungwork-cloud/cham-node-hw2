"use strict";
/* ============================================================
   DỰ PHÒNG KHI CỔNG AI HẾT QUOTA CHO BỘ CHẤM LO HW2 (05-11, user: "bài nào thiếu LO thì sửa")

   Đo 05-11: họ ag/gemini-3.8-flash* trả 503 kèm "Individual quota reached… Resets in 42h46m", họ 3.7 trả 403, họ 3.6 trả 404, cc/ trả 401
   (hết hạn đăng nhập), chỉ ag/gemini-3-flash còn chạy. Bộ chấm LO chỉ gọi họ 3.8 nên MỌI job failed, CRM treo "YES đang đánh giá mục tiêu…".

   File này bọc transport của bộ chấm: model chính báo lỗi quota / không dùng được (HTTP 401, 403, 404, 429, 503) thì gọi lại đúng lượt đó bằng
   model dự phòng. Không đổi prompt, không đổi code đếm mức. Lỗi khác (quá giờ, sai khuôn) giữ nguyên đường thử lại của bộ chấm.
   Sau SAU_LAN_HONG lần hỏng liền, model chính được nghỉ NGHI_MS rồi mới thử lại, để khỏi mất 20–40 giây chờ lỗi ở mỗi lượt.

   ⚠ Bản chấm bằng model dự phòng chưa đo độ ổn định như họ 3.8. Đếm số lượt ở healthz `cham_lo.du_phong` để biết còn đang dùng hay không.
   Tắt hẳn: đặt TICH_HOP_LO_MODEL_DU_PHONG=tat trong .env của máy chủ.
   ============================================================ */
const SAU_LAN_HONG = 3;
const NGHI_MS = 10 * 60 * 1000;
const LOI_DOI_MODEL = /Model gateway HTTP (401|403|404|429|503)\b/;

const dem = { goi_du_phong: 0, du_phong_hong: 0 };
const hongLien = new Map();   // model chính → số lần hỏng liền
const nghiDen = new Map();    // model chính → mốc thử lại
let lanCuoi = null;

function tenDuPhong() {
  const s = String(process.env.TICH_HOP_LO_MODEL_DU_PHONG || "").trim();
  if (/^(tat|off|0)$/i.test(s)) return "";
  return s || "ag/gemini-3-flash";
}

/* goi(body, opts) là hàm createModelTransport trả về. Trả hàm cùng chữ ký. opts.bayGio: chỉ bộ kiểm. */
function boc(goi, opts) {
  const o = opts || {};
  const bayGio = o.bayGio || Date.now;
  return async function goiCoDuPhong(body, tuyChon) {
    const duPhong = tenDuPhong();
    const chinh = body && body.model;
    const goiDuPhong = async () => {
      dem.goi_du_phong++;
      lanCuoi = new Date(bayGio()).toISOString();
      try { return await goi(Object.assign({}, body, { model: duPhong }), tuyChon); }
      catch (e) { dem.du_phong_hong++; throw e; }
    };
    if (duPhong && chinh !== duPhong && (nghiDen.get(chinh) || 0) > bayGio()) return goiDuPhong();
    try {
      const kq = await goi(body, tuyChon);
      hongLien.delete(chinh);
      return kq;
    } catch (e) {
      if (!duPhong || chinh === duPhong || !LOI_DOI_MODEL.test(String(e && e.message))) throw e;
      const n = (hongLien.get(chinh) || 0) + 1;
      hongLien.set(chinh, n);
      if (n >= SAU_LAN_HONG) {
        nghiDen.set(chinh, bayGio() + NGHI_MS);
        hongLien.delete(chinh);
        console.warn("[tich-hop] chấm LO: " + chinh + " hỏng " + n + " lần liền (" + e.message + "), dùng " + duPhong + " trong " + Math.round(NGHI_MS / 60000) + " phút");
      }
      return goiDuPhong();
    }
  };
}

/* Cho healthz. */
function moTa() {
  const con = {};
  const bay = Date.now();
  nghiDen.forEach((t, m) => { if (t > bay) con[m] = Math.round((t - bay) / 1000); });
  return { model: tenDuPhong() || null, goi_du_phong: dem.goi_du_phong, du_phong_hong: dem.du_phong_hong, lan_cuoi: lanCuoi, dang_nghi_giay: con };
}
function _xoa() { hongLien.clear(); nghiDen.clear(); dem.goi_du_phong = 0; dem.du_phong_hong = 0; lanCuoi = null; }

module.exports = { boc, moTa, tenDuPhong, _xoa, SAU_LAN_HONG, NGHI_MS };
