# ASCII Art 与 Visual Jailbreaks

> Jiang, Xu, Niu, Xiang, Ramasubramanian, Li, Poovendran, "ArtPrompt: ASCII Art-based Jailbreak Attacks against Aligned LLMs" (ACL 2024, arXiv:2402.11753)。在有害请求中遮蔽与安全相关的 Token，用相同字母的 ASCII-art 渲染替换它们，然后发送这个伪装后的 prompt。GPT-3.5、GPT-4、Gemini、Claude、Llama-2 都无法稳健识别 ASCII-art Token。该攻击绕过 PPL（perplexity filters）、Paraphrase 防御和 Retokenization。相关：ViTC benchmark 衡量对非语义视觉 prompt 的识别能力；StructuralSleight 将其泛化为 Uncommon Text-Encoded Structures（树、图、嵌套 JSON）这一类编码攻击。

**类型：** Build
**语言：** Python (stdlib, ArtPrompt token-masking harness)
**前置要求：** Phase 18 · 12 (PAIR), Phase 18 · 13 (MSJ)
**时间：** 约 60 分钟

## 学习目标

- 描述 ArtPrompt 攻击：word-identification 步骤、ASCII-art 替换、最终伪装后的 prompt。
- 解释为什么标准防御（PPL、Paraphrase、Retokenization）会在 ArtPrompt 上失败。
- 定义 ViTC，并描述它衡量什么。
- 将 StructuralSleight 描述为向任意 Uncommon Text-Encoded Structures 的泛化。

## 问题

通过 paraphrase 和 roleplay（Lesson 12）以及通过 long context（Lesson 13）的攻击，作用于文本层面的模式。ArtPrompt 作用于识别层面：模型没有解析被禁止的 Token。它解析的是由字符渲染出的图像。安全过滤器看到的是无害的标点。模型看到的是一个词。

## 概念

### ArtPrompt，两步

Step 1. Word Identification。给定一个有害请求，攻击者使用一个 LLM 来识别与安全相关的词（例如，"how to make a bomb" 中的 "bomb"）。

Step 2. Cloaked Prompt Generation。将每个识别出的词替换为它的 ASCII-art 渲染（由字符组成字母形状的 7x5 或 7x7 块）。模型收到的是由标点和空格组成的网格，一个能力足够强的模型可以把它识别为这个词；安全过滤器只看到这个网格。

结果：GPT-4、Gemini、Claude、Llama-2、GPT-3.5 全部失败。在他们的 benchmark 子集上，攻击成功率超过 75%。

### 为什么标准防御会失败

- **PPL（perplexity filter）。** ASCII art 具有高 perplexity，但所有新颖输入也是如此。能够阻止 ArtPrompt 的阈值选择，也会阻止合法的结构化输入。
- **Paraphrase。** 对 prompt 做 paraphrase 会破坏 ASCII art。在实践中，paraphrase LLMs 往往会保留或重建这些 art。
- **Retokenization。** 以不同方式拆分 Token，并不会改变模型的视觉识别正在识别字母形状这一点。

根本问题在于，安全过滤器处于 Token 或语义层面；ArtPrompt 作用于视觉识别层面。

### ViTC benchmark

识别非语义视觉 prompt。衡量模型读取 ASCII-art、wingdings 和其他非文本语义视觉内容的能力。ArtPrompt 的有效性与 ViTC accuracy 相关：模型越擅长读取视觉文本，ArtPrompt 在它上面越有效。这是一种能力与安全的权衡。

### StructuralSleight

泛化 ArtPrompt：Uncommon Text-Encoded Structures（UTES）。树、图、嵌套 JSON、CSV-in-JSON、diff-style code blocks。如果某种结构在安全训练数据中罕见，但可被模型解析，它就可以隐藏有害内容。

防御含义：安全必须能泛化到模型可解析的结构化表示。这个集合很大，而且还在增长。

### Image-modality 类比

Visual LLMs（GPT-5.2、Gemini 3 Pro、Claude Opus 4.5、Grok 4.1）扩展了攻击面。使用真实图像的 ArtPrompt-style 攻击比 ASCII-art 类比更强，因为 image encoders 会产生更丰富的信号。

### 它在 Phase 18 中的位置

Lessons 12-14 描述了三种正交攻击Vector：迭代 refinement（PAIR）、context length（MSJ）和 encoding（ArtPrompt/StructuralSleight）。Lesson 15 从以模型为中心的攻击转向系统边界攻击（indirect prompt injection）。Lesson 16 描述防御工具响应。

## 使用它

`code/main.py` 构建一个 toy ArtPrompt。你可以用 ASCII-art glyphs 伪装有害 query 中的特定词，验证伪装后的字符串能通过 keyword filter，并且（可选）用简单 recognizer 将伪装后的字符串解码回来。

## 交付它

本课会产出 `outputs/skill-encoding-audit.md`。给定一份 jailbreak-defense report，它会枚举覆盖到的编码攻击家族（ASCII art、base64、leet-speak、UTF-8 homoglyph、UTES）以及捕获每类攻击的防御层。

## 练习

1. 运行 `code/main.py`。验证伪装后的字符串能通过简单 keyword filter。报告所需的字符级变更。

2. 实现第二种编码：对同一个目标词使用 base64。比较它相对 ArtPrompt 的 filter-bypass rate 和恢复难度。

3. 阅读 Jiang et al. 2024 Section 4.3（五模型结果）。提出一个原因，解释为什么 Claude 在同一 benchmark 上的 ArtPrompt-resistance 高于 Gemini。

4. 设计一个 pre-generation 防御，用于检测 prompt 中 ASCII-art-shaped 区域。在合法代码、表格和数学记号上衡量 false-positive rate。

5. StructuralSleight 列出了 10 种编码结构。草拟一个能处理全部 10 种结构的泛化防御，并估算每个被防护 prompt 的 compute cost。

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|-----------------|------------------------|
| ArtPrompt | "ASCII-art attack" | 使用 ASCII-art 渲染遮蔽安全词的两步 jailbreak |
| Cloaking | "隐藏这个词" | 用模型能读取但过滤器读不到的视觉表示替换被禁止的 Token |
| UTES | "不常见结构" | Uncommon Text-Encoded Structure — 树、图、嵌套 JSON 等，用于夹带内容 |
| ViTC | "visual-text capability" | 衡量模型读取非语义视觉编码能力的 benchmark |
| Perplexity filter | "PPL defense" | 拒绝高 perplexity 的 prompt；会失败，因为合法结构化输入也会得到高分 |
| Retokenization | "tokenizer shift defense" | 用不同的 Tokenizer 预处理 prompt；会失败，因为识别是视觉层面的 |
| Homoglyph | "外观相似字符" | 看起来与拉丁字母相同的 Unicode 字符；绕过 substring 检查 |

## 延伸阅读

- [Jiang et al. — ArtPrompt (ACL 2024, arXiv:2402.11753)](https://arxiv.org/abs/2402.11753) — ASCII-art jailbreak 论文
- [Li et al. — StructuralSleight (arXiv:2406.08754)](https://arxiv.org/abs/2406.08754) — UTES 泛化
- [Chao et al. — PAIR (Lesson 12, arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) — 互补的迭代攻击
- [Anil et al. — Many-shot Jailbreaking (Lesson 13)](https://www.anthropic.com/research/many-shot-jailbreaking) — 互补的长度攻击
