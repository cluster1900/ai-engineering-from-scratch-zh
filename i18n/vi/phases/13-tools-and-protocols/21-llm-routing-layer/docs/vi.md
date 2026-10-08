# LLM Routing Layer  LiteLLM, OpenRouter, Portkey

> Nhà cung cấp khóa vào 代价高昂―― khác nhau công cụ gọi 工作负载适合不同模型―― Routing gateway 提供统一的 API 表面、重试、failover、成本跟踪和护──2026年有三种主流形态:LiteLLM(开源、自托管)、OpenRouter(托管 SaaS)、Portkey(生产级,2026年 3月开源)。本课会说明决策标准,并演示一个 stdlib routing gateway──

**Type:** Learn
**Languages:** Python (stdlib, routing + failover + cost tracker)
**Prerequisites:** Phase 13 · 02 (function calling), Phase 13 · 17 (gateways)
**Time:** ~45 分钟

## Học mục tiêu
- 区分自托管、托管和生产级路由 选项
- 实现 một chuỗi trở lại, trong nhà cung cấp 失败时按定义好的优先级顺序重试──
- 跟踪跨供应商的单次请求成本和代币使用量──
- Đối với các quy tắc sản xuất nhất định, hãy chọn giữa LiteLLM、OpenRouter và Portkey.

## 问题
Đường dẫn nhà cung cấp  quan trọng trường hợp:

1. **成本。**Claude Sonnet's cost is 3 times Haiku's. Đối với triệt để nhiệm vụ, Haiku 足够; đối với tổng hợp nhiệm vụ, Sonnet 值得.

2. **Failover。**OpenAI xuất hiện một giờ cố tình. Mọi yêu cầu đều thất bại.

3. **延迟。**实时聊天 UI 需要快速的时间到第一代标语――批量摘摘器不需要――按延迟 SLA 路由――

4. **合规。**Người dùng EU phải ở trong khu vực EU.

5. **实验。**Trong cùng một tải trọng làm cho hai mô hình A/B.

Để mỗi người tập hợp viết những logic này rất重复── Routing gateway 提供一个 OpenAI-兼容 API,并处理其余部分──

## 概念
### Proxy tương thích với OpenAI 形态

Tất cả mọi người đều sử dụng hình thức OpenAI.`/v1/chat/completions`, chấp nhận chương trình OpenAI, và được đại diện bên trong đến Anthropic / Gemini / Cohere / Ollama / 任何后端──客户端不需要关心──

### Tên đếm mẫu

Bạn của code không viết `claude-3-5-sonnet-20251022`Nhưng viết`our_smart_model` Gateway sẽ dùng alias 映射到真实模型──当Anthropic 发布Claude 4 时,你在服务端修改 alias;你的代码无需改变任何东西──

### Các chuỗi quay trở lại

```
primary: openai/gpt-4o
on 5xx: anthropic/claude-3-5-sonnet
on 5xx: google/gemini-1.5-pro
on 5xx: refuse
```

Gateway trong config định nghĩa những điều này.

### Caching ngữ nghĩa

Tương tự hoặc gần giống như cùng một prompt trong dự trữ, thay vì cung cấp truy cập.

### Đường dây bảo vệ

网关级:

- **PII redaction.**Trong gửi nhanh chóng trước thực hiện Regex hoặc dựa trên xử lý ML.
- **Policy violations.**拒绝包含禁止内容的提示──
- **Output filters.**清理完成 中中漏漏内容──

Portkey và Kong thành phố được đặt trong có một cách rõ ràng hướng của các hàng rào.

### Các giới hạn lãi suất mỗi khóa

Một khóa API = một nhóm. Ngân sách mỗi khóa ngăn chặn một nhóm tiêu thụ chia sẻ hạn ngạch. Hầu hết các cửa khẩu đều hỗ trợ điều này.

### Thuộc lưu trữ và quản lý

| Factor | LiteLLM (self-hosted) | OpenRouter (managed) | Portkey (production) |
|--------|----------------------|----------------------|----------------------|
| Code | 开源，Python | 托管 SaaS | 开源（2026 年 3 月）+ 托管 |
| Setup | 部署一个 proxy | 注册 | 二者均可 |
| Providers | 100+ | 300+ | 100+ |
| Billing | 你自己的 key | OpenRouter credits | 你自己的 key |
| Observability | OpenTelemetry | Dashboard | 完整 OTel + PII redaction |
| Best for | 想要完全控制的团队 | 快速原型开发 | 有合规需求的生产环境 |

Khi bạn có SRE 团队并 muốn sở hữu quyền sở hữu dữ liệu,LiteLLM 胜出. Khi bạn muốn đơn đăng ký và không muốn bảo trì cơ sở hạ tầng,OpenRouter 胜出. Khi bạn cần mở hộp ngay lập tức và khả năng bảo vệ,Portkey 胜出.

### Theo dõi chi phí

Mỗi yêu cầu mang theo`provider``model``input_tokens``output_tokens`△乘以模型按代币的价格(从门户维护的价格表 拉取) △按用户/团队/项目聚聚──

### MCP cộng với định tuyến

Gateway có thể đồng thời được đường dẫn bởi LLM 调用和MCP sampling requests。 khi yêu cầu lấy mẫu của mô hình 偏好某特定模型时,gateway 会转换到正确后端。 đây cũng là giai đoạn 13 · 17(MCP gateway) và本课路由门户 有时会聚并成一个服务的地方。

### Chiến lược định tuyến

- **Static priority.**列表中的第一个; 出错时倒退──
- **Load balancing.**Thể thao vòng tròn hoặc thêm quyền
- **Cost-aware.**选择满足延迟 / 质量要求的最低成本模型──
- **Latency-aware.**选择过去 N 分钟内最快的模型──
- **Task-aware.**Quick classifier sẽ mã hóa 路由到一个模型, sẽ tóm tắt 路由到另一个模型.


```figure
tp-router-failover
```

## Sử dụng nó
`code/main.py`Sử dụng khoảng 150 行 thực hiện một cổng thông tin định tuyến: chấp nhận yêu cầu hình dạng OpenAI, chuyển sang các mục cung cấp, vận hành chuỗi sự cố trở lại ưu tiên, theo dõi chi phí đơn lần yêu cầu,并 đối với nhập ứng dụng PII sửa đổi pass.

需要关注:

- `ROUTES`dict:alias -> 按优先级排序的具体供应商列表
- Chuyện quay lại sẽ diễn ra ở 5xx.
- Cost Tracker sẽ lấy Token sử dụng nhân tỷ lệ của mỗi mô hình.
- Nhà biên tập PII 会在转发前清理形状类似SSN的模式.

## 交付 nó
本课会产出 `outputs/skill-routing-config-designer.md`△给定一个工作负载配置 (延迟、成本、合规),该技能 会选择 LiteLLM / OpenRouter / Portkey,并生成路由配置──

## 练习
1. 运行 `code/main.py`触发 cạn kiệt 场景; xác nhận sự suy giảm 落到第二供应商,并且成本归因正确──

2. 添加语义缓存:prompt 的 SHA256 作为搜索键;缓存击立即返回──测量重复调用成本节省──

3. 添加一个快速分类器,将 `"code ..."`nhanh chóng 路由到偏向智能的别名,将 `"summarize ..."`路由到偏向速度 的字号: 路由到偏向速度 的字号:

4.  thiết kế ngân sách cho mỗi nhóm: mỗi nhóm có chi tiêu hàng tháng lên giới hạn; đạt được giới hạn trên, cửa sổ  từ chối yêu cầu.

5. Và cũng đọc LiteLLM、OpenRouter 和 Portkey 文档── chỉ ra mỗi sản phẩm được cung cấp và hai sản phẩm khác không có một chức năng──

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Routing gateway | "LLM proxy" | 位于多个 provider 前方的统一 API 表面层 |
| OpenAI-compatible | "Speaks the OpenAI schema" | 接受 `/v1/chat/completions` shape，并转换到任意 backend |
| Model alias | "our_smart_model" | 你代码中的名称，由 gateway 映射到具体模型 |
| Fallback chain | "Retry list" | 失败时按顺序尝试的 provider 列表 |
| Semantic caching | "Prompt-embedding cache" | Key 是 prompt 的 Embedding；近似重复内容共享一次 cache hit |
| Guardrails | "Input/output filters" | 脱敏 PII，拒绝 policy violations |
| Per-key rate limit | "Team budget" | 作用域限定到 API key 的 quota |
| Cost tracking | "Per-request spend" | 聚合 Token 使用量 x 每个模型的价格 |
| LiteLLM | "The open proxy" | 可自托管的 OSS routing gateway |
| OpenRouter | "The managed SaaS" | 基于 credit 计费的托管 gateway |
| Portkey | "The production option" | 开源 + 托管，内置 guardrails |

## 延伸阅读
- [LiteLLM — docs](https://docs.litellm.ai/) Đổng thông tin tự quản
- [OpenRouter — quickstart](https://openrouter.ai/docs/quickstart) 托管 định tuyến SaaS
- [Portkey — docs](https://portkey.ai/docs) 带有护的生产级路由
- [TrueFoundry — LiteLLM vs OpenRouter](https://www.truefoundry.com/blog/litellm-vs-openrouter) 决策指南
- [Relayplane — LLM gateway comparison 2026](https://relayplane.com/blog/llm-gateway-comparison-2026) nhà cung cấp 调研
