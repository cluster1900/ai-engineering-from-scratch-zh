---
id: delegation-feedback
title: Delegation, Isolation and Feedback Ratchets
code: DI
subtitle: 基于证据做计划，按独占所有权拆分工作，并把每次纠正提升到最早负责的那一层。
hue: 280
sources: phases/14-agent-engineering/44-plan-from-evidence, phases/14-agent-engineering/45-delegate-with-isolation, phases/14-agent-engineering/46-turn-feedback-into-system, phases/14-agent-engineering/54-build-the-feedback-ratchet, projects/workflow-hooks
source_hash: f0b703417fb900be
---

## 计划、委派、集成
type: architecture
from: phases/14-agent-engineering/44-plan-from-evidence/docs/en.md, phases/14-agent-engineering/45-delegate-with-isolation/docs/en.md

```arch
node | plan | 1,1 | Approved plan | waves from dependencies | store
node | api | 2,1 | API work unit | owns its paths | process
node | docs | 2,2 | Docs work unit | owns its paths | process
node | h1 | 3,1 | Proof and handoff | API unit | store
node | h2 | 3,2 | Proof and handoff | docs unit | store
node | rev | 4,1 | Integration review | read only | model
node | gate | 4,2 | Full verification gate | cross-unit | process
edge | plan | api |
edge | plan | docs |
edge | api | h1 |
edge | docs | h2 |
edge | h1 | rev |
edge | h2 | rev |
edge | rev | gate |
```

## 棘轮循环
type: flow
from: phases/14-agent-engineering/54-build-the-feedback-ratchet/docs/en.md

1. **观察**：记录一个具体信号。
2. **关联**：把它与某个结果、约束或假设联系起来。
3. **定位**：找到对原因负责的最早系统层。
4. **修改**：做一个有边界、只有一个负责人的修改。
5. **验证**：证明问题复发的可能性变小了。
6. **复审**：决定保留、修订还是退役这项控制。

## 每个工作项的五项承诺
type: concepts
from: phases/14-agent-engineering/44-plan-from-evidence/docs/en.md, phases/14-agent-engineering/44-plan-from-evidence/code/main.py

- **标识符**：用于依赖与交接的稳定引用。
- **修改**：最小的行为或契约修改。
- **证据**：支撑该修改的仓库事实。
- **依赖**：必须先成立的工作。
- **证明**：关闭该项的确切检查。
- **波次**：依赖已全部完成的工作项，它们一起运行。
- **契约优先**：实现和文档要等契约确定。

## 委派还是保持串行
type: comparison
from: phases/14-agent-engineering/45-delegate-with-isolation/docs/en.md

| 维度 | 委派 | 保持串行 |
|---|---|---|
| 文件 | 互不相交的文件与契约 | 同一批文件 |
| 决策 | 不同的未知项 | 同一个未决决策 |
| 环境 | 独立的 worktree 或沙箱 | 同一个可变环境 |
| 实验示例 | API 与文档单元，路径互不相交 | 文档单元拥有 app/，计划受阻 |

## 三层隔离
type: concepts
from: phases/14-agent-engineering/45-delegate-with-isolation/docs/en.md

- **文件系统**：独立的 worktree 或沙箱防止意外地共同编辑。
- **所有权**：契约防止两个 worker 编辑同一路径。
- **状态**：独立的日志和输出保留每个 worker 的证据。
- **局限**：两个干净的 worktree 仍可能产出相互冲突的设计。
- **集成者**：读取证明输出，按依赖顺序合并，运行完整门禁。

## 把信号路由到对应层
type: concepts
from: phases/14-agent-engineering/46-turn-feedback-into-system/docs/en.md, phases/14-agent-engineering/54-build-the-feedback-ratchet/docs/en.md, phases/14-agent-engineering/54-build-the-feedback-ratchet/code/main.py

- **结果错误、回归、误报**：评估或测试。
- **缺少上下文、重复工作、过时事实**：上下文来源。
- **越界或不安全的动作**：范围或权限策略。
- **超时、重试风暴**：运行时控制。
- **重复的环境配置或命令错误**：自动化或工具。
- **输出格式错误**：标准示例加验证器。
- **产品层面的分歧**：人工决策记录或整理过的积压列表。
- **优先级**：严重度乘以频率。严重度为一到五。

## 课程函数
type: task-table
from: phases/14-agent-engineering/44-plan-from-evidence/code/main.py, phases/14-agent-engineering/45-delegate-with-isolation/code/main.py, phases/14-agent-engineering/46-turn-feedback-into-system/code/main.py, phases/14-agent-engineering/54-build-the-feedback-ratchet/code/main.py

| 任务 | 代码 |
|---|---|
| 检查计划凭据 | `validate(items)` |
| 计算计划波次 | `execution_waves(items)` |
| 计划状态为 ready 或 blocked | `plan_document(items)` |
| 检测父路径重叠 | `paths_overlap(left, right)` |
| 委派状态 | `delegation_plan(units)` |
| 把纠正转为控制 | `promote(correction)` |
| 按指纹去重 | `ratchet(corrections)` |
| 把信号转为排序后的动作 | `backlog(signals)` |

## 工作流 hook CLI
type: command-table
span: 2
from: projects/workflow-hooks/README.md, projects/workflow-hooks/solution/cli.ts, projects/workflow-hooks/stages/03-policy/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 scripts/project_test.py workflow-hooks --init learning-artifacts/workflow-hooks` | 创建学习者工作区 |
| `python3 scripts/project_test.py workflow-hooks --stage <n> --path learning-artifacts/workflow-hooks` | 测试一个阶段 |
| `python3 scripts/project_test.py workflow-hooks --all --solution --strict` | 检查参考答案 |
| `node <dir>/cli.ts capture <store> <corrections.jsonl>` | 导入纠正并保存存储 |
| `node <dir>/cli.ts inspect <store>` | 列出带 `approval_digest` 的规则 |
| `node <dir>/cli.ts approve <store> <digest>` | 用当前确切摘要批准规则 |
| `node <dir>/cli.ts emit <store> <scope>` | 为范围内已批准的规则打印 `additional_context` |
| `node <dir>/cli.ts retire <store> <digest>` | 把规则从输出中移除。证据保留 |

## 代码中的规则生命周期
type: annotated-code
lang: typescript
from: projects/workflow-hooks/solution/main.ts, projects/workflow-hooks/solution/cli.ts

```typescript
const c = ingest(raw);                       // scope lowercased, rule case kept
const rules = consolidate(corrections);      // group by scope and rule text
rule.sessions.length                         // unique sessions, not events
transition(rule, "approve");                 // needs minimumSessions = 2
transition(rule, "retire");                  // retired cannot be approved
hook(rules, "orchard");                      // approved, scope or global
ruleDigest(rule);                            // sha256 of scope, text, evidence
await save("rules.json", rules);             // temp file, then fs.rename
await load("rules.json");                    // ENOENT gives an empty list
```

## 默认值与限制
type: defaults
from: projects/workflow-hooks/solution/main.ts, phases/14-agent-engineering/46-turn-feedback-into-system/code/main.py, phases/14-agent-engineering/54-build-the-feedback-ratchet/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `minimumSessions` | 2 | 批准所需的独立会话数 |
| `c.rule.length` | 500 | 更大的规则即“too large” |
| `c.source.length` | 2000 | 更大的来源即“too large” |
| 存储 `version` | 1 | 其他版本报“invalid store” |
| 临时文件 `mode` | 0o600 | 仅所有者有权限 |
| `recurrence` 下限 | 1 | 低于它的纠正会被跳过 |
| 控制指纹 | 12 | sha256 的十六进制字符数 |
| 信号 `severity` | range(1, 6) | 频率必须为正 |

## 错误与修复
type: troubleshooting
span: 2
from: phases/14-agent-engineering/44-plan-from-evidence/code/main.py, phases/14-agent-engineering/45-delegate-with-isolation/code/main.py, phases/14-agent-engineering/45-delegate-with-isolation/docs/en.md, projects/workflow-hooks/solution/main.ts, projects/workflow-hooks/solution/cli.ts

| 现象 | 原因 | 解决 |
|---|---|---|
| `has no repository evidence` | 某个工作项没有凭据 | 加上文件路径和行号 |
| `has no proof command` | 证明为空 | 写明关闭它的确切检查 |
| `dependency cycle among` | 工作项互相等待 | 找出隐藏的产品分歧 |
| `conflicts` 中出现 `overlap at` | 文档单元拥有父路径 `app/` | 给每个单元分配独占路径 |
| `insufficient independent sessions` | 一个会话，多个事件 | 等待第二个会话 |
| `exact current rule digest required` | 有新证据后摘要过时 | 运行 inspect，批准新摘要 |
| `credential-like content` | 规则或来源中含有密钥形态的内容 | 导入前先脱敏 |
| `conflicting correction id` | 同一个 id，内容不同 | 新内容绝不复用 id |

## 问答
type: qa
from: phases/14-agent-engineering/44-plan-from-evidence/docs/en.md, phases/14-agent-engineering/45-delegate-with-isolation/docs/en.md, phases/14-agent-engineering/46-turn-feedback-into-system/docs/en.md, projects/workflow-hooks/stages/02-consolidate/docs/en.md

- **什么时候证据才算真实？** 当它能改变计划时。
- **集成者重写了结果的大部分？** 说明任务拆分错了。
- **为什么统计会话而不是事件？** hook 的重复投递不是独立证据。
- **每次纠正都要提升吗？** 不。只有复发或后果足以说明必要时才提升。
- **谁负责公开行为的变更？** 人。agent 负责有边界的工作。

## 提示
type: tips
from: phases/14-agent-engineering/46-turn-feedback-into-system/docs/en.md, phases/14-agent-engineering/54-build-the-feedback-ratchet/docs/en.md, projects/workflow-hooks/README.md

- 修复原因，而不是症状。“agent 编辑了 README”是症状。
- 一个聚焦的测试比一段要求 agent 记住的文字更有力。
- 每项控制都要有一个负责人、一项验证和一个退役条件。
- 只有凭证据才能退役一项控制。不要因为它感觉过时就删掉。
- 规则中保留 API_KEY 的确切大小写。
