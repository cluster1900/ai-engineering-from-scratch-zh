# 观测性:长,城,奥皮克

> 三个开源代理可观测性平台主导了 2026 年. 长 (MIT)  每月 6M+安装,追踪+提示管理+评估+会议重播──Arize Phoenix (Elastic 2.0)  深入的代理 专用评估、RAG 相关性、OpenInference自动仪器──Comet Opik (Apache 2.0) 自动化提示 优化、防护器、LLM-法官 幻觉检测──

**类型：**学习 课程
**语言：**字符串 (stdlib)
**前置要求：**阶段14 · 23 (OTel GenAI)
**时间：**约45分钟

## 学习目标

- 描述了三个顶级的开源代理可观测性平台及其许可.
- 区分每个平台最擅长的方面:长 (即时mgmt + 会议) 尼克斯 (RAG + 自动仪器) pik (优化 + 防护车) 
- 解释为什么到2026年,89%的组织报告已经部署了可观测性代理.
- 实现一个带有LLM法官评估的Sdlib追踪到仪表板管道

## 问题

您仍然需要一个平台来摄入跨度,运行评估,存储快速版本,并暴露回归.

## 核心概念

### 拉恩福斯 (MIT)

- 每月安装6M+SDK,19k+GitHub星星.
- 功能:追踪、带版本化+快速管理的游乐场、评估(LLM-as-judge、用户反、自定义)、会议更换──
- 2025 年 6 月:原先的商业模块 (LLM-as-a-judge,注释队列,即时实验,游戏场) 在 MIT 下开源――
- 最擅长:带紧密的快速管理循环的端到端可观测性.

### 鱼 (弹性许可证 2.0)

- 更深入的代理专用评估:追踪集群,异常检测,面向RAG的检索相关性.
- 原生 开放式推理自动仪器化
- 可与托管版Arize AX 配合用于生产
- 没有快速版本 定位是与更广泛的平台配合使用的漂移/行为回归工具
- 最擅长:RAG 相关性,行为漂移,异常检测.

### 彗星奥皮克 (Apache 2.0)

- 通过A/B实验实现自动化快速优化.
- 保护 编辑PII,主题限制)
- 法律法官 幻觉检测.
- 星自测量基准:Opik日志+评价 用时 23.44s,而Langfuse为 327.15s (差距约 14x) 将供应商基准视为方向性参考.
- 最擅长:优化循环,自动化实验,防护.

### 行业数据

根据2026年马克思 (Maximum) 实地分析:89%的组织已经部署了可观测性代理;质量问题是最主要的生产障碍.

### 如何选择

| 需求 | 选择 |
|------|------|
| 带 prompt management 的一体化方案 | Langfuse |
| 深度 RAG 评估 + drift | Phoenix |
| 自动化 optimization + guardrails | Opik |
| 开放 license，不要 ELv2 | Langfuse (MIT) 或 Opik (Apache 2.0) |
| Datadog / New Relic 集成 | 任意 — 它们都导出 OTel |

### 这个模式很容易出错的地方

- **没有 eval strategy。**没有评估的追踪 只是昂贵的伐木.
- **没有 grounding 的自建 LLM-judge。**需要外部工具进行实验证.
- **Prompt versions 没有关联到 traces。**当一个问题出现回归时,你无法分开到导致问题的提示.


```figure
wb-trace-ingest
```

## 构建它

`code/main.py`实现一个 STDlib 追踪收集者 + LLM 评审员:

- 摄入GenAI 形态的跨度――
- 按会议 分组,标记失败运行
- 一位经过编写的法师法官,根据对代理的答案的条款评分:
- 类似仪表板的总结:失败率,最高失败原因,平均分数分布.

运行:

```
python3 code/main.py
```

输出:每个会议的评分和失败分类,与Langfuse/Phoenix/Opik会展示的内容一致.

## 使用它

- **Langfuse**通过OTel或它们的SDK 接入.
- **Arize Phoenix**自主主机器,自动机器,开放式传输.
- **Comet Opik**实现自主托管或云;自动化优化循环.
- **Datadog LLM Observability**适合已运行数据库的混合运营+ML 团队──

## 交付它

`outputs/skill-obs-platform-wiring.md`选择一个平台,并将追踪+评估+提示版本 接入现有代理──

## 练习

1. 导出到Langfuse云 (免费层) 哪些会议失败了?为什么?
2. 为你的领域编写一个法师法官的条目 ((事实正确性、语气、范围遵循) ⋅在 50条的痕迹上测试──
3. 让我们比较Langfuse快速版本和城的追踪集群.
4. 阅读Opik的护文件.为你一个代理运行.
5. 在你的身体上,这个三个平台――忽略出售商发布的数字;测量你的自己――

## 关键术语

| 术语 | 人们的说法 | 实际含义 |
|------|----------------|------------------------|
| Tracing | “Spans collector” | Ingest OTel / SDK spans；按 session 建索引 |
| Prompt management | “Prompt CMS” | 关联到 traces 的 versioned prompts |
| LLM-as-judge | “Automated eval” | 单独的 LLM 按 rubric 对 Agent output 评分 |
| Session replay | “Trace playback” | 逐步回放过去的 runs 以便 debugging |
| RAG relevancy | “Retrieval quality” | retrieved context 是否匹配 query |
| Trace clustering | “Behavioral grouping” | 对相似 runs 聚类，用于 drift detection |
| Guardrail enforcement | “Policy at log time” | 对 logged content 做 PII/toxicity/scope checks |

## 延伸阅读

- [Langfuse docs](https://langfuse.com/)追踪,测量,即时
- [Arize Phoenix docs](https://docs.arize.com/phoenix)自动仪器化,漂移
- [Comet Opik](https://www.comet.com/site/products/opik/)优化+防护
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) 三个平台都会消费的方案
