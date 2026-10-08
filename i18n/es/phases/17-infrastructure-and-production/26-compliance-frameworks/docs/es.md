# Conformidad  SOC 2 ✓ HIPAA ✓ GDPR ✓ PCI-DSS ✓ EU AI Act ✓ ISO 42001

> Para los acuerdos empresariales de 2026, la cobertura multi-marco es la clave.**EU AI Act**La mayoría de las obligaciones de alto riesgo se aplican desde el 2 de agosto de 2026 y las multas de las obligaciones de alto riesgo se elevan a 15 millones de euros o al 3% del volumen de negocios anual mundial (art. 99 (4)); las multas de las prácticas prohibidas de IA se elevan a 35 millones de euros o al 7% (art. 99 (3)).**Colorado AI Act**:2026 年 6 月 30 日生效((由 SB25B-004 从 2026 年 2 月延期)  对高风险系统 进行影响评估,并赋予申诉AI决策的权利──Virginia 在信用/就业/住房/教育方面类似──**SOC 2 Type II**La IA B2B 要求 (Fintech 要求) de hecho necesita tipo II, y no tipo I).**GDPR**: La multa más grande registrada para la IA es la de la DPA holandesa de septiembre de 2024 a la de Clearview AI a €30.5M; la de la Garante italiana de diciembre de 2024 a la de OpenAI a €15M (más tarde se refuta en la demanda de marzo de 2026) ⋅ La redacción de PII en tiempo real es un estándar de defensa; limpieza postprocesada no es suficiente.**HIPAA**:                                                                                                                                                                                                                                                               **PCI-DSS**La interacción de la IA con la capa 覆盖需要配置 + 合同协议, no se satisface automáticamente.**ISO 42001**El perfil de referencia:OpenAI  mantener SOC 2 Tipo 2 ISO/IEC 27001:2022 ISO/IEC 27701:2019 GDPR/CCPA/HIPAA (BAA) /FERPA, así como el PCI-DSS-Mapping de los componentes de pago de ChatGPT  Mapeo transframeario de las funciones de pago de ChatGPT  Mapeo de la fatiga de auditoría  Control de acceso  Mareaje a la ISO 27001 A.5.15-5.18  Art. 32  HIPAA §164.312a 

**类型：**El aprendizaje
**语言：**(Python 可选  cumplimiento es política + proceso, no código)
**前置要求：**Fase 17 · 25(Seguridad),Fase 17 · 13(Observabilidad)
**时间：** 60 minutos

## El objetivo del aprendizaje

- 列举与LLM产品相关的72026框架,并将每个框架 匹配一个客户细分之一──
- 引用 cronograma de aplicación de la Ley de IA de la UE(2024 años 8 meses生效;2026 años 8 meses ejecutar requisitos de alto riesgo 要求) y dos clases de multas por encima de las cuales se aplican las obligaciones de alto riesgo: 15 millones de euros / 3%, prácticas prohibidas: 35 millones de euros / 7%) 👇
- Explicar por qué la limpieza de PII después del procesamiento del GDPR no es suficiente, y señalar que la redacción en tiempo real de la capa de inferencia es un estándar de defensa.
- describir el control de mapas transversales de marco (por ejemplo, control de acceso 映射到ISO 27001 A.5.15-5.18 + GDPR Art. 32 + HIPAA §164.312(a))。

##  problemas

 Los requisitos de compra de un cliente empresarial SOC 2 Tipo II, GDPR, HIPAA BAA, ISO 27001, así como la declaración de cumplimiento de la Ley de IA de la UE ••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••

El sistema de compras de 2026 quiere una matriz: cada marco una línea, cada control una fila, en lugar de un PDF.

## 概念

### 七个 marco

| Framework | 范围 | LLM-specific requirement |
|-----------|-------|--------------------------|
| SOC 2 Type II | B2B SaaS baseline | 在 6-12 个月内审计 process controls |
| HIPAA | US healthcare | 需要 BAA；没有签署协议，PHI 不能离开 infrastructure |
| GDPR | EU users | Real-time PII redaction；data subject rights；Article 30 records |
| PCI-DSS | Payment data | AI 接触 payment 时需要 configuration + contracts |
| EU AI Act | Serving EU users | Risk tier classification；high-risk systems：conformity assessment、documentation、logging |
| Colorado AI Act | Serving CO residents | Impact assessments；right to appeal |
| ISO 42001 | AI governance | 新兴；与 ISO 27001 搭配 |

### Línea de tiempo de la Ley de IA de la UE

- 2024 年 8 月 1 日:生效──
- 2025 年 2 月 2 日: prácticas prohibidas de IA 开始执行──
- 2026 年 8 月 2 日: sistemas de alto riesgo 开始执行(evaluación de la conformidad, documentación, registro)
- 2027 年 8 月: legislación armonizada 下产品中高风险系统──

Niveles de riesgo: inaceptables (prohibido) Alto riesgo (conformidad + registro) Limita riesgo (transparencia) Minimal riesgo (no restricción) La mayoría de los B2B LLM SaaS (Safas de gestión de empresas) Reciben un riesgo limitado; en empleo, crédito, educación, aplicación de la ley, migración, servicios esenciales, entre otros, se pueden generar riesgos altos―

罚款(Artículo 99): incumplimiento de las obligaciones del sistema de alto riesgo(Artículo 99(4)) hasta 15 millones de euros o el 3% del volumen de negocios anual global; prácticas prohibidas de IA(Artículo 99(3)) hasta 35 millones de euros o el 7%;适用较高者。

### GDPR  redacción en tiempo real es estándar

La limpieza de post-procesamiento (en LLM 看到后再编辑 PII) no es una forma de defenderse  el modelo 已看到了数据──La redacción en tiempo real de la capa de inferencia es el estándar de 2026:

- En LLM call  previo a realizar el reconocimiento de la entidad 
- Una línea de tokenización (Mesh)
- 仅存编辑提示 + 已同意选择进生

Reciente caso de ejecución:DPA holandesa de septiembre de 2024 contra Clearview AI se aplicó una multa de 30,5 millones de euros, la mayor multa GDPR específica de AI registrada hasta el momento; Garante de Italia de diciembre de 2024 contra OpenAI se aplicó una multa específica de 15 millones de euros, la mayor multa específica de LLM, aunque esta multa fue revocada en la demanda de marzo de 2026, y la decisión sigue en proceso de revisión.

### HIPAA  BAA 不是可选项

没有签署 Business Associate Agreement,你不能将PHI 发送给外部AI services──三大超级级LLM平台──Bedrock、Azure OpenAI、Vertex)都提供BAAs──OpenAI direct API 提供BAA──Antropic direct API 提供BAA──发送PHI 前必须确认──

### SOC 2 Tipo II

Tipo I: controles 已设计并记录──
Tipo II: controles en 6-12 meses de vigencia.

2026 años de adquisiciones B2B 默认要求 Tipo II。Tipo I es inicial;Tipo II es apertura──

常见审计驱动器:access logs(谁看了什么)  gestión de cambios(cómo se implementa)  evaluaciones de riesgos(cada trimestre)  respuesta a incidentes(测试过吗?)

### Mapeo de los marcos cruzados

Una política de control de acceso  satisfar múltiples controles marco:

| Control | Frameworks |
|---------|-----------|
| Access logging | ISO 27001 A.5.15-5.18、GDPR Art. 32、HIPAA §164.312(a) |
| Change management | ISO 27001 A.8.32、PCI DSS Req. 6、HIPAA breach-notification scope |
| Encryption in transit | ISO 27001 A.8.24、GDPR Art. 32、HIPAA §164.312(e) |
| Secrets management | ISO 27001 A.8.19、PCI DSS Req. 8、SOC 2 CC6.1 |

Las herramientas de cumplimiento (Drata, Vanta, Secureframe) automatizarán este tipo de mapas.

### ISO 42001  新兴

La aplicación de la norma ISO 27001 se ha convertido en un requisito de compra cada vez más común.

### Perfil de referencia de OpenAI

OpenAI  mantener SOC 2 Tipo 2 ISO/IEC 27001:2022 ISO/IEC 27701:2019 GDPR/CCPA/HIPAA (BAA) /FERPA, así como PCI-DSS de los componentes de pago ChatGPT 

### Debes recordar el número

- La ley de IA de la UE penación: hasta 15 millones de euros / 3% (obligatorias de alto riesgo,art. 99 (4)); hasta 35 millones de euros / 7% (prácticas prohibidas,art. 99 (3))
- La ley de IA de la UE de aplicación de la ley de IA de alto riesgo:
- 已记录的最大 AI-specific GDPR fine: €30.5M,Clearview AI(DPA holandés,2024 年 9 月) 👇
- La mayor multa del RGPD específica del LLM: €15M,OpenAI, Garante de Italia, 2024 年 12 月; 2026 年 3 月上诉推翻)
- SOC 2 Tipo II 窗口:6-12 个月的 ya ejecutados controles
- Colorado AI Act 生效日期:2026 年 6 月 30 日((por SB25B-004 desde 2026 年 2 月延期)


```figure
i4-control-matrix
```

## Usalo

`code/main.py`Es una hoja de cálculo de cumplimiento de mapas escrita con Python  给定一个控制,列出它满足的框架──

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-compliance-matrix.md` Se determinan los segmentos de clientes y la geografía, se especifican los marcos y los controles necesarios.

##  ejercicios

1. Su primer cliente empresarial  Requiere SOC 2 Tipo II  HIPAA BAA  EU AI Act declaración                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
2. ¿Qué cambios ocurrirán después de que los productos de LLM de tres hipótesis entren en una categoría de riesgo en virtud de la Ley de IA de la UE?
3. Tu accidentalmente enviaste PHI a un proveedor sin BAA.
4. 论证 ISO 42001 para un vendedor de IA de mercado medio para decir en 2026 si es necesario
5. • Los campos de registro de auditoría de su LLM (fase 17 · 25) se pueden mapear en al menos tres controles marco.

## 关键术语: "El hombre es un hombre"

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

- [OpenAI Security and Privacy](https://openai.com/security-and-privacy/)  Referir al perfil de cumplimiento
- [GuardionAI — LLM 合规 2026：ISO 42001, EU AI Act, SOC 2, GDPR](https://guardion.ai/blog/llm-compliance-guide-iso-42001-eu-ai-act-soc2-gdpr-2026)
- [Dsalta — SOC 2 Type 2 审计指南 2026：10 个 AI 控制措施](https://www.dsalta.com/resources/ai-compliance/soc-2-type-2-audit-guide-2026-10-ai-powered-controls-every-saas-team-needs)
- [EU AI Act official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) fuente primaria。
- [Colorado AI Act](https://leg.colorado.gov/bills/sb24-205) fuente primaria。
- [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html) Sistema de gestión de IA 标准。
