# Sử dụng LMCache KV Thả Lưu trữ sản xuất vLLM

> vLLM's production-stack is reference Kubernetes 部署,把路由器、引擎和可观性 连接在一起──LMCache là KV-offloading layer, nó lấy KV cache ra khỏi bộ nhớ GPU, và lấy ra từ các truy vấn và giữa các động cơ.

**Type:** Learn
**Languages:** Python (stdlib, toy KV-spill simulator)
**前置要求：**Giai đoạn 17 · 04 (vLLM Serving Internals), Giai đoạn 17 · 06 (SGLang/RadixAttention)
**Time:** ~60 minutes

## Học mục tiêu
- 画出 vLLM sản xuất-stack từng tầng: bộ định tuyến, động cơ, KV tải xuống, khả năng quan sát.
- 解释 KV Offloading Connector API ((v0.9.0+), cũng như đường không đồng bộ 0.11.0 如何隐藏卸载延迟──
- 量化 LMCache CPU-DRAM 何時有幫助 ((KV > HBM),以及何時只增加上市 ((KV小到足以放入HBM) ⋅
- 根据部署约束, trong vLLM bản địa CPU offload 和 LMCache kết nối 之间做选择──

## 问题
Bạn của vLLM phục vụ trong đồng thời 上升时显示 GPU HBM đạt 100%,并出现预先事件──请求被驱逐、requeue,然后与一个2K-token prompt 在一分钟内被重新填充四次──GPU计算被花在重复的预填上;产量远低于原产量──

增加更多GPU的成本是线性的. 增加更多HBM 不可能. 但是CPU DRAM 很便宜,一个插座就像有512GB,延迟比HBM差几数级,但对临时保温的KV缓存来说足够.

LMCache sẽ đưa bộ nhớ cache KV  rút vào CPU DRAM, để yêu cầu trước 快速恢复,并让 động cơ  giữa các bộ nhớ lặp đi lặp lại cộng tác bộ nhớ cache, không cần mỗi động cơ đều được prefill lại.

## 概念
### Vòng sản xuất vLLM

`github.com/vllm-project/production-stack` Reference Kubernetes 部署:

- **Router** cache-aware(Phase 17 · 11)。消费 KV sự kiện。
- **Engines** nhân viên vLLM。 mỗi GPU một, hoặc mỗi nhóm TP/PP một。
- **KV cache offload** LMCache triển khai hoặc kết nối gốc
- **Observability** Prometheus scrape, Grafana dashboard, OTel tracks.
- **Control plane** phát hiện dịch vụ  cấu hình  cập nhật trình diễn

以 Helm chart + operator 形式交付。

### KV Kloading Connector API (v0.9.0+)

vLLM 0.9.0 đã giới thiệu Connector API, được sử dụng cho các backend cache KV có thể cắm được.

vLLM 0.11.0(2026 年 1 月) đã tăng đường tải xuống không đồng bộ: trong trường hợp thường, tải xuống có thể xảy ra ở phía sau, do đó động cơ sẽ không bị cản trở.

### Native CPU offload vs LMCache

**Native vLLM CPU offload**: engine-local──把 KV blocks 存储在主机 RAM 中──实现快,零网络 hop──不能跨引擎──

**LMCache connector**: cluster-scale──把 blocks 存储 trên shared LMCache server(CPU DRAM + Ceph/S3 tier) 中── bất kỳ động cơ nào đều có thể truy cập vào các blocks── đã có 16x H100 benchmarks 发布──

Khi một động cơ có áp lực HBM 时选择 native──当多个 động cơ 共享前置──时选择 LMCache──带 chung các yêu cầu hệ thống của RAG、带 chia sẻ mẫu của nhiều thuê nhà)──

### Hành vi đánh giá

分布在 4 台 a3-highgpu-4g 上的 16x H100(80 GB HBM)测试:

- KV thấp dấu chân ((các lời nhắc ngắn 低同步): tất cả các cấu hình đều tương đương với đường cơ bản, LMCache tăng khoảng 3-5% tổng chi phí。
- Moderate footprint:LMCache  bắt đầu trong động cơ  sử dụng lại tiền tố giữa các động cơ 上带来帮助。
- KV  vượt quá HBM: tải CPU gốc và LMCache sẽ tăng đáng kể thông suất; LMCache tăng lợi nhuận hơn, vì có chia sẻ đa động cơ.

### Khi LMCache là quyết định

- 多个租户 共享系统提示 的多租户服务──
- Các đoạn tài liệu trong các truy vấn 之间重复的 RAG──
- Cùng với các biến thể được điều chỉnh tốt nhất của cơ sở trên (LoRA), trong đó mô hình cơ sở KV tái sử dụng sẽ giảm重复工作。
- Nhiệm vụ công việc nặng trước: từ CPU khôi phục 比重新预充 更便宜──

### Khi NOT để kích hoạt

- HBM áp suất rất nhỏ: bạn sẽ trả phí trên nhưng không có lợi ích.
- Các ngữ cảnh ngắn ((< 1K token): thời gian chuyển giao > 重新 prefill。
- Load workload: không có khả năng tái sử dụng

### Kết hợp với dịch vụ phân chia

Giai đoạn 17 · 17 phân chia dịch vụ + LMCache 会叠加增益: từ hồ sơ chứa trước đến hồ sơ giải mã của KV chuyển giao Nếu không được sử dụng, sẽ rơi vào LMCache; sau đó truy vấn 会 từ LMCache 拉取──Giai đoạn 17 · 11 bộ định tuyến có tính cache có thể chuyển các yêu cầu qua bộ nhớ cache địa phương hoặc bộ nhớ cache chia sẻ LMCache 匹配 của động cơ──

### Những con số mà bạn nên nhớ

- vLLM 0.9.0:Connector API 发布──
- vLLM 0.11.0(2026 年 1 月): đường tải không đồng bộ; tác động trễ cuối đến cuối 取决于工作负荷、KV hit rate 和系统压力(不是绝对保证)。
- Định hướng 16x H100: Khi dấu chân KV vượt quá HBM, LMCache có ích.
- Giảm áp suất HBM: có 3-5% chi phí trên 且无收益──


```figure
zero-sharding
```

## Sử dụng nó
`code/main.py`会模拟一个有无LMCache的预先-heavy workload──报告避免的重新填充──通过输出增长和破平 HBM利用──

## 交付 nó
本课会产出 `outputs/skill-vllm-stack-decider.md`△ Đưa định hình tải trọng làm việc và triển khai vLLM, phán quyết chọn bản địa ◦ LMCache, hay hai trong hai đều không chọn.

## 练习
1. 运行 `code/main.py`LMCache từ sử dụng HBM bắt đầu lập kế hoạch?
2. 某租户 每小时 200 查询 共享一个 6K-token hệ thống nhanh chóng──计算每个租户 预期的 LMCache tiết kiệm──
3. LMCache server là điểm thất bại duy nhất.
4. LMCache trên đĩa quay 上存到 Ceph. Đối với 70B FP8 下 4K-token KV(500 MB), đọc thời gian 相比 tái lấp ơi  làm thế nào?
5. 论证 vLLM 0.11.0 đường không đồng bộ 否免费:overhead 藏在哪里?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Production-stack | “参考部署” | vLLM 的 Kubernetes Helm chart + operator |
| Connector API | “KV backend interface” | vLLM 0.9.0+ 的 pluggable KV store interface |
| Native CPU offload | “engine-local spill” | 把 KV 存到同一 engine 的 host RAM 中 |
| LMCache | “cluster KV cache” | CPU DRAM + disk 上的 cross-engine KV cache server |
| 0.11.0 async | “non-blocking offload” | 隐藏在 engine stream 后面的 offload |
| Preemption | “evict to make room” | HBM 满时的 KV cache shuffle |
| Prefix reuse | “same system prompt” | 多个 queries 共享开头；cache hit |
| Ceph tier | “disk tier” | cache hierarchy 中 DRAM 下方的 durable storage |

## 延伸阅读
- [vLLM Blog — KV Offloading Connector (Jan 2026)](https://blog.vllm.ai/2026/01/08/kv-offloading-connector.html)
- [vLLM Production Stack GitHub](https://github.com/vllm-project/production-stack) Chế độ Helm + Operator
- [LMCache for Enterprise-Scale LLM Inference (arXiv:2510.09665)](https://arxiv.org/html/2510.09665v2)
- [LMCache GitHub](https://github.com/LMCache/LMCache) Thực hiện các kết nối
- [vLLM 0.11.0 release notes](https://github.com/vllm-project/vllm/releases) chi tiết đường đi không đồng bộ.
