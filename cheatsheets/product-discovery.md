---
id: product-discovery
title: Outcomes, Workflows, Risks and Specs
code: OW
subtitle: 框定结果、落实工作流、给假设排序、选切片、写规格、设指标、选阶段。
hue: 330
sources: phases/14-agent-engineering/47-outcomes-before-output, phases/14-agent-engineering/48-discover-the-real-workflow, phases/14-agent-engineering/49-map-assumptions-and-risk, phases/14-agent-engineering/50-choose-the-smallest-testable-slice, phases/14-agent-engineering/51-write-specifications-that-preserve-judgment, phases/14-agent-engineering/52-design-success-metrics, phases/14-agent-engineering/53-prototype-pilot-or-production
source_hash: 9fddd57a6902430a
---

## 从请求到阶段
type: flow
from: phases/14-agent-engineering/47-outcomes-before-output/docs/en.md, phases/14-agent-engineering/48-discover-the-real-workflow/docs/en.md, phases/14-agent-engineering/49-map-assumptions-and-risk/docs/en.md, phases/14-agent-engineering/50-choose-the-smallest-testable-slice/docs/en.md, phases/14-agent-engineering/51-write-specifications-that-preserve-judgment/docs/en.md, phases/14-agent-engineering/52-design-success-metrics/docs/en.md, phases/14-agent-engineering/53-prototype-pilot-or-production/docs/en.md

1. **Outcome**：不命名方案地框定结果。
2. **Workflow**：记录人们执行的步骤，并带证据。
3. **Assumptions**：给赌注打分。先测风险最高的开放项。
4. **Slice**：选覆盖所需证明的最小切片。
5. **Specification**：固定不变量。标出每一种决策模式。
6. **Metrics**：在结果出现之前设阈值。
7. **Stage**：选择 prototype、pilot 或 production。

## 选择阶段
type: architecture
from: phases/14-agent-engineering/53-prototype-pilot-or-production/docs/en.md, phases/14-agent-engineering/53-prototype-pilot-or-production/code/main.py

```arch
node | unk | 1,1 | Unknown | the learning question | client
node | real | 2,1 | Needs real users or data? | choose_stage |
node | proto | 3,1 | Prototype | discardable, isolated | process
node | ready | 2,2 | Consequence bounded, ops ready? | consequence below 4 |
node | pilot | 3,2 | Pilot | named audience, rollback | process
node | prod | 4,2 | Production | owned continuously | process
edge | unk | real |
edge | real | proto | no
edge | real | ready | yes
edge | ready | pilot | no
edge | ready | prod | yes
```

## 结果框架
type: concepts
from: phases/14-agent-engineering/47-outcomes-before-output/docs/en.md, phases/14-agent-engineering/47-outcomes-before-output/code/main.py

- **User**：谁直接经历这个问题？
- **Situation**：它何时何地发生？
- **Current behavior**：今天发生什么，带着变通办法？
- **Desired outcome**：什么可观察状态会改善？
- **Constraints**：固定的安全、政策、成本或兼容性限制。
- **Non-goals**：被排除的诱人相邻工作。
- **Solution leakage**：结果里出现产品形态、模型或框架。

## 实验公式
type: concepts
from: phases/14-agent-engineering/48-discover-the-real-workflow/code/main.py, phases/14-agent-engineering/49-map-assumptions-and-risk/code/main.py, phases/14-agent-engineering/50-choose-the-smallest-testable-slice/code/main.py, phases/14-agent-engineering/52-design-success-metrics/code/main.py

- **Risk**：$\mathrm{impact} \times \mathrm{uncertainty} + \mathrm{irreversibility}$
- **Slice score**：$\frac{\mathrm{value} + \mathrm{uncertainty\ reduced}}{\mathrm{effort} + \mathrm{risk\ penalty}}$
- **Risk penalty**：不可逆时后果乘 2，否则乘 0.5。
- **Eligible slice**：所需证明是 `proves` 的子集。
- **Direct evidence ratio**：直接项除以全部证据项。
- **`at-most`**：值处于或低于阈值时通过。
- **`at-least`**：值处于或高于阈值时通过。

## 假设与证据
type: concepts
from: phases/14-agent-engineering/49-map-assumptions-and-risk/docs/en.md, phases/14-agent-engineering/48-discover-the-real-workflow/docs/en.md

- **Value**：结果是否足够重要？
- **Usability**：用户能否理解并据此行动？
- **Feasibility**：系统能否在现有数据与约束下产出它？
- **Viability**：组织能否持续承担成本、所有权与运营？
- **Safety**：它能否在不可接受后果之外失败？
- **Evidence ladder**：直接行为、产物、报告行为、推断。
- **Proof of current behavior**：只有前两档。

## 三种决策模式
type: comparison
from: phases/14-agent-engineering/51-write-specifications-that-preserve-judgment/docs/en.md, phases/14-agent-engineering/51-write-specifications-that-preserve-judgment/code/main.py

| Factor | Locked | Bounded | Delegated |
|---|---|---|---|
| Agent 可以 | 不选择 | 在限度内选择 | 拥有选择，并解释它 |
| 用于 | 安全、权限、公开兼容性 | 搜索预算、重试次数 | 名字、可逆重构 |
| 下一步 | 人工检查点 | Agent 在限度内提议 | Agent 实现并证明 |
| 理由 | 必需 | 必需 | 可选 |
| 输出键 | `human_checkpoint` | `bounded_decisions` | `agent_may_decide` |

## Prototype、pilot、production
type: comparison
span: 2
from: phases/14-agent-engineering/53-prototype-pilot-or-production/docs/en.md, phases/14-agent-engineering/53-prototype-pilot-or-production/code/main.py

| Factor | Prototype | Pilot | Production |
|---|---|---|---|
| 问题 | 机制究竟能否产出证据？ | 它能否在有界真实受众上安全工作？ | 我们能否以承诺的可靠性拥有它？ |
| 何时用 | 不需要真实用户或数据 | 需要真实行为，后果未就绪 | 后果有界，运营就绪 |
| 控制 | 合成或录制输入，可丢弃 | 有限受众、回滚、人工所有者、审计轨迹 | SLO、值班所有者、安全评审、监控 |
| 退出 | 机制赢得下一阶段 | 扩大、修订或停止 | 退役路径 |

## 指标契约
type: annotated-code
lang: python
from: phases/14-agent-engineering/52-design-success-metrics/code/main.py, phases/14-agent-engineering/52-design-success-metrics/docs/en.md

```python
plan = MeasurementPlan(
    goal="Reduce time to identify the affected service without increasing unsafe actions",
    questions=["How quickly is the correct service identified?"],
    metrics=[
        Metric("median_identification_seconds", "at-most", 120,
               "ten incident replays", "replay log", "outcome"),
        Metric("correct_service_rate", "at-least", 0.9,
               "ten incident replays", "incident record", "outcome"),
        Metric("production_writes", "at-most", 0,
               "entire pilot", "audit log", "guardrail"),  # required kind
    ])
report(plan, values)          # missing value gives status missing
```

## 实验函数
type: task-table
col: 4
from: phases/14-agent-engineering/47-outcomes-before-output/code/main.py, phases/14-agent-engineering/48-discover-the-real-workflow/code/main.py, phases/14-agent-engineering/49-map-assumptions-and-risk/code/main.py, phases/14-agent-engineering/50-choose-the-smallest-testable-slice/code/main.py, phases/14-agent-engineering/51-write-specifications-that-preserve-judgment/code/main.py, phases/14-agent-engineering/53-prototype-pilot-or-production/docs/en.md, phases/14-agent-engineering/53-prototype-pilot-or-production/code/main.py

| Task | Code |
|---|---|
| 跑一个实验及其测试 | `python3 -m unittest discover code/tests -v` |
| 框架状态 | `decision(frame)` |
| 审计工作流证据 | `audit(steps)` |
| 给假设排序 | `prioritize(items)` |
| 最高开放风险 | `next_experiment(items)` |
| 选合格切片 | `choose(items, required_proof)` |
| 规格到契约 | `compile_contract(specification)` |
| 阶段及其控制 | `plan(decision)` |

## 实验常量
type: defaults
from: phases/14-agent-engineering/48-discover-the-real-workflow/code/main.py, phases/14-agent-engineering/49-map-assumptions-and-risk/code/main.py, phases/14-agent-engineering/51-write-specifications-that-preserve-judgment/code/main.py, phases/14-agent-engineering/53-prototype-pilot-or-production/code/main.py

| Setting | Default | Note |
|---|---|---|
| 风险维度 | range(1, 6) | 影响、不确定性、不可逆性 |
| 证据 `confidence` | 0 <= item.confidence <= 1 | 否则是问题 |
| 工作流 `order` | range(1, len(steps) + 1) | 从一连续 |
| `VALID_MODES` | {"locked", "bounded", "delegated"} | 其他模式无效 |
| 阶段 `consequence` | 1 <= decision.consequence <= 5 | 否则报错 |
| Pilot 的 consequence | 4 | 或不可逆，或未就绪 |

## 校验器消息
type: troubleshooting
span: 2
from: phases/14-agent-engineering/47-outcomes-before-output/code/main.py, phases/14-agent-engineering/50-choose-the-smallest-testable-slice/code/main.py, phases/14-agent-engineering/51-write-specifications-that-preserve-judgment/code/main.py, phases/14-agent-engineering/52-design-success-metrics/code/main.py

| Symptom | Cause | Fix |
|---|---|---|
| `desired outcome names the proposed output` | 方案漏进了结果 | 改陈述可观察结果 |
| `non-goals are empty` | 切片没有边界 | 加能拒绝工作的具体非目标 |
| `no slice proves the required assumptions` | 候选跳过了风险部分 | 设计覆盖证明集的切片 |
| `constrained decision lacks rationale` | Locked 或 bounded 没有理由 | 写下限制的理由 |
| `guardrail metric is missing` | 只有结果指标 | 加 `production_writes` 护栏 |

## 问题
type: qa
from: phases/14-agent-engineering/50-choose-the-smallest-testable-slice/docs/en.md, phases/14-agent-engineering/51-write-specifications-that-preserve-judgment/docs/en.md, phases/14-agent-engineering/52-design-success-metrics/docs/en.md, phases/14-agent-engineering/53-prototype-pilot-or-production/docs/en.md, phases/14-agent-engineering/48-discover-the-real-workflow/docs/en.md

- **便宜切片分数高但缺证明？** 它仍不合格。
- **每一个结果都说继续做？** 切片不是实验。
- **更低层能否证明更高层主张？** 不能。单元测试只证明局部契约。
- **离线回放还是 pilot？** 两者不能互相替代。
- **生产何时开始？** 当组织接受持续责任时。

## 提示
type: tips
from: phases/14-agent-engineering/50-choose-the-smallest-testable-slice/docs/en.md, phases/14-agent-engineering/52-design-success-metrics/docs/en.md, phases/14-agent-engineering/53-prototype-pilot-or-production/docs/en.md, phases/14-agent-engineering/49-map-assumptions-and-risk/docs/en.md

- 避免假最小值：只 UI、只基建、只快乐路径、演示、平台。
- 实现之前写停止规则。
- 在看到结果之前写通过、失败与模糊路径。
- 在配置、访问控制、遥测与文档里标出阶段。
