# Reconnaissance du langage (RAS)  CTC, RNN-T, Attention

> La reconnaissance du langage est effectuée à chaque étape du processus de classification du langage, puis par un modèle de séquence de compréhension de l'anglais et du silence, qui les relie à l'unité.

**Type:** 构建
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 08 (用于文本的 CNNs & RNNs), Phase 5 · 10 (Attention)
**Time:** ~45 分钟

##  problématique

Vous avez un fichier de 10 secondes, 16 kHz. Vous voulez obtenir un fichier: "allumer les lumières de cuisine" Le défi réside dans la structure:

Trois méthodes formalisées peuvent résoudre ce problème:

1. **CTC (Connectionist Temporal Classification)。**输出每的代币 概率, incluant un particulier *blanc*──在解码时折叠重复项和空──非自归,速度快──wav2vec 2.0、MMS 使用它──
2. **RNN-T (Recurrent Neural Network Transducer)。**Le réseau commun dans un cas donné est encodé 和先前Token 预测下一个Token──可流式处理──Google's端侧ASR、NVIDIA Parakeet 使用它──
3. **Attention encoder-decoder。**Le décodeur se concentre sur des états cachés, le décodeur se réunit à travers des états croisés.

En 2026, le taux de SOTA de LibriSpeech test-clean est de 1,4% (Parakeet-TDT-1.1B, NVIDIA) et de 1,58% (Whisper-Large-v3-turbo)

## 概念

![三种 ASR 形式：CTC、RNN-T、attention-encoder-decoder](../assets/asr-formulations.svg)

**CTC 直觉。**让 encoder 输出 `T`个级分布, couverture `V+1`个 Token(V 个字符 + blanc) ⋅对于长度为 `U < T`Le but de la série`y`Je suis en train de me faire un petit défi .`y`Les données de l'analyse de la valeur de l'ensemble des calculs sont calculées par le système de calcul de la valeur de l'ensemble des calculs.

优点:非自归、可流式处理、零前──缺点:*supposition d'indépendance conditionnelle*, c'est-à-dire chaque prédiction est indépendante de l'autre, donc il n'y a pas de modèle de langage interne―可通过束搜索或浅融合 接入外部LM 来修正―

**RNN-T 直觉。**添加一个 *predictor* réseau 来 Embedding Token 历史,并添加一个 *joiner*,将预测器状态与编码器 组合成一个覆盖 `V+1`La distribution commune est à la fois`+1`CTC 忽略的条件依赖――它可流式处理,因为每一步只依赖过去和过去的代币――

优点:可流式处理 + 内部 LM。缺点: entraînement plus complexe et plus consommateur de mémoire(réseau de perte 3D);RNN-T noyaux de perte 本身就是一个完整的库类别。

**Attention encoder-decoder。**Encodeur (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais)) (en anglais) (en anglais) (en anglais) (en anglais)) (en anglais) (en anglais) (en anglais) (en anglais)) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais)) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en anglais) (en ang

优点:离线 ASR 质量最高, facile à utiliser 工具训练――缺点:自归延迟与输出长度成正比;没有工程改造就无法流式处理――

### WER: un chiffre

**Word Error Rate**- Je suis là.`(S + D + I) / N`, dont S = remplacement, D = suppression, I = insertion, N = référence dans le texte.

| Model | LibriSpeech test-clean | LibriSpeech test-other | Size |
|-------|------------------------|------------------------|------|
| Parakeet-TDT-1.1B | 1.40% | 2.78% | 1.1B params |
| Whisper-Large-v3-turbo | 1.58% | 3.03% | 809M |
| Canary-1B Flash | 1.48% | 2.87% | 1B |
| Seamless M4T v2 | 1.7% | 3.5% | 2.3B |

Ces données sont toutes basées sur un codeur-décocteur ou RNN-T.


```figure
ctc-collapse
```

## - Je le construis.

### 步骤 1: décodeur avide du CTC

```python
def ctc_greedy(frame_logits, blank=0, vocab=None):
    # frame_logits: list of per-frame probability vectors
    preds = [max(range(len(p)), key=lambda i: p[i]) for p in frame_logits]
    out = []
    prev = -1
    for p in preds:
        if p != prev and p != blank:
            out.append(p)
        prev = p
    return "".join(vocab[i] for i in out) if vocab else out
```

两条规则: pliage连续重复项, abandonner le vide.`a a _ _ a b b _ c`- Je suis là.`a a b c`Il y a une autre.

### 步骤 2:CTC de recherche de faisceaux

```python
def ctc_beam(frame_logits, beam=8, blank=0):
    import math
    beams = [([], 0.0)]  # (tokens, log_prob)
    for p in frame_logits:
        log_p = [math.log(max(pi, 1e-10)) for pi in p]
        candidates = []
        for seq, lp in beams:
            for t, lpt in enumerate(log_p):
                new = seq[:] if t == blank else (seq + [t] if not seq or seq[-1] != t else seq)
                candidates.append((new, lp + lpt))
        candidates.sort(key=lambda x: -x[1])
        beams = candidates[:beam]
    return beams[0][0]
```

Le préfixe de la recherche de faisceaux d'arbres est le concept de structure.

### 步骤 3: Réservation

```python
def wer(ref, hyp):
    r, h = ref.split(), hyp.split()
    dp = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1):
        dp[i][0] = i
    for j in range(len(h) + 1):
        dp[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            cost = 0 if r[i - 1] == h[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
    return dp[len(r)][len(h)] / max(1, len(r))
```

### 步骤 4: Pour faire une inférence

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("clip.wav")
print(result["text"])
```

C'est la première ligne de l'ASR la plus puissante de l'année 2026... qui fonctionnera en temps réel à environ 20 fois sur une GPU de 24 Go.

### 步骤 5: utiliser Parakeet ou wav2vec 2.0  pour diffuser

```python
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="nvidia/parakeet-tdt-1.1b")
for chunk in streaming_audio():
    print(asr(chunk, return_timestamps=True))
```

L'ASR en streaming  nécessite une attention de l'encodeur en morceaux 和 état de transport; utiliser pour le soutenir`chunk_length_s``transformers`L'équipement de transport

## Utilisez-le

2026:

| Situation | Pick |
|-----------|------|
| 英语、离线、最高质量 | Whisper-large-v3-turbo |
| 多语言、鲁棒 | SeamlessM4T v2 |
| Streaming、低延迟 | Parakeet-TDT-1.1B 或 Riva |
| Edge、移动端、<500 ms 延迟 | Whisper-Tiny quantized 或 Moonshine (2024) |
| Long-form | 带 VAD-based chunking 的 Whisper (WhisperX) |
| 特定领域（医疗、法律） | Fine-tune wav2vec 2.0 + domain LM fusion |

## En 2026, il y aura encore des fossés de production.

- **没有 VAD。**Dans la suite, je me suis dit: "Merci de vous avoir regardé".
- **字符 vs 词 vs subword WER。**Dans le cas d'une réforme de la norme, la norme est de type "réforme de la norme".
- **Language ID drift。**LID automatique de Whisper va transférer les clips de bruit à travers le langage japonais ou le Welsh; lorsque vous déterminez la langue, forcément.`language="en"`Il y a une autre.
- **长片段不做 chunking。**Sous-sucez il y a une fenêtre de 30 secondes.`chunk_length_s=30, stride=5`Il y a une autre.

## Je le livre.

保存为 `outputs/skill-asr-picker.md`◊ Pour un déploiement déterminé, l'objectif est de choisir le modèle, la stratégie de décodage, le déchiquetage et la fusion de LM.

## 练习

1. **Easy。**运行  référencement`code/main.py`Il décode en gros les CTC de construction manuelle, et calculent le WER du texte de référence.
2. **Medium。**Réfléchissez à la règle de fusion vide (en anglais) ⋅ dans 10 exemples de données synthétiques sur la recherche de faisceaux de préfixes-arbres.
3. **Hard。**Dans le[LibriSpeech test-clean](https://www.openslr.org/12)上使用 `whisper-large-v3-turbo`△ calcul △ 100 条 des déclarations de WER── avec les chiffres publiés

## 关键术语

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| CTC | blank-token loss | 对所有 frame-to-token 对齐做 marginal；非 AR。 |
| RNN-T | streaming loss | CTC + next-token predictor；处理词序。 |
| Attention enc-dec | Whisper-style | Encoder + cross-attending decoder；最佳离线质量。 |
| WER | 你报告的数字 | 词级 `(S+D+I)/N`。 |
| Blank | 空白 | CTC 中表示“此帧无发射”的特殊 Token。 |
| LM fusion | 外部 language model | 在 beam search 期间加入加权 LM log-probs。 |
| VAD | 静音门控 | Voice activity detector；裁剪非语音。 |

## 延伸阅读

- [Graves et al. (2006). Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf) CTC 论文。
- [Graves (2012). Sequence Transduction with RNNs](https://arxiv.org/abs/1211.3711) RNN-T 论文。
- [Radford et al. / OpenAI (2022). Whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) 2022 année canonique 论文; v3-turbo 扩展 publié à 2024 年。
- [NVIDIA NeMo — Parakeet-TDT card](https://huggingface.co/nvidia/parakeet-tdt-1.1b) Tableau de classement des RAS ouvertes 2026 榜首──
- [Hugging Face — Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) 覆盖25+ modèles 的实时基准──
