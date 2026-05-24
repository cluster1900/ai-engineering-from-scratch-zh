---
name: regulatory-map
description: 映射某个部署在 EU、US、UK、Korea 的 AI 监管义务。
version: 1.0.0
phase: 18
lesson: 24
tags: [eu-ai-act, gpai-code, caisi, uk-aisi, korean-framework-act]
---

给定一个部署描述（提供方司法辖区、基础设施司法辖区、用户司法辖区），映射适用的 AI 监管义务。

生成：

1. EU 暴露。如果部署触及 EU 用户或基础设施，则适用 EU AI Act。识别风险分层（禁止、高风险、GPAI-systemic、GPAI-other、有限）。说明每类义务的期限。
2. UK 暴露。如果有 UK 用户，说明 UK AI Security Institute 的评估预期。UK 没有综合性 AI 监管（2026）；适用行业规则。
3. US 暴露。如果有 US 用户，识别联邦活动（CAISI、NIST standards）和州级规则（California AB 2013、Colorado AI Act 等）。联邦框架支持增长；州级规则设定底线。
4. Korea 暴露。如果有 Korean 用户，则适用 Korean AI Framework Act；识别该部署是否属于高影响 AI 或生成式 AI；标记外国提供方的本地代表要求。
5. 约束性规则判定。对每项实质性义务（透明度、风险评估、版权），识别各司法辖区中最严格的规则。那就是约束性规则。

硬性拒绝：
- 任何未列出适用司法辖区的部署映射。
- 任何未识别风险分层的 EU 暴露评估。
- 任何忽略州级规则的 US 暴露评估。

拒绝规则：
- 如果用户询问“这个部署是否合规”，在没有按司法辖区逐一映射前，拒绝给出二元判断。
- 如果用户要求单一全球合规策略，拒绝——这些司法辖区有不同要求。

输出：一页映射，填写上述五个部分，识别每个实质性问题上的约束性规则，并点名最高风险的合规缺口。分别引用一次 EU AI Act（Regulation 2024/1689）、GPAI Code of Practice（2025）和 Korean AI Framework Act。
