# 构建 MCP Client：服务发现、路由与双时代回退

> 现代 MCP Client 在每一个请求上都完整重复其通信契约。它最具挑战性的兼容性决策，在于判断老旧 Server 是真正的 Legacy 架构，还是一个报错可修正的现代 Server。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07（构建 MCP Server）
**Time:** ~85 分钟

## 学习目标

- 为每个 MCP `2026-07-28` 请求从零构建最新的元数据 Envelope。
- 使用 `server/discover` 探测基于 stdio 的 Server，并协商双方均支持的版本。
- 仅为显式加入白名单的对端（Peer）授权发起有时间限制的 Legacy 握手探测。
- 仅在验证了受支持版本的有效正向 `initialize` 结果后，才接受 Legacy 时代。
- 合并确定性 Tool 列表，杜绝静默覆盖重名冲突。
- 将工具调用准确路由至所属对端，无需引入任何协议 Session。

## 问题背景

Agent Host 通常需要与多个 MCP Server 同时通信。它必须发现各个 Server、合并工具目录、解决重名冲突、路由方法调用，并从传输层中断中平稳恢复。

`2026-07-28` 规范使得稳态运行变得极其简单，因为每个请求都完全自包含。然而，兼容性使得启动阶段更加微妙。Client 可能会遇到：

- 支持首选版本的现代 Server；
- 返回可识别的版本或 Header 错误的现代 Server；
- 从未听说过 `server/discover` 的老旧 Server；
- 直到接收到 `initialize` 握手前都保持沉默的老旧 Server。

若将所有探测错误均一概视为 Legacy Server，是极其危险的。格式错误的现代请求、过载的 Server、挂掉的进程与真正的老旧 Server，都可能产生相同的超时或连接断开信号。这些信号本身充满歧义。Client 必须将显式的运维人员意图与正向的协议证据相结合，才能决策进入 Legacy 时代。

## 核心概念

### 对端（Peer），而非协议 Session

为每个 Server 进程或网络端点维护一份传输对端（Transport Peer）记录：

- 传输句柄或发送函数；
- 选定的协议时代与具体版本号；
- 最近一次发现的 Server Capabilities；
- 最近一次拉取到的确定性 Tool 列表；
- 正在等待响应的请求 ID 映射；
- 传输层的物理健康状态。

这属于 Client 内部的管理记账，绝不是所谓的“协议 Session 状态”。在现代 MCP 中，Server 依然在每一次业务请求中独立接收当前的版本与能力声明。

### 从零构建每个现代请求

```python
def modern_request(request_id, method, params, version, capabilities):
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": {
            **params,
            "_meta": {
                "io.modelcontextprotocol/protocolVersion": version,
                "io.modelcontextprotocol/clientCapabilities": capabilities,
                "io.modelcontextprotocol/clientInfo": CLIENT_INFO,
            },
        },
    }
```

绝不要只在连接对象上附加一次元数据就假定它能到达网络线路上。必须对最终序列化的完整请求进行盖戳打标和校验。

### 现代服务发现

`server/discover` 返回支持的版本、Server 能力、使用说明、缓存提示以及推荐的 Server 身份。Client 选择双方均支持的最高现代版本。

对于纯现代 Client，服务发现是可选的；但在 stdio 模式下强烈推荐使用。某些老旧 Server 在初始化前就能接收业务调用，因此直接发送 `tools/list` 可能会产生模棱两可的假成功。而 `server/discover` 能够建立泾渭分明的时代分界线。

### stdio 兼容性探测流程

双时代（dual-era）stdio Client 在发送任何其他请求之前，优先发送携带其首选现代元数据的 `server/discover`。可能产生三类结果：

1. **DiscoverResult（成功发现）**：Server 为现代架构。选择共同支持的版本，并以每次请求携带元数据的方式继续业务通信。
2. **Recognized modern error（已识别的现代协议错误）**：Server 依然为现代架构。若返回 `-32022`，从 `data.supported` 中选择可用版本并用新请求 ID 重试；若为 Header 或 Capability 错误，修正请求内容即可。**严禁回退发送 `initialize`。**
3. **Ambiguous signal（歧义信号）**：未识别的 JSON-RPC 报错、超时、连接关闭或空响应均无法确定协议时代。必须默认按失败关闭（fail closed），除非该对端被运维显式配置了 Legacy 兼容白名单。

已识别的现代协议错误码包括：

- `-32020` HeaderMismatch（请求头与请求体不匹配）
- `-32021` MissingRequiredClientCapability（缺少必要的 Client 能力）
- `-32022` UnsupportedProtocolVersion（不支持的协议版本）

即便对端已被列入 Legacy 白名单，已识别的现代错误也证明其为现代 Server。一旦 Server 表现出理解现代错误词汇的能力，再发送 `initialize` 就构成了降级。

绝不能把 `-32601`（方法未找到）作为进入 Legacy 的充分证据。它仅代表该对端有资格发起一次有受限时长的 Legacy 探测。超时、连接关闭或空响应同样适用这一规则。

### 白名单代表运维意图，而非协议证据

Legacy 兼容性必须是对指定对端配置的显式属性：

```python
client.add_server("archive", archive_transport, allow_legacy=True)
```

必须将此选项绑定至明确配置的命令或端点。严禁使用通配符让任意未知 Server 自动降级为较弱语义。未配置 `allow_legacy=True` 的对端在遇到歧义发现结果后直接报错失败，绝不会收到 `initialize`。

白名单仅授予了发起探测的权限。它并不决定对端的时代。Client 在传输层强制的截止时间内发送单个 `initialize` 请求，然后严格要求满足以下全部条件：

- 收到与该请求 ID 匹配的 JSON-RPC `2.0` 响应；
- 仅包含 `result` 字段，且无 `error`；
- `protocolVersion` 属于 Client 允许配置的旧版集合中；
- 包含对象类型的 `capabilities` 字段；
- 包含非空字符串 `name` 与 `version` 的 `serverInfo` 对象。

任何超时、断开、报错、畸形结果、ID 错乱或不受支持的版本均直接失败。只有结构完全合规的正向结果才能将对端标记为 Legacy 时代。代码会把 `legacy_probe_timeout_ms` 传给传输适配器；真实的 stdio 或 HTTP 适配器必须实际执行这一截止时间，而不能只是记录它。

为该传输对端缓存选定的时代，不要在每次调用前重新探测。

### Legacy 是一个兼容分支

一旦受限探测返回有效的正向 Legacy 证据，Client 就严格按照该修订版的定义使用选定的 Legacy 版本：

1. 校验响应信封与关联 ID。
2. 校验协商出的修订版属于已配置的 Legacy 集合。
3. 记录经过校验的 capabilities 与 Server 身份。
4. 仅在全部检查通过后发送 `notifications/initialized`。
5. 在该传输生命周期内使用 Legacy 请求结构。

这个分支只为与已知对端互通而存在，它不是新 Server 或新请求的默认设计。如果传输重启或端点发生变化，丢弃对端时代缓存并重新协商。

### 工具发现与缓存

对每个活跃对端调用 `tools/list`。现代结果包含 `resultType`、`ttlMs` 与 `cacheScope`。在正确的授权上下文中遵守这一新鲜度提示；过期后或收到已订阅的列表变更事件后重新拉取。

对于 Legacy Server 缺失 `resultType` 的情况，Client 必须将其视为 `"complete"`。不要要求较早协商时代的响应携带现代缓存字段。

Server 应返回确定性排序。Client 也应在合并前排序，使本地注册表顺序不依赖进程启动时序。

### 命名空间无冲突合并

两个 Server 可能都暴露出名为 `search` 的工具。应采用明确声明的策略：

1. **冲突时加前缀（Prefix on collision）**：保留首个工具的规范名，后续重名工具暴露为 `<server>/<tool>`。
2. **冲突时拒绝（Reject on collision）**：不加载重复工具，并抛出清晰的配置报错。
3. **静默覆盖（Silent overwrite）**：**坚决杜绝**。它会隐蔽模型真正调用的目标 Server。

同时保存规范名与本地名。模型看到的是规范名；发出的 `tools/call` 使用所属 Server 声明的本地名。

### 调用路由机制

路由是纯粹的映射查找：

```text
canonical tool name
  -> peer name + local tool name
  -> new JSON-RPC request id
  -> modern request metadata or explicit legacy shape
  -> matching response id
```

当所属传输不可用时不要发送调用。先重连或重启传输，再重新执行服务发现与 `tools/list`。在传输断开时丢失的现代在途请求，若该操作的安全策略允许，可以使用新的 JSON-RPC ID 重试。

### 通知与订阅

现代的列表与资源变更只通过 Client 打开的 `subscriptions/listen` 流到达。Client 发送通知过滤器，等待 `notifications/subscriptions/acknowledged`，并用通知元数据中的 listen 请求 ID 关联事件。

断开后，发起新的 listen 请求并重新拉取相关列表或资源。现代流不使用 `Last-Event-ID` 恢复。

### 不存在 Server 发起的请求

现代 Server 不会为 Sampling、Elicitation 或 Roots 向 Client 发起独立的 JSON-RPC 请求。它们返回 `input_required`，Client 在满足其中嵌入的输入请求后重试原始请求。

满足输入期间不要阻塞对端的响应读取器。保持关联关系，并为重试生成新的 JSON-RPC ID。

```figure
tp-client-merge
```

## 动手实践

`code/main.py` 通过内存对端函数清晰展示了整个协议决策树。它连接至两个现代对端和一个显式白名单标记的 Legacy 对端，合并并路由它们的工具。传输可调用对象会收到一个超时预算，使兼容分支无法隐藏无界的探测。

```bash
cd code
python3 main.py
python3 -m unittest discover tests -v
```

单元测试覆盖了常规演示容易忽视的边界条件：

- 现代请求逐次重复元数据；
- 遇到 `-32022` 时重试现代发现，绝不退化为握手；
- 已识别的现代错误绝不发生降级（即使对端在白名单中）；
- 超时、连接关闭、空响应与未识别的错误在无白名单时绝不触发 `initialize`；
- 白名单对端仅在收到合规正向的 `initialize` 响应后才确立为 Legacy；
- 畸形或不受支持的 Legacy 结果使对端保持不可用；
- 选定的时代被稳定缓存在对端传输生命周期中。

## 交付物

本课交付 `outputs/skill-mcp-client-harness.md`。它能为现代请求盖戳、stdio 时代协商、确定性命名空间合并、路由以及失败即关闭（fail-closed）的 Legacy 兼容分支提供规范脚手架。

## 练习与思考

1. 让一个模拟 Server 返回 `-32022` 且没有双方都支持的版本，确认 Client 直接失败而不发送 `initialize`。
2. 将一个模拟 Legacy Server 加入白名单，让其受限 `initialize` 探测超时，证明该对端保持 `unknown` 且不可用。
3. 为两个授权上下文添加 `cacheScope: "private"` 的工具列表，确认 Client 绝不会把一个上下文的缓存结果共享给另一个。
4. 把冲突策略改为拒绝，并让启动失败时的报错包含两个对端名称。
5. 添加一个有限的 `subscriptions/listen` 模拟器；流丢失时用新的请求 ID 重新 listen 并重新拉取工具。

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 对端 (Peer) | Client 端维护的单个 Server 传输句柄及其发现信息的记录实体 |
| 协议时代 (Protocol era) | 现代逐请求元数据模式，或旧版初始化握手语义 |
| 服务发现探测 (Discovery probe) | 用于识别 stdio 对端时代的初始 `server/discover` 请求 |
| 已识别现代错误 (Recognized modern error) | 证明对端属于现代架构并禁止 Legacy 回退的特定协议错误 |
| Legacy 白名单 (Legacy allowlist) | 运维显式授权对指定对端进行一次受限兼容探测的配置 |
| 正向 Legacy 证据 (Positive legacy evidence) | 针对受支持旧版协议返回的有效、ID 匹配的 `initialize` 结果 |
| 合并命名空间 (Merged namespace) | 跨所有活跃对端规范化后的工具全局名称集合 |
| 冲突策略 (Collision policy) | 处理重名工具的加前缀或报错拒绝规则 |
| 时代缓存 (Era cache) | 为单个传输对端保存的已选现代或 Legacy 行为 |
| 传输恢复 (Transport recovery) | 重启或重连、重新发现、重新列出，并以新 ID 安全重试 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
