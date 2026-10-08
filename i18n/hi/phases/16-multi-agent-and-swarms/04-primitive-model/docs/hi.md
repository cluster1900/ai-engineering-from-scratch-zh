# बहु-एजेंट आदिम मॉडल

> 2026 में प्रकाशित प्रत्येक मल्टी-एजेंट फ्रेमवर्क  ऑटोजेन、लंगग्राफ、 क्रूएआई、ओपनएआई एजेंट्स SDK、 माइक्रोसॉफ्ट एजेंट फ्रेमवर्क  都是四维设计空间中的一个点──四个原始,仅此而已:एजेंट、赞助、共享状态、乐团主管──本课从零构建它们,在四者上运行一个玩具系统,然后将每个主流框架 映射到同一组坐标轴上,让你能用一段话读懂任何新发布版本──

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 (Agent Engineering), Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

## 问题
हर छह महीने में एक नया मल्टी-एजेंट फ्रेमवर्क होगा 发布──2023 साल का ऑटोजेन──2024 साल का क्रूएआई──2024 साल का लैंगग्राफ और ओपनएआई स्वार्म──2025 साल के अप्रैल के गूगल एडीके──2026 साल के फरवरी के माइक्रोसॉफ्ट एजेंट फ्रेमवर्क आरसी── प्रत्येक प्रेस विज्ञप्ति में खुद को  सही अमूर्तता──

यदि आप उन्हें व्यक्तिगत रूप से सीखने की कोशिश करते हैं, तो आप थक जाएंगे। एपीआई अलग दिखते हैं।

नहीं ऐसा है, चार आदिम हैं, एक बार सीखें, एक से एक शब्द के साथ प्रत्येक नई ढांचे को समझें।

## 概念
### चार आदिम

1. **Agent** एक सिस्टम प्रॉम्प्ट जोड़ एक उपकरण सूची──无状态; प्रत्येक बार运行都从其系统 प्रॉम्प्ट 和当前消息历史 开始──
2. **Handoff**  नियंत्रण एक एजेंट से दूसरे एजेंट में संरचनात्मक हस्तांतरण  तंत्र पर, यह नए एजेंट के उपकरण कॉल को वापस कर सकता है, या यह किसी विशेष स्थिति के ग्राफ किनारे का अनुसरण कर सकता है
3. **Shared state** 任何能被多个代理 读取(有时也能写入) के डेटा संरचना── संदेश पूल、ब्लैकबोर्ड、की-मूल्य भंडारण、वेक्टर मेमोरी──
4. **Orchestrator** decide下一个由谁发言的角色──选项包括:显式图表(确定性)、LLM स्पीकर-सेलेक्टर(soft)、上一位 स्पीकर का हैंडऑफ कॉल(OpenAI Swarm), या कतार 上的 शेड्यूलर(swarm वास्तुकला)。

यही एक पूर्ण डिजाइन स्पेस है। प्रत्येक फ्रेमवर्क प्रत्येक अक्ष के लिए एक मानक मूल्य है। शेष केवल एक स्तर की भाषा है।

### कैसे हर 2026 फ्रेमवर्क इसे मानचित्रित करता है

| Framework | Agent | Handoff | Shared state | Orchestrator |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | tool returns Agent | caller's problem | the LLM's next handoff call |
| AutoGen v0.4 / AG2 | `ConversableAgent` | speaker-selector on GroupChat | message pool | selector function (LLM or round-robin) |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | Task outputs chained | manager LLM or static order |
| LangGraph | node function | graph edge + condition | `StateGraph` reducer | the graph, deterministic |
| Microsoft Agent Framework | agent + orchestration patterns | pattern-specific | thread / context | pattern-specific |
| Google ADK | agent + A2A card | A2A task | A2A artifacts | host decides |

सतह का अंतर बहुत बड़ा दिखता है।

### यह क्यों मायने रखता है

एक बार जब आप आदिमों को देखते हैं, तो फ्रेमवर्क तुलना एक छोटी सी चेकलिस्ट बन जाती हैः

- वाद्ययंत्रक है विश्वास LLM आने मार्ग (((Swarm), या इसे मार्गण 固定在代码中(LangGraph)?
- साझा राज्य है पूरा इतिहास(ग्रुपचैट), या परियोजना(राज्यग्राफ रिड्यूसर)?
- एजेंटों को एक दूसरे के संकेतों को बदल सकते हैं, या केवल एक हाथ दे सकते हैं?

इन तीनों प्रश्नों का उत्तर एक ढांचे से मिल सकता है कि क्या यह किसी विशिष्ट प्रश्न के 80% के लिए उपयुक्त है।

### देशहीन अंतर्दृष्टि

साझा राज्य के अलावा, प्रत्येक आदिम                                                                                                                                                                                                                                                           **系统中唯一有状态的东西是 shared state。**सभी दिलचस्प बग वहाँ रहते हैंः स्मृति विषाक्तता ((पाठ 15) ✓ संदेश आदेश ✓ संस्करण ✓ लेखन विवाद ✓

 छिपा साझा राज्य के ढांचे swarm) समस्या को कॉल करने वाले को प्रस्तुत करेगा集中管理 साझा राज्य के ढांचेLangGraph checkpointAutoGen pool) इसे चेक करने की अनुमति देगा, लेकिन समन्वय लागत  स्थानांतरित करेगा  साझा राज्य कार्यान्वयन ऊपर

### एक एकल आदिम की शरीर रचना

#### एजेंट

```
Agent = (system_prompt, tools, model, optional_name)
```

没有记忆――没有状态――拥有相同的系统提示和工具的两个代理是可互换的――任何东西看起来像每代理状态的东西,实际上都在共享状态或交付协议中――

#### हाथ से

```
Handoff = (from_agent, to_agent, reason, payload)
```

तीन प्रकार के पूर्ति

- **Function return** उपकरण 返回下一个代理── यह OpenAI Swarm पैटर्न── एजेंट अपने स्वयं के उपकरण योजनाओं में रूटिंग ले जाते हैं──
- **Graph edge** LangGraph──Edges 是声明式的──LLM 生成一个值;condition 选择下一个节点──
- **Speaker selection** ऑटोजेन ग्रुप चैट──सेलेक्टर फ़ंक्शन(有时它本身也是一次LLM कॉल)读取池并选择下一位发言者──

#### साझा राज्य

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

कम से कम एक संदेश 列表──通常更多: संरचित कलाकृतियाँ(CrewAI कार्य आउटपुट) प्रकारित संदर्भ(लंगग्राफ घटाने वाले)  बाहरी स्मृति(MCP、वेक्टर DB) 

两种拓类:**full pool**(प्रत्येक एजेंट हर संदेश देखते हैं) और **projected**(एजेंट्स देखें भूमिका के दायरे के अनुसार दृश्य) ―― पूर्ण पूल 简单但扩展性差──प्रोजेक्ट पूल विस्तार योग्य, लेकिन पूर्व डिजाइन योजना की आवश्यकता──

#### संगीतकार

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

चार प्रकारः

- **Static** ग्राफ में निर्माण समय 固定(लंगग्राफ निर्धारक、क्रूएआई अनुक्रमिक)
- **LLM-selected** LLM 读取 pool 并选择下一位讲者(AutoGen、CrewAI पदानुक्रमिक)
- **Handoff-driven** 当前 एजेंट 通过调用 हस्तान्तरण उपकरण 来决定(Swarm) 
- **Queue-driven** श्रमिकों से साझा कतार 拉取任务; कोई स्पष्ट अगले स्पीकर नहीं है

### ढांचे के बीच क्या परिवर्तन

एक बार जब आदिम  तय हो जाते हैं, शेष डिजाइन निर्णय हैः

- **Memory strategy** क्षणिक बनाम टिकाऊ चेकपोइंटर
- **Safety boundary** 谁可以批准交付
- **Cost accounting** प्रति एजेंट टोकन बजट
- **Observability** रिप्लाई के लिए हाथों की खोज, 持久化 स्थिति

ये सब आदिमों पर ही हो सकते हैं। ये सब नई आदिम नहीं हैं।


```figure
a5-primitive-radar
```

##  इसे निर्माण
`code/main.py`लगभग 150 रन के साथ पायथन 实现四个原始人──没有真正的LLM  प्रत्येक एजेंट  एक स्क्रिप्टित नीति है, इसलिए फोकस कोऑर्डिनेशन संरचना上──

इस फ़ाइल का निर्देशांकः

- `Agent` 包含 नाम, सिस्टम प्रॉम्प्ट, उपकरण, नीति फ़ंक्शन का डेटा क्लास
- `Handoff` 返回新代理 का कार्य
- `SharedState` धागे-सुरक्षित संदेश पूल──
- `Orchestrator` तीन परिवर्तनः`StaticOrchestrator``HandoffOrchestrator``LLMSelectorOrchestrator`(अनुकरण)

demo 通过所有三种管弦乐器类型 运行同一个三代理管道(अनुसंधान → लेखन → समीक्षा), और अंतिम मुद्रण संदेश पूल。 आप देख सकते हैं,输出差异只在 *किसे अगले*; एजेंटों 和 साझा राज्य में प्रत्येक बार चलाने में पूरी तरह से समान है。

运行它:

```
python3 code/main.py
```

预期输出:三次 ऑर्केस्ट्रेटर रन, प्रत्येक पैटर्न एक बार── प्रत्येक बार都会印印最终 संदेश पूल── यदि शोधकर्ता 判断已经提前完成, दान-चालित रन 会到达更少的代理

## इसका उपयोग करें
`outputs/skill-primitive-mapper.md`यह एक कौशल है, यह किसी भी मल्टी-एजेंट कोडबेस या फ्रेमवर्क डॉक को पढ़ता है, और चार-प्राथमिक मानचित्रण को लौटता है।

## 交付 यह
पहले, पहले इसके लिए आदिम मानचित्रण लिखें। यदि लिखा नहीं गया तो डॉक्स अधूरा है, या यह ढांचा विकसित हो रहा है।

                                                                                                                                                                                                                                                              

## अभ्यास
1. विभिन्न एजेंट नीतियों के साथ 运行 `code/main.py`三次──观察 ऑर्केस्ट्रेटर चयन 如何改变哪些代理会运行──
2. 实现第四种管弦乐器类型:排队驱动, जिनमें से एजेंट 轮询共享状态 寻找工作.
3. 取 LangGraph त्वरित प्रारंभ (https://docs.langchain.com/oss/python/langgraph/workflows-agents), इसे चार आदिम में लिखें।
4. 阅读 OpenAI स्वाम कुकबुक (https://developers.openai.com/cookbook/examples/orchestrating_agents)― पहचान Swarm  चार आदिमों में से कौन सबसे कामुक है, तथा यह किसको कॉल करने वाले को प्रेरित करता है
5. इस सूची में एक पूरी तरह से छिपी साझा राज्य के ढांचे को ढूंढें।

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Agent | “一个带 tools 的 LLM” | 一个 `(system_prompt, tools, model)` triple。无状态。 |
| Handoff | “控制权转移” | 一个结构化 call，命名下一个 agent 和可选 payload。三种实现：function return、graph edge、speaker selection。 |
| Shared state | “Memory” / “context” | multi-agent system 中唯一有状态的部分。Message pool 或 blackboard。 |
| Orchestrator | “Coordinator” | 决定下一个运行者的人或机制。Static graph、LLM selector、handoff-driven，或 queue-driven。 |
| Primitive | “Abstraction” | 每个 framework 都会参数化的四个轴之一。不是 framework feature。 |
| Message pool | “Shared chat history” | Full-history shared state。容易推理，扩展性差。 |
| Projected state | “Scoped view” | 面向特定 role 的 shared state view。可扩展，需要 schema design。 |
| Speaker selection | “下一个谁说话” | 一种 orchestrator pattern，其中一个 function（通常是 LLM）从 group 中选择下一个 agent。 |

## 延伸阅读
- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) हस्त-चालित संग्राहलय के बारे में स्पष्ट विवरण
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/) ग्रुपचैट + स्पीकर चयन LLM द्वारा चयनित ऑर्केस्ट्रेशन का संदर्भ प्राप्त करना
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) ग्राफ-अंत ऑर्केस्ट्रेशन और रेड्यूसर आधारित साझा राज्य
- [CrewAI introduction](https://docs.crewai.com/en/introduction) भूमिका-उद्देश्य-पछाड़ कहानी एजेंट,क्रमबद्ध/पदानुक्रमिक प्रक्रियाएं
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2) माइक्रोसॉफ्ट v0.4 转入维护 后仍在活跃的AutoGen v0.2 线
