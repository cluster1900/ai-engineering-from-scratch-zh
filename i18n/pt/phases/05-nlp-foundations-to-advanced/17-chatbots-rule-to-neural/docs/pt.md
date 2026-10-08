# Chatbots  De Regras Baseadas para Neural Recuperando para LLM Agentes

> ELIZA Use pattern matches 回复──DialogFlow 映射意向──GPT 从重量 中作答──Claude 运行工具 并进行验证──每个时代都解决了上一代最严重失败──

**类型：**- aprendizagem
**语言：**Python
**先修要求：**Fase 5 · 13 (Resposta à pergunta), Fase 5 · 14 (Recebida de informações)
**时间：**Cerca de 75 minutos

## 问题

O usuário diz:  Eu quero mudar meu voo. 系统必须弄清楚用户想要什么、缺少哪些信息、如何获取这些信息,以及如何完成这个操作──然后用户又说:等,如果我取消吗? 系统必须记住上下文、切换任务,并保留状态──

Para o sistema de controle de dados, o diálogo é difícil. A entrada é aberta. A saída deve permanecer conectada em várias rotas. O sistema pode precisar de uma operação de execução no mundo real.

A estrutura do chatbot passou por quatro ciclos de paradigmas, cada um deles devido ao fracasso do anterior, que foi muito evidente até ser introduzido.

## 概念

![Chatbot evolution: rule-based → retrieval → neural → agent](../assets/chatbot.svg)

**Rule-based（ELIZA、AIML、DialogFlow）。**Os padrões de escrita do manual 匹配用户输入并生成回复──Intent classifiers将请求路由到预定义流程──Slot-filling state machines 收集必需信息──Performance very excellent──在它设计的狭窄范围内表现非常出色──一旦超出范围就立刻失败──仍然会在安全关键领域──银行身份验证、航空预订) 上线,因为这些场景不能容忍幻觉──

**Retrieval-based。**FAQ 风格的系统──Encode 每一组(utterance, response)──运行时,encode 用户消息并获取 最近的已存回复── pode ser entendido como artigos 功能──比规则更能处理抛词──没有生成,因此没有幻觉──

**Neural（seq2seq）。**Em seu diário de diálogo, o encoder-decoder foi treinado. Desde o zero começa a gerar respostas.

**LLM agents。**Um modelo de linguagem é empacotado em um ciclo, usado para planejar, utilizar ferramentas, e verificar resultados. Não é um chatbot de longa data. É um agente: plano → ferramenta de chamada → observar o resultado → decidir o próximo passo. Retorno-primeiro a terra.

Este paradigma não é uma substituição por ordem. Um chatbot de classe de produção de 2026 irá passar por todos os quatro caminhos: baseado em regras, usado para identificação e ações destrutivas, recuperação, usado para FAQ, geração neural, usado para expressão natural, agente LLM, usado para uma consulta aberta e confusa.


```figure
chatbot-lineage
```

## Construí-lo

### 步骤 1: padrão baseado em regras

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

20 行实现 ELIZA──这个反思 技巧(我感到悲伤 → 你为什么感到悲伤) é a demo do Weizenbaum 1966 经典的心理治疗师──至今仍然有很有教学价值──

### 步骤 2: baseada em recuperação (FAQ)

Este exemplo é necessário.`pip install sentence-transformers`(Itããraçar torcha) ⋅本课可运行`code/main.py`改用 stdlib Jaccard similarity, portanto, o curso não precisa de dependência externa.

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

Rejeição baseada em limiar é uma escolha de design fundamental. Se o melhor padrão não for suficientemente próximo, retorne.`None`, fazer o sistema subir de nível.

### 步骤 3: geração neural (base line)

Utilize um encoder-decoder com instrução pequena afinada (FLAN-T5) ou um modelo de conversação afinado. Até 2026, o solo solo será usado para produzir ainda indispensável (contradição, deriva fora do tópico, facto de falar), mas será usado como parte dos sistemas híbridos para expressão natural (dialogueGPT).

```python
from transformers import pipeline

chatbot = pipeline("text2text-generation", model="google/flan-t5-small")

response = chatbot("Respond politely to: Hi there!", max_new_tokens=40)
print(response[0]["generated_text"])
```

### 步骤 4: Loop de agente LLM

Formação de produção de 2026:

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

需要明确三件事──Tools is LLM pode ser utilizado para funções chamáveis──When LLM 返回最終答案而不是 tool call 时,循环终止──Step budget 防止在模糊任务上出现无限循环──

O sistema de produção real também será incluído: recuperação-primeira terração ((( em cada chamada de LLM  之前注入相关文档) 防护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护护

### 步骤 5: roteamento híbrido

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

Modelo é: para qualquer conteúdo destrutivo  usar regras deterministas, para FAQ fixas  usar recuperação, o restante todo entregue aos agentes LLM ⋅ é essa a prática dos sistemas de apoio ao cliente de 2026 ⋅

## Use-o

Tecnologia de 2026:

| Use case | Architecture |
|---------|---------------|
| 预订、支付、身份验证 | Rule-based state machines + slot filling |
| 客户支持 FAQs | 对 curated answers 做 Retrieval |
| 开放式帮助聊天 | 带 RAG + tool calls 的 LLM agent |
| 内部工具 / IDE assistants | 带 tool calls 的 LLM agent（search, read, write） |
| Companion / character chatbots | 带 persona system prompt 的 tuned LLM，并对知识做 retrieval |

生产中始终使用混合路由──没有单一架构能很好处理所有请求──路由层 本身通常是一个小型意向分类器──

##  ainda estarão em linha de modo de falha

- **自信的编造。**Agente de LLM  afirma ter concluído uma operação praticamente não concluída ∙ medidas de alívio: resultados de verificação, registar chamadas de ferramentas, absolutamente não permite que o LLM em caso de não retornar ferramenta de sucesso, afirme ter concluído algo ∙
- **Prompt injection。**Usador插入覆盖系统 prompt 的文本──在 OWASP Top 10 for LLM Applications 2025 中排名 LLM01──两种形式:injection directe(直接粘贴到聊天中) 和间接injection(藏在代理 读取的文档、邮件或工具输出中)──

  ATAKING SUCCESS RATE BY SCENESHOW BY SCENESHOW.  Em modelos de referência de uso de ferramentas e codificação, a taxa de sucesso obtida em modelos de fronteira é de cerca de 0,5-8,5%  Especific high risk setup (para ataques adaptativos de agentes de codificação por IA  orquestração vulnerável) alcançou cerca de 84%  Produção de CVEs incluindo EchoLeak  CVE-2025-32711, CVSS 9.3)  Microsoft 365 Copilot  Falha de exfiltração de dados de cero-clique provocada por e-mail de ataques controlados pelo atacante 

  缓解措施: em todo o ciclo todos os usuários entrarão como incríveis; antes de as chamadas de ferramentas  realizarão a saneamento; separarão as saídas da ferramenta do principal prompt  isolação; usarão o modelo Plan-Verify-Execute (PVE), deixando o agente planejar, então, em execução, verificando cada movimento de acordo com o plano.

  Também não é possível eliminar completamente este risco.
- **Scope creep。**Agente porque uma chamada de ferramenta  devolveu informações relacionadas à margem e desviação da tarefa  medidas de alívio: contractos de ferramentas estreitas; manter o sistema rápido  foco; participar em avaliações de taxas de fora da tarefa 
- **无限循环。**Agente continuem a utilizar a mesma ferramenta ∙ medidas de alívio: passo orçamento ∙ desdobramento da chamada de ferramenta ∙ sobre o progresso que estamos a fazer ∙ do juiz de LLM ∙
- **Context window exhaustion。**长对话会把最早的轮次挤出上下文──缓解措施: resumir as viradas mais antigas, recuperar as rotas históricas relacionadas, ou usar um modelo de longo contexto──

## Entrega-o

保存为 `outputs/skill-chatbot-architect.md`- Não .

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

1. **Easy。**Use 10 padrões para o bot de encomenda de café  implementar a resposta baseada nas regras acima.
2. **Medium。**Construir uma FAQ híbrida + Fallback LLM── para um produto SaaS  preparar 50 条 entradas em lata de FAQ, Fallback LLM Utilize docs site  上的检索──在 100 个真实支持问题 上测量拒绝率 和准确性──
3. **Hard。**Use três ferramentas (search,read,user,data,send-email) para implementar o loop de agente acima. Use 50 个测试场景运行评估的包含即时注射尝试. Use 50 个测试场景运行评估. Use 50 个测试场景运行评估. Use 50 个测试场景运行评估. Use 50 个测试场景运行评估. Use three tools.

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

- [Weizenbaum (1966). ELIZA — A Computer Program For the Study of Natural Language Communication](https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf) Origins de regras baseadas chatbot 论文。
- [Thoppilan et al. (2022). LaMDA: Language Models for Dialog Applications](https://arxiv.org/abs/2201.08239) Google 较晚期的神经聊天机论文,正好在 LLM agentes 接管之前──
- [Yao et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)  命名 agent loop pattern 的论文──
- [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents) A orientação de produção de 2024 anos, até 2026 anos ainda em vigor.
- [Greshake et al. (2023). Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) Injecção rápida 论文。
- [OWASP Top 10 for LLM Applications 2025 — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 让快速注射 成为首要安全关注点排名──
- [AWS — Securing Amazon Bedrock Agents against Indirect Prompt Injections](https://aws.amazon.com/blogs/machine-learning/securing-amazon-bedrock-agents-a-guide-to-safeguarding-against-indirect-prompt-injections/) Defesas de camada de orquestração práticas, incluindo fluxos de planejamento-verificação-execução e confirmação do usuário。
- [EchoLeak (CVE-2025-32711)](https://www.vectra.ai/topics/prompt-injection) injeção direta de prompt  conduzir a zero-clique de dados-exfiltration típico CVE── é um exemplo de porquê possuir agentes de acesso de escrita  necessita de defesas de tempo de execução──
