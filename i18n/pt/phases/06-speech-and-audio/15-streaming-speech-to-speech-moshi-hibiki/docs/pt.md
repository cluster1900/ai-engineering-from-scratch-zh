# Transmissão de Diálogo de Discursão a Discursão  Moshi、Hibiki

> 2024-2026 anos redefiniram o idioma AI。Moshi  lançou um único modelo, que pode ser usado em 200 ms 延迟同时听和说。Hibiki 逐块完成 speech-to-speech 翻译。两者都放弃 ASR → LLM → TTS pipeline,转向基于 Mimi codec Token的统一全双重架构──这是新的参考设计──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 13 (Neural Audio Codecs), Phase 6 · 11 (Real-Time Audio), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

## 问题

Cada agente de voz construído com base na lição 11 + 12 tem um limite de atraso básico, aproximadamente em 300-500 ms: VAD 触发, STT 处理, LLM 推理, TTS 生成── cada fase tem seu próprio limite de atraso mínimo── você pode ajustar e fazer a correlação, mas a formação do pipeline é limitada por cima──

Moshi ((Kyutai,2024-2026)) propôs uma questão diferente: se não houvesse um pipeline, o que aconteceria? Se um modelo recebesse o som de uma transmissão de som e fosse continuado, e o texto fosse apenas um monólogo interno intermediário, não necessária?

A resposta é:**full-duplex speech-to-speech**△ teoria延迟 160 ms(80 ms Mimi frame + 80 ms atraso acústico) ー 在单张 L4 GPU 上的实际延迟为200 ms──这是顶级管道 语音代理能达到延迟的一半──

## 核心概念

![Moshi architecture: two parallel Mimi streams + inner-monologue text](../assets/moshi-hibiki.svg)

### Arquitetura Moshi

**输入。**两条 Mimi código de fluxo, média de 12,5 Hz × 8 codes:

- Flow 1: usuário音频(Mimi-encodado,持续到达)
- Stream 2:Moshi 自己的音频(由 Moshi 生成)

**Transformer。**Um Transformador Temporal de parâmetro 7B, que também processa dois fluxos e um texto, o fluxo monólogo interno, em cada 80 ms, ele vai:

1. 消耗最新用户 Mimi Token ((8 个代码簿) ⋅
2. 消耗最近的Moshi Mimi Token ((8 个代码簿,按生成结果) 』
3. 生成下一个 Moshi 文本 Token (monólogo interno)
4. 生成下一个Moshi Mimi Token (Tranformador de profundidade) 生成 8 个代码簿)

三条流:用户音频、Moshi 音频、Moshi 文本并行运行──Moshi pode ouvir usuário em conversação; pode se interromper em usuário; pode realizar back-channel ((mhm) sem interromper seu principal discurso──

**Depth Transformer。**Em um quadro dentro, 8 図書 não são paralelos, eles existem em um livro de códigos 间依依──a um pequeno transformador de 2 camadas depth transformator 会在 80 ms 内按顺序预测它们──这是AR codec LM's standard breakdown方式(VALL-E、VibeVoice也使用)──

### Por que o texto monólogo interno ajuda

Se não houver texto claro, o modelo deve estar em uma corrente acústica.

### Hibiki:translação de fala em fala

Para além da sua estrutura, utilizou tradução para treinamento, fontes de linguagem, fontes de ensino, metas de ensino, e outras formas de ensino.

Ini始支持四语言对; pode usar cerca de 1000 horas de dados para se adaptar a novas línguas。

### Pior amplo de Kyutai empilhadeira(2026)

- **Moshi** diálogo duplex completo ((法语优先,英语支持良好)
- **Hibiki / Hibiki-Zero** Tradução simultânea de fala
- **Kyutai STT** streaming ASR ((500 ms ou 2,5 segundos de olho para a frente)
- **Kyutai Pocket TTS** 100M-param TTS 可在 CPU 上运行(2026 年 1 月)
- **Unmute** Completar o conjunto destas capacidades no serviço público

L40S GPU 上的吞吐量:64 个并发 session,3× em tempo real。

### Sésamo CSM  近亲

O Sesame CSM (USL) usa um sistema similar, com a cabeça de codec Llama-3 de Mimi. Mas o CSM é um sistema único de recepção de contexto + texto, gerando fala), e não um duplex completo. É a melhor presença de voz no mercado.

### Números de desempenho 2026

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

## Construí-lo

### 步骤 1: interface

Moshi expõe um servidor WebSocket, recebe 80 ms de peças de áudio codificadas por Mimi,并返回 80 ms de peças de áudio codificadas por Mimi.

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

### 步骤 2: ciclo duplex completo

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

两个方向同时运行──Python asyncio 或 Rust futures é o método de transporte padrão──

### 步骤 3:objetivo de formação (概念)

 Para cada quadro de 80 ms `t`- Não .

- - A entrada:`user_mimi[0..t]`- Não.`moshi_mimi[0..t-1]`- Não.`moshi_text[0..t-1]`
- Previsão:`moshi_text[t]`E depois é .`moshi_mimi[t, codebook_0..7]`

文本先于音频预测(monólogo interno);音频在深度变压器 内按代码簿 顺序预测。

### Passo 4: Moshi ganha onde, perde onde

Moshi 赢在:

- Em hardware conveniente, a implementação é inferior a 250 ms de atraso de extremo a extremo.
- O canal de trás do natural e o corte.
- Não precisa de código de cola de pipeline.

Moshi não é bom:

- Não há treinamento para isso; você precisa de um caminho de LLM único)
- 长推理(Moshi é um modelo de diálogo 8B 左右, não é Claude/GPT-4)。
- A verdade sobre o tema de uma pequena audiência.
- A maioria das empresas de produção (incluindo os produtores) continua a utilizar o gasoduto em 2026.

## Use-o

| Situation | Pick |
|-----------|------|
| 最低延迟语音 companion | Moshi |
| 实时翻译通话 | Hibiki |
| 语音 demo / research | Moshi, CSM |
| 带 tools 的企业 agent | Pipeline (Lesson 12), not Moshi |
| context 中的 custom-voice TTS | Sesame CSM |
| Speech-to-speech，任意语言 | GPT-4o Realtime or Gemini 2.5 Live (commercial) |

## 陷

- **有限的 tool calling。**Moshi é um modelo de diálogo, não um quadro de agentes.
- **特定声音 conditioning。**Moshi usa um único treinamento persona; clonagem de voz é outro único treinamento.
- **语言覆盖。**法语 + 英语 muito bom; outros idiomas limitados。 Hibiki-Zero tem ajuda, mas você ainda precisa de treinamento dados。
- **资源成本。**Uma sessão completa de Moshi ocuparia um espaço de GPU; não é barato para o modelo de depósito de aluguel compartilhado.

## Entrega-o

保存为 `outputs/skill-duplex-pipeline.md` para uma carga de trabalho de um agente de voz   escolher pipeline ou estrutura de duplex completo,并给出理由──

## 练习

1. **Easy。**运行 `code/main.py` Ele será em forma de símbolo simulado de dois fluxos + monólogo interno 架构──
2. **Medium。**Desde HuggingFace 拉取 Moshi,运行服务器,测试一次对话――测量从用户话语结束到 Moshi 开始响应的墙钟延迟――
3. **Hard。**拿你的课12管道代理,在20 条匹配测试陈述 上与莫希比较P50延迟──写出管道──仍然在架构上取胜的情况──

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
- [Sesame (2025). Crossing the uncanny valley of voice](https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice)Especificações do CSM
- [Kyutai — Moshi repo](https://github.com/kyutai-labs/moshi) Instalação + servidor。
- [OpenAI — Realtime API](https://platform.openai.com/docs/guides/realtime) 封闭商业同类──
- [Kyutai — Delayed Streams Modeling](https://github.com/kyutai-labs/delayed-streams-modeling) Estrutura de base STT/TTS.
