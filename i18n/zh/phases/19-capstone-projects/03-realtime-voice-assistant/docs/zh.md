# 卡普斯通 03  实时语音助理(ASR到LLM到TTS)

> 一个感觉自然的语音代理需要端到端延迟低于800ms,知道你何时停止说话,能处理,并且能在不间断的情况下调用工具――Retell、Vapi、LiveKit Agents 和 Pipecat 在2026年都达到这个标准――它们采用相同的形式:流媒体ASR、转换探测器、流程LLM和流媒体TTS,全部通过WebRTC 连接,并设置激进的延迟预算――构建一个,测量WER、MOS 和错误断率,并运行它下面.

**Type:** Capstone
**Languages:** Python（agent + pipeline）、TypeScript（web client）
**Prerequisites:** Phase 6（speech and audio）、Phase 7（transformers）、Phase 11（LLM engineering）、Phase 13（tools）、Phase 14（agents）、Phase 17（infrastructure）
**Phases exercised:**子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子
**Time:** 30 小时

## 问题

语音一直是2025-2026年发展最快的AI UX类别.技术上限每季都在下降.OpenAI实时API、Gemini 2.5Live、Cartesia Sonic-2、ElevenLabs Flash v3、LiveKit Agents 1.0和Pipecat 0.0.70都使得 800ms的第一次音频输出变得可实现.标准不仅仅是延迟. 它是交互感:不断用户,不被用户断,可以从句子中断中恢复,在对话中调用工具而不让音频停顿,并不能承受动态移动网络.

你无法通过拼接三个 REST调调做到这一点. 架构必须是端到端的管道流. 构建后,失败模式会变得可见:为电话音频调优的VAD被背景电视触发,转变探测器等待永远不会出现的标志,TTS在输出前缓冲400ms.

## 概念

管道有五个流量阶段:**audio in**(来自浏览器或PSTN的WebRTC)**ASR**(来自深度图片Nova-3或更快的声的部分转录)**turn detection**(VAD加上读取部分转录以判断完成线索的小型转变探测器模型)**LLM**(一旦判断转变完成就开始流媒体代币)**TTS**(在第一个LLM标志后约200ms内开始播放音频)

其他问题**Barge-in**当用户在代理说话时开始说话时,TTS会取消,ASR立即接管.**Tool use**交谈中途的函数调用 (weather,calendar) 必须在侧频道上运行,不能让音频停顿;如果延迟超过300ms,代理会预先填充确认令牌 (("一秒...")。**Backpressure**在包装丢失下,部分转录会被保留,VAD 提高语音门值,代理 避免在未确认消息上继续说话.

测量标准是定量化. 在 15 dB SNR 的Hamming VAD基准上 WER 低于 8%. 已测量通话的第一次音频输出 p50 低于 800ms. 误截率低于 3%.

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

- 运输:LiveKit Agents 1.0(WebRTC)加 Twilio PSTN门户;Pipecat 0.0.70 作为备用框架
- 简称"深度图片" (深度图片) 转载,低于300ms的第一个部分) 或自托管的更快的语Whisper-v3-turbo
- 阅读部分转录的小型变压器)
- 专业士:用于密集成的OpenAI GPT-4o实时,Gemini 2.5 Flash Live,或级联Claude Haiku 4.5(流媒体完成,独立音频路径)
- 卡特西亚索尼克-2 (最低第一字节) ‧ElevenLabs Flash v3,或用于自托管的开源Orpheus
- 工具:用于天气/日历/预订的快速MCP侧道;如果工具耗时 >300ms,代理 预先发出填充器
- 观察性:OpenTelemetry语音跨度、带音频重播的Langfuse语音痕迹
- 部署:单台 g5.xlarge(24GB VRAM) 用于自托管Whisper + Orpheus;托管API 用于最低延迟


```figure
ce-voice-latency
```

## 构建它

1. **WebRTC session。**启动一个LiveKit室和一个流媒体麦克风音频的网络客户端. 在服务器上,附加一个加入室的代理工作者.

2. **ASR streaming。**将20ms PCM 框架 送进Deepgram Nova-3(或 GPU 上的更快的声) ・订阅部分和最终转录――记录每个部分的延迟――

3. **VAD and turn detector。**在框架流上运行Silero VAD v5──在演讲结束事件上,使用最新的部分转录触发LiveKit转换探测器──只有当VAD表示静默500ms且转换探测器完成 分数>0.6 时,才提交为"转换完成".──

4. **LLM stream。**在转换完成后,用正在进行的对话加上最后的转录启动LLM电话――流通代币――第一个代币 出现时,交给TTS――

5. **TTS stream。**卡特西亚索尼克-2将播放音频块回来. 第一个块必须在第一个LLM代币后200ms内离开服务器.

6. **Barge-in。**当VAD在TTS播放期间检测到新用户语音时,立即取消TTS流,丢弃剩余的LLM输出,并重新启动ASR──发布一个.`tts_canceled`跨度

7. **Tool side channel。**将天气和日历注册为函数调用工具――调用时并发发发电话;如果300ms内未返回,让LLM发发发"一秒钟,让我检查"作为填充器;工具 返回后继续――

8. **Eval harness。**录制 100 次通话――计算 WER(对照 截断率) 误截断率) 用户句子中途时 TTS 被取消) 首次录音 p50、TTS MOS(人或NISQA),以及丧测试(丢弃3%的包) △

9. **Load test。**用合成调用器 在单台 g5.xlarge 上驱动 50 路并发通话――测量持续首发音频 p95――

## 使用它

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

## 交付它

`outputs/skill-voice-agent.md`是交付物品──给定一个域名(客户支持、安排或亭子),它会启动一个LiveKit代理,并将ASR/VAD/LLM/TTS管道调优到测量标准──标题:

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 端到端延迟 | 100 次已录制通话中的 p50 first-audio-out 低于 800ms |
| 20 | Turn-taking 质量 | Hamming VAD benchmark 上误截断率低于 3% |
| 20 | Tool-use 正确性 | 对话中途 tool calls 返回正确数据且不让音频停顿 |
| 20 | packet loss 下的可靠性 | 注入 3% packet drop 时的 WER 和 turn-taking 稳定性 |
| 15 | Eval harness 完整性 | 带 public config 的可复现实验测量 |
| **100** | | |

## 练习

1. 将Deepgram Nova-3 替换为g5.xlarge 上的更快语 v3turbo──测量延迟和WER 差距──识别CPU-vsGPU 决策在哪些位置重要──

2. 添加中断-仲裁 策略:当用户在工具调用期间入时,代理怎么做?

3. 运行逆境转录检测器测试:让用户在句子中途长时间停顿――调优 VAD沉默门和转录检测器得分门,在不超过900ms的前提下实现最低误截点――

4. 通过Twilio将与同一个代理部署到PSTN──比较PSTN首次音频与WebRTC──解释器缓冲和编程器差异──

5. 为非英语语言(日本语、西班牙语) 添加语音活动检测――测量Silero VAD v5的错误触发率,并与语言特定的细节比较――

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

- [LiveKit Agents 1.0](https://github.com/livekit/agents) 参考WebRTC代理框架
- [Pipecat](https://github.com/pipecat-ai/pipecat) 备用Python首个流媒体代理框架
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) 集成语音模型的参考
- [Deepgram Nova-3 documentation](https://developers.deepgram.com/docs)流媒体ASR 参考
- [Silero VAD v5](https://github.com/snakers4/silero-vad) VAD 参考模型
- [Cartesia Sonic-2](https://docs.cartesia.ai) 低延迟 TTS 参考
- [Retell AI architecture](https://docs.retellai.com) 生产级语音代理 架构
- [Vapi.ai production stack](https://docs.vapi.ai) 备用生产级参考
