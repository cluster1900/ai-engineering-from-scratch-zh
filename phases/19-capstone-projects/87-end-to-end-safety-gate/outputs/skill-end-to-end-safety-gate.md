---
name: skill-end-to-end-safety-gate
description: 三检查点Safety Gate由输入检测器、流token过滤器、输出分类器和具有确定性聚合表和每个请求跟踪的规则引擎组成
version: 1.0.0
phase: 19
lesson: 87
tags: [safety, harness, composition]
---
# 端到端 Safety Gate

## 生命周期

1. pre-gen - 根据提示运行第 83 课检测器
   - 如果confidence >= block_threshold：返回拒绝，发出跟踪，停止
2.在生成期间 - 来自模型的流，缓冲两个块，扫描已知的有害延续
   - 如果匹配：终止迭代器，token跟踪，视为中等严重性
3. post-gen - 如果没有提前终止，则在完成的输出上运行第 85 课的分类器路由器和第 86 课的规则引擎
4. 聚合 - 在 pre、during、post.classifier、post.rules 中取最大严重性
5. 应用 - 映射到阻止、编辑、警告或允许

## 聚合表

|信号状态 |行动|
|---|---|
|任何高严重性 |块|
|任何中等严重程度 |编辑|
|任何低严重程度 |警告|
|什么都没有|允许 |

## 跟踪结构```text
RequestTrace
  request_id: str
  prompt: str
  pre_gen: { category, confidence, fired[] }
  during_gen: { terminated_early, matched_pattern, partial_chunks }
  post_gen: { classifier_action, classifier_severity, rules_max_severity, rules_violations[] } | null
  final_action: block | redact | warn | allow
  final_output: str
  latency_ms: float
```## artifact

`outputs/gate_trace.json` 包含摘要和每个请求的一条跟踪，包括 50 个分类fixture和 10 个良性提示。