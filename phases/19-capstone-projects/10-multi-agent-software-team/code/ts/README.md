# Multi-agent 软件团队（TypeScript 骨架）

用于 multi-agent 软件团队 capstone 的多文件 TypeScript 骨架。
planner、coder 和 reviewer agents 共享一个 workspace，并通过
coordinator 轮转。worktree stub 通过带有 denylist 和 shell-metachar 拒绝机制的
execFile 启动子进程。

## 布局

- `src/index.ts` — demo runner。
- `src/agent.ts` — 基础 `Agent` class，以及 `PlannerAgent`、`CoderAgent`、`ReviewerAgent`。
- `src/coordinator.ts` — round-robin loop 和 rotation tracking。
- `src/workspace.ts` — 共享的 in-memory filesystem 和 message log。
- `src/runtime.ts` — 带有 denylist 的 `child_process.execFile` worktree stub。
- `src/types.ts` — 共享 types。
- `tests/*.test.ts` — 通过 `tsx` 运行的 `node --test` 风格 tests。

## 安装

```bash
npm install
```

## 运行

```bash
npm start
```

## 验证

```bash
npm run typecheck
npm test
```

## Spec references

- Source lesson: `phases/19-capstone-projects/10-multi-agent-software-team/docs/en.md`
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) 基于 role 的 multi-agent framework。
