---
id: training-memory-checkpoints
title: Training Memory, Accumulation and Checkpoints
code: TM
subtitle: 修复 NaN 步、内存上限、梯度累积缩放和失败的续训。裁剪、AMP、重计算、原子 checkpoint。
hue: 20
sources: phases/10-llms-from-scratch/34-gradient-checkpointing, phases/19-capstone-projects/45-gradient-clipping-amp, phases/19-capstone-projects/46-gradient-accumulation, phases/19-capstone-projects/47-checkpoint-save-resume, phases/19-capstone-projects/80-checkpoint-sharded-resume, phases/19-capstone-projects/81-end-to-end-distributed-train
source_hash: 0ea0fe65eca26d48
---

## 训练症状
type: troubleshooting
from: phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md, phases/19-capstone-projects/46-gradient-accumulation/docs/en.md, phases/19-capstone-projects/47-checkpoint-save-resume/docs/en.md, phases/10-llms-from-scratch/34-gradient-checkpointing/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| 一个 batch 后 loss 直线飙升 | 梯度范数尖峰，且没有裁剪 | 用 `clip_grad_norm_`，`max_norm = 1.0` |
| 一步之后所有权重都是 NaN | FP16 溢出得到 Inf，进而变成 NaN | 由 `torch.amp.GradScaler` 跳过这一步 |
| 缩放因子从不变化 | 跳过路径上没有 `scaler.update()` | 每一步都调用 `scaler.update()` |
| 裁剪作用在缩放后的梯度上 | 裁剪在 unscale 之前执行 | 先调用 `scaler.unscale_(optimizer)` |
| 每个 epoch 跳过数百次 | 模型已超出 FP16 的范围 | 跳过率超过 5% 时告警 |
| 优化器步长大了 16 倍 | 微批次 loss 没有做除法 | 把 loss 除以 `accum_steps` |
| 续训后的 loss 曲线不同 | checkpoint 中没有 RNG 状态 | 保存 `capture_rng_state()` 的输出 |
| 激活值放不进内存 | 反向传播保留了所有激活值 | `torch.utils.checkpoint.checkpoint(fn, input)` |

## Checkpoint 加载失败
type: troubleshooting
from: phases/19-capstone-projects/80-checkpoint-sharded-resume/docs/en.md, phases/19-capstone-projects/80-checkpoint-sharded-resume/code/main.py, phases/19-capstone-projects/47-checkpoint-save-resume/code/main.py, phases/19-capstone-projects/47-checkpoint-save-resume/docs/en.md

| 现象 | 原因 | 解决 |
|---|---|---|
| `world_size mismatch` | 在不同的 world size 上续训 | 在相同的 world size 上续训 |
| `sha256 mismatch on rank` | 分片在刷写中途被截断 | 先写到 .tmp，fsync，再重命名 |
| `shard file missing` | rank 文件少于 manifest 中的分片数 | 枚举分片，逐个确认存在 |
| `unknown schema` | 载荷的 schema 不以 ckpt 开头 | 按 schema 字符串分支迁移 |
| 续训 100 步后 loss 变成 NaN | manifest 存在，但背后的分片不完整 | 原子写入，加载时校验 sha256 |
| 运行中途磁盘写满 | 没有轮换 | `rotate_checkpoints` 保留最近 K 个 |

## 安全的 AMP 步骤
type: annotated-code
lang: python
from: phases/19-capstone-projects/45-gradient-clipping-amp/code/main.py, phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md

```python
optimizer.zero_grad(set_to_none=True)  # grads to None
with torch.amp.autocast(device_type="cuda"):  # FP16 forward
    loss = loss_fn(model(inputs), targets)
if not torch.isfinite(loss).all().item():  # check before backward
    return skip("non_finite_loss")  # no scaler.update here
scaler.scale(loss).backward()  # scaled backward
scaler.unscale_(optimizer)  # unscale before the clip
if has_non_finite_grad(model.parameters()):
    scaler.update()  # halves the factor
    return skip("non_finite_grad")
pre, post = clip_global_l2_norm(params, max_norm)
scaler.step(optimizer)
scaler.update()  # doubles or halves
```

## 累积，最后一步再同步
type: annotated-code
lang: python
from: phases/19-capstone-projects/46-gradient-accumulation/code/main.py, phases/19-capstone-projects/46-gradient-accumulation/docs/en.md

```python
accum_steps = len(micro_batches)
zero_grads(model)
for i, (x, y) in enumerate(micro_batches):
    is_last = i == accum_steps - 1
    if no_sync_until_last and not is_last:
        with no_sync_context(model):  # DDP skips the all-reduce
            loss = loss_scaled_for_accum(model(x), y, accum_steps, loss_fn)
            loss.backward()  # grads add into param.grad
    else:
        loss = loss_scaled_for_accum(model(x), y, accum_steps, loss_fn)
        loss.backward()  # one sync per effective step
optimizer.step()  # once per effective batch
```

## 代码中的任务
type: task-table
span: 2
from: phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md, phases/19-capstone-projects/45-gradient-clipping-amp/code/main.py, phases/19-capstone-projects/46-gradient-accumulation/code/main.py, phases/10-llms-from-scratch/34-gradient-checkpointing/docs/en.md, phases/19-capstone-projects/47-checkpoint-save-resume/code/main.py, phases/19-capstone-projects/80-checkpoint-sharded-resume/code/main.py

| 任务 | 代码 |
|---|---|
| 按全局 L2 范数裁剪 | `clip_grad_norm_(parameters, max_norm)` |
| 记录缩放因子 | `scaler.get_scale()` |
| 缩放微批次 loss | `loss_scaled_for_accum(logits, target, accum_steps, loss_fn)` |
| 在反向时重计算一段 | `checkpoint(fn, input)` |
| 原子地保存完整状态 | `save_checkpoint(model, optimizer, scheduler, state, out_path)` |
| 加载不可信文件 | `torch.load(path, map_location="cpu", weights_only=True)` |
| 保存和加载各 rank 的分片 | `save_sharded(per_rank_state, dest_dir, step)` |
| 续训并校验每个分片 | `load_sharded(src_dir, expected_world_size)` |

## 分片原子保存
type: architecture
from: phases/19-capstone-projects/80-checkpoint-sharded-resume/docs/en.md, phases/19-capstone-projects/80-checkpoint-sharded-resume/code/main.py

```arch
node | s0 | 1,1 | rank 0 state | param and optimiser shard | gpu
node | s1 | 1,2 | rank 1 state | one file per rank | gpu
node | t0 | 2,1 | rank0.bin.tmp | write, flush, fsync | store
node | t1 | 2,2 | rank1.bin.tmp | write, flush, fsync | store
node | man | 3,1 | manifest.json.tmp | world_size, step, shards | store
node | ren | 3,2 | os.replace | shards first, manifest last | process
node | load | 4,1 | load_sharded | sha256 check per shard | process
edge | s0 | t0 |
edge | s1 | t1 |
edge | t0 | man | sha256
edge | t1 | man | sha256
edge | man | ren |
edge | ren | load | resume
```

## 在 epoch 中途保存与续训
type: flow
from: phases/19-capstone-projects/47-checkpoint-save-resume/docs/en.md, phases/19-capstone-projects/47-checkpoint-save-resume/code/main.py

1. **save_checkpoint**：打包模型、优化器、调度器、计数器和 RNG。
2. **atomic_save**：写一个临时文件，然后调用 `os.replace`。
3. **load_checkpoint**：以 `weights_only=True` 调用 `torch.load`。
4. **restore_rng_state**：恢复 Python、NumPy 和 torch 的 RNG。
5. **训练循环**：从 `batch_in_epoch` 继续。loss 差异低于 1e-4。

## 运行课程
type: command-table
from: phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md, phases/19-capstone-projects/46-gradient-accumulation/docs/en.md, phases/19-capstone-projects/46-gradient-accumulation/code/main.py, phases/19-capstone-projects/47-checkpoint-save-resume/code/main.py, phases/19-capstone-projects/80-checkpoint-sharded-resume/docs/en.md, phases/19-capstone-projects/81-end-to-end-distributed-train/docs/en.md

| 命令 | 作用 |
|---|---|
| `python3 code/main.py` | 第 45 课：20 步，每行标记为 STEP 或 SKIP |
| `--num-steps 100` | 第 46 课：更长的扫描，用来画曲线 |
| `--accum-grid 1,2,4,8,16` | 第 46 课：要扫描的累积步数 |
| `--total-steps 24 --interrupt-at 10` | 第 47 课：续训演示的窗口 |
| `python3 code/main.py` | 第 80 课：4 个分片加 manifest，重新加载后逐字节相等 |
| `python3 code/main.py` | 第 81 课：20 步，4 个 rank，RESUME VERIFIED |

## 代码中的默认值
type: defaults
from: phases/19-capstone-projects/45-gradient-clipping-amp/code/main.py, phases/10-llms-from-scratch/34-gradient-checkpointing/code/main.py, phases/19-capstone-projects/80-checkpoint-sharded-resume/code/main.py, phases/19-capstone-projects/47-checkpoint-save-resume/code/main.py, phases/19-capstone-projects/81-end-to-end-distributed-train/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `DEFAULT_MAX_NORM` | 1.0 | `AmpTrainState` 的裁剪阈值 |
| cpu 上的 `amp_dtype` | `torch.bfloat16` | cuda 上为 `torch.float16` |
| `window` | 1000 | `rolling_skip_rate` 中的步数 |
| `k` | 4 | 每个 checkpoint 段的层数 |
| `attention_fraction` | 0.15 | selective 模式下的重计算占比 |
| `keep_last` | 5 | `rotate_checkpoints` 保留的 checkpoint 数 |
| `CHECKPOINT_SCHEMA` | ckpt.v1 | 载荷中的 schema 字符串 |
| `CHECKPOINT_STEP` | 10 | 第 81 课分片保存的步数 |

## 内存与开销数字
type: concepts
from: phases/10-llms-from-scratch/34-gradient-checkpointing/docs/en.md, phases/19-capstone-projects/46-gradient-accumulation/docs/en.md, phases/19-capstone-projects/81-end-to-end-distributed-train/docs/en.md

- **每层激活值**：约 `12 * B * L * d` 个浮点数。
- **d=8192, L=8192, B=1**：BF16 下每层约 1.6 GB。64 层约 103 GB。
- **完整 checkpointing**：FLOPs 约多 33%。一步是 4 个单位，而不是 3 个。
- **选择性 checkpointing**：只重计算注意力。开销约 5%。
- **sqrt(L) 规则**：每 sqrt(L) 层设一个 checkpoint。L=64 时为 8 个。
- **有效 batch**：`micro_batch * accum_steps`，再乘以数据并行的 world size。
- **ZeRO-1 优化器内存**：每个 rank 12P/N 字节。

## 问答
type: qa
from: phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md, phases/19-capstone-projects/46-gradient-accumulation/docs/en.md, phases/19-capstone-projects/47-checkpoint-save-resume/docs/en.md, phases/19-capstone-projects/80-checkpoint-sharded-resume/docs/en.md, phases/10-llms-from-scratch/34-gradient-checkpointing/docs/en.md

- **为什么 CPU 上的 GradScaler 什么都不做？** CPU autocast 使用 BF16。它不需要 loss 缩放。
- **因子什么时候变化？** 连续一段干净的步之后翻倍。每次跳过都减半。
- **梯度累积能省时间吗？** 不能。`accum_steps` 翻倍，每步的墙钟时间也翻倍。
- **为什么用 `weights_only=True`？** `.pt` 文件是 pickle。反序列化会执行代码。使用 torch 2.6 或更新版本。
- **为什么每个 rank 一个文件？** 写带宽随之扩展。单 rank 要 4 小时，64 个 rank 只要 4 分钟。

## 提示
type: tips
from: phases/19-capstone-projects/45-gradient-clipping-amp/docs/en.md, phases/19-capstone-projects/47-checkpoint-save-resume/docs/en.md, phases/19-capstone-projects/81-end-to-end-distributed-train/docs/en.md

- autocast 的设备要与优化器的设备一致。
- 抛出 `ValueError`，不要用 assert。`python -O` 会去掉 assert。
- loss 跳升超过 2x 时，回滚到上一个 checkpoint。
