# FIPA-ACL 与 Speech Acts 的传承

> 在 MCP 之前，在 A2A 之前，有 FIPA-ACL。2000 年，IEEE Foundation for Intelligent Physical Agents 批准了一种 agent communication language，其中包含二十个 performatives、两种 content languages，以及一组 interaction protocols：contract net、subscribe/notify、request-when。它之所以从工业界淡出，是因为 ontology 开销对 web 来说过于沉重，但 LLM 推动的 multi-agent systems 复兴，正在悄悄地重新实现同样的思想，只是没有 formal semantics：JSON contracts 取代 performatives，natural language 取代 ontologies。本课会认真解读 FIPA-ACL，让你看清 2026 年的 protocol 决策中，哪些是重新发明，哪些是真正的新东西，以及当前浪潮将在哪里重新发现 2000 年代已经解决过的问题。

**Type:** 学习
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 01（Why Multi-Agent）
**Time:** ~60 分钟

## 问题

2026 年的 agent-protocol 领域非常拥挤：用于工具的 MCP、用于 agents 的 A2A、用于企业审计的 ACP、用于去中心化信任的 ANP、用于 natural-language content 的 NLIP，再加上 CA-MCP 和二十多个研究提案。每个 spec 都宣称自己是基础性的。

诚实地看，其中大多数都在重新发现一棵非常具体、已有二十年历史的决策树。Austin（1962）和 Searle（1969）的 speech-act theory 给了我们“utterances are actions”。KQML（1993）把它变成了 wire protocol。FIPA-ACL（2000 年批准）给出了参考级标准化：二十个 performatives、content languages SL0/SL1，以及用于 contract-net 和 subscribe-notify 的 interaction protocols。JADE 和 JACK 是 Java 参考平台。这个努力在 2010 年前后淡出，因为 ontology 开销太重，而 web 正在赢得主导地位。

当你看到 MCP 的 `tools/call`、A2A 的 task lifecycle，或 CA-MCP 的 shared context store 时，你看到的是 FIPA 决策的一种更柔和、JSON-native 的重述。了解这段传承会告诉你两件事：哪些新的“创新”其实是重新发明，以及新的 specs 将重新发现哪些旧的 failure modes。

## 概念

### 用一段话理解 Speech acts

Austin 注意到，有些句子并不是在描述世界，而是在改变世界。“I promise.” “I request.” “I declare.” 他把这些称为 performative utterances。Searle 将其形式化为五类：assertive、directive、commissive、expressive、declarative。KQML（Finin et al., 1993）把这套思想操作化到 software agents：一条 message 是一个 performative（动作）加上 content（动作所指向的内容）。FIPA-ACL 修补了 KQML 的缺口，并围绕二十个 performatives 做了标准化。

### 二十个 FIPA performatives（部分列表）

| Performative | Intent |
|---|---|
| `inform` | “我告诉你 P 为真” |
| `request` | “我请求你执行 X” |
| `query-if` | “P 是否为真？” |
| `query-ref` | “X 的值是什么？” |
| `propose` | “我提议我们执行 X” |
| `accept-proposal` | “我接受该 proposal” |
| `reject-proposal` | “我拒绝该 proposal” |
| `agree` | “我同意执行 X” |
| `refuse` | “我拒绝执行 X” |
| `confirm` | “我确认 P 为真” |
| `disconfirm` | “我否认 P” |
| `not-understood` | “你的 message 无法 parse” |
| `cfp` | “针对 X 发出 proposals 征集” |
| `subscribe` | “当 X 变化时通知我” |
| `cancel` | “取消正在进行的 X” |
| `failure` | “我尝试了 X，但失败了” |

完整列表在 `fipa00037.pdf`（FIPA ACL Message Structure）中。重点不是记住它，而是这些内容中的每一个，都对应着 LLM protocol 最终会重新添加的一个 primitive。

### 规范的 FIPA-ACL message

```
(inform
  :sender       agent1@platform
  :receiver     agent2@platform
  :content      "((price IBM 83))"
  :language     SL0
  :ontology     finance
  :protocol     fipa-request
  :conversation-id   conv-42
  :reply-with   msg-17
)
```

七个字段承载 protocol envelope；一个字段（`content`）承载 payload。其余字段正是你每次给 JSON protocol 加上 retries、threading 和 ontology 时都会重新发明的东西。

### 两个 legacy platforms

**JADE**（Java Agent DEvelopment framework，1999–2020s）是使用最广泛的 FIPA-compliant runtime。Agents 继承一个 base class，交换 ACL messages，在 containers 内运行，并使用 “behaviors” 协调。interaction-protocol library 随附 contract-net、subscribe-notify、request-when 和 propose-accept。

**JACK**（Agent Oriented Software，商业）强调在 FIPA messages 之上的 BDI（Belief-Desire-Intention）推理。更形式化，但采用更少。

两者都在 web stack 吞掉 multi-agent use cases 后走向衰落。MCP 和 A2A 是 2026 年的 runtime “containers”。

### FIPA 为什么淡出

- **Ontology 开销。** FIPA 要求使用 shared ontology 来 parse `content`。就 ontologies 达成一致是一个历时数年的标准化过程。web 只是使用 HTTP + JSON。
- **没人使用的 formal semantics。** SL（Semantic Language）提供了严格的 truth conditions，但多数 production systems 使用 free-form content，并忽略 formalism。
- **Tooling lock-in。** JADE 只支持 Java；JACK 是商业产品。Polyglot teams 绕开了两者。
- **internet 赢下了 stack。** REST，随后是 JSON-RPC，再后来是 gRPC，取代了 ACL 的 transport。

### LLM 复兴是 FIPA-lite

比较一个 FIPA `request` 与一个 MCP `tools/call`：

```
(request                                {
  :sender  agent1                         "jsonrpc": "2.0",
  :receiver tool-server                   "method":  "tools/call",
  :content "(lookup stock IBM)"           "params":  {"name":"lookup_stock",
  :ontology finance                                   "arguments":{"symbol":"IBM"}},
  :conversation-id c42                    "id": 42
)                                        }
```

同样的 envelope，不同的 syntax。两者都承载：谁、给谁、intent、payload、correlation id。二者相互之间都不是革命，而是在同一设计上的不同 trade-offs。

Liu et al. 的 2025 年 survey（“A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP”，arXiv:2505.02279）明确指出了这条传承：MCP 对应 tool-use speech acts，A2A 对应 agent-peer speech acts，ACP 对应 audit-trail speech acts，ANP 对应 decentralized-identity extensions。新的 specs 是 ACL 的后代，只是采用 JSON syntax 和更宽松的 semantics。

### 直白地说明 trade-off

**FIPA 给了你、而现代 specs 放弃的东西：**

- Formal semantics：你可以证明 `inform` 意味着 sender 相信 content。
- 一个规范的 performatives 目录：你不必重新争论“我们是否应该有一个 `cancel`？”。
- 数十年的 interaction-protocol patterns：contract-net、subscribe-notify、propose-accept，并且有已知的 correctness properties。

**现代 specs 给了你、而 FIPA 没有的东西：**

- 与所有现代工具兼容的 JSON-native payloads。
- LLMs 无需 hand-coded ontology 即可解释的 natural-language content。
- Web-stack transport（HTTP、SSE、WebSocket）。
- 通过 self-describing documents 做 capability discovery（MCP `listTools`、A2A Agent Card）。

更宽松的 intent semantics，换来更容易的实现。这就是准确的 trade。

### 值得移植的 Interaction protocols

FIPA 随附了约 15 个 interaction protocols。其中三个值得带入 LLM multi-agent systems：

1. **Contract Net Protocol (CNP)。** Manager 发出 `cfp`（call for proposals）；bidders 用 `propose` 响应；manager 接受/拒绝。这是规范的 task-market pattern（Phase 16 · 16 Negotiation）。
2. **Subscribe/Notify。** Subscriber 发送 `subscribe`；publisher 在 topic 变化时发送 `inform`。这就是 2026 年的每个 event-bus。
3. **Request-When。** “当 condition Y 成立时执行 X。”带 pre-conditions 的 delayed-action。2026 年的 analog 是 durable workflow engines 中的 deferred tasks（Phase 16 · 22 Production Scaling）。

每一个都能清晰映射到现代 message queues、HTTP + polling，或 SSE streaming。

### 放弃 ontology 后会出什么问题

没有 shared ontology，agents 会从 natural-language content 推断含义。2026 年有文档记录的 failure mode 是 **semantic drift**：两个 agents 用同一个词（`"customer"`）表示略有不同的概念，receiver 的 agent 按错误解释行动，而没有 schema validator 能捕获它。FIPA 的 ontology 要求会在 parse time 拒绝该 message。

不走完整 ontology 路线的缓解措施：

- `content` 上的 JSON Schema：在 wire 层拒绝结构错误。
- Typed artifacts（A2A）：拒绝错误的 modality。
- envelope 中的显式 performative：即使 content 是 natural language，也能让 intent 明确无歧义。

### 2026 specs 映射到 speech-act heritage

| Modern spec | FIPA analog | What it keeps | What it drops |
|---|---|---|---|
| MCP `tools/call` | `request` | explicit intent、correlation id | formal semantics、ontology |
| MCP `resources/read` | `query-ref` | explicit intent、correlation id | formal semantics |
| A2A Task lifecycle | contract-net + request-when | async lifecycle、state transitions | formal completeness guarantees |
| A2A streaming events | subscribe/notify | async push | typed-predicate subscription |
| CA-MCP shared context | blackboard（Hayes-Roth 1985） | multi-writer shared memory | logical consistency model |
| NLIP | natural-language content | LLM-native | schema |

从上到下阅读这张表，模式是：保留 structural primitive，放弃 formalism，让 LLMs 掩盖歧义。

## 构建它

`code/main.py` 实现了一个 pure-stdlib FIPA-ACL translator。它编码和解码规范的 ACL envelope，并展示每一种 MCP / A2A message shape 如何归约为同样的七个字段。这个 demo：

- 将五条 MCP-style 和 A2A-style messages 编码为 FIPA-ACL。
- 将 FIPA-ACL 解码回现代等价形式。
- 使用 `cfp`、`propose`、`accept-proposal`、`reject-proposal`，在一个 manager 和三个 bidders 之间运行一个玩具版 Contract Net negotiation。

运行：

```
python3 code/main.py
```

输出是一段 side-by-side trace，展示每条现代 message 的 2026 JSON 形式和 FIPA-ACL 形式，然后展示一次 contract-net bid 的 round-trip。同样的 protocol primitives 在 round-trip 中保留下来；差异只在 syntax。

## 使用它

`outputs/skill-fipa-mapper.md` 是一个 skill，它会读取任意 agent-protocol spec 并生成 FIPA-ACL mapping。在采用新 protocol 之前，用它回答：“这真的是新东西，还是带 JSON syntax 的 `inform`？”

## 交付它

不要把 FIPA-ACL 带回来。把它的 checklist 带回来：

- 每条 message 的 intent primitive（performative）是什么？
- 是否有用于 request-response 和 cancellation 的 correlation id？
- 是否有显式 content language（JSON-RPC、plain text、structured typed artifact）？
- Interaction protocols 是 first-class，还是你在从头重新实现 contract-net？
- 当两个 agents 对 content meaning 存在分歧（semantic drift）时会发生什么？

在把任何新 protocol 交付到 production 之前，先记录这五个问题。

## 练习

1. 运行 `code/main.py`。观察 round-trip encoding。识别哪个 FIPA performative 对应 `tools/call`、`resources/read` 和 A2A task creation。
2. 用一个 `cancel` performative 扩展 contract-net demo，让 manager 可以在 bid 过程中撤回 task。`cancel` 解决了 retries 本身无法解决的哪类 failure case？
3. 阅读 FIPA ACL Message Structure（http://www.fipa.org/specs/fipa00037/）第 4.1–4.3 节。选择一个本课未覆盖的 performative，并描述它的现代 JSON-RPC analog。
4. 阅读 Liu et al., arXiv:2505.02279。分别针对 MCP、A2A、ACP、ANP，列出它们保留和放弃的 FIPA performative families。
5. 为你自己系统中 `request` performative 的 `content` 字段设计一个最小 JSON-Schema。与纯 natural-language 相比，这个 schema 给了你什么，又带来了什么成本？

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Speech act | “一种会做事的 utterance” | Austin/Searle：把 utterances 视为 actions。ACL 的理论源头。 |
| FIPA | “那个老 XML 东西” | IEEE Foundation for Intelligent Physical Agents。2000 年标准化了 ACL。 |
| ACL | “Agent Communication Language” | FIPA 的 envelope format：performative + content + metadata。 |
| Performative | “那个动词” | 一条 message 的 intent class：`inform`、`request`、`propose`、`cfp` 等。 |
| KQML | “FIPA 的前身” | Knowledge Query and Manipulation Language（1993）。更简单，范围更窄。 |
| Ontology | “共享词汇表” | 对 content language 所谈论概念的 formal definition。 |
| SL0 / SL1 | “FIPA content languages” | Semantic Language levels 0 and 1，即 formal content language family。 |
| Contract Net | “Task market” | Manager 发出 cfp；bidders propose；manager accepts。规范的 interaction protocol。 |
| Interaction protocol | “Messages 的模式” | 一组具有已知 correctness 的 performatives 序列：request-when、subscribe-notify 等。 |

## 延伸阅读
- [Liu et al. — A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP](https://arxiv.org/html/2505.02279v1) — 将现代 specs 与 FIPA heritage 连接起来的规范 2025 survey
- [FIPA ACL Message Structure Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) — 2000 年批准的 envelope format
- [FIPA Communicative Act Library Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) — 完整的 performative catalog
- [MCP specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25) — `request`/`query-ref` 的现代 tool-use 等价形式
- [A2A specification](https://a2a-protocol.org/latest/specification/) — contract-net 和 subscribe-notify 的现代 agent-peer 等价形式
