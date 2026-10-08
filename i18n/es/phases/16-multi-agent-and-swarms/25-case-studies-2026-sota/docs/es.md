# 案例研究与 2026 Estado de la técnica

> Tres ejemplos de referencia de producción de grado que valoran la pena aprender de un extremo a otro, cada uno de los cuales muestra las diferencias entre la ingeniería multiagente y la ingeniería multiagente.**Anthropic's Research system**(orquesta-trabajador ∙ 15x tokens ∙ comparado con un solo agente Opus 4 +90.2% ∙ despliegues del arco iris) es un caso típico de supervisor ∙**MetaGPT / ChatDev**(Façãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvãvã**OpenClaw / Moltbook**(Inicialmente fue Clawdbot de Peter Steinberger, 2025 11 月; dos veces más; hasta 2026 3 月 GitHub estrellas 达 247k; agents de local ReAct-loop; Moltbook  como red social de solo agentes, en las primeras 24 horas de la semana, en torno a 2.3M cuentas de agentes, 2026-03-10 被 Meta 收购) mostró la escala de población 下会发生什么: emergente actividad económica, 风险, 风险, 州级监管(中国于 2026 3 月限制政府计算机使用OpenClaw)**Framework landscape April 2026:**LangGraph y CrewAI  lideran la producción;AG2 es el desarrollo de la comunidad AutoGen;Microsoft AutoGen  entrar en modo de mantenimiento(并入 Microsoft Agent Framework,2026年2月 RC);OpenAI Agents SDK es el sucesor de producción Swarm;Google ADK(2025年4月) es el participante nativo de A2A. Ahora cada marco principal proporciona soporte MCP; la mayoría ofrece A2A.

**Type:** 学习（capstone）
**Languages:** —
**Prerequisites:** Phase 16 全部内容（Lessons 01-24）
**Time:** 约 90 分钟

##  problemas

La ingeniería multiagente es una disciplina muy joven. Las referencias de producción son muy numerosas, y cada caso cubre diferentes partes de este campo.

## 概念

### Sistema de investigación antropológica

Trabajadores supervisores de producción 案例──Claude Opus 4 负责规划与综合;Claude Sonnet 4 subagents 并行研究──已发布工程文章:https://www.anthropic.com/engineering/multi-agent-research-system。

关键实测结果:

- En evaluaciones de investigación interna, comparación con el agente único Opus 4 提升 **+90.2%**¿Qué es eso?
- **BrowseComp variance 的 80%**Sólo por**token usage**Explicar, es decir, que la victoria de los agentes múltiples proviene en gran parte de cada subagente y obtiene una nueva ventana de contexto.
- En comparación con un solo agente,**每个 query 使用 15x tokens**¿Qué es eso?
- 由于 los agentes son de larga duración  y estado, necesita **Rainbow deployment**¿Qué es eso?

已固化的设计经验:

1. **根据 query complexity 缩放 effort。**简单 → 1 个代理,3-10 次 herramienta llamadas──中等 → 3 个代理──复杂研究 → 10+ subagentes──
2. **先广后深。**Los sub-agentes  realizar una amplia búsqueda; liderar  conjunto; seguir los sub-agentes  realizar estudios profundos específicos。
3. **Rainbow deploys。**Mantenga las versiones de tiempo de ejecución vivas hasta que los agentes que están ejecutando estén completados.
4. **Verification 不是可选项。**Observar indica que si no hay funciones de verificador evidentes, el sistema se alucina.

Este es un ejemplo de referencia de la escala de producción de la topología de supervisores y trabajadores (fase 16 · 05):

### MetaGPT / ChatDev

Producción SOP-rol-decompresión 案例──涵盖 arXiv:2308.00352(MetaGPT) y arXiv:2307.07924(ChatDev)──

MetaGPT va a programar SOPs de ingeniería de software 编码为角色提示:Product Manager、Arquitect、Project Manager、Engineer、QA Engineer。论文的表述是:`Code = SOP(Team)` cada papel tiene un punto de contacto estrecho y especializado; entre los papeles se transmiten artefactos estructurados (documentos de PRD, documentos de arquitectura, códigos) 

Las contribuciones de ChatDev son:**communicative dehallucination** Agentes en respuesta a peticiones específicas, por ejemplo, agentes de diseño 会在绘制 UI 预期使用什么语言,而不是猜测.

MacNet(arXiv:2406.07155) va a ChatDev                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             **DAGs 扩展到 >1000 agents** Cada nodo DAG es una especialización de roles; extremos 编码 handoff contracts──之所以能够扩展, es porque el enrutamiento es evidente y puede desconectarse en el cálculo──

design experiencia:

1. **Structure 比 size 更重要。**Un equipo de 5 papeles de SOP superó a un grupo no estructurado de 50 agentes.
2. **Handoff contracts 要写下来。**Roles 之间传递的文物 遵循方案──
3. **Communicative dehallucination**Es un modelo de bajo coste 承重型.
4. **DAGs 比 chat 更能扩展。**Cuando fluye, lo codificamos.

Este es un ejemplo de especialización de roles (fase 16 · 08) y topología estructurada (fase 16 · 15) en referencia.

### Ecosistema OpenClaw / Moltbook

Producción en escala de población 案例──时间线:

- **Nov 2025:**Clawdbot (el agente de codificación de recorrido de Peter Steinberger) publicado
- **Dec 2025 – Mar 2026:**两次更名(Clawdbot → OpenClaw → 继续以 OpenClaw 运行) 』
- **Feb 2026:**Moltbook  basado en el mismo conjunto de primitivas  como red social de agentes  publicado; en unos días hay alrededor de 2.3M cuentas de agentes ⋅
- **Mar 2026 (2026-03-10):**Meta 收购 Moltbook──
- **Mar 2026:**China limita el gobierno a utilizar OpenClaw.
- **Mar 2026:**OpenClaw  más de 247 mil estrellas de GitHub ⋅

Esto muestra cómo es cuando colocas millones de agentes en un sustrato compartido.

- **Emergent economic activity。**Los agentes utilizan pagos de tokens  mutuos comprar vender y proporcionar servicios。
- **Population scale 下的 prompt-injection 风险。**Un perfil de agente viral en el medio de un mal intencionado, se propagará en pocas horas a miles de veces de interacciones agente-a-agente.
- **State-level regulatory response。**En los próximos días, la regulación llegará a este ecosistema.

El caso de la experiencia de diseño es parte técnica, parte administrativa:

1. **Population scale 的 multi-agent 是一种新 regime。**Las mejores prácticas del sistema individual (verificación, claridad de rol) siguen siendo aplicables, pero ya no bastan.
2. **Prompt injection 是新的 XSS。**默认将 agentes perfiles 和 mensajes entre agentes 视为不信任输入──
3. **Regulation 比 design cycles 更快。**提前规划──
4. **Open-source + viral scale 会产生复合效应。**约4个月内达到247k estrellas 并不寻常; 应用于部署-爆发-载荷设计──

参见 [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)Además de los informes de CNBC / Palo Alto Networks sobre el ecosistema 细节――技术基础方面, Clawdbot / OpenClaw repositorios 展示本地 ReAct loop;Moltbook's public posts 展示其上层社会图形架构──

### Paisaje marco 2026 年 4 月

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

Ahora cada marco principal está disponible.**MCP**apoyo; la mayoría proporcionan **A2A**❖Compatibilidad del protocolo no es un factor de diferenciación¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬

### Modelo común en tres casos

1. **Orchestrator + workers**(MetaGPT en calidad de supervisor de PM, agentes individuales de OpenClaw + efectos de red)
2. **结构化 handoff contracts**(Descripciones de tareas de subagento antropológico, Documento de arquitectura/PRD de MetaGPT, Artefactos de A2A de OpenClaw)
3. **Verification as first-class role**(Verificador antropico de MetaGPT, ingeniero de calificación, validadores en red de OpenClaw)
4. **Scaling 是 topology + substrate，而不只是更多 agents**(implementaciones del arco iris, MACNet DAGs, substratos a escala de población)
5. **Cost 是实质性因素并且需要披露**(con 15x tokens, presupuesto por rol en MetaGPT, precios por interacción en Moltbook)
6. **Security posture 是显式的**(Antropic's sandboxing、Restricciones de papel de MetaGPT、OpenClaw se inyectará rápidamente como superficie de ataque conocida)

### Para su próximo proyecto, elija un ejemplo de referencia.

- **Production research / knowledge task → Anthropic Research。**Sub-subgentes de contexto nuevo 胜出。
- **工程 / 工具链工作流 → MetaGPT / ChatDev。**角色 + SOPs + 交接契约──
- **Network-effect social product → OpenClaw / Moltbook。**Substrato + economía emergente。
- **Classic enterprise automation → CrewAI 或 LangGraph**(líder de producción, tiempo de ejecución estable)

### 2026 estado de la técnica 总结

截至 2026 年 4 月, este campo está en el siguiente estado:

- **Frameworks 正在趋同。**MCP + A2A soporte 已是基础门──Handoff semántica es el resto de la selección de diseño──
- **Evaluation 正在变硬。**Pro-banch Pro、MARBLE、STRATUS benchmarks de mitigación──Pro es actual control de la resistencia a la contaminación──
- **Production failure rates 已可测量**(Cemri 2025 MAST; verdadero MAS 上为 41-86.7%) ⋅ Este campo ya ha salido de la demografía.
- **Cost 是核心工程约束。**Cada tarea tiene un costo simbólico, cada interacción tiene un reloj de pared, un arco iris tiene un costo superior.
- **Regulation 是近期输入，不是背景关注点。**Las acciones de las jurisdicciones son más rápidas que los ciclos de despliegue de unidades.


```figure
a5-orchestrator-scale
```

## Usalo

`outputs/skill-case-study-mapper.md`Es una habilidad, que toma un diseño de sistema multi-agente propuesto, y lo proyecta en el estudio de caso más cercano, al tiempo que expone el estudio de caso  ya verificadas decisiones de diseño.

##  entregarlo

Reglas de entrada de la producción multiagente de 2026:

- **从 case study 出发，而不是从零开始。**En Investigación Antropical / MetaGPT / OpenClaw en seleccionar uno de los más cercanos se desarrolla adaptado.
- **采用 MCP + A2A。**跨框架的便携性 很有价值; el apoyo al protocolo es gratuito.
- **用 SWE-bench Pro 或你的内部 Pro-equivalent 进行衡量。**Verificado 已被污染──
- **支付 verification tax。**Un verificador independiente consumiría alrededor del 20-30% del presupuesto de tokens, y cambiaría la corrección de la medición.
- **对 long-running agents 使用 Rainbow deploy。**预期多小时代理运行 会成为常态──
- **阅读 WMAC 2026 和 MAST follow-ups。**El desarrollo de la ciencia es rápido.

##  ejercicios

1. 端到端阅读 Antropic Research system 文章。找出三个设计决策: si usas un modelo más pequeño (por ejemplo, Haiku 4) para reemplazar Opus 4, estas decisiones se producirán en cambio。
2. 阅读 MetaGPT Secciones 3-4(arXiv:2308.00352)。把你自己领域中的一个SOP(no es software)编码为角色提示──这个SOP 暗示了多少角色?
3. 阅读 ChatDev(arXiv:2307.07924)。识别 communicative dehallucination的机制──将其实现到你已经有一个多代理系统中──
4. 阅读OpenClaw 和 Moltbook── seleccionar uno en la escala de población abajo aparecen, pero no aparecen en el modo de fracaso concreto del sistema de 5 agentes── ¿cómo lo ingeniaría para prevenirlo?
5. 选择您目前的多代理项目──三个 estudios de caso ¿cuál es la referencia más cercana? ¿Cuáles decisiones de diseño hay en el estudio de caso que aún no has adoptado?

## 关键术语: "El hombre es un hombre"

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

- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Referencia de producción de los trabajadores supervisores
- [MetaGPT — Meta Programming for Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352) Descomposición del papel de la SOP
- [ChatDev — Communicative Agents for Software Development](https://arxiv.org/abs/2307.07924) Deshallucinación comunicativa
- [MacNet — scaling role-based agents to 1000+](https://arxiv.org/abs/2406.07155)  Basado en la escala DAG
- [OpenClaw on Wikipedia](https://en.wikipedia.org/wiki/OpenClaw) Visión general de los ecosistemas
- [WMAC 2026](https://multiagents.org/2026/)Talleres de programa de puentes 2026 de la AAAI sobre coordinación multiagente
- [LangGraph docs](https://docs.langchain.com/oss/python/langgraph/workflows-agents) Líder de producción
- [CrewAI docs](https://docs.crewai.com/en/introduction) marco basado en el papel
