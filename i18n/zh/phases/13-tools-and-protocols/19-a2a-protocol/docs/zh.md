# 代理对代理协议

> MCP是代理与工具交互.A2A (Agent2Agent) 是代理与代理的合作协议.它用于让基于不同框架构建的不透明智能体进行互操作协作.Google于2025年4月发布该协议,同年6月捐赠给Linux基金会,并于2026年4月达到v1.0,包括AWS,Cisco,Microsoft,Salesforce,SAP和ServiceNow在内的150多个支持方块.它吸收了IBM的 ACP,并新增了AP2支付扩展.

**Type:** Build
**Languages:** Python (stdlib, Agent Card + Task harness)
**Prerequisites:** Phase 13 · 06 (MCP 基础), Phase 13 · 08 (MCP Client)
**Time:** ~75 分钟

## 学习目标

- 区分代理到工具 (MCP) 与代理到代理 (A2A) 的应用场景
- 在`/.well-known/agent-card.json`发布包含技能和`supportedInterfaces`据了解,
- 走通完整的任务 生命周期:`TASK_STATE_SUBMITTED`,我知道.`TASK_STATE_WORKING`,我知道.`TASK_STATE_INPUT_REQUIRED`及终态`TASK_STATE_COMPLETED`,我知道.`TASK_STATE_FAILED`,我知道.`TASK_STATE_CANCELED`,我知道.`TASK_STATE_REJECTED`,我知道.
- 使用各部分 仅包含 `text`,我知道.`raw`,我知道.`url`或`data`之一的信息,并使用文物 作为结构化产品输出.

## 问题背景

一个客户代理需要把报告写给一个专门的写作代理.

- 定义REST API:可行,但每组配对都是一次性.
- 共享代码基础:要求两个代理运行在同一框架上.
- 两位代理人在保持各自不透明的内部推理 (Opaque Reasoning) 的同时进行对等协作.

 A2A 填补了这个空白. 它将交互抽象作为一个代理向另一个代理 发送任务,包含显然的生命周期,信息和文物.

 A2A 是让跨框架代理互对话的标准协议. 它不是取代MCP,两者是互补协作的关系.

## 核心概念

### 代理卡 (智能体名片)

每个符合A2A规则的代理都会在`/.well-known/agent-card.json`暴露其名片:

```json
{
  "name": "research-agent",
  "description": "总结学术论文并草拟引用。",
  "version": "1.2.0",
  "supportedInterfaces": [
    {
      "url": "https://research.example.com/a2a",
      "protocolBinding": "JSONRPC",
      "protocolVersion": "1.0"
    }
  ],
  "capabilities": {"streaming": true, "pushNotifications": true},
  "securitySchemes": {
    "bearer": {"httpAuthSecurityScheme": {"scheme": "Bearer"}}
  },
  "securityRequirements": [{"schemes": {"bearer": {"list": []}}}],
  "defaultInputModes": ["text/plain"],
  "defaultOutputModes": ["text/markdown"],
  "skills": [
    {
      "id": "summarize_paper",
      "name": "总结论文",
      "description": "读取论文 PDF，并生成 3 段摘要。",
      "tags": ["research", "summarization"],
      "inputModes": ["text/plain", "application/pdf"],
      "outputModes": ["text/markdown"]
    }
  ]
}
```

发现机制基于URL:拉取名片,选择客户端所支持的第一个 `supportedInterfaces`条目,并枚举其暴露的技能──输入和输出模式均采用标准媒体类型──

### 签名代理卡 (签名的代理卡)

名片可以包含一个`signatures`部分部分都是一个JWS (RFC 7515),针对除`signatures`字段后的名片根据RFC 8785 规范化 JSON 计算生成――使用方式以同样的方式规范化并校验签名,防止假冒伪造――

### 任务生命周期

```text
TASK_STATE_SUBMITTED
  -> TASK_STATE_WORKING
  -> TASK_STATE_COMPLETED | TASK_STATE_FAILED | TASK_STATE_CANCELED | TASK_STATE_REJECTED

TASK_STATE_WORKING
  -> TASK_STATE_INPUT_REQUIRED
  -> TASK_STATE_WORKING (客户端发送携带相同 taskId 的补充消息)
```

客户发起`SendMessage`服务器 创建任务 调用代理 在各个状态流转;客户可通过`GetTask`轮询,或通过`SendStreamingMessage`与`SubscribeToTask`进行 SSE 流式监听――流式事件包含`statusUpdate`与`artifactUpdate`任务 进入终态时关闭连接.规范中没有单独的规则.`final`标志:

### 信息与零件

一条 包含的信息`messageId`,我知道.`role`(`ROLE_USER`或`ROLE_AGENT`) 以及一个或多个部分.**仅包含一个内容字段**該字段名称即為其類型,不再使用`kind`判别字段:

- `text`文本内容:
- `raw`文件二进制流 (在 JSON 中表现为 Base64),通常伴随`filename`和 `mediaType`,我知道.
- `url`文件内容链接:
- `data`编译:结构化 JSON 数据载荷

示例:

```json
{
  "messageId": "msg-001",
  "role": "ROLE_USER",
  "parts": [
    {"text": "总结这篇论文。"},
    {"raw": "...", "filename": "paper.pdf", "mediaType": "application/pdf"},
    {"data": {"targetLength": "3 paragraphs"}, "mediaType": "application/json"}
  ]
}
```

### 产物

任务输出是文物,而不是散发的字符串.

```json
{
  "artifactId": "art-001",
  "name": "summary",
  "parts": [{"text": "...", "mediaType": "text/markdown"}]
}
```

艺术品 支持流式分块传输──每个`artifactUpdate`事件携带产品数据以及`append`和 `lastChunk`标志:

### 三种协议绑定(协议绑定)

1. **JSON-RPC 2.0 over HTTP**(`JSONRPC`):POST 用于请求,SSE 用于流.`SendMessage`,我知道.`SendStreamingMessage`,我知道.`GetTask`,我知道.`ListTasks`,我知道.`CancelTask`,我知道.`SubscribeToTask`,我知道.`CreateTaskPushNotificationConfig`其他
2. **gRPC**(`GRPC`):适用于原生支持gRPC的企业内部环境,具有相同的方法名称.
3. **HTTP+JSON/REST**(`HTTP+JSON`):标准的REST资源路径,如`POST /message:send`和 `GET /tasks/{id}`,我知道.

三种完全一致的数据模型.`supportedInterfaces`条目声明对应的绑定类型与其`protocolVersion`◊客户必须在每一个请求中发送`A2A-Version: 1.0`请求头,否则服务器可能会将其视为旧版本 0.3 处理.

```http
POST /a2a HTTP/1.1
Host: research.example.com
Content-Type: application/json
A2A-Version: 1.0

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "SendMessage",
  "params": {
    "message": {
      "messageId": "msg-001",
      "role": "ROLE_USER",
      "parts": [{"text": "总结这篇论文。"}]
    }
  }
}
```

### 不透明性保留 (隙保留)

核心设计哲学:被调用的代理内部状态是高度不透明的.调用方只能看到任务状态和输出文物;被调用者的思维链 (思维链) 内部工具调用,子代理发发送过程对外界是不可见的.与MCP的工具调用必须完全透明的暴露有根本的区别.

### 与MCP的关系

| 维度 | MCP | A2A |
|---|---|---|
| 使用场景 | Agent-to-tool（智能体调用工具） | Agent-to-agent（智能体间对等协作） |
| 透明度 | 透明的 Tool 调用 | 不透明的内部推理与执行细节 |
| 典型调用方 | Agent Runtime | 另一个外部 Agent |
| 状态模型 | Tool 调用结果（无状态核心） | 具备完整生命周期的 Task |
| 授权鉴权 | OAuth 2.1 | Agent Card `securitySchemes` + `securityRequirements` |
| 传输层 | Stdio / Streamable HTTP | JSON-RPC / gRPC / HTTP+JSON |

当需要调用具体工具时使用MCP;当需要把整个任务委托给另一个智能体时使用A2A――生产环境中往往结合使用:

```figure
a2a-task-lifecycle
```

## 动手实践

`code/main.py`实现基于A2A 1.0.1规范的轻量测试组件:写作 代理发布其名片,研究 代理向其发送带有PDF部分和文本指示的`SendMessage`求职经历`TASK_STATE_WORKING`其他`TASK_STATE_INPUT_REQUIRED`其他`TASK_STATE_WORKING`其他`TASK_STATE_COMPLETED`终于返回文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文本 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文 文

重点观察:

- 代理卡的JSON结构
- 服务器端任务ID 分配与状态转换
- 通过内容字段自判别的部分 结构――
- 任务执行中途的`TASK_STATE_INPUT_REQUIRED`,我知道.
- 终态时返回的艺术品――

## 交付物品

本课交付 `outputs/skill-a2a-agent-spec.md`为了希望被外部调用新代理,它可以生成标准的代理卡JSON、技能 声明规范及端点接入设计.

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| A2A | Agent-to-Agent 协议，用于异构不透明智能体间跨系统对等协作 |
| Agent Card | 暴露于 `/.well-known/agent-card.json` 的名片，公布能力、接口与鉴权 |
| Skill | Agent 所支持的命名功能单元（类似于 MCP 中的 Tool） |
| Task | 具备独立生命周期和产物输出的异步任务委托单元 |
| Message | 承载交互内容的实体，内含纯内容字段标识的 Parts 数组 |
| Part | 仅包含 `text`、`raw`、`url` 或 `data` 之一的独立内容切片 |
| Artifact | 任务完成时产出的具名、带类型输出成果 |
| `TASK_STATE_INPUT_REQUIRED` | 当任务执行遇阻需要调用方提供补充输入时的挂起状态 |

## 延伸阅读

- [a2a-protocol.org](https://a2a-protocol.org/latest/) A2A 规范主站
- [a2aproject/A2A GitHub](https://github.com/a2aproject/A2A) 参考实现与可持续发展目标
- [A2A v1.0.1 release](https://github.com/a2aproject/A2A/tree/v1.0.1) 本课程遵循的规范与Protobuf契约
