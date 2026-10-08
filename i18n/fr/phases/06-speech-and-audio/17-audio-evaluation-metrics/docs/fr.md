# Évaluation audio  WER、MOS、UTMOS、MMAU、FAD 和开放排行榜

> 无法衡量东西,就无法发布;; 本课为每种音频任务命名 2026年的指标:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:ASR:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:S:

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 06, 07, 09, 10; Phase 2 · 09 (Model Evaluation)
**Time:** ~60 minutes

##  problématique

Chaque tâche audio a plusieurs indicateurs, chacun mesure une dimension différente. Utiliser un indicateur d'erreur vous permettra de publier un modèle sur le tableau de bord qui a l'air superbe, mais qui fonctionne très mal dans l'environnement de production.

| Task | Primary | Secondary |
|------|---------|-----------|
| ASR | WER | CER · RTFx · first-token latency |
| TTS | MOS / UTMOS | SECS · WER-on-ASR-round-trip · CER · TTFA |
| Voice cloning | SECS (ECAPA cosine) | MOS · CER |
| Speaker verification | EER | minDCF · FAR / FRR at operating point |
| Diarization | DER | JER · speaker confusion |
| Audio classification | top-1 · mAP | macro F1 · per-class recall |
| Music generation | FAD | CLAP · listening panel MOS |
| Audio language model | MMAU-Pro | LongAudioBench · AudioCaps FENSE |
| Streaming S2S | latency P50/P95 | WER · MOS |

## 概念

![Audio evaluation matrix — metrics vs tasks vs 2026 leaderboards](../assets/eval-landscape.svg)

### Indicateur ASR

**WER (Word Error Rate)。** `(S + D + I) / N`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊  ◊      ◊      ◊     ◊                                                                                                                                                                                                           `jiwer`Ou ouvrir des`whisper_normalizer`◊&lt;5% = 朗读语音 atteindre le niveau humain。

**CER (Character Error Rate)。**À la base de la même formule, les caractères sont classés en langue mandarin, car les limites des mots de ces langues peuvent être différentes.

**RTFx (inverse real-time factor)。**Chaque montre murale 秒处理的音频秒数──越高越好──Parakeet-TDT 达到 3380×──Susper-large-v3 约为 ~30×──

**First-token latency。**Du haut du niveau de l'émission à la première transcription du jeton 时间──对流 至关重要──Deepgram Nova-3:~150 ms──

### TTS

**MOS (Mean Opinion Score)。**1-5 的人工评分──黄金标准,但速度慢──每样本收集20+ 听众,每样本100+样本──

**UTMOS (2022-2026)。**Le MOS  prédicteur                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

**SECS (Speaker Encoder Cosine Similarity)。**Utilisé pour le clonage de la voix, le code ECAPA entre le clonage de la voix et le clonage de la voix, le code ECAPA entre le clonage de la voix et le clonage de la voix, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine, le cosine,

**WER-on-ASR-round-trip。**Dans le TTS 输出上运行 Whisper,并对输入文本计算 WER──用于捕捉可理解度回归──2026 SOTA:&lt;2% CER──

**TTFA (time-to-first-audio)。**端到端延迟──Kokoro-82M: ~100 ms; F5-TTS: ~1 s──

### Clonage de la voix 专用指标

**SECS + MOS + CER**作为三元组──SECS 高但MOS 低的克隆,说明音色正确但不自然;反过来则说明声音自然但说话人不对──

### Vérification des haut-parleurs

**EER (Equal Error Rate)。**Le taux de faux acceptation équivaut à celui du taux de faux rejet.

**minDCF (min Detection Cost)。**Dans le cadre de la sélection des points d'exploitation, le coût de production accru (en moyenne FAR = 0,01) est supérieur à celui de l'EEE.

### Diarrhée

**DER (Diarization Error Rate)。** `(FA + Miss + Confusion) / total_speaker_time`◊漏检语音 + 误报语音 + 说话人混,每项都是一个占比──AMI réunions:DER ~10-20% 是现实水平──pianonote 3.1 + Precision-2 commercial:在录制良好的音频上 &lt;10% DER──

**JER (Jaccard Error Rate)。**DER est un indicateur de remplacement, pour les courts épisodes.

### Classification audio

Multi-étiquette: tous les catégories **mAP (mean Average Precision)**◊AudioSet:BEATs-iter3 为 0.548 mAP♦

互斥 Multi-classe:**top-1、top-5 accuracy**❖ Commandes de parole v2:99.0% top-1

类别 déséquilibre:**macro F1**+ **per-class recall** Rapport par classe, précision globale 会掩盖哪些类别失败──

### Génération de musique

**FAD (Fréchet Audio Distance)。**La différence entre le VGGish-Embedding du VGGish-Embedding du VGGish-Embedding est de 4,5 à 4,5 à 4,0 à 4,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 5,0 à 6.0 à 5,0 à 5,0 à 6,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7,0 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 7 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10 à 10

**CLAP Score。**Utilisation de CLAP Embedding 的文本-音频对齐分数──&gt; 0.3 = 合理对齐──

**Listening panel MOS。**Pour le niveau de consommation de musique, il reste un jugement final.

### Indice de référence pour le langage audio

**MMAU (Massive Multi-Audio Understanding)。**10 000 voix de plus.

**MMAU-Pro。**1800 个困难条目,四类:speech / sound / music / multi-audio──4 选 1 的随机水平为25%──Gemini 2.5 Pro 总体约 ~60%;所有模型 在多音上约 ~22%──

**LongAudioBench。**Je suis sûr que tu as des questions à poser.

**AudioCaps / Clotho。**Le titre de référence:

### Diffusion de discours en direct

**Latency P50 / P95 / P99。**De l'utilisateur parler se termine à la première réponse à l'écoute du mur 时间──Moshi:200 ms; GPT-4o En temps réel:300 ms──

**WER / MOS**Pour la sortie.

**Barge-in responsiveness。**Du temps de l'utilisateur à celui de l'assistant.

### Liste des élus

| Leaderboard | Tracks | URL |
|------------|--------|-----|
| Open ASR Leaderboard (HF) | English + multilingual + long-form | `huggingface.co/spaces/hf-audio/open_asr_leaderboard` |
| TTS Arena (HF) | English TTS | `huggingface.co/spaces/TTS-AGI/TTS-Arena` |
| Artificial Analysis Speech | TTS + STT, ELO from paired votes | `artificialanalysis.ai/speech` |
| MMAU-Pro | LALM reasoning | `mmaubenchmark.github.io` |
| SpeakerBench / VoxSRC | Speaker recognition | `voxsrc.github.io` |
| MMAU music subset | Music LALM | (within MMAU) |
| HEAR benchmark | Self-supervised audio | `hearbenchmark.com` |


```figure
sp-wer-align
```

## Construction

### 步骤 1: REM de réglementation

```python
from jiwer import wer, Compose, ToLowerCase, RemovePunctuation, Strip

transform = Compose([ToLowerCase(), RemovePunctuation(), Strip()])
score = wer(
    truth="Please turn on the lights.",
    hypothesis="please turn on the light",
    truth_transform=transform,
    hypothesis_transform=transform,
)
# ~0.17
```

### 步骤 2:TTS REM de retour et de retour

```python
def ttr_wer(tts_model, asr_model, texts):
    errors = []
    for txt in texts:
        audio = tts_model.synthesize(txt)
        recog = asr_model.transcribe(audio)
        errors.append(wer(truth=txt, hypothesis=recog))
    return sum(errors) / len(errors)
```

### Étape 3: Pour le clonage de la voix SECS

```python
from speechbrain.inference.speaker import EncoderClassifier
sv = EncoderClassifier.from_hparams("speechbrain/spkrec-ecapa-voxceleb")

emb_ref = sv.encode_batch(load_wav("reference.wav"))
emb_clone = sv.encode_batch(load_wav("cloned.wav"))
secs = torch.nn.functional.cosine_similarity(emb_ref, emb_clone, dim=-1).item()
```

### Étape 4: Pour la génération de musique

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()
score = fad.get_fad_score("generated_folder/", "reference_folder/")
```

### 步骤 5: Pour la vérification de l'EEE des haut-parleurs (par rapport à la leçon 6)

```python
def eer(same_scores, diff_scores):
    thresholds = sorted(set(same_scores + diff_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in diff_scores if s >= t) / len(diff_scores)
        frr = sum(1 for s in same_scores if s < t) / len(same_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

## Utilisation

Pour chaque déploiement, un harnais d'évaluation fixe est mis en place et chaque modèle est mis à jour et mis en œuvre.

1. **评分前先规范化。**转小写、去标点、展开数字―― rapport de la réglementation de la réglementation
2. **报告分布，而不是平均值。**La latence 报 P50/P95/P99。Classification 报 par classe rappel―MMAU 报 par catégorie。
3. **运行一个标准公开 benchmark。**Même si vos données de production sont différentes, le rapport de l'Open ASR / TTS Arena / MMAU peut également permettre une évaluation et une comparaison de la taille.

## La trappe

- **UTMOS 外推。**Il est pratiqué dans le style de la VCTK; il est moins fréquent que dans le style de la VCTK.
- **MOS panel 偏差。**20 travailleurs Amazon Mechanical Turk ≠ 20 个目标用户──如果风险高,就为领域面板 付费──
- **FAD 依赖参考集。**跨模型比较时, il faut utiliser la même répartition de référence.
- **Aggregate WER。**总体 5% WER 可能掩盖口音语音上的 30% WER──en fonction de la tranche de la population 报告──
- **公开 benchmark 饱和。**La plupart des modèles frontaliers dans le benchmark standard sont proches de la limite supérieure.

##  édition

保存为 `outputs/skill-audio-evaluator.md`◊ Pour un modèle de sondage, éditer des indicateurs de choix, des critères et des modèles de rapport.

## 练习

1. **Easy。**运行  référencement`code/main.py` dans le jeu 输入上计算 WER / CER / EER / SECS / FAD-ish / MMAU-ish。
2. **Medium。**Construire un harnais WER de retour TTS, pour votre Kokoro ou F5-TTS, pour votre sortie et votre entrée en service.
3. **Hard。**Dans le cadre de la leçon 10, vous avez choisi le LALM.

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| WER | ASR 分数 | 规范化后 word 级别的 `(S+D+I)/N`。 |
| CER | Character WER | 用于声调语言或 char-level 系统。 |
| MOS | 人类意见 | 1-5 评分；20+ 听众 × 100 样本。 |
| UTMOS | ML MOS 预测器 | 训练得到的 model；与人工 MOS 相关性约 ~0.9。 |
| SECS | Voice-clone 相似度 | 参考音频与克隆音频之间的 ECAPA cosine。 |
| EER | Speaker verif 分数 | FAR = FRR 的阈值。 |
| DER | Diarization 分数 | (FA + Miss + Confusion) / total。 |
| FAD | Music-gen 质量 | VGGish Embedding 上的 Fréchet distance。 |
| RTFx | 吞吐量 | 每个 wall-clock 秒处理的音频秒数。 |

## 延伸阅读

- [jiwer](https://github.com/jitsi/jiwer) 带规范化工具的 WER/CER 库
- [UTMOS (Saeki et al. 2022)](https://arxiv.org/abs/2204.02152)  Prévisionnateur de MOS   
- [Fréchet Audio Distance (Kilgour et al. 2019)](https://arxiv.org/abs/1812.08466) musique-gen 标准。
- [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 2026 实时排名──
- [TTS Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena) 人工投票 TTS 排行榜──
- [MMAU-Pro benchmark](https://mmaubenchmark.github.io/) Résumé de LALM 排行榜。
- [HEAR benchmark](https://hearbenchmark.com/) référence audio SSL。
