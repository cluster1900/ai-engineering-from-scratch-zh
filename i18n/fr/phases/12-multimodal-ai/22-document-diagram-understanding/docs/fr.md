# 文档与图表理解

> Le document n'est pas une photo, mais un PDF, un article scientifique, un échange de billets ou une liste de manuels qui contient des lignes, des lignes, des notes, des pages et des structures, ce qui est une série de lignes directes: Tesseract OCR + LayoutLMv3 + 表格抽取演学, VLM 浪潮使用 OCR-free models 取代它, Donut (2022) Nougat (2023) DocLLM (2023)  模型 能直接输出结构化标记.

**Type:** Build
**Languages:** Python (stdlib, layout-aware document parser skeleton)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 5 (NLP)
**Time:** ~180 minutes

## Objectif de l'apprentissage

- 解释文件 AI 的三个时代:OCR pipeline、OCR-free、VLM-native。
- 描述 LayoutLMv3 的三类输入流:文本、布局(bbox) 、图像补丁,以及统一掩饰──
- Pour les autres, il est nécessaire de prendre en compte les données de l'équipe de formation de la formation.
- Pour une nouvelle tâche, choisir le modèle de document (en chinois: 发票,科学论文,手写表单,中文票据)

##  problématique

 Comprendre ce PDF possède une situation trompeuse.

- 文本内容(90% des signaux)
- Layout (page 眉 脚注 侧  双 格式)
- Pour les autres, il est nécessaire de prendre des mesures pour les aider à atteindre leur objectif.
- 图形和图表──
- Je suis en train de faire une série.
- 字体与排版(标题 vs 正文) ⋅

Le système de vote de l'OCR doit savoir "Total: $1,245" du coin inférieur droit, plutôt que du coin inférieur.

## 概念

### Époque 1  pipeline OCR(2021 年前)

La pile de classiques:

1. PDF → Chaque page de l'image
2. Les textes sont définies comme étant des textes de référence.
3. L'analyseur de mise en page identifie les blocs de titre, table, paragraphe)
4. Reconnaisseur de structure de table 解析表格。
5. Règles de domaine + régex 抽取字段。

适用于干净的印刷文本――遇到手写、倾斜扫描、复杂表格、非英语文字会崩――Tous les modes d'échec nécessitent un chemin d'exception autodéfinie――

### Régime de contrôle des risques

TrOCR(Li et al., arXiv:2109.10282) utilisé en synthèse + TRUE textbook image on train de transformateur encodeur-décoeur, remplacé Tesseract 经典 CNN-CTC── il a obtenu un avantage clair sur les textes à la main et multilingues── il est toujours un pipeline(détecteur puis TrOCR puis mise en page), mais les étapes OCR ont considérablement amélioré──

### Époque 2  exempte de RCO

La première série de modèles sans OCR est: complètement surpasser la détection, directement mettre des pixels d'image 映射为结构化输出──

Les résultats de l'enquête ont été obtenus par le Comité de la sécurité sociale.
- Transformateur de décodeur-encodeur, le décodeur est Swin-B.
- output peut être utilisé pour exprimer un JSON uniquement compris ∞ pour le résumé de la marquage, ou tout schéma de tâche spécifique ∞
- Il n'y a pas de détection.

Nougat ((Blecher et al., arXiv:2308.13418):
- 专门在科学论文上训练──
- 输出是 LaTeX / démarrage
- 处理 équations 多 layout 图片
- Chaque parseur d'archives a un modèle à utiliser.

Ce sont des spécialistes, pas des généralistes.

### L'élaboration de l'équipe

另一条路线──LayoutLMv3(Huang et al., arXiv:2204.08387) conserve le RCR, mais ajoute une compréhension de la mise en page:

- 3 catégories de flux de saisie: Tokens de texte OCR, boîtes de délimitation 2D de chaque token, patchs d'image.
- 跨三种 modalités                                                                                                                                                                                                                                                            
- Les tâches suivantes: classification, extraction d'entités, tableau QA

LayoutLMv3 est basé sur la compréhension des documents OCR 峰── il est très fort sur les émissions et les émissions .

### DocLLM (2023)

DocLLM(Wang et al., arXiv:2401.00908) est le frère de LayoutLM. Il est basé sur des jetons de mise en page  conditions de génération de réponses de forme libre。

### Époque 3  VLM-native(2024+)

Les VLM de 2024 sont déjà assez bons, ils peuvent remplacer complètement le pipeline.

- LLaVA-NeXT 336-tile AnyRes  adapté à des petits archives
- Qwen2.5VL résolution dynamique Orig生 traitement de 2048+ pixels
- Claude Opus 4.7 支持 2576px 文档。
- PaliGemma 2(2025 年 4 月) spécialisé dans le document + Handwriting Training。

La différence entre le VLM-natif et le OCR-pipeline s'accroît rapidement.

- Textes de scène ((手写 + 印刷,混合文字体系)
- 包含合并单元格的复杂表格──
- Intégrer des équations mathématiques dans le texte.
- Les chiffres de la population

Les pipelines OCR sont encore en vigueur dans les aspects suivants:

- Pure analyse de la charge de travail à grande échelle, dont chaque page est très importante
- L'équipe de recherche a été chargée de préparer des projets de recherche et de développement.
- 需要可审计 OCR 监管环境的输出――

### Claude 4.7 / GPT-5

Dans les 2576 pixels natifs, les VLM de première ligne peuvent réaliser des recherches approximatives de la précision humaine.

- DocVQA:Claude 4.7 ~95.1,PaliGemma 2 ~88.4,Nougat ~77.3,Pipélé LayoutLMv3 ~83。
- Le tableau QQ:Claude 4.7 ~92,2,GPT-4V ~78
- Le projet de loi de l'Union européenne sur les droits de l'homme

 la différence entre les modèles de source fermée et de base de l'LLM  la taille  7B  les modèles de source ouverte  sont en cours de développement 

### Équations mathématiques et LaTeX 输出

Il est possible de générer des traductions de laTeX disponibles. Il n'y a pas de formation de laTeX évidente.

Le projet de loi de 2026: prévoir la mise en œuvre de la loi de 2026 sur la gestion des ressources humaines.

### écrit

Ceci est toujours la tâche la plus difficile. Les VLM ne sont toujours que des VLM qui sont en cours de mise à niveau.

### Récipitée 2026

pour les nouveaux projets de document-IA:

- Édition de la série Lv3 + règles, coût élevé
- 混合文档(科学 + 手写 + 表单):VLM-native(PaliGemma 2 ou Qwen2.5-VL)
- 完整 arXiv ingestion:Nougat 处理数学,VLM 处理 chiffres。
- 监管场景:OCR pipeline + VLM validateur Utilisé pour le contrôle de la liaison


```figure
mm-doc-layout
```

## Utilisez-le

`code/main.py`- Le numéro de la liste:

- Un joueur de la version de mise en page-conscient de la mise en page:给定 (text, bbox) paires, générer LayoutLMv3 风格输入。
- Un générateur de schéma de tâche de donut: utilisé pour l'écriture unique du modèle JSON.
- Comparer les budgets de jetons OCR-pipeline, Donut, Nougat et VLM-native à chaque page.

## Je le livre.

本课产 出 `outputs/skill-document-ai-stack-picker.md` donner une définition d'un projet de document-IA  domaine, échelle, qualité, réglementation), entre un spécialiste libre de la RCO et un VLM-natif  faire le choix entre un pipeline OCR

## 练习

1. Votre projet traite 10 millions de pages par jour. Quel type de pile peut minimiser les coûts par page en cas de perte de précision ?

2. Pourquoi la mise en page de LMv3 dans la forme QA est-elle meilleure que les CLIP-VLMs, mais dans le texte de scène, la performance est-elle plus mauvaise ?

3. Nougat 生成 LaTeX── propose un cas d'utilisation de test de Nougat 胜出, ainsi qu'un cas d'utilisation de Nougat 胜出.

4. 阅读 PaliGemma 2 paper(Google, 2024)── Comparé à PaliGemma 1, élever le taux de précision des documents

5. construire un hybride réglementaire-sécurisé: pipeline OCR en tant que principale, VLM en tant que contrôle croisé secondaire.

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|-----------------|------------------------|
| OCR pipeline | "Tesseract-style" | 分阶段 stack：detect -> OCR -> layout -> rules；确定性、脆弱 |
| OCR-free | "Donut-style" | 跳过显式 OCR 的 image-to-output transformer；单一 model |
| Layout-aware | "LayoutLM" | 输入包含逐 token bbox coordinates；跨 modalities 的统一 masking |
| VLM-native | "Frontier VLM" | 直接把 page image 以高分辨率输入 Claude/GPT/Qwen VLM；无 pipeline |
| DocVQA | "Doc benchmark" | Document VQA 标准；最常被引用的分数 |
| Markup output | "LaTeX / MD" | 结构化输出格式，而不是 free-form text；支持下游自动化 |

## 延伸阅读

- [Li et al. — TrOCR (arXiv:2109.10282)](https://arxiv.org/abs/2109.10282)
- [Blecher et al. — Nougat (arXiv:2308.13418)](https://arxiv.org/abs/2308.13418)
- [Huang et al. — LayoutLMv3 (arXiv:2204.08387)](https://arxiv.org/abs/2204.08387)
- [Kim et al. — Donut (arXiv:2111.15664)](https://arxiv.org/abs/2111.15664)
- [Wang et al. — DocLLM (arXiv:2401.00908)](https://arxiv.org/abs/2401.00908)
