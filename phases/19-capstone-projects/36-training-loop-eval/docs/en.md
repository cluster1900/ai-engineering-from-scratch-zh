# Training Loop 与 Evaluation

> 不测量的 loop 就是在说谎。本课构建驱动 GPT 模型的 training loop：带 weight decay split 的 AdamW、warmup 加 cosine learning rate schedule、`calc_loss_batch` helper、在 held out data 上的 `evaluate_model` pass、每 K 步一次的 `generate_and_print_sample` 定性 probe，以及可在之后绘图的 JSONL loss log。同一个骨架可以训练你以后会构建的每一个 decoder LLM。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 lessons 30 到 35
**Time:** ~90 分钟

## Learning Objectives

- 构建一个 training loop，为 next token prediction 使用正确的 input 和 target alignment 来计算 cross entropy loss。
- 配置 AdamW，使 weight decay 应用于 weight tensors，而不应用于 LayerNorm 或 bias tensors。
- 实现带 linear warmup 和 cosine decay 的 learning rate schedule，并读取 LR 随时间的变化。
- 使用 `evaluate_model` 在 held out split 上评估，使 eval loss 可跨运行比较。
- 每 K 步用 `generate_and_print_sample` 生成一个定性 sample，以便在 loss curve 显示之前捕捉 divergence。
- 将每步 loss 持久化到 JSONL，以便重新加载、绘图，并把 training log 作为 deliverable 交付。

## The Problem

一个只打印 loss 而什么都不做的 training script 会在三方面失败。它无法告诉你 loss 是否因为正确的原因在下降（模型可能只是在训练集上 overfit，而从未真正学习）。它无法告诉你 divergence 是否正在开始（loss 可能 spike 一步后恢复，也可能 spike 一步后崩溃）。它无法告诉你模型学到了什么（loss 是一个 scalar；生成的 sample 是一段文字）。除非 loop 做测量，否则这三种失败都会被隐藏起来。

本课中的 loop 用三种方式测量。每一步在 training batch 上的 loss。每 K 步在 held out batch 上的 loss。每 K 步从固定 prompt 生成一个 continuation。training log 落在 JSONL 中，因此 artifact 就是这个 loop 的证词。

## The Concept

```mermaid
flowchart TB
  D[(Token tensor<br/>train + val)] --> B[Make batches<br/>input + target shift by one]
  B --> F[Forward<br/>logits]
  F --> L[Cross entropy<br/>flatten over batch and time]
  L --> Bw[Backward]
  Bw --> Cg[Clip grad norm]
  Cg --> Step[AdamW step]
  Step --> Sched[Cosine LR schedule]
  Sched --> JL[Append step record<br/>to losses.jsonl]
  JL --> Probe{Step is a probe step?}
  Probe -- yes --> Eval[evaluate_model on val]
  Probe -- yes --> Sample[generate_and_print_sample]
  Probe -- no --> Next[Next step]
  Eval --> Next
  Sample --> Next
```

两个不那么显然的部分是 loss alignment 和 AdamW decay split。

### Loss alignment

模型在每个位置预测下一个 token。如果 input batch 是 tokens `[t0, t1, t2, t3]`，那么 target batch 必须是 `[t1, t2, t3, t4]`。Cross entropy 在 flat shape `(batch * seq, vocab)` 上计算，并对照 flat target `(batch * seq,)`。忘记 shift，就会把模型训练成预测自身；这会收敛到零 loss，却学不到任何有用的东西。

### AdamW decay split

Weight decay 会 regularize weight tensors，但不会 regularize normalization scales 或 biases。把 decay 放在 LayerNorm scale 上，会慢慢把 scale 推向零，并破坏 normalization。把 decay 放在 bias 上在数学上无害，但浪费 cycles。标准 split 是：matrix shaped tensors（linear weights、embedding tables）使用 decay，任何看起来像 scale 或 shift 的参数都不使用。

### Warmup plus cosine schedule

Warmup 会在几百步内把 learning rate 从零 ramp 到目标值，让 Optimizer state 有时间填充。Cosine decay 会在剩余 steps 中把 learning rate 降回接近零，使最终阶段以较小 step size fine tune weights。这个组合是 open weights LLM training 中最常见的 schedule，因为它消除了前一千步和最后一千步中大多数脆弱时刻。

### Held out evaluation

`evaluate_model` 会从 validation split 运行固定数量的 batches，累积 loss，除以 batch count，然后返回。没有 Gradient。没有 dropout。在相同 seed 和相同 split 下，这个数字可跨运行复现。把 held out loss 与 training loss 并排报告，就是你发现 overfitting 的方式。

### Qualitative sampling as an early signal

一个 training loss 下降得很好、但 generated samples 全都是同一个 token 的模型是坏的。一个 loss curve 看起来平坦、但 generated samples 逐渐变成连贯单词的模型正在学习。定性 probe 比阅读完整曲线更快，并且能捕捉 scalar 会遗漏的模式。

## Build It

`code/main.py` 实现：

- `make_batches(token_ids, batch_size, context_length)`，将一个长 token tensor slice 成 input 和 target pairs。
- `calc_loss_batch(model, inputs, targets)`，执行 forward、flatten，并返回 scalar cross entropy。
- `evaluate_model(model, val_loader, max_batches)`，在 no grad 下迭代固定数量的 validation batches，并返回 mean loss。
- `generate_and_print_sample(model, prompt, max_new_tokens)`，在固定 prompt 上运行 lesson 35 的 generation function 并打印结果。
- `build_param_groups(model, weight_decay)`，生成两组 AdamW parameter list。
- `cosine_with_warmup(step, warmup_steps, total_steps, max_lr, min_lr)`，返回给定 step 的 LR。
- `train(...)`，运行 loop，持久化 `outputs/losses.jsonl`，并每 `eval_every` steps 打印 eval loss 和 sample。
- 一个 demo，在 synthetic data 上训练 tiny model 少量 steps，写入 JSONL log，并在 probe points 打印 eval loss 和 sample。这个 demo 在 CPU 上远低于一分钟即可完成。

运行它：

```bash
python3 code/main.py
```

输出：每步 loss 行、每个 probe step 的 eval loss、每个 probe step 的 generated sample，以及最终的 `outputs/losses.jsonl`，你可以用 `json.loads` 按行加载它。

## Stack

- `torch` 用于 autograd、Optimizer 和 modules。
- `main.py` 在本地重新实现 lesson 35 的 `GPTModel` 和支持 modules。

## Production patterns in the wild

三个模式会把 textbook loop 变成可以整夜运行的东西。

**Gradient norm clipping 不可协商。** 一个坏 batch（异常数据、LR spike、数值边界情况）会产生巨大 Gradient，抹掉数小时训练成果。在 `backward` 之后、`step` 之前调用 `torch.nn.utils.clip_grad_norm_(params, max_norm=1.0)`，可让 Optimizer 保持在安全范围内。clipping value 是一个自由参数；1 是大多数设置下都能撑住的默认值。

**可恢复的 JSONL logging，而不是 pickled state。** 将每步 loss records 作为 `{"step": int, "train_loss": float, "lr": float}` 行写入 JSONL 是耐用的：任何 crash 都会留下可读 artifact，你可以 grep，可以用三十行 Python 绘图，也可以通过读取最后一步来恢复训练。Pickled state 会把你绑定到生成该文件时的精确 module layout，这在 refactor 后很脆弱。

**Eval batches 来自固定 slice。** validation tokens 在 script 启动时被 slice 成 batches，而不是动态生成。可复现性依赖 eval batches 在每次运行中完全相同；否则比较两次运行的 eval loss，测到的 batch shuffle 可能和模型本身一样多。

## Use It

- 本课中的 loop 与在真实数据上训练 124M 模型的骨架相同。把 synthetic token tensor 换成 `datasets` 风格的 loader，loop 就能不变地运行。
- JSONL log 是把 training run 变成 evidence 的 deliverable。下一课会用一个这样的 log 来比较新训练 checkpoint 和 pretrained checkpoint。
- 定性 sample probe 是 scalar loss 无法替代的兜底检查。

## Exercises

1. 添加 `weight_decay_groups()` unit tests，确认 scale 和 bias parameters 落入 no decay group，而 linear 和 embedding weights 落入 decay group。
2. 用一个小文本文件中的 bytes 替换 synthetic random tokens，让 demo 在可读内容上训练。验证 generated sample 使用了文件中存在的 characters。
3. 为 cosine schedule 添加一个 `min_lr` floor，值为 `max_lr` 的 10%，并重新绘图。
4. 除 JSONL log 外，每 `eval_every` steps 保存一个 checkpoint。添加 `resume_from` flag 来重新加载 model state 和 Optimizer state。
5. 在 loss 旁边记录每步 throughput（tokens per second），并确认它保持在稳定区间。

## Key Terms

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Loss alignment | “Shift by one” | Input tokens 位于 positions 0..T-1，target tokens 位于 positions 1..T；cross entropy 在 flattened shapes 上计算 |
| Decay split | “Two groups” | AdamW 接收带 weight decay 的 matrix shaped tensors，以及不带 decay 的 scale 或 bias tensors |
| Warmup | “Ramp” | learning rate 在固定步数内从零爬升到目标值，让 Optimizer state 可以填充 |
| Eval batches | “Held out batches” | validation token tensor 的一个固定 slice，在 script 启动时 slice 一次，并在每个 probe 中相同使用 |
| Qualitative probe | “Sample print” | 每 K steps 从固定 prompt 打印一次短 generation，用于捕捉单靠 loss 会隐藏的 failure modes |

## Further Reading

- Phase 19 lesson 35，了解该 loop 驱动的模型。
- Phase 19 lesson 37，了解如何把 pretrained weights 加载到同一个模型中。
- Phase 10 lesson 04（pre training mini GPT），了解真实数据上的过程。
- Phase 10 lesson 10（evaluation），了解 cross entropy loss 之外更广的 eval surface。
