# Les compétences et les compétences

> Voyager (Wang et coll., TMLR 2024) va être utilisé comme un code de compétence.

**类型：**Construire
**语言：**Python (stdlib)
**先修：**La phase 14 · 07 (MemGPT), la phase 14 · 08 (blocs de retard)
**时间：**- 75 minutes

## Objectif de l'apprentissage

- Il s'agit de trois composants du Voyager: programme d'études automatique, bibliothèque de compétences, incitation à l'iteration, et il décrit leur rôle.
- Expliquez pourquoi Voyager va créer un code de conception spatiale plutôt que des commandes originales.
- Utilisation de la formation et de l'éducation
- Mettre en place le modèle de Voyager jusqu'en 2026 avec les compétences du SDK et du système de gestion de compétences de l'agent Claude.

##  problématique

Chaque séance est un agent capable de reconstruire tout, il commettra trois types d'erreurs:

1. **浪费 Token。**Chaque mission sera réintroduite avec les mêmes suggestions.
2. **丢失进展。**La modification de la session A ne sera pas transférée à la session B。
3. **无法处理长程组合。**Les tâches complexes nécessitent un niveau de capacité; une seule prise de vue rapide ne peut pas les exprimer.

Voyager répond à cette question: considérer chaque capacité réutilisable comme un bloc de code nommé stocké dans la base de données, par la recherche de similitude, par la combinaison avec d'autres compétences et par l'amélioration continue.

## 概念

### Trois composants

Voyager (arXiv:2305.16291) 围绕以下内容组织代理:

1. **Automatic curriculum。**Le proposant, poussé par la curiosité, sera en fonction de l'agent actuel.
2. **Skill library。**Chaque compétence est exécutable. Une nouvelle compétence est ajoutée après le succès de la tâche.
3. **Iterative prompting mechanism。**Lorsque vous échouez, l'agent recevra l'exécution de l'erreur, l'environnement et l'autodétermination, puis améliorera cette compétence.

Minecraft 评估(Wang et al., 2024): comparaison avec la ligne de base, des objets uniques de plus de 3,3 fois, des outils en pierre 快 8.5 fois, des outils en fer 快 6.4 fois, des cartes à travers la distance de 2,3 fois.

### 动作空间 = 代码

La plupart des agents 输出原始命令──Voyager 输出 JavaScript 函数──一个技能是:

```
async function craftIronPickaxe(bot) {
  await mineIron(bot, 3);
  await mineStick(bot, 2);
  await placeCraftingTable(bot);
  await craft(bot, 'iron_pickaxe');
}
```

By子 Skill 组合而成── selon la description 和 Embedding 作为关键存储──作为程序被检查,而不是作为提示──

C'est le 2026 Claude Agent SDK: un code à récupérer, ajouter à l'agent

### Qualification

Une nouvelle tâche est de faire une piquette en diamant.

1. Pour la description des tâches  effectuer l'intégration 
2. Renseignez-vous sur les compétences, et obtenez les meilleures.
3. 检索  référencement`craftIronPickaxe`- Je suis là.`mineDiamond`- Je suis là.`placeCraftingTable`Ça va.
4. Utiliser le test de la langue originale + le nouveau logiciel

C'est le mode de réalisation des ressources MCP (Phase 13) et des compétences SDK d'Agent: effectuer des recherches sur la surface de connaissances/code, et se limiter à la portée des tâches en cours.

### 代改进

Le cycle de Voyager:

1. Agent, écrivez une compétence.
2. Apprendre à travailler dans un environnement.
3. 返回三种信号之一:`success`- Je suis là.`error`(avec des traces de pile)`self-verification failure`Il y a une autre.
4. L'agent utilise ce signal comme compétence de réécriture.
5. 循环 jusqu'à succès ou à atteindre le nombre maximal de rounds.

C'est l'auto-réfinition (leçon 05) est appliquée à la génération de codes, et utilise l'environnement pour la mise en œuvre de la technologie.

### Programme et exploration

Le module du programme de Voyager sera basé sur ce que l'agent  déjà possédé                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

Pour l'agent de production, cela se transforme en un opérateur: "Qu'est-ce qui manque ?"

### Ce mode est facile à faire

- **Skill library rot。**Une même compétence est utilisée avec une description légèrement différente.
- **Composed-skill drift。**Les compétences de père dépendent d'un enfant qui a été amélioré par la suite. Donner des compétences pour faire une version; fixé à v1.
- **Retrieval quality。**随着技能库增长到几百以上,基于技能描述的矢量检索 会退化──使用标签过器 和硬约束补充(只有技能与 `category=tooling`) 


```figure
voyager-skills
```

## - Je le construis.

`code/main.py`实现 une base de compétences:

- `Skill` nom, description, code, version, étiquettes, dépendances
- `SkillLibrary` enregistrer, rechercher, superposer des tokens, composez, composez, améliorez et améliorez
- Un agent de script: inscrire trois compétences originales, assembler la quatrième, rencontrer une défaite, puis améliorer.

运行:

```
python3 code/main.py
```

Les résultats de l'étude ont été obtenus en fonction des résultats obtenus par l'étude de l'analyse de l'analyse de l'évolution de l'échantillon.

## Utilisez-le

- **Claude Agent SDK skills**(Anthropic)  2026 参考: chaque compétence a une description、code 和 instructions;
- **skillkit**(npm: skillkit)  面向 32+ agents de codage par IA 跨 agent Skill 管理。
- **Custom skill libraries**  domaines spécifiques                                                                                                                                                                                                                                                             
- **OpenAI Agents SDK `tools`** 低配版本; chaque outil est une compétence léger.

## Je le livre.

`outputs/skill-skill-library.md`Il va créer une base de compétences en forme de Voyager, pour un objectif de fonctionnement.

## 练习

1. Je vous en donne .`compose()`- Une fois que l'expérience A dépend de B, et que B dépend de A, qu'arrivera-t-il ?
2. 实现每个技能的版本固定──当父技能组合子技能 `crafting@1`时,对 `crafting@2`Le changement ne peut pas être fait.
3. Pour la récupération de jetons-surlappes, le système de récupération de jetons est remplacé par des embeddings de transformateurs de phrases.
4. 添加一个课程代理:给定当前库和一个域名描述,提出 5 个缺失技能──每周调用一次──
5. 阅读Anthropic's Claude Agent SDK skill docs... Le projet de la bibliothèque de jouets 移植 à SDK's skill scheme...

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Skill | “可复用能力” | 带有 description 的命名代码块，可通过相似度检索 |
| Skill library | “agent 的 how-to 记忆” | Skill 的持久化存储，可搜索、可组合 |
| Curriculum | “任务 proposer” | 由当前能力缺口驱动的自底向上目标生成器 |
| Composition | “Skill DAG” | Skill 调用 Skill；执行时进行拓扑排序 |
| Iterative refinement | “自我修正循环” | Env 反馈 + 错误 + 自验证，会折回到下一个版本中 |
| Action-space-as-code | “程序化动作” | 输出函数，而不是原始命令，用于时间跨度更长的行为 |
| Dedup on write | “Skill collapse” | 近重复 description 会合并为一个 canonical Skill |

## 延伸阅读

- [Wang et al., Voyager (arXiv:2305.16291)](https://arxiv.org/abs/2305.16291) 原始 Bibliothèque des compétences 论文
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) les compétences de 2026   产品化形态
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)  compétences en pratique et subagents
- [Madaan et al., Self-Refine (arXiv:2303.17651)](https://arxiv.org/abs/2303.17651) cycle de modification du niveau de base du Voyager
