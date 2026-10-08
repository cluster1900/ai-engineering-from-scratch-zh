# MIO et modèles multimodels en streaming

> GPT-4o  livrait une majorité de modèles ouverts  impossible à reproduire produits: un en réalité à entendre le语音、 voir le vidéo et ouvrir la réponse de l'agent。 jusqu'à la fin de l'année 2024, l'écosystème ouvert est MIO(Wang et al., septembre 2024)。MIO Tokenize 文本、图像、语音和音乐, entraîne un transformateur causale sur une séquence de交错,并能从任意模式 生成任意 modality。AnyGPT(Zhan et al., février 2024) est la preuve du concept;MIO est une mise à l'échelle;Unified-IO 2(Allen AI, décembre 2023) est doté d'une vision + action de proximité.

**Type:** Learn
**Languages:** Python (stdlib, four-modality token allocator + streaming decode loop)
**Prerequisites:** Phase 12 · 11 (Chameleon), Phase 6 (Speech and Audio)
**Time:** ~120 minutes

## Objectif de l'apprentissage
- Œuvrer un vocabulaire commun, utilisé pour contenir des textes, des images, des sons et des symboles musicaux, sans qu'il y ait de conflit.
- À partir de l'angle de compression + de gravité comparer SEED-Tokenizer (image) et SpeechTokenizer résiduel-VQ (语音)
- Expliquer la construction de tout à tout le programme de formation en quatre étapes.
- Il existe trois recettes ouvertes à n'importe qui et ses principales caractéristiques:

##  problématique
Un modèle multimodale unifié  facile à prévoir, mais très difficile à échelonner à la construction. Jusqu'en 2024, la plupart des systèmes "tout à tout" sont des systèmes de pipeline: vision → 文本表示 → speech model → 音频。

工程挑战:

- Chaque mode doit avoir un Tokenizer, une compression suffisamment proche de la perte pour pouvoir être reconstruit et générer des Tokens à un rythme de transformateur.
- 单一词汇 必须为文本(32k+) 图像(16k+) 语音(4k+) 音乐(8k+) Distribution de espace。
- Les données de formation doivent couvrir chaque paire d'entrées-sorties (text→image、image→speech、speech→image, etc.), ou le modèle doit pouvoir être assemblé.
- Inference 必须足足足足快地流 输出 Token, afin de répondre au dialogue延迟 ((<500ms temps à premier octet audio) ⋅

## 概念
### Quatre types de fournisseurs de jetons

La pile de jetons de MIO:

- Le texte: standard BPE, vocab ~32000。
- Image:SEED-Tokenizer (2023)  带离散代码簿 的量化VAE,4096 条目,每张图像 32x32 个代码.
- Discours:SpeechTokenizer résiduel-VQ (2023)  将 16kHz waveform 编码为 8 层级代码书;第一层是粗粒度内容,后续层加入 prosody 和扬声器身份──
- Musique: similaire à résiduel-VQ(Meta's MusicGen / famille Encodec),4-8 个 codebooks。

Chaque modalité produit un nombre total de jetons. Ces jetons sont utilisés dans le vocabulaire commun pour obtenir des rangs d'identifiants qui ne se superposent pas:

```
text:   0..31999
image:  32000..36095  (4096 image tokens)
speech: 36096..40191  (4096 speech base tokens, plus residual layers)
music:  40192..48383  (8192 music tokens)
sep:    48384..48390  (<image>, <speech>, <music>, </...>, etc.)
```

总计: environ 48k vocabulaire──input Embedding 和 output projection 覆盖全部条目──

### Décode de diffusion

语音生成使用残留-VQ──Transformer 预测 base(layer 0) Token de parole; un quantificateur résiduel décodé parallèlement 预测后续层── chaque couche 0 Token 大约对应 16kHz 音频中的 50ms──

Résultats de streaming:

1. Utilisateur pour le MacK风说话; Tokenizer audio en temps réel chaque 50ms 发出语音代码
2. MIO 在 Token 到达时消费它们(prompte pré-remplissage + progression progressive)
3. Token de sortie 随生成流式输出; décodeur de discours parallèle 以约50-150ms 延迟将其转换为音频样本──
4. Temps à premier octet audio:MIO papier Environ 300-500ms, proche de GPT-4o d'environ 250ms。

Mini-Omni (ArXiv:2408.16725) ✓GLM-4-Voice (ArXiv:2412.02612) et Moshi (ArXiv:2410.00037) sont des conceptions de streaming de la parole-LLM complémentaires.

### Quatre étapes du programme

Le programme de formation de MIO:

1. Étapes 1  alignement── grande échelle modalité-pair corpora: texte-image、text-speech、text-music── chaque paire utilise son propre segment de vocabulaire Token── entraînement partage du vocabulaire──
2. Étapes 2  interlevées──Multi-modalité interlevées documents(带图像 + 视频的博客、带转录的播客等)──entraînement dans le contexte de la multi-modalité──
3. Étapes 3  augmentation de la parole  额外音频数据, utilisé pour améliorer la qualité du langage et ne pas perdre la capacité de texte 
4. Étapes 4  SFT──跨 modalité  VQA、captionnement、narration、speech-to-speech dialogue──

缺少某阶段会削弱特定能力: sauter à travers la phase 2,模型会失去跨modality context; sauter à travers la phase 3,语音会很差──

### Chaîne de pensée visuelle

MIO 引入 chain-of-visual-thought:模型发出中间图像 Token 作为推理步骤──对于 "le chat grimpe-t-il un arbre ?"模型会:

1. 发发发 `<image>`Les symboles de la scène de la couleur (en anglais)
2. 发出文本分析该草图──
3. 发发出最终答案──

染出的中图像作为 scratchpad──在空间推理任务上,benchmarks 有提升──这个想法类似文本推理中的链条思想──

### Tout le monde à tout le monde

- Toutes les formes de texte, d'image, de discours, de musique, de conception similaire.
- Unified-IO 2 ((arXiv:2312.17172): augmenter les résultats de l'action de vision, la profondeur, les normes, les tâches, la taille et la taille.
- NExT-GPT(arXiv:2309.05519):LLM + décodeurs de diffusion spécifiques à la modalité── ne sont pas un modèle unique 方法──
- CoDi(arXiv:2305.11846): diffusion composable; par le biais de la latence partagée 实现 any-to-any¬

MIO est le plus proche de tout-à-tout.

### Budget de la latence

Pour un produit de dialogue, le retard de chaque composant est important:

- Mic à l'audio Token: ~50ms
- Préchargement de l'audio Token + histoire: modèle 8B 上 ~ 100ms。
- Première sortie: ~50ms
- Décoder de la parole parallèle résiduel-VQ +: ~100-150 ms。

总时间-to-first-audio-byte: minima约 ~300ms──GPT-4o 声称 ~250ms──Moshi 声称 160ms──根据公开基准,MIO/AnyGPT 位于400-600ms 范围──

### Pourquoi tout-à-tout  encore difficile

Même en 2026, ouvrir n'importe quel modèle sur deux axes restent derrière ceux fermés:

- 语音质量──residual-VQ Tokenizer est有损的; par rapport aux voix de classe ElevenLabs, le dialogue语音听起来更机械──
- Le raisonnement à travers les modalités.

Ces problèmes sont des problèmes de recherche ouverts.


```figure
any-to-any-stream
```

## Utilisez-le
`code/main.py`- Le numéro de la liste:

-  définir l'allocation du vocabulaire à quatre modalités并印印它──
- Pour les autres, il est nécessaire de mettre en place un système de communication de données.
- 模拟文字-to-speech response 的流媒体解码,并统计延迟──
- Dans le cas de latences de codeur, préfiller et décoder, calculer le temps prévisible du premier octet audio.

## Je le livre.
本课产 出 `outputs/skill-any-to-any-pipeline-auditor.md` déterminer un produit de conversation spécifique, les modalités dans ▌modalités hors ▌objectif de latence, elle vérifiera les choix de conception de la famille MIO et calculera le budget de latence ▌

## 练习
1. Votre produit accepte l'entrée de la parole et retourne à la sortie de la parole.

2. Le SpeechTokenizer résiduel-VQ utilise 8 codebooks, expliquant pourquoi les niveaux de résiduels parallèles de décoding sont nécessaires, ainsi que ce qui entraîne des retards de conservation.

3. Votre vocabulaire a 32K de texte + 4K d'image + 4K de discours. Ajouter 8K de musique et environ 10 séparateurs.

4. La chaîne de pensée visuelle va émettre une image centrale. Quels types de problèmes vont bénéficier? Quels types vont être blessés par des jetons supplémentaires?

5. 阅读 Moshi(arXiv:2410.00037)。 décrit son "monologue intérieur" 技术,并与MIO的链视觉思想比较──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Any-to-any | "Multimodal in/out" | 一个单一模型，能够在任意方向接受并发出 text、image、speech 和 music |
| Residual-VQ | "Speech tokenizer stack" | Multi-codebook Tokenization，每一层都添加信息；base layer 是内容，后续层是 prosody |
| SEED-Tokenizer | "Image codes" | MIO 使用的离散 image Tokenizer，带 4096-entry codebook |
| Chain-of-visual-thought | "Visual scratchpad" | 模型在最终答案前生成一张中间图像作为 reasoning step |
| Time-to-first-audio-byte | "TTFAB" | 从用户语音到第一个 audio output 的延迟；<500ms 才有对话感 |
| Four-stage curriculum | "Training recipe" | Alignment -> interleaved -> speech-enhanced -> SFT，按此顺序 |

## 延伸阅读
- [Wang et al. — MIO (arXiv:2409.17692)](https://arxiv.org/abs/2409.17692)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Lu et al. — Unified-IO 2 (arXiv:2312.17172)](https://arxiv.org/abs/2312.17172)
- [Wu et al. — NExT-GPT (arXiv:2309.05519)](https://arxiv.org/abs/2309.05519)
- [Tang et al. — CoDi (arXiv:2305.11846)](https://arxiv.org/abs/2305.11846)
