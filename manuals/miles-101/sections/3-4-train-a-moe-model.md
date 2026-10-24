# 用 routing replay 训练 mixture-of-experts 模型

> routing replay 让训练器使用引擎选中的同一批专家，这样两边对每个 token 用了哪些权重就能达成一致。

在 mixture-of-experts 模型里，router 为每个 token 挑几个专家。引擎和训练器各自运行这个 router。一点点数值差异就可能让它们为同一个 token 挑出不同的专家，于是它们会用不同的权重计算这个 token。

读完本节后，你能判断何时打开 routing replay，以及打开后要关注什么。

我们还没有在 GB10 上用 Miles 跑过 mixture-of-experts 模型。本页内容来自 Miles 的源码和发布说明。

## 为什么 MoE 模型上的差距更大 {#s-train-a-moe-model-why-the-gap-is-worse-on-a-moe-model}

在稠密模型上，两边之间的差距来自很小的舍入差异。在 MoE 模型上，同样的舍入可能翻转一次专家选择。一次被翻转的选择就是很大的差异。这个 token 会经过另一组权重，它的概率可能变化很大。

所以即使模型的稠密部分吻合得很好，MoE 运行显示的差距也可能比稠密模型更大。

## 打开 routing replay {#s-train-a-moe-model-turn-on-routing-replay}

这个参数只对 MoE 模型有效。像[第 1.1 节](#s-run-grpo-on-one-gpu-add-flags-to-a-run)那样用 `MILES_EXTRA_ARGS` 加上它。Qwen 的 MoE 模型太大，无法在一台 128 GB 的机器上做全量训练，[第 2.1 节](#s-pick-a-model-size)说明了这一点。我们的启动脚本只启动一块 GPU，所以请用按你的 GPU 配置的启动脚本，并传入同一个参数：

```bash
-e MILES_EXTRA_ARGS="--use-rollout-routing-replay"
```

**Routing replay：** 引擎在 rollout 时记录它为每个 token 选中的专家，训练器在前向计算中使用同样的专家。这个参数只对 MoE 模型有效。

有些模型需要相应的引擎设置。Miles 关于 GLM-5.3-Flash 的说明要求在 replay 时使用 `--sglang-moe-runner-backend triton`。

## Miles 团队报告的结果 {#s-train-a-moe-model-what-the-miles-team-reports}

Miles 团队在 8 个节点、每节点 4 块 GB300 GPU 上运行了带 routing replay 的共置 MoE 任务。他们的 v0.1.1 发布说明给出了每个模型每个 token 的差距。[来源](#s-ref-sources)列出了这些说明和 routing replay 论文。

| 模型 | 步数 | 使用 replay 时的差距 | 奖励 |
|---|---|---|---|
| Qwen3.8-Flash-Next | 5 | 0.0083 到 0.0131 | 0.47 到 0.75 |
| GLM-5.3-Flash | 3 | 0.0085 到 0.0098 | 0.50 到 0.72 |

Miles 文档的 GLM-5.3-Flash 页面报告了一次更长的运行，用的是 16 个节点、每节点 4 块 GB300 GPU。前 11 步的差距是 0.0068 到 0.0106。

这些都是在我们没有的硬件上跑的短运行。请把它们看作一个可用配置能达到的范围，而不是对你模型的保证。

## 一个已知限制 {#s-train-a-moe-model-a-known-limit}

如果引擎暂停一个请求，之后在新权重下重新 prefill 它，第二次 prefill 得到的路由可能覆盖已记录的路由。Miles 有一个未关闭的 issue 在跟踪这个问题。如果你使用会撤回请求的暂停模式，请在每次权重更新后检查差距。

```takeaways
- 每次 mixture-of-experts 运行都打开 routing replay。
- 读每一步的差距，并和不使用 replay 的运行比较。
- 检查你的模型在 replay 时需要的引擎设置。
```

Sources: Miles routing replay arguments and release notes v0.1.1 at main 08752a12; Miles GLM-5.3-Flash model documentation; Rollout Routing Replay paper, arXiv 2510.11370; Miles issue 3277.
