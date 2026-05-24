---
name: skill-function-calling-patterns
description: 在生产中实现 function calling 的决策框架 -- 工具设计、错误处理、安全性和 provider 模式
version: 1.0.0
phase: 11
lesson: 09
tags: [function-calling, tool-use, agents, mcp, security, openai, anthropic]
---

# Function Calling 模式

构建使用工具的 LLM 应用时，应用这个决策框架。

## 何时使用 function calling

**在以下情况使用 function calling：**
- 模型需要实时数据（天气、股价、数据库查询）
- 任务需要副作用（发送邮件、创建记录、部署代码）
- 模型必须根据用户意图在多个动作之间做选择
- 你正在构建与外部系统交互的 agent

**在以下情况改用 structured outputs：**
- 你需要从文本中提取数据（不需要外部调用）
- 输出就是最终产物，而不是中间步骤
- 你只有一个 schema，而不是多个可供选择的工具

**在以下情况两者都用：**
- 模型调用工具，然后把工具结果整理为特定的输出格式

## 工具设计指南

1. **一个工具，一个动作。** 名为 `manage_database` 的工具如果同时处理查询、插入、更新和删除，就太宽泛了。拆分为 `query_records`、`insert_record`、`update_record`。使用具体工具时，模型选择会更准确。

2. **Descriptions 就是 prompts。** 模型读取工具 descriptions 来决定选择。像给初级开发者写指令一样编写它们。包含工具返回什么，而不只是它做什么。

3. **用 enums 约束。** 如果一个参数有 3-10 个有效值，使用 enum。模型会发明字符串 -- "celsius"、"Celsius"、"C"、"metric" -- 除非你约束它。

4. **工具越少越好。** GPT-4o 能很好地处理 5-10 个工具。超过 20 个工具时，选择准确率会下降。超过 50 个工具时，预期会有 10-15% 的错误工具选择。可以合并相关功能，或使用路由层。

5. **Required 就意味着必需。** 只有当工具确实没有某个参数就无法运行时，才将该参数标记为 required。带有良好 defaults 的可选参数可以减少工具调用失败。

## Provider-specific 模式

### OpenAI (GPT-4o, o3, GPT-4o-mini)

```python
tools=[{"type": "function", "function": {"name": ..., "parameters": ...}}]
tool_choice="auto"       # model decides
tool_choice="required"   # must call at least one tool
tool_choice={"type": "function", "function": {"name": "specific_tool"}}
```

- 支持并行工具调用（一个响应中有多个 `tool_calls`）
- 工具调用 IDs 必须随结果一起传回
- `gpt-4o-mini` 便宜 10 倍，并且能很好地处理简单工具路由
- Structured outputs 模式可与工具参数配合使用，以保证 schema 合规

### Anthropic (Claude 3.5 Sonnet, Claude 4 Opus)

```python
tools=[{"name": ..., "description": ..., "input_schema": ...}]
tool_choice={"type": "auto"}     # model decides
tool_choice={"type": "any"}      # must call at least one tool
tool_choice={"type": "tool", "name": "specific_tool"}
```

- 工具调用以 `type: "tool_use"` 的 content blocks 形式出现
- 结果放在带有 `type: "tool_result"` 的 user messages 中
- 字段名是 `input_schema`，不是 `parameters`（常见迁移 bug）
- 支持每个响应中有多个工具调用

### Google (Gemini 2.0 Flash, Gemini 2.0 Pro)

```python
function_declarations=[{"name": ..., "description": ..., "parameters": ...}]
function_calling_config={"mode": "AUTO"}   # or "ANY" or "NONE"
```

- 在顶层使用 `function_declarations`
- 结果通过 `function_response` parts 返回
- 支持并行 function calling

### Open-source models (Llama 3, Hermes, Qwen)

- 没有标准化格式 -- 会随模型和 serving framework 而变
- Hermes 格式（NousResearch）是最常见的 fine-tuned 约定
- vLLM 对支持的模型提供 OpenAI-compatible tool calling
- Ollama 对兼容模型支持基础 tool calling
- 生产前测试工具选择准确率 -- 在 Berkeley Function Calling Leaderboard 上，open models 比 GPT-4o 低 15-30%

## 错误处理模式

### 返回结构化错误

```json
{"error": true, "message": "City 'Toky' not found. Did you mean 'Tokyo'?", "code": "NOT_FOUND", "suggestions": ["Tokyo"]}
```

包含可操作的信息。"Not found" 不好。"Not found, did you mean X?" 更好。模型会使用错误消息进行自我纠正。

### 重试策略

1. 工具调用因可纠正错误而失败（拼写错误、错误 enum 值）
2. 将错误作为工具结果发回给模型
3. 模型调整并重试
4. 每次工具调用最多重试 3 次
5. 3 次失败后，将错误返回给用户

### Timeout 处理

为所有工具执行设置 timeouts。30 秒是合理的默认值。如果工具超时，返回结构化 timeout 错误，让模型可以告知用户，而不是一直挂起。

## 安全清单

| 检查 | 原因 | 方法 |
|-------|-----|-----|
| Allowlist functions | 防止任意代码执行 | 只注册用户需要的工具 |
| Validate argument types | 防止类型混淆攻击 | 执行前检查类型 |
| Sanitize string arguments | 防止 injection | 拒绝或转义特殊字符 |
| Parameterize database queries | 防止 SQL injection | 永远不要直接传入模型生成的 SQL |
| Filter tool results | 防止数据泄露 | 移除 API keys、PII、内部错误 |
| Rate limit tool calls | 防止失控循环 | 每次对话最多 10-20 次调用 |
| Log all tool calls | 审计轨迹 | 存储工具名、参数、结果、timestamp |
| Block path traversal | 防止文件系统访问 | 在文件工具中拒绝 `..` 和绝对路径 |
| Sandbox code execution | 防止系统访问 | 使用容器或受限 builtins |
| Validate return size | 防止 context stuffing | 截断超过 10KB 的结果 |

## 性能优化

- **Parallel calls:** 当模型请求多个相互独立的工具时，使用 `asyncio.gather()` 或 `concurrent.futures` 并发执行
- **Caching:** 在同一 session 中为相同参数缓存工具结果（天气在 60 秒内不会变化）
- **Streaming:** 在获取工具结果的同时 stream 模型的最终响应
- **Tool pruning:** 如果 context 紧张，只包含与当前查询相关的工具定义（使用 classifier 过滤）
- **Smaller models for routing:** 使用 `gpt-4o-mini` 或 `claude-3-5-haiku` 做工具选择，然后把结果传给更强的模型进行综合

## 常见失败模式

| 失败 | 原因 | 修复 |
|---------|-------|-----|
| 选错工具 | Descriptions 含糊 | 用具体触发词重写 descriptions |
| 缺少 required args | 模型忘记了某个参数 | 在参数 descriptions 中添加清晰示例 |
| 无限工具循环 | 模型持续调用同一个工具 | 设置最大迭代次数（5-10）并检测重复调用 |
| 幻觉参数 | 模型发明看似合理但错误的值 | 使用 enums，并根据已知值验证 |
| 工具结果过大 | API 返回了 100KB 数据 | 在反馈给模型前截断或总结 |
| 模型忽略工具结果 | 结果格式令人困惑 | 返回带清晰字段名的干净 JSON |
