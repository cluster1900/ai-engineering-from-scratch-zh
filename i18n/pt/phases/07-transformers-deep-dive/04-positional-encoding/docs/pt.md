# Encodificação de posição  Sinusoidal, RoPE, ALiBi

> Atenção à排列不敏感──没有位置信号时,The cat sat on the mat和mat the on sat cat the会产生相同输出──三种算法修复它每种都对position的含义做了不同下注──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention)
**Time:** ~45 分钟

## O problema

Escalada atenção de produto ponto para sequência não sensivel.`softmax(Q K^T / √d) V`Por pareiras semelhanças 计算得到──打乱 `X`A linha, a linha de saída também serão perturbadas da mesma forma.

Este modelo de saco de palavras não é um bug... mas para a linguagem, código, áudio, vídeo, bem como qualquer ordem que carregue significado, é fatal...

O método de modificação é de alguma forma inserir a posição em embutidos.

1. **Absolute sinusoidal**(Vaswani 2017)。将 posição `sin/cos`Adição de embedamento 上──简单、不需要学习参数, but for training length 非常差──
2. **RoPE — Rotary Position Embeddings**(Su 2021) ・按与位置 成比例的角度旋转 Q 和 K vectors──直接在点产品中编码 *relativa* posição──2026年的主流选择──
3. **ALiBi — Attention with Linear Biases**(Presião 2022)── totalmente saltado embutidos; baseada na distância 给注意分加上 per head linear penalty──长度抽插 极佳──

截至2026年, quase todos os modelos de fronteira aberta utilizam RoPE:Llama 2/3/4、Qwen 2/3、Mistral、Mixtral、DeepSeek-V3、Kimi。 Poucos modelos de longo contexto utilizam ALiBi 或其现代变体──Absolute sinusoidal 已成为历史方案──

## O conceito

![Sinusoidal absolute vs RoPE rotations vs ALiBi distance bias](../assets/positional-encoding.svg)

### A posição de posição é igual a:

预先计算一个形 为 `(max_len, d_model)`Matrix fixa`PE`- Não .

```
PE[pos, 2i]   = sin(pos / 10000^(2i / d_model))
PE[pos, 2i+1] = cos(pos / 10000^(2i / d_model))
```

Então, em atenção, antes de executar.`X' = X + PE[:N]`◊ Cada dimensão são sinusoides de diferentes frequências ◊ modelo de aprendizagem de padrão de fase 中读取位置 ◊超过 `max_len`后会失败: Quando o modelo só viu posições 02047 时, nada diz que a posição 2048 会发生什么.

### RoPE

旋转 Q 和 K vectores(não são embutidos)`(2i, 2i+1)`- Não .

```
[q'_2i    ]   [ cos(pos·θ_i)  -sin(pos·θ_i) ] [q_2i   ]
[q'_2i+1  ] = [ sin(pos·θ_i)   cos(pos·θ_i) ] [q_2i+1 ]

θ_i = base^(-2i / d_head),  base = 10000 by default
```

Para a posição`pos_k` aplicada o mesmo rotativo.`q'_m · k'_n`Vai ficar dependente.`(m - n)`Definição:**attention score 只依赖 relative distance**, apesar de a rotação ser feita por posições absolutas.

扩展 RoPE: pode ser reduzido `base`(NTK-consciente、YaRN、LongRoPE), para extrapolar até um contexto mais longo em um contexto de não re-treino.

### A.L.B.

跳过嵌入 技巧──直接给注意分加偏见:

```
attn_score[i, j] = (q_i · k_j) / √d  -  m_h · |i - j|
```

Entre eles `m_h`É inclinação específica da cabeça.`1 / 2^(8·h/H)`O que é um exemplo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de um estudo de

### 2026 ano que escolher

| Variant | Extrapolation | Training cost | Used by |
|---------|---------------|---------------|---------|
| Absolute sinusoidal | 差 | 免费 | original transformer, early BERT |
| Learned absolute | 无 | 很小 | GPT-2, GPT-3 |
| RoPE | 配合 scaling 时很好 | 免费 | Llama 2/3/4, Qwen 2/3, Mistral, DeepSeek-V3, Kimi |
| RoPE + YaRN | 极佳 | fine-tune stage | Qwen2-1M, Llama 3.1 128K |
| ALiBi | 极佳 | 免费 | BLOOM, MPT, Baichuan |

RoPE 胜出, é porque ele pode inserir diretamente a atenção e não mudar a arquitetura, pode codificar a posição relativa, e o seu `base`O hiperparâmetro para ajuste de longo contexto forneceu uma clara rotatividade.


```figure
rope-explorer
```

## Construí-lo

### Passo 1: codificação sinusoidal

- Não .`code/main.py`△4 行计算:

```python
def sinusoidal(N, d):
    pe = [[0.0] * d for _ in range(N)]
    for pos in range(N):
        for i in range(d // 2):
            theta = pos / (10000 ** (2 * i / d))
            pe[pos][2 * i]     = math.sin(theta)
            pe[pos][2 * i + 1] = math.cos(theta)
    return pe
```

Na primeira camada de atenção, antes, vai adicioná-lo para a matriz de incorporação.

### Passo 2: 应用于 Q、K's RoPE

RoPE 会在 Q 和 K 上原地操作──对对对对 dims:

```python
def apply_rope(x, pos, base=10000):
    d = len(x)
    out = list(x)
    for i in range(d // 2):
        theta = pos / (base ** (2 * i / d))
        c, s = math.cos(theta), math.sin(theta)
        a, b = x[2 * i], x[2 * i + 1]
        out[2 * i]     = a * c - b * s
        out[2 * i + 1] = a * s + b * c
    return out
```

关键: em posição `m`de Q 和 posição `n`de K  aplicada a mesma função. O produto de pontos deles vai em cada par de coordenadas para obter um.`cos((m-n)·θ_i)`因子──Attention 免费学到相对位置──

### Passo 3: Alíbi inclinações 和 viés

```python
def alibi_bias(n_heads, seq_len):
    # slope_h = 2 ** (-8 * h / n_heads) for h = 1..n_heads
    slopes = [2 ** (-8 * (h + 1) / n_heads) for h in range(n_heads)]
    bias = []
    for m in slopes:
        row = [[-m * abs(i - j) for j in range(seq_len)] for i in range(seq_len)]
        bias.append(row)
    return bias  # add to attention scores before softmax
```

- Não .`bias[h]`- A cabeça.`h`de `(seq_len, seq_len)`Matriz de pontuação de atenção 上, então softmax──

### Passo 4: 验证 Propriedade relativa de distância do RoPE

选两个随机向量 `a, b`❖ Primeiro `(pos_a, pos_b)`旋转──再按 `(pos_a + k, pos_b + k)`旋转──两个点产品 必须在浮点错误内相等──这个性质就是RoPE的全部意义它对绝对的抵消不变,只关乎相对差距──

## Usá-lo

PyTorch 2.5+ em`torch.nn.functional`中提供 RoPE utilitários。 a maioria produzir código de uso `flash_attn`Ou `xformers`, RoPE 会在注意内核内应用──

```python
from transformers import AutoModel
model = AutoModel.from_pretrained("meta-llama/Llama-3.2-3B")
# model.config.rope_scaling → {"type": "yarn", "factor": 32.0, "original_max_position_embeddings": 8192}
```

**2026 年的 Long-context 技巧：**

- **NTK-aware interpolation。**De 4K  expandindo para 16K + 时,将 `base`重新缩放为 `base * (scale_factor)^(d/(d-2))`- Não.
- **YaRN。**Mais inteligente de interpolação, pode em contextos longos manter a entropia da atenção.
- **LongRoPE。**Microsoft 2024 年方法, usando pesquisa evolutiva para cada dimensão selecionar fatores de escala―Phi-3-Long
- **Position interpolation + fine-tuning。**Apenas preciso de um factor de extensão  reduzir as posições, e ajustar os tokens 15B―

## Envia-o

- Não .`outputs/skill-positional-encoding-picker.md`◊ Esta habilidade irá ser aplicada de acordo com o contexto-alvo, as necessidades de extrapolação e o orçamento de formação, para um novo modelo escolher a estratégia de codificação

## Exercícios

1. **Easy。**- Não .`max_len=512, d=128`O sinusoidal`PE`Matriz 绘制为热图──确认随着维度指数 增大,条条 变宽的图案──
2. **Medium。**实现 NTK-consciente RoPE escalado── em sequências de 256 de comprimento 上训练微小LM,然后在长度 1024 上分别测试有规模和无规模的情况──测量困难──
3. **Hard。**Em um mesmo módulo de atenção, implementar ALiBi e RoPE. Em sequências de 512 de comprimento, utilizar a tarefa de cópia. Treinar transformador de 4 camadas.

## Termos-chave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Positional encoding | “告诉 attention 顺序” | 添加到 embeddings 或 attention 中、用于编码 position 的任意 signal。 |
| Sinusoidal | “最初那个” | 以 geometric frequencies 加到 embeddings 上的 `sin/cos`；不能 extrapolate。 |
| RoPE | “Rotary embeddings” | 按 position-dependent angle 旋转 Q、K；dot product 编码 relative distance。 |
| ALiBi | “Linear bias trick” | 将 `-m·\|i-j\|` 加到 attention scores；不需要 embedding，extrapolation 很强。 |
| base | “RoPE 的旋钮” | RoPE 中的 frequency scaler；增大它可在 inference 时扩展 context。 |
| NTK-aware | “一种 RoPE scaling trick” | 重新缩放 `base`，让 context 扩展时 high-frequency dims 不会被挤压。 |
| YaRN | “高级那个” | 保留 attention entropy 的 per-dimension interpolation+extrapolation。 |
| Extrapolation | “能在训练长度之外工作” | position scheme 能否在训练时见过的 `max_len` 之外给出正确输出？ |

## Mais leitura

- [Vaswani et al. (2017). Attention Is All You Need §3.5](https://arxiv.org/abs/1706.03762) 原始 sinusoidal──
- [Su et al. (2021). RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864)Papel de RoPE
- [Press, Smith, Lewis (2021). Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409) ALiBi。
- [Peng et al. (2023). YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071) estado da técnica RoPE escalação。
- [Chen et al. (2023). Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595) Meta de Llama 2 papel de longo contexto。
- [Ding et al. (2024). LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens](https://arxiv.org/abs/2402.13753) Microsoft 方法,被 Phi-3-Long 使用,并使用它 部分引用──
- [HuggingFace Transformers — `modeling_rope_utils.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_rope_utils.py) Implementações de nível de produção de diferentes esquemas de escalagem de RoPE (default, linear, dinâmico, YaRN, LongRoPE, Llama-3)
