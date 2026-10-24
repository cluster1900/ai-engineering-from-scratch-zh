# 先检查第一步，再信任这次运行

> 在第 0 步，训练器和引擎持有相同的权重，所以第一步能说明设置是否正确。

第 0 步是你能得到的最便宜的测试。此时还没有发生任何训练，所以训练器和引擎之间的每一处差异都来自设置，而不是来自学习。

读完本节后，你能检查一次运行的第一步，并在坏掉的运行用错误的数字训练之前停止它。

## 在第 0 步检查两个值 {#s-check-the-first-step-check-two-values-at-step-0}

在第 0 步，训练器用引擎所用的同一套权重计算样本的对数概率。所以在第 0 步的指标行中，有两个值必须为 0：

- `train/ppo_kl`，训练器新旧概率之间的 KL。在第一次更新之前，两者相同。
- `train/pg_clipfrac`，被裁剪的 token 所占的比例。在第一次更新之前，没有任何东西会被裁剪。

Miles 在自己的测试中断言这两个值：`train/ppo_kl` 低于 1e-9，`train/pg_clipfrac` 低于 1e-10。这个断言只在带 `--ci-test` 的 Megatron 训练器上运行，作用于每次 rollout 的第一个优化器步。`--ci-disable-kl-checker` 会关闭它。在 FSDP 训练器上，或者没有那个参数时，请自己读这些值。

我们所有的运行在第 0 步记录的裁剪比例都是 0。

## 把差距与你的范围比较 {#s-check-the-first-step-compare-the-gap-with-your-range}

在真正同策略模式之外，训练器和引擎之间的差距永远不会是 0，因为两边使用不同的 kernel。在第 0 步，它仍必须落在你健康运行的范围之内：

| 我们的运行 | 第 0 步的差距 |
|---|---|
| Qwen3-0.6B，不用 top-p 或 top-k，17 次运行 | 0.0148 至 0.0157 |
| Qwen3-0.6B，top-p 0.95 且 top-k 64 | 0.0136 |
| Qwen3-1.7B | 0.0109 |

差距取决于模型和采样器，所以请为你自己的设置建立范围。如果第 0 步的差距是你范围的好几倍，就说明两边计算的不是同一个模型。常见原因是某一边的检查点路径错了，或者某种模型格式被一边以不同方式读取。

## 直接检查权重 {#s-check-the-first-step-check-the-weights-directly}

在一次简短的测试运行中加上 `--check-weight-update-equal`，也就是在[第 1.1 节](#s-run-grpo-on-one-gpu)的运行上使用 `-e MILES_NUM_ROLLOUT=2 -e MILES_EXTRA_ARGS="--check-weight-update-equal"`。第一次权重更新之后，Miles 会比较引擎权重和训练器权重。使用 FP8 或其他低精度引擎时，加上 `--check-weight-update-allow-quant-error`，让检查允许预期的舍入误差。

对每个新模型或新镜像运行一次这个检查，而不是在每次长时间运行中都运行。

```takeaways
- 在第 0 步读 train/ppo_kl 和 train/pg_clipfrac，预期两者都为 0。
- 把第 0 步的差距与你健康运行的范围比较。
- 对每个新模型或新镜像，用 --check-weight-update-equal 做一次简短测试。
```

Sources: capture/gpu/summary/miles-gb10-lab.json (per_step[0] of each run); Miles metric checks, the Megatron model loop, and weight update check arguments at main 08752a12.
