# Seguimento de instruções  como sinal de alinhamento

> Depois de cada crítica ao RLHF estão contra esta linha de negócios. Antes de estudar a pressão de otimização sobre como torcer um proxy, você deve primeiro ver esse proxy. InstructionGPT(Ouyang et al., 2022) definiu a arquitetura de referência: fazer o ajuste supervisionado em pares de instrução-resposta; fazer o ajuste supervisionado em pares de classificações de preferência; então usar o modelo de recompensa de PPO com penalidade KL para o modelo de recompensa  optimização,并约束到 SFT política.

**Type:** Learn
**Languages:** Python (stdlib, toy three-stage pipeline)
**Prerequisites:** Phase 10 · 06 (SFT), Phase 10 · 07 (RLHF), Phase 10 · 08 (DPO)
**Time:** ~45 分钟

## Objetivos de aprendizagem

- Explicar as três fases do gasoduto InstructGPT, bem como a perda de utilização de cada fase.
- Explicação de porquê 1.3B modelo ajustado por instruções na avaliação de preferências humanas
- Explicação da penalidade KL na fase 3 em prevenir o que, e por que a remoção vai se reduzir ao comportamento de busca de modo.
-  descrever o imposto de alinhamento, bem como Ouyang et al. Utilizando-se para aliviar o seu PPO-ptx

## O problema

Modelos de linguagem pré-treinados 会补全文本──它们不会回答问题──问 GPT-3 写一个Python函数,反转一列表,你经常会得到另一个提示,因为大多数训练分布是将继续接接更多的网文.

Cada laboratório rigoroso utiliza para corrigir este problema como proxy é a preferência humana. Dois conclusões são entregues ao avaliador; o avaliador seleciona um melhor; o modelo de recompensa é aprendido neste avaliador.

## O conceito

### Fase 1: ajuste fino supervisionado (SFT)

收集 prompt-response pairs, em que a resposta é o que um bom intencionado escreveu.

SFT  dá-te algo: o modelo agora responderá ao problema, em vez de continuar a completar o problema. Não te dá nada: quando mais respostas são plausíveis, o Rater prefere o sinal de qual resposta.

### Fase 2: Modelo de recompensa (RM)

Para cada prompt, a partir do modelo SFT 采样 K 个完成──Labeler para os seus排序──训练一个奖励模型,为任意快速响应对 打分,使对于 `y_w`Fui bem-sucedido.`y_l`Dos pares:

```
L_RM = -log sigmoid(r(x, y_w) - r(x, y_l))
```

É a perda de preferência em pares Bradley-Terry. RM geralmente é iniciado no modelo SFT, substituindo a cabeça LM por cabeça escalar.

Modelos de recompensa 很小:6B 足足够服务 175B InstructGPT──它们也很脆弱,论文第 5 节主要讨论在小规模出现的奖励黑客行为──

### Fase 3: PPO com penalidade KL

definição de objectivo:

```
J(pi) = E_{x~D, y~pi(.|x)} [ r(x, y) ] - beta * KL(pi(.|x) || pi_SFT(.|x))
```

Utilize PPO maximization.`pi`Não se desvia da política de SFT 太远. 没有它,Optimizer encontrará exemplos adversários, é, em RM, baixos resultados de cordas muito altas, porque não é o homem realmente os preferiu, mas RM nunca os viu.

coeficiente KL `beta`É o RLHF mais importante hiperparâmetro. Muito baixo: recompensas hacking.

### Imposto de alinhamento

Depois do RLHF, o modelo é mais preferido pelos humanos, mas em padrões de referência ((SQuAD、HellaSwag、DROP) 上退步。Ouyang et al. irá chamá-lo de imposto de alinhamento, não usando PPO-ptx 修复:

```
J_ptx(pi) = J(pi) + gamma * E_{x~D_pretrain} [ log pi(x) ]
```

PPO-ptx                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

### O resultado

Uma instrução de 1,3B GPT ((SFT + RM + PPO-ptx) foi preferentemente superada por 175B base GPT-3, proporção de cerca de 70%― em pedidos de teste oculto do tráfego de produção.

1. A alinhamento é com capacidade Diferente de eixo. Modelo 175B tem capacidade mais forte; modelo 1.3B tem mais alinhamento; etiquetas mais preferentemente alinhadas.
2. O nível de capacidade é determinado pelo modelo base. Não pode passar pelo RLHF.

### Por que é que é a Fase 18 de referência

Cada crítica no curso: recompensas hacking (Leção 2)、DPO(Leção 3)、sicophancy(Leção 4)、CAI(Leção 5)、sleeper agents(Leção 7)、alignment faking(Leção 9), estão em algum parte da contra a esta linha de negócios.


```figure
al-instruct-pipeline
```

## Usá-lo

`code/main.py`Em dados de preferência de brinquedo 上模拟三个阶段。Base policy é uma moeda tendenciosa em ações {A, B, C} 上面的一个偏见币。Stage 1 SFT 在 200 个提示 上模拟标签器行动。Stage 2 从 500 个对等排名 适合布拉德利-特里奖励模型。Stage 3 运行简化PPO update,并带有到SFT 政策的奖励 KL penalty──你可以观察上升KL divergence 变大、政策漂移,也可以关闭 KL 术语,看黑客在 50 个奖励更新步骤内出现──

Observar o conteúdo:

- `beta = 0.1`Com`beta = 0.0`A trajetória da recompensa...
- Passo de treinamento 中的 KL pi pi SFT)
- Distribuição de ação final em comparação com a preferência do etiquetador.

## Envia-o

本课产 出 `outputs/skill-instructgpt-explainer.md` Determinar uma descrição do gasoduto RLHF ou um resumo de papel, que irá identificar qual das três fases foi modificada  que perda cada fase utilizou, bem como se existe uma penalidade KL ou um regulador equivalente 

## Exercícios

1. 运行 `code/main.py`- Configuração.`beta = 0.0`, relatar 200 passos de PPO 后的行动分布──用一段话解释模式寻找行为──

2. Modificar o modelo de recompensa, fazer a ação B tem +0,5 bias(模拟奖励 bug) ・・・用 `beta = 0.1`O que é que é o "POP"?`beta`A exploração começou a aparecer.

3. 阅读 Ouyang et al.(arXiv:2203.02155) Figura 1― através de execução PPO 1、5、20、100 passos,并测量相对 SFT modelo de preferência,复现标签者-preferência curva―

4. 论文 Seção 4.3  relatório 1.3B InstrutorGPT  derrotar 175B GPT-3 proporção de cerca de 70%── Por que essa proporção em produtos ocultos de produção

5. Em dados de preferência, em cima, substitui a perda de PPO para DPO ((Fase 10 · 08)。 Compare a derivação final da política(para KL do SFT) e a recompensa final。 Em recompensa correspondente, qual é a diferença mais distante?

## Termos-chave

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| SFT | “instruction tuning” | Stage 1：在 prompt-response pairs 上用 cross-entropy fine-tune |
| Reward model | “the RM” | 在 (prompt, response) 上的 scalar regressor，使用 Bradley-Terry 在 pairwise labels 上训练 |
| Bradley-Terry | “pairwise preference loss” | -log sigmoid(r_w - r_l)；把 pairwise ranking 约简为 binary classification |
| KL penalty | “the regularizer” | `beta * KL(pi \|\| pi_SFT)` — 让 RL policy 保持接近 SFT anchor |
| PPO-ptx | “PPO with pretraining mix” | 向 PPO objective 加入一部分 pre-training log-likelihood，用来抵消 alignment tax |
| Alignment tax | “the RLHF regression” | RLHF 之后，在 RLHF 未针对的标准 benchmarks 上下降 |
| Labeler preference | “the ground truth” | human rankings 的样本；RM 是它的 statistical proxy，而不是 “human values” 的 proxy |

## Mais leitura

- [Ouyang et al. — Training language models to follow instructions with human feedback (arXiv:2203.02155)](https://arxiv.org/abs/2203.02155) Instruir papel GPT, também depois de cada linha de oleoduto RLHF
- [Stiennon et al. — Learning to summarize from human feedback (arXiv:2009.01325)](https://arxiv.org/abs/2009.01325) RLHF-for-summary                                                                                                                                                                                                                                                         
- [Christiano et al. — Deep reinforcement learning from human preferences (arXiv:1706.03741)](https://arxiv.org/abs/1706.03741) Originação da formulação RL baseada em preferências
- [Bai et al. — Training a Helpful and Harmless Assistant with RLHF (arXiv:2204.05862)](https://arxiv.org/abs/2204.05862) Extensão HH da linha de gasodutos de GPT à Antropic
