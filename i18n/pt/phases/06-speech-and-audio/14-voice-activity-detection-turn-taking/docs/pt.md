# Detecção de atividade vocal e tomada de viradas Silero, Cobra e Flush Trick

> Cada agente de voz é bem sucedido dependendo de dois julgamentos: o usuário está agora em conversa, bem como eles estão falando concluído?

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 11（Real-Time Audio），Phase 6 · 12（Voice Assistant）
**Time:** ~45 分钟

## 问题

Agente de voz em cada 20 ms de peças acima fez três diferentes julgamentos:

1. **这一帧是 speech 吗？** VAD──二元判断,逐进行──
2. **用户是否开始了新的 utterance？** Detecção de início de tratamento
3. **用户是否说完了？** apontamento final  virada final 

朴素答案 (Energy Threshold) 在任何噪音下都会失败:交通声,键盘声,人群杂声, 2026 年的答案是:Silero VAD (VAD) 开放,Deep Learning 训练) + modelo de detecção de turno (VAD) 语义终点指导) + 基于 VAD 校准的沉默乱──

## 概念

![VAD 级联：energy → Silero → turn-detector → flush trick](../assets/vad-turn-taking.svg)

### 3o nível VAD

**Tier 1: energy gate。**O RMS pode ter um som silencioso, mas qualquer som superior ao valor é provocado.

**Tier 2: Silero VAD**(2020-2026, MIT) ・ 1M parâmetros― em 6000+ idiomas 上 тренинг― em um único fio de CPU  上, cada 30 ms parte 运行完成―5% FPR 下 TPR 为 87.7%―

**Tier 3: semantic turn detector。**Modelo de detecção de turnos do LiveKit ((2024-2026) ou seu próprio pequeno classificador。区分句中停顿和说完了──使用语言上下文(intonation + palavras recentes),而不只是沉默──

### 关键参数 e seu valor de configuração

- **Threshold。**Silero 输出 probabilidade;在 &gt; 0.5(默认) ou &gt; 0.3(sensível)时分类为语句──值越低,首词被截断越少,但错误积极越多──
- **Minimum speech duration。**Rejeitar um discurso de 250 ms, normalmente é tosse ou ruído de cadeira.
- **Silence hangover（end-pointing）。**VAD Volta até 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
- **Pre-roll buffer。**Em VAD 触发前保留 300-500 ms de áudio―防止hey被截断―

### Trilha de flush ((Kyutai 2025)

Os modelos STT em streaming têm um atraso de olho para a frente (((Kyutai STT-1B é de 500 ms, STT-2.6B é de 2,5 s)  Normalmente você vai estar no final da fala  esperar por muito tempo para obter a transcrição。**向 STT 发送 flush signal**, Forçativo de saída imediata;. STT é de cerca de 4× em tempo real  processamento, para que 500 ms buffer  cerca de 125 ms                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           

端到端:125 ms VAD + flush STT = 对话式延迟──

### 2026 VAD em relação ao

| VAD | TPR @ 5% FPR | Latency | License |
|-----|--------------|---------|---------|
| WebRTC VAD（Google，2013） | 50.0% | 30 ms | BSD |
| Silero VAD（2020-2026） | 87.7% | ~1 ms | MIT |
| Cobra VAD（Picovoice） | 98.9% | ~1 ms | commercial |
| pyannote segmentation | 95% | ~10 ms | MIT-ish |

Silero é a escolha preferida correta. Cobra é a elevação da taxa de conformidade.


```figure
sp-vad-cascade
```

## Construí-lo

### 步骤 1: porta de energia

```python
def energy_vad(chunk, threshold_dbfs=-40.0):
    rms = (sum(x * x for x in chunk) / len(chunk)) ** 0.5
    dbfs = 20.0 * math.log10(max(rms, 1e-10))
    return dbfs > threshold_dbfs
```

### 步骤 2: Python 中的 Silero VAD

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

### 步骤 3: máquina de estado de turn-end

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

### 步骤 4: truque de flush 骨架

```python
def flush_on_end(stt_client, audio_buffer):
    stt_client.send_audio(audio_buffer)
    stt_client.send_flush()
    return stt_client.recv_transcript(timeout_ms=150)
```

STT(Kyutai、Deepgram、AssemblyAI) deve apoiar flush, este método é válido, o streaming de sussurros não é suportado, porque é baseado em blocos, e está sempre esperando pedaços.

## Use-o

| Situation | VAD choice |
|-----------|-----------|
| 开放、快速、通用 | Silero VAD |
| 商业 call center | Cobra VAD |
| On-device（phone） | Silero VAD ONNX |
| Research / diarization | pyannote segmentation |
| 零依赖 fallback | WebRTC VAD（legacy） |
| 需要 turn-ending 质量 | Silero + LiveKit turn-detector 分层 |

經驗法则: Se não tiveres realmente nenhuma escolha, nunca publicas VADs exclusivamente energéticos.

## 陷

- **Fixed threshold。**Em ambiente tranquilo, disponível, em ambiente complicado, falha.
- **Silence hangover 太短。**Agente 会在句中打断用户──500-800 ms é a melhor área de diálogo.
- **Hangover 太长。**感觉迟──用目标用户做 A/B test──
- **没有 pre-roll buffer。**Usuário áudio de 200-300 ms 会失失──始终保留滚滚 pre-roll──
- **忽略 semantic endpointing。**Hmm, deixe-me pensar... 包含长停顿──用户讨厌思路中途被打断──使用LiveKit's turn-detector或类似方案──

##  Publicá-lo

保存为 `outputs/skill-vad-tuner.md` Para uma carga de trabalho selecionar modelo VAD ▌ limiar ▌hangover ▌pre-roll e estratégia de detecção de rotação 

## 练习

1. **Easy。**运行 `code/main.py`∼ It模拟 речи + silêncio + fala + tosse 序列,并测试三层 VAD──
2. **Medium。**Instalação`silero-vad`, processar um parágrafo 5 分钟录音,调优门, simultaneamente minimizar o primeiro termo cut cut cut cut and error touch.
3. **Hard。**Construir um mini-detector de viradas: Silero VAD +  baseado em 10 palavras de embutidos de 3 níveis MLP(usando transformadores de frases)。

## 关键术语

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
- [Kyutai — Unmute + flush trick](https://kyutai.org/stt) 低于200 ms 的工程技巧──
- [LiveKit — turn detection](https://docs.livekit.io/agents/logic/turns/) Endpointing semântico em 生产环境──
- [WebRTC VAD](https://webrtc.googlesource.com/src/) linha de base herdada。
- [pyannote segmentation](https://github.com/pyannote/pyannote-audio) diária 级 segmentação。
