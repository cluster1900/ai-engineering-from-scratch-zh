---
name: prompt-sft-data-curator
description: 为 supervised fine-tuning 设计和策划 instruction datasets
version: 1.0.0
phase: 10
lesson: 6
tags: [sft, instruction-tuning, fine-tuning, data-curation, alignment]
---

# SFT 数据策展器

在为特定能力（code generation、math、conversation、safety）设计 instruction-tuning dataset 时，使用此框架来规划数据收集、定义质量标准，并组织训练 pipeline。

## 输入要求

提供：
- **目标能力**（例如，"Python code generation"、"medical Q&A"、"multi-turn conversation"）
- **Base model**（例如，Llama 3 8B、Mistral 7B、Qwen 2.5 72B）
- **预算**（标注小时数、用于 synthetic generation 的 API 成本）
- **格式偏好**（Alpaca、ShareGPT、ChatML）

## 步骤 1： Dataset 设计

### 规模指南

| 质量级别 | 所需示例数 | 预期结果 |
|--------------|----------------|------------------|
| Research prototype | 1,000-5,000 | LIMA 质量：如果示例由专家编写，可与更大数据集相当 |
| Production v1 | 10,000-50,000 | Stanford Alpaca 水平：在常见任务上具备可靠的 instruction following |
| Production v2 | 50,000-200,000 | Vicuna/Llama 2 Chat 水平：稳健的 multi-turn 和领域覆盖 |

质量永远胜过数量。1,000 个专家编写的示例（LIMA，2023 年 5 月）可匹配使用 50,000+ 示例训练的模型。优先考虑：

1. **多样性** -- 覆盖目标能力的完整范围
2. **准确性** -- 每个响应都必须事实正确
3. **清晰度** -- 响应应简洁且结构良好
4. **难度梯度** -- 包含简单、中等和困难示例

### 多样性检查清单

对于通用 assistant：
- 开放式问题（20%）
- 事实型 Q&A（20%）
- 创意写作（10%）
- Code generation（15%）
- Reasoning 和 math（15%）
- Summarization（10%）
- 带约束的 instruction following（10%）

根据领域特定模型调整百分比。coding assistant 可能会将 60% 分配给 code generation，20% 分配给 code explanation。

## 步骤 2： 数据格式

### Alpaca Format（single-turn）

```json
{
  "instruction": "Write a function that reverses a string in Python.",
  "input": "",
  "output": "def reverse_string(s):\n    return s[::-1]"
}
```

适用场景：single-turn 任务、简单的 instruction-response 对、快速 prototyping。

### ShareGPT Format（multi-turn）

```json
{
  "conversations": [
    {"from": "system", "value": "You are a Python expert."},
    {"from": "human", "value": "How do I reverse a string?"},
    {"from": "gpt", "value": "Use slicing: s[::-1]"},
    {"from": "human", "value": "What about for a list?"},
    {"from": "gpt", "value": "Same syntax works: my_list[::-1]"}
  ]
}
```

适用场景：conversational applications、multi-turn context 很重要。

### ChatML Format（带 special tokens）

```
<|im_start|>system
You are a Python expert.<|im_end|>
<|im_start|>user
How do I reverse a string?<|im_end|>
<|im_start|>assistant
Use slicing: s[::-1]<|im_end|>
```

适用场景：目标模型原生使用 ChatML（Qwen、Yi）。

## 步骤 3： 质量标准

### 单示例检查

1. **响应相关性**：响应是否真正回答了 instruction？
2. **事实准确性**：所有声明是否可验证且正确？
3. **完整性**：响应是否完整覆盖了 instruction？
4. **简洁性**：相同信息是否可以用更少文字表达？
5. **格式一致性**：响应是否遵循预期风格？

### 危险信号（拒绝该示例）

- 响应自相矛盾
- 响应包含有害内容且没有拒绝
- 响应 hallucinate 事实或引用
- Instruction 含糊不清，而响应没有澄清
- 响应只是对 instruction 的改写

### Dataset 级检查

- 来自任一单一来源/template 的示例不超过 5%
- 至少 80% 的 response tokens 是有意义的（不是 filler）
- 平均响应长度为 50-200 tokens（避免过短或过长）
- System prompt 多样性：至少包含 10 种不同的 system prompts

## 步骤 4： 训练配置

| 参数 | 推荐范围 | 备注 |
|-----------|------------------|-------|
| Learning rate | 1e-5 to 5e-5 | 较大模型使用较低值（70B 用 1e-5，7B 用 5e-5） |
| Epochs | 1-3 | 监控 validation loss，一出现上升迹象就停止 |
| Batch size | 32-128 | 如果受 GPU 限制，可用 gradient accumulation 扩展 |
| Warmup | 0-5% of steps | 不如 pre-training 阶段关键 |
| Weight decay | 0.0-0.1 | 对短 fine-tuning runs 可选 |
| Loss masking | 仅 response tokens | Mask instruction 和 system prompt tokens |
| Pre-training data mixing | 2-5% | 混入 raw text 以防止 catastrophic forgetting |

## 步骤 5： 评估协议

训练后，在以下方面评估：

1. **Instruction following rate**：模型生成相关、完整响应的 test prompts 百分比
2. **Forgetting score**：与 base model 相比，在 held-out 通用文本 corpus 上的 perplexity
3. **Format compliance**：遵循预期 chat format 的响应百分比
4. **MT-Bench 或 AlpacaEval**：instruction-tuned models 的标准 benchmarks
5. **Domain-specific eval**：针对目标能力的自定义评估

### 警示信号

- Validation loss 在 epoch 1 后上升：你正在 overfitting，减少 epochs 或增加数据
- Forgetting score 增加 > 15%：learning rate 过高或 epochs 过多
- 模型逐字复现训练示例：严重 overfitting，需要更多样化的数据
- 模型拒绝 benign instructions：在 safety data 上训练过度，重新平衡 dataset
