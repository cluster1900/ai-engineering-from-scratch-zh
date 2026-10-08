# Sélection de groupe et de haut-parleurs

> AutoGen GroupChat et AG2 GroupChat sont partagés entre N' 个代理; un sélecteur 函数LLM、round-robin或 custom) choisir le prochain intervenant。 c'est le modèle émergent de conversation multi-agent: les agents ne savent pas qu'ils sont eux-mêmes dans le graphique statique, ils ne font que réagir à la piscine de partage。 AutoGen v0.2 de GroupChat 语义 AG2 est conservé dans la fourchette; AutoGen v0.4 le réécrira comme un modèle d'acteur axé sur les événements。 Microsoft va mettre AutoGen en mode maintenance en 2026 en 2 mois, et le Kernel sémantique le fusionnera avec Microsoft Agent Framework RC en 2026 2 mois.

**类型：**apprendre + construire
**语言：**Python (stdlib)
**前置条件：**Phase 16 · 04 (modèle primitif)
**时间：**- 60 minutes

##  problématique

Quand le flux de travail 已知时,静态图表 (LangGraph) 很好用── vrais conversations 没有静态:有时编码员会问评论员,有时会问研究员,有时会问作家──硬编码 每种可能的交付会产生边缘 爆炸──你想要的是 *agents对共享池做出反应*,并由某函数决定下一个谁说话──

C'est exactement ce que fait AutoGen GroupChat.

## 概念

### 形状

```
              ┌─── shared pool ────┐
              │   m1  m2  m3  ...  │
              └─────────┬──────────┘
                        │ (everyone reads all)
      ┌───────┬─────────┼─────────┬───────┐
      ▼       ▼         ▼         ▼       ▼
    Agent A  Agent B  Agent C  Agent D  Selector
                                           │
                                           ▼
                                  "next speaker = C"
```

Chaque agent peut voir chaque message. Chaque tour peut utiliser un sélecteur pour choisir le prochain intervenant.

### 3 types de sélecteur

**Round-robin。**固定循环──确定性──按N 线性扩展,但会忽略上下文: même si le sujet est une revue juridique, le codeur obtiendra également une reprise.

**LLM-selected。**调用一个LLM, il reçoit le contenu du groupe le plus récent et retourne le plus approprié du prochain intervenant.

**Custom。**Une fonction Python, contenant toute logique que vous voulez.

### API de l'agent conversible

```
agent = ConversableAgent(
    name="coder",
    system_message="You write Python.",
    llm_config={...},
)
chat = GroupChat(agents=[coder, reviewer, tester], messages=[])
manager = GroupChatManager(groupchat=chat, llm_config={...})
```

`GroupChatManager`持有选择者──当一个代理──完成一轮后,经理会调用选择者,选择者 返回下一个代理──循环持续到满足终止条件──

### 终止

3 modes habituels:

- **Max rounds。**Pour le nombre total de fois de la mise en place de la limite de roulement.
- **"TERMINATE" token。**Les agents peuvent envoyer un message sentinelle; le gestionnaire arrête lorsqu'il apparaît.
- **Goal-reached check。**Un vérificateur de la lumière chaque tour fonctionne une fois, et le chat est terminé.

### AutoGen → AG2 分裂, ainsi que le Microsoft Agent Framework 合并

Au début de 2025, Microsoft a commencé à réécrire de manière significative le modèle d'acteur axé sur les événements pour AutoGen(v0.4) et a conservé l'API déjà intégrée des premiers utilisateurs d'AutoGen v0.2.

En février 2026, Microsoft annonce que AutoGen entrera dans le mode de maintenance, modèle d'acteur axé sur les événements.**Microsoft Agent Framework**(RC 2026 年 2 月,现在已与语义核心合并) ――GroupChat 概念在两条路线中都保留下来;实现细节不同──对于兼容 v0.2 的代码,AG2 是首选上游──

### 什么时候适合 GroupeChat

- **Emergent conversations。**Tu ne veux pas être connecté à chaque autre haut-parleur possible.
- **角色混合任务。**Coder 问研究员,研究员 问档案家,档案家 再问回编码者──流程不是DAG──
- **探索式问题解决。**Imaginez une réunion de la tempête, et non une réunion de la tempête.

### Quand tu vas échouer ?

- **严格确定性。**Le sélecteur de LLM peut être différent.
- **Sycophancy cascades。**Les agents seront soumis à l'émission de la personne la plus confiante.
- **Context bloat。**Chaque agent doit lire chaque message; 10 rons après le contexte sera très large.
- **Hot speakers。**某个代理因为选择者 偏好它的专长而主导对话──将扬声器平衡作为选择者特征 引入──

### Chat de groupe contre superviseur

Parmi les primitifs, différentes valeurs:

- Superviseur: un agent 规划,其他代理 执行── Sélecteur est un planificateur 接下来做什么──
- Chat de groupe: tous les agents sont des pairs; sélecteur est une fonction qui joue un rôle dans la pile de partage.

两者都使用课04 中的四个原始语──grup chat 默认使用LLM-selected orchestration 和 full-pool shared state──


```figure
swarm-speaker
```

## - Je le construis.

`code/main.py`Utilisation de la méthode de développement de l'entreprise et de la gestion de l'entreprise`TERMINATE`Le signe de la fin.

La démo imprimera la transcription de la conversation des deux variables ainsi que la trace de décision du sélecteur.

运行:

```
python3 code/main.py
```

## Utilisez-le

`outputs/skill-groupchat-selector.md`Le sélecteur de GroupeChat: round-robin vs LLM-selected vs custom, ainsi que l'utilisation des entrées du sélecteur (messages récents, spécialités d'agent, compte de tour)

##  La publier

Liste de contrôle:

- **Max rounds cap。**始终需要──typical tâche de 10-20──
- **Speaker-balance metric。**Suivre le nombre de tours de chaque agent; lorsque l'équilibre dépasse la valeur de l'agence de renseignements.
- **Termination token。** `TERMINATE`Ou agent de vérification spécialisé
- **Projection 或 scoped memory。**约10 条 条 后, pensez à ne donner à chaque agent qu'une vue de scope, afin d'éviter la gonflement du contexte.
- **Selector logging。**Pour les changements sélectionnés par LLM, les données et les choix du sélecteur sont également enregistrés.

## 练习

1. 运行  référencement`code/main.py` Comparer la conversation de la ronde-robin avec celle du LLM sélectionnée  Chaque manière quel agent est le principal ?
2. Dans le sélecteur, ajouter une section "max-speaks-per-agent" 规则── comment cela affecte-t-il la transcription ?
3. 实现目标达成终止:当评审员 返回"approuvé" 时停止──它在圆顶前触发的频率是多少?
4. 阅读 AutoGen stable docs 中关于 GroupChat 的内容(https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html）。识别 `GroupChatManager`Utilisation du sélecteur par défaut
5. 阅读 AG2 repo(https://github.com/ag2ai/ag2），并将其Quelle est la différence entre la version de v0.2 et la version d'événement de v0.4 ?

## 关键术语

| Term | 人们的说法 | 它实际的含义 |
|------|----------------|------------------------|
| GroupChat | "Agents in one chat room" | Shared message pool + selector function。AutoGen / AG2 primitive。 |
| Speaker selection | "Who talks next" | 选择下一个 agent 的函数。Round-robin、LLM-selected 或 custom。 |
| GroupChatManager | "The meeting host" | 拥有 selector 并循环处理轮次的 AutoGen component。 |
| ConversableAgent | "The base agent" | AutoGen base class；一个可以发送和接收 messages 的 agent。 |
| Termination token | "The 'stop' word" | 结束 chat 的 sentinel string（通常是 `TERMINATE`）。 |
| Hot speaker | "One agent dominates" | selector 不断选择同一个 agent 的 failure mode。 |
| Context bloat | "Pool grows unbounded" | 每个 agent 都读取所有先前 message；context 随轮次增长。 |
| Projection | "Scoped view" | 面向角色的共享池视图，用于防止 context bloat。 |

## 延伸阅读

- [AutoGen group chat docs](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/design-patterns/group-chat.html) mise en œuvre de référence
- [AG2 repo](https://github.com/ag2ai/ag2) 社区延续的 AutoGen v0.2
- [Microsoft Agent Framework docs](https://microsoft.github.io/agent-framework/) 合并后的继任者,RC 2026 年 2 月
- [AutoGen v0.4 release notes](https://microsoft.github.io/autogen/stable/) Acteur modèle axé sur l'événement 重写细节
