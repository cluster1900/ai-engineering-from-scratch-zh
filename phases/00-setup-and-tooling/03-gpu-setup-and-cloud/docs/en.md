# GPU Setup & Cloud

> 在 CPU 上训练用于学习没有问题。真正训练需要 GPU。

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 分钟

## 学习目标
- 使用 `nvidia-smi` 和 PyTorch 的 CUDA API 验证本地 GPU 可用性
- 配置带 T4 GPU 的 Google Colab，用于免费的 cloud-based experiments
- 对比 CPU 与 GPU 上的 Matrix multiplication benchmark，并测量加速比
- 使用 fp16 经验法则估算你的 VRAM 中能容纳的最大 model

## 问题
phases 1-3 中的大多数 lessons 在 CPU 上运行良好。但一旦开始训练 CNNs、transformers 或 LLMs（phases 4+），你就需要 GPU acceleration。在 CPU 上需要 8 小时的 training run，在 GPU 上只需要 10 分钟。

你有三个选项：local GPU、cloud GPU，或 Google Colab（免费）。

## 概念
```
Your options:

1. Local NVIDIA GPU
   Cost: $0 (you already have it)
   Setup: Install CUDA + cuDNN
   Best for: Regular use, large datasets

2. Google Colab (free tier)
   Cost: $0
   Setup: None
   Best for: Quick experiments, no GPU at home

3. Cloud GPU (Lambda, RunPod, Vast.ai)
   Cost: $0.20-2.00/hr
   Setup: SSH + install
   Best for: Serious training, large models
```


```figure
s0-gpu-dispatch
```

## 构建它
### 选项 1：本地 NVIDIA GPU

检查你是否有一个：

```bash
nvidia-smi
```

安装带 CUDA 的 PyTorch。在 Linux 上，默认 wheel 已自带 CUDA。在 Windows 上，请从 pytorch.org 的 selector 中复制 CUDA 安装命令。

```bash
pip install torch torchvision torchaudio
```

然后检查 PyTorch 是否能看到 GPU：

```python
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### Option 2: Google Colab

1. 前往 [colab.research.google.com](https://colab.research.google.com)
2. Runtime > Change runtime type > T4 GPU
3. 运行 `!nvidia-smi` 进行验证

将本课程中的 notebooks 直接上传到 Colab。

### Option 3: Cloud GPU

对于 Lambda Labs、RunPod 或 Vast.ai：

```bash
ssh user@your-gpu-instance

pip install torch torchvision torchaudio
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

### No GPU? No problem.

大多数 lessons 都能在 CPU 上运行。需要 GPU 的 lesson 会明确说明，并包含 Colab links。

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using: {device}")
```

## 动手构建：GPU vs CPU 基准测试

```python
import torch
import time

size = 5000

a_cpu = torch.randn(size, size)
b_cpu = torch.randn(size, size)

start = time.time()
c_cpu = a_cpu @ b_cpu
cpu_time = time.time() - start
print(f"CPU: {cpu_time:.3f}s")

if torch.cuda.is_available():
    a_gpu = a_cpu.to("cuda")
    b_gpu = b_cpu.to("cuda")

    torch.cuda.synchronize()
    start = time.time()
    c_gpu = a_gpu @ b_gpu
    torch.cuda.synchronize()
    gpu_time = time.time() - start
    print(f"GPU: {gpu_time:.3f}s")
    print(f"Speedup: {cpu_time / gpu_time:.0f}x")
```

## 练习
1. 运行上面的 benchmark，并比较 CPU 与 GPU 的耗时
2. 如果你没有 GPU，在 Google Colab 上运行它并进行比较
3. 检查你有多少 GPU memory，并估算你能容纳的最大 model（经验法则：fp16 每个 parameter 2 bytes）

### 提示

**练习 1。** 原样运行“构建它”部分的代码，记录 CPU 时间、GPU 时间以及加速比所在行。再运行一次；首次 GPU 运行包含启动开销，因此应比较第二次的结果。

**练习 2。** 在 Colab 中选择 Runtime > Change runtime type > GPU，再把基准测试粘贴到一个单元格。先在另一个单元格运行 `!nvidia-smi`；只有它显示 GPU 名称后，基准测试结果才有意义。

**练习 3。** 按 `code/gpu_check.py` 中的方式，用 `torch.cuda.get_device_properties(0).total_memory / 1e9` 读取总显存。将以字节为单位的显存除以 2，得到 fp16 参数量估计值，再留出余量，因为激活值和 CUDA 上下文也会占用显存。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| CUDA | "GPU programming" | NVIDIA 的 parallel computing platform，让你能在 GPU 上运行代码 |
| VRAM | "GPU memory" | GPU 上的 Video RAM，与 system RAM 分开。限制 model size。 |
| fp16 | "Half precision" | 16-bit floating point，使用 fp32 一半的内存，accuracy loss 很小 |
| Tensor Core | "Fast matrix hardware" | 用于 matrix multiplication 的专用 GPU cores，比常规 cores 快 4-8 倍 |
