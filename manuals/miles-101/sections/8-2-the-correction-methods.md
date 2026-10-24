# 针对差距的校正方法

> Miles 有几种处理训练器和引擎之间差距的方法，每一种修复不同的原因。

[第 8.1 节](#s-why-rl-owns-an-engine)列出了五种不一致的来源：token、路由、采样、数值和陈旧。Miles 对每一种都有一个方法。有些方法消除原因，另一些只减小它对梯度的影响。

读完本节后，你能解释哪种校正修复哪个原因，以及其中哪些是我们测量过的。

## 两类方法 {#s-the-correction-methods-two-kinds-of-method}

**消除原因的方法**让两边计算同样的东西。用了它之后，差距中的那一部分就消失了。

**重新加权的方法**让差距保持原样，只改变每个 token 在损失中的分量。它防止一个两边意见不一致的 token 把更新拉得太远。

先消除原因，因为每一种重新加权都会给梯度增加方差。

## 方法列表 {#s-the-correction-methods-the-methods}

| 方法 | 类别 | 针对的原因 | 如何开启 |
|---|---|---|---|
| 采样重放 | 消除 | top-p 和 top-k 采样 | 正的 `--rollout-top-k`，可以带或不带小于 1 的 `--rollout-top-p` |
| 路由重放 | 消除 | MoE 专家选择 | `--use-rollout-routing-replay` |
| token 进、token 出的会话 | 消除 | 轮次之间的文本往返 | `--use-session-server` |
| 真正同策略模式 | 消除 | 所有 kernel 差异 | [第 8.3 节](#s-why-true-on-policy-is-a-contract)中的契约 |
| 截断重要性采样 | 重新加权 | 任何剩余的差距 | `--use-tis --tis-clip 2.0` |
| 自定义的重要性或拒绝函数 | 重新加权 | 任何剩余的差距 | `--custom-tis-function-path`，Miles 示例中有一个带掩码的版本 |
| 比率中使用引擎的对数概率 | 改变参照 | 比率的分母 | `--use-rollout-logprobs` |
| 分数中心化 | 改变损失 | 离策略样本分数的漂移 | `--loss-type score_centering` |
| 样本年龄限制 | 丢弃样本 | 陈旧 | `--max-weight-staleness` |

**截断重要性采样：** 每个 token 以训练器概率与引擎概率之比作为权重，并且权重有上限。这个上限防止单个 token 主导更新。

**分数中心化：** 一种单独的损失，它使用引擎采样器的 top-k 概率来校正离策略样本的分数。它会在引擎中打开 FP32 输出层，这会消耗服务的算力和内存。

## 我们测量了什么 {#s-the-correction-methods-what-we-measured}

在我们的 GB10 上用 Qwen3-0.6B 时，其中有两项涉及我们的运行：

- 采样重放把差距降低了 11.5%，从 0.0153 降到 0.0135。[第 4.4 节](#s-lower-the-logprob-gap)有这次运行。
- 确定性推理不在列表中，因为它没有消除差距的任何原因。它让引擎能重复自己的结果，而差距没有变化。[第 4.5 节](#s-use-deterministic-inference)有这些运行。

我们没有运行其他方法。它们中的大多数只在 MoE 模型、多轮 rollout、低精度、异步训练或 Hopper GPU 上才有意义。

## 我们的看法 {#s-the-correction-methods-our-view}

在选择方法之前先读差距。在使用普通采样的稠密模型上，约 0.015 的平稳差距就是该设置的 kernel 差异。重新加权的方法只会把它藏起来。一次改动之后增长的差距指向你新加入的原因：新的采样器、MoE 模型、FP8 rollout 或更旧的样本。让方法与那个原因匹配。

```takeaways
- 先消除原因，再对它的影响重新加权。
- 让每种方法与它的来源匹配：采样器、路由、token、kernel 或陈旧。
- 在同一个种子上，测量每种方法前后的差距。
```

Sources: Miles importance sampling, routing replay, sampling replay, score centering, and async arguments at main 08752a12; Miles train-infer mismatch example; capture/gpu/summary/miles-gb10-lab.json (runs.e6a-base, runs.e11-topp-topk, runs.e6b-det-triton, runs.e6c-det-flashinfer).
