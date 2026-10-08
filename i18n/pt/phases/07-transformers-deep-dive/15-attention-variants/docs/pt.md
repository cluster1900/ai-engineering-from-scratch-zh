# Atenção 变体  Janela deslizante, Sparse, Diferencial

> A atenção total é um círculo. Cada token pode ver cada token, e a memória paga por isso.

**Type:** Build
**Languages:** Python
**先修要求:**Fase 7 · 02 (Autotentão), Fase 7 · 03 (Multi-Head), Fase 7 · 12 (KV Cache / Flash Attention)
**Time:** ~60 minutes

## 问题

Atenção total no custo de memória na duração do processo é `O(N²)`, calcular o custo também `O(N²)`Para um Llama de 128K, o que significa que cada camada tem 160 bilhões de notas de atenção, multiplicadas por 80 notas.`O(N²)`Ativação dentro da memória, mas não vai mudar o cálculo custo de cada token ainda irá participar de cada outro token.

Três tipos de mudanças na Matriz de Atenção

1. **Sliding window attention (SWA).**Cada token só atende a um token próximo dentro da janela fixa, em vez de um prefixo completo.`O(N · W)`, entre os `W`É uma grande janela. Gemma 2/3
2. **Sparse / block attention.**只有选定的 `(i, j)`Para o evento foram divididos; o restante da posição foi forçado para o zero peso.
3. **Differential attention.**Utilize independente Q/K projeção 计算两张 Atenção mapa,再相减―― elimina将把权重泄漏到前几个代币的 Attention sink──Microsoft's DIFF Transformer──2024)──

Estes podem coexistir. Um modelo de fronteira de 2026 往往会混合使用它们: a maioria das camadas é SWA-1024, cada cinco camadas é uma camada global plena atenção, há uma pequena quantidade de cabeças diferenciais usadas para resolver o pesquisa.

## 概念

### Atenção à janela deslizante (SWA)

- O que é ?`i`De cada consulta só atender até `[i - W, i]`(SWA causal) ou `[i - W/2, i + W/2]`(bidirecional) 间位置──窗口外的 Token 会在分数矩阵 中得到 `-inf`- Não.

```
full causal:           sliding window (W=4):
positions 0-7          positions 0-7, W=4
    0 1 2 3 4 5 6 7        0 1 2 3 4 5 6 7
0 | x                0 |  x
1 | x x              1 |  x x
2 | x x x            2 |  x x x
3 | x x x x          3 |  x x x x
4 | x x x x x        4 |    x x x x
5 | x x x x x x      5 |      x x x x
6 | x x x x x x x    6 |        x x x x
7 | x x x x x x x x  7 |          x x x x
```

Para o`N = 8192`和 `W = 1024`O resultado da Matrix foi reduzido 8x:

**KV cache 会随 SWA 缩小。**Cada camada só precisa ser mantida por perto.`W`个 Token of K 和 V── para uma configuração similar a Gemma-3(1024 janela,128K contexto),KV cache 会降低 128×──

**质量成本。**純 SWA Transformer 難以處理長距離检索──修复方法: 在 SWA 層間交错 完全注意層──Gemma 3 使用 5:1 SWA:global──Mistral 7B 使用因果性-SWA stack,信息通过重叠窗口向前流动每一层都将有效感受野扩展`W`, passando`L`O modelo pode vir para trás.`L × W`- O que é isso?

### Atenção de pouca / bloqueio

预先选择一个 `N × N`Padrão de esparcidade:

- **Local + strided (OpenAI sparse transformer).**Atender até o último .`W`- O sinal, mais uma vez.`stride`Posição do Token.`O(N · sqrt(N))`计算同时捕捉局部和长距离信息──
- **Longformer / BigBird.**Janela local + menor quantidade de tokens globais (por exemplo)`[CLS]`), estes Token attend 到所有 Token, também被所有 Token attend + links random-sparse──在匹配质量下经验上获得2× context──
- **Native Sparse Attention (DeepSeek, 2025).**Aprender o que é que é?`(Q, K)`Bloco importante; em nível do kernel 跳过零 block──兼容 FlashAttention──

Sparse Attention é uma engenharia de kernel 故事──数学很简单(mask score Matrix); receita de 没有把零条目加载进 SRAM──FlashAttention-3 和 2026 年的 FlexAttention API 让自定义稀少模式 成为PyTorch中的等能力──

### Atenção Diferencial (Transformador DIFF, 2024)

常规注意 有一个注意 问题:softmax 强制每一行求和为 1,因此, aqueles que não querem participar especialmente de qualquer um dos tokens do conteúdo vão colocar o peso em cima do primeiro token (或前几个 token)                                                                                                                                                                                                                                    

Atenção Diferencial 通过计算**两张**O mapa da atenção não foi reduzido para resolver este problema:

```
A1 = softmax(Q1 K1^T / √d)
A2 = softmax(Q2 K2^T / √d)
DiffAttn = (A1 - λ · A2) V
```

Entre eles `λ`É uma escala que se consegue aprender, normalmente 0,50,8)。A1 捕捉真实内容权重;A2 捕捉 sink。相减会抵消 sink,把权重重新分配给相关代币。

報告結果(Microsoft 2024):perplexidade 降低 510%,在相同训练长度下有效文text 延长 1.52×,agulha-em-haystack 检索更敏。

### 变体对比ão

| Variant | Compute | KV cache | Quality vs full | Production use |
|---------|---------|----------|-----------------|----------------|
| Full attention | O(N²) | O(N) per layer | baseline | 每个模型的默认层 |
| SWA (window 1024) | O(N·W) | O(W) per layer | -0.1 ppl，搭配 global layers 效果好 | Gemma 2/3, Phi-3-Long |
| Local + strided sparse | O(N·√N) | mixed | 类似 SWA | OpenAI sparse transformer, Longformer |
| BigBird (local + global + random) | O(N) approx | mixed | 在 2× context 下匹配 full | early long-context BERT |
| Native Sparse (DeepSeek-V3.2) | O(N · active fraction) | O(N) | within 0.05 ppl | DeepSeek-V3.2, 2025 |
| Differential | O(2·N²) | O(2N) | -5 to -10% ppl | DIFF Transformer, early 2026 models |


```figure
gqa-kv-sharing
```

## Construí-lo

- Não .`code/main.py` Nós realizamos um comparador de máscara causal, em que a atenção diferencial é mostrada em conjunto na sequência de brinquedos.

### 步骤 1: mascareta causal completa (base line)

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

A partir da linha de base da lição 07;;

### 步骤 2: Máscara causal de janela deslizante

```python
def swa_mask(n, window):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
    return M
```

Um parâmetro`window`- Não.`window >= n`时,会恢复 Full Causal Atenção.`window = 1`Cada token só vai até a si mesmo.

### 步骤 3: local + passo mascarada esporádica

```python
def strided_mask(n, window, stride):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
        for j in range(0, i + 1, stride):
            M[i][j] = 0.0
    return M
```

Janela local de entrada e saída da linha de entrada`stride`个 Token's location── com o aumento do número de camadas extras, o sensí­rio é incrementado ∞

### 步骤 4: atenção diferenciada

```python
def diff_attention(Q1, K1, Q2, K2, V, lam):
    A1 = softmax_causal(Q1 @ K1.T / sqrt_d)
    A2 = softmax_causal(Q2 @ K2.T / sqrt_d)
    return (A1 - lam * A2) @ V
```

两次 Atenção passar, usando o coefficiente de mistura obtido de aprendizagem 相减──在代码中,我们比较单一注意与差别注意的注意-sink heatmap,并观察 sink 缩──

### 步骤 5: tamanhos do cache KV

Em`N = 131072`Imprimir cada camada de cache de cada variação. SWA 和稀稀变体会降低 10100×── Diferencial 会翻倍──

## Use-o

Modelo de produção de 2026:

```python
from transformers import AutoModelForCausalLM
# Gemma 3 mixes SWA (window=1024) and global layers at 5:1.
model = AutoModelForCausalLM.from_pretrained("google/gemma-3-27b-it")
# print(model.config.sliding_window, model.config.layer_types)
```

PyTorch 2.5+ 中的 FlexAttention  aceitar uma função de máscara:

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

def swa_pattern(b, h, q_idx, kv_idx):
    return (q_idx - kv_idx < 1024) & (q_idx >= kv_idx)

mask = create_block_mask(swa_pattern, B=batch, H=heads, Q_LEN=n, KV_LEN=n)
out = flex_attention(q, k, v, block_mask=mask)
```

Este será composto em auto-definir kernel Triton. Para padrão comum, a velocidade é de 10% da FlashAttention-3, e a função de máscara é um Python chamada.

**何时选择哪一种：**

- **Pure full attention** Cada camada é adequada para um contexto máximo de cerca de 16K, ou inspeção de qualidade.
- **SWA + global mix** 长 context(>32K), treinamento e inferência 受内存限制──2026年 32K 以上的默认选择──
- **Sparse block attention** Self-definition kernel、self-definition pattern── reservado para carga de trabalho especial(检索、音频)。
- **Differential attention**  qualquer contaminação por sumidouro de atenção causará danos

## Entrega-o

- Não .`outputs/skill-attention-variant-picker.md` Esta habilidade irá, de acordo com o longo contexto do objetivo, a procura de necessidades e o perfil de computação de treinamento/inferência, selecionar uma topologia de atenção para um novo modelo.

## 练习

1. **Easy.**运行 `code/main.py`❖ O teste `window=4`O SWA 会把每一行中最近4个代币 之外的所有内容置零――验证 `window=n`会 bit-identicamente 复现 plena atenção causal。
2. **Medium.**Na lição 07 , a pedra angular é a realização .`window=1024`O que é que é o SWA causal?
3. **Hard.**Em um modelo de capstone, é possível realizar uma mistura de camadas de 5:1 de estilo Gemma-3 (5,1 camadas SWA, 1 camada global) ⋅ em condições de correspondência, em comparação com a perda de memória e qualidade de geração de base de SWA e de base global pura.
4. **Hard.**Realizar cada cabeça tem que aprender`λ`Em uma tarefa de recuperação sintética (uma agulha, 2.000 distractores) em um ensaio, a precisão de recuperação em relação à linha de base de atenção única é medida em caso de correspondência de parâmetros.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Sliding window attention (SWA) | "Local attention" | 每个 query attend 到最近 `W` 个 Token；KV cache 缩小到 `O(W)`。 |
| Effective receptive field | "模型能向后看多远" | 在一个窗口为 `W` 的 `L` 层 SWA stack 中，最多 `L × W` 个 Token。 |
| Longformer / BigBird | "Local + global + random" | Sparse pattern，包含少量始终 attend 的 global tokens；早期 long-context 方法。 |
| Native Sparse Attention | "DeepSeek's kernel trick" | 学习 block-level sparsity；在保持质量的同时，在 kernel 层面跳过零 block。 |
| Differential attention | "Two maps, one subtracts" | DIFF Transformer：从第一张 Attention map 中减去学习得到的 `λ` 倍第二张 Attention map，以抵消 attention sinks。 |
| Attention sink | "权重泄漏到 token 0" | Softmax normalization 强制行求和为 1；信息量不足的 query 会把权重倾倒到位置 0。 |
| FlexAttention | "Mask-as-Python" | PyTorch 2.5+ API，可将任意 mask function 编译成 FlashAttention 形状的 kernel。 |
| Layer type mix | "5:1 SWA-to-global" | 在 stack 中交错 sparse 和 full Attention 层，以更低内存保持质量。 |

## 延伸阅读

- [Beltagy, Peters, Cohan (2020). Longformer: The Long-Document Transformer](https://arxiv.org/abs/2004.05150) 经典的滑窗+global-token 论文──
- [Zaheer et al. (2020). Big Bird: Transformers for Longer Sequences](https://arxiv.org/abs/2007.14062)Local + global + aleatório.
- [Child et al. (2019). Generating Long Sequences with Sparse Transformers](https://arxiv.org/abs/1904.10509) Patrão local+estampado do OpenAI
- [Gemma Team (2024). Gemma 2: Improving Open Language Models at a Practical Size](https://arxiv.org/abs/2408.00118) 1:1 SWA: mix global
- [Gemma Team (2025). Gemma 3 technical report](https://arxiv.org/abs/2503.19786) mix de 5:1 de windows=1024 , hoje é uma configuração padrão do ensino.
- [Ye et al. (2024). Differential Transformer](https://arxiv.org/abs/2410.05258) Transformador DIFF 论文。
- [Yuan et al. (2025). Native Sparse Attention](https://arxiv.org/abs/2502.11089) DeepSeek-V3.2 - aprendiz de esparsidade Atenção
- [PyTorch — FlexAttention blog and docs](https://pytorch.org/blog/flexattention/) Use It 中 mascar-as-call-able pattern de referência API。
