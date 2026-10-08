#  微LLM、Portkey、Kong AI 网关、双

> 网关 位于您的应用程序和模型提供商之间.核心功能是提供商路由,倒退,退缩,速度限制,秘密引用,可观察性,防护.**LiteLLM**支持100多个提供商,与OpenAI兼容,但在2000 RPS左右时会崩(8 GB的内存,已发布基准中出现级故障);最适合Python、<500 RPS、dev/原型制作──**Portkey**定位为控制平面,防护线,PII编辑,监狱突破检测,审计线路,2026年 3月转向Apache 2.0开源,延迟上空费为20-40 ms,生产级为$49/mo。**Kong AI Gateway** 基于 Kong Gateway 构建 — Kong 在相同 12 CPUs 上的自有 benchmark：比 Portkey 快 228%，比 LiteLLM 快 859%；定价 $其他类型的企业,如已使用Kong,它适合企业.**Bifrost**支持可配置的后退,OpenAI 429 时回归到人类.**Cloudflare / Vercel AI Gateways**管理,零操作,基本重试――数据居住地决定自主托管;Portkey 和 Kong 处于中间位置,提供OSS +可选管理――

**Type:** Learn
**Languages:** Python (stdlib, toy gateway-routing simulator)
**前置要求:**17 · 01阶段 (管理的LLM平台),17 · 16阶段 (模式路由)
**Time:** ~60 minutes

## 学习目标
- 列举六个核心门户 功能 路由,倒退,退缩,速度限制,秘密,可观察性,防护) 
- 通过将四个2026的门口,将将将将在尺寸上限和使用情况进行映射.
- 引用Kong基准 ((相比Portkey228%,相比LiteLLM859%),并解释为什么对 >500 RPS 很重要.
- 在给定数据居住和运营预算的情况下选择自主托管或管理.

## 问题
你的产品调用OpenAI、Anthropic 和一个自主托管的Llama──每个提供商都有不同的SDK、错误模型、率限制和作者方案──你需要一个失败的方案──如果OpenAI 返回429,就试着Anthropic)、单个凭证商店、统一可观察性,以及按租户的利率限制──

在应用层重新实现这些,将使每个服务与每个提供商合.

## 概念
### 六个核心特征

1. **Provider routing**将OpenAI,人类,双胞胎,自主托管等放在一个API后面.
2. **Fallback** 遇到429、5xx或质量失败时,在其他地方重试.
3. **Retries**指数式回复,有界尝试――
4. **Rate limits**按租户的密钥模型
5. **Secret references**运行时从库存中获取凭证
6. **Observability** OTel + GenAI属性(17阶段 · 13)+成本属性──
7. **Guardrails** PII编辑,监狱突破检测,允许的话题过器.

### 微LLM  MIT OSS,Python

- 100多家提供商,与OpenAI兼容,路由器配置,倒退,基本可观测性.
- 在 Kong 的基准中约2000 RPS 时崩;8 GB 内存足迹,在持续负载下出现级故障──
- 最适合:Python应用程序,<500 RPS,dev/staging gateway,实验路由.
- 成本:OSS为 $0;有云免费层次.

### 门键 控制平面定位

- 截至2026年 3 月为Apache 2.0 OSS──防护轨道、PII编辑、监狱突破检测、审计轨道──
- 每个请求的延迟费用为20-40ms.
- 产量级为49美元/月,包含保留+SLA.
- 最适合:需要捆绑的护 +可观察性的监管产业.

###         

- 基于Kong Gateway 构建成熟的API门户端 产品,lua+OpenResty) 。
- 港自有基准在12CPU相当上:比Portkey快228%,比LiteLLM快859%──
- 价格:每月100美元,加级 最多5个.
- 最适合:已在使用Kong;>1000 RPS;愿意购买许可证.

### 双 (最大AI)

- 支持可配置的后备.
- 开AI 429 时回归到人类是正规的食谱.
- 较新入口商业.

### 云飞云AI网关 / 维尔塞尔AI网关

- 管理的零操作.
- 最适合:运行在Cloudflare/Vercel 上的边缘服务JavaScript应用程序.
- 在防护线和速度限制方面不如 Kong/Portkey

### 自主主机和管理

个人数据居住是决定因素――医疗保健和金融 默认自主托管――LiteLLM 或 Portkey OSS 或 Kong) ――消费者产品 默认管理――Cloudflare AI 网关) 或中层次的港口关键管理――混合:受监管的租户 使用自主托管,其他使用管理――

### 延迟预算

- 典型的上空费用为5-15ms.
- 门口钥匙:头部为20-40ms.
- ,我在上,我在上.
- 云/维尔塞尔:过度成本为1-3 ms

网关延迟会直接增加TTFT──对于TTFT P99 < 100 ms SLA,选 Kong或 Cloudflare──对于P99 < 500 ms,任何都可以──

### 速度限制语义问题

简单的代币桶 可支到中度规模――多租户需要滑窗+爆发额+每租户层次――LiteLLM 内置代币桶;Kong 内置滑窗;Portkey 内置层次――

### 网关+可观测性+路由组件

阶段17 · 13(可观察性) + 16 ((模型路由) + 19 ((门口) 在生产中属于同一层次.

### 你应该记住的数字

- 简单的记忆力:约2000 RPS 崩,8 GB 存储量.
- 港口关键:20-40 ms 开支;自 2026 年 3 月起Apache 2.0
- 港口比利特莱姆快85%
- 价格:100美元/模型/月,加级 最多5个.
- 云/维尔塞尔:边缘 上 1-3 ms 开支


```figure
mx-gateway-fallback
```

## 使用它
`code/main.py`模拟3个提供商在429/5xx注射下面的门户路由与倒退――报告延迟、倒退率 和倒退率――

## 交付它
本课产出发 `outputs/skill-gateway-picker.md`△给定规模,ops姿势,合规性,延迟预算,选择一个门户.

## 练习
1. 运行`code/main.py`在5%的供应商错误率下,预期的撞击率是多少?
2. 你的SLA是TTFT P99 <200ms,基线为300ms.
3. 一个医疗保健客户 要求自主托管+PII编辑+审计――选择Portkey OSS 还是 Kong――
4. 团队应该迁移到什么 RPS 顶层?
5. 为多租户SaaS 设计率限制政策:免费层,试用层,付费层,选择代币桶还是滑动窗口?

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
