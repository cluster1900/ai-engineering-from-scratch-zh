# 国际语音协会 (FIPA-ACL) 与演讲法案的传承

> 在MCP之前,在A2A之前,有了FIPA-ACL.2000年,IEEE智能物理代理基金会批准了一种代理通信语言,其中包含20种执行语言.两种内容语言,以及一组互动协议:合同网网,订阅/通知,请求什么时候.它因此从工业界淡出,因为ontology开销对网络来说太沉重,但LLM推动的多代理系统复制,正在重新实现思想,只是没有正式的语义:JSON合同取代执行,自然语言取代ontologies.本课会认真阅读FIPA-ACL,让你清晰看2026年的协议决策中,一些是重新发明,哪些是真正的,以及哪些新浪潮在2000年已经重新发现的问题.

**Type:** 学习
**Languages:** Python (stdlib)
**Prerequisites:** Phase 16 · 01（Why Multi-Agent）
**Time:** ~60 分钟

## 问题

2026年代理协议领域非常拥挤:用于工具的MCP,用于代理的A2A,用于企业审计的ACP,用于去中心化信任的ANP,用于自然语言内容的NLIP,再加上CA-MCP和二十多项研究建议.

诚实地看,其中大多数都在重新发现一个非常具体的、已经有二十年历史的决策树──奥斯 (1962年) 和塞尔 (Searle) (1969) 的言论行为理论给了我们表现是行动──KQML (1993) 将其变成了线程协议──FIPA-ACL (2000年批准) 给了参考级标准化:二十个执行语言──SL0/SL1,以及用于合同网络和订阅通知的交互协议──JADE 和 JACK 是Java 参考平台──这个努力在2010年后淡淡出,因为ontology 开销太重,而Web正在赢得主导地位──

当你看到MCP的`tools/call`、A2A的任务生命周期,或者CA-MCP的共享环境存储,你会看到 FIPA 决策的更柔和的 JSON-原生重述.

## 概念

### 用一段话理解 演讲行为

奥斯注意到,有些句子不是描述世界,而是改变世界. 我承诺.   我要求.  我声明. 他把这些称为执行性陈述. 塞尔将其形式化为五类:肯定性,指导性,委托性,表达性,声明性.

### 二十个FIPA表表

| Performative | Intent |
|---|---|
| `inform` | “我告诉你 P 为真” |
| `request` | “我请求你执行 X” |
| `query-if` | “P 是否为真？” |
| `query-ref` | “X 的值是什么？” |
| `propose` | “我提议我们执行 X” |
| `accept-proposal` | “我接受该 proposal” |
| `reject-proposal` | “我拒绝该 proposal” |
| `agree` | “我同意执行 X” |
| `refuse` | “我拒绝执行 X” |
| `confirm` | “我确认 P 为真” |
| `disconfirm` | “我否认 P” |
| `not-understood` | “你的 message 无法 parse” |
| `cfp` | “针对 X 发出 proposals 征集” |
| `subscribe` | “当 X 变化时通知我” |
| `cancel` | “取消正在进行的 X” |
| `failure` | “我尝试了 X，但失败了” |

完整列表在`fipa00037.pdf`首先,我们需要记住它,而不是记住它,而是对每一个内容,都应对LLM协议,最终将重新添加一个原始.

### 规范的FIPA-ACL信息

```
(inform
  :sender       agent1@platform
  :receiver     agent2@platform
  :content      "((price IBM 83))"
  :language     SL0
  :ontology     finance
  :protocol     fipa-request
  :conversation-id   conv-42
  :reply-with   msg-17
)
```

七个字段承载协议包裹;一个字段(`content`随着JSON协议的重复尝试, 线程和解剖学的重复发明,

### 两个传统平台

**JADE**(Java Agent DEvelopment framework,19992020s) 是使用最广泛的FIPA符合运行时间.

**JACK**根据国际金融协会的信息,在国际金融协会的信息中,

两者都在网络堆中 吞掉多代理使用案例 后走向衰退──MCP 和 A2A 是2026年运行时间的集装箱.

### 国际金融局为什么要出炉

- **Ontology 开销。**要求使用共享的单元学 来解析`content`△就 ontologies 达成一致是一个历史上数年的标准化过程.
- **没人使用的 formal semantics。**语义语言提供了严格的真相条件,但大多数生产系统使用自由形式的内容,并忽略了形式主义.
- **Tooling lock-in。**杰克是商业产品. 多语团队已经开启了两者.
- **internet 赢下了 stack。**后者是JSON-RPC,后者是gRPC,取代了ACL的运输.

### 复兴是FIPA-lite

比较一个FIPA`request`与一个MCP`tools/call`其他:

```
(request                                {
  :sender  agent1                         "jsonrpc": "2.0",
  :receiver tool-server                   "method":  "tools/call",
  :content "(lookup stock IBM)"           "params":  {"name":"lookup_stock",
  :ontology finance                                   "arguments":{"symbol":"IBM"}},
  :conversation-id c42                    "id": 42
)                                        }
```

两者都包含谁、给谁、意图、收益负载、关系 id──二者之间不是革命,而是相同设计的不同交易.

等人的2025年调查(A调查代理互操作性协议:MCP,ACP,A2A,ANP,arXiv:2505.02279) 明确指出这一传承:MCP对应工具使用语音行为,A2A对应代理同行语音行为,ACP对应审计轨道语音行为,ANP对应分散身份扩展.

### 直白地说明 交易

**FIPA 给了你、而现代 specs 放弃的东西：**

- 形式语义:你可以证明`inform`意思是发送者相信内容.
- 你不必再争论我们是否应该有一个`cancel`──────
- 数十年的互动协议模式:合同网,订阅通知,提出,接受,并且已知正确性属性.

**现代 specs 给了你、而 FIPA 没有的东西：**

- 与所有现代工具兼容的JSON本土用载荷.
- 无需手编码的托理念即可解释自然语言内容.
- 网络堆运输 (HTTP、SSE、WebSocket)
- 通过实时的MCP`server/discover`通过A2A代理卡 进行发现能力.

换来更容易实现.

### 值得移植的互动协议

国际法规管理局 (FIPA) 附加了约15个互动协议.其中三个值得加入LLM多代理系统:

1. **Contract Net Protocol (CNP)。**经理发出`cfp`投标者使用`propose`响应;管理者接受/拒绝──这是规范的任务市场模式.
2. **Subscribe/Notify。**订阅者发送`subscribe`出版商 在话题中变化时发送`inform`这就是2026年每次活动的巴士.
3. **Request-When。**当条件 Y 成立时执行 X──带预条件的延迟行动──2026年的模拟是耐用工作流引擎中的延迟任务(16期 · 22期生产规模)──

每个都能清晰映射到现代消息队列,HTTP+投票或SSE流媒体.

### 放弃了学后会出现什么问题

没有共享的语,代理会从自然语言内容 推断含义――2026年有文档记录的失败模式是**semantic drift**两个代理用同一个词`"customer"`) 表示有略有不同的概念,接收者的代理按误解行动,而没有方案验证器能捕获它.

走完整的道 路线的缓解措施:

- `content`上的JSON方案:在线层拒绝结构错误
- 类型的文物 (A2A):拒绝错误的模式.
- 包裹 中的显式表演:即使内容是自然语言,也能让意图明确无歧义──

### 2026 规格 映射到演讲行为遗产

| Modern spec | FIPA analog | What it keeps | What it drops |
|---|---|---|---|
| MCP `tools/call` | `request` | explicit intent、correlation id | formal semantics、ontology |
| MCP `resources/read` | `query-ref` | explicit intent、correlation id | formal semantics |
| A2A Task lifecycle | contract-net + request-when | async lifecycle、state transitions | formal completeness guarantees |
| A2A streaming events | subscribe/notify | async push | typed-predicate subscription |
| CA-MCP shared context | blackboard（Hayes-Roth 1985） | multi-writer shared memory | logical consistency model |
| NLIP | natural-language content | LLM-native | schema |

从上到下阅读这张表,模式是:保留结构原始,放弃形式主义,让LLM掩盖歧义.


```figure
sw-contract-net
```

## 构建它

`code/main.py`实现一个纯粹的FIPA-ACL翻译器──它编码和编码规范的ACL包裹,并展示每种MCP/A2A消息形状如何归约为同样的七个字段──这个演示:

- 将五条 MCP式和A2A式的消息编码为FIPA-ACL.
- 将FIPA-ACL 解码回现代等价形式
- 使用 `cfp`,我知道.`propose`,我知道.`accept-proposal`,我知道.`reject-proposal`经营者和三位投标者之间进行了"合同网"谈判.

运行:

```
python3 code/main.py
```

输出是一段横边的痕迹,展示每条现代消息的2026 JSON 形式和FIPA-ACL 形式,然后展示一次合同网投标的回路.

## 使用它

`outputs/skill-fipa-mapper.md`作为一个技能,它会读取任意的代理协议规范并生成FIPA-ACL映射. 在采用新协议之前,使用它回答:这是真的新东西,还是带着JSON语法.`inform`

## 交付它

不要带回FIPA-ACL.

- 每条消息的意图原始的表现性是什么?
- 是否有相关性ID用于请求响应和取消?
- 是否有显式内容语言 ((JSON-RPC、平文、结构化编写的文物)?
- 互动协议是一流的,还是你开始重新实现合同网络?
- 当两个代理对内容的含义存在分歧时会发生什么?

在任何新协议交付到生产之前,先记录这五个问题.

## 练习

1. 运行`code/main.py`△观察回路编码――识别哪个FIPA性能对应`tools/call`,我知道.`resources/read`和A2A任务创建.
2. 用一个`cancel`扩展合同网演示,让经理可以在竞标过程中撤回任务.`cancel`解决了重复试验,自己无法解决的哪种失败案例?
3. 阅读 FIPA ACL 信息结构(http://www.fipa.org/specs/fipa00037/）第4.14.3 节──选择一个本课未覆盖的表现式,并描述其现代的JSON-RPC模拟式──
4. 阅读Liu等, arXiv:2505.02279──分别针对MCP、A2A、ACP、ANP,列出它们保留和放弃的FIPA执行家族──
5. 为了你自己的系统`request`表演的`content`字段设计一个最小的JSON-Schema――与纯自然语言相比,这个方案给你什么,又带来什么成本?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Speech act | “一种会做事的 utterance” | Austin/Searle：把 utterances 视为 actions。ACL 的理论源头。 |
| FIPA | “那个老 XML 东西” | IEEE Foundation for Intelligent Physical Agents。2000 年标准化了 ACL。 |
| ACL | “Agent Communication Language” | FIPA 的 envelope format：performative + content + metadata。 |
| Performative | “那个动词” | 一条 message 的 intent class：`inform`、`request`、`propose`、`cfp` 等。 |
| KQML | “FIPA 的前身” | Knowledge Query and Manipulation Language（1993）。更简单，范围更窄。 |
| Ontology | “共享词汇表” | 对 content language 所谈论概念的 formal definition。 |
| SL0 / SL1 | “FIPA content languages” | Semantic Language levels 0 and 1，即 formal content language family。 |
| Contract Net | “Task market” | Manager 发出 cfp；bidders propose；manager accepts。规范的 interaction protocol。 |
| Interaction protocol | “Messages 的模式” | 一组具有已知 correctness 的 performatives 序列：request-when、subscribe-notify 等。 |

## 延伸阅读
- [Liu et al. — A Survey of Agent Interoperability Protocols: MCP, ACP, A2A, ANP](https://arxiv.org/html/2505.02279v1)将现代规范与FIPA遗产联系 起来的规范2025调查
- [FIPA ACL Message Structure Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) 2000年批准的封面格式
- [FIPA Communicative Act Library Specification (fipa00037)](http://www.fipa.org/specs/fipa00037/) 完整的表演目录
- [MCP specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28) `request`现在,我们要去.`query-ref`的当前无状态工具使用等价格形式
- [A2A specification](https://a2a-protocol.org/latest/specification/)合同网和订阅通知的现代代理同行等价格形式
