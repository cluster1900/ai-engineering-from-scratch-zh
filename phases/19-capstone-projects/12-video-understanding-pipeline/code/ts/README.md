<a id="lesson-12---video-understanding-pipelinetypescript-ui"></a>

# 第 12 课：视频理解流水线（TypeScript 界面）

综合项目的 TypeScript 部分。Python 侧（`code/main.py`）负责
多向量索引和时间定位。这里交付的是仪表盘：
一个覆盖流水线四个阶段（chunk、embed、index、qa）的 Hono 应用。

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
