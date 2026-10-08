# 托管 LLM 平台  贝德罗克,维尔特克斯AI,Azure OpenAI

> 三个超级级,三种不同的策略――AWS Bedrock 是模型市场  克劳德,拉马,泰坦,稳定,凝聚 位于同一API 之后――Azure OpenAI 是独有的 OpenAI 合作关系,加上用于专用容量的配置吞吐量单位 (PTUs) ――Vertex AI 以Gemini 为首,拥有最佳长上下文和多模特化叙述――2026年,人工分析在Llama 3.1 405B等效率下测量Azure OpenAI的中介约为50 ms,Bedrock 约75 ms  PTU 解释了这一差距,因为专用共享在需求上规则不是最快的,而是 模型和 模特  模特 配合产品的需求,让你再次选择了我的课程,让我写下来.

**Type:** Learn
**语言：**字符串 (stdlib,玩具成本和延迟比较器)
**前置要求：**工程学阶段11 (LLM工程),阶段13 (工具和协议)
**Time:** ~60 minutes

## 学习目标
- 现在,我们已经开始使用了不同的产品.
- 解释Azure OpenAI中提供吞吐量单位 (PTU) 给你买到了什么,以及为什么在需求上 Bedrock 在 405B 规模下通常读数会慢约25 ms──
- 绘制每个平台的FinOps 归因界面(Bedrock应用推理资料与Vertex项目对团队对 Azure范围 + PTU预订) 。
- 写下一条 两家供应商最低策略,并解释为什么单个供应商锁定是2026年高昂的错误.

## 问题
你选择了Claude 3.7 Sonnet的产品.现在你需要提供服务.你可以直接调用Anthropic API,也可以通过AWS Bedrock调用,也可以通过网关.

更多深层的问题是目录. 如果你需要在同一产品中使用克劳德,拉马和双胞胎,那么你不能从单一地点买它们,除非在同一地点同时是Bedrock加 Vertex加Azure OpenAI――超级级不是可互换的.

本课会理这三种投注,延迟差距,终端操作差距和锁定风险.

## 概念
### 三种策略

**AWS Bedrock**市场――Claude (Anthropic)、Llama (Meta)、Titan (AWS第一方)、稳定性 (图像)、Cohere (嵌入式)、Mistral,以及图像 和嵌入式 子目录──一个API,一个IAM界面,一个CloudWatch出口──Bedrock的押注是,客户想要可选性,胜过想要单一模型──

**Azure OpenAI**在Azure数据中心中获得了GPT-4/4o/5o系列的GPT-4/o系列的GPT-4/o/o系列的GPT-4/o 系列的GPT-4/o/o系列的GPT-4/o/o系列的GPT-4/o/o系列的GPT-4/o/o系列的GPT-4/o/o系列的GPT-4/o/o系列的GPT-4/o/o系列的GPT-4/o/o系列的GPT-4/o/o/o系列的GPT-4/o/o/o系列的GPT-4/o/o/o系列的GPT-4/o/o/o系列的GPT-4/o/o/o系列的GPT-4/o/o/o系列的GPT-4/o/o/o系列的GPT-4/o/o/o系列的GPT-4/o/o/o/o系列的GPT-4/o/o/o/o系列的GPT/o/o/o/o系列的GPT/o/o/o/o/o/o系列的GPT/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/o/

**Vertex AI**双子座第一,其余第二──双子座1.5/2.0/2.5 闪电和Pro,加上模型花园(第三方)──Vertex 的押注是多模式的长上下文  1M标记双子座背景是差异化因素──

### 规模下延迟差距

人工分析 运行持续基准――在等效的Llama 3.1 405B 部署上(分享按需),Azure OpenAI的中位数首代币延迟约为50 ms;Bedrock约为75 ms――这个差距不是AWS 失败 它是容量模型差异――Azure 销售PTU (提供吞吐量单位),为您的租户 预留GPU 容量――Bedrock的等价格(提供吞吐量) 也存在,但每单位 起价约21美元/小时,大多数共享客户仍然停留在按需的位置――

如果您的产品SLA是PTFT <100 ms在P99,那么您要么购买Azure上 PTU,要么购买Bedrock提供吞吐量,要么接受默认波动――

### 提供产量 经济性

 Azure PTU:一块预留的推断计算――对于可预测工作负载,相比上需最高可节省约70%――成本按小时固定,与流量无关  即使是空也需要为预订付费――断裂-即使通常在40%60%持续使用左右――

根据模型和地区,每小时 $21-$平均水平大约在峰值利用的一半.

根据双子座 SKU 销售;价格因模型和地区而异,公开宣传更少──

### 终点界面  真正的差异化因素

**Bedrock Application Inference Profiles**是市场中最干净的归因.`team`,我知道.`product`,我知道.`feature`标记配置文件;让所有模型调用都通过它;CloudWatch 无需后处理即可按配置文件 拆分成本――它在2025年新增,仍然是最细分的超级尺度原生能力――

**Vertex**归因是项目-每组加标签-无处不在.你把每个团队建模为一个GCP项目,在每个资源上打标签,并使用BigQuery 支付出口+数据研究室做滚动.工作更多,但BigQuery 让你对成本数据执行任意SQL.

**Azure**根据订阅/资源组范围加标签,并把PTU预订作为等成本对象.

模式是:Bedrock 原生最干净,Vertex 通过BigQuery 最灵活,Azure 最不透明,除非你做仪器.

### 锁定是2026年风险

作为一个模型的主导,单个超级级承诺也可以接受.2026年,前沿每月都在移动.

有效团队采用的模式是:对任何产品关键的LLM调用,至少使用两个提供商的最低点.Bedrock加Azure OpenAI是常见组合.从一个平台拿到Claude,从另一个平台拿到GPT,在它们之间发生故障,使用相同的门户.成本上升可以忽略,因为门户将做出最佳路由;在停机期间,如Azure OpenAI2025年1月事件,AWS us-east-1停机),可用性升级是决定性的.

### 数据居住,BAA和受监管行业

岩:大多数地区提供BAA;VPC终点;护卫.
 Azure OpenAI:HIPAA、SOC 2、ISO 27001;欧盟数据居住权;企业受监管场景的默认选项──
基于区域的数据居住;Google云的合规性堆.

三者都满足基础检查框――差异在于数据保留政策,记录 如何处理,以及滥用监测 是否读取你的流量

### 你应该记住的数字

- 在Llama 3.1 405B等效场景下,Azure OpenAI的中位数是TTFT:~50ms (使用PTU) ⋅
- 按需床 中位 TTFT:~75 ms──
- 床提供的输出量:每单位$21-$时间50小时
- 光电源平衡率:~40%-60%持续使用量──
- 低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率,低利用率.


```figure
i4-platform-lanes
```

## 使用它
`code/main.py`通过一个合成工作负载上比较这三个平台 它建模在需求上与PTU 经济性,TTFT差异和成本归因忠诚性.

## 交付它
本课会生成`outputs/skill-managed-platform-picker.md`△给定工作负载配置文件, 需要模型,TTFT SLA,每日量,合规要求, 则会推主要平台, 倒退以及FinOps仪器计划.

## 练习
1. 运行`code/main.py`△对于70B类型模型,Azure PTU 在什么持续利用下优于需求计算破平,并与宣称的40-60% 区间比较.
2. 你的产品需要Claude3.7 Sonnet和GPT-4o. 设计一个两个供应商的部署.
3. 一位受监管的医疗保健 客户要求BAAs、美国东部数据居住和以下100ms P99 TTFT──选择一个平台,并使用三个具体功能来论证──
4. 你发现本月的Bedrock账单在没有流量变化的情况下上了4倍.没有应用推理资料,你会如何找到罪祸首?
5. 阅读Azure OpenAI 和Bedrock定价页面──对于100M代币/月的Claud工作负载,哪个更便宜?

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
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)权威率卡和提供通量定价.
- [Azure OpenAI Service Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) PTU经济和利率卡
- [Vertex AI Generative AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)双子级和模型园的补贴费.
- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai/) 跨供应商持续延迟和吞吐量基准.
- [The AI Journal — AWS Bedrock vs Azure OpenAI CTO Guide 2026](https://theaijournal.co/2026/03/aws-bedrock-vs-azure-openai/)企业决策框架――
- [Finout — Bedrock vs Vertex vs Azure FinOps](https://www.finout.io/blog/bedrock-vs.-vertex-vs.-azure-cognitive-a-finops-comparison-for-ai-spend)配属机制,一边一边.
