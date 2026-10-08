# Marquage d'eau  SynthID、Signature stable、C2PA

> Les trois techniques constituent la base du suivi de la source de contenu de l'IA en 2026: SynthID (Google DeepMind)  marquage d'image  marquage d'image  annonce en août 2023, texte + vidéo  annonce en mai 2024  Gemini + Veo), texte  annonce en octobre 2024  ouverture  outilkit  responsable  génie  , un détecteur multimédia  unitaire  annonce en novembre 2025  Gemini 3 Pro  annonce en même temps  marquage d'eau                                                                                                                                                                                         

**Type:** Build
**Languages:** Python (stdlib, token-watermark embed + detect)
**Prerequisites:** Phase 10 · 04 (sampling), Phase 01 · 09 (information theory)
**Time:** ~75 分钟

## Objectif de l'apprentissage

- 描述 token-level watermarking (marqueur d'eau au niveau du jeton) 风格) ainsi que le mécanisme de son dépistage.
- Décrire la signature stable et l'attaque de son retrait en 2024
- Expliquer le rôle du C2PA et pourquoi il est associé à l'eau-marquage 互补.
- 描述关键限制:signal spécifique au modèle, parafrase, ainsi que des attaques de préservation du sens (arXiv:2508.20228):

##  problématique

Les données de référence de la marque de référence sont les données de référence de la marque de référence de référence de la marque de référence de référence de la marque de référence de référence de référence de la marque de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de référence de

## 概念

### Marquage d'eau du texte (SynthID-text 风格)

Kirchenbauer et coll. 2023 机制, par Google 产品化:

1. Dans chaque étape de décoding, faites un hash de K 个 Token, générez une partition pseudorandom, diviserez le vocabulaire en "vert" et "rouge" 集合。
2.  En donnant des logits verts + δ, faire l'échantillonnage  pivot vers le vert 集合。
3. Le nombre de jetons verts contenant les résultats de production sera supérieur à l'espérance de cas échéant.

检测: pour chaque préfixe 重新 hash,统计生成结果中的绿色代号,计算 z-score。z-score du texte marqué par eau >0,text humain 约为 0。

 caractéristiques:
- 读者难以察觉 (δ 足足小,质量损失较轻)
- Dans le vocabulaire, vous pouvez consulter la fonction de partition.
- Pour paraphraser, il faut savoir comment le rédiger.

SynthID-text est lancé en 2024 par Google en octobre.

### Signature stable (image)

Fernandez et coll. ICCV 2023──Fine-tune diffusion latente décodeur, de sorte que chaque image générée contient un écrit écrit dans la représentation latente du message binaire fixe──检测通过神经解码从 latent 中解码──对收割的图像,保留10% 内容) ,在 FPR<1e-6 时检测率 >90%──

2024 年 5 月 " La signature stable est instable " (arXiv:2405.07145): le décodeur de réglage fin peut être utilisé pour maintenir la qualité de l'image tout en déplaçant la marque d'eau, contre la réglage fine post-génération, 成本很低; la robustesse adverse de cette marque d'eau est limitée.

### Détecteur unifié SynthID ((2025 年 11 月)

随着Gemini 3 Pro 同发布: un détecteur multimédia, disponible dans la même API pour lire le texte, l'image, l'audio, la vidéo, les signaux SynthID dans la même API.

### C2PA

Coalition pour la provenance et l'authenticité du contenu―Cryptographiquement signé standard de métadonnées falsifiées 2.2 Expliqueur (2025)―C2PA manifeste 会记录 provenance claims(谁创建、何时创建、做过哪些 transformations),并由创始人关键 签名──

Avec le marquage de l'eau 互补:
- Les métadonnées peuvent être extraites; les marqueurs d'eau (ordinairement) ne sont pas faciles à utiliser.
- Les métadonnées 信息丰富(réalisation complète de la chaîne d'origine);marques d'eau 承载 bit。
- C2PA dépend de l'adoption de la plateforme; les marqueurs d'eau seront automatiquement inscrits.

Google en recherche, annonces et "A propos de cette image"

###  limite

- **Model-specific.**SynthID va être utilisé pour les modèles synthID-activés avec un code d'eau.
- **Paraphrase.**Les marqueurs d'eau du texte 无法经受 signification-preservant paraphrase。
- **Transformation attacks.**arXiv:2508.20228 (2025)  ont montré des attaques de préservation de sens qui peuvent détruire les marque-eau de texte ainsi que de nombreuses marque-eau d'image 
- **Fine-tune removal.**Selon "La signature stable est instable", la mise à jour post-génération peut être effectuée en déplaçant les marque-eau.

### Loi sur l'IA de l'UE Article 50

La première édition du projet de loi de 2025[European Commission status page](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content)Le Code est toujours en cours de rédaction, le temps de rédaction peut changer.

### Il est en phase 18 .

Les leçons 22-23 关注模型输出的内容(données privées、signal provenance)。L'enseignement 27 覆盖训练-data governance。L'enseignement 24 est l'exigence de ces mesures techniques dans le cadre de la surveillance。


```figure
an-watermark-greenlist
```

## Utilisez-le

`code/main.py`Construire un jouet texte marque-eau── Tokens sont un nombre entier 0..N-1;échantillonnage marqué par eau 会偏向哈希 定义的绿色集合──Detector 会计算绿色代币z-score──你可以观察1000代币下的检测结果,看参句 如何破坏该信号,并测量人类文字上的虚假阳性率──

## Je le livre.

本课会产出 `outputs/skill-provenance-audit.md` déterminer la solidité de chaque type de procédure et la couverture de chaque modalité.

## 练习

1. 运行  référencement`code/main.py` Rapport de génération de 1000 jetons marqués d'eau avec z-scores de texte écrit par l'homme―identification de 95% de seuil de confiance

2. 实现 une attaque de paraphrase, avec des synonymes  substituer 30% des jetons ⋅ re mesurez le score z──

3. 阅读 Kirchenbauer et al. 2023 Section 6 中关于强度的内容──为什么文字水印会在表达下失效,而图像水印能经受收割?

4. Design a utiliser SynthID-text + C2PA metadata de déploiement ￼Description de la chaîne d'origine vu par le consommateur ￼Identification de chaque composant mode d'échec ￼

5. 2024 " La signature stable est instable "  résultat indique, le réglage fin peut être déplacé image marque-eau ⋅ conception d'un limiter cette attaque de la mise en œuvre de mesures de contrôle  par exemple, exige des signatures de points de contrôle fin réglés ⋅

## 关键术语

| Term | 人们怎么说 | 它实际含义 |
|------|------------|------------|
| SynthID | "Google's watermark" | Cross-modal provenance signal；text、image、audio、video |
| Token watermark | "Kirchenbauer-style" | Biased-sampling text watermark，可通过 green-token z-score 检测 |
| Stable Signature | "image watermark" | Fine-tuned-decoder watermark；ICCV 2023 |
| C2PA | "the metadata standard" | Cryptographically signed tamper-evident provenance metadata |
| Paraphrase robustness | "does rewording break it" | Text watermark 属性；目前有限 |
| Fine-tune removal | "adversarial unwatermark" | 通过 decoder fine-tuning 移除 image watermark 的攻击 |
| Cross-modal detector | "unified SynthID" | 2025 年 11 月跨 modalities 的 unified API |

## 延伸阅读

- [Kirchenbauer et al. — A Watermark for Large Language Models (ICML 2023, arXiv:2301.10226)](https://arxiv.org/abs/2301.10226) mécanisme de marque d'eau
- [Fernandez et al. — Stable Signature (ICCV 2023, arXiv:2303.15435)](https://arxiv.org/abs/2303.15435) image marque d'eau 论文
- ["Stable Signature is Unstable" (arXiv:2405.07145)](https://arxiv.org/abs/2405.07145)Attaque de détachement
- [Google DeepMind — SynthID](https://deepmind.google/models/synthid/) Marque d'eau trans-modale
- [C2PA 2.2 Explainer (2025)](https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) Standard de métadonnées
