# Phân tích Prefill/Decode  NVIDIA Dynamo 和 llm-d

> Prefill là tính toán-bắt buộc; decode là bộ nhớ-bắt buộc. Trên cùng một khối GPU trên cùng một thời gian, Planner sẽ tự động thay đổi hai sẽ lãng phí một trong số các tài nguyên. Phân chia sẽ phân chia chúng thành một nhóm tài nguyên độc lập, và thông qua NIXL. RDMA/InfiniBand hoặc TCP fallback) giữa chúng truyền KV cache. NVIDIA Dynamo. GTC 2025 phát hành, 1.0 GA) nằm trên vLLM/SGLang/TRT-LLM, vì vậy, nó được tăng lên trong các phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích phân tích$2M 级别推理支出上节省 30–40%（即 $600-800K/năm);$2M→$600-800K số字是内部复合,不是单个已发布的案例研究,应把它作为数级点,而不是引用参考――短提示(<512 token,短输出)不足以抵消传输成本――

**Type:** 学习
**Languages:** Python（stdlib，玩具级 disaggregated-vs-colocated simulator）
**Prerequisites:** Phase 17 · 04（vLLM Serving Internals），Phase 17 · 08（Inference Metrics）
**Time:** ~75 分钟

## Học mục tiêu

- 解释 tại sao prefill và decode có nhiều GPU tốt nhất khác nhau phân phối,并量化 colocation 下的浪费──
- 画出 phân chia kiến trúc:prefill pool、decode pool、通过NIXL的 KV转移、路由器──
- Nói ra phân chia 不划算的条件(短提示、短输出)
- 区分 NVIDIA Dynamo (nhiên bản) và Illm-d (nhiên bản) Kubernetes (nhiên bản),并把它们匹配对应的运维场景──

## 问题

Bạn đang ở trong 8 khối H100 上运行 Llama 3.3 70B。在混合工作负载(长提示 + 短输出) 下,GPU 在解码期间空,因为大部分计算已花在预填上。在另一类工作负载(短提示 + 长输出) 下,情况相反──

预算 ảnh hưởng: 20-40% của GPU  thời gian lãng phí trên nguồn sai lầm. Bạn đang mua máy tính H100 để chạy bộ nhớ-bắt buộc decode, hoặc mua băng thông H100 HBM để chạy prefill-bắt buộc máy tính. Cả hai đều là tốn kém.

Phân tích 会把 prefill 和 decode 拆分到独立资源池,并按各自瓶进行尺寸;;KV cache 通过高带宽互连从预填池 传输到解码池;;

## 概念

### Tại sao lại khác nhau?

**Prefill** đối với hoàn chỉnh nhập nhanh chóng  thực hiện một lần chuyển đổi về phía trước。 số nhân tử hình chiếm chủ yếu; liên kết với tính toán。H100 FP8 có thể cung cấp khoảng 2000 TFLOPS có hiệu lực  Hiệu suất lô  rất tốt, một lần về phía trước 可 xử lý nhiều token。

**Decode** 一次生成一个代币,每次代都读取完整重量──内存带宽限制──HBM3 提供约3TB/s──批量效率只有在高 concurrency下才好,因为重量读 会在批量上分摊──

Hãy đặt chúng: Bạn mua đồng thời cho hai GPU tối ưu hóa. H100 đều tốt, nhưng bất kể sử dụng nào cũng có giá trị tương tự.

### 架构

```
            ┌──────────────┐
  Request → │    Router    │ ───────────────────────┐
            └──────┬───────┘                        │
                   │                                │
                   ▼ (prompt only)                  │
            ┌──────────────┐    KV cache    ┌───────▼──────┐
            │ Prefill pool │ ─── NIXL ────► │ Decode pool  │
            │  (compute)   │                │  (memory)    │
            └──────────────┘                └──────┬───────┘
                                                   │ tokens
                                                   ▼
                                                 Client
```

NIXL là giao thông giữa các nút của NVIDIA──可用时使用 RDMA/InfiniBand,否则使用TCP fallback──传输延迟是真实存在的,70B FP8 上 4K-token prompt 的KV缓存通常需要 20-80 ms──这是短提示不适合分类的原因:传输税超过省收益──

### Dynamo vs llm-d

**NVIDIA Dynamo**(GTC 2025 发布,1.0 GA):
- 作为乐团主唱 位于 vLLM、SGLang、TRT-LLM 之上──
- Planner Profiiler 测量工作负载,SLA Planner tự động cấu hình prefill:decode 比例。
- lõi dung nhựa, Python có thể mở rộng được.
- 吞吐提升:NVIDIA 报告称,在 GB200 NVL72 + Dynamo 上,DeepSeek-R1 MoE 在中等延迟区间达到6x(developer.nvidia.com,2025-06);社区关于全黑威尔 + Dynamo + DeepSeek-R1 stacks 多达30x 的报告缺少单一主要来源,应视为方向性信息──
- GB300 NVL72 + Dynamo: theo Dynamo 产品页面(developer.nvidia.com,未注明期),相比Hopper,MoE 吞吐最高可可达50x。

**llm-d**(Red Hat + AWS,Kubernetes-native):
- Prefill / decode / router 作为独立 Kubernetes Services。
- HPA Per role 使用 queue depth (đối cao) / KV utilization (đánh mã) signal。
- `topologyConstraint packDomain: rack`会把 prefill+decode clicks  đặt trên cùng một kệ, để đạt được chuyển tải KV cao带宽.
- llm-d 0.5(2026):khiên bản KV phân cấp  định tuyến LoRA có tính cache  mạng UCCL  quy mô đến không 

Nếu bạn muốn quản lý một trình diễn viên xếp chồng lên, hãy sử dụng Dynamo. Nếu bạn muốn những bộ phim nguyên thủy gốc Kubernetes, và đã được đưa vào chế độ CNCF 生态, hãy sử dụng llm-d.

### 经济性

内部 composite (không phải là một nghiên cứu trường hợp đã được công bố đơn lẻ, chỉ như một số điểm):

- Chi phí khuyến cáo của dịch vụ được đặt trong phòng là 2 triệu USD/năm.
- 切换到使用 Dynamo 的 phân chia phục vụ。
- tương tự yêu cầu, tương tự P99 độ trễ SLA.
- 报告节省:$600K–$800K/năm ( giảm 30~40%)
- Không có bộ máy mới.

Chúng tôi lấy được con số này từ nhiều thông báo của khách hàng, chứ không phải từ một nghiên cứu trường hợp có thể trích dẫn; Điểm dữ liệu gần nhất đã được phát hành là định tuyến Dynamo KV của Baseten 带来 TTFT nhanh hơn 2 lần / 61% cao hơn thông qua(baseten.co,2025-10), cũng như VAST + CoreWeave trong tỷ lệ hit KV 4060% 下预测 token/$  tăng 60130%(vastdata.com,2025-12)  tiết kiệm từ mỗi nguồn để thực hiện kích thước phù hợp; dự trữ nặng 工作负载(带 8K+ tiền đề RAG) Than cân bằng tải hưởng lợi nhiều hơn.

### 什么时候 đừng phân chia

- Các lệnh < 512 token 且输出 < 200 token:传输税主导收益。
- 小型集群 ((< 4 GPU): không có đủ đa dạng hồ bơi。
- 团队 không thể vận hành hai bộ nhớ GPU và thực hiện quy mô theo vai trò: Dynamo sẽ có sự giúp đỡ, nhưng không phải là vô cùng phức tạp.
- Không có mô hình RDMA: Thuế chuyển giao TCP 更重──

### Router và giai đoạn 17 · 11 集成

Các router phân chia là KV-cache-aware(Phase 17 · 11)。 yêu cầu sẽ rơi đến nhóm giải mã có tiền đề của nó; nếu không phù hợp, hãy đi prefill → decode。 Hit rate và phân chia 会叠加收益, router cache quyết định liệu thậm chí cần phải mua lại gì。

### Đường điện ở Blackwell là nơi có số lượng thực sự.

GB300 NVL72 + Dynamo  đã hiển thị相比 Hopper cơ sở 50x của MoE 吞吐──MoE chuyên gia định tuyến 在 prefill 上计算-heavy, nhưng在解码 上内存-heavy(专家缓存), do đó phân chia là hai重收益──2026 năm mô hình biên giới phục vụ 以 MoE 为主----DeepSeek-V3、未来 GPT-5 biến thể)──

### Bạn nên nhớ số

Điểm chuẩn số liệu sẽ thay đổi, NVIDIA và xếp hàng suy luận Mỗi tháng đều sẽ phát hành kết quả cập nhật.

- GB200 NVL72 + Dynamo 上的 DeepSeek-R1:中等延迟区间相相比基线约 ~6x 吞吐(developer.nvidia.com,2025-06);社区关于全黑威尔 + Dynamo 高达30x的说法是方向性聚合,没有单一主要来源──
- GB300 NVL72 + Dynamo:相比Hopper,MoE 吞吐最高可达50x(developer.nvidia.com,未注明期)
- 节省点(内部 composite, không phải là một nghiên cứu trường hợp đơn lẻ): trong SLA 不变时, từ $2M 年度支出中节省 $600-800K/năm.
- Khoảng mục:Triệu ứng > 512 token + đầu ra > 200 token。
- Thông qua NIXL chuyển đổi KV:70B FP8 lên 4K-quay KV  cần 20-80 ms.


```figure
prefill-decode-split
```

## Sử dụng nó

`code/main.py`模拟 colocated vs disaggregated serving── báo cáo thông qua, chi phí theo yêu cầu, cũng như giao thông qua chiều dài nhanh──

## 交付 nó

本课会产出 `outputs/skill-disaggregation-decider.md`❖ Đưa tải trọng công việc và cluster, quyết định liệu có nên phân chia không.

## 练习

1. 运行 `code/main.py` Trong thời gian ngắn nào, phân chia sẽ tốt hơn so với việc đặt chỗ?
2. Đối với một P99 tiền đề chiều dài Đối với 8K, đầu ra Đối với 300 của RAG dịch vụ  thiết kế hồ bơi prefill và giải mã hồ bơi.
3. Dynamo vs llm-d:为一家纯Kubernetes shop 选择一个方案,且没有Python runtime 偏好。
4. 计算 KV chuyển phí:70B FP8 上 4K prefill = ~500 MB KV──在 RDMA 100 GB/s 下, chuyển=5 ms──在 TCP 10 GB/s 下 = 50 ms──哪个会影响你的SLA?
5. Các chuyên gia định tuyến MOE 会 thay đổi các mô hình truy cập KV. Đối với mỗi token  kích hoạt các chuyên gia khác nhau của MOE, phân chia sẽ biểu hiện như thế nào?

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Disaggregated serving | “split prefill/decode” | 为每个阶段使用独立 GPU pools |
| NIXL | “NVIDIA transport” | Dynamo 的 inter-node KV transfer（RDMA/TCP） |
| NVIDIA Dynamo | “the orchestrator” | vLLM/SGLang/TRT-LLM 的 stack-above coordinator |
| llm-d | “Kubernetes native” | Red Hat + AWS K8s disaggregated stack |
| Planner Profiler | “Dynamo auto-config” | 测量工作负载，配置 pool ratios |
| SLA Planner | “Dynamo policy” | 自动按速率匹配 prefill:decode 以满足 SLOs |
| `packDomain: rack` | “llm-d topology” | 将 prefill+decode 放在同一 rack 上以实现快速 KV |
| UCCL | “unified collective” | llm-d 0.5 用于 scale-to-zero 的 networking layer |
| MoE expert routing | “expert per token” | DeepSeek-V3 pattern；disaggregation 有帮助 |

## 延伸阅读

- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/)
- [TensorRT-LLM Disaggregated Serving blog](https://nvidia.github.io/TensorRT-LLM/blogs/tech_blog/blog5_Disaggregated_Serving_in_TensorRT-LLM.html)
- [llm-d GitHub](https://github.com/llm-d/llm-d)
- [llm-d 0.5 release notes](https://github.com/llm-d/llm-d/releases)
