# ColPali và Vision-Native Document RAG

> 传统RAG会把 PDF 解析成文本,切成块,Embedding chunks,并存载矢量──每一步都会丢失信号:OCR会丢失图表数据,chunking会断断表行,text embeddings会忽略数字──ColPali(Faysse et al., July 2024) đưa ra một câu hỏi đơn giản hơn:为什么一定要提取文本?

**Type:** Build
**Languages:** Python (stdlib, multi-vector indexer + MaxSim scorer)
**先修要求：**Giai đoạn 11 (LLM Engineering  RAG 基础), Giai đoạn 12 · 05 (LLaVA)
**Time:** ~180 minutes

## Học mục tiêu

- 解释 lấy lại hai mã hóa (từ một vector) và lấy lại tương tác muộn (từ nhiều vector) của mỗi tài liệu.
- Mô tả hoạt động MaxSim của ColBERT, cũng như ColPali làm thế nào để biến nó từ mã thông báo văn bản 泛化 thành các bản vá hình ảnh.
- 构建一个微型 ColPali-like index:page → patch embeddings → query-term embeddings 上的 MaxSim → top-k pages──
- So sánh hóa đơn / báo cáo tài chính sử dụng trường hợp Trung ương ColPali + Qwen2.5-VL máy phát điện với văn bản-RAG + GPT-4。

## 问题

Các bản văn trên của PDF-RAG sẽ mất đi phần lớn thông tin tài liệu. Báo cáo tài chính tăng trưởng doanh thu quý 3 thường được ghi trên biểu đồ.

đường ống dẫn văn bản-RAG:

1. PDF → văn bản thông qua OCR / pdftotext。
2. Text → 300-500 token
3. Chunk → bi-encoder Embedding(一个 Vector)。
4. User query → Embedding → cosine similarity → top-k chunks。
5. Chunks + query → LLM。

五个有损步骤──图表 捕获不到──表被块 打断──多列布局 被展平──图表注释 消失──

ColPali 的修复方式:跳过 OCR,直接对页面图像做做嵌入──使用 ColBERT-style late interaction做检索,让模型在查询时间 关注细粒度补丁──

## 概念

### Colbert (2020)

ColBERT(Khattab & Zaharia, arXiv:2004.12832) là một phương pháp lấy lại văn bản. Nó không phải là cho mỗi tài liệu sinh thành một vector, mà là cho mỗi token sinh thành một vector.

- Query token  nhận được các tích hợp riêng của mình ((N_q Vectors)
- Các mã thông báo tài liệu 获得 Embeddings(N_d Vectors, thường sẽ được lưu trữ trong cache)
- Score = đối với các mã thông báo truy vấn 求和, mỗi mã thông báo truy vấn 取 tất cả các mã thông báo 中 cosine similarity 的最大值:Σ_i max_j cos(q_i, d_j) 』

Đây là hoạt động MaxSim. Mỗi mã thông báo truy vấn sẽ chọn mã thông báo phù hợp nhất. Kết quả cuối cùng là tổng cộng các giá trị này.

优点: nhớ 强,能 xử lý ngữ nghĩa cấp thuật ngữ.

### ColPali

ColPali(Faysse et al., arXiv:2407.01449) sẽ áp dụng mô hình ColBERT  áp dụng cho hình ảnh。

- Mỗi một trang bởi PaliGemma(ViT + ngôn ngữ)编码为补丁嵌入:每页 N_p Vectors。
- Mỗi truy vấn người dùng (text) được编码为 truy vấn-token embed:N_q Vectors。
- Score = Σ_i max_j cos(q_i, p_j),也就是在查询文字符号和页面图像补丁 上做MaxSim。
- 通过 tổng điểm thu hồi top-k trang.

Trong thời gian nhập tài liệu: dùng PaliGemma để thực hiện Embedding trên mỗi trang, lưu trữ tất cả các bản vá được nhúng vào. Trong thời gian truy vấn: dùng token truy vấn để thực hiện Embedding, dùng tất cả các trang đã được lưu trữ.

优点: Trong tài liệu giàu thị giác trên, kết thúc đến kết thúc so với văn bản-RAG cao 20-40%── mỗi bộ phận bộ phận 捕获局部布局和内容──

缺点: mỗi trang N_p patches × 4byte floats × D-dim Vectors = lưu trữ 增长很快──可通过 PQ / OPQ quantization 缓解──

### ColQwen2 và ColSmol

ColQwen2 (Illuin-tech, 2024-2025) sẽ thay đổi PaliGemma thành Qwen2-VL, mã hóa cơ sở, lấy lại, lấy lại, lấy lại.

ColSmol là một biến thể quy mô nhỏ hơn được sử dụng tại địa phương / cạnh.

### VisRAG

VisRAG(Yu et al., arXiv:2410.10594) là một biến thể khác: không phải trên các bản vá lên làm MaxSim, mà sử dụng VLM để tạo mỗi trang thành một vector, sau đó làm lấy lại bộ mã hóa đôi.

Giá cả giá cả: chất lượng ưu tiên với ColPali, quy mô ưu tiên với VisRAG。

### M3DocRAG

M3DocRAG(Cho et al., arXiv:2411.04952) sẽ mở rộng truy xuất đa phương thức  mở rộng đến lý luận đa tài liệu nhiều trang── nó trải qua các trang truy xuất tài liệu,并为 VLM 组合 multi-page context──

### ViDoRe  điểm chuẩn

Các nhiệm vụ bao gồm báo cáo tài chính, báo cáo khoa học, tài liệu hành chính, hồ sơ y tế, hướng dẫn.

ColPali-v1 trên ViDoRe lên khoảng 80% nDCG@5; cùng một loạt tài liệu trên văn bản-RAG lên khoảng 50-60%。

### Đường ống dẫn RAG từ đầu đến cuối

 Đối với RAG thị giác:

1. 摄取:PDF → 页面图像 → PaliGemma mã hóa → 存储所有补丁嵌入式──
2. 查询: user文本 → embedment truy vấn-token → đối với tất cả các trang đã được chỉ mục thực hiện MaxSim → top-k 页面。
3. 生成:top-k 页面图像 + truy vấn → VLM(Qwen2.5-VL hoặc Claude)→ 答案。

Không có OCR.

### Hóa toán lưu trữ

Một bản báo cáo tài chính 50 trang, mỗi trang 729 bản vá,128 chiều:

- ColPali:50 * 729 * 128 * 4 byte = ~18 MB nguyên liệu, PQ 后 ~4 MB。
- Text-RAG:50 bit * 768-dim * 4 byte = ~150 kB。

ColPali Mỗi tài liệu lưu trữ khoảng 30x. Trong trường hợp quy mô, OPQ / PQ có thể giảm xuống còn khoảng 5-10x, thường có thể chấp nhận.

### Text-RAG  vẫn thắng

- Không có tín hiệu bố trí của tài liệu văn bản thuần túy (tài liệu wiki, nhật ký trò chuyện)
- 存储主导成本的数百万页档案──
- 严格监管要求在检索旁边保留可提取的 OCR văn bản

Đối với những trường hợp khác trong năm 2026, đó là báo cáo tài chính, báo cáo khoa học, hợp đồng pháp lý, hồ sơ y tế, tài liệu UX, RAG bản địa


```figure
mm-maxsim
```

## Sử dụng nó

`code/main.py`- Có thể là:

- Bộ mã hóa đệm đồ chơi:将一个"页面"(小型 feature vectors 网格)映射为补丁嵌入阵列──
- Máy ghi MaxSim: tính toán đặt mã truy vấn và đặt bản vá trang 之间的 ColBERT-style score。
- Chỉ mục 5 trang đồ chơi,运行 3 truy vấn,并返回带 điểm số của top-k。

## 交付 nó

本课会产出 `outputs/skill-vision-rag-designer.md`△给定一个文件-RAG 项目,选择 ColPali / ColQwen2 / VisRAG / text-RAG,并估算存储──

## 练习

1. Một bản báo cáo hàng năm 200 trang, mỗi trang 729 bản vá,128-dimen Emb, 4byte floats──计算 khâu nguyên liệu và khâu PQ-compressed(8x) khâu lưu trữ──

2. MaxSim là Σ_i max_j cos(q_i, p_j) ・・・

3. ColPali sẽ chỉ dẫn các trang cho các bộ váy. Nếu thay đổi theo trình độ từ  xây dựng chỉ dẫn như ColBERT, sẽ xảy ra những thay đổi gì? Có những sự thỏa hiệp nào?

4. Để một 1M trang corpus  thiết kế đường ống đầu đến cuối, yêu cầu ngân sách thời gian trễ 为 500ms 选择 ColQwen2 / VisRAG 并说明理由──

5. 阅读 M3DocRAG(arXiv:2411.04952)。 mô tả mô hình chú ý nhiều trang, cũng như sự khác biệt của nó với việc lấy lại ColPali một trang.

## 关键术语

| Term | 人们常说 | 它的实际含义 |
|------|-----------------|------------------------|
| Late interaction | "ColBERT-style" | 使用 per-token 或 per-patch embeddings + MaxSim 做 retrieval，而不是 single doc Vector |
| MaxSim | "Max-over-patches" | 对每个 query token，选择 similarity 最高的 document token；跨 query 求和 |
| Bi-encoder | "Single-vector" | 每个 document 一个 Vector；更快，但会丢失粒度 |
| Multi-vector | "Many-vectors-per-doc" | 每个 document / page 存储 N_p Vectors；storage cost 增长，但 recall 提升 |
| Patch embedding | "Page feature" | 来自 VLM encoder 的每个 image patch 的一个 Vector，按页 cached |
| ViDoRe | "Vision doc bench" | ColPali 用于 visual document retrieval 的 benchmark suite |
| PQ quantization | "Product quantization" | 在缩小 storage 约 8x 的同时保持 Vector similarity 的压缩方法 |

## 延伸阅读

- [Faysse et al. — ColPali (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449)
- [Khattab & Zaharia — ColBERT (arXiv:2004.12832)](https://arxiv.org/abs/2004.12832)
- [Yu et al. — VisRAG (arXiv:2410.10594)](https://arxiv.org/abs/2410.10594)
- [Cho et al. — M3DocRAG (arXiv:2411.04952)](https://arxiv.org/abs/2411.04952)
- [illuin-tech/colpali GitHub](https://github.com/illuin-tech/colpali)
