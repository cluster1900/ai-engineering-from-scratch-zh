# كابستون 03  实时语音 مساعد(ASR إلى LLM إلى TTS)

> وكيل صوتي طبيعي يشعر بالحاجة إلى تأخير أقل من 800ms ، يعرف متى توقف الكلام ، يمكن معالجته ، ويمكن أيضاً استخدام الأدوات دون انقطاع.

**Type:** Capstone
**Languages:** Python（agent + pipeline）、TypeScript（web client）
**Prerequisites:** Phase 6（speech and audio）、Phase 7（transformers）、Phase 11（LLM engineering）、Phase 13（tools）、Phase 14（agents）、Phase 17（infrastructure）
**Phases exercised:**P6 · P7 · P11 · P13 · P14 · P17
**Time:** 30 小时

## 问题

语音一直是 2025-2026年发展最快的AI UX 类别──技术上限每季都在下降──OpenAI Realtime API、Gemini 2.5 Live、Cartesia Sonic-2、ElevenLabs Flash v3、LiveKit Agents 1.0 和 Pipecat 0.0.70 都让低于800ms 的首次音频出发 变得可实现──标准不只是延迟──它是交互感:不断用户,不被用户断,能从句中断中恢复,在对话中调用工具而不让音频停,并能承受动态移动网络的──

لا يمكنك عبور拼接三个 REST 调用做到这一点. يجب أن يكون التشغيل في التدفق عبر الأنابيب من نهاية إلى نهاية. بعد بناءه ، سيصبح نموذج الفشل مرئيًا: للفورفون VAD بتأثير تلفزيوني خلفي ، كاشف التحول ينتظر علامات لن تظهر أبدا ، TTS في المخرج قبل缓冲 400ms.

## 概念

خط الأنابيب لديه خمس مراحل:**audio in**(من المتصفح أو من شبكة الإنترنت (PSTN)**ASR**(من Deepgram Nova-3 أو صور سريعة)**turn detection**(VAD بالإضافة إلى قراءة النصوص الجزئية من أجل تقرير نموذج كشف التحول الصغير)**LLM**(حينما يدور الحكم)**TTS**(في أول علامة LLM  بعد حوالي 200ms بداية تشغيل الصوت خارج)

ثلاثة نقاط اهتمام**Barge-in**عندما يبدأ المستخدم في التحدث مع العميل ، سيتم إزالة TTS ، ويتم إضافة ASR على الفور.**Tool use**: dialog中途的功能调用(天气、日历) يجب أن تكون على القناة الجانبية 上运行, لا يمكن أن يجعل الصوت توقف; إذا كان التأخير يتجاوز 300ms, الوكيل 会预先填充一个确认令牌("ثانية واحدة...")。**Backpressure**: في فقدان الحزمة أسفل، سيتم الاحتفاظ بنسخ جزئية، VAD  زيادة قيمة البوابة الخطابية، وكيل 避免在未确认消息上方继续说话──

测量标准是定量的──在 15 dB SNR 的 Hamming VAD 基准上 WER 低于 8%──100次已测量通话的首发音频出 p50 低于 800ms──误截率低于 3%──TTS 的MOS 高于 4.2──单台 g5.xlarge 支持 50 路并发通话──这些数字就是交付物物──

## المكونات

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

- النقل: LiveKit Agents 1.0(WebRTC)加 Twilio PSTN gateway;Pipecat 0.0.70  كإطار احتياطي
- ASR:Deepgram Nova-3(التدفق ، أقل من 300ms الأول جزئي) أو خود托管的 أسرع-مفتشة Whisper-v3-turbo
- VAD:Silero VAD v5 加 LiveKit كشف التحولات(读取 النصوص الجزئية 的小型变压器)
- ماجستير في العلوم: تستخدم في التكوين الموثق OpenAI GPT-4o-realtime
- TTS:Cartesia Sonic-2 ((أقل بايت) ≈ElevenLabs Flash v3، أو لاستخدامها في التنظيم الذاتي
- الأدوات: لتحديد الطقس / التقويم / الحجز FastMCP القناة الجانبية ؛ إذا أدوات 耗时 >300ms,agent 预先发出填充器
- قابلية الملاحظة:OpenTelemetry امتدادات الصوت 带 تعيد الصوت
- التنفيذ:单台 g5.xlarge(24GB VRAM) للاستخدام الذاتي Whisper + Orpheus;托管 APIs 用于最小延迟


```figure
ce-voice-latency
```

## بناءها

1. **WebRTC session。**启动一个LiveKit Room 和一个直播麦克风音频的网络客户端──在服务器上,附加一个加入室的代理工作者──

2. **ASR streaming。**سوف تقوم بتسجيل إطارات PCM 20ms 送入 Deepgram Nova-3(或 GPU 上的快速- sussper) 订阅 جزئي و النسخ النهائية‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

3. **VAD and turn detector。**في تدفق الإطار 上运行 Silero VAD v5。 في حدث نهاية الخطاب 上, باستخدام أحدث النسخة الجزئية 触发 LiveKit turn-detector。 فقط عندما VAD تبين صمت 500ms 且 turn-detector اكتمال 分数 > 0.6 时,才提交为 "turn complete"。

4. **LLM stream。**بعد الانتهاء من المرحلة، استخدم المحادثة الجارية بالإضافة إلى النسخة النهائية، وبدأ مكالمة الجامعة.

5. **TTS stream。**ستقوم شركة كارتيسيا سونيك-2 بتدفق قطع الصوت مرة أخرى. يجب أن تغادر الشريحة بعد 200 دقيقة من الخادم. سيتم إرسالها إلى غرفة LiveKit.

6. **Barge-in。**عندما يقوم VAD خلال تشغيل TTS بتحقق من نطاقات جديدة من المستخدمين، يقوم بإلغاء تدفق TTS على الفور، ويتخلص من الناتج المتبقي لـ LLM، ويعيد تشغيل ASR.`tts_canceled`الإستمرار

7. **Tool side channel。**سوف يتم استخدام أدوات الاتصال المنزلية في الوقت الحالي، إذا كان 300ms داخل غير المرجع، دع LLM يصدّر "ثانية واحدة، دعيني أبحث" كملف؛ أداة عودة بعد المرجع.

8. **Eval harness。**录制 100 次通话──计算 WER(对照 held-out transcript) ‧误截断率(用户句子中途时 TTS 被取消) ‧第一音频p50、TTS MOS(إنسان أو NISQA) ،以及 jitter-loss test(丢弃 3% من الحزم) 

9. **Load test。**استخدام المكالمة الاصطناعية في لوحات g5.xlarge 上驱动 50 路并发通话──测量持续第一音频-out p95──

## استخدمها

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

## 交付 it

`outputs/skill-voice-agent.md`هو تسليم الأشياء. أعطى نطاق دعم العملاء. تخطيط المواعيد أو المقصورة.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 端到端延迟 | 100 次已录制通话中的 p50 first-audio-out 低于 800ms |
| 20 | Turn-taking 质量 | Hamming VAD benchmark 上误截断率低于 3% |
| 20 | Tool-use 正确性 | 对话中途 tool calls 返回正确数据且不让音频停顿 |
| 20 | packet loss 下的可靠性 | 注入 3% packet drop 时的 WER 和 turn-taking 稳定性 |
| 15 | Eval harness 完整性 | 带 public config 的可复现实验测量 |
| **100** | | |

## التدريب

1. سوف يبدل Deepgram Nova-3 ب g5.xlarge                                                                                                                                                                                                                                                        

2. 添加中断-仲裁 策略:当用户在工具调用期间 时,agent 怎么做?比较三种策略(硬取消、完成工具-then-stop、排队下一轮)

3. 运行逆境转检测器测试:让用户在句子中途长时间停顿――调优 VAD silence threshold 和 turn-detector score threshold,在不超过900ms的前提下实现最小误截点――

4. 通過 Twilio سوف يقوم نفس الوكيل 部署 إلى PSTN── مقارنة PSTN أول صوت خارج مع WebRTC── شرح jitter-buffer 和 كودك 差异──

5. 为非英语语言(اليابانية、الإسبانية) إضافة اكتشاف النشاط الصوتي。测量 Silero VAD v5  false-trigger rate,并与语言特定的细节比较──

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

- [LiveKit Agents 1.0](https://github.com/livekit/agents) 参考 إطار وكيل ويب آر تي سي
- [Pipecat](https://github.com/pipecat-ai/pipecat) إطار الوكيل التدفق الأول Python
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) 集成 الخطاب نماذج
- [Deepgram Nova-3 documentation](https://developers.deepgram.com/docs) التدفق ASR 参考
- [Silero VAD v5](https://github.com/snakers4/silero-vad) نموذج مرجعية لـ VAD
- [Cartesia Sonic-2](https://docs.cartesia.ai) 低延迟 TTS 参考
- [Retell AI architecture](https://docs.retellai.com) 生产级语音 وكيل 架构
- [Vapi.ai production stack](https://docs.vapi.ai) 备用生产级参考
