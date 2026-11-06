"use strict";
// Kiểm bộ chấm HW2 BLOOM tuần 1 (src/lo-bloom.js, src/cham-lo-bloom.js), không gọi mạng, dữ liệu dựng tay.
const fs = require("fs");
const path = require("path");
const W1 = require("../src/lo-bloom.js");
const CB = require("../src/cham-lo-bloom.js");

const spec1 = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "hw-spec", "BLOOM-W01.json"), "utf8"));
let dat = 0;
const truot = [];
const kiem = (dk, ten) => { if (dk) dat++; else truot.push(ten); };
const bang = (a, b, ten) => kiem(JSON.stringify(a) === JSON.stringify(b), ten + ": " + JSON.stringify(a) + " ≠ " + JSON.stringify(b));

/* ---- tách hai đoạn ---- */
const dai = (c, n) => Array(n || 45).fill(c).join(" ");
const tach = (s) => { const r = W1.tachHaiDoan(s); return r ? r.map((x) => x.split(/\s+/)[0]) : null; };
bang(tach("Đề 1:\n" + dai("gia") + "\nĐề 2:\n" + dai("tour")), ["gia", "tour"], "Đề 1: / Đề 2:");
bang(tach("Đề 2:\n" + dai("tour") + "\nĐề 1:\n" + dai("gia")), ["gia", "tour"], "viết đề 2 trước");
bang(tach("**Topic 1:**\n" + dai("gia") + "\n**Topic 2:**\n" + dai("tour")), ["gia", "tour"], "dấu in đậm");
bang(tach(dai("fattening") + "\n\n" + dai("tourist")), ["fattening", "tourist"], "không dấu, hai khối");
bang(W1.tachHaiDoan(dai("gia", 100)), null, "một khối liền: không đoán");
const chia = (s) => W1.chiaBai(s).map((x) => (x ? x.split(/\s+/)[0] : ""));
bang(chia(dai("gia", 100)), ["gia", ""], "chiaBai: một khối không từ khoá: đề 1, đề 2 chưa viết");
bang(chia(dai("tourists", 100)), ["", "tourists"], "chiaBai: một khối về du lịch: đề 2");
bang(chia("Đề 2: " + dai("tour", 30)), ["", "tour"], "chiaBai: chỉ một dấu Đề 2");

/* ---- nối bộ chấm: tìm tuần, ghép LO ---- */
const K = CB._kiem;
bang(K.maNode({ code: "BLOOM-B4.6" }), "B4.6", "mã có tiền tố");
bang(K.maNode({ content: "T4.6 — Có dùng đúng linking device" }), "T4.6", "mã ở đầu nội dung");
bang(K.maNode({ code: "R1.1" }), null, "mã ROOT không nhận");
const b = CB.napBoCham();
kiem(!!b && !!b["BLOOM-W01"] && Object.keys(b).length === 1, "chỉ nạp tuần 1");
const loW1 = spec1.lo.map((x) => ({ code: x.split(" ")[0], content: x.replace(/^\S+\s*\S+\s*/, "") }));
bang(K.ghepLO(b["BLOOM-W01"], loW1).join(","), "B2.1,B4.7,B4.2,T3.1,T4.1,T3.2,B2.2", "đủ 7 LO, 4 LO đo tạm");

/* ---- mức: node chính và bốn node đo tạm, code suy từ phần model đã đọc ---- */
const si = (o) => Object.assign({ core: "c", development: "d", loai: "reason", example_ghi_chu: "", dat_t31: true, dat_t32: true, trong_pham_vi: true, dung_gioi_han: true, co_phat_trien: true, core_nhan_dien: true, dev_bam_core: true }, o);
const doanTot = (t) => ({ ts: { co: true, dat: true, trich: t, loi: "" }, cau_truc_dung: true, si: [si(), si()] });
const kqTot = K.ketQuaW1(W1, [doanTot("A"), doanTot("B")]);
const moi = Object.fromEntries(kqTot.nodes.map((n) => [n.ma, n]));
bang([moi["T4.1"].muc, moi["T3.1"].muc, moi["T3.2"].muc], [3, 3, 3], "bài đủ: ba node chính Tốt");
bang(moi["B4.7"].tong, 4, "B4.7 đếm trên 4 supporting idea");
bang(moi["B2.1"].tong, 2, "B2.1 đếm trên 2 đoạn");
bang(moi["B4.2"].tong, 2, "B4.2 đếm trên 2 topic sentence");
bang(moi["B2.2"].muc, null, "chưa dùng example thì B2.2 để trống");
const docVd = [{ ts: { co: true, dat: true, trich: "A", loi: "" }, cau_truc_dung: true, si: [si({ loai: "example" }), si({ example_ghi_chu: "quá cá nhân", trong_pham_vi: false })] }, { ts: { co: true, dat: true, trich: "B", loi: "chep_de" }, cau_truc_dung: false, si: [null, null] }];
const kqVd = Object.fromEntries(K.ketQuaW1(W1, docVd).nodes.map((n) => [n.ma, [n.dat, n.tong]]));
bang(kqVd["B2.2"], [1, 2], "example ổn đạt, example có ghi chú lệch trượt");
bang(kqVd["B4.7"], [1, 4], "lệch phạm vi và thiếu supporting idea đều trượt B4.7");
bang(kqVd["B4.2"], [1, 2], "topic sentence chép đề trượt B4.2");
bang(kqVd["B2.1"], [1, 2], "đoạn thiếu cấu trúc trượt B2.1");
kqTot.nodes.forEach((n) => bang(n.muc_kiem.filter((m) => m.ok).length, n.dat, "số mục đạt khớp " + n.ma));

if (truot.length) { console.log("✗ " + truot.length + " ca trượt / " + dat + " qua:\n  " + truot.join("\n  ")); process.exit(1); }
console.log("✓ Bộ chấm HW2 BLOOM tuần 1: " + dat + " ca qua");
