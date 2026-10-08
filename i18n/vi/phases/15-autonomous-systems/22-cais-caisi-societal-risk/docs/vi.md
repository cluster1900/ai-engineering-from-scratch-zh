# CAIS、CAISI và quy mô xã hội风险

> Trung tâm An toàn AI (CAIS, San Francisco, được thành lập năm 2022) đã công bố bốn loại khung rủi ro: sử dụng xấu xa, AI chủng tộc, tổ chức rủi ro, AI Rogue, và tuyên bố về rủi ro tuyệt chủng vào tháng 5 năm 2023, tuyên bố này được ký bởi hàng trăm giáo sư và các nhà lãnh đạo công ty. Các nội dung của CAIS được công bố vào năm 2026 bao gồm: dùng cho mô hình AI đánh giá Dashboard  Chỉ số lao động từ xa  đánh giá AI mô hình  hợp tác với AI quy mô)  Tài liệu chiến lược siêu thông minh  Báo chí của Frontiers. Một thực thể khác: Trung tâm tiêu chuẩn và đổi mới AI của NIST (CAISI)                                                                                                                                                                              

**类型：**Học tập
**语言：**Python(stdlib,四类风险清单与缓解措施匹配器)
**先修要求：**Giai đoạn 15 · 19(RSP),Giai đoạn 15 · 20(PF + FSF)
**时间：**45 phút

## 问题

Các bài học 19 và 20 giới thiệu các chính sách quy mô trong phòng thí nghiệm. Bài học 21 giới thiệu đánh giá năng lực độc lập. Bài học này giới thiệu góc nhìn thứ ba: tạo ra thảm họa AI 风险 thảo luận công cộng và quản lý cơ sở của các tổ chức dân sự và chính phủ.

Có hai thực thể khác nhau rất quan trọng. CAIS là một tổ chức nghiên cứu phi lợi nhuận, phát hành để suy nghĩ về rủi ro AI, và phối hợp các tuyên bố công cộng. CAISI là trung tâm của chính phủ Hoa Kỳ bên trong NIST, chịu trách nhiệm với thỏa thuận tự nguyện hoạt động của phòng thí nghiệm và đánh giá khả năng không liên quan.

Nội dung thực hành là: Các khung rủi ro bốn loại của CAIS là các tài liệu trích dẫn rộng rãi nhất về quy mô xã hội rủi ro phân loại pháp luật.

## 概念

### CAIS  Trung tâm An toàn AI

- 创立时间:2022年,位于旧金山,由丹亨德里克斯及同事创立(这个名字指的是早期合作者,而不是当前共同创始人;当前领导层请参见CAIS 网站)
- 状态:501(c)(3) tổ chức phi lợi nhuận
- Kết quả quan trọng của năm 2023: Tuyên bố về nguy cơ tuyệt chủng, được ký kết chung bởi hàng trăm nhà nghiên cứu và CEO. Tuyên bố viết: Giảm nguy cơ AI dẫn đến tuyệt chủng, nên trở thành ưu tiên toàn cầu cùng với các bệnh dịch và chiến tranh hạt nhân, như các nguy cơ xã hội khác.
- Kết quả năm 2026: được sử dụng cho mô hình biên giới  đánh giá bảng điều khiển AI  Chỉ số lao động từ xa   cùng phát hành với AI quy mô                                                                                                                                                                                                                                            

### 4 loại khung

Các khuôn khổ của CAIS sẽ phân chia AI 风险 thảm họa thành bốn loại:

1. **恶意使用**: những kẻ có ý xấu sử dụng AI gây tổn thương (tích hợp vũ khí sinh học, thông tin sai trái, tấn công mạng)
2. **AI races**: phòng thí nghiệm, công ty hoặc quốc gia áp lực cạnh tranh thúc đẩy triển khai vượt qua ranh giới an toàn.
3. **组织风险**:实验室内部动态(安全文化失效、审计不足、安全资源不足) dẫn đến việc triển khai tồi tệ.
4. **Rogue AIs**: khả năng đủ mạnh AI  theo đuổi mục tiêu xung đột với phúc lợi con người.

Đây không phải là quy luật phân loại duy nhất; nhưng nó được trích dẫn nhiều nhất. Các loại không bị loại trừ lẫn nhau.

### 组织风险 tồn tại ở đâu

Trong bốn loại, cơ hội tổ chức là một loại có thể vận hành nhất của các nhà thực hành. Văn hóa an ninh của một phòng thí nghiệm, mức độ kiểm toán nghiêm ngặt, phòng thủ phân tầng và an ninh thông tin, quyết định khi mô hình của nó lên mạng, liệu thực sự triển khai các biện pháp kiểm soát trong bài học 1018 , hay những biện pháp kiểm soát này chỉ là một danh sách kiểm tra không được xác minh bởi người nào.

具体的组织风险杆包括:

- **安全文化**Các thành viên trong nhóm có cảm thấy mình có thể nâng cấp chống lại những lo ngại khi không trả giá cho công việc không?
- **严格审计**Các cuộc kiểm toán bên ngoài và bên trong đều cần. Chỉ cần kiểm toán bên trong tạo ra những báo cáo quá lạc quan.
- **多层防御**Không có một tầng đủ đầy đủ. Đây là chủ đề trải qua giai đoạn 15.
- **信息安全**: trọng lượng mô hình  rò rỉ dữ liệu  rò rỉ  giám sát-bypass 技术 rò rỉ.

### CAISI  Trung tâm tiêu chuẩn và đổi mới AI

- Trong NIST 内部运行──
- Với các phòng thí nghiệm biên giới 运行自愿协议
- 发布 về các hoạt động mạng, sinh học và vũ khí hóa học 风险 không liên quan đến khả năng đánh giá.
- Không giống như CAIS; viết tắt sẽ được kết hợp; kiểm tra URL của bạn để xác nhận bạn đang đọc cái gì.

Vai trò của CAISI là METR Private Have Laboratory Cooperation (đạo học 21) của công cộng ng đối phó với chính phủ.

### California SB-53

Dự luật Thượng viện California (Bill of California Senate) (20252026 会期) xử lý mô hình biên giới 带来的灾难性风险――草案 trong các điều khoản quan trọng bao gồm:

- 触发州级义务的特定能力值──
- Bảo vệ người báo cáo của nhân viên phòng thí nghiệm AI
- 针对灾难性失败的事故报告要求──

Nếu được ký kết, nó sẽ trở thành quy định giám sát rủi ro thảm họa cấp tiểu bang đầu tiên của Hoa Kỳ. Bất kể tình trạng ký kết của nó là gì, sự xuất hiện của dự luật sẽ ảnh hưởng đến cách các quốc hội tiểu bang khác xử lý vấn đề này.

### Social scale风险 không phải là vấn đề đơn giản

Phases 15 của quá trình chủ đề  phòng thủ sâu  tương tự áp dụng cho tầng lớp xã hội. Không có bất kỳ tổ chức nào, quản lý hoặc khung có thể đóng cửa rủi ro thảm họa.

- 实验室 phát hành chính sách quy mô (第 19、20 课)
- Bộ Ngoại giao đánh giá sinh sản xuất kết quả đo lường (第 21 课)
- 民间社会 thực hiện theo dõi và công khai truyền tải (CAIS)
- Chính phủ vận hành dự án tự nguyện và cơ sở giám sát (CAISI、SB-53)
- 实践者构建多层控制 (第 1018 课)

Đây là tổng kết cuối cùng của giai đoạn này: mỗi lớp trước đó là một lớp trong một lớp, sự hoàn chỉnh của toàn bộ lớp quan trọng hơn sức mạnh của bất kỳ một lớp nào.


```figure
a5-four-risks
```

## Sử dụng nó

`code/main.py`实现一个小型风险清单工具――给定一个拟议部署,它 sẽ dựa trên bốn loại风险类别标记该部署,并返回缓解措施检查清单――它 là một công cụ trợ giúp đọc hiểu khung, chứ không phải là một sự thay thế cho phán đoán của con người――

## 交付 nó

`outputs/skill-societal-risk-review.md`Hội thảo sẽ xem xét một triển khai từ góc độ của các hành vi rủi ro quy mô xã hội: nó đề cập đến những loại nào trong bốn loại rủi ro, đã có những biện pháp giảm thiểu nào, tổ chức rủi ro phơi bày là gì.

## 练习

1. 运行 `code/main.py` Đưa vào ba bộ phận khác nhau của bộ phận này.

2. 完整阅读 CAIS 四类风险论文──选择一个风险类别,写两段说明你认为该类别中最重要的是什么.

3. Đọc bản thảo hiện tại của California SB-53 tìm ra một điều khoản mà bạn nghĩ sẽ tăng cường tình trạng rủi ro thảm họa, cũng như một điều khoản mà bạn nghĩ sẽ làm suy yếu nó.

4.  chọn một sản xuất AI bạn biết  triển khai (của riêng bạn hoặc công khai phát triển)  Theo tổ chức风险子杆 cho đánh giá của nó: văn hóa an ninh  kiểm toán nghiêm ngặt  nhiều tầng phòng thủ  an ninh thông tin  Cái nào yếu nhất? để nâng cao nó lên cấp độ đủ điều kiện cần phải có chi phí gì?

5. 勾勒一个反映一年额外能力进展和一年额外外署经验的2028 版四类风险框架―― Bạn sẽ thêm, xóa hoặc phân nhóm lại cái gì?

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|---|---|---|
| CAIS | “Center for AI Safety” | 非营利组织；四类风险框架；2023 年灭绝声明 |
| CAISI | “US government AI safety” | NIST Center；自愿协议；非涉密 evals |
| Four-risk framework | “CAIS 的分类法” | 恶意使用、AI races、组织风险、Rogue AIs |
| Malicious use | “恶意行为者使用 AI” | Bioweapons、disinformation、cyberattacks |
| AI races | “竞争压力” | 实验室/公司/国家推动部署越过安全边界 |
| Organizational risk | “实验室内部失败” | 安全文化、审计、防御、infosec |
| Rogue AI | “Misaligned agent” | 有能力的 AI 追求与人类福祉冲突的目标 |
| California SB-53 | “州级监管” | 2025–2026 年法案；如果签署，将成为 US 第一个州级灾难性风险监管法规 |

## 延伸阅读

- [Center for AI Safety](https://safe.ai/) 4 loại cơ quan khung rủi ro
- [CAIS — AI Risks that Could Lead to Catastrophe](https://safe.ai/ai-risk) 四类风险论文──
- [CAIS — May 2023 statement on extinction risk](https://safe.ai/statement-on-ai-risk) 简短的联合声明。
- [NIST CAISI](https://www.nist.gov/caisi) 面向政府的AI标准和创新中心──
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) Kết nối cam kết ở cấp phòng thí nghiệm với khuôn khổ quy mô xã hội.
