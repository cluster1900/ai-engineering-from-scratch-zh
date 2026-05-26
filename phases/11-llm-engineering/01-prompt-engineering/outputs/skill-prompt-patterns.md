---
name: skill-prompt-patterns
description: 根据任务类型、可靠性要求和目标 model 选择正确 prompt pattern 的决策框架
version: 1.0.0
phase: 11
lesson: 01
tags: [prompt-engineering, patterns, llm, temperature, cross-model, few-shot, chain-of-thought]
---

# Prompt Pattern 选择指南

构建 LLM 驱动的功能时，先选择 prompt pattern，再编写 prompt。Pattern 决定结构，内容负责填充结构。

## Pattern 决策Matrix

| 任务类型 | Primary Pattern | Secondary Pattern | Temperature | 是否需要 Few-Shot？ |
|-----------|----------------|-------------------|-------------|-----------------|
| 数据抽取 | Template Fill | Few-Shot | 0.0 | 是（2-3 个示例） |
| Classification | Few-Shot | Guardrail | 0.0 | 是（3-5 个示例） |
| 摘要 | Persona + Template | Audience Adapt | 0.3 | 否 |
| 代码生成 | Persona | Chain-of-Thought | 0.0 | 可选 |
| 创意写作 | Persona | Critique | 0.7-1.0 | 否 |
| 多步骤推理 | Chain-of-Thought | Decomposition | 0.3 | 可选 |
| 问答 | Persona + Guardrail | Boundary | 0.3 | 否 |
| Prompt 生成 | Meta-Prompt | Critique | 0.7 | 是（1-2 个示例） |
| 内容审核 | Guardrail + Boundary | Few-Shot | 0.0 | 是（5+ 个示例） |
| 翻译/改写适配 | Audience Adapt | Few-Shot | 0.3 | 是（2-3 个示例） |

## 何时使用每种 Pattern

**Persona Pattern**：把它作为每个 prompt 的基线使用。唯一的问题是角色需要多具体。对于通用任务，宽泛角色就足够。对于特定领域任务，角色应说明领域、资历级别和上下文。

**Few-Shot Pattern**：当输出格式比内容更重要时使用。如果 model 需要生成特定 JSON 形状、CSV 格式或 Classification 标签，示例比指令更有效。经验规则：简单格式用 2-3 个示例，复杂或模糊格式用 5+ 个示例。

**Chain-of-Thought Pattern**：用于数学、逻辑、多步骤分析，以及任何需要 model “展示推导过程”的任务。它能在推理任务上将准确率提升 10-40%（Wei et al., 2022）。不要用于简单事实查询或抽取，它会浪费 tokens。

**Template Fill Pattern**：用于结构化抽取，其中每个输出都必须具有相同形状。配合 temperature=0.0，并显式处理缺失字段为 "N/A" 时效果最好。

**Critique Pattern**：当质量比速度更重要时使用。Model 先生成，再批判，最后改进。Token 成本大约翻倍，但会显著提升准确性和完整性。最适合高风险输出（报告、建议、面向公众的内容）。

**Guardrail Pattern**：用于任何面向用户的系统。始终包含：范围边界、超出范围请求的拒绝行为，以及显式的 “I don't know” 处理。并与应用侧输入验证结合使用。

**Meta-Prompt Pattern**：用于为新任务生成 prompts。不要从零开始写 prompt，而是描述任务，让 model 编写 prompt。然后测试并迭代。这能节省初始 prompt 开发时间。

**Decomposition Pattern**：用于适合分而治之的复杂问题。Model 将问题拆成多个部分，逐一解决，再合并结果。对包含 3-7 个子问题的任务最有效。

**Audience Adaptation Pattern**：当相同内容需要服务不同受众时使用。明确指定受众，不要依赖 model 从上下文中猜测。

**Boundary Pattern**：用于绝不能回答某些类型问题的生产系统。它比 guardrails 更强，因为它定义了硬范围和精确的拒绝消息。对合规敏感领域至关重要。

## Cross-Model 兼容性

Patterns 按其在 GPT-4o、Claude 3.5 Sonnet、Gemini 1.5 Pro 和 Llama 3 上的一致性排序：

| Pattern | Cross-Model 一致性 | 说明 |
|---------|------------------------|-------|
| Few-Shot | 非常高 | 示例在所有 models 之间迁移良好 |
| Template Fill | 非常高 | 显式结构几乎不给差异留下空间 |
| Chain-of-Thought | 高 | 所有主流 models 都支持 “think step by step” |
| Persona | 高 | 到处都有效，但不同 models 对角色具体程度的响应不同 |
| Guardrail | 中等 | Claude 最严格遵循 guardrails；GPT-4o 在长对话中有时会漂移 |
| Critique | 中等 | 自我批判质量因 model 而差异显著 |
| Meta-Prompt | 中等 | GPT-4o 和 Claude 会生成不同风格的 prompts |
| Boundary | 低到中等 | 拒绝行为会变化；需按 model 测试 |

## 常见错误

1. **对所有任务都使用 Chain-of-Thought**：CoT 会增加 tokens 和延迟。只有在需要推理步骤时才使用。
2. **约束过多**：超过 5-7 条约束后，model 会开始遗漏部分约束。优先保留最重要的 3 条。
3. **Persona 与约束矛盾**："You are a creative writer" + "Never use metaphors" 会让 model 困惑。
4. **没有指定 temperature**：当你需要确定性输出时，却保留默认 temperature（通常是 1.0）。
5. **在 models 之间复制粘贴 prompts**：始终测试。为 GPT-4o 调优的 prompt 在 Claude 上可能表现较差，反之亦然。
6. **忽略 system message**：把所有内容都放进 user message，而不是用 system message 放置持久规则。
7. **过度依赖否定约束**："Do NOT do X, Y, Z, A, B, C" 不如 "ONLY do W" 有效。正向表述会给 model 一个明确目标。

## 可靠性目标

| 用例 | Pattern 组合 | 预期准确率 | Token 成本 |
|----------|-------------------|-------------------|------------|
| 生产抽取 | Template + Few-Shot | 95%+ | 低（500-1K） |
| 面向用户的 Q&A | Persona + Guardrail + Boundary | 90%+ | 中（1-2K） |
| 代码生成 | Persona + Chain-of-Thought | 85%+ | 中（1-3K） |
| 内容生成 | Persona + Critique | 90%+ 质量 | 高（2-4K，双轮） |
| Classification | Few-Shot + Guardrail | 95%+ | 低（300-800） |
| 复杂分析 | Decomposition + Chain-of-Thought | 85%+ | 高（3-5K） |
