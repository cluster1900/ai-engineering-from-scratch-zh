# Atenção de várias cabeças

> Uma cabeça de atenção, uma aprendizagem de uma relação, oito cabeças, oito cabeças, oito cabeças, oito cabeças, muitas.

**类型：**Construção
**语言：**Python
**前置知识：**Fase 7 · 02 ((A auto-atenção do zero)
**时间：**- 75 minutos.

## 问题

单个自我注意头 会计算一个注意矩阵―― essa matriz 捕捉一种关系, normalmente é aquela que pode minimizar a perda no sinal de treinamento atual―― se o seu data em assunto-verbo acordo、co-referência、discurso de longo alcance 和 sintaxis chunking  纠 全部,单个头 会将它们抹抹进一个单一的软-max分布,丢失一半信号――

O Vaswani Paper de 2017 deu um método de revisão:并行运行多个注意功能, cada um tem suas próprias projeções Q、K、V, então, colocar o output拼接起来── cada cabeça está em dimensão para`d_model / n_heads`O número de componentes permanece inalterado.

A atenção multi-cabeça é a configuração padrão de todos os transformadores em 2026 e o único debate está em usar * quantas cabeças *, bem como as chaves e valores

## 概念

![Multi-head attention splits, attends, concatenates](../assets/multi-head-attention.svg)

**Split。**取形为 `(N, d_model)`de `X`△分别 projeção 到形为 `(N, d_model)`De Q 、K 、V 、Resshape 为 `(N, n_heads, d_head)`, entre os `d_head = d_model / n_heads`❖ Transpor`(n_heads, N, d_head)`- Não.

**并行 Attend。**Em cada cabeça dentro de um processo de escalação de atenção de produto de ponto.`(N, d_head)` Estes cabeças funcionam em diferentes espaços de incorporação, e durante a computação de atenção não se comunicam entre si

**Concatenate 并 project。**Vai colocar as cabeças em pilas .`(N, d_model)`E depois multiplicam-se em forma.`(d_model, d_model)`de matriz de saída aprendida `W_o`- Não.`W_o`É cabeça  realizar posições misturadas 

**为什么有效。**Cada cabeça pode ser especializada, sem necessidade de outras cabeças 争抢表征预算── 20192024 anos estudos de sondagem mostram diferentes papéis de cabeças: cabeças de posição、atende à cabeça do token anterior、 cabeças de cópia、 cabeças de entidade denominadas、 cabeças de indução(constituem um mecanismo de aprendizagem no contexto) ―

**2026 年的变体谱系：**

| Variant | Q heads | K/V heads | Used by |
|---------|---------|-----------|---------|
| Multi-head (MHA) | N | N | GPT-2, BERT, T5 |
| Multi-query (MQA) | N | 1 | PaLM, Falcon |
| Grouped-query (GQA) | N | G (e.g. N/8) | Llama 2 70B, Llama 3+, Qwen 2+, Mistral |
| Multi-head latent (MLA) | N | compressed to low-rank | DeepSeek-V2, V3 |

O GQA é um programa moderno, pois pode ser aplicado.`N/G`O multiplicador reduz a memória de cache KV, mantendo quase a qualidade completa. MLA Mais adiante, reduzir o K/V para o espaço latente, e depois, no projeto de cálculo, voltar, ele consumirá FLOPs, mas economizará mais memória.


```figure
multihead-split
```

## Construí-lo

### Passo 1: A partir da nossa atenção de cabeça única já existente dividido entre cabeças

取 Lição 02 里的 `SelfAttention`, usando um par de divisão / concat 包起.`code/main.py`Há um grande número de realizações.

```python
def split_heads(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n, n_heads, d_head).transpose(1, 0, 2)  # (heads, n, d_head)

def combine_heads(H):
    h, n, d_head = H.shape
    return H.transpose(1, 0, 2).reshape(n, h * d_head)
```

Uma vez reformulado e uma vez transposto. Não há ciclo.`nn.MultiheadAttention`Fazer o que fazer.

### 步骤 2: por cabeça 运行 escala-pontos-produto atenção

Cada cabeça chega a sua própria fatia de Q、K、V──Atentão  transformar-se em batido matmul:

```python
def mha_forward(X, W_q, W_k, W_v, W_o, n_heads):
    Q = X @ W_q
    K = X @ W_k
    V = X @ W_v
    Qh = split_heads(Q, n_heads)         # (heads, n, d_head)
    Kh = split_heads(K, n_heads)
    Vh = split_heads(V, n_heads)
    scores = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(Qh.shape[-1])
    weights = softmax(scores, axis=-1)
    out = weights @ Vh                    # (heads, n, d_head)
    concat = combine_heads(out)
    return concat @ W_o, weights
```

Em hardware real,`Qh @ Kh.transpose(...)`É um .`bmm`O GPU vê que é forma`(heads, N, d_head) × (heads, d_head, N) -> (heads, N, N)`Mas, por isso, não é fácil.

### 步骤 3:Atenção-queria agrupada 变体

只有关键和值预测 会变──Q 获得 `n_heads`个群;K 和 V 获得 `n_kv_heads < n_heads`个 grupos,并被重复以匹配:

```python
def gqa_project(X, W, n_kv_heads, n_heads):
    kv = split_heads(X @ W, n_kv_heads)       # (kv_heads, n, d_head)
    repeat = n_heads // n_kv_heads
    return np.repeat(kv, repeat, axis=0)      # (n_heads, n, d_head)
```

Em inferência, isso vai economizar memória, porque o cache KV só é guardado.`n_kv_heads`份副本, em vez de `n_heads`份──Llama 3 70B Utilize 64 cabeças de consulta 和 8 cabeças de KV, é 8× de cache 缩减──

### Passo 4: Tente cada cabeça aprender o que

Em uma frase, usando 4 cabeças, em cada cabeça, imprime.`(N, N)`Matriz de atenção. Você verá diferentes cabeças, mesmo em inicialização aleatória.

## Use-o

Em PyTorch 中,一行版本:

```python
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=512, num_heads=8, batch_first=True)
```

GQA de PyTorch 2.5+

```python
from torch.nn.functional import scaled_dot_product_attention

# scaled_dot_product_attention auto-dispatches Flash Attention on CUDA.
# For GQA, pass Q of shape (B, n_heads, N, d_head) and K,V of shape
# (B, n_kv_heads, N, d_head). PyTorch handles the repeat.
out = scaled_dot_product_attention(q, k, v, is_causal=True, enable_gqa=True)
```

**多少个 heads？**Regras de experiência dos modelos de produção de 2026:

| Model size | d_model | n_heads | d_head |
|------------|---------|---------|--------|
| Small (~125M) | 768 | 12 | 64 |
| Base (~350M) | 1024 | 16 | 64 |
| Large (~1B) | 2048 | 16 | 128 |
| Frontier (~70B) | 8192 | 64 | 128 |

`d_head` quase sempre está em 64 ou 128 ⋅ é uma cabeça  pode ver  quanto conteúdo unidades ⋅ inferior a 32, cabeças ⋅ começar e factor de escala `sqrt(d_head)`Com mais de 256, você perderá os benefícios de muitos pequenos especialistas.

## Entrega-o

- Não .`outputs/skill-mha-configurator.md`◊ Esta habilidade irá ser baseada no orçamento de parâmetros ◊ comprimento da sequência e objetivo de implantação, para o novo Transformer  recomendação de contagem de cabeças ◊ contagem de cabeças e estratégia de projeção ◊

## 练习

1. **简单。**取 `code/main.py`MHA, em fixação`d_model=64`Em caso de`n_heads`De 1 改到16── em tarefa de cópia sintética 上绘画一个小的单层模型的损失──更多头条是有助的,趋向平台,还是有害的?
2. **中等。**实现 MQA(Todos os cabeças de consulta 共享一个KV head)。 medir o número de parâmetros 相比全MHA下降了多少──计算推断 时 N=2048 下 KV-cache size 缩小了多少──
3. **困难。**实现 a pequena 版本 de Multi-head Atenção latente:把 K,V 压缩到级-`r`O que é que se passa?`r`Quando o cache diminui para 1/8 do total do MHA, o que significa que o valor permanece dentro do 1 bit do processo de validação?

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Head | “一个单独的 attention circuit” | 一个维度为 `d_head = d_model / n_heads` 的 Q/K/V projection，拥有自己的 attention matrix。 |
| d_head | “Head dimension” | Per-head hidden width；在 production 中几乎总是 64 或 128。 |
| Split / combine | “Reshape tricks” | Attention 前后的 `(N, d_model) ↔ (n_heads, N, d_head)` reshape+transpose。 |
| W_o | “Output projection” | Concatenating heads 之后应用的 `(d_model, d_model)` matrix；heads 在这里混合。 |
| MQA | “One KV head” | Multi-Query Attention：单个共享 K/V projection。KV cache 最小，但有一些质量损失。 |
| GQA | “The default since Llama 2” | `n_kv_heads < n_heads` 的 Grouped-Query Attention；通过重复来匹配 Q。 |
| MLA | “DeepSeek 的技巧” | Multi-head Latent Attention：K,V 被压缩到 low-rank latent，并在 attend time 解压。 |
| Induction head | “in-context learning 背后的 circuit” | 一对 heads，检测之前的出现位置，并复制其后跟随的内容。 |

## 延伸阅读

- [Vaswani et al. (2017). Attention Is All You Need §3.2.2](https://arxiv.org/abs/1706.03762) Origins de múltiplos cabeças 规范。
- [Shazeer (2019). Fast Transformer Decoding: One Write-Head is All You Need](https://arxiv.org/abs/1911.02150) MQA 论文──
- [Ainslie et al. (2023). GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245) 如何在训练后把 MHA 转换为 GQA──
- [DeepSeek-AI (2024). DeepSeek-V2 Technical Report](https://arxiv.org/abs/2405.04434) MLA, bem como por que é que está na memória cache  优于MHA/GQA──
- [Olsson et al. (2022). In-context Learning and Induction Heads](https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html) Do ponto de vista mecânico, os cabeças observam o que realmente fazem.
