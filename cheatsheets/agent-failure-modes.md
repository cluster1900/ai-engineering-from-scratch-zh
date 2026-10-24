---
id: agent-failure-modes
title: Why Agents Fail
code: WA
subtitle: 给故障命名，在 trace 中找到它，再用门禁拦住。检测器、MAST、重试风暴、PVE 与 trace 调试器。
hue: 0
sources: phases/14-agent-engineering/25-multi-agent-debate, phases/14-agent-engineering/26-failure-modes-agentic, phases/14-agent-engineering/27-prompt-injection-defense, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink, projects/agent-trace-debugger
source_hash: 7b1f84213ea46a0a
---

## 现象、原因与修复
type: troubleshooting
span: 2
from: phases/14-agent-engineering/26-failure-modes-agentic/docs/en.md, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/docs/en.md, phases/14-agent-engineering/27-prompt-injection-defense/docs/en.md, phases/14-agent-engineering/25-multi-agent-debate/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 遇到 400 错误却报成功 | 成功幻觉 | 重新探测状态。文件真的创建了吗？ |
| 一次错误调用引发四次 API 调用 | 级联错误 | 每一步都设自动验证门禁 |
| 下游负载涨到 10x | 重试风暴 | 熔断器，并给每个请求设重试预算上限 |
| 准确率逐渐下降，但不崩溃 | 记忆投毒 | 只追加日志、来源记录、不可写的验证器 |
| 三个 agent 给出同一个错误答案 | 单一化坍塌 | 使用不同的提示词和/或模型 |
| 两个 agent 都以为自己是审阅者 | 角色模糊 | 每个任务明确角色契约和验收测试 |
| Agent A 以为已完成，agent B 仍在运行 | 状态漂移 | 带版本的共享状态、状态同步检查点 |
| 检索到的页面覆盖了开发者提示词 | 间接提示注入 | 所有检索内容都视为不可信。加上 PVE |

## 五种常见模式及其检测器
type: command-table
from: phases/14-agent-engineering/26-failure-modes-agentic/code/main.py, phases/14-agent-engineering/26-failure-modes-agentic/docs/en.md

| 命令 | 作用 |
|---|---|
| `detect_hallucinated_action` | 工具名不在 `KNOWN_TOOLS` 中 |
| `detect_scope_creep` | 请求中没有写入类词语，却发生了 `write_file` 调用 |
| `detect_cascading_errors` | 一次错误之后又有 2 次或更多工具调用 |
| `detect_context_loss` | 工具参数中出现“do not”词元 |
| `detect_tool_misuse` | 缺少工具 schema 要求的参数 |
| `detect_success_hallucination` | 声称成功、有写入意图，但状态未变 |
| `tag(trace)` | 运行全部 `DETECTORS`，返回标签 |
| `python3 code/main.py` | 每条 trace 的标签与总体分布 |

## MAST 根类别
type: concepts
from: phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/docs/en.md, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/code/main.py, phases/14-agent-engineering/26-failure-modes-agentic/docs/en.md

- **来源**：1642 条执行 trace，7 个开源 MAS，失败率 41-86.7%。
- **规格问题（41.77%）**：角色模糊、任务不清、成功标准隐含。
- **协调失败（36.94%）**：消息丢失、共享状态未同步、状态漂移。
- **验证缺口（21.30%）**：一个 agent 声称成功，却没人验证。
- **代价**：验证缺口单次失败代价最高。它们静默失败。
- **代码**：`categorize_incident(symptoms)` 返回 `spec`、`coord`、`verify` 或 `unknown`。

## 群体思维类
type: glossary
from: phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/docs/en.md, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/code/main.py

- **单一化坍塌**：同一个基座模型产生相关的错误。信号 `correlated_errors`。
- **从众偏差**：agent 向最强势的同伴看齐。信号 `agreement_rate_spike`。
- **心智理论（ToM）不足**：agent 无法对彼此建模。信号 `coordination_drop_long_horizon`。
- **混合动机动态**：折中方案谁都不满意。信号 `compromise_outputs`。
- **级联可靠性失败**：一种错误模式引发其他错误。信号 `retry_amplification`。
- **STRATUS**：检测、诊断和验证三类 agent。缓解成功率提升 1.5x。

## 重试风暴
type: flow
from: phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/docs/en.md

1. **支付服务**：10% 的请求失败。
2. **订单 agent**：每次重试都是一次新的订单-库存检查。
3. **库存服务**：负载达到平常的 2x，开始超时。
4. **每个订单**：都在重试。库存负载达到 10x。集群宕机。
5. **修复**：熔断器用缓存或默认结果直接短路。

## 熔断器与风暴模拟器
type: annotated-code
lang: python
from: phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/code/main.py

```python
breaker = CircuitBreaker()           # starts BreakerState.CLOSED
breaker.allow()                      # False while OPEN, inside cooldown
breaker.record(ok)                   # opens when error rate > threshold
# HALF_OPEN: one success closes, one failure opens again
service = DownstreamService()        # base_failure_rate 0.1
effective_rate = self.base_failure_rate + (self.load * 0.02)
while attempts_for_req < 4:          # retry budget per request
    ...
simulate_retry_storm(200, use_breaker=True, seed=0)
# returns total_calls, successes, short_circuits
```

## 默认值与数字
type: defaults
span: 1
from: phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/code/main.py, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/docs/en.md, phases/14-agent-engineering/26-failure-modes-agentic/docs/en.md, phases/14-agent-engineering/25-multi-agent-debate/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `failure_threshold` | 0.5 | 打开熔断器的错误率 |
| `window_size` | 20 | 计算错误率所用的最近结果数 |
| `open_cooldown_s` | 0.5 | 进入 HALF_OPEN 前的时间 |
| 生产环境打开阈值 | 5-10% | 每个出站调用的错误率 |
| CI trace 门禁 | >=5% | 课程练习。trace 标记出某种模式时让构建失败 |
| 审计 trace 样本 | 约 1000 | 每次故障模式审计所用的真实 trace 数 |
| 辩论 N、R | N=3、R=2 | 原始实验的取值，出于成本考虑 |

## PVE：提示—验证—执行（Prompt-Validator-Executor）
type: architecture
from: phases/14-agent-engineering/27-prompt-injection-defense/docs/en.md, phases/14-agent-engineering/27-prompt-injection-defense/code/main.py

```arch
node | user | 1,1 | User message | source user_message | client
node | ret | 1,2 | Retrieved content | web, memory, tool output | store
node | main | 2,1 | Main model | proposes a ToolCall | model
node | val | 3,1 | Validator | allowlist + marker scan | process
node | exec | 4,1 | Executor | runs approved call | process
node | ref | 3,2 | Refusal | try a different approach |
edge | user | main | intent
edge | ret | val | scanned
edge | main | val | candidate call
edge | val | exec | allow
edge | val | ref | reject
edge | ref | main | retry
```

## 辩论拓扑
type: comparison
from: phases/14-agent-engineering/25-multi-agent-debate/docs/en.md, phases/14-agent-engineering/25-multi-agent-debate/code/main.py

| 维度 | 全网状 | 稀疏星形 |
|---|---|---|
| 谁读谁 | 每个辩手读所有同伴 | 辐条只读中心 |
| N=5, R=3 提案数 | 15 | 15 |
| N=5, R=3 批评操作数 | 60 | 12 |
| 失败风险 | 收敛坍塌 | 中心失效 |
| 缓解 | 强制设置分歧轮次 | 轮换中心或使用多个中心 |
| 代码 | `full_mesh_round` | `sparse_star_round` |

## Agent Trace 调试器
type: task-table
span: 2
from: projects/agent-trace-debugger/README.md, projects/agent-trace-debugger/API.md, projects/agent-trace-debugger/solution/cli.ts

| 任务 | 代码 |
|---|---|
| 初始化工作区 | `python3 scripts/project_test.py agent-trace-debugger --init learning-artifacts/agent-trace-debugger` |
| 评分一个阶段 | `python3 scripts/project_test.py agent-trace-debugger --stage 1 --path learning-artifacts/agent-trace-debugger --strict` |
| 与基线对比 | `node cli.ts --input samples/trace.jsonl --baseline samples/before.jsonl --output trace.html --json trace.json` |
| 导入 OTLP JSON | `node cli.ts --format otlp --input samples/otlp.json --output otlp-trace.html --json otlp-trace.json` |
| 公开 API | `parseTrace`、`validateTree`、`unionDuration`、`analyze`、`render` |
| 回归字段 | `wall_time_delta_ms`、`token_delta`、`error_delta` |

## Trace 调试器错误
type: troubleshooting
span: 1
from: projects/agent-trace-debugger/solution/main.ts, projects/agent-trace-debugger/solution/cli.ts, projects/agent-trace-debugger/stages/01-parse/docs/en.md, projects/agent-trace-debugger/README.md

| 现象 | 原因 | 解决 |
|---|---|---|
| `invalid JSON line <n>` | 该行不是 JSON | 修正第 n 行。空行也计数 |
| `invalid span line <n>` | 字段错误、`end < start` 或 token 数为负 | 输出 `ok` 或 `error`，并使用有限的时间值 |
| `duplicate span id` | 两个 span 共用一个 id | 让 id 唯一 |
| `span cycle` | 祖先链成环 | 修正父 id |
| `missing parent` | 父 id 不在 trace 中 | 导出父 span |
| `child outside parent` | 子区间超出父区间 | 统一各机器的时钟 |
| `format must be jsonl or otlp` | `--format` 取值错误 | 使用 `jsonl` 或 `otlp` |

## 问答
type: qa
from: phases/14-agent-engineering/26-failure-modes-agentic/docs/en.md, phases/14-agent-engineering/27-prompt-injection-defense/docs/en.md, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/docs/en.md, projects/agent-trace-debugger/project.json, projects/agent-trace-debugger/README.md

- **为什么只标记崩溃不够？** 大多数 agent 失败产生的输出看起来都合法。
- **为什么不只在最后加护栏？** 模型已经对外部世界产生了影响。
- **哪些慢性失败代理指标有用？** 一致率、重试率、输出长度分布。
- **为什么要减去子区间的并集？** 并行的子节点会重叠，直接求和会多算。
- **为什么要比较 token 和错误，而不只看墙钟时间？** 样例中耗时保持 100 ms 不变，token 却增加了 200。
