# InternVL3: Đào tạo đa phương pháp bản địa

> InternVL3  trước đây mỗi nguồn mở VLM đều theo cùng một kiểu hình thức ba bước: lấy một trong hàng tỷ mã thông báo văn bản được đào tạo trên một văn bản LLM, tiếp theo một mã thông báo tầm nhìn, sau đó chỉnh sửa tốt hơn 接处.

**Type:** Learn
**Languages:** Python (stdlib, training-corpus mixer)
**Prerequisites:** Phase 12 · 05, Phase 12 · 07 (recipes)
**Time:** ~120 minutes

## Học mục tiêu
- 解释为什么后期VLM đào tạo 会累积调整债务,并引用三个可测量症状(kỷ họa quên mất, dẫn dắt trả lời, không phù hợp văn bản hình ảnh)
- Mô tả: Hỗn hợp cơ thể trước tập luyện bản địa của InternVL3, cũng như văn bản:
- So sánh V2PE (chế lập vị trí hình ảnh biến đổi) và M-RoPE của Qwen2-VL
- Nói出 Visual Resolution Router (ViR) và Decoupled Vision-Language (DvD) 这两个部署 tối ưu hóa.

## 问题
Việc đào tạo VLM sau đại học là một cách ngẫu nhiên. LVA, BLIP-2, Qwen-VL, Idefics sẽ có một LLM đã được đào tạo trước (Llama, Vicuna, Qwen, Mistral) và tham gia vào các giai đoạn đào tạo thường như sau:

1. Frozen LLM + Frozen Vision Encoder + Trainable Projector, trong cặp caption 上训练以对齐嵌入式──
2. Unfreeze LLM, trong dữ liệu giảng dạy
3. n chỉnh sửa kỹ thuật cho các nhiệm vụ cụ thể

nợ sắp xếp 会表现出三个症状:

- Sự quên lãng thảm khốc. VLM 会遗忘-only text skills. GSM8K 分数下降 5-10 分. Hellaswag 分数下降.
- Phản ứng: Drift. Các biến đổi trong các hình ảnh cùng một câu hỏi sẽ được trả lời khác nhau.
- Visual-text inconsistency──VLM có thể chính xác mô tả một hình ảnh, sau đó trả lời một câu hỏi khác với mô tả của chính nó──Visual tokens will not participate in internal consistency check of LLM như văn bản.

Các triệu chứng này được ghi nhận đầy đủ. MM1.5 Phần 4 đã được định lượng.

## 概念
### Đào tạo trước khi sinh ra

InternVL3 từ đầu bắt đầu tập luyện trên một cơ thể đa mô hình gốc.

- 40% dữ liệu chỉ có văn bản(FineWeb、Proof-Pile-2 và như vậy)
- 35% dữ liệu hình ảnh-môn văn bản được giao tiếp (OBELICS、MMC4-style)
- 20% dữ liệu ghi chú hình ảnh kết hợp
- 5% dữ liệu văn bản video

Các token thị giác, các token văn bản, cũng như các tương tác chéo-modal, đều bắt đầu tham gia cùng một bước gradient  Không có sự sắp xếp trước khi tập luyện, không có giai đoạn đóng băng máy chiếu, cũng không cần phải phục hồi sự quên lãng thảm khốc.

Bài tập về mô hình cơ bản là một giai đoạn. Việc chỉnh sửa hướng dẫn sẽ được thực hiện sau đó, nhưng mô hình cơ bản đã đưa ra các biểu tượng hình ảnh để hiểu cho một loại công dân.

### V2PE (tạo mã vị trí thị giác biến)

Qwen2-VL sử dụng M-RoPE,并采用固定的轴分配──InternVL3 引入 V2PE:position coding 会按模拟类型(文字、图像、视频) 变化,并带有可学习扩展──实践中:

- Các mã thông báo văn bản  nhận vị trí 1D (text index)
- Các bản vá hình ảnh  nhận vị trí 2D ((row, col) 。
- Các khung hình video  nhận vị trí 3D ((thời gian, hàng, col) 。

三者共享 cùng một cơ sở tần số RoPE, nhưng phân bổ độ ẩn của mỗi băng là một tham số học tập, chứ không phải phân chia cố định.

Tận chứng về sự biến đổi của V2PE: trong tính toán tương tự, video benchmarks hơn M-RoPE cao 1-2 分── không phải là sự thay đổi cách mạng, nhưng hơn干净──

### Đường dẫn độ phân giải trực quan (ViR)

Việc triển khai tối ưu hóa. Không phải tất cả các hình ảnh đều cần mã hóa độ phân giải đầy đủ. Một张 chỉ có một bức ảnh nhỏ của vật thể, nếu theo 1280px bản địa mã hóa, sẽ lãng phí các token. ViR là một phân loại nhỏ, sẽ đang mã hóa trước khi dự đoán trả lời các câu hỏi cần thiết độ phân giải tối thiểu.

Đường dẫn có 3档: thấp-res(256 token)  trung bình(576)  cao(2048+)  Trong lưu lượng truy cập sản xuất, 60% của truy vấn sử dụng thấp hoặc trung bình 就足够──净效果: 在相同质量下吞吐量 提升 2-3x──

### Việc triển khai ngôn ngữ thị giác không kết nối (DvD)

Khi bạn phục vụ một VLM lớn, bộ mã hóa hình ảnh mỗi张图像 chạy một lần, nhưng LLM sẽ dành cho mỗi token đầu ra tự quay lại chạy.

Đối với một mô hình mã hóa 8B + 400M, DVD tương đương với cùng vị trí 大约能让每节点吞吐量翻倍──

### Chất lượng một giai đoạn so với nhiều giai đoạn

InternVL3  tuyên bố chuẩn chính: trên 78B params 下匹配 Gemini 2.5 Pro của MMMU-Pro. trên 38B 下匹配 GPT-4o. trên 8B 下领先 open-8B bảng xếp hạng. trên toàn bộ dựa trên đơn giai đoạn chuẩn bị + hướng dẫn-đấu công thức.

Hipoteis nợ-trình độ là có thể đoán được: đối với tăng điểm thị lực,InternVL3-8B trong điểm tiêu chuẩn văn bản ((MLU、GSM8K) mất tích số lượng, so với Qwen2.5-VL-7B 更少──

### InternVL3.5 và InternVL-U

InternVL3.5(Tháng 8 năm 2025) đã mở rộng công thức này── cùng một cách tiếp cận trước đào tạo bản địa, nhiều dữ liệu, nhiều thông số hơn── cải tiến của MMMU là tăng lượng.

InternVL-U(2026) tham gia vào thế hệ thống nhất,也就是在同一个脊椎上部通过MMDiT头子输出图像──在这里"U"代表"Comprehension + generation", theo đuổi mô hình thống nhất kiểu Transfusion(Lớp 12.13)──同一个原生-pre-train backbone 同时支持理解和世代头子──

### gia đình tiền đào tạo của取舍

Đào tạo bản địa không miễn phí:

- Xét số. Từ đầu đào tạo một VLM mới và đào tạo một văn bản LLM tương tự: hàng triệu giờ GPU.
- Dữ liệu:  Có khoảng 141 triệu tài liệu; MMC4 có 571 triệu;  Có thể đạt đến 15T token.
- Base-LLM reuse──Native pretraining 放弃了后换进入新LLM的选项──Post-hoc 允许你只重新训练适配器,就把Llama-3.1 换成Llama-4──

InternVL3 注是: nợ liên kết hơn tổn thất tái sử dụng 更糟糕──基准 支持这个主张──生产成本也阻止未来实验室 低成本复制──后期VLMs sẽ tiếp tục tồn tại, vì đối với hầu hết các dự án chúng vẫn rẻ hơn──


```figure
l5-native-pretrain
```

## Sử dụng nó
`code/main.py`Đó là một bộ trộn tập thể và mô phỏng bộ định tuyến ViR.

- 接收一个目标 corpus mix ((%text、%interleaved、%caption、%video),并计算每种方式的预期步骤──
- Trong một loạt các truy vấn 上模拟 ViR routing( phân phối: 50% chi tiết thấp ∼30% trung bình ∼20% chi tiết cao),并 báo cáo số lượng token trung bình ∼
- 基于编码对LLM FLOPs 报告DvD throughput estimates──
- 并排印 post-hoc vs bản địa dự kiến đào tạo trong các param, tính toán, dữ liệu, cũng như các triệu chứng nợ sắp xếp dự kiến

## 交付 nó
本课会产出 `outputs/skill-native-vs-posthoc-auditor.md` Đưa ra một kế hoạch đào tạo VLM được đề xuất, nó sẽ kiểm toán nên chọn bản địa hoặc là hậu hoc, đánh dấu rủi ro nợ-trợ lý,并 đề xuất hỗn hợp corpus.

## 练习
1. Ước tính số điện toán delta giữa InternVL3-8B (từ trước tàu) và LLaVA-OneVision-7B (từ máy bay) ⋅ GPU-hours tỷ lệ khoảng bao nhiêu?

2. InternVL3  báo cáo tỷ lệ là 40% văn bản / 35% liên kết / 20% caption / 5% video。 Nếu mục tiêu của bạn là nhiệm vụ nặng video, xin đề xuất một tỷ lệ mới,并论证为什么基模型仍然需要大量文本和字幕数据──

3. 阅读 MM1.5 Phần 4 trong về việc quên ổng  nói rằng sự suy giảm lớn nhất trong đào tạo sau đại học  đã mất bao nhiêu?

4. ViR sẽ chuyển 60% lưu lượng truy cập 路由到低解析度编码. Nó sẽ sai đường từ các loại truy vấn nào?

5. DVD sẽ chia vision và LLM thành GPU khác nhau trên. Trong mô hình giao thông nào?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Native multimodal pretraining | "From scratch together" | Text + image + video tokens 从第 1 步开始参与 Loss，而不是之后再接上 |
| Alignment debt | "Post-hoc penalty" | 由把 vision 接到 frozen LLM 上导致的 text skills 和 answer consistency 可测量退化 |
| V2PE | "Variable visual pos encoding" | 每个 modality 的可学习 position encoding allocation；InternVL3 的 M-RoPE 后继方案 |
| ViR | "Resolution router" | 小 classifier，在 encoding 前按 query 选择所需最低 resolution，从而节省 inference tokens |
| DvD | "Decoupled deployment" | Vision encoder 在一个 GPU 上，LLM 在另一个 GPU 上，并通过 stream handoff；可让大型 VLMs 的 throughput 翻倍 |
| InternVL-U | "Unified understanding + generation" | 2026 年后续版本，为 native-pretrain backbone 加入 image-generation heads |
| Interleaved corpus | "OBELICS / MMC4" | 文本和图像按自然阅读顺序排列的 documents；native pretraining 的原材料 |

## 延伸阅读
- [Chen et al. — InternVL 1 (arXiv:2312.14238)](https://arxiv.org/abs/2312.14238)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
- [InternVL3.5 (arXiv:2508.18265)](https://arxiv.org/abs/2508.18265)
- [InternVL-U (arXiv:2603.09877)](https://arxiv.org/abs/2603.09877)
- [Zhang et al. — MM1.5 (arXiv:2409.20566)](https://arxiv.org/abs/2409.20566)
