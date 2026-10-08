# 长时间运行的后台 Agents:持久化执行

> Les agents de production ne seront pas en fonctionnement`while True`Les sessions seront suspendues en attendant l'entrée artificielle, et peuvent continuer à exister après leur déploiement.`thread_id`Pour le dernier point de contrôle de la clé  Rétablissement. Une nouvelle facilité d'utilisation, une ancienne mode  Workflow 编排 编排 只是多一个新的输入:LLM 调用作为不确定性活动,必须在恢复时被确定性重播──

**Type:** Learn
**Languages:** Python (stdlib, minimal durable-execution state machine)
**先修要求：**Phase 15 · 10 (modalités d'autorisation), phase 15 · 01 (agents à long horizon)
**Time:** ~60 minutes

##  problématique

设想一个运行四小时的代理――它调用三个工具,两个提示用户,并进行四十次的LLM 调用――运行一半时,承载它的主机重启――会发生什么?

- Dans la simplicité`while True`循环中: tout sera perdu. Runs de la tête à la tête.
- Utilisation de l'exécution de la pérennité: Exécution d'un rendez-vous depuis le dernier point de contrôle  Résumé  Activités déjà terminées ne seront pas réécrites; leurs résultats seront reproduits depuis le journal de pérennité Utilisateur n'a pas besoin de réapprouver les choses déjà approuvées Réapprouvées  LLM  Réutilisation de la pérennité  ne sera pas reprise 

C'est le même modèle que les moteurs de flux de travail qui ont été livrés pendant des décennies (Temporal, Cadence, Uber's Cherami) ⋅ la nouvelle variation est que la MLL est maintenant également devenue une activité  non-certaine  coûteuse  avec des effets secondaires  et elles s'adaptent naturellement à ce modèle ⋅

Le cours de métro est basé sur la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de la méthode de mise en œuvre de mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise en œuvre de la mise

## 概念

### Activités  Flux de travail et répétition

- **Workflow**: définition des activités, la séquence, la distribution et l'attente, il doit être définitif, afin de pouvoir être reproduit dans le journal des événements, sans qu'il y ait des différences imprévues.
- **Activity**Une activité peut être enregistrée avec ses entrées et ses sorties après la finition.
- **Event log**:持久化バックアップストア──每 Activité start、complete、failure、retirement, ainsi que chaque décision du Workflow sont enregistrées──
- **Replay**: Lors de la récupération, le code de travail sera réutilisé à partir du début; chaque activité déjà terminée reviendra à ses résultats enregistrés, mais ne sera pas réutilisée.

Ceci est le même que React  à l'égard de la DOM virtuelle, ou Git  à partir de la ré-construction de l'arbre de travail de la même forme.

### Pourquoi le LLM s'adapte-t-il à ce modèle ?

LLM 调用 présente les caractéristiques suivantes:
- Non-certaine: la température > 0; même la température 0 est également différente en fonction des versions du modèle.
- 昂贵(成本和延迟)
- Peut-être que vous avez des limites de taux, des délais.
- 带有副作用 (如果它们调用工具)

C'est le type d'activité. Pour chaque LLM, on utilise un emballage pour l'activité, on peut obtenir une retraitation exponentielle, un contrôle de démarrage, ainsi que des traces de modification reproducibles.

### É`thread_id`Pour les points de contrôle clés

LangGraph, Microsoft Agent Framework, Cloudflare Durable Objects et Claude Code Routines ont reçu le même type d'API`thread_id`(ou égal) séance d'identification; chaque transition d'état sont maintenues jusqu'au dernier bout de la séance.

后端选择 est très important:

- **PostgreSQL**Le nombre de personnes concernées est de:
- **SQLite**: uniquement pour le développement local; à travers l'hôte 会失失数据。
- **Redis**: rapide, mais si le AOF/snapshot n'est pas configuré, il est temporaire.
- **Cloudflare Durable Objects**: transparente distribuée; de la seule clé 限定范围;可存活数小时到数周。

### Les données de l'entreprise sont classées en premier

Proposer-et-commitir (leçon 15) nécessite une attente persistante de l'état humain.

### Dégradaison de 35 minutes

METR  observe, tous les agents de la classe de mesure en continu fonctionnement dépassent environ 35 minutes après tout apparaîtra une baisse de la fiabilité. Le temps de tâche double, le taux d'échec grandement change à quatre fois. La durabilité de l'exécution ne réparera pas ce point; il ne fait que vous permettre de fonctionner au-delà de la durée de la courbe de fiabilité soutenue. Le mode de sécurité est de combiner la durabilité avec les points de contrôle de HITL à la réentrée, et non plus avec des interrupteurs de commutation budgétaire.

### La durée de l'exécution n'est pas la réponse exacte

- Le temps de fonctionnement est court de quelques minutes et sans entrée artificielle.
- 严格只读的信息检索──
- Réquisition de l'équité dans une fenêtre de contexte (infinite à fin de réaliser des tâches)


```figure
memory-consolidation
```

## Utilisez-le

`code/main.py`Utilisez Python pour réaliser un moteur d'exécution minimaliste.

- `@activity`décorateur,将 inputs 和 outputs 记录到 JSON event log。
- Une fonction de flux de travail utilisée pour réparer les activités 顺序的工作流.
- Une .`run_or_replay(workflow, event_log)`fonction, on peut répéter les activités accomplies sans les réactiver.

Le pilote 会模拟一个三 Activity 的工作流,在中途崩,并展示 (a) 朴素再试会重新执行所有内容,而 (b) 重播只运行缺失的活动──

## Je le livre.

`outputs/skill-durable-execution-review.md`L'Agence de la Défense des droits de l'homme (Agence) a été chargée de vérifier si le programme de mise en œuvre de l'Agence de la Défense des droits de l'homme (Agence) possède une forme d'exécution de duration correcte:

## 练习

1. 运行  référencement`code/main.py`◊ observer simple réessayer et répétition  Activité 执行次数的差异── modifier point de choc,并显示 répétition compte 会相应变化──

2. Le moteur de jouets sera modifié pour une utilisation manifeste.`thread_id` Simuler deux sessions de partage du même moteur, et confirmer leurs journaux d'événements non conflit.

3. Dans le moteur de jouets, choisir une activité. Introduction d'un non-determinisme.`Workflow.now()`Les API)

4. 阅读 LangChain's Runtime behind production deep agents 文章──列出 runtime 持久化的 chaque état,并说明每一种覆盖了哪种失败模式──

5. Pour une tâche de codage autonome de 6 heures  concevoir une politique de checkpoint  Vous allez être sur quel checkpoint?

## 关键术语

| Term | 人们通常怎么说 | 实际含义 |
|---|---|---|
| Workflow | “Agent 的脚本” | 确定性编排代码；可从 event log replay |
| Activity | “一个步骤” | 非确定性单元（LLM call、tool call）；执行前后都会被记录 |
| Event log | “backing store” | 每一次 state transition 的持久化记录 |
| Replay | “恢复” | 重新运行 Workflow；已完成 Activities 返回已记录结果，不重新执行 |
| Checkpoint | “保存点” | 以 thread_id 为 key 的持久化 state；resume 时最新状态胜出 |
| thread_id | “Session key” | 用来限定 durable state 范围的 identifier |
| 35-minute degradation | “可靠性衰减” | METR：成功率随周期大约呈二次下降 |
| Non-determinism | “replay 漂移” | Wall clock、random、LLM output；必须注册为 side effect |

## 延伸阅读

- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) budget, tournées et résumé 语义。
- [Microsoft — Agent Framework: human-in-the-loop and checkpointing](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) RequestInfoEvent 形态。
- [LangChain — The Runtime Behind Production Deep Agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents)  exigences spécifiques en matière de temps de fonctionnement¬
- [OpenAI Agents SDK + Temporal integration (Trigger.dev announcement)](https://trigger.dev) LLM 调用 Activité 形态。
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) Dégradaison de 35 minutes 参考。
