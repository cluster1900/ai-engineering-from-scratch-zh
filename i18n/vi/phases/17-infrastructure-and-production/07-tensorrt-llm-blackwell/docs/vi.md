# Trong Blackwell 上 sử dụng FP8 và NVFP4 运行 TensorRT-LLM

> TensorRT-LLM  chỉ giới hạn ở NVIDIA, nhưng nó ở Blackwell 上胜出── 在配合 Dynamo 编排 GB200 NVL72 上,SemiAnalysis InferenceX trong năm 2026 Q1-Q2 测得 120B 模型成本为每百万代币$0.012，而 H100 + vLLM 为 $0.09/M, hình thành khoảng cách kinh tế 7x. Đây là một loạt các hệ thống độ chính xác của các hệ thống:FP8 đối với các hạt nhân cache và chú ý KV vẫn quan trọng, bởi vì nó có phạm vi động thái cần thiết cho chúng;NVFP4(4-bit vi mô) xử lý trọng lượng và giá trị kích hoạt;MTP và dự đoán mã thông báo đa phân chia trước/đóng mã cũng tăng thêm 2-3x.

**Type:** 学习
**Languages:** Python (stdlib，玩具级 FP8/NVFP4 内存与成本计算器)
**前置要求：**Giai đoạn 17 · 04 (vLLM Serving Internals), Giai đoạn 10 · 13 (Quantization)
**Time:** ~75 分钟

## Học mục tiêu

- 解释为什么即便权重使用 NVFP4,FP8 đối với KV cache 和 Attention 仍然关键──
- 计算边界模型 在 BF16、FP8 和 NVFP4 下的HBM足迹,并推理节省来自哪里──
- Nói ra TRT-LLM sử dụng của Blackwell đặc tính ((day-0 FP4、MTP、 phân chia phục vụ、 tất cả-to-all nguyên thủy)
- 判断什么时候 TRT-LLM của NVIDIA-lock 值得交换相对于 Hopper 上 vLLM của 7x 成本差距──

## 问题

2026 năm suy luận về vấn đề tiền tuyến kinh tế là  mỗi USD có thể tạo ra bao nhiêu Token──答案取决于四层叠加选择:硬件代际(Hopper H100/H200 vs Blackwell B200/GB200) 精度(BF16 → FP8 → NVFP4) ✓ máy phục vụ(vLLM vs SGLang vs TRT-LLM)

Trong Hopper + vLLM 上,120B MoE của vận hành chi phí khoảng cho mỗi triệu token ~$0.09。在 Blackwell + TRT-LLM + Dynamo 上，同一个模型的运行成本约为 ~$0.012,便宜 7x── một phần khác biệt từ các phần cứng(Blackwell's Single GPU LLM 吞吐相对Hopper 高 11-15x)── một phần khác từ hàng:FP4 权重、MTP draft、 phân tích prefill/decode, cũng như sử dụng cho truyền thông chuyên gia MoE NVLink 5 tất cả mọi thứ──

Bạn không thể sống lại được ngoài NVIDIA stack. Đó là việc thay đổi kinh tế.

## 概念

### Tại sao FP8 vẫn là nền cache KV

Một sai lầm phổ biến năm 2026 là: giả định NVFP4 có thể áp dụng ở mọi nơi. Thực tế không phải vậy. KV cache  cần FP8 ((8 bit floating point), vì nó lưu trữ các khóa chú ý và giá trị 跨越很宽的动态范围.

NVFP4(2025-2026) áp dụng cho trọng lượng và giá trị kích hoạt.

典型 Blackwell 配置:

- 权重:NVFP4 ((4 bit quy mô nhỏ)
- 激活值:NVFP4。
- KV cache:FP8。
- Bộ tích lũy sự chú ý:FP32 ((softmax 稳定性) 。

### TRT-LLM sử dụng Blackwell đặc biệt có nguyên thủy

- **Day-0 FP4 weights**: mô hình cung cấp cách trực tiếp phát hành FP4 权重;TRT-LLM 无需后培训转换 即可加载;;FP4 不需要 AWQ / GPTQ 步骤;;
- **Multi-token prediction (MTP)**: với EAGLE(Phase 17 · 05) nghĩ giống nhau, nhưng tập hợp đến TRT-LLM xây dựng 中──
- **Disaggregated serving**:prefill 和 decode 位于独立 GPU pool,KV cache 通过 NVLink hoặc InfiniBand 传输──与Dynamo(Phase 17 · 20)
- **All-to-all communication primitives**NVLink 5 sẽ giảm độ trễ giao tiếp chuyên gia MoE so với Hopper 3x.
- **NVFP4 + MXFP8 microscaling**: Blackwell Tensor Cores 上的硬件加速尺度-因子处理──

### Bạn nên nhớ số

- HGX B200 通过TRT-LLM 在 GPT-OSS-120B 上达到 $0.02/M Token。
- GB200 NVL72 通过Dynamo (TRT-LLM) đạt đến $0.012/M Token。
- H100 + vLLM 在可比工作负载上约为0.09 $ / M Token。
- TRT-LLM 更新三月带来 2.8x 吞吐增益(2026)。
- Blackwell tương đối với Hopper's đơn GPU LLM 吞吐为11-15x
- MLPerf Inference v6.0(2026 年 4 月):Blackwell 主导每个提交任务──

### FP4 trong chất lượng giá thực

NVFP4  rất mạnh mẽ. Trong khối lượng công việc suy luận nặng nề ([[chuỗi suy nghĩ]], toán học]], 长上下文代码-gen) trên,FP4 权重会明显退化。Tích chuẩn mỗi khối có thể giảm, nhưng không thể loại bỏ。

规则: 在承诺使用 NVFP4 权重前,始终在你的评估设 上验证任务质量──

### Tại sao đây là một NVIDIA-nghiên khóa quyết định

TRT-LLM là C++ + CUDA + lõi nguồn đóng. Mô hình cần được sử dụng cho một GPU cụ thể. Không hỗ trợ AMD, không hỗ trợ Intel, không hỗ trợ ARM. Nếu chiến lược hạ tầng của bạn là đa nhà cung cấp, thì TRT-LLM đối với TRT-LLM được phục vụ cấp độ là không thể chạy được; bạn vẫn có thể sử dụng vLLM trên các bộ phận hỗn hợp. Nếu chỉ là NVIDIA, thì 7x 差距足以为锁 付费.

### 2026 năm thực dụng

Đối với kế toán ước tính hàng năm $100M+, vận hành Hopper + vLLM 会留下 7-10x của tối ưu hóa không gian.

### Thặng thưởng phân tích

TRT-LLM phân chia dịch vụ (分离的预填和解码池) sẽ ở giai đoạn 17 · 20 中深入讲解――在Blackwell 上,乘数会叠加:FP4 权重 × MTP speedup × phân chia vị trí × cache-aware routing。7x 数字假设 sử dụng là bộ đống hoàn chỉnh。


```figure
pipeline-parallel
```

## Sử dụng nó

`code/main.py`会为三种堆 计算模型的HBM footprint、decode throughput(memory-bound regime) và $/M-token:H100 + BF16 + vLLM、H100 + FP8 + vLLM、B200 + NVFP4/FP8 + TRT-LLM──运行它,观察复合效应,以及每个变化贡献差距中的哪一部分──

## 交付 nó

本课会生成 `outputs/skill-trtllm-blackwell-advisor.md` Được định tải công việc  Mô hình                                                                                                                                                                                                                                                          

## 练习

1. 运行 `code/main.py` đối với một tham số hoạt động là 30% của 120B MoE, tính H100 BF16、H100 FP8 và B200 NVFP4/FP8 trên bộ nhớ băng thông giới hạn decode throughput── tăng lớn nhất từ đâu?
2. Một khách hàng mỗi năm chi 2M$ trên H100 + vLLM. Xem xét khoảng cách kinh tế 7x, họ cần mua bao nhiêu GPU Blackwell để chuyển sang chi phí TRT-LLM trong 12 tháng?
3. NVFP4 权重转换后, bạn thấy tỷ lệ xác định giảm 3 个点――说出两条恢复路径:
4. 阅读 MLPerf v6.0 kết quả suy luận... nhiệm vụ nào của Blackwell-over-Hopper 差距最小, vì sao?
5. 计算 405B 模型在 NVFP4 权重 + FP8 KV cache、128k context 下所需的HBM──它能装进单个GB200 NVL72 节点吗?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| FP8 | "eight-bit float" | 8-bit floating point；由于动态范围，用于 KV cache 和 Attention |
| NVFP4 | "four-bit micro" | NVIDIA 的 4-bit microscaling FP format；用于 Blackwell 上的权重和激活值 |
| MXFP8 | "MX eight" | Microscaling FP8 variant；在 Blackwell Tensor Cores 上硬件加速 |
| Day-0 FP4 | "ship FP4 weights" | 模型提供方发布已经是 FP4 的权重；无需 post-train conversion 步骤 |
| MTP | "multi-token prediction" | TRT-LLM 集成的 speculative-decoding draft（Phase 17 · 05） |
| Disaggregated serving | "split prefill/decode" | Prefill 和 decode 位于独立 GPU pools；KV 通过 NVLink/IB 传输 |
| All-to-all | "MoE expert comm" | 将 Token 路由到 expert GPUs 的通信模式；NVLink 5 降低 3x |
| InferenceX | "SemiAnalysis inference bench" | 2026 年行业接受的 cost-per-token benchmark |

## 延伸阅读

- [NVIDIA — Blackwell Ultra MLPerf Inference v6.0](https://developer.nvidia.com/blog/nvidia-blackwell-ultra-sets-new-inference-records-in-mlperf-debut/) 2026 年 4 月 MLPerf 结果──
- [NVIDIA — Blackwell 上的 MoE Inference](https://developer.nvidia.com/blog/delivering-massive-performance-leaps-for-mixture-of-experts-inference-on-nvidia-blackwell/)NVLink 5 toàn bộ với các hạt nhân MoE
- [TensorRT-LLM Overview](https://nvidia.github.io/TensorRT-LLM/overview.html) 官方 engine 文档──
- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/) Phong dàn nhạc phân chia trên TRT-LLM 之──
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) 发布 Blackwell số điểm chuẩn suite
