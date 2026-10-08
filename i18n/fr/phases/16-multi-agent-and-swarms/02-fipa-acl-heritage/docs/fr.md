# La FIPA-ACL et les actes de discours

> Avant le MCP, avant l'A2A, il y avait la FIPA-ACL. En 2000, la Fondation pour les agents physiques intelligents de l'IEEE a approuvé un langage de communication d'agent, qui comprenait vingt langues performatives, deux langues de contenu, ainsi qu'un ensemble de protocoles d'interaction: contrat net, abonnement/avis, demande-quand. Il est donc sorti de l'industrie, parce que l'ontologie est devenue trop lourde, mais les systèmes multi-agents propulsés par le LLM sont en train de réappliquer l'idée, il n'y a plus de sémantique formelle: contrats JSON, prenez des performances, le langage naturel, remplacer les ontologies.

**Type:** 学习
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 01（Why Multi-Agent）
**Time:** ~60 分钟

##  problématique

Le protocole d'agents de 2026 est très fréquent: il est utilisé pour les MCP d'outils, il est utilisé pour les A2A d'agents, il est utilisé pour l'audit des entreprises, il est utilisé pour les ACP de décentralisation des croyances, il est utilisé pour les NLIP de contenu en langage naturel, il y a plus de 20 propositions de recherche sur le MCP CA, et chaque spécification se déclare fondée sur la base de ses propres propositions.

En effet, la plupart d'entre eux ont redécouvert un arbre de décision très concret, qui a déjà eu une histoire de deux décennies. La théorie du discours-acte d'Austin (1962) et de Searle (1969) nous a donné des éclaircissements sur les actions.

Quand tu vois MCP `tools/call`、Le cycle de vie des tâches d'A2A, ou le stockage de contexte partagé de CA-MCP, vous voyez une sorte de récapitulation plus souple de la décision FIPA 、JSON-native.

## 概念

### Uzal一段话 comprendre Les actes de la parole

Austin note que certaines phrases ne sont pas dans la description du monde, mais dans le changement du monde. Je promets.                                                                                                                                                                                                                                                 

### Deuxièmement, les performances de la FIPA

| Performative | Intent |
|---|---|
| `inform` | “我告诉你 P 为真” |
| `request` | “我请求你执行 X” |
| `query-if` | “P 是否为真？” |
| `query-ref` | “X 的值是什么？” |
| `propose` | “我提议我们执行 X” |
| `accept-proposal` | “我接受该 proposal” |
| `reject-proposal` | “我拒绝该 proposal” |
| `agree` | “我同意执行 X” |
| `refuse` | “我拒绝执行 X” |
| `confirm` | “我确认 P 为真” |
| `disconfirm` | “我否认 P” |
| `not-understood` | “你的 message 无法 parse” |
| `cfp` | “针对 X 发出 proposals 征集” |
| `subscribe` | “当 X 变化时通知我” |
| `cancel` | “取消正在进行的 X” |
| `failure` | “我尝试了 X，但失败了” |

完整列表在 `fipa00037.pdf`(FIPA ACL Message Structure) 中──重点不是记住它,而是每一个这些内容,都对应 LLM protocole 最终会重新添加一个原始──

### 规范的 FIPA-ACL message

```
(inform
  :sender       agent1@platform
  :receiver     agent2@platform
  :content      "((price IBM 83))"
  :language     SL0
  :ontology     finance
  :protocol     fipa-request
  :conversation-id   conv-42
  :reply-with   msg-17
)
```

七个字段承载 protocole enveloppe;一个字段(`content`) Portez la charge utile. Le reste est que vous faites des essais de retrait, de retrait et d'ontologie.

### ∆ Deux plateformes anciennes

**JADE**(Java Agent Development framework, 19992020s) est l'utilisation la plus large de la durée de fonctionnement conforme à la FIPA.

**JACK**(Software orienté aux agents, commerce) souligne les BDI de FIPA 之上的信願意推理──更形式化, mais adopter更少──

Les deux sont en pile de web et les cas d'utilisation multi-agents sont en train de s'effondrer.

### Pourquoi la FIPA est-elle en panne ?

- **Ontology 开销。**FIPA 要求使用共享 ontology 来 parse `content`就 ontologies 达成一致是一个历时数年的标准化过程──web 只是使用HTTP + JSON──
- **没人使用的 formal semantics。**SL (Language sémantique) a fourni des conditions de vérité strictes, mais la plupart des systèmes de production utilisent du contenu sous forme libre,并忽略形式主義──
- **Tooling lock-in。**JADE supporte seulement Java; Jack est un produit commercial.
- **internet 赢下了 stack。**REST, puis JSON-RPC, puis gRPC, remplacé le transport de l'ACL.

### LLM 复兴是 FIPA-lite

Comparer à une FIPA `request`Avec un MCP`tools/call`- Le numéro de la liste:

```
(request                                {
  :sender  agent1                         "jsonrpc": "2.0",
  :receiver tool-server                   "method":  "tools/call",
  :content "(lookup stock IBM)"           "params":  {"name":"lookup_stock",
  :ontology finance                                   "arguments":{"symbol":"IBM"}},
  :conversation-id c42                    "id": 42
)                                        }
```

Les deux sont des concepts différents, qui ne sont pas révolutionnaires, mais des compromis différents.

L'enquête de 2025 de Liu et coll. ((A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP, arXiv:2505.02279) indique clairement cette tradition: MCP à la résolution des actes de parole utilisant des outils, A2A à la résolution des actes de parole par les agents, ACP à la résolution des actes de parole de suivi d'audit, ANP à la résolution des extensions d'identité décentralisée― Les nouvelles spécifications sont les dernières générations de l'ACL, qui ont simplement adopté la syntaxe JSON et une sémantique plus large―

### Directement indiqué l'offre

**FIPA 给了你、而现代 specs 放弃的东西：**

- La sémantique formelle: vous pouvez prouver`inform`Il faut que l'expéditeur croie au contenu.
- Une règle de performance: tu n'as pas à redébatter si on devrait en avoir une`cancel`- Je suis désolé.
- Des modèles d'interaction-protocole de plusieurs décennies: contract-net, subscrivez-notifier, proposer-accepter, et ont des propriétés de précision connues.

**现代 specs 给了你、而 FIPA 没有的东西：**

- Avec toutes les charges utiles natives de JSON compatibles avec tous les outils modernes.
- Les LLM                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
- Le transport de la pile Web (http, SSE, WebSocket)
- 通过实时的MCP `server/discover`Avec carte d'agent A2A  pour effectuer la détection de capacités 

La sémantique des intentions plus large, la réalisation plus facile.

### Protocols d'interaction à transférer

La FIPA comporte environ 15 protocoles d'interaction.

1. **Contract Net Protocol (CNP)。**Directeur 发出 `cfp`(appel à propositions); soumissionnaires UZ `propose`响应;manager 接受/拒绝──这是规范的任务市场模式(Phase 16 · 16 négociation)
2. **Subscribe/Notify。**Abonnés 发送 `subscribe`; éditeur dans le sujet 变化时发送 `inform`C'est le bus de chaque événement de l'année 2026.
3. **Request-When。**当条件 Y 成立时执行 X──带预条件的延迟行动──2026 年的模拟是耐久工作流引擎中的延迟任务(Phase 16 · 22 Production Scaling)──

Chacun d'entre eux peut être clairement diffusé dans les files d'attente de messages modernes, les sondages HTTP+ ou le streaming SSE.

###  abandonner l' ontologie   après ça ça va se poser

 sans ontologie partagée, les agents                                                                                                                                                                                                                                                          **semantic drift**Deux agents utilisant le même mot`"customer"`) indique un concept légèrement différent, l'agent du destinataire 按误解行动, alors qu'aucun validateur de schéma 能捕获它──FIPA ontologie 要求会在解析时间 拒绝这个消息──

La méthode de réduction de la pollution par les eaux de l'eau

- `content`Schéma JSON: dans le fil de la couche rejeter l'erreur de structure.
- Type d'artisanat: refus d'erreur de modalité
- Enveloppe 中的显式表演: même si le contenu est un langage naturel, il peut aussi faire l'objet d'une intention 明确无歧义。

### 2026 spécifications 映射到 du patrimoine de la parole et de l'acte

| Modern spec | FIPA analog | What it keeps | What it drops |
|---|---|---|---|
| MCP `tools/call` | `request` | explicit intent、correlation id | formal semantics、ontology |
| MCP `resources/read` | `query-ref` | explicit intent、correlation id | formal semantics |
| A2A Task lifecycle | contract-net + request-when | async lifecycle、state transitions | formal completeness guarantees |
| A2A streaming events | subscribe/notify | async push | typed-predicate subscription |
| CA-MCP shared context | blackboard（Hayes-Roth 1985） | multi-writer shared memory | logical consistency model |
| NLIP | natural-language content | LLM-native | schema |

De haut en bas, cette liste est suivie: conserver la structure primitive, abandonner le formalisme, laisser les LLM occuper les différences.


```figure
sw-contract-net
```

## - Je le construis.

`code/main.py`实现 un pur-stdlib FIPA-ACL traducteur──它编码和码规范的ACL包,并展示每种MCP / A2A message shape 如何归约为同样七个字段──这个演示:

- Générer 5 articles des messages de style MCP et A2A 编码为FIPA-ACL。
- La FIPA-ACL est une société de l'économie de marché.
- Utilisation `cfp`- Je suis là.`propose`- Je suis là.`accept-proposal`- Je suis là.`reject-proposal`, entre un gestionnaire et trois soumissionnaires , une négociation de contrat en ligne ,

运行:

```
python3 code/main.py
```

输出 est une trace côte à côte, montrant chaque message moderne de 2026 JSON 形式和 FIPA-ACL 形式, puis montrant une fois le voyage-retour de l'offre de réseau de contrat.

## Utilisez-le

`outputs/skill-fipa-mapper.md`C'est une compétence, elle va lire les spécifications de protocole d'agent et générer des cartes FIPA-ACL.`inform`- Je suis désolé.

## Je le livre.

Ne ramène pas le FIPA-ACL.

- Qu'est-ce que le message a pour but primitif ?
- Y a-t-il une correlation entre la réponse à la demande et l'annulation ?
- Y a-t-il un langage de contenu explicite ?
- Les protocoles d'interaction sont de première classe, ou vous êtes en train de réélaborer le contrat-net ?
- Quand deux agents ont une différence significative entre le contenu et la dérive sémantique, qu'est-ce qui se passe ?

Avant de mettre en production tout nouveau protocole, enregistrez ces cinq questions.

## 练习

1. 运行  référencement`code/main.py` Observer le codage aller-retour  Identifier les performances de l'API `tools/call`- Je suis là.`resources/read`Et la création de tâches A2A.
2. Avec un .`cancel`• une démonstration de performance  élargir le réseau de contrat, permettre au gestionnaire de retirer la tâche au cours du processus de soumission `cancel`- J'ai résolu des tentatives récurrentes.
3. 阅读 FIPA ACL Structure de message de l'ACLhttp://www.fipa.org/specs/fipa00037/）第4.14.3 节──选择一个本课未覆盖的执行,并描述它的现代 JSON-RPC analogue──
4. 阅读 Liu et al., arXiv:2505.02279──分别针对 MCP、A2A、ACP、ANP,列出它们保留和放弃的FIPA执行家族──
5. Pour toi dans ton propre système`request``content`字段设计一个最小的JSON-Schema── Comparé au langage purement naturel, ce schéma 给你什么,又带来了什么成本?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Speech act | “一种会做事的 utterance” | Austin/Searle：把 utterances 视为 actions。ACL 的理论源头。 |
| FIPA | “那个老 XML 东西” | IEEE Foundation for Intelligent Physical Agents。2000 年标准化了 ACL。 |
| ACL | “Agent Communication Language” | FIPA 的 envelope format：performative + content + metadata。 |
| Performative | “那个动词” | 一条 message 的 intent class：`inform`、`request`、`propose`、`cfp` 等。 |
| KQML | “FIPA 的前身” | Knowledge Query and Manipulation Language（1993）。更简单，范围更窄。 |
| Ontology | “共享词汇表” | 对 content language 所谈论概念的 formal definition。 |
| SL0 / SL1 | “FIPA content languages” | Semantic Language levels 0 and 1，即 formal content language family。 |
| Contract Net | “Task market” | Manager 发出 cfp；bidders propose；manager accepts。规范的 interaction protocol。 |
| Interaction protocol | “Messages 的模式” | 一组具有已知 correctness 的 performatives 序列：request-when、subscribe-notify 等。 |

## 延伸阅读
- [Liu et al. — A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP](https://arxiv.org/html/2505.02279v1) La mise en œuvre des spécifications modernes et l'étude du patrimoine de la FIPA                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
- [FIPA ACL Message Structure Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) Format de enveloppe de l'année 2000
- [FIPA Communicative Act Library Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) 完整的表演目录
- [MCP specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) `request`- Je suis là.`query-ref`La mise en œuvre des outils et des services
- [A2A specification](https://a2a-protocol.org/latest/specification/) contrat-net 和 abonnement-notification de l'agent moderne-peer 等价形式
