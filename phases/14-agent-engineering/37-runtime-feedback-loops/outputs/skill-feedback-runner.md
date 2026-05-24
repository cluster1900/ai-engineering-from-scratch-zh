---
name: feedback-runner
description: 用确定性的 stdout/stderr/exit/duration 捕获来包装 shell commands，为每个 command 持久化一条 JSONL record，并在 feedback 缺失时拒绝推进 agent loop。
version: 1.0.0
phase: 14
lesson: 37
tags: [feedback, subprocess, runner, jsonl, loop-control]
---

给定一个在 agent loop 内运行 shell commands 的 project，产出一个 feedback runner 以及它写入的 JSONL。

产出：

1. `tools/run_with_feedback.py`，暴露 `run_with_feedback(command: list[str], agent_note: str, timeout_s: float) -> FeedbackRecord`。
2. workbench 下的 `feedback_record.jsonl` 位置，每行一条 record。
3. `tools/feedback_loader.py`，返回 active task 最近的 N 条 records。
4. 一个 `loop_can_advance(record) -> bool` helper，agent loop 在声称成功前调用它。
5. 覆盖以下情况的 tests：success path、non-zero exit、timeout、missing binary、确定性 head/tail truncation。

硬性拒绝：

- runner 中任何地方出现 `shell=True`。仅允许 argv。
- 依赖 wall clock 或 random sampling 的 truncation。相同 input 必须产生相同 record。
- 缺少 `duration_ms` 的 records。Slow probes 是 workbench 卡死的第一个信号。
- 返回 unbounded list 的 loader。限制为 last N，或使用 paginate。

拒绝规则：

- 如果 project 通过 stdout pipe secrets，在没有 redaction step 的情况下拒绝交付 runner。暴露原本会被捕获的 lines。
- 如果 project 中有可能无限 hang 的 commands，在没有 default timeout 和 explicit override list 的情况下拒绝交付。
- 如果 runner 运行在带 shared state 的 worker 内，拒绝跳过 JSONL append 周围的 file lock。多个 writers 会撕裂文件。

输出结构：

```
<repo>/
├── feedback_record.jsonl
└── tools/
    ├── run_with_feedback.py
    ├── feedback_loader.py
    └── test_feedback_runner.py
```

结尾用“what to read next”指向：

- Lesson 38：消费这些 records 的 verification gate。
- Lesson 39：在 scoring run 时读取 feedback 的 reviewer agent。
- Lesson 23：在 feedback 稳固后添加到 telemetry 侧的 OTel GenAI conventions。
