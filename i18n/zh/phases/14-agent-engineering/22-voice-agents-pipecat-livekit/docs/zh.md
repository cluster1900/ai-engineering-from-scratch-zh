# 语音代理:皮皮卡和LiveKit

> 语音代理是2026年的一类一等生产类别. 皮卡特提供基于Python框架的管道.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~60 minutes

## 学习目标
- 描述皮皮卡特 基于框架的管道:DOWNSTREAM(来源→沉没) 和UPSTREAM(控制)
- 描述标准语音管道阶段以及皮皮卡特支持哪些运输.
- 解释LiveKit代理的两个语音代理类 (多模特代理,语音管线代理) 以及各自的适用场景.
- 总结 2026年生产环境延迟预期以及这些预期如何推动结构选择

## 问题
语音代理 不是一个外挂的TTS文本循环――延迟预算非常严格 ((~600ms),部分音频是默认情况,转向检测本身就是一个模型,而运输从电话SIP到WebRTC的范围――你要么构建一个基于框架的管道――皮佩卡特),要么依赖一个平台――直播Kit.

## 概念
### 皮皮卡特 (pipecat-ai/pipecat)

- 基于Python框架的管道框架.
- `Frame`其他`FrameProcessor`链链
- 两个流程方向:
  - **DOWNSTREAM**源 →沉,TTS出炉)
  - **UPSTREAM**反和控制(取消,计量,登船)
- `PipelineTask`通过事件`on_pipeline_started`,我知道.`on_pipeline_finished`,我知道.`on_idle_timeout`) 以及用于测量/追踪/RTVI的观察者管理生命周期──

典型的管道:

```
VAD (Silero) → STT → LLM (context alternates user/assistant) → TTS → transport
```

运输:每日,LiveKit,SmallWebRTC运输,FastAPI,WebSocket,WhatsApp.

果流量 增加结构化对话 (状态机) 果云是管理运行时间.

### 现场服务代理 (livekit/agents)

- 通过WebRTC将AI模型连接到用户.
- 核心概念:`Agent`,我知道.`AgentSession`,我知道.`entrypoint`,我知道.`AgentServer`,我知道.
- 两个语音代理类:
  - **MultimodalAgent** 通过OpenAI实时或等价方案直接处理音频──
  - **VoicePipelineAgent** STT → LLM → TTS台;提供文本级控制──
- 通过变压器模型实现语义转转检测.
- 原生 MCP 集成──
- 通过SIP支持电话.
- 通过LiveKit Inference 提供50多个模型,无需API密钥;通过插件还可连接200多个模型.

### 商业平台

通过网络网络网络,您可以选择一个平台.

### 这个模式很容易出错的地方

- **没有 barge-in handling。**用户打断;代理 继续说话.
- **忽略 STT confidence。**低信心转录被当成事实送入LLM──应基于信心做门,或请求确认──
- **TTS mid-sentence cutoff。**由于这些问题,我们需要了解,否则我们必须切断音频.
- **忽略 latency budget。**每个组件都会增加50200ms――上线前先把整个条链的延迟加总――

### 2026年典型的延迟

- 速:2060ms
- 部分STT:100250ms
- 士 首个代币:150400ms
- 电脑系统的第一声:100200ms
- 运输时间:3080ms

端到端450600ms 属于高级体验──8001200ms 很常见──任何经验都会感觉已经坏了──


```figure
voice-pipeline
```

## 构建它
`code/main.py`是一个基于框架的玩具管道,包含:

- `Frame`类型: 音频,转录,文字,tts_audio,控制)
- 带有`process(frame)`的`Processor`接口
- 一个五阶段管道(VAD → STT → LLM → TTS →运输),以脚本处理器实现──
- 一个"UPSTREAM"取消框,用于演示入.

运行它:

```
python3 code/main.py
```

随着车的停机, 车停下来.

## 使用它
- **Pipecat**完全控制了定制处理器,Python首个可插拔供应商.
- **LiveKit Agents**为了WebRTC的首次部署和电话.
- **Vapi / Retell**没有WebRTC团队的主机语音代理.
- **OpenAI Realtime / Gemini Live**通过直接录音/录音出.

## 交付它
`outputs/skill-voice-pipeline.md`搭建一个Pipet 形态的语音管道架,包含VAD + STT + LLM + TTS +运输,以及船运输.

## 练习
1. 给你的玩具管道 添加指标观察者:统计每一个阶段每秒的框架 数量――延迟在哪里积累?
2. 实现信任门的STT:低于值时,请求能重复吗?
3. 添加语义转折检测:简单规则  如果转录以 "?"结尾,则视为转折的结束──
4. 阅读Pipecat的运输文件──把stdlib运输 替换为SmallWebRTC运输配置(stub)。
5. 在同一查询上测量OpenAI实时与STT+LLM+TTS级.

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
- [Pipecat docs](https://docs.pipecat.ai/getting-started/introduction) 基于框架的管道,处理器,运输
- [LiveKit Agents docs](https://docs.livekit.io/agents/) WebRTC + 语音原始
- [Vapi](https://vapi.ai/)管理的语音平台
- [Retell AI](https://www.retellai.com/)管理语音,延迟标记
