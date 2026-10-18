# Capstone 03  实时语音 Asistente(ASR hasta LLM hasta TTS)

> Un agente de voz natural  necesita un tiempo de retraso inferior a 800 ms, sabe que usted puede parar de hablar, puede procesar barge-in, y puede utilizar herramientas sin interrupción. Retell, Vapi, LiveKit Agents y Pipecat en 2026 todos alcanzaron este estándar. Adoptan la misma forma: streaming ASR, detector de vueltas, streaming LLM y streaming TTS, todo a través de la conexión WebRTC, y en cada salto todos establecen un presupuesto de retraso intensivo.

**Type:** Capstone
**Languages:** Python（agent + pipeline）、TypeScript（web client）
**Prerequisites:** Phase 6（speech and audio）、Phase 7（transformers）、Phase 11（LLM engineering）、Phase 13（tools）、Phase 14（agents）、Phase 17（infrastructure）
**Phases exercised:**P6 · P7 · P11 · P13 · P14 · P17
**Time:** 30 小时

##  problemas

语音一直是2025-2026年发展最快的AI UX 类别──技术上限每季都在下降──OpenAI Realtime API、Gemini 2.5 Live、Cartesia Sonic-2、ElevenLabs Flash v3、LiveKit Agents 1.0 和 Pipecat 0.0.70 让低于800ms的首次音频出发 变得可实现──标准不只是延迟──它是交互感:不断断用户,不被用户断断,能从句中断中恢复,在对话中调用工具而不让音频停停,并能承受动态移动网络──

Usted no puede pasar por el paso de la combinación de tres REST 调用做到这一点── la arquitectura debe ser de extremo a extremo en el pipeline de transmisión── después de construirlo, el modelo de fracaso se vuelve visible: para el teléfono VAD de la audición de la transmisión de la televisión, el catapultado de la televisión, el detector de cambios de espera para que nunca aparezca un punto de señal, TTS en la salida de la caufración de 400ms── el objetivo de este Capstone es la reparación de estos problemas por encargo, y publicar un informe de retraso y calidad.

## 概念

El oleoducto tiene cinco fases de transmisión:**audio in**(desde el navegador o del WebRTC de PSTN)**ASR**(De Deepgram Nova-3 o transcripciones parciales de transmisión de susurros más rápidos)**turn detection**(VAD adición a leer transcripciones parciales a juzgar el modelo de detector de turnos de pequeño tamaño)**LLM**(Una vez que el juez vuelve a terminar, empieza a transmitir tokens)**TTS**(en el primer LLM Token 后约200ms内开始播放音频出)

Tres puntos de interés más**Barge-in**Cuando el usuario habla con el agente, TTS se lo elimina, ASR se lo toma inmediatamente.**Tool use**: dialog mittweg's function calls ((weather、calendar) must be on side channel 上运行, no puede hacer que el audio se detenga; si la demora supera los 300 ms, el agente 会预先填充一个确认令牌("un segundo...")。**Backpressure**En el caso de la pérdida de paquetes, las transcripciones parciales se conservarán, el VAD aumentará el valor de la puerta de discurso, el agente evitará continuar hablando en las noticias no confirmadas.

测量标准是定量性的──在 15 dB SNR de Hamming VAD de referencia arriba WER 低于8%──100 veces ya se ha medido el primer audio-out de la llamada p50 低于800ms──误截断率低于3%──TTS de MOS 高于4.2──单台 g5.xlarge 支持50 路并发通话──这些数字就是交付物品──

## 架构

```
browser / Twilio PSTN
        |
        v
   WebRTC / SIP edge
        |
        v
  LiveKit Agents 1.0  (or Pipecat 0.0.70)
        |
   +----+--------------+--------------+-----------------+
   |                   |              |                 |
   v                   v              v                 v
  ASR              VAD v5         turn-detector     side-channel
(Deepgram         (Silero)          (LiveKit)        tools
 Nova-3 /         speech-gate    completion score    (weather,
 Whisper-v3)      per 20ms        on partials        calendar)
   |                   |              |
   +--------+----------+--------------+
            v
        LLM (streaming)
     GPT-4o-realtime / Gemini 2.5 Flash /
     cascaded Claude Haiku 4.5
            |
            v
        TTS streaming
     Cartesia Sonic-2 / ElevenLabs Flash v3
            |
            v
     audio back to caller
            |
            v
   OpenTelemetry voice traces -> Langfuse
```

## 技术

- Transporte:LiveKit Agents 1.0(WebRTC)加 Twilio PSTN gateway;Pipecat 0.0.70  como marco de reserva
- ASR:Deepgram Nova-3(streaming, inferior a 300ms de primera parte) o auto-托管 de susurro más rápido Whisper-v3-turbo
- VAD:Silero VAD v5加 LiveKit detector de cambios(读取 parcial transcripciones de pequeño transformador)
- LLM: para utilizarse en estrecha concentración en OpenAI GPT-4o en tiempo real, Gemini 2.5 Flash Live, o grado de Claude Haiku 4.5
- TTS:Cartesia Sonic-2 ((minimo primer byte) ≈ElevenLabs Flash v3, o para uso libre de autocontrol Orpheus
- Herramientas: para el tiempo/calendario/reserva del canal lateral de FastMCP; si la herramienta 耗时>300ms,agent 预先发出填充器
- Observabilidad:OpenTelemetry extensiones de voz 带 reproducción de audio de las huellas de voz de Langfuse
- Despliegue:单台 g5.xlarge(24GB VRAM) para auto-control Whisper + Orpheus; API de control Utilizadas para el mínimo tardío


```figure
ce-voice-latency
```

## Construirlo

1. **WebRTC session。**Iniciar una sala de LiveKit y un cliente web de audio de micrófono en streaming. En el servidor, agregar un agente de la sala de trabajo.

2. **ASR streaming。**Se pueden obtener fotogramas de 20 ms de PCM 送入 Deepgram Nova-3((or GPU 上的快速语) ⋅订阅部分和最终转录──记录每部分的延迟──

3. **VAD and turn detector。**En el flujo de cuadros 上运行 Silero VAD v5。En el evento final del discurso 上, con la última transcripción parcial 触发 LiveKit turn-detector。 sólo cuando VAD expresa silencio 500ms 且 turn-detector completa 分数 > 0.6 时,才提交为"turn complete"。

4. **LLM stream。**En el turno completo, con la conversación en curso, la transcripción final, iniciar la llamada de LLM, tokens de flujo, primer token, entregado a TTS.

5. **TTS stream。**Cartesia Sonic-2 transmitirá los fragmentos de audio de vuelta. La primera pieza debe dejar el servidor después de 200 ms.

6. **Barge-in。**Cuando VAD durante la transmisión de TTS detecta nuevos usuarios de voz, inmediatamente elimina el flujo TTS, pierde la salida de LLM restante, y vuelve a iniciar ASR.`tts_canceled`Español

7. **Tool side channel。**Se puede utilizar para hacer llamadas de tiempo y calendario. Si 300 ms dentro de tiempo no regresan, el LLM puede enviar "un segundo, déjame comprobar" como un relleno.

8. **Eval harness。**录制 100 次通话──计算 WER(对照 held-out transcript) ‧误截断率(用户句子中途时 TTS被取消) ‧首发音频 p50、TTS MOS(human或NISQA),以及 jitter-loss test(丢弃 3% de paquetes) ‧

9. **Load test。**Utiliza un llamado sintético en un solo sistema g5.xlarge 上驱动 50 路并发通话――测量持续首发音频 p95──

## Usalo

```
caller: "what is the weather in tokyo tomorrow"
[asr  ] partial @280ms: "what is the"
[asr  ] partial @540ms: "what is the weather"
[turn ] completion score 0.82 at @820ms; commit
[llm  ] first token @960ms
[tool ] weather.tokyo tomorrow -> 68/52 partly cloudy @1140ms
[tts  ] first audio-out @1040ms: "Tokyo tomorrow will be partly cloudy..."
turn latency: 1040ms user-stop -> audio-out
```

##  entregarlo

`outputs/skill-voice-agent.md`Es un servicio de atención al cliente, programación o quiosco, que se inicia un agente de LiveKit, y se modifica a los niveles de ASR/VAD/LLM/TTS.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 端到端延迟 | 100 次已录制通话中的 p50 first-audio-out 低于 800ms |
| 20 | Turn-taking 质量 | Hamming VAD benchmark 上误截断率低于 3% |
| 20 | Tool-use 正确性 | 对话中途 tool calls 返回正确数据且不让音频停顿 |
| 20 | packet loss 下的可靠性 | 注入 3% packet drop 时的 WER 和 turn-taking 稳定性 |
| 15 | Eval harness 完整性 | 带 public config 的可复现实验测量 |
| **100** | | |

##  ejercicios

1. Para ello, el sistema de análisis de datos de la CPU es un sistema de análisis de datos de datos de la CPU.

2. 添加中断-仲裁 策略:当用户在工具调中 时,agent 怎么做?

3. 运行逆向转检测器测试:让用户在句子中途长时间停顿――调优 VAD silencio umbral 和转检测器分数 umbral,在不超过 900ms的前提下实现最小误截点――

4. Through Twilio will the same agent deployed to PSTN―Compare PSTN first-out audio con WebRTC―explicar jitter-buffer 和 codec 差异―

5. Por ejemplo, en el caso de los usuarios de Silero VAD, el número de falsificación de la voz es de 5%.

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Turn detection | "End of utterance" | 给定 VAD silence 和 partial transcript，判断用户已经说完的 classifier |
| Barge-in | "Interruption handling" | 当 VAD 检测到新的用户语音时，取消正在播放的 TTS |
| First-audio-out | "Latency" | 从用户停止说话到第一个 audio packet 离开 server 的时间 |
| VAD | "Speech gate" | 将 audio frames 分类为 speech 或 silence 的 model；Silero VAD v5 是 2026 年默认选择 |
| Jitter buffer | "Audio smoothing" | client-side buffer，会短暂保留 packets 以吸收网络波动 |
| Filler | "Acknowledgment token" | tool 较慢时 agent 发出的短语，用于避免沉默 |
| MOS | "Mean opinion score" | 感知语音质量评分；NISQA 是自动化代理指标 |

## 延伸阅读

- [LiveKit Agents 1.0](https://github.com/livekit/agents) 参考 marco de agentes de WebRTC
- [Pipecat](https://github.com/pipecat-ai/pipecat) 备用 Python-first streaming agent marco
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) 集成语音模型的参考
- [Deepgram Nova-3 documentation](https://developers.deepgram.com/docs) transmisión de ASR 参考
- [Silero VAD v5](https://github.com/snakers4/silero-vad) Modelo de referencia del VAD
- [Cartesia Sonic-2](https://docs.cartesia.ai) 低延迟 TTS 参考
- [Retell AI architecture](https://docs.retellai.com) Producción de los niveles de voz agente 架构
- [Vapi.ai production stack](https://docs.vapi.ai) 备用生产级参考
