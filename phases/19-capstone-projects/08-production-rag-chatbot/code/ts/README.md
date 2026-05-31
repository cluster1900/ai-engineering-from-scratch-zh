# Capstone 08 - Production RAG Chatbot (TypeScript)

Chat UI 骨架，通过 Server-Sent Events 流式返回带 citation 锚点的响应。
与 `../main.py` 中的 Python pipeline 配套使用。Conversation state 存放在
按 `sessionId` 作为 key 的进程内 Map 中，因此同一个 session id 可以驱动
multi-turn dialogues。

## Layout

```text
ts/
  package.json
  tsconfig.json
  src/
    index.ts        # entrypoint、demo + HTTP server
    server.ts      # hono app、/、/chat/stream (SSE)、/sessions、/health
    session.ts     # SessionStore (Map<sessionId, Session>)
    stream.ts      # SSE frame encoder + parser + mock retrieval + tokenizer
    types.ts        # Session、Turn、Citation、KbEntry、SseEvent
  tests/
    session.test.ts
    stream.test.ts
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

当未设置 `PORT` 时，交互式 server 会选择一个空闲端口，在 `/` 挂载 chat
HTML client，并通过 `GET /chat/stream?sessionId=...&q=...` 进行流式传输。
demo client 使用 `EventSource`，并监听 `session`、`citations`、`token`
和 `done` events。

## Tests

通过 tsx 使用 `node --test` runner。Coverage：

- SessionStore：create、lookup、append、list、missing id 上的 no-op。
- SSE encoder + parser round-trip；按 jurisdiction tag 提升 retrieval；
  tokenizer fallback + "See also" tail。
- Server：`/`、`/health`、`/chat/stream` happy path（session + citations +
  token + done）、缺少 q 时返回 400、multi-turn session persistence、
  `/sessions` listing。
