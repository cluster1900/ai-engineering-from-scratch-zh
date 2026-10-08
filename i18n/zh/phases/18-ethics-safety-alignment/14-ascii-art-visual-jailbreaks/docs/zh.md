# 亚斯基艺术与视觉监狱破裂

> 江,徐,纽,,拉马苏布拉曼尼,李,普韦德兰, "艺术提示:ASCII艺术基于Jilbreak攻击对一致的LLM" (ACL 2024, arXiv:2402.11753) ⋅在有害请求中遮蔽与安全相关的标记,使用相同字母的ASCII艺术染色替换它们,然后发送这个伪装后的提示──GPT-3.5GPT-4、Gemini、Claude、Llama-2 都无法稳健识别ASCII艺术标记──该攻击绕过PPL的复杂性过器──语防御和相关的机械化──:ViTC语标识 衡量非感觉视觉识别能力;SightSight泛其它套件将编码类型的编码编码,编码的编码.

**类型：**建立
**语言：**字符串 (stdlib,ArtPrompt代币掩盖带)
**前置要求：**阶段18·12 (PAIR),阶段18·13 (MSJ)
**时间：**约60分钟

## 学习目标

- 描述ArtPrompt 攻击:字符识别步骤、ASCII-art 替换、最终伪装后的提示──
- 解释为什么标准防御(PPL、语、重复化) 会在ArtPrompt上失败.
- 定义ViTC,并描述它衡量什么.
- 将 StructuralSleight 描述为向任意不常见的文本编码结构的泛化.

## 问题

通过抛词和角色扮演 (Lection 12) 以及通过长文本 (Lesson 13) 的攻击,作用于文本层面的模式――艺术简单作用于识别层面:模型没有解析被禁止的标志――它解析的是由字符染色的图像――安全过器看到的是无害的标志点――模型看到的是一个词――

## 概念

### 艺术即兴,两步

步骤 1. 词识别――给定一个有害的请求,攻击者使用一个LLM来识别与安全相关的词语(例如",如何制造炸弹"中的"炸弹")

步骤 2. 掩盖的即时生成――将每个识别出来的词被替换为它的ASCII艺术染(由字符组成字母形状的7x5或7x7块) ――模型收到的是由标记和空格组成的网格,一个能力足够强大的模型可以把它识别为这个词;安全过器只看到这个网格――

结果:GPT-4、Gemini、Claude、Llama-2、GPT-3.5 全部失败──在他们的基准子集上,攻击成功率超过75%──

### 为什么标准防守会失败

- **PPL（perplexity filter）。**亚斯基艺术具有高度的困惑,但所有新输入也是如此.
- **Paraphrase。**为了快速做出抛物线会破坏ASCII艺术.
- **Retokenization。**以不同方式分开标志,不会改变模型的视觉识别正在识别字母形状这一点.

根本问题在于,安全过器在代币或语义层面;ArtPrompt 作用于视觉识别层面.

### 维特证指标

识别非语义视觉提示――衡量模型读取ASCII-艺术、翼dings 和其他非文本语义视觉内容的能力――ArtPrompt的有效性与ViTC准确性相关:模型越擅长读取视觉文本,ArtPrompt在上面越有效――这是能力和安全的衡量――

### 结构性

泛化 ArtPrompt:不常见的文本编码结构 (UTES) ⋅树、图、嵌套 JSON、CSV-in-JSON、不同式代码块──如果某种结构在安全训练数据中很罕见,但可被模型解析,它可以隐藏有害内容──

防御含义:安全必须能泛化到可解析模型的结构化表示.

### 图像模式类比

视觉LLM (GPT-5.2、Gemini 3 Pro、Claude Opus 4.5、Grok 4.1) 扩大了攻击面──使用真实图像的ArtPrompt风格攻击比ASCII艺术类比更强,因为图像编码器会产生更丰富的信号──

### 它位于18阶段的位置.

课时12-14 描述三种正交攻击 矢量:代精炼 (PAIR) 文本长度 (MSJ) 和编码 (ArtPrompt/StructuralSleight) 课时15 从模型为中心的攻击转向系统边界攻击 (系统边界攻击) 课时16 描述防御工具响应 (?? 简直的即时注射)


```figure
al-ascii-cloak
```

## 使用它

`code/main.py`构建一个玩具ArtPrompt──你可以使用ASCII-art glyphs 伪装有害查询 中的特定词,验证伪装后的字符串能通过关键字过器,并且(可选) 使用简单的识别器将伪装后的字符解码回来──

## 交付它

本课会产出 `outputs/skill-encoding-audit.md`提供一个 jailbreak防守报告,它将举个覆盖到编码攻击家族的ASCII艺术64基础, 带语,UTF-8同形字符,UTES) 以及捕获每类攻击的防守层.

## 练习

1. 运行`code/main.py`△验证伪装后的字符串可通过简单的关键字过器──报告所需的字符级变化──

2. 实现第二种编码:对同一个目标词使用基础64──比较它对 ArtPrompt的过绕行率和恢复难度──

3. 阅读江等人2024 第4.3节 ((五模型结果) 』提出一个原因,解释为什么克劳德在同一基准上的ArtPrompt-resistance高于双子座――

4. 设计一个预代 防御,用于检测提示 中 ASCII-艺术形状 区域──在合法代码、表格和数学记号上测量虚假阳性率──

5. 结构性Sleight列出了10种编码结构. 拟定一个能够处理全部10种结构的泛化防御,并估计每个被保护的提示的计算成本.

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

- [Jiang et al. — ArtPrompt (ACL 2024, arXiv:2402.11753)](https://arxiv.org/abs/2402.11753)              
- [Li et al. — StructuralSleight (arXiv:2406.08754)](https://arxiv.org/abs/2406.08754) UTES 泛化
- [Chao et al. — PAIR (Lesson 12, arXiv:2310.08419)](https://arxiv.org/abs/2310.08419)互补的代攻击
- [Anil et al. — Many-shot Jailbreaking (Lesson 13)](https://www.anthropic.com/research/many-shot-jailbreaking) 互补的长度攻击
