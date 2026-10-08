# التدفقات الحديثة إلى الحديث  موشي、هيبيكي مع الحوار المزدوج الكامل

> 2024-2026 سنة أعيد تعريف语音 AI。 موشي  أصدرت نموذجًا واحدًا ، يمكن أن يتم بـ 200 ms 延迟同时听和说。Hibiki 逐块完成 speech-to-speech 翻译。

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 13 (Neural Audio Codecs), Phase 6 · 11 (Real-Time Audio), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## 问题

كل وكيل صوتي بناء على الدروس 11 + 12 لديه حد تأخير أساسي، حوالي 300-500 ms: VAD 触发,STT 处理,LLM 推理,TTS 生成── كل مرحلة لها حد تأخيرها الأدنى── يمكنك تعديل وتزامن، ولكن الحد الأدنى للشكل هو الحد الأقصى──

موشي ((كيوتاى2024-2026)) طرح سؤال مختلف: ماذا لو لم يكن هناك خط أنابيب؟ ماذا لو كان نموذجًا يتلقى الصوت مباشرة ويتخرج الصوت بشكل مستمر، بينما كان النص هو مجرد محادثة داخلية في الوسط، وليس مرحلة ضرورية؟

الجواب هو**full-duplex speech-to-speech**△ النظرية تأخير 160 ms(80 ms Mimi الإطار + 80 ms تأخير صوتي) ・ في单张 L4 GPU 上的实际延迟为200 ms──这是顶级管道 语音代理 能达到延迟的一半──

## مفهوم الأساسي

![Moshi architecture: two parallel Mimi streams + inner-monologue text](../assets/moshi-hibiki.svg)

### معمارة موشي

**输入。**两条 ميمي مدونات، متوسط 12.5 هرتز × 8 كتب مدونات:

- التيار 1: المستخدم 音频
- التيار 2:موشي 自己的音频(由موشي 生成)

**Transformer。**واحد 7B-المعلم التحول الزمني مع معالجة اثنين من التدفقات و 1 مقال الموتي الدخلي  التدفقات .

1. 消耗最新用户 ميمي توكن ((8 个代码簿) 👇
2. 消耗最近的Moshi Mimi Token ((8 个代码书,按生成结果) 👇
3. 生成下一个 موشي 文本 Token(مونوغ داخلي)
4. 生成下一个Moshi Mimi Token ((من خلال محول عمق صغير 生成 8 كتابات رمزية)

三条流: المستخدم الصوت频、موشي 音频、موشي 文本并行运行──موشي يمكن أن تسمع المستخدم في الحديث؛ يمكن أن تقطع نفسك في المستخدم خلال قطعها؛ يمكن أن تقوم بالقناة الخلفية ((mhm) دون قطع نفسك الرئيسية الكلام──

**Depth Transformer。**في إطار واحد داخل 8 ة كودك ليست موازنة التنبؤ ، فهي موجودة كودك 间依赖.

### لماذا نص من اليمونولوجي الداخلي يساعد

إذا لم يكن هناك نص واضح، فإن النموذج يجب أن يكون في تيار صوتي في خفاءة نموذج اللغة.

### اللغة الإنجليزية:تداول الخطاب إلى الخطاب

مثل بنية، استخدام ترجمة على تدريبات.

الأولية دعم أربعة لغات على حد سواء؛ يمكن استخدام حوالي 1000 ساعة من البيانات للتكييف مع لغات جديدة.

### بيتر واسع من كومة كيوتاى ((2026)

- **Moshi** حوار كامل مزدوج ((法语优先,英语支持良好)
- **Hibiki / Hibiki-Zero** ترجمة متزامنة للخطاب
- **Kyutai STT** التدفقات التدريبية (500 ms أو 2.5 ثانية في المستقبل)
- **Kyutai Pocket TTS** 100M-برامج TTS 可在CPU 上运行(2026年 1月)
- **Unmute** مجموعة كاملة من هذه القدرات على الخدمات العامة

L40S GPU 上的吞吐量:64 个并发会议,3×实时――

### السيسام CSM  近亲

استخدم CSM Sesame ((2025) شبيهة إلى فكرة، وهي عقدة الظهر للاما-3 من رأس ميمي كوديك. ولكن CSM هي مجرد اتجاهات (استلام السياق + النص، إنتاج الكلام) ، وليس دوبليكس كامل.

### أرقام الأداء 2026

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

## بناءها

### 步骤1: واجهة

موشي 暴露一个WebSocket服务器,接收80ms的Mimi-encoded audio piece,并返回80ms的Mimi-encoded audio piece──双向──持续进行──

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

### الخطوة الثانية: حلقة كاملة

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

两方向同时运行──Python asyncio 或 Rust futures 是标准传输方式──

### 步骤 3:هدف التدريب

 لكل إطار 80 ms `t`:

- المدخل:`user_mimi[0..t]`.`moshi_mimi[0..t-1]`.`moshi_text[0..t-1]`
- التنبؤ:`moshi_text[t]`ثمّ`moshi_mimi[t, codebook_0..7]`

文本先于音频预测(المونولوج الداخلي);音频在深度变压器内按代码簿 顺序预测。

### الخطوة 4: موشي فوز في أين،输 في أين

موشي 赢在:

- في أجهزة سعر القطع القطع القطعية التنفيذ أقل من 250 ms من التأخير في التأجيل
- الطبيعي للقناة الخلفية و التقاطع
- لا تحتاج إلى رمز لصق الأنابيب

موشي غير ماهر:

- أداة تدعو ((ليس هناك تدريب لهذا ؛ تحتاج إلى طريق LLM منفصل)
- 长推理(موشي هو نموذج حوار 8B 左右, ليس كلود/GPT-4)。
- حقيقة حقيقة على الموضوع
- معظم المشاريع في مرحلة الإنتاج (عام 2026 لا يزال في استخدام خط الأنابيب)

## استخدمها

| Situation | Pick |
|-----------|------|
| 最低延迟语音 companion | Moshi |
| 实时翻译通话 | Hibiki |
| 语音 demo / research | Moshi, CSM |
| 带 tools 的企业 agent | Pipeline (Lesson 12), not Moshi |
| context 中的 custom-voice TTS | Sesame CSM |
| Speech-to-speech，任意语言 | GPT-4o Realtime or Gemini 2.5 Live (commercial) |

## فخ

- **有限的 tool calling。**موشي هو نموذج الحوار، وليس إطار عميل.
- **特定声音 conditioning。**موشي استخدام شخصية واحدة للتدريب؛ تم تجميع صوت هو مرة أخرى تدريب واحد واحد.
- **语言覆盖。**法语 + 英语非常好;其他语言有限──Hibiki-Zero 有帮助,但你仍然需要训练数据──
- **资源成本。**جلسة موشي كاملة ستحتل فتحة GPU ليست طريقة تنفيذ المشترك المشترك

## 交付 it

保存为 `outputs/skill-duplex-pipeline.md` لعبء عمل وكيل صوتي  اختيار خط الأنابيب أو كامل مزدوج 架构,并给出理由──

## التدريب

1. **Easy。**运行 `code/main.py` سوف تكون على شكل رمزي مثل اثنين من التيار + داخلية الاحتكار
2. **Medium。**من HuggingFace 拉取 Moshi,运行服务器,测试一次对话──测量 from user talk结束到 Moshi 开始响应的墙钟延迟──
3. **Hard。**خذ دراستك 12 وكيل خطوط الأنابيب، في 20 条 تطابق اختبار التصريح 上 مع موشي مقارنة ب50 تأخيرها

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
- [Sesame (2025). Crossing the uncanny valley of voice](https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice) تحديدات CSM
- [Kyutai — Moshi repo](https://github.com/kyutai-labs/moshi) تنصيب + خادم
- [OpenAI — Realtime API](https://platform.openai.com/docs/guides/realtime) 封闭商业同类。
- [Kyutai — Delayed Streams Modeling](https://github.com/kyutai-labs/delayed-streams-modeling) إطار STT/TTS من المستوى الأساسي
