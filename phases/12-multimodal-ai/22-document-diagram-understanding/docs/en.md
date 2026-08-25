# 文档与图表理解

> 文档不是照片。PDF、科学论文、发票或手写表单包含 layout、表格、图表、脚注、页眉和语义结构，这些是普通图像理解无法捕获的。VLM 之前的 stack 是一个 pipeline：Tesseract OCR + LayoutLMv3 + 表格抽取 heuristics。VLM 浪潮用 OCR-free models 取代了它——Donut (2022)、Nougat (2023)、DocLLM (2023)——这些 models 能直接输出结构化 markup。到 2026 年，前沿做法已经只是“把 page image 以 2576px native 输入 Claude Opus 4.7”，结构化 markup 输出会自然得到。本课梳理 document AI 的三个时代弧线。

**Type:** Build
**Languages:** Python (stdlib, layout-aware document parser skeleton)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 5 (NLP)
**Time:** ~180 minutes

## 学习目标

- 解释 document AI 的三个时代：OCR pipeline、OCR-free、VLM-native。
- 描述 LayoutLMv3 的三类输入流：文本、layout（bbox）、image patches，以及统一 masking。
- 比较 Donut（OCR-free，image → markup）、Nougat（科学论文 → LaTeX）、DocLLM（layout-aware generative）、PaliGemma 2（VLM-native）。
- 为新任务选择 document model（发票、科学论文、手写表单、中文票据）。

## 问题

“理解这个 PDF”具有欺骗性地困难。信息位于：

- 文本内容（90% 的信号）。
- Layout（页眉、脚注、侧栏、双栏格式）。
- 表格（行、列、合并单元格）。
- 图形和图表。
- 手写批注。
- 字体与排版（标题 vs 正文）。

原始 OCR 会倾倒出文本，但丢失其余信息。一个关心发票的系统需要知道 "Total: $1,245" 来自右下角，而不是来自脚注。

## 概念

### Era 1 — OCR pipeline（2021 年前）

经典 stack：

1. PDF → 每页图像。
2. Tesseract（或商业 OCR）抽取文本，并提供逐词 bounding boxes。
3. Layout analyzer 识别 blocks（header、table、paragraph）。
4. Table structure recognizer 解析表格。
5. Domain rules + regex 抽取字段。

适用于干净的印刷文本。遇到手写、倾斜扫描、复杂表格、非英语文字会崩。每种 failure mode 都需要自定义 exception path。

### TrOCR (2021)

TrOCR（Li et al., arXiv:2109.10282）用在合成 + 真实文本图像上训练的 transformer encoder-decoder，取代了 Tesseract 经典的 CNN-CTC。它在手写和多语言文本上取得了明确优势。它仍然是 pipeline（detector 然后 TrOCR 然后 layout），但 OCR 步骤大幅改进。

### Era 2 — OCR-free（2022-2023）

第一批 OCR-free models 的思路是：完全跳过 detection，直接把 image pixels 映射为结构化输出。

Donut（Kim et al., arXiv:2111.15664）：
- Encoder-decoder transformer，encoder 是 Swin-B。
- 输出可以是用于表单理解的 JSON、用于摘要的 markdown，或任何特定任务 schema。
- 无 OCR、无 layout、无 detection。

Nougat（Blecher et al., arXiv:2308.13418）：
- 专门在科学论文上训练。
- 输出是 LaTeX / markdown。
- 处理 equations、多栏 layout、figures。
- 每个 arXiv-parser 都会调用的 model。

这些是 specialists，而不是 generalists。Donut 处理科学论文会失败；Nougat 处理发票会失败。

### LayoutLMv3 (2022)

另一条路线。LayoutLMv3（Huang et al., arXiv:2204.08387）保留 OCR，但加入 layout understanding：

- 三类输入流：OCR text tokens、逐 token 的 2D bounding boxes、image patches。
- 跨三种 modalities 的 masked training objective（masked text、masked patches、masked layout）。
- 下游任务：classification、entity extraction、table QA。

LayoutLMv3 是基于 OCR 的文档理解巅峰。它在表单和发票上很强。上游需要 OCR。在标准化文档 benchmark 上具有最好的 VLM 之前准确率。

### DocLLM (2023)

DocLLM（Wang et al., arXiv:2401.00908）是 LayoutLM 的生成式 sibling。它基于 layout tokens 条件生成 free-form answers。更适合文档 QA；仍依赖 OCR 输入。

### Era 3 — VLM-native（2024+）

2024 年的 VLMs 已经足够好，可以完全取代 pipeline。把完整 page image 以高分辨率输入 VLM，提出问题，得到答案。

- LLaVA-NeXT 336-tile AnyRes 适用于小型文档。
- Qwen2.5-VL dynamic-resolution 原生处理 2048+ pixels。
- Claude Opus 4.7 支持 2576px 文档。
- PaliGemma 2（2025 年 4 月）专门针对文档 + 手写训练。

VLM-native 与 OCR-pipeline 之间的差距快速缩小。到 2026 年，VLM-native 在以下方面胜出：

- Scene text（手写 + 印刷，混合文字体系）。
- 包含合并单元格的复杂表格。
- Embedding文本中的数学 equations。
- 带文本批注的 figures。

OCR pipelines 仍在以下方面胜出：

- 纯扫描的大规模工作负载，其中每页延迟很重要。
- Pipeline 可靠性（确定性失败 vs VLM hallucinations）。
- 需要可审计 OCR 输出的监管环境。

### Claude 4.7 / GPT-5 前沿

在 2576-pixel native input 下，前沿 VLMs 能以接近人类的准确率进行文档理解。2026 年初的 benchmark 数字：

- DocVQA：Claude 4.7 ~95.1，PaliGemma 2 ~88.4，Nougat ~77.3，pipelined LayoutLMv3 ~83。
- ChartQA：Claude 4.7 ~92.2，GPT-4V ~78。
- VisualMRC：Claude 4.7 ~94。

闭源 model 差距主要来自分辨率和 base-LLM 规模。7B 开源 models 落后几个点，但正在追赶。

### 数学 equations 和 LaTeX 输出

科学论文需要精确的 LaTeX equation 输出。Nougat 就是为此训练的。带 LaTeX targets 训练的 VLMs（Qwen2.5-VL-Math、Nougat derivatives）可以生成可用的 LaTeX。没有显式 LaTeX 训练时，VLMs 会生成可读但不精确的转写。

2026 年的科学论文 pipeline：先在 PDF 上跑 Nougat，再用 VLM 处理棘手页面。

### 手写

这仍然是最难的子任务。混合印刷 + 手写（医生笔记、填写过的表单）是 OCR pipelines 在成本上仍胜过 VLMs 的地方。只含手写的 VLMs 正在改进（Claude 4.7、PaliGemma 2）。

### 2026 recipe

对于新的 document-AI 项目：

- 大规模纯印刷发票：LayoutLMv3 + rules，成本高效。
- 混合文档（科学 + 手写 + 表单）：VLM-native（PaliGemma 2 或 Qwen2.5-VL）。
- 完整 arXiv ingestion：Nougat 处理数学，VLM 处理 figures。
- 监管场景：OCR pipeline + VLM validator 用于交叉检查。

```figure
mm-doc-layout
```

## 使用它

`code/main.py`：

- 一个玩具版 layout-aware tokenizer：给定 (text, bbox) pairs，生成 LayoutLMv3 风格输入。
- 一个 Donut 风格 task schema generator：用于表单的 JSON template。
- 比较 OCR-pipeline、Donut、Nougat 和 VLM-native 每页 token budgets。

## 交付它

本课产出 `outputs/skill-document-ai-stack-picker.md`。给定一个 document-AI 项目（domain、scale、quality、regulatory），在 OCR pipeline、OCR-free specialist 和 VLM-native 之间做选择。

## 练习

1. 你的项目每天处理 10M 张发票。哪种 stack 能在不损失准确率的情况下最小化 cost-per-page？

2. 为什么 LayoutLMv3 在 form QA 上优于 pure-CLIP-VLMs，但在 scene-text 上表现较差？bbox stream 放弃了什么？

3. Nougat 生成 LaTeX。提出一个 VLM-native 输出在 LaTeX fidelity 上胜过 Nougat 的测试用例，以及一个 Nougat 胜出的用例。

4. 阅读 PaliGemma 2 paper（Google, 2024）。相较 PaliGemma 1，提升文档准确率的关键训练数据新增项是什么？

5. 设计一个 regulatory-safe hybrid：OCR pipeline 作为 primary，VLM 作为 secondary cross-check。你如何解决分歧？

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|-----------------|------------------------|
| OCR pipeline | "Tesseract-style" | 分阶段 stack：detect -> OCR -> layout -> rules；确定性、脆弱 |
| OCR-free | "Donut-style" | 跳过显式 OCR 的 image-to-output transformer；单一 model |
| Layout-aware | "LayoutLM" | 输入包含逐 token bbox coordinates；跨 modalities 的统一 masking |
| VLM-native | "Frontier VLM" | 直接把 page image 以高分辨率输入 Claude/GPT/Qwen VLM；无 pipeline |
| DocVQA | "Doc benchmark" | Document VQA 标准；最常被引用的分数 |
| Markup output | "LaTeX / MD" | 结构化输出格式，而不是 free-form text；支持下游自动化 |

## 延伸阅读

- [Li et al. — TrOCR (arXiv:2109.10282)](https://arxiv.org/abs/2109.10282)
- [Blecher et al. — Nougat (arXiv:2308.13418)](https://arxiv.org/abs/2308.13418)
- [Huang et al. — LayoutLMv3 (arXiv:2204.08387)](https://arxiv.org/abs/2204.08387)
- [Kim et al. — Donut (arXiv:2111.15664)](https://arxiv.org/abs/2111.15664)
- [Wang et al. — DocLLM (arXiv:2401.00908)](https://arxiv.org/abs/2401.00908)
