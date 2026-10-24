# 投机解码如何检查草稿

> 本页解释草稿的提议、验证和接受。

投机解码承诺每个 step 产出更多 token，同时不改变输出。读完本节后，你能解释 vLLM 如何兑现这个承诺，以及为什么 batch 越大收益越小。

## 先猜，再检查 {#s-how-speculative-decoding-checks-drafts-guess-then-check}

小 batch 上的一个 decode step 要读取全部权重，才能为每个请求产出一个 token。GPU 的大部分时间都闲置着等待内存。投机解码利用的就是这段闲置时间。

一个廉价的提议器猜出接下来的几个 token。然后目标模型对这些猜测运行一次，在每个位置计算它自己的分布。拒绝采样器按顺序检查这些猜测。它保留目标模型分布支持的每个猜测，在第一次拒绝时从目标模型采样一个正确的 token 并停止。因此一个 step 至少产出一个 token，最多产出猜测数加一个。

正是这个检查保证了输出不变。使用 greedy 采样时，只有等于目标模型 top token 的猜测才会保留。使用随机采样时，拒绝规则保证输出分布等于目标模型的分布。

```figure
id: fig-8-7
kind: sequence
title: one verify pass
claim: One target pass keeps the drafts up to the first rejection and adds one token, so one real request got about 1.8 tokens per pass.
caption: The top half shows the rule by position. The bottom half is a real Qwen3-8B request on our L4, served by SGLang with EAGLE3, the same rule vLLM uses. Green tokens came from verify passes. From manuals/sglang-101/capture/gpu/out-l4/eagle3-generate.txt.
```

## 提议器 {#s-how-speculative-decoding-checks-drafts-the-proposers}

vLLM 0.31.0 有几种提议器，用 `--speculative-config` 设置：

| 方法 | 猜测从哪里来 |
|---|---|
| `ngram` | 同一个 prompt 中与最后几个 token 匹配的前文 |
| `suffix` | 基于之前的 prompt 和回答构建的后缀树 |
| `eagle`, `eagle3` | 一个读取目标模型 hidden state 的小型 draft head |
| `*_mtp` | 某些模型（例如 DeepSeek）自带的额外预测 head |
| `draft_model` | 一个独立的小模型 |

N-gram 和 suffix 方法几乎没有开销，在回答照抄 prompt 时有帮助，比如代码编辑。EAGLE3 这样的 draft head 需要为你的模型训练的 head，在开放文本上有帮助。对于 `Qwen/Qwen3-8B`，有一个公开的 EAGLE3 head，只有一层，draft 词表有 32,000 个 token。

## 为什么负载越高收益越低 {#s-how-speculative-decoding-checks-drafts-why-the-gain-falls-with-load}

投机解码利用的闲置时间，只在 step 读取内存多于计算时才存在。随着 batch 增大，step 对每个字节做的计算更多，闲置时间就消失了。这时检查被拒绝的猜测要消耗真实的算力。vLLM 文档对 EAGLE 收益的评价是：请求速率低时高，请求速率高时较低。

动态模式正是由此而来。它根据 batch 大小设定猜测数，并在 batch 很大时停止猜测。在 0.31.0 中，它的在线示例运行在较旧的 model runner 上。

## 要关注什么 {#s-how-speculative-decoding-checks-drafts-what-to-watch}

引擎导出提议的 token 数和被接受的 token 数。接受率和每个 step 的平均 token 数能告诉你提议器在你的文本上猜得好不好。接受率高、每个 token 的时间却没有改善，说明 batch 已经受限于计算。

```takeaways
- 提议器猜测 token，目标模型运行一次来保留或拒绝它们。
- 拒绝规则保证输出分布等于目标模型的分布。
- 收益来自 GPU 的闲置时间，所以随 batch 增大而下降。
```

Sources: the vLLM source at v0.31.0 (vllm/config/speculative.py, vllm/v1/spec_decode/, vllm/v1/sample/rejection_sampler.py), vLLM documentation at v0.31.0 (docs/features/speculative_decoding/), the model config of Tengyunw/qwen3_8b_eagle3.
