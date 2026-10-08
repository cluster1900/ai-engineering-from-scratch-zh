# Tam Transformer  Kodlayıcı + Dekodör

> Dikkat, başlıca nokta. Diğer tüm kalıntılar, normalleşme, ileriye geçme, çapraz dikkat, onu derin bir şekilde toplayabilmeni sağlıyor.

**Type:** Build
**Languages:** Python
**先修要求:**7 · 02 aşaması (Öz dikkat), 7 · 03 aşaması (Büyük baş dikkat), 7 · 04 aşaması (Müzik kodlama)
**Time:** ~75 minutes

## 问题
单个注意层是特征提取器,不是一个模型――每层一次对语言的容量不够――你需要深度,而如果没有正确管线,深度会失效――

2017 Vaswani makalesi, bir dikkat katmanını toplayable bloğlara çevirerek  altı tasarım kararı içeriyor. Bu arada, only encoder (BERT) only decoder (GPT) encoder-decoder (T5) onso bir yapı üzerine kurulmuştur. 2026 yılına kadar, bu bloklar modified olmuştur. RMSNorm SwiGLU pre-norm RoPE, ama yapı tamamen aynıdır.

Bu ders bu yapı hakkında konuşuyor. Sonraki dersler özel olarak başlatılacak.

## 概念
![Encoder and decoder block internals, wired](../assets/full-transformer.svg)

### 六个组成部分

1. **Embedding + positional signal.**Tokens → Vectors──Position 通过 RoPE(现代) 或 sinusoidal(经典)注入──
2. **Self-attention.**Her pozisyon diğer pozisyonlara katılır.
3. **Feed-forward network (FFN).**按位置 作用的两层 MLP:`W_2 · activation(W_1 · x)`❖默认 genişleme oranı = 4×。
4. **Residual connection.** `x + sublayer(x)`Yoksa, gradientler yaklaşık 6 kat sonra kaybolur.
5. **Layer normalization.** `LayerNorm`Ya da`RMSNorm`(现代) ―― sabit kalan akım。
6. **Cross-attention (decoder only).**Dekoderden gelen sorular, anahtarlar ve kodlayıcı çıkışından gelen değerler

### Kodlayıcı blok(BERT、T5 kodlayıcı 使用)

```
x → LN → MHA(self) → + → LN → FFN → + → out
                     ^              ^
                     |              |
                     └── residual ──┘
```

Kodlayıcı iki yönlü. Maske yok. Tüm pozisyonlar tüm pozisyonları görebiliyor.

### Dekodör blokı(GPT、T5 dekodör kullan)

```
x → LN → MHA(masked self) → + → LN → MHA(cross to encoder) → + → LN → FFN → + → out
```

Dekodör Her blok üç alt katman vardır. Orta olan çeli dikkat  is bilgi kodör 流向 dekoder 唯一位置.

### Normalden önce vs. normalden sonra

Önemli bir yazı:`x + sublayer(LN(x))`vs `LN(x + sublayer(x))`▽Post-norm  2019 yılının yaklaşıkında kayboldu eğer dikkatli bir ısınma yoksa, çok derin bir şekilde eğitilmek zor olacaktır―Pre-norm 在子层 *之前* 使用 `LN`) is 2026 yılının belirtilmiş seçeneği:Llama、Qwen、GPT-3+、Mistral 都使用它──

### 2026 yılının modernleşme bloğu

Vaswani 2017 kullanımı LayerNorm + ReLU。现代 stack  replaced 两者──生产级块 实际看起来是这样:

| Component | 2017 | 2026 |
|-----------|------|------|
| Normalization | LayerNorm | RMSNorm |
| FFN activation | ReLU | SwiGLU |
| FFN expansion | 4× | 2.6×（SwiGLU 使用三个 matrices，总参数量匹配） |
| Position | Sinusoidal absolute | RoPE |
| Attention | Full MHA | GQA（或 MLA） |
| Bias terms | Yes | No |

RMSNorm LayerNorm'un ortalama merkeziyetini kaybetti, hesaplama tasarrufu yaptı ve deneyimden görünce en az aynı şekilde sabitledi.`Swish(W1 x) ⊙ W3 x`) Llama、PaLM 和 Qwen 论文中稳定优于 ReLU/GELU FFN,ppl 约提升 0.5 个点──

### Parametre sayısı

Bir kişi için.`d_model = d`且 FFN genişleme 为 `r`Çatış:

- MHA:`4 · d²`(Q, K, V, O projeleri)
- FFN (SwiGLU): `3 · d · (r · d)`- Evet .`3rd²`
- Normalar: 可忽略

- Evet .`d = 4096, r = 2.6, layers = 32`(大致对应 Llama 3 8B)`32 · (4·4096² + 3·2.6·4096²) ≈ 32 · (16 + 32) M = ~1.5B parameters per layer × 32 ≈ 7B`(Yeni eklemeler ve baş) ◊ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧ ̧


observer a vector 如何流过单个块:Atention 在位置之间混合信息,residual 把信号继续向前携带,FFN 变化,而规则 让残流 保持稳定──

```figure
transformer-block
```

## Yapın onu.
### 步骤 1: yapı taşları

Uygulamayı Ders 03 中中的小型 `Matrix`sınıf(Özgürlük için bu dosyaya kopyoluyor):

- `layer_norm(x, eps=1e-5)` 减去 demek,除以 std。
- `rms_norm(x, eps=1e-6)`RMS dışında.
- `gelu(x)`和 `silu(x) * W3 x`(Süylü)
- `ffn_swiglu(x, W1, W2, W3)`- Evet.
- `encoder_block(x, params)`和 `decoder_block(x, enc_out, params)`- Evet.

完整线路 见 `code/main.py`- Evet.

### 步骤 2: tel bir iki katlı kodlayıcı ve iki katlı dekodör

Onları toplayın.                                                                                                                                                                                                                                                             

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

### 步骤 3: 在 oyuncak örneği 上运行 前進

输入一个 6-token kaynağı 和一个 5-token hedefi──验证输出形 是 `(5, vocab)`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖

### 步骤 4: RMSNorm + SwiGLU olarak değiştir

RMSNorm 和 SwiGLU 替换 LayerNorm 和 ReLU-FFN──确认形状 仍然匹配──这是2026年的现代化,只需要一次函数 替换──

## Kullan
PyTorch/TF referans uygulamalar:`nn.TransformerEncoderLayer`- Evet.`nn.TransformerDecoderLayer` ama 2026 yılının çoğu kendi kendini gerçekleştirme blokları olacak, çünkü:

- Flash Dikkat, dikkat içinde kullanılır, değil geçiyor.`nn.MultiheadAttention`- Evet.
- GQA / MLA 不在 stdlib referans 中──
- RoPE、RMSNorm、SwiGLU değil PyTorch öntanımlıları。

HF `transformers`Açık bir referans blokları var, okumaya değer:`modeling_llama.py`2026 yılında sadece kanonik dekodör blokları var. 500 bit, tam anlamıyla okumaya değer.

**Encoder vs decoder vs encoder-decoder — 什么时候选择：**

| Need | Pick | Example |
|------|------|---------|
| Classification、embeddings、基于文本的 QA | Encoder-only | BERT, DeBERTa, ModernBERT |
| Text generation、chat、code、reasoning | Decoder-only | GPT, Llama, Claude, Qwen |
| Structured input → structured output（translation、summarization） | Encoder-decoder | T5, BART, Whisper |

Dekoder-sadece, dil görevlerinde kazanılır, çünkü en kolay olarak temiz ölçekleştirilir ve aynı zamanda anlayış ve jenerasyonla işlenir.

## - Söyle.
Görüyorum .`outputs/skill-transformer-block-reviewer.md`◊ Bu beceri 2026 yılının standart konutlama incelemesine göre yeni bir transformatör blok uygulaması,并标记缺失部分(pre-norm、RoPE、RMSNorm、GQA、FFN genişleme oranı) ◊

## 练习
1. **Easy.**统计你的编码_block 在 `d_model=512, n_heads=8, ffn_expansion=4, swiglu=True`时的参数──通过实现该区块并使用 `sum(p.numel() for p in block.parameters())`验证。
2. **Medium.**Post-norm 切换到pre-norm──初始化两者,并随机输入 上测量堆叠 12层后的激活norm──后的激活应会爆炸;前的激活应保持有界──
3. **Hard.**Oyuncak kopyası görevi içinde`x`) 4 katlı bir kodlayıcı-dekoder gerçekleştirmek için. 100 adımlar eğitimi. Rapor kaybı. RMSNorm + SwiGLU + RoPE  kaybı mı düştü?

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
- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) 原始 blok özellikleri
- [Xiong et al. (2020). On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745) Neden pre-norm en derin seviyede post-norm daha iyidir.
- [Zhang, Sennrich (2019). Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467) RMSNorm。
- [Shazeer (2020). GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202) SwiGLU 论文。
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) kanonik 2026 sadece dekodör blokları。
