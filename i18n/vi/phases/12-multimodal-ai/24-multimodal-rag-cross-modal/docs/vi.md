# RAG đa mô-đun và Khám phá đa mô-đun

> Vision-native document RAG 只是其中一片. Production level Multimodal RAG's scope is wider: 在文字,图像,音频,视频之间检索,用于旅行规划. 帮我找到一个安静的,有自然光的素食) 医疗分类. 什么伤害 匹配这张照片+这些笔记) 电子商务. 找和这张自拍 类似的,且符合我的尺度的服装) 以及现场服务. 根据这个引擎声音加上件照片来诊断问题篇) 等工作流程.

**Type:** Build
**语言:**Python (stdlib,带 fusion + máy phát điện đất của cross-modal retriever)
**先修要求：**Giai đoạn 12 · 23 (ColPali), Giai đoạn 11 (tội chất RAG)
**Time:** ~180 分钟

## Học mục tiêu
- 设计 cross-modal retrieval:text → image、image → text、audio → video 等──
- Hãy so sánh 3 chiến lược hợp nhất: kết hợp điểm, kết hợp dựa trên sự chú ý, kết hợp MoE.
- 解释 thế hệ nền tảng: Khi nguồn là nhiều loại modality 混合时, 引用您的来源应该是什么样──
- Nói ra 2025 年三篇 khảo sát đa phương thức RAG, cũng như phân loại các vấn đề của chúng.

## 问题
RAG một cách duy nhất là một mô hình đã trưởng thành: truy vấn nhúng, nhúng các phần, lấy lại, đi vào LLM.

1. Nhiều đầu thu hồi (mỗi kiểu đều cần được tích hợp trong không gian兼容)
2. 跨 modality 融合 kết quả thu thập.
3. Tạo thế hệ, cần phải trích dẫn nguồn của các modality.
4. 覆盖 cross-modal signal của các métrics đánh giá

Những cuộc khảo sát năm 2025 cuối cùng đều đưa ra phân loại tương tự.

## 概念
### Khám phá liên hợp

给定 modality A của truy vấn, lấy lại modality B của tài liệu.

1. Không gian nhúng chung──CLIP 和 CLAP 在共享空间中生成文字 + hình ảnh / văn bản + âm thanh──嵌入跨modality 的 cosine similarity 可以直接使用──受限于CLIP 训过的配对──

2. Bộ mã hóa tính năng tính năng + dịch thuật――Công trình mã hóa văn bản + mã hóa hình ảnh + một mô-đun dịch thuật nhỏ, được sử dụng để lập bản đồ giữa các không gian khác nhau―Gupta et al. của Sen2Sen và các thiết kế khác năm 2024 thuộc về loại này―灵活, nhưng tăng độ phức tạp―

3. VLM như một mã hóa. Sử dụng các trạng thái ẩn của VLM như một đại diện lấy lại. Bất kỳ phương thức nào của VLM đều có thể sử dụng.

选择:text+image 用 CLIP / SigLIP 2;text+audio 用 CLAP;frontier 质量跨模式 用 VLM-họa-state。

### Chiến lược sáp nhập

Bạn đã lấy lại 10 个结果:5 张图片,3 段 văn bản đoạn, 2 clip âm thanh...

Kết hợp điểm số (最便宜) ・ Mỗi phương pháp đều có điểm số riêng, mỗi phương pháp đều trả lại điểm số.

Phối hợp dựa trên sự chú ý, tạo ra một mạng lưới chú ý nhỏ để tăng cường quyền lực.

MoE fusion──Gating network 路由到modality-specific experts──不同查询 类型走不同路由, ví dụ: hình ảnh câu hỏi 会给图像 更高权重──

生产默认方案:score fusion,并稍微偏向查询的主导模式──如果A/B 显示在您的域名上有明显收益,再升级到MoE──

### Địa đất thế hệ

LLM 应该引用是哪个收取的项目 支了每个索赔── đối với đa phương thức:

- Nguồn văn bản: Standard citation `[1]`
- Nguồn hình ảnh:`[img 3]`, với một đoạn văn ngắn.
- Tiếng ồn:`[audio 2 at 0:34]`

Sử dụng dữ liệu có ý thức về nền tảng 训练 generator:培训目标 中的每个索赔都标注来源索引──Inference 时,model 会自然输出引用──

### Các cuộc khảo sát năm 2025

Abootorabi et al. ((arXiv:2502.08826,Ask in Any Modality):Taxonomy của RAG đa phương tiện──覆盖 thu hồi、sự hợp nhất、tổn lại──覆盖面最广──

Mei et al. ((arXiv:2504.08748,A Survey of Multimodal RAG):重点关注 phụ nhiệm chuẩn và các chế độ thất bại.

Zhao et al. ((arXiv:2503.18016): Đánh giá về tầm nhìn của người ColPali

读完这三篇,你就能掌握到2025 年春季的最新状态――大多数子问题仍开放――

### MuRAG  giấy nền tảng

MuRAG(Chen et al., 2022) là bài đầu tiên của Multimodal RAG── nó lấy hình ảnh + văn bản trong Multimodal KB,并生成答案── trong VLM 浪潮 trước đã chứng minh khả năng.

### Một ví dụ về nhà lập kế hoạch hành trình cấp sản xuất

Câu hỏi: Help me find a quiet, have natural light vegan brunch.

Đường ống:

1. 分解 truy vấn。quiet → từ khóa âm thanh/sự đánh giá;vegan brunch → mục menu;natural light → tính năng hình ảnh。
2. 按modality lấy lại:
   - Đối với đánh giá thực hiện tìm kiếm văn bản: Bunch vegan, bầu không khí yên tĩnh.
   - Đối với ảnh nhà hàng thực hiện lấy lại hình ảnh:  ánh sáng tự nhiên, không khí.
   - Đối với các clip âm thanh môi trường thực hiện thu hồi âm thanh:  thấp decibel, không có âm nhạc.
3. 融合 điểm số. Mỗi nhà hàng đều có điểm số tổng hợp.
4. Nhà hàng hàng hàng đầu → VLM máy phát điện, mang tất cả các bằng chứng → 带 trích dẫn 输出答案。

Điều này đã vượt xa hơn văn bản-RAG. Mỗi phương thức đều kết hợp văn bản một mình sẽ bỏ qua các tín hiệu.

### Máy vận hành đa phương tiện RAG

Multi-hop: Nếu lần đầu tiên lấy lại không trả lại, LLM sẽ xây dựng lại và lấy lại lại.

- Khôi phục top-10 đầu tiên → LLM 询问太噪音, lọc cho <40 dB → khôi phục lại。
- Khám ảnh → LLM 发现其中一张有菜单 → lấy lại văn bản menu → trả lời。

Điều này sẽ làm tăng sự phức tạp, nhưng có thể xử lý truy xuất một lần không thể giải quyết được câu hỏi.

### Đánh giá

Đánh giá đa phương thức 仍不成熟──常见代理:

- Mỗi loại hình của Recall@k。
- Độ chính xác top-k hợp nhất
- Nhân công đánh giá kết thúc kết thúc thỏa mãn.
- Nhiệm vụ cụ thể ((完成 bookings、完成 purchases)

Không bao gồm tất cả các phương pháp của tiêu chuẩn chuẩn. Hầu hết các bài báo đều trong các nhiệm vụ cụ thể về lĩnh vực.


```figure
contrastive-matrix
```

## Sử dụng nó
`code/main.py`- Có thể là:

- Ba máy lấy lại giả mạo (text, image, audio) được sử dụng trong một nhà hàng chung.
- Điểm kết hợp, sử dụng có thể cấu hình trọng lượng 组合 modality scores。
- Một cái cột máy phát, câu trả lời cuối cùng của các trích dẫn:
- Một vòng lặp đơn giản của các nhà quản lý, khi sự tự tin thấp hơn thì định dạng lại câu hỏi.

## 交付 nó
本课产 出 `outputs/skill-multimodal-rag-designer.md`△ Định một带 Multimodal query flow của sản phẩm đặc điểm, thiết kế lấy lại, hợp nhất, máy phát và đánh giá

## 练习
1.  đề xuất một điều tra y tế đa phương pháp RAG:query = ảnh chấn thương + các triệu chứng văn bản.

2. Điểm kết hợp là một số tiền cân nặng đơn giản. Có điều gì không thành công là sự kết hợp MoE có thể tránh được?

3. 阅读 Abootorabi et al. 的 phân loại ((Bộ 3)。 ba phụ vấn đề theo luật là gì?

4. Đối với kế hoạch hành trình RAG đa phương thức thiết kế một mô hình đánh giá.

5. Agentic multi-hop RAG Mỗi vòng quay đi lại đều có thuế trễ.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Cross-modal retrieval | “Query 一个 modality，retrieve 另一个” | Text query retrieve images；image query retrieve text；需要 shared space 或 translator |
| Score fusion | “组合 scores” | 对每种 modality 的 retrieval scores 做 weighted sum；最简单的 fusion |
| MoE fusion | “Modality-routed experts” | Gating network 按 query 选择信任哪种 modality 的 scores |
| Grounded generation | “Cite your sources” | 答案中的每个 claim 都标注 source index |
| MuRAG | “第一个 Multimodal RAG” | 2022 年 paper，建立了 Multimodal RAG 模式 |
| Agentic multi-hop | “Reformulate and retry” | 当 first-pass confidence 较低时，LLM 重新 query retrievers |

## 延伸阅读
- [Abootorabi et al. — Ask in Any Modality (arXiv:2502.08826)](https://arxiv.org/abs/2502.08826)
- [Mei et al. — A Survey of Multimodal RAG (arXiv:2504.08748)](https://arxiv.org/abs/2504.08748)
- [Zhao et al. — Vision RAG Survey (arXiv:2503.18016)](https://arxiv.org/abs/2503.18016)
- [Chen et al. — MuRAG (arXiv:2210.02928)](https://arxiv.org/abs/2210.02928)
- [Liu et al. — REACT (arXiv:2301.10382)](https://arxiv.org/abs/2301.10382)
