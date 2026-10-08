# 语音反欺骗与音频水印  ASVspoof 5, AudioSeal, WaveVerify

> La velocidad de la línea de clonación de voz ha superado rápidamente los medios de defensa. El sistema de producción de nivel de voz de 2026 necesita dos cosas: un que haga un verdadero idioma y un falso idioma de clase de detector (AASIST, RawNet2), y un que pueda ser comprimido y editado (AudioSeal) (B) (B) (B) (B) (B) (B) (B) (B) (B) (B) (B) (B) (B) (B) (B) (B) (B) (C) (B) (B) (B) (B) (C) (B) (B) (B) (B) (B) (B) (B) (C) (B) (B) (B) (C) (B) (B) (B) (C) (B) (B) (C) (B) (C) (B) (C) (B) (C) (C) (B) (C) (C) (C) (C) (C) (C) (C) (C) (C) (C) (C) (C) (C) (C) (C) (C) (D) (C) (C) (C) (C) (C) (D) (C) (C) (D) (C) (D) (C) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D) (D)

**Type:** Build
**Languages:** Python
**先修要求：**Fase 6 · 06 (Reconocimiento de altavoces), Fase 6 · 08 (Cloning de voz)
**Time:** ~75 minutes

##  problemas

Tres clases relacionadas con la defensa:

1. **Anti-spoofing / deepfake detection.**给定一段音频, ¿es sintético o real? ASVspoof benchmarksASVspoof 2019 → 2021 → 5) es el estándar de oro
2. **Audio watermarking.**En la generación de sonido en el que se emplaza una señal insensible, después del inspector se puede extraerla.
3. **Authenticated provenance.**Se ha realizado una investigación de la Comisión de Derechos Humanos en el ámbito de la protección de los derechos humanos.

Detección 处理不配合的对抗者──watermarking 处理合规性,AI 生成的音频应被识别为这种音频──2026年两者都必需──

## 概念

![Anti-spoofing vs watermarking vs provenance — 三层防御](../assets/spoofing-watermark.svg)

### ASVspoof 5  referencia 2024-2025

En comparación con la versión anterior, el mayor cambio:

- **Crowdsourced data**(no están en el registro) 现实条件──
- **~2000 speakers**(Hoy alrededor de 100)
- **32 个 attack algorithms.**TTS + conversión de voz + perturbación adversariala。
- **Two tracks.**Contramedida (CM) 独立检测;面向生物识别系统的SPOofing-robust ASV (SASV) ⋅

ASVspoof 5 上 上的 state-of-the-art: ~7.23% EER。 en comparación con ASVspoof 2019 LA:0.42% EER。

### AASIST y RawNet2  检测模型家族

**AASIST**(2021, continuado hasta 2026) ⋅ en características espectral 上使用图表注意──当前是 ASVspoof 5 countera-measure 任务的SOTA──

**RawNet2.**基于 la forma de onda en bruto de la parte delantera convolucional + la columna vertebral TDNN.

**NeXt-TDNN + SSL features.**2025 变体:ECAPA-style + características WavLM + pérdida focal──在 ASVspoof 2019 LA 上 alcanzar 0.42% EER──

### AudioSeal  2024 年默认 marca de agua

Meta de **AudioSeal**(2024 年 1 月,v0.2 2024 年 12 月) ⋅ 关键设计:

- **Localized.**Es decir, el valor de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen de la imagen.
- **Generator + detector jointly trained.**El generador se encuentra en el sistema de detección.
- **Robust.**能经受 MP3 / AAC 压缩、EQ、转速 ±10%、噪音混合 +10 dB SNR。
- **Fast.**Detector 以 485× tiempo real 运行;比WavMark 快 1000×──
- **Capacity.**Carga útil de 16 bits (código de identificación de modelo, sello de tiempo de generación, identificación de usuario)

### WavMark

AudioSeal 之前的开放基线──Invertible neural network,32 bits/sec──问题:

- Sincronización de fuerza bruta 很慢──
- Puede ser el ruido gaussiano o MP3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
- No es adecuado para el tiempo real.

### WaveVerify(2025 年 7 月)

 resolver las debilidades de AudioSeal, especialmente las manipulaciones temporales(reversión, velocidad)  utilizar basado en FiLM de generador + Detector de Mixtura de Expertos。

### La falta de capacidad de los oponentes

De AudioMarkBench:"Bajo el cambio de tono, todas las marcas de agua muestran la precisión de recuperación de bits por debajo de 0.6, lo que indica una eliminación casi completa". **Pitch-shift 是通用攻击。**2026 años no hay ninguna marca de agua 能完全抵抗激进的音声修改──这就是为什么你需要检测(AASIST) y marcado de agua 并行──

### C2PA / Iniciativa de autenticidad de contenidos

No es una tecnología de aprendizaje, sino un formato manifiesto. Un archivo de audio con metadatos de firma de criptografía de los autores.


```figure
v4-audio-watermark
```

## Construirlo

### Paso 1: Un simple detector de características espectral (joga)

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

El habla sintética suele tener una alta frecuencia de energía anormalmente plana.

### 步骤 2: AudioSeal embed + detect

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

### 步骤 3: evaluación  EER

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

### Paso 4: Producción de la producción

```python
def safe_tts(text, voice, clone_reference=None):
    if clone_reference is not None:
        verify_consent(user_id, clone_reference)
    audio = tts_model.synthesize(text, voice)
    audio_with_wm = audioseal_embed(audio, payload=build_payload(user_id, model_id))
    manifest = c2pa_sign(audio_with_wm, user_id, timestamp=now())
    return audio_with_wm, manifest
```

Cada generación contiene: 1) marca de agua, 2) manifiesto firmado, 3) registro de auditoría de la política de retención.

## Usalo

| Use case | Defense |
|----------|---------|
| 上线 TTS / voice cloning | 每个输出都Embedding AudioSeal（不可协商） |
| Biometric voice unlock | AASIST + ECAPA ensemble；liveness challenge |
| Call-center fraud detection | 对 20% 的来电样本运行 AASIST |
| Podcast authenticity | 上传时进行 C2PA signing，若为 AI-generated 则使用 AudioSeal |
| Research / training detectors | ASVspoof 5 train/dev/eval sets |

## 陷

- **Watermark 从未被 detector 运行检测。**No tiene sentido. Ponga el detector en tu CI.
- **Detection 没有 calibration。**En ASVspoof LA 上训练的AASIST 会过;真实世界准确率下降──针对你的域做校准──
- **Pitch-shift gap.**激进的音声转变 会移除大多数水标――准备检测倒退――
- **Metadata strip-and-rehost.**C2PA  fácilmente mediante el reencodeo 始终把加密 + perceptual 水印防一起加入──
- **把 liveness 当成 detection。**要求用户说一个随机短语──它能阻止重播攻击,但不能阻止实时克隆──

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-spoof-defender.md` para la generación de voz 部署选择检测模型、watermark、provenance manifest 和操作玩book──

##  ejercicios

1. **Easy.**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`── en audio sintético 上使用 juguete detector + juguete marca de agua embed/detect──
2. **Medium.**Instalación`audioseal`, en TTS 输出中Embedding 16-bit carga útil,再重新解码──用噪音破坏音频并测量 Bit Recovery Accuracy──
3. **Hard.**En ASVspoof 2019 LA 上细调 一个RawNet2或AASIST──测量 EER──在一组的F5-TTS 生成片段上测试,观察OOD detección 如何退化──

## 关键术语: "El hombre es un hombre"

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

- [Todisco et al. (2024). ASVspoof 5](https://dl.acm.org/doi/10.1016/j.csl.2025.101825) 当前 referencia
- [Defossez et al. (2024). AudioSeal](https://arxiv.org/abs/2401.17264) 默认 marcas de agua。
- [Chen et al. (2025). WaveVerify](https://arxiv.org/abs/2507.21150) 面向时代攻击的MoE detector──
- [Jung et al. (2022). AASIST](https://arxiv.org/abs/2110.01200) Hostia de detección de SOTA。
- [AudioMarkBench (2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/5d9b7775296a641a1913ab6b4425d5e8-Paper-Datasets_and_Benchmarks_Track.pdf) evaluación de la robustez。
- [C2PA specification](https://c2pa.org/specifications/specifications/) Manifiesto de procedencia 格式──
