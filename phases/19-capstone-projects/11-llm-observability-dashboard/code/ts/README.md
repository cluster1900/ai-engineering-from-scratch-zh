# LLM observability dashboard（TypeScript 骨架）

用于 LLM observability dashboard capstone 的多文件 TypeScript 骨架。
Hono server 接收 OpenTelemetry GenAI spans，将它们保存在 10k ring
buffer 中，并渲染 p50/p95/p99 latency 和按 model 统计的 cost。

## 布局

- `src/index.ts` — entry point，播种 synthetic spans，并可选地提供 HTTP 服务。
- `src/server.ts` — 用于 `/trace`、`/`、`/dashboard`、`/dashboard.json`、`/healthz` 的 Hono routes。
- `src/spans.ts` — `RingBuffer` 和 `ObservabilityStore`（默认 10k spans）。
- `src/rollup.ts` — `percentile` 和 `rollUpByModel`。
- `src/pricing.ts` — 2026 年按 model 计价的 prices 和 cost helpers。
- `src/types.ts` — 共享 types。
- `tests/*.test.ts` — 通过 `tsx` 运行的 `node --test` 风格 tests。

## 安装

```bash
npm install
```

## 运行

```bash
npm start         # 播种 1200 个 synthetic spans 并打印 rollup
npm run serve     # 同时在 PORT（默认 8011）上提供 HTTP ingest + dashboard
```

## 验证

```bash
npm run typecheck
npm test
```

## Spec references

- Source lesson: `phases/19-capstone-projects/11-llm-observability-dashboard/docs/en.md`
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
