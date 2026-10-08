# Agentes de voz: Pipecat y LiveKit

> Los agentes de voz son una clase de producción de clase uno de 2026 años. Pipecat ofrece un pipeline basado en Python.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- 描述 Pipecat 基于frame 的管道:DOWNSTREAM(source→sink) y UPSTREAM(control)。
- Explicar las etapas de la línea de voz estándar, así como los transportes que Pipecat apoya.
- 解释 LiveKit Agents' dos clases de agentes de voz (MultimodalAgent, VoicePipelineAgent) y sus respectivos escenarios de uso adecuado.
- 总结 2026年生产环境的延迟预期, así como cómo estas expectativas impulsan la selección de la estructura

##  problemas
Los agentes de voz no son un circuito de texto extrañado de TTS. El presupuesto de retraso es muy exigente.

## 概念
### El producto se clasifica en el anexo II del Reglamento (UE) n.o 1069/2013.

- basado en el marco de la tubería de Python 
- `Frame`¿ Qué es esto ?`FrameProcessor`cadena
-  Dos direcciones de flujo:
  - **DOWNSTREAM** fuente → sink(audio en, TTS fuera)
  - **UPSTREAM** retroalimentación y control  cancelación  métricas  embarque)
- `PipelineTask` A través de los eventos(`on_pipeline_started`¿Qué es esto?`on_pipeline_finished`¿Qué es esto?`on_idle_timeout`) y para los observadores de métricas/trazaje/RTVI  gestión del ciclo de vida―

Tipico de tuberías:

```
VAD (Silero) → STT → LLM (context alternates user/assistant) → TTS → transport
```

Transporte:Diario,Kit en vivo,SmallWebRTCTransport,FastAPI,WebSocket,WhatsApp,

Pipecat Fluxes  aumentar las conversaciones estructuradas (máquinas de estado) ――Pipecat Cloud es un sistema de gestión del tiempo de ejecución。

### Los agentes de LiveKit (livekit/agentes)

- A través de WebRTC se conectarán los modelos de IA  a los usuarios 
- 核心概念:`Agent`¿Qué es esto?`AgentSession`¿Qué es esto?`entrypoint`¿Qué es esto?`AgentServer`¿Qué es eso?
-  Dos clases de agentes de voz:
  - **MultimodalAgent**                                                                                                                                                                                                                                                              
  - **VoicePipelineAgent** STT → LLM → TTS cascada; proporcionar control a nivel de texto。
- A través del modelo Transformer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
- Origin生 MCP 集成──
-  Por SIP 支持电话──
- A través de LiveKit Inference  ofrece más de 50 modelos, sin necesidad de claves API; A través de plugins  también puede conectarse a más de 200 modelos

### Plataformas comerciales

Vapi(optimización posterior de la alta tecnología about ~450600ms) y Retell(180 veces test de llamada de medio término hasta medio término ~600ms) construido en estos programas.

### Este modo es fácil de salir mal donde

- **没有 barge-in handling。**En Pipecat se necesitan marcos UPSTREAM para cancelar, en LiveKit se necesitan mecanismos de comparación de precios.
- **忽略 STT confidence。**低信心转录被当成事实送入 LLM──应基于信心做门,或请求确认──
- **TTS mid-sentence cutoff。**Cuando el tubo en una frase en medio de su eliminación, TTS necesita saber esto, o debe cortar el audio.
- **忽略 latency budget。**Cada componente aumenta 50 200ms.

### Las latencias típicas para 2026

- VAD: 20 60 ms
- TPS parcial: 100  250 ms
- LLM 首个 Token: 150  400ms
- TTS primer audio: 100  200 ms
- RTT de transporte: 3080 ms

端到端 450600ms 属于高级体验──8001200ms 很常见──任何> 1500ms 的体验都会感觉已经坏了──


```figure
voice-pipeline
```

## Construirlo
`code/main.py`Es un tubo de juguete basado en el marco, que contiene:

- `Frame`tipos de audio, transcripción, texto, control)
- ¿ Qué ?`process(frame)`de la `Processor`Interfaz
- Una pipeline de cinco fases (VAD → STT → LLM → TTS → transporte), en los procesadores scripted ⋅
- Un marco de cancelación de UPSTREAM, para mostrar el barge-in.

¿Qué es eso ?

```
python3 code/main.py
```

Trace 会 mostrar el flujo normal, así como una vez que TTS en el discurso de interrumpir la barcaza en cancelación.

## Usalo
- **Pipecat**Con el control total de los procesadores personalizados de Python-first, los proveedores de alta capacidad.
- **LiveKit Agents**Utilizado para el primer despliegue de WebRTC y la telefonía.
- **Vapi / Retell**Utilizado por agentes de voz alojados sin equipo WebRTC.
- **OpenAI Realtime / Gemini Live**Usado para audio directo / audio-salida (MultimodalAgent)

##  entregarlo
`outputs/skill-voice-pipeline.md`搭建一个Pipecat 形态的语音管道 脚手架, incluye VAD + STT + LLM + TTS + transporte, así como manejo de embarque en la barcaza―

##  ejercicios
1. Dá tu tubería de juguetes  Añadir métricas observador: estadística de cada etapa cada segundo de marcos Número ∼ retraso en dónde acumula?
2. 实现 STT con puertas de confianza: bajo于值时, request¿puedes repetir eso?
3. 添加语义转检:简单规则  如果转录以 "?" 结尾,则视为转的结尾──
4. 阅读 Pipecat's transport docs──把 stdlib transport 替换为 SmallWebRTCTransport config(stub)。
5. En la misma consulta, ¿cuánto tardan en costar el control a nivel de texto?

## 关键术语: "El hombre es un hombre"
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
- [LiveKit Agents docs](https://docs.livekit.io/agents/) WebRTC + primitiva de voz
- [Vapi](https://vapi.ai/) Plataforma de voz gestionada
- [Retell AI](https://www.retellai.com/) voz gestionada,marcado con una referencia de latencia
