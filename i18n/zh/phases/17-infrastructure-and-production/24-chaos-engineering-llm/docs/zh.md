# 士生产的混乱工程

> 到2026年,面向LLM的混沌工程已成为一个独立的实践. 在生产中运行实验前置条件:已定义的SLI/SLO、追踪+计量+日志可观察性、自动推翻、运行簿、在调用上的架构有四个层次:控制(实验安排者)、目标(服务、信息库)、安全卫士+中断+交通过)、可观察性(((尺度+痕迹+日志)、反进入SLO) ――Guardrails是强制要求:如果ChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaChaCha

**类型：**学习 课程
**语言：**,玩具混沌实验运行者)
**前置条件：**阶段17 · 23(人工智能SRE),阶段17 · 13(可观察性)
**时间：**约60分钟

## 学习目标

- 解释为什么跳过任何一个都会破坏这个实践.
- 绘制四个平面 (控制,目标,安全,可观察性) 以及进入SLO的反循环.
- 枚举五个LLM专业实验: 记忆过载,网络故障,供应商停产,错误的提示,KV驱逐风暴)
- 根据堆 选择工具               

## 问题

传统堆中的混乱测试已经成熟了.LLM堆增加了新的失败模式. 一个带有毒字符的4K代码提示会让代码符号器卡住12秒. 上游提供商回来.

这些都不会出现在单元测试中.

## 概念

### 条件

如果没有以下内容,不要在生产中运行混乱:

1. **SLI/SLO** 已定义的服务水平指标和目标.
2. **Observability**跟踪,测量,记录,并连接到仪表板.
3. **Automated rollback**第17阶段·20政策旗反弹
4. **Runbooks** 结构化,第17阶段 · 23
5. **On-call**有人负责应答.

缺少任何一个,都意味着混乱将变成真实的事件.

### 四个飞机+反

**Control plane**实验安排器(Litmus工作流程、混沌网时间表、利用UI) 』

**Target plane**服务,Pod,节点,负载平衡器,数据库

**Safety plane**关闭开关,压缩窗户,爆炸射线限制,错误预算门.

**Observability plane** 常规指标 + 痕迹-ID相关性,用于区分混乱引起的故障和自然故障──

**Feedback loop** 发现结果反到SLO调整,行程簿更新,代码修复.

### 护是强制要求

- **Burn-rate alert**如果每天的错误预算超过预期的2倍,则暂停实验.
- **Suppression windows**在实验期间,在爆炸射线内静默非实验警报.
- **Trace-ID correlation**试验导致的错误都带着一个标签,让电话可以重复.

### 五个专业士专业实验

1. **Memory overload**通过高并发发发发长文本请求,强制触发KV缓存预先风暴――观察:服务是优雅地输送负载,还是崩?

2. **Network failure** 断断推断门口与供应商之间的连接──观察:倒退是否在SLA内生效?

3. **Provider outage simulation** 开放AI 100% 返回 429──观察:路由是否过失到人类?

4. **Malformed prompt**注入让代币器卡住的有效载荷 (例如深嵌入式单码,巨大的UTF-8代码点) 观察:单个请求是否会锁死一个工人?

5. **KV eviction storm**通过尽量耗尽的VLLM区块预算来强制驱逐.

### 率

- **每周** 在阶段中运行小型鱼实验,也可能在 prod 中 5% 流量上运行.
- **每月** 针对特定场景 安排比赛日跨团队参与;死后――
- **每季度**跨团队弹性审计;依赖性地图更新――

### 工具

- **Harness Chaos Engineering** 商业工具;人工智能衍生的实验建议;爆炸射线缩放;MCP工具集成──
- **LitmusChaos** CNCF毕业;基于Kubernetes工作流程──
- **Chaos Mesh** CNCF沙箱;古伯内特斯原生CRD风格──
- **Gremlin** 商业工具;广泛支持.
- **AWS FIS**现在,**Azure Chaos Studio**管理云服务――

### 从小处开始

第一个实验:在稳定流量下,打死一个解码复制.观察重定路由和恢复.

第一个专业士专业实验:一次注入提供者429,持续5分钟.

### 你应该记住的数字

- 控制,目标,安全,可观察性.
- 预期每日预算燃烧的2倍.
- 时间:每周的鱼,每月的游戏日,每季度的审计.
- 五个LLM实验:记忆,网络,提供商,错误的提示,KV风暴.


```figure
i4-chaos-guard
```

## 使用它

`code/main.py`报告哪些实验会导致燃烧率中断

## 交付它

本课会生成`outputs/skill-chaos-plan.md`△给定堆和成熟度,选择前三次实验和工具.

## 练习

1. 运行`code/main.py`什么实验触发了燃烧率门,为什么?
2. 设计了五个混乱实验,包括成功标准.
3. 你的燃烧率警报暂停了一次实验. 你如何判断根本原因是混乱还是自然?
4. 论证混乱 应该在生产中运行,还是只在舞台中运行.
5. 讲出三个通用网络混乱 无法复制的LLM特定故障模式.

## 关键术语

| 术语 | 人们常说 | 实际含义 |
|------|----------------|------------------------|
| SLI / SLO | "service targets" | Indicator + objective；必需前置条件 |
| Blast radius | "scope" | 受 experiment 影响的 services / users 集合 |
| Burn-rate alert | "budget gate" | 当 error-budget burn rate > 预期的 2x 时触发 |
| Game day | "monthly drill" | 计划好的 cross-team chaos exercise |
| LitmusChaos | "CNCF workflow" | Graduated CNCF Kubernetes chaos tool |
| Chaos Mesh | "CNCF CRD" | CNCF sandbox Kubernetes-native chaos |
| Harness CE | "commercial AI-assisted" | 带有 AI recommendations 的 Harness chaos |
| Malformed prompt | "tokenizer bomb" | 会让 tokenization 卡住的输入 |
| KV eviction storm | "preemption cascade" | 大规模 eviction 触发 re-prefills |

## 延伸阅读

- [DevSecOps School — Chaos Engineering 2026 指南](https://devsecopsschool.com/blog/chaos-engineering/)
- [Ankush Sharma — Observability for LLMs（书）](https://www.amazon.com/Observability-Large-Language-Models-Engineering-ebook/dp/B0DJSR65TR)
- [LitmusChaos（CNCF）](https://litmuschaos.io/)
- [Chaos Mesh（CNCF）](https://chaos-mesh.org/)
- [Harness Chaos Engineering](https://www.harness.io/products/chaos-engineering)
- [AWS FIS](https://aws.amazon.com/fis/)
