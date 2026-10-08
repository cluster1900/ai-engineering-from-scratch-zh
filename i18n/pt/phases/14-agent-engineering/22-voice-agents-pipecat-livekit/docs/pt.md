# Agentes de voz: Pipecat e LiveKit

> Os agentes de voz são uma classe de produção de 2026 ano. Pipecat fornece um pipeline baseado em Python framework.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- 描述 Pipecat 基于 frame 的管道:DOWNSTREAM(source→sink)和UPSTREAM(control)。
- Explicar os estágios de canalização de voz, bem como os transportes que o Pipecat suporta.
- 解释 LiveKit Agents's two voice agent classes (MultimodalAgent, VoicePipelineAgent) e seus respectivos cenários de uso adequado.
- 总结 2026年生产环境的延迟预期, bem como como como estas expectativas impulsionam a selecção de construções.

## 问题
Os agentes de voz não são um loop de texto de TTS. O orçamento é muito rigoroso. O áudio parcial é uma condição padrão. A detecção de viragem é um modelo.

## 概念
### Pipecat (pipecat-ai/pipecat)

- Baseado em Python framework.
- `Frame`→ `FrameProcessor`cadeia
-  Dois direcções de fluxo:
  - **DOWNSTREAM** fonte → sink(áudio dentro, TTS fora)。
  - **UPSTREAM** feedback 和 control (cancelamento, métricas, embarque)
- `PipelineTask` através de eventos(`on_pipeline_started`- Não.`on_pipeline_finished`- Não.`on_idle_timeout`) e para os observadores de métricas/ rastreamento/RTVI  gestão do ciclo de vida¬

Tipo de oleoduto:

```
VAD (Silero) → STT → LLM (context alternates user/assistant) → TTS → transport
```

Transporte:Diário, LiveKit, SmallWebRTCTransport, FastAPI, WebSocket, WhatsApp,

Pipecat Fluxes  aumentar conversas estruturadas (máquinas de estado)。Pipecat Cloud é gerenciado tempo de execução。

### Agentes do LiveKit (livekit/agentes)

-  através do WebRTC                                                                                                                                                                                                                                                            
- 核心概念:`Agent`- Não.`AgentSession`- Não.`entrypoint`- Não.`AgentServer`- Não.
-  duas classes de agentes de voz:
  - **MultimodalAgent**  através de OpenAI Programa de tratamento direto de áudio em tempo real ou similar.
  - **VoicePipelineAgent** STT → LLM → TTS cascata; proporcionar controlo a nível de texto。
-  através do modelo Transformer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
- Orig生 MCP 集成──
- 通過SIP 支持電話──
-  através de LiveKit Inference  fornecer 50+ modelos, sem necessidade de chaves API; através de plugins  também pode conectar 200+ modelos 

### Plataformas comerciais

Vapi(optimização posterior de alta tecnologiacerca de ~450600ms) e Retell(180 vezes teste de chamada de meio-termo até ao fim ~600ms) construído sobre esses programas.

### Este é um lugar fácil de sair

- **没有 barge-in handling。**Us户打断;agent 继续说话──在Pipecat 中需要UPSTREAM cancel frames,LiveKit 中需要等价机制──
- **忽略 STT confidence。**Transcrições de baixa confiança foram transferidas para o LLM.
- **TTS mid-sentence cutoff。**Quando o pipeline está no meio do caminho, o TTS precisa saber disso, ou então deve cortar o áudio.
- **忽略 latency budget。**Cada componente aumenta 50200ms── para cima da linha anterior para cima da cadeia completa.

### Tópicas latências de 2026

- VAD: 2060ms
- Teste de tempo parcial: 100250ms
- LLM 首个 Token: 150400ms
- TTS primeiro áudio: 100200ms
- RTT de transporte: 3080ms

端到端 450600ms 属于高级体验──8001200ms 很常见──任何> 1500ms 的体验都会感觉已经坏了──


```figure
voice-pipeline
```

## Construí-lo
`code/main.py`É um tubo de brinquedos baseado em quadro, contendo:

- `Frame`tipos(áudio、transcrição、texto、tts_audio、controle)
- - Não .`process(frame)`de `Processor`Interface
- Uma pipeline de cinco fases (VAD → STT → LLM → TTS → transporte), em processadores de script ⋅
- Uma câmara de cancelamento UPSTREAM, para mostrar o barge-in.

- Não .

```
python3 code/main.py
```

Trace 会 demonstrar o fluxo normal, bem como uma vez fazer TTS em conversa interromper a barge-in cancelar.

## Use-o
- **Pipecat**Utilizando o controle total de processadores personalizados, Python-first, fornecedores de alta resolução.
- **LiveKit Agents**Utilizado para WebRTC-primeiros desdobramentos e telefonia.
- **Vapi / Retell**Utilizado por agentes de voz hospedados sem a equipe WebRTC.
- **OpenAI Realtime / Gemini Live**Usado para audio-in/audio-out direto (MultimodalAgent)

## Entrega-o
`outputs/skill-voice-pipeline.md`Construir um pipeline de voz de Pipecat 形态 脚手架, incluindo transporte VAD + STT + LLM + TTS + bem como o transporte de embarcações.

## 练习
1. Dê-lhe o seu pipeline de brinquedos  Adicionar métricas observador: Estatística cada etapa Cada segundo de quadros Número ⋅ atraso em que acumulação?
2. 实现 confidence-gated STT:低于值时, request Você poderia repetir isso?
3. 添加语义转检测:简单规则  如果转录 以 "?" 结尾,则视为转末──
4. 阅读 Pipecat's transport docs──把 stdlib transport 替换为 SmallWebRTCTransport config(stub)。
5. Em mesma consulta, a OpenAI em tempo real e a cascata STT+LLM+TTS foram avaliadas.

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
- [LiveKit Agents docs](https://docs.livekit.io/agents/) WebRTC + primitivos de voz
- [Vapi](https://vapi.ai/) Plataforma de voz gerenciada
- [Retell AI](https://www.retellai.com/) voz gerenciada,marcado em latência
