# 实时音频处理

> Batch pipelines  processar um documento。Pipelines em tempo real devem ser processados no próximo 20 milissegundos até chegar antes de processar o presente 20 milissegundos。 Cada conversação AI、estúdio de transmissão e bot de telefonia são determinados por esse orçamento de latência ‖

**类型：**Construção
**语言：**Python
**先修：**Fase 6 · 02(Spectogramas) Fase 6 · 04(ASR) Fase 6 · 07(TTS)
**时间：**Cerca de 75 minutos

## 问题

Você quer um assistente vocal vivo de sentimento. A latência de conversas humanas em turnos de conversas é de ~ 230 ms.**hear → understand → respond → speak**O orçamento do ciclo é:

| 阶段 | 预算 |
|-------|--------|
| Mic → buffer | 20 ms |
| VAD | 10 ms |
| ASR (streaming) | 150 ms |
| LLM (first token) | 100 ms |
| TTS (first chunk) | 100 ms |
| Render → speaker | 20 ms |
| **Total** | **~400 ms** |

Moshi (Kyutai, 2024)  alcançar 200 ms de duplex completo──GPT-4o em tempo real (2024) 约为 ~320 ms──2022年发布的 Cascaded pipelines 是 2500 ms──这10× 改进来自三种技术:(1) 全链路流,(2) Utilize partial results of asynchronous pipelining,(3) interruptible generation──

## 概念

![包含 ring buffer、VAD gate 和 interruption 的 streaming audio pipeline](../assets/real-time.svg)

**Frame / chunk / window。**Áudio em tempo real 以固定大小的块流动──常见选择:20 ms(16 kHz 下 320 amostras)──下游一切都必须跟上这个节奏──

**Ring buffer。**固定大小的圆形缓冲──Producer thread 写入新框架,consumer thread 读取──避免在热路中分配内存──大小 ≈ máxima latência × taxa de amostra;2 segundos de 16 kHz ring = 32.000 amostras──

**VAD (Voice Activity Detection)。**Quando não há ninguém falando, fecha o seu trabalho. Silero VAD 4.0 (2024) em cada frame de 30 ms da CPU.`webrtcvad`É uma alternativa mais antiga.

**Streaming ASR。**随着音频到达和输出部分转录的模型──Parakeet-CTC-0.6B 在流媒体模式 (NeMo, 2024) 下,以 320 ms latency 达到25% WER──Whisper-Streaming (Macháček et al., 2023) 将 Whisper 切成块,在 ~2 s latency 下实现近流媒体──

**Interruption。**Quando o assistente está em conversação quando o usuário abre a porta, você deve (a) fazer o teste de barga, (b) parar o TTS, (c) abandonar o restante de sua saída de LLM. Tudo isso deve ser feito em 100 ms, caso contrário o usuário vai perceber que o assistente está em contato.

**WebRTC Opus transport。**20 ms frames, 48 kHz, auto-adaptação bitrate 8128 kbps── é o navegador 和 mobile's standard──LiveKit、Daily.co、Pion é a tecnologia de 2026 para construir aplicativos de voz──

**Jitter buffer。**Pacotes de rede podem ser perturbados ou atrasados em chegar.

### 常见坑

- **Thread contention。**Python GIL + modelos pesados podem fazer o fio de áudio 饥饿── usar a biblioteca de áudio de chamadas C-callback(dispositivo de áudio、PortAudio),并让 Python 远离热路──
- **Sample-rate conversion latency。**Em um pipeline, a pesquisa aumentará 520 ms.`soxr_hq`)。
- **TTS priming。**Mesmo assim como Kokoro, TTS rápido, primeira solicitação tem também 100200 ms aquecimento-up──缓存 modelo, e na primeira vez real virar 前用 dummy run 预热──
- **Echo cancellation。**没有AEC,TTS output 会重新进入micro,并触发 ASR 识别bot 自己的声音──WebRTC AEC3 é o código aberto por defeito──

## 动手构建

### 步骤 1: tampão de anel

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

Capacidade determina a maior latência de amortecimento: 16 kHz, 32 000 amostras = 2 segundos.

### 步骤 2: Portão VAD

```python
def simple_energy_vad(frame, threshold=0.01):
    return sum(x * x for x in frame) / len(frame) > threshold ** 2
```

生产环境中替换为 Silero VAD:

```python
import torch
vad, _ = torch.hub.load("snakers4/silero-vad", "silero_vad")
is_speech = vad(torch.tensor(frame), 16000).item() > 0.5
```

### 步骤 3:streaming ASR

```python
# Parakeet-CTC-0.6B streaming via NeMo
from nemo.collections.asr.models import EncDecCTCModelBPE
asr = EncDecCTCModelBPE.from_pretrained("nvidia/parakeet-ctc-0.6b")
# chunk_ms=320 ms, look_ahead_ms=80 ms
for chunk in audio_stream():
    partial_text = asr.transcribe_streaming(chunk)
    print(partial_text, end="\r")
```

### 步骤 4: manipulador de interrupção

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

Esta dependência de I/O sincronizado e eliminação do streaming TTS.


```figure
nyquist-aliasing
```

## Use-o

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

- **Buffering 500 ms to be safe。**Buffer é o seu piso de latência.
- **Not pinning threads。**Recuperação de áudio em prioridade inferior ao fio da interface 上 = 载下出现故障──
- **TTS chunks too small。**Peças de 200 ms vão fazer artefatos de vocoder.
- **No jitter buffer。**A rede real tem nervosismo, não há nada que pareça.
- **Single-shot error handling。**Os canais de áudio têm de ser resistentes a acidentes.

## Entrega-o

保存为 `outputs/skill-realtime-designer.md` conceber um canal de áudio em tempo real, e fornecer orçamentos específicos de latência para cada fase.

## 练习

1. **Easy。**运行 `code/main.py`◊ É como um buffer de anel + energia VAD;
2. **Medium。**Utilização `sounddevice`, construir um passagem através de um loop, em 20 ms quadros  processar o seu microfone, e em cada quadro  imprimir estado VAD 
3. **Hard。**Utilização `aiortc`Construir um teste de eco duplex completo: browser → WebRTC → Python → WebRTC → browser。 usando pulso de 1 kHz medir latência de vidro a vidro。

## 关键术语

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

- [Macháček et al. (2023). Whisper-Streaming](https://arxiv.org/abs/2307.14743) Chunked quase fluindo sussurro。
- [Kyutai (2024). Moshi](https://kyutai.org/Moshi.pdf) Latência de 200 ms de duplex completo
- [LiveKit Agents framework (2024)](https://docs.livekit.io/agents/) Orquestração de agentes de produção de áudio。
- [Silero VAD repo](https://github.com/snakers4/silero-vad)Sub-1 ms VAD, Apache 2.0
- [WebRTC AEC3 paper](https://webrtc.googlesource.com/src/+/main/modules/audio_processing/aec3/) código aberto 下的回音取消──
