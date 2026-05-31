---
name: lm-eval-harness
description: 最小化 language model evaluation harness，包含 JSONL task spec、五种 metric、可替换 adapter，以及 leaderboard JSON 输出。
version: 1.0.0
phase: 19
lesson: 49
tags: [evaluation, metrics, leaderboard, harness]
---

## 何时使用

将两个 model、两个 checkpoint，或两个 prompt template 与一组固定 task 进行比较。适用于任何会发布、并且需要随时间监控的东西。

## Task spec

每个 example 一行 JSONL：

```json
{"id": "ex-001", "prompt": "...", "targets": ["..."], "metric": "exact_match", "extras": {}}
```

一个文件中的所有 example 共用一个 metric。文件名就是 task 名。

## Metrics

| Metric | 签名 | 适用场景 |
|--------|-----------|---------|
| exact_match | normalize lower + whitespace，相等性 | 算术、事实型答案 |
| substring_contains | target 必须出现在 normalized prediction 中 | 带锚点词的自由形式生成 |
| multiple_choice | 首字母匹配 | A/B/C/D 风格问题 |
| rouge_l | tokenized text 上的 LCS F1 | 摘要、改写 |
| code_exec | 在 io_pairs 上运行 prediction 的 `f`，统计匹配数 | 代码生成 |

所有 metric 都返回 [0.0, 1.0] 范围内的 float。Task score 是平均值。

## Adapter

```python
class Adapter(Protocol):
    name: str
    def generate(self, prompts: list[str]) -> list[str]: ...
```

adapter 是唯一与 model 相关的代码。

## Leaderboard JSON

Schema string、timestamp、每个 task 的 score 和 latency、overall mean。比较 run 时包含每个 example 的记录，这样 prediction 级别的 regression 才可见。

## 失败模式

- Metric 返回 [0, 1] 之外的值：overall score 会变得不可解释。
- 一个 task file 中混用 metric：assertion 会触发；每个文件只保留一个 metric。
- 没有限制 namespace 的 code_exec：任意代码执行。
- 没有 schema string：format 演进会破坏下游 dashboard。
