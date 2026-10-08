# Theo quy định của SOC 2  HIPAA  GDPR  PCI-DSS  EU AI Act  ISO 42001

> Đối với các hợp đồng doanh nghiệp năm 2026, đa khung bao phủ là một phần cơ bản.**EU AI Act**Từ năm 2024 đến ngày 1 tháng 8 tháng 8 tháng 8 ngày 1 tháng 8 tháng 8 tháng 2 ngày 7 tháng 8 năm 2026, hầu hết các yêu cầu rủi ro cao được thực hiện.**Colorado AI Act**:2026 年 6 月 30 日生效(由 SB25B-004 从 2026 年 2 月延期)  đối với các hệ thống có rủi ro cao 进行影响评估,并赋予申诉AI quyền quyết định.**SOC 2 Type II**Thực tế B2B AI 要求(fintech 需要类型II,而不是类型I)**GDPR**: Số tiền phạt nhất được ghi nhận về AI là DPA Hà Lan vào tháng 9 năm 2024 đối với Clearview AI là € 30.5M; Garante của Ý vào tháng 12 năm 2024 đối với OpenAI là € 15M (sau đó bị lật đổ trong vụ kiện vào tháng 3 năm 2026) ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅ ⋅                                                                                                                                                                                            **HIPAA**:受医疗保健约束  没有BAA,不能将PHI 发送给外部AI服务──**PCI-DSS**:AI-interaction-layer 覆盖需要配置 + 合同协议, sẽ không tự động đáp ứng.**ISO 42001**: 新兴 AI governance 标准,正与ISO 27001 一起成为越来越常见的采购要求. 参考资料:OpenAI 维持SOC 2 Type 2、ISO/IEC 27001:2022、ISO/IEC 27701:2019、GDPR/CCPA/HIPAA (BAA) /FERPA,以及ChatGPT thanh toán thành phần PCI-DSS── Cross-framework mapping 可减少审计疲劳:access controls 映射到ISO 27001 A.5.15-5.18、GDPR Art. 32、HIPAA §164.312a)

**类型：**Học tập
**语言：**(Python có thể chọn  tuân thủ là chính sách + quy trình, không phải mã)
**前置要求：**Giai đoạn 17 · 25 ((Tình độ an ninh),Giai đoạn 17 · 13 ((Tình trạng quan sát)
**时间：**约60分钟

## Học mục tiêu

- 列举与LLM产品相关的7框架2026 ,并将每个框架 匹配一个客户细分――
- 引用 EU AI Act thực thi thời gian(2024 年 8 月生效;2026 年 8 月执行高风险要求) và hai cấp phạt lên giới hạn(bản nghĩa vụ rủi ro cao: 15M / 3%, thực hành cấm: 35M / 7%) 👇
- 解释 tại sao việc làm sạch PII sau khi xử lý đối với GDPR không đủ,并 chỉ ra rằng biên dịch lớp suy luận thời gian thực là tiêu chuẩn có thể biện hộ.
- Mô tả bản đồ kiểm soát qua khung hình (ví dụ, kiểm soát truy cập) được hiển thị theo ISO 27001 A.5.15-5.18 + GDPR Nghệ 32 + HIPAA §164.312 (a))

## 问题

 yêu cầu mua hàng của khách hàng doanh nghiệp SOC 2 Type II, GDPR, HIPAA BAA, ISO 27001, cũng như EU AI Act tuyên bố tuân thủ ──

Multi-framework coverage không phải là LLM  vấn đề  Nó là vấn đề Enterprise-SaaS  vấn đề,并叠加 LLM- cụ thể 要求──2026 năm của nhóm mua sắm muốn là một Matrix: mỗi framework 一行,每个控制 一列, chứ không phải là một PDF──

## 概念

### 7 khung

| Framework | 范围 | LLM-specific requirement |
|-----------|-------|--------------------------|
| SOC 2 Type II | B2B SaaS baseline | 在 6-12 个月内审计 process controls |
| HIPAA | US healthcare | 需要 BAA；没有签署协议，PHI 不能离开 infrastructure |
| GDPR | EU users | Real-time PII redaction；data subject rights；Article 30 records |
| PCI-DSS | Payment data | AI 接触 payment 时需要 configuration + contracts |
| EU AI Act | Serving EU users | Risk tier classification；high-risk systems：conformity assessment、documentation、logging |
| Colorado AI Act | Serving CO residents | Impact assessments；right to appeal |
| ISO 42001 | AI governance | 新兴；与 ISO 27001 搭配 |

### Thời gian của EU AI Act

- 2024 年 8 月 1 日:生效──
- 2025 年 2 月 2 日: các hoạt động AI bị cấm bắt đầu thực hiện
- 2026 年 8 月 2 日:Các hệ thống rủi ro cao  bắt đầu thực hiện
- 2027 年 8 月: quy định hài hòa 下产品中高风险系统

Các cấp rủi ro:Không thể chấp nhận được (không được cấm) Mối rủi ro cao (nói hợp pháp + ghi chép) Mối rủi ro hạn chế ( minh bạch) Mối rủi ro tối thiểu (không bị ràng buộc)  Hầu hết các dịch vụ SaaS LLM B2B thuộc về rủi ro hạn chế; trong việc làm, tín dụng, giáo dục, thực thi pháp luật, di cư, các dịch vụ thiết yếu 中会触发 rủi ro cao──

罚款(Điều 99): vi phạm các nghĩa vụ hệ thống có rủi ro cao(Điều 99(4)) tối đa 15 triệu euro hoặc khối doanh nghiệp hàng năm toàn cầu 3%; các hoạt động AI bị cấm(Điều 99(3)) tối đa 35 triệu euro hoặc 7%;适用较高者。

### GDPR  biên tập thời gian thực là tiêu chuẩn

Việc làm sạch sau khi xử lý ((在 LLM 看到后再编辑 PII) không phải là một mô hình có thể được biện hộ  đã nhìn thấy dữ liệu。

- Trong cuộc gọi LLM  trước khi thực hiện công nhận thực thể.
- Một致的代号化 (Mesh) giữ nguyên语义──
- 仅存删除提示 + 已同意选择进生――

Trường hợp thực hiện gần đây:DPA Hà Lan vào tháng 9 năm 2024 với mức phạt 30,5 triệu euro đối với Clearview AI, là mức phạt GDPR cụ thể nhất về AI được ghi nhận cho đến nay; Garante của Ý vào tháng 12 năm 2024 với mức phạt 15 triệu euro đối với OpenAI, là mức phạt lớn nhất cụ thể về LLM, mặc dù khoản phạt này đã bị đảo ngược trong đơn kiện vào tháng 3 năm 2026, và quyết định vẫn đang được xem xét thêm.

### HIPAA  BAA 不是可选项

Không ký Hiệp định Đối tác Kinh doanh, bạn không thể chuyển PHI  gửi đến các dịch vụ AI bên ngoài.

### SOC 2 loại II

Loại I:chống chế đã được thiết kế并记录。
Loại II: kiểm soát trong 6-12 tháng có hiệu lực.

2026 năm B2B mua sắm 默认要求 Type II。Type I là khởi điểm;Type II là mở cửa。

常见审计驱动器: truy cập nhật ký(谁看了什么)  quản lý thay đổi (如何部署)  đánh giá rủi ro (每季度)  phản ứng với sự cố (测试过吗?)

### Phân tích khung chéo

Một chính sách kiểm soát truy cập  đáp ứng nhiều kiểm soát khung:

| Control | Frameworks |
|---------|-----------|
| Access logging | ISO 27001 A.5.15-5.18、GDPR Art. 32、HIPAA §164.312(a) |
| Change management | ISO 27001 A.8.32、PCI DSS Req. 6、HIPAA breach-notification scope |
| Encryption in transit | ISO 27001 A.8.24、GDPR Art. 32、HIPAA §164.312(e) |
| Secrets management | ISO 27001 A.8.19、PCI DSS Req. 8、SOC 2 CC6.1 |

Các công cụ tuân thủ (Drata,Vanta,Secureframe) sẽ tự động hóa loại bản đồ này.

### ISO 42001  新兴

Xuất bản vào cuối năm 2023 ở đây, ISO 27001 đã trở thành yêu cầu mua hàng ngày càng phổ biến.

### Tương tự OpenAI

OpenAI  duy trì SOC 2 Type 2 ISO/IEC 27001:2022 ISO/IEC 27701:2019 GDPR/CCPA/HIPAA (BAA) / FERPA, cũng như PCI-DSS của các thành phần thanh toán ChatGPT 

### Bạn nên nhớ số

- Luật AI của EU  phạt: tối đa 15 triệu euro / 3% (các nghĩa vụ rủi ro cao,Công nghệ 99(4)); tối đa 35 triệu euro / 7% (các hành vi bị cấm,Công nghệ 99(3))
- Đạo luật AI của EU: thực thi rủi ro cao: 2026 年 8 月 2 日
- 已记录最大 AI-specific GDPR fine: €30.5M,Clearview AI(DPA Hà Lan,2024 年 9 月)
- Cảnh sát: Đội hình: Giới chức Trung ương Trung ương Trung ương (CCC)
- SOC 2 Type II  cửa sổ:6-12 个月的已运行控制──
- Luật AI Colorado 生效日期:2026 年 6 月 30 日(由 SB25B-004 从 2026 年 2 月延期) ]]


```figure
i4-control-matrix
```

## Sử dụng nó

`code/main.py`là một bảng tính làm bản đồ tuân thủ được viết bằng Python  给定一个控制,列出它满足的框架──

## 交付 nó

本课会生成 `outputs/skill-compliance-matrix.md` Định thị phần khách hàng và địa lý, xác định các khung cần thiết và kiểm soát

## 练习

1. Khách hàng doanh nghiệp đầu tiên của bạn  yêu cầu SOC 2 Type II  HIPAA BAA  EU AI Act tuyên bố  Để giành chiến thắng trong giao dịch này, mức độ tuân thủ tối thiểu khả thi là gì?
2. Theo EU AI Act, các cấp rủi ro đối với ba giả định LLM sản phẩm sẽ được phân loại.
3. Bạn không ngờ đã gửi PHI cho nhà cung cấp không có BAA.
4. 论证 ISO 42001 đối với một nhà cung cấp AI trung bình thị trường để nói rằng trong năm 2026 liệu có cần thiết 🏼
5. Các trường kiểm toán của LLM của bạn sẽ được hiển thị cho ít nhất ba điều khiển khung.

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

- [OpenAI Security and Privacy](https://openai.com/security-and-privacy/)  Liên quan đến hồ sơ tuân thủ
- [GuardionAI — LLM 合规 2026：ISO 42001, EU AI Act, SOC 2, GDPR](https://guardion.ai/blog/llm-compliance-guide-iso-42001-eu-ai-act-soc2-gdpr-2026)
- [Dsalta — SOC 2 Type 2 审计指南 2026：10 个 AI 控制措施](https://www.dsalta.com/resources/ai-compliance/soc-2-type-2-audit-guide-2026-10-ai-powered-controls-every-saas-team-needs)
- [EU AI Act official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) nguồn chính。
- [Colorado AI Act](https://leg.colorado.gov/bills/sb24-205) nguồn chính。
- [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html) Hệ thống quản lý AI 标准。
