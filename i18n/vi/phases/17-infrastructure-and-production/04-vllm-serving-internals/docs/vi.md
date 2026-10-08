# vLLM Serving Internals:PagedAttention、Continuous Batching、Chấp đầy trước

> vLLM trong năm 2026 chiếm ưu thế phụ thuộc vào ba thiết lập mặc định chồng lên nhau, chứ không phải một kỹ thuật đơn lẻ. PagedAttention 始终开启.`code/main.py`Một trong những đồ chơi liên tục batcher kết thúc, nó sẽ giống như vLLM một cách điều chỉnh prefill và decode.

**Type:** Learn
**Languages:** Python (stdlib, toy continuous batching scheduler)
**前置要求：**Giai đoạn 17 · 01 (Mô hình phục vụ), Giai đoạn 11 (Kỹ thuật LLM)
**Time:** ~75 minutes

## Học mục tiêu
- 将 PagedAttention  giải thích cho KV cache phân bổ: khối, bảng khối, và tại sao phân mảnh trong sản xuất tải xuống giữ ở mức 4% dưới đây:
- Trong cấp độ lặp lại vẽ liên tục batching: hoàn thành các chuỗi  làm thế nào để rời khỏi hàng, các chuỗi mới  làm thế nào để gia nhập, không cần phải thoát khỏi.
- 用一句话描述 chunked prefill,并说出它 bảo vệ là 哪个延迟度度提示:是 TTFT tail,而不是平均吞吐量)
- Nói ra năm 2026 vLLM v0.18.0 sẽ ảnh hưởng đến những lần một lần kích hoạt tất cả các nhóm tối ưu hóa của Gotcha.

## 问题
朴素的 PyTorch serve loop 一次运行一个请求:tokenize、prefill、decode 直到 EOS、返回。 Một người dùng có thời gian này có thể làm việc。 Một trăm người dùng có thời gian, nó là một nhóm người chờ đợi kiên nhẫn。 rõ ràng cách sửa chữa là đóng gói tĩnh, nhưng nó sẽ đưa mỗi yêu cầu trong cửa sổ vào thời gian nhất, đưa mỗi lần đóng gói giải mã vào thời gian nhất dự kiến xuất, và để toàn bộ bộ bộ lô bởi chuỗi chậm nhất và bị trì hoãn。 bạn phải trả giá cho các gói đóng gói chưa từng được sử dụng, yêu cầu nhanh cũng phải chờ đợi các yêu cầu chậm hơn。

vLLM 同时解决三个问题──PagedAttention 阻止KV cache 碎片化像经典连续分配那样吃掉 60-80% của bộ nhớ GPU──Continuous batching 允许请求在每次解码反复中中加入和离开批次,因此批次始终充满真实工作──Chunked prefill 32 将k-token prompt 拆成约512-token 的片片,并与解码交错执行,因此长速不结会 GPU 上的每个解码代码代码符号──

Các nhà sản xuất tiêu chuẩn năm 2026 là 3 người tất cả đã bắt đầu. Bạn cần phải hiểu được tác dụng của mỗi cơ chế, bởi vì các mô hình thất bại đều ở trên lịch trình, không phải trên mô hình.

## 概念
### PagedAttention  như một hệ thống lưu trữ ảo

KV cache cho mỗi chuỗi để nói là `num_layers × 2 × num_heads × head_dim × seq_len × bytes_per_element`Đối với 8192 token của Llama 3.3 70B, trong BF16 dưới mỗi chuỗi 约为 1.25 GB. Nếu bạn dành cho mỗi yêu cầu 预留 8192 槽, nhưng yêu cầu trung bình chỉ sử dụng 1500 token, thì bạn sẽ lãng phí khoảng 82% của HBM đã được đặt sẵn.

PagedAttention 借鉴 OS ảo bộ nhớ của ý tưởng. KV cache không theo chuỗi. Nó được cố định kích thước khối chia sẻ.

碎片化 từ 60-80% (经典方式) giảm xuống 4% 以下(PagedAttention) ―― bạn sẽ không qua một lá cờ nào đó 启用 PagedAttention, nó là phân bổ duy nhất vLLM  cung cấp。可调控是`--gpu-memory-utilization`(默认 0.9), nó nói vLLM trong tải trọng và kích hoạt sau, cho các khối KV 预留多少HBM。

### lặp đi lặp lại 层面的 liên tục đợt đợt

旧式 dynamic batching 会等一个窗口(例如10 ms) để lấp đầy hàng, sau đó运行 prefill + decode + decode + decode, cho đến khi mỗi chuỗi 完成──快序列 会提前离开并置,而 GPU 继续处理缓慢序列──

Lưu tập liên tục trong mỗi bước giải mã 之间运行──把正在运行的序列 集合称为 `RUNNING`danh sách:

1. `RUNNING`Trong bất kỳ chuỗi nào đạt đến EOS hoặc max_tokens đều sẽ được di chuyển.
2. Scheduler 查看 chờ đợi xếp hàng. Nếu có các khối KV trống, nó sẽ nhận được các chuỗi mới.
3. đi trước trong hiện tại`RUNNING`Trong nội dung trên chạy, cho mỗi chuỗi  phát hành một token mới.

Kích thước lô 永远不会被填到固定数字──输出位置不同序列 共享一次融合前面── 在 2026 年的 vLLM 中,这叫做`V1 scheduler`❖ Key Invariant: Scheduler Mỗi lần giải mã lặp đi lặp lại 运行一次, thay vì mỗi yêu cầu 运行一次。

### Prefill trọn vẹn  bảo vệ đuôi TTFT

Prefill là tính toán-binded của──Llama 3.3 70B trên 32k-token prompt trong đơn张 H100 上需要约800 ms的纯预fill──prefill 运行时,batch trong tất cả các chuỗi khác của mã hóa mã hóa mã hóa đều đang chờ đợi── trong vòng bán chạy, một长提示的第一代令延迟(TTFT) sẽ trở thành vài chục người dùng khác của các giao thức mã hóa latency(ITL) 动──

Chunked prefill sẽ prefill  phân chia thành các khối cố định lớn ((默认 512 token),并以 chunk 为单位调度──chunk 之间, lập trình viên có thể cho phép giải mã các chuỗi 前进一个 token──你用少量绝对的预填延迟 增量(每块 几 ms) để thay đổi cho thấy thấp hơn rõ ràng decode-time jitter── 在已发布的基准中, P99 ITL dưới khối lượng hỗn hợp từ khoảng 50 ms 降至 khoảng 15 ms──

### 三个默认设置会相互作用

Những chức năng này đều giả định tồn tại lẫn nhau. PageedAttention là lập trình viên cung cấp một nguồn KV nhỏ để cân nhắc.`RUNNING`Định nghĩa của việc làm, đó là chính sách lập kế hoạch khác, chứ không phải hệ thống độc lập.

Bạn không cần biết mỗi cờ. Bạn cần biết lịch trình.

### 2026 năm v0.18.0 của Gotcha

Trong vLLM v0.18.0, bạn không thể sẽ `--enable-chunked-prefill`Với dự thảo mô hình giải mã đầu cơ`--speculative-model`(v) kết hợp sử dụng. Ước tính của tài liệu là ngoại lệ trong lập trình viên V1 trong mã hóa GPU dự đoán N-gram. Những ghi chú không đọc được về việc mở tất cả các bản phát hành cờ, sẽ gặp lỗi thời gian chạy khi khởi động, chứ không phải sự hồi quy mềm. Nếu dự đoán của bạn Ước tính được kích hoạt prefill phân mảnh, thì hãy xem lại chọn lựa: Câu trả lời chính xác năm 2016 thường là EAGLE-3 且 không sử dụng prefill phân mảnh, thay vì mô hình dự thảo và không thể biên dịch được prefill phân mảnh.

### Bạn nên nhớ số

- Llama 3.3 70B FP8,H100 SXM5,128 并发,三者全开:2,200-2,400 tok/s。
- Đồng mô hình,默认 vLLM ((( không prefill cục): ~ 1,800 tok/s。
- Tương tự mô hình, đơn giản PyTorch vòng đi trước: ~600 tok/s。
- 生产负载下 PagedAttention 的 KV 碎片化浪费:<4%──
- 混合负载下 P99 ITL: sử dụng prefill 时 ~15 ms,不使用时 ~50 ms。

### biểu đồ của scheduler

```
while True:
    finished = [s for s in RUNNING if s.is_done()]
    for s in finished: release_blocks(s); RUNNING.remove(s)

    while WAITING and have_free_blocks_for(WAITING[0]):
        s = WAITING.pop(0)
        allocate_initial_blocks(s)
        RUNNING.append(s)

    # schedule prefill chunks + decode in one batch
    batch = []
    for s in RUNNING:
        if s.in_prefill:
            batch.append(next_prefill_chunk(s))   # e.g. 512 tokens
        else:
            batch.append(decode_one_token(s))     # 1 token

    run_forward(batch)                            # one fused GPU call
```

`code/main.py`正是这个循环的 stdlib Python 版本,使用假的代币数 和假的前延迟――运行它 sẽ hiển thị prefill 如何在长 prefill 期间让解码序列保持活跃――


```figure
tensor-parallel
```

## Sử dụng nó
`code/main.py`模拟一个vLLM风格的调度器,并带有可切换功能──运行它 có thể xem:

- `NAIVE`Chế độ: một lần một yêu cầu, không có lô.
- `STATIC`Mode:padding 并等待, cổ điển batching.
- `CONTINUOUS`Mode:iteration 级别的录取和释放──
- `CONTINUOUS + CHUNKED`mode:prefill 切片与 dekode 交错。

输出会展示总吞吐量(tokens per virtual second) 、TTFT mean 和 P99 ITL。`CONTINUOUS + CHUNKED`Đây là một dòng trong lưu lượng hỗn hợp nên chiếm ưu thế.

## 交付 nó
本课会生成 `outputs/skill-vllm-scheduler-reader.md` Đưa ra một cấu hình dịch vụ: kích thước lô, sử dụng bộ nhớ KV, kích thước prefill phân mảnh, cấu hình dự đoán, nó sẽ tạo ra một chẩn đoán lập trình, chỉ ra ba cài đặt cố định nào đang trở thành một chai, cũng như nên điều chỉnh gì.

## 练习
1. 运行 `code/main.py`◊ trong bao gồm các yêu cầu ngắn và yêu cầu dài của khối lượng công việc hỗn hợp 上比较 `STATIC`Với`CONTINUOUS`◊throughput 差距来自哪里, là hiệu quả prefill ‧ hiệu quả decode ‧ hay latency đuôi?
2. 修改 game scheduler này, thêm `--max-num-batched-tokens`△ Đối với vận hành Llama 3.3 70B FP8 của H100,正确取值是多少?
3. 重新阅读 vLLM v0.18.0 phát hành ghi chú.
4. 针对 1,000 个请求的追踪 计算 KV cache 碎片化浪费,平均 1,500 output token,std 600 token,分别在以下条件下:(a) 以 8192 max 进行连续每请求分配,(b) 使用16 token blocks 的 PagedAttention。
5. 用一段话 giải thích tại sao việc làm trước bằng phông có tác dụng với P99 ITL, nhưng đơn độc không tăng thông qua.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| PagedAttention | “KV trick” | 用于 KV cache 的固定大小 block allocator；碎片化 <4% |
| Block table | “page table” | 每个 sequence 从 logical token position 到 physical KV block 的映射 |
| Continuous batching | “dynamic batching, but right” | 每个 decode iteration 都做 admit/release 决策 |
| Chunked prefill | “prefill splitting” | 将长 prefill 拆成 512-token 切片并与 decode 交错 |
| TTFT | “first token time” | Prefill + queue + network；在长 prompts 下由 prefill 主导 |
| ITL | “inter-token latency” | 连续 decode tokens 之间的时间；由 batch size 主导 |
| Goodput | “满足 SLO 的 throughput” | 每个 request 仍命中 TTFT 和 ITL targets 时的 tokens/sec |
| V1 scheduler | “new scheduler” | vLLM 的 2026 scheduler；N-gram spec decode 是与 chunked-prefill 兼容的路径 |
| `--gpu-memory-utilization` | “memory knob” | 在 weights 和 activations 之后为 KV blocks 预留的 HBM 比例 |

## 延伸阅读
- [vLLM documentation — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode/) 关于 碎片预填与 猜测解码 兼容性的官方来源──
- [vLLM Release Notes (NVIDIA)](https://docs.nvidia.com/deeplearning/frameworks/vllm-release-notes/index.html) 2026 phát hành thời gian và các phiên bản cụ thể hành vi.
- [vLLM Blog — PagedAttention](https://blog.vllm.ai/2023/06/20/vllm.html) 仍然定义如何理解分配器的原始文章──
- [PagedAttention paper (arXiv:2309.06180)](https://arxiv.org/abs/2309.06180) 碎片化分析与安排设计──
- [Aleksa Gordic — Inside vLLM](https://www.aleksagordic.com/blog/vllm) 带有火焰图的详细 V1 lịch trình viên đi bộ qua。
