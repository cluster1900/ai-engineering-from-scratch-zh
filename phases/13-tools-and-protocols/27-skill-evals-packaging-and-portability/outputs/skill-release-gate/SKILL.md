---
name: skill-release-gate
description: 在发布前评估 Agent Skill 目录包的结构完整性、触发质量、产物改进、脚本正确性、安全性、已安装目录树完整性和目标主机可移植性。
license: MIT
metadata:
  lesson: "27"
---

# Skill 发布关卡

在发布或分发 Agent Skill 目录包之前使用此 Skill。

## 工作流

1. 将 `SKILL_ROOT` 解析为包含此已安装
   `SKILL.md` 的绝对目录。不要假定进程 cwd 就是已安装的目录包。
2. 根据原始工作区工作目录解析 `TARGET_ROOT`，并
   将用户提供的候选项解析为绝对路径 `TARGET_BUNDLE`。
3. 从 `SKILL_ROOT` 读取 `references/eval-contract.md`。
4. 检查以下位置中的正向和近似未命中触发案例
   `TARGET_BUNDLE` 下的 `evals/cases.json`。
5. 检查以下位置中的共享基线断言和使用 Skill 时的断言
   `TARGET_BUNDLE` 下的 `evals/artifacts.json`。
6. 检查以下位置中的显式脚本和安全结果
   `TARGET_BUNDLE` 下的 `evals/evidence.json`。
7. 检查以下位置中声明的运行时能力
   将 `assets/hosts.json` 放在 `TARGET_BUNDLE` 下，并验证目标文件的哈希值
   是否与其 `assets/manifest.json` 匹配。
8. 对于生产环境，替换确定性预测、产物、证据，
   以及带有捕获结果的主机能力；设置全部四种捕获模式；
   并将每条原始触发观测、两份产物、完整的
   证据集以及非空主机Matrix绑定到非空来源和
   匹配的 SHA-256 来源摘要。这些本地检查可以设置
   `localEvidenceReady`，但可在本地重新计算的哈希无法证明采集过程。
9. 获取一份外部 JSON 证明，其 `evidenceRoot` 与报告匹配，
   并从独立的可信策略或发布渠道获取其精确字节的
   SHA-256。该证明必须是目标目录包之外的常规文件
   目录包。
10. 执行前，显示解析后的准确 argv。对于已安装评估器的
    `SKILL_ROOT` 下的 `scripts/evaluate_skill.py`。对于课程随附的
    fixture，使用 `python3`、该评估器的绝对路径、
    `--fixture-demo` 和绝对路径 `TARGET_BUNDLE` 构建 argv。对于生产环境，使用
    同一已安装脚本，并带上 `--attestation`、
    `--trusted-attestation-sha256` 和绝对路径 `TARGET_BUNDLE`，但不带
    `--fixture-demo`。
11. 返回 `checksPassed`、`fixturePassed`、`localEvidenceReady`、
    `trustAnchorValid`、`productionReady` 和 `passed`，同时返回证据根、
    评估模式、失败的检查、精确率、召回率、每条原始触发
    观测、各案例的重复运行率、产物比较、脚本和
    安全证据、已安装目录树验证以及可移植性Matrix。
    包含解析后的脚本路径、解析后的目标路径、cwd、准确的 argv
    和退出码。将不可用的观测标记为未验证。

## 输出契约

返回完整的 JSON 评估报告。保留每项特定层级检查及其证据，确保汇总结果通过时不会掩盖路由、产物、脚本、安全性、已安装目录树或可移植性故障。`fixturePassed` 表示教学 fixture 成功。`localEvidenceReady` 仅表示本地摘要完整性。只有当 `productionReady` 还具有有效的目录包外部信任锚时，`passed` 才为 true。

## 失败行为

如果配置无效、来源信息缺失或不匹配、可信证明缺失或无效、文件哈希不同、必需能力缺失，或者任何生产关卡失败，则以非零结果停止并报告失败层级。仅当 `fixturePassed` 为 true 时，显式 `--fixture-demo` 路径才能成功退出，而且它绝不构成发布声明。绝不要自动发布、安装到其他位置、修复证据、作出信任决策或降低阈值。

不要仅仅因为 SKILL.md 可解析或一个正向 Prompt 被激活就发布目录包。当目标遗漏必需的配套文件或忽略必需的运行时扩展时，不要将包标记为可移植。
