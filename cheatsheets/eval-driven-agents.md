---
id: eval-driven-agents
title: Eval-Driven Agent Development
code: ED
subtitle: 运行评估用例、为合并设门禁、按评分细则评审，并为提示词和报告的改动设门禁。Python 标准库。
hue: 140
sources: phases/14-agent-engineering/30-eval-driven-agent-development, phases/14-agent-engineering/38-verification-gates, phases/14-agent-engineering/39-reviewer-agent, projects/prompt-regression-tester, projects/report-judge
source_hash: 59650a4ecbe2d8fb
---

## 从构建者到签发
type: architecture
from: phases/14-agent-engineering/38-verification-gates/docs/en.md, phases/14-agent-engineering/39-reviewer-agent/docs/en.md

```arch
node | builder | 1,1 | Builder Agent | writes the diff | model
node | arts | 2,1 | Artifacts | diff, scope, rules, feedback | store
node | gate | 3,1 | Verification gate | deterministic, no LLM | process
node | report | 4,1 | verification_report.json | passed true or false | store
node | refuse | 4,2 | Refuse done | surface to human | client
node | rev | 3,2 | Reviewer Agent | read only, rubric | model
node | human | 2,2 | Human sign-off | reads review_report.json | client
edge | builder | arts |
edge | arts | gate |
edge | gate | report |
edge | report | refuse | no
edge | report | rev | yes
edge | rev | human |
```

## 三个评估层次
type: comparison
from: phases/14-agent-engineering/30-eval-driven-agent-development/docs/en.md

| 维度 | 静态基准 | 自定义离线 | 在线 |
|---|---|---|---|
| 示例 | SWE-bench Verified、GAIA、BFCL V4 | LLM-as-judge、执行、轨迹 | 会话回放、护栏告警 |
| 用途 | 跨模型比较 | 你的产品形态 | 生产环境行为 |
| 衡量 | 广泛能力 | 对你的产品给出正确补丁 | 每步成本与延迟 |
| 注意 | 数据污染，32.67% 泄漏 | 评判模型也会幻觉 | 把每个失败对应到一个新用例 |

## 评估器-优化器循环
type: flow
from: phases/14-agent-engineering/30-eval-driven-agent-development/code/main.py, phases/14-agent-engineering/30-eval-driven-agent-development/docs/en.md

1. **提议者**：`case.proposer(feedback)` 给出候选。
2. **评判者**：`case.judge(candidate)` 返回 ok 和理由。
3. **改进**：理由成为下一轮的反馈。
4. **停止**：超过 `max_rounds` 后该用例失败。
5. **CI 门禁**：`ci_gate` 阻止超过阈值的回归。

## 运行课程与项目
type: command-table
span: 2
from: phases/14-agent-engineering/30-eval-driven-agent-development/docs/en.md, phases/14-agent-engineering/38-verification-gates/code/main.py, projects/prompt-regression-tester/README.md, projects/prompt-regression-tester/solution/cli.py, projects/report-judge/README.md, projects/report-judge/solution/cli.py

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` | 运行课程演示。第 38 和 39 课写出 JSON 报告 |
| `VERIFY_DEMO_MODE=1 python3 code/main.py --strict` | 用演示密钥运行门禁演示。每个 warn 都变成 block |
| `python3 code/main.py --floor <value>` | 用不同的覆盖率下限运行门禁演示 |
| `python3 scripts/project_test.py <project> --init learning-artifacts/<project>` | 创建学习者工作区 |
| `python3 scripts/project_test.py <project> --stage <n> --path learning-artifacts/<project>` | 测试你工作区的一个阶段 |
| `python3 scripts/project_test.py <project> --all --solution --strict` | 检查参考解答 |
| `python3 <dir>/cli.py <cases> <baseline> <candidate> --out <json> --markdown <md>` | 提示词 diff。模型变更时加 `--allow-configuration-change` |
| `python3 <dir>/cli.py <claims> --out <json> --html <html>` | 报告审计。报告载荷加 `--research-payload` |

## 为一个任务设门禁
type: annotated-code
lang: python
from: phases/14-agent-engineering/38-verification-gates/code/main.py

```python
art = Artifacts(task_id="T-001",
    acceptance_commands=accept,              # zero exit means done
    feedback=[{"command": accept[0], "exit_code": 0}],
    scope_report={"forbidden_writes": [], "off_scope_writes": []},
    rule_report=[{"slug": "done/tests-pass", "passed": True}],
    coverage_report={"current": 0.84, "previous": 0.85},
    head_commit="a1b2c3d")
report = verify(art, strict=False, coverage_floor=0.80)
report.passed                                # False on any block finding
record_override(task_id, finding_code, reason, user_id, head_commit)
verify_signature(entry)                      # HMAC check of the override
```

## 评审细则
type: concepts
from: phases/14-agent-engineering/39-reviewer-agent/docs/en.md, phases/14-agent-engineering/39-reviewer-agent/code/main.py

- **问题契合**：是否按描述解决了任务？
- **范围纪律**：修改是否在约定范围内？
- **假设**：是否写了下来？
- **验证质量**：验收是否证明了目标？
- **交接就绪**：下一个会话能否接手？
- **评分**：每项 0 到 2 分，总分 10。
- **结论**：7 分及以上为 `pass`，否则为 `soft_fail`。
- **`hard_fail`**：总分低于 5 或有任意一项为 0。

## 默认值与数字
type: defaults
from: phases/14-agent-engineering/30-eval-driven-agent-development/code/main.py, phases/14-agent-engineering/38-verification-gates/code/main.py, projects/prompt-regression-tester/solution/main.py, projects/report-judge/solution/support.py, projects/report-judge/solution/compare.py, projects/report-judge/solution/metrics.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `max_rounds` | 3 | 每个用例的评估器-优化器轮数 |
| `regression_threshold` | 0.05 | 超过它 `ci_gate` 就阻止 |
| `COVERAGE_FLOOR_DEFAULT` | 0.80 | 低于它即 block |
| `COVERAGE_REGRESSION_DELTA` | 0.01 | 比上次合并下降更多则阻止 |
| `release_gate` `min_pass` | 1.0 | [0,1] 内的通过比例 |
| `release_gate` `max_regressions` | 0 | 整数形式的回归预算 |
| `judge_claim` `threshold` | 0.8 | 计为有支持所需的重叠分 |
| `compare` `samples` | 2000 | Bootstrap 重采样次数，`seed=7` |

## 提示词回归测试器
type: task-table
from: projects/prompt-regression-tester/solution/main.py, projects/prompt-regression-tester/solution/cli.py, projects/prompt-regression-tester/stages/03-pair-revisions/docs/en.md

| 任务 | 代码 |
|---|---|
| 唯一 id，已知检查类型 | `validate_cases(cases)` |
| 检查类型 | `contains`、`excludes`、`json` |
| 为一条录制的回复评分 | `score_response(response, checks)` |
| 按用例 id 配对修订版本 | `compare(cases, baseline, candidate)` |
| 配对状态 | `stable_pass`、`regressed`、`improved` |
| 发布或阻止 | `release_gate(report)` |
| 把录制绑定到用例 | `case_sha256 == case_digest(cases)` |
| 加载绑定来源的运行 | `load_run(raw, cases)` |

## 报告评判器
type: task-table
from: projects/report-judge/solution/claims.py, projects/report-judge/solution/support.py, projects/report-judge/solution/metrics.py, projects/report-judge/solution/compare.py

| 任务 | 代码 |
|---|---|
| 每句一条论断 | `parse_claims(text)` |
| 一条论断的词面支持度 | `support(claim, source)` |
| 评判引用是否符合证据 | `judge_claim(claim, evidence)` |
| 零分的原因 | `negation`、`number`、`uncited` |
| 精确率、召回率、覆盖率 | `score_report(text, evidence)` |
| 分数权重 | `precision` 0.5，`recall` 0.25 |
| 状态 | `no_evidence`、`needs_review` |
| 配对 bootstrap | `compare(baseline, candidate)` |

## 故障排查
type: troubleshooting
span: 2
from: phases/14-agent-engineering/30-eval-driven-agent-development/docs/en.md, phases/14-agent-engineering/38-verification-gates/code/main.py, phases/14-agent-engineering/38-verification-gates/docs/en.md, projects/prompt-regression-tester/solution/cli.py, projects/prompt-regression-tester/stages/02-score-recordings/docs/en.md, projects/report-judge/stages/02-support/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 评估分数无法解读 | 没有基线 | 保存最后一次已知良好的基线 |
| 评判放过了错误输出 | LLM 评判没有依据 | 让评判基于外部工具 |
| 评估通过，生产失败 | 对评估过拟合 | 轮换用例 |
| CI 中误报 | 不稳定、非确定性的用例 | 固定种子，快照状态 |
| `refused to start: VERIFY_OVERRIDE_SECRET is unset` | 没有覆盖密钥 | 设置环境变量，或演示时用 `VERIFY_DEMO_MODE=1` |
| `recording does not match cases` | 录制之后用例列表变了 | 重新录制 |
| `model/settings changed; explicitly allow this experiment` | 基线与候选配置不同 | 传入 `--allow-configuration-change` |
| 真实论断得到 `order_requires_review` | 词面规则拒绝了改写 | 由人评审该论断 |

## 问答
type: qa
from: phases/14-agent-engineering/38-verification-gates/docs/en.md, phases/14-agent-engineering/39-reviewer-agent/docs/en.md, projects/prompt-regression-tester/stages/03-pair-revisions/docs/en.md, projects/prompt-regression-tester/stages/04-gate-releases/docs/en.md, projects/report-judge/stages/03-metrics/docs/en.md

- **为什么门禁中不用 LLM？** 对相同的产物，门禁每次都给出相同的结论。
- **谁能覆盖一次阻止？** 只有人，并且要用 `override_reason` 和 `overridden_by`。
- **为什么要独立的评审者？** 角色分离：不同的提示词、不同的输入、没有写权限。
- **为什么按 id 配对用例？** 平均值可能掩盖严重的回归。
- **为什么召回率是 null？** 召回率和覆盖率需要标注。没有标注就无法计算。

## 提示
type: tips
from: phases/14-agent-engineering/30-eval-driven-agent-development/docs/en.md, phases/14-agent-engineering/38-verification-gates/docs/en.md, phases/14-agent-engineering/39-reviewer-agent/docs/en.md

- 评估和代码放在一起。每个 PR 都在 CI 中运行。
- 把每条护栏和每条学到的规则都对应到一个评估用例。
- 每个任务写一份报告到 `outputs/verification/<task_id>.json`。
- `--strict` 只用于发布分支，它不是全局默认值。
- 每次改动提示词后，在 10-20 个任务的校准集上运行评审者。
- 一致率低于 80% 时，先修订细则再上线评审者。

## 门禁发现代码
type: concepts
from: phases/14-agent-engineering/38-verification-gates/code/main.py

- **`acceptance.missing`**：block。某条命令从未运行。
- **`acceptance.failed`**：block。非零退出码。
- **`feedback.null_exit`**：block。没有退出码。
- **`scope.forbidden`**：block。**`scope.off_scope`**：warn。
- **`coverage.below_floor`**：block。**`coverage.missing`**：warn。
