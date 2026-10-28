# Hành ống song song với bong bóng 分析

> Sự tương đồng tensor Đặt矩阵乘法切到多级上――Pipeline parallelism Đặt mô hình切到多级上,每个级 一阶――Microbatch 流过管道――首尾的空时间就是泡;把它压下去,就是整门手艺――

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 19 Track C lessons 42-49
**Time:** ~90 分钟

## Học mục tiêu

- Đặt một mô hình thứ tự tháo thành N 个 giai đoạn, và xếp hạng N 个 上模拟前线.
- G Pipe 调度(先只做前满,再倒) để M 个微洗管 过管,并计算泡 比如──
- Với Megatron-LM、PipeDream 使用的交错 1F1B 调度比较泡──
- Phương trình phân chia: mỗi giai đoạn 算力相等, quan trọng hơn mỗi giai đoạn 参数相等.

## 问题

Fp16 下的 70B 参数模型,光参数需要140GB──没有任何消费级 GPU 装下──ZeRO-3 会将参数分片分分到各级别,但每一步前进 仍要让每个级别都聚集 完整一层,每层付出$\log(N)$跳──管道平行 换一条路:把模型切成 N 个阶段,每个阶段 放一个── Lớp 1 的前进 在阶段 0 做完,把激活张量交给阶段 1;排列 1 跑层 2 再交给阶段 2;以此类推── 逆向流回──内存近似线性下降,因为每个阶段只有一阶段;计算是串行的,这就是泡泡 问题──

Bubble là đường ống 开头的空(等第一个微batch到最后阶段) 和结尾的空(等最后一个微batch 回抽) ⋅M个微batch、N个阶段 时,每个阶段的泡,例如是$(N-1)/(M+N-1)$M=8、N=4 时是27%; M=64、N=4 时是4.5%── mỗi bước của microbatch 越多,bubble 越小, điều này có nghĩa là kích thước lô của mỗi microbatch 更小

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

### GPipe 调度

Trước tiên sử dụng tất cả M 个 microbatch Đặt đường ống dẫn phía trước 填满, bắt đầu lại bất cứ trở lại nào; sau đó ngược về排空。 mỗi microbatch hoạt động phải ở lại phía sau, vì vậy内存 theo M 线性增长。 Trước chiếm M+N-1 个周期, ngược lại tái chiếm M+N-1 个个 contribution.$(N-1)/(M+N-1)$◊把M 取得远大于N,就能把泡藏起来――

### 1F1B 调度

交错: một microbatch tiến một đến giai đoạn cuối cùng, ngay lập tức bắt đầu nó trở lại và làm cho nó chảy lại. Mỗi giai đoạn thay đổi một lần tiến lại.

### Tại sao mỗi giai đoạn 算力等等 là quan trọng

Nếu giai đoạn 0 cần 50 ms, giai đoạn 1 cần 100 ms, mỗi chu kỳ đều sẽ được đặt trong giai đoạn 1 上。 giai đoạn khác Mỗi chu kỳ không gian như 50 ms, như giai đoạn 1 放行。

### Microbatch và batch

Đường ống chạy M 个、 mỗi microbatch của B ⋅ kích thước lô hiệu quả là $M \cdot B$Một bước đường ống kết thúc của thang, là đối với hợp hợp sau$M \cdot B$个样本的梯度──Bubble 比例取决于M;优化器看的是$M \cdot B$△调 M,就是在泡 (M) △大则更低) 与每微包内存 (GPipe 下 M) △大则激活内存更高) △权衡

```figure
cd-pipeline-bubble
```

##  xây dựng nó

`code/main.py`实现:

- `PipelineStage`Một cái nhỏ`nn.Module`, có một giai đoạn của các tham số,并暴露 `forward(activation)`
- `Pipeline(stages, num_microbatches)`Trong giai đoạn hình ảnh, sử dụng từng giai đoạn của hình ảnh hình ảnh.
- `bubble_fraction(num_stages, num_microbatches)`: closed式公式 $(N-1)/(M+N-1)$
- Một 4 giai đoạn: Bức in theo quỹ đạo của microbatch, cũng như các bong bóng được đo lường ví dụ:

运行:

```bash
python3 code/main.py
```

输出: theo giai đoạn×microbatch của Gantt 图, cũng như tương đối với các dự đoán đóng cửa bong bóng 百分比──

## Thực hành trong môi trường sản xuất

Ba mô hình có thể làm cho đường ống thoả thuận cứng đến mức độ có thể lên đường.

**Activation checkpointing 与 pipeline 搭配。**GPipe 上有 M 个微包 在飞时,激活内存是单个微包的 M 倍──Activation checkpointing 在后期 时重算前期,使用算力换内存;两者结合,长序列上的管道才可行──

**Stage 均衡靠测量，不靠假设。**Các nhóm sản xuất sẽ chạy một vòng hồ sơ trước, kiểm tra trên các thiết bị mục tiêu thực tế trên mỗi tầng tính năng (FLOPs và tường钟), tái theo kết quả đo lường phân vùng.`--num-layers-per-stage` chấp nhận danh sách, để từng giai đoạn sử dụng không đồng đều số lượng các tầng mỗi tầng chi phí khác nhau

**Send/recv 调度必须避免死锁。**Nếu mỗi giai đoạn đều gửi lại lại, trên đường sẽ chết khóa.

## Sử dụng nó

生产中的使用法:

- **Megatron-LM。**Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý: Lưu ý:: Lưu ý::::::::::: Lưu ý::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
- **DeepSpeed Pipeline。**Với ZeRO 集成; ZeRO-1 + đường ống là một trong những mô hình mở lớn nhất.
- **PyTorch Pipe。**PyTorch nguyên sinh ống 包装, dựa trên `torch.distributed.pipeline.sync.Pipe`

## 交付 nó

Chương 80 课把每个阶段的参数分片存进分片检查点――第 81 课在端到端演示里组合 DDP + ZeRO + đường ống 精神 ();

## 练习

1. 实现 1F1B, chứng minh bong bóng 比例与GPipe 一致,但激活内存有上界──
2. Trong mô hình sâu hơn, phân tích thực tại từng giai đoạn thời gian, và theo các bước tái cân bằng của bức tường.
3. 跨管道微包做梯度累积,检查梯度等等等价全批前的梯度──
4. 给管道 配上激活检查点,测量内存下降与算力代价――
5. Đặt đường ống với DDP 结合( mỗi đường ống xếp hạng trong dữ liệu song song 组中复制),并推理二维调度──

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| Pipeline | “沿深度的模型并行” | 每个 rank 一个 stage，激活逐 stage 流动 |
| Bubble | “Pipeline 空闲时间” | 首尾各 (N-1) 步，部分 stage 没有工作 |
| Microbatch | “Batch 的切片” | 一次 forward/backward 单元；M 增大则 bubble 缩小 |
| GPipe | “先填满再排空” | M 次 forward 全部完成后再 backward；激活内存高 |
| 1F1B | “交错调度” | 每 stage 一次 forward 一次 backward；激活内存有界 |

## 延伸阅读

- [Huang et al, GPipe: Efficient Training of Giant Neural Networks](https://arxiv.org/abs/1811.06965)
- [Narayanan et al, PipeDream: Generalized Pipeline Parallelism for DNN Training](https://arxiv.org/abs/1806.03377)
- [Megatron-LM pipeline parallel docs](https://github.com/NVIDIA/Megatron-LM)
- Giai đoạn 19 Bài học 76 - các nguyên tắc gửi/tháo lại lịch sử sử dụng
- Giai đoạn 19 Bài học 78 - ZeRO là thẳng thắn với đường ống và thường được kết hợp
