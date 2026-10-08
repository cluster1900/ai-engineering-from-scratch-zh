# Secuencia a secuencia 模型

> Dos RNN 假装自己是翻译器──它们 se encuentran en un cuello de botella, es la razón de la atención 存在──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 08 (CNNs + RNNs for Text), Phase 3 · 11 (PyTorch Intro)
**Time:** ~75 minutes

##  problemas
Clasificación se va a cambiar la secuencia de tiempo 映射到单个标签──Translation se va a cambiar la secuencia de tiempo 映射到另一个变长序列──输入和输出位于不同词汇中,可能是不同语言,并且不保证长度一致──

Seq2seq 架构(Sutskever, Vinyals, Le, 2014) con una receta de un plan simple  resolver este problema。 dos RNN。 una lectura de la frase fuente, y generar un vector de un contexto de tamaño fijo。 otro lectura de este vector,并逐 Token 生成目标句──就是你在课08 写的相同套代码,只是以不同方式粘在一起。

Esto vale la pena aprender tiene dos razones. Primero, el cuello de botella de contextos-vectores es el fracaso de la PNL con el mayor valor pedagógico. Explica la atención y los transformadores 擅长一切. Segundo, la receta de formación de los maestros (en la que se forzan muestras programadas  búsqueda de rayos en la inferencia) sigue siendo aplicable en todos los sistemas modernos de generación que incluyen LLM.

## 概念
**Encoder.**读取 fuente de la oración de RNN.**context Vector** Para toda la entrada fija en el resumen.  Según se dice, excepto la fuente, nada se perderá.

**Decoder.**Otro uso de contexto Vektor inicial de RNN. En cada paso, se produce una vez generado Token como entrada, y se produce vocabulario objetivo de la distribución.`<EOS>`El token o alcanzar la longitud máxima.

**Training:**En cada paso del decodificador  calcular la pérdida de entropía cruzada,并沿序列 求和──通过两个网络做标准 backprop 通过时间──

**Teacher forcing.**Durante el entrenamiento, el decodificador en el paso.`t`La entrada es la posición.`t-1`El símbolo de la *verdad de la tierra* en lugar de un decodificador, se hace un pronóstico de la primera vez.**exposure bias**¿Qué es eso?

**The bottleneck.**Encoder aprender de todo acerca de la fuente, todo debe ser extrudido a un contexto Vector。长句会丢细节。罕见词会被模糊掉。重排序(chat noir vs. black cat) debe ser recordado, no calculado。

Atención(lección 10) a través de dejar el decodificador 查看 * cada * codificador estado oculto, no sólo es el último, para reparar este problema―


```figure
lstm-gates
```

## Construirlo
### 步骤 1: un codificador

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

`outputs`La forma es`[batch, seq_len, hidden_dim]` Cada entrada en posición un estado oculto `hidden`La forma es`[1, batch, hidden_dim]` Último paso──Ley 08 dice que se trata de  sobre las salidas hacer un grupo para realizar la clasificación── Aquí conservamos el último estado oculto  como contexto Vektor,并忽略每一步的输出──

### 步骤 2: un decodificador

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

Decodificador Cada vez más utilizado paso.

### 步骤 3: ciclo de formación con el profesor forzando

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

Dos rotas que merecen el nombre.`ignore_index=0`¡Hemos perdido el token de relleno!`teacher_forcing_ratio`Es decir, cada paso utiliza Token real en lugar de la probabilidad de modelo de predicción.

### 步骤 4: bucle de inferencia (compulsivo)

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

Descifrado codificado en cada paso de la probabilidad de elegir el Token más alto. Puede ir de la misma manera: una vez que usted ha prometido un Token, no se puede retirar.**Beam search**- ¿Qué? - ¿Qué?`k`个部分序列, y finalmente seleccionó la mayor secuencia completa.

### 步骤 5: el cuello de botella, demostrado

En la tarea de copiar juguete 上训练模型:fuente `[a, b, c, d, e]`, objetivo`[a, b, c, d, e]` aumentar la longitud de la secuencia  observar la precisión 

```
seq_len=5   copy accuracy: 98%
seq_len=10  copy accuracy: 91%
seq_len=20  copy accuracy: 62%
seq_len=40  copy accuracy: 23%
```

单个GRU estado oculto 无法无损记住 40-Token 输入―― información existe en cada paso del codificador, pero el decodificador sólo ve el último estado― Atención 直接修复这一点――

## Usalo
PyTorch 提供 `nn.Transformer`Y basado en`nn.LSTM`Las plantillas de la siguiente secuencia`transformers`La biblioteca  proporciona modelos de codificación y decodificación completos BART、T5、mBART、NLLB), que se entrenan y se producen en miles de millones de tokens.

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

tok = AutoTokenizer.from_pretrained("facebook/bart-base")
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-base")

src = tok("Translate this to French: Hello, how are you?", return_tensors="pt")
out = model.generate(**src, max_new_tokens=50, num_beams=4)
print(tok.decode(out[0], skip_special_tokens=True))
```

Los codificadores modernos ya han reemplazado a los transformadores RNN── alto nivel de forma (encoder, decodificador, token) con el papel de la secuencia de 2014  completamente igual― cada bloque  mecanismo interno diferente―.

### ¿Qué tiempo todavía elegir secuencia basada en RNN?

Para los nuevos proyectos, casi nunca se debe hacer esto.

- La traducción de transmisión, necesita tener un registro de una vez consume un Token de entrada.
- Generación de texto en el dispositivo, costo de memoria del transformador es demasiado alto.
- Enseñando el cuello de botella del codificador-decodificador, es entender los transformadores por qué vencer el camino más rápido.

### Prejuicio de exposición  y sus métodos de aceleración

- **Scheduled sampling.** durante el entrenamiento, el profesor de la relación de fuerza en el año, 让模型学会从自己的错误中恢复──
- **Minimum risk training.**Utiliza puntuación BLEU de grado en lugar de entropía cruzada de grado Token  realizar entrenamiento― más cerca de tu objetivo verdadero―
- **Reinforcement Learning fine-tuning.**Utilizando métricas  generador de secuencias de premios。用于现代 LLM RLHF。

Este último sigue siendo aplicable para la generación basada en transformadores.

##  entregarlo
保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/prompt-seq2seq-design.md`¿Qué es esto ?

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

##  ejercicios
1. **Easy.**实现 juguete copia tarea──在 objetivo等等到源的输出对 上训练 GRU seq2seq──测量长度 5、10、20 的精度──复现瓶──
2. **Medium.**添加束宽 3 的束搜索解码──在小型平行体上对比贪心测量 BLEU──记录束搜索 胜出的地方(通常是最后几个代币) 以及它没有差异的地方──
3. **Hard.**En 10k par par paráfrases conjunto de datos arriba de tono fino `facebook/bart-base`◊ Comparar la salida de haz-4 del modelo de ajuste fino con la de base en los insumos retenidos ◊ report BLEU,并挑选10 个质量例子──

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Encoder | Input RNN | 读取 source。产生 per-step hidden states 和最终 context Vector。 |
| Decoder | Output RNN | 从 context Vector 初始化。一次生成一个 target Token。 |
| Context vector | 摘要 | 最终 encoder hidden state。固定大小。Attention 要解决的 bottleneck。 |
| Teacher forcing | 使用真实 Token | 训练时喂入 ground-truth previous Token。稳定学习。 |
| Exposure bias | Train/test gap | 在真实 Token 上训练的模型，从未练习过从自身错误中恢复。 |
| Beam search | 更好的 decoding | 每一步保留 top-k partial sequences，而不是 greedy 地直接承诺。 |

## 延伸阅读
- [Sutskever, Vinyals, Le (2014). Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215) 原始 seq2seq papel。四页──
- [Cho et al. (2014). Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation](https://arxiv.org/abs/1406.1078)  Introducido GRU y encoder-decoder enmarcado.
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) Papel de atención──读完本课后立刻阅读──
- [PyTorch NLP from Scratch tutorial](https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html) 可构建的 seq2seq + Atención 代码──
