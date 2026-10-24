---
id: agent-benchmarks
title: Agent Benchmarks: SWE-bench to OSWorld
code: AB
subtitle: 选对 benchmark，用正确的测试把关，检查数据污染，并在相同分母上比较多次运行。
hue: 28
sources: phases/14-agent-engineering/19-benchmarks-swebench-gaia, phases/14-agent-engineering/20-benchmarks-webarena-osworld, phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks, projects/harness-bench
source_hash: 7ff044c00ba88674
---

## 单 agent benchmark 对比
type: comparison
span: 2
from: phases/14-agent-engineering/19-benchmarks-swebench-gaia/docs/en.md, phases/14-agent-engineering/20-benchmarks-webarena-osworld/docs/en.md

| 维度 | SWE-bench | GAIA | WebArena | OSWorld |
|---|---|---|---|---|
| 测什么 | 代码打补丁 | 通用工具使用 | Web 任务，长程 | 真实电脑任务 |
| 规模 | 2,294 个 issue，12 个 Python 仓库 | 466 道题，300 道私有 | 812 个任务，4 个应用 | 369 个任务，3 种操作系统 |
| Agent 输入 | 修复前 commit 的代码库 + issue | 问题。Web，多模态 | 自托管应用 + 工具 | 1920×1080 截图 |
| 评估器 | FAIL_TO_PASS 与 PASS_TO_PASS 测试 | 未给出 | 基于执行，gym API | 未给出 |
| 发布时最佳 | SWE-agent 12.5% | 带插件的 GPT-4 15% | GPT-4 agent 14.41% | 最佳模型 12.24% |
| 人类 | 未给出 | 92% | 78.24% | 72.36% |
| 主要陷阱 | 数据污染 | 与代码 benchmark 混淆 | 固定的应用版本过时 | GUI grounding |

## 多 agent benchmark 对比
type: comparison
span: 2
from: phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks/docs/en.md

| 维度 | MARBLE | COMMA | MedAgentBoard | SWE-bench Pro |
|---|---|---|---|---|
| 衡量什么 | 星形、链式、树形、图拓扑 | 多模态非对称信息 | 4 类医疗任务 | 无污染，截止日期更晚 |
| 打分 | 里程碑 KPI，部分进度 | agent 与 agent 协作 | 多 agent vs 单 LLM vs 规则 | 1865 道题，41 个仓库 |
| 结论 | 研究任务上图拓扑最好 | 前沿模型对比随机基线也吃力 | 多 agent 并不占优 | Pro 上约 23%，Verified 上 70%+ |
| 启示 | 认知规划约提升 3% | 先测量再下结论 | 很多系统过度设计 | 只有 Verified 不足为证 |

## 何时用哪个
type: tips
from: phases/14-agent-engineering/19-benchmarks-swebench-gaia/docs/en.md, phases/14-agent-engineering/20-benchmarks-webarena-osworld/docs/en.md, phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks/docs/en.md

- SWE-bench Verified：代码 agent。始终报告 Verified 分数。
- SWE-bench Pro：检验数据污染的现实标尺。Pro 是当前的把关测试。
- GAIA：通用 agent。使用私有排行榜划分。
- AgentBench：跨 8 个环境的多环境对比。
- WebArena Verified：Web agent。自托管以便持续评估。
- OSWorld：桌面 agent。在 VM 集群中运行。
- MARBLE：在同等条件下比较协作拓扑。
- AgentArch：必须论证企业技术栈的每一层。
- 自定义评估：你的产品流程。为排名前 20 的任务采集黄金轨迹。

## SWE-bench 把关：run_task
type: flow
from: phases/14-agent-engineering/19-benchmarks-swebench-gaia/code/main.py, phases/14-agent-engineering/19-benchmarks-swebench-gaia/docs/en.md

1. **Harness**：复制 `state_before`。统计通过的 FAIL_TO_PASS 与 PASS_TO_PASS 检查数。
2. **Agent**：把补丁应用到状态的副本上。
3. **Harness**：在新状态上再次统计通过的检查数。
4. **修复关**：打补丁后所有 FAIL_TO_PASS 测试必须通过。
5. **无回归关**：`ptp_broke` 必须为 0。
6. **结果**：只有两关都通过时 `resolved` 才为 true。
7. **报告**：解决率 = 已解决任务数 / 全部任务数。

## Harness Bench 流水线
type: architecture
from: projects/harness-bench/solution, projects/harness-bench/README.md

```arch
node | cases | 1,1 | Cases JSON | ID, Prompt, Expected | store
node | load | 2,1 | Cases() | strict decode, max 1000
node | eval | 3,1 | EvaluatePolicy() | 3 policies, call budget | process
node | board | 4,1 | Leaderboard() | equal denominators
node | rec | 2,2 | Recording | authored_fixture | store
node | http | 3,2 | HTTPModel() | chat-completions | model
node | score | 4,2 | Correct() | exact answer contract
edge | cases | load |
edge | load | eval | cases
edge | rec | eval | NewModel
edge | http | eval | ContextModel
edge | eval | score | answer
edge | eval | board | Result
```

## 运行课程与项目
type: command-table
span: 2
from: phases/14-agent-engineering/19-benchmarks-swebench-gaia/docs/en.md, phases/14-agent-engineering/20-benchmarks-webarena-osworld/docs/en.md, phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks/docs/en.md, projects/harness-bench/README.md, projects/harness-bench/stages

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` | 运行课程 14.19、14.20 和 16.24 的玩具 harness |
| `python3 scripts/project_test.py harness-bench --init /tmp/harness-bench-work` | 创建学习者工作区 |
| `python3 scripts/project_test.py harness-bench --stage 1 --path /tmp/harness-bench-work --strict` | 评分一个阶段 |
| `python3 scripts/project_test.py harness-bench --all --solution --strict` | 评分参考解答 |
| `go run . --budget 2 --out /tmp/orchard-budget.json` | 以每个策略 2 次调用回放 Orchard |
| `go run . --cases <cases.json> --endpoint <url> --model <model>` | 调用在线的 chat-completions 模型 |
| `--key-env <VAR>` | 指定存放 key 的环境变量 |

## Python 中的玩具 harness 指标
type: annotated-code
lang: python
from: phases/14-agent-engineering/19-benchmarks-swebench-gaia/code/main.py, phases/14-agent-engineering/20-benchmarks-webarena-osworld/code/main.py, phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks/code/main.py

```python
resolved = (ftp_post == len(task.fail_to_pass)) and (ptp_broke == 0)
score = steps + modalities + tools    # GAIA level: <=2 is 1, <=5 is 2, else 3
efficiency = steps / task.gold_steps  # trajectory efficiency, 1.0 is gold
delta = r["accuracy_seen"] - r["accuracy_held"]
contam_flag = "*" if delta > 0.1 else " "  # held-set accuracy is canonical
vs_random = r["accuracy_held"] - rand_baseline  # baseline 0.15
r = run_bench(sys, n_seen=40, n_held=160, seed=17)
```

## CLI 默认值
type: defaults
from: projects/harness-bench/solution/main.go, projects/harness-bench/README.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `--cases` | fixtures/orchard-cases.json | case 的 JSON 数组 |
| `--recording` | fixtures/orchard-recording.json | 设置 `--endpoint` 时忽略 |
| `--budget` | 4 | 每个策略的模型调用次数，最多 10000 |
| `--timeout` | 30s | 每个策略的截止时间，最多 5 分钟 |
| `--temperature` | 0 | HTTP 采样温度 |
| `--max-tokens` | 128 | HTTP 输出 token 上限 |
| Case 上限 | 1000 | 文件限制为一 MiB |
| HTTP 请求上限 | ten seconds | 拒绝重定向和带查询参数的 endpoint |

## 故障排查
type: troubleshooting
span: 2
from: projects/harness-bench/stages, projects/harness-bench/solution, projects/harness-bench/README.md, phases/14-agent-engineering/19-benchmarks-swebench-gaia/docs/en.md, phases/14-agent-engineering/20-benchmarks-webarena-osworld/docs/en.md, phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks/code/main.py

| 现象 | 原因 | 解决 |
|---|---|---|
| `Cases` 返回 `ErrConflict` | 两个 case 共用一个 ID | 给每个 case 唯一的 ID |
| `Cases` 对有效答案返回错误 | `Expected` key 拼写错误 | 修正 key。未知字段会被拒绝 |
| `Leaderboard` 返回 `ErrConflict` | 数据集摘要、模型摘要或预算不同 | 在同一配置上重跑所有策略 |
| `15 min` 与 `15 minutes` 比对失败 | 精确答案契约 | 在单独的契约中声明变体 |
| 状态为 `budget-exhausted` | 一次重试耗尽了预算 | 后续 case 仍计入 `Total`。调大 `--budget` |
| `recording exhausted for requested prompt` | prompt 缺失或数组已用完 | 把精确的策略 prompt 加入 `responses` |
| SWE-bench 50% 在 SWE-bench+ 上降到 35% | issue 文本泄露了解法 | 同时报告 Verified 与 SWE-bench+ 分数 |
| 差值大于 0.1，标记 `*` | 见过的任务比留出任务得分高 | 只引用留出集准确率 |

## 要记住的数字
type: concepts
from: phases/14-agent-engineering/19-benchmarks-swebench-gaia/docs/en.md, phases/14-agent-engineering/20-benchmarks-webarena-osworld/docs/en.md, phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks/docs/en.md, projects/harness-bench/README.md

- **SWE-bench+**：32.67% 的成功补丁泄露了解法。31.08% 的测试偏弱。
- **截止日期**：超过 94% 的 SWE-bench issue 早于大多数模型的截止日期。
- **OSWorld-Human**：顶尖 agent 比黄金轨迹多用 1.4-2.7x 步数。
- **OSWorld-G**：564 个纯 grounding 样本。它把 grounding 与规划分开。
- **Agent 团队增益**：在 SWE-bench Pro 上约 30-40 分的差值。
- **协作税**：在图拓扑上超过约 4 个 agent 后出现。
- **Orchard 回放**：baseline 3 次调用 1/3，error-retry 4 次 2/3，evidence 3 次 3/3。
- **未衡量**：成本、对抗安全、你的领域以及最差的 1% 长尾。

## 结论自查清单
type: qa
from: phases/16-multi-agent-and-swarms/24-evaluation-coordination-benchmarks/docs/en.md, phases/14-agent-engineering/19-benchmarks-swebench-gaia/docs/en.md, projects/harness-bench/README.md

- **哪个 benchmark、哪个划分？** Verified 与 Pro 差距很大。划分用错的数字毫无价值。
- **检查过数据污染？** benchmark 是否在训练截止日期之后发布？如果不是，谨慎对待。
- **哪个基线？** 单 LLM、随机以及先前的多 agent 工作。不是同一系统未调优的副本。
- **显著性？** N 次试验、p 值和置信区间。单次运行会误导。
- **披露成本了吗？** 每个任务的 token 数和墙钟时间。报告 P50/P75/P95，而不是一个数字。
- **回执可比吗？** 相同的数据集 SHA-256、模型配置 SHA-256 和调用预算。
- **答错就重试？** 不。错误重试从不查看预期答案。
