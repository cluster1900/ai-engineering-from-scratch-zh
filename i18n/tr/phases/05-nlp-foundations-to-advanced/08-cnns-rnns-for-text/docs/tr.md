# Yazı içeren CNN ve RNN'ler

> Devrimler, n-gramlar, tekrarlar, 负责记忆, 两者都已被关注, 取代, 两者在受限硬件上仍然重要, 两者都已被关注, 取代, 两者在受限硬件上仍然重要, 两者都已被关注, 取代, 两者在受限硬件上仍然重要, 两者都已被关注, 取代, 两者在受限硬件上仍然重要, 两者仍在受限硬件上仍然重要, 两者仍在受限硬件上仍然重要, 两者仍在受限硬件上仍在受限硬件上, 两者仍在受限硬件上仍在受限, 两者仍在受限于受限于, 两者仍在受限于,两者仍在受限于,两者仍在受限于,两者仍在受限于,两者仍在受限于于,两者仍在于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于于

**Type:** Build
**Languages:** Python
**先修要求：**3 · 11 aşaması (PyTorch 入门), 5 · 03 aşaması (Küçük Sözleşmeler), 4 · 02 aşaması (Çıktırma)
**Time:** ~75 分钟

## 问题

TF-IDF 和 Word2Vec                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     `dog bites man`和 `man bites dog`❖ Sözcükler sinyal taşıma zamanı vardır.

Transformatörler gelmeden önce, iki tür mimarlık bu boşluğu doldurdu.

**用于文本的 Convolutional nets（TextCNN）。**1D sarsıntıları uygulamak için bir dizi kelime yerleştirme 序列inde kullanılır. 3 boyutlu filtreler öğrenilebilir bir trigram detektörüdür.

**Recurrent nets（RNN、LSTM、GRU）。**Bir kez bir token işleme,维护携带信息向前传播的隐藏状态──序列、带记忆、支持灵活输入长度── bunlar 2014 ile 2017 yılları arasında dizi modeli oluşturmayı yönlendirdi, ardından dikkat ortaya çıktı──

Bu ders iki yönü oluşturur ve dikkat çekmeyi teşvik eder.

## 概念

**TextCNN**(Kim, 2014) ―― Tokens 会被嵌入──宽度为 `k`1D dönüşümü`k`-gramların yerleştirmeleri 上滑动 filter,生成 feature map──对该地图做全球最大聚合会选出最强激活──把多个过器宽度的最大聚合输出拼接起来──送进分类器头──

Neden işe yarıyor? Bir filtre, bir n-gram öğrenilmelidir. Maksimum birleştirme, konum değişmez, bu yüzden "iyi değil" olarak yorumlarda başta veya ortasında aynı özelliği uygulayacaktır.

**RNN。**Her zaman adımında.`t`Gizli bir durum.`h_t = f(W * x_t + U * h_{t-1} + b)`                                                                                                                                                                                                                                                              `W`- Evet.`U`- Evet.`b`Zamanı.`T`Bu, tüm önbelleklerin özetini oluşturur.`h_1 ... h_T`上做 pooling ((maksim 、mean veya son)

Basit RNN'ler kaybolan derecelerden etkilenecek.**LSTM**增加门来决定忘记什么,储存什么,输出什么,从而稳定长序列中的梯度──**GRU**LSTM'yi iki kapıya basitleştirmek; parametre daha az ve gösterge yakınlıklı olarak

**Bidirectional RNNs**Bir RNN doğru yönde çalışır, diğerine ters yönde çalışır, sonra gizli durumları birleştirir.


```figure
rnn-unroll
```

## Yapın onu.

### 步骤 1: PyTorch 中的 TextCNN

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class TextCNN(nn.Module):
    def __init__(self, vocab_size, embed_dim, n_classes, filter_widths=(2, 3, 4), n_filters=64, dropout=0.3):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.convs = nn.ModuleList([
            nn.Conv1d(embed_dim, n_filters, kernel_size=k)
            for k in filter_widths
        ])
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(n_filters * len(filter_widths), n_classes)

    def forward(self, token_ids):
        x = self.embed(token_ids).transpose(1, 2)
        pooled = []
        for conv in self.convs:
            c = F.relu(conv(x))
            p = F.max_pool1d(c, c.size(2)).squeeze(2)
            pooled.append(p)
        h = torch.cat(pooled, dim=1)
        return self.fc(self.dropout(h))
```

`transpose(1, 2)`- Ben de .`[batch, seq_len, embed_dim]`变形为    değişim`[batch, embed_dim, seq_len]`Çünkü ...`nn.Conv1d`İçeri girme uzunluğunun ne olursa olsun, birleştirilmiş çıkışlar sabit büyüklükte.

### 步骤 2: LSTM sınıflandırıcısı

```python
class LSTMClassifier(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_classes, bidirectional=True, dropout=0.3):
        super().__init__()
        self.embed = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=bidirectional)
        factor = 2 if bidirectional else 1
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim * factor, n_classes)

    def forward(self, token_ids):
        x = self.embed(token_ids)
        out, _ = self.lstm(x)
        pooled = out.max(dim=1).values
        return self.fc(self.dropout(pooled))
```

Sıralama için, maksimum birleştirme genellikle son gizli durumdan daha iyi olur, çünkü uzun bir dizi sonundaki bilgiler son durumdan daha üstün olur.

### 步骤 3: kaybolan eğilimi 演示(直觉)

没有 gating 的 无法学习长距离依赖性──考虑一个玩具任务:预测 token `A`Evet, bir dizi içinde herhangi bir yerde.`A`1, sıradaki uzunluk 100 tane token ise, kaybın gradiyenti tekrarlayan ağırlığın 99 katını geçmesi gerekir. Eğer ağırlık 1'den küçükse, gradiyenti ortadan kayboluyor.

```python
def vanishing_gradient_sim(seq_len, recurrent_weight=0.9):
    import math
    return math.pow(recurrent_weight, seq_len)


# At weight=0.9 over 100 steps:
#   0.9 ^ 100 ≈ 2.7e-5
# The gradient from step 100 to step 1 is effectively zero.
```

LSTM'ler       **cell state**修正 this problem: It only has a positive interaction way through the network(forget gate will be scaled in multiplication way, but gradients still can along "highway" 流动)  GrUs use fewer parameters to do similar things── ikisi de 100+ step sequences'in antrenmanını sabitleştirebilir──

### 4 adım: Neden bu hala yeterli değil?

LSTM'ler bile olsa, üç sorun hâlâ var.

1. **Sequential bottleneck。**1000'lik bir dizi üzerinde eğitim almak için RNN'ye 1000'lik bir dizi ileri/geri adım gerekmektedir.
2. **Encoder-decoder setups 中的固定大小 context vector。**Dekoder sadece enkodlayıcının nihai gizli durumunu görebilir, ancak tüm girişleri sıkıştırır.
3. **Distant-dependency accuracy ceiling。**LSTM'ler  sıradan RNN'lerden iyidir, ancak 200+ adım üzerinden yayılması hala zordur                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

Dikkat, bu üç sorunu çözdük. Transformers, tekrarlanmayı tamamen ortadan kaldırdı.

## Kullan

PyTorch'in `nn.LSTM`- Evet.`nn.GRU`和 `nn.Conv1d`已生产准备――训练代码是标准的――

Hugging Face  önceden eğitilmiş yerleşimler sağlar, onları giriş katmanı olarak yerleştirebilirsiniz:

```python
from transformers import AutoModel

encoder = AutoModel.from_pretrained("bert-base-uncased")
for param in encoder.parameters():
    param.requires_grad = False


class BertCNN(nn.Module):
    def __init__(self, n_classes, filter_widths=(2, 3, 4), n_filters=64):
        super().__init__()
        self.encoder = encoder
        self.convs = nn.ModuleList([nn.Conv1d(768, n_filters, kernel_size=k) for k in filter_widths])
        self.fc = nn.Linear(n_filters * len(filter_widths), n_classes)

    def forward(self, input_ids, attention_mask):
        with torch.no_grad():
            out = self.encoder(input_ids=input_ids, attention_mask=attention_mask).last_hidden_state
        x = out.transpose(1, 2)
        pooled = [F.max_pool1d(F.relu(conv(x)), kernel_size=conv(x).size(2)).squeeze(2) for conv in self.convs]
        return self.fc(torch.cat(pooled, dim=1))
```

适用约束 kontrol listesini kullanmak için.

- **Edge / on-device inference。**带 GloVe embedings of TextCNN 比变压器 小10-100x── Eğer yerleştirme hedefinin bir telefonsa, bu kullanılması gereken bir yığın¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- **Streaming / online classification。**RNN 一次处理一个代币;transformers 需要完整序列──对实时输入文本,LSTMs 仍然胜出──
- **用于 baselines 的 tiny models。**Yeni görevlerde hızlı bir şekilde çalışmak.
- **有限数据下的 Sequence labeling。**BiLSTM-CRF (Deneyim 06) 1k-10k 标注句子的NER için, hala üretim derecesi mimarisi olarak görülmektedir.

Diğer her şey transformatörle birlikte.

## - Söyle.

保存为 `outputs/prompt-text-encoder-picker.md`- ...

```markdown
---
name: text-encoder-picker
description: Pick a text encoder architecture for a given constraint set.
phase: 5
lesson: 08
---

Given constraints (task, data volume, latency budget, deploy target, compute budget), output:

1. Encoder architecture: TextCNN, BiLSTM, BiLSTM-CRF, transformer fine-tune, or "use a pretrained transformer as a frozen encoder + small head".
2. Embedding input: random init, GloVe / fastText frozen, or contextualized transformer embeddings.
3. Training recipe in 5 lines: optimizer, learning rate, batch size, epochs, regularization.
4. One monitoring signal. For RNN/CNN models: attention mechanism absence means they miss long-range deps; check per-length accuracy. For transformers: fine-tuning collapse if LR too high; check train loss.

Refuse to recommend fine-tuning a transformer when data is under ~500 labeled examples without showing that a TextCNN / BiLSTM baseline has plateaued. Flag edge deployment as needing architecture-before-everything.
```

## 练习

1. **Easy。**Bir 3 sınıf oyuncak verisi seti içinde Üretim TextCNN(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((
2. **Medium。**LSTM sınıflandırıcısı 实现 max-pool、mean-pool 和 last-state pooling──在一个小数据集上比较;记录哪种pooling 获胜,并假设原因──
3. **Hard。**BiLSTM-CRF NER etiketini oluşturmak, ders 06 ve ders) ⋅ CoNLL-2003 上訓練── with lesson 06 CRF-alone baseline ve BERT ince ayarlamaları

## 关键术语
| Term | 人们的说法 | 实际含义 |
|------|-----------------|-----------------------|
| TextCNN | 用于文本的 CNN | 在 word embeddings 上堆叠 1D convolutions，并使用 global max-pool。Kim (2014)。 |
| RNN | Recurrent net | 在每个 time step 更新 hidden state：`h_t = f(W x_t + U h_{t-1})`。 |
| LSTM | Gated RNN | 增加 input / forget / output gates + 一个 cell state。能在长序列中稳定训练。 |
| GRU | 更简单的 LSTM | 两个 gates 而不是三个。准确率相近，参数更少。 |
| Bidirectional | 两个方向 | Forward + backward RNN 拼接。每个 token 都能看到其 context 的两侧。 |
| Vanishing gradient | 训练信号消失 | Plain RNNs 中反复乘以 <1 的 weights，会让早期 step 的 gradients 实际上变为零。 |

## 延伸阅读
- [Kim, Y. (2014). Convolutional Neural Networks for Sentence Classification](https://arxiv.org/abs/1408.5882) TextCNN 论文──八页──可读──
- [Hochreiter, S. and Schmidhuber, J. (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) LSTM 论文──出乎意料地清晰──
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)  LSTM'leri herkesin anlayabileceği bir tablo haline getirin.
