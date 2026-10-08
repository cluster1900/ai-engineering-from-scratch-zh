# Chatbots  de la règle à la neuronale à la loi à l' agent

> ELIZA Utilise des correspondances de motifs 回复──DialogFlow 映射意向──GPT 从重量 中作答──Claude 运行工具 并进行验证──每个时代都解决了上一代最严重失败──

**类型：**Apprendre à apprendre
**语言：**Python
**先修要求：**Phase 5 · 13 (Réponses à la question), phase 5 · 14 (Récupération des informations)
**时间：**À environ 75 minutes.

##  problématique

L'utilisateur dit:  Je veux changer mon vol. 系统 must figure out what the user wants 、 missing ̇what information ̇ how to get these information, and how to complete this operation‬ puis l'utilisateur dit:  wait, what if I cancel instead? 系统 must remember on down文、切换任务,并保留状态‬

Pour les systèmes ML, le dialogue est difficile. L'entrée est ouverte. La sortie doit être maintenue en plusieurs routines. Le système peut avoir besoin d'une opération d'exécution dans le monde réel.

L'architecture de chatbot a connu quatre cycles de paradigmes, chacun étant dû à l'échec de l'un des précédents.

## 概念

![Chatbot evolution: rule-based → retrieval → neural → agent](../assets/chatbot.svg)

**Rule-based（ELIZA、AIML、DialogFlow）。**Les modèles de rédaction manuelle correspondent à l'entrée et à la production de réponses. Les classifiants d'intention vont demander le chemin du processus de définition préalable. Les machines de remplissage de machines de jeu rassemblent les informations nécessaires.

**Retrieval-based。**Le code de chaque groupe de réponses est utilisé pour la rédaction de la version finale de la version finale de Zendesk.

**Neural（seq2seq）。**Le codeur-décoeur de formation dans le journal de dialogue. De zéro à zéro, il est facile de générer des réponses.

**LLM agents。**Un modèle de langage est emballé dans un cycle, utilisé pour planifier, modifier outils,并验证结果── il n'est pas avec un chatbot de longue demande── il est un agent:plan → call tool → observer le résultat → décider de la prochaine étape──Retrieval-first grounding(RAG) Laissez-le éviter les hallucinations──Les appels d'outils 让它真正能够执行操作── voilà l'architecture de l'année 2026──

Ce modèle n'est pas un modèle de remplacement. Un chatbot de production de 2026 traversera quatre routes: basé sur des règles, utilisé pour l'identification et les actions destructives, utilisé pour la récupération, utilisé pour les FAQ, génération neurale, utilisé pour l'expression naturelle, agent LLM, utilisé pour une enquête ouverte et floue.


```figure
chatbot-lineage
```

## - Je le construis.

### 步骤 1: correspondance de modèles basée sur des règles

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

20 行实现 ELIZA──这个反思 技巧(I feel sad → Why do you feel sad) 是Weizenbaum 1966 经典的心理治疗师 демо──至今仍然有很有教学价值──

### 步骤 2:questions fréquentes basées sur la récupération

Cet exemple est nécessaire.`pip install sentence-transformers`(It'll pull the torch) ∼ 本课可运行 ∼`code/main.py`改用 stdlib Jaccard similarity, donc le cours fonctionne sans avoir besoin de dépendance externe.

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

Le refus basé sur le seuil est un choix de conception clé. Si le meilleur équilibre n'est pas assez proche, retournez.`None`, faire le système de traitement de mise à niveau.

### 步骤 3: génération neurale

Utilisez un encodeur-décoeur à petite instruction réglé (FLAN-T5) ou un modèle de conversation finement réglé (jusqu'en 2026); vous pouvez utiliser le même modèle pour produire des textes en ligne.

```python
from transformers import pipeline

chatbot = pipeline("text2text-generation", model="google/flan-t5-small")

response = chatbot("Respond politely to: Hi there!", max_new_tokens=40)
print(response[0]["generated_text"])
```

### 步骤 4: boucle d'agent de la LLM

Forme de production de l'année 2026:

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

Les outils sont des fonctions appelées à utiliser par le LLM. Lorsque le LLM reçoit une réponse finale au lieu d'appeler un outil, le cycle se termine.

Réponse: Le système de production réelle est également inclus dans le système de production réelle.

### 步骤 5: routage hybride

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

模式是: pour tout contenu destructeur  utiliser des règles déterministes, pour les FAQ fixes  utiliser la récupération, le reste de tout remettre aux agents LLM ⋅ c'est la pratique pratique des systèmes de soutien client de 2026 ⋅

## Utilisez-le

2026:

| Use case | Architecture |
|---------|---------------|
| 预订、支付、身份验证 | Rule-based state machines + slot filling |
| 客户支持 FAQs | 对 curated answers 做 Retrieval |
| 开放式帮助聊天 | 带 RAG + tool calls 的 LLM agent |
| 内部工具 / IDE assistants | 带 tool calls 的 LLM agent（search, read, write） |
| Companion / character chatbots | 带 persona system prompt 的 tuned LLM，并对知识做 retrieval |

Il n'y a pas de structure unique qui puisse traiter toutes les requêtes.

##  encore sur la ligne des modes d'échec

- **自信的编造。**L'agent de LLM affirme avoir effectué une opération pratiquement non terminée.
- **Prompt injection。**Utilisateur pour le système de mise en œuvre rapide du texte.

  Le taux de réussite des attaques en fonction des scénarios. Dans les modèles de référence de l'utilisation des outils et du codage, le taux de réussite des attaques de pointe est d'environ 0,5-8,5%.

  缓解措施: dans l'ensemble du cycle, tout utilisateur sera considéré comme incroyable; avant les appels à l'outil  effectuer des désinfections; séparer les sorties de l'outil du commandant prompt; utiliser le mode Plan-Vérifier-Exécuter (PVE), faire planifier l'agent, puis l'exécuter avant d'effectuer chaque action selon le plan de vérification de chaque action (qui empêchera les résultats de l'outil de se lancer dans de nouvelles actions non planifiées);

  Il faut utiliser des couches de défense extérieures de la durée de fonctionnement (LLM Guard, validation d'allowlist, détection d'anomalies sémantiques).
- **Scope creep。**Les mesures de réduction: contracts de contraintes d'outils; maintenir le système prompt; se concentrer; participer à des évaluations en fonction du taux de désabonnement.
- **无限循环。**L'agent continue à utiliser le même outil.
- **Context window exhaustion。**长对话会把最早的轮次挤出上下文──缓解措施: résumer les plus anciens virages, récupérer selon la similitude 相关历史轮次,或使用长文本模型──

## Je le livre.

保存为 `outputs/skill-chatbot-architect.md`- Le numéro de la liste:

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

1. **Easy。**Utilisez 10 modèles pour le robot de commande de café  Répondre à la règle ci-dessus 测试边界 situation: doubles commandes 修正 取消 意向不清 
2. **Medium。**Construire une FAQ hybride + LLM fallback。 Pour un produit SaaS  préparer 50 条 entrées FAQ en conserve,LLM fallback Utiliser le site de documents  上的检索──在 100 个真实支持问题 上测量拒绝率 和准确性──
3. **Hard。**Utiliser trois outils (recherche, lecture, données utilisateur, envoi d'e-mail) pour réaliser le cycle d'agent ci-dessus. Utiliser 50 tests de tentatives d'injection rapide pour évaluer les scénarios de fonctionnement.

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

- [Weizenbaum (1966). ELIZA — A Computer Program For the Study of Natural Language Communication](https://web.stanford.edu/class/cs124/p36-weizenabaum.pdf) Originaire de la réglementation basée sur le chatbot 论文。
- [Thoppilan et al. (2022). LaMDA: Language Models for Dialog Applications](https://arxiv.org/abs/2201.08239) Google 较晚期的神经聊天机论文, 正好在LLM agents 接管之前
- [Yao et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629)  命名 agent cycle modèle 的论文。
- [Anthropic's guide on building effective agents](https://www.anthropic.com/research/building-effective-agents) Directives de production de 2024 à 2026 sont toujours en vigueur.
- [Greshake et al. (2023). Not what you've signed up for: Compromising Real-World LLM-Integrated Applications with Indirect Prompt Injection](https://arxiv.org/abs/2302.12173) injection rapide 论文。
- [OWASP Top 10 for LLM Applications 2025 — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) 让快速注射 成为首要安全关注点排名──
- [AWS — Securing Amazon Bedrock Agents against Indirect Prompt Injections](https://aws.amazon.com/blogs/machine-learning/securing-amazon-bedrock-agents-a-guide-to-safeguarding-against-indirect-prompt-injections/)  Défense de couche d'orchestration pratique, y compris les flux de planification- vérification- exécution et de confirmation par l'utilisateur。
- [EchoLeak (CVE-2025-32711)](https://www.vectra.ai/topics/prompt-injection) injection directe directe  conduit à l'exfiltration de données par clic zéro CVE .
