# يستخدمون كمنشورات سي ان ان و RNN

> التحولات تعلم n-غرامات. التكرارات  مسئولة الذاكرة.

**Type:** Build
**Languages:** Python
**先修要求：**المرحلة 3 · 11 (PyTorch 入门) ، المرحلة 5 · 03 (مشاركات الكلمات) ، المرحلة 4 · 02 (تحولات من الصفر)
**Time:** ~75 分钟

## 问题

TF-IDF و Word2Vec تُنتج عن متجهات 平 جاهلة الكلمات المتسلسلة.`dog bites man`和 `man bites dog`✿ كلمة序有时承载信号✿

قبل وصول المحولين، كان هناك نوعان من الهندسة المعمارية تملأ هذا الفراغ

**用于文本的 Convolutional nets（TextCNN）。**في تسلسل التوابل الكلمة تطبيق التحوّلات الـ 1D. فلتر الـ 3 من الـ 4D هو كاشف ثلاثي الأبعاد يمكن تعلمه: يمر عبر ثلاثة كلمات ويخرج عددًا من الـ 2 و3 و4 و5) لتحقيق أنماط متعددة الأبعاد.

**Recurrent nets（RNN、LSTM、GRU）。**1-الاعمال مع رمز واحد، والحفاظ على الحالة الخفية للمعلومات المتقدمة للنشر.

هذا الدروس سوف يخلق اثنين من، ثم يشار إلى دفع الاهتمام إلى نقطة الفشل المظهر.

## 概念

**TextCNN**(كيم، 2014) ―― سيتم تضمين الوهمات.`k`من 1D تحويل في سلسلة `k`إضافة -غرامات 上滑动 filter,生成 feature map──对该地图做全球最大pooling 会选出最强激活──把多个过宽度的最大pooling 输出拼接起来──送进分类器头──

لماذا فعال. واحد المرشح هو واحد يمكن تعلمه من n-جرام. المجموعة الكبيرة هي الموقع غير متغير، لذلك "ليس جيد" في المراجعة الأولى أو الوسط سوف تنشئ نفس الميزة. ثلاثة عرض المرشحات. كل 100 مرشح، سوف تعطيك 300 اكتشافات n-جرام تعلم.

**RNN。**في كل خطوة في الوقت`t`،الوضع الخفي`h_t = f(W * x_t + U * h_{t-1} + b)`在时间维度共享 `W`.`U`.`b`الوقت`T`الحالة الخفية هي المكونات المختلفة.`h_1 ... h_T`上做 تجمع ((أقصى ≈ المتوسط أو الأخير)

ستعاني الـ RNN البسيطة من انحدارات تختفي**LSTM**زيادة البوابات لتحديد النسيان والخزين والخروج من أي شيء، وبالتالي تحديد التدرج في سلسلة طويلة.**GRU**تقسيم LSTM إلى بوابتين ؛ العنصر أقل وتظهر قريبة.

**Bidirectional RNNs**واحد RNN 正向运行، الآخر反向运行، ثم صيغة الحالات الخفية.


```figure
rnn-unroll
```

## بناءها

### الخطوة 1: PyTorch 中的 TextCNN

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

`transpose(1, 2)`ستعمل`[batch, seq_len, embed_dim]`变形为 `[batch, embed_dim, seq_len]`، لأن`nn.Conv1d`سوف تكون المحور الوسطى هو القنوات. مهما كانت طول الدخول، المجمعة، والمخرجات هي ثابتة.

### 步骤 2: تصنيف LSTM

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

في المسلسل، قم بجمع أقصى، وليس مجموعة الدولة الأخيرة. بالنسبة للتصنيف، فإن جمع أقصى عادةً مقارنة بأخير حالة مخفية أفضل، لأن معلومات نهاية المسلسل الطويل غالباً ما تسيطر على الدولة الأخيرة.

### 步骤 3: انحدار التراجع 演示(直觉)

没有 gating 的 بسيط RNN 无法学习长距离依赖性──考虑一个玩具任务:预测代币 `A`هل ظهرت في أي مكان في المرتبة ؟`A`في الموقع 1، بينما طول الترتيب هو 100 رمزا، ثم من المراجع الخسارة ‬ يجب أن تمر 99 مرات ضربة من الوزن المتكرر لكي يتم إعادة التوزيع‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

```python
def vanishing_gradient_sim(seq_len, recurrent_weight=0.9):
    import math
    return math.pow(recurrent_weight, seq_len)


# At weight=0.9 over 100 steps:
#   0.9 ^ 100 ≈ 2.7e-5
# The gradient from step 100 to step 1 is effectively zero.
```

الـ LSTMs    **cell state**修复这个问题: انها تعمل على طريقة تفاعل مضافية فقط عبر الشبكة                                                                                                                                                                                                                                                     

### الخطوة الرابعة: لماذا لا يزال هذا غير كافٍ؟

حتى لو كان هناك أسلحة إضافية، لا تزال هناك ثلاثة مشاكل.

1. **Sequential bottleneck。**في التدريب على سلسلة 1000 من التسلسلات على طول الدرجة RNN  بحاجة إلى 1000 خطوة متسلسلة للأمام / للخلف  لا يمكن أن تتوافق مع الدرجة التسلسلة 
2. **Encoder-decoder setups 中的固定大小 context vector。**يمكن للمفكّر أن يرى الحالة الخفية النهائية للمفكّر، بينما يضغط على كلّ المدخول.
3. **Distant-dependency accuracy ceiling。**LSTMs  أفضل من RNNات عادية، ولكن لا يزال صعبا على تجاوز 200+ خطوة  نشر معلومات محددة‬

الانتباه حل هذه المشاكل الثلاثة.

## استخدمها

بيتورش `nn.LSTM`.`nn.GRU`和 `nn.Conv1d`جاهز للإنتاج.

تعاطف الوجه  توفر إضافة مدربة مسبقا، يمكنك وضعها في كطبقة المدخل:

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

قائمة التحقق

- **Edge / on-device inference。**带 GloVe Embeddings 的 TextCNN 比变压器 小 10-100x──如果你的部署目标是手机,这就是该使用的堆──
- **Streaming / online classification。**RNN 一次处理一个代币;تحولات 需要完整序列──对于实时输入文本,LSTMs 仍然胜出──
- **用于 baselines 的 tiny models。**في المهام الجديدة بسرعة 代── في CPU  5 دقائق تدريب على متنCNN──
- **有限数据下的 Sequence labeling。**في المادة 6، فإن المعمارات النووية لمعرفة النوعية المختلفة من المعدات، لا تزال تعتبر معمارية من الدرجة الإنتاجية.

كل شيء آخر يُسلم إلى المحول

## 交付 it

保存为 `outputs/prompt-text-encoder-picker.md`:

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

## التدريب

1. **Easy。**في مجموعة بيانات لعبة من 3 فئات 上 тренинг TextCNN(((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((())))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
2. **Medium。**لـ LSTM تصنيف 实现 max-pool、mean-pool 和 last-state pooling──在一个小数据集上比较;记录哪种pooling 获胜,并假设原因──
3. **Hard。**构建 BiLSTM-CRF NER tagger(结合课 06 和本课) ――在 CoNLL-2003 上训练――与课 06 的CRF-单独基线以及BERT细调比较――报告训练时间、记忆 和 F1――

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
- [Kim, Y. (2014). Convolutional Neural Networks for Sentence Classification](https://arxiv.org/abs/1408.5882) النصCNN 论文──八页──可读──
- [Hochreiter, S. and Schmidhuber, J. (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) LSTM 论文──出乎意料地清晰──
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) 让LSTMs变得易懂的图解对所有人而言.
