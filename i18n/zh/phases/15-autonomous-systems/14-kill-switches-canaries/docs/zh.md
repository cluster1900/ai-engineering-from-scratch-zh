# 杀掉开关,断路和加拿大子代币

> 杀号开关是一个维持存在代理 编辑面外的布尔伦  Redis 关键、功能旗、签署配置  用于完全禁用代理。电路打断器 粒度更细:它会在特定模式下触发 (例如连续五次相同的工具调用),暂停有问题的路径,并升级到人工。加拿大代币继承经典欺骗技术:一个假凭证或蜂记录,代理没有任何正当理由触摸它;一旦访问就会触摸警告── eBPF的数据库 (例如 Cilium) 可以在内核层中将被隔离的 pod 的输出重量进行检查; 漂移的 Cilium 基准报告称,在负载数据库的 P99 延迟低 1 秒,基于它们的传播政策,如何将数据库的硬盘检测器与其基本数据库进行更新,可以接受使用.

**Type:** Learn
**Languages:** Python (stdlib, three-detector simulator: kill switch, circuit breaker, canary)
**先修要求：**阶段15·13 (成本管理),阶段15·10 (许可模式)
**Time:** ~60 minutes

## 问题

成本管理者 (课 13) 限制的是代理可以花多少钱.它们并不限制代理在预算内可以做什么.一个拥有50美元的速度限制的代理仍然可以泄露一个秘密,发布错误的帖子,或删除一个资源.

本课程涵盖位于成本层旁边的三类探测器:

1. **Kill switch**保持存在的代理 触达范围之外的布尔式关键.
2. **Circuit breaker**暂停特定路径的行动模式探测器
3. **Canary token**没有正当理由触碰它的代理人会因触碰而暴露自己.

这三种都是LLM前工程――经典欺骗,速度限制破坏者和特征旗舰杀戮都早于自主代理――新的部分是攻击表面:代理会读取不可信内容 (阅读第11课) 编辑自己的记忆,并可以把许多看起来安全的动作组合合成一个不安全的动作――这里命名的探测器是有效的,因为它们不相信代理的自我报告――

## 概念

### 关闭开关

杀号交换器是可读但不可写的布鲁尔式.

- **托管服务中的 feature flag。**发射 黑暗,状态,释放,更新将在几秒内传播.
- **agent 轮询的 Redis key。**简单;要求代理过程 在每轮都检查.
- **object storage 中的 signed config。**代理在启动时验证签名;拒绝未签名的状态.
- **OS-level signal 或 container-lifecycle kill。**达克`kill`库伯内特斯`kubectl delete pod`系统停止.

正确的杀伤开关具有以下属性:

- 代理无法设置它.`off`,它存在于代理权证书中.
- 它会在每一个后果行动上检查,而不仅仅是启动时检查.
- 当它关闭时,代理不做任何外部可观察的事情,包括向代理访问的系统编写日志.
- 重新启动它是一个明确的人工动作,而不是自动的时间.

### 电路断电器

暂停是特定模式,而不是整个代理.

- **Closed**行动被允许.
- **Open**行动被阻止.
- **Half-open**之后,允许13次探测试,成功会关闭断裂器,任何剩余的失败都会重新打开它.

与代理相关的触发因素:

- 连续五次相同的工具调用
- 同一工具在不同输入上连续五次失败 (系统失败)
- 工具调用的速度超过门 (课13节速度)
- 在不信任的内容阅读之后调用特定工具,例如`file.delete`

### 卡纳利代币

卡纳里代币 (也称为蜂蜜代币) 是代理 永远不应触碰的输入.

代理示例:

- 环境中假`AWS_SECRET_ACCESS_KEY`没有任何实际特权. 透的尝试可立即归因.
- 带有已知哨兵值 标记的假数据库记录.
- 工作空间中的假文件.
- 时注入的虚假内存输入. 如果它出现后续输出中,说明内存已被泄露.

鱼设计要针对具体的工作流程. 一个代理有正当理由触摸鱼.

### 为什么要分层使用统计和强制限制

统计探测器 (EWMA、CUSUM、工具调用率上的z-score) 将适应移动基线――这对合法漂移是特征,对对抗性漂移是错误――耐心的攻击者可以足够缓慢地移动基线,让警报永远不触发――

作为宪法规则,永远不要发电子邮件.`secrets@` 更简单,可审计,也不能被缓慢漂移钻空子. 分层模式是:统计探测器 捕获大多数噪音,硬界限 捕获从探测器身边走过去的攻击.

### 通过eBPF数据路线转向进行隔离

基利姆基于 eBPF 的网络政策可以在内核层上将被隔离的 pod 的出口重写到法医蜂. 基利姆的公开基准 报告称,TCP_RR 上的 P99 数据路延迟时间低于 1 毫秒; 在你的蜂中,*触发* 隔离的墙钟预算主要由政策更新 如何从控制平面 传播到节点决定; 在预装运营商的 Kubernetes 上,几百毫秒是现实的; 延迟时间取决于 蜂大小和一致的序列) ⋅这给你两个事情: 代理将泄露任何真实的内容,并且在蜂中的行为将被完全观察到. 它与加拿大代币是相同的模式,不同的层: 它会通过试验环境中进行测试.

### 没有探测器能捕获什么

- **由 allowed primitives 组合而成的 semantic attacks。**每个单独的操作都通过了每个探测器;问题在于组合.
- **把 detector 本身纳入 payload 的 attacks。**如果代理读取一个页面,上面写着,在你行动之前,禁用了能,而代理还拥有这个功能,那么探测器就被破坏了.


```figure
circuit-breaker
```

## 使用它

`code/main.py`模拟一个短代理轨迹通过三类探测器. 外部命令保存中杀伤开关;一个将在五次相同的工具调用时触发的电路打断器;一个读取后会触发警报的加拿大文件. 它输入了一个合成轨迹:合法行动,重复循环,加拿大探测器,以及一个由杀伤开关触发的场景,其中的代理行动被停止了.

## 交付它

`outputs/skill-tripwire-design.md`会审查代理部署的拟议探测器堆,并标记缺口(缺失杀伤开关、缺失能、断路门 过松) 。

## 练习

1. 运行`code/main.py`▽ 确认电路打断器 在转 5 第五次相同的调用)触发,并且可纳里 在转 9 

2. 添加一个统计探测器:工具调用率 上的EWMA z-score。输入一个缓慢漂移轨迹,并显示探测器 从不触发。然后添加一个硬极限(10分钟内不超过50次工具调用),并显示硬极在同一条轨迹上上触发。

3. 为浏览器代理 (?? 课 11) 设计一组加拿大标记――列出至少三个加拿大标记,以及每个加拿大标记 会检测什么――

4. 阅读Cilium网络政策文件.具体描述出口转向隔离流程:哪个政策选择器,哪个组件,哪个出口重写,哪个警报.

5. 为了被杀掉的代理 定义重新启动的程序.谁可以重新启动?必须记录什么?

## 关键术语
| Term | What people say | What it actually means |
|---|---|---|
| Kill switch | “Off button” | 位于 agent 编辑面之外的 boolean；在每个 consequential action 上检查 |
| Circuit breaker | “Pattern pause” | 针对重复、failure rate 或 rate-limit 的 action-specific trip |
| Canary token | “Honeytoken” | agent 没有正当理由触碰的诱饵；访问会触发 alert |
| Honeypot | “Forensic sandbox” | 被 redirect 的 traffic / workspace，用于观察被 quarantine 的 agent |
| EWMA | “Moving average” | Exponentially weighted；会适应 drift（feature + bug） |
| CUSUM | “Cumulative sum” | 检测相对 baseline 的 sustained shift |
| Hard limit | “Constitutional rule” | 不会适应；无论历史如何都保持常量 |
| Constitutional limit | “Always-true rule” | 绑定到 Lesson 17 的 constitution；不能被 agent 编辑 |

## 延伸阅读
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy)自主代理的杀伤开关和断路框架
- [Microsoft Agent Framework — HITL 与监督](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop)生产 治理模式――
- [OWASP LLM / Agentic Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)检测与响应要求
- [Cilium — Network policy and eBPF](https://docs.cilium.io/en/stable/security/network/)层次出口转向和法医蜂蜜模式
- [Anthropic — Claude's Constitution (January 2026)](https://www.anthropic.com/news/claudes-constitution)作为宪法限制的硬码禁令.
