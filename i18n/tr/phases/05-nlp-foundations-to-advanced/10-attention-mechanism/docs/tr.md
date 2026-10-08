# Dikkat Mekanizması  突破

> Dekoder bir baskı özetini ayırt etme gücüyle değil, tüm kaynağı incelemeye başlar.

**Type:** Build
**Languages:** Python
**先修要求：**5 . aşama · 09 .
**Time:** ~45 分钟

## 问题

Ders 09: Bir kez kullanılabilir bir başarısızlık sonucu. Bir GRU kodlayıcı-dekodörü, oyuncak kopyası  görev üzerinde eğitilmiştir, 5 saat doğruluk %89'a, uzunluk %80'e kadar, her zaman yakındır.

Bahdanau、Cho 和 Bengio 2014 yılında bir üçgen修复を出版しました. Sadece son kodlayıcı durumunu dekodere bırakmayın, her kodlayıcı durumunu koruyun.`i`Çoğu zaman bu artışın bağlamı değişir ve her dekodör adımında değişir.

İşte tam fikir budur. Transformers  genişletti. Kendi dikkatini tek bir diziye uygula. Çoklu başlı dikkatini ve onu çalıştırmayı sürdür. Ancak 2014'te bir şişe kırıldı.

## 概念

![Bahdanau attention: decoder queries all encoder states](../assets/attention.svg)

Her dekodör adımında `t`- ...

1. kullanın前一个解码隐藏状态 `s_{t-1}` olarak **query**- Evet.
2. Her kodlayıcıyla gizli bir durumda olacak .`h_1, ..., h_T`打分──每个编码器 位置一个 skalar──
3. Notlara göre yumuşaklık, dikkat çekme.`α_{t,1}, ..., α_{t,T}`, toplamı 1 olarak.
4. Bağlantı vektörü `c_t = Σ α_{t,i} * h_i`◊encoder devletleri 的加权平均──
5. Dekodör 接收 `c_t`Bir önceki çıkış simgesi, bir sonraki simgesi oluşturmak.

加权平均才是重点──当 decoder 需要把"Je" 翻译成"I"时,它让"Je"上方的编码状态 权重大,其他位置权重小──当它需要"not"时,它让"pass"权重大──文本向量 在每一步都会重塑──

## Şekiller (((最容易咬人的地方)

Bu her dikkat uygulaması ilk kez yanlış bir şekilde yapılıyor.

| Thing | Shape | Notes |
|-------|-------|-------|
| Encoder hidden states `H` | `(T_enc, d_h)` | 如果是 BiLSTM，`d_h = 2 * d_hidden` |
| Decoder hidden state `s_{t-1}` | `(d_s,)` | 一个 vector |
| Attention score `e_{t,i}` | scalar | 每个 encoder 位置一个 |
| Attention weight `α_{t,i}` | scalar | 对所有 `i` 做 softmax 之后 |
| Context vector `c_t` | `(d_h,)` | 与一个 encoder state 的 shape 相同 |

**Bahdanau（additive）score。** `e_{t,i} = v_α^T * tanh(W_a * s_{t-1} + U_a * h_i)`- Evet.

- `s_{t-1}`Şekil `(d_s,)`- Evet .`h_i`Şekil `(d_h,)`- Evet.
- `W_a`Şekil `(d_attn, d_s)`- Evet.`U_a`Şekil `(d_attn, d_h)`- Evet.
-                                                                                                                                                                                                                                                               `(d_attn,)`- Evet.
- `v_α`Şekil `(d_attn,)`❖ `v_α`İç ürünleri bir ölçekle küçültülür.**这就是 `v_α` 的作用。**Büyü değil. Dikkat-dim vektörü'nü skalar skor projeksiyona dönüştürüyor.

**Luong（multiplicative）score。**Üç değişim:

- `dot`- Evet .`e_{t,i} = s_t^T * h_i`❖ talep`d_s == d_h`Eğer kodlaman iki yönlüse, atla.
- `general`- Evet .`e_{t,i} = s_t^T * W * h_i`, içinden `W`Şekil `(d_s, d_h)`❖ Dörtlük ve benzeri kısıtlamaları kaldırmak
- `concat`Asıl olarak Bahdanau 形式── çok az kullanılır, çünkü öncekiler daha ucuz──

**一个值得点名的 Bahdanau / Luong gotcha。**Bahdanau 使用 `s_{t-1}`(生成当前 word *之前* 的解码状态)。Long 使用 `s_t`(生成*後*的状态) ―― onları bir araya getirmek çok zor bir hata düzeni oluşturur.


```figure
attention-heatmap
```

## Yapın onu.

### 步骤 1: katkı

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

Üstüne bakıp şekilleri kontrol et.`encoder_states`Şekil `(T_enc, d_h)`- Evet.`projected_enc`Şekil `(T_enc, d_attn)`- Evet.`projected_dec`Şekil `(d_attn,)`, yayınlanacak.`combined`Şekil `(T_enc, d_attn)`- Evet.`scores`Şekil `(T_enc,)`- Evet.`weights`Şekil `(T_enc,)`- Evet.`context`Şekil `(d_h,)`Yayınlayabilirim.

### 2 adım: Luong dot 和 general

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

Bu yüzden Luong'un kağıdı oluştu. Çoğu görevde de aynı derecede doğru, kod daha azdır.

### 步骤 3: Tam bir sayısal değer örneği

给定三个编码状态 ((大致对应 "cat"、"sat"、"mat") 以及一个最接近第一状态的编码状态,注意分布会集中在位置0――如果编码状态 移动到更接近最后一个编码状态,注意就会移动到位置2――文本向量会随之跟踪――

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

İlk adım, kazanmak, sonra da dekodör durumunu daha yakın bir şekilde değiştirmek, ağırlıkların nasıl hareket ettiğini gözlemlemek.

### 4 adım: Transformerlerin Köprüleri

Üstünü yaz:

- **Query**= dekodör durumu `s_{t-1}`
- **Key**= kodlayıcı durumları((हमने来打分的对象)
- **Value**= kodlayıcı durumlar((

Klasik dikkat içinde, anahtarlar ve değerler aynı şeydir. Kendine dikkat ederek onları ayırır: bir dizi sorguyu yapabilirsiniz. Kendine, K ve V için, farklı öğrenilmiş projeksiyonlar kullanın.

Matematik aynıdır. Şekiller aynıdır. Bahdanau dikkatinden, ölçekli nokta- ürün dikkatine kadar, öğretim hareketleri, temel olarak sadece notasyonlardır.

## Kullan

PyTorch ve TensorFlow  doğrudan dikkat sağlar.

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

Bu bir transformatör dikkat katmanı. Sorgu seri 5 pozisyon, anahtar/değer seri 10 pozisyon, her biri 128 boyutlu, 8 başlı.`output`Yeni bağlamlı sorular.`weights`Görülebilir 5x10 uyumlu bir matris.

### Klasik dikkat 什么时候仍然重要

- Öğrenim: Tek başlı, tek katmanlı, RNN'ye dayalı bir sürüm
- Transformörler 放不下 cihazın üzerinde sırası 任务。
- Bahdanau'nun kurallarını bilmemek için, onu okuyacaksın.
- MT'de ince parçacıklık ayarlama analizi.Tranformör modellerinde bile çırpılmış dikkat ağırlıkları yorumlama aracıdır.

### Dikkat ağırlığı açıklama gibi 陷

Dikkat ağırlıkları görünce açıklanabilir. Bunlar, bir konumdan diğerine ve bir yere göre ağırlıklar. Çizmek için dışarı çıkabilirsiniz.

它们没有看起来那么解释──Jain 和 Wallace(2019) gösterdi ki, bazı görevler arasında, dikkat dağılımları değiştirilebilir, herhangi bir alternatif programın değiştirilebilir, model tahminlerini değiştirmez──ablation yok veya karşı gerçekli bir kontrol yok, asla dikkat ağırlıklarını kullanmayın 报告为推理证──

## Yayınla

保存为 `outputs/prompt-attention-shapes.md`- ...

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

1. **Easy.** gerçekleştirmek `softmax`masking, make encoder 中的填充令子 获得零注意重量──在包含可变长度序列的批上测试──
2. **Medium.**Luong ' a ver .`general`形式添加多头注意──把 `d_h`Çıkarılmak`n_heads`组, her baş 运行注意,然后连锁──验证单头 情况与你之前的实现一致──
3. **Hard.**Ders 09'da oyuncak kopyası  görev üzerinde eğitim bir Bahdanau dikkatli GRU kodlayıcı-dekoder--- çizim doğruluk vs dizi uzunluğu--- dikkatsizlik temel çizgi ile karşılaştırmak--- dikkatli olmayanlık farkı arttırmak için uzunluk artışı görmelisiniz, bu dikkatin arttığını doğruladı  kaldırdı ︎

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Attention | 看东西 | 对 value sequence 做加权平均，weights 由 query-key similarity 计算。 |
| Query, Key, Value | QKV | 三个 projections：Q 发问，K 是要匹配的内容，V 是要返回的内容。 |
| Additive attention | Bahdanau | Feed-forward score: `v^T tanh(W q + U k)`。 |
| Multiplicative attention | Luong dot / general | Score 是 `q^T k` 或 `q^T W k`。更便宜，在大多数任务上 accuracy 相同。 |
| Alignment matrix | 好看的图 | Attention weights 作为 `(T_dec, T_enc)` 网格。读取它可以看到 model attend 到了什么。 |

## 延伸阅读
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)Bu makale.
- [Luong, Pham, Manning (2015). Effective Approaches to Attention-based Neural Machine Translation](https://arxiv.org/abs/1508.04025) 三种分数变体 及其比较──
- [Jain and Wallace (2019). Attention is not Explanation](https://arxiv.org/abs/1902.10186) 可解释性注意项──
- [Dive into Deep Learning — Bahdanau Attention](https://d2l.ai/chapter_attention-mechanisms-and-transformers/bahdanau-attention.html)PyTorch'ın kullanılabilirliği yürüyüş yoluyla
