# Previsão de multi-tokens (MTP)

> De GPT-2 a Llama 3, cada um dos LLM de regressão em cada posição é baseado em uma perda  Treinamento: pré-anúncio de um Token. DeepSeek-V3 aumentou uma segunda perda em cada posição: pré-anúncio de um outro Token.                                                                                                                                                                                                                                                                                                                                                                                                                                                           

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 10 · 04（预训练 mini GPT）、Phase 10 · 15（speculative decoding）
**Time:** ~60 分钟

## Objectivo de aprendizagem

- Explicar MTP                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
- 解释 Gloeckle et al. de cabeças MTP paralelas(2024) e entre módulos MTP sequenciais do DeepSeek-V3, bem como por que sequenciais 设计能保留因果链──
- 计算在预训运行中加入MTP模块的参数和内存开销──
- Desde zero, é possível implementar um módulo MTP:embedding compartilhado, bloco de transformador por profundidade, projecção e cabeçalho de saída compartilhado.

## 问题

A previsão de tokens seguintes é o objetivo de treinamento de LLM padrão. Cada estado oculto é supervisionado para prever uma única coisa: o token seguinte. É um sinal inesperadamente fraco. A maior parte da informação da sequência se estende para um token.

O MTP  planteou a questão de que se cada estado oculto fosse monitorado para uma vez prever vários futuros Token 会怎么?Gloeckle et al. (Meta, 2024) provam que isso ajuda. Sua implementação é colocar várias cabeças de saída independentes sobre a espinha dorsal, cada cabeça 预测 diferentes offset.

DeepSeek-V3 (em 2024) vai MTP 重新设计为序列模块,在每个预测深度上保留因果链――模型从 `h_i^(0)`预测 `t+1`E depois de um novo estado escondido.`h_i^(1)`预测 `t+2`, e`h_i^(1)`- Não .`h_i^(0)`和 `E(t+1)`Embedding, de acordo com este tipo de sugestão. Cada profundidade tem seus próprios pequenos blocos de transformador. Embedding compartilhado e cabeçalho de saída compartilhado. Deixe os parâmetros de distribuição manter-se em um alcance moderado.

Este curso vai desde zero construir um único módulo MTP e D-profundidade de perda.

## 核心概念

### MTP sequencial 配方

DeepSeek-V3 está no modelo principal.`D`个 MTP módulos── cada módulo `k`(entre eles `k = 1..D`) pré测 profundidade `k`O sinal é que está em posição determinada.`i`时预测                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `t_{i+k}`- Não.

Modulo `k`包含:

- Um bloco de transformador .`T_k`, ter a sua própria atenção, e MLP.
- Uma matriz de projeção .`M_k`, vai incorporar o estado oculto da primeira profundidade com o símbolo da verdade da segunda profundidade.
- Embarcação compartilhada `E`(与主模型相同)
- cabeçalho de saída compartilhado `Out`(与主模型相同)

                                                                                                                                                                                                                                                              `i`O prefixo, por estado oculto de profundidade, é:

```
h_i^(0) = main model backbone at position i
h_i^(k) = T_k( M_k * concat(RMSNorm(h_i^(k-1)), RMSNorm(E(t_{i+k}))) )   for k >= 1
```

Previsão por profundidade 为:

```
logits_{i+k} = Out(h_i^(k-1))   for k = 1..D
```

Perda de profundidade é em relação à verdade fundamental.`t_{i+k}`- A entropia cruzada:

```
L_k = CE(logits_{i+k}, t_{i+k})
```

Perda articular de profundidade:

```
L_MTP = (lambda / D) * sum_{k=1..D} L_k
```

`lambda`É um menor peso-factor, Profundos Buscar-V3 em 10% antes do treino Usar 0,3, depois usar 0,1...`L_main + L_MTP`- Não.

### Por que é sequencial, e não paralelo?

Gloeckle inicial paralelo MTP tem D  cabeças de saída, cada um aplicado diretamente até `h_i^(0)`Cada cabeça está no mesmo estado oculto da espinha vertebral.`t_{i+k}`- Sim, sim. - Sim, sim. - Sim.`head_1`O que é que se passa?`head_2`Estas cabeças são as que fazem o que eu faço.

DeepSeek-V3 sequencial design de`h_i^(k-1)`Adiós real de next-token embutida `E(t_{i+k})`Construção`h_i^(k)`Isto manteve a cadeia causal: para a previsão.`t_{i+k+1}`, profundidade `k+1`O módulo vai ver`t_{i+k}`处的内容──这在结构上与自归解码器 消费自输出方式相同,因此, os módulos MTP podem ser diretamente utilizados como desenhadores de descodificação especulativa──

推理时:将 `h_i^(k-1)`E o que se está a fazer?`t_{i+k}`输入 módulo `k+1`- Não , não .`t_{i+k+1}`É um projeto de estilo EAGLE, apenas usando um bom módulo MTP treinado como um projeto de rede.

### 参数核算

Para o esconderijo`h`、词表为 `V`É um modelo.

- Módulo principal: Milhares de milhões de parâmetros, mais um grande por`V * h`de saída.
- Cabeça de saída compartilhada: cabeça do modelo principal de reposição.
- Embedagem compartilhada: duplo uso principal modelo de embedamento.
- Cada módulo MTP:
  - Projecção `M_k`- Não .`(2h) * h = 2h^2`- Não.
  - Bloco de transformador `T_k`Atenção:`4h^2`)加 MLP(SwiGLU 且比为8/3 时通常为`8h^2`(■) Cada bloco`12h^2`- Não.

Parâmetros extras totais de cada módulo:`~14h^2`◊ Para DeepSeek-V3 `h = 7168`,D = 1 módulo: papel sobre `~14 * 7168^2 = ~720M`参数──DeepSeek-V3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

### Descódigo especulativo 回报

Durante o treinamento prévio, os módulos MTP farão o treinamento diminuir em cerca de 10% (mais computação avançada, perdas extra)

1. Cada estado oculto vê D+1 个监督目标── em MMLU、GSM8K、MATH、HumanEval                                                                                                                                                                                                                                                

2. 推理时免费的投机解码草案──MTP módulo 已被训练预测下列几个代币──重新使用网络草案──它能达到80%+的接受率──在这个水平下,N=3或N=5的规格解码可带来1.8×吞吐量──10%的训练成本将在第一次运行推理时就开始回本──

### Relação com AEGLE

A EAGLE, após o treinamento prévio, treina sozinha um modelo de projeto pequeno.

| Dimension | EAGLE-3 | MTP (DeepSeek-V3) |
|-----------|---------|------------------|
| When trained | 预训练之后 | 预训练期间 |
| Backward-compatible with existing weights | 是 | 否（需要重新训练） |
| Draft params | 1-2 个 transformer layers | 1 个 transformer block + projection |
| Acceptance rate | 0.88-0.92 | depth 1 时 0.80+ |
| Benefit beyond speedup | 仅 speculative decoding | 更密集的训练信号 + 加速 |


```figure
multi-token-predict
```

## Construí-lo

`code/main.py`端到端构建一个MTP模块:shared embedding、projection、transformer block、shared output head──然后它会在一段简短的合成序列上计算每深度交叉输入损失,并按组件印参数──32 个代币的玩具词汇 让数字更易读──

### 步骤 1: tabela de inserção compartilhada

Um .`vocab_size x hidden`A tabela é utilizada como modelo principal e como módulo MTP em cada profundidade. Não é uma segunda dupla, mas sim um mesmo tensor.

### 步骤 2: combinação por profundidade

```python
def combine(prev_hidden, next_token_embed, M_k):
    # concat along feature dim, then project down to hidden
    concat = rms_norm(prev_hidden) + rms_norm(next_token_embed)  # vector addition stand-in
    projected = matvec(M_k, concat)
    return projected
```

A verdadeira DeepSeek-V3 vai passar por dois vectores de RMSNorm .`[2h]`Não usei um .`h x 2h`Matrix 投影── Este brinquedo 为了 stdlib 简洁, usando Vector加法来代替──

### 步骤 3:profundidade k de bloco transformador

Auto-atenção加 MLP──在玩具中,一个单层线性注意区 和一个SwiGLU MLP 让结构可见,同时避免使用numpy──

### 步骤 4: cabeçalho de saída compartilhado

复用主模型的输出覆盖词汇的 logits──

### 步骤 5: perda por profundidade

Softmax (logits)`k`处 fundamental-verdade Token 的交叉化──使用 `lambda / D`缩放因子跨深度 聚合──

### 步骤 6: Parâmetros de cálculo

打印总参数、shared(embedding、head) 参数, bem como por módulo 额外参数── mostrar MTP 额外参数与主模型大小的比例──

## Use-o

MTP  já está integrado na série DeepSeek-V3 (em 2024)

- Profundos Procurar sua própria pilha de serviço 可开箱即用地将 MTP módulos 作为投机解码器 使用。
- 截至2026年 4月,vLLM 和 SGLang 已有DeepSeek-V3 MTP 的集成路径──
- O programa de aprendizado ROCm SGLang da AMD mostrou uma configuração especulativa de MTP específica, e no checkpoint V3 eletou 1,8× acelerar.

Em novos treinamentos, a utilização de MTP é:

- Você controla o pipeline completo de treinamento prévio, e deseja obter um sinal de treinamento mais intenso.
- Você sabe que vai ser um serviço de grande escala para este modelo, e deseja obter descodificação especulativa grátis.
- O seu tamanho oculto é de pelo menos 4096... em 1B, os danos causados pela expansão geralmente são maiores do que os lucros.

Não adequado para uso:

- Para o modelo de treinamento previo denso existente fazer ajuste fino;. módulo MTP  ainda não treinado。
- Para o estudo, você deseja ter uma linha de base de qualidade para fazer comparações.

## Entrega-o

本课会生成 `outputs/skill-mtp-planner.md` Dado um pre-training de execução de regras (model size DATA 計算), ele retornará a um integrated MTP de um esquema:`lambda`O programa, a memória e a transferência de dados, bem como o sistema de descodificação especulativa do tempo de execução.

## 练习

1. 运行 `code/main.py` mostrar com sinal sintético 增强, per-depth loss 单调下降── modificação sintética, fazendo com que o uso de modo fixo,并验证 depth-1 和 depth-2 loss 都会收──

2. 計算一個密集70B 模型 ((hidden 8192,80 層) 內 D=1 MTP módulo 下的参数开销──與 DeepSeek-V3 報告的 14B 开销进行比较──解释为什么 DeepSeek 的数字更高:MTP transformador block 继承了相同的MoE 结构,从而增加了每模块 参数──

3. Em jogo implementar D=2: Adicionar um segundo módulo MTP, receber h^(1) 并预测 `t_{i+2}` Verificação de perda conjunta 和参数核算与DeepSeek paper's equations 19-21 匹配──

4. 将玩具 切换为平行MTP(Gloeckle-style): em estado oculto principal 之上添加D 个输出头,每个预测不同抵消――测量在同一个合成信号上,每个深度的损失与序列版本相比如何――对于 k > 1,sequential 版本应产生更低的深度-k损失,因为它在中间预测为条件――

5. O módulo de MTP deve ser treinado e utilizado como um projeto de estilo EAGLE.`t_{i+k}` Em sequência de manuseio, medir estes projetos de Token em relação ao modelo principal.

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| MTP module | “额外 loss block” | 一个小型 transformer block 加 projection，用来预测主模型前方 `k` 个位置的 Token |
| Prediction depth | “哪个 offset” | 整数 `k`，使得 module `k` 基于截至位置 `i` 的 prefix 预测 `t_{i+k}` |
| Parallel MTP | “Gloeckle-style” | 位于同一个 backbone hidden state 之上的 D 个独立 heads，没有条件链 |
| Sequential MTP | “DeepSeek-V3 style” | 每个 module 都以先前 depth 的 hidden state 加下一个 Token 的 embedding 为条件；保留 causal chain |
| Shared output head | “复用主 head” | MTP modules 调用主模型的 LM head，而不是单独的 output projection |
| Shared embedding | “复用主 table” | 同一个 vocabulary embedding table 在所有地方使用；没有重复参数 |
| Projection matrix M_k | “结合 hidden + next-token” | 一个 `h x 2h` linear layer，将前一个 hidden state 和 target-token embedding 折叠为下一深度的输入 |
| Joint loss L_MTP | “平均额外 losses” | per-depth cross-entropy losses 的算术平均值，并按 `lambda` 缩放 |
| Acceptance rate at depth 1 | “MTP draft 多常正确” | D=1 MTP module 的 top-1 prediction 等于主模型 top-1 prediction 的比例；DeepSeek-V3 上超过 80% |
| Lambda weighting | “额外 loss 的重要性” | per-depth 缩放因子；DeepSeek-V3 在训练开始时为 0.3，之后为 0.1 |

## 延伸阅读

- [DeepSeek-AI — DeepSeek-V3 Technical Report (arXiv:2412.19437)](https://arxiv.org/abs/2412.19437) 完整的顺序MTP 描述(Section 2.2), incluindo equações de perda conjunta 和推理时的1.8× 加速
- [Gloeckle et al. — Better & Faster Large Language Models via Multi-token Prediction (arXiv:2404.19737)](https://arxiv.org/abs/2404.19737) DeepSeek 设计所改进的平行MTP基线
- [DeepSeek-V3 model card on Hugging Face](https://huggingface.co/deepseek-ai/DeepSeek-V3) 685B 总量(671B principal + 14B MTP),部署说明
- [Leviathan et al. — Fast Inference from Transformers via Speculative Decoding (arXiv:2211.17192)](https://arxiv.org/abs/2211.17192) MTP 所适配的 especulativo-decodificação  framework
- [Li et al. — EAGLE-3 (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) Projetos de arquitetura 2025 da EAGLE, também MTP 竞争对应方案
