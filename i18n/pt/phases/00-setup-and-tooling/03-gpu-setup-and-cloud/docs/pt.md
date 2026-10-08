# Configuração de GPU e nuvem

> Em CPU, o treinamento é usado para aprender sem problemas.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 分钟

## Objectivo de aprendizagem
- Utilização `nvidia-smi`和 PyTorch's CUDA API 验证本地 GPU 可用性
- Configuração com T4 GPU de Google Colab, para experimentos baseados em nuvem gratuitos
- Em relação ao benchmark de multiplicação de matriz da CPU e GPU, a aceleração foi medida
- Utilize fp16 experience law estimar seu VRAM maior modelo de capacidade

## 问题
Mas uma vez que você começa a treinar CNNs, transformadores ou LLMs, você precisa de aceleração da GPU.

Você tem três opções: GPU local, GPU em nuvem, ou Google Colab (WEB

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

## Construí-lo
### 选项 1:本地 NVIDIA GPU

检查你是否有:

```bash
nvidia-smi
```

Instalação com a CUDA de PyTorch:

```python
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### Opção 2: Google Colab

1. O que é isso ?[colab.research.google.com](https://colab.research.google.com)
2. Tempo de execução > Mudança de tipo de tempo de execução > GPU T4
3. 运行 `!nvidia-smi` realizar a verificação

Os cadernos do curso serão transmitidos diretamente para Colab.

### Opção 3: GPU em nuvem

 para Lambda Labs、RunPod ou Vast.ai:

```bash
ssh user@your-gpu-instance

pip install torch torchvision torchaudio
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

### - Sem GPU?

A maioria das lições pode funcionar na CPU.

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
1. 运行上面的基准,并比较 CPU 与 GPU 的耗时
2. Se não tiveres GPU, vais fazer comparação no Google Colab.
3. 检查你有多少GPU内存,并估算你能容纳最大模型(经验法则:fp16 Cada parâmetro 2 bytes)

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| CUDA | "GPU programming" | NVIDIA 的 parallel computing platform，让你能在 GPU 上运行代码 |
| VRAM | "GPU memory" | GPU 上的 Video RAM，与 system RAM 分开。限制 model size。 |
| fp16 | "Half precision" | 16-bit floating point，使用 fp32 一半的内存，accuracy loss 很小 |
| Tensor Core | "Fast matrix hardware" | 用于 matrix multiplication 的专用 GPU cores，比常规 cores 快 4-8 倍 |
