# Chatbotlar  Kurallara dayalı Neural Yeniden LLM ajanlarına

> ELIZA Kullanımlı bir örneğe uymak için, DialogFlow 映射意向──GPT 中作答──Claude 运行工具 并进行验证──每个时代都解决了上一代最严重的失败──

**类型：**Öğrenme
**语言：**Python
**先修要求：**5 · 13 aşaması (Soru yanıtlama), 5 · 14 aşaması (Mağlumat alımı)
**时间：**75 dakika kadar .

## 问题

Kullanıcı:  Uçuşumu değiştirmek istiyorum. 系统 must figure out what the user wants  缺少哪些信息 如何获取这些信息,以及如何完成这个操作── user says:  等待,如果我取消? 系统 must remember上下文、切换任务,并保留状态──

ML sistemleri için, sohbet çok zor. Giriş açık bir şekilde yapılır. Çıkış çok sayıda kez devam etmesi gerekir. Sistem gerçek dünya için bir işlem yapması gerekebilir.

Chatbot yapısı, her biri, önceki bir başarısızlıktan dolayı ortaya çıkmış dört paradigma döngüsüne rastlanmıştır.

## 概念

![Chatbot evolution: rule-based → retrieval → neural → agent](../assets/chatbot.svg)

**Rule-based（ELIZA、AIML、DialogFlow）。**Handwerk yazma kalıpları 匹配用户输入并生成回复──Intent classifiers will request route through to predefined flow──slot-filling state machines 收集必需信息──在它设计的狭窄范围内表现非常出色──一旦超出范围就立刻失败──仍然会在安全关键领域──银行身份验证、航空预订) 上线,因为这些场景不能容忍幻觉──

**Retrieval-based。**FAQ 风格的系统──Encode 每一组(utterance, response)──运行时,encode 用户消息并获取 最近的已存回复── Zendesk 经典的类似文章功能──比规则更能处理抛词──没有生成,因此没有幻觉──

**Neural（seq2seq）。**Dialog日志 üzerinde eğitimli kodlayıcı-dekoderler. Zero'dan başlayan tekrarlamalar üretilmektedir. 流, ancak kolayca genel olarak üretilen çıkışlar üretilmektedir.

**LLM agents。**Bir dil modeli, bir döngü içinde paketlenir, planlama, arama araçları,并验证结果──它不是带着长快的聊天机──它是一个代理循环:plan → call tool → observe result → decide next step──恢复-first grounding(RAG) 让它避免幻觉──工具调用──让它真正能够执行操作──这是2026年的架构──

Bu dört paradigma sırayla değişmez. 2026 yılında üretilen bir chatbot, dört yolla geçecek: kural tabanlı, kimlik doğrulama ve yıkıcı eylemler için kullanılır, geri kazanma, sorular sormak, sinir jenerasyonu, doğal ifade, LLM ajanı, açık sorgular için kullanılır.


```figure
chatbot-lineage
```

## Yapın onu.

### 步骤1: Kurallara dayalı örneğe eşleşme

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

20 行实现 ELIZA──这个反思 技巧(我感到悲伤 → 你为什么感到悲伤) 是 Weizenbaum 1966年经典的心理治疗师 demo──至今仍然有很有教学价值──

### 步骤 2:Çalışmaya dayalı sıklıkla sorulan sorular

Bu örnek bir parça lazım.`pip install sentence-transformers`(It will draw torch) │本课可运行 行程 │`code/main.py`改用 stdlib Jaccard benzerliği, böylece ders sürüşü zaman dış bağımlılık gerektirmez.

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

 Eğlence tabanlı reddetme, önemli bir tasarım seçeneğidir.`None`Sistemin yükseltilmesi için.

### 步骤 3: sinir jenerasyonu (baseline)

Bir küçük talimat ayarlı kodlayıcı-dekodör kullanın (FLAN-T5) veya ince ayarlı bir konuşma modeli kullanın. 2026 yılına kadar, üretim için ayrı ayrı kullanılmaz.

```python
from transformers import pipeline

chatbot = pipeline("text2text-generation", model="google/flan-t5-small")

response = chatbot("Respond politely to: Hi there!", max_new_tokens=40)
print(response[0]["generated_text"])
```

### 步骤 4:LLM ajan döngüsü

2026 yılındaki üretim biçimi:

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

需要明确三件事──工具是LLM调用可调用函数──当LLM 返回最终答案而不是工具调用时,循环终止──Step budget 防止在模糊任务上出现无限循环──

Gerçek üretim sistemi de dahil olacak: geri alınma-birinci yerleştirme((her bir LLM çağrısında 之前注入相关文档) 防护 (Guardails)

### 步骤 5: hibrit yönlendirme

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

Modem: herhangi bir yıkıcı  içeriğe deterministik kurallar kullanmak, sabit FAQ kullanmak, geri kalanı LLM ajanlarına teslim etmek.

## Kullan

2026 yılının teknolojisi:

| Use case | Architecture |
|---------|---------------|
| 预订、支付、身份验证 | Rule-based state machines + slot filling |
| 客户支持 FAQs | 对 curated answers 做 Retrieval |
| 开放式帮助聊天 | 带 RAG + tool calls 的 LLM agent |
| 内部工具 / IDE assistants | 带 tool calls 的 LLM agent（search, read, write） |
| Companion / character chatbots | 带 persona system prompt 的 tuned LLM，并对知识做 retrieval |

生产中始终使用混合路由──没有单一架构能很好处理所有请求──路由层 本身通常是一个小型意向分类器──

##                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              

- **自信的编造。**LLM ajanı, aslında tamamlanmamış işlemleri tamamladığını iddia ediyor.
- **Prompt injection。**User插入覆盖 system prompt 的文本── OWASP Top 10 for LLM Applications 2025 中排名 LLM01──两种形式: doğrudan enjeksiyon(直接粘贴到聊天中) ve dolaylı enjeksiyon(藏在代理 读取的文档、邮件或工具输出中)

  攻撃成功率因场景而异──在通用工具使用和编码基准中,境界模型上测得的成功率是0.5-8.5%──特定高风险设置──针对AI编码代理的适应性攻击──脆弱的管弦化) 曾达到约84%──制作 CVEs包括EchoLeak(CVE-2025-32711,CVSS 9.3) Microsoft 365 Copilot 中由攻击者控制的邮件触发的零点数据-exfiltration flaw──

  缓解措施: tüm döngü boyunca kullanıcıların girişini inanılmaz olarak görüyorlar; araç çağrılarında  önce temizlenirler; araç çıkışlarını ana prompt 隔離 ile ayırırlar; Plan-Verify-Execute (PVE) modunu kullanırlar, ajanın önceden plan yapmasını sağlarlar, sonra da planın ardından gerçekleştirilmesini sağlarlar. Bu da araç sonuçlarını yeni planlanmamış hareketlere dahil etmesini engeller; yıkıcı eylemlere karşı kullanıcıların onaylanması gerektirir; araç kapsamına karşı en az ayrıcalık uygulanır.

  Ayrıca, bu riskin tamamen ortadan kaldırılması mümkün değil. Dış çalıştırma savunma katmanlarını kullanmak gerekir.
- **Scope creep。**Bir araç çağrısı için ajan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
- **无限循环。**Agent 持续调用同一个工具──缓解措施:step budget──工具调用减倍──关于我们正在取得进展的LLM评审──
- **Context window exhaustion。**长对话会把最早的轮次挤出上下文──缓解措施:büyük dönümleri özetlemek, benzerliklere göre geri almak 相关历史轮次,或使用长文本模型──

## - Söyle.

保存为 `outputs/skill-chatbot-architect.md`- ...

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

1. **Easy。**Bu nedenle, bu sorunun cevabını bir kez daha kullanın.
2. **Medium。**构建一个混合FAQ + LLM fallback──为一个SaaS产品 准备50条装FAQ入口,LLM fallback 使用doc网站 上的检索──在100个真实支持问题 上测拒绝率和准确性──
3. **Hard。**Üç araç kullanmakla (search,read,user,data,send-email) üstteki ajan döngüsünü gerçekleştirmek için kullanmakla.

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

- [Weizenbaum (1966). ELIZA — A Computer Program For the Study of Natural Language Communication](https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf) 原始的规则基的聊天机论文──
- [Thoppilan et al. (2022). LaMDA: Language Models for Dialog Applications](https://arxiv.org/abs/2201.08239) Google 较晚期的神经聊天机论文,正好在LLM ajanları 接管之前──
- [Yao et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)  命名 agent loop pattern 的论文。
- [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents)2024 yılındaki üretim yönlendirmesi, 2026 yılına kadar hâlâ geçerlidir.
- [Greshake et al. (2023). Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) hızlı enjeksiyon 论文。
- [OWASP Top 10 for LLM Applications 2025 — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 让快速注射 成为首要安全关注点排名──
- [AWS — Securing Amazon Bedrock Agents against Indirect Prompt Injections](https://aws.amazon.com/blogs/machine-learning/securing-amazon-bedrock-agents-a-guide-to-safeguarding-against-indirect-prompt-injections/) Praktik orkestrasyon katman savunmaları, Plan-Verify-Execute ve kullanıcı onay akışları dahil olmak üzere
- [EchoLeak (CVE-2025-32711)](https://www.vectra.ai/topics/prompt-injection) dolaylı hızlı enjeksiyon  sıfır tıklama ile veri filtrasyonu sonuçlandırır tipik CVE── bu neden yazma erişimine sahip ajanların                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
