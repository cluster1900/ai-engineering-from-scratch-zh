# Phân tích đường ống và khí

> 张量并行性将矩阵乘法跨级分化――管道并行性将模型跨级分化,每个级分一阶段――微批流经管道――开始和结束的空时间就是泡;最小化它是整个过程――

**Type:** Build
**Languages:** Python
**Prerequisites:** 第 19 期 Track C 课程 42-49
**Time:** ~90 分钟

## Học mục tiêu

- Để phân chia mô hình thứ tự thành N 个阶段,并模拟跨 N 个阶级的前向管道.
- Sử dụng GPipe 计划通过管道安排 M 个微批次( chỉ hướng trước điền, rồi hướng sau)并计算气泡分数──
- Để so sánh thời gian sử dụng của 1F1B với Megatron-LM và PipeDream
- Bảo vệ phân bố giai đoạn: số lượng các tham số của từng giai đoạn tương tự được tính toán quan trọng hơn so với từng giai đoạn tương tự.

## 问题

Mô hình số 70B trong fp16 chỉ cần số 140 GB. Không có GPU nào có thể hỗ trợ nó. ZeRO-3 跨级分片参数, nhưng vẫn cần mỗi cấp độ cho mỗi bước chuyển tiếp thu thập toàn bộ tầng, mỗi cấp thanh toán log ((N) 跳.

气泡是管道开始时(等第一微批到最后阶段) 和结束时(等最后微批回流) 的空时间──对于M 个微批和N 个阶段,每阶段的气泡分数为 (N-1) /(M+N-1)──当M=8、N=4时,即 27%──当M=64、N=4时,为4.5%──当M=64、N=4时,为4.5%──当每阶段有很多微批时,气泡就会缩小,这意味着每个微批的批量大小较小,驱动器批量设计的约.

## 概念

```mermaid
flowchart LR
  R0[rank 0: stage 0 / layer 0] --> R1[rank 1: stage 1 / layer 1]
  R1 --> R2[rank 2: stage 2 / layer 2]
  R2 --> R3[rank 3: stage 3 / loss]
  R3 -.backward.-> R2
  R2 -.backward.-> R1
  R1 -.backward.-> R0
```

### GPipe 时间表

Trước khi bắt đầu bất kỳ hoạt động nào sau, hãy sử dụng tất cả các M 个微批次向前填管; sau đó ngược ngược倒流. Mỗi khối nhỏ của hoạt động phải được giữ lại phía sau, do đó内存 phải tăng lên theo M 线性.

### 1F1B 时间表

交错: một khi các lô nhỏ tiến tới giai đoạn cuối cùng, hãy bắt đầu chuyển tiếp và để nó chảy lại. Thời gian biểu mỗi giai đoạn chuyển đổi một lần tiến vào và một lần trở lại.

### Tại sao tính toán bình đẳng của mỗi giai đoạn là quan trọng

Nếu giai đoạn 0 cần 50 ms, giai đoạn 1 cần 100 ms, thì mỗi chu kỳ đều ở giai đoạn 1 上门控―― khác giai đoạn mỗi chu kỳ trống 50 ms, chờ giai đoạn 1 释放―― số lượng các tham số tương tự là sai axis:Transformer tính toán chủ yếu do sự chú ý cộng với mỗi tầng MLP chủ yếu, trong khi nhúng tầng có nhiều tham số nhưng số lượng tính toán rất ít―― phân phối giai đoạn nên cân bằng mỗi giai đoạn FLOP, chứ không phải là trọng lượng của mỗi giai đoạn.

###  Số lượng nhỏ và số lượng lớn

管道运行 M 个微批次,每个微批次的大小为 B。有效批量大小为 M*B。管道步骤结束时的梯度是组合 M*B示例的梯度。气泡分数取决于 M;优化器看到的是 M*B。调整 M nghĩa là sẽ泡(M 值较低) 与每微批次内存(GPipe 的激活内存值较高,M 值较高)进行交易。


```figure
cd-pipeline-bubble
```

##  xây dựng nó

`code/main.py`实现:

- `PipelineStage`: một nhỏ `nn.Module`, lưu giữ các tham số của một giai đoạn và mở`forward(activation)`
- `Pipeline(stages, num_microbatches)`: sử dụng từng giai đoạn của mô hình treo clock trong mô hình giai đoạn lên sắp xếp GPipe  thời gian biểu。
- `bubble_fraction(num_stages, num_microbatches)`:闭合形式(N-1) /(M+N-1)
- 4 阶段演示, in mỗi khối nhỏ của dấu hiệu và số lượng của các khối lượng khí

运行 nó:

```bash
python3 code/main.py
```

输出: từng lớp nhỏ của các khối lượng gạch và so với kết thúc dự đoán của các bong bóng phần trăm.

## 野外生产模式

三种模式使 đường ống làm cứng bằng để đủ vận chuyển.

**激活检查点与管道配对。**Khi GPipe lên chạy M 个微批次, kích hoạt bộ nhớ là một bộ nhớ nhỏ M 倍次.

**阶段平衡是测量出来的，而不是假设的。**生产团队运行一个分析过程,测量目标硬件上的实际每层计算(FLOP 和挂钟), sau đó dựa trên kết quả đo lường được phân chia.`--num-layers-per-stage`标志 chấp nhận một danh sách, để cho phép tính toán các tầng không đồng đều trong giai đoạn có chi phí từng tầng khác nhau.

**发送-接收调度必须避免死锁。**Mỗi giai đoạn đều trên đường trực tuyến nhận chết trước khi khóa ống gửi.

## Sử dụng nó

生产模式:

- **Megatron-LM。**Khán giả: Phân tích của các đường ống quy mô lớn.
- **DeepSpeed Pipeline。**Với ZeRO 集成; ZeRO-1 + 管道 là tập hợp thường xuyên lớn nhất của mô hình mở.
- **PyTorch Pipe。**PyTorch 原生管道包装器, dựa trên `torch.distributed.pipeline.sync.Pipe`构建:

## 发货

Chương 80 课将每阶段参数分片存储在分片检查点中. 第 81 课在端到端演示中组成 DDP + ZeRO + 管道.

## 练习

1. 实现 1F1B并验证气泡分数与GPipe 匹配, nhưng kích hoạt内存有限──
2. Trong mô hình sâu hơn, phân tích từng giai đoạn thời gian thực tế, và qua các giai đoạn cân bằng lại của phép đo.
3. Thêm các khối nhỏ của các khối trên ống dẫn tích lũy và kiểm tra xem liệu các khối tương đương với các khối trước hay không.
4. Phụ hợp ống với điểm kiểm tra hoạt động, và đo lường sự giảm lưu trữ và chi phí tính toán.
5. Để kết hợp các ống với DDP (các cấp độ của mỗi ống được sao chép trong tập hợp dữ liệu) và được tiến hành điều chỉnh 2D.

## 关键术语

|术语 |人们怎么说|它实际上意味着什么 |
|------|----------------|------------------------|
|管道| “模型沿深度平行” |每个等级一个阶段，激活逐级流动|
|泡泡| “管道空闲时间”|开始+结束时的 (N-1) 个步骤，其中某些阶段没有工作 |
|微批次| “批次切片”|前进/后退各1个；随着 M 的增大，气泡会缩小 |
| G管道| “填充然后排水” |所有 M 都在任何后退之前前进；高激活记忆|
| 1F1B | “交错时间表” |每级一前一后；有界激活记忆|

## 进一步阅读

- [Huang 等人，GPipe：巨型神经网络的高效训练](https://arxiv.org/abs/1811.06965)
- [Narayanan 等人，PipeDream：DNN 训练的广义管道并行性](https://arxiv.org/abs/1806.03377)
- [Megatron-LM 管道并行文档](https://github.com/NVIDIA/Megatron-LM)
- 第19阶段 第76课 - 调度 sử dụng của gửi/ nhận ngôn ngữ gốc
- 第19 阶段 第78 课 - ZeRO hợp tác với các đường ống và thường xuyên
