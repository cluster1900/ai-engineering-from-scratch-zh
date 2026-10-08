# Temps de production: file d'attente, événement, chronologie

> L'agent de production 运行在六种运行时形上:request-response、streaming、durable execution、queue-based background、event-driven 和 scheduled──先选择形,再选择 framework──Observability 在每种形中都是载荷──

**类型：**Apprendre à apprendre
**语言：**Python (stdlib)
**先修要求：**La phase 14 · 13 (graphe longitudinale), la phase 14 · 22 (voix)
**时间：**- 60 minutes

## Objectif de l'apprentissage

- Il existe six formes de production, et chaque forme correspond à un modèle de cadre/produit.
- Expliquer pourquoi une exécution durable (LangGraph) est très importante pour une tâche à long terme.
- 描述 événement-driven runtime, ainsi que Claude Managed Agents 适用场景──
- Expliquer l'agent à plusieurs étapes en fonction de l'observabilité.

##  problématique

Le mode de défaillance de l'agent de production, est le bloc-notes Jupyter  exposé  non-exposé:第 37 étape apparaît une panne de temps de réseau, l'utilisateur est suspendu en cours d'appel vocal, le travail de cron est réinitialisé, le travailleur de fond est décédé, la forme du temps de fonctionnement décide quelles défaillances sont récupérables.

## 概念

### Réponse à la demande

- HTTP synchrone.
- Il est seulement adapté pour les tâches courtes.
- 技术:Agno (Python + FastAPI)、Mastra (TypeScript + Express/Hono/Fastify/Koa)。
- Observabilité: standard HTTP log d'accès + OTel span。

### Retour en continu

- Utiliser SSE ou WebSocket pour effectuer une sortie progressive.
- LiveKit sera étendu à WebRTC, pour la voix/vidéo (leçon 22)
- Stack: tout support de streaming de cadre + 能处理 SSE/WS de frontend。
- Observabilité: chaque pièce de temps, latence du premier jeton, latence de la queue.

### Exécution durable

- Chaque étape est suivie par l'état du poste de contrôle; la rétablissement automatique du défaut.
- Le modèle d'acteur d'AutoGen v0.4 va échouer à être séparé d'un seul agent.
- Différences de base de LangGraph (leçon 13)
- Le coût de récupération est très élevé, c'est indispensable.

### Basé sur la file d'attente / arrière-plan

- Travail en ligne, employé en ligne, résultat par le biais d'un lien Web ou d'un pub/sub
- Pour chaque tâche, il y a quelques dizaines à quelques centaines de pas, voir l'annonce d'utilisation de l'ordinateur d'Anthropic)
- Stack:Celery (Python)、BullMQ (Node)、SQS + Lambda (AWS)、custom。
- Observabilité: profondeur de file d'attente, répartition de la latence de chaque travail, taille de la DLQ,

### Événements

- Agent 订阅 déclencheur: nouveau courriel PR ouvert cron feu 
- Claude Gestionné les agents 开箱即支持这一点 (Léction 17)
- Flux d'IAC de l'équipe (leçon 15) utilisé pour organiser un flux de travail déterministe axé sur les événements.
- Observabilité: source de déclenchement, latence de démarrage de l'événement, latence de l'agent.

### Les programmes

- 周期性运行的cron-formed agent。
- Avec une exécution durable, l'utilisation de cette fonctionnalité peut être rétablie la prochaine fois.
- 技术:Kubernetes CronJob + cadre durable;托管方案(Render cron、Vercel cron)

### Modèle de déploiement 2026

- **CrewAI Flows**Utilisé pour la production axée sur les événements.
- **Agno**FastAPI sans état utilise le microservice Python.
- **Mastra**L'adaptateur serveur(Express、Hono、Fastify、Koa) est utilisé pour l'intégration。
- **Pipecat Cloud / LiveKit Cloud**Avec une voix gérée (leçon 22)
- **Claude Managed Agents**Utilisé pour une synchronisation à long terme.

### La capacité d'observation est de support

Si vous n'avez pas de générateur de téléphonie ouverte (leçon 23) et de backend Langfuse/Phoenix/Opik (leçon 24), vous ne pouvez pas tester un agent multi-étape qui a échoué à la 40e étape.

### Temps de production 失败的位置

- **选错 shape。**Pour un 5 minutes tâche de sélection de requête-réponse.
- **没有 DLQ。**Le travailleur de filet 没有死字――失败的工作会消失――
- **不透明的 background work。**Avant le problème de l'utilisateur, les défaites sont invisibles.
- **跳过 durable state。**Tout ce qui dépasse 30 secondes, et vous ne pouvez pas supporter de redémarrer, nécessite une exécution durable.


```figure
wb-runtime-shapes
```

## - Je le construis.

`code/main.py`C'est une démo multi-forme de stdlib:

- Point final de requête-réponse (普通函数)
- Gestionnaire de diffusion
- Travailleur en file d'attente de la DLQ.
- Registre de déclenchement d'événement.
- Schedulateur en forme de Cron。

运行:

```bash
python3 code/main.py
```

输出: 五条 痕迹, montrer la même tâche dans chaque forme 下的行为── le même logique d'agent, différentes coquilles extérieures── exécution durable(第六种形) 已有意放在中课13通过LangGraph checkpointing 讲解──

## Utilisez-le

- **Request-response**UX au style du chat.
- **Streaming**Il est utilisé pour une réponse progressive.
- **Durable**Pour une tâche à long terme.
- **Queue**Utilisé par lots / asynchronous / à long terme.
- **Event**Utilisé pour la réactivité de l'agent.
- **Cron**Il est utilisé pour la maintenance de la mémoire, la consolidation de la mémoire, le rapport de coûts.

##  La publier

`outputs/skill-runtime-shape.md`会为一个任务 选择运行时间形状,并连接可观测性要求──

## 练习

1. Retourner à la pile de vos six formes. Quelle forme s'adapte à quelle surface de produit ?
2. 给排列式演示 添加DLQ──模拟10% de défaillance de travail; exposer la taille du DLQ──
3. Rédiger un agent d'évaluation à la chronologie, chaque soir pour les 20 meilleurs résultats de la journée.
4. 实现带压力的流媒体: si le client est lent, alors il est suspendu.
5. Lire Claude Gestion des agents Docs... quand allez-vous installer un agent à long horizon ?

## 关键术语

| 术语 | 人们怎么说 | 实际含义 |
|------|------------|----------|
| Request-response | “Synchronous” | 用户等待；只适合短任务 |
| Streaming | “SSE / WS” | Progressive output；更好的 UX；每个 chunk 的 latency 可观察 |
| Durable execution | “Resume from failure” | Checkpointed state；从最后一步 restart |
| Queue-based | “Background jobs” | Producer / worker pool / DLQ |
| Event-driven | “Trigger-based” | Agent 对 external event 作出反应 |
| DLQ | “Dead-letter queue” | 失败 job 的停车场 |
| Claude Managed Agents | “Hosted harness” | Anthropic-hosted long-running async，带 caching + compaction |

## 延伸阅读

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Exécution durable 细节
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) Asynchronisation à long terme de la gestion
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use)  chaque tâche 几十到几百步
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) Isolement des défauts du modèle acteur
