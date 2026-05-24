---
name: skill-latency-profiler
description: 编写完整的延迟 benchmark 脚本，包含 warmup、synchronisation、percentiles 和内存跟踪
version: 1.0.0
phase: 4
lesson: 15
tags: [edge, deployment, profiling, benchmarking]
---

# Latency Profiler

为任意 PyTorch model 生成严谨的延迟 benchmark。输出下游任何人都真正可以信任的报告。

## 何时使用

- 在选择要部署的 backbone 之前，比较多个候选 backbone。
- Quantisation 或 pruning 前后。
- Runtime 变更之后（eager vs ONNX vs TensorRT）。
- 生成 deployment-readiness 报告。

## 输入

- `model`: PyTorch `nn.Module`。
- `input_shape`: 类似 `(1, 3, 224, 224)` 的 tuple。
- `device`: `cpu` | `cuda` | `mps`。
- `warmup`: 默认 10。
- `iters`: 默认 100。

## 检查项

### 1. Warmup
在不计时的情况下运行 model `warmup` 次。捕获首次 forward 的 JIT compilation 和冷缓存影响。

### 2. Synchronisation
对于 `cuda`，在每次计时的 forward pass 前后调用 `torch.cuda.synchronize()`。
对于 `mps`，调用 `torch.mps.synchronize()`。

### 3. Timer
使用 `time.perf_counter()` 进行 wall-clock measurement。转换为毫秒。

### 4. Percentiles
对完整 timing 列表排序。报告 `p50, p90, p95, p99, mean, std`。

### 5. Memory
对于 `cuda`，在运行后调用 `torch.cuda.max_memory_allocated()`，并减去任何 baseline。
对于 `cpu`，在前后使用 `tracemalloc` 或 `psutil.Process().memory_info().rss`。

### 6. Batch-size sweep
可选地对 `batch_size in [1, 4, 16, 32]` 重复 benchmark，以揭示吞吐量与延迟之间的 tradeoff。

## 输出模板

```python
import time
import torch
import psutil, os

def profile(model, input_shape, device="cpu", warmup=10, iters=100):
    proc = psutil.Process(os.getpid())
    baseline_rss = proc.memory_info().rss / 1e6

    model = model.to(device).eval()
    x = torch.randn(input_shape, device=device)

    def sync():
        if device == "cuda":
            torch.cuda.synchronize()
        elif device == "mps":
            torch.mps.synchronize()

    with torch.no_grad():
        for _ in range(warmup):
            model(x)
        sync()
        if device == "cuda":
            torch.cuda.reset_peak_memory_stats()

        times = []
        for _ in range(iters):
            sync()
            t0 = time.perf_counter()
            model(x)
            sync()
            times.append((time.perf_counter() - t0) * 1000)

    times.sort()
    mean = sum(times) / len(times)
    std  = (sum((t - mean) ** 2 for t in times) / len(times)) ** 0.5

    def pct(p):
        idx = max(0, min(len(times) - 1, int(len(times) * p) - 1))
        return times[idx]

    report = {
        "p50_ms":  pct(0.50),
        "p90_ms":  pct(0.90),
        "p95_ms":  pct(0.95),
        "p99_ms":  pct(0.99),
        "mean_ms": mean,
        "std_ms":  std,
        "rss_mb":  proc.memory_info().rss / 1e6 - baseline_rss,
    }
    if device == "cuda":
        report["peak_cuda_mb"] = torch.cuda.max_memory_allocated() / 1e6

    return report
```

## 规则

- 始终运行 warmup；不要相信首次 forward 的 timing。
- 使用 percentiles，而不是 mean。单个 outlier 可以让 mean 翻倍，但几乎不会影响 p50。
- 使用与生产环境相同的 input_shape；224x224 上的延迟不等于 384x384 上的延迟。
- 对于 CUDA，绝不要省略 `torch.cuda.synchronize()`；没有它，数字没有意义。
- 将 torch version、CUDA version 和 device name 与数字一起记录，否则它们就不再可比较。
