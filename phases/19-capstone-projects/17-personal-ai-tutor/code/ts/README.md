# 第 17 课 - Personal AI Tutor（TypeScript web app）

capstone 的 TypeScript 部分。Python 侧交付 learner model 和
tutor policy；这个项目暴露 web-app 表面：一个 curriculum DAG
walker、一个 BKT 风格的 learner model，以及一个 FSRS-lite spaced-repetition
scheduler，并通过两个 HTTP routes 提供。

## 布局

```text
src/
  index.ts       入口：demo（默认）或 HTTP server（--serve）
  server.ts      Hono routes（GET /lesson/next, POST /lesson/:id/submit）
  curriculum.ts  DAG fixture + Kahn topo sort + next-lesson picker
  mastery.ts     MasteryStore（per-lesson BKT-ish update）
  repetition.ts  scheduleNextDue（interval doubling / halving, clamped）
  types.ts       Lesson, Mastery, Pick
tests/
  curriculum.test.ts  topo order、BKT update、FSRS scheduling
```

## 运行

```bash
npm install
npm run typecheck
npm test
npm start            # 自行终止的 curriculum walk
npm run serve        # :8090 上的 HTTP server
```
