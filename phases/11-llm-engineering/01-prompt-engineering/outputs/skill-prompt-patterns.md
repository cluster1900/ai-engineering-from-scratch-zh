---
name: skill-prompt-patterns
description: 根据任务类型、可靠性要求和目标模型选择正确 prompt pattern 的决策框架
version: 1.0.0
phase: 11
lesson: 01
tags: [prompt-engineering, patterns, llm, temperature, cross-model, few-shot, chain-of-thought]
---

# Prompt Pattern 选择指南

构建由 LLM 驱动的功能时，先选择 prompt pattern，再编写 prompt。pattern 决定结构，内容填充结构。

## Pattern 决策Matrix

| 任务类型 | 主要 Pattern | 次要 Pattern | Temperature | 是否需要 Few-Shot？ |
|-----------|----------------|-------------------|-------------|-----------------|
| 数据提取 | Template Fill | Few-Shot | 0.0 | 是（2-3 个示例） |
| Classification | Few-Shot | Guardrail | 0.0 | 是（3-5 个示例） |
| 总结 | Persona + Template | Audience Adapt | 0.3 | 否 |
| Code 生成 | Persona | Chain-of-Thought | 0.0 | 可选 |
| 创意写作 | Persona | Critique | 0.7-1.0 | 否 |
| 多步推理 | Chain-of-Thought | Decomposition | 0.3 | 可选 |
| 问答 | Persona + Guardrail | Boundary | 0.3 | 否 |
| Prompt 生成 | Meta-Prompt | Critique | 0.7 | 是（1-2 个示例） |
| 内容审核 | Guardrail + Boundary | Few-Shot | 0.0 | 是（5+ 个示例） |
| 翻译/改写适配 | Audience Adapt | Few-Shot | 0.3 | 是（2-3 个示例） |

## 何时使用每种 Pattern

**Persona Pattern**：作为基线用于每个 prompt。唯一的问题是角色需要具体到什么程度。对于通用任务，宽泛角色即可。对于特定领域任务，角色应说明领域、资历水平和上下文。

**Few-Shot Pattern**：当输出格式比内容更重要时使用。如果模型需要生成特定 JSON 结构、CSV 格式或 Classification label，示例比说明更有效。经验规则：简单格式使用 2-3 个示例，复杂或模糊格式使用 5+ 个示例。

**Chain-of-Thought Pattern**：用于数学、逻辑、多步分析，以及任何需要模型“展示推导过程”的任务。在推理任务上可将准确率提升 10-40%（Wei et al., 2022）。不要用于简单事实查询或提取，因为这会浪费 Token。

**Template Fill Pattern**：用于结构化提取，其中每个输出都必须具有相同形状。与 temperature=0.0 以及对缺失字段的显式 "N/A" 处理搭配效果最佳。

**Critique Pattern**：当质量比速度更重要时使用。模型先生成，再批判，再改进。Token 成本大约翻倍，但会显著提高准确性和完整性。最适合高风险输出（报告、建议、面向公众的内容）。

**Guardrail Pattern**：用于任何面向用户的系统。始终包含：范围边界、对超范围请求的拒绝行为，以及显式 "I don't know" 处理。与应用侧输入验证结合使用。

**Meta-Prompt Pattern**：用于为新任务生成 prompt。不是从零编写 prompt，而是描述任务并让模型编写 prompt。然后测试并迭代。可节省初始 prompt 开发时间。

**Decomposition Pattern**：用于受益于分而治之的复杂问题。模型将问题拆成多个部分，逐一解决，再组合。对包含 3-7 个子问题的任务最有效。

**Audience Adaptation Pattern**：当同一内容需要服务不同受众时使用。明确指定受众，不要依赖模型从上下文中猜测。

**Boundary Pattern**：用于绝不能回答某些类型问题的生产系统。它比 guardrail 更强，因为它定义了硬性范围和准确拒绝消息。对合规敏感领域至关重要。

## 跨模型兼容性

以下 pattern 按其在 GPT-4o、Claude 3.5 Sonnet、Gemini 1.5 Pro 和 Llama 3 上的一致表现排序：

| Pattern | 跨模型一致性 | 备注 |
|---------|------------------------|-------|
| Few-Shot | 非常高 | 示例能很好迁移到所有模型 |
| Template Fill | 非常高 | 显式结构几乎不给偏离留下空间 |
| Chain-of-Thought | 高 | 所有主流模型都支持 "think step by step" |
| Persona | 高 | 各处都有效，但不同模型对角色具体程度的响应不同 |
| Guardrail | 中等 | Claude 最严格遵循 guardrail；GPT-4o 在长对话中有时会漂移 |
| Critique | 中等 | 自我批判质量因模型而有明显差异 |
| Meta-Prompt | 中等 | GPT-4o 和 Claude 会生成不同风格的 prompt |
| Boundary | 低到中等 | 拒绝行为不同；需按模型测试 |

## 常见错误

1. **对所有事情都使用 Chain-of-Thought**：CoT 会增加 Token 和延迟。只有在需要推理步骤时才使用。
2. **约束过多**：超过 5-7 条约束后，模型开始遗漏其中一些。优先考虑最重要的 3 条。
3. **Persona + 约束互相矛盾**："You are a creative writer" + "Never use metaphors" 会让模型困惑。
4. **没有 temperature 规范**：在需要确定性输出时仍使用默认 temperature（通常为 1.0）。
5. **跨模型复制粘贴 prompt**：始终测试。针对 GPT-4o 调优的 prompt 可能在 Claude 上表现较差，反之亦然。
6. **忽略 system message**：把所有内容都放进 user message，而不是使用 system message 承载持久规则。
7. **过度依赖负向约束**："Do NOT do X, Y, Z, A, B, C" 不如 "ONLY do W" 有效。正向表述能给模型明确目标。

## 可靠性目标

| 使用场景 | Pattern 组合 | 预期准确率 | Token 成本 |
|----------|-------------------|-------------------|------------|
| 生产环境提取 | Template + Few-Shot | 95%+ | 低（500-1K） |
| 面向用户的 Q&A | Persona + Guardrail + Boundary | 90%+ | 中（1-2K） |
| Code 生成 | Persona + Chain-of-Thought | 85%+ | 中（1-3K） |
| 内容生成 | Persona + Critique | 90%+ 质量 | 高（2-4K，双轮） |
| Classification | Few-Shot + Guardrail | 95%+ | 低（300-800） |
| 复杂分析 | Decomposition + Chain-of-Thought | 85%+ | 高（3-5K） |
