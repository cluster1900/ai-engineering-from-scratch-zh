---
name: find-your-level
version: 1.0.0
description: >
  交互式测验，用于将你的 AI/ML 知识水平映射到
  AI Engineering from Scratch 课程中合适的起点；该课程包含 20 个 Phase、
  260 节课。
  触发短语："我应该从哪里开始"、"找到我的水平"、"我知道什么"、
  "哪个 Phase"、"评估我的知识"、"分级测试"、"跳过前面的内容"
tags: [assessment, onboarding, curriculum, ai-engineering]
---

# 找到你的水平

你正在为 **AI Engineering from Scratch** 课程（20 个 Phase，260+ 节课）
主持一场分级测验。你的任务是判断学习者应该从哪里开始，使他们跳过已经掌握的内容，
并恰好进入挑战开始的地方。

## 测验结构

共有 5 个知识领域，每个领域 2 道题，总共 10 道题。按每轮 2 道题呈现
（每个领域一轮）。学习者回答完某一轮的两道题后，先给该领域评分，再进入下一轮。

## 评分

每道题 1 分（0 = 错误或空白，1 = 正确）。每个领域得分为 0-2。
总分范围为 0 到 10。

## 主持测验

先简短问候学习者，然后直接进入第 1 轮。每道题都使用
**AskUserQuestion**。每轮结束后，在进入下一轮之前，告诉学习者该领域的得分
（例如："数学与统计：2/2"）。点评保持简短。直到最后才解释答案。

---

### 第 1 轮 -- 数学与统计

**Q1.** 你有两个 Vector，a = [1, 2, 3] 和 b = [4, 5, 6]。它们的
dot product 是多少？

- A) 21
- B) 32
- C) 15
- D) 27

**正确：B) 32** (1*4 + 2*5 + 3*6 = 32)

**Q2.** 一枚公平硬币被抛 3 次。恰好出现 2 次正面的概率是多少？

- A) 1/4
- B) 3/8
- C) 1/2
- D) 1/8

**正确：B) 3/8** (C(3,2) * (1/2)^3 = 3/8)

---

### 第 2 轮 -- 经典 ML

**Q3.** 在一个 Classification 任务中，样本有 90% 为负类、10% 为正类，
某个模型将所有样本都预测为负类。它的 accuracy 是多少？

- A) 50%
- B) 10%
- C) 90%
- D) 0%

**正确：C) 90%**（它把所有负类都预测正确，所有正类都预测错误）

**Q4.** 以下哪一项是 Random Forest 的 hyperparameter？

- A) 学到的分裂阈值
- B) 树的数量
- C) 叶节点预测值
- D) 每个节点的 Gini impurity

**正确：B) 树的数量**

---

### 第 3 轮 -- Deep Learning

**Q5.** 在 backpropagation 过程中，chain rule 计算的是什么？

- A) 最优 learning rate
- B) Loss 相对于每个权重的 Gradient
- C) 所需层数
- D) Batch size

**正确：B) Loss 相对于每个权重的 Gradient**

**Q6.** ResNet 中的 residual connections（skip connections）主要解决什么问题？

- A) 小数据集上的 Overfitting
- B) 深层 Neural Network 中的 Vanishing gradients
- C) 数据加载缓慢
- D) 内存使用量高

**正确：B) 深层 Neural Network 中的 Vanishing gradients**

---

### 第 4 轮 -- NLP & Transformers

**Q7.** 在 Transformer 架构中，attention 机制在什么之间进行计算？

- A) Pixels 和 labels
- B) Queries、Keys 和 Values
- C) 仅 Encoder 和 Decoder
- D) 仅 Embeddings 和 positions

**正确：B) Queries、Keys 和 Values**

**Q8.** 在 fine-tuning LLM 时，LoRA (Low-Rank Adaptation) 的主要好处是什么？

- A) 它从零开始训练所有 parameters
- B) 它冻结大多数 weights，并训练小型 low-rank update matrices
- C) 它不再需要任何训练数据
- D) 它将模型大小翻倍以获得更好结果

**正确：B) 它冻结大多数 weights，并训练小型 low-rank update matrices**

---

### 第 5 轮 -- 应用 AI

**Q9.** 在 RAG (Retrieval-Augmented Generation) 系统中，LLM 生成答案之前会发生什么？

- A) 模型会在 query 上重新训练
- B) 检索相关 documents，并将其注入 prompt
- C) 用户手动选择 context
- D) 模型搜索自身 weights

**正确：B) 检索相关 documents，并将其注入 prompt**

**Q10.** 在 multi-agent 系统中，"coordinator" 或 "orchestrator" agent 的主要目的是什么？

- A) 替代所有其他 agents
- B) 分配任务、路由消息，并管理 agents 之间的协作
- C) 增加 Token 使用量
- D) 作为备用模型

**正确：B) 分配任务、路由消息，并管理 agents 之间的协作**

---

## 完成全部 5 轮后

显示各领域得分和总分：

```
数学与统计：          X/2
经典 ML：             X/2
Deep Learning：       X/2
NLP & Transformers：  X/2
应用 AI：             X/2
----------------------------
总分：                X/10
```

## 分数到入门起点的映射

| 总分 | 入门起点 | 含义 |
|-------------|-------------|---------------|
| 0-3 | Phase 1: 数学基础 | 从最基础开始 |
| 4-5 | Phase 3: Deep Learning 核心 | 你具备数学和 ML 基础 |
| 6-7 | Phase 7: Transformers 深入学习 | 你了解 DL，是时候学习 transformers 了 |
| 8-9 | Phase 11: LLM Engineering | 基础扎实，直接进入 LLM apps |
| 10 | Phase 14: Agent Engineering | 你都懂了，开始构建 agents |

## 个性化学习路径

揭示入门起点后，生成一个覆盖全部 20 个 Phase 的 markdown 表格。
根据分数确定每个 Phase 的状态。入门起点之前的 Phase 标记为 "Skip"
（学习者已经掌握该材料）。入门起点及之后的 Phase 标记为 "Do"。
如果学习者在某个领域得分为 1/2，且该领域映射到可跳过的 Phase，
则将该 Phase 标记为 "Review"，而不是 "Skip"。

用于 Review 检测的领域到 Phase 映射：
- 数学与统计 (1/2) -> 将 Phase 1 标记为 "Review"
- 经典 ML (1/2) -> 将 Phase 2 标记为 "Review"
- Deep Learning (1/2) -> 将 Phase 3 标记为 "Review"
- NLP & Transformers (1/2) -> 将 Phase 5 和 7 标记为 "Review"
- 应用 AI (1/2) -> 将 Phase 14 标记为 "Review"

从 ROADMAP.md（权威事实来源）读取时间估算。每个 Phase 标题都包含
`(~N hours)` 格式的预计小时数。解析这些值，而不是使用硬编码数字。
这能确保学习路径在估算更新时与 roadmap 保持同步。

## 输出格式

按如下方式生成表格：

```markdown
| Phase | Name | Status | Est. Hours |
|-------|------|--------|------------|
| 0 | Setup & Tooling | Skip | -- |
| 1 | Math Foundations | Review | 30 |
| 2 | ML Fundamentals | Skip | -- |
| 3 | Deep Learning Core | Do | 20 |
| ... | ... | ... | ... |
```

表格规则：
- "Skip" 的 Phase 在 hours 中显示 `--`（它们不计入总时长）
- "Review" 的 Phase 显示完整 hours（学习者应该快速浏览）
- "Do" 的 Phase 显示完整 hours
- Phase 0 (Setup & Tooling) 无论得分如何始终为 "Skip"（它是
  tooling setup，不是知识内容）
- 汇总 "Review" 和 "Do" Phase 的 hours，并在底部显示总数

表格之后，添加一句预计总量："你的个性化路径：约 X 小时，覆盖 Y 个 Phase。"

然后添加一条简短建议：应该从哪个 Phase 开始，以及根据其最薄弱领域，
首先应该关注什么。
