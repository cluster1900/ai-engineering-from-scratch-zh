---
name: find-your-level
version: 1.0.0
description: >
  通过交互式测验，将你的 AI/ML 知识映射到包含 511 节课、
  20 个阶段的 AI Engineering from Scratch 课程起点。
  触发短语："where should I start"、"find my level"、"what do I know"、
  "which phase"、"assess my knowledge"、"placement test"、"skip ahead"
tags: [assessment, onboarding, curriculum, ai-engineering]
---

# 找到你的水平

你正在为 **AI Engineering from Scratch** 课程（20 个阶段、511 节课）
主持入门水平测验。你的任务是确定学习者应从哪里开始，使其跳过已经掌握的内容，
直接进入开始具有挑战性的部分。适用于任何 Agent。

## 测验结构

共有 5 个知识领域，每个领域 2 道题，总计 10 道题。分 5 轮进行，
每轮包含 2 道题（每个领域一轮）。学习者回答完一轮中的两道题后，
先对该领域评分，再进入下一轮。

## 评分

每道题 1 分（0 = 错误或未作答，1 = 正确）。每个领域得分为 0-2 分。
总分范围为 0-10 分。

## 主持测验

先简短问候学习者，然后直接进入第 1 轮。如果你的环境提供结构化的
问题/选项 Tool，请对每道题使用它；否则，以纯文本形式展示带字母编号的选项，
并等待回复。每轮结束后，先告知学习者该领域的得分
（例如“数学与统计：2/2”），再进入下一轮。说明应保持简短。
直到最后才解释答案。

---

### 第 1 轮——数学与统计

**Q1.** 有两个 Vector，a = [1, 2, 3] 和 b = [4, 5, 6]。
它们的 Dot Product 是多少？

- A) 21
- B) 32
- C) 15
- D) 27

**正确答案：B) 32** (1*4 + 2*5 + 3*6 = 32)

**Q2.** 将一枚均匀硬币抛掷 3 次。恰好出现 2 次正面的 Probability 是多少？

- A) 1/4
- B) 3/8
- C) 1/2
- D) 1/8

**正确答案：B) 3/8** (C(3,2) * (1/2)^3 = 3/8)

---

### 第 2 轮——经典 ML

**Q3.** 在一项 Classification 任务中，负样本占 90%，正样本占 10%。
某个 Model 将所有样本都预测为负样本。它的准确率是多少？

- A) 50%
- B) 10%
- C) 90%
- D) 0%

**正确答案：C) 90%**（所有负样本都预测正确，所有正样本都预测错误）

**Q4.** 以下哪一项是 Random Forest 的 Hyperparameter？

- A) 学习得到的分割阈值
- B) 树的数量
- C) 叶节点预测结果
- D) 每个节点的 Gini impurity

**正确答案：B) 树的数量**

---

### 第 3 轮——Deep Learning

**Q5.** 在 Backpropagation 过程中，Chain Rule 计算什么？

- A) 最优学习率
- B) Loss 相对于每个权重的 Gradient
- C) 所需的层数
- D) Batch 大小

**正确答案：B) Loss 相对于每个权重的 Gradient**

**Q6.** ResNet 中的残差连接（跳跃连接）主要解决什么问题？

- A) 在小型 Dataset 上过拟合
- B) 深层网络中的 Gradient 消失
- C) 数据加载缓慢
- D) 内存使用量过高

**正确答案：B) 深层网络中的 Gradient 消失**

---

### 第 4 轮——NLP 与 Transformer

**Q7.** 在 Transformer 架构中，Attention 计算发生在哪些对象之间？

- A) 像素与 Label
- B) Queries、Keys 和 Values
- C) 仅 Encoder 与 Decoder
- D) 仅 Embedding 与位置

**正确答案：B) Queries、Keys 和 Values**

**Q8.** 对 LLM 进行 Fine-tuning 时，LoRA（Low-Rank Adaptation）
的主要优势是什么？

- A) 从头开始 Training 所有参数
- B) 冻结大部分权重，只 Training 小型低秩更新 Matrix
- C) 完全不再需要 Training 数据
- D) 将 Model 大小翻倍以获得更好的结果

**正确答案：B) 冻结大部分权重，只 Training 小型低秩更新 Matrix**

---

### 第 5 轮——应用 AI

**Q9.** 在 RAG（Retrieval-Augmented Generation）系统中，
LLM 生成答案之前会发生什么？

- A) 使用查询重新 Training Model
- B) 检索相关文档并将其注入 Prompt
- C) 用户手动选择 Context
- D) Model 搜索自身权重

**正确答案：B) 检索相关文档并将其注入 Prompt**

**Q10.** 在 multi-Agent 系统中，“coordinator”或“orchestrator”
Agent 的主要用途是什么？

- A) 替代所有其他 Agent
- B) 分配任务、路由消息并管理 Agent 协作
- C) 增加 Token 使用量
- D) 充当备用 Model

**正确答案：B) 分配任务、路由消息并管理 Agent 协作**

---

## 完成全部 5 轮之后

显示各领域得分和总分：

```text
数学与统计：           X/2
经典 ML：              X/2
Deep Learning：        X/2
NLP 与 Transformer：   X/2
应用 AI：              X/2
----------------------------
总分：                 X/10
```

## 分数与起点映射

| 总分 | 起点 | 含义 |
|-------------|-------------|---------------|
| 0-3 | 阶段 1：数学基础 | 从基础开始 |
| 4-5 | 阶段 3：Deep Learning 核心 | 你已具备数学和 ML 基础 |
| 6-7 | 阶段 7：深入理解 Transformer | 你已掌握 Deep Learning，是时候学习 Transformer 了 |
| 8-9 | 阶段 11：LLM Engineering | 基础扎实，直接进入 LLM 应用 |
| 10 | 阶段 14：Agent Engineering | 你已全部掌握，可以构建 Agent |

## 个性化学习路径

公布起点后，生成一张涵盖全部 20 个阶段的 Markdown 表格。
根据得分确定每个阶段的状态。起点之前的阶段标记为“跳过”
（学习者已经掌握相关内容）。起点及之后的阶段标记为“学习”。
如果学习者在对应某个可跳过阶段的领域中得分为 1/2，
则将该阶段标记为“复习”，而不是“跳过”。

用于判断是否需要复习的领域与阶段映射：
- 数学与统计（1/2）-> 将阶段 1 标记为“复习”
- 经典 ML（1/2）-> 将阶段 2 标记为“复习”
- Deep Learning（1/2）-> 将阶段 3 标记为“复习”
- NLP 与 Transformer（1/2）-> 将阶段 5 和阶段 7 标记为“复习”
- 应用 AI（1/2）-> 将阶段 14 标记为“复习”

从 ROADMAP.md（规范事实来源）读取时间估算。每个阶段标题都以
`(~N hours)` 格式包含预计小时数。解析这些值，不要使用硬编码数字。
这样可确保在路线图的估算更新后，学习路径仍与其保持同步。如果本地未克隆 repo，
请从以下地址获取：
`https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/ROADMAP.md`。

## 输出格式

按以下格式生成表格：

```markdown
| 阶段 | 名称 | 状态 | 预计小时数 |
|-------|------|--------|------------|
| 0 | 设置与工具 | 跳过 | -- |
| 1 | 数学基础 | 复习 | 30 |
| 2 | ML 基础 | 跳过 | -- |
| 3 | Deep Learning 核心 | 学习 | 20 |
| ... | ... | ... | ... |
```

表格规则：
- 状态为“跳过”的阶段，其小时数显示为 `--`（不计入总时间）
- 状态为“复习”的阶段显示完整小时数（学习者应快速浏览）
- 状态为“学习”的阶段显示完整小时数
- 无论得分如何，阶段 0（设置与工具）始终为“跳过”
  （它是工具设置，不是知识内容）
- 汇总状态为“复习”和“学习”的阶段所需小时数，并在底部显示总时间

表格之后，添加一句预计总时间：“你的个性化路径：Y 个阶段，共约 X 小时。”

然后添加一条简短建议：应从哪个阶段开始，以及根据其最薄弱的领域，
首先应重点学习什么。

最后，提供下一步操作：`/start-learning` 会将此次水平评估保存到持久化的
`LEARNING.md` 学习计划中，`/learn` 则会以交互方式开始教授第一节课。
