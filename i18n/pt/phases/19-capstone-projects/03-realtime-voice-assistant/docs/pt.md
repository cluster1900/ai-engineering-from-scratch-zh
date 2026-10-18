# Capstone 03  实时语音 Assistente(ASR até LLM até TTS)

> Um agente de voz natural  precisa de um atraso de 800ms, sabe quando parar de falar, pode processar barge-in, e pode ligar as ferramentas sem interrupção. Retel, Vapi, LiveKit Agents e Pipecat em 2026 todos alcançaram este padrão. Adotam o mesmo formato: streaming ASR, turn-detector, streaming LLM e streaming TTS, todos através da conexão WebRTC, e em cada salto todos definem um orçamento de atraso acelerado.

**Type:** Capstone
**Languages:** Python（agent + pipeline）、TypeScript（web client）
**Prerequisites:** Phase 6（speech and audio）、Phase 7（transformers）、Phase 11（LLM engineering）、Phase 13（tools）、Phase 14（agents）、Phase 17（infrastructure）
**Phases exercised:**P6 · P7 · P11 · P13 · P14 · P17
**Time:** 30 小时

## 问题

语音一直是 2025-2026年发展最快 AI UX 类别──技术上限每季都下降──OpenAI Realtime API、Gemini 2.5 Live、Cartesia Sonic-2、ElevenLabs Flash v3、LiveKit Agents 1.0 和 Pipecat 0.0.70 让低于800ms 的首次音频出发 变得可实现──标准不只是延迟──它是交互感:不断断用户,不被用户断断,能从句中断中恢复,在对话中调用工具而不让音频停停,并不能承受动态移动网络──

Você não pode passar por três REST 调用做到这一点―― a arquitetura deve ser de extremo em extremo em tubulação de streaming―― depois de construí-la, o modelo de fracasso se tornará visível: para telefonéfono VAD 频频调优的背景电视触发, turn-detector 等待永远不会出现的标点, TTS 在输出前缓冲 400ms―― este Capstone tem como objetivo corrigir esses problemas individualmente sob carga, e publicar um relatório de atraso e qualidade.

## 概念

O oleoduto tem cinco fases de streaming:**audio in**(Você é um navegador ou um servidor de rede de Internet da PSTN)**ASR**(Vem do Deepgram Nova-3 ou de transcrições parciais de streaming de sussurros mais rápidos)**turn detection**(VAD adicionado a leitura de transcrições parciais para determinar o modelo de detector de viradas)**LLM**(Quando o juízo virar 完成就开始流通代币)**TTS**(Em primeiro sinal de LLM  Depois de cerca de 200 minutos dentro começaram a transmitir áudio fora)

Três pontos de atenção.**Barge-in**Quando o usuário em agente falar, TTS vai eliminar, ASR imediatamente recebe.**Tool use**A rede de comunicação de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede de rede**Backpressure**Em seguida, o agente de segurança da empresa, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança e o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança e o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o agente de segurança, o responsável por interagem, o serviço, o responsável por interagem, o responsável por interagem, por interagem, por interagem, e o responsável por interagem, por interagem, por interagem, por meio de segurança, por meio de segurança, por meio de segurança, por meio de segurança, por meio do site.

测量标准是定量性的──在 15 dB SNR Hamming VAD 基准上 WER 低于 8%──100次已测量通话的第一音频出发 p50 低于 800ms──误截断率低于 3%──TTS 的MOS 高于 4.2──单台 g5.xlarge 支持 50 路并发通话──这些数字就是交付物物──

## Arquitetura

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

- Transport:LiveKit Agents 1.0(WebRTC)加 Twilio PSTN gateway;Pipecat 0.0.70  como framework de reserva
- ASR:Deepgram Nova-3(streaming, inferior a 300ms de primeira parcela) ou auto-tutor de sussurro mais rápido Whisper-v3-turbo
- VAD:Silero VAD v5加 LiveKit turn-detector(读取 parcial transcrições 的小型变压器)
- LLM: para uso em estreita concentração em OpenAI GPT-4o em tempo real, Gemini 2.5 Flash Live, ou classe associada Claude Haiku 4.5
- TTS:Cartesia Sonic-2 ((minimum first-byte) ≈ElevenLabs Flash v3, ou para auto-administrar
- Ferramentas: para tempo/calendário/reservas de FastMCP canais laterais; se ferramenta 耗时 >300ms,agent 预先发出填料
- Observabilidade:OpenTelemetry spans de voz 带 audio replay of Langfuse voice traces
- Deploição:单台 g5.xlarge(24GB VRAM) para auto-administrador Whisper + Orpheus; administrador API Us 用于最小延迟


```figure
ce-voice-latency
```

## Construí-lo

1. **WebRTC session。**Inicie uma sala LiveKit e um cliente de streaming de áudio do microfone web. Em um servidor, adicione um agente de sala.

2. **ASR streaming。**Para os quadros de 20 ms de PCM 送入Deepgram Nova-3(或 GPU 上的快速语) ⋅订阅部分和最终转录──记录每个部分的延迟──

3. **VAD and turn detector。**Em um evento de final de discurso, apenas quando o VAD exprime a quietude de 500ms e o detector de rotação está concluído, o número de participantes > 0,6 时, é enviado para "tornar-se completo".

4. **LLM stream。**Em volta completa, use a conversa em curso, adicione a transcrição final, inicie a chamada de LLM, torque de tokens, primeiro token, entregue ao TTS.

5. **TTS stream。**Cartesia Sonic-2 vai transmitir os blocos de áudio para volta. O primeiro bloco deve sair do servidor após 200 minutos.

6. **Barge-in。**Quando o VAD detecta um novo usuário durante a transmissão do TTS, imediatamente elimina o fluxo TTS, deixa de produzir o LLM restante e reinicia o ASR.`tts_canceled`Espanha

7. **Tool side channel。**O programa de tempo e calendário será registrado para ferramentas de chamada de função.

8. **Eval harness。**录制 100 次通话──计算 WER(对照 held out transcript) ‧误截断率(user句子中途时 TTS被取消) ‧第一音频出发 p50、TTS MOS(humano ou NISQA), bem como teste de perda de nervosidade(justificar 3% de pacotes) ‧

9. **Load test。**Utilize chamada sintética em um único terminal g5.xlarge 上驱动 50 路并发通话――测量持续首音出 p95──

## Use-o

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

## Entrega-o

`outputs/skill-voice-agent.md`É um fornecedor de material. É um fornecedor de um domínio.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 端到端延迟 | 100 次已录制通话中的 p50 first-audio-out 低于 800ms |
| 20 | Turn-taking 质量 | Hamming VAD benchmark 上误截断率低于 3% |
| 20 | Tool-use 正确性 | 对话中途 tool calls 返回正确数据且不让音频停顿 |
| 20 | packet loss 下的可靠性 | 注入 3% packet drop 时的 WER 和 turn-taking 稳定性 |
| 15 | Eval harness 完整性 | 带 public config 的可复现实验测量 |
| **100** | | |

## 练习

1. A partir de agora, a nova nova 3 será substituída por a nova nova 3 em g5.xlarge.

2. 添加中断-arbitration 策略:当用户在工具调中 时,agent 怎么做?

3. 运行逆向转检测器测试:让用户在句子中途长时间停顿――调优 VAD silencios limiar 和转检测器得分门,在不超过 900ms的前提下实现最小误截断――

4.  através de Twilio  o mesmo agente  será implantado na PSTN── comparar PSTN primeiro áudio-out com WebRTC── explicar jitter-buffer 和 codec 差异──

5. 为非英语语言(japonês、espanhol) Adicionar detecção de atividade de voz。测量 Silero VAD v5 false-trigger rate,并与语言特定细节比较──

## 关键术语

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

- [LiveKit Agents 1.0](https://github.com/livekit/agents) 参考 WebRTC agente framework
- [Pipecat](https://github.com/pipecat-ai/pipecat) 备用 Python-first streaming agent framework
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) 集成语音模型的参考
- [Deepgram Nova-3 documentation](https://developers.deepgram.com/docs) streaming ASR 参考
- [Silero VAD v5](https://github.com/snakers4/silero-vad) Modelo de referência do VAD
- [Cartesia Sonic-2](https://docs.cartesia.ai) 低延迟 TTS 参考
- [Retell AI architecture](https://docs.retellai.com) Agente de produção de idiomas 架构
- [Vapi.ai production stack](https://docs.vapi.ai) 备用生产级参考
