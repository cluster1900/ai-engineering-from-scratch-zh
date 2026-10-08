# Usado em textos de CNNs e RNNs

> Convolções, aprendizagem de n-gramas, recorrências, responsabilidade da memória, ambos já foram substituídos, ambos ainda são importantes em hardware restringido.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 3 · 11 (PyTorch 入门), Fase 5 · 03 (Incêndios de Palavras), Fase 4 · 02 (Convergências a partir do zero)
**Time:** ~75 分钟

## 问题

TF-IDF e Word2Vec são gerados por vectores planos de ignorar o sequência de palavras.`dog bites man`和 `man bites dog`词序有时承载信号──

Antes que os transformadores chegassem, havia duas classes de arquiteturas que preenchiam este vazio.

**用于文本的 Convolutional nets（TextCNN）。**Em palavras embutidas 序列 aplicadas 1D convulsões。 filtro de largura para 3 é um trigram detector aprendizagem: ele atravessa três palavras e produz um fração.

**Recurrent nets（RNN、LSTM、GRU）。**Uma vez processado um tokens, mantenha o estado oculto de divulgação de informações para a frente.

Este curso irá construir os dois, e depois indicar impulsionar a atenção para os pontos de fracasso existentes.

## 概念

**TextCNN**(Kim, 2014) ―― Tokens 会被嵌入──宽度为 `k`de 1D convulsão em continuidade`k`-grams embutidos 上滑动 filter, generar mapa de características。对该 mapa做全球最大pooling 会选出最强激活──把多个过器宽度的最大pooling 输出拼接起来──送进分类器头──

Por que é eficaz? Um filtro é um n-gram que se pode aprender. O max-pooling é inalterável, por isso "não é bom" é que todos os filtros em primeiro ou segundo lugar têm a mesma função.

**RNN。**Em cada passo de tempo`t`, estado oculto .`h_t = f(W * x_t + U * h_{t-1} + b)`在时间维度共享 `W`- Não.`U`- Não.`b` 時間 `T`O estado oculto é o resumo de todo o prefixo.`h_1 ... h_T`上做 pooling ((max、médio ou último)

As RNNs simples sofrem gradientes desaparecidos.**LSTM**增加 gate 来决定忘记什么,储存什么,输出什么,从而稳定长序列中的梯度──**GRU**Simplificar o LSTM em dois portões; o número é menor e a sua aparência é próxima.

**Bidirectional RNNs**Um RNN está em direção ao funcionamento, outro em direção ao funcionamento, e depois se mistura com estados ocultos.


```figure
rnn-unroll
```

## Construí-lo

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

`transpose(1, 2)`- Não .`[batch, seq_len, embed_dim]`变形为 `[batch, embed_dim, seq_len]`Porque ...`nn.Conv1d`O que quer que seja a sua dimensão, a sua dimensão é fixa.

### 步骤 2: Classificador LSTM

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

Em seguida, fazemos o máximo do conjunto, em vez de o último estado. Para classificação, o máximo-pooling geralmente é comparado ao último estado oculto, melhor, porque a informação do último período geralmente domina o último estado.

### 步骤 3: desvanecimento gradiente 演示(直觉)

没有 gating 的 无法学习长距离依赖性──考虑一个玩具任务:预测 token `A`Se já apareceu em qualquer posição da sequência.`A`Na posição 1, enquanto a duração da sequência é de 100 tokens, então o gradiente de perda deve passar por 99 vezes o peso recorrente para poder ser transmitido. Se o peso for menor que 1, o gradiente desaparecerá.

```python
def vanishing_gradient_sim(seq_len, recurrent_weight=0.9):
    import math
    return math.pow(recurrent_weight, seq_len)


# At weight=0.9 over 100 steps:
#   0.9 ^ 100 ≈ 2.7e-5
# The gradient from step 100 to step 1 is effectively zero.
```

LSTMs  através **cell state**修复这个问题:它通过网络以仅有加性相互作用的方式 (它通过网络的只有加性相互作用的方式) 忘门会以乘法方式缩小它,但梯度 (梯度) 仍然可以沿着"高速公路"流动) ⋅GRUs usando menos参数 fazer coisas semelhantes── ambas podem fazer 100+ séquências de passos de treinamento estabilizar──

### Passo 4: Por que ainda não é suficiente?

Mesmo que haja LSTMs, três problemas ainda existem.

1. **Sequential bottleneck。**Em longitude para 1000 de sequências de treinamento RNN                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
2. **Encoder-decoder setups 中的固定大小 context vector。**O decodificador só pode ver o estado oculto final do encodificador, enquanto ele comprime todo o input.
3. **Distant-dependency accuracy ceiling。**LSTMs  são melhores que RNNs simples, mas ainda são difíceis de atravessar 200+ passos  propagando informações específicas 

Atenção, resolvemos estes três problemas. Os transformadores eliminaram completamente a recorrência.

## Use-o

PyTorch `nn.LSTM`- Não.`nn.GRU`和 `nn.Conv1d`Já está pronto para produção.

Abraços Face  fornecer embutidos pré-entrenados, você pode colocá-los como entrada de camada:

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

Lista de verificação.

- **Edge / on-device inference。**带 GloVe embebimentos de TextCNN 比变压器 小 10-100x──如果你的部署目标是手机,这就是该使用的堆──
- **Streaming / online classification。**RNN 一次处理一个代币;transformers 需要完整序列──对于实时输入文本,LSTMs 仍然胜出──
- **用于 baselines 的 tiny models。**Em novas missões, rápido. Em CPU, 5 minutos de treinamento.
- **有限数据下的 Sequence labeling。**BiLSTM-CRF (leção 06) para 1k-10k 标注句子的NER, ainda é uma arquitetura de nível de produção.

Tudo o resto é para o transformador.

## Entrega-o

保存为 `outputs/prompt-text-encoder-picker.md`- Não .

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

1. **Easy。**Em um conjunto de dados de brinquedos de 3 classes 上訓練 TextCNN((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((
2. **Medium。**Para LSTM classificador 实现 max-pool、 mean-pool 和 last-state pooling──在一个小数据集上比较;记录哪种pooling 获胜,并假设原因──
3. **Hard。**构建 BiLSTM-CRF NER tagger(结合课06 和本课) ――在 CoNLL-2003 上训练――与课06 的CRF-Alone Baseline以及BERT-Fine-Tune比较──报告训练时间、记忆 和 F1――

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
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)  Faça com que os LSTMs sejam facilmente compreensíveis para todos.
