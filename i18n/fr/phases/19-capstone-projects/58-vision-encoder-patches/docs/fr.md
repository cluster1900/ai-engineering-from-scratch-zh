#  视觉编码器 Les correctifs

> L'image est coupée en un réseau carré, étalée sur chaque carré, projetée sur une couche carré, puis ajoutée à un signal de position 2D, afin que le transformateur sache où se trouve chaque carré dans l'image originale.

**Type:** Build
**Languages:** Python
**Prerequisites:** 第19期第30-37课（B轨基础）
**Time:** ~90 分钟

## Objectif de l'apprentissage

- Transformer l'image en un ensemble de correctifs de longueur fixe.
- 实现 à base `Conv2d`Le projet est en phase avec le développement et la correspondance mathématique.
- 构建确定性 2D 正弦位置嵌入, afin de détecter l'ordre de编码空间位置。
- 验证 synthèse fixation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      `Conv2d`/ égal à l'effet:

##  problématique

Transformer 接收一系列向量──图像是一个3通道网格──将每个像素作为代码读取导致序列长度爆炸:224x224 RGB 图像是150,528个代码,这是12层 变压器 无法承受──将图像读取为一个巨大的平面向量会丢失局部性,而注意层无法从中恢复──编码器前端的工作是将像素网格压缩为数百个代码,每个代码概括一个正方形区域──

Le correctif de l'imagerie est de 16x16 blocs, ce qui permet de résoudre ce problème.`(3, 16, 16) = 768`像素值展平为一个向量, puis la couche de l'image est mappée à la dimension cachée du modèle.`hidden`(habituellement pour 768) le jeton plus un jeton CLS. Ceci est la séquence de la partie restante du réseau qui peut être empruntée.

## 概念

```mermaid
flowchart LR
  Image[224x224x3 image] --> Cut[cut into 16x16 patches]
  Cut --> Grid[14x14 grid of patches]
  Grid --> Flatten[flatten each patch]
  Flatten --> Proj[linear projection]
  Proj --> Tokens[196 tokens of dim hidden]
  Tokens --> Pos[add 2D sinusoidal position]
  Pos --> Out[final token sequence]
```

### Pourquoi un complément, plutôt que des images ?

Attention est la deuxième dimension de la longueur de la séquence. 196 Tokens de séquence par étage par tête.`196 * 196 = 38,416`Attention: le coût de la séquence de jetons est de 150.528`150,528 * 150,528 = 22.6 billion` Le complément peut réduire la quantité de calcul d'attention de 590.000 fois, et une seule zone 16x16 peut supporter suffisamment de signaux pour exécuter des tâches visuelles avancées.

### Pourquoi les projections sont suffisantes ?

Chaque supplément est considéré comme un émetteur indépendant.`768 * 768 = 589,824`参数) et la vitesse d'entraînement est rapide. Il existe des trombones plus profonds, mais la projection linéaire de la planche est standard, et la plupart des ordinateurs de poids ouverts modernes ont une forme précise.

### `Conv2d`技巧

 Aucun remplissage `Conv2d(in_channels=3, out_channels=hidden, kernel_size=patch_size, stride=patch_size)`√ Donner le même résultat numérique que le déploiement puis linéaire, car chaque position de sortie effectuera un point de compilation de la image de correction avec un 波器. √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √ √

### Localisation

Les symboles ne sont pas en train de se reproduire.`(row, col)`La moitié de la dimension est intégrée à l'aide de la position de la ligne à plusieurs fréquences; l'autre moitié est définitive, vous pouvez donc échanger la résolution sans avoir à vous entraîner à nouveau, et elle peut être intégrée à un modèle de valeur nette jamais vue lors de l'entraînement.

|组件|形状|参数|
|-----------|-------|------------|
|补丁投影（`Conv2d`）| `(hidden, 3, patch, patch)` | `3 * P * P * hidden + hidden` |
|位置嵌入（固定）| `(num_patches, hidden)` | 0（计算，未学习）|
| CLS token（已学习）| `(1, hidden)` | `hidden` |

Pour 224 résolution ViT-Base/16: projection de 590,592 paramètres, jeton CLS de 768 paramètres, position de la position de la ligne d'orientation est à zéro.

### ), comme équivalence de l'inspection de santé

Il y a deux types d'orthographe:`Conv2d`投影和显式展开然后线性── elles doivent produire la même sortie avec le même poids── si elles ne le font pas, alors les mathématiques sont erronées, le reste du codeur est construit sur le sable── les tests de cette classe ont pratiqué cette équivalence──


```figure
ch-patch-tokenizer
```

## - Je le construis.

`code/main.py`实现:

- `PatchEmbed`- Je suis désolé .`nn.Module`包装 `Conv2d`Pour la projection de correctifs.
- `sinusoidal_2d(grid_h, grid_w, dim)`, une fonction sans état de la structure de la carte de position 2D.
- `VisionFrontEnd`, il va ajouter des correctifs dans le CLS avant placement et position ajoutée à la fois avant et vers le transfert.
- Une .`synthesize_image(seed)`- Je suis un assistant.`numpy.random`构建确定性 224x224x3 fixure
- Une démonstration, par le biais d'un encodeur avant-end 运行一张 fixture 图像,并印出形状、CLS token 范数和一行位置嵌入──

Je vais le faire.

```bash
python3 code/main.py
```

输出: 24x224 fixation 编码为形状 `(1, 197, 768)`Le premier symbole est CLS; les 196 suivants sont des symboliques de correction.

## Utilisez-le

Les mêmes correctifs préliminaires apparaissent dans chaque modèle de langage visuel moderne: CLIP ViT-L/14、SigLIP、DINOv2、Qwen-VL 系列和InternVL 堆都从`Conv2d`补丁投影加上位置信号开始──下游各系列之间的差异(CLS et sans CLS 池化、注册代币、不同的补丁大小 14和16、通过插值位置进行动态分辨率)──本课程中的前端是每个模型的依赖基础──

## 测试 Le détail

`code/test_main.py`incluant:

-  nombre de correctifs`(image_size / patch_size) ** 2`
- 输出形状匹配`(batch, num_patches + 1, hidden)`
- `Conv2d` projection équivaut à un petit appareil  上手动展开然后线性投影
- La position de la position est déterminante entre les modes
- CLS jeton à travers la série de diffusion sans fuite

Ils vont les faire:

```bash
python3 -m unittest code/test_main.py
```

## 练习

1. Avec l'apprentissage de`nn.Parameter`替换正弦位置,并比较小综合分类任务的第一纪元损失──学习位置以固定分辨率获胜;当你在训练后改变分辨率时,正弦曲线获胜──

2. Il va`Conv2d`替换为显式 `nn.Unfold` `nn.Linear`, et affirme que la production correspond à la différence de capacité de l'écriture.

3. 添加对非方形补丁大小的支持 (par exemple, large écran de 32x16),并验证位置表处理非方形网格──

4. Dans le secteur de l'énergie, les émissions de gaz et de gaz sont très rares.

5. Dans le cadre de la formation de la formation de l'équipe de formation, le groupe de formation de la formation de la formation de l'équipe de formation de la formation de l'équipe de formation de la formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de l'équipe de formation de la formation de l'équipe de formation de formation de l'équipe de formation de formation de la formation de la formation de la formation de la formation de l'équipe de formation de formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la formation de la CLS.

## 关键术语

|术语 |这意味着什么 |
|------|---------------|
|补丁|图像的方形子区域，通常为 14x14 或 16x16 |
|补丁嵌入 |一个扁平面片到hidden dim区域的线性投影 |
|序列长度|补丁token化后的 token数量，通常加上 CLS |
|正弦位置 |修复了编码 2D 网格坐标的 sin/cos 信号 |
| CLS token |学习向量作为池化头添加到序列前面 |

##  ultérieur

- Pour les modifications originales, l'image est de 16x16 个字符
- Attention Is All You Need (2017) est une série de films en 2D.
- Utilisez le document DINOv2 de l'enregistrement de jetons, vous pouvez ajouter une extension comme exercice 6..
