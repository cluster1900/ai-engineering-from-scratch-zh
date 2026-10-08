# Cảnh sát 变体  cửa sổ trượt, Sparse, Differential

> Full Attention là một vòng. Mỗi token đều có thể nhìn thấy mỗi token, trong khi bộ nhớ trả giá cho nó.

**Type:** Build
**Languages:** Python
**先修要求:**Giai đoạn 7 · 02 (Tự chú ý), Giai đoạn 7 · 03 (Trong đầu nhiều), Giai đoạn 7 · 12 (KV Cache / Flash Attention)
**Time:** ~60 minutes

## 问题

Full Attention trong bộ nhớ dài của chuỗi là `O(N²)`, tính toán chi phí cũng là`O(N²)`Với một Llama có nội dung 128K, có nghĩa là mỗi tầng có 160 tỷ chú ý, tăng lên 80 tầng.`O(N²)`kích hoạt trong bộ nhớ, nhưng sẽ không thay đổi tính toán tính toán chi phí mỗi token  vẫn sẽ tham dự đến mỗi token khác

3 loại biến thể thay đổi Matrix chú ý bản thân:

1. **Sliding window attention (SWA).**Mỗi token chỉ đi đến các token gần bên trong cửa sổ cố định, thay vì tiền tố đầy đủ.`O(N · W)`, trong số đó `W`Đó là cửa sổ lớn. Gemma 2/3 Mistral 7B.
2. **Sparse / block attention.**Chỉ có một lựa chọn`(i, j)`Đối với cuộc họp được đánh phân; vị trí còn lại được buộc phải là 0权重. Longformer, BigBird, OpenAI thâm hụt biến.
3. **Differential attention.**Sử dụng dự đoán Q/K độc lập 计算两张 Attention map,再相减――消除将把权重泄漏到前几个代币的 注意沉──Microsoft's DIFF Transformer(2024)。

Những thứ này có thể tồn tại chung. Một mô hình biên giới năm 2026 thường sử dụng chúng: hầu hết các tầng là SWA-1024, mỗi năm có một tầng toàn cầu Full Attention, còn một số ít các đầu khác biệt được sử dụng để giải quyết các truy vấn.

## 概念

### Chú ý cửa sổ trượt (SWA)

位置 `i`Mỗi câu hỏi chỉ cần tham gia đến`[i - W, i]`(SWA nguyên nhân) hoặc `[i - W/2, i + W/2]`(tương hướng) trong vị trí.                                                                                                                                                                                                                                                           `-inf`

```
full causal:           sliding window (W=4):
positions 0-7          positions 0-7, W=4
    0 1 2 3 4 5 6 7        0 1 2 3 4 5 6 7
0 | x                0 |  x
1 | x x              1 |  x x
2 | x x x            2 |  x x x
3 | x x x x          3 |  x x x x
4 | x x x x x        4 |    x x x x
5 | x x x x x x      5 |      x x x x
6 | x x x x x x x    6 |        x x x x
7 | x x x x x x x x  7 |          x x x x
```

 Đối với `N = 8192`和 `W = 1024`, điểm số Matrix 期望上有1024 × 8192 非零行 giảm 8×:

**KV cache 会随 SWA 缩小。**Mỗi tầng chỉ cần giữ gần đây `W`个 Token của K 和 V── đối với một cấu hình tương tự như Gemma-3(1024 cửa sổ,128K ngữ cảnh),KV cache 会降低 128×──

**质量成本。**纯SWA Transformer 难以处理长距离检索――修复方法: 在SWA 层间交错全重视层――Gemma 3 使用 5:1 SWA:global。Mistral 7B 使用因果性SWA堆,信息通过重叠窗向前流每层都将有效感受野扩展`W`, qua `L`层后,模型 có thể đến phía sau `L × W`个Token.

### Sự chú ý thâm hụt / ngăn chặn

预先选择一个 `N × N`Mô hình thô lỗ:

- **Local + strided (OpenAI sparse transformer).**Hãy đến gần đây`W`个 token, thêm vào đây mỗi phần`stride`个 Địa chỉ vị trí.`O(N · sqrt(N))`计算同时 nắm bắt địa phương và khoảng cách dài thông tin.
- **Longformer / BigBird.**cửa sổ địa phương + ít số tiền token toàn cầu`[CLS]`), Những Token tham dự đến tất cả Token, cũng được tất cả Token tham dự + liên kết ngẫu nhiên-sparse.
- **Native Sparse Attention (DeepSeek, 2025).**Học những gì `(Q, K)`block 重要; 在内核层面跳过零 block──兼容 FlashAttention──

Sparse Attention là một kỹ thuật hạt nhân 故事──数学很简单;; kết quả từ từ không把零条目加载进 SRAM──FlashAttention-3 和 2026 năm của FlexAttention API 让自定义稀少模式 成为PyTorch中的等能力──

### Sự chú ý khác biệt (DIFF Transformer, 2024)

常规注意 有一个注意 问题:softmax 强制每一行求和为 1, do đó những người không muốn đặc biệt tham dự đến bất kỳ nội dung nào của Token sẽ đẩy trọng lượng xuống đầu tiên Token (hoặc vài Token trước đó) trên.

Sự chú ý khác biệt 通过计算**两张**Bản đồ chú ý và giảm đi để giải quyết vấn đề này:

```
A1 = softmax(Q1 K1^T / √d)
A2 = softmax(Q2 K2^T / √d)
DiffAttn = (A1 - λ · A2) V
```

Trong số đó `λ`là một học tập nhận được của thang điểm ((đường là 0,50.8)。A1  nắm bắt trọng lượng nội dung thực sự;A2  nắm bắt chìa khóa。相减会抵消 chìa khóa,把权重重新分配给相关代币。

报告结果(Microsoft 2024): sự phức tạp  giảm 510%, trong cùng một training长度 dưới bối cảnh hiệu quả 延长 1.52×,针-in-haystack 检索更敏。

### 变体对比

| Variant | Compute | KV cache | Quality vs full | Production use |
|---------|---------|----------|-----------------|----------------|
| Full attention | O(N²) | O(N) per layer | baseline | 每个模型的默认层 |
| SWA (window 1024) | O(N·W) | O(W) per layer | -0.1 ppl，搭配 global layers 效果好 | Gemma 2/3, Phi-3-Long |
| Local + strided sparse | O(N·√N) | mixed | 类似 SWA | OpenAI sparse transformer, Longformer |
| BigBird (local + global + random) | O(N) approx | mixed | 在 2× context 下匹配 full | early long-context BERT |
| Native Sparse (DeepSeek-V3.2) | O(N · active fraction) | O(N) | within 0.05 ppl | DeepSeek-V3.2, 2025 |
| Differential | O(2·N²) | O(2N) | -5 to -10% ppl | DIFF Transformer, early 2026 models |


```figure
gqa-kv-sharing
```

##  xây dựng nó

见 `code/main.py` Chúng tôi thực hiện một so sánh mặt nạ nhân quả, trên các chuỗi đồ chơi 并排 hiển thị đầy đủ SWA, địa phương + bước và Differential Attention。

### 步骤 1: mặt nạ nguyên nhân đầy đủ(tầm)

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

Từ đường cơ bản của Bài học 07 ⋅ 下三角; đối với góc trên đường trọng lượng là 0.

### 步骤 2: mặt nạ nhân quả cửa sổ trượt

```python
def swa_mask(n, window):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
    return M
```

Một số liệu`window``window >= n`时,会恢复 toàn bộ nguyên nhân chú ý.`window = 1`时, mỗi Token chỉ tham dự đến chính mình.

### 步骤 3: mặt nạ nhỏ bé địa phương + bước

```python
def strided_mask(n, window, stride):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
        for j in range(0, i + 1, stride):
            M[i][j] = 0.0
    return M
```

密集 địa phương cửa sổ gia tăng từ chuỗi mở đầu bắt đầu mỗi phần `stride`个 Token 的位置──随着额外层数增加,感受野以日志步骤 增长──

### 步骤 4: sự chú ý khác biệt

```python
def diff_attention(Q1, K1, Q2, K2, V, lam):
    A1 = softmax_causal(Q1 @ K1.T / sqrt_d)
    A2 = softmax_causal(Q2 @ K2.T / sqrt_d)
    return (A1 - lam * A2) @ V
```

两次 Attention pass, dùng học tập nhận được hệ số trộn tương đương 相减── trong mã, chúng tôi so sánh một Attention với Differential Attention của chú ý-đối nhiệt bản đồ,并观察 缩──

### 步骤 5: KV cache kích thước

Trong `N = 131072`Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm: Ưu điểm:

## Sử dụng nó

Mô hình sản xuất năm 2026:

```python
from transformers import AutoModelForCausalLM
# Gemma 3 mixes SWA (window=1024) and global layers at 5:1.
model = AutoModelForCausalLM.from_pretrained("google/gemma-3-27b-it")
# print(model.config.sliding_window, model.config.layer_types)
```

PyTorch 2.5+ 中的 FlexAttention  chấp nhận một chức năng mặt nạ:

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

def swa_pattern(b, h, q_idx, kv_idx):
    return (q_idx - kv_idx < 1024) & (q_idx >= kv_idx)

mask = create_block_mask(swa_pattern, B=batch, H=heads, Q_LEN=n, KV_LEN=n)
out = flex_attention(q, k, v, block_mask=mask)
```

Đây sẽ được dịch thành tự định nghĩa Triton kernel. Đối với mô hình thường gặp, tốc độ là 10% trong FlashAttention-3, và hàm mặt nạ là một Python có thể gọi.

**何时选择哪一种：**

- **Pure full attention** Mỗi tầng đều phù hợp với bối cảnh cao nhất khoảng 16K, hoặc kiểm tra chất lượng quan trọng khi.
- **SWA + global mix** 长 context(>32K), đào tạo và suy luận 受内存限制──2026年 32K以上的默认选择──
- **Sparse block attention** tự định nghĩa hạt nhân、 tự định hình──保留给专门工作负载(检索、音频)。
- **Differential attention**  Bất kỳ sự ô nhiễm của sự chú ý sẽ gây ra tổn thương

## 交付 nó

见 `outputs/skill-attention-variant-picker.md` Kỹ năng này sẽ dựa trên chiều dài của ngữ cảnh mục tiêu, nhu cầu kiểm tra và hồ sơ tính toán đào tạo/nghiên định, để chọn một mô hình mới.

## 练习

1. **Easy.**运行 `code/main.py`❖ 验证`window=4`SWA 会把每一行中最近4个代币 之外的所有内容置零――验证 `window=n`会 bit-identically 复现 toàn nguyên nhân chú ý.
2. **Medium.**Trong bài học 07 kết quả 之上实现 `window=1024`Trong một vài phút, tôi đã có thể làm được một vài bước.
3. **Hard.**Trong mô hình, thực hiện Gemma-3 kiểu 5:1 lớp hỗn hợp ((5 tầng SWA,1 tầng toàn cầu) ⋅ trong các điều kiện phù hợp, đối với chất lượng sản xuất của SWA tinh khiết và cơ sở toàn cầu tinh khiết
4. **Hard.**Thực hiện mọi thứ mà mọi người đều có thể học được`λ`Trong một nhiệm vụ thu hồi tổng hợp, một kim, 2.000 个 phân tâm) trên tập luyện, trong trường hợp phù hợp với các tham số, đo độ chính xác của việc thu hồi so với đường cơ sở chỉ cần một sự chú ý.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sliding window attention (SWA) | "Local attention" | 每个 query attend 到最近 `W` 个 Token；KV cache 缩小到 `O(W)`。 |
| Effective receptive field | "模型能向后看多远" | 在一个窗口为 `W` 的 `L` 层 SWA stack 中，最多 `L × W` 个 Token。 |
| Longformer / BigBird | "Local + global + random" | Sparse pattern，包含少量始终 attend 的 global tokens；早期 long-context 方法。 |
| Native Sparse Attention | "DeepSeek's kernel trick" | 学习 block-level sparsity；在保持质量的同时，在 kernel 层面跳过零 block。 |
| Differential attention | "Two maps, one subtracts" | DIFF Transformer：从第一张 Attention map 中减去学习得到的 `λ` 倍第二张 Attention map，以抵消 attention sinks。 |
| Attention sink | "权重泄漏到 token 0" | Softmax normalization 强制行求和为 1；信息量不足的 query 会把权重倾倒到位置 0。 |
| FlexAttention | "Mask-as-Python" | PyTorch 2.5+ API，可将任意 mask function 编译成 FlashAttention 形状的 kernel。 |
| Layer type mix | "5:1 SWA-to-global" | 在 stack 中交错 sparse 和 full Attention 层，以更低内存保持质量。 |

## 延伸阅读

- [Beltagy, Peters, Cohan (2020). Longformer: The Long-Document Transformer](https://arxiv.org/abs/2004.05150) 经典的滑窗+ toàn cầu-chèn 论文。
- [Zaheer et al. (2020). Big Bird: Transformers for Longer Sequences](https://arxiv.org/abs/2007.14062) địa phương + toàn cầu + ngẫu nhiên。
- [Child et al. (2019). Generating Long Sequences with Sparse Transformers](https://arxiv.org/abs/1904.10509) Mẫu đường bộ địa phương của OpenAI
- [Gemma Team (2024). Gemma 2: Improving Open Language Models at a Practical Size](https://arxiv.org/abs/2408.00118) 1:1 SWA:xuất toàn cầu
- [Gemma Team (2025). Gemma 3 technical report](https://arxiv.org/abs/2503.19786) window=1024 của 5:1 mix,如今是教科书式默认配置──
- [Ye et al. (2024). Differential Transformer](https://arxiv.org/abs/2410.05258) DIFF Transformer 论文。
- [Yuan et al. (2025). Native Sparse Attention](https://arxiv.org/abs/2502.11089) DeepSeek-V3.2 của học được sự thâm hụt chú ý.
- [PyTorch — FlexAttention blog and docs](https://pytorch.org/blog/flexattention/) Sử dụng nó 中 mask-as-callable pattern của API tham chiếu。
