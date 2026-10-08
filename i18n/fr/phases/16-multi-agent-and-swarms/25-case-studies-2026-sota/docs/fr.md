# 案例研究与 2026 État de l'art

> Trois exemples de référence de production à niveau à apprendre de bout en bout, chacun montrant les différents aspects de l'ingénierie multi-agent.**Anthropic's Research system**(orchestrateur-travailleur ∙ 15x tokens ∙ comparé à un seul agent Opus 4 +90.2% ∙ déploiements arc-en-ciel) **MetaGPT / ChatDev**(Façavant de l'ingénierie logicielle de la spécialisation du rôle codé SOP; de la déhallucination communicative de ChatDev; MacNet  via DAGs  étendu à > 1000 agents,arXiv:2406.07155) est un cas typique de décomposition du rôle ⋅**OpenClaw / Moltbook**(Initiellement c'est le Clawdbot de Peter Steinberger, 2025 11 月; deux fois renommé; jusqu'à 2026 3 月 GitHub étoiles 达 247k; agents ReAct-loop;Moltbook  en tant que réseau social à but exclusif, en ligne quelques jours environ 2,3 M de comptes d'agents,2026-03-10 被 Meta 收购) a montré à l'échelle de la population ce qui se passe: activité économique émergente, risque d'injection rapide, réglementation au niveau de l'État(**Framework landscape April 2026:**LangGraph et CrewAI  Leur production est en tête;AG2 est le réseau continu de l'AutoGen;Microsoft AutoGen  entre en mode maintenance(并进微软代理框架,2026年2月 RC);OpenAI Agents SDK est le successeur de la production Swarm;Google ADK(2025年4月) est un participant natif A2A.

**Type:** 学习（capstone）
**Languages:** —
**Prerequisites:** Phase 16 全部内容（Lessons 01-24）
**Time:** 约 90 分钟

##  problématique

L'ingénierie multi-agents est toujours un sujet de référence. Les références de production ne sont pas nombreuses, et chaque cas couvre différentes parties de ce domaine.

## 概念

### Système de recherche anthropologique

Le directeur de la production 案例──Claude Opus 4 负责规划与综合;Claude Sonnet 4 subagents 并行研究──已发布工程文章:https://www.anthropic.com/engineering/multi-agent-research-system。

关键实测结果:

- Dans les évaluations de recherche interne, comparé à l'opus 4**+90.2%**Il y a une autre.
- **BrowseComp variance 的 80%**Il n' y a que**token usage**Expliquer, c'est-à-dire que la victoire multi-agents provient en grande partie de chaque sous-agent qui obtient une nouvelle fenêtre de contexte.
- Par rapport à l'agent unique,**每个 query 使用 15x tokens**Il y a une autre.
- Les agents sont à long terme et sont très actifs.**Rainbow deployment**Il y a une autre.

 déjà fixé expérience de conception:

1. **根据 query complexity 缩放 effort。**简单 → 1 个代理,3-10 次 appel à l'outil──中等 → 3 个代理──复杂研究 → 10+ subagents──
2. **先广后深。**Les sujets  effectuer une recherche large; mener un processus complet; suivre les sujets  effectuer des études approfondies ciblées。
3. **Rainbow deploys。**Restez en vie jusqu'à ce que les agents soient terminés.
4. **Verification 不是可选项。** observar indique que, sans les rôles de vérificateur évidents, le système va halluciner.

C'est un exemple de référence de l'échelle de production, la topologie des travailleurs-superviseurs (Phase 16 · 05)

### MetaGPT / ChatDev

Production SOP-rôle-décomposition 案例──涵盖 arXiv:2308.00352(MetaGPT)和 arXiv:2307.07924(ChatDev)──

MetaGPT va utiliser les SOP de l'ingénierie logicielle 编码为角色提示:Product Manager、Architect、Project Manager、Engineer、QA Engineer。`Code = SOP(Team)` chaque rôle a un prompt restreint, spécialisé; les échanges entre les rôles   transmissibles artifacts structurés  PRD docs, architecture docs, code)

Les contributions de ChatDev sont:**communicative dehallucination** Les agents répondent à des demandes spécifiques, par exemple les agents de conception, les utilisateurs de l'interrogatoire, les programmeurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, les utilisateurs, etc.

MacNet(arXiv:2406.07155) va ChatDev 通过 **DAGs 扩展到 >1000 agents** Chaque nœud DAG est une spécialisation de rôle; les bornes 编码 handoff contracts──之所以能够扩展,是因为路由是显然且可离线计算的──

design expérience:

1. **Structure 比 size 更重要。**Une équipe de 5 rôles de SOP a gagné un groupe non structuré de 50 agents.
2. **Handoff contracts 要写下来。**Les rôles 之间传递的文物 遵循方案──
3. **Communicative dehallucination**C'est un mode à faible coût, à faible charge.
4. **DAGs 比 chat 更能扩展。**Quand le flux est visible, on le code.

C'est le cas de référence de la spécialisation des rôles (Phase 16 · 08) et de la topologie structurée (Phase 16 · 15)

### Écosystème OpenClaw / Moltbook

Production à l'échelle de la population 案例──时间线:

- **Nov 2025:**Clawdbot (l'agent de codage de la boucle ReAct) a été publié.
- **Dec 2025 – Mar 2026:**两次更名(Clawdbot → OpenClaw → 继续以 OpenClaw 运行)
- **Feb 2026:**Moltbook  basé sur le même ensemble de primitifs  en tant que réseau social uniquement utilisé par les agents  publié; en quelques jours, il y a environ 2,3 millions de comptes d'agents 
- **Mar 2026 (2026-03-10):**Meta 收购 Moltbook。
- **Mar 2026:**Chine limite les ordinateurs de l'administration à l'utilisation d'OpenClaw.
- **Mar 2026:**OpenClaw dépasse 247 000 étoiles de GitHub.

Cela montre à quoi ressemble le multi-agent quand on met des millions d'agents dans un substrat partagé.

- **Emergent economic activity。**Les agents utilisent des paiements de jetons  mutuellement acheter et vendre et fournir des services。
- **Population scale 下的 prompt-injection 风险。**Un profil d'agent viral au milieu de l'interaction de mal intentionnel se propage en quelques heures à des milliers d'interactions agent-à-agent.
- **State-level regulatory response。**Dans les prochaines semaines, la réglementation va arriver à cet écosystème.

L'expérience de conception de cet exemple est en partie technique, en partie gouvernementale:

1. **Population scale 的 multi-agent 是一种新 regime。**Les pratiques exemplaires du système individuel (verification, clarté du rôle) sont toujours applicables, mais déjà insuffisantes.
2. **Prompt injection 是新的 XSS。**默认将代理profiles 和 messages interagents 视为未信任输入──
3. **Regulation 比 design cycles 更快。**提前规划──
4. **Open-source + viral scale 会产生复合效应。**Environ 4 mois, il atteint 247 000 étoiles et ce n'est pas normal.

参见 [OpenClaw Wikipedia](https://en.wikipedia.org/wiki/OpenClaw)Ainsi que les reportages de CNBC / Palo Alto Networks sur l'écosystème 细节――技术基础方面, les repositories de clawdbot / OpenClaw 展示了本地 ReAct loop; les public posts de Moltbook 展示了其上层社会图架构──

### Paysage cadre 2026 年 4 月

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

 Tous les cadres principaux sont disponibles **MCP**soutien; la plupart des fournisseurs **A2A**❖ La compatibilité du protocole n'est plus un facteur de différenciation.

### Modèle commun dans trois cas

1. **Orchestrator + workers**(PMI de l'Anthropic  apparent supervisor  METAGPT 中  supervisor  PM  OpenClaw  agents individuels + effets réseau)
2. **结构化 handoff contracts**(Descriptions de tâches en sous-genre anthropique, documents de PRD/architecture de MetaGPT, objets d'OpenClaw A2A)
3. **Verification as first-class role**(Vérificateur anthropique, ingénieur en QA de MetaGPT, validateurs en réseau d'OpenClaw)
4. **Scaling 是 topology + substrate，而不只是更多 agents**(déploiements d'arc-en-ciel, MacNet DAGs, sous-traits à l'échelle de la population)
5. **Cost 是实质性因素并且需要披露**(Budget par rôle de MetaGPT en moyenne, prix par interaction en moyenne de Moltbook en moyenne)
6. **Security posture 是显式的**(Anthropic's sandboxing、Restrictions de rôle de MetaGPT、OpenClaw sera prompt-injection  comme surface d'attaque connue)

### Pour votre prochain projet choisir le cas de référence

- **Production research / knowledge task → Anthropic Research。**Les subagents de nouveau contexte
- **工程 / 工具链工作流 → MetaGPT / ChatDev。**角色 + SOPs + 交接契约。
- **Network-effect social product → OpenClaw / Moltbook。**Substrate + économie émergente:
- **Classic enterprise automation → CrewAI 或 LangGraph**(lecteur de production, heure de fonctionnement stable)

### 2026 état de l' art 总结

截至 2026 年 4 月, ce domaine est dans le statut suivant:

- **Frameworks 正在趋同。**Le support MCP + A2A est déjà la base.
- **Evaluation 正在变硬。**Les résultats de la recherche ont été évalués par le rapport à la recherche sur les produits de la consommation de l'énergie.
- **Production failure rates 已可测量**(Cemri 2025 MAST; réel MAS 上为 41-86,7%) ⋅ Ce domaine est déjà démo.
- **Cost 是核心工程约束。**Le coût de chaque tâche, le coût de chaque interaction, le coût de déploiement de l'arc-en-ciel, le coût de chaque interaction, le coût de la mise en œuvre de l'ouvrage, le coût de la mise en œuvre de l'ouvrage, le coût de la mise en œuvre de l'ouvrage, le coût de la mise en œuvre de l'ouvrage, le coût de la mise en œuvre de l'ouvrage, le coût de la mise en œuvre de l'ouvrage, le coût de la mise en œuvre de l'ouvrage, le coût de la mise en œuvre de l'ouvrage, le coût de la mise en œuvre de l'ouvrage, le coût de la mise en œuvre de l'ouvrage, le coût de la mise en œuvre de l'ouvrage, le coût de la mise en œuvre de l'ouvrage.
- **Regulation 是近期输入，不是背景关注点。**Les actions des juridictions sont plus rapides que les cycles de déploiement.


```figure
a5-orchestrator-scale
```

## Utilisez-le

`outputs/skill-case-study-mapper.md`C'est une compétence, elle prend en compte une conception de système multi-agent proposée, et la reflète dans l'étude de cas la plus proche, tout en exposant les décisions de conception déjà validées dans l'étude de cas.

## Je le livre.

Règles d'entrée de production multi-agent de 2026:

- **从 case study 出发，而不是从零开始。**Dans les recherches anthropologiques / MetaGPT / OpenClaw, choisissez l'un des plus proches et vous pouvez adapter à celui-ci.
- **采用 MCP + A2A。**La portabilité des frameworks est très importante; le support du protocole est gratuit.
- **用 SWE-bench Pro 或你的内部 Pro-equivalent 进行衡量。**La contamination a été vérifiée.
- **支付 verification tax。**Un vérificateur indépendant consomment environ 20-30% du budget des jetons, et change la précision de la mesure.
- **对 long-running agents 使用 Rainbow deploy。**L'agent de la course devient un état de fait.
- **阅读 WMAC 2026 和 MAST follow-ups。**Cette discipline s'est développée très rapidement.

## 练习

1. 端到端阅读 Anthropic Research system 文章。找出三个设计决策: si vous utilisez un modèle plus petit, comme Haiku 4, pour remplacer Opus 4, ces décisions vont changer。
2. 阅读 MetaGPT Sections 3-4(arXiv:2308.00352)。把你自己领域中的一个SOP(不是软件)编码为角色提示──这个SOP 暗示了多少角色?
3. 阅读 ChatDev(arXiv:2307.07924)。识别 communicative dehallucination的机制──将其实现到你已经有一个多代理系统中──
4. 阅读OpenClaw 和 Moltbook── sélectionnez un à l'échelle de la population qui apparaît en bas, mais ne apparaîtra pas dans le mode de défaillance spécifique du système 5-agent── comment allez-vous le générer et le prévenir ?
5. 选择您目前的多代理项目──三例案例中哪个是最接近参考?

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

- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) référence de production des travailleurs superviseurs
- [MetaGPT — Meta Programming for Multi-Agent Collaborative Framework](https://arxiv.org/abs/2308.00352) Décomposition du rôle du SOP
- [ChatDev — Communicative Agents for Software Development](https://arxiv.org/abs/2307.07924) déhallucination communicative
- [MacNet — scaling role-based agents to 1000+](https://arxiv.org/abs/2406.07155)   Basé sur l'échelle DAG
- [OpenClaw on Wikipedia](https://en.wikipedia.org/wiki/OpenClaw) vue d'ensemble des écosystèmes
- [WMAC 2026](https://multiagents.org/2026/) Atelier du programme de pont 2026 de l'AAAI sur la coordination multi-agents
- [LangGraph docs](https://docs.langchain.com/oss/python/langgraph/workflows-agents) chef de la production
- [CrewAI docs](https://docs.crewai.com/en/introduction) cadre fondé sur les rôles
