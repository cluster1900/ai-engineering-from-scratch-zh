# Mã hóa vị trí  Sinusoidal, RoPE, ALiBi

> Cảnh sát đối với排列不敏感──没有位置信号 时,猫坐在床和猫坐在床和猫在床会产生相同输出──三种算法修复它 每种都对位置的含义做了不同下注──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention)
**Time:** ~45 分钟

## Vấn đề

Scaled dot-product attention đối với顺序不敏感――attention matrix `softmax(Q K^T / √d) V`Bởi sự tương đồng đôi 计算得到──打乱 `X`Trong đó, các dòng, các dòng ra cũng sẽ bị rối loạn theo cách tương tự.

Đây không phải là một lỗi trong mô hình túi từ nhưng đối với ngôn ngữ, mã, âm thanh, video, cũng như bất kỳ thứ gì có ý nghĩa, nó là chết người.

Phương pháp sửa chữa là một cách nào đó đưa vị trí vào các nhúng.

1. **Absolute sinusoidal**(Vaswani 2017)。将 vị trí của `sin/cos`+ đến việc nhúng lên. 简单、不需要学习参数, nhưng đối với việc phân tích ngoài thời gian tập luyện 很差.
2. **RoPE — Rotary Position Embeddings**(Su 2021) ・按与位置 成比例的角度旋转 Q 和 K 矢量──直接在点产品中编码 *相对*位置──2026年的主流选择──
3. **ALiBi — Attention with Linear Biases**(Báo chí 2022) ・ hoàn toàn nhảy qua các nhúng; dựa trên khoảng cách 给注意分加上每头线性罚──长度抽插 极佳──

截至 2026年, hầu hết các mô hình mở biên giới đều sử dụng RoPE:Llama 2/3/4、Qwen 2/3、Mistral、Mixtral、DeepSeek-V3、Kimi。

## Khái niệm

![Sinusoidal absolute vs RoPE rotations vs ALiBi distance bias](../assets/positional-encoding.svg)

### Tự nhiên

预先计算一个形 为 `(max_len, d_model)`Matrix cố định`PE`- Có thể là:

```
PE[pos, 2i]   = sin(pos / 10000^(2i / d_model))
PE[pos, 2i+1] = cos(pos / 10000^(2i / d_model))
```

Sau đó trong sự chú ý  trước khi thực hiện `X' = X + PE[:N]`◊ Mỗi chiều đều là một hình âm có tần số khác nhau.`max_len`后会失败:当模型只见过位置02047 时,没有什么告诉它位置2048 会发生什么──

### RoPE

旋转 Q 和 K vector(không phải là các embedment)`(2i, 2i+1)`- Có thể là:

```
[q'_2i    ]   [ cos(pos·θ_i)  -sin(pos·θ_i) ] [q_2i   ]
[q'_2i+1  ] = [ sin(pos·θ_i)   cos(pos·θ_i) ] [q_2i+1 ]

θ_i = base^(-2i / d_head),  base = 10000 by default
```

Đối với vị trí`pos_k`应用相同旋转──dot sản phẩm `q'_m · k'_n`Sẽ trở nên phụ thuộc`(m - n)`của hàm:**attention score 只依赖 relative distance**, mặc dù quay là các vị trí tuyệt đối 索引的──漂亮的技巧──

扩展 RoPE: có thể缩放 `base`(NTK-aware、YaRN、LongRoPE), để trong trường hợp không tái tập, phân tích đến bối cảnh dài hơn.

### ALiBi

跳过嵌入 技巧──直接给注意点加偏见:

```
attn_score[i, j] = (q_i · k_j) / √d  -  m_h · |i - j|
```

Trong số đó `m_h`là nghiêng cụ thể đầu (ví dụ:`1 / 2^(8·h/H)`(■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■

### 2026 năm sẽ chọn gì

| Variant | Extrapolation | Training cost | Used by |
|---------|---------------|---------------|---------|
| Absolute sinusoidal | 差 | 免费 | original transformer, early BERT |
| Learned absolute | 无 | 很小 | GPT-2, GPT-3 |
| RoPE | 配合 scaling 时很好 | 免费 | Llama 2/3/4, Qwen 2/3, Mistral, DeepSeek-V3, Kimi |
| RoPE + YaRN | 极佳 | fine-tune stage | Qwen2-1M, Llama 3.1 128K |
| ALiBi | 极佳 | 免费 | BLOOM, MPT, Baichuan |

RoPE 胜出, là vì nó có thể trực tiếp đưa vào sự chú ý và không thay đổi kiến trúc, có thể mã hóa vị trí tương đối, và nó `base`Hyperparameter vì điều chỉnh ngữ cảnh dài  đã cung cấp một vòng quay rõ ràng.


```figure
rope-explorer
```

## Hãy xây dựng nó

### Bước 1: mã hóa hình âm

见 `code/main.py`△4 行计算:

```python
def sinusoidal(N, d):
    pe = [[0.0] * d for _ in range(N)]
    for pos in range(N):
        for i in range(d // 2):
            theta = pos / (10000 ** (2 * i / d))
            pe[pos][2 * i]     = math.sin(theta)
            pe[pos][2 * i + 1] = math.cos(theta)
    return pe
```

Trong lớp chú ý đầu tiên, nó sẽ được thêm vào các matrix nhúng lên.

### Bước 2: 应用于 Q、K của RoPE

RoPE 会在 Q 和 K 上原地操作──对对对对对:

```python
def apply_rope(x, pos, base=10000):
    d = len(x)
    out = list(x)
    for i in range(d // 2):
        theta = pos / (base ** (2 * i / d))
        c, s = math.cos(theta), math.sin(theta)
        a, b = x[2 * i], x[2 * i + 1]
        out[2 * i]     = a * c - b * s
        out[2 * i + 1] = a * s + b * c
    return out
```

关键: đối với vị trí `m`của Q và vị trí `n`K  ứng dụng cùng một hàm. Các sản phẩm chấm của chúng sẽ được tạo ra trên mỗi cặp phối hợp.`cos((m-n)·θ_i)`因子──Atention 免费学到相对位置──

### Bước 3: Albi Bi nghiêng và thiên vị

```python
def alibi_bias(n_heads, seq_len):
    # slope_h = 2 ** (-8 * h / n_heads) for h = 1..n_heads
    slopes = [2 ** (-8 * (h + 1) / n_heads) for h in range(n_heads)]
    bias = []
    for m in slopes:
        row = [[-m * abs(i - j) for j in range(seq_len)] for i in range(seq_len)]
        bias.append(row)
    return bias  # add to attention scores before softmax
```

sẽ`bias[h]`Chuyện này là chuyện gì?`h`của `(seq_len, seq_len)`Matrix điểm chú ý 上, sau đó là softmax──

### Bước 4: 验证 thuộc tính tương đối khoảng cách của RoPE

选两个随机向量 `a, b`✿先按 `(pos_a, pos_b)`Chuyển lại`(pos_a + k, pos_b + k)`旋转──两个点产品 必须在浮点错误内相等──这个性质就是RoPE的全部意义它对绝对的抵消不变,只关心相对差距──

## Sử dụng nó

PyTorch 2.5+`torch.nn.functional`中提供 RoPE tiện ích。 Hầu hết sản xuất代码使用 `flash_attn`Hoặc`xformers`, RoPE sẽ được sử dụng trong hạt nhân chú ý

```python
from transformers import AutoModel
model = AutoModel.from_pretrained("meta-llama/Llama-3.2-3B")
# model.config.rope_scaling → {"type": "yarn", "factor": 32.0, "original_max_position_embeddings": 8192}
```

**2026 年的 Long-context 技巧：**

- **NTK-aware interpolation。**Từ 4K  mở rộng đến 16K + 时,将 `base`重新缩放为 `base * (scale_factor)^(d/(d-2))`
- **YaRN。**Hơn thông minh hơn, có thể trong bối cảnh dài Ưu giữ sự chú ý entropy.
- **LongRoPE。**Microsoft 2024 年方法, sử dụng tìm kiếm tiến hóa cho mỗi chiều kích  chọn các yếu tố quy mô.
- **Position interpolation + fine-tuning。**Chỉ cần theo nhân tố mở rộng 缩小 vị trí,并 tinh chỉnh 15B token ∙

## Chuyển nó

见 `outputs/skill-positional-encoding-picker.md`◊This skill 会根据目标背景长度,外分需求和培训预算,为新模型选择编码策略.

## Các bài tập

1. **Easy。**sẽ`max_len=512, d=128`của sinusidal `PE`Matrix 绘制为热图──确认随着 chiều kích chỉ số 增大,条条 变宽的图案──
2. **Medium。**实现 NTK- nhận thức RoPE quy mô. trên dọc 256 của chuỗi 上训练 nhỏ LM, sau đó trên dọc 1024 上分别测试有规模和无规模的情况──测量困惑──
3. **Hard。**Trong cùng một mô-đun chú ý thực hiện ALiBi và RoPE. Trong các chuỗi dài 512 trên sử dụng nhiệm vụ sao chép.

## Các điều khoản chính

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Positional encoding | “告诉 attention 顺序” | 添加到 embeddings 或 attention 中、用于编码 position 的任意 signal。 |
| Sinusoidal | “最初那个” | 以 geometric frequencies 加到 embeddings 上的 `sin/cos`；不能 extrapolate。 |
| RoPE | “Rotary embeddings” | 按 position-dependent angle 旋转 Q、K；dot product 编码 relative distance。 |
| ALiBi | “Linear bias trick” | 将 `-m·\|i-j\|` 加到 attention scores；不需要 embedding，extrapolation 很强。 |
| base | “RoPE 的旋钮” | RoPE 中的 frequency scaler；增大它可在 inference 时扩展 context。 |
| NTK-aware | “一种 RoPE scaling trick” | 重新缩放 `base`，让 context 扩展时 high-frequency dims 不会被挤压。 |
| YaRN | “高级那个” | 保留 attention entropy 的 per-dimension interpolation+extrapolation。 |
| Extrapolation | “能在训练长度之外工作” | position scheme 能否在训练时见过的 `max_len` 之外给出正确输出？ |

## Đọc thêm

- [Vaswani et al. (2017). Attention Is All You Need §3.5](https://arxiv.org/abs/1706.03762) 原始 sinusoidal──
- [Su et al. (2021). RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864) giấy RoPE。
- [Press, Smith, Lewis (2021). Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409) ALiBi。
- [Peng et al. (2023). YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071) trạng thái công nghệ RoPE quy mô。
- [Chen et al. (2023). Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595) Meta của Llama 2 giấy ngữ cảnh dài
- [Ding et al. (2024). LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens](https://arxiv.org/abs/2402.13753) Microsoft 方法, được Phi-3-Long sử dụng, và sử dụng nó 部分引用。
- [HuggingFace Transformers — `modeling_rope_utils.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_rope_utils.py) Các loại quy mô RoPE quy mô:
