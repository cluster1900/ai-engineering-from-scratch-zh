# Bộ biến đổi đầy đủ  Encoder + Decoder

> Sự chú ý là chủ yếu. Tất cả những thứ còn lại, bình thường hóa, chuyển tiếp, sự chú ý qua lại là để bạn có thể đặt nó vào một khung chữ rất sâu.

**Type:** Build
**Languages:** Python
**先修要求:**Giai đoạn 7 · 02 (Tự chú ý), Giai đoạn 7 · 03 (Túy chú ý nhiều đầu), Giai đoạn 7 · 04 (Tích mã vị trí)
**Time:** ~75 minutes

## 问题
Một lớp chú ý là một bộ lọc đặc trưng, không phải là một mô hình. Mỗi lớp một lần được kết hợp với ngôn ngữ không đủ dung lượng. Bạn cần độ sâu, và nếu không có đường ống chính xác, độ sâu sẽ không hiệu quả.

Năm 2017, Vaswani 论文打包了六个设计决策,把一个注意层 变成可堆叠的块――此后每个变压器只编码 (BERT) 只编码 (GPT) 只编码-decoder (T5) 都继承了同一个骨架――到2026年,这些块已被改进了(RMSNorm、SwiGLU、pre-norm、RoPE),但骨架完全相同――

Bài học này nói về cấu trúc này. Bài học tiếp theo sẽ được phát triển chuyên dụng.

## 概念
![Encoder and decoder block internals, wired](../assets/full-transformer.svg)

### 六个组成部分

1. **Embedding + positional signal.**Các biểu tượng → Dấu vector.
2. **Self-attention.**Mỗi vị trí đều được xem xét với mọi vị trí khác.
3. **Feed-forward network (FFN).**按位置 作用的两层 MLP:`W_2 · activation(W_1 · x)`❖ Mức độ mở rộng là 4×。
4. **Residual connection.** `x + sublayer(x)`Không có nó, các gradient sẽ biến mất sau khoảng 6 tầng.
5. **Layer normalization.** `LayerNorm`Hoặc`RMSNorm`(现代) ・稳定 lưu lượng dư lượng
6. **Cross-attention (decoder only).**Các truy vấn từ decoder, keys và giá trị từ output encoder.

### Block encoder ((BERT、T5 encoder 使用)

```
x → LN → MHA(self) → + → LN → FFN → + → out
                     ^              ^
                     |              |
                     └── residual ──┘
```

Mã hóa là hai chiều. Không có che phủ. Tất cả các vị trí đều có thể nhìn thấy tất cả các vị trí.

### Block decoder ((GPT、T5 decoder 使用)

```
x → LN → MHA(masked self) → + → LN → MHA(cross to encoder) → + → LN → FFN → + → out
```

Các bộ giải mã mỗi khối có ba tầng phụ. Trong giữa đó là sự chú ý qua mặt.

### Pre-norm vs post-norm

原始论文:`x + sublayer(LN(x))`vs `LN(x + sublayer(x))`▽Norm sau trong năm 2019 hoặc mất  Nếu không có sự nóng lên kỹ lưỡng, nó rất khó để luyện tập sâu ⋅Norm trước ⋅Norm trước trong lớp dưới * trước * Sử dụng `LN`) là năm 2026 默认选择:Llama、Qwen、GPT-3+、Mistral 都使用它──

### 2026 năm của khối hiện đại hóa

Vaswani 2017 sử dụng là LayerNorm + ReLU。现代 stack 替换了两者──生产级块 实际看起来是这样:

| Component | 2017 | 2026 |
|-----------|------|------|
| Normalization | LayerNorm | RMSNorm |
| FFN activation | ReLU | SwiGLU |
| FFN expansion | 4× | 2.6×（SwiGLU 使用三个 matrices，总参数量匹配） |
| Position | Sinusoidal absolute | RoPE |
| Attention | Full MHA | GQA（或 MLA） |
| Bias terms | Yes | No |

RMSNorm đã bỏ ra trung tâm trung bình của LayerNorm (không thể trừ một lần), tiết kiệm tính toán, và nhìn từ kinh nghiệm trên ít nhất cũng ổn định.`Swish(W1 x) ⊙ W3 x`) trong Llama、PaLM 和 Qwen 论文 中稳定优优于 ReLU/GELU FFN,ppl 约提升 0.5 个点──

### Số lượng tham số

 Đối với một `d_model = d`且 FFN mở rộng 为 `r`của khối:

- MHA: `4 · d²`(Q, K, V, O dự đoán)
- FFN (SwiGLU): `3 · d · (r · d)`≈ ≈`3rd²`
- Các tiêu chuẩn: 可忽略

Khi đó`d = 4096, r = 2.6, layers = 32`(大致对应 Llama 3 8B)时,总量为:`32 · (4·4096² + 3·2.6·4096²) ≈ 32 · (16 + 32) M = ~1.5B parameters per layer × 32 ≈ 7B`(Tại thêm các nhúng và đầu) ◊ với các tính toán đã được phát hành相符


观察一个向量 如何流过单个块:Atention 在位置之间混合信息,残留 把信号继续向前携带,FFN做变变,而规则 让残留流保持稳定――

```figure
transformer-block
```

##  xây dựng nó
### 步骤 1: khối xây dựng

Sử dụng Bài học 03 中的小型 `Matrix`class(为了独立性已复制到这个文件):

- `layer_norm(x, eps=1e-5)` 减去 nghĩa là,除以 std。
- `rms_norm(x, eps=1e-6)` trừ RMS──不减除意思──
- `gelu(x)`和 `silu(x) * W3 x`(SwiGLU) ✿
- `ffn_swiglu(x, W1, W2, W3)`
- `encoder_block(x, params)`和 `decoder_block(x, enc_out, params)`

完整线路 见 `code/main.py`

### 步骤 2: dây một bộ mã hóa 2 lớp và một bộ mã hóa 2 lớp

Để chúng được xếp chồng lên. sẽ phát ra các mã hóa. sẽ truyền vào mỗi decoder.

```python
def encode(tokens, params):
    x = embed(tokens, params.emb) + sinusoidal(len(tokens), params.d)
    for block in params.encoder_blocks:
        x = encoder_block(x, block)
    return x

def decode(target_tokens, encoder_out, params):
    x = embed(target_tokens, params.emb) + sinusoidal(len(target_tokens), params.d)
    for block in params.decoder_blocks:
        x = decoder_block(x, encoder_out, block)
    return x
```

### 步骤 3: Trong ví dụ đồ chơi 上运行 前进

输入一个 6-token source 和一个 5-token target──验证输出形 是 `(5, vocab)`❖ không tập trung vào kiến trúc, chứ không phải là mất mát.

### 步骤 4: 换 thành RMSNorm + SwiGLU

用 RMSNorm 和 SwiGLU 替换 LayerNorm 和 ReLU-FFN── xác nhận hình dạng  vẫn phù hợp── đây là hiện đại hóa năm 2026, chỉ cần một lần thay thế chức năng──

## Sử dụng nó
Các thực hiện tham chiếu PyTorch/TF:`nn.TransformerEncoderLayer``nn.TransformerDecoderLayer`Nhưng hầu hết các sản phẩm sản xuất năm 2026 sẽ tự thực hiện khối, vì:

- Flash Attention là trong sự chú ý  nội dung调用, thay vì thông qua `nn.MultiheadAttention`
- GQA / MLA 不在 stdlib tham chiếu 中──
- RoPE、RMSNorm、SwiGLU không phải là mặc định PyTorch。

HF `transformers`Có những khối tham chiếu rõ ràng, đáng đọc:`modeling_llama.py`Đó là một khối chỉ có mã hóa hóa vào năm 2026... Nó có khoảng 500 行, đáng để đọc đầy đủ một lần.

**Encoder vs decoder vs encoder-decoder — 什么时候选择：**

| Need | Pick | Example |
|------|------|---------|
| Classification、embeddings、基于文本的 QA | Encoder-only | BERT, DeBERTa, ModernBERT |
| Text generation、chat、code、reasoning | Decoder-only | GPT, Llama, Claude, Qwen |
| Structured input → structured output（translation、summarization） | Encoder-decoder | T5, BART, Whisper |

Chỉ có trình giải mã trong nhiệm vụ ngôn ngữ, vì nó dễ dàng nhất để làm sạch quy mô, và đồng thời xử lý sự hiểu biết và tạo ra.

## 交付 nó
见 `outputs/skill-transformer-block-reviewer.md` Kỹ năng này sẽ được thực hiện theo đánh giá định dạng cấu hình năm 2026 Một việc triển khai khối biến thể mới,并标记缺失部分(pre-norm、RoPE、RMSNorm、GQA、FFN expansion ratio)

## 练习
1. **Easy.**统计你的编码_block 在 `d_model=512, n_heads=8, ffn_expansion=4, swiglu=True`时的参数──通过实现该块并使用 `sum(p.numel() for p in block.parameters())`验证。
2. **Medium.**Từ sau chuẩn  chuyển đổi sang trước chuẩn 初始化两者, và nhập ngẫu nhiên 上测量堆叠 12层后的激活规范 应会爆炸; trước chuẩn 应保持有界──
3. **Hard.**Trong nhiệm vụ sao chép đồ chơi`x`(c) thực hiện một bộ mã hóa-tài mã 4 tầng  đào tạo 100 bước  báo cáo mất  đổi thành RMSNorm + SwiGLU + RoPEloss có phải là giảm?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Block | “一个 transformer layer” | norm + attention + norm + FFN 的 stack，并包在 residual connections 中。 |
| Residual | “Skip connection” | `x + f(x)` output；让 gradients 能够流过 deep stacks。 |
| Pre-norm | “先 normalize，不是之后” | 现代形式：`x + sublayer(LN(x))`。无需 warmup 技巧也能训练得更深。 |
| RMSNorm | “没有 mean 的 LayerNorm” | 除以 RMS；少一个 op，经验稳定性相同。 |
| SwiGLU | “大家都切换过去的 FFN” | `Swish(W1 x) ⊙ W3 x → W2`。在 LM ppl 上优于 ReLU/GELU。 |
| Cross-attention | “decoder 如何看到 encoder” | Q 来自 decoder、K/V 来自 encoder outputs 的 MHA。 |
| FFN expansion | “中间 MLP 有多宽” | hidden-size 与 d_model 的比率，通常为 4（LayerNorm）或 2.6（SwiGLU）。 |
| Bias-free | “去掉 +b 项” | 现代 stacks 在线性层中省略 biases；ppl 略有提升，model 更小。 |

## 延伸阅读
- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) Định dạng khối nguyên thủy
- [Xiong et al. (2020). On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745)Tại sao chuẩn trước ở cấp độ sâu hơn chuẩn sau?
- [Zhang, Sennrich (2019). Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467) RMSNorm。
- [Shazeer (2020). GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202) SwiGLU 论文。
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) khối chỉ có decoder canonical 2026
