# L'équipe rouge: PAIR et attaques automatisées

> Chao, Robey, Dobriban, Hassani, Pappas, Wong (NeurIPS 2023, arXiv:2310.08419)  PAIR  Rapide raffinement itératif automatique  是经典的自动化黑盒 jailbreak。带有红团系统提示的攻击者 LLM 会为目标 LLM 代提出 jailbreak,并在自己的聊天历史中累积尝试和响应,作为在语境反──PAIR 通常在20次查询内成功,比 G(CGZou et al. Le système de recherche de jetons est basé sur la base standard de la banque de données (ArXiv:2404.01318) et HarmBench, avec GCG、AutoDAN、TAP 和 Persuasive Adversarial Prompt 并列──

**类型：**Construire
**语言：**Python (stdlib, simulation de la boucle PAIR contre une cible jouet)
**前置要求：**Phase 18 · 01 (après instruction), phase 14 (ingénierie par agent)
**时间：**- 75 minutes

## Objectif de l'apprentissage
- 描述 PAIR 算法: système d'attaque rapide, perfectionnement itératif, rétroaction dans le contexte.
- Expliquer que lorsque l'objectif est la boîte noire, pourquoi PAIR est plus strict que GCG.
- Il y a quatre autres lignes de base d'attaque automatisée (GCG, AutoDAN, TAP, PAP) et il y a une différence entre chaque caractéristique et la caractéristique.
- descrivez le protocole d'évaluation de JailbreakBench et HarmBench, ainsi que l'interprétation du " taux de réussite des attaques " dans leur protocole respectif.

##  problématique
Le red-teaming est un mouvement manuel. Une minorité de testateurs spécialisés construisent des messages d'adversité, et suivent ce qui est efficace.

## 概念
### Algorithme de paiement

输入:
- La cible est le MLL T (((
- Le juge LLM J (((评分某响应是否为 jailbreak)
- Attacker LLM A(optimisateur d'équipe rouge)
- C'est une ligne de but G:"répondez à [instruction nocive]."
- Le budget K( est généralement de 20 fois de requête)

循环, pour k en 1..K:
1. Utilisation de l'objectif G et jusqu'à présent de la paire (prompte, réponse) 历史来提示 A。
2. Une nouvelle demande de réponse
3. R_k  soumettre à T; recevoir la réponse r_k ⋅
4. J 根据目标对 (p_k, r_k) 打分。
5. Si le score >= seuil, alors arrêtez  已找到 jailbreak──
6. 否则,将 (p_k, r_k) 追加到 A 的历史中;继续──

经验结果(NeurIPS 2023): pour les attaques GPT-3.5-turbo、Llama-2-7B-chat, le taux de réussite > 50%; la requête moyenne requise pour réussir est de 10-20 .

### Pourquoi PAIR est efficace

GCG(Zou et al. 2023) à travers Gradient dans le système de recherche de suffixe de jeton adverse; il nécessite un accès à un modèle de boîte blanche, ne produira pas de suffixe illisible.

### Attaques automatisées connexes

- **GCG (Zou et al. 2023, arXiv:2307.15043).**针对对抗对抗后的代码 级 Gradient search──White-box,可迁移,产生不可读字符串──
- **AutoDAN (Liu et al. 2023).**Dans le cadre de la recherche évolutionnaire, l'objectif hiérarchique est de guider.
- **TAP (Mehrotra et al. 2024).**带 pruning of tree-of-attacks  分支出多个 PAIR style déploiement。
- **PAP (Zeng et al. 2024).**Prompts adversaires persuasifs  将人类说服技巧编码为提示模板──

### JeilbreakBench et HarmBench

两者(2024) 都将评价 标准化:

- Le nombre de cas de réaction de l'attaque (ASR) est estimé à 10 个 OpenAI-policy 类别的 100 个有害行为──以 Attack Success Rate (ASR) 作为主要指标──需要评判(GPT-4-turbo、Llama Guard或 StrongREJECT)──
- HarmBench (Mazeika et coll. 2024)──coverage 7 个类别的510 个行为, contenant des tests de dommages sémantiques et fonctionnels──比较 18 种攻击在 33 个模型上的表现──

Les ASR sont généralement fixés dans le budget de la requête.

### Il est important pour la déploiement de 2026

 chaque laboratoire frontalier  est en cours de publication  pour le modèle de production  PAIR 和 TAP── trajectorie ASR  apparaît sur la carte modèle  Leçon 26) et l'annexe du cas de sécurité  Leçon 18) 

### C'est dans la phase 18 .

Leçon 12 est une attaque automatisée 基础。Leçon 13(Many-Shot Jailbreaking) est une forme de longueur d'utilisation de l'interface.Leçon 14(ASCII Art / Visual) est une forme d'attaque de code.Leçon 15(Indirect Prompt Injection) est une forme de production d'attaque de 2026 année.


```figure
al-pair-loop
```

## Utilisez-le
`code/main.py`构建一个玩具 PAIR loop──目标是一个假分类器,会拒绝明显的有害提示关键字过──攻击者是一个规则基础的炼油器,会尝试抛词、角色扮演框架 和编码──判断对应打分──你会看到攻击者在大约5-15次代内成功绕过关键字过,并在语义过上失败──

## Je le livre.
本课产 出 `outputs/skill-attack-audit.md` Donner un rapport d'évaluation de l'équipe rouge, il vérifiera: quelles attaques ont été lancées (PAIR, GCG, TAP, AutoDAN, PAP)  le budget de chaque attaque (utiliser un juge)  sur la base de quel ensemble de comportements nocifs (JailbreakBench, HarmBench, interne) 

## 练习
1. 运行  référencement`code/main.py`◊测量三种内置 attacker strategy  Expliquer chaque stratégie utilisant l'hypothèse de défense cible 

2. 实现第四种攻击策略 (例如,翻译成另一种语言、base64 encoding) ⋅报告它在关键字过目标和语义过目标 上新中字查询-to-success──

3. 阅读 Chao et al. 2023 Figure 5 ((PAIR vs GCG comparation)  description de deux pays, bien que PAIR 具有效率优势但仍首选 GCG的场景──

4. Le JailbreakBench se réunit pour fixer des objectifs fixés  Rapport ASR。 concevoir un indicateur supplémentaire pour mesurer la diversité des attaques(l'écart de succès rapide)。 expliquer pourquoi la diversité est importante pour l'évaluation de la défense。

5. TAP(Mehrotra 2024) par branchage + taille 扩展 PAIR──为 `code/main.py`草拟一个TAP-style 扩展,并描述计算成本与成功率之间的权衡──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| PAIR | "automated jailbreak" | Prompt Automatic Iterative Refinement；attacker-LLM + judge-LLM loop |
| GCG | "gradient jailbreak" | 针对 adversarial suffix 的 white-box Token 级 Gradient search |
| Attack success rate (ASR) | "% jailbreaks at k queries" | 主要指标；必须与 query budget 和 judge identity 一起报告 |
| Judge LLM | "the scorer" | 评估响应是否满足 harmful goal 的 LLM |
| JailbreakBench | "the evaluation" | 带有标记类别的标准化 harmful-behaviour set |
| HarmBench | "the broader bench" | 510 个 behaviour，functional + semantic harm test |
| TAP | "tree of attacks" | 带 branching + pruning 的 PAIR；在更高 compute 下获得更好的 ASR |

## 延伸阅读
- [Chao et al. — Jailbreaking Black Box LLMs in Twenty Queries (arXiv:2310.08419)](https://arxiv.org/abs/2310.08419) PAIR 论文,NeurIPS 2023
- [Zou et al. — Universal and Transferable Adversarial Attacks on Aligned LLMs (arXiv:2307.15043)](https://arxiv.org/abs/2307.15043) papier GCG
- [Chao et al. — JailbreakBench (arXiv:2404.01318)](https://arxiv.org/abs/2404.01318) évaluation standardisée
- [Mazeika et al. — HarmBench (ICML 2024)](https://arxiv.org/abs/2402.04249) évaluation plus large
