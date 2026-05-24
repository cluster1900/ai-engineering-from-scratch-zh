---
name: skill-context-engineering
description: 基于任务类型、窗口大小和延迟预算设计上下文组装 pipeline 的决策框架
version: 1.0.0
phase: 11
lesson: 05
tags: [context-engineering, context-window, rag, memory, tool-selection, lost-in-the-middle]
---

# Context Engineering

构建 LLM 应用时，应用这个框架来设计上下文组装 pipeline。

## 核心原则

1. **上下文很稀缺。** 128K 窗口听起来很大，但很快就会填满。要明确地为每个组件做预算。
2. **关注度并不均匀。** 模型更关注开头和结尾。把关键信息放在那里。中间是死区。
3. **动态优于静态。** 不同查询需要不同上下文。按查询组装，而不是在启动时只组装一次。
4. **少即是多。** 精心筛选的 10K 上下文优于直接倾倒的 100K 上下文。信噪比比信息总量更重要。
5. **衡量一切。** 无法衡量，就无法优化。每个请求都要统计各组件的 Token。

## 上下文预算指南

| 组件 | 典型范围 | 优先级 | 压缩策略 |
|-----------|-------------|----------|---------------------|
| System prompt | 200-1,000 Token | 固定，高 | 写得紧凑，移除冗余 |
| Tool definitions | 500-3,000 Token | 动态，中 | 按查询意图裁剪 |
| Retrieved context | 1,000-5,000 Token | 动态，高 | Rerank + threshold + deduplicate |
| Conversation history | 500-5,000 Token | 动态，中 | 摘要旧轮次 |
| Few-shot examples | 500-2,000 Token | 动态，高 | 按任务相似度选择 |
| User query | 50-500 Token | 固定，最高 | N/A |
| Generation reserve | 2,000-8,000 Token | 固定 | 按预期输出长度调整 |

## 何时使用每种 memory 类型

**Short-term（conversation history）：** 当前 session。通过摘要管理。压缩早于 5-10 次交流的轮次。原样保留最近 3-4 轮。

**Long-term（facts database）：** 跨 session 持久保存的偏好和项目事实。在 session 启动时检索。示例："user prefers Python"、"project uses PostgreSQL"、"team follows trunk-based development"。存储在 CLAUDE.md、database 或结构化 memory system 中。

**Episodic（past interactions）：** 与当前任务相关的特定历史对话。存储为 Embedding，按相似度检索。"Last week we debugged a similar auth issue" 属于 episodic memory。

## 工具选择策略

不要在每个请求中包含所有工具。这会浪费 Token，并让模型困惑。

1. 对查询意图分类（code、email、calendar、research、data）
2. 将意图映射到工具类别
3. 只包含匹配的工具
4. 如果意图不明确，包含前 2 个类别的工具
5. 始终包含一个“general”工具（如 web search）作为 fallback

预期节省：对意图明确的查询，可节省 60-80% 的 tool definition Token。

## 检索最佳实践

- **检索后 rerank。** Vector 相似度只是粗略过滤器。reranker（cross-encoder 或基于 LLM）能显著提升 precision。
- **设置相关性阈值。** 不要包含低于 0.3 cosine similarity 的 chunk。它们会增加噪声。
- **去重。** 如果两个 chunk 共享 80% 以上内容，只保留分数更高的那个。
- **应用 lost-in-the-middle 排序。** 将最相关的 chunk 放在开头和结尾。
- **限制检索总 Token。** 3-5 个高度相关的 chunk 胜过 15 个一般相关的 chunk。

## 历史管理

- 原样保留最近 3-4 轮（模型需要近期上下文）
- 将更早的轮次摘要成 digest（"We discussed X, decided Y, and blocked on Z"）
- 删除不增加信息的系统生成轮次（没有面向用户内容的工具调用）
- 当历史超过可用预算的 30% 时触发压缩

## 红旗

- System prompt 超过 2,000 Token：可能包含了本应动态提供的信息
- 每个请求都包含所有工具：实现基于意图的选择
- 检索没有相关性过滤：你正在把噪声倒进窗口
- 历史无限增长：尚未实现摘要
- 没有 generation reserve：模型会截断响应
- 同一信息出现在 3 个地方（system prompt、retrieved doc、history）：去重
- 上下文利用率超过 60%：你留给模型“思考”的空间太少
