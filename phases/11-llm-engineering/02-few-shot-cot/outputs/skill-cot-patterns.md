---
name: skill-cot-patterns
description: 基于任务复杂度、准确率要求和成本约束选择合适推理技术的决策框架
version: 1.0.0
phase: 11
lesson: 02
tags: [chain-of-thought, few-shot, self-consistency, tree-of-thought, react, reasoning, prompting]
---

# 推理技术选择指南

当你需要 LLM 对问题进行推理时，先选择技术，再编写 prompt。技术决定推理架构。prompt 则负责填充具体内容。

## 快速决策树

1. 这个任务是简单的事实查找或单步 Classification 吗？
   - 是：使用 **zero-shot**。CoT 会增加成本，却没有准确率收益。
   - 否：继续。

2. 这个任务需要多步推理吗（数学、逻辑、规划）？
   - 是：使用 **Chain-of-Thought**。继续第 3 步。
   - 否：如果格式很重要，使用 **few-shot**；如果格式不重要，使用 zero-shot。

3. 单个推理错误可以接受吗？
   - 是：使用 **few-shot CoT**（单次采样，temperature 0.0）。
   - 否：使用 **self-consistency**（N=5，temperature 0.7）。继续第 4 步。

4. 这个问题是有许多可能路径的搜索/规划问题吗？
   - 是：使用 **Tree-of-Thought**。
   - 否：self-consistency 已经足够。

5. 这个任务需要外部信息或计算吗？
   - 是：使用 **ReAct**（推理 + tool calls）。
   - 否：纯推理技术已经足够。

## 技术 Matrix

| 技术 | 准确率提升 | 成本倍数 | 延迟 | 最适合 |
|-----------|--------------|-----------------|---------|----------|
| Zero-shot | 基线 | 1x | ~1s | 简单任务、事实 Q&A |
| Few-shot | +5-15% | 1.2x | ~1s | 格式匹配、Classification |
| Zero-shot CoT | +10-20% | 1.3x | ~1.5s | 快速提升推理能力 |
| Few-shot CoT | +15-25% | 1.5x | ~2s | 数学、逻辑、多步任务 |
| Self-Consistency (N=5) | 比 CoT 高 +2-5% | 5x | ~5s | 高风险推理 |
| Self-Consistency (N=10) | 比 N=5 高 +1-2% | 10x | ~10s | 仅用于关键决策 |
| Tree-of-Thought | 取决于任务 | 10-40x | ~30s+ | 搜索、规划、谜题 |
| ReAct | 取决于任务 | 3-10x | ~5-15s | 需要知识依据的任务 |
| Prompt Chaining | 比单次调用高 +5-10% | 2-5x | ~5-10s | 复杂的多部分任务 |

## 特定模型指南

### GPT-4o / GPT-4.1
- 基线推理能力强。Zero-shot CoT 通常足够。
- Few-shot CoT 搭配 3 个示例，在 GSM8K 上达到 95%。
- Self-consistency 带来的收益有限（95% 到 97%）-- 只在关键任务中值得使用。
- 原生支持 structured outputs，便于答案提取。

### Claude 3.5 Sonnet / Claude 3.7 Sonnet
- 非常擅长遵循结构化 prompt 格式（XML tags）。
- 使用 XML 分隔示例的 Few-shot CoT 效果最好。
- Extended thinking（Claude 3.7）是原生 CoT -- 不需要专门写 prompt 触发。
- Self-consistency 很有效，因为 Claude 在 temperature 0.7 时推理变化良好。

### Llama 3.1/3.3 70B
- 从 few-shot CoT 中受益最大（相比 zero-shot 的准确率差距更大）。
- 推理任务推荐使用 N=5 的 self-consistency。
- 比商业模型需要更明确的格式说明。
- ToT 在本地推理上成本很高 -- 仅考虑用于 batch processing。

### Gemini 2.5 Pro
- 开箱即有很强的多步推理能力。
- Thinking mode 提供内置 CoT，无需 prompt engineering。
- Few-shot 示例对格式一致性的帮助大于对准确率的帮助。
- 大上下文窗口（1M）使包含大量示例的 few-shot 变得实用。

## 反模式

**把 CoT 用在简单任务上**：询问 "What is 2+2? Let's think step by step" 会浪费 tokens。模型不需要推理轨迹也能答对简单算术。CoT 在有 3+ 步时才有帮助。

**在 temperature 0.0 下使用 self-consistency**：所有 N 个样本都会完全相同。你必须使用 temperature > 0（推荐 0.5-0.8）来获得多样的推理路径。

**所有事情都用 ToT**：ToT 需要 O(b^d) 次 LLM 调用，其中 b=branching factor，d=depth。b=3、d=3 的树最多需要 39 次调用。只把它留给更便宜技术失败的问题。

**Few-shot 使用糟糕示例**：带有推理错误的示例会教模型犯这些错误。每个示例都必须经过验证。一个错误示例造成的准确率下降可能比没有示例还严重。

**没有一致格式就提取答案**：self-consistency 需要比较多个样本的答案。如果答案格式不一致（"$18"、"18 dollars"、"eighteen"），投票会失败。始终强制要求："The answer is [number]."

## 成本优化

对于一个使用 GPT-4o 定价（$2.50/1M input，$10/1M output）、每天处理 10,000 个查询的生产系统：

| 技术 | 每个查询平均 Tokens | 每日成本 | 准确率 |
|-----------|-----------------|------------|----------|
| Zero-shot | ~200 | ~$5 | 78% |
| Few-shot CoT | ~600 | ~$15 | 95% |
| Self-Consistency (N=5) | ~3,000 | ~$75 | 97% |
| ToT (b=3, d=2) | ~6,000 | ~$150 | 取决于任务 |

对大多数应用来说，成本最优策略是：从 few-shot CoT 开始。只有在置信度较低的查询上添加 self-consistency（来自 Build It 部分的 escalation pattern）。

## 与 Prompt Chaining 集成

推理技术可以与 prompt chaining 组合：

**Chain Step 1**（Extract）：zero-shot，temperature 0.0
**Chain Step 2**（Reason）：few-shot CoT，temperature 0.0
**Chain Step 3**（Verify）：self-consistency，N=3，temperature 0.7

这个三步 chain 的成本约为单次 CoT 调用的 3x，但它能捕获提取错误、推理错误，并从验证步骤提供置信度分数。

## 什么时候超越 Prompting

如果你花在工程化 prompt 上的时间超过编写应用代码的时间，请考虑：

1. **Fine-tuning**：如果你有 500+ 标注示例，并且任务范围很窄
2. **DSPy compilation**：如果你想要自动化 prompt 优化
3. **Agent frameworks**：如果任务需要多轮工具使用（Phase 14）
4. **RAG**：如果模型需要访问私有/当前知识（Lessons 06-07）

Prompting 技术是基础。它们适用于任何模型、任何 provider，并且不需要训练数据。但它们也有边界。知道什么时候升级到下一层级，和掌握这些技术本身一样重要。
