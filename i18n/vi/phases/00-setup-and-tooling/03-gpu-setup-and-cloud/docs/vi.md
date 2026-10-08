# Thiết lập GPU & Cloud

> Trong CPU trên đào tạo để học không có vấn đề.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 分钟

## Học mục tiêu
- Sử dụng `nvidia-smi`和 PyTorch của CUDA API 验证本地 GPU khả dụng
- Google Colab của GPU T4 được sử dụng để thử nghiệm dựa trên đám mây miễn phí
- Đối với tiêu chuẩn nhân số Matrix trên CPU và GPU,并 đo tốc độ
- Sử dụng fp16  kinh nghiệm quy tắc ước tính mô hình lớn nhất của bạn VRAM trong dung lượng

## 问题
Phần lớn các bài học trong giai đoạn 1-3 trên CPU hoạt động tốt. Nhưng một khi bắt đầu đào tạo CNNs, biến đổi hoặc LLM (Phase 4+), bạn sẽ cần GPU tăng tốc.

Bạn có ba lựa chọn: GPU địa phương, GPU đám mây, hoặc Google Colab (tài liệu miễn phí)

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

##  xây dựng nó
### 选项 1:本地 NVIDIA GPU

检查你是否有:

```bash
nvidia-smi
```

Ưu tiên của CUDA:

```python
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### Tùy chọn 2: Google Colab

1. 前往 [colab.research.google.com](https://colab.research.google.com)
2. Thời gian chạy > Thay đổi kiểu thời gian chạy > T4 GPU
3. 运行 `!nvidia-smi` tiến hành kiểm tra

将本课程中的笔记本 直接上传到 Colab。

### Tùy chọn 3: GPU đám mây

 Đối với Lambda Labs、RunPod hoặc Vast.ai:

```bash
ssh user@your-gpu-instance

pip install torch torchvision torchaudio
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

### Không có GPU?

Hầu hết các bài học đều có thể hoạt động trên CPU.

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
1. 运行 trên tiêu chuẩn, và so sánh CPU với GPU tiêu thụ thời gian
2. Nếu bạn không có GPU, hãy chạy nó trên Google Colab và so sánh
3. 检查你有多少GPU bộ nhớ,并估算你能容纳最大模型(经验法则:fp16 Mỗi tham số 2 byte)

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| CUDA | "GPU programming" | NVIDIA 的 parallel computing platform，让你能在 GPU 上运行代码 |
| VRAM | "GPU memory" | GPU 上的 Video RAM，与 system RAM 分开。限制 model size。 |
| fp16 | "Half precision" | 16-bit floating point，使用 fp32 一半的内存，accuracy loss 很小 |
| Tensor Core | "Fast matrix hardware" | 用于 matrix multiplication 的专用 GPU cores，比常规 cores 快 4-8 倍 |
