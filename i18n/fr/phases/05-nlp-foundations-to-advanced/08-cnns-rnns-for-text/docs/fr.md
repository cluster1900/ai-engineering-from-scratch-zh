# Utilisé dans les textes de CNN et RNN

> Les conversions, les n-grammes, les récurrents, les responsabilités de mémoire, les deux sont déjà pris en compte, les deux sont encore importants sur les appareils limités.

**Type:** Build
**Languages:** Python
**先修要求：**Phase 3 · 11 (PyTorch 入门), Phase 5 · 03 (Inpéditions de mots), Phase 4 · 02 (Conversions à partir de zéro)
**Time:** ~75 分钟

##  problématique

TF-IDF et Word2Vec sont générés par un vecteur 平 de l'ignorance du vocabulaire.`dog bites man`et `man bites dog`Il y a des signaux à transporter.

Avant l'arrivée des transformateurs, il y avait deux types d'architectures qui ont rempli ce vide.

**用于文本的 Convolutional nets（TextCNN）。**Dans les étiquettes de mots, l'application de convolutions 1D en séquence. Le filtre à largeur 3 est un détecteur de trigramme appréciable: il traverse trois mots et produit un débit.

**Recurrent nets（RNN、LSTM、GRU）。**Une fois traité un jeton, maintenu le port de l'information vers l'avant propagation de l'état caché.

Le cours se construira sur les deux, puis soulignera la promotion de l'attention sur les points de défaillance apparus.

## 概念

**TextCNN**(Kim, 2014)  Les jetons seront intégrés `k`La convulsion 1D dans le continu`k`-grammes de l'embedding 上滑动 filter, générer une carte de fonctionnement. Pour cette carte faire le max-pooling global 会选出最强激活──把多个过器宽度的最大-pooled 输出拼接起来──送进分类器头──

Pourquoi va-t-il ? un filtre c'est un n-gramme à apprendre. Le max-pooling est positionné, donc " pas bon " en premier ou en milieu de commentaires se déclenche avec la même fonction.

**RNN。**Dans chaque étape de temps `t`, l'état caché `h_t = f(W * x_t + U * h_{t-1} + b)`在时间维度共享 `W`- Je suis là.`U`- Je suis là.`b`Le temps.`T`L'état caché est l'ensemble du préfixe.`h_1 ... h_T`上做 pooling ((max、mean ou dernier)

Les RNN simples souffriront de dégradations qui disparaîtront.**LSTM**增加门来决定忘记什么,储存什么,输出什么, afin de stabiliser les gradients dans la longue séquence.**GRU**Simplifier LSTM en deux portes; les paramètres sont moins nombreux et se présentent plus près.

**Bidirectional RNNs**Un RNN est en marche, un autre en marche, puis il colonne les états cachés.


```figure
rnn-unroll
```

## - Je le construis.

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

`transpose(1, 2)`Il va`[batch, seq_len, embed_dim]`变形为 `[batch, embed_dim, seq_len]`Je suis désolé .`nn.Conv1d`Les canaux sont en moyenne de taille fixe.

### 步骤 2: Classifiateur LSTM

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

Pour la classification, le maximum-pooling est généralement comparé à l'état caché dernier, mieux, car les informations de la fin de longue séquence dominent souvent l'état dernier.

### 步骤 3: dégradation de la disparition 演示(直觉)

没有 gating 的 plain RNN 无法学习长距离依赖性──考虑一个玩具任务:预测 token `A`Y a-t-il déjà été présent dans n'importe quelle position de la séquence ?`A`En position 1, alors que la longueur de la séquence est de 100 jetons, le gradient de perte doit passer par le poids récurrent de 99 fois pour pouvoir le transmettre. Si le poids est inférieur à 1, le gradient disparaîtra.

```python
def vanishing_gradient_sim(seq_len, recurrent_weight=0.9):
    import math
    return math.pow(recurrent_weight, seq_len)


# At weight=0.9 over 100 steps:
#   0.9 ^ 100 ≈ 2.7e-5
# The gradient from step 100 to step 1 is effectively zero.
```

Les LSTM sont passés par**cell state**修复这个问题: il se passe par le net en utilisant uniquement des interactions additionnelles ]]> Forget gate ]]> L'accroissement se fait en utilisant des multiples méthodes, mais les gradients ]]> peuvent toujours circuler le long de la "autoroute" ]]> Les GRU utilisent moins de paramètres pour faire des choses similaires ]]> Les deux peuvent permettre de stabiliser les séquences de formation de plus de 100 étapes ]]>

### Étape 4: Pourquoi ça ne suffit pas ?

Même s'il y a des LSTM, trois problèmes sont toujours là.

1. **Sequential bottleneck。**En train de suivre une séquence de 1000 étapes, RNN nécessite 1000 étapes de marche avant/arrière.
2. **Encoder-decoder setups 中的固定大小 context vector。**Le décodeur ne peut voir que l'état caché final de l'encodeur, alors qu'il comprime l'ensemble de l'entrée.
3. **Distant-dependency accuracy ceiling。**Les LSTM sont meilleurs que les RNN simples, mais sont encore difficiles à traverser 200 étapes  diffuser des informations spécifiques.

Attention, résolvez ces trois problèmes. Les transformateurs éliminent complètement la récurrence.

## Utilisez-le

PyTorch de `nn.LSTM`- Je suis là.`nn.GRU`et `nn.Conv1d`Le code de formation est standard.

Embracing Face  fournir des emblèmes prétraînés, vous pouvez les insérer comme couche d'entrée:

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

适用约束 liste de contrôle

- **Edge / on-device inference。**带 GloVe embedments de TextCNN比变压器 小10-100x── Si votre cible de déploiement est le mobile, c'est la pile à utiliser──
- **Streaming / online classification。**RNN 一次处理一个代币;transformers 需要完整序列──对实时输入文本,LSTMs 仍然胜出──
- **用于 baselines 的 tiny models。**Dans la nouvelle mission, rapide à la CPU, 5 minutes de formation en texte.
- **有限数据下的 Sequence labeling。**BiLSTM-CRF (leçon 06) Pour 1k-10k 标注句子的NER, il est encore une architecture de qualité de production.

Tout le reste est livré au transformateur.

## Je le livre.

保存为 `outputs/prompt-text-encoder-picker.md`- Le numéro de la liste:

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

1. **Easy。**Dans un ensemble de données de jouets de 3 classes, la moyenne de la F1 est supérieure à la largeur d'un seul filtre.
2. **Medium。**Pour le classement LSTM  réaliser le pool maximal 平均 pool 和最后状态聚合──在一个小数据集上比较;记录哪种聚合 获胜,并假设原因──
3. **Hard。**构建 BiLSTM-CRF NER tagger(结合课06 和本课) ――在 CoNLL-2003 上训练――与课06的CRF-Alone baseline以及BERT-fine-tune比较──报告训练时间、记忆 和 F1――

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
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)  Faire des LSTM des illustrations faciles à comprendre pour tous.
