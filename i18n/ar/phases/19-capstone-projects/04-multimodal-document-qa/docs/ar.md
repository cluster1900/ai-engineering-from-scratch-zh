# كابستون 04  مستند متعدد الحركات QA(رؤية أول PDF、表格、图表)

> 2026 سنة وثيقة-QA 前沿已从 OCR-then-text 转向视觉-first late interaction──ColPali、ColQwen2.5 和 ColQwen3-omni سوف تصف كل صفحة PDF بصورة، باستخدام تعامل متأخر متعدد المتجهات لها إدراج،并让查询 直接 attend till patches── بالنسبة للمصالح المالية 10-K、论文科学和手写笔记, هذا النموذج أفضل بكثير من OCR-first── يرجى بناء خط أنابيب على 10k 页端到端,并发布与 OCR-then-text 的并排比──

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (viewer UI)
**Prerequisites:** Phase 4 (computer vision), Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**P4 · P5 · P7 · P11 · P12 · P17
**Time:** 30 小时

## 问题
企业拥有大量会被OCR管道搞乱的 PDF:带旋转表格的扫描版 10-K、充满公式的科学论文、只有作为图像才有意图、手写批注──把这些内容按文字先处理,意味着丢失一半信号──2026 答案是在原始页面图像上进行迟交互多向量检索──ColPali (Illinois Tech) 引入这种方法;ColQwen2.5-v0.2 和ColQwen3-推推确率──在 ViDoRe v3 上,视觉第一检索分分分以有意度为O-then-hightext,并在表表表表表表表表表表表表表表表表表表表表表表表表表表表格和图表差距扩大.

代价是存储和延迟──ColQwen Embedding في كل صفحة حوالي 2048 补丁 矢量، وليس مجرد 1024-dim 矢量──原始存储会膨胀──DocPruner (2026) 可在无可测准确率损失的情况下带来50%剪裁──你将索引 10k 页面,测量 ViDoRe v3 nDCG@5,在2秒内提供答案,并与OCR-then-text基线 直接比较──

## 概念
التفاعل المتأخر يعني كل استفسار Token المدينة مع كل ملصق Token 打分، ثم لكل استفسار Token 取最大分并求和。 هكذا لا حاجة إلى واحد مجتمعة المتجه، أيضا يمكن الحصول على تحديد التوازن المتجه.

الجواب هو نموذج لغة الرؤية، فإنه يتلقى استفسار 和 top-k 检索页面图像,并输出带证据区域(تقاطع مربعات أو مرجع الصفحة)

评估是一个二维矩阵──一个轴是内容类型(纯文本段落、密集表格、柱状/折线图、手写笔记、公式)──另一个轴是检索方法(视觉-第一晚交互 vs OCR-then-text vs hybrid)──每个单元格得到 nDCG@5 和答案精度──报告就是交付物物──

## المكونات
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
- 页面染: PyMuPDF (fitz) ،180 DPI، صورة طبيعية
- نموذج التفاعل المتأخر: ColQwen2.5-v0.2 أو ColQwen3-omni ((Hugging Face 上的 vidore team)
- المؤشر: 带多 مترو حقل  Vespa, أو Qdrant متعددة مترو, أو带 MaxSim  AstraDB
- الحصن: سياسة DocPruner 2026 ((احتفاظ بالشحنات ذات التباين العالي،50٪ ضغط مع فقدان دقة < 0.5%)
- عكس OCR ((公式 / 密集表格): نقطة
- جهاز الإجابة VLM: Qwen3-VL-30B المضيفة الذاتية أو Gemini 2.5 Pro المضيفة؛ InternVL3  كخفض
- تقييم: مؤشر ViDoRe v3،M3DocVQA يستخدم للتفكير متعدد الصفحات
- واجهة المشاهد: Next.js 15 , استخدام سطح القماش  عرض مناطق الأدلة


```figure
ce-late-interaction
```

## بناءها
1. **Ingest.**遍历一个包含10k PDF 页面的语料库,覆盖10K、科学论文和扫描文档──将每页染为1536x2048 PNG──持久化`{doc_id, page_num, image_path}`.

2. **Embed.**في كل صفحة الصورة على متن ColQwen2.5 v0.2──输出形状约为 2048 个 dim 128 的补丁嵌入式──应用 DocPruner 保留信号最强的一半──写入Vespa متعددة المتجهات الحقل أو Qdrant متعددة المتجهات──

3. **Query.**على كل إرسال إلى البحث، استخدام برج البحث  إجراء إدخال (إدخال)  تمثيلات على مستوى الرمز)  على المؤشر 运行 MaxSim: على كل إدخال إلى البحث Token,在页面补丁  上取最大 dot-product 并求和──返回 top-k 页面──

4. **Synthesize.**استخدام استفسار 和 top-5 页面图像调用 Qwen3-VL-30B──Prompt: "الرد باستخدام الصفحات المقدمة فقط. ذكر كل مطالبة من خلال (doc_id، الصفحة) وسم المنطقة (الرسم، الجدول، الفقرة). "

5. **Evidence regions.**على الإجابة إجراء عملية ما بعد،提取被引用的地区──如果 VLM 输出界框 ((Qwen3-VL 会这样做) ،就在观众中把它们染为叠加──

6. **OCR fallback.**على الصفحة التي يتم التعرف عليها على صيغ كثيفة (بناء على الاختلافات الصورة) ، ونقل النوع أو نقاط.ocr، ونقل نص OCR كمركز إضافي مع الصورة.

7. **Eval.**运行 ViDoRe v3(التحقيق nDCG@5) ومـ M3DocVQA(تدقيق QA متعدد الصفحات)。 أيضا على استخدام نفس المختلط في نفس المجموعة من المواد اللغة 运行 OCR-then-text pipeline──产出一个内容-type × approach Matrix──

8. **UI.**先做 Streamlit النموذج الأول;再做 Next.js 15 المشاهد الإنتاج, دعم كل صفحة دليل المنطقة التغطية

## استخدمها
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

## 交付 it
`outputs/skill-doc-qa.md`描述交付物: نظام QA متعدد الحركات الرؤية الأولى ، لمحدد مجموعة من المواد المستخدمة ، ويقوم بتقييمها في ViDoRe v3 上 مع أساس OCR-then-text 

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | ViDoRe v3 / M3DocVQA accuracy | Benchmark numbers vs OCR-text baseline and published leaderboard |
| 20 | Evidence-region grounding | 被引用 regions 中实际包含 answer span 的比例 |
| 20 | Storage and latency engineering | DocPruner compression ratio、index p95、answer p95 |
| 20 | Multi-page reasoning | 在手工标注的 100-question multi-page set 上的 accuracy |
| 15 | Source-inspection UX | Viewer clarity、overlay fidelity、side-by-side comparison tools |
| **100** | | |

## التدريب
1. في نفس المقالة القياس ColQwen2.5v0.2 مقابل ColQwen3-omni。 أي صفحة واحدة قادرة على الإجابة والآخر سوف تفشل؟ إلى المؤشر  إضافة علامة "مجموعة المحتوى"، للاستخدام حسب الطريق النوعية。

2. 激进地 prune Embeddings(75%、90%) ――جد صخره الضغط: ViDoRe nDCG@5 下降到OCR الاساس 以下点──

3. 构建混合:并行运行 OCR-then-text 和 ColQwen, باستخدام RRF 融合, استخدام إعادة تصنيف المُشفّر المتقاطع── الهجين 是否优于单独任一方法?

4. سوف نقوم بتحديد دقة Qwen3-VL-30B بدلاً من VLM أصغر (Qwen2.5-VL-7B)

5. 添加手稿笔记支持──染手稿体,使用ColQwen 进行 Embedding,测量检索──与手稿OCR管道对比──

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
- [ColPali (Illuin Tech) repository](https://github.com/illuin-tech/colpali) التفاعل المتأخر 文档检索参考
- [ColPali paper (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449) 基础方法论文
- [ColQwen family on Hugging Face](https://huggingface.co/vidore)نقاط تفتيش جاهزة للإنتاج
- [M3DocRAG (Adobe)](https://arxiv.org/abs/2411.04952) خط أساسية للـ RAG متعدد الصفحات
- [Vespa multi-vector tutorial](https://docs.vespa.ai/en/colpali.html) كومة الخدمات المرجعية
- [Qdrant multi-vector support](https://qdrant.tech/documentation/concepts/vectors/#multivectors) مؤشر بديل
- [AstraDB multi-vector](https://docs.datastax.com/en/astra-db-serverless/databases/vector-search.html) مؤشر إدارة بديل
- [Nougat OCR](https://github.com/facebookresearch/nougat) تراجع OCR القادر على المعادلة
