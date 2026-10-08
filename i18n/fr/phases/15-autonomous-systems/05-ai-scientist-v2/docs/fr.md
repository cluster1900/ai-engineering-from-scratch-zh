# Scientifique de l'IA v2  Atelier 级 autodidacte

> L'analyse de l'IA de Sakana v2 (Yamada et coll., arXiv:2504.08066) 运行完整的研究循环:假设、代码、实验、图表、写作、投稿。它是第一个让生成论文通过ICLR 2025 atelier peer review的系统──独立评估 (Beel et coll.) 发现,42% des expériences因编码错误失败,literature review也经常把既有概念错误标记为小说──Sakana 自己的 docs 警告说, cette base de code 会执行 LLM 编写的代码,并建议使用Docker 隔离──这两幅图景共同构成重点──

**Type:** Learn
**Languages:** Python (stdlib, research-loop state-machine toy)
**Prerequisites:** Phase 15 · 03 (AlphaEvolve), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

##  problématique

Le travail est une tâche ouverte. Contrairement à l'algorithme d'AlphaEvolve, le travail de recherche ou d'analyse de la valeur de la recherche, le résultat de l'étude n'est pas vérifiable par un appareil.

AI Scientist v1 (Sakana, 2024)  通过从人类编写的模板 开始来闭合循环──LLM 在固定脚手架内填入实验──AI Scientist v2 (Yamada et al., 2025) 采用带有视觉语言模型 批评循环的代理树搜索,移除了模板 要求──系统会产生想法、实现实验、生成图表、撰写论文,并根据评论员反代──

Révision par les pairs 结论:一篇由 v2 生成的论文被ICLR 2025 workshop 接收(带披露) ・独立评估结论:该系统远不可靠──两者都是真的──

## 概念

### 架构

1. **想法生成。**Le programme de recherche est basé sur des thèmes et des publications déjà disponibles.
2. **新颖性检查。**L'évaluation de Beel et al. a révélé que les méthodes déjà utilisées sont souvent classées comme romanes.
3. **实验计划。**agent 起草实验协议 并编写代码──
4. **执行。**代码在沙盒中运行──失败会反到复试循环── Selon les mesures de Beel et al., 42% des expériences à cette étape ont été échouées en raison d'une erreur de code──
5. **图表生成。**Le modèle de langage de vision 读取生成的图表,并重写它们以提高可读性──这是 v2 关键技术新增点──
6. **写作。**LLM 起草论文,并与内部评审员 代。
7. **可选：投稿。**Le thème a été soumis à un lieu.

### l'atelier 接收结果 signifie quoi

Un article de v2 a été publié par l'intermédiaire de l'étude ICLR 2025. L'auteur a indiqué à la commission du programme la source du document.

重要背景:workshop 论文的门低于主要会议论文──Peer review 噪声很大;在任意一天,都会有一小部分投稿被接收──一次成功是概念的证明,而不是可靠性声明──Nature 2026 论文记录端到端循环,且它本身由人类研究人员共同签署;它不是系统写了一篇 Nature 论文──

### L'évaluation indépendante a découvert ce que

Beel et coll. (arXiv:2502.14297) ont effectué une évaluation externe.

- **实验失败。**42% des expériences en code d'erreur ont échoué, les importations d'erreurs, les désaccords de forme, les variables indéfinis, la boucle de rétractation a capturé une partie, mais pas la totalité.
- **新颖性错误标记。**La littérature-récupération 步骤 souvent considérer les concepts déjà existants comme étant des romans.
- **呈现质量差距。**Les critiques graphiques de langage de vision ont généré des effets visuels de publication, masquant les faiblesses de l'expérience de base.

La dernière découverte de cette phase est la plus importante. Un système de production de produits crédibles n'a pas été développé, il est plus dangereux que le système qui échoue manifestement, mais plus sûr.

### Escape de la boîte à sable

Sakana  son propre référentiel README 警告:

> Comme le logiciel exécutera le code de LLM, nous ne pouvons pas garantir la sécurité. Il existe des paquets dangereux, un accès non contrôlé au Web, ainsi que le risque de générer des processus inattendus.

C'est le mode d'exploitation de l'autonomie dans le domaine non vérifié. L'écriture de code; code de fonctionnement; code peut faire tout ce que le processus est autorisé à faire.

La boîte à sable d'AlphaEvolve est plus facile à lire, car son évaluateur est très proche. La boîte à sable d'AlphaEvolve s'ouvre à des codes ouverts et a des objectifs ouverts.

### V2 Dans la pile de frontière

| System | Target | Output kind | Evaluator | Known failure |
|---|---|---|---|---|
| AlphaEvolve | algorithms | code | unit + benchmark | 受 evaluator 严谨程度限制 |
| DGM | agent scaffolding | code | SWE-bench | reward hacking |
| AI Scientist v2 | research papers | text + code + figures | peer review（弱） | 实验失败、错误标记、润色掩盖弱点 |

Parmi ces trois, l'évaluateur automatique de v2 le plus faible, le plus large, le plus court des chemins d'un artefact ouvert, les contrôles opérationnels (sandbox, review, disclosure) ont assumé la majeure partie du travail de sécurité.


```figure
mx-research-loop
```

## Utilisez-le

`code/main.py`Pour créer une machine d'état, il faut créer un système de gestion de la situation.

- Il y a beaucoup d'idées pour arriver à la phase de publication.
- Il y a beaucoup de messages qui sont cachés dans les articles.
- Les budgets de réessayer  comment faire le bilan entre la qualité et la production 

## Je le livre.

`outputs/skill-ai-scientist-sandbox-review.md`est une liste de contrôle de deux portes, utilisée pour étudier le cycle de l'agent  tout contenu produit  avant de quitter la boîte à sable 

## 练习

1. Utilisation de paramètres de fonctionnement`code/main.py`◊ Quelle est la proportion de cycle de fonctionnement produite par un article ? 干净 ? Quelle est la proportion de production d'un article avec des défauts expérimentaux, mais qui est couvert par des critiques graphiques ?

2. 默认值已使用 Beel et al. 42% / 25%──分别用 `--experiment-failure 0.20 --novelty-mislabel 0.10`et `--experiment-failure 0.60 --novelty-mislabel 0.40`Comment le ratio des deux opérations, polissées mais défectueuses, change-t-il ?

3. 阅读 Sakana's AI Scientist v2 repo README 中关于沙箱 要求的内容──说出两个你会多日自主运行额外施施的限制(Docker 之外)──

4. 阅读Beel et al. Section 4 du contenu de l'écart qualité-présentation.

5. Pour le chercheur-agent 输出 propose un protocole d'examen humain, qui rend son étendue supérieure à  chaque article est écrit par Ph.D. 阅读── pointé de côté ,并围绕它设计──

## 关键术语

| Term | What people say | What it actually means |
|---|---|---|
| AI Scientist v1 | “Sakana 的 templated research agent” | 将实验填入固定 scaffold |
| AI Scientist v2 | “无 template 的 research agent” | 带有 VLM 图表批评的 agentic tree search |
| Agentic tree search | “分支式 research agent” | 并行扩展多个实验计划；由内部 critic 剪枝 |
| Vision-language critique | “对图表进行 VLM 润色” | Multimodal model 读取图表并重写以提高清晰度 |
| Literature retrieval | “新颖性检查” | 搜索 prior work 以确认想法新颖性，并已被记录会发生错误标记 |
| Polish masking | “漂亮论文，破损研究” | 呈现质量超过实验质量；隐藏弱点 |
| Sandbox escape | “LLM 代码逃逸” | agent 执行的代码做了 loop designer 未预期的事情 |

## 延伸阅读

- [Yamada et al. (2025). The AI Scientist-v2](https://arxiv.org/abs/2504.08066) 论文。
- [Sakana blog on the Nature 2026 publication](https://sakana.ai/ai-scientist-nature/) 带有同行评价 背景的供应商总结──
- [Beel et al. (2025). Independent evaluation of The AI Scientist](https://arxiv.org/abs/2502.14297) Numéro d'évaluation du ministère extérieur
- [Sakana AI Scientist v1 paper](https://arxiv.org/abs/2408.06292) 模板化前身──
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy)                                                                                                                                                                                                                                                              
