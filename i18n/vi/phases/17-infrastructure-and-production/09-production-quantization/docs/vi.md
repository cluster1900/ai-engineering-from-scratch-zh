# Phân lượng sản xuất  AWQ, GPTQ, GGUF K-quant, FP8, MXFP4/NVFP4

> Phương thức định lượng không phải là một lựa chọn chung, mà là hàm của bộ máy cứng, động cơ phục vụ và tải công việc. GGUF Q4_K_M hoặc Q5_K_M  thông qua llama.cpp 和 Ollama 交付, chiếm CPU và cạnh 场景. GPTQ trong vLLM 内部胜出, phù hợp với bạn cần phải chạy trên cùng một cơ sở trên nhiều LoRA.带 Marlin-AWQ hạt nhân AWQ trên mô hình cấp 7B có thể đạt được khoảng 741 tok/s, và trong INT4 có tốt nhất Pass@1, 2026 năm trung tâm dữ liệu sản xuất mặc định.

**Type:** 学习
**Languages:** Python（stdlib，用于跨格式的 toy memory 和 throughput 比较）
**Prerequisites:** Phase 10 · 13（Quantization 基础），Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 75 分钟

## Học mục tiêu
- Nói ra năm 2026 6 dạng định dạng định lượng sản xuất  và các trường hợp thích hợp nhất
- Trong một số trường hợp, các công cụ khác nhau được sử dụng để tạo ra các tính năng khác nhau.
- 计算选的格式节省重量内存,以及未影响的KV缓存──
- Nói về việc làm cho các mô hình định lượng trong lưu lượng truy cập miền trên trục bộ dữ liệu định đo hóa 陷──

## 问题
Quantization sẽ giảm bộ nhớ và băng thông HBM, và đây chính là giải mã  cần thiết. Một FP16 70B mô hình có trọng lượng 140 GB.

Nhưng định lượng không phải là miễn phí. n định lượng hóa sẽ làm giảm chất lượng, đặc biệt là trong các nhiệm vụ lý luận nặng. n định dạng khác nhau phù hợp với các động cơ khác nhau. n phần cứng khác nhau.

## 概念
### 6 hình thức

| Format | Bits | Sweet spot | Engines |
|--------|------|-----------|---------|
| GGUF Q4_K_M / Q5_K_M | 4-5 | CPU、edge、laptops | llama.cpp、Ollama |
| GPTQ | 4-8 | vLLM 上的 Multi-LoRA | vLLM、TGI |
| AWQ | 4 | Datacenter GPU production | vLLM（Marlin-AWQ）、TGI |
| FP8 | 8 | Hopper/Ada/Blackwell datacenter | vLLM、TRT-LLM、SGLang |
| MXFP4 | 4 | Blackwell multi-user | TRT-LLM |
| NVFP4 | 4 | Blackwell multi-user | TRT-LLM |

### GGUF  CPU/edge 默认选择

GGUF là một định dạng tập tin, tự nó không phải là phương pháp định lượng, nó đưa các biến thể K-quantic ((Q2_K、Q3_K_M、Q4_K_M、Q5_K_M、Q6_K、Q8_0) được đóng gói trong một thùng chứa 中──Q4_K_M 和 Q5_K_M là các thiết lập mặc định sản xuất, ở 4-5 bit 下接近 BF16 质量── đối với CPU hoặc Edge serving, đây là lựa chọn tốt nhất, vì llama.cpp cho đến nay là công cụ suy luận CPU nhanh nhất.

Trong vLLM trong thông qua 惩罚:7B 上约 93 tok/s, kiểu này không nhắm đến các lõi GPU 优化── khi mục tiêu triển khai là CPU/edge 时使用 GGUF──其他情况不要用──

### GPTQ  vLLM 中的多洛拉

GPTQ là một thuật toán định lượng sau khi đào tạo, có hiệu chuẩn vượt qua. Các hạt nhân Marlin 让它在 GPU 上变快(相比非 Marlin GPTQ có tốc độ 2.6x) ⋅7B 上约 712 tok/s⋅

Nó có lợi thế đặc biệt:GPTQ-Int4 trong vLLM hỗ trợ các bộ chuyển đổi LoRA。 Nếu bạn muốn phục vụ một mô hình cơ bản cộng với 10 - 50 biến thể tinh chỉnh (đừng một là một LoRA),GPTQ là đường của bạn。 cho đến đầu năm 2026, NVFP4 vẫn không hỗ trợ LoRA。

### AWQ  GPU trung tâm dữ liệu 默认选择

Activation-aware Weight Quantization──量化时保护约 1% 最显著的权重──Marlin-AWQ kernels:相比天真 实现有 10.9x speedup──7B 上约 741 tok/s,是INT4格式 中 Pass@1 最好的──

Ngoài ra bạn cần nhiều LoRA (GPTQ) hoặc tăng cường Blackwell FP4 (NVFP4), nếu không GPU mới phục vụ  chọn AWQ。

### FP8  可靠的中间地带

Điểm nổi 8-bit: gần似无损: hỗ trợ rộng rãi: HOPP Tensor Cores: nguyên sinh gia tăng FP8: Blackwell: thừa kế: khi chất lượng không thể thỏa hiệp: lý luận: y tế: mã gen: FP8 là một lựa chọn được chọn sẵn sàng năm 2026: tiết kiệm bộ nhớ là một nửa của INT4, nhưng chất lượng rủi ro thấp hơn:

### MXFP4 / NVFP4  Blackwell 激进选择

Microscaling FP4── mỗi khối trọng lượng đều có yếu tố quy mô riêng của mình── kích thích, nhưng trên các lõi Tensor Blackwell có bộ phận tăng tốc── so với FP8, sẽ giảm một nửa số mã thông báo, đây là giai đoạn 17 · 07 trong kinh tế thu nhập──

chú ý:
- Không còn sự hỗ trợ của LRA nữa.
- lý luận-nhiều tải trọng làm việc 上质量下降可见──
- 必须在你的评估设置上逐模型验证――

### Mẫy hiệu chuẩn

AWQ và GPTQ  cần bộ dữ liệu hiệu chuẩn, thường là C4 hoặc WikiText。 Đối với các mô hình miền(code、medical、legal), sử dụng văn bản web thông thường để làm hiệu chuẩn, sẽ khiến thuật toán đưa ra phán quyết sai lầm về những quyền hạn cần được bảo vệ。HumanEval 上的 Pass@1 可能下降几个点。

修复方式: sử dụng dữ liệu trong miền làm hiệu chuẩn.  Hàng trăm mẫu miền thường đủ.  上线前在 eval set 上测试.

### Trầm lẫy cache KV

AWQ Đặt trọng lượng giảm xuống còn 4 bit. KV cache là phân chia, và giữ FP16/FP8. Đối với các mẫu 70B của AWQ:

- Đánh nặng: khoảng 35 GB ((từ 140 GB INT4 và đến)
- 128 并发 × 2k context 下的 KV cache: khoảng 20 GB.
- Tích hoạt: khoảng 5 GB.
- Tổng cộng: khoảng 60 GB, có thể đặt vào H100 80 GB.

天真地说我把模型量化到4GB 了会忘记另外30-50GB──要整体预算HBM──

Ngoài ra, KV cache quantization ((FP8 KV hoặc INT8 KV) là một lựa chọn khác, có sự thỏa hiệp của riêng mình, nó sẽ ảnh hưởng trực tiếp đến độ chính xác của sự chú ý, không phải là miễn phí.

### AWQ INT4 đối với lý luận có风险

Các hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ thống hệ

### 2026 hướng dẫn chọn

- CPU/ Edge serve:GGUF Q4_K_M──完成──
- GPU phục vụ, trò chuyện thường xuyên, không có LoRA.
- GPU phục vụ  multi-LoRA:带 Marlin của GPTQ
- Nồng độ công việc lý luận:FP8。
- Blackwell datacenter 质量已验证:NVFP4 + FP8 KV
- Không rõ: đối với mỗi ứng cử viên, chạy 1.000 mẫu đánh giá.


```figure
gpu-memory-breakdown
```

## Sử dụng nó
`code/main.py`会针对一系列模型大小,计算六种格式的内存足迹 (重量+KV+ kích hoạt) 和相对吞吐量――展示KV缓存何时占主导、重压缩何时划算,以及FP8何时是安全选择――

## 交付 nó
本课会产出 `outputs/skill-quantization-picker.md` Được xác định về phần cứng, kích thước mô hình, loại tải trọng và dung nạp chất lượng, nó sẽ chọn một kiểu dáng, và tạo ra kế hoạch hiệu chuẩn/bảo quy.

## 练习
1. 运行 `code/main.py`Đối với mô hình 70B của 128 và 2k ngữ cảnh, tính toán tổng HBM của mỗi kiểu hình thức.
2. Bạn có một mô hình mã hóa 7B. Chọn một hình thức và lý do. Nếu bạn đánh giá sai về sự dung nạp chất lượng, đường phục hồi là gì?
3. 计算为医学领域模型 校准 AWQ 需要校准数据集尺寸――为什么更多数据不总是好?
4. 阅读 Marlin-AWQ hạt nhân giấy hoặc phát hành ghi chú.
5. Khi nào để kết hợp trọng lượng AWQ với bộ nhớ cache FP8 KV, so với việc giữ KV ở BF16 hợp lý hơn?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| GGUF | “llama.cpp format” | 打包 K-quant variants 的文件格式；CPU/edge 默认选择 |
| Q4_K_M | “Q4 K M” | 4-bit K-quant medium；production GGUF 默认选择 |
| GPTQ | “gee pee tee q” | 带 calibration 的 post-train INT4；在 vLLM 中支持 LoRA |
| AWQ | “a w q” | Activation-aware INT4；Marlin kernels；INT4 下最佳 Pass@1 |
| Marlin kernels | “fast INT4 kernels” | Hopper 上用于 INT4 的自定义 CUDA kernels；10x speedup |
| FP8 | “eight-bit float” | Hopper/Ada/Blackwell 上的安全 precision 默认选择 |
| MXFP4 / NVFP4 | “microscaling four” | Blackwell 4-bit FP，带 per-block scale factors |
| Calibration dataset | “cal data” | 用于选择 quantization parameters 的输入文本；必须匹配 domain |
| KV cache quantization | “KV INT8” | 与 weights 分开的选择；影响 Attention accuracy |

## 延伸阅读
- [VRLA Tech — LLM Quantization 2026](https://vrlatech.com/llm-quantization-explained-int4-int8-fp8-awq-and-gptq-in-2026/) đối với điểm chuẩn
- [Jarvis Labs — vLLM Quantization Complete Guide](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks) 按格式列出的吞吐量 数字──
- [PremAI — GGUF vs AWQ vs GPTQ vs bitsandbytes 2026](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/) 逐格式选择指南──
- [vLLM docs — Quantization](https://docs.vllm.ai/en/latest/features/quantization/index.html) 支持的格式和旗子──
- [AWQ paper (arXiv:2306.00978)](https://arxiv.org/abs/2306.00978)  nguyên thủy AWQ
- [GPTQ paper (arXiv:2210.17323)](https://arxiv.org/abs/2210.17323) nguyên thủy GPTQ công thức
