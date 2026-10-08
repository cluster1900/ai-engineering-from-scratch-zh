# Quantization: 让模型装得下

> Một 70B  mô hình sử dụng FP16 需要140GB──光是权重就需要两张A100──Quantize到FP8:一张80GB GPU──INT4:一台MacBook──

**Type:** Build
**Languages:** Python (with numpy)
**前置要求:**Giai đoạn 10,课程 01-10 (LLM từ đầu)
**Time:** ~120 minutes

## Học mục tiêu
- Thực hiện từ FP16 đến INT8 và INT4 của đối xứng với định lượng không đối xứng, bao gồm cả per-tensor và per-channel quy mô
- 计算 định lượng 带来的内存节省,并判断哪种精度 能装进给定的 GPU 的VRAM
- 解释 Quantization post-training (PTQ) và đào tạo nhận thức về lượng (QAT)
- Sử dụng GPTQ hoặc AWQ định lượng một mô hình thực tế, và đánh giá chuẩn để đo lường sự chính xác-thưởng thức tradeoff

## 问题
Llama 3 70B có 700 tỷ tham số. Mỗi tham số là một số điểm nổi 16 bit.

Nhưng mỗi tham số sử dụng 16 bit rất lãng phí. Phần lớn trọng lượng trong mạng thần kinh tập trung ở gần zero. Phạm vi động lực hoàn chỉnh củaFP16 được sử dụng gần như không được sử dụng. Nếu bạn đo lường phân bố thực tế trọng lượng trong Llama 3 70B, 95% đều nằm trong khoảng từ -0.1 đến +0.1 . Bạn đang sử dụng 16 bit cho thấy bạn có thể đưa vào giá trị 4 bit.

Quantization sử dụng độ chính xác thấp số thay thế số chính xác cao số.FP16 đến FP8 sẽ cắt bộ nhớ một nửa.FP16 đến INT4 sẽ cắt xuống một phần tư.

代价是精度──你移除的每一点都会破坏信息──问题是你会损失多少精度,以及损失在哪里──一个量化得到好的INT4模型,在大多数基准上能保留原始模型的质量95%-99%. 一次天真的量化到INT4可能会彻底毁掉模型──差异在技术中──

社区对Llama 3做INT4 GPTQ quantization结果显示, trên WikiText trên khoảng mất 1-2 điểm phức tạp. Mistral đã phát hành các điểm kiểm soát FP8 của Mixtral 8x22B, trên MMLU không có sự mất mát chất lượng đáng đo lường.

## 概念
### Các định dạng số: Mỗi bit làm gì

Mỗi số điểm nổi có ba phần: dấu hiệu, biểu tượng và biểu tượng, cũng được gọi là biểu tượng, biểu tượng là một bit, biểu tượng quyết định phạm vi của số có thể có nhiều hoặc nhiều nhỏ.

```
FP32:  [1 sign] [8 exponent] [23 mantissa]  = 32 bits
FP16:  [1 sign] [5 exponent] [10 mantissa]  = 16 bits
BF16:  [1 sign] [8 exponent] [7  mantissa]  = 16 bits
FP8:   [1 sign] [4 exponent] [3  mantissa]  = 8  bits (E4M3)
FP8:   [1 sign] [5 exponent] [2  mantissa]  = 8  bits (E5M2)
INT8:  [1 sign] [7 value]                   = 8  bits (uniform steps)
INT4:  [1 sign] [3 value]                   = 4  bits (16 levels total)
```

**FP32** 23 个 mantissa bit 给你大约 7 位进制精度──范围: từ khoảng 1,2 x 10^-38 đến 3.4 x 10^38──过去训练 几乎只使用FP32──现在它仍然用于积累(matrix乘法期间运行求和)──

**FP16**Để giảm một nửa các bit, 10 bit mantissa cung cấp độ chính xác khoảng 3,3 bit, giảm một phần nhỏ đến 5 bit, phạm vi giảm đáng kể.

**BF16**(Brain Float 16) giữ cho hàm lượng 8 bit của FP32 giảm xuống 7 bit, nhưng hãy làm cho mantissa giảm xuống 7 bit. phạm vi và FP32 tương tự, độ chính xác so với FP16 thấp hơn. Google đặc biệt thiết kế nó cho Deep Learning.

**FP8**Có hai hình thức: E4M3 (4, hàm số 3, hàm số 3) được sử dụng để suy luận: 期间的重量和激活. E5M2 (5, hàm số 2) được sử dụng cho gradients trong thời gian đào tạo.

**INT8**Bạn cần một yếu tố thang điểm Đặt trọng lượng điểm nổi lên đến phạm vi này. 优势是: số nguyên tử so với điểm nổi 更快,也更省电. A100 trên INT8 tử liệu nhân lên đến 624 TOPS, trong khi FP16 là 312 TFLOPS.

**INT4**Hơn nữa, chỉ có 16 yếu tố có thể đạt được giá trị quy mô đã thực hiện rất nhiều công việc.

```mermaid
graph LR
    subgraph Formats["Number Format Landscape"]
        direction TB
        FP32["FP32\n32 bits\n4 bytes/param\nTraining gold standard"]
        BF16["BF16\n16 bits\n2 bytes/param\nTraining default"]
        FP16["FP16\n16 bits\n2 bytes/param\nInference baseline"]
        FP8["FP8\n8 bits\n1 byte/param\n30-50% faster"]
        INT8["INT8\n8 bits\n1 byte/param\n2x throughput"]
        INT4["INT4\n4 bits\n0.5 bytes/param\n4x compression"]
    end

    FP32 -->|"training"| BF16
    BF16 -->|"inference"| FP16
    FP16 -->|"H100 native"| FP8
    FP16 -->|"server deploy"| INT8
    FP16 -->|"edge/laptop"| INT4

    style FP32 fill:#1a1a2e,stroke:#0f3460,color:#fff
    style BF16 fill:#1a1a2e,stroke:#0f3460,color:#fff
    style FP16 fill:#1a1a2e,stroke:#ffa500,color:#fff
    style FP8 fill:#1a1a2e,stroke:#51cf66,color:#fff
    style INT8 fill:#1a1a2e,stroke:#51cf66,color:#fff
    style INT4 fill:#1a1a2e,stroke:#e94560,color:#fff
```

### Quantization 如何工作

核心操作很简单── lấy một tensor của các giá trị điểm nổi, tìm một yếu tố quy mô, nhân除、lòng đến số nguyên gần nhất, sau đó lưu trữ số nguyên tố cộng với yếu tố quy mô──

**Quantize:**
```
scale = max(abs(tensor)) / max_int_value
quantized = round(tensor / scale)
```

**Dequantize:**
```
reconstructed = quantized * scale
```

Đối với phạm vi đối xứng ((-127 đến 127) của INT8:
```
scale = max(abs(tensor)) / 127
quantized = clamp(round(tensor / scale), -128, 127)
```

误差就是圆错.`scale / 2`❖ Sự khác biệt tổng thể của một lớp phụ thuộc vào số lượng trọng lượng bạn có, cũng như độ nhạy cảm của mô hình đối với các tác động của trọng lượng này.

**Per-tensor vs per-channel quantization。**Per-tensor đối với toàn bộ khối lượng tử liệu sử dụng một yếu tố thang điểm. đơn giản nhưng có tổn thất: nếu một hàng có giá trị lớn, một hàng khác có giá trị nhỏ, giá trị nhỏ sẽ mất phần lớn độ chính xác.

**Asymmetric quantization**添加一个零点抵消:`quantized = round(tensor / scale) + zero_point`◊This can be handled not in zero-centered distribution― chẳng hạn như hoạt động ReLU 永远非负的―Symmetric quantization 会把一半整数范围 浪费在永远不会出现的负值上―Asymmetric quantization 会把实际范围 [min, max] 映射到完整整整数范围―

### Tầm quan trọng

Các phần khác nhau trong mô hình không đồng bộ với sự dung nạp của định lượng. Có một cấp độ rõ ràng.

**Weights（最稳健）。**模型权重在训练期间变化缓慢,并遵循大致以零为中心的Gaussian分布──它们非常适合量化──带 per-channel scales 的INT8 weights 几乎无损──INT4 需要更复杂的方法,但也可行──

**Activations（中等敏感）。**Các hoạt động là suy luận 期间流经网络的中间值──它们的动态范围比权重更宽,并且包含outliers──单个注意头可能产生比平均值大100倍的激活值──这些outliers对模型质量很关键──无数量化会破坏信息解决──方案:把外向道保持在更高精度 (LLM.int8()), sử dụng per-token hoặc per-channel kích hoạt thang đo──

**KV cache（高敏感）。**KV cache có giá trị khóa  lưu trữ tất cả các token trước đây lưu trữ rất nhiều lưu trữ, nhưng bất kỳ sai sót nào sẽ xảy ra trong tất cả các tính toán chú ý tiếp theo.

**Attention logits（最敏感）。**Sự nhạy cảm cao của độ mềmmax đối với các thay đổi nhỏ của đầu vào. Phạm vi định lượng 0.01 của logic pre-softmax cũng có thể thay đổi đáng kể phân phối sự chú ý. Hầu hết các quy trình định lượng ngay cả khi trong các phần khác được định lượng.

```mermaid
graph TD
    subgraph Sensitivity["Quantization Sensitivity (Low to High)"]
        direction LR
        W["Weights\nGaussian, near zero\nINT4 works well"]
        A["Activations\nWider range, outliers\nINT8 with care"]
        KV["KV Cache\nErrors compound\nFP8 or INT8"]
        ATT["Attention Logits\nSoftmax amplifies error\nKeep in FP16"]
    end

    W -->|"safe"| A
    A -->|"careful"| KV
    KV -->|"dangerous"| ATT

    style W fill:#1a1a2e,stroke:#51cf66,color:#fff
    style A fill:#1a1a2e,stroke:#ffa500,color:#fff
    style KV fill:#1a1a2e,stroke:#e94560,color:#fff
    style ATT fill:#1a1a2e,stroke:#ff0000,color:#fff
```

### PTQ vs QAT

**Post-Training Quantization (PTQ)**quantize một mô hình đã được đào tạo tốt。 không được đào tạo lại。 bạn lấy trọng lượng FP16, các yếu tố tính toán quy mô, vòng, rồi triển khai。 nó rất nhanh( vài phút đến vài giờ) và便宜。 đối với INT8 và FP8  hiệu quả rất tốt。 đối với INT4, PTQ ỹ năng 往往失败 rất nghiêm trọng, vì sai lầm tròn 会积── Advanced PTQ methods(GPTQ、AWQ) sử dụng dữ liệu hiệu chuẩn để giảm thiểu sai lầm định lượng。

**Quantization-Aware Training (QAT)**Trong quá trình đào tạo, các mô hình được phân tích bằng các phương pháp định lượng giả mạo. Trong quá trình đào tạo, các mô hình được phân tích bằng các phương pháp định lượng giả mạo.

| Aspect | PTQ | QAT |
|--------|-----|-----|
| Cost | 几分钟到几小时 | 完整 training run |
| Quality at INT8 | 极佳（< 0.1% 损失） | 极佳 |
| Quality at INT4 | 使用 GPTQ/AWQ 时良好（1-3% 损失） | 更好（< 1% 损失） |
| Quality at INT2 | 较差 | 对某些任务可用 |
| Calibration data | 128-1024 个 examples | 完整 training dataset |
| When to use | 部署、迭代 | 低 bit-width 下的最高质量 |

### GPTQ, AWQ, GGUF

**GPTQ (GPT Quantization)**là một phương pháp PTQ một lần. Nó một lần định lượng một lớp, sử dụng bộ dữ liệu hiệu chuẩn nhỏ (thường là 128 ví dụ) để đo Hessian (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (như Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian) (Hessian (Hessian) (Hessian) (Hessian) (Hessian (Hessian) (Hessian) (Hessian) (Hessian (Hessian) (Hessian) (Hessian) (Hessian (Hessian) (Hessian) (Hessian (Hessian) (Hessian) (Hessian (Hessian) (Hessian) (Hessian (Hessian) (Hessian) (Hessian (Hessian) (Hessian) (Hessian) (Hessian (Hessian) (Hessian) (Hessian) (

**AWQ (Activation-Aware Weight Quantization)**观察到少量权重 (khoảng 1%) rất quan trọng, bởi vì chúng sẽ có giá trị kích hoạt lớn hơn 相乘──AWQ Sử dụng dữ liệu hiệu chuẩn hóa  tìm những trọng lượng nổi bật này, và định lượng trước để tăng chúng, rồi để đối phó với kích hoạt 缩小)──

**GGUF (GPT-Generated Unified Format)**là định dạng tập tin llama.cpp  và sử dụng trong môi trường của nó. Nó hỗ trợ định lượng hỗn hợp: các lớp khác nhau sử dụng chiều rộng bit khác nhau. Lớp đầu tiên và cuối cùng của nó.

```mermaid
graph TD
    subgraph Methods["Quantization Methods"]
        direction TB
        GPTQ_["GPTQ\nHessian-guided\nPer-layer optimization\nPopular on HuggingFace"]
        AWQ_["AWQ\nActivation-aware\nSalient weight scaling\n1.5-2x faster than GPTQ"]
        GGUF_["GGUF\nMixed precision\nCPU + Metal optimized\nllama.cpp ecosystem"]
    end

    subgraph Use["Best For"]
        GPU["GPU inference\n(CUDA, ROCm)"]
        EDGE["Edge / Laptop\n(CPU, Metal)"]
    end

    GPTQ_ --> GPU
    AWQ_ --> GPU
    GGUF_ --> EDGE

    style GPTQ_ fill:#1a1a2e,stroke:#ffa500,color:#fff
    style AWQ_ fill:#1a1a2e,stroke:#51cf66,color:#fff
    style GGUF_ fill:#1a1a2e,stroke:#0f3460,color:#fff
```

### Đánh giá chất lượng

Làm sao bạn biết mô hình lượng tử có đủ hay không?

**Perplexity。**Trong tập dữ liệu được giữ lại, "WikiText-2 là tiêu chuẩn" trên phân biệt tính toán nguyên thủy mô hình và mô hình lượng tử.

**Task-specific benchmarks。**Trong MMLU、HumanEval、GSM8K hoặc bộ đánh giá tự định của bạn 上运行 mô hình định lượng ⋅ so sánh với mô hình nguyên thủy。 Quantization ảnh hưởng đến các khả năng khác nhau không đồng đều。 Mathematics và code tasks dễ bị ảnh hưởng bởi sự mất độ chính xác hơn kiến thức chung ⋅ ảnh hưởng ⋅

**Output comparison。**Trong cùng các yêu cầu 上让两个模型生成答案并比较.LLM-as-judge (Lớp 10) ở đây rất hiệu quả.

**Latency and throughput。**Sự tồn tại của định lượng là để làm cho mô hình nhanh hơn, rẻ hơn, đo các token mỗi giây, thời gian để đầu tiên và sử dụng bộ nhớ, một mô hình định lượng chậm hơn so với mô hình ban đầu, không có giá trị.

| Model | Format | Size | Perplexity (WikiText-2) | MMLU | Tokens/sec (A100) |
|-------|--------|------|------------------------|------|-------------------|
| Llama 3 70B | FP16 | 140GB | 3.12 | 79.5% | 38 |
| Llama 3 70B | FP8 | 70GB | 3.14 | 79.3% | 55 |
| Llama 3 70B | GPTQ INT4 | 35GB | 4.32 | 77.8% | 72 |
| Llama 3 70B | AWQ INT4 | 35GB | 4.18 | 78.1% | 75 |
| Llama 3 70B | GGUF Q4_K_M | 40GB | 4.25 | 77.9% | 28 (CPU) |

Quy tắc là:FP8  hầu như không có giá cả.INT4  mất 1-2 điểm MMLU, nhưng tiêu thụ gấp đôi, bộ nhớ giảm xuống còn một phần tư.

### Số thực

H100 lên FP16 đến FP8:Inference tăng tốc 30-50%, chất lượng mất < 0.1%── đây là một cách xác định lượng rõ ràng── mỗi H100 部署 đều nên sử dụng nó──

FP16 đến INT8 (LLM.int8():内存 giảm 2x, chất lượng mất < 0.5%──mích độ chính xác  phương pháp để giữ các tính năng ngoại lệ  giữ trong FP16, đồng thời để lượng hóa tất cả các nội dung khác đến INT8──

FP16 đến INT4 (GPTQ/AWQ): bộ nhớ giảm 4x, mất chất lượng 1-3%, tùy thuộc vào mô hình và phương pháp.

FP16 đến INT4 (GGUF Q4_K_M): trong bộ nhớ giảm 3,5x, chất lượng mất 1-2%。 đối với suy luận CPU 优化。Q4_K_M 下的70B 模型约40GB,在配备64GB的M3 Max 上以 10-15 token/秒运行。

FP16 đến INT2: bộ nhớ giảm 8x, mất chất lượng 5-15%── chỉ phù hợp với các nhiệm vụ khép kín nhất định có thể chịu đựng sự biến đổi── nghiên cứu trước, không phù hợp với sản xuất chung──


```figure
quantization
```

##  xây dựng nó
### 步骤 1: 数字格式表示

构建 từng dạng định dạng đại diện cấp bit,准确观察 sign、exponent 和 mantissa的作用──

```python
import numpy as np


def float_to_fp32_bits(value):
    bits = np.float32(value).view(np.uint32)
    sign = (bits >> 31) & 1
    exponent = (bits >> 23) & 0xFF
    mantissa = bits & 0x7FFFFF
    return {"sign": int(sign), "exponent": int(exponent), "mantissa": int(mantissa),
            "exponent_bits": format(int(exponent), '08b'),
            "mantissa_bits": format(int(mantissa), '023b'),
            "value": float(value),
            "actual_exponent": int(exponent) - 127}


def float_to_fp16_bits(value):
    fp16 = np.float16(value)
    bits = fp16.view(np.uint16)
    sign = (bits >> 15) & 1
    exponent = (bits >> 10) & 0x1F
    mantissa = bits & 0x3FF
    return {"sign": int(sign), "exponent": int(exponent), "mantissa": int(mantissa),
            "exponent_bits": format(int(exponent), '05b'),
            "mantissa_bits": format(int(mantissa), '010b'),
            "value": float(fp16),
            "actual_exponent": int(exponent) - 15}


def float_to_bf16_bits(value):
    fp32_bits = np.float32(value).view(np.uint32)
    bf16_bits = (fp32_bits >> 16).astype(np.uint16)
    sign = (bf16_bits >> 15) & 1
    exponent = (bf16_bits >> 7) & 0xFF
    mantissa = bf16_bits & 0x7F
    reconstructed = np.uint32(bf16_bits.astype(np.uint32) << 16).view(np.float32)
    return {"sign": int(sign), "exponent": int(exponent), "mantissa": int(mantissa),
            "exponent_bits": format(int(exponent), '08b'),
            "mantissa_bits": format(int(mantissa), '07b'),
            "value": float(reconstructed),
            "actual_exponent": int(exponent) - 127}


def simulate_fp8_e4m3(value):
    sign = 1 if value < 0 else 0
    abs_val = abs(value)
    max_val = 448.0
    abs_val = min(abs_val, max_val)
    if abs_val == 0:
        return {"sign": sign, "exponent": 0, "mantissa": 0, "value": 0.0,
                "exponent_bits": "0000", "mantissa_bits": "000"}
    exp = int(np.floor(np.log2(abs_val)))
    exp = max(-6, min(8, exp))
    mantissa_val = abs_val / (2.0 ** exp) - 1.0
    mantissa_quant = round(mantissa_val * 8) / 8
    mantissa_quant = max(0, min(0.875, mantissa_quant))
    reconstructed = (1.0 + mantissa_quant) * (2.0 ** exp)
    if sign:
        reconstructed = -reconstructed
    mantissa_int = int(round(mantissa_quant * 8))
    return {"sign": sign, "exponent": exp + 7, "mantissa": mantissa_int,
            "exponent_bits": format(exp + 7, '04b'),
            "mantissa_bits": format(mantissa_int, '03b'),
            "value": float(reconstructed),
            "actual_exponent": exp}


def display_format_comparison(value):
    fp32 = float_to_fp32_bits(value)
    fp16 = float_to_fp16_bits(value)
    bf16 = float_to_bf16_bits(value)
    fp8 = simulate_fp8_e4m3(value)

    print(f"\n  Value: {value}")
    print(f"  {'Format':<8} {'Stored Value':>14} {'Error':>12} {'Sign':>5} {'Exp Bits':>10} {'Man Bits':>25}")
    print(f"  {'-'*76}")
    print(f"  {'FP32':<8} {fp32['value']:>14.6f} {abs(fp32['value'] - value):>12.8f} {fp32['sign']:>5} {fp32['exponent_bits']:>10} {fp32['mantissa_bits']:>25}")
    print(f"  {'FP16':<8} {fp16['value']:>14.6f} {abs(fp16['value'] - value):>12.8f} {fp16['sign']:>5} {fp16['exponent_bits']:>10} {fp16['mantissa_bits']:>25}")
    print(f"  {'BF16':<8} {bf16['value']:>14.6f} {abs(bf16['value'] - value):>12.8f} {bf16['sign']:>5} {bf16['exponent_bits']:>10} {bf16['mantissa_bits']:>25}")
    print(f"  {'FP8e4m3':<8} {fp8['value']:>14.6f} {abs(fp8['value'] - value):>12.8f} {fp8['sign']:>5} {fp8['exponent_bits']:>10} {fp8['mantissa_bits']:>25}")
```

### 步骤 2: Quantization đối xứng (Per-Tensor và Per-Channel)

基础 định lượng hóa hoạt động. Per-tensor đối với toàn bộ matrix sử dụng một thang. Per-channel đối với mỗi đường hoặc mỗi đường sử dụng một thang.

```python
def quantize_symmetric(tensor, num_bits=8):
    qmin = -(2 ** (num_bits - 1))
    qmax = 2 ** (num_bits - 1) - 1
    abs_max = np.max(np.abs(tensor))
    if abs_max == 0:
        return np.zeros_like(tensor, dtype=np.int32), 1.0
    scale = abs_max / qmax
    quantized = np.clip(np.round(tensor / scale), qmin, qmax).astype(np.int32)
    return quantized, float(scale)


def dequantize_symmetric(quantized, scale):
    return quantized.astype(np.float64) * scale


def quantize_per_channel(tensor, num_bits=8, axis=0):
    qmin = -(2 ** (num_bits - 1))
    qmax = 2 ** (num_bits - 1) - 1

    if axis == 0:
        abs_max = np.max(np.abs(tensor), axis=1, keepdims=True)
    else:
        abs_max = np.max(np.abs(tensor), axis=0, keepdims=True)

    abs_max = np.where(abs_max == 0, 1.0, abs_max)
    scales = abs_max / qmax
    quantized = np.clip(np.round(tensor / scales), qmin, qmax).astype(np.int32)
    return quantized, scales.squeeze()


def dequantize_per_channel(quantized, scales, axis=0):
    if axis == 0:
        return quantized.astype(np.float64) * scales.reshape(-1, 1)
    else:
        return quantized.astype(np.float64) * scales.reshape(1, -1)


def quantize_asymmetric(tensor, num_bits=8):
    qmin = 0
    qmax = 2 ** num_bits - 1
    t_min = np.min(tensor)
    t_max = np.max(tensor)
    if t_max == t_min:
        return np.zeros_like(tensor, dtype=np.int32), 1.0, 0
    scale = (t_max - t_min) / (qmax - qmin)
    zero_point = int(np.round(qmin - t_min / scale))
    zero_point = max(qmin, min(qmax, zero_point))
    quantized = np.clip(np.round(tensor / scale + zero_point), qmin, qmax).astype(np.int32)
    return quantized, float(scale), int(zero_point)


def dequantize_asymmetric(quantized, scale, zero_point):
    return (quantized.astype(np.float64) - zero_point) * scale
```

### 步骤 3: chất lượng đo

 đo lượng hóa 破坏了多少信息──Mức độ sai trái vuông trung bình, tỷ lệ tín hiệu-ruy, cũng như sự tương đồng cosine giữa tensor nguyên thủy và tensor trọng cấu trúc ──

```python
def quantization_error(original, reconstructed):
    diff = original - reconstructed
    mse = float(np.mean(diff ** 2))
    rmse = float(np.sqrt(mse))
    max_error = float(np.max(np.abs(diff)))
    signal_power = float(np.mean(original ** 2))
    snr_db = 10 * np.log10(signal_power / max(mse, 1e-20))

    orig_flat = original.flatten()
    recon_flat = reconstructed.flatten()
    norm_orig = np.linalg.norm(orig_flat)
    norm_recon = np.linalg.norm(recon_flat)
    if norm_orig == 0 or norm_recon == 0:
        cosine_sim = 0.0
    else:
        cosine_sim = float(np.dot(orig_flat, recon_flat) / (norm_orig * norm_recon))

    return {"mse": mse, "rmse": rmse, "max_error": max_error,
            "snr_db": float(snr_db), "cosine_similarity": cosine_sim}


def compare_quantization_methods(tensor, num_bits=8):
    q_pt, s_pt = quantize_symmetric(tensor, num_bits)
    recon_pt = dequantize_symmetric(q_pt, s_pt)
    err_pt = quantization_error(tensor, recon_pt)

    q_pc, s_pc = quantize_per_channel(tensor, num_bits, axis=0)
    recon_pc = dequantize_per_channel(q_pc, s_pc, axis=0)
    err_pc = quantization_error(tensor, recon_pc)

    q_asym, s_asym, zp = quantize_asymmetric(tensor, num_bits)
    recon_asym = dequantize_asymmetric(q_asym, s_asym, zp)
    err_asym = quantization_error(tensor, recon_asym)

    print(f"\n  Quantization Comparison ({num_bits}-bit, tensor shape {tensor.shape}):")
    print(f"  {'Method':<20} {'MSE':>12} {'SNR (dB)':>10} {'Cosine Sim':>12} {'Max Error':>12}")
    print(f"  {'-'*68}")
    print(f"  {'Per-tensor sym':<20} {err_pt['mse']:>12.8f} {err_pt['snr_db']:>10.2f} {err_pt['cosine_similarity']:>12.8f} {err_pt['max_error']:>12.8f}")
    print(f"  {'Per-channel sym':<20} {err_pc['mse']:>12.8f} {err_pc['snr_db']:>10.2f} {err_pc['cosine_similarity']:>12.8f} {err_pc['max_error']:>12.8f}")
    print(f"  {'Asymmetric':<20} {err_asym['mse']:>12.8f} {err_asym['snr_db']:>10.2f} {err_asym['cosine_similarity']:>12.8f} {err_asym['max_error']:>12.8f}")

    return {"per_tensor": err_pt, "per_channel": err_pc, "asymmetric": err_asym}
```

### 步骤 4: Bỏ một chút rộng

Sử dụng các bit rộng khác nhau (tương tự như 2 3, 4, 8, 16) định lượng cùng một tensor, và đo chất lượng ở mỗi cấp độ.

```python
def bit_width_sweep(tensor):
    print(f"\n  Bit-Width Sweep (tensor shape {tensor.shape}):")
    print(f"  {'Bits':>6} {'Levels':>8} {'MSE':>14} {'SNR (dB)':>10} {'Cosine Sim':>12} {'Compression':>12}")
    print(f"  {'-'*64}")

    results = []
    for bits in [2, 3, 4, 8, 16]:
        q, s = quantize_per_channel(tensor, bits, axis=0)
        recon = dequantize_per_channel(q, s, axis=0)
        err = quantization_error(tensor, recon)
        levels = 2 ** bits
        compression = 32.0 / bits

        print(f"  {bits:>6} {levels:>8} {err['mse']:>14.8f} {err['snr_db']:>10.2f} {err['cosine_similarity']:>12.8f} {compression:>11.1f}x")
        results.append({"bits": bits, "levels": levels, "error": err, "compression": compression})

    return results
```

### 步骤 5: Thử nghiệm nhạy cảm

模拟量化变压器的不同部分,并衡量哪些组件最敏感──这显示了敏感度等级:重量 <激活< KV cache <注意──

```python
def simulate_transformer_layer(input_data, weights, kv_scale=1.0):
    hidden = input_data @ weights["qkv"]
    seq_len = hidden.shape[1]
    d_model = weights["qkv"].shape[1] // 3
    q, k, v = hidden[:, :, :d_model], hidden[:, :, d_model:2*d_model], hidden[:, :, 2*d_model:]

    attn_scores = (q @ k.transpose(0, 2, 1)) / np.sqrt(d_model) * kv_scale
    attn_max = np.max(attn_scores, axis=-1, keepdims=True)
    attn_exp = np.exp(attn_scores - attn_max)
    attn_weights = attn_exp / np.sum(attn_exp, axis=-1, keepdims=True)

    attn_output = attn_weights @ v
    output = attn_output @ weights["out"]
    return output, {"q": q, "k": k, "v": v, "attn_scores": attn_scores,
                    "attn_weights": attn_weights, "attn_output": attn_output}


def sensitivity_experiment(batch_size=2, seq_len=16, d_model=64, num_bits=8):
    np.random.seed(42)
    input_data = np.random.randn(batch_size, seq_len, d_model) * 0.1

    weights = {
        "qkv": np.random.randn(d_model, 3 * d_model) * (2.0 / d_model) ** 0.5,
        "out": np.random.randn(d_model, d_model) * (2.0 / d_model) ** 0.5,
    }

    baseline_output, baseline_internals = simulate_transformer_layer(input_data, weights)

    experiments = {}

    q_qkv, s_qkv = quantize_per_channel(weights["qkv"], num_bits, axis=0)
    q_out, s_out = quantize_per_channel(weights["out"], num_bits, axis=0)
    quantized_weights = {
        "qkv": dequantize_per_channel(q_qkv, s_qkv, axis=0),
        "out": dequantize_per_channel(q_out, s_out, axis=0),
    }
    weight_quant_output, _ = simulate_transformer_layer(input_data, quantized_weights)
    experiments["Weights only"] = quantization_error(baseline_output, weight_quant_output)

    _, fresh_internals = simulate_transformer_layer(input_data, weights)
    q_act, s_act = quantize_per_channel(
        fresh_internals["attn_output"].reshape(-1, d_model), num_bits, axis=0
    )
    quant_attn_out = dequantize_per_channel(q_act, s_act, axis=0).reshape(batch_size, seq_len, d_model)
    act_quant_output = quant_attn_out @ weights["out"]
    experiments["Activations only"] = quantization_error(baseline_output, act_quant_output)

    q_k, s_k = quantize_per_channel(fresh_internals["k"].reshape(-1, d_model), num_bits, axis=0)
    q_v, s_v = quantize_per_channel(fresh_internals["v"].reshape(-1, d_model), num_bits, axis=0)
    quant_k = dequantize_per_channel(q_k, s_k, axis=0).reshape(batch_size, seq_len, d_model)
    quant_v = dequantize_per_channel(q_v, s_v, axis=0).reshape(batch_size, seq_len, d_model)
    attn_scores_kv = (fresh_internals["q"] @ quant_k.transpose(0, 2, 1)) / np.sqrt(d_model)
    attn_max_kv = np.max(attn_scores_kv, axis=-1, keepdims=True)
    attn_exp_kv = np.exp(attn_scores_kv - attn_max_kv)
    attn_weights_kv = attn_exp_kv / np.sum(attn_exp_kv, axis=-1, keepdims=True)
    kv_quant_output = (attn_weights_kv @ quant_v) @ weights["out"]
    experiments["KV cache only"] = quantization_error(baseline_output, kv_quant_output)

    noise_scale = np.std(fresh_internals["attn_scores"]) * 0.05
    noisy_scores = fresh_internals["attn_scores"] + np.random.randn(*fresh_internals["attn_scores"].shape) * noise_scale
    noisy_max = np.max(noisy_scores, axis=-1, keepdims=True)
    noisy_exp = np.exp(noisy_scores - noisy_max)
    noisy_weights = noisy_exp / np.sum(noisy_exp, axis=-1, keepdims=True)
    attn_quant_output = (noisy_weights @ fresh_internals["v"]) @ weights["out"]
    experiments["Attention logits (5% noise)"] = quantization_error(baseline_output, attn_quant_output)

    print(f"\n  Sensitivity Experiment ({num_bits}-bit quantization):")
    print(f"  {'Component':<30} {'MSE':>14} {'SNR (dB)':>10} {'Cosine Sim':>12}")
    print(f"  {'-'*68}")
    for name, err in sorted(experiments.items(), key=lambda x: x[1]["mse"]):
        print(f"  {name:<30} {err['mse']:>14.8f} {err['snr_db']:>10.2f} {err['cosine_similarity']:>12.8f}")

    return experiments
```

### 步骤 6: GPTQ mô phỏng

GPTQ 一次量化 一列, sử dụng Hessian quyết định cách phân phối lỗi tròn hình. Đây là một phiên bản đơn giản hóa, nắm bắt ý tưởng cốt lõi: sử dụng dữ liệu hiệu chuẩn đo trọng lượng, rồi更激进地量化 最不重要权重.

```python
def simulated_gptq(weight_matrix, calibration_inputs, num_bits=4):
    n_in, n_out = weight_matrix.shape
    qmin = -(2 ** (num_bits - 1))
    qmax = 2 ** (num_bits - 1) - 1

    H = np.zeros((n_in, n_in))
    for x in calibration_inputs:
        x = x.reshape(-1, 1) if x.ndim == 1 else x
        for row in range(x.shape[0]):
            xi = x[row].reshape(-1, 1)
            H += xi @ xi.T
    H /= len(calibration_inputs)
    H += np.eye(n_in) * 1e-4

    weight_importance = np.diag(H)

    quantized = np.zeros_like(weight_matrix, dtype=np.int32)
    scales = np.zeros(n_out)
    errors = np.zeros(n_out)

    W = weight_matrix.copy()

    for col in range(n_out):
        w_col = W[:, col]
        abs_max = np.max(np.abs(w_col))
        if abs_max == 0:
            scales[col] = 1.0
            continue
        scale = abs_max / qmax
        scales[col] = scale

        q_col = np.clip(np.round(w_col / scale), qmin, qmax).astype(np.int32)
        quantized[:, col] = q_col

        quant_error = w_col - q_col * scale
        errors[col] = np.sqrt(np.mean(quant_error ** 2))

        if col < n_out - 1:
            importance_weights = weight_importance / (np.max(weight_importance) + 1e-10)
            for next_col in range(col + 1, min(col + 4, n_out)):
                compensation = quant_error * importance_weights * 0.1
                W[:, next_col] += compensation

    return quantized, scales, {"column_errors": errors,
                               "mean_error": float(np.mean(errors)),
                               "max_error": float(np.max(errors))}


def dequantize_gptq(quantized, scales):
    result = np.zeros_like(quantized, dtype=np.float64)
    for col in range(quantized.shape[1]):
        result[:, col] = quantized[:, col] * scales[col]
    return result
```

### 步骤 7: Tái mô AWQ

AWQ 识别 trọng lượng nổi bật (~) những thứ có kích hoạt lớn 相乘的权重),并通过在量化前扩展来保护它们.

```python
def simulated_awq(weight_matrix, calibration_inputs, num_bits=4, salient_fraction=0.01):
    n_in, n_out = weight_matrix.shape
    qmin = -(2 ** (num_bits - 1))
    qmax = 2 ** (num_bits - 1) - 1

    activation_magnitudes = np.zeros(n_in)
    for x in calibration_inputs:
        if x.ndim == 1:
            activation_magnitudes += np.abs(x)
        else:
            activation_magnitudes += np.mean(np.abs(x), axis=0)
    activation_magnitudes /= len(calibration_inputs)

    n_salient = max(1, int(n_in * salient_fraction))
    salient_indices = np.argsort(activation_magnitudes)[-n_salient:]

    scale_factors = np.ones(n_in)
    for idx in salient_indices:
        col_max = np.max(np.abs(weight_matrix[idx, :]))
        if col_max > 0:
            scale_factors[idx] = min(4.0, 1.0 / (col_max + 1e-8) * np.mean(np.abs(weight_matrix)))

    scaled_weights = weight_matrix * scale_factors.reshape(-1, 1)

    quantized, scales = quantize_per_channel(scaled_weights, num_bits, axis=0)
    dequantized = dequantize_per_channel(quantized, scales, axis=0)

    result = dequantized / scale_factors.reshape(-1, 1)

    err = quantization_error(weight_matrix, result)

    return result, {"salient_indices": salient_indices,
                    "scale_factors": scale_factors[salient_indices],
                    "error": err,
                    "n_salient": n_salient}
```

### 步骤 8: Đường ống đầy đủ

Để tất cả nội dung kết nối lên. Trong cùng một khối lượng tử trên so sánh ngây thơ định lượng, mỗi kênh, GPTQ và AWQ.

```python
def full_quantization_comparison(d_in=256, d_out=512, num_bits=4, n_calibration=32):
    np.random.seed(42)

    weight = np.random.randn(d_in, d_out) * 0.02
    outlier_rows = np.random.choice(d_in, size=5, replace=False)
    weight[outlier_rows] *= 10

    calibration = [np.random.randn(8, d_in) * 0.1 for _ in range(n_calibration)]

    q_naive, s_naive = quantize_symmetric(weight, num_bits)
    recon_naive = dequantize_symmetric(q_naive, s_naive)
    err_naive = quantization_error(weight, recon_naive)

    q_pc, s_pc = quantize_per_channel(weight, num_bits, axis=0)
    recon_pc = dequantize_per_channel(q_pc, s_pc, axis=0)
    err_pc = quantization_error(weight, recon_pc)

    q_gptq, s_gptq, gptq_info = simulated_gptq(weight, calibration, num_bits)
    recon_gptq = dequantize_gptq(q_gptq, s_gptq)
    err_gptq = quantization_error(weight, recon_gptq)

    recon_awq, awq_info = simulated_awq(weight, calibration, num_bits)
    err_awq = awq_info["error"]

    print(f"\n  Full Quantization Comparison ({num_bits}-bit, {d_in}x{d_out} matrix)")
    print(f"  Matrix has {len(outlier_rows)} outlier rows (10x scale)")
    print()
    print(f"  {'Method':<20} {'MSE':>14} {'SNR (dB)':>10} {'Cosine Sim':>12}")
    print(f"  {'-'*58}")
    print(f"  {'Naive per-tensor':<20} {err_naive['mse']:>14.8f} {err_naive['snr_db']:>10.2f} {err_naive['cosine_similarity']:>12.8f}")
    print(f"  {'Per-channel':<20} {err_pc['mse']:>14.8f} {err_pc['snr_db']:>10.2f} {err_pc['cosine_similarity']:>12.8f}")
    print(f"  {'Simulated GPTQ':<20} {err_gptq['mse']:>14.8f} {err_gptq['snr_db']:>10.2f} {err_gptq['cosine_similarity']:>12.8f}")
    print(f"  {'Simulated AWQ':<20} {err_awq['mse']:>14.8f} {err_awq['snr_db']:>10.2f} {err_awq['cosine_similarity']:>12.8f}")

    test_input = np.random.randn(4, d_in) * 0.1
    baseline = test_input @ weight
    output_naive = test_input @ recon_naive
    output_pc = test_input @ recon_pc
    output_gptq = test_input @ recon_gptq
    output_awq = test_input @ recon_awq

    print(f"\n  End-to-End Output Error (matmul with test input):")
    print(f"  {'Method':<20} {'Output MSE':>14} {'Output Cosine':>14}")
    print(f"  {'-'*50}")
    for name, output in [("Naive", output_naive), ("Per-channel", output_pc),
                          ("GPTQ", output_gptq), ("AWQ", output_awq)]:
        out_err = quantization_error(baseline, output)
        print(f"  {name:<20} {out_err['mse']:>14.8f} {out_err['cosine_similarity']:>14.8f}")

    return {"naive": err_naive, "per_channel": err_pc, "gptq": err_gptq, "awq": err_awq}


def memory_calculator(num_params_billions, bits_per_param):
    bytes_per_param = bits_per_param / 8
    total_bytes = num_params_billions * 1e9 * bytes_per_param
    total_gb = total_bytes / (1024 ** 3)
    return total_gb


def print_memory_table():
    print("\n  Memory Requirements by Model and Precision:")
    print(f"  {'Model':<15} {'FP32':>8} {'FP16':>8} {'FP8':>8} {'INT8':>8} {'INT4':>8} {'INT2':>8}")
    print(f"  {'-'*64}")
    for name, params in [("7B", 7), ("13B", 13), ("34B", 34), ("70B", 70), ("405B", 405)]:
        fp32 = memory_calculator(params, 32)
        fp16 = memory_calculator(params, 16)
        fp8 = memory_calculator(params, 8)
        int8 = memory_calculator(params, 8)
        int4 = memory_calculator(params, 4)
        int2 = memory_calculator(params, 2)
        print(f"  {name:<15} {fp32:>7.1f}G {fp16:>7.1f}G {fp8:>7.1f}G {int8:>7.1f}G {int4:>7.1f}G {int2:>7.1f}G")


if __name__ == "__main__":
    np.random.seed(42)

    print("=" * 70)
    print("QUANTIZATION: MAKING MODELS FIT")
    print("=" * 70)

    print("\nSTEP 1: Number Format Comparison")
    print("-" * 50)
    for val in [0.1, 3.14159, -0.00073, 42.5, 0.0000012]:
        display_format_comparison(val)

    print("\n\nSTEP 2: Memory Requirements")
    print("-" * 50)
    print_memory_table()

    print("\n\nSTEP 3: Quantization Methods Comparison")
    print("-" * 50)
    weight_matrix = np.random.randn(128, 256) * 0.02
    weight_matrix[0] *= 15
    weight_matrix[42] *= 8
    compare_quantization_methods(weight_matrix, num_bits=8)
    compare_quantization_methods(weight_matrix, num_bits=4)

    print("\n\nSTEP 4: Bit-Width Sweep")
    print("-" * 50)
    sweep_tensor = np.random.randn(64, 128) * 0.05
    bit_width_sweep(sweep_tensor)

    print("\n\nSTEP 5: Sensitivity Experiment")
    print("-" * 50)
    print("\n  INT8:")
    sensitivity_experiment(num_bits=8)
    print("\n  INT4:")
    sensitivity_experiment(num_bits=4)

    print("\n\nSTEP 6: GPTQ vs AWQ vs Naive (INT4)")
    print("-" * 50)
    full_quantization_comparison(d_in=256, d_out=512, num_bits=4)

    print("\n\nSTEP 7: Distribution Analysis")
    print("-" * 50)
    np.random.seed(0)
    simulated_weights = np.random.randn(1000) * 0.02
    abs_vals = np.abs(simulated_weights)
    pct_in_range = np.mean(abs_vals < 0.1) * 100
    print(f"\n  Simulated weight distribution (1000 params, std=0.02):")
    print(f"  Weights in [-0.1, 0.1]: {pct_in_range:.1f}%")
    print(f"  Weights in [-0.05, 0.05]: {np.mean(abs_vals < 0.05) * 100:.1f}%")
    print(f"  Weights in [-0.01, 0.01]: {np.mean(abs_vals < 0.01) * 100:.1f}%")
    print(f"  Max absolute value: {np.max(abs_vals):.6f}")
    print(f"  Mean absolute value: {np.mean(abs_vals):.6f}")

    histogram = np.histogram(simulated_weights, bins=20)
    print(f"\n  Weight histogram:")
    max_count = max(histogram[0])
    for i in range(len(histogram[0])):
        bar_len = int(histogram[0][i] / max_count * 40)
        lo = histogram[1][i]
        hi = histogram[1][i + 1]
        print(f"  [{lo:>7.4f}, {hi:>7.4f}] {'#' * bar_len} ({histogram[0][i]})")

    print("\n\n" + "=" * 70)
    print("DONE")
    print("=" * 70)
```

## Sử dụng nó
### Quantizing với AutoGPTQ

```python
# pip install auto-gptq transformers
# from auto_gptq import AutoGPTQForCausalLM, BaseQuantizeConfig
# from transformers import AutoTokenizer
#
# model_id = "meta-llama/Llama-3.1-8B"
# quantize_config = BaseQuantizeConfig(
#     bits=4,
#     group_size=128,
#     desc_act=False,
# )
#
# tokenizer = AutoTokenizer.from_pretrained(model_id)
# model = AutoGPTQForCausalLM.from_pretrained(model_id, quantize_config)
#
# calibration = [tokenizer(t, return_tensors="pt") for t in calibration_texts[:128]]
# model.quantize(calibration)
# model.save_quantized("llama-8b-gptq-int4")
```

### Quantizing với AutoAWQ

```python
# pip install autoawq
# from awq import AutoAWQForCausalLM
# from transformers import AutoTokenizer
#
# model_id = "meta-llama/Llama-3.1-8B"
# model = AutoAWQForCausalLM.from_pretrained(model_id)
# tokenizer = AutoTokenizer.from_pretrained(model_id)
#
# model.quantize(tokenizer, quant_config={"zero_point": True, "q_group_size": 128, "w_bit": 4})
# model.save_quantized("llama-8b-awq-int4")
```

### Chuyển đổi thành GGUF

```bash
# pip install llama-cpp-python
# python convert_hf_to_gguf.py meta-llama/Llama-3.1-8B --outtype q4_k_m --outfile llama-8b-q4km.gguf
# llama-server -m llama-8b-q4km.gguf -c 4096 -ngl 99
```

### Chức năng phục vụ với vLLM

```python
# pip install vllm
# vllm serve model-awq --quantization awq --dtype half --max-model-len 8192
```

vLLM 原生支持 AWQ 和 GPTQ mô hình. Nó trong quá trình nhân tử liệu xử lý phân số hóa,并 đối với cache KV Sử dụng chú ý trang.`--dtype float8_e4m3fn`

## 交付 nó
本课会产出 `outputs/skill-quantization.md`, đây là một khung quyết định để lựa chọn đúng chiến lược định lượng. Để xác định mô hình của bạn, nó sẽ cho bạn biết bạn nên sử dụng định dạng nào, phương pháp nào và các bước xác thực. Nó bao gồm tính toán ngân sách bộ nhớ, khuyến nghị chính xác cho từng thành phần, cũng như các công thức triển khai của vLLM, llama.cpp và TensorRT-LLM.

## 练习
1. Thực hiện định lượng nhóm không phải là mỗi kênh một thang, mà là trên một kênh trong mỗi 128 trọng lượng sử dụng một thang. Đây chính là cách thực tế sử dụng GPTQ và AWQ.

2. Xây dựng một định lượng trình xác định kết hợp, sẽ định lượng tầng đầu tiên và cuối cùng của mạng đa tầng cho INT8, đồng thời định lượng tầng trung gian cho INT4――把 kết thúc đến kết thúc chất lượng đầu ra với đồng nhất INT4 và đồng nhất INT8

3. Để thực hiện ước tính thông qua thẳng (STE)  Trong một công việc khôi phục được sử dụng trong một mạng lưới hai tầng đơn giản, nhập vào các hoạt động định lượng hóa/tự định lượng giả mạo  So sánh tập luyện bình thường  Sau đó mô hình PTQ đến INT4 và từ đầu sử dụng mô hình đào tạo QAT  Loss cuối cùng 

4. 构建一个受 LLM.int8() 启发的异异常意识量化器──检测激活大小超过平均值 6x的频道──把这些频道保持在FP16,并把其他所有内容量化到INT8──使用不同异常门──3x、6x、10x),在步骤 5的变压器层上衡端到端质量──

5. 实现量化质量仪表. 给定一个权力矩阵,计算并显示:权力分布 histogram,量化错误分布, per-channel scale factors,量化得差的频道,以及100 个随机输入 上原始输出与量化输出之间的 cosine similarity.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|----------------------|
| FP16 | “Half precision” | 16-bit float，包含 5 个 exponent bits 和 10 个 mantissa bits，最大值 65,504，标准 inference format |
| BF16 | “Brain float” | 16-bit float，包含 8 个 exponent bits（范围与 FP32 相同）和 7 个 mantissa bits，由 Google 为 training 设计 |
| FP8 | “Eight-bit float” | 两种 variants：E4M3（inference，更高 precision）和 E5M2（training，更大范围），H100 原生支持 |
| INT8 | “Eight-bit integer” | 从 -128 到 127 的 256 个均匀间隔值，需要 scale factor 从 floats 映射过来 |
| INT4 | “Four-bit integer” | 总共 16 个 levels，需要复杂方法（GPTQ、AWQ）来维持质量 |
| Per-channel quantization | “One scale per row” | 为每个 output channel 使用单独的 scale factor，而不是整个 tensor 共用一个，大幅降低误差 |
| GPTQ | “The Hessian method” | 使用二阶信息最小化 output error 的 post-training quantization，一次处理一个 layer |
| AWQ | “Activation-aware” | 在 quantization 前 scaling salient weights（那些与大 activations 相乘的权重）以保护它们 |
| GGUF | “The llama.cpp format” | 包含 mixed-precision layers 的自包含模型文件，针对 CPU 和 Apple Silicon inference 优化 |
| PTQ | “Quantize after training” | 不重新训练，将已训练模型的权重转换为更低 precision；速度快，但在极限压缩下受限 |
| QAT | “Quantize during training” | 在 forward pass 中插入 fake quantization，让模型学会容忍 rounding；在 INT4/INT2 下更好 |
| Calibration data | “The 128 examples” | 通过模型运行的小型 dataset，用于计算 activation statistics 以设置 scale factors |
| Scale factor | “The multiplier” | 在 floating-point range 和 integer range 之间转换：`float_val = int_val * scale` |
| Perplexity delta | “How much worse” | 原始模型与 quantized model 之间的 perplexity 差值，< 0.5 极佳，> 2.0 表示有问题 |

## 延伸阅读
- [Frantar et al., 2022 -- "GPTQ: Accurate Post-Training Quantization for Generative Pre-trained Transformers"](https://arxiv.org/abs/2210.17323)-- This article paper thông qua vòng tròn trọng lượng hướng dẫn Hessian, để số lượng INT4 đối với LLM  trở nên thực tế
- [Lin et al., 2023 -- "AWQ: Activation-aware Weight Quantization for LLM Compression and Acceleration"](https://arxiv.org/abs/2306.00978)-- 通过在量化前扩展来保护突出重量,质量匹配或超过GPTQ
- [Dettmers et al., 2022 -- "LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale"](https://arxiv.org/abs/2208.07339)-- INT8 chính xác hỗn hợp, đưa các tính năng khác biệt  giữ trong FP16, trong trường hợp không mất chất lượng hỗ trợ INT8 suy luận
- [Xiao et al., 2023 -- "SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models"](https://arxiv.org/abs/2211.10438)-- sẽ khó định lượng từ kích hoạt chuyển sang trọng lượng, để thực hiện triển khai W8A8
- [Micikevicius et al., 2022 -- "FP8 Formats for Deep Learning"](https://arxiv.org/abs/2209.05433)-- NVIDIA/ARM/Intel 论文, đã định nghĩa các định dạng E4M3 và E5M2 được hỗ trợ hiện tại trên H100 上原生
