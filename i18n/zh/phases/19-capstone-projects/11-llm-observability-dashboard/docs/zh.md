#                                   

> 拉恩福斯 转向开源核心──Arize Phoenix 发布了2026年GenAI semconv 映射──直升机和脑力信都加码了根据用户成本归因──Traceloop的 OpenLLMetry 成为事实上的SDK仪器──生产形态是使用ClickHouse 存储痕迹,使用Postgres 存储元数据,使用Next.js 做UI,再加上一小支 eval、工作 ((DeepEvalRAGAS、LLM-judge) 在样本的痕迹上运行──构建一个自主托管的版本,至少从四类SDK家族的摄入,并演示在五分钟内捕获一个注入的回归──

**Type:** Capstone
**Languages:** TypeScript (UI), Python / TypeScript (ingest + evals), SQL (ClickHouse)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子子
**Time:** 25 小时

## 问题
到2026年,每个运行生产流量的AI团队都将在模型旁边保留一个可观测性平面――成本归因――幻觉检测――漂移监控――监狱突破信号――SLO仪表板――PII 泄露告警――开源参考实现  朗斯、尼克斯、OpenLLMetry  已经围绕了OpenTelemetry GenAI的语义公约 收为摄入方案――现在你可以使用SDK仪器覆盖OpenAI、人类、Google、长链、LlamaIndex 和 vLLM,并发送兼容的跨度――

你将构建一个自主托管的仪表板,它至少从四类SDK家族中摄入,针对样本的痕迹运行一小组评估工作,检测漂移并发出告警.

## 概念
摄入使用OTLP HTTP──SDK 生成 GenAI-semconv跨度:`gen_ai.system`,我知道.`gen_ai.request.model`,我知道.`gen_ai.usage.input_tokens`,我知道.`gen_ai.response.id`,我知道.`llm.prompts`,我知道.`llm.completions`‧ 延长时间 落入ClickHouse做列分析;元数据(用户、会议、应用程序)落入后期

作为批次工作 在样本的痕迹上运行。DeepEval 评估忠诚度、毒性和答案相关性──当痕迹携带检索背景时,RAGAS 评估检索指标──自定义LLM法官运行域名特定检查(PII泄漏、政策以外的响应)──Eval 运行 会作为链接到父母的痕迹的评估范围 写回同一个ClickHouse──

观察随时间变化的嵌入空间分布 (基于快速嵌入的PSI或KL差异) 以及评估分数趋势.

## 架构
```
production apps:
  OpenAI SDK  +  Anthropic SDK  +  Google GenAI SDK
  LangChain + LlamaIndex + vLLM
       |
       v
  OpenTelemetry SDK with GenAI semconv
       |
       v  OTLP HTTP
  collector (ingest, sample, fan-out)
       |
       +-------------+-----------+
       v             v           v
   ClickHouse    Postgres    S3 archive
   (spans)       (metadata)  (raw events)
       |
       +---> eval jobs (DeepEval, RAGAS, LLM-judge)
       |     sampled or all-trace
       |     write eval spans back
       |
       +---> drift detector (PSI / KL on prompt embeddings)
       |
       +---> Prometheus metrics -> Alertmanager -> Slack / PagerDuty
       |
       v
   Next.js 15 dashboard (Recharts)
```

## 技术
- 吞:OpenTelemetry SDK+GenAI语义公约;OTLP HTTP运输
- 收藏器:开放式电气收藏器,带尾样处理器 (用于成本控制)
- 存储:ClickHouse 存储范围,后期存储元数据,S3 存储原始事件档案
- 值:深度值,RAGAS 0.2,Ariz Phoenix评价器包,定制的LLM法官
- 漂移:PSI/KL每周的集成快速嵌入 (句子转换器)
- 警告: 预告警报管理器 ->  Slack / PagerDuty
- 接口:下一个.js 15 应用程序路由器 + 调用器 + 服务器操作
- 开箱即用支持的SDK:OpenAI,人类,谷歌GenAI,兰格链,LlamaIndex,vLLM


```figure
ce-otel-drift
```

## 构建它
1. **Collector config.**配置OpenTelemetry Collector,包含OTLP HTTP接收器,保留100%的错误痕迹和10%的成功痕迹的尾样,以及导出到ClickHouse和S3的出口者──

2. **ClickHouse schema.**表 `spans`图像: 图像:`gen_ai_system`,我知道.`gen_ai_request_model`,我知道.`input_tokens`,我知道.`output_tokens`,我知道.`latency_ms`,我知道.`prompt_hash`,我知道.`trace_id`,我知道.`parent_span_id`按用户ID和app_id 添加次要索引.

3. **SDK coverage test.**使用每个SDK(OpenAI、Anthropic、Google、LangChain、LlamaIndex、vLLM) 和OpenLLMetry自动仪器编写一个小型客户端应用程序──验证每个SDK都能生成可规范的GenAI跨度,并落入 ClickHouse──

4. **Eval jobs.**一个计划工作 读取最近15分钟的样本痕迹,并运行DeepEval忠诚度、毒性和答案相关性──输出是链接到父母痕迹的评估范围──

5. **Custom LLM-judge.**一个PII泄漏法官:给定一个答案,调用一个警卫 LLM来评价PII泄漏的可能性――高分答案 进入分类队列――

6. **Drift detection.**计算本周的每周工作 计算本周的每周工作 计算本周的每周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 计算本周工作 报告 报告

7. **Dashboard.**使用下一个.js 15,包含页面:概述(时间/秒、成本/用户、p95延迟) 痕迹(搜索+布) 年代(忠诚趋势、毒性) 漂移(PSI随着时间的推移) 警报──

8. **Alerting chain.**预测出口者 读取评估分数和延迟百分比;警报管理员将警告 路由到Slack,将关键违规 路由到PagerDuty──

9. **Regression probe.**测量MTTR:从错误部署到Slack警告.

## 使用它
```
$ curl -X POST https://my-otel-collector/v1/traces -d @trace.json
[collector]  accepted 1 trace, 3 spans
[clickhouse] inserted 3 spans (app=chat, user=u_42)
[eval]       DeepEval faithfulness 0.82, toxicity 0.03
[drift]      weekly PSI 0.08 (below 0.2 threshold)
[ui]         live at https://obs.example.com
```

## 交付它
`outputs/skill-llm-observability.md`是交付物品.给定一个LLM应用程序,仪表板能吸收它的痕迹.运行评估.对漂移发出警报,并在Next.js中展示成本/用户分类.

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Trace-schema coverage | 生成 canonical GenAI spans 的 SDK families 数量（目标：6+） |
| 20 | Eval correctness | DeepEval / RAGAS scores 对比 hand-labeled set |
| 20 | Dashboard UX | 注入 regression 的 MTTR（目标低于 5 分钟） |
| 20 | Cost / scale | 持续以 1k spans/sec ingest 且无 backlog |
| 15 | Alerting + drift detection | Prometheus/Alertmanager chain 端到端演练 |
| **100** | | |

## 练习
1. 为草架框架 添加定制仪器.`gen_ai.*`落入ClickHouse的属性.

2. 在同一批量的轨迹上把DeepEval 换成城评测器――测量两个评测引擎之间的分数漂移――

3. 强化漂移探测器:按应用程序ID而不是全局计算PSI──显示每个应用程序漂移轨迹──

4. 添加一个"用户影响"页面:成本/用户和失败率/用户,并带有闪.

5. 构建一个尾巴样本政策:保留100%毒性 > 0.5的痕迹,再对其余痕迹做10%的分层样本――测量引入的样本偏见――

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| GenAI semconv | "OTel LLM attributes" | 2025 OpenTelemetry spec，用于 LLM span attributes（system、model、tokens） |
| Tail sampling | "Post-trace sample" | Collector 在 trace 完成后决定保留还是丢弃（可以查看 errors） |
| PSI | "Population stability index" | 比较两个分布的 drift metric；> 0.2 通常表示有意义的 drift |
| LLM-judge | "Eval as model" | 一个 LLM 按 rubric（faithfulness、toxicity、PII）为另一个 LLM 的 output 打分 |
| Tail-sampling policy | "Keep-rule" | 决定哪些 traces 持久化、哪些丢弃的规则；errored + sample-rate |
| Eval span | "Linked eval trace" | 携带 eval score、并链接到原始 LLM call span 的 child span |
| Cost per user | "Unit economics" | 在一个窗口内归因到某个 user_id 的美元成本；关键 product metric |

## 延伸阅读
- [Langfuse](https://github.com/langfuse/langfuse) 参考开放核心可观测性 平台
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) 具有强漂移支持的另一个参考
- [OpenLLMetry (Traceloop)](https://github.com/traceloop/openllmetry)自动仪器 SDK 家庭
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)摄入方案
- [Helicone](https://www.helicone.ai) 另一个托管可观测性
- [Braintrust](https://www.braintrust.dev) 另一个评价第一平台
- [ClickHouse documentation](https://clickhouse.com/docs) 专跨度存储
- [DeepEval](https://github.com/confident-ai/deepeval)评价者图书馆
