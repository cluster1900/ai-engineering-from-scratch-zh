---
name: skill-release-gate
description: Evaluate an Agent Skill bundle for structural integrity, trigger quality, artifact improvement, script correctness, safety, installed-tree integrity, and target-host portability before release.
license: MIT
metadata:
  lesson: "27"
---

<a id="skill-release-gate"></a>

# 技能发布门禁

在发布或分发 Agent Skill 目录包之前，使用此技能。

<a id="workflow"></a>

## 工作流

1. 将 `SKILL_ROOT` 解析为包含已安装 `SKILL.md` 的绝对目录。
   不要假设进程 cwd 就是已安装技能包。
2. 根据原始工作区的工作目录解析 `TARGET_ROOT`，
   并将用户提供的候选包解析为绝对路径 `TARGET_BUNDLE`。
3. 从 `SKILL_ROOT` 读取 `references/eval-contract.md`。
4. 检查 `TARGET_BUNDLE` 下 `evals/cases.json` 中的正例
   和容易误触发的近似反例。
5. 检查 `TARGET_BUNDLE` 下 `evals/artifacts.json` 中
   对基线产物和使用技能后产物共同适用的断言。
6. 检查 `TARGET_BUNDLE` 下 `evals/evidence.json` 中
   明确记录的脚本与安全结果。
7. 检查 `TARGET_BUNDLE` 下 `assets/hosts.json` 中声明的运行时能力，
   并依据其 `assets/manifest.json` 验证目标文件哈希。
8. 面向生产时，用实际采集的结果替换确定性预测、产物、证据和宿主能力；
   设置全部四种采集模式；将每条原始触发观测、两份产物、完整证据集
   以及非空宿主矩阵，都绑定到非空来源和匹配的 SHA-256 来源摘要。
   这些本地检查可以设置 `localEvidenceReady`，但可在本地重算的哈希不能证明采集真实发生。
9. 获取外部 JSON 证明，其 `evidenceRoot` 必须与报告一致；
   同时从独立可信策略或发布渠道获取该文件准确字节的 SHA-256。
   证明必须是位于目标包之外的普通文件。
10. 执行前展示解析后的准确 argv。已安装评估器位于
    `SKILL_ROOT` 下的 `scripts/evaluate_skill.py`。对随课程提供的样例，
    使用 `python3`、评估器绝对路径、`--fixture-demo` 和绝对路径
    `TARGET_BUNDLE` 构建 argv。生产场景使用同一已安装脚本，传入
    `--attestation`、`--trusted-attestation-sha256` 和绝对路径
    `TARGET_BUNDLE`，不使用 `--fixture-demo`。
11. 返回 `checksPassed`、`fixturePassed`、`localEvidenceReady`、
    `trustAnchorValid`、`productionReady` 和 `passed`，并附上证据根、
    评估模式、失败检查、精确率、召回率、每条原始触发观测、
    每例重复运行通过率、产物比较、脚本与安全证据、安装树验证和可移植性矩阵。
    包含解析后的脚本路径、目标路径、cwd、准确 argv 和退出码。
    将无法获得的观测标为未验证。

<a id="output-contract"></a>

## Output contract

输出契约（标题保留为评估器识别的固定接口）。

返回完整的 JSON 评估报告。保留每一层的检查及其证据，防止汇总通过掩盖路由、产物、脚本、安全、安装树或可移植性失败。`fixturePassed` 表示教学样例通过。`localEvidenceReady` 仅表示本地摘要完整性通过。只有 `productionReady` 还具备有效的包外信任锚时，`passed` 才为 true。

<a id="failure-behavior"></a>

## Failure behavior

失败行为（标题保留为评估器识别的固定接口）。

配置无效、来源缺失或不匹配、可信证明缺失或无效、文件哈希不同、必需能力缺失，或任一生产门禁失败时，以非零结果停止并报告失败层。显式的 `--fixture-demo` 路线仅在 `fixturePassed` 为 true 时才可成功退出，而且绝不构成可发布声明。绝不自动发布、安装到其他位置、修复证据、创建信任决策或放宽阈值。

不要仅因 SKILL.md 能解析，或一个正例提示触发成功，就发布技能包。如果目标宿主丢弃必需的配套文件，或忽略必需的运行时扩展，不要将技能包标为可移植。
