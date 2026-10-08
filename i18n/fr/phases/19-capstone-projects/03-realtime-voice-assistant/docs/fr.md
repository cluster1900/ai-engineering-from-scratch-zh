# Capstone 03  实时语音 Assistant(ASR à LLM à TTS)

> Un agent de voix naturel a besoin d'un délai de communication inférieur à 800 ms, sait quand arrêter de parler, peut traiter la barge-in, et peut également utiliser des outils sans interruption. Retourner, Vapi, LiveKit Agents et Pipecat atteignent ce niveau en 2026: ils adoptent le même format: streaming ASR, détecteur de tours, LLM et streaming TTS, tout en passant par WebRTC connexion, et en mettant en place un budget de retard actif à chaque saut.

**Type:** Capstone
**Languages:** Python（agent + pipeline）、TypeScript（web client）
**Prerequisites:** Phase 6（speech and audio）、Phase 7（transformers）、Phase 11（LLM engineering）、Phase 13（tools）、Phase 14（agents）、Phase 17（infrastructure）
**Phases exercised:**P6 · P7 · P11 · P13 · P14 · P17
**Time:** 30 小时

##  problématique

语音一直是 2025-2026年发展最快的AI UX 类别──技术上限每季都在下降──OpenAI Realtime API、Gemini 2.5 Live、Cartesia Sonic-2、ElevenLabs Flash v3、LiveKit Agents 1.0 和 Pipecat 0.0.70 让低于800ms 的首次音频出发 变得可实现──标准不只是延迟──它是交互感:不断断用户,不被用户断断,能从句中断中恢复,在对话中调用工具而不让音频停,并能承受动态移动网络──

Vous ne pouvez pas passer par le même schéma trois REST 调用 pour le faire. L'architecture doit être du bout au bout en streaming en pipeline. Après la construction, le mode de défaillance deviendra visible: pour le téléphone VAD de la téléphonie, le détecteur de tournage attend un signal qui n'apparaîtra jamais, TTS en sortie avant de se décharger 400ms.

## 概念

Le pipeline a cinq étapes de streaming:**audio in**(Voir le site WebRTC du navigateur ou du réseau social PSTN)**ASR**(De Deepgram Nova-3 ou des transcriptions partielles en continu de plus rapide)**turn detection**(VAD plus reading partielles transcriptions à la façon de juger de la façon de réaliser le modèle de détecteur de tour de petit)**LLM**(une fois que le jugement est terminé, commencez à diffuser des jetons)**TTS**(en premier LLM Token  Après environ 200ms, j'ai commencé à diffuser l'audio)

Il y a trois points de préoccupation.**Barge-in**: lorsque l'utilisateur parle à l'agent, TTS va le supprimer, ASR prend immédiatement la parole.**Tool use**: dialogue middleway's function calls ((weather、calendar) doit être sur le canal latéral, ne peut pas faire arrêter le son; si le délai dépasse 300ms, l'agent 会预先填充一个确认代币 (("une seconde...")。**Backpressure**: dans la perte de paquets, les transcriptions partielles seront conservées, VAD  augmenter la valeur de la porte de parole, agent  éviter de continuer à parler sur les messages non confirmés.

Le taux de débit de la communication est de 0,50 à 0,50 ms. Le taux d'erreur de débit de la communication est de 0,50 à 0,50 ms.

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

- Transport:LiveKit Agents 1.0(WebRTC)加 Twilio PSTN gateway;Pipecat 0.0.70  comme cadre de réserves
- ASR:Deepgram Nova-3(référencement, inférieur à 300ms de la première partie) ou autotouffage de chuchotement plus rapide Whisper-v3-turbo
- VAD:Silero VAD v5 plus détecteur de tour LiveKit (en anglais seulement)
- LLM: utilisé pour une étroite intégration d'OpenAI GPT-4o en temps réel, Gemini 2.5 Flash Live, ou classe associée Claude Haiku 4.5
- TTS:Cartesia Sonic-2 ((minimum first-byte) ≈ElevenLabs Flash v3, ou pour être utilisé comme source ouverte de l'auto-administration Orpheus
- Outils: pour la météo/calendrier/réservation du canal côté FastMCP; si l'outil prend >300ms, agent  pré-déploiement de remplissage
- Observabilité:OpenTelemetry spans de voix 带 audio de la voix Langfuse
- Déploiement:单台 g5.xlarge(24GB VRAM) pour l'auto-administration Whisper + Orpheus; APIs de gestion pour le délai minimum


```figure
ce-voice-latency
```

## - Je le construis.

1. **WebRTC session。**Initier une salle LiveKit et un client Web pour le microphone audio en streaming ⋅ sur le serveur, ajouter un agent de la salle ⋅

2. **ASR streaming。**Pour les images PCM de 20 ms, les images sont envoyées à Deepgram Nova-3 ou GPU (en haut) et sont enregistrées en temps réel.

3. **VAD and turn detector。**Dans le cadre du flux, utilisez le dernier texte partiel du détecteur de tour LiveKit. Seulement lorsque le détecteur de tour VAD exprime la silence de 500 ms et que le détecteur de tour est terminé, le nombre de participants est supérieur à 0,6 heures.

4. **LLM stream。**Dans le tour complet, utilisez la conversation en cours, avec la transcription finale, lancez l'appel LLM, jetons de flux, premier jeton, livrez à TTS.

5. **TTS stream。**Cartesia Sonic-2 va diffuser des morceaux audio en streaming. La première pièce doit être envoyée à la salle LiveKit. Le client via le tampon de jitter WebRTC.

6. **Barge-in。**Lorsque VAD a testé un nouveau langage utilisateur pendant la diffusion de TTS, il annule immédiatement le flux TTS, abandonne le résidu de la production de LLM et redémarre ASR.`tts_canceled`La durée de la durée

7. **Tool side channel。**Pour les outils d'appel à la fonction, vous pouvez utiliser le calendrier et l'appel à l'appel. Si 300ms ne sont pas retournés, laissez le programme de formation émettre "une seconde, laissez-moi vérifier" comme outil de remplissage.

8. **Eval harness。**录制 100 次通话──计算 WER(对照 held out transcript) ‧误截断率(user句子中途时 TTS被取消) ‧第一音频出发 p50、TTS MOS(human或NISQA),以及 jitter-loss test(丢失 3% des paquets) ‧

9. **Load test。**Utilisation d'appelant synthétique dans un seul g5.xlarge 上驱动 50 路并发通话――测量持续首音出 p95──

## Utilisez-le

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

## Je le livre.

`outputs/skill-voice-agent.md`Il est livré à un domaine, il démarre un agent LiveKit et modifie le pipeline ASR/VAD/LLM/TTS.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | 端到端延迟 | 100 次已录制通话中的 p50 first-audio-out 低于 800ms |
| 20 | Turn-taking 质量 | Hamming VAD benchmark 上误截断率低于 3% |
| 20 | Tool-use 正确性 | 对话中途 tool calls 返回正确数据且不让音频停顿 |
| 20 | packet loss 下的可靠性 | 注入 3% packet drop 时的 WER 和 turn-taking 稳定性 |
| 15 | Eval harness 完整性 | 带 public config 的可复现实验测量 |
| **100** | | |

## 练习

1. Pour le traitement de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de la détection de détection de la détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de détection de déte

2. 添加中断-arbitration 策略:当用户在工具调用期间 时,agent 怎么做?

3. 运行逆境转检测器测试:让用户在句子中途长时间停顿――调优 VAD silence threshold 和 turn-detector score threshold,在不超过900ms的前提下实现最小误截点――

4. 通过 Twilio 将同一个代理 部署到PSTN──比较PSTN首发音频与WebRTC──解释 jitter-buffer 和代码差异──

5. Pour le Japon, l'espagnol est un moyen de détection de l'activité vocale.

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

- [LiveKit Agents 1.0](https://github.com/livekit/agents) 参考 cadre d'agents WebRTC
- [Pipecat](https://github.com/pipecat-ai/pipecat) 备用 Python-first streaming agent cadre
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) 集成语音模型的参考
- [Deepgram Nova-3 documentation](https://developers.deepgram.com/docs) streaming ASR 参考
- [Silero VAD v5](https://github.com/snakers4/silero-vad) Modèle de référence du VAD
- [Cartesia Sonic-2](https://docs.cartesia.ai) 低延迟 TTS 参考
- [Retell AI architecture](https://docs.retellai.com) Agent de production de voix 架构
- [Vapi.ai production stack](https://docs.vapi.ai) 备用生产级参考
