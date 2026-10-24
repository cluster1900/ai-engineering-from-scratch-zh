# 用 FP8 做 rollout，用 BF16 训练

> FP8 rollout 让生成更便宜，也让训练器和引擎之间的分歧更大，所以需要一种校正。

rollout 往往是一步中最长的阶段。用 FP8 运行引擎，引擎读取的每个权重的字节数就减半。训练器仍以 BF16 保存权重，所以两边现在是有意用不同的数在计算。

读完本节后，你能选择一种低精度模式，并知道该搭配哪种校正。

我们还没有在 GB10 上跑过 FP8 rollout。本页内容来自 Miles 的低精度文档和参数。

## 选择一种模式 {#s-roll-out-in-fp8-pick-a-mode}

Miles 文档列出了四种混合精度的方式：

| 模式 | Rollout | 训练 | 适用场景 |
|---|---|---|---|
| 1 | FP8 | BF16 | 想让 rollout 更便宜，同时对训练改动最小 |
| 2 | FP8，block-wise | FP8，block-wise | rollout 和训练都需要提速 |
| 3 | MXFP8 | MXFP8 | 在数据中心级 Blackwell GPU 上训练 |
| 4 | NVFP4 | NVFP4 | 在数据中心级 Blackwell GPU 上训练 MoE 模型的路由专家 |

从模式 1 开始。它只改变引擎加载的 checkpoint。

模式 1 最容易上手，但并非在所有情况下都安全。下面这些限制我们没有测试过，它们来自公开的报告：

- 2026 年的一项研究发现，FP8 rollout 加 BF16 训练在约 4K token 以下的 rollout 上与 BF16 持平。到 8K token 时开始偏离，到 16K token 时崩溃。在对基座模型来说较难的任务上，它也更早失败。
- Miles 团队及其合作方的一篇文章发现，这种不一致随 MoE 模型规模增大，从 30B 到 1T 参数都是如此。他们的解决办法是两边都用 FP8，也就是模式 2。
- 另一个 RL 库对小模型给出了警告。在小模型上，每次权重更新时量化权重的代价可能超过 FP8 节省的时间。

[来源](#s-ref-sources)列出了这项研究、这篇文章和这份库文档。

## 配置模式 1 {#s-roll-out-in-fp8-set-up-mode-1}

给引擎一个 FP8 checkpoint，给训练器 BF16 权重：

- `--hf-checkpoint` 指向 FP8 checkpoint。引擎加载它。
- 训练器加载 BF16 权重。在 Megatron 训练器上，`--ref-load` 指向它们。

模式 1 需要 Megatron 训练器。FSDP 训练器也从 `--hf-checkpoint` 加载自己的权重，所以用 FSDP 时两边都会加载 FP8 checkpoint。我们的 GB10 运行用的是 FSDP，这也是我们没有跑模式 1 的一个原因。

**Block-wise FP8：** 一种为每个 128 乘 128 的权重块存一个 scale 的格式。文档列出它支持 Hopper GPU、Blackwell B200 及更新的 GPU，以及 AMD MI350X 和 MI355X。

用 `--check-weight-update-equal --check-weight-update-allow-quant-error` 检查第一次权重更新。第二个参数让检查允许 FP8 带来的舍入误差。

## 搭配一种校正 {#s-roll-out-in-fp8-pair-it-with-a-correction}

FP8 舍入会加大训练器和引擎之间的差距。现在这个差距有了一个任何 kernel 设置都消除不了的原因。文档建议在 MoE 模型上让模式 1 搭配 routing replay，并可选地加上带上限的重要性采样校正：

- **带上限的重要性采样：** `--use-tis --tis-clip 2.0` 按训练器概率与引擎概率之比给每个 token 加权，并给这个比值设上限。
- **Routing replay：** 在 MoE 模型上加 `--use-rollout-routing-replay`，让 FP8 舍入不会同时改变专家选择。[第 3.4 节](#s-train-a-moe-model)解释了它。

[第 8.2 节](#s-the-correction-methods)比较了这些校正。

## 要测量什么 {#s-roll-out-in-fp8-what-to-measure}

在第 0 步和最初几步测量差距，分别在使用和不使用 FP8 rollout 时测。也要测量 rollout 时间，因为对于 FP8 在小模型上能省多少，我们没有数字。

文档为模式 3 和 4 列出的是 B200、B300、GB200 和 GB300。我们的 GB10 不在这个列表上，也不在 block-wise FP8 的列表上，所以我们无法按文档测试这些模式。

```takeaways
- 从 FP8 rollout 加 BF16 训练开始，并预期在长 rollout、难任务和大型 MoE 模型上会出问题。
- 打开量化容差，检查第一次权重更新。
- 在 MoE 模型上加 routing replay，差距变大时再加带上限的重要性采样校正。
```

Sources: Miles FSDP actor at main 08752a12 (the trainer weights load from the hf_checkpoint argument), Miles low-precision documentation, weight update check arguments, and importance sampling arguments at main 08752a12; Jet-RL, arXiv 2601.14243; Unified FP8, LMSYS blog, 2025-11-25; SkyRL quantized rollouts documentation.
