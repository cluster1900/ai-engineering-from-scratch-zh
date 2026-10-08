# 推理平台经济学  pháo hoa Tất cả nhau Baseten Modal Replicate Anyscale

> Xuất hiện của thị trường năm 2026 không còn chỉ là GPU  thời gian thuê  Nó phân chia thành silicon tùy chỉnh (Groq, Cerebras, SambaNova)  Các nền tảng GPU (Baseten, Together, Fireworks, Modal) và thị trường đầu tiên của API (Replicate, DeepInfra)  Fireworks sẽ tăng giá mỗi khối GPU vào tháng 5 năm 2026.$1/hr，而 $4B 估值和每天10T+ token 的处理量说明 khối lượng-driven 模型是可行的──Baseten 于 2026 年 1 月以$5B 估值完成了 $300M Series E。竞争定位规则很简单:Fireworks 优化延迟,Together 优化目录宽度,Baseten 优化企业抛光,Modal 优化Python-native DX,Replicate 优化多模范围,Anyscale 优化分布式Python。本课会给你一个可以直接交给创始人的矩阵──

**Type:** Learn
**Languages:** Python (stdlib, toy per-call economics comparator)
**前置要求:**Giai đoạn 17 · 01 (Chương trình quản lý LLM), Giai đoạn 17 · 04 (vLLM Serving Internals)
**Time:** ~60 minutes

## Học mục tiêu
- Nói ra ba phân khúc thị trường: (custom silicon, GPU platforms, API-first), và sẽ phân tích mỗi nhà cung cấp thành một phân khúc.
- 解释 tại sao mô hình định giá API "per-token" sẽ hướng về đường cong chi phí của động cơ phục vụ 收, thay vì hướng về đường cong chi phí của phần cứng 收。
- 计算至少三个供应商的每次请求有效成本,并解释什么时候/分钟 (Baseet,Modal) 胜过/token,
- 识别给定工作负载的正确默认平台(bùng nổ không máy chủ, dung lượng cao ổn định, các biến thể được điều chỉnh tốt, đa phương tiện)

## 问题
Bạn đã đánh giá được các nhà cung cấp siêu quy mô quản lý trên nền tảng. Bạn quyết định cần một nhà cung cấp nhỏ hơn, nhanh hơn: Fireworks sử dụng cho thời gian trễ, cùng sử dụng cho chiều rộng, Baseten sử dụng cho mô hình tùy chỉnh được điều chỉnh tốt. Bây giờ bạn có sáu lựa chọn thực tế, và các trang giá không phù hợp. Fireworks  hiển thị.$/M tokens；Baseten 显示 $/minute;Modal 显示 $/second；Replicate 显示 $Nếu không đối phó với khối lượng công việc, bạn sẽ không thể đối phó với chúng trực tiếp.

Hơn nữa, mỗi trang giá 背后 của mô hình kinh doanh đều khác nhau. Fireworks đang chia sẻ GPU 上运行 riêng công cụ tùy chỉnh của mình. FireAttention.

Bài học này sẽ xây dựng 6 nền tảng này và cho bạn biết chúng sẽ được đánh bại khi nào.

## 概念
### Ba phần

**Custom silicon** Groq(LPU)、Cerebras(WSE)、SambaNova(RDU)。 trên cùng mô hình, decode thường so với cluster dựa trên GPU 快 5-10x。 giá mỗi token cao hơn(2025 年末年 Groq 在 Llama-70B 上约为 ~$0.99/M), nhưng đối với các trường hợp sử dụng nhạy cảm với độ trễ 无可匹敌──Groq là đại lý thoại và môi trường sản xuất dịch trong thời gian thực──

**GPU platforms** Baseten、Together、Fireworks、Modal、Anyscale。运行在NVIDIA(2026年为H100、H200、B200) hoặc有时运行在 AMD 上。它们位于"RunPod、Lambda"和"hyperscaler managed service"(Bedrock) 之间的经济层。

**API-first marketplaces** Tái lặp lại,Infra sâu,OpenRouter,Fal,Broad catalog,pay-per-prediction hoặc pay-per-second, nhấn mạnh thời gian đến cuộc gọi đầu tiên.

### pháo hoa  nền tảng GPU tối ưu hóa độ trễ

- FireAttention engine (đặc dụng); thị trường quảng cáo là trong tương đương hiệu quả trên độ trễ so với vLLM  thấp 4x.
- Lớp hàng 约为 50% của tỷ lệ không máy chủ, được sử dụng cho tải trọng công việc không tương tác.
- Mô hình được điều chỉnh tốt với mô hình cơ bản tương tự về tỷ lệ cung cấp dịch vụ, đây là điểm khác biệt thực sự của nhà cung cấp tiền thưởng LoRA của bạn đối với những người sẽ nhận được tiền thưởng của bạn.
- 2026 年中: thuê GPU theo yêu cầu kể từ 2026 年 5 月 1 日起提高 $1/h──规模化时可协商量价──
- 财务信号: $4B 估值, mỗi ngày xử lý 10T+ token.

### Cùng nhau  tối ưu hóa chiều rộng

- 200+ mô hình, bao gồm cả các bản phát hành nguồn mở trên mạng trong vài ngày sau khi phát hành.
- Trong các mô hình LLM tương đương trên Tái tạo  rẻ 50-70%; "AI Native Cloud" 定位的核心是卷和目录──
- Thuyết định + điều chỉnh tinh tế + đào tạo đều trong một API.

### Baseten  tối ưu hóa doanh nghiệp-phô-liên

- Truss framework: sẽ phụ thuộc, bí mật, config phục vụ đặt trong một biểu đồ trong thực hiện gói mô hình.
- GPU  phạm vi từ T4 đến B200──số phí mỗi phút,并 cung cấp giảm thiểu khởi động lạnh hợp lý──
- SOC 2 loại II,HIPAA sẵn sàng.
- $5B 估值，2026 年 1 月 Series E（来自 CapitalG、IVP、NVIDIA 的 $300M) 

### Modal  Python-native-optimized

- 纯 Python 基础设施-as-code──用 `@modal.function(gpu="A100")`装饰 một chức năng, sau đó sử dụng một lệnh 部署。
- Chi phí mỗi giây. Thời gian lạnh bắt đầu là 2-4s.
- $87M Series B，估值 $1.1B(2025)。 trong cuộc khảo sát độc lập kinh nghiệm phát triển đạt điểm cao nhất。

### Tái tạo  chiều rộng đa phương thức

- Pay-per-prediction──image、video 和 audio model 的默认平台──
- Hệ sinh thái tích hợp ((Zapier、Vercel、CMS plugins)
- Trong các tỷ lệ LLM trên mỗi token, cạnh tranh kém, nhưng thắng trong đa phương thức.

### Anyscale  Ray-native

- 构建在 Ray 上;RayTurbo là động cơ suy luận độc quyền của Anyscale (vLLM) 竞争) 
- 最适合 phân phối khối lượng công việc Python, trong đó bước suy luận là một nút trong biểu đồ lớn hơn.
- Quản lý các cluster Ray; với Ray AIR 和 Ray Serve 深度集成──

### Per-token vs per-minute:分别在什么时候胜出

Khi tải công việc đối với độ trễ không nhạy cảm và bùng nổ, mỗi token là hợp lý, bởi vì bạn chỉ trả tiền cho việc sử dụng thực tế. Khi sử dụng cao và có thể dự đoán, mỗi phút là hợp lý, bởi vì một khi bạn làm cho GPU 和, bạn sẽ thắng mỗi token.

粗略规则:当工作负载高于专用GPU 约30%的持续利用率时,每分钟(Baseten、Modal) bắt đầu thắng hơn mỗi token(Fireworks、Together) ⋅低于该水平时,每 token 获胜,因为你避免为空付费──

### Động cơ tùy chỉnh là cái hào thật sự

Mỗi nền tảng trên vLLM và SGLang đều tuyên bố có động cơ tùy chỉnh. FireAttention, RayTurbo, Baseten, và các nền tảng khác nhau là DX, SLA.

### Những con số mà bạn nên nhớ

- Thuê GPU pháo hoa: từ năm 2026 年 5 月 1 日起提高 $1/h。
- Khảo sát pháo hoa: trong các hiệu ứng cấu hình trên độ trễ hơn vLLM 低 4x.
- Cùng nhau: trên LLM 上比 Replicate 便宜 50-70%。
- Đánh giá cơ bản:$5B（Series E，2026 年 1 月，$300m vòng) ⋅
- Đánh giá vốn: $1.1B ((Series B,2025)。
- Per-minute 在高于 ~30% 持续利用率时胜过每代币──


```figure
cost-per-token
```

## Sử dụng nó
`code/main.py`Trong một khối lượng công việc tổng hợp trên các mô hình giá cả so sánh sáu nhà cung cấp.$/day 和 effective $/M token. 运行 nó để tìm ra điểm chia nhỏ so với điểm chia nhỏ so với điểm chia nhỏ so với điểm chia nhỏ so với điểm chia nhỏ so với điểm chia nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ so với điểm nhỏ.

## 交付 nó
本课会生成 `outputs/skill-inference-platform-picker.md`❖ Đưa ra mô hình tải trọng công việc ✓ SLA 和 ngân sách, chọn nền tảng suy luận chính,并 đưa ra thứ hai ✓

## 练习
1. 运行 `code/main.py`Đối với một khối H100 trên mô hình 70B, trong đó có tỷ lệ sử dụng tiếp tục của Baseten (per minute) sẽ thắng hơn Fireworks (per token)
2. Các sản phẩm của bạn cung cấp tạo hình ảnh, trò chuyện và nói chuyện-đến văn bản.
3. Những loại pháo hoa sẽ làm tăng giá mô hình chính của bạn 1 đô la mỗi giờ. Nếu 40% lưu lượng chuyển sang cấp hạng hàng loạt, giảm 50%), xây dựng có tác động chi phí hỗn hợp.
4. Một khách hàng được giám sát yêu cầu SOC 2 Type II + HIPAA + GPU chuyên dụng.
5. So sánh Fireworks không máy chủ,Tất cả trên yêu cầu,Baseten chuyên dụng và sao chép API trên Llama 3.1 70B mỗi 1.000 dự đoán chi phí. Mỗi ngày 10 dự đoán 时哪个最便宜?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Custom silicon | "non-GPU chips" | Groq LPU、Cerebras WSE、SambaNova RDU — 针对 decode 优化 |
| FireAttention | "Fireworks engine" | Custom attention kernel；市场宣传为 latency 比 vLLM 低 4x |
| Truss | "Baseten's format" | Model packaging manifest；dependencies + secrets + serving config |
| Per-token | "API pricing" | 按消耗的 tokens 收费；无需为空闲付费 |
| Per-minute | "dedicated pricing" | 按 wall-clock GPU time 收费；在高 utilization 时胜出 |
| Per-prediction | "Replicate pricing" | 按 model invocation 收费；常见于 image/video |
| RayTurbo | "Anyscale engine" | Ray 上的 proprietary inference；在 Ray clusters 上与 vLLM 竞争 |
| Batch tier | "50% off" | 降价的 non-interactive queue；常见于 Fireworks、OpenAI |
| Fine-tuned at base rate | "Fireworks LoRA" | 以 base model 的 rate 对 LoRA-served requests 收费（差异点） |

## 延伸阅读
- [Fireworks Pricing](https://fireworks.ai/pricing) giá mỗi token, cấp hàng, thuê GPU.
- [Baseten Pricing](https://www.baseten.co/pricing/) tỷ lệ mỗi phút  năng lực cam kết  cấp độ doanh nghiệp
- [Modal Pricing](https://modal.com/pricing) tốc độ GPU/giây và cấp độ tự do.
- [Together AI Pricing](https://www.together.ai/pricing) danh mục mô hình và tỷ lệ mỗi token
- [Anyscale Pricing](https://www.anyscale.com/pricing) RayTurbo và quản lý giá Ray
- [Northflank — Fireworks AI Alternatives](https://northflank.com/blog/7-best-fireworks-ai-alternatives-for-inference) đánh giá so sánh
- [Infrabase — AI Inference API Providers 2026](https://infrabase.ai/blog/ai-inference-api-providers-compared) phong cảnh nhà cung cấp。
