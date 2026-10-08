# 构建MCP服务器:无状态 Python 与TypeScript

> 现代MCP服务器 绝不记住握手状态――它验验每个请求中的元数据,执行应对处理器,并返回单个带有类型标识的结果――

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 13 · 06（MCP 基础）
**Time:** ~85 分钟

## 学习目标

- 为MCP`2026-07-28`规范实现强制要求`server/discover`方法.
- 在每次收到的请求中,
- 以确定性排序暴露工具、资源和提示列表――
- 在正确的结果中返回`resultType`、服务器身分标识 (服务器身份) 与缓存提示──
- 在Python和TypeScript中,通过换行符分隔的工作室实现完全相同的无状态协议协议契约.

## 问题背景

虽然实现简单,但在生产运维中极其脆弱. 一个过程可能会先后为多个客户提供服务. 远程请求也可能被散发到不同的工人. 旧的能力声明更可能跨越识别权界导致信息泄露.

股`2026-07-28`规范通过使**每个请求自描述**完全解决了协议层面的问题. 你的应用程序仍然可以维护持久的笔记,任务作业或显然状态句柄.

本课程将两次构建一个笔记本服务器:Python和TypeScript版本仅使用其原生标准库实现协议核心,它们都暴露出完全相同的接口方法,并强制执行完全相同的通信报文契约.

## 核心概念

### 现代请求分发循环(发送循环)

```text
读取一行 JSON-RPC 文本
解析外层 Envelope
若为通知（Notification），则不予响应
针对当前请求校验 params._meta
根据 method 执行路由分发
使用 resultType 与 serverInfo 封装成功结果
写回一行 JSON-RPC 响应文本
立即遗忘当前请求作用域的元数据
```

在工作模式下,有三条关键规则:

- 仅向中出 写入JSON-RPC消息;所有调试与诊断日志必须向中出.
- 报文以换行符分隔,并在每次写回应后执行冲.
- 当您接收到EOF时,进程应立即退出.

过程的生命周期仅代表了物理传输层的生存期,绝不是现代MCP协议的会议.

### 请求元数据校验

每个请求都必须包含:

```json
{
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "notes-client",
        "version": "1.0.0"
      }
    }
  }
}
```

强制性.`clientInfo`如果提供身份数据,可以验证其数据结构,但绝不能视为安全认证证.

如果版本不支持,返回错误码`-32022`并附带`requested`与`supported`△若请求元数据缺失,属于非法参数,返回错误码 `-32602`绝不能从历史调用中填充缺失的元数据

### 强制的服务发现 (强制的发现)

现代服务器必须实现`server/discover`△一个完整的服务发现结果包括支持的现代协议版本,服务器能力集,可选的使用说明,缓存提示以及结果.`_meta`中的服务器身份识别:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": false},
    "resources": {"listChanged": false, "subscribe": false},
    "prompts": {"listChanged": false}
  },
  "ttlMs": 3600000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

服务发现并非解锁服务器的前提大门. 客户端可以完全在不调用发现的情况下直接发起.`tools/list`因为`tools/list`已经带着完全相同的请求数据.

### 工具 (工具)

`tools/list`返回具有确定性排序工具 描述符列表――稳定排序能提高响应缓存命中率,并保持模型快速上下文的稳定性――该结果同样要求携带`ttlMs`和 `cacheScope`,我知道.

`tools/call`返回内容块(内容块) 和 `isError`状态──当协议封装或方法参数非法时,返回JSON-RPC 错误响应;当合规的工具调用成功触发,但在业务执行层面失败时,返回带有`isError: true`常规结果.

工具注解(注释) 只给主机的提示,不代表强制执行:

- `readOnlyHint`
- `destructiveHint`
- `idempotentHint`
- `openWorldHint`

服务器必须在业务层面强制执行真正的授权验证.

### 资源 (资源)

`resources/list`返回稳定URI 描述符──`resources/read`返回带类型的内容.`2026-07-28`规范中,两者均属于可缓存结果,必须包含`ttlMs`和 `cacheScope`,我知道.

对于用户专属的私人笔记数据,应使用`cacheScope: "private"`共享缓存绝不能跨授权上下文复用私有响应

现代数据变更推送不再使用`resources/subscribe`◎ 通过发起`subscriptions/listen`声明`resourceSubscriptions`或列表变更事件来接收长连接推送

### 提示模板)

`prompts/list`其他类型的类型:`prompts/get`根据参数染指定的命名 染后的染后的染结果属于完整的结果,但不需要像列表或读操作那样附加缓存提示.

### 每个成功的结果都是带类型的

在代码实现中,可以使用统一的包装器处理所有成功响应:

```python
def complete(payload):
    return {
        "resultType": "complete",
        **payload,
        "_meta": {SERVER_INFO_KEY: SERVER_INFO},
    }
```

列表,读取和服务发现的处理员 会额外增加`ttlMs`与`cacheScope`❖集中处理能够防止个人处理者疏漏现代规范所需的字段.

### 绝不发起服务器端请求

现代服务器可以发送与客户直接相关通知,或在客户端开放的请求`subscriptions/listen`流中推送通知.但服务器.**绝不能**主动发起独立的JSON-RPC 请求

当处理器需要样本, 调用或根输入时,它返回一个`input_required`结果── 在满足所请求的输入后,使用全新的请求ID 重新发起原始方法调用──

```figure
t3-dispatch-loop
```

## 动手实践

运行 Python Server 的完整演示与测试:

```bash
cd code
python3 main.py --demo
python3 -m unittest discover tests -v
```

使用TypeScript 运行器运行TypeScript 版本:

```bash
npx tsx main.ts --demo
```

演示流程会发送`server/discover`、列出各个原语、调用工具,并显示未支持版本的报错表现.

## 交付物品

本课交付 `outputs/skill-mcp-server-scaffolder.md`△它可以生成符合现代规范的服务器设计蓝图,包括服务发现契约,逐请求校验,确定性缓存列表以及可选的独立遗产 适配层.

## 练习与思考

1. 字段,证明服务器绝不会复用前请求中声明的旧能力.
2. 颠倒`TOOLS`,我知道.`PROMPTS`及笔记数据的录取顺序,确认所有列表查询结果仍然保持稳定的字母序列.
3. 增加一个破坏性的`notes_delete`工具,并加入执行器内部鉴定权检查,验证`destructiveHint`只有前端交互提示.
4. 补充`resources/templates/list`接口,要求附带`ttlMs`,我知道.`cacheScope`确定性排序
5. 为`2025-11-25`编写一个完全隔离的遗产 适配器,并通过测试证明现代请求绝不会错误进入遗产 处理路径――

## 核心专业术语

| 术语 | 规范定义 |
|------|---------|
| 无状态 Server (Stateless server) | 仅从每个请求自身的元数据处理调用，无任何协议 Session 内存记忆 |
| `server/discover` | 强制实现的现代方法，用于向调用方公布支持的版本与功能集 |
| 完整结果 (Complete result) | 携带 `resultType: "complete"` 的成功现代结果 |
| 可缓存结果 (Cacheable result) | 附带强制 `ttlMs` 与 `cacheScope` 提示的发现、列表或只读结果 |
| 确定性列表 (Deterministic list) | 逻辑相同的注册表必须输出完全一致、可复现的条目顺序 |
| Server 身份 (Server identity) | 在结果 `_meta` 中携带的 `io.modelcontextprotocol/serverInfo` 标识 |
| Tool 业务错误 (Tool error) | Tool 调用正常被解析执行，但业务逻辑失败，返回包含 `isError: true` 的 content |
| 协议错误 (Protocol error) | 非法的 JSON-RPC 格式或无效的 MCP 请求参数，直接通过顶层 `error` 报错返回 |

## 延伸阅读

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
