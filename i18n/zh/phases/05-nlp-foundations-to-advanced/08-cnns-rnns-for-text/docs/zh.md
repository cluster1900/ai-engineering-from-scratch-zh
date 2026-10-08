# 基于文字的CNN和RNN

> 转变 学习n-grams──回复 负责记忆──两者都被关注 取代──两者在受限硬件上仍然重要──

**Type:** Build
**Languages:** Python
**先修要求：**3 阶段 · 11 (PyTorch 入门), 5 阶段 · 03 (词嵌入), 4 阶段 · 02 (从零转变)
**Time:** ~75 分钟

## 问题

TF-IDF 和 Word2Vec 产生了忽略词序的平面向量.基于它们构建的分类器无法区分.`dog bites man`和 `man bites dog`词序有时承载信号

在变压器到来之前,有两类建筑填补了这个空白.

**用于文本的 Convolutional nets（TextCNN）。**在词嵌入序列上应用1D卷积──宽度为3的过器是一个可学习的三重感测器:它跨越三个词并输出一个分数──堆叠不同宽度的2、3、4、5) 来检测多维模式──最大池到固定大小的表示──平、并行、快速──

**Recurrent nets（RNN、LSTM、GRU）。**一次处理一个代币,维护携带信息向前传播的隐藏状态――序列、带记忆、支持灵活输入长度――它们在2014年至2017年主导序列建模,随后引起了关注――

本课将构建两者,然后指出推动关注现有的失败点.

## 概念

**TextCNN**作为一个"果"的标志,`k`连续的1D卷积`k`图表的嵌入 上滑动过器,生成特征地图――对该地图做全球最大聚合 会选出最强的激活――把多个过器宽度的最大聚合――输出拼接起来――送入分类器头――

为什么有效――一个过器就是一个可学习的n-gram――最大聚合是位置不变的,所以"不好"在评论开头或中间都会触发同一个功能――三个过器宽度、每一个100个过器,会给你300个学到的n-gram探测器――训练是并行的;没有连续依赖――

**RNN。**在每一步时间`t`隐藏状态`h_t = f(W * x_t + U * h_{t-1} + b)`在时间维度共享`W`,我知道.`U`,我知道.`b`时间`T`对于分类,在`h_1 ... h_T`上做聚合                                                                                                                                                                                                                          

简单的RNN将遭受消失的梯度.**LSTM**增加门来决定忘记什么,储存什么,输出什么,从而稳定长序列中的梯度.**GRU**将LSTM简化为两个门;参数更少且表现相近.

**Bidirectional RNNs**一个RNN正向运行,另一个反向运行,然后拼写隐藏状态──每个代币的表示都能看到左右两侧的背景──对标签任务至关重要──


```figure
rnn-unroll
```

## 构建它

### 步骤1: PyTorch 中的文字CNN

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

`transpose(1, 2)`将`[batch, seq_len, embed_dim]`变形为`[batch, embed_dim, seq_len]`因为`nn.Conv1d`无论输入长度如何,输出都是固定的大小.

### 步骤 2: LSTM分类器

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

在序列上做最大池,而不是最后状态池.对于分类,最大池通常比较于最后一个隐藏状态更好,因为长序列末尾的信息往往会主导最后状态.

### 步骤3:消失梯度 演示(直觉)

没有门户的简单RNN 无法学习长距离的依赖性──考虑一个玩具任务:预测代币`A`是否曾出现在序列中的任何位置.`A`在位置1时,序列长度为100个代币,那么来自损失梯度必须通过99次重量的重复乘法才能传递回传.如果重量小于1,梯度会消失.如果大于1,它会爆炸.

```python
def vanishing_gradient_sim(seq_len, recurrent_weight=0.9):
    import math
    return math.pow(recurrent_weight, seq_len)


# At weight=0.9 over 100 steps:
#   0.9 ^ 100 ≈ 2.7e-5
# The gradient from step 100 to step 1 is effectively zero.
```

通过LSTM**cell state**修复这个问题:它通过网络的只有加密相互作用方式, 遗忘门将以乘法方式缩小它, 但梯度仍然可以沿着"高速公路"流动.

### 步骤4:为什么这还不够

尽管有LSTM,三个问题仍然存在.

1. **Sequential bottleneck。**在长度为1000的序列上训练RN需要1000个连续前进/后退步骤――无法沿时间维度并行化――
2. **Encoder-decoder setups 中的固定大小 context vector。**解码器只能看到解码器的最终隐藏状态,而它则缩小了整个输入.长输入会丢失细节.
3. **Distant-dependency accuracy ceiling。** LSTM 优于普通RNN,但仍然难以跨越200多步骤传播特定信息.

关注,解决了这三个问题.

## 使用它

皮托尔奇的`nn.LSTM`,我知道.`nn.GRU`和 `nn.Conv1d`已经生产准备了.

拥抱面孔提供预训练式嵌入,你可以把它们插入作为输入层:

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

适用约束检查列表――

- **Edge / on-device inference。**带全球嵌入式的文字CNN比变压器小10-100x──如果你的部署目标是手机,这是该使用的堆──
- **Streaming / online classification。**转变器需要完整的序列.
- **用于 baselines 的 tiny models。**在新任务上快速代. 在CPU上5分钟训练一个文字CNN.
- **有限数据下的 Sequence labeling。**对于1k-10k 标注句子的NER,仍然是生产级建筑.

其他一切都交给了变压器.

## 交付它

保存为`outputs/prompt-text-encoder-picker.md`其他:

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

1. **Easy。**在一个3级玩具数据集上训练 TextCNN(你自己发明数据) ――验证过器宽度(2、3、4) 的平均F1 优于单一宽度(3)。
2. **Medium。**为LSTM分类器 实现最大池、平均池和最后状态聚合――在一个小数据集上比较;记录哪种聚合 获胜,并假设原因――
3. **Hard。**构建BiLSTM-CRF NER标签(结合课06 和本课) ⋅在CoNLL-2003上训练――与课06的CRF单独基线以及BERT细调比较――报告训练时间、记忆 和 F1――

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
- [Kim, Y. (2014). Convolutional Neural Networks for Sentence Classification](https://arxiv.org/abs/1408.5882)文本CNN论文──八页──可读──
- [Hochreiter, S. and Schmidhuber, J. (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) LSTM 论文──出乎意料地清晰──
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/) 让LSTM对所有人来说都变得容易理解的图解.
