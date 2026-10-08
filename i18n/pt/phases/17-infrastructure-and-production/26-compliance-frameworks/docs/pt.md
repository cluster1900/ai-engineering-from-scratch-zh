# Conformidade  SOC 2 ✓ HIPAA ✓ GDPR ✓ PCI-DSS ✓ EU AI Act ✓ ISO 42001

> Para os acordos empresariais de 2026, a cobertura de vários quadros é fundamental.**EU AI Act**A maioria dos requisitos de alto risco são aplicáveis a partir de 2026.**Colorado AI Act**:2026  6 月 30 日生效(((por SB25B-004 de 2026  2 月延期)  para sistemas de alto risco   realizar avaliações de impacto,并赋予申诉AI decisões.**SOC 2 Type II**A AI B2B 要求 (facto B2B 要求) 金融科技 需要类型II,而不是类型I) ⋅**GDPR**A maior multa específica de IA já registrada é a DPA holandesa em setembro de 2024 contra a Clearview AI em € 30,5 milhões; a Garante italiana em dezembro de 2024 contra a OpenAI em € 15 milhões; mais tarde, em março de 2026, a recusa foi rebatida.**HIPAA**Não há BAA, não pode enviar PHI para serviços externos de IA.**PCI-DSS**A interação de IA-camada 覆盖需要配置 + 合同协议, não será satisfeita automaticamente.**ISO 42001**O perfil de referência:OpenAI  mantenha SOC 2 Tipo 2 ISO/IEC 27001:2022 ISO/IEC 27701:2019 GDPR/CCPA/HIPAA (BAA) /FERPA, bem como PCI-DSS-Mapping de componentes de pagamento ChatGPT  Mapeamento transframeado de componentes de pagamento de ChatGPT  Mapeamento transframeado de fatigue de auditoria: controles de acesso  Mapeado para ISO 27001 A.5.15-5.18  GDPR Art. 32  HIPAA §164.312a) 

**类型：**- aprendizagem
**语言：**(Python 可选  conformidade é política + processo, não código)
**前置要求：**Fase 17 · 25 ((Segurança),Fase 17 · 13 ((Observabilidade)
**时间：**Cerca de 60 minutos

## Objectivo de aprendizagem

- 列举与LLM产品相关的72026框架,并将每个框架 匹配一个客户细分之一──
- 引用 EU AI Act enforcement timeline(2024年8月生效;2026年8月执行高风险要求) bem como dois tipos de multas (âmbito máximo) ((obligas de alto risco: 15 milhões de euros / 3%, práticas proibidas: 35 milhões de euros / 7%) 👇
- Explicar por que a limpeza de PII pós-processamento para o GDPR não é suficiente, e salientar que a redação em tempo real da camada de inferência é um padrão de defesa.
- descrição do mapa de controlo transframework (por exemplo, controlo de acesso 映射到 ISO 27001 A.5.15-5.18 + GDPR Art. 32 + HIPAA §164.312(a))。

## 问题

 Requisitos de compra de clientes de uma empresa SOC 2 Tipo II  GDPR  HIPAA BAA  ISO 27001, bem como  Declaração de conformidade com a Lei de IA da UE  • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • • •

Multiframagem  cobertura não é LLM  problema  É problema de empresa-SaaS  problema,并叠加 LLM-específico 要求──2026                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

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

### Linha de tempo do Ato da IA da UE

- 2024 年 8 月 1 日:生效──
- 2025 年 2 月 2 日: práticas proibidas de IA 开始执行──
- 2026 年 8 月 2 日: sistemas de alto risco 開始執行 (realização da avaliação da conformidade, documentação, registos) 
- 2027 年 8 月: legislação harmonizada

Níveis de risco:Inaceitável (proibido)  Alto risco (conformidade + registros)  Limito de risco (transparência)  Mínimo de risco (não-constrangido)  A maioria dos B2B LLM SaaS ▌pertence a risco limitado; em emprego, crédito, educação, aplicação da lei, migração, serviços essenciais 

罚款(Art. 99): violação das obrigações de sistema de alto risco ((Art. 99(4)) até 15 milhões de euros ou o volume anual global de negócios de 3%; práticas proibidas de IA ((Art. 99(3)) até 35 milhões de euros ou 7%;适用较高者。

### GDPR  redação em tempo real é padrão

A limpeza pós-processamento ((( em LLM 看到后再编辑 PII) não é um modelo de forma defensiva  já se viu dados。

- Em LLM call                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
- Uma forma de tokenization (abordagem de mesha)
- 仅存编辑提示 + 已同意选择进原

Recent term execution case:DPA holandês em setembro de 2024 contra a Clearview AI ₹30.5M, é a maior multa GDPR específica para a IA registrada até o momento; Garante de Itália em dezembro de 2024 contra a OpenAI ₹15M, é a maior multa específica para a LLM, apesar de a multa ser revogada na apelação em março de 2026, e a decisão ainda está em análise adicional.

### HIPAA  BAA 不是可选项

没有签署 Business Associate Agreement,你不能将 PHI 发送给外部 AI services──三大超级级 LLM plataformas──Bedrock、Azure OpenAI、Vertex)都提供BAAs──OpenAI direct API 提供BAA──Antropic direct API 提供BAA──发送 PHI 前必须确认──

### SOC 2 Tipo II

Tipo I:controles 已设计并记录──
Tipo II:controle em 6-12 meses de funcionamento válido.

2026 ano de aquisições B2B 默认要求 II. Tipo I é iniciada; Tipo II é concluída.

常见审计驱动器:access logs(谁看了什么)  gestão de mudanças(cómo se depõe)  avaliações de riscos(cada trimestre)  resposta a incidentes(测试过吗?);;Fase 17 · 25

### Mapeamento transversal

Uma política de controlo de acesso  satisfaire vários controlos-quadro:

| Control | Frameworks |
|---------|-----------|
| Access logging | ISO 27001 A.5.15-5.18、GDPR Art. 32、HIPAA §164.312(a) |
| Change management | ISO 27001 A.8.32、PCI DSS Req. 6、HIPAA breach-notification scope |
| Encryption in transit | ISO 27001 A.8.24、GDPR Art. 32、HIPAA §164.312(e) |
| Secrets management | ISO 27001 A.8.19、PCI DSS Req. 8、SOC 2 CC6.1 |

Ferramentas de conformidade (Drata, Vanta, Secureframe) automatizarão este tipo de mapeamento.

### ISO 42001  新兴

A ISO 27001 tornou-se um requisito de compra cada vez mais comum. É um quadro de governança da IA, abrangendo a gestão de riscos, qualidade de dados, transparência, supervisão humana.

### Profil de referência de OpenAI

OpenAI  manter SOC 2 Tipo 2 ISO/IEC 27001:2022 ISO/IEC 27701:2019 GDPR/CCPA/HIPAA (BAA) /FERPA, bem como PCI-DSS dos componentes de pagamento ChatGPT  This大致就是 2026 企业桌面的股份──

### Você deve lembrar-se de números

- A lei da UE sobre IA  штрафа: máximo de 15 milhões de euros / 3% (artigo 99 (4)); máximo de 35 milhões de euros / 7% (artigo 99 (3)) 
- A lei da UE sobre IA: aplicação de riscos elevados:
- 已记录的最大 AI-specific GDPR fine: €30.5M,Clearview AI(DPA holandês,2024年9月)
- A maior multa do RGPD específica para o LLM: €15M,OpenAI(Garante da Itália,2024 年 12 月;2026 年 3 月上诉推翻)
- SOC 2 Tipo II 窗口:6-12 个月的已运行控制──
- Colorado AI Act 生效日期:2026 年 6 月 30 日((由 SB25B-004 从 2026 年 2 月延期)


```figure
i4-control-matrix
```

## Use-o

`code/main.py`É uma planilha de mapeamento de conformidade escrita em Python, que determina um controle, lista os quadros que o satisfazem.

## Entrega-o

本课会生成 `outputs/skill-compliance-matrix.md` Determinar o segmento de clientes e a sua geografia, definir os quadros necessários e os controles.

## 练习

1. Seu primeiro cliente empresarial  requer SOC 2 Tipo II  HIPAA BAA  EU AI Act declaração                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
2.  O que será o resultado de uma alteração dos níveis de risco de três produtos de MLL em conformidade com a Lei da UE sobre IA?
3. Tu inesperadamente enviaste PHI para um fornecedor sem BAA.
4. 论证 ISO 42001 para um fornecedor de IA de mercado médio para dizer se em 2026 é necessário
5. • A fase 17 · 25) é projetada em pelo menos três controles-quadro:

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

- [OpenAI Security and Privacy](https://openai.com/security-and-privacy/)  Referir-se ao perfil de conformidade。
- [GuardionAI — LLM 合规 2026：ISO 42001, EU AI Act, SOC 2, GDPR](https://guardion.ai/blog/llm-compliance-guide-iso-42001-eu-ai-act-soc2-gdpr-2026)
- [Dsalta — SOC 2 Type 2 审计指南 2026：10 个 AI 控制措施](https://www.dsalta.com/resources/ai-compliance/soc-2-type-2-audit-guide-2026-10-ai-powered-controls-every-saas-team-needs)
- [EU AI Act official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) fonte primária。
- [Colorado AI Act](https://leg.colorado.gov/bills/sb24-205) fonte primária。
- [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html) Sistema de gestão de IA 标准。
