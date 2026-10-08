# AI Gateway  LiteLLM、Portkey、Kong AI Gateway、Bifrost

> Gateway  nằm trong ứng dụng của bạn và nhà cung cấp mô hình 之间──核心功能是 nhà cung cấp định tuyến, sự suy giảm, rút lui, giới hạn tốc độ, tham chiếu bí mật, khả năng quan sát, bảo vệ──2026 年的市场分化:**LiteLLM**là MIT OSS, hỗ trợ 100+ nhà cung cấp, OpenAI tương thích, nhưng trong khoảng 2000 RPS 时会崩(8 GB bộ nhớ, đã phát hành tiêu chuẩn trong sự cố hàng loạt); thích hợp nhất với Python、<500 RPS、dev/prototyping。**Portkey**定位为控制平面(guardrails、PII redaction、jailbreak detection、audit trails),2026 年 3 月转为 Apache 2.0 open source, latency overhead 为 20-40 ms, sản xuất cấp 为$49/mo。**Kong AI Gateway** 基于 Kong Gateway 构建 — Kong 在相同 12 CPUs 上的自有 benchmark：比 Portkey 快 228%，比 LiteLLM 快 859%；定价 $100/mô hình/tháng ((Plus tier 最多 5 个); Nếu bạn đã sử dụng Kong, nó phù hợp với doanh nghiệp。**Bifrost**(Maxim AI)  tự động thử nghiệm lại, hỗ trợ Backoff có thể cấu hình, OpenAI 429 时 fallback đến Anthropic**Cloudflare / Vercel AI Gateways** quản lý, không-sử lý, thử lại cơ bản.

**Type:** Learn
**Languages:** Python (stdlib, toy gateway-routing simulator)
**前置要求:**Giai đoạn 17 · 01 (Chương trình quản lý LLM), Giai đoạn 17 · 16 (Mô hình định tuyến)
**Time:** ~60 minutes

## Học mục tiêu
- 列举六个核心 gateway 功能 路线,倒退,退行, 速率限制, bí mật, khả năng quan sát, bảo vệ)
- Sẽ có 4 cổng vào năm 2026 (LiteLLM、Portkey、Kong AI、Bifrost) được chiếu lên các trần cột và trường hợp sử dụng.
- 引用 Kong benchmark ((相比 Portkey 228%,相比 LiteLLM 859%),并解释为什么对 >500 RPS 很重要──
- Trong trường hợp quản lý dữ liệu và ngân sách của các hoạt động, chọn tự lưu trữ hoặc quản lý.

## 问题
Bạn cần phải lỗi hơn nếu OpenAI quay lại 429, hãy thử Anthropic) ✓ một cửa hàng chứng chỉ duy nhất, khả năng quan sát thống nhất, cũng như giới hạn giá thuê nhà.

Trong lớp ứng dụng 重新实现这些, sẽ cho phép mỗi dịch vụ với mỗi nhà cung cấp 合.Gateway layer sẽ tích hợp nó vào một quy trình, cung cấp một API (thường tương thích với OpenAI), phân phối lại cho các nhà cung cấp.

## 概念
### 6 tính năng cốt lõi

1. **Provider routing** sẽ mởAI, Anthropic, Gemini, tự lưu trữ等等 đặt vào một API 后面.
2. **Fallback** 遇到 429 、5xx hoặc thất bại chất lượng 时, 在别处重试──
3. **Retries** đợt quay trở lại, có những nỗ lực.
4. **Rate limits** 按租客,按密钥,按模型.
5. **Secret references** 运行时从库 拉取凭证(绝不放在app中)
6. **Observability** Các thuộc tính OTel + GenAI(Phase 17 · 13)+ thuộc tính chi phí。
7. **Guardrails** Phục hồi PII, phát hiện jailbreak, lọc các chủ đề được phép.

### LiteLLM  MIT OSS, Python

- 100+ nhà cung cấp  OpenAI tương thích  cấu hình router  fallback  khả năng quan sát cơ bản 
- Trong điểm chuẩn của Kong Trung bình 2000 RPS 时崩; 8 GB bộ nhớ dấu chân, trong tải liên tục dưới đây xuất hiện các lỗi hàng loạt.
- 最适合: ứng dụng Python ∞<500 RPS ∞dev/staging gateways ∞ định tuyến thử nghiệm ∞
- Chi phí: OSS là $0; có cấp độ miễn phí đám mây.

### Portkey  định vị máy bay điều khiển

- 截至 2026 年 3 月为 Apache 2.0 OSS──Guardrails、PII redaction、jailbreak detection、audit trails──
- Mỗi yêu cầu về thời gian trễ là 20-40 ms.
- Lớp sản xuất là $49/mo, bao gồm lưu giữ + SLA.
- Ưu điểm: cần phải gắn dây chèn bảo vệ + khả năng quan sát của ngành công nghiệp được quy định.

### Kong AI Gateway  chơi quy mô

- 基于 Kong Gateway 构建(成熟的API gateway 产品,lua+OpenResty) ⋅
- Kong có điểm chuẩn trong tương đương 12 CPU 上:比 Portkey 快 228%,比 LiteLLM 快 859%
- Giá: 100$/mô hình/tháng,Tầng Plus tối đa 5 个.
- Ưu điểm: đã sử dụng Kong;> 1000 RPS; sẵn sàng mua giấy phép.

### Bifrost (Maximum AI)

- Các thử nghiệm tự động, hỗ trợ backoff có thể cấu hình được.
- OpenAI 429 时 fallback đến Anthropic là công thức truyền thống.
- 较新参赛者; thương mại;;

### Cloudflare AI Gateway / Vercel AI Gateway

- Quản lý 零-ops。Cử nghiệm lại cơ bản và khả năng quan sát。
- Ứng dụng JavaScript phục vụ Edge trên Cloudflare/Vercel
- Trong các đường dây và giới hạn tốc độ 方面不如 Kong/Portkey。

### Tự lưu trữ vs quản lý

Data residency is a decisive factor.  Chăm sóc sức khỏe và tài chính 默认 self-hosted. • LiteLLM hoặc Portkey OSS hoặc Kong. • Sản phẩm tiêu dùng 默认 quản lý. • Cloudflare AI Gateway. • trung cấp. • Portkey. • Hybrid: thuê nhà được quy định. • Self-hosted. •

### Ngân sách thời gian trễ

- LiteLLM: chi phí trên tiêu chuẩn là 5-15 ms.
- Cánh cổng: đầu lên 20-40 ms.
- Kong: Overhead là 3-8 ms.
- Cloudflare/Vercel: Overhead 为 1-3 ms

Sự trễ của cửa cổng sẽ tăng trực tiếp TTFT. Đối với TTFT P99 < 100 ms SLA, SHOK Kong hoặc Cloudflare. Đối với P99 < 500 ms, bất cứ điều gì có thể.

### Thuật ngữ giới hạn tỷ lệ

简单的代币桶 可支到中度规模──多租户 需要滑窗 + bùng nổ allowance + per tenant tiering──LiteLLM 内置代币桶;Kong 内置滑窗;Portkey 内置层──

### Gateway + khả năng quan sát + định tuyến kết hợp

Giai đoạn 17 · 13(khám phá) + 16 ((chế độ định tuyến) + 19 ((cổng) trong sản xuất thuộc về cùng một tầng。 chọn một overcover三者的工具,或仔细把它们串起来:多数 2026 triển khai 会组合 Helicone ((khám phá)) hoặc Portkey ((guardrails)) với Kong ((scale), được sử dụng để phân chia vai trò。

### Những con số mà bạn nên nhớ

- LiteLLM: khoảng ~ 2000 RPS 崩,8 GB bộ nhớ.
- Portkey: 20-40 ms trên cao; từ 2026 年 3 月起 Apache 2.0
- Kong:比 Portkey 快 228%,比 LiteLLM 快 859%
- Giá: 100$/mô hình/tháng, Tầng Plus tối đa 5 个.
- Cloudflare/Vercel:edge 上 1-3 ms overhead


```figure
mx-gateway-fallback
```

## Sử dụng nó
`code/main.py`模拟 3 个提供商 在 429/5xx注射 下的门户路由与倒退――报告延迟、倒退率 和倒退撞击率──

## 交付 nó
本课产 出 `outputs/skill-gateway-picker.md`❖ Định quy mô ∞ops tư thế ∞ tuân thủ ∞ ngân sách chậm, chọn một cửa cổng ∞

## 练习
1. 运行 `code/main.py` cấu hình OpenAI→Anthropic→ tự lưu trữ của sự suy giảm.
2. SLA của bạn là TTFT P99 < 200 ms, đường cơ sở là 300 ms...
3. Một khách hàng chăm sóc sức khỏe  yêu cầu tự lưu trữ + biên soạn PII + kiểm toán.
4. So sánh LiteLLM với Kong: Đội nên di chuyển trên trần RPS nào?
5. Đối với nhiều thuê nhà SaaS  thiết kế chính sách giới hạn mức giá: cấp độ miễn phí, cấp độ thử nghiệm, cấp độ trả tiền, chọn token-bucket hoặc cửa sổ trượt?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Gateway | “API broker” | 位于 apps 和 providers 之间的 process |
| LiteLLM | “the MIT one” | Python OSS，100+ providers，2K RPS 时崩溃 |
| Portkey | “guardrails gateway” | Control plane + observability，Apache 2.0 |
| Kong AI Gateway | “the scale one” | 基于 Kong Gateway 构建，benchmark leader |
| Bifrost | “Maxim's gateway” | Retries + Anthropic fallback recipe |
| Cloudflare AI Gateway | “edge managed” | Edge-deployed managed gateway，zero-ops |
| PII redaction | “data scrub” | 发送到 model 前进行 Regex + NER mask |
| Jailbreak detection | “prompt injection guard” | 对 user input 的 Classifier |
| Audit trail | “regulated log” | 每次 LLM call 的 immutable record |
| Token-bucket | “simple rate limit” | 基于 refill 的 rate limiter |
| Sliding-window | “precise rate limit” | Time-windowed rate limiter；fairness 更好 |

## 延伸阅读
- [Kong AI Gateway Benchmark](https://konghq.com/blog/engineering/ai-gateway-benchmark-kong-ai-gateway-portkey-litellm)
- [TrueFoundry — AI Gateways 2026 Comparison](https://www.truefoundry.com/blog/a-definitive-guide-to-ai-gateways-in-2026-competitive-landscape-comparison)
- [Techsy — Top LLM Gateway Tools 2026](https://techsy.io/en/blog/best-llm-gateway-tools)
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [Portkey GitHub](https://github.com/Portkey-AI/gateway)
- [Kong AI Gateway docs](https://docs.konghq.com/gateway/latest/ai-gateway/)
