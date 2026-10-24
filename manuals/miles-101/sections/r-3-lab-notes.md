# 实验笔记

> 本手册中每个测量数字背后的机器、镜像、种子和温度规则。

本页是参考资料。它列出手册中每个数字是如何得到的，让你能重复运行或判断结果。

## 机器和镜像 {#s-ref-lab-notes-machine-and-image}

| 项目 | 值 |
|---|---|
| 机器 | NVIDIA DGX Spark，一块 GB10 GPU，128 GB 统一内存 |
| Ray 报告的内存 | 121.69 GB |
| 镜像 | `radixark/miles@sha256:c64fa344e3a86715f03c0a1b6a422c474e0035355591a2f6da87bf52a74c52da`，arm64 |
| 镜像中的 Miles | main `08752a1283`，2026-10-15 |
| 镜像中的 SGLang | `0.5.22.dev46+g7b6993a` |
| 模型 | `Qwen/Qwen3-0.6B`，除非运行名称给出了其他规模 |
| 数据 | GSM8K 提示，配合二值数学奖励 |

## 默认运行设置 {#s-ref-lab-notes-default-run-settings}

除非运行名称另有说明，每次运行都使用这些设置：

| 设置 | 值 |
|---|---|
| 每步的提示数 | 32（`--rollout-batch-size`） |
| 每个提示的回答数 | 8（`--n-samples-per-prompt`） |
| 每个优化器步的样本数 | 256（`--global-batch-size`） |
| 回答上限 | 1,024 个 token |
| 温度 | 1 |
| 学习率 | 1e-6，恒定 |
| 训练器 | 一块 GPU 上的 FSDP，与引擎共置 |
| 引擎内存比例 | 0.4 |
| 权重更新桶 | 536870912 字节，512 MiB |

## 运行 {#s-ref-lab-notes-runs}

| 运行 | 步数 | 种子 | 改了什么 |
|---|---|---|---|
| plain | 12 | 默认 | 无，温度保护之前 |
| plain-48 | 48 | 默认 | 无，温度保护之前 |
| plain-48-s2, plain-48-s3 | 48 | 2, 3 | 无 |
| e6a-base | 12 | 1 | 无 |
| e6b, e6c, e6d | 12 | 1 | 确定性推理，分别用 Triton、FlashInfer，以及再用一次 Triton |
| e11-topp-topk | 12 | 1 | top-p 0.95 和 top-k 64 |
| e3b, e3c, e3d | 12 | 1 | 只卸载 KV cache；在内存比例 0.25 下保持引擎加载；保持训练器加载 |
| e4-0.6b, e4-1.7b | 4 | 1 | 回答在 256 个 token 处截断，模型规模 |
| e2-n4, e2-n16 | 24 | 1 | 每个提示 4 个和 16 个回答 |
| e3e, e3f | 12 | 1 | 同一天的一对运行，内存比例 0.25，默认卸载与保持引擎加载 |
| e2b-dapo-filter | 12 | 1 | DAPO 零方差过滤器，每批 48 个提示 |

有四次运行失败，没有列入任何表格：两次在启动时停止的真正同策略运行，以及两次被 Ray 停止的 Qwen3-4B 运行。我们的运行队列为每次运行设置了时间限制，到时就停止容器。e2-n16 和 e2b-dapo-filter 运行在那时已经完成了所有步，正在关闭。汇总把它们标记为部分完成。

## 温度保护 {#s-ref-lab-notes-the-heat-guard}

GB10 在持续负载下会发热，所以有一个脚本在 GPU 达到 84 C 时暂停 Miles 容器。当 GPU 在至少 45 秒后降到 74 C 或以下时，或者最多 120 秒后，它会恢复容器。第一天的阈值是 80 C 和 68 C，当天上午改为 84 C 和 74 C。保护脚本停止时，会先恢复已暂停的容器，所以没有运行会一直停在暂停状态。

截至 2026-10-22，暂停日志记录了 1,005 次暂停，每次都有对应的恢复。

## 计时规则 {#s-ref-lab-notes-the-timing-rule}

暂停会给它所在的阶段增加挂钟时间。所以本手册中的每个时间都来自没有被暂停影响的步，只有一个例外。第 3.2 节的 DAPO 过滤器运行没有干净的步，所以它的 rollout 时间改为从每一步中扣除暂停时间：

- **rollout 时间：** rollout 窗口结束于 rollout 指标行的时间戳，持续 `perf/rollout_time`。当这个窗口不与任何暂停重叠时，这一步才计入。
- **整步时间：** 窗口结束于训练器指标行的时间戳，持续 `perf/step_time`。当这个窗口不与任何暂停重叠时，这一步才计入。

汇总文件同时存储两种中位数，即所有步的和干净步的，并在每个旁边注明干净步的数量。在温度保护下，很少有整步能避开暂停。所以本手册中的整步时间来自 `plain` 和 `plain-48`。两者都运行于我们加上温度保护之前，所以不可能有暂停影响它们。`plain-48` 于 2026-10-18 00:11 结束，而保护脚本当天 10:57 才记录了第一次暂停。

## 检查存储的输出 {#s-ref-lab-notes-check-the-stored-outputs}

采集工具包无需 GPU 就能检查存储的输出。它在 16 个回答的运行所存储的错误时间上重放看门狗规则。它还根据暂停日志重新标记暂停，并根据存储的步重新计算每个中位数。原始运行日志保留在 GB10 上。有了这些日志，工具包还能重新构建汇总，并与存储的汇总进行比较。

## 比较相同的步 {#s-ref-lab-notes-compare-the-same-steps}

基于干净步的中位数仍可能产生误导。默认设置在 `plain-48` 中给出了 47.5 s 的 rollout，在 `e6a-base` 的 6 个干净步中给出了 59.1 s。在相同的 6 个步号上，`plain-48` 用了 60.9 s。rollout 时间随回答长度变化，所以请在相同的步号上比较时间。

## 来自单次运行的结果 {#s-ref-lab-notes-results-from-one-run}

这些数字只基于一次运行，使用它们的每一页都会注明：

- 第 2.2 节中保持引擎加载时的 rollout 时间。同一天的一对运行在一个种子上给出了 1% 至 3%。
- 第 4.5 节中确定性推理的代价。
- 第 3.1 节中 4 个和 16 个回答的组大小。
- 第 3.2 节中 DAPO 过滤器的奖励和 rollout 代价。它的 rollout 时间扣除了暂停时间，因为没有一步是干净的。


## 为什么第一对卸载运行不成立 {#s-ref-lab-notes-why-the-first-offload-pair-does-not-hold}

我们的第一对运行比较了 `e6a-base` 和 `e3c`。它显示默认设置的干净 rollout 中位数为 59.1 s，保持引擎加载时为 52.0 s，提升了 12%。这两次运行还使用了不同的引擎内存比例，分别为 0.4 和 0.25，而且它们的干净步是不同的步。

第 10 步在两次运行中都是干净的。保持引擎加载时用了 46.7 s，回答长度为 599 个 token。默认设置用了 56.3 s，回答长度为 695 个 token。rollout 时间随回答长度变化，所以较短的回答解释了这个差距的大部分。随后同一天的一对运行 `e3e` 和 `e3f` 只改变了卸载设置，给出了 1% 至 3%。

Sources: capture/gpu/heat-guard.sh; capture/run.py; capture/gpu/watchdog_replay.py; capture/gpu/out-gb10/image-identity.txt; capture/gpu/miles_grpo.py; capture/gpu/summarize_miles.py; capture/gpu/summary/miles-gb10-lab.json; capture/gpu/out-gb10/thermostat.log; capture/gpu/out-gb10/unpaused-timing.txt; capture/gpu/out-gb10/ray-oom-4b.log.
