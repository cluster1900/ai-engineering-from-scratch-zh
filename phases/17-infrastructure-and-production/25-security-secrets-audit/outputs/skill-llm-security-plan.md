---
name: llm-security-plan
description: 生成一份 LLM security plan，覆盖 secrets vault、带 consistent tokenization 的 PII scrubbing、network egress allowlist、audit log retention 和 zero-trust posture。
version: 1.0.0
phase: 17
lesson: 25
tags: [security, vault, hashicorp, aws-secrets-manager, pii, presidio, egress, audit-log, zero-trust, ci-cd-supply-chain]
---

根据 regulatory scope（SOC 2、HIPAA、GDPR）、当前 credential state，以及 network/egress posture，生成一份 security plan。

生成：

1. Vault migration。选择 vault（HashiCorp、AWS Secrets Manager、Azure Key Vault、GCP Secret Manager）。Gateway pattern：apps → gateway → vault at runtime。弃用 hardcoded env 和 config-file credentials。
2. Secret scanning。每次 commit 启用 TruffleHog / GitGuardian / Gitleaks。检测到后阻止 PR。
3. Rotation policy。≤ 90 days。尽可能自动化。为 CI/CD credentials 设置专用 rotation（更短 — 推荐 30d）。
4. PII scrubbing。Entity recognition（Presidio + regex）。Consistent tokenization（same value → same placeholder）以保留语义。
5. Egress allowlist。将 LLM provider domains、vector DB、vault endpoints 加入白名单。DNS allowlist resolver。
6. Audit log。Append-only、immutable。Required fields：user、tenant、prompt/response hash、tokens、cost、guardrail trips。按 framework 保留（SOC 2 1y / HIPAA 6y）。
7. CI/CD hygiene。OIDC identity federation（没有 static cloud keys）。严格限制 CI/CD credentials scope。引用 2026 Vercel supply-chain incident 作为动机。

Hard rejects:
- Static keys in config files。拒绝。
- 在 audit log 中存储 raw prompts。拒绝 — 除非 regulatory framework 明确另有要求，否则只存 hash。
- 允许 egress 到 `*` 或 “the internet”。拒绝 — whitelist。

Refusal rules:
- 如果客户无法接受任何 vault（air-gapped requirement），拒绝 normal plan，并设计 file-based-with-rotation fallback。明确说明它安全性较低。
- 如果因“latency”原因拒绝 PII scrubbing，拒绝 — latency 通常 <20 ms，而 regulatory risk 远大于它。
- 如果为 vault root token 请求 >90 days 的 rotation，拒绝 — 它会成为 breach vector。

Output：一页 plan，包含 vault、scanning、rotation、scrubbing、egress、audit log、CI/CD posture。以单一 metric 结尾：secret-scan hit count per month；target zero。
