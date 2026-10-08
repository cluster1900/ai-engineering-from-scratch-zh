# Sesli ajanlar:Pipecat 和 LiveKit

> Ses ajanları 2026 yılında bir sınıf bir sınıf üretim sınıfıdır. Pipecat Python çerçevesine dayalı bir boru hattı sunuyor.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~60 minutes

## Öğrenme hedefi
- 描述 Pipecat 基于frame 的管道:DOWNSTREAM(source→sink) 和 UPSTREAM(control)。
- Standart ses boru hattı aşamalarını ve Pipecat'ın hangi taşımacılığı desteklediğini belirtmek.
- 解释 LiveKit Ajanlarının iki ses ajansı sınıfı ((MultimodalAgent、VoicePipelineAgent) ve kendi uygun kullanım alanları¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- 总结 2026 yılının üretim ortamının gecikmesi beklenmesi ve bu beklenimler nasıl yapısal seçimleri yönlendirecekti.

## 问题
Ses ajanları TTS'in metin döngüsünde bir dışa bağlı değildir. Geçerli bütçe çok zordur. ~ 600 ms.

## 概念
### Pipecat (pipecat-ai/pipecat)

- Python çerçevesine dayanan bir boru çerçevesidir.
- `Frame`→ `FrameProcessor`zincir
-  iki akış yönü:
  - **DOWNSTREAM** kaynak → sink(audio in, TTS out)
  - **UPSTREAM** geri bildirim ve kontrol (bkz: iptal, metrikler, barj)
- `PipelineTask`通過事件(`on_pipeline_started`- Evet.`on_pipeline_finished`- Evet.`on_idle_timeout`) ve ölçümler/içimleme/RTVI gözlemcileri için kullanılır 管理 lifecycle──

Tipik boru hattı:

```
VAD (Silero) → STT → LLM (context alternates user/assistant) → TTS → transport
```

Transport:Gündelik、LiveKit、SmallWebRTCTransport、FastAPI WebSocket、WhatsApp¬

Pipecat Akışları  Yapılandırılmış konuşmalar artırmak (State machines)。Pipecat Cloud is managed runtime。

### LiveKit Ajanları (livekit/ajanlar)

- WebRTC üzerinden AI modellerini kullanıcıya bağlayacağız.
- 核心概念:`Agent`- Evet.`AgentSession`- Evet.`entrypoint`- Evet.`AgentServer`- Evet.
- 两个语音代理类:
  - **MultimodalAgent**  OpenAI Gerçek zaman veya eşit fiyat programı üzerinden doğrudan ses işleme
  - **VoicePipelineAgent** STT → LLM → TTS kaskasası; metin düzeyinde kontrol sağlar。
- Transformer modeli ile semantik dönüm algısını gerçekleştirmek.
- MCP 集成──
- SIP ile telefon desteği.
- LiveKit Inference üzerinden 50+ model sunulur, API anahtarları gerekmez; eklentiler üzerinden 200+ daha fazla model de bağlanabilir.

### Ticari platformlar

Vapi( optimization 后的高级技术约450600ms) 和 Retell(180次测试通话中端到端到端到600ms) Bu seçeneklerin üzerine inşa edilmiştir.

### Bu yol kolayca yanlış bir yerde

- **没有 barge-in handling。**User打断;agent 继续说话──在 Pipecat 中需要UPSTREAM取消框架,LiveKit 中需要等价机制──
- **忽略 STT confidence。**低信心抄录被当成事实送入 LLM──应基于信心做门,或请求确认──
- **TTS mid-sentence cutoff。**Bu, bir sözcükün ortasında biterken, TTS'in bunu bilmesi gerekir. Yoksa ses kesilmesi gerekir.
- **忽略 latency budget。**Her bileşen 50 200ms artışa neden oluyor.

### 2026'da tipik gecikmeler

- VAD:2060 ms
- STT kısmi:100250ms
- LLM 首个 Token:150400ms
- TTS ilk ses: 100  200 ms
- Nakliye RTT: 30 80 ms

Son 450 600ms  Yüksek deneyimlere aittir. 800  1200ms  Çok sık görülmektedir.


```figure
voice-pipeline
```

## Yapın onu.
`code/main.py`Çerçeve tabanlı bir oyuncak boru hattı, içerir:

- `Frame`türleri(audio、transcript、text、tts_audio、control)
- - Evet .`process(frame)``Processor`Bağlantı
- Bir beş aşama boru hattı (VAD → STT → LLM → TTS → nakliye), senaryo işlemcileri ile gerçekleşmiştir.
- Bir UPSTREAM iptal çerçevesini, barge-in göstermek için kullanılır.

- Yapma .

```
python3 code/main.py
```

Trace 会 normal akış gösterir, ayrıca bir kez TTS'in konuşma sırasında durdurulmasını iptal eder.

## Kullan
- **Pipecat**Tamamen kontrol altına alınmış  özelleştirilmiş işlemciler  Python-first  可插拔提供者──
- **LiveKit Agents**WebRTC-i ve telefon için kullanılıyor.
- **Vapi / Retell**WebRTC ekibinin ev sahipliği yapan ses ajanları kullanmıyor.
- **OpenAI Realtime / Gemini Live**Doğrudan ses içi/ ses çıkışı için kullanılır.

## - Söyle.
`outputs/skill-voice-pipeline.md`Pipecat 形态的音声管道架 脚手架, VAD + STT + LLM + TTS + ulaşım, yanı sıra barge-in muamelesi içerir.

## 练习
1. Oyuncak hattını göstermek için ölçümleri ekle gözlemci: her aşama, her saniyede çerçeveler, sayı, gecikme nerede toplanır?
2. 实现 confidence-gated STT:低于值时, request bunu tekrar edebilir misin?
3. 添加语义转检:简单规则  如果转录 以 "?" 结尾,则视为转的结尾──
4. 阅读 Pipecat'ın ulaşım dokümanları──把 stdlib ulaşım 替换为 SmallWebRTCTransport config(stub)。
5. Aynı sorguda, OpenAI gerçek zamanlı olarak STT+LLM+TTS kaskadası ile ölçülüyor.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Frame | "Event" | pipeline 中有类型的数据单元（audio、transcript、text、control） |
| Processor | "Pipeline stage" | 带有 process(frame) 的 handler |
| DOWNSTREAM | "Forward flow" | 从 source 到 sink：audio in，speech out |
| UPSTREAM | "Feedback flow" | Control：cancel、metrics、barge-in |
| VAD | "Voice activity detection" | 检测用户何时正在说话 |
| Semantic turn detection | "Smart end-of-turn" | 基于 model 判断用户已经说完 |
| MultimodalAgent | "Direct audio agent" | Audio in，audio out；中间没有 text |
| VoicePipelineAgent | "Cascade agent" | STT + LLM + TTS；text-level control |

## 延伸阅读
- [Pipecat docs](https://docs.pipecat.ai/getting-started/introduction)                                                                                                                                                                                                                                                              
- [LiveKit Agents docs](https://docs.livekit.io/agents/) WebRTC + ses ilkesi
- [Vapi](https://vapi.ai/) Yönetilen ses platformu
- [Retell AI](https://www.retellai.com/) yönetilen ses,kenarlık-benchmarked
