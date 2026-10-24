# GPU Kurulum ve Bulut

> CPU'da eğitim için çalışmak için hiçbir sorun yok. Gerçek eğitim için GPU gereklidir.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 分钟

## Öğrenme hedefi
- Kullanım`nvidia-smi`和 PyTorch'in CUDA API 验证本地GPU 可用性
- 配置带 T4 GPU's Google Colab, ücretsiz bulut tabanlı deneyler için kullanılır
- CPU ile GPU'nun üstündeki Matrix çarpma referansına göre,
- Kullan fp16 experience kuralları VRAM orta kapasitesinin en büyük modelini değerlendirmek

## 问题
1-3 aşamalarda büyük çoğunluktan dersler CPU'da iyi çalışıyor. Ancak CNN'leri, transformörleri veya LLM'leri eğitmeye başladıktan sonra, GPU hızlandırmasına ihtiyacınız var. CPU'da 8 saatlik eğitim süresi, GPU'da 10 dakika süresi gerekir.

Üç seçenek var: yerel GPU, bulut GPU veya Google Colab.

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

## Yapın onu.
### 选项 1:本地 NVIDIA GPU

检查你是否有:

```bash
nvidia-smi
```

Linux'da, öntanımlı tekerlek Özel CUDA taşıyor Windows'da, pytorch.org seçerinden CUDA'nın yükleme emrini kopyalamak için lütfen.

```bash
pip install torch torchvision torchaudio
```

Sonra PyTorch'in GPU'yu görebileceğini kontrol et.

```python
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### Seçenek 2: Google Colab

1. Önceki[colab.research.google.com](https://colab.research.google.com)
2. Çalışma Zamanı > Çalışma Zamanı Tipini Değiştir > T4 GPU
3. 运行  İşlem`!nvidia-smi` gerçekleştirmek

Bu ders defterlerini direkt olarak Colab'a aktarmak.

### Seçenek 3: Bulut GPU

Lambda Labs 、RunPod veya Vast.ai için:

```bash
ssh user@your-gpu-instance

pip install torch torchvision torchaudio
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

### - GPU yok mu?

Çoğu ders CPU'da çalıştırılabilir.

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
1. 运行上面的基准,并比较 CPU ve GPU'nun tüketimi
2. Eğer GPU yoksa, Google Colab'da çalıştırıp karşılaştır.
3. 检查你有多少GPU内存,并估算你能容纳最大模型(经验法:fp16 Her parametresi 2 byte)

### 提示

**练习 1。**İlk GPU çalışması  oluşturmak  bölümünün kodunu, kayıt CPU 时间、GPU 时间以及加速比所在行── tekrar çalıştırmak bir kez; ilk GPU çalışması 开销 启动包含,因此应比较第二次的结果──

**练习 2。**Kolab'da çalıştırma süresini seçin > Çalıştırma süresi tipi değiştir > GPU, yeniden bir tek birim için test yapıştırın.`!nvidia-smi`Sadece GPU'nun adını gösterdiğinde, temel test sonuçları anlamlı oldu.

**练习 3。**按 `code/gpu_check.py`İçeride, kullan `torch.cuda.get_device_properties(0).total_memory / 1e9`读取总显存──将以字节单位的显存除以 2,得到 fp16 参数估值,再留出余量,因为激活值和 CUDA 上下文也占用显存──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| CUDA | "GPU programming" | NVIDIA 的 parallel computing platform，让你能在 GPU 上运行代码 |
| VRAM | "GPU memory" | GPU 上的 Video RAM，与 system RAM 分开。限制 model size。 |
| fp16 | "Half precision" | 16-bit floating point，使用 fp32 一半的内存，accuracy loss 很小 |
| Tensor Core | "Fast matrix hardware" | 用于 matrix multiplication 的专用 GPU cores，比常规 cores 快 4-8 倍 |
