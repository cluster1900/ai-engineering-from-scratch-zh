# Từ零构建 Transformer  Capstone 项目

> 十三节课──一个模型──不走捷径──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 01 到 13。不要跳过。
**Time:** 约 120 分钟

## 问题

Bạn đã đọc từng bài báo. Bạn đã thực hiện sự chú ý. Multi-head.

Đây là một nền tảng: trong một mô hình hóa ngôn ngữ cấp nhân vật  nhiệm vụ trên cùng đến cuối đào tạo một bộ biến đổi chỉ có trình giải mã nhỏ. Nó đọc Shakespeare. Nó tạo ra Shakespeare mới. Nó đủ nhỏ, có thể hoàn thành trong 10 phút trên máy tính xách tay. Nó cũng đủ chính xác, miễn là bạn thay đổi thành một tập dữ liệu lớn hơn và thực hiện đào tạo lâu hơn, bạn có thể có được một LM thực sự.

Đây là chương trình nanoGPT── nó không phải là nguyên bản  Karpathy năm 2023 NanoGPT hướng dẫn là mỗi học sinh sẽ viết ít nhất một lần thực hiện tham khảo── chúng tôi theo hình dạng của nó, và tái tổ chức xung quanh nội dung đã được nói trong chương trình này──

## 概念

![Transformer-from-scratch block diagram](../assets/capstone.svg)

架构标注如下:

```
input tokens (B, N)
   │
   ▼
token embedding + positional embedding  ◀── Lesson 04 (RoPE option)
   │
   ▼
┌──── block × L ────────────────────┐
│  RMSNorm                          │  ◀── Lesson 05
│  MultiHeadAttention (causal)      │  ◀── Lesson 03 + 07 (causal mask)
│  residual                         │
│  RMSNorm                          │
│  SwiGLU FFN                       │  ◀── Lesson 05
│  residual                         │
└────────────────────────────────── ┘
   │
   ▼
final RMSNorm
   │
   ▼
lm_head (tied to token embedding)
   │
   ▼
logits (B, N, V)
   │
   ▼
shift-by-one cross-entropy            ◀── Lesson 07
```

### Chúng tôi giao hàng gì

- `GPTConfig` 统一配置 tất cả các siêu tham số của địa điểm.
- `MultiHeadAttention` nguyên nhân, đợt,并带有可选的闪光风格路径(PyTorch 的 `scaled_dot_product_attention`(■)
- `SwiGLUFFN` 现代 FFN。
- `Block` tiền chuẩn, dùng dư thừa 包裹注意 + FFN。
- `GPT` nhúng, khối đống, đầu LM, tạo ra
- Sử dụng vòng tập luyện của AdamW、cosine LR、gradient clipping
- Shakespeare 文本上的char-level tokenizer──

### Chúng tôi không giao hàng gì

- RoPE  Bài học 04 已从概念上实现──这里为了简单使用学到的位置嵌入──练习会要求你换成RoPE──
- Trong suốt quá trình sinh sản KV cache  Mỗi bước thế hệ sẽ được sử dụng trong prefix hoàn chỉnh trên tính lại sự chú ý.
- Flash Attention  PyTorch 2.0+ 会在输入匹配时自动发送;我们使用 `F.scaled_dot_product_attention`
- MoE  Mỗi khối sử dụng một FFN riêng lẻ. Bạn đã thấy MoE trong Bài học 11.

### 目标指标

Trên máy tính xách tay Mac M2, một GPT 4 tầng 4 đầu d_model=128 trong `tinyshakespeare.txt`上训练 2.000 bước:

- Giảm tập luyện trong khoảng 6 phút từ khoảng 4,2... ngẫu nhiên... đến khoảng 1,5...
- 采样输出看起来具有莎士比亚的形态:古风词汇、换行,以及像 ROMEO: 这样专名称会出现──
- Val loss (đã được giữ lại 10% cuối cùng của văn bản) gần như theo sau khi mất tập luyện; trong quy mô/ ngân sách này, không có quá phù hợp.


```figure
n5-block-stack
```

##  xây dựng nó

本课使用 PyTorch。安装 `torch`(CPU build 即可)`code/main.py`❖ 脚本会处理:

- Nếu thiếu thì xuống `tinyshakespeare.txt`(或读取本地副本)
- Các thẻ char cấp bằng byte.
- 90/10 của tàu/val chia rẽ.
- Trong hỗ trợ phần cứng sử dụng bf16 tự độngcast vòng đào tạo.
-  tập luyện hoàn thành sau khi lấy mẫu:

### 步骤 1: dữ liệu

```python
text = open("tinyshakespeare.txt").read()
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
encode = lambda s: [stoi[c] for c in s]
decode = lambda xs: "".join(itos[x] for x in xs)
```

65 个唯一字符──极小的词汇──适合4byte vocab_size──没有 BPE,也没有代币器 麻烦──

### 步骤 2: mô hình

参见 `code/main.py`◊ block này là bài học 05  pre-norm  RMSNorm  SwiftGLU  nguyên nhân MHA──4/4/128  số lượng các tham số: khoảng 800K──

### 步骤 3: vòng đào tạo

随机取一批长度为 256 个符号窗口―― 前进―― 转变-by-one 横向-entropy―― 后退―― AdamW step―― Log―― 重复――

```python
for step in range(max_steps):
    x, y = get_batch("train")
    logits = model(x)
    loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()
    opt.zero_grad()
```

### 步骤 4: mẫu

Đặt một lệnh, lặp lại, từ top-p logits 中 mẫu, áp dụng, rồi tiếp tục. 500 token.

### 步骤 5: đọc đầu ra

2000 bước:

```
ROMEO:
Away and mild will not thy friend, that thou shalt wit:
The chief that well shame and hath been his friends,
...
```

Đây không phải là Shakespeare, nhưng nó có hình dạng Shakespeare, với khoảng 800K tham số và máy tính xách tay, đây là thành công rõ ràng.

## Sử dụng nó

Đây là một kiến trúc tham chiếu. Để mở rộng nó thành một thứ thực sự có thể sử dụng, có ba hướng:

1. **更换 tokenizer。**Sử dụng BPE`tiktoken.get_encoding("cl100k_base")`(■) Kích thước của tiếng nói sẽ từ 65  nhảy lên khoảng 50.000 ■
2. **在更大的 corpus 上训练。**Sử dụng `OpenWebText`Hoặc`fineweb-edu`(HuggingFace) ―― 在单张A100 上用10B代币 训练一个125M-param GPT 大约需要24小时──
3. **添加 RoPE + KV cache + Flash Attention。**Bài tập sau đây sẽ hướng dẫn bạn hoàn thành từng bài tập.

Cuối cùng sẽ có được một GPT có tham số 125M, có thể tạo ra dòng 英文── nó không phải là mô hình biên giới── nhưng cùng một đường mã   只是更大 正是卡帕蒂、EleutherAI 和艾伦研究所在2026年用来训练研究检查点的方式──

## 交付 nó

参见 `outputs/skill-transformer-review.md` Kỹ năng này sẽ được nhắm vào chính xác của các bài học, kiểm tra một nhà biến đổi từ đầu thực hiện.

## 练习

1. **Easy.**运行 `code/main.py`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖`max_steps`Từ 2,000 改 thành 5,000  val mất liệu có tiếp tục cải thiện không?
2. **Medium.**用 RoPE 替换 được học được các embedment vị trí.`MultiHeadAttention`内部对 Q 和 K 应用转移──训练并验证 输出值 至少同样低──
3. **Medium.**Trong vòng lấy mẫu thực hiện cache KV── phân biệt trong trường hợp có cache và không có cache tạo ra 500 token──clock tường trên máy tính xách tay  nên nâng cao 520×──
4. **Hard.**给模型 添加第二个头,用来预测下一个加一个代币(MTP  Multi-Token dự đoán từ DeepSeek-V3);;联合训练;;¿ nó có ích không?
5. **Hard.**Sử dụng 4 chuyên gia MoE  thay thế mỗi khối trong mỗi FFN.

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| nanoGPT | “Karpathy 的 tutorial repo” | 最小化的 decoder-only transformer training code，约 300 LOC；canonical reference。 |
| tinyshakespeare | “标准 toy corpus” | 约 1.1 MB 文本；自 2015 年以来几乎每个 character-LM tutorial 都使用它。 |
| Tied embeddings | “共享 input/output matrix” | LM head weight = token embedding matrix 的转置；节省 parameters，并提升质量。 |
| bf16 autocast | “Training precision trick” | 用 bf16 运行 forward/back，在 fp32 中保留 optimizer state；自 2021 年以来成为标准做法。 |
| Gradient clipping | “阻止 spikes” | 将 global grad norm 限制在 1.0；防止 training blowups。 |
| Cosine LR schedule | “2020+ 默认选择” | LR 先线性上升（warmup），然后按 cosine 形状衰减到峰值的 10%。 |
| MFU | “Model FLOP Utilization” | 实际达到的 FLOPs / 理论峰值；2026 年 40% dense、30% MoE 已经很强。 |
| Val loss | “Held-out loss” | 在 model 从未见过的数据上计算 Cross-Entropy；overfit detector。 |

## 延伸阅读

- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/) 经典的注释实施.
