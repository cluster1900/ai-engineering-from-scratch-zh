---
name: prompt-reward-model-designer
description: 设计用于 RLHF alignment 的 reward model training pipelines
version: 1.0.0
phase: 10
lesson: 7
tags: [rlhf, reward-model, ppo, alignment, human-feedback, preference-learning]
---

# Reward Model 设计器

在构建 RLHF pipeline，将语言模型向目标行为（helpfulness、coding ability、safety、honesty）对齐时，使用这个框架来设计数据收集协议、训练 reward model，并配置 PPO。

## 输入要求

提供：
- **目标行为**（例如，“helpful and harmless assistant”、“expert Python coder”、“带有安全性的 medical Q&A”）
- **Base model**（例如，SFT 后的 Llama 3 8B、Mistral 7B Chat）
- **Reward model 大小**（通常与 policy model 相同大小或更大）
- **标注预算**（可用的人类小时数或 comparison pairs）
- **计算预算**（用于 reward model training + PPO 的 GPU 小时数）

## 步骤 1: Preference Data 收集

### 标注协议

1. **Prompt selection**：从 SFT 训练分布中采样，并加入 out-of-distribution prompts（10-20% 新颖样本）
2. **Response generation**：使用 SFT model，以不同 temperatures（0.3、0.7、1.0）为每个 prompt 生成 2-4 个 responses
3. **Comparison format**：向标注者只展示 2 个 responses，并询问“哪个 response 更好？”
4. **Criteria rubric**：为你的使用场景定义“更好”是什么意思

### Rubric Template

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Helpfulness | 40% | 它是否完整且正确地回答了问题？ |
| Harmlessness | 25% | 它是否避免有害、有偏见或误导性的内容？ |
| Honesty | 20% | 它是否承认不确定性，而不是 hallucinate？ |
| Conciseness | 15% | 这个 response 的长度是否适合该问题？ |

根据你的使用场景调整权重。一个 coding assistant 可能会把 correctness 权重设为 60%，conciseness 设为 20%。

### 数据规模指南

| Scale | Comparison Pairs | Annotator Hours | Expected RM Accuracy |
|-------|-----------------|-----------------|---------------------|
| Minimum viable | 5,000-10,000 | 400-800 | 60-65% |
| Production v1 | 20,000-50,000 | 1,600-4,000 | 65-72% |
| Production v2 | 100,000-500,000 | 8,000-40,000 | 72-78% |

InstructGPT 使用了来自 40 名承包商的 33,000 个 comparisons。Anthropic 的初始论文使用了来自 20 名标注者的 22,000 个。Inter-annotator agreement 通常为 70-75% -- reward model 无法超过人类一致性水平。

### Quality Control

- **Agreement filtering**：丢弃少于 70% 标注者同意的 pairs
- **Annotator calibration**：在真实标注前，用 known-good pairs 运行 calibration rounds
- **Bias detection**：监控标注者是否持续偏好更长的 responses、正式语言或特定模式
- **Adversarial examples**：包含 5-10% 专门设计的样例，用来发现没有认真阅读的标注者

## 步骤 2: Reward Model 架构

### 架构决策

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Base architecture | 与 policy 相同的 transformer | 来自 SFT checkpoint 的权重初始化提供强起点特征 |
| Output head | 从最后 hidden state 到单个 linear projection | 从最完整的位置表示得到 scalar reward |
| Model size | >= policy model size | 更小的 RM 会产生不可靠信号，导致 PPO 不稳定 |
| Initialization | 带有新 output head 的 SFT checkpoint | Pre-trained features 已经捕获语言质量 |

### 训练配置

| Parameter | Range | Notes |
|-----------|-------|-------|
| Learning rate | 1e-5 to 5e-5 | 低于 SFT，因为任务更简单 |
| Epochs | 1-3 | 在 comparison data 有限时，过拟合是主要风险 |
| Batch size | 64-256 | 每个“example”是一个 pair，因此有效数据是 2x |
| Loss function | Bradley-Terry: -log(sigmoid(r_preferred - r_rejected)) | pairwise comparisons 的标准做法 |
| Validation split | 10-20% | 在 held-out pairs 上监控 accuracy |

### Evaluation Metrics

1. **Pairwise accuracy**：RM 正确排序 held-out preference pairs 的比例是多少？目标：> 65%
2. **Margin distribution**：绘制 (r_preferred - r_rejected) 的分布。它应该以 0 以上为中心，且只有少量负值。
3. **Calibration**：sigmoid(r_preferred - r_rejected) 是否接近实际 human preference probability？
4. **OOD generalization**：在不同于训练分布的 prompts 上测试。Accuracy 下降应 < 10%。

## 步骤 3： PPO Configuration

### Hyperparameters

| Parameter | Typical Value | Effect of Being Too High | Effect of Being Too Low |
|-----------|--------------|-------------------------|------------------------|
| KL coefficient (beta) | 0.01-0.05 | 模型几乎学不到东西，过于接近 SFT | Reward hacking，退化输出 |
| Learning rate | 5e-6 to 3e-5 | 训练不稳定，发散 | 收敛缓慢，浪费计算 |
| Clip ratio (epsilon) | 0.1-0.3 | 更新幅度大，可能破坏稳定性 | 更新非常保守，学习缓慢 |
| PPO epochs per batch | 1-4 | 对当前 batch 过拟合 | 没有充分利用每个 batch |
| Generation batch size | 128-512 | 内存问题 | Gradient estimates 噪声大 |
| Max response length | 256-1024 | 生成缓慢，内存问题 | 截断有用的 responses |

### Monitoring Dashboard

在 PPO 训练期间跟踪这些 metrics：

1. **Mean reward**：训练过程中应增加。Plateau 可以接受；下降意味着不稳定。
2. **KL divergence**：应保持在 10-20 nats 以下。Spike = reward hacking。
3. **Response length**：应保持稳定。单调增加 = verbosity reward hacking。
4. **Entropy**：Token 分布 entropy 应缓慢下降。快速下降 = mode collapse。
5. **Reward model agreement**：使用 reward model 为 PPO responses 打分；agreement 应该提升。

### PPO 期间的 Red Flags

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Reward 增加但输出变差 | Reward hacking | 增大 KL coefficient，在 adversarial examples 上重新训练 RM |
| KL divergence 爆炸 | Learning rate 太高或 KL coefficient 太低 | 降低 lr，增大 beta |
| Response length 单调增长 | RM 奖励 verbosity | 给 reward 添加 length penalty，用 length-controlled pairs 重新训练 RM |
| 所有 responses 变得相同 | Mode collapse | 提高 generation temperature，减少 PPO epochs |
| Reward 剧烈振荡 | PPO 不稳定 | 降低 learning rate，增大 clip ratio |

## 步骤 4: End-to-End Validation

在部署 RLHF-trained model 之前：

1. **A/B test vs SFT**：在 200+ test prompts 上运行 SFT 和 RLHF models。让 3+ 位评估者比较 responses。RLHF model 的胜率应 > 60%。
2. **Safety evaluation**：在已知 adversarial prompts（jailbreaks、有害请求）上测试。RLHF model 应适当地拒绝。
3. **Regression check**：运行标准 benchmarks（MMLU、HumanEval、MT-Bench），确认 RLHF model 没有丢失核心能力。
4. **Forgetting check**：在通用 text corpus 上测量 perplexity。相对于 SFT model，增加应 < 10%。
5. **Length analysis**：比较 SFT 和 RLHF models 的平均 response length。如果 RLHF 长度 > 50%，reward model 很可能存在 verbosity bias。
