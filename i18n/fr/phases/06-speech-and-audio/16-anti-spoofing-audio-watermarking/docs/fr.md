# 语音反欺骗与音频水印  ASVspoof 5, AudioSeal, WaveVerify

> Le système de production de voix de 2026 a besoin de deux choses: un testeur qui comprendra le vrai langage et un faux langage, AASIST, RawNet2), ainsi qu'un marque-eau capable de compresser et d'éditer, AudioSeal.

**Type:** Build
**Languages:** Python
**先修要求：**Phase 6 · 06 (Récognition des haut-parleurs), phase 6 · 08 (Clonage de la voix)
**Time:** ~75 minutes

##  problématique

3 types de défense:

1. **Anti-spoofing / deepfake detection.**给定一段音频, est-ce synthétique ou réel ?
2. **Audio watermarking.**Dans le génération de son, le signal est inséré dans le capteur, puis il peut être extrait.
3. **Authenticated provenance.**Pour les fichiers et les métadonnées en direct, le C2PA / Content Authenticity Initiative

Détection  traitement non conforme des opposants  Watermarking  traitement conforme à la norme, AI 生成的音频应被识别为此类音频──2026年两者都必需──

## 概念

![Anti-spoofing vs watermarking vs provenance — 三层防御](../assets/spoofing-watermark.svg)

### ASVspoof 5  référence 2024-2025

Par rapport à la version précédente, la plus grande variation:

- **Crowdsourced data**(Non enregistrés) 现实条件──
- **~2000 speakers**(Behand environ ~100)
- **32 个 attack algorithms.**TTS + conversion vocale + perturbation adversitaire。
- **Two tracks.**Contremaçon (CM) 独立检测; face向生物识别系统的SPOIFING-robust ASV (SASV) ⋅

Les États-Unis de l'Est sont en train de se développer pour la première fois en 2019.

### AASIST 和 RawNet2  检测模型家族

**AASIST**(2021, continuellement mis à jour jusqu'en 2026):

**RawNet2.**基于 la forme d'onde brute de l'avant-dernier convolutif + la colonne vertébrale TDNN.

**NeXt-TDNN + SSL features.**2025 变体: style ECAPA + caractéristiques WavLM + perte de focale──在 ASVspoof 2019 LA atteint 0,42% EER──

### AudioSeal  2024 年默认 watermark

Meta **AudioSeal**Le projet de loi de la République de Russie sur les droits de l'homme est un projet de loi de la République de Russie sur les droits de l'homme.

- **Localized.**É 16 kHz 采样分辨率 ((1/16000 s) par révélation de la marque d'eau
- **Generator + detector jointly trained.**Générateur de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de l'équipement de détection de détection de l'équipement de détection de détection de l'équipement de détection de détection.
- **Robust.**能经受 MP3 / AAC 压缩、EQ、转速 ±10%、噪音混合 +10 dB SNR。
- **Fast.**Détecteur 以 485× en temps réel 运行;比WavMark 快 1000×──
- **Capacity.**16 bits de charge utile (ID du modèle, timestamp de génération, ID de l'utilisateur)

### Le marqueur

AudioSeal 之前的开放基线──réseau neural invertible,32 bits/sec──问题:

- La synchronisation brute force est lente.
- 可被 Gaussian noise 或 MP3 压缩移除──
- Ça ne va pas.

### La série de films de la série "La vie de l'homme"

解决 AudioSeal's weaknesses, en particulier les manipulations temporelles(reversation, vitesse)。 utiliser basé sur le générateur FiLM + détecteur Mixture-of-Experts。

### Défaut de l'utilisation des résistants

De AudioMarkBench: " Sous le changement de pitch, tous les marqueurs d'eau montrent une précision de récupération de bits inférieure à 0,6, ce qui indique une suppression presque complète. " **Pitch-shift 是通用攻击。**2026                                                                                                                                                                                                                                                              

### C2PA / Initiative sur l'authenticité du contenu

Il s'agit d'un document de format manifeste, mais qui contient des métadonnées de créateurs, d'auteurs et de signatures. Il est adapté à l'origine.


```figure
v4-audio-watermark
```

## - Je le construis.

### 步骤 1: Un simple détecteur de caractéristiques spectrales (j'ai joué avec)

```python
def spectral_rolloff(spec, percentile=0.85):
    cum = 0
    total = sum(spec)
    if total == 0:
        return 0
    threshold = total * percentile
    for k, v in enumerate(spec):
        cum += v
        if cum >= threshold:
            return k
    return len(spec) - 1

def is_suspicious(audio):
    spec = magnitude_spectrum(audio)
    rolloff = spectral_rolloff(spec)
    return rolloff / len(spec) > 0.92
```

Le langage synthétique a généralement une haute fréquence d'énergie inhabituelle.

### 步骤 2: AudioSeal intégrer + détecter

```python
from audioseal import AudioSeal
import torch

generator = AudioSeal.load_generator("audioseal_wm_16bits")
detector = AudioSeal.load_detector("audioseal_detector_16bits")

audio = load_wav("generated.wav", sr=16000)[None, None, :]
payload = torch.tensor([[1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0]])
watermark = generator.get_watermark(audio, sample_rate=16000, message=payload)
watermarked = audio + watermark

result, decoded_payload = detector.detect_watermark(watermarked, sample_rate=16000)
# result: float in [0, 1] — probability of watermark presence
# decoded_payload: 16 bits; match against embedded payload
```

### 步骤 3: évaluation  EER

```python
def eer(real_scores, fake_scores):
    thresholds = sorted(set(real_scores + fake_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in fake_scores if s >= t) / len(fake_scores)
        frr = sum(1 for s in real_scores if s < t) / len(real_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

### 步骤 4: Produit intégré

```python
def safe_tts(text, voice, clone_reference=None):
    if clone_reference is not None:
        verify_consent(user_id, clone_reference)
    audio = tts_model.synthesize(text, voice)
    audio_with_wm = audioseal_embed(audio, payload=build_payload(user_id, model_id))
    manifest = c2pa_sign(audio_with_wm, user_id, timestamp=now())
    return audio_with_wm, manifest
```

Chaque génération comprend: 1) marque d'eau, 2) manifeste signé, 3) journal d'audit conforme à la politique de conservation.

## Utilisez-le

| Use case | Defense |
|----------|---------|
| 上线 TTS / voice cloning | 每个输出都Embedding AudioSeal（不可协商） |
| Biometric voice unlock | AASIST + ECAPA ensemble；liveness challenge |
| Call-center fraud detection | 对 20% 的来电样本运行 AASIST |
| Podcast authenticity | 上传时进行 C2PA signing，若为 AI-generated 则使用 AudioSeal |
| Research / training detectors | ASVspoof 5 train/dev/eval sets |

## La trappe

- **Watermark 从未被 detector 运行检测。**Il n'y a pas de sens à mettre le détecteur dans votre IC.
- **Detection 没有 calibration。**Dans les USA, les AASIST sont surchargés.
- **Pitch-shift gap.**激进的音速转移 会移除大多数水印── 準備检测倒退──
- **Metadata strip-and-rehost.**C2PA  facile à refaire en utilisant le code de code de type C2PA  facile à refaire en utilisant le code de type C2PA  facile à refaire en utilisant le code de type C2PA  facile à refaire en utilisant le code de type C2PA  facile à refaire en utilisant le code de type C2PA  facile à refaire en utilisant le code de type C2PA  facile à refaire en utilisant le code de type C2PA  facile à refaire en utilisant le code de type C2PA  facile à refaire en utilisant le code de type C2PA  facile à refaire en utilisant le code de type C2PA  facile à refaire en utilisant le code de type C2PA  toujours à ajouter avec le code de type C2PA  toujours à utiliser le code de type C2PA  toujours à utiliser
- **把 liveness 当成 detection。**要求用户说一个随机短语──它能阻止重播攻击,但不能阻止实时克隆──

## Je le livre.

保存为 `outputs/skill-spoof-defender.md` Pour la génération vocale 部署选择检测模型、watermark、 provenance manifest 和 operation playbook──

## 练习

1. **Easy.**运行  référencement`code/main.py`◊ Dans l'audio synthétique 上使用 détecteur de jouets + marque d'eau de jouets embed/detect。
2. **Medium.**Montage`audioseal`, dans TTS 输出中Embedding 16-bit payload,再重新解码──用噪音破坏音频并测量Bit Recovery Accuracy──
3. **Hard.**Dans l'ASVspoof 2019 LA, on peut voir comment la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|-----------------|-----------------------|
| ASVspoof | benchmark | 两年一次的 challenge；2024 = ASVspoof 5。 |
| CM (countermeasure) | Detector | Classifier：真实语音 vs synthetic / converted。 |
| SASV | Speaker verif + CM | 集成的 biometric + spoof detection。 |
| AudioSeal | Meta watermark | Localized，16-bit payload，比 WavMark 快 485×。 |
| Bit Recovery Accuracy | Watermark survival | 攻击后恢复的 payload bits 比例。 |
| C2PA | Provenance manifest | 关于创建 / 作者身份的加密 metadata。 |
| AASIST | Detector family | 基于 graph-attention 的 anti-spoofing SOTA。 |

## 延伸阅读

- [Todisco et al. (2024). ASVspoof 5](https://dl.acm.org/doi/10.1016/j.csl.2025.101825) Actuelle référence。
- [Defossez et al. (2024). AudioSeal](https://arxiv.org/abs/2401.17264) 默认 marque d'eau
- [Chen et al. (2025). WaveVerify](https://arxiv.org/abs/2507.21150) Détecteur de MoE d'attaques temporaires 
- [Jung et al. (2022). AASIST](https://arxiv.org/abs/2110.01200) L'épine dorsale de détection de SOTA。
- [AudioMarkBench (2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/5d9b7775296a641a1913ab6b4425d5e8-Paper-Datasets_and_Benchmarks_Track.pdf) évaluation de la robustesse。
- [C2PA specification](https://c2pa.org/specifications/specifications/) manifestation de provenance 格式。
