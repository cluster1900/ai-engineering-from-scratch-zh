# 废弃而非移除：Roots、Sampling 与 Logging (Deprecated, Not Removed: Roots, Sampling, and Logging)

> 在 MCP 2026-07-28 规范中，“已废弃”绝不等于“已删除”：Roots、Sampling 和 Logging 依然完全可以像以往一样响应，仅仅是启动了为期十二个月的废弃倒计时。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 14
**Time:** ~45 minutes

## 学习目标

- 依据 MCP 特性生命周期（Feature Lifecycle）清晰区分“已废弃（Deprecated）”与“已移除（Removed）”特性，理解至少十二个月的废弃缓冲期以及最早移除日期的计算逻辑
- 追踪 Roots 与 Sampling 如何演进为 MRTR 模式下的输入请求，并受到调用方必须在当前请求上显式声明的客户端能力的严格约束
- 阐明为何日志机制迁移为逐请求携带的 `io.modelcontextprotocol/logLevel` 元数据键，以及服务端在何种时机获准或严禁发送 `notifications/message`
- 掌握各类已废弃特性的明确迁移路径：Roots、Sampling、Logging、动态客户端注册（DCR）、受限作用域的 `includeContext` 以及旧版 HTTP+SSE 传输
- 准确识别 2026-07-28 规范彻底删除的少数方法（如 `logging/setLevel` 与 `notifications/roots/list_changed`），并解释为何无状态核心架构无法保留它们

## 问题背景

如果考生将“已废弃”盲目等同于“已删除”，就会在 MCPA 考试的某类特定考题上失分；而如果将其视作“可以随意忽略的永久垫片”，则会在另一类考题上摔跟头。MCP 2026-07-28 规范在一次修订中同时宣布废弃了三大面向客户端的完整特性：Roots、Sampling 与 Logging；但与此同时，该版本以更彻底的决断直接删除了另一组完全不同的少数方法。这两份清单绝无重叠，而考试恰恰聚焦于这一认知分水岭。如果某次工具调用返回 `input_required` 结果并向客户端索取 `roots/list` 或 `sampling/createMessage`，在今天这完全属于合规的 2026-07-28 标准通信流量，甚至在法定最早移除日期到来的数月或数年之内都依然有效。然而，若某个请求依然尝试调用 `logging/setLevel`，则会直接收到冷酷的“方法不存在”报错，因为该消息深度依附于无状态核心早已彻底拔除的连接级会话状态。准确判定某个特性究竟归入哪一个分类并洞悉背后的根本动因，正是本课要训练的核心工程素养。

## 核心概念

MCP 规范中的每一项技术特性，必定处于以下三种生命周期状态之一：活跃（Active）、已废弃（Deprecated）或已移除（Removed）。“活跃”意味着按照当前版本的规范文本进行标准实现，与协议中的其他现行特性毫无二致。“已废弃”意味着该特性依然完整保留在规范正文中且功能完全可用，但核心维护团队（Core Maintainers）已决议最终将其移除，并已同步公开发布了明确的迁移路径。“已移除”则意味着该特性已从草案规范中彻底抹去，且不会出现在下一个正式版本中，仅在最后包含它的历史归档版本中可供查阅。任何被标记为“已废弃”的特性均享有自首次标记该状态的版本发布之日起，至少十二个月的法定缓冲窗口，在此窗口期满之前甚至不具备被移除的资格；而真正的最终移除日期是核心维护团队在后续版本发布筹备时做出的独立决议，该日期可能远晚于缓冲窗口关闭之时，甚至可能永不移除。Roots、Sampling 与 Logging 是在 2026-07-28 规范发布时由 SEP-2577 正式宣告废弃的，因此它们最早的合法移除时机是在 2027-07-28 当天或之后发布的第一个规范修订版，绝非恰好卡在该日历当天，也绝非该日期前偶然发布的任何小版本。

SEP-2577 之所以将这三项特性捆绑推进，是因为它们呈现出相同的结构性共性：极低的真实生产采纳率与沉重的实现维护代价形成鲜明反差。Roots 原语仅仅向服务端提供参考性的目录路径提示，服务端从未被强制要求遵从，且极少有客户端在界面中完整实现了目录选择器。Sampling 允许服务端借用客户端的模型推理能力，但要合规落地，客户端必须构建复杂的人在回路（HITL）审查界面、模型路由逻辑，以及自 2025-11-25 起要求的全套工具调用循环，这使得社区生态的采纳率长期低迷。Logging 则与所有现代运行时自带的基建完全重叠：在 stdio 传输下直接输出到 `stderr`，在网络服务下由 OpenTelemetry 全面接管。这三者从未真正触及 MCP 赖以立足的资源、工具与 Prompt 核心基石，因此将它们废弃可以在丝毫不削弱协议核心能力的前提下，大幅收窄协议的实现复杂度。

Roots 与 Sampling 在网络报文上依然完整保留了原始的数据结构，改变的仅仅是传输交付机制。在 2026-07-28 之前，服务端是在活跃连接上直接将 `roots/list` 或 `sampling/createMessage` 作为反向请求推送给客户端。无状态核心彻底废除了反向长连接，因此这两个请求如今与所有其他服务端向客户端索取输入的场景一样，完全借助多轮往返请求（MRTR）机制进行交付：作为 `InputRequiredResult` 中 `inputRequests` 字典的某个条目，由客户端在分配了全新 JSON-RPC ID 的重试请求中完成应答。

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "workspace_roots": {"method": "roots/list"},
      "workspace_summary": {
        "method": "sampling/createMessage",
        "params": {
          "messages": [
            {"role": "user", "content": {"type": "text", "text": "Summarize this workspace in one sentence."}}
          ],
          "maxTokens": 100
        }
      }
    },
    "requestState": "summarize-workspace:v1"
  }
}
```

请注意，除非客户端在当前请求的 `io.modelcontextprotocol/clientCapabilities` 中显式声明了对应的能力（`roots: {}` 或 `sampling: {}`），否则服务端绝不被允许在 `inputRequests` 中塞入上述方法。若服务端在业务上强依赖该能力而客户端未声明，服务端必须直接返回错误码 `-32021` 并在 `data.requiredCapabilities` 中列出缺失项，这与前序能力协商的门禁规则完全一致。客户端的应答方式则是使用全新 ID 发起原始调用的重试，在 `params.inputResponses` 中使用相同的键名承载答案，并将 `params.requestState` 逐字节原样回传。

Sampling 请求中依然可以携带 `includeContext`，但其历史枚举值 `"thisServer"` 与 `"allServers"` 也已分别被单独废弃。该字段默认值始终为 `"none"`，因此最稳妥规范的做法是直接省略该字段，而非画蛇添足去设置已废弃的值。

Logging 的废弃机制则有所不同，因为该特性在底层通信中包含了两种截然不同的行为模式，而其中仅有一种得以幸存。得以幸存的部分属于**逐请求控制**：客户端可以在单个请求的 `_meta` 中附加 `io.modelcontextprotocol/logLevel`，服务端仅被允许在该特定请求的专属响应流中、在返回最终业务结果之前，发送不低于该严重级别的 `notifications/message` 通知；若请求中未携带该键，服务端严禁发送任何此类日志通知。

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/message",
  "params": {
    "level": "warning",
    "logger": "diagnostics",
    "data": {"message": "cache subsystem degraded"}
  }
}
```

彻底未能幸免的部分是**全局环境配置**：旧版规范中客户端曾通过发送一次 `logging/setLevel` 来改变整个连接后续所有消息的日志级别，直到再次显式更改。这只有在长连接具备跨请求状态记忆能力时才讲得通。无状态核心没有任何地方可以用来挂载连接级日志级别，因此 `logging/setLevel` 绝不仅仅是“已废弃”，而是**已被彻底删除**：现代服务端根本没有注册该方法的处理器，收到后会直接返回错误码 `-32601`（Method not found），这与收到任何未定义方法名的行为完全一致，绝非工具执行错误，也绝非 `-32602`。

除上述三者外，还有两项机制同样位列废弃注册表中。动态客户端注册（DCR）正逐步让位于基于客户端 ID 元数据文档（Client ID Metadata Documents）的轻量方案；初代公开发布版中的 HTTP+SSE 传输协议正全面让位于 Streamable HTTP。这两项同样遵循铁律：依然属于有效规范，在现实中可能偶遇，并受到相同的十二个月缓冲窗口保护。考试中极具杀伤力的干扰项就是将上述全部归入“已删除”。事实并非如此。2026-07-28 规范真正**彻底删除**的，其实是一份简短而截然不同的清单：`initialize` 握手与 `notifications/initialized` 通知、`Mcp-Session-Id` 与会话级 HTTP 端点、`ping` 心跳、`resources/subscribe` 独立订阅、`logging/setLevel`、`notifications/roots/list_changed`、`Last-Event-ID` 与 SSE 断线续传、MRTR 体系之外的所有服务端反向推送请求、`tasks/result` 与 `tasks/list`，以及绑定在 `notifications/elicitation/complete` 上的 URL 模式引导字段。上述被彻底抹去的项无一出现在废弃清单中，因为从定义上讲，废弃注册表记录的必定是依然健在、尚待迁移的活特性。

最后必须点出的一项结构不对称性，完美解释了为何 `notifications/roots/list_changed` 会被彻底删除，而 Roots 原语本身却仅被列为废弃。该通知原本用于由客户端主动告知服务端其暴露的根目录发生了变动，属于客户端向服务端的反向主动推送。然而 MRTR 用“请求-重试”模式彻底取代了所有的服务端反向推送，且 2026-07-28 规范保留的唯一长效监听信道是 `subscriptions/listen`，该信道由客户端单向挂靠在服务端上，绝不支持反向建立。一旦底层通信模型彻底拔除了客户端向服务端发送非邀推送通道，该变更通知便在物理上失去了传播载体，无论废弃与否都无法存活，因而必然伴随旧连接模型的消亡而被连根拔除。

```figure
mcpa-15-deprecation-timeline
```

## 交互式实验

本节图示清晰展现了一条跨越 2026-07-28 发布日及一年后最早移除日期的完整时间轴，分别为 Roots、Sampling 与 Logging 设立了并行泳道：从被宣告废弃之日起至当前时间为实线色块，随后逐渐过渡为超越最早移除标记的虚线色块，因为“具备移除资格”绝不等于“已排期执行移除”。在时间轴下方，两列对比表格清晰列出了两类截然不同的协议元素：左侧是依然活跃在网络中的现有合法特性（`roots/list`、`sampling/createMessage` 以及搭配 `notifications/message` 的逐请求 `logLevel`），右侧则是已被彻底抹除的历史遗迹（`logging/setLevel` 与 `notifications/roots/list_changed`）。请注意观察，实线色块在穿越最早移除标记后仍在向前延续，因为唯有核心维护团队在发布版本时的正式决议，而非机械的日历翻页，才能决定特性的最终命运。

## 实战演练

打开 `code/main.py`。其中的 `advise_migrations` 函数即为实验指南中定义的迁移顾问：传入服务端与客户端的能力声明集合，它能自动诊断出双方正在使用的所有已废弃特性，并逐一列出其对应的 SEP 编号、官方迁移路径，以及基于十二个月缓冲期由 `add_months` 精确推算出的最早合法移除日期。后台构建的 `Server` 暴露了两个代表性工具：`summarize_workspace` 同时依赖 Roots 与 Sampling：未声明这两项能力的客户端调用时会立刻被 `-32021` 驳回并标明缺失项；声明了双重能力的客户端则会收到包含 `workspace_roots` 与 `workspace_summary` 的 `input_required` 结果，在客户端应答后，使用新 ID 并原样回传 `requestState` 即可顺利拿到最终结果（若篡改了 `requestState` 则会被直接拒绝）。`run_diagnostic` 则无需任何特殊能力：调用时未传日志级别则保持静默；若传入 `logLevel: "info"`，则仅对 info 和 warning 级别触发 `notifications/message`，并自动过滤 debug 级日志；若传入非法级别则抛出 `-32602`。

```bash
python3 code/main.py
```

重点研读输出的最后一段：一个被清晰标注为违规演示的旧时代请求，尝试向同一个现代服务端发送已彻底删除的 `logging/setLevel` 方法，服务端当场返回了代表方法不存在的 `-32601` 协议错误，生动展示了“已废弃”与“已删除”在底层报文响应上的本质区别。

## 交付产物

`outputs/deprecation-migration-guide.md` 是本课交付的单页速查指南：系统解析了生命周期政策下 Deprecated 的法定义务、SEP-2577 三大特性与 DCR 及 HTTP+SSE 的对照表、2026-07-28 规范真正抹除的删除清单，以及今日依然能合规通过网络语法校验器的废弃特性白名单。

## 验证方法

在课程目录下运行测试套件：

```bash
python3 -m unittest discover code/tests
```

测试全面检验了本课阐述的核心主张：Roots、Sampling 与 Logging 均能被准确识别并输出对应的迁移路径与精准推算的最早移除日期；未包含任何废弃特性的纯净能力集不会产生告警；`summarize_workspace` 能准确拦截未声明能力的调用并返回 `-32021`，在能力完备时能正常启动合规的 MRTR 往返循环并在新 ID 和回传状态下成功执行；不匹配的 `requestState` 会被拒绝；`run_diagnostic` 在缺省日志级别时保持静默、在指定级别时仅输出不低于该级别的日志、在遇到未知级别时返回 `-32602`；对于真正被删除的方法，现代服务端严格返回代表方法未定义的 `-32601`。本仓库的通信检查脚本还会依据 2026-07-28 规范核验本课的通信记录：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/15-deprecated-client-features
```

## 项目连接

在 Capstone 综合考核的大型端到端交互中，考生必须能够一眼辨析出某个特性属于“已废弃”还是“已删除”：它依赖 MRTR 实现授权确认的方式，与本课中承载 Roots 与 Sampling 的逻辑如出一辙；且在组装交互报文时，绝不会犯下引入 `initialize` 或 `logging/setLevel` 这类已被彻底删除方法的低级错误。本课实现的迁移顾问分析逻辑，后续同样会被安全策略引擎与审计流水线深度复用。

## 核心术语

| 术语 | 含义 |
|------|------|
| Active（活跃） | 当前规范正式要求并完整定义的技术特性 |
| Deprecated（已废弃） | 仍完整保留并正常运作，但已发布迁移路径且享有至少 12 个月移除缓冲期的特性 |
| Removed（已移除） | 已从规范草案中彻底删除且不再出现在下一代当前版本中的特性 |
| Earliest removal（最早移除日期） | 在特性的法定废弃缓冲期届满当天或之后发布的第一个正式规范修订版 |
| Roots | 曾用于向服务端提供工作区目录提示的废弃客户端特性，现作为 MRTR 输入请求承载 |
| Sampling | 曾允许服务端借用客户端模型推理能力的废弃客户端特性，现作为 MRTR 输入请求承载 |
| `io.modelcontextprotocol/logLevel` | 逐请求携带的 _meta 键，使单次请求有资格接收服务端的 notifications/message |
| `notifications/message` | 服务端仅获准在声明了 logLevel 的请求响应流中下发的日志通知消息 |
| `logging/setLevel` | 用于设置全局连接日志级别的已彻底删除方法，在无状态核心中已无立足之地 |
| SEP-2577 | 在 2026-07-28 规范中统筹废弃 Roots、Sampling 与 Logging 的核心提案 |

## 延伸阅读

- [Roots 规范（已废弃）](https://modelcontextprotocol.io/specification/2026-07-28/client/roots)
- [Sampling 规范（已废弃）](https://modelcontextprotocol.io/specification/2026-07-28/client/sampling)
- [Logging 规范（已废弃）](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/logging)
- [已废弃特性官方注册表](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
- [MCP 特性生命周期与废弃政策](https://modelcontextprotocol.io/community/feature-lifecycle)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 11 与 15 节
- `phases/13-tools-and-protocols/11-mcp-sampling`，深入掌握 Sampling 迁移路径的实现细节
