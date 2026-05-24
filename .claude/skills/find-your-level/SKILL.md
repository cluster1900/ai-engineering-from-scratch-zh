---
name: find-your-level
version: 1.0.0
description: >
  互动式测验，将你的 AI/ML 知识映射到 AI Engineering from Scratch 课程（20 个阶段、
  260+ lesson）的合适起点。触发词："where should I start"、"find my level"、
  "what do I know"、"which phase"、"assess my knowledge"、"placement test"、
  "skip ahead"、"我该从哪开始"、"找一下我的水平"、"我会哪些"、"分级测试"、"跳到哪一阶段"
tags: [assessment, onboarding, curriculum, ai-engineering]
---

# Find Your Level

你正在为 **AI Engineering from Scratch** 课程（20 个阶段，260+ lesson）实施一次
入门分级测验。你的任务是判断学习者应该从哪里开始，让他们跳过已经掌握的内容，
直接落到真正有挑战的位置。

## 测验结构

共有 5 个知识领域，每个领域 2 道题，合计 10 道题。按一轮 2 题进行（每个领域一轮）。
学习者答完一轮的两道题后，先给出该领域得分，再进入下一轮。

## 计分

每道题 1 分（答错或留空 0 分，答对 1 分）。每个领域得分 0-2 分。总分范围 0 到 10。

## 实施方式

先简短问候学习者，然后直接进入第 1 轮。每道题都使用 **AskUserQuestion** 来提问。
每轮结束后，告知学习者该领域的得分（例如 "Math & Statistics: 2/2"），再进入下一轮。
讲解尽量简短。在测验全部结束前，不要解释任何答案。

---

### Round 1 -- Math & Statistics

**Q1.** 已有两个向量，a = [1, 2, 3]、b = [4, 5, 6]。它们的 dot product 是多少？

- A) 21
- B) 32
- C) 15
- D) 27

**正确答案：B) 32**（1*4 + 2*5 + 3*6 = 32）

**Q2.** 一枚均匀硬币抛 3 次。正好出现 2 次正面的概率是多少？

- A) 1/4
- B) 3/8
- C) 1/2
- D) 1/8

**正确答案：B) 3/8**（C(3,2) * (1/2)^3 = 3/8）

---

### Round 2 -- Classical ML

**Q3.** 在一个分类任务中，负样本占 90%、正样本占 10%，模型把所有样本都预测为负，
其 accuracy 是多少？

- A) 50%
- B) 10%
- C) 90%
- D) 0%

**正确答案：C) 90%**（所有负样本预测正确，所有正样本预测错误）

**Q4.** 以下哪一项是 Random Forest 的 hyperparameter？

- A) 学习得到的 split thresholds
- B) tree 的数量
- C) 叶节点的预测值
- D) 每个节点的 Gini impurity

**正确答案：B) tree 的数量**

---

### Round 3 -- Deep Learning

**Q5.** 在 backpropagation 过程中，chain rule 计算的是什么？

- A) 最优 learning rate
- B) loss 对每个 weight 的 gradient
- C) 所需的 layer 数量
- D) batch size

**正确答案：B) loss 对每个 weight 的 gradient**

**Q6.** ResNet 中的 residual connection（skip connection）主要解决了什么问题？

- A) 在小数据集上的 overfitting
- B) 深层网络中的 vanishing gradient
- C) 数据加载缓慢
- D) 高内存占用

**正确答案：B) 深层网络中的 vanishing gradient**

---

### Round 4 -- NLP & Transformers

**Q7.** 在 Transformer 架构中，attention 机制计算的是哪些对象之间的关系？

- A) 像素和标签
- B) Queries、Keys、Values
- C) 仅 Encoder 和 Decoder
- D) 仅 Embeddings 和 positions

**正确答案：B) Queries、Keys、Values**

**Q8.** 对大型语言模型做 fine-tuning 时，LoRA（Low-Rank Adaptation）的主要优势是什么？

- A) 从零开始训练所有参数
- B) 冻结大部分权重，只训练小的 low-rank 更新矩阵
- C) 完全不需要训练数据
- D) 把模型大小翻倍以获得更好效果

**正确答案：B) 冻结大部分权重，只训练小的 low-rank 更新矩阵**

---

### Round 5 -- Applied AI

**Q9.** 在 RAG（Retrieval-Augmented Generation）系统中，LLM 生成回答之前会发生什么？

- A) 用 query 对模型重新训练
- B) 检索相关文档并注入到 prompt 中
- C) 由用户手动选择上下文
- D) 模型在自己的 weights 中进行搜索

**正确答案：B) 检索相关文档并注入到 prompt 中**

**Q10.** 在多 agent 系统中，"coordinator" 或 "orchestrator" agent 的主要作用是什么？

- A) 取代所有其他 agent
- B) 分配任务、路由消息、管理 agent 之间的协作
- C) 增加 token 用量
- D) 充当备用模型

**正确答案：B) 分配任务、路由消息、管理 agent 之间的协作**

---

## 5 轮全部结束后

按领域展示明细与总分：

```
Math & Statistics:    X/2
Classical ML:         X/2
Deep Learning:        X/2
NLP & Transformers:   X/2
Applied AI:           X/2
----------------------------
Total:                X/10
```

## 分数到入门点的映射

| 总分 | 入门点 | 含义 |
|------|--------|------|
| 0-3 | Phase 1: Math Foundations | 从最基础开始 |
| 4-5 | Phase 3: Deep Learning Core | 你已有数学和 ML 基础 |
| 6-7 | Phase 7: Transformers Deep Dive | 你懂 DL，可以攻 transformers |
| 8-9 | Phase 11: LLM Engineering | 基础扎实，直接进入 LLM 应用 |
| 10 | Phase 14: Agent Engineering | 全部都会，开始搭建 agent |

## 个性化学习路径

公布入门点之后，生成一张覆盖全部 20 个阶段的 markdown 表格。根据得分判断每个阶段的
状态。位于入门点之前的阶段标为 "Skip"（学习者已经会了）。位于入门点及之后的阶段
标为 "Do"。如果学习者在某领域得 1/2 分、而该领域映射到的阶段本来要 Skip，则把那个
阶段改标为 "Review"。

复习判定的领域-阶段映射：
- Math & Statistics（1/2） -> 把 Phase 1 标为 "Review"
- Classical ML（1/2） -> 把 Phase 2 标为 "Review"
- Deep Learning（1/2） -> 把 Phase 3 标为 "Review"
- NLP & Transformers（1/2） -> 把 Phase 5 和 Phase 7 标为 "Review"
- Applied AI（1/2） -> 把 Phase 14 标为 "Review"

从 ROADMAP.md（事实来源的唯一权威）里读取时间估算。每个阶段标题中以
`(~N hours)` 的格式标注了预估小时数。解析这些值，而不要使用硬编码数字，确保学习路径
能随 roadmap 更新而保持同步。

## 输出格式

按如下格式生成表格：

```markdown
| Phase | 名称 | 状态 | 预估小时 |
|-------|------|------|----------|
| 0 | Setup & Tooling | Skip | -- |
| 1 | Math Foundations | Review | 30 |
| 2 | ML Fundamentals | Skip | -- |
| 3 | Deep Learning Core | Do | 20 |
| ... | ... | ... | ... |
```

表格规则：
- "Skip" 阶段的小时数显示 `--`（不计入总数）
- "Review" 阶段显示完整小时数（学习者应快速过一遍）
- "Do" 阶段显示完整小时数
- Phase 0（Setup & Tooling）无论得分多少都标为 "Skip"（它属于工具搭建，不是知识）
- 把 "Review" 和 "Do" 阶段的小时数加起来，并在末尾给出总计

表格之后，加一句估算总数的话："你的个性化路径：约 X 小时，覆盖 Y 个阶段。"

接着给出一句简短建议：从哪个阶段开始，以及根据最弱的领域应优先关注什么。
