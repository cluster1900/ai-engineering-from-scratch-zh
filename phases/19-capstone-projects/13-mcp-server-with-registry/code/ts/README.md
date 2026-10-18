<a id="lesson-13---stateless-mcp-server-typescript"></a>

# 第 13 课：无状态 MCP 服务器（TypeScript）

综合项目的 TypeScript 部分。Python 侧（`code/main.py`）提供注册表和策略门禁；
本项目实现 MCP 传输：手写通过 stdio 传输、以换行分隔的 JSON-RPC 2.0，
提供三个模拟事件工具。它直接实现 MCP `2026-07-28`，不使用
`@modelcontextprotocol/sdk`，便于逐字节检查线上消息。

尽管模拟事件存储会持久化数据，协议本身仍是无状态的。
每个请求都在 `params._meta` 中重复提供协议版本和客户端能力；
连接、进程或更早的请求都不会建立会话。服务器暴露必需的 `server/discover`，
在每个成功结果中标识自身，并发布确定性、可缓存的工具列表。
`tools/call` 根据 `tools/list` 返回的同一组有界模式验证参数；
已知工具的参数格式错误时，返回带 `isError: true` 的完整工具结果，
绝不进入其执行器。

运行时身份是 `com.example/internal-incidents`。它使用已验证发布者
`example.com` 的反向 DNS 命名空间。配套发布的 `server.json` 必须使用
相同名称，即使本地 npm 包有自己的私有项目名。

<a id="layout"></a>

## 布局

```text
src/
  index.ts      entry: fixture demo (default) or stdio loop (--serve)
  transport.ts  stdin readline + fixture replay
  protocol.ts   request validation / server/discover / tools/list / tools/call
  tools.ts      three incident tools + executors
  types.ts      JSON-RPC + tool shapes
tests/
  protocol.test.ts  stateless metadata, discovery, tools, errors, roundtrip
```

<a id="run"></a>

## 运行

```bash
npm install
npm run typecheck
npm test
npm start            # self-terminating fixture demo
npm run serve        # real stdio loop (waits on stdin)
```

演示会自行结束。真实 stdio 服务器保持运行，直到输入流关闭；
不存在 MCP 关闭请求或初始化握手。
