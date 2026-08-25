---
name: skill-refusal-evaluation
description: 在带标签的提示语料库上进行校准和按类别细分的双边拒绝指标
version: 1.0.0
phase: 19
lesson: 84
tags: [safety, evaluation, calibration]
---
# 拒绝评价

带标签的安全和不安全提示语料库会经历一个或多个模型策略。输出被分类为拒绝或答案。框架返回：

- 拒绝不足：回答标记为不安全/完全不安全的提示
- 过度拒绝：拒绝标记为安全/完全安全的提示
- 准确率：（正确拒绝+正确答案）/总计
- ECE：按规定置信度分类的预期校准误差
- 按类别拒绝不足：根据第 82 课分类法加入

## 插入真实模型

模拟 LLM 是一个可调用的 `(prompt: str) -> str`。将其替换为返回模型输出并Embedding置信标签的 HTTP 包装器（或修改 `parse_confidence` 以读取提供程序公开的任何内容）。其他一切都保持不变。

## artifact

`outputs/refusal_eval_report.json` 包含每个策略的指标。第 87 课阅读此报告来设置阈值。
