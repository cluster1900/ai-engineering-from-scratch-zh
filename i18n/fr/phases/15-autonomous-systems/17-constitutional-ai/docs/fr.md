# L'IA constitutionnelle et les règles

> Anthropic 发表于 2026 1er 22 日 Claude Constitution 共 79 页, adopte CC0 授权. Elle passe de la réglementation à la réglementation à la réglementation à la réglementation, et établit quatre niveaux de priorité: 1) sécurité et soutien à la surveillance humaine, 2) éthique, 3) guide anthropic, 4) utilité. Le comportement est divisé en interdiction de code dur (liver les capacités de mise en valeur des armes biologiques, CSAM) et défaut de code doux: les méthodes d'exploitation et les utilisateurs ne peuvent pas être couverts, les méthodes d'exploitation des dernières peuvent être définis dans la réglementation des frontières. La version originale de 2022  Bai et al.                                                                                                                                                                      

**Type:** Learn
**Languages:** Python (stdlib, four-tier priority resolver)
**前置要求：**Phase 15 · 06 (étude d'alignement automatique), phase 15 · 10 (权限模式)
**Time:** ~60 minutes

##  problématique

Un agent déployé rencontrera des entrées que le concepteur n'a jamais vues. Il n'y a pas de liste de règles assez longue pour les couvrir. Il n'y a pas non plus de liste de règles assez courte pour être appliquée rapidement sous pression de calcul. La question réelle est: comment faire pour qu'un agent s'adapte aux cas déjà en cours de développement et puisse s'adapter à des principes de raisonnement rapide ?

基于规则的对齐(RBA): énumérer tous les choses non autorisées. 查查很快,易审计,不可能保持最新,并且经常会对未预见的相近类比过度拒绝. 基于推理的对齐 (RBA) 基于推理的对齐 (RBA):编码原则,让模型推理――能扩展到未见的案例,更难审计,失败模式是原则误用,而不是漏掉规则――

2026 Constitution  adopte une position centrale claire. L'interdiction du code dur, qui est aussi son erreur de nature non dépendante des faits ci-dessous, appartient à la RBA: quel que soit le mode d'exploitation ou la façon dont l'utilisateur ordonne, tout est absolument interdit. Tout le reste est basé sur les hypothèses de quatre niveaux: sécurité et soutien à la surveillance humaine; première, deuxième, troisième, et troisième.

## 概念

### Quatre niveaux de priorité

1. **安全与支持人类监督。**Le modèle prioritaire est d'éviter de diminuer la capacité de surveillance et de correction de l'IA humaine et anthropologique.
2. **伦理。**诚实、避免伤害个人、不欺骗、不操纵──当它与人类指南冲突时,伦理优先──
3. **Anthropic 指南。**Anthropic 认为重要的操作规范:产品范围、交互模式、何时使用哪些工具──
4. **有用性。**Le plus bas. Dans la plus haute priorité.

Lorsqu'un conflit de niveau, un niveau plus élevé gagne. Ceci est identique à la forme de la priorité Unix ou du QoS réseau: ce cadre vise à produire des résultats de résolution prévisibles, et non pas nécessairement le meilleur comportement sur une seule dimension.

### Interdiction de code dur et défaut de code doux

**Hardcoded:**
- 生物武器 / CBRN 能力提升
- CSAM
- Attaques contre des infrastructures clés
- En cas de question directe, tromper les utilisateurs sur les informations relatives à la personnalité du modèle

Les utilisateurs ne peuvent pas les couvrir. Ils seront en cas de possibilité à exécuter au niveau du modèle.

**Soft-coded default（操作方可调整）：**
- 响应长度默认值
- Sujet: Résumé du projet
- 风格(正式 vs 随意)
- 工具使用模式

操作方调整发生在声明边界内. 操作方不能通过重命名移除硬码禁令.

### 2022 CAI entraînement

Il est également possible de faire des efforts pour améliorer la qualité de la vie.

1. 针对一组提示 生成响应──
2. 要求模型根据一套宪法 (en anglais: 要求模型根据一套宪法)
3. Selon la critique
4. Pour les modifications suivantes, il est possible de réaliser des RLAIF (encouragement à apprendre à partir des commentaires de l'IA).

Résultat: le modèle utilisera une explication du principe de rejet des demandes nuisibles, plutôt que de rejeter généralement. La Constitution de 2026 utilise une version ultérieure de ce type de formation et effectue des exercices ultérieurs supplémentaires sur une structure de niveau évident.

### Sur la base de la logique, on peut saisir ce qu'on a perdu.

**能抓住：**
- Les opérations de base autorisées à l'origine sont organisées de manière imprévue, mais les principes sont clairement applicables dans les cas suivants:
- Il s'agit d'une requête de type nouveau très proche de la requête interdite.
- Je ne peux pas dire que X ne permet pas l'ingénierie sociale.

**会漏掉：**
- Utiliser les principes du discrimination des attaques  Les utilisateurs demandent de le faire, donc utile de dire que c'est possible)
- Les deux principes sont en conflit de manière imprévue et les scénarios sont classés dans un ordre de classe.
- 訓練周期中原則解释的缓慢漂移 (atténuation du processus de formation)

### 2023  participation à l'expérimentation

Anthropic a mené une expérience en 2023 pour comparer la constitution écrite par une entreprise à la constitution générée par l'entrée publique (environ 1000 répondants américains) [2]. Les deux versions sont convenues sur un principe d'environ 50%.

### Pourquoi une interdiction de code dur est nécessaire

Les attaquants, si ils peuvent faire accepter un modèle, par exemple, nous sommes un laboratoire de recherche sur les armes biologiques, peuvent souvent contourner le principe de la théorie de la dépendance à l'égard des cas.

### La Constitution est à l'intérieur de la Constitution.

Constitution non est un commutateur de tuerie de leçon 14。 il se trouve dans le modèle de niveau: le pouvoir du modèle est entraîné à un contenu préférentiel。 le commutateur de tuerie et le jeton canary 位于 le niveau de fonctionnement: le temps de fonctionnement permet quoi。 les deux sont nécessaires。 si le pouvoir du modèle est trop large, conduit à exécuter toutes les erreurs lors de la fonctionnement, c'est le problème du temps de fonctionnement。 si le temps de fonctionnement est trop limité, conduit au modèle à refuser tous les bons mouvements, c'est aussi le cas du temps de fonctionnement。 les problèmes couvrent différentes catégories。


```figure
mx-priority-tiers
```

## Utilisez-le

`code/main.py`¢ réaliser un résolveur de quatre niveaux minimum ¢ résoudre ¢ recevoir un projet de décision et un groupe de principes évaluer ¢ sécurité, éthique, lignes directrices, utilité), et revenir à cette décision ¢ refuser ou modifier ¢ faire fonctionner un groupe de cas: ¢ explicit permis ¢ explicit non permis ¢ strictement interdit ¢ confusion de cas à travers les niveaux ¢

## Je le livre.

`outputs/skill-constitution-review.md`审计某部署的宪法层:哪些是硬编码的,哪些是软编码的,操作方可在哪里调整,以及四级层级是否确实是解析顺序──

## 练习

1. 运行  référencement`code/main.py`❖ Confirmer même l'utilité 很高,hardcoded prohibition 也会触发──修改 resolver,让 l'utilité du pouvoir de l'utilité est élevé à l'éthique; observer失败模式──

2. 阅读Claude Constitution(公开,79 页,CC0) ―― trouver un principe que vous pensez prévoir insuffisant―― écrire deux paragraphes pour expliquer les différences spécifiques, et proposer une déclaration plus stricte――

3. Pour les agents de support client, la conception d'un ensemble de code doux par défaut.

4. 阅读 Bai et al. 2022 CAI 论文── décrire un cycle de critique et de révision de l'IA constitutionnelle 循环会比毛毯规则 产生更差结果的案例──识别该类──

5. L'expérience participative de 2023 de Anthropic a révélé qu'il y avait environ 50% de différences entre les principes du public et les principes de la société.

## 关键术语

| Term | 人们常说 | 实际含义 |
|---|---|---|
| Constitutional AI | “Anthropic 的对齐方法” | 针对书面 constitution 的自我批判 + RLAIF |
| Reason-based alignment | “原则，而不是规则” | 模型基于原则进行推理，以处理未见案例 |
| Hardcoded prohibition | “永远不要做 X” | 操作方或用户都不能覆盖的基于规则的禁止项 |
| Soft-coded default | “操作方可调整” | 在声明边界内的行为，由操作方控制 |
| Four-tier hierarchy | “优先级顺序” | safety > ethics > guidelines > helpfulness |
| RLAIF | “AI feedback RL” | reward 来自模型生成批判的 RL |
| Participatory constitution | “公众来源原则” | 2023 Anthropic 实验；与公司原则约 50% 分歧 |
| Principle drift | “解释滑移” | 模型解读固定原则文本的方式缓慢变化 |

## 延伸阅读

- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution) 79 pages CC0 文档。
- [Bai et al. — Constitutional AI: Harmlessness from AI Feedback](https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback) 2022 原始论文──
- [Anthropic — Collective Constitutional AI (2023)](https://www.anthropic.com/research/collective-constitutional-ai-aligning-a-language-model-with-public-input) 参与式实验──
- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) Constitution dans la position du RSP 
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) La Constitution dans le rôle du déploiement de longue durée
