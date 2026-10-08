# 混合型内存:矢量+图 + KV (Mem0)

> Mem0 (Chhikara et al., 2025) 将记忆视为三个并行存储:向量 用于语义相似性,KV 用于快速事实查找,图用于实体关系推理――一个评分层会在检查时融合三者――这是2026年外部记忆的生产标准――

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 07 (MemGPT), Phase 14 · 08 (Letta Blocks)
**Time:** ~75 minutes

## 学习目标
- 解释为什么单一存储器 (仅载体,仅图,仅KV) 不足以支代理记忆.
- 指出 Mem0的三个并行存储,以及每个存储优化目标.
- 描述 Mem0的融合评分:相关性,重要性,近期性,并解释为什么它是加权和,而不是层次结构.
- 用一个玩具级三存储记忆,其中一个.`add()`写入全部三个存储,`search()`融合结果.

## 问题
对于三类查询中的某一类,单一存储总会出错:

- **语义相似性**  上周我们谈到了代理漂移 讨论了什么?
- **事实查找** 用户电话号码是什么?KV 胜出;向量 浪费资源,图表 过于复杂――
- **关系推理**  哪些客户共享同一个发票单位?

生产环境中的代理人会在同一会议中发出全部三类查询.`add`现在,我们要去.`search`表面后,并使用评分函数融合它们.

## 概念
### 三个并行存储

关于""的说法`add(text, user_id, metadata)`时:

1. 从文本中提取候选事实 (一个 LLM 驱动的步骤)
2. 将每个事实写入向量存储器 (嵌),用于语义搜索.
3. 将每个事实写入KV商店,以 (user_id, fact_type, entity) 为关键,用于O(1) 查找。
4. 将每个事实作为打字边缘 写入图库 (Mem0g),用于关系查询.

在`search(query, user_id)`时:

1. 按嵌入式共数 返回顶-k。
2. 基于查询派生的 (user_id, type, entity) 密钥的直接命中.
3. 图库 返回可查询实体到达的子图.
4. 一个评分层融合三者.

### 聚合分数

```
score = w_relevance * relevance(q, record)
      + w_importance * importance(record)
      + w_recency * recency(record)
```

- **相关性**向量共数"",KV"精确匹配,图路重量.
- **重要性** 在写入时打标签或学习得到 ((某些事实更重要:姓名、ID、政策) 
- **近期性** 根据上次写入或读取时间的距离进行指数衰减.

权重按产品调优──聊天代理 使用更高的 `w_recency`合规代理 使用更高的 `w_importance`检查代理 使用更高的 `w_relevance`,我知道.

### 时间推理

已增加冲突检测器. 当新事实与现有边缘的矛盾时,现有边缘将被标记为无效,但不会被删除.

这是Letta的无效模式,

### 基准号码

报告了下列结果:

- **LoCoMo**长篇对话记忆:91.6
- **LongMemEval**长时间跨度 事件记忆:93.4
- **BEAM 1M**(M-代币记忆基准):64.1

对于基线的比较,完全文本 128k LLM,平面向量商店,平面KV) 都落后10+ 分.

### 范围分类

根据范围划分记忆:

- **用户记忆** 跨会议 持久化,以`user_id`为关键.
- **Session 记忆** 在一个线程内持久化.
- **Agent 记忆** 每个代理实例的状态

每次写都会选择一个范围.检查可以使用每个范围的权力跨范围.查询.不加思考地混合范围,正是助理把勃的项目告诉爱丽丝这种事故的来源.

### 这个模式很容易出错的地方

- **Embedding drift.**矢量结果在前百次查询上看起来正确,但会随着体积的增长和退化而增加.
- **KV schema creep.** `(user_id, type, entity)`似乎很简单,直到每个团队都加入了自己的团队.`type`△每季度审计类型 集合――
- **Graph explosion.**一个噪音提取器 每条消息 添加50条边缘――限制每次`add`调用图 写入数;丢弃低置信度边缘――


```figure
ae-memory-fusion
```

## 构建它
`code/main.py`用dlib 实现三存储模式:

- `VectorStore` 用简单的符号重叠相似性 作为嵌入替代性
- `KVStore` 以`(user_id, fact_type, entity)`为关键的句子.
- `GraphStore`打字边缘 (字体,关系,对象,有效)
- `Mem0` 顶层面,包含`add()`,我知道.`search()`合分和意识到范围的检索
- 一个多用户多次会议,对话题的完整追踪.

运行:

```
python3 code/main.py
```

输出会显示三条独立回忆路径,以及融合后的顶部k――修改 `main()`顶部的分数权重,观察排名如何变化──

## 使用它
- **Mem0 (Apache 2.0)** 生产就绪──可用 Postgres + Qdrant + Neo4j 自托管,也可使用管理云──
- **Letta** 三层核心/回忆/档案;自带向量和图形后台──
- **Zep** 商业替代方案,带时间KG和事实抽取.
- **Custom builds**当你需要对取器 (合规) 或合重量 (近期占主导的语音代理) 做精确控制时――

## 交付它
`outputs/skill-hybrid-memory.md`会生成一个三存储记忆架,其中连接到融合分数,范围分类和时间无效性.

## 练习
1. 将玩具级向量相似性 替换为真实嵌入模型 ((句子变换器、Ollama、OpenAI嵌入式) ⋅在合成长对话上测量回忆@10──排名会在 1000 次写入后漂移?
2. 添加时间查询:`search(query, as_of=timestamp)`只有返回此时或之前有效的记录.
3. 实现冲突检测器:如果传入事实与图表边缘 矛盾,无效 旧边缘,并同时记录两者――在 用户生活在柏林 -> 用户生活在里斯本 上测试――
4. 扩展融合得分,加入`user_feedback`维度(对检查记录点赞) ――你怎么防止游戏?
5. 阅读 Mem0文件 (`docs.mem0.ai`把玩具实现移植为`mem0`客户端调用. 在相同的20个测试查询上比较检查质量.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Hybrid memory | “Vector plus graph plus KV” | 三个并行写入的存储，在检索时融合 |
| Fact extraction | “Memory ingestion” | 将文本拆解为 (entity, relation, fact) tuples 的 LLM 步骤 |
| Fusion scoring | “Relevance ranking” | 相关性、重要性、近期性的加权和 |
| Scope | “Memory namespace” | user / session / agent，决定谁能看到什么 |
| Mem0g | “Memory graph” | 带时间有效性的 typed edges，用于关系查询 |
| Temporal invalidation | “Soft delete” | 将矛盾 edges 标记为 invalid；绝不删除 |
| Embedding drift | “Retrieval rot” | Vector 质量随 corpus 增长而下降；周期性 re-embed |

## 延伸阅读
- [Chhikara et al., Mem0 (arXiv:2504.19413)](https://arxiv.org/abs/2504.19413) 原始纸
- [Mem0 docs](https://docs.mem0.ai/platform/overview) 生产API,SDK,管理云
- [Packer et al., MemGPT (arXiv:2310.08560)](https://arxiv.org/abs/2310.08560)虚拟背景 前身
- [Letta, Memory Blocks blog](https://www.letta.com/blog/memory-blocks) 三层兄弟设计
