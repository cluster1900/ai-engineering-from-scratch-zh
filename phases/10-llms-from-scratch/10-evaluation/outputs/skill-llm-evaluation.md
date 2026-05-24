---
name: skill-llm-evaluation
description: 根据任务类型、预算和需求选择正确 LLM 评估策略的决策框架
version: 1.0.0
phase: 10
lesson: 10
tags: [evaluation, evals, benchmarks, llm-as-judge, elo, metrics]
---

# LLM 评估策略

评估 LLM 系统时，使用这个决策框架来选择正确的方法。

## 何时使用每种 eval 类型

**Benchmarks（MMLU, HumanEval, SWE-bench）：** 你正在做初始模型选择。你需要把 10 个候选模型缩小到 3 个。Benchmarks 可以零成本给出粗略排名。不要把 benchmarks 用作最终评估。

**Custom evals：** 你正在为生产环境构建系统。你有一个特定任务，并且有特定失败模式。Custom evals 是唯一能预测真实世界表现的评估。原型阶段至少 50 个测试用例，生产阶段 200+ 个。

**LLM-as-judge：** 你的任务是开放式的（摘要、写作、对话）。Exact match 和 token overlap metrics 过于僵硬。LLM-as-judge 每次判断约花费 ~$0.01，并且与人类判断约 80% 的时间一致。始终使用 rubric，而不是模糊的 prompt。

**Human evals：** 风险很高，并且自动化指标之间存在分歧。Human eval 是 ground truth，但每次判断成本为 $0.10-$2.00。将其保留给模糊案例，以及对自动化指标进行周期性校准。

**来自成对比较的 ELO：** 你正在同一任务上比较多个模型。成对比较比绝对评分更可靠，因为人类（以及 LLM judges）更擅长做相对判断。

## 评分函数选择

- **Exact match**：Classification、实体抽取、带已知答案的结构化输出
- **Token F1**：需要部分得分的抽取任务
- **ROUGE-L**：摘要、Translation
- **BLEU**：machine translation
- **LLM-as-judge**：开放式生成、对话质量、有用性
- **Execution-based**：Code 生成（运行代码，检查测试是否通过）
- **Schema compliance**：结构化输出（JSON 是否匹配 schema？）

## eval 设计中的危险信号

- Eval set 少于 50 个用例：结果在统计上没有意义
- 没有边缘情况：你测量的是正常路径表现，它总是高于真实世界表现
- 单一指标：不同指标会讲述不同故事，至少使用两个
- 没有版本控制：没有版本化的 eval sets，就无法追踪改进
- Eval set contamination：永远不要把 eval 示例包含在 fine-tuning data 或 few-shot prompts 中
- 只测试一个模型：你需要一个 baseline（即使是简单 heuristic）用于比较

## Eval pipeline checklist

1. 精确定义任务（不是“回答问题”，而是“将支持工单分类到 5 个类别中”）
2. 创建覆盖正常路径、边缘情况和已知 Regression 的测试用例
3. 选择 2-3 个适合任务类型的评分函数
4. 根据生产需求设置通过/失败阈值
5. 自动化执行：一个命令运行完整套件
6. 对所有内容做版本控制：测试用例、评分函数、prompts、模型版本
7. 在每次变更时运行：prompt 更新、模型替换、代码部署
8. 追踪趋势：单个分数是噪声，趋势线才是信号
9. 每季度对照人类判断进行校准
10. 每当发现生产失败时，添加 Regression 用例
