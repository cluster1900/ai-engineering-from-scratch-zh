# 综合项目 14  Khóa mã định giá 推理服务器

> EAGLE-3 trong vLLM 0.7 trong thực lượng mang lại 2.5-3x 吞吐量. P-EAGLE (AWS 2026) tiếp tục thúc đẩy đầu cơ song song song. SpecForge của SGLang đã đào tạo lớn về dự thảo đầu tiên. Red Hat's Speculators hub 为常见开放模型发布一致的草案. TensorRT-LLM 让投机解码成为NVIDIA上一流的能力.

**Type:** Capstone
**Languages:** Python (serving), C++ / CUDA (kernel inspection), YAML (configs)
**Prerequisites:** Phase 3 (Deep Learning), Phase 7 (Transformers), Phase 10 (LLMs from scratch), Phase 17 (infrastructure)
**Phases exercised:**P3 · P7 · P10 · P17
**Time:** 30 小时

## 问题
Việc giải mã dự đoán trong năm 2026 đã trở thành hàng hóa. EAGLE-3 dự thảo đầu dựa trên mô hình mục tiêu  đào tạo trạng thái ẩn,并预测未来 N 个 token; mô hình mục tiêu trong quá trình kiểm tra đơn lẻ. 60%-80% của tỷ lệ chấp nhận sẽ chuyển thành 2-3x của kết thúc kết thúc dung lượng. vLLM 0.7 原生集集成了这一能力. SGLang + SpecForge 提供训练管道.

关键技术 không phải là mô hình, mà là hoạt động phục vụ. 率接受会随流量分布漂移 (XDN)  ShareGPT vs code vs domain data (XDN)  xảy ra từ chối 时的尾延迟比不使用猜测更差, vì vậy bạn phải báo cáo nhiều lô quy mô 下的 p99,而不能只报告稳定状态代币/sec──相对于Anthropic / OpenAI API 的每1M代币 成本,是可信度的杆──

## 概念
Việc giải mã giả định có hai tầng.**draft**mô hình ((Eagle-3 head, ngram, hoặc mô hình phù hợp với mục tiêu nhỏ hơn) trong mỗi bước đưa ra một**target**mô hình trong một lần đi 中验证全部 k 个 Token; bất kỳ tiền tố được chấp nhận nào sẽ thay thế đường tham lam.

EAGLE-3 trên hầu hết lưu lượng tốt hơn ngram draft. P-EAGLE vì cây dự thảo sâu hơn 运行 suy đoán song song song.

Việc triển khai sử dụng Kubernetes。vLLM 0.7 Mỗi GPU hoặc các đoạn băng song song 运行 một bản sao。HPA  dựa trên chờ đợi hàng không thay vì CPU tự mở rộng容量。FP8 (Marlin) và INT4 (AWQ) số lượng sẽ giúp bộ nhớ GPU  giữ trong phạm vi H100 / H200。端到端报告包括吞吐量、接受率、批量 1/8/32 下的 p50/p99,以及 $/1M Token。

## 架构
```
request ingress
    |
    v
vLLM server (0.7) or SGLang (0.4)
    |
    +-- draft: EAGLE-3 heads | P-EAGLE parallel | ngram fallback
    +-- target: Llama 3.3 70B | Qwen3-Coder-30B | GPT-OSS-120B
    |     quantized FP8-Marlin or INT4-AWQ
    |
    v
verify pass: batch k draft tokens through target
    |
    v (accept prefix; resample for rejected suffix)
    v
token stream back to client
    |
    v
Prometheus metrics: throughput, acceptance rate, queue wait, latency p50/p99
    |
    v
HPA on queue-wait metric
```

## 技术
- Lượng phục vụ: vLLM 0,7 hoặc SGLang 0,4
- Phương pháp đầu cơ: EAGLE-3 đầu dự thảo
- Dự thảo đào tạo: SpecForge (SGLang) hoặc Red Hat Speculators
- Các mô hình mục tiêu: Llama 3.3 70B、Qwen3-Coder-30B MoE、GPT-OSS-120B
- Số lượng: FP8 (Marlin) ∞INT4 AWQ
- Việc triển khai: Kubernetes + NVIDIA thiết bị plugin; dựa trên số liệu chờ đợi hàng
- Eval: ShareGPT、MT-Bench-v2、GSM8K、HumanEval, được sử dụng để đo lường tỷ lệ chấp nhận trên các miền phân chia
- Khán giả: TensorRT-LLM giải mã đầu cơ, như cơ sở nhà cung cấp


```figure
cf-spec-decode
```

##  xây dựng nó
1. **Target model prep.**选择 Llama 3.3 70B──通过 Marlin định lượng đến FP8──在 1xH100(或 2x tensor-parallel) 上使用 vLLM 0.7 部署──

2. **Draft source.**Từ Red Hat Speculators 拉取 được sắp xếp theo EAGLE-3 đầu dự thảo  hoặc thông qua SpecForge 训练一个)  tải đến cấu hình giải mã đầu cơ của vLLM 中──

3. **Baseline numbers.**Trong suy đoán 之前:batch 1/8/32 下的代币/s、p50/p99 độ trễ、GPU sử dụng──发布结果──

4. **Enable EAGLE-3.**切换 config; tái运行 cùng một tiêu chuẩn.

5. **P-EAGLE.** Khả năng phỏng đoán song song; đo lường sự khác biệt giữa cây dự thảo sâu hơn và EAGLE-3 hàng loạt  báo cáo P-EAGLE từ một điểm giúp chuyển thành một điểm quay nguy hiểm 

6. **Domain traffic.**Để chia sẻGPT、HumanEval 和 lưu lượng truy cập cụ thể về miền  thông qua cùng một Server 运行──按分布测量接受率──识别草案 发生漂移的条件──

7. **Second target model.**Trong Qwen3-Coder-30B MoE 上运行同一管线──草案更棘手(MoE định tuyến tiếng ồn)──报告结果──

8. **K8s HPA.**Trong K8s, hạ bộ, không để HPA theo dõi `queue_wait_ms`◊ hiển thị tải trọng biến đổi cho 3 lần thời gian quy mô-out

9. **Cost comparison.**Trong cùng một đánh giá 上计算 $/1M Token,并与人类Claude Sonnet 4.7 和 OpenAI GPT-5.4比较──发布结果──

## Sử dụng nó
```
$ curl https://infer.example.com/v1/chat/completions -d '{"messages":[...]}'
[serve]     vLLM 0.7, Llama 3.3 70B FP8, EAGLE-3 active
[decode]    bs=8, accepted_tokens_per_step=3.2, acceptance_rate=0.76
[latency]   first-token 42ms, full-response 980ms (620 tokens)
[cost]      $0.34 per 1M output tokens at sustained throughput
```

## 交付 nó
`outputs/skill-inference-server.md`mô tả được giao tiếp. Một quá trình đo lường, một đống dịch vụ giải mã phỏng đoán, một báo cáo chuẩn đầy đủ, cũng như một triển khai K8.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 相对 baseline 的实测 speedup | 在两个 model 上以匹配质量达到 2.5x+ throughput |
| 20 | 真实流量上的接受率 | 按分布划分的 acceptance-rate report |
| 20 | P99 tail-latency 纪律 | 使用和不使用 speculation 时，batch 1/8/32 下的 p99 |
| 20 | Ops | K8s deploy、基于 queue-wait 的 HPA、rollout smooth |
| 15 | Write-up 和 methodology | 清晰说明改变了什么以及为什么 |
| **100** | | |

## 练习
1. Khi dự thảo hơn mục tiêu 落后一个版本时 (ví dụ Llama 3.3 -> 3.4 drift), đo lường sự suy giảm tỷ lệ chấp nhận.

2. 实现 ngram-fallback: Nếu EAGLE-3  chấp nhận tỷ lệ thấp hơn một ngưỡng nào đó, thì chuyển sang ngram dự thảo.

3. 运行一个受控MoE实验:同一个Qwen3-Coder-30B,在注入路由噪音与不注入路由噪音 两种情况对比──测量草案接受敏感──

4.  mở rộng đến H200 (141 GB)  báo cáo mỗi bản sao  thu được mô hình kích thước phòng đầu, cũng như liệu có thể phục vụ một không định lượng Llama 3.3 70B 

5. Trong cùng một phần cứng H100 trên benchmark TensorRT-LLM giải mã đầu cơ.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Draft model | "Speculator" | 为 target 提出 N 个 Token 以供验证的小 model |
| EAGLE-3 | "2026 draft architecture" | 基于 target hidden state 训练的 draft head；约 75% 接受率 |
| P-EAGLE | "Parallel speculation" | 在一个 target pass 中验证的 draft branch tree |
| Acceptance rate | "Hit rate" | 无需 resampling 即被接受的 drafted Token 比例 |
| Quantization | "FP8 / INT4" | 更低精度的 weights，用于在 GPU memory 中容纳更多 model |
| Queue wait | "HPA metric" | request 在 inference 开始前于 pending queue 中等待的时间 |
| Speculators hub | "Aligned drafts" | Red Hat Neural Magic 为常见 open model 提供的 EAGLE draft hub |

## 延伸阅读
- [vLLM EAGLE and P-EAGLE documentation](https://docs.vllm.ai) hàng phục vụ tham chiếu
- [P-EAGLE (AWS 2026)](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/) giấy giải mã thoả thuận + tích hợp
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) Đường dẫn đào tạo đầu dự thảo
- [Red Hat Speculators](https://github.com/neuralmagic/speculators) trung tâm dự thảo được sắp xếp
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/) Nhà cung cấp thay thế
- [Fireworks.ai serving architecture](https://fireworks.ai/blog) Khán giả thương mại
- [EAGLE-3 paper (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) Bức giấy phương pháp
- [vLLM repository](https://github.com/vllm-project/vllm) mã và chỉ số chuẩn
