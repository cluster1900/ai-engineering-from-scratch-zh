# Phòng song song hai ống

> DeepSeek-V3 sử dụng 2.048 张 H800 GPU  đào tạo, các chuyên gia MoE phân tán trên nhiều node. Biểu tượng giao tiếp toàn cầu của chuyên gia xuyên node. Mỗi 1 giờ GPU của các chuyên gia cần 1 giờ giao tiếp GPU. Các GPU có một nửa thời gian ở trong không gian.

**Type:** Learn
**Languages:** Python (stdlib, schedule simulator)
**Prerequisites:** Phase 10 · 05（distributed training、FSDP、DeepSpeed），Phase 10 · 14（open-model architectures 和 MoE）
**Time:** ~60 minutes

## Học mục tiêu
- Nói về bốn thành phần của bộ phận DualPipe về phía trước-lưng, và tại sao mỗi phần có cửa sổ chồng lên riêng của nó.
- 解释 bốc bong đường ống quy mô lớn  vấn đề, cũng như bốc bong  trong thực tế và trong ngữ cảnh tiếp thị 
- 手工跟踪 8 个 PP xếp hạng và 16 个 micro-batch của lịch trình DualPipe,并 xác nhận dòng chảy về phía trước và dòng chảy ngược sẽ điền vào các vị trí trống của nhau.
- Nói rõ DualPipeV(Sea AI Lab,2025) 取舍: 在 Expert Parallelism 不活时,以略大的泡为价格,掉掉2x 参数复制──

## 问题
Trong 2k H800 GPUs 上训练 671B MoE mô hình 会遇到三个 chồng lên nhau:

1. **内存压力。**Mỗi GPU có một phần mô hình. 8k, 61 lớp, 128 đầu.
2. **Pipeline bubbles。**传统管道平行性(GPipe、1F1B) sẽ khiến GPU chờ đợi bước đầu vào của nó hoặc Gradient 时处于空──8 个阶段.
3. **跨节点 all-to-all。**Sử dụng sự song song chuyên gia của MoE sẽ phân chia các chuyên gia thành nhiều node. Mỗi lần đi trước sẽ kích hoạt một lần tất cả mọi thứ, để gửi token đến các chuyên gia riêng lẻ, sau đó cũng sẽ kích hoạt một lần nữa tất cả mọi thứ.

Những vấn đề này có giải pháp riêng biệt: bộ nhớ sử dụng độ phân tích, bong bóng ống sử dụng Zero Bubble (Sea AI Lab, 2023)), tất cả mọi người sử dụng các hạt nhân truyền thông chuyên gia song song song. DualPipe làm việc để làm cho chúng hợp tác.

Kết quả báo cáo: Trong quá trình đào tạo của DeepSeek-V3, các bong bóng ống gần như bị loại bỏ, tỷ lệ sử dụng GPU vượt quá 95%.

## 概念
### Sự tương đồng đường ống dẫn 复习

Để phân chia một mô hình N-layer thành P 个设备上――设备`i` có các lớp `i * N/P .. (i+1) * N/P - 1`Một bộ vi-rút từ thiết bị 0 đến P-1  thực hiện về phía trước, sau đó từ P-1 đến 0  thực hiện về phía sau. Mỗi thiết bị chỉ có thể bắt đầu giai đoạn tiến bộ của mình sau khi một thiết bị trước gửi ra và phát ra.

GPipe(Huang et al., 2019) một lần điều chỉnh một micro-batch, sẽ lãng phí phần lớn thời gian của GPU.

DualPipe là bước tiếp theo.

### 思路 1: phân hủy mảnh

Mỗi phần phía trước được chia thành bốn phần:

- **Attention。**Q/K/V dự đoán Ưu tiên chú ý Ưu tiên đầu ra
- **All-to-all dispatch。**Đăng tín hiệu gửi cho các chuyên gia của họ.
- **MLP。**Chuyên gia về kinh tế quốc tế 计算――
- **All-to-all combine。**Để đưa ra các kết quả chuyên gia 带回来的跨节点通信.

Một phần ngược sẽ tham gia vào các phần này. Một phiên bản Gradient của DoublePipe sẽ điều chỉnh chúng, để tất cả các phần được chuyển đến tất cả các phần khác.

### 思路 2: lập trình hai chiều

Đại đa số các lịch trình đường ống từ giai đoạn 0 vào các lô vi mô,并流向 giai đoạn P-1──DualPipe từ hai đầu cùng lúc vào các lô vi mô――Phase 0 sẽ thấy các lô vi mô tiến phát triển từ đó; giai đoạn P-1 cũng sẽ thấy các lô vi mô tiến phát triển từ đó── hai dòng chảy trong giữa相遇──

Để đạt được điều này, thiết bị `i`必须同时 có lớp ống đầu tiên `i`和 lớp ống cuối `P - 1 - i`Đây là phần của DualPipe: mỗi thiết bị giữ lại hai lớp mô hình mà nó cần dịch vụ một cho mỗi hướng.

关键 là, dòng chảy về phía trước ở một hướng và dòng chảy ngược ở một hướng khác 会恰好在单向时间表 产生泡的位置重叠──泡消失──

### Một lịch trình được theo dõi bằng tay

考虑 P = 4 hàng, 8 micro-batch,分为 4 个 前进 / 4 个逆转――时间从左到右移动;行是设备级――

```
           Time →
rank 0:  F1 F2 F3 F4  F5R F6R F7R F8R  B1 B2 B3 B4  ...
rank 1:     F1 F2 F3  F4/F5R F6R F7R   B1 B2 ...
rank 2:        F1 F2  F3/F5R F4/F6R    B1 ...
rank 3:           F1  F2/F5R F3/F6R    ...
```

读取 F4/F5R 这种记法:rank 1 trong cùng một khoảng thời gian, đồng thời vận hành viễn biến 4 của phía trước trong đường ống giữa từ trái đến phải) và viễn biến 5 của viễn biến 5 của phía trước( từ phải đến trái)  Đó là 二方向 在操作层面的含义──

Trong giai đoạn ổn định giữa của lịch trình, mỗi bậc đều chạy về phía trước X hướng,并 với Y hướng trở lại 重叠――计算保持忙碌――计算前进传递的全向发送 隐藏在后面 计算中――all-to-all 结合 隐藏在前面 计算中――泡泡被挤出――

### Tài khoản bong bóng

标准 1F1B bong bóng đường ống ((( mỗi hạng 浪费的时间):

```
bubble_1F1B = (P - 1) * forward_chunk_time
```

Zero Bubble  cải tiến sẽ giảm nó, nhưng không thể giảm xuống 0. DualPipe Trong giai đoạn ổn định, nếu số lượng vi-batch có thể được tăng gấp đôi độ sâu đường ống 整除,就有零泡── ngoài giai đoạn ổn định, vẫn sẽ có một số bong bóng, nhưng nó sẽ không theo dõi số lượng vi-batch tăng lên, đây là chất lượng quan trọng của bài viết nhấn mạnh.

营销语境中: 泡无──技术语境中:泡不随微批数量增长──Sea AI Lab 的后续分析(DualPipeV / Cut-in-half) cho thấy, chỉ có một số lịch trình 妥协──

### DualPipeV  tinh chế

Sea AI Lab(2025) quan sát thấy, khi EP comm chồng chéo không phải là重点时,2x 参数复制是浪费的。 lịch trình DualPipeV của họ sẽ được nghiền dua chiều 折叠 vào một lịch trình hình V, trong một phần tử số lượng lớn trên hành trình。Bubble hơn DualPipe 略大, nhưng trong lưu trữ tiết省 rất đáng chú ý。DeepSeek trong việc triển khai DualPipe DualPipe mã nguồn của họ sử dụng DualPipeV như chế độ EP-off。

取舍如下:

| Feature | DualPipe | DualPipeV | 1F1B | Zero Bubble |
|---------|---------|-----------|------|------------|
| 每个设备的参数副本 | 2 | 1 | 1 | 1 |
| Bubble vs micro-batches | constant | small growth | grows | grows |
| Compute-comm overlap | full | partial | minimal | partial |
| Use when | EP-heavy MoE | dense or EP-light | baseline | any pipeline |

### Điều này có nghĩa là gì với 14.8T-token

Việc đào tạo trước của DeepSeek-V3 trên 2.048 张 H800 GPU đã tiêu thụ 14.8T token, khoảng 2.8M giờ GPU. Nếu sử dụng đơn giản 1F1B, họ sẽ bị mất từ bong bóng đường ống dẫn trong đó 12-15%, tức là 340-420K giờ GPU, đủ để đào tạo một mô hình 70B hoàn chỉnh. DualPipe đã nhận được phần lớn trong số đó. Không có nhật ký nội bộ, rất khó để định lượng trực tiếp đóng góp của nó, nhưng tuyên bố trong bài viết là đào tạo trung bình GPU sử dụng hơn 95%.

Đối với các hoạt động quy mô nhỏ hơn (< 1k GPU), DualPipe có một số bong bóng ống hơn so với tổng chi phí nhỏ hơn, và đào tạo mô hình dày đặc hơn rất ít. Đối với hàng ngàn GPU quy mô biên giới đào tạo MoE, nó thực sự là cần thiết.

### Nó nằm trong đống.

- Với**FSDP**(Phase 10 · 05)互补──FSDP sẽ phân chia các tham số mô hình chia thành hàng;DualPipe 调度 hàng;上的计算──二者可以结合──
- Với**ZeRO-3**gradient sharding 兼容──两份副本复制的会计管理 需要与 ZeRO 的 sharded gradients 配合──
- 需要针对具体集群拓学 调优的 **custom all-to-all kernels**❖ Các lõi nguồn mở của DeepSeek là một sự tham khảo để thực hiện.


```figure
expert-capacity
```

## Sử dụng nó
`code/main.py`Đó là một mô phỏng lịch trình đường ống.`(P, n_micro_batches, schedule)`,并印 1F1B、Zero Bubble、DualPipe 和 DualPipeV sử dụng giai đoạn ổn định riêng lẻ. Nó là một công cụ giảng dạy: số liệu và các đề xuất định tính trong bài luận phù hợp, nhưng không phải là tuyên bố về việc tăng tốc thực nghiệm sản xuất.

Giá trị của mô phỏng này là: sử dụng các số P và micro-batch khác nhau, chạy nó, xem phân tích bong bóng của 1F1B tăng trưởng như thế nào, trong khi DualPipe không.

Thực sự tập luyện hoạt động tập hợp:

- 选择一个能被你的微批数 整除的管道-parallel depth──
- 确保你的专家-parallel mesh 支持双向的所有至所有――DeepSeek 的核心是参考――
- Lần đầu tiên thực hiện, dự kiến sẽ theo lịch trình 本身上花一周调试时间──簿记很繁──
-  giám sát tỷ lệ sử dụng GPU của mỗi cấp bậc, không chỉ là tỷ lệ sử dụng tổng thể.

## 交付 nó
本课会生成 `outputs/skill-dualpipe-planner.md` Đưa ra một cụm tập huấn đặc điểm: GPU số lượng, topology, interconnect, model shape), nó sẽ đề xuất chiến lược song song đường đường ống, ứng dụng thuật toán lập lịch, cũng như dự kiến khối lượng bong bóng dưới quy mô mục tiêu.

## 练习
1. Trong `(P=8, micro_batches=16, schedule=dualpipe)`和 `(P=8, micro_batches=16, schedule=1f1b)`上运行 `code/main.py`△ tính toán GPU sử dụng 差异,并将其表示为每百万训练代币回收的 GPU-hours──

2. 手工绘画 `(P=4, micro_batches=8, schedule=dualpipe)`Đồ lịch của bảng. Sử dụng thẻ số micro-batch và hướng đánh dấu mỗi khe thời gian. Tìm ra khe thời gian đầu tiên không có bong bóng.

3. 阅读 DeepSeek-V3 báo cáo kỹ thuật ((arXiv:2412.19437) của Hình 5。 tìm ra DualPipe phía trước phần trong tất cả đến tất cả các giao dịch của cửa sổ chồng chéo。 giải thích lịch trình tính toán 如何隐藏它──

4. 计算 DualPipe đối với một P=8 giai đoạn đường ống 70B mật độ, cũng như một P=16 giai đoạn đường ống 671B MoE mô hình 2x 参数开销.

5. 将 DualPipe với Chimera (một trình lập kế hoạch hai chiều cạnh tranh trong năm 2021) để so sánh.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Pipeline bubble | “每个 rank 的空闲时间” | pipeline stage 等待其输入或 Gradient 时浪费的 GPU cycles |
| 1F1B | “默认 pipeline schedule” | one forward / one backward 交错调度；DualPipe 击败的 baseline |
| Zero Bubble | “Sea AI Lab 2023” | 将 backward 拆成 B（input Gradient）和 W（weight Gradient）；几乎完全收紧 pipeline |
| DualPipe | “DeepSeek-V3 schedule” | bidirectional pipeline + compute-comm overlap；bubbles 不随 micro-batch count 增长 |
| DualPipeV | “Cut-in-half” | V-shape 改进版，以略大的 bubbles 为代价去掉 2x 参数复制 |
| Chunk | “pipeline work 的单位” | 一个 micro-batch 通过一个 pipeline stage 的 forward 或 backward pass |
| All-to-all dispatch | “把 tokens 发送给 experts” | 将 tokens 路由到其分配的 MoE experts 的跨节点通信 |
| All-to-all combine | “把 expert outputs 带回来” | MLP 之后收集 expert outputs 的跨节点通信 |
| Expert Parallelism (EP) | “Experts across GPUs” | 将 MoE experts 分片到 ranks 上，使不同 GPUs 持有不同 experts |
| Pipeline Parallelism (PP) | “Layers across GPUs” | 将 model layers 分片到 ranks 上；DualPipe 调度的维度 |
| Bubble fraction | “浪费的 GPU 时间” | (bubble_time / total_time)；DualPipe 推向零的比例 |

## 延伸阅读
- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437), Section 3.3.2 and Figure 5](https://arxiv.org/abs/2412.19437) 主要 DualPipe 参考资料
- [DeepSeek — DualPipe GitHub repository](https://github.com/deepseek-ai/DualPipe) thực hiện tham chiếu nguồn mở, bao gồm DualPipeV(Cut-in-half) mode
- [Qi et al. — Zero Bubble Pipeline Parallelism (arXiv:2401.10241, Sea AI Lab 2023)](https://arxiv.org/abs/2401.10241) Zero Bubble 前身
- [Sea AI Lab — DualPipe could be better without the Dual](https://sail.sea.com/blog/articles/63)  ảnh hưởng đến chế độ tắt EP của DeepSeek DualPipeV  phân tích
- [Narayanan et al. — PipeDream / 1F1B (arXiv:1806.03377, 2018-2021)](https://arxiv.org/abs/1806.03377) DualPipe đối với lịch trình 1F1B
- [Huang et al. — GPipe (arXiv:1811.06965, 2018)](https://arxiv.org/abs/1811.06965) Sự tương đồng đường ống nguyên thủy 论文和泡泡 问题
