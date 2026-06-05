---
name: skill-content-classifier-integration
description: 单个严重性路由器后面的三个输出侧分类器（毒性、PII、指令泄漏），具有阻止、编辑、警告、日志操作
version: 1.0.0
phase: 19
lesson: 85
tags: [safety, classifier, output-filter]
---
# 内容分类器集成

三个分类器，一个路由器，四个动作。

## 判决结构```text
ClassifierVerdict
  name: str
  severity: none | low | medium | high
  score: float in [0, 1]
  findings: list[str]
```## 动作表

|严重性 |行动|效果|
|---|---|---|
|高|块|输出被政策拒绝取代|
|中等|编辑|按顺序应用每个分类器编辑器 |
|低|警告|输出附有软通知|
|无 |日志 |输出未更改，判决已记录 |

## 每个分类器的行为

- 毒性 - 带有空白边界和小左窗口否定检查的骚扰术语；编辑为 `[redacted-language]`
- pii - 电子邮件、电话、SSN、Luhn 验证的卡、IPv4； SSN 和卡的严重程度升级；将每个形状编辑为标签
- 指令泄漏 - 三元余弦与已知系统提示；具有重叠的严重程度；编辑第一条系统提示行

## artifact

`outputs/classifier_report.json` 携带动作动词、严重性、编辑输出和每个案例的完整判决列表。