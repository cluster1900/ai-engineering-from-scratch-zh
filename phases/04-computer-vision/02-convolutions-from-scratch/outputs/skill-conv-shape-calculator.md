---
name: skill-conv-shape-calculator
description: 逐层遍历 CNN 规格，并报告每个 block 的输出形状、感受野和参数量
version: 1.0.0
phase: 4
lesson: 2
tags: [computer-vision, cnn, architecture, debugging]
---

# Conv 形状计算器

一个用于规划或调试 CNN 的确定性辅助工具。给定输入形状和一组 layer spec，无需运行模型即可追踪形状、感受野和参数量。

## 何时使用

- 设计新的 CNN，并想验证每次 downsample 都落在干净的尺寸上。
- 阅读论文，并将其 architecture table 翻译成代码。
- pretrained backbone 在 classifier head 处因 shape mismatch 崩溃，而你需要知道是哪一层改变了空间尺寸。
- 在训练任一 backbone 之前，比较两个 backbone 的参数效率。

## 输入

- `input_shape`: `(C, H, W)`。
- `layers`: 有序的 layer dict 列表。每个支持：
  - `{type: "conv", c_out, k, s, p, groups=1, bias=true}`
  - `{type: "pool", mode: "max"|"avg", k, s, p=0}`
  - `{type: "adaptive_pool", out_h, out_w}`
  - `{type: "flatten"}`
  - `{type: "linear", out_features, bias=true}`

## 步骤

1. **初始化 trace**，包含 `(C, H, W)`、感受野 `1`、effective stride `1`、累计参数 `0`。

2. **对每一层**，按以下顺序更新：
   - 计算 `C_out`（conv/linear），或将 `C_in` 传递下去（pool）。
   - 使用 `(H + 2P - K) / S + 1` 计算 conv 和 pool 的空间输出，使用 `out_h/out_w` 计算 adaptive pool，flatten 后在 linear 之前的输出形状为 `(C * H * W, 1, 1)`，linear 的标量形状为 `1x1`。
   - 更新感受野和 effective stride：
     - Conv/pool: `RF_new = RF_old + (K - 1) * effective_stride`, `effective_stride *= S`。
     - Adaptive pool: 将其视为一个有效 `S = H_in / out_h` 的 pool（向下取整）。`RF_new = RF_old + (H_in - 1) * effective_stride_old`；`effective_stride *= S`。注意，adaptive pool 的 RF 等于前一层完整的空间范围。
     - Flatten / linear: RF 和 effective stride 不再有意义；将它们冻结为 flatten 之前的值，并在后续行中省略。
   - 计算参数：
     - Conv: `C_out * (C_in / groups) * K * K + (C_out if bias else 0)`。
     - Linear: `out_features * in_features + (out_features if bias else 0)`。
     - Pool 和 flatten: 0。

3. **检测问题**并标记：
   - 非整数输出尺寸（stride/padding 未对齐）。
   - 在 stack 结束前出现 `H_out <= 0`。
   - 感受野超过输入尺寸（该点之后可能存在浪费计算）。
   - 单层参数突然出现 10x 跳跃，暗示 channel plan 可能有误。

4. **以单个表格报告**：

```
idx  layer                C_in  C_out  K  S  P  H_out  W_out  RF    params     cum_params
1    conv 3x3 s=1 p=1     3     32     3  1  1  224    224    3     896        896
2    conv 3x3 s=2 p=1     32    64     3  2  1  112    112    7     18,496     19,392
3    pool max 2x2         64    64     2  2  0  56     56     11    0          19,392
...
```

5. **Summary 行**：最终 `(C, H, W)`、最终感受野、总参数量、warnings。

## 规则

- 空间尺寸始终返回整数。如果公式产生非整数，将其标记为 error，不要静默 floor。
- 当 `groups > 1` 时，验证 `C_in % groups == 0` 且 `C_out % groups == 0`；否则 error。
- 对于 depthwise conv（`groups == C_in`），在 `layer` 列中标注出来，让读者明白为什么参数量很低。
- 如果用户提供 BatchNorm 或 activation layers，为形状目的忽略它们，但继续累计参数（每个 BatchNorm 为 `2 * C`）。
- 永远不要猜测缺失字段的默认值。每个 conv 和 pool 都必须提供 `k`、`s`、`p`。
