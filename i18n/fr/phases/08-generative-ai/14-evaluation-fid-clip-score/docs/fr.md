# évaluer  FID、CLIP Score、 préférences humaines

> Chaque classement de modèles générés cite le score FID, CLIP, ainsi que le taux de victoire des préférences humaines. Chaque chiffre a un modèle d'échec utilisé par les chercheurs. Si vous ne comprenez pas ces modèles d'échec, vous ne pouvez pas distinguer entre une amélioration réelle et une mise à jour de fonctionnement.

**类型:**Construire
**语言:**Python
**先修:**La phase 8 · 01 (taxonomie), la phase 2 · 04 (métrie d'évaluation)
**时间:**- 45 minutes

##  problématique

Les modèles de production sont généralement jugés en fonction de la qualité de l'échantillon et de la conformité des conditions. Les deux ne sont pas de dimension de clôture.

- **FID (Fréchet Inception Distance)。**Dans l'espace de caractéristiques du réseau d'initiation, la distance entre la répartition réelle et la distribution générée est plus faible que la répartition.
- **CLIP score。**生成图像的Clip-image Embedding与快速的Clip-text Embedding 之间的相似性──越高越好──衡量快速 遵循度──
- **人类偏好。**Dans le même ordre d'idées, faites en sorte que les deux modèles soient confrontés à la décision, faites en sorte que les humains (GPT-4) choisissent un meilleur, réassemblent et composent le score Elo.

Vous verrez également: IS(score d'initiation, fondamentalement déjà retiré) 、KID、CMMD、ImageReward、PickScore、HPSv2、MJHQ-30k── chacune a modifié un certain point d'échec de l'indicateur précédent──

## 概念

![FID, CLIP, and preference: three axes, different failure modes](../assets/evaluation.svg)

### FID  样本质量

Heusel et al. (2017)。步骤:

1. Pour N 张真像和 N 张生成图像提取 Inception-v3 fonctionnalités (2048-D) ⋅
2. Pour chaque pile de l' un Gaussian: calculer la moyenne`μ_r, μ_g`et la co-variance `Σ_r, Σ_g`Il y a une autre.
3. FID = `||μ_r - μ_g||² + Tr(Σ_r + Σ_g - 2 · (Σ_r · Σ_g)^0.5)`Il y a une autre.

解释:特征空间中两个多变量 Gaussian 之间的 Fréchet distance──越低 = 分布越相似──

失效模式:
- **小 N 时有偏。**FID est une moyenne de la distribution des caractéristiques en carré 计算,小 N 会低估共差,给出虚假的低 FID──始终使用 N ≥ 10,000──
- **依赖 Inception。**Inception-v3 训练于 ImageNet──远离 ImageNet's domain ([[人脸、艺术、文字图像) ) générera une FID sans signification── en utilisant un extracteur de fonctionnalités dans un domaine spécifique──
- **刷分。**过拟应Inception préalable peut obtenir un faible FID sans amélioration de la qualité visuelle.

### Score CLIP  prompt 遵循度

Radford et coll. (2021)。 Pour un image générée + prompt:

```
clip_score = cos_sim( CLIP_image(x_gen), CLIP_text(prompt) )
```

Pour 30 000 images générées en moyenne →  obtenir une quantité comparable entre les modèles.

失效模式:
- **CLIP 自身的盲点。**Le modèle peut être très bien classé dans le classement CLIP, mais ne suit pas vraiment un prompt complexe.
- **短 prompt 偏差。**短 prompt 在野外有更多 CLIP-image 匹配──长 prompt 的 CLIP score 会机械性降低──
- **prompt 刷分。**Dans le prompt, ajouter " haute qualité, 4K, chef-d'œuvre " augmentera le score CLIP, mais ne fera pas l'amélioration du lien de texte.

CMMD (Jayasumana et coll., 2024) a réussi à résoudre certains des problèmes suivants: utiliser les caractéristiques CLIP plutôt que d'Inception, utiliser la disparité moyenne maximale plutôt que de Fréchet.

### Les préférences de la vérité

选择一组 prompt──用模型 A 和模型 B 生成──把成对结果展示给人类 (或强 LLM judge)──将胜负聚合成 Elo 或 Bradley-Terry score──Bachmark:

- **PartiPrompts (Google)**:1,600 个多样化 prompt, 12 个类别
- **HPSv2**:107k 个人类标注, largement utilisé comme agent d'automatisation
- **ImageReward**Une image rapide de 37 000 images, sous licence MIT.
- **PickScore**: Basé sur les préférences de Pick-a-Pic 2.6M 訓練──
- **Chatbot-Arena-style image arenas**- Le numéro de la liste:https://imagearena.ai/Et d'autres plateformes.

失效模式:
- **judge 方差。**Les préférences des non-experts et des spécialistes sont différentes.
- **prompt 分布。**Le choix de la famille est très rapide.
- **LLM-judge reward hacking。**Le juge GPT-4 sera délicieux mais trompeur de résultats.

## 组合使用

Le rapport d'évaluation de la classe de production doit contenir:

1. Sur 10 à 30 000 échantillons, pour les échantillons réels,
2. Dans le même groupe de échantillons et leur prompt, le score CLIP / CMMD (conformité)
3. Dans le cas de l'imagerie, le taux de victoire est calculé en fonction de la taille de l'imagerie.
4. 失效模式分析:随机抽取 50 输出,标记已知问题 (): 失效模式分析:随机抽取 50 输出,标记已知问题 (): 失效模式分析:随机抽取 50 输出,标记已知问题) 标记已知问题 (): 失效模式分析:随机抽取 50 输出,标记已知问题) 标记: 失效模式分析:随机抽取 50 输出,标记已知问题 (): 失效模式分析:随机抽取 50 输出,标记已知问题,标记已知问题,标记已知问题,标记已知问题,标记: 失效模式分析,标记数一致性,标记数一致性,标记: 失效率, 失效率率, 失效率, 失效率, 失效率, 失效率, 失效率, 失效率, 失效率, 失效率, 失效率, 失效率, 失效率, 失效率, 失效率, 失效率, 失效率

Tout indicateur unique est un mensonge.


```figure
gx-fid-distributions
```

## 动手构建

`code/main.py`Dans le synthèse des "vecteurs de fonctionnalités" pour réaliser FID, classe CLIP-score et Elo 聚合 (WEB nous utilisons le vecteur 4D comme remplacement des fonctionnalités d'Inception)

- La différence de taille est la différence de taille.
- La similitude cosine entre les poches sera considérée comme un "score CLIP".
- De la règle de mise à jour de l'Elo de synthèse des préférences.

### 步骤 1: Quatre étapes pour réaliser le FID

```python
def fid(real_features, gen_features):
    mu_r, cov_r = mean_and_cov(real_features)
    mu_g, cov_g = mean_and_cov(gen_features)
    mean_diff = sum((a - b) ** 2 for a, b in zip(mu_r, mu_g))
    trace_term = trace(cov_r) + trace(cov_g) - 2 * sqrt_cov_product(cov_r, cov_g)
    return mean_diff + trace_term
```

### 步骤 2: CLIP 风格 de similitude cosine

```python
def clip_like(image_feat, text_feat):
    dot = sum(a * b for a, b in zip(image_feat, text_feat))
    norm = math.sqrt(dot_self(image_feat) * dot_self(text_feat))
    return dot / max(norm, 1e-8)
```

### 步骤 3: Elo 聚合

```python
def elo_update(r_a, r_b, winner, k=32):
    expected_a = 1 / (1 + 10 ** ((r_b - r_a) / 400))
    actual_a = 1.0 if winner == "a" else 0.0
    r_a_new = r_a + k * (actual_a - expected_a)
    r_b_new = r_b - k * (actual_a - expected_a)
    return r_a_new, r_b_new
```

## 常见陷

- **N=1000 时的 FID。**Dans le N=10k, le démarrage est indépendant.
- **跨分辨率比较 FID。**La taille de l'initiation de 299×299 changera la distribution des caractéristiques.
- **只报告一个 seed。**Au moins trois graines de semences sont produites.
- **通过 negative prompts 抬高 CLIP score。**Certains pipelines seront passées par une demande de mise en œuvre afin de renforcer le CLIP.
- **prompt 重叠导致 Elo 偏差。**Si deux modèles ont déjà vu un prompt de référence pendant l'entraînement, il n'a aucun sens.
- **人类 eval 的付费众包偏斜。**Prolific、MTurk 标注者偏年轻 / 技术友好──与招募的艺术/设计专家混合使用──

## Utilisez-le

Protocole d'évaluation de la production pour l'année 2026:

| 支柱 | 最低要求 | 推荐 |
|--------|---------|-------------|
| 样本质量 | 10k 上相对 held-out real 计算 FID | + 5k 上 CMMD + 按类别子集计算 FID |
| prompt 遵循度 | 30k 上计算 CLIP score | + HPSv2 + ImageReward + VQA-style question answering |
| 偏好 | 200 个相对 baseline 的盲测成对样本 | + 2000 paired human + LLM-judge + Chatbot Arena |
| 失效分析 | 50 个手动标记 | 500 个手动标记 + automated safety classifier |

Les quatre piliers du même rapport = 主张──任何单独一个 = 营销──

## 交付

保存 `outputs/skill-eval-report.md` Apprendre à recevoir un nouveau point de contrôle de modèle + ligne de base, et à produire un plan d'évaluation complet: sample quantity, indication, défaillance des modèles, critères de base,

## 练习

1. **Easy.**运行  référencement`code/main.py` La différence de taille de rapport N=100 par rapport à la différence de FID N=1000 dans la même distribution synthétique
2. **Medium.**基于 synthétique CLIP-style fonctionnalités 实现 CMMD 公式见 Jayasumana et al., 2024)  Compare avec FID la sensibilité aux différences de qualité 
3. **Hard.**复现 HPSv2 设置: de Pick-a-Pic's一个子集中取 1000 个图像-prompt pairs, basé sur des préférences de réglage fin, un petit scorer basé sur CLIP,并测量它与持久的集合的一致性──

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| FID | "Fréchet Inception Distance" | 对真实与生成 Inception features 拟合 Gaussian 后的 Fréchet distance。 |
| CLIP score | "Text-image similarity" | CLIP image 与 text Embeddings 之间的 cosine similarity。 |
| CMMD | "FID's replacement" | CLIP-feature MMD；偏差更小，无 Gaussian assumption。 |
| IS | "Inception score" | Exp KL(p(y|x) || p(y))；在现代模型上相关性差，已退役。 |
| HPSv2 / ImageReward / PickScore | "Learned preference proxies" | 在人类偏好上训练的小模型；用作自动 judge。 |
| Elo | "Chess rating" | 成对胜负的 Bradley-Terry 聚合。 |
| PartiPrompts | "The benchmark prompt set" | Google 策划的 1,600 个 prompt，覆盖 12 个类别。 |
| FD-DINO | "Self-sup replacement" | 使用 DINOv2 features 的 FD；更适合 ImageNet 之外的领域。 |

## 生产注记:évaluation et déduction

Pour une base SDXL de 50 étapes de l'unité L4 sur 10242, c'est environ 11 heures d'inférence à la demande unique.

- **尽力 batch，忘掉 latency。**Évaluation hors ligne = effectuer des batches statiques sur la plus grande taille de la capacité de stockage.`num_images_per_prompt=8`调用 `pipe(...).images`, l'horloge murale par rapport à une seule demande 快 4-6×.
- **缓存真实 features。**Pour l'extraction de fonctionnalités de mise en œuvre (FID) ou de CLIP (CLIP-score, CMMD)`.npz`Ne pas réévaluer chaque évaluation.

对于CI / regression gates: chaque PR 在500-échantillon 子集上运行 FID + CLIP score(~30 min); chaque soir运行完整 10k FID + HPSv2 + Elo。

## 延伸阅读

- [Heusel et al. (2017). GANs Trained by a Two Time-Scale Update Rule Converge to a Local Nash Equilibrium (FID)](https://arxiv.org/abs/1706.08500) FID 论文。
- [Jayasumana et al. (2024). Rethinking FID: Towards a Better Evaluation Metric for Image Generation (CMMD)](https://arxiv.org/abs/2401.09603) CMMD。
- [Radford et al. (2021). Learning Transferable Visual Models from Natural Language Supervision (CLIP)](https://arxiv.org/abs/2103.00020)- Je suis désolé.
- [Wu et al. (2023). HPSv2: A Comprehensive Human Preference Score](https://arxiv.org/abs/2306.09341) HPSv2。
- [Xu et al. (2023). ImageReward: Learning and Evaluating Human Preferences for Text-to-Image Generation](https://arxiv.org/abs/2304.05977) ImageReward。
- [Yu et al. (2023). Scaling Autoregressive Models for Content-Rich Text-to-Image Generation (Parti + PartiPrompts)](https://arxiv.org/abs/2206.10789) PartiPrompts。
- [Stein et al. (2023). Exposing flaws of generative model evaluation metrics](https://arxiv.org/abs/2306.04675) enquête en mode défaillance。
