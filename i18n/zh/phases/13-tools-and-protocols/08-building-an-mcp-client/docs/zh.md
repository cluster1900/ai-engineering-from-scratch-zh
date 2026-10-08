# 构建MCP客户端:服务发现、路由与双时代回归

> 现代MCP客户端在每一个请求上都完整重复其通信契约――它是最具挑战性的兼容性决策,在判断旧服务器是真正的遗产架构,还是一个可修改的现代服务器――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07（构建 MCP Server）
**Time:** ~85 分钟

## 学习目标

- 为每一个MCP`2026-07-28`请从零构建最新的元数据包.
- 使用 `server/discover`探测基于工作室的服务器,并协商双方均支持的版本.
- 仅为显然加入白名单的对端 (对端) 授权发起有时间限制的遗产 握手探测──
- 仅仅验证了支持版本的有效正向`initialize`结果后,才接受遗产时代.
- 合并确定性工具列表,杜绝静默覆盖重名冲突──
- 将工具调用准确路由至所属端,无需引入任何协议会议.

## 问题背景

机器主机通常需要与多个MCP服务器同时通信. 它必须发现各个服务器.

`2026-07-28`规范使稳定运行变得非常简单,因为每个请求都完全自含.

- 支持首选版本的现代服务器;
- 返回可识别的版本或标题 错误的现代服务器;
- 从未听说过`server/discover`的旧服务器;
- 直到收到`initialize`握手前都保持沉默的老老服务员.

如果将所有检测错误均被视为遗产服务器,是极其危险的. 形式错误的现代请求,过载服务器,与真正的旧服务器的关闭进程,都可能产生相同的超时或连接断开信号. 这些信号本身充满了差异性. 客户必须将明显的运营人员意图与正向协议证据结合起来,才能做出决策进入遗产时代.

## 核心概念

### 对于端(同行),而非协议会议

为每个服务器进程或网络端点维护一个传输对端的记录:

- 传输句柄或发送函数;
- 选定的协议时代与具体版本号;
- 服务器能力最近发现;
- 过去的确定性工具列表;
- 正在等待响应的请求ID映射;
- 传输层的物理健康状态.

在现代MCP中,服务器仍然在每次业务请求中独立接收当前版本和能力声明.

### 从零构建到现代要求

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

绝对不仅仅在连接对象上添加一次元数据,假设它能到达网络线路.

### 现代服务发现

`server/discover`返回支持版本、服务器 能力、使用说明、缓存提示以及推的服务器身材──客户选择双方均支持的最高现代版本──

对于纯现代客户端,服务发现是可选的;但在工作室模式下强烈推使用.`tools/list`假成功可能会产生.`server/discover`能够建立分界线的时代分界线.

### 工作室 兼容性探测流程

双时代(双时代) 工作室客户在发送任何其他请求之前,优先发送携带其首选现代元数据的 `server/discover`△可能产生三类结果:

1. **DiscoverResult（成功发现）**服务器为现代架构. 选择共同支持的版本,并以每次请求的方式继续运输数据.
2. **Recognized modern error（已识别的现代协议错误）**服务器仍然为现代架构.`-32022`从`data.supported`中选择可用版本并使用新请求 ID 重试;若为头条或 Capability 错误,修改请求内容即可。**严禁回退发送 `initialize`。**
3. **Ambiguous signal（歧义信号）**没有识别的 JSON-RPC 报错、超时、连接关闭或空响应均无法确定协议时代──必须默认按失败关闭(故障关闭),除非该端被运维显然配置了遗产 兼容白名单──

已识别的现代协议错误码包括:

- `-32020`标题不匹配 (请求头与请求体不匹配)
- `-32021`缺少需要 客户能力
- `-32022`没有支持协议版本)

即便对端已被列入"遗产白名单",已识别的现代错误也证明为现代服务器――一旦服务器表现出理解现代错误词汇的能力,发送 `initialize`造成危险的降级攻击.

绝不能把`-32601`作为进入遗产的充分证据,它只代表该对象有资格发起一次有限时间的遗产探测.

### 白名单代表运维意图,而不是协议证据

遗产兼容性必须是指定端配置的显而易见属性:

```python
client.add_server("archive", archive_transport, allow_legacy=True)
```

必须将此选项绑定到明确配置的命令或端点.`allow_legacy=True`报道失败后,绝不会收到`initialize`,我知道.

白名单仅授予发射探测权. 客户在传输层强制截止时间内发送单个.`initialize`请,然后严格要求满足以下条件:

- 收到与请求相匹配的JSON-RPC`2.0`响应
- 仅包含`result`字段,且无 `error`其他
- `protocolVersion`属于客户端允许配置的旧版本集合中;
- 包含对象类型`capabilities`字段;
- 包含非空字符串`name`与`version`的`serverInfo`象征

任何超时,断开,报错,形状结果,ID 错乱或未经支持的版本均直接失败.只有结构完全合规的正向结果才能将端标记为遗产时代.

### 命名空间无冲突合并

两个服务器可能都被曝光`search`工具应采用明确声明的策略:

1. **冲突时加前缀（Prefix on collision）**保留首个工具的规范名,后续重名工具暴露为`<server>/<tool>`,我知道.
2. **冲突时拒绝（Reject on collision）**没有重复工具,并抛出清晰的配置报错.
3. **静默覆盖（Silent overwrite）**其他:**坚决杜绝**它会隐模型真正调用的目标服务器

### 调用路由机制

路由是纯粹的映射查找:

```text
规范工具名
  -> 对端名称 + 本地工具名
  -> 生成全新的 JSON-RPC 请求 ID
  -> 现代请求元数据 或 显式 Legacy 结构
  -> 匹配响应 ID 并返回
```

```figure
tp-client-merge
```

## 动手实践

`code/main.py`通过内存对端函数清晰显示整个协议决策树. 它连接到两个现代对端和一个显然的白单标记的遗产对端,并通过它们的工具:

```bash
cd code
python3 main.py
python3 -m unittest discover tests -v
```

单元测试覆盖常规演示易忽略的边界条件:

- 现代请求逐次重复元数据;
- 遇到`-32022`时重试现代发现,绝不退化为握手;
- 已识别的现代错误绝不会发生降级;
- 超时,断开与未知错误在无白名单上绝不触发`initialize`其他
- 单单对端仅在收到合规正向的`initialize`响应后才确立为遗产;
- 选择时代被稳定存在于端传输生命周期中.

## 交付物品

本课交付 `outputs/skill-mcp-client-harness.md`△它可以用于现代要求盖、studio 时代协商、确定性命名空间合并、安全路由以及安全关闭的遗产 兼容分支提供规范脚手架。

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

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
