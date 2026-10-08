# CrewAI: Basé sur les rôles d'équipes et de flux

> CrewAI est un cadre multi-agent de 2026 basé sur des rôles. Il comporte quatre composantes de base: Agent, Tasque, Crew, Processus.

**类型：**apprendre + construire
**语言：**Python (stdlib)
**先修：**Phase 14 · 12 (Patrons de flux de travail), phase 14 · 14 (Modèle d'acteur)
**时间：**À environ 75 minutes.

## Objectif de l'apprentissage

- Découvrez les quatre composants fondamentaux de l'Equipage d'Action (Agent,Tâche,Equipage,Processus) ainsi que les composants responsables de ce qu'ils sont.
- 区分 Sequentielle、Hiérarchique 和 planifié processus de consensus; pour chaque classe de travail
- 区分 Crews (basé sur le rôle de l'équipage) et Flows (détermination des événements),并解释文档中的生产建议──
- Utilisation `@tool`décorateur`BaseTool`sous-classe 接入 tools; comprendre les sorties structurées et le libre texte 取舍──
- Déclarer quatre types de mémoire CrewAI, ainsi que chacun des types qui méritent d'être utilisés.
- 实现一个工作三 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作人员 工作
- 识别三种 CrewAI modes de défaillance: implémentation rapide, gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la

##  problématique

 Les équipes de cadres multi-agents se heurtent à la même barrière   Collaboration autonome  dans la démo 里 sonne très bien  Puis le client soumet un bug, vous avez besoin de répétition déterministe  ou finance  demandez à un équipage de LLM 路由 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 通过 

Les équipes du LLM ne peuvent pas répondre à ces questions de manière claire.

La décomposition de l'Equipage d'AIA repose sur cette démarche. Les équipes utilisent le processus de collaboration, le travail de recherche, le travail de recherche. Les flux sont utilisés pour la production de l'événement, le code, la production.

## 概念

### Quatre composants fondamentaux

La surface de l'équipage est très petite.

- **Agent。** `role + goal + backstory + tools + (optional) llm`◊ histoire de fond 很关键──它塑造语气、判断,以及 agent 何时停止──Tools is agent 可以调用函数(下面会讲)──
- **Task。** `description + expected_output + agent + (optional) context + (optional) output_pydantic`❖ Unité de travail réutilisable`expected_output`C'est une affaire.`context`列出上游任务,其输遇被传入──`output_pydantic`强制使用结构化形态──
- **Crew。**- Je ne sais pas.`agents`Liste de`tasks`Liste de`process`, ainsi que les options `memory`+ `verbose`+ `manager_llm`- Je suis là.
- **Process。**执行策略──Sequentielle、Hiérarchique、Consensus(计划中)──

Les agents ne se verront pas directement les uns les autres. Les tâches citent les agents. L'équipe s'occupe des tâches.

> **已针对**CrewAI 0.86(2026-05)验证──更新版本可能会重新命名或合并流程类型;在依赖具体形态之前,请查看 [CrewAI Processes docs](https://docs.crewai.com/concepts/processes)Il y a une autre.

### La séquence, la hiérarchie et le consensus

- **Sequential。**Tasques 按声明顺序运行──Tâche N's输出可作为 `context`提供给任务 N+1──成本最低──最可预测──当顺序固定时使用──
- **Hierarchical。**Un agent manager (appel spécialisé) entre les spécialistes`manager_llm`configuration ou configuration par défaut de génération de gestionnaires. gestionnaires Chaque tour choisit la prochaine tâche, et peut refuser ou rediriger.
- **Consensus。**计划中, la API publique actuelle 尚未实现──文档保留该名称用于未来基于投票的进程──今天不要依赖它──

Les séances hiérarchiques augmentent chaque fois par appel spécialisé de LLM.

### Équipes contre flux

C'est le cadre de l'année 2026

- **Crew。**Autonomie de la LM. Le cadre de la mise en œuvre de la LM.
- **Flow。**Vous avez des événements qui vous poussent à faire un graphique.`@start`- Je suis en train de faire une petite promenade.`@listen(topic)`标记一步,它会在另一个步骤 发发这个话题 时触发──每一步都是普通 Python(内部可以调用机组)──适应:生产──可观测──可测──确定性──

文档在 2026年生产建议: de Flow 开始──当自治 值得其成本时,把船员 作为Flow steps 内部的 `Crew.kickoff()`Les appels 折进去──Flow 给你审计轨道,Crew 给你探索──组合使用,不要二选一──

### Outil 集成

 donner à l'agent 配备 tool il y a trois façons de choisir la plus simple et la plus adaptée 

1. **`@tool` decorator。**純函数成工具──Signature is schema;docstring is LLM 看到的描述──最适合一次性助手──

   ```python
   from crewai.tools import tool

   @tool("Search the web")
   def search(query: str) -> str:
       """Return top results for the query."""
       return run_search(query)
   ```

2. **`BaseTool` subclass。**基于 class 工具,带显式 args schema、async support、retries──当 tool 有状态(client、cache) 或需要结构化 args 时使用──

   ```python
   from crewai.tools import BaseTool
   from pydantic import BaseModel

   class SearchArgs(BaseModel):
       query: str
       limit: int = 10

   class SearchTool(BaseTool):
       name = "web_search"
       description = "Search the web and return top results."
       args_schema = SearchArgs

       def _run(self, query: str, limit: int = 10) -> str:
           return self.client.search(query, limit=limit)
   ```

3. **内置 toolkits。**CrewAI  fournir des adaptateurs de première partie:`SerperDevTool`- Je suis là.`FileReadTool`- Je suis là.`DirectoryReadTool`- Je suis là.`CodeInterpreterTool`- Je suis là.`RagTool`- Je suis là.`WebsiteSearchTool`                                                                                                                                                                                                                                                              

Les sorties structurées Utilisation de Pydantic.`output_pydantic=MyModel` L'équipe de l'AI sera basée sur le modèle de réponse de la MLL, et effectuera des efforts de coercition ou de ré-essayer de la mettre en œuvre avec rigueur `expected_output`Les résultats de la série 配合使用──Free-text output 适合草稿;structurés output 才是下游

### Les crochets de mémoire

La CrewAI offre quatre types de mémoire.

> **已针对**CrewAI 0.86(2026-05) 验证── Récemment, tout est en train de se mettre en place.`Memory`Le modèle de conception ci-dessous est toujours en place, mais dans la version mise à jour, la surface de la classe publique pourrait être reçue pour une seule.`Memory`point d'entrée; veuillez le voir [CrewAI memory docs](https://docs.crewai.com/concepts/memory)了解当前 API。

- **Short-term。**单次运行内对话缓冲──结束时清空──
- **Long-term。**跨运行持久化──存储在向量DB 中(默认 Chroma,可替换)──按与当前任务的相似度检索──
- **Entity。**按实体 记录事实──Client X est sur le plan d'entreprise. 按实体 keyed, et non pas selon la similarité──跨运行保留──
- **Contextual。**组装时检索──在 Agent 需要时拉取相关记忆,而不是预载──

Dans l' équipage`memory=True`Ou selon le type de configuration  activation 支(par le fournisseur d'embeddings que vous avez configuré 支(默认 OpenAI,可替换为本地)  mémoire est l'un des endroits où CrewAI est comparable à des cadres plus minces  体现价值; Pure LangGraph 需要你自己连接每一种──

### 什么时候适合 CrewAI

- Trois à six agents, rôle et collaboration de travail.
- Le LLM est la structure de la mise en route des valeurs pour les décisions relatives à l'étape suivante.
- 团队更愿意读 `role + goal + backstory`, au lieu de lire la définition du graphique des scénarios.

### 什么时候不适合 CrewAI

- 带严格顺序的确定性 DAGs──使用LangGraph(Lesson 13)──la forme du graphique est une vraie abstraction;
- 亚秒级延迟预算──hierarchical 会增加回路旅行──即使序列化也会包含背景故事和前输出的提示──
- Les boucles à agent unique, le cadre de saut, une boucle d'agent, lecteur 1 - Registre d'outils, plus court.

Leçon 17 (Lecture 17 ((Agent Framework Tradeoffs) avec Matrix) ont démontré ce point.

### Forme de dépendance

独立于LangChain──Python 3.10 à 3.13──使用 `uv`Le nombre d'étoiles:[crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)(à compter de 2026-205), AWS Bedrock intégration a des documents; les benchmarks des fournisseurs  rapport de son travail en charge de QA en comparaison avec LangGraph ont une vitesse de croissance significative, mais les méthodes de calcul de l'ensemble de données, du matériel, de l'évaluation métriques) ne sont pas publiées, de sorte que les chiffres du cadre-fournisseur ne peuvent servir que de référence de direction;;

### Ce modèle va être en jeu.

- **Backstories 导致 prompt-bloat。**Chaque agent un article de 2000 mots, recommencez à utiliser cinq mots, l'équipe de l'agent, sera dans le premier outil appelée pré brûler le budget de contexte, laissez les histoires de fond contrôler 200 mots.
- **Manager-LLM token tax。**Processus hiérarchique Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque appel spécialisé Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois Réunion à chaque fois
- **Brittle handoffs。**Tâche N `expected_output`C'est un contour. La tâche N+1 La mettre en œuvre.`context`读取,并尝试 parse 三个节目──LLM 生成四个──下游 Agent 即兴处理──修复方式是任务 N 上使用 `output_pydantic`,让Task N+1 读取 typeé objet, plutôt que texte libre.
- **Crew-as-prod。**Liberté de forme Crew en situation de non-enveloppe de flux est publié à la production。 sortie variabilité élevée; impossible à reproduire; sur appel 无法 différer 一次坏运行和一次好运行。 avec Flow 包起来。


```figure
ae-crew-vs-flow
```

## - Je le construis.

`code/main.py`Il y a deux versions de stdlib, ainsi qu'une équipe de trois agents.

形态:

- `Agent`- Je suis là.`Task`Les classes de données correspondent à la surface de l'Equipage.
- `SequentialCrew.kickoff(inputs)`按声明顺序运行任务,并把输出 作为 `context`Le référencement
- `HierarchicalCrew.kickoff(topic)` augmenter un agent manager, choisir chaque tour un prochain spécialiste, et  faire  arrêter
- 带 `@start`et `@listen(topic)`décorateurs `Flow`, une petite boucle d'événements, ainsi que des traces.
- `tool(name)`Décorateur, l'image de CrewAI `@tool`forme
- 带 `short_term`- Je suis là.`long_term`- Je suis là.`entity`Les magasins `Memory`; moqué de la similitude Utilisation de numpy。
- Les réponses de la moqueur LLM sont basées sur le rôle, plus les chaînes de code dures de préfixe de saisie clés.

具体 demo:researcher、writer、editor crew,产出一份关于 agent engineering 2026 的简报──Researcher 拉取(mocked)sources──Writer 起草──Editor 收紧──同一个 crew 通过 Flow 运行,以展示决定性形──

Je vais le faire.

```bash
python3 code/main.py
```

Trace 覆盖: équipage séquentiel 通过 `context`串接 output, hiérarchique équipe 带 manager choisit  chercheur 作家 编辑, puis done),flow 使用显式话题(`researched`- Je suis là.`drafted`- Je suis là.`edited`)运行同样三步,appels à l'outil 通过 `@tool`路由, ainsi que la mémoire à long terme entre les deux coupes 保存.

La trace d'équipage est en train de se déplacer; le gestionnaire, en principe, peut être réorganisé.

## Utilisez-le

- **CrewAI Flow**Même le flux n'est utilisé qu'une seule fois.`Crew.kickoff()`◊Flow provide de limites d'audit ◊
- **CrewAI Crew (Sequential)**Il est utilisé pour des travaux de collaboration clairs, en particulier les premiers projets et les boucles d'examen.
- **CrewAI Crew (Hierarchical)**Le routage dépend de la sortie et vous avez quatre ou plus de spécialistes à l'aide.
- **LangGraph**(Létion 13) Pour les machines d'état apparentes, résumé durable, ordre strict.
- **AutoGen v0.4**(Létion 14) Pour une synchronisation entre le modèle acteur et l'isolement des défauts.
- **OpenAI Agents SDK**(Létion 16) Pour les premiers produits OpenAI, les remises et les barreaux de garde
- **Claude Agent SDK**(Létion 17) Pour les produits Claude-first, avec des subagents et magasin de séances

##  La publier

`outputs/skill-crew-or-flow.md`Pour une tâche                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          

## 常见坑

- **把 backstory 当作调味。**Il va créer des sorties. Chaque agent test trois variantes. La variante est réelle.
- **跳过 `expected_output`。**没有每个任务的契约,下游任务 会拿到 LLM 产出的任意内容──工作人员 能跑;审计会失败──
- **Memory always-on。**À long terme, chaque opération sera écrite. Le vecteur DB 增长──Retrieval 变杂──Only in fact possède une durabilité, lorsque l'écriture est limitée aux tâches à relever──
- **Manager prompt drift。**Si le routage devient étrange, le verbe sort de la liste.
- **Crews 中 tool side effects。**L'équipage pourrait utiliser plus de fois l'outil que prévu.

## 练习

1. Résumé de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de la équipe de l équipe de la équipe de l équipe de l équipe de l équipe de l équipe de l équipe de l équipe de la équipe de l équipe de l équipe de l équipe de l équipe de la équipe de l équipe de l équipe de l équipe de l équipe de la équipe de l équipe de la équipe de l équipe de l équipe de l équipe de la équipe de l équipe
2. 给船员 添加实体记忆: 关于客户的事实在开关之间 持久化──验证检索 拉取了正确实体──
3. 实现 un processus hiérarchique:manager dans la production de l'écrivain au moins il y a trois paragraphes, refuser de route jusqu'au rédacteur en chef.
4. Pour une recherche sur le web`BaseTool`sous-classe  comparer la forme de la trace avec `@tool`décorateur 版本。
5. 给编辑任务 添加 `output_pydantic=Brief`, parmi lesquels `Brief`Il y a une`title`- Je suis là.`summary`- Je suis là.`sections` faire une tâche d'écrivain 输出 une fois un JSON malformé;验证 CrewAI 在 追踪 中的重复试行为──
6. Lire l'introduction aux docs de l'Equipage de l'Air:`crewai`Quelles garanties ont été franchies ?
7. Vous avez oublié de quoi vous avez parlé ?

## 关键术语

| Term | 大家常说 | 实际含义 |
|------|----------------|------------------------|
| Agent | “Persona” | Role + goal + backstory + tools |
| Task | “工作单元” | Description + expected output + assignee + optional structured output |
| Crew | “Agent team” | Agents + Tasks + Process 的容器 |
| Process | “执行策略” | Sequential / Hierarchical / Consensus（计划中） |
| Flow | “Deterministic workflow” | 事件驱动、代码拥有、可测试 |
| Backstory | “Persona prompt” | Agent 的语气与判断塑造器 |
| `@tool` | “Function tool” | 把函数变成 Agent 可调用 tool 的 decorator |
| `BaseTool` | “Class tool” | 带 args schema、retries、async support 的 class-based tool |
| Entity memory | “Per-entity facts” | 限定到某个 customer / account / issue 的 memory |
| Long-term memory | “Cross-run memory” | 在 kickoffs 之间保留的 vector-backed memory |
| Contextual memory | “Just-in-time retrieval” | Agent 需要时才拉取的 memory |
| Manager LLM | “Router agent” | Hierarchical process 中选择下一个 task 的额外 LLM |
| `expected_output` | “Task contract” | 告诉 Agent（和 audit）要返回什么形态的 string |

## 延伸阅读

- [CrewAI docs introduction](https://docs.crewai.com/en/introduction)Concept et méthode de production
- [CrewAI Flows guide](https://docs.crewai.com/en/concepts/flows)Les événements`@start`- Je suis là.`@listen`
- [CrewAI tools reference](https://docs.crewai.com/en/concepts/tools)- Le numéro de la liste:`@tool`- Je suis là.`BaseTool`、insert kits d'outils
- [CrewAI memory](https://docs.crewai.com/en/concepts/memory): à court terme, à long terme, entité, contexte
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents): multi-agent quand aider, quand pas
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview): alternative à la machine d'État
