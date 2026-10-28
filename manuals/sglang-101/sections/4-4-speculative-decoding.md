# --speculative-algorithm

> Speculative decoding 用空闲的 GPU 算力每一步提交好几个 token，所以在低负载时砍延迟，在 GPU 已经满时可能花吞吐。

一位用户在 A6000 上为 Llama-3.1-8B 打开了 EAGLE-3，并跑了两次测试。在批大小 1 时，输出从 42.0 到 92.5 tok/s，快了不止一倍。在并发 20 时，输出从 217.8 降到 164.4 tok/s，慢了四分之一。两个数字都在 issue #5274 里，两个都对。一位维护者回答说，speculative decoding 是为小批准备的，不是为压力测试 {{issue #5274}}。

读完本节后，你能解释 draft、verify 和接受长度，并读出 SGLang 选的默认。你也能找到推测设下的请求上限，并决定推测该放哪里。

## 代价：decode 一次一个 token {#s-speculative-decoding-the-cost-decode-is-one-token-at-a-time}

每一步 decode 为每条请求提交一个 token，下一步需要那个 token 作输入。在批大小 1 时，一步读模型的每个权重来算一个 token。GPU 有多余算力，内存流量是上限。更大的批用其他请求填满那份多余算力。

Speculative decoding 用猜测填它。**Draft model：** 一个小模型，或在目标模型上训出的小头，便宜地提出接下来几个 token。**Verify pass：** 目标模型对所有提出的 token 一次前向。目标接受与它本会产出匹配的最长前缀，并加上它自己的一个 token。

**Acceptance length：** 每次 verify 提交的 token 数，接受的 draft 加上那一个奖励 token。接受长度 3 表示一次目标前向提交三个 token。

## SGLang 里的一步 {#s-speculative-decoding-one-step-in-sglang}

```figure
id: fig-4-6
kind: sequence
title: one EAGLE step with steps 3, topk 1, and 4 draft tokens
claim: One EAGLE step drafts a chain of tokens, verifies them in one target forward, and commits the accepted prefix plus one bonus token.
caption: Read top to bottom. The numbers follow the default (3, 1, 4) for most models at v0.5.22. Green tokens are accepted and the rose token is rejected. From EAGLEWorkerV2.forward_batch_generation at v0.5.22.
```

1. **Draft.** draft 模型跑 `--speculative-num-steps` 次。`--speculative-eagle-topk` 大于 1 时，每一步为每个节点保留几个候选，并长成一棵树。树构建器保留最好的 `--speculative-num-draft-tokens` 个节点，并建树掩码。
2. **Verify.** 目标在 `TARGET_VERIFY` 模式下对每个 draft token 带树掩码跑一次。对 greedy 请求它保留最长匹配路径。对采样请求它在应用温度、top-k 和 top-p 后比较概率。
3. **Draft extend.** draft 模型在 `DRAFT_EXTEND_V2` 模式下读接受的 token，好让它的缓存为下一步就绪。

接受阈值 `--speculative-accept-threshold-single` 和 `--speculative-accept-threshold-acc` 默认是 1.0。用那些值时，greedy 请求产出与没有推测时相同的 token。

## 算法与默认 {#s-speculative-decoding-the-algorithms-and-the-defaults}

`--speculative-algorithm` 接受 `EAGLE`、`EAGLE3`、`NEXTN`、`STANDALONE`、`NGRAM`、`DFLASH`、`DSPARK` 和 `UNO`。`NEXTN` 是 `EAGLE` 的另一个名字。对检查点里带有多 token 预测层的 DeepSeek V3 等模型，SGLang 把 draft 模型路径设成模型路径。`NGRAM` 根本不需要 draft 模型。它在已经见过的文本里查找重复的 token 序列。

用 `NGRAM` 时，SGLang 关掉混合分块 prefill {{code}}。v0.5.22 的文档页还说 `NGRAM` 关掉 overlap 调度器，并且只在 CUDA 上跑。v0.5.22 的代码接受 CUDA、CPU 和 XPU，并且只在 CPU 上关掉 overlap {{code}}。从 `GET /server_info` 读 `disable_overlap_schedule`，看你的服务器跑什么。当你对比 `NGRAM` 和没有推测时，两边用同一 overlap 设置跑。

你不设形状时，SGLang 从模型架构选 `(num_steps, topk, num_draft_tokens)`。

| 模型 | 默认形状 |
|---|---|
| `LlamaForCausalLM`, Grok | (5, 4, 8)：最多 8 个 draft 的树 |
| DeepSeek、GLM、GPT-OSS、MiMo、`STANDALONE`，以及所有其他模型 | (3, 1, 4)：3 个 draft 的链 |

topk 为 1 时，代码强制 draft token 数等于步数加一。

## 没人要的上限 {#s-speculative-decoding-the-limit-nobody-asked-for}

v0.5.22 的 EAGLE、NGRAM、DFLASH 和 DSPARK 处理程序在你没设 `--max-running-requests` 时各做同一件事。它把值设成 48，并打一条警告：`Max running requests is reset to 48 for speculative decoding` {{code}}。推测需要 draft token 的内存，并在小批上最好，所以上限保护服务器。它也封顶你的基准。

开着推测、没有显式上限的吞吐测试，量的是一台准入 48 条请求的服务器。如果你的流量跑 200 并发请求，另外 152 条在队列里等，首 token 时间增长。警告在启动时打一次，在第一条请求之前就滚走了。

## 要量什么 {#s-speculative-decoding-what-to-measure}

调度器在每条 decode 日志行上记下 `accept len` 和 `accept rate`，`/metrics` 导出 `sglang:spec_accept_length` 和 `sglang:spec_accept_rate`。在你自己的 prompt 上量它们，因为接受取决于文本和 draft。David Noel Ng 的现场报告 {{field David Noel Ng 2026-08}} 在两块 GH200 上，加载器修好之后，在 DeepSeek-V4-Flash 上量到 3.5 到 5.05 个 token。

用你自己的流量样本，有推测和没有推测各跑一遍。保持你真实的输出长度，并向基准客户端传 `--disable-ignore-eos`。没有流量样本时，`--dataset-name speed-bench` 在 v0.5.22 读 SPEED-Bench prompt 的本地副本 {{code}}。对比这些数字：

1. 接受长度，来自 `sglang:spec_accept_length`。
2. 中位 TPOT 和输出吞吐。
3. P99 ITL 和 P99 TTFT，因为中位的收益可以藏住尾部的损失。
4. 单独你最长答案的接受长度。每个 `/generate` 响应在 `meta_info` 里把它给成 `spec_accept_length`。

然后有推测和没有推测扫描并发，找到两条线交叉的地方。蚂蚁集团 {{field Ant Group 2025-09}} 在 H20 上的 DeepSeek-R1 上量了这个。更长的 draft 在批大小 1 时多 21%，在批大小 32 时大约少 18%。

```figure
id: fig-4-7
kind: comparison
title: the same feature at two batch sizes
claim: Speculation doubled single-request speed and cut throughput at concurrency 20 on the same GPU and model.
caption: Output tok/s for Llama-3.1-8B with and without EAGLE-3 on one A6000, as reported in issue 5274 on 2025-04-11. The bars use one scale.
```

## 我们在 GB10 上测到的 {#s-speculative-decoding-what-we-measured-on-a-gb10}

我们在一块 NVIDIA GB10 上对 `Qwen/Qwen3-30B-A3B-Instruct-2507` 跑了 EAGLE-3。draft 是 `lmsys/SGLang-EAGLE3-Qwen3-30B-A3B-Instruct-2507-SpecForge-Nex`，形状是 SGLang cookbook 为这对用的 (3, 1, 4)。

第一次启动失败了。draft config 说 2,048 个位置，目标说 262,144。上下文长度检查抛出 `ValueError`，并以 `To allow overriding this maximum, set the env var SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1` 结束 {{code}}。这对的 cookbook 命令设了那个变量，所以我们也设了。

```listing
title: the draft context length check with the override set
source: capture/gpu/out-gb10/server-eagle3.log
lang: text
note: Three lines from the startup log. Timestamps are cut.
---
… Warning: Target model's context_length (262144) is greater than the derived context_length (2048). This may lead to incorrect model outputs or CUDA errors. Note that the derived context_length may differ from max_position_embeddings in the model's config.
… Overriding the draft model's max_position_embeddings to 262144.
… Max running requests is reset to 48 for speculative decoding. You can override this by explicitly setting --max-running-requests.
```

变量只去掉检查。它不教 draft 读长 prompt，那是下面 issue #6783 里的失败。我们的 prompt 有 512 个 token，所以这次运行对长上下文什么也没说。

我们预期在 24 GB L4 上会有同样的拒绝。我们用 draft `Tengyunw/qwen3_8b_eagle3`、不设变量启动了 `Qwen/Qwen3-8B`，服务器启动了。那个 draft 声明 40,960 个位置，与目标相同，所以检查没什么可拒的。变量属于一份 draft config，不属于 EAGLE-3。在设它之前，比较两份 config 里的 `max_position_embeddings`。

```listing
title: an EAGLE-3 start on a 24 GB L4
source: capture/gpu/out-l4/server-eagle3-no-env.log
lang: text
note: Four lines from the startup log. Timestamps are cut.
---
… Load weight end. elapsed=3.89 s, type=Qwen3ForCausalLM, avail mem=6.41 GB, mem usage=15.28 GB.
… Load weight end. elapsed=0.67 s, type=LlamaForCausalLMEagle3, avail mem=4.50 GB, mem usage=1.90 GB.
… KV Cache is allocated. dtype: torch.bfloat16, #tokens: 8827, K size: 0.61 GB, V size: 0.61 GB
… max_total_num_tokens=8827, chunked_prefill_size=4096, max_prefill_tokens=16384, max_running_requests=48, context_len=40960, available_gpu_mem=1.19 GB
```

同一次启动展示了小卡上 draft 的代价。目标单独在这块 L4 上有 24,094 个 token 的 pool。加载了 draft 后，pool 持有 8,827 个 token，大约 14 条我们 640 token 的请求。同一块卡上的扫描服务器启动时有更多空闲内存，持有 9,951 个 token。

**我们测到** 从 1 到 64 的每个并发上三个种子，以 BF16 服务器为基线：

| 并发 | 基线中位 TPOT | EAGLE-3 中位 TPOT | 基线输出 tok/s | EAGLE-3 输出 tok/s |
|---|---|---|---|---|
| 1 | 32.52 ms | 20.30 ms | 29.14 | 40.93 |
| 8 | 102.21 ms | 59.44 ms | 74.11 | 97.06 |
| 32 | 201.91 ms | 106.97 ms | 150.66 | 228.78 |
| 64 | 254.06 ms | 138.41 ms | 235.38 | 276.32 |

接受长度在每个并发上都停在每步 2.71 到 2.74 个 token。每 token 的收益在每个负载上都保持 1.56 倍或更多。它在并发 32 时达到峰值 1.89 倍，在 64 时是 1.84 倍。

```figure
id: fig-4-4b
kind: chart
title: on a mixture-of-experts model the EAGLE-3 gain holds as the batch grows
claim: On the GB10, EAGLE-3 cut the median time per token by 1.60 times at concurrency 1 and by 1.89 times at 32.
caption: The line is baseline median TPOT divided by EAGLE-3 median TPOT, at each concurrency. The dashed rose line marks no gain. The footnote gives the acceptance length range. From capture/gpu/summary/gb10.json.
```

这个结果与上面的 A6000 报告相反，模型解释了它。稠密模型每一步读全部权重，更大的批已经用掉多余算力。混合专家模型只读这一步的 token 选中的那些专家。verify 遍用它已经为那一步读过的专家权重，为每条请求打分四个位置。那是我们的读法，量在一个模型和一块 GPU 上。

上限是限制。在并发 64 时，吞吐仍高于基线，276.32 对 235.38 tok/s。中位首 token 时间是 7,772 ms 对 557 ms。服务器准入 48 条请求，另外 16 条在队列里等。

## 我们在 24 GB L4 上测到的 {#s-speculative-decoding-what-we-measured-on-a-24-gb-l4}

我们在一块 L4 上用稠密 `Qwen/Qwen3-8B` 和 `Tengyunw/qwen3_8b_eagle3` draft 跑了同一扫描。默认服务器跑在 2026-10-16，EAGLE-3 服务器跑在 2026-10-17，两者中位时钟都是 1,080 MHz 或更高。这次我们设了变量，像扫描对每台 EAGLE-3 服务器做的那样。

```listing
title: the pool of an EAGLE-3 server on the L4
source: capture/gpu/out-l4/server-load-eagle3.log
lang: text
note: Startup lines from the server log of the sweep. Timestamps are cut.
---
… KV Cache is allocated. dtype: torch.bfloat16, #tokens: 9951, K size: 0.68 GB, V size: 0.68 GB
… max_total_num_tokens=9951, chunked_prefill_size=4096, max_prefill_tokens=16384, max_running_requests=48, context_len=40960, available_gpu_mem=1.23 GB
```

**我们测到** 9,951 个 token 的 pool，对没有 draft 时的 24,094。那份 pool 大约装得下 15 条我们 640 token 的请求，少于上限 48。

| 并发 | 默认中位 TPOT | EAGLE-3 中位 TPOT | 默认输出 tok/s | EAGLE-3 输出 tok/s |
|---|---|---|---|---|
| 1 | 60.16 ms | 25.61 ms | 13.42 | 31.81 |
| 8 | 66.01 ms | 35.58 ms | 112.62 | 181.55 |
| 32 | 96.18 ms | 43.82 ms | 270.11 | 269.42 |
| 64 | 107.42 ms | 51.50 ms | 250.85 | 245.34 |

接受长度在每个并发上都是每步 2.73 到 2.74 个 token。每个 token 在每个负载上都快了 1.6 到 2.3 倍。可是从并发 32 起，服务器交付的每秒 token 并不比默认更多。

```figure
id: fig-4-4c
kind: chart
title: On a 24 GB card each token got faster, but the server did not
claim: On the L4, EAGLE-3 gave 2.37 times the output throughput at concurrency 1 and 1.00 times at 32.
caption: Violet is default TPOT divided by EAGLE-3 TPOT. Teal is EAGLE-3 output throughput divided by the default. The dashed rose line marks no gain. From capture/gpu/summary/l4.json.
```

pool 解释了差别。pool 里有 15 条请求时，其余的在等槽。在并发 32 时，有 EAGLE-3 的中位首 token 时间是 8,040 ms，没有是 2,970 ms。在 KV pool 是上限的卡上，draft 花掉批需要的那份内存。

## 知道我们结果的限制 {#s-speculative-decoding-know-the-limits-of-our-results}

两次扫描都用了基准客户端的 `random` 数据集，512 进、128 出，`ignore_eos` 开着。在 v0.5.22，那个数据集取 ShareGPT 对话的第一轮，然后裁或重复到 512 个 token {{code}}。它是真实文本，但不是你的流量。

其他团队发现像我们这样的测试可能夸大收益。我们自己没量这些效应：

- NVIDIA 研究者的一项 2026 基准研究 SPEED-Bench 发现，合成 prompt 平均夸大推测吞吐 23%。它还发现最好的 draft 长度随批增大降到 1。
- 同一研究发现，随机 token id 让 MoE 目标某些层里 20% 到 30% 的专家空闲。
- 一项 2026 对 EAGLE-3 和其他 draft 的研究 Test-Time Speculation 发现，接受长度随答案变长而下降。在跑向 20,000 个 token 的 MATH 答案上，它从大约 3.7 降到大约 1.5。
- 一项 2025 对服务基准的研究把推测和基线比。中位 TPOT 低 1.3 倍，P99 TPOT 高 1.16 倍。TTFT 也升了，因为 draft 跑自己的 prefill。

所以我们的收益对忽略结束 token、生成 128 个 token、在我们测试 prompt 上成立。它们不预测长聊天答案或推理轨迹上的收益。我们对 GB10 结果的读法也取决于真实 token 如何选专家，我们没量路由。

## L4 上的真实 prompt {#s-speculative-decoding-real-prompts-on-the-l4}

在 2026-10-23，我们在四个数据集上跑了同一 L4 扫描：random 集、ShareGPT、GSM8K 问题和代码 prompt。时钟锁在 900 MHz，每次运行前 flush 缓存，每个点两个种子。

```listing
title: speculation on four datasets, Qwen3-8B on SGLang 0.5.22, our L4 at 900 MHz
source: capture/gpu/out-l4/spec-real-prompts.txt
lang: text
note: The time per token at 8 users and the output at 32 users. The acceptance lines and the notes are cut.
---
median TPOT at 8 users: default / EAGLE3 / NGRAM
random     67.6 to 68.2 / 33.8 to 39.4 / 68.2 to 71.4 ms
ShareGPT   66.4 to 68.6 / 39.5 to 43.1 / 69.5 to 72.4 ms
GSM8K      65.5 / 33.3 to 34.3 / 54.6 to 55.0 ms
code       65.9 to 66.4 / 36.8 / 58.2 to 58.8 ms
…
output tok/s at 32 users: default / EAGLE3 / NGRAM
random     250 to 254 / 239 to 242 / 236 to 250
ShareGPT   281 to 288 / 277 to 283 / 245 to 256
GSM8K      397 / 648 to 660 / 433 to 435
code       365 to 366 / 566 to 581 / 377 to 386
…
```

EAGLE-3 在每个数据集上把 8 用户时的每 token 时间大约砍半，接受长度 2.35 到 2.78。在 32 用户时，它在 GSM8K 和代码上给出 1.6 倍输出。在 random 集和 ShareGPT 上它没有更多输出。那里它的首 token 晚了 2 到 3 倍，因为 draft 拿走了队列需要的 pool 空间。

NGRAM 只在 GSM8K 和代码上有帮助，在 8 用户时大约 1.1 到 1.2 倍。在另外两个集上它更慢，P99 ITL 升到 244 到 779 ms。所以数据集改结果的程度，比 random 集暗示的更大。在你自己的流量上测。

## 长答案上的接受 {#s-speculative-decoding-acceptance-over-a-long-answer}

我们在更短的答案上测了 Test-Time Speculation 的主张。在 2026-10-23，我们用 EAGLE-3 draft、3 步、top-k 1 和 4 个 draft token 跑了 `Qwen/Qwen3-8B-FP8`。这是在我们 L4 节点第二块 GPU 上，主人共享它，没有锁时钟。8 条 prompt 各开着 thinking、greedy、单独跑，最多 4,096 个 token。我们在答案到 256、512、1,024、2,048 和 4,096 个 token 后读 `spec_verify_ct`。

```listing
title: mean acceptance length by position in the answer
source: capture/gpu/out-l4/eagle3-acceptance-by-position.txt
lang: text
note: The range across prompts, with the number of prompts that reached each segment in brackets. The vLLM column comes from the same prompts on vLLM 0.31.0.
---
segment of the output   SGLang                 vLLM
0 to 256                2.05 to 2.64 (8)       2.14 to 2.51 (8)
256 to 512              1.95 to 2.64 (8)       2.09 to 2.55 (8)
512 to 1,024            2.11 to 2.77 (8)       2.12 to 2.79 (8)
1,024 to 2,048          2.09 to 2.47 (5)       1.72 to 2.66 (5)
2,048 to 4,096          2.33 and 2.48 (2)      2.35 and 2.60 (2)
```

到 4,096 个 token，接受长度没有稳步下降。它在两个引擎上每次 verify 都停在大约 2.1 到 2.8 个 token。8 条里只有 2 条在结束 token 之前跑过 2,048 个 token，所以最后一段落在两个答案上。时钟改速度，不改接受。我们 4,096 个 token 的上限来自那块 GPU 上能用的内存。所以我们的测试没到研究的范围。

第二次测试在 8 用户下用 BF16 的 `Qwen/Qwen3-8B`，答案最多 2,048 个 token，没有 ignore-eos。中位答案是 1,800 到 2,000 个 token。

```listing
title: EAGLE3 acceptance on answers of about 2,000 tokens, 8 users
source: capture/gpu/out-l4/eagle3-long-outputs.txt
lang: text
note: The table of the file. The comparison with short outputs is cut.
---
engine          dataset    mean acceptance length   accepted per draft position 1 / 2 / 3
SGLang EAGLE3   GSM8K      2.68
SGLang EAGLE3   ShareGPT   2.32
vLLM EAGLE3     GSM8K      2.69                     0.77 / 0.54 / 0.38
vLLM EAGLE3     ShareGPT   2.35                     0.67 / 0.42 / 0.26
```

在同一次会话的短答案上，SGLang 在 GSM8K 上给了 2.69 到 2.78，在 ShareGPT 上给了 2.33 到 2.43。它的长答案停在那些范围的 0.01 以内。我们这次会话没有 vLLM 的短答案接受，所以它的行只展示长答案上的水平。

## 我们的立场 {#s-speculative-decoding-our-position}

把 speculative decoding 当成低和中等并发的延迟工具。为每个副本几个用户的交互流量打开它。为批作业，以及在我们 L4 那种 KV pool 是上限的卡上的高并发关掉它。在 GB10 上，pool 有空间时，推测在 64 用户时仍给出 1.17 倍吞吐。

在接受那条规则之前，在你的模型上量交叉点。在上面的混合专家模型上，推测在 GB10 的并发 32 时仍赢。在 L4 上的稠密模型上，它在 32 时没有更多吞吐，因为 draft 拿走了将近 60% 的 pool。用你自己的 prompt 和输出长度量它，用“要量什么”一节里的列表。

只要推测开着，就自己设 `--max-running-requests`。从你的扫描显示推测仍赢的并发选它。

先用模型自带的 draft 层。带多 token 预测层的模型不需要额外下载。对 EAGLE-3，检查 draft 模型支持你的 prompt 长度，并在接受低时在你自己的流量上训一份 draft。Google Cloud {{team Google Cloud 2025-11}} 和带 Defagon 的 Modal {{team Modal 2025-11}} 都训了自己的 draft。Modal 报告接受比开源 draft 长 38%。两者都是厂商报告。

## 事故 {#s-speculative-decoding-incidents}

**推测让压力测试变慢。** Issue #5274（2025-04-11）：A6000 上的 EAGLE-3 在并发 20 时把吞吐从 217.8 降到 164.4 tok/s。它把批大小 1 的速度从 42.0 抬到 92.5 tok/s。修法是只在小批上跑推测。

**draft 读不了长 prompt。** Issue #6783（2025-05-30）：带 EAGLE-3 的 Llama-3.3-70B FP8 在 1k 输入时接受 3.2 个 token，3k 时 1.6，10k 时 1.2。在 10k 时它产出 63.9 tok/s，对没有推测的 102.7。draft config 有 2,048 个位置，没有 rope scaling。给 draft config 加上 Llama 3 rope scaling 和 131,072 个位置修好了它。

**加载器 bug 藏起了专家权重。** David Noel Ng {{field David Noel Ng 2026-08}} 发现 SGLang 在 DeepSeek-V4-Flash 上比 vLLM 慢。接受是 1.3 到 1.8 个 token，只有一条日志警告指向原因。draft 加载器从未把共享专家权重映射进融合槽。本地修好之后，decode 从 115.7 到 176.0 tok/s，PR #33276 在上游修好了它。

```takeaways
- 为低并发交互流量打开 speculative decoding，并量它在哪里停止赢。
- 只要设了 --speculative-algorithm，就显式设 --max-running-requests。
- 在信任加速之前，在你自己的 prompt 上读 decode 日志里的 accept len。
- 用真实输出长度和 --disable-ignore-eos 测推测，并对比 P99 ITL 和 P99 TTFT，不要只比中位。
- 对照你最长的 prompt 检查 draft 模型上下文长度。
- 把 SGLANG_ALLOW_OVERWRITE_LONGER_CONTEXT_LEN=1 当成去掉的检查，并自己测长 prompt。
```

Sources: capture/gpu/out-gb10/server-eagle3.log, capture/gpu/out-l4/server-eagle3-no-env.log, capture/gpu/out-l4/server-load-eagle3.log, capture/gpu/summary/l4.json, server-eagle3.command.txt, eagle3-bench-random-c1.txt, eagle3-bench-random-c8.txt, eagle3-bench-random-c32.txt, capture/gpu/summary/gb10.json, python/sglang/srt/configs/model_config.py (_derive_context_length), docs/cookbook/specbundle/specbundle_usage.mdx, python/sglang/srt/speculative/eagle_worker_v2.py (forward_batch_generation), speculative/eagle_utils.py (build_tree_kernel_efficient, eagle_sample), arg_groups/speculative_hook.py (_auto_choose_speculative_params, _handle_eagle_family, _handle_ngram, _disable_overlap_schedule_for_cpu, _resolve_speculative_algorithm_alias), arg_groups/fields/spec.py, managers/tokenizer_manager.py (speculative meta_info), python/sglang/benchmark/datasets/random.py (sample_random_requests), python/sglang/benchmark/datasets/speed_bench.py, python/sglang/benchmark/serving.py (--disable-ignore-eos), docs/docs/advanced_features/speculative_decoding.mdx (the NGRAM row), managers/scheduler_components/metrics_reporter.py, and observability/metrics_collector.py at v0.5.22; issues #5274 and #6783; PR #33276; field reports by Ant Group on the LMSYS blog (2025-09-26) and David Noel Ng (2026-08-04); vendor reports by Google Cloud (2025-11-25) and Modal with Decagon (2025-11-13); Abramovich and others, SPEED-Bench: A Unified and Diverse Benchmark for Speculative Decoding, arXiv 2604.09557 (2026-02, revised 2026-05), Kumar, Sanghavi, and Das, Test-Time Speculation, arXiv 2605.09329 (2026-05), capture/gpu/out-l4/eagle3-acceptance-by-position.txt, Agrawal and others, On Evaluating Performance of LLM Inference Serving Systems, arXiv 2507.09019 (2025-07), capture/gpu/out-l4/spec-real-prompts.txt, capture/gpu/out-l4/eagle3-long-outputs.txt.
