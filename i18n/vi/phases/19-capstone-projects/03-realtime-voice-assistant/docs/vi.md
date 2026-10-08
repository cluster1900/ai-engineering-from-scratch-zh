# Capstone 03  实时语音 trợ lý(ASR đến LLM đến TTS)

> Một cảm giác của đại lý tiếng nói tự nhiên  cần phải kết thúc đến kết thúc chậm hơn 800ms, biết bạn何时停止说话, có thể xử lý barge-in, cũng có thể gọi trong không bị gián đoạn.

**Type:** Capstone
**Languages:** Python（agent + pipeline）、TypeScript（web client）
**Prerequisites:** Phase 6（speech and audio）、Phase 7（transformers）、Phase 11（LLM engineering）、Phase 13（tools）、Phase 14（agents）、Phase 17（infrastructure）
**Phases exercised:**P6 · P7 · P11 · P13 · P14 · P17
**Time:** 30 小时

## 问题

语音一直是 2025-2026年发展最快的AI UX类别──技术上限每季都在下降──OpenAI Realtime API、Gemini 2.5 Live、Cartesia Sonic-2、ElevenLabs Flash v3、LiveKit Agents 1.0 和 Pipecat 0.0.70 đều làm cho âm thanh đầu tiên ra ngoài dưới 800ms  trở nên có thể thực hiện──标准不只是延迟──它 là cảm giác giao tiếp: không bị người dùng gián đoạn, không bị người dùng gián đoạn, có thể phục hồi từ sự gián đoạn trong các câu, không để các công cụ điều khiển trong cuộc trò chuyện dừng lại, không thể chịu đựng được các mạng di động.

Bạn không thể qua cách viết ba REST 调用 để làm điều này. Biến trúc phải là cuối đến cuối được dẫn đường trực tuyến. Sau khi xây dựng nó, mô hình thất bại sẽ trở nên hiển thị: để điện thoại VAD được background TV kích hoạt, phát hiện biến đổi chờ đợi không bao giờ xuất hiện các điểm tham chiếu, TTS trong đầu ra trước缓冲 400ms. Mục tiêu của Capstone là sửa chữa từng vấn đề này dưới tải, và phát hành một báo cáo về độ chậm và chất lượng.

## 概念

Tuyến đường có 5 giai đoạn:**audio in**(từ trình duyệt hoặc WebRTC của PSTN)**ASR**(từ Deepgram Nova-3 hoặc các bản sao phân đoạn phát sóng của các bộ phim thì thầm nhanh hơn)**turn detection**(VAD cộng với đọc các bản sao một phần để đánh giá kết thúc các mô hình máy dò quay nhỏ)**LLM**(Một khi quyết định quay 完成就开始流动代币)**TTS**(Vào đầu tiên LLM Token 后约200ms内开始播放音频)

三个横切关注点──**Barge-in**Khi người dùng nói chuyện với đại lý, TTS sẽ hủy bỏ, ASR sẽ tiếp quản ngay lập tức.**Tool use**: dialog中途的功能调用(weather、calendar) phải ở kênh bên trên运行, không thể để âm thanh dừng lại; nếu chậm hơn 300ms, đại lý 会预先填充一个确认代号("một giây...")。**Backpressure**Trong khi mất gói, bản ghi phần sẽ được giữ lại, VAD  nâng cao giá trị cửa khúc, đại lý  tránh tiếp tục nói trên thông tin chưa xác nhận.

测量标准是定量性的──在 15 dB SNR của Hamming VAD chuẩn trên WER 低于 8%──100次已测量通话的第一音频出发 p50 低于 800ms──误截率低于 3%──TTS của MOS cao hơn 4.2──单台 g5.xlarge 支持 50 路并发通话──这些数字就是交付物物──

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

- Transport:LiveKit Agents 1.0(WebRTC)加 Twilio PSTN gateway;Pipecat 0.0.70  như một framework dự trữ
- ASR:Deepgram Nova-3(tham chiếu, thấp hơn 300ms của phần đầu tiên) hoặc tự quản của nhanh hơn thì thầm Whisper-v3-turbo
- VAD:Silero VAD v5 加 LiveKit quay phát hiện máy (读取部分转录的小型变压器)
- LLM: được sử dụng chặt chẽ trong OpenAI GPT-4o thời gian thực, Gemini 2.5 Flash Live, hoặc cấp độ Claude Haiku 4.5
- TTS:Cartesia Sonic-2 ((mức tối thiểu đầu tiên-byte) ≈ElevenLabs Flash v3, hoặc dùng để tự quản lý của nguồn mở Orpheus
- Công cụ: dùng cho thời tiết / lịch / đặt phòng của FastMCP bên kênh; nếu công cụ 耗时 >300ms,agent 预先发出填料
- Khả năng quan sát:OpenTelemetry tiếng nói 带 âm thanh lặp lại của Langfuse tiếng nói dấu vết
- Việc triển khai:单台 g5.xlarge(24GB VRAM) được sử dụng tự quản lý Whisper + Orpheus; quản lý API được sử dụng cho tối thiểu延迟


```figure
ce-voice-latency
```

##  xây dựng nó

1. **WebRTC session。** khởi động một phòng LiveKit và một máy khách trực tuyến phát âm microphone trên máy chủ, thêm một nhân viên của phòng tham gia 👍

2. **ASR streaming。**Để chuyển vào khung hình PCM 20ms 送入 Deepgram Nova-3(或 GPU 上的快速语) ⋅订阅部分和最终转录──记录每个部分的延迟──

3. **VAD and turn detector。**Trong frame stream 上运行 Silero VAD v5。 在演讲结束事件上,使用最新的部分转录触发LiveKit转录探测器。只有当VAD表示静默 500ms 且转录探测器的完成 分数 > 0.6 时,才提交为"turn complete"。

4. **LLM stream。**Trong lượt hoàn thành, sử dụng cuộc trò chuyện đang diễn ra cộng lại bản sao cuối cùng  khởi động cuộc gọi LLM.

5. **TTS stream。**Cartesia Sonic-2 sẽ phát âm phần mềm quay lại. Phần thứ nhất phải được phát trong đầu tiên LLM Token sau 200ms trong để rời khỏi máy chủ.

6. **Barge-in。**Khi VAD kiểm tra vào người dùng mới trong thời gian phát sóng TTS, ngay lập tức hủy dòng TTS, bỏ ra lượng sản xuất LLM còn lại,并 khởi động lại ASR.`tts_canceled`span 

7. **Tool side channel。**将天气 和日历注册为函数调用工具──调用时并发发发起调用; nếu 300ms 内未返回,让LLM 发发发"một giây, hãy để tôi kiểm tra" 作为填充器;工具 返回后继续──

8. **Eval harness。**录制 100 次通话──计算 WER(对照 held out transcript) ‧误截断率(user句子中途时 TTS被取消) ‧首发音频 p50、TTS MOS(mũndũ hoặc NISQA),以及 jitter-loss test(丢弃 3% các gói) ‧

9. **Load test。**Sử dụng máy gọi tổng hợp 在单台 g5.xlarge 上驱动 50 路并发通话――测量持续首音-out p95──

## Sử dụng nó

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

## 交付 nó

`outputs/skill-voice-agent.md`là giao hàng; cho một tên miền; hỗ trợ khách hàng; lập lịch hoặc kiosk; nó sẽ khởi động một đại lý LiveKit; và sẽ điều chỉnh ASR / VAD / LLM / TTS đường ống;

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 端到端延迟 | 100 次已录制通话中的 p50 first-audio-out 低于 800ms |
| 20 | Turn-taking 质量 | Hamming VAD benchmark 上误截断率低于 3% |
| 20 | Tool-use 正确性 | 对话中途 tool calls 返回正确数据且不让音频停顿 |
| 20 | packet loss 下的可靠性 | 注入 3% packet drop 时的 WER 和 turn-taking 稳定性 |
| 15 | Eval harness 完整性 | 带 public config 的可复现实验测量 |
| **100** | | |

## 练习

1. Để thay thế Deepgram Nova-3 thành g5.xlarge trên của v3 turbo thì thầm nhanh hơn.

2. 添加中断-仲裁 策略:当用户在工具调用期间 时,agent 怎么做?

3. 运行 đối kháng phát hiện biến đổi test:让用户在句子中途长时间停顿――调优 VAD yên lặng ngưỡng và phát hiện biến đổi điểm số ngưỡng, trong không quá 900ms giả định để đạt được tối thiểu sai lầm cắt giảm――

4. 通过Twilio sẽ cùng một đại lý 部署 vào PSTN。

5. 为非英语语言(Nhật Bản、Spanish) 添加语音活动检测──测 Silero VAD v5 率 false-trigger,并与语言特定的细节调比较──

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

- [LiveKit Agents 1.0](https://github.com/livekit/agents) 参考 WebRTC cơ quan khung
- [Pipecat](https://github.com/pipecat-ai/pipecat) 备用 Python-first streaming agent framework
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) 集成 ngôn ngữ mô hình
- [Deepgram Nova-3 documentation](https://developers.deepgram.com/docs) streaming ASR 参考
- [Silero VAD v5](https://github.com/snakers4/silero-vad) Mô hình tham chiếu VAD
- [Cartesia Sonic-2](https://docs.cartesia.ai) 低延迟 TTS 参考
- [Retell AI architecture](https://docs.retellai.com) 生产级语音 đại lý 架构
- [Vapi.ai production stack](https://docs.vapi.ai) 备用生产级参考
