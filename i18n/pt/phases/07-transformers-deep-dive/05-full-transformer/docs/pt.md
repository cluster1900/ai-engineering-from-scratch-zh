# O Transformador Completo  Encoder + Decodificador

> A atenção é o principal ponto. Tudo o resto, a normalização, a alimentação, a atenção cruzada, fazem com que você possa encher-se numa estrutura muito profunda.

**Type:** Build
**Languages:** Python
**先修要求:**Fase 7 · 02 (Autodependência), Fase 7 · 03 (Atendência de várias cabeças), Fase 7 · 04 (Codificação de posição)
**Time:** ~75 minutes

## 问题
Uma camada de atenção é um traço de extração, não um modelo. Cada camada de cada vez é insuficiente para a linguagem.

Em 2017, Vaswani 论文打包了六个设计决策,把一个注意层 变成可堆叠的块――此后的每个变体只编码器 (BERT) 只编码器 (GPT) 只编码器-decoder (T5) 都继承了同一个骨架――到2026年,这些块已经改进了(RMSNorm、SwiGLU、pre-norm、RoPE),但骨架完全相同――

Este curso fala sobre esta estrutura.

## 概念
![Encoder and decoder block internals, wired](../assets/full-transformer.svg)

### 六个组成部分

1. **Embedding + positional signal.**Tokens → Vectores。Posição 通過 RoPE(现代) 或 sinusoidal(经典)注入。
2. **Self-attention.**Cada posição está presente em cada outra posição.
3. **Feed-forward network (FFN).**按位置 作用的两层 MLP:`W_2 · activation(W_1 · x)`◊ MERÇÃO Rápido de expansão = 4×♦
4. **Residual connection.** `x + sublayer(x)`Sem ele, os gradientes desaparecem depois de seis níveis.
5. **Layer normalization.** `LayerNorm`Ou `RMSNorm`(现代) ・ Estabilização do fluxo residual
6. **Cross-attention (decoder only).**Queries de decodificador, chaves e valores de saída de codificador.

### Bloco de codificação ((BERT、T5 codificador 使用)

```
x → LN → MHA(self) → + → LN → FFN → + → out
                     ^              ^
                     |              |
                     └── residual ──┘
```

O codificador é bidirecional. Não há mascaragem. Todas as posições podem ver todas as posições.

### Bloco de decodificador ((GPT、T5 decodificador 使用)

```
x → LN → MHA(masked self) → + → LN → MHA(cross to encoder) → + → LN → FFN → + → out
```

Decodificador Cada bloco tem três subcamadas. No meio, a atenção transversal é a única posição da informação do encodificador.

### Pre-norma versus pós-norma

Origem:`x + sublayer(LN(x))`- Não .`LN(x + sublayer(x))` Post-norma em 2019 ou menos  Se não houver aquecimento detalhado, é difícil treinar muito profundamente  Pre-norma  em subcamada `LN`) é o default selection de 2026: Llama、Qwen、GPT-3+、Mistral 都使用它──

### Bloco de modernização de 2026

Vaswani 2017 utiliza é LayerNorm + ReLU。现代 stack  substituído 两者──生产级块 实际看起来是这样:

| Component | 2017 | 2026 |
|-----------|------|------|
| Normalization | LayerNorm | RMSNorm |
| FFN activation | ReLU | SwiGLU |
| FFN expansion | 4× | 2.6×（SwiGLU 使用三个 matrices，总参数量匹配） |
| Position | Sinusoidal absolute | RoPE |
| Attention | Full MHA | GQA（或 MLA） |
| Bias terms | Yes | No |

RMSNorm eliminou a centrais média de LayerNorm (((menos subtração uma vez), economizou o cálculo, e, a partir da experiência, ficou pelo menos igual.`Swish(W1 x) ⊙ W3 x`) em Llama、PaLM 和 Qwen 论文中稳定优优于 ReLU/GELU FFN,ppl 约提升 0.5 个点──

### Contagem de parâmetros

Para um .`d_model = d`且 FFN expansão 为 `r`O bloco:

- MHA: `4 · d²`(Projeções Q, K, V, O)
- FFN (SwiGLU): `3 · d · (r · d)`- Não .`3rd²`
- Normas: 可忽略

- Não .`d = 4096, r = 2.6, layers = 32`(大致对应 Llama 3 8B)`32 · (4·4096² + 3·2.6·4096²) ≈ 32 · (16 + 32) M = ~1.5B parameters per layer × 32 ≈ 7B`(mais adição de embebimentos e cabeças)


Observe um vetor  como fluir através de um único bloco: Atenção em posição em meio a informações misturadas, resíduos, coloque o sinal em movimento, mantenha a norma  deixe o fluxo residual estável.

```figure
transformer-block
```

## Construí-lo
### 步骤 1: blocos de construção

Utilize Lesson 03 中的小型 `Matrix`classe ((para independência já copiado para este arquivo):

- `layer_norm(x, eps=1e-5)` 减去 mean,除以 std。
- `rms_norm(x, eps=1e-6)` Excepto em RMS──不减去 mean──
- `gelu(x)`和 `silu(x) * W3 x`(SwiGLU)
- `ffn_swiglu(x, W1, W2, W3)`- Não.
- `encoder_block(x, params)`和 `decoder_block(x, enc_out, params)`- Não.

完整线路 见 `code/main.py`- Não.

### 步2: fio um codificador de 2 camadas e um decodificador de 2 camadas

Colocar-as em cima. Transmitir-se-á a atenção transversal de cada decodificador.

```python
def encode(tokens, params):
    x = embed(tokens, params.emb) + sinusoidal(len(tokens), params.d)
    for block in params.encoder_blocks:
        x = encoder_block(x, block)
    return x

def decode(target_tokens, encoder_out, params):
    x = embed(target_tokens, params.emb) + sinusoidal(len(target_tokens), params.d)
    for block in params.decoder_blocks:
        x = decoder_block(x, encoder_out, block)
    return x
```

### 步骤 3: Em exemplo de brinquedo 上运行 前进

输入一个 6-token source 和一个 5-token target──验证输出形 是 `(5, vocab)`Não se trata de uma construção, mas de uma perda.

### 步骤 4: 换成 RMSNorm + SwiGLU

Use RMSNorm 和 SwiGLU 替换 LayerNorm 和 ReLU-FFN── confirmar formas 仍然匹配──这是2026年的现代化,只需要一次函数 替换──

## Use-o
Implementações de referência PyTorch/TF:`nn.TransformerEncoderLayer`- Não.`nn.TransformerDecoderLayer`Mas a maioria dos anos 2026 de produção irá bloquear a sua própria realização, porque:

- A atenção flash é usada na atenção interna, e não através dela.`nn.MultiheadAttention`- Não.
- GQA / MLA 不在 stdlib referência 中──
- RoPE、RMSNorm、SwiGLU não são padrões PyTorch。

HF `transformers`Há blocos de referência claros, vale a pena ler:`modeling_llama.py`É um bloco canônico de decodificação de 2026... é de 500 páginas, vale a pena ler completamente.

**Encoder vs decoder vs encoder-decoder — 什么时候选择：**

| Need | Pick | Example |
|------|------|---------|
| Classification、embeddings、基于文本的 QA | Encoder-only | BERT, DeBERTa, ModernBERT |
| Text generation、chat、code、reasoning | Decoder-only | GPT, Llama, Claude, Qwen |
| Structured input → structured output（translation、summarization） | Encoder-decoder | T5, BART, Whisper |

O decodificador-só vence nas tarefas linguísticas, porque é mais fácil de fazer na escala, e ao mesmo tempo processar a compreensão e geração.

## Entrega-o
- Não .`outputs/skill-transformer-block-reviewer.md` Esta habilidade irá ser implementada em uma nova implementação de blocos de transformadores, de acordo com a revisão de configuração em 2026 e marcou a falta de parte (pre-norma, RoPE, RMSNorm, GQA, FFN)

## 练习
1. **Easy.**统计你的编码_block 在 `d_model=512, n_heads=8, ffn_expansion=4, swiglu=True`时的参数── através da implementação deste bloco 并使用 `sum(p.numel() for p in block.parameters())`- Não.
2. **Medium.**De pós-norma 切换到前-norma──初始化两者,并在随机输入上测量堆叠 12层后的激活规范──pós-norma 应会爆炸;pré-norma 应保持有界──
3. **Hard.**Em tarefa de cópia de brinquedo`x`O processo de desenvolvimento de um codificador-decodificador de 4 camadas é de 100 passos.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Block | “一个 transformer layer” | norm + attention + norm + FFN 的 stack，并包在 residual connections 中。 |
| Residual | “Skip connection” | `x + f(x)` output；让 gradients 能够流过 deep stacks。 |
| Pre-norm | “先 normalize，不是之后” | 现代形式：`x + sublayer(LN(x))`。无需 warmup 技巧也能训练得更深。 |
| RMSNorm | “没有 mean 的 LayerNorm” | 除以 RMS；少一个 op，经验稳定性相同。 |
| SwiGLU | “大家都切换过去的 FFN” | `Swish(W1 x) ⊙ W3 x → W2`。在 LM ppl 上优于 ReLU/GELU。 |
| Cross-attention | “decoder 如何看到 encoder” | Q 来自 decoder、K/V 来自 encoder outputs 的 MHA。 |
| FFN expansion | “中间 MLP 有多宽” | hidden-size 与 d_model 的比率，通常为 4（LayerNorm）或 2.6（SwiGLU）。 |
| Bias-free | “去掉 +b 项” | 现代 stacks 在线性层中省略 biases；ppl 略有提升，model 更小。 |

## 延伸阅读
- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762)Especificações de blocos primitivos
- [Xiong et al. (2020). On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745)Por que a pré-norma é melhor no fundo do que a pós-norma?
- [Zhang, Sennrich (2019). Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467) RMSNorm。
- [Shazeer (2020). GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202) SwiGLU 论文──
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) bloco canônico 2026 apenas para decodificadores。
