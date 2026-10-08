# Modèles audio-langue: de Whisper à Audio Flamingo 3

> Whisper(Radford etc. (2022 12 mois) faire connaître le langage: 680.000 heures de faible surveillance de plusieurs langues.

**类型：**Construire
**语言：**Python (stdlib, spectrogramme log-Mel + audio Q-ancien squelette)
**前置要求：**Phase 6 (speech and audio), phase 12 · 03 (Q-Former)
**时间：**À environ 180 minutes

## Objectif de l'apprentissage
- De la forme d'onde  calcul du spectrogramme log-Mel: fenêtre, FFT, filtres, transformation de logs
- Comparez l'encodeur 选项:Codeur à chuchotement,BEATs,AF-Hybrid à chuchotement,pour comprendre leur propre situation.
- Construire des requêtes audio Q-former: faire des requêtes N 个可学习 sur les correctifs du spectrogramme faire des interventions croisées。
- 解释 cascadeed(Whisper-then-LLM) vs end-to-end audio-LLM 训练:为什么端到端 更适合扩展到推理能力──

##  problématique
语音识别已被 Whisper 解决──音频的OCR 已商品化──但商品化止步于转写──如果模型无法推理它听到的内容:时间点、说话者、情绪、音乐结构、环境声音,那么仅靠转写无法支产品功能──

3 points de vue:

1. Cascade:Whisper 转写,LLM à la transcription 推理──适用于纯语音场景──对音乐、环境音频、多说话人重叠、情绪会失败──

2. L'écriture de la langue de l'auteur est un outil de communication audio-LLM.

3. Hybride: codateur audio + décodeur de texte,既能转写也能推理──Qwen-Audio 和 Audio Flamingo 选择这条路线──

## 概念
### Spéctrogramme log-mail:输入特征

Chaque encodeur audio a le même caractère: le spectrogramme log-mail.

1. Remplissez l'échantillon à 16 kHz.
2. Utilisez une fenêtre de 25ms ≈ 10ms pour effectuer une transformation Fourier à court terme ≈
3. 取 FFT 结果的大小──
4. 应用 Mel filter banks (habituellement 80 个在 0-8000 Hz 上按 log 间隔分布的过器),映射到感知频率──
5. Utilisez le compression log.

结果:形状为 (T, 80) de l'ensemble 2D, dont T est des cadres de temps 数量── pour la fréquence d'image de 100 Hz de 30 secondes clip:形状为 (3000, 80)──

### Encodeur de murmure

Whisper's encoder est un transformateur de style ViT de 12 couches, qui va loger-Mel spectrogramme 作为时间框架 序列处理──输出: chaque temps cadre 一个隐藏状态向量──

Pour ASR, le décodeur de Whisper est un Transformer de l'attention croisée, il génère des jetons de texte dans la condition de sortie de l'encodeur.

Pour les ALM, vous souhaitez mettre en production un encodeur comme une autre LLM.

### BEATs 和音频 encoders spéciaux

Le murmure est entraîné à utiliser les données du maître de la voix.

BEATs(Chen 等,2022) est un Transformer auto-supervisé entraîné dans AudioSet.

AF-Whisper(Audio Flamingo 3's hybride):将 Whisper + BEATs fonctionnalités concat 作为音频输入──Whisper 携带语言信号, BEATs 携带声学信号──

### Le Q-former audio

Avec BLIP-2 Q-former visuel 模式相同── un nombre fixe de requêtes apprenables(常见为 32或 64) sur les cadres de sortie de l'encodeur audio faire une participation croisée── ces requêtes                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

训练对齐阶段:只训练 Q-former,在音频文字对中(AudioCaps、Clotho) 上使用对比 +字幕损失──Instruction 阶段:end-to-end,unfreeze LLM,在教学数据上训练──

### Cette vidéo est une vidéo de la série "Salmone"

SALMONN(Tang 等,2023):Susper + BEATs + Q-former + LLaMA。

Qwen-Audio(Chu 等,2023):架构类似,训练数据集更丰富, visant le dialogue à plusieurs tours 调优──MMAU 约 0.60──

LTU  Écoutez, pensez, comprenez(Gong 等,2023): données de raisonnement explicite, spécialisées dans la chaîne de pensée de la télévision.

Audio Flamingo 3(Goel 等,2025年7月):当前 open SOTA──8B LLM backbone(Qwen2 7B)、Whisper-big encoder concat BEATs、64-query Q-former, dans 100 000+ paires d'instructions audio-textes 上练──MMAU 0.72, dans certaines sous-tasques 上匹配 propriétaire frontière──

AF3 a également introduit la chaîne de pensée à la demande de son son: modèle peut être utilisé dans le résumé final.

### Cascade contre bout à bout

L'équipement de transport en cascade:

1. Sous-suffisant, ça va être écrit en français.
2. Le programme de la maîtrise de la littérature

Pour le reste, ce podcast est très efficace.
- Quelle est l'humeur de cette chanson ?
- Qui est en train de parler, Alice ou Bob ?
- L'explosion a eu lieu en quelques secondes.
-  est-ce que c'est vrai ou généré ? détection de fausses informations 需要声学特征──

La musique, l'environnement et les émotions sont des éléments de la musique.

### Récipes de production 2026

对于新音频理解产品:

- Cascade si: objectif est de transcrire, pas de musique, pas de sentiment de conclusion.
- AF3 / Qwen-Audio-famille si: musique、情绪、多说话人,或复杂音频推理──

Cascade plus facile, plus simple, plus puissant.

### MMAU:音频推理 référence

MMAU (Massave Multimodal Audio Understanding) est un indicateur de référence pour les émissions de musique de 2024 à 2025.

- 10 000 couples de QA audio-texte de la musique et de l'environnement
- 覆盖分类、temporal reasoning、causal reasoning、open-ended QA──
- 测试 les pipelines en cascade 系统性遗漏 ability。

Open SOTA(AF3) pour 0,72; frontière propriétaire 约 0.78(Gemini 2.5 Pro、Claude Opus 4.7)。 cette différence est inférieure à celle du delta ouvert versus fermé de VideoMME, indique que les LLM audio sont en train de devenir mûres。


```figure
audio-text-ctc
```

## Utilisez-le
`code/main.py`- Le numéro de la liste:

- Utilisation de l'écran de détection de données
- Audio Q-ancien squelette: donner des cadres de sortie de codeur déterminés, calcul Q、K、V、attention,并输出 N 个代币──
- Dans une tâche de jouet, comparez en cascade.

## Je le livre.
本课会产出 `outputs/skill-audio-llm-pipeline-picker.md`△ donner une tâche de transcription ◦ étiquetage de musique ◦ inférence émotionnelle ◦ diarisation multi-speakers ◦ classification de l'environnement), elle choisira en cascade ◦ AF3 de bout en bout ou hybride ◦

## 练习
1. Pour une fenêtre de 16 kHz 2,5 ms, 10 ms, 80 Mel bins, 30 secondes de clip, calculer le log-Mel spectrogramme

2. Pourquoi le son de Whisper dans la musique est-il moins performant ?

3. 64 requêtes contre 32 requêtes de Q-former: Dans quelle tâche de complexité ?

4. 阅读AF3 Section 4 关于 on-demand thinking的内容── proposer trois tâches de chaîne de pensée les plus utiles 

5. Utilisez AF3 pour réaliser un pipeline de diarisation minimale.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Log-Mel spectrogram | “Mel features” | 经过 Mel filter banks 后得到的 log-magnitude values 的 2D（time, frequency）array |
| Audio Q-former | “Audio Perceiver” | 从 audio encoder output 到 fixed-length queries 的 cross-attention bottleneck，供给 LLM |
| Cascaded | “ASR-then-LLM” | Whisper 转写后由 text LLM 推理的 pipeline；会丢失声学信息 |
| End-to-end | “Audio-LLM” | 音频特征通过 Q-former 直接进入 LLM；保留声学信号 |
| BEATs | “Audio AudioSet encoder” | 在 AudioSet 上训练的 SSL Transformer；擅长音乐 + 环境声音 |
| MMAU | “Audio reasoning bench” | 跨语音、音乐、环境的 10k QA pairs；2024 eval standard |
| On-demand thinking | “Audio CoT” | 模型可以在最终答案前可选地输出 reasoning tokens，将准确率提升 3-5 pts |

## 延伸阅读
- [Radford et al. — Whisper (arXiv:2212.04356)](https://arxiv.org/abs/2212.04356)
- [Chu et al. — Qwen-Audio (arXiv:2311.07919)](https://arxiv.org/abs/2311.07919)
- [Goel et al. — Audio Flamingo 3 (arXiv:2507.08128)](https://arxiv.org/abs/2507.08128)
- [Tang et al. — SALMONN (arXiv:2310.13289)](https://arxiv.org/abs/2310.13289)
- [Gong et al. — LTU (arXiv:2305.10790)](https://arxiv.org/abs/2305.10790)
