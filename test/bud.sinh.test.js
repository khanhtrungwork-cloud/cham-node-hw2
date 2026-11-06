// Sinh bằng tools/xuat-tu-writing-extra.cjs từ bộ kiểm của writing-extra-1984. Đừng sửa tay.
// Kiểm bộ chấm HW2 BUD tuần 2–9 theo node (Mastery Hub/tich-hop/lo-bud-doan.js), KHÔNG gọi mạng: luật đếm trên bài đọc giả,
// kiểm khuôn câu trả lời của model, thử lại khi sai khuôn, và các file kết quả bài mẫu Mastery Cham/lo-doan/BUD-W0x
// (tính lại ra đúng mức đã lưu, mỗi mục kiểm nằm đúng một hàng).
// Chạy: node scripts/kiem-lo-bud.js
'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const D = require('../src/lo-bud-doan.js');
const Bl = require('../src/lo-bloom.js');

const GOC = path.resolve(__dirname, '..');
const spec = (k) => JSON.parse(fs.readFileSync(path.join(GOC, 'data', 'hw-spec', k + '.json'), 'utf8'));
let so = 0, hong = 0;
async function ca(ten, f) {
  try { await f(); so++; console.log('✓ ' + ten); } catch (e) { hong++; console.log('✗ ' + ten + '\n   ' + String(e.stack || e.message).split('\n').slice(0, 3).join('\n   ')); }
}
const nodeCua = (kq, ma) => kq.nodes.find((n) => n.ma === ma);
const lap = (o) => JSON.parse(JSON.stringify(o));

// Tuần 2: đoạn dựng tay.
const TS2 = 'Making art classes compulsory in high school brings several benefits to students.';
const C21 = 'First, art classes help students develop their creativity.';
const D21 = 'Students learn to think in many different ways because art has no fixed answers and every student can try a new idea. Therefore, they can solve problems better and get higher marks in other subjects at school.';
const C22 = 'Furthermore, art helps students reduce stress.';
const D22 = 'This is because art lessons have no exams and no marks at all, so nobody feels afraid. For example, students can paint after long hours of revision and feel calm before they return to their books.';
const DOAN2 = [TS2, C21, D21, C22, D22].join(' ');
const si2 = (o) => Object.assign({ core: C21, development: D21, khop_core_de: 1, loai_core: 'trung_gian', loai_dev: 'impact', core_nhan_dien: true, co_phat_trien: true, dev_bam_core: true, tron_chuoi: true, doi_tuong: 'students', khia_canh: 'marks', trong_pham_vi: true, mach_lac: true, chuoi: 'a → b → c', giai_thich: 'x' }, o);
const si2b = (o) => si2(Object.assign({ core: C22, development: D22, khop_core_de: 2, loai_core: 'dich', loai_dev: 'reason', doi_tuong: '', khia_canh: '' }, o));
const doc2 = (o) => Object.assign({
  doan: [{ ts: { trich: TS2, neu_x: true, y_chinh: true, cung_chieu: true, loi: '', giai_thich: 'x' }, si: [si2(), si2b()], ngoai_khung: [] }],
  lan_dung: [{ trich: 'because art has no fixed answers', cum: 'because', dung: true, sua: '', giai_thich: 'x' }, { trich: 'Therefore', cum: 'therefore', dung: true, sua: '', giai_thich: 'x' }],
  loi_hai: [{ trich: 'brings several benefits to students', dung: true, sua: '', giai_thich: 'x' }],
  example: [],
}, o);

// Tuần 3: hai đoạn dựng tay.
const P1 = 'Living far from home brings several benefits. First, big cities have many companies, which offers more jobs for young people. They can earn a stable income every month and pay all their bills on time, so they can support their parents and save more money for the future. In addition, young people learn important life skills because they must live alone and solve every daily problem without any help from their family. This helps them become more confident at work, so they can get promoted faster than their friends in the end.';
const P2 = 'However, living far from home causes some drawbacks. One drawback is that people often feel lonely because they have no family nearby to share their daily worries and problems after work. As a result, they suffer from long-term stress for many months, which can lead to depression and other serious mental problems later. Furthermore, rural areas lose many young workers when people move away to the big cities. Doing so slows local farming and small factories for many years, which reduces the income of older villagers and widens the gap between rural and urban areas.';
const si3 = (o) => Object.assign({
  core: 'big cities have many companies', development: 'which offers more jobs for young people. | They can earn a stable income every month and pay all their bills on time, so they can support their parents and save more money for the future.',
  khop_core_de: 1, loai_core: 'dich', loai_dev: 'impact', core_nhan_dien: true, co_phat_trien: true, dev_bam_core: true, tron_chuoi: true, doi_tuong: 'young people', khia_canh: 'income', gap: [], vong_tron: false, chuoi: 'a → b → c',
  mo_y: { trich: 'First', dung: true, giai_thich: 'x' }, noi_core_dev: { trich: ', which', dung: true, sua: '', giai_thich: 'x' }, noi_them: [], giai_thich: 'x',
}, o);
const doc3 = () => ({
  doan: [
    { huong: 'loi', ts: { trich: 'Living far from home brings several benefits.', giai_thich: 'x' }, ngoai_khung: [], si: [si3(), si3({
      core: 'young people learn important life skills', development: 'because they must live alone and solve every daily problem without any help from their family. | This helps them become more confident at work, so they can get promoted faster than their friends in the end.',
      khop_core_de: 2, loai_core: 'trung_gian', mo_y: { trich: 'In addition', dung: true, giai_thich: 'x' }, noi_core_dev: { trich: 'because', dung: true, sua: '', giai_thich: 'x' } })] },
    { huong: 'hai', ts: { trich: 'However, living far from home causes some drawbacks.', giai_thich: 'x' }, ngoai_khung: [], si: [si3({
      core: 'people often feel lonely', development: 'because they have no family nearby to share their daily worries and problems after work. | As a result, they suffer from long-term stress for many months, which can lead to depression and other serious mental problems later.',
      mo_y: { trich: 'One drawback is that', dung: true, giai_thich: 'x' }, noi_core_dev: { trich: 'because', dung: true, sua: '', giai_thich: 'x' } }), si3({
      core: 'rural areas lose many young workers when people move away to the big cities.', development: 'Doing so slows local farming and small factories for many years, which reduces the income of older villagers and widens the gap between rural and urban areas.',
      khop_core_de: 2, loai_core: 'trung_gian', mo_y: { trich: 'Furthermore', dung: true, giai_thich: 'x' }, noi_core_dev: { trich: 'Doing so', dung: true, sua: '', giai_thich: 'x' } })] },
  ],
  menh_de: [
    { trich: ', which offers more jobs for young people', kieu: 'which_ca', chu: 'which', dung: true, sua: '', giai_thich: 'x' },
    { trich: 'because they must live alone', kieu: 'adv', chu: 'because', dung: true, sua: '', giai_thich: 'x' },
    { trich: 'because they have no family nearby', kieu: 'adv', chu: 'because', dung: true, sua: '', giai_thich: 'x' },
    { trich: 'when people move away', kieu: 'adv', chu: 'when', dung: true, sua: '', giai_thich: 'x' },
  ],
  tro_lai: [
    { trich: 'This helps them become', kieu: 'this', dung: true, sua: '', giai_thich: 'x' },
    { trich: 'Doing so slows', kieu: 'doing_so', dung: true, sua: '', giai_thich: 'x' },
  ],
});
const BAI3 = P1 + '\n' + P2;

(async () => {
  await ca('node tuần 2, 3 trùng KHÍT trường lo của hw-spec', () => {
    ['BUD-W02', 'BUD-W03'].forEach((k) => {
      assert.deepEqual(D.TUAN[k].nodes.slice().sort(), spec(k).lo.map((x) => x.split(' ')[0]).sort(), k);
      spec(k).lo.forEach((x) => { const ma = x.split(' ')[0]; assert.equal(D.TUAN[k].noi_dung[ma], x.slice(x.indexOf('—') + 2), k + ' ' + ma); });
    });
    Object.keys(D.TUAN).forEach((k) => D.TUAN[k].nodes.forEach((m) => assert.ok(D.TUAN[k].noi_dung[m] && D.TUAN[k].don_vi[m] && D.TUAN[k].ten_ngan[m], k + ' ' + m)));
  });
  await ca('mẫu số 4 và 2 khớp bảng của BLOOM', () => {
    [0, 1, 2, 3, 4].forEach((d) => assert.equal(D.mucBud(d, 4), Bl.mucBon(d)));
    [0, 1, 2].forEach((d) => assert.equal(D.mucBud(d, 2), Bl.mucHai(d)));
    assert.equal(D.mucBud(0, 0), null);
    assert.deepEqual([3, 2, 1, 0].map((d) => D.mucBud(d, 3)), [3, 2, 1, 0]);
  });
  await ca('tuần 2: bài đủ thì mọi node Tốt; B2.2 không dùng thì Bài chưa dùng tới', () => {
    const kq = D.tinh('BUD-W02', DOAN2, doc2());
    ['T4.1', 'T3.1', 'T3.2'].forEach((m) => assert.equal(nodeCua(kq, m).muc, 3, m));
    assert.equal(nodeCua(kq, 'B2.2').muc, null);
    assert.equal(kq.muc_ca_bai, 3);
  });
  await ca('tuần 2: T4.1 trượt mục then chốt tối đa Sai nhiều; không có topic sentence là 0', () => {
    const d = doc2(); d.doan[0].ts.y_chinh = false;
    const n = nodeCua(D.tinh('BUD-W02', DOAN2, d), 'T4.1');
    assert.equal(n.dat, 3); assert.equal(n.muc, 1); assert.ok(n.chan);
    const d2 = doc2(); d2.doan[0].ts.neu_x = false;
    assert.equal(nodeCua(D.tinh('BUD-W02', DOAN2, d2), 'T4.1').muc, 2);
    const d3 = doc2(); d3.doan[0].ts.trich = '';
    assert.equal(nodeCua(D.tinh('BUD-W02', DOAN2, d3), 'T4.1').muc, 0);
  });
  await ca('tuần 2: T3.2 hai đơn vị mỗi supporting idea, ý trung gian chỉ reason thì trượt đúng loại', () => {
    const d = doc2(); d.doan[0].si[0].loai_dev = 'reason';
    const n = nodeCua(D.tinh('BUD-W02', DOAN2, d), 'T3.2');
    assert.equal(n.tong, 4); assert.equal(n.dat, 3); assert.equal(n.muc, 2);
    const d2 = doc2(); d2.doan[0].si[1].loai_dev = 'example'; d2.doan[0].si[1].tron_chuoi = true;
    assert.equal(nodeCua(D.tinh('BUD-W02', DOAN2, d2), 'T3.2').dat, 4, 'ý đích viết example vẫn đúng loại');
  });
  await ca('tuần 2: dưới 40 từ hoặc dưới 2 câu là trượt đơn vị mạch lạc và đủ dài', () => {
    const ngan = 'Making art classes compulsory brings several benefits to students. First, art helps creativity. So students solve problems.';
    const d = doc2();
    d.doan[0].ts.trich = 'Making art classes compulsory brings several benefits to students.';
    d.doan[0].si = [si2({ core: 'art helps creativity', development: 'So students solve problems.' }), si2b({ core: 'art helps creativity', development: 'So students solve problems.' })];
    d.lan_dung = []; d.loi_hai = [];
    const n = nodeCua(D.tinh('BUD-W02', ngan, d), 'T3.2');
    assert.equal(n.dat, 2);
  });
  await ca('tuần 2: chỉ có 1 supporting idea thì T3.1 2/4; T3.1 = 0 thì cả bài tối đa Sai nhiều', () => {
    const d = doc2(); d.doan[0].si = [si2()];
    assert.equal(nodeCua(D.tinh('BUD-W02', DOAN2, d), 'T3.1').dat, 2);
    const d2 = doc2(); d2.doan[0].ts.trich = ''; d2.doan[0].si = [si2({ core_nhan_dien: false })];
    const kq = D.tinh('BUD-W02', DOAN2, d2);
    assert.equal(nodeCua(kq, 'T3.1').muc, 0);
    assert.ok(kq.muc_ca_bai <= 1);
  });
  await ca('tuần 2: B2.2 mỗi lần dùng 3 mục, có mức nhưng không vào mức cả bài', () => {
    const d = doc2(); d.example = [{ trich: 'For example, students can paint', si: 2, dung_luc: true, khong_ca_nhan: false, minh_hoa: true, sua: '', giai_thich: 'x' }];
    const kq = D.tinh('BUD-W02', DOAN2, d);
    const n = nodeCua(kq, 'B2.2');
    assert.equal(n.tong, 3); assert.equal(n.dat, 2); assert.equal(n.muc, 2);
    assert.equal(kq.muc_ca_bai, 3);
  });
  await ca('tuần 3: bài đủ thì Tốt; cặp First và Second không tính lỗi (hồ sơ đã học BUD-W03)', () => {
    const kq = D.tinh('BUD-W03', BAI3, doc3());
    kq.nodes.forEach((n) => assert.equal(n.muc, 3, n.ma + ' ' + n.dat + '/' + n.tong));
    const d = doc3(); d.doan[0].si[0].mo_y.trich = 'First'; d.doan[0].si[1].mo_y = { trich: 'Second', dung: true, giai_thich: 'x' };
    const t = D.tinh('BUD-W03', BAI3.replace('In addition', 'Second'), d);
    assert.equal(D.CAP_MAY_MOC, false);
    assert.equal(nodeCua(t, 'T4.3').dat, 4);
    const b = doc3(); b.doan[0].si[0].mo_y = { trich: '', dung: false, giai_thich: 'x' };
    assert.equal(nodeCua(D.tinh('BUD-W03', BAI3, b), 'T4.3').dat, 3, 'thiếu từ nối mở ý thì trượt');
  });
  await ca('tuần 3: T5.1 trượt khi ít hơn 3 mắt xích, khi có gap, khi ý trung gian chỉ reason', () => {
    const a = doc3(); a.doan[0].si[0].chuoi = 'a → b';
    assert.equal(nodeCua(D.tinh('BUD-W03', BAI3, a), 'T5.1').dat, 3);
    const b = doc3(); b.doan[1].si[0].gap = [{ trich: 'As a result', truoc: 'x', sau: 'y', thieu: 'z', sua: 'w', giai_thich: 'x' }];
    const kqB = D.tinh('BUD-W03', BAI3, b);
    assert.equal(nodeCua(kqB, 'T5.1').dat, 3);
    assert.equal(nodeCua(kqB, 'T5.1').tong, 4, 'dòng lỗ hổng không tính vào mẫu số');
    const c = doc3(); c.doan[0].si[1].loai_dev = 'reason';
    assert.equal(nodeCua(D.tinh('BUD-W03', BAI3, c), 'T5.1').dat, 3);
    assert.equal(D.soMatXich({ chuoi: 'a → [GAP] → b → c' }), 3);
  });
  await ca('tuần 3: T5.2 gán mệnh đề theo supporting idea; có mệnh đề sai hoặc không có thì trượt đúng SI đó', () => {
    const a = doc3(); a.menh_de[1].dung = false;
    assert.equal(nodeCua(D.tinh('BUD-W03', BAI3, a), 'T5.2').dat, 3);
    const b = doc3(); b.menh_de = b.menh_de.slice(0, 2);
    assert.equal(nodeCua(D.tinh('BUD-W03', BAI3, b), 'T5.2').dat, 2);
  });
  await ca('tuần 3: T4.5 mỗi đoạn hai đơn vị: một đoạn không dùng là 2/4, dùng It trỏ cả mệnh đề là sai', () => {
    const a = doc3(); a.tro_lai = a.tro_lai.slice(0, 1);
    assert.equal(nodeCua(D.tinh('BUD-W03', BAI3, a), 'T4.5').dat, 2);
    const b = doc3(); b.tro_lai[1].dung = false;
    assert.equal(nodeCua(D.tinh('BUD-W03', BAI3, b), 'T4.5').dat, 3);
    const c = doc3(); c.tro_lai = [];
    assert.equal(nodeCua(D.tinh('BUD-W03', BAI3, c), 'T4.5').muc, 0);
  });
  await ca('docBai nhận ngoai_khung là mảng chuỗi', async () => {
    const d = doc2(); d.doan[0].ngoai_khung = [TS2];
    const HD = require('../src/hoi-dong-doan.js');
    const r = await D.docBai('BUD-W02', { doan_van: DOAN2 }, { choThuLaiMs: 0, goiModel: async (body) => (HD.vaiCua(body) === 'bat_loi' ? '{"flags":[]}' : JSON.stringify(d)) });
    assert.deepEqual(r.doan[0].ngoai_khung, [{ trich: TS2 }]);
  });
  await ca('kiem: bắt trích không nguyên văn, cờ thiếu, tên ô lạ', () => {
    const input2 = { doan_van: DOAN2 };
    assert.deepEqual(D.kiem('BUD-W02', doc2(), input2), []);
    const a = doc2(); a.doan[0].si[0].core = 'không có trong bài';
    assert.ok(D.kiem('BUD-W02', a, input2).some((x) => /nguyên văn/.test(x)));
    const b = doc2(); delete b.doan[0].si[0].mach_lac;
    assert.ok(D.kiem('BUD-W02', b, input2).some((x) => /mach_lac/.test(x)));
    assert.deepEqual(D.kiem('BUD-W03', doc3(), { doan_van: BAI3 }), []);
  });
  await ca('docBai: sai khuôn thì gọi lại kèm lý do, đúng thì trả về; ba lần hỏng thì ném lỗi', async () => {
    const input = { doan_van: DOAN2 };
    const HD = require('../src/hoi-dong-doan.js');
    const goiLai = [];
    const doc = await D.docBai('BUD-W02', input, { choThuLaiMs: 0, goiModel: async (body) => {
      if (HD.vaiCua(body) === 'bat_loi') return '{"flags":[]}';
      goiLai.push(body);
      if (goiLai.length === 1) return '{"doan":[]}';
      return JSON.stringify(doc2());
    } });
    assert.equal(goiLai.length, 4, 'ba lượt ngoài bắt lỗi + một lần nhờ sửa');
    const lai = goiLai.filter((b) => b.messages.some((m) => m.role === 'assistant'))[0];
    assert.ok(lai.messages[lai.messages.length - 1].content.includes('KHÔNG hợp lệ'));
    assert.equal(doc.doan[0].ts.trich, TS2);
    let n = 0;
    await assert.rejects(D.docBai('BUD-W02', input, { choThuLaiMs: 0, goiModel: async () => { n++; return 'không phải JSON'; } }));
    assert.equal(n, 3);
  });
  await ca('hàng màn chấm thử: mỗi mục kiểm nằm đúng một hàng, tuần nào cũng có đủ phần', () => {
    const kiemHang = (kq, ten) => {
      kq.nodes.forEach((n) => n.muc_kiem.forEach((m) => {
        const dem2 = kq.hang.filter((h) => ((h.nhom || {})[n.ma] || []).includes(m)).length;
        assert.equal(dem2, 1, ten + ' ' + n.ma + ' "' + m.chu + '" nằm ở ' + dem2 + ' hàng');
      }));
    };
    kiemHang(D.tinh('BUD-W02', DOAN2, doc2()), 'W2');
    kiemHang(D.tinh('BUD-W03', BAI3, doc3()), 'W3');
  });
  console.log('\n' + so + ' ca đạt, ' + hong + ' ca hỏng');
  process.exit(hong ? 1 : 0);
})();
