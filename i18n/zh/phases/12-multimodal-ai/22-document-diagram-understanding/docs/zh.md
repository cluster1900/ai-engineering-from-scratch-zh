# 文档与图表理解

> 文档不是照片──PDF、科学论文、发票或手写表单包含布局、表格、图表、脚注、页面眉和语义结构,这些都是普通图像理解无法捕获的──VLM 之前的堆是一个管道:Tesseract OCR + LayoutLMv3 + 表格抽取演习──VLM 浪潮使用 OCR 免费模型取代了它──Donut (2022) 诺格 (2023) 文档 (2023)  模型可以直接输出结构化标记──到2026年,前沿已经只是将页面图像以2576课程的本土输入了Claude Opus 4.7,结构化标记输入了这些自然本文──三代 AI 文档.

**Type:** Build
**Languages:** Python (stdlib, layout-aware document parser skeleton)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 5 (NLP)
**Time:** ~180 minutes

## 学习目标

- 解释文件 AI 的三个时代:OCR管道、OCR免费、VLM本土的──
- 描述LayoutLMv3 的三类输入流:文本、布局(bbox) 、图像补丁,以及统一掩饰──
- 比较Donut(OCR免费,图像 →标记)、Nougat(科学论文 → LaTeX)、DocLLM(布局知情生成)、PaliGemma 2(VLM原生)。
- 为新任务选择文件模型 ((发票、科学论文、手写表单、中文票据) ⋅

## 问题

理解这个PDF具有欺骗性地困难――信息位于:

- 文本内容:
- 布局 (页眉,脚注,侧,双格式)
- 表格(行、列、合并单元格) 』
- 图形和图表
- 写批注.
- 字体与排版

首先,OCR 会倾倒出文本,但丢失其余信息.

## 概念

### 年代1  OCR管道(2021年前)

经典堆:

1. 图片: 图片: 图片:
2. 抽取文本,并提供逐词边界框.
3. 布局分析器识别区块
4. 解析表格──表结构识别器
5. 域名规则+regex 抽取字段──

适用于干净的印刷文本. 遇到手写,倾斜扫描,复杂表格,非英语文字会崩.

### 经营管理局 (2021)

托克罗 (TROCR) 已在合成+真实文本图像上训练的变体编码器-解码器中取代了Tesseract 经典的CNN-CTC.

### 时代2 无OCR的2022-2023年

首先,无CR模型的想法是:完全跳过检测,直接把图像像像素映射为结构输出.

子 (Kim et al., arXiv:2111.15664):
- 编码器是Swin-B.
- 输出可以用于表达单独理解的JSON、用于摘要的标记,或任何特定任务方案.
- 没有OCR,没有布局,没有检测.

布莱克及其他, arXiv:2308.13418):
- 专为科学论文的训练.
- 输出是拉特克斯 / 标记.
- 处理方程,多布局,数字.
- 每个档案分析师都会调用模型.

这些都是专家,而不是一般主义者.

### 布局LMv3 (2022)

另一条路线──布局LMv3(黄等人, arXiv:2204.08387) 保留OCR,但加入布局理解:

- 三类输入流:OCR文本代币,每个代币的2D界限框,图像补丁.
- 跨三种模式的隐藏训练目标
- 下游任务:分类,实体提取,表 QA

布局LMv3是基于OCR的文档理解峰――它在表单和发票上很强――上游需要OCR――在标准化文档基准上具有最佳VLM 之前准确率――

### 文件 (2023)

文件LLM(Wang等, arXiv:2401.00908) 是LayoutLM的生成式兄弟姐妹. 它基于布局代币,条件生成自由形式的答案.

### 年代3 VLM原生(2024+)

2024 年的VLM 已经足够好,可以完全取代管道――把完整页面图像以高分辨率输入VLM,提出问题,得到答案――

- 适用于小型文档.
- 动态分辨率原生处理 2048+像素.
- 支持 2576px 文档──
- 利格玛 2(2025年 4 月) 专门针对文档 + 手写训练──

截至2026年,VLM-native 在以下方面胜出:

- 剧情文本 (手写 + 印刷,混合文字体系)
- 包含合并单元格的复杂表格――
- 嵌入文本中的数学方程――
- 带文本批注的数字

欧CR管道仍在以下方面取得胜利:

- 纯扫描大规模工作负载,其中每页延迟很重要.
- 管道可靠性 (确定性失败与VLM幻觉)
- 需要可审计的OCR 输出监管环境――

### 克劳德4.7 / GPT-5 前沿

在2576像素原生输入下,前沿的VLMs能够实现文档理解,以接近人类的准确率.

- 文件:Claude 4.7 ~95.1,PaliGemma 2 ~88.4,Nougat ~77.3,管道布局LMv3 ~83──
- 图QA:Claude 4.7 ~92.2,GPT-4V ~78──
- 视觉MRC:Claude 4.7 ~94。

闭源模型 差距主要来自自我分辨率和基础LLM 规模――7B 开源模型 落后几个点,但正在追赶――

### 数学方程和Latex 输出

科学论文需要精确的拉德克斯方程输出. 现在就是为此训练的. 带着拉德克斯目标训练的VLMs.

2026年科学论文管道:先在 PDF 上跑 Nougat,再使用VLM 处理棘手页面.

### 写手

这仍然是最难的子任务――混合印刷 + 手写(医生笔记、填写的表单) 是OCR管道在成本上仍然胜过VLM的地方――只包含手写的VLM正在改进(Claude 4.7、PaliGemma 2)。

### 2026 年的食谱

对于新文件-AI项目:

- 大规模纯印刷发票:布局LMv3+规则,成本高效──
- 混合文档(科学 + 手写 + 表单):VLM-原生(PaliGemma 2 或 Qwen2.5-VL) 』
- 完整 arXiv 摄入:Nougat 处理数学,VLM 处理数字──
- 监管场景:OCR管道+VLM验证器 用于交叉检查.


```figure
mm-doc-layout
```

## 使用它

`code/main.py`其他:

- 一个玩具版布局知情的代币:给定 (文字,bbox) 双,生成布局LMv3 风格输入。
- 一个小甜点风格任务方案生成器:用于表单的JSON模板.
- 比较OCR管道、甜点、Nougat 和VLM原生每页代币预算──

## 交付它

本课产出发 `outputs/skill-document-ai-stack-picker.md`△给定一个文件-AI项目 (域,规模,质量,监管),在OCR管道,OCR免费专家和VLM原生之间做选择.

## 练习

1. 你的项目每天处理1000万张发票. 哪些堆可以在不损失准确率的情况下最小化每页成本?

2. 为什么LMv3的布局在QA形式上优于纯CLIP-VLM,但在场景文字上表现较差?

3. 诺加生成拉特克斯. 提出一个VLM-原生输出在拉特克斯忠实上胜过诺加的测试用例,以及一个诺加的胜出的用例.

4. 阅读PaliGemma 2论文(Google, 2024) ―― 相比PaliGemma 1,提升文档准确率的关键训练数据新增项是什么?

5. 设计一个安全的混合管道:OCR管道 作为主要,VLM 作为二级交叉检查.

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
