# Configuración de GPU y nube

> En la CPU se entrena para aprender no hay problemas.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 分钟

## El objetivo del aprendizaje
- Uso `nvidia-smi`Y PyTorch de CUDA API 验证本地GPU可用性
- Configuración con T4 GPU de Google Colab, para experimentos basados en la nube gratis
- En comparación con el índice de multiplicación de la matriz de CPU y GPU, y la aceleración de la medida
- Utiliza fp16 experience law estimar el mayor modelo de capacidad de tu VRAM

##  problemas
La mayoría de las lecciones en las fases 1-3 funcionan bien en la CPU. Pero una vez que empieces a entrenar CNNs, transformadores o LLMs, necesitas aceleración de la GPU.

Tienes tres opciones: GPU local, GPU en la nube o Google Colab.

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

## Construirlo
### 选项 1: 本地 NVIDIA GPU

检查你是否有一个:

```bash
nvidia-smi
```

Instalado con CUDA de PyTorch:

```python
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### Opción 2: Colab de Google

1. El pasado[colab.research.google.com](https://colab.research.google.com)
2. Tiempo de ejecución > Cambia el tipo de tiempo de ejecución > GPU T4
3. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `!nvidia-smi` realizar la prueba

Los cuadernos de este curso se transmiten directamente a Colab.

### Opción 3: GPU en la nube

Para Lambda Labs、RunPod o Vast.ai:

```bash
ssh user@your-gpu-instance

pip install torch torchvision torchaudio
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

### ¿No hay GPU?

La mayoría de las lecciones pueden funcionar en la CPU. Necesitan una lección de GPU.

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

##  ejercicios
1. 运行上面的基准,并比较 CPU y GPU de consumo
2. Si no tienes GPU, en Google Colab para ejecutarlo y hacer comparación
3. 检查你有多少GPU内存,并估算你能容纳最大模型(experience法则:fp16 Cada parámetro 2 bytes)

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| CUDA | "GPU programming" | NVIDIA 的 parallel computing platform，让你能在 GPU 上运行代码 |
| VRAM | "GPU memory" | GPU 上的 Video RAM，与 system RAM 分开。限制 model size。 |
| fp16 | "Half precision" | 16-bit floating point，使用 fp32 一半的内存，accuracy loss 很小 |
| Tensor Core | "Fast matrix hardware" | 用于 matrix multiplication 的专用 GPU cores，比常规 cores 快 4-8 倍 |
