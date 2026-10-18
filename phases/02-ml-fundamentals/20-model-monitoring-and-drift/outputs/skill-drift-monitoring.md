---
name: skill-drift-monitoring
description: 为已部署模型规划漂移监控，并对漂移告警进行分诊
version: 1.0.0
phase: 2
lesson: 20
tags: [monitoring, drift, psi, kolmogorov-smirnov, chi-square, alerting]
---

# 漂移监控

在两种情况下使用此技能：模型即将上线、需要规划监控时使用 A 部分；漂移告警触发时使用 B 部分。

## A 部分：规划监控

### 第 1 步：列出各层信号

| 层面 | 最少需要的信号 |
|---|---|
| 系统健康 | p99 延迟、错误率、每分钟请求数 |
| 输入 | 每个重要特征的一项漂移检验、缺失率、新类别 |
| 预测 | 分数分布（对分数十分位分箱计算 PSI）、正预测比例 |
| 结果 | 设计中的离线指标，只在已标注事件上计算 |

### 第 2 步：为每个输入选择检验

- 数值特征：在参考十分位分箱上计算 PSI，加上 KS 统计量 `D`
- 类别特征：两行表的卡方检验，加上 Cramér's V
- 不同取值不超过五个的特征：视为类别特征

### 第 3 步：设置窗口

- 参考：训练数据，或经过人工检查的一段生产数据
- 当前：窗口应足够大，使干净窗口保持在警告级别以下；在历史干净数据上运行检验以测量这一点
- 若流量随星期变化，参考窗口应覆盖完整一周周期

### 第 4 步：设置告警策略

上线前写下这些数字：

```text
family alpha          = 0.01
per-test alpha        = family alpha / number of tests
PSI warn / drift      = 0.10 / 0.25
KS D for drift        = 0.10 together with p < per-test alpha
Cramér's V for drift  = 0.10 together with p < per-test alpha
persistence           = 2 consecutive drift windows before an alert
outcome alert         = metric below reference metric - tolerance, for 2 windows
```

警告发送到仪表盘，告警发送给人员。

### 第 5 步：记录标签延迟

说明标签多久到达，以及此前团队观察什么。若延迟超过一周，添加使用已校准概率的性能估计。这类估计可以处理协变量漂移，却不能检测概念漂移。

## B 部分：告警分诊

### 第 1 步：排除流水线缺陷

优先检查以下问题，因为它们看起来也像漂移：

- 模式变化、列重命名或单位变化
- 缺失值或默认值突然增多
- 新类别来自代码变化，而不是用户变化
- 关联操作出错，导致特征被填为 null

### 第 2 步：确定漂移类型

| 证据 | 可能的漂移 | 行动 |
|---|---|---|
| 输入变化，结果指标稳定 | 协变量漂移 | 继续观察；只有流量进入数据稀少区域时才重训。 |
| 正类比例变化，各类内输入分布相同 | 先验漂移 | 重新校准分数或调整决策阈值 |
| 输入稳定，结果指标下降 | 概念漂移 | 收集新标签，再用近期已标注数据重训 |
| 输入变化且结果指标下降 | 有害协变量漂移，或两类漂移同时发生 | 用近期已标注数据重训，并在最新时段检查新模型 |

### 第 3 步：检查效应大小

大窗口下的小 p 值说明不了多少。报告 PSI、`D` 或 Cramér's V，以及结果指标的变化。按特征对模型的重要性排列发生漂移的特征。

### 第 4 步：撰写分诊记录

```text
Alert: <signal, window end, value, threshold>
Pipeline check: <defect found or none>
Drift kind: covariate | prior | concept | unclear
Impact: <outcome metric change, or "labels pending until <date>">
Action: wait | recalibrate | collect labels | retrain | roll back
Owner and review date: <name, date>
```

每次重新训练后，将参考窗口重置为新训练数据。
