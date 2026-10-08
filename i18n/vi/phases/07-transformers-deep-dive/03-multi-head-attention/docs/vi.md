# Sự chú ý nhiều đầu

> Một đầu chú ý một lần học một mối quan hệ.

**类型：**构建
**语言：**Python
**前置知识：**Giai đoạn 7 · 02(Tự quan tâm từ đầu)
**时间：**~ 75 phút

## 问题

单个自我注意头 会计算一个注意矩阵――这个矩阵 捕捉一种关系,通常是能够在当前训练信号上最小化损失的那种关系――如果你的数据里主题verb agreement、co-reference、长距离演讲 和语法分断 全部纠在一起,单个头会把它们抹在单一的软最大分布,丢掉一半信号――

Bài báo Vaswani năm 2017  đưa ra cách sửa chữa là:并行运行 nhiều chức năng chú ý, mỗi người có dự đoán Q、K、V của riêng mình, sau đó đưa ra cùng nhau.`d_model / n_heads`                                                                                                                                                                                                                                                              

Sự chú ý đa đầu là định dạng mặc định của tất cả các Transformer vào năm 2026. Vấn đề duy nhất là cần sử dụng * bao nhiêu đầu, cũng như các khóa và giá trị là không hay không dự đoán chung.

## 概念

![Multi-head attention splits, attends, concatenates](../assets/multi-head-attention.svg)

**Split。**取形为 `(N, d_model)`của `X`△分别 dự án 到形状为 `(N, d_model)`của Q  K  V `(N, n_heads, d_head)`, trong số đó `d_head = d_model / n_heads`❖ Chuyển cho`(n_heads, N, d_head)`

**并行 Attend。**Trong mỗi đầu trong运行 quy mô điểm sản phẩm chú ý.`(N, d_head)`Những đầu này hoạt động trên không gian khác nhau của Embedding, và trong quá trình tính toán sự chú ý sẽ không giao tiếp với nhau.

**Concatenate 并 project。**Thắp đầu lên`(N, d_model)`, rồi được nhân bằng hình dạng`(d_model, d_model)`của học được các matrix đầu ra `W_o``W_o`là đầu  tiến hành hỗn hợp vị trí.

**为什么有效。**Mỗi đầu có thể được chuyên dụng, không cần phải các đầu khác 争抢表征预算。 Nghiên cứu thăm dò năm 20192024 cho thấy các vai trò đầu khác nhau: đầu vị trí、 phục vụ đầu của token trước đó、 đầu sao chép、 đầu thực thể có tên, đầu cảm ứng(họ tạo thành cơ chế cơ bản của học tập trong bối cảnh)。

**2026 年的变体谱系：**

| Variant | Q heads | K/V heads | Used by |
|---------|---------|-----------|---------|
| Multi-head (MHA) | N | N | GPT-2, BERT, T5 |
| Multi-query (MQA) | N | 1 | PaLM, Falcon |
| Grouped-query (GQA) | N | G (e.g. N/8) | Llama 2 70B, Llama 3+, Qwen 2+, Mistral |
| Multi-head latent (MLA) | N | compressed to low-rank | DeepSeek-V2, V3 |

GQA là một giải pháp tiêu chuẩn hiện đại, vì nó có thể phù hợp.`N/G`Số lượng nhân đếm giảm bộ nhớ cache KV, đồng thời giữ chất lượng gần như hoàn chỉnh MLA Hơn nữa, hãy nén K/V vào không gian ẩn, sau đó trong dự án tính toán thời gian quay lại nó sẽ tiêu thụ FLOPs, nhưng tiết kiệm nhiều bộ nhớ hơn.


```figure
multihead-split
```

##  xây dựng nó

### Bước 1: Từ sự chú ý của chúng ta đã có một đầu trong chia tay đầu

取 Bài học 02 里的 `SelfAttention`, dùng một đối tác chia/các 包起来.`code/main.py`Trong có numpy 实现; logic như sau:

```python
def split_heads(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n, n_heads, d_head).transpose(1, 0, 2)  # (heads, n, d_head)

def combine_heads(H):
    h, n, d_head = H.shape
    return H.transpose(1, 0, 2).reshape(n, h * d_head)
```

Một lần tái tạo và một lần chuyển đổi. Không có vòng lặp.`nn.MultiheadAttention`Tôi sẽ làm gì đây?

### 步骤 2: theo đầu 运行 quy mô điểm- sản phẩm chú ý

Mỗi đầu đều có được một mảnh của mình.

```python
def mha_forward(X, W_q, W_k, W_v, W_o, n_heads):
    Q = X @ W_q
    K = X @ W_k
    V = X @ W_v
    Qh = split_heads(Q, n_heads)         # (heads, n, d_head)
    Kh = split_heads(K, n_heads)
    Vh = split_heads(V, n_heads)
    scores = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(Qh.shape[-1])
    weights = softmax(scores, axis=-1)
    out = weights @ Vh                    # (heads, n, d_head)
    concat = combine_heads(out)
    return concat @ W_o, weights
```

Trên thực tế,`Qh @ Kh.transpose(...)`Là một `bmm`GPU nhìn thấy là hình dạng`(heads, N, d_head) × (heads, d_head, N) -> (heads, N, N)`Một bộ đống đống đống.

### 步骤 3: Nhóm-Query chú ý 变体

Chỉ có các dự báo giá trị và khóa sẽ thay đổi.`n_heads`个 nhóm; K 和 V 获得 `n_kv_heads < n_heads`个 nhóm,并被重复以匹配:

```python
def gqa_project(X, W, n_kv_heads, n_heads):
    kv = split_heads(X @ W, n_kv_heads)       # (kv_heads, n, d_head)
    repeat = n_heads // n_kv_heads
    return np.repeat(kv, repeat, axis=0)      # (n_heads, n, d_head)
```

Trong suy luận, nó sẽ tiết kiệm bộ nhớ, bởi vì KV cache chỉ lưu trữ trong `n_kv_heads`份副本, thay vì `n_heads`份──Llama 3 70B 使用 64 个 truy vấn đầu và 8 个 KV đầu,也就是 8× của cache 缩减──

### Bước 4: Hãy thử mỗi đầu học được gì

Trong một câu ngắn, dùng 4 đầu để chạy MHA.`(N, N)`Attention matrix── bạn sẽ thấy các đầu khác nhau ngay cả trong sự khởi đầu ngẫu nhiên 下也会选出不同结构

## Sử dụng nó

Trong PyTorch 中,一行版本:

```python
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=512, num_heads=8, batch_first=True)
```

PyTorch 2.5+ 中的 GQA:

```python
from torch.nn.functional import scaled_dot_product_attention

# scaled_dot_product_attention auto-dispatches Flash Attention on CUDA.
# For GQA, pass Q of shape (B, n_heads, N, d_head) and K,V of shape
# (B, n_kv_heads, N, d_head). PyTorch handles the repeat.
out = scaled_dot_product_attention(q, k, v, is_causal=True, enable_gqa=True)
```

**多少个 heads？**Từ 2026 năm mô hình sản xuất kinh nghiệm quy tắc:

| Model size | d_model | n_heads | d_head |
|------------|---------|---------|--------|
| Small (~125M) | 768 | 12 | 64 |
| Base (~350M) | 1024 | 16 | 64 |
| Large (~1B) | 2048 | 16 | 128 |
| Frontier (~70B) | 8192 | 64 | 128 |

`d_head`几乎总是落在64或128. 它是一个头能看到多少内容的单位.`sqrt(d_head)`; cao hơn 256, bạn sẽ mất lợi ích của nhiều chuyên gia nhỏ.

## 交付 nó

见 `outputs/skill-mha-configurator.md`◊ kỹ năng này sẽ dựa trên ngân sách tham số ◊ chiều dài chuỗi và mục tiêu triển khai, cho Transformer mới   số đầu ◊ số đầu và chiến lược chiếu ◊

## 练习

1. **简单。**取 `code/main.py`Trung tâm MHA, cố định `d_model=64`Trong trường hợp này`n_heads`Từ 1 改到 16 ⋅ trong nhiệm vụ sao chép tổng hợp 上绘制 một mô hình một lớp nhỏ gọn ⋅ nhiều đầu hơn là hữu ích ⋅ xu hướng trên nền tảng, hoặc có hại?
2. **中等。**实现 MQA(Tất cả các đầu truy vấn 共享一个 KV đầu)。 đo số parameter 相比全 MHA 下降了多少──计算推断 时 N=2048 下 KV-cache size 缩小了多少──
3. **困难。**实现一个小的 版本的多头潜伏注意:把K,V 压缩到级别-`r`                                                                                                                                                                                                                                                              `r`取到多少时, cache memory sẽ giảm xuống 1/8 của MHA đầy đủ dưới đây, đồng thời chất lượng vẫn giữ trong xác thực của người dân 1 bit trong?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Head | “一个单独的 attention circuit” | 一个维度为 `d_head = d_model / n_heads` 的 Q/K/V projection，拥有自己的 attention matrix。 |
| d_head | “Head dimension” | Per-head hidden width；在 production 中几乎总是 64 或 128。 |
| Split / combine | “Reshape tricks” | Attention 前后的 `(N, d_model) ↔ (n_heads, N, d_head)` reshape+transpose。 |
| W_o | “Output projection” | Concatenating heads 之后应用的 `(d_model, d_model)` matrix；heads 在这里混合。 |
| MQA | “One KV head” | Multi-Query Attention：单个共享 K/V projection。KV cache 最小，但有一些质量损失。 |
| GQA | “The default since Llama 2” | `n_kv_heads < n_heads` 的 Grouped-Query Attention；通过重复来匹配 Q。 |
| MLA | “DeepSeek 的技巧” | Multi-head Latent Attention：K,V 被压缩到 low-rank latent，并在 attend time 解压。 |
| Induction head | “in-context learning 背后的 circuit” | 一对 heads，检测之前的出现位置，并复制其后跟随的内容。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need §3.2.2](https://arxiv.org/abs/1706.03762) 原始的多头规范──
- [Shazeer (2019). Fast Transformer Decoding: One Write-Head is All You Need](https://arxiv.org/abs/1911.02150) MQA 论文。
- [Ainslie et al. (2023). GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245) 如何在训练后把 MHA 转换为 GQA──
- [DeepSeek-AI (2024). DeepSeek-V2 Technical Report](https://arxiv.org/abs/2405.04434) MLA, cũng như tại sao nó ở bộ nhớ cache 上优于MHA/GQA。
- [Olsson et al. (2022). In-context Learning and Induction Heads](https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html) Từ góc độ cơ học quan sát đầu thực sự đã làm gì.
