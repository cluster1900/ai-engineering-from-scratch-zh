#                                                                                                                                                                                                                                                               

> 2026年的文件-QA 前沿已经从OCR-then-text 转向视觉-first late interaction──ColPali、ColQwen2.5 和 ColQwen3-omni将每个 PDF 页面视为图像,使用多向量迟交互对其进行嵌入,并让查询直接参加到补丁──对于财务 10-K、科学论文和笔记,这种模式明显优于OCR-first──请在 10k 页面端到端构建管道,并发布与OCR-then-text的并排比──

**Type:** Capstone
**Languages:** Python (pipeline), TypeScript (viewer UI)
**Prerequisites:** Phase 4 (computer vision), Phase 5 (NLP), Phase 7 (transformers), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 17 (infrastructure)
**Phases exercised:**子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子
**Time:** 30 小时

## 问题
企业拥有大量会被OCR管道乱的PDF:带旋转表格扫描版 10-K、充满公式的科学论文、只有作为图像才有意义图片、手写批量──把这些内容按文本先处理,意味着丢失一半信号──2026年答案是对原始页面图像进行迟交互多向量检索──ColPali (伊利科技) 引入这种方法;ColQwen2.5v0.2 和ColQwen3-推广确率──在ViDoRe v3上,视觉第一检索分数被准确地分为O-then-hightext,并且在表格和CRM图表格上扩大内容差距──

代价是存储和延迟──ColQwen嵌入每页有2048个补丁矢量,而不是单个1024维度矢量──原始存储会膨胀──DocPruner (2026) 可在无可测准确率损失的情况下带来50%的剪裁──你将索引10k页面,测量ViDoRe v3 nDCG@5,在2秒内提供答案,并与OCR-then-text基线直接比较──

## 概念
晚间交互意味着每个查询代币都会与每个补丁代币打分,然后对每个查询代币取最大分并求和──这样无需单个聚合向量,也能获得细粒度匹配──多向量指数(Vespa、Qdrant多向量或AstraDB) 存储每补丁嵌入,并在检索时运行MaxSim──

答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答案: 答: 答案: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 答: 

评估是一个二维矩阵――一个轴是内容类型――纯文本段落、密集表格、柱状/折线图、手写笔记、公式) ――另一个轴是检索方法――视觉-第一晚交互对抗OCR-然后-文本对抗混合物――每个单元格得到nDCG@5 和答案精度――报告就是交付物物――

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
- 页面染: PyMuPDF (fitz),180 DPI,肖像正常化
- 后期互动模型:ColQwen2.5-v0.2 或ColQwen3-omni(Hugging Face 上的视频团队)
- 索引: 带多向量场的Vespa,或Qdrant多向量,或带 MaxSim的AstraDB
- 切割:docPruner 2026政策 保留高变量补丁,50%压缩 且精度损失 < 0.5%)
- 缩的 OCR 公式 / 密集表格:dots.ocr 或 Nougat
- 作为回复,VLM 响应器:自主托管的Qwen3-VL-30B 或托管的Gemini 2.5 Pro;InternVL3
- 评估: ViDoRe v3 基准,M3DocVQA 用于多页推理
- 浏览器UI: Next.js 15,使用帆布覆盖 显示证据区域


```figure
ce-late-interaction
```

## 构建它
1. **Ingest.**遍历一个包含10万个PDF页面的语料库,覆盖10万个科学论文和扫描文档.`{doc_id, page_num, image_path}`,我知道.

2. **Embed.**在每个页面图像上运行 ColQwen2.5v0.2──输出形状约为 2048个dim 128 的补丁嵌入式──应用 DocPruner 保留信号最强的一半──写入Vespa多向量场或Qdrant多向量──

3. **Query.**对每个传入查询,使用查询塔 进行嵌入 (嵌入) 标级嵌入) 对索引 运行 MaxSim:对每个查询标,在页面补丁嵌入上取最大点产品并求和。返回顶-k 页面。

4. **Synthesize.**用查询 和 top-5 页面图像调用 Qwen3-VL-30B──提示:"只使用提供的页面回答.以 (doc_id,页面) 引用每个索赔,并命名该区域 (图,表,段)."

5. **Evidence regions.**对于答案进行后处理,提取被引用的区域. 如果VLM 输出边界框,就在观众中把它们染为叠加.

6. **OCR fallback.**运行 Nougat 或 dots.ocr,并将OCR文本作为额外通道与图像一起传输.

7. **Eval.**运行 ViDoRe v3(检索 nDCG@5) 和 M3DocVQA(多页的QA准确性) 还要在相同语料库上使用相同的合成器 运行 OCR-then-text管道──产出一个内容类型 ×方法矩阵──

8. **UI.**先做 流量照明原型;再做 下一页.js 15 制作观众,支持逐页证据区域覆盖.

## 使用它
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

## 交付它
`outputs/skill-doc-qa.md`描述交付物:一个视觉第一的多元文档QA系统,针对特定语料库调优,并与 ViDoRe v3 上与OCR-then-text基线进行评估.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | ViDoRe v3 / M3DocVQA accuracy | Benchmark numbers vs OCR-text baseline and published leaderboard |
| 20 | Evidence-region grounding | 被引用 regions 中实际包含 answer span 的比例 |
| 20 | Storage and latency engineering | DocPruner compression ratio、index p95、answer p95 |
| 20 | Multi-page reasoning | 在手工标注的 100-question multi-page set 上的 accuracy |
| 15 | Source-inspection UX | Viewer clarity、overlay fidelity、side-by-side comparison tools |
| **100** | | |

## 练习
1. 在同一语料库测量 ColQwen2.5v0.2 vs ColQwen3-omni──哪些页面一个能回答对而另一个会漏掉?向索引添加一个"内容类"标签,用于按类型路径──

2. 激进地剪切嵌入式(75%、90%) ――找到压缩悬崖:ViDoRe nDCG@5 下降到OCR基线 以下点──

3. 构建混合动力:并行运行OCR-then-text 和 ColQwen,使用RRF 融合,再使用跨编码重新排名──混合动力是不是优于单独任一方法?它在哪些地方最大的帮助?

4. 将Qwen3-VL-30B 替换为更小的VLM(Qwen2.5-VL-7B) ⋅测量每美元的精度曲线──

5. 添加手写笔记支持──染手写体,使用 ColQwen 进行嵌入,测量检索──与手写OCR管道对比──

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
- [ColPali (Illuin Tech) repository](https://github.com/illuin-tech/colpali) 迟到互动 文档检索参考
- [ColPali paper (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449) 基础方法论文
- [ColQwen family on Hugging Face](https://huggingface.co/vidore)生产准备的检查站
- [M3DocRAG (Adobe)](https://arxiv.org/abs/2411.04952)多页多模拟RAG基线
- [Vespa multi-vector tutorial](https://docs.vespa.ai/en/colpali.html)参考服务堆
- [Qdrant multi-vector support](https://qdrant.tech/documentation/concepts/vectors/#multivectors)替代指数
- [AstraDB multi-vector](https://docs.datastax.com/en/astra-db-serverless/databases/vector-search.html)替代管理指数
- [Nougat OCR](https://github.com/facebookresearch/nougat)可方程的OCR倒退
