---
name: skill-fine-tuning-guide
description: 使用 LoRA 和 QLoRA 对 LLMs 进行 fine-tune 的时机与方法决策树
version: 1.0.0
phase: 11
lesson: 8
tags: [fine-tuning, lora, qlora, peft, llm-engineering]
---

# Fine-Tuning 决策指南

在进行 fine-tuning 之前，按顺序先尝试这些方法：

```
1. Prompt engineering (minutes, $0)
2. Few-shot examples in prompt (minutes, $0)
3. RAG for knowledge retrieval (days, $10-100/month)
4. Fine-tuning with LoRA/QLoRA (days, $5-50 per experiment)
5. Full fine-tuning (weeks, $100-10,000 per run)
```

只有当前一步在可衡量的意义上不够好时，才进入下一步。

## 什么时候进行 fine-tune

- Model 需要一致的输出风格或格式，而 prompting 无法实现
- 你正在 distill 一个更大的 model（从 8B model 获得 GPT-4 质量）
- Latency 很重要，而 few-shot examples 会增加太多 Token
- 你需要 model 可靠地遵循复杂 reasoning pattern
- 你有 1,000+ 个高质量示例，展示期望的 input-output 行为

## 什么时候不要进行 fine-tune

- 使用正确 prompt 时，model 已经能完成你想要的任务
- 你需要 model 知道事实（改用 RAG）
- 你的 training examples 少于 500 个（很可能 overfit）
- 任务频繁变化（retraining 成本高）
- 你需要审计哪些 data 影响了某个特定 output（fine-tuning 是 black box）

## 方法选择

| GPU VRAM | 7B model | 13B model | 70B model |
|----------|----------|-----------|-----------|
| 16GB (T4) | QLoRA | 不可行 | 不可行 |
| 24GB (3090/4090) | QLoRA 或 LoRA | QLoRA | 不可行 |
| 40GB (A100) | LoRA 或 Full | QLoRA 或 LoRA | QLoRA |
| 80GB (A100/H100) | Full | LoRA 或 Full | QLoRA 或 LoRA |

## LoRA 配置 checklist

1. 从 r=16, alpha=32 开始（适合大多数任务的安全默认值）
2. 首先 target q_proj 和 v_proj（minimum viable LoRA）
3. QLoRA 使用 learning rate 2e-4，LoRA fp16 使用 5e-5
4. 设置 lora_dropout=0.05
5. 训练 1-3 epochs（更多会增加 overfitting 风险）
6. 每 100 steps 在 held-out set 上评估一次
7. 保存 checkpoints，并根据 eval loss 选择最佳版本

## 常见错误

- 训练太多 epochs（小 datasets 在 epoch 2-3 之后容易 overfit）
- 使用与 full fine-tuning 相同的 learning rate（LoRA 需要更高的 LR）
- 忘记设置 pad token（会导致 Llama models 出现 NaN losses）
- 没有冻结 base model（违背 LoRA 的目的）
- 只在 training data 上评估（始终留出 10-20% 用于 eval）
- 跳过 prompt engineering baseline（对 prompting 已经能解决的问题进行 fine-tuning）

## 质量验证

训练后，在 200+ held-out examples 上比较：
1. 使用最佳 prompt 的 base model（baseline）
2. 使用 LoRA adapter 的 base model（你的 fine-tuned model）
3. 使用相同 prompt 的 GPT-4 或 Claude（ceiling）

如果 LoRA model 没有超过 prompted baseline，需要改进的是你的 training data 或配置，而不是增加 compute。

## Adapter 管理

- 对于 multi-task serving，保持 adapters 分离（按 request 切换 adapters）
- 对于 single-task deployment，将 adapters merge 到 base weights 中
- 将 adapters 存储在 Hugging Face Hub（10-100MB，易于 version 和分享）
- 部署前测试 merged model outputs 是否与 unmerged outputs 匹配
- 使用 TIES-Merging 或 DARE 将多个 adapters 合并为一个

## Debugging training

如果 loss 没有下降：
1. 检查 learning rate（对 LoRA 来说太低，尝试 2e-4）
2. 验证 LoRA layers 是否实际接收到了 Gradients
3. 确认 base model weights 已被冻结
4. 检查 data formatting（Tokenizer 必须匹配 model 期望的格式）

如果 loss 下降但 eval quality 很差：
1. Training data quality 问题（garbage in, garbage out）
2. Overfitting（减少 epochs、增加 dropout、添加更多 data）
3. Target modules 错误（为复杂任务添加 MLP layers）
4. Rank 太低（尝试 r=32 或 r=64）
