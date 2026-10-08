# LangGraph:Graphs statiques avec exécution durable

> LangGraph est un standard de référence pour l'orchestration de l'état à bas niveau de 2026[6]. L'agent est un état; les nœuds sont une fonction; les extrémités sont un état transféré; l'état est immuable, et après chaque étape il y a un point de contrôle[6]. Tout défaut peut être effectué à partir d'un interruption.

**类型：**apprendre + construire
**语言：**Python (stdlib)
**先修要求：**Phase 14 · 01 (loculier d'agent), phase 14 · 12 (modèles de flux de travail)
**时间：**- 75 minutes

## Objectif de l'apprentissage

- 描述 LangGraph's core model:带有不变状态、功能节点、条件边和后步检查点的状态机――
- Il est également possible de faire des recherches sur les différents types de données et de les analyser.
- 解释 LangGraph 支持的三种配套类型:supervisor、peer-to-peer (swarm)、hierarchical (subgraphs nés)。
- ¢ réaliser un graphique d'état stdlib, contenant des bords conditionnels et des cycles de point de contrôle/résumé.

##  problématique

Les agents et les flux de travail ont un problème commun: lorsqu'une opération de 40 étapes échoue dans la phase 38, vous souhaitez reprendre la phase 38 au lieu de commencer. Le modèle d'état secondaire permettra aux opérateurs de contourner une hypothèse selon laquelle chaque fois, une nouvelle bibliothèque est en cours de fonctionnement.

La réponse à la conception de LangGraph est: l'état est un objet de type, les mutations sont évidentes, et les points de contrôle seront maintenus après chaque nœud.`load_state(session_id)`Il est très important de le faire.

## 概念

### graphique

Un graphique est défini par la section suivante:

- **State type.**Un dicton typé (ou modèle Pydantic), chaque nœud ville (en anglais)
- **Nodes.**纯函数 `(state) -> state_update`Les mises à jour seront retournées à l'état de l'entreprise.
- **Edges.**Transitions conditionnelles ou directes entre les nœuds.
- **Entry and exit.** `START`et `END`Les nœuds de sentinelle 标记边界。

Example: une contenu `classify`- Je suis là.`refund`- Je suis là.`bug`- Je suis là.`sales`- Je suis là.`done`Agent des nœuds, est un flux de travail de routage de forme graphique.

### Exécution durable

Chaque nœud return 后, runtime 会序列化状态,并将其写入检查点(SQLite、Postgres、Redis、自定义) ⋅`resume(session_id)`,并带带着精确状态 从第 N+1 步继续──

LangGraph 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文档 文文档 文档 文档 文档 文文文文文档 文档 文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文 文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文文

### Retour en continu

Chaque nœud peut produire une sortie partielle. Graphique Résultat vers le flux d'appel par événements de delta de nœud, faire en sorte que l'interface utilisateur puisse être mise à jour dans le graphe.

### Les humains dans le cycle

Dans le nœud critique, avant de s'arrêter, l'état sera montré à l'homme, accepté, puis repris.

### La mémoire

À court terme (à travers l'historique de la conversation) et à long terme (à travers l'historique de la conversation)

### 3 types de topologies

1. **Supervisor.**Le routeur central LLM est distribué aux subagents spécialisés.`langgraph-supervisor`Le centre`create_supervisor()`(Le groupe LangChain propose en 2026 de passer directement par des appels d'outils pour faire, afin d'obtenir un meilleur contrôle du contexte)
2. **Swarm / peer-to-peer.**Les agents passent par la surface de l'outil partagé, et se détachent directement.
3. **Hierarchical.**Superviseurs 管理 sub-superviseurs,以 nichées sous-graphes 实现──

### Ce mode est facile à faire

- **Checkpoints too small.**La conversation du point de contrôle tourne 会让工具状态 和 无法恢复的记忆写着―― 完全状态必须可序列化――
- **Non-deterministic nodes.**Résumé  présupposer les entrées de nœuds Va produire la même mise à jour d'état― Les graines aléatoires―mural-horloge―des API externes doivent être capturées―
- **Over-use of conditional edges.**Chaque bord est un graphique conditionnel, un état indéniable.


```figure
langgraph-state
```

## - Je le construis.

`code/main.py`实现 un graphique d'état stdlib:

- `State`: un dicton de type, contenant `messages`- Je suis là.`step`- Je suis là.`route`- Je suis là.`output`- Je suis là.`human_approval`Il y a une autre.
- `Node`: Recevoir état et retourner à la mise à jour dictation de l'appel.
- `StateGraph`:nodes + bordes + bordes conditionnelles + course + résumé。
- `SQLiteCheckpointer`(fals en mémoire): dans chaque nœud 后序列化 état;`load(session_id)`La réparation
- Un graphique de démonstration:classifier -> branche(refund / bug / ventes) -> porte humaine -> envoyer。

Je vais le faire.

```
python3 code/main.py
```

Trace 会 montre la première opération dans la porte humaine 失败、完成持久化, puis reprendre et produire la sortie finale。

## Utilisez-le

- **LangGraph**: pour réaliser, prêt à la production, usage`create_react_agent`- Je suis là.`create_supervisor`, ou construire votre propre graphique.
- **AutoGen v0.4**(Létion 14): adapté aux scénarios de concurrence élevée.
- **Claude Agent SDK**(Létion 17): Harness géré de la boutique de séances intégrée.
- **Custom**: lorsque vous avez besoin de la forme de l'état ou de l'arrière-plan du point de contrôle  effectuer un contrôle précis en utilisant

## Je le livre.

`outputs/skill-state-graph.md`会在任意目标运行时 中生成一个LangGraph-shaped state graph,并接好检查点与复习──

## 练习

1. Lorsque la confiance en la classification est inférieure à la valeur,`classify`添加一条 bord conditionné jusqu' à `end`                                                                                                                                                                                                                                                              `route`后复习 运行。
2. Pour remplacer un faux SQLite par un vrai point de contrôle SQLite, mesurer chaque étape de la sérialisation.
3. 实现 bordes parallèles: deux nœuds并发运行,并通过自定义减轻器 合并──Immutable state 在这里带来了什么?
4. 阅读 `langgraph-supervisor`référence.`create_supervisor`❖ Comparer les traces de forme
5. 添加流: chaque nœud dans la fonctionnement rend l'état partiel──打印到达的デルタ──

## 关键术语

| Term | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| State graph | “Agent 即状态机” | Typed state + nodes + edges + reducers |
| Checkpointer | “Persistence backend” | 在每个 node 后序列化 state；支持 resume |
| Reducer | “State merger” | 将当前 state 与 node update 组合起来的函数 |
| Conditional edge | “Branch” | 由 state 函数选择的 edge |
| Subgraph | “Nested graph” | 作为另一个 graph 中 node 使用的 graph |
| Durable execution | “从失败处 resume” | 使用精确 state 从最后一个成功 node 重启 |
| Supervisor | “Router LLM” | 面向 specialist subagents 的 central dispatcher |
| Swarm | “P2P agents” | Agents 通过 shared tools hand off；没有 central router |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Documents de référence
- [langgraph-supervisor reference](https://reference.langchain.com/python/langgraph/supervisor/) API de modèle de surveillance
- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) acteur-modèle 替代方案
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) magasin de séances et sous-bagents
