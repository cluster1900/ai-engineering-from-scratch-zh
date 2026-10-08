# L'homme dans le cycle: proposer puis s'engager

> 2026 ann ann annonce de l'HITL est spécifique. Il n'est pas agent 发问, utilisateur cliquez sur Approve── il est proposer-then-commit: proposée action 会连同无权关 持久化到可久存储; 意图、数据系、许可触及、爆射和滚动计划 呈现给评论家; 只有在明确确认后才 commit; 执行后再验证,确认副作用 确实发生──`interrupt()`Ajouter le point de contrôle PostgreSQL, Microsoft Agent Framework`RequestInfoEvent`, ainsi que Cloudflare `waitForApproval()`Il s'agit d'un mode d'échec typique: approuver le timbre de caoutchouc: approuver; pas de révision.

**Type:** 学习
**Languages:** Python (stdlib，带 idempotency 的 propose-then-commit state machine)
**前置要求：**La phase 15 · 12 (exécution durable), la phase 15 · 14 (filtre)
**Time:** ~60 分钟

##  problématique

L'agent exécute une action ∼ l'utilisateur doit décider: approuver ou non ∼ si la décision est instantanée, il est très probable qu'elle ne soit pas révisée ∼ si la décision est structurée, elle sera plus lente, mais on peut le croire ∼ la question de l'ingénierie est de savoir comment faire en sorte que la révision structurée ∼ soit le chemin le plus court de la résistance ∼

Le modèle HITL des années 2023 est le même:L'agent veut envoyer un courriel à X avec le corps Y approuver?Useruserclick Approuver。 Tout le monde pense que le système est sûr。En pratique, cette interface est très facile à imprimer: l'utilisateur approuve très rapidement, l'approbation 几乎不能预测什么; lorsque l'agent sort à l'erreur, le parcours d'audit montrera une longue série d'utilisateurs déjà oubliés de l'approbation 历史。

Le modèle de 2026 année, qui consiste à proposer-et-committer, à déplacer HITL vers un substrat durable, à ajouter des métadonnées structurées, à exiger un engagement positif.`interrupt()`、Microsoft Agent Framework `RequestInfoEvent`Cloudflare`waitForApproval()` API 名称不同;形态相同──

## 概念

### machine d'État proposant puis engagant

1. **Propose.**L'agent 生成一个拟议的行动──它被持久化到持久存储(PostgreSQL、Redis、Durable Object)──包括:
   - intention ((agent Pourquoi faire ça)
   - L'origine des données a conduit à cette proposition)
   - permissions touchées(哪些 champs / fichiers / points d'extrémité)
   - Le rayon de l'explosion est le pire.
   - Le plan de retour (si vous êtes engagé, comment allons-nous le retirer)
   - clé d' indempotence ((chaque proposition unique;重复提交返回同一条记录)
2. **Surface.**Le réviseur 看到包含全部的 метаданные的提案──Reviewer 是人(不是代理 自己 review 自己)──
3. **Commit.**Il est clair que la décision est prise.
4. **Verify.**执行后,读取并确认副作用──如果验证步骤 失败,系统处于已知坏状态,并触发警报──

### clé d'impuissance

没有 idempotency key 时, transient failure 后后的试可能重复执行已批准的行动――具体例: utilisateur批准转移100$ from A to B──网络短暂动──网络工作流重新尝试──用户只批准一次,但转移 执行两次──idempotency key 将批准 绑定到单个单个副作用;第二次执行是无-op──

Ceci est similaire à Stripe et aux API AWS utilisant le modèle d'idempotence.

### Durable: pourquoi les approbations peuvent durer dans le processus

La salle d'attente d'approbation est un passage non appartenant à l'agent propriétaire. Le flux de travail est suspendu.`interrupt()`Avec PostgreSQL checkpointing 配对, plutôt que uniquement en état de mémoire: deux jours après l'approbation  encore trouver un flux de travail complet 

### Approbation des timbres en caoutchouc et atténuation des défis et des réactions

L'interface utilisateur par défaut de HITL (Approve  / Reject  buttons) générera une approbation rapide, mais pas de révision réelle.

- Vous comprenez cette opération ?
- Vous confirmez le rayon de l'explosion ?
- Si tu échoues, tu as un plan de retour ?

Ceci n'est pas pour le flux et le flux, mais une fonction de contrainte.

### Qu'est-ce qui est conséquent ?

Il n'y a pas de mesures à prendre pour proposer des orientations pour l'année 2026.

- **Consequential actions**(始终 HITL): non-contrast write­in­­­­­, transactions financières­, communication sortante­, changements de base de données de production­, opérations destructives du système de fichiers­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­
- **Reversible actions**(有时 HITL): écrites réversibles de modifications de fichiers locaux, de changements de mise en scène, de rétroaction claire,
- **Reads and inspections**(从不 HITL):读取文件、列出资源、调用仅读API──

### Vérification après l'action

Le déploiement de l'exécution  不等于 l'effet secondaire s'est produit──réseau-partition et conditions de course peuvent permettre le flux de travail et pour lui-même réussit, alors que le backend 实际并没有持续──verifier étape 会在 commit 后重新阅读目标资源以确认──这与使用`RETURNING`Les clauses de la base de données des transactions, ou`PutObject`后执行 AWS `GetObject`C'est le même modèle.

### Loi sur l'IA de l'UE Article 14

Article 14  exigences de l'UE  systèmes d'IA  possédant une surveillance humaine efficace                                                                                                                                                                                                                                                    


```figure
mx-propose-then-commit
```

## Utilisez-le

`code/main.py`Utilisation de Python 实现 une machine d'état proposé-et-committed── durable store est JSON file──Idempotency key 是 (thread_id, action_signature) hash──driver 模拟三种情况:干净的批准流、过渡失败 后复试(必须不能双执行), ainsi que le caoutchouc-stamp par défaut avec le défi-et-réponse flux 对比──

## Je le livre.

`outputs/skill-hitl-design.md`Révision d'un flux de travail proposé HITL y a-t-il ou non un modèle proposé-et-engagé, et il est noté que les méta-données, l'idempotence, la vérification ou les couches de défi et de réponse ont disparu ?

## 练习

1. 运行  référencement`code/main.py` confirmer la proposition approuvée Réessayer d'utiliser un enregistrement durable, et ne pas réexécuter.

2. Utilisation `rollback`champ  élargissement de la proposition enregistrement──模拟一次验证步骤 失败的执行──展示滚动会自动触发──

3. 阅读 Microsoft Agent Framework `RequestInfoEvent`Documents  trouver API incluant mais moteur de jouets  absence d'un champ de métadonnées  ajouter,并解释它的防护风险

4. Pour une action concrète (par exemple, un message sur un compte Twitter public) concevoir une liste de contrôle des défis et réponses.

5. 选择一个同步 批准?快速 足够的场景(不需要持久的店) ――解释原因,并说明你接受的风险类──

## 关键术语
| Term | What people say | What it actually means |
|---|---|---|
| Propose-then-commit | “Two-phase approval” | 持久化 proposal + positive commit + verify |
| Idempotency key | “Retry-safe token” | 每个 proposal 唯一；第二次 execution 为 no-op |
| Data lineage | “Where it came from” | 导致 proposal 的具体 source content |
| Blast radius | “Worst case” | action 出错时的影响范围 |
| Rubber-stamp | “Fast approval” | 没有真正 review 就点击 “Approve” |
| Challenge-and-response | “Forcing checklist” | Reviewer 必须明确确认具体问题 |
| RequestInfoEvent | “MS Agent Framework primitive” | 带结构化 metadata 的 durable HITL request |
| `interrupt()` / `waitForApproval()` | “Framework primitives” | 同一形态的 LangGraph / Cloudflare 等价物 |

## 延伸阅读
- [Microsoft Agent Framework — Human in the loop](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) `RequestInfoEvent`,approbations à durée déterminée,
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) `waitForApproval()`Et les objets durables
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) L'HITL  comme atténuation des risques à long terme 
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/)  高风险系统的监管基线──
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution)  Rencadrement constitutionnel de la surveillance 
