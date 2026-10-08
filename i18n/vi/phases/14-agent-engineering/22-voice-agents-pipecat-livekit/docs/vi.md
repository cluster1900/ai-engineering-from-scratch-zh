# Các đại lý giọng nói: Pipecat và LiveKit

> Các đại lý thoại là một loại thứ nhất trong giai đoạn sản xuất năm 2026  Pipecat cung cấp đường ống dựa trên khung Python  VAD → STT → LLM → TTS → vận tải)  LiveKit Agents  Thông qua WebRTC sẽ kết nối các mô hình AI với người dùng  Advanced technology                                                                                                                                                                                                                                                                                                                                                                                                                                                         

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~60 minutes

## Học mục tiêu
- 描述 Pipecat 基于 frame 的管道:DOWNSTREAM(source→sink)和UPSTREAM(control)。
- Nói về các giai đoạn đường ống dẫn giọng nói tiêu chuẩn, cũng như các phương tiện vận chuyển Pipecat  hỗ trợ.
- 解释 hai lớp đại lý giọng nói của LiveKit Agents (MultimodalAgent, VoicePipelineAgent) và các trường hợp thích hợp của riêng mình.
- 总结 2026年生产环境的延迟预期,以及这些预期如何驱动结构选择──

## 问题
Các đại lý thoại không phải là một vòng lặp văn bản ngoài vòng của TTS. Biên bản chậm rất nghiêm khắc. ~ 600ms.

## 概念
### Chiếc pipecat (pipecat-ai/pipecat)

- 基于Python framework的管道框架──
- `Frame`→ `FrameProcessor`chuỗi
-  Hai hướng chảy:
  - **DOWNSTREAM** nguồn → sink(audio vào, TTS ra)。
  - **UPSTREAM** phản hồi và kiểm soát (các lệnh hủy, métrics, barge-in)
- `PipelineTask` Thông qua các sự kiện(`on_pipeline_started``on_pipeline_finished``on_idle_timeout`) cũng như sử dụng cho các nhà quan sát metrics/tracing/RTVI  quản lý vòng đời.

Đường ống thông điển hình:

```
VAD (Silero) → STT → LLM (context alternates user/assistant) → TTS → transport
```

Giao thông:Tình ngày,LiveKit,SmallWebRTCGiao thông,FastAPI,WebSocket,WhatsApp,

Pipecat Flow  tăng các cuộc trò chuyện có cấu trúc (tiếng nói máy tính) ――Pipecat Cloud là thời gian chạy được quản lý。

### LiveKit Agents (livekit/agents)

- Thông qua WebRTC sẽ kết nối các mô hình AI với người dùng.
- 核心概念:`Agent``AgentSession``entrypoint``AgentServer`
-  Hai lớp đại lý giọng nói:
  - **MultimodalAgent**  Thông qua OpenAI Realtime hoặc tương đương chương trình xử lý trực tiếp âm thanh.
  - **VoicePipelineAgent** STT → LLM → TTS; cung cấp kiểm soát cấp văn bản。
- Thông qua mô hình Transformer 实现语义转转检测――
- Đời sống MCP 集成──
- 通过SIP 支持电话──
- Thông qua LiveKit Inference  cung cấp 50+ mô hình, không cần thiết API chìa khóa; thông qua plugin còn có thể kết nối 200+ mô hình hơn nữa.

### Các nền tảng thương mại

Vapi(optimization后的高级技术约450600ms) 和 Retell(180次测试通话中端到端约600ms) xây dựng trên những giải pháp này.

### Mô hình này dễ dàng xuất hiện ở nơi

- **没有 barge-in handling。**Người dùng cắt đứt; đại lý tiếp tục nói chuyện.
- **忽略 STT confidence。**低信心转录被当成事实送入 LLM──应基于信心做门,或请求确认──
- **TTS mid-sentence cutoff。**Khi đường ống trong một câu được xóa đi, TTS cần biết điều này, nếu không cần phải cắt âm thanh.
- **忽略 latency budget。**Mỗi thành phần sẽ tăng 50200ms── trên tuyến trước trước để đưa toàn bộ chuỗi của sự chậm trễ.

### Típ trễ 2026

- VAD:2060ms
- STT một phần:100250ms
- LLM 首个 Token:150400ms
- TTS âm thanh đầu tiên: 100200ms
- RTT vận chuyển: 3080ms

端到端 450600ms 属于高级体验──8001200ms 很常见──任何> 1500ms 经验都会感觉已经坏了──


```figure
voice-pipeline
```

##  xây dựng nó
`code/main.py`là một hệ thống đồ chơi dựa trên khung, bao gồm:

- `Frame`types(audio、transcript、text、tts_audio、control)
- 带有 `process(frame)`của `Processor`giao diện
- Một 5 giai đoạn đường ống ((VAD → STT → LLM → TTS → vận tải),以 kịch bản xử lý 实现。
- Một khung hủy UPSTREAM, dùng để thể hiện sự thăng khơi.

运行 nó:

```
python3 code/main.py
```

Trace 会 hiển thị dòng chảy bình thường, cũng như một lần để TTS ngừng việc cướp trong cuộc nói chuyện.

## Sử dụng nó
- **Pipecat**Sử dụng để kiểm soát hoàn toàn các bộ xử lý tùy chỉnh Python đầu tiên có thể được phát triển các nhà cung cấp.
- **LiveKit Agents**Sử dụng cho việc triển khai WebRTC và điện thoại.
- **Vapi / Retell**Sử dụng không có đại lý giọng nói được lưu trữ của nhóm WebRTC.
- **OpenAI Realtime / Gemini Live**用于直接音频-in/audio-out (MultimodalAgent)

## 交付 nó
`outputs/skill-voice-pipeline.md`Lắp đặt một đường ống thoại hình dạng Pipecat 脚手架, bao gồm VAD + STT + LLM + TTS + vận chuyển, cũng như xử lý tàu thuyền.

## 练习
1. 给你的玩具管线 添加指标观察:统计 từng giai đoạn mỗi giây khung số lượng 延迟在哪里累积?
2. 实现 confidence-gated STT:低于值时,请求 Bạn có thể lặp lại điều đó không?
3. 添加语义转检:简单规则  Nếu bản sao 以 "?" 结尾,则视为转的结尾
4. 阅读 Pipecat's transport docs──把 stdlib transport 替换为 SmallWebRTCTransport config(stub)。
5. Trong cùng một truy vấn trên đo lường OpenAI thời gian thực với STT + LLM + TTS hàng loạt.

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
- [LiveKit Agents docs](https://docs.livekit.io/agents/) WebRTC + âm thanh nguyên thủy
- [Vapi](https://vapi.ai/) nền tảng thoại được quản lý
- [Retell AI](https://www.retellai.com/) tiếng nói quản lý,trong thời gian trễ
