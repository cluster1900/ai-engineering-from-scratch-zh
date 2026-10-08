# 符合SOC 2、HIPAA、GDPR、PCI-DSS、EU AI法、ISO 42001

> 对于2026年企业交易来说,多框架覆盖是基本门.**EU AI Act**由于这些行为,该机构将对人工智能技术的使用者进行最高罚款,即:自2024年8月1日起生效.**Colorado AI Act**:2026年6月30日生效 (由SB25B-004从2026年2月延期) 对高风险系统进行影响评估,并赋予申诉AI决策的权利.**SOC 2 Type II**实际上,B2BAI需要II类型而不是II类型.**GDPR**据报道,目前已有最高的AI罚款是2024年9月对ClearviewAI的3050万欧元;意大利的保证人2024年12月对OpenAI的15万欧元;后来在2026年3月上诉中被推翻.**HIPAA**没有BAA,不能将PHI发送给外部AI服务.**PCI-DSS**覆盖需要配置+合同协议,不会自动满足.**ISO 42001**参考资料:OpenAI 维持SOC 2类型,2ISO/IEC 27001:2022、ISO/IEC 27701:2019、GDPR/CCPA/HIPAA (BAA) /FERPA以及ChatGPT支付元件的PCI-DSS──跨框架映射可减少审计疲劳:访问控制映射到ISO 27001 A.5.15-5.18、GDPR第32条、HIPAA §164.312a) ↓

**类型：**学习 课程
**语言：**(Python 可选  合规是政策+过程,不是代码)
**前置要求：**阶段17 · 25 阶段安全性
**时间：**约60分钟

## 学习目标

- 列举与LLM产品相关的7个2026年框架,并将每个框架与一个客户部门相匹配.
- 引用欧盟人工智能法执行时间表 ((2024年8月生效;2026年8月执行高风险要求) 以及两级罚款上限 ((高风险义务为1500万欧元/3%,禁止实践为3500万欧元/7%) 👇
- 解释为什么处理后 PII 清理对GDPR来说不够,并指出实时推断层编辑是可辩护标准.
- 描述跨框架控制映射(例如,访问控制映射到ISO 27001 A.5.15-5.18+GDPR 32条+HIPAA §164.312(a))。

## 问题

某企业客户的采购要求SOC 2类 II、GDPR、HIPAA BAA、ISO 27001,以及EUAI法规合规声明──你的团队只有SOC 2类 I──距离Type II还差不多六个月,而且还没有开始GDPR第30条记录────

跨框架覆盖不是LLM问题  它是企业SaaS问题,并叠加了LLM特定的要求.

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

### 欧盟人工智能法时间表

- 2024 年 8 月 1 日:生效.
- 2025 年 2 月 2 日:禁止人工智能实践开始执行.
- 2026年8月2日:高风险系统开始执行
- 2027 年 8 月:协调立法 下产品中高风险系统

风险级别:不可接受 (禁止) 高风险 (符合性+记录) 有限风险 (透明性) 最小风险 (无约束) 大多数B2B LLM SaaS 属于有限风险;在就业,信贷,教育,执法,移民,基本服务中会触发高风险――

罚款 (第99条):违反高风险系统义务 (第99条) (最高1500万欧元或全球年营业额3%;禁止人工智能实践 (第99条) (第3条)) (最高3500万欧元或7%);适用较高者──

### GDPR 实时编辑是标准

后处理清理 (在LLM 看到后再编辑 PII) 不可辩护姿态 模型 已看到了数据――实时推断层编辑是2026年标准:

- 在LLM电话之前进行实体认可.
- 一致的标记化 (Mesh方法) 保留语义──
- 仅存储已删除提示 + 已同意选择.

近期执行案例:荷兰DPA于2024年9月对Clearview AI处于3050万欧元,是迄今为止已记录的最大的AI特定GDPR罚款;意大利的Garante于2024年12月对OpenAI处于1500万欧元,是最大的LLM特定罚款,尽管该罚款在2026年3月上诉中被推翻,但裁决仍在进一步审查中.

###  HIPAA  BAA 不是可选项

没有签署商业合作伙伴协议,你不能将PHI 发送给外部AI服务――三大超级级LLM平台――Bedrock、Azure OpenAI、Vertex) 都提供BAAs――OpenAI直接API提供BAA──人类直接API提供BAA──发送PHI 前必须确认──

### 类型II的SOC2

类型I:控制已设计并记录.
类型II:控制在6-12个月内有效运行.

2026年B2B采购默认要求II类型――I类型是起点;II类型是门──

常见审计驱动程序:访问日志(谁看了什么) 变化管理(如何部署) 风险评估(每季度) 事件响应(测试过吗?)

### 跨框架映射

一项访问控制政策 满足多个框架控制:

| Control | Frameworks |
|---------|-----------|
| Access logging | ISO 27001 A.5.15-5.18、GDPR Art. 32、HIPAA §164.312(a) |
| Change management | ISO 27001 A.8.32、PCI DSS Req. 6、HIPAA breach-notification scope |
| Encryption in transit | ISO 27001 A.8.24、GDPR Art. 32、HIPAA §164.312(e) |
| Secrets management | ISO 27001 A.8.19、PCI DSS Req. 8、SOC 2 CC6.1 |

根据标准的要求, 系统将自动化这些类型的地图化.

### 标准标准42001  新兴

通过ISO 27001的标准,它成为越来越常见的采购要求.

### 开放AI的参考资料

开放AI 维持SOC 2类型 2,ISO/IEC 27001:2022、ISO/IEC 27701:2019、GDPR/CCPA/HIPAA (BAA) /FERPA以及ChatGPT支付组件的PCI-DSS──这大致就是2026年企业桌面的股票──

### 你应该记住的数字

- 罚款:最高1500万欧元/3% (高风险义务,第99条) (4);最高3500万欧元/7% (禁止行为,第99条)
- 欧盟人工智能法高风险执行:2026年8月2日
- 已有记录的最大的人工智能特定GDPR罚款:30.5M欧元,Clearview AI(荷兰DPA,2024年9月)
- 根据"法规"规定,在"法规"中,
- 窗口:6-12 个月的已运行控制
- 科罗拉多人工智能法案生效日期:2026年6月30日日 (由SB25B-004从2026年2月延期) ]]


```figure
i4-control-matrix
```

## 使用它

`code/main.py`是一个使用Python编写的合规绘图表  给定一个控制,列出满足的框架.

## 交付它

本课会生成`outputs/skill-compliance-matrix.md`△给定客户细分和地理,指定所需框架和控制.

## 练习

1. 为了赢得交易,最低可行的合规性是什么?
2. 根据欧盟人工智能法规,对三种假设的LLM产品进行分类.
3. 你意外地发送了PHI给没有BAA的供应商.
4. 论证ISO 42001对中型市场人工智能供应商来说,
5. 将您的LLM审计日志领域映射到至少三个框架控制点.

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

- [OpenAI Security and Privacy](https://openai.com/security-and-privacy/) 参考合规性配置.
- [GuardionAI — LLM 合规 2026：ISO 42001, EU AI Act, SOC 2, GDPR](https://guardion.ai/blog/llm-compliance-guide-iso-42001-eu-ai-act-soc2-gdpr-2026)
- [Dsalta — SOC 2 Type 2 审计指南 2026：10 个 AI 控制措施](https://www.dsalta.com/resources/ai-compliance/soc-2-type-2-audit-guide-2026-10-ai-powered-controls-every-saas-team-needs)
- [EU AI Act official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj)主要来源――
- [Colorado AI Act](https://leg.colorado.gov/bills/sb24-205)主要来源――
- [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html)人工智能管理系统标准――
