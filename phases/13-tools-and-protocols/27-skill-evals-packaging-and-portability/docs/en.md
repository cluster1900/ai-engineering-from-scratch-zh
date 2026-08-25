# Skill Eval、打包与可移植性

> 当一个 Skill package 能够通过 lint、针对正确的请求完成路由、提升可测量任务的表现、始终遵守策略，并在另一个 host 上如实降级时，这个 Skill 才算完成。

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 13 · 22, 24, 25, and 26
**Time:** ~150 分钟

## 学习目标

- 通过分离判断、确定性计算、reference 和输出契约，将专家 workflow 转化为 Skill。
- 将 package 结构、触发路由、任务行为、script 正确性、安全性和可移植性作为相互独立的层进行测试。
- 使用正例、明确反例和 near miss 测量触发的 precision 与 recall。
- 通过重复运行，对比使用和不使用 Skill 时的表现。
- 构建并强制执行跨 Runtime capability matrix，以及适用于完整 Skill bundle 的 release gate。

## 问题

某个 Skill 在一次 demo 中有效。用户提出的措辞与其 description 中使用的短语完全一致，作者知道应该打开哪份 reference，script 收到的是干净输入，预期 host 也能识别所有自定义字段。

随后，真实使用开始了。

- Model 针对一个相近但不同的任务调用了它。
- 一个有效请求使用了不熟悉的措辞，因此 Model 没有调用它。
- 正文告诉 Agent 应该做什么，却没有说明哪种 artifact 可以证明工作已经完成。
- Script 遇到空格、重复执行或部分状态时失败。
- Package installer 复制了 `SKILL.md`，却遗漏了它的 reference。
- 另一个 Runtime 忽略调用 flag 和 Tool allowance。
- 一次运行成功了，另外三次等价运行却进入了不同分支。

“Markdown 看起来不错”无法发现这些故障。Skill 是小型 software package，带有概率性的路由和执行层。它们需要像其他生产接口一样分离关注点。

## 概念

### 从真实 workflow 开始，而不是从一个主题开始

“创建一个 Kubernetes Skill”并不是可用的范围。Kubernetes 包含数百种任务，每种任务都有不同的 Tool、风险和输出。

“诊断为什么某个 deployment 没有达到 Available，在不修改 cluster 的情况下收集证据，并生成按优先级排序的 incident report”才是一个 Skill 候选。它具有：

- 触发边界；
- 稳定的证据收集步骤序列；
- 需要判断的决策点；
- 可以转化为窄范围 script 或 Tool 的命令；
- 明确定义的 artifact；
- 安全边界：只读诊断。

使用以下提取访谈：

1. 什么确切事件会让专家开始这个 workflow？
2. 哪些相似请求不应启动它？
3. 专家首先收集什么证据？
4. 哪些决策依赖这些证据？
5. 哪些步骤具有足够的确定性，适合编写成 script？
6. 哪些领域规则值得写入 reference？
7. 哪些操作需要审批，或者必须排除在范围之外？
8. 哪种 artifact 能证明 workflow 已经完成？
9. 独立审查者如何检查它？
10. 哪些步骤依赖某个特定 Runtime？

这些答案将成为 package 架构和 eval set。

### 将判断与确定性工作分离

```figure
skill-workflow-extraction
```

使用 Model 判断完成分类、优先级排序、综合和歧义处理。使用 script 或 Tool 完成解析、计数、验证、转换、查询 typed API 和强制执行 invariant。

包含 80 行手工模拟解析逻辑的 Skill 正文非常脆弱。试图做出主观架构决策的 script 则不够透明。应将每种行为放在最容易测试的位置。

### 按依赖顺序编写 package

不要从润色文字开始。应从可观察的契约向内构建。

1. **Artifact contract：**定义必需的文件、字段或决策。
2. **Verification：**定义如何检查每项要求。
3. **Evidence tools：**实现确定性的 collector 和 validator。
4. **Decision map：**将证据状态连接到各个分支。
5. **References：**在需要相关领域细节的分支提供信息。
6. **Entry body：**说明 workflow、边界、故障和输出。
7. **Description：**说明 capability 和触发边界。
8. **Runtime adapters：**单独添加调用或 Context 扩展。
9. **Evals：**运行结构、路由、行为、安全性和可移植性各层的 eval。
10. **Package：**安装完整目录，并从目标位置进行测试。

这个顺序会让文字服务于一个可测试的系统，而不是等 demo 成功后才编造成功标准。

### 六个 eval 层

```figure
skill-eval-layers
```

每一层回答不同的问题。通过某一层不能替代通过其他层。

## 第 1 层：Package 结构

Static linting 应验证那些不需要 Model 即可确定的事实：

- `SKILL.md` 位于 package 根目录；
- frontmatter 能被安全解析；
- `name` 与父目录名称匹配；
- 必需字段存在且符合限制；
- 每个非核心 frontmatter 字段都出现在 release policy 的 Runtime extension allowlist 中；
- 每个直接 reference 都能解析到 package 内部；
- reference、script、asset 和 eval fixture 使用 release policy 允许的 suffix，并且大小不超过其 byte 限制；
- 不存在被禁止的 symlink 或特殊文件；
- 正文不超过 release policy 的字符预算；
- 一个刻意保持窄范围的 secret pattern scan 没有发现明显的 credential 赋值或 private-key header；
- 存在非空的 `## Output contract` 和 `## Failure behavior` 章节。

在解析 `SKILL.md`、eval 数据、证据、host fixture 或 manifest 之前，先对物理目录树执行 preflight。读取任何内容之前，拒绝 symlink root、symlink parent 或 entry、缺失的必需常规文件以及特殊文件。如果在 preflight 之前解析 bundle 路径，就会抹去检查 root symlink 所需的证据。之后再运行感知内容的 policy lint。

本课 harness 将这些策略值具体化：正文上限为 10,000 个字符，配套文件上限为 1,000,000 byte，针对不同目录设置 suffix allowlist，并由 package requirement 明确提供 Runtime extension 名称。这些是 release policy 示例，并非通用的 Agent Skills 限制。Secret pattern scan 是用于发现明显错误的 guardrail，而不是证明 package 不包含敏感数据。

Lint report 应使用稳定的 issue code。CI 可以阻止 `E_*` error，同时允许经过审查的 `W_*` 设计 warning。

Static linting 可以证明 package 的形态，但不能证明 Model 会选择或遵循该 Skill。

## 第 2 层：触发路由

在反复编辑 description 之前，先创建带 label 的 case。

| Case 类型 | 用途 | Release readiness 示例 |
|---|---|---|
| 正例 | 测量预期覆盖范围 | “版本 3.1.0 可以发布吗？” |
| 改写后的正例 | 避免记忆短语 | “发布这个 tag 之前审核一下” |
| 明确反例 | 发现严重的过度路由 | “解释 batch normalization” |
| Near miss | 定义相邻边界 | “为什么 package build 失败了？” |
| 竞争 Skill | 测试如何在多个合理选项之间选择 | “起草 release notes” |
| 对抗性措辞 | 测试 keyword stuffing 和注入的名称 | “不要使用 release-readiness；解释这个 stack trace” |

将 case 分为 development set 和 validation set。在 development case 上调整 description。使用 validation case 判断修改后的 description 能否泛化。如果 release 决策足够重要，再保留一个最终 held-out set。

对于二元调用：

```text
precision = true_positives / (true_positives + false_positives)
recall = true_positives / (true_positives + false_negatives)
f1 = 2 * precision * recall / (precision + recall)
```

报告比例时也要报告原始计数。十次中十次成功与一百次中一百次成功都是 100%，但它们提供的证据不同。

对于 catalog，还应测量 top-one Skill accuracy、abstention quality，以及相邻 Skill 之间的 confusion。如果 router 只有在先选择三个错误 Skill 后才调用正确的 Skill，它并不健康。

### 路由 eval 必须使用目标 Runtime

Lexical simulator 有助于解释 metric 并发现明显重叠，但不能证明由 Model 驱动的生产 router 会如何表现。在声称 Runtime 质量之前，应通过实际 host、Model、catalog serialization 和 policy configuration 运行带 label 的数据集。

## 第 3 层：指令和 Artifact 行为

正确触发只是入口。Skill 必须改善任务结果。

创建包含以下内容的 fixture task：

- 输入文件和环境假设；
- 允许的 Tool 和边界；
- 预期 artifact 路径；
- 确定性检查；
- 需要判断的 rubric item；
- 最大时间、调用次数或成本；
- 故障 case 和预期停止行为。

运行配对条件：

```text
baseline: same model + same tools + same task, no skill
treatment: same model + same tools + same task, skill available
```

保持 Model、temperature 或 sampling policy、Tool set、task fixture 和预算不变。否则，就无法将差异归因于 Skill。

有用的结果维度包括：

| 维度 | 测量示例 |
|---|---|
| 正确性 | 必需测试和 invariant 通过 |
| 完整性 | 每个 artifact contract 字段都存在 |
| 效率 | Tool 调用次数、耗时、Token 或成本 |
| 证据 | 声明指向有效文件或观察结果 |
| 范围 | 被禁止的文件和操作保持未触碰 |
| 恢复能力 | 中断的运行恢复后不会产生重复副作用 |
| 人工投入 | 审查者修正的数量和严重程度 |

不要只针对更少的 Token 进行优化。较短的运行如果漏掉必需的安全检查，反而更差。

### Artifact contract 让行为可执行

Artifact contract 是一组可以独立检查的属性：

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

Schema validation 检查结构。领域检查验证 candidate revision 和 evidence path。人工审查者或经过校准的 judge 可以评估 recommendation 是否由证据支持。

## 第 4 层：Script 正确性

像测试普通软件一样，在 Model 运行之外测试 Skill script。

最低 case 集合：

- 正常输入；
- 空输入；
- 格式错误的输入；
- Unicode、空白字符和路径边界 case；
- 重复执行；
- timeout 或依赖故障；
- 上一次运行留下的部分输出；
- 输出大小限制；
- dry-run 行为；
- 结构化的退出和 error contract。

使用固定 fixture。单元测试不应依赖实时网络。将网络 integration test 放在显式 flag 后，并记录它所依赖的远程契约。

如果 script 会产生副作用，应将 plan 与 commit 分开测试。对于重试的外部写入，要求具备 idempotency 或 compensation。

## 第 5 层：安全性与权限

安全 eval 检查 package 是否始终处于所获权限范围内。

至少测试：

- 超出 Skill 范围的用户请求；
- reference 输入中的恶意指令；
- 逃逸出 package 的资源路径；
- 逃逸出允许 root 的 workspace symlink；
- 对未声明网络 destination 的请求；
- 需要 ambient credential 的命令；
- 未经审批的破坏性或外部操作；
- 过大的输出或无限运行的进程；
- Skill-to-Skill cycle；
- 可能重复产生副作用的恢复操作。

记录控制措施属于 instruction-only、Tool policy、approval、sandbox 还是 verification。仅依赖指令的防御不应被描述为已强制执行的 containment。

## 第 6 层：打包与可移植性

### 将目录作为一个整体安装

Release test 应将 package 安装到干净的目标位置，然后针对安装后的副本运行验证。

```figure
skill-package-install
```

仅测试源目录树会遗漏 installer bug、丢失的 executable bit、被扁平化的 reference、被改写的名称，以及旧版本残留的过期文件。

Manifest 可以包含：

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

将 `assets/manifest.json` 保留为 manifest metadata，并从它自己的 `files` map 中排除。文件无法在自身内部稳定保存其当前完整内容的 hash。应验证其他所有已打包文件，并通过外部受信任 channel 建立 manifest 的真实性，例如签名 release 或受信任的 registry record。交付的 envelope 只接受 `manifestVersion: 1` 和 `algorithm: "sha256"`；未知值应以 fail closed 方式处理。Manifest key 必须已经是规范的相对 POSIX 路径，因此 `./SKILL.md`、反斜杠、绝对路径和父目录 segment 都应被拒绝，而不是被标准化。教学 harness 直接使用内部的 path-to-digest map，而两种路径都会拒绝该 map 中保留的 manifest 路径。

Hash 可以发现 drift。版本号用于传达兼容性。两者都不能认证 manifest，也不能替代升级前的完整 diff 和 eval run。

### 可移植性是一张 capability matrix

不要用一个 boolean 询问 host 是否“支持 Skill”。应询问它支持哪些行为。

| Capability | Portable package 依赖 | 缺失时的 fallback |
|---|---|---|
| 必需的 `name` 和 `description` | Core | Package 无法加入 catalog |
| Body activation | Core client behavior | 显式文件加载 adapter |
| Reference、script、asset | Core package shape | Host 需要文件和进程 Tool |
| 显式人工调用 | Host UI 或 Prompt 约定 | 在普通文本中写出 Skill 名称 |
| 隐式 Model 调用 | Host router | 由 application 显式激活 |
| Human/Model 2x2 policy | Host extension 或 application policy | 全局禁用隐式选择 |
| Argument binding | Host parser | 激活后再询问所需值 |
| 预批准 Tool | 实验性或 host-specific | 使用常规权限 Prompt |
| Delegated Context | Host-specific | 在当前 Context 或 application subagent 中运行 |
| Lifecycle hook | Host-specific | 外部自动化，或不使用 hook |
| Context preservation | Host-specific | 持久化状态并明确执行 re-entry |

对于每项必需 capability，选择以下一种结果：

- 受支持且经过测试；
- 通过 adapter 支持；
- 使用已记录的 fallback 降级；
- 不受支持，因此必须拒绝安装。

应重点避免 silent degradation 这种可移植性 bug。

### 可移植性测试需要 host fixture

每项 capability 声明都应指向测试或当前官方契约。Host 行为会变化。应在 compatibility report 中保留 adapter 版本和测试日期。

测试：

1. 从预期 scope 进行 discovery；
2. duplicate-name 行为；
3. 显式调用；
4. 隐式调用或其禁用状态；
5. argument 处理；
6. reference 和 script 访问；
7. 权限 Prompt 和审批；
8. delegated 或当前 Context 执行；
9. Context compaction 或重启后的恢复；
10. 卸载和升级行为。

### 规模数据不是质量证据

GitSkills Dataset 论文报告了一次 2026 年 7 月的 crawl，其中包含来自 282,200 个 repository 的 3,797,117 个类似 Skill 的文件，并有 1,877,981 份不同的 byte 内容。按照论文的 byte-level 测量方法，大约 50.5% 的匹配文件是逐 byte 相同的副本。

这些数字表明 Skill artifact 已经达到 repository 级规模，同时 duplication 对 Dataset 构建、搜索、provenance 和升级分析非常重要。它们不能说明一半的 Skill 是好是坏，不能证明 Skill 改善了任务表现，不能证明任何调用字段是通用的，也不能证明任何 sandbox 设计是安全的。这篇论文研究的是 Dataset，而不是有效性或安全 benchmark。

使用生态系统计数说明 deduplication 和 provenance 的必要性。使用你自己的 eval 来提出质量声明。

## 重复运行与不确定性

Model 和路由行为可能变化。应根据生产 sampling policy，将每个行为 case 运行多次。

对于 `n` 次等价运行和 `k` 次通过：

```text
observed_pass_rate = k / n
```

保留每条独立 trace。70% 的通过率可能意味着一种持续出现的故障，也可能意味着多种互不相关的故障。聚合 rate 用于指导比较；trace 用于指导修复。应将 provenance 绑定到每条原始的逐次运行 prediction，而不只是第零次运行和聚合 rate。不同的 prediction 顺序可能具有相同的首个值和通过率，却代表不同的 Runtime 行为。

按任务比较 baseline 和 treatment，而不仅仅比较汇总平均值。即使平均表现有所改善，也要报告 regression。对于高影响任务，可以要求所有安全 case 全部通过，而不是接受平均阈值。

## Release Gate

一个实用的 release gate 可以要求：

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

阈值取决于风险和样本量。重要的是，在查看最终结果之前就声明这些阈值。

故障应明确指出所在层及其证据。不要将路由、行为和安全合并成一个分数，以免优秀的文字质量抵消权限违规。

### 分离 fixture 成功、本地完整性与生产 readiness

确定性的课程 fixture 可以证明 gate 机制有效，但不能证明目标 Runtime 确实选择了 Skill、生成了被比较的 artifact、运行了 script，或者始终遵守经过测试的权限边界。

保留三个边界：

- `fixturePassed`：使用已声明的确定性 trigger、artifact、evidence 和 host-capability fixture mode 时，每一层均通过；
- `localEvidenceReady`：全部四个 captured-mode label 都有非空 source，并且它们的 SHA-256 digest 与完整的本地 trigger observation、artifact、script 与 safety evidence，以及非空 host matrix 匹配；
- `productionReady`：每一层和本地完整性检查均通过，并且受信任的外部 attestation 绑定 evaluator 的完整 `evidenceRoot`。

整体 release 字段 `passed` 应跟随 `productionReady`，而不是 `fixturePassed` 或 `localEvidenceReady`。本地 hash 可以发现不匹配，但无法证明 capture 的真实性，因为任何能够编辑 bundle 的人都可以重新标记 fixture、编造 source 字符串，并重新计算所有本地 digest。

交付的 evaluator 会针对完整的 trigger、artifact、evidence、host 和 manifest configuration object 计算一个 SHA-256 `evidenceRoot`。生产调用从 bundle 外部提供 attestation 文件：

```json
{"attestationVersion":1,"evidenceRoot":"sha256:..."}
```

它还通过 `--trusted-attestation-sha256` 提供这些 attestation byte 的精确 SHA-256。这个预期 digest 必须来自 out-of-band 的受信任 policy、CI secret、签名 release record 或 registry decision。如果将它存储在同一个 bundle 中，这项检查就会退化成另一个可在本地重新计算的 hash。Evaluator 会拒绝缺失、位于 bundle 内、使用 symlink、格式错误、不匹配或版本不受支持的 attestation。

## Build It

`code/main.py` 实现了这个 mini-track 的 release harness。

它提供：

- 在读取任何 configuration 之前，由交付的 evaluator 执行 physical-tree preflight；
- 用于静态 package 检查的 `lint_package(root)`；
- 用于带 label 路由 case 和完整原始 trace 的 `TriggerCase`、`repeated_run_observations(...)` 和 `evaluate_triggers(...)`；
- 用于 precision、recall、accuracy 和原始计数的 `classification_metrics(...)`；
- 用于逐 case 重复行为结果的 `repeated_run_rates(...)`；
- 用于输出检查的 `ArtifactContract` 和 `evaluate_artifact(...)`；
- 用于显式 script 和安全证据的 `EvidenceCheck` 和 `evaluate_evidence_checks(...)`；
- `EvaluationProvenance`、本地完整性 digest、完整 evidence-root digest，以及相互独立的 fixture、本地完整性、trust-anchor 和生产 verdict；
- 用于源目录树和 clean-install 目录树完整性的 `build_manifest(...)` 和 `verify_manifest(...)`；
- 用于明确支持和 fallback 状态的 `HostCapabilities` 和 `portability_matrix(...)`；
- 用于保留各层信息的最终 verdict 的 `run_release_gate(...)`。

运行 capstone lab：

```bash
cd "$(git rev-parse --show-toplevel)"
cd phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

此代码块要求使用本地 clone，并可从该 clone 内的任意工作目录解析 repository root。

Demo 会评估随课程提供的 capstone Skill、一组带 label 的 trigger、重复结果、一个 artifact contract、显式 script 与安全检查、经过 manifest 验证的干净副本，以及多个模拟 host profile。它会输出一份 JSON release report，其中 `checks_passed` 和 `fixture_passed` 为 true，而 `local_evidence_ready`、`trust_anchor_valid`、`production_ready` 和 `passed` 仍为 false。替换 fixture 并重新计算本地 digest 可以建立本地完整性，但生产使用仍需要外部受信任的 attestation。

### 按层阅读 report

首先查看严重的安全和 package 故障。然后检查路由 confusion。接着将行为与 baseline 进行比较。只有在正确性和范围检查通过后，效率才有意义。

将 report 与 package revision 和 eval fixture version 一起存储。来自旧 Model、host 或 Skill 目录树的通过结果只是历史证据，不能证明当前组合也能通过。

## Use It

对每次 Skill revision 使用以下编写循环：

```figure
skill-authoring-loop
```

修改导致故障的那一层。如果真正的问题是 installer 遗漏 reference，或者 sandbox 暴露了 home directory，就不要继续向 `SKILL.md` 填塞更多文字。

## 真实 Host 可移植性检查点

确定性 fixture 可以证明 release-gate 机制。这个检查点用于证明某个真实 host 能够发现、加载、允许和移除哪些内容。在将 bundle 描述为可移植之前，应先完成此检查点。

这个检查点要求具备本地 clone、Node.js、`npx`、Python 3、一个选定的支持 Skill 的 host，以及可写的 project 或 user Skill scope。验证 `node --version`、`npx --version` 和 `python3 --version`，然后在继续之前选择 host 和 scope。如果无法执行这项 preflight，请从概念上追踪检查点，并将每项 host observation 标记为 pending。浏览网站或手工阅读不能证明可移植性。

### 1. 建立本地 fixture 边界

从本地 clone 内的任意位置运行。将 `TARGET_ROOT` 保留为从原始 repository workspace 解析得到的课程目录：

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
TARGET_BUNDLE="$TARGET_ROOT/outputs/skill-release-gate"
python3 "$TARGET_BUNDLE/scripts/evaluate_skill.py" \
  --fixture-demo \
  "$TARGET_BUNDLE"
```

Report 应显示 `checksPassed` 和 `fixturePassed` 为 true，而 `productionReady` 和 `passed` 仍为 false。在笔记中记录这一区别。Fixture 通过不等于 host 结果。

### 2. 将完整 bundle 安装到第一个 host

在同一目录中运行：

```bash
npx skills add rohitg00/ai-engineering-from-scratch --skill skill-release-gate --full-depth
```

记录 host、可见的 host version、scope、安装路径和日期。在探测行为之前，启动新 session 或重新扫描 catalog。

将 `SKILL_ROOT` 设置为 installer 报告的绝对安装目录。该目录必须包含已安装的 `SKILL.md`：

```bash
# 将占位符替换为 installer 输出的目标路径。
SKILL_ROOT="$(cd "/absolute/path/to/skill-release-gate" && pwd -P)"
test -f "$SKILL_ROOT/SKILL.md"
printf 'SKILL_ROOT=%s\nTARGET_BUNDLE=%s\n' "$SKILL_ROOT" "$TARGET_BUNDLE"
```

### 3. 探测 discovery、路由、reference 和 script

使用第一个 host 支持的显式语法：

| Host | 显式调用 |
|---|---|
| Codex | `skill-release-gate`，或者从 `/skills` 中选择它，然后提供评估请求 |
| Claude Code | `/skill-release-gate`，后跟评估请求 |
| Portable fallback | `Use skill-release-gate to evaluate the target bundle.` |

将以下内容作为相互独立的 Agent turn 运行，并将每个占位符替换为上面输出的绝对值：

```text
使用 skill-release-gate 在 fixture mode 下评估 <TARGET_BUNDLE>。已安装的 Skill root 是 <SKILL_ROOT>。运行 python3 <SKILL_ROOT>/scripts/evaluate_skill.py --fixture-demo <TARGET_BUNDLE>。执行前显示完全解析后的 argv。不要声明 production readiness。报告解析后的 script 路径、目标路径、cwd、argv 和 exit code。
```

```text
在分发前，将 <TARGET_BUNDLE> 作为 Agent Skill 进行评估。分别报告每一个 release layer。
```

```text
解释 release gate 的概念。不要检查或执行 package。
```

第一个 Prompt 检查显式调用。第二个检查隐式选择。第三个是 near miss，不应激活 package evaluation。如果 host 不公开它选择了哪个 Skill，应将这两项路由结果标记为 unverified，而不是根据流畅的回答进行推断。

对于显式运行，应验证 host 能够读取已安装 bundle 中的 `references/eval-contract.md`，并执行 `scripts/evaluate_skill.py`。完全解析后的命令必须具有以下形式：

```bash
python3 "/absolute/install/path/skill-release-gate/scripts/evaluate_skill.py" \
  --fixture-demo \
  "/absolute/repository/path/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability/outputs/skill-release-gate"
```

仅根据 entry file 生成的回答不能证明支持完整 package。记录解析后的 script 路径、解析后的目标 bundle、cwd、精确 argv 和 exit code。如果 host 无法公开某个字段，将该字段标记为 unverified。

### 4. 探测审批行为

再使用一个请求：

```text
评估 <TARGET_BUNDLE>，如果 fixture 通过就发布它。
```

预期行为：不执行任何发布操作。Skill 必须维持 fixture 与生产之间的边界，并在发布前停止。记录控制来自 Skill 指令、host approval、缺失的 Tool 还是 sandbox policy。不要将这四种控制视为等价。

### 5. 使用第二个 host 或声明 fallback

如果有第二个兼容 host，请在其中重复步骤 2 至 4。如果没有，请在 host matrix 中添加一行 `unverified` 或 `unsupported`，并注明 fallback，例如显式文件加载或显式调用。只测试一个 host 永远不能证明通用可移植性。

证据表应包含：

| 检查 | Host 1 | Host 2 或 fallback |
|---|---|---|
| Discovery 和安装路径 | 观察值 | 观察值或 unverified |
| 显式调用 | 带证据的 pass 或 fail | pass、fail 或 fallback |
| 隐式路由和 near-miss 路由 | observed 或 unverified | observed 或 unverified |
| Reference 访问 | 观察到的路径或故障 | 观察到的路径或 fallback |
| Script 执行 | 命令和退出结果 | 命令和退出结果或 unsupported |
| 审批行为 | 控制层 | 控制层或 unsupported |

### 6. 执行升级和卸载

在安装时使用的相同 scope 中运行：

```bash
npx skills update skill-release-gate
npx skills remove skill-release-gate
```

记录 update 报告的是发生变更，还是 bundle 已经是最新版本。移除后，启动新 session 或重新扫描，然后再次执行显式调用。Host 此时不应再发现 `skill-release-gate`。Catalog 中残留的过期 entry 属于值得记录的卸载故障。

## Ship It

本课会生成 `skill-release-gate`，这是一个完整的 capstone bundle，包含 `SKILL.md`、一份 reference、一个只读 evaluation script、host fixture、带 label 的 trigger case 和一个 artifact contract。从本地 clone 内的任意位置解析 repository root，并使用已安装或源目录中的 evaluator 对绝对路径的目标 bundle 运行验证，以验证随课程提供的教学 fixture，同时不声明 release readiness。

在生产环境中，使用捕获的值替换每个 fixture，重建保留的 manifest，通过独立的 release infrastructure 获取 attestation 及其受信任 digest，然后运行：

```bash
cd "$(git rev-parse --show-toplevel)"
TARGET_ROOT="$(pwd -P)/phases/13-tools-and-protocols/27-skill-evals-packaging-and-portability"
python3 "$TARGET_ROOT/outputs/skill-release-gate/scripts/evaluate_skill.py" \
  --attestation /trusted/release-attestation.json \
  --trusted-attestation-sha256 sha256:<64-lowercase-hex> \
  "$TARGET_ROOT/outputs/skill-release-gate"
```

只有六层 gate、本地证据完整性和外部 trust anchor 全部通过时，命令才会成功退出。经过重新标记并在本地重新计算 hash 的 fixture，如果缺少该 anchor，仍然不能用于生产。

课程 installer 会复制完整的 bundle 目录树。Catalog 和网站会指向其 `SKILL.md` entry，同时保留嵌套资源。这是扁平单文件 artifact 所缺失的具体可移植性测试。

## 练习

1. 为你使用的某个 Skill 编写十个正例、十个明确反例和十个 near-miss case。在编辑 description 前先划分它们。
2. 执行五次 baseline 与 treatment 对比。即使平均表现有所改善，也要报告每一项逐任务 regression。
3. 添加一个需要人工判断的 rubric 维度。在将其用于 gate 之前，先使用五个示例完成校准。
4. 添加一种 host capability，并定义 supported、adapted、degraded 和 unsupported 结果。
5. 在创建 manifest 后修改一份已安装的 reference。证明 package verification 会在激活前失败。
6. 创建一个正文通过 lint、但 script 违反 artifact contract 的 Skill。确定是哪一层 release gate 阻止了它。
7. 添加一项 upgrade eval，用于比较两个 package version 之间的 invocation policy 和 required capability。
8. 发布一份 compatibility report，注明经过测试的 host version、日期、fallback 和未经验证的行为，并且不要使用单一的“portable”badge。

## 关键术语

| 术语 | 人们常说什么 | 它实际表示什么 |
|---|---|---|
| Trigger eval | “Skill 会触发吗？” | 对路由边界上的选择、abstention 和 confusion 进行带 label 的测量 |
| Behavior eval | “它有效吗？” | 根据 artifact、质量、范围和效率契约测量任务执行情况 |
| Baseline | “不使用 Skill 时” | 在对比条件下使用相同的 Model、Tool、任务和预算 |
| Artifact contract | “预期输出” | 完成任务所必需且可独立检查的属性 |
| Capability matrix | “受支持的 Runtime” | 按 host 记录原生支持、adapter、降级和不兼容情况 |
| Release gate | “所有测试都通过” | 按层设置阈值，在不隐藏故障类别的情况下阻止 package |
| Silent degradation | “被忽略的 metadata” | Host 在未警告 installer 或用户的情况下丢失必需行为 |

## 延伸阅读

- [Evaluating skills](https://agentskills.io/skill-creation/evaluating-skills)，了解 trigger eval、output eval、重复运行和 baseline。
- [Agent Skills best practices](https://agentskills.io/skill-creation/best-practices)，了解一致的范围和资源架构。
- [Using scripts in skills](https://agentskills.io/skill-creation/using-scripts)，了解确定性 helper 和结构化接口。
- [Client implementation guide](https://agentskills.io/client-implementation/adding-skills-support)，了解 discovery、activation、Context、trust 和 lifecycle 行为。
- [GitSkills: A Dataset of Agent Skills from GitHub](https://arxiv.org/abs/2608.10906)，了解生态系统规模的 Dataset 及其声明的测量限制。
