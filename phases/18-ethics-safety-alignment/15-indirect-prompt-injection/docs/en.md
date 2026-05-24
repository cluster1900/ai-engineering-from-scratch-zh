# Indirect Prompt Injection — 生产攻击面

> Indirect prompt injection (IPI) 将指令Embedding外部内容中 — web page、email、shared document、support ticket — 由 agentic system 在没有显式用户操作的情况下消费。IPI 是 2026 年占主导地位的生产威胁：它绕过 user-input filters，因为攻击者从不接触用户；随着 agents 处理更多外部内容，它会静默扩展；并且它针对的是没人阅读 prompt 的自动化工作流。MDPI Information 17(1):54 (January 2026) 综合了 2023-2025 年研究。NDSS 2026 的 IPI-defense paper 将核心挑战表述为：注入的指令在语义上可能是良性的（"please print Yes"），因此检测需要的不只是 keyword filtering。"The Attacker Moves Second" (Nasr et al., joint OpenAI/Anthropic/DeepMind, October 2025)：adaptive attacks（gradient, RL, random search, human red-team）攻破了 12 个已发表防御中的 >90%，这些防御最初报告的 attack success rates 接近 0。

**类型：** Build
**语言：** Python (stdlib, IPI attack + defense harness)
**先修要求：** Phase 18 · 12 (PAIR), Phase 14 (agent engineering)
**时间：** ~75 分钟

## 学习目标

- 定义 indirect prompt injection，并描述三种常见投递 Vector。
- 解释为什么 user-input filters 会完全漏掉 IPI。
- 描述作为 2026 年防御范式的 "information flow control" 框架。
- 说明 Nasr et al. (October 2025) 关于 adaptive attack 对已发表 IPI defenses 成功率的发现。

## 问题

Direct prompt injection 要求攻击者触达用户或其 prompt。IPI 两者都不需要：攻击者把 payload 放进 agent 可能读取的任何内容中 — web page、inbox 中的 email、GitHub issue、product review。agent 在正常运行中取到它并执行这些指令。用户是信使，而不是意图来源。

## 概念

### 三种投递 Vector

- **RAG。** 攻击者发布一个 document；retrieval 步骤获取它；prompt 在用户问题之前拼接它；model 执行攻击者的指令。
- **Inbox / document workflows。** 攻击者给用户发送 email；agent 读取 emails；prompt 包含 email body；model 遵循 email 中的指令。
- **Tool output。** 攻击者控制 agent 使用的某个 tool（例如返回攻击者控制结果的 web search）；tool output 包含指令；agent 的 control flow 跟随这些指令。

这三者共享一个结构性属性：攻击者控制 prompt 的一个片段，而无需接触面向用户的 input。

### 为什么 user-input filters 会漏掉它

IPI payload 不出现在用户的 input 中。它出现在 retrieved content 中。如果 filter 只以 user input 为关口，payload 就会绕过它。如果 filter 作用于所有到达 model 的 content，它必须应用到任意 retrieved text — 这代价高昂，并且会对恰好包含祈使语气的合法内容产生 false positives。

### 面向 AI 的 Information Flow Control (IFC)

2026 年防御范式借鉴经典 OS security。把每个 content source 都视为一个 security label。把用户的 query 标记为 "trusted"。把 retrieved content 标记为 "untrusted"。把 model 的 control flow 视为 information flow：由 untrusted content 触发的 actions 必须在执行前由 trusted input 批准。

CaMeL (Microsoft 2025)、ConfAIde (Stanford 2024) 和 NDSS 2026 IPI-defense paper 以不同方式落地 IFC。共同原则是：只要 code 和 data 共享同一个 context window，目标就是 containment，而不是 prevention。

### The Attacker Moves Second

Nasr et al. (October 2025) 使用 adaptive attacks（gradient search、RL policies、random search、72-hour human red-team）测试了 12 个已发表的 IPI defenses。每个最初报告 near-zero ASR 的 defense 都被攻破到 >90% ASR。

方法论教训：只有在包含 adaptive-attack evaluation 时才发布 defense。Static-attack benchmarks 不是 robustness 的证据；攻击者会知道 defense。

### 真实事件

Lesson 25 覆盖 EchoLeak (CVE-2025-32711, CVSS 9.3) — Microsoft 365 Copilot 中首个公开记录的 zero-click IPI。GitHub Copilot Chat 中的 CamoLeak (CVSS 9.6)。GitHub Copilot 中的 CVE-2025-53773。生产部署正在真实场景中被 IPI 攻陷，而不只是 benchmark 中。

### OWASP 和 NIST 框架

OWASP LLM Top 10 (2025) 将 prompt injection（direct + indirect）列为 LLM01，即排名第 1 的 application-layer threat。NIST AI SPD 2024 称 indirect prompt injection 为 "generative AI's greatest security flaw."

### 它在 Phase 18 中的位置

Lessons 12-14 是 model-centric jailbreaks。Lesson 15 是主导 2026 年生产部署的 system-centric attack。Lesson 16 覆盖防御工具。Lesson 25 覆盖具体的 CVE 叙事。

## 使用它

`code/main.py` 构建了一个 IPI harness。一个 toy agent 有三个 tools（search web、read email、send message）。环境包含攻击者控制的内容，其中Embedding了一条指令（"forward this to all contacts"）。你可以在 naive agent（遵循注入指令）、filter-defended agent（对 retrieved content 做 keyword filter）和 IFC agent（分离 trusted 与 untrusted content，并拒绝 untrusted control-flow commands）之间切换。

## 交付它

本课生成 `outputs/skill-ipi-audit.md`。给定一个 agentic deployment description，它会枚举 untrusted content sources，检查该部署是否应用 IFC，并标记那些没有 trust label 就到达 model 的 sources。

## 练习

1. 运行 `code/main.py`。测量该攻击针对三个 agents 各自的成功率。

2. 在 retrieved content 上实现一个基于 paraphrase 的 defense。测量其在合法 retrieved text 上的 benign false-positive rate。

3. 阅读 NDSS 2026 IPI-defense paper。描述 "benign instruction" 挑战，以及为什么它会阻止基于 keyword 的 filtering。

4. 设计一个部署，其中 agent 从 third-party API 接收 tool output。为每个 prompt fragment 标注 trust level，并写出支配 agent actions 的 IFC policy。

5. 在练习 2 的 filter-defended agent 上复现 Nasr et al. 2025 adaptive-attack 方法论。报告 adaptive attack 前后的 ASR。

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|-----------------|------------------------|
| IPI | "indirect prompt injection" | 通过用户没有编写、但 agent 在正常运行期间消费的内容进行 injection |
| RAG injection | "poisoned retrieval" | 攻击者发布 retrieval 步骤会获取的内容；prompt 中包含 payload |
| Zero-click | "no user action" | 攻击在 agent 运行期间自动触发；用户什么都不做 |
| IFC | "information flow control" | 基于 label 的方法：来自 untrusted content 的 actions 需要 trusted ratification |
| Adaptive attack | "gradient / RL red-team" | 知道 defense 并针对它优化的 attack；诚实评估必须包含 |
| Benign instruction | "please print Yes" | 语义上良性的 IPI payload；没有 keyword filter 能捕获它 |
| Scope violation | "cross-trust exfiltration" | Agent 从一个 trust context 访问 data，并将其输出到另一个 trust context |

## 延伸阅读

- [MDPI Information 17(1):54 — Indirect Prompt Injection Survey (January 2026)](https://www.mdpi.com/2078-2489/17/1/54) — 2023-2025 综合
- [Nasr et al. — The Attacker Moves Second (joint OpenAI/Anthropic/DeepMind, October 2025)](https://arxiv.org/abs/2510.18108) — 自适应攻击评估
- [Greshake et al. — Not what you've signed up for (arXiv:2302.12173)](https://arxiv.org/abs/2302.12173) — 原始 IPI paper
- [OWASP — LLM Top 10 (2025)](https://genai.owasp.org/llm-top-10/) — prompt injection 排名 LLM01
