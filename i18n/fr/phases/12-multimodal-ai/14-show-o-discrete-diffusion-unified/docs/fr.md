# Show-o 和 Discrète-Diffusion 统一模型

> Transfusion 混合连续和离散表示。Show-o(Xie et al., 2024 年 8 月)走的是另一条路:text tokens 使用因果下代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代代

**Type:** Learn
**Languages:** Python (stdlib, masked-discrete-diffusion sampler)
**Prerequisites:** Phase 12 · 13 (Transfusion)
**Time:** ~120 minutes

## Objectif de l'apprentissage
- Expliquer la diffusion discrète masquée: un type de jetons de masque pré-médiatiques, refaire le transformateur, rétablir leur calendrier.
- From speed and quality on comparer并行image decoding(Show-o, MaskGIT) avec le décoding d'image autorégressif(Chameleon, Emu3)。
- Disons que le show-o est traité dans un point de contrôle.
- 选择一种 schéma de masquage ((cosine、linear、truncated),并推理它对样品质的影响──

##  problématique
La transfusion à deux pertes est efficace, mais la dynamique est plus difficile: la perte de diffusion continue et la perte de NTP discrète se situent sur différentes échelles numériques.

La réponse à la montre est: maintenir deux modes sont dispersées, mais par diffusion discrète masquée et générer des images, plutôt que par génération ordonnée. L'objectif de l'entraînement devient une seule prédiction de jeton masqué, elle se généralise naturellement la prédiction de jeton suivant.

## 概念
### Diffusion discrète masquée (MaskGIT)

Origini Chang et al. (2022) 技巧 MaskGIT 技巧很优雅──从一个完全蒙面的图像 开始(每个代币都是特殊的`<MASK>`Il est possible de prévoir tous les Tokens masqués, puis de conserver le maximum de prévisions, de masquer le reste de la partie.

训练很简单: de [0, 1] à [0, 1] en moyenne, il s'agit d'un ratio de masquage, il est appliqué aux jetons VQ de l'image, il s'agit de la partie de formation de transformateur 恢复被 masquer.

### Un transformateur, une masque hybride.

Show-o 将 MaskGIT 放进因果语言模型变压器──Mask Attention 如下:

- Les textes:causal (standard LLM)
- Tokens d'image: dans le bloc d'image 内 entièrement bidirectionnel((Les Tokens masqués sont en cours de prévision et vous pouvez voir tous les autres Tokens d'image)。
- Text-to-image: texte attend jusqu'à des images précédentes, image attend jusqu'à des textes précédents

訓練在以下任务之间交换:
1. NTP standard sur la séquence de texte
2. T2I 样本:text → image, utiliser des jetons d'image masqués 和 jetons masqués-prédition Perte。
3. VQA 样本:image → text, utilisez des jetons de texte masqués ((本质上就是 NTP) ⋅

统一 Perte est `<MASK>`Les jetons sont en entropie croisée, elle couvre simultanément le texte NTP (seulement le dernier jeton est masqué) et l'image masquée-diffusion (随机子集被 masqué)

### Prise d'échantillons parallèles

Show-o avec environ 16 étapes pour générer une image, plutôt que 1000 étapes pour chaque jeton autorégressif) ou 20 étapes pour diffuser)

Pour le rapport:
- Chameleon / Emu3(对 Tokens autorégressive):N_tokens 次 前行,通常每张图 1024-4096 次。
- Transfusion: une transfusion continue: environ 20 étapes, chaque étape une fois un Transformer complet passe.
- Diffusion discrète masquée: environ 16 étapes, chaque étape une fois un transformateur complet passe-passer.

Dans un modèle de taille plus proche, Show-o est plus rapide que le chameau; il correspond à la taille des étapes de transfusion, tout en réduisant le coût par étape.

### Les tâches effectuées à un seul point de contrôle

Show-o 在推理时支持四类任务,由快速格式 选择:

- Génération de texte: standard de sortie de texte autorégressif
- VQA:image dans, texte à l'extérieur
- T2I: texte dans, par diffusion discrète masquée 输出 image。
- Peinture:输入带有部分 Masked Tokens 的图像,并填充──

En peinture  capacité de prédiction masquée  entraînement, presque gratuit.

### Calendrier de masquage

Chaque étape démasquer 多少 Tokens 的时间表 会塑造质量──Show-o 推 cosine:

```
mask_ratio(t) = cos(pi * t / (2 * T))   # t = 0..T
```

第 0 步, tous les Tokens sont masqués(ratio 1.0)。第 T 步, aucun Tokens est masqué。Cosine va se concentrer sur les ratios du milieu, où la prédiction a le plus d'informations。Les calendriers linéaires sont également disponibles, mais plus rapidement pénétrer dans le plateau。

### Le spectacle

Le programme de suivi de l'année 2025 (ArXiv 2506.15564) a étendu son programme de recherche sur la technologie de l'enseignement supérieur.

### Là où se trouve Show-o

Dans la taxonomie de 2026:

- Les jetons discrets + NTP:Chameleon、Emu3──简单但推理慢──
- Les jetons discrets + diffusion masquée:Show-o、MaskGIT、LlamaGen、Muse。并行采样, mais encore sous la perte de Tokenizer 限制。
- Continu + Diffusion: transfusion, MMDiT, DIT, qualité maximale, entraînement plus complexe
- Un flux continu + correspondant dans un VLM:JanusFlow、InternVL-U──最新路线──

按任务选择:当你想在一个开放模型中同时获得T2I + inpainting + VQA,并且速度合理时,选择 Show-o;当质量最重要且你能承担两损管道时,选择转化――


```figure
masked-diffusion-unmask
```

## Utilisez-le
`code/main.py`模拟 Prélèvement d'échantillons:

- Une grille de jouets contenant 16 jetons VQ.
- Une simulation Transformer, elle est basée sur le prompt 和当前 démasqué Tokens 预测 logits。
- Utilisez le calendrier cosine faire 8 étapes et faire des échantillonnages masqués.
- 打印中间状态 (évolution du motif de masque)

- Je vais le faire.

## Je le livre.
本课产 出 `outputs/skill-unified-gen-model-picker.md`△ donner un besoin de compréhension △ VQA, sous-titres) △ nécessiter une génération △ T2I, peinture) de produits, et avoir des poids ouverts 约束, il sera dans la famille Show-o、Transfusion/MMDiT famille 和 Emu3 / Chameleon famille 之间做选择,并给出具体 trade-offs。

## 练习
1. La diffusion discrète masquée est terminée en 16 étapes. Pourquoi pas en 1 étape ? Si vous démasquez tout le contenu en 0 étapes, quel problème se pose ?

2. Utilisation de diffusion masquée 时,inpainting 几乎是免费的──提出一个产品用例(真实或假设), parmi lesquels la peinture de Show-o 胜过专业模型──

3. Calendrier cosine vs calendrier linéaire: suivre T=8 时 chaque étape du nombre de jetons démasqués.

4. Une image de 512x512 est une image de 1024 Tokens. Dans le vocabulaire K = 16384 时, modèle输出 1024 * log2(16384) = 14,336 bits (environ 1,75 KiB) de données.

5. 阅读 LlamaGen(arXiv:2406.06525) ―― Quel est le différent entre le modèle d'image autorégressive classal de LlamaGen et l'approche masquée de Show-o ?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Masked discrete diffusion | “MaskGIT-style” | 训练模型预测 masked Tokens；推理时，迭代式 unmask 置信度最高的预测 |
| Cosine schedule | “Unmask schedule” | mask ratio 随推理步数衰减；将置信度增长集中在中间区间 |
| Parallel decoding | “All tokens at once” | 每一步用一次 forward pass 预测完整的 masked Token 序列，然后提交 top-K |
| Hybrid attention | “Causal + bidirectional” | 一种 mask：对 text tokens 是 causal，在 image blocks 内是 bidirectional |
| Inpainting | “Fill-in generation” | 以部分 Tokens 被 masked 的 image 为条件，预测缺失部分；从训练目标中免费获得 |
| Commitment rate | “Top-K per step” | 每次迭代中有多少 Tokens 被声明为“完成”；控制推理与质量的 trade-off |

## 延伸阅读
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
- [Show-o2 (arXiv:2506.15564)](https://arxiv.org/abs/2506.15564)
- [Chang et al. — MaskGIT (arXiv:2202.04200)](https://arxiv.org/abs/2202.04200)
- [Sun et al. — LlamaGen (arXiv:2406.06525)](https://arxiv.org/abs/2406.06525)
- [Chang et al. — Muse (arXiv:2301.00704)](https://arxiv.org/abs/2301.00704)
