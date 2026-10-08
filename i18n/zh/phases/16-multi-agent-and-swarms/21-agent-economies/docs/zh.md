# 经济 标 激励 声誉

> 长周期自主代理人 (METR的1小时到8小时工作曲线) 需要经济代理能力――新兴的**5-layer stack**是:**DePIN**物理计算**Identity**其他国家:**Cognition**(RAG + MCP) →**Settlement**(账户摘要) →**Governance**网络包括生产级代理激励**Bittensor**(TAO子网络奖励任务特定模型)**Fetch.ai / ASI Alliance**(ASI-1 迷你法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法学法) 和**Gonka**(基于变压器的PoW,将计算重新分配到有生产价值的AI任务)**Shapley-value credit attribution**为了公平奖励有贡献的代理人;谷歌研究的大型语言模型机制设计 提出在单调的集结下采用二价付款的**token auctions**△本课会构建一个最小代理市场,将Shapley值信用归因应用于多代理管道,并运行第二价代币拍卖,让游戏理论 机制具体落地──

**Type:** Learn
**Languages:** Python (stdlib)
**前置要求：**16期 · 16期(谈判和谈判),16期 · 09期
**Time:** ~75 分钟

## 问题
当代理人共同创造价值但又需要分别奖励时,多代理系统会变得复杂. 经典机制,如平均分配,最后贡献者拿走全部,不公平,容易被操纵. 通过Shapley价值观,进行基于联盟的奖励,在构建上是公平的,但计算成本很高. 2025-2026年的文献推动了实用近似:Shapley样本采集,单调集成拍卖,以及从已确认的贡献中积累的链上声誉.

除了信用归因之外,该领域已经转向了真正的经济代理:Bittensor TAO 奖励采矿计算,以调整细节子网特定模型;Fetch.ai/ASI使用FET代币 奖励ASI-1迷你LLM使用;Gonka将转化证明工作重分配到有生产价值的AI 任务.

本课把代理经济视为一个具体的问题:信用归因,机制设计和声誉,并使用最小的数学构建每个部分,让概念真正留下来.

## 概念
### 五层代理经济堆

1. **DePIN（physical compute）。**为了利用GPU,存储,宽带,比特ensor子网络,Render Network,Akash,它不专属代理人,代理人使用它.
2. **Identity。**据W3C分散识别器 (DID) 给每个代理一个不依赖任何平台的持久识别器.
3. **Cognition。**机关的推理循环:LLM + RAG + MCP──这是其他阶段的构建内容──
4. **Settlement。**让代理人可以从自己的余额支付天然气,而不必持有ETH.
5. **Governance。**代理DAO:由人类和代理人共同对待协议变化 投票的治理结构,投票权与声誉绑定.

不是每个生产系统都会使用全部五层――Bittensor 使用第1、2层,部分使用第3、4层,不使用第5层――OpenAI代理除了第三层外都不使用――这个堆是参考地图,不是必需条件――

### ,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,

**Bittensor（TAO）。**矿工们提交模型输出;对它们排列进行验证;分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分分

**Fetch.ai / ASI Alliance。**网上运行;用户使用FET代币支付推断费用――这里代理人作为同行的故事更强:Fetch 上一个代理人可以调用另一个代理人完成任务,并使用FET 付款――

**Gonka。**变压器证明工作:工作是变压器的前进通行.通过运行具有已知正确输出 (来自训练数据) 的推断任务,

截至2026年4月,这些三者都是生产级的回报分配方式不同. 根据子网验证者的相对质量奖励; 根据付费用户测量的实用性奖励; 根据Gonka 奖励可验证的推断工作.

### 石灰值信用归因

三个代理合作完成任务. 输出分数0.8... 谁贡献了多少?

布利值:满足四个公理 (效率,对称性,线性,零) 的唯一信用分配.`i`其他:

```
shapley(i) = (1/N!) * sum over all orderings O of (v(S_i_O ∪ {i}) - v(S_i_O))
```

其中`S_i_O`是排序`O`中位于`i`之前的代理 集合──实践中:枚举所有变量,记录每个代理 在每个变量中边际贡献,然后取平均──

对于N=3个代理,有6个变量.对于N=10,有3.6M个,所以实践中会对命令采样而不是枚举.

### 用于集成的二价拍卖

谷歌研究 () 设计大型语言模型的机制) 提出使用二价代币拍卖来聚合LLM产品的出口量设置:N 个代理人自行提出一个完成;每个代理人对被选者有一个私人价值标商选择最高价值的提案,并支付 *第二高*的价值.在单调的汇总下,价值取决于哪个提案被选中,而不是有多少报价),这是真实的,代理人会报道自己的真实价值.

这对LLM系统很重要:你可以把完成任务包装给多个不同的代理人;拍卖选择最佳方案并公平付款,代理人没有报错的激励.

### 声誉资本

绑定 DID 的声誉分数 从已确认贡献中累积――一个简单更新规则:

```
rep(i, t+1) = alpha * rep(i, t) + (1 - alpha) * contribution_quality(i, t)
```

其中的衰变因素`alpha`接近 1 ・ 声誉:

- 对于路由决策来说读取成本低把困难任务发送给高代表代理)
- 假造成本高(随时间累积,绑定 DID)
- 没有通过验证的贡献会扣分.

### 亚马斯2025 去中心化拉马斯

拉马斯 提案(阿马斯 2025) 结合了:DID身份,Shapley值信用归因和一个简单的拍卖机制.

### 经济机制将在哪里崩

- **Price oracle manipulation。**如果信用功能可以被操纵,代理人就会操纵它.
- **Sybil attacks。**一个运营商启动了N个假代理来提高自己的贡献――DID会减缓但无法阻止这种行为;缓解手段是声誉成本.
- **Verification cost。**如果验证便宜,它可能被操纵;如果昂贵,系统就无法扩展.
- **Regulatory overhang。**截至2026年,Bittensor、Fetch 和 Gonka 在一些司法管辖区都处于法律灰色地带.

### 什么时候代理经济 有意义

- **具有异构 operators 的开放网络。**没有单一团队控制所有代理人.
- **可验证输出。**没有验证,信用归因,只是猜测.
- **Long-horizon workflows。**一次性任务不能从声誉积累中受益.
- **Tokenized payments 在你的司法辖区合法可行。**

在封闭企业系统中,经济机制将使更简单的分配方式存在.


```figure
swarm-auction
```

## 构建它
`code/main.py`实现:

- `shapley(value_fn, agents)`通过枚举为小N精确计算Shapley。
- `second_price_auction(bids)` 真实机制; 赢家支付第二最高的――
- `Reputation` 绑定了DID、带有指数式衰退和削减的声誉.
- 演示1:三个代理 协作,精确的莎普利 归因信用.
- 演示 2:五个代理 为一个任务插槽 出价;第二价拍卖 选择赢家 + 付款――
- 测试 3:100 轮任务分配给具有不同构成的代理;重复路由优于随机.

运行:

```
python3 code/main.py
```

预期输出:每个代理的Shapley值;展示真实竞价平衡的拍卖结果;展示加热后重复路由 相比随机有 10-20%的质量增长──

## 使用它
`outputs/skill-economy-designer.md`设计一个最小代理经济:身份层 选择,信用归属机制,支付机制,声誉规则

## 交付它
在2026年运行代理经济:

- **从 reputation 开始，而不是 tokens。**声誉 实现成本低,单独有价值;代币将增加法律和经济复杂性.
- **奖励前先验证。**没有独立验证的步骤,不要分配信用.
- **使用 Shapley-sample，而不是 Shapley-exact。**采样 100-1000个订单;精确枚举无法扩展.
- **限制 decay factor，并设置 reputation floor。**无界衰退会抹去合法贡献者;过慢衰退会奖励过往的高代表代理人――
- **以 adversarial 方式审计机制。**在开放网络前运行红队场景――每个机制都有游戏理论;你需要找到漏洞,而不是像攻击者找到――

## 练习
1. 运行`code/main.py`△确认Shapley值之和等于总值 (效率定理) ・修改值函数;Shapley分配是否按预期方向变化?
2. 实现Shapley *样本*(在K 个命令上蒙特卡罗) ――K 如何影响近似准确性?与N=4的确切结果比较──
3. 在拍卖前实现联盟形成步骤:代理人可以合并成团队并作为一个单位出价.
4. 阅读Google研究的机制设计文章. 找出一旦违反,会破坏真相的假设. 在LLM场景中,这种失败模式是什么样子?
5. 阅读AAMAS 2025 去中心化LAMAS论文. 在一个合成任务上,上为10个代理人实现其中的Shapley步骤.

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| DePIN | “Decentralized physical infrastructure” | Token-incentivized compute/storage/bandwidth。Bittensor、Akash、Render。 |
| DID | “Decentralized identifier” | 用于 portable IDs 的 W3C spec。Agent reputation 绑定到 DID，而不是平台。 |
| ERC-4337 | “Account abstraction” | 可以 sponsor gas 的 contract accounts，从而支持 agent payments。 |
| Shapley value | “Fair credit attribution” | 满足 efficiency、symmetry、linearity、null 的唯一 allocation。 |
| Second-price auction | “Vickrey auction” | 真实机制：winner 支付 second-highest bid。与 monotone aggregation 兼容。 |
| Reputation capital | “Accumulated quality score” | 来自已确认贡献、绑定 DID 的 score；会随时间 decay。 |
| Agentic DAO | “Agents + humans govern” | 把 agent voters 作为 first-class、投票权绑定 reputation 的 DAO。 |
| TAO / FET / GPU credits | “Token denominations” | Bittensor TAO、Fetch.ai FET、各种 DePIN tokens。 |

## 延伸阅读
- [The Agent Economy](https://arxiv.org/abs/2602.14219) 2026年关于5层代理经济堆的综述
- [Google Research — Mechanism design for large language models](https://research.google/blog/mechanism-design-for-large-language-models/) 带单调的汇集的代币拍卖
- [AAMAS 2025 — decentralized LaMAS](https://www.ifaamas.org/Proceedings/aamas2025/pdfs/p2896.pdf) 石灰值信用归类
- [Bittensor TAO documentation](https://docs.bittensor.com/)子网结构和奖励分布
- [Fetch.ai / ASI Alliance](https://fetch.ai/)ASI-1迷你法学和FET代币
- [W3C Decentralized Identifiers (DIDs) spec](https://www.w3.org/TR/did-core/)身份基础
