# कैपस्टोन 11  LLM 可观测性与Eval डैशबोर्ड

> Langfuse 转向开源核心──Arize Phoenix 发布了2026 GenAI semconv 映射──Helicone 和 Braintrust 都加码了按用户成本归因──Traceloop के OpenLLMetry 成为事实上的 SDK仪器──生产形态是使用ClickHouse 存储的痕迹,使用Postgres 存储的元数据,使用Next.js 做 UI,再加上一小支 eval、jobs(DeepEvalRAGAS、LLM-judge) 在样本的痕迹上运行──构建一个自主托管的版本,至少从四类 SDK家族的摄入,并演示在五分钟内捕获一个注入的回归──

**Type:** Capstone
**Languages:** TypeScript (UI), Python / TypeScript (ingest + evals), SQL (ClickHouse)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:**P11 · P13 · P17 · P18
**Time:** 25 小时

## 问题
2026 तक, प्रत्येक ऑपरेशन में उत्पादन प्रवाह की मात्रा में एआई  टीम                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             

आप एक स्व-होस्ट किए गए डैशबोर्ड का निर्माण करेंगे, यह कम से कम चार प्रकार के एसडीके परिवार से उपभोग करता है, नमूना ट्रेस के लिए 运行一小组 eval jobs,检测漂移并发发告警――衡门:给定一个故意注入的回归(一个开始产生 PII的提示),डैशबोर्ड 能在五分钟内捕获它并触发告警――

## 概念
Ingest उपयोग OTLP HTTP──SDK 生成 GenAI-semconv स्पैनः`gen_ai.system``gen_ai.request.model``gen_ai.usage.input_tokens``gen_ai.response.id``llm.prompts``llm.completions`◊ स्पैन 落入 ClickHouse doing columnary analytics;metadata(उपयोगकर्ता, सत्र, ऐप) 落入 पोस्टग्रेस

Evals 作为批发工作 在样本的痕迹上运行──DeepEval 评估忠诚度、毒性和答案相关性──当 trace 携带检索文脈 时,RAGAS 评估检索指标──自定义 LLM-judges 运行域名特定检查(PII लीक、政策外响应)──Eval runs 会作为链接到父母的追踪的评估跨度 写回同一个 ClickHouse──

ड्रिफ्ट डिटेक्शन 观察随时间变化的 एम्बेडिंग 空间分布(基于 prompt एम्बेडिंग्स के PSI या KL विचलन) तथा eval-score 趋势。 अलर्ट 进入 Prometheus Alertmanager, फिर तक Slack / PagerDuty──UI उपयोग Next.js 15 和 Recharts──

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
- उपभोगः ओपनटेलीमेट्री एसडीके + जेएनएआई सेमेटिक कन्वेंशन; ओटीएलपी एचटीटीपी परिवहन
- कलेक्टर: ओपनटेलीमेट्री कलेक्टर, साथ पूंछ-सैंपलिंग प्रोसेसर (उपयोग लागत नियंत्रण)
- भंडारणः ClickHouse 存 अवधि, पोस्टग्रेस 存 मेटाडेटा,S3 存 कच्चे घटना संग्रह
- Evals: DeepEval, RAGAS 0.2, Arize Phoenix मूल्यांकन पैक, कस्टम LLM-जजज
- ड्रिफ्टः PSI / KL पर pooled prompt embeddings ( वाक्य-ट्रांसफॉर्मर) साप्ताहिक
- चेतावनीः प्रोमेथियस अलर्ट मैनेजर -> स्लैक / पेजर ड्यूटी
- UI: Next.js 15 App Router + Recharts + सर्वर क्रियाएँ
- 开箱即用支持的 SDKs: ओपनएआई, मानव, गूगल जेनएआई, लैंगचेन, लामाइंडेक्स, वीएलएलएम


```figure
ce-otel-drift
```

##  इसे निर्माण
1. **Collector config.** configure OpenTelemetry Collector, जिसमें OTLP HTTP रिसीवर, एक 100% त्रुटि निशान तथा 10% सफलता निशान के पूंछ-सैंपलर को बनाए रखने, तथा ClickHouse तथा S3 के निर्यातकों को निर्यात करने वाला है―

2. **ClickHouse schema.** `spans`镜像 GenAI semconv के स्तंभों:`gen_ai_system``gen_ai_request_model``input_tokens``output_tokens``latency_ms``prompt_hash``trace_id``parent_span_id`, पुनः एक उपयोग किया जाता है के लिए लंबे उपयोगिता भार के लिए JSON बैग---उपयोगकर्ता_id और app_id के अनुसार दोस्रो सूचकांक जोड़ें---

3. **SDK coverage test.**प्रत्येक SDK का उपयोग करें(OpenAI、Anthropic、Google、LangChain、LlamaIndex、vLLM) और OpenLLMetry ऑटो-इंस्ट्रूमेंट 编写一个小型客户端应用――验证每个 SDK都能生成正规GenAI跨度,并落入 ClickHouse──

4. **Eval jobs.**एक अनुसूचित नौकरी 读取最近 15 分钟的样本痕迹,并运行DeepEval निष्ठा、毒性和答案相关性──输出是链接到父母痕迹的评估跨度──

5. **Custom LLM-judge.**एक पीआईआई लीक जजः एक प्रतिक्रिया निर्धारित करें, एक गार्ड एलएलएम को बुलाएं पीआईआई लीक की संभावना का मूल्यांकन करें।

6. **Drift detection.**साप्ताहिक नौकरी 计算本周 结合即时嵌入与过去 4 周基线 之间 PSI── यदि PSI  सीमा से अधिक हो,则告警──

7. **Dashboard.**उपयोग अगला.js 15,包含页面:概述(स्पेन्स/सेकंड、成本/उपयोगकर्ता、p95 विलंबता) ]] ट्रेस]]]] खोज + झरना) ]] समय]] वफादारी प्रवृत्ति、 विषमता]] ]] समय के साथ बहाव]] ]] पीएसआई]] अलर्ट]]

8. **Alerting chain.**Prometheus निर्यातक 读取 eval स्कोर aggregates 和 latency percentiles;Alertmanager चेतावनी 路由到Slack, 路由到PagerDuty, 路由到关键违法, 路由到PagerDuty, 读取评估成绩集和延迟百分点;

9. **Regression probe.**एक बग में प्रवेश करेंः एक मूल्यांकन किया गया चैटबॉट है 1% की संभावना है कि फर्जी SSNs के रिसाव शुरू कर दिया गया है।

## इसका उपयोग करें
```
$ curl -X POST https://my-otel-collector/v1/traces -d @trace.json
[collector]  accepted 1 trace, 3 spans
[clickhouse] inserted 3 spans (app=chat, user=u_42)
[eval]       DeepEval faithfulness 0.82, toxicity 0.03
[drift]      weekly PSI 0.08 (below 0.2 threshold)
[ui]         live at https://obs.example.com
```

## 交付 यह
`outputs/skill-llm-observability.md`यह एक LLM आवेदन है, डैशबोर्ड इसकी निशानों को निगल सकता है, मूल्यांकन करता है, और Next.js में लागत/उपयोगकर्ता विभाजन प्रदर्शित करता है।

| Weight | Criterion | How it is measured |
|:-:|---|---|
| 25 | Trace-schema coverage | 生成 canonical GenAI spans 的 SDK families 数量（目标：6+） |
| 20 | Eval correctness | DeepEval / RAGAS scores 对比 hand-labeled set |
| 20 | Dashboard UX | 注入 regression 的 MTTR（目标低于 5 分钟） |
| 20 | Cost / scale | 持续以 1k spans/sec ingest 且无 backlog |
| 15 | Alerting + drift detection | Prometheus/Alertmanager chain 端到端演练 |
| **100** | | |

## अभ्यास
1.  हेस्टैक फ्रेमवर्क 添加定制仪器化──验证法典范 以忠实 `gen_ai.*`विशेषताएँ 落入 ClickHouse。

2. एक ही समूह में निशान ऊपर ऊपर ऊपर DeepEval प्लेस फीनिक्स मूल्यांकनकर्ताों ∙ माप दो मूल्यांकन इंजन  बीच स्कोर बहाव ∙

3. 强化漂移探测器: ऐप-आईडी के अनुसार नहीं बल्कि संपूर्ण गणना PSI── प्रति ऐप漂移 पथ प्रदर्शित करना──

4. 添加一个"user impact" 页面:cost-per-user 和 failure-rate-per-user,并带有火花线──

5. एक पूंछ-सैंपलिंग नीति का निर्माण करें: 100% विषाक्तता > 0.5 के निशान बनाए रखें, शेष निशानों के लिए 10% स्तरीकृत नमूना बनाएं

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
- [Langfuse](https://github.com/langfuse/langfuse) 参考 ओपन-कोर अवलोकन क्षमता 平台
- [Arize Phoenix](https://github.com/Arize-ai/phoenix)  मजबूत बहाव समर्थन के लिए एक अन्य संदर्भ
- [OpenLLMetry (Traceloop)](https://github.com/traceloop/openllmetry) ऑटो-इंस्ट्रूमेंटेशन एसडीके परिवार
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) सेवन योजना
- [Helicone](https://www.helicone.ai) 另一个 होस्ट की जा सकती
- [Braintrust](https://www.braintrust.dev) 另一个 eval-first प्लेटफॉर्म
- [ClickHouse documentation](https://clickhouse.com/docs) स्तंभीय अवधि स्टोर
- [DeepEval](https://github.com/confident-ai/deepeval) मूल्यांकनकर्ता पुस्तकालय
