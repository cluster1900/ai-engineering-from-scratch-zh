# Uyum  SOC 2 ✓ HIPAA ✓ GDPR ✓ PCI-DSS ✓ EU AI Yasası ✓ ISO 42001

> 2026 yılı için kurumsal anlaşmalar için, çok çerçeve kapsamı temel bir kapıdır.**EU AI Act**• 2024 yılından itibaren yüksek riskli bir sistem yükümlülüklerinin çoğu 2026 yılından itibaren uygulanmaktadır. Yüksek riskli bir sistem yükümlülüklerinin cezası en fazla 15 milyon Euro veya küresel yıllık işletme hacminin %3'üdir.**Colorado AI Act**:2026 yıl 6 月 30 日生效((den SB25B-004 tarafından 2026 yıl 2 月延期)  Yüksek riskli sistemlere  etkisi değerlendirmeleri yapma,并赋予申诉AI kararlarının hakları──Virginia 在信用/就业/住房/教育方面类似──**SOC 2 Type II**Gerçekte B2B AI 要求(fintech 需要Type II,而不是Type I) **GDPR**Kaydedilen en büyük AI-specifik ceza: 2024'te Clearview AI'ye yapılan 30.5 milyon Euro'dan İtalya'nın Garanti'si 2024'te yapılan 15 milyon Euro'dan OpenAI'ye yapılan Garanti'si.**HIPAA**:受医疗保健约束  没有BAA,不能将PHI 发送到外部AI服务──**PCI-DSS**:AI-interaksyon katman 覆盖配置 + 合同协议, otomatik olarak yerine gelmez.**ISO 42001**Yeni gelişmiş AI yönetimi 標準,正与ISO 27001 一起成为越来越常见的采购要求──参考资料:OpenAI 维持 SOC 2 Type 2、ISO/IEC 27001:2022、ISO/IEC 27701:2019、GDPR/CCPA/HIPAA (BAA) /FERPA,以及ChatGPT ödeme bileşenlerinin PCI-DSS──跨框架映射可减少审计疲劳:访问控制 映射到ISO 27001 A.5.15-5.18、GDPR Art. 32、HIPAA §164.312a((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((

**类型：**Öğrenme
**语言：**(Python 可选  uyumluluk politikası + süreç değil kod)
**前置要求：**17 · 25 · Güvenlik, 17 · 13 · Gözlemlilik
**时间：**60 dakika kadar .

## Öğrenme hedefi

- LLM ürünleri ile ilgili yedi 2026 çerçeveyi listeler ve her çerçeve bir müşteri segmentine uyum sağlayacak.
- 引用 EU AI Yasası uygulanma zaman çizelgesi(2024 yıl Ağustos 生效;2026 yıl Ağustos  要求执行 high risk) ve iki sınıf cezalar 限  yüksek riskli yükümlülükler: 15M / 3%, yasak uygulamalar: 35M / 7%) 
- 解释为什么处理后 PII temizliği GDPR için yeterli değil,并指出实时推断层编辑是可辩护标准──
- 描述跨框架控制映射(例如,access control 映射到ISO 27001 A.5.15-5.18 + GDPR 32 + HIPAA §164.312(a))

## 问题

Bir işletme müşteri'nin satın alma talepleri SOC 2 Tipi II, GDPR, HIPAA BAA, ISO 27001, ve EU AI Yasası uyumluluk açıklaması──Tekibi sadece SOC 2 Tipi I.

Çoklu çerçeve kapsamı LLM değil  Bu kurumsal-SaaS  sorun,并叠加 LLM-spesifik 要求──2026 yılının satın alma ekibi bir matris istiyor: her çerçeve, bir satır, her kontrol, bir satır, bir PDF değil.

## 概念

### 七个框架

| Framework | 范围 | LLM-specific requirement |
|-----------|-------|--------------------------|
| SOC 2 Type II | B2B SaaS baseline | 在 6-12 个月内审计 process controls |
| HIPAA | US healthcare | 需要 BAA；没有签署协议，PHI 不能离开 infrastructure |
| GDPR | EU users | Real-time PII redaction；data subject rights；Article 30 records |
| PCI-DSS | Payment data | AI 接触 payment 时需要 configuration + contracts |
| EU AI Act | Serving EU users | Risk tier classification；high-risk systems：conformity assessment、documentation、logging |
| Colorado AI Act | Serving CO residents | Impact assessments；right to appeal |
| ISO 42001 | AI governance | 新兴；与 ISO 27001 搭配 |

### AB AI Yasası Zaman çizelgesi

- 2024 yıl 8 月 1 日:生效──
- 2025年 2月 2日: yasaklı AI uygulamaları 开始执行──
- 2026 yıl 8 月 2 日: yüksek riskli sistemler  başlatılmaya başlayın  uyumluluk değerlendirmesi  belgeleme  kayıt)
- 2027 年 8 月:harmonizasyon yasası

Risk seviyeleri: Kabul edilemez( yasak) ✓ Yüksek riskli( uyumluluk + kaydı kaydetme) ✓ Sınırlı riskli ✓ Şeffaflık) ✓ Asgari riskli ✓ sınırsız ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓  ✓ ✓ ✓ ✓ ✓ ✓   ✓ ✓      ✓    

罰款(Maddesi 99): yüksek riskli sistem yükümlülüklerini ihlal etmek(Maddesi 99(4)) 15M veya küresel yıllık işletme hacmi % 3; yasaklanan AI uygulamaları(Maddesi 99(3)) 35M veya % 7;适用较高者。

### GDPR  Gerçek zamanlı düzenleme  standard

İşlem sonrası temizlik (((在LLM 看到后再编辑 PII) değil可辩护姿态  model 已看到了数据──; Gerçek zamanlı sonuç katman redaksiyonu 2026 yılının standartıdır:

- LLM çağrısı  önce kuruluş tanınması yapılmaktadır。
- Birliği Tokenizasyon (Mesh yaklaşımı)
- 仅存编辑提示 + 已同意选择进原

Son dönem yürütme örneği: Hollanda DPA'sı, Clearview AI'ye karşı 2024 yılının Eylül ayında 30,5 milyon €'da, şimdiye kadar kaydedilen en büyük AI-spesifik GDPR cezasını; İtalya'nın Garante'si, OpenAI'ye karşı 2024 yılının 12 ayında 15 milyon €'da, en büyük LLM-spesifik cezasını, bu cezanın 2026 yılının 3 ayında başvurmada iptal edilmesine rağmen, karar daha da fazla incelemede bulunmaktadır.

### HIPAA  BAA 不是可选项

没有签署商业合作伙伴协议,你不能将PHI 发送给外部AI服务──三大超级级LLM平台──Bedrock、Azure OpenAI、Vertex)都提供BAAs──OpenAI direct API──提供BAA──Anthropic direct API──提供BAA──发送PHI 前必须确认──

### SOC 2 II tip

Tip I:kontroller 已设计并记录──
Tip II:kontroller 6-12 ay içinde geçerli olarak yürürlüğe girmektedir.

2026 yıl B2B satın alma 默认要求 II. tip; I. tip; II. tip:门──

常见审计驱动者:访问日志(谁看了什么) 变化管理(如何部署) 风险评估(每季度)  olay tepkisi(测试过吗?)

### Çerçeve çaplı haritalama

Bir erişim kontrol politikası  满足多个框架控制:

| Control | Frameworks |
|---------|-----------|
| Access logging | ISO 27001 A.5.15-5.18、GDPR Art. 32、HIPAA §164.312(a) |
| Change management | ISO 27001 A.8.32、PCI DSS Req. 6、HIPAA breach-notification scope |
| Encryption in transit | ISO 27001 A.8.24、GDPR Art. 32、HIPAA §164.312(e) |
| Secrets management | ISO 27001 A.8.19、PCI DSS Req. 8、SOC 2 CC6.1 |

Uyumluluk araçları (Drata,Vanta,Secureframe) bu tür haritalamaları otomatikleştirecek.

### ISO 42001  新兴

2023 yılının sonuna doğru yayınlanan, ISO 27001 ile birlikte giderek daha yaygın bir satın alma gereksinimine dönüşmüştür.

### OpenAI'nin referans profili

OpenAI  SOC 2 Tipi 2 ̊ ISO/IEC 27001:2022 ̊ ISO/IEC 27701:2019 ̊ GDPR/CCPA/HIPAA (BAA) / FERPA, yanı sıra ChatGPT ödeme bileşenlerinin PCI-DSS ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊ ̊   ̊                                                                                                                                                              

### Hatırlamalı olduğun bir sayı var.

- AB AI Yasası  ceza: en fazla 15 milyon € / 3% (art. 99 (4)); en fazla 35 milyon € / 7% (art. 99 (3))
- AB AI Yasası Yüksek Riskli Uygulama:2026年 8月 2日──
- 已记录的最大 AI-specific GDPR fine: €30.5M,Clearview AI(Hollanda DPA,2024年9月)
- En büyük LLM-sözlü GDPR cezası: €15M,OpenAI(İtalya Garante,2024年 12月;2026年 3月上诉推翻)
- SOC 2 II Tipi  penceresi:6-12 个月的已运行控制──
- Colorado AI Yasası 生效日期:2026年 6 月 30 日;; SB25B-004 tarafından 2026 yıl 2 月延期)


```figure
i4-control-matrix
```

## Kullan

`code/main.py`Python'la yazılmış bir uyumlu haritalama kalıp sayfası  给定一个控制,列出它满足的框架──

## - Söyle.

本课会生成 `outputs/skill-compliance-matrix.md`△ Müşteri segmentini belirleyip coğrafiyi, gerekli çerçeveleri ve kontrolleri belirleyip belirleyip belirleyip belirle­

## 练习

1. İlk işçi müşteriniz SOC 2 Tipi II, HIPAA BAA, AB AI Yasası açıklaması gerektiriyor.
2. AB AI Yasası'na göre üç varsayımlı LLM ürünleri için risk seviyeleri için sınıflandırma yapılması. Yüksek riskli ürünlere girmelerinden sonra neler değişecek?
3. Bir BAA'nın sağlayıcısı olmayan bir şirketin PHI'si gönderdiğini tahmin ediyorsun.
4. 论证 ISO 42001 orta pazarlı bir AI satıcısına 2026 yılında gerekli olup olmadığını göstermek için.
5. LLM denetim günlüğü alanlarını (Phase 17 · 25) en az üç çerçeve kontrolüne göre görüntülemek için kullanın.

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

- [OpenAI Security and Privacy](https://openai.com/security-and-privacy/)  参照 Uyumlulık profili
- [GuardionAI — LLM 合规 2026：ISO 42001, EU AI Act, SOC 2, GDPR](https://guardion.ai/blog/llm-compliance-guide-iso-42001-eu-ai-act-soc2-gdpr-2026)
- [Dsalta — SOC 2 Type 2 审计指南 2026：10 个 AI 控制措施](https://www.dsalta.com/resources/ai-compliance/soc-2-type-2-audit-guide-2026-10-ai-powered-controls-every-saas-team-needs)
- [EU AI Act official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) ilk kaynaklı kaynak
- [Colorado AI Act](https://leg.colorado.gov/bills/sb24-205) ilk kaynaklı kaynak
- [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html) AI yönetim sistemi 标准。
