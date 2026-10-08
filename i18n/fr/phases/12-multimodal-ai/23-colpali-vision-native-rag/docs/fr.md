# ColPali et le document RAG de vision natif

> Tradition RAG va utiliser les PDF pour résoudre des textes, les couper en morceaux, les emplacer en morceaux, et les stocker dans des vecteurs. Chaque étape va perdre un signal: OCR va perdre des données de graphique, couper en morceaux des lignes de table, les emplacements de texte va ignorer les chiffres. ColPali, Fayse et al., juillet 2024) pose une question plus simple: pourquoi doit-il retirer des textes? directement par PaliGemma pour faire une image de page, faire une emplacement, utiliser une interaction tardive à la mode Colbert, faire une récupération, et conserver tous les fichiers, les figures, les polices et le signal de formatage.

**Type:** Build
**Languages:** Python (stdlib, multi-vector indexer + MaxSim scorer)
**先修要求：**Phase 11 (LLM Engineering  RAG 基础), phase 12 · 05 (LLaVA)
**Time:** ~180 minutes

## Objectif de l'apprentissage

- 解释双码码检索 (每个文档一个矢量) 和迟互动检索 (每个文档多个矢量) 的区别──
- Décrivez l'opération MaxSim de ColBERT, ainsi que la façon dont ColPali la transforme des jetons de texte en patchs d'image.
- Construire un index de type ColPali:page → patch embeddings → query term embeddings 上的 MaxSim → top-k pages。
- Comparer les factures / rapports financiers cas d'utilisation 中的 ColPali + Qwen2.5-VL générateur avec texte-RAG + GPT-4──

##  problématique

Les résultats du rapport médical sont généralement indiqués dans les images annotées. Le bloc de signature du contrat juridique est un fait de mise en page, et non un fait de texte.

L'équipement de transport de gaz

1. PDF → texte par le biais de la RCR / pdftotext。
2. Text → 300 à 500 pièces de jetons
3. Chunk → bi-encodeur Embedding(一个矢量)。
4. Recherche d'utilisateur → Embedding → cosine similarity → top-k chunks。
5. Les élèves + les étudiants → LLM。

五个有损步骤──图表 捕获不到──tableaux 被块 打断──multi-colonne layout 被展平──numéro annotations 消失──

ColPali 的修复方式:跳过 OCR,直接对页面图像做做嵌入──使用ColBERT style late interaction做检索,让模型在查询时间 关注细粒度补丁──

## 概念

### Le projet de loi

ColBERT(Khattab & Zaharia, arXiv:2004.12832) est une méthode de récupération de texte. Elle ne se produit pas pour chaque document, mais pour chaque jeton.

- Les jetons de requête  obtenir leurs propres emplacements  N_q Vecteurs)
- Les jetons de document  obtenez des emplacements  N_d Vecteurs, généralement cachés)
- Score = pour les jetons de requête 求和, chaque jeton de requête 取所有文档 jetons 中 cosine similarity 的最大值:Σ_i max_j cos(q_i, d_j) 』

C'est l'opération MaxSim. Chaque requête de jeton sera sélectionnée pour le jeton de document le plus approprié.

优点:remember 强,能处理 term-level semantics。缺点: chaque document 需要 N_d vecteurs, storage 昂贵。

### ColPali

ColPali(Faysse et al., arXiv:2407.01449) va appliquer le modèle ColBERT aux images

- Chaque page est réalisée par PaliGemma (ViT + langage)
- Chaque requête utilisateur (text) est codée pour les emblèmes de jetons de requête: N_q Vecteurs。
- Score = Σ_i max_j cos(q_i, p_j),也就是在查询文字标记和页面图像补丁 上做MaxSim。
- 通过 total score retrieval top-k pages。

Pendant le temps d'ingestion de documents: utilisez PaliGemma pour chaque page faire Embedding, stockage de tous les emplacements de patch. Pendant le temps de requête: pour les jetons de requête faire Embedding, pour tous les emplacements de page déjà stockés.

优点: Dans des documents riches en visuels, haut, bout à bout par rapport au texte-RAG High 20-40%── chaque vecteur de correction 捕获局部布局和内容──

缺点: chaque page N_p patches × 4 bytes flottantes × D-dim Vecteurs = stockage 增长很快──可通过 PQ / OPQ quantization 缓解──

### ColQwen2 et ColSmol

ColQwen2 (Illinois-tech, 2024-2025) va remplacer PaliGemma par Qwen2-VL.

ColSmol est une variante à plus petite échelle pour l'utilisation locale / de bord.

### VisRAG

VisRAG(Yu et al., arXiv:2410.10594) est une autre variante: ne pas en patches 上 faire MaxSim, mais en utilisant VLM pour former chaque page en un vecteur, puis faire un recouvrement bi-encodeur――indexer plus rapidement, stockage plus petit, mais rappeler plus faible――

Compromise qualité-coût: la qualité est prioritaire avec ColPali, la taille est prioritaire avec VisRAG。

### M3DocRAG

M3DocRAG(Cho et al., arXiv:2411.04952) va étendre la récupération multimodal à la raisonnement multi-page multi-document.

### VidoRe  référence

Les tâches de ColPali sont les suivantes: évaluation de la récupération de documents visuels, évaluation des rapports financiers, documents scientifiques, documents administratifs, dossiers médicaux, manuels, évaluation des documents visuels.

ColPali-v1 en ViDoRe est d'environ 80% nDCG@5; le même lot de documents est de 50 à 60%

### L'équipement de gaz de gaz de base de bout en bout

pour les RAG natifs de la vision:

1. 摄取:PDF → 页面图像 → PaliGemma codage → 存储所有补丁嵌入式──
2. 查询: user文本 → emblèmes de jetons de requête → Pour toutes les pages déjà indexées exécuter MaxSim → top-k 页面。
3. 生成:top-k 页面图像 + query → VLM(Qwen2.5-VL ou Claude)→ 答案。

Il n'y a pas de code de détection.

### Mathématiques de stockage

Un rapport financier de 50 pages, par page 729 patches, 128 dimensions:

- ColPali:50 * 729 * 128 * 4 octets = ~18 MB brut,PQ 后 ~4 MB。
- Text-RAG:50 morceaux * 768-dim * 4 octets = ~150 kB。

ColPali: En cas de taille, le stockage de chaque document peut être réduit à environ 5 à 10 fois, généralement acceptable.

### Text-RAG 仍然胜出的场景

- 没有布局信号的纯文本文档(wiki articles、聊天日志) ――Text-RAG 更简单,存储 更便宜──
- 存储主导成本的数百万页的档案──
- 严格监管要求在检索旁边保留可提取的OCR文本──

 Pour les autres scénarios de l'année 2026, à savoir les rapports financiers, les documents scientifiques, les contrats juridiques, les dossiers médicaux, la documentation UX, la vision de la RAG 胜出──


```figure
mm-maxsim
```

## Utilisez-le

`code/main.py`- Le numéro de la liste:

- Encodeur de patch de jouet:将一个"page"(small feature vectors 网格)映射为 patch embeddings array。
- Scorer MaxSim: calculer le jeu d'intégration de jetons de requête et le jeu de correctifs de page entre les scores de style ColBERT。
- Indices 5 pages de jouets,运行 3 requêtes,并返回带分的顶点k。

## Je le livre.

本课会产出 `outputs/skill-vision-rag-designer.md` donner un document-RAG 项目, choisir ColPali / ColQwen2 / VisRAG / text-RAG,并估算存储──

## 练习

1. Un rapport annuel de 200 pages, 729 patches par page, 128 emb, 4 bytes flottantes, calcul de stockage brut et de stockage comprimé en PQ, 8x.

2. MaxSim est Σ_i max_j cos(q_i, p_j) ・・・ cette demande et la capture de quelles similitudes simples de la moyenne  capture de l'information ?

3. ColPali va référencer les pages pour les ensembles de correctifs. Si on change pour le niveau de mot, qu'est-ce qui va changer ?

4. Pour un corpus de 1M de pages  conception de pipeline de bout en bout, budget de latence de requête  500ms ⋅ choisir ColQwen2 / VisRAG 并说明理由──

5. 阅读 M3DocRAG(arXiv:2411.04952)。 décrire le modèle d'attention multi-pages, ainsi que la différence avec la récupération ColPali d'une seule page。

## 关键术语

| Term | 人们常说 | 它的实际含义 |
|------|-----------------|------------------------|
| Late interaction | "ColBERT-style" | 使用 per-token 或 per-patch embeddings + MaxSim 做 retrieval，而不是 single doc Vector |
| MaxSim | "Max-over-patches" | 对每个 query token，选择 similarity 最高的 document token；跨 query 求和 |
| Bi-encoder | "Single-vector" | 每个 document 一个 Vector；更快，但会丢失粒度 |
| Multi-vector | "Many-vectors-per-doc" | 每个 document / page 存储 N_p Vectors；storage cost 增长，但 recall 提升 |
| Patch embedding | "Page feature" | 来自 VLM encoder 的每个 image patch 的一个 Vector，按页 cached |
| ViDoRe | "Vision doc bench" | ColPali 用于 visual document retrieval 的 benchmark suite |
| PQ quantization | "Product quantization" | 在缩小 storage 约 8x 的同时保持 Vector similarity 的压缩方法 |

## 延伸阅读

- [Faysse et al. — ColPali (arXiv:2407.01449)](https://arxiv.org/abs/2407.01449)
- [Khattab & Zaharia — ColBERT (arXiv:2004.12832)](https://arxiv.org/abs/2004.12832)
- [Yu et al. — VisRAG (arXiv:2410.10594)](https://arxiv.org/abs/2410.10594)
- [Cho et al. — M3DocRAG (arXiv:2411.04952)](https://arxiv.org/abs/2411.04952)
- [illuin-tech/colpali GitHub](https://github.com/illuin-tech/colpali)
