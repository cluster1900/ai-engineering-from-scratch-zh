---
id: edge-inference
title: Edge Inference Targets
code: EI
subtitle: 选择边缘目标和量化格式。带宽上限、格式、导出步骤与设备端测量。
hue: 262
sources: phases/17-infrastructure-and-production/12-edge-inference, phases/04-computer-vision/15-real-time-edge, phases/10-llms-from-scratch/11-quantization
source_hash: a5869cfd5f78f468
---

## 四种边缘目标对比
type: comparison
span: 2
from: phases/17-infrastructure-and-production/12-edge-inference/docs/en.md, phases/17-infrastructure-and-production/12-edge-inference/code/main.py

| 因素 | Apple ANE | Qualcomm Hexagon | WebGPU / WebLLM | NVIDIA Jetson |
|---|---|---|---|---|
| 峰值 | 38 TOPS，M4 / A18 | 45 TOPS，X Elite / 8 Gen 4 | 浏览器 GPU，无需安装 | Orin Nano Super、AGX Orin、Thor |
| 内存 | 统一内存，无需拷贝 | 独立内存域 | 浏览器损耗 ~25% | Nano 上受内存限制 |
| 接入方式 | Core ML 或 MPS | QNN SDK、AI Hub | WebGPU compute shaders | vLLM、TensorRT Edge-LLM |
| 格式 | INT4 权重 + FP16 激活 | QNN INT8 / INT4 | Q4 MLC（`q4f16_1`） | Q4 GGUF、TRT-LLM INT4、NVFP4 |
| 实测 | 估计 8 tok/s，A18，8B Q4 | 7 tok/s，8 Gen 3，8B Q4 | ~41 tok/s，M3 Max，8B Q4 | ~40 tok/s，AGX Orin，gpt-oss-20b |
| 限制 | 原生 ANE 需要 Core ML | 需从 PyTorch 或 ONNX 转换 | 移动端覆盖率 ~70-75% | Nano 能装下 3B 模型 |

## 各目标的适用场景
type: concepts
from: phases/17-infrastructure-and-production/12-edge-inference/docs/en.md, phases/10-llms-from-scratch/11-quantization/docs/en.md

- **Apple ANE**：iOS 应用。用 Core ML 转换。INT4 权重加 FP16 激活。
- **Qualcomm Hexagon**：Snapdragon 手机和 Windows ARM 笔记本。用 QNN 或 AI Hub 转换。
- **WebGPU / WebLLM**：无需安装的浏览器应用。在同一个 OpenAI 兼容 API 上保留服务端回退。
- **Jetson Orin Nano Super**：8GB 上跑 Llama 3.2 3B 或 Phi-3。
- **Jetson AGX / Thor**：更大的模型，NVFP4 加 FP8 KV，EAGLE-3。
- **GGUF Q4_K_M**：CPU 和 Apple Silicon 笔记本。
- **GPTQ 或 AWQ INT4**：使用 CUDA 或 ROCm 的 GPU 推理。

## 解码上限
type: annotated-code
lang: python
from: phases/17-infrastructure-and-production/12-edge-inference/code/main.py

```python
def ceiling(target: Target, model_gb: float) -> float:
    seconds_per_token = model_gb / target.bandwidth_gb_s  # all weights per token
    return 1 / seconds_per_token  # tok/s upper bound
model_gb = 4.7  # Llama 3.1 8B Q4
Target("Apple A18 (iPhone 16)",   60,   8,  "phone with ANE")  # GB/s, observed tok/s
Target("Snapdragon 8 Gen 3",      77,   7,  "mid/high Android")
Target("WebGPU on M3 Max",       400,  41,  "browser penalty ~25%")
Target("Jetson AGX Orin",        205,  45,  "edge-datacenter bridge")
```

## 带宽计算
type: concepts
from: phases/17-infrastructure-and-production/12-edge-inference/docs/en.md

- **规则**：解码每个 token 都要读取全部权重。
- **7B Q4**：3.5 GB。在 50 GB/s 下一个 token 需要 70 ms，约 ~14 tok/s。
- **高端移动设备**：90 GB/s 约为 ~25 tok/s。
- **3 TB/s 的 HBM3**：每个 token 1.2 ms，上限 830 tok/s。
- **差距**：数据中心与移动 DRAM 之间相差 30-50x。
- **长上下文**：8 GB 手机上，4 GB 模型加 32K 时 2 GB 的 KV 会 OOM。
- **边缘上的上下文**：保持 4K-8K，除非接受 Q4 KV。

## 量化格式，Llama 3 70B
type: comparison
from: phases/10-llms-from-scratch/11-quantization/docs/en.md

| 因素 | FP16 | FP8 | AWQ INT4 | GGUF Q4_K_M |
|---|---|---|---|---|
| 大小 | 140GB | 70GB | 35GB | 40GB |
| 困惑度 | 3.12 | 3.14 | 4.18 | 4.25 |
| MMLU | 79.5% | 79.3% | 78.1% | 77.9% |
| Tokens/sec | 38，A100 | 55，A100 | 75，A100 | 28，CPU |
| 最适合 | 基线 | H100 部署 | GPU 推理 | CPU、Metal |

## 量化与反量化
type: annotated-code
lang: python
from: phases/10-llms-from-scratch/11-quantization/docs/en.md

```python
scale = max(abs(tensor)) / 127  # symmetric INT8
quantized = clamp(round(tensor / scale), -128, 127)
reconstructed = quantized * scale  # error at most scale / 2
quantized = round(tensor / scale) + zero_point  # asymmetric, for ReLU outputs
```

## 任务
type: task-table
span: 2
from: phases/17-infrastructure-and-production/12-edge-inference/docs/en.md, phases/04-computer-vision/15-real-time-edge/docs/en.md, phases/04-computer-vision/15-real-time-edge/code/main.py, phases/10-llms-from-scratch/11-quantization/docs/en.md

| 任务 | 代码 |
|---|---|
| 边缘解码上限，第 12 课 | `code/main.py` |
| 在设备上测量 p50、p95、p99 | `measure_latency(model, input_shape, device="cpu", warmup=10, iters=50)` |
| 正确计时 GPU 工作 | 在计时块前后调用 `torch.cuda.synchronize()` |
| 静态 INT8 PTQ 配置 | `model.qconfig = tq.get_default_qconfig(backend)` |
| 导出到 ONNX | `torch.onnx.export(model, sample_input, path, opset_version=17)` |
| GPTQ INT4 | `GPTQConfig(bits=4, group_size=128)` |
| GGUF Q4_K_M | `llama.cpp/build/bin/llama-quantize llama-8b-f16.gguf llama-8b-q4km.gguf Q4_K_M` |
| WebLLM 权重 | `mlc_llm convert_weight` 加编译好的 `.wasm` |

## 视觉部署路径
type: flow
from: phases/04-computer-vision/15-real-time-edge/docs/en.md

1. **选择 backbone**：参数少于 3M 用 MobileNetV3-Small。3-10M 用 EfficientNet-Lite-B0。
2. **测量**：预热 5-10 次前向。把输入尺寸固定为生产分辨率。
3. **量化**：训练后静态 INT8。确认精度损失低于 1%。
4. **导出**：PyTorch 转 ONNX。`dynamic_axes` 允许任意 batch size。
5. **运行时**：Jetson 上用 TensorRT。iOS 上用 Core ML。Android 上用 TFLite。
6. **决策**：依据在设备上测得的模型、延迟、内存和精度表格。

## 故障排查
type: troubleshooting
from: phases/17-infrastructure-and-production/12-edge-inference/docs/en.md, phases/04-computer-vision/15-real-time-edge/docs/en.md, phases/10-llms-from-scratch/11-quantization/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| iPhone 16 Pro 上 8B Q4 只有 3 tok/s | 移动端带宽差距 | 更小的模型或更少的位数 |
| 手机上长上下文 OOM | 32K 的 KV cache 为 2 GB | 上下文保持 4K-8K 或使用 Q4 KV |
| WebLLM 拒绝 GGUF 文件 | 不支持 GGUF | 转换为 Q4 MLC（`q4f16_1`） |
| iOS 上的 llama.cpp 不使用 ANE | Metal 后端使用 MPS | 用 Core ML 转换 |
| 旧 Android 浏览器没有 WebGPU | 需要 Chrome v121+ | 回退到服务端 API |
| 最初的延迟数字过高 | 缓存冷启动与 JIT | 用 5-10 次空跑预热 |
| 朴素 INT4 输出是乱码 | 舍入误差累积 | 用带校准数据的 GPTQ 或 AWQ |
| 困惑度增量超过 2.0 | 出了问题 | 重新检查。低于 0.5 为优秀 |

## 格式术语
type: glossary
from: phases/10-llms-from-scratch/11-quantization/docs/en.md

- **BF16**：8 位指数、7 位尾数。范围与 FP32 相同。
- **FP8 E4M3**：推理时的权重和激活。
- **FP8 E5M2**：训练中的梯度。范围更大。
- **INT8**：从 -128 到 127 的 256 个值。需要缩放因子。
- **INT4**：16 个级别。需要 GPTQ 或 AWQ 保证质量。
- **GGUF**：llama.cpp 的文件格式，各层可混合精度。
- **PTQ**：训练后量化。128-1024 个校准样本。
- **QAT**：训练中做伪量化。在 INT4 和 INT2 上更好。

## 问答
type: qa
from: phases/17-infrastructure-and-production/12-edge-inference/docs/en.md, phases/04-computer-vision/15-real-time-edge/docs/en.md, phases/10-llms-from-scratch/11-quantization/docs/en.md

- **为什么边缘上算力是次要的？** 解码受内存限制。带宽决定上限。
- **WebLLM 比原生快多少？** 在同一后端上约为原生的 70-80%。
- **看 FLOPs 还是延迟？** 架构搜索看 FLOPs。部署看设备端延迟。
- **视觉用 PTQ 还是 QAT？** 静态 PTQ 用 5% 的工作量获得 95% 的收益。
- **FP8 安全吗？** 在 H100 上安全。快 30-50%，质量损失低于 0.1%。
