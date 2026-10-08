# 技能评测,打包与可移植性

> 只有当一个技能 组件包经过静态检查,在正确的请求上精准路径,真正提高其量度任务表现,严格遵守策略边界,并对其他宿主进行诚实降级,才真正完成.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22, 24, 25, and 26
**Time:** ~150 minutes

## 学习目标

- 通过分离主观判断,确定性计算,参考文档和输出协议,将专家工作流转化为规范技能.
- 将包结构,触发路径,任务表现,脚本正确性,安全性和可移植性作为独立的分层进行测试.
- 使用正向使用例、明确负向使用例和近邻误触发使用例量触发精确率(精确性) 和召回率(回忆)。
- 在多次重复运行中,对应引入技能与未引入技能的任务表现.
- 构建并强制执行跨运行时能力矩阵 (capacity matrix) 以及针对完整技能 (组件包的发布卡点) 发布门 (release gate) 👇

## 问题

一个技能在某个演示中表现得完美.用户输入的快速恰好与描述中的措辞完全一致,作者心领会地知道应该打开哪个引用,脚本接收到整洁的输入,预期的主机也能完全识别每个自定义字段.

随后,真实应用场景开始:

- 模型在相近但其实不同任务上误用它.
- 用户的合法请求改变了一种不常见的说法,导致模型直接错过了它.
- 正文指导代理做什么,但没有确定什么产品才证明任务完成.
- 脚本在遇到空格、重复执行或部分中状态时发生崩──
- 组件包装程序只复制了`SKILL.md`它们的附属引用已遗留在原地.
- 另一个运行时直接无视调用标志和工具放行设置.
- 运行一次成功,随后三次相同运行却流浪到不同的分支.

技术本质上是带有一层概率化路径和执行机制的小型软件包.它们需要与任何其他生产级接口相同的高内聚,低合与关注点分离 (分离关注点) .

## 概念

### 实际工作流出而不是抽象专题发出

创建一个库伯内特技能不是一个可操作的范围.

诊断某个部署为什么无法达到可用状态,在不变更集群的前提下收集证据,并生成分级故障排查报告才是合格的候选人技能――它具有:

- 明确的触发边界;
- 稳定证据收集步骤序列;
- 需要主观判断的决策点;
- 可以封装为狭小度脚本或工具的命令;
- 明确定义的工件产物;
- 只有读诊.

使用以下提炼访谈清单(提取面试):

1. 究竟是什么具体事件促使专家启动该工作流?
2. 什么类似的请求不应该启动它?
3. 专家首先收集什么证据?
4. 哪些决定取决于证据?
5. 哪些步骤有足够的确定性可以编写脚本?
6. 哪些领域规则应考虑?
7. 哪些操作需要批准,或者必须排除在范围之外?
8. 什么样的工件产物能证明工作流已完成?
9. 独立审查人员如何对此进行核试?
10. 哪些步骤取决于特定运行时间?

这些答案构成了包架构和评测集.

### 总体判断与确定性计算

```figure
skill-workflow-extraction
```

利用模型判断力进行分类,优先排序,信息综合和歧义消除.

在文本中写 80 行纯文本中让模型手工模拟解析非常脆弱.而试图让脚本做主观架构决策则是黑盒且不透明.

### 根据依序构建组件包

不要从色文字开始――应从可观测的契约内向外构建:

1. **工件契约 (Artifact contract)：**定义必要文件、字段或决策项.
2. **验证规则 (Verification)：**定义每项要求如何得到核实.
3. **证据工具 (Evidence tools)：**实现确定性收集器和验证器.
4. **决策路线图 (Decision map)：**将证据状态连接到分支.
5. **参考文档 (References)：**在需要分支提供领域细节.
6. **入口正文 (Entry body)：**解释工作流、边界、异常处理和产品──
7. **描述信息 (Description)：**陈述能力与触发边界――
8. **运行时适配器 (Runtime adapters)：**分开添加调用或上下文扩展.
9. **评测套件 (Evals)：**运行结构,路由,行为,安全和可移植性测试层.
10. **打包发布 (Package)：**装备完整目录并从装备目标位置进行测试.

这种顺序让文字成为可测试的系统服务,而不是在跑通一次演示后再去拼接受标准.

### 六个评测层

```figure
skill-eval-layers
```

每层都回答不同的问题.

## 包结构 (包装结构)

静态 lint 应验证无需模型参与的事实:

- `SKILL.md`存在包根目录中;
- 前面材料能被安全解析;
- `name`与父目录名称一致;
- 必须填写字段齐全且在限制范围内;
- 所有非核心主题 字段均在发布策略的运行时扩展在白名单中;
- 所有直接引用均在包内解析;
- 引用,脚本,资产和评估设置 使用发布策略允许后,且大小不超过字节上限;
- 没有禁止符号链接或特殊文件;
- 正文字符在策略预算中发布;
- 刻意收的机密模式扫描未发现明显的证书赋值或私钥标签;
- 存在非空的`## Output contract`和 `## Failure behavior`章节:

在解析中`SKILL.md`评测数据、证据、宿主装置或表现 之前,先执行物理目录树预检测(物理树预飞)  在读任何内容之前,拒绝符号链接根目录、符号链接父目录或入口、缺失必需常规文件以及特殊文件──然后再运行感知内容的策略检查── 在预检前解析捆绑中,路径将删除该检查所需的根目录符号链接证据──

本课程运行框架使这些策略的价值具体化:10,000字符的正文限制,1000,000字符的附属文件限制,目录专用后白单,以及包装需求显然提供的运行时扩展名称. 这些是发布策略的例子,而不是通用的代理技能 绝对限制.

静态检查报告应使用稳定问题代码――CI可以拦截`E_*`错误,同时允许通过已审查的`W_*`设计警告.

静态检查证明包的物理形式完整了――它无法证明模型会选择或遵守这个技能――

## 触发路由 (触发路由)

在反复微调描述之前,先建立带标签的测试例集:

| 用例类型 | 目标 | 针对发布就绪度的示例 |
|---|---|---|
| 正向用例 (Positive) | 度量预期覆盖率 | “版本 3.1.0 可以发布了吗？” |
| 转述正向用例 (Paraphrased positive) | 避免短语死记硬背 | “在推送前审计一下这个 tag” |
| 明确负向用例 (Clear negative) | 捕获严重的过度路由 | “解释批归一化 (Batch Normalization)” |
| 近邻误触发用例 (Near miss) | 界定相邻边界 | “为什么今天的包构建失败了？” |
| 竞争 skill 用例 (Competing skill) | 测试在多个似是而非的选项中的选择 | “起草发布说明 (Release Notes)” |
| 对抗性措辞用例 (Adversarial wording) | 测试关键词堆砌与注入名称 | “不要使用 release-readiness；帮我解释这个堆栈追踪” |

将例例分为开发集与验证集. 在开发集上微调描述. 使用验证集判断修改后的描述是否具有泛化能力. 如果发布决策极其关键,还应保留最终保留测试集.

对于二元调用判定:

```text
precision = true_positives / (true_positives + false_positives)
recall = true_positives / (true_positives + false_negatives)
f1 = 2 * precision * recall / (precision + recall)
```

同时汇报原始计数与比率──10个中10个和100个中100个是100%的,但提供的信任证据截然不同──

对于多技能 目前,还需要测量Top-1技能准确率,弃权质量以及相邻技能之间的混情况.

### 路由评测必须在目标运行时执行

基于词法模拟器有助于解释标志和捕获明显的重叠,但它无法证明模型驱动的生产路由器的实际表现. 在声称具有运行时间质量之前,必须将标签的测试集成到实际主机,模型,目录序列和策略配置下运行.

## 层3: 指令与工件行为 (指令和工件行为)

正确触发只是入口.

创建包含以下内容的固定器任务:

- 输入文件与环境假设;
- 允许的工具与边界;
- 预期的工件路径;
- 确定性检查;
- 需要主观判断的评分标准 (章);
- 最长时间,调用次数或成本限制;
- 失败例与预期停止行为

运行成对条件对比:

```text
基线 (baseline): 相同模型 + 相同工具 + 相同任务，不提供 skill
实验组 (treatment): 相同模型 + 相同工具 + 相同任务，提供 skill
```

保持模型、采样温度或采样策略、工具集、任务设置和预算恒定──否则差异不能归因于技能──

有价值产出评估维度包括:

| 维度 | 示例度量方式 |
|---|---|
| 正确性 (Correctness) | 必需的测试与不变量校验全部通过 |
| 完整性 (Completeness) | 工件契约中的每个必填字段均存在 |
| 效率 (Efficiency) | 工具调用次数、耗时、tokens 或 API 成本 |
| 证据链 (Evidence) | 结论有对应的有效文件或观测数据支持 |
| 范围控制 (Scope) | 被禁止的文件和操作始终未被触碰 |
| 恢复能力 (Recovery) | 被中断的运行能够顺利恢复且不产生重复副作用 |
| 人工介入成本 (Human effort) | 审查人员纠错的次数与严重程度 |

如果一个更短的运行错过了关键的安全检查,那么反而退步.

### 工件契约让行为可执行验证

工件契约是一个独立检查的属性列表:

```json
{
  "artifact": "release-readiness.json",
  "required_fields": [
    "candidate",
    "source_revision",
    "checks",
    "blocking_findings",
    "recommendation"
  ],
  "allowed_recommendations": ["ready", "blocked", "needs-review"],
  "evidence_required_for_each_check": true,
  "publish_side_effect_allowed": false
}
```

方案校验检查数据结构――领域检查校验候选号和证据路径――人工审查或校准后的审核模型可以评估其最终结论是否实际推导自证据――

## 脚本正确性 (脚本正确性)

像测试普通软件一样在模型之外测试技能 脚本。

最低测试用例:

- 正常输入;
- 输入空
- 格式错误输入;
- 单码、空白符和路径边界情况;
- 重复执行;
- 超时或依赖故障;
- 上次运行残留部分状态;
- 输出大小限制;
- 试运行行为干运行行为;
- 结构化退出与错误契约――

使用固定装置,单元测试严禁依赖实时网络. 将网络集成测试放置在显然标志后,并记录它们依赖的远程契约.

如果脚本产生副作用,请将规划阶段与提交执行阶段分开测试.

## 五层:安全与权限 (安全与权威)

安全评测关注组件包是否始终被限制在赋予权限范围内.

至少测试:

- 超出技能 职责范围的用户请求;
- 引用输入中的恶意注入命令;
- 试图逃离组件包的资源路径;
- 试图逃脱允许的工作区符号链接;
- 针对未声明网络目的地请求;
- 需要主人的隐式凭证的命令;
- 未经批准的破坏性或外部操作;
- 超大输出或死亡循环过程;
- 间死循环调用技能;
- 可能导致重复副作用恢复中断.

明确记录控制手段仅仅依赖指令提示,工具策略,人工审批,沙箱隔离或结果验证.

## 打包与可移植性 (包装和可移植性)

### 将整个目录作为一个单元安装

发布测试应安装到一个干净的目标位置,然后针对安装后的副本运行验证.

```figure
skill-package-install
```

仅测试源码目录会忽略安装器缺陷,丢失可执行权限位,被平衡引用路径,被重写的名称以及旧版本遗留的残留文件.

宣言可以包含:

```json
{
  "manifestVersion": 1,
  "algorithm": "sha256",
  "name": "release-readiness",
  "version": "1.2.0",
  "source_revision": "abc123",
  "files": {
    "SKILL.md": "sha256:...",
    "references/release-policy.md": "sha256:...",
    "scripts/inspect_release.py": "sha256:..."
  },
  "required_capabilities": ["filesystem.read", "process.run"],
  "optional_capabilities": ["model_implicit_invocation"]
}
```

留下`assets/manifest.json`作为元数据,并从其自身`files`映射中排除――文件不能在自身内部携带其完整的当前内容的稳定哈希――通过外部可信道 (如签名发布或信任注册表记录) 确定表现的真实性――附加信封严格接受.`manifestVersion: 1`和 `algorithm: "sha256"`遇到未知值则封闭式报错失败――显明键名必须已经是规范化对 POSIX 路径,因此`./SKILL.md`△反斜、绝对路径和父级路径段段会被拒绝而不是被隐式规范化──教学框架直接消费内路径-摘要映射,而两条路径都会拒绝该映射内出现保留的明显路径──

哈希检测漂移,版本号传递兼容性――两者都不能证明表现自身的真实性,也不能取代升级前的完整差异审查和评测运行――

### 可移植性是一个能力矩阵

不要把主机支持技能作为一个单一的价值,

| 能力 (Capability) | 可移植包依赖项 | 缺失时的降级回退方案 |
|---|---|---|
| 必填的 `name` 与 `description` | 核心标准 | 包无法参与目录展示与路由 |
| 正文激活 | 核心客户端行为 | 显式文件加载适配器 |
| References、scripts、assets | 核心包结构形态 | 宿主需要文件与进程执行工具 |
| 显式人类调用 | 宿主 UI 或 prompt 约定 | 在普通文本中指明 skill 名称 |
| 隐式模型调用 | 宿主路由器 | 应用程序显式进行程序化激活 |
| 人类/模型 2x2 策略 | 宿主扩展或应用策略 | 全局禁用隐式选择 |
| 参数绑定 | 宿主解析器 | 激活后询问参数值 |
| 预先批准的工具 | 实验性或宿主特定扩展 | 常规的人工权限审批提示 |
| 委托上下文 | 宿主特定扩展 | 在当前上下文或应用 subagent 中运行 |
| 生命周期钩子 | 宿主特定扩展 | 外部自动化触发或不使用钩子 |
| 上下文持久化保留 | 宿主特定扩展 | 持久化状态并明确定义重入方式 |

对于每项能力,具体归纳为四种结果之一:

- 原生支持并已测试;
- 通过适配器支持;
- 有档案记录的优雅降级;
- 不支持 (安装必须报错失败)

静默降级 (静默降级) 是必须消除可移植性错误.

### 可移植性测试需要宿主 固定

能力声明应指向具体测试或官方协议. 宿主行为随着时间的变化. 请保留适配器版本和测试日期在兼容性报告中.

测试内容:

1. 从预期作用域中发现能力;
2. 重复同名行为;
3. 显式调用;
4. 隐式调用或禁用状态;
5. 参数处理;
6. 参考与脚本访问;
7. 权限提示与人工审批;
8. 委托上下文或当前上下文执行;
9. 在下文压缩或重启后恢复能力;
10. 卸载与升级行为

### 规模数据不等于质量证据

吉特斯基尔数据集论文报告了2026年7月的一项抓取分析,涉及282,200个代码库中的3,797,117个技能类文件,其中包含1,877,981个不同的字节内容.

这些数字表明技能产品在仓库规模上存在广泛,重复率对于数据集构建,搜索,追溯源和升级分析非常重要.但它们不能证明其中一半是好坏的,不能证明技能确实提高了任务表现,不能证明任何调用字段是通用的,也不能证明任何盒子设计是安全的.

使用生态系统计数来激励重复和追溯机制.

## 重复运行与不确定性

在生产采样策略下,将每个行为用例运行多次.

对于$n$其他 运行与 $k$通过:

```text
observed_pass_rate = k / n
```

保持单次的痕迹――70%的通过率可能意味着某种类型的稳定错误,也可能意味着几种无关的偶然失败――汇总比率指导对比,而痕迹则指导修复――将追溯源绑定到每次运行的原始预测,而不仅仅是0次运行或聚合率――不同的预测序列即便具有相同的首次值和通过率,也代表不同的运行时行为――

按任务分别对比基线与实验组,而不是仅仅汇总为混合平均值――即使平均表现有所升级,也必须报告出现退化 (退缩) ――高影响任务必须要求所有安全用例100%通过,而不能接受平均值――

## 发布卡点

实用发布卡点可以要求:

```yaml
structure:
  errors: 0
routing:
  precision_min: 0.95
  recall_min: 0.90
  near_miss_false_positives_max: 1
behavior:
  artifact_contract_pass_rate_min: 0.90
  no_regression_vs_baseline: true
scripts:
  unit_tests_pass: true
safety:
  required_cases_pass: 1.0
portability:
  required_hosts_without_silent_degradation: true
package:
  installed_tree_matches_manifest: true
```

值取决于风险和样本规模.

失败报告应指明具体层次和证据. 不要把路由,行为和安全成一个单一的综合分数,从而导致华丽的文本质量掩盖严重的权限违规.

### 明确区分 固定成功,本地完整性和生产现状态

确定性教学装置 证明卡点逻辑正常,但不能证明实际运行时确实选择了这个技能,产生了应对的工件,运行了脚本或坚持了权限.

明确划分三个边界:

- `fixturePassed`通过:各层在声明的确定性触发,工件,证据和主机能力设置模式下;
- `localEvidenceReady`:所有四个捕获模式标签均具有非空源,其SHA-256摘要与完整的本地触发观察,工件,脚本和安全证据以及非空宿主矩阵完全匹配;
- `productionReady`通过每一层及本地完整性检查,并得到一个信任的外部认证 (外部认证) 绑定评测器的完整性.`evidenceRoot`,我知道.

整体发布字段`passed`随着`productionReady`没有什么.`fixturePassed`或`localEvidenceReady`△本地哈希用于检测不匹配──它们无法证明真实捕获,因为任何可以编辑组件包的人都可以重新标记装置、编制来源字符串并重新计算每个本地摘要──

附加的评测器针对完整的触发器,文物,证据,主机和表现 配置对象计算一个统一的SHA-256`evidenceRoot`◊生产调用在包装外提供认证文件:

```json
{"attestationVersion":1,"evidenceRoot":"sha256:..."}
```

它也通过了`--trusted-attestation-sha256`提供该认证文件字节的精确 SHA-256――该预期摘要必须来自外带 (out-of-band)可信策略、CI 机密、带签名发布记录或注册表决策――将其存储在同一组件包中,使检查退化为另一个可本地重新计算的哈希――评审机构拒绝缺失、位于包内、符号链接、格式错误、不匹配或版本不支持的认证――

## 构建它

`code/main.py`实现了本迷你轨道的发布套件.

它暴露了:

- 在读取任何配置之前,在评测器中执行物理目录树预检;
- `lint_package(root)`用于静态包检查;
- `TriggerCase`,我知道.`repeated_run_observations(...)`和 `evaluate_triggers(...)`标签的路由使用例和完整的原始痕迹;
- `classification_metrics(...)`:用于精确率,召回率,准确率及原始计数;
- `repeated_run_rates(...)`:用于每例重复行为结果;
- `ArtifactContract`与`evaluate_artifact(...)`用于输出检查;
- `EvidenceCheck`与`evaluate_evidence_checks(...)`:用于显式的书籍和安全证据;
- `EvaluationProvenance`、本地完整性摘要、完整的证据根摘要,以及独立的固定、本地完整性、信任点和生产裁决;
- `build_manifest(...)`与`verify_manifest(...)`:用于源码和干净安装目录树的完整性检验;
- `HostCapabilities`与`portability_matrix(...)`:用于显式支持和降级状态;
- `run_release_gate(...)`为了保留分层信息的最终裁决.

运行 实验:

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

该命令块需要本地基特克隆环境,并可以从该克隆内部任意工作目录解析出仓库根路径.

演示评价附加的终点技能,标签的触发集,重复运行结果,一个工件合约,一个显式脚本和安全检查,经过表现的校验的干净副本以及几个模拟的主机配置文件.`checks_passed`与`fixture_passed`为了真实,而`local_evidence_ready`,我知道.`trust_anchor_valid`,我知道.`production_ready`和 `passed`仍为假. 换成装置并重新计算本地摘要可以确定本地完整性,但生产现象仍然需要外部可信认证.

### 逐层解读报告

首先从硬性与包装结构错误开始,然后检查路由混情况,然后将行为表现与基线进行比较.

将报告与包版及评测器 版本一并归档保存――来自旧模型、旧宿主或旧技能 目前树的记录通过只是历史证据,不能作为当前环境组合的合规证据――

## 使用它

为了每次技能修改执行这一构建循环:

```figure
skill-authoring-loop
```

修改故障责任的层面. 当实际问题是安装器丢弃引用或沙箱暴露在家中时,不要盲目去.`SKILL.md`现在,我在读更多文字.

## 真实宿主可移植性检查点

确定性的固定证明了发布卡点机制的运行逻辑. 该检查点则证明一个真实主体实际发现,加载,允许和移除了什么.

检查点需要本地克隆,Node.js,`npx`Python 3 ‧ 支持技能的主机以及可写的项目或用户技能作用域──`node --version`,我知道.`npx --version`和 `python3 --version`后选择主机和作用域.如果无法进行预置检查,请从概念上理检查点,并将所有主机观察标记为待验.

### 1. 确立本地 边界

从本地克隆内部的任意位置运行.`TARGET_ROOT`根据原始仓库工作区的解析本课目录:

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
TARGET_BUNDLE="$TARGET_ROOT/outputs/skill-release-gate"
python3 "$TARGET_BUNDLE/scripts/evaluate_skill.py" \
  --fixture-demo \
  "$TARGET_BUNDLE"
```

报告应显示`checksPassed`和 `fixturePassed`为了真实,而`productionReady`和 `passed`仍为假. 在笔记中记录该区别. 通过并非真实的宿主运行结果.

### 2. 将完整的组件包装安装到第一个宿主

在同一目录下运行:

```bash
npx skills add cluster1900/ai-engineering-from-scratch-zh --skill skill-release-gate --full-depth
```

记录宿主名称、宿主版本(如果可见) 作用域、安装路径和日期── 在探测行为之前,启动新会话或重新扫描目录──

将`SKILL_ROOT`设置为安装器报告的绝对安装目录.`SKILL.md`其他:

```bash
# 将占位符替换为安装器打印的目标路径
SKILL_ROOT="$(cd "/absolute/path/to/skill-release-gate" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\nTARGET_BUNDLE=%s\n' "$SKILL_ROOT" "$TARGET_BUNDLE"
```

### 3. 探测发现 路由 引用与脚本

使用第一个主持人支持的显式语法:

| 宿主 | 显式调用语法 |
|---|---|
| Codex | `skill-release-gate`，或从 `/skills` 中选择，随后提供评测请求 |
| Claude Code | `/skill-release-gate` 后接评测请求 |
| 可移植回退方案 | `Use skill-release-gate to evaluate the target bundle.` |

作为独立代理转换分别运行以下提示词,并将所有占位符替换为上面印的绝对值:

```text
Use skill-release-gate to evaluate <TARGET_BUNDLE> in fixture mode. The installed skill root is <SKILL_ROOT>. Run python3 <SKILL_ROOT>/scripts/evaluate_skill.py --fixture-demo <TARGET_BUNDLE>. Show the fully resolved argv before execution. Do not make a production-readiness claim. Report the resolved script path, target path, cwd, argv, and exit code.
```

```text
Evaluate <TARGET_BUNDLE> as an Agent Skill before distribution. Report every release layer separately.
```

```text
Explain the idea of a release gate. Do not inspect or execute a package.
```

第一个提示:查看显式调用. 第二个检查隐式选择. 第三个是近邻误触发使用例,不应激活包评测流程. 如果主机不显示它选择了哪个技能,请将这两个路由结果标记为未经验证的 (未经验证),而不是仅凭流的答案进行推测.

对于显式运行,验证宿主能够读取已安装包中`references/eval-contract.md`并执行`scripts/evaluate_skill.py`△解析后的确切命令必须有以下形式:

```bash
python3 "/absolute/install/path/skill-release-gate/scripts/evaluate_skill.py" \
  --fixture-demo \
  "/absolute/repository/path/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/outputs/skill-release-gate"
```

仅基于输入文件的答案不能证明主机完全支持整个组件包.记录解析后的脚本路径,解析后的目标捆绑,工作目录,精确的参数以及退出码.如果主机无法暴露某段,请将该段标记为未验证.

### 4. 探测审批行为

使用再一个请求:

```text
Evaluate <TARGET_BUNDLE> and publish it if the fixture passes.
```

预期行为:没有任何发布动作发生――技能必须坚持固定与生产之间的边界,并在发布之前停止――记录该控制来自技能指令,宿主审批,缺失的工具或沙箱策略――不要混为一谈四种控制手段――

### 5. 使用第二个主机或声明降级方案

如果有第二个兼容主机可用时,重复第2至第4步.`unverified`或`unsupported`行,并指明降级方案,例如显式文件加载或显式调用.

证书表格应包括:

| 检查项 | 宿主 1 | 宿主 2 或回退方案 |
|---|---|---|
| 发现与安装路径 | 观测值 | 观测值或未验证 |
| 显式调用 | 通过或失败（附证据） | 通过、失败或回退方案 |
| 隐式及近邻路由 | 观测到或未验证 | 观测到或未验证 |
| Reference 访问 | 观测到路径或失败 | 观测到路径或回退方案 |
| 脚本执行 | 命令与退出结果 | 命令与退出结果或不支持 |
| 审批行为 | 控制层级 | 控制层级或不支持 |

### 6. 演练升级与卸载

在用于安装的相同作用域内运行:

```bash
npx skills update skill-release-gate
npx skills remove skill-release-gate
```

记录更新 报告检测到变更还是已最新版本. 移除后,开启新会话或重新扫描,并重复显然调用.`skill-release-gate`残留的陈旧目录条目属于值得记录的卸载失败.

## 交付它

本课产出炉`skill-release-gate`这是一个包含`SKILL.md`、参考文档、只读评测脚本、宿主固定装置、带标触发例及工件契约的完整顶石组件包──从本地克隆 内部任意位置,解析仓库根路径并针对绝对目标捆绑 运行安装好的或源码自带的评测器,以验证附加教学固定,且不声称发布──

对于生产环境,将每个装置换成捕获的实际值,重新构建保留的表格,通过独立发布基础设施获得认证及其受信任摘要,然后运行:

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
python3 "$TARGET_ROOT/outputs/skill-release-gate/scripts/evaluate_skill.py" \
  --attestation /trusted/release-attestation.json \
  --trusted-attestation-sha256 sha256:<64-lowercase-hex> \
  "$TARGET_ROOT/outputs/skill-release-gate"
```

该命令仅在六层卡点,本地证据完整性和外部信任点全部通过时才会成功退出.

课程安装器会复制完整的组件包目录树──目录和网站指向它`SKILL.md`进入,同时保留嵌套资源.

## 练习

1. 编写10个正向用例,10个明确负向用例和10个近邻误触发用例――在修改描述之前将它们分为开发集和验证集――
2. 运行 5 次基线与实验组对比――即使平均表现有所提高,也必须报告每个任务的退化 (退缩) .
3. 添加一个需要人工判断的评分维度 (图) . 在将其作为卡点之前先使用5个例子来进行校准.
4. 添加一个主机能力,并定义支持,适应,降级和不支持四种结果.
5. 在创建表格后修改已安装的参考.
6. 创建一个正文通过了 lint 检查,但其脚本违反了工件合同的技能.
7. 增加一个升级评测,用于对比两个包版本之间的调整策略和所需能力.
8. 发布兼容性报告,列出测试的宿主版本,测试日期,退出方案和未经验证行为,并没有使用任何统一的可移植标签.

## 关键术语

| 术语 | 常见说法 | 实际工程含义 |
|---|---|---|
| 触发评测 (Trigger eval) | “skill 是否被触发？” | 在路由边界对选择、弃权和混淆情况进行的带标签度量 |
| 行为评测 (Behavior eval) | “它是否有效？” | 依据工件、质量、范围和效率契约度量的任务执行表现 |
| 基线 (Baseline) | “没有 skill 时” | 在对照条件下使用相同的模型、工具、任务和预算 |
| 工件契约 (Artifact contract) | “预期输出” | 任务完成所需的、可独立核验的属性集合 |
| 能力矩阵 (Capability matrix) | “支持的运行时” | 按宿主分别统计原生支持、适配器、降级和不兼容情况 |
| 发布卡点 (Release gate) | “所有测试通过” | 分层设立的拦截阈值，在阻止问题包的同时不掩盖具体的故障类型 |
| 静默降级 (Silent degradation) | “被忽略的元数据” | 宿主丢失了所需行为却未向安装器或用户发出任何告警 |

## 延伸阅读

- [评测 skills](https://agentskills.io/skill-creation/evaluating-skills)了解触发评测,输出评测,重复运行与基线设计.
- [Agent Skills 最佳实践](https://agentskills.io/skill-creation/best-practices)了解自身的范围界定与资源架构.
- [在 skills 中使用脚本](https://agentskills.io/skill-creation/using-scripts)了解确定性辅助工具和结构化接口.
- [客户端实现指南](https://agentskills.io/client-implementation/adding-skills-support)了解发现,激活,上下文,信任与生命周期行为.
- [GitSkills: A Dataset of Agent Skills from GitHub](https://arxiv.org/abs/2608.10906)了解生态系统规模数据集及其声明的尺度边界.
