# कैपस्टोन 03  实时语音 सहायक(ASR तक LLM तक TTS)

> एक एहसास प्राकृतिक आवाज एजेंट 端到端延迟低于800ms, जानता है कि आप何时停止说话,能处理驳进,并且能在不间断的情况下调用工具──Retell、Vapi、LiveKit एजेंट和Pipecat 2026 में सभी इस मानक को प्राप्त किया है── वे एक ही रूप को अपनाते हैंःस्ट्रीमिंग ASR、转移探测器、LLM、स्ट्रीमिंग TTS, सभी वेबआरटीसी 连接 के माध्यम से, और प्रत्येक कूद पर एक उन्नत देरी बजट सेट करें── एक का निर्माण करें, मापें WER、MOS 和错误断率, और पैकेट हानि को काटें।

**Type:** Capstone
**Languages:** Python（agent + pipeline）、TypeScript（web client）
**Prerequisites:** Phase 6（speech and audio）、Phase 7（transformers）、Phase 11（LLM engineering）、Phase 13（tools）、Phase 14（agents）、Phase 17（infrastructure）
**Phases exercised:**P6 · P7 · P11 · P13 · P14 · P17
**Time:** 30 小时

## 问题

语音一直是 2025-2026 साल के सबसे तेजी से विकास AI UX 类别──技术上限每季都在下降──OpenAI रियल टाइम एपीआई、Gemini 2.5 Live、Cartesia Sonic-2、ElevenLabs Flash v3、LiveKit Agents 1.0 和 Pipecat 0.0.70 सभी 800ms से कम के पहले ऑडियो आउट को प्राप्त करने में सक्षम बनाते हैं। मानक सिर्फ देरी नहीं है── यह एक संवाद हैः उपयोगकर्ता को नहीं तोड़ता, उपयोगकर्ता द्वारा नहीं तोड़ता, वाक्य के बीच के ब्रेक से पुनर्प्राप्त कर सकता है, बातचीत के दौरान उपकरण को कॉल करता है और ध्वनि के माध्यम से बंद नहीं कर सकता है, यह मोबाइल नेटवर्क के गतिशीलता को सहन कर सकता है।

आप तीन REST को जोड़कर यह करने के लिए नहीं कर सकते हैं। संरचना को अंत से अंत तक पाइपलाइन स्ट्रीमिंग द्वारा संचालित करना चाहिए। इसे बनाने के बाद, असफलता का मॉडल दिखाई देगाः एक पृष्ठभूमि टीवी कैप्चर द्वारा संचालित वीएडी के लिए, टर्न-डिटेक्टर के लिए प्रतीक्षा करें जो कभी दिखाई नहीं देगा, टीटीएस में 400ms का उत्पादन करने के लिए अग्रिम में ढकना। कैपस्टोन का लक्ष्य इन समस्याओं को लोड करने के लिए एक-एक करके ठीक करना है, और एक विलंब और गुणवत्ता रिपोर्ट जारी करना है।

## 概念

पाइपलाइन के पांच स्ट्रीमिंग चरण हैंः**audio in**(ब्राउजर या PSTN के वेबआरटीसी से)**ASR**(Deepgram Nova-3 या तेज-चुपके स्ट्रीमिंग आंशिक प्रतिलेखन से)**turn detection**(VAD अतिरिक्त पढ़ना आंशिक प्रतिलेखन को करने के लिए निर्णय करने के लिए पूरा करने के लिए मार्ग के छोटे बारी-डिटेक्टर मॉडल)**LLM**(एक बार निर्णय बारी 完成就开始播放 टोकन)**TTS**(पहले LLM टोकन में लगभग 200ms अंदर स्ट्रीमिंग ऑडियो बाहर शुरू)

तीनों तरफ ध्यान देने वाली बाते**Barge-in**: जब उपयोगकर्ता एजेंट पर बात करते हैं तो बात करना शुरू करते हैं, टीटीएस 会取消, एएसआर 立即接管──**Tool use**: वार्ता中途的功能调用(天气、日历) को पक्ष चैनल上运行 पर होना चाहिए, नहीं कर सकते हैं ध्वनि频停; यदि देरी 300ms से अधिक है, एजेंट 会预先填充一个确认 टोकन("एक सेकंड...")。**Backpressure**: में पैकेट हानि नीचे, आंशिक प्रतिलेखन होगा संरक्षित, VAD  बढ़ाएँ भाषण-गेट मूल्य, एजेंट 避免在未确认消息上方继续说话──

测量标准是定量性── 15 dB SNR के हैमिंग VAD बेंचमार्क पर WER 低于 8%──100 बार पहले से ही मापने वाले फोन के पहले ऑडियो आउटपुट p50 低于 800ms──误截断率低于 3%──TTS का MOS उच्च है 4.2──单台 g5.xlarge 支持 50 路并发通话──这些数字就是交付物物──

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

- परिवहनःलाइवकिट एजेंट 1.0(वेबआरटीसी)加 Twilio PSTN गेटवे;Pipecat 0.0.70 作为备用框架
- एएसआरःडीपग्राम नोवा -3 ((स्ट्रीमिंग, 300ms के पहले आंशिक से कम) या स्व-टॉयब के तेज-चुपकाव Whisper-v3-turbo
- VAD:Silero VAD v5 प्लस LiveKit बारी-बारी से डिटेक्टर(读取 आंशिक प्रतिलेखन 的小型变压器)
- LLM: प्रयोग में आता है बंद बंद करने के लिए OpenAI GPT-4o-realtime, मिथुन 2.5 फ्लैश लाइव, या वर्ग वर्ग क्लाउड हैकु 4.5
- TTS:Cartesia Sonic-2 ((कम से कम प्रथम बाइट) ≈ElevenLabs Flash v3, या स्व-नियंत्रण के लिए ओपन सोर्स Orpheus
- उपकरणः मौसम/कैलेंडर/बुकिंग के लिए फास्टएमसीपी साइड-चैनल; यदि उपकरण 耗时>300ms, एजेंट 预先发出 भराव
- अवलोकनशीलताःOpenTelemetry आवाज स्पैन、带 ऑडियो रिप्ले के Langfuse आवाज निशान
- तैनातीः单台 g5.xlarge(24GB VRAM) के लिए इस्तेमाल किया जाता है स्व-托管 विस्पर + ऑर्फियस;托管 एपीआई के लिए उपयोग किया जाता है न्यूनतम देरी


```figure
ce-voice-latency
```

##  इसे निर्माण

1. **WebRTC session。** एक लाइवकिट कमरे और एक स्ट्रीमिंग माइक्रोफोन ऑडियो के वेब क्लाइंट को प्रारंभ करें── सर्वर पर, एक जोड़ा गया कमरे के एजेंट कार्यकर्ता──

2. **ASR streaming。**20ms पीसीएम फ्रेम 送入Deepgram Nova-3(或 GPU 上的快速-ささ) ⋅订阅部分和最终转录──记录每部分的延迟──

3. **VAD and turn detector。**फ़्रेम स्ट्रीम 上运行 Silero VAD v5──在 भाषण-अंत घटना上, नवीनतम आंशिक प्रतिलेख के साथ 触发 LiveKit टर्न-डिटेक्टर── केवल जब VAD शांतता 500ms 且 टर्न-डिटेक्टर का पूरा हुआ 分数 > 0.6 时,才提交为"turn complete"──

4. **LLM stream。**                                                                                                                                                                                                                                                              

5. **TTS stream。**कार्टेशिया सोनिक-2 ऑडियो टुकड़े स्ट्रीम वापस आओ. पहला टुकड़ा  प्रथम LLM टोकन  के बाद 200ms में अंदर छोड़ सर्वर  जाएगा टुकड़े  लाइवकिट कमरे में भेज दिया जाएगा; ग्राहक  WebRTC jitter बफर 播放

6. **Barge-in。**जब VAD TTS 播放期间检测到新用户语音时, तुरंत TTS स्ट्रिम को रद्द करें, शेष LLM आउटपुट को त्याग दें,并重新启动 ASR── एक जारी करें `tts_canceled`span

7. **Tool side channel。**️ मौसम व कैलेंडर ️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

8. **Eval harness。**录制 100 次通话──计算 WER(对照 held-out transcript) ‧误截断率(用户句子中途时 TTS被取消) ‧पहली ऑडियो आउट p50、TTS MOS(मानव या NISQA),以及 jitter-loss test(% 3 के पैकेट खो दिए) ‖

9. **Load test。**सिंथेटिक कॉलर में एकल台 g5.xlarge 上驱动 50 路并发通话――测量持续 प्रथम ऑडियो आउट p95──

## इसका उपयोग करें

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

## 交付 यह

`outputs/skill-voice-agent.md`यह एक लाइवकिट एजेंट को चालू करेगा, और ASR/VAD/LLM/TTS पाइपलाइन को 调优到测量标准──

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 端到端延迟 | 100 次已录制通话中的 p50 first-audio-out 低于 800ms |
| 20 | Turn-taking 质量 | Hamming VAD benchmark 上误截断率低于 3% |
| 20 | Tool-use 正确性 | 对话中途 tool calls 返回正确数据且不让音频停顿 |
| 20 | packet loss 下的可靠性 | 注入 3% packet drop 时的 WER 和 turn-taking 稳定性 |
| 15 | Eval harness 完整性 | 带 public config 的可复现实验测量 |
| **100** | | |

## अभ्यास

1. डीपग्राम नोवा-3 को g5.xlarge के लिए बदलना  ऊपर की तेज-चुपचिपा V3 टर्बो  माप देरी और WER 差距 识别 CPU-vs-GPU  निर्णय 

2. 添加中断-仲裁 策略:当用户在工具调用期间 时,agent 怎么做?

3. 运行逆境转检测器测试:让用户在句子中途长时间停顿――调优 VAD मौन सीमा 和转检测器成绩 सीमा,在不超过900ms के前提下实现最小误截点――

4. 通过 Twilio 将同一个代理 部署到PSTN── PSTN प्रथम ऑडियो आउट के साथ तुलना करें WebRTC──解释 jitter-buffer 和 codec 差异──

5. 为非英语语言(जापानी、स्पेनिश) ध्वनि गतिविधि का पता लगाने को जोड़ें──测量 Silero VAD v5 का झूठा ट्रिगर दर,并与语言特定细节比较──

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

- [LiveKit Agents 1.0](https://github.com/livekit/agents) 参考 वेबआरटीसी एजेंट फ्रेमवर्क
- [Pipecat](https://github.com/pipecat-ai/pipecat) 备用 पायथन-पहले स्ट्रीमिंग एजेंट फ्रेमवर्क
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) 集成 भाषण मॉडल का संदर्भ
- [Deepgram Nova-3 documentation](https://developers.deepgram.com/docs) स्ट्रीमिंग एएसआर 参考
- [Silero VAD v5](https://github.com/snakers4/silero-vad) VAD संदर्भ मॉडल
- [Cartesia Sonic-2](https://docs.cartesia.ai) 低延迟 TTS 参考
- [Retell AI architecture](https://docs.retellai.com) 生产级语音 एजेंट 架构
- [Vapi.ai production stack](https://docs.vapi.ai) 备用生产级参考
