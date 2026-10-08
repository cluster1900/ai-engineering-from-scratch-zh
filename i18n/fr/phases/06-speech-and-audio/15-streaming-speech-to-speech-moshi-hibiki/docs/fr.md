# Diffusion en continu de discours à discours  Moshi、Hibiki avec dialogue à double sens

> En 2024, le projet de loi de la société de communication (MOSHI) a été publié en 2026, et il a été publié en 2024, en 2024, en 2026, en 2024, en 2024, en 2026, en 2024, en 2024, en 2024, en 2026, en 2024, en 2024, en 2026, en 2024, en 2024, en 2024, en 2024, en 2024, en 2026, en 2024, en 2024, en 2024, en 2024, en 2024, en 2024, en 2026, en 2024, en 2024, en 2024, en 2024, en 2026, en 2024, en 2024, en 2024, en 2024, en 2024, en 2026, en 2024, en 2024, en 2024, en 2024, en 2024, en 2024, en 2024, en 2024, en 2024, en 2024, en 2024, en 2024, en 2024, en 2024, en 2024, en 2024, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2025, en 2023, en 2025, en 2023, en 2023, en 2023, en 2023, en 2023, en 2023, en 2023, en 2023, en 2023,

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 13 (Neural Audio Codecs), Phase 6 · 11 (Real-Time Audio), Phase 7 · 05 (Full Transformer)
**Time:** ~75 分钟

##  problématique

Chaque agent de voix construit sur la base de la leçon 11 + 12 a une limite de retard de base, d'environ 300 à 500 ms: VAD 触发, STT 处理, LLM 推理, TTS 生成── chaque étape a sa propre limite de retard── vous pouvez ajuster et faire la même ligne, mais la forme du pipeline est limitée par la limite supérieure──

Moshi [Kyutai, 2024-2026) pose une question différente: si le modèle reçoit directement des émissions et les émet, continuellement, alors que le texte n'est qu'un monologue interne intermédiaire, pas une phase nécessaire, comment ?

La réponse est:**full-duplex speech-to-speech**△ théorique retard de 160 ms(80 ms Mimi cadre + 80 ms retard acoustique) ・ dans le seul L4 GPU de la surface de la réalité retard de 200 ms― c'est le pipeline de haut niveau 语音代理 能达到延迟的一半──

## 核心概念

![Moshi architecture: two parallel Mimi streams + inner-monologue text](../assets/moshi-hibiki.svg)

### Architcture de Moshi

**输入。**两条 Mimi codec stream, moyenne de 12,5 Hz × 8 livres de code:

- Résumé: Le groupe de télévision a été créé en 2008
- Résumé: Moshi 自己的音频

**Transformer。**Un transformateur temporel à paramètre 7B, avec traitement simultané de deux flux et un texte interne monologue flux.

1. 消耗最新用户 Mimi Token ((8 个代码簿) ⋅
2. 消耗最近的Moshi Mimi Token(8 个代码簿, selon les résultats de la production)
3. 生成下一个 Moshi 文本 Token(monologue interne)
4. Il est aussi un petit transformateur de profondeur.

Moshi peut être entendu en parlant avec l'utilisateur; peut être interrompu en utilisateur; peut être retransmis en arrière-channel (mhm) sans se séparer principal话语──

**Depth Transformer。**Dans un cadre, 8 codebooks ne sont pas prédits, ils existent dans un codebook 间依赖── un petit transformateur à 2 couches depth transformator 会在80 ms 内按顺序预测它们──这是AR codec LM's standard breakdown方式(VALL-E、VibeVoice也使用)──

### Pourquoi le texte monologue interne aide

Si le texte est clair, le modèle doit être dans le flux acoustique. Le modèle doit être dans le flux acoustique. Le modèle doit être en ligne avec le texte.

### Hibiki:translation en continu de la langue à la langue

La même structure, utilisant la traduction pour entraîner. Source langage audio.

Première prise en charge de quatre langues; peut être utilisé environ 1000 heures de données pour s'adapter à la nouvelle langue.

### La pile de Kyutai est plus large que la pile de Kyutai.

- **Moshi** dialogue à double sens (French: français prioritaire, français: support positif)
- **Hibiki / Hibiki-Zero** traduction simultanée du langage
- **Kyutai STT** streaming ASR ((500 ms ou 2,5 s regardant vers l'avant)
- **Kyutai Pocket TTS** 100M-param TTS 可在CPU 上运行(2026 年 1 月)
- **Unmute** Rassembler ces capacités sur les serveurs publics

L40S GPU 上的吞吐量:64 个并发 session, 3x en temps réel

### CSM de sésame  近亲

Sesame CSM (en 2025) utilise une pensée similaire, une colonne vertébrale de la tête de codec Llama-3 de Mimi. Mais le CSM est un simple processus de réception de contexte + texte, génération de la parole), et non pas un double-tête.

### Numéros de performance 2026

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

## - Je le construis.

### 步骤 1: interface

Moshi expose un serveur WebSocket, reçoit un morceau audio codé Mimi de 80 ms, et retourne un morceau audio codé Mimi de 80 ms.

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

### 步骤 2: boucle à double double

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

Les futures de Python sont des méthodes de transmission standard.

### 步骤 3:objectif de formation

 Pour chaque cadre de 80 ms `t`- Le numéro de la liste:

- - Les données de saisie:`user_mimi[0..t]`- Je suis là.`moshi_mimi[0..t-1]`- Je suis là.`moshi_text[0..t-1]`
- Prédit:`moshi_text[t]`, puis c' est`moshi_mimi[t, codebook_0..7]`

文本先于音频预测(monologue interne);音频在深度变压器 内按代码簿 顺序预测。

### Étape 4: Moshi gagne où, perd où

Moshi gagne dans:

- Dans les appareils de qualité, la mise en œuvre est inférieure à 250 ms de retard de fin à fin.
- La nature du canal arrière et la rupture.
- Il n'y a pas besoin de code de colle pour pipeline.

Moshi ne sait pas faire:

- Il n'y a pas de formation pour cela; vous avez besoin d'un chemin de LLM unique)
- 长推理(Moshi est un modèle de dialogue 8B 左右, pas Claude/GPT-4)。
- La réalité du sujet.
- La plupart des entreprises de production utilisent des pipelines en 2026.

## Utilisez-le

| Situation | Pick |
|-----------|------|
| 最低延迟语音 companion | Moshi |
| 实时翻译通话 | Hibiki |
| 语音 demo / research | Moshi, CSM |
| 带 tools 的企业 agent | Pipeline (Lesson 12), not Moshi |
| context 中的 custom-voice TTS | Sesame CSM |
| Speech-to-speech，任意语言 | GPT-4o Realtime or Gemini 2.5 Live (commercial) |

## La trappe

- **有限的 tool calling。**Moshi est un modèle de dialogue, pas un cadre d'agent.
- **特定声音 conditioning。**Moshi utilise une seule personne entraînée; la clonage vocale est une autre formation individuelle.
- **语言覆盖。**Français + Anglais très bon; autres langues limitées. Hibiki-Zero a de l'aide, mais vous avez encore besoin de formation.
- **资源成本。**Une session complète de Moshi occuperait une fente GPU; pas un mode de déploiement partagé-locataire bon marché.

## Je le livre.

保存为 `outputs/skill-duplex-pipeline.md` Pour une charge de travail d'agent de voix  选择 pipeline ou architecture à double emploi,并给出理由──

## 练习

1. **Easy。**运行  référencement`code/main.py`Il est en mode symbolique, il est en double courant + monologue interne.
2. **Medium。**Depuis HuggingFace 拉取 Moshi,运行服务器,测试一次对话──测量从用户话语结束到 Moshi 开始响应的墙钟延迟──
3. **Hard。**拿你的课 12管道代理,在20 条匹配测试语句 上与莫希比较P50延迟──写出管道──仍然在架构上取胜的情况──

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
- [Sesame (2025). Crossing the uncanny valley of voice](https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice) Spécifications du MCS
- [Kyutai — Moshi repo](https://github.com/kyutai-labs/moshi) Installation + serveur。
- [OpenAI — Realtime API](https://platform.openai.com/docs/guides/realtime) 封闭商业同类──
- [Kyutai — Delayed Streams Modeling](https://github.com/kyutai-labs/delayed-streams-modeling)  Cadre de base STT/TTS
