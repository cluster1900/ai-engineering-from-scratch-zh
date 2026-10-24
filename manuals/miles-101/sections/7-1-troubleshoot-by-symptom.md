# 按症状排查问题

> 从你看到的现象开始，每个条目都给出可能的原因、检查方法和修复方法。

前六个条目是我们在 GB10 上遇到的问题：五种失败运行的症状和一种发热带来的计时影响。第七个以我们的健康运行作为参照。第八个来自 Miles 和 SGLang 的源码与文档。其余条目来自 Miles issue 跟踪器中的报告。我们没有复现第八个及其余条目。

读完本节后，你能从一次失败或出错的运行的第一个症状找到它的原因。

```figure
id: fig-7-1
kind: decision
title: Start from what you see
claim: Each of the five symptoms we hit has one first check and one fix.
caption: Five of the symptoms from our runs. The entries below also cover a run that hangs on a missing reward module. They add a check against healthy runs, one entry from the documentation, and five from issue reports.
```

## GPU 空闲而日志不断增长 {#s-troubleshoot-by-symptom-the-gpu-is-idle-and-the-log-keeps-growing}

- **原因：** rollout 引擎死了，而训练器还在不断向它发送请求。
- **检查：** 统计日志最后几分钟里每分钟出现的 `503 Service Unavailable` 次数。我们失败的运行在一个小时内每个完整分钟都写了 2,600 次以上。一次每个提示 16 个回答的健康运行只会写出最长一分钟的短暂突发，之后就没有了。
- **修复：** 停止运行，然后阅读第一个 503 错误上方的引擎日志行。每次无人值守的运行都要带上[第 1.2 节](#s-add-a-watchdog)中的看门狗启动。

## 奖励导入出错后运行挂起 {#s-troubleshoot-by-symptom-the-run-hangs-after-a-reward-import-error}

- **原因：** Miles 无法导入 `--custom-rm-path` 指定的模块，通常是因为 `PYTHONPATH` 没有覆盖到实验文件夹。
- **检查：** 在日志中查找带有你的奖励模块名的 `ModuleNotFoundError`。它后面没有 `rollout 0` 行。
- **修复：** 运行不会自己停止，看门狗也不会停止它，因为引擎只写出少量 503 错误。在我们的测试中，任务一直挂了两个小时。停止容器，按[第 3.5 节](#s-write-a-custom-reward)修正 `PYTHONPATH`，然后重新启动运行。

## 引擎在启动时因 FlashAttention 3 错误而停止 {#s-troubleshoot-by-symptom-the-engine-stops-at-start-with-a-flashattention-3-error}

- **原因：** 运行在超出 FlashAttention 3 支持范围的 GPU 上请求了它，通常是通过真正同策略模式。
- **检查：** 在引擎日志中查找 `FlashAttention v3 Backend requires SM>=80 and SM<=90`。
- **修复：** 在非 Hopper GPU 上，放弃真正同策略模式，使用默认后端。[第 4.6 节](#s-know-the-true-on-policy-limits)解释了这一限制。

## 任务因 Ray OutOfMemoryError 而停止 {#s-troubleshoot-by-symptom-the-job-stops-with-a-ray-outofmemoryerror}

- **原因：** 在统一内存上，Ray 把整个节点当作一块内存来读取，而节点已接近满载。Ray 会停止超过其阈值的 worker。
- **检查：** 出现 `Memory on the node ... was 115.86GB / 121.69GB` 或类似的行，并且没有 CUDA 内存不足错误。
- **修复：** 使用更小的模型或每步更少的工作量，并把 Ray 阈值保留为默认值。降低引擎内存比例对我们的 4B 运行没有帮助。[第 2.3 节](#s-stop-ray-killing-the-job)有详细说明。

## 训练器拒绝注意力实现 {#s-troubleshoot-by-symptom-the-trainer-rejects-the-attention-implementation}

- **原因：** 训练器的注意力名称不被已安装的 transformers 库接受，比如 `triton`。
- **检查：** 出现一个 `ValueError`，其中列出了 transformers 接受的注意力实现。
- **修复：** 从那个列表中选一个。在我们的 GB10 上，我们把训练器的这项设置保留为默认值。

## 步时间在不同运行之间变化 {#s-troubleshoot-by-symptom-step-times-change-from-run-to-run}

- **原因：** 发热的 GPU 上出现温度暂停或时钟降低。我们预期样本和奖励保持不变，但还没有测试过。
- **检查：** [第 1.2 节](#s-add-a-watchdog-guard-the-gpu-heat)中温度保护的暂停日志，以及运行期间的 GPU 时钟。
- **修复：** 只为没有暂停的步计时，并且只在同一次会话内比较时间。[第 5.3 节](#s-repeat-a-run)给出了这条规则。

## 第 0 步的差距远高于你的范围 {#s-troubleshoot-by-symptom-the-gap-at-step-0-is-far-above-your-range}

- **原因：** 引擎和训练器不是从同一套权重开始，或者它们以不同格式读取了同一套权重。
- **检查：** 把第 0 步的 `train/train_rollout_logprob_abs_diff` 与你的健康运行比较。我们 Qwen3-0.6B 的值为 0.0148 至 0.0157。
- **修复：** 在运行用错误的数字训练之前停止它。检查两边的检查点路径。

## 引擎在启动时内存不足 {#s-troubleshoot-by-symptom-the-engine-runs-out-of-memory-at-start}

- **原因：** `--sglang-mem-fraction-static` 与 GPU 不匹配。使用 `--colocate` 时，引擎启动时训练器可能已经占用了 GPU 内存。比例太高会让激活和 CUDA graph 没有空间。比例太低会让 KV cache 没有空间。
- **检查：** 启动期间或第一个批次时，引擎日志行中出现 CUDA 内存不足错误，并且没有 `Ray OutOfMemoryError`。比例太低并不总会让引擎停止。请读 `KV Cache is allocated` 行中的 `#tokens`。在我们 0.02 的检查中，引擎启动时只有 3,082 个 token，第一次 rollout 用了 386 s，而 0.25 时是 61 s。
- **修复：** 第一种情况降低比例，第二种情况提高比例，每次调整 0.05 或 0.1。Miles 文档要求在 `--colocate` 下使用 0.8 或更低。我们的运行使用 0.4。[SGLang 101 第 3.2 节](https://aiengineeringfromscratch.com/manual-sglang-101.html#s-mem-fraction-static-and-startup-sizing)解释了引擎如何划分它的内存。

## 带小数的奖励函数让本应不动的组发生了变化 {#s-troubleshoot-by-symptom-a-reward-function-with-fractions-moves-a-group-that-should-stay-}

- **原因：** 跟踪器中的一份报告显示，一个 16 个回答、每个都得 0.3 分的组，因为 float32 舍入得到了很小的非零优势。0 和 1 的二值奖励不会遇到这个问题。
- **检查：** 某个组中每个回答的奖励都相同，但优势不为 0。
- **修复：** 使用 float32 能精确表示的奖励，或者自己检查这类组的优势。

## FSDP 上卸载之后训练出错 {#s-troubleshoot-by-symptom-training-goes-wrong-after-offload-on-fsdp}

- **原因：** 跟踪器中的一份报告显示，在两块或更多 GPU 上用 FSDP2 卸载训练器状态，可能会损坏大小不均的分片。
- **检查：** 第一次卸载之后出现非有限值、损失或梯度范数跳变，或者集合通信超时。模型中有无法在各 rank 之间均匀切分的层。
- **修复：** 用 `--no-offload-train` 运行一次并比较。关注那个 issue 以获取代码修复。

## 多块 GPU 上权重更新失败 {#s-troubleshoot-by-symptom-the-weight-update-fails-on-many-gpus}

- **原因：** 跟踪器中的两份报告。一份是带流水线阶段的共置更新在 NCCL 2.29 和 2.30 中配合一个 tuner 插件时崩溃，NCCL 2.31 修复了它。另一份是两块 GPU 上的确定性推理设置的 NCCL 通道数与训练器不同，传输因大小不匹配而失败。
- **检查：** 权重更新期间出现段错误或 `Message truncated` 错误。
- **修复：** 第一种情况把 NCCL 升级到 2.31 或更高版本。第二种情况在修复发布之前，关闭多 GPU 引擎上的确定性推理。

## 有数百个未完成请求时 rollout 变慢 {#s-troubleshoot-by-symptom-rollout-gets-slow-with-hundreds-of-open-requests}

- **原因：** 跟踪器中的一份报告测量到一项随未完成请求数增长的客户端开销。256 个未完成请求时为 4.8 s，1,536 个时为 43.7 s。
- **检查：** rollout 时间的增长快于样本数的增长。
- **修复：** 降低每个引擎的未完成请求数，或者关注那个 issue 中的客户端改动。

## 启动器停止了你自己启动的 Ray 集群 {#s-troubleshoot-by-symptom-the-launcher-stops-a-ray-cluster-you-started-yourself}

- **原因：** 跟踪器中的一份报告显示，六个 agent 示例启动器会停止命令行中含有 `sglang` 的所有进程。在 `MILES_SCRIPT_EXTERNAL_RAY=1` 下，这也会停止你的 Ray 集群。
- **检查：** 一次 Miles 运行结束时，你的其他 Ray 任务也停止了。
- **修复：** 从这些启动器中删除清理步骤，或者在 issue 修复之前给 Miles 一个它自己的 Ray 集群。

```takeaways
- 从日志中的第一个症状开始，先读引擎日志行，再读训练器日志行。
- 给每次无人值守的运行都加上看门狗。
- 把来自 issue 跟踪器的条目当作需要核实的报告，而不是我们测得的结果。
```

Sources: Miles training backend documentation at main 08752a12; SGLang memory sizing code in the image build 0.5.22.dev46; capture/gpu/out-gb10/engine-died-503.log; capture/gpu/out-gb10/engine-died-count.txt; capture/gpu/out-gb10/503-bursts.txt; capture/gpu/out-gb10/ray-oom-4b.log; capture/gpu/out-gb10/thermostat.log; capture/gpu/summary/miles-gb10-lab.json; manuals/sglang-101/capture/gpu/out-miles/true-on-policy-error.log; Miles issues 3649, 3714, 4003, 4019, 4134, 4238; capture/gpu/out-gb10/custom-rm-noenv-hang.txt (live check, 2026-10-23); capture/gpu/out-gb10/frac-low-kv.txt (live check, 2026-10-23).
