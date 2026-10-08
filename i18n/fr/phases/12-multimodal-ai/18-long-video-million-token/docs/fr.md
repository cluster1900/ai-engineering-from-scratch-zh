# Contextes de millions de mots 下的长视频理解

> Un film en 4K de 1 heure, 24 FPS, par le biais de patchings et d'embedding, produira environ 6 millions de tokens. Un enregistrement de 2 heures de diffusion de 2 heures de diffusion de 2 heures de diffusion de 2 heures de diffusion de 2 heures de diffusion de 4K de 1 heure de diffusion de 1 heure de diffusion de 24 FPS. Un film en Blu-ray, même avec un regroupement de compression dynamique, aura des centaines de milliers de tokens. Google Gemini 1.5 (mars 2024) a été lancé dans un contexte de 1 000 000 de tokens.

**Type:** Build
**Languages:** Python (stdlib, needle-in-haystack simulator + agentic-retrieval router)
**Prerequisites:** Phase 12 · 17 (video temporal tokens)
**Time:** ~180 minutes

## Objectif de l'apprentissage
- 计算不同 FPS 和聚合下长视频的总视觉标记数量──
- 解释三条扩展路径:brute context(Gemini 1.5) 、 attention à l'attention(LWM) 、compression des jetons(LongVILA / Video-XL) ✿
- Dans le cadre de la mise en œuvre de la stratégie de recherche, les VLM sont utilisés pour la recherche de données.
- Pour 30 minutes vidéo, concevez une aiguille dans un tas de foin 测试,并测量特定分钟处的召回率──

##  problématique
Le patch de taille de Qwen2.5VL est de 384 Tokens. Il est utilisé pour 3x3 combiner 81 Tokens. Il est utilisé pour 1 FPS.

Une partie de 2 heures de film sur 1 FPS est 583k Token。supra-out majority 2026 年开放模型能力; nécessite Gemini 2.5 Pro, ou encore plus activement pour le pooling。

Il y a eu trois élargissements de la route.

## 概念
### Voie 1: contexte brut (Gemini 1.5, Claude Opus)

Utiliser des outils pour résoudre les problèmes.

Gemini 1.5 Pro  lancé  support 1M Token; Gemini 1.5 Ultra  atteindre 10M; Gemini 2.5 Pro de 2026 能可靠处理数小时视频──论文(arXiv:2403.05530) a enregistré un taux de recouvrement de l'aiguille dans un haieau atteignant 99,7% 

工程上: une méthode de mise en œuvre de l'attention auto-définie avec un niveau de stockage local + global + rare, en plus d'un routage d'experts en matière de MoE à long terme.

### 路径 2: Attention à l'appel d'offres (LWM, LongVILA)

Rings attention Placez une longue séquence distribuée sur plusieurs appareils, formant un seul ring, chaque appareil possède une pièce.

LWM(Liu et coll., 2024) a utilisé cette méthode pour former un contexte 1M-Token 模型── entraîner le calcul de la quantité avec le contexte 线性扩展, plutôt que la quadratisation, car le coût carré de l'attention est réparti sur les appareils du milieu de l'anneau──

LongVILA(arXiv:2408.10188)把该模式适配到VLMs──1400 视频,每 192 个代币 = 268k context,并使用8 directions de parallélisme de l'attention à l'anneau 训练──

### 路径 3: Token 压缩 (Vidéo-XL, LongVA)

Pour les étudiants, il est préférable de se concentrer sur la formation professionnelle.

Vidéo-XL(arXiv:2409.14485) utilisant un jeton de résumé visuel: chaque clip contient N   générer un jeton de résumé unique, ce jeton sera présent jusqu'à ce que N                                                                                                                                                                                                                                    

LongVA utilise la technologie de transfert de contexte long, va le contexte LLM de 200k  étendre à 2M.

La compression des jetons utilise la capacité de réception de temps spécifique pour échanger la capacité d'expansion. Le modèle sait généralement ce qui s'est passé, mais parfois il manque de précision.

### 路径 4:Récupération d'agents (VideoAgent)

Ne pas mettre le vidéo complet dans le programme. Au contraire, le vidéo comme base de données, et utiliser le programme pour le consulter.

Je suis un homme de la famille de l'épouse.

1. Le programme de formation en droit est un programme de formation en droit.
2. LLM Soyez en mesure de récupérer des clips 提供相关片段(montrer des segments avec un chat)。
3. L'outil 返回匹配的剪辑时间印──
4. LLM 通过 VLM 读取这些片段──
5. L'organisation de la LLM répond à une demande ou présente une enquête ultérieure.

Il est également possible de faire des recherches sur les différents types de produits de la société.

### Indice de référence de l'aiguille dans un tas de foin

标准 long-context 测试: insérer un marqueur visuel ou texte unique dans une position de choix dans le vidéo, puis poser une requête qui doit être rappelée.

Métrique:跨视频长度和标记位置的 Recall@k。

Le nombre de joueurs de la série Gemini 2.5 Pro est de plus de 90 minutes et il est de plus de 90 à 90 minutes.

Si l'outil est assez bon, le vidéoagent dans 2+ situations peut être adapté ou dépasser le modèle de contexte brut, car la récupération peut être effectuée avec une aiguille.

### Quelle voie choisir ?

Pour une précision de 15 minutes de bord: Open 72B + Orig生 Context

Pour 30 minutes à 1 heure contenu: OpenModelSelect LongVILA ou Video-XL; Closed SourceSelect Gemini 2.5 Pro。

Pour 2+ 小时内容:VideoAgent ou similaire à la récupération 模式──或, résumé en plus petits morceaux,并输入 hiérarchiques résumés──

### Modèle de production 2026

En pratique, les pipelines de production de longs vidéos sont mixtes:

1. Pour l'ensemble du vidéo, le prélèvement dynamique-FPS + le regroupement agressif (en anglais) est exprimé en 100k Token.
2. 传给72B VLM 生成全局摘要──
3. Si l'utilisateur pose des questions, utilisez ce résumé comme index 运行代理检索──

Ceci combine la capacité de compréhension globale et de récupération des détails locaux du contexte brut.


```figure
mm-video-token-budget
```

## Utilisez-le
`code/main.py`- Le numéro de la liste:

- 计算 1 分钟到 3 小时视频在不同 FPS + pooling 下的代币 预算。
- 模拟一次针-in-a-haystack 运行:在随机时刻 注入标记, poser des questions,并评估召回──
- incluant un simulateur de routeur de récupération d'agents, utilisé pour sélectionner des clips spécifiques de VLM ∙

运行预算表, 感受尺度差距──

## Je le livre.
本课产 出 `outputs/skill-long-video-strategy-planner.md` En ce qui concerne la durée et la complexité des requêtes, il est possible de choisir entre le contexte brut, la compression et la récupération agencée, et de calculer le retard + l'anticipation de la qualité.

## 练习
1. Un seul point de vue est le fait que les symboles sont différents.

2. Design aiguille dans un tas de foin 测试: tu vas insérer le marqueur dans les premières minutes, préciser la formule de requête est quoi?

3. Dans un premier temps, le film est en cours de production.

4. Le coût de la mémoire de l'attention sur les anneaux est augmenté en fonction de la longueur de la ligne, ainsi que du nombre d'appareils.

5. Qu'est-ce que vous avez trouvé dans le recouvrement des jetons 1M et 10M ?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Brute context | “只是更多 Token” | 将 LLM context 扩展到数百万 Token；一次性处理所有内容 |
| Ring attention | “LWM-style parallel” | 分布式 attention 模式：每个设备持有一个 chunk 并轮转 |
| Token compression | “Summary tokens” | 在进入 LLM 前，通过 learned compressor 减少每个 clip 的 Token |
| Needle-in-haystack | “NIH test” | 在随机位置插入唯一 marker，在测试时要求模型回忆它 |
| Agentic retrieval | “LLM as query planner” | LLM 向 retrieval tool 请求相关 clips，通过 VLM 读取它们，并组织答案 |
| VideoAgent | “Retrieval pattern for video” | 规范的 agentic-retrieval 设计：question -> tool -> clip -> answer |

## 延伸阅读
- [Gemini Team — Gemini 1.5 (arXiv:2403.05530)](https://arxiv.org/abs/2403.05530)
- [Liu et al. — LWM / RingAttention (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Xue et al. — LongVILA (arXiv:2408.10188)](https://arxiv.org/abs/2408.10188)
- [Shu et al. — Video-XL (arXiv:2409.14485)](https://arxiv.org/abs/2409.14485)
- [Wang et al. — VideoAgent (arXiv:2403.10517)](https://arxiv.org/abs/2403.10517)
