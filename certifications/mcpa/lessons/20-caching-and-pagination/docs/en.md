# 缓存保鲜度与基于游标的分页机制

> 可缓存的结果会向客户端精准声明其可被信任的具体时长，以及哪些调用者有权共享该副本；而分页结果返回的永远是一个不透明的书签，绝非简单的数字页码。

**Type:** Reference
**Languages:** Python
**Prerequisites:** Lesson 19
**Time:** ~45 minutes

## 学习目标

- 熟练列出返回 `CacheableResult`（可缓存结果）的六大核心操作，阐明各操作中 `ttlMs` 与 `cacheScope` 的具体技术定义
- 严格遵循 2026-07-28 规范的保鲜度计算准则：`ttlMs` 为 `0` 代表立即过期、负数一律按 `0` 处理、字段缺失默认回退为 `0`
- 深入剖析 `cacheScope` 设为 `public` 与 `private` 对响应副本复用范围的决定性影响，并理解为何该字段绝不能替代访问控制 (Access Control)
- 完整追踪 `resources/list` 中不透明游标 (Opaque Cursor) 的流转：缺失游标从头开始、空字符串 `""` 是合法的列表切片位置、未知游标返回 `-32602`
- 深刻理解为何 `list_changed` 推送通知能够无视剩余 TTL 立即让缓存失效，以及为何经由 MRTR 多轮重试生成的结果绝对禁止被缓存

## 问题背景

第 04 课所确立的无状态核心原则意味着服务端在不同请求之间绝不会记住客户端的任何状态，因此系统中不存在可以用来避免重复查询的长连接上下文。与此同时，客户端请求的大多数元数据在现实中极少发生变动：工具目录可能一周才更新一次；某个静态资源的数据内容在接下来数小时内完全相同。如果在模型做出每一个动作之前，客户端都盲目调用一次 `tools/list` 或重新全量拉取一次静态资源，就会针对完全未发生变化的数据成倍增加网络往返；对于跨越公网访问的远程服务端而言，每一次不必要的往返都会累积严重的实际通信延迟。

另一个截然不同但同样沉重的成本出现在返回海量数据集的服务端上。一个包含上万条记录的资源目录，如果强行塞进单个全量 JSON 数组返回，将迫使每个客户端为全量数据买单，即便它此时只需要前几个资源名称。一次性返回全量数据还会彻底剥夺服务端在底层演进存储引擎、动态追加条目或实施数据分片的能力，任何底层变动都会瞬间破坏假设响应格式恒定不变的存量客户端。

MCP 规范通过为值得记住的响应外层附加缓存信封 (Caching Envelope) 解决了第一个问题：提供存活时间 (TTL) 以及指明谁可以共享缓存副本的作用域 (Scope)。而针对第二个问题，规范引入了基于游标的分页机制 (Cursor-based Pagination)：借助服务端签发的不透明令牌 (Opaque Token)，服务端能够向客户端交付可控的数据切片并附带指向剩余部分的书签，且无需向客户端承诺固定的总页数或固定的单页记录大小。这两项机制完全符合该版本协议一贯的严谨设计哲学：无论是响应保鲜期还是断点续查位置，客户端所需的全部事实依据均显式承载于报文自身，绝不依赖巧合尚处于打开状态的底层连接。

## 核心概念

共有六种标准操作返回 `CacheableResult` 结构：`server/discover`、`tools/list`、`prompts/list`、`resources/list`、`resources/templates/list` 与 `resources/read`。只要上述接口返回 `resultType: "complete"`，其响应体中就必定携带两个核心字段：`ttlMs` 是一个大于等于 `0` 的整数，告知客户端该响应在接收后的多少毫秒内可被视为保鲜（概念等同于 HTTP 的 `Cache-Control: max-age`）；`cacheScope` 取值为 `"public"` 或 `"private"`，用于明确界定谁有权持有并复用该缓存副本。

客户端在获取到资源后，会记录接收到该响应的本地时间戳（记为 `t_received`）。在满足 `now < t_received + ttlMs` 的窗口内，该响应被判定为新鲜。认证考试重点考查三种边界情况：若 `ttlMs` 为 `0`，响应立即失效，客户端下次需要时必须重新拉取；若服务端返回了负数 `ttlMs`，合规客户端必须忽略负号将其强制视为 `0`；若 `ttlMs` 字段完全缺失（通常仅出现在与该机制诞生之前的旧版服务端交互时），客户端同样假定其为 `0` 并回退至自身的本地启发式规则或依赖变更通知。请注意，TTL 绝不等于后台轮询周期：客户端应当以惰性求值的方式核验保鲜度（仅在下次真正需要该数据时检查），而不是启动后台定时器频繁唤醒轮询。若客户端实现确需主动轮询，必须强制引入随机抖动 (Jitter) 与退避机制 (Backoff)，防止海量客户端在同一时刻发生重试风暴。

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "resources": [
      {"uri": "note://private/journal", "name": "journal"},
      {"uri": "note://private/vault", "name": "vault"}
    ],
    "nextCursor": "",
    "ttlMs": 120000,
    "cacheScope": "public"
  }
}
```

`cacheScope` 回答的是另一个关键问题：不是“保鲜多久”，而是“谁可以使用”。`"public"` 表示响应体中不包含任何与特定调用方绑定的敏感或定制化信息，因此任何客户端实例、网关或中间代理均可统一缓存一次，并直接将其返回给完全不同的其他调用者。对所有用户均完全一致的工具目录就是典型的 `public` 场景。`"private"` 则表明内容与发起请求的特定主体紧密绑定，该缓存副本仅允许在完全相同的鉴权上下文中复用，绝不能下发给持有其他 Token 的用户。读取公共 README 属于 `public`；读取用户自身的私密笔记则属于 `private`，因为即使请求在网络报文层面看起来一模一样，不同调用者获取的实际字节完全不同。必须将 `cacheScope` 严格视为缓存调度指令，而非访问控制安全屏障：`public` 声明仅仅告知缓存中间件允许共享无用户特征的数据，它绝不代表可以绕过最初调用该方法的权限校验；无论上一次缓存响应声明了什么，服务端在处理每次请求时依然必须强制执行原语级的独立鉴权。

缓存条目的唯一键 (Cache Key) 由请求方法以及真正影响结果的参数联合构成：如 `resources/read` 关联的 `uri`、分页列表关联的 `cursor`。客户端绝不得将已缓存的响应错误匹配给方法不同或关键参数不同的请求。更为重要的是，通过第 14 课介绍的 MRTR 多轮往返重试最终达成的完成结果，绝对禁止写入缓存：因为该结果的生成高度依赖于中间交互阶段的 `inputResponses`，而这些上下文信息并未包含在基础缓存键中。同理，中途返回的 `input_required` 阶段性结果本身不具备可缓存性，其响应体中根本不包含 `ttlMs` 或 `cacheScope` 字段：一个尚未得到完整回答的半成品问题没有任何值得长期记忆的价值。

TTL 保鲜期与实时推送通知是相辅相成、紧密协同的。服务端可以仅返回 `ttlMs` 而不声明 `listChanged: true`，此时 TTL 是客户端唯一的保鲜依据；服务端也可以同时支持二者，此时 TTL 能够有效避免在无事件发生时产生冗余的无效拉取，而第 16 课详述的变更通知则在底层数据发生改变的瞬间充当绝对优先的立即失效信号。当客户端在订阅流中收到 `notifications/resources/list_changed`、`notifications/tools/list_changed` 或 `notifications/prompts/list_changed` 通知时，通知具有最高优先级：无论本地时钟上的 TTL 还剩多少毫秒，对应的缓存副本立刻被标记为过期。

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/list_changed",
  "params": {"_meta": {"io.modelcontextprotocol/subscriptionId": 7}}
}
```

分页机制采用不透明游标 (Opaque Cursor) 替代传统的固定页码。`resources/list`、`resources/templates/list`、`prompts/list` 以及 `tools/list` 均遵循相同的契约：响应中可以包含 `nextCursor`，若存在，客户端可通过在下一次请求中原样回传该字符串作为 `cursor` 参数来继续翻页。单页大小完全由服务端动态裁定，客户端不得假定其大小固定，且绝不能尝试自行解析、反编译或推测游标内部的编码结构，该字符串仅对签发它的服务端具有上下文含义。响应中缺失 `nextCursor` 则代表已到达列表末尾。考试极常考查的陷阱在于空字符串：游标的合法取值完全可以是 `""`，这代表一个真实的中间列表切片位置，既不代表分页结束，也不代表从头重新开始。如果客户端代码草率地写成 `if cursor:` 而非严谨的 `if cursor is not None:`，就会在服务端碰巧签发空字符串令牌时发生极其隐蔽的提前断流 Bug。若客户端传入了一个服务端从未签发或已无法解析的未知游标，服务端将统一返回协议级错误 `-32602 Invalid params`。

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "error": {"code": -32602, "message": "Invalid cursor: 'not-a-real-cursor'"}
}
```

分页与缓存的交叉行为存在明确的考核规则：列表中的每一页都是一个独立可缓存的响应，拥有自身独立的 `ttlMs`；某一页的保鲜时钟从该页实际被接收的时刻开始计算，而非从列表第一页被接收时计算。服务端甚至可以针对早期稳定的前序页面赋予较长的 TTL，而对尾部易变页面赋予较短的 TTL。分页不提供跨页强一致性快照保证：若底层列表在客户端抓取两页的间隔期内发生了增删，客户端可能会看到重复条目或漏掉某条记录，这与传统 HTTP 分页的权衡一致；若业务需要强一致性视图，客户端必须不带游标从头重新全量抓取。但服务端有一点必须遵守：在同一次逻辑列表查询的各个分页之间，严禁改变 `cacheScope` 的取值；如果 `resources/list` 的第一页声明为 `private`，则该次列表的所有后续分页也必须全部保持 `private`。

最后是关于排序的确定性：`tools/list` 及其他列表接口在面对相同参数的重复调用时，必须以稳定、确定性的顺序返回条目。这具备双重关键价值：一方面保证客户端自身缓存与分页记账行为可预测；另一方面，它能确保上游大语言模型提供商自身的 Prompt 缓存机制在将工具目录序列化进系统提示词时，能够精确识别出字节级完全一致的前缀，从而在网络传输之外为系统带来巨大的首字延迟降低与推理 Token 成本节约。

```figure
mcpa-20-cache-freshness
```

## 交互式实验

上方的架构图直观展示了单条缓存响应在时间轴上的状态迁移。响应在 `t_received` 刻度到达，并向后延伸出一段由 `ttlMs` 界定的阴影保鲜带：在阴影覆盖的区间内，客户端的所有查询直接由本地缓存瞬时响应，底层网络完全静默。请特别对比图中第二条相同的时间轴：一条 `list_changed` 变更通知在阴影保鲜期尚未结束前突然抵达，保鲜生命线在通知到达的瞬间被即刻切断。图表附注明确强调了这一核心法则：通知一到，立即失效，此时本地时钟剩余的 TTL 余额彻底归零作废。

## 实战演练

打开 `code/main.py`。该模块构建了一个小型 `notes` 资源服务器，内含三篇共享的公开笔记与两篇私有笔记，前端接入了 `ClientCache` 缓存组件，供 `alice-token` 与 `bob-token` 两个不同客户端身份共享（模拟网关层共享缓存环境）。

在终端中执行演练脚本：

```bash
python3 code/main.py
```

对照核心概念研读终端打印的交互记录：前五次请求遍历了 `resources/list` 分页流：第二次调用由于命中本地缓存而完全无网络流量；第三次调用显式传入 `cursor: ""` 并顺利拉取到中间切片页面而非第一页；第四次顺着 `nextCursor` 拿到尾页；第五次故意传入未知的假游标并成功观察到服务端返回 `-32602`。随后的笔记读取流程展示了作用域隔离：Alice 与 Bob 能够共享同一份关于公开 README 的本地缓存副本（因为其 `cacheScope` 为 `"public"`），但在读取私有日记时，两人各自触发了独立的远端拉取，因为 `"private"` 条目在共享缓存内部绝对禁止跨 Token 复用。紧接着，Alice 开启了 `subscriptions/listen` 订阅流，服务端修改了笔记列表，随后的 `resources/list` 调用即使 TTL 尚未到期也立即穿透回远端网络。在读取私有保险库笔记时，触发了携带 `elicitation/create` 的 `input_required` 结果；客户端完成输入交互后，使用全新 id 并回传 `requestState` 发起重试，而最终获取的完整内容被显式排除在缓存之外，因此二次读取保险库必须再次发起全量询问。最后一条记录并非客户端主动发送：它被包装为一个故意的违规样例，模拟了未遵循 SEP-2549 规范的旧版服务端完全遗漏 `ttlMs` 与 `cacheScope` 的返回形态，这正是促使合规客户端自动降级采用 `ttlMs: 0` 默认保全策略的典型场景。

## 交付产物

`outputs/caching-decision-guide.md` 是一份单页缓存决策与游标使用权威指南：系统梳理了如何科学选定 `ttlMs` 与 `cacheScope`，以及如何无缺陷实现客户端本地缓存组件。在编写调用 `resources/list`、`resources/read`、`tools/list`、`prompts/list`、`resources/templates/list` 或 `server/discover` 的核心模块时，可直接将其作为架构实现的基准手册。

## 验证方法

在课程根目录下执行单元测试：

```bash
python3 -m unittest discover code/tests
```

测试集系统验证了本课全部核心论断：新鲜条目无需产生网络调用即可直接由缓存供给；超过 TTL 的过期条目自动触发远端刷新；私有条目严禁跨 Token 复用而公开条目安全共享；`list_changed` 通知在 TTL 到期前强制截断保鲜状态；`input_required` 阶段结果与 MRTR 重试后的终态结果一律不入缓存；空字符串游标能够正确推进分页而非中断循环；未知游标严格触发 `-32602`；列表结果保持确定性排序输出；缺失或负数 `ttlMs` 被安全修正为 0。同时，运行协议通信校验器：

```bash
python3 scripts/check_mcpa_wire.py certifications/mcpa/lessons/20-caching-and-pagination
```

## 项目连接

在毕业设计的全流程交互中，针对每一个可缓存的调用，系统都必须决策其结果可信度能够维持多久，以及是否允许跨越不同调用者共享；同时必须具备在不预设固定页数的前提下平稳遍历海量长列表的工程能力。这两项决策完全依托本课准则：严格从服务端响应结构中提取 `ttlMs` 与 `cacheScope` 而非自行拍脑袋设定硬编码策略；以方法名与关键入参为基准构建严格的 Cache Key；将空字符串游标视为合法数据而非终结信号；并且绝不允许将包含多轮交互的重试结果混入缓存之中冒充通用副本。

## 核心术语

| 术语 (Term) | 核心内涵解释 |
|---|---|
| `CacheableResult` | 包含 `ttlMs` 与 `cacheScope` 缓存控制信封的六种标准 `complete` 结果结构 |
| `ttlMs` | 客户端可判定响应处于保鲜状态的毫秒数；`0` 或缺失代表立即失效，负数强制归零 |
| `cacheScope` | `public`（允许任何中间缓存共享）或 `private`（仅限同一鉴权上下文复用）；绝非访问控制凭证 |
| Cache key (缓存键) | 由请求方法与真正影响输出结果的关键参数（如 `uri` 或 `cursor`）联合构成的唯一索引 |
| Cursor (游标) | 由服务端自主生成的半透明位置标记令牌；客户端严禁猜测解析或假定单页大小固定 |
| `nextCursor` | 用于抓取下一页数据的游标令牌；其完全缺失（而非取值为空字符串）代表列表遍历结束 |
| `list_changed` notification | 实时推送通知；一旦收到，关联的本地缓存列表立刻失效，无论剩余 TTL 还有多久 |
| MRTR retried result | 经由 `input_required` 多轮往返重试最终获取的终态响应；此类结果绝对禁止写入缓存 |

## 延伸阅读

- [MCP 缓存规范 (Caching)](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)
- [MCP 分页规范 (Pagination)](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/pagination)
- [SEP-2549：列表查询结果的 TTL 规范](https://modelcontextprotocol.io/seps/2549-ttl-for-list-results)
- `certifications/mcpa/research/mcp-2026-07-28-brief.md`，第 10 章节
- `phases/13-tools-and-protocols/10-mcp-resources-and-prompts`，详细探讨承载此类可缓存分页结果的资源与提示词原语
