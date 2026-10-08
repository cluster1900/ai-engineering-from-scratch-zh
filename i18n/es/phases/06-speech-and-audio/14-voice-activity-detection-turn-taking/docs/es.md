# Detección de actividad de voz y toma de vueltas  Silero、Cobra y el truco de la roca

> El éxito de cada agente de voz depende de dos juicios: ¿Usuario ahora está hablando, y si ellos están hablando?

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 11（Real-Time Audio），Phase 6 · 12（Voice Assistant）
**Time:** ~45 分钟

##  problemas

El agente de voz en cada 20 ms pieza arriba hace tres diferentes juicios:

1. **这一帧是 speech 吗？** VAD──二元判断,逐进行──
2. **用户是否开始了新的 utterance？** detección de inicio。
3. **用户是否说完了？** apuntar al final  dar vuelta al final

朴素答案 (energía) 在任何噪音下都会失败:交通声,键盘声,人群杂声, 2026 年的答案是:Silero VAD (VAD) 开放,Deep Learning 训练) + modelo de detección de vueltas, 语义终点) 基于 VAD 校准的沉默霍霍──

## 概念

![VAD 级联：energy → Silero → turn-detector → flush trick](../assets/vad-turn-taking.svg)

### Tres niveles de VAD

**Tier 1: energy gate。**La máxima eficiencia es de -40 dBFS para el RMS, pero cualquier ruido superior a la norma se producirá.

**Tier 2: Silero VAD**(2020-2026, MIT) ⋅ 1M parámetros― en 6000+ idiomas 上訓練― en un solo hilo de CPU ⋅ en cada 30 ms de pieza ⋅ aproximadamente 1 ms 运行完成―5% FPR 下 TPR 为 87.7%―

**Tier 3: semantic turn detector。**Modelo de detección de turnos de LiveKit (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en inglés) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en) (en)

### 关键参数 y su valor de usuario

- **Threshold。**Silero 输出 probabilidad;在 &gt; 0.5(默认) o &gt; 0.3(sensible)时分类为语句──值越低,首词被截断越少,但错正面越多──
- **Minimum speech duration。**Refusión de 250 ms de discurso, normalmente es un ruido de tos o silla 
- **Silence hangover（end-pointing）。**VAD volver hasta 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
- **Pre-roll buffer。**En VAD 触发前保留 300-500 ms de audio― prevenir hey被截断―

### Triko de la lluvia (Kyutai 2025)

Los modelos STT en streaming tienen retraso de visión de futuro (((Kyutai STT-1B para 500 ms, STT-2.6B para 2.5 s)  Usualmente usted estará en el final de la discusión  esperar entonces para obtener la transcripción──Flush truco: cuando VAD 触发 final de la discusión **向 STT 发送 flush signal**, obligatoriamente de salida inmediata;. STT a aproximadamente 4x tiempo real  procesamiento, así que 500 ms de buffer  aproximadamente 125 ms de tiempo en el proceso de procesamiento.

端到端:125 ms VAD + flush STT = 对话式延迟──

### 2026 VAD en relación con

| VAD | TPR @ 5% FPR | Latency | License |
|-----|--------------|---------|---------|
| WebRTC VAD（Google，2013） | 50.0% | 30 ms | BSD |
| Silero VAD（2020-2026） | 87.7% | ~1 ms | MIT |
| Cobra VAD（Picovoice） | 98.9% | ~1 ms | commercial |
| pyannote segmentation | 95% | ~10 ms | MIT-ish |

Silero es la correcta opción de elección. Cobra es la normalidad / tasa de elevación.


```figure
sp-vad-cascade
```

## Construirlo

### Paso 1: Puerta de energía

```python
def energy_vad(chunk, threshold_dbfs=-40.0):
    rms = (sum(x * x for x in chunk) / len(chunk)) ** 0.5
    dbfs = 20.0 * math.log10(max(rms, 1e-10))
    return dbfs > threshold_dbfs
```

### Paso 2: Silero VAD en Python

```python
from silero_vad import load_silero_vad, get_speech_timestamps

vad = load_silero_vad()
audio = torch.tensor(waveform_16k, dtype=torch.float32)
segments = get_speech_timestamps(
    audio, vad, sampling_rate=16000,
    threshold=0.5,
    min_speech_duration_ms=250,
    min_silence_duration_ms=500,
    speech_pad_ms=300,
)
for s in segments:
    print(f"{s['start']/16000:.2f}s - {s['end']/16000:.2f}s")
```

### 步骤 3: máquina de estado de la vuelta

```python
class TurnDetector:
    def __init__(self, silence_hangover_ms=500, min_speech_ms=250):
        self.state = "idle"
        self.speech_ms = 0
        self.silence_ms = 0
        self.silence_hangover_ms = silence_hangover_ms
        self.min_speech_ms = min_speech_ms

    def update(self, is_speech, chunk_ms=20):
        if is_speech:
            self.speech_ms += chunk_ms
            self.silence_ms = 0
            if self.state == "idle" and self.speech_ms >= self.min_speech_ms:
                self.state = "speaking"
                return "START"
        else:
            self.silence_ms += chunk_ms
            if self.state == "speaking" and self.silence_ms >= self.silence_hangover_ms:
                self.state = "idle"
                self.speech_ms = 0
                return "END"
        return None
```

### Paso 4: Trío de la rocío

```python
def flush_on_end(stt_client, audio_buffer):
    stt_client.send_audio(audio_buffer)
    stt_client.send_flush()
    return stt_client.recv_transcript(timeout_ms=150)
```

STT(Kyutai、Deepgram、AssemblyAI) debe apoyar el flush, este método es válido, el flujo de susurros no es compatible, ya que se basa en bloque, y siempre está esperando por trozos.

## Usalo

| Situation | VAD choice |
|-----------|-----------|
| 开放、快速、通用 | Silero VAD |
| 商业 call center | Cobra VAD |
| On-device（phone） | Silero VAD ONNX |
| Research / diarization | pyannote segmentation |
| 零依赖 fallback | WebRTC VAD（legacy） |
| 需要 turn-ending 质量 | Silero + LiveKit turn-detector 分层 |

經驗法则: a menos que realmente no tengas ninguna opción, no publiques nunca VAD sólo energético.

## 陷

- **Fixed threshold。**En el ambiente tranquilo, en el ambiente complicado, en el ambiente de la falta de éxito.
- **Silence hangover 太短。**El agente 会在句中打断用户──500-800 ms es la mejor zona de diálogo.
- **Hangover 太长。**感觉迟──用目标用户做 A/B test──
- **没有 pre-roll buffer。**Usuario audio de los primeros 200-300 ms 会失失──始终保留滚滚 pre-roll──
- **忽略 semantic endpointing。**Hmm, déjame pensar... 包含长停顿──用户讨厌思路中途被打断── usar un detector de vueltas de LiveKit o algo similar──

##  Publicarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-vad-tuner.md` para una carga de trabajo  seleccionar un modelo VAD  umbral  transferencia  pre-roll y estrategia de detección de la vuelta 

##  ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`∼ It模拟 habla + silencio + habla + tos 序列,并测试三层 VAD──
2. **Medium。**Instalación`silero-vad`,处理一段 5 分钟录音,调优门,同时最小化首词截断和误触发――报告精度/回忆──
3. **Hard。**Construir un mini detector de giras: Silero VAD +  basado en las últimas 10 palabras                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

## 关键术语: "El hombre es un hombre"

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|-----------------------|
| VAD | Voice detector | 逐帧二元判断：这是 speech 吗？ |
| Turn detection | End-pointing | VAD + silence-hangover + semantic endpoint。 |
| Silence hangover | Wait-after-speech | 宣布 turn end 前等待的时间；500-800 ms。 |
| Pre-roll | Pre-speech buffer | 在 VAD 触发前保留 300-500 ms audio。 |
| Flush trick | Kyutai hack | VAD → flush-STT → 125 ms，而不是 500 ms delay。 |
| Semantic endpoint | “他们是真的想停下吗？” | 查看 words 的 ML classifier，而不只是看 silence。 |
| TPR @ FPR 5% | ROC point | 标准 VAD benchmark；Silero 为 87.7%，WebRTC 为 50%。 |

## 延伸阅读

- [Silero VAD](https://github.com/snakers4/silero-vad) 开放 VAD                                                                                                                                                                                                                                                            
- [Picovoice Cobra VAD](https://picovoice.ai/products/cobra/) 商业准确率领导者──
- [Kyutai — Unmute + flush trick](https://kyutai.org/stt) 低于200 ms的工程技巧──
- [LiveKit — turn detection](https://docs.livekit.io/agents/logic/turns/) Endpointing semántico en el medio ambiente de producción。
- [WebRTC VAD](https://webrtc.googlesource.com/src/) base de legado。
- [pyannote segmentation](https://github.com/pyannote/pyannote-audio) Diarización 级 segmentación。
