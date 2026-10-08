#  RSP, PF, FSF

> 三个主要实验室框架定义了2026年行业对边界能力的治理.Anthropic Responsible Scaling Policy v3.0(2026年 2月) giới thiệu các cấp độ an toàn AI phân cấp(ASL-1 đến ASL-5+),仿照生物安全等级; trong đó ASL-3 bắt đầu vào tháng 5 năm 2025 nhằm vào CBRN 相关模型.OpenAI Preparedness Framework v2(4月) 5 được định nghĩa là khả năng theo dõi tiêu chuẩn, sẽ phân chia các báo cáo năng lực và báo cáo bảo vệ.DeepMind Frontier Safety Framework v3.0(2025年 9月) giới thiệu các cấp độ an toàn quan trọng, bao gồm cả các cấp độ CCL mới không gây hại.

**Type:** Learn
**Languages:** none
**Prerequisites:** Phase 18 · 17 (WMDP), Phase 18 · 07-09 (deception failures)
**Time:** ~75 分钟

## Học mục tiêu
- Mô tả cấu trúc phân cấp ASL của Anthropic, cũng như là gì đã kích hoạt ASL-3:
- Nói ra 5 tiêu chuẩn về khả năng theo dõi trong OpenAI Preparedness Framework v2.
- Mô tả DeepMind's Critical Capability Level  cấu trúc và thao tác có hại CCL。
- Giải thích các điều khoản điều chỉnh đối thủ cạnh tranh, cũng như lý do tại sao chúng ảnh hưởng đến động thái cạnh tranh.
- 定义 an toàn trường hợp,并描述三支柱结构(monitoring, không thể đọc được, không thể đọc được)

## 问题
Chương 7-17 课已说明: lừa dối là có thể, khả năng sử dụng đôi khả năng, đánh giá cũng có giới hạn.
- 定义何时需要新的保障的值──
- 定义 quy mô  前所需的评估──
- Mô tả trường hợp an toàn  nên là gì.
- 处理竞争动态问题(Nếu đối thủ cạnh tranh xuất bản trong tình huống không có bảo vệ, bạn该怎么办?)

Ba khung này trong năm 2025-2026 đại diện cho các thực hành tiên tiến nhất hiện tại: chúng không hoàn hảo, vẫn đang phát triển, và giữa các phòng thí nghiệm đã đủ phù hợp, khiến các vấn đề quản lý hiện nay trở thành liệu các khung này có đủ hay không, chứ không phải liệu chúng có tồn tại hay không.

## 概念
### Chính sách quy mô chịu trách nhiệm nhân loại v3.0(2026 年 2 月)

ASL 结构:
- ASL-1: không phải mô hình biên giới (被弱于边界的基线覆盖)
- ASL-2:当前 biên giới cơ sở; sử dụng các biện pháp bảo vệ thường xuyên 部署。
- ASL-3: rủi ro sử dụng sai sót thảm họa cao hơn đáng kể; CBRN 相关能力──于2025年5月启动──
- ASL-4:AI R&D-2 vượt ngưỡng; có thể tự động hóa vào lớp nghiên cứu AI mô hình.
- ASL-5+: AI R&D tiên tiến; có thể tăng tốc đáng kể hiệu quả quy mô mô của mô hình.

Nội dung mới trong v3.0:
- Bản đồ đường bộ an toàn biên giới (→删减形式公开)
- Báo cáo rủi ro (quá trình xuất bản, phần qua kiểm tra bên ngoài)
- AI R&D được chia thành AI R&D-2 và AI R&D-4:
- Một khi vượt qua AI R&D-4, bạn cần một trường hợp an toàn chắc chắn, nhận thức mô hình theo đuổi các mục tiêu không phù hợp và rủi ro không phù hợp.

### OpenAI Preparedness Framework v2(2025 年 4 月 15 日)

Năm tiêu chuẩn về khả năng theo dõi:
- **Plausible.**Có mô hình đe dọa hợp lý.
- **Measurable.**Có thể thực hiện đánh giá kinh nghiệm.
- **Severe.**危害 rất lớn.
- **Net-new.**Không có nguy cơ gia tăng.
- **Instantaneous-or-irremediable.**危害 xảy ra nhanh chóng, hoặc không thể hủy bỏ.

满足全部五项的能力会被追踪.

Các cấu trúc khác của PF v2:
- Các báo cáo về khả năng (模型能做什么) và báo cáo bảo vệ (Safeguards) có những biện pháp kiểm soát (有哪些控制措施) chia rẽ.
- Nhóm tư vấn an toàn  tiến hành kiểm tra:
- Lãnh đạo  phê duyệt; Ủy ban An toàn & An ninh của Hội đồng quản trị 监督。
- "Thỏa khoản điều chỉnh": Nếu một phòng thí nghiệm khác được phát hành trong tình huống không có bảo vệ có thể so sánh, OpenAI có thể giảm yêu cầu.

### DeepMind Frontier Safety Framework v3.0(2025 年 9 月)

按领域划分的关键能力水平 (CCL):
- Tăng cường vũ khí sinh học
- Tăng cường mạng
- ML Tăng tốc R&D
- Hành động thao túng có hại (v3.0 新增): có thể thay đổi đáng kể mô hình niềm tin/ hành vi trong tình huống cao风险.

v2.0(2025 年 2 月) tăng cường Dishonest Alignment 部分,并为 ML R&D CCLs 增加更高的安全等级──

### Định hướng giữa các phòng thí nghiệm

- "Thỉ số khả năng" nhân văn.
- DeepMind "Cấp độ khả năng quan trọng".
- OpenAI "Thỉ số khả năng cao".

Không có tiêu chuẩn ngành thuật ngữ. Trong cấu trúc có một sự đồng nhất: khả năng biên giới ba tầng,并配有公开评估标准.

### Các trường hợp an toàn

Trường hợp an toàn là một bài luận văn bản, được sử dụng để giải thích trong trường hợp xấu nhất giả định:

- **Monitoring.**Nếu có hành vi xấu, chúng ta có thể kiểm tra được không?
- **Illegibility.**模型 có thiếu khả năng thực hiện kế hoạch phù hợp để gây tổn thương?
- **Incapability.**模型是否缺乏能力造成相关伤害?

Các trường hợp an toàn khác nhau đối với các trụ sở khác nhau. Đối với trường hợp CBRN ASL-3, không khả năng (via nonlearning) là mục tiêu chính. Đối với sự sắp xếp lừa đảo, giám sát và không thể đọc được là mục tiêu. Đối với nâng cao mạng,三者都相关。

### Vấn đề động lực chủng tộc

Các điều khoản điều chỉnh đối thủ cạnh tranh 具有争议性. Các nhà phê bình cho rằng chúng sẽ tạo ra sự cạnh tranh theo cấp: nếu ba phòng thí nghiệm đều giảm yêu cầu khi đối thủ cạnh tranh rời bỏ, cân bằng sẽ chuyển sang phía sau.

AISI UK, CAISI Mỹ và Văn phòng AI EU (第 24 课) là một khuôn khổ quản lý bên ngoài đối phó với các phương pháp.

### Nó nằm ở vị trí giữa giai đoạn 18

Chương 17-18 课在欺骗和红团 分析之上的测量-and-governance层――第 19-24 课覆盖福利、偏见、隐私、水标和监管结构――第 28 课绘制研究生态图谱(MATS, Redwood, Apollo, METR), những tổ chức này sẽ đánh giá 落地执行――


```figure
al-asl-ladder
```

## Sử dụng nó
本课没有代码──阅读三个主要来源:RSP v3.0、PF v2、FSF v3.0── sẽ phân cấp cấu trúc của mỗi phòng thí nghiệm được chiếu vào các phòng thí nghiệm khác, và mỗi phòng thí nghiệm sẽ tìm ra một ngưỡng được xác định nhưng các phòng thí nghiệm khác không xác định──

## 交付 nó
本课产 出 `outputs/skill-framework-diff.md` Đưa ra một khung an toàn hoặc thông báo phát hành, nó sẽ so sánh các định nghĩa ngưỡng của khung này, các đánh giá cần thiết và cấu trúc trường hợp an toàn với RSP v3.0 PF v2 FSF v3.0  và đánh dấu khoảng cách giữa phòng thí nghiệm 

## 练习
1. 阅读 RSP v3.0、PF v2 和 FSF v3.0──整理一张表,列出 mỗi phòng thí nghiệm CBRN ngưỡng、 từng AI R&D ngưỡng, cũng như từng yêu cầu đánh giá trước khi triển khai──

2. 三个框架(2025+) đều chứa điều khoản điều chỉnh đối thủ cạnh tranh.

3. Để vượt qua ngưỡng R&D-4 của AI nhân tạo mô hình thiết kế trường hợp an toàn.

4. FSF v3.0 của DeepMind giới thiệu CCL Manipulation Harmful. Nó đưa ra 3 phép đo kinh nghiệm để cho thấy mô hình đã vượt qua ngưỡng này.

5. 阅读 METR's "Common Elements of Frontier AI Safety Policies" (Điều kiện chung của các chính sách an toàn AI biên giới) ((2025) ⋅ nói ra ba điểm xu hướng giữa các phòng thí nghiệm mạnh nhất, cũng như hai điểm phân biệt lớn nhất.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| RSP | "Anthropic's framework" | Responsible Scaling Policy；ASL tiers；v3.0 2026 年 2 月 |
| PF | "OpenAI's framework" | Preparedness Framework；五项标准；v2 2025 年 4 月 |
| FSF | "DeepMind's framework" | Frontier Safety Framework；CCLs；v3.0 2025 年 9 月 |
| ASL-3 | "biosafety level 3-analog" | Anthropic 针对 CBRN 相关能力的层级；于 2025 年 5 月启动 |
| CCL | "critical capability level" | DeepMind 的 threshold construct；按领域划分 |
| Safety case | "the formal argument" | 书面论证，说明在 worst-case U 下部署是可接受地安全的 |
| Adjustment clause | "competitor defection allowance" | 如果竞争对手在没有可比 safeguards 的情况下发布，框架中允许降低要求的条款 |

## 延伸阅读
- [Anthropic — Responsible Scaling Policy v3.0（2026 年 2 月）](https://www.anthropic.com/responsible-scaling-policy) Lớp ASL 层, lộ trình  AI R&D 解
- [OpenAI — Updating the Preparedness Framework (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) 五项标准,调整条款
- [DeepMind — Strengthening our Frontier Safety Framework (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) CCL v3.0, Manipulation có hại
- [METR — Common Elements of Frontier AI Safety Policies (2025)](https://metr.org/blog/2025-03-26-common-elements-of-frontier-ai-safety-policies/) So sánh giữa các phòng thí nghiệm
