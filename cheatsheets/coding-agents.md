---
id: coding-agents
title: Coding Agents: Landscape and Capstones
code: CL
subtitle: 选好脚手架，设定预算与门禁，运行毕业项目 agent 以及三个编码 agent 项目。
hue: 25
sources: phases/15-autonomous-systems/09-coding-agent-landscape, phases/19-capstone-projects/01-terminal-native-coding-agent, phases/19-capstone-projects/09-code-migration-agent, phases/19-capstone-projects/16-github-issue-to-pr-agent, phases/19-capstone-projects/29-end-to-end-coding-task-demo, projects/tiny-coding-agent, projects/rust-agent-shell, projects/pr-review-reporter
source_hash: 409e63299e9dca9c
---

## JSON 工具调用对比 CodeAct
type: comparison
from: phases/15-autonomous-systems/09-coding-agent-landscape/docs/en.md, phases/15-autonomous-systems/09-coding-agent-landscape/code/main.py

| 维度 | JSON 工具调用 | CodeAct |
|---|---|---|
| 一个动作是 | 一份结构化 JSON 负载 | 一整段 Python 程序 |
| 审计 | 容易，每轮一个动作 | 较难，影响范围大 |
| 组合能力 | 有限 | 可循环、串联工具、捕获错误 |
| 安全 | 每次调用都过验证器 | 需要加固的沙箱 |
| 玩具示例中的影响范围 | 每个动作 1 个文件 | 一次性改动所有失败文件 |
| 主流于 | 托管服务 | 开放平台 |

## 三个毕业项目 agent
type: comparison
span: 2
from: phases/19-capstone-projects/01-terminal-native-coding-agent/docs/en.md, phases/19-capstone-projects/16-github-issue-to-pr-agent/docs/en.md, phases/19-capstone-projects/09-code-migration-agent/docs/en.md

| 维度 | 终端 agent（01） | Issue 到 PR（16） | 迁移（09） |
|---|---|---|---|
| 触发 | `agent run <repo> "<task>"` | Issue 标签 `@agent fix this` | `migrate <repo> --target java17` |
| 沙箱 | E2B 或 Daytona，git worktree | 每个任务一个 Daytona 或 E2B | 每个分支一个 Daytona |
| 轮数上限 | 50 轮 | 30 个 agent 轮次 | 20 个 agent 轮次 |
| 成本上限 | 每个任务 $5 | 每个 PR $20，每个仓库每天 5 个 PR | 每个仓库 $8 |
| 其他上限 | 200k 上下文 | 30 分钟墙钟时间 | 每个仓库 30 分钟 |
| PR 前的门禁 | 测试通过 | 沙箱内完整 CI，覆盖率变化 | 测试通过，覆盖率下降不超过 2% |
| 失败时 | `Stop` hook 写出 trace 包 | CI 变红：停止，不提 PR | 失败类别加复现步骤 |

## 何时选用
type: concepts
from: phases/15-autonomous-systems/09-coding-agent-landscape/docs/en.md, phases/19-capstone-projects/01-terminal-native-coding-agent/docs/en.md, phases/19-capstone-projects/16-github-issue-to-pr-agent/docs/en.md, phases/19-capstone-projects/09-code-migration-agent/docs/en.md

- **用 JSON 工具调用的情况**：每个动作都需要显式验证器，并且要便于审计。
- **用 CodeAct 的情况**：一个动作必须跨多个文件串联工具。先加固沙箱。
- **用终端 agent 的情况**：CLI 进、PR 出，并有一份实时计划。
- **用 Issue 到 PR 的情况**：交互方式就是一个 GitHub 标签。没有交互循环，没有终端。
- **用迁移 agent 的情况**：测试套件是跨多个仓库的事实标准。
- **先用确定性脚本**：它们能解决 70 到 80% 的机械性迁移修复。

## 需要知道的数字
type: concepts
from: phases/15-autonomous-systems/09-coding-agent-landscape/docs/en.md, phases/19-capstone-projects/01-terminal-native-coding-agent/docs/en.md

- **SWE-bench Verified**：不到三年从 4% 涨到 80.9%。500 个人工筛选的任务。
- **脚手架差异**：Claude Sonnet 4.5 在 SWE-agent v1 上得 43.2%，在 Cline 上得 59.8%。
- **简单长尾**：500 个 Verified 任务中有 161 个只需改动 1 或 2 行。
- **SWE-bench Pro**：10+ 行的改动。前沿系统得分 23 到 59%。
- **验证器循环**：在 SWE-bench 上带来 10+ 分的提升。
- **Live-SWE-agent**：使用 Opus 4.5，在 SWE-bench Verified 上得 79.2%。

## 终端 agent 测试框架（01）
type: architecture
from: phases/19-capstone-projects/01-terminal-native-coding-agent/docs/en.md

```arch
node | cli | 1,1 | User CLI | agent run | client
node | harness | 2,1 | Harness | Bun + Ink TUI | process
node | loop | 3,1 | Plan, act, observe | TodoWrite plan state | process
node | model | 4,1 | Model | via OpenRouter | model
node | tools | 3,2 | Tool dispatcher | MCP StreamableHTTP | process
node | box | 2,2 | Sandbox | E2B or Daytona, worktree | process
node | hooks | 1,2 | Hooks | 8 lifecycle events | queue
node | otel | 1,3 | OpenTelemetry | Langfuse: spans, tokens, $ | store
node | pr | 2,3 | PR | via GitHub app | client
edge | cli | harness |
edge | harness | loop |
edge | loop | model | calls
edge | loop | tools | tool calls
edge | tools | box | run
edge | box | hooks |
edge | hooks | otel |
edge | otel | pr |
```

## 运行课程
type: task-table
span: 2
from: phases/15-autonomous-systems/09-coding-agent-landscape/docs/en.md, phases/19-capstone-projects/01-terminal-native-coding-agent/code, phases/19-capstone-projects/09-code-migration-agent/code/main.py, phases/19-capstone-projects/16-github-issue-to-pr-agent/code/main.py, phases/19-capstone-projects/29-end-to-end-coding-task-demo/docs/en.md

| 任务 | 代码 |
|---|---|
| 对比玩具脚手架（L09） | `code/main.py` |
| 规划、行动、观察循环（01） | `python main.py` |
| TS 测试框架演示加离线评估 | `npm start` |
| 模拟 50 次迁移（09） | `python main.py` |
| 把 20 个 issue 分派到 3 个仓库（16） | `python main.py` |
| 修复 fizz fixture（29） | `python3 code/main.py` |
| 测试端到端演示 | `python3 -m pytest code/tests/ -v` |

## 三个项目
type: comparison
span: 2
col: 1
from: projects/tiny-coding-agent, projects/rust-agent-shell, projects/pr-review-reporter

| 维度 | tiny-coding-agent | rust-agent-shell | pr-review-reporter |
|---|---|---|---|
| 构建 | 用精确补丁的有界修复循环 | Rust stdin/stdout 动作循环 | 带锚点的补丁审阅报告 |
| 语言 | Python 3.10+ | Rust 加 Python 适配器 | Node 22.18+ 上的 TypeScript，Python |
| 输入 | 工作区加 `proposals.json` | 工作区加 `requests.jsonl` | 统一 diff，stdin 或 `--repo` |
| 输出 | `repair-trace.json` | 按请求 id 输出 JSONL 事件 | `review.json`、`review.html`、SARIF |
| 预算 | `--max-steps` 默认 6 | `--limit` 默认 50 | diff 最多一兆字节 |
| 安全 | 路径约束，只有一个测试命令 | 没有 OS shell，读取上限 16 KiB | HTML 转义，精确引用门禁 |
| 终止状态 | `completed`、`failed`、`budget_exhausted` | `ok`、`error`、`rejected` | 发现被接受或被拒绝 |

## 项目命令
type: command-table
span: 2
col: 3
from: projects/tiny-coding-agent/README.md, projects/rust-agent-shell/README.md, projects/pr-review-reporter/README.md

| 命令 | 作用 |
|---|---|
| `project_test.py <project> --init learning-artifacts/<project>` | 创建学习者工作区 |
| `project_test.py <project> --stage 1 --path <workspace>` | 评分一个阶段 |
| `project_test.py <project> --all --solution --strict` | 检查参考实现 |
| `cli.py <workspace> <proposals> --copy-to <dir> --out <trace>` | 修复一份一次性副本 |
| `client.py <workspace> <requests> --limit 8 --out <file>` | 通过适配器运行 Rust shell |
| `node cli.ts --diff samples/change.diff --sarif review.sarif` | 写出 JSON、HTML 和 SARIF |
| `--repo /path --base REF --head REF` | 只读的 Git diff 模式 |
| `--candidates recorded-findings.json` | 验证另一位审阅者的发现 |

## 代码中的预算
type: defaults
col: 1
from: phases/19-capstone-projects/01-terminal-native-coding-agent/code/main.py, phases/19-capstone-projects/09-code-migration-agent/code/main.py, phases/19-capstone-projects/29-end-to-end-coding-task-demo/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_turns` | 50 | 毕业项目 01 的 `Budget` |
| `max_tokens` | 200_000 | 毕业项目 01 的上下文上限 |
| `max_dollars` | 5.00 | 毕业项目 01，每个任务 |
| `TRUNCATE_BYTES` | 4096 | 01 中的工具输出上限 |
| `BUDGET_TURNS` | 20 | 迁移，配合 `BUDGET_USD` 8.0 |
| `step_budget` | 12 | L29 的 `AgentRun` |

## 门禁链与沙箱（29）
type: annotated-code
col: 1
lang: python
from: phases/19-capstone-projects/29-end-to-end-coding-task-demo/code/main.py

```python
chain = GateChain(gates=(
    WhitelistGate(allowed=frozenset({"read_file", "write_file", "run_tests"})),  # allow-set
    RegexGate.from_strings(items=(r"\brm\s+-rf\b", r"\bsudo\b", r"^/etc/")),  # refused patterns
    BudgetGate(max_tokens=budget),  # observation budget
))
outcome = self.chain.evaluate(call, ctx)  # stops at the first deny
sandbox = Sandbox(project_root=repo, timeout_seconds=10.0)  # denylist plus path jail
```

## 故障排查
type: troubleshooting
col: 3
from: phases/15-autonomous-systems/09-coding-agent-landscape/docs/en.md, phases/19-capstone-projects/01-terminal-native-coding-agent/docs/en.md, phases/19-capstone-projects/01-terminal-native-coding-agent/code/main.py, phases/19-capstone-projects/09-code-migration-agent/docs/en.md, phases/19-capstone-projects/16-github-issue-to-pr-agent/docs/en.md, phases/19-capstone-projects/16-github-issue-to-pr-agent/code/main.py, projects/tiny-coding-agent/solution/main.py, projects/rust-agent-shell/solution/main.rs

| 现象 | 原因 | 解决 |
|---|---|---|
| 8MB 的 ripgrep 匹配结果让循环崩溃 | 工具输出未截断 | 每次调用上限 4k token |
| `rm -rf` 进入了沙箱 | 没有 `PreToolUse` 防护 | `destructive_guard` 设置 `blocked` |
| Verified 分数高，真实效果弱 | 简单长尾，500 个任务中占 161 个 | 从你自己的积压任务中挑类似 Pro 的子集来评分 |
| `budget_exhausted` | 用完了 30 分钟、$8 或 20 轮 | 带上当前 diff 登记该仓库 |
| `coverage_regression` | 覆盖率下降超过 2% | 按类别登记，不提 PR |
| `policy_denied` | `can("force_push")` 返回 False | 分支保护，应用不在绕过名单中 |
| `patch must match exactly once` | 旧文本缺失或不唯一 | 使用唯一且精确的旧字符串 |
| `path escapes root` | 路径离开了规范根目录 | 传入根目录内的相对路径 |

## 问答
type: qa
span: 2
col: 3
from: phases/15-autonomous-systems/09-coding-agent-landscape/docs/en.md, phases/15-autonomous-systems/09-coding-agent-landscape/code/main.py, phases/19-capstone-projects/16-github-issue-to-pr-agent/code/main.py

- **哪个编码 agent 最好？** 问题问错了。要在你自己的任务分布上衡量可靠性。
- **为什么玩具 CodeAct 用的轮数更少？** 一段代码就能一次性改写所有失败文件。
- **为什么安全门禁不用 `assert`？** `python -O` 会去掉 assert。
