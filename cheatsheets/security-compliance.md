---
id: security-compliance
title: Secrets, Audit Logs and Compliance
code: AU
subtitle: Vault 托管的密钥、PII 脱敏、审计日志、签名 webhook、框架控制与 AI 法律日期。
hue: 140
sources: phases/17-infrastructure-and-production/25-security-secrets-audit, phases/17-infrastructure-and-production/26-compliance-frameworks, phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea, projects/signed-webhook-inbox
source_hash: 67e98f82b081e529
---

## 跑实验课
type: task-table
from: phases/17-infrastructure-and-production/25-security-secrets-audit/docs/en.md, phases/17-infrastructure-and-production/26-compliance-frameworks/docs/en.md, phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/code/main.py, projects/signed-webhook-inbox/README.md

| 任务 | 代码 |
|---|---|
| PII 清洗器与审计日志，第 25 课 | `code/main.py` |
| 控制与 profile 映射，第 26 课 | `code/main.py` |
| AI 监管时间线，第 18 阶段 | `python3 code/main.py` |
| Webhook 演示：202、200、401 | `go run . --mode demo` |
| 构建 webhook inbox | `go build -o /tmp/webhook-inbox .` |

## 网关从 vault 拉取密钥
type: architecture
from: phases/17-infrastructure-and-production/25-security-secrets-audit/docs/en.md

```arch
node | app | 1,1 | App | no provider key | client
node | gw | 2,1 | AI gateway | IAM role, guardrails | process
node | vault | 2,2 | Vault | OPENAI_API_KEY | store
node | egress | 3,1 | Egress whitelist | allowlist-only DNS | process
node | prov | 4,1 | Model provider | api.openai.com | model
node | audit | 3,2 | Audit log | immutable, per call | store
edge | app | gw | request
edge | gw | vault | pull at request time
edge | gw | egress | scrubbed prompt
edge | egress | prov | allowed host only
edge | gw | audit | append
```

## 安全数字
type: defaults
from: phases/17-infrastructure-and-production/25-security-secrets-audit/docs/en.md, projects/signed-webhook-inbox/solution/main.go, projects/signed-webhook-inbox/README.md

| 设置 | 默认值 | 说明 |
|---|---|---|
| 密钥轮换 | ≤ 90 days | 密钥、vault 根令牌、CI/CD 凭证 |
| Token 寿命 | hours | 短寿命 token，不是按天 |
| 审计留存，SOC 2 | 1 year | 按法规留存 |
| 审计留存，HIPAA | 6 years | 按法规留存 |
| Webhook 时钟偏差 | `5*time.Minute` | 当前时刻两侧 |
| Webhook body 大小 | 1..65536 bytes | 任何解码之前先读取 |
| Webhook 密钥 | WEBHOOK_SECRET | 至少 16 字节 |
| `--seconds` | 60 | 接收器寿命，1..600 |

## 审计日志条目
type: annotated-code
lang: python
from: phases/17-infrastructure-and-production/25-security-secrets-audit/code/main.py

```python
entry = AuditEntry(
    timestamp=datetime.utcnow().isoformat() + "Z",
    user=f"user_{i:03}",
    tenant="tenant_01",
    model="anthropic/claude-3.7-sonnet",  # model plus version
    prompt_hash=hash_short(scrubbed),  # hash, not the raw prompt
    response_hash=hash_short(response),
    input_tokens=len(scrubbed.split()),
    output_tokens=len(response.split()),
    cost_usd=0.0012,
    guardrail_trips=[],  # any guardrail trips
)
print(audit_log_call(entry))  # one JSON line per call
```

## PII 脱敏
type: concepts
from: phases/17-infrastructure-and-production/25-security-secrets-audit/docs/en.md, phases/17-infrastructure-and-production/25-security-secrets-audit/code/main.py, phases/17-infrastructure-and-production/26-compliance-frameworks/docs/en.md

- **顺序**：实体识别、掩码、一致的 tokenization、可选的反向映射。
- **实验课模式**：`scrubber.scrub` 中的 `SSN`、`EMAIL` 和 `PHONE` 正则。
- **一致 token**：同一值每次映射到同一占位符。
- **正则与 NER**：正则抓住基本模式。NER 抓住更多。两者都用。
- **时机**：在 LLM 调用之前。事后清理站不住脚。
- **存储**：只存脱敏后的 prompt，外加经同意的 opt-in 原文。
- **输出护栏**：用正则清洗泄露的 API key 模式。

## Webhook 接收路径
type: flow
from: projects/signed-webhook-inbox/solution/main.go, projects/signed-webhook-inbox/README.md

1. **ReadDelivery**：需要 POST、有效的 `X-Delivery-ID` 和整数 `X-Timestamp`。否则 400。
2. **Verify**：时间戳落在 5 分钟窗口外则拒绝，返回 401。
3. **Verify**：用 `hmac.Equal` 比较时间戳、ID 与 body 的 `v1=` HMAC-SHA256。否则 401。
4. **Accept**：用 fsync 和原子硬链接写入。新投递返回 202。
5. **Retry**：同一 ID、同一 body 返回 200。
6. **Conflict**：同一 ID、不同 body 返回 409。
7. **Replay**：显式 `--run` ID 写入一份处理回执。第二次 replay 复用它。

## Webhook inbox 命令
type: command-table
span: 2
from: projects/signed-webhook-inbox/README.md

| 命令 | 作用 |
|---|---|
| `/tmp/webhook-inbox --mode serve --dir <dir> --listen 127.0.0.1:8141 --seconds 120` | 接收投递 120 秒 |
| `/tmp/webhook-inbox --mode sign --id delivery-1 --timestamp <unix> --body fixtures/event.json` | 打印三个签名头 |
| `/tmp/webhook-inbox --mode inspect --dir <dir> --id delivery-1` | 显示已存储的投递 |
| `/tmp/webhook-inbox --mode replay --dir <dir> --id delivery-1 --run review-1` | 在 run ID review-1 下处理一次 |

## 各框架对 LLM 的义务
type: concepts
from: phases/17-infrastructure-and-production/26-compliance-frameworks/docs/en.md

- **SOC 2 Type II**：控制在 6-12 个月内有效运行。
- **HIPAA**：没有已签署的 BAA，不得把 PHI 送到外部 AI 服务。
- **GDPR**：实时 PII 脱敏、数据主体权利、Article 30 记录。
- **PCI-DSS**：触及支付的 AI 需要配置加合同。
- **EU AI Act**：风险分级。高风险需要合格评定和日志记录。
- **Colorado AI Act**：影响评估与上诉权。2026 年 6 月 30 日生效。
- **ISO 42001**：AI 治理。它与 ISO 27001 配对。

## 跨框架控制映射
type: command-table
from: phases/17-infrastructure-and-production/26-compliance-frameworks/code/main.py

| 命令 | 作用 |
|---|---|
| `access logging` | ISO 27001 A.5.15-5.18, GDPR Art. 32, HIPAA §164.312(a), SOC 2 CC6 |
| `encryption in transit` | ISO 27001 A.8.24, GDPR Art. 32, HIPAA §164.312(e) |
| `secrets management` | ISO 27001 A.8.19, PCI DSS Req. 8, SOC 2 CC6.1 |
| `audit log retention` | SOC 2 CC7, HIPAA §164.312(b), ISO 27001 A.8.15 |
| `PII redaction (inference-time)` | GDPR Art. 25, EU AI Act Art. 10, HIPAA §164.514 |
| `impact assessment` | Colorado AI Act SB24-205, EU AI Act Art. 27 |
| `BAA signed` | HIPAA §164.504(e) |

## EU AI Act 日期与罚款
type: concepts
from: phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/docs/en.md, phases/17-infrastructure-and-production/26-compliance-frameworks/docs/en.md

- **1 Aug 2024**：生效。
- **2 Feb 2025**：禁止性做法与 AI 素养开始适用。
- **2 Aug 2025**：GPAI 与治理义务开始适用。
- **2 Aug 2026**：全面适用，Article 50 透明度、罚则。
- **2 Aug 2027**：存量 GPAI 与嵌入式高风险系统。
- **Art. 99(4)**：高风险义务最高 €15M 或 3%。
- **Art. 99(3)**：禁止性做法最高 €35M 或 7%。

## 四个司法辖区
type: comparison
from: phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/docs/en.md

| 因素 | 欧盟 | 美国 | 英国 | 韩国 |
|---|---|---|---|---|
| 姿态 | 严格，按风险分级 | 偏向促进创新 | 聚焦狭义安全 | 由 MSIT 主导 |
| 机构 | AI Office | NIST 下属的 CAISI | AI Security Institute | MSIT 下属的 AISI |
| 关键日期 | 2024 年 8 月生效 | 2025 年 6 月更名 | 2025 年 2 月更名 | 2026 年 1 月施行 |
| 主要义务 | 风险分级、日志记录 | 标准支持 | 前沿安全 | 本地代表 |

## 排障
type: troubleshooting
from: phases/17-infrastructure-and-production/25-security-secrets-audit/docs/en.md, projects/signed-webhook-inbox/solution/main.go, projects/signed-webhook-inbox/README.md

| 症状 | 原因 | 修复 |
|---|---|---|
| 已删除的 `.env` 中的密钥仍在泄漏 | 密钥留在 git 历史里 | 轮换密钥。扫描每一次 commit |
| 数据经 DNS 查询离开 | LLM pod 能访问任意主机 | 出站白名单，仅允许名单的解析器 |
| SSN 到达了提供商 | 转发前没有掩码 | prompt 离开前先脱敏 PII |
| 401 `signature mismatch` | Body 字节被改过 | 发送文件的精确字节 |
| 401 `timestamp outside acceptance window` | 过旧或未来的时间戳 | 用当前 Unix 时间戳签名 |
| 已知投递 ID 上出现 409 | 同一 ID，不同 body | 使用新的投递 ID |
| `--dir, 16-byte key env and seconds 1..600 required` | 密钥太短或没有 inbox 目录 | 设置 16-byte WEBHOOK_SECRET 和 `--dir` |

## 问题
type: qa
from: phases/17-infrastructure-and-production/25-security-secrets-audit/docs/en.md, phases/17-infrastructure-and-production/26-compliance-frameworks/docs/en.md, phases/18-ethics-safety-alignment/24-regulatory-frameworks-eu-us-uk-korea/docs/en.md, projects/signed-webhook-inbox/README.md

- **如何对待 CI/CD 凭证？** 当作与生产等价。存进 vault。窄范围授权。积极轮换。
- **Type I 还是 Type II？** Type II。Type I 是入门。Type II 才是门槛。
- **202 是否意味着动作已执行？** 否。已认证的字节被持久接受。
- **跨司法辖区以哪套规则为准？** 最严格的，通常是 2026 年的 EU AI Act。
- **什么使 GPAI 成为系统性风险？** 训练算力超过 1e25 FLOP。
