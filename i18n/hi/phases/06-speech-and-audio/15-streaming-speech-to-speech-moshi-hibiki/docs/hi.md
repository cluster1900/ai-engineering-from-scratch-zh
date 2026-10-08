# स्ट्रीमिंग स्पीच-टू-स्पीच  मोशी、हिबिकी और फुल-डप्लक्स डायलॉग

> 2024-2026 साल में फिर से परिभाषित किया गया语音 AI。मोशी  एक एकल मॉडल जारी किया गया है, जिसे 200 ms के साथ 延迟同时听和说。Hibiki 逐块完成 भाषण-भाषा 翻译。两者都放弃了ASR → LLM → TTS पाइपलाइन,转向基于Mimi Codec Token的统一全双重架构──这是新的参考设计──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 13 (Neural Audio Codecs), Phase 6 · 11 (Real-Time Audio), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## 问题

प्रत्येक पाठ 11 + 12 के आधार पर निर्मित ध्वनि एजेंट की एक बुनियादी देरी सीमा होती है, लगभग 300-500 ms में: VAD 触发, STT 处理, LLM 推理, TTS 生成── प्रत्येक चरण में अपनी न्यूनतम देरी होती है── आप इसे अनुकूलित और संरेखित कर सकते हैं, लेकिन पाइपलाइन की आकृति सीमाएं ऊपरी हैं──

मोशी (Kyutai, 2024-2026) ने एक अलग प्रश्न उठायाः यदि कोई पाइपलाइन नहीं है तो क्या होगा? यदि एक मॉडल सीधे प्राप्त करता है और प्रसारित करता है, और लगातार चलता है, जबकि पाठ केवल एक मध्यवर्ती के भीतर है, जो एक आवश्यक चरण नहीं है, तो क्या होगा?

答案是 **full-duplex speech-to-speech**◊ सैद्धांतिक देरी 160 ms(80 ms मिमी फ्रेम + 80 ms ध्वनिक देरी) ・ में单张 L4 GPU 上的实际延迟为200 ms── यह शीर्ष स्तरीय पाइपलाइन 语音 एजेंट 能达到延迟的一半──

## 核心概念

![Moshi architecture: two parallel Mimi streams + inner-monologue text](../assets/moshi-hibiki.svg)

### मोशी वास्तुकला

**输入。**两条 मिमी कोडेक स्ट्रीम, औसत 12.5 हर्ट्ज × 8 कोडबुकः

- धारा 1: उपयोगकर्ता音频(मिमी-एन्कोड,持续到达)
- धारा 2:मोशी  अपनों音频(由मोशी 生成)

**Transformer。**एक 7B-पैरामीटर समय ट्रांसफार्मर साथ ही समय संसाधित दो धाराओं 和一条文本 内 монолог धारा── प्रत्येक 80 ms 步长中, यह होगाः

1. 消耗最新用户 मिमी टोकन ((8 个代码簿) 👇
2. 消耗最近的मोशी मिमी टोकन(8 个代码簿,按生成结果) ⋅
3. 生成下一个मोशी 文本 टोकन(अंतरिक एकांतर)
4. 生成下一个Moshi Mimi Token(एक छोटे से गहराई ट्रांसफार्मर के माध्यम से 生成 8 个代码簿) 

三条流:用户音频、Moshi 音频、Moshi 文本并行运行──Moshi को वार्तालाप में सुनकर उपयोगकर्ता से संपर्क किया जा सकता है; उपयोगकर्ता के ब्रेकअप में खुद को ब्रेकअप कर सकता है; बैक-चैनल चल सकता है (mhm) बिना ब्रेकअप किए अपने मुख्य话语──

**Depth Transformer。**एक फ्रेम में 8  कोडबुक नहीं हैं और अनुमानित हैं, वे कोडबुक पर निर्भर हैं। एक छोटे से 2 परत  गहराई ट्रांसफार्मर  80 एमएस में आयोजित किया जाता है।

### क्यों आंतरिक मोनोलॉग पाठ मददगार है

यदि कोई स्पष्ट पाठ नहीं है, तो मॉडल को ध्वनिक धारा में छिपा हुआ बनाना होगा।

### हिन्दीःभाषण-भाषण अनुवाद

इसी तरह के ढांचे, प्रयोग अनुवाद पर प्रशिक्षण  स्रोत भाषा音频输入, लक्ष्य भाषा音频连续输出── Hibiki-Zero  2 月) ने शब्द वर्ग पर प्रशिक्षण डेटा की आवश्यकता को समाप्त कर दिया, वाक्य वर्ग डेटा + GRPO प्रवर्धन सीखने का उपयोग करके देरी को अनुकूलित किया।

प्रारंभिक समर्थन चार भाषाओं के लिए; नए भाषाओं के लिए अनुकूलन के लिए लगभग 1000 घंटे का डेटा उपयोग किया जा सकता है।

### अधिक व्यापक Kyutai ढेर(2026)

- **Moshi** पूर्ण द्विवचन संवाद(法语优先,英语支持良好)
- **Hibiki / Hibiki-Zero** समवर्ती भाषण अनुवाद
- **Kyutai STT** स्ट्रीमिंग ASR(500 ms या 2.5 सेकंड आगे की ओर देखते हुए)
- **Kyutai Pocket TTS** 100M-पाराम TTS 可在CPU上运行(2026年1月)
- **Unmute** सार्वजनिक सेवा पर इन क्षमताओं को संकलित करने की पूरी पाइपलाइन

L40S GPU 上的吞吐量:64 个并发 सत्र,3× वास्तविक समय में

### सीसाम सीएसएम  近亲

सीसैम सीएसएम (Sesame CSM) ने 2025 में एक समान विचारधारा का उपयोग किया, एक के साथ मिमी कोडेक हेड के लामा -3 रीढ़ की हड्डी। लेकिन सीएसएम एकतरफा है।

### 2026 प्रदर्शन संख्या

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

##  इसे निर्माण

### 步骤 1: इंटरफ़ेस

मोशी 暴露一个WebSocket सर्वर,接收80 ms के मिमी-एन्कोड्ड ऑडियो टुकड़ा,并返回80 ms के मिमी-एन्कोड्ड ऑडियो टुकड़ा──双向──持续进行──

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

### 步骤 2: पूर्ण-डूप्लेक्स लूप

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

两方向同时运行──पायथन असyncio अथवा Rust futures 标准传输方式──

### 步骤 3:शिक्षा उद्देश्य

 प्रत्येक 80 एमएस फ्रेम के लिए `t`:

- इनपुटः`user_mimi[0..t]``moshi_mimi[0..t-1]``moshi_text[0..t-1]`
- भविष्यवाणीः`moshi_text[t]`, फिर यह है`moshi_mimi[t, codebook_0..7]`

文本先于音频预测(अंतरिक एकांतर);音频在深度变压器内按代码簿 顺序预测。

### चरण 4: मोशी जीत कहाँ,输 कहां

मोशी 赢在:

- सुविधाजनक हार्डवेयर पर 250 एमएस से कम के अंत तक अंत में देरी से प्राप्त करना।
- प्राकृतिक के बैक-चैनल 和打断──
- नियोपलाइन गोंद कोड की जरूरत नहीं है

मोशी 不擅长:

- उपकरण कॉल करना (आपको एक अलग LLM पथ की आवश्यकता है)
- 长推理(मोशी एक 8B 左右 का संवाद मॉडल है, क्लाउड/GPT-4) नहीं है।
- 小众主题上的事实准确性──
- अधिकांश उत्पादन श्रेणी उद्यम उपयोग उदाहरण (२०२६ साल में पाइपलाइन का उपयोग अभी भी किया जा रहा है)

## इसका उपयोग करें

| Situation | Pick |
|-----------|------|
| 最低延迟语音 companion | Moshi |
| 实时翻译通话 | Hibiki |
| 语音 demo / research | Moshi, CSM |
| 带 tools 的企业 agent | Pipeline (Lesson 12), not Moshi |
| context 中的 custom-voice TTS | Sesame CSM |
| Speech-to-speech，任意语言 | GPT-4o Realtime or Gemini 2.5 Live (commercial) |

## 陷

- **有限的 tool calling。**मोशी संवाद मॉडल है, एजेंट फ्रेमवर्क नहीं।
- **特定声音 conditioning。**मोशी एकल प्रशिक्षण व्यक्तित्व का उपयोग; आवाज क्लोनिंग एक और एकल प्रशिक्षण है।
- **语言覆盖。**法语 + 英语 बहुत अच्छा है; अन्य भाषाएँ सीमित हैं──Hibiki-Zero मदद करता है, लेकिन आपको अभी भी प्रशिक्षण डेटा की आवश्यकता है──
- **资源成本。**एक पूर्ण मोशी सत्र एक GPU स्लॉट पर कब्जा कर लिया जाएगा; सस्ता नहीं है साझा किरायेदार 部署 मोड

## 交付 यह

保存为 `outputs/skill-duplex-pipeline.md`◊ एक आवाज एजेंट कार्यभार  चुन पाइपलाइन या पूर्ण-डूप्लेक्स 架构,并给出理由──

## अभ्यास

1. **Easy。**运行 `code/main.py`यह दो धारा + आंतरिक एकाधिकार संरचना के प्रतीकात्मक रूप से प्रतीत होता है
2. **Medium。**से HuggingFace 拉取 Moshi,运行服务器,测试一次对话──测量 from user talk结束到 Moshi 开始响应的墙钟延迟──
3. **Hard。**拿你的课 12管道代理,在 20 条匹配测试陈述 上与莫希比较P50延迟──写出管道 仍然在架构上取胜的情况──

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

- [Défossez et al. (2024). Moshi — speech-text foundation model](https://arxiv.org/html/2410.00037v2) 论文──
- [Kyutai Labs (2026). Hibiki-Zero](https://arxiv.org/abs/2602.12345) 无需对齐数据的流媒体翻译──
- [Sesame (2025). Crossing the uncanny valley of voice](https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice) सीएसएम विनिर्देश
- [Kyutai — Moshi repo](https://github.com/kyutai-labs/moshi)  安装 + सर्वर。
- [OpenAI — Realtime API](https://platform.openai.com/docs/guides/realtime) 封闭商业同类──
- [Kyutai — Delayed Streams Modeling](https://github.com/kyutai-labs/delayed-streams-modeling)  底层 STT/TTS ढांचा
