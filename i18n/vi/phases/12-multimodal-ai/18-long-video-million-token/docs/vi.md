# Million-Token Context 下的长视频理解

> Một bộ phim 4K 1 giờ, 24 FPS, thông qua việc dán và nhúng, sẽ tạo ra khoảng 6 triệu mã thông báo. Một bản chuyển tiếp 2 giờ播客 đơn tập là 30.000 mã thông báo. Một bộ phim Blu-ray dài, ngay cả khi sử dụng tích cực tập hợp ưng sút, cũng sẽ có hàng trăm ngàn mã thông báo. Google Gemini 1.5 tháng 3 năm 2024) đã mở ra trong bối cảnh 1.000.000 mã thông báo.

**Type:** Build
**Languages:** Python (stdlib, needle-in-haystack simulator + agentic-retrieval router)
**Prerequisites:** Phase 12 · 17 (video temporal tokens)
**Time:** ~180 minutes

## Học mục tiêu
- 计算不同 FPS 和聚合 下长视频的总视觉标记 数量──
- 解释三条扩展路径:những bối cảnh xô (((Gemini 1.5) 、những vòng chú ý(LWM) 、đánh nén mã thông báo(LongVILA / Video-XL) ✿
- Trong准确率和延迟上比较 nguyên liệu ngữ cảnh video VLMs với các video thu hồi đại lý VLMs(VideoAgent)
- Để 30 phút video thiết kế một kim cáp trong một đống cỏ 测试,并测量特定分钟处的召回率──

## 问题
Các bản vá kích thước Qwen2.5VL ở độ phân giải nguyên thủy 384 , đơn约为 729 代币. Sử dụng 3x3 tích hợp 后, mỗi 81 代币. Một 30 分片段 theo 1 FPS 计算 = 1800  = 145,800 代币.

Một phần 2 phim trong 1 FPS là 583k Token──超出多数 2026 年开放模型能力; cần Gemini 2.5 Pro, hoặc hơn激进地聚合──

出现了三条扩展路径──

## 概念
### Đường 1: bối cảnh thô sơ (Gemini 1.5, Claude Opus)

Sử dụng phần cứng giải quyết vấn đề.

Gemini 1.5 Pro 发布时支持 1M Token;Gemini 1.5 Ultra  đạt 10M;2026 năm Gemini 2.5 Pro 能可靠处理数小时视频──论文(arXiv:2403.05530) ghi nhận trong cao nhất khoảng 9.5M Token 下, kim cáp trong một đống lợn 召回率 đạt 99,7%──

工程上: một loại tự định nghĩa cấp độ (local + global + sparse) 实现,加上用于长文效率的MoE专家路由──完整细节未公开发表──不开源──

### 路径 2:Công tâm (LWM, LongVILA)

Phân tích sự chú ý của vòng Đưa chuỗi dài phân tán trên nhiều thiết bị, hình thành một vòng, mỗi thiết bị có một phần.

LWM(Liu et al., 2024) sử dụng cách này đào tạo một mô hình 1M-Token ngữ cảnh 模型── đào tạo tính toán lượng theo ngữ cảnh 线性扩展, thay vì mở rộng vuông, vì chi phí vuông của sự chú ý được phân chia vào các thiết bị trong vòng.

LongVILA(arXiv:2408.10188)把该模式适配到VLMs──1400 视频,每 192 个 Token = 268k context,并使用8way parallelism của vòng chú ý 训练──

### 路径 3: Token 压缩 (Video-XL, LongVA)

Bới bối cảnh thốc hơn: trong LLM để thấy trình tự trước tiến hành tăng cường nén hơn.

Video-XL(arXiv:2409.14485) sử dụng mã thông báo tóm tắt thị giác: mỗi đoạn clip chứa N   tạo ra một mã thông báo tóm tắt riêng biệt, mã thông báo sẽ tham dự đến N    . Trong suy luận, LLM mỗi đoạn chỉ nhìn thấy một mã thông báo tóm tắt, do đó làm giảm đáng kể ngữ cảnh .

LongVA sử dụng Long context transfer技术,将 LLM context từ 200k 扩展到2M。先在长文文上训练,再通过共享表示迁移到长文视──

Việc nén mã bằng khả năng gọi lại trong thời gian cụ thể để thay đổi khả năng mở rộng. Mô hình thường biết điều gì đã xảy ra, nhưng đôi khi sẽ bị bỏ lỡ chính xác.

### 路径 4:Thiết xuất tác nhân (VideoAgent)

Đừng đưa video toàn bộ vào LLM.

VideoAgent ((arXiv:2403.10517):

1. LLM 读取问题──
2. LLM Xin hãy tìm kiếm công cụ 提供相关片段(Tạo cho tôi thấy các đoạn phim với một con mèo)。
3. Công cụ 返回匹配的剪辑时间──
4. LLM 通过VLM 读取这些片段──
5. LLM  tổ chức câu trả lời, hoặc đưa ra sau đó

Đây là ứng dụng cho LLM như một đại lý trên长视频 模式;;Inference 更便宜;;

### Chỉ số chuẩn kim cương

标准 long-context 测试: Đưa vào vị trí bất cứ gì trong video một biểu tượng hoặc văn bản duy nhất, sau đó đưa ra một câu hỏi cần nhớ về biểu tượng này.

Métric:跨视频长度和标记位置的 Recall@k。

Gemini 2.5 Pro trong thời gian dài nhất 90 phút video trên điểm số >99% 召回率──开放 72B 模型(Qwen2.5-VL-72B、InternVL3-78B) trong 30 phút处分约85-90%,超过60分后下降──

Nếu công cụ 足够好,VideoAgent trong 2+ 小时场景下 có thể phù hợp hoặc vượt quá nguyên văn 模型, vì lấy lại 能命中针──

### Đường nào để chọn

Đối với độ chính xác biên giới của 15 phút clip: mở mở 72B + nguyên sinh ngữ cảnh thường có thể điền.

Đối với 30 phút đến 1 giờ nội dung: OpenModel chọn LongVILA hoặc Video-XL; đóng nguồn chọn Gemini 2.5 Pro。质量门 rất quan trọng, biên giới 走闭源。

Đối với 2+ 小时内容:VideoAgent hoặc tương tự thu thập 模式──或,摘要成更小块,并输入等级摘要──

### Mô hình sản xuất năm 2026

Trong thực tế, các đường ống sản xuất là hỗn hợp:

1. Đối với toàn bộ video运行 động-FPS lấy mẫu + tích hợp tích cực(tức có được 100k-Token của toàn局表示)
2. 传给72B VLM 生成全局摘要
3. Nếu người dùng đặt ra các câu hỏi chi tiết, sử dụng 摘要作为索引运行代理检索.

Điều này kết hợp với khả năng hiểu và tìm hiểu toàn diện của bối cảnh thô.


```figure
mm-video-token-budget
```

## Sử dụng nó
`code/main.py`- Có thể là:

- 计算 1 分钟到 3 小时视频在不同 FPS + tập hợp 下的代币 预算。
- 模拟一次针-in-a-haystack 运行: 在随机时刻 注入标记,提出问题,并评估召回──
- 包含 một máy mô phỏng bộ định tuyến lấy lại cơ quan, để chọn để nhập xuống các clip cụ thể của VLM.

运行预算表, cảm nhận kích thước chênh lệch

## 交付 nó
本课产 出 `outputs/skill-long-video-strategy-planner.md` Giữ thời gian và độ phức tạp của truy vấn, nó sẽ được chọn giữa bối cảnh thô ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cởi ̊cở ̊cở ̊cở ̊cở ̊cở ̋cở ̋cở ̋cở ̋cở ̋cở ̋cở ̋cở ̋cở ̋cở ̋cở ̋cở ̋cở ̋cơ

## 练习
1. Một đoạn 45 分钟讲座,1 FPS, mỗi 81 代币―― tổng số代币 là bao nhiêu? phù hợp với bối cảnh của mô hình nào?

2. 设计一个针-in-a-haystack 测试: bạn sẽ vào dấu chỉ trong vài phút, chính xác tìm kiếm hình thức là gì?

3. Trong 1 小时视频上比较 粗文文 Qwen2.5-VL-72B(80k文) với VideoAgent(Claude 3.5 + lấy lại) ―― 哪个在召回上胜出?哪个在延迟上胜出?

4. Chi phí lưu trữ của sự chú ý vòng theo trình tự mở rộng chiều dài tuyến tính, cũng như số lượng thiết bị mở rộng tuyến tính.

5. 阅读 Gemini 1.5 第 5 节 Về nội dung của kim cương trong một đống cỏ.

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Brute context | “只是更多 Token” | 将 LLM context 扩展到数百万 Token；一次性处理所有内容 |
| Ring attention | “LWM-style parallel” | 分布式 attention 模式：每个设备持有一个 chunk 并轮转 |
| Token compression | “Summary tokens” | 在进入 LLM 前，通过 learned compressor 减少每个 clip 的 Token |
| Needle-in-haystack | “NIH test” | 在随机位置插入唯一 marker，在测试时要求模型回忆它 |
| Agentic retrieval | “LLM as query planner” | LLM 向 retrieval tool 请求相关 clips，通过 VLM 读取它们，并组织答案 |
| VideoAgent | “Retrieval pattern for video” | 规范的 agentic-retrieval 设计：question -> tool -> clip -> answer |

## 延伸阅读
- [Gemini Team — Gemini 1.5 (arXiv:2403.05530)](https://arxiv.org/abs/2403.05530)
- [Liu et al. — LWM / RingAttention (arXiv:2402.08268)](https://arxiv.org/abs/2402.08268)
- [Xue et al. — LongVILA (arXiv:2408.10188)](https://arxiv.org/abs/2408.10188)
- [Shu et al. — Video-XL (arXiv:2409.14485)](https://arxiv.org/abs/2409.14485)
- [Wang et al. — VideoAgent (arXiv:2403.10517)](https://arxiv.org/abs/2403.10517)
