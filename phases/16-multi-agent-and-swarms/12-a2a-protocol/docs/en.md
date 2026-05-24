# A2A — Agent-to-Agent Protocol

> Google 于 2025 年 4 月宣布 A2A；到 2026 年 4 月，该 spec 位于 https://a2a-protocol.org/latest/specification/，并获得 150+ 个组织支持。A2A 是 MCP（Lesson 13）的横向补充：MCP 是纵向的（agent ↔ tools），A2A 是 peer-to-peer 的（agent ↔ agent）。它定义 Agent Cards（discovery）、带 artifacts 的 tasks（text、structured data、video）、不透明 task lifecycles，以及 auth。Production systems 越来越多地将 MCP 与 A2A 配对使用。Google Cloud 在 2025-2026 年期间将 A2A 支持加入 Vertex AI Agent Builder。

**类型：** 学习 + 构建
**语言：** Python (stdlib, `http.server`, `json`)
**前置要求：** Phase 16 · 04 (Primitive Model)
**时间：** ~75 分钟

## 问题

你的 agent 需要调用另一个系统上的另一个 agent。怎么做？你可以暴露一个 HTTP endpoint，定义一个 bespoke JSON schema，然后希望对方能理解。每一对 agents 都会变成一次 custom integration。

A2A 就是这类调用的通用 wire protocol。标准 discovery、标准 task model、标准 transport、标准 artifacts。类似 HTTP+REST，但 agents 是 first-class citizens。

## 概念

### 四个元素

**Agent Card.** 位于 `/.well-known/agent.json` 的 JSON document，用于描述 agent：name、skills、endpoints、supported modalities、auth requirements。Discovery 通过读取 card 完成。

```
GET https://agent.example.com/.well-known/agent.json
→ {
    "name": "code-review-agent",
    "skills": ["review-python", "review-typescript"],
    "endpoints": {
      "tasks": "https://agent.example.com/tasks"
    },
    "auth": {"type": "bearer"},
    "modalities": ["text", "structured"]
  }
```

**Task.** 工作单元。一个 async、stateful object，带有生命周期：`submitted → working → completed / failed / canceled`。Client 发送 task，然后 poll 或 subscribe 获取 updates。

**Artifact.** 由 task 产生的结果类型。Text、structured JSON、image、video、audio。Artifacts 有类型，因此不同 modalities 都是一等对象。

**Opaque lifecycle.** A2A 不规定 remote agent *如何* 解决 task。Client 看到 state transitions 和 artifacts；implementation 可以自由使用任何 framework。

### MCP/A2A 分工

- **MCP**（Lesson 13）：agent ↔ tool。Agent 通过 JSON-RPC 向 tool server 读写。默认 stateless。
- **A2A**：agent ↔ agent。Peer protocol；两边都是拥有自身 reasoning 的 agents。

Production multi-agent systems 两者都会使用。A2A peer 会调用其所在侧的 MCP tools。这个分工让两类关注点保持清晰。

### Discovery flow

```
Client                     Agent server
  ├──GET /.well-known/agent.json──>
  <──Agent Card JSON─────────────
  ├──POST /tasks {skill, input}──>
  <──201 task_id, state=submitted
  ├──GET /tasks/{id}──────────────>
  <──state=working, 42% done──────
  ├──GET /tasks/{id}──────────────>
  <──state=completed, artifacts──
```

或使用 streaming：通过 SSE subscription 到 `/tasks/{id}/events` 获取 push updates。

### Auth

A2A 支持三种常见模式：

- **Bearer token** — OAuth2 或 opaque。
- **mTLS** — mutual TLS；组织之间相互证明身份。
- **Signed requests** — 对 payload 执行 HMAC。

Auth 在 Agent Card 中声明；clients 发现并遵循。

### 到 2026 年 4 月已有 150+ 个组织

Enterprise adoption 推动了 A2A 的规模化。要点是：A2A 成为 enterprise agent systems 跨越 trust boundaries 的方式。Google Cloud 发布了 Vertex AI Agent Builder A2A 支持；Microsoft Agent Framework 支持它；多数主流 frameworks（LangGraph、CrewAI、AutoGen）都提供 A2A adapters。

### A2A 的优势场景

- **跨组织调用。** 公司 A 的 agent 调用公司 B 的 agent。没有 A2A，每一对都需要 bespoke contract。
- **异构 frameworks。** LangGraph agent 调用 CrewAI agent，再调用 custom Python agent。A2A 进行规范化。
- **Typed artifacts。** Video result、structured JSON、audio — 全部是一等对象。
- **Long-running tasks。** Opaque lifecycle + polling 让持续数小时的 tasks 变得直接。

### A2A 的困难场景

- **Latency-sensitive micro-calls。** A2A 的 lifecycle 是 async。亚毫秒级 agent-to-agent 不适合；使用 direct RPC。
- **Tight-coupled in-process agents。** 如果两个 agents 都在同一个 Python process 中运行，A2A 的 HTTP round-trip 就过重。
- **Small teams。** Spec overhead 是真实存在的；仅内部使用的 agents 可能不需要这种正式性。

### A2A vs ACP, ANP, NLIP

2024-2026 年出现了多个相关 specs：

- **ACP**（IBM/Linux Foundation）— A2A 的前身，范围更窄。
- **ANP**（Agent Network Protocol）— 偏重 peer-discovery，decentralized-first。
- **NLIP**（Ecma Natural Language Interaction Protocol，2025 年 12 月标准化）— natural-language content type。

截至 2026 年 4 月，A2A 是采用最广的 peer protocol。比较请参见 arXiv:2505.02279（Liu et al., "A Survey of Agent Interoperability Protocols"）。

## 构建它

`code/main.py` 使用 `http.server` 和 JSON 实现了一个 A2A-minimal server 与 client。Server：

- 暴露 `/.well-known/agent.json`，
- 接受 `POST /tasks`，
- 管理 task state，
- 在 `GET /tasks/{id}` 上返回 artifacts。

Client：

- 获取 Agent Card，
- 提交 task，
- poll 直到完成，
- 读取 artifact。

运行：

```
python3 code/main.py
```

脚本会在 background thread 中启动 server，然后运行 client 调用它。你会看到完整流程：discovery、submit、poll、artifact。

## 使用它

`outputs/skill-a2a-integrator.md` 设计 A2A integration：Agent Card contents、task schemas、auth choice、streaming vs polling。

## 发布它

Checklist：

- **固定 spec version。** A2A 仍在演进；Agent Card 应声明 protocol version。
- **Idempotent task creation。** 重复 submissions（network retries）应产生同一个 task。
- **Artifact schemas。** 声明 agent 返回哪些 shapes；consumers 应该 validate。
- **Rate limits + auth。** A2A 是 public-facing；应用标准 web security。
- **Failed tasks 的 dead-letter。** 随时间检查 recurring failure types 的 patterns。

## 练习

1. 运行 `code/main.py`。确认 client 发现 server 并收到正确 artifact。
2. 给 server 添加第二个 skill（例如 "summarize"）。更新 Agent Card。编写一个 client，根据 task type 选择 skill。
3. 实现一个 SSE streaming endpoint：`/tasks/{id}/events`，用于发出 state changes。Client 需要做什么不同的事情？
4. 阅读 A2A spec（https://a2a-protocol.org/latest/specification/）。找出 spec 强制要求、但此 demo 未实现的三件事。
5. 比较 A2A（Agent Card discovery）与 MCP（通过 `listTools` 进行 server-side capability listing）。self-describing agents 与 capability-probing 之间的 tradeoff 是什么？

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| A2A | "Agent-to-agent" | 用于 agents 跨系统调用其他 agents 的 peer protocol。Google 2025。 |
| Agent Card | "agent 的名片" | 位于 `/.well-known/agent.json` 的 JSON，描述 skills、endpoints、auth。 |
| Task | "工作单元" | 带生命周期的 async stateful object；完成时产生 artifacts。 |
| Artifact | "结果" | Typed output：text、structured JSON、image、video、audio。一等 media。 |
| Opaque lifecycle | "怎么解决是 agent 自己的事" | Client 看到 state transitions；server 可自由选择 framework/tools。 |
| Discovery | "找到 agent" | `GET /.well-known/agent.json` 返回 card。 |
| MCP vs A2A | "Tools vs peers" | MCP：纵向 agent ↔ tool。A2A：横向 agent ↔ agent。 |
| ACP / ANP / NLIP | "同类协议" | 相邻 specs；A2A 是 2026 年采用最广的协议。 |

## 延伸阅读

- [A2A specification](https://a2a-protocol.org/latest/specification/) — canonical spec
- [Google Developers Blog — A2A announcement](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/) — 2025 年 4 月发布文章
- [A2A GitHub repo](https://github.com/a2aproject/A2A) — reference implementations 和 SDKs
- [Liu et al. — A Survey of Agent Interoperability Protocols](https://arxiv.org/html/2505.02279v1) — MCP、ACP、A2A、ANP 比较
