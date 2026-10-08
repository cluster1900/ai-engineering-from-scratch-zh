# 模型输入:样本迁移与无状态MRTR

> 规范废弃了面向新设计的样本化特性,并移除了向服务器发送反向请求的通道.`input_required`结果,由客户端 携带模型输出重试原始请求――推理循环在协议层由此转化为显然的,有界且无状态的机制――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources and prompts)
**Time:** ~75 minutes

## 学习目标

- 解释为什么MCP 2026-07-28 放弃了采样,并为新构建的服务器 选择直接集成模型 (直接模型集成) 的默认架构.
- 实现一套兼容工作流,通过多轮往返请求(多轮回路请求,MRTR)承载 `sampling/createMessage`,我知道.
- 在每一个请求中`_meta`项目中注入协议版本和客户端功能.
- 返回`resultType: "input_required"`,并使用全新的JSON-RPC id 重试原始方法──
- 对于`requestState`进行完整性保护,并将其绑定到主体,主要的方法,参数及过期时间.
- 通过能力 校验、人工批准、响应验证和轮次上限,对模型辅助循环进行严格约束.

## 在协议设计之前的结构决策

形如`summarize_repo`工具通常需要两类工作:

1. 确定性工作:列出文件,读取允许访问的文件,校验路径以及组装内容.
2. 模型工作:挑选代表性文件并综合生成摘要――

现在你有两种合法的构建选择.

### 新建服务器:直接集成模型提供方

服务器端自动管理模型选择,凭据配置,调用预算,重试策略以及可观测性.`tools/call`结果.

如果服务器本身是一个托管服务,或者预测模型的表现比借用主机模型更重要,请选择这个方案.

### 现有样本采集工作流:迁移到MRTR

在废弃的过渡期内,样本仍然存在.`sampling/createMessage`反向请求.取而代之,它将该请求内嵌在.`InputRequiredResult`返回中.

只有当使用客户端的模型和凭据是明确的产品硬性需求时,才选择这种兼容的路径――同时应制定移动计划,因为新实现不应采用已被废弃的样本――

## 无状态契约

2026年7月协议规范移除`initialize`交互握手,`notifications/initialized`及`Mcp-Session-Id`过去,我们一直在掌握信息,现在直接由每个请求自行携带:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

服务器会在每个请求上验证协议版本.版本缺失或非字符串类型属于无效参数,返回.`-32602`△不支持的版本字符串返回 `-32022`携带精确的数据数据`{"supported":["2026-07-28"],"requested":"<client version>"}`△若缺失样本能力 则返回`-32021`并将`data.requiredCapabilities`设为`{"sampling":{}}`,我知道.

没有JSON-RPC`id`收件者可以处理它,但既未发出成功响应也未发出错误响应. 在流式HTTP适配层中,已接受的通知会返回无文.`202 Accepted`,我知道.

服务器还必须实现带有准确`supportedVersions`关键,能力,`ttlMs`和 `cacheScope`的`server/discover`方法,以便客户端在调用工具之前能够获取并缓存服务器的契约.`tools`服务器也必须实现强制性.`tools/list`△其确定性`summarize_repo`描述符包含合法的对象 类型 `inputSchema`,我知道.`resultType: "complete"`、服务器身份元数据以及公共缓存提示──

每个成功的现代协议回归结果都包含一个判别器:

- `resultType: "complete"`表示操作已全部完成.
- `resultType: "input_required"`表示客户端必须执行内嵌的输入请求并进行重试.
- 扩展规范可以定义额外结果类型,例如在第13课中任务 扩展增加`"task"`,我知道.

## 单轮 MRTR 交互流程

服务器在处理请求期间无法调用客户端.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "pick_files": {
        "method": "sampling/createMessage",
        "params": {
          "messages": [
            {
              "role": "user",
              "content": {
                "type": "text",
                "text": "Choose three representative files and return a JSON array."
              }
            }
          ],
          "systemPrompt": "Return only the requested value.",
          "modelPreferences": {
            "costPriority": 0.8,
            "intelligencePriority": 0.2
          },
          "maxTokens": 400
        }
      }
    },
    "requestState": "opaque-integrity-protected-value"
  }
}
```

客户验证自己支持样本,应用其审核批准与模型策略,并获取模型响应.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "inputResponses": {
      "pick_files": {
        "role": "assistant",
        "content": {
          "type": "text",
          "text": "[\"README.md\", \"server.py\", \"docs/intro.md\"]"
        },
        "model": "host-model",
        "stopReason": "endTurn"
      }
    },
    "requestState": "opaque-integrity-protected-value",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}}
    }
  }
}
```

这次重试并不是协议会话的延续.`inputResponses`并原封不动地逐字节回显`requestState`,我知道.

 MRTR 仅允许出现`tools/call`,我知道.`prompts/get`和 `resources/read`中──服务器绝不能从无关方法中返回`input_required`,我知道.

## 多轮状态管理

本课需要两次调用模型:

1. `pick_files`返回一个JSON 数组.
2. `summary`返回最终的摘要文字──

由于每次重试只带来了轮回应,服务器需要将当前阶段的数据放入下一个阶段.`requestState`在中.

请将该值视为可能被攻击者控制的数据.

- 经过鉴定权的主体 (经过鉴定权主体) 证实主体),而不是自行声明`clientInfo`其他
- 发起调用原始方法;
- 原始参数的摘要;
- 较短的过期时间;
- 现在的阶段以及经历的中值.

在不需要机密性时可以使用HMAC──当客户端绝对无法读取状态内容时,请使用经过识别权加密(身份验证加密)──遇到签名错误、状态过期、主体变化或参数变化时,直接返回`-32602`,我知道.

客户端绝不能解决或改`requestState`,它唯一的职责是重试时原样传递这个字符串.

## 模型偏好仅供参考

`costPriority`,我知道.`speedPriority`与`intelligencePriority`客户对模型策略的绝对控制权,因此可以完全忽略这些偏好.

如果您还在维护旧版本的样本流程,请将`includeContext`保持为`"none"`△其它下文模式会增加泄露风险,并且本身已经被废弃.

## 安全不变量

对于内嵌的样本请求,客户是唯一的信任界限:

- 当策略要求人工批准时,向用户清楚地显示服务器正在要求模型执行什么操作.
- 限制MRTR轮次上限──否则恶意服务器可能构建无休止的模型消费循环──
- 在将样本应作为文件名,URL或工具输入使用之前,对其进行严格的检查.
- 限制每轮回归字符号和符号数量.
- 拒绝在当前客户端功能中未声明的输入请求──
- 避免让模型输出决定授权鉴定权逻辑.
- 记录发起方法及输入请求密钥,同时避免在日志中输入敏感的快速内容.

`clientInfo`和 `serverInfo`仅用于展示和诊断的数据.

```figure
t3-sampling-flip
```

## 手写实现

`code/main.py`完全实现了双轮回流程:

- `server/discover`返回`supportedVersions`声明工具 支持,并返回缓存提示。
- `tools/list`返回具有对象输入方案的确定性和可缓存的`summarize_repo`描述符.
- `tools/call`校验每个请求的元数据.
- 第一个结果内嵌用于文件选择的`sampling/createMessage`,我知道.
- 第一次重试试模型结果并内嵌第二次请求.
- 受HMAC保护的`requestState`在独立请求之间安全传递执行阶段.
- 最终结果使用`resultType: "complete"`,我知道.

模拟的主机 模型保证了实例的确定性.`fake_host_model`◎服务器侧状态机应始终保持确定性并易于测试──

## 使用与运行

在仓库根目录下运行:

```bash
cd phases/13-tools-and-protocols/11-mcp-sampling/code
python3 main.py
python3 -m unittest discover tests -v
```

预期检查点:

- 发现 带有回归`ttlMs`和 `cacheScope`结果是完全的.
- 工具发现 返回排序同样的描述符,带有 `resultType`、服务器身份与缓存提示────────────
- 缺失能力与不支持版本分别返回精准的`-32021`与`-32022`错误数据.
- 没有 id 的通知 不产生任何 JSON-RPC 响应.
- 请问你的身份`[1, 2, 3]`证明每一个MRTR轮次均完全独立.
- 前两种结果类型为`input_required`,我知道.
- 最终结果类型为`complete`并包含选出的文件以及最终摘要.
- 在重试时改原始参数会导致请求状态校验失败.

## 交付产物

`outputs/skill-sampling-loop-designer.md`现在已经升级为迁移规划器――它首先决定是否应该废弃样本 改用直接模型集成――如果必须保持兼容性,它会产生MRTR 交互轮次、状态绑定、能力 门禁、预算控制、数据校验以及平稳退役方案――

## 课后练习

1. 将文件选择的响应改为无效的JSON字符串.`-32602`而不是盲目信任模型输出.
2. 在初调和重试调之间修改`audience`参数――解释为什么封印后的状态能够阻止跨请求复用――
3. 增加第三轮交互,要求主持人对摘要进行评审批――将保留前面的摘要在签名状态下,并将整个流程严格限制在最多的三轮――
4. 彻底移动 样本:将模拟的主机回调换为服务器自持的模型适配器――列出此时有哪些批准,计费和可观测性职责转移到服务器端――
5. 添加一个过期测试:传入一个已过期的状态值 1 秒,验证校验失败.

## 关键术语

| 术语 | 2026-07-28 中的含义 |
|------|------------------------|
| Sampling | 已弃用特性，用于请求 client 端的模型执行文本补全 |
| MRTR | 多轮往返请求（Multi Round-Trip Requests），用于在请求中获取 client 输入的无状态重试模式 |
| `InputRequiredResult` | 带有 `resultType: "input_required"` 的结果对象 |
| `inputRequests` | Server 分配的映射表，包含内嵌的 elicitation、sampling 或 roots 请求 |
| `inputResponses` | Client 在当前轮次提交的响应，键名与 `inputRequests` 一一对应 |
| `requestState` | 不透明的 server 状态字符串，由 client 原样回显并由 server 校验完整性 |
| `resultType` | 现代 MCP 返回结果中必须包含的类型判别器 |
| 直接模型集成（Direct model integration） | 新建 server 需要模型推理时的官方推荐替代方案 |
| Capability 门禁（Capability gate） | 防止向未声明相应支持的 client 发送内嵌请求的安全规则 |
| 循环预算（Loop budget） | 本次操作允许的最大轮次、token 数、字节数、执行时长以及花费上限 |

## 旧版兼容性

固定在2025-11-25版本的客户端可能仍然在活连接上使用旧式服务器发起`sampling/createMessage`流程──请将该行为严格隔离在版本专用适配器中──切勿将有会话路径作为2026-07-28服务器的基础架构──

官方SDK 可以将现代的`input_required`处理程序转换为适应旧版本对端的通信.

## 延伸阅读

- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP Sampling deprecation](https://modelcontextprotocol.io/seps/2577-deprecate-roots-sampling-and-logging)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
