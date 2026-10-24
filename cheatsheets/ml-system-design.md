---
id: ml-system-design
title: ML System Design, Drift and Feature Stores
code: MS
subtitle: 定义任务、估算服务成本、超越基线、安全上线，并捕获漂移与训练-服务偏差。
hue: 220
sources: phases/02-ml-fundamentals/01-what-is-machine-learning, phases/02-ml-fundamentals/19-ml-system-design, phases/02-ml-fundamentals/20-model-monitoring-and-drift, phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew
source_hash: 89d7b8dde8c0353a
---

## 一份定义，两类读者
type: architecture
from: phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew/docs/en.md

```arch
node | raw | 1,1 | Raw events |
node | reg | 2,1 | Registry | feature definitions
node | off | 3,1 | Offline store | history with timestamps
node | pit | 4,1 | Point-in-time join | labels to training set
node | on | 3,2 | Online store | latest value per entity
node | serve | 2,2 | Serving request | a few milliseconds
node | log | 2,3 | Logged features | serving time
node | skew | 4,3 | Skew check | mismatch rate per feature
edge | raw | reg |
edge | reg | off | backfill
edge | off | pit |
edge | off | on | materialize
edge | on | serve |
edge | serve | log |
edge | log | skew |
edge | pit | skew |
```

## 从目标到安全上线
type: flow
from: phases/02-ml-fundamentals/19-ml-system-design/docs/en.md

1. **任务**：写明预测对象、实体、时间范围以及使用它的决策。
2. **指标**：在建模之前选定离线、在线、业务和护栏指标。
3. **基线**：平凡基线、启发式规则和现有系统。先设定最低提升幅度。
4. **数据**：检查标签来源、标签延迟，以及每个特征在预测时刻是否都可用。
5. **预算**：设定 p99 延迟、峰值 QPS、每日成本和数据陈旧度。
6. **影子（Shadow）**：新模型对一份实时流量副本打分，没人使用其输出。
7. **金丝雀（Canary）**：对 1% 到 5% 的流量做真实决策。护栏被打破就回滚。
8. **A/B 测试**：随机划分用户，用统计检验衡量业务指标。

## 工具包调用
type: task-table
from: phases/02-ml-fundamentals/19-ml-system-design/code/main.py, phases/02-ml-fundamentals/20-model-monitoring-and-drift/code/main.py, phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew/code/main.py

| 任务 | 代码 |
|---|---|
| 预算内最便宜的方案 | `choose_serving(workload, costs)` |
| 相对最佳基线的提升 | `compare_to_baselines(..., min_lift=0.02)` |
| 给设计文档打分 | `review_design_doc(doc, ready_score=0.85)` |
| 数值漂移，十分位分箱 | `psi(reference, current, bins=10)` |
| 最大 CDF 差距 | `ks_statistic(sample_a, sample_b)` |
| 类别漂移 | `chi_square_test(reference_counts, current_counts)` |
| 带 TTL 的 as-of join | `point_in_time_join(labels, rows, ttl_days)` |
| 比对日志记录的特征 | `detect_skew(training, serving, features)` |

## 估算批量与在线服务成本
type: annotated-code
lang: python
from: phases/02-ml-fundamentals/19-ml-system-design/code/main.py

```python
refresh_hours = workload.max_staleness_hours - costs.batch_job_hours
if refresh_hours <= 0:                       # job longer than the limit
    return ServingPlan("batch", False, ...)
runs_per_day = 24.0 / refresh_hours
predictions = workload.entities * runs_per_day
dollars = (predictions / 1e6 * costs.batch_dollars_per_million
    + workload.requests_per_day / 1e6 * costs.lookup_dollars_per_million)
replicas = max(costs.min_replicas, math.ceil(workload.peak_qps / costs.replica_qps))
dollars = replicas * costs.replica_dollars_per_hour * 24.0   # online pays for idle
feasible = costs.online_latency_ms <= workload.latency_budget_ms
```

## 命令
type: command-table
from: phases/02-ml-fundamentals/19-ml-system-design/docs/en.md, phases/02-ml-fundamentals/20-model-monitoring-and-drift/docs/en.md, phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` | 用标准库运行每节课的演示 |
| `python3 code/main.py my_design_doc.json` | 评审你自己的设计文档 |
| `stats.ks_2samp(reference_amounts, current_amounts)` | scipy 中的 KS 统计量和 p 值 |
| `stats.chi2_contingency(table)` | 卡方统计量、p 值和自由度 |
| `DummyClassifier(strategy="most_frequent")` | 多数类基线 |
| `feast apply` | 在 Feast 中注册特征定义 |
| `feast materialize-incremental <end time>` | 把最新值复制到在线存储 |
| `store.get_historical_features(entity_df=...)` | 时间点正确的训练特征 |

## 漂移与偏差公式
type: concepts
from: phases/02-ml-fundamentals/20-model-monitoring-and-drift/docs/en.md, phases/02-ml-fundamentals/19-ml-system-design/docs/en.md

- **协变量漂移**：`P(x)` 发生变化。输入监控能看到。
- **先验漂移**：`P(y)` 发生变化。预测和结果监控能看到。
- **概念漂移**：`P(y | x)` 发生变化。只有结果监控能看到。
- **PSI**：在各分箱上求 $\sum (\text{current} - \text{reference}) \cdot \ln(\text{current} / \text{reference})$。
- **KS D**：两个经验 CDF 之间的最大差距。完全相同为 0，毫无重叠为 1。
- **Cramér's V**：两行列联表中 chi2 / grand_total 的平方根。
- **Little 定律**：在途量 = 吞吐量乘以延迟。400 rps、50 ms 时为 20。
- **提升（Lift）**：模型得分减去最强基线得分。

## 默认值与数字
type: defaults
from: phases/02-ml-fundamentals/20-model-monitoring-and-drift/code/main.py, phases/02-ml-fundamentals/20-model-monitoring-and-drift/docs/en.md

| 设置 | 默认 | 说明 |
|---|---|---|
| `family_alpha` | 0.01 | Bonferroni 校正，两个检验各 0.005 |
| `psi_warn` | 0.10 | PSI 低于 0.1 视为稳定 |
| `psi_drift` | 0.25 | 高于 0.25 为显著偏移 |
| `ks_drift` | 0.10 | D 必须超过且 p 低于 alpha |
| `min_cramers_v` | 0.10 | 类别特征的效应量 |
| `patience` | 2 | 告警前需要的连续漂移窗口数 |
| `window_size` | 500 | step=250，label_delay=500 |
| PSI 占比下限 | 0.0001 | 防止对数趋于无穷 |

## 故障与修复
type: troubleshooting
from: phases/02-ml-fundamentals/19-ml-system-design/docs/en.md, phases/02-ml-fundamentals/20-model-monitoring-and-drift/docs/en.md, phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 模型服务超时 | 没有故障预案 | 使用启发式基线 |
| 夜间批任务失败 | 分数缺失 | 先提供上次正常的分数，再退回规则 |
| 分数分布突变 | 大规模错误决策 | 暂停动作并通知人工 |
| 输入漂移，准确率稳定 | 协变量漂移 | 通常无需处理。关注结果 |
| 准确率下降，输入平稳 | 概念漂移 | 收集新标签，然后重训 |
| 离线 0.948，线上更差 | 朴素 join 读到了未来的行 | 时间点正确的 join |
| 服务端默认 -1，训练端 365 | 两套代码路径 | 统一使用一份注册表定义 |
| 每天 60 次误报 | 50 个特征每小时以 0.05 检验 | Bonferroni、效应量、持续性 |

## 缩写
type: glossary
from: phases/02-ml-fundamentals/19-ml-system-design/docs/en.md, phases/02-ml-fundamentals/20-model-monitoring-and-drift/docs/en.md, phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew/docs/en.md

- **PSI**：Population Stability Index（群体稳定性指数），源自信用评分。
- **KS**：Kolmogorov-Smirnov。基于 CDF 的双样本检验，无需分箱。
- **TTL**：time to live（存活时间）。更旧的值视为缺失。
- **QPS**：每秒查询数。按峰值而不是平均值规划容量。
- **p99**：100 个请求中有 99 个低于的延迟。
- **CBPE**：Confidence-based Performance Estimation（基于置信度的性能估计）。遇到概念漂移会失效。

## 问答
type: qa
from: phases/02-ml-fundamentals/01-what-is-machine-learning/docs/en.md, phases/02-ml-fundamentals/19-ml-system-design/docs/en.md, phases/02-ml-fundamentals/21-feature-stores-and-training-serving-skew/docs/en.md, phases/02-ml-fundamentals/20-model-monitoring-and-drift/docs/en.md

- **什么时候不该用 ML？** 简短规则就能解决、没有标签、没人据此行动，或单次错误不可接受。
- **为什么不用 AUC？** 它对你从不使用的阈值做平均。应当与实际决策对齐。
- **数据怎么划分？** 训练 60-80%，验证 10-20%，测试 10-20%。留出最新的时间段。
- **如何打破反馈回路？** 保留一个永远不施加干预的随机留出组。
- **如何定位偏差原因？** 比对在线读取值、重新计算值和第二套代码路径的结果。
- **重训之后呢？** 用最近的标签测试，经过影子和金丝雀，然后重置参考窗口。
