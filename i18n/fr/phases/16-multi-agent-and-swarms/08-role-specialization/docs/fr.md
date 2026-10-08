# 角色专业化  Planificateur, critique, exécuteur, vérificateur

> La décomposition multi-agents la plus commune de 2026: un agent responsable de la planification, de l'exécution, de la critique ou de l'évaluation.`Code = SOP(Team)` ChatDev (arXiv:2307.07924) 通过"chat chain" 串联设计者、程序员、评论员、测试员,并使用"communicative dehallucination"(agents 明确请求缺失细节)  Verifier 是承重角色:Cemri et al. (MAST, arXiv:2503.13657) 表明, chaque multi-agent 失败 可以追溯到缺失或损坏的验证称──PwC 报告,在 CrewAI使用结构化验证循环 后,准确率提升10% 7×( → 70%) 

**类型：**Apprendre + construire
**语言：**Python (stdlib)
**先修：**La phase 16 · 04 (modèle primitif), la phase 16 · 05 (superviseur)
**时间：**- 60 minutes

##  problématique

Les trois codateurs du groupe de discussion écrivent trois types de code similaires. Vous pouvez ajouter plus d'agents, ajouter plus de tours, mais vous ne pouvez toujours pas franchir la porte de qualité.

修复方法不是更多的代理,而是*不同的*代理――分配不同角色――给Critic 配备Planner 没有的工具――给Verifier一个客观的测试套――这样的系统就拥有带有基底纠正的内部分歧,而不是只是并行猜测――

## 概念

### Quatre rôles canoniques

**Planner.**阅读目标,产出步列或规范──Tools:reprise de connaissances、docs──Output:plan structuré──

**Executor.**Une fois que vous avez lu un article, vous avez pu le lire.

**Critic.**根据 Planner 的意图审阅执行人的输出──Tools:对文物的仅读访问、静态分析──Output:accept/refuse,并给出原因──

**Verifier.**读取 artefact 并运行确定性检查──Tools: test runner、type checker、schema validator──Output:pass/fail,并附证──

Le critique est subjectif, il a des opinions, généralement basé sur le LLM. Le vérificateur est objectif, il est déterminant, généralement basé sur le code.

### Le schéma de métaGPT

MetaGPT (arXiv:2308.00352) va générer des SOPs de logiciel 编码为 rôle:

- **Product Manager**编写 PRD。
- **Architect**产出 conception du système
- **Project Manager**- Je suis désolé.
- **Engineer** réaliser 
- **QA Engineer**Les tests de fonctionnement

Chaque rôle a un schéma d'entrée/sortie strict.`Code = SOP(Team)`Cette expression signifie: les SOP de détermination transformeraient un ensemble de LLM en un pipeline prévisible.

### Déhallucination communicative de ChatDev

ChatDev  ajouter un moteur clé: lorsque l'exécuteur  besoin d'un plan   pas de détails spécifiques, il continuera à demander clairement avant de continuer le concepteur 

实现方式:role prompt 包含当你需要未被提供具体信息时,在产出输出 之前按名称询问相关角色──

### Pourquoi le vérificateur est le plus important

Cemri et coll. (MAST) ont suivi 1642 échecs d'exécution multi-agents. Sur ceux-ci, 21,3% sont des lacunes de vérification. Le système a fourni une réponse sans qu'aucun homme ait vérifié. Les 79% restants sont généralement remontés à un seul contrôle.

PwC  rapport称(CrewAI déploiements, 2025), rejoindre le cycle de validation structurée 后, le taux de précision est passé de 10% 提升到70%── un rôle 带来了7x 提升──

### Critic vs vérificateur

- Le critique est l'examen de l'art de la qualité de l'art de la loi.
- Le vérificateur est utilisé dans le processus de détermination de l'artéfact.

两者都用──Critical 能捕捉 Verifier 无法表达的品味问题──Verifier 能捕捉 Critical 看不到的 bug,因为这些 bug 只有在运行时间才会出现──

### Répondre

Chaque rôle dans le système est un LLM, et chaque rôle produit un "bon pour moi". C'est le mode de défaillance classique MAST.

### Cartographie du cadre

- **CrewAI** `Agent(role, goal, backstory)`C'est une surface de spécialisation typique.
- **LangGraph** les nœuds peuvent avoir des instructions spécialisées; les extrémités  pipeline d'exécution obligatoire。
- **AutoGen** Dans le GroupeChat, utiliser avec un seul mot de passe 
- **OpenAI Agents SDK** Dans les rôles des agents spécialisés 之间 utiliser des outils de remise de main 


```figure
swarm-roles
```

## Construction

`code/main.py` Réaliser un pipeline à 4 rôles pour construire une simple fonction Python:

- **Planner**产出 spec¬¬
- **Executor**C'est une chaîne de code.
- **Critic**(SIMULATION de la LLM) 标记明显问题──
- **Verifier**Dans la boîte à sable`exec`) dans le cas de test 运行生成的代码──

Demo 运行两次:一次执行者 产出正确代码(Critique + vérificateur 都通过),一次执行者 产出偏离规范的代码(Critique 漏掉 bug,因为它看起来合理;Verifier 捕捉到 bug,因为测试 失败)

运行:

```
python3 code/main.py
```

## Utilisation

`outputs/skill-role-designer.md`接收一个任务,并产出角色名单 (rôle) ∼3-5 个角色) ∼ schema de sortie/entrée de chaque rôle, ainsi que vérificateur de vérification──在把代理 接入框架 之前使用它──

## 交付

Liste de contrôle:

- **至少一个确定性 Verifier。**Il n'y a pas de diplôme.
- **每个 role 都有明确 I/O schema。**Le planificateur 返回 spec, et non la prose;Executor 读取该 schema。
- **Communicative dehallucination。**Lorsque l'information est manquante, l'exécuteur doit interroger le planificateur; il ne doit pas y avoir de rédaction.
- **Critic/verifier 顺序。**Précédent: pré-exécution de la procédure de vérification (précédent: pré-exécution de la procédure de vérification)
- **Loop budget。**En cours de révision, le critère-exécuteur a été révisé à deux reprises.

## 练习

1. 运行  référencement`code/main.py`, observer Verifier 如何捕捉批评漏掉的 bug──添加一个静态分析检查(统计 `return`En tant que vérificateur supplémentaire, il peut capturer les problèmes de test de temps de course.
2. 添加第 5 个角色:"Analyst des exigences",把用户愿望转换为Planner-ready spec――quelles sont les demandes de déhallucination communicatives 应该上流向它?
3. 阅读 MetaGPT Section 3 ("Agent") ――列出 MetaGPT 5 个角色中每个角色的输入/输出方案──
4. 阅读ChatDev's diagramme de chaîne de chat(arXiv:2307.07924 Figure 3)  Identifier la déhallucination communicative dans laquelle une boucle sans fin serait interrompue 
5. Le taux de précision de 7 fois de PwC est augmenté par des boucles de vérification. Il y a trois étapes supplémentaires de vérification.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Role specialization | "Different agents, different jobs" | 针对 Planner/Executor/Critic/Verifier roles 调优的不同 system prompts。 |
| SOP pattern | "Encoded standard operating procedure" | MetaGPT 的 framing：每个 role 的严格 I/O schemas 将 team 转换为 pipeline。 |
| Communicative dehallucination | "Ask before inventing" | ChatDev pattern：当细节缺失时，Executor 会询问 Planner，而不是自行编造。 |
| Critic | "LLM reviewer" | 主观、有观点的 reviewer。捕捉品味问题。可能被看似合理的 prose 欺骗。 |
| Verifier | "Deterministic check" | 基于 code 的 pass/fail。Test runner、type checker、schema validator。不会被欺骗。 |
| Verification gap | "No one checked" | MAST failures 的 21.3%。答案在没有能捕捉 bug 的 check 的情况下被交付。 |
| Revision loop | "Critic sends it back" | Critic rejection 会触发 Executor 带 feedback 重新运行。需要 budget。 |
| All-LLM anti-pattern | "Looks good to me" | 每个 role 都是 LLM，没有确定性 check。经典 MAST failure。 |

## 延伸阅读
- [Hong et al. — MetaGPT: Meta Programming for Multi-Agent Collaboration](https://arxiv.org/abs/2308.00352) PPS-as-role-prompt  référence
- [Qian et al. — Communicative Agents for Software Development (ChatDev)](https://arxiv.org/abs/2307.07924) Chaîne de chat + déhallucination communicative
- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) Taxonomie MAST; les lacunes de vérification pourcentage de défaillances de 21,3%
- [CrewAI docs — Agent roles](https://docs.crewai.com/en/introduction) surface spécifique de rôle de production
