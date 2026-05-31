# Capstone 19/03 — Realtime Voice Assistant (TypeScript)

用于 `../docs/en.md` 中描述的 streaming voice pipeline 的多文件 TypeScript web-client harness。离线 state-machine simulation，加上由 `ws` package 支持的 live
WebSocket server。

## Layout

```text
src/
  index.ts        入口点；运行两个离线 sessions，probe live ws，以 0 退出
  server.ts       hono /healthz + 通过 WebSocketServer 进行 ws upgrade
  orchestrator.ts IDLE -> LISTENING -> WAITING -> THINKING -> SPEAKING，支持 barge-in
  vad.ts          turn-completion scorer + 合成 20ms-frame generator
  protocol.ts     zod-validated frame envelope（event / summary）
  types.ts        AudioChunk、Metrics、SessionOptions、SessionSummary
tests/
  vad.test.ts
  orchestrator.test.ts
  protocol.test.ts
```

## Run

```bash
npm install
npm start                # 运行两个离线 sessions + ws self-probe，以 0 退出
npm start -- --serve     # 保持 ws server 运行；ctrl-c 停止
npm test                 # 通过 tsx 使用 node --test runner
npm run typecheck        # tsc --noEmit
```

非交互式 `npm start` 路径会断言 clean session 到达
`first_audio_out`，barge-in session 至少注册一个 barge-in event，
并且 live WebSocket probe 在 close 前收到一个 `summary` frame。
