# Code migration agent dashboard（TypeScript skeleton）

用于 code migration agent capstone 的 dashboard 层的多文件 TypeScript 骨架。
agent（Python）在 sandbox 中运行；此 server 为 operator 渲染进度。

## Layout

- `src/index.ts` — entry point，模拟 ticks，并可选提供 HTTP 服务。
- `src/server.ts` — Hono routes，包含 `/`、`/dashboard`、`/migrations`、`/migrations/:id`。
- `src/migrations.ts` — per-file state machine 和 seed data。
- `src/cost.ts` — turn count 和 dollar budget enforcement。
- `src/types.ts` — shared types。
- `tests/*.test.ts` — 通过 `tsx` 使用 `node --test` 风格 tests。

## Install

```bash
npm install
```

## Run

```bash
npm start         # offline：模拟 40 个 ticks 并打印 rollup
npm run serve     # 在 PORT 上提供 HTML dashboard（默认 8009）
```

## Verify

```bash
npm run typecheck
npm test
```

## Spec references

- Source lesson：`phases/19-capstone-projects/09-code-migration-agent/docs/en.md`
- Recipes：[OpenRewrite](https://docs.openrewrite.org)、libcst。
