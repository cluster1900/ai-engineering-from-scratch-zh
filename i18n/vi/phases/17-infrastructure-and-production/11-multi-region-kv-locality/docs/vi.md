# Các khu vực đa LLM phục vụ với KV Cache địa điểm

> Để suy luận về dự trữ LLM, cân bằng tải trọng vòng tròn-robin là không tốt. Một yêu cầu nếu không rơi vào các nút của dự định của nó, phải trả tiền đầy đủ dự định. Thành phần:长 prompt 上 P50 约 800 ms, trong khi dự trữ hit 约 80 ms. Đến năm 2026, chế độ sản xuất là bộ định tuyến có tính cache (vLLC) ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] ]] 

**Type:** Learn
**Languages:** Python (stdlib, toy prefix-cache-aware router simulator)
**Prerequisites:** Phase 17 · 04 (vLLM Serving), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 minutes

## Học mục tiêu
- 解释 tại sao cân bằng tải vòng tròn sẽ phá vỡ suy luận缓存,并量化 TTFT 惩罚。
- 画出 cache-aware router:输入(KV-cache events) 算法(prefix-hash match) tie-breaker(GPU sử dụng)
- Nói ra 32% của LLM DR 失败驱动因素(缺失 Tokenizer 文件 / định lượng hóa config),并陈述三文件 DR checklist──
- 区分商业跨区域 产品(Bedrock CRI、GKE Multi-Cluster Gateway) với KV-aware routing。

## 问题
Bạn đang ở phía trước đặt một ALB,并 sử dụng vòng tròn-robin。 tỷ lệ hit cache tiền tố trong sản xuất  giảm xuống còn 8%。TTFT P50  tăng lên ba lần。 nhật ký vLLM của bạn  hiển thị mỗi yêu cầu đều đang thanh toán đầy đủ 成本。

Round-robin đối với dịch vụ không trạng thái là tốt nhất. Lệnh kết luận của LLM là: KV cache đã được lập trình cho mô hình đã thấy mọi thứ.

Ngoài ra, đội của bạn có một kế hoạch DR. Bạn đặt trọng lượng mô hình 备份 đến S3 khu vực qua.

Các ngành LLM đa khu vực phục vụ là cache 问题、路由 问题和 DR vệ sinh 问题, không phải là cân bằng tải 问题。

## 概念
### Đường dẫn có tính cache

 Bạn có cache của prefix này ?🏻                                                                                                                                                                                                                                                        

**vLLM Router**(Rust,2026 sản xuất-stack): 订阅 `kv.cache.block_added`events,维护 tiền tố hash → replica index, dùng O(1) tìm kiếm 路由──没有匹配时回落到最小排行深──

**llm-d router**: tương tự mô hình,Kubernetes-native── thông qua ControlPlane API 发布 sự kiện──

**SGLang RadixAttention**(Phase 17 · 06) là nội dung tương ứng等价物──Cross-replica routing 严格发生在上游──

### Số

2K-token prompt 上的 TTFT P50,Llama 3.3 70B FP8,H100:
- Cache hit (((những bản sao tương tự, người cư trú tiền tố): ~ 80 ms。
- Cache miss ((cold prefill): ~ 800 ms。

10x 差距── Nếu router của bạn đạt đến 60-80% cache tiền tố giữa các bản sao, bạn đang ở trong N-replica 容量 dưới gần một bản sao 性能── nếu nó chỉ là 10%, bạn gần với quy mô ngây thơ──

### Phía xuyên vùng có một quy tắc mới:

RTT liên khu vực:
- US-East-1  US-West-2: ~65 ms。
- US-East-1  eu-West-1: ~75 ms。
- US-East-1  ap-southeast-1: ~ 220 ms。

Nếu định tuyến đưa yêu cầu từ US-East-1 送 đến ap-southeast-1 热 tiền đề,节省的预填(800 → 80 ms) sẽ được 440 ms round-trip 抵消──GORGO(2026 nghiên cứu)把这一点显式化:联合最小化`prefill_time + network_latency`, thay vì chỉ tối thiểu hóa prefill. Câu trả lời thường là giữ tuyến đường khu vực, trừ khi prefill chiếm chủ yếu các prefix đa MB khổng lồ.

### 商业 "tranh vùng suy luận" 在这里帮不上忙

AWS Bedrock cross-region inference 会在容量压力期间自动把请求路由到其他地区──它优化可用性,不优化 TTFT,并且把 inference 当作黑盒──GKE Multi-Cluster Gateway 也是一样:服务级故障over,不感知 KV cache──

Ngay khi sử dụng các sản phẩm này, bạn vẫn cần bộ định tuyến có tính cache của ứng dụng lớp. Chúng xử lý us-east-1 着火了的情况.

### DR vệ sinh: 32% hồ sơ bị mất 问题

广泛引用的2026 统计:32% của LLM DR 失败, là vì đội dự trữ cân, nhưng quên:

- `tokenizer.json`Hoặc`tokenizer.model`
- Quantization config (tự định lượng)`quantize_config.json`、AWQ scale、GPTQ điểm không)
- Các cấu hình cụ thể cho mô hình ((RoPE quy mô, mặt nạ chú ý, mẫu trò chuyện)
- Định cấu hình động cơ`vllm_config.yaml`、 lấy mẫu mặc định 、LoRA adapter manifests)

修复方式是三文件最小 DR manifesto:

1. HF model repo 下所有文件(nhiều trọng + cấu hình + Tokenizer)
2. 引擎特定服务配置──
3. Bản báo triển khai ((K8s YAML、Dockerfile、Lock phụ thuộc)

Ngoài ra: mỗi mùa chạy một lần diễn tập DR. JPMorgan US-East-1 diễn tập vào tháng 11 năm 2024 đạt 22 phút phục hồi, chỉ vì sách chơi đã được thực hiện.

### Data residency là vấn đề chính trị

Khách hàng EU PHI không thể rời EU. Nếu router có tính cache của bạn 为了匹配 tiền đề, hãy gửi yêu cầu phát hành đến phía đông Mỹ-1, thì bất kể TTFT  lợi ích như thế nào, bạn đã vi phạm GDPR.

### Bạn nên nhớ số

- Cache hit vs miss TTFT 差距: ~10x(2K prompt 上 80 ms vs 800 ms) ]]
- RTT liên khu vực Mỹ-EU: ~75 ms。
- DR thất bại: 32% 缺失 Tokenizer/quant config ⋅
- JPMorgan us-east-1 thất bại 2024 年 11 月:22 分钟(30-min SLA) ⋅


```figure
cache-aware-router
```

## Sử dụng nó
`code/main.py`Trong khối lượng công việc đa khu vực 上模拟三种路由策略(round-robin、cache-aware regional、cache-aware global)  báo cáo tỷ lệ hit cache、TTFT P50/P99 和 cross-region bill──

## 交付 nó
本课产 出 `outputs/skill-multi-region-router.md` Đề xuất khu vực, hạn chế cư trú và SLA, thiết kế kế đường dẫn

## 练习
1. 运行 `code/main.py`Trong 75 ms RTT dưới, thời gian nhanh đến bao nhiêu giờ chuyển tuyến xuyên khu vực sẽ vượt qua chuyển tuyến chỉ địa phương?
2. Tỷ lệ hit cache của bạn từ 70% giảm xuống còn 12%  Chẩn đoán ba nguyên nhân có thể xảy ra, cũng như xác định các nguyên nhân được quan sát.
3. Để một trong vLLM phục vụ 带 5 个 LoRA adapters của 70B AWQ-quantized mô hình  thiết kế DR manifesto──列出每个文件和配置──
4. 论证 Bedrock cross-region inference đối với có nghiêm ngặt TTFT SLO của fintech là không đủ.
5. Một yêu cầu của Paris đã phù hợp với tiền tố của US-East-1...

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cache-aware routing | "smart LB" | 基于 prefix-hash match，把请求路由到持有 KV-cache 的 replica |
| KV-cache events | "cache pub-sub" | Replicas 发布 block add/evict；router 建索引 |
| Prefix hash | "cache key" | 前 N tokens 的 hash，用作 router lookup |
| GORGO | "cross-region routing research" | arXiv 2602.11688；把 network latency 作为显式项 |
| Cross-region inference | "Bedrock CRI" | AWS 产品；availability failover，不感知 TTFT |
| DR manifest | "the backup list" | 恢复所需的每个文件，不只是 weights |
| Data residency | "GDPR boundary" | 关于哪个 region 可以看到 user data 的法律约束 |
| RTT | "round-trip time" | Network latency；75 ms US-EU，220 ms US-APAC |
| LLM-aware LB | "cache-hit LB" | 作为产品类别的 cache-aware router |

## 延伸阅读
- [BentoML — Multi-cloud and cross-region inference](https://bentoml.com/llm/infrastructure-and-operations/multi-cloud-and-cross-region-inference)
- [arXiv — GORGO (2602.11688)](https://arxiv.org/html/2602.11688v1) 带 network latency 项 cross-region KV-cache reuse。
- [TianPan — Multi-Region LLM Serving Cache Locality](https://tianpan.co/blog/2026-04-17-multi-region-llm-serving-data-residency-routing)
- [AWS Bedrock Cross-Region Inference](https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html) Tài liệu về sự sẵn có của sự cố trên 
- [vLLM Production Stack Router](https://github.com/vllm-project/production-stack) nguồn router có tính cache 
