# Chấm node HW2 Writing

Bộ chấm điểm kiến thức (node, learning outcome) cho Homework 2 Writing của IELTS 1984 / YouPass, tách riêng từ [`writing-extra-1984`](https://github.com/youpassvn/writing-extra-1984). Repo chạy độc lập, không cần cài thư viện nào.

**Phạm vi: 20 tuần đã soạn.** ROOT tuần 1–9, TRUNK tuần 1–7, BUD tuần 1–3, BLOOM tuần 1. Node của từng tuần ở [`PHAM-VI.md`](PHAM-VI.md).

Repo không chứa bài viết của học sinh. Các tuần khác vẫn chấm trên hệ thống thật nhưng không nằm ở đây; gửi vào repo này thì mọi LO để trống, không gọi model.

## Chạy

Cần Node.js 20.12 trở lên và khoá cổng AI:

```bash
cp .env.example .env    # điền YOUPASS_KEY
```

Chấm một bài từ file (qua hội đồng 4 lượt nên thường mất vài phút):

```bash
node bin/cham.js TRUNK-W06 bai-lam.txt
```

Chạy bộ kiểm, không gọi mạng, không tốn lượt model:

```bash
npm test
```

## Dùng trong code

```js
const { chamNode, yeuCauTuBai } = require("./index.js");

const kq = await chamNode(yeuCauTuBai("TRUNK-W06", baiLam));
// { model, results: [{ idx, level, confidence, comment, evidence: [{ quote }] }] }
```

`idx` là vị trí LO trong `learning_outcomes`, tính từ 1. Có thể tự dựng yêu cầu thay cho `yeuCauTuBai`, cùng khuôn với API D của tích hợp YouPass:

```js
{
  job_id: "…",
  answer: { content: "bài làm" },
  lesson: { content_key: "trunk-writing-week-6" },        // hoặc { class_level: "TRUNK", lesson_number: 6 }
  learning_outcomes: [{ id: 1, code: "T6.1", content: "Đa dạng cấu trúc câu bằng cách đổi chủ ngữ" }],
}
```

| `level` | Nghĩa |
|---|---|
| 3 | Tốt |
| 2 | Khá |
| 1 | Sai nhiều |
| 0 | Chưa ứng dụng được |
| `null` | Chưa đánh giá được, `comment` nói lý do |

Đề luôn lấy từ `data/hw-spec`, không đọc chữ đề trong yêu cầu. Khi chưa chấm xong (cổng AI chậm, model trả sai khuôn ba lần), `chamNode` ném `LoiCham` có `code`, `retryable`; gửi lại cùng `job_id` thì bài câu rời chỉ chấm tiếp các câu còn thiếu.

## Cách chấm

Model đọc, code đếm. Model tách các phần của bài, trích nguyên văn, phán từng mục; số từ, số câu, số mục đạt và mức đều do code tính, để cùng một phần đọc lần nào cũng ra một mức. Mức theo một thang: tỉ lệ mục đạt quy về thang 8 rồi làm tròn, 7–8 là Tốt, 5–6 là Khá, 3–4 là Sai nhiều, 0–2 là Chưa ứng dụng được.

Mỗi bài qua **hội đồng 4 lượt**: bắt lỗi, rồi giáo viên khó tính và giáo viên nhân từ chấm độc lập, cuối cùng trọng tài chốt.

| Bài | Tuần | File |
|---|---|---|
| Câu rời, chấm từng câu | ROOT 1–9, TRUNK 1–2, BUD 1 | `src/lo-trunk-bud.js`, `src/cham-lo-trunk-bud.js` |
| Một đoạn thân bài | TRUNK 3–7 | `src/lo-trunk-doan.js`, `src/cham-lo-trunk-doan.js` |
| Đoạn thân bài BUD | BUD 2–3 | `src/lo-bud-doan.js`, `src/cham-lo-bud-doan.js` |
| Hai đoạn cho hai đề | BLOOM 1 | `src/lo-bloom.js`, `src/cham-lo-bloom.js` |

Prompt và luật đếm từng tuần nằm trong các file `lo-*.js`, kèm chú thích đầu file. `src/cong-du-phong.js` chuyển sang model dự phòng `ag/gemini-3-flash` khi cổng báo 401, 403, 404, 429, 503, nhưng không chuyển khi quá giờ.

## Biến môi trường

| Biến | Bắt buộc | Dùng để |
|---|---|---|
| `YOUPASS_KEY` | Có | Khoá gọi cổng AI `tech-proxy.youpass.vn` |
| `TICH_HOP_LO_MODEL_DU_PHONG` | Không | Đổi model dự phòng; đặt `tat` để tắt |

## Chưa chốt

- Giáo viên chưa duyệt tiêu chí của BUD tuần 2–3 và TRUNK tuần 6–7.
- Các LO đo tạm, giáo viên chưa duyệt: ROOT R2.1, R3.1, R5.2, R7.3; BUD tuần 2 B2.1; BLOOM tuần 1 B2.1, B4.7, B4.2, B2.2.
- Riêng T6.1 và T7.2: bài không dùng lần nào thì mức 0, đã chốt 06-11.

## Giữ khớp với bản nguồn

Bộ chấm đang chạy thật nằm ở `writing-extra-1984`. Đừng sửa tay `src/`, `vendor/`, `data/`, `test/*.sinh.test.js`, `PHAM-VI.md`, `NGUON.json`: sửa ở nguồn rồi xuất lại.

```bash
node tools/xuat-tu-writing-extra.cjs <thư mục writing-extra-1984>
node tools/doi-chieu-nguon.cjs <thư mục writing-extra-1984>
npm test
```

Script xuất neo vào đúng chuỗi của nguồn: nguồn đổi mà không còn khớp thì nó dừng và báo. Script đối chiếu đưa bài mẫu của nguồn qua cả hai bên bằng cùng một model giả, hai bên phải ra đúng cùng mức và nhận xét; bài mẫu chỉ đọc từ thư mục nguồn, không chép vào repo. `NGUON.json` ghi commit đã xuất.

`src/lo-bud-doan.js` chỉ còn tiêu chí và prompt của tuần 2, 3, nhưng vẫn giữ các nhánh code dùng chung của bản nguồn (`dang === "essay"`, `dang === "task1"`), không tuần nào đi vào.
