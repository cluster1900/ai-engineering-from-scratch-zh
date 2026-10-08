# Mô hình  Hệ thống và thẻ Dataset

> 三种文档格式构构构 AI 透明度的结构――Model Cards(Mitchell et al. 2019)  Mô hình: tập dữ liệu, phân nhóm phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân tích, phân, phân, phân, phân, phân, phân, phân, phân, phân biệt. 2023) ・Data Sheets for Datasets (Data Sheets) Gebru et al. 2018, CACM) 动机、组成、收集过程、标注、分发、维护;类比电子元件数据表──Data Cards(Pushkarna et al., Google 2022) 模块化分层细节(telescopic、periscopic、microscopic), như là đối tượng đối diện với các giới hạn của người đọc khác nhau──2024-2025 năm phát triển: thông qua LLM tự tạo(CardGen, Liu et al. (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) (Hua Kỳ) 2024);可验证证明 (Laminator, Duddu et al. (Tổng thống Liên minh châu Âu) Tháng 7 năm 2025);EU/ISO  giám sát thẻ đang xuất hiện.System Cards(Sidhpurwala 2024;Meta  hệ thống cấp độ minh bạch;"Bộ kế hoạch của sự tin tưởng" arXiv:2509.20394) 端到端 AI 系统文档,覆盖安全能力、即时注射、防护、数据-exfiltration 检测、与人类价值的一致性──

**Type:** Build
**Languages:** Python (stdlib, model-card + datasheet + system-card generator)
**Prerequisites:** Phase 18 · 18（安全框架），Phase 18 · 24（监管）
**Time:** ~60 分钟

## Học mục tiêu

- mô tả Mitchell et al. 2019 原始模型卡 和 Gebru et al. 2018 datasheet。
- 描述 Data Cards 的 thiên văn/độ hình/thấp quạt 分层──
- Mô tả Hệ thống thẻ và phạm vi bao gồm từ đầu đến cuối.
- Nói ra ba dự án phát triển 2024-2025 năm (đáng tự tạo, chứng minh khả thi, báo cáo bền vững)

## 问题

监管框架 (Lớp 24) và các chính sách an ninh phòng thí nghiệm (Lớp 18) đều yêu cầu các văn bản.

## 概念

### Mô hình thẻ ((Mitchell et al. 2019)

Chương:
- Chi tiết mô hình.
- Sử dụng dự định:.
- Các yếu tố (được sử dụng để đánh giá các yếu tố dân số hoặc môi trường liên quan)
- Métrics:
- Dữ liệu đánh giá:
- Dữ liệu đào tạo
- Phân tích số lượng (với các yếu tố 分组)
- Các cân nhắc đạo đức.
- chú ý và đề nghị:

采用问题:Oreamuno et al. 2023 đối với Hugging Face mô hình thẻ phát hiện kiểm toán, chỉ 0,3%  ghi lại các chỉ số về tính chất.

### Các trang dữ liệu cho các tập dữ liệu (Gebru et al. 2018)

类比电子元件 dữ liệu bảng.
- Động lực (Why create this data collection)
- Thành phần của nó chứa đựng gì (??).
- Quá trình thu thập (如何组装)
- Đánh dấu (如适用)
- Sử dụng (预期用途、禁止用途、风险)
- Phân phối.
- Bảo trì:

发表于 CACM 2021──data sheet 是上游文档;mô hình thẻ phụ thuộc vào xác thực của datasheet──

### Các thẻ dữ liệu (Pushkarna et al., Google 2022)

模块化分层细节──三个缩放层级:
- **Telescopic。**面向非专家的高层摘要──
- **Periscopic。**面向 ML thực hành viên của tầng trung
- **Microscopic。**面向审计员详细特征级文档──

边界对象框架:不同读者从同一文档中提取不同信息──

### Các thẻ hệ thống

范围:端到端 AI 系统, bao gồm mô hình + 安全 + 部署上下文──章节 thường bao gồm:
- Khả năng an toàn.
- Tiêm nhanh 防护。
- Data-exfiltration 检测。
- Cung cấp cho các công bố về giá trị con người.
- 事件响应.

Sidhpurwala 2024 和 Meta 系统级透明度工作──"Tầm nhìn của sự tin tưởng" (arXiv:2509.20394) sẽ được hình thành thành thẻ hệ thống để bổ sung cho các cấp độ triển khai.

### Phát triển 2024-2025

- **CardGen (Liu et al. 2024)。**Thông qua các thẻ tự tạo mô hình LLM; báo cáo称在标准化Michell 2019 字段上, hơn nhiều thẻ được viết bởi con người có tính khách quan cao hơn.
- **下载相关性 (Liang et al. 2024)。**详细的模型卡与HF上最高29%下载率升高相关采用压力现在由市场驱动,而不是只是合规驱动而已──
- **Laminator (Duddu et al. 2024)。**Thông qua Hardware TEE / 加密签名实现可验证证明允许模型卡携带索赔的证明,而不仅仅是索赔本人――
- **Sustainability (Jouneaux et al. July 2025)。**增加碳、水和计算能量耗足迹;新兴 ISO 标准──
- **Regulatory cards。**EU AI Act (Dân học 24) Quy tắc thực hành GPAI Cải minh 章节 yêu cầu các thẻ mô hình 作为合规制品。

### Đây là vị trí ở giai đoạn 18.

Bài học 24-25 là quản lý và CVE 层―― Bài học 26 là văn bản 层―― Bài học 27 là đào tạo quản lý dữ liệu, cũng là trên lưu hành của bảng dữ liệu―― Bài học 28 là nghiên cứu sinh thái hệ, sản xuất thẻ 中引用的评估――


```figure
an-card-scopes
```

## Sử dụng nó

`code/main.py`Để một bộ phận chơi game được triển khai, sẽ tạo ra một thẻ mô hình tối thiểu, tờ dữ liệu và thẻ hệ thống.

## 交付 nó

本课产 出 `outputs/skill-card-audit.md` Đưa ra một mô hình thẻ DATASheet hoặc thẻ hệ thống, nó sẽ kiểm toán chương trình √ số lượng phân组, cũng như liệu có bằng chứng có thể xác minh không.

## 练习

1. 运行 `code/main.py`◊ kiểm tra tạo ra các thẻ.  nhận dạng yếu ớt.

2. 扩展模型卡,加入跨两个人口统计群的量化分组分析 (Phương pháp phân tích số lượng)

3. 阅读 Oreamuno et al. 2023 关于 0.3% 采用率的内容── đề xuất một thay đổi cấu trúc đối với các quy tắc của thẻ mô hình, để nâng cao tỷ lệ sử dụng các cân nhắc đạo đức──

4. Laminator (Duddu et al. 2024) sử dụng TEEs 进行可验证证明――设计一个模型卡 字段,用于承载某项评估结果的加密证明,并描述验证者的角色――

5. Để bạn có thể viết một chương trình hoặc một giả tưởng triển khai trong quá khứ của bạn, hãy viết một System Card (System Card, không phải là Model Card)

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|------------|----------|
| Model Card | "the Mitchell card" | Mitchell et al. 2019 针对 ML models 的标准文档 |
| Datasheet | "the Gebru datasheet" | Gebru et al. 2018 针对数据集的标准文档 |
| Data Card | "the Pushkarna card" | Google 2022 模块化分层数据文档 |
| System Card | "the deployment card" | 包括安全栈在内的端到端 AI 系统文档 |
| Boundary object | "different readers, one doc" | Data Cards 框架：同一文档服务不同受众 |
| Verifiable attestation | "the Laminator attestation" | 附加到文档 claim 上的加密或 TEE 证明 |
| Sustainability field | "carbon / water footprint" | 2025 年出现的环境核算补充项 |

## 延伸阅读

- [Mitchell et al. — Model Cards for Model Reporting (arXiv:1810.03993, FAT* 2019)](https://arxiv.org/abs/1810.03993) 规范 mô hình thẻ
- [Gebru et al. — Datasheets for Datasets (CACM 2021, arXiv:1803.09010)](https://arxiv.org/abs/1803.09010) tờ dữ liệu 论文
- [Pushkarna et al. — Data Cards (Google 2022)](https://arxiv.org/abs/2204.01075) 分层数据文档
- [Sidhpurwala et al. — Blueprints of Trust (arXiv:2509.20394)](https://arxiv.org/abs/2509.20394) System Card 形式化
