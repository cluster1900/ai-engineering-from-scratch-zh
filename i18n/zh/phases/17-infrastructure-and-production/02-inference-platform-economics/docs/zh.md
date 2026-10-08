# 推理平台经济学 烟花、一起、巴塞顿、模特、复制、尺度

> 2026年推断 市场不再只是GPU 时间租. 它分为定制 (Groq、Cerebras、SambaNova) 格PU平台.$1/hr，而 $4B 估值和每天10T+代币的处理量说明了基于数量的模型是可行的.$5B 估值完成了 $300M 系列E──竞争定位规则很简单:火灾 优化延迟,一起 优化目录宽度,基板 优化企业抛光,模拟 优化Python原生DX,复制 优化多模达达,Anyscale 优化分布式Python──本课会给你一个可以直接交给创始人的矩阵──

**Type:** Learn
**Languages:** Python (stdlib, toy per-call economics comparator)
**前置要求:**第17期 (管理的LLM平台),第17期 (vLLM服务内部)
**Time:** ~60 minutes

## 学习目标
- 通过将每个供应商映射到一个市场部分,
- 解释为什么"每代币"API定价模型会向服务引擎的成本曲线收,而不是向硬件的成本曲线收.
- 计算至少三个供应商的每次请求有效成本,并解释什么时候每分钟 (Baseten、Modal) 胜过每代币――
- 识别给定工作负载的正确默认平台(无服务器爆裂、稳定高吞吐量、精细调节的变体、多模) ⋅

## 问题
你已经评估了托管式超级级平台――你决定需要一个更窄的供应商:火灾用在延迟,一起用在宽度,Baseten用在精细调节的定制模型――现在你有六个真实选择,而价格页面并非一致――火灾显示$/M tokens；Baseten 显示 $时间: 时钟$/second；Replicate 显示 $没有工作负载,你无法对付它们.

更糟糕的是,每个定价页面的商业模式都不同. 火车在共享GPU上运行自己的定制引擎. 火注意力. 每个代币的速度反映了它们的利用率曲线.

这本课程将对这六个平台进行构建,并告诉你它们在什么时候才能成功.

## 概念
### 三个部分

**Custom silicon** Groq(LPU)、Cerebras(WSE)、SambaNova(RDU)。 在同一模型上,解码通常比基于GPU的集群快 5-10x──每代币价格更高(2025年末 Groq 在Llama-70B 上约为 ~0.99$/M),但对于延迟敏感的使用案例而言,无可匹敌──Groq是语音代理和实时翻译的生产环境的选择──

**GPU platforms** 基板、一起、火灾、Modal、Anyscale──运行在NVIDIA(2026年为H100、H200、B200) 或有时运行在AMD上──它们位于"原料GPU租"(RunPod、Lambda) 和"超级级管理服务"(Bedrock) 之间的经济层──

**API-first marketplaces**复制、深度信息、开路由器、故障──广泛目录,预测付款或秒付,强调时间到第一次电话──

### 烟花 延迟优化的GPU平台

- 服务服务的延迟比VLLM低4倍.
- 批量级约为50%的无服务器率,用于非互动工作负载.
- 提供服务的率与基本模式相比,这是对您的LoRA加收费提供商的真正差异.
- 2026年中:自2026年5月1日起按需GPU租提高1美元/小时――规模化时可协商量价――
- 财务信号:$4B 估值,每天处理10T+代币.

###  宽度优化

- 200多种模型,包括上线开源版本在发布后几天.
- 在等效的LLM模型上比复制便宜50%70%;"AI原生云"定位的核心是卷和目录.
- 导读+调整+训练都在一个API中.

###  企业-波兰-优化

- 托斯框架:将依赖性,秘密,服务配置放在一个表格中进行模型包装.
- GPU 范围从T4到B200──每分钟的发票,并提供合理的冷启动减缓──
- 常见于金融科技和医疗保健选择
- $5B 估值，2026 年 1 月 Series E（来自 CapitalG、IVP、NVIDIA 的 $水,水

### 模拟  字符串原生优化

- 纯Python的基础设施作为代码.`@modal.function(gpu="A100")`装饰一个功能,然后使用一个命令部署.
- 每秒的发票量――预热时冷开始为 2-4s;小模型低于 1s――
- $87M Series B，估值 $开发人员经验在独立调查中得分最高.

### 复制 多模宽度

- 预测费用:图片,视频和音频模型
- 集成生态系统 (Zapier、Vercel、CMS插件)
- 在LLM每代币率上竞争力较弱,但胜在多模式的多样性.

### 任何规模的射线原生

- 构建在Ray 上;RayTurbo是任何规模的专有推断引擎.
- 最适合分布式Python工作负载,其中推断步骤是更大图中一个节点──
- 管理射线集群;与射线空气和射线服务深度集成──

### 每个标记与每分钟分别在什么时候胜出

当工作负载对延迟不敏感且爆发时,每代币是合理的,因为你只为实际使用付费.当使用率高且可预测时,每分钟是合理的,因为一旦你让GPU 和,就会赢得每代币.

粗略规则:当工作负载高于专用GPU 持续利用率约30%时,每分钟 (Baseten、Modal) 开始胜过每代币 (Fireworks、Together) .

### 定制发动机是真正的沟

根据VLLM和SGLang的每一个平台都声称拥有自定义引擎――FireAttention、RayTurbo、Baseten的推理堆──自定义引擎声称带有营销色彩;更诚实的表述是,VLLM+SGLang 代表了大约80%的生产级开源推理,而平台层的差异是DX、attribution和SLAs──

### 你应该记住的数字

- 烟花GPU租:自2026年5月1日起提高1美元/小时.
- 烟花声称:在等效配置上的延迟比vLLM低4x.
- 合同:在LLM上比重 便宜50-70%──
- 基质估值:$5B（Series E，2026 年 1 月，$周围300米) 
- 资金估值:1.1亿美元 (B系列,2025)
- 每分钟在高于 ~ 30% 持续利用率时胜过每代币.


```figure
cost-per-token
```

## 使用它
`code/main.py`在一个合成工作负载上跨价格模型比较六家供应商报告.$/day 和 effective $运行它来找出每代币和每分钟的差距.

## 交付它
本课会生成`outputs/skill-inference-platform-picker.md`△给定工作负载配置,SLA 和预算,选择主要推断平台,并给出下位.

## 练习
1. 运行`code/main.py`△对于一块H100上70B模型,在什么持续利用率下 Baseten(每分钟) 将胜过烟花(每代币)?自己推推广跨越,并与经验法则对比.
2. 你的产品提供图像生成,聊天和语音到文字.
3. 烟花将提高您的首要模型价格1美元/小时. 如果40%的流量转移到批量层面,
4. 一个受监管客户要求SOC 2类型II+HIPAA+专用GPU──哪三个平台可行,哪一个在FinOps上胜出?
5. 根据要求,Basen专用和复制API 上 Llama 3.1 70B 每1000个预测的成本. 每天10个预测时哪个最便宜?10,000个时呢?

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
- [Fireworks Pricing](https://fireworks.ai/pricing)每代币的价格,批次级别,GPU租.
- [Baseten Pricing](https://www.baseten.co/pricing/)每分钟的利率,承诺能力,企业层次.
- [Modal Pricing](https://modal.com/pricing)每秒GPU速度和自由层次.
- [Together AI Pricing](https://www.together.ai/pricing)模型目录和每代币率――
- [Anyscale Pricing](https://www.anyscale.com/pricing)雷土博和管理雷价格.
- [Northflank — Fireworks AI Alternatives](https://northflank.com/blog/7-best-fireworks-ai-alternatives-for-inference)比较评估――
- [Infrabase — AI Inference API Providers 2026](https://infrabase.ai/blog/ai-inference-api-providers-compared)供应商景观──
