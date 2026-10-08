# Usado en textos de CNN y RNNs

> Convolucciones, aprendizaje de n-gramos, recurrencias, responsabilidades de memoria, dos de ellas han sido objeto de atención, dos de ellas siguen siendo importantes en los dispositivos restringidos.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 3 · 11 (PyTorch 入门), Fase 5 · 03 (Inmoblidación de palabras), Fase 4 · 02 (Convoluciones desde cero)
**Time:** ~75 分钟

##  problemas

TF-IDF y Word2Vec producen un vector plano de 平 {\displaystyle 平\vec {Tf-IDF} y un vector de 平\vec {Tf-IDF} basándose en el clasificador que construyen.`dog bites man`Y `man bites dog`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊    ◊ ◊ ◊   ◊ ◊   ◊ ◊ ◊ ◊ ◊     ◊  ◊      ◊ ◊       ◊      ◊     ◊       ◊                                                                                                                                                      

Antes de que llegaran los transformadores, había dos tipos de arquitecturas que llenaron este vacío.

**用于文本的 Convolutional nets（TextCNN）。**En los embebedidos de palabras 序列 aplican las convoluciones 1D. El filtro de la anchura 3 es un detector de trigramas que se puede aprender: se cruza tres palabras y se produce una cantidad de puntos. Se compone de diferentes anchuras.

**Recurrent nets（RNN、LSTM、GRU）。**Una vez procesado un token, mantenimiento de llevar información hacia adelante de la transmisión del estado oculto. Sequencial 带记忆 支持灵活输入长度.

Este curso se construirá en ambos, y luego se señalará la promoción de la atención en los puntos de fracaso de la clase.

## 概念

**TextCNN**(Kim, 2014) ―― Tokens 会被嵌入──宽度为 `k`de la convolución 1D en continuidad`k`-grams de embedidos 上滑动 filter, generar mapa de características。对该地图做全球最大聚合会选出最强激活──把多个过器宽度的最大聚合 输出拼接起来──送进分类器头──

Por qué es efectivo. Un filtro es un n-gram que se puede aprender. El max-pooling es ubicado en un lugar inmutable, por lo que "no es bueno" en los comentarios comienza o en el medio todo se desencadena en la misma función.

**RNN。**En cada paso de tiempo`t`, estado oculto `h_t = f(W * x_t + U * h_{t-1} + b)`在时间维度共享 `W`¿Qué es esto?`U`¿Qué es esto?`b`            `T`El estado oculto es el resumen de todo el prefijo.`h_1 ... h_T`上做 pooling ((máximo ≈ media o última) ⋅

Las RNN simples sufrirían gradientes desaparecientes.**LSTM**增加 las puertas para decidir olvidar lo que 储存什么 输出什么, así estabilizar los gradientes en la secuencia larga.**GRU**Simplificar LSTM en dos puertas; los parámetros son menores y se muestran más cerca.

**Bidirectional RNNs**Una RNN está en dirección a la ejecución, otra en dirección a la ejecución, luego se componen estados ocultos.


```figure
rnn-unroll
```

## Construirlo

### Paso 1: PyTorch 中的 TextCNN

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

`transpose(1, 2)`¿ Qué ?`[batch, seq_len, embed_dim]`变形为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `[batch, embed_dim, seq_len]`, porque `nn.Conv1d`Las líneas de entrada y salida son fijas.

### 步骤 2: Clasificador de LSTM

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

En los secuencias, hacer el máximo pool, en lugar de la última piscina de estado. Para la clasificación, el máximo pooling suele compararse con el último estado oculto, mejor, ya que la información del final de los longos secuencias suele dominar el último estado.

### 步骤 3: desvanecimiento de la gradiente 演示(直觉)

没有 gating 的 plain RNN 无法学习长距离依赖性──考虑一个玩具任务:预测 token `A`¿Ha aparecido alguna vez en cualquier lugar de la serie?`A`En la posición 1, mientras que la longitud del secuencia es de 100 tokens, entonces el gradiente de pérdida debe pasar por el peso recurrente de 99 veces multiplicando para poder transmitirse. Si el peso es menor que 1, el gradiente desaparecerá. Si es mayor que 1, explotará.

```python
def vanishing_gradient_sim(seq_len, recurrent_weight=0.9):
    import math
    return math.pow(recurrent_weight, seq_len)


# At weight=0.9 over 100 steps:
#   0.9 ^ 100 ≈ 2.7e-5
# The gradient from step 100 to step 1 is effectively zero.
```

Los LSTMs     **cell state**Relajar este problema: se utiliza para interactuar con la red en forma de interacción adicional.  Objetivos de la puerta de olvido se pueden reducir en forma multiplicada, pero los gradientes todavía pueden circular en la "autopista".

### Paso 4: ¿Por qué todavía no es suficiente?

Incluso si hay LSTMs, tres problemas siguen existiendo.

1. **Sequential bottleneck。**En la longitud para 1000 de la secuencia de entrenamiento RNN  necesita 1000 串行前/后步――无法沿时间维度并行化――
2. **Encoder-decoder setups 中的固定大小 context vector。**El decodificador sólo puede ver el estado oculto final del codificador, mientras que comprime toda la entrada.
3. **Distant-dependency accuracy ceiling。**Los LSTMs  son mejores que los RNN comunes, pero todavía son difíciles de atravesar 200 pasos  difusión de información específica 

Atención, resuelve estos tres problemas. Los transformadores eliminan completamente la recurrencia.

## Usalo

PyTorch de `nn.LSTM`¿Qué es esto?`nn.GRU`Y `nn.Conv1d`已-producción-ready── entrenamiento código es estándar──

Abrazar la cara  proporcionar embebidos pre-entrenados, se puede colocarlos como una capa de entrada:

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

适用约束 lista de verificación

- **Edge / on-device inference。**带 GloVe embebidos de TextCNN比变压器 小10-100x──Si tu objetivo de despliegue es el móvil, este es el montón que debes usar──
- **Streaming / online classification。**RNN 一次处理一个代币;transformers 需要完整序列──对于实时输入文本,LSTMs 仍然胜出──
- **用于 baselines 的 tiny models。**En la nueva tarea, rápido. En la CPU, en 5 minutos, entrenando un texto.
- **有限数据下的 Sequence labeling。**BiLSTM-CRF (lección 06) para 1k-10k 标注句子的NER, sigue siendo una arquitectura de grado de producción.

Todo lo demás se le entrega al transformador.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/prompt-text-encoder-picker.md`¿Qué es esto ?

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

##  ejercicios

1. **Easy。**En un conjunto de datos de juguete de 3 clases 上训练 TextCNN((你自己发明数据) ――验证过器宽度(2、3、4) de la media F1 优于单一宽度(3)。
2. **Medium。**Por lo tanto, el sistema de clasificación LSTM 实现 max-pool、median-pool 和 última-estado de pooling──在一个小数据集上比较;记录哪种pooling 获胜,并假设原因──
3. **Hard。**构建 BiLSTM-CRF NER tagger(结合课06 和本课) ――在 CoNLL-2003 上训练――与课06的CRF-Alone baseline以及BERT-fine-tune比较──报告训练时间、记忆 和 F1――

## 关键术语: "El hombre es un hombre"
| Term | 人们的说法 | 实际含义 |
|------|-----------------|-----------------------|
| TextCNN | 用于文本的 CNN | 在 word embeddings 上堆叠 1D convolutions，并使用 global max-pool。Kim (2014)。 |
| RNN | Recurrent net | 在每个 time step 更新 hidden state：`h_t = f(W x_t + U h_{t-1})`。 |
| LSTM | Gated RNN | 增加 input / forget / output gates + 一个 cell state。能在长序列中稳定训练。 |
| GRU | 更简单的 LSTM | 两个 gates 而不是三个。准确率相近，参数更少。 |
| Bidirectional | 两个方向 | Forward + backward RNN 拼接。每个 token 都能看到其 context 的两侧。 |
| Vanishing gradient | 训练信号消失 | Plain RNNs 中反复乘以 <1 的 weights，会让早期 step 的 gradients 实际上变为零。 |

## 延伸阅读
- [Kim, Y. (2014). Convolutional Neural Networks for Sentence Classification](https://arxiv.org/abs/1408.5882) TextoCNN 论文──八页──可读──
- [Hochreiter, S. and Schmidhuber, J. (1997). Long Short-Term Memory](https://www.bioinf.jku.at/publications/older/2604.pdf) LSTM 论文──出乎意料地清晰──
- [Olah, C. (2015). Understanding LSTM Networks](https://colah.github.io/posts/2015-08-Understanding-LSTMs/)  Que los LSTMs sean fácilmente comprensibles para todos.
