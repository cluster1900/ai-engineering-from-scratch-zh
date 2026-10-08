# Des modèles de flux de travail:简单优于复杂

> Schluntz et Zhang ont distingué les flux de travail entre les agents et les flux de travail.

**类型：**apprendre + construire
**语言：**Python (stdlib)
**先修要求：**Phase 14 · 01 (loupage de l'agent)
**时间：**À environ 60 minutes.

## Objectif de l'apprentissage

- Il existe cinq modèles de flux de travail: chaîne de travail rapide, routage, parallélisation, orchestrateur-travailleur, évaluateur-optimisateur.
- Expliquer la différence entre les agents et les flux de travail, ainsi que leurs coûts de construction respectifs.
- 识别何时选择工作流而不是 agent (反之亦然)
- Utiliser des méthodes de gestion de la gestion des risques pour réaliser les cinq types de processus.

##  problématique

Le coût est réel: les cadres augmenteront de niveau, couvriront les demandes, cacheront le flux de contrôle, et induiront une complication précoce.

## 概念

### Flux de travail par rapport aux agents

- **Workflow。**通過预定义代码路径编排的 LLM 和工具──工程师 拥有图──
- **Agent。**Les LLM 动态 diriger leurs propres outils并采取自己的步骤──Model 拥有图──

Les deux sont adaptés à des situations. Les flux de travail sont plus faciles à déboguer. Les agents peuvent résoudre des problèmes ouverts, mais les modes d'échec sont plus difficiles à déboguer.

### MLL augmenté

五种模式的基础:一个LLM 接入三种能力 搜索(retrieval) 、工具(actions) 、memory(persistence) ∼ Tout appel à l'API peut utiliser ces capacités。

### 五种模式

1. **Prompt chaining。**Les sorties de l'appel 1 sont utilisées comme sorties de l'appel 2 pour des tâches qui se décomposent clairement.

2. **Routing。**Classifiateur LLM  choisi à utiliser en aval LLM ou outil── s'applique à des catégories de données distinctes et nécessitant des méthodes de traitement différentes dans les situations de support de niveau 1 contre remboursement contre bugs contre ventes)──

3. **Parallelization。**Il s'agit d'une série de programmes de formation en sciences de l'information et de formation en sciences de l'information.

4. **Orchestrator-workers。**L'orchestre LLM 动态决定运行哪些工人(同样是LLM),并综合它们的输出──类似的代理循环,但乐队员 不会无限循环──

5. **Evaluator-optimizer。**Une LLM  proposer une réponse, une autre LLM  évaluer elle.

### Flux de travail 胜过代理的地方

- **可预测任务。**Si tu peux mettre des étapes, tu devrais les mettre.
- **受成本约束的任务。**Les flux de travail ont un certain nombre de phases; les agents peuvent être inflorescences incontrôlées.
- **受合规约束的任务。**Les auditeurs souhaitent lire le graphique, plutôt que le déduire des trajectoires.

### Les agents ont survécu à des flux de travail

- **开放式研究。**Lorsque la prochaine étape dépend du contenu de la prochaine étape,
- **可变长度任务。**Il faut quelques minutes à quelques heures, des étapes à faire.
- **新领域。**Quand tu ne sais pas encore le vrai flux de travail, explore-le, puis codifie-le.

### Context-engineering 配套内容

"Technique contextuelle efficace pour les agents de l'IA" (Anthropic 2025) a formalisé les disciplines adjacentes: la fenêtre de la série est le budget, pas le contenant.


```figure
workflow-chain
```

## - Je le construis.

`code/main.py` à l' égard `ScriptedLLM`¢ réalisé les cinq modèles de flux de travail:

- `prompt_chain(input, steps)` 顺序执行──
- `route(input, classifier, handlers)` classification + expédition。
- `parallel_vote(prompt, n, aggregator)` 运行 N 次并聚聚合──
- `orchestrator_workers(task, workers)` orchestrateur 选择 workers。
- `evaluator_optimizer(task, proposer, evaluator, max_iter)`Le cycle jusqu'à la traversée.

运行:

```
python3 code/main.py
```

Chaque modèle imprime sa propre trace. Le nombre total de lignes de code de chaque modèle est d'environ 10 à 15 lignes; le coût du cadre est généralement mesuré en plusieurs milliers de lignes.

## Utilisez-le

- La plupart des tâches utilisent des appels API directs.
- 只有当模式 真正需要持久状态(LangGraph) 、演员-modèle concurrence(AutoGen v0.4) 或角色模板(CrewAI) 时才使用框架──
- Si vous voulez utiliser Claude Code 形态、但不想重建时, choisissez Claude Agent SDK。

## Je le livre.

`outputs/skill-workflow-picker.md`Une description de la sélection correcte du modèle de tâche, y compris la rationalisation de la décision, ainsi que des itinéraires de réorganisation des flux de travail.

## 练习

1. Utiliser le seuil de confiance pour réaliser le routage.
2. Je vous en donne .`parallel_vote`Comment se réunissent les électeurs en cas de manque de voix ?
3. Je ne sais pas .`evaluator_optimizer`改成 bandit: à travers les itérations, gardez les meilleurs résultats, de sorte que les bons résultats n'ont pas été couverts par les mauvais résultats.
4. L'équipe de gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion de la gestion
5. 选择你的一个生产功能――绘画出工作流图――统计步骤数――这里代理 真的会更好吗?

## 关键术语

| 术语 | 人们常说什么 | 它实际意味着什么 |
|------|----------------|------------------------|
| Workflow | "预定义 flow" | Engineer 拥有的 LLM 和 tool calls graph |
| Agent | "Autonomous AI" | Model 拥有的 graph；动态 tool direction |
| Augmented LLM | "带 tools 的 LLM" | LLM + search + tools + memory；原子单元 |
| Prompt chaining | "顺序 calls" | call N 的输出是 call N+1 的输入 |
| Routing | "Classifier dispatch" | 选择由哪条 chain/model 处理输入 |
| Parallelization | "Fan out" | N 个并发 calls；通过 sectioning 或 voting 聚合 |
| Orchestrator-workers | "Dispatcher agent" | Orchestrator LLM 动态选择 specialist LLMs |
| Evaluator-optimizer | "Proposer + judge" | 迭代直到 evaluator 通过；Self-Refine 的泛化 |

## 延伸阅读

- [Anthropic, Building Effective Agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) 五种工作流程模式
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) 配套方法
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) graphiques d'état, 何時值其成本
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) 产品化的 modèle des ouvriers-orchestreurs
