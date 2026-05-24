---
name: prompt-tensor-debugger
description: 用于调试 Deep Learning 代码中 tensor shape 错误的逐步 prompt
phase: 1
lesson: 12
---

我的 Deep Learning 代码中出现了 tensor shape 错误。帮我修复它。

**错误信息：** [paste the error here]

**我的 tensor shapes：**
- [name]: [shape]
- [name]: [shape]

**我尝试执行的操作：** [describe it]

---

调试时，请严格遵循以下流程：

**Step 1: 识别操作类型。**
是什么操作产生了错误？将它映射到以下之一：
- Matrix multiply / Linear layer（inner dimensions 必须匹配）
- Broadcasting（从右对齐，每个 dim 必须相等或为 1）
- Concatenation（除 cat dimension 外，所有 dims 都匹配）
- Convolution（期望特定 rank 和 channel 位置）
- Reshape（total elements 必须保持不变）

**Step 2: 写出 shape contract。**
对于识别出的操作，明确写出期望 shapes：
```
matmul(A, B): A is (..., m, k), B is (..., k, n) -> (..., m, n)
broadcast(A, B): align right, each pair must be (equal) or (one is 1)
cat([A, B], dim=d): all dims match except dim d
Linear(in_f, out_f): input last dim must equal in_f
Conv2d(in_c, out_c, k): input must be (B, in_c, H, W)
```

**Step 3: 找出不匹配。**
将实际 shapes 与 contract 比较。识别违反规则的具体 dimension。

**Step 4: 选择最小修复。**
从下表中选择：

| 症状 | 修复 |
|---|---|
| 缺少 batch dimension | `.unsqueeze(0)` |
| 缺少 channel dimension | `.unsqueeze(1)` |
| 多余的 size-1 dimension | `.squeeze(dim)` |
| matmul 的 inner dims 错误 | `.transpose(-1, -2)` 或检查 weight shape |
| 需要从 NHWC 转为 NCHW | `.permute(0, 3, 1, 2)` |
| 需要从 NCHW 转为 NHWC | `.permute(0, 2, 3, 1)` |
| 为 linear 展平 spatial dims | `.flatten(1)` 或 `.reshape(B, -1)` |
| 拆分 heads: (B,T,D) 到 (B,H,T,D/H) | `.reshape(B, T, H, D//H).transpose(1, 2)` |
| 合并 heads: (B,H,T,D/H) 到 (B,T,D) | `.transpose(1, 2).reshape(B, T, H*(D//H))` |
| 使用 `.view()` 时 tensor 非 contiguous | `.contiguous().view(...)` 或使用 `.reshape(...)` |

**Step 5: 验证修复。**
展示每一步得到的 shapes。确认任何 reshape 前后 total elements 保持不变。确认该操作的 shape contract 现在已满足。

**Step 6: 检查 silent bugs。**
即使 shapes 匹配，也要验证：
- Broadcasting 发生在预期轴上（而不是意外发生）
- Reduction 是在正确 dimension 上求和
- batch dimension（dim 0）在整个 forward pass 中保留下来
- 当 dimension ordering 很重要时，使用 transpose + reshape（而不是只用 reshape）

请按以下格式回复：
```
OPERATION: [what operation failed]
EXPECTED: [shape contract]
ACTUAL: [what shapes were provided]
MISMATCH: [which dimension, why]
FIX: [exact code]
RESULT: [shapes after fix]
```
