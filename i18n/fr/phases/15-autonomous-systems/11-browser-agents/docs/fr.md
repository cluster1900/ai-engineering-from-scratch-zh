# Agents de navigateur et longs temps de tâches Web

> L'opérateur ChatGPT (en anglais) va compléter avec des recherches approfondies pour former un agent navigateur/terminal et se lancer sur BrowseComp avec 68,9% de création SOTA. OpenAI est lancé en 2025.

**Type:** Learn
**Languages:** Python (stdlib, indirect prompt-injection attack surface model)
**先修要求：**Phase 15 · 10 (modalités d'autorisation), phase 15 · 01 (agents à long horizon)
**Time:** ~45 minutes

##  problématique

L'agent de navigateur est un agent à long horizon: il lit des contenus non fiables, et exécute des opérations avec des conséquences. Chaque page visitée par l'agent, est une entrée non écrite par l'utilisateur. Chaque page, est un chemin de commande potentiel.

La préparation de l'OpenAI a été mise en évidence par le responsable: l'injection instantanée indirecte n'est pas un bug qui peut être complètement corrigé. La raison en est que l'attaque se produit dans la frontière de lecture et d'action de l'agent, et cette frontière est une marque floue dans l'architecture.

Le cours est basé sur la méthode de recherche de l'information et de l'information.

## 概念

### 2026 année de publication: chaque système un passage

**ChatGPT agent (OpenAI).**Le nombre de personnes qui ont été enregistrées dans les services de navigation et de recherche en profondeur est de 68,9% dans les services de navigation et de navigation.

**Claude Sonnet + Vercept (Anthropic).**L'analyse de l'utilisation de l'ordinateur est basée sur la recherche de l'application de l'ordinateur.

**Gemini 3 Pro with Browser Use (DeepMind).**L'intégration de l'utilisation du navigateur  éditer des contrôles d'utilisation de l'ordinateur;FSF v3(2026 年 4 月,Léction 20) spécialisé dans le suivi de l'autonomie dans le domaine de la R&D ML ⋅

**WebArena-Verified (ServiceNow, ICLR 2026).**修复一个有充分记录的问题:原始 WebArena 约有11.3%的错误负率(任务被标记为失败,但实际已解决) ――发布验证使用人工整理的成功标准重新评分,并加入258-task Hard subset(ICLR 2026 paper,openreview.net/forum?id=94tlGxmqkN) ――

### BrowseComp vs OSWorld vs WebArena

| Benchmark | 衡量什么 | Horizon |
|---|---|---|
| BrowseComp | 在时间压力下，在开放 Web 上查找特定事实 | 分钟级 |
| OSWorld | Agent 操作完整 desktop（mouse、keyboard、shell） | 数十分钟 |
| WebArena-Verified | 模拟网站中的事务型 Web 任务 | 分钟级 |
| Hard subset | 带有多页面状态转换的 WebArena-Verified 任务 | 数十分钟 |

轴线不同──高BrowseComp 分数说明代理 能找到事实; it does not explain agent 能预订航班──OSWorld 分数更接近它不能在我的桌面上工作──WebArena-Verified 更接近它不能完成一个流程──任何生产决策都需要选择与任务分布匹配的基准──

### 攻击面,命名如下

1. **Indirect prompt injection.**Il est également utilisé dans les médias de la société de l'information et de la communication.
2. **URL fragment / query injection.**URL de l' objet`#fragment`Ou la chaîne de requête 包含命令── elles ne sont jamais vues 染; mais elles sont toujours dans le contexte de l'agent──
3. **Memory-binding attacks.**页面指示代理 写入一条持续记忆(L'étude 12 couvre un état durable)。 la prochaine fois, cette mémoire en cas de décharge utile en l'absence d'un touch-moteur visible。
4. **Authenticated sessions 上的 CSRF-shaped attacks.**Memories contaminées 类:agent 已登录某处; attaquant page发出状态变更请求,agent Utilise les cookies de l'utilisateur 执行这些请求。
5. **One-click hijack.**Un agent de charge de la vidéo sans danger suivra la charge utile.
6. **Agent host surface 中的 Content-Security-Policy holes.**Rendering 和 outils couches 本身也可能成为攻击 Vector;browser-in-a-browser-agent stack 很宽──

### Pourquoi est-ce impossible de le réparer complètement ?

Cette capacité et la structure de l'attaque de l'agent. L'agent doit lire des contenus qui ne lui sont pas fiables pour effectuer le travail. Tout contenu qu'il peut lire peut contenir des instructions. Toutes les instructions qu'il peut suivre ne correspondent pas aux demandes réelles de l'utilisateur.

Ceci est le même que le théorème de Lob (leçon 8) est le même modèle de raisonnement: agent  incapable de prouver que le prochain jeton est sûr; il ne peut construire qu'un système, faire non sûr le jeton plus facilement testé.

### Une position de défense

- **Read / write boundary.**读取永远不产生后果──写入(提交表单、发布内容、调用有副作用的工具) Si le contenu est lancé par la frontière de la confiance, il faut une nouvelle approbation humaine──
- **Tool allowlist per task.**L'agent peut parcourir la page, sauf si un outil est explicitement activé pour cette tâche, sinon il ne peut pas lancer un virement.
- **Session isolation.**Les sessions d'agent de navigateur utilisent seulement des informations d'identification à portée de main 运行―― pas d'auteur de production, pas de courrier électronique personnel―― conserver chaque demande HTTP 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 日志 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网 网                                                                                                                                                                                                                                                                         
- **Content sanitizer.**Prenant HTML dans le contexte du modèle, il va se débarrasser des mauvais modèles connus, réduire facilement les attaques, empêcher la charge utile complexe.
- **对 consequential actions 使用 HITL。**Propose-et-commette le modèle de la leçon 15.
- **Canary tokens on memory.**Si une entrée de mémoire 触发, l'utilisateur le verra 14


```figure
injection-boundary
```

## Utilisez-le

`code/main.py`Un site web est bénin, une page contient une injection directe de prompt, une injection de fragment d'URL, mais elle se trouve dans le contexte de l'agent.

## Je le livre.

`outputs/skill-browser-agent-trust-boundary.md`Définir un déploiement de navigateur-agent proposé: il atteint quelles zones de confiance, il est autorisé à écrire quoi, ainsi que la première opération avant doit être sur quelles défenses.

## 练习

1. 运行  référencement`code/main.py` Découvrir le désinfectant capture, mais la limite de lecture/écriture non capture, ainsi que la limite de lecture/écriture seulement capture.

2. 扩展消毒剂, avec elle tester一类HashJack-style URL-fragment injection──在带有合法fragments的良性URL 上测量虚假阳性率──

3. 选择一个你知道的真实浏览器-agents workflow (télécharger un vol) 列出每次阅读和每次写的标记哪些写的需要 HITL,以及为什么──)

4. 阅读 WebArena-Verified ICLR 2026 paper──找到一个原始 WebArena 评分不可靠的任务类别,并解释 Verified subset 如何解决它──

5. Pour le paramètre de navigateur-agent  concevoir un canary de mémoire ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙ ∙   ∙ ∙      ∙                                                                                                                                                                                                                                                                                                                       

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|---|---|---|
| Indirect prompt injection | “坏页面文本” | Agent 读取的页面中有不受信任内容，其中包含 agent 会执行的指令 |
| Tainted Memories | “Memory attack” | Agent 将攻击者提供的指令写入 durable memory；下一次 session 触发 |
| HashJack | “URL fragment attack” | 隐藏在 URL fragment / query string 中的 payload 位于 agent 的 context 中，但不会被可见渲染 |
| One-click hijack | “坏按钮” | 可见 affordance 承载 agent 会执行的后续 payload |
| BrowseComp | “Web search benchmark” | 在开放 Web 上查找特定事实；分钟级 horizon |
| OSWorld | “Desktop benchmark” | 完整 OS control；多步骤 GUI tasks |
| WebArena-Verified | “修复后的 web-task benchmark” | ServiceNow 重新评分的 WebArena，带 Hard subset |
| Read/write boundary | “Side-effect gate” | 读取永远不产生后果；如果内容来自 trust 外部，写入需要新的批准 |

## 延伸阅读

- [OpenAI — Introducing ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) Opérateur et recherche approfondie 合并;BrowseComp SOTA。
- [OpenAI — Computer-Using Agent](https://openai.com/index/computer-using-agent/) Lignée de l'opérateur, ainsi que l'architecture de l'agent ChatGPT.
- [Zhou et al. — WebArena](https://webarena.dev/) Originaire référence
- [WebArena-Verified (OpenReview)](https://openreview.net/forum?id=94tlGxmqkN) papier ICLR 2026 à sous-ensemble fixe
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) 包含 la discussion sur la surface d'attaque des agents d'utilisation informatique.
