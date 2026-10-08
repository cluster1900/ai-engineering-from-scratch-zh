# 文档与图表理解

> 文档不是照片──PDF、科学论文、发票或手写表单包含布局、表格、图表、脚注、页眉和语义结构,这些是普通图像理解无法捕获的──VLM 之前的堆积是一个管线:Tesseract OCR + LayoutLMv3 + 表格抽取演理学──VLM 浪潮使用 OCR-free models 取代它──Donut (2022) 诺格 (2023) DocLLM (2023) 模型 能直接输出结构化标记──到2026年,前沿已经只是将页面图像以2576课程为本地输入 Claude Opus 4.7,结构化标记输输出这些得到自然本本  图文来源:

**Type:** Build
**Languages:** Python (stdlib, layout-aware document parser skeleton)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 5 (NLP)
**Time:** ~180 minutes

## Học mục tiêu

- 解释 tài liệu AI của ba thời đại: đường ống OCR, không OCR, VLM-độc địa.
- 描述 LayoutLMv3 的三类输入流:文本、布局(bbox)、图像补丁,以及统一掩饰──
- 比较 Donut(OCR-free,image → markup)、Nougat(科学论文 → LaTeX)、DocLLM(layout-aware generative)、PaliGemma 2(VLM-native)。
- Để làm việc mới, bạn nên chọn mô hình tài liệu.

## 问题

 hiểu được PDF này  có khó khăn trong việc lừa dối.

- 文本内容(90% 的信号)
- Layout (văn mặt, mặt, mặt, mặt)
- 表格(行、列、合并单元格)
- 图形和图表──
- - Tôi đã viết rất nhiều.
- 字体与排版(标题 vs 正文) 』

Có một hệ thống phát biểu cần biết "Total: $1,245" từ góc dưới phải, chứ không phải từ chữ cái.

## 概念

### Era 1  đường ống OCR(2021 年前)

经典 đống:

1. PDF → Mỗi trang hình ảnh
2. Tesseract (或商业 OCR)抽取文本,并提供逐词界框──
3. Layout analyzer 识别 khối (chủ đề, bảng, đoạn)
4. Tự nhận cấu trúc bảng 解析表格。
5. Quy tắc miền + regex 抽取字段。

适用于干净的印刷文本――遇到手写、倾斜扫描、复杂表格、非英语文字会崩── mỗi kiểu không thành công đều cần phải tự xác định con đường ngoại lệ──

### TrOCR (2021)

TrOCR(Li et al., arXiv:2109.10282) sử dụng trong synthesis + thực文本图像上训练的变体编码码码器, thay thế Tesseract 经典的CNN-CTC── nó đã đạt được lợi thế rõ ràng trên viết tay và nhiều ngôn ngữ văn bản── nó vẫn là ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn ống dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn ống dẫn dẫn dẫn dẫn dẫn ống dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn dẫn

### Thời đại 2  Không OCR(2022-2023)

Lập đầu tiên của các mô hình không OCR là: hoàn toàn vượt quá phát hiện, trực tiếp đưa các pixel hình ảnh 映射为结构化输出.

Donut ((Kim et al., arXiv:2111.15664):
- Bộ chuyển đổi mã hóa-đánh mã hóa, mã hóa là Swin-B──
- 输出 có thể là để biểu thị một cách đơn hiểu JSON ∞ để lấy dấu chỉ, hoặc bất kỳ sơ đồ nhiệm vụ cụ thể nào.
- Không OCR, không bố trí, không phát hiện.

Nougat(Blecher et al., arXiv:2308.13418):
- 专门在科学论文上训练──
- 输出是 LaTeX / đánh dấu xuống
-  xử lý phương trình 多 bố trí 图数
- Mỗi bộ phân tích archiv sẽ được sử dụng cho mô hình.

Những người này là chuyên gia, chứ không phải là người nói chung.

### LayoutLMv3 (2022)

另一条路线──LayoutLMv3(Huang et al., arXiv:2204.08387) giữ OCR, nhưng gia nhập sự hiểu biết về bố cục:

- 三类输入流:OCR text tokens、 từng token của 2D bounding boxes、image patches。
- 跨三种 modality 的 掩面训练目标(掩面文字、掩面补丁、掩面布局)
- 下游任务: phân loại, khai thác đơn vị, bảng QA

LayoutLMv3 là dựa trên hiểu biết tài liệu OCR 峰── nó rất mạnh trên biểu đơn và phát phiếu──上游需要 OCR──上具有最佳VLM 之前准确率──

### DocLLM (2023)

DocLLM(Wang et al., arXiv:2401.00908) là người em sinh của LayoutLM. Nó dựa trên các mã bố trí tạo ra các câu trả lời dạng tự do.

### Thời đại 3  VLM-tự do(2024+)

VLM năm 2024 đã đủ tốt, có thể hoàn toàn thay thế đường ống.

- LLaVA-NeXT 336-tile AnyRes  thích hợp cho các tài liệu nhỏ.
- Qwen2.5VL độ phân giải động nguyên sinh xử lý 2048+ pixel.
- Claude Opus 4.7 支持 2576px 文档。
- PaliGemma 2(2025 年 4 月) Khusus dành cho文档 + 手写训练。

Sự khác biệt giữa VLM-native và OCR-pipeline  nhanh chóng giảm đi. Đến năm 2026, VLM-native 在以下方面胜出:

- Văn bản cảnh ((手写 + 印刷,混合文字体系) 』
- 包含合并单元格的复杂表格──
- Nhúng các phương trình toán học trong文本──
- 带文本批注的数字──

Các đường ống OCR vẫn còn trong các khía cạnh sau đây:

- n toàn bộ tải trọng công việc, trong đó mỗi trang chậm rất quan trọng.
- Đường ống có thể tin cậy (确定性失败 vs VLM ảo giác)
- 需要可审计 OCR 输出监管环境──

### Claude 4.7 / GPT-5 前沿

Trong đầu vào bản địa 2576 pixel, VLMs phía trước có thể tiến hành hiểu văn bản với tỷ lệ xác thực gần con người.

- DocVQA:Claude 4.7 ~95.1,PaliGemma 2 ~88.4,Nougat ~77.3,Lay-out ốngLMv3 ~83。
- ChartQA:Claude 4.7 ~92.2,GPT-4V ~78。
- VisualMRC:Claude 4.7 ~ 94。

 Mô hình nguồn đóng 差距 chủ yếu đến độ phân giải và quy mô LLM cơ bản  7B  mô hình nguồn mở 落后几个点, nhưng đang theo đuổi 

### Phương trình toán học và LaTeX 输出

Các nghiên cứu khoa học cần phải xác định phương trình LaTeX 输出──Nougat là vì bài tập này──带 LaTeX mục tiêu 训练的VLMs(Qwen2.5-VL-Math、Nougat phái sinh) có thể tạo ra có thể sử dụng LaTeX── không có rõ ràng LaTeX 训练时,VLMs sẽ tạo ra có thể đọc nhưng không xác định chuyển thể văn──

Phòng ống dẫn nghiên cứu khoa học năm 2026: trước tiên trên PDF 上跑 Nougat, tái sử dụng VLM 处理棘手页面──

### viết tay

Đây vẫn là nhiệm vụ nhỏ khó khăn nhất. Mixed print + 手写 (phát thảo) là các đường ống OCR vẫn còn vượt qua các VLM về chi phí.

### Công thức 2026

Đối với các dự án AI tài liệu mới:

- Lượng lớn đơn thuần in:LayoutLMv3 + quy tắc,成本高效──
- 混合文档(科学 + 手写 + 表单):VLM-tự do(PaliGemma 2 hoặc Qwen2.5-VL)
- 完整 arXiv ingestion:Nougat 处理数学,VLM 处理 số liệu。
- 监管场景:OCR pipeline + VLM validator 用于交叉检查。


```figure
mm-doc-layout
```

## Sử dụng nó

`code/main.py`- Có thể là:

- Một trò chơi phiên bản thiết kế nhận thức tokenizer:给定 (text, bbox) cặp, tạo LayoutLMv3 风格输入。
- Một máy phát triển mô hình nhiệm vụ: dùng để biểu diễn mô hình JSON đơn lẻ.
- So sánh OCR-pipeline、Donut、Nougat 和 VLM-native Mỗi trang token ngân sách.

## 交付 nó

本课产 出 `outputs/skill-document-ai-stack-picker.md` Định định một tài liệu AI 项目 (domain, scale, quality, regulatory), trong đường ống OCR, chuyên gia không OCR và người bản địa VLM

## 练习

1. Dự án của bạn xử lý 10M 张发票 mỗi ngày.

2. Tại sao LayoutLMv3 trong hình thức QA trên tốt hơn trong CLIP-VLMs, nhưng trong cảnh văn bản trên biểu diễn kém hơn?

3. Nougat 生成 LaTeX── đề xuất một VLM-native 输出在 LaTeX fidelity 上胜过 Nougat 的测试用例,以及一个 Nougat 胜出的用例──

4. 阅读 PaliGemma 2 bài báo ((Google, 2024) 』 So với PaliGemma 1,提升文档准确率的关键训练数据新增项是什么?

5.  thiết kế một hệ thống lai hợp pháp an toàn: đường ống OCR  như một đường ống dẫn chính, VLM  như một đường ống dẫn thứ cấp.

## 关键术语

| Term | 人们的说法 | 实际含义 |
|------|-----------------|------------------------|
| OCR pipeline | "Tesseract-style" | 分阶段 stack：detect -> OCR -> layout -> rules；确定性、脆弱 |
| OCR-free | "Donut-style" | 跳过显式 OCR 的 image-to-output transformer；单一 model |
| Layout-aware | "LayoutLM" | 输入包含逐 token bbox coordinates；跨 modalities 的统一 masking |
| VLM-native | "Frontier VLM" | 直接把 page image 以高分辨率输入 Claude/GPT/Qwen VLM；无 pipeline |
| DocVQA | "Doc benchmark" | Document VQA 标准；最常被引用的分数 |
| Markup output | "LaTeX / MD" | 结构化输出格式，而不是 free-form text；支持下游自动化 |

## 延伸阅读

- [Li et al. — TrOCR (arXiv:2109.10282)](https://arxiv.org/abs/2109.10282)
- [Blecher et al. — Nougat (arXiv:2308.13418)](https://arxiv.org/abs/2308.13418)
- [Huang et al. — LayoutLMv3 (arXiv:2204.08387)](https://arxiv.org/abs/2204.08387)
- [Kim et al. — Donut (arXiv:2111.15664)](https://arxiv.org/abs/2111.15664)
- [Wang et al. — DocLLM (arXiv:2401.00908)](https://arxiv.org/abs/2401.00908)
