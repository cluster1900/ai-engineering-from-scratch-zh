# Mode de pouvoir de l'agent indépendant

> 权限阶梯 de l'examen par action à la ratification de tout 是利用 管控自主代理 无需询问就能做的方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问就能做什么方式. 无需询问的模式. 无需询问的模式. 无需询问的模式. 无需审核的模式. 无需审核方式.`auto` Le mode de contrôle est remplacé par un modèle de classification indépendant  substituant la ratification par action: il examine la mesure avant de la mettre en œuvre et empêche toute mise à niveau dépassant la portée de la demande `max_turns`et `max_budget_usd`强制执行──`auto`La disponibilité dépend du plan, de l'organisation ou de l'activation du modèle et du fournisseurAnthropique a été clairement indiqué, le classifiateur, l'utilisation unique, n'est pas suffisant.

**类型：**Apprendre à apprendre
**语言：**Python(stdlib, deux étapes de simulateur de classification)
**先修要求：**Phase 15 · 01(Agent de long horizon),Phase 15 · 09(Paysage d'agent de codage)
**时间：**Il est 45 minutes.

##  problématique

L'agent de codage autonome de votre ordinateur est une catégorie de sécurité indépendante. L'attaque est l'agent capable d'accéder à tout système de fichiers, réseau, certificats, carte de crédit, feuille de navigateur, terminal ouvert. Bruce Schneier et autres ont déjà fait remarquer ceci: les agents d'utilisation de l'ordinateur ne sont pas une mise à jour de fonctionnalités de chatbots, mais un nouvel outil, avec une nouvelle sorte de risque.

Le système de droits de Claude Code est une réponse anthropographique. Il ne s'agit pas d'un système autonome ou non autonome, mais de six modes de configuration.

Le problème de l'ingénierie est: ce que le système peut capturer, ce qu'il va manquer, et quel modèle doit-il utiliser pour une tâche donnée ?

## 概念

### 六种权限模式

| 模式 | 行为 | 使用场景 |
|---|---|---|
| `plan` | Agent 提出计划；用户批准整个计划；每个动作在执行前都会被审查 | 不熟悉的任务；接近 prod 的代码；第一次在某个 repo 上使用 agent |
| `default` | 在 UI 中标为 “Manual”。Agent 运行动作；对任何“有风险”的动作提示用户（shell exec、destructive operations、network calls） | 大多数交互式 coding sessions |
| `acceptEdits` | 文件写入自动批准；shell exec 和 network calls 仍然提示 | 跨很多文件的 refactoring pass |
| `auto` | 由一个独立的 classifier model 在每个动作运行前审阅它；阻止任何超出请求范围的升级 | 受限 workspace 中的 long-horizon unattended runs |
| `dontAsk` | 从不提示；未被 permission rules 预先批准的动作一律拒绝 | 临时 sandboxes、CI jobs、research scripts |
| `bypassPermissions` | 批准一切 | 文档说明为“只在你愿意丢弃的 ephemeral containers 内使用” |

(Le nom ci-dessus est associé au code Claude.`default`标为 Manuel。)

### Une page pour comprendre le mode automatique

Le mode automatique (en anglais: Auto Mode) est le premier mode de permis de modifier un modèle.

1. **一个独立的 classifier model。**Dans chaque projet d'opération, il est examiné avant de le faire, en fonction de la mission et de la session déclarées, et il est jugé par l'état actuel, et empêché de faire une mise à niveau au-delà de la portée de la demande.
2. **受限的可用性。**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             `auto` dépend de la mise en œuvre du plan  l'organisation  le modèle  le fournisseur 

 budgétaire et le classifiant ne sont pas:

- `max_turns` Une séance  Le nombre total de séances 
- `max_budget_usd` 触发 session 中止的美元上限──
- Limitation du nombre de mouvements de chaque outil (par exemple, pas plus de N fois)`WebFetch`Les appels)

### Le système peut saisir quoi

- Les entrées d'outils sont une injection rapide directe, dont l'injection d'une instruction est une mise en forme de mouvement connu avec risque.
- 重复 Les boucles d'outilsclassificateur peuvent voir l'action N+1 avec l'action N 连续五次几乎相同──
- Pendant la session de la rédaction du document, il y a des commandes de shell apparentes au-delà des limites.

### Le système pourrait rater quoi ?

- **微妙的 prompt injection**Il est possible de modifier le comportement, mais il ne produit pas de mouvement unique marqué.
- **语义层面的不当行为。**Chaque action individuelle semble être sûre, mais la trajectoire de la composition est nocive.
- **通过合法渠道 exfiltration。**Vous allez écrire les données dans vos dossiers, puis...`git push`À la réception publique, il y a une série de mouvements autorisés, mais le problème réside dans leur composition.

### Prévisualisation de la recherche 定位

Le classement est un niveau de protection, et non une solution complète: l'utilisateur doit utiliser le mode automatique avec les budgets, les alloulistes, les espaces de travail isolés et les audits de trajectoire. Les leçons 1216) combinées à l'utilisation.

### Cette échelle est la position dans votre flux de travail

- Mission inconnue:`plan`Le plan de vie est moins cher qu'un mauvais tour.
- 已知 réfacteur:`acceptEdits`Il y a beaucoup de confirmations.
- Exécution de fond non surveillée: seulement si vous avez déjà mesuré le rayon de l' explosion`auto`(pas de certificats, pas de montures de production, pas de sortie de choix)
- Containers éphémères: en contenant seulement, et leurs informations d'identification sont jetables,`dontAsk`- Je suis là .`bypassPermissions`Je peux accepter.

```figure
autonomy-oversight
```

## Utilisez-le

`code/main.py`Mettre un classifiateur d'action-révision 模拟成两阶段管道`auto`模式背后 est un modèle de classifiant indépendant, plutôt que de deux phases de la description du document. La première étape est la règle de mots clés bon marché de l'action proposée; la deuxième étape est un réviseur multi-règle plus lent.

## Je le livre.

`outputs/skill-permission-mode-picker.md`La description des tâches sera adaptée à un modèle de pouvoir correct, à des limites budgétaires et à des besoins de séparation.

## 练习

1. 运行  référencement`code/main.py` Quel type d'action synthétique n'est pas marqué par la phase 1, mais est toujours capturé par la phase 2?

2. 扩展 Étape 1 réglementation, pour capturer une forme connue-mauvaise spécifique, par exemple `curl $ATTACKER/exfil`)── dans l'échantillon d'action bénigne, la taux de faux positifs est mesuré.

3. 阅读 Anthropic's "Comment fonctionne la boucle d'agent" 文档──列出 agent 在 `default`模式下默认触碰的每种外部状态──在无监督运行 `auto`Avant, qu'est-ce qui vous faut pour une porte unique ?

4. 设计一个 24 小时 无监督运行预算:`max_turns`- Je suis là.`max_budget_usd`、pour chaque outil caps、allowlists―说明每个数字的理由―

5. 描述一个轨迹: chacun d'entre eux est classé 批准, mais les comportements de la combinaison sont mal alignés.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|---|---|---|
| 权限模式 | “agent 能做多少事” | 控制逐动作批准的六种命名 policy 之一 |
| plan mode | “做任何事前都询问” | Agent 编写计划；用户在执行前批准 |
| acceptEdits | “让它写文件” | 文件写入自动批准；shell exec 仍然提示 |
| auto | “Auto approvals” | 独立的 classifier model 审阅每个动作；阻止超出请求范围的升级 |
| bypassPermissions | “Full YOLO” | 批准一切；预期用于 ephemeral containers |
| Stage 1（simulator） | “Fast keyword check” | `code/main.py` 中针对拟议动作的廉价 rule |
| Stage 2（simulator） | “Deep review” | `code/main.py` 中针对被标记动作的更慢 multi-rule reviewer |
| Research preview | “Not GA” | Anthropic 对 failure mode 仍在被映射的功能所使用的定位 |

## 延伸阅读

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 权限模式、预算、action format。
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) service géré 执行模型。
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code) surface de fonctionnalité avec l'annonce de mode automatique
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 塑造分类器 判断的基于理性的层──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于 la conception de permis de long horizon
