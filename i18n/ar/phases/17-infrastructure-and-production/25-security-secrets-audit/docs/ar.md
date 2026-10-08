# الأمن  الأسرار API المفاتيح 轮换 审计日志 防护

> 通過集中式 vault(HashiCorp Vault、AWS Secrets Manager、Azure Key Vault) eliminate Secrets 蔓延──绝不要把凭证存放在配置文件、VCS 中的 env files、spreadsheets 里──优先使用IAM 角色,而不是静态密钥;CI/CD 使用OIDC──AI-gateway 模式是 2026 年的关系解决方案:app → gateway → 模型提供商,gateway 在行程中从 Vault 拉取证凭凭──在库中轮换后,所有应用程序会在几分钟内获取更新,也不需要部署,需要保证有新的承诺.`api.openai.com`.`api.anthropic.com`等؛ منع جميع الخروج الآخر. في عام 2026، حدث ما دفع الهجوم على سلسلة التوريد، من خلال إختراق إثباتات CI / CD ، تمت بفضح آلاف عمليات نشر العملاء.

**Type:** Learn
**Languages:** Python (stdlib, toy PII-scrubber + audit-log writer)
**Prerequisites:** Phase 17 · 19 (AI Gateways), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## 學习目标
- 列举四种秘密-management antipatterns ((ملفات التكوين في VCS  hardcoded env  spreadsheet  static keys) ،并说出它们的替代方案──
- تفسير نمط إصلاحات البوابات الذكية للجرافات من الخزانة لماذا هو معيار الإنتاج 2026
- 实现一个带一致的标记化(相同值 →相同位holder) من مسح PII،让语义得以保留──
- تحدث عن حادث 2026 في سلسلة إمدادات Vercel ، وكذلك تعليماته عن نظافة الاعتمادات CI / CD

## 问题
أحد الممارسين قدّموا مفاتيح API`.env` لقد حذفوه بسرعة. ولكن هذه المفاتيح دخلت تاريخ الموقع.  مسح GitGuardian قد اكتسبتها. و عملية التدوير الخاصة بك هي في Slack  إخطار فريق.  تحديث 40 ملف إعدادات.  إعادة نشر جميع الخدمات.  8 ساعات بعد ذلك، نصف الخدمات قد تم التشغيل، والنصف الآخر لا يزال ينتظر نشر النوافذ.

بالإضافة إلى ذلك، تطلبات المستخدمة 包含إس إس إن لي هو 123-45-6789. تُرسل بسرعة إلى OpenAI──أنت تملك BAA، ولكن السياسة الداخلية 要求在转发前屏蔽 PII──你没有这样做──

بالإضافة إلى ذلك، يمكن للجرافة الجامعية في مجموعة EKS الخاصة بك الوصول إلى أي مضيف إنترنت. يمكن لشخص ما الوصول إلى أي مضيف إنترنت.

أمن خدمات ماجستير في مجال التعليمات العليا 必须处理这三类矢量── والطاقات الموثوقة المدعومة بالصندوق──PII scrubbing──网络输出过──审核日志──

## 概念
### 集中式 vault + IAM-role pull

**Vault**: خزنة هاشيكورب، مدير أسرار AWS، خزنة أزور مفتاح، مدير أسرار GCP.

**IAM role**: التطبيق / البوابة من خلال هويتها IAM  إجراء التحقق ، بدلا من مفتاح ثابتة.

**The AI-gateway pattern**: البوابة في طلب وقت من الخزنة 拉取 `OPENAI_API_KEY`في القبو، تم تغييرها، وطلبت في المرة القادمة الحصول على مفتاح جديد، لا حاجة لإعادة نشرها.

### سياسة الدوران ≤ 90 يوما

جميع مفاتيح API ✓ رموز الجذر الصندوق ✓ مؤشرات إئتمانية CI / CD‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬‬

### المسح السري

- **TruffleHog** على الالتزامات做 regex + entropy 检测。
- **GitGuardian** تجارية، 准确率高──
- **Gitleaks** OSS, فى مركز المعلومات المركزية

كل مرة تقوم بها، إذا تم اختبار السر الجديد، فمنع العلاقات

### وضعية عدم الثقة

- جميع الحسابات يجب أن تكون قادرة على إدارة الخدمات الخارجية
- 通過 SAML/OIDC استخدام SSO。
- RBAC ((مستند إلى الدور) أو ABAC ((مستند إلى الصفات) لاستخدام الحبة الدقيقة
- رموز قصيرة الأمد ((以小时计,而不是天)
- وضع الجهاز   فقط يسمح بتشغيل تشفير القرص

### غسل PII / PHI

في وقت لاحق  ترك infra  قبل:

1. الاعتراف بالكيانات ((مجال النقل العابر للأسف
2. الـ "الـ" "الـ" "الـ"`"My SSN is 123-45-6789"``"My SSN is [SSN_TOKEN_A3F]"`.
3. التكنولوجيا المتسقة ((مقاربة الشبكة): نفس القيمة 映射到同一位holder,让LLM保留关系。
4. 可选: على استجابة LLM القيام بتخريط العكس

مرشحات Regex ثابتة 能捕获基本模式;NER 能捕获更多──两者都用──

### الحواجز المدخلة + الخارجة

إدخال: منع إختراقات السجن المعلنة، مواضيع محظورة، حسب المستخدم

الناتج: باستخدام regex scrub 泄露的秘密(أنماط مفتاح API、سياقات الرفض وسط أنماط البريد الإلكتروني) ، باستخدام تصنيف 检测政策 violations。

### قائمة بيضاء للخروج من الشبكة

خدمات الـ LLM 位于专用子网:
- قائمة أبيض:`api.openai.com`.`api.anthropic.com`نقاط نهاية DB المتجهة نقاط نهاية الصندوق
- كل شيء: قطرة
- DNS 通過 المسؤول فقط resolver 避免 DNS-tunneling exfil)

### سجل المراجعة

كل مرة LLM المكالمة من سجل غير قابل للتغيير، يتضمن:
- طابع زمني
- المستخدم / المستأجر
- التفويض السريع (((من أجل الخصوصية، لا تسجل التفويض الخام)
- النموذج + النسخة
- الوسائل العلامة تعتبر
- تكلفة
- ردّة فعل
- أي رحلات حراسية

按法规要求保留(SOC 2 1 سنة،HIPAA 6 سنوات)

### حادثة "فيرسل" عام 2026

هجوم سلسلة التوريد: تم إغراق إئتمانات CI / CD المحتلة تم تفشي آلاف عمليات نشر العملاء.

### يجب أن تتذكر الرقم

- سياسة الدوران:≤ 90 يوما ً
- كل مرة تقوم بها
- ورسل 2026:معلومات ومدونات تم تسريبها
- احتفاظ سجلات المراجعة:SOC 2 = سنة واحدة،HIPAA = 6 سنوات


```figure
i4-vault-rotation
```

## استخدمها
`code/main.py`تطبيق مُنظّف للمعلومات الشخصية لعبة مع رمزية متسقة، وكذلك سجل مراجعة مُضاف فقط.

## 交付 it
本课生成 `outputs/skill-llm-security-plan.md` وفقاً لبرنامج التنظيم والحالة الحالية، تخطيط الهجرة إلى الصندوق

## التدريب
1. 运行 `code/main.py` إرسال اثنين من المشاركات نفس SSN الإرشادات‬  تأكيد اثنين الحصول على نفس الموقع‬
2. لتطبيق تنفيذ OpenAI + Anthropic + Weaviate vLLM-on-EKS  تصميم سياسة خروج الشبكة
3. هل وجدت مفتاحاً في تاريخ الموقع؟
4. يومياً ينمو 10 جيجابايت. مستويات الاحتفاظ بالتصميم.
5. 论证 العكسية التوكنة (把真实值替换回 LLM response) هل تستحق تعقيدها، أم جعلها أفضل للذين يحتفظون بها

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
- [Microsoft Presidio](https://github.com/microsoft/presidio) اكتشاف المعلومات الشخصية وتحديد اسمه
- [HashiCorp Vault docs](https://developer.hashicorp.com/vault/docs)
