# Çok Başlı Dikkat

> Bir dikkat başı Bir öğrenme bir ilişki.

**类型：**Yapım
**语言：**Python
**前置知识：**7. aşama · 02(Öz dikkatini sıfırdan)
**时间：**~ 75 dakika

## 问题

单个自我注意头 会计算一个注意矩阵――这个矩阵――捕捉一种关系,通常是能够在当前训练信号上最小化损失的那种关系――如果你的数据里主题verb agreement、co-reference、长距离演讲 和语法分断 全部纠在一起,单个头会把它们抹抹进单一的软最大分布,丢失一半信号――

2017 Vaswani makalesinde verilen düzeltme yöntem:并行运行多个注意功能,每个都有自己的Q、K、V预测,然后把输出拼拼起来──每个头都在维度为`d_model / n_heads`Daha küçük bir alanın içinde çalışmak.

Çok başlı dikkat, tüm Transformer'ın 2026 yılında belirlenmiş bir konumudır. Tek tartışma * kaç* baş kullanılması gerektiği, ayrıca anahtarlar ve değerler ile birlikte projelerin paylaşılmadığı konusunda.

## 概念

![Multi-head attention splits, attends, concatenates](../assets/multi-head-attention.svg)

**Split。**取形为 `(N, d_model)``X`△分别 projeksiyon 到形为 `(N, d_model)`Bu, bir değişim.`(N, n_heads, d_head)`, içinden `d_head = d_model / n_heads`❖ Çıkarıver`(n_heads, N, d_head)`- Evet.

**并行 Attend。**Bu yüzden her başın içinde işlevleri ve ürünleri dikkatle yapılır.`(N, d_head)`Bu kafalar yerleşimlerin farklı çocuk alanlarında çalışır ve dikkat hesaplamaları sırasında birbirleriyle iletişim kurmazlar.

**Concatenate 并 project。**Başları toplayacağım`(N, d_model)`Sonra da şekil olarak.`(d_model, d_model)`Öğrenilen çıkış matrisi `W_o`- Evet.`W_o`Başları                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

**为什么有效。**Her başlık özel hale gelebilir, gereksiz diğer başlıklara 争抢表征预算──20192024 yıllarındaki araştırma çalışmaları farklı başlık rollerini göstermiştir: pozisyon başlıkları、 önceki token başlığına bakanlar、 kopya başlıkları、 isimli varlık başlıkları、 indüksiyon başlıkları(koneks içinde öğrenmenin alt mekanizmasını oluştururlar)

**2026 年的变体谱系：**

| Variant | Q heads | K/V heads | Used by |
|---------|---------|-----------|---------|
| Multi-head (MHA) | N | N | GPT-2, BERT, T5 |
| Multi-query (MQA) | N | 1 | PaLM, Falcon |
| Grouped-query (GQA) | N | G (e.g. N/8) | Llama 2 70B, Llama 3+, Qwen 2+, Mistral |
| Multi-head latent (MLA) | N | compressed to low-rank | DeepSeek-V2, V3 |

GQA, modern bir standart programdır, çünkü buna göre yapılır.`N/G`KV-cache hafızasını azaltmak için, neredeyse tam bir kaliteyi korumak için MLA'yı daha da fazla, K/V'yi gizli alanlara sıkıştırmak için, hesaplama projesinde tekrar tekrar kullanmak için FLOP'ları tüketir, ancak daha fazla hafıza tasarruf eder.


```figure
multihead-split
```

## Yapın onu.

### 1 adım: Tek başlı dikkatimizden başları ikiye bölünmüş.

取 Ders 02 里的 `SelfAttention`, bir çift bölünmek / toplamak ile 包起来.`code/main.py`İçinde numpy 实现 vardır; logika如下:

```python
def split_heads(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n, n_heads, d_head).transpose(1, 0, 2)  # (heads, n, d_head)

def combine_heads(H):
    h, n, d_head = H.shape
    return H.transpose(1, 0, 2).reshape(n, h * d_head)
```

Bir kere yeniden şekillendirilmiş ve bir kere de transpose edilmiş.`nn.MultiheadAttention`Yapılacak şeyler.

### 步骤 2: baş başına 运行 ölçekli nokta- ürün dikkat

Her başın kendi parçalarına ulaşması için Q、K、V'ye dikkat et.

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

Gerçek bir cihazda,`Qh @ Kh.transpose(...)`Evet, bir tane.`bmm`◊GPU 看到的是形状为 `(heads, N, d_head) × (heads, d_head, N) -> (heads, N, N)`Tek bir partili çiftlik. Başları artırmak çok uygun.

### 步骤 3: Gruplandırılmış Sorgular Dikkat 变体

只有关键和值预测 会变──Q 获得 `n_heads`个群;K 和 V 获得 `n_kv_heads < n_heads`个 gruplar,并被重复以匹配:

```python
def gqa_project(X, W, n_kv_heads, n_heads):
    kv = split_heads(X @ W, n_kv_heads)       # (kv_heads, n, d_head)
    repeat = n_heads // n_kv_heads
    return np.repeat(kv, repeat, axis=0)      # (n_heads, n, d_head)
```

Bu hafıza tasarrufu yapar çünkü KV kasesi sadece saklanır.`n_kv_heads`份副本,而不是 `n_heads`份──Llama 3 70B  使用 64 个查询头 和 8 个 KV头,也就是 8× 的缓存 缩减──

### 4 adım: Her başın ne öğrendiğini dene.

Bir cümleyle 4 başla MHA'yı kullan.`(N, N)`Dikkat matrisi. Farklı başları göreceksin. Hatta rastgele başlangıçta bile.

## Kullan

PyTorch 中,一行版本:

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

**多少个 heads？**2026 yılından itibaren üretim modellerinin deneyimi kuralları:

| Model size | d_model | n_heads | d_head |
|------------|---------|---------|--------|
| Small (~125M) | 768 | 12 | 64 |
| Base (~350M) | 1024 | 16 | 64 |
| Large (~1B) | 2048 | 16 | 128 |
| Frontier (~70B) | 8192 | 64 | 128 |

`d_head` neredeyse her zaman 64 veya 128                                                                                                                                                                                                                                                           `sqrt(d_head)`256'dan daha yüksek, birçok küçük uzmanın kazancını kaybedeceksin.

## - Söyle.

Görüyorum .`outputs/skill-mha-configurator.md`◊ bu beceri, parametre bütçesine göre, dizi uzunluğu ve dağıtım hedefi, yeni Transformer için  baş sayımı,kv baş sayımı ve projeksiyon stratejisi için önerilmektedir.

## 练习

1. **简单。**Çekil`code/main.py`Orta MHA, sabit `d_model=64`Bu durumda`n_heads`1'den 16'ya değişmek. Sintez kopyalama görevi. Küçük bir katmanlı model çizmek. Daha fazla başlık.
2. **中等。**实现 MQA(All query heads 共享一个 KV head) ―― Ölçüm parametreleri sayısı 相比全 MHA 下降了多少──计算推断 时 N=2048 下 KV-cache size 缩小了多少──
3. **困难。**实现一个小的 版本的多头潜伏注意:把 K,V 压缩到级别-`r`KV'de gizli bir depolama, dikkat süresi 解压──`r`取到多少时,缓存内存会降到全MHA'nın 1/8 以下,同时质量仍然保持在验证的 1 bit 以内?

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
- [DeepSeek-AI (2024). DeepSeek-V2 Technical Report](https://arxiv.org/abs/2405.04434) MLA, ve neden bu cache hafızasında 
- [Olsson et al. (2022). In-context Learning and Induction Heads](https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html) Mekanistik açıdan bakmak başları 实际做了什么──
