# 托管 LLM 平台  Bedrock, Vertex AI, Azure OpenAI

> 三个超级级,三种不同的策略――AWS Bedrock 是模型市场  Claude, Llama, Titan, Stability, Cohere 位于同一API 之后――Azure OpenAI là OpenAI 合作关系 độc đáo, cộng với các đơn vị thông qua được cung cấp với dung lượng chuyên dụng (PTUs) ――Vertex AI 以 Gemini 为先,拥有最佳长上下文和多模拟叙述――2026年,Artificial Analysis 在 Llama 3.1 405B 等效率场测试Azure OpenAI median 约50 ms,Bedrock 约75 ms  PTU 解释了这一差距,因为专用共享在需求上的规则不是决定哪个最快,而是哪个模型和哪个目录 配合产品的需求,让你再选择我的课程,让你写下一个看看看,让我写下一个看来.

**Type:** Learn
**语言：**Python (stdlib, so sánh chi phí và độ trễ đồ chơi)
**前置要求：**Giai đoạn 11 (Kỹ thuật LLM), Giai đoạn 13 (Các công cụ và giao thức)
**Time:** ~60 minutes

## Học mục tiêu
- Nói ra 3 loại chiến lược nền tảng (trọng trường vs độc quyền vs Gemini- đầu tiên), và đưa mỗi loại chiến lược phù hợp với một ví dụ sử dụng sản phẩm:
- 解释 Azure OpenAI trong các đơn vị thông qua được cung cấp (PTU) 给你买到了什么,以及为什么 on-demand Bedrock 在 405B 规模下通常读数会慢约25 ms──
- 绘制每个平台的 FinOps 归因界面(Bedrock Application Inference Profiles vs Vertex project-per-team vs Azure scopes + PTU reservations)
- 写下一条二供应商最小策略,并解释为什么单供应商锁定是2026年代高昂的错误――

## 问题
Bạn đã chọn sản phẩm của mình Claude 3.7 Sonnet. Bây giờ bạn cần cung cấp dịch vụ. Bạn có thể trực tiếp điều chỉnh API Anthropic, cũng có thể thông qua AWS Bedrock.

Một vấn đề sâu sắc hơn là danh mục. Nếu bạn cần sử dụng Claude、Llama 和 Gemini trong cùng một sản phẩm, bạn sẽ không thể mua chúng từ một địa điểm duy nhất, trừ khi địa điểm đó đồng thời là Bedrock 加 Vertex 加 Azure OpenAI──hyperscaler không có thể trao đổi.

                                                                                                                                                                                                                                                              

## 概念
### 三种策略

**AWS Bedrock** thị trường: Claude (Anthropic)、Llama (Meta)、Titan (AWS first-party)、Tình ảnh: Stability (image)、Cohere (embeddings)、Mistral,以及 image 和 embedding 子目录── một API, một IAM 界面, một CloudWatch xuất khẩu──Bedrock 的押注是,客户想要可选性,胜过想要单一模型──

**Azure OpenAI** Hợp tác độc quyền. Bạn đã có được GPT-4 / 4o / 5 / o-series trong các trung tâm dữ liệu Azure, DALL·E、Whisper, cũng như điều chỉnh mô hình OpenAI.

**Vertex AI** Gemini đầu tiên,其余第二──Gemini 1.5 / 2.0 / 2.5 Flash và Pro,加上 Model Garden(thế bên)──Vertex 的押注是多型式 长上下文  1M-token Gemini context 是差异化因素──

###  quy mô dưới  khoảng cách độ trễ

Phân tích nhân tạo 运行持续基准──在等效的 Llama 3.1 405B 部署上(shared on demand),Azure OpenAI trung bình latency đầu tiên token 约为50 ms;Bedrock 约为75 ms──这个差距不是AWS 失败 它是容量模型差异──Azure 销售PTU (Provided Throughput Units),为您租户 预留 GPU 容量──Bedrock 的等价格──Bedrock 的等价格──也存在,但每单位 起价约$21/小时,大多数共享客户仍然停留在需求──

Khả năng chia sẻ theo yêu cầu 会与所有其他客户的流量竞争――Khả năng chuyên dụng 不会―― Nếu sản phẩm của bạn là SLA là TTFT < 100 ms tại P99, thì bạn sẽ hoặc mua PTU trên Azure, hoặc mua Bedrock Provisioned Throughput, hoặc chấp nhận默认波动――

### Tạo thông qua cung cấp 经济性

Azure PTUs: một khối dự kiến tính toán suy luận. Đối với tải trọng công việc dự đoán, so với theo yêu cầu tối đa tiết kiệm khoảng 70%.

Bedrock Provided Throughput: theo mô hình và khu vực, mỗi giờ $21-$50― toán học giống như  break-even 大约在峰值利用的一半──需要月薪承诺──

Vertex cung cấp dung lượng  theo Gemini SKU 销售; giá因模型和地区而异,公开宣传更少──

### FinOps 界面  Thực sự khác biệt yếu tố

**Bedrock Application Inference Profiles**Đó là thị trường trong số những nơi có lợi nhuận cao nhất.`team``product``feature`标记 hồ sơ;让所有模型调用都通过它路由; CloudWatch 无需后处理即可按 hồ sơ 拆分成本── nó tăng lên vào năm 2025, vẫn là siêu quy mô nhỏ nhất nguyên sinh năng──

**Vertex**归因是项目-per-team加标签-verywhere──你把每个团队建模为一个GCP项目,在每个资源上打标签,并使用BigQuery Billing Export + DataStudio做滚.工作更多,但BigQuery 让你对成本数据执行任意SQL──

**Azure**Tùy thuộc vào phạm vi đăng ký/các nhóm nguồn lực thêm thẻ,并把 PTU đặt phòng 作为一等成本对象──Tags từ các nhóm nguồn lực 继承, chứ không phải từ các yêu cầu 继承, vì vậy theo yêu cầu 归因需要 应用洞察的定制度,或一个会写入头条的门户──

模式是:Bedrock 原生最干净,Vertex 通过BigQuery 最灵活,Azure 最不透明,除非你做仪器──

### Khóa vào là 2026 năm风险

Khi một mô hình chiếm ưu thế, cam kết siêu quy mô đơn cũng có thể chấp nhận được. Năm 2026, phía trước mỗi tháng đều di chuyển. Một mùa là Claude 3.7, một mùa tiếp theo là Gemini 2.5, một mùa tiếp theo là GPT-5.

Mô hình được sử dụng của nhóm có hiệu quả là: đối với bất kỳ sản phẩm nào, gọi LLM quan trọng, ít nhất sử dụng hai nhà cung cấp tối thiểu. BEDROCK 加 Azure OpenAI là một tập hợp thường thấy. Từ một nền tảng lấy Claude, từ một nền tảng khác lấy GPT, giữa chúng thất bại, sử dụng cùng một cổng thông tin.

### Công nghiệp quản lý dữ liệu, BAA và quản lý dữ liệu

Bedrock: hầu hết các khu vực  cung cấp BAA; điểm cuối VPC; tháp gác.
Azure OpenAI:HIPAA、SOC 2、ISO 27001; EU data residency; enterprise受监管场景的默认选项──
Vertex:HIPAA、GDPR、 cư trú dữ liệu theo khu vực; Google Cloud compliance stack。

三者都满足基础检查框──差异 nằm ở các chính sách lưu trữ dữ liệu, nhật ký 如何处理,以及滥用监测 是否读取你的流量(大多数默认选择进入;企业可选择退出)。

### Bạn nên nhớ số

- Azure OpenAI trong Llama 3.1 405B 等效场景 dưới trung bình TTFT: ~ 50 ms (tận dụng PTU) ⋅
- Đàn giường theo yêu cầu 中位 TTFT: ~ 75 ms。
- Tấm thông qua được cung cấp trên giường: mỗi đơn vị $21-$50/h.
- Azure PTU Break-Even: ~ 40-60% sử dụng bền vững.
- Tỷ lệ sử dụng cao thấp PTU tương đương với nhu cầu của tiết kiệm: tối đa 70%


```figure
i4-platform-lanes
```

## Sử dụng nó
`code/main.py`会在一个合成工作负载上比较这三个平台  Nó xây dựng theo nhu cầu so với PTU 经济性、TTFT sự khác biệt và tính trung thành quy định chi phí──运行 nó, xem PTU ở đâu, cũng như khu vực thị trường mô hình rộng ở đâu vượt quá TTFT 差距──

## 交付 nó
本课会生成 `outputs/skill-managed-platform-picker.md` Định định cấu hình tải trọng công việc (­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­­

## 练习
1. 运行 `code/main.py`Đối với mô hình lớp 70B, Azure PTU trong sử dụng bền vững dưới ưu thế trên nhu cầu?
2. Các sản phẩm của bạn cần Claude 3.7 Sonnet và GPT-4o. Thiết kế một triển khai hai nhà cung cấp  哪个放到哪个超级级,前面放什么门口,失败政策是什么?
3. Một位受监管的医疗保健 客户要求BAAs、US-East data residency 和 sub-100ms P99 TTFT── chọn một nền tảng,并使用三个具体功能来论证──
4. Bạn thấy rằng trong tháng này, số lượng thanh toán trên trang web tăng lên 4x... không có hồ sơ thông tin ứng dụng... làm thế nào bạn sẽ tìm ra nguyên nhân?
5. 阅读 Azure OpenAI 和 Bedrock giá cả trang. Đối với 100M-token/tháng Claude workload, 哪个更便宜  trực tiếp Anthropic API、Bedrock theo yêu cầu, hay Bedrock Provided Throughput?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Bedrock | "AWS LLM service" | 跨 Claude、Llama、Titan、Mistral、Cohere 的模型 marketplace |
| Azure OpenAI | "Azure's ChatGPT" | 位于 Azure datacenters 中、带企业控制能力的独家 OpenAI 模型 |
| Vertex AI | "Google's LLM" | 以 Gemini 为先的平台，Model Garden 用于 third-party models |
| PTU | "dedicated capacity" | Provisioned Throughput Unit — 预留 inference GPUs，按小时定价 |
| Application Inference Profile | "Bedrock tagging" | 带 tags 的 per-product cost/usage profile，CloudWatch-native |
| Model Garden | "Vertex catalog" | Vertex AI 的 third-party model section，独立于 Gemini |
| Two-provider minimum | "LLM redundancy" | 让每条关键 LLM 路径跨 ≥2 个 hyperscaler 运行的策略 |
| BAA | "HIPAA paperwork" | Business Associate Agreement；PHI 所必需；三者均提供 |
| Abuse monitoring | "the log watcher" | provider-side safety scan，作用于 prompts/outputs；enterprise 可 opt-out |

## 延伸阅读
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/) 权威 tỷ lệ thẻ và Giá thông qua được cung cấp.
- [Azure OpenAI Service Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) PTU kinh tế và thẻ lãi suất
- [Vertex AI Generative AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) Đứa đôi và Model Garden phụ phí
- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai/)  跨 nhà cung cấp ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ở ơ
- [The AI Journal — AWS Bedrock vs Azure OpenAI CTO Guide 2026](https://theaijournal.co/2026/03/aws-bedrock-vs-azure-openai/) Quản lý quyết định của doanh nghiệp
- [Finout — Bedrock vs Vertex vs Azure FinOps](https://www.finout.io/blog/bedrock-vs.-vertex-vs.-azure-cognitive-a-finops-comparison-for-ai-spend) cơ học thuộc tính bên cạnh.
