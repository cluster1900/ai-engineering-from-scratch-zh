# 评估与协调 Referências

> Os cinco indicadores de referência para 2025-2026 abrangem o espaço de avaliação multiagente.**MultiAgentBench / MARBLE**(ACL 2025, arXiv:2503.01935) Utilizando KPI de marco  avaliar estrelas/cadeias/árvores/gráfico 拓;**graph 最适合 research**, Planejamento cognitivo  aumentou cerca de 3% das realizações de marcos **COMMA** avaliar Coordenação multimodal de informação asimétrica; incluindo GPT-4o.**MedAgentBoard**(arXiv:2505.12371) abrangem quatro tipos de missões médicas, e muitas vezes descobrem que multi-agente não é melhor do que um único LLM.**AgentArch**(arXiv:2509.10769) referência 结合 ferramenta-uso + memória + orquestração de arquiteturas de agentes empresariais。**SWE-bench Pro**([arXiv:2509.16941](https://arxiv.org/abs/2509.16941)O relatório de Claude Opus 4.7 (Abril 2026) mostra que os modelos de fronteira na Pro são mais de 70% e que os modelos de fronteira na Pro são mais de 23%.**64.3%**,并显式使用代理团队协调( ainda não publicado Antropic primary source  先视为初步结果);Verdent(agente andaime) 在 Verified 上 达到**76.1% pass@1**([Verdent technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report))。**AAAI 2026 Bridge Program WMAC**(https://multiagents.org/2026/）是2026 年社区焦点──本课基于 MARBLE 的指标,运行拓学-vs-指标扫,并固定仅通过SWE-bench Verified 不是概括证据 这条规则──

**类型：**Aprenda
**语言：**Python (stdlib)
**先修：**Fase 16 · 15 (Topologia de votação e debate), Fase 16 · 23 (Modos de falha)
**时间：**Cerca de 75 minutos

## 问题

Quando um artigo afirma que o nosso sistema multi-agente é melhor, a questão é: o que é melhor do que o que é melhor em quais tarefas? Como medir?

 sem partilha de referências, você não pode significativamente comparar dois sistemas multi-agentes― pior ainda, sem referências de resistência, modelos de fronteira podem ser contaminados― até 2025, o banco da SWE verificou  já entrou em parte no material de treinamento e foi contaminado; pontuações de fronteira  inflação; Pro projetado como exames reais não contaminados―

Este curso apresenta cinco benchmarks canônicos para 2026, que explicam cada benchmark 衡量什么,并教你用怀疑态度阅读 benchmark claims──

## 概念

### MultiAgentBench (MARBLE)  ACL 2025

arXiv:2503.01935── em pesquisa, codificação e tarefas de planejamento 上评估四种协调拓类 (star,chain,tree,graph)── baseada em KPIs de marcos 跟踪部分进展,而不只看最终成功──

测量结果:

- **Graph**Topologia, o melhor adaptado a cenários de investigação; apoio a qualquer crítica.
- **Chain**O código de refinamento gradual é o mais adequado.
- **Star**É ideal para uma consolidação rápida de facto.
- **Coordination tax**Em grafico acima, mais de 4 agentes aparecem.
- **Cognitive planning**Em todas as topologias, aumentou cerca de 3% a realização de metas.

Utilize scenario: você pensa em topologias de coordenação  realizar maçãs-a-maçãshttps://github.com/ulab-uiuc/MARBLE）提供- O avaliador.

### COMMA  Multimodal não对称信息

 Agentes de cobertura  possuem diferentes modalidades de observação  e devem coordinar tarefas sem partilha completa de informações  O resultado do relatório é inadequado: incluindo modelos de fronteira no GPT-4o **random baseline** sinais é: modalidades de vários agentes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   

Utilizando o cenário: o seu sistema tem coordenação multimodal ou assimétrica de informação.

### MedAgentBoard  Teste de estresse de domínio

arXiv:2505.12371──四类医疗任务:diagnóstico, planejamento do tratamento, geração de relatórios, comunicação com os pacientes, comparar sistemas multi-agente, single-LLM e tradicionais baseados em regras.

 encontrou: multi-agente na maioria das categorias não é superior ao single-LLM── multi-agente 优势很狭 当子任务可以清晰分离时(诊断 + tratamento),任务分解有助;当协调总费 超过专业化获取时(报告生成),它会伤害效果──

Use Caso: Seu domínio tem linhas de base claras de um único LLM. Se a experiência do MedAgentBoard pode ser generalizada, muitos sistemas multi-agente propostos são sobre-engenheirados.

### AgenteArch  Arquiteturas empresariais

ArXiv:2509.10769──将工具使用、メモリ 和オーケストレーション 分层组合的企业设置──ベンチマーク 隔離每层的贡献: adicionar ferramentas Há muita ajuda? adicionar memória? adicionar multi-agent orchestration?

Use Caso: Você está projetando uma pilha de agente empresarial, e precisa provar a racionalidade de cada camada.

### SWE-bench Pro  现实检验

ArXiv:2509.16941──41 个库 中的 1865 个问题, abrangendo aplicativos de negócios, serviços B2B, ferramentas de desenvolvimento.**未污染**Os modelos de fronteira em Pro são cerca de 23%, enquanto os verificados são mais de 70%.

2026 年 4 月分数:
- Claude Opus 4.7 no Pro: **64.3%**(rapport称显式使用代理团队协调; ainda não publicado fonte primária antropófica  先视为初步结果)
- Verdent ((apresentante) em Verificado: **76.1% pass@1**([technical report](https://www.verdent.ai/blog/swe-bench-verified-technical-report))。
- Não utiliza agentes de andamios de fronteira pontuações brutas em Pro: ~23-35%[SWE-bench Pro paper](https://arxiv.org/abs/2509.16941))。

 nós derrotamos o banco SWE Verificado não é mais um teste de capacidade──Pro é o teste de gating actual──A equipa de agentes em andamento no Pro é um dos argumentos empíricos mais fortes para o apoio à coordenação multi-agente em 2026.

### AAAI 2026 WMAC

Programa de ponte 2026 da AAAI  Talento sobre coordenação multi-agentehttps://multiagents.org/2026/）。这是2026 Anos de estudo de AI multi-agente em comunidade foco. Papéis aceitos e procedimentos de workshop são o local canônico para avaliar novos métodos.

### Usage of doubt (conhecimento de dúvidas)

Quando alguém afirma um resultado multi-agente:

1. **哪个 benchmark，哪个 split？**O SWE-bench Verificado com Pro  diferença é grande.
2. **Contamination check。**O índice de referência será publicado após o corte de formação do modelo testado?
3. **Baseline comparison。**Comparar com a linha de base de um único LLM, trabalho aleatório, anterior de vários agentes, não é uma versão desatonizada do mesmo sistema, comparar com a versão de um sistema diferente.
4. **Statistical significance。**N testes, p-valor, intervalo de confiança, variância de modelos de fronteira, muito alta, corridas individuais,
5. **Task diversity。**Uma tarefa ou várias? A generalização é importante para a produção.
6. **Cost disclosure。**Tokens por tarefa 壁時計──20x 90% do resultado da solução é uma decisão empresarial, não uma declaração de capacidade──

### Os valores de referência anteriores medem o conteúdo ruim

- **Long-horizon coordination。**持续数天的墙-clock interaction──当前所有基准都很短──
- **Adversarial resilience。**O que acontece quando um agente é malintencionado ou é agredido?
- **Drift under deployment。**Os padrões de referência são estáticos; a produção e a distribuição variam.
- **Cost-normalized performance。**A maioria dos índices de referência  relatam precisão bruta, em vez de precisão por dólar 

Para você realmente se preocupar com o eixo de construção de seu próprio índice interno, geralmente é a prática correta.


```figure
a5-bench-gap
```

## Construí-lo
`code/main.py`É um passeio não interativo:

- Na tarefa de brinquedo 上模拟 3 个多代理系统──
- Para cada sistema calcular métricas de margem de estilo MARBLE.
-  através de um conjunto de treinamento                                                                                                                                                                                                                                                           
- 显式比较随机基线――
- 打印 cartão de pontuação de reivindicações de referência

运行:

```bash
python3 code/main.py
```

预期输出:carta de pontuação do sistema, contendo a precisão bruta, a realização de metas, o custo por tarefa, o delta da linha de base aleatória, bem como a nota de verificação da contaminação.

## Use-o
`outputs/skill-benchmark-reader.md`读取任意多代理基准索赔,并应用审查检查清单──输出:grade 和 caveats──

## Entrega-o
O produto é avaliado:

- **构建 internal benchmark**Os índices de referência públicos podem fornecer informações, mas não podem ser substituídos.
- **在每次比较中包含 random baseline。**Se você não consegue superar o acaso na tarefa de coordenação, então a tarefa pode ser mal definida.
- **同时报告 cost 和 accuracy。**Custo de tokens e relógio de parede.
- **每季度重建 benchmark。**Distribuição da produção 会变化; 陈旧基准 会误导──
- **避免 published-benchmark overfitting。**Se a sua equipa se especializasse em melhorar os números de SWE-bench Pro, você voltaria a produzir.

## 练习

1. 运行 `code/main.py` Descubra qual dos três sistemas simulados tem o melhor custo por marco.
2. 阅读 MultiAgentBench(arXiv:2503.01935)。 Para o seu próprio domínio de tarefas, julgar MARBLE 会推四种 topologies 中的哪种──根据论文结果说明理由──
3. 阅读SWE-bench Pro paper── é especificamente como resistir à contaminação?
4. 阅读 COMMA 关于多模拟协调的发现――设计一个可以加入内部基准的简单多模拟协调任务――what can be calculated to be useful signal?
5. O resultado principal de um artigo recente sobre vários agentes foi aplicado à lista de verificação de reivindicações de referência.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| MARBLE | "MultiAgentBench" | ACL 2025；带 milestone KPIs 的 star/chain/tree/graph topologies。 |
| COMMA | "Multimodal benchmark" | Multimodal asymmetric-info coordination；frontier models 相比 random 表现吃力。 |
| MedAgentBoard | "Domain stress test" | 四个医疗类别；经常发现 multi-agent 并不优于 single-LLM。 |
| AgentArch | "Enterprise benchmark" | Tools + memory + orchestration 分层组合。 |
| SWE-bench Pro | "Contamination-resistant" | 1865 个问题、41 个 repos；在 Verified 上约 23% vs 70%+（contamination signal）。 |
| Milestone achievement | "Partial credit" | 奖励进展而不只奖励最终成功的 benchmarks。 |
| Contamination | "Benchmark leaked into training" | 发布后，benchmarks 进入训练语料；分数膨胀。 |
| WMAC | "AAAI 2026 Bridge Program" | Workshop on Multi-Agent Coordination；社区焦点。 |

## 延伸阅读

- [MultiAgentBench / MARBLE](https://arxiv.org/abs/2503.01935) 带 milestone KPIs topologia referência
- [MARBLE repository](https://github.com/ulab-uiuc/MARBLE) Implementação de referência
- [MedAgentBoard](https://arxiv.org/abs/2505.12371) Teste de estresse de domínio; multi-agente geralmente não é superior a
- [AgentArch](https://arxiv.org/abs/2509.10769)Arquiteturas de agentes empresariais
- [SWE-bench leaderboards](https://www.swebench.com/) Modelos de fronteira de Verificados e Pro
- [AAAI 2026 WMAC](https://multiagents.org/2026/) 2026 年社区焦点
