# 语音反欺骗与音频水印  ASVspoof 5, AudioSeal, WaveVerify

> A velocidade de produção de clonagem de voz ultrapassou rapidamente os meios de defesa. O sistema de produção de nível de voz de 2026 precisa de duas coisas: um que irá testar o verdadeiro idioma e o falso idioma, e um que pode ser comprimido e editado.

**Type:** Build
**Languages:** Python
**先修要求：**Fase 6 · 06 (Reconhecimento de alto-falantes), Fase 6 · 08 (Clonagem de voz)
**Time:** ~75 minutes

## 问题

Três tipos de defesa:

1. **Anti-spoofing / deepfake detection.**给定一段音频, é sintético ou real? ASVspoof benchmarks(ASVspoof 2019 → 2021 → 5) é o padrão ouro。
2. **Audio watermarking.**Em produção de som em em Embedding incompreensível sinal, depois de um testeiro pode-se extrair.
3. **Authenticated provenance.**Ào audio频文件和元数据 进行加密签名──C2PA / Content Authenticity Initiative──

Detecção 处理不配合的对抗者── watermarking 处理合规性,AI 生成的音频应被识别为这种音频──2026年两者都必需──

## 概念

![Anti-spoofing vs watermarking vs provenance — 三层防御](../assets/spoofing-watermark.svg)

### ASVspoof 5  Referência 2024-2025

相比以前版本,最大的变化:

- **Crowdsourced data**(não são dados de produção)
- **~2000 speakers**(até cerca de 100)
- **32 个 attack algorithms.**TTS + conversão de voz + perturbação adversária。
- **Two tracks.**Contro-medida (CM) 独立检测;面向生物识别系统的SPOofing-robust ASV (SASV) ⋅

ASVspoof 5 上 上的最新状态:~7.23% EER──比较旧 ASVspoof 2019 LA:0.42% EER──真实世界部署:预计野外片段上 EER 为 5-10%──

### AASIST 和 RawNet2  检测模型家族

**AASIST**(2021, continuou atualizado até 2026) ⋅ em características espectrais 上使用图-attention──当前是 ASVspoof 5 countermeasure 任务的SOTA──

**RawNet2.**Baseada na forma de onda bruta de frente convolucional + espinha dorsal TDNN;; mais simples de linha de base; após o ajuste fino ainda há concorrência.

**NeXt-TDNN + SSL features.**2025 变体:ECAPA-style + WavLM features + focal loss──在 ASVspoof 2019 LA 上达到0.42% EER──

### AudioSeal  2024 年默认 marca de água

Meta de **AudioSeal**(2024 年 1 月,v0.2 2024 年 12 月) ⋅

- **Localized.**以 16 kHz 采样分辨率 ((1/16000 s)
- **Generator + detector jointly trained.**Gerador de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio de câmbio
- **Robust.**能经受 MP3 / AAC 压缩、EQ、速度变化 ±10%、噪音混合 +10 dB SNR。
- **Fast.**Detector 以 485× em tempo real 运行;比WavMark 快 1000×──
- **Capacity.**16 bits de carga útil ((可编码 modelo ID、 geração de timestamp、 ID do usuário)

### WavMark

AudioSeal 之前的开放基线──Invertible neural network,32 bits/sec──问题:

- Sincronização bruta-força 很慢──
- Pode ser usado para a utilização de um dispositivo de controlo de dados.
- Não é o caso.

### WaveVerify(2025 年 7 月)

 resolver as fraquezas do AudioSeal, especialmente as manipulações temporais ((reversão, velocidade) ⋅ utilizando um gerador baseado em FiLM + detector de mistura de peritos ⋅ em estándares de ataque 竞争;能处理 temporal edits。

### Deficiência de utilização de oponentes

De AudioMarkBench:"em baixo da mudança de pitch, todas as marcas de água mostram Bit Recovery Accuracy abaixo de 0,6, indicando remoção quase completa". **Pitch-shift 是通用攻击。**2026 ano não há nenhuma marca de água que possa resistir completamente à modificação de pitch de atividade.

### C2PA / Iniciativa de Autenticidade de Conteúdo

Não é uma tecnologia de aprendizagem, mas um formato manifesto. O documento de rádio traz metadados sobre ferramentas de criação, autor e assinatura de dados.


```figure
v4-audio-watermark
```

## Construí-lo

### 步骤 1: Um simples detector de características espectral (jogo)

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

O discurso sintético geralmente tem alta frequência de energia anormalmente plana.

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

### 步骤 3: avaliação  EER

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

### 步骤 4: Produção

```python
def safe_tts(text, voice, clone_reference=None):
    if clone_reference is not None:
        verify_consent(user_id, clone_reference)
    audio = tts_model.synthesize(text, voice)
    audio_with_wm = audioseal_embed(audio, payload=build_payload(user_id, model_id))
    manifest = c2pa_sign(audio_with_wm, user_id, timestamp=now())
    return audio_with_wm, manifest
```

Cada geração inclui: 1) marca de água, 2) manifesto assinado, 3) registro de auditoria conforme a política de retenção.

## Use-o

| Use case | Defense |
|----------|---------|
| 上线 TTS / voice cloning | 每个输出都Embedding AudioSeal（不可协商） |
| Biometric voice unlock | AASIST + ECAPA ensemble；liveness challenge |
| Call-center fraud detection | 对 20% 的来电样本运行 AASIST |
| Podcast authenticity | 上传时进行 C2PA signing，若为 AI-generated 则使用 AudioSeal |
| Research / training detectors | ASVspoof 5 train/dev/eval sets |

## 陷

- **Watermark 从未被 detector 运行检测。**Não há sentido. Coloque o detector no seu CI.
- **Detection 没有 calibration。**Em ASVspoof LA 上训练的AASIST 会过;真实世界准确率下降──针对你的域做校准──
- **Pitch-shift gap.**激进的音速变化 会移除大多数水标――prepare para detecção de queda―
- **Metadata strip-and-rehost.**C2PA  fácilmente através de reencodeamento 始终把加密 + perceptual (水印) defense 加入──
- **把 liveness 当成 detection。**要求用户说一个随机短语──它可以阻止重播攻击,但不能阻止实时克隆──

## Entrega-o

保存为 `outputs/skill-spoof-defender.md` para a geração de voz 部署选择检测模型、watermark、 provenance manifest 和操作玩book──

## 练习

1. **Easy.**运行 `code/main.py`── em áudio sintético 上使用 brinquedo detector + brinquedo marca de água embutidos/detect──
2. **Medium.**Instalação`audioseal`, em TTS 输出中Embedding 16-bit payload,再重新解码──用噪音破坏音频并测量 Bit Recovery Accuracy──
3. **Hard.**Em ASVspoof 2019 LA 上细调 一个 RawNet2 或 AASIST──测量 EER──在一组长久的F5-TTS 生成片段上测试,观察 OOD detection 如何退化──

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

- [Todisco et al. (2024). ASVspoof 5](https://dl.acm.org/doi/10.1016/j.csl.2025.101825) 当前基准──
- [Defossez et al. (2024). AudioSeal](https://arxiv.org/abs/2401.17264) 默认 marca de água。
- [Chen et al. (2025). WaveVerify](https://arxiv.org/abs/2507.21150)Detector de MoE de ataques temporais.
- [Jung et al. (2022). AASIST](https://arxiv.org/abs/2110.01200) Espécie vertebral de detecção de SOTA。
- [AudioMarkBench (2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/5d9b7775296a641a1913ab6b4425d5e8-Paper-Datasets_and_Benchmarks_Track.pdf) Avaliação da robustez。
- [C2PA specification](https://c2pa.org/specifications/specifications/) Manifesto de proveniência 格式──
