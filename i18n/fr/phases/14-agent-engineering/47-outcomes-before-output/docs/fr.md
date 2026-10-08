# Dans le choix avant de définir les résultats

> La capacité de réalisation du code de la vitesse a augmenté le coût du problème de sélection.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** None
**Time:** ~60 分钟

## Objectif de l'apprentissage

- Dans le cadre de la mise en œuvre de la stratégie de développement, il est nécessaire de mettre en place un cadre de résultats.
- Identifier les indicateurs de l'amélioration de la situation actuelle et de l'amélioration prévue.
- 显式声明硬性约束 (Constraints) avec non objectifs (Non objectifs)
- 识别解决方案泄漏(Solution Leakage), empêcher sa prématuration pour le développement.

## 交付产品不等于实质成效

 Construire un assistant d'urgence à défaut  Identifier que c'est seulement un produit ( Output)  Il n'explique pas du tout qui en a besoin  Quels indicateurs seront améliorés, et quelles sont les principales mesures de sécurité à prendre 

En comparaison, le cadre de résultats (Reflection du cadre de résultats) est exprimé comme suit:

> Lorsque l'environnement de production se produit, le génie de travail peut en deux minutes localiser le service de défaillance et confirmer la prochaine opération de sécurité, tout en maintenant le processus de vérification complet et en suivant le suivi de l'audit.

L'effet défini par cette phrase peut être réalisé à la fois par un ensemble de logiciels, ou par l'optimisation des performances du rouleau, la réparation des données ou une modification d'interface plus légère pour atteindre le résultat.

## Les six grands éléments du cadre de l'économie

| 构成要素 | 核心问题 |
|---|---|
| 用户（User） | 谁在直接面对并承受该问题？ |
| 情境（Situation） | 该问题何时、何地发生？ |
| 当前现状（Current behavior） | 现状如何运作，包括现有的各种临时变通手段（Workarounds）？ |
| 期望成效（Desired outcome） | 哪些可观测的状态应当得到实质改善？ |
| 约束条件（Constraints） | 哪些安全、策略、成本或兼容性底线是固定的？ |
| 非目标（Non-goals） | 哪些极具诱惑但相关的邻近工作被明确排除在外？ |

```mermaid
flowchart LR
  U[用户与情境] --> C[当前现状]
  C --> O[期望成效]
  O --> K[约束条件]
  K --> N[非目标]
  N --> E[证据探究问题]
```

## 识别解决方案泄漏

Lorsque l'expression de l'effet entraîne une fuite de solution à la structure de produit, de modèle, de modèle ou de structure de base, une fuite de solution est produite:

-  utilisateur recevant chaque semaine un résumé :  divulgué  résumé  cette forme ainsi que  chaque semaine  cette fréquence
-  l'utilisateur a été capable de comprendre avec précision les changements de compte avant l'approbation:
- 部署向量数据库: une fuite de type de l'infrastructure
-  la capacité d'amélioration réelle de la politique de conformité est exprimée.

Lorsque la compatibilité du système existant est vraiment verrouillée dans une technologie, il est possible de la nommer dans les conditions de verrouillage, mais il faut clairement enregistrer les raisons objectives de son verrouillage.

## 约束条件守护成效底线

Les conditions de confinement ne sont pas des détails de réalisation simples, elles sont une composante indissociable des objectifs du monde réel:

- Il est strictement interdit de réaliser toute opération de production en milieu de travail pendant le diagnostic de maladie;
- La réaction à la dépense doit être contrôlée dans le budget de temps de mise en service des accidents;
- l'enregistrement des événements d'audit existants doit continuer à être le seul à pouvoir;
- ne permet pas l'introduction de nouvelles bases de données de fonctionnement;
- 无障碍访问(Accès) Le soutien doit être maintenu en bonne santé.

Si un système, bien qu'il ait atteint l'objectif attendu, enfreint une seule restriction, il est totalement échoué.

## Selon les limites non-objectives

Les objectifs non objectifs sont capables d'éviter efficacement qu'un petit outil pratique ne se développe en une plateforme énorme.

- non-réparation de défauts automatisés;
- Il n'y a pas de nouveau système de police de signalement;
- Non substitué à la direction de l'accident;
- Cette partie ne concerne pas les fonctions d'analyse des données historiques.

## - Je le construis.

Le programme d'expérimentation de cette classe sera une expérience`OutcomeFrame`La validité, et les résultats seront écrits.`outputs/outcome-frame.json`Il y a une autre.

运行命令:

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

尝试将期望成效修改为使用故障应急助手──校验器应敏地指出: le produit proposé a déjà été déverrouillé au sein de la définition de l'effet de réalisation──

## 练习

1. Récris un des besoins de fonctionnement du backlog en tant que cadre de réalisation standard.
2. Ajouter une article qui modifiera fondamentalement la rigueur de l'espace de solutions à utiliser.
3. 添加两条能够确保首发开发片保持精简的非目标──
4.  trouver les premiers indicateurs d'observation qui pourraient être confirmés.
5. 构想三种完全不同,但都能满足相同的成效定义的产品形式──

## 延伸阅读

- [Nuseibeh and Easterbrook, Requirements Engineering: A Roadmap](https://www.cs.toronto.edu/~sme/papers/2000/ICSE2000.pdf): explorer le monde réel comme objectif central de l'ingénierie logicielle.
- [Dardenne, van Lamsweerde, and Fickas, Goal-Directed Requirements Acquisition](https://doi.org/10.1016/0167-6423(93)90021-G): expliquer comment les objectifs de la haute classe seront progressivement définies en termes d'opération et de réglementation.

## 交付物与沉

S' il vous plaît bien conserver généré`outputs/outcome-frame.json` Les cours suivants examineront les processus de travail réels des personnes pour les examiner.
