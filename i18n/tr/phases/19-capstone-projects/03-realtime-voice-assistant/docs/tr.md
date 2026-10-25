# Capstone 03  实时语音 Asistan(ASR'e LLM'e TTS'e)

> Bir duyuru doğal ses ajansı 端到端延迟低于800ms,知道你何时停止说话,能处理barge-in,并且能在不间断的情况下调用工具──Retell、Vapi、LiveKit Ajenleri 和 Pipecat 2026 yılında tüm bu standardı ulaştı──它们采用相同的形式:streaming ASR、转发探测器、streaming LLM 和streaming TTS,全部通过WebRTC 连接,并设置激进的延迟预算──构建一个,测量WER、MOS 和错断率,并运行它下输──

**Type:** Capstone
**Languages:** Python（agent + pipeline）、TypeScript（web client）
**Prerequisites:** Phase 6（speech and audio）、Phase 7（transformers）、Phase 11（LLM engineering）、Phase 13（tools）、Phase 14（agents）、Phase 17（infrastructure）
**Phases exercised:**P6 · P7 · P11 · P13 · P14 · P17
**Time:** 30 小时

## 问题

语音一直是 2025-2026 yılları en hızlı gelişen AI UX 类别──技术上限每季都在下降──OpenAI Realtime API、Gemini 2.5 Live、Cartesia Sonic-2、ElevenLabs Flash v3、LiveKit Agents 1.0 和 Pipecat 0.0.70 hepsi 800 ms'den düşük ilk ses çıkışı 实现可实现──標準不只是延迟──它是交互感:不断断用户,不被用户断断,能从句中断中恢复,对话中调调工具而不让音频停,并能承受动的移动网络──

Bu konuda üç REST 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 调用 

## 概念

Pipeline'nin beş aşaması var:**audio in**(browser veya PSTN'in WebRTC'den)**ASR**(Deepgram Nova-3 veya daha hızlı fısıldayan akış kısmi transkriptlerinden)**turn detection**(VAD ayrıca kısmi transkriptleri okuyarak, küçük dönüş algılayıcı modelinin sonuçlarını belirlemek için)**LLM**(Bir kez karar döner 完成就开始流通代币)**TTS**(第1 LLM Token 后约200ms内开始播放音频出)

Üç farklı dikkat noktası.**Barge-in**: user on agent talk when start talking, TTS 会取消, ASR 立即接管──**Tool use**: dialog中途の機能呼び出し(weather、calendar) yan kanalda 上运行, can can can't let the audio频 stop; eğer gecikme 300ms'den fazla ise, ajan 会预先填充一个确认令("bir saniye...")。**Backpressure**Üzerinde bir paket kaybı var. Aşağıda kısmi transkriptler saklanıyor.

测量标准是定量性──在 15 dB SNR'deki Hamming VAD 基准上 WER 低于 8%──100次已测量通话的首发音 output p50 低于 800ms──误截断率低于 3%──TTS'in MOS 高于 4.2──单台 g5.xlarge 支持 50 路并发通话──这些数字就是交付物──

## Yapılandırma

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

- Transport:LiveKit Agents 1.0(WebRTC)加 Twilio PSTN gateway;Pipecat 0.0.70 备用 framework olarak
- ASR:Deepgram Nova-3(streaming, 300ms'ten düşük) veya özetleyici'nin daha hızlı fısıldadığı Whisper-v3-turbo
- VAD:Silero VAD v5 加 LiveKit dönüş-detektor(读取 kısmi transkriptleri 的小型变压器)
- LLM: yoğun bir şekilde oluşturulan OpenAI GPT-4o-real-time √ Gemini 2.5 Flash Live, veya sınıfı Claude Haiku 4.5(akışlayış tamamlamaları, bağımsız ses yolu)
- TTS:Cartesia Sonic-2 ((minimum first-byte) ≈ElevenLabs Flash v3, veya kendi kendine yönetilen açık kaynak Orpheus için kullanılır
- Araçlar: Hava/Takvim/Kazanlama için FastMCP yan kanal; Eğer araç 耗时>300ms,agent 预先发出填料
- Gözlem:OpenTelemetry ses uzantıları、带 ses tekrarlaması Langfuse ses izleri
- Uygulama:单台 g5.xlarge(24GB VRAM) otomatik kontrol için kullanılır Whisper + Orpheus;


```figure
ce-voice-latency
```

## Yapın onu.

1. **WebRTC session。**Bir LiveKit odasını ve bir akış mikrofon sesinin web istemcisini başlatın── serverde, ekle bir ekleme odası ajanı çalışanı──

2. **ASR streaming。**20 ms PCM çerçeveleri 送入 Deepgram Nova-3(或 GPU 上的快速语) ・订阅部分和最终转录──记录每个部分的延迟──

3. **VAD and turn detector。**Çerçeve akışı 上运行 Silero VAD v5──在演讲结束事件上,最新的部分转录使用触发LiveKit dönüş-detektor──只有当 VAD表示静默 500ms 且转-detektor的完成 分数 > 0.6 时,才提交为"turn complete"──

4. **LLM stream。**Son transkriptiyle birlikte devam eden konuşmayı tamamlayın.

5. **TTS stream。**Cartesia Sonic-2 ses parçalarını akışlandıracak. İlk parça, ilk LLM Token'in ardından 200 ms içinde sunucuyu terk etmesi gerekiyor.

6. **Barge-in。**VAD TTS 播放期间检测到新用户语音时时, hemen TTS akışını kaldırır, kalan LLM çıkışını bırakır,并重新启动 ASR──发布一个 `tts_canceled`Uçaklık

7. **Tool side channel。**Gelecekte zaman ve takvim için kayıtlı olacak fonksiyon çağıran araçlar.

8. **Eval harness。**录制 100 次通话──计算 WER(对照 held-out transcript) ‧误截断率(user句子中途时 TTS被取消) ‧首次音频出发 p50、TTS MOS(insan veya NISQA),以及 jitter-loss test(丢弃 3% paket) ‧

9. **Load test。**Sintez telefon kullanın.

## Kullan

```
caller: "what is the weather in tokyo tomorrow"
[asr  ] partial @280ms: "what is the"
[asr  ] partial @540ms: "what is the weather"
[turn ] completion score 0.82 at @820ms; commit
[llm  ] tool call emitted @880ms
[tool ] weather.tokyo tomorrow -> 68/52 partly cloudy @940ms
[llm  ] first token @990ms
[tts  ] first audio-out @1040ms: "Tokyo tomorrow will be partly cloudy..."
turn latency: 1040ms user-stop -> audio-out
```

## - Söyle.

`outputs/skill-voice-agent.md`Bu, bir LiveKit ajanı başlatır ve ASR/VAD/LLM/TTS borusunu 调优到测量标准──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 端到端延迟 | 100 次已录制通话中的 p50 first-audio-out 低于 800ms |
| 20 | Turn-taking 质量 | Hamming VAD benchmark 上误截断率低于 3% |
| 20 | Tool-use 正确性 | 对话中途 tool calls 返回正确数据且不让音频停顿 |
| 20 | packet loss 下的可靠性 | 注入 3% packet drop 时的 WER 和 turn-taking 稳定性 |
| 15 | Eval harness 完整性 | 带 public config 的可复现实验测量 |
| **100** | | |

## 练习

1. Deepgram Nova-3'u g5.xlarge'ye değiştirmek için daha hızlı fısıldayan v3 turbo-ı kullanmak.

2. 添加中断-仲裁 策略:当用户在工具调用期间 时,agent 怎么做?

3. 运行逆向转检测器测试:让用户在句子中途长时间停顿――调优 VAD sessizlik eşiği 和转检测器得分 eşiği,在不超过900ms 前提下实现最小误截断――

4. 通过 Twilio将同一个代理 部署到PSTN── PSTN ilk ses çıkışı ile WebRTC──解释 jitter-buffer 和 codec 差异──

5. 为非英语语言(Yaponce、İspanyolca) Ek ses etkinliği algılaması──测量 Silero VAD v5'in yanlış tetikleme oranı,并与语言特定细节比较──

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

- [LiveKit Agents 1.0](https://github.com/livekit/agents) 参考 WebRTC ajan çerçevesini
- [Pipecat](https://github.com/pipecat-ai/pipecat) 备用 Python-first streaming agent çerçevesini
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) 集成 konuşma modelleri referansı
- [Deepgram Nova-3 documentation](https://developers.deepgram.com/docs) Akış ASR 参考
- [Silero VAD v5](https://github.com/snakers4/silero-vad) VAD referans modeli
- [Cartesia Sonic-2](https://docs.cartesia.ai) 低延迟 TTS 参考
- [Retell AI architecture](https://docs.retellai.com) 生产级语音代理 架构
- [Vapi.ai production stack](https://docs.vapi.ai) 备用生产级参考
