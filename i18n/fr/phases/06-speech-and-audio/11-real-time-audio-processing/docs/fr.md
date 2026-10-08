# 实时音频处理

> Les pipelines de lot  traitement d'un dossier。 Les pipelines en temps réel doivent être traitées dans le prochain 20 毫秒到来之前处理当前这20 毫秒── chaque conversation AI、broadcast studio和电话机器人都由这个延迟预算决定成败──

**类型：**Construction
**语言：**Python
**先修：**La phase 6 · 02(Spectrogrammes) La phase 6 · 04(ASR) La phase 6 · 07(TTS)
**时间：**À environ 75 minutes.

##  problématique

Vous voulez un assistant vocal vivant à l'esprit. La latence de prise de parole humaine est d'environ 230 ms.**hear → understand → respond → speak**Le budget du cycle est:

| 阶段 | 预算 |
|-------|--------|
| Mic → buffer | 20 ms |
| VAD | 10 ms |
| ASR (streaming) | 150 ms |
| LLM (first token) | 100 ms |
| TTS (first chunk) | 100 ms |
| Render → speaker | 20 ms |
| **Total** | **~400 ms** |

Moshi (Kyutai, 2024)  atteint 200 ms en double intégral──GPT-4o en temps réel (2024) 约为 ~320 ms──2022年发布的 Cascade pipelines 是 2500 ms──这10× 改进来自三种技术:(1) 全链路流,(2) Utilisez des résultats partiels de pipelining asynchrone,(3) génération interrompue──

## 概念

![包含 ring buffer、VAD gate 和 interruption 的 streaming audio pipeline](../assets/real-time.svg)

**Frame / chunk / window。**L'audio en temps réel est basé sur un volume fixe.

**Ring buffer。**固定大小的圆形缓冲──Producer thread 写入新框架,consumer thread 读取──避免在热路中分配内存──大小 ≈ maximum-latency × sample-rate;2 secondes de 16 kHz ring = 32.000 échantillons──

**VAD (Voice Activity Detection)。**Quand personne ne parle, fermer le travail. Silero VAD 4.0 (2024) sur le CPU à 30 ms`webrtcvad`C'est une alternative plus ancienne.

**Streaming ASR。**Avec l'audio jusqu'à la sortie des transcriptions partielles du modèle. Parakeet-CTC-0.6B en mode de streaming (NeMo, 2024)

**Interruption。**Lorsque l'assistant est en train de parler lorsque l'utilisateur ouvre sa porte, vous devez (a) tester le barge-in, (b) arrêter le TTS, (c) abandonner le résidu de la production de LLM. Tout cela doit être terminé en 100 ms, sinon l'utilisateur se rendra compte que l'assistant ne le voit pas.

**WebRTC Opus transport。**20 ms de cadres, 48 kHz, débit de bits adapté 8128 kbps── c'est le navigateur et les normes mobiles── LiveKit、Daily.co、Pion est la technologie de 2026 pour la construction d'applications vocales──

**Jitter buffer。**Les paquets réseau peuvent être perturbés ou retardés à l'arrivée. Le tampon de jetage sera redéfini et étalé.

### 常见坑

- **Thread contention。**Les modèles lourds de Python peuvent faire des fils audio 饥饿── utiliser la bibliothèque audio C-callback(sounddevice、PortAudio),并让 Python 远离热路──
- **Sample-rate conversion latency。**Dans le pipeline, le poids d'échantillonnage augmentera de 5 à 20 ms.`soxr_hq`)。
- **TTS priming。**Même si c'est le cas de Kokoro, la première demande a aussi un modèle de réchauffement de 100200 ms, et la première vraie tournée avant avec un tour de poupée 预热──
- **Echo cancellation。**没有AEC,TTS output 会重新进入micro,并触发ASR 识别bot 自己的声音──WebRTC AEC3 est le code source par défaut──

## 动手构建

### 步骤 1: tampon à anneaux

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

La capacité décide de la latence tampon maximale: 16 kHz, 32 000 échantillons = 2 secondes.

### 步骤 2: Porte de détection

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

### 步骤 3: diffusion de l'ASR

```python
# Parakeet-CTC-0.6B streaming via NeMo
from nemo.collections.asr.models import EncDecCTCModelBPE
asr = EncDecCTCModelBPE.from_pretrained("nvidia/parakeet-ctc-0.6b")
# chunk_ms=320 ms, look_ahead_ms=80 ms
for chunk in audio_stream():
    partial_text = asr.transcribe_streaming(chunk)
    print(partial_text, end="\r")
```

### 步骤 4: gestionnaire d'interruption

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

Ceci dépend de l'interconnexion TTS en continu et de la diffusion TTS en continu.


```figure
nyquist-aliasing
```

## Utilisez-le

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

- **Buffering 500 ms to be safe。**Buffer est votre plancher de latence.
- **Not pinning threads。**Retour d' appel audio dans la priorité inférieure au fil de l'interface utilisateur 上 = 负载出现故障──
- **TTS chunks too small。**Les pièces de 200 ms vont faire des objets de vocoder.
- **No jitter buffer。**Il y a des crises dans le réseau, il n'y a pas de glissades.
- **Single-shot error handling。**Les conduites audio doivent être à l'épreuve des chocs.

## Je le livre.

保存为 `outputs/skill-realtime-designer.md` concevoir un pipeline audio en temps réel, et fournir des budgets de latence spécifiques pour chaque étape.

## 练习

1. **Easy。**运行  référencement`code/main.py`Il est similaire à un tampon d'anneau + VAD d'énergie;
2. **Medium。**Utilisation `sounddevice`, construire un passage à travers la boucle, avec 20 ms cadres  traiter votre microphone, et dans chaque cadre  imprimer l'état VAD 
3. **Hard。**Utilisation `aiortc`Construire un test d'écho duplex complet: navigateur → WebRTC → Python → WebRTC → navigateur。 avec un puls de 1 kHz mesurer la latence verre à verre。

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

- [Macháček et al. (2023). Whisper-Streaming](https://arxiv.org/abs/2307.14743) coupé presque en streaming Whisper。
- [Kyutai (2024). Moshi](https://kyutai.org/Moshi.pdf) La latence du duplex complet de 200 ms
- [LiveKit Agents framework (2024)](https://docs.livekit.io/agents/) orchestration d'agents audio de production
- [Silero VAD repo](https://github.com/snakers4/silero-vad) sous-1 ms VAD, Apache 2.0
- [WebRTC AEC3 paper](https://webrtc.googlesource.com/src/+/main/modules/audio_processing/aec3/) source ouverte 下的回音取消──
