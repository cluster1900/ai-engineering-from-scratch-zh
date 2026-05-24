---
name: skill-freeze-inspector
description: 报告哪些 parameters 是 trainable、哪些 BatchNorm layers 处于 eval mode，以及 optimizer 是否真的在使用 trainable parameters
version: 1.0.0
phase: 4
lesson: 5
tags: [computer-vision, transfer-learning, debugging, pytorch]
---

# Freeze Inspector

Transfer-learning bugs 通常隐藏在三个地方：本应 frozen 却没有 frozen 的 parameters、本应 trainable 却没有 trainable 的 parameters，以及在 freeze state 改变之前就已构建的 optimizers。此 skill 会一次性暴露这三类问题。

## 使用时机

- 在对一部分 parameters 设置 `requires_grad` 后立即使用。
- 在 fine-tune run 的第一个 training step 之前使用。
- 在调用 `freeze_bn_stats` 或任何会切换 BN mode 的 helper 后使用。
- 当 val accuracy 卡在随机水平，并且你怀疑实际上没有任何内容在 training 时使用。

## 输入

- `model`: 一个 PyTorch `nn.Module`。
- `optimizer`: 即将用于 training 的 optimizer。
- 可选 `expected_frozen_prefixes`: 应该被冻结的 parameter-name prefixes 列表（例如 `["conv1", "bn1", "layer1"]`）。

## 步骤

1. **遍历 parameters。** 对每个 `(name, param)`：
   - 记录 `requires_grad`
   - 记录 `shape` 和 `numel`

2. **遍历 modules。** 对每个 module：
   - 如果它是 BatchNorm，记录它是否处于 eval mode，以及它的 affine parameters 是否 trainable。

3. **检查 optimizer。** 对每个 parameter group：
   - 将其 `params` 展平为一组 `id(p)`。
   - 与所有 `requires_grad == True` 的 params 的 `id(p)` 集合进行比较。

4. **检测四种 failure modes：**
   - `leaked_train`: param 的 `requires_grad=True`，但没有出现在 optimizer 中（gradient 会被计算，但永远不会应用）。
   - `ghost_train`: param 出现在 optimizer 中，但 `requires_grad=False`（optimizer state 被浪费；如果稍后重新启用 requires_grad，也可能导致 bugs）。
   - `bn_mismatch`: 要么 (a) BN layer 处于 train mode（累积 running stats），而它的 affine parameters（`weight`、`bias`）被冻结；要么 (b) BN layer 处于 eval mode（frozen stats），而它的 affine parameters 是 trainable。这两种状态都不一致，几乎总是 bug。
   - `expected_vs_actual`: `expected_frozen_prefixes` 中列出的任何 prefix 仍然有 trainable parameter。

## 报告

```
[freeze-inspector]
  model trainable params: <N>
  model frozen params:    <N>
  batchnorm layers in eval mode: <count>
  batchnorm layers in train mode: <count>

[optimizer coverage]
  trainable params fed to optimizer: <M> of <N>
  leaked_train: <list of names> (trainable but not in optimizer)
  ghost_train:  <list of names> (in optimizer but frozen)

[bn audit]
  mismatched layers: <list of names>

[expectations]
  expected_frozen_prefixes: <...>
  violating params:         <list>

[verdict]
  ok | <one-line summary of the most severe issue>
```

## 规则

- 只报告 parameter names；绝不要打印 weights 本身。
- 按 parameter name 的字母顺序排序每个列表。
- 如果 optimizer coverage 为 100%，且没有 mismatches，则返回 `ok` 并停止。
- 对于 `leaked_train`，始终建议在 freeze state 改变后重建 optimizer。
- 对于 `ghost_train`，建议移除 parameter group，或在意图是训练它时设置 `requires_grad=True`。
