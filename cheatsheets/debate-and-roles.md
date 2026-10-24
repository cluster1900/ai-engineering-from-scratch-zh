---
id: debate-and-roles
title: Debate, Roles and Review Panels
code: DR
subtitle: 让 N 个 agent 辩论 R 轮，把工作拆给 planner、executor、critic 和 verifier，并用法定人数把关评审。
hue: 285
sources: phases/16-multi-agent-and-swarms/07-society-of-mind-debate, phases/16-multi-agent-and-swarms/08-role-specialization, phases/14-agent-engineering/25-multi-agent-debate, phases/19-capstone-projects/10-multi-agent-software-team, projects/multi-agent-code-review-panel
source_hash: 5dd0d12b5d9d7748
---

## 辩论协议
type: flow
from: phases/16-multi-agent-and-swarms/07-society-of-mind-debate/docs/en.md, phases/14-agent-engineering/25-multi-agent-debate/docs/en.md

1. **N 个 agent 各自**：对问题给出初始答案。
2. **第 r = 2..R 轮**：每个 agent 阅读其他 agent 第 r-1 轮的答案。
3. **每个 agent**：批评同伴并给出更新后的答案。
4. **每一轮**：重新注入问题，防止话题漂移。
5. **R 轮之后**：对最终答案多数投票。
6. **成本**：N 个 agent × R 轮 = N·R 次 LLM 调用，且上下文不断增长。

## 辩论拓扑
type: comparison
from: phases/14-agent-engineering/25-multi-agent-debate/docs/en.md, phases/14-agent-engineering/25-multi-agent-debate/code/main.py

| 因素 | 全连接网状 | 稀疏星形 |
|---|---|---|
| 谁读谁 | 每个辩手读所有同伴 | 辐条只读中心 |
| 运行器 | `full_mesh_round` | `sparse_star_round` |
| 每轮操作数 | 每个辩手 `ops += len(peers)` | 辐条只读中心 |
| N=5, R=3 | 60 次批评操作 | 12 次批评操作 |
| N=5, R=3 时的提案数 | 15 | 15 |
| 主要风险 | 收敛坍缩 | 中心失效 |
| 风险对策 | 强制设置分歧轮 | 轮换或使用多个中心 |

## 四种经典角色
type: concepts
from: phases/16-multi-agent-and-swarms/08-role-specialization/docs/en.md

- **Planner**：读取目标。输出结构化计划或规格。
- **Executor**：一次读取一个计划步骤。输出产物。
- **Critic**：对照计划审阅产物。输出接受/拒绝及理由。
- **Verifier**：运行确定性检查。输出通过/失败及证据。
- **Critic 与 verifier**：critic 是主观的、基于 LLM 的。verifier 是代码。二者不是同一角色。
- **Communicative dehallucination**：缺少细节时，executor 按名字询问相关角色。
- **SOP 模式**：`Code = SOP(Team)`。每个角色都有严格的输入/输出 schema。

## 代码中的角色流水线
type: annotated-code
lang: python
from: phases/16-multi-agent-and-swarms/08-role-specialization/code/main.py

```python
spec = planner(user_wish)            # Spec with signature and 3 tests
art = executor(spec)                 # Artifact holds a code string
crep = critic(spec, art)             # checks def, return, task name
vrep = verifier(spec, art)           # runs the tests
exec(art.code, ns, ns)               # verifier sandbox namespace
fn = ns.get(spec.task_name)          # no callable gives a failure
got = fn(*args)                      # compare with expected
if crep.approved and vrep.passed:    # ship only when both pass
```

## 软件团队架构
type: architecture
from: phases/19-capstone-projects/10-multi-agent-software-team/docs/en.md

```arch
node | issue | 1,1 | GitHub issue URL | | client
node | arch | 2,1 | Architect | plan with subtasks + interfaces | model
node | board | 3,1 | Task board | file / Redis | queue
node | coders | 4,1 | Coders A to D | worktree + Daytona each | process
node | merge | 4,2 | Merge coordinator | three-way merge | process
node | rev | 3,2 | Reviewer | approve or request changes | model
node | test | 2,2 | Tester | clean sandbox | process
node | pr | 1,2 | Open PR | | client
edge | issue | arch |
edge | arch | board | plan_request
edge | board | coders | subtask
edge | coders | merge | diff_ready
edge | merge | rev | review_needed
edge | rev | test | approved
edge | test | pr | test_passed
```

## 任务看板消息
type: command-table
from: phases/19-capstone-projects/10-multi-agent-software-team/code/main.py, phases/19-capstone-projects/10-multi-agent-software-team/docs/en.md

| 命令 | 作用 |
|---|---|
| `plan_request` | Architect 发布带子任务 DAG 的计划 |
| `subtask` | Architect 把一个子任务及其文件发给 coder |
| `diff_ready` | Coder 把补丁发到 `merge_coord` |
| `review_needed` | Merge coordinator 把合并后的 diff 发给 reviewer |
| `review_feedback` | Reviewer 把修改请求发回 coder |
| `approved` | Reviewer 把 diff 交给 tester |
| `test_passed` | Tester 通知 `pr_opener` 打开 PR |
| `test_failed` | Tester 把 stacktrace 发回 coder |

## 评审小组 API
type: task-table
from: projects/multi-agent-code-review-panel/API.md, projects/multi-agent-code-review-panel/solution/main.ts, projects/multi-agent-code-review-panel/solution/cli.ts, projects/multi-agent-code-review-panel/README.md

| 任务 | 代码 |
|---|---|
| 拒绝伪造的位置 | `validateFinding(raw, files)` |
| 按文件、行、规则分组 | `aggregate(reviews, files, quorum = 2)` |
| 带限制地运行 reviewer | `runPanel(reviewers, budget, timeoutMs = 1000)` |
| 对照标签打分 | `evaluate(predicted, expected)` |
| 分组键 | `JSON.stringify([f.file, f.line, f.rule])` |
| 运行演示 | `node cli.ts --input samples/review.json` |
| 导入 PR 报告 | `--pr-report /path/review.json` |

## 法定人数与预算代码
type: annotated-code
lang: typescript
from: projects/multi-agent-code-review-panel/solution/main.ts

```typescript
if (ids.has(review.reviewer)) throw new Error("duplicate reviewer");
if (seen.has(key)) continue;       // one vote per reviewer per group
status: g.supporters.length >= quorum ? "consensus" : "needs-review",
disagreement: new Set(g.severities).size > 1,
if (spent + r.cost > budget) {     // trace status "budget-skipped"
controller.abort();                // deadline hit, status "timeout"
precision: p.size ? hits / p.size : 0,  // zero predictions give 0
```

## 默认值与数字
type: defaults
from: phases/16-multi-agent-and-swarms/07-society-of-mind-debate/docs/en.md, phases/16-multi-agent-and-swarms/08-role-specialization/docs/en.md, phases/14-agent-engineering/25-multi-agent-debate/docs/en.md, projects/multi-agent-code-review-panel/solution/cli.ts, phases/19-capstone-projects/10-multi-agent-software-team/code/ts/src/coordinator.ts

| 设置 | 默认值 | 说明 |
|---|---|---|
| 辩论轮数上限 | 3 | 3 轮已获得大部分收益 |
| 辩论 agent 数上限 | 5 | 超过 5 个，上下文膨胀和成本占主导 |
| Du et al. 原始设置 | N=3、R=2 | 出于成本考虑 |
| Critic 修订轮数 | 2 | 之后升级给人 |
| CLI `quorum` | 2 | 达成共识所需的支持者数 |
| CLI `budget` | 3 | reviewer 成本单位 |
| CLI `timeout` | 1000 | 每个 reviewer 的毫秒数 |
| `maxTurns` | 12 | Coordinator 轮次上限 |

## 失败模式
type: troubleshooting
from: phases/16-multi-agent-and-swarms/07-society-of-mind-debate/docs/en.md, phases/14-agent-engineering/25-multi-agent-debate/docs/en.md, phases/16-multi-agent-and-swarms/08-role-specialization/docs/en.md, phases/19-capstone-projects/10-multi-agent-software-team/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 所有 agent 附和最强势的那个 | 谄媚级联 | 必须有一个 agent 持反方立场 |
| 答案偏离问题 | 多轮之后话题漂移 | 每轮重新注入问题 |
| 成本超过单次 CoT 的 10× | 计算爆炸，N·R 次调用 | 轮数上限 3，agent 上限 5 |
| 所有人都同意同一个错误答案 | 所有人用相同 prompt 和模型 | 使用多样的 prompt 和模型 |
| 一个坏 agent 污染全部 | 星形拓扑中的坏中心 | 轮换或使用多个中心 |
| 看似合理的代码带 bug 上线 | 全 LLM 流水线，没有 verifier | 加入基于代码的通过/失败检查 |
| Reviewer 批准了已知 bug | 误批准 | 注入 bug 进行探测，调到 5% 以下 |

## 要记住的数字
type: concepts
from: phases/16-multi-agent-and-swarms/07-society-of-mind-debate/docs/en.md, phases/16-multi-agent-and-swarms/08-role-specialization/docs/en.md, phases/19-capstone-projects/10-multi-agent-software-team/docs/en.md

- **5 个 agent、5 轮**：25 次调用，上下文不断增长。
- **NLSOM**：129 个成员的社会。
- **MAST**：追踪了 1642 次失败。21.3% 是验证缺口。
- **验证循环**：准确率从 10% 到 70%。一个角色带来 7× 提升。
- **Token 放大**：40 轮的单 agent 运行在四个角色间变成 160 轮。
- **评分标准**：pass@1 25 分，加速 20 分，评审质量 20 分，token 效率 20 分，协调 15 分。

## 问答
type: qa
from: phases/16-multi-agent-and-swarms/07-society-of-mind-debate/docs/en.md, phases/14-agent-engineering/25-multi-agent-debate/docs/en.md, projects/multi-agent-code-review-panel/README.md, projects/multi-agent-code-review-panel/stages/02-agreement/docs/en.md

- **为什么用辩论而不是 self-consistency？** 同一模型的样本共享错误。辩论让错误去相关。
- **加 agent 还是加轮数？** 单独增加任一项都会进入平台期。两者同时增加才有大幅提升。
- **辩论什么时候有害？** 对延迟敏感的 UX、对成本敏感的规模化场景和简单查找。
- **共识就是真相吗？** 不是。共识衡量的是支持度，不是真相。
- **同一个 reviewer 提交五份报告？** 支持度统计的是不同的 reviewer id，而不是报告数。

## 上线清单
type: tips
from: phases/16-multi-agent-and-swarms/07-society-of-mind-debate/docs/en.md, phases/16-multi-agent-and-swarms/08-role-specialization/docs/en.md, phases/19-capstone-projects/10-multi-agent-software-team/docs/en.md

- 辩论池中至少使用两个不同的基础模型。
- 记录每一轮。隐藏的轮次无法调试或审计。
- 至少保留一个确定性 verifier。绝不全用 LLM。
- 先运行 critic，再运行 verifier。
- coder 开工后冻结计划。重新规划是独立事件。
- Reviewer 不能批准自己的修改。
