#  GPU 设置和云

> 在CPU上训练用于学习没有问题.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 分钟

## 学习目标
- 使用 `nvidia-smi`和 PyTorch 的 CUDA API 验证本地GPU可用性
- 配置带T4 GPU的谷歌Colab,用于免费的基于云的实验
- 与CPU和GPU上方的矩阵乘法基准相比,并测量加速比
- 使用fp16 经验法则估计你的VRAM中能容量的最大模型

## 问题
在 1-3 阶段的大多数课程在CPU上运行良好.但是一旦开始训练CNN,变压器或LLM,你就需要GPU加速.

你有三个选择:本地GPU,云GPU,或谷歌Collab.

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
### 选项 1:本地NVIDIA GPU

检查你是否有:

```bash
nvidia-smi
```

装备带 CUDA 的 PyTorch:

```python
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### 选择2:谷歌协作

1. 前往 [colab.research.google.com](https://colab.research.google.com)
2. 运行时间 > 改变运行时间类型 > T4 GPU
3. 运行`!nvidia-smi`进行验证

将本课程中的笔记本 直接上传到 Colab.

### 选择3:云GPU

对于Lambda Labs、RunPod或Vast.ai:

```bash
ssh user@your-gpu-instance

pip install torch torchvision torchaudio
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

### 没有GPU?

大多数课程都能在CPU上运行.需要GPU的课程 会明确说明,并包含Collab链接.

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using: {device}")
```

## 动手构建:GPUvsCPU基准测试

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
1. 运行上述基准,并比较CPU和GPU的耗时
2. 如果没有GPU,在Google Colab上运行并进行比较
3. 检查你有多少GPU内存,并估算你能容量的最大模型 (经验法则:fp16 每个参数2字节)

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| CUDA | "GPU programming" | NVIDIA 的 parallel computing platform，让你能在 GPU 上运行代码 |
| VRAM | "GPU memory" | GPU 上的 Video RAM，与 system RAM 分开。限制 model size。 |
| fp16 | "Half precision" | 16-bit floating point，使用 fp32 一半的内存，accuracy loss 很小 |
| Tensor Core | "Fast matrix hardware" | 用于 matrix multiplication 的专用 GPU cores，比常规 cores 快 4-8 倍 |
