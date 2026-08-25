---
name: skill-function-calling-patterns
description: 在生产环境中实现 Function Calling 的决策框架——涵盖 Tool 设计、错误处理、安全性和 Provider 模式
version: 1.0.0
phase: 11
lesson: 09
tags: [function-calling, tool-use, agents, mcp, security, openai, anthropic]
---

# Function Calling 模式

构建使用 Tool 的 LLM 应用时，请使用此决策框架。

## 何时使用 Function Calling

**在以下情况下使用 Function Calling：**
- Model 需要实时数据（天气、股票价格、数据库查询）
- 任务需要产生副作用（发送电子邮件、创建记录、部署代码）
- Model 必须根据用户意图在多个操作之间进行选择
- 你正在构建与外部系统交互的 Agent

**在以下情况下改用 structured outputs：**
- 你需要从文本中提取数据（无需外部调用）
- 输出是最终产物，而不是中间步骤
- 你只有一个 schema，而不是需要从多个 Tool 中进行选择

**在以下情况下同时使用两者：**
- Model 调用 Tool，然后将 Tool 结果组织成特定的输出格式

## Tool 设计指南

1. **一个 Tool，一个操作。** 名为 `manage_database` 的 Tool 如果同时处理查询、插入、更新和删除，范围就过于宽泛。应拆分为 `query_records`、`insert_record`、`update_record`。使用具体的 Tool 能让 Model 更准确地进行选择。

2. **描述就是 Prompt。** Model 会阅读 Tool 描述来决定如何选择。编写描述时，应像为初级开发者编写说明一样。除了说明 Tool 的作用，还要包含它返回什么。

3. **使用 enum 进行约束。** 如果某个参数有 3-10 个有效值，请使用 enum。除非进行约束，否则 Model 会自行编造字符串——如 `"celsius"`、`"Celsius"`、`"C"`、`"metric"`。

4. **Tool 越少越好。** GPT-4o 可以很好地处理 5-10 个 Tool。达到 20 个以上时，选择准确率会下降。达到 50 个以上时，错误选择 Tool 的比例预计为 10-15%。应对相关功能进行分组，或使用路由层。

5. **必填就意味着必须提供。** 仅当 Tool 缺少某个参数就完全无法运行时，才将该参数标记为必填。具有良好默认值的可选参数可以减少 Tool 调用失败。

## Provider 特定模式

### OpenAI（GPT-4o、o3、GPT-4o-mini）

```python
tools=[{"type": "function", "function": {"name": ..., "parameters": ...}}]
tool_choice="auto"       # 由 Model 决定
tool_choice="required"   # 必须调用至少一个 Tool
tool_choice={"type": "function", "function": {"name": "specific_tool"}}
```

- 支持并行 Tool 调用（一个响应中包含多个 `tool_calls`）
- 返回结果时必须同时传回 Tool 调用 ID
- `gpt-4o-mini` 的成本低 10 倍，并且能够很好地处理简单的 Tool 路由
- structured outputs 模式可与 Tool 参数配合使用，以保证符合 schema

### Anthropic（Claude 3.5 Sonnet、Claude 4 Opus）

```python
tools=[{"name": ..., "description": ..., "input_schema": ...}]
tool_choice={"type": "auto"}     # 由 Model 决定
tool_choice={"type": "any"}      # 必须调用至少一个 Tool
tool_choice={"type": "tool", "name": "specific_tool"}
```

- Tool 调用以 `type: "tool_use"` 的内容块形式出现
- 结果通过带有 `type: "tool_result"` 的用户消息传入
- 字段名是 `input_schema`，而不是 `parameters`（常见迁移 bug）
- 支持每个响应包含多个 Tool 调用

### Google（Gemini 2.0 Flash、Gemini 2.0 Pro）

```python
function_declarations=[{"name": ..., "description": ..., "parameters": ...}]
function_calling_config={"mode": "AUTO"}   # 或 "ANY" 或 "NONE"
```

- 在顶层使用 `function_declarations`
- 结果通过 `function_response` 部分返回
- 支持并行 Function Calling

### 开源 Model（Llama 3、Hermes、Qwen）

- 没有标准化格式——具体格式因 Model 和服务框架而异
- Hermes 格式（NousResearch）是最常见的 Fine-tuning 约定
- vLLM 为支持的 Model 提供兼容 OpenAI 的 Tool 调用
- Ollama 支持与兼容 Model 配合使用的基础 Tool 调用
- 在投入生产环境前测试 Tool 选择准确率——在 Berkeley Function Calling Leaderboard 上，开源 Model 的准确率比 GPT-4o 低 15-30%

## 错误处理模式

### 返回结构化错误

```json
{"error": true, "message": "未找到城市 'Toky'。你指的是 'Tokyo' 吗？", "code": "NOT_FOUND", "suggestions": ["Tokyo"]}
```

请包含可操作的信息。仅返回“未找到”很糟糕。返回“未找到，你指的是 X 吗？”则更好。Model 会使用错误消息进行自我纠正。

### 重试策略

1. Tool 调用因可纠正的错误而失败（拼写错误、错误的 enum 值）
2. 将错误作为 Tool 结果发回 Model
3. Model 调整后重试
4. 每次 Tool 调用最多重试 3 次
5. 失败 3 次后，将错误返回给用户

### 超时处理

为所有 Tool 执行设置超时。30 秒是合理的默认值。如果 Tool 超时，请返回结构化的超时错误，使 Model 能够通知用户，而不是一直挂起。

## 安全检查清单

| 检查项 | 原因 | 方法 |
|-------|-----|-----|
| 将函数加入 allowlist | 防止任意代码执行 | 仅注册用户需要的 Tool |
| 验证参数类型 | 防止类型混淆攻击 | 执行前检查类型 |
| 清理字符串参数 | 防止注入 | 拒绝或转义特殊字符 |
| 参数化数据库查询 | 防止 SQL 注入 | 绝不直接传入由 Model 生成的 SQL |
| 过滤 Tool 结果 | 防止数据泄露 | 移除 API key、PII 和内部错误 |
| 限制 Tool 调用速率 | 防止失控循环 | 每次对话最多调用 10-20 次 |
| 记录所有 Tool 调用 | 提供审计记录 | 存储 Tool 名称、参数、结果和时间戳 |
| 阻止路径遍历 | 防止访问文件系统 | 在文件 Tool 中拒绝 `..` 和绝对路径 |
| 对代码执行使用 sandbox | 防止访问系统 | 使用容器或受限 builtins |
| 验证返回内容大小 | 防止 Context 填充攻击 | 截断超过 10KB 的结果 |

## 性能优化

- **并行调用：** 当 Model 请求多个相互独立的 Tool 时，使用 `asyncio.gather()` 或 `concurrent.futures` 并发执行
- **缓存：** 在同一 session 内，对参数相同的 Tool 结果进行缓存（天气不会在 60 秒内发生变化）
- **流式传输：** 在获取 Tool 结果的同时，以流式方式输出 Model 的最终响应
- **Tool 剪枝：** 如果 Context 紧张，仅包含与当前查询相关的 Tool 定义（使用分类器进行筛选）
- **使用更小的 Model 进行路由：** 使用 `gpt-4o-mini` 或 `claude-haiku-4-5` 选择 Tool，然后将结果传递给更强大的 Model 进行综合

## 常见失败模式

| 失败情况 | 原因 | 修复方法 |
|---------|-------|-----|
| 选择了错误的 Tool | 描述存在歧义 | 使用明确的触发词重写描述 |
| 缺少必填参数 | Model 遗漏了某个参数 | 在参数描述中添加清晰的示例 |
| Tool 无限循环 | Model 不断调用同一个 Tool | 设置最大迭代次数（5-10 次）并检测重复调用 |
| 参数出现幻觉 | Model 编造看似合理但错误的值 | 使用 enum，并根据已知值进行验证 |
| Tool 结果过大 | API 返回了 100KB 数据 | 在反馈给 Model 前截断或总结 |
| Model 忽略 Tool 结果 | 结果格式令人困惑 | 返回字段名清晰、整洁的 JSON |
