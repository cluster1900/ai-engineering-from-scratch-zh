# 阅读 MCP 协议规范

> 协议规范是规范性文本（normative text），而非入门教程：MUST 决定了具体实现约束，SHOULD 留出了工程裁量空间，而特性的 Deprecated 状态则明确指出了你还能继续依赖它的确切时间窗口。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 00
**Time:** ~45 minutes

## 学习目标

- 梳理规范的整体结构：掌握哪些部分是所有实现 MUST 必须支持的基石，哪些部分是按需选配的扩展
- 正确理解 RFC 2119 与 RFC 8174 关键字的约束强度，包括小写词汇不具备任何规范性效力的基本规则
- 解释 schema.ts 与 schema.json 之间的从属关系，以及为何 TypeScript 文件是唯一的权威真理来源
- 明确区分修订版本本身的 Draft、Current、Final 状态与具体特性的 Active、Deprecated、Removed 状态
- 能够将变更日志（Changelog）项逆向追溯到提出该变更的 SEP 提案，并根据弃用窗口准确推算 Deprecated 特性的最早移除时间

## 问题背景

本课程中的每一项技术事实，最终都可以追溯到一份核心文档：托管于 modelcontextprotocol.io、基于 TypeScript Schema 构建的官方协议规范。若一个技术团队仅通过二手博客、训练数据落后于当前修订版本的大模型或对旧版本的记忆来学习 MCP，其认知就会逐渐偏离规范的真实要求。而认证考试是严格基于现行规范命制的，绝不会考查过去曾经成立但如今已废弃的旧设定。如果某套实现完美契合 2025-06-18 修订版但从未复核最新规范，它在面对 2026-07-28 规范时依然会出现严重错误。因为旧版本中的 MUST 要求完全可能被全新规则所取代；而曾经处于协议核心地位的特性，也可能在保持行为兼容的同时被打上 Deprecated 标签并附带迁移指引。

阅读协议规范本身就是一项至关重要的专业技能：必须清楚规范性文本（normative text）究竟位于何处、各个关键字对具体实现施加了何种程度的契约约束、整份文档的生命周期状态与单个特性的演进阶段有何区别，以及如何追根溯源至促成该项变更的具体提案（SEP），而不是盲目轻信未经推导的技术摘要。

## 核心概念

MCP 协议规范主要划分为几个核心板块：架构（Architecture）、基础协议（Base Protocol）、版本控制与兼容性（Versioning and Compatibility）、消息模式（Message Patterns）、授权机制（Authorization）、服务端特性（Server Features）、客户端特性（Client Features）以及通用工具（Utilities），其上还可叠加可选扩展。规范概述页面清晰地规定了这些板块的强制性：所有实现 MUST 必须支持基础协议、版本控制以及消息模式；至于其余板块（包括授权机制、服务端特性、客户端特性以及通用工具），实现方 MAY 可以根据应用程序的实际需求自主决定是否实现。这句话本身就极具背诵与记忆价值，因为它划定了合规的底线：一个完全没有资源（Resources）和提示词（Prompts）、仅通过标准输入输出（stdio）提供工具（Tools）且没有任何授权认证的服务端，只要在基础协议、版本控制和消息模式上完全合规，依然是一个符合规范标准的 MCP 服务端。

本课程涉及的每种消息格式，以及考题中涉及的所有消息结构，最终都源于同一个权威文件：规范源码仓库中的 `schema.ts`（TypeScript Schema）。规范网页中的正文叙述只是该 Schema 的可读性解释，并非独立的真理来源；当文字描述与 Schema 定义产生歧义或冲突时，始终以 `schema.ts` 为准。而 `schema.json` 则是为了方便无法直接解析 TypeScript 的外部工具自动构建生成的辅助文件，其自身不具备独立的规范权威。当考题考查某个调用结果或错误对象的精确字段与结构时，Schema 就是唯一权威的答案出处。

协议规范采用的规范性用语遵循 BCP 14 标准（即 RFC 2119 与 RFC 8174 的组合规则）：词汇 MUST、MUST NOT、REQUIRED、SHALL、SHALL NOT、SHOULD、SHOULD NOT、RECOMMENDED、NOT RECOMMENDED、MAY 以及 OPTIONAL，只有在全部大写时才具备严格定义的规范约束力。如果一句话写作小写的 "a client must not batch requests"，它只是一句普通描述，在技术规范层面上没有任何强制约束力；只有将其写为全大写的 MUST NOT 时，才构成不可逾越的硬性禁止。准确把握语意强度必须观察大小写格式，而不能仅看单词本身。MUST 与 MUST NOT 构成了实现方案不可突破的红线；SHOULD 与 SHOULD NOT 代表强烈的默认建议，只有在有明确、充分且已理解的特殊理由时方可偏离；MAY 与 OPTIONAL 则赋予实现方真正的自由选择权，在规范层面上没有倾向性。

协议规范的修订版本（即带有明确日期的整份文档）存在三种宏观状态：Draft（草案）代表正在制定中，尚未准备好供正式采纳；Current（现行版）代表当前正在活跃使用的唯一修订版，目前的 2026-07-28 即属于 Current 状态，它仍可合入向后兼容的小型修正；版本标识符采用 YYYY-MM-DD 的日期格式，代表最后一次合入向后不兼容变更的具体日期，这也是现行版本能够吸收向后兼容修正而无需更改版本名称的原因；Final（终稿）代表已经过去且彻底定稿的历史版本，不会再发生任何更改。由于该协议本质上是完全无状态的，客户端若想探知服务端实际支持哪一版本，无需依赖静态文档推测，只需直接调用规范的入口方法 `server/discover`，即可在通信链路中读取确切答案：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "server/discover",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "supportedVersions": ["2026-07-28"],
    "capabilities": {"tools": {"listChanged": false}},
    "ttlMs": 300000,
    "cacheScope": "public"
  }
}
```

在 Current 现行修订版内部，具体特性（某个消息类型、某项能力声明或某种传输机制）拥有独立于文档宏观状态（Draft/Current/Final）的自身演进状态：Active 代表按规范当前要求完整实现，没有任何移除计划；Deprecated 代表该特性依然拥有完整规范定义且功能完全可用，但已明确记录了迁移路径并被安排在未来移除，新工程实现不应再采纳该特性；Removed 代表该特性已从草案规范中彻底删除，不会再出现在下一个 Current 修订版中。在 2026-07-28 规范中，Roots（根路径）、Sampling（采样）、Logging（日志记录）以及动态客户端注册（Dynamic Client Registration）均处于 Deprecated 状态，而非 Removed：它们仍然严格按规范正常工作，现阶段支持它们的服务端和客户端在后续一段时间内仍可稳定运行。废弃特性注册表（deprecated features registry）是集中列出当前处于 Deprecated 或 Removed 状态的所有特性的官方页面，开发者无需从零散的更新日志中拼接拼图。

特性的废弃政策规定的是时间底线，而非固定时刻表。某项特性在具备移除资格之前，必须在 Deprecated 状态下至少保持整整十二个月，且该十二个月的窗口期是从首次将其标记为 Deprecated 的修订版正式发布之日算起，而非从废弃该特性的提案（SEP）达到 Final 状态的时间算起。该窗口期届满的日期称为该特性的最早移除时间（earliest removal），对应在此时间点或之后发布的第一个 Current 修订版；至于该特性是否真的在该修订版中被删除、推迟到更晚的版本删除，还是在 Deprecated 状态下继续保留更长时间，则是由核心维护者在准备发布新版本时做出的决策。由于 Roots、Sampling、Logging 和动态客户端注册均是在 2026-07-28 发布的版本中首次标记为 Deprecated，因此它们共同的最早移除时间为 2027-07-28 当天或之后发布的第一个修订版。

规范的每一项重大变更（无论是新增特性、破坏性改动还是治理机制调整），都必须经过规范增强提案（Specification Enhancement Proposal, SEP）流程：即存放于 `seps` 目录下的一篇 Markdown 文档，详细阐述变更动机、精确的规范文本、设计考量、后向兼容性以及安全影响。SEP 历经草案（Draft）和评审中（In-Review）状态，最终被接受（Accepted）或拒绝（Rejected）；对于影响通信行为的标准轨道变更，只有在同时具备参考实现和合规测试用例的前提下，提案才能最终达到 Final 状态。扩展轨道（Extensions Track）的 SEP 遵循完全相同的流程，但它描述的是可选扩展，而非协议核心内容。规范中的每条更新日志都会指明产出该变更的对应 SEP 编号；阅读该 SEP 是严谨的工程师和认证考生印证事实、避免被粗浅摘要误导的关键途径。本课所重点阐述的特性生命周期与弃用政策（Active、Deprecated、Removed 规则），本身正是通过 SEP-2596 这一流程提案（Process SEP）完成标准化并达到 Final 状态的。

JSON-RPC 批量调用（Batching）正是制定这套严谨生命周期政策的反面典型：它在 2025-03-26 发布的修订版中被引入，但在紧随其后的 2025-06-18 版本中被直接移除，期间没有任何弃用过渡期。在 2026-07-28 治理框架下，此类剧烈变更被严格禁止，任何移除操作必须首先经历至少十二个月的 Deprecated 状态并提供完整的平滑迁移方案。

```figure
mcpa-01-spec-map
```

## Interactive Lab

上方图表将整套协议规范映射为清晰的树状结构：顶部的根节点延伸出三个标有 MUST 的方框，涵盖基础协议、版本控制和消息模式；另外四个标有 MAY 的方框涵盖授权机制、服务端特性、客户端特性及通用工具。在下方，三枚状态标签勾勒出具体特性的独立生命周期：从 Active 到 Deprecated 再到 Removed，这种状态伴随特性本身演进，独立于整份文档的版本标签。某个板块可以是 MUST 强制支持的，而该板块下具体开放哪些工具或资源，依然完全由服务端的具体实现自主决定。

## Practice Lab

打开 `code/main.py`。该脚本不发起任何外部网络调用，而是将协议规范建模为纯数据结构进行演示：包含废弃特性注册表、按 SEP 编号索引的更新日志以及关键字分类器：

```bash
python3 code/main.py
```

将控制台输出的内容与上文的核心概念相互印证。`classify_requirement` 会解析英文语句并返回其规范性约束强度，直观证明小写形态的相同单词会被归类为 `unspecified`（未作规范）而非 `forbidden`（禁止）；`feature_state` 能够查询 Roots、Sampling 或 JSON-RPC Batching 在特定修订版下究竟属于 Active、Deprecated 还是 Removed；而 `earliest_removal` 则直接基于十二个月的弃用窗口动态计算出 2027-07-28 这一关键节点，避免硬编码；`changelog_lookup` 接受 SEP 编号并返回其关联的变更条目。在脚本结尾，代码模拟发送了 `server/discover` 请求并打印通信往返，同时故意构造了一次错误场景：缺少必需 `_meta` 块的畸形请求，合规的服务端必须坚决拒绝该请求，而绝不能进行主观臆测。你可以在代码的 `DEPRECATED_REGISTRY` 中尝试追加一条带有自定义窗口期的条目，或者调整 `include-context-this-server-all-servers` 所跟随的基准特性，再次运行脚本观察 `earliest_removal` 与 `feature_state` 如何在不改动其他逻辑的情况下动态响应变更。

## Shipped Artifact

`outputs/spec-reading-guide.md` 是本节课交付的单页规范阅读参考指南：收录了 MUST 强制支持项清单、关键字约束强度判定表、修订版状态与特性演进状态的区别定义，以及弃用时间计算规则与确切基准锚点。建议在阅读协议规范原文、与团队讨论技术方案或解答认证考题时，将其作为常备速查清单。

## Verify It

在课程目录下执行单元测试：

```bash
python3 -m unittest discover code/tests
```

这些测试将对本课的核心技术论断逐一验证：确认 MUST 与 MUST NOT 被判定为必需与禁止；相同的小写词汇被判定为未作规范；SHOULD 与 MAY 被判定为建议与可选；SHOULD NOT 与 NOT RECOMMENDED 均判定为不建议；某项特性在其废弃版本之前处于 Active 状态，在其废弃版本发布后处于 Deprecated 状态；只有移除日期而从未经历 Deprecated 阶段的特性绝不会被汇报为现行可用；最早移除时间是基于十二个月的窗口期动态推算而非写死；依附于其他特性的子特性能正确共享其最早移除时间；未知的特性名称能被平稳处理而不抛出未捕获异常；能通过 SEP 编号检索到更新日志且未知 SEP 返回空；查询修订版本能正确区分 Current、Final 或未知状态。此外，仓库自带的通信校验器也会验证本课通信记录是否完全符合 2026-07-28 的交互规范：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/01-reading-the-specification
```

## Capstone Connection

最终的 Capstone 项目将组装一套端到端跑通的完整 2026-07-28 消息交互链路，它默认你在不查阅任何资料的前提下，就能立刻判定某个消息结构、某个错误码或某项特性是否依然处于现行有效状态。本路线后续的所有课程在引用具体页面或 SEP 提案时，都会贯彻本课所讲授的严谨方式：细究关键字约束强度、考察特性生命周期状态，并追溯到制定该规则的底层提案。当面对 Capstone 项目或真实考题中关于某项约束究竟是 MUST 还是 SHOULD、某项功能究竟是 Deprecated 还是 Removed 的考查时，你所运用的正是本课建立的技术准绳。

## Key Terms

| 术语 | 定义 |
|------|------|
| 基础协议 (Base protocol) | 所有合规实现 MUST 必须支持的 JSON-RPC 核心消息格式与交互准则 |
| BCP 14 | RFC 2119 与 RFC 8174 的组合标准，规定 MUST、SHOULD、MAY 仅在全大写时具备规范约束力 |
| schema.ts | 作为所有 MCP 消息结构与数据类型唯一权威真理来源的 TypeScript 文件 |
| 现行修订版 (Current revision) | 当前处于活跃使用状态的唯一规范版本，目前为 2026-07-28 |
| Draft / Current / Final | 规范文档整体所历经的三大演进阶段（草案、现行、终稿） |
| Active (活跃) | 特性当前处于正常规范支持且无任何计划移除的健康状态 |
| Deprecated (已废弃) | 特性功能依然完整可用但已安排移除并附有迁移指引的过渡状态 |
| Removed (已移除) | 特性已从草案规范中彻底删除、不再出现在后续现行版中的终结状态 |
| 最早移除时间 (Earliest removal) | 在 Deprecated 特性的最短窗口期（至少 12 个月）届满当天或之后发布的第一个现行版 |
| SEP | 规范增强提案 (Specification Enhancement Proposal)，用于提案并记录规范变更的 Markdown 文档 |

## Further Reading

- [MCP 规范 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)
- [MCP 规范 2026-07-28：基础协议](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP 规范 2026-07-28：变更日志](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 规范 2026-07-28：已废弃特性](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
- [特性生命周期与弃用政策](https://modelcontextprotocol.io/community/feature-lifecycle)
- [SEP 制定指引](https://modelcontextprotocol.io/community/sep-guidelines)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md` 第 1 节与第 15 节
- 本仓库中的 `phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations`，基于版本演进规则构建合规测试框架
