# 文档与图表理解

> 文档不是照片。PDF、科学论文、发票或手写表单具有 layout、表格、图表、脚注、页眉和语义结构，这些是普通图像理解无法捕捉的。VLM 之前的技术栈是一条 pipeline：Tesseract OCR + LayoutLMv3 + table-extraction heuristics。VLM 浪潮用 OCR-free models 取代了它们，包括 Donut (2022)、Nougat (2023)、DocLLM (2023)，这些 model 可以直接输出 structured markup。到 2026 年，前沿做法已经变成“把页面图像以 2576px native 输入给 Claude Opus 4.7”，structured-markup 输出自然就能得到。本课梳理 document AI 的三个时代。

**类型:** Build
**语言:** Python (stdlib, layout-aware document parser skeleton)
**前置要求:** Phase 12 · 05 (LLaVA), Phase 5 (NLP)
**时间:** ~180 minutes

## 学习目标

- 解释 document AI 的三个时代：OCR pipeline、OCR-free、VLM-native。
- 描述 LayoutLMv3 的三类输入流：text、layout (bbox)、image patches，以及 unified masking。
- 比较 Donut（OCR-free，image → markup）、Nougat（scientific paper → LaTeX）、DocLLM（layout-aware generative）、PaliGemma 2（VLM-native）。
- 为新任务选择 document model（发票、科学论文、手写表单、中文小票）。

## 问题

“理解这个 PDF”具有欺骗性的难度。信息存在于：

- Text content（90% 的信号）。
- Layout（页眉、脚注、侧栏、双栏格式）。
- 表格（行、列、合并单元格）。
- 图和图表。
- 手写批注。
- 字体与排版（标题 vs 正文）。

原始 OCR 会导出文本，但丢失其余部分。一个关心发票的系统需要知道 “Total: $1,245” 来自右下角，而不是来自脚注。

## 概念

### 时代 1 — OCR pipeline（2021 年之前）

经典技术栈：

1. PDF → 每页图像。
2. Tesseract（或商用 OCR）提取文本，并带有逐词 bounding boxes。
3. Layout analyzer 识别块（页眉、表格、段落）。
4. Table structure recognizer 解析表格。
5. Domain rules + regex 提取字段。

适用于干净的印刷文本。遇到手写、倾斜扫描、复杂表格、非英语文字会失效。每一种 failure mode 都需要自定义 exception path。

### TrOCR (2021)

TrOCR（Li et al., arXiv:2109.10282）用一个在 synthetic + real text images 上训练的 Transformer encoder-decoder，取代了 Tesseract 经典的 CNN-CTC。它在手写和多语言文本上明显胜出。它仍然是 pipeline（detector 然后 TrOCR 然后 layout），但 OCR 步骤大幅改善。

### 时代 2 — OCR-free（2022-2023）

第一批 OCR-free models 的思路是：完全跳过 detection，直接把 image pixels 映射到 structured output。

Donut（Kim et al., arXiv:2111.15664）：
- Encoder-decoder Transformer，encoder 是 Swin-B。
- 输出可以是用于 form understanding 的 JSON，用于 summarization 的 Markdown，或任意 task-specific schema。
- 无 OCR，无 layout，无 detection。

Nougat（Blecher et al., arXiv:2308.13418）：
- 专门在科学论文上训练。
- 输出是 LaTeX / Markdown。
- 处理公式、多栏 layout、图。
- 每个 arXiv-parser 都会调用的 model。

这些是 specialists，不是 generalists。Donut 处理科学论文会失败；Nougat 处理发票会失败。

### LayoutLMv3 (2022)

另一条路线。LayoutLMv3（Huang et al., arXiv:2204.08387）保留 OCR，但加入 layout understanding：

- 三类输入流：OCR text Tokens、每个 Token 的 2D bounding boxes、image patches。
- 跨三种 modalities 的 masked training objective（masked text、masked patches、masked layout）。
- Downstream：classification、entity extraction、table QA。

LayoutLMv3 是基于 OCR 的 document understanding 的高峰。它在表单和发票上很强。需要上游 OCR。在标准化 document benchmarks 上拥有最佳的 pre-VLM accuracy。

### DocLLM (2023)

DocLLM（Wang et al., arXiv:2401.00908）是 LayoutLM 的 generative sibling。它基于 layout Tokens 生成自由形式答案。更适合文档 QA；仍然依赖 OCR input。

### 时代 3 — VLM-native（2024+）

2024 年，VLMs 已经足够好，可以完全取代 pipeline。把完整页面图像以高分辨率输入给 VLM，提出问题，得到答案。

- LLaVA-NeXT 336-tile AnyRes 适用于小文档。
- Qwen2.5-VL dynamic-resolution 原生处理 2048+ pixels。
- Claude Opus 4.7 支持 2576px 文档。
- PaliGemma 2（2025 年 4 月）专门为文档 + 手写训练。

VLM-native 与 OCR-pipeline 之间的差距快速缩小。到 2026 年，VLM-native 在以下方面胜出：

- Scene text（手写 + 印刷，混合文字系统）。
- 带合并单元格的复杂表格。
- Embedded 文本中的数学公式。
- 带文字标注的图。

OCR pipelines 仍在以下方面胜出：

- 纯扫描、大规模工作负载，此时每页 latency 很重要。
- Pipeline 可靠性（确定性失败 vs VLM 幻觉）。
- 需要可审计 OCR output 的监管环境。

### Claude 4.7 / GPT-5 前沿

在 2576-pixel native input 下，frontier VLMs 的文档理解已接近人类准确率。2026 年初的 benchmark 数字：

- DocVQA：Claude 4.7 ~95.1，PaliGemma 2 ~88.4，Nougat ~77.3，pipelined LayoutLMv3 ~83。
- ChartQA：Claude 4.7 ~92.2，GPT-4V ~78。
- VisualMRC：Claude 4.7 ~94。

闭源 model 的差距主要来自分辨率和 base-LLM scale。7B 的开源 model 落后几个百分点，但正在追上。

### 数学公式与 LaTeX 输出

科学论文需要对公式进行精确的 LaTeX 输出。Nougat 就是在这个目标上训练的。带 LaTeX targets 训练的 VLMs（Qwen2.5-VL-Math、Nougat derivatives）可以生成可用的 LaTeX。没有显式 LaTeX training 时，VLMs 会生成可读但不精确的转写。

2026 年的 scientific-paper pipelines：先对 PDF 使用 Nougat，再对棘手页面使用 VLM。

### 手写

这仍然是最难的子任务。混合印刷 + 手写（医生笔记、填写过的表单）是 OCR pipelines 在成本上仍然优于 VLMs 的场景。Handwritten-only VLMs 正在改进（Claude 4.7、PaliGemma 2）。

### 2026 配方

对于新的 document-AI 项目：

- 大规模纯印刷发票：LayoutLMv3 + rules，成本高效。
- 混合文档（科学论文 + 手写 + 表单）：VLM-native（PaliGemma 2 或 Qwen2.5-VL）。
- 完整 arXiv ingestion：Nougat 处理数学，VLM 处理图。
- 监管场景：OCR pipeline + VLM validator 用于 cross-check。

## 使用它

`code/main.py`：

- 一个玩具级 layout-aware tokenizer：给定 (text, bbox) pairs，生成 LayoutLMv3 风格输入。
- 一个 Donut 风格 task schema generator：用于表单的 JSON template。
- 比较 OCR-pipeline、Donut、Nougat 和 VLM-native 在每页上的 Token budgets。

## 交付它

本课产出 `outputs/skill-document-ai-stack-picker.md`。给定一个 document-AI 项目（domain、scale、quality、regulatory），在 OCR pipeline、OCR-free specialist 和 VLM-native 之间做选择。

## 练习

1. 你的项目每天处理 1000 万张发票。哪个技术栈能在不损失准确率的情况下最小化 cost-per-page？

2. 为什么 LayoutLMv3 在 form QA 上优于 pure-CLIP-VLMs，但在 scene-text 上表现较弱？bbox stream 放弃了什么？

3. Nougat 生成 LaTeX。提出一个 VLM-native 输出在 LaTeX fidelity 上优于 Nougat 的测试用例，以及一个 Nougat 胜出的用例。

4. 阅读 PaliGemma 2 paper（Google, 2024）。相比 PaliGemma 1，提升文档准确率的关键 training-data addition 是什么？

5. 设计一个 regulatory-safe hybrid：OCR pipeline 作为 primary，VLM 作为 secondary cross-check。你如何解决分歧？

## 关键术语

| 术语 | 人们的说法 | 它的实际含义 |
|------|-----------------|------------------------|
| OCR pipeline | “Tesseract-style” | 分阶段技术栈：detect -> OCR -> layout -> rules；deterministic，脆弱 |
| OCR-free | “Donut-style” | 跳过显式 OCR 的 image-to-output Transformer；单一 model |
| Layout-aware | “LayoutLM” | 输入包含每个 Token 的 bbox 坐标；跨 modalities 的 unified masking |
| VLM-native | “Frontier VLM” | 将页面图像直接以高分辨率输入 Claude/GPT/Qwen VLM；无 pipeline |
| DocVQA | “Doc benchmark” | Document VQA 标准；最常被引用的分数 |
| Markup output | “LaTeX / MD” | 结构化输出格式，而不是自由形式文本；支持 downstream automation |

## 延伸阅读

- [Li et al. — TrOCR (arXiv:2109.10282)](https://arxiv.org/abs/2109.10282)
- [Blecher et al. — Nougat (arXiv:2308.13418)](https://arxiv.org/abs/2308.13418)
- [Huang et al. — LayoutLMv3 (arXiv:2204.08387)](https://arxiv.org/abs/2204.08387)
- [Kim et al. — Donut (arXiv:2111.15664)](https://arxiv.org/abs/2111.15664)
- [Wang et al. — DocLLM (arXiv:2401.00908)](https://arxiv.org/abs/2401.00908)
