# Votação, autoconsistência e topologia do debate

> A melhor forma de agregação: tomar N 个独立代理,然后多数投票――Wang et al. 2022 个自一致性 用一个模型采样 N 次来做这个事――Multi-agent 通过 通过**heterogeneous**Agentes  expandir, para escapar da monocultura, diferentes modelos, diferentes indicações, diferentes temperaturas, diferentes contextos.**graph 最适合 research**, e mais de cerca de 4 agentes ▌aparecerão ▌contribuição de coordenação ▌AgentVerse ▌ICLR 2024) registrou dois tipos emergentes de padrões, comportamentos voluntários e comportamentos de conformidade, enquanto a conformidade ▌é uma característica ▌a encontrar consenso), também é um risco ▌a reflexão em grupo,Lessão 24) ▌本课会绘画拓拓空间,构建每种变体,并测量协调税──

**Type:** Learn + Build
**Languages:** Python (stdlib)
**前置要求：**Fase 16 · 07 (Sociedade da Mente e Debate), Fase 16 · 14 (Consenso e BFT)
**Time:** ~75 minutes

## 问题
O debate pode aumentar a precisão, e depende de quatro opções estruturais:

1. 谁和谁对话 (topologia)
2. Do 2023: rodadas e agentes são independentemente importantes)
3. Os agentes são heterogêneos ou não, diferentes modelos base 打破 монокультура)
4. Não há voz adversária.

Para o grupo de trabalho, os resultados são muito mais variados.

## 概念
### Autoconsistência,linha de base de modelo único

Wang et al. 2022(A autoconsistência melhora a cadeia de raciocínio do pensamento) em temperatura > 0 时对同一个模型采样 N 次,并对理性-path答案做做多数投票;;GSM8K 上的结果是:N=40样本相比单贪解码 有显著提升;;A autoconsistência é de vários agentes votando 单代理前身──

限制:auto-consistência Utilize a um modelo base. Os erros na estrutura são correlacionados.

### Voto multi-agente, extensão heterogênea

Utilize N 个* diferentes* agentes 替代 N 个样本──不同基模型──Claude、GPT、Llama)、不同提示、不同工具访问──收益:不相关错误──成本:不同 agents 的成本不同;协调它们会增加的费用──

debate heterogêneo em 2026 ano canônico 名称是**A-HMAD**O nome ainda não foi amplamente adotado, mas o trabalho o usou para representar diferentes modelos de debate, o que reduz os erros correlacionados do colapso da monocultura.

### Quatro topologias

```
star                chain               tree                graph

    ┌─A─┐           A─B─C─D         ┌──A──┐              A───B
    │   │                           │     │              │ × │
    B   C                           B     C              D───C
    │   │                          / \   / \
    D   E                         D   E F   G           (fully connected)
```

Estrela: um hub, todos os outros agentes apenas e hub para conversar.
Chain: 线性结构, cada agente 看到前一个代理的输出──类似管道──
Árvore: estruturas de nível, por sistemas de agentes hierárquicos.
Gráfico: qualquer-a-qualquer―incluindo clique totalmente conectado 和任意 DAGs―

### Imposto de coordenação (MultiAgentBench)

MultiAgentBench(MARBLE, ACL 2025, arXiv:2503.01935) em um conjunto de tarefas que contém pesquisa、código e planejamento                                                                                                                                                                                                                                          

- **Graph**Topologia em tarefas de pesquisa 上获胜──信息任何任何流动; agentes podem se criticar mutuamente──
- **Star**Em tarefas factuais de resposta rápida 上获胜──Hub 负责 filter 和 konsolidar──
- **Chain**Em oleodutos gradual (a refinamento em fases)
- **Coordination tax**Em topologia gráfica, mais de 4 agentes aparecem em seguida.

O teto de 4 agentes é empírico, não fundamental. Reflete a capacidade do contexto do LLM de 2026: o contexto de cada agente é preenchido pelos resultados dos pares; uma vez que todos podem ver todos, o valor marginal do agente N+1 adicionado vai diminuir.

### Estratégias de debate multi-agente ((Temos de ficar LOUD?)

ArXiv:2311.17371 é uma pesquisa de estratégias MAD de 2023 ⋅ foi realizada em outros estudos.

### AgenteVerse padrões emergentes

AgenteVerse(ICLR 2024, https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf）记录了No debate multi-agente, mesmo sem um design manifesto, surgem dois tipos de comportamento:

- **Volunteer。**O agente 主动提供帮助(Eu posso dar o próximo passo)。 Utilidade:
- **Conformity。**O agente ajuste sua posição para se adequar ao crítico, mesmo que o crítico seja errado.

Conformidade  explicou por que debate-até acordo 会 recompensa bullies。 Rondas restritas 加上独立法官 可以缓解──

### Heterogeneidade: realmente impulsionar a precisão

O modelo de produção de N 个代理中一个换成不同基模型,带来的精度提升通常大于把 N 增加 1──直觉是单文化, cada nova fonte de erro independente produz uma amostra correlacionada adicional, tendo mais valor──

Em casos extremos, a heterogeneidade vence a numerosidade. Na maioria das vezes, três modelos diferentes ganham cinco cópias de um modelo.

### Métodos de júri

O quadro Sibyl ([[Instituto de Jurados de Minsky-LLM]] é citado na literatura de Minsky-LLM) formalize um júri, um grupo de agentes especializados, em cada etapa  através da votação para refinar as respostas. Diferente da maioria comum, o júri tem papéis: um agente inter-exames, um fornecer contexto, um dar plausibilidade 打分── métodos do júri 介于平凡投票 (便宜、容易单文化) e plena MAD (昂贵、容易合规) entre──

### Quando o voto com debate domina

- 问题有基础真理 (facto, matemática, comportamento do código) ⋅ Convergência do voto é significativa ⋅
- Os agentes podem aceder a diferentes fontes ou ferramentas (heterogeneidade disponível).
- Rondas têm limites (normalmente 2-3), e há juiz ou verificador independente.
- O orçamento permite 3-5 agentes. Na topologia gráfica, mais de 5-7 agentes.

### Quando a votação com debate dói

- problemas em forma de opinião.
- Todos os agentes têm um modelo básico.
- Rondas 无上限──Conformidade Cada vez todos vão ganhar──
- 任务很简单――使用N=5 auto-consistência de único agente 更便宜,精度 也差不多――


```figure
sw-debate-topology
```

## Construí-lo
`code/main.py`实现:

- `run_star(agents, hub, question)` centro 轮询 cada trabalhador nem agregado
- `run_chain(agents, question)` refinamento sequencial。
- `run_tree(root, children, question)` estrutura hierárquica da agregação profundidade-2
- `run_graph(agents, question, rounds)` debate total, rondas limitadas
- Uma linha de heterogeneidade de guião: cada agente tem uma .`error_bias`, indicando a sua irregularidade sistemática.
- Um harness de medição, em N=3、5、7 下运行每种拓类,并报告(precisão、total_tokens、wallclock_simulated) ⋅

运行:

```
python3 code/main.py
```

预期输出:一张 topology × N →(precisão、tokens、latency) 表──Graph 在 N=3-5 de tarefas de estilo de pesquisa 上获胜;star 在快速事实任务 上获胜;N=7 的图表 显示协调税(latency 膨胀速度快于准确性) ⋅

## Use-o
`outputs/skill-topology-picker.md`É uma habilidade, é uma descrição de tarefa, é uma topologia (estrela / cadeia / árvore / gráfico)

## Entrega-o
Para qualquer conjunto:

- Desde o uso de um modelo base forte de**self-consistency at N=5**Começa... é uma linha de base conveniente.
- Se a precisão é importante, eleva-a até**heterogeneous voting at N=3**◊ Método de delta
-  apenas quando as tarefas têm estrutura  pesquisa  múltiplas etapas  e rodadas limitadas **debate topology**- Não.
- Sempre registando o grupo minoritário. Quando a minoria continua a existir, você tem um sinal de diversidade.
- Em precisão 旁边同时基准墙-clock 和代币──10x 成本换来更高精度是一个商业决定──

## 练习
1. 运行 `code/main.py` Curva de coordenação-imposto de topologia de gráficos: precisão vs N ̊ tokens vs N ̊曲线在什么 N 处曲线?
2. 实现 A-HMAD: três agentes de preconceitos diferentes.                                                                                                                                                                                                                                                       
3. 给图表topology 添加一个评审角色,它不投票,只对最终共识 打分―― Isso mudará o comportamento de conformidade emergente 吗?
4. 阅读 AgentVerse paper(ICLR 2024) ――识别你的实现最强烈展现的是哪种新兴行为──你能通过快速变化 引出相反的行为 吗?
5. 阅读 MultiAgentBench(arXiv:2503.01935) Seção 4(experimentos topológicos)。 Usando o seu arsenal 在论文中的一个任务上复现图表-wins-research结果──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Self-consistency | “Sample N times, vote” | Wang 2022。Single model，N 个 temperature>0 samples，对 reasoning paths 做 majority vote。 |
| Heterogeneity | “Different models” | 由不同 base models 或 prompt families 组成的 ensemble。打破 monoculture。 |
| MAD | “Multi-agent debate” | agents 在多个 rounds 中交换 critiques 的通用术语。见 Du 2023。 |
| A-HMAD | “Adversarial Heterogeneous MAD” | 强调不同 models + adversarial structure 的 MAD variant。 |
| Topology | “Who talks to whom” | Star、chain、tree、graph。决定 information flow。 |
| Coordination tax | “Diminishing returns” | 在 graph 上超过约 4 个 agents 后，cost 增长快于 quality。 |
| Volunteer behavior | “Unprompted help” | AgentVerse emergent pattern：agent 主动提出承担一个 step。 |
| Conformity behavior | “Agreement under pressure” | AgentVerse emergent pattern：agent 与 critic 对齐。 |
| Jury | “Small specialized panel” | 带 roles（examiner、context、scorer）的 Sibyl-style ensemble。 |

## 延伸阅读
- [Wang et al. — Self-Consistency Improves Chain of Thought Reasoning](https://arxiv.org/abs/2203.11171) Linha de base para um único modelo
- [Du et al. — Improving Factuality and Reasoning via Multiagent Debate](https://arxiv.org/abs/2305.14325)Agentes e rodadas são importantes.
- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) referência de topologia, mostra gráfico, cadeia  adaptar os canais
- [Should we be going MAD?](https://arxiv.org/abs/2311.17371) Estudo de estratégia MAD; descoberta de orçamento igual
- [AgentVerse (ICLR 2024)](https://proceedings.iclr.cc/paper_files/paper/2024/file/578e65cdee35d00c708d4c64bce32971-Paper-Conference.pdf) Voluntariado e padrões emergentes de conformidade
- [MARBLE repo](https://github.com/ulab-uiuc/MARBLE) Implementação de referência
