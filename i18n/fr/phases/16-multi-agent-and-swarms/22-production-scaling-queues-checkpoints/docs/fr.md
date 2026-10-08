# Produit de la production  队列、Checkpoints、Durabilité

> Les systèmes multi-agents doivent être étendus à des milliers de systèmes de déploiement.**durable execution**◊ L'heure de fonctionnement de LangGraph 会在每一个超级步骤 后写入一个由 `thread_id`标识的检查点(默认使用 Postgres);travail 崩会释租,另一个工会接手恢复──Agentes peuvent faire une pause illimitée, attendre une entrée artificielle──**MegaAgent**(arXiv:2408.09955) 运行一个按代理 划分的生产者消费者队列,包含三种状态 (Idle / Processing / Response) 和两层协调 (组内聊天 + 组间管理聊天)**Fiber/async**优于线程-per-jobs:threads 99% du temps sont dans l'air, tandis que les fibres 会在 I/O 上协作式让出.**FastAPI + Postgres + nothing else**, simple architecture qui va plus loin que prévu. Cette classe construira un journal de contrôle durable, une file de travail par agent avec changement d'état, une démo asynchrone contre fil, et se déplace en réalité.

**Type:** Learn + Build
**Languages:** Python (stdlib, `asyncio`, `sqlite3`)
**前置要求：**Phase 16 · 09 (réseaux parallèles de masse), phase 16 · 13 (mémoire partagée)
**Time:** ~75 minutes

##  problématique

Un prototype de système multi-agent sur un ordinateur portable, avec trois agents et une boucle d'événements en mémoire, fonctionne normalement.

- Les agents ont des heures de travail.
- Les processus de travail seront effondrés.
- La charge de pointe est 10 fois plus élevée que la charge moyenne; vous avez besoin d'une expansion du niveau.
- Utilisateur par agent-run 付费; vous devez utiliser la sémantique de calcul exactement une fois.

En-memory event loop  Impossible de traiter ces problèmes. Vous devez ajouter une couche d'exécution durable à la base.

1. 带 checkpoints ⋅ moteur de flux de travail ⋅ Temporal、LongGraph runtime)
2. 带 state store 的消息队列(Postgres + SQS/RabbitMQ)
3. Les cadres de modèle acteur (mégaagent)
4. Hand写 FastAPI + Postgres(Bedi's point de vue)。

Cette classe construira une version micro de chaque programme.

## 概念

### Exécution durable, ce modèle

Le moteur d'exécution durable 会在每一个"步骤" (en anglais: "étape supérieure")

```
worker crashes mid-step
  -> lease timeout
  -> another worker picks up the thread_id
  -> resumes from last checkpoint
  -> no duplicate side effects
```

Pour le faire fonctionner, il faut satisfaire:

- **Serializable state。**Tout état d'agent doit être durable. Avec des connexions de base de données en temps réel, les fermetures de fonction ne peuvent pas survivre.
- **Deterministic resume。**∆ déterminer le même état et les mêmes entrées, l'agent va produire les mêmes actions  ou va faire des appels LLM 委托给外部决定学 Oracle) 
- **Idempotent side effects。**Les appels externes (appels à l'outil, paiements) doivent être idempotents ou utiliser une clé de dédoublement.

LangGraph dans chaque super-étape 后写检查点;Temporal在每个活动 后写;Restate 使用事件来源期刊──三者实现的是同一个模式──

### Temps de fonctionnement de LangGraph

Chaque agent a un.`thread_id`;l'état est typé dict; chaque super-étape est dirigée vers la table des points de contrôle 写入一行。恢复时,runtime 继续,而不是从头开始──agents 可以`interrupt()`Pour attendre l'entrée artificielle; temps de fonctionnement:

C'est une conception de production de référence pour le mois d'avril 2026.

### L'affluence par agent de MegaAgent

arXiv:2408.09955  décrit une expérience à grande échelle: un cluster avec des milliers d'agents et des émissions.

```
agent i:
  state ∈ {Idle, Processing, Response}
  in_queue   <- messages addressed to agent i
  out_queue  -> replies + side effects

coordinators:
  intra-group chat  (agents in the same group)
  inter-group admin chat  (high-level routing)
```

Les deux niveaux de coordination permettent à la conversation de se produire à haute densité, tandis que la conversation se maintient rare.

### Asynchrony par rapport au fil par travail

Les appels LLM sont I/O-bound. Attendre le prochain fil de jeton 99% du temps sont vides. Chaque fil consomme environ 1 Mo de RAM.

Les fibres de Python`asyncio`Allez les routines, rouille`tokio`En même temps, 10 000 appels peuvent être facilement intégrés dans un processus.

Exception: le post-traitement lié au processeur de processeur (implémentation, tokenizer, techniques) nécessite encore des fils ou des processus.

### Le point de vue opposé de Bedi

"Scaling Agentic Software" (Ashpreet Bedi, 2026) estime que la plupart des équipes ont déjà été surchargées de la quantité de données:

- Rapide et postgradué.
- Chaque agent est en cours d'exécution.
- - Je suis là.`pg_notify`Ou simplement travailleur de la cave à sucre  exécuter des emplois de fond 
- Dans le code de l'application, la politique de retrait est mise en œuvre.

Pour moins de 100 opérations de mise en service, la charge de mission est généralement suffisante.

La règle est la suivante: lorsque vous rencontrez un problème spécifique que l'architecture simple ne peut pas résoudre, reprenez les cadres d'exécution durables.

### Une sémantique unique

Pour les opérations d'agent de paiement, vous avez besoin d'une "livraison effective une fois exactement" (au moins une fois)

- **每个 run 一个 dedup key。**Dans chaque appel d'effet secondaire, il est inclus.
- **Outbox pattern。**Les effets secondaires sont d'abord inscrits dans un tableau, puis réalisés par un processus indépendant.
- **Compensating transactions。**Lorsque l'effet secondaire réussit mais le suivi écrit 失败时, arranger une opération de réparation.

Ce sont des modèles d'ingénierie de base de données, pas spécifiques à la LLM.

### Déploiement de l'arc-en-ciel

Système de recherche multi-agents d'Anthropic utilise "déploiements arc-en-ciel": plusieurs agents runtime  version并发运行, de sorte que les agents running de longue durée n'ont pas besoin d'être tués lors de chaque déploiement de code ⋅对一小部分流量

C'est la pratique standard des systèmes à long terme; le point de mise en place en 2026 est que les agents peuvent survivre pendant plusieurs heures, donc les cycles de déploiement doivent être compatibles.

### 典型生产 liste de contrôle

- État durable ((checkpoints、phrases, ou boîte de sortie + journal jouable)
- Effets indésirables indéfectibles:
- Utilisé pour les appels LLM de couche I/O asynchronous.
- La livraison au moins une fois.
- 面向 stateful workloads 面向 rainbow/canary déploiement 面向 stateful workloads 面向 rainbow/canary déploiement 面向
- Observabilité: traces par agent, audits super-étape, compteur de retrait.


```figure
sw-checkpoint-replay
```

## - Je le construis.

`code/main.py`实现:

- `CheckpointStore` Log de point de contrôle supporté par SQLite, utilisez les touches de fil-id。 chaque super-étape 追加一行。
- `run_with_checkpoint(agent, thread_id)` 模拟中期崩; deuxième travailleur du dernier point de contrôle 恢复。
- `AgentQueue` par agent Machine d'état d'ouverture / traitement / réponse, avec une petite file de travail
- `demo_async_vs_threads()` 通过asyncio 和 threads 运行 500 个并发模拟 "appels LLM"; rapport mural-horloge 和 mémoire de pointe(近似)

运行:

```
python3 code/main.py
```

预期输出:模拟崩后检查点恢复 成功;async version 在 < 1s 内处理 500 个并发电话;thread version 需要几秒,并且每个并发单元使用的内存 高出数量级──

## Utilisez-le

`outputs/skill-scaling-advisor.md`会根据 load、state-retention 需求和部署 频率, recommend durable-execution 选择:FastAPI + Postgres、LangGraph runtime、Temporal or custom。

##  La publier

典型生产加固:

- **从简单开始（Bedi 的规则）。**Utilisez FastAPI + Postgres, jusqu'à ce que vous le trouviez échoué.
- **在优化之前 instrument everything。**Histogramme de latence par exécution, temps par étape, compte de retrait, catégorisation des défaillances.
- **为 side effects 使用 outbox pattern。**Œspecifiquement les paiements et les appels à l'API externes.
- **Rainbow deploys。**Pendant le déploiement, ne tuez jamais les agents en vol.
- **当你遇到具体问题时采用 durable-execution engines（Temporal / LangGraph / Restate）：**Une heure d'attente de l'homme en cycle, une coordination interrégionale, des politiques de réessayer/compensation complexes.
- **I/O layer 使用 async。**Les fils ne sont utilisés que pour le post-traitement lié au processeur.

## 练习

1. 运行  référencement`code/main.py` Confirmer le résumé de l'examen 生效; mesure l'asynchrony par rapport à la synchronyme du fil 差异──
2.  réaliser un **outbox**Tableau: Chaque appel à outil avant de l'écrire dans la boîte de réception, puis de la seule routine/tâche à exécuter.
3. 模拟一个 **rainbow deploy**Deux versions de mise en service ont été lancées; la moitié des nouveaux threads seront transférés dans leur version; les threads de la version précédente seront confirmés.
4. 阅读下面链接中的 LangGraph runtime doc――识别 runtime 中哪些功能在手写FastAPI + Postgres 版本中最耗时――这是采用它的理由,还是可以延迟吗?
5. 阅读MegaAgent (arXiv:2408.09955) Section 3──两层协调(intra-group + intergroup admin chat) est évident──画出你会如何将它映射到带两类队列家庭的消息队列──

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| Durable execution | "Persist the program state" | Engine 在每个 super-step 后写入 state；crash recovery 是 deterministic 的。 |
| Super-step | "Transactional boundary" | Checkpoints 之间的 work unit。LangGraph 术语。 |
| thread_id | "Agent run identifier" | 绑定 checkpoints 和 resume logic 的 key。 |
| Idempotency | "Safe to retry" | 重复一个 side effect 产生的结果与一次尝试相同。 |
| Outbox pattern | "Decouple side effects" | 将 intent 写入 table；独立 executor 执行并标记完成。 |
| At-least-once delivery | "Possible duplicates" | Message queue semantics；dedup key 让 consumer 达到 effective-once。 |
| Rainbow deploy | "Overlapping versions" | 长时间运行 workloads 期间多个 runtime versions 并发存在。 |
| Async fiber | "Cooperative yielding" | User-mode concurrency；对于 I/O-bound loads，相比 threads 成本很低。 |
| Checkpoint | "State snapshot" | super-step 边界处的 serialized state；是 resume 的 key。 |

## 延伸阅读

- [LangChain — The runtime behind production deep agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) Conception de l'exécution de LangGraph
- [MegaAgent](https://arxiv.org/abs/2408.09955) Cote de production-consommateur par agent; milliers de agents et des partenaires
- [Matrix](https://arxiv.org/abs/2511.21686) Utiliser les files d'attente de messages 作为协调基层的分散框架
- [Temporal docs](https://docs.temporal.io/) Exécution durable  的 référence moteur de flux de travail
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) Inclure le déploiement de l'arc-en-ciel
