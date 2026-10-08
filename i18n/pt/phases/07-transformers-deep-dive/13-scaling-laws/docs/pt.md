# Leis de Escalada

> 2020 年 Kaplan 论文说:模型越大,Loss 越低──2022 年 Hoffmann 论文说:你们训练不足──Computer 会进入两个桶:参数和Token,而两者的分配不显而易见──

**Type:** Learn
**Languages:** Python
**先修要求:**Fase 7 · 05 (Transformador completo), Fase 7 · 07 (GPT)
**Time:** ~45 分钟

## 问题

Quando você tem o treinamento de C FLOPs computação, e quer obter o melhor modelo, você enfrenta duas rotas:

1. **多少参数 (N)？**模型越大, capacidade越高──
2. **多少训练 Token (D)？**O número de dados aumenta, a capacidade de utilização aumenta.

FLOPs 近似按 `6 × N × D`缩放―― você pode aumentar N、 reduzir D, também pode aumentar D、 reduzir N― que tipo de melhor?

Antes de 2022, a resposta é que o máximo possível seja promovido em N── GPT-3 (2020) é de 175B 参数, em cerca de 300B Token 上训── proporção de cerca de 1,7 个 Token por参数── Kaplan Scaling Laws 支持这一点──

Hoffmann et al. (2022)  treinar um grupo chamado Chinchilla's小型模型家族, descobriu diferentes conclusões:**每个参数 20 个 Token** GPT-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

2026 é o mundo de Chinchilla, mas há uma importante reviravolta. Llama 3 8B em 15 milhões de tokens, a proporção é de 1,875 tokens por parâmetro.

## 概念

![Chinchilla 曲线：不同 N/D 比例下的 Loss vs compute](../assets/scaling-laws.svg)

### Lei Hoffmann

De Chinchilla, Loss segue:

```
L(N, D) = A / N^α + B / D^β + E
```

- `N`= 参数(非 Embedding)
- `D`= Token de treinamento
- `α ≈ 0.34`- Não .`β ≈ 0.28`(大致对称)
- `E ≈ 1.69`Não há perda.
- `A ≈ 406`- Não .`B ≈ 411`- Não.

Com a expansão, dois conjuntos se pesam entre si.`N`求导并求解:

```
N_opt ≈ 0.6 × (C/6)^0.5
D_opt ≈ 0.6 × (C/6)^0.5
D_opt / N_opt ≈ 20
```

Computação-ótima: cada parametro 20 Tokens

### Porque é que ainda tens que treinar demais?

O melhor é o mínimo de FLOP por treino, mas o custo de treino só paga uma vez; o custo de cálculo vai continuar a ser pago.

Para o serviço mensal de um milhão de milhões de tokens, o método de Llama é: modelo menor, treinamento mais longo.

- Pode ser colocado em GPU de nível de consumo.
- 延迟只是70B Chinchilla-óptima de 延迟只是70B Chinchilla-óptima de 延迟只是70B Chinchilla-óptima de 延迟只是70B Chinchilla-óptima de 延迟只是70B Chinchilla-óptima de 延迟只是70B Chinchilla-óptima de 延迟只是70B Chinchilla-óptima de 延迟只是70B Chinchilla-óptima de 延迟只是70B Chinchilla-óptima de 延迟只是70B Chinchilla-óptima de 延迟只是70B Chinchilla-óptima de 延迟
- Para a maioria das tarefas, a qualidade é suficientemente próxima.

DeepMind 2024 年论文("Over-training is the new optimal") vai formalizar este ponto.

### 涌现 vs 平滑性

Há também um grupo de pessoas que, em um momento de crise, estão a tentar fazer uma mudança de mentalidade.

Schaeffer et al. (2023) 认为这是测量伪影:涌现指标使用不连续评分(exact match、值精度),会隐藏底层logits的平滑改进──连续指标──cross-entropy) mostram que é uma curva plana──

Até 2026, o consensus é: através de perdas continuas  fazer previsões é confiável.

### 2026 ano

As leis de escalagem ainda são válidas, mas:

| 因素 | 如何变化 |
|--------|-------------|
| 数据质量 | 筛选“好”Token（Phi-style）可使曲线移动，相当于 >2× effective compute |
| MoE | 总参数与 active FLOPs 解耦；Scaling Laws 按 per-active-FLOP 计算 |
| 后训练 | 某些能力（指令遵循、代码）受 SFT+RLHF 的影响比 pretraining 更大 |
| Multimodal | 图像 + 文本 Token 一起缩放；每种模态有单独曲线 |
| 合成数据 | 模型生成训练数据；effective compute 可以复合增长 |

Muon Optimizer (Kimi Moonlight, 2024) mostra, em conformidade com a quantidade de dados, que em comparação com AdamW há cerca de 2× de computação eficaz  aumento.


```figure
scaling-laws
```

## Construí-lo

- Não .`code/main.py` Nós realizamos o Chinchilla Loss Equation, e em vários cálculos  orçamento abaixo procura resolver o cálculo-ótimo `(N, D)`- Não.

### 步骤 1: Perda de chinchilla

```python
def chinchilla_loss(N, D, A=406.4, B=410.7, alpha=0.34, beta=0.28, E=1.69):
    return A / N ** alpha + B / D ** beta + E
```

Em fixação`C = 6ND`Baixo, vai`L`绘制为 `(N, D)`A linha superior é a linha superior.

### 步骤 2: 计算最优边界

 para `1e17`Até`1e25`FLOPs de computação  orçamento, encontrar em约束 `6ND = C`下 Minimizar perdas de `(N, D)` Processo de verificação`D/N ≈ 20`- Não.

### 步骤 3: custos de formação excessiva

計算訓練一個小 10× 的模型(最优 N 的 1/10,最优 D 的 10×) 所支付额外损失──報告换来的推理 FLOP 节省(与 N 成正比)──

### 步骤 4: Comparar com o modelo real

填入 GPT-3、Chinchilla、Llama 3 8B、DeepSeek-V3(params activos) 已知 `(N, D)`Para,并比较预测 Loss 与报告 Loss──

## Use-o

Não é muito possível treinar a fronteira, mas as leis de escalação podem dizer-te:

1. **你的 fine-tune 是否有足够数据。**Se a tarefa específica for inferior ao modelo base, cada parâmetro terá 20 tokens, o esperado será em um determinado piso de perda.
2. **是否选择更大的 base model。**Se todo o seu orçamento for gasto em pensar, priorizar a escolha de modelos menores, treinamento mais longo.
3. **收益在哪里递减。**Mais de 1000 vezes o Chinchilla-óptimo, depois, as alterações de log-loss se transformam em ruído.

**2026 年的研究轨迹：**

- **数据受限状态。**Web 上高质量 Token 数量有限 ([[过后约5-1000000000 English) ]]──Pré-entrenamento de fronteira está chegando a esse limite.
- **Compute-multiplier 技巧。**Muon Optimizer, MoE, melhor dados selection, cada um deles vai mover-se a um número constante absoluto, em vez de uma linha de aproximação.
- **RL 的 Scaling Laws。**开放问题── Evidências iniciais indicam que existem leis de poder em amostras de RL, mas os índices são muito diferentes da pré-treinamento──

## Entrega-o

- Não .`outputs/skill-training-budget-estimator.md` Esta habilidade será utilizada em uma determinada computação  orçamento  implementação  restrições e objetivos `(N, D, hours, GPU)`- Não.

## 练习

1. **Easy.**运行 `code/main.py`△ impressão computacional  orçamento `1e20`- Não.`1e22`- Não.`1e24`Baixo Chinchilla-óptimo `(N, D)` Comparar com modelos reais
2. **Medium.**实现 Hoffmann Loss-as-function-of-computação 曲线──为 computação-ótimais fronteira 绘制 Loss vs `log10(C)`Identificar esta lei                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `>10^28`FLOPs 才能让交叉热再降低 0.1──
3. **Hard.**Em um mesmo conjunto de dados, treine 5 modelos menores (parâmetros de 100K a 10M), para se adequar à sua própria Lei de Escalação.`α`和 `E`Como se encaixa o seu índice com os resultados publicados?

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| Parameters (N) | “模型大小” | 非 Embedding 权重数量；决定容量。 |
| Tokens (D) | “训练数据” | 见过的训练 Token 数；决定参数被利用得有多充分。 |
| Compute (C) | “花费的 FLOPs” | 对标准 Transformer 来说，约为 `6 × N × D`。 |
| Chinchilla-optimal | “D/N ≈ 20” | 最小化 pretraining 每 FLOP Loss 的比例。 |
| Over-training | “超过 Chinchilla” | 花费额外训练 FLOPs 来节省推理 FLOPs；D/N >> 20。 |
| Irreducible loss | “底部” | Scaling Law 中的 `E` 项；数据本身的熵。 |
| Emergent capability | “规模上的突然跳变” | 通常是评分器伪影；连续 Loss 是平滑的。 |
| Effective compute | “训练效率倍增器” | 更好的数据 / Optimizer / 架构会倍增每个 FLOP 的作用距离。 |

## 延伸阅读

- [Kaplan et al. (2020). Scaling Laws for Neural Language Models](https://arxiv.org/abs/2001.08361) 第一篇 Lei da Escalação 论文; training insuficient──
- [Hoffmann et al. (2022). Training Compute-Optimal Large Language Models](https://arxiv.org/abs/2203.15556)Chinchilla.
- [Schaeffer et al. (2023). Are Emergent Abilities of Large Language Models a Mirage?](https://arxiv.org/abs/2304.15004) 涌现作为测量伪影──
- [Sardana, Frankle (2024). Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws](https://arxiv.org/abs/2401.00448) Por que o treinamento excessivo de Llama  Adapte-se ao seu trabalho.
- [Jordan et al. (2024). Muon: An optimizer for hidden layers in neural networks](https://kellerjordan.github.io/posts/muon/) 2x multiplicador de cálculo。
