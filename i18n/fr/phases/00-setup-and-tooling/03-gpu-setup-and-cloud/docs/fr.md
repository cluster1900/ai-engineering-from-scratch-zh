# Configuration du GPU et du Cloud

> En effet, la CPU est utilisée pour apprendre sans problème.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 分钟

## Objectif de l'apprentissage
- Utilisation `nvidia-smi`Et les utilisateurs de PyTorch ont été amenés à utiliser des GPU en leur propre pays.
- Google Colab avec GPU T4, pour des expériences basées sur le cloud gratuites
- Par rapport à la référence de multiplication de matrice de la CPU et de la GPU, la mesure de l'accélération
- Utilisez fp16 experience law pour estimer votre VRAM en moyenne de capacité maximale

##  problématique
La plupart des leçons des phases 1-3 fonctionnent bien sur le CPU. Mais une fois que vous commencez à former les CNNs, transformateurs ou LLM, vous aurez besoin d'accélération de la GPU.

Vous avez trois options: GPU local, GPU cloud ou Google Colab.

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

## - Je le construis.
### 选项 1: le GPU NVIDIA

检查你是否有一个:

```bash
nvidia-smi
```

Montage avec la torche de la CUDA:

```python
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### Option 2: Google Colab

1. Il y a une autre[colab.research.google.com](https://colab.research.google.com)
2. Temps d'exécution > Modifier le type d'exécution > T4 GPU
3. 运行  référencement`!nvidia-smi` effectuer des vérifications

Les carnets de cours seront transmis directement à Colab.

### Option 3: GPU dans le cloud

pour Lambda Labs、RunPod ou Vast.ai:

```bash
ssh user@your-gpu-instance

pip install torch torchvision torchaudio
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

### Pas de GPU ?

La plupart des leçons sont en fonctionnement sur le CPU.

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using: {device}")
```

## 动手构建:GPU vs CPU 基准测试

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
1. 运行上面的基准,并比较CPU与GPU的耗时
2. Si vous n'avez pas de GPU, vous pouvez le comparer avec Google Colab.
3. 检查你有多少GPU内存,并估算你能容纳最大模型(经验法则:fp16Chaque paramètre 2 octets)

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| CUDA | "GPU programming" | NVIDIA 的 parallel computing platform，让你能在 GPU 上运行代码 |
| VRAM | "GPU memory" | GPU 上的 Video RAM，与 system RAM 分开。限制 model size。 |
| fp16 | "Half precision" | 16-bit floating point，使用 fp32 一半的内存，accuracy loss 很小 |
| Tensor Core | "Fast matrix hardware" | 用于 matrix multiplication 的专用 GPU cores，比常规 cores 快 4-8 倍 |
