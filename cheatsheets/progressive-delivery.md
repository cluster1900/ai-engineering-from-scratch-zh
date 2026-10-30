---
id: progressive-delivery
title: Shadow, Canary and A/B Tests for LLMs
code: SC
subtitle: Shadow 运行、Canary 门控、快速回滚、序贯 A/B 测试、混沌护栏与配置漂移报告。
hue: 28
sources: phases/17-infrastructure-and-production/20-shadow-canary-progressive, phases/17-infrastructure-and-production/21-ab-testing-llm-features, phases/17-infrastructure-and-production/24-chaos-engineering-llm, projects/configuration-drift-explainer
source_hash: 496849859cbd8fe9
---

## 发布序列
type: flow
from: phases/17-infrastructure-and-production/20-shadow-canary-progressive/docs/en.md

1. **Shadow**：候选模型拿到生产请求的副本。输出进日志，不给用户。
2. **Shadow log**：对输出做 diff。记录 token 数、延迟、拒绝和错误。
3. **Canary**：把流量切到 1%、10%、25%、50%、75%、100%。
4. **Gates**：每一步检查五项指标，每 5 到 15 分钟一次。
5. **A/B**：可选。新模型明显不同时，在 50% 上跑。
6. **Promote**：所有 canary 门控通过后走到 100%。
7. **Rollback**：撤回 flag。把钉住的 digest 设回上一个模型。

## 模拟器中的 Canary 门控
type: defaults
from: phases/17-infrastructure-and-production/20-shadow-canary-progressive/code/main.py, phases/17-infrastructure-and-production/20-shadow-canary-progressive/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `STAGES` | 0.01, 0.10, 0.25, 0.50, 0.75, 1.00 | 六个流量份额 |
| `latency_p99_ms` | 1.5 | 基线 900 ms |
| `cost_per_req` | 1.2 | 基线 0.02。超过 20% 即触发 |
| `error_rate` | 2.0 | 5xx 加上显式拒绝 |
| `output_len_p99` | 1.4 | 基线 450 tokens |
| `thumbs_down_rate` | 1.5 | 基线 0.03 |
| `rng.uniform` 噪声 | 0.92, 1.08 | 每项实测指标上的噪声 |

## 跑实验
type: task-table
from: phases/17-infrastructure-and-production/20-shadow-canary-progressive/code/main.py, phases/17-infrastructure-and-production/21-ab-testing-llm-features/code/main.py, phases/17-infrastructure-and-production/24-chaos-engineering-llm/code/main.py

| 任务 | 代码 |
|---|---|
| Canary 模拟器，第 20 课 | `code/main.py` |
| 注入 25% 成本回归 | `Regression(cost_mult=1.25)` |
| 注入 80% 延迟回归 | `Regression(latency_mult=1.80)` |
| 用门控检查一个阶段 | `check_gates(metrics)` |
| 序贯 A/B 模拟器，第 21 课 | `code/main.py` |
| 80% 功效下的样本量 | `fixed_sample_size(baseline, lift)` |
| 模拟 5% 提升 | `simulate(0.03, 0.0315)` |
| 混沌 runner，第 24 课 | `run_experiment(e)` |

## 发布与 A/B 术语
type: concepts
from: phases/17-infrastructure-and-production/20-shadow-canary-progressive/docs/en.md, phases/17-infrastructure-and-production/21-ab-testing-llm-features/docs/en.md

- **Shadow mode**：对用户零影响。冒烟测试，不是质量测试。
- **Canary**：带指标门控、向真实用户逐步发布。
- **Non-determinism**：相同输入上，各次运行的准确率最多差 15%。
- **Policy flag**：在配置里回滚。耗时数秒，不是数小时。
- **Model pin**：不可变的 registry digest。不会自动升级。
- **Eval vs A/B**：评估问“模型能不能干活？”A/B 测试问“用户在意吗？”
- **CUPED**：回归掉前期方差。典型降幅是 30-70%。
- **SRM**：样本比例不匹配。50/50 切分得到 47/53 就坏了。

## 序贯停止规则
type: annotated-code
lang: python
from: phases/17-infrastructure-and-production/21-ab-testing-llm-features/code/main.py

```python
required = fixed_sample_size(baseline, lift)  # 80% power, alpha 0.05
adjusted = int(required * 1.4)  # LLM non-determinism buffer
if n_a > 100 and n_b > 100 and sequential_stopped_at is None:
    z = z_statistic(success_a, n_a, success_b, n_b)
    n_total = n_a + n_b
    threshold = math.sqrt(2 * math.log(1 / 0.05) + math.log(n_total))  # grows with log(n)
    if abs(z) > threshold:
        sequential_stopped_at = n_total  # stop early on a clear winner
```

## 混沌平面
type: architecture
from: phases/17-infrastructure-and-production/24-chaos-engineering-llm/docs/en.md

```arch
node | control | 1,1 | Control plane | experiment scheduler | process
node | target | 2,1 | Target plane | services, pods, data stores | process
node | obs | 2,2 | Observability plane | trace-ID correlation | store
node | safety | 1,2 | Safety plane | kill switch, budget gates | process
node | feedback | 3,2 | Feedback loop | SLO, runbooks, code fixes | store
edge | control | target | inject fault
edge | target | obs | metrics, traces, logs
edge | obs | safety | burn rate
edge | safety | control | abort
edge | obs | feedback | findings
```

## 混沌 runner 实验
type: command-table
from: phases/17-infrastructure-and-production/24-chaos-engineering-llm/code/main.py

| 命令 | 作用 |
|---|---|
| `ERROR_BUDGET_PER_DAY = 0.001` | 99.9% SLO |
| `EXPECTED_ERROR_RATE = 0.0005` | 基线错误率 |
| `burn_rate > 2.0` | 中止规则的前半 |
| `e.blast_radius_pct > 0.2` | 后半。两边都必须成立 |
| `pod kill (1 decode replica)` | 5 分钟，5% blast。完成 |
| `provider 429 fallback` | 5 分钟，30% blast。中止 |
| `malformed prompt tokenizer stall` | 3 分钟，10% blast。完成 |

## 漂移解释器命令
type: command-table
span: 2
from: projects/configuration-drift-explainer/README.md

| 命令 | 作用 |
|---|---|
| `go run . --input fixtures/config.json --out /tmp/drift.json` | 把漂移报告写到文件 |
| `go build -o /tmp/drift-explainer .` | 构建二进制 |
| `/tmp/drift-explainer --input fixtures/config.json --check` | 有漂移时返回 2 |
| `python3 scripts/project_test.py configuration-drift-explainer --init <work>` | 做一个全新 starter |
| `python3 scripts/project_test.py configuration-drift-explainer --stage 1 --path <work> --strict` | 给一个阶段评分 |
| `python3 scripts/project_test.py configuration-drift-explainer --all --solution --strict` | 给参考解答评分 |

## 漂移报告
type: concepts
from: projects/configuration-drift-explainer/solution/main.go, projects/configuration-drift-explainer/README.md

- **Input**：`layers`、`observed` 和可选的 `sensitive`。后面的层胜出。
- **equal**：生效值与观测值匹配。
- **changed**：在 `reflect.DeepEqual` 下值不同。
- **missing**：各层声明了该键。观测配置没有。
- **unexpected**：观测配置有一个各层都未声明的键。
- **History**：按顺序记录每个设置过该键的层。被覆盖的值仍保留。
- **Redaction**：password、secret、token、api-key 和 credential 名称变成 `[REDACTED]`。
- **Output**：`schemaVersion` 1。文件权限为仅所有者 `0600`。

## 排障
type: troubleshooting
from: phases/17-infrastructure-and-production/20-shadow-canary-progressive/docs/en.md, phases/17-infrastructure-and-production/21-ab-testing-llm-features/docs/en.md, phases/17-infrastructure-and-production/24-chaos-engineering-llm/docs/en.md, projects/configuration-drift-explainer/README.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 切换后一天成本升 40% | 没有 shadow 或 canary 步骤 | 先做 shadow。把成本门控设在基线之上 20% |
| 回滚要 3 小时 | 回滚需要重新部署 | 翻转 policy flag。钉住旧 digest |
| Canary 门控误报 | 门控落在噪声底之内 | 把门控设在噪声底之上 |
| 1% 时反馈门控很吵 | 每个窗口只有 50-150 个数据点 | 每一步停更久 |
| 50/50 切分得到 47/53 | SRM。分配坏了 | 先修好分配哈希 |
| A/B 永远达不到显著 | 非确定性降低了有效样本量 | 把样本量乘以 1.3 到 1.5 |
| 提供方 429 之后 OOM | 网关重试放大了并发 | 注入一次提供方 429，持续 5 分钟 |
| 漂移报告里出现密钥值 | 看起来无害的键名藏了密钥 | 把该键加进 `sensitive` |

## 问题
type: qa
from: phases/17-infrastructure-and-production/20-shadow-canary-progressive/docs/en.md, phases/17-infrastructure-and-production/21-ab-testing-llm-features/docs/en.md, phases/17-infrastructure-and-production/24-chaos-engineering-llm/code/main.py, projects/configuration-drift-explainer/README.md

- **Shadow mode 能证明质量吗？** 不能。它只捕捉成本、长度、拒绝和硬错误。
- **什么时候跳过 A/B 步骤？** 当新模型只是一个改进版本时。
- **“稳定”等于基线吗？** 不等于。稳定意味着落在预期方差内。
- **95% 置信度下做 20 个测试？** 碰巧会有一个假阳性。用 Bonferroni 或 Benjamini-Hochberg。
- **哪个混沌实验会中止？** 提供方 429。消耗速率超过 2.0，blast radius 超过 20%。
- **`--check` 在有漂移时返回什么？** 退出状态 2。

## 提示
type: tips
from: phases/17-infrastructure-and-production/20-shadow-canary-progressive/docs/en.md, phases/17-infrastructure-and-production/24-chaos-engineering-llm/docs/en.md, projects/configuration-drift-explainer/README.md

- 发布前先修好回滚路径。它绝不能需要重新部署。
- 跟踪每次请求的成本。好 20% 的模型每次调用可能贵 3x。
- 当日错误预算消耗超过预期 2x 时，暂停混沌。
- 第一次混沌测试：在稳定流量下 pod-kill 一个 decode replica。
- 节奏：每周 canary，每月 game day，每季度审计。
- 把具名源标识放进层名，绝不要放密钥值。
