# An ninh  Bí mật API Key 轮换 审核日志 防护

> 通过集中式 vault(HashiCorp Vault、AWS Secrets Manager、Azure Key Vault) xóa các bí mật 蔓延。绝不要把凭证存放在配置文件、VCS 中的 env files、电子表里。优先使用IAM角色,而不是静态密钥;CI/CD 使用OIDC。AI-gateway模式是2026年关系的解决方案:app → gateway →模型提供商,gateway 在行走时从 vault 拉证凭借──在库中轮换后,所有应用程序会在几分钟内获取更新,也不需要部署,也不需要在 Slack里有新承诺──使用轮换政策 ≤90天;每次都在使用TrumpleHog /GBAG /GBAP 扫描;VIP 代码提供商:GITV-O-C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;C;D;C;C;D;C;C;C;C;C;C;C;D;C;C;C;C;C;C;D;C;C;C;C;D;C;C;C;C;D;C;C;C;D;D;C;C;C;D;D;C;C;C;D;D;D;C;C;C`api.openai.com``api.anthropic.com`等; ngăn chặn tất cả các vụ việc khác xuất phát.2026: Vụ tấn công chuỗi cung ứng Vercel, thông qua các chứng chỉ CI / CD bị phá vỡ đã tiết lộ hàng ngàn cuộc triển khai của khách hàng.

**Type:** Learn
**Languages:** Python (stdlib, toy PII-scrubber + audit-log writer)
**Prerequisites:** Phase 17 · 19 (AI Gateways), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## Học mục tiêu
- 列举四种秘密管理反模式(VCS trong các tệp cấu hình, mã hóa cứng, bảng tính, khóa tĩnh),并 nói ra các thay thế cho chúng.
- 解释 AI-gateway-pulls-from-vault pattern 为什么是2026 sản xuất tiêu chuẩn
- 实现一个带一致的标记化 (相同值 → cùng vị trí) của PII scrubber,让语义得以保留──
- Nói về sự cố chuỗi cung ứng Vercel năm 2026, cũng như những bài học về vệ sinh chứng chỉ CI / CD.

## 问题
Một học sinh đã gửi các khóa API của `.env` Họ nhanh chóng xóa nó. Nhưng những chìa khóa này đã vào lịch sử git. GitGuardian scan đã bắt được nó, và quá trình quay của bạn là trong Slack.

Ngoài ra, các yêu cầu của người dùng 包含Nhanh SSN của tôi là 123-45-6789. Thêm vào đó, bạn có BAA, nhưng chính sách bên trong  yêu cầu trong chuyển phát trước ngăn chặn PII── bạn không làm như vậy──

Ngoài ra, LLM pod trong cluster EKS của bạn có thể truy cập bất kỳ máy chủ internet nào. Có người dùng tìm kiếm DNS để đưa dữ liệu ra miền bị tấn công kiểm soát. Không có gì ngăn chặn nó.

An ninh của các dịch vụ LLM  phải xử lý các loại vector này.

## 概念
### 集中式 vault + IAM-role pull

**Vault**: HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager。单一事实来源。

**IAM role**: app/gateway  thông qua danh tính IAM của nó 进行认证, thay vì khóa tĩnh──Vault 在代币 生命周期内返回秘密──

**The AI-gateway pattern**: Gateway 在请求时从库存拉取`OPENAI_API_KEY` 在库 中轮换; 下一次请求拿到新钥匙──无需重新部署──

### Chính sách quay ≤ 90 ngày

Tất cả các khóa API, mã hóa gốc kho tàng hình, tín chỉ CI/CD, quay tự động càng tốt, quay động cần ghi lại và theo dõi.

### Hình ảnh bí mật

- **TruffleHog** đối với các cam kết làm regex + entropy 检测。
- **GitGuardian** thương mại, tỷ lệ xác thực cao
- **Gitleaks** OSS, trong CI trung hành.

Mỗi lần tham gia đều được thực hiện. Nếu kiểm tra được bí mật mới, hãy ngăn chặn PR.

### Tương vị không tin cậy

- Tất cả các tài khoản phải được kích hoạt bởi MFA.
- 通过 SAML/OIDC 使用 SSO。
- RBAC (ròng dựa trên vai trò) hoặc ABAC (tựa trên thuộc tính) được sử dụng cho truy cập hạt mỏng.
- Các token ngắn hạn ((以小时计, thay vì天)
- Khả năng kích hoạt mã hóa đĩa của các thiết bị corp.

### Trải sạch PII / PHI

Trong khi đó, bạn sẽ phải đi qua một vài điểm.

1. Công nhận thực thể (nơi không gian NER、Presidio、 thương mại)
2. 屏蔽匹配到的实体:`"My SSN is 123-45-6789"`→ `"My SSN is [SSN_TOKEN_A3F]"`
3. Đánh dấu phù hợp (Mesh approach): cùng giá trị 映射到 cùng vị tríholder,让 LLM 保留关系。
4. 可选: đối với phản ứng LLM thực hiện bản đồ ngược lại.

Bộ lọc regex tĩnh 能 nắm bắt các mô hình cơ bản; NER 能 nắm bắt nhiều hơn.

### Các cửa ngắm đầu vào + đầu ra

Nhập: ngăn chặn các vụ jailbreak đã được biết, các chủ đề bị cấm, theo người dùng làm giới hạn tốc độ.

Kết quả: dùng regex scrub 泄露的秘密(API key patterns、拒绝文本 中的电子邮件模式), dùng phân loại 检测政策违规──

### Danh sách trắng xuất mạng

Dịch vụ LLM 位于专用子网:
- Danh sách trắng:`api.openai.com``api.anthropic.com`、vector DB endpoints、value endpoints。
- Mọi thứ khác: giảm đi.
- DNS  thông qua chỉ có phép giải quyết  tránh DNS-tunneling exfil)

### Lập nhật kiểm toán

Mỗi lần gọi LLM của nhật ký không thể thay đổi, bao gồm:
- Tiêu khắc thời gian.
- Người dùng / người thuê nhà
- Lần này là một thời gian để giữ riêng tư.
- Mô hình + phiên bản.
- Số tín hiệu.
- Chi phí:
- Phản ứng hash.
- Bất kỳ chuyến đi nào trên đường sắt.

按法规要求保留(SOC 2 1 năm,HIPAA 6 năm)

### Vụ tai nạn Vercel năm 2026

Phạm dịch chuỗi cung ứng: bị tấn công các chứng chỉ CI/CD bị phá vỡ  đã tiết lộ hàng ngàn việc triển khai của khách hàng.

### Bạn nên nhớ số

- Chính sách quay:≤ 90 ngày。
- Mỗi lần tham gia 扫描:TruffleHog / GitGuardian / Gitleaks
- Vercel 2026:CI/CD 凭据被泄露 → 数千个客户环境被泄露──
- Giữ hồ sơ kiểm toán: SOC 2 = 1 năm, HIPAA = 6 năm.


```figure
i4-vault-rotation
```

## Sử dụng nó
`code/main.py`实现 một đồ chơi PII scrubber với token hóa nhất quán, cũng như một bản ghi kiểm toán chỉ phụ gia.

## 交付 nó
本课生成 `outputs/skill-llm-security-plan.md` Theo phạm vi quy định và tình trạng hiện tại, quy hoạch di chuyển kho lưu trữ, scrubber, check-in log.

## 练习
1. 运行 `code/main.py` gửi hai trích dẫn cùng một SSN.
2. Để điều chỉnh việc triển khai vLLM trên EKS của OpenAI + Anthropic + Weaviate  thiết kế chính sách thoát mạng.
3. Bạn đã tìm thấy một khóa trong lịch sử git.
4. Bạn của sổ kiểm toán hàng ngày tăng lên 10 GB.
5. 论证 ngược-tokenization (把真实值替换回 LLM response) có đáng để phức tạp của nó, hay để người nắm giữ vị trí có thể thấy tốt hơn.

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
- [Microsoft Presidio](https://github.com/microsoft/presidio) Khám phá và ẩn danh PII
- [HashiCorp Vault docs](https://developer.hashicorp.com/vault/docs)
