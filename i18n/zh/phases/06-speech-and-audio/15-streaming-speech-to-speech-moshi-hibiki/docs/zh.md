# 流媒体语音与语音 莫希、希比基与全双对话

> 2024-2026年重新定义语音 AI。Moshi 发布了一个单一模型,可以以200 ms延迟同时听和说。Hibiki 逐块完成语音翻译──两者都放弃了ASR → LLM → TTS管道,转向基于Mimi代码符号的统一全双重架构──这是新的参考设计──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 13 (Neural Audio Codecs), Phase 6 · 11 (Real-Time Audio), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## 问题

每个基于11+12课程的语音代理都有一个基本的延迟下限,大约在300-500ms:VAD触发,STT处理,LLM推理,TTS生成――每个阶段都有自己的最低延迟――你可以调整并行化,但管道的形态会限制上限――

莫希·九台,2024-2026)提出了一个不同的问题:如果根本没有管道会怎么样?如果一个模型直接接收音频并输出音频,连续进行,文本只是一个中间的内,不是必需阶段,会怎么样?

答案是**full-duplex speech-to-speech**△理论延迟160 ms(80 ms米米框架 +80 ms声学延迟) ・在单张L4 GPU上实际延迟为200 ms──这是顶级管道语音代理能达到延迟的一半──

## 核心概念

![Moshi architecture: two parallel Mimi streams + inner-monologue text](../assets/moshi-hibiki.svg)

### 莫希建筑

**输入。**两条 Mimi编码流,均为12.5 Hz × 8 代码书:

- 频道1:用户音频(Mimi编码,持续到达)
- 流2:Moshi 自己的音频(由Moshi 生成)

**Transformer。**一个7B参数时代变压器 同时处理两条流 和一条文本 内部单独流. 在每80ms 步长中,它会:

1. 消耗最新用户Mimi Token ((8个代码书) 👇
2. 消耗最近的Moshi Mimi代币,8个代码书,按生成结果)
3. 生成下一个莫希文本代币 (内部独奏)
4. 生成下一个莫希米米代币 (通过一个小的深度变压器 生成8个代码书)

三条流:用户音频、Moshi 音频、Moshi 文本并行运行──Moshi 可以在谈话中听到用户;可以在用户打断时打断自己;可以进行反频道(mhm) 没有打断自己主要话语──

**Depth Transformer。**在一个框架内,8 个代码簿 不是并行预测的,它们存在代码簿间依赖.一个小型的2层深度变压器会在80 ms内按顺序预测它们.这是AR代码 LM的标准分解方式.

### 为什么内面单词文本有帮助

如果没有显式文本,模型就必须在声流中隐式建模语言――莫希的洞察是:强制它在音频旁边一起输出文本标记――文本流本质上是莫希正说的话的转录――这会提升语义连贯性,让语言模型头更容易更容易,并且免费给你转录结果――

### 语文:流通语文翻译

相同架构,使用翻译对训练――源语言音频输入,目标语言音频连续输出――Hibiki-Zero(2026年2月) 消除对词级对齐训练数据的需求,使用句级数据 + GRPO强化学习来优化延迟――

开始支持四种语言对;可以使用约1000小时的数据适应新语言.

### 更广泛的九台堆(2026)

- **Moshi** 双重对话(法语优先,英语支持良好)
- **Hibiki / Hibiki-Zero**同时演讲翻译
- **Kyutai STT**流动ASR(500ms或2.5秒前景)
- **Kyutai Pocket TTS** 100M-param TTS 可在CPU上运行(2026年1月)
- **Unmute** 在公共服务器上组合这些能力的完整管道

发射时间: 64 个,实时3 ×

### 芝麻CSM 近亲

芝麻CSM (Sesame CSM) 使用类似思路,一个带着米米编程头的Llama-3背骨.但CSM是单向的接收文本+文字,生成语音),而不是全双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双双

### 2026 年的绩效数字

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

## 构建它

### 步骤1:界面

莫希 暴露一个WebSocket服务器,接收80ms的米米编码音频部分,并返回80ms的米米编码音频部分──双向──持续进行──

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

### 步骤2:全双循环

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

两方向同时运行──Python 无机或化期货是标准传输方式──

### 步骤3:培训目标 (概念)

对于每一个80ms的框架`t`其他:

- 输入:`user_mimi[0..t]`,我知道.`moshi_mimi[0..t-1]`,我知道.`moshi_text[0..t-1]`
- 预测:`moshi_text[t]`然后是`moshi_mimi[t, codebook_0..7]`

文本先于音频预测(内蒙古语音);音频在深度变压器内按代码簿 顺序预测。

### 步骤4:莫西在哪里赢,输在哪里

莫希 赢在:

- 在便宜硬件上实现低于250ms的端到端延迟.
- 自然的后道和打断.
- 不需要管道接码.

莫希不擅长:

- 工具叫 ((没有为此训练;你需要单独的LLM路径)
- 长推理(莫希是一个8B左右的对话模型,不是克劳德/GPT-4)。
- 关于小众主题的事实准确性.
- 大多数生产级企业用例 (道仍在使用)

## 使用它

| Situation | Pick |
|-----------|------|
| 最低延迟语音 companion | Moshi |
| 实时翻译通话 | Hibiki |
| 语音 demo / research | Moshi, CSM |
| 带 tools 的企业 agent | Pipeline (Lesson 12), not Moshi |
| context 中的 custom-voice TTS | Sesame CSM |
| Speech-to-speech，任意语言 | GPT-4o Realtime or Gemini 2.5 Live (commercial) |

## 陷

- **有限的 tool calling。**莫希是对话模式,不是代理框架.
- **特定声音 conditioning。**语音克隆是另一次单独训练.
- **语言覆盖。**法语 + 英语非常好;其他语言有限──Hibiki-Zero有帮助,但你仍然需要训练数据──
- **资源成本。**一个完整的Moshi会占据一个GPU插槽;不是便宜的共享租户部署模式.

## 交付它

保存为`outputs/skill-duplex-pipeline.md`△为一个语音代理工作负载 选择管道或全双结构,并给出理由──

## 练习

1. **Easy。**运行`code/main.py`△它将以符号方式模拟双流+内结构.
2. **Medium。**从 HuggingFace 拉取 Moshi,运行服务器,测试一次对话――测量从用户说话结束到 Moshi 开始响应的墙钟延迟――
3. **Hard。**拿你的课 12 管道代理,在 20 条匹配测试说法 上与莫希比较P50延迟――写出管道

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

- [Défossez et al. (2024). Moshi — speech-text foundation model](https://arxiv.org/html/2410.00037v2)论文:
- [Kyutai Labs (2026). Hibiki-Zero](https://arxiv.org/abs/2602.12345) 无需对齐数据的流媒体翻译.
- [Sesame (2025). Crossing the uncanny valley of voice](https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice)CSM规范
- [Kyutai — Moshi repo](https://github.com/kyutai-labs/moshi) 安装+服务器──
- [OpenAI — Realtime API](https://platform.openai.com/docs/guides/realtime)封闭商业同类
- [Kyutai — Delayed Streams Modeling](https://github.com/kyutai-labs/delayed-streams-modeling) 底层STT/TTS框架
