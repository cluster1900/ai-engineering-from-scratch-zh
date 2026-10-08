# Kubernetes 上的 GPU Autoscaling  Karpenter, KAI Scheduler, Gang Scheduling

> Đây là một tầng, không phải là một tầng. Khép trạm 动态供应节点(不到一分钟,比 Cluster Autoscaler 快 40%)  KAI Scheduler 处理帮排序、拓感知和分层队列  它能避免7个8部分分配陷:七个节点因为缺缺一个GPU而等并烧钱.`DCGM_FI_DEV_GPU_UTIL`Đó là nhiệm vụ chu kỳ đo: 100% có thể là 10 yêu cầu, cũng có thể là 100 个.`WhenEmptyOrUnderutilized`Chiến lược, vì nó sẽ chấm dứt công việc GPU đang chạy trong quá trình suy luận.

**Type:** Learn
**Languages:** Python (stdlib, toy queue-depth autoscaler simulator)
**前置要求：**Giai đoạn 17 · 02 (Thiết học nền tảng thông tin), Giai đoạn 17 · 04 (vLLM Serving Internals)
**Time:** ~75 minutes

## Học mục tiêu
- 画出三层自动扩展 架构 节点供给,团队安排,应用层),并说出每层使用的工具──
-  Giải thích tại sao `DCGM_FI_DEV_GPU_UTIL`là lỗi HPA 信号 của vLLM,并 nói ra hai tín hiệu thay thế (quang đường dài, KV cache sử dụng tỷ lệ)
- Mô tả lập trình băng đảng và KAI Scheduler 防止的部分分配失败模式(8 GPU trong đó có 7 个空 chờ)
- Nói gặp gỡ终止 đang chạy GPU công việc của Karpenter hợp nhất 策略`WhenEmptyOrUnderutilized`),并说明 chương trình thay thế an ninh năm 2026

## 问题
Nhóm của bạn tại Kubernetes lên đăng một dịch vụ LLM.`DCGM_FI_DEV_GPU_UTIL`作为信号――业务时间内服务一直卡在100%利用率――HPA 从不扩大 它已经认为你满载了――你手动增加一副本;TTFT 降落了――HPA 仍然不扩容――这个信号在欺骗你――

Ngoài ra, bạn sử dụng Cluster Autoscaler 管理节点──凌晨2点来一个1M-Token prompt; cluster花了3分钟供给节点,请求超时──

Ngoài ra, bạn triển khai một cần trải qua 2 nút sử dụng 8 GPU của mô hình 70B;. cluster có 7 GPU trống, còn 1 GPU phân tán trên 3 nút;. cluster Autoscaler vì thiếu hụt 1 GPU  cung cấp một nút;. bảy nút chờ 4 phút, một bên đốt tiền, một bên Kubernetes Đặt GPU cuối cùng lên;.

Ba tầng, ba kiểu khác nhau thất bại.

## 概念
### Lớp 1  节点供给 (Kharpenter)

Karpenter 监听 pods chờ đợi, và trong khoảng 45-60 giây cung cấp các nút(Cluster Autoscaler đối với GPU 节点 thường mất 90-120 giây)。 nó sẽ tùy thuộc `NodePool`约束动态选择实例类型  Nếu pod của bạn 需要8 H100,而集群中没有匹配节点,Karpenter sẽ trực tiếp cung cấp cho một节点, thay vì mở rộng một nhóm hiện có.

**consolidation 陷阱**: Carpenter 默认的 `consolidationPolicy: WhenEmptyOrUnderutilized`Đối với GPU pool  rất nguy hiểm. Nó sẽ chấm dứt hoạt động của GPU 节点, chuyển pod sang một ví dụ nhỏ hơn và phù hợp hơn. Đối với tải trọng công việc suy luận, điều này có nghĩa là yêu cầu đang chạy bị loại bỏ và tải lại mô hình 70B trên một node mới.

Cài đặt an toàn của GPU pool:

```yaml
disruption:
  consolidationPolicy: WhenEmpty
  consolidateAfter: 1h
```

允许Karpenter 在一小时后巩固 真正空的节点,但绝不驱逐正在运行的工作──

### Lớp 2  lập trình băng đảng(KAI Scheduler)

KAI Scheduler(项目原名 "Karp",后改名) xử lý默认 kube-scheduler 不处理的事情:

**Gang scheduling** Full có hoặc toàn không có điều chỉnh địa điểm.                                                                                                                                                                                                                                                         

**拓扑感知** 知道哪些GPU共享 NVLink、哪些位于同一架、哪些之间有InfiniBand──并据此放置 pod──DeepSeek-V3 67B tensor-parallel workload 必须留在一个 NVLink域内;KAI Scheduler sẽ tuân thủ这一点──

**分层队列** Nhiều đội có ưu tiên và hạn chế  cạnh tranh với một nhóm GPU.  Cần cấp thiết sản xuất của nhóm A chỉ được phép trong quy tắc ưu tiên, khi được tuyển dụng vào công việc đào tạo của nhóm B.

KAI 作为二级调度器与 kube-scheduler 一起部署;你通过注释 让工作负载 使用它──Ray 和 vLLM生产堆 都有集成──

### Lớp 3   ứng dụng层信号

**HPA 陷阱**- Có thể là:`DCGM_FI_DEV_GPU_UTIL`là phép đo chu kỳ nhiệm vụ  Nó đo GPU trong mỗi khoảng cách liệu đang làm việc hay không. 100% tỷ lệ sử dụng có thể có nghĩa là 10 个并发请求, cũng có thể là 100 个; bất kể loại nào, GPU đều bận.

Tệ hơn, vLLM và tương tự như động cơ sẽ dự định phân phối bộ nhớ cache KV`--gpu-memory-utilization`(■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

**2026 年替代信号**- Có thể là:

- 队列深度( chờ đợi số yêu cầu trước)
- KV cache utilization rate( phân bổ cho khối của chuỗi hoạt động ví dụ)。
- Mỗi bản sao của P99 TTFT của bạn SLA 信号)
- Goodput ((( mỗi giây đáp ứng tất cả các yêu cầu của SLO)

NVIDIA Dynamo Planner 和 llm-d Workload Variant Autoscaler 会消费这些信号并扩缩复лика──它们将完全取代用于 LLM phục vụ HPA──

### 什么时候用什么

| Scale decision | Tool |
|----------------|------|
| 添加/移除节点 | Karpenter |
| 调度 multi-GPU job | KAI Scheduler |
| 添加/移除 replica | Dynamo Planner / llm-d WVA（或基于队列深度的自定义 HPA） |
| 选择 GPU type | Karpenter NodePool |
| 抢占 low-priority | KAI Scheduler queues |

### Phân tích phân tích prefill/decode 会让一切更复杂

Nếu bạn chạy prefill / decode phân chia (Phase 17 · 17), bạn sẽ có hai loại pod, và chúng có kích hoạt quy mô khác nhau: prefill pod dựa trên quãng đường dài mở rộng容量, decode pod dựa trên áp suất cache KV 扩缩容量.llm-d sẽ đưa chúng ra với một HPA độc lập mỗi vai trò.`Services`Đừng cố gắng để một HPA độc lập ở hai mặt trước.

### Bắt đầu lạnh ở đây cũng rất quan trọng

Khử khởi động lạnh (Phase 17 · 10) là thời gian cung cấp thời gian chuyển thành người dùng có thể nhìn thấy chậm hơn nơi nào đó.`min_workers=1`), hoặc trong ứng dụng sử dụng lối kiểm soát kiểu Modal.

### Bạn nên nhớ số

- Karpenter 节点供应: khoảng 45-60s, đối với Cluster Autoscaler 约 90-120s (GPU 节点) ⋅
- KAI lập kế hoạch  ngăn chặn phân phối phần lãng phí  7 trong 8 陷。
- `DCGM_FI_DEV_GPU_UTIL`作为 HPA 信号:坏掉的; sử dụng quãng đường hầm độ hoặc KV sử dụng tỷ lệ.
- Thợ làm gỗ `WhenEmptyOrUnderutilized`Kết luận:终止正在运行GPU工作──对推断使用 `WhenEmpty + consolidateAfter: 1h`


```figure
autoscaling
```

## Sử dụng nó
`code/main.py`Trong khối lượng làm việc của GPU nổ lên trên mô hình một bộ tự động cấp ba.

## 交付 nó
本课会生成 `outputs/skill-gpu-autoscaler-plan.md`❖ Được định hình topology cluster ∞ hình dạng tải trọng và SLO, nó sẽ thiết kế một giải pháp tự động quy mô ba tầng ∞

## 练习
1. 运行 `code/main.py`Trong khối lượng công việc bùng nổ, HPA trong chu kỳ nhiệm vụ vô tính sẽ mất bao nhiêu yêu cầu HPA có thể tiếp nhận? Sự khác biệt đến từ đâu?
2. Để một trong H100 SXM5 trên dịch vụ Llama 3.3 70B FP8 cluster  thiết kế Karpenter NodePool。 chỉ định `capacity-type``disruption.consolidationPolicy``consolidateAfter`, cũng như một để không GPU tải trọng làm việc không thể điều chỉnh đến các nút trên các vết bẩn.
3. 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡 卡
4. 为 phân chia prefill pod 选择一个自动扩展信号,并为解码 pod 选择另一个不同信号――说明两者理由――
5. 计算 `WhenEmptyOrUnderutilized`Kết hợp  trong một 24x7 sản xuất dịch vụ trên chi phí: dịch vụ này trung bình có 60 lần mỗi ngày yêu cầu-để giảm sự kiện, và P99 TTFT > 10s:

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Karpenter | "the node provisioner" | Kubernetes 节点 autoscaler；亚分钟级供给 |
| Cluster Autoscaler | "the old scaler" | Kubernetes 节点 autoscaler 的前身；更慢，基于 group |
| KAI Scheduler | "the GPU scheduler" | 用于 gang + topology + queues 的 secondary scheduler |
| Gang scheduling | "all or nothing" | 原子化调度 N 个 pod，或全部延后 |
| Topology awareness | "rack-aware" | 基于 NVLink/IB/rack placement 放置 pod |
| `DCGM_FI_DEV_GPU_UTIL` | "GPU utilization" | Duty-cycle metric；不是 LLM 的 scaling signal |
| Queue depth | "waiting requests" | 对 prefill-bound scaling 正确的 HPA 信号 |
| KV cache utilization | "memory pressure" | 对 decode-bound scaling 正确的 HPA 信号 |
| Consolidation | "Karpenter consolidation" | 终止节点以迁移到更便宜的 instance type |
| `WhenEmpty + 1h` | "safe consolidation" | 不驱逐正在运行 GPU job 的策略 |

## 延伸阅读
- [KAI Scheduler GitHub](https://github.com/kai-scheduler/KAI-Scheduler) 设计文档和配置示例──
- [Karpenter Disruption Controls](https://karpenter.sh/docs/concepts/disruption/) chính sách hợp nhất 语义和 GPU-safe 默认值。
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) Dynamo Planner quy mô tín hiệu.
- [Ray docs — KAI Scheduler for RayClusters](https://docs.ray.io/en/latest/cluster/kubernetes/k8s-ecosystem/kai-scheduler.html)Ray 集成模式──
- [AWS EKS Compute and Autoscaling Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/aiml-compute.html) hướng dẫn cụ thể cho Kubernetes quản lý
- [llm-d GitHub](https://github.com/llm-d/llm-d) Variable Autoscaler 设计。
