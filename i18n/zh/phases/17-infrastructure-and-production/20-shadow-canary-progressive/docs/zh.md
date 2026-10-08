# 士课程的影子流量,加拿大部署和逐步部署

> 士部署结合软件部署中最困难的部分:没有单元测试模式,失败模式 分散、信号滞后.顺序是: 1) 影子模式  将提示请求复制给候选模型,记录日志并比较,对用户零影响; 它能捕捉明显的分布问题,但不是质量保证; 2) 士部署  逐步转移流量 10% → 25% → 50% → 75% → 100%,每一步都有门户; 追踪分数; 成本/请求,错误/拒绝率; 输出长度分布,用户反率; 3) 在稳定性确认后,对明确的方案做 A/B测试,但不是确定旧的政策; 由于完全不存在FPS的转移流量; 由于不存在FPS的固定性,可确定的变化率; 士部署的速度是可行的, 士部署的速度是可行的, 士部署的速度是可行的, 士部署的速度是可行的, 士部署的速度是可行的, 士部署的速度是可行的, 士部署的速度是可行的, 士部署的速度是可行的, 士部署的速度是可行的,

**Type:** 学习
**语言：**鱼鱼游戏游戏游戏平台
**Prerequisites:** Phase 17 · 13（Observability），Phase 17 · 21（A/B Testing）
**Time:** ~60 分钟

## 学习目标

- 区分影子模式 (零影响比较) 卡尼 (直播流量进步) 和A/B (稳定性确认后的比较)
- 列举五个专业化士专业的加拿大标准:延迟,成本/请求,错误/拒绝,输出长度分布,用户反)
- 解释为什么LLM非决定主义 (最高15%) 将改变部署中 稳的含义.
- 设计一个耗时几秒钟的政策转换而不是数小时的重新部署

## 问题

你发布了一个新型号――离线评估 显示精度 提高3%――你在生产中启用它――24小时内,成本上升40%,用户指下升8%,三个客户工单反回答很怪――你回滚――重新部署需要3小时――你的周末被毁――

色模式会在任何用户看到之前捕获到40%的成本峰. 色模式会在指下移动时停留在10%.

## 概念

### 影子模式

申请人 收取与生产相似的请求;输出将被记录,但不会返回用户.

- 产量内容与生产做不同
- 代币数量 (成本分数)
- 延迟时间
- 拒绝和错误

能捕捉:成本爆发,长度回归,明显的拒绝变化,严重的错误,不能捕捉:用户会感知到的质量.

### 卡纳里地区的部署

带门的渐进性交通转移――典型进度:1% → 10% → 25% → 50% → 75% → 100%──每一步基于 5 个指标 设置门:

1. **Latency percentiles** P50、P95、P99──违规:可纳尔的 P99 >基线的1.5x──
2. **Cost per request** 混合 $──违规:高于基线 >20%──
3. **Error / refusal rate** 5xx 加明显拒绝──违规:基本线的2x──
4. **Output length distribution**平均+P99──违规:分配转移──
5. **User-feedback rate**指/票票申请──违规:基本线的1.5x──

### 不确定性是新的变化.

同样的输入会产生不完全相同的输出.

-  GPU FP 不关联性 (浮点降低顺序 会随批量变化)
- 批量差异 (同一个提示在128批量和16批量中不同)
- 采样:温度 > 0

实测:在相同的评估设置上,运行准确度变化最高可达15%.

### 成本是变量

一个好20%的模型 每次调用可能会花费3倍――成本/要求是五个门之一――发布一个会破坏单位经济的更好模型,是反弹案例――

### 滚动是武器

- 政策旗 (Figure Flag System): 在配置中切换百分比;耗时数秒.
- 模型注 (注册表消化):注的模型 不会自动升级──
- 滚动 = 逆旗 + 固定果到之前的数秒,而不是数小时.

如果你的堆需要重新部署才能推翻, 在推出之前先修好这个点.

### 工具

**Argo Rollouts**现在,**Flagger** Kubernetes 渐进式交货控制器──与Istio/Linkerd权重路由 集成──

**Istio weighted routing**服务网 级流量拆分

**KServe / Seldon Core** 内置菜的模型服务──

**Feature flags**发射 暗暗,旗匠,释放,政策级翻转,无需重新部署.

### 计量序列

每5-15分钟检查一次,具体取决于流量量──1%的流量──以及10分钟/分钟,每个窗口都有50-150个数据点对延迟 足够,但对用户反来说噪音较大──10%会带来大约10倍的更多数据──进步应该在每一步暂停足够长时间,以积累足够的样本──

### 选择的步骤

如果新模型明显不同 ((不同行为、不同成本曲线、不同调度),在加拿大通过后以50%做A/B测试――如果它只是一个改进版本,在加拿大通过后直接到100%――

### 你应该记住的数字

- 鱼的进步:1% → 10% → 25% → 50% → 75% → 100%──
- 不确定性上限:相同输入的运行变化最高可达15%.
- 五个加拿大标准:延迟,成本,错误/拒绝,输出长度,用户反.
- 成本门:高于基线 >20% 即为违规.
- 转换:数秒,而不是数小时.


```figure
i4-canary-ramp
```

## 使用它

`code/main.py`模拟带有注入回归的加拿大轮推广. 报告推广. 在哪个阶段停止,以及哪个门被触发.

## 交付它

本课生成 `outputs/skill-rollout-runbook.md`△给定候选人模型、基线和风险耐受性,设计影子→可纳→100%计划──

## 练习

1. 运行`code/main.py`注入25%的成本回归.
2. 你的新模型在线中有3%的准确度增长,但成本/要求是18%──是否发布?取决于政策  写出两条路径──
3. 设计一个端到端耗时低于60秒的滚动.
4. 设置门,避免虚假报警. 你使用哪些乘法?
5. 在鱼模式之前捕捉到40%的成本峰.

## 关键术语

| Term | 人们怎么说 | 实际含义 |
|------|----------------|------------------------|
| Shadow mode | “duplicate to new” | 用于 logging 的零影响 send-to-candidate |
| Canary | “progressive traffic” | 带 gates、暴露给用户的渐进式 rollout |
| Gates | “rollout checks” | 阻止 progression 的 metric thresholds |
| Non-determinism | “LLM variance” | 不可消除的 run-to-run differences |
| Policy flag | “flag flip rollback” | Config-level rollback，数秒而不是数小时 |
| Model pin | “registry digest” | 指向 model version 的不可变 reference |
| Argo Rollouts | “K8s progressive” | Kubernetes-native canary/rollback controller |
| KServe | “inference K8s” | 带 canary primitives 的 model serving |
| Istio weighted | “mesh split” | Service-mesh traffic splitter |

## 延伸阅读

- [TianPan — Releasing AI Features Without Breaking Production](https://tianpan.co/blog/2026-04-09-llm-gradual-rollout-shadow-canary-ab-testing)
- [MarkTechPost — Safely Deploying ML Models](https://www.marktechpost.com/2026/03/21/safely-deploying-ml-models-to-production-four-controlled-strategies-a-b-canary-interleaved-shadow-testing/)
- [APXML — Advanced LLM Deployment Patterns](https://apxml.com/courses/mlops-for-large-models-llmops/chapter-4-llm-deployment-serving-optimization/advanced-llm-deployment-patterns)
- [Argo Rollouts docs](https://argo-rollouts.readthedocs.io/)
- [Flagger docs](https://docs.flagger.app/)
