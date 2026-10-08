# Budgets d'action, plafonds d'itération et gouvernorats des coûts

> 某中型电子商务代理 的月度 LLM 成本,在团队启动"tracking de la commande" compétence 后,从 $1,200 跳到了 $4,800── ce n'est pas un bug de prix── c'est un agent  trouvé un nouveau cycle, et il continue dans le cycle ‒ Microsoft's Agent Governance Toolkit ‒ est standardisé pour lutter contre ce type de problèmes:`max_tokens`、 chaque tâche de jetons 和美元 budget、 limite de jour/mois de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de limite de 10 minutes en plus de 10 minutes.

**Type:** Learn
**Languages:** Python (stdlib, layered cost-governor simulator)
**先修要求：**Phase 15 · 10 (modalités d'autorisation), phase 15 · 12 (exécution durable)
**Time:** ~60 minutes

##  problématique

Chaque tour d'agents autonomes va dépenser de l'argent réel. Le mauvais sort d'un chatbot est un mauvais retour. Le mauvais cycle d'un agent est un compte.

La méthode de réparation n'est pas un chiffre, mais un ensemble de limites de différentes échelles et de grilles de temps: chaque requête, chaque tâche, chaque heure, chaque jour, chaque mois. Une bonne conception permet de capturer un cycle déconstruit en quelques minutes, de capturer une fuite lente en quelques heures, de capturer une mauvaise publication en une journée.

Ceci est une partie de l'ingénierie: maths est simple, le nombre de défaites de l'équipe est en règle.

## 概念

### gouverneur des coûts 

1. **每次请求的 `max_tokens`。**简单―― empêcher toute utilisation unique de produire une fin sans frontières――
2. **每个任务的 Token 预算。**Dans le processus de fonctionnement, il faut dépasser N 个 Token── jusqu'à ce que la limite de temps soit atteinte.
3. **每个任务的美元预算。**Avec des jetons similaires, mais unités sont des devises.`max_budget_usd`Il y a une autre.
4. **每个工具调用上限。**N' excède N fois `WebFetch`Je suis en train de faire une petite fête.`shell_exec`Il est aussi un "coup de poudre".
5. **Iteration cap (`max_turns`)。**Le nombre total de cycles d'agents; empêcher le cycle de la proposition illimitée.
6. **每分钟 / 每小时 / 每天 / 每月上限。**滚动窗口── utilisé pour saisir les fuites dans différentes échelles de temps──
7. **财务速度限制。**Par exemple, si le coût de 10 minutes dépasse 50 dollars, coupez la visite.
8. **分层 model routing。**默认使用更小的模型; seulement lorsque le classifiateur 判断任务值得时才升级到更大的模型──
9. **Prompt caching。**Le système prompt 和 stabilisation contexte existant dans le cache du fournisseur; Récupérer des jetons 成本接近零──
10. **Context windowing。**通过缩写/总结 把活文本 保持在值以下;直接降低 Token 成本。
11. **昂贵操作上的 HITL checkpoints。**Avant d'avoir une opération déjà coûteuse, il faut une confirmation artificielle.
12. **预算违约时的 kill switch。**任一上限触发时会议 中止──记录触发的上限; nécessite un chemin de redémarrage séparé──

### Pourquoi avoir besoin de plus, plutôt que de limiter un seul

Le seul limite de contrôle ne peut être atteint qu'après le dépôt du sac de monnaie.

- **失控循环**(agent 卡在 5 秒重试中): par la limite de vitesse de saisir.
- **缓慢泄漏**(agent a fait environ 2 fois chaque tâche  prévue travail):
- **糟糕发布**(New Version using 5x Token): de chaque semaine / chaque mois
- **合法激增**(true besoin, pas bug):由小时 / 天上限抓住,并产生清晰日志。

### Surface budgétaire du code Claude

Claude Code Agent SDK 暴露了(公开文档):

- `max_turns` cap d'itération。
- `max_budget_usd` 美元上限;违约时会议 中止──
- `allowed_tools`- Je suis là .`disallowed_tools` 工具 Allowlist 和 denylist。
- 工具使用前的点, utilisé pour le calcul des coûts auto-définisés

Avec l'échelle en mode autorisation (leçon 10)`max_budget_usd``autoMode`La session est une autonomie non gouvernée.

### Loi sur l'IA de l'UE ŒUASP Top 10

Le programme de gestion des agents de Microsoft couvre le Top 10 des agents de l'OWASP et la Loi sur l'IA de l'UE Article 14 de la Loi sur l'IA.

###  observé $1,200 → $4 800 cas

Un cas réel dans le dossier Microsoft: un agent de commerce électronique a ajouté de nouveaux outils, le coût mensuel a doublé de trois fois. Cet outil permet à l'agent de consulter l'état des commandes en chaque session. Il n'y a pas de cycle de vérification. Il n'y a pas de limite pour chaque outil. Il n'y a pas de limite pour chaque semaine.


```figure
cost-governor-stack
```

## Utilisez-le

`code/main.py`模拟一个有层次成本管理员堆 和没有该的代理 运行――模拟中的代理 在几个轮后漂移进轮询循环;层次堆将在速度窗口内抓住它,而单个个月度上限只需几天后才触发――

## Je le livre.

`outputs/skill-agent-budget-audit.md`审计一个拟议代理 部署的成本-governor stack,并标记缺失层――

## 练习

1. 运行  référencement`code/main.py` Confirmer sur le circuit de la rotation, la limite de vitesse a été précédée par le cap d'itération 触发──

2. Pour les agents de navigation, quelle est la limite la plus stricte ? quel est l'outil qui peut fonctionner sans limite sans risque ?

3. 阅读Microsoft Agent Governance Toolkit 文档――列出工具kit 命名的每种上限类型――把每种映射到某种失败模式――失控循环、缓慢泄漏、糟糕发布、激增) 』

4. Pour une tâche réelle, une course non surveillée sur une nuit, par exemple, un référentiel de 50 émissions.`max_budget_usd`设为点估计的2x. 解释为什么是2x.

5. Claude Code `max_budget_usd`基于 session 聚合成本触发──设计一个你会在外部执行的互补速度限制──什么会触发切断,重新启动是什么样子?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|---|---|---|
| Denial of Wallet | "Runaway bill" | agent 循环产生花费，并且没有上限阻止它 |
| max_tokens | "Per-request cap" | 单个 completion 大小的上限 |
| max_turns | "Iteration cap" | 一个 session 中 agent loop 迭代次数的上限 |
| max_budget_usd | "Dollar kill switch" | session 成本上限；违约时中止 |
| Velocity limit | "Rate cap" | 短窗口内花费的限制（例如，$50 / 10 min） |
| Tiered routing | "Small model first" | 默认使用便宜 model；只有 classifier 判断值得时才升级 |
| Prompt caching | "Cached system prompt" | provider 侧 cache 将重发 Token 成本降到接近零 |
| HITL checkpoint | "Human approval gate" | 昂贵操作前需要人工确认 |

## 延伸阅读

- [Anthropic Claude Code Agent SDK — agent loop and budgets](https://code.claude.com/docs/en/agent-sdk/agent-loop) `max_turns`- Je suis là.`max_budget_usd`、 les outils autorisés¬
- [Microsoft Agent Framework — human-in-the-loop 与治理](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) gouverneur des coûts 检查点。
- [Anthropic — Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) fournisseur 侧成本控制──
- [Anthropic — Prompt caching (Claude API docs)](https://platform.claude.com/docs/en/prompt-caching) mécanisme de mise en cache 
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) coûts des agents à long horizon
