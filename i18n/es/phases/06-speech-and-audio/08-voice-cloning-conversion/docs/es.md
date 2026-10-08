# Cloning de voz y conversión de voz

> La clonación de voz se utiliza para leer tu texto con la voz de otra persona. La conversión de voz se mantiene en el contenido que dices, mientras que la voz se transforma en la voz de otra persona.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 07 (TTS)
**Time:** ~75 分钟

## El problema

En 2026 años, un fragmento de 5 segundos de audio ya está suficiente para usar el consumo de GPU para producir clones de alta calidad de cualquier voz. ElevenLabs, F5-TTS, OpenVoice v2, VoiceBox ya han proporcionado clones de cero disparos o pocos disparos. Esta tecnología es un instrumento de acceso a TTS, distribución de sonidos, y también un arma.

 Dos tareas estrechamente relacionadas:

- **Voice cloning（TTS 侧）：**texto + 5 segundos de referencia voz → El audio de la voz
- **Voice conversion（speech 侧）：**Audio fuente(A decir X) + B de la voz de referencia → B decir X de audio。

 ambos se dividen en forma de onda contentspeakerprosody), re-pongan el contenido de una fuente con el de otro fuente 重新组合

En 2026 se publicará una serie de requisitos clave que debe cumplir:**watermarking 与 consent gates 在 EU（AI Act，2026 年 8 月可执行）和 California（AB 2905，2025 年生效）已是法律要求**◊ tu tubería ◊ debe emitir una marca de agua inaudible,并拒绝未经同意的克隆──

## El concepto

![Voice cloning vs conversion: factorize, swap speaker, recombine](../assets/voice-cloning.svg)

**Zero-shot cloning。**Se transmitirá un clip de 5 segundos a un modelo entrenado por miles de oradores. Se programará un código de altavoces para que el clip se diseñe para el embebedido de altavoces.

Usuario:F5-TTS(2024) 、TuTTS(2022) 、XTTS v2(2024) 、OpenVoice v2(2024) ✿

**Few-shot fine-tuning。**录制目标声音的 5-30 分钟音频──对基模型进行一小时 LoRA fine-tune──质量会从还行跃升到难以区分──Coqui 和 ElevenLabs todos apoyan este modelo; la comunidad también lo utilizará para F5-TTS──

**Voice conversion（VC）。**两类方法:

- **Recognition-synthesis。**运行类似ASR的模型来提取内容表示 (por ejemplo, posteriors de fonemas blandos, PPGs), luego usar un altavoz objetivo incorporando 重新合成──对语言 和口音 更稳健──KNN-VC(2023)、Diff-HierVC(2023) utilizar este método──
- **Disentanglement。**训练一个自动编码器,在瓶的潜门空间中分离内容、扬声器 和 prosody──推理时替换扬声器嵌入──质量较低但更快──AutoVC(2019)、VITS-VC 变体使用这种方法──

**基于 Neural codec 的 cloning（2024+）。**VALL-E、VALL-E 2、NaturalSpeech 3、VoiceBox                                                                                                                                                                                                                                                     

### 伦理部分, no es un complemento

**Watermarking。**PerTh (Perth) y SilentCipher (SilentCipher) (en 2024) se incorporarán en el audio de forma insensible a unos 16-32 bits de ID.

**Consent gates。** tenéis que hacer que cada producción clonada sea compatible con el registro de consentimiento de la prueba 配对──我, Rohit, 2026-04-22, autorizado para usar esta voz con el propósito X── almacenado en un registro de manipulación evidente──

**Detection。**AASIST、RawNet2 和 Wav2Vec2-AASIST también proporcionan detector──ASVspoof 2025 challenge 发布的结果显示, state-of-the-art detectors 针对ElevenLabs、VALL-E 2 和 Bark 输出 EER为0.82.3%──

### Números (en el 2026)

| Model | Zero-shot? | SECS (target sim) | WER (intel.) | Params |
|-------|-----------|--------------------|--------------|--------|
| F5-TTS | Yes | 0.72 | 2.1% | 335M |
| XTTS v2 | Yes | 0.65 | 3.5% | 470M |
| OpenVoice v2 | Yes | 0.70 | 2.8% | 220M |
| VALL-E 2 | Yes | 0.77 | 2.4% | 370M |
| VoiceBox | Yes | 0.78 | 2.1% | 330M |

SECS > 0,70 para la mayoría de los oyentes es difícil de distinguir entre el sonido objetivo.


```figure
sp-voice-factorize
```

## Construye el mismo

### Paso 1: Use reconocimiento-síntesis 分解(`main.py`(Demo sólo en código)

```python
def clone_pipeline(ref_audio, text, target_embedder, tts_model):
    speaker_emb = target_embedder.encode(ref_audio)
    mel = tts_model(text, speaker=speaker_emb)
    return vocoder(mel)
```

 concept es muy simple; la mayor complejidad de la realización es `tts_model`Y el codificador de altavoces 中。

### Paso 2: Con el F5-TTS hacer un clonado de tiro cero

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="rohit_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please add milk and bread to my list.",
)
```

La transcripción de referencia mustly compete con el audio completamente; no compete destruirá la alineación―

### Paso 3: Con KNN-VC hacer conversión de voz

```python
import torch
from knnvc import KNNVC  # 2023 model, https://github.com/bshall/knn-vc
vc = KNNVC.load("wavlm-base-plus")
out_wav = vc.convert(source="my_voice.wav", target_pool=["alice_1.wav", "alice_2.wav"])
```

KNN-VC 运行 WavLM,为源与目标池 提取 per-frame embeddings,然后将每个源框架 替换为池中的最近邻居──非参数方法,使用一分钟目标语句 即可工作──

### Paso 4: 嵌入 en la marca de agua

```python
from silentcipher import SilentCipher
sc = SilentCipher(model="2024-06-01")
payload = b"consent_id:abc123;ts:1745353200"
watermarked = sc.embed(wav, sr=24000, message=payload)
detected = sc.detect(watermarked, sr=24000)   # returns payload bytes
```

约32 bits payload,在 MP3 reencode y poco ruido 后仍可检测──

### Paso 5: Puerta de consentimiento

```python
def cloned_inference(text, ref_audio, consent_record):
    assert verify_signature(consent_record), "Signed consent required"
    assert consent_record["speaker_id"] == hash_speaker(ref_audio)
    wav = tts.infer(ref_file=ref_audio, gen_text=text)
    wav = watermark(wav, payload=consent_record["id"])
    return wav
```

## Usalo

Estaca de 2026 años:

| Situation | Pick |
|-----------|------|
| 5 秒 zero-shot clone，open-source | F5-TTS 或 OpenVoice v2 |
| 商业生产 cloning | ElevenLabs Instant Voice Clone v2.5 |
| Voice conversion（rewriting） | KNN-VC 或 Diff-HierVC |
| Many-speaker fine-tune | StyleTTS 2 + speaker adapter |
| Cross-lingual cloning | XTTS v2 或 VALL-E X |
| Deepfake detection | Wav2Vec2-AASIST |

## Las trampas

- **Reference transcript 未对齐。**F5-TTS 和类似模型要求参考文本与参考音频 完全匹配,包括标点──
- **Reference 有混响。**Echo destruirá el clonado.
- **情绪不匹配。**                                                                                                                                                                                                                                                              
- **Language leakage。**Cloning inglés hablante 后让模型说法语, normalmente todavía lleva con acento; utilizar modelos interlinguísticos XTTS、VALL-E X)
- **没有 watermark。**Desde el 8 de agosto de 2026, en la UE no se puede publicar legalmente.

## Envío

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-voice-cloner.md`◊ diseñar una puerta de acceso con consentimiento + marca de agua + objetivo de calidad de clonación o conversión―

## Los ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`△ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △ △   △                                                                     
2. **Medium。**Utiliza el clonado de OpenVoice v2 Su propia voz, la referencia de la medida y la SECS entre el clonado, a través de Whisper, la medida del CER.
3. **Hard。**Para 20 clones  aplicación SilentCipher marca de agua, los va a través de 128 kbps MP3 codificar + decodificar, volver a examinar la carga útil ― informe de precisión de bits ―.

## Términos clave

| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Zero-shot clone | 5 秒就够了 | Pretrained model + speaker embedding；不需要训练。 |
| PPG | Phonetic posteriorgram | 用作 language-agnostic content rep 的 per-frame ASR posteriors。 |
| KNN-VC | Nearest-neighbor conversion | 将每个 source frame 替换为 nearest target-pool frame。 |
| Neural codec TTS | VALL-E style | EnCodec/SoundStream tokens 上的 AR model。 |
| Watermark | Inaudible signature | 嵌入 audio 中的 bits，可经受 re-encode。 |
| SECS | Cloning fidelity | target 与 clone 的 speaker embeddings 之间的 cosine。 |
| AASIST | Deepfake detector | Anti-spoof model；检测 synthesized speech。 |

## Leer más

- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) Cloning de código abierto de SOTA con disparos cero。
- [Baevski et al. / Microsoft (2023). VALL-E](https://arxiv.org/abs/2301.02111)Y [VALL-E 2 (2024)](https://arxiv.org/abs/2406.05370) TTS de códecs neurales。
- [Qian et al. (2019). AutoVC](https://arxiv.org/abs/1905.05879)  Conversión de voz basada en desentrajación。
- [Baas, Waubert de Puiseau, Kamper (2023). KNN-VC](https://arxiv.org/abs/2305.18975)  VC basado en la recuperación
- [SilentCipher (2024) — Audio Watermarking](https://github.com/sony/silentcipher) 生产可用32 bits de audio marcas de agua
- [ASVspoof 2025 results](https://www.asvspoof.org/) detector y sintetizador de la competencia de armas, 2026
