# Sıradan sıradan 模型

> İki RNN, kendini çevirmen yaparlar.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 08 (CNNs + RNNs for Text), Phase 3 · 11 (PyTorch Intro)
**Time:** ~75 minutes

## 问题
Sınıflandırma                                                                                                                                                                                                                                                             

seq2seq 架构(Sutskever, Vinyals, Le, 2014) bir çabalı basit reçete ile 解決 this problem──2 RNN── bir okuma kaynak cümlesi,并产生固定大小的文脈矢量──另读取该矢量,并逐 Token 生成目标句──就是你在课08 写的同一套代码,只是以不同方式粘在一起──

Bu öğrenmeye değer iki neden vardır. Birincisi, bağlam-vector boğazı, NLP'de en çok öğretim değerinin başarısızlığıdır.

## 概念
**Encoder.**读取 source sentence 的 RNN──它的最终隐藏状态是**context Vector** Tüm giriş için sabit büyük özet.

**Decoder.**另一个用语文向量初始化 RNN──在每一步,它以前一次生成的代币 作为输入,并产生目标词汇上的分布──通过样本或 argmax 选择下一个代币──再把它回去──重复,直到产生`<EOS>`Token veya maksimum uzunluğu ulaşmak için.

**Training:**Bu nedenle, bu sayede, bir dizi değişkenlik ve bir dizi değişkenlik oluşur.

**Teacher forcing.**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `t`Yerin girişidir.`t-1`Bu, sabit bir eğitim olacaktır; yoktur, erken hatalar, modeller asla öğrenmeyecektir.**exposure bias**- Evet.

**The bottleneck.**Kodlama öğrenilen kaynak hakkında her şey, tüm bağlamlara çektilir vektör.

Dikkat))) Ders 10) Dekodör bırakmakla, * her * kodlayıcı gizli durumdadır, sadece son değil, bu sorunu düzeltmek için.


```figure
lstm-gates
```

## Yapın onu.
### 步骤 1: bir kodlayıcı

```python
import torch
import torch.nn as nn


class Encoder(nn.Module):
    def __init__(self, src_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(src_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)

    def forward(self, src):
        e = self.embed(src)
        outputs, hidden = self.gru(e)
        return outputs, hidden
```

`outputs`Şekil `[batch, seq_len, hidden_dim]` Her giriş pozisyonu gizli bir durumdur.`hidden`Şekil `[1, batch, hidden_dim]` 最后一步──Lesson 08 diyor ki 对输出做池以进行分类──这里我们保留最后的隐藏状态 作为文本向量,并忽略每一步的输出──

### 步骤 2: bir dekodör

```python
class Decoder(nn.Module):
    def __init__(self, tgt_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(tgt_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, tgt_vocab_size)

    def forward(self, token, hidden):
        e = self.embed(token)
        out, hidden = self.gru(e, hidden)
        logits = self.fc(out)
        return logits, hidden
```

Dekodör Her seferinde bir adım kullanın.

### 步骤 3: Öğretmen zorla eğitim döngüsü

```python
def train_batch(encoder, decoder, src, tgt, bos_id, optimizer, teacher_forcing_ratio=0.9):
    optimizer.zero_grad()
    _, hidden = encoder(src)
    batch_size, tgt_len = tgt.shape
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    loss = 0.0
    loss_fn = nn.CrossEntropyLoss(ignore_index=0)

    for t in range(tgt_len):
        logits, hidden = decoder(input_token, hidden)
        step_loss = loss_fn(logits.squeeze(1), tgt[:, t])
        loss += step_loss
        use_teacher = torch.rand(1).item() < teacher_forcing_ratio
        if use_teacher:
            input_token = tgt[:, t].unsqueeze(1)
        else:
            input_token = logits.argmax(dim=-1)

    loss.backward()
    optimizer.step()
    return loss.item() / tgt_len
```

İki isimli fırın.`ignore_index=0`Üstteki kaybı görüyorum.`teacher_forcing_ratio`Bu, gerçek bir simge kullanmak yerine model tahmininin olasılıklarını oluşturur. 1.0'dan başlayarak, eğitim süreci boyunca, ekspozisyon-arz kesimini azaltmak için yaklaşık 0.5'e kadar artırmak için tamamıyla öğretmen zorlamaktadır.

### 步骤 4: sonuç döngüsü (cinsel açgözlülük)

```python
@torch.no_grad()
def greedy_decode(encoder, decoder, src, bos_id, eos_id, max_len=50):
    _, hidden = encoder(src)
    batch_size = src.shape[0]
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    output_ids = []
    for _ in range(max_len):
        logits, hidden = decoder(input_token, hidden)
        next_token = logits.argmax(dim=-1)
        output_ids.append(next_token)
        input_token = next_token
        if (next_token == eos_id).all():
            break
    return torch.cat(output_ids, dim=1)
```

Açgözlü kodlama, her adımda en yüksek belirti seçimi olasılığını belirler.**Beam search**Üstünü tutarım...`k`个部分序列,最后选择得分最高的完整序列──梁宽 3-5 是标准设置──

### 步骤 5: gösterilen şişek boğazı

Oyuncak kopyası görevi 上训练模型: source `[a, b, c, d, e]`Hedef.`[a, b, c, d, e]`△ Seans uzunluğunu artırmak― gözlem doğruluğunu artırmak―

```
seq_len=5   copy accuracy: 98%
seq_len=10  copy accuracy: 91%
seq_len=20  copy accuracy: 62%
seq_len=40  copy accuracy: 23%
```

单个GRU gizli durum 无法无损记住 40-Token 输入――信息存在于每个编码步骤,但解码器只看到最后一个状态――注意 直接修复了这一点――

## Kullan
PyTorch 提供 `nn.Transformer`Ve temelinde`nn.LSTM`Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Çeviri: Ç Ç Ç Ç Çeviri: Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Çeviri: Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç Ç`transformers`Kütüphane tam bir kodlayıcı-dekoder modeli sunuyor.

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

tok = AutoTokenizer.from_pretrained("facebook/bart-base")
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-base")

src = tok("Translate this to French: Hello, how are you?", return_tensors="pt")
out = model.generate(**src, max_new_tokens=50, num_beams=4)
print(tok.decode(out[0], skip_special_tokens=True))
```

Modern kodlayıcı-dekodörler                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

### RNN tabanlı seq2seq seçmek için ne zaman devam edeceksin ?

Yeni projeler için, neredeyse asla yapılmamalıdır.

- Akışlı çeviriler, bir kez kullanmak için bir giriş simgesi gerekir.
- Cihazda metin oluşturma, transformörün depolama maliyeti çok yüksek.
- Öğrenim: En hızlı yol nedir anlamaktır.

### Çekim eğilimi  ve onun azaltma yöntemleri

- **Scheduled sampling.**訓練期間 anneal öğretmen zorlayıcı oranı, 模型学会 kendi hatalarından kurtulmak için
- **Minimum risk training.**Token Sınıfı çapraz entropisi yerine BLEU puanı kullanın.
- **Reinforcement Learning fine-tuning.**Metrik  ödül sırası jeneratörü。用于现代 LLM RLHF。

Bu üç kişi hala transformatör tabanlı üretim için uygundur.

## - Söyle.
保存为 `outputs/prompt-seq2seq-design.md`- ...

```markdown
---
name: seq2seq-design
description: 为给定任务设计 sequence-to-sequence pipeline。
phase: 5
lesson: 09
---

给定任务（translation、summarization、paraphrase、question rewrite），输出：

1. 架构。默认使用 pretrained transformer encoder-decoder（BART、T5、mBART、NLLB）。RNN-based seq2seq 只适用于特定约束。
2. Starting checkpoint。命名它（`facebook/bart-base`、`google/flan-t5-base`、`facebook/nllb-200-distilled-600M`）。让 checkpoint 匹配任务和语言覆盖范围。
3. Decoding strategy。Greedy 用于 deterministic output，beam search（width 4-5）用于质量，带 temperature 的 sampling 用于多样性。用一句话说明理由。
4. 发布前要验证的一个 failure mode。Exposure bias 会表现为较长输出上的 generation drift；抽样 20 个位于 90th-percentile length 的输出并目检。

对于少于一百万 parallel examples 的情况，拒绝推荐从头训练 seq2seq。将任何面向用户内容却使用 greedy decoding 的 pipeline 标记为 fragile（greedy 会重复并陷入循环）。
```

## 练习
1. **Easy.**实现玩具复制任务──在目标等于源的输出输出对 上训练 GRU seq2seq──测量长度 5、10、20 的精度──复现瓶──
2. **Medium.**添加束宽 3 的束搜索解码──在小型平行体上对比贪心测量 BLEU──记录束搜索 胜出的地方(通常是最后几个代币) 以及它没有差异的地方──
3. **Hard.**10k çift parafrase verisi top ince ayarlama `facebook/bart-base`❖ Düzgün ayarlanmış modelin ışın-4 çıkışı ile temel modelin üzerinde tutulan girişlerin üstündeki çıkışları karşılaştırmak.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder | Input RNN | 读取 source。产生 per-step hidden states 和最终 context Vector。 |
| Decoder | Output RNN | 从 context Vector 初始化。一次生成一个 target Token。 |
| Context vector | 摘要 | 最终 encoder hidden state。固定大小。Attention 要解决的 bottleneck。 |
| Teacher forcing | 使用真实 Token | 训练时喂入 ground-truth previous Token。稳定学习。 |
| Exposure bias | Train/test gap | 在真实 Token 上训练的模型，从未练习过从自身错误中恢复。 |
| Beam search | 更好的 decoding | 每一步保留 top-k partial sequences，而不是 greedy 地直接承诺。 |

## 延伸阅读
- [Sutskever, Vinyals, Le (2014). Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215) 原始 seq2seq kağıdı──四页──
- [Cho et al. (2014). Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation](https://arxiv.org/abs/1406.1078)  GRU ve kodlayıcı-dekoder çerçevesini başlattı.
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) Dikkat makalesi。读完本课后立刻阅读。
- [PyTorch NLP from Scratch tutorial](https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html) 可构建的 seq2seq + Dikkat 代码──
