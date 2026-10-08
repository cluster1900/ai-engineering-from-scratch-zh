# एजेंट फ्रेमवर्क 取舍  LangGraph vs CrewAI vs AutoGen vs Agno

> प्रत्येक ढांचा एक ही डेमो में बिक रहा है, शोध एजेंट  निर्माण रिपोर्ट), साथ ही एक ही बग में भी है, राज्य योजना और संगठनात्मक परत  आपस में लड़ना) ◊ उस अमूर्त रूप को चुनें जो आपके प्रश्न के आकार से मेल खाता है; शेष सभी को दो बार लिखना है गोंद कोड──

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 16 (LangGraph)
**Time:** ~45 minutes

## 问题

आपको एक काम करना है, आपको एक बार LLM कॉल की आवश्यकता है। शायद यह एक शोध कार्यप्रवाह है। योजना, खोज, सारांश, उद्धरण।

तीन दिन बाद, आप इस ढांचे के अमूर्त को पंप करना शुरू करते हैं। चालक दल आपको भूमिकाएं देता है, लेकिन जब अनुसंधानकर्ता                                                                                                                                                                                                                                             

修复方式 选择最好的框架──而是把框架 के मूल सार को आपके प्रश्न के आकार से मेल खाने दें──本课会绘画这个地图──

## 概念

![Agent framework 矩阵：核心抽象 vs 问题形状](../assets/framework-matrix.svg)

चार ढांचे 2026 के परिदृश्य को प्रमुख रूप से निर्देशित करते हैं।

| Framework | 核心抽象 | 最适合 | 最不适合 |
|-----------|----------|--------|----------|
| **LangGraph** | `StateGraph` — typed state、nodes、conditional edges、checkpointer。 | 有显式 state 和 human-in-the-loop interrupts 的 workflows；需要 time-travel debugging 的 production agents。 | 拓扑未知、由 role 驱动的松散 brainstorming。 |
| **CrewAI** | `Crew` — roles（goal、backstory）、tasks、process（sequential 或 hierarchical）。 | 有短线性/层级 plan 的 role-playing 或 persona-driven workflows。 | 超出 crew turn history 的任何 stateful 场景；复杂 branching。 |
| **AutoGen** | `ConversableAgent` pair — 两个或更多 agents 轮流说话，直到满足 exit condition。 | Multi-agent *dialogue*（teacher-student、proposer-critic、actor-reviewer），其中思考从 chat 中涌现。 | 有已知 DAG 的 deterministic workflows；任何需要跨重启 durable state 的场景。 |
| **Agno** | `Agent` — 单个 LLM + tools + memory，可组合成 teams。 | 快速构建 single agents 和 lightweight teams；强 Multimodality 和内置 storage drivers。 | 带 custom reducers 的深度、显式分支 graphs。 |

### 抽象到底是什么意思

एक ढांचे का मूल सार, वह है जो आप वाइटबोर्ड पर वास्तुकला के बारे में बात करते समय पेंट करते हैं।

- **LangGraph**→ 你画一个图表――节点是步骤,边缘是过渡, प्रत्येक बिंदु के राज्य वस्तु 都是打字―― मानसिक मॉडल是状态机――
- **CrewAI**→ 你画一个组织图片──每个角色有职位描述,管理者 路由任务──心理模型 是一个小型专家团队──
- **AutoGen**→ 你画一个Slack DM──两个代理人 相互发消息; यदि moderator की आवश्यकता हो तो,第三个加入── मानसिक मॉडल 是聊聊──
- **Agno**→ आप एक अलग बॉक्स बनाते हैं, उसके पास उपकरण लटकते हैं।

### राज्य  समस्या

राज्य ही अधिकांश ढांचे का चयन करने वाला एक ऐसा स्थान है जहां उत्पादन में गिरावट आती है।

- **LangGraph.**प्रकार की स्थिति`TypedDict`या पिडैंटिक मॉडल) 、 प्रति क्षेत्र घटकों、一等 चेक पॉइंटर्स(SQLite/Postgres/Redis)  रिज्यूमे、अवरोध 和 समय यात्रा 都是免费的──*((见阶段11 · 16──) *
- **CrewAI.**राज्य के माध्यम से`context`फ़ील्ड 以字符串形式在任务 之间流动, या 通过`output_pydantic`结构化传递──开箱没有每员工的持久店; यदि चालक दल 必须在重启后生存,你需要自己接上──
- **AutoGen.**स्टेटस है चैट इतिहास और किसी भी उपयोगकर्ता द्वारा परिभाषित `context`❖ वार्तालाप प्रतिलेखन स्थायी हो सकता है; किसी भी कार्यप्रवाह की स्थिति नहीं स्थायी हो सकती है, जब तक आप एडैप्टर नहीं लिखते हैं。
- **Agno.**内置 भंडारण ड्राइवर(SQLite、Postgres、Mongo、Redis、DynamoDB), के माध्यम से `storage=`                                                                                                                                                                                                                                                              `Agent`上  वार्तालाप सत्र 和 उपयोगकर्ता स्मृति 会自动持久化── यह पूर्ण ग्राफ चेक पॉइंटर नहीं है; बल्कि सत्र स्टोर──

### शाखा 问题

हर असाधारण एजेंट शाखाओं से जुड़ा होता है।

- **LangGraph** आपके द्वारा तय, सशर्त किनारों के माध्यम से──रूटिंग है带命名 शाखाओं का पायथन फ़ंक्शन──शाखाएँ हैं संकलन ग्राफ में एक समान वस्तु; चेकपॉइंटर 会记录 ने कौन से शाखाएं अपनाईं──
- **CrewAI** पदानुक्रम मोड में प्रबंधक द्वारा निर्णय; अनुक्रमिक मोड में आप द्वारा निर्माण के दौरान निर्णय;; रूटिंग 隐含在任务列表 में; प्रबंधक के शीघ्र के अलावा, कोई एक समान if──
- **AutoGen** एजेंट 通过聊天决定──分支从下一个发言者中涌现──`GroupChatManager`选择 अगला वक्ता; तुम हाथ लिख सकते हो `speaker_selection_method`लेकिन यह एमएलए द्वारा संचालित है।
- **Agno** एजेंट 通过下一步调用哪个工具来决定──团队有协调员/路由器/合作者模式; इन शाखाओं से परे विकासकर्ता की जिम्मेदारी है──

### अवलोकनशीलता 问题

- **LangGraph**  LangSmith या किसी भी OTel निर्यातक के माध्यम से उपयोग करें OpenTelemetry。 प्रत्येक नोड संक्रमण सभी निशान अवधि हैं; चेकपॉइंट समान समय में भी replayable के निशान हैं。 LangSmith प्रथम पक्ष विकल्प है; Langfuse/Phoenix भी है एडैप्टरों。
- **CrewAI** 2025 साल के अंत से उदय प्रथम श्रेणी OpenTelemetry का समर्थन; 集成 Langfuse、Phoenix、Opik、AgentOps。
- **AutoGen** 通过 `autogen-core`集成 OpenTelemetry;AgentOps 和 Opik के कनेक्टर हैं── ट्रैकिंग 粒度 है प्रति एजेंट-संदेश, नहीं प्रति नोड──
- **Agno** 内置 `monitoring=True`ध्वज 加 ओपनटेलीमेट्री निर्यातक;

### लागत और विलंबता

चार ढांचे में प्रति कॉल ओवरहेड में वृद्धि होगी (फ्रेमवर्क लॉजिक, वैलिडेशन, सीरियलाइजेशन) ◊ ओवरहेड के अनुसार बढ़ेगा  बड़े पैमाने पर क्रमशःAgno ≈ LangGraph < CrewAI ≈ AutoGen ◊ अंतर मुख्य रूप से ढांचे द्वारा किया गया है LLM रूटिंग निर्णय किया गया है ◊ CrewAI के पदानुक्रमिक प्रबंधक 会花 टोकन निर्णय कौन अगला निष्पादन;AutoGen के`GroupChatManager`यह भी है, और यह भी है, केवल आप लिखते हैं`llm.invoke`很薄──

जब प्रति ऑपरेशन लागत  महत्वपूर्ण                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       `speaker_selection_method`), बजाय LLM द्वारा चुनी गई रूटिंग

### सहकार्यशीलता

- **LangGraph** **LangChain**उपकरण、पुनर्प्राप्तकर्ता、LLMs──一等 MCP एडाप्टर(उपकरण 作为 MCP सर्वर 导入)
- **CrewAI** उपकरण 继承自 `BaseTool`;लंगचेन उपकरण、लामाइंडेक्स उपकरण तथा एमसीपी उपकरण सभी अनुकूलित हैं।`allow_delegation=True`चालक दल से चालक दल के प्रतिनिधिमंडल को करना
- **AutoGen**→ `FunctionTool`包装任何Pythoncallable;有MCP एडाप्टर──对代理-to-agent पैटर्न与AG2 पारिस्थितिकी तंत्र 紧密合──
- **Agno**→ `@tool`सजावटकर्ता या बेसटूल उपवर्ग;एमसीपी एडाप्टर;उपकरण एजेंटों तथा टीमों के बीच साझा किए जा सकते हैं।

##  कौशल

> आप एक वाक्य के साथ समझा सकते हैं, क्यों एक ढांचा किसी एजेंट के लिए उपयुक्त है।

构建前 चेकलिस्ट:

1. **画出形状。**यह ग्राफ है (क्या आप एक ही एजेंट के साथ काम कर रहे हैं?
2. **决定谁来 branching。**डेवलपर-निर्धारित शाखा → लैंगग्राफ―― प्रबंधक-एजेंट-निर्धारित → क्रूएआई पदानुक्रम――चैट-उत्पन्न → ऑटोजेन――टूल-कॉल-निर्धारित → एग्नो――
3. **检查 state budget。**क्या आपको चेक-पॉइंट से रिज़्यूमे की आवश्यकता है? समय यात्रा? मनुष्य मध्य-चलन में बाधित करता है? यदि हां, LangGraph है默认选择;Agno सत्र 覆盖 वार्तालाप-स्कोप राज्य──
4. **检查 cost budget。**LLM- चयनित रूटिंग प्रत्येक दौर में अतिरिक्त फूल टोकन  यदि एजेंट प्रतिदिन हजारों बार काम करता है, तो प्राथमिकता स्पष्ट रूटिंग 
5. **为 framework overhead 做预算。**प्रत्येक ढांचे एक और निर्भरता है। यदि कार्य केवल दो बार LLM कॉल और एक उपकरण है, तो 30 लाइन सादे पायथन लिखें; कोई ढांचा नहीं है, कोई ढांचा नहीं है।

 आप ग्राफ,org चार्ट,chat या agent box  बना सकते हैं  पहले, frameworks को भी reject कर सकते हैं  आप एक ऐसे frameworks को भी चुन सकते हैं जो आपको वास्तविक जरूरतों के लिए मजबूर कर दे और उसके state model को विरोध करने के लिए frameworks का चयन कर सकें

## 决策矩阵

| 问题形状 | 首选 framework | 原因 |
|----------|----------------|------|
| 带 typed state、human approvals、long-running 的 Workflow DAG | LangGraph | 一等 state、checkpointer、interrupts、time-travel。 |
| 有明确 roles 的 research / writing pipeline | CrewAI (sequential) 或 LangGraph subgraphs | 在 CrewAI 中表达 role-per-task 很便宜；当 branching 变复杂时用 LangGraph 扩展。 |
| Proposer-critic 或 teacher-student dialogue | AutoGen | Two-agent chat 是它的原生形状。 |
| 带 tools、sessions、memory 的 single agent | Agno | 设置最薄，内置 storage 和 memory。 |
| 带 reducers 的数千个 parallel fanouts | LangGraph + `Send` | 唯一拥有一等 parallel-dispatch API 的选择。 |
| 快速 prototype，不承诺 framework | Plain Python + provider SDK | 没有 framework 是最快的 framework。 |


```figure
l5-framework-fit
```

## अभ्यास

1. **Easy.**取同一个任务  research Anthropic के मुख्यालय, 200 शब्द का संक्षिप्त विवरण लिखें, स्रोतों का हवाला दें  分别使用LangGraph(四个节点:plan、search、write、cite) 和 CrewAI(三角色:research、writer、editor) 实现──报告每次运行代码行数和代码行数──
2. **Medium.**उपयोग करें ऑटोजेन(अनुसंधानकर्ता  लेखक चैट, संपादक 通过 `GroupChat`加入) 和 Agno(带 `search_tools`和 `write_tools`(क) प्रत्येक परिचालन लागत, (ख) दुर्घटना के बाद पुनः आरंभ करने की क्षमता, (ग) मानव अनुमोदन की क्षमता, (ग) चार कार्यान्वयन क्रम में प्रवेश करने की क्षमता।
3. **Hard.**निर्माण एक निर्णय-वृक्ष स्क्रिप्ट `pick_framework.py`, एक简短问题描述 (एक संक्षिप्त प्रश्न) स्वीकार करें`{has_typed_state, has_roles, has_dialogue, has_parallel_fanout, needs_resume}`),并返回推和一句话理由──用你自己设计的六个案例 验证它──

## 关键术语

| Term | 人们怎么说 | 它实际是什么意思 |
|------|------------|------------------|
| Orchestration | “agents 如何协调” | 决定下一个运行哪个 node/role/agent 的 layer。 |
| Durable state | “重启后 resume” | 附着到 checkpoint 或 session store 上、能在 process death 后存活的 state。 |
| LLM-selected routing | “让 model 决定” | planner LLM 每轮选择下一步；灵活，但每次决策都要花 tokens。 |
| Explicit routing | “Developer 决定” | Python function 或 static edge 选择下一步；便宜且可审计。 |
| Crew | “一个 CrewAI team” | roles + tasks + process（sequential 或 hierarchical）绑定成一个 runnable。 |
| GroupChat | “AutoGen 的 multi-agent chat” | N 个 agents 之间由 speaker selector 管理的 conversation。 |
| Team (Agno) | “Multi-agent Agno” | 对一组 agents 使用 route / coordinate / collaborate mode。 |
| StateGraph | “LangGraph 的 graph” | typed-state、node、conditional-edge、checkpointer abstraction。 |

## 延伸阅读

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) StateGraph、checkpoints、interrupts、time-travel──
- [CrewAI documentation](https://docs.crewai.com/) चालक दल, प्रवाह, एजेंट, कार्य, प्रक्रियाएँ
- [AutoGen documentation](https://microsoft.github.io/autogen/) वार्तालाप करने योग्यएजेंट、ग्रुपचैट、टीम、टूल。
- [Agno documentation](https://docs.agno.com/) एजेंट, टीम, वर्कफ़्लो, भंडारण, स्मृति
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) ढांचे के साथ 无关的图案库(प्रोम्प्ट चेनिंग, राउटिंग, समानांतर, ऑर्केस्ट्रेटर-कार्यकर्ता, मूल्यांकनकर्ता-अनुकूलनकर्ता)
- [Yao et al., "ReAct: Synergizing Reasoning and Acting" (ICLR 2023)](https://arxiv.org/abs/2210.03629) प्रत्येक ढांचे को शहर में लूप में रखा गया है।
- [Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" (2023)](https://arxiv.org/abs/2308.08155) ऑटोजेन का डिजाइन पेपर。
- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023)](https://arxiv.org/abs/2304.03442) CrewAI 风格 व्यक्तित्व स्टैक 建立其上角色扮演基础──
- चरण 11 · 16 (लंगग्राफ)  本课用来基准的框架──
- चरण 11 · 19 (विचार)  एक एक कर सकते हैं शुद्ध मैग्ज़िफ़ LangGraph  पर मैग्ज़िफ़ CrewAI में बहुत ही अलग मोड होगा 
- चरण 11 · 22 (उत्पादन की अवलोकन क्षमता)  如何仪器 你选择的任何框架──
