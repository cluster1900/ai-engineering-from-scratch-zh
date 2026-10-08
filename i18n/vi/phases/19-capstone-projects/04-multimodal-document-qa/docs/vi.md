# Capstone 04  Tài liệu đa phương thức QA(Vision-First PDF、表格、图表)

> Tài liệu-QA 前沿 2026 năm đã chuyển từ OCR-then-text 转向视觉-first late interaction──ColPali、ColQwen2.5 和 ColQwen3-omni sẽ xem mỗi trang PDF như hình ảnh, sử dụng nhiều vector late interaction để thực hiện nó  Embedding,并让 truy vấn  trực tiếp tham dự đến các bản vá── đối với tài chính 10-K、论文科学和笔记, mô hình này tốt hơn đáng kể so với OCR-first── xin hãy xây dựng đường ống dẫn trên 10k 页 kết thúc,并发布 so với OCR-then-text 并排对比──

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (viewer UI)
**Prerequisites:** Phase 4 (computer vision), Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P5 · P7 · P11 · P12 · P17
**Time:** 30 小时

## 问题
Các doanh nghiệp có một số lượng lớn sẽ bị OCR pipeline 乱乱的 PDF:带旋转表格的扫描版 10-K、充满公式的科学论文、只有作为图像才有意图片、手写批注――把这些内容按文字先处理,意味着丢失一半信号――2026 答案是在原始页面图像上进行后期互动多向量检索――ColPali (Illuin Tech) 引入这种方法;ColQwen2.5-v0.2 和ColQwen3-推推确率――在 ViDoRe v3 上,视觉-第一检索的分分分准为有意度的程度到O-then-hightext,并且在表表表表表表表表表表表表表表表表表表表表表表表表表表表格和图表差幅扩大――

代价是存储和延迟──ColQwen Embedding Mỗi trang có khoảng 2048 补丁 矢量, chứ không phải là một 矢量 1024 chiều. 原始存储会膨胀──DocPruner (2026) 可在无可测准确率损失的情况下带来50% cắt tỉa──你将索引 10k 页面,测量 ViDoRe v3 nDCG@5,在 2s内提供答案,并与OCR-then-text基线直接比较──

## 概念
Late interaction nghĩa là mỗi truy vấn Token sẽ được kết hợp với mỗi bản vá Token 打分, sau đó đối với mỗi truy vấn Token 取最大分并求和──这样无需单个聚合向量,也能获得细粒度匹配──多向量指数(Vespa、Qdrant multi-vector 或 AstraDB) lưu trữ mỗi bản vá 嵌入, và trong khi truy xuất 运行 MaxSim──

answerer là một mô hình ngôn ngữ thị giác, nó nhận truy vấn và trên cùng k 检索页面图像,并输出带 bằng chứng vùng (quảng trường kết nối hoặc tham chiếu trang) 答案.

评估 là một matrix hai chiều. Một轴是内容类型(纯文本段落、密集表格、柱状/折线图、手写笔记、公式) ―― Một轴是检索方法(视觉-第一迟交互对 OCR-然后-文字对混合) ――每个单元格得到 nDCG@5 和答案精度――报告就是交付物物――

## 架构
```
PDFs -> page renderer (PyMuPDF, 180 DPI)
           |
           v
  ColQwen2.5-v0.2 embed (multi-vector per page, ~2048 patches)
           |
           +------> DocPruner 50% compression
           |
           v
   multi-vector index (Vespa or Qdrant multi-vector)
           |
query ----+----> retrieve top-k pages (MaxSim)
           |
           v
  VLM answerer: Qwen3-VL-30B | Gemini 2.5 Pro | InternVL3
    inputs: query + top-k page images + optional OCR text
           |
           v
  answer with cited page numbers + evidence regions
           |
           v
  Streamlit / Next.js viewer: highlighted boxes on source page
```

## 技术
- 页面染: PyMuPDF (fitz),180 DPI, hình ảnh bình thường
- Mô hình tương tác muộn: ColQwen2.5-v0.2 hoặc ColQwen3-omni(Hugging Face 上的 vidore team)
- Chỉ số: 带 đa vector field của Vespa, hoặc Qdrant đa vector, hoặc带 MaxSim của AstraDB
- Trải: Chính sách DocPruner 2026 (trở lại các váyên cao, 50% nén 且 mất độ chính xác < 0,5%)
- OCR fallback (trái lại) 公式 / 密集表格):dots.ocr hoặc Nougat
- VLM trả lời: tự lưu trữ Qwen3-VL-30B hoặc lưu trữ Gemini 2.5 Pro;InternVL3  như sự trở lại
- Đánh giá: ViDoRe v3 điểm chuẩn,M3DocVQA dùng cho lý luận nhiều trang
- User Interface: Next.js 15, sử dụng lớp phủ tấm  hiển thị các vùng bằng chứng


```figure
ce-late-interaction
```

##  xây dựng nó
1. **Ingest.**遍历一个包含10k PDF 页面的语料库,覆盖10K、科学论文和扫描文档──将每页染为1536x2048 PNG──持久化`{doc_id, page_num, image_path}`

2. **Embed.**Trong mỗi trang hình ảnh trên chạy ColQwen2.5-v0.2──输出形状约为 2048 个 dim 128 的补丁嵌入式──应用 DocPruner 保留信号最强的一半──写入Vespa multi-vector field或Qdrant multi-vector──

3. **Query.**Đối với mỗi truy vấn, sử dụng tháp truy vấn  thực hiện Embedding(tốc độ embed)  đối với index 运行 MaxSim: đối với mỗi truy vấn Token, trong trang patch Embeddings 上取最大 dot-product 并求和──返回 top-k 页面。

4. **Synthesize.**用 query 和 top-5 页面图像调用 Qwen3-VL-30B──Prompt: "Đưa câu trả lời chỉ bằng các trang được cung cấp. Quảng cáo mỗi yêu cầu bằng (doc_id, trang) và đặt tên khu vực (hình, bảng, đoạn)."

5. **Evidence regions.**Để trả lời được tiến hành sau quá trình,提取被引用的地区──如果VLM 输出界框 ((Qwen3-VL 会这样做),就在观众中把它们染为叠加──

6. **OCR fallback.**Đối với các trang được nhận dạng như các công thức dày đặc (xác định dựa trên hình ảnh khác biệt),运行 Nougat hoặc dots.ocr,并将 OCR văn bản như một đường dẫn bổ sung với hình ảnh truyền vào.

7. **Eval.**运行 ViDoRe v3(khôi phục nDCG@5) và M3DocVQA(sự chính xác QA nhiều trang)。 cũng cần sử dụng cùng một bộ tổng hợp trên cùng một bộ chứa ngôn ngữ 运行 OCR-then-text pipeline──产出一个内容类型 ×方法矩阵──

8. **UI.**先做 Streamlit nguyên mẫu;再做 Next.js 15 trình chiếu sản xuất, hỗ trợ từng trang bằng chứng vùng phủ sóng.

## Sử dụng nó
```
$ doc-qa ask "what was the 2024 operating margin change for segment EMEA?"
[retrieve]   top-5 pages in 320ms (ColQwen2.5, MaxSim, Vespa)
[synth]      qwen3-vl-30b, 1.4s, cited (form-10k-2024, p. 88) + (..., p. 92)
answer:
  EMEA operating margin moved from 18.2% to 16.8%, a 140bp decline.
  cited: 10-K-2024.pdf p.88 (Table 4, Segment Operating Margin)
         10-K-2024.pdf p.92 (MD&A, Operating Performance)
[viewer]     open with highlighted bounding boxes overlaid on p.88 Table 4
```

## 交付 nó
`outputs/skill-doc-qa.md`描述交付物: một hệ thống QA tài liệu đa phương thức tầm nhìn đầu tiên, nhằm vào các bộ 语料库调优, và ViDoRe v3 上与 OCR-then-text baseline 进行评估──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | ViDoRe v3 / M3DocVQA accuracy | Benchmark numbers vs OCR-text baseline and published leaderboard |
| 20 | Evidence-region grounding | 被引用 regions 中实际包含 answer span 的比例 |
| 20 | Storage and latency engineering | DocPruner compression ratio、index p95、answer p95 |
| 20 | Multi-page reasoning | 在手工标注的 100-question multi-page set 上的 accuracy |
| 15 | Source-inspection UX | Viewer clarity、overlay fidelity、side-by-side comparison tools |
| **100** | | |

## 练习
1. Trong cùng một bộ phận ngôn ngữ, đo ColQwen2.5 v0.2 vs ColQwen3-omni──.

2. 激进地 prune Embeddings(75%、90%) ―― tìm đáy nếp nhăn:ViDoRe nDCG@5 下降到 OCR cơ sở 以下点──

3. 构建混合:并行运行 OCR-then-text 和 ColQwen, sử dụng RRF 融合, tái sử dụng mã hóa chéo ︎.

4. Để thay thế cho nhỏ hơn VLM ((Qwen2.5-VL-7B)  đo độ chính xác trên mỗi đô la 曲线。

5. 添加手写笔记支持──染手写体,使用 ColQwen 进行嵌入,测量检索──与手写 OCR管道对比──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Late interaction | "ColPali-style retrieval" | Query tokens 独立地与页面 patches 打分；MaxSim 聚合 |
| Multi-vector | "Per-patch embedding" | 每个文档有多个 Vector，而不是一个 pooled Vector |
| MaxSim | "Late-interaction scoring" | 对每个 query Token，在 document vectors 上取最大相似度；求和 |
| DocPruner | "Patch compression" | 2026 年的 pruning 方法，保留 50% patches 且 accuracy loss 可忽略 |
| ViDoRe v3 | "Document-retrieval benchmark" | 2026 年衡量 visual-document retrieval 的标准 |
| Evidence region | "Cited bounding box" | source page 上定位 answer span 的 bbox |
| OCR fallback | "Equation channel" | 与 vision 一起用于公式密集或表格密集页面的 text pipeline |

## 延伸阅读
- [ColPali (Illuin Tech) repository](https://github.com/illuin-tech/colpali) tương tác muộn 文档检索参考
- [ColPali paper (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449) 基础方法论文
- [ColQwen family on Hugging Face](https://huggingface.co/vidore) Các trạm kiểm soát sẵn sàng sản xuất
- [M3DocRAG (Adobe)](https://arxiv.org/abs/2411.04952) Tỷ lệ cơ sở RAG đa phương thức nhiều trang
- [Vespa multi-vector tutorial](https://docs.vespa.ai/en/colpali.html) hàng phục vụ tham chiếu
- [Qdrant multi-vector support](https://qdrant.tech/documentation/concepts/vectors/#multivectors) chỉ số thay thế
- [AstraDB multi-vector](https://docs.datastax.com/en/astra-db-serverless/databases/vector-search.html) Chỉ số quản lý thay thế
- [Nougat OCR](https://github.com/facebookresearch/nougat) Khác lại OCR có khả năng phương trình
