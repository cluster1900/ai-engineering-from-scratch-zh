# MARL  MADDPG, QMIX, MAPPO

> Multidistribuição de aprendizagem de reforço                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  **MADDPG**(Lowe et al., NeurIPS 2017, arXiv:1706.02275)  introduziu o Treinamento Centralizado, Execução Descentralizada (CTDE): durante o treinamento, cada crítico pode ver o estado e a atividade de todos os agentes; testar apenas para operar em seu próprio ator.**QMIX**(Rashid et al., ICML 2018, arXiv:1803.11485) é a decomposição de valor da rede de mistura monótona; cada agente de Q 会组合成 joint Q, portanto `argmax`Pode ser distribuído de forma mais eficaz entre os agentes  no StarCraft Multi-Agent Challenge (SMAC).**MAPPO**(Yu et al., NeurIPS 2022, arXiv:2103.01955) é com PPO de função de valor centralizada; em mundo de partículas、SMAC、Google Research Football、Hanabi 上, apenas é necessário极少调参就surprisingly effective──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────**2026 年 cooperative-MARL 的默认 baseline** Esta aula irá começar a partir de um pequeno brinquedo de rede-mundo  construindo cada método, antes de entrar em contato com a formação de agente LLM , primeiro, treinar estas três ideias em memória muscular 

**类型：**- aprendizagem
**语言：**Python (stdlib,小型无 NumPy 实现)
**先修：**Fase 09 (aprendizagem de reforço), Fase 16 · 09 (Redes de enxames paralelas)
**时间：**- 90 minutos.

## 问题

A política de coordenação entre agentes de LLM  sistemas越来越地训练interagent coordination:何时推迟何时行动调用哪个同行―― diz-te como treinar este tipo de política é a aprendizagem de reforço de vários agentes (MARL), foi muito antes da onda de LLM, e já existe um pequeno grupo de algoritmos principais―

Se não há vocabulário padrão, leia MARL 论文会很痛苦──Formação centralizada com execução descentralizada (CTDE) ‧descomposição de valores 和 críticos centralizados não são palavras de moda  它们是对具体问题具体答案:

- RL independente (cada agente 单独学习) do ponto de vista de cada agente
- RL centralizada (RL) não pode ser expandida e viola as restrições de execução.
- CTDE 兼得两者优点: Usando informação global 訓練, usando políticas locais 部署。

## 概念

### 论文使用的三类环境

- **Particle World (multi-agent particle env)。**简单 2D physics, contendo tarefa cooperativa/competitiva──MADDPG original testbed──
- **StarCraft Multi-Agent Challenge (SMAC)。**A cooperação em micro-gestão, observação parcial, testes de QMIX, acções discretas, estados contínuos,
- **Google Research Football, Hanabi, MPE。**Linha de base do MAPPO:

Diferentes env. Há diferentes ações/observações 类型──algoritmo 会据此选择──

### MADDPG (2017)  padrão CTDE

Cada agente .`i`Há um ator na cidade.`mu_i(o_i)`Cada agente tem um crítico .`Q_i(x, a_1, ..., a_n)`O ator, através do gradiente de política, segundo a avaliação do crítico,

```
actor update:    grad_theta_i J = E[grad_theta mu_i(o_i) * grad_a_i Q_i(x, a_1..n) at a_i=mu_i(o_i)]
critic update:   TD on Q_i(x, a_1..n) given next-state joint estimate
```

Por que usar CTDE: quando treinamos, nós sabemos a ação de todos; usamos esta informação para reduzir a variação de cada crítico.`o_i`,并调用 `mu_i(o_i)`- Não.

失败模式:critics 会随 N 个代理 增长 输入包含所有行动) ⋅ Se não houver aproximação, é muito difícil expandir para ~10 个以上的代理──

### QMIX (2018)  decomposição de valor

 Aplica-se apenas para cooperativa Global reward 之和:

```
Q_tot(tau, a) = f(Q_1(tau_1, a_1), ..., Q_n(tau_n, a_n)),   df/dQ_i >= 0
```

Monotonia 保证 `argmax_a Q_tot`Pode ser feito por cada agente.`argmax_{a_i} Q_i`Para calcular... é exactamente o que precisas.**decentralized execution property** Treinamento, mistura de rede de cada agente`Q_tot`- Não.

Por que QMIX em SMAC 上获胜:cooperative StarCraft micro-management 具有同质的代理人、本地 obs、全球奖励 与价值分解 完美契合──

失败模式:constraint monotonicity 限制较强; algumas tarefas de recompensa estrutura não é monótono decomposível (por exemplo, um agente para o sacrifício da equipe)  extender método (QTRAN、QPLEX)  libertar esta questão 

### MAPPO (2022)  被低估的默认选择

Multi-Agent PPO:带集中价值函数的PPO── cada agente tem sua própria política; todos os agentes 共享(或拥有 per-agent) (em inglês) podem ver o estado completo da função de valor── Yu et al. 2022

- MAPPO em mundo de partículas, SMAC, Google Research Football, Hanabi, MPE,
- Requerido ajustamento de hiperparâmetros 极少──
- 訓練稳定;跨种 可复现──

Antes deste artigo, a comunidade subestimou a MARL em política. Até 2026, o MAPPO é a base padrão da MARL cooperativa; qualquer novo método deve vencê-la.

### Por que o engenheiro de agente LLM  deve se preocupar

Três usos diretos:

1. **Router training。**Meta-agente  escolher qual sub-agente  processar tarefa。 é um que contém N 个分散型子代理 和一个集中式路由器的 MARL 问题──MAPPO 适合──
2. **Role emergence。**Na simulação de agente gerativo, o agente treinador  adotando um papel complementar, é, em essência, uma falsa forma de MARL  problema
3. **Multi-agent tool use。**Quando os agentes compartilham ferramentas e competem com o orçamento, através do CTDE, eles podem obter políticas locais implementáveis, e respeitar as restrições de recursos.

实践提醒: até 2026 anos, a maioria da produção de LLM-agente 系统是快速 它们的政策,而不是训练它们──MARL 适用于你具备以下条件时:

### CTDE  como padrão de design fora do RL 

Mesmo que não seja treinado, o CTDE também é um padrão de arquitetura útil:

- Na fase de design, suponha ter visibilidade completa da equipe.
- Na fase de execução, forçamos a execução descentralizada.`o_i`- Não.

Este padrão  obriga-lo a definir o mantenimento por estado de agente,并提前思考部分可观性── muitos sistemas de produção multi-agent 默默假设在各处都有共享状态 CTDE disciplina pode prevenir este ponto──

### não estacionalidade 问题

Quando vários agentes estão a aprender, cada um dos agentes tem um ambiente que inclui a política de outros agentes.

- MADDPG: crítico global vê todas as ações, portanto, sua estimativa de valor é estática.
- QMIX: decomposição de valor vai transferir a aprendizagem para o espaço conjunta-Q, onde a otimilidade tem um significado definido.
- MAPPO: função de valor centralizado, que irá inibir a variação das alterações de políticas de outros agentes.

Em LLM-agente  sistemas, não estacionariedade expressão  meu agente 上个月还正常,现在上游另一个代理 改了,我的就异常了──带 CTDE 的 MARL training 是原则性的修复方式;

### 本课不涵盖什么

訓練真实网络是Fase 09 的主题──本课构建脚本政策 版本,在没有梯次更新的情况下演示CTDE、值分解和集中值模式──目标是你使用完整的MARL库──(PyMARL、MARLlib、RLlib multi-agent) 之前,先内化这些模式──


```figure
sw-ctde
```

## Construí-lo

`code/main.py`Em um pequeno mundo cooperativo de dois agentes, realizámos três demonstrações:

- Ambiente: 2 agentes em 4x4 grid, uma grelha de recompensa.
- `IndependentAgents` Cada agente, colocar outro agente no ambiente.
- `MADDPGStyle` crítica centralizada 计算共同价值;actor policy 从中更新;; Melhoria escrita da política。
- `QMIXStyle` Utilize monotone mixer de valor decomposição。
- `MAPPOStyle` função de valor centralizada;política  base base base compartilhada 更新。

O mesmo episódio foi executado em quatro partes, e não foi relatado o passo-a-foco médio.

运行:

```
python3 code/main.py
```

预期输出:agentes independentes 平均需要 ~6 步; CTDE variante 会收到 ~3.5 步(4x4 grid 的最佳是 3) ・・・ Mesmo usando políticas scripted, padrão 差异也会显现──

## Use-o

`outputs/skill-marl-picker.md`É uma habilidade usada para determinar tarefas multi-agentes  escolher algoritmo MARL: cooperativo versus competitivo  homogêneo versus heterogêneo  tipo de espaço de ação  escala  sinal de recompensa 

## Entrega-o

MARL 很少见──当你确实使用它时:

- **从 MAPPO 开始。**O artigo de 2022 estabelecerá-lo como linha de base; primeiro, ele pode ser publicado durante semanas para perseguir métodos mais sofisticados.
- **记录每个 agent 的 observation 和 action stream。**Não há rastreamento de agentes, desfecho de MARL.
- **分离 training code 和 execution code。**O CTDE é uma disciplina; deixe o caminho da execução ver.`o_i`- Não.
- **Reward shaping 警告。**MARL para o design de recompensa 极其敏感──forming 中一个协调 bug,agent 就会学会利用它──运行对抗性测试──
- **对于 LLM agents**, priorizar as políticas de nível imediato― apenas quando os dados de interação + sinal de recompensa + infraestrutura estiverem disponíveis, é possível investir na formação MARL―

## 练习

1. 运行 `code/main.py`◊ Diferença de medidas independentes e de agentes de estilo MAPPO                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
2.  Realizar uma variante competitiva: dois agentes, uma pellet, apenas o primeiro agente que chega  obter recompensa  Qual padrão  pode tratar de forma mais eficaz a concorrência?
3. 阅读 MADDPG (arXiv:1706.02275) Seção 3──用你自己的话,以伪代码形式象征性实现确切的批评更新规则──
4. 阅读MAPPO (arXiv:2103.01955) ――为何作者认为集中价值+PPO在他们的基准上胜过非政策 MARL?列出三个强主张──
5. Para utilizar o CTDE como padrão de design, é necessário utilizar um sistema de agente de LLM de falso conceito, como agente de pesquisa + sumarizador + codificador.

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| MARL | "Multi-Agent RL" | 面向 multi-agent 系统的 Reinforcement Learning。 |
| CTDE | "Centralized Training, Decentralized Execution" | 用 global info 训练；用 local policies 部署。 |
| MADDPG | "Multi-Agent DDPG" | CTDE，每个 agent 的 critic 能看到所有 observations + actions。 |
| QMIX | "Value decomposition" | 每个 agent 的 Q 的 monotonic mixing。Cooperative。 |
| MAPPO | "Multi-Agent PPO" | 带 centralized value function 的 PPO。2026 年默认 baseline。 |
| Value decomposition | "Sum of individual Qs" | Joint Q 表示为每个 agent 的 Q 的 monotone function。 |
| Non-stationarity | "Moving targets" | 当其他 agent 学习时，每个 agent 的 env 都在变化。MARL 的核心问题。 |
| On-policy / off-policy | "Learn from current / replay" | PPO 是 on-policy (MAPPO)；DDPG 和 Q-learning 是 off-policy。 |
| SMAC | "StarCraft Multi-Agent Challenge" | cooperative micromanagement benchmark；QMIX 的本土主场。 |

## 延伸阅读

- [Lowe et al. — Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments](https://arxiv.org/abs/1706.02275) MADDPG;NeurIPS 2017
- [Rashid et al. — QMIX: Monotonic Value Function Factorisation for Deep Multi-Agent Reinforcement Learning](https://arxiv.org/abs/1803.11485) QMIX;ICML 2018
- [Yu et al. — The Surprising Effectiveness of PPO in Cooperative Multi-Agent Games](https://arxiv.org/abs/2103.01955) MAPPO;NeurIPS 2022
- [BAIR blog post on MAPPO](https://bair.berkeley.edu/blog/2021/07/14/mappo/) para o resultado do MAPPO
- [SMAC repository](https://github.com/oxwhirl/smac) StarCraft Multi-Agent Challenge
