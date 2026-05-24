---
name: attention-shapes
description: 调试 Attention implementations 中的 shape bug。
phase: 5
lesson: 10
---

给定一个有问题的 Attention implementation，你需要识别 shape mismatch。输出：

1. 哪个 Matrix 的 shape 错了。命名该 tensor。
2. 它的 shape 应该是什么，从 `(d_s, d_h, d_attn, T_enc, T_dec, batch_size)` 推导出来。
3. 一行修复。Transpose、reshape 或 project。
4. 一个捕获 regressions 的测试。通常断言 `output.shape == (batch, T_dec, d_h)`、`weights.shape == (batch, T_dec, T_enc)`，并且 `weights.sum(dim=-1)` 接近 1。

拒绝推荐会悄悄 broadcast 的修复。Broadcast 隐藏的 bug 后续会表现为无声的 accuracy degradation。

对于 Bahdanau 的混淆，坚持 decoder input 是 `s_{t-1}`（pre-step state）。对于 Luong，是 `s_t`（post-step state）。dot-product attention 中最常见的初学者错误是 query/key dimension mismatch —— 要明确标出。
