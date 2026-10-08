# Desde零构建 Transformer  Capstone 项目

> 十三节课──一个模型──不走捷径──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 01 到 13。不要跳过。
**Time:** 约 120 分钟

## 问题

Você já leu cada artigo. Você já conseguiu atenção, múltipla cabeça, desligação, codificação de posição, codificador e bloqueio de decodificador, perda de BERT e GPT, cache MoE, KV, agora deixá-los em um trabalho em conjunto em uma tarefa real.

Essa pedra angular: em um modelo de linguagem de nível de caracteres  tarefa de treinar um transformador de decodificador pequeno apenas.

É o tutorial de nanoGPT de Karpathy 2023, que cada aluno escreverá pelo menos uma vez para a implementação de referência.

## 概念

![Transformer-from-scratch block diagram](../assets/capstone.svg)

架构标注如下:

```
input tokens (B, N)
   │
   ▼
token embedding + positional embedding  ◀── Lesson 04 (RoPE option)
   │
   ▼
┌──── block × L ────────────────────┐
│  RMSNorm                          │  ◀── Lesson 05
│  MultiHeadAttention (causal)      │  ◀── Lesson 03 + 07 (causal mask)
│  residual                         │
│  RMSNorm                          │
│  SwiGLU FFN                       │  ◀── Lesson 05
│  residual                         │
└────────────────────────────────── ┘
   │
   ▼
final RMSNorm
   │
   ▼
lm_head (tied to token embedding)
   │
   ▼
logits (B, N, V)
   │
   ▼
shift-by-one cross-entropy            ◀── Lesson 07
```

### Nós entregamos o que

- `GPTConfig` 统一配置所有超参数 的地方──
- `MultiHeadAttention` Causal ∼ batched,并带有可选的闪电风格的路径`scaled_dot_product_attention`)。
- `SwiGLUFFN` 现代 FFN。
- `Block` pré-norma, usando o resíduo 包裹注意 + FFN。
- `GPT` embebimentos, blocos empilhados, cabeças de LM, geradores de
- Utilize o ciclo de treinamento de AdamW、cosine LR、clipagem gradiente
- Shakespeare 文本上的char-level tokenizer──

### Nós não entregamos nada

- RoPE  Lição 04  já foi implementada desde o conceito.
-  Cada passo de geração irá ser em prefixo completo.
- Atenção Flash  PyTorch 2.0+ 会在输入匹配时自动发送;我们使用 `F.scaled_dot_product_attention`- Não.
- MoE  Cada bloco usa um único FFN── já viste MoE na lição 11──

### 目标指标

Em um laptop Mac M2, um GPT de 4 camadas, 4 cabeças, d_model=128 em`tinyshakespeare.txt`上训练 2000 passos:

- Perda de treinamento em cerca de 6 minutos de cerca de 4,2 ) recebido aleatório a cerca de 1,5 
- 采样输出看起来具有莎士比亚的形态:古风词汇、换行,以及像 ROMEO: 这样专名称会出现──
- Val perda (conhecida 10% final do texto) seguido de forma próxima da perda de formação; em esta dimensão/orçamento, não há sobre-ajustamento.


```figure
n5-block-stack
```

## Construí-lo

本课使用 PyTorch──安装 `torch`(Construção de CPU 即可)`code/main.py`❖ 脚本会处理:

- Se falta, então,`tinyshakespeare.txt`(或读取本地副本)
- Tokenizer de carros de nível byte.
- 90/10 de trens/val divididos
- Em hardware de suporte, use o loop de treinamento do autocast bf16.
-                                                                                                                                                                                                                                                               

### 步骤 1: dados

```python
text = open("tinyshakespeare.txt").read()
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
encode = lambda s: [stoi[c] for c in s]
decode = lambda xs: "".join(itos[x] for x in xs)
```

65 个唯一字符──极小的词汇──适合4byte vocab_size──没有 BPE,也没有代码器 麻烦──

### 步骤 2: modelo

参见 `code/main.py`◊ Este bloco é a lição 05  pré-norma  RMSNorm  SwiGLU  MHA causal ⋅ 4/4/128 ⋅ contagem de parâmetros: cerca de 800K ⋅

### 步骤 3: ciclo de treinamento

随机取一批长度为 256的代号窗口──Forward──Shift-by-one cross-entropy──Backward──AdamW step──Log──重复──

```python
for step in range(max_steps):
    x, y = get_batch("train")
    logits = model(x)
    loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()
    opt.zero_grad()
```

### 步骤 4: amostra

给定一个提示,反复前进,从顶部logits 中样本,append,然后继续──500 tokens 后停止──

### 步骤 5: ler a saída

2.000 passos 后:

```
ROMEO:
Away and mild will not thy friend, that thou shalt wit:
The chief that well shame and hath been his friends,
...
```

Não é Shakespeare, mas tem a forma de Shakespeare, para os parâmetros de 800K e laptop, é um sucesso claro.

## Use-o

Esta pedra angular é uma arquitetura de referência. Para expandir-se para algo realmente útil, há três direções:

1. **更换 tokenizer。**Utilize BPE (por exemplo)`tiktoken.get_encoding("cl100k_base")`O volume do vocabulário vai de 65 a cerca de 50.000.
2. **在更大的 corpus 上训练。**Utilização `OpenWebText`Ou `fineweb-edu`(HuggingFace) ・・・ em um único张 A100 上用10B tokens 训练一个125M-param GPT 大约需要24小时──
3. **添加 RoPE + KV cache + Flash Attention。**Os exercícios a seguir vão guiá-lo a completar cada um dos seus trabalhos.

Finalmente, conseguiremos um GPT de parâmetro de 125M, que pode gerar fluxos. Não é um modelo de fronteira. Mas o mesmo código de caminho é apenas maior. É o mesmo que o Instituto Carpathy, EleutherAI e Allen, que irá treinar os pontos de controle de pesquisa em 2026.

## Entrega-o

参见 `outputs/skill-transformer-review.md` Esta habilidade irá ser orientada para a correcção da cobertura da primeira parte da aula, examinar uma implementação transformadora a partir do zero.

## 练习

1. **Easy.**运行 `code/main.py` Verificar o modelo que você treinou  Perda de validação do último passo  inferior a 2,0  `max_steps`A perda de valor de 2000 para 5000 voltas vai continuar a melhorar?
2. **Medium.**Usar RoPE  substituir embutições posicionais aprendidas.`MultiHeadAttention`内部对 Q 和 K 应用转转――训练并验证 值损失 至少同样低――
3. **Medium.**Em um ciclo de amostragem, implementar o cache KV.
4. **Hard.**给模型 添加第二头,用来预测下一个多个代币(MTP  Multi-Token Prediction from DeepSeek-V3);;联合训练;;¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
5. **Hard.**Utilize 4 especialistas MoE  substituir cada bloco de cada FFN.

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| nanoGPT | “Karpathy 的 tutorial repo” | 最小化的 decoder-only transformer training code，约 300 LOC；canonical reference。 |
| tinyshakespeare | “标准 toy corpus” | 约 1.1 MB 文本；自 2015 年以来几乎每个 character-LM tutorial 都使用它。 |
| Tied embeddings | “共享 input/output matrix” | LM head weight = token embedding matrix 的转置；节省 parameters，并提升质量。 |
| bf16 autocast | “Training precision trick” | 用 bf16 运行 forward/back，在 fp32 中保留 optimizer state；自 2021 年以来成为标准做法。 |
| Gradient clipping | “阻止 spikes” | 将 global grad norm 限制在 1.0；防止 training blowups。 |
| Cosine LR schedule | “2020+ 默认选择” | LR 先线性上升（warmup），然后按 cosine 形状衰减到峰值的 10%。 |
| MFU | “Model FLOP Utilization” | 实际达到的 FLOPs / 理论峰值；2026 年 40% dense、30% MoE 已经很强。 |
| Val loss | “Held-out loss” | 在 model 从未见过的数据上计算 Cross-Entropy；overfit detector。 |

## 延伸阅读

- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/)Implementação com anotações  经典的.
