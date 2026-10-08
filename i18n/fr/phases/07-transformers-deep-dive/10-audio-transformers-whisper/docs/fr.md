# Transformateurs audio  Architecture de murmure

> L'audio est la fréquence avec le temps, la formation d'images change.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 08 (Encoder-Decoder), Phase 7 · 09 (ViT)
**Time:** ~45 分钟

## Le problème

Avant, le reconnaissance automatique de la parole à la pointe de la technologie (ASR) signifiait les extracteurs de fonctionnalités autonomes de l'onde2vec 2.0 et de l'HuBERT, avec des capteurs fine-tunés.

Je suis en train de faire trois choses.

1. **Train on everything。**Il y a plus de 680 000 heures d'audio mal étiqueté, couvrant 97 langues.
2. **Multi-task single model。**Un décodeur à travers des jetons de tâche 联合训练 transcription、translation、détection de l'activité vocale、language ID 和 timestamping。
3. **标准 encoder-decoder transformer。**Encodeur consommation de spectrogrammes log-mail──décodageur 以 autorégressive 方式生成文本代币──没有 vocoder,没有CTC,没有HMM──

结果:Whisper large-v3 aux accents, au bruit, ainsi qu'à la qualité des données étiquetées 语言都很稳健──en 2026, il est déjà le front-end de tous les assistants vocaux open source et de la plupart des assistants vocaux commerciaux.

## Le concept

![Whisper pipeline: audio → mel → encoder → decoder → text](../assets/whisper.svg)

### Étape 1  Résemplaire + fenêtre

Audio pour 16 kHz──clip/pad jusqu'à 30 secondes── calculer le spectrogramme log-mail: 80 个 melbins,10 ms step → environ 3000 cadres × 80 fonctionnalités── voilà Whisper 看到的input image──

### Étape 2  tronc convolutif

Deux couches de Conv1D, le noyau 3 ̊, la phase 2, réduira les 3 000 cadres à 1 500 ̊, en cas d'augmentation de paramètres, réduira la longueur de la séquence à moitié ̊.

### Étape 3  encodeur

Un encodeur transformateur à 24 couches, qui traite 1 500 étapes de temps, en créant des états cachés, en créant des états de position sinusoïdale.

### Étape 4  décodeur

Un décodeur de transformateur à 24 couches. Il se dégage de la génération de jetons de manière autorégressive du vocabulaire BPE; ce vocabulaire est le superensemble du vocabulaire GPT-2, et contient une petite quantité de jetons spéciaux audio-specifiques.

### Étape 5  jetons de tâche

Décoder rapide et des jetons de contrôle  ouvrir, dire au modèle ce qu'il faut faire:

```
<|startoftranscript|>  <|en|>  <|transcribe|>  <|0.00|>
```

Ou

```
<|startoftranscript|>  <|fr|>  <|translate|>   <|0.00|>
```

模型就是按这种约定训练的──你通过前 控制任务──这相当于2026年的指令调整,只是应用在语音上──

### Étape 6  sortie

Recherche de faisceau de lumière (largeur 5)`<|notimestamps|>`Les timestamps seront enregistrés toutes les 0.02 secondes.

### Tailles de murmure

| Model | Params | Layers | d_model | Heads | VRAM (fp16) |
|-------|--------|--------|---------|-------|-------------|
| Tiny | 39M | 4 | 384 | 6 | ~1 GB |
| Base | 74M | 6 | 512 | 8 | ~1 GB |
| Small | 244M | 12 | 768 | 12 | ~2 GB |
| Medium | 769M | 24 | 1024 | 16 | ~5 GB |
| Large | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3 | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3-turbo | 809M | 32 | 1280 | 20 | ~6 GB（4-layer decoder） |

Grand-v3-turbo(2024) va décoder de 32 couches  réduit à 4 ⋅ décoder rapidement 8×, WER retourner à 1 个点 ⋅ This decode speed unlock 正是                                                                                                                                                                                                                                      

### Je ne fais rien

- Il est également possible de faire une analyse de la situation.
- Orig生不做实时流30 秒窗口是固定的──现代 wrappers(`faster-whisper`- Je suis là.`WhisperX`) par le biais de la superposition de la VAD + 补上流量──
- 时没有外部分碎,不支持超过30s的长形文本――实践中效果很好,因为人类言语在转录中很少需要长距离文本――

### paysage 2026

| Task | Model | Notes |
|------|-------|-------|
| English ASR | Whisper-turbo, Moonshine | Moonshine 在 edge 上快 4× |
| Multilingual ASR | Whisper-large-v3 | 97 种语言 |
| Streaming ASR | faster-whisper + VAD | 可达到 150 ms latency targets |
| TTS | Piper, XTTS-v2, Kokoro | Encoder-decoder pattern，但形状类似 Whisper |
| Audio + language | AudioLM, SeamlessM4T | Text tokens + audio tokens 在一个 transformer 中 |


```figure
n5-mel-decode
```

## Faites-le

Je vous en prie .`code/main.py` Nous ne sommes pas en train de construire un pipeline de spectrogrammes log-mail + un formatateur de prompt de jetons de tâche.

### Étape 1: synthétiser l'audio

Il est utilisé pour la production d'une échantillonnage à 16 kHz, à 440 Hz, à une vague sinusoïde de 1 seconde, à 16 000 échantillons.

### Étape 2: spectrogramme log-mail

完整 mel spectrogram 需要 FFT──我们做一个简化框架+per-frame energy 版本,用于展示管道,而不需要 `librosa`- Le numéro de la liste:

```python
def frame_signal(x, frame_size=400, hop=160):
    frames = []
    for start in range(0, len(x) - frame_size + 1, hop):
        frames.append(x[start:start + frame_size])
    return frames
```

Frame = 25 ms,hop = 10 ms── avec Whisper 

### Étape 3: le pad à 30 s

Whisper 始终处理 30 秒块──将光谱片或剪辑) jusqu'à 3000 images──

### Étape 4: Construire des jetons instantanés

```python
def whisper_prompt(lang="en", task="transcribe", timestamps=True):
    tokens = ["<|startoftranscript|>", f"<|{lang}|>", f"<|{task}|>"]
    if not timestamps:
        tokens.append("<|notimestamps|>")
    return tokens
```

C'est la surface complète de contrôle des tâches.

## Utilisez-le

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("meeting.wav", language="en", task="transcribe")
print(result["text"])
print(result["segments"][0]["start"], result["segments"][0]["end"])
```

Plus rapidement, plus facilement,

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3-turbo", compute_type="int8_float16")
segments, info = model.transcribe("meeting.wav", vad_filter=True)
for s in segments:
    print(f"{s.start:.2f} - {s.end:.2f}: {s.text}")
```

**2026 年何时选择 Whisper：**

- Utilisez un modèle pour faire ASR multilingue.
- Pour la transcription stable de la musique
- Résultats de recherche / prototype ASR最快起点──

**何时选择别的方案：**

- Le rayonnement de la lune est de la même qualité que le Whisper.
- 需要 <200 ms de l'IA en temps réel de conversation  utiliser ASR en streaming spécialisé
- Le journal de l'orateur Susper 不做这个;接上 pyannote。

## La faire partir

Je vous en prie .`outputs/skill-asr-configurator.md`◊ cette compétence 会为新语音应用 选择ASR model、decoding parameters 和 préprocessing pipeline。

## Exercices

1. **Easy。**运行  référencement`code/main.py` Confirmer le nombre de cadres de signal de 1 seconde de 16 kHz、10 ms de saut  compter environ 100 cadres ・ 30 secondes  environ 3000 cadres ・
2. **Medium。**Utilisation `numpy.fft`Construire un spectrogramme log-mail complet ∙ 验证 80 bins de mail avec `librosa.feature.melspectrogram(n_mels=80)`Dans les erreurs de valeur correspondant.
3. **Hard。**实现 streaming inference:将 audio 切成 10 s windows,2 s overlap, pour chaque pièce 运行 Whisper,再合并 transcripts──测量与 5 分钟播客样本 单次处理相比的字错率──

## Les termes clés

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Mel spectrogram | “Audio image” | 2D representation：一个轴是 frequency bins，另一个轴是 time frames；每个 cell 是 log-scaled energy。 |
| Log-mel | “Whisper 看到的东西” | 经过 log 的 Mel spectrogram；近似人类对 loudness 的感知。 |
| Frame | “一个 time slice” | 25 ms 的 samples window；以 10 ms stride overlap。 |
| Task token | “speech 的 prompt prefix” | decoder prompt 中类似 `<\|transcribe\|>` / `<\|translate\|>` 的 special tokens。 |
| Voice activity detection (VAD) | “找到 speech” | 在 ASR 前移除 silence 的 gate；大幅降低 cost。 |
| CTC | “Connectionist Temporal Classification” | 用于 alignment-free training 的经典 ASR loss；Whisper 不使用它。 |
| Whisper-turbo | “小 decoder，完整 encoder” | large-v3 encoder + 4-layer decoder；解码快 8×。 |
| Faster-whisper | “生产 wrapper” | CTranslate2 reimplementation；int8 quantization；比 OpenAI reference 快 4×。 |

## Pour en savoir plus

- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) Papel à murmures。
- [OpenAI Whisper repo](https://github.com/openai/whisper) code de référence + poids du modèle。阅读 `whisper/model.py`On peut voir en bas de 400 pages la tige Conv1D + encodeur + décodeur.
- [OpenAI Whisper — `whisper/decoding.py`](https://github.com/openai/whisper/blob/main/whisper/decoding.py) Pas 56 中描述的束搜索 + tâche-token logic 在这里;500 行,完全可读──
- [Baevski et al. (2020). wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477) Précédent; dans certains scénarios, il y a encore des caractéristiques SOTA.
- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) emballage de production,比 référence 快 4×。
- [Jia et al. (2024). Moonshine: Speech Recognition for Live Transcription and Voice Commands](https://arxiv.org/abs/2410.15608) 2024 année ASR, forme similaire à Whisper mais plus petit.
- [HuggingFace blog — "Fine-Tune Whisper For Multilingual ASR with 🤗 Transformers"](https://huggingface.co/blog/fine-tune-whisper) recette de réglage canonique, contenant un préprocesseur de méle spectrogramme et une manipulation de timestampes de jetons
- [HuggingFace `modeling_whisper.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/whisper/modeling_whisper.py) 完整实现(encoder、decoder、cross-attention、generation), avec le diagramme d'architecture de cette leçon 对应。
