# Data Provenance và đào tạo dữ liệu quản lý

> EU AI Act yêu cầu vào tháng 8 năm 2025 trước GPAI thiết lập các tiêu chuẩn loại bỏ có thể đọc được máy tính                                                                                                                                                                                                                                                  

**类型：**Học tập
**语言：**Python(stdlib,12 字段 California AB 2013 脚手架生成器)
**先修要求：**Giai đoạn 18 · 24(监管),Giai đoạn 18 · 26(các thẻ)
**时间：**~ 60 phút

## Học mục tiêu

- Mô tả California AB 2013 đối với đào tạo AI tạo 12 个强制字段规定的数据透明度.
- Nói rõ 2025 năm DPA đối với lợi ích hợp pháp LLM 训练的立场(Irish DPC、UK ICO、Hamburg、Cologne)
- 描述不可逆问题:为什么GDPR 删除权对已训练的神经网络 没有实际等价物──
- Nói cách khác, sự đồng ý trong cuộc khủng hoảng

## 问题

训练数据管理是每张模型卡 (Lớp 26) 和监管义务 (Lớp 24) 的上游──2024-2025 年,监管格局围绕三个原则收:opt-out 基础设施、根据数据集披露,以及对公开可用数据的合法利益 适配──未能在采集时合规的提供者,无法在下游补救──

## 概念

### California AB 2013

2024 năm ký kết. Đối với hệ thống được phát hành vào ngày 1 tháng 1 năm 2022 hoặc sau đó, tài liệu phải được phát hành vào ngày 1 tháng 1 năm 2026 hoặc trước đó.
1. Nguồn hoặc chủ sở hữu của tập dữ liệu:
2. Các dữ liệu tập hợp làm thế nào để thúc đẩy AI 系统预期目的的说明.
3. Số điểm dữ liệu trong tập hợp dữ liệu ((có thể chấp nhận phạm vi chung; động thái dữ liệu có thể sử dụng giá trị ước tính) ]]
4. Các mô tả về các điểm dữ liệu có nhãn nhãn kiểu của tập dữ liệu; không nhãn nhãn đặc điểm chung của tập dữ liệu)
5. Bộ dữ liệu có chứa bất kỳ dữ liệu nào được bảo vệ bởi bản quyền, nhãn hiệu hoặc bằng sáng chế hay hoàn toàn thuộc sở hữu công cộng không?
6. Số liệu có được mua hay được cấp phép không?
7. 数据集是否包含个人信息 (根据 Cal. Civ. Code §1798.140 (v))
8. 数据集 có chứa thông tin tổng hợp về người tiêu dùng không?
9.  Việc làm sạch, xử lý hoặc sửa đổi khác của nhà phát triển, cũng như mục đích dự kiến.
10. Thời gian thu thập dữ liệu; nếu thu thập vẫn đang diễn ra, cần phải nêu rõ:
11. Ngày sử dụng đầu tiên trong quá trình phát triển dữ liệu.
12. 系统是否使用或持续使用合成数据生成──

第 12 项 (dữ liệu tổng hợp) đối với tháng 2 等人 năm 2018 của các trang dữ liệu là một sự gia tăng mới.

### EU AI Act (Dân học 24) và TDM không tham gia

Điều khoản ngoại lệ của Đạo luật Bản quyền EU về khai thác văn bản và dữ liệu cho phép thực hiện đào tạo đối với nội dung có sẵn công khai, trừ khi người có quyền chọn không.

### Xu hướng DPA đối với lợi ích hợp pháp năm 2025

DPC Ireland(2025 năm 5 月 21 日): sau khi nhận ý kiến của EDPB,Meta sử dụng đầu tiên công khai EU/EEA kế hoạch thực hiện các bài tập nội dung người dùng trưởng thành được chấp nhận theo điều kiện có biện pháp bảo vệ. Cologne Tòa án khu vực cao hơn(2025 năm 5 月 23 日) bác bỏ lệnh cấm đối với Meta: bỏ phiếu  đã đủ.

趋同原则: lợi ích hợp pháp có thể được cung cấp lý do hợp lý cho việc đào tạo từ chối dựa trên nội dung có sẵn công khai và không cần sự đồng ý.

### ANPD Brazil(2024 年 6 月)

Vì thiếu minh bạch thông tin, Meta tạm dừng xử lý dữ liệu người dùng Brazil được sử dụng để đào tạo AI. Kết quả khác với EU DPAANPD  ưu tiên tính minh bạch, chứ không phải lợi ích hợp pháp có thể chấp nhận được.

### Vấn đề không thể đảo ngược

Cookie-consent là một cách thiết kế để theo dõi thực tế thời gian có thể đảo ngược.

部分补救:
- **Unlearning。**近似移除; thông qua MIA 衡量 (Dạy 22)
- **基于 influence function 的定位。**识别受该数据影响最大的权重; chọn性更新──
- **Fine-tune-suppression。**训练模型 từ chối xuất nguồn gốc của nội dung dữ liệu này.

Những phương pháp này không thể giải quyết hoàn toàn vấn đề.

### Động thái về nguồn gốc dữ liệu

Dataprovenance.org──Longpre、Mahari、Lee 等,Consent in Crisis(7月2024年): đối với AI 训练数据 Commons: 审计 quy mô lớn.

### Đây là vị trí ở giai đoạn 18.

Bài học 26 là mô hình cấp văn档. Bài học 27 là dữ liệu tập hợp cấp quản lý.


```figure
an-provenance-oneway
```

## Sử dụng nó

`code/main.py`Sẽ được tạo ra cho một bộ dữ liệu đồ chơi sinh ra phù hợp với California AB 2013 12 字段数据集摘要脚手架. Bạn có thể điền vào những đoạn này, và xem những đoạn nào sẽ kích hoạt quyền riêng tư hoặc quyền tác giả.

## 交付 nó

本课会产出 `outputs/skill-provenance-check.md` Đưa ra một tập dữ liệu để được đào tạo, nó sẽ kiểm tra AB 2013 12 字段覆盖、opt-out  cơ sở hạ tầng  DPA đối với nhau, cũng như đánh giá rủi ro không thể đảo ngược。

## 练习

1. 运行 `code/main.py`◊ Đối với một bộ dữ liệu đồ chơi 生成 12 字段摘要,并识别哪些字段说明不足──

2. Đạo luật bản quyền EU TDM opt-out là một mô hình tiêu chuẩn của ỹ hiệu opt-out, và sẽ được so sánh với robots.txt và C2PA No AI Training

3. 阅读 Data Provenance Initiative's Consent in Crisis(2024 年 7 月) ⋅ mô tả giới hạn tăng trưởng nhanh nhất của ba loại nội dung,并论证一个经济后果──

4. Năm 2025 DPA đã sẵn sàng chấp nhận việc sử dụng lợi ích hợp pháp cho việc đào tạo nội dung công cộng.

5. 勾勒一个训练数据来源宣言,使其能够与AB 2013 字段以及每个数据集的C2PA签署的来源链组合――识别一个技术障碍和一个法律障碍――

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|-----------------|------------------------|
| AB 2013 | “the California law” | Generative AI 训练数据透明度；12 个强制字段 |
| TDM exception | “text-and-data-mining” | EU Copyright Directive 中带 opt-out 的训练数据例外 |
| Legitimate interest | “the EU basis” | 可能为公共内容训练提供正当理由的 GDPR Article 6 依据 |
| Opt-out signal | “machine-readable no-train” | robots.txt、C2PA “No AI Training”、TDM.Reservation |
| Irreversibility | “cannot un-train” | model weights 中的数据无法被外科式移除 |
| Unlearning | “approximate removal” | 训练后干预，用于降低模型对特定数据的依赖 |
| Consent in Crisis | “the DPI audit” | 2024 年 7 月关于 robots.txt 限制加速增长的发现 |

## 延伸阅读

- [California AB 2013](https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2013) AI tạo 训练 dữ liệu minh bạch pháp luật
- [EU AI Act + GPAI Code of Practice (Lesson 24)](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) Bản quyền 章节
- [Longpre, Mahari, Lee et al. — Consent in Crisis (dataprovenance.org, July 2024)](https://www.dataprovenance.org/consent-in-crisis-paper) Kiểm tra DPI
- [IAPP — EU Digital Omnibus GDPR amendments (2025)](https://iapp.org/news/a/eu-digital-omnibus-amendments-to-gdpr-to-facilitate-ai-training-miss-the-mark) 监管背景
