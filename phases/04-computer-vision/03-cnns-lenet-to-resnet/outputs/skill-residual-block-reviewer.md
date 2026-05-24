---
name: skill-residual-block-reviewer
description: 审查 PyTorch residual block 的 skip-connection 正确性、BN 位置、activation 顺序和 shape 对齐
version: 1.0.0
phase: 4
lesson: 3
tags: [computer-vision, resnet, code-review, pytorch]
---

# Residual Block Reviewer

一个专注的 reviewer，用于审查任何声称实现 residual block 的 PyTorch `nn.Module`。它会抓出几乎所有出错的 ResNet 重写中最常见的四类问题。

## 何时使用

- 有人编写了自定义 BasicBlock 或 Bottleneck，而 Loss 变成 NaN 或 accuracy 卡住。
- 你正在把一个 block 从一个 framework 移植到另一个 framework，并想验证等价性。
- 你正在 review 一个修改 ResNet 内部结构的 PR（pre-activation、squeeze-excite、anti-alias）。
- 一个模型在 CIFAR-sized input 上运行正常，但在 ImageNet resolution 上崩溃，因为 shortcut 是错的。

## 输入

- 一个 PyTorch class definition，可以是 source text，也可以是 importable path。
- 可选 `variant`: `basic` | `bottleneck` | `preact` | `seblock`。

## 四项检查

### 1. Shortcut shape 对齐

对于任何 `stride != 1` 或 `in_channels != out_channels` 的 block，shortcut path **必须**是 shape-matching module，通常是 1x1 conv 加 BN。在这种情况下使用裸 `nn.Identity()`，forward 时必然会出现 shape-mismatch error。

Diagnostic:
```
[shortcut]
  detected:  nn.Identity | 1x1 Conv + BN | 1x1 Conv + BN + ReLU | other
  required:  shape-matching Conv if (stride != 1 or in_c != out_c) else Identity
  verdict:   ok | wrong | unnecessarily heavy
```

### 2. BN 相对于 addition 的位置

addition `out + shortcut(x)` 必须发生在最终 ReLU **之前**（post-activation，原始 ResNet），或者完全没有最终 ReLU（pre-activation ResNet v2）。如果一个 block 在 main branch 中应用 ReLU，然后再加上 raw shortcut，会产生不对称的 activation range，从而损害训练。

Diagnostic:
```
[activation order]
  pattern:  post-act (conv-BN-ReLU-conv-BN-add-ReLU) | pre-act (BN-ReLU-conv-BN-ReLU-conv-add) | other
  verdict:  ok | suspect
```

### 3. Conv layer 上的 bias

后面紧跟 BatchNorm 的 conv 应该设置 `bias=False`。BN 的 beta 已经参数化了 bias，因此额外的 conv bias 会浪费参数，并可能减慢收敛。

Diagnostic:
```
[bias]
  convs with BN and bias=True: <count>
  recommended fix: set bias=False on those layers
```

### 4. In-place ReLU 和 autograd

在会被加到 shortcut 上的 tensor 上使用 `nn.ReLU(inplace=True)`，会覆盖 residual add 可能仍然需要的值。标记任何在 add 之前没有跟随会产生新 tensor 的 layer 的 `inplace=True`。

Diagnostic:
```
[in-place]
  risky inplace ops: <list>
  fix: inplace=False before the residual add
```

## 报告

```
[block-review]
  variant:       basic | bottleneck | preact | se | other
  shortcut:      ok | wrong | heavy
  activation:    ok | suspect
  bias-bn:       ok | <N> convs need bias=False
  in-place:      ok | <N> risky ops
  summary:       one sentence
```

## 规则

- 不要重写 block。只报告。
- 如果 block 是正确的，所有位置都写 `ok`，然后停止。不要给建议。
- 如果有多个问题，按上面的顺序列出（shortcut 最先，因为它是最常见的崩溃原因）。
- 当用户已指定某个 deliberate pre-activation 或 squeeze-excite variant 时，绝不要将其标记为错误。
