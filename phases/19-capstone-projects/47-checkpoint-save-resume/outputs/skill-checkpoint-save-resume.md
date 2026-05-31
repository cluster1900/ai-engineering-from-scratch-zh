---
name: checkpoint-save-resume
description: 原子式、分片 checkpoint，完整捕获 RNG，使被杀死的 run 可以在 epoch 中途 resume，并保持相同的 loss trajectory。
version: 1.0.0
phase: 19
lesson: 47
tags: [training, durability, resume, sharded-state]
---

## 何时使用

任何超过 cluster wallclock 上限的 training run，任何必须在 node reboot 后存活的 run，任何大到无法放进单个 payload 的模型。

## Payload 形状

```python
{
  "schema": "ckpt.v1",
  "model": model.state_dict(),
  "optimizer": opt.state_dict(),
  "scheduler": sched.state_dict(),
  "state": {"step": int, "epoch": int, "batch_in_epoch": int, "losses": [float, ...]},
  "rng": {"python": ..., "numpy": ..., "torch_cpu": ..., "torch_cuda": ...},
  "wall_saved_at": time.time(),
}
```

## 原子式保存

1. 将 payload 写入与 target 位于同一目录的唯一 temp file。
2. 使用 `os.replace(tmp, target)` 进行原子式 swap。
3. 永远不要直接写入 target name。

## 分片布局

- 每个 shard 一个 `model.shard-NNN.pt`，按 key 轮询分配，或按 parameter group 拆分。
- `meta.pt` 携带 optimizer、scheduler、train state、RNG 和 shard manifest。
- `index.json` 携带每个 shard 以及 `meta.pt` 的 `sha256`。
- Loader 在 merge 前验证每个 hash。

## Epoch 中途 resume

- 在 `step` 旁边保存 `(epoch, batch_in_epoch)`。
- 在 resumed epoch 的第一个 batch 之前恢复 RNG state。
- 将 generator fast-forward 到已消费 batch 之后。

## Failure modes

- 跨 device rename：不是原子式的，会丢失之前的文件。将 temp 放在同一目录。
- 忘记 RNG：resumed loss 会偏离 baseline。运行 demo 的 assertion。
- 忘记 optimizer state：下一步会猛跳。同一个 diff 会爆炸。
- 裁剪了错误的 checkpoint：保留最近 K 个以及 best。
