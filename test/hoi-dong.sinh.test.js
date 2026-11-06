#!/usr/bin/env node
// Sinh bằng tools/xuat-tu-writing-extra.cjs từ bộ kiểm của writing-extra-1984. Đừng sửa tay.
/* Kiểm hội đồng 4 lượt của các bộ chấm đoạn văn (Mastery Hub/tich-hop/hoi-dong-doan.js). Không gọi mạng.
   Điều quan trọng nhất cần giữ: hội đồng chỉ đổi NGƯỜI ĐỌC, không đổi code đếm: bài mẫu đi qua hội đồng giả (trọng tài trả đúng bản
   đã lưu) phải ra đúng mức đã lưu, ở cả sáu bộ chấm. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const GOC = path.join(__dirname, "..");
const TH = path.join(GOC, "src");
const H = require(path.join(TH, "hoi-dong-doan.js"));
const { MODEL_THEO_VAI } = require(path.join(TH, "lo-trunk-bud.js"));
const B = require(path.join(TH, "lo-bloom.js"));

let dat = 0, hong = 0;
async function ca(ten, fn) {
  try { await fn(); dat++; console.log("✓ " + ten); }
  catch (e) { hong++; console.log("✗ " + ten + "\n   " + String(e && e.stack || e).split("\n").slice(0, 4).join("\n   ")); }
}
const DOAN = "Studying abroad brings many benefits. Students learn new skills, which helps them find better jobs.";
const co = (doc) => JSON.stringify(doc);
const VAN = { y: true };
// Bộ chấm giả tối giản: doc phải có trường y là true
const cfgGia = (goiModel, them) => Object.assign({
  system: "PROMPT GỐC", user: "<du_lieu_cham>bài</du_lieu_cham>", doc: (raw) => JSON.parse(raw),
  kiem: (o) => (o && o.y === true ? [] : ["y phải là true."]), doanVan: DOAN, trichHopLe: B.trichHopLe, maxTokens: 16000,
  goiModel, choThuLaiMs: 0, lanThu: 3,
}, them || {});
const FLAG = { id: "F1", muc: "tron_chuoi", loai: "sai", trich: "find better jobs", nghi_van: "Chuỗi dừng ở đâu." };
// Model giả theo vai; rieng[vai] thay câu trả lời của vai đó (nhận số lần đã gọi vai đó)
function moHinh(nhat, rieng) {
  const dem = {};
  const mac = { bat_loi: () => co({ flags: [] }), kho_tinh: () => co(VAN), nhan_tu: () => co(VAN), trong_tai: () => co(VAN) };
  return async (body) => {
    const vai = H.vaiCua(body);
    dem[vai] = (dem[vai] || 0) + 1;
    if (nhat) nhat.push({ vai, body });
    const f = (rieng && rieng[vai]) || mac[vai];
    return f(dem[vai]);
  };
}

(async () => {
  await ca("bốn vai đúng thứ tự, đúng model của ROOT, giáo viên nhận flags, trọng tài nhận hai bản", async () => {
    const nhat = [];
    const kt = { y: true, ai: "khó tính", kiem_tra_flag: [{ id: "F1", ket_luan: "dung", ly_do: "Đúng." }] };
    const nt = { y: true, ai: "nhân từ", kiem_tra_flag: [{ id: "F1", ket_luan: "bat_nham", ly_do: "Oan." }] };
    const kq = await H.chay(cfgGia(moHinh(nhat, {
      bat_loi: () => co({ flags: [FLAG] }), kho_tinh: () => co(kt), nhan_tu: () => co(nt),
      trong_tai: () => co({ y: true, ai: "chốt", kiem_tra_flag: [] }),
    })));
    assert.deepStrictEqual(nhat.map((x) => x.vai), ["bat_loi", "kho_tinh", "nhan_tu", "trong_tai"]);
    nhat.forEach((x) => {
      assert.equal(x.body.model, MODEL_THEO_VAI[x.vai].model, "model " + x.vai);
      assert.equal(x.body.temperature, 0);
      assert.ok(x.body.messages[0].content.startsWith("PROMPT GỐC\n\n" + H.TIEU_DE[x.vai]), "prompt gốc đứng trước vai");
      assert.ok(x.body.messages[1].content.startsWith("<du_lieu_cham>bài</du_lieu_cham>"), "tin nhắn gốc đứng trước");
    });
    assert.ok(nhat[0].body.messages[1].content.indexOf("du_lieu_hoi_dong") < 0, "bắt lỗi không xem gì thêm");
    assert.ok(nhat[0].body.max_tokens <= 8192);
    const kho = nhat[1].body.messages[1].content;
    assert.ok(kho.indexOf("find better jobs") >= 0, "giáo viên có flag");
    assert.ok(kho.indexOf("giao_vien_nhan_tu") < 0, "giáo viên không xem bản của người kia");
    const tt = nhat[3].body.messages[1].content;
    assert.ok(tt.indexOf("giao_vien_kho_tinh") >= 0 && tt.indexOf("giao_vien_nhan_tu") >= 0 && tt.indexOf("Oan.") >= 0, "trọng tài có hai bản");
    assert.equal(kq.ai, "chốt", "kết quả là bản của trọng tài");
    assert.ok(!("kiem_tra_flag" in kq), "bỏ kiem_tra_flag khỏi bản cuối");
    assert.equal(kq._hoiDong.so_lan_goi, 4);
    assert.equal(kq._hoiDong.flags.length, 1);
    assert.ok(co(kq).indexOf("_hoiDong") < 0, "dữ liệu đo không vào JSON");
  });
  await ca("model của bốn vai trùng khít bảng của ROOT (lo-trunk-bud.js), và đủ ba model họ 3.8", () => {
    assert.equal(H.MODEL_THEO_VAI, MODEL_THEO_VAI);
    assert.deepStrictEqual(H.moTa(), { luot: 4, model: { bat_loi: "ag/gemini-3.8-flash", kho_tinh: "ag/gemini-3.8-flash-high", nhan_tu: "ag/gemini-3.8-flash-medium", trong_tai: "ag/gemini-3.8-flash-high" } });
  });
  await ca("bắt lỗi sai khuôn: trích sai nguyên văn, id trùng, thiếu flags thì gọi lại kèm lý do", async () => {
    const hop = H.kiemFlags({ flags: [FLAG] }, DOAN, B.trichHopLe);
    assert.deepStrictEqual(hop, []);
    assert.ok(H.kiemFlags({ flags: [Object.assign({}, FLAG, { trich: "không có" })] }, DOAN, B.trichHopLe)[0].includes("nguyên văn"));
    assert.ok(H.kiemFlags({ flags: [FLAG, FLAG] }, DOAN, B.trichHopLe).some((x) => /không trùng/.test(x)));
    assert.ok(H.kiemFlags({}, DOAN, B.trichHopLe)[0].includes("mảng"));
    assert.deepStrictEqual(H.kiemFlags({ flags: [{ id: "F1", muc: "x", loai: "thieu", trich: "", nghi_van: "Thiếu." }] }, DOAN, B.trichHopLe), [], "loại thiếu được để trích rỗng");
    const nhat = [];
    const kq = await H.chay(cfgGia(moHinh(nhat, { bat_loi: (n) => (n === 1 ? co({ y: true }) : co({ flags: [] })) })));
    assert.equal(kq.y, true);
    const lai = nhat.filter((x) => x.vai === "bat_loi")[1].body.messages;
    assert.match(lai[lai.length - 1].content, /KHÔNG hợp lệ[\s\S]*flags phải là mảng/);
    assert.equal(lai[lai.length - 2].role, "assistant");
  });
  await ca("giáo viên phải kiểm đủ từng flag: thiếu id, id lạ, sai ket_luan đều bị trả lại; không có flag thì được bỏ trường", async () => {
    const F = [FLAG];
    assert.ok(H.kiemKiemTra({}, F)[0].includes("mảng"));
    assert.ok(H.kiemKiemTra({ kiem_tra_flag: [] }, F).some((x) => /thiếu F1/.test(x)));
    assert.ok(H.kiemKiemTra({ kiem_tra_flag: [{ id: "F9", ket_luan: "dung", ly_do: "x" }] }, F).some((x) => /lạ/.test(x)));
    assert.ok(H.kiemKiemTra({ kiem_tra_flag: [{ id: "F1", ket_luan: "co", ly_do: "x" }] }, F).some((x) => /ket_luan/.test(x)));
    assert.deepStrictEqual(H.kiemKiemTra({}, []), []);
    const nhat = [];
    await H.chay(cfgGia(moHinh(nhat, {
      bat_loi: () => co({ flags: [FLAG] }),
      kho_tinh: (n) => co(Object.assign({}, VAN, n === 1 ? {} : { kiem_tra_flag: [{ id: "F1", ket_luan: "dung", ly_do: "Đúng." }] })),
      nhan_tu: () => co(Object.assign({}, VAN, { kiem_tra_flag: [{ id: "F1", ket_luan: "bat_nham", ly_do: "Oan." }] })),
    })));
    assert.equal(nhat.filter((x) => x.vai === "kho_tinh").length, 2, "khó tính gọi lại một lần");
    assert.equal(nhat.filter((x) => x.vai === "nhan_tu").length, 1, "chỉ thử lại đúng lượt hỏng");
  });
  await ca("giáo viên trả sai khuôn của bộ chấm (kiem) thì thử lại đúng lượt đó, kèm lỗi của kiem", async () => {
    const nhat = [];
    await H.chay(cfgGia(moHinh(nhat, { nhan_tu: (n) => (n === 1 ? co({ y: false }) : co(VAN)) })));
    const lai = nhat.filter((x) => x.vai === "nhan_tu")[1].body.messages;
    assert.match(lai[lai.length - 1].content, /y phải là true/);
  });
  await ca("trọng tài nhắc tới hội đồng trong giai_thich thì bị trả lại: chữ đó đi thẳng vào nhận xét gửi học sinh", async () => {
    const nhat = [];
    const kq = await H.chay(cfgGia(moHinh(nhat, {
      trong_tai: (n) => co(Object.assign({}, VAN, { muc: [{ giai_thich: n === 1 ? "Theo giáo viên khó tính thì chưa đạt." : "Chuỗi chưa tới đích." }] })),
    })));
    assert.equal(nhat.filter((x) => x.vai === "trong_tai").length, 2);
    assert.equal(kq.muc[0].giai_thich, "Chuỗi chưa tới đích.");
    const lai = nhat.filter((x) => x.vai === "trong_tai")[1].body.messages;
    assert.match(lai[lai.length - 1].content, /muc\[0\]\.giai_thich/);
    // Chữ của giáo viên thì không xét: họ không gửi tới học sinh
    const k2 = await H.chay(cfgGia(moHinh(null, { kho_tinh: () => co(Object.assign({}, VAN, { giai_thich: "flag F1 đúng." })) })));
    assert.equal(k2.y, true);
  });
  await ca("một vai hỏng ba lần: ném lỗi có tên vai, trọng tài không chạy, không có lượt gọi mồ côi", async () => {
    const nhat = [];
    let chuaXong = 0;
    const goc = moHinh(nhat, { kho_tinh: () => "không phải JSON" });
    const goi = async (b) => { chuaXong++; try { return await goc(b); } finally { chuaXong--; } };
    await assert.rejects(H.chay(cfgGia(goi)), (e) => e.stage === "kho_tinh");
    assert.equal(chuaXong, 0);
    assert.equal(nhat.filter((x) => x.vai === "kho_tinh").length, 3);
    assert.equal(nhat.filter((x) => x.vai === "trong_tai").length, 0);
    const lanLoi = [];
    await assert.rejects(H.chay(cfgGia(moHinh(null, { bat_loi: () => "hỏng" }), { onLoi: (lan, e) => lanLoi.push(e.stage + lan) })));
    assert.deepStrictEqual(lanLoi, ["bat_loi1", "bat_loi2", "bat_loi3"]);
  });
  await ca("job bị huỷ giữa chừng: dừng ngay, lỗi mang cờ huy", async () => {
    const ac = new AbortController();
    const nhat = [];
    const goc = moHinh(nhat);
    const goi = async (b) => { const r = await goc(b); if (H.vaiCua(b) === "bat_loi") ac.abort(); return r; };
    await assert.rejects(H.chay(cfgGia(goi, { signal: ac.signal })), (e) => e.huy === true);
    assert.equal(nhat.length, 1);
  });

  /* ---- cả sáu bộ chấm: bài mẫu đi qua hội đồng giả ra đúng mức đã lưu ---- */
  const giaDoc = (doc, nhat) => async (body) => {
    const vai = H.vaiCua(body);
    if (nhat) nhat.push(vai);
    return vai === "bat_loi" ? co({ flags: [] }) : co(doc);
  };
  await ca("BLOOM-W01 (lo-bloom.js): 4 lượt cho một đoạn, kiểm đúng khuôn, sai khuôn thì thử lại", async () => {
    const doan = "Raising the price of unhealthy food has several benefits. Firstly, people eat less sugar.";
    const d = { ts: { trich: "", x_loi_hai_ro: false, cung_chieu: false, giai_thich: "Chưa có." }, si: [] };
    assert.equal(B.MODEL, H.TEN_MODEL);
    const nhat = [];
    const kq = await B.docDoan({ doan_van: doan }, { goiModel: giaDoc(d, nhat), choThuLaiMs: 0 });
    assert.equal(nhat.length, 4);
    assert.deepStrictEqual(JSON.parse(co(kq)), d);
    await assert.rejects(B.docDoan({ doan_van: doan }, { choThuLaiMs: 0, goiModel: giaDoc({ ts: 1 }) }));
  });
  console.log("\n" + dat + " ca đạt, " + hong + " ca hỏng");
  if (hong) process.exitCode = 1;
})();
