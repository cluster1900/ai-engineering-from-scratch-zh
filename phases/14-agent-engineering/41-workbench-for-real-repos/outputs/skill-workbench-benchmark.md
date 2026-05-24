---
name: workbench-benchmark
description: 在某个 project 自己的 sample app 上，通过 prompt-only 和 workbench-guided pipelines 运行同一个任务，并输出一份包含五个 outcome 的 before/after report。
version: 1.0.0
phase: 14
lesson: 41
tags: [benchmark, before-after, evaluation, workbench, sample-app]
---

给定一个 repo、一个 agent product 和一个小型 sample app，产出一个 portable evaluation harness，用于比较 prompt-only 与 workbench-guided pipelines。

产出：

1. `eval/sample_app/` — 从 project domain 中抽取的 minimum-viable sample app。
2. `eval/run_prompt_only.py` 和 `eval/run_workbench.py`，二者都接收 task description，并返回 `TaskOutcome`。
3. `eval/report.py`，运行两条 pipelines，并写入 `before-after-report.md` 与 `comparison.json`。
4. CI workflow，当 workbench outcomes 在固定 task suite 上发生 regression 时失败。
5. `docs/benchmark.md`，解释五个 outcomes，以及什么算作 regression。

Hard rejects：

- 只有一条 pipeline 的 benchmark。Comparison 才是重点。
- outcome 以没有 denominator 的百分比表述。始终报告 `n / m`。
- agent product 已经训练过的 sample app。使用经过 domain-tuned 的 fixture。
- 隐藏 false negatives 的 reports。prompt-only 更快的任务必须列出。

Refusal rules：

- 如果 project 没有 acceptance command，拒绝交付 benchmark。没有任何东西可以衡量。
- 如果 workbench pipeline 在 median task 上耗时超过 prompt-only pipeline 的 3x，暴露这个发现；需要简化的是 workbench，而不是 model。
- 如果 harness 无法 offline 运行，拒绝将其接入 CI。Network flakiness 会污染 comparison。

Output structure：

```
<repo>/
├── eval/
│   ├── sample_app/
│   ├── run_prompt_only.py
│   ├── run_workbench.py
│   └── report.py
├── outputs/eval/
│   ├── before-after-report.md
│   └── comparison.json
├── docs/benchmark.md
└── .github/workflows/benchmark.yml
```

最后用 “what to read next” 指向：

- Lesson 42：capstone pack，它会打包 workbench pipeline 使用的每个 surface。
- Lesson 19（SWE-bench、GAIA、AgentBench）：作为本 benchmark 补充的 macro benchmarks。
- Lesson 30（Eval-Driven Agent Development）：benchmark 接好之后用于持续 eval loops。
