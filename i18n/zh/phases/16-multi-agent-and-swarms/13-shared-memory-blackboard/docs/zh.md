# 共享内存和黑板模式

> 2026年多代理系统中存在两种方法:**message pool**(所有人都可以看到所有人的消息,如AutoGen GroupChat或MetaGPT) 和**带 subscription 的 blackboard**它们都是多代理系统中的唯一状态部分. 这意味着有趣的错误也藏在其中.**memory poisoning**另一种代理把它当作已验证的内容,准确性逐渐衰退,而且这种衰退比即刻崩更难调试. 本课程将使用stdlib 构建这两种结构,注入一次毒性攻击,并展示三种真正有效的缓解措施在生产中.

**类型：**学习+建设
**语言：**鱼,鱼,鱼,鱼,鱼,鱼,鱼,鱼,鱼,鱼`threading`)
**先修：**16阶段 · 04期 (原始模式),16期 (09期)
**时间：**约75分钟

## 问题

多代理系统需要一个地方让代理共享事实. 一面上的选项是把所有内容都通过传递信息,但这相当于使用额外复制重新发明共享状态.

当其中一个代理产生幻觉并把幻觉写入共享状态时,之后每个读取该状态下游代理都将这种幻觉视为事实.

这就是记忆中毒. 它是MAST类别. 凯姆里等人, arXiv:2503.13657) 中第二多被记录的故障家族,而且它是结构性的:任何没有来源和不可写的验证器的共享记忆设计,最终都会表现出这个问题.

## 概念

### 两种主要拓

**Full message pool。**每个代理人 读取每条消息. 自动生成群Chat 和 MetaGPT 使用这种方式. 简单,透明,可检查,但不能扩展到超过10个代理人,因为每个代理的上下文都会被其他代理人的工作填满.

```
agent-A ──write──▶ ┌────────────────┐ ◀──read── agent-D
                   │ message pool   │
agent-B ──write──▶ │                │ ◀──read── agent-E
                   │ (global log)   │
agent-C ──write──▶ └────────────────┘ ◀──read── agent-F
```

**带 subscription 的 Blackboard。**代理声明自己感兴趣的主题;底层基板只路由相关消息;;CA-MCP(arXiv:2601.11595) 和矩阵分散框架;;arXiv:2511.21686) 使用这种方式──扩展性更强,但需要预先设计方案,才能让订阅有意义──

```
                   ┌─ topic: prices ──┐
agent-A ──pub────▶ │                  │ ──▶ agent-D (subscribed)
                   ├─ topic: orders ──┤
agent-B ──pub────▶ │                  │ ──▶ agent-E (subscribed)
                   ├─ topic: alerts ──┤
agent-C ──pub────▶ │                  │ ──▶ agent-F (subscribed)
                   └──────────────────┘
```

### 适合自己的场景

- **Full pool**适合代理 数量少 ((< 10) 角色异构、对话是短周期的情况――当所有人都能看到所有内容时,推理谁说什么非常直接――
- **Blackboard**适合代理 数量多、角色同质但实例众多(群) 、对话长期运行情况――路由 能节省代币 成本并减少上下文污染――

生产系统通常混合使用:顶部使用一个小型的全池 (规划层),下方使用黑板 (工人层) 〔

### 一个记忆中毒场景

三个代理 执行一个研究任务――Agent A 是检索代理――Agent B 是总结者――Agent C 是分析师――

1. 获取一个页面,并向共享状态写入消息:研究报告了 42% 的精度改善.
2. 实际上,获取的页面是4.2%的改善.
3. 读取共享状态后写入:报告的准确度增加了42% (来源:A).
4. 读取共享状态后写入:推采用  42%升高是变革性的.
5. 最终报告引用了从未存在过的42%的数字.

没有代理 崩──没有测试失败──系统 工作正常──这个幻觉通过共享状态,从一个代理的上下文进入每个下游代理的推理中──

### 为什么这是结构性问题

没有共享状态时,Agent A 的幻觉会留在A 的上下文中. 下游 Agent 会重新获取或重新推导,可能会发现错误.

问题不是共享状态本身,而是共享状态.**没有 provenance，也没有独立 verifier**△三种缓解措施可以解决这个问题:

1. **每次写入都标注 provenance。**共有状态中的每一个报名都记录着谁写入,何时写入,在什么提示下写入以及如适用) 代理引用了什么来源.
2. **对写入做 versioning；把它们视为 append-only。**修正是一个新的入口,用来取代旧入口,而不是原地更新.
3. **至少保留一个无法写入共享状态的 Agent。**仅读的验证器代理抽样输入,重新获取来源,并标记不一致.

### 黑板 先例 (Hayes-Roth,1985)

黑板模式比LLM代理早已四十年.Hayes-Roth (1985,A Blackboard Architecture for Control) 描述专家知识来源:它们观察一个全局黑板,贡献部分解决方案,并触发其他来源.

### 投影与全景

纯黑板会给每个用户同样的投影,按主题限制.**per-agent projection**根据其角色定制的视图,每个代理都得到了一个视图. 长度图的状态减小器是2026年规范实现的.

无方案时,你会在每个代理的提示中重建一个临时投影.

### 内容写入模式

许多代理同时写入一个同步问题,不仅仅是LLM问题.

- **Sequential writer（single producer）。**所有的写入都是通过一个协调员代理 串行化.
- **带 versioning 的 optimistic concurrency。**每个报道都有版本;作者在版本不匹配时失败并重试.
- **Topic partitioning。**不同的代理 拥有不同的主题.没有跨主题争议.需要设计好的分区界限.

大多数人认为,在2026年,使用序列写作,因为LLM调用足够慢,使争议很少见,而瓶影响不大.

### 不可写的验证器

最关键的缓解措施是仅阅读验证器.

- 验证器与团队共享状态 (读取黑板或池)
- 验证器 没有共享状态的写字手柄 只能写入单独的验证频道──
- 证实者 独立获取写 中引用的来源──标记分歧──
- 验证者 自己的输出被路由给人类或单独的决策代理,绝不反回池.

没有这种隔离,验证器的输出会成为池中的新入口,这意味着被毒害的池会毒害验证器,而验证器也会毒害自己的验证.


```figure
swarm-blackboard
```

## 构建它

`code/main.py`通过Python实现了两种扩张,以及一个玩具毒害攻击和三种缓解措施.

- `MessagePool` 线程安全的附录记录,支持完整阅读.
- `Blackboard` 按主题关键的酒吧/子,支持每位代理订阅.
- `ProvenanceEntry` 每次写入都记录 (作者,时间印记,即时语,来源)
- `PoisoningScenario`运行一个三 代理研究任务,其中的代理 A 幻觉出小数点――印最终报告――
- `Verifier` 一个只读的代理,会重新获取来源并标记不一致.

运行:

```
python3 code/main.py
```

预期输出:
- 运行1(没有验证器): 幻觉的42% 会传播到最终报告.
- 运行 2(有验证器):验证器 标记不一致,池被标记为 标志,最终报告包含撤销

## 使用它

`outputs/skill-memory-auditor.md`是一种技能,用于审计任何多代理系统的共享内存设计,检查来源,版本和验证器分离.

## 发布它

对于任何共享记忆设计:

- 每次写入都记录来源:`(writer, timestamp, prompt_hash, tool_calls_cited, source_uri)`,我知道.
- 让日志保持仅附加.
- 部署至少一个具有独立的源访问的仅读验证代理.
- 将验证器输出通过单独频道,而不是回到共享池.
- 记录乱在写作中比例  比如上升是幻觉模式的早期证据.

## 练习

1. 运行`code/main.py`确认一场会传播幻觉,而二场会捕获它.
2. 添加第二个幻觉:B代理编制一个数据集尺寸.
3. 将全池切换为带主题分区(`prices`,我知道.`summaries`,我知道.`analyses`问题分区会让哪些毒性情况更难实施,又对哪些没有帮助?
4. 阅读Hayes-Roth(1985,A Blackboard Architecture for Control) .
5. 阅读CA-MCP(arXiv:2601.11595) 』将其共享文本商店 映射到`code/main.py`中的消息池或黑板类.CA-MCP在其上额外增加了哪些原始?

## 关键术语

| Term | 人们怎么说 | 它实际意味着什么 |
|------|----------------|------------------------|
| Message pool | “Shared chat history” | 每个 Agent 都会读取的 append-only log。完全透明，但扩展性差。 |
| Blackboard | “Shared workspace” | 按 topic keyed 的 pub/sub。Agent 订阅相关 topics。扩展更远。 |
| Provenance | “谁写了什么” | 每次写入的 metadata：writer、timestamp、prompt、sources。 |
| Memory poisoning | “幻觉在扩散” | 一个 Agent 的错误进入共享状态，下游 Agent 将其当作事实。 |
| Append-only | “没有原地更新” | Corrections 是用来 supersede 的新 entries。保留 audit trail。 |
| Unwritable verifier | “Independent auditor” | read-only Agent，会重新获取 sources 并标记不一致。 |
| Projection | “Scoped view” | 从 global state 计算出的 per-agent view。LangGraph reducers 是规范案例。 |
| Knowledge Source | “Specialist agent” | Hayes-Roth 在 1985 年对 blackboard participant 的称呼。 |

## 延伸阅读

- [Cemri et al. — Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/abs/2503.13657) MAST类别;记忆中毒是协调失败的一个子家族
- [CA-MCP — Context-Aware Multi-Server MCP](https://arxiv.org/abs/2601.11595) 用于协调MCP服务器的共享文本存储
- [Matrix — decentralized multi-agent framework](https://arxiv.org/abs/2511.21686) 基于消息队列的黑板,没有中央管弦乐器
- [LangGraph state and reducers](https://docs.langchain.com/oss/python/langgraph/workflows-agents) 生产中的每剂投影模式
- [Anthropic — How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system)生产部的来源和验证说明
