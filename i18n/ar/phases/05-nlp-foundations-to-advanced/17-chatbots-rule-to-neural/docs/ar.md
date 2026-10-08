# أجهزة الدردشة من القواعد إلى العمود العصبي إلى وكلاء القانون

> ELIZA استخدام النمط مطابقة 回复──DialogFlow 映射意图──GPT 从重量 中作答──Claude 运行工具 并进行验证──每个时代都解决了上一代最严重的失败──

**类型：**學习
**语言：**بايثون
**先修要求：**المرحلة 5 · 13 (إجابة على الأسئلة) ، المرحلة 5 · 14 (استعراض المعلومات)
**时间：**حوالي 75 دقيقة

## 问题

يقول المستخدم: أريد تغيير رحلتي. 系统必须弄清楚用户想要什么、缺少哪些信息、如何获取这些信息,以及如何完成这个操作──然后用户又说:等, ماذا لو ألغيت بدلاً من ذلك؟ 系统必须记住上下文、切换任务,并保留状态──

بالنسبة لنظام ML ، فإن الحوار صعب. الإدخال مفتوح. الإخراج يجب أن يبقى متواصلًا في عدة دورات. قد يتطلب النظام إجراء عمليات في العالم الحقيقي.

تمر بناء الشات بوت في دورة من أربع نماذج، كل منها بسبب فشل واحد من الأماكن السابقة كان واضحا جدا حتى تم إدخالها.

## 概念

![Chatbot evolution: rule-based → retrieval → neural → agent](../assets/chatbot.svg)

**Rule-based（ELIZA、AIML、DialogFlow）。**نمط كتابة 手工 匹配用户输入并生成回复──Intent classifiers 将请求路由到预定义流程──Slot-filling state machines 收集必需信息──在它被设计的狭窄范围内表现非常出色──一旦超出范围就立刻失败──仍然会在安全关键领域(银行身份验证、航空预订) 上线,因为这些场景不能容忍幻觉──

**Retrieval-based。**FAQ 风格的系统──Encode 每一组(إذارة، رد)──运行时,encode 用户消息并获取 最接近的已存回复──可以把它理解为Zendesk 经典的类似文章功能──比规则更能处理表达语──没有生成,因此没有幻觉──

**Neural（seq2seq）。**في يوميات الحوار تدريبات الكودر-الديكودر. من الصفر بدأ في توليد الردود.

**LLM agents。**نموذج لغة يتم تحويله في دورة واحدة ، ويتم استخدامها في التخطيط ، استخدام أدوات ،并验证结果── انها ليست مع Long prompt من دردشة البوت── إنها دورة وكيل:خطط → أداة الدعوة → مراقبة النتيجة → القرار الخطوة التالية── استعادة-الأساس الأول(RAG) جعلها تتجنب الهلوسة── دعوات الأداة جعلها قادرة حقا على تنفيذ العملية── هذا هو بنية عام 2026──

هذه النموذج الأربع ليست تغييرات تسلسلية. سيتمّ خضوع 2026 عام للجربة المنتجة من خلال أربع طرق: القواعد القائمة على استخدام التحقق من الهوية والإجراءات المدمرة، الاسترداد باستخدام الأسئلة المتعلقة، وتوليد الأعصاب باستخدام التعبير الطبيعي، وكيل اللم باستخدام استفسار مفتوحة غير واضحة.


```figure
chatbot-lineage
```

## بناءها

### الخطوة 1: تطابق النمط القائم على القواعد

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

20 行实现 ELIZA──这个反思 技巧(我感到悲伤 → 为什么你感到悲伤) 是Weizenbaum 1966年经典的心理治疗师演示──到今天仍然有很有教学价值──

### 步骤 2:استعادتها على أساس

هذا المثال يتطلب`pip install sentence-transformers`(إنها ستستمر في التشغيل)`code/main.py`改用 stdlib Jaccard مماثلة، لذلك لا تحتاج إلى التوقف الخارجي في عملية التدريب.

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

الرفض على أساس العدالة هو اختيار التصميم الرئيسي. إذا كان أفضل التكيف لا يقترب، فرجع.`None`، فلتقوم بتحسين النظام

### 步骤 3: توليد العصب

استخدام مُرمّع مُعدّل صغير مع ضبط التعليمات (FLAN-T5) أو نموذج محادثة معدل. حتى عام 2026، لا يزال لا يُستخدم بشكل منفرد في الإنتاج ((تناقضات، التجوّل خارج الموضوع، والحقيقة الحديث) ، ولكن سيتم استخدامها كجزء من الأنظمة الهجينة للتعبير الطبيعي.

```python
from transformers import pipeline

chatbot = pipeline("text2text-generation", model="google/flan-t5-small")

response = chatbot("Respond politely to: Hi there!", max_new_tokens=40)
print(response[0]["generated_text"])
```

### الخطوة 4: حلقة الوكيل LLM

صيغة الإنتاج لعام 2026:

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

تحتاج إلى تحديد ثلاثة أشياء. أدوات هي LLM يمكن استخدامها في وظائف الدعوة. عندما LLM  يعود إلى الإجابة النهائية بدلا من الدعوة إلى الأدوات.

نظام الإنتاج الحقيقي أيضاً سيتم إضافة:الانتقال-الأول الأرضية (((في كل مكالمة لـ LLM 之前注入相关文档)  محافظات (((لا يوجد تأكيد على رفض الأفعال المدمرة)  ملاحظة (((سجل كل خطوة) ، فضلاً عن التقييمات (((سلوك وكيل التفتيش الذاتي

### 步骤 5: توجيه الهجين

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

模式是: على أي محتوى مدمر  استخدام القواعد التحكمية، على استرداد الأسئلة المثبتة، والباقي كله تسليم إلى وكلاء LLM  هذا هو الممارسة العملية في 2026 عام نظم دعم العملاء 

## استخدمها

2026 سنة التقنية:

| Use case | Architecture |
|---------|---------------|
| 预订、支付、身份验证 | Rule-based state machines + slot filling |
| 客户支持 FAQs | 对 curated answers 做 Retrieval |
| 开放式帮助聊天 | 带 RAG + tool calls 的 LLM agent |
| 内部工具 / IDE assistants | 带 tool calls 的 LLM agent（search, read, write） |
| Companion / character chatbots | 带 persona system prompt 的 tuned LLM，并对知识做 retrieval |

生产中始终使用混合路由──没有单一架构能很好处理所有请求──路由层 本身通常是一个小型意向分类器──

##  مازال سيتم تشغيله

- **自信的编造。**وكيل الـ LLM  دعوا أنهى عمليات غير مكتملة في الواقع ∙ تدابير التخفيف: نتائج التحقق، سجل مكالمات الأداة، لا يسمح أبداً لـ LLM في حالة عدم إعادة أداة ناجحة بـ دعوا أنفسهم قد أكملوا شيئاً ∙
- **Prompt injection。**المستخدم插入覆盖系统 prompt 的文本──在 OWASP Top 10 for LLM Applications 2025 中排名 LLM01──两种形式: الحقن المباشر(直接粘贴到聊天中) والحقن غير المباشر(藏在代理 读取的文档、邮件或工具输出中)──

   نسبة نجاح الهجوم حسب المشهد  في استخدام الأدوات العامة ومع المعايير التشفير، في النماذج الحدودية، ارتفع نسبة نجاح النماذج حوالي 0.5 إلى 8.5%‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

  缓解措施: في كل دورة الدورة سوف يُنظر إلى المستخدم على أنه غير مؤكد؛ في مكالمات الأداة  قبل إجراء التطهير؛ و سوف تُفصل نتائج الأداة مع الرئيس التسريع  فصل؛ استخدام خطة التحقق-إجراء  PVE) النموذج، دع الوكيل التخطيط المسبق، ثم في التنفيذ قبل وفقا لهذا المخطط التحقق من كل حركة  هذا سيمنع نتائج الأداة دخول حركة غير المخططة الجديدة ؛ على الإجراءات المدمرة طلب المستخدم تأكيد؛ على نطاق الأداة  تطبيق أقل امتيازات 

  إعادة هندسة سريعة أيضا لا يمكن القضاء على هذا风险 تماما. يجب استخدام طبقات الدفاع الخارجية للوقت التشغيل.
- **Scope creep。**العميل لأن أداة مكالمة ردت على المعلومات ذات الصلة إلى الحدود وتحويل المهام  التكفيف: تقييد عقود الأداة  الحفاظ على النظام على التأجيل  التركيز  المشاركة في تقييمات لمعدل خارج المهام 
- **无限循环。**العميل 持续调用同一个工具──缓解措施:خطوة ميزانية、工具调用减倍、关于我们正在取得进展
- **Context window exhaustion。**长对话会把最早的轮次挤出上下文──缓解措施:الجمع في المواقف القديمة، والحصول على التشابهات 相关历史轮次، أو استخدام نموذج سياق طويل──

## 交付 it

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

## التدريب

1. **Easy。**استخدام 10 أنماط لتنفيذ الرد القائم على القواعد المذكورة أعلاه:
2. **Medium。**构建一个混合FAQ + LLM fallback──为一个SaaS产品 准备 50 条收藏FAQ条目,LLM fallback 使用文档网站 上的检索──在 100 个真实支持问题 上测量拒绝率 和准确性──
3. **Hard。**استخدام ثلاث أدوات ((بحث 、قراءة ٬بيانات المستخدم ٬رسالة البريد الإلكتروني) لتنفيذ حلقة العميل أعلاه‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

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

- [Weizenbaum (1966). ELIZA — A Computer Program For the Study of Natural Language Communication](https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf) مباحثات الروبوتات القائمة على القواعد
- [Thoppilan et al. (2022). LaMDA: Language Models for Dialog Applications](https://arxiv.org/abs/2201.08239) Google 较晚期的神经聊天机器人论文,正好在LLM وكلاء 接管之前
- [Yao et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)  命名代理循环模式 的论文──
- [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents) توجيهات الإنتاج لعام 2024، حتى عام 2026 لا تزال قائمة
- [Greshake et al. (2023). Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) الحقن السريع 论文。
- [OWASP Top 10 for LLM Applications 2025 — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 让快速注射 成为首要安全关注点排名──
- [AWS — Securing Amazon Bedrock Agents against Indirect Prompt Injections](https://aws.amazon.com/blogs/machine-learning/securing-amazon-bedrock-agents-a-guide-to-safeguarding-against-indirect-prompt-injections/) دفاعات طبقة التوسيقية المستخدمة، بما في ذلك خطة التحقق من التنفيذ و تدفقات تأكيد المستخدم
- [EchoLeak (CVE-2025-32711)](https://www.vectra.ai/topics/prompt-injection) الحقن الفوري غير المباشر  يؤدي إلى إزالة البيانات من النقرة صفر النقر  CVE النموذجي.
