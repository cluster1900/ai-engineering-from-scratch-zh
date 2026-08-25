# FIPA-ACL 与 Speech Act 的传承

> 在 MCP 之前，在 A2A 之前，已有 FIPA-ACL。2000 年，IEEE Foundation for Intelligent Physical Agents 批准了一种 Agent 通信语言，其中包含二十种 performative、两种内容语言以及一组交互协议，包括 contract net、subscribe/notify 和 request-when。它逐渐淡出业界，是因为 ontology 开销对于 Web 而言过于沉重；但随着 LLM 推动 multi-Agent 系统复兴，业界正在悄然重新实现相同的理念，只是没有采用形式语义：JSON 契约代替 performative，自然语言代替 ontology。本课将认真研读 FIPA-ACL，帮助你看清 2026 年的哪些协议决策属于重新发明，哪些确有新意，以及当前浪潮会在哪些地方再次遇到 2000 年代已经解决的问题。

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 01（为何需要 Multi-Agent）
**Time:** ~60 分钟

## 问题

2026 年的 Agent 协议领域十分拥挤：面向 Tool 的 MCP、面向 Agent 的 A2A、面向企业审计的 ACP、面向去中心化信任的 ANP、面向自然语言内容的 NLIP，此外还有 CA-MCP 和二十多项研究提案。每份规范都宣称自己具有基础性地位。

坦率地说，其中大多数都在重新探索一棵非常具体、已有二十年历史的决策树。Austin（1962）和 Searle（1969）的 Speech-act theory 提出了“话语即行动”。KQML（1993）将这一理念转化为 wire protocol。FIPA-ACL（于 2000 年获批）完成了基准性的标准化工作：二十种 performative、SL0/SL1 内容语言，以及用于 contract-net 和 subscribe-notify 的交互协议。JADE 和 JACK 是 Java 参考平台。到 2010 年前后，由于 ontology 开销过重且 Web 技术栈占据主导，这项工作逐渐式微。

当你观察 MCP 的 `tools/call`、A2A 的任务生命周期或 CA-MCP 的共享 Context 存储时，看到的其实是以更宽松、更原生于 JSON 的方式重述 FIPA 的决策。了解这段传承能让你看清两件事：哪些新的“创新”实际上只是重新发明，以及新规范将重新遭遇哪些旧有失效模式。

## 概念

### 用一段话理解 Speech act

Austin 注意到，有些句子并不是在描述世界，而是在改变世界。“我承诺。”“我请求。”“我宣布。”他将其称为 performative utterance。Searle 将其形式化为五类：assertive、directive、commissive、expressive 和 declarative。KQML（Finin 等，1993）将这一理念落实到软件 Agent：一条消息由 performative（行动）和 content（行动所指的内容）组成。FIPA-ACL 弥补了 KQML 的缺口，并围绕二十种 performative 建立了标准。

### 二十种 FIPA performative（部分列表）

| Performative | 意图 |
|---|---|
| `inform` | “我告诉你 P 为真” |
| `request` | “我请求你执行 X” |
| `query-if` | “P 是否为真？” |
| `query-ref` | “X 的值是什么？” |
| `propose` | “我提议我们执行 X” |
| `accept-proposal` | “我接受该提议” |
| `reject-proposal` | “我拒绝该提议” |
| `agree` | “我同意执行 X” |
| `refuse` | “我拒绝执行 X” |
| `confirm` | “我确认 P 为真” |
| `disconfirm` | “我否认 P” |
| `not-understood` | “你的消息无法解析” |
| `cfp` | “针对 X 征集提案” |
| `subscribe` | “当 X 发生变化时通知我” |
| `cancel` | “取消正在进行的 X” |
| `failure` | “我尝试执行 X，但失败了” |

完整列表位于 `fipa00037.pdf`（FIPA ACL Message Structure）。重点不在于记住它，而在于这些 performative 中的每一种，都对应着 LLM 协议最终会重新加入的一项 primitive。

### 规范的 FIPA-ACL 消息

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

七个字段承载协议 envelope；一个字段（`content`）承载 payload。其余字段恰恰就是你每次为 JSON 协议附加重试、线程关联和 ontology 时都会重新发明的东西。

### 两个传统平台

**JADE**（Java Agent DEvelopment framework，1999–2020 年代）是使用最广泛的 FIPA 兼容 runtime。Agent 扩展一个基类、交换 ACL 消息、在 container 中运行，并通过“behavior”进行协调。其交互协议库内置了 contract-net、subscribe-notify、request-when 和 propose-accept。

**JACK**（Agent Oriented Software，商业软件）强调在 FIPA 消息之上进行 BDI（Belief-Desire-Intention）推理。它更加形式化，但采用率较低。

随着 Web 技术栈吞并 multi-Agent 使用场景，两者都逐渐衰落。MCP 和 A2A 是 2026 年的 runtime“container”。

### FIPA 为何衰落

- **Ontology 开销。** FIPA 要求使用共享 ontology 来解析 `content`。就 ontology 达成共识通常需要持续数年的标准化过程，而 Web 只使用了 HTTP + JSON。
- **无人使用的形式语义。** SL（Semantic Language）提供了严谨的真值条件，但大多数生产系统使用自由形式内容，并忽略了形式化机制。
- **Tooling 锁定。** JADE 仅支持 Java；JACK 是商业软件。多语言团队绕开了二者。
- **Internet 赢得了技术栈竞争。** REST、随后出现的 JSON-RPC，再到 gRPC，取代了 ACL 的传输方式。

### LLM 复兴是轻量版 FIPA

比较 FIPA `request` 与 MCP `tools/call`：

```
(request                                {
  :sender  agent1                         "jsonrpc": "2.0",
  :receiver tool-server                   "method":  "tools/call",
  :content "(lookup stock IBM)"           "params":  {"name":"lookup_stock",
  :ontology finance                                   "arguments":{"symbol":"IBM"}},
  :conversation-id c42                    "id": 42
)                                        }
```

相同的 envelope，不同的语法。两者都承载：谁、发给谁、意图、payload 和 correlation id。二者都不是对另一方的革命性突破，而是同一设计下的不同权衡。

Liu 等人在 2025 年发表的综述《A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP》（arXiv:2505.02279）明确说明了这种传承关系：MCP 对应 Tool 使用类 speech act，A2A 对应 Agent 对等通信类 speech act，ACP 对应审计轨迹类 speech act，ANP 对应去中心化身份扩展。新规范是 ACL 的后代，只是采用了 JSON 语法和更宽松的语义。

### 直截了当地说明这种权衡

**FIPA 提供、现代规范舍弃的能力：**

- 形式语义——你可以证明 `inform` 意味着发送方相信其中的内容。
- 规范的 performative 目录——你不必重新争论“我们是否应该加入 `cancel`？”。
- 数十年的交互协议模式——contract-net、subscribe-notify、propose-accept——并且具备已知的正确性属性。

**现代规范提供、FIPA 未曾提供的能力：**

- 与所有现代 Tool 兼容的 JSON 原生 payload。
- LLM 无需手写 ontology 即可解释的自然语言内容。
- Web 技术栈传输方式（HTTP、SSE、WebSocket）。
- 通过实时 MCP `server/discover` 和 A2A Agent Card 进行能力发现。

以更宽松的意图语义换取更容易的实现。这就是确切的权衡。

### 值得移植的交互协议

FIPA 提供了约 15 种交互协议。其中三种值得带入 LLM multi-Agent 系统：

1. **Contract Net Protocol（CNP）。** Manager 发出 `cfp`（征集提案）；竞标者以 `propose` 响应；Manager 接受或拒绝。这是规范的任务市场模式（Phase 16 · 16 Negotiation）。
2. **Subscribe/Notify。** 订阅方发送 `subscribe`；每当主题变化时，发布方发送 `inform`。这对应 2026 年的每一种 event bus。
3. **Request-When。** “当条件 Y 成立时执行 X。”这是一种具有前置条件的延迟行动。其 2026 年对应形式是持久化 workflow engine 中的延迟任务（Phase 16 · 22 Production Scaling）。

每一种模式都可以清晰映射到现代消息队列、HTTP + polling 或 SSE streaming。

### 舍弃 ontology 后会出现什么问题

没有共享 ontology，Agent 就会根据自然语言内容推断含义。已有记录的 2026 年失效模式是 **semantic drift**：两个 Agent 使用同一个词（`"customer"`）表示略有差异的概念，接收方 Agent 按错误解释采取行动，而 schema validator 无法发现问题。FIPA 的 ontology 要求本可在解析阶段拒绝该消息。

无需采用完整 ontology 的缓解方法：

- 对 `content` 使用 JSON Schema——在线路层拒绝结构错误。
- 使用类型化 artifact（A2A）——拒绝错误的 modality。
- 在 envelope 中使用显式 performative——即使 content 是自然语言，也能使意图明确无歧义。

### 2026 年规范与 Speech-act 传承的映射

| 现代规范 | FIPA 对应项 | 保留内容 | 舍弃内容 |
|---|---|---|---|
| MCP `tools/call` | `request` | 显式意图、correlation id | 形式语义、ontology |
| MCP `resources/read` | `query-ref` | 显式意图、correlation id | 形式语义 |
| A2A Task 生命周期 | contract-net + request-when | 异步生命周期、状态转换 | 形式化完备性保证 |
| A2A streaming event | subscribe/notify | 异步推送 | 类型化谓词订阅 |
| CA-MCP 共享 Context | blackboard（Hayes-Roth 1985） | 多写入方共享 memory | 逻辑一致性 Model |
| NLIP | 自然语言内容 | LLM 原生 | schema |

从上到下阅读此表，可以看到一种模式：保留结构 primitive，舍弃形式化机制，让 LLM 掩盖歧义。

```figure
sw-contract-net
```

## 构建它

`code/main.py` 实现了一个纯 stdlib 的 FIPA-ACL 转换器。它对规范 ACL envelope 进行编码和解码，并展示每种 MCP / A2A 消息形式如何归约为相同的七个字段。该 Demo：

- 将五种 MCP 风格和 A2A 风格的消息编码为 FIPA-ACL。
- 将 FIPA-ACL 解码回对应的现代形式。
- 使用 `cfp`、`propose`、`accept-proposal` 和 `reject-proposal`，在一个 Manager 与三个竞标者之间运行一个简单的 Contract Net 协商。

运行：

```
python3 code/main.py
```

输出是并排显示的 trace，先以 2026 JSON 形式和 FIPA-ACL 形式展示每条现代消息，再对 contract-net 竞标执行一次 round-trip。相同的协议 primitive 在 round-trip 后依然保留，只有语法发生变化。

## 使用它

`outputs/skill-fipa-mapper.md` 是一个 Skill，可读取任意 Agent 协议规范并生成 FIPA-ACL 映射。在采用新协议前使用它，以回答：“这确实是新东西，还是只采用了 JSON 语法的 `inform`？”

## 交付它

不要复活 FIPA-ACL。应当复用它的检查清单：

- 每条消息的意图 primitive（performative）是什么？
- request-response 和取消操作是否具有 correlation id？
- 是否存在显式内容语言（JSON-RPC、纯文本、结构化类型 artifact）？
- 交互协议是否是一等概念，还是你正在从头重新实现 contract-net？
- 当两个 Agent 对内容含义存在分歧时会发生什么（semantic drift）？

在将任何新协议交付到生产环境前，记录这五个问题。

## 练习

1. 运行 `code/main.py`。观察 round-trip 编码。确定 `tools/call`、`resources/read` 和 A2A 任务创建分别对应哪种 FIPA performative。
2. 为 contract-net Demo 添加一个 `cancel` performative，使 Manager 可以在竞标过程中撤回任务。`cancel` 解决了哪个仅靠重试无法解决的失效场景？
3. 阅读 FIPA ACL Message Structure（http://www.fipa.org/specs/fipa00037/）第 4.1–4.3 节。选择一种本课未涉及的 performative，并描述它在现代 JSON-RPC 中的对应形式。
4. 阅读 Liu 等人的 arXiv:2505.02279。针对 MCP、A2A、ACP 和 ANP，分别列出它们保留和舍弃的 FIPA performative 类别。
5. 为你自己系统中 `request` performative 的 `content` 字段设计一个最小 JSON Schema。与纯自然语言相比，这个 schema 为你提供了什么，又带来了什么成本？

## 关键术语

| 术语 | 人们常说的含义 | 它的实际含义 |
|------|----------------|------------------------|
| Speech act | “一种能够完成某件事的话语” | Austin/Searle：将话语视为行动。ACL 的理论源头。 |
| FIPA | “那个老旧的 XML 东西” | IEEE Foundation for Intelligent Physical Agents。于 2000 年标准化 ACL。 |
| ACL | “Agent Communication Language” | FIPA 的 envelope 格式：performative + content + metadata。 |
| Performative | “动词” | 消息的意图类别：`inform`、`request`、`propose`、`cfp` 等。 |
| KQML | “FIPA 的前身” | Knowledge Query and Manipulation Language（1993）。更简单、范围更窄。 |
| Ontology | “共享词汇表” | 对内容语言所讨论概念的形式化定义。 |
| SL0 / SL1 | “FIPA 内容语言” | Semantic Language 级别 0 和 1——形式内容语言家族。 |
| Contract Net | “任务市场” | Manager 发出 cfp；竞标者提交 propose；Manager 接受。规范的交互协议。 |
| Interaction protocol | “消息模式” | 由 performative 组成且具有已知正确性的序列：request-when、subscribe-notify 等。 |

## 延伸阅读

- [Liu et al. — A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP](https://arxiv.org/html/2505.02279v1) — 将现代规范与 FIPA 传承联系起来的权威 2025 年综述
- [FIPA ACL Message Structure Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) — 于 2000 年获批的 envelope 格式
- [FIPA Communicative Act Library Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) — 完整的 performative 目录
- [MCP specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) — 当前无状态 Tool 使用场景中与 `request`/`query-ref` 对应的规范
- [A2A specification](https://a2a-protocol.org/latest/specification/) — 现代 Agent 对等通信中与 contract-net 和 subscribe-notify 对应的规范
