"use strict";
/* Hàm dùng chung: đọc chữ đề, tách câu, ghép LO. Cắt nguyên văn từ cham-lo-root.js của writing-extra-1984. */
const SO_CAU = 8;

const THUC_THE = { hellip: "…", ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", rarr: "→" };
[["agrave", "à"], ["aacute", "á"], ["acirc", "â"], ["atilde", "ã"], ["egrave", "è"], ["eacute", "é"], ["ecirc", "ê"],
  ["igrave", "ì"], ["iacute", "í"], ["ograve", "ò"], ["oacute", "ó"], ["ocirc", "ô"], ["otilde", "õ"], ["ugrave", "ù"],
  ["uacute", "ú"], ["yacute", "ý"]].forEach(([ten, chu]) => {
  THUC_THE[ten] = chu;
  THUC_THE[ten[0].toUpperCase() + ten.slice(1)] = chu.toUpperCase();
});
function giaiMa(s) {
  return String(s == null ? "" : s).replace(/<[^>]*>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch (e) { return " "; } })
    .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(Number(d)); } catch (e) { return " "; } })
    .replace(/&(nbsp|amp|lt|gt|quot|apos);/gi, " ")
    .replace(/&([A-Za-z]+);/g, (m, ten) => THUC_THE[ten] || m);
}
// Bỏ dấu, chữ thường, chỉ giữ chữ và số: "sức khoẻ" và "sức khỏe" thành một.
function khungChu(s) {
  return giaiMa(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function capTu(s) {
  const t = khungChu(s).split(" ").filter(Boolean);
  const out = [];
  for (let i = 0; i + 1 < t.length; i++) out.push(t[i] + " " + t[i + 1]);
  return out;
}

const CHU_VIET = /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/iu;
// Dòng tiếng Việt: ≥ 40% số từ có dấu tiếng Việt ("I came to Đà Nẵng in 2019" vẫn là tiếng Anh).
function laTiengViet(dong) {
  const tu = String(dong).normalize("NFC").split(/\s+/).filter((w) => /\p{L}/u.test(w));
  return tu.length > 0 && tu.filter((w) => CHU_VIET.test(w)).length / tu.length >= 0.4;
}
const MUI_TEN = /^\s*(?:-->|->|=>|→)\s*/;
// Một câu trả lời: bỏ "-->" đầu dòng, dòng không có chữ, dòng tiếng Việt (em chép lại đề).
function donCau(s) {
  return String(s == null ? "" : s).split("\n")
    .map((x) => x.replace(MUI_TEN, "").trim())
    .filter((x) => /\p{L}/u.test(x) && !laTiengViet(x))
    .join("\n").trim();
}
// Dấu số của gói (vendor/hw2-helpers.cjs): "1.", "1)", "1:", "Câu 1:".
const DAU_SO_GOI = /^\s*(?:Câu\s+)?(\d+)[.)：:]\s*(.*)$/i;
// Dấu số rộng hơn: thêm "Câu 1 -", "1 –", "1/ ", "1 -->". Gạch và "/" phải có khoảng trắng theo
// sau để không nhận nhầm "2-year-old…", "1/2 of…" là số câu.
const DAU_SO = /^\s*(?:câu|cau|c|sentence)?\s*(\d{1,2})\s*(?:[.)：:]|\/(?=\s)|-->|->|=>|→|[-–—](?=\s))\s*(.*)$/i;
/* Cách lỏng: nhận các dấu số của DAU_SO, bỏ dòng trước số đầu tiên (tiêu đề), số thiếu = câu bỏ
   trống. Số ngoài 1–8 hoặc lặp số thì không chắc câu nào ứng với đề nào → null. Không đánh số
   thì phải đúng 8 dòng chữ tiếng Anh. soCau: bộ chấm TRUNK/BUD (cham-lo-trunk-bud.js) dùng chung
   với số câu của đề trong job; bỏ trống là 8 như gói. */
function tachLong(text, soCau) {
  const n = soCau || SO_CAU;
  const dong = String(text || "").replace(/\r\n?/g, "\n").split("\n");
  if (dong.some((x) => DAU_SO.test(x))) {
    const cau = Array(n).fill(null);
    let dang = -1;
    for (const x of dong) {
      const m = DAU_SO.exec(x);
      if (m) {
        const so = Number(m[1]);
        if (so < 1 || so > n || cau[so - 1] !== null) return null;
        dang = so - 1;
        cau[dang] = m[2];
      } else if (dang >= 0) cau[dang] += "\n" + x;
    }
    return cau.map((x) => x || "");
  }
  const ds = dong.map((x) => x.replace(MUI_TEN, "").trim()).filter((x) => /\p{L}/u.test(x) && !laTiengViet(x));
  return ds.length === n ? ds : null;
}

function tuCua(s) { return new Set(khungChu(s).split(" ").filter(Boolean)); }
function dice(a, b) {
  if (!a.size || !b.size) return 0;
  let chung = 0;
  a.forEach((x) => { if (b.has(x)) chung++; });
  return 2 * chung / (a.size + b.size);
}

function noiSo(ds) { return ds.length === 1 ? String(ds[0]) : ds.slice(0, -1).join(", ") + " và " + ds[ds.length - 1]; }

module.exports = { giaiMa, khungChu, capTu, laTiengViet, donCau, tachLong, DAU_SO_GOI, DAU_SO, tuCua, dice, noiSo };
