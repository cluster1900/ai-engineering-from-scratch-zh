# 专业教育可观测性 选择

> 2026年可观测性市场分为两类――开发平台(LangSmith、Langfuse、Comet Opik) 将监控与评估,快速管理,会议重播 包装在一起──Gateway/工具化工具──Helicone、SigNoz、OpenLLMetry、Phoenix) 专注于遥测──Langfuse是MIT许可的核心,并在OSS方面取得了很好的平衡──免费云每月50K事件) ─Phoenix是OpenTelemetry原生,采用Elastic License 2.0  非常适合漂移/RAG可视化,但不是持续的生产后端──Arize AX使用复制冰箱/Parquet 集成,声称比较容易通过Smox 微软的测量模式,基于LangCong 软件的软件,基于Growth 基于Growth 网络,支持每月的软件,仅限于100元/Growth 分析,支持每月的软件,支持/LangCong 网,支持/LangCong 网,支持/LangCong 网,支持/LangCong 网,支持/LangCong 网,支持/LangCong 网,支持/LangCong 网,支持/LangCong 网.

**Type:** Learn
**Languages:** Python (stdlib, toy trace-sampling simulator)
**前置要求：**阶段17 · 08 (推理指标),阶段14 (代理工程)
**Time:** ~60 分钟

## 学习目标
- 区分开发平台(打包:evals +提示 +会议) 与门户/远程工具(仅追踪+指标) 👇
- 将六个主要工具将映射到它们的许可,价格和最适合的使用情况.
- 解释OpenTelemetry 粘合模式,它让你把门户工具与独立的评估平台组合起来.
- 解释2026年的成本差异点 (Arize AX的零复制方法与单摄入量),并说明大约100倍的倍数.

## 问题
你上线一个LLM功能. 它能工作. 但你看不到快速失败,工具循环,延迟回归,成本峰值,或快速缓存击率. 你在谷歌查看LLM可观测性,会看到八个工具都声称能解决同一个问题,而且价格档位还分成三档.

它们解决不是同一个问题. 兰格史密斯回答为什么这次兰格拉夫运行失败了? 菲尼克斯回答我的RAG管道是否漂浮?

选择涉及四个轴:stack(长链?原始 SDK?多供应商?) 许可证容忍度(仅接受MIT?弹性可以?商业没有问题?) 预算(免费层次?$100/mo？$需要一个好客,一定要一个好客.

## 概念
### 两类

**开发平台**让可观测性与评估、即时管理、数据集版本化、会议重播 打包在一起──你运行实验,查看哪个提示有效果,把新提示与旧获胜者在数据集上做回归──长史密斯、长、彗星Opik 属于这个类型──

**Gateway/telemetry 工具**对于推断调用做工具化采集 快速,响应,代码,延迟,模型,成本,机,SigNoz,OpenLLMetry,Phoenix.

### 长   平衡

- 通过Docker自主主托管.
- 云免费级别:50万次活动/月.
- 对于四个开发平台功能都有合理的覆盖.
- 您需要一个级别的功能,但必须自主主持或持有OSS许可.

###                 

- 灵活许可2.0;自主主播 很简单.
- 非常擅长RAG 和漂移可视化――嵌入空间散射图片是等功能――
- 没有为持久生产后端设计的主要是开发期可观测性.
- 开发道,并与独立门户 配合用于生产.

### 亚里兹 AX  尺度播放

- 通过冰山/公园实现零复制数据湖集成
- 声称在尺度下比单一可观测性(Datadog类)便宜约100x──计算方式:你把痕迹存在自己 S3 上的套装中;Arize 直接读取──
- 需要专业的仪表板,但不想付出数据库价格.

### 长史密斯  长链/长图 优先

- 商业,$39/用户/月.
- 如果不用这两种,吸引力会很弱.
- 团队已经投入了"长链",并愿意付费.

### 基于代理的升机最小可行

- 通过把`OPENAI_API_BASE`替换为直升机代理,15-30 分钟完成设置──
- 免费,付费20美元/月+
- 包含失败过关,缓存,加息限制,也可充值门口.
- 对代理/多步骤的痕迹的深度较弱.
- 需要网关+可观的应用

###  OSS开发平台

- 亚帕奇2.0,完全运用.
- 功能集与兰格斯类似,带有彗星传承.
- 现在,我们已经使用了彗星的 ML 团队,希望在同一个窗口中获得LLM可观测性.

### 开放Telemetry-first 完整APM

- 通过OpenTelemetry同时处理一般APM和LLM
- 跨服务和LLM的统一可观测性.

### 粘合层:开放电气学+GenAI语义公约

开通电气在2025年底发布了GenAI语义公约`gen_ai.system`,我知道.`gen_ai.request.model`,我知道.`gen_ai.usage.input_tokens`消费工具可互操作.

1. 根据GENAI公约,每次LLM电话都发出.
2. 路由到门口 (直升机/门口) 用于日常使用.
3. 双写到评估平台 (Phoenix/Langfuse) 用于回归.
4. 归档到数据湖 (Iceberg),用于通过Arize AX或DuckDB做长期分析.

### 陷:在错误层做工具化

在HTTP/OpenAI-SDK层做工具化 (通过OpenLLMetry或你的网关) 更可移植.

### 样本你不能保留所有东西

当请求量 > 1M请求/天时,全线保留的成本将超过LLM调用本身.

### 你应该记住的数字

- 免费云:50万次事件/月
- 长史密斯: 39美元/用户/月
- 无型机:每月100万次
- 亚里兹AX声称:在尺度下比单式便宜约100倍.
- 开通电信GenAI公约:2025 发布,2026 广泛采用


```figure
i4-otel-glue
```

## 使用它
`code/main.py`模拟在不同保留策略中:100%摄入量,样本采样+错误) 下一天1M的痕迹.

## 交付它
本课会产出 `outputs/skill-observability-stack.md`△根据堆,规模,预算,许可的姿势 选择工具──

## 练习
1. 你的团队使用了LangChain,并希望OSS自主托管可观测性──选择Langfuse或Opik 并说明原因──
2. 在5M的痕迹/天和数据库 报价$150K/月 时,计算Arize AX的破解平衡.
3. 设计一组你的组织指南 应要求每一次LLM电话都必须包含OpenTelemetryGenAI属性──
4. 论证只有城是否足以生产.
5. 如果P99TTFT为300ms时,这是可以接受的吗?如果SLA是100ms?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| OpenLLMetry | “OTel for LLMs” | 面向 LLMs 的开源 OpenTelemetry instrumentation |
| GenAI conventions | “OTel attributes” | LLM calls 的标准 OTel attribute names |
| LangSmith | “LangChain observability” | 与 LangChain ecosystem 打包的 commercial platform |
| Langfuse | “OSS LangSmith” | 具备类似功能集的 MIT OSS |
| Phoenix | “Arize dev tool” | OpenTelemetry-native dev/eval platform |
| Arize AX | “scale observability” | Commercial zero-copy Iceberg/Parquet observability |
| Helicone | “proxy observability” | 收集 LLM telemetry + gateway features 的 HTTP proxy |
| Opik | “Comet LLM” | 来自 Comet 的 Apache 2.0 OSS dev platform |
| Session replay | “trace rerun” | 带 tool calls 的完整 agent session replay |
| Eval | “offline test” | 在 labeled dataset 上运行 candidate model/prompt |

## 延伸阅读
- [SigNoz — 2026 顶级 LLM 可观测性工具](https://signoz.io/comparisons/llm-observability-tools/)
- [Langfuse — Arize AX Alternative analysis](https://langfuse.com/faq/all/best-phoenix-arize-alternatives)
- [PremAI — 设置 Langfuse、LangSmith、Helicone、Phoenix](https://blog.premai.io/llm-observability-setting-up-langfuse-langsmith-helicone-phoenix/)
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Arize Phoenix docs](https://docs.arize.com/phoenix)
- [Helicone docs](https://docs.helicone.ai/)
