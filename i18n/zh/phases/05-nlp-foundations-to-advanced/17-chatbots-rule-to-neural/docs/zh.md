# 聊天机器人从规则到神经再到法学代理

> 通过使用模式匹配 回复──对话流 映射意图──GPT 从重量 中作答──克劳德 运行工具 并进行验证──每时代都解决了上一代最严重的失败──

**类型：**学习 课程
**语言：**字符串
**先修要求：**五期·13期 (回答问题),五期·14期 (获取信息)
**时间：**约75分钟

## 问题

用户说:我想改变我的航班. 系统必须弄清楚用户想要什么,缺少哪些信息,如何获取这些信息,以及如何完成操作.

对于 ML 系统来说,对话很难.输入是开放式的.输出必须在多轮中保持连贯.系统可能需要对现实世界执行操作进行更改.

聊天机器人架构经历了四种范式的循环,每一个都是由于上一个的失败太明显才被引入了.

## 概念

![Chatbot evolution: rule-based → retrieval → neural → agent](../assets/chatbot.svg)

**Rule-based（ELIZA、AIML、DialogFlow）。**手工编写模式 匹配用户输入并生成回复──意图分类器将请求路由到预定义流程──插槽填充状态机收集必要信息──在设计的狭窄范围内表现出色──一旦超出范围就立刻失败──仍然会在安全关键领域──银行身份验证、航空预订) 上线,因为这些场景不能容忍幻觉──

**Retrieval-based。**编码 每一组的表达,响应) 运行时,编码 用户消息并检索最接近的已存回复. 可以将其理解为Zendesk经典的类似文章功能.比则更能处理句子.

**Neural（seq2seq）。**在对话日志上训练的编码器-解码器──从零开始生成回复──流,但很容易产生泛泛的输出──我不知道) 和事实漂移──始终无法可靠地贴合主题──这就是谷歌、Facebook和微软在2016-2019年推出令人失望的聊天机器人的原因──

**LLM agents。**一个语言模型被包装在一个循环中,用于规划,调用工具,并验证结果――它不是带着长快的聊天机. 它是一个代理循环:计划 →调用工具 →观察结果 →决定下一步.

这四种范式不是顺序替代关系. 一个2026年生产级聊天机器人将经历所有四种路径:基于规则的使用身份验证和破坏性行动,恢复的使用FAQ,神经生成的使用自然表达,LLM代理的使用模糊的开放式查询.


```figure
chatbot-lineage
```

## 构建它

### 步骤1:基于规则的模式匹配

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

我感到悲伤 → 你为什么感到悲伤) 是1966年伟森巴姆经典的心理治疗师演示.

### 步骤2:基于检索的问题

这样一个例子需要`pip install sentence-transformers`现在,我可以做什么?`code/main.py`改用了Jaccard类似性的方法,因此课程运行时不需要外部依赖.

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

基于门的拒绝是关键设计选择.`None`让系统升级处理.

### 步骤3:神经生成 (基线)

使用小型指示调节编码器-解码器(FLAN-T5) 或一个精细调节的对话模型──直到2026年,单独用于生产仍然不可用,但将作为混合系统的一部分用于自然表达──DialogGPT风格的解码器-仅模型需要显式的轮分离器和EOS处理则才能生成连贯回复;FLAN-T5文本2文字管道可以直接作为教学示例使用──

```python
from transformers import pipeline

chatbot = pipeline("text2text-generation", model="google/flan-t5-small")

response = chatbot("Respond politely to: Hi there!", max_new_tokens=40)
print(response[0]["generated_text"])
```

### 步骤 4:LLM代理循环

2026年生产形态:

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

需要明确三件事――工具是LLM可调用可调用的函数――当LLM返回最终答案而不是工具调用时,循环终止――步骤预算 防止在模糊任务上出现无限循环――

实际生产系统也会加入:检索-第一地址(在每次LLM电话之前注入相关文档) 防护护(没有确认就拒绝破坏性行为)

### 步骤 5:混合路由

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

模式是:对任何破坏性内容使用确定性规则,对固定问题查询使用检索,其余全部交给LLM代理.

## 使用它

2026 年技术:

| Use case | Architecture |
|---------|---------------|
| 预订、支付、身份验证 | Rule-based state machines + slot filling |
| 客户支持 FAQs | 对 curated answers 做 Retrieval |
| 开放式帮助聊天 | 带 RAG + tool calls 的 LLM agent |
| 内部工具 / IDE assistants | 带 tool calls 的 LLM agent（search, read, write） |
| Companion / character chatbots | 带 persona system prompt 的 tuned LLM，并对知识做 retrieval |

生产中始终使用混合路由.没有单一架构能很好处理所有请求.

## 仍会上线的失败模式

- **自信的编造。**士官声称完成实际上没有完成的操作.缓解措施:验证结果,记录工具调用,绝不允许士官在没有成功工具的回报的情况下声称自己完成了某事.
- **Prompt injection。**用户插入覆盖系统提示的文本──在OWASP上排名的LLM申请2025中排名的LLM01──两种形式:直接注射(直接粘贴到聊天中) 和间接注射(藏在代理 读取的文档、邮件或工具输出中)──

  攻击成功率因场景而异. 在通用工具使用和编码基准中,测试的成功率约为0.5-8.5%. 特定高风险设置 (针对AI编码代理的适应性攻击,可攻击性编辑) 已达到约84%. 生产的CVE包括EchoLeak (CVE-2025-32711,CVSS 9.3) 微软 365 Copilot 中由攻击者控制的邮件触发的零点击数据泄漏漏错误.

  缓解措施:在整个循环中都将用户输入视为不可信;在工具调用之前进行清洁;将工具输出与主提示隔离;使用计划-验证-执行 (PVE) 模式,让代理先规划,然后在执行前根据该计划验证每个动作(这将阻止工具结果进入新的未规划动作);对破坏性行动 要求用户确认;对工具范围 应用最小特权.

  再多的快速工程也无法完全消除这个风险――必须使用外部运行时代防御层――LLM Guard、允许验证、语义异常检测)
- **Scope creep。**由于某个工具调用 返回边缘相关信息而偏离任务――缓解措施:缩小工具合同;保持系统提示 聚焦;加入针对非任务率的评估――
- **无限循环。**代理 持续调用同一个工具――缓解措施:步骤预算――工具调用减倍――关于我们正在取得进展的LLM法官――
- **Context window exhaustion。**长对话会把最早的轮次挤出上下文――缓解措施:总结较老的轮次,根据相似性检索 相关历史轮次,或使用长文本模型――

## 交付它

保存为`outputs/skill-chatbot-architect.md`其他:

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

## 练习

1. **Easy。**用10个模式实现上述规则的响应.测试边界情况:双订单,修改,取消,不清楚的意图.
2. **Medium。**构建一个混合FAQ+LLM倒退――为一个SaaS产品 准备50条装FAQ条目,LLM倒退 使用文档网站上的检索――在100个真实支持问题上测量拒绝率和准确性――
3. **Hard。**使用三个工具 (搜索,阅读,用户数据,发送电子邮件) 实现上述代理循环.

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

- [Weizenbaum (1966). ELIZA — A Computer Program For the Study of Natural Language Communication](https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf) 原始的基于规则的聊天机器人论文
- [Thoppilan et al. (2022). LaMDA: Language Models for Dialog Applications](https://arxiv.org/abs/2201.08239)谷歌 较晚期的神经聊天机器人论文,正好在LLM代理 接管之前.
- [Yao et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) 命名代理循环模式 的论文.
- [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents) 2024 年的生产指导,到2026 年仍在成立.
- [Greshake et al. (2023). Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173)快速注射 论文。
- [OWASP Top 10 for LLM Applications 2025 — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 让快速注射成为首要安全关注点排名.
- [AWS — Securing Amazon Bedrock Agents against Indirect Prompt Injections](https://aws.amazon.com/blogs/machine-learning/securing-amazon-bedrock-agents-a-guide-to-safeguarding-against-indirect-prompt-injections/) 实用的配套层防御,包括计划验证执行和用户确认流程──
- [EchoLeak (CVE-2025-32711)](https://www.vectra.ai/topics/prompt-injection)间接即时注射 导致零点击数据泄露的典型CVE──它说明为什么拥有写入访问的代理需要运行时间防御的参考案例──
