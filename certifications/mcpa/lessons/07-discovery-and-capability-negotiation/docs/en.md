# 服务发现与能力协商

> 服务端通过 server/discover 自描述一次，但每个请求依然必须实时声明自身的能力：仅凭客户端曾询问过有哪些可用功能，服务端绝不能默认假定客户端具备执行该功能所需的能力。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 06
**Time:** ~45 minutes

## 学习目标

- 熟练解析 `server/discover` 请求及其对应的 `DiscoverResult` 结构：包含 `supportedVersions`、`capabilities`、`instructions`、`serverInfo`、`ttlMs` 与 `cacheScope`
- 深入解释为何实现 `server/discover` 是服务端的 MUST 强制义务，而发起该调用对于客户端而言是 MAY 可选操作
- 深入剖析 `ServerCapabilities` 与 `ClientCapabilities` 的数据结构，并明确各项能力标志位所承诺的具体行为
- 深入解释为何服务端绝不能依赖客户端在单次特定请求中未予声明的能力，以及 `MissingRequiredClientCapabilityError`（错误码 `-32021`）所携带的数据结构
- 完整演示基于 `UnsupportedProtocolVersionError`（错误码 `-32022`）的版本协商重试流程：客户端如何从中提取互通版本并完成调用重试

## 问题背景

在第 06 课中，我们为宿主建立了每个服务端对应一个专属客户端的清晰架构与职责划分，但留下了一个悬而未决的疑问：当客户端初次面对一个此前从未接触过的全新服务端时，如何在没有握手建连对话的前提下，迅速获知该服务端的身份与其具备的能力？第 04 课所阐述的无状态核心已经明确排除了 `initialize` 握手以及在连接层维护长期会话状态的方案。每一个请求依然必须保持自包含与自描述。

这种约束对于通信双方具有双向影响。从客户端视角来看，它需要一种极高效率的方式来探知服务端的身份、其支持的协议版本列表以及所提供服务的能力轮廓，最理想的情况是在一次网络往返中完成全部探知，而不是为了构建全局视野而分别调用 `tools/list`、`resources/list` 与 `prompts/list` 进行三次繁重的探测。而从服务端视角来看，正是由于无法依赖连接状态，服务端绝对不能假定：因为客户端在五个请求之前曾询问过交互索取或采样的格式，该客户端在当前这个调用中就必定愿意且能够处理交互索取请求。这两大问题（探知服务端提供什么与证明客户端当前能接受什么）看似相似但数据流动方向完全相反。2026-07-28 规范通过两种截然不同的机制分别解决了这两个维度的诉求，如果仅粗略浏览字段名称，极易将二者混淆。

## 核心概念

`server/discover` 是解决该问题的第一项核心机制。服务端 **MUST** 强制实现该方法；客户端 **MAY** 自主选择是否调用该方法，或者也可以跳过发现直接发送业务请求并在收到版本不匹配错误时再行自适应处理。该请求在线缆中除了标准的 `_meta` 结构外，不携带任何额外的复杂业务参数：

```json
{
  "jsonrpc": "2.0",
  "id": "discover-1",
  "method": "server/discover",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

其返回结果 `DiscoverResult` 属于 `CacheableResult`（可缓存结果），因此它始终随自身业务字段一起携带 `ttlMs`（缓存存活毫秒数）与 `cacheScope`（缓存作用域，通常为 public 或 private）：包含 `supportedVersions`（供客户端后续请求挑选的受支持版本数组）、`capabilities`（`ServerCapabilities` 对象），以及可选的 `instructions` 字符串（这是面向大模型的自然语言引导，绝非工具描述的简单重复）。服务端的自声明身份则存放在 `result._meta["io.modelcontextprotocol/serverInfo"]` 中，记录服务端自行声称的名称与版本。该字段纯属一种礼貌性声明，绝非防伪安全凭证：它可以用于界面展示、日志审计和排查调试，但绝不能让其主导鉴权或信任决策，因为协议底层并未对该名称提供加密签名防篡改校验。

`ServerCapabilities` 以标志位字典的形式列出服务端所能提供的能力：`tools {listChanged}`、`resources {listChanged, subscribe}`、`prompts {listChanged}`、`completions {}`、`logging {}`（已废弃但依然保留在规范中，第 15 课将深入讨论），以及 `extensions {}`（扩展标识符与配置对象的映射字典，第 30 课的重点）。若某一能力（如 `completions`）对应一个空对象 `{}`，即表示“受支持，无额外高级参数”；若某一字段直接缺失，则表示该服务端完全不支持该项原语。与此对称，`ClientCapabilities` 描述了客户端当前能够承载的能力范围：`elicitation {form, url}` 对应第 14 课的两种交互索取模式；`sampling` 与 `roots`（均已废弃，第 15 课讲解其迁移路径）；以及 `extensions {}`。两者数据结构相仿，命名规则一致，但数据流动方向截然相反。

这里正是未深究规范细节的学习者最容易踩中的认知陷阱：`DiscoverResult.capabilities` 声明的是**服务端**具备的能力，它在发现阶段被回传一次，具备明确的缓存属性，且在 `ttlMs` 提示过期前可以安全复用；但它完全没有定义**客户端**当前能够接受何种输入。客户端的能力是一项必须逐次请求实时确定的事实，必须由每一次发起的具体请求在自身元数据 `_meta["io.modelcontextprotocol/clientCapabilities"]` 中独立声明（无论是 discover 请求还是后续业务请求）。当服务端在执行工具调用中途需要动用某项客户端能力时（例如在执行过程中需要向用户提出表单模式的索取提问），服务端必须严谨检查**当前这一次特定请求**所附带的 `clientCapabilities`，绝对不能依赖服务端记忆中上一次 discover 调用或先前 `tools/call` 中客户端曾出示过的能力值。这就是第 04 课所立下的无状态原则在能力协商领域的严格落地：严禁根据历史请求做任何推论，即使它们位于同一条物理连接上也是如此。

当服务端需要某项能力而当前请求的元数据中未予声明时，服务端将返回 `MissingRequiredClientCapabilityError`：

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "error": {
    "code": -32021,
    "message": "notify_oncall requires a capability this request did not declare",
    "data": {
      "requiredCapabilities": {
        "elicitation": {}
      }
    }
  }
}
```

该错误的 `data.requiredCapabilities` 字段与 `ClientCapabilities` 结构完全一致，精准指明了当前操作所缺失的具体能力类别，使得客户端能够基于明确的缺失项补全声明后重试，而无需盲目猜测。在 HTTP 传输层，该错误对应的状态码为 `400 Bad Request`。

版本选择构成了能力协商的另一半版图，且版本协商完全独立于发现阶段：任何常规请求都可能触发版本协商。若请求中声明的协议版本超出了服务端支持的范围，服务端必须以 `UnsupportedProtocolVersionError` 明确拒绝：

```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "error": {
    "code": -32022,
    "message": "Unsupported protocol version",
    "data": {
      "supported": ["2026-07-28"],
      "requested": "2025-11-25"
    }
  }
}
```

此时客户端应当从 `data.supported` 列表中挑选一个双方均支持的合法版本，使用全新的请求 ID 对原请求发起重试。请特别注意概念区分：在现代 `_meta` 结构中传入一个旧版本的真实版本号字符串，与身为一个“旧时代旧版客户端”完全是两码事。旧版客户端是指发送 `initialize` 握手请求且完全不包含请求级元数据的客户端，那是由消息外层结构决定的时代属性，而非一个纯粹的版本号数字。即使面对来自真正旧版客户端的 `initialize` 请求，纯现代服务端在返回的错误中依然 SHOULD 友好地列出自身支持的现代版本列表，这是旧版客户端唯一能够向人类管理员展示的诊断线索，第 05 课在整套时代模型中反复强调了这一工程实践。

```figure
mcpa-07-discover
```

## Interactive Lab

上方图表以双轨形式直观分离了两种不同的协商机制。顶层泳道展示了 `server/discover` 交互：对客户端而言属于可选调用，通过一次单向往返集中获取支持版本、服务端能力、引导指令以及缓存提示；底层泳道展示了在每次执行 `tools/call` 时的实际表现（无论此前是否执行过服务发现）：服务端对请求自带的 `clientCapabilities` 进行全新的孤立校验。如果请求什么都没声明，依赖交互索取的工具调用将直接返回 `-32021` 错误，并精确点名所缺失的能力；只有在当前请求中明确声明了该项能力，调用才能顺利完成。此前 discover 调用的成功，绝不会自动继承到底层泳道的调用中。

## Practice Lab

打开 `code/main.py`。代码中的 `DeployServer` 实现了 `server/discover` 以及一个设置了门禁的受控工具 `notify_oncall`（其定义明确指出必须具备 `elicitation` 能力才允许执行），同时提供了一个无需任何额外能力的普通工具 `list_incidents`：

```bash
python3 code/main.py
```

按顺序观察终端打印的六组消息交互：第一对往返是一次标准的 `server/discover` 调用，成功返回了 `supportedVersions`、`capabilities`、`instructions` 与缓存提示；第二对往返中，客户端调用 `notify_oncall` 但传入了 `clientCapabilities: {}`，服务端随即返回 `-32021` 错误，其 `data.requiredCapabilities` 清晰指明缺失 `elicitation`；第三对往返中，客户端在请求元数据中补全了 `elicitation` 声明，调用随即平稳成功执行；第四对往返中，客户端调用了一个服务端根本未提供的工具名 `close_all_incidents`，触发了标准的协议级错误 `-32602`，而非能力缺失错误；最后两对往返展示了版本协商全流程：一次尝试请求 `2025-11-25` 版本的 `server/discover` 收到 `-32022` 错误且 `data.supported` 指明仅支持 `["2026-07-28"]`，客户端紧接着切换至该受支持版本并使用全新的请求 ID 发起重试，顺利成功。你可以尝试在某次请求中声明了能力之后，在下一次调用中再次故意省略该能力声明，观察服务端如何坚决拒绝执行，这印证了服务端绝不会产生跨请求的记忆惯性。

## Shipped Artifact

`outputs/capability-negotiation-cheatsheet.md` 是本课交付的单页能力协商速查手册：系统汇总了 `DiscoverResult` 的字段字典、并排对比了 `ServerCapabilities` 与 `ClientCapabilities` 的结构差异、给出了 `-32021` 与 `-32022` 的错误负载范例，并梳理了简明的协商重试五步法则。在构建或排查生产级客户端与服务端的交互协议时，该手册是绝佳的案头参考。

## Verify It

在课程目录下执行单元测试：

```bash
python3 -m unittest discover code/tests
```

测试将对本课的各项论断进行完整检验：确认 `server/discover` 正确返回受支持版本、完备的能力对象、引导文本及缓存提示；确认缺失必需能力的调用返回包含缺失项的 `-32021` 错误；确认在重试请求中补全能力声明后调用能正常完成；确认无特殊要求的工具在空能力声明下亦可正常执行；确认未知工具返回 `-32602` 而未知方法返回 `-32601`；确认版本不匹配报错同时如实列出 `supported` 与 `requested` 字段；确认客户端重试使用全新生成的请求 ID；以及确认完全缺失 `_meta` 的请求被服务端坚决拒绝。通信校验器同样审查测试通信记录是否符合 2026-07-28 规则：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/07-discovery-and-capability-negotiation
```

## Capstone Connection

最终 Capstone 项目的起步动作正是一个标准的 `server/discover` 调用，后续整条交互链路均严格遵守该调用回传的缓存提示；随后的首个关键工具调用，之所以能够顺利执行，完全是因为客户端在该特定请求中精确声明了所需能力；紧接着触发的 MRTR 交互索取流程，也是完全建立在这一精确声明的基础之上。所有这些步骤均直接建立在本课确立的核心分界线上：服务发现自描述服务端，发生一次且具备可缓存性；能力声明自描述客户端，发生在每个请求中且具备实时独立性。

## Key Terms

| 术语 | 定义 |
|------|------|
| `server/discover` | 服务端 MUST 强制实现的标准化请求，用于向外宣告自身版本、能力与身份 |
| `DiscoverResult` | 发现请求的可缓存响应：含 supportedVersions、capabilities、instructions 等 |
| `ServerCapabilities` | 服务端声明自身支持的原语能力集：tools、resources、prompts 等 |
| `ClientCapabilities` | 客户端在单次请求中声明自身当前可接受的能力集：elicitation、sampling 等 |
| `serverInfo` | 服务端自声明的名称与版本字符串，用于日志与展示，不可作为安全凭证 |
| MissingRequiredClientCapabilityError | 错误码 -32021；当前请求未在其元数据中声明执行操作所需的能力时返回 |
| UnsupportedProtocolVersionError | 错误码 -32022；当前请求声明的协议版本服务端无法支持时返回 |
| 逐请求协商 (Per-request negotiation) | 版本与能力数据仅从当前单次请求中实时读取、绝不依赖历史推断的规则 |

## Further Reading

- [服务发现规范：server/discover](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [版本控制与兼容性](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [基础协议概览与 _meta 字段规则](https://modelcontextprotocol.io/specification/2026-07-28/basic/index)
- [Schema 字典参考：DiscoverResult、ClientCapabilities、ServerCapabilities](https://modelcontextprotocol.io/specification/2026-07-28/schema#discoverresult)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md` 第 6 节
