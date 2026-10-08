# GPU सेटअप और क्लाउड

>                                                                                                                                                                                                                                                               

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 分钟

## 学习目标
- उपयोग `nvidia-smi`和 PyTorch के CUDA एपीआई 验证本地 GPU उपलब्ध
- 配置带T4 GPU के गूगल कोलाब, निः शुल्क क्लाउड आधारित प्रयोगों के लिए
- CPU और GPU के ऊपर मैट्रिक्स गुणन बेंचमार्क के मुकाबले,并 माप त्वरण अनुपात
- उपयोग fp16 अनुभव विधि अपने VRAM के लिए अधिकतम क्षमता क्षमता का अनुमान

## 问题
चरण 1-3 में अधिकांश पाठ CPU पर अच्छी तरह से चल रहे हैं। लेकिन एक बार सीएनएन, ट्रांसफार्मर या एलएलएम प्रशिक्षण शुरू करने के बाद, आपको GPU त्वरण की आवश्यकता होगी।

आपके पास तीन विकल्प हैंः स्थानीय GPU, क्लाउड GPU, या Google Colab

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

##  इसे निर्माण
### 选项 1:本地 NVIDIA GPU

检查你是否有:

```bash
nvidia-smi
```

                                                                                                                                                                                                                                                              

```python
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### विकल्प 2: गूगल कोलाब

1. पूर्व में[colab.research.google.com](https://colab.research.google.com)
2. रनटाइम > रनटाइम प्रकार बदलें > T4 GPU
3. 运行 `!nvidia-smi`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

इस पाठ्यक्रम में नोटबुक को सीधे कोलब में अपलोड करना

### विकल्प 3: क्लाउड जीपीयू

ल्याम्ब्डा लैब्स ऱनपॉड या वास्ट.एआई के लिएः

```bash
ssh user@your-gpu-instance

pip install torch torchvision torchaudio
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

### कोई GPU नहीं?

अधिकांश पाठ CPU पर चल सकते हैं।

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using: {device}")
```

## 动手构建:जीपीयू बनाम सीपीयू 基准测试

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

## अभ्यास
1. 运行上述基准,并比较CPU与GPU的耗时
2. यदि आप GPU नहीं है, तो गूगल कोलाब में इसे चलाने और तुलना करने के लिए
3. 检查你有多少GPU内存,并估算你能容纳最大模型(अनुभव नियम:fp16 प्रत्येक पैरामीटर 2 बाइट्स)

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| CUDA | "GPU programming" | NVIDIA 的 parallel computing platform，让你能在 GPU 上运行代码 |
| VRAM | "GPU memory" | GPU 上的 Video RAM，与 system RAM 分开。限制 model size。 |
| fp16 | "Half precision" | 16-bit floating point，使用 fp32 一半的内存，accuracy loss 很小 |
| Tensor Core | "Fast matrix hardware" | 用于 matrix multiplication 的专用 GPU cores，比常规 cores 快 4-8 倍 |
