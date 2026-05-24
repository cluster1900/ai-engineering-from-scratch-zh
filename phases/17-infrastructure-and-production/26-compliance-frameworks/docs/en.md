# Compliance — SOC 2、HIPAA、GDPR、PCI-DSS、EU AI Act、ISO 42001

> 对 2026 年 enterprise deals 来说，multi-framework 覆盖是基本门槛。**EU AI Act**：自 2024 年 8 月 1 日起生效。大多数 high-risk 要求自 2026 年 8 月 2 日起执行。high-risk-system obligations 的罚款最高为 €15M 或全球年营业额的 3%（Art. 99(4)）；prohibited AI practices 的罚款最高为 €35M 或 7%（Art. 99(3)）。如果服务 EU users，则全球适用。**Colorado AI Act**：2026 年 6 月 30 日生效（由 SB25B-004 从 2026 年 2 月延期）— 对 high-risk systems 进行 impact assessments，并赋予申诉 AI decisions 的权利。Virginia 在 credit/employment/housing/education 方面类似。**SOC 2 Type II**：事实上的 B2B AI 要求（fintech 需要 Type II，而不是 Type I）。**GDPR**：已记录的最大 AI-specific fine 是 Dutch DPA 于 2024 年 9 月对 Clearview AI 处以的 €30.5M；Italy 的 Garante 于 2024 年 12 月对 OpenAI 处以 €15M（后来在 2026 年 3 月上诉中被推翻）。推理时的实时 PII redaction 是可辩护标准；post-processing cleanup 不够。**HIPAA**：受医疗保健约束 — 没有 BAA，不能将 PHI 发送给外部 AI services。**PCI-DSS**：AI-interaction-layer 覆盖需要配置 + 合同协议，不会自动满足。**ISO 42001**：新兴 AI governance 标准，正与 ISO 27001 一起成为越来越常见的采购要求。参考 profile：OpenAI 维持 SOC 2 Type 2、ISO/IEC 27001:2022、ISO/IEC 27701:2019、GDPR/CCPA/HIPAA (BAA)/FERPA，以及 ChatGPT payment components 的 PCI-DSS。Cross-framework mapping 可减少 audit fatigue：access controls 映射到 ISO 27001 A.5.15-5.18、GDPR Art. 32、HIPAA §164.312(a)。

**类型：** 学习
**语言：**（Python 可选 — compliance 是 policy + process，不是 code）
**前置要求：** Phase 17 · 25（Security），Phase 17 · 13（Observability）
**时间：**约 60 分钟

## 学习目标

- 列举与 LLM products 相关的七个 2026 frameworks，并将每个 framework 匹配到一个 customer segment。
- 引用 EU AI Act enforcement timeline（2024 年 8 月生效；2026 年 8 月执行 high-risk 要求）以及两级罚款上限（high-risk obligations 为 €15M / 3%，prohibited practices 为 €35M / 7%）。
- 解释为什么 post-processing PII cleanup 对 GDPR 来说不够，并指出 real-time inference-layer redaction 是可辩护标准。
- 描述 cross-framework control mapping（例如，access control 映射到 ISO 27001 A.5.15-5.18 + GDPR Art. 32 + HIPAA §164.312(a)）。

## 问题

某个 enterprise customer 的采购要求 SOC 2 Type II、GDPR、HIPAA BAA、ISO 27001，以及 “EU AI Act compliance statement”。你的团队只有 SOC 2 Type I。距离 Type II 还差六个月，而且还没开始 GDPR Article 30 records。

Multi-framework 覆盖不是 LLM 问题 — 它是 enterprise-SaaS 问题，并叠加 LLM-specific 要求。2026 年的采购团队想要的是一个Matrix：每个 framework 一行，每个 control 一列，而不是一份 PDF。

## 概念

### 七个 frameworks

| Framework | 范围 | LLM-specific requirement |
|-----------|-------|--------------------------|
| SOC 2 Type II | B2B SaaS baseline | 在 6-12 个月内审计 process controls |
| HIPAA | US healthcare | 需要 BAA；没有签署协议，PHI 不能离开 infrastructure |
| GDPR | EU users | Real-time PII redaction；data subject rights；Article 30 records |
| PCI-DSS | Payment data | AI 接触 payment 时需要 configuration + contracts |
| EU AI Act | Serving EU users | Risk tier classification；high-risk systems：conformity assessment、documentation、logging |
| Colorado AI Act | Serving CO residents | Impact assessments；right to appeal |
| ISO 42001 | AI governance | 新兴；与 ISO 27001 搭配 |

### EU AI Act timeline

- 2024 年 8 月 1 日：生效。
- 2025 年 2 月 2 日：prohibited-AI practices 开始执行。
- 2026 年 8 月 2 日：high-risk systems 开始执行（conformity assessment、documentation、logging）。
- 2027 年 8 月：harmonized legislation 下产品中的 high-risk systems。

Risk tiers：Unacceptable（禁止）、High-risk（conformity + logging）、Limited-risk（transparency）、Minimal-risk（无约束）。大多数 B2B LLM SaaS 属于 limited-risk；在 employment、credit、education、law enforcement、migration、essential services 中会触发 high-risk。

罚款（Article 99）：违反 high-risk-system obligations（Art. 99(4)）最高 €15M 或全球年营业额 3%；prohibited AI practices（Art. 99(3)）最高 €35M 或 7%；适用较高者。

### GDPR — real-time redaction 是标准

Post-processing cleanup（在 LLM 看到之后再 redaction PII）不是可辩护姿态 — model 已经看到了数据。Real-time inference-layer redaction 是 2026 年标准：

- 在 LLM call 之前进行 entity recognition。
- 一致的 tokenization（Mesh approach）保留语义。
- 仅存储 redacted prompts + 已 consented opt-in raw。

近期执行案例：Dutch DPA 于 2024 年 9 月对 Clearview AI 处以 €30.5M，是截至目前已记录的最大 AI-specific GDPR fine；Italy 的 Garante 于 2024 年 12 月对 OpenAI 处以 €15M，是最大的 LLM-specific fine，尽管该处罚在 2026 年 3 月上诉中被推翻，且裁决仍在进一步审查中。Post-processing 说法在审计中已经失败。

### HIPAA — BAA 不是可选项

没有签署 Business Associate Agreement，你不能将 PHI 发送给外部 AI services。三大 hyperscaler LLM platforms（Bedrock、Azure OpenAI、Vertex）都提供 BAAs。OpenAI direct API 提供 BAA。Anthropic direct API 提供 BAA。发送 PHI 前必须确认。

### SOC 2 Type II

Type I：controls 已设计并记录。
Type II：controls 在 6-12 个月内有效运行。

2026 年 B2B procurement 默认要求 Type II。Type I 是起点；Type II 是门槛。

常见 audit drivers：access logs（谁看了什么）、change management（如何部署）、risk assessments（每季度）、incident response（测试过吗？）。Phase 17 · 25 中的 audit log 可直接复用。

### Cross-framework mapping

一个 access control policy 满足多个 framework controls：

| Control | Frameworks |
|---------|-----------|
| Access logging | ISO 27001 A.5.15-5.18、GDPR Art. 32、HIPAA §164.312(a) |
| Change management | ISO 27001 A.8.32、PCI DSS Req. 6、HIPAA breach-notification scope |
| Encryption in transit | ISO 27001 A.8.24、GDPR Art. 32、HIPAA §164.312(e) |
| Secrets management | ISO 27001 A.8.19、PCI DSS Req. 8、SOC 2 CC6.1 |

Compliance tools（Drata、Vanta、Secureframe）会自动化这类 mapping。规模化后值得付费。

### ISO 42001 — 新兴

2023 年末发布。正与 ISO 27001 一起成为越来越常见的采购要求。它是 AI governance 的 framework，涵盖 risk management、data quality、transparency、human oversight。

### OpenAI 的参考 profile

OpenAI 维持 SOC 2 Type 2、ISO/IEC 27001:2022、ISO/IEC 27701:2019、GDPR/CCPA/HIPAA (BAA)/FERPA，以及 ChatGPT payment components 的 PCI-DSS。这大致就是 2026 年 enterprise table stakes。

### 你应该记住的数字

- EU AI Act 罚款：最高 €15M / 3%（high-risk obligations，Art. 99(4)）；最高 €35M / 7%（prohibited practices，Art. 99(3)）。
- EU AI Act high-risk enforcement：2026 年 8 月 2 日。
- 已记录的最大 AI-specific GDPR fine：€30.5M，Clearview AI（Dutch DPA，2024 年 9 月）。
- 最大 LLM-specific GDPR fine：€15M，OpenAI（Italy's Garante，2024 年 12 月；2026 年 3 月上诉推翻）。
- SOC 2 Type II 窗口：6-12 个月的已运行 controls。
- Colorado AI Act 生效日期：2026 年 6 月 30 日（由 SB25B-004 从 2026 年 2 月延期）。

## 使用它

`code/main.py` 是一个用 Python 写的 compliance-mapping spreadsheet — 给定一个 control，列出它满足的 frameworks。

## 交付它

本课会生成 `outputs/skill-compliance-matrix.md`。给定 customer segment 和 geography，指定所需 frameworks 和 controls。

## 练习

1. 你的第一个 enterprise customer 要求 SOC 2 Type II、HIPAA BAA、EU AI Act statement。为了赢下这笔交易，minimum viable compliance posture 是什么？
2. 按 EU AI Act risk tiers 对三个假设的 LLM products 进行分类。进入 high-risk 后会发生什么变化？
3. 你意外地把 PHI 发送给了没有 BAA 的 provider。演练 incident response。
4. 论证 ISO 42001 对一个 mid-market AI vendor 来说在 2026 年是否“必要”。
5. 将你的 LLM audit log fields（Phase 17 · 25）映射到至少三个 framework controls。

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| SOC 2 Type II | “audited controls” | Controls 在 6-12 个月内运行，并经过独立 attestation |
| HIPAA BAA | “healthcare contract” | Business Associate Agreement；PHI 必需 |
| GDPR | “EU privacy” | Real-time PII redaction 是 2026 年可辩护标准 |
| EU AI Act | “EU AI rules” | 2026 年 8 月执行 high-risk；€15M / 3%（high-risk obligations）— €35M / 7%（prohibited practices） |
| Colorado AI Act | “US AI state law” | 2026 年 6 月 30 日生效（由 SB25B-004 延期）；impact assessments |
| ISO 42001 | “AI governance” | AI risk + transparency 的新兴 framework |
| ISO 27001 | “security ISMS” | Information Security Management System baseline |
| Conformity assessment | “EU AI doc package” | High-risk requirement：docs、testing、logging |
| Cross-framework mapping | “one control, many frames” | 单个 policy 满足多个 framework controls |

## 延伸阅读

- [OpenAI Security and Privacy](https://openai.com/security-and-privacy/) — 参考 compliance profile。
- [GuardionAI — LLM 合规 2026：ISO 42001, EU AI Act, SOC 2, GDPR](https://guardion.ai/blog/llm-compliance-guide-iso-42001-eu-ai-act-soc2-gdpr-2026)
- [Dsalta — SOC 2 Type 2 审计指南 2026：10 个 AI 控制措施](https://www.dsalta.com/resources/ai-compliance/soc-2-type-2-audit-guide-2026-10-ai-powered-controls-every-saas-team-needs)
- [EU AI Act official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) — primary source。
- [Colorado AI Act](https://leg.colorado.gov/bills/sb24-205) — primary source。
- [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html) — AI management system 标准。
