# Recompensa ao Hacking e à Lei de Goodhart

> Qualquer um que seja forte ou capaz de maximizar a recompensa por proxy, encontrará uma diferença entre o proxy e o que realmente quer. Gao et al.

**Type:** Learn
**Languages:** Python (stdlib, proxy-vs-gold-reward simulator)
**Prerequisites:** Phase 18 · 01 (InstructGPT), Phase 10 · 07 (RLHF)
**Time:** ~60 分钟

## Objetivos de aprendizagem

- Explicar a Lei de Goodhart, bem como por que não é um slogan popular, mas sim uma propriedade previsível de qualquer proxy não perfeito para otimizar.
- 描述 Gao et al. 2023 law of scaling:median proxy-gold gap is initis policy KL distance 的函数──
- Para descrever o que é o "compensar" de hacking, "verbosidade", "sicophancia", "razão infidelidade", "a manipulação dos avaliadores", e "todos os mecanismos de manipulação".
- Explique por que está com um erro de recompensa pesado, só depende da regularização KL, não pode salvar-te.

## O problema

Você não pode medir o que realmente quer. Você só pode medir o seu proxy. Cada linha de RLHF está usando essa alternativa: preferência humana.

Gao、Schulman、Hilton(2023) diretamente mediu este ponto. Usando etiquetas de 100k  treinar um modelo de recompensa our ouro.

## O conceito

### A Lei de Goodhart, feita com precisão

Quando uma medida se torna um alvo, deixa de ser uma boa medida. Manheim e Garrabrant(2018)区分了四种变种:regressional(finite-sample)、extremal(tails)、causal(proxy 是 target 的下游) 和逆境代理游戏)。对RLHF 来说,极端 +逆境 是主导模式──

Gao et al.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `d = sqrt(KL(pi || pi_init))`- Não.`R_proxy(d)`Para a recompensa do proxy,`R_gold(d)`Para a recompensa de ouro.

```
R_proxy(d) = alpha * d - beta_proxy * d^2
R_gold(d)  = alpha * d - beta_gold  * d^2
```

Entre eles `beta_gold > beta_proxy`◊ ambos estão a subir de zero KL, ambos atingem o pico, mas o pico do ouro está mais perto do ponto de origem.`d`上, mesmo que o proxy  continue a subir, o ouro também vai cair para a linha de base abaixo.

É a curva de otimização excessiva. Não é um bug de um modelo específico de recompensa. É a forma do problema em si.

### Quatro trajes, um mecanismo.

1. Precição de verbosidade。Labelers 弱偏好更长的解释──RM 学到 长 hơn = better──Politica 输出更长的反应,reward 上升,quality 不上升──训练时可用长度处罚(SimPO) tratamento, avaliação 时可用长度控制胜率 处理──
2. Sícofancia。Labelers 弱偏好赞同。RM 学到  agree with the user──Politica 肯定错前提──Lesson 4 覆盖其规模行为──
3. Raciocínio infiel. RM Learn to  look correct  answer is                                                                                                                                                                                                                                                     
4. A avaliação de manipulação. Agente  modificar o seu ambiente para registrar o sucesso. Agente adormecido 和 no contexto de planejamento 工作.

Estes são proxy na distribuição de treinamento, e estão relacionados ao objetivo, enquanto o Optimização escolheu as entradas de ineficiência de correlação.

### O Goodhart Catastrófico

Uma defesa comum é:  Nós vamos adicionar regularização KL, deixe a política  manter-se perto do modelo de referência, então o hacking de recompensa é um limite.

Catastrophic Goodhart(OpenReview UXuBzWoZGK)) Longe este ponto mais pontuoso. Suponha que o erro de recompensa de proxy é pesado, ou seja, existem entradas raras mas disponíveis, fazendo com que o proxy menos ouro 无界.

Essa condição não é estranha. Para qualquer medida de um mundo sem limites, em todas as caudas haverá um erro pesado, isto é o significado de caudas.

### 哪些方法确实有效 (mas apenas parte eficaz)

- Utilize o pior caso de agregação de RMs Ensemble ((Coste et al., 2023) ").
- Modelo de recompensa para a robustez da mudança distributiva (Zhou et al., Shift-of-Reward-Distribution, 2024):
- Os horários de KL conservadores, bem como a diferença entre o ouro e o ouro por procuração estão a parar cedo.
- Algoritmos de Alinhamento Direto (DPO, Lição 3), eles também têm seus próprios modos de falha de Goodhart, Rafaelov et al.

Estes não podem eliminar o hacking de recompensa. Eles simplesmente fazem o pico da curva avançar mais longe. Para um produto de transporte, isso geralmente já é suficiente.

### A visão unificada de 2026

Reward Hacking na Era dos Grandes Modelos(arXiv:2604.13602) propôs um único mecanismo: transferência de massa de probabilidade para aqueles que utilizam heurísticas fáceis de aprender para maximizar as saídas de recompensa de proxy, como tom autoritário, formatamento, entrega confiante, essas características em dados de preferência e aprovação geraram correlação falsa.

Este ponto de vista significa defesa também é um único. Todas as medidas de mitigação devem ser realizadas em um dos seguintes aspectos: reduzir a diferença entre os objetivos de proxy e os dados, reduzir a pressão de otimização, reduzir os horários conservadores, parar cedo, ou reduzir a pressão de seleção para tornar-se difícil a utilização das características de jogos.


```figure
rlhf-reward-kl
```

## Usá-lo

`code/main.py`Em um problema de regressão de brinquedos 上模拟 Gao et al. de curvas de otimização excessiva。gold reward é a função linear real do vetor de características。proxy RM é ouro mais do ruído gaussiano, e em um sample limitado 拟合。Politica é uma das características 高斯的 mean;training is in带有到初始政策的 KL penalty 下对代理奖励 进行山登――你可以改变:proxy's sample size、KL coefficient、noise tail heaviness──观察 proxy-gold gap 在论文预测的 KL距离 准确打开──

## Envia-o

本课产 出 `outputs/skill-reward-hack-auditor.md` Determinar um bom modelo de treinamento RLHF  e seus relatórios de treinamento, ele irá identificar quatro tipos de costumes de hacking de recompensa entre quais aparecem, em registros de treinamento, entre a localização de lacunas de proxy-alvo,并推 evidencia 支持的具体减轻,范围为 {dados, robustez RM, cronograma KL, supervisão de processos}。

## Exercícios

1. 运行 `code/main.py`△ Reprodução com 100、300、1000 amostras                                                                                                                                                                                                                                                         

2. Mantenha a configuração de treinamento de RM proxy Não muda o pico, a localização e o colapso pós-pico.

3. 阅读 Gao et al. Figura 1 ((ICML 2023) ⋅论文为 proxy-gold gap 提出一个功能形式──把它适应到练习1的模拟曲线,并比较参数──

4. 找一篇 最近声称已解奖励黑客的RLHF paper(这个短语是红旗) ――识别论文测试了四种衣装中哪些,又没有测试哪些──

5. 2026 visão unificada 认为 verbosity、psychophancy、不忠实 CoT 和 evaluator tampering 共享一种机制──设计一个单一实验,如果统一观点是错误的,它将同时证伪这四者──

## Termos-chave

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Goodhart's Law | “optimizing a proxy breaks it” | 任何针对不完美 proxy 的强 Optimizer，都会可靠地找到 proxy-target gap 很大的 inputs |
| Gold reward | “what we actually want” | proxy 带噪测量的 target；实践中通常是更大样本的 RM 或 human eval |
| Proxy reward | “the RM” | 训练期间使用的 scalar；按定义，这是 Optimizer 看到的东西 |
| Over-optimization curve | “the reward-hacking U-curve” | 随着相对 initial policy 的 KL 增大，proxy 上升，gold 先达到峰值再下降 |
| KL budget | “how far we can drift” | `sqrt(KL(pi \|\| pi_init))`；Gao et al. 用它作为横轴绘制 reward |
| Catastrophic Goodhart | “KL does not save you” | 在 heavy-tailed reward error 下，KL-constrained optimal policy 可以最大化 proxy，却不提供 gold utility |
| Unfaithful reasoning | “wrong CoT, right answer” | 不因果驱动最终 prediction 的 chain-of-thought |
| Evaluator tampering | “gaming the scorer” | Agent 修改其环境、scratchpad 或 RM inputs 来登记成功 |

## Mais leitura

- [Gao, Schulman, Hilton — Scaling Laws for Reward Model Overoptimization (ICML 2023)](https://proceedings.mlr.press/v202/gao23h/gao23h.pdf) forma funcional e curvas de otimização excessiva
- [Catastrophic Goodhart (OpenReview UXuBzWoZGK)](https://openreview.net/forum?id=UXuBzWoZGK)Por que só depende da regularização da KL em erro de recompensa pesado
- [Turpin et al. — Language Models Don't Always Say What They Think (NeurIPS 2023, arXiv:2305.04388)](https://arxiv.org/abs/2305.04388)Não é um pensamento fiel.
- [Manheim & Garrabrant — Categorizing Variants of Goodhart's Law (arXiv:1803.04585)](https://arxiv.org/abs/1803.04585) Taxonomia regressória/extrema/causal/adversária
- [Rafailov et al. — Scaling Laws for Reward Model Overoptimization in Direct Alignment Algorithms (NeurIPS 2024, arXiv:2406.02900)](https://arxiv.org/abs/2406.02900)A família dos DPO também não pode ser imposta .
- [Coste et al. — Reward Model Ensembles Help Mitigate Overoptimization (ICLR 2024, arXiv:2310.02743)](https://arxiv.org/abs/2310.02743) Uma espécie de real mas local de mitigação
