# Load Testing LLM API  Tại sao k6 và Locust 会 nói dối

> Các trình kiểm tra tải trọng truyền thống không dành cho các phản ứng phát trực tuyến ∞ dài sản xuất thay đổi ∞ Token ∞ Metrics hoặc GPU  和 được thiết kế. Hầu hết các nhóm sẽ bị mắc kẹt trong hai rẫy. GIL ∞:Locust của Địa chỉ ∞ đo lường trong Python GIL 下运行 token hóa, trong cao并发时会见请求生成 竞争; token hóa backlog ∞ sẽ nâng cao báo cáo về độ trễ giữa các token ∞ 瓶 trên khách hàng của bạn, chứ không phải trên máy chủ. ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞ ∞`--mean-input-tokens`+ `--stddev-input-tokens`修复这一点──2026 年工具映射:LLM 专用工具(GenAI-Perf、LLMPerf、LLM-Locust、guidellm) được sử dụng cho Token 级准确性;**k6 v2026.1.0**+ **k6 Operator 1.0 GA（2025 年 9 月）** streaming-aware、Kubernetes-native, thông qua TestRun/PrivateLoadZone CRDs làm phân phối 测试, nhất phù hợp với CI/CD gate;Vegeta dùng cho Go saturation rate;Locust 2.43.3  chỉ có hợp tác với LLM-Locust extension 才适用于 streaming── tải trọng模式:steady-state、ramp、spike(autoscaling test)、soak(memory leaks)。

**Type:** Build
**Languages:** Python (stdlib, toy realistic-prompt generator + latency collector)
**前置要求：**Giai đoạn 17 · 08 (Tầm định đo), Giai đoạn 17 · 03 (GPU tự động quy mô)
**Time:** ~75 minutes

## Học mục tiêu
- 解释让通用载荷测试器 在LLM API 上说谎的两个反模式(GIL 陷、即时-uniformity 陷)
- 针对给定目的选择工具:LLMPerf(chỉ số chạy) k6 + phát sóng mở rộng(CI gate) guidellm(sự tổng hợp quy mô lớn)
- 设计四种负载模式 ((stable、ramp、spike、soak),并说出每种模式捕捉的失败模式──
- Sử dụng mã thông báo đầu vào của trung bình + stddev 构建真实的快速分布, thay vì cố định长度。

## 问题
Bạn đã thử nghiệm LLM Endpoint, thiết lập 500 người dùng đồng thời. Nó đã tồn tại. Bạn đã lên mạng. Trong môi trường sản xuất chỉ có 200 người dùng thực tế.

发生了两件事――第一,k6 发送 500 个相同的提示  您的请求-coalescing 和 tiền tố缓存 让它看起来像处理 500 个同步解码,但实际上只是处理一个──第二,k6 不会以人体验的方式跟踪流媒体响应的间代码延迟;它看到的是一个HTTP连接,而不是 500 个不同的间隔到达的代码──

Kiểm tra tải trọng của LLM là một câu hỏi độc lập.

## 概念
### GIL 陷(Locust)

Locust sử dụng Python, và bên khách hàng 于 GIL 下运行代码化.高并发时,Tokenizer 会排在请求生成后面.

修复:LLM-Locust mở rộng sẽ chuyển token hóa 移到独立进程, hoặc sử dụng harness ngôn ngữ biên soạn

### nhanh chóng-sự đồng nhất 陷

Tất cả các nhà kiểm tra tải được biết đến đều cho phép bạn configure một prompt. Trong 10,000 lần thử nghiệm vòng lặp, mỗi lần sẽ gửi hoàn toàn cùng một prompt.

修复: Từ phân phối nhanh 中采样。LLMPerf 使用 `--mean-input-tokens 500 --stddev-input-tokens 150` 长度多样,内容多样.

### 4 hình thức tải

1. **Steady-state** 以 RPS liên tục 运行 30-60 分钟──捕捉:baseline performance regressions──
2. **Ramp**Trong 15 phút, RPS sẽ tăng từ 0 线性 lên mục tiêu.
3. **Spike** đột nhiên tăng lên đến 3-10x RPS, kéo dài 2 phút sau phục hồi.
4. **Soak** trạng thái ổn định 运行 4-8 小时――捕捉:khí nhớ tôi động hồ bơi kết nối tôi chảy khả năng quan sát

### 2026 工具映射

**LLMPerf**(Anyscale)  Python, nhưng token hóa bởi Rust 支持──Mean/stddev prompt──Streaming-aware──性能运行的最佳默认选择──

**NVIDIA GenAI-Perf** Reference of NVIDIA── use Triton client;metric 覆盖全面── chú ý ITL của nó không chứa TTFT;LLMPerf 的包含── cùng một máy chủ 上两个工具会产生不同的 TPOT──

**LLM-Locust**(TrueFoundry) 修复 GIL 陷的 Locust extension──熟悉的 Locust DSL + streaming metrics──

**guidellm** Mức chuẩn tổng hợp quy mô lớn

**k6 v2026.1.0**+ **k6 Operator 1.0 GA（2025 年 9 月）**- Có thể là:
- K6 本身 ((Go, compile, không GIL) mới tăng các métrics nhận thức về streaming
- k6 Nhà điều hành sử dụng TestRun / PrivateLoadZone CRDs  thực hiện các thử nghiệm phân tán gốc của Kubernetes。
- Ưu hợp nhất với các cổng CI/CD và thử nghiệm SLA.

**Vegeta** Go,比 k6 更简单──Constant-rate HTTP saturation── không có khả năng nhận thức về LLM, nhưng phù hợp với các thử nghiệm gateway / rate-limit──

**Locust 2.43.3 stock** Đối với LLM có GIL 陷── chỉ có thể đi kèm với LLM-Locust mở rộng sử dụng──

### Cổng SLA của CI trung tâm

Trong PR 上运行 k6,并使用:

- Trong RPS cơ bản 下各 30-50 lần lặp lại.
- Cổng:P50/P95 TTFT、5xx < 5%、TPOT 低于值。
- 违规时让建设 失败。

### Thực sự phân phối nhanh chóng

Từ thực流量样本构建 (如果有), hoặc từ các phân phối công cộng 构建 (例如用于聊天的 ShareGPT提示、用于代码的 HumanEval) 将意味着+stddev 输入 LLMPerf──无论如何都应避免循环-with-one-prompt──

### Bạn nên nhớ số

- k6 Nhà điều hành 1.0 GA:2025 年 9 月。
- k6 v2026.1.0:chỉ số nhận thức về streaming
- 典型LLMPerf run: trong đồng thời X 下 100-1000 yêu cầu
- Cổng CI điển hình: mỗi PR 30-50 lần lặp lại.
- 4 hình thức: ổn định, trượt cao, đập nước.


```figure
load-pattern-waves
```

## Sử dụng nó
`code/main.py`模拟带有真实快速分布的负载测试, đo lường hiệu quả TPOT,并演示均快速陷──

## 交付 nó
本课生成 `outputs/skill-load-test-plan.md`△ Given workload 和 SLA 后, chọn công cụ并设计四种负载模式──

## 练习
1. 运行 `code/main.py` Bước tương đương và phân bố thực tế  差在哪里?
2. Để CI Gate 编写 k6 script: trong 100 đồng thời 下 TTFT P95 < 800 ms, thời gian chạy 5 分钟.
3. Kiểm tra ngâm của bạn cho thấy bộ nhớ mỗi giờ tăng 50 MB.
4. Kiểm tra Spike từ 10 RPS đến 100 RPS── Nếu Karpenter + vLLM sản xuất-phép đã có vị trí Phase 17 · 03 + 18), dự kiến thời gian phục hồi là bao nhiêu?
5. GenAI-Perf 在同一服务 上报告 TPOT=6ms;LLMPerf 报告 TPOT=11ms──解释原因──

## 关键术语
| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| LLMPerf | "LLM harness" | Anyscale benchmark tool，streaming-aware |
| GenAI-Perf | "NVIDIA tool" | NVIDIA reference harness |
| LLM-Locust | "Locust for LLMs" | 修复 GIL 陷阱的 Locust extension |
| guidellm | "synthetic benchmark" | Large-scale synthetic tool |
| k6 Operator | "K8s k6" | 基于 CRD 的 distributed k6 |
| GIL trap | "Python client overhead" | Tokenization backlog 抬高报告的 latency |
| Prompt-uniformity trap | "single-prompt lie" | 使用相同 prompt 循环命中 cache，抬高 throughput |
| Steady-state | "constant load" | 持续 N 分钟的平坦 RPS |
| Ramp | "linear up" | 在 duration 内从 0 到目标值 |
| Spike | "burst test" | 突然倍增，然后恢复 |
| Soak | "long test" | 用数小时检测 leak |

## 延伸阅读
- [TianPan — Load Testing LLM Applications](https://tianpan.co/blog/2026-03-19-load-testing-llm-applications)
- [PremAI — Load Testing LLMs 2026](https://blog.premai.io/load-testing-llms-tools-metrics-realistic-traffic-simulation-2026/)
- [NVIDIA NIM — Introduction to LLM Inference Benchmarking](https://docs.nvidia.com/nim/large-language-models/1.0.0/benchmarking.html)
- [TrueFoundry — LLM-Locust](https://www.truefoundry.com/blog/llm-locust-a-tool-for-benchmarking-llm-performance)
- [LLMPerf](https://github.com/ray-project/llmperf)
- [k6 Operator](https://github.com/grafana/k6-operator)
