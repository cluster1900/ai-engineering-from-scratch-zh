# Capstone 19/02 — RAG over Codebase (TypeScript)

用于 `../docs/en.md` 中描述的 hybrid retrieval pipeline 的多文件 TypeScript 代码搜索 API。离线、确定性、六 chunk sample corpus，
node:http 位于 hono fetch handler 之后。

## Layout

```text
src/
  index.ts        入口点；启动 node:http + self-probe + 以 0 退出
  server.ts       hono routes（/healthz, /query），POST body 经过 zod validation
  retrieval.ts    在 dense 和 BM25 上执行 runQuery + RRF merge
  index_store.ts  FNV-1a hash embedder、cosine、field-weighted BM25
  corpus.ts       六 chunk sample（uploader / auth / client / catalog）
  types.ts        Chunk、RankedChunk、QueryResponse、anchor()
tests/
  index_store.test.ts
  retrieval.test.ts
  server.test.ts
```

## Run

```bash
npm install
npm start                # 启动 api，probe 三个查询，以 0 退出
npm start -- --serve     # 保持 server 运行；ctrl-c 停止
npm test                 # 通过 tsx 使用 node --test runner
npm run typecheck        # tsc --noEmit
```

非交互式 `npm start` 路径会断言 `/healthz` 返回 200，并且每个 probe query 至少返回一个 citation。Routes：

- `GET /healthz` — 返回 `{ok, corpus}`。
- `GET /query?q=...` — 运行 hybrid query。
- `POST /query` — JSON `{q, topK?}`，由 zod validation（`topK` 上限为 50）。
