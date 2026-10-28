---
id: multi-agent-case-studies
title: Multi-Agent Case Studies and Eval Farms
code: MF
subtitle: 三个 2026 参考系统、软件团队毕业项目，以及用 Go 实现的带围栏、可恢复评测农场。
hue: 210
sources: phases/16-multi-agent-and-swarms/25-case-studies-2026-sota, phases/19-capstone-projects/10-multi-agent-software-team, projects/distributed-eval-farm
source_hash: 75cf32b6d4c0f5e0
---

## 三个参考案例
type: comparison
from: phases/16-multi-agent-and-swarms/25-case-studies-2026-sota/docs/en.md, phases/16-multi-agent-and-swarms/25-case-studies-2026-sota/code/main.py

| 维度 | Anthropic Research | MetaGPT / ChatDev | OpenClaw / Moltbook |
|---|---|---|---|
| 拓扑 | Supervisor-worker | SOP 角色分解 | 人口规模基底 |
| 关键结果 | 相对单 agent Opus 4 提升 +90.2% | MacNet：经 DAG 超过 1000 个 agent | 数天内约 230 万 agent 账号 |
| 成本信号 | 每次查询 15x token | 按角色预算 | 按交互计价 |
| 可复制模式 | 新鲜上下文的子 agent | 结构化产物交接 | Prompt injection 威胁模型 |
| 校验 | 显式 verifier 角色 | QA Engineer | 网络内校验器 |
| 框架 | Claude Agent SDK 或 LangGraph | CrewAI 或 MetaGPT | 自定义基底 + MCP + A2A |
| 适合 | 研究与知识类任务 | 工程工具链 | 网络效应社交产品 |

## 共通模式
type: concepts
from: phases/16-multi-agent-and-swarms/25-case-studies-2026-sota/docs/en.md

- **Orchestrator + workers**：每个案例都有 supervisor 或网络效应。
- **交接契约**：角色之间的产物遵循 schema。
- **校验**：每个案例里都是一等角色。
- **扩展**：靠拓扑 + 基底，而不只是加更多 agent。
- **工作量缩放**：简单任务是 1 个 agent、3-10 次工具调用。复杂任务是 10+ 个子 agent。
- **彩虹发布**：为进行中的 agent 保留旧运行时版本。
- **Prompt injection**：把 agent 画像和跨 agent 消息当作不可信输入。

## 把设计映射到案例
type: annotated-code
lang: python
from: phases/16-multi-agent-and-swarms/25-case-studies-2026-sota/code/main.py

```python
def map_to_case(d: Design) -> str:
    if d.task_type == "population" or d.user_facing_network:
        return "openclaw_moltbook"
    if d.task_type == "engineering" or d.roles_distinct:
        return "metagpt_chatdev"
    return "anthropic_research"        # research and the default
print_case(case_key)                   # patterns, framework, citation
print_landscape()                      # FRAMEWORK_LANDSCAPE rows
```

## 软件团队构建步骤
type: flow
from: phases/19-capstone-projects/10-multi-agent-software-team/docs/en.md

1. **任务板**：文件后端的 typed 消息 JSONL。Agent 按标签订阅。
2. **Architect**：发出一条带有子任务 DAG 与接口的 `plan_request`。
3. **Coder**：每人在一个新的 `git worktree add` 分支上认领一个子任务。
4. **Merge coordinator**：把 N 个分支三方合并进 staging 分支。
5. **Reviewer**：不能批准自己写的 diff。把 `review_feedback` 路由回 coder。
6. **Tester**：在干净沙箱里跑测试套件。失败再打回负责人。
7. **记账**：每个角色边界消息一条 span，带上负载大小和模型。
8. **事后分析**：为每个失败 issue 做交接失败直方图。

## 评测农场架构
type: architecture
from: projects/distributed-eval-farm/README.md, projects/distributed-eval-farm/API.md, projects/distributed-eval-farm/stages/02-fence-each-shard-lease/docs/en.md

```arch
node | cases | 1,1 | cases.json | id, prompt, expected, response | client
node | part | 2,1 | Partition | FNV-1a into shards |
node | store | 3,1 | farm.json | under ledger.lock | store
node | run | 4,1 | run | Parallel pool, bounded waves | process
node | claim | 4,2 | ClaimShard | lock, load, acquire, persist | process
node | work | 3,2 | WorkShard | exact match outside the lock | process
node | done | 2,2 | CompleteShard | reload, Submit while locked | process
node | rep | 1,2 | Report | coverage and receipts | client
edge | cases | part |
edge | part | store | InitFarm
edge | store | run |
edge | run | claim | worker process
edge | claim | work | cases
edge | work | done | result
edge | done | rep |
```

## 评测农场命令
type: command-table
from: projects/distributed-eval-farm/README.md, projects/distributed-eval-farm/API.md, projects/distributed-eval-farm/stages/02-fence-each-shard-lease/docs/en.md

| 命令 | 作用 |
|---|---|
| `go build -o /tmp/eval-farm .` | 在 `solution` 中构建参考二进制 |
| `init --store DIR --input FILE --shards N` | 绑定数据集哈希与分片数 |
| `run ... --shards N --workers W` | 启动有界进程波次 |
| `worker --store DIR --worker-id NAME` | 认领、评测并提交一个分片 |
| `status --store DIR` | 校验并报告快照 |
| `demo --input FILE` | 打印崩溃与恢复快照 |
| `--crash-after-claim` | 持久认领后以 86 退出 |
| `--all --solution --strict` | 用 `project_test.py` 给参考实现打分 |

## 评测农场契约
type: task-table
from: projects/distributed-eval-farm/solution/stage1.go, projects/distributed-eval-farm/solution/stage2.go, projects/distributed-eval-farm/solution/stage3.go, projects/distributed-eval-farm/solution/stage4.go, projects/distributed-eval-farm/solution/types.go

| 任务 | 代码 |
|---|---|
| 阶段 1，按 ID 稳定分片 | `Partition(ids []string, shards int)` |
| 哈希一个 ID | `h := fnv.New32a()` |
| 阶段 2，围栏租约 | `Acquire(l, worker, now, ttl)` |
| 阶段 3，接受一条结果 | `Submit(l, worker, version, now, result)` |
| 阶段 4，有界池 | `Parallel(ctx, ids, workers, run)` |
| 租约字段 | `Shard, Worker, Version, Until, Result, Done` |
| 错误 | `ErrInvalid`, `ErrConflict`, `ErrLimit` |

## 租约与回执规则
type: annotated-code
lang: go
from: projects/distributed-eval-farm/solution/stage2.go, projects/distributed-eval-farm/solution/stage3.go

```go
// Acquire: a done or live lease is a conflict
if l.Done || (l.Worker != "" && now < l.Until) {
l.Until = now + ttl
l.Version++
// Submit: check owner and version first
if l.Worker != worker || l.Version != version {
// a done lease accepts only the same result again
if l.Result == result {
// a first completion must come before expiry
if now >= l.Until {
```

## 默认值与上限
type: defaults
from: projects/distributed-eval-farm/solution/main.go, projects/distributed-eval-farm/API.md, projects/distributed-eval-farm/README.md, projects/distributed-eval-farm/stages/03-accept-idempotent-completion-receipts/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `--shards` | 4 | 固定分区数，范围 1..1024 |
| `--workers` | 2 | 并发进程，范围 1..64 |
| `--lease-ms` | 30000 | 认领时长 |
| `--now-ms` | -1 | 使用墙钟 |
| `--delay-ms` | 0 | 范围 0..60000 |
| `--store` | farm-data | 同机目录 |
| Snapshot size | 4 MiB | 整次运行快照 |
| Result size | 1 MiB | 接受的最大结果 |

## 故障模式
type: troubleshooting
from: projects/distributed-eval-farm/README.md, projects/distributed-eval-farm/API.md, projects/distributed-eval-farm/stages/04-run-a-bounded-local-worker-pool/docs/en.md, phases/19-capstone-projects/10-multi-agent-software-team/docs/en.md, phases/16-multi-agent-and-swarms/25-case-studies-2026-sota/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| Worker 以 86 退出 | 认领后故意崩溃 | 在过期边界再跑一次 |
| Run 以 1 退出且 complete:false | 仍有租约被占用 | 过期后再调用 run |
| 旧 worker 收到 fencing 错误 | 替换者已先提交 | 预期行为。快照不变 |
| 数据集变更导致 run 以 1 退出 | 数据集哈希不同 | 换一个 store |
| 子任务无法实现 | 计划过于含糊 | 用带显式接口的计划模板 |
| Reviewer 批准了 bug | Reviewer 误批 | 注入 bug 探针，调整提示 |
| 病毒式 prompt 扩散到 agent | 规模化 prompt injection | 把跨 agent 消息当不可信 |
| 研究类 agent 产生幻觉 | 没有显式 verifier 角色 | 加 verifier，约占 20-30% token |

## 要记住的数字
type: concepts
from: phases/16-multi-agent-and-swarms/25-case-studies-2026-sota/docs/en.md, phases/19-capstone-projects/10-multi-agent-software-team/docs/en.md, projects/distributed-eval-farm/README.md

- **Token 用量**：解释 BrowseComp 方差的 80%。
- **MAST**：真实多 agent 系统失败率 41-86.7%。
- **OpenClaw**：约 4 个月内获得 247k GitHub star。
- **毕业项目评测**：50 个 SWE-bench Pro issue，对照一个 Sonnet 4.7 基线。
- **评分表**：25 pass@1，20 加速，20 审阅质量，20 token，15 协调。
- **农场样例**：四条记录得分 3/4。两波启动四个进程。

## 问答
type: qa
from: phases/16-multi-agent-and-swarms/25-case-studies-2026-sota/docs/en.md, phases/19-capstone-projects/10-multi-agent-software-team/docs/en.md, projects/distributed-eval-farm/README.md, projects/distributed-eval-farm/stages/03-accept-idempotent-completion-receipts/docs/en.md

- **为什么多 agent 研究能赢？** 每个子 agent 拿到新鲜的上下文窗口。
- **用哪个基准？** SWE-bench Pro。Verified 已被污染。
- **毕业项目在测什么？** 多 agent 是否按美元更划算，而不只是能不能跑通。
- **迟到的正确 worker 能覆盖吗？** 不能。当 new/v2 已完成分片时，old/v1 会失败。
- **在 109 恢复会偷走租约吗？** 不会。它报告一次挂起的 run 并以 1 退出。
