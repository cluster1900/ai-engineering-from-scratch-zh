# Güvenlik  Sırlar API Anahtar 轮换、Audit Günlükleri  Guardrails

> 通過集中式 vault(HashiCorp Vault、AWS Secrets Manager、Azure Key Vault) Secrets 蔓延──绝不要把凭证存放在配置文件、VCS içindeki env dosyaları、spreadsheets 里── öncelikli olarak IAM rolleri kullanmak yerine sabit anahtarlar;CI/CD kullanmak OIDC──AI-gateway modeli modeli modeli 2026 yılının çözüm yolu:apps → gateway → model sağlayıcısı,gateway 拉取证凭凭 在库中轮换后,所有应用会在几分钟内获取更新,也不需要部署,也不需要保留专业有新承诺──ROTATION 政策 ≤90日;每次都都在特鲁夫特洛格Hog /GBAG /PCP 扫描;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;VB;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V;V`api.openai.com`- Evet.`api.anthropic.com`2026 yılının olayları: Vercel tedarik zinciri saldırısı, saldırıya uğradığı CI / CD kimliklerini  yüzlerce müşteri dağıtımının çevresini sızdırdı.

**Type:** Learn
**Languages:** Python (stdlib, toy PII-scrubber + audit-log writer)
**Prerequisites:** Phase 17 · 19 (AI Gateways), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## Öğrenme hedefi
- 列举四种秘密管理反模式 (VCS içindeki yapılandırma dosyaları, sert kodlanmış ortamlar, tablolar, sabit anahtarlar) ve onların alternatiflerini ortaya çıkarmak için bir çözümler oluşturmak.
- 解释 AI-gateway-pull-from-vault model Neden 2026 üretim standardı?
- 实现一个带一致的标记化 (相同值 →相同位holder) 的 PII scrubber,让语义得以保留──
- 2026 Vercel tedarik zinciri olayı, ve bunun CI/CD akreditasyon hijyeninin öğretileri hakkında konuşuyor.

## 问题
Bir öğrenci API anahtarları ile gönderdi .`.env` Onlar çok hızlı bir şekilde sildiler.  Ama bu anahtarlar git tarihinde yer aldı. GitGuardian taraması onu yakaladı.

Ayrıca, kullanıcı sorguları 包含My SSN is 123-45-6789.                                                                                                                                                                                                                                                      

Ayrıca, EKS kümesindeki LLM podunuz herhangi bir internet makinesine ulaşabilir. DNS arama yoluyla birileri verileri saldırganın kontrol ettiği alanlara gönderebilir.

LLM hizmetlerinin Güvenliği 必須処理この三類ベクト──バルト temin edilen yetenekler──PII temizleme──ネットワーク çıkış filtrasyonu──Audit güncellikleri──

## 概念
### 集中式 vault + IAM rol çekimi

**Vault**: HashiCorp Vault, AWS Gizemleri Yöneticisi, Azure Key Vault, GCP Gizemli Yöneticisi。单一事实来源。

**IAM role**: app/gateway 通过其IAM身份 进行认证,而不是静态钥匙──Vault 在代币 生命周期内返回秘密──

**The AI-gateway pattern**Kapı: dilekçe kasadan çekil`OPENAI_API_KEY`▽ vault 中轮换; 下一次请求拿到新钥──无需重新配置──

### Dönüş politikası ≤ 90 gün

Tüm API anahtarları, valütes kök belirtileri, CI/CD kimlikleri, mümkün olduğunca otomatik dönüm, elinizdeki dönüm, kayıt ve takip gerektirir.

### Gizli tarama

- **TruffleHog**                                                                                                                                                                                                                                                              
- **GitGuardian** Ticari,准确率高──
- **Gitleaks** OSS, CI'de çalışmaktadır.

Her seferinde bir şey yaparsanız, yeni bir sır bulursunuzsa, PR'yi durdurun.

### Zira güvenli duruş

- Tüm hesaplar MFA'yı etkinleştirmek zorundadır.
- SAML/OIDC ile SSO kullanın.
- RBAC (roll-based) veya ABAC (attribute-based) ince tanelerle erişimi için kullanılır.
- Kısa ömürlü tokenlar, "tan" değil.
- Cihaz duruşu   sadece disk şifrelemesini etkinleştirmeye izin verir 

### PII / PHI temizleme

Bu yüzden hemen ayrılıyorum .

1. Kuruluş tanınması ((spaCy NER、Presidio、ticaret)
2. 屏蔽匹配到的实体:`"My SSN is 123-45-6789"`→ `"My SSN is [SSN_TOKEN_A3F]"`- Evet.
3. Düzgün bir tokenizasyon (Mesh yaklaşımı): aynı değer aynı yer tutumuna映射,让LLM保留关系──
4. Seçim: LLM tepkisine ters haritalama yapın.

Statik regex filtreleri 能捕获基本模式; NER 能捕获更多──两者都用──

### Giriş + çıkış koruma rayları

Giriş: Bilinen hapishaneler  yasak konuları durdurmak; kullanıcılara göre hız sınırı yapmak.

Çıktı: Using regex scrub 泄露的秘密(API anahtar kalıpları、önleme bağlamları 中的电子邮件 kalıpları),用分類器 检测政策違反──

### Ağ çıkış beyaz listesi

LLM hizmetleri 位于专用子网:
- Beyaz listesi:`api.openai.com`- Evet.`api.anthropic.com`、vector DB son noktaları、valtu son noktaları。
- Diğer her şey: düşmek.
- DNS 通過許可者のみ resolver (DNS tuneling exfil) 〜

### Denetim günlüğü

Her LLM çağrısı'nın değişmez günlüğü, içerir:
- Zaman damgası.
- Kullanıcı / kiracı:
- Hızlı haş, gizlilik için, çiğ haş kaydetmiyor.
- Model + versiyon.
- İşaret sayıları...
- Masrafı
- Cevaplı bir şey.
- - Herhangi bir koruma yolculuğu.

regulamalı gerekliliklere göre 保留(SOC 2 1 yıl,HIPAA 6 yıl)

### 2026 Vercel olayı

Tedarik zinciri saldırısı: 被攻破的CI/CD凭证 泄露了数千的客户部署的环境──教训:CI/CD凭证等同于产品──存入库──缩小范围──积极转转──

### Hatırlamalı olduğun bir sayı var.

- Dönüş politikası:≤ 90 gün¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
- Her seferinde 扫描:TruffleHog / GitGuardian / Gitleaks
- Vercel 2026:İŞİ/CD 凭据被泄露 → 数千个客户环境 泄露──
- Denetim günlüğü tutuluşu:SOC 2 = 1 yıl,HIPAA = 6 yıl


```figure
i4-vault-rotation
```

## Kullan
`code/main.py`✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓  ✓ ✓ ✓ ✓ ✓           ✓     ✓ ✓                                                                                                                             

## - Söyle.
本课生成 `outputs/skill-llm-security-plan.md` Yönetim kapsamına ve mevcut durumuna göre, planlama sandalye göç, tarama, giriş, denetim günlüğü

## 练习
1. 运行  İşlem`code/main.py`◊ göndermek iki aynı SSN'nin istekleri── onaylamak ikisi aynı yer tutmacıyı──
2. OpenAI + Anthropic + Weaviate'ın vLLM-on-EKS dağıtımını düzenlemek için  tasarım ağ çıkış politikası
3. Git tarihinde bir anahtar buldun mu? 2 yıl önce) ▽正确响应是什么:旋转键、擦历史,还是两者都做?说明理由──
4. Senin denetim günlüğü her gün 10 GB büyüyor.
5. 论证 ters tokenizasyon (把真实值替换回 LLM response) karmaşıklığına değer mi, yoksa yer sahipleri daha iyi görsün mi?

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
- [Microsoft Presidio](https://github.com/microsoft/presidio) PII tespit ve anonimleştirme。
- [HashiCorp Vault docs](https://developer.hashicorp.com/vault/docs)
