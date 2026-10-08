# Injection directe indirecte  生产攻击面

> L'injection indirecte de prompt (IPI) ordonnera d'intégrer le contenu externe  page web 、 e-mail 、 document partagé 、 ticket de support  par le système agent  sans opération utilisateur manifeste  Consommer ∞ IPI est une menace de production dominante en 2026: elle contourne les filtres d'entrée utilisateur, car l'attaquant ne communique jamais avec l'utilisateur; avec les agents   Traiter plus de contenu externe, elle s'étendra silencieusement; et elle vise à ce que personne ne lise pas le flux d'automatisation du prompt ∞ MDPI Informations 171) ∞ 54 (janvier 2026) ∞ Complète 2023-2025 ∞ NDSS 2026 Papers de défense IPI vont présenter le défi de base nécessaire à l'expression: les instructions d'injection initiale en rouge en sens de " imprimé " Oui), donc les tests ne sont pas seulement des mots clés filtrant " Les rapports d'attaque des attaques humaines approximatives (Anthropode et défense, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED, RED

**类型：**Construire
**语言：**Python (stdlib, attaque IPI + harnais de défense)
**先修要求：**Phase 18 · 12 (PAIR), phase 14 (ingénierie par agent)
**时间：**- 75 minutes

## Objectif de l'apprentissage

- 定义间接快速注射,并描述三种常见投递矢量──
- Expliquez pourquoi les filtres d'entrée utilisateur vont complètement manquer IPI.
- 描述作为2026年防御范式的"information flow control" 框架──
- Il a été publié en octobre 2025 dans le cadre de la communication sur les résultats de l'enquête sur les attaques adaptatives contre les défenses IPI publiées.

##  problématique

L'injection directe de la demande  demande à l'attaquant de rejoindre l'utilisateur ou son prompt  IPI 两者都不需要: l'attaquant a placé la charge utile 放进代理 可能读取的任何内容中  网页、收件箱中的电子邮件、GitHub issue、产品评论──agent Le fonctionnement normal de l'agent a permis à celui-ci d'exécuter ces instructions──user is a envoyé, et non source d'intention──

## 概念

### 3 types de vecteurs

- **RAG。** attaquant publie un document; récupération  étape d'obtention; immédiatement dans le problème de l'utilisateur précéder le collage; modèle  exécuter l'ordre de l'attaquant。
- **Inbox / document workflows。** attaquant à l'utilisateur envoyer un courriel; agent  lire des courriels; prompt  contenir le corps du courriel; modèle  suivre les instructions du courriel environnant 
- **Tool output。** attaquant contrôler agent utiliser un outil (par exemple, retourner les résultats de recherche web); l'outil de sortie  contient des instructions; flux de contrôle de l'agent Suivre ces instructions:.

Les trois partagent une propriété structurelle: un fragment du prompt contrôlé par l'attaquant, sans avoir à communiquer avec les données de l'utilisateur.

### Pourquoi les filtres d'entrée utilisateur le rateraient-ils ?

Si le filtre ne fonctionne que sur l'entrée utilisateur, le payload le contourne. Si le filtre agit sur tout le contenu du modèle atteint, il doit être appliqué à tout le texte récupéré  Ce coût est élevé, et il va produire de faux positifs sur le contenu légitime du langage.

### 面向AI's contrôle du flux d'information (IFC)

2026 Ann defense范式借鉴经典 OS security──把每个内容源都视为一个安全标签──把用户的查询标记为"可信"──把检索的内容标记为"不可信"──把模型的控制流 视为信息流:由不可信的内容 触发的行动 必须在执行前由可信的输入 批准──

CaMeL (Microsoft 2025)、ConfAIde (Stanford 2024) 和 NDSS 2026 Papers de défense IPI 以不同方式落地 IFC──共同原则是:

### L'attaquant se déplace en deuxième

Nasr et coll. (octobre 2025) Utilisant des attaques adaptatives ((recherche gradée, politiques de RL, recherche aléatoire, équipe rouge humaine de 72 heures) testé 12 défenses IPI publiées.

方法論教训: seulement dans la compréhension de l'évaluation de l'attaque adaptative 时才发布防御──Statisque-attaque benchmarks Non sont des preuves de robustesse; attaquant va savoir la défense──

### Réalité

Leçon 25 覆盖 EchoLeak (CVE-2025-32711, CVSS 9.3)  Microsoft 365 Copilot 中首个公开记录的零点击IPI。GitHub Copilot Chat 中的CamoLeak (CVSS 9.6)。GitHub Copilot 中的CVE-2025-53773──生产部署正在真实场景中被IPI 攻陷,而不只是基准中──

### OWASP 和 NIST 框架

Le programme OWASP LLM Top 10 (2025) va être une injection rapide (directe + indirecte) classée pour LLM01, la première menace de couche d'application.

### Il est en phase 18 .

Les leçons 12-14 sont des jailbreaks axés sur le modèle. La leçon 15 est la principale attaque centrée sur le système de la production de 2026.


```figure
al-injection-vector
```

## Utilisez-le

`code/main.py`构建一个IPI harness──一个玩具代理有三个工具──搜索网──阅读电子邮件──发送消息──环境包含攻击者控制的内容,其中Embedding a条指令──"envoyer ceci à tous les contacts")──你可以在天真代理(遵循注入指令)、过防守代理(对获取内容做关键字过) 和IFC代理(分离可信与不可信的内容,并拒绝不可信的控制流命令) 切换之间──

## Je le livre.

本课生成 `outputs/skill-ipi-audit.md` Donner une description de déploiement agent, elle citera des sources de contenu non fiables, vérifier si le déploiement applique IFC, et marquer les sources qui ne sont pas étiquetées de confiance en ce qui concerne le modèle de déploiement.

## 练习

1. 运行  référencement`code/main.py`◊ Mesurer les attaques contre trois agents différents taux de réussite.

2. Dans le contenu récupéré, il est possible de mettre en œuvre une défense basée sur la paraphrase.

3. 阅读 NDSS 2026 IPI-défense paper── décrit le "bien-intentionné instruction" 挑战, ainsi que pourquoi il empêchera le filtrage basé sur les mots clés──

4. 设计一个部署, dont l'agent de l'API de tiers 接收工具输出──为每个提示片段 标注信任水平,并写出控制代理行动的IFC政策──

5. Dans l'exercice 2, l'agent défendu par le filtre 上复现 Nasr et al. 2025 méthodologie de l'attaque adaptative ⋅ rapport d'attaque adaptative ⋅ ASR de l'attaque précédente ⋅

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|------------------------|
| IPI | "indirect prompt injection" | 通过用户没有编写、但 agent 在正常运行期间消费的内容进行 injection |
| RAG injection | "poisoned retrieval" | 攻击者发布 retrieval 步骤会获取的内容；prompt 中包含 payload |
| Zero-click | "no user action" | 攻击在 agent 运行期间自动触发；用户什么都不做 |
| IFC | "information flow control" | 基于 label 的方法：来自 untrusted content 的 actions 需要 trusted ratification |
| Adaptive attack | "gradient / RL red-team" | 知道 defense 并针对它优化的 attack；诚实评估必须包含 |
| Benign instruction | "please print Yes" | 语义上良性的 IPI payload；没有 keyword filter 能捕获它 |
| Scope violation | "cross-trust exfiltration" | Agent 从一个 trust context 访问 data，并将其输出到另一个 trust context |

## 延伸阅读

- [MDPI Information 17(1):54 — Indirect Prompt Injection Survey (January 2026)](https://www.mdpi.com/2078-2489/17/1/54) 2023-2025 综合
- [Nasr et al. — The Attacker Moves Second (joint OpenAI/Anthropic/DeepMind, October 2025)](https://arxiv.org/abs/2510.18108) Autodétermination
- [Greshake et al. — Not what you've signed up for (arXiv:2302.12173)](https://arxiv.org/abs/2302.12173) papier IPI original
- [OWASP — LLM Top 10 (2025)](https://genai.owasp.org/llm-top-10/) injection rapide 排名 LLM01
