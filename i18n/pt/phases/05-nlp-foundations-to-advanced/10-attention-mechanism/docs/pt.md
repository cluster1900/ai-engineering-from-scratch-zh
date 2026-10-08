# Mecanismo de atenção  突破

> O decodificador não se torna um resumo de resumo comprimido, mas começa a ver toda a fonte.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 5 · 09(Modelos de sequência em sequência)
**Time:** ~45 分钟

## 问题

Lição 09: Uma vez que a quantidade de cópia de um brinquedo é um erro final. Um codificador-decodificador GRU treinado em tarefas de cópia, a precisão de 5 horas é de 89%, a precisão de 80 horas de duração é quase acessível.

Bahdanau、Cho 和 Bengio em 2014 publicou um 三行修复── não apenas colocar o estado final do codificador 给 decoder, mas manter cada estado do codificador── em cada passo do decodificador, calcular o aumento de peso dos estados do codificador, entre os quais o peso indica que o decodificador agora precisa ver o codificador 位置`i`O aumento de potência é o contexto, e ele muda em cada passo do decodificador.

É o que se passa com o sistema de transformadores. É o que se passa com o sistema de transformadores. É o que se passa com o sistema de transformadores.

## 概念

![Bahdanau attention: decoder queries all encoder states](../assets/attention.svg)

Em cada passo de decodificador `t`- Não .

1. Utilize anterior um decodificador estado oculto `s_{t-1}` como **query**- Não.
2. Vai fazê-lo com cada codificador estado oculto .`h_1, ..., h_T`Cada codificador está em uma escala.
3. Para as pontuações fazer softmax, obter peso de atenção`α_{t,1}, ..., α_{t,T}`, eles são somados para 1.
4. Vêctor de contexto `c_t = Σ α_{t,i} * h_i`◊ encoder estados ∙加权平均──
5. Descódigo 接收 `c_t`Adicionando um token de saída, gerar outro token.

Quando o decodificador precisa de colocar "Je" 翻译成 "I" 时,它会让"Je" 上面的编码状态 权重大,其他位置权重小──当它需要"not"时,它会让"pass"权重大──文本向量在每一步都会重塑──

## Formas (((mais facilmente morder de pessoas)

É a primeira vez que todos estão errados.

| Thing | Shape | Notes |
|-------|-------|-------|
| Encoder hidden states `H` | `(T_enc, d_h)` | 如果是 BiLSTM，`d_h = 2 * d_hidden` |
| Decoder hidden state `s_{t-1}` | `(d_s,)` | 一个 vector |
| Attention score `e_{t,i}` | scalar | 每个 encoder 位置一个 |
| Attention weight `α_{t,i}` | scalar | 对所有 `i` 做 softmax 之后 |
| Context vector `c_t` | `(d_h,)` | 与一个 encoder state 的 shape 相同 |

**Bahdanau（additive）score。** `e_{t,i} = v_α^T * tanh(W_a * s_{t-1} + U_a * h_i)`- Não.

- `s_{t-1}`A forma é`(d_s,)`- Não .`h_i`A forma é`(d_h,)`- Não.
- `W_a`A forma é`(d_attn, d_s)`- Não.`U_a`A forma é`(d_attn, d_h)`- Não.
- Eles estão em forma de forma interna.`(d_attn,)`- Não.
- `v_α`A forma é`(d_attn,)` Com`v_α`Fazer um produto interno, reduzir-se-á a um escalado.**这就是 `v_α` 的作用。**Não é magia. É a projeção do vector de atenção-dimensão.

**Luong（multiplicative）score。**Três variações:

- `dot`- Não .`e_{t,i} = s_t^T * h_i` Requisitos`d_s == d_h`Se o teu codificador for bidirecional, salta.
- `general`- Não .`e_{t,i} = s_t^T * W * h_i`, entre os `W`A forma é`(d_s, d_h)`❖ Movimento de dimensões e outros
- `concat`A forma Bahdanau é muito pouco usada, pois os dois anteriores são mais baratos.

**一个值得点名的 Bahdanau / Luong gotcha。**Bahdanau 使用 `s_{t-1}`(生成当前 word *之前* 的解码状态)。Long 使用 `s_t`(Generar* depois* de estado) ―― colocá-los juntos produzirá gradientes de erros muito difíceis de desfechar― selecionar um papel, e depois manter a sua regra―


```figure
attention-heatmap
```

## Construí-lo

### 步骤 1: aditivo ((Bahdanau) atenção

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

De acordo com o que está lá em cima, verifique as suas formas.`encoder_states`A forma é`(T_enc, d_h)`- Não.`projected_enc`A forma é`(T_enc, d_attn)`- Não.`projected_dec`A forma é`(d_attn,)`, e vai ser transmitido.`combined`A forma é`(T_enc, d_attn)`- Não.`scores`A forma é`(T_enc,)`- Não.`weights`A forma é`(T_enc,)`- Não.`context`A forma é`(d_h,)`- Pode ser publicado.

### 步骤 2: Luong dot 和 geral

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

Cada um deles é de três linhas. É por isso que o papel de Luong pode ser criado.

### 步骤 3: Um exemplo de valores numéricos completos

给定三个编码状态 ((大致对应 "cat"、"sat"、"mat") bem como um estado de decodificação mais próximo do primeiro estado, distribuição de atenção irá concentrar-se em posição 0。 Se o estado de decodificação 移动到更接近最后一个编码状态,attention 就会移动到位置 2。

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

Primeiro, ganhar a vitória. Depois, mover o estado do decodificador para mais perto do terceiro estado do encodificador, observar os pesos como se movem.

### Passo 4: Por que é que é um ponte de transformadores

把上的语言翻译成 Q/K/V:

- **Query**= estado do decodificador `s_{t-1}`
- **Key**= estados de codificação ((( nós temos um objeto dividido)
- **Value**= estados de codificação (((

Em atenção clássica, as chaves e os valores são a mesma coisa. A auto-atenção irá separá-los: você pode fazer uma consulta de sequência, e em seguida, K e V. Use diferentes projeções aprendidas.

Matemática é a mesma. As formas são as mesmas. De Bahdanau atenção a escala de ponto-produto atenção.

## Use-o

PyTorch 和 TensorFlow 直接提供注意──

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

É uma camada de atenção de transformador. O lote de perguntas tem 5 posições, o lote de chave/valor tem 10 posições, cada uma delas é de 128 dimensões, 8 cabeças.`output`É uma nova consulta com conteúdo aumentado.`weights`É possível visualizar uma matriz de alinhamento 5x10

### A atenção clássica continua a ser importante

- A versão baseada em RNN permite que cada conceito seja visto.
- Transformadores 放不下 em dispositivo sequência 任务。
- Qualquer artigo de 2014-2017 não sabe o que Bahdanau diz, você vai ler-o.
- MT de análise de alinhamento de pequena partícula em MT. Pesos de atenção crua mesmo em modelos de transformadores são também ferramentas de interpretação, e ler-os precisa saber o que eles são.

### Atenção-peso-como-explicação 陷

Pesos de atenção 看起来可解释──它们是跨位置求和为一的权重; você pode desenhar; high value represent看了这里── Revisores 很喜欢它们──

它们没有看起来那么解释──Jain 和 Wallace(2019) indicam que, entre algumas tarefas, as distribuições de atenção podem ser substituídas, e são substituídas por alternativas arbitrárias, sem alterar as previsões do modelo── sem ablação ou verificação contrafactual, nunca coloque pesos de atenção 报告为推理证──

##  Publicá-lo

保存为 `outputs/prompt-attention-shapes.md`- Não .

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

1. **Easy.** realização `softmax`masking, make encoder 中的填充令子 获得零注意重量──在包含可变长度序列的批上测试──
2. **Medium.**- Dá-me Luong .`general`Forma-Add-Multi-head atenção`d_h`- Desfeito .`n_heads`组, cada cabeça 运行注意,然后连锁──验证单头 情况与你之前的实现一致──
3. **Hard.**Na lição 09 de brinquedo cópia  tarefa de treinar um com Bahdanau atenção GRU codificador-decodificador― desenhar precisão vs. sequência comprimento― Comparar com a falta de atenção linha de base― Você deve ver a comprimento aumentar quando a diferença se amplia, isso confirma a atenção  levantar o frasco──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Attention | 看东西 | 对 value sequence 做加权平均，weights 由 query-key similarity 计算。 |
| Query, Key, Value | QKV | 三个 projections：Q 发问，K 是要匹配的内容，V 是要返回的内容。 |
| Additive attention | Bahdanau | Feed-forward score: `v^T tanh(W q + U k)`。 |
| Multiplicative attention | Luong dot / general | Score 是 `q^T k` 或 `q^T W k`。更便宜，在大多数任务上 accuracy 相同。 |
| Alignment matrix | 好看的图 | Attention weights 作为 `(T_dec, T_enc)` 网格。读取它可以看到 model attend 到了什么。 |

## 延伸阅读
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473)O papel.
- [Luong, Pham, Manning (2015). Effective Approaches to Attention-based Neural Machine Translation](https://arxiv.org/abs/1508.04025) 三种分分变体 及其比较──
- [Jain and Wallace (2019). Attention is not Explanation](https://arxiv.org/abs/1902.10186) Notações explicativas
- [Dive into Deep Learning — Bahdanau Attention](https://d2l.ai/chapter_attention-mechanisms-and-transformers/bahdanau-attention.html) Utilize PyTorch's可运行 walkthrough──
