# Capstone 19/01 — Terminal-Native Coding Agent (TypeScript)

用于 `../docs/en.md` 中描述的 plan/act/observe loop 的多文件 TypeScript harness。离线、确定性、零网络调用。

## Layout

```text
src/
  index.ts     入口点；运行脚本化 demo 和 eval，然后以 0 退出
  repl.ts      交互式命令 parser（run / eval / help / quit）
  harness.ts   plan-act-observe loop，通过 hook bus 连接
  hooks.ts     八事件 hook bus 加 destructive-command guard
  model.ts     驱动 demo 的脚本化离线 LLM
  tools.ts     read_file + run_shell，参数经过 zod validation
  plan.ts     PlanState（todo rewrite）+ Budget（turn / token / dollar ceilings）
  eval.ts      三个离线任务上的小型 pass/fail counter
  types.ts     共享 shape definitions
tests/
  harness.test.ts
  tools.test.ts
```

## Run

```bash
npm install
npm start                # 运行脚本化 demo + 离线 eval，以 0 退出
npm start -- --repl      # 打开交互式 harness REPL
npm test                 # 通过 tsx 使用 node --test runner
npm run typecheck        # tsc --noEmit
```

非交互式 `npm start` 路径会断言 eval 报告 `passed=3
failed=0`，并且脚本化运行收敛到 all-done plan。任何 drift
都会使运行失败。
