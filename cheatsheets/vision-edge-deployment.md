---
id: vision-edge-deployment
title: Vision Pipelines and Edge Deployment
code: VP
subtitle: 测量、量化、导出并服务视觉流水线。按内存带宽给边缘目标的 LLM 解码定上限。
hue: 25
sources: phases/04-computer-vision/15-real-time-edge, phases/04-computer-vision/16-vision-pipeline-capstone, phases/17-infrastructure-and-production/12-edge-inference
source_hash: bbe79d292f291682
---

## 视觉流水线阶段
type: architecture
from: phases/04-computer-vision/16-vision-pipeline-capstone/docs/en.md

```arch
node | req | 1,1 | HTTP request | image bytes | client
node | load | 2,1 | Decode | preprocess | process
node | det | 3,1 | Detector | YOLO or Mask R-CNN | gpu
node | crop | 4,1 | Crop and resize | each detection | process
node | cls | 4,2 | Classifier | ConvNeXt-Tiny | gpu
node | agg | 3,2 | Aggregate | detections and classes | process
node | schema | 2,2 | Pydantic | validation | process
node | resp | 1,2 | JSON response | | client
edge | req | load |
edge | load | det |
edge | det | crop |
edge | crop | cls |
edge | cls | agg |
edge | agg | schema |
edge | schema | resp |
```

## 代码中的任务
type: task-table
from: phases/04-computer-vision/15-real-time-edge/docs/en.md, phases/04-computer-vision/15-real-time-edge/code/main.py, phases/04-computer-vision/16-vision-pipeline-capstone/code/main.py

| 任务 | 代码 |
|---|---|
| 延迟分位数 | `measure_latency(model, input_shape)` |
| 统计参数量 | `parameter_count(model)` |
| 估计 FLOPs | `flops_estimate(model, input_shape)` |
| INT8 静态量化 | `quantise_ptq(model, calibration_loader)` |
| 导出到 ONNX | `export_onnx(model, sample_input)` |
| 对比 4 个 backbone | `compare_backbones(resolution=160)` |
| 运行流水线 | `pipe.run(img, image_id="demo")` |
| 为每个阶段计时 | `benchmark(pipe, num_runs=10)` |

## 正确测量延迟
type: annotated-code
lang: python
from: phases/04-computer-vision/15-real-time-edge/code/main.py, phases/04-computer-vision/15-real-time-edge/docs/en.md

```python
model = model.to(device).eval()
with torch.no_grad():
    for _ in range(warmup):                 # 5 in code, 10 in the docs
        model(x)
    torch.cuda.synchronize()                # before and after, on cuda only
    t0 = time.perf_counter()
    model(x)
    times.append((time.perf_counter() - t0) * 1000)  # milliseconds
times.sort()
p50 = times[len(times) // 2]
p95 = times[int(len(times) * 0.95)]         # report percentiles, not the mean
```

## 量化并导出
type: annotated-code
lang: python
from: phases/04-computer-vision/15-real-time-edge/docs/en.md

```python
import torch.ao.quantization as tq
model.qconfig = tq.get_default_qconfig(backend)  # backend="x86"
tq.prepare(model, inplace=True)                  # inserts observers
for x, _ in calibration_loader:
    model(x)                                     # calibrate with real data
tq.convert(model, inplace=True)                  # fuse and quantise
torch.onnx.export(model, sample_input, path,
    input_names=["input"], output_names=["output"],
    dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},  # any batch size
    opset_version=17)                            # safe default in 2026
```

## 服务与运行
type: command-table
from: phases/04-computer-vision/16-vision-pipeline-capstone/docs/en.md, phases/04-computer-vision/15-real-time-edge/docs/en.md, phases/04-computer-vision/15-real-time-edge/code/main.rs, phases/17-infrastructure-and-production/12-edge-inference/docs/en.md

| 命令 | 作用 |
|---|---|
| `uvicorn main:app --host 0.0.0.0 --port 8000` | 启动 FastAPI 服务 |
| `curl -F 'file=@dog.jpg' http://localhost:8000/detect` | 上传一张图像 |
| `rustc --edition 2021 -O code/main.rs` | 构建 Rust 边缘基准 |
| `code/main.py`（第 17.12 课） | 打印每个边缘目标的解码上限 |
| `trtexec` | TensorRT 独立 CLI 给出的数字 |
| `benchmark_app` | OpenVINO 独立 CLI 给出的数字 |

## 测量纪律
type: flow
from: phases/04-computer-vision/15-real-time-edge/docs/en.md

1. **预热**：跑 5-10 次空前向。不要把它们算进去。
2. **同步**：在计时区间的前后调用 `torch.cuda.synchronize()`。
3. **固定输入尺寸**：用生产分辨率。224x224 不是 512x512。
4. **计时**：用 `time.perf_counter()` 包住每一次前向。
5. **报告**：给出 p50、p95 和 p99。均值会把尾部藏起来。
6. **决策**：架构搜索用 FLOPs。上线看设备上的延迟。

## 默认值与数字
type: defaults
from: phases/04-computer-vision/15-real-time-edge/docs/en.md, phases/04-computer-vision/15-real-time-edge/code/main.py, phases/04-computer-vision/16-vision-pipeline-capstone/docs/en.md, phases/04-computer-vision/16-vision-pipeline-capstone/code/main.py

| 设置 | 默认值 | 说明 |
|---|---|---|
| `opset_version` | 17 | ONNX 导出 |
| 延迟循环 | `warmup=10, iters=50` | 课文如此。代码用的是 5 和 20 |
| `min_crop` | 32 | 课文如此。代码用 16。更小的框会跳过分类器 |
| 裁剪后的缩放 | 224 | 课文如此。代码用 64 |
| `backend` | x86 | PTQ 的 qconfig |
| 微批窗口 | 20ms | 先收集请求，再合批 |
| INT8 精度损失 | 0.1-1 | 静态 PTQ 下的百分点 |
| CPU 阶段耗时 | 300-500 ms | 检测。预处理大约 3 毫秒 |

## 边缘目标与格式
type: concepts
from: phases/17-infrastructure-and-production/12-edge-inference/docs/en.md

- **Apple ANE**：38 TOPS，统一内存。INT4 权重加 FP16 激活，经 Core ML。
- **Qualcomm Hexagon**：45 TOPS。经 AI Hub 转换器得到 QNN 的 INT8 / INT4。
- **WebGPU / WebLLM**：Q4 MLC（`q4f16_1`），用 `mlc_llm convert_weight`。不支持 GGUF。
- **Jetson Orin Nano**：Q4 GGUF，或者 TRT-LLM 的 INT4。受内存限制。
- **Jetson AGX / Thor**：Edge-LLM 路径上的 NVFP4 加 FP8 KV。
- **视觉运行时**：把 PyTorch 导出成 ONNX，再选 ONNX Runtime、TensorRT、Core ML 或 TFLite。

## 带宽决定解码上限
type: concepts
from: phases/17-infrastructure-and-production/12-edge-inference/docs/en.md, phases/17-infrastructure-and-production/12-edge-inference/code/main.py, phases/04-computer-vision/15-real-time-edge/docs/en.md

- **上限**：$\text{tok/s} = \frac{\text{bandwidth (GB/s)}}{\text{model size (GB)}}$。解码每个 token 都要读完所有权重。
- **移动端**：3.5 GB 在 50 GB/s 下要 70 毫秒。上限约为 14 tok/s。
- **数据中心**：3 TB/s 的 HBM3 在 1.2 毫秒内读完 3.5 GB。上限是 830 tok/s。
- **差距**：从数据中心到边缘，带宽相差 30-50x。
- **手机上的上下文**：8 GB 内存里放 4 GB 的模型，再加 32K token 的 2 GB KV cache，就会 OOM。保持在 4K-8K。
- **卷积 FLOPs**：$2 \, c_{in} \, c_{out} \, k_h \, k_w \, h \, w$，这是一层卷积。
- **INT8**：模型体积和内存带宽降为原来的 1/4。计算量降为原来的 1/2 到 1/4。

## 排障
type: troubleshooting
from: phases/04-computer-vision/15-real-time-edge/docs/en.md, phases/04-computer-vision/16-vision-pipeline-capstone/docs/en.md, phases/17-infrastructure-and-production/12-edge-inference/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 最初几次计时很慢 | 缓存是冷的，还有 JIT 编译 | 先预热 5-10 次 |
| GPU 延迟看起来极小 | 测到的是 kernel 的派发 | 在计时区间前后做同步 |
| 裁剪结果是空的 | 框用的是 (cx, cy, w, h) | 用 Pydantic 校验 (x1, y1, x2, y2) |
| 贴着边缘裁剪失败 | 框超出了图像 | 钳制到图像尺寸以内 |
| 损坏的上传返回 500 | 没有做解码检查 | 返回 400，并带上具名错误 |
| 第一次请求就失败 | 模型加载得太晚 | 在服务启动时加载 |
| 手机上长上下文 OOM | 32K token 的 KV cache | 把上下文保持在 4K-8K |
| PTQ 的精度损失太大 | 静态 PTQ 不够 | 用带标签的数据做 QAT |

## 缩写
type: glossary
from: phases/04-computer-vision/15-real-time-edge/docs/en.md, phases/17-infrastructure-and-production/12-edge-inference/docs/en.md

- **PTQ**：训练后量化。量化一个已经训好的模型，不再重新训练。
- **QAT**：量化感知训练。精度最好。需要带标签的数据。
- **ONNX**：中立的模型格式。主流运行时都能读它。
- **FLOPs**：一次前向的浮点运算次数。算力的一个粗略代理。
- **ANE**：Apple Neural Engine。带统一内存的端侧 NPU。
- **QNN**：Qualcomm Neural Network SDK。用来访问 Hexagon。
- **统一内存**：CPU 和 NPU 看到的是同一块内存。没有拷贝开销。

## 问题
type: qa
from: phases/04-computer-vision/15-real-time-edge/docs/en.md, phases/04-computer-vision/16-vision-pipeline-capstone/docs/en.md, phases/17-infrastructure-and-production/12-edge-inference/docs/en.md

- **参数少于 3M 时用哪个模型？** MobileNetV3-Small。它在各种目标上都能编译。
- **参数在 10-20M 时用哪个模型？** ConvNeXt-Tiny。它对 CPU 友好。
- **为什么 FLOPs 更多反而可以更快？** 深度卷积编译得好。大的 7x7 卷积则不行。
- **流水线的延迟花在哪里？** 预处理在 CPU 上。检测器占掉 GPU 时间的 70-90%。
- **为什么边缘上的解码很慢？** 解码受内存限制。计算是次要的。

## 提示
type: tips
from: phases/04-computer-vision/15-real-time-edge/docs/en.md, phases/04-computer-vision/16-vision-pipeline-capstone/docs/en.md

- 除非有明确的理由，否则把每个边缘模型都量化到 INT8。
- 表格里的每一格都要在目标设备上测量，不要在工作站上测。
- 在每次响应里记下模型名和权重的哈希。
- 用每个请求自己的 trace ID 记下各阶段的耗时。
- 如果分类器超时，只返回检测结果，不带分类。
