# 案例研究与 2026 Estado da arte

> Três exemplos de referência de nível de produção que valem a pena aprender de ponta a ponta, cada um mostrando diferentes aspectos da engenharia multi-agente.**Anthropic's Research system**(orquestra-trabalhador ∙ 15x tokens ∙ comparado com o único agente Opus 4 +90.2% ∙ implantações do arco-íris) **MetaGPT / ChatDev**(Fação de especialização de papel codificado em SOP da engenharia de software;Delucinação comunicativa do ChatDev;MacNet  através de DAGs  expandindo para > 1000 agentes,arXiv:2406.07155) é um típico caso de decomposição de papel:**OpenClaw / Moltbook**(Inicialmente é o Clawdbot de Peter Steinberger, em 2025, 11 月; duas vezes mais tarde; até 2026 3 月 GitHub estrelas 达 247k; agents do local ReAct-loop; Moltbook  como rede social de apenas agentes, em alguns dias há cerca de 2,3 milhões de contas de agentes, em 2026-03-10 被 Meta 收购) mostrou a escala da população 下会发生什么: emergente atividade econômica 风险 冲刺 风险 州级监管(中国于 2026 年 3 月限制政府计算机使用OpenClaw)**Framework landscape April 2026:**LangGraph 和 CrewAI  liderar a produção;AG2 é a comunidade continuada de AutoGen;Microsoft AutoGen  entrar em modo de manutenção(并进入 Microsoft Agent Framework,2026 年 2 月 RC);OpenAI Agents SDK é a produção Swarm sucessor;Google ADK(2025 年 4 月) é um participante nativo A2A.

**Type:** 学习（capstone）
**Languages:** —
**Prerequisites:** Phase 16 全部内容（Lessons 01-24）
**Time:** 约 90 分钟

## 问题

A engenharia multi-agente  ainda é um dos mais jovens disciplinas. As referências de produção não são muitas, e cada caso abrange diferentes partes deste campo.

## 概念

### Sistema de Pesquisa Antropológica

O trabalho de supervisor de produção 案例──Claude Opus 4 负责规划与综合;Claude Sonnet 4 subagents 并行研究──已发布工程文章:https://www.anthropic.com/engineering/multi-agent-research-system。

关键实测结果:

- Em avaliações de pesquisa interna, comparação com o Opus 4**+90.2%**- Não.
- **BrowseComp variance 的 80%**Só por**token usage**Explicar, é dizer que a vitória de multi-agente vem em grande parte de cada subagente e obtém uma nova janela de contexto.
- Comparado a um único agente,**每个 query 使用 15x tokens**- Não.
- 由于 agentes são de longa duração  e estado, necessária **Rainbow deployment**- Não.

Experiência de design consolidada:

1. **根据 query complexity 缩放 effort。**简单 → 1 个代理,3-10 次 tool calls──中等 → 3 个代理──复杂研究 → 10+ subagentes──
2. **先广后深。**Sub-agentes  realizar uma pesquisa extensa; liderar  integrado; acompanhar sub-agentes  realizar estudos profundos específicos。
3. **Rainbow deploys。**Mantém as versões antigas de tempo de execução, até que os agentes que estão a funcionar sejam completados.
4. **Verification 不是可选项。**Observar mostra que, se não houver funções de verificador, o sistema vai alucinar.

Esta é uma referência a escala de produção, a topologia de supervisor-trabalhador (fase 16 · 05):

### MetaGPT / ChatDev

Produção SOP-role-decompositividade 案例── abrangendo arXiv:2308.00352(MetaGPT)

MetaGPT irá programar SOPs de engenharia de software 编码为角色提示:Product Manager、Arquitect、Project Manager、Engineer、QA Engineer。论文的表述是:`Code = SOP(Team)` cada papel tem um pequeno e específico momento;  role  entre as mãos  传递结构化 artefacts PRD docs 建筑 docs 码) 

As contribuições de ChatDev são:**communicative dehallucination** Agentes em resposta a pedidos específicos, por exemplo, agentes de designers 会在绘制 UI 预期使用什么语言,而不是猜测.

MacNet(arXiv:2406.07155) vai ChatDev 通过 **DAGs 扩展到 >1000 agents** Cada nó DAG é uma especialização de papel; arredores 编码 handoff contracts──之所以能够扩展,是因为路由是显式且可离线计算的──

design experiência:

1. **Structure 比 size 更重要。**Uma equipa de 5 funções de SOP venceu um grupo não estruturado de 50 agentes.
2. **Handoff contracts 要写下来。**Roles 之间传递的文物 遵循方案──
3. **Communicative dehallucination**É um modelo de baixo custo, que leva a cabo um grande peso.
4. **DAGs 比 chat 更能扩展。**Quando o fluxo é conhecido, nós o codificamos.

Esta é uma referência a especialização de papéis (Fase 16 · 08) e a topologia estruturada (Fase 16 · 15)

### Sistema de ecossistema OpenClaw / Moltbook

Produção em escala populacional 案例──时间线:

- **Nov 2025:**Clawdbot (Peter Steinberger's local agente de codificação ReAct-loop) lançado
- **Dec 2025 – Mar 2026:**两次更名(Clawdbot → OpenClaw → 继续以 OpenClaw 运行) 』
- **Feb 2026:**Moltbook  baseado no mesmo conjunto de primitivas  como rede social apenas para agentes  publicado; em poucos dias, há cerca de 2,3 milhões de contas de agentes 
- **Mar 2026 (2026-03-10):**Meta 收购 Moltbook──
- **Mar 2026:**China limita os computadores do governo a usar OpenClaw.
- **Mar 2026:**OpenClaw  mais de 247 mil estrelas do GitHub.

Isto mostra como é quando colocas milhões de agentes no substrato compartilhado.

- **Emergent economic activity。**Agentes utilizam pagamentos de tokens  mutuos compra-venda e prestação de serviços。
- **Population scale 下的 prompt-injection 风险。**Um perfil de agente viral no meio do mau intenção, se espalhará em poucas horas para milhares de vezes de interação agente-a-agente.
- **State-level regulatory response。**Nas últimas semanas, a regulamentação chegou a este ecossistema.

O caso é um caso de experiência de design que é parte técnica, parte administrativa:

1. **Population scale 的 multi-agent 是一种新 regime。**As melhores práticas do sistema individual (verificação, clareza de papel) continuam a ser aplicadas, mas já não são suficientes.
2. **Prompt injection 是新的 XSS。**默认将 agentes perfis 和 cross-agentes mensagens 视为不信入──
3. **Regulation 比 design cycles 更快。**提前规划──
4. **Open-source + viral scale 会产生复合效应。**约4个月内达到247k estrelas 并不寻常; 应用于部署-burst-load 设计──

参见 [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)Além de reportagens da CNBC / Palo Alto Networks sobre o ecossistema 细节――技术基础方面,Clawdbot / OpenClaw repos 展示本地 ReAct loop;Moltbook's open posts 展示其上层社会图架构──

### Paisagem-quadro 2026 年 4 月

| Framework | Status | Best for | Notes |
|---|---|---|---|
| **LangGraph** (LangChain) | Production leader | structured graph + checkpointing + human-in-the-loop | production 推荐默认选择 |
| **CrewAI** | Production leader | role-based crews with Sequential/Hierarchical processes | 擅长 role decomposition |
| **AG2** | Community maintained | GroupChat + speaker selection | AutoGen v0.2 延续版本 |
| **Microsoft AutoGen** | Maintenance mode (Feb 2026) | — | 并入 Microsoft Agent Framework RC |
| **Microsoft Agent Framework** | RC (Feb 2026) | orchestration patterns + enterprise integration | 新 entrant；值得关注 |
| **OpenAI Agents SDK** | Production | Swarm successor | tool-return handoff pattern |
| **Google ADK** | Production (April 2025) | A2A-native | Google Cloud integration |
| **Anthropic Claude Agent SDK** | Production | single-agent + Research extension | 参见 Research system 文章 |

Agora, cada estrutura principal está disponível.**MCP**apoio; a maioria fornece **A2A**❖ Compatibilidade do protocolo Não é mais um fator diferencial.

### Modelo comum em três casos

1. **Orchestrator + workers**(Antropic's manifest supervisor,MetaGPT 中作为 supervisor's PM,OpenClaw's individual agents + efeitos de rede)
2. **结构化 handoff contracts**(Descrições de tarefas antropológicas subagentes  Documents de PRD/arquitetura MetaGPT  Artefactos OpenClaw A2A)
3. **Verification as first-class role**(Antropic's verifier, MetaGPT's QA Engineer, OpenClaw's in-network validators)
4. **Scaling 是 topology + substrate，而不只是更多 agents**(implementação do arco-íris, MACNet DAGs, substratos em escala populacional)
5. **Cost 是实质性因素并且需要披露**(Budget por função em MetaGPT, Preço por interação em Moltbook)
6. **Security posture 是显式的**(Antropic's sandboxing、Restruturas de papel do MetaGPT、OpenClaw irá injetar imediatamente como superfície de ataque conhecida)

### Para o seu próximo projeto escolher o caso de referência

- **Production research / knowledge task → Anthropic Research。**Sub-agentes de contexto novo 胜出。
- **工程 / 工具链工作流 → MetaGPT / ChatDev。**角色 + SOPs + 交接契约。
- **Network-effect social product → OpenClaw / Moltbook。**Substrato + economia emergente:
- **Classic enterprise automation → CrewAI 或 LangGraph**(líder de produção, tempo de execução estável)

### 2026 estado da arte 总结

截至2026年 4月, este domínio está no seguinte estado:

- **Frameworks 正在趋同。**MCP + A2A suporte 已是基础门──Handoff semântica é o que resta abaixo de design seleção──
- **Evaluation 正在变硬。**O SWE-bench Pro、MARBLE、STRATUS benchmarks de mitigação。Pro é actual check-up de resistência à contaminação¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- **Production failure rates 已可测量**(Cemri 2025 MAST; real MAS 上为 41-86.7%) ⋅ Este campo já saiu de moda.
- **Cost 是核心工程约束。**Cada tarefa tem um custo simbólico, cada interação tem um custo de parede, um arco-íris tem um custo de desdobramento.
- **Regulation 是近期输入，不是背景关注点。**Ações de jurisdições são mais rápidas do que ciclos de implantação de unidades.


```figure
a5-orchestrator-scale
```

## Use-o

`outputs/skill-case-study-mapper.md`É uma habilidade, ele leva um projeto de sistema multi-agente proposto, e o mapeia para o estudo de caso mais próximo, ao mesmo tempo em que expõe o estudo de caso  já verificadas decisões de design.

## Entrega-o

2026 Anos de produção multi-agente de entrada regras:

- **从 case study 出发，而不是从零开始。**Em Pesquisa Antropológica / MetaGPT / OpenClaw, seleção do mais próximo um
- **采用 MCP + A2A。**跨框架的可移植性 很有价值; support protocol is free──
- **用 SWE-bench Pro 或你的内部 Pro-equivalent 进行衡量。**Verificada 已被污染──
- **支付 verification tax。**Um verificador independente consumiria cerca de 20-30% do orçamento de tokens, e trocaria a corretão da medição.
- **对 long-running agents 使用 Rainbow deploy。**O agente de corrida vai tornar-se um estado normal.
- **阅读 WMAC 2026 和 MAST follow-ups。**O desenvolvimento da ciência foi rápido.

## 练习

1. 端到端阅读 Antropic Research system 文章。找出三个设计决策: Se você usar um modelo menor (como Haiku 4) para substituir Opus 4, essas decisões vão mudar。
2. 阅读 MetaGPT Seções 3-4(arXiv:2308.00352)。把你自己领域中的一个SOP(不是软件)编码为角色提示──这个SOP 暗示了多少角色?
3. 阅读 ChatDev(arXiv:2307.07924)。识别 沟通性幻觉的机制──将其实现到你已经有一个多代理系统 中──
4. 阅读OpenClaw 和 Moltbook──select one on the population scale 下出现、但不会出现在五代理系统中的具体失败模式──你会如何工程化地防范它?
5. 选择您的当前多代理项目──三例案例研究中哪个是最接近的参考?

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Anthropic Research | “supervisor reference” | Claude Opus 4 + Sonnet 4 subagents；15x tokens；相较 single-agent +90.2%。 |
| MetaGPT | “SOP as prompts” | 面向 software engineering 的 role decomposition；`Code = SOP(Team)`。 |
| ChatDev | “Agents as roles” | Designer / programmer / reviewer / tester；communicative dehallucination。 |
| MacNet | “Scale ChatDev via DAG” | arXiv:2406.07155；通过显式 DAG routing 实现 1000+ agents。 |
| OpenClaw | “Local ReAct-loop agents” | Steinberger 的项目；到 2026 年 3 月达 247k stars。 |
| Moltbook | “Agent-only social network” | 2.3M agent accounts；2026 年 3 月被 Meta 收购。 |
| Rainbow deploy | “Multiple versions concurrent” | 为 in-flight long-running agents 保持旧 runtime versions 存活。 |
| Communicative dehallucination | “Ask before answering” | Agents 向 peers 请求具体信息，而不是猜测。 |
| WMAC 2026 | “The AAAI workshop” | 2026 年 4 月 multi-agent coordination 社区焦点。 |

## 延伸阅读

- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Referência de produção dos trabalhadores supervisores
- [MetaGPT — Meta Programming for Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352) Descomposição do papel do SOP
- [ChatDev — Communicative Agents for Software Development](https://arxiv.org/abs/2307.07924) Desalucinação comunicativa
- [MacNet — scaling role-based agents to 1000+](https://arxiv.org/abs/2406.07155)  baseada na escala DAG
- [OpenClaw on Wikipedia](https://en.wikipedia.org/wiki/OpenClaw) Visão geral dos ecossistemas
- [WMAC 2026](https://multiagents.org/2026/) Talento do Programa de Ponte 2026 da AAAI sobre Coordenação Multicompanheira
- [LangGraph docs](https://docs.langchain.com/oss/python/langgraph/workflows-agents)Líder da produção
- [CrewAI docs](https://docs.crewai.com/en/introduction) quadro baseado em funções
