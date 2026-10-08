# 构建语音助手 Pipeline  Phase 6 Capstone

> Mettre en place tous les contenus des leçons 01-11... construire un assistant de parole qui écoute, réfléchit, répond à la question... En 2026, c'est déjà un problème d'ingénierie mature, et non pas un problème de recherche, mais les détails intégrés décident s'il peut vraiment sortir en ligne...

**Type:** 构建
**Languages:** Python
**先修要求:**Phase 6 · 04, 05, 06, 07, 11; phase 11 · 09 (appel à la fonction); phase 14 · 01 (loop d'agent)
**Time:** ~120 分钟

##  problématique

Construire un assistant de bout en bout:

1. 捕获麦克风输入 ((16 kHz mono) ⋅
2. 检测用户语音的开始/结束──
3.  pour diffuser 转写。
4. Il sera transcrit à un M.L.L. qui peut être utilisé pour les outils (timer, temps, calendrier).
5. Le texte de l'LLM sera diffusé au TTS.
6. Pour la diffusion audio.
7. Si l'utilisateur est en route pour revenir, alors arrêtez-vous.

目標: dans le CPU de l'ordinateur portable, depuis l'utilisateur, 800 ms, en sortant le premier octet audio TTS. Qualité 目標:不漏词、不在静音时幻觉出字幕、不发生语音克隆 泄漏、不让即时注射成功──

## 概念

![语音助手 pipeline: mic → VAD → STT → LLM+tools → TTS → speaker](../assets/voice-assistant.svg)

### 七个组件

1. **Audio capture。**Mic → 16 kHz mono → 20 ms de morceaux── habituellement utilisé dans Python `sounddevice`, production en milieu de travail utilisation originale AudioUnit/ALSA/WASAPI。
2. **VAD（Lesson 11）。**Silero VAD @ seuil 0,5,min de parole 250 ms, silence pendu 500 ms;; émetteur "début" et "fin" 信号;;
3. **流式 STT（Lesson 4-5）。**Résumé de l'article suivant:
4. **带 tool calling 的 LLM。**GPT-4o / Claude 3.5 / Gemini 2.5 Flash──outils utilisent le schéma JSON──tokens de flux──
5. **Streaming TTS（Lesson 7）。**Kokoro-82M (WEB le plus rapide des ouvertures) ou Cartesia Sonic (WEB le plus rapide des ouvertures de TTS (WEB
6. **Playback。**Le haut-parleur est sorti;
7. **Interruption handler。**Si VAD pendant la lecture de TTS  触发, arrêter la lecture,取消 LLM, redémarrer STT

### Vous rencontrerez les trois modes d'échec

1. **First-word clip。**VAD 启动晚一拍──用户的"hey" 丢失──起始门 用0.3,而不是0.5──
2. **Mid-response interrupt confusion。**Utilisateur: L'équipe de formation continue de produire des programmes de formation professionnelle, en particulier les programmes de formation professionnelle.
3. **Silence hallucination。**Sous-suffisant dans les cadres de chauffage à l'écoute,

### 2026 Produits de référence

| Stack | Latency | License | Notes |
|-------|---------|---------|-------|
| LiveKit + Deepgram + GPT-4o + Cartesia | 350-500 ms | commercial API | 2026 行业默认方案 |
| Pipecat + Whisper-streaming + GPT-4o + Kokoro | 500-800 ms | mostly open | 对 DIY 友好 |
| Moshi (full-duplex) | 200-300 ms | CC-BY 4.0 | Single-model；不同架构，lesson 15 |
| Vapi / Retell (managed) | 300-500 ms | commercial | 最快上线；定制能力有限 |
| Whisper.cpp + llama.cpp + Kokoro-ONNX | offline | open | 隐私 / edge |


```figure
v4-voice-latency
```

## Construction

### 步骤 1: 带 chunking 的 mic capture(pseudocode)

```python
import sounddevice as sd

def mic_stream(chunk_ms=20, sr=16000):
    q = queue.Queue()
    def cb(indata, frames, time, status):
        q.put(indata.copy().flatten())
    with sd.InputStream(channels=1, samplerate=sr, blocksize=int(sr * chunk_ms/1000), callback=cb):
        while True:
            yield q.get()
```

### Étape 2: Retour de capture de la VAD

```python
def capture_turn(stream, vad, pre_roll_ms=300, silence_ms=500):
    buf, pre, triggered = [], collections.deque(maxlen=pre_roll_ms // 20), False
    silent = 0
    for chunk in stream:
        pre.append(chunk)
        if vad(chunk):
            if not triggered:
                buf = list(pre)
                triggered = True
            buf.append(chunk)
            silent = 0
        elif triggered:
            silent += 20
            buf.append(chunk)
            if silent >= silence_ms:
                return b"".join(buf)
```

### 步骤 3: diffusion de la STT → LLM → TTS

```python
async def turn(audio_bytes):
    transcript = await stt.transcribe(audio_bytes)
    async for token in llm.stream(transcript):
        async for audio in tts.stream(token):
            await speaker.play(audio)
```

### 步骤 4: appel à l'outil dans la boucle de LLM

```python
tools = [
    {"name": "get_weather", "parameters": {"location": "string"}},
    {"name": "set_timer", "parameters": {"seconds": "int"}},
]

async for chunk in llm.stream(user_text, tools=tools):
    if chunk.type == "tool_call":
        result = dispatch(chunk.name, chunk.args)
        continue_streaming(result)
    if chunk.type == "text":
        await tts.stream(chunk.text)
```

### 步骤 5: traitement des interruptions

```python
tts_task = asyncio.create_task(tts_loop())
while True:
    chunk = await mic.get()
    if vad(chunk):
        tts_task.cancel()
        await speaker.stop()
        await new_turn()
        break
```

## Utilisation

Regardez !`code/main.py`, dont une simulation fonctionnelle, avec des modèles de stubs 串起全部七组件, donc même sans hardware, vous pouvez également voir pipeline 形态──真实实现中,将 stubs 替换为:

- `silero-vad`(le secteur de l'énergie)`pip install silero-vad`)
- `deepgram-sdk`Ou `openai-whisper`
- `openai`(le secteur de l'énergie)`gpt-4o`) ou `anthropic`
- `kokoro`Ou `cartesia`
- Pour l'entrée / sortie`sounddevice`

## 常见陷

- **永久记录 PII。**Dans la plupart des juridictions, l'audio complet appartient à la PII。 Réservation 30 天,静态加密。
- **没有 barge-in。**Le utilisateur va se casser. Votre assistant doit arrêter de parler.
- **阻塞的 TTS。**Dans le même temps, TTS 会阻塞事件循环── utiliser async ou un seul chemin──
- **没有 tool-call 错误处理。**Les outils seront défaits. L'erreur doit être réceptionnée + réessayer une fois, puis la qualité sera réduite.
- **过度激进的 hallucination filters。**过过度时,助手会反复说" Je ne peux pas m'empêcher de faire ça. ";过不足时,它什么都敢说──用持久的设置校准──
- **没有 wake-word 选项。**Toujours écouter est un secret.

## 交付

保存为 `outputs/skill-voice-assistant-architect.md` un budget + une échelle + un langage + des contraintes de conformité, une série complète de spécifications sont émises.

## 练习

1. **Easy。**运行  référencement`code/main.py`Il utilise des modules de stub pour simuler un tour complet de bout en bout, et imprimer chaque phase de latence.
2. **Medium。**Avec des pré-enregistrements `.wav`上的真实 Whisper modèle 替换STT stub──测量 WER 和端到端延迟──
3. **Hard。**添加 appeler à l' outil:实现 `get_weather`(API) et `set_timer` Faire passer les outils 路由,并验证 Lorsque l'utilisateur dit "configure un temporiseur de 5 minutes" 时, correct function will触发,且语音回复会确认──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Turn | 用户 + 助手的一次往返 | 一个由 VAD 界定的用户语音 + 一个 LLM-TTS 回复。 |
| Barge-in | 打断 | 用户在助手说话时开口；助手停止。 |
| Wake word | "Hey assistant" | 短关键词检测器；Porcupine、Snowboy、openWakeWord。 |
| End-pointing | Turn 结束 | VAD + min-silence 决策，用于判断用户已经说完。 |
| Pre-roll | 语音前缓冲 | 保留 VAD 触发前 200-400 ms 的 audio，以避免 first-word clip。 |
| Tool call | 函数调用 | LLM 发出 JSON；runtime dispatch；result 回填到 loop 中。 |

## 延伸阅读

- [LiveKit — 语音 agent quickstart](https://docs.livekit.io/agents/)  生产级参考。
- [Pipecat — 语音 agent examples](https://github.com/pipecat-ai/pipecat) Pour faire du bricolage, un cadre amicaux.
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) gestion de la voix natif 路径。
- [Kyutai Moshi](https://github.com/kyutai-labs/moshi) double double-ensemble 参考(leçon 15)
- [Porcupine wake-word](https://picovoice.ai/products/porcupine/)- Je suis en train de vous dire.
- [Anthropic — tool use guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) Appel à la fonction de LLM
