# 第 16 课 - GitHub Issue-to-PR Agent（TypeScript webhook 接收器）

capstone 的 TypeScript 部分。Python 侧交付 agent loop 和
dispatcher；YAML 侧交付 Actions workflow。这个项目是 GitHub
App webhook 接收器：对 raw body 做 HMAC 验证，按 event type 路由，并为 `issues.opened`
dispatch 一个 stub agent。

## 布局

```text
src/
  index.ts    入口：demo（默认）或 HTTP server（--serve）
  server.ts   Hono webhook 接收器（POST /webhook）
  verify.ts   X-Hub-Signature-256 HMAC，timing-safe
  router.ts   event-type 路由（ping, issues, pull_request）
  agent.ts    stub agent + audit log
  types.ts    payload + audit 形状
tests/
  verify.test.ts  signature 通过、被篡改、router 路径
```

## 运行

```bash
npm install
npm run typecheck
npm test
npm start            # 自行终止的 demo（in-process replays）
npm run serve        # :8081 上的 HTTP server
```

HMAC secret 从 `GH_WEBHOOK_SECRET` 读取（demo 默认使用 `demo-shared-secret`）。
