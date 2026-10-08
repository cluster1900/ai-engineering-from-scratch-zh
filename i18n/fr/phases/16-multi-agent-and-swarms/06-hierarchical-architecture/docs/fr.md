# Architcture hiérarchique  et mode défaillance

> La hiérarchie est un superviseur en jeu. Les agents de gestion sont à la tête des sous-gérants.`Process.hierarchical`Il est un livre.`manager_llm`动态委派任务并验证输出──Langgraph 中的等价形式是 `create_supervisor(create_supervisor(...))` Lorsque la tâche elle-même est réelle, c'est un schéma naturel.  Elle est aussi le schéma le plus facile à tomber en panne de la boucle de gestion: les agents de gestion déploient des tâches mal, mal interprètent les sous-produits, ou ne peuvent pas parvenir à un consensus.

**类型：**apprendre + construire
**语言：**Python (stdlib)
**前置要求：**Phase 16 · 05 (pattern de superviseur)
**时间：**- 60 minutes

##  problématique

Une fois que vous avez compris le modèle de superviseur, l'étape suivante de la nature est: si les travailleurs sont eux-mêmes des superviseurs, les équipes ont des sous-équipes, les entreprises ont des départements.

Le problème réside dans: les gestionnaires de LLM et les gestionnaires humains ne sont pas les mêmes. Les gestionnaires humains ont des expériences de base.

## 概念

### 形态

```
                 Manager
                 ┌─────┐
                 └──┬──┘
           ┌────────┴────────┐
           ▼                 ▼
       Sub-Mgr A         Sub-Mgr B
       ┌─────┐           ┌─────┐
       └──┬──┘           └──┬──┘
         ┌┴──┬──┐          ┌┴──┐
         ▼   ▼  ▼          ▼   ▼
       W1  W2  W3         W4  W5
```

Chaque élément interne est un plan, délégué et synthétisé.

### 适用场景

- **清晰的 org mapping。**Si le vrai devoir est de la section, la hiérarchie est définitive.
- **Local summarization。**Chaque sous-gérant va voir le supérieur de son équipe avant de synthétiser les résultats de son équipe.

### 失效位置

2026 années post mortem 持续发现三种故障模式:

1. **Task assignment error。**Le gestionnaire 读取目标,幻觉出一个分解,并委派给错误的副管理员──由于副管理员会顺从地处理收到的任务, l'erreur ne se produit que lors de la synthèse de haut niveau, la distance entre l'homme et sa position est déjà distincte de la surface de la surface de la surface.
2. **Output misinterpretation。**Sous-gérant 返回ne peut pas vérifier la réclamation X──Top manager 总结为claim X non confirmé──含义在每一层都会漂移──
3. **Consensus loops。** Deux sous-gérants  opinions non concordantes; le chef supérieur  exige qu'ils se réconcilient; ils se déléguent vers le bas; les travailleurs 重新运行; les sous-gérants 返回略有不同的答案;循环开始──CrewAI 的 `Process.hierarchical`Il faut mettre des limites à ce niveau, mais cette limite est devenue un hyperparamètre.

###  décisions

Sequentielle (→ lignes directrices) vs hiérarchique: votre tâche a vraiment un groupe de sous-groupes indépendants, c'est aussi un processus de ligne de l'arbre ?

### Réalisation de l'Equipage

`Process.hierarchical`Général manager LLM 接在专业团队 之上──Manager 会:

- 接收 tâche de haut niveau,
- Répartition des sous-tâches aux équipages,
- évaluer les résultats de l'équipage,
- Je décide d'accepter, de ré-déléger ou de réitérer.

文档:https://docs.crewai.com/en/introduction（在Concepts fondamentaux (voir ci-dessous "Processus hiérarchiques")

### Réalisation de LangGraph

LangGraph utilise le schéma `create_supervisor`Pour le débogage, c'est plus clair que CrewAI, mais il est plus difficile de réformer les mouvements de l'arbre.

 référence:https://reference.langchain.com/python/langgraph-supervisor。


```figure
swarm-hierarchy-token
```

## - Je le construis.

`code/main.py`运行一个3 niveaux de hiérarchie:

- Le directeur général: les tâches seront divisées en "ingénierie" et "justice",
- sous-gérant de l'ingénierie: décomposer en travailleurs "frontaux" et "arriérés",
- Directeur juridique: un travailleur.

Démo contre le bon chemin**perturbed path**: décomposition du chef de file va être " juridique " 错标为 " finance ", puis observer err err err errore级联: sous-gérant 顺从地执行财务 工作, top synthesizer 报告财务发现, original legal question 没有得到答――

运行:

```
python3 code/main.py
```

输出会展示两条路径,并清晰并排对比what was asked和what was delivered──

## Utilisez-le

`outputs/skill-hierarchy-fitness.md`评估给定任务应使用层次级,顺序,还是平面监督者――输入:task description、org structure、调整预算――输出:pattern recommendation,并包含需要防范的具体故障模式――

##  La publier

Si vous publiez des hiérarchiques:

- **将 tree depth 限制在 2。**Les trois niveaux sont déjà cachés dans l'observabilité.
- **明确 reconciliation budget。**Le directeur de la configuration doit effectuer les tours maximaux de la précédente.
- **每次 synthesis 都要有 provenance。**Le résumé de chaque point doit être cité pour produire ses résultats.
- **对 decomposition drift 告警。**记录每一步 manager's decomposition; avec la requête utilisateur faire différence.

## 练习

1. 运行  référencement`code/main.py`Il faut que le gestionnaire de niveau de la main-d'œuvre, la sortie de haut niveau, soit complètement déconnecté de l'utilisateur.
2. 添加第三层(上 → sub → sub → worker) ―― Avec la profondeur 增长, mesure perturbé chemin 多常会自我修正,以及多常会完全偏离──
3. Dans chaque sous-gérant 处实现一个"canary" worker, il a toujours reçu un problème d'utilisateur original inchangé.
4. 阅读 CrewAI `Process.hierarchical`文档──识别 CrewAI 应用一个具体 guardrail(步骤限制、管理者_llm constraint),并描述它针对的失败模式──
5. Comparer les superviseurs LangGraph de la mise en place avec les hiérarchiques de CrewAI.

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Hierarchical | "Org chart pattern" | supervisors 位于 supervisors 之上；只有叶子节点执行工作。 |
| Manager LLM | "The boss" | 在内部节点执行 decomposes、assigns 和 validates 的 LLM。 |
| Decomposition drift | "The boss lost the plot" | Top manager 的拆分不再覆盖原始问题。 |
| Reconciliation loop | "Endless meetings" | Sub-managers 意见不一致；top re-delegates；workers re-run；循环直到 budget 耗尽。 |
| Depth-2 ceiling | "Don't go deeper than 2 levels" | 经验性 guardrail：3+ 层会让 observability 坍塌。 |
| Canary question | "Ground truth at every level" | 一个始终收到未改动原始 query 的 worker，用于检测 drift。 |
| Provenance chain | "Who said what" | 从每次 synthesis 回溯到产生它的 leaf outputs 的 trace。 |

## 延伸阅读

- [CrewAI introduction — Process.hierarchical](https://docs.crewai.com/en/introduction) 带有经理 LLM 的教科书式等级
- [LangGraph supervisor reference](https://reference.langchain.com/python/langgraph-supervisor)- Je suis là.`create_supervisor`实现嵌套 superviseur
- [Anthropic engineering — Research system](https://www.anthropic.com/engineering/multi-agent-research-system)Pourquoi l'anthropique a-t-il choisi un superviseur plat plutôt que hiérarchique ?
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Taxonomie MAST; chapitre sur les défaillances de coordination enregistré décomposition dérive
