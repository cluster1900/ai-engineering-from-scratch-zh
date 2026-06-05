---
name: skill-prompt-injection-detector
description: 分层检测器管道，可返回任何提示的类别和置信度，具有可测量的精度和召回率
version: 1.0.0
phase: 19
lesson: 83
tags: [safety, detector, prompt-injection]
---
# Prompt Injection Detector

这里的检测器是一个从提示到判断的函数。判决带有第 82 课分类法中的类别和 [0, 1] 的置信度。

## 管道

1. 规范化 - 剥离零宽度字符、撤消同形文字、解码 base64/hex、折叠 leet-speak 数字、尝试使用常用词健全性检查进行 rot13。
2、子串规则——手写针如`ignore previous`、`from now on you are`、`decode this base64`。
3. 正则表达式规则 - token级模式，例如 `\bignor\w*\s+(all|prior|previous|earlier)\b`。

聚合保留每个类别的最大分数，并返回具有最大分数的类别，如果没有触发，则返回 `benign`。

## 添加规则

编辑`code/rules.py`。规则是具有 `name`、`category`（六个分类类别之一）、`score`（浮点数 0 到 1）以及 `substring` 或 `regex` 之一的字典。重新运行 `main.py` 以查看对每个类别的精度和召回率的影响。

## artifact

`outputs/detector_report.json` 是每个类别的指标文件。第 87 课中的端到端门将其解读为阈值置信度。