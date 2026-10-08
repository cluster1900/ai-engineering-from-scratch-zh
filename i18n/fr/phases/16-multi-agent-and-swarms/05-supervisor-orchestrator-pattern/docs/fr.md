# Modèle de superviseur / orchestrateur-travailleur

> Un agent principal responsable de la planification et du mandat; des travailleurs spécialisés dans les contextes de mise en œuvre et de répercussion. C'est le modèle de l'Anthropic Research system.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

##  problématique

La recherche est une tâche typique des systèmes à agent unique. Vous demandez: qu'est-ce qui a changé entre 2023 et 2026 ?

Le modèle du superviseur a réussi à résoudre ce problème: un agent principal planifie la recherche, envoie chaque sous-question à un travailleur, puis effectue une synthèse.

Le système de recherche de production de l'anthropique 报告称, dans les évaluations de recherche interne 上相比单一Opus 4 提升 +90.2%。同一篇文章指出,BrowseComp 方差的80% 仅由 *Token usage alone* 解释──每个子方 拥有新文背景是主要机制──

## 概念

### Ce modèle

```
                 ┌──────────────┐
                 │   Lead       │  plans, decomposes,
                 │  (Opus 4)    │  synthesizes
                 └──┬────┬───┬──┘
                    │    │   │
            ┌───────┘    │   └───────┐
            ▼            ▼           ▼
      ┌─────────┐  ┌─────────┐  ┌─────────┐
      │ Worker1 │  │ Worker2 │  │ Worker3 │
      │(Sonnet) │  │(Sonnet) │  │(Sonnet) │
      └─────────┘  └─────────┘  └─────────┘
         fresh       fresh        fresh
         context     context      context
```

Le plomb ne lit jamais les matières premières. Les ouvriers ne se voient jamais travailler ensemble avant la synthèse du plomb. Chaque arête est une délivrance d'un artefact étroit.

### Pourquoi ça marche ?

Trois mécanismes:

1. **每个 subagent 都有 fresh context。**L'employé de l'héritage de l'ACL-FIPA ne portera pas de pionnier dans la planification des 40 000 jetons consommés. Il obtient une fenêtre de 200 000 pour résoudre un problème.
2. **通过 prompt 实现 specialization。**Le prompt de lead est de décomposer et de synthétiser, pas de rechercher. Le prompt de chaque travailleur est très restreint: il faut trouver ce qui a changé dans X.
3. **Parallelism。**Les travailleurs ne sont pas en train de travailler.`max(worker_times) + plan + synthesis`, au lieu de `sum(worker_times)`Il y a une autre.

### Les cours d'ingénierie (Anthropic 2025)

Anthropic 文章 énumère quelques articles sur les leçons de production qui resteront pertinentes jusqu'en 2026:

- **Scale effort to query complexity.**简单查询: un agent, 3-10 fois appel à l'outil, 复杂查询, 10+ agents, 必须由领袖 估计这一点,而不是调用者,
- **Broad then narrow.**Il faut d'abord décomposer les questions en sous-questions larges, puis en réponse, il faut une profondeur de temps pour chaque sous-question.
- **Rainbow deployments.**Les agents sont de longue date 且州的──传统蓝绿不适用──Anthropic 使用彩虹:逐步推广 新版本,同时让旧版本排放──
- **Token usage dominates.**Multi-agent, environ 15 fois plus de jetons de l'agent unique.

### LangGraph 转向

LangGraph a d'abord publié une série.`create_supervisor`aide de `langgraph-supervisor`⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ la bibliothèque ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒ ⇒                                                                                                        

### Mode d'échec

- **Lead hallucinates the plan.**Si les sous-questions de la production ne résolvent pas le vrai problème, les travailleurs feront des recherches précises sur des objectifs erronés.
- **Workers over-explore.**Si les limites de portée ne sont pas clairement définies, les travailleurs vont se détourner de leur sous-question et ne pas se détériorer de l'étape de synthèse.
- **Synthesis conflicts.**∆ Deux travailleurs  revenir à des faits contradictoires  Le leader  doit reinterroger  augmenter un tour  ou bien bien bien définir un échec                                                                                                                                                                                                                                          

### Le superviseur est un mauvais choix .

- **Sequential tasks.**Si l'étape 2 确实需要一步的输出,parallélisme 没有收益──使用管道(CrewAI Sequential、LangGraph linear graph)──
- **Simple queries.**Un seul agent les traite plus rapidement et plus facilement.
- **Strict determinism.**Le superviseur utilise une délégation sélectionnée par le LLM.


```figure
supervisor-hierarchy
```

## - Je le construis.

`code/main.py`Utilisation `threading` réaliser un superviseur composé de trois collaborateurs  réaliser une enquête divisée en sous-questions, les travailleurs  traiter chaque sous-question, mener   mener à la synthèse  pas de véritables LLM  les travailleurs  sont scénarisés, pour simuler la recherche et la synthèse 

关键结构:

- `Lead.plan(query)`La requête sera divisée en 3 sous-questions.
- `Worker.run(sub_q)`Retournez un faux résumé de la production.
- `Lead.run(query)`On commence les travaux, on rejoint, on synthétise.

运行:

```
python3 code/main.py
```

Le résultat de la présentation du plan de travail, avec les traces des traces des travailleurs du début/de la fin, ainsi que la synthèse finale, vous pouvez voir le résultat du mur: trois travailleurs de 0,3 secondes ont été achevés en environ 0,35 secondes, et non 0,9 secondes.

## Utilisez-le

`outputs/skill-supervisor-designer.md`接收一个用户查询,并产出监督模式设计:lead system prompt、工人角色、subquestion decomposition rules,以及 synthèse template──在构建新研究风格代理系统 前使用它──

##  La publier

部署 supervisor pattern 前 のチェックリスト:

- **Model pairing.**Le modèle de niveau de raisonnement de la classe Opus`o3`Les travailleurs utilisent un modèle plus rapide, plus abordable.`o4-mini`)。
- **Worker timeout.** Tout ouvrier qui dépasse 2 fois la durée moyenne de son travail sera tué; conduire ou utiliser un champ plus restreint, ou continuer en l'absence de son propre champ.
- **Token cap per worker.**Limite dure (par exemple 10 fois l'entrée de synthèse prévue) empêcher le travailleur en fuite de débourser son budget
- **Observability.**Trace le plan de la piste, les appels à l'outil de chaque travailleur, ainsi que la synthèse. C'est la base de tout débogage post-hoc.
- **Rainbow rollout.**Les agents de longue date de l'État ont besoin de transition progressive de la version, plutôt que d'échange chaud.

## 练习

1. 运行  référencement`code/main.py`, puis modifier le plomb, de sorte qu'il génère 5 travailleurs et non 3 ∙∙ Observer l'effet du mur-horloge ∙ Dans cette démonstration, le nombre de travailleurs jusqu'à combien de fois la charge de production dépassera les économies parallèles ?
2. 实现 worker timeout: tuer 任何运行超过0.5秒的 worker,并让引合成 剩余结果――你需要什么可观察性 才能知道某个 worker被切断?
3. 给 lead 合成 添加冲突检测步骤: si deux travailleurs 返回相互矛盾的答案, lead 标注分歧, plutôt que de choisir l'un de ces deux.
4. 阅读Anthropic's Research-system engineering post──列出这个玩具演示必须在生产中运行需要采纳的三项实践──
5. Comparer avec LangGraph`create_supervisor`Pourquoi l'anthropique ne fait-il que transmettre des sous-réactions dans le contexte des travailleurs plutôt que dans le contexte des travailleurs ?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Supervisor | “Lead agent” | 一个 orchestrator agent，负责规划、委派和 synthesis。它不亲自执行工作。 |
| Worker | “Subagent” | 由 supervisor 以狭窄 scope 调用的 focused agent，并拥有自己的 context window。 |
| Orchestrator-worker | “Supervisor pattern” | 同一件事，不同名称。2026 文献两种说法都会使用。 |
| Fresh context | “Clean window” | Worker 的 context 从它的 system prompt 和分配的问题开始，而不是 lead 的 history。 |
| Rainbow deployment | “Gradual rollout” | Long-running stateful agents 需要 versioned drain-and-replace，而不是 blue-green。 |
| Token dominance | “Context is the variable” | 根据 Anthropic，research-eval 方差的 80% 来自使用的总 Tokens，而不是 model choice。 |
| Scale effort | “Match agent count to complexity” | Lead 估算 query 难度，并据此生成 1 个或 10+ workers。 |
| Synthesis conflict | “Workers disagree” | 两个 workers 返回互相矛盾的 facts；lead 必须暴露分歧，而不是默默选择一方。 |

## 延伸阅读
- [Anthropic engineering — 我们如何构建 multi-agent 研究系统](https://www.anthropic.com/engineering/multi-agent-research-system) modèle de production de la surveillance
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) outil-appel superviseur 现在是推形式
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor) assistant héréditaire, production en 2026
- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents)                                                                                                                                                                                                                                                              
