# Cơ chế chú ý  突破

> Decoder không còn dùng một tập hợp tập tin để xác định, mà bắt đầu xem toàn bộ nguồn.

**Type:** Build
**Languages:** Python
**先修要求：**Giai đoạn 5 · 09(Các mô hình theo dõi theo dõi)
**Time:** ~45 分钟

## 问题

Bài 09 以一次可度量的失败结尾── một bộ mã hóa GRU được đào tạo trên nhiệm vụ sao chép 任务, độ chính xác dài 5 giờ là 89%, độ dài đến 80 giờ gần như bất cứ lúc nào── nguyên nhân là cấu trúc, không phải là lỗi đào tạo: bộ mã hóa 提取到的每一点信息都必须塞进一个固定大小的隐藏状态,而解码器又看不到别的东西──

Bahdanau、Cho 和 Bengio đã xuất bản một bài viết trong năm 2014 ⋅ không chỉ đưa trạng thái mã hóa cuối cùng 给 decoder, mà còn giữ lại từng trạng thái mã hóa.`i`多少? Tỷ lệ tăng này là ngữ cảnh, và nó sẽ thay đổi ở mỗi bước giải mã.

Đó là ý tưởng hoàn chỉnh. Transformers đã mở rộng nó. Phân tích tự-thể hiện nó. Đưa nó vào một chuỗi đơn lẻ. Phân tích đa đầu và chạy nó. Nhưng phiên bản 2014 đã phá vỡ chai. Một khi bạn có nó, chuyển hướng chuyển đổi là kỹ thuật, chứ không phải là thay đổi khái niệm.

## 概念

![Bahdanau attention: decoder queries all encoder states](../assets/attention.svg)

Trong mỗi bước decoder `t`- Có thể là:

1. 使用前一个解码 ẩn trạng thái `s_{t-1}`作为 **query**
2. Để nó với mỗi mã hóa ẩn trạng thái `h_1, ..., h_T`打分── mỗi mã hóa 位置一个 skalar──
3. Để điểm đạt được điểm tối đa, nhận được trọng lượng chú ý`α_{t,1}, ..., α_{t,T}`, chúng tổng cộng là 1
4. Vêctơ ngữ cảnh `c_t = Σ α_{t,i} * h_i`◊ mã hóa các trạng thái của gia tăng quyền trung bình
5. Decoder 接收 `c_t`加上前一个输出代币,生成下一个代币.

加权平均才是重点. Khi decoder 需要把"Je" 翻译成"I" 时, nó sẽ khiến "Je" ở trên của encoder trạng thái 权重大,其他位置权重小. Khi nó cần "không" 时, nó sẽ làm cho "pass" 权重大.

## hình dạng ((最容易咬人的地方)

Đây là lần đầu tiên mọi người đều bị lỗi.

| Thing | Shape | Notes |
|-------|-------|-------|
| Encoder hidden states `H` | `(T_enc, d_h)` | 如果是 BiLSTM，`d_h = 2 * d_hidden` |
| Decoder hidden state `s_{t-1}` | `(d_s,)` | 一个 vector |
| Attention score `e_{t,i}` | scalar | 每个 encoder 位置一个 |
| Attention weight `α_{t,i}` | scalar | 对所有 `i` 做 softmax 之后 |
| Context vector `c_t` | `(d_h,)` | 与一个 encoder state 的 shape 相同 |

**Bahdanau（additive）score。** `e_{t,i} = v_α^T * tanh(W_a * s_{t-1} + U_a * h_i)`

- `s_{t-1}`hình dạng của `(d_s,)`- Tôi không biết.`h_i`hình dạng của `(d_h,)`
- `W_a`hình dạng của `(d_attn, d_s)``U_a`hình dạng của `(d_attn, d_h)`
- Chúng có hình dạng bên trong của chúng.`(d_attn,)`
- `v_α`hình dạng của `(d_attn,)`❖ với `v_α`Làm sản phẩm bên trong 会缩 thành một quy mô.**这就是 `v_α` 的作用。**Nó không phải là phép thuật. Nó là chuyển hướng vector chú ý-dim thành dự đoán điểm số quy mô.

**Luong（multiplicative）score。**3 biến thể:

- `dot``e_{t,i} = s_t^T * h_i`❖ yêu cầu`d_s == d_h`Nếu mã hóa của bạn là hai chiều, thì nhảy qua.
- `general``e_{t,i} = s_t^T * W * h_i`, trong số đó `W`hình dạng của `(d_s, d_h)`❖ Di chuyển các giới hạn của các dimension
- `concat`Bản chất là Bahdanau 形式── rất ít sử dụng, vì hai cái trước rẻ hơn──

**一个值得点名的 Bahdanau / Luong gotcha。**Bahdanau 使用 `s_{t-1}`(生成当前 từ *之前* 的解码状态) ――Long 使用 `s_t`(生成*后*的状态) ――                                                                                                                                                                                                                                                           


```figure
attention-heatmap
```

##  xây dựng nó

### 步骤 1: phụ gia

```python
import numpy as np


def additive_attention(decoder_state, encoder_states, W_a, U_a, v_a):
    projected_dec = W_a @ decoder_state
    projected_enc = encoder_states @ U_a.T
    combined = np.tanh(projected_enc + projected_dec)
    scores = combined @ v_a
    weights = softmax(scores)
    context = weights @ encoder_states
    return context, weights


def softmax(x):
    x = x - np.max(x)
    e = np.exp(x)
    return e / e.sum()
```

Theo biểu đồ trên kiểm tra hình dạng của bạn.`encoder_states`hình dạng của `(T_enc, d_h)``projected_enc`hình dạng của `(T_enc, d_attn)``projected_dec`hình dạng của `(d_attn,)`, sẽ được phát sóng.`combined`hình dạng của `(T_enc, d_attn)``scores`hình dạng của `(T_enc,)``weights`hình dạng của `(T_enc,)``context`hình dạng của `(d_h,)` có thể đăng 

### 步骤 2: Luong dot 和 chung

```python
def dot_attention(decoder_state, encoder_states):
    scores = encoder_states @ decoder_state
    weights = softmax(scores)
    return weights @ encoder_states, weights


def general_attention(decoder_state, encoder_states, W):
    projected = W.T @ decoder_state
    scores = encoder_states @ projected
    weights = softmax(scores)
    return weights @ encoder_states, weights
```

Mỗi một là ba dòng. Đó là lý do Luong có thể thành lập giấy.

### 步骤 3: Một ví dụ về giá trị số hoàn chỉnh

给定三个 encoder state ((大致对应 "cat"、"sat"、"mat") cùng một trạng thái decoder gần nhất với trạng thái thứ nhất, phân phối sự chú ý sẽ tập trung ở vị trí 0。 Nếu trạng thái decoder 移动到更接近最后一个 encoder state, sự chú ý sẽ di chuyển đến vị trí 2.。

```python
H = np.array([
    [1.0, 0.0, 0.2],
    [0.5, 0.5, 0.1],
    [0.1, 0.9, 0.3],
])

s_close_to_cat = np.array([0.9, 0.1, 0.2])
ctx, w = dot_attention(s_close_to_cat, H)
print("weights:", w.round(3))
```

```
weights: [0.464 0.305 0.231]
```

Đầu tiên, bạn có thể thắng. Sau đó, bạn chuyển đến trạng thái giải mã gần hơn với trạng thái giải mã thứ ba, bạn có thể xem trọng lượng di chuyển như thế nào.

### Bước 4: Tại sao đây là cầu của các nhà chuyển đổi

把上面的语言翻译成 Q/K/V:

- **Query**= trạng thái decoder `s_{t-1}`
- **Key**= mã hóa trạng thái(我们拿来打分的对象)
- **Value**= các trạng thái mã hóa ((我们加权求和的对象)

Trong sự chú ý cổ điển, các chìa khóa và giá trị là cùng một thứ. Sự chú ý tự phân biệt chúng: bạn có thể làm cho một truy vấn chuỗi tự, và cho K và V sử dụng các dự đoán học hỏi khác nhau.

Từ sự chú ý Bahdanau đến sự chú ý điểm sản phẩm quy mô, học tập chuyển đổi chính là chỉ ghi chú.

## Sử dụng nó

PyTorch và TensorFlow  trực tiếp cung cấp sự chú ý.

```python
import torch
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=128, num_heads=8, batch_first=True)
query = torch.randn(2, 5, 128)
key = torch.randn(2, 10, 128)
value = torch.randn(2, 10, 128)

output, weights = mha(query, key, value)
print(output.shape, weights.shape)
```

```
torch.Size([2, 5, 128]) torch.Size([2, 5, 10])
```

Đây là một lớp chú ý biến đổi. Nhóm truy vấn có 5 vị trí, nhóm khóa/đáng giá có 10 vị trí, mỗi vị trí là 128 chiều, 8 đầu.`output`là những câu hỏi mới được tăng cường theo bối cảnh.`weights`Bạn có thể hình dung được 5x10 matrix sắp xếp.

### Sự chú ý cổ điển 什么时候仍然重要

- Giáo dục: Một đầu, một lớp, dựa trên phiên bản RNN để mọi khái niệm được nhìn thấy.
- Các biến thể 放不下的 trên thiết bị chuỗi 任务。
- Bất kỳ bài báo nào của năm 2014-2017 ⋅ không biết quy định của Bahdanau, bạn sẽ đọc nó ⋅
- Phân tích phân bố phân tích nhỏ trong MT. Đánh nặng chú ý thô ngay cả trong các mô hình biến thể cũng là công cụ giải thích, và đọc chúng cần biết chúng là gì.

### chú ý trọng lượng như giải thích 陷

Các trọng lượng chú ý trông có thể giải thích. Chúng là trọng lượng nằm trên một vị trí khác nhau. Bạn có thể vẽ ra.

它们没有看起来那么解释. Jane 和 Wallace (Jane 和 Wallace, 2019) cho thấy, trong một số nhiệm vụ, phân phối sự chú ý có thể được thay thế, được thay thế theo bất kỳ phương pháp nào, không thay đổi dự đoán mô hình. Không có sự trừu tượng hoặc kiểm tra đối lập, không bao giờ đặt trọng lượng sự chú ý.

##  phát hành nó

保存为 `outputs/prompt-attention-shapes.md`- Có thể là:

```markdown
---
name: attention-shapes
description: Debug shape bugs in attention implementations.
phase: 5
lesson: 10
---

给定一个损坏的 attention implementation，你需要识别 shape mismatch。输出：

1. 哪个 matrix 的 shape 错了。命名这个 tensor。
2. 它的 shape 应该是什么，从 (d_s, d_h, d_attn, T_enc, T_dec, batch_size) 推导。
3. 一行修复。Transpose、reshape 或 project。
4. 一个捕获 regressions 的测试。通常是：assert `output.shape == (batch, T_dec, d_h)` and `weights.shape == (batch, T_dec, T_enc)` and `weights.sum(dim=-1) close to 1`。

拒绝建议会静默 broadcast 的修复。被 broadcast 隐藏的 bugs 之后会表现为静默 accuracy degradation，这是最糟糕的一类 attention bug。

对于 Bahdanau 混淆，坚持 decoder input 是 `s_{t-1}`（pre-step state）。对于 Luong，是 `s_t`（post-step state）。对于 dot-product，把 query 和 key 之间的 dimension mismatch 标记为新手最常见错误。
```

## 练习

1. **Easy.**实现 `softmax`masking,使 encoder 中的填充代币 获得零注意重量──在包含可变长度序列的批上测试──
2. **Medium.**给 Luong `general`hình thức thêm nhiều đầu chú ý`d_h`拆成 `n_heads`组, mỗi đầu 运行 chú ý, rồi kết nối.
3. **Hard.**Trong bài học 09 của bài chơi sao chép  nhiệm vụ trên đào tạo một bộ mã hóa-chế lập GRU mang sự chú ý của Bahdanau.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Attention | 看东西 | 对 value sequence 做加权平均，weights 由 query-key similarity 计算。 |
| Query, Key, Value | QKV | 三个 projections：Q 发问，K 是要匹配的内容，V 是要返回的内容。 |
| Additive attention | Bahdanau | Feed-forward score: `v^T tanh(W q + U k)`。 |
| Multiplicative attention | Luong dot / general | Score 是 `q^T k` 或 `q^T W k`。更便宜，在大多数任务上 accuracy 相同。 |
| Alignment matrix | 好看的图 | Attention weights 作为 `(T_dec, T_enc)` 网格。读取它可以看到 model attend 到了什么。 |

## 延伸阅读
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) Bài báo này.
- [Luong, Pham, Manning (2015). Effective Approaches to Attention-based Neural Machine Translation](https://arxiv.org/abs/1508.04025) 三种分分变体 及其比较──
- [Jain and Wallace (2019). Attention is not Explanation](https://arxiv.org/abs/1902.10186) 可解释性注意项──
- [Dive into Deep Learning — Bahdanau Attention](https://d2l.ai/chapter_attention-mechanisms-and-transformers/bahdanau-attention.html) 使用 PyTorch của có thể vận hành đi bộ qua.
