# Các Metrics Inference  TTFT、TPOT、ITL、Goodput、P99

> Các chỉ số xác định việc triển khai suy luận là một lần hay không là một công việc bình thường. TTFT là prefill 加 queue 加网络──TPOT(tương đương với ITL) là mã hóa kết nối bộ nhớ của mỗi token 成本──端到端延迟 là TTFT cộng với TPOT nhân với bước ra ra.

**Type:** 学习
**Languages:** Python（stdlib，玩具版 percentile calculator 和 goodput reporter）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals）
**Time:** 约 60 分钟

## Học mục tiêu
- 精确定义 TTFT、TPOT、ITL、E2E、throughput 和 goodput,并指出每个指标测量组件──
- 解释 tại sao có nghĩa là việc phục vụ LLM là một số liệu thống kê sai lầm, cũng như cách đọc P50/P90/P99
- 构建一个SLO multi-constraint (ví dụ như TTFT<500 ms AND TPOT<15 ms AND E2E<2 s),并根据此计算 goodput──
- Nói ra hai công cụ chuẩn bị không phù hợp với TPOT trong cùng một lần vận hành,并 giải thích lý do:

## 问题
 Tỷ lệ thông qua của chúng tôi là 15.000 token mỗi giây.那又怎么样? Nếu 40% yêu cầu kết thúc đến kết thúc vượt quá 2 giây, người dùng đã từ bỏ phiên.

Inference có nhiều độ trễ 轴, mỗi轴的失败方式都不同──Prefill là tính toán-bắt buộc,并随即长 扩展──Decode là bộ nhớ-bắt buộc,并随批量 扩展──Queening delay là vấn đề hoạt động──Network là vấn đề khoảng cách vật lý──You need for each item use different indicators, you need percentiles, and you need a single one composite to explain user has gotten the expected result, this is goodput──

## 概念
### TTFT  thời gian để token đầu tiên

`TTFT = queue_time + network_request + prefill_time`

Khi các yêu cầu 很长时,预填 占主导── trong Llama-3.3-70B FP8 trên H100, một yêu cầu 32k 需要约800 ms的纯预填──队时间是负载下的调度器行为──网络请求是包含TLS的线程时间──TTFT 是用户在任何内容流 返回之前看到的延迟──

### TPOT / ITL  độ trễ giữa các token

Cũng có nhiều cái tên.`TPOT`(giờ mỗi token đầu ra)`ITL`(các thời gian trễ giữa các mã thông báo)`decode latency per token`Đó là thứ gì đó. Đó là lần đầu tiên Token 之后, liên tục phát sóng Token 间的时间.

`TPOT = (decode_forward_time + scheduler_overhead) / tokens_produced`

Trong cùng một đống prefill chunked của Llama-3.3-70B H100 đống trên, TPOT trung bình khoảng 7 ms. Không prefill chunked.

### E2E latency

`E2E = TTFT + TPOT * output_tokens + network_response`

对于长输出(>500 Token),E2E bởi TPOT 主导──对于带长提示的短输出,E2E bởi TTFT 主导──报告按输出长度分组的E2E──

### Tải thông

`throughput = total_output_tokens / elapsed_time`

聚合指标―― nói cho bạn hiệu quả của hạm đội―― không thể nói cho bạn một đơn yêu cầu sức khỏe――

### Goodput  Bạn thực sự quan tâm chỉ số

`goodput = fraction of requests meeting (TTFT <= a) AND (TPOT <= b) AND (E2E <= c)`

SLO là một hạn chế đa hạn chế. Chỉ có mỗi hạn chế được đáp ứng, một yêu cầu là tốt.

Đến năm 2026, Goodput đã trở thành các đề xuất của MLPerf Inference v6.0 và các nhà cung cấp nền tảng AI trong SLA theo dõi.

### Tại sao có nghĩa là chính sách thống kê sai

Phân phối độ trễ LLM là đúng hướng. Trong một loạt giải mã, nếu có một yêu cầu tương ứng dài trước, có thể có 500 token TPOT khoảng 7 ms, trong khi có 20 token TPOT khoảng 60 ms.

始终报告三元组(P50、P90、P99)。 Đối với trải nghiệm người dùng, P99 才 là chỉ số bạn muốn tối ưu hóa。

### Số tham chiếu  TRT-LLM 上的 Llama-3.1-8B-Instruct,2026

- TTFT trung bình: 162 ms
- TPOT trung bình: 7,33 ms
- trung bình E2E: 1,093 ms
- P99 TPOT: 取决于碎片预填配置, thường thay đổi trong 10-25 ms 之间.

Đây là điểm tham khảo của NVIDIA. Chúng sẽ tùy thuộc vào kích thước mô hình.

### Trầm đo

Hai công cụ chuẩn được sử dụng phổ biến nhất năm 2026 sẽ đưa ra kết quả khác nhau đối với TPOT trên cùng một lần:

- **NVIDIA GenAI-Perf**: trong ITL 计算中排除 TTFT──ITL 从 Token 2 开始──
- **LLMPerf**:包含 TTFT──ITL 从 Token 1 开始──

Đối với một TTFT là 500 ms, 100 token đầu ra, tổng số mã hóa là 700 ms, GenAI-Perf báo cáo`ITL = 700/99 = 7.07 ms`,LLMPerf  báo cáo `ITL = 1200/100 = 12.00 ms`❖ Công cụ chọn lựa sẽ thay đổi số.

始终说明 đã sử dụng nào 始终发布定义──

### Xây dựng một SLO

2026 năm đối mặt với người tiêu dùng 70B chat mô hình của hợp lý SLO:

- TTFT P99 <= 800 ms。
- TPOT P99 <= 25 ms。
- Đối với <300-Token 输出,E2E P99 <= 3 s
- Mục tiêu sản lượng tốt >= 99%:

Các SLO doanh nghiệp sẽ thu hút TTFT ((200-400 ms) và mở rộng E2E──关键 là viết chúng xuống, đo lường, và đưa tốtput  như một đơn vị tổng hợp  để theo dõi──

### Cách đo

- 运行真流量或真实合成(LLMPerf 使用 `--mean-input-tokens 800 --stddev-input-tokens 300 --mean-output-tokens 150`(■)
- Mục tiêu của benchmark run là 2x đồng thời điểm cao nhất.
- 运行 30-50 lần lặp lại, đối với hợp并样本取百分比──
- 发布时包含 công cụ tên, phiên bản công cụ, mô hình, phần cứng, cạnh tranh, phân phối nhanh chóng.


```figure
throughput-latency
```

## Sử dụng nó
`code/main.py`là một phiên bản máy tính tính tốt đúc. Nó tạo ra phân phối độ trễ tổng hợp, ứng dụng SLO,并计算 tốt đúc. Nó cũng sẽ hiển thị cùng một dấu vết trên GenAI-Perf và TPOT khác biệt của LLMPerf.

## 交付 nó
本课会生成 `outputs/skill-slo-goodput-gate.md`❖ Đưa ra một khối lượng công việc và SLO, nó sẽ tạo ra một công thức chuẩn của CI / CD có thể sử dụng, sử dụng đầu vào tốt chứ không phải là đầu ra để triển khai cổng.

## 练习
1. 运行 `code/main.py` Tạo ra với sự phân bố 1% đuôi đập.  Khi bạn đưa P99 TPOT từ 30 ms  sát lại đến 15 ms 时, hiệu suất tốt thay đổi như thế nào?
2. 某供应商 引用Llama 3.3 70B H100 上 15,000 tok/s── 在相信它之前,应提出哪三个问题?
3. Tại sao bộ phận mua lại có thể bảo vệ P99 TPOT, nhưng không thể bảo vệ TPOT có nghĩa?
4. Để trợ lý giọng nói  xây dựng một người tiêu dùng SLO ((trước tiên token là được nghe, thay vì được đọc) ◊
5. 阅读 LLMPerf README 和 GenAI-Perf docs── tìm ra ba công cụ khác đây xác định không phù hợp các chỉ số──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| TTFT | “time to first token” | Queue + network + prefill；在长 prompts 下由 prefill 主导 |
| TPOT | “time per output token” | 首个 Token 之后每个 Token 的 memory-bound decode 成本 |
| ITL | “inter-token latency” | 在大多数工具中与 TPOT 相同（不是全部，见 GenAI-Perf） |
| E2E | “end to end” | TTFT + TPOT * output_len；再加上 response-side network |
| Throughput | “tok/s” | Fleet efficiency；没有 latency percentiles 时没有意义 |
| Goodput | “SLO-met rate” | 同时满足每个 SLO constraint 的请求比例 |
| P99 | “tail” | 百分之一最差情形 latency；用户体验指标 |
| SLO multi-constraint | “the joint” | 三个 latency bounds 的 AND；只要违反任意一个，请求就失败 |
| GenAI-Perf vs LLMPerf | “the tool trap” | 工具对 ITL 是否包含 TTFT 的定义不一致 |

## 延伸阅读
- [NVIDIA NIM — LLM Benchmarking Metrics](https://docs.nvidia.com/nim/benchmarking/llm/latest/metrics.html) TTFT、ITL、TPOT 权威定义──
- [Anyscale — LLM Serving Benchmarking Metrics](https://docs.anyscale.com/llm/serving/benchmarking/metrics) 替代定义与测量配方──
- [BentoML — LLM Inference Metrics](https://bentoml.com/llm/inference-optimization/llm-inference-metrics) thực sự triển khai 上的应用测量──
- [LLMPerf](https://github.com/ray-project/llmperf) dựa trên chuẩn nguồn mở của Ray.
- [GenAI-Perf](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/client/src/c++/perf_analyzer/genai-perf/README.html) Công cụ chuẩn của NVIDIA
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) tiêu chuẩn được công nghiệp chấp nhận dựa trên hiệu suất tốt
