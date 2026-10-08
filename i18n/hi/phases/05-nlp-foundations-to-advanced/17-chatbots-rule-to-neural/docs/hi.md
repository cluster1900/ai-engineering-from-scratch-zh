# चैटबॉट  नियम आधारित से न्यूरल पुनः LLM एजेंट तक

> ELIZA प्रयोग पैटर्न मैच 回复──DialogFlow 映射意图──GPT 中作答──Claude 运行工具 并进行验证──每时代都解决了上一代最严重的失败──

**类型：**学习
**语言：**पायथन
**先修要求：**चरण 5 · 13 (प्रश्न का उत्तर), चरण 5 · 14 (सूचना प्राप्त करना)
**时间：** 75 मिनट

## 问题

उपयोगकर्ता कहता हैःमैं अपनी उड़ान बदलना चाहता हूँ. 系统必须弄清楚用户想要什么、缺少哪些信息、如何获取这些信息,以及如何完成这个操作──然后用户又说:等,如果我取消吗? 系统必须记住上下文、切换任务,并保留状态──

एमएल सिस्टम के लिए, संवाद कठिन है। इनपुट खुला है। आउटपुट को कई दौर में लगातार रहना चाहिए। सिस्टम को वास्तविक दुनिया में निष्पादन ऑपरेशन की आवश्यकता हो सकती है।

चैटबॉट वास्तुकला ने चार प्रकार के परिदृश्यों के चक्र का अनुभव किया है, प्रत्येक एक के विफलता के कारण बहुत स्पष्ट रूप से पेश किया गया है।

## 概念

![Chatbot evolution: rule-based → retrieval → neural → agent](../assets/chatbot.svg)

**Rule-based（ELIZA、AIML、DialogFlow）。**️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️️

**Retrieval-based。**FAQ 风格的系统──Encode 每一组(उक्ति, प्रतिक्रिया)──运行时,encode 用户消息并获取 最近的已存回复── इसे ज़ेन्डेस्क 经典 के 类似文章功能──比规则更能处理句子──没有生成,因此没有幻觉──

**Neural（seq2seq）。**वार्तालाप में प्रशिक्षण का एक एन्कोडर-डेकोडर। शून्य से शुरू होने से उत्पन्न होता है।

**LLM agents。**एक भाषा मॉडल एक चक्र में पैक किया गया है, योजना बनाने के लिए उपकरण,并验证结果── यह एक एजेंट लूप हैः योजना → कॉल टूल → परिणाम का निरीक्षण करें → अगला कदम तय करें── पुनर्प्राप्ति-पहला ग्राउंडिंग(RAG) इसे भ्रम से बचाने के लिए करें── उपकरण कॉल 让它真正能够执行操作── यह 2026 वर्ष का वास्तुकला है──

यह चार प्रकार का प्रतिस्थापन क्रमबद्ध नहीं है। एक 2026 वर्ष का उत्पादन-स्तर चैटबॉट चार प्रकार के मार्गों से गुजर जाएगाः नियम आधारित, पहचान सत्यापन और विनाशकारी कार्यों के लिए उपयोग किया जाता है, पुनर्प्राप्ति, FAQ के लिए उपयोग किया जाता है, तंत्रिका पीढ़ी, प्राकृतिक अभिव्यक्ति के लिए उपयोग किया जाता है, एलएलएम एजेंट, अस्पष्ट खुले प्रकार के प्रश्नों के लिए उपयोग किया जाता है।


```figure
chatbot-lineage
```

##  इसे निर्माण

### 步骤 1: नियम आधारित पैटर्न मिलान

```python
import re


class RulePattern:
    def __init__(self, pattern, response_template):
        self.regex = re.compile(pattern, re.IGNORECASE)
        self.template = response_template


PATTERNS = [
    RulePattern(r"my name is (\w+)", "Nice to meet you, {0}."),
    RulePattern(r"i (need|want) (.+)", "Why do you {0} {1}?"),
    RulePattern(r"i feel (.+)", "Why do you feel {0}?"),
    RulePattern(r"(.*)", "Tell me more about that."),
]


def rule_based_respond(user_input):
    for pattern in PATTERNS:
        m = pattern.regex.match(user_input.strip())
        if m:
            return pattern.template.format(*m.groups())
    return "I don't understand."
```

20 行实现 ELIZA──这个反思 技巧(我感到悲伤 → 你为什么感到悲伤) 是Weizenbaum 1966年经典的心理治疗师演示──至今仍有很有教学价值──

### 步骤 2:पुनर्प्राप्ती आधारित

इस उदाहरण के लिए आवश्यक है ।`pip install sentence-transformers`(यह मशाल खींच लेगा) ✿本课可运行`code/main.py`改用 stdlib जैकार्ड समानता, इसलिए पाठ्यक्रम संचालन समय बाहरी निर्भरता की आवश्यकता नहीं है

```python
from sentence_transformers import SentenceTransformer
import numpy as np


FAQ = [
    ("how do i reset my password", "Go to Settings > Security > Reset Password."),
    ("how do i cancel my order", "Go to Orders, find the order, click Cancel."),
    ("what is your return policy", "30-day returns on unused items, original packaging."),
]


encoder = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
faq_questions = [q for q, _ in FAQ]
faq_embeddings = encoder.encode(faq_questions, normalize_embeddings=True)


def faq_respond(user_input, threshold=0.5):
    q_emb = encoder.encode([user_input], normalize_embeddings=True)[0]
    sims = faq_embeddings @ q_emb
    best = int(np.argmax(sims))
    if sims[best] < threshold:
        return None
    return FAQ[best][1]
```

 सीमा के आधार पर अस्वीकार करना  महत्वपूर्ण है  यदि सर्वोत्तम अनुकूलन पर्याप्त नहीं है, तो वापस `None`, सिस्टम अपग्रेड संसाधित करें

### 步骤 3: तंत्रिका पीढ़ी (बेसलाइन)

प्रयोग एक लघु निर्देश-ट्यून एन्कोडर-डेकोडर(FLAN-T5) या एक बारीक-ट्यून वार्तालाप मॉडल── 2026 वर्ष तक, अकेले उत्पादन के लिए अभी भी अपरिहार्य हैं, लेकिन प्राकृतिक अभिव्यक्ति के लिए उपयोग किए जाने वाले हाइब्रिड प्रणालियों के हिस्से के रूप में होंगे──DialoGPT  शैली के केवल डेकोडर मॉडल  स्पष्ट बारी से विभाजक और EOS हैंडलिंग 才能生成连贯回复;FLAN-T5 पाठ2पाइपलाइन  सीधे शिक्षण उदाहरण के रूप में उपयोग किया जा सकता है──

```python
from transformers import pipeline

chatbot = pipeline("text2text-generation", model="google/flan-t5-small")

response = chatbot("Respond politely to: Hi there!", max_new_tokens=40)
print(response[0]["generated_text"])
```

### 步骤 4:LLM एजेंट लूप

2026 के उत्पादन के प्रारूपः

```python
def agent_loop(user_message, tools, llm, max_steps=5):
    history = [{"role": "user", "content": user_message}]
    for _ in range(max_steps):
        response = llm(history, tools=tools)
        tool_call = response.get("tool_call")
        if tool_call:
            tool_name = tool_call.get("name")
            args = tool_call.get("arguments")
            if not isinstance(tool_name, str) or tool_name not in tools:
                history.append({"role": "assistant", "tool_call": tool_call})
                history.append({"role": "tool", "name": str(tool_name), "content": f"error: unknown tool {tool_name!r}"})
                continue
            if not isinstance(args, dict):
                history.append({"role": "assistant", "tool_call": tool_call})
                history.append({"role": "tool", "name": tool_name, "content": f"error: arguments must be a dict, got {type(args).__name__}"})
                continue
            fn = tools[tool_name]
            result = fn(**args)
            history.append({"role": "assistant", "tool_call": tool_call})
            history.append({"role": "tool", "name": tool_name, "content": result})
        else:
            return response["content"]
    return "I could not complete the task in the step budget."
```

需要明确三件事──工具是LLM可以调用可调用函数──当LLM 返回最终答案而不是工具调用时,循环终止──步骤预算 防止在模糊任务上出现无限循环──

वास्तविक उत्पादन प्रणाली भी शामिल होगीःपहली जमीन पर पुनर्प्राप्त करना (पहली जमीन पर) ((पहली बार एलएलएम कॉल करने पर) (गार्ड्रेल) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पहली बार) (पह) (पहली बार) (पह) (पह) (पह) (पहली बार) (पह) (पह) (पह) (पह) (पह) (पह) (पह) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स) (स

### 步骤 5: हाइब्रिड रूटिंग

```python
def hybrid_chat(user_input):
    if is_destructive_action(user_input):
        return structured_flow(user_input)

    faq_answer = faq_respond(user_input, threshold=0.6)
    if faq_answer:
        return faq_answer

    return agent_loop(user_input, tools, llm)


def is_destructive_action(text):
    danger_words = ["delete", "cancel", "charge", "refund", "transfer"]
    return any(w in text.lower() for w in danger_words)
```

模式是: किसी भी विनाशकारी  सामग्री के लिए निर्धारात्मक नियम का उपयोग करें, स्थिर FAQ का उपयोग करें, शेष सभी LLM एजेंटों को सौंप दें।

## इसका उपयोग करें

2026 साल की तकनीक:

| Use case | Architecture |
|---------|---------------|
| 预订、支付、身份验证 | Rule-based state machines + slot filling |
| 客户支持 FAQs | 对 curated answers 做 Retrieval |
| 开放式帮助聊天 | 带 RAG + tool calls 的 LLM agent |
| 内部工具 / IDE assistants | 带 tool calls 的 LLM agent（search, read, write） |
| Companion / character chatbots | 带 persona system prompt 的 tuned LLM，并对知识做 retrieval |

生产中始终使用混合路由──没有单一架构能很好处理所有请求──路由层 本身通常是一个小型意向分类器──

## 仍然会上线 के विफलता मोड

- **自信的编造。**LLM एजेंट  दावा किया है कि उसने व्यावहारिक रूप से पूरा नहीं किया है ∙ उपायः सत्यापन परिणाम, रिकॉर्ड उपकरण कॉल, LLM को किसी भी सफल उपकरण के बिना वापसी की स्थिति में दावा करने की अनुमति नहीं देता है ∙
- **Prompt injection。**यूजर插入覆盖系统 शीघ्र的文本──在 OWASP Top 10 for LLM Applications 2025 中排名 LLM01──两种形式:प्रत्यक्ष इंजेक्शन(直接粘贴到聊天中) और अप्रत्यक्ष इंजेक्शन(藏在代理 读取的文档、邮件或工具输出中)

  攻击成功率因场景而异──在通用工具使用和编码基准中,边界模型上测得的成功率约为0.5-8.5%──特定高风险设置──针对AI编码代理的适应性攻击──脆弱编辑) 曾达到约84%──生产 CVEs包括EchoLeak(CVE-2025-32711,CVSS 9.3)Microsoft 365 Copilot 中由攻击者控制的邮件触发的零点击数据-exfiltration 错误──

  缓解措施: पूरे चक्र के दौरान सभी उपयोगकर्ता इनपुट अविश्वसनीय रूप से देखे जाएंगे; उपकरण कॉल  से पहले सैनिटाइज किया जाएगा; उपकरण आउटपुट को मुख्य शीघ्र 隔离 करें; योजना-पुष्टि-कार्य करने के लिए PVE) मोड का उपयोग करें, एजेंट को पहले योजना बनाने दें, फिर पहले योजना के अनुसार प्रत्येक क्रिया को सत्यापित करने के लिए पहले कार्य करें।

  पुनः多的快速工程也无法完全消除这个风险――必须使用外部 रनटाइम रक्षा परतों(LLM Guard、allowlist सत्यापन、शब्द विसंगतियों का पता लगाने)
- **Scope creep。**एजेंट के लिए एक उपकरण कॉल  लौट आया है किनारे से संबंधित जानकारी और उन्मुख कार्य  राहत उपाय: संकीर्ण उपकरण अनुबंध; बनाए रखने के लिए प्रणाली शीघ्र  फोकस; शामिल करने के लिए आउट-टास्क दर पर मूल्यांकन 
- **无限循环。**एजेंट 持续调用同一个工具──缓解措施:步骤预算──工具-call deduplication──关于我们正在取得进展的LLM法官──
- **Context window exhaustion。**长对话会把最早的轮次挤出上下文──缓解措施:पुराने वक्रों का सारांश, समानता के अनुसार पुनः प्राप्त करें 相关历史轮次,或使用长文本模型──

## 交付 यह

保存为 `outputs/skill-chatbot-architect.md`:

```markdown
---
name: chatbot-architect
description: 为给定 use case 设计 chatbot stack。
version: 1.0.0
phase: 5
lesson: 17
tags: [nlp, agents, chatbot]
---

给定一个产品上下文（用户需求、合规约束、可用 tools、数据规模），输出：

1. Architecture。Rule-based、retrieval、neural、LLM agent 或 hybrid（说明哪些路径走哪里）。
2. LLM choice（如适用）。命名 model family（Claude、GPT-4、Llama-3.1、Mixtral）。匹配 tool-use quality 和成本。
3. Grounding strategy。RAG sources、retrieval method（见 lesson 14）、tool contracts。
4. Evaluation plan。Task success rate、tool-call correctness、off-task rate、held-out dialogs 上的 hallucination rate。

对于任何 destructive action（payments、account deletion、data modification），如果没有 structured confirmation flow，拒绝推荐 pure-LLM agent。如果 agent 对任何内容拥有 write access，拒绝跳过 prompt-injection audit。
```

## अभ्यास

1. **Easy。**उपयोग 10 पैटर्न के लिए कॉफी शॉप आदेश बॉट 实现 ऊपर नियमों पर आधारित प्रतिक्रिया 测试边界 स्थिति: दोहरे आदेश 修正 取消  अस्पष्ट इरादा 
2. **Medium。**构建一个混合FAQ + LLM fallback──为一个SaaS产品 准备50条装装FAQ प्रविष्टियाँ,LLM fallback 使用doc साइट上的检索──在100个真实支持问题上测量拒绝率和精度──
3. **Hard。**तीन उपकरणों के साथ (खोज-पढ़-उपयोगकर्ता-डेटा-पढ़ें-ईमेल भेजें) उपरोक्त एजेंट लूप को लागू करें।

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|-----------------------|
| Intent | 用户想要什么 | Categorical label（book_flight, reset_password）。路由到 handler。 |
| Slot | 一条信息 | Bot 需要的 parameter（date, destination）。Slot filling 是一系列询问。 |
| RAG | Retrieval 加 generation | Retrieve 相关文档，然后 ground LLM 的 response。 |
| Tool call | Function invocation | LLM 发出带有 name + args 的 structured call。Runtime 执行并返回结果。 |
| Agent loop | Plan、act、verify | 交替运行 LLM calls 和 tool calls 的 controller，直到任务完成。 |
| Prompt injection | 用户攻击 prompt | 试图覆盖 system prompt 的恶意输入。 |

## 延伸阅读

- [Weizenbaum (1966). ELIZA — A Computer Program For the Study of Natural Language Communication](https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf) मूल के नियम आधारित चैटबॉट 论文──
- [Thoppilan et al. (2022). LaMDA: Language Models for Dialog Applications](https://arxiv.org/abs/2201.08239) Google 较晚期的神经聊天机论文,正好在LLM एजेंट 接管之前──
- [Yao et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)  命名 एजेंट लूप पैटर्न 的论文──
- [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents) 2024 वर्ष का उत्पादन निर्देश, 2026 वर्ष तक जारी रहेगा―
- [Greshake et al. (2023). Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) शीघ्र इंजेक्शन 论文。
- [OWASP Top 10 for LLM Applications 2025 — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)  शीघ्र इंजेक्शन  बनें प्राथमिक सुरक्षा चिंता का विषय 
- [AWS — Securing Amazon Bedrock Agents against Indirect Prompt Injections](https://aws.amazon.com/blogs/machine-learning/securing-amazon-bedrock-agents-a-guide-to-safeguarding-against-indirect-prompt-injections/)  व्यावहारिक ऑर्केस्ट्रेशन-लेयर रक्षाएं, जिसमें प्लान-वेरिफाय-एक्ज्यूट और यूजर-कन्फर्मेशन प्रवाह शामिल हैं。
- [EchoLeak (CVE-2025-32711)](https://www.vectra.ai/topics/prompt-injection) अप्रत्यक्ष शीघ्र इंजेक्शन  शून्य-क्लिक डेटा-एक्सफिल्ट्रेशन के लिए एक विशिष्ट सीवीई का कारण बनता है  यह स्पष्ट करता है कि लेखन-प्रवेश के एजेंटों के पास क्यों है  रनटाइम रक्षा की आवश्यकता है 
