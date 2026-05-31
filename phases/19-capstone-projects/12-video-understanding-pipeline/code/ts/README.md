# Lesson 12 - Video Understanding Pipeline（TypeScript UI）

capstone 的 TypeScript 部分。Python 侧（`code/main.py`）负责
multi-vector index 和 temporal grounding。这个项目交付 dashboard
部分：一个覆盖四个 pipeline stages（chunk、embed、index、qa）的 Hono app。

## 布局

```text
src/
  index.ts     entry: demo（默认）或 HTTP server（--serve）
  server.ts    Hono routes（/, /jobs, /job/:id）+ HTML index
  jobs.ts     JobStore + fixture seeder
  stages.ts    stage advance + overall status
  types.ts     Stage, StageState, Job
tests/
  stages.test.ts  job state transitions + store
```

## 运行

```bash
npm install
npm run typecheck
npm test
npm start              # 自行终止的 demo
npm run serve          # :8123 上的 HTTP server
```
