# Parallèle / Architéctures en réseau

> L'analyse de la longueur d'onde de l'environnement est une méthode de calcul de la longueur d'onde de l'échantillon de données. La longueur d'onde est une méthode de calcul de la longueur d'onde de l'échantillon de données.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`, `queue`)
**前置要求：**La phase 16 · 05 (pattern supervisor), la phase 16 · 04 (modèle primitif)
**Time:** ~75 minutes

##  problématique
Le superviseur peut s'étendre à quelques travailleurs. Il devient lui-même un bouteilleur.

Les architectures de la foule ont changé de conception. Ce n'est pas un planificateur central qui distribue les travaux, mais les travailleurs qui effectuent les travaux de la file d'attente partagée.

## 概念
### La forme

```
                ┌──── shared queue ────┐
                │                      │
       ┌────────┼────────┐  ◄──────┬───┘
       ▼        ▼        ▼         │
     Worker  Worker  Worker   Worker
      A       B       C        D
       │        │        │         │
       └────────┴────────┴─────────┘
                 │
                 ▼
            results pool
```

没有 orchestrator──每个工人反复执行:拉取一个任务,处理,写入结果(并可选地 enquire follow-ups)──

### Quand l' essaim se passe

- **许多独立 tasks。**Le grattage, la transformation, la classification, les tâches ne dépendent pas les unes des autres.
- **可变时长的工作。**Si certaines tâches nécessitent 100 ms, d'autres 10s, les équipes vont équilibrer automatiquement la charge.
- **Throughput 优先于 determinism。**Vous vous souciez du temps de finition, pas de la commande stricte.

### Quand l' essaim échoue

- **有序 workflows。**Si l'étape 3 需要的步骤2,swarm可能让步3 在步2 完成前触发──
- **Global-plan tasks。**complexes questions de recherche 受益于规划者── un essaim de chercheurs 会产出独立事实, et non un rapport régulier──
- **Debugging。**没有中央日志 且工作 异步时,复现 bug 成本很高──

### Les données de l'équipe de gestion des données doivent être fournies à l'utilisateur.

Matrix est un article de 2025, il va s'envahir                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               

贡献: un modèle de programmation, dont la coordination multi-agents est  cet agent 订阅哪个消息主题?, plutôt que 监督下一步选择哪个代理?

### L'architecture de la masse de LangGraph

LangGraph 2025 docs 明确将"Swarm Architecture" 描述为多代理模式 之一:agents are nodes, but edges 形成带周期的导向图,并且任何节点都可以从池中被激活──Worker 根据条件从可用工作中选择,而不是由监督任务指派──

### Mode d'échec: famine et hotspotting

Si tous les travailleurs ont la tâche la plus rapide possible, les tâches de longue durée jusqu'à ce qu'il ne reste plus qu'à ce moment-là seront prises.

Les atténuations:
- 带显式老龄化的优先排列 (随着等待时间) 提高优先排列)
- Spécialisation des travailleurs: certains travailleurs ne reçoivent que des tâches "longues".
- Pressure de retour: limite d'entrée dans la file d'attente des tâches rapides

### Le lien de routage basé sur le contenu

Swarm et le routage basé sur le contenu (leçon 22)


```figure
sw-work-stealing
```

## - Je le construis.
`code/main.py` réaliser un essaim de 4 fils de travailleurs  composés de ces fils, ils partagent `queue.Queue`Les tâches ont des durées variables (à la fois rapides et lentes).

- **Sequential baseline:**Un ouvrier traite toutes les tâches.
- **Fixed assignment:**Chaque tâche est préalablement attribuée à un travailleur spécifique (en style de superviseur).
- **Swarm:**Les travailleurs de la file d'attente partagée

Swarm va équilibrer automatiquement la charge; affectation fixe Va être dans une tâche assignée 很慢时让快工 置──

Je vais courir .

```
python3 code/main.py
```

Le résultat de chaque travail est le nombre de tâches de chaque travailleur.

## Utilisez-le
`outputs/skill-swarm-fit.md`évaluer une tâche  devrait utiliser un essaim ou un superviseur。Inputs: indépendance de la tâche、variance de durée、exigences de commande、 besoins de débogage¬tion。

## Je le livre.
Liste de contrôle:

- **带 aging 的 Priority queue。**éviter la faim à long terme.
- **Worker idempotency。**Si un travailleur s'effondre au milieu de la course, une tâche peut être déployée plusieurs fois.
- **Durable queue。**生产环境使用 Kafka、Redis Streams ou file d'attente soutenue par la base de données。`queue.Queue`                                                                                                                                                                                                                                                              
- **每个 task 的 observability。**Chaque tâche a une trace d'identité; chaque travailleur en a un enregistrement de début et de fin.
- **Back-pressure。**Si la file d'attente augmente rapidement que les travailleurs se déchargent, elle ralentit le producteur.

## 练习
1. 运行  référencement`code/main.py`◊ Dans la charge de travail à durée variable, le nombre de fois par rapport à la séquence 快多少?
2. 添加一个优先排列变体(使用 `queue.PriorityQueue`)── par champ "importance" de la tâche, par priorité, par partage.
3. 实现 un détecteur de points chauds: lorsque tout travailleur 处理的任务数量达到最慢工作者的 3× 时记录日志──
4. 阅读Matrix paper (arXiv:2511.21686) 摘要 和 Section 3──识别Matrix 接受一个具体交易️scalability gain) 以及它放弃一个交易️scalability、determinism) ──
5. 将 swarm demo 改为使用由 (type de tâche, charge utile) tuples 组成 `queue.Queue`Les travailleurs ne peuvent se contenter de souscrire à des types spécifiques.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Swarm architecture | "Decentralized agents" | Workers 从 shared queue 中拉取；没有 central orchestrator。 |
| Event bus | "Agents subscribe to topics" | 按 type 或 content 将 tasks 路由给 workers 的 message broker。 |
| Starvation | "Task never runs" | 因为 higher-priority work 持续到达，low-priority task 永远不会被选中。 |
| Hot-spotting | "One worker drowns" | 一个 worker 获得大多数 tasks 的 load imbalance。 |
| Back-pressure | "Slow down the producer" | 当 queue 填满时，向 upstream 发出停止生产信号的 mechanism。 |
| Idempotent worker | "Safe to re-run" | 一个 task 被处理两次会产生相同 result。因为 workers 可能在 mid-run 崩溃，所以这是必需的。 |
| Durable queue | "Survives crashes" | 由 disk 或 replicated storage 支持的 queue；worker 崩溃时 tasks 不会丢失。 |
| Matrix framework | "Full message-passing swarm" | Data 和 control flow 都是在 distributed queues 上的 serialized messages。 |

## 延伸阅读
- [LangGraph workflows and agents — Swarm Architecture](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 明确支持群
- [Matrix — A Decentralized Framework for Multi-Agent Systems](https://arxiv.org/abs/2511.21686) 完整 message-passage essaim
- [Anthropic engineering — why supervisor not swarm in Research](https://www.anthropic.com/engineering/multi-agent-research-system)Pourquoi un système de production spécifique ?
- [AutoGen v0.4 actor-model docs](https://microsoft.github.io/autogen/stable/) réécriture d'acteurs axés sur les événements,比 v0.2 的 GroupChat 更接近群群
