# Streaming Speech-to-Speech  Moshi、Hibiki với Full-Duplex Dialogue

> 2024-2026 năm tái định nghĩa语音 AI。Moshi 发布 một mô hình đơn lẻ, có thể được sử dụng với 200 ms 延迟同时听和说。Hibiki 逐块 hoàn thành nói chuyện-tiếng 翻译。两者都放弃 ASR → LLM → TTS pipeline, chuyển sang dựa trên Mimi codec Token 统一全双结构。 đây là thiết kế tham khảo mới。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 13 (Neural Audio Codecs), Phase 6 · 11 (Real-Time Audio), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## 问题

Mỗi đại lý tiếng dựa trên Bài học 11 + 12  xây dựng đều có một giới hạn chậm trễ cơ bản, khoảng trong 300-500 ms: VAD 触发, STT  xử lý, LLM 推理, TTS 生成── mỗi giai đoạn có độ chậm trễ tối thiểu của riêng mình── bạn có thể điều chỉnh và đồng hành hóa, nhưng hình dạng của đường ống sẽ bị giới hạn trên──

Moshi ((Kyutai,2024-2026) đưa ra một vấn đề khác: nếu không có đường ống, sẽ như thế nào? Nếu một mô hình trực tiếp tiếp nhận âm thanh và phát âm, tiếp tục được thực hiện, và văn bản chỉ là một bài đơn nội dung giữa, không phải là giai đoạn cần thiết, sẽ như thế nào?

答案是 **full-duplex speech-to-speech**△Theory延迟 160 ms(80 ms Mimi frame + 80 ms âm thanh chậm) ・ 在单张 L4 GPU 上的实际延迟为200 ms──这是顶级管道语音代理能达到延迟的一半──

## 核心概念

![Moshi architecture: two parallel Mimi streams + inner-monologue text](../assets/moshi-hibiki.svg)

### Kiến trúc Moshi

**输入。**两条 Mimi codec stream, trung bình là 12,5 Hz × 8 codebook:

- Stream 1: người dùng音频(Mimi-encoded,持续到达)
- Stream 2:Moshi 自己的音频(由Moshi 生成)

**Transformer。**Một biến đổi thời gian tham số 7B đồng thời xử lý hai dòng và một dòng văn bản  nội dung monolog dòng. Trong mỗi bước dài 80 ms, nó sẽ:

1. 消耗最新用户 Mimi Token ((8 个代码簿) ⋅
2. 消耗最近的Moshi Mimi Token ((8 个代码簿,按生成结果) ⋅
3. 生成下一个 Moshi 文本 Token(đối thoại bên trong)
4. 生成下一个Moshi Mimi Token (Từ một bộ biến đổi độ sâu nhỏ 生成 8 个代码)

三条流:用户音频、Moshi 音频、Moshi 文本并行运行──Moshi có thể nghe người dùng trong cuộc nói chuyện; có thể tự cắt ngang khi người dùng cắt ngang; có thể tiến hành kênh trở lại (back-channel) mhm) mà không cắt ngang chính mình chính话语──

**Depth Transformer。**Trong một khung trong 8 ách mã không phải là dự đoán, chúng tồn tại trong một cuốn sách mã 间依赖. Một bộ biến đổi độ sâu 2 tầng nhỏ sẽ được dự đoán theo thứ tự trong 80 ms. Đây là cách phân giải tiêu chuẩn của AR codec LM.

### Tại sao nội dung văn bản có ích

Nếu không có văn bản rõ ràng, mô hình sẽ phải được chuyển đổi trong dòng âm thanh. Nhìn của Moshi là: bắt buộc nó xuất bản văn bản bên cạnh thanh.

### Hibiki:ngôn ngữ dịch trực tuyến

相同架构,使用翻译对训练――源语言音频输入,目标语言音频连续输出――Hibiki-Zero(2026 年 2 月) loại bỏ nhu cầu về dữ liệu đào tạo đối với từ, sử dụng dữ liệu về từ ngữ + GRPO tăng cường học tập để tối ưu hóa trì hoãn――

Đỗ trợ ban đầu 4 ngôn ngữ đối với; có thể sử dụng khoảng 1000 giờ dữ liệu để thích ứng với ngôn ngữ mới.

### Hơn nữa Kyutai xếp hàng rộng hơn(2026)

- **Moshi** đối thoại đầy đủ (duplex)
- **Hibiki / Hibiki-Zero** dịch thuật ngôn ngữ đồng thời
- **Kyutai STT** streaming ASR ((500 ms hoặc 2,5 s nhìn về phía trước)
- **Kyutai Pocket TTS** 100M-param TTS 可在 CPU 上运行(2026 年 1 月)
- **Unmute** Phép hợp các năng lực này trên các dịch vụ công cộng

L40S GPU 上的吞吐量:64 个并发 session,3× real time。

### Sesame CSM  近亲

Sesame CSM(2025) sử dụng tương tự như một cái nghĩ, một cái xương sống Llama-3 của đầu codec Mimi. Nhưng CSM là đơn向的 (từ nhận ngữ cảnh + văn bản, tạo ra ngôn ngữ), thay vì là hoàn toàn képlex. Nó là thị trường tốt nhất.

### Số hiệu suất 2026

| Model | Latency | Use case | License |
|-------|---------|----------|---------|
| Moshi | 200 ms (L4) | full-duplex English / French dialogue | CC-BY 4.0 |
| Hibiki | 12.5 Hz framerate | French ↔ English streaming translation | CC-BY 4.0 |
| Hibiki-Zero | same | 5 language-pairs, no aligned data | CC-BY 4.0 |
| Sesame CSM-1B | 200 ms TTFA | context-conditioned TTS | Apache-2.0 |
| GPT-4o Realtime | ~300 ms | closed, OpenAI API | commercial |
| Gemini 2.5 Live | ~350 ms | closed, Google API | commercial |


```figure
sp-fullduplex
```

##  xây dựng nó

### 步骤 1: giao diện

Moshi 露出一个WebSocket máy chủ,接收80 ms của Mimi mã hóa âm thanh,并返回80 ms của Mimi mã hóa âm thanh ⋅双向──持续进行──

```python
import asyncio
import websockets
from moshi.client_utils import encode_audio_mimi, decode_audio_mimi

async def moshi_chat():
    async with websockets.connect("ws://localhost:8998/api/chat") as ws:
        mic_task = asyncio.create_task(stream_mic_to(ws))
        spk_task = asyncio.create_task(stream_from_to_speaker(ws))
        await asyncio.gather(mic_task, spk_task)
```

### 步骤 2: vòng lặp đầy đủ

```python
async def stream_mic_to(ws):
    async for chunk_80ms in mic_stream_at_12_5_hz():
        mimi_tokens = encode_audio_mimi(chunk_80ms)
        await ws.send(serialize(mimi_tokens))

async def stream_from_to_speaker(ws):
    async for msg in ws:
        mimi_tokens, text_token = deserialize(msg)
        audio = decode_audio_mimi(mimi_tokens)
        await play(audio)
```

两个方向同时运行──Python asyncio 或 Rust futures là phương thức truyền tải tiêu chuẩn──

### 步骤 3: Mục tiêu đào tạo

 Đối với mỗi khung 80 ms `t`- Có thể là:

- Nhập:`user_mimi[0..t]``moshi_mimi[0..t-1]``moshi_text[0..t-1]`
- Dự đoán:`moshi_text[t]`, rồi là`moshi_mimi[t, codebook_0..7]`

文本先于音频预测(đối thoại bên trong);音频在深度变压器 内按代码簿 顺序预测。

### Bước 4:Moshi thắng ở đâu, thua ở đâu

Moshi 赢在:

- Trong các thiết bị giá rẻ, đạt được chậm hơn 250 ms.
- Chuyển đường quay lại tự nhiên và cắt đứt.
- Không cần mã kẹo đường ống.

Moshi không giỏi:

- Công cụ gọi ((không có đào tạo cho nó; bạn cần một cách độc lập LLM Path)
- 长推理(Moshi là một mô hình đối thoại 8B 左右, không phải Claude/GPT-4)。
- Sự thật chính xác trên chủ đề 小众.
- Đại đa số các doanh nghiệp cấp sản xuất sử dụng ống dẫn nước (tại 2026 năm)

## Sử dụng nó

| Situation | Pick |
|-----------|------|
| 最低延迟语音 companion | Moshi |
| 实时翻译通话 | Hibiki |
| 语音 demo / research | Moshi, CSM |
| 带 tools 的企业 agent | Pipeline (Lesson 12), not Moshi |
| context 中的 custom-voice TTS | Sesame CSM |
| Speech-to-speech，任意语言 | GPT-4o Realtime or Gemini 2.5 Live (commercial) |

## 陷

- **有限的 tool calling。**Moshi là mô hình đối thoại, không phải khung đại lý.
- **特定声音 conditioning。**Moshi sử dụng một cá nhân đào tạo đơn; nhân bản giọng nói là một lần khác một cách đào tạo đơn độc.
- **语言覆盖。**法语 + 英语 rất tốt;其他语言有限──Hibiki-Zero có giúp đỡ, nhưng bạn vẫn cần đào tạo dữ liệu──
- **资源成本。**Một phiên Moshi hoàn chỉnh sẽ chiếm một khe GPU; không phải là một phương thức phân phối thuê nhà rẻ tiền.

## 交付 nó

保存为 `outputs/skill-duplex-pipeline.md` Đối với một khối lượng công việc của đại lý giọng nói  chọn đường ống hoặc cấu trúc kép đầy đủ,并给出理由──

## 练习

1. **Easy。**运行 `code/main.py`Nó sẽ được mô tả theo cách mô hình hai dòng + cấu trúc monolog trong.
2. **Medium。**Từ HuggingFace 拉取 Moshi,运行服务器,测试一次对话――测量 từ người dùng nói chuyện kết thúc đến Moshi  bắt đầu đáp ứng của thời gian trễ của đồng hồ tường――
3. **Hard。**拿你的课 12管道代理, 在 20 条匹配测试语句 上与莫希比较P50延迟──写出管道 仍然在架构上取胜的情况──

## 关键术语

| Term | 人们常说的意思 | 实际含义 |
|------|-----------------|-----------------------|
| Full-duplex | 同时听和说 | 同一个模型上同时活跃两条 audio stream。 |
| Inner monologue | 模型的文本 stream | Moshi 在输出音频的同时发出文本 Token。 |
| Depth transformer | codebook 间预测器 | 在一个 80 ms frame 内预测 8 个 codebook 的小型 Transformer。 |
| Mimi | Kyutai 的 codec | 12.5 Hz × 8 codebooks；semantic+acoustic；驱动 Moshi。 |
| Streaming S2S | 实时 audio → audio | 逐块翻译/对话，没有 pipeline stage。 |
| Back-channeling | “Mhm” 反应 | Moshi 可以发出小的确认反馈，而不打断自己的 turn。 |

## 延伸阅读

- [Défossez et al. (2024). Moshi — speech-text foundation model](https://arxiv.org/html/2410.00037v2) 论文。
- [Kyutai Labs (2026). Hibiki-Zero](https://arxiv.org/abs/2602.12345) 无需对齐数据的流媒体翻译──
- [Sesame (2025). Crossing the uncanny valley of voice](https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice) Khóa học CSM
- [Kyutai — Moshi repo](https://github.com/kyutai-labs/moshi) 安装 + máy chủ
- [OpenAI — Realtime API](https://platform.openai.com/docs/guides/realtime) 封闭商业同类。
- [Kyutai — Delayed Streams Modeling](https://github.com/kyutai-labs/delayed-streams-modeling) 底层 STT/TTS framework。
