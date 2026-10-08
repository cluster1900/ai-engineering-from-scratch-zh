# Les outils de l'équipe rouge  Garak, garde des Llama, PyRIT

> Les trois outils de production constituent le cadre de la pile de l'équipe rouge de 2026: Llama Guard (Meta)  un Llama-3.1-8B 分类器, basé sur 14 MLCommons 危害类进行调整; Llama Guard 4 de 2025 est un 12B Multimodal Orig生 分类器, de Llama 4 Scout 剪剪而来来. Garak (NVIDIA)  开源 LLM 漏洞扫描器, fournir des sondes statiques, dynamiques et adaptives, utilisées pour la hallucination, la fuite de données de prison, l'injection de toxines et les ruptures.

**类型：**Construire
**语言：**Python (stdlib, simulateur d'architecture d'outils et simulateur de classification de style Llama Guard)
**先修要求：**Phase 18 · 12-15 (détention et IPI)
**时间：**- 75 minutes

## Objectif de l'apprentissage

- 描述 Llama Guard 3/4 在安全堆 中的位置:input classifier、output classifier,或两者兼具──
- Il y a 14 MLCommons 危害类别,并说明一个不明显的类别 (Code Interpreter Abuse)
- 描述 Garak's probe 架构:probes、détecteurs、harnesses。
- Décrivez la structure de la campagne en plusieurs rounds de PyRIT, ainsi que sa combinaison avec les sondes Garak.

##  problématique

Les leçons 12-15  ont montré les attaques. Les opérations de production nécessitent une évaluation récurrente.

## 概念

### Garde des Llama (Meta)

Llama Guard 3 est un modèle Llama-3.1-8B, pour la classification des entrées et sorties de MLCommons AILuminate 14 个类别  ont été affinées:
- délit violent 非 violent crime 性相关 CSAM  calomnie
- 专业建议、隐私、IP、无差别武器、仇恨
- Décès de code-interprète

支持 8种语言──用法:放在 LLM 之前(input moderation)、LLM 之后(output moderation),或两者都放──两种用法会产生不同的训练分布  Llama Guard 3 以单一模型形式发布,同时处理两者──

Llama Guard 3-1B-INT4 (arXiv:2411.17713, 440MB, 移动 CPU 上约 ~30 tokens/s) est la limite de la taille 变体。

Llama Guard 4 (en anglais: Llama Guard 4 (en anglais: Llama Guard 4 (en anglais: Llama Guard 4 (en anglais: Llama Guard 4]) est un 12B, un modèle multimodale originaire de l'équipe de scout de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'équipe de l'é

### Garak (NVIDIA)

开源漏洞扫描机──架构:
- **Probes.**Utilisé pour les hallucinations, fuites de données, injection rapide, toxicité, jailbreak.
- **Detectors.**Selon le modèle de défaillance prévue pour les sorties, les fuites sont toxiques, les détenus sont cassés.
- **Harnesses.**管理 probe-detector 对,运行运动,生成报告──

TrustyAI va Garak avec les boucliers Llama-Stack ((Prompt-Guard-86M classifiateur d'entrée Llama-Guard-3-8B classifiateur de sortie) intégrer, pour être utilisé de bout en bout avec un objectif protégé 评估。 Scoring basé sur les niveaux (TBSA) 取代二元 pass/fail  Un modèle peut être dans la même sonde sur la sévérité niveau 3, mais dans la sévérité niveau 5 失败。

### Le projet de loi

Python Risk Identification Toolkit ∙多轮 red-team campaigns ∙
- **Converters.**转换一个种子提示  parafrase、encode、translate、rôleplay。
- **Orchestrators.**运行 campagne:Crescendo(升级) TAP(分支) RedTeaming(自定义循环) 
- **Scoring.**LLM-en tant que juge ou classifiant-en tant que juge

PyRIT est un programme de recherche de plus en plus important.

### La pile

Dans le modèle, les deux côtés sont placés sur la Garde des Llama. Chaque soir, le Garak est mis en œuvre, la régression est effectuée.

### évaluer les pièges

- **Judge identity.**Les trois outils peuvent être utilisés par le juge de la LLM; le juge d'étalonnage 会驱动报告的 ASRs (Létion 12)
- **Probe staleness.**Avec le modèle des sondes, les sondes de Garak seront retraitées.
- **Llama Guard 对良性内容的 FPR.**Les élèves de la Garde Lama ont été encouragés à se préparer à des activités de formation en ligne et à des activités de formation en ligne.

### Il est en phase 18 .

Les leçons 12-15 sont des attaques. Les leçons 16 sont des outils de production. Les leçons 17 (WMDP) sont des évaluations des capacités à double usage. Les leçons 18 sont des cadres de sécurité frontaliers, ils mettent ces outils dans la structure de la politique.


```figure
al-guard-stack
```

## Utilisez-le

`code/main.py`Construire un classifiateur de type jouet Llama Guard dans 14 catégories 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个类别 个个类别 个个个类别 个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个个

## Je le livre.

本课会生成 `outputs/skill-red-team-stack.md` Donner une description de déploiement, elle indiquera quels sont les trois outils qui conviennent à chaque outil et quelle cadence de régression doit être mise en œuvre.

## 练习

1. 运行  référencement`code/main.py` Comparer le taux de test des attaques à tour unique et à tour multiple

2. 实现 un nouveau sonde Garak: une base64 编码的有害请求──测量Llama-Guard-style classifier pour sa situation de test──

3. Utilisez un convertisseur "traducer en français, puis paraphraser" 扩展 PyRIT-style chaîne de convertisseurs。重新测量攻击成功率。

4. 阅读Llama Guard 3 的危害类别列表――找到两个类别,在这些类别上训练数据现实中会对合法开发者内容产生较高的虚假阳性率――

5. Comparer Garak 和 PyRIT's Design Principles──论证一个部署场景,其中每个工具分别是正确选择──

## 关键术语

| Term | 人们的说法 | 它实际意味着什么 |
|------|-----------------|------------------------|
| Llama Guard | "the classifier" | 带有 14 个危害类别的 fine-tuned Llama-3.1-8B/4-12B 安全分类器 |
| Garak | "the scanner" | NVIDIA 开源漏洞扫描器；probes、detectors、harnesses |
| PyRIT | "the campaign tool" | Microsoft 多轮 red-team orchestrator；converters、orchestrators、scoring |
| Prompt-Guard | "the small classifier" | Meta 的 86M prompt-injection classifier，与 Llama Guard 配套使用 |
| TBSA | "tier-based scoring" | Garak 的 tier-based pass/fail，用于取代二元结果 |
| Converter chain | "paraphrase + encode + ..." | PyRIT 用于构建多步攻击的组合原语 |
| MLCommons hazard categories | "the 14 taxonomies" | Llama Guard 面向的行业标准分类体系 |

## 延伸阅读

- [Meta — Llama Guard 3 (in Llama 3 Herd paper, arXiv:2407.21783)](https://arxiv.org/abs/2407.21783) 8B 分类器
- [Meta — Llama Guard 3-1B-INT4 (arXiv:2411.17713)](https://arxiv.org/abs/2411.17713) 量化移动端分类器
- [NVIDIA Garak — GitHub](https://github.com/NVIDIA/garak) 扫描器 repo 和文档
- [Microsoft PyRIT — GitHub](https://github.com/Azure/PyRIT) Kit d'outils de campagne
