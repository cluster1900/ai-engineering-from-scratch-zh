# 科尔帕利与视觉原生文件RAG

> 传统RAG会把PDF解析成文本,切成块,嵌入块,并存储矢量──每一步都会丢失信号:OCR会丢失图表数据,切断表列,文字嵌入会忽略数字──ColPali(Faysse等,2024年7月) 提出了一个更简单的问题:为什么必须提取文本?直接通过PaliGemma对页面图像做嵌入,使用ColBERT式的晚交互做取,并保留档案带来的所有布局,图像,字体和格式化信号──发布已有的标志显示:在视觉丰富的文档上,结尾准确度比高高RAG高20%-40%──ColQwenS 和ColRAG 展现这一模式──阅读本书阅读,构建一个微型文档,并构建一个微型文档的视觉.

**Type:** Build
**Languages:** Python (stdlib, multi-vector indexer + MaxSim scorer)
**先修要求：**第十一阶段 (LLM工程  RAG 基础),第十二阶段 · 05 (LLaVA)
**Time:** ~180 minutes

## 学习目标

- 解释双编码检索 (每个文档一个向量) 和晚交互检索 (每个文档多个向量) 的区别.
- 描述ColBERT的MaxSim操作以及ColPali如何将它从文字代币泛化到图像补丁.
- 构建一个微型 ColPali类似索引:页面 →补丁嵌入 →查询术语嵌入 上的 MaxSim →顶级k页面──
- 比较账单/财务报告使用例 中的 ColPali + Qwen2.5-VL发电机与文字-RAG + GPT-4──

## 问题

文件上文 - RAG 会丢失文件大部分信息――财务报告第三季度收入增长通常在图表中;医疗报告的结果在注释图片中;法律合同的签名区块是布局事实,而不是文本事实――

文字-RAG管道:

1. 通过OCR/pdftotext的文件.
2. 文字 → 300-500个代币块──
3. 部分 → 双编码器嵌入 (一个向量)
4. 用户查询 → 嵌入 → 合数相似 → 顶部k块──
5. 士+查询 → LLM──

五个有损步骤――图表 捕获不到――表格 被断片 打断――多列布局 被展平――图形注释 消失――

ColPali 的修复方式:跳过OCR,直接对页面图像做嵌入式──使用ColBERT式的晚间交互做检索,让模型在查询时间关注细粒度补丁──

## 概念

### 科尔伯特 (2020)

科尔伯特 (Khattab & Zaharia, arXiv:2004.12832) 是一种文本检索方法. 它不是为每一个文档生成一个向量,而是为每一个代币生成一个向量.

- 查询代币 获得各自的嵌入式向量)
- 文件代币 获得嵌入式向量,通常会缓存)
- 评分 = 对查询代币求和,每个查询代币取所有文档代币 中 cosine相似性的最大值:Σ_i max_j cos(q_i,d_j) 』

这就是MaxSim操作.每个查询代币会选择最匹配的文档代币.最终的分数是这些值的总和.

优点:回忆强,能处理术语级语义――缺点:每个文档需要N_d向量,存储昂贵――

### 鱼

们的图像是很像的.

- 每一页由PaliGemma(ViT +语言)编码为补丁嵌入:每页 N_p 矢量──
- 每个用户查询 (文字) 被编码为查询标志嵌入:N_q 矢量.
- 评分 = Σ_i max_j cos(q_i, p_j),也就是在查询文本标记和页面图像补丁上做MaxSim。
- 通过总分数检索的顶级页面.

在文件吞时间:用PaliGemma对每页做嵌入,存储所有补丁嵌入. 在查询时间:对查询代币做嵌入,对所有已存储的页面嵌入 计算MaxSim,返回顶级k页面.

优点:在视觉丰富的文档上,端到端比文本RAG高20-40%──每个补丁向量 捕获局部布局和内容──

缺点:每页 N_p 补丁 × 4 字节浮动 × D-dim 矢量 = 存储 增长很快――可通过 PQ / OPQ 量化缓解――

### 素和素

文2 (Illumin-tech, 2024-2025) 将将PaliGemma 替换为Qwen2-VL──基码更好,恢复更好──

 ColSmol 是用于本地/边缘使用的较小规模变体.

### 皮

视RAG(Yu等, arXiv:2410.10594) 是另一种变化:不是在补丁上做MaxSim,而是使用VLM将每个页面池成一个向量,然后做双编码检索――索引更快,存储更小,但回忆更弱――

质量优先使用ColPali,规模优先使用VISRAG──

### 其他类型

通过多页多页多页文件推理,并为VLM 组合多页文本背景.

### 维多尔基准

任务包括财务报告,科学论文,行政文件,医疗记录,手册.

根据"维多利亚"的统计数据,

### 终端到终端的RAG管道

对于视力原生RAG:

1. 摄取:PDF → 页面图像 → PaliGemma编码 → 存储所有补丁嵌入式──
2. 查询:用户文本 →查询标志嵌入 → 对所有已索引页面执行 MaxSim → top-k 页面──
3. 生成:上面图像 +查询 → VLM(Qwen2.5-VL或Claude)→ 答案。

全程没有OCR──图形,图表,字体,布局 全部流入答案──

### 存储数量

一份50页的财务报告,每页729个补丁,128维嵌入式:

- 色:50 * 729 * 128 * 4字节 = ~18 MB原始,PQ 后 ~4 MB──
- 文字-RAG:50块 * 768-dim * 4字节 = ~150kB──

在规模化场景中,OPQ/PQ可降至5-10x左右,通常可以接受.

### 文字-RAG 仍然胜出的场景

- 没有布局信号的纯文本文档(wiki文章、聊天日志) ――文本-RAG 更简单,存储 更便宜――
- 存储主导成本的数百万页档案.
- 严格监管要求在检索边保留可提取的OCR文本.

对于2026年其他场景,即财务报告,科学论文,法律合同,医疗记录,UX文档,视野原生RAG 胜出──


```figure
mm-maxsim
```

## 使用它

`code/main.py`其他:

- 玩具补丁编码器:将一个"页面" (小型特征向量) 映射为补丁嵌入阵列.
- 计算查询代币嵌入集 和页面补丁集 之间的ColBERT风格分数──
- 索引5个玩具页面,运行3个查询,并返回带得分的顶级k。

## 交付它

本课会产出 `outputs/skill-vision-rag-designer.md`△给定一个文件-RAG 项目,选择 ColPali / ColQwen2 / VisRAG / 文本-RAG,并估算存储──

## 练习

1. 一份200页的年度报告,每页729个补丁,128-dimemb,4字节浮游物――计算原料存储和PQ压缩的存储――8x

2. 求和捕获了哪些简单的平均相似性 捕获未到的信息?

3. 如果改为字面级建索引,就像ColBERT一样,会发生什么变化?有什么交易?

4. 为一个1M页的体积 设计端到端管道,询问延迟预算 为500ms──选择 ColQwen2 / VisRAG 并说明原因──

5. 阅读M3DocRAG(arXiv:2411.04952) 描述多页的注意力模式,以及它与单页的ColPali检索的区别.

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
