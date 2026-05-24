---
name: compliance-matrix
description: 根据客户地域、细分领域和合同范围，为 LLM SaaS 生成必需框架Matrix。将 SOC 2、HIPAA、GDPR、PCI-DSS、EU AI Act、Colorado AI Act、ISO 42001 之间的控制项进行映射。
version: 1.0.0
phase: 17
lesson: 26
tags: [compliance, soc2, hipaa, gdpr, pci-dss, eu-ai-act, colorado-ai-act, iso-42001, iso-27001]
---

给定客户地域（US / EU / Global，或具体 US 州）、细分领域（SaaS / healthcare / fintech）、合同范围（enterprise vs SMB）以及当前合规状态，生成必需框架Matrix。

生成：

1. 必需框架。列出每个必须达成的框架，并说明理由（地域、细分领域、客户画像）。
2. 时间线。对每个框架，说明当前状态（none / Type I / in audit / Type II）。指出差距。
3. 跨框架控制项映射。对每个必需框架，识别可同时满足多个框架的控制项（访问日志、加密、审计日志、变更管理）。
4. EU AI Act 姿态。对产品的风险等级进行分类（unacceptable / high / limited / minimal）。如果是 high-risk，要求在 2026 年 8 月 2 日执行日期之前完成 conformity-assessment 路径。
5. PII / PHI 处理。确认实时 inference-layer redaction（Phase 17 · 25）——post-processing 在 GDPR 下不可辩护。确认所有接触 PHI 的 AI vendors 都已签署 BAAs。
6. 审计工具。Drata / Vanta / Secureframe 用于跨框架自动化。在多框架范围下值得投入成本。

硬性拒绝：
- 声称 SOC 2 Type I 就是 enterprise procurement 所需的 “SOC 2 compliant”。拒绝——Type II 才是门槛。
- 在没有 BAA 的情况下向 provider 发送 PHI。拒绝——违反 HIPAA。
- 将 post-processing PII scrubbing 作为 GDPR 姿态。拒绝——要求实时处理。

拒绝规则：
- 如果产品服务 EU 用户但没有 GDPR Article 30 records，则拒绝向 EU 客户发布，直到 records 建立完成。
- 如果产品服务 Colorado 居民，且用于 credit/employment/housing/education/essential services，则要求在发布前提供已于 2026 年 6 月 30 日（Colorado AI Act 在 SB24-205 经 SB25B-004 修订后的生效日期）前完成 impact assessment 的证据。
- 如果产品在 EU AI Act 下属于 high-risk，且团队没有 conformity-assessment 计划，则拒绝承诺 2026 年 8 月就绪，除非指定了 implementation partner。

输出：一页Matrix，包含必需框架、当前状态、差距、时间线、跨框架控制项、EU AI Act 等级、PII 姿态、工具。最后附上 12 个月 roadmap：按框架拆分的季度里程碑。
