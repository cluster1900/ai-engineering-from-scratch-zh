---
id: llm-evaluation
title: Evaluating LLMs
code: EL
subtitle: 定义任务、打分、按评分细则评判、校准、带区间排名，并测试长上下文。
hue: 80
sources: phases/10-llms-from-scratch/10-evaluation, phases/11-llm-engineering/10-evaluation, phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks, phases/05-nlp-foundations-to-advanced/28-long-context-evaluation, phases/19-capstone-projects/27-eval-harness-fixture-tasks, phases/19-capstone-projects/41-eval-pipeline, phases/19-capstone-projects/49-lm-eval-harness, phases/19-capstone-projects/70-task-spec-format, phases/19-capstone-projects/71-classical-metrics, phases/19-capstone-projects/72-code-exec-metric, phases/19-capstone-projects/73-perplexity-calibration, phases/19-capstone-projects/74-leaderboard-aggregation, phases/19-capstone-projects/75-end-to-end-eval-runner
source_hash: f41ffc5fe2795abd
---

## 端到端评测运行器
type: architecture
from: phases/19-capstone-projects/75-end-to-end-eval-runner/docs/en.md, phases/19-capstone-projects/75-end-to-end-eval-runner/code/main.py, phases/19-capstone-projects/72-code-exec-metric/code/main.py

```arch
node | tasks | 1,1 | tasks.jsonl | validate_file
node | adapter | 2,1 | ModelAdapter | generate(prompt, task)
node | post | 3,1 | post_process | one rule per task
node | metric | 4,1 | score | metric_name dispatch
node | calib | 1,2 | CalibrationReport | ece, brier
node | board | 2,2 | aggregate | JSON + markdown
node | runs | 3,2 | EvalRun | one per model, task
node | exec | 4,2 | run_candidate | subprocess, 3 s
edge | tasks | adapter | render
edge | adapter | post | text
edge | post | metric |
edge | post | exec | code_exec
edge | metric | runs | score
edge | exec | runs | score
edge | adapter | calib | confidence
edge | runs | board |
edge | calib | board | report
```

## 为一个任务打分
type: flow
from: phases/19-capstone-projects/75-end-to-end-eval-runner/docs/en.md, phases/19-capstone-projects/75-end-to-end-eval-runner/code/main.py, phases/19-capstone-projects/70-task-spec-format/docs/en.md

1. **Render**：先放 few-shot 示例，再放 prompt，中间空一行。
2. **Adapter**：`generate(prompt, task)` 返回文本和置信度。运行器为它计时。
3. **post_process**：应用该任务唯一的规则。
4. **分派**：文本指标用 `score`，`code_exec` 用 `run_candidate`。
5. **EvalRun**：一条记录，包含分数和指标名。
6. **校准缓冲区**：追加 (confidence, correct) 对。
7. **判定正确**：exact_match、accuracy、code_exec 得分为 1。分级指标至少为 0.5。

## 选择并运行指标
type: task-table
span: 2
from: phases/19-capstone-projects/70-task-spec-format/code/main.py, phases/19-capstone-projects/71-classical-metrics/code/main.py, phases/11-llm-engineering/10-evaluation/code/eval_framework.py, phases/10-llms-from-scratch/10-evaluation/docs/en.md, phases/05-nlp-foundations-to-advanced/28-long-context-evaluation/docs/en.md

| 任务 | 代码 |
|---|---|
| 给算术题打分 | `"exact_match"` 配合 `"strip_whitespace"` |
| 给选择题打分 | `"exact_match"` 配合 `"extract_letter"` |
| 给生成的代码打分 | `"code_exec"` 配合 `"extract_code_block"` |
| 给摘要打分 | `"rouge_l"` 或 `"bleu_4"` |
| 通过率的置信区间 | `wilson_confidence_interval(successes, total, z=1.96)` |
| 按两两胜负排名 | `ELOTracker(k=32, initial_rating=1500)` |
| 埋入一根针 | `build_haystack(filler_text, needle, depth_ratio, total_tokens)` |
| 运行公开基准 | `lm_eval --model hf --model_args pretrained=<model> --tasks mmlu` |

## Harness API
type: annotated-code
lang: python
from: phases/19-capstone-projects/70-task-spec-format/code/main.py, phases/19-capstone-projects/70-task-spec-format/docs/en.md, phases/19-capstone-projects/71-classical-metrics/code/main.py, phases/19-capstone-projects/72-code-exec-metric/code/main.py, phases/19-capstone-projects/73-perplexity-calibration/code/main.py, phases/19-capstone-projects/74-leaderboard-aggregation/code/main.py

```python
tasks, errors = validate_file("tasks.jsonl")     # do not run if errors
s = score("f1", prediction, targets)             # best F1 over the targets
s = score_code_exec(prediction, assertions)      # passed / total, 3 s limit
p = pass_at_k(n=10, c=3, k=5)                    # unbiased estimator
report = CalibrationReport.from_predictions(confidences, correct)
report.ece, report.brier, report.populated_bins  # bins=10 by default
ppl = perplexity(neg_log_probs, token_counts)    # exp(total nll / tokens)
rows = aggregate(runs, b=500, alpha=0.05)        # mean, bootstrap CI, win rate
print(render_markdown(rows))                     # table for a PR comment
```

## 后处理规则
type: command-table
from: phases/19-capstone-projects/70-task-spec-format/docs/en.md, phases/19-capstone-projects/70-task-spec-format/code/main.py

| 命令 | 作用 |
|---|---|
| `none` | 原样返回字符串 |
| `strip_whitespace` | 去掉首尾空白 |
| `lower` | 把字符串转为小写 |
| `extract_letter` | `[A-E]` 中的第一个字符。用于选择题 |
| `extract_code_block` | 第一个围栏代码块的内容。用于代码 |
| `extract_first_line` | 第一个非空行。用于摘要类 |

## 关键公式
type: concepts
from: phases/10-llms-from-scratch/10-evaluation/docs/en.md, phases/19-capstone-projects/71-classical-metrics/docs/en.md, phases/19-capstone-projects/72-code-exec-metric/docs/en.md, phases/19-capstone-projects/73-perplexity-calibration/docs/en.md

- **困惑度**：$\mathrm{PPL} = \exp\left(-\frac{1}{N} \sum_i \log P(\text{token}_i \mid \text{context})\right)$
- **Token F1**：$\frac{2 P R}{P + R}$。P 和 R 分别是 token 重叠数除以预测与目标的长度。
- **BLEU-4**：简短惩罚乘以 $p_1$ 到 $p_4$ 的几何平均。
- **简短惩罚**：$c \ge r$ 时为 1，否则为 $\exp(1 - r / c)$。
- **ROUGE-L**：LCS 分别除以参考长度与候选长度，再取 F1。
- **pass@k**：$n$ 个样本中有 $c$ 个通过时为 $1 - \binom{n - c}{k} / \binom{n}{k}$。
- **ECE**：每个分箱的置信度减准确率，按分箱大小加权后求和。
- **Brier**：$\mathrm{mean}((p_i - y_i)^2)$。惩罚 ECE 漏掉的离散度。

## 样本量与置信度
type: command-table
from: phases/11-llm-engineering/10-evaluation/docs/en.md

| 90% 时的测试用例数 | 95% CI 宽度 |
|---|---|
| 50 | 19 个百分点。无法发现 5% 的回退 |
| 100 | 12 个百分点。勉强 |
| 200 | 9 个百分点。可以 |
| 500 | 5 个百分点。有把握 |
| 1000 | 3 个百分点。精确 |

## 代码中的默认值
type: defaults
from: phases/19-capstone-projects/72-code-exec-metric/code/main.py, phases/19-capstone-projects/70-task-spec-format/code/main.py, phases/19-capstone-projects/73-perplexity-calibration/code/main.py, phases/19-capstone-projects/73-perplexity-calibration/docs/en.md, phases/19-capstone-projects/74-leaderboard-aggregation/code/main.py, phases/19-capstone-projects/75-end-to-end-eval-runner/code/main.py, phases/10-llms-from-scratch/10-evaluation/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `DEFAULT_TIMEOUT_S` | 3.0 | 每个任务。`MAX_TIMEOUT_S` 为 30.0 |
| `OUTPUT_CAP_BYTES` | 256 * 1024 | 超过后结果为 "output overflow" |
| `FEW_SHOT_MAX` | 8 | 每个任务的 few-shot 示例数 |
| ECE `bins` | 10 | 对比时惯例用 15 |
| Bootstrap `b` | 500 | 底层辅助函数用 1000 |
| `alpha` | 0.05 | 95% 百分位区间 |
| `max_workers` | 8 | `run_eval` 中的线程池 |
| ELO `k` | 32 | 初始评分 1500 |

## 故障排查
type: troubleshooting
from: phases/19-capstone-projects/73-perplexity-calibration/docs/en.md, phases/19-capstone-projects/41-eval-pipeline/docs/en.md, phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/docs/en.md, phases/05-nlp-foundations-to-advanced/28-long-context-evaluation/docs/en.md, phases/19-capstone-projects/74-leaderboard-aggregation/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 困惑度低于 1 | Adapter 返回 log p 而不是 -log p | 取负。函数会拒绝它 |
| 困惑度好得离谱 | padding 计入了分母 | 只统计非 pad token |
| 裁判分数缺失 | 坏 JSON 得到 NaN，均值把它丢掉 | 作为显式失败捕获 |
| 裁判给自家模型打高分 | 自评会高出 10-20% | 用不同模型家族做裁判 |
| 两两比较的裁判偏向第一个 | 位置偏差 | 随机化顺序并两种顺序都跑 |
| 均值 0.85，用户抱怨 | 均值掩盖了 5% 的灾难性失败 | 检查最低分位 |
| 通过 NIAH，真实文档失败 | NIAH 只测检索 | 加上 RULER 或多跳测试 |
| 一个任务主导均值 | 分数在 [0, 100] 范围 | 返回 [0, 1] 内的小数 |

## 缩写
type: glossary
from: phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/docs/en.md, phases/19-capstone-projects/73-perplexity-calibration/docs/en.md, phases/10-llms-from-scratch/10-evaluation/docs/en.md, phases/05-nlp-foundations-to-advanced/28-long-context-evaluation/docs/en.md

- **EM**：Exact Match。归一化后每个任务为 1 或 0。
- **ECE**：Expected Calibration Error。置信度与准确率之间的差距。
- **MMLU**：Massive Multitask Language Understanding。15,908 道题，57 个学科。
- **HumanEval**：164 道 Python 函数补全题。
- **SWE-bench**：来自 12 个 Python 仓库的 2,294 个 GitHub issue。
- **NIAH**：Needle in a Haystack。在填充文本中埋入一个事实，再提问它。
- **MRCR**：Multi-Round Coreference Resolution。8、24 或 100 根针。
- **RAGAS**：Retrieval-Augmented Generation ASsessment。四个 RAG 指标。

## 问答
type: qa
from: phases/11-llm-engineering/10-evaluation/docs/en.md, phases/19-capstone-projects/27-eval-harness-fixture-tasks/docs/en.md, phases/19-capstone-projects/74-leaderboard-aggregation/docs/en.md, phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/docs/en.md, phases/05-nlp-foundations-to-advanced/28-long-context-evaluation/docs/en.md

- **需要多少测试用例？** 部署决策至少 200 个。比较接近的系统需要 500 个或更多。
- **为什么还要报告 pass@1？** pass@k 会掩盖二十次里只对一次的模型。
- **差异何时是真实的？** 配对差值的 bootstrap 区间不包含零时。
- **何时可以信任裁判？** 与人工标签的 Spearman rho 达到 0.7 或以上。
- **真实的上下文有多长？** 有效推理长度常为宣称窗口的 25-50%。

## 提示
type: tips
from: phases/11-llm-engineering/10-evaluation/docs/en.md, phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/docs/en.md, phases/19-capstone-projects/49-lm-eval-harness/docs/en.md, phases/05-nlp-foundations-to-advanced/28-long-context-evaluation/docs/en.md

- 把每个评分档锚定到可观察的行为上。裁判方差下降 30-40%。
- 固定裁判模型及其版本。
- 在排行榜中按哈希固定任务文件。
- 比较预测本身，而不只是分数。使用 `--include-per-example`。
- 评测用例与 prompt 示例、训练样本分开。
- 测试针的深度 0、0.25、0.5、0.75 和 1.0。
