# AutoGen v0.4: Modèle d'acteur et cadre d'agent

> AutoGen v0.4 (Microsoft Research, janvier 2025) autour du modèle d'acteur 重新设计了代理配套化──Async message exchange、evenement driven agents、fault isolation、自然并发── Le cadre est maintenant en mode maintenance, tandis que Microsoft Agent Framework (preview public d'octobre 2025) est en train de devenir son successeur──

**类型：**apprendre + construire
**语言：**Python (stdlib)
**先修：**Phase 14 · 01 (loculier d'agent), phase 14 · 12 (modèles de flux de travail)
**时间：**À environ 75 minutes.

## Objectif de l'apprentissage

- 描述 actor model:agent 作为演员,message is unique IPC,每个演员 独立隔离故障──
- Il est possible de décrire les trois niveaux d'API d'AutoGen v0.4:
- Expliquer pourquoi la livraison du message et la manipulation de la solution entraînent l'isolement des défauts et la naturalisation.
- Dans Python, pour réaliser un runtime d'acteur stdlib, il y aura un flux de révision de code de double agent 移植到其上──

##  problématique

La plupart des structures d'agents sont synonymes: un agent produit du contenu, un agent consomme du contenu, fonctionne dans une pile d'appels.

La réponse d'AutoGen v0.4 est: modèle d'acteur. Chaque agent est un acteur possédant une boîte de réception privée. Le message est le seul moyen de communication.

## 概念

### Actors

Un acteur possède:

- Il y a un état privé.
- Une file d'attente de messages
- Un gestionnaire:`receive(message) -> effects`, dont les effets peuvent être envoyés à d'autres acteurs, créer de nouveaux acteurs, mettre à jour l'état, arrêter de jouer.

Deux acteurs ne partagent pas leur mémoire. Ils ne peuvent envoyer que des messages.

### AutoGen v0.4 Environ trois niveaux d'API

1. **Core.**Le cadre des acteurs de base.`AgentRuntime`- Je suis là.`Agent`- Je suis là.`Message`- Je suis là.`Topic`◊ Échange de messages non synchronisés, basé sur des événements ◊
2. **AgentChat.**面向任务的高层API(替代 v0.2 的可谈话机)`AssistantAgent`- Je suis là.`UserProxyAgent`- Je suis là.`RoundRobinGroupChat`- Je suis là.`SelectorGroupChat`Il y a une autre.
3. **Extensions.**集成:OpenAI、Anthropic、Azure、tools、memory。

### Pourquoi le détail est important

Dans la version 0.2, les modèles sont modifiés.`agent_a.chat(agent_b)`L'agent sera bloqué jusqu'à ce qu'il revienne.`send(agent_b, msg)`J'ai mis le message dans la boîte de réception de l'agent, puis je le retourne immédiatement.

- **Fault isolation.**L'agent B ne s'effondre pas, l'agent A ne s'effondre pas, le temps de fonctionnement, il va capturer le gestionnaire de B et décider comment traiter le logement.
- **自然并发。**Il y a beaucoup de messages qui peuvent être envoyés en même temps.
- **面向分布式。**Qu'il soit acteur en cours ou dans une autre salle d'accueil, la boîte de réception + le transport sont tous les mêmes.

### 拓

- **RoundRobinGroupChat.**Agents à l'ordre fixe de la rotation
- **SelectorGroupChat.**Agents sélecteurs selon le contexte de la conversation 选择下一位。
- **Magentic-One.**Utilisé pour la navigation sur le Web, l'exécution de code, la gestion de fichiers, l'équipe de référence multi-agents, construit sur AgentChat.

### C'est une expérience

内置支持 OpenTelemetry── chaque message 都会发发出一个跨度;appel d'outil 根据2026 OTel GenAI conventions sémantiques(Léction 23)携带 `gen_ai.*`Les attributs

### 状态: mode de maintenance

Début 2026: AutoGen v0.7.x pour la recherche et le prototypage pour dire est stable. Microsoft 已将积极发展 转向 Microsoft Agent Framework (2025 年 10 月 1 日 预览公众;1.0 GA 目标为 2026 年 Q1 末) ⋅ AutoGen pattern 可以干净地向前移植,acteur model 是持久的思想──


```figure
actor-mailbox
```

## - Je le construis.

`code/main.py` réaliser un jeu d'acteur stdlib:

- `Message`Avec`sender`- Je suis là.`recipient`- Je suis là.`topic`- Je suis là.`body`La charge utile de type de type de type de charge de type de type de type de type de type de charge de type de type de type de type de type de type de charge de type de type de type de type de type de type de type de type de type de charge de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de type de
- `Actor`Avec`receive(message, runtime)`Le résumé.
- `Runtime`:带有共享 queue、delivery、fault isolation de la boucle d'événements
- Une démo de deux acteurs:`ReviewerAgent`code de révision,`ChecklistAgent`运行 checklist; ils échangent des messages jusqu'à ce qu'un consensus soit atteint.

运行:

```
python3 code/main.py
```

Trace meetings montre la diffusion de messages, un acteur ne permettra pas à un autre acteur de faire l'effondrement, ainsi que le processus de leur accès au verdict commun.

## Utilisez-le

- **AutoGen v0.4/v0.7**(maintenance): adaptation à la recherche, au prototypage, aux modèles multi-agents,
- **Microsoft Agent Framework**(prévisualisation publique): futurouthar; similaire acteur-modèle 思想,刷新后的API。
- **LangGraph swarm topology**(Létion 13): par le biais de la communication partagée d'outils, réaliser un modèle similaire.
- **Custom actor runtime**Quand vous avez besoin d'un transport spécifique (NATS, RabbitMQ, GRPC)

## Je le livre.

`outputs/skill-actor-runtime.md`Une tâche multi-agent spécifique entraîne un minimum de temps d'exécution d'acteurs et un modèle d'équipe (RoundRobin ou Selector).

## 练习

1. Ajouter la file d'attente: quand le gestionnaire lance un message d'échec, arrête de le mettre en place pour un contrôle artificiel. Dans ton jouet, DLC sera attaqué une fois ?
2.  réaliser `SelectorGroupChat`: un acteur sélecteur selon l'état de conversation 选择谁处理下一条条消息。
3. 添加分布式运输:把 in-process queue 替换为 JSON-over-HTTP server,让演员可以运行在独立进程中──
4. Pour chaque message, il est nécessaire de passer à l'OTel ou de ne pas opérer.`gen_ai.agent.name`- Je suis là.`gen_ai.operation.name`Il y a une autre.
5. Lire l'article d'architecture d'AutoGen v0.4 ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                                                                                                                                                                                `autogen_core`Qu'est-ce que tu as oublié dans la production ?

## 关键术语

| 术语 | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Actor | "Agent" | 私有 state + inbox + handler；没有共享 memory |
| Message | "Event" | 类型化 payload；actor 交互的唯一方式 |
| Inbox | "Mailbox" | 每个 actor 的 pending message queue |
| Runtime | "Agent host" | 路由 message 并隔离失败的 event loop |
| Topic | "Channel" | actor 之间命名的 publish-subscribe route |
| Fault isolation | "Let it crash" | 一个 actor 失败不会让其他 actor 崩溃 |
| RoundRobinGroupChat | "固定轮转 team" | Agent 按顺序轮流行动 |
| SelectorGroupChat | "按 context 路由的 team" | Selector 选择下一位 |
| Magentic-One | "参考 team" | 用于 web + code + files 的 multi-agent squad |

## 延伸阅读

- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) redessination 文章
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) Alternative en forme de graphe
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) Autogénération 默认发射跨度
