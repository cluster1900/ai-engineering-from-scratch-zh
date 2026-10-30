---
id: research-agent-pipeline
title: Research Agent Pipeline from Scratch
code: RP
subtitle: 生成假设、检索论文、跑沙箱实验、评判结果，并发布带引用的报告。
hue: 165
sources: phases/19-capstone-projects/05-autonomous-research-agent, phases/19-capstone-projects/50-hypothesis-generator, phases/19-capstone-projects/51-literature-retrieval, phases/19-capstone-projects/52-experiment-runner, phases/19-capstone-projects/53-result-evaluator, projects/research-report-agent
source_hash: e3bed71e0634229b
---

## 研究循环
type: architecture
from: phases/19-capstone-projects/50-hypothesis-generator/docs/en.md, phases/19-capstone-projects/51-literature-retrieval/docs/en.md, phases/19-capstone-projects/52-experiment-runner/docs/en.md, phases/19-capstone-projects/53-result-evaluator/docs/en.md, phases/19-capstone-projects/05-autonomous-research-agent/docs/en.md

```arch
node | gen | 1,1 | HypothesisGenerator | lesson 50, ranked queue | model
node | ret | 2,1 | RetrievalClient | lesson 51, BM25 + citation graph | store
node | run | 3,1 | ExperimentRunner | lesson 52, subprocess limits | process
node | eval | 4,1 | Evaluator | lesson 53, paired t test | process
node | seed | 1,2 | Seed prompt | temperature ramp | client
node | tree | 2,2 | Tree search | novelty, quality, budget | process
node | write | 3,2 | LaTeX writer | vision critique | model
node | rev | 4,2 | Reviewer ensemble | 5 judges | model
edge | seed | gen |
edge | gen | ret | queue head
edge | ret | run | not settled
edge | run | eval | ExperimentResult
edge | eval | gen | verdict
edge | tree | write | best branch
edge | write | rev | draft
```

## 运行它
type: command-table
span: 2
from: phases/19-capstone-projects/50-hypothesis-generator/code/main.py, phases/19-capstone-projects/51-literature-retrieval/code/main.py, phases/19-capstone-projects/52-experiment-runner/code/main.py, phases/19-capstone-projects/53-result-evaluator/code/main.py, phases/19-capstone-projects/05-autonomous-research-agent/code/main.py, phases/19-capstone-projects/05-autonomous-research-agent/docs/en.md, projects/research-report-agent/README.md, projects/research-report-agent/solution/run_report.py

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` | 第 50 到 53 课演示。打印 JSON |
| `python main.py` | 第 05 课树搜索，预算 $30 |
| `docker run --network=none --memory=8g --cpus=2 --pids-limit=256 --read-only` | 一次实验的沙箱 |
| `run_report.py "<question>" --out out/ --code <dir>` | 报告、轨迹与证据 JSON |
| `run_report.py --eval heldout/questions.json` | 给公开夹具打分 |
| `run_report.py "<question>" --model replay --cassette <file>` | 从录制的回复做计划 |
| `run_report.py "<question>" --corpus <dir> --compare <old>/report.json` | 写 `changes.json` |
| `project_test.py research-report-agent --stage <n> --path <dir>` | 给一个阶段及之前全部阶段打分 |

## 代码中的循环调用
type: task-table
span: 2
from: phases/19-capstone-projects/50-hypothesis-generator/code/main.py, phases/19-capstone-projects/51-literature-retrieval/code/main.py, phases/19-capstone-projects/52-experiment-runner/code/main.py, phases/19-capstone-projects/53-result-evaluator/code/main.py

| 任务 | 代码 |
|---|---|
| 配置升温 | `GeneratorConfig(n_passes=4, t_min=0.2, t_max=1.1)` |
| 起草并排名 | `queue, logs = generator.run(seed_prompt)` |
| 建一个检索器 | `build_client(RetrievalConfig(top_k_lexical=5, max_hops=2))` |
| 搜论文 | `result = client.search(query)` |
| 跑一份规格 | `ExperimentRunner().run(spec)` |
| 扫一个旋钮 | `AblationRunner(runner).sweep(base, "k", [4, 8, 16, 32])` |
| 选指标 | `MetricSpec(name="perplexity", direction=LOWER, scale=LOG)` |
| 评判各次运行 | `evaluator.evaluate(1, metric_spec, candidates, baselines)` |

## 声明一次沙箱实验
type: annotated-code
lang: python
from: phases/19-capstone-projects/52-experiment-runner/code/main.py, phases/19-capstone-projects/52-experiment-runner/docs/en.md

```python
base = ExperimentSpec(
    spec_id="demo_base", hypothesis_id=1,
    script_path=script,                       # prints one json line
    config={"k": 16, "steps": 4, "sleep_s": 0.0},
    seed=7,                                   # sent as config["__seed"]
    wall_timeout_s=15.0,                      # hard, killed on exceed
    memory_cap_mb=256,                        # soft, polled RSS
    metric_keys=["perplexity", "final_loss"],
)
runner = ExperimentRunner()
base_result = runner.run(base)                # terminal: ok, timeout, oom, crash
base_result.to_dict()                         # metrics, peak_rss_mb, stderr_tail
ablate(base, "k", [4, 8])                     # spec_id demo_base_k_4
```

## 报告智能体运行
type: flow
from: projects/research-report-agent/solution/report_agent/pipeline.py, projects/research-report-agent/solution/report_agent/critic.py, projects/research-report-agent/solution/report_agent/writer.py, projects/research-report-agent/solution/report_agent/planner.py, projects/research-report-agent/README.md

1. **index**：`BM25Index(documents)` 在 Rust 里给 markdown 语料排名。
2. **plan**：`plan_research` 把问题拆成最多 4 个面。
3. **gather**：`gather_snippets` 每个面保留 3 条带偏移的片段。
4. **write**：`write_report` 用 `[S1]` 标记组句。
5. **verify**：`review` 给每句打分。`apply_verdicts` 丢掉其余。
6. **state**：`decide_state` 给出 completed、needs_review 或 failed。
7. **publish**：`write_outputs` 写出 report.html、report.json 与 trace.json。

## 分数与公式
type: concepts
from: phases/19-capstone-projects/50-hypothesis-generator/docs/en.md, phases/19-capstone-projects/51-literature-retrieval/docs/en.md, phases/19-capstone-projects/53-result-evaluator/docs/en.md, phases/19-capstone-projects/05-autonomous-research-agent/code/main.py, projects/research-report-agent/solution/report_agent/evaluate.py

- **余弦距离**：单位向量上的 `1 - dot(a, b)`。
- **rank_score**：0.4 novelty + 0.3 specificity + 0.3 testability。
- **final_score**：0.5 归一化 BM25 + 0.3 graph + 0.2 recency。
- **graph_score**：词汇命中为 1，一跳为 0.6，两跳为 0.3。
- **节点分数**：novelty 0.4 + quality 0.5 + 预算权重 0.1。
- **改进**：越低越好时为 (baseline - candidate) / abs(baseline)。
- **配对 t**：`t_stat = mean / sqrt(variance / n)`，df 是 n - 1。
- **报告分数**：100 x (0.4 precision + 0.3 recall + 0.3 facts)。

## 循环默认值
type: defaults
from: phases/19-capstone-projects/50-hypothesis-generator/code/main.py, phases/19-capstone-projects/51-literature-retrieval/code/main.py, phases/19-capstone-projects/52-experiment-runner/code/main.py, phases/19-capstone-projects/53-result-evaluator/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `n_passes` | 6 | `t_min` 0.2 到 `t_max` 1.2 |
| `novelty_threshold` | 0.25 | 更低的距离是重复 |
| BM25 `k1`、`b` | 1.5 | `b` 是 0.75 |
| `top_k_lexical` | 10 | 图游走的种子 |
| `max_hops` | 2 | 高于 2 的值会被截断为 2 |
| `wall_timeout_s` | 30.0 | `memory_cap_mb` 是 512 |
| `improvement_threshold` | 0.02 | 更小的变化是噪声 |
| `significance_threshold` | 0.05 | 更大的 p 值是噪声 |

## 报告智能体默认值
type: defaults
from: projects/research-report-agent/solution/report_agent/critic.py, projects/research-report-agent/solution/report_agent/evaluate.py, projects/research-report-agent/solution/report_agent/writer.py, projects/research-report-agent/solution/report_agent/planner.py, projects/research-report-agent/solution/run_report.py, projects/research-report-agent/README.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `--model` | rules | 也可以是 replay 或 live |
| 预算 `max_steps` | 50 | `BudgetExceeded` 给出 failed |
| 预算 `max_tokens` | 20000 | `estimate_tokens` 是 len / 4 |
| `review` 阈值 | 0.6 | 保留一句所需的重叠 |
| `citation_precision` 阈值 | 0.8 | 比评审更严 |
| `max_facets` | 4 | 概述、如何、风险、何时 |
| `max_sentences` | 3 | 每节 |
| 参考分数 | 87.5 | 六个公开问题，满分 100 |

## 失败与修复
type: troubleshooting
from: phases/19-capstone-projects/50-hypothesis-generator/code/main.py, phases/19-capstone-projects/50-hypothesis-generator/docs/en.md, phases/19-capstone-projects/52-experiment-runner/docs/en.md, phases/19-capstone-projects/53-result-evaluator/docs/en.md, phases/19-capstone-projects/53-result-evaluator/code/main.py, phases/19-capstone-projects/05-autonomous-research-agent/code/main.py, projects/research-report-agent/solution/report_agent/critic.py, projects/research-report-agent/solution/report_agent/planner.py, projects/research-report-agent/README.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 日志显示 `parse:no hypothesis block found` | 回复没有带标签的块 | 把温度保持在 1.2 或以下 |
| 每一轮都记 `duplicate` | 草稿共享大多数名词 | 加宽种子提示再跑 |
| `terminal` 是 `crash` 且带指标 | 非零退出码 | 修好脚本。部分运行算失败 |
| `PairingError` | 两份列表的种子不同 | 在同一组种子上重跑两臂 |
| 裁决为 `noise` 但增益很大 | 少于 2 对，没有 p 值 | 跑更多种子 |
| 节点失败 `loss_diverged` | 损失高于 4.0 | 丢掉该分支。扩展其他 |
| 句子被丢掉：名字或数字不在来源里 | 换了名字或改了数字 | 保持抽取式写作 |
| 计划 `source` 是 `rules-fallback` | 坏的模型 JSON 或 cassette 未命中 | 读计划备注。重新录制 cassette |

## 问题
type: qa
from: phases/19-capstone-projects/50-hypothesis-generator/docs/en.md, phases/19-capstone-projects/51-literature-retrieval/docs/en.md, phases/19-capstone-projects/52-experiment-runner/docs/en.md, phases/19-capstone-projects/53-result-evaluator/docs/en.md, projects/research-report-agent/stages/05-verify-every-claim/docs/en.md

- **为什么升温？** 后面的草稿会跑偏。低于 0.2 时模型复述种子。
- **为什么走引用图？** 它能找到用了与查询不同词的论文。
- **为什么只两跳？** 三跳会炸开结果并偏离主题。
- **为什么用子进程？** 不可信代码不能把编排器弄崩。
- **为什么一次只动一个旋钮？** 全因子扫描按指数增长。
- **为什么用配对检验？** 每个种子给出一个差值。噪声下限是它们的标准误。
- **needs_review 是失败吗？** 不是。它告诉人正好该看哪里。
