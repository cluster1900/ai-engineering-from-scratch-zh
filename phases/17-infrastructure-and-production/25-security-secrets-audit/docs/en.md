# Security — Secrets、API Key 轮换、Audit Logs、Guardrails

> 通过集中式 vault（HashiCorp Vault、AWS Secrets Manager、Azure Key Vault）消除 Secrets 蔓延。绝不要把凭证存放在 config files、VCS 中的 env files、spreadsheets 里。优先使用 IAM roles，而不是 static keys；CI/CD 使用 OIDC。AI-gateway pattern 是 2026 年的解决方案：apps → gateway → model provider，gateway 在运行时从 vault 拉取凭证。在 vault 中轮换后，所有 apps 会在几分钟内获取更新，不需要 redeploy，也不需要在 Slack 里问“谁有新 key”。Rotation policy ≤90 days；每次 commit 都用 TruffleHog / GitGuardian / Gitleaks 扫描。Zero-trust：MFA、SSO、RBAC/ABAC、short-lived tokens、device posture。PII scrubbing 使用 entity recognition，在转发前屏蔽 PHI/PII；consistent tokenization（Mesh approach）把敏感值映射到稳定 placeholder，让 LLM 保留代码/关系语义。Network egress：LLM services 位于专用 VPC/VNet subnet，只 whitelist `api.openai.com`、`api.anthropic.com` 等；阻止所有其他 outbound。2026 年的事故驱动因素：Vercel supply-chain attack，通过被攻破的 CI/CD credentials 泄露了数千个 customer deployments 的 env vars。

**Type:** Learn
**Languages:** Python (stdlib, toy PII-scrubber + audit-log writer)
**Prerequisites:** Phase 17 · 19 (AI Gateways), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## 学习目标
- 列举四种 secret-management anti-patterns（VCS 中的 config files、hardcoded env、spreadsheets、static keys），并说出它们的替代方案。
- 解释 AI-gateway-pulls-from-vault pattern 为什么是 2026 production standard。
- 实现一个带 consistent tokenization（same value → same placeholder）的 PII scrubber，让语义得以保留。
- 说出 2026 Vercel supply-chain incident，以及它对 CI/CD credential hygiene 的教训。

## 问题
一名实习生提交了带 API keys 的 `.env`。他们很快删除了它。但这些 keys 已经进入 git history。GitGuardian scan 捕获了它，而你的 rotation process 是“在 Slack 通知团队、更新 40 个 config files、redeploy 所有 services”。8 小时后，你一半 services 已上线，另一半还在等待 deploy windows。

另外，user prompts 包含“My SSN is 123-45-6789.” Prompt 被发送到 OpenAI。你有 BAA，但内部 policy 要求在转发前屏蔽 PII。你没有这么做。

另外，你的 EKS cluster 中的 LLM pod 可以访问任意 internet host。有人通过 DNS lookup 把数据 exfil 到 attacker-controlled domain。没有任何东西阻止它。

LLM services 的 Security 必须处理这三类 Vector。Vault-backed credentials。PII scrubbing。Network egress filtering。Audit logs。

## 概念
### 集中式 vault + IAM-role pull

**Vault**: HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager。单一事实来源。

**IAM role**: app/gateway 通过其 IAM identity 进行认证，而不是 static key。Vault 在 token 生命周期内返回 secret。

**The AI-gateway pattern**: gateway 在请求时从 vault 拉取 `OPENAI_API_KEY`。在 vault 中轮换；下一次请求拿到新 key。无需 redeploys。

### Rotation policy ≤ 90 days

所有 API keys、vault root tokens、CI/CD credentials。尽可能自动 rotation。手动 rotation 需要记录和跟踪。

### Secret scanning

- **TruffleHog** — 对 commits 做 regex + entropy 检测。
- **GitGuardian** — commercial，准确率高。
- **Gitleaks** — OSS，在 CI 中运行。

每次 commit 都运行。如果检测到新 secret，就阻止 PR。

### Zero-trust posture

- 所有 accounts 必须启用 MFA。
- 通过 SAML/OIDC 使用 SSO。
- RBAC（role-based）或 ABAC（attribute-based）用于 fine grained access。
- Short-lived tokens（以小时计，而不是天）。
- Device posture — 仅允许启用 disk encryption 的 corp devices。

### PII / PHI scrubbing

在 prompt 离开你的 infra 之前：

1. Entity recognition（spaCy NER、Presidio、commercial）。
2. 屏蔽匹配到的 entities：`"My SSN is 123-45-6789"` → `"My SSN is [SSN_TOKEN_A3F]"`。
3. Consistent tokenization（Mesh approach）：same value 映射到 same placeholder，让 LLM 保留关系。
4. 可选：对 LLM response 做 reverse mapping。

Static regex filters 能捕获基本 patterns；NER 能捕获更多。两者都用。

### Input + output guardrails

Input：阻止已知 jailbreaks、forbidden topics；按 user 做 rate-limit。

Output：用 regex scrub 泄露的 secrets（API key patterns、refusal contexts 中的 email patterns），用 classifier 检测 policy violations。

### Network egress whitelist

LLM services 位于专用 subnet：
- Whitelist：`api.openai.com`、`api.anthropic.com`、vector DB endpoints、vault endpoints。
- 其他一切：drop。
- DNS 通过 allowlist-only resolver（避免 DNS-tunneling exfil）。

### Audit log

每次 LLM call 的 immutable log，包含：
- Timestamp。
- User / tenant。
- Prompt hash（出于 privacy，不记录 raw prompt）。
- Model + version。
- Token counts。
- Cost。
- Response hash。
- 任何 guardrail trips。

按 regulatory requirement 保留（SOC 2 1 year，HIPAA 6 years）。

### The 2026 Vercel incident

Supply-chain attack：被攻破的 CI/CD credentials 泄露了数千个 customer deployments 的 env vars。教训：CI/CD credentials 等同于 prod。存入 vault。缩小 scope。积极 rotation。

### 你应该记住的数字

- Rotation policy：≤ 90 days。
- 每次 commit 扫描：TruffleHog / GitGuardian / Gitleaks。
- Vercel 2026：CI/CD 凭据被泄露 → 数千个客户 env vars 泄露。
- Audit log retention：SOC 2 = 1 year，HIPAA = 6 years。

```figure
i4-vault-rotation
```

## 使用它
`code/main.py` 实现了一个带 consistent tokenization 的 toy PII scrubber，以及一个 append-only audit log。

## 交付它
本课生成 `outputs/skill-llm-security-plan.md`。根据 regulatory scope 和 current state，规划 vault migration、scrubber、egress、audit log。

## 练习
1. 运行 `code/main.py`。发送两个引用同一 SSN 的 prompts。确认两者获得相同 placeholder。
2. 为调用 OpenAI + Anthropic + Weaviate 的 vLLM-on-EKS deployment 设计 network egress policy。
3. 你在 git history 中发现一个 key（2 年前的）。正确响应是什么：rotate key、scrub history，还是两者都做？说明理由。
4. 你的 audit log 每天增长 10 GB。设计 retention tiers（hot 30d、warm 12mo、cold 6yr）。
5. 论证 reverse-tokenization（把真实值替换回 LLM response）是否值得其复杂度，还是让 placeholders 可见更好。

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Vault | "secrets store" | 集中式 credential management service |
| IAM role | "identity-based auth" | app assume 的 role；返回 short-lived creds |
| OIDC for CI/CD | "cloud-issued tokens" | CI 中没有 static keys — 通过 OIDC 建立 identity |
| TruffleHog / GitGuardian / Gitleaks | "secret scanners" | commit-time secret detection |
| RBAC / ABAC | "access control" | Role-based vs attribute-based |
| PII scrubbing | "data masking" | 移除敏感 entities 或对其 tokenization |
| Consistent tokenization | "stable placeholders" | Same value → same token each time |
| Mesh approach | "Mesh tokenization" | 保留语义的 tokenization pattern |
| Egress whitelist | "outbound allowlist" | 只有允许的 domains 可访问 |
| Audit log | "immutable history" | 用于 compliance 的 append-only record |

## 延伸阅读
- [Doppler — Advanced LLM Security](https://www.doppler.com/blog/advanced-llm-security)
- [Portkey — Manage LLM API keys with secret references](https://portkey.ai/blog/secret-references-ai-api-key-management/)
- [Datadog — LLM Guardrails Best Practices](https://www.datadoghq.com/blog/llm-guardrails-best-practices/)
- [JumpServer — Secrets Management Best Practices 2026](https://www.jumpserver.com/blog/secret-management-best-practices-2026)
- [Microsoft Presidio](https://github.com/microsoft/presidio) — PII detection and anonymization。
- [HashiCorp Vault docs](https://developer.hashicorp.com/vault/docs)
