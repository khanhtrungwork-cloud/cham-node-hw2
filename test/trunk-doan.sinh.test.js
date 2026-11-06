// Sinh bằng tools/xuat-tu-writing-extra.cjs từ bộ kiểm của writing-extra-1984. Đừng sửa tay.
// Kiểm bộ chấm HW2 TRUNK tuần 3–7 theo node (Mastery Hub/tich-hop/lo-trunk-doan.js), KHÔNG gọi mạng:
// luật đếm trên bài đọc giả, kiểm khuôn câu trả lời của model, thử lại khi sai khuôn, và các file kết quả bài mẫu
// Mastery Cham/lo-doan/ (mỗi mục kiểm nằm đúng một hàng, mức khớp thang ROOT).
// Chạy: node scripts/kiem-lo-trunk-doan.js
'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const D = require('../src/lo-trunk-doan.js');
const { mucTheoTiLe } = require('../src/lo-trunk-bud.js');

const GOC = path.resolve(__dirname, '..');
const spec = (k) => JSON.parse(fs.readFileSync(path.join(GOC, 'data', 'hw-spec', k + '.json'), 'utf8'));
let so = 0, hong = 0;
async function ca(ten, f) {
  try { await f(); so++; console.log('✓ ' + ten); } catch (e) { hong++; console.log('✗ ' + ten + '\n   ' + String(e.stack || e.message).split('\n').slice(0, 3).join('\n   ')); }
}
const nodeCua = (kq, ma) => kq.nodes.find((n) => n.ma === ma);

// Đoạn mẫu tuần 3 dựng tay: TS đề cho, SI 1 impact, SI 2 reason, hai cụm nhân–quả.
const DOAN3 = 'Doing part-time jobs while studying in universities could have many negative impacts on students. Firstly, students find it hard to balance work and study. They have less time to revise for exams and finish their assignments, which leads to poor marks. As a result, many of them may struggle to find a well-paid job after they graduate from university. Secondly, working long hours can cause serious health problems such as exhaustion or depression. This is because many students work night shifts and do not sleep enough. They also have to deal with pressure from both school and work every day.';
const si3 = (o) => Object.assign({
  core: 'students find it hard to balance work and study.', development: 'They have less time to revise for exams and finish their assignments, which leads to poor marks. As a result, many of them may struggle to find a well-paid job after they graduate from university.',
  khop_core_de: 1, loai_core: 'trung_gian', core_nhan_dien: true, co_phat_trien: true, dev_bam_core: true, loai_dev: 'impact', tron_chuoi: true,
  doi_tuong: 'students', khia_canh: 'job', mach_lac: true, chuoi: 'a → b', giai_thich: 'x',
}, o);
const si3b = (o) => si3(Object.assign({
  core: 'working long hours can cause serious health problems such as exhaustion or depression.',
  development: 'This is because many students work night shifts and do not sleep enough. They also have to deal with pressure from both school and work every day.',
  khop_core_de: 2, loai_core: 'dich', loai_dev: 'reason', doi_tuong: '', khia_canh: '',
}, o));
const doc3 = (o) => Object.assign({
  ts: { trich: 'Doing part-time jobs while studying in universities could have many negative impacts on students.', giai_thich: 'x' },
  si: [si3(), si3b()], ngoai_khung: [],
  lan_dung: [{ trich: 'leads to poor marks', cum: 'lead to', dung: true, sua: '', giai_thich: 'x' }, { trich: 'cause serious health problems', cum: 'cause', dung: true, sua: '', giai_thich: 'x' }],
}, o);

const DOAN4 = 'Working as a freelancer brings several benefits to young people. Firstly, freelancing allows young people to arrange their working time actively. As a result, they can sleep enough and exercise regularly, which keeps them healthy. Doing so also helps them study better. In addition, freelancers can earn a higher income. This is because they can take many projects at the same time and set their own prices.';
const si4 = (o) => Object.assign({
  core: 'freelancing allows young people to arrange their working time actively.', development: 'As a result, they can sleep enough and exercise regularly, which keeps them healthy. Doing so also helps them study better.',
  loai_dev: 'impact', mo_y: { trich: 'Firstly', dung: true, giai_thich: 'x' },
  noi_core_dev: { trich: 'As a result', dung: true, sua: '', giai_thich: 'x' }, noi_them: [{ trich: 'which', dung: true, sua: '', giai_thich: 'x' }], giai_thich: 'x',
}, o);
const si4b = (o) => si4(Object.assign({
  core: 'freelancers can earn a higher income.', development: 'This is because they can take many projects at the same time and set their own prices.',
  loai_dev: 'reason', mo_y: { trich: 'In addition', dung: true, giai_thich: 'x' }, noi_core_dev: { trich: 'This is because', dung: true, sua: '', giai_thich: 'x' }, noi_them: [],
}, o));
const doc4 = (o) => Object.assign({
  ts: { trich: 'Working as a freelancer brings several benefits to young people.', neu_x: true, y_chinh: true, cung_chieu: true, loi: '', giai_thich: 'x' },
  si: [si4(), si4b()], ngoai_khung: [],
  loi_hai: [{ trich: 'brings several benefits to young people', dung: true, sua: '', giai_thich: 'x' }],
  tro_lai: [{ trich: 'Doing so also helps them', kieu: 'doing_so', dung: true, sua: '', giai_thich: 'x' }],
}, o);

// Đoạn mẫu tuần 5 dựng tay: SI 1 y tế (ý trung gian, impact), SI 2 việc làm (ý đích, reason rồi impact), năm mệnh đề phụ.
const DOAN5 = 'Moving to cities brings several benefits to people. Firstly, cities have more modern hospitals than rural areas, which allows residents to receive treatment more quickly. As a result, their diseases can be detected and treated at an early stage, so they can recover faster and stay healthy for longer. In addition, urban areas offer far more job opportunities because many multinational companies are based there. People who work for these companies can earn a stable and high income, which helps them support their families and improve their living standards in the long term.';
const si5 = (o) => Object.assign({
  core: 'cities have more modern hospitals than rural areas',
  development: 'which allows residents to receive treatment more quickly. | As a result, their diseases can be detected and treated at an early stage, so they can recover faster and stay healthy for longer.',
  khop_core_de: 2, loai_core: 'trung_gian', core_nhan_dien: true, co_phat_trien: true, dev_bam_core: true, loai_dev: 'impact', tron_chuoi: true,
  doi_tuong: 'residents', khia_canh: 'health', gap: [], vong_tron: false, chuoi: 'a → b', giai_thich: 'x',
}, o);
const si5b = (o) => si5(Object.assign({
  core: 'urban areas offer far more job opportunities',
  development: 'because many multinational companies are based there. | People who work for these companies can earn a stable and high income, which helps them support their families and improve their living standards in the long term.',
  khop_core_de: 1, loai_core: 'dich', loai_dev: 'hon_hop', doi_tuong: 'people', khia_canh: 'income, living standards',
}, o));
const MD5 = [
  { trich: ', which allows residents to receive treatment more quickly', kieu: 'which_ca', chu: 'which', quan_he: 'ket_qua', dung: true, sua: '', giai_thich: 'x' },
  { trich: ', so they can recover faster and stay healthy for longer', kieu: 'so', chu: 'so', quan_he: 'ket_qua', dung: true, sua: '', giai_thich: 'x' },
  { trich: 'because many multinational companies are based there', kieu: 'adv', chu: 'because', quan_he: 'nguyen_nhan', dung: true, sua: '', giai_thich: 'x' },
  { trich: 'who work for these companies', kieu: 'adj', chu: 'who', quan_he: 'bo_nghia', dung: true, sua: '', giai_thich: 'x' },
  { trich: ', which helps them support their families and improve their living standards in the long term', kieu: 'which_ca', chu: 'which', quan_he: 'ket_qua', dung: true, sua: '', giai_thich: 'x' },
];
const doc5 = (o) => Object.assign({
  ts: { trich: 'Moving to cities brings several benefits to people.', giai_thich: 'x' },
  si: [si5(), si5b()], ngoai_khung: [], menh_de: MD5.map((x) => Object.assign({}, x)), nhoi: [],
}, o);
const GAP5 = { trich: 'As a result, their diseases can be detected', truoc: 'chữa bệnh nhanh hơn', sau: 'phát hiện bệnh sớm', thieu: 'có thiết bị hiện đại để chẩn đoán', sua: 'Modern equipment helps doctors diagnose diseases accurately.', giai_thich: 'x' };

// Đoạn mẫu tuần 6 dựng tay: topic sentence dummy subject, ba câu đổi chủ ngữ, một câu chủ ngữ chỉ người.
const TS6 = 'There are several advantages to switching university education to online learning.';
const DOAN6 = TS6 + ' Firstly, studying online allows students to adjust their learning pace. Flexible schedules give them more time to review difficult lessons, which can improve their academic results. In addition, online courses cost less than traditional classes. Students do not have to pay for rent or transport, so their families can save a large amount of money.';
const dcn = (trich, kieu, chu_ngu, fv, o) => Object.assign({ trich, kieu, chu_ngu, fv, dung: true, sua: '', giai_thich: 'x' }, o);
const doc6 = (o) => Object.assign({
  ts: { trich: TS6, co_dummy: true, dung_khuon: true, y_chinh: true, sua: '', giai_thich: 'x' },
  si: [
    { core: 'studying online allows students to adjust their learning pace.', development: 'Flexible schedules give them more time to review difficult lessons, which can improve their academic results.', loai_dev: 'impact', giai_thich: 'x' },
    { core: 'online courses cost less than traditional classes.', development: 'Students do not have to pay for rent or transport, so their families can save a large amount of money.', loai_dev: 'reason', giai_thich: 'x' },
  ],
  ngoai_khung: [],
  doi_chu_ngu: [
    dcn('studying online allows students to adjust', 'ving', 'studying online', 'allows'),
    dcn('Flexible schedules give them more time', 'n', 'Flexible schedules', 'give'),
    dcn('online courses cost less', 'n', 'online courses', 'cost'),
  ],
  dummy_khac: [],
  goi_y_doi: { trich: '', sua: '' },
}, o);

// Đoạn mẫu tuần 7 dựng tay: ba câu nêu kết quả đã rào, ba cụm giới từ mở đầu câu.
const DOAN7 = 'Living with parents brings several benefits to adults. Firstly, by living with their parents, adults can save a lot of money. Due to lower living costs, they may buy a house sooner. In addition, adults who live with their parents tend to have stronger family bonds. Thanks to daily conversations, they can often avoid loneliness, which improves their mental health.';
const nd = (trich, cach_rao, chu_rao, o) => Object.assign({ trich, cach_rao, chu_rao, tuyet_doi: false, sua: '', giai_thich: 'x' }, o);
const cgt = (trich, kieu, o) => Object.assign({ trich, kieu, dung: true, sua: '', giai_thich: 'x' }, o);
const doc7 = (o) => Object.assign({
  ts: { trich: 'Living with parents brings several benefits to adults.', giai_thich: 'x' },
  si: [
    { core: 'by living with their parents, adults can save a lot of money.', development: 'Due to lower living costs, they may buy a house sooner.', loai_dev: 'impact', giai_thich: 'x' },
    { core: 'adults who live with their parents tend to have stronger family bonds.', development: 'Thanks to daily conversations, they can often avoid loneliness, which improves their mental health.', loai_dev: 'impact', giai_thich: 'x' },
  ],
  ngoai_khung: [],
  nhan_dinh: [
    nd('Due to lower living costs, they may buy a house sooner.', 'modal', 'may'),
    nd('adults who live with their parents tend to have stronger family bonds.', 'tend_to', 'tend to'),
    nd('Thanks to daily conversations, they can often avoid loneliness, which improves their mental health.', 'modal', 'can'),
  ],
  cum_gioi_tu: [
    cgt('by living with their parents, adults can save', 'by_doing'),
    cgt('Due to lower living costs, they may buy', 'due_to'),
    cgt('Thanks to daily conversations, they can', 'thanks_to'),
  ],
  goi_y_doi: { trich: '', sua: '' },
}, o);

(async () => {
  await ca('node của tuần trùng KHÍT trường lo của hw-spec', () => {
    Object.keys(D.TUAN).forEach((k) => {
      const ma = spec(k).lo.map((x) => x.split(' ')[0]).sort();
      assert.deepEqual(D.TUAN[k].nodes.slice().sort(), ma, k);
      D.TUAN[k].nodes.forEach((m) => assert.ok(D.TUAN[k].noi_dung[m] && D.TUAN[k].don_vi[m] && D.TUAN[k].ten_ngan[m], k + ' ' + m));
    });
  });
  await ca('prompt mỗi tuần không lọt mã node của tuần kia', () => {
    assert.ok(!/T4\.\d/.test(D.SYSTEM['TRUNK-W03']), 'W3 nhắc T4.x');
    assert.ok(!/T3\.\d/.test(D.SYSTEM['TRUNK-W04']), 'W4 nhắc T3.x');
  });
  await ca('mức theo đúng thang ROOT (mucTheoTiLe của lo-trunk-bud.js)', () => {
    const kq = D.tinh('TRUNK-W03', DOAN3, doc3(), spec('TRUNK-W03'));
    kq.nodes.forEach((n) => assert.equal(n.muc, mucTheoTiLe(n.dat, n.tong), n.ma));
    assert.deepEqual([8, 7, 6, 5, 4, 3, 2].map((d) => mucTheoTiLe(d, 8)), [3, 3, 2, 2, 1, 1, 0]);
  });
  await ca('tuần 3 bài đủ: cả ba node Tốt, đếm số câu trên đoạn gốc', () => {
    const kq = D.tinh('TRUNK-W03', DOAN3, doc3(), spec('TRUNK-W03'));
    assert.deepEqual(kq.nodes.map((n) => [n.ma, n.dat, n.tong, n.muc]), [['T3.1', 8, 8, 3], ['T3.2', 8, 8, 3], ['T3.3', 2, 2, 3]]);
    assert.equal(kq.so_lo_dat, 3);
    const h = kq.hang.filter((x) => x.vai === 'si');
    assert.deepEqual(h.map((x) => x.so_cau), [3, 3]);
  });
  await ca('tuần 3: core trích thiếu dấu chấm vẫn đếm đúng số câu', () => {
    const d = doc3();
    d.si[0].core = 'students find it hard to balance work and study';
    const kq = D.tinh('TRUNK-W03', DOAN3, d, spec('TRUNK-W03'));
    assert.equal(kq.hang.find((x) => x.ten === 'Supporting idea 1').so_cau, 3);
  });
  await ca('tuần 3: ý trung gian viết reason là sai loại, cả 4 mục của SI đó trượt', () => {
    const d = doc3(); d.si[0].loai_dev = 'reason';
    const t32 = nodeCua(D.tinh('TRUNK-W03', DOAN3, d, spec('TRUNK-W03')), 'T3.2');
    assert.deepEqual([t32.dat, t32.tong, t32.nhan], [4, 8, 'Sai nhiều']);
  });
  await ca('tuần 3: nhãn ĐÍCH / TRUNG GIAN của core đề cho lấy từ hw-spec, không tin model', () => {
    const d = doc3(); d.si[0].loai_core = 'dich'; d.si[0].loai_dev = 'reason';
    assert.equal(nodeCua(D.tinh('TRUNK-W03', DOAN3, d, spec('TRUNK-W03')), 'T3.2').dat, 4);
  });
  await ca('tuần 3: ý đích viết impact tới giá trị lớn hơn vẫn đúng loại', () => {
    const d = doc3(); d.si[1].loai_dev = 'impact'; d.si[1].doi_tuong = 'students'; d.si[1].khia_canh = 'study';
    assert.equal(nodeCua(D.tinh('TRUNK-W03', DOAN3, d, spec('TRUNK-W03')), 'T3.2').dat, 8);
  });
  await ca('tuần 3: impact thiếu đối tượng hoặc khía cạnh thì chưa trọn chuỗi', () => {
    const d = doc3(); d.si[0].khia_canh = '';
    assert.equal(nodeCua(D.tinh('TRUNK-W03', DOAN3, d, spec('TRUNK-W03')), 'T3.2').dat, 7);
  });
  await ca('tuần 3: thiếu một SI, có câu kết luận', () => {
    const d = doc3({ si: [si3()], ngoai_khung: [{ trich: 'They also have to deal with pressure from both school and work every day.', loai: 'ket_luan' }] });
    const kq = D.tinh('TRUNK-W03', DOAN3, d, spec('TRUNK-W03'));
    assert.deepEqual([nodeCua(kq, 'T3.1').dat, nodeCua(kq, 'T3.2').dat], [4, 4]);
    assert.ok(kq.hang.some((h) => h.vai === 'si thieu'), 'không có hàng SI thiếu');
    const ngoai = kq.hang.find((h) => h.vai === 'ngoai');
    assert.ok(ngoai && ngoai.nhom['T3.1'] && !ngoai.nhom['T3.1'][0].ok, 'mục "đúng khung" chưa nằm ở hàng ngoài khung');
  });
  await ca('tuần 3: không cụm nhân–quả nào thì T3.3 mức 0 (user chốt 03-11), mục trượt nằm ở một hàng, vẫn tính vào số node', () => {
    const kq = D.tinh('TRUNK-W03', DOAN3, doc3({ lan_dung: [] }), spec('TRUNK-W03'));
    assert.deepEqual([nodeCua(kq, 'T3.3').muc, nodeCua(kq, 'T3.3').nhan, nodeCua(kq, 'T3.3').tong, kq.so_lo_co_muc], [0, 'Chưa ứng dụng được', 1, 3]);
    assert.equal(kq.hang.filter((h) => (h.nhom['T3.3'] || []).length).length, 1);
  });
  await ca('tuần 4 bài đủ: cả năm node Tốt', () => {
    const kq = D.tinh('TRUNK-W04', DOAN4, doc4(), spec('TRUNK-W04'));
    assert.deepEqual(kq.nodes.map((n) => [n.ma, n.muc]), [['T4.1', 3], ['T4.2', 3], ['T4.3', 3], ['T4.4', 3], ['T4.5', 3]]);
  });
  await ca('tuần 4: topic sentence trượt mục then chốt thì tối đa Sai nhiều dù 3/4 mục', () => {
    const d = doc4(); Object.assign(d.ts, { y_chinh: false, loi: 'tra_loi_thang' });
    const t41 = nodeCua(D.tinh('TRUNK-W04', DOAN4, d, spec('TRUNK-W04')), 'T4.1');
    assert.deepEqual([t41.dat, t41.tong, t41.muc], [3, 4, 1]);
    assert.ok(t41.chan, 'không có lý do chặn');
    const d2 = doc4(); d2.ts.neu_x = false;
    assert.equal(nodeCua(D.tinh('TRUNK-W04', DOAN4, d2, spec('TRUNK-W04')), 'T4.1').muc, 2, 'chỉ trượt mục X thì Khá');
  });
  await ca('tuần 4: không có topic sentence thì cả 4 mục trượt', () => {
    const d = doc4(); d.ts = { trich: '', neu_x: false, y_chinh: false, cung_chieu: false, loi: '', giai_thich: 'x' };
    assert.deepEqual([nodeCua(D.tinh('TRUNK-W04', DOAN4, d, spec('TRUNK-W04')), 'T4.1').dat], [0]);
  });
  await ca('tuần 4: cặp Firstly → Secondly là lỗi linking máy móc (code bắt)', () => {
    const d = doc4(); d.si[1].mo_y = { trich: 'Secondly', dung: true, giai_thich: 'x' };
    const t43 = nodeCua(D.tinh('TRUNK-W04', DOAN4.replace('In addition', 'Secondly'), d, spec('TRUNK-W04')), 'T4.3');
    assert.deepEqual([t43.dat, t43.muc], [D.CAP_MAY_MOC ? 1 : 2, D.CAP_MAY_MOC ? 1 : 3]);
  });
  await ca('tuần 4: chỗ nối core → development không có từ nối là một mục trượt', () => {
    const d = doc4(); d.si[0].noi_core_dev = { trich: '', dung: false, sua: 'As a result,', giai_thich: 'x' };
    const t44 = nodeCua(D.tinh('TRUNK-W04', DOAN4, d, spec('TRUNK-W04')), 'T4.4');
    assert.deepEqual([t44.dat, t44.tong], [2, 3]);
  });
  await ca('tuần 4: không dùng this / doing so lần nào là Chưa ứng dụng được (đề yêu cầu), không null', () => {
    const t45 = nodeCua(D.tinh('TRUNK-W04', DOAN4, doc4({ tro_lai: [] }), spec('TRUNK-W04')), 'T4.5');
    assert.deepEqual([t45.dat, t45.tong, t45.muc], [0, 1, 0]);
  });
  await ca('tuần 5: đoạn đủ chuỗi và đủ hai kiểu câu phức ra Tốt cả hai node', () => {
    assert.deepEqual(D.kiem('TRUNK-W05', doc5(), DOAN5), []);
    const kq = D.tinh('TRUNK-W05', DOAN5, doc5(), spec('TRUNK-W05'));
    const t51 = nodeCua(kq, 'T5.1'), t52 = nodeCua(kq, 'T5.2');
    assert.deepEqual([t51.dat, t51.tong, t51.muc], [8, 8, 3], JSON.stringify(t51.muc_kiem.filter((m) => !m.ok)));
    assert.deepEqual([t52.dat, t52.tong, t52.muc], [7, 7, 3]);
  });
  await ca('tuần 5: gap và vòng tròn trượt mục "không đứt mắt xích", mỗi gap thêm một dòng giải thích không tính vào số mục', () => {
    const d = doc5(); d.si[0].gap = [GAP5, Object.assign({}, GAP5)]; d.si[1].vong_tron = true;
    assert.deepEqual(D.kiem('TRUNK-W05', d, DOAN5), []);
    const kq = D.tinh('TRUNK-W05', DOAN5, d, spec('TRUNK-W05'));
    const t51 = nodeCua(kq, 'T5.1');
    assert.deepEqual([t51.dat, t51.tong, t51.muc], [6, 8, 2]);
    const phu = kq.hang.reduce((s, h) => s.concat(((h.nhom || {})['T5.1'] || []).filter((m) => m.phu)), []);
    assert.equal(phu.length, 2);
    assert.match(phu[0].chu, /thiếu bước có thiết bị hiện đại/);
  });
  await ca('tuần 5: ý trung gian chỉ có reason thì chưa tới đích; ý đích viết reason vẫn tới đích', () => {
    const d = doc5(); d.si[0].loai_dev = 'reason'; d.si[1].loai_dev = 'reason'; d.si[1].doi_tuong = ''; d.si[1].khia_canh = '';
    const t51 = nodeCua(D.tinh('TRUNK-W05', DOAN5, d, spec('TRUNK-W05')), 'T5.1');
    assert.deepEqual(t51.muc_kiem.map((m) => m.ok), [true, false, true, true, true, true, true, true]);
    // nhãn ĐÍCH / TRUNG GIAN của core đề gợi ý lấy theo đề, không theo model
    const d2 = doc5(); d2.si[0].loai_core = 'dich'; d2.si[0].loai_dev = 'reason';
    assert.equal(nodeCua(D.tinh('TRUNK-W05', DOAN5, d2, spec('TRUNK-W05')), 'T5.1').muc_kiem[1].ok, false);
  });
  await ca('tuần 5: không có development bám core thì cả 4 mục của supporting idea đó trượt; thiếu SI 2 thì 4 mục trượt', () => {
    const d = doc5(); d.si[0].dev_bam_core = false;
    assert.deepEqual(nodeCua(D.tinh('TRUNK-W05', DOAN5, d, spec('TRUNK-W05')), 'T5.1').muc_kiem.slice(0, 4).map((m) => m.ok), [false, false, false, false]);
    const d2 = doc5(); d2.si = [si5()];
    const t51 = nodeCua(D.tinh('TRUNK-W05', DOAN5, d2, spec('TRUNK-W05')), 'T5.1');
    assert.deepEqual([t51.dat, t51.tong, t51.muc], [4, 8, 1]);
  });
  await ca('tuần 5: thiếu ", which + FV" thì T5.2 tối đa Khá, thiếu cả hai kiểu thì tối đa Sai nhiều, không có mệnh đề phụ nào thì Chưa ứng dụng được', () => {
    const d = doc5(); d.menh_de = d.menh_de.filter((x) => x.kieu !== 'which_ca');
    const a = nodeCua(D.tinh('TRUNK-W05', DOAN5, d, spec('TRUNK-W05')), 'T5.2');
    assert.deepEqual([a.dat, a.tong, a.muc], [4, 5, 2]);
    // 7 lần dùng đúng mà thiếu ", which" thì 7/8 vẫn bị chặn ở Khá
    const d4 = doc5(); d4.menh_de = d4.menh_de.filter((x) => x.kieu !== 'which_ca'); for (let i = 0; i < 4; i++) d4.menh_de.push(Object.assign({}, MD5[3]));
    const e = nodeCua(D.tinh('TRUNK-W05', DOAN5, d4, spec('TRUNK-W05')), 'T5.2');
    assert.deepEqual([e.dat, e.tong, e.muc], [8, 9, 2]);
    assert.match(e.chan, /tối đa Khá/);
    // dạng rút gọn , V-ing cũng thoả yêu cầu nối kết quả (slide: "reduced form? || S-FV, V-ing")
    const dr = doc5(); dr.menh_de = dr.menh_de.filter((x) => x.kieu !== 'which_ca').concat([{ trich: 'which allows residents', kieu: 'rut_gon', chu: 'x', quan_he: 'ket_qua', dung: true, sua: '', giai_thich: 'x' }]);
    assert.equal(nodeCua(D.tinh('TRUNK-W05', DOAN5, dr, spec('TRUNK-W05')), 'T5.2').chan, '');
    const d2 = doc5(); d2.menh_de = d2.menh_de.filter((x) => x.kieu === 'adj');
    const b = nodeCua(D.tinh('TRUNK-W05', DOAN5, d2, spec('TRUNK-W05')), 'T5.2');
    assert.deepEqual([b.dat, b.tong, b.muc], [1, 3, 1]);
    const d3 = doc5(); d3.menh_de = [];
    const c = nodeCua(D.tinh('TRUNK-W05', DOAN5, d3, spec('TRUNK-W05')), 'T5.2');
    assert.deepEqual([c.dat, c.tong, c.muc], [0, 2, 0]);
    // hai mục yêu cầu luôn nằm ở hàng cuối của đoạn
    const kq = D.tinh('TRUNK-W05', DOAN5, d3, spec('TRUNK-W05'));
    assert.equal(kq.hang[kq.hang.length - 1].nhom['T5.2'].length, 2);
  });
  await ca('tuần 5: câu nhồi (model đếm từ 4 mệnh đề, code đếm quá 30 từ) là một mục trượt, một câu chỉ tính một lần', () => {
    assert.deepEqual(D.cacCau('A b c. Costs 2.5 dollars! Who knows? last').map((c) => c.chu), ['a b c.', 'costs 2.5 dollars!', 'who knows?', 'last']);
    const dai = 'Moving to cities brings several benefits to people because cities have hospitals, schools and parks which are modern and convenient for everyone who lives there and wants a better life in the future.';
    const doan = dai + ' ' + DOAN5.slice(DOAN5.indexOf('Firstly'));
    const d = doc5(); d.ts.trich = dai;
    d.nhoi = [{ trich: dai, so_menh_de: 4, sua: 'x', giai_thich: 'x' }, { trich: 'People who work for these companies', so_menh_de: 3, sua: '', giai_thich: 'x' }];
    assert.deepEqual(D.kiem('TRUNK-W05', d, doan), []);
    const t52 = nodeCua(D.tinh('TRUNK-W05', doan, d, spec('TRUNK-W05')), 'T5.2');
    const nhoi = t52.muc_kiem.filter((m) => /nhồi/.test(m.chu));
    assert.equal(nhoi.length, 1);
    assert.match(nhoi[0].chu, /4 mệnh đề, 3\d từ/);
  });
  await ca('tuần 6: đoạn đủ ra Tốt cả hai node, đúng số mục', () => {
    assert.deepEqual(D.kiem('TRUNK-W06', doc6(), DOAN6), []);
    const kq = D.tinh('TRUNK-W06', DOAN6, doc6(), spec('TRUNK-W06'));
    assert.deepEqual(kq.nodes.map((n) => [n.ma, n.dat, n.tong, n.muc]), [['T6.1', 3, 3, 3], ['T6.2', 3, 3, 3]]);
    assert.ok(Array.isArray(kq.cach_tinh) && kq.cach_tinh.length, 'trang chấm thử cần cach_tinh');
  });
  await ca('tuần 6: T6.1 mới đổi 1 câu thì tối đa Khá, không đổi câu nào là mức 0 kèm gợi ý, không null', () => {
    const mot = doc6({ doi_chu_ngu: [dcn('online courses cost less', 'n', 'online courses', 'cost')] });
    const a = nodeCua(D.tinh('TRUNK-W06', DOAN6, mot, spec('TRUNK-W06')), 'T6.1');
    assert.deepEqual([a.dat, a.tong, a.muc], [1, 1, 2]);
    assert.match(a.chan, /tối đa Khá/);
    const hai = doc6({ doi_chu_ngu: doc6().doi_chu_ngu.slice(0, 2) });
    assert.equal(nodeCua(D.tinh('TRUNK-W06', DOAN6, hai, spec('TRUNK-W06')), 'T6.1').muc, 3);
    const khong = doc6({ doi_chu_ngu: [], goi_y_doi: { trich: 'Students do not have to pay for rent', sua: 'Studying online removes the cost of rent.' } });
    const kq = D.tinh('TRUNK-W06', DOAN6, khong, spec('TRUNK-W06'));
    const b = nodeCua(kq, 'T6.1');
    assert.deepEqual([b.dat, b.tong, b.muc, b.nhan], [0, 1, 0, 'Chưa ứng dụng được']);
    assert.match(b.muc_kiem[0].sua, /Studying online/);
    assert.equal(kq.hang[kq.hang.length - 1].nhom['T6.1'].length, 1, 'mục "chưa đổi" nằm ở hàng cuối');
  });
  await ca('tuần 6: T6.1 đếm từng câu, sai FV thì trượt đúng câu đó (2/3 là Khá, 1/3 là Sai nhiều)', () => {
    const d = doc6(); d.doi_chu_ngu[1].dung = false;
    assert.equal(nodeCua(D.tinh('TRUNK-W06', DOAN6, d, spec('TRUNK-W06')), 'T6.1').muc, 2);
    d.doi_chu_ngu[2].dung = false;
    assert.equal(nodeCua(D.tinh('TRUNK-W06', DOAN6, d, spec('TRUNK-W06')), 'T6.1').muc, 1);
  });
  await ca('tuần 6: T6.2 không có dummy subject thì cả ba mục trượt và mức 0; sai cấu trúc thì 2/3 là Khá; câu dummy khác là thêm mục', () => {
    const t = (ts, them) => nodeCua(D.tinh('TRUNK-W06', DOAN6, doc6(Object.assign({ ts: Object.assign({}, doc6().ts, ts) }, them)), spec('TRUNK-W06')), 'T6.2');
    const khong = t({ co_dummy: false, dung_khuon: false, y_chinh: false, sua: 'There are several advantages to studying online.' });
    assert.deepEqual([khong.dat, khong.tong, khong.muc], [0, 3, 0]);
    assert.equal(khong.muc_kiem.filter((m) => m.sua).length, 1, 'bản sửa chỉ gắn một lần');
    // model lỡ ghi y_chinh true khi không có dummy: code vẫn không tính
    assert.equal(t({ co_dummy: false, dung_khuon: false, y_chinh: true }).dat, 0);
    const saiKhuon = t({ dung_khuon: false });
    assert.deepEqual([saiKhuon.dat, saiKhuon.muc], [2, 2]);
    const them = t({}, { dummy_khac: [{ trich: 'online courses cost less', kieu: 'there', dung: false, sua: 'x', giai_thich: 'x' }] });
    assert.deepEqual([them.dat, them.tong], [3, 4]);
    // bốn câu dummy đúng không cứu được topic sentence thiếu dummy: đề bắt buộc
    const cuu = t({ co_dummy: false, dung_khuon: false, y_chinh: false }, { dummy_khac: [1, 2, 3, 4].map(() => ({ trich: 'online courses cost less', kieu: 'there', dung: true, sua: '', giai_thich: 'x' })) });
    assert.deepEqual([cuu.dat, cuu.tong, cuu.muc], [4, 7, 1]);
    assert.match(cuu.chan, /tối đa Sai nhiều/);
  });
  await ca('tuần 6: topic sentence không đứng đầu đoạn thì không tính dummy subject', () => {
    const d = doc6(); d.ts.trich = 'online courses cost less than traditional classes.';
    assert.equal(nodeCua(D.tinh('TRUNK-W06', DOAN6, d, spec('TRUNK-W06')), 'T6.2').dat, 0);
  });
  await ca('tuần 7: đoạn đủ ra Tốt cả hai node', () => {
    assert.deepEqual(D.kiem('TRUNK-W07', doc7(), DOAN7), []);
    const kq = D.tinh('TRUNK-W07', DOAN7, doc7(), spec('TRUNK-W07'));
    assert.deepEqual(kq.nodes.map((n) => [n.ma, n.dat, n.tong, n.muc]), [['T7.1', 3, 3, 3], ['T7.2', 3, 3, 3]]);
  });
  await ca('tuần 7: T7.1 câu không rào hoặc có cụm tuyệt đối là trượt; không câu nào cần rào thì null', () => {
    const d = doc7(); d.nhan_dinh[0].cach_rao = 'khong'; d.nhan_dinh[0].chu_rao = '';
    assert.deepEqual(D.kiem('TRUNK-W07', d, DOAN7), [], 'câu không rào thì chu_rao được rỗng');
    const a = nodeCua(D.tinh('TRUNK-W07', DOAN7, d, spec('TRUNK-W07')), 'T7.1');
    assert.deepEqual([a.dat, a.tong, a.muc], [2, 3, 2]);
    assert.match(a.muc_kiem[0].chu, /quy chụp/);
    const e = doc7(); e.nhan_dinh[1].tuyet_doi = true;
    const b = nodeCua(D.tinh('TRUNK-W07', DOAN7, e, spec('TRUNK-W07')), 'T7.1');
    assert.equal(b.dat, 2, 'đã rào mà có cụm tuyệt đối vẫn trượt');
    assert.match(b.muc_kiem[1].chu, /tuyệt đối/);
    const c = nodeCua(D.tinh('TRUNK-W07', DOAN7, doc7({ nhan_dinh: [] }), spec('TRUNK-W07')), 'T7.1');
    assert.deepEqual([c.tong, c.muc, c.nhan], [0, null, 'Bài chưa dùng tới']);
  });
  await ca('tuần 7: T7.2 sai từng cụm là trượt đúng cụm đó; không dùng lần nào là mức 0 kèm gợi ý, không null', () => {
    const d = doc7(); d.cum_gioi_tu[1].dung = false;
    assert.equal(nodeCua(D.tinh('TRUNK-W07', DOAN7, d, spec('TRUNK-W07')), 'T7.2').muc, 2);
    const kq = D.tinh('TRUNK-W07', DOAN7, doc7({ cum_gioi_tu: [], goi_y_doi: { trich: 'adults can save a lot of money', sua: 'By living with their parents, adults can save money.' } }), spec('TRUNK-W07'));
    const b = nodeCua(kq, 'T7.2');
    assert.deepEqual([b.dat, b.tong, b.muc], [0, 1, 0]);
    assert.match(b.muc_kiem[0].sua, /By living/);
    assert.equal(kq.hang[kq.hang.length - 1].nhom['T7.2'].length, 1);
  });
  await ca('tuần 6, 7: kiểm khuôn bắt kieu lạ, thiếu cờ, chữ rào không có trong câu, gợi ý không nguyên văn', () => {
    const a = doc6(); a.doi_chu_ngu[0].kieu = 'nguoi'; delete a.ts.co_dummy; a.goi_y_doi = { trich: 'không có trong đoạn', sua: 'x' };
    const la = D.kiem('TRUNK-W06', a, DOAN6);
    assert.ok(la.some((x) => /doi_chu_ngu\[0\]\.kieu/.test(x)) && la.some((x) => /co_dummy/.test(x)) && la.some((x) => /goi_y_doi\.trich/.test(x)), la.join('; '));
    const b = doc7(); b.nhan_dinh[0].chu_rao = 'might'; b.nhan_dinh[1].cach_rao = 'gi_do'; b.cum_gioi_tu[0].kieu = 'of'; delete b.nhan_dinh[2].tuyet_doi;
    const lb = D.kiem('TRUNK-W07', b, DOAN7);
    assert.ok(lb.some((x) => /nhan_dinh\[0\]\.chu_rao/.test(x)) && lb.some((x) => /cach_rao/.test(x)) && lb.some((x) => /cum_gioi_tu\[0\]\.kieu/.test(x)) && lb.some((x) => /tuyet_doi/.test(x)), lb.join('; '));
    assert.deepEqual(D.kiem('TRUNK-W06', doc6({ goi_y_doi: null }), DOAN6), [], 'goi_y_doi không bắt buộc');
  });
  await ca('tuần 6, 7: prompt có đủ khuôn trong ảnh của giáo viên, không em dash trong chữ học sinh đọc', () => {
    ['There are several advantages / disadvantages to (doing) sth', 'It is beneficial / advantageous / disadvantageous for sb to do sth', 'V-ing (việc gì đó)', 'FV hoà hợp'].forEach((s) => assert.ok(D.SYSTEM['TRUNK-W06'].includes(s), s));
    ['Because of / Due to + Object', 'Thanks to + Object', 'By doing sth', 'With + Object', 'With sth doing sth', 'can / may / might / could', 'often / usually', 'tend to / be likely to'].forEach((s) => assert.ok(D.SYSTEM['TRUNK-W07'].includes(s), s));
    ['TRUNK-W06', 'TRUNK-W07'].forEach((k) => {
      const doc = k === 'TRUNK-W06' ? doc6({ doi_chu_ngu: [] }) : doc7({ cum_gioi_tu: [] });
      const kq = D.tinh(k, k === 'TRUNK-W06' ? DOAN6 : DOAN7, doc, spec(k));
      assert.ok(!/—/.test(JSON.stringify([kq.cach_tinh, kq.nodes.map((n) => [n.noi_dung, n.ten_ngan, n.chan, n.muc_kiem.map((m) => m.chu)])])), k);
    });
  });
  await ca('kiểm khuôn: trích không nằm nguyên văn trong đoạn, thiếu cờ, loai_dev lạ', () => {
    const d = doc3(); d.si[0].core = 'students cannot balance anything.'; delete d.si[1].mach_lac; d.si[1].loai_dev = 'giai_thich';
    const loi = D.kiem('TRUNK-W03', d, DOAN3);
    assert.ok(loi.some((x) => /si\[0\]\.core không nằm nguyên văn/.test(x)), loi.join('; '));
    assert.ok(loi.some((x) => /mach_lac/.test(x)) && loi.some((x) => /loai_dev/.test(x)), loi.join('; '));
    assert.deepEqual(D.kiem('TRUNK-W03', doc3(), DOAN3), []);
    assert.deepEqual(D.kiem('TRUNK-W04', doc4(), DOAN4), []);
    const d4 = doc4(); d4.tro_lai[0].kieu = 'that';
    assert.ok(D.kiem('TRUNK-W04', d4, DOAN4).some((x) => /kieu/.test(x)));
  });
  await ca('docDoan: lượt sai khuôn được gọi lại kèm lỗi, lượt sau đúng thì nhận', async () => {
    const HD = require('../src/hoi-dong-doan.js');
    const goi = [];
    const sai = doc3(); sai.si[0].core = 'không có trong đoạn';
    let daSai = false;
    const kq = await D.docDoan('TRUNK-W03', { doan_van: DOAN3 }, { choThuLaiMs: 0, goiModel: async (body) => {
      goi.push(body);
      const vai = HD.vaiCua(body);
      if (vai === 'bat_loi') return '{"flags":[]}';
      if (vai === 'kho_tinh' && !daSai) { daSai = true; return '```json\n' + JSON.stringify(sai) + '\n```'; }
      return JSON.stringify(doc3());
    } });
    assert.equal(goi.length, 5);
    assert.equal(goi[0].model, HD.MODEL_THEO_VAI.bat_loi.model);
    const lai = goi.filter((b) => HD.vaiCua(b) === 'kho_tinh')[1];
    assert.match(lai.messages[lai.messages.length - 1].content, /không nằm nguyên văn/);
    assert.equal(kq.si.length, 2);
  });
  console.log((hong ? '✗ ' : '✓ ') + so + '/' + (so + hong) + ' ca đạt');
  if (hong) process.exitCode = 1;
})();
