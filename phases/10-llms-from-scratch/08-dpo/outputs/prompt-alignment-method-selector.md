---
name: prompt-alignment-method-selector
description: 为你的 use case 选择合适的 alignment method（SFT, RLHF, DPO, KTO, ORPO, SimPO）
version: 1.0.0
phase: 10
lesson: 8
tags: [alignment, dpo, rlhf, kto, orpo, simpo, preference-optimization, fine-tuning]
---

# Alignment Method 选择器

为 language model 选择 alignment method 时，使用这个框架评估你的 data、compute 和 quality requirements，然后选择最符合你约束的方法。

## 输入要求

提供：
- **Base model**（例如 Llama 3 8B, Mistral 7B, Qwen 2.5 72B）
- **Starting point**（base model，还是已经 SFT'd？）
- **Available data**（instruction pairs、preference pairs、unpaired ratings，或没有）
- **Compute budget**（GPU hours、GPU 数量）
- **Quality target**（prototype 足够好、能与 open-source 竞争、state-of-the-art）
- **Timeline**（天、周、月）

## 决策 Matrix

### 快速选择

| 你的情况 | 推荐方法 | 原因 |
|---------------|-------------------|-----|
| 没有 preference data，只有 instruction pairs | 仅 SFT | 没有 preference signal 就无法 alignment |
| < 5,000 preference pairs，compute 有限 | DPO | Pipeline 更简单，小数据下效果很好 |
| Unpaired feedback（只有 thumbs up/down） | KTO | 唯一不需要 pairwise comparisons 也能工作的方法 |
| 想在单次 training run 中完成 alignment | ORPO | 结合 SFT + alignment，不需要 reference model |
| 内存受限（放不下 reference model） | SimPO | 不需要 reference model |
| 大规模、多目标 alignment | RLHF (PPO) | 独立 reward model 可以捕捉复杂 preferences |
| 使用 online data 进行迭代 alignment | RLHF (PPO) | 可以在循环中 generate、rate、retrain |
| Post-RLHF refinement | DPO | 在 targeted preferences 上 fine-tune RLHF model |

### 详细比较

| Method | Data Requirement | Models in Memory | Training Loops | Stability | Best Scale |
|--------|-----------------|-----------------|----------------|-----------|------------|
| SFT | Instruction pairs (10K+) | 1 | 1 | 高 | 任意 |
| RLHF | Preference pairs (20K+) | 3-4 | 3 | 低 | 大型 (70B+) |
| DPO | Preference pairs (5K+) | 2 | 2 (SFT + DPO) | 高 | 小到中型 (7B-70B) |
| KTO | Unpaired ratings (5K+) | 2 | 2 (SFT + KTO) | 高 | 任意 |
| ORPO | Preference pairs (10K+) | 1 | 1 | 高 | 小到中型 |
| SimPO | Preference pairs (5K+) | 1 | 2 (SFT + SimPO) | 高 | 小到中型 |

## 各方法配置

### SFT

- **何时停止**：1-3 个 epochs 后，或 validation loss 停止下降时
- **关键 hyperparameter**：Learning rate（1e-5 到 5e-5，model 越大越低）
- **关键细节**：在 loss 中 mask instruction tokens
- **Gotcha**：超过 3 个 epochs 会导致记忆化；混入 2-5% pre-training data

### RLHF (PPO)

- **何时使用**：你有 20K+ comparison pairs，需要多目标 alignment，或想要迭代式 online learning
- **关键 hyperparameters**：KL coefficient（0.01-0.05）、PPO clip ratio（0.1-0.3）、learning rate（5e-6 到 3e-5）
- **关键细节**：Reward model 应该 >= policy model size
- **Gotcha**：PPO 不稳定；持续监控 KL divergence 和 reward curves

### DPO

- **何时使用**：你有 preference pairs，并且想要比 RLHF 更简单的 pipeline
- **关键 hyperparameter**：Beta（0.1-0.5；越低 = 允许越偏离 reference）
- **关键细节**：Reference model 必须是 SFT checkpoint 的 frozen copy
- **Gotcha**：对 beta 非常敏感；在 [0.05, 0.1, 0.2, 0.5] 上做 sweep

### KTO

- **何时使用**：你只有 “good” 或 “bad” labels，没有 pairwise comparisons
- **关键 hyperparameter**：Beta（同 DPO）、loss aversion multiplier（对 bad responses 使用 1.5x）
- **关键细节**：需要大致平衡的 good/bad examples（40-60% split）
- **Gotcha**：没有 pairs 时，gradient signal 更弱；可能需要比 DPO 更多的数据

### ORPO

- **何时使用**：你想完全跳过 SFT，直接从 base 到 aligned
- **关键 hyperparameter**：Lambda（preference term 相对于 SFT term 的权重）
- **关键细节**：需要在一个 dataset 中同时包含 instruction labels 和 preference pairs
- **Gotcha**：Combined objective 可能难以平衡；如果 SFT loss 占主导，alignment 会很弱

### SimPO

- **何时使用**：内存受限，无法持有 reference model 的设置
- **关键 hyperparameter**：Beta、gamma（length normalization exponent）
- **关键细节**：Length normalization 防止 model 偏好短 responses
- **Gotcha**：没有 reference model anchor，model 可能漂移更远；需要仔细监控

## Pipeline 模板

### Template 1: 快速 Prototype（1-2 天）

```
Base Model -> SFT (1 epoch, 10K examples) -> DPO (3 epochs, 5K pairs)
```

Compute：7B model 在 A100 上约 4 GPU-hours  
Quality：扎实的 instruction following，基础 preference alignment

### 模板 2: Production Quality（1-2 周）

```
Base Model -> SFT (2 epochs, 50K examples) -> DPO (5 epochs, 20K pairs) -> Eval -> Iterate
```

Compute：7B 约 40 GPU-hours，70B 约 200 GPU-hours  
Quality：可与 open-source RLHF models 竞争

### 模板 3: State-of-the-Art（1-3 个月）

```
Base Model -> SFT (2 epochs, 100K+ examples) -> RLHF (PPO, 50K+ pairs) -> DPO (targeted refinement) -> Eval -> Iterate
```

Compute：70B 约 500+ GPU-hours  
Quality：接近 frontier model alignment

### 模板 4: 最小数据 (1-2 天)

```
Base Model -> SFT (1 epoch, 5K examples) -> KTO (unpaired thumbs up/down from users)
```

Compute：7B 约 2 GPU-hours  
Quality：在最小数据收集开销下优于 SFT-only

## Evaluation Protocol

Alignment 后，从这些维度评估：

1. **Preference win rate**：在 200+ test prompts 上使用 human judges 比较 aligned model 与 SFT model。目标：> 60% win rate。
2. **Benchmark retention**：MMLU、HumanEval，或 domain-specific benchmarks。相对 SFT baseline 不应下降 > 5%。
3. **MT-Bench or AlpacaEval**：标准 alignment quality benchmarks。与已发布 baselines 比较。
4. **Safety evaluation**：针对 adversarial prompts、jailbreaks 和 harmful request categories 进行测试。
5. **Response diversity**：测量 100 个 prompts 的 responses entropy。低 entropy = mode collapse。

## 常见 Failure Modes

| Symptom | Cause | Method-Specific Fix |
|---------|-------|-------------------|
| 冗长、填充式 responses | Reward model / implicit reward 偏好长度 | DPO：增加 beta。RLHF：添加 length penalty。SimPO：调整 gamma。 |
| Model 对所有事都表示同意 | Preference data bias 导致 sycophancy | 添加 preference pairs，其中正确 response 与 user 不一致 |
| 拒绝良性 requests | 对 safety data 过度 alignment | 降低 safety example 比例，添加更多 benign-refusal pairs |
| Outputs 几乎与 SFT 相同 | Beta 过高（DPO/KTO）或 KL coefficient 过高（PPO） | 降低 beta / KL coefficient；model 没有在学习 |
| Training loss oscillates | Learning rate 太高或数据不足 | 将 lr 降低 2-3x；增加 preference data |
