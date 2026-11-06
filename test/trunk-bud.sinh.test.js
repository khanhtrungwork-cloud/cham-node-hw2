// Sinh bằng tools/xuat-tu-writing-extra.cjs từ bộ kiểm của writing-extra-1984. Đừng sửa tay.
// Kiểm bộ chấm LO HW2 theo node: ROOT tuần 1–9, TRUNK tuần 1–2, BUD tuần 1 (Mastery Hub/tich-hop/lo-trunk-bud.js), không gọi mạng.
// Chạy: node scripts/kiem-lo-trunk-bud.js
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const L = require('../src/lo-trunk-bud.js');
const GOC = path.resolve(__dirname, '..');

let hong = 0;
async function phan(ten, fn) {
  try { await fn(); console.log('✓ ' + ten); } catch (e) { hong++; console.log('✗ ' + ten + '\n   ' + e.message); }
}

(async () => {
  await phan('bộ LO mỗi tuần khớp đúng mã và chữ trong hw-spec (= node "Dạy & đo" của bản đồ)', () => {
    for (const [key, t] of Object.entries(L.TUAN)) {
      const s = JSON.parse(fs.readFileSync(path.join(GOC, 'data', 'hw-spec', key + '.json'), 'utf8'));
      // hw-spec ROOT ghi LO kiểu khác ("R6.2 Đặt …", tuần 9 chỉ có mã): kiểm mã, và mã nào cũng có chữ node.
      // TRUNK/BUD ghi "R1.1 — chữ node": kiểm cả chữ.
      const ma = (x) => (/\bR\d\.\d\b/.exec(x) || [''])[0];
      assert.deepEqual(s.lo.map(ma), t.lo, key + ': mã LO');
      s.lo.forEach((x) => {
        const [, ...chu] = x.split(' — ');
        if (chu.length && key.indexOf('ROOT-') !== 0) assert.equal(chu.join(' — ').trim(), L.NODE[ma(x)], key + ' ' + ma(x));
        else assert.ok(L.NODE[ma(x)], key + ' ' + ma(x) + ': thiếu chữ node');
      });
      const soCau = key === 'ROOT-W09' ? 10 : 8;
      assert.equal(s.parts[0].items.length, soCau, key + ': ' + soCau + ' câu');
    }
  });

  await phan('prompt mỗi tuần không nhắc LO ngoài tuần, không còn mã L kiểu ROOT, không id 3', () => {
    for (const t of Object.values(L.TUAN)) {
      assert.notEqual(t.id, 3, 'id 3 làm council chèn luật thì L3.2');
      const p = L.G.buildSystemPrompt(t.id) + '\n' + ['bat_loi', 'kho_tinh', 'nhan_tu', 'trong_tai'].map((v) => L.G.buildStageSystemPrompt(t.id, v)).join('\n');
      const ngoai = [...new Set(p.match(/\bR\d\.\d\b/g) || [])].filter((m) => !t.lo.includes(m));
      assert.deepEqual(ngoai, [], t.khoa + ' tuần ' + t.tuan + ': LO ngoài tuần');
      assert.ok(!/\bL\d\.\d\b/.test(L.luatCuaTuan(t).join('\n')), 'còn mã L');
      assert.ok(p.includes('"lesson": ' + t.id), 'khuôn trả lời mang id tuần');
    }
  });

  await phan('đề gửi model mang yêu cầu chung "MỘT câu phức" ở TRUNK tuần 2 và BUD tuần 1, không ở TRUNK tuần 1', () => {
    const it = { prompt_vi: 'Câu đề.' };
    assert.equal(L.deCuaCau('TRUNK-W01', it), 'Câu đề.');
    assert.ok(L.deCuaCau('TRUNK-W02', it).includes('MỘT câu phức'));
    assert.ok(L.deCuaCau('BUD-W01', it).includes('mệnh đề tính từ'));
  });

  await phan('thang mức quy về 8 câu rồi làm tròn: trùng thang ROOT khi LO dùng ở cả 8 câu, dưới 8 câu không bắt đúng hết', () => {
    const root = (dat) => (dat < 3 ? 0 : dat < 5 ? 1 : dat < 7 ? 2 : 3);   // vendor/lo-summary.cjs
    for (let d = 0; d <= 8; d++) assert.equal(L.mucTheoTiLe(d, 8), root(d), d + '/8');
    assert.equal(L.mucTheoTiLe(0, 0), null);
    // [đúng, số câu có dùng, mức]: 5/6 và 6/7 là Thành thạo (≈ 7/8), trước 12-10 so thẳng tỉ lệ với 7/8 nên hụt.
    [[5, 6, 3], [6, 7, 3], [4, 5, 2], [3, 5, 2], [4, 7, 2], [4, 6, 2], [3, 4, 2], [2, 3, 2],
     [3, 6, 1], [2, 6, 1], [1, 3, 1], [1, 2, 1], [2, 4, 1], [1, 4, 0], [2, 7, 0], [1, 5, 0], [1, 1, 3], [0, 1, 0]]
      .forEach(([d, a, m]) => assert.equal(L.mucTheoTiLe(d, a), m, d + '/' + a));
  });

  await phan('tổng kết: câu "không yêu cầu" không vào mẫu số; LO không câu nào dùng ra null và không tính vào số LO', () => {
    const t = L.TUAN['TRUNK-W02'];
    const cau = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, data: { ket_qua_lo: t.lo.map((ma) => {
      if (ma === 'R7.1') return { ma_lo: ma, ket_qua: 'dat', ly_do: 'khong_bat_buoc' };
      if (ma === 'R6.1') return n <= 2 ? { ma_lo: ma, ket_qua: 'khong_dat', ly_do: 'dung_sai' } : { ma_lo: ma, ket_qua: 'dat', ly_do: 'dung' };
      if (ma === 'R9.2') return n <= 4 ? { ma_lo: ma, ket_qua: 'dat', ly_do: 'dung' } : { ma_lo: ma, ket_qua: 'dat', ly_do: 'khong_bat_buoc' };
      return { ma_lo: ma, ket_qua: 'dat', ly_do: 'dung' };
    }) } }));
    const k = L.tongKet('TRUNK-W02', cau);
    const lo = (ma) => k.lo.find((x) => x.ma === ma);
    assert.equal(lo('R6.1').ap_dung, 8); assert.equal(lo('R6.1').dat, 6); assert.equal(lo('R6.1').muc, 2);
    assert.equal(lo('R7.1').muc, null); assert.equal(lo('R7.1').nhan, 'Bài chưa dùng tới');
    assert.equal(lo('R9.2').ap_dung, 4); assert.equal(lo('R9.2').muc, 3);
    assert.equal(k.so_lo_co_muc, 5); assert.equal(k.so_lo_dat, 5); assert.equal(k.muc, 2);
  });

  await phan('hội đồng 4 lượt chạy trọn với model giả, dùng đúng bộ model họ Gemini 3.8', async () => {
    const goi = [];
    const cau = 'Studying abroad benefits students because they are offered higher salaries.';
    const ketQuaLO = (id) => L.G.maLO(id).map((ma) => ({ ma_lo: ma, ket_qua: 'dat', ly_do: 'dung', yeu_cau_de: '', bang_chung: 'Studying abroad', giai_thich: 'Dùng đúng.', goi_y_sua: '' }));
    const gia = async (body, stage) => {
      goi.push([stage, body.model]);
      const id = 102;
      if (stage === 'bat_loi') return JSON.stringify({ lesson: id, flags: [] });
      const ra = { lesson: id, ket_qua_lo: ketQuaLO(id), ghi_chu_khac: [] };
      if (stage !== 'trong_tai') ra.kiem_tra_flag = [];
      return JSON.stringify(ra);
    };
    const kq = await L.chamCau('TRUNK-W02', { n: 1, prompt_vi: 'Du học có lợi cho sinh viên.', dap_an_goi_y: 'x' }, cau, { goiModel: gia });
    assert.equal(goi.length, 4);
    assert.deepEqual(goi.map((x) => x[0]).sort(), ['bat_loi', 'kho_tinh', 'nhan_tu', 'trong_tai']);
    goi.forEach(([v, m]) => assert.equal(m, L.MODEL_THEO_VAI[v].model, v));
    assert.equal(kq.data.ket_qua_lo.length, 6);
  });

  await phan('câu bỏ trống: không gọi model, không đạt mọi LO', async () => {
    let goi = 0;
    const kq = await L.chamCau('BUD-W01', { n: 3, prompt_vi: 'x', dap_an_goi_y: 'y' }, '  ', { goiModel: async () => { goi++; return ''; } });
    assert.equal(goi, 0);
    assert.equal(kq.data.ket_qua_lo.length, 14);
    assert.ok(kq.data.ket_qua_lo.every((x) => x.ket_qua === 'khong_dat'));
  });

  console.log(hong ? '\n✗ ' + hong + ' phần hỏng' : '\n✓ tất cả đạt');
  if (hong) process.exitCode = 1;
})();
