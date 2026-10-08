# Les points de contrôle et les débouchés

> Chaque fois que le graphe-état  transformation  ville sera durable. Lorsque le travailleur  effondrement, son bail  expire, un autre travailleur  prendra contact  saisir   le dernier point de contrôle  saisir   Les objets durables Cloudflare  passeront plusieurs heures ou plusieurs semaines  état de conservation     Propose-then-commit  Leçon 15) pour chaque action définir  plan  rollback                                                                                                                                                                                                                                                                                                                                                                                                                       

**Type:** 学习
**Languages:** Python（stdlib，checkpoint 与 rollback state machine）
**Prerequisites:** Phase 15 · 12（Durable execution），Phase 15 · 15（Propose-then-commit）
**Time:** ~60 分钟

##  problématique

Exécution durable (leçon 12) faire en sorte que l'agent de l'effondrement puisse se rétablir. Proposer-et-commitir (leçon 15) faire en sorte que l'action approuvée soit vérifiable.

Le système réel se connecte à ce mécanisme de différentes manières:

- **LangGraph**Réaliser chaque fois l'état graphique  Transférer le point de contrôle à PostgreSQL Œuvrant  Révacuation, location   Libération, un autre travailleur  Réalisation  Workflow `interrupt()`Il est suspendu, mais il sera lui-même aussi perpétué.
- **Cloudflare Durable Objects**Réservation en fonction de l'état de la répartition de la clé.
- **Microsoft Agent Framework**Dans l' API du flux de travail exposé `Checkpoint`Les premières éditions sont les suivantes:

无论哪种情况,真正有效的组合都是:idempotency key (prévenir la répétition) + précondition check (état est toujours approuvé) + post-action check (effet secondaire) + check-fail (répétition).

## 概念

### Chaque changement est durable

L'état de graphes 转换 (en anglais: graph-state) est un processus de travail qui passe d'un état de nom à un autre état de nom.

### Récupération du bail

Lorsqu'un travailleur s'effondre, le flux de travail ne sera pas perdu; leasing(une déclaration à court terme, indiquant que ce travailleur est en train d'exécuter cette course) est simplement une période de temps.

### Idempotence plus conditions préalables

                                                                                                                                                                                                                                                              $1000 时，从 A 向 B 转账 $100──workflow 已 commit,在执行中崩,然后恢复──如果只检查无效率关键,并且执行恢复,那么转账会运行一次(正确)──但考虑在崩和恢复之间,A's余额通过另一个工作流 降到了500$──idempotency check 仍然通过;前不通过──没有前检查,我们就会制造通过支──

Chaque action ayant des conséquences a besoin de deux choses:

- **Idempotency key**: prévenir la réécration
- **Precondition check**Le statut de confirmation est toujours conforme à celui de l'action approuvée.

### 动作后验证

outil 返回 200不是验证──真正的验证会重新读取目标状态,并确认副作用 确实发生──模式包括:

- Mise à jour de la base de données:`UPDATE ... RETURNING *`, puis affirme que la ligne de retour correspond à l'état prévu.
- Envoi de courrier électronique: soumissionnée dans le dossier envoyé
- Écrire le fichier: read回文件并计算 hash。
- Appel API: à la ressource cible  execution后续 `GET`Il y a une autre.

Si vous ne réussissez pas, le flux de travail est dans un mauvais état.

### Plans de retour

Les projets proposés (leçon 15) comprennent:

- **In-band rollback**: effet secondaire direct`INSERT`后 `DELETE`, envoi après`Send-correction-email`)。
- **Compensating transaction**Une nouvelle action, pour résoudre le problème.
- **Out-of-band rollback**Remettre en garde les humains, suspendre le flux de travail, conserver leur mauvais état pour enquête.

Il n'y a pas de retour en action. Il faut un retour en action.

### Article 14 de la Loi sur l'IA de l'UE

Article 14                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            

- Point de contrôle: vérifié par l'auditeur.
- Le retour à l'arrière est déjà fait.
- Le parcours d'audit 能在部署 后继续存在 (l'arrière-plan du point de contrôle n'est pas éphémère)
- La vérification de l'échec sera touchée par l'alerte, au lieu d'être enregistrée silencieusement.

Un flux de travail Si on commet un accident de travail et que l'on se rétablit sans vérifier le processus de retour, on ne peut pas obtenir l'article 14 de la directive.

### 尖失效模式: répéter l'exécution

Les accidents de production les plus fréquents dans ce domaine sont:

1. L'action est approuvée, clé d'indépendance
2. Commit 開始,执行, retourner 200 ⋅
3. Le flux de travail est en train de s'effondrer.
4. Le flux de travail est rétabli; voir  a été approuvé mais n'a pas été engagé ; reexécuter
5. Effets secondaires

缓解方式: dans l'exécution de l'intention de l'initiation à l'essai, utilisez la clé d'idempotence 执行, puis seulement dans l'essai de réussite après l'opération est marqué comme committed──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────


```figure
checkpoint-replay
```

## Utilisez-le

`code/main.py`实现 un workflow avec un point de contrôle, contenant idempotence, préconditions, vérification et retour à l'emploi.

## Je le livre.

`outputs/skill-rollback-rehearsal.md`Pour le flux de travail proposé  concevoir un test de réaction-répétuation,并审计 checkpoint backend

## 练习

1. 运行  référencement`code/main.py`❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖ ❖

2. Modifier le marqueur comme fait d'abord, puis le faire 模式, faire écrire l'état dans le processus de réaction 场景──测量触发了多少重复动作──

3. Pour un plan de production spécifique, le plan de réouverture (par exemple, un message sur un canal Slack) sera classé en bande intérieure, compensatrice ou hors bande.

4. 选择一个你熟悉的工作流程――识别每一个状态转换――为每一个转换标记耐久性要求(persistent / do not persist)――统计你当前还没有持久化的数量――

5. Test de retour répété: concevoir un test de bout en bout, exécuter un vrai flux de travail, le faire s'effondrer, et confirmer le chemin du retour à l'action 被触发──

## 关键术语

| Term | 人们的说法 | 它真正的含义 |
|---|---|---|
| Checkpoint | “保存点” | 每一次 graph-state 转换都会持久化到 durable store |
| Lease | “Worker 声明” | 短期声明，表示某个 worker 正在执行一个 run；崩溃时过期 |
| Precondition | “状态关卡” | 断言状态仍与已批准动作保持一致 |
| Post-action verify | “重新读取检查” | 确认 side effect 确实在目标系统中发生 |
| In-band rollback | “直接撤销” | 用逆向操作反转 side effect |
| Compensating transaction | “SAGA 撤销” | 一个新的动作，用来抵消原动作 |
| Mark-as-done-first | “状态写入顺序” | 在从 commit 返回前持久化 committed 状态 |
| Article 14 | “EU AI Act 人类监督” | 操作性含义：可查询 checkpoint、已演练 rollback、可审计 trail |

## 延伸阅读

- [Microsoft Agent Framework — Checkpointing and HITL](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) Primitives de points de contrôle et récupération de location 
- [Cloudflare Agents — Human in the loop](https://developers.cloudflare.com/agents/concepts/human-in-the-loop/) Objets durables 作为状态基底──
- [EU AI Act — Article 14: Human oversight](https://artificialintelligenceact.eu/article/14/) 监管基线。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) Cadre de fiabilité du flux de travail à long terme.
- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) Claude Code Routines 形态。
