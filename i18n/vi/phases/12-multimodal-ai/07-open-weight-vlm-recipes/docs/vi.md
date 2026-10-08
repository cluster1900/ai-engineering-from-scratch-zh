# Công thức VLM trọng lượng mở: Điều thực sự quan trọng là gì

> Văn bản VLM trọng lượng mở năm 2024-2026 là một bộ bảng phân hủy của rừng. Apple của MM1 đã thử nghiệm 13 loại mã hóa hình ảnh, kết nối và kết hợp dữ liệu. Allen AI của Molmo chứng minh, chi tiết các bản tóm tắt nhân loại  thắng GPT-4V chưng cất. Cambrian-1 đã làm 20+ bài mã hóa đối với 5比. Idefics2 sẽ tạo không gian thiết kế  định dạng.

**Type:** Learn + lab
**Languages:** Python (stdlib, ablation table parser + recipe picker)
**Prerequisites:** Phase 12 · 05 (LLaVA baseline)
**Time:** ~180 分钟

## Học mục tiêu
- Nói ra 5 vòng VLM design space:image encoder、connector、LLM、data mix、resolution schedule
- 阅读 MM1 / Idefics2 / Cambrian-1 bảng phân tích,并预测哪个按 会改变给定基准──
- Trong trường hợp ngân sách tính toán và hỗn hợp nhiệm vụ, chọn công thức VLM mới (encoder, connector, data, resolution)
- 解释 tại sao trong số lượng mã thông báo tương tự 下,详细的人类字幕 胜过GPT-4V蒸──

## 问题
已有数百 VLM mở trọng lượng. Hầu hết các khác biệt từ good到state-of-the-art không đến từ kiến trúc, mà từ dữ liệu, quy trình độ phân giải và lựa chọn mã hóa.

2023 年浪潮(LLaVA-1.5、InstructBLIP、MiniGPT-4) dựa trên bài tập trước cặp caption + LLaVA-Instruct-150k──不错的基线──上限约在MMMU 35%──

2024 年浪潮 (MM1、Idefics2、Molmo、Cambrian-1、Prismatic VLMs) đã thực hiện các việc trừu tượng đầy đủ.

## 概念
### 五轴 thiết kế không gian

Idefics2 ((Laurençon et al., 2024) đã đặt tên cho các trục này:

1. Bộ mã hóa hình ảnh: CLIP ViT-L/14、SigLIP SO400m/14、DINOv2 ViT-g/14、InternViT-6B。 Các bộ mã hóa trong kích thước vá、 độ phân giải và mục tiêu trước khi đào tạo 上不同。
2. Cụm nối MLP ((2-4 lớp) 、Q-Former ((32 truy vấn + qua-attn) 、Perceiver Resampler ((64 truy vấn) 、C-Abstractor ((convolutional + bilinear pooling) ‖
3. Mô hình ngôn ngữ: Llama-3 8B / 70B、Mistral 7B、Phi-3、Gemma-2、Qwen2.5。Làm kích thước là chi phí tham số chính。
4. Dữ liệu đào tạo. Cặp hình ảnh: CC3M, LAION, n nối nhau.
5. Lịch độ giải pháp ∞Fixed 224/336/448∞AnyRes∞Native dynamic∞

Mỗi sản xuất VLM thành phố sẽ ở trên mỗi trục 上做选择。 Phần lớn sự khác biệt của điểm số MMMU được giải thích bởi trục 1、4 và 5 , chứ không phải bởi bạn chọn kết nối nào 解释。

### Trục 1: mã hóa > kết nối

MM1 Phần 3.2 显示: từ CLIP ViT-L/14 换 thành SigLIP SO400m/14,MMMU 增加 3+ điểm。 từ MLP 换 thành Perceiver Resampler,增加不到 1 điểm。Idefics2 复现这一点:SigLIP > CLIP,Q-Former ≈ MLP ≈ Perceiver,在同样的代币计下相近。

Cambrian-1 của Cambrian Vision Encoders Match-Up(Tong et al., 2024) trên thị trường dựa trên thị trường (CV-Bench) đã chạy 20 + 个 encoders──排行榜顶部是 DINOv2 和 SigLIP 的混合;CLIP 位于中游;ImageBind 和 ViT-MAE 更低──CLIP ViT-L 到 DINOv2 ViT-g/14 在 CV-Bench 上的差距约为 5-7 điểm──

2026 năm mở VLMs mã hóa mặc định là sử dụng các tính năng ngữ nghĩa + mật của SigLIP 2 SO400m/14, đôi khi gặp gỡ với DINOv2 ViT-g/14 tính năng 拼接(Cambrian của Spaceal Vision Aggregator 就这样做)

### Trục 2: Thiết kế kết nối 差异不大

MM1、Idefics2、Prismatic 和 MM-Interleaved đều đưa ra kết luận tương tự: trong số lượng mã hóa thị giác cố định, kiến trúc kết nối 几乎不重要。 đối với các bản vá được hợp tác trung bình sử dụng MLP 2 tầng, trong ngân sách mã hóa tương tự, biểu hiện khoảng cách từ 32 truy vấn Q-Former không đến 1 điểm。

Thực sự quan trọng là số lượng token. Nhiều token hình ảnh hơn = 更多LLM compute = 更好表现,直到某个点后收益递减.

Q-Former vs MLP là vấn đề chi phí, không phải vấn đề chất lượng: bất kể độ phân giải hình ảnh 如何, Q-Former 都把 token 限制在 32-64;MLP 输出全部补丁 token── đối với đầu vào độ phân giải cao, Q-Former 省 LLM context; đối với độ phân giải thấp,差异只是噪声──

### Trục 3:Làm độ LLM quyết định trên giới hạn

Trong mỗi bài báo VLM, đưa LLM từ 7B gấp đôi lên 13B, thường sẽ làm cho MMMU tăng 2-4 điểm.

Đó là lý do tại sao Qwen2.5VL-72B và Claude Opus 4.7 trên MMMU-Pro và ScreenSpot-Pro lên hàng đầu đáng kể: bộ não ngôn ngữ  rất lớn. Một 7B VLM không thể dựa trên thiết kế kết nối thông minh thay thế 70B VLM.

### Trục 4: dữ liệu  详细的人类字幕 胜过蒸

Molmo + PixMo(Deitke et al., 2024) là kết quả năm 2024 mà mọi người nên đọc. Allen AI 让人类标注员使用 1-3 分钟的密集语音-文字通行 描述图像,得到 712K 密集标题图像──训练数据中完全没有GPT-4V蒸──

Molmo-72B trong 11/11 个基准 上击败 Llama-3.2-90B-Vision。 khác biệt không có trong kiến trúc, nhưng trong chất lượng caption。 chi tiết các bản tóm tắt của con người Mỗi张图像包含的信息量比短网标题多多 5-10x,并且在GPT-4V蒸化 容易幻觉的地方保持事实地基──

ShareGPT4V(Chen et al., 2023)和 Cauldron(Idefics2) đã sử dụng cùng một cuốn sách chơi, hỗn hợp con người + GPT-4V caption──趋势很明确: đối với biên giới 2026 而言, mật độ caption > lượng caption > tiện lợi của chưng cất──

### Trục 5: nghị quyết  và lịch trình

Idefics2 的 ablations:384 -> 448 增加 1-2 điểm──448 -> 980 配合图像分化(AnyRes) trên OCR benchmarks 上再增加 3-5──Flat resolution training 会在中等精度 附近高原;解析度 ramping(从224 开始,以 448 或本土 结束)训练更快,最终更高──

Cambrian-1 đã thực hiện phân giải so với token trade-off: trong máy tính cố định, bạn có thể chọn phân giải thấp hơn, hoặc phân giải cao hơn, hoặc phân giải thấp hơn.

2026 năm sản xuất công thức:Phase 1 以 384 cố định 训练,Phase 2 đối với các nhiệm vụ OCR nặng sử dụng độ phân giải động tối đa 1280 

### Prismatic của được kiểm soát đối với

Prismatic VLMs ((Karamcheti et al., 2024) là bài kiểm soát tất cả các trục.

- Số lượng mã thông báo hình ảnh mỗi hình ảnh 解释 khoảng 60% sự khác biệt.
- Sự lựa chọn mã hóa  giải thích khoảng 20%
- Kiến trúc kết nối 解释 khoảng 5%
- 其他所有因素(data mix、scheduler、LR) giải thích khoảng 15% còn lại

Đây là một phân tích thô sơ, nhưng cũng là câu trả lời rõ ràng nhất trong văn bản về  should ablate first 

### 2026 năm chọn

基于证据,2026年新项目的默认开放VLM công thức:

- Mã hóa: độ phân giải bản địa 下的 SigLIP 2 SO400m/14 với NaFlex; Nếu cần phân đoạn / đặt đất,则拼音 DINOv2 ViT-g/14 以获得密集功能──
- Connector:patch tokens 上的2层 MLP──除非令令限制,否则跳过Q-Former──
- LLM:Qwen2.5 / Llama-3.1 / Gemma 2;7B 用于成本,70B 用于质量,根据目标延迟 选择──
- Dữ liệu:PixMo + ShareGPT4V + Cauldron,并用 nhiệm vụ cụ thể dữ liệu hướng dẫn 补足。
- Độ phân giải: động lực (长边 min 256、max 1280 pixel)
- Chương trình:Tình chỉnh giai đoạn 1 (chỉ chiếu máy) Tình chỉnh hoàn chỉnh giai đoạn 2 Tình chỉnh cụ thể nhiệm vụ giai đoạn 3 

Mỗi một trong những điều này được bắt nguồn từ các bài viết cuối cùng của bài học này.


```figure
l5-vlm-recipe-knobs
```

## Sử dụng nó
`code/main.py`là một trình phân tích bảng phân tích và chọn công thức. Nó đã lập trình các bảng phân tích MM1 và Idefics2 (được rút ngắn), và cho phép bạn hỏi:

-  Đặt ra ngân sách X và nhiệm vụ Y, công thức nào 胜出?
- Nếu tôi ở 7B Llama 上把 SigLIP 换 thành CLIP, dự kiến MMMU delta là bao nhiêu?
- Để có được 80% tự tin, tôi nên đầu tiên bỏ qua trục nào?

输出 là một danh sách công thức xếp hạng, chứa dự kiến điểm tham khảo deltas 和 ablate đầu tiên  khuyến nghị

## 交付 nó
本课生成 `outputs/skill-vlm-recipe-picker.md` Đưa ra mục tiêu nhiệm vụ kết hợp, ngân sách tính toán và mục tiêu trễ, nó sẽ xuất ra một công thức hoàn chỉnh (có đoder, kết nối, LLM, kết hợp dữ liệu, lịch giải pháp), và cho mỗi lựa chọn tham khảo đối với việc phân hủy ứng dụng.

## 练习
1. 阅读 MM1 Phần 3.2。 Đối với 2B LLM cố định, trong ngân sách 50M hình ảnh dưới, mã hóa nào 胜出? Nếu thay đổi thành 13B LLM,答案会反转吗? Tại sao?

2. Cambrian-1 发现,拼音 DINOv2 + SigLIP 在视觉中心的基准上胜过单独使用任一者,但在MMMU上没有新增信号──预测哪些基准会升升,哪些会持平──

3. Mục tiêu của bạn là xây dựng đại lý UI di động trên 2B LLM.

4. Molmo  đã phát hành 4B và 72B mô hình. 4B và đóng 7B VLM có sức cạnh tranh. 72B trong 11/11  điểm chuẩn 上击败 Llama-3.2-90B-Vision.

5. 设计一个ablation table, được sử dụng trong 7B VLM 上隔离数据混合质量和编码器质量――最少需要多少次训练运行?提出四轴设置――

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Ablation | “调一个 knob” | 训练多次 runs，它们只在一个 design-space axis 上不同，其他全部保持 constant |
| Connector | “Bridge” / “projector” | 将 vision encoder output 映射到 LLM token space 的 trainable module（MLP、Q-Former、Perceiver） |
| Detailed human caption | “Dense caption” | 多句人类撰写的描述（通常 80-300 tokens），比 web alt text 更丰富 |
| Distillation | “GPT-4V captions” | 由更强的 proprietary VLM 生成的 training data；方便，但容易继承 hallucination |
| AnyRes / dynamic res | “High-res path” | 通过 tiling 或 M-RoPE 输入大于 encoder native resolution 的图像的 strategy |
| Resolution ramp | “Curriculum” | 从 low-resolution 开始并逐步提高的 training schedule，可加快 alignment learning |
| Vision-centric bench | “CV-Bench / BLINK” | 强调细粒度 visual perception，而非 language-heavy reasoning 的 evaluation |
| PixMo | “Molmo's data” | Allen AI 的 712K densely-captioned image dataset；人类语音被转写为 dense captions |

## 延伸阅读
- [McKinzie et al. — MM1 (arXiv:2403.09611)](https://arxiv.org/abs/2403.09611)
- [Laurençon et al. — Idefics2 / What matters building VLMs (arXiv:2405.02246)](https://arxiv.org/abs/2405.02246)
- [Deitke et al. — Molmo and PixMo (arXiv:2409.17146)](https://arxiv.org/abs/2409.17146)
- [Tong et al. — Cambrian-1 (arXiv:2406.16860)](https://arxiv.org/abs/2406.16860)
- [Karamcheti et al. — Prismatic VLMs (arXiv:2402.07865)](https://arxiv.org/abs/2402.07865)
