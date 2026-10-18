---
name: skill-ml-design-review
description: 在训练开始前评审 ML 系统设计文档，优先指出阻塞性缺口
version: 1.0.0
phase: 2
lesson: 19
tags: [ml-system-design, design-review, baselines, serving, rollout]
---

# ML 设计评审

当有人分享用于真实决策的模型设计文档、提案或计划时，使用此技能。按下面的顺序评审文档：先报告阻塞性缺口，再报告其他缺口，最后提出问题。

## 第 1 步：检查六个阻塞项

缺少任一项时，暂停评审并要求修正：

1. **决策。** 文档明确每次预测触发的行动，以及由谁或什么系统执行。
2. **业务指标。** 文档明确决策必须改变的公司业务结果，以及如何通过实验测量。
3. **强基线。** 文档将模型与启发式规则或现有系统比较。只有多数类基线不算合格。
4. **无泄露。** 文档确认每个特征在预测发生时都已存在。
5. **发布与回滚。** 计划包含影子或金丝雀阶段，以及数分钟内完成的回滚。
6. **故障默认行为。** 每种故障模式都有默认行动，例如启发式规则或最近的正常分数。

## 第 2 步：检查问题定义

- 预测应明确实体、目标和时间窗口，例如“用户在未来 30 天取消订阅”。
- 文档说明为什么规则或查找表不足以解决问题。
- ML 任务类型与决策匹配：分类、回归、排序、预测或异常检测。

## 第 3 步：检查指标

| 层面 | 应询问的问题 |
|---|---|
| 离线 | 指标是否匹配决策阈值？若任务对排名最高的 5% 采取行动，就使用这 5% 中的精确率。 |
| 在线 | 哪些实时信号表明模型有效：接受率、已评分请求占比、分数分布？ |
| 业务 | 哪项实验测量结果，多久才能得到结论？ |
| 护栏 | 哪些指标不能变差：成本、延迟、投诉、退订？ |

## 第 4 步：检查数据与标签

- 标签来自哪里，由谁负责对应数据表
- 标签延迟多少天，以及标签到达前团队监控什么
- 正样本数量
- 按时间划分的留出集，保留最近的一段时间

## 第 5 步：用算术检查服务选择

要求提供五个数字：实体数、每日请求数、峰值 QPS、以小时计的最大陈旧时间，以及 p99 延迟预算。然后计算两种模式的成本：

```text
batch runs per day   = 24 / (max_staleness_hours - batch_job_hours)
batch cost per day   = entities * runs per day * price per prediction + lookups * price per lookup
online replicas      = max(2, ceil(peak_qps / qps per replica))
online cost per day  = replicas * price per replica hour * 24
```

- 陈旧时间上限短于一次批任务耗时时，批量方案不可行。
- 模型延迟高于 p99 预算时，在线方案不可行。
- 两者都可行时，优先选择更便宜的方案，并检查有多少批量分数从未被读取。
- 没有历史的新实体需要在线路径或规则。

## 第 6 步：检查反馈循环

询问模型决策如何改变未来的训练数据：

- 优惠或阻止操作等干预是否会隐藏真实结果？
- 是否只有模型展示的项目能获得反馈？
- 是否有随机保留组或探索流量来保留干净数据？
- 系统是否随每个样本记录分数和决策？

## 第 7 步：撰写评审

采用以下格式：

```text
Verdict: ready for review | revise
Blocking: <list, or "none">
Missing: <list of non-blocking gaps>
Serving check: <batch $/day, online $/day, chosen mode, pass or fail>
Questions: <at most five questions for the author>
```

如需为文档的 JSON 版本评分，在课程目录运行 `python3 code/main.py path/to/design_doc.json`。
