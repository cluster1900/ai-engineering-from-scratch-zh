---
name: skill-feature-skew-audit
description: 审计特征流水线中的时间穿越和训练—服务偏差
version: 1.0.0
phase: 2
lesson: 21
tags: [feature-store, point-in-time, training-serving-skew, leakage, backfill]
---

# 特征偏差审计

当模型离线评分良好、生产表现却较差时，使用此技能。团队引入特征存储时，以及新特征上线之前，也应使用它。按顺序完成各步骤，并记录每项发现。

## 步骤 1：梳理两条路径

为每个特征写下两行：

```text
training path: <source table> -> <transformation code> -> <join to labels>
serving path:  <source> -> <transformation code> -> <store or request-time compute>
```

如果两行指向不同的变换代码，就将该特征标记为“两条代码路径”。这是首要的偏差风险。

## 步骤 2：检查训练关联中的时间穿越

- 关联使用标签时间戳，而不只是实体键。
- 关联选取事件时刻不晚于标签时刻的最新行。
- 关联丢弃超过 TTL 的行。
- 回填或修正的行携带创建时间戳，关联会忽略标签时刻之后创建的行。
- 聚合窗口在标签时刻结束。“标签前后 30 天”这样的窗口会造成泄漏。

快速测试：统计特征行时间晚于标签时间的训练行数量。只要大于零，就存在泄漏。

## 步骤 3：比较定义

对每个特征，从以下方面比较两条路径：

| 检查点 | 问题 |
|---|---|
| 窗口边界 | 两条路径对各个窗口边界是否都采用相同的包含或排除规则？ |
| 缺失值 | 对没有历史和已过期的值，两条路径是否使用相同默认值？ |
| 单位与类型 | 币种、时区、整数或浮点类型是否相同？ |
| 舍入 | 是否在相同步骤执行相同的舍入？ |
| 类别映射 | 词表和未知值的处理方式是否相同？ |

## 步骤 4：比较新鲜度

- 在标签时刻，训练值的平均年龄和最大年龄分别是多少？
- 在请求时刻，服务值的平均年龄和最大年龄分别是多少？
- 物化失败时会发生什么？TTL 必须让旧值退回默认值，而不是悄悄继续提供旧值。

在最多一周前的值上训练的模型，面对新值时可能表现不同。应使两者的新鲜度一致，或使用与服务端新鲜度相同的值重新训练。

## 步骤 5：测量偏差

1. 记录服务路径实际使用的特征值，以及实体和请求时间。
2. 使用训练路径重新计算相同的键。
3. 对每个特征报告不匹配比例和平均绝对差。
4. 通过三组比较拆分原因：存储读取与训练结果、实时计算与训练结果、第二条路径与实时计算结果。

如果超过 1% 的值不同，就标记该特征，除非这种差异属于已记录的新鲜度差距。

## 步骤 6：编写审计结果

```text
Feature: <name, version>
Paths: shared definition | two code paths
Time travel: none found | <rows affected and cause>
Definition gaps: <window edges, defaults, units, rounding>
Freshness: training <age>, serving <age>, TTL <days>
Measured skew: <mismatch rate, mean |diff|>
Fix: <move both paths to one registry definition | fix join | align default | align TTL>
```

修复顺序：先消除时间穿越，再让两条路径使用同一份定义，最后统一新鲜度。
