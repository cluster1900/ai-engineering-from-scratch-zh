# 实时音频处理

> Los canales de batch  procesar un archivo―Los canales de tiempo real deben procesar en el siguiente 20 milímetros hasta que llegue el momento actual este 20 milímetros―cada conversación AI、estudio de transmisión y bot de telefonía están determinados por este presupuesto de latencia para ser un éxito―

**类型：**Construcción
**语言：**Python
**先修：**Fase 6 · 02(espectrogramas) Fase 6 · 04(ASR) Fase 6 · 07(TTS)
**时间：**75 minutos

##  problemas

Usted quiere un asistente de voz vivo de sensación. La latencia de toma de vueltas de conversaciones humanas es de ~ 230 ms.**hear → understand → respond → speak**El presupuesto del ciclo es:

| 阶段 | 预算 |
|-------|--------|
| Mic → buffer | 20 ms |
| VAD | 10 ms |
| ASR (streaming) | 150 ms |
| LLM (first token) | 100 ms |
| TTS (first chunk) | 100 ms |
| Render → speaker | 20 ms |
| **Total** | **~400 ms** |

Moshi (Kyutai, 2024)  alcanza 200 ms de doble completo──GPT-4o en tiempo real (2024) 约为 ~320 ms──2022 años de lanzamiento de tuberías en cascada es 2500 ms──这10× 改进来自三种技术:(1) 全链路流,(2) Utiliza resultados parciales de tuberías asincronas,(3) generación interrumpida──

## 概念

![包含 ring buffer、VAD gate 和 interruption 的 streaming audio pipeline](../assets/real-time.svg)

**Frame / chunk / window。**Audio en tiempo real 以固定大小的块流动──常见选择:20 ms(16 kHz 下 320 muestras)──下游一切都必须跟上这个节奏──

**Ring buffer。**固定大小的圆形缓冲──Producer thread 写入新框架,consumer thread 读取──避免在热路中分配内存──大小 ≈ máxima latencia × muestreo-rata; 2 segundos de 16 kHz anillo = 32.000 muestras──

**VAD (Voice Activity Detection)。**Cuando no hablo, cierres abajo.`webrtcvad`Es una alternativa más antigua.

**Streaming ASR。**Con el audio hasta llegar y sacar transcripciones parciales del modelo. Parakeet-CTC-0.6B en modo de transmisión (NeMo, 2024) 下, con 320 ms de latencia  alcanzar 25% WER──Whisper-Streaming (Macháček et al., 2023) Whisper 切成分,在 ~2 s de latencia 下实现近流──

**Interruption。**Cuando el asistente está en conversación cuando el usuario abre la puerta, usted debe (a) 检测 barge-in, (b) 停止 TTS, (c) 丢弃剩余的 LLM output── todo esto debe completarse en 100 ms, de lo contrario el usuario se sentirá hasta el asistente 听不见──

**WebRTC Opus transport。**20 ms de marcos, 48 kHz, velocidad de bits de adaptación 8128 kbps──es el navegador y el estándar de móviles──LiveKit、Daily.co、Pion es la tecnología para construir aplicaciones de voz ── en 2026

**Jitter buffer。**Los paquetes de red pueden estar desordenados o tardar en llegar. El buffer de rejillación se vuelve a redirigir y se vuelve a nivelar.

### 常见坑

- **Thread contention。**Python GIL + modelos pesados Puede hacer audio thread 饥饿── utilizar C-callback audio library(sounddevice、PortAudio),并让 Python 远离热路──
- **Sample-rate conversion latency。**En la tubería, la pesada de la muestra aumentará en 520 ms.`soxr_hq`)。
- **TTS priming。**Incluso como Kokoro, así como el TTS rápido, la primera solicitud también tiene un calentamiento de 100200 ms.
- **Echo cancellation。**没有 AEC, TTS salida 会重新进入 mic,并触发 ASR 识别bot 自己的声音──WebRTC AEC3 es el código abierto por defecto──

## 动手构建 动手构建

### 步骤 1: amortiguador de anillos

```python
import collections

class RingBuffer:
    def __init__(self, capacity):
        self.buf = collections.deque(maxlen=capacity)
    def write(self, frame):
        self.buf.extend(frame)
    def read(self, n):
        return [self.buf.popleft() for _ in range(min(n, len(self.buf)))]
    def level(self):
        return len(self.buf)
```

Capacidad decide la latencia de amortiguación máxima ∙16 kHz ∙ 32,000 muestras = 2 s ∙

### Paso 2: Puerta de VAD

```python
def simple_energy_vad(frame, threshold=0.01):
    return sum(x * x for x in frame) / len(frame) > threshold ** 2
```

Productos de producción en el ambiente:

```python
import torch
vad, _ = torch.hub.load("snakers4/silero-vad", "silero_vad")
is_speech = vad(torch.tensor(frame), 16000).item() > 0.5
```

### 步骤 3: transmisión de ASR

```python
# Parakeet-CTC-0.6B streaming via NeMo
from nemo.collections.asr.models import EncDecCTCModelBPE
asr = EncDecCTCModelBPE.from_pretrained("nvidia/parakeet-ctc-0.6b")
# chunk_ms=320 ms, look_ahead_ms=80 ms
for chunk in audio_stream():
    partial_text = asr.transcribe_streaming(chunk)
    print(partial_text, end="\r")
```

### 步骤 4: manipulador de interrupciones

```python
class Dialog:
    def __init__(self):
        self.tts_task = None

    def on_user_speech(self, frame):
        if self.tts_task and not self.tts_task.done():
            self.tts_task.cancel()   # barge-in
        # then feed to streaming ASR

    def on_final_user_utterance(self, text):
        self.tts_task = asyncio.create_task(self.reply(text))

    async def reply(self, text):
        async for tts_chunk in llm_then_tts(text):
            speaker.write(tts_chunk)
```

Esto depende de la sincronización de I/O y se puede eliminar de la transmisión de TTS.


```figure
nyquist-aliasing
```

## Usalo

2026 技术:

| 层 | 选择 |
|-------|------|
| Transport | LiveKit (WebRTC) or Pion (Go) |
| VAD | Silero VAD 4.0 |
| Streaming ASR | Parakeet-CTC-0.6B or Whisper-Streaming |
| LLM first-token | Groq, Cerebras, vLLM-streaming |
| Streaming TTS | Kokoro or ElevenLabs Turbo v2.5 |
| Echo cancel | WebRTC AEC3 |
| End-to-end native | OpenAI Realtime API or Moshi |

## 常见陷

- **Buffering 500 ms to be safe。**Buffer es el piso de latencia de tu sistema.
- **Not pinning threads。**El audio de devolución en la prioridad inferior a la de la interfaz de usuario de los hilos 上 = 负载出现故障──
- **TTS chunks too small。**Pequeños de 200 ms de piezas que permiten que los artefactos de vocoder se escuchen. 320 ms de piezas son un lugar dulce.
- **No jitter buffer。**En la verdadera red hay nerviosismo; no hay nada que se haga.
- **Single-shot error handling。**Los conductos de audio deben ser a prueba de choque. Una excepción es la sesión de matanza.

##  entregarlo

保存为                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `outputs/skill-realtime-designer.md` diseñar un canal de audio en tiempo real, y para cada etapa                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

##  ejercicios

1. **Easy。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py`◊ se parece a un buffer de anillo + energía VAD; ∞ para una falsa corriente de 10 segundos ∞ para imprimir latencias de etapa
2. **Medium。**Uso `sounddevice`, construye un paso a través de un bucle, con 20 ms de marcos  procesar su micrófono, y en cada marco  imprimir estado VAD 
3. **Hard。**Uso `aiortc`Construir una prueba de eco duplex completa:browser → WebRTC → Python → WebRTC → navegador。 con pulso de 1 kHz medir la latencia de vidrio a vidrio。

## 关键术语: "El hombre es un hombre"

| 术语 | 人们常说 | 实际含义 |
|------|-----------------|-----------------------|
| Ring buffer | circular queue | 用于 audio frames 的固定大小、lock-free（或 SPSC-locked）FIFO。 |
| VAD | Silence gate | 标记 speech 与 non-speech 的 model 或 heuristic。 |
| Streaming ASR | Real-time STT | 随着 audio 到达输出 partial text；bounded lookahead。 |
| Jitter buffer | Network smoother | 对乱序 packets 进行 queue reordering；典型值 60–80 ms。 |
| AEC | Echo cancellation | 减去 speaker-to-mic feedback path。 |
| Barge-in | User interrupt | 系统在 TTS 中途检测到用户说话；必须取消 playback。 |
| Full duplex | Simultaneous both ways | 用户和 bot 可以同时说话；Moshi 是 full duplex。 |

## 延伸阅读

- [Macháček et al. (2023). Whisper-Streaming](https://arxiv.org/abs/2307.14743) pedazos de casi fluido de susurros。
- [Kyutai (2024). Moshi](https://kyutai.org/Moshi.pdf) latencia de 200 ms de duplex completo
- [LiveKit Agents framework (2024)](https://docs.livekit.io/agents/) Orquestación de agentes de audio de producción。
- [Silero VAD repo](https://github.com/snakers4/silero-vad) sub-1 ms VAD, Apache 2.0
- [WebRTC AEC3 paper](https://webrtc.googlesource.com/src/+/main/modules/audio_processing/aec3/) código abierto 下的 eco cancelación。
