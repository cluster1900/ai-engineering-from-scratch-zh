# Transfusion: dans un transformateur 中结合 Autorégressive Text + Diffusion Image

> Chameleon et Emu3 mettent tout le financement en place dans des jetons dispersés 上。它们能工作,但量化瓶很明显:图像质量会在低于连续空间扩散 模型的位置进入平台期.Transfusion(Meta,Zhou et al.,2024年8月) 押了相反的方向:保持图像连续,完全消除VQ-VAE,并用两个损失 训练一个变体器──文本代币 使用下一个变体预测──图像补丁 使用流量匹配 /扩散损失──两个目标优化相同重权──稳定扩散 3层架构MMDiT) 阅读一下一下一下一下一篇文章

**Type:** Build
**Languages:** Python（stdlib，MNIST-scale 玩具双 loss trainer）
**Prerequisites:** Phase 12 · 11（Chameleon），Phase 8（Generative AI）
**Time:** ~180 minutes

## Objectif de l'apprentissage
- 连接一个在同一脊椎上运行两个损失的变压器(文本 Token 上的NTP,图像补丁 上的扩散MSE) ⋅
- 解释为什么图像补丁 之间使用双向注意,同时文本代币 使用因果注意,是正确的面具 选择──
- En calcul, en termes de qualité et de complexité du code, par rapport à la transfusion (conférence de l'image continue, perte de diffusion) et à la diffusion (conférence de l'image dispersée, NTP)
- Pour chaque bloc, utilisez des poids spécifiques à la modalité, en portant une attention commune au flux résiduel.

##  problématique
Les symboles de séparation sont des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles de séparation, des symboles, des symboles de séparation, des symboles, des symboles de séparation, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des symboles, des autres, et des autres, et des autres, et des autres, et des autres, et des autres.

Chameleon / Emu3 选择离散路线: Une perte, une architecture, mais l'image est garantie par le Tokenizer 质量限制──

Le modèle de diffusion a choisi un chemin continu: la qualité de l'image est très forte, mais il est un modèle dédié à la LLM, un modèle de gestion du bruit complexe, et il n'a pas de méthode d'intégration propre à la production de texte.

La question posée par la transfusion est: pouvez-vous les deux faire ?

## 概念
### 双 loss 架构

Un transformateur à décodeur seulement 处理包含以下内容的序列:

- 文本 Token ((离散, vient du vocabulaire BPE)
- 图像补丁(连续,16x16 pixel blocks, via intégration linéaire 投影到隐藏 dim, avec les mêmes输入 ViT encoder)
- `<image>`et `</image>`标签, utilisé pour marquer le patch continu Location de position

Pass à l' avance, seulement une fois. Perte, pour chaque jeton.

- Pour le texte Token: dans les mots-logits tête 上使用标准交叉
- Pour le patch d'image: dans le patch continu, la perte de diffusion est prévue.

Gradient 会流经共享的变压器体――2 pertes et même modification du droit de partage

### Masque d'attention: texte de cause à effet + image bidirectionnelle

文本 Token 必須是因果的;不能让文本 Token attend 到未来文本,否则老师强迫会被破坏──但图像补丁表示同一个快照;它们应该在同一个图像块内相互双向出席──

masque:

```
M[i, j] = 1 if:
  (i is text and j is text and j <= i)   # causal for text
  OR (i is image and j is image and same_image_block(i, j))   # bidirectional within image
  OR (i is text and j is image and j < i_image_end)   # text attends to previous images
  OR (i is image and j is text and j < i_image_start)   # image attends to preceding text
```

Dans l'entraînement et la réflexion, réaliser un masque triangulaire de bloc.

### Perte de diffusion interne du transformateur

Perte de diffusion est la forme standard: donner un patch d'image加噪音,让模型预测噪声(或等价地预测 un patch propre)。Utilisation de la version de la transfusion parallèle de flux: prédiction du champ de vitesse du bruit au propre。

Pendant la formation:
1. Pour chaque image de patch x0, une étape de temps aléatoire t.
2. 采样噪音 ε,计算 xt = (1-t) * x0 + t * ε(l'allumage correspondant de la valeur de l'entrée de courant)
3. Le taux de change est le taux de change de la valeur de l'équipement de transformation.
4. Avec la perte de NTP du texte dans la même séquence, un Backprop apparaît.

推理时, générer le processus est:
- 文本 Token: standard de prélèvement autorégressif
- 图像补丁:以此前文本 Token 为条件的扩散样本循环(habituellement 10 à 30 étapes) ⋅

### MMDiT: Diffusion stable 3 的变体

Esser et coll., 2024. 3 月) dans le temps proche de la Transfusion a publié MMDiT (Multimodal Diffusion Transformer).

Différences clés de MMDiT:

- Chaque bloc utilise des poids spécifiques à la modalité. Chaque bloc transformateur pour le texte Token et image patch séparément avec Q、K、V 和 MLP 权重. Attention est la joint de la(cross-modalité); les autres parties sont les modalités spécifiques de la。
- Formation en flux rectifié, un type spécifique de flux de correspondance, en mode mathématique, plus simple que le DDPM.
- △MMDiT est la colonne vertébrale de SD3 △2B 和 8B 参数变体) ・Transfusion 论文扩展到7B。

两者汇聚到同一个核心思想: un transformateur pour le texte de la fonction NTP, pour la continuité des images de la fonction diffusion.

### Pourquoi il a gagné à la façon du chameau ?

 Continuous diffusion et NTP dispersés dans la production d'images La différence de masse est mesurable.

- Dans la taille de 7B, la FID est de la même taille que la taille du chameau.
- Il n'y a pas besoin de formation Tokenizer: image encoder plus simple(projection linéaire à cache, avec la couche d'entrée de ViT similaire)
- 图像补丁 去噪音可以并行化推理,不像自动降低图像代币──

缺点:Transfusion est double perte 模型, entraînement动态更难――perte de poids 需要调参――NTP et diffusion 时间表不一致可能导致某头占主导――

### La partie

Janus-Pro (leçon 12.15) à travers la solution utilisée pour comprendre et générer un encodeur de vision pour améliorer l'idée de transfusion: l'un utilise SigLIP, l'autre utilise VQ, en même temps que le corps de transformateur.

En 2026, les VLM de production de classe image, tels que les Gemini 3 Pro, GPT-5 et Claude Opus 4.7, peuvent produire des images de manière à ce que la génération suivante de cette famille soit presque certainement utilisée.


```figure
cfg-guidance-scale
```

## Utilisez-le
`code/main.py`Dans une très petite question de type MNIST, on construit des jouets Transfusion:

- 文本 caption est une description de la séquence de nombres 0-9)
- L'image est 4x4
- Une projection linéaire de la charge de transformateur est remplacée par des projections de perte de NTP, des correctifs bruyants, des projections de perte de MSE.
- L'utilisation de deux perte, masque d'attention est évidente.
- Il est écrit en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en avant en

Ce transformateur est un jouet de classe.

## Je le livre.
本课产 出 `outputs/skill-two-loss-trainer-designer.md` Donner une nouvelle tâche de formation multimodale (文本 + 图像、文本 + 音频、文本 + 视频), elle concevra un double calendrier de perte ((perte de poids、forme de masque、partagée contre des blocs spécifiques à la modalité), et marquer la réalisation du risque―

## 练习
1. Un entraînement de type transfusion contient 70% de texte Token et 30% de image patch. La quantité de perte de diffusion d'image est de 10 fois plus élevée que la perte de texte NTP.

2. Pour ce processus de réalisation de masque triangulaire:`[T, T, <image>, P, P, P, P, </image>, T]`将每条目标为 0 或 1──

3. MMDiT a une capacité de transfusion de QKV spécifique à la modalité. Comparé à Transfusion, cela augmentera-t-il la consommation de paramètres ?

4. 生成: donner une réponse à un texte, modèle d'abord fonctionner NTP 生成 50 Tokens, puis rencontrer `<image>`, puis dans 256 patchs, et ensuite dans 20 étapes de déni de diffusion.

5. 阅读SD3论文 部分 3―― décrit le flux rectifié, ainsi que pourquoi il utilise moins de mesures de calcul que le DDPM.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Two-loss training | "NTP + diffusion" | 一个 transformer 在同一个 gradient step 中，同时优化文本 Token 上的 cross-entropy 和连续图像 patch 上的 MSE |
| Flow matching | "Rectified flow" | 一种 diffusion 变体，预测从噪声到 clean data 的 velocity field；数学上比 DDPM 更简单 |
| MMDiT | "Multimodal DiT" | Stable Diffusion 3 的架构：joint attention、modality-specific MLPs 和 norms |
| Block-triangular mask | "Causal text + bidirectional image" | 一种 attention mask：跨文本是 causal 的，但在图像区域内是 bidirectional 的 |
| Continuous image representation | "No VQ" | 图像 patch 作为实值 Vector，而不是整数 codebook indices |
| Velocity prediction | "v-parameterization" | 网络输出是噪声与数据之间的 velocity field，而不是噪声本身 |

## 延伸阅读
- [Zhou et al. — Transfusion (arXiv:2408.11039)](https://arxiv.org/abs/2408.11039)
- [Esser et al. — Stable Diffusion 3 / MMDiT (arXiv:2403.03206)](https://arxiv.org/abs/2403.03206)
- [Peebles & Xie — DiT (arXiv:2212.09748)](https://arxiv.org/abs/2212.09748)
- [Zhao et al. — MonoFormer (arXiv:2409.16280)](https://arxiv.org/abs/2409.16280)
- [Xie et al. — Show-o (arXiv:2408.12528)](https://arxiv.org/abs/2408.12528)
