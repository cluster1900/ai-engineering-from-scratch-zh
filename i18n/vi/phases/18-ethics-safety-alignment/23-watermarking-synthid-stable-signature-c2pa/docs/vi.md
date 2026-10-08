# Đánh dấu nước  SynthID、Signature ổn định、C2PA

> 三项技术构成 2026 năm AI 生产内容来源追踪的基础.SynthID (Google DeepMind)  hình ảnh watermarking 于 2023 8月推出,text+video 于 2024 5月推出(Gemini + Veo),text 于 2024 10月通过负责任 GenAI Toolkit 开源,统一的多媒体探测器 于 2025 11月推出 Gemini 3 Pro 一同发布.Tờ watermarking sẽ khó nhận thức để điều chỉnh khả năng lấy mẫu tiếp theo;photos / video watermark có thể chịu áp suất;cropping;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;photos;

**Type:** Build
**Languages:** Python (stdlib, token-watermark embed + detect)
**Prerequisites:** Phase 10 · 04 (sampling), Phase 01 · 09 (information theory)
**Time:** ~75 分钟

## Học mục tiêu

- Mô tả đánh dấu nước cấp token (SynthID-text) và cơ chế kiểm tra nó.
- Mô tả Stable Signature và tấn công xóa bỏ nó vào năm 2024
- Giải thích tác dụng của C2PA, và tại sao nó có liên quan đến đánh dấu nước 互补.
- 描述关键限制:chương hiệu cụ thể mô hình, đoạn văn, cũng như các cuộc tấn công bảo tồn ý nghĩa (arXiv:2508.20228):

## 问题

Năm 2023-2024, các nội dung sâu và AI tạo ra vào quy mô lớn vào tình hình chính trị và tiêu thụ. Watermarking là một nguồn gốc kỹ thuật được đề xuất: trong quá trình tạo ra, đánh dấu sản xuất nội dung, sau đó kiểm tra lại.

## 概念

### Đánh dấu nước văn bản(SynthID-text 风格)

Kirchenbauer et al. 2023 机制, bởi Google 产品化:

1. Trong mỗi bước giải mã, đối với trước K 个 Token làm hash, tạo ra một phân vùng giả mạo ngẫu nhiên, sẽ phân chia từ vựng thành "công xanh" và "mỏ" 集合。
2. Bằng cách cung cấp các logit xanh cộng lên δ, làm cho việc lấy mẫu  hướng tới xanh 集合。
3. Số lượng mã thông báo xanh có kết quả sẽ cao hơn mong đợi trong bất kỳ trường hợp nào.

检测: đối với mỗi tiền tố 重新 hash,统计生成结果中的绿色代号,计算 z-score。 watermarked text 的 z-score >0,human text 约为 0。

 đặc điểm:
- 读者难以察觉 (δ 足够小,质量损失较轻)
- Trong có thể truy cập hàm phân vùng từ vựng 时可检测。
- Để đánh dấu không rõ ràng  重写文本会破坏该信号

SynthID-text 于 2024 年 10 月通过 Google's Responsible GenAI Toolkit 开源──

### Hàm chữ ổn định (photos)

Fernandez et al. ICCV 2023。Fine-tune latent diffusion decoder, giúp mỗi张生成图像都包含一个写入 latent表示的固定二进制信息──检测通过神经 decoder 从 latent 中解码──对收割的图像,保留10% 内容) 在 FPR<1e-6 时检测率 >90%──

2024 年 5 月 "Signature stable is unstable" (arXiv:2405.07145): decoder tinh chỉnh có thể trong giữ chất lượng hình ảnh đồng thời di chuyển watermark。 đối với các hậu thế hệ tinh chỉnh tương ứng 成本很低; độ bền đối kháng của watermark này có giới hạn。

### SynthID detector thống nhất(2025 年 11 月)

随着 Gemini 3 Pro cùng phát hành: một bộ phát hiện đa phương tiện, có thể đọc văn bản, hình ảnh, âm thanh, video trong cùng một API.

### C2PA

Liên minh về Xuất hiện và xác thực nội dung──Cryptographically signed tamper-evident metadata standard──C2PA 2.2 Explainer (2025)──C2PA manifest 会记录 provenance claims──谁创建、何时创建、做过哪些转变),并由创始人关键 签名──

Với watermarking 互补:
- Các metadata có thể được lấy ra; dấu nước thường không dễ dàng.
- Metadata 信息丰富( chuỗi nguồn gốc hoàn chỉnh); dấu nước 承载 bit。
- C2PA phụ thuộc vào nền tảng được sử dụng; watermarks sẽ tự động ghi vào:

Google trong Tìm kiếm, quảng cáo và "Thiết về hình ảnh này" trong cùng thời điểm tập hợp hai phần.

###  giới hạn

- **Model-specific.**SynthID sẽ kết quả tạo từ các mô hình được bật SynthID thêm dấu nước. Kết quả tạo từ mô hình SynthID chưa được bật không có dấu nước, do đó "không có tín hiệu SynthID" không thể chứng minh sự thật của nó.
- **Paraphrase.**Các dấu nước văn bản không thể chịu đựng các đoạn phần giữ lại ý nghĩa.
- **Transformation attacks.**arXiv:2508.20228 (2025)  đã thể hiện các cuộc tấn công bảo tồn ý nghĩa của các dấu nước văn bản có thể phá hủy và nhiều dấu nước hình ảnh.
- **Fine-tune removal.**Theo "Signature stable is unstable", chỉnh sửa tinh tế sau thế hệ có thể di chuyển viết vào các dấu nước.

### Đạo luật AI của EU Điều 50

AI 生成内容标注的透明度法规(第一版草案 2025 年 12 月,第二版草案 2026 年 3 月,根据 [European Commission status page](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content), dự kiến phiên bản cuối cùng năm 2026 năm 6 tháng xuất bản) ・截至 2026 năm 4 tháng,该 Code 仍为草案,时间线可能变化──监管层要求技术层提供这些措施──Deepfakes 必须标注──

### Nó nằm ở vị trí giữa giai đoạn 18

Bài học 22-23 关注模型输出的内容(khiên dữ liệu tư nhân、 tín hiệu xuất phát) ―― Bài học 27 覆盖培训-data governance── Bài học 24 là yêu cầu các biện pháp kỹ thuật này


```figure
an-watermark-greenlist
```

## Sử dụng nó

`code/main.py`构建一个玩具文本水印──Tocens是整数 0.N-1; watermarked sampling 会偏向哈希 定义的绿色集合──Detector 会计算绿色代币z-score──你可以观察1000代币 下的检测结果,看句子 如何破坏该信号,并测量人类文本上的错阳性率──

## 交付 nó

本课会产出 `outputs/skill-provenance-audit.md` Đặt một nội dung có nguồn gốc tuyên bố, nó sẽ kiểm tra: watermark 机制 (nếu có)  chuỗi ký kết C2PA (nếu có)  sức mạnh đối thủ của riêng mình, cũng như các trường hợp bao phủ của từng phương thức.

## 练习

1. 运行 `code/main.py` báo cáo 1000 mã thông báo bằng nước với điểm z của văn bản do người viết  nhận ra 95% ngưỡng tin cậy  tỷ lệ dương tính sai 

2. 实现一个抛词攻击,用同义词 替换30%的代码――重新测量z-score――

3. 阅读 Kirchenbauer et al. 2023 Phần 6 中关于强度的内容──为什么文字水印会在表语下失效,而图像水印能经受收割?

4. 设计一个使用SynthID-text + C2PA metadata 的部署――描述消费者看到的来源链――识别每个组件的一个故障模式――

5. 2024 "Signature ổn định là không ổn định" kết quả cho thấy,đơn chỉnh tinh tế có thể di chuyển dấu nước hình ảnh.

## 关键术语

| Term | 人们怎么说 | 它实际含义 |
|------|------------|------------|
| SynthID | "Google's watermark" | Cross-modal provenance signal；text、image、audio、video |
| Token watermark | "Kirchenbauer-style" | Biased-sampling text watermark，可通过 green-token z-score 检测 |
| Stable Signature | "image watermark" | Fine-tuned-decoder watermark；ICCV 2023 |
| C2PA | "the metadata standard" | Cryptographically signed tamper-evident provenance metadata |
| Paraphrase robustness | "does rewording break it" | Text watermark 属性；目前有限 |
| Fine-tune removal | "adversarial unwatermark" | 通过 decoder fine-tuning 移除 image watermark 的攻击 |
| Cross-modal detector | "unified SynthID" | 2025 年 11 月跨 modalities 的 unified API |

## 延伸阅读

- [Kirchenbauer et al. — A Watermark for Large Language Models (ICML 2023, arXiv:2301.10226)](https://arxiv.org/abs/2301.10226) Hệ thống watermark token
- [Fernandez et al. — Stable Signature (ICCV 2023, arXiv:2303.15435)](https://arxiv.org/abs/2303.15435) hình ảnh watermark 论文
- ["Stable Signature is Unstable" (arXiv:2405.07145)](https://arxiv.org/abs/2405.07145) tấn công loại bỏ
- [Google DeepMind — SynthID](https://deepmind.google/models/synthid/) dấu nước hình thái chéo
- [C2PA 2.2 Explainer (2025)](https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) Tiêu chuẩn siêu dữ liệu
