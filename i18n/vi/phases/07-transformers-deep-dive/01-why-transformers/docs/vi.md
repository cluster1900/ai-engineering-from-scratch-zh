# Tại sao Transformers  RNNs vấn đề

> RNN một lần xử lý một Token. Transformers một lần xử lý tất cả các Token.

**类型：**Học tập
**语言：**Python
**先修要求：**Giai đoạn 3 (Thấu trúc học sâu), Giai đoạn 5 · 09 (Tuyên theo trình tự), Giai đoạn 5 · 10 (Hệ thống chú ý)
**时间：**~ 45 phút

## 问题

Trước năm 2017, mỗi mô hình chuỗi tiên tiến nhất trên Trái Đất là mạng Neural Network,... LSTM và GRU trong khoảng nửa thập kỷ, trong đó họ là công cụ duy nhất có sẵn cho người dùng.

Chúng có ba điểm yếu đáng chết.`t+1`需要来自Token `t`Trong một chuỗi 1,024-Token, có nghĩa là trên mỗi chu kỳ có thể thực hiện 1.000.000 lần hoạt động trên GPU, thực hiện 1,024 bước liên tục.

Các gradient biến mất có nghĩa là 50 Token  thông tin trước đây đã được nén qua 50 tầng không dây性──Gated recurrent units ((LSTM, GRU) đã giảm bớt nén này, nhưng chưa bao giờ loại bỏ nó──đối đa độ phụ thuộc dài hạn cuốn sách tôi đọc vào mùa hè năm ngoái trên máy bay đến Kyoto là... thường thất bại──

固定宽度的隐藏状态意味着编码器会在解码器 看到任何内容之前,把整个源序列 挤压到单个向量──源是5个代币 还是500个都无关紧要;瓶始终是相同的形状──

Bài luận 2017  chú ý là tất cả những gì bạn cần   đề xuất một ý tưởng mạnh mẽ: hoàn toàn từ bỏ sự lặp lại  让每个位置并行地出席到每个其他位置  采用一次大型矩阵乘法训练,而不是 1,024次顺序计算

Đến năm 2026, kết quả này đã thống trị tất cả các phương thức. GPT-5, Claude 4, Llama 4) 视觉(ViT, DINOv2, SAM 3) 音频(Whisper) 、生物学(AlphaFold 3) 、机器人(RT-2) ⋅ cùng khối, khác nhau输入。

## 概念

![RNN sequential compute vs Transformer parallel attention](../assets/rnn-vs-transformer.svg)

**Recurrence 是瓶颈。**RNN 计算`h_t = f(h_{t-1}, x_t)`Mỗi bước đều phụ thuộc vào bước trước.`h_4`之前计算 `h_5`❖ Với hơn 10.000 GPU hiện đại và có lõi, nó sẽ lãng phí 99% diện tích trên chuỗi dài.

**Attention 是广播。**Sự chú ý tự trọng sẽ dành cho mỗi đối tượng`(i, j)`Đồng thời tính toán`output_i = sum_j(a_ij * v_j)`◊ toàn bộ N×N sự chú ý trật tự 会在一次批量中填满──没有任何步骤依赖另一个步骤──GPU 喜欢这一点──

**加速不是常数。**Nó là `O(N)`độ sâu hàng loạt 和 `O(1)`Trong thực tế, trong trường hợp N=512 và các phần cứng giống nhau, các biến thể mỗi thời đại có tốc độ đào tạo nhanh 510×; khi chiều dài chuỗi tăng lên, khoảng cách sẽ tiếp tục mở rộng cho đến khi chạm đến sự chú ý của`O(N²)`Căn tường bộ nhớ ((Flash Attention 后来修复了这个点见课 12)。

**transformers 的代价。**Tưởng thức chú ý 按 `O(N²)`扩展──2K ngữ cảnh 没问题──128K ngữ cảnh 则需要滑窗、RoPE外分、Flash Attention tileing,或线性注意的变化──Recurrence 在时间和内存上都是`O(N)`Các bộ biến đổi sử dụng bộ nhớ để thay đổi thời gian, sau đó qua đường đi, giành lại thời gian.

**Inductive bias 的转变。**RNN  giả định địa điểm và tính gần đây. Các nhà biến đổi không giả định mỗi đối tượng vị trí là sự lựa chọn của sự chú ý. Đó là lý do tại sao các nhà biến đổi cần nhiều dữ liệu hơn để được đào tạo tốt, nhưng một khi có đủ dữ liệu thì có thể mở rộng hơn.


```figure
rnn-vs-parallel
```

##  xây dựng nó

Không có mạng thần kinh, chúng tôi dùng số lượng để mô phỏng các khối lõi, để bạn cảm nhận được sự khác biệt trên sổ tay của mình.

### 步骤 1: đo độ sâu hàng loạt

见 `code/main.py`△ Chúng tôi xây dựng hai hàm. Một把序列编码为加法链.串行,类似RNN.

```python
def rnn_style(xs):
    h = 0.0
    for x in xs:
        h = 0.9 * h + x   # can't parallelize: h depends on previous h
    return h

def attention_style(xs):
    return sum(xs) / len(xs)  # every x is independent
```

Chúng tôi đối với độ dài lên đến 100.000 chuỗi phân biệt thời gian. RNN  phiên bản là O(N), và sử dụng một ống dẫn CPU đơn lẻ. Ngay cả trong Python hoàn toàn, giảm độ chú ý theo kiểu trong độ dài ≥ 1,000 cũng sẽ thắng, vì Python của `sum()`là sử dụng C 实现, và 代时不会 tạo ra giải thích viên mở bán ở mỗi bước.

### 步骤 2: 计算理论操作

两个算法都做N 次加法──区别在于 *依赖深度*: 在下一步能够开始之前,有多少操作必须顺序发生──RNN depth = N──注意深度 = log(N), nếu sử dụng giảm cây;或在平行扫描中为1──决定 GPU 时间是深度,而不是操作次数──

### Bước 3: Chuyên nghiệm mở rộng trên dài trình

Chúng tôi in một bảng thời gian, để O(N)  khoảng cách trở nên hiển thị. Trong sổ tay Mac năm 2026, chuỗi ít hơn 1.000 yếu tố quá nhanh, khó đo lường. 100.000 chuỗi sẽ hiển thị một quét tuyến tính rõ ràng.

## Sử dụng nó

2026 年什么时候仍然选择 RNN:

| 情况 | 选择 |
|-----------|------|
| Streaming inference，一次一个 Token，常量内存 | RNN or state-space model (Mamba, RWKV) |
| 超长序列（>1M tokens），Attention memory 爆炸 | Linear attention, Mamba 2, Hyena |
| 没有 matmul accelerator 的 edge device | Depthwise-separable RNN 在 FLOPs/watt 上仍然胜出 |
| 其他任何情况（训练、batched inference、最高 128K 的 context） | Transformer |

Các mô hình không gian nhà nước (SSM) như Mamba, trên bản chất là có các RNN có cấu trúc được phân tích, làm cho chúng có hai ưu điểm:`O(N)`Tự động hóa bộ nhớ quét, cũng như thông qua quét chọn lọc 实现并行训练──它们以更好的长文档扩展 恢复了90%的变体质量──到2026年, hầu hết các phòng thí nghiệm biên giới đều đang đào tạo các mô hình biến thể SSM+ lai (ví dụ như Jamba, Samba) 重复并没有死亡,它是一个组件──

## 交付 nó

见 `outputs/skill-architecture-picker.md` Kỹ năng này sẽ được áp dụng dựa trên độ dài, thông qua và ngân sách đào tạo, để xây dựng một cấu trúc mới. Đối với việc đào tạo hơn 1B Token, nó phải luôn từ chối đề xuất RNN tinh khi, trừ khi rõ ràng là trade-off.

## 练习

1. **简单。**Từ `code/main.py`Trung xuất`rnn_style`,把标量隐藏状态 换为长度为 64 隐藏状态 矢量──重新测量──串联上空 会随隐藏状态维度 增长多少?
2. **中等。**Sử dụng Python 实现 paralel prefix-sum (Hillis-Steele scan) ▽验证 nó được tạo ra trong độ dài 1024 时与串行扫描相等数值输出──计算深度──
3. **困难。**Đặt giảm độ tập trung theo kiểu tập trung 移植 vào GPU trên PyTorch── theo chiều dài chuỗi từ 64 扫 đến 65,536, đối với hai người 计时── vẽ vẽ并解释曲线形状──

## 关键术语

| 术语 | 人们常说 | 它实际意味着什么 |
|------|-----------------|-----------------------|
| Recurrence | “RNNs 是顺序的” | step `t` 依赖 step `t-1` 的计算方式，迫使执行沿时间轴串行进行。 |
| Serial depth | “图有多深” | 依赖操作的最长链；即使在无限硬件上也会限制 wall-clock。 |
| Attention | “让 Tokens 彼此查看” | Weighted sum `sum_j a_ij v_j`，其中 `a_ij` 来自位置 i 和 j 之间的相似度分数。 |
| Context window | “模型能看到多少” | 一个 Attention layer 可作为输入的位置数量；quadratic memory cost 在这里扩展。 |
| Inductive bias | “架构内置的假设” | 关于数据形态的先验；CNNs 假设 translation invariance，RNNs 假设 recency。 |
| State-space model | “背后有代数的 RNN” | 为通过结构化 state-space matrices 实现并行训练而参数化的 recurrence。 |
| Quadratic bottleneck | “为什么 context 这么昂贵” | Attention memory = 序列长度上的 `O(N²)`；Flash Attention 隐藏的是常数，而不是扩展规律。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) Bài viết này chấm dứt sự tái phát trong NLP chính.
- [Bahdanau, Cho, Bengio (2014). Neural MT by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) Sự ra đời của sự chú ý, khi nó được kết nối trên RNN
- [Hochreiter, Schmidhuber (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) 原始 LSTM 论文,作为记录──
- [Gu, Dao (2023). Mamba: Linear-Time Sequence Modeling with Selective State Spaces](https://arxiv.org/abs/2312.00752) đối với các biến thể của hiện đại lặp lại 回答──
