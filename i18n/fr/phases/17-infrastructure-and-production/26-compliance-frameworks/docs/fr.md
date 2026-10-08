# Conformité  SOC 2 ✓ HIPAA ✓ GDPR ✓ PCI-DSS ✓ EU AI Act ✓ ISO 42001

> Pour les accords d'entreprise de 2026, la couverture multi-cadres est la clé essentielle.**EU AI Act**La plupart des exigences de haute risque sont exécutées à partir de 2026 et sont appliquées à partir de 2 août 2026. Les sanctions imposées aux utilisateurs de l'UE sont globalement applicables.**Colorado AI Act**:2026 年 6 月 30 日生效((由 SB25B-004 从 2026 年 2 月延期) 对高风险系统进行影响评估,并赋予申诉AI的权利──Virginia 在信用/就业/住房/教育方面类似──**SOC 2 Type II**La technologie de l'IA est en réalité un type II, et non un type I.**GDPR**: la plus grande amende spécifique à l'IA jamais enregistrée est le DPA néerlandais à partir de septembre 2024 pour Clearview AI à 30,5 M€; la garantie italienne à partir de décembre 2024 pour OpenAI à 15 M€ (plus tard, en mars 2026) ⋅ la rédaction en temps réel des PII est un standard délibéré; nettoyage post-processage insuffisant.**HIPAA**:                                                                                                                                                                                                                                                               **PCI-DSS**:La couche d'interaction de l'IA 覆盖需要配置 + 合同协议, ne se remplit pas automatiquement.**ISO 42001**Le profil de référence:OpenAI  maintenir SOC 2 Type 2 ISO/IEC 27001:2022 ISO/IEC 27701:2019 GDPR/CCPA/HIPAA (BAA) /FERPA, ainsi que le PCI-DSS-Framme de cartes des composants de paiement ChatGPT  Réduire la fatigue auditive: contrôles d'accès 映射到ISO 27001 A.5.15-5.18  GDPR Art. 32  HIPAA §164.312a) 

**类型：**Apprendre à apprendre
**语言：**(Python 可选  conformité est politique + processus, pas code)
**前置要求：**La phase 17 · 25(Sécurité), la phase 17 · 13(Observabilité)
**时间：**À environ 60 minutes.

## Objectif de l'apprentissage

- L'élaboration de sept cadres 2026 liés aux produits LLM s'adaptera à un segment client.
- 引用 calendrier de mise en œuvre de la loi sur l'IA de l'UE(2024 ans août;2026 ans août: exécuter des exigences à haut risque  requirements) ainsi que deux niveaux de pénalités à haut risque (obligations à haut risque pour 15 M€ / 3%, pratiques interdites pour 35 M€ / 7%) 👇
- 解释为什么处理后PII清理对GDPR来说不够,并指出实时推断层编辑是可辩护标准──
- description du contrôle de cartographie interframeur (par exemple, contrôle d'accès 映射到ISO 27001 A.5.15-5.18 + RGPD Art. 32 + HIPAA §164.312(a))

##  problématique

 une demande d'achat de client d'entreprise SOC 2 Type II, GDPR, HIPAA BAA, ISO 27001, ainsi que  déclaration de conformité à la loi sur l'IA de l'UE ── votre équipe n'est qu'une SOC 2 Type I.

La couverture multi-cadres n'est pas un problème de LLM  C'est un problème d'entreprise-SaaS ,并叠加LLM-specific 要求──2026 年采购团队想要的是一个矩阵:每个框架 一行,每个控制 一列,而不是一个PDF──

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

### L'UE AI Act

- 2024 年 8 月 1 日:生效──
- 2025 年 2 月 2 日: pratiques interdites en matière d'IA 开始执行。
- 2026 年 8 月 2 日:systèmes à haut risque 开始执行(évaluation de la conformité, documentation, enregistrement)
- 2027 年 8 月: législation harmonisée

Les niveaux de risque:inacceptables (interdits)  Hauts risques (conformité + logement)  Limits de risque (transparence)  Minimum de risque (no restriction)  La plupart des B2B LLM SaaS (SaaS) ‒ relèvent de risques limités; dans l'emploi, le crédit, l'éducation, l'application de la loi, la migration, les services essentiels, 中会触发高风险──

罚款(article 99): contrefaçon des obligations du système à haut risque(article 99(4)) maximum de 15 millions d'euros ou de 3% de chiffre d'affaires global; pratiques interdites en matière d'IA(article 99(3)) maximum de 35 millions d'euros ou 7%;适用较高者。

### RGPD  rédaction en temps réel est une norme

Le système de rédaction de la couche d'inférence en temps réel est le standard de 2026:

- Dans le cadre de l'appel à la LLM, la reconnaissance d'entités doit être effectuée.
- Une approche de la marquise (Mesh)
- 仅存删除提示 + 已同意选择进生──

Cas d'exécution récent: la DPA néerlandaise a été condamnée à une amende de 30,5 M€ pour Clearview AI en septembre 2024; la garantie italienne a été infligée à OpenAI en décembre 2024 à une amende de 15 M€ pour OpenAI en décembre 2024; la sanction a été annulée en mars 2026 dans la plainte et la décision est toujours en cours de réexamen.

### HIPAA  BAA 不是可选项

没有签署 Business Associate Agreement,你不能将PHI 发送给外部AI services──三大超级级LLM平台──Bedrock、Azure OpenAI、Vertex)都提供BAAs──OpenAI direct API 提供BAA──Anthropic direct API 提供BAA──发送PHI 前必须确认──

### SOC 2 type II

Type I: contrôles 已设计并记录──
Type II: contrôles en cours de validité en 6 à 12 mois.

2026 années de la mise en marché B2B 默认要求 Type II。Type I est initier;Type II est ouvert。

常见审计驱动器:accès logs(谁看了什么) gestion des changements(如何部署) évaluations des risques(每季度) réponse aux incidents(测试过吗?);;Phase 17 · 25

### Cartographie des cadres croisés

Une politique de contrôle d'accès  satisfaire à plusieurs contrôles-cadres:

| Control | Frameworks |
|---------|-----------|
| Access logging | ISO 27001 A.5.15-5.18、GDPR Art. 32、HIPAA §164.312(a) |
| Change management | ISO 27001 A.8.32、PCI DSS Req. 6、HIPAA breach-notification scope |
| Encryption in transit | ISO 27001 A.8.24、GDPR Art. 32、HIPAA §164.312(e) |
| Secrets management | ISO 27001 A.8.19、PCI DSS Req. 8、SOC 2 CC6.1 |

Les outils de conformité (Drata,Vanta,Secureframe) automatiseront ce type de cartographie.

### ISO 42001  新兴

La mise en œuvre de l'ISO 27001 est devenue une exigence d'achat de plus en plus courante.

### Profil de référence de OpenAI

OpenAI  maintenir SOC 2 Type 2 ISO/IEC 27001:2022 ISO/IEC 27701:2019 GDPR/CCPA/HIPAA (BAA) /FERPA, ainsi que PCI-DSS des composants de paiement ChatGPT 

### Tu devrais te rappeler le nombre

- La loi sur l'IA de l'UE pension: maximum 15 millions d'euros / 3% (obligations à haut risque,art. 99 (4)); maximum 35 millions d'euros / 7% (pratiques interdites,art. 99 (3)) 
- La loi de l'UE sur l'IA: mise en œuvre à haut risque:
- 已记录的最大 AI-specific GDPR fine: €30.5M,Clearview AI(DPA néerlandais,2024 年 9 月)
- La plus grande amende du RGPD spécifique au LLM: 15 M€,OpenAI, Garante italienne, 2024 年 12 月; 2026 年 3 月上诉推翻)
- SOC 2 Type II 窗口:6-12 个月的已经运行控制──
- Loi sur l'IA du Colorado 生效日期:2026 年 6 月 30 日((由 SB25B-004 从 2026 年 2 月延期)


```figure
i4-control-matrix
```

## Utilisez-le

`code/main.py`Il s'agit d'un plan de calcul de conformité écrit en Python et de la mise en page de la carte.

## Je le livre.

本课会生成 `outputs/skill-compliance-matrix.md` déterminer le segment client et la géographie, déterminer les cadres et les contrôles nécessaires

## 练习

1. Votre premier client d'entreprise  demande SOC 2 Type II  HIPAA BAA  EU AI Act déclaration                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
2. Quels changements se produiront après la mise en place de produits de MLL à haut risque selon les niveaux de risque de l'UE en matière d'IA ?
3. Vous avez accidentellement envoyé des PHI à un fournisseur sans BAA.
4. 论证 ISO 42001 pour un fournisseur d'IA de marché moyen pour dire en 2026 si c'est nécessaire ──
5. La phase 17 · 25) est projetée dans au moins trois contrôles-cadres.

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

- [OpenAI Security and Privacy](https://openai.com/security-and-privacy/)  Rendre compte du profil de conformité
- [GuardionAI — LLM 合规 2026：ISO 42001, EU AI Act, SOC 2, GDPR](https://guardion.ai/blog/llm-compliance-guide-iso-42001-eu-ai-act-soc2-gdpr-2026)
- [Dsalta — SOC 2 Type 2 审计指南 2026：10 个 AI 控制措施](https://www.dsalta.com/resources/ai-compliance/soc-2-type-2-audit-guide-2026-10-ai-powered-controls-every-saas-team-needs)
- [EU AI Act official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) source principale。
- [Colorado AI Act](https://leg.colorado.gov/bills/sb24-205) source principale。
- [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html) Système de gestion de l'IA 标准。
