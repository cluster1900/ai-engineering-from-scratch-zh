# 基准测试: WebArena et OSWorld

> WebArena dans quatre applications autonomes 能力.OSWorld dans Ubuntu, Windows, macOS 能力.

**类型：**Apprendre à apprendre
**语言：**Python (stdlib)
**先修要求：**Phase 14 · 19 (banque de la SWE, GAIA)
**时间：**À environ 60 minutes.

## Objectif de l'apprentissage

- Décrivez les quatre applications de gestion de WebArena et pourquoi une évaluation basée sur l'exécution est importante.
- Expliquez pourquoi OSWorld utilise un véritable système d'exploitation 截图, plutôt que des API d'accessibilité.
- Découvrez deux modes de défaillance OSWorld principaux: la mise à terre de l'interface utilisateur et les connaissances opérationnelles.
- 总结 OSWorld-G 和 OSWorld-Human 基础基准 之上增加了什么──

##  problématique

Les agents de type général peuvent-ils utiliser des outils. Ils peuvent-ils effectuer 20 clics dans le navigateur, pour effectuer une seule vérification des achats ? Ils peuvent-ils seulement configurer un ordinateur Linux avec un clavier et une souris ?

## 概念

### Le projet de développement de l'entreprise est prévu pour la période de référence.

- 覆盖四个自主管理网应用程序的812长程任务: 购物网站,论坛,类 GitLab的开发工具,商业 CMS,
- Il existe d'autres outils pratiques: carte, calculateur, scratchpad.
-  évaluer par APIs de gym  basé sur l'exécution réalisée: les commandes sont-elles déjà en cours, la question est-elle ou non déjà fermée, la page CMS  est-elle mise à jour ?
- 发布时: Le meilleur agent GPT-4 atteint un taux de réussite de 14,41%, tandis que l'homme atteint 78,24%.

L'auto-administration est importante car l'application cible est fixe et réalisable, de sorte que le benchmark ne sera pas instable en raison de changements externes.

### 扩展

- **VisualWebArena** 视觉 grounding 任务, succès dépend de la lecture de l'image 截图作为一等观察)
- **TheAgentCompany**(décembre 2024)  加入 terminal + codage;更像真实的远程工作环境。

### OSWorld (Xie et coll., NeurIPS 2024)

- 覆盖 Ubuntu、Windows、macOS 个 369 个真实计算机任务──
- Pour une application réelle, le contrôle des claviers et des souris est libre.
- É 1920×1080 截图 comme observation
- 发布时: le meilleur modèle est de 12,24%, l'homme de 72,36%.

### Principaux modes d'échec

1. **GUI grounding。**Pixel → élément 映射──Model 很难在 1920×1080 中可靠定位 UI 元素──
2. **Operational knowledge。**哪个菜单里有这个设置,哪个键盘快捷键,哪个偏好窗口──这是人类多年积累出来的知识长尾──

### 后续工作

- **OSWorld-G** 564 个样本的地面积套装 + Jedi training set──将地面积与规划 拆解开来,因此可以分别测量──
- **OSWorld-Human**  人工整理的黄金行动轨迹──显示顶级代理 使用的步骤比必要步骤多 1.4-2.7x(l'écart de trajectoire-efficacité)──

### Pourquoi c' est important ?

Claude utilisation de l'ordinateur 、OpenAI CUA、Gemini 2.5 Utilisation de l'ordinateur  Leçon 21) Toutes les activités de travail réalisées par WebArena et OSWorld   

### Benchmarking 容易出错的地方

- **仅截图 evals。**OSWorld est décrit par le détecteur; si l'évaluation de l'utilisation d'un agent d'API DOM ou d'accessibilité par OSWorld est effectuée, il est possible de se passer de la mise à terre ⋅
- **忽略 trajectory length。**En fonction du taux de réussite, il manquerait de 1,4-2,7 fois les étapes de l'exposition OSWorld-Human.
- **陈旧的自托管 apps。**Les applications WebArena ont fixé une version spécifique; si elles ne sont pas réorganisées sur la version mise à jour, elles détruiront leur compatibilité.


```figure
ae-agent-human-gap
```

## - Je le construis.

`code/main.py`实现 un harnais de jouet web-agent:

- Une petite application de shopping est en cours de mise en vente.
- 3 trajectories d'or de la mission
- Un agent scripté pour chaque tâche.
- 基于执行的评估器 (en anglais seulement) 基于执行的评估器 (en anglais seulement) 基于状态检查 (en anglais seulement) 和轨迹效率指标 (en anglais seulement) 基于执行的评估器 (en anglais seulement) 基于状态检查 (en anglais seulement) 和轨迹效率指标 (en anglais seulement) 基于执行的评估器 (en anglais seulement) 基于执行的评估器 (en anglais seulement) 基于状态检查 (en anglais seulement) 基于状态检查 (en anglais seulement) 基于状态检查) 和轨迹效率指标 (en anglais seulement) 基于轨迹效率指标 (en anglais seulement) 基于轨迹效率指标 (en anglais seulement) 基于轨迹效率指标 (en anglais seulement) △

Je vais le faire.

```
python3 code/main.py
```

输出: taux de réussite et efficacité de la trajectoire de chaque mission, pour répondre aux méthodes OSWorld-Human

## Utilisez-le

- **WebArena Verified**Autotérance dans le cluster interne, pour une évaluation continue.
- **OSWorld**运行在 VM fleet, utilisé par des agents de bureau.
- **Computer-use agents**(Létion 21)  Claude、OpenAI CUA、Gemini  都在类似的工作负载上训练──
- **你自己的产品流程** Pour les 20 missions les plus importantes, capture de trajectoires d'or; chaque semaine, utilisez-les en tant qu'agent de test.

## Je le livre.

`outputs/skill-web-desktop-harness.md`Construire un harnais d'agent web/desktop, contenant des mesures d'évaluation et d'efficacité de la trajectoire basées sur l'exécution.

## 练习

1. Utiliser une deuxième application pour développer le harnais de jouets.
2. En plus de l'efficacité de la trajectoire de l'enquête, dans votre jeu, l'agent est-il de l'or ?
3.  réaliser un distracteur outil, à savoir la trajectoire de l'or                                                                                                                                                                                                                                                   
4. Comment distinguer les échecs de mise au sol et les échecs de planification dans vos évaluations ?
5. Lisez les applications de WebArena Lisez-moi... Quand vous mettez à niveau une version fixe d'une application, que détruira-t-elle ?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| WebArena | "Web agent benchmark" | 覆盖 4 个自托管 apps 的 812 个任务；gym-style evaluation |
| VisualWebArena | "Visual WebArena" | 视觉 grounding 的 WebArena；截图是 observations |
| OSWorld | "Desktop agent benchmark" | 在真实 Ubuntu/Windows/macOS 上的 369 个任务 |
| GUI grounding | "Pixel-to-element mapping" | Model 在 1920x1080 中定位 UI 元素 |
| Operational knowledge | "OS know-how" | 哪个菜单、哪个 shortcut、哪个 preference pane |
| OSWorld-G | "Grounding suite" | 564 个仅 grounding 样本 + training set |
| OSWorld-Human | "Gold trajectories" | 用于衡量效率的人工专家动作序列 |
| Trajectory efficiency | "Steps over gold" | Agent 步数除以人类最小步数 |

## 延伸阅读

- [Zhou et al., WebArena (arXiv:2307.13854)](https://arxiv.org/abs/2307.13854) Quatre applications de référence web
- [Xie et al., OSWorld (arXiv:2404.07972)](https://arxiv.org/abs/2404.07972) 跨 OS référencement de bureau
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) Claude  塑造能力
- [OpenAI, Computer-Using Agent](https://openai.com/index/computer-using-agent/) OSWorld et WebArena
