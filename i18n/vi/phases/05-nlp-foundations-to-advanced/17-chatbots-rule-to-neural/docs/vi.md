# Chatbot từ Rule-Based đến Neural Re-to LLM Agents

> ELIZA 用模式匹配 回复──DialogFlow 映射意图──GPT Từ trọng lượng 中作答──Claude 运行工具 并进行验证──每个时代都解决上一代最严重失败──

**类型：**Học tập
**语言：**Python
**先修要求：**Giai đoạn 5 · 13 (Câu hỏi trả lời), Giai đoạn 5 · 14 (Hãy tìm thông tin)
**时间：**约75分钟

## 问题

Người dùng nói: Tôi muốn thay đổi chuyến bay của mình. 系统 phải hiểu rõ người dùng muốn gì  thiếu hụt bất kỳ thông tin nào 如何获取这些信息,以及如何完成操作.

Đối với hệ thống ML, cuộc đối thoại rất khó khăn. Lập vào là mở. Lập ra phải liên tục trong nhiều vòng. Hệ thống có thể cần phải thực hiện các hoạt động thực tế.

Chatbot đã trải qua bốn vòng lặp mô hình, mỗi vòng lặp là do thất bại của một loại trên quá rõ ràng.

## 概念

![Chatbot evolution: rule-based → retrieval → neural → agent](../assets/chatbot.svg)

**Rule-based（ELIZA、AIML、DialogFlow）。**Các mô hình viết tay sẽ phù hợp với người dùng nhập và tạo lại. Các bộ phân loại ý định sẽ yêu cầu đường dẫn đến quy trình định trước. Máy sạc sạc sạc thu thập thông tin cần thiết.

**Retrieval-based。**FAQ 风格的系统──Encode 每一组(utterance, response)──运行时,encode 用户消息并检索 最近的已存回复──可以把它理解为Zendesk 经典的类似文章功能──比规则更能处理语句──没有生成,因此没有幻觉──

**Neural（seq2seq）。**Trong cuộc hội thoại ngày học tập về mã hóa-tài mã từ zero bắt đầu tạo lại, nhưng dễ dàng tạo ra các kết quả phổ biến. Tôi không biết, và thực tế di chuyển.

**LLM agents。**Một mô hình ngôn ngữ được đóng gói trong một vòng lặp, được sử dụng để lập kế hoạch,调用 công cụ,并验证结果── nó không có trong một chatbot dài prompt── nó là một vòng lặp đại lý: kế hoạch → call tool → quan sát kết quả → quyết định bước tiếp theo── Lấy lại-làm thế giới đầu tiên(RAG) để nó tránh ảo giác── Tool call 让它 thực sự có thể thực hiện hoạt động── đây là cấu trúc năm 2026──

Đây là bốn mô hình không phải là một thứ tự thay thế. Một chatbot cấp sản xuất năm 2026 sẽ trải qua tất cả bốn con đường: dựa trên quy tắc, sử dụng để xác minh và hành động hủy diệt, tìm kiếm, sử dụng để FAQ, phát triển thần kinh, sử dụng để biểu hiện tự nhiên, đại lý LLM, sử dụng để tìm kiếm mở trong mờ.


```figure
chatbot-lineage
```

##  xây dựng nó

### 步骤 1: Đáp hợp mô hình dựa trên quy tắc

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

20 行实现 ELIZA──这个反思 技巧(我感到悲伤 → 为什么你感到悲伤) 是 Weizenbaum 1966年的经典心理治疗师 demo──到今天仍然有很有教学价值──

### 步骤 2:Tại dạng truy xuất

Ví dụ:`pip install sentence-transformers`(It will draw torch) ✿ 本课可运行 ✿`code/main.py`改用 stdlib Jaccard tương tự, do đó, việc chạy của khóa học không cần phụ thuộc bên ngoài.

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

Ưu điểm từ chối là lựa chọn thiết kế quan trọng. Nếu sự phù hợp tốt nhất không đủ gần, hãy quay lại.`None`, để hệ thống nâng cấp xử lý.

### 步骤 3: tạo ra thần kinh (baseline)

Sử dụng một bộ mã hóa-tử lý theo hướng dẫn nhỏ ((FLAN-T5) hoặc một mô hình trò chuyện tinh tế. Cho đến năm 2026, độc lập được sử dụng để sản xuất vẫn không thể sử dụng, nhưng sẽ là một phần của hệ thống lai để biểu hiện tự nhiên.

```python
from transformers import pipeline

chatbot = pipeline("text2text-generation", model="google/flan-t5-small")

response = chatbot("Respond politely to: Hi there!", max_new_tokens=40)
print(response[0]["generated_text"])
```

### 步骤 4: LLM đại lý vòng lặp

Tương tự sản xuất năm 2026:

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

需要明确三件事──工具是LLM可调用可调用函数──当LLM 返回最终答案而不是工具调用时,循环终止──步骤预算 防止在模糊任务上出现无限循环──

Thực tế sản xuất hệ thống cũng sẽ được thêm vào: lấy lại-làm đất đầu tiên(在每次 LLM call 之前注入相关文档) 防护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护

### 步骤 5: định tuyến lai

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

模式是: đối với bất kỳ nội dung phá hủy  sử dụng các quy tắc xác định, đối với các câu hỏi thường gặp cố định sử dụng truy xuất, phần còn lại hoàn toàn được chuyển cho các đại lý LLM.

## Sử dụng nó

2026 năm của công nghệ:

| Use case | Architecture |
|---------|---------------|
| 预订、支付、身份验证 | Rule-based state machines + slot filling |
| 客户支持 FAQs | 对 curated answers 做 Retrieval |
| 开放式帮助聊天 | 带 RAG + tool calls 的 LLM agent |
| 内部工具 / IDE assistants | 带 tool calls 的 LLM agent（search, read, write） |
| Companion / character chatbots | 带 persona system prompt 的 tuned LLM，并对知识做 retrieval |

生产中始终使用混合路由──没有单一架构能很好处理所有请求──路由层 本身通常是一个小型意向分类器──

##  vẫn sẽ lên line của các chế độ thất bại

- **自信的编造。**Trưởng LLM tuyên bố đã hoàn thành một hoạt động thực tế chưa hoàn thành.
- **Prompt injection。**Người dùng插入覆盖系统 prompt 的文本── 在 OWASP Top 10 for LLM Applications 2025 中排名 LLM01──两种形式:直接注射(直接粘贴到聊天中) 和间接注射(藏在代理 读取的文档、邮件或工具输出中)

  攻击成功率因场景而异. 在通用工具使用和编码基准中,在线模型上测得的成功率约为0.5-8.5%──特定高风险设置 (针对AI编码代理的适应性攻击,脆弱编排) 曾达到约84%──生产 CVE包括EchoLeak(CVE-2025-32711,CVSS 9.3) Microsoft 365 Copilot 中由攻击者控制的邮件触发的零点击数据-exfiltration flaw──

  缓解措施: trong suốt chu kỳ, tất cả mọi người sẽ nhập vào người dùng như không thể tin được; trong các cuộc gọi công cụ  trước khi được xử lý; sẽ kết quả công cụ với chủ prompt 隔离; sử dụng Phương pháp Plan-Verify-Execute (PVE), để cho đại lý lập kế hoạch trước, sau đó thực hiện trước khi theo kế hoạch xác minh mỗi động tác.

  再多的快速工程也无法完全消除这个风险――必须使用外部运行时防护层 ((LLM Guard、allowlist validation、semantic anomaly detection) ⋅
- **Scope creep。**Đặc vụ vì một công cụ gọi  trả lại thông tin liên quan đến biên giới và chuyển hướng từ nhiệm vụ  Các biện pháp giảm thiểu: thu hẹp các hợp đồng công cụ  giữ cho hệ thống nhanh chóng  tập trung  gia nhập đánh giá đối với tỷ lệ ngoài nhiệm vụ 
- **无限循环。**Đại lý 持续调用同一个工具──缓解措施: bước ngân sách、工具调用减倍、关于我们正在取得进展
- **Context window exhaustion。**长对话会把最早的轮次挤出上下文──缓解措施:chữ lại các lượt cũ hơn, lấy lại theo sự tương đồng 相关历史轮次,或使用长文本模型──

## 交付 nó

保存为 `outputs/skill-chatbot-architect.md`- Có thể là:

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

1. **Easy。**Sử dụng 10 mô hình để thực hiện các quy tắc trên trên dựa trên phản ứng.
2. **Medium。**构建一个混合FAQ + LLM fallback──为一个SaaS产品 准备50 条 装FAQ entry,LLM fallback 使用doc.site 上的检索──在100 个真实支持问题 上测量拒绝率和准确性──
3. **Hard。**Sử dụng ba công cụ (đánh giá 50 trường hợp thử nghiệm của các nỗ lực tiêm nhanh) để thực hiện vòng tròn đại lý trên.

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

- [Weizenbaum (1966). ELIZA — A Computer Program For the Study of Natural Language Communication](https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf) 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文── 论文
- [Thoppilan et al. (2022). LaMDA: Language Models for Dialog Applications](https://arxiv.org/abs/2201.08239) Google 较晚期的神经聊天机论文,正好在 LLM đại lý 接管之前
- [Yao et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)  命名 agent loop pattern 的论文。
- [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents) Chỉ thị sản xuất năm 2024 , đến năm 2026 vẫn còn tồn tại.
- [Greshake et al. (2023). Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) Tiêm nhanh 论文。
- [OWASP Top 10 for LLM Applications 2025 — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 让快速注射 成为首要安全关注点排名──
- [AWS — Securing Amazon Bedrock Agents against Indirect Prompt Injections](https://aws.amazon.com/blogs/machine-learning/securing-amazon-bedrock-agents-a-guide-to-safeguarding-against-indirect-prompt-injections/) Ứng dụng phòng thủ lớp dàn xếp thực tế, bao gồm Plan-Verify-Execute và user-confirmation flows。
- [EchoLeak (CVE-2025-32711)](https://www.vectra.ai/topics/prompt-injection) tiêm trực tiếp nhanh chóng  dẫn đến CVE điển hình của việc xóa dữ liệu bằng nấm không. Nó là ví dụ điển hình về lý do tại sao có các đại lý truy cập viết cần bảo vệ thời gian chạy.
