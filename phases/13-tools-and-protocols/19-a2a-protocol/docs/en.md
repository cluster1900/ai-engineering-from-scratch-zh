# A2A — Agent-to-Agent Protocol

> MCP 是 agent-to-tool。A2A (Agent2Agent) 是 agent-to-agent，也就是一个开放协议，用于让基于不同框架构建的不透明 agent 进行协作。它由 Google 于 2025 年 4 月发布，2025 年 6 月捐赠给 Linux Foundation，并于 2026 年 4 月达到 v1.0，拥有包括 AWS、Cisco、Microsoft、Salesforce、SAP 和 ServiceNow 在内的 150+ 支持方。它吸收了 IBM 的 ACP，并新增了 AP2 支付扩展。本课将讲解 Agent Card、Task 生命周期，以及两种传输绑定。

**Type:** Build
**Languages:** Python (stdlib, Agent Card + Task harness)
**前置要求:** Phase 13 · 06 (MCP fundamentals), Phase 13 · 08 (MCP client)
**Time:** ~75 分钟

## 学习目标
- 区分 agent-to-tool (MCP) 与 agent-to-agent (A2A) 的使用场景。
- 在 `/.well-known/agent.json` 发布包含 skills 和 endpoint metadata 的 Agent Card。
- 走查 Task 生命周期（submitted → working → input-required → completed / failed / canceled / rejected）。
- 使用带有 Parts（text、file、data）的 Messages，并使用 Artifacts 作为输出。

## 问题
一个客服 agent 需要把报告撰写委托给一个专门的写作 agent。A2A 出现之前的选项：

- 自定义 REST API。可行，但每一组配对都是一次性的。
- 共享 codebase。要求两个 agent 运行在同一个框架上。
- MCP。不适合：MCP 用于调用 tools，不用于两个 agent 在保留各自不透明内部推理的同时进行协作。

A2A 填补了这个空白。它将交互建模为一个 agent 向另一个 agent 发送 Task，并包含生命周期、messages 和 artifacts。被调用 agent 的内部状态保持不透明，调用方只能看到 task 状态转换和最终输出。

A2A 是“让跨框架 agent 相互对话”的协议。它不会替代 MCP；两者是互补关系。

## 概念
### Agent Card

每个符合 A2A 的 agent 都会在 `/.well-known/agent.json` 发布一张 card：

```json
{
  "schemaVersion": "1.0",
  "name": "research-agent",
  "description": "总结学术论文并草拟引用。",
  "url": "https://research.example.com/a2a",
  "version": "1.2.0",
  "skills": [
    {
      "id": "summarize_paper",
      "name": "总结论文",
      "description": "读取论文 PDF，并生成 3 段摘要。",
      "inputModes": ["text", "file"],
      "outputModes": ["text", "artifact"]
    }
  ],
  "capabilities": {"streaming": true, "pushNotifications": true}
}
```

Discovery 基于 URL：获取 card，了解 A2A endpoint 的 URL，并枚举 skills。

### Signed Agent Cards (AP2)

AP2 扩展（2025 年 9 月）为 Agent Cards 添加了加密签名。发布方使用 JWT 对自己的 card 签名；消费者进行验证。这样可以防止冒充。

### Task lifecycle

```
submitted -> working -> completed | failed | canceled | rejected
             -> input_required -> working (loop via message)
```

Clients 使用 `tasks/send` 发起请求。被调用 agent 在不同状态之间转换；clients 通过 SSE 订阅状态更新，或进行轮询。

### Messages and Parts

一条 message 携带一个或多个 Parts：

- `text` — 普通内容。
- `file` — 带有 mimeType 的 base64 blob。
- `data` — 类型化 JSON payload（给被调用 agent 的结构化输入）。

示例：

```json
{
  "role": "user",
  "parts": [
    {"type": "text", "text": "总结这篇论文。"},
    {"type": "file", "file": {"name": "paper.pdf", "mimeType": "application/pdf", "bytes": "..."}},
    {"type": "data", "data": {"targetLength": "3 段"}}
  ]
}
```

### Artifacts

输出是 Artifacts，而不是原始字符串。Artifact 是一个具名、类型化的输出：

```json
{
  "name": "summary",
  "parts": [{"type": "text", "text": "..."}],
  "mimeType": "text/markdown"
}
```

Artifacts 可以以 chunks 形式进行流式传输。调用方负责累积。

### Two transport bindings

1. **JSON-RPC over HTTP.** `/a2a` endpoint，通过 POST 发送请求，可选 SSE 用于 streaming。默认绑定。
2. **gRPC.** 用于 gRPC 原生的企业环境。

两种绑定承载相同的逻辑 message 形状。

### Opacity preservation

一个关键设计原则：被调用 agent 的内部状态是不透明的。调用方看到的是 task 状态和 artifacts。被调用 agent 的 chain-of-thought、它的 tool calls、它的 sub-agent delegation，全部不可见。这不同于 MCP，在 MCP 中 tool calls 是透明的。

设计动机：A2A 让竞争者能够在不暴露内部实现的情况下进行协作。A2A 可以表示“调用这个客服 agent”，而调用方不需要了解该 agent 如何实现服务。

### Timeline

- **2025-04-09.** Google 宣布 A2A。
- **2025-06-23.** 捐赠给 Linux Foundation。
- **2025-08.** 吸收 IBM 的 ACP。
- **2025-09.** AP2 扩展（Agent Payments）发布。
- **2026-04.** v1.0 发布，拥有 150+ 支持组织。

### Relationship to MCP

| Dimension | MCP | A2A |
|-----------|-----|-----|
| Use case | Agent-to-tool | Agent-to-agent |
| Opacity | 透明的 tool calls | 不透明的内部推理 |
| Typical caller | Agent runtime | 另一个 agent |
| State | Tool-call result | 带生命周期的 Task |
| Authorization | OAuth 2.1 (Phase 13 · 16) | JWT-signed Agent Cards (AP2) |
| Transport | Stdio / Streamable HTTP | JSON-RPC over HTTP / gRPC |

当你想调用某个特定 tool 时，使用 MCP。当你想把完整 task 委托给另一个 agent 时，使用 A2A。许多生产系统会同时使用两者：一个 agent 使用 MCP 作为其 tool layer，并使用 A2A 作为其 collaboration layer。

## 使用它
`code/main.py` 实现了一个最小 A2A harness：一个 research agent 发布自己的 card，一个 writer agent 接收包含 PDF 和文本指令等 parts 的 `tasks/send`，经历 working → input_required → working → completed 的状态转换，并返回一个 text artifact。全部使用 stdlib；使用内存内 transport 来聚焦 message 形状。

需要关注的内容：

- Agent Card JSON 形状。
- Task id 分配和状态转换。
- 带混合类型 parts 的 Messages。
- Task 中途的 input-required 分支。
- 完成时返回 Artifact。

## 交付它
本课会生成 `outputs/skill-a2a-agent-spec.md`。给定一个应当可被其他 agent 调用的新 agent，该 skill 会生成 Agent Card JSON、skills schema 和 endpoint blueprint。

## 练习
1. 运行 `code/main.py`。追踪完整的 Task 生命周期，包括 input-required 暂停，此时被调用 agent 会请求澄清。

2. 添加一个 signed Agent Card。对 card 的 canonical JSON 使用 HMAC 签名。编写 verifier，并确认它会在 card 被篡改后验证失败。

3. 实现 task streaming：writer agent 通过 SSE 发出三个递增的 artifact chunks，调用方对它们进行累积。

4. 设计一个包装 MCP server 的 A2A agent。将每个 MCP tool 映射到一个 A2A skill。记录 trade-offs，即会丢失哪些不透明性？

5. 阅读 A2A v1.0 公告，并识别截至 2026 年 4 月尚未被任何框架实现的一项功能。（提示：它与 multi-hop task delegation 有关。）

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| A2A | “Agent-to-Agent protocol” | 用于不透明 agent 协作的开放协议 |
| Agent Card | “`.well-known/agent.json`” | 描述 agent skills 和 endpoint 的已发布 metadata |
| Skill | “一个可调用单元” | agent 支持的具名操作（类似 MCP tool） |
| Task | “委托单元” | 带生命周期和最终 artifact 的工作项 |
| Message | “Task 输入” | 携带 Parts（text、file、data） |
| Part | “类型化 chunk” | message 中的 `text` / `file` / `data` 元素 |
| Artifact | “Task 输出” | 完成时返回的具名、类型化输出 |
| AP2 | “Agent Payments Protocol” | 用于信任与支付的 Signed Agent Cards 扩展 |
| Opacity | “黑盒协作” | 被调用 agent 的内部对调用方隐藏 |
| Input-required | “Task 暂停” | agent 需要更多信息时的生命周期状态 |

## 延伸阅读
- [a2a-protocol.org](https://a2a-protocol.org/latest/) — 权威 A2A specification
- [a2aproject/A2A — GitHub](https://github.com/a2aproject/A2A) — reference implementations 和 SDKs
- [Linux Foundation — A2A 发布新闻稿](https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents) — 2025 年 6 月治理权移交
- [Google Cloud — A2A protocol 升级](https://cloud.google.com/blog/products/ai-machine-learning/agent2agent-protocol-is-getting-an-upgrade) — roadmap 和合作伙伴进展
- [Google Dev — A2A 1.0 milestone](https://discuss.google.dev/t/the-a2a-1-0-milestone-ensuring-and-testing-backward-compatibility/352258) — v1.0 release notes 和 backward-compat guidance
