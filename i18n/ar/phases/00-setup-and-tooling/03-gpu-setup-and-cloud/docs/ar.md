# إعدادات GPU و السحابة

> في CPU على التدريب للاستعمال لا مشكلة.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 分钟

## 學习目标
- استخدام `nvidia-smi`و بايتورش's CUDA API 验证本地 GPU可用性
- تكوين Google Colab مع GPU T4 ، للاستخدام في التجارب المستندة إلى السحابة مجانا
- مقارنة مع المعايير المعدلة المترسية من CPU و GPU، ومقياس التسارع
- استخدام fp16  تجربة قاعدة لتقييم VRAM الخاص بك في أقصى نموذج من القوة

## 问题
معظم الدروس في المراحل 1-3 تعمل بشكل جيد على المعالجة المركزية. ولكن بمجرد البدء في تدريب سي إن إن أو المحولات أو LLM.

لديك ثلاثة خيارات: GPU محلية ‬ GPU سحرية، أو Google Colab ‬

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

## بناءها
### 选项 1:本地 NVIDIA GPU

检查你是否有:

```bash
nvidia-smi
```

تنصيب بـ " بيتورش "

```python
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### الخيار الثاني: Google Colab

1. السابق [colab.research.google.com](https://colab.research.google.com)
2. وقت تشغيل > تغيير نوع وقت تشغيل > GPU T4
3. 运行 `!nvidia-smi` إجراء التحقق

سوف تقوم بتنفيذ المكتبات المكتوبة في هذا البرنامج مباشرة إلى Colab

### الخيار الثالث: GPU السحاب

 بالنسبة لمختبرات لامبدا 、RunPod أو Vast.ai:

```bash
ssh user@your-gpu-instance

pip install torch torchvision torchaudio
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

### لا مشكلة

معظم الدروس قادرة على تشغيلها على CPU.

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using: {device}")
```

## 动手构建:GPU بمقابل CPU 基准测试

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

## التدريب
1. 运行 基准 فوق، ومقارنة CPU و GPU استهلاك الوقت
2. إذا لم يكن لديك GPU، في Google Colab على تشغيلها وتقارن
3. 检查你有多少GPU ذاكرة،并估算你能容纳最大模型( تجربة قاعدة:fp16 كل شريط 2 بايت)

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| CUDA | "GPU programming" | NVIDIA 的 parallel computing platform，让你能在 GPU 上运行代码 |
| VRAM | "GPU memory" | GPU 上的 Video RAM，与 system RAM 分开。限制 model size。 |
| fp16 | "Half precision" | 16-bit floating point，使用 fp32 一半的内存，accuracy loss 很小 |
| Tensor Core | "Fast matrix hardware" | 用于 matrix multiplication 的专用 GPU cores，比常规 cores 快 4-8 倍 |
