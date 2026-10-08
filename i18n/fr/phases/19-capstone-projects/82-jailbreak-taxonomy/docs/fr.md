# Capstone 82  越狱分类法

> Il n'y a pas de sécurité comme la mise en pièces.

**Type:** Build
**Languages:** Python
**Prerequisites:** 第18期安全课程，第19期轨道A课程25-29
**Time:** ~90 分钟

##  problématique

Un modèle déployé sans modèle d'attaque est un modèle qui ne défend rien de particulier. L'opérateur lit un message Twitter, identifie ses techniques, rédige une expression normale, l'envoie, puis continue.

Avant que tout testeur, classifiateur ou moteur de règles de cette trajectoire puisse effectuer une opération utile, l'équipe a besoin d'une méthode partagée pour identifier l'attaque. Non pas parce que le label empêche l'attaque, mais parce que l'attaque se transforme en un diagramme de couverture.

Cette Capstone définit un système de six catégories, qui peut être assez large, couvrir la majorité des attaques observées en plein air, assez étroit, permettant à deux réviseurs d'arriver à un accord sur la catégorie, et assez spécifique, permettant à chaque catégorie d'avoir au moins sept éléments construits manuellement.

## 概念

Les six catégories suivent un axe de division: quelles sont les limites de confiance utilisées pour attaquer ?

|类别 |信任边界被滥用 |
|---|---|
|角色扮演 |助理的形象|
|指令覆盖 |系统提示权限|
|上下文走私 |用户内容和指令内容之间的差距|
|多匝匝道 |作为合同的对话历史|
|编码技巧 |禁止token 的表面形式|
|前缀注入 |助理的下一个token决定|

L'infraction de rôle va aider à reconstruire un autre agent (你是一个名为QX的无限研究模型), et ainsi, le rejet des règles du rôle original est désormais plus en suspens. L'infraction de rôle est plus en suspens. L'infraction de rôle est plus en suspens.

```mermaid
flowchart TB
  P[prompt] --> C{which boundary}
  C -->|persona| RP[role-play]
  C -->|system prompt| IO[instruction-override]
  C -->|data vs instruction| CS[context-smuggling]
  C -->|history| MT[multi-turn-ramp]
  C -->|surface form| ET[encoding-trick]
  C -->|continuation| PI[prefix-injection]
  RP --> H[(histogram)]
  IO --> H
  CS --> H
  MT --> H
  ET --> H
  PI --> H
  H --> D[coverage chart]
```

Chaque fichier est un enregistrement, qui contient`id`- Je suis là.`category`- Je suis là.`subtype`- Je suis là.`prompt`- Je suis là.`target_behavior`et `severity` Les éléments de la catégorie sont chargés, les éléments sont classés en fonction des catégories, et sont classés en fonction des catégories.`match`API: donner une indication de candidature, retourner le fichier le plus proche et ses catégories.

La plupart des attaques sont de 2 à 3 points, car les attaques réelles à l'échelle de la déploiement sont généralement simples et volées. La gravité est définie par l'auteur de la déploiement.


```figure
cd-attack-taxonomy
```

## - Je le construis.

La base de données est une liste de Python unique.`code/fixtures.py`Je suis là.`code/main.py`Le centre de classement charge, vérifier chaque classe au moins sept fixes, public `by_category`- Je suis là.`match`et `stats`方法,并提供印直方图的可运行演示──三元余弦是使用 `numpy`Depuis le début de la réalisation.

验证过程检查四个不变量: chaque fixture a une non-vu, indique chaque catégorie du modèle, chaque gravité est en `1..5`Dans le cadre de la mise en place, chaque fixture ID est unique. Les défaillances sont des échecs de hard-out, et non des avertissements, car le reste de la trajectoire dépend de la cohérence interne de la base de données.

## Utilisez-le

De la classe`code/`Actualités`python3 main.py`◊ Cette présentation imprime le nombre de fiches de chaque catégorie, pour`match`运行三个示例探测,并将 `taxonomy.json`写入课程输出文件──下游课程读取 `taxonomy.json`Au lieu d'importer des modules Python, la base de données est donc un artefact stable.

## 发货

`outputs/skill-jailbreak-taxonomy.md`记录了六类和标题――将其视为团队共享词汇――第 87 课程中的每一个线束记录的发现都引用了一个分类ID――

## 练习

1. 添加第七类间接提示注入(instructions emplacées dans le fichier de recherche, plutôt que dans le user-roup次中)  Créer 10 fixes并重新运行验证器──
2. Utilisez le jeton-édition-distance 评分器 pour remplacer le cosine trigramme,并测量现有语料库上匹配分配的变化──
3. De votre propre produit日志( déjà édité) 中提取 30 个附加 fixture,并确认类别分布符合团队的直观预期──

## 关键术语

|术语 |常见用法 |准确含义|
|---|---|---|
|越狱|任何不安全的模型输出 |产生违反既定策略的输出的提示 |
|分类 |类别列表 |攻击者滥用信任边界的攻击分区
|fixture |一个测试示例 |带有类别、严重性和目标行为的 token 提示 |
|严重程度 |输出有多糟糕 |如果攻击成功，影响排名为 1-5 |
|match |检测决定| trigram cosine 的最近 fixture，用于将类别分配给新提示 |

##  ultérieur

Le cours est basé sur la base de la bibliothèque de langage.
