# SGLang 作为 RL rollout 引擎

> 在强化学习里，服务器成为训练循环的一部分，所以它的内存、它的权重与它的对数概率都成了训练器的问题。

你用 GRPO 训练一个模型。每一步，推理服务器写出成千上万条答案，奖励函数给它们打分，训练器更新权重。然后服务器必须用新权重回答下一批提示，而且就在训练器刚用过的同一批 GPU 上。为聊天构建的服务引擎从来不必交回内存，或在运行时改权重。它也从来不必与另一个程序对齐到最后一个比特。

读完本节后，你能描述一步以 SGLang 为 rollout 引擎的 RL，并点名每一阶段调用的 SGLang 端点。你也能选一种权重传输方法，并说出「true on-policy」覆盖什么、不覆盖什么。例子是 Miles v0.1.2（commit `a22fd824`），也就是 RadixArk 在 SGLang 旁边维护的那套 RL 框架。

## 在过时数字上训练的收据 {#s-sglang-as-an-rl-rollout-engine-the-receipt-for-training-on-stale-numbers}

Miles 是 slime 的一个 fork，slime 是 THUDM 的一套 RL 框架，并保留 slime 的历史。RadixArk 把它描述为 "Enterprise-Grade Reinforcement Learning for Large-Scale Model Post-Training"。文档从不定义 "enterprise"。在代码里它意味着三件事：rollout 与训练之间的正确性检查、从引擎故障恢复，以及可观测性。

每一项都存在，因为 RL 改变了推理服务器是什么。服务器的输出就是训练数据。它报告的对数概率是 PPO 与 GRPO 比率里的「旧策略」。所以 SGLang 内核与训练器内核之间的任何数值差，都会变成梯度里的偏差。Miles 是在服务器没有产出的数字上训练的收据。

## 借用服务器的那个循环 {#s-sglang-as-an-rl-rollout-engine-the-loop-that-borrows-the-server}

训练驱动故意写得很短。在 v0.1.2，`train.py` 有 175 行。这些是训练器与 SGLang 共享 GPU 时一步的那些行：

```python
for rollout_id in range(args.start_rollout_id, args.num_rollout):
    await inference_controller.prepare_rollout(rollout_id)
    rollout_data_pack = await rollout_executor.get(rollout_id)

    if args.offload_rollout:
        ...
            offload_tags = [GPU_MEMORY_TYPE_CUDA_GRAPH]
            if "kv_cache" in args.offload_rollout_level:
                offload_tags.append(GPU_MEMORY_TYPE_KV_CACHE)
            if "weight" in args.offload_rollout_level:
                offload_tags.append(GPU_MEMORY_TYPE_WEIGHTS)
            await inference_controller.offload(tags=offload_tags)
    ...
        await actor_model.train(rollout_id, rollout_data_pack)
    ...
            await offload_train()
            if args.offload_rollout:
                await inference_controller.onload_weights()
        await update_weights(args, actor_model, rollout_executor, inference_controller, rollout_id=rollout_id)
        if args.offload_rollout:
            await inference_controller.onload_kv()
```

把它读成一次租借。SGLang 生成并给 rollout 打分。SGLang 释放它的 CUDA graph、KV 缓存与权重。训练器加载、训练，并卸下自己。SGLang 拿回权重，接收新权重，然后再拿回 KV 缓存与 CUDA graph。[图 7.2b](#fig-7-2b) 展示每一阶段 GPU 上有哪些内存。

```figure
id: fig-7-2b
kind: timeline
title: GPU memory across one colocated RL step
claim: SGLang and the trainer never hold the GPU at the same time in this mode, and SGLang gets its KV cache back only after the new weights arrive.
caption: Read left to right, one column per phase of train.py. A filled cell means the memory is on the GPU. From train.py and inference_controller.py in Miles at v0.1.2.
```

## 库存 SGLang 给训练器什么 {#s-sglang-as-an-rl-rollout-engine-what-stock-sglang-gives-the-trainer}

这次租借通过库存 v0.5.22 里就有的 SGLang HTTP 端点工作 {{code}}。SGLang 的 RL 指南陈述了设计规则。SGLang 充当训练器调用的库，而不是拥有循环的框架 {{docs}}。Miles 把每个引擎当作普通的 `sglang serve` 进程、经 HTTP 驱动。

**内存释放：** `POST /release_memory_occupation` 按标签释放 GPU 内存，`POST /resume_memory_occupation` 把它交回。服务器需要 `--enable-memory-saver`，默认是关的。标签是 `kv_cache`、`weights` 与 `cuda_graph`。文档只列前两个，代码接受全部三个，所以以代码为准。内存节省器释放物理内存但保留虚拟地址，所以已捕获的 CUDA graph 在不必重新捕获的情况下仍然有效。该调用断言服务器空闲，所以先暂停生成。

**暂停与恢复：** `POST /pause_generation` 接受一个模式。SGLang 的默认是 `abort`，它结束每一个在跑的请求。Miles 默认用 `retract`，它把在跑的请求放回等待队列，好让它们在更新后再做一次 prefill。第三种模式 `in_place` 保留它们来自旧权重的 KV 缓存。

**权重更新会话：** `begin_weight_update`，然后一次或多次 `update_weights_from_*` 调用，然后 `end_weight_update`。会话存在，是因为量化层在加载之后需要一次一次性的 repack。每个 refit 做一次比每个 bucket 做一次更便宜。会话之后，`update_weight_version` 盖上新版本。一条活过一次 refit 的请求在其 `meta_info` 里报告 `weight_versions` 跨度，所以你能看到哪些 token 来自哪些权重。[图 7.2](#fig-7-2) 展示一次用默认传输的更新。

```figure
id: fig-7-2
kind: sequence
title: one weight update between Miles and SGLang
claim: A weight update is a session: pause, begin, send every bucket, end with one repack, set the version, and resume.
caption: Read top to bottom. Rows 3 and 4 repeat once per bucket of the default NCCL broadcast transfer. From weight_update/session.py and protocols/broadcast.py in Miles at v0.1.2 and the endpoints in http_server.py at v0.5.22.
```

## 移动权重的四种方式 {#s-sglang-as-an-rl-rollout-engine-four-ways-to-move-the-weights}

Miles 用 `--update-weight-transfer-mode` 挑选传输 {{code}}：

| Mode | How the bytes move | Where it fits |
|---|---|---|
| `broadcast`（默认） | 每个流水线阶段一个 NCCL 组，训练器 rank 0 把每个 bucket 广播给每一块引擎 GPU | 分开的训练器与引擎 GPU |
| `broadcast_packed` | 同一组，每个 bucket 一个扁字节张量 | Megatron，非共置 |
| `p2p` | Mooncake RDMA 写入每个引擎 rank 公布的 GPU 地址 | 多节点 MoE |
| `disk-delta` | 检查点的改动字节去共享存储，每个引擎修补本地副本 | 没有 RDMA 或 NCCL 路径 |

带 `--colocate` 时，Miles 忽略这个标志，并总是经 `/update_weights_from_tensor` 发送 CUDA IPC 句柄。一个在共置跑上设 `p2p` 的团队测的是错的东西，永远不会知道。

**Miles 团队报告** 在 H100 集群上、1 GB bucket 的 P2P 计时 {{team 2026-10}}。Qwen3-235B-A22B 在 8 个节点上从 NCCL broadcast 的 10,754 ms 降到 3,162 ms，少 71%。Kimi-K2 在 32 个节点上从 53,279 ms 降到 7,227 ms，少 86%。在一个节点上 P2P 更慢：GLM-4.7-9B-Flash 多花 68.6%，一个 4 层 GLM-5 测试多花 72.2%。理由在设计里。Broadcast 把完整模型发给每一个引擎 rank，而有专家并行时每个 rank 只需要其中一部分。

**RadixArk 报告** 一步大约有 2% 的 BF16 参数变化 {{team 2026-08}}。对 GLM-4.7-Flash，disk-delta 载荷从每次更新 62.4 GB 降到 0.69 到 0.83 GB，生成暂停 3 到 5 秒。这些是他们在 2026-08-18 Miles v0.1 帖子里的数字。我们没有复现它们。

**我们的立场：** 从一个节点上共置、走 CUDA IPC 路径开始。只有当 rollout 时间主导这一步时，才移到分开的 GPU。只为多节点 MoE 选 `p2p`，那里厂商表展示了增益，其他地方都留着 `broadcast`。

## True on-policy，以及它停在哪里 {#s-sglang-as-an-rl-rollout-engine-true-on-policy-and-where-it-stops}

在这里服务引擎与训练器必须在一个数字上达成一致。给 SGLang 与 Megatron 或 FSDP 同样的权重与同样的 token。它们的内核仍可能返回不同的对数概率，因为它们的归约以不同顺序跑。然后 PPO 比率把「策略变了」与「内核不同」混在一起。Miles 把差距报告为 `train/train_rollout_logprob_abs_diff`，在 true on-policy 模式下它应该正好是 0。

两个 SGLang 事实先要紧。除非请求是贪心的或设了 `SGLANG_RETURN_ORIGINAL_LOGPROB`，SGLang 在温度缩放之后返回对数概率，如[第 4.6 节](#s-deterministic-inference-and-logprobs)所解释。有时 rollout 以不是 1 的温度采样，而训练器在温度 1 上计算对数概率。然后训练器看到的不匹配并不是任何内核造成的。

第二，`--rl-on-policy-target` 在 v0.5.22 只接受一个值 `fsdp`，并且它强制确定性推理 {{code}}。该模式用 batch 不变的版本替换矩阵乘、softmax 与范数内核，并强制用 PyTorch 采样器。它也会关掉 radix 缓存，除非注意力后端是 `fa3`、`fa4`、`triton` 或 `ascend`。

Miles 在此之上用一套启动计划，在两侧设匹配的标志。覆盖面很窄。在 v0.1.2，唯一的模型配置文件是 Qwen3 稠密：Qwen3-0.6B、Qwen3-4B、Qwen3-4B-Base 与 Qwen3-4B-Instruct-2507。Miles 仓库里的三个未决 issue 展示按位奇偶仍在哪里断裂：

- **Issue #1485：** Qwen3-4B 的 `down_proj` 输出在张量并行 2 时不同。SGLang 把 38 个部分结果按两组各 19 个相加，Miles 用成对树相加。BF16 加法不是结合的 {{issue radixark/miles#1485}}。
- **Issue #3714：** 确定性服务把 NCCL channel 上限钉在 8，而训练器用 24。权重传输随后以 `Message truncated : received 6144 bytes instead of 2048` 失败 {{issue radixark/miles#3714}}。
- **Issue #3277：** retract 之后，在新权重下重新 prefill 会覆盖已记录的 MoE 路由。响应随后带着新路由与旧对数概率 {{issue radixark/miles#3277}}。

**我们的立场：** 把 true on-policy 当作 Qwen3 稠密模型的诊断，而不是每一次跑的开关。无论如何每一次跑都记下对数概率差距。大差距意味着转换或内核问题，没有 RL 算法能修好它。

## 我们在 GB10 上用 Miles 测到了什么 {#s-sglang-as-an-rl-rollout-engine-what-we-measured-with-miles-on-a-gb10}

我们在一块 NVIDIA GB10 上用 `radixark/miles:latest` 镜像跑 GRPO。镜像持有 Miles commit `08752a12` 与 SGLang `0.5.22.dev46+g7b6993a`。模型是 GSM8K 上的 `Qwen/Qwen3-0.6B`，FSDP 与 SGLang 共置在那一块 GPU 上。12 步里每一步对 32 条提示各采样 8 次，最多 1,024 个响应 token，温度 1。SGLang 的内存比例是 0.4。

```listing
title: one GRPO step, as Miles logs it
source: capture/gpu/out-miles/plain-excerpt.log
lang: text
note: The rollout and training metrics of the first step, one weight update, and one warning. Long lines are cut.
---
metrics.py:94 - perf 0: {'rollout/raw_reward_unfiltered': 0.62890625, 'rollout/num_training_samples': 256, 'rollout/episode_raw_reward': 0.62890625, 'rollout/episode_response_length/mean': 739.92578125, 'rollout/episode_response_length/median': 759.5, 'rollout
{'train/loss': -4.656612873077393e-10, 'train/pg_loss': -4.656612873077393e-10, 'train/entropy_loss': 0.0, 'train/pg_clipfrac': 0.0, 'train/ppo_kl': 0.0, 'train/ess_ratio': 1.0, 'train/train_rollout_logprob_abs_diff': 0.015336457639932632, 'train/train_rollout_kl': 0.0006840902497060597, 'train/grad_norm': 0.5216571092605591, 'train/lr-pg_0': 1e-06, 'train/step': 0}
timer.py:42 - Timer update_weights end (elapsed: 0.7s)
[2026-10-17 15:55:01] post-warmup freeze_gc failed
```

**我们测到**按阶段的步时间。SGLang rollout 中位花 57.2 秒，大约每秒 3,113 个 token。训练器随后用 25.2 秒重新计算对数概率，用 80.3 秒训练。经 CUDA IPC 把权重更新进 SGLang 花 0.65 秒。释放 SGLang 内存中位花 0.8 秒、最多 4.0 秒，拿回花 0.9 秒。

```figure
id: fig-7-2c
kind: chart
title: One GRPO step on a GB10, by phase
claim: On one GB10, the trainer phases took 1.8 times as long as the SGLang rollout, and the weight update took under a second.
caption: Median seconds per phase over 12 steps. Blue is SGLang generation, violet is the trainer, and amber is the weight update and the memory release between them. From capture/gpu/summary/miles-gb10.json.
```

在这个规模上，rollout 不是瓶颈。对一块 GPU 上的 0.6B 模型，更快的服务引擎最多大约能省下这一步的三分之一，35%。权重更新与内存释放，也就是本节大部分内容所关于的，花 2.4 秒。从各阶段中位相加，这一步大约花 165 秒。

对数概率差距在全部 12 步里停在 0.0143 与 0.0163 之间。那就是 true on-policy 模式要把它赶到 0 的那个数字，而普通模式不会动它。原始奖励在 0.586 与 0.758 之间上下。十二步太少，显示不出学习，所以把这次跑读成一次计时与一个差距，而不是一条训练曲线。

### 四十八步 {#s-sglang-as-an-rl-rollout-engine-forty-eight-steps}

然后我们用同样的设置把同一份工作跑了 48 步：内存比例 0.4 与温度 1，先用默认种子。在那些步里策略开始学习，rollout 也随之变快。

```listing
title: the last GRPO step of 48
source: capture/gpu/out-miles/plain-48-excerpt.log
lang: text
note: The rollout and training metrics of step 47, the scheduler exit, and the job status. Long lines are cut.
---
metrics.py:94 - perf 47: {'rollout/raw_reward_unfiltered': 0.79296875, 'rollout/num_training_samples': 256, 'rollout/episode_raw_reward': 0.79296875, 'rollout/episode_response_length/mean': 421.73046875, 'rollout/episode_response_length/median': 369.5, 'rollou
{'train/loss': -3.4924596548080444e-09, 'train/pg_loss': -3.4924596548080444e-09, 'train/entropy_loss': 0.0, 'train/pg_clipfrac': 0.0, 'train/ppo_kl': 0.0, 'train/ess_ratio': 1.0, 'train/train_rollout_logprob_abs_diff': 0.014126655645668507, 'train/train_rollo
Subprocess scheduler_0 (pid=3263) crashed with exit code -15. Triggering SIGQUIT for cleanup...
Job 'raysubmit_MKE9XLVeZ87U7iQV' succeeded
```

**我们测到**前 8 步平均原始奖励 0.636，后 8 步 0.758。响应变短了。它们的平均长度从 724 降到 447 个 token，在 1,024 token 上限被截断的样本份额从 0.33 降到 0.08。SGLang 要做的 token 更少，所以 rollout 从每步 60.2 秒降到 32.7 秒。它的速率从每秒 3,084 升到 3,501 个 token。

```figure
id: fig-7-2d
kind: chart
title: Forty-eight GRPO steps on a GB10
claim: Over 48 steps the raw reward went up from a mean of 0.636 to 0.758, and the share of cut samples went down from 0.33 to 0.08.
caption: Raw reward and the share of samples cut at 1,024 tokens for each step of the default seed. The dashed lines are the raw rewards of seeds 2 and 3. The means are over the first 8 and the last 8 steps. From capture/gpu/summary/miles-gb10.json.
```

从一步到下一步，奖励最多变了 0.207，从第 30 步的 0.801 到第 31 步的 0.594。从 8 步均值读趋势，不要从一步读。

对数概率差距没有动。前 8 步是 0.0153，后 8 步是 0.0146，在全部 48 步里停在 0.0138 与 0.0162 之间。在这 0.6B 跑的 48 步里，训练没有合上差距。Miles 把差距归因于 SGLang 与 FSDP 内核之间的差异。True on-policy 模式是 Miles 处理它的那一部分。

最后几行日志也需要一句说明。SGLang 调度器打印了 `crashed with exit code -15`，然后 Ray 作业报告成功。退出码 -15 表示调度器收到了 SIGTERM，这里是在已完成作业的末尾。对作业状态报警，不要只对那一行报警。

在你信任一次跑之前，值得知道两行日志。12 步跑里大约 30% 的样本撞上 1,024 token 上限，48 步里是 20%。所以奖励里包括在结束前被截断的答案。而且 SGLang 在启动时打印了一次 `post-warmup freeze_gc failed`。训练在那之后正常跑，所以这里警告没有代价。

### 另外两个种子 {#s-sglang-as-an-rl-rollout-engine-two-more-seeds}

我们用 `MILES_SEED=2` 与 `MILES_SEED=3` 又各跑了同样的 48 步。该变量设定训练种子与 rollout 种子。GB10 在 2026-10-18 这份负载下关了三次机，其启动列表显示那天有三次短启动。所以这些跑有一个守卫。一个脚本在 GPU 到 84 C、或前 30 分钟到 80 C 时暂停容器。它在大约 45 到 60 秒后、在 72 C 或以下时恢复容器。

在种子 2 与 3 的 9.3 小时里，容器大约有 58% 的时间处于暂停。暂停停下进程，并不改它的算术。所以我们把奖励、长度、截断份额与对数概率差距读作有效。我们没有用同一个种子的暂停与未暂停跑做过测试。Rollout 时间则不是，我们不为种子 2 与 3 报告它们。

```listing
title: the last step of seed 2
source: capture/gpu/out-miles/plain-48-s2-excerpt.log
lang: text
note: The rollout and training metrics of step 47 with MILES_SEED=2, and the job status. Long lines are cut.
---
metrics.py:94 - perf 47: {'rollout/raw_reward_unfiltered': 0.6484375, 'rollout/num_training_samples': 256, 'rollout/episode_raw_reward': 0.6484375, 'rollout/episode_response_length/mean': 514.0390625, 'rollout/episode_response_length/median
{'train/loss': -5.122274160385132e-09, 'train/pg_loss': -5.122274160385132e-09, 'train/entropy_loss': 0.0, 'train/pg_clipfrac': 0.0, 'train/ppo_kl': 0.0, 'train/ess_ratio': 1.0, 'train/train_rollout_logprob_abs_diff': 0.014963770285248756,
Job 'raysubmit_y4umCbEa8Qp5Bbad' succeeded
```

| Mean, first 8 steps / last 8 steps | Default seed | Seed 2 | Seed 3 |
|---|---|---|---|
| Raw reward | 0.636 / 0.758 | 0.653 / 0.736 | 0.614 / 0.766 |
| Response length, tokens | 724 / 447 | 712 / 480 | 734 / 456 |
| Share cut at 1,024 tokens | 0.33 / 0.08 | 0.30 / 0.12 | 0.34 / 0.09 |
| Log-probability gap | 0.0153 / 0.0146 | 0.0153 / 0.0150 | 0.0156 / 0.0146 |

**我们测到**三个种子都是同样的结果。奖励上升，响应变短，被截断的更少。对数概率差距在全部 144 步里停在 0.0136 与 0.0164 之间。从一步到下一步奖励的最大变化，三个种子分别是 0.207、0.160 与 0.203。

### True on-policy 在 GB10 上没有启动 {#s-sglang-as-an-rl-rollout-engine-true-on-policy-did-not-start-on-a-gb10}

然后我们用 Miles Triton 例子的标志设了 `--true-on-policy-mode`。SGLang 启动了，训练器在启动器开始后 61 秒停下。

```listing
title: the FSDP trainer rejects the Triton attention
source: capture/gpu/out-miles/true-on-policy-error.log
lang: text
note: The first launcher line, the trainer error, and the failed init. Long lines are cut.
---
[2026-10-17 16:28:41.340 launcher] common.py:290 - EXEC: mkdir -p /root/lab/mode
ValueError: Specified `attn_implementation="triton"` is not supported. The only possible arguments are `attn_implementation="eager"`, `"paged|eager"`, `"attn_implementation=flash_attention_2"`, `"attn_implementation=paged|flash_attention_2"`, `"attn_implementa
[2026-10-17 16:29:42.606 trainer_controller_actor] cell.py:251 - ft op=execute phase=fail cell=trainer-engine-actor-00000 fn=init elapsed_s=0.7
```

标志值来自错误的例子。在 FSDP actor 里，SGLang Triton 注意力桥只在设了 `torch.version.hip` 时打开，也就是 AMD GPU {{code}}。在 NVIDIA GPU 上该值直接进到 transformers，而 transformers 没有叫 `triton` 的注意力。

Miles 里唯一的 true on-policy 合约把 SGLang 的 `fa3` 后端与 FSDP 里的 `flash_attention_3` 配对 {{code}}。我们用合约标志又跑了一次作业，看它停在哪里。

```listing
title: the contract flags on a GB10
source: capture/gpu/out-miles/true-on-policy-fa3-error.log
lang: text
note: The SGLang start, its failure, and the first and last of the rollout errors that followed. Process prefixes are cut.
---
[2026-10-17 21:03:03] Enable deterministic inference because of legacy rl_on_policy_target.
AssertionError: FlashAttention v3 Backend requires SM>=80 and SM<=90. Please use `--attention-backend flashinfer`.
[2026-10-17 21:03:24] Received sigquit from a child process. It usually means the child failed.
[2026-10-17 21:03:30.637 rollout_executor] http_utils.py:241 - Error: Server error '503 Service Unavailable' for url 'http://172.17.0.3:20035/generate'
[2026-10-17 22:06:46.137 rollout_executor] http_utils.py:241 - Error: Server error '503 Service Unavailable' for url 'http://172.17.0.3:20035/generate'
```

SGLang 在启动 21 秒后停下。它的 FA3 后端接受从 SM 8.0 到 SM 9.0 的 GPU，而 GB10 是 SM 12.1。用我们跑的 Miles 镜像、在 commit 08752a12，唯一的 true on-policy 合约需要 FA3，所以它不能在 GB10 上启动。

接下来发生的事是要记住的部分。Rollout 引擎没了，但 Miles 作业没有停。它的 rollout 循环继续向路由器发请求，路由器回答 `503 Service Unavailable`。日志在 63 分钟里大约持有 200,000 条那样的错误，直到我们停掉容器。作业从未报告失败。我们没有在那一小时里记录 GPU。

**我们对 GB10 结果的立场：** 在你计划一次 true on-policy 跑之前，先检查你的 GPU 与镜像是否两边都有合约的内核。然后看 SGLang 服务器日志，不要只看训练器，因为死掉的 rollout 引擎可以看起来像慢的那个。在我们跑的镜像里，在 Miles commit 08752a12，那份合约意味着两侧都用 FlashAttention 3，一条为 Hopper GPU 写的路径。

## Miles 跑在自己的 SGLang 上 {#s-sglang-as-an-rl-rollout-engine-miles-runs-on-its-own-sglang}

Miles 不用本手册其余部分描述的那份 SGLang 发布。它的 Docker 镜像建在 `lmsysorg/sglang:v0.5.21` 上，并检出 `sglang-miles` 分支。v0.1.2 发布锁把 SGLang 钉在 commit `b84bec5761a6`。Miles 文档说得很直白：装在 Miles 旁边的库存 `sglang` 或上游 Megatron-LM 不能工作 {{docs}}。

至少有四件 Miles 调用的东西在 v0.5.22 不存在：disk-delta 的 `/pull_weights` 端点、`register_lora_adapter`、`get_parallelism_info`，以及 `--true-on-policy-contract` 标志。

那个分支是本节的一份公允摘要。RL 向服务引擎要服务用户从未要过的东西。它必须交回内存，并在一个会话里改权重。它必须报告哪些权重产出了每个 token，并与另一个程序按位对齐。其中一些请求现在已在库存 SGLang 里。其余的住在分支上，直到它们就绪。

**一次真实事故：** Miles 仓库的 issue #860 报告 `/release_memory_occupation` 对带滑动窗口注意力的模型「静默什么都不做」 {{issue radixark/miles#860}}。滑动窗口 KV 池在其构造函数里关掉内存节省器，所以一次共置跑在 Megatron 启动时会耗尽内存。一个用户看到 DeepSeek-V4-Flash 上 30.19 GB 的 KV 池一直驻留。该 issue 在 2026-10-16 仍开着。在信任共置之前，先检查每一个内存标签在新模型上是否真的释放内存。

```takeaways
- 钉死 Miles 镜像及其发布锁，永远不要把库存 SGLang 混进去。
- 在释放内存之前先暂停生成，因为释放断言服务器空闲。
- 从一个节点上共置开始，并预期 `--colocate` 会覆盖传输模式。
- 只为多节点 MoE 跑选 `p2p`，并先测更新时间。
- 每一次跑都记下 rollout 与训练的对数概率差距。在我们的 48 步跑里，训练没有合上它。
- 从若干步的均值读奖励，因为一步可以把它挪动 0.2。
- 当 GPU 跑热时暂停一次长 RL 作业。我们预期暂停只改计时，我们没有直接测过这一点。
- 当 rollout 温度不是 1、而训练器在温度 1 上计算对数概率时，设 `SGLANG_RETURN_ORIGINAL_LOGPROB`。
- 在 v0.1.2 把 true on-policy 当作 Qwen3 稠密诊断。
- 检查你的 GPU 与镜像是否两边都有 true on-policy 合约的内核。
- 对 rollout 服务器自己的错误报警，因为训练器可以在死掉的引擎上一直等。
```

Sources: Miles at v0.1.2 (a22fd824): train.py, release-lock.json, docker/Dockerfile, docs/developer/versions.md, miles/ray/rollout/inference_controller.py, miles/backends/training_utils/weight_update/protocol.py, session.py, protocols/broadcast.py, protocols/cuda_ipc.py, protocols/p2p.py, protocols/delta.py, miles/true_on_policy/model_profiles.py, docs/advanced/p2p-weight-transfer.md; SGLang at v0.5.22: python/sglang/srt/entrypoints/http_server.py, python/sglang/srt/managers/io_struct.py (PauseGenerationReqInput), python/sglang/srt/managers/scheduler_components/weight_updater.py, python/sglang/srt/constants.py, python/sglang/srt/arg_groups/fields/exec_.py, python/sglang/srt/arg_groups/choices.py, python/sglang/srt/arg_groups/attention_hook.py, python/sglang/srt/layers/logprob_processor.py, docs/docs/advanced_features/sglang_for_rl.mdx; Miles issues #860, #1485, #3277, #3714; RadixArk and LMSYS posts: lmsys.org/blog/2025-11-19-miles and lmsys.org/blog/2026-08-18-miles-v0-1. Miles at 08752a12: miles/backends/fsdp_utils/actor.py, miles/true_on_policy/schema.py, examples/infra_features/true_on_policy/run_simple.py and run_simple_amd_triton.py. capture/gpu/miles_grpo.py, capture/gpu/miles_summary.py, capture/gpu/out-miles/plain-excerpt.log, capture/gpu/out-miles/plain-48-excerpt.log, capture/gpu/out-miles/plain-48-s2-excerpt.log, capture/gpu/out-miles/plain-48-s3-excerpt.log, capture/gpu/out-miles/plain-48-thermostat.log, capture/gpu/out-miles/true-on-policy-error.log, capture/gpu/summary/miles-gb10.json. capture/gpu/out-miles/true-on-policy-fa3-error.log, capture/gpu/incidents/gb10-boot-list.txt
