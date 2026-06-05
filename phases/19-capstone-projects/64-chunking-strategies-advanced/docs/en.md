# 分块策略比较

> 分块决定了检索器能看到什么。边界一旦错了，没有嵌入模型、重排器或 LLM 能在下游修好损坏。

**Type:** Build
**Languages:** Python
**Prerequisites:** 第 11 阶段课程 04（嵌入）、06（RAG）、07（高级 RAG）；第 19 阶段 B 轨基础（第 20-29 课）
**Time:** ~90 分钟

## 学习目标
- 从头开始实施五种分块策略：固定窗口、句子、递归分割、语义聚类和结构性 Markdown 标题。
- 在带有 gold-labeled answer spans 的固定语料库上衡量 recall@k，并解释为什么一种策略适合散文，另一种策略适合技术文档。
- 读取块长度分布并识别每个策略注入的故障模式：孤立句子、中间符号剪切、仅标题块、语义漂移。
- 通过检查三个属性来为新语料库选择默认值，而无需运行基准测试：文档类型、平均段落长度以及格式是否具有显式结构。

## 问题

每个 RAG 管道都会先把源文档切成片段：片段要小到能放进嵌入模型，也要大到足以承载一个独立想法。选择切分位置不是普通超参数；它决定了检索器最多能返回什么。

只有当保存中止阈值的 chunk 可达时，询问“预算中止阈值是什么样的”的查询才会成功。如果固定窗口切分器把阈值从周围上下文中剥离出来，嵌入会移动到另一个簇，BM25 分数会下降，重排器看到的是噪声，LLM 生成的答案也会出错。2024 年论文 “LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs” 测得，仅分块选择就会带来 35% 的检索 recall 绝对波动。2025 年关于 contextual chunk headers 的后续工作缩小了这个差距，但没有消除它。

本课程并排构建五种策略，把它们跑在带有 gold-labeled answer spans 的固定语料库上，并让你自己阅读 recall 数字。

## 概念

```mermaid
flowchart LR
  Doc[Source Document] --> S1[Fixed Window]
  Doc --> S2[Sentence]
  Doc --> S3[Recursive Split]
  Doc --> S4[Semantic Cluster]
  Doc --> S5[Structural Markdown]
  S1 --> Chunks1[Chunks]
  S2 --> Chunks2[Chunks]
  S3 --> Chunks3[Chunks]
  S4 --> Chunks4[Chunks]
  S5 --> Chunks5[Chunks]
  Chunks1 --> Index[Embedding Index]
  Chunks2 --> Index
  Chunks3 --> Index
  Chunks4 --> Index
  Chunks5 --> Index
  Index --> Eval[Recall@k vs Gold Spans]
```

### 固定窗口

蛮力基线。每 N 个字符被剪切一次。可选地重叠，以便在位置 N 处剪切的句子完整地出现在从位置 N 开始的块内 - 重叠。快速、确定性、边界糟糕。将其用作控件，而不是默认值。

### 句子

使用正则表达式或简单的状态机分割句子边界。将一个或多个句子打包成一个块，直至达到目标字符预算。停止在单词中间进行剪切。仍然剪掉中段和中节。许多早期 RAG 管道中的默认设置，也是没有其他结构的散文的合理选择。

### 递归分割

2023 年图书馆流行的层次结构策略。尝试首先分割最强的分隔符（双换行符、段落），然后退回到下一个（单换行符），然后分割到句子，然后分割到字符。当块符合预算时，递归终止。非常适合结构不一致的文档，因为它会根据区域进行调整。

### 语义聚类

嵌入每个句子。将共享主题质心的连续句子聚类。每当与质心的运行相似度下降到阈值以下时就进行切割。边界反映的是含义，而不是字符。构建速度较慢并且依赖于嵌入模型，但对于在段落内切换主题的文档具有弹性。

### 结构化 Markdown 标题

对于具有明确结构（Markdown、reStructuredText、RFC 样式编号 section）的文档，请在标题边界处进行切分。每个 chunk 都包含标题及其下面的所有内容，一直到相同或更高级别的下一个标题。这样能得到每个主题的最小 chunk，但只在语料库结构良好时可用。

### recall@k 如何衡量边界选择

黄金token 的查询携带源文档内答案范围的精确字符偏移量。分块后，您会问：检索器返回的前 k 个块是否与黄金跨度重叠？如果是，则该查询的recall@k 为1。如果否，则为0。整个查询集的平均值。对每个策略运行相同的评估，分布会向您显示哪个边界策略在您拥有的语料库中幸存下来。

## 构建它

`code/main.py` 实现：

- `fixed_window(text, size, overlap)` - 基线。
- `sentence_chunks(text, target)` - 简单句子打包器。
- `recursive_split(text, separators, target)` - 分层递归。
- `semantic_chunks(text, similarity_threshold)` - 在确定性模拟嵌入之上基于质心的聚类。
- `structural_markdown(text)` - 标头感知分离器。
- `mock_embed(text, dim)` - 基于哈希的嵌入，因此循环可以离线运行。
- `DenseIndex` - 与第 19 阶段轨道 B 的混合检索课程中使用的形状相同。
- `eval_recall(strategy, corpus, queries, k)` - 比较循环。
- `main()`，在 fixture 语料库上运行每个策略并打印 recall@k 表。

运行它：

```bash
python3 code/main.py
```

输出是一个小表，每个策略一行，每个 k 一列。句子策略在结构化 fixture 上失败。结构化 Markdown 在 Markdown fixture 上获胜。递归策略在混合 fixture 上有一席之地，因为递归会自适应。语义聚类在没有有用结构线索的散文 fixture 上获胜。

## 表中不会隐藏故障模式

**孤立句子。** 句子打包会产生错过主题句的块。然后嵌入指向错误的簇。

**中间符号剪切。** 代码或 YAML 内的固定窗口会将标识符分成两半。两半嵌入噪声。

**仅包含标题的 chunk。** 结构化 Markdown 会发出只包含 `## Title` 的 chunk。过滤掉这些内容，或附加下一个 chunk 的第一段。

**语义漂移。** 当语料库一致关注主题时，语义聚类就会削弱。 5000 个字符的块将许多具体答案打包到一个分散嵌入中。将语义与硬字符上限相结合。

**过时的嵌入。** 语义聚类使用嵌入模型。如果更改模型，您也会更改块。将块模型与检索模型分开固定，或者一起重建索引。

## 选择默认值而不运行基准测试

三个属性决定新语料库的默认分块器。

|属性 |值|默认|
|----------|-------|---------|
|文件类型|没有结构的散文 |递归分割，目标 800 |
|文件类型| Markdown / RFC / API 文档 |结构化 Markdown |
|文件类型|代码| AST 感知（超出范围；请参阅第 19 阶段第 02 课）|
|段落长度|长而单一的主题 |句子，目标500 |
|段落长度|简短、混合的主题 |语义，阈值 0.6 |

如有疑问，请选择递归拆分。它是最强的单一策略基线。

## 使用它

生产模式：

- 在发布新管道之前运行评估；不要相信您的图书馆默认的策略。
- 每当您更改嵌入模型或语料库组合时，请重新运行评估；获胜者取决于语料库。
- 将策略名称保留在每个块的元数据中，以便您稍后可以归因回归。

## 发货

第 69 课中的 Track F 端到端 RAG 系统使用此处选择的分块器作为其第一阶段。第 68 课中的评估工具从本课中 `eval_recall` 返回的相同形状中读取recall@k。选择在你的语料库中获胜的策略并将其向前推进。

## 练习

1. 添加第六种策略：使用 `tiktoken` 而不是字符计数的 token-window。与同一fixture上的固定窗口进行比较。
2. 将 30% 的代码块注入散文 fixture 中。重新运行该表。解释为什么除了结构化 Markdown 之外的所有策略都损失了 recall。
3. 将确定性嵌入替换为来自项目真实提供商的确定性嵌入。测量语义聚类召回增量。报告策略之间的价差是扩大还是缩小。
4.为每个块​​添加一个`summary`字段：一个句子质心描述。重新运行 eval，并将摘要附加到块主体。测量召回提升。

## 关键术语

|术语 |人们怎么说|它实际上意味着什么 |
|------|-----------------|------------------------|
|recall@k | “我们拿到正确 chunk 了吗？” |任何前 k 个 chunk 与 gold answer span 重叠的查询比例 |
|块重叠| “滑动窗口”|将前一个块的最后 N 个字符重新包含在下一个块中 |
|结构分割器| “标题感知块” |在 H1/H2/H3 边界处切分；标题文本也是 chunk 的一部分 |
|语义分块器 | “主题感知块” |嵌入句子、按质心相似度聚类、漂移剪切 |
|质心漂移| 「话题转移」|运行平均值与下一个句子之间的余弦相似度下降超过阈值 |

## 进一步阅读

- [LongRAG: Enhancing Retrieval-Augmented Generation with Long-context LLMs (arXiv 2406.15319)](https://arxiv.org/abs/2406.15319)
- [人择、上下文检索](https://www.anthropic.com/news/contextual-retrieval)
- [LlamaIndex，生产组块策略 RAG](https://docs.llamaindex.ai/en/stable/optimizing/production_rag/)
- 第 11 阶段第 06 课 - RAG 基础知识
- 第 11 阶段第 07 课 - 高级 RAG
- 第 19 阶段第 65 课 - 对此处生成的块进行排名的混合检索
- 第 19 阶段第 68 课 - 对生产中的策略选择进行评分的评估工具
