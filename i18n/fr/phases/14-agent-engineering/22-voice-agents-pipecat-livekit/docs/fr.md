# Les agents de voix: Pipecat et LiveKit

> Les agents de voix sont une classe de production de 2026 en ligne. Pipecat fournit un pipeline basé sur le cadre Python.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~60 minutes

## Objectif de l'apprentissage
- 描述 Pipecat 基于frame 的管道:DOWNSTREAM(source→sink)和UPSTREAM(contrôle)。
- Il faut savoir quelles sont les étapes de la conduite vocale standard, ainsi que les transports de Pipecat.
- Expliquer les deux classes d'agents de voix de LiveKit (MultimodalAgent, VoicePipelineAgent) ainsi que leurs scénarios de mise en œuvre appropriés.
- 总结 2026 années de production environments de retard prévue, ainsi que ces prévisions comment conduire la sélection de l'architecture

##  problématique
Les agents de voix ne sont pas une boucle de texte extra-attachée au TTS. Le budget est très strict.

## 概念
### Le piquet (piquet-ai/piquet)

- 基于 Python framework du cadre de pipeline 
- `Frame`- Je suis là.`FrameProcessor`chaîne
- ∆ Deux directions de débit:
  - **DOWNSTREAM** source → sink(audio en, TTS hors)
  - **UPSTREAM** feedback 和 control annulation 、métres 、barge-in)
- `PipelineTask` À travers les événements`on_pipeline_started`- Je suis là.`on_pipeline_finished`- Je suis là.`on_idle_timeout`) ainsi que pour les observateurs de métriques/traçage/RTVI administration du cycle de vie―

typical pipeline:

```
VAD (Silero) → STT → LLM (context alternates user/assistant) → TTS → transport
```

Les transports: quotidiens, liveKit, petit réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social, réseau social.

Pipecat Flow  augmenter les conversations structurées (machines d'état)。Pipecat Cloud est un système de gestion de temps de fonctionnement。

### Les agents de LiveKit (livekit/agents)

- À travers WebRTC, les modèles d'IA seront connectés aux utilisateurs 
- 核心概念:`Agent`- Je suis là.`AgentSession`- Je suis là.`entrypoint`- Je suis là.`AgentServer`Il y a une autre.
- ∆ Deux classes d'agents de voix:
  - **MultimodalAgent**                                                                                                                                                                                                                                                              
  - **VoicePipelineAgent** STT → LLM → TTS cascade; fournir un contrôle au niveau du texte。
- À travers le modèle Transformer  réaliser la détection sémantique du tour.
- Orig生 MCP 集成──
- 通过SIP 支持电话──
- À travers LiveKit Inference  fournir 50+ modèles, sans besoin de clés API; via des plugins 還可接入 200+ 更多的模型──

### Plateformes commerciales

Vapi(optimisation post-technologie avancée approximativement ~450600ms) et Retell(180 fois test de la téléphonie intermédiaire à la fin d'environ ~600ms) construit sur ces programmes.

### Cette façon est facile à trouver

- **没有 barge-in handling。**Utilisateur: Arrêtez, agent: Continuez à parler:
- **忽略 STT confidence。**Les transcriptions de faible confiance sont envoyées dans le cadre de la formation professionnelle.
- **TTS mid-sentence cutoff。**Quand le pipeline est en train de disparaître, TTS doit le savoir, sinon il faut couper l'audio.
- **忽略 latency budget。**Chaque composant augmente de 50 à 200 ms.

### La latence typique en 2026

- VAD: 20 à 60 ms
- TST partiel: 100 à 250 ms
- LLM 首个 Token: 150 à 400 ms
- TTS première audio: 100 à 200 ms
- RTT de transport: 3080ms

端到端 450600ms 属于高级体验──8001200ms 很常见──任何> 1500ms 经验都会感觉已经坏──


```figure
voice-pipeline
```

## - Je le construis.
`code/main.py`Il s'agit d'un pipeline de jouets basé sur le cadre, comprenant:

- `Frame`types de type (audio, transcription, texte, tts, contrôle)
- Avec`process(frame)``Processor`Interface
- Un pipeline de cinq étapes (VAD → STT → LLM → TTS → transport), réalisé avec des processeurs scriptés ⋅
- Un cadre UPSTREAM pour démontrer le barge-in.

Je vais le faire.

```
python3 code/main.py
```

La trace montrera le flux normal, ainsi qu'une fois que TTS a annulé le barge-in en cours de route.

## Utilisez-le
- **Pipecat**Utilisé pour contrôler complètement les processeurs personnalisés, les fournisseurs de Python-first,
- **LiveKit Agents**Utilisé pour les premiers déploiements WebRTC et téléphonie.
- **Vapi / Retell**Utilisé par des agents de voix hébergés sans équipe WebRTC.
- **OpenAI Realtime / Gemini Live**Utilisé pour l'audio-en / audio-out direct

## Je le livre.
`outputs/skill-voice-pipeline.md`Construire un pipeline vocal de Pipecat 形态 脚手架, comprenant le transport VAD + STT + LLM + TTS + ainsi que la gestion de la barge-in

## 练习
1.  donner votre pipeline de jouets  ajouter des métriques observateur: statistique de chaque étape Chaque seconde de cadres Numéro ⋅ retard dans où accumuler?
2. 实现 confidence-gated STT:低于值时, requestpourriez-vous le répéter?
3. 添加语义转检:简单规则  如果转录 以 "?" 结尾,则视为转的结尾──
4. 阅读 Pipecat's transport docs──把 stdlib transport 替换为 SmallWebRTCTransport config(stub)。
5. Dans la même requête, la mesure de l'OpenAI en temps réel avec la cascade STT+LLM+TTS, le contrôle au niveau du texte, a-t-il entraîné des retards ?

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
- [LiveKit Agents docs](https://docs.livekit.io/agents/) WebRTC + voix primitives
- [Vapi](https://vapi.ai/) plateforme vocale gérée
- [Retell AI](https://www.retellai.com/) voix gérée,marqué par la latence
