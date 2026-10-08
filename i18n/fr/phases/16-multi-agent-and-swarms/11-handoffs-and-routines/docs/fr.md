# Les remises et les routines  无状态编排

> OpenAI's Swarm (en anglais: OpenAI's Swarm) est un programme multi-agent de formation en deux langues originales:**routines**(en tant qu'instructions + outils de mise en œuvre du système)**handoffs**(retour à un autre outil d'agent) ⋅ pas de statut, pas de branching DSLLLM ⋅ par le biais de la régularisation de l'outil de remise de données 来路由──OpenAI Agents SDK(2025年 3月) est son successeur de production de classe de succession──Swarm 本身仍然是最清的概念参考

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 04 (Primitive Model)
**Time:** ~60 minutes

##  problématique

Chaque cadre multi-agents souhaite que vous appreniez ses nœuds et les bords de DSL:LangGraph, les équipes et les tâches de CrewAI, le GroupeChat et les gestionnaires d'AutoGen. Ces DSL sont des abstractions réelles, mais elles font apparaître des choses plus lourdes que nécessaire.

Swarm 走向相反方向: utiliser le modèle déjà possédé de l'outil-appelant 能力──Handoffs 变成 outil appels──Orchestrator 就是当前掌握对话的那个代理──状态机隐含在代理的系统提示中──

## 概念

### 两个原语

**Routine。**定义 Agent 角色和可用工具的系统提示──可以把它看作一组有作用域的指示:你是分类代理;如果用户询问退款,就交给退款代理──

**Handoff。**L'agent peut être modifié par un outil, il retourne à un nouvel objet d'agent.

```
def transfer_to_refunds():
    return refund_agent  # Swarm sees Agent return → switch active agent

triage_agent = Agent(
    name="triage",
    instructions="Route the user to the right specialist.",
    functions=[transfer_to_refunds, transfer_to_sales, transfer_to_support],
)
```

Le système de triage de l'agent de prompt 让它根据用户消息选择正确的交付──LLM 负责路由──

### Pourquoi ça se répand vite ?

- **API 小。**Il faut apprendre deux concepts.
- **使用模型已经会做的事。**Les appels à l'outil ont déjà atteint un niveau de production chez les fournisseurs.
- **没有状态机负担。**Vous n'avez pas besoin de décrire le graphique; Les instructions de l'agent  décrire elles seront remises 给谁──

### 无状态取舍

Swarm entre les exécutions est vraiment inétat. Le cadre conserve l'historique du message pendant une exécution, mais ne perpétue rien.

Dans le cadre de la production environnemental, le SDK OpenAI Agents est devenu l'un des principaux changements: le SDK a ajouté la gestion de session en interne, les garderies et le suivi, tout en conservant la délivrance.

### Les accumulations/offres 适合的场景

- **Triage patterns。**Un agent de ligne va passer l'utilisateur vers un spécialiste.
- **基于技能的 handoffs。** Si une tâche a besoin de code, appelle le codeur; si elle a besoin de recherche, appelle le chercheur。
- **短而有边界的对话。**Assistance à la clientèle, FAQ, courrier postal, flux de travail simples.

### La scène de la force de l'eau

- **带共享 memory 的长 sessions。**Les délivrances vont mettre l'état de conversation à nouveau, en revanche, le nouveau agent est immédiatement remplacé par l'historique.
- **并行执行。**Le déploiement est une fois un agent actif sera changé.
- **Audit 和 replay。**无状态 runs 很难精确重播; L'envoi de l'LLM 选择不是确定性的。

### OpenAI Agents SDK (en anglais seulement)

Le successeur de la classe de production a ajouté:

- **Session state。**Le fil de la durée de la course
- **Guardrails。**输入/输出 crochets de validation
- **Tracing。**Chaque appel et remise d'outils sera enregistré.
- **Handoff filters。**控制 hand-off 时转移哪些上下文──

La production est disponible autour de la langue originale.

### Swarm vs GroupeChat

Les deux utilisent le parcours LLM, mais la différence réside dans**谁选择下一个**- Le numéro de la liste:

- Groupe Chat: de l'extérieur sélecteur de fonction ou LLM) de l'extérieur sélectionner le dernier orateur.
- Swarm: 当前 Agent 通过调用 handoff tool 选择它的继任者──

Swarm est Agent décide de la prochaine étape ;GroupChat est Manager décide de la prochaine étape ;;Swarm décide de l'agent actif sur l'appel à l'outil de l'agent actif ;GroupChat décide de l'agent actif sur l'appel à l'aide de l'outil de l'agent actif `GroupChatManager`Dans le centre.


```figure
sw-handoff-routing
```

## - Je le construis.

`code/main.py`De la réalisation de Swarm: une classe de données d'agent, un mécanisme de remise, un outil, un agent de retour, ainsi qu'un cycle de fonctionnement d'un agent de contrôle.

Démo: un agent de triage 会路由到退款, ventes ou de soutien spécialistes. Chaque spécialiste a ses propres outils.

运行:

```
python3 code/main.py
```

## Utilisez-le

`outputs/skill-handoff-designer.md`Pour déterminer la topologie de délivrance de tâches: quels agents peuvent être utilisés pour délivrance de tâches, quels seront transférés dans les textes ci-dessous.

##  La publier

Liste de contrôle:

- **Handoff logging。**Chaque remise est enregistrée dans un événement de trace, contenant des agents à des agents, des instantanés de contexte.
- **上下文转移规则。**Décider de remettre 时移动什么: histoire complète 昂贵  最近 N 条消息,或总结
- **Handoff guardrail。**Les spécialistes qui ont des permissions différentes doivent être certifiés ou être rapidement injectés.
- **Loop detection。**Deux agents qui reviennent se dépêchent de faire une erreur.
- **Fallback agent。**Si la cible de remise n'existe pas, retour à la valeur par défaut.

## 练习

1. 运行  référencement`code/main.py`,trier vers l'agent de remboursement... confirmer que le second tour de l'agent actif est le remboursement...
2. 添加循环-detection 规则: si les deux agents 已连续手 off 3 fois,则强制退出──设计倒退──
3. 阅读 OpenAI Agents SDK docs 中关于 handoff filters 的内容──实现一个总结在赠版本:agent sortant 在接管之前,将上下文压缩成弹总结──
4. Comparer le choix du groupe avec le sélecteur du groupe de chat avec le manager. Quel modèle permettra une injection rapide plus grave, pourquoi ?
5. 阅读 Le livre de cuisine de la massehttps://developers.openai.com/cookbook/examples/orchestrating_agents）。找出Une décision de conception explicite prise par Swarm, explique que le SDK d'OpenAI Agents l'a modifié ou le garde.

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|----------------|------------------------|
| Routine | “Agent prompt” | System prompt + tool list。定义角色和可用 handoffs。 |
| Handoff | “转交给另一个 Agent” | active agent 可以调用的一个 tool，它返回新的 Agent。runtime 会切换 active agent。 |
| Stateless | “runs 之间没有 memory” | Swarm 不持久化任何东西；memory 是调用方的责任。 |
| Active agent | “现在谁在说话” | 当前掌握对话的 Agent。Handoff 会改变它。 |
| Context transfer | “handoff 时移动什么” | incoming agent 能看到哪些 history 的策略：full、last N 或 summarized。 |
| Handoff loop | “Agents 来回 ping-pong” | 两个 Agents 不断 hand back 给对方的失败模式。 |
| OpenAI Agents SDK | “生产级 Swarm” | 2025 年 3 月的后继者；在 handoff 原语之上添加 sessions、guardrails、tracing。 |
| Handoff filter | “转移时的 gate” | SDK feature，用于在 handoff 边界检查和修改上下文。 |

## 延伸阅读

- [OpenAI cookbook — Orchestrating Agents: Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) 参考性阐述
- [OpenAI Swarm repo](https://github.com/openai/swarm) Originalisé, comme concept de référence conservé
- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) 带 sessions 和 tracing de la production de la classe suivante
- [Anthropic handoff-in-Claude notes](https://docs.anthropic.com/en/docs/claude-code) Claude Code subagents  comment passer `Task`Utiliser le modèle similaire de la main
