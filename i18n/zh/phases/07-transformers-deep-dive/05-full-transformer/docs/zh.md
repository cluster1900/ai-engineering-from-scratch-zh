# 完整变压器 编码器+解码器

> 关注是主角. 其他一切的残余,正常化,推进,跨度关注,让你能够把它堆积成很深的脚手架.

**Type:** Build
**Languages:** Python
**先修要求:**阶段7 · 02 (自我注意),阶段7 · 03 (多头注意),阶段7 · 04 (位置编码)
**Time:** ~75 minutes

## 问题
单个注意层是特征提取器,不是一个模型. 每层一次对语言的容量不够.

2017年 Vaswani 论文打包了六个设计决策,把一个注意层变成可堆叠的块.之后,每个变压器 (仅编码器 (BERT) ),仅编码器 (GPT) 编码器-编码器 (T5) 都继承了同一个骨架.到2026年,这些块已经改进了.

后续课程会专门展开07 讲编码器,07 讲解码器,08 讲编码器-解码器

## 概念
![Encoder and decoder block internals, wired](../assets/full-transformer.svg)

### 六个组成部分

1. **Embedding + positional signal.**标志 → 矢量──位置 通过 RoPE(现代) 或突形(经典) 注入──
2. **Self-attention.**每个位置都会参加其他位置.
3. **Feed-forward network (FFN).**按位置作用的两层MLP:`W_2 · activation(W_1 · x)`默认扩张比为4×。
4. **Residual connection.** `x + sublayer(x)`没有它,梯度在6层后会消失.
5. **Layer normalization.** `LayerNorm`或`RMSNorm`稳定残留流.
6. **Cross-attention (decoder only).**查询来自解码器,键和值来自编码器输出.

### 编码器块 ((BERT、T5编码器 使用)

```
x → LN → MHA(self) → + → LN → FFN → + → out
                     ^              ^
                     |              |
                     └── residual ──┘
```

编码器是双向的.没有掩饰. 所有位置都能看到所有位置.

### 解码器块 ((GPT、T5解码器 使用)

```
x → LN → MHA(masked self) → + → LN → MHA(cross to encoder) → + → LN → FFN → + → out
```

解码器 每块都有三个子层.中间那个是信息从编码器流向解码器的唯一位置. 在纯解码器的架构中,

### 标准前与标准后

开始的论文:`x + sublayer(LN(x))`其他`LN(x + sublayer(x))`〔2019年左右的后规则失去了. 如果没有仔细的加热,很难训练得很深.〔2019年左右的后规则失去了.〕`LN`) 是2026年的默认选择:Llama、Qwen、GPT-3+、Mistral 都使用它──

### 2026 年现代化区块

瓦斯瓦尼 2017 使用的是LayerNorm + ReLU──现代堆 替换了两者──生产级块 实际看起来是这样:

| Component | 2017 | 2026 |
|-----------|------|------|
| Normalization | LayerNorm | RMSNorm |
| FFN activation | ReLU | SwiGLU |
| FFN expansion | 4× | 2.6×（SwiGLU 使用三个 matrices，总参数量匹配） |
| Position | Sinusoidal absolute | RoPE |
| Attention | Full MHA | GQA（或 MLA） |
| Bias terms | Yes | No |

通过 RMSNorm 实现了LayerNorm 的平均中心化 (少一次减算),节省计算,并且从经验中看看至少同样稳定.`Swish(W1 x) ⊙ W3 x`) 在Llama、PaLM 和 Qwen 论文中稳定优于RLU/GELU FFN,ppl 约提升0.5个点.

### 参数数量

对于一个`d_model = d`且FFN扩大为`r`区块:

- 鱼类`4 · d²`预测量
- 转移: 转移:`3 · d · (r · d)`≈ ≈`3rd²`
- 规范: 可忽略

当 当`d = 4096, r = 2.6, layers = 32`总量为:`32 · (4·4096² + 3·2.6·4096²) ≈ 32 · (16 + 32) M = ~1.5B parameters per layer × 32 ≈ 7B`(再加上嵌入和头) 与已发布的计数相符


观察一个向量 如何流过单个块:注意位置之间混合信息,残留 把信号继续向前携带,FFN做变化,而规则 让残留流保持稳定.

```figure
transformer-block
```

## 构建它
### 步骤1:建筑块

使用课程 03 中的小小`Matrix`为了独立已复制到这个文件):

- `layer_norm(x, eps=1e-5)` 减去意思,除以 std。
- `rms_norm(x, eps=1e-6)`除以RMS──不减去意思──
- `gelu(x)`和 `silu(x) * W3 x`没有什么可言.
- `ffn_swiglu(x, W1, W2, W3)`,我知道.
- `encoder_block(x, params)`和 `decoder_block(x, enc_out, params)`,我知道.

完整的电线`code/main.py`,我知道.

### 步骤2:线程一个二层编码器和一个二层解码器

将它们堆叠起来.将编码输出传入每个编码器交叉注意. 在输出投影前添加最终的LN.

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

### 步骤3: 在玩具的例子上运行向前

输入一个6代标源和一个5代标目标――验证输出形状是`(5, vocab)`│不训练本课关注建筑,而不是损失──

### 步骤 4: 换成RMSNorm + SwiGLU

用RMSNorm 和 SwiGLU 替换LayerNorm 和 ReLU-FFN──确认形状仍然匹配──这就是2026年现代化,只需要一次功能 替换──

## 使用它
 PyTorch/TF 参考实施:`nn.TransformerEncoderLayer`,我知道.`nn.TransformerDecoderLayer`,但大多数2026年生产代码会自行实现,因为:

- 闪光注意力是在注意力内部调用,而不是通过`nn.MultiheadAttention`,我知道.
- 格卡/MLA 不在stdlib参考中──
- ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,

`transformers`需要阅读的参考区块:`modeling_llama.py`是2026年,只有可尼克式解码器的区块.

**Encoder vs decoder vs encoder-decoder — 什么时候选择：**

| Need | Pick | Example |
|------|------|---------|
| Classification、embeddings、基于文本的 QA | Encoder-only | BERT, DeBERTa, ModernBERT |
| Text generation、chat、code、reasoning | Decoder-only | GPT, Llama, Claude, Qwen |
| Structured input → structured output（translation、summarization） | Encoder-decoder | T5, BART, Whisper |

解码器-仅在语言任务中胜出,因为它最容易干净地尺度,同时处理理解和生成.

## 交付它
见`outputs/skill-transformer-block-reviewer.md`△该技能会根据2026年默认配置审查, 一个新的变压器块实施,并标记缺失部分(前标准、RoPE、RMSNorm、GQA、FFN扩展比) △

## 练习
1. **Easy.**统计你的编码器_区块 在 `d_model=512, n_heads=8, ffn_expansion=4, swiglu=True`时的参数──通过实现该区块并使用`sum(p.numel() for p in block.parameters())`验证.
2. **Medium.**从后规范转换到前规范.初始化两者,并随机输入上测量堆积 12层后的激活规范.
3. **Hard.**在玩具复制任务中`x`实现一个4层编码器-解码器――训练100步――报告损失――转换为RMSNorm + SwiGLU + RoPE损失 是否下降?

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
- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) 原始区块规格
- [Xiong et al. (2020). On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745)为什么在深层层面上,前规则比后规则优越.
- [Zhang, Sennrich (2019). Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467)        
- [Shazeer (2020). GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202)  论文──
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py)可信 2026 单独使用解码器的区块──
