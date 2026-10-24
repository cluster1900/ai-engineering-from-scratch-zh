# 用 partial rollout 处理长回答

> partial rollout 让最慢的回答不再决定每一步的时间。

一个 rollout 步在它最后一个回答结束时才结束。如果有几个回答跑到了长度上限，整步都要等它们，而这期间引擎有空闲的算力。

读完本节后，你能测出长回答让你付出了多少代价，并让它们不再拖慢每一步。

我们还没有在 GB10 上跑过 partial rollout。本页中实测的部分是我们基线运行的截断占比。

## 先测量长回答 {#s-handle-long-responses-measure-the-long-answers-first}

`rollout/truncated` 报告达到长度上限 `--rollout-max-response-len` 的回答占比。我们三个基线种子用的上限是 1,024 token。在前 8 步中，有 0.30 到 0.34 的回答达到上限。在后 8 步中，模型已经学会了更短的回答，比例降到 0.08 到 0.12。[第 5.3 节](#s-repeat-a-run)给出了每个种子的数字。

截断占比高有两个代价。被截断的回答通常在给出最终答案之前就停了，所以数学奖励给它 0 分。而且整步要等最长的回答。

## 在提高上限和 partial rollout 之间选择 {#s-handle-long-responses-choose-between-a-higher-limit-and-partial-rollout}

如果被截断的回答接近正确，就调高 `--rollout-max-response-len`。这样模型能因长而正确的回答得分，但每一步会更久。

如果是少数非常长的回答决定了步时间，就改用 partial rollout：

```bash
-e MILES_EXTRA_ARGS="--partial-rollout --over-sampling-batch-size 48 --dynamic-sampling-filter-path miles.rollout.filter_hub.common_filters.apply_reward_nonzero_std_filter"
```

这个过滤器就是[第 3.2 节](#s-train-with-the-dapo-filter)里的那个。

使用 partial rollout 时，这一步取最先完成的组。没完成的组回到数据缓冲区，之后的某一步会从它们已有的 token 接着生成。引擎不会重新生成这些 token。

partial rollout 与过采样配合使用。`--over-sampling-batch-size` 设定 rollout 在已完成的组不够时，每次新开一批 prompt 的大小。这样的运行要保持同步。`--fully-async` 和 session server 都拒绝 `--partial-rollout`。多轮和 agent 的 generate 函数也不支持它。

## 续写回答的代价 {#s-handle-long-responses-the-cost-of-continued-answers}

续写的回答在一组权重下开始，在之后的另一组权重下结束。所以它的一部分 token 来自更旧的权重。打开 partial rollout 之后，请关注训练器和引擎之间的差距，见[第 5.2 节](#s-check-the-first-step)。

## 投机解码，一个我们没有测量的手段 {#s-handle-long-responses-speculative-decoding-a-lever-we-have-not-measured}

投机解码是缩短 rollout 的另一种方式。一个廉价的 draft 猜测接下来的几个 token，引擎在一次前向中检查所有猜测。Miles 用 `--sglang-` 前缀把 SGLang 的投机参数透传过去。对于自带 MTP 层的模型，例如 GLM-4.7 或 DeepSeek-V3，Miles 文档给出了这些参数：

```bash
--sglang-speculative-algorithm EAGLE --sglang-speculative-num-steps 3 --sglang-speculative-eagle-topk 1 --sglang-speculative-num-draft-tokens 4
```

有两种 draft 可以作为起点：

- **MTP draft。** 上面的参数把模型自己的 MTP 层当作 draft。没有 MTP 层的模型需要一个单独的 draft，用 `--sglang-speculative-draft-model-path` 设置。随着训练改变策略，draft 会落后，通过检查的 token 也会变少。Miles 可以和策略一起训练 MTP 层：`--mtp-num-layers 1 --enable-mtp-training`，仅限 Megatron 训练器。
- **n-gram draft。** `--sglang-speculative-algorithm NGRAM` 不需要 draft 模型。它根据引擎已经生成的 token 来猜测。SGLang 只在 CUDA 上支持它，而且它会关闭 overlap 调度器。

当 rollout 是瓶颈时，Miles 文档不建议在约 13B 参数以下的稠密模型上使用投机解码。在这种情况下，检查的代价可能超过 draft 节省的时间。我们的 Qwen3-0.6B 就在这个范围内，我们没有测量过。如果你要尝试，请在相同的步和种子上比较 rollout 时间和差距。

```takeaways
- 调整长度上限之前，先读截断占比。
- 被截断的回答接近正确时，调高上限。
- 少数长回答决定步时间时，使用 partial rollout，然后关注差距。
- 在小型稠密模型上，把投机解码看作一个需要测量的手段，而不是默认选项。
```

Sources: capture/gpu/summary/miles-gb10-lab.json (runs.plain-48, runs.plain-48-s2, runs.plain-48-s3); Miles partial rollout and over-sampling arguments and the single-turn generate function at main 08752a12; Miles speculative decoding documentation and SGLang argument pass-through at main 08752a12; SGLang speculative decoding documentation.
