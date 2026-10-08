# Sous-flou  Architecture et réglage

> Whisper est un transformer de fenêtre de 30 secondes encodeur-décoeur, entraîné à 680k 小时的多语弱监督音频文档对──一个架构,多种任务,跨99种语言都强──2026年参考ASR──

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 5 · 10 (Attention), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## Le problème

Whisper est publié par OpenAI en septembre 2022 et est le premier modèle ASR à être livré en marchandise: coller audio, obtenir du texte, prendre en charge 99 langues, faire du bruit, être utilisé sur ordinateur portable.

Mais le murmure n'est pas un pipeline que l'on peut toujours utiliser dans une boîte noire.

1. C'est ce qu'il est à l'intérieur.
2. Comment faire pour le faire en streaming ou en long format ?
3. Comment faire pour bien régler ?

## Le concept

![Whisper encoder-decoder, tasks, chunked inference, fine-tune](../assets/whisper.svg)

**Architecture。**标准 transformer encodeur-décodeur

- Entrée 30 secondes spectrogramme log-mail, 80 mels, 10 ms saut → 3000 images.
- Encodeur:conv-downsample (étape 2) + `N`Les blocs de transformateurs... à la grande taille de v3:32 couches... 1280-dim, 20 têtes...
- Décoder:带 causel auto-attn + à l' output de l'encodeur faire des accès croisés `N`Les blocs de transformateurs, en même temps que les encoders, sont également utilisés.
- Résultats: couverture de 51 865 tokens de la voyelle BPE.

Les grands v3 ont des paramètres 1.55B.

**Prompt format。**Whisper est une demande de décodeur.

```text
<|startoftranscript|><|en|><|transcribe|><|notimestamps|> Hello world.<|endoftext|>
```

- `<|en|>` étiquette de langue; comportement de traduction contre transcription obligatoire ⋅
- `<|transcribe|>`Ou `<|translate|>` From arbitrary language input 翻译为英语输出,或逐字转写。
- `<|notimestamps|>` 跳过 word-level timestamps 更快)

Rapidement, un modèle peut accomplir de nombreuses tâches.`<|en|>`改成 `<|fr|>`Ça va être traduit en français.

**30-second window。**Tout est fixé en 30 secondes. Plus de clips doivent être coupés, plus de clips doivent être couverts. Windows n'est pas un streaming original.

**Log-mel normalization。** `(log_mel - mean) / std`, parmi les statistiques proviennent de Whisper  propre corps d'entraînement.`whisper.audio.log_mel_spectrogram`), plutôt que `librosa.feature.melspectrogram`Il y a une autre.

### Variantes en 2026

| Variant | Params | Latency (A100) | WER (LibriSpeech-clean) |
|---------|--------|----------------|------------------------|
| Tiny | 39M | 1× realtime | 5.4% |
| Base | 74M | 1× | 4.1% |
| Small | 244M | 1× | 3.0% |
| Medium | 769M | 1× | 2.7% |
| Large-v3 | 1.55B | 2× | 1.8% |
| Large-v3-turbo | 809M | 8× | 1.58% |
| Whisper-Streaming (2024) | 1.55B | streaming | 2.0% |

### Réglage de la qualité

Flux de travail canonique pour 2026:

1. 收集 10100 小时目标领域音频,并配有配合的转录──
2. Utilisation `transformers.Seq2SeqTrainer`, avec`generate_with_loss`Retour à l'appel.
3. Paramètre-efficacité: dans les couches d'attention `q_proj`- Je suis là.`k_proj`- Je suis là.`v_proj`上使用LoRA,可将 GPU mémoire 降低 4x,WER 代价 <0.3──
4. Si vous avez seulement 10 minutes, congélez le décodeur.
5. Utilisez Whisper  propre Tokenizer 和 format rapide; absolument ne pas remplacer les tokenizers。

社区结果: en 20 heures de dictée médicale en haut de la réglage moyenne, va faire baisser le vocabulaire médical en haut de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglage de la réglementation de la réglementation de la réglement de la réglement de la réglement de la réglement de la réglementation de la réglement de la réglement de la réglement de la réglement de la réglement de la réglement de la réglement de la réglement de la réglement de la réglement de la réglement de la réglement de la réglement de la réglement de la réglement de la réglement de la réglement de la rég


```figure
sp-asr-attention
```

## Faites-le

### Étape 1: 直接运行 Sourire

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe(
    "clip.wav",
    language="en",
    task="transcribe",
    temperature=0.0,
    condition_on_previous_text=False,  # prevents runaway repetition
)
print(result["text"])
for seg in result["segments"]:
    print(f"[{seg['start']:.2f}–{seg['end']:.2f}] {seg['text']}")
```

Vous devriez toujours couvrir les principales défauts:`temperature=0.0`(échantillonnage 默认是 0.0 → 0.2 → 0.4 ... chaîne de retrait)`condition_on_previous_text=False`(prévenir le problème de l'hallucination en cascade), ainsi que `no_speech_threshold=0.6`(détection du silence)

### Étape 2: forme longue en morceaux

```python
# whisperx is the 2026 reference for long-form with word-level timestamps
import whisperx
model = whisperx.load_model("large-v3-turbo", device="cuda", compute_type="float16")
segments = model.transcribe("1hour.mp3", batch_size=16, chunk_size=30)
```

WhisperX 添加了 (1) Silero VAD gate,(2) 通过 wav2vec 2.0 faire l'alignement au niveau du mot,(3) 通过 `pyannote.audio`Faire la diarisation... c'est le cheval de travail de la production de transcriptions en 2026...

### Étape 3: Utilisez la réglage fine LoRA

```python
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from peft import LoraConfig, get_peft_model

model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-large-v3-turbo")
lora = LoraConfig(
    r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"],
    lora_dropout=0.1, bias="none", task_type="SEQ_2_SEQ_LM",
)
model = get_peft_model(model, lora)
# model.print_trainable_parameters()  -> ~3M trainable / 809M total
```

Puis utilisez la boucle standard Trainer. Pour chaque 1000 étapes, un point de contrôle.

### Étape 4:                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

```python
# Grab cross-attention weights during decode to see what the decoder attends to.
with torch.inference_mode():
    out = model.generate(
        input_features=features,
        return_dict_in_generate=True,
        output_attentions=True,
    )
# out.cross_attentions: layer × head × step × src_len
```

Avec la carte de chaleur 可视化, vous verrez les étapes du décodeur 扫过编码框架 时形成对齐横向──这条横向就是对词时刻的理解的语──

## Utilisez-le

L'étape 2026:

| Situation | Pick |
|-----------|------|
| 通用 English，offline | 通过 `whisperx` 使用 Large-v3-turbo |
| Mobile / edge | Whisper-Tiny quantized (int8) 或 Moonshine |
| Multilingual long-form | Large-v3 via `whisperx` + diarization |
| Low-resource language | 用 LoRA fine-tune Medium 或 Turbo |
| Streaming（2 s latency） | Whisper-Streaming 或 Parakeet-TDT |
| Word-level timestamps | WhisperX（通过 wav2vec 2.0 forced alignment） |

`faster-whisper`(CTranslate2 backend) est le plus rapide de 2026 année CPU + GPU déduction de temps d'exécution, par rapport à la vanille 快 4×, la même sortie.

## Des pièges qui vont encore arriver en 2026

- **Hallucinated text on silence。**Whisper 基于标题 训练,包含"Merci de vous avoir regardé!"、"Saucifier!"、tits chansons。调用前始终做 VAD-gate。
- **`condition_on_previous_text` cascade。**Une hallucination va contaminer les fenêtres. À moins que vous n'ayez besoin de fluidité à travers les morceaux.`False`Il y a une autre.
- **Short-clip padding。**Un rembourrage de clip de 2 secondes jusqu'à 30 secondes plus tard, il peut halluciner dans le silence.`pad=False`Ou à la porte de la VAD.
- **Wrong mel stats。**Utiliser des mélanges de bibliothèque et non des mélanges de chuchotement, se produira presque à la fois.`whisper.audio.log_mel_spectrogram`Il y a une autre.

## La faire partir

保存为 `outputs/skill-whisper-tuner.md`◊ Pour un domaine déterminé   concevoir un pipeline de résonance ou d'inférence ◊

## Exercices

1. **Easy.**运行  référencement`code/main.py`Il symbolise une requête de style Whisper, calcule les budgets de forme décodés, et imprime un calendrier de 10 minutes de clip.
2. **Medium.**Montage`faster-whisper`,转写一个10分钟播客,并与人类转录比较WER――尝试 `language="auto"`Avec une obligation`language="en"`Il y a une autre.
3. **Hard.**Utilisation de la HF `datasets`, choisir une langue de chuchotement , par exemple en urdu), en 2 heures de données sur l'utilisation de LoRA fine-tune Medium 2 epochs,并报告 WER delta。

## Les termes clés

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| 30-sec window | Whisper 的限制 | 硬性 input cap；对更长 audio 做 chunk。 |
| SOT | Start-of-transcript | `<\|startoftranscript\|>` 启动 decoder prompt。 |
| Timestamps token | Temporal alignment | 每个 0.02 s offset 都是 51k vocab 中的 special token。 |
| Turbo | 快速 variant | 4-decoder layers，快 8×，<1% WER regression。 |
| WhisperX | long-form wrapper | VAD + Whisper + wav2vec alignment + diarization。 |
| LoRA fine-tune | Efficient tuning | 向 attention 添加 low-rank adapters；训练约 0.3% 的 params。 |
| Hallucination | 静音 failure | Whisper 从 noise/silence 中产生流畅 English。 |

## Pour en savoir plus

- [Radford et al. (2022). Whisper paper](https://arxiv.org/abs/2212.04356) Originaire architecture 和 recette de formation
- [OpenAI (2024). Whisper Large-v3-turbo release](https://github.com/openai/whisper/discussions/2363)Décoder à 4 couches, accélération 8 fois.
- [Bain et al. (2023). WhisperX](https://arxiv.org/abs/2303.00747) long-forme 、paramètres alignés 、diariés ✿
- [Systran — faster-whisper repo](https://github.com/SYSTRAN/faster-whisper) CTranslate2 supporté, rapidement 4×。
- [HuggingFace — Whisper fine-tune tutorial](https://huggingface.co/blog/fine-tune-whisper) LoRA canonique / traversée à plein FT。
