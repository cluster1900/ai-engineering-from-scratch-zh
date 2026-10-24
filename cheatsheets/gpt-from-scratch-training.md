---
id: gpt-from-scratch-training
title: Train and Load a GPT from Scratch
code: TL
subtitle: 构建 124M GPT，用 AdamW 和余弦预热训练，加载 GPT-2 权重，并为 pipeline 设门槛。
hue: 28
sources: phases/19-capstone-projects/35-gpt-model-assembly, phases/19-capstone-projects/36-training-loop-eval, phases/19-capstone-projects/37-loading-pretrained-weights, phases/19-capstone-projects/44-cosine-lr-warmup, phases/10-llms-from-scratch/13-building-complete-llm-pipeline
source_hash: 06e61dd1d80fe8c1
---

## 运行课程代码
type: command-table
from: phases/19-capstone-projects/35-gpt-model-assembly/docs/en.md, phases/19-capstone-projects/36-training-loop-eval/docs/en.md, phases/19-capstone-projects/37-loading-pretrained-weights/docs/en.md, phases/19-capstone-projects/44-cosine-lr-warmup/docs/en.md, phases/10-llms-from-scratch/13-building-complete-llm-pipeline/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 code/main.py`（35） | 统计 124M 参数，用极小配置生成文本 |
| `python3 code/main.py`（36） | 训练极小模型，写出 `outputs/losses.jsonl` |
| `python3 code/main.py`（37） | 写出 `outputs/gpt2-stub.safetensors` 并加载 |
| `python3 code/main.py`（44） | 20 步，打印每步 lr 和梯度范数，文本绘图 |
| `python code/main.py plan` | 校验 manifest、估算成本、打印 DAG |
| `python code/main.py run` | 执行各阶段，写出 `manifest.out.yaml` |
| `python code/main.py gate` | 应用评估门槛。打印 `SHIP` 或 `HOLD` |
| `build_param_groups(model, weight_decay)` | AdamW 参数组，衰减划分 |

## GPTConfig 默认值（124M）
type: defaults
from: phases/19-capstone-projects/35-gpt-model-assembly/code/main.py, phases/19-capstone-projects/35-gpt-model-assembly/docs/en.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| `vocab_size` | 50257 | token 表的行数 |
| `context_length` | 1024 | 位置表的行数 |
| `d_model` | 768 | Embedding 宽度 |
| `num_heads` | 12 | `d_model` 必须能被它整除 |
| `num_layers` | 12 | 十二个 `TransformerBlock` 模块 |
| `mlp_expansion` | 4 | MLP 隐藏层是 `d_model` 的 4 倍 |
| `dropout` | 0.1 | 极小演示设为 0.0 |
| `weight_tying` | True | `lm_head` 共享 `tok_embed` |

## GPTModel 前向
type: architecture
from: phases/19-capstone-projects/35-gpt-model-assembly/code/main.py, phases/19-capstone-projects/35-gpt-model-assembly/docs/en.md

```arch
node | ids | 1,1 | Token ids | shape B, T | client
node | tok | 2,1 | tok_embed | 50257, 768 | store
node | pos | 2,2 | pos_embed | 1024, 768 learned | store
node | add | 3,1 | Add | embed_dropout | process
node | blk | 4,1 | 12 blocks | pre-LN TransformerBlock | model
node | ln | 4,2 | final_ln | LayerNorm | process
node | head | 3,2 | lm_head | logits B, T, 50257 | model
edge | ids | tok | ids
edge | ids | pos | 0 to T-1
edge | tok | add |
edge | pos | add |
edge | add | blk |
edge | blk | ln |
edge | ln | head |
edge | head | tok | tied weight
```

## 构建、计数与采样
type: annotated-code
lang: python
from: phases/19-capstone-projects/35-gpt-model-assembly/code/main.py

```python
ref_model = GPTModel(GPTConfig())  # 124M reference
count_parameters(ref_model)  # unique params, tied once
GPTModel(GPTConfig(weight_tying=False))  # adds vocab_size * d_model
self.lm_head.weight = self.tok_embed.weight  # share, never copy
generate(tiny_model, prompt, max_new_tokens=12,
         temperature=0.8, top_k=20, seed=42)  # temperature must be positive
top_k_filter(logits, top_k)  # others to -inf
window = tokens[:, -model.cfg.context_length:]  # sliding window
```

## 一个训练步
type: flow
from: phases/19-capstone-projects/36-training-loop-eval/code/main.py, phases/19-capstone-projects/36-training-loop-eval/docs/en.md

1. **make_batches**：目标是输入右移一个位置。
2. **调度**：`cosine_with_warmup` 在每个参数组中设置 `group["lr"]`。
3. **calc_loss_batch**：前向，展平为 `(batch * seq, vocab)`，交叉熵。
4. **反向**：`loss.backward()`，然后以 `max_norm=1.0` 调用 `clip_grad_norm_`。
5. **AdamW**：`optimizer.step()`，带 `betas=(0.9, 0.95)`。
6. **记录**：把 `{"step", "train_loss", "lr"}` 追加到 `losses.jsonl`。
7. **探测**：每 `eval_every` 步运行 `evaluate_model` 和 `generate_and_print_sample`。

## 训练循环核心
type: annotated-code
lang: python
from: phases/19-capstone-projects/36-training-loop-eval/code/main.py

```python
optimizer = torch.optim.AdamW(
    build_param_groups(model, cfg.weight_decay),  # decay split
    lr=cfg.max_lr, betas=(0.9, 0.95))
for step in range(cfg.num_steps):
    lr = cosine_with_warmup(step, cfg.warmup_steps, cfg.num_steps, cfg.max_lr, cfg.min_lr)
    for group in optimizer.param_groups:
        group["lr"] = lr
    inputs, targets = next(train_loader)
    optimizer.zero_grad(set_to_none=True)
    loss = calc_loss_batch(model, inputs, targets)  # flat cross entropy
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=cfg.grad_clip)
    optimizer.step()
```

## 调度与规模数字
type: concepts
from: phases/19-capstone-projects/44-cosine-lr-warmup/docs/en.md, phases/19-capstone-projects/35-gpt-model-assembly/docs/en.md, phases/10-llms-from-scratch/13-building-complete-llm-pipeline/docs/en.md

- **预热**：`lr_max * step / warmup_steps`，直到 `warmup_steps`。
- **余弦**：`lr_min + 0.5 * (lr_max - lr_min) * (1 + cos(pi * progress))`。
- **下限**：超过 `total_steps` 后学习率保持在 `lr_min`。
- **预热长度**：总步数的一部分。通常为 1 到 3 percent。
- **下限大小**：`lr_min` 取 `lr_max` 的 10 percent，让优化器继续学习。
- **权重共享**：节省 50257 乘 768 = 38 百万个参数。
- **残差初始化**：输出投影按 `1 / sqrt(2 * num_layers)` 缩放。
- **预训练 FLOPs**：6 x 参数量 x token 数。

## GPT-2 名称到本地名称
type: comparison
span: 2
from: phases/19-capstone-projects/37-loading-pretrained-weights/docs/en.md, phases/19-capstone-projects/37-loading-pretrained-weights/code/main.py

| 因素 | GPT-2 文件 | 本地模型 |
|---|---|---|
| Token embedding | `wte.weight` | `tok_embed.weight` |
| Position embedding | `wpe.weight` | `pos_embed.weight` |
| LayerNorm 1 缩放 | `h.N.ln_1.weight` | `blocks.N.ln1.scale` |
| 融合 QKV，需转置 | `h.N.attn.c_attn.weight` | `blocks.N.attn.qkv.weight` |
| 注意力输出，需转置 | `h.N.attn.c_proj.weight` | `blocks.N.attn.out_proj.weight` |
| MLP fc1，需转置 | `h.N.mlp.c_fc.weight` | `blocks.N.mlp.fc1.weight` |
| MLP fc2，需转置 | `h.N.mlp.c_proj.weight` | `blocks.N.mlp.fc2.weight` |
| 最终 LayerNorm | `ln_f.weight`、`ln_f.bias` | `final_ln.scale`、`final_ln.shift` |

## 加载 safetensors 权重
type: annotated-code
lang: python
from: phases/19-capstone-projects/37-loading-pretrained-weights/code/main.py

```python
make_stub_safetensors(STUB_PATH, cfg, seed=42)  # offline fixture
model = GPTModel(cfg)
report = load_safetensors(model, STUB_PATH, verbose=False)
report.summary()  # loaded= missing= unexpected= shape_mismatch=
report.ok()  # no missing, no shape_mismatch
model.lm_head.weight.data_ptr() == model.tok_embed.weight.data_ptr()  # tied
```

## 故障排查
type: troubleshooting
from: phases/19-capstone-projects/36-training-loop-eval/docs/en.md, phases/19-capstone-projects/37-loading-pretrained-weights/docs/en.md, phases/19-capstone-projects/44-cosine-lr-warmup/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 损失接近零，模型什么也没学到 | 没有右移一位 | 目标取位置 1..T |
| LayerNorm 缩放趋于零 | 对缩放做了权重衰减 | 缩放和 bias 放入不衰减组 |
| 一个坏 batch 毁掉数小时训练 | 梯度巨大 | 在 `step` 之前调用 `clip_grad_norm_` |
| 加载前后样本相同 | 名称映射漏掉了所有张量 | 阅读 `LoadReport` |
| 报告中出现 `shape_mismatch` | 维度与配置不同 | 加载器什么也没赋值。修正配置 |
| 运行后期学习率差一步 | 拼接的三段式调度 | 用一个关于 `step` 的函数，测试边界 |

## Pipeline 评估门槛
type: defaults
from: phases/10-llms-from-scratch/13-building-complete-llm-pipeline/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `mmlu` | 65.0 | 必须至少为此值 |
| `humaneval` | 40.0 | 必须至少为此值 |
| `truthfulqa` | 50.0 | 必须至少为此值 |
| `safety_refusal_rate` | 0.05 | 必须至多为此值 |
| `kl_from_reference` | 25.0 | 必须至多为此值 |
| `cost_total_usd` | 50000.0 | 必须至多为此值 |
| `budget_usd` | 50000.0 | 超出预算时运行停止 |
| `seed` | 42 | Manifest 字段 |

## 问答
type: qa
from: phases/19-capstone-projects/37-loading-pretrained-weights/docs/en.md, phases/19-capstone-projects/36-training-loop-eval/docs/en.md, phases/19-capstone-projects/44-cosine-lr-warmup/docs/en.md

- **为什么加载时要转置？** `c_attn`、`c_proj` 和 `c_fc` 使用 conv1d 布局。`nn.Linear` 需要转置后的形式。
- **为什么训练中要打印样本？** 损失是标量。样本能暴露卡在同一个 token 上的模型。
- **为什么评估 batch 只切一次？** 相同的 batch 让评估损失在不同运行间可比。
- **调度从哪里读取步数？** 从 checkpoint 中的 `global_step` 读取，而不是本地计数器。
