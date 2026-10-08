# 模式路由 作为降低成本的基础手段

> 一个动态经纪人会评估每个请求(任务类型、代码长度、嵌入式相似性、信心),并把简单的查询 发送给便宜的模型,把复杂的查询 升级到边境模型──也称为模型化──生产案例研究显示,在美国/英国/欧盟部署中,ISO质量下成本可降低20-60%;在高流量SaaS上,30%的路由效率提高 会转化为六位数年度节点──2026年背景是LLM 价格每年下调约10倍:从2022年末到2026年,GPT-4级代币从$20/M 降到约 $由于这种情况,路由是你在不造成产品回归的情况下,把这种价格下降转化为边际的方法.

**Type:** Learn
**Languages:** Python (stdlib, toy cascading router simulator)
**前置要求：**第17期 · 01期 (管理的法定管理平台),第17期 · 19期 (AI门户)
**Time:** ~60 分钟

## 学习目标

- 解释模型级:低价,首先是信任检查,低信心时升级.
- 枚举四个路由信号(任务分类、即时长度、嵌入式类似于已知硬组、第一通过的自信)
- 在目标路由分区和质量损失耐受性下计算预期混合成本.
- 如何捕捉低成本模型的漂移监测量量

## 问题

你的分析显示70%的查询很简单:"巴黎有什么时候?" "重写这个句子".海库类模型可以以3%的成本完美处理这些──30% 需要GPT-5的推理:编码,数学,多步骤规划──

如果你把70%的路线送到便宜的模型,把30%的路线送到昂贵的模型,在同一产品质量下,你的账单会下降约65%──这是路线的原因──难点是不让质量回归的情况下构建经纪人──

## 概念

### 四个路由信号

1. **Task classification**简单/复杂/代码/数学/聊天――可以是基于规则的分类器、小型LLM ((海库类,0.25美元/M),或到标签的桶的嵌入式相似性──输出:路线 =便宜 /平衡 /边界──

2. **Prompt length**提示:通常需要边界保持一致性.

3. **Embedding similarity to known-hard set**如果查询接近某个已知硬桶,直接升级到边境.

4. **Self-confidence from first-pass**发送给便宜;如果模型的日志测试显示信心低,或者它拒绝,或者输出对冲语言,就在边境上再试.

### 三种模式

**Pre-route**预置分类器:增加约5-10ms的延迟;整体最快──

**Cascade**(廉价第一,信心低时升级):中等延迟约1.2x(廉价运行加验证),升级约2x──质量地板 最好──

**Ensemble route**(对样本并行运行便宜 和边界,由奖励模型选择):质量最高,成本最高;仅用于关键A/B──

### 实现

技术的关口 (AI gateways)  (第17阶段) 暴露路由`router`配置──Portkey 有保护者+路由──Kong AI Gateway 有基于插件的路由──OpenRouter的模型市场 暴露建议 API──

开源:路线LLM (LMSYS) ‧非钻石 (商业) ‧快速子──

### 价格曲线

| Model class | 2022 年末 | 2026 | 变化 |
|-------------|-----------|------|--------|
| GPT-4-level quality | ~$20/M | ~$0.40/M | 便宜 50x |
| Frontier (GPT-5, Claude 4) | — | ~$3-10/M | 新 tier |

大部分的改善来自服务效率,即17期·04-09中核心课程转化为供应商侧的成本下降.

### 漂移才是真正风险

你的路线 把40% 发送给廉价的模型――六个月后,任务分配发生变化――用户更熟练,问题更长――路由器没有注意到,因为它的分类是基于Q1数据的训练――质量下降――没有人发出足够强烈的投诉――你在竞争对手基准中才发现自己输了――

通过在线质量指标对路线设门:

- 每条路线的用户指上/指下.
- 每条路上对持久的样本 (5%) 做自动的LLM法官.
- 升级率:如果升率超过30%,说明廉价模型过度路线.
- 每条路线的拒绝率

### 你应该记住的数字

- 2026年单独质量 下路由节省:案例研究为20-60%.
- 士学位学历价格下降2022-2026:总额约每年10倍
- 基质质质量测试 (GPT) -4级2022年与2026年:~$20/M → ~$子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子,子
- 落延迟影响:平均约1.2倍,升级约2倍 (约10%的流量)


```figure
model-cascade-router
```

## 使用它

`code/main.py`报告成本,质量损失和升级率的混合性.

## 交付它

本课会产出 `outputs/skill-router-plan.md`△给定工作负载和质量预算,选择路由模式和信号.

## 练习

1. 运行`code/main.py`在什么精度地板下,落会胜过前路?
2. 你的用户群是30%的企业问题,70%的免费层次,
3. 某条航线 让质量下降2%,但节省40%──是否应该运输?
4. 使用OpenAI/人类API的记录检查 实现信任检查.
5. 六个月内,升级率从8%上升到22%.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Model routing | "cost broker" | 每个 request 动态选择 model |
| Model cascade | "cheap-first escalate" | 先运行 cheap，low confidence 时 fall through 到 frontier |
| Pre-route | "classify first" | 前置 classifier；不重新运行 |
| Ensemble route | "parallel pick" | 运行多个，由 reward-model 选最佳 |
| Escalation rate | "uprouted %" | cascade requests 中被 escalated 的比例 |
| RouteLLM | "LMSYS router" | OSS router library |
| Not Diamond | "commercial router" | SaaS model-routing product |
| Drift | "cheap creep" | distribution shift 发生但 router 没注意到 |
| Online quality gate | "live check" | 对 live traffic 采样做 automated LLM-judge |

## 延伸阅读

- [AbhyashSuchi — Model Routing LLM 2026 最佳实践](https://abhyashsuchi.in/model-routing-llm-2026-best-practices/)
- [Lukas Brunner — Rise of Inference Optimization 2026](https://dev.to/lukas_brunner/the-rise-of-inference-optimization-the-real-llm-infra-trend-shaping-2026-4e4o)
- [RouteLLM paper / code](https://github.com/lm-sys/RouteLLM)
- [Not Diamond — model routing](https://www.notdiamond.ai/)
- [OpenRouter](https://openrouter.ai/)带路由原始人的多个模型门户──
