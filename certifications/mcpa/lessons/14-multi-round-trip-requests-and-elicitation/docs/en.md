# 多轮往返请求与引导确认 (Multi Round-Trip Requests and Elicitation)

> 服务端若在调用中途需要用户确认，绝不会悬挂连接原地等待。它会直接结束当前调用，交付给客户端一份收据凭证，并允许一个全新的独立请求从中断处无缝接续。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 13
**Time:** ~45 minutes

## 学习目标

- 深入阐明为何多轮往返请求（MRTR）彻底取代了服务端主动反向发起的请求（如引导确认 Elicitation、采样 Sampling 与根目录查询 Roots），以及这种架构取舍为水平扩展服务端集群带来的巨大优势
- 将 `InputRequiredResult` 及其后续重试解析为标准的 JSON-RPC 消息交互：熟练处理 `inputRequests`、`inputResponses` 以及必须逐字节原样回显的 `requestState`
- 严格辨析表单模式（Form mode）与 URL 模式（URL mode）引导确认的边界，明确知晓对于敏感机密数据服务端必须强制使用哪种模式
- 仅使用标准库中的 `hmac` 与 `hashlib` 对 `requestState` 实现加密级完整性保护，确保其在不受信客户端流转时绝不可能被伪造或篡改
- 准确识别被篡改、已过期或绑定错位的 `requestState` 异常，并阐述服务端为何必须坚决拒绝这些非法状态

## 问题背景

一个自动化部署工具即将替换某个线上正在运行的服务版本。在真正下发执行之前，它必须要求人类用户明确点击“确认”。在过去的架构设计中，这一看似简单的交互需求实现起来代价极其高昂。

传统的旧模式要求服务端在事件流中持续悬挂保持原始请求连接，同时沿着同一物理连接反向向客户端发送一条独立请求（如 `elicitation/create`）。客户端在第二个请求中返回答案，服务端随后必须将该答案与依然处于阻塞等待状态的第一个请求进行上下文关联匹配。对于单个进程对接单个客户端的单机玩具场景，这种匹配轻而易举：同一个进程在内存中持有连接的两端。然而，一旦服务端部署为由多实例构成的集群，灾难便随之而来：负载均衡器若将用户的确认响应路由到了不同于持有原始调用的另一个后端副本，服务端就不得不引入分布式共享存储层，或者配置将客户端与特定实例死死绑定的粘性会话路由（sticky routing），仅仅为了将属于同一段对话的两次交互强行拼接起来。这两种补丁代价惨重：共享存储引入了新的单点依赖及其自身的可用性与清理难题，而粘性路由则彻底破坏了无状态副本集群赖以生存的负载均衡。

更致命的是，这种沉重开销往往砸在了最普遍的场景上。绝大多数工具调用都是短命的：部署工具自身的业务逻辑在询问“你确定吗”到听到“我确定”之间，根本无需长期驻留内存。前序课程确立的无状态核心早已明确规定：服务端绝不能依赖网络连接在两次请求之间记忆任何状态。旧时代的服务端反向请求从一开始就破坏了这一承诺，因为用户答案能够安全落地的唯一位置，只能是那个依然在原地同步阻塞的单点进程内部。

## 核心概念

多轮往返请求（Multi Round-Trip Requests，SEP-2322）彻底废除了服务端主动反向发起请求的旧模式。在需要补充信息时，服务端不再在悬挂的长连接内发问，而是通过返回一种独特的中间结果直接提前结束本次调用；客户端在搜集齐服务端所需的输入之后，使用全新的独立请求发起重试。整个生命周期分为清晰的四步：第一步，客户端发送请求；第二步，服务端判定缺少信息，以 `resultType: "input_required"` 提前结束该请求；第三步，客户端在本地收集缺失的信息；第四步，客户端重新发起原始请求，本次请求分配了全新的 ID 并携带了答案。第四步的处理完全不依赖于究竟是哪一个服务端副本处理了前序步骤：集群中的任何一个无状态节点均可独立处理，因为接续执行所需的一切上下文均随请求报文自包含传递。

`InputRequiredResult` 包含两个核心字段，该形态的响应中必须至少包含两者之一。`inputRequests` 是一个字典，将服务端自定义的字符串键名映射到具体的请求对象，该对象必须严格是 `elicitation/create`、`sampling/createMessage` 或 `roots/list` 三者之一。服务端绝不能在字典中放入客户端在当前请求中未声明支持的能力类型；若某个工具必定需要人类确认，而调用方并未在 `_meta` 中声明 `elicitation` 能力，唯一合法的响应是直接抛出协议错误 `-32021 MissingRequiredClientCapability` 并在 `data.requiredCapabilities` 中指明缺失项，这正是能力协商课程所立下的铁律。在整个协议体系中，唯有三个客户端请求允许接收 `input_required` 结果：`tools/call`、`prompts/get` 以及 `resources/read`。所有其他请求必须始终以 `complete` 终结。

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "confirm": {
        "method": "elicitation/create",
        "params": {
          "mode": "form",
          "message": "Deploy checkout to production? This replaces the running release.",
          "requestedSchema": {
            "type": "object",
            "properties": {"confirmed": {"type": "boolean", "title": "Confirm deploy"}},
            "required": ["confirmed"]
          }
        }
      }
    },
    "requestState": "eyJwcmluY2lwYWwiOiJ1c2VyLWFsaWNlIn0.9f2c...redacted"
  }
}
```

`requestState` 是让无状态服务端在不保存任何会话内存的前提下无缝接续对话的关键凭证。它是一个对客户端完全不透明的字符串，仅对签发它的服务端具有解密与核验意义。客户端绝不能窥探、解析或修改其中的任何字符；在发起重试时，客户端必须将其逐字节原样回显，若服务端最初未提供则完全省略。由于该字符串经由不受服务端完全信任的客户端中转，规范将其视作潜在被攻击者控制的数据，强制要求必须施加密码级完整性校验（如 HMAC 签名或 AEAD 认证加密），并在校验失败时坚决拒绝。优秀的工业级实践会在该受保护的载荷中强制绑定三项要素，并在每次重试时严格核验：第一，绑定的认证主体（principal），确保属于用户 A 的确认凭据绝不能被攻击者 B 重放；第二，极短的有效期（expiry），确保废弃凭据无法在数天后卷土重来；第三，原始请求关键参数的哈希摘要（digest），确保针对调用 A 签发的确认凭据绝不能被偷梁换柱套用到参数不同的调用 B 上。需要注意的是，这三项检查本身并不能天然保证单次使用（防重放），对于必须严格仅能核销一次的业务，服务端仍需在数据层记录并标记 Nonce。

重试请求本身是一个拥有全新分配的 JSON-RPC ID 的独立请求；它绝不能复用当初收到 `input_required` 的旧 ID，因为它们属于彼此独立的两个网络请求，仅仅碰巧共享相同的 `name` 与 `arguments`。重试请求在 `params` 中追加 `inputResponses` 字典，使用与服务端在 `inputRequests` 中下发的完全一致的键名，其对应的值则为标准的返回对象（`ElicitResult`、`CreateMessageResult` 或 `ListRootsResult`）。

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "deploy_release",
    "arguments": {"service": "checkout", "environment": "production"},
    "inputResponses": {"confirm": {"action": "accept", "content": {"confirmed": true}}},
    "requestState": "eyJwcmluY2lwYWwiOiJ1c2VyLWFsaWNlIn0.9f2c...redacted"
  }
}
```

引导确认（Elicitation）本身分为两种模式。表单模式（Form mode）要求客户端依据 `requestedSchema` 收集结构化数据，且该 Schema 严格限制为扁平的原始类型对象：字符串、数值、布尔值以及单选或多选枚举，严禁嵌套深层对象。URL 模式（URL mode）则将用户引导至一个客户端无需渲染、也无法窥探的外部安全网页，专门用于承载第三方 OAuth 授权或银行支付表单；规范严正指出：针对密码、API Key、Token 或银行卡支付信息，服务端必须强制使用 URL 模式，严禁使用表单模式。每个 `ElicitResult` 均报告三种动作之一：`accept`（表单模式下附带 content 数据）、`decline`（用户明确拒绝）或 `cancel`（用户取消）。在 2026-07-28 规范之前，URL 模式曾引入独立的 `elicitationId`，服务端会在带外流程结束时推送 `notifications/elicitation/complete`，并配套了错误码 `-32042`；新规范已将这三项冗余机制全数废除：MRTR 标配的 `requestState` 重试机制已足够让服务端优雅获悉最终结果，彻底卸下了旧时代的繁冗包袱。

```figure
mcpa-14-mrtr
```

## 交互式实验

本节架构图将客户端与服务端划分为两条并行的处理泳道，并追踪了一次发布部署在两个往返周期中的全景。首个实线箭头代表常规的 `tools/call`；服务端返回的响应以 `input_required` 提前终结了该次调用，而无需悬挂阻塞连接；中间的留白标注了客户端在本地异步搜集人类决策的时间窗口；第二个实线箭头是一个分配了全新 ID 的独立 `tools/call` 请求，携带着 `inputResponses` 以及首个响应中签发的原始 `requestState` 字符串；最终箭头则是标准的 `complete` 成功结果。跨越这道时间缝隙的唯一介质是客户端主动带回的自包含报文，没有任何跨请求的服务端单点内存依赖。

## 实战演练

打开 `code/main.py`。该脚本构建了一个 `DeployServer`，对外暴露了一个在执行真实发布前必定请求人类确认的 `deploy_release` 工具，其底层采用了表单模式的引导确认，并完全依靠标准库的 `hmac` 与 `hashlib` 构建了防篡改的 `requestState`。`mint_request_state` 会对包含主体、按逻辑时钟计算的过期时间，以及由工具名与参数生成的 SHA-256 摘要（`digest_request`）的载荷进行加密签名。`verify_request_state` 使用恒定时间比较函数 `hmac.compare_digest` 重新核验签名，随后依次校验主体、过期时间与参数摘要，并最终核实该令牌的 Nonce 是否已被核销。

```bash
python3 code/main.py
```

运行脚本并观察六种不同的执行走向。首先，一个从未声明 `elicitation` 能力的访客客户端发起调用，在服务端构建其无法处理的 `inputRequests` 之前，便被 `-32021` 协议错误当场拒绝。随后，Alice 批准了部署，重试请求顺利完成并在 `structuredContent.deployed` 中返回 true。接着，Alice 拒绝了另一次部署，重试依然以 `isError: false` 正常完成：因为用户的拒绝属于预期的业务决断，绝非系统故障，服务平稳保留未部署状态。紧接着展示了四组精心设计的负面异常案例（在通信记录中封装为 `violation`，防止语法检查器误判）：第一组故意将 `requestState` 签名的最后一个字符篡改，第二组在凭据超出极短有效期后才发起重试，第三组由恶意用户 Mallory 尝试重放服务端为 Alice 签发的凭据，第四组虽保留了 Alice 的合法凭据，却在重试时暗中将部署环境篡改。这四种违规调用均被服务端识别为工具执行错误并返回 `isError: true` 及清晰的人类可读原因。规范要求服务端必须坚决拒绝未通过验证的非法状态，而本实验选用工具执行错误通道，以便上层大模型能感知原因并尝试自愈（服务端亦可选择重新发起 `input_required` 再次要求确认）。模型据此可以重新发起调用以获取全新的合法凭据，从而避免彻底卡死在晦涩的底层错误中。

## 交付产物

`outputs/mrtr-implementation-checklist.md` 是本课交付的单页实战落地指南：明确界定了服务端返回 `input_required` 时的合规红线与禁区、`requestState` 的加密保护标准实现范式、客户端应尽的逐字节原样回显义务、表单模式与 URL 模式的选型决策树，以及考前必背的核心避坑要点。

## 验证方法

在课程目录下运行测试套件：

```bash
python3 -m unittest discover code/tests
```

测试全面检验了本课阐述的核心主张：初次调用准确返回带有 `inputRequests` 与 `requestState` 的 `input_required`；在新 ID 下携带获批确认的重试能顺利执行并记录部署操作；重试中回传的 `requestState` 逐字节严格一致；用户拒绝确认依然能正常完成且不执行部署；篡改签名、过期凭据、冒充主体以及篡改实参的异常尝试均被严谨地以工具执行错误形式拦截；已被核销的凭据绝无法二次使用；未声明 `elicitation` 能力的客户端绝不会收到它无法处理的 `inputRequests`；缺失必要业务参数属于工具执行错误而非协议错误。本仓库的通信检查脚本还会依据 2026-07-28 规范核验本课的通信记录：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/14-multi-round-trip-requests-and-elicitation
```

## 项目连接

在 Capstone 综合考核的端到端大题中，包含了用于用户授权确认的 MRTR 引导确认交互，其底层正是使用本课构建的加密级 `requestState` 进行保护：强绑定身份主体、过期时限以及请求参数摘要，并在演练中主动对恶意篡改尝试实施拦截。本课建立的认知框架（四步交互循环、必须分配全新 ID、凭据逐字节原样回传，以及协议错误与工具执行错误的分工）是应对综合大题时必须熟稔于心的基石能力。

## 核心术语

| 术语 | 含义 |
|------|------|
| MRTR | 多轮往返请求；通过返回 input_required 替代传统服务端反向请求的无状态交互模式 |
| InputRequiredResult | resultType 为 input_required 的中间结果，携带 inputRequests、requestState 或两者兼具 |
| inputRequests | 将服务端自定键名映射至 elicitation/create、sampling/createMessage 或 roots/list 的字典 |
| inputResponses | 客户端在重试中携带的答案字典，其键名与 inputRequests 完全一致 |
| requestState | 服务端签发的不透明加密状态串，客户端在重试时必须逐字节原样回传，严禁解析篡改 |
| Form mode elicitation | 在通信通道内依据扁平的 requestedSchema 收集结构化表单数据的引导确认模式 |
| URL mode elicitation | 将用户引导至客户端无法窥探的外部安全网页的交互模式，敏感机密数据必须强制使用 |
| ElicitResult action | 用户决策动作：accept（接受）、decline（拒绝）或 cancel（取消），均属正常业务结果 |
| Principal binding | 将 requestState 与经过认证的调用方身份强绑定，彻底杜绝越权凭据重放攻击 |
| Single use enforcement | 服务端对已核销令牌的 Nonce 进行追踪，确保状态凭证绝不可能被二次兑现 |

## 延伸阅读

- [MCP 规范 2026-07-28：多轮往返请求 (MRTR)](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 规范 2026-07-28：引导确认原语 (Elicitation)](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
- [SEP-2322：多轮往返请求标准提案](https://modelcontextprotocol.io/seps/2322-MRTR)
- [SEP-1036：用于安全带外交互的 URL 模式引导确认](https://modelcontextprotocol.io/seps/1036-url-mode-elicitation-for-secure-out-of-band-intera)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 7 与 11 节
- `phases/13-tools-and-protocols/12-mcp-roots-and-elicitation`，从服务端开发视角深入实现引导确认
