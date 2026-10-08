# Mức độ giảm bớt bắt đầu lạnh của LLM không máy chủ

> Một hình ảnh mô hình 20 GB từ lạnh đến phục vụ 需要 5-10 分钟(7B) đến 20+ 分钟(70B) ・・・在真正的无服务器世界里,这不是加热,而是停电──Mitigations作用在五层:预种种节点图像(AWS 上的瓶块、双体积弧)、模型流播(NVIDIA Run:ai Model Streamer,vLLM 原生支持)、GPU bộ nhớ snapshots(Modal checkpoints,restart 最多快 10x)、热池(`min_workers=1`(Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nói: "Nó" "Nói: "Nó" "Nó": "Nó" "Nó" "Nó" "Nó" "Nó" "Nó" "Nó" "Nó" "Nó" "Nó" "Nó" "Nó" "Nó" "Nó" "nên" "Nó" "Nó" "Nó" "Nó" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "nên" "n" "nên" "n"

**Type:** Learn
**Languages:** Python (stdlib, toy cold-start path simulator)
**前置要求：**Giai đoạn 17 · 02 (Thiết lý nền tảng thông tin), Giai đoạn 17 · 03 (GPU Autoscaling)
**Time:** ~60 minutes

## Học mục tiêu
- 列举五层缓解 khởi động lạnh, và nói ra một công cụ hoặc mô hình cho mỗi tầng.
- 将 70B model 的总冷启动时间 计算为 (định cấp nút) + ( trọng lượng tải xuống) + ( trọng lượng tải vào HBM) + (định động cơ) 之和。
- 解释为什么直播迁移 传输输输入代币(KB) thay vì KV cache(GB),以及代价是什么(recomputation)
- Nói ra bể nóng trade-off ((( vì không GPU 付费, hoặc chấp nhận đuôi bắt đầu lạnh), cũng như `min_workers > 0`变成 threshold SLA cần thiết.

## 问题
Các điểm cuối của LLM không máy chủ trong đêm đạt đến không.

1. Khả năng của Karpenter một nút GPU:45-60s
2. Container kéo một chiếc tải trọng của 30 GB hình ảnh:120-300s。
3. Động cơ sẽ tải trọng đến HBM:45-120s, phụ thuộc vào kích thước mô hình và tốc độ lưu trữ.
4. vLLM hoặc TRT-LLM 初始化 CUDA đồ thị  KV cache pool  Tokenizer:10-30s。

总计:220-510s(大约 3-8 分钟) 后才会返回一个代币――你的SLA是2s――你发出一个热池(`min_workers=1`), vấn đề dường như biến mất, nhưng bây giờ bạn đang phải trả tiền cho một GPU 24x7 không hoạt động. Nếu dịch vụ của bạn có 5 sản phẩm, mỗi sản phẩm có một bản sao ấm áp, đó là 5 × 24 × 30 = 3.600 giờ GPU / tháng, bất kể có người dùng nào đã sử dụng nó hay không.

Phong trào giảm lạnh là một phương pháp để giữ cho nền kinh tế không máy chủ trong khi tiếp cận với thời gian trễ luôn.

## 概念
### Lớp 1  预置节点镜像(Bottlerocket)

Trên AWS, kiến trúc hai khối lượng của Bottlerocket sẽ phân chia OS với dữ liệu. Sử dụng hình ảnh container đã được kéo trước để thực hiện snapshot đối với khối lượng dữ liệu.`EC2NodeClass`Trung引用 snapshot ID──nova node  khởi động khi trọng lượng  đã ở trên NVMe địa phương, bước 2 và bước 3 một phần sẽ biến mất── nó với Karpenter nguyên sinh配合──典型节省: mô hình lớn Mỗi lần bắt đầu lạnh 节省 2-4 分钟──

GCP 上的等价方案:带有预烤容器层的自定义VM图像──Azure 上:采用相同模式的管理磁盘快照──

### Lớp 2  dòng dòng dòng (Run:ai Model Streamer)

Không chờ tải tập tin hoàn chỉnh  hoàn toàn trả lời yêu cầu thứ nhất, mà thay vào đó từng tầng sẽ lưu lượng tải vào bộ nhớ GPU, và khối chuyển đổi đầu tiên 常驻后立即开始处理──NVIDIA Run:ai Model Streamer 在 vLLM 2026 中原生提供──支持 S3、GCS 和本地 NVMe──通过将 I/O với thiết lập máy tính 重叠, thời gian tải trọng của các mô hình lớn giảm khoảng một nửa──

### Lớp 3  GPU memory snapshots (Modal)

Modal trong lần đầu tiên tải 后 đối với trạng thái GPU(nhiệt độ, đồ thị CUDA, khu vực cache KV) làm điểm kiểm tra.

### Lớp 4  hồ bơi ấm (min_workers=1)

Ưu điểm đơn giản nhất: giữ một bản sao luôn sẵn sàng. Chi phí là tỷ lệ hàng giờ của một GPU 24x7. Đối với các mô hình nhỏ, hãy nói toán học này rất khắc nghiệt.$0.85-$1,50 để tránh bắt đầu lạnh 30s), đối với các mô hình lớn 则更友好(每小时支付 $4 để tránh 5 phút bắt đầu lạnh) ・ hồ nước ấm 变得必需 SLA ngưỡng: thường là 70B+ mô hình trên TTFT P99 < 60s。

### Lớp 5  Lưu trữ cấp độ (ServerlessLLM)

ServerlessLLM sẽ lưu trữ 视为一个层次:NVMe(快但大)、DRAM(中等但可分层)、HBM(小但即时) ・・・ trọng lượng 预先 tải đến DRAM;按需 tải đến HBM。Báo cáo 报告,相比无明磁盘-to-HBM, độ trễ của tải lạnh 降低 10-200x。

### Lớp 6  di chuyển trực tiếp (chương thức tiền thưởng)

Khi một nút nào đó không cần thiết khi đó, mô hình truyền thống là khởi động lạnh, mô hình khác không thoát hàng truy vấn.

### Các toán học hồ bơi ấm

Đối với dịch vụ P99 TTFT SLA 为 2s, vấn đề không phải là                                                                                                                                                                                                                                                     

- Các đường tương tác có giá trị cao ((thường trực tiếp trò chuyện、trợ lý giọng nói):`min_workers=1-2`
- Hướng dẫn lô đợt nền(sự phân loại hàng đêm): chấp nhận thang điểm đến không, có thể chịu đựng 5-10 phút bắt đầu lạnh。
- cấp cao: mỗi thuê nhà 使用 `min_workers`Và khả năng chuyên dụng.

### Đánh giá trước khi tối ưu hóa

全新节 上 70B mô hình của giải phẫu khởi động lạnh (ví dụ):

| Phase | Time | Mitigation |
|-------|------|-----------|
| Node provision | 50s | Bottlerocket + pre-seeded image, warm pool |
| Image pull | 180s | Pre-seeded data volume (eliminate) |
| Weights to HBM | 75s | Model streamer (halve); GPU snapshot (eliminate) |
| Engine init | 20s | Persistent CUDA graph cache |
| First forward | 3s | Min inherent latency |
| **Total cold** | **328s** | |
| **Total with mitigations** | **~15s** | 22x reduction |

### Những con số mà bạn nên nhớ

- Modal cold start: 2-4s ( Sử dụng ảnh chụp GPU)
- Baseten 默认 khởi động lạnh:5-10s; sử dụng trước khi nóng 时 sub-second。
- 70B bắt đầu lạnh: 3-8 phút.
- Run:ai Model Streamer: ~ 2x trọng lượng tải tăng tốc
- Loading:latency 降低 10-200x (năm giấy)


```figure
cold-start-pipeline
```

## Sử dụng nó
`code/main.py`Đối với các loại giảm thiểu của đường khởi động lạnh 建模── báo cáo tổng thời gian khởi động lạnh、 chi phí hồ bơi nóng, cũng như hồ bơi ấm 回本 cần thiết tỷ lệ yêu cầu break-even──

## 交付 nó
本课会产出 `outputs/skill-cold-start-planner.md` Đưa ra SLA、 quy mô mô và hình dạng giao thông, chọn để chồng chất các biện pháp giảm thiểu nào

## 练习
1. 运行 `code/main.py` tính toán tỷ lệ yêu cầu đồng đều: vượt quá tỷ lệ này, tỷ lệ yêu cầu nóng giảm vì SLO
2. Bạn triển khai một mô hình 13B, P99 TTFT SLA 为 3s.
3. Bottlerocket pre-seeding  đã loại bỏ ảnh kéo, nhưng trọng lượng vẫn cần từ tải snapshot đến HBM。 Nếu tốc độ đọc của NVMe hỗ trợ snapshot là 7 GB/s, tính toán 70B mô hình tường-thành-thành-thành.
4. Bạn của nhà cung cấp không máy chủ  cung cấp các snapshots GPU (đặc biệt là Modal), nhưng đội của bạn từ chối, lý do là các snapshots sẽ tiết lộ PII──论证 quan điểm của cả hai bên:现实风险是什么,减轻是什么?
5.  thiết kế một chính sách hồ bơi ấm cấp bậc: người dùng trả tiền, người dùng thử nghiệm và khối lượng công việc phân nhóm cần bao nhiêu bản sao ấm?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Cold start | “the big pause” | Fresh replica 上从 request 到 first token 的时间 |
| Warm pool | “always-on minimum” | `min_workers >= 1`，保持至少一个 replica ready |
| Pre-seeded image | “baked AMI” | Container weights 已预先常驻的 node image |
| Bottlerocket | “AWS node OS” | 支持 dual-volume snapshot 的 AWS container-optimized OS |
| Model streamer | “streaming load” | 将 weights I/O 与 compute setup 重叠 |
| GPU snapshot | “checkpoint to HBM” | 序列化 post-load GPU state；restart 时 deserialize |
| Tiered loading | “NVMe + DRAM + HBM” | Storage tiers 的 hierarchy；按需 load |
| Live migration | “move tokens” | 传输 input（KB），在 destination 上 recompute KV |
| `min_workers` | “warm replicas” | Serverless minimum keep-alive count |
| Scale-to-zero | “full serverless” | Idle 时无 cost；接受完整 cold-start tax |

## 延伸阅读
- [Modal — Cold start performance](https://modal.com/docs/guide/cold-start) Modal 发布的基准和检查点架构──
- [AWS Bottlerocket](https://github.com/bottlerocket-os/bottlerocket) mẫu chụp ảnh nhanh về khối lượng dữ liệu được gieo trước.
- [NVIDIA Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer) 将 trọng lượng tải với thiết lập tính toán 重叠──
- [Baseten — Cold-start mitigation](https://www.baseten.co/blog/cold-start-mitigation/) sách chơi trước khi ấm lên
- [ServerlessLLM paper (USENIX OSDI'24)](https://www.usenix.org/conference/osdi24/presentation/fu) Thiết kế tải hàng cấp 
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) phân bố các triển khai của di cư sống。
