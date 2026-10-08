# Clonage et conversion de voix

> Le clonage de la voix utilisera la voix d'autrui pour lire votre texte. La conversion de la voix se fera en conservant ce que vous dites, tout en transformant votre voix en la voix d'autrui.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 07 (TTS)
**Time:** ~75 分钟

## Le problème

En 2026, un clip audio de 5 secondes est déjà suffisant pour utiliser un GPU de consommation pour produire un clone de haute qualité de tout le monde. ElevenLabs, F5-TTS, OpenVoice v2, VoiceBox ont déjà fourni un clonage à zéro coup ou à quelques coups. Cette technique est à la fois une bonne nouvelle, l'accessibilité TTS, le traitement des sons, l'assistance des sons, l'équipement et l'arme.

 Deux missions étroitement liées:

- **Voice cloning（TTS 侧）：**texte + 5 secondes de référence voix → Le son de l'audio
- **Voice conversion（speech 侧）：**source audio(A dit X) + voix de référence de B → B dit X de l'audio。

 Tous deux vont mettre en forme d'onde la répartition en contenu, haut-parleur, prosodie, répartition du contenu d'une source avec celui d'une autre source, réassemblement.

Vous devez satisfaire à ces conditions essentielles en 2026:**watermarking 与 consent gates 在 EU（AI Act，2026 年 8 月可执行）和 California（AB 2905，2025 年生效）已是法律要求**◊ Votre pipeline ◊ doit sortir une marque d'eau inaudible,并拒绝未经同意的克隆──

## Le concept

![Voice cloning vs conversion: factorize, swap speaker, recombine](../assets/voice-cloning.svg)

**Zero-shot cloning。**Le clip de 5 secondes sera transmis à un modèle de plusieurs milliers de locuteurs.

Il est également possible de faire une demande de règlement de la situation en cas de non-respect des droits de l'homme.

**Few-shot fine-tuning。**L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur a écrit: "L'auteur est-L'a-L'a-L'a-L'a-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-T-

**Voice conversion（VC）。**两类方法:

- **Recognition-synthesis。**运行类似ASR的模型来提取内容表示 (例如软音体后teriors、PPGs), puis utiliser le haut-parleur cible intégrant 重新合成──对语言 和口音 更稳健──KNN-VC(2023)、Diff-HierVC(2023) utiliser cette méthode──
- **Disentanglement。**訓練一個自動編碼器,在瓶頸的隱藏空間中分离內容、音箱 和 prosody──推理時替換音箱嵌入──質量較低但更快──AutoVC(2019)、VITS-VC 變體使用此方法──

**基于 Neural codec 的 cloning（2024+）。**VALL-E、VALL-E 2、NaturalSpeech 3、VoiceBox  Vidéo audio 视为来自SoundStream / EnCodec's离散代币, 在代币上训练大型autoregressive或流量匹配模型──短提示 上的质量可与ElevenLabs 相比──

### 伦理部分, ne sont pas des ajouts

**Watermarking。**PerTh (Perth) et SilentCipher (SilentCipher) seront incorporés à l'audio en 16 à 32 bits.

**Consent gates。**Il faut que chaque sortie clonée soit enregistrée avec le consentement de la personne à qui elle a été clonée.

**Detection。**AASIST、RawNet2 和 Wav2Vec2-AASIST fournissent des détecteurs。Les résultats du défi ASVspoof 2025 montrent que les détecteurs de pointe pour ElevenLabs、VALL-E 2 和 Bark  ÉER de sortie est de 0,82,3%。

### Nombre de personnes

| Model | Zero-shot? | SECS (target sim) | WER (intel.) | Params |
|-------|-----------|--------------------|--------------|--------|
| F5-TTS | Yes | 0.72 | 2.1% | 335M |
| XTTS v2 | Yes | 0.65 | 3.5% | 470M |
| OpenVoice v2 | Yes | 0.70 | 2.8% | 220M |
| VALL-E 2 | Yes | 0.77 | 2.4% | 370M |
| VoiceBox | Yes | 0.78 | 2.1% | 330M |

SECS > 0,70 est généralement difficile à distinguer du son cible pour la plupart des auditeurs.


```figure
sp-voice-factorize
```

## Faites-le

### Étape 1: avec la synthèse de reconnaissance`main.py`(démonstration en code seulement)

```python
def clone_pipeline(ref_audio, text, target_embedder, tts_model):
    speaker_emb = target_embedder.encode(ref_audio)
    mel = tts_model(text, speaker=speaker_emb)
    return vocoder(mel)
```

Le concept est très simple; la principale complexité de la réalisation est`tts_model`和 le codeur haut-parleur 中。

### Étape 2: Utilisez F5-TTS pour faire un clone à tir zéro

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="rohit_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please add milk and bread to my list.",
)
```

La transcription de référence doit être parfaitement compatible avec l'audio; non-cohérente va perturber l'alignement.

### Étape 3: Utilisez KNN-VC pour effectuer la conversion vocale

```python
import torch
from knnvc import KNNVC  # 2023 model, https://github.com/bshall/knn-vc
vc = KNNVC.load("wavlm-base-plus")
out_wav = vc.convert(source="my_voice.wav", target_pool=["alice_1.wav", "alice_2.wav"])
```

KNN-VC 运行 WavLM, pour source avec pool cible 提取 per-frame embedments, puis remplacer chaque cadre source 替换为 pool middle's nearest neighbor──非参数方法, using一分钟 target speech 即可工作──

### Étape 4: 嵌入 watermark

```python
from silentcipher import SilentCipher
sc = SilentCipher(model="2024-06-01")
payload = b"consent_id:abc123;ts:1745353200"
watermarked = sc.embed(wav, sr=24000, message=payload)
detected = sc.detect(watermarked, sr=24000)   # returns payload bytes
```

Environ 32 bits de charge utile, en MP3 re-encode et léger bruit 后仍可检测──

### Étape 5: porte de consentement

```python
def cloned_inference(text, ref_audio, consent_record):
    assert verify_signature(consent_record), "Signed consent required"
    assert consent_record["speaker_id"] == hash_speaker(ref_audio)
    wav = tts.infer(ref_file=ref_audio, gen_text=text)
    wav = watermark(wav, payload=consent_record["id"])
    return wav
```

## Utilisez-le

Stack de l'année 2026:

| Situation | Pick |
|-----------|------|
| 5 秒 zero-shot clone，open-source | F5-TTS 或 OpenVoice v2 |
| 商业生产 cloning | ElevenLabs Instant Voice Clone v2.5 |
| Voice conversion（rewriting） | KNN-VC 或 Diff-HierVC |
| Many-speaker fine-tune | StyleTTS 2 + speaker adapter |
| Cross-lingual cloning | XTTS v2 或 VALL-E X |
| Deepfake detection | Wav2Vec2-AASIST |

## Les pièges

- **Reference transcript 未对齐。**F5-TTS 和类似模型要求参考文献与参考音频 完全匹配,包括标点──
- **Reference 有混响。**Echo va détruire le clone.
- **情绪不匹配。**le happy de la référence d'entraînement L'effet de la référence le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le content le le content le le content le le le le le le le le le le le le le le lelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelelele
- **Language leakage。**Clone anglophone 后让模型说法语,通常仍会带着口音; utiliser des modèles multilingues XTTS、VALL-E X)
- **没有 watermark。**Depuis le 8 août 2026, dans l'UE, il est impossible de publier légalement.

## La faire partir

保存为 `outputs/skill-voice-cloner.md` concevoir une passerelle avec consentement + marque d'eau + cible de qualité de clonage ou de conversion 

## Exercices

1. **Easy。**运行  référencement`code/main.py`◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊ ◊   ◊ ◊     ◊                                                                                                                                                      
2. **Medium。**Utilisez le clone OpenVoice v2 Votre propre voix, référence de mesure et de clone entre SECS et CER.
3. **Hard。**Pour 20 clones  appliquer SilentCipher watermark, les utiliseront à travers 128 kbps MP3 encode + décode, re-examiner la charge utile― rapport de précision bit―

## Les termes clés

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Zero-shot clone | 5 秒就够了 | Pretrained model + speaker embedding；不需要训练。 |
| PPG | Phonetic posteriorgram | 用作 language-agnostic content rep 的 per-frame ASR posteriors。 |
| KNN-VC | Nearest-neighbor conversion | 将每个 source frame 替换为 nearest target-pool frame。 |
| Neural codec TTS | VALL-E style | EnCodec/SoundStream tokens 上的 AR model。 |
| Watermark | Inaudible signature | 嵌入 audio 中的 bits，可经受 re-encode。 |
| SECS | Cloning fidelity | target 与 clone 的 speaker embeddings 之间的 cosine。 |
| AASIST | Deepfake detector | Anti-spoof model；检测 synthesized speech。 |

## Pour en savoir plus

- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) clonage à cible de SOTA à source ouverte, à tir zéro 
- [Baevski et al. / Microsoft (2023). VALL-E](https://arxiv.org/abs/2301.02111)et [VALL-E 2 (2024)](https://arxiv.org/abs/2406.05370) TTS codec neuronal。
- [Qian et al. (2019). AutoVC](https://arxiv.org/abs/1905.05879)  Conversion vocale basée sur la désintégration
- [Baas, Waubert de Puiseau, Kamper (2023). KNN-VC](https://arxiv.org/abs/2305.18975)  VC basé sur la récupération 
- [SilentCipher (2024) — Audio Watermarking](https://github.com/sony/silentcipher) Produire un code d'eau audio à 32 bits.
- [ASVspoof 2025 results](https://www.asvspoof.org/) Détecteur et synthétiseur de compétition d'armement, 2026
