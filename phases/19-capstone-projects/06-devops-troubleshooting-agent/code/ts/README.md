# Capstone 06 - DevOps Troubleshooting Agent (TypeScript)

用于 `../main.py` 中 on-call agent 的 Slack-integration 骨架。暴露一个
slash-command endpoint 和一个 interactivity（button-click）endpoint，
两者都由 Slack 的 HMAC-SHA256 request signature 加上 5 分钟 replay window
进行保护。破坏性 remediation 只有在 Slack card 被批准后才会运行。

## Layout

```text
ts/
  package.json
  tsconfig.json
  src/
    index.ts          # entrypoint、demo + HTTP server
    server.ts         # hono app、/slack/command + /slack/interactivity
    slack_verify.ts   # HMAC v0 verification + timing-safe compare
    agent.ts          # mocked hypothesis ranker
    blocks.ts         # Block Kit response builder
    types.ts          # Hypothesis、AgentReport、SlackResponse、OutboundCall
  tests/
    slack_verify.test.ts
    agent.test.ts
    server.test.ts
```

## Run

```bash
npm install
npm run typecheck
npm test
npm start          # 一次 self-check，通过后以 0 退出
npm run serve      # 127.0.0.1:<port> 上的交互式 HTTP server
```

设置 `SLACK_SIGNING_SECRET=...` 可覆盖 placeholder secret。交互式 server
会打印所选端口（当未设置 `PORT` 时为随机端口）。

## Tests

通过 tsx 使用 `node --test` runner。Coverage：

- Slack signature verification：有效 signature 通过，tampered signature 被拒绝，
  stale timestamp（>5 min skew）被拒绝，非数字 timestamp 被拒绝，
  length-mismatch path 会在 constant-time compare 前被执行。
- Mock agent：OOM keyword path、CrashLoop keyword path、fallback path。
- Server：`/health`、`/slack/command` happy/tampered/stale paths、
  `/slack/interactivity` approve action。
