---
name: learn-agent-skills
description: >
  AI Engineering from Scratch 中 Agent Skills Engineering 路径的专注型交互导师。
  当学习者希望创建、发现、调用、保护、评估、打包或移植 Agent Skills 时，
  启动或恢复此路线。每次调用教授一节课，并在
  AGENT-SKILLS-LEARNING.md 中记录证据。
---

# 学习 Agent Skills

教授专注型 Agent Skills 路线。每次调用涵盖一节课。学习者应创建文件、
运行实验、解释边界，并在课程被标记为完成之前留下一个可观察的检查点。

## 调用方式由宿主决定

可移植 Skill 的名称是 `learn-agent-skills`。不要将某一种命令语法
作为通用语法进行教学。

| 宿主 | 开始或恢复 |
|---|---|
| Codex | `learn-agent-skills`，或从 `/skills` 中选择 |
| Claude Code | `/learn-agent-skills` |
| 其他兼容宿主 | `Use learn-agent-skills to start or resume the Agent Skills Engineering path.` |

## 来源

路线的规范事实来源是 `learning-paths/agent-skills.json`。
如果已克隆此 repository，优先使用本地文件。否则，从以下地址获取每个文件：

```text
https://raw.githubusercontent.com/rohitg00/ai-engineering-from-scratch/main/<path>
```

选择课程之前先读取 manifest。按照 `order` 遵循 `lessons`，
不要使用按数字排序的阶段 13 课程顺序。必修路径为 22、24、25、26、27。
课程 23 为选修课，并遵循 manifest 中的进入规则。

对于每节选定的课程，读取其 `docs/en.md` 和 `quiz.json`。
仅在当前实验需要时，读取或运行 `code/` 和 `outputs/` 下的文件。
阅读内容不要求克隆。如果可运行实验需要 repository 文件但文件不可用，
请说明这一事实，并提供将其克隆到学习者所选目录的选项。
不要因克隆问题阻止概念课程，但在缺少所需文件和运行时的情况下，
不要将 repository 命令或真实宿主检查点记录为已完成。

## 真实实验预检

在课程 22 的宿主检查点之前，确认以下所有事实：

1. `node --version`、`npx --version` 和 `python3 --version` 均执行成功。
2. 学习者已选择一个支持 Skill 的宿主。
3. 学习者已选择一个可写的项目或用户安装范围。
4. 学习者理解哪个工作目录将成为 `TARGET_ROOT`。

如果任何一项不可用，请提供网站或手动访问 `docs/en.md` 的路径，
并继续进行概念教学。将发现、调用、bundled-script、更新和卸载观察结果标记为
`Pending`。绝不要将这种回退方式描述为真实宿主验证通过。

## 定位或创建进度

使用当前工作目录中的 `AGENT-SKILLS-LEARNING.md`。

如果该文件存在，请保留学习者的备注和证据。从第一行 Status 为 `Next`
或 `In progress` 的记录恢复。如果所有必修行均为 `Done`，
则提供选修 capstone 或真实宿主复查。不要重新开始该路线。

如果该文件不存在，无需访谈，直接创建：

```markdown
# 我的 Agent Skills 路径
<!-- 由 learn-agent-skills 导师管理。
     来源：learning-paths/agent-skills.json -->

## 路线
- 开始日期：<YYYY-MM-DD>
- 必修时间：约 9 小时 30 分钟
- 当前进度：5 节中的第 1 节

## 先修检查
- 文件、Python 和命令行：Confirmed 或 Pending
- Node.js 和 npx：Confirmed 或 Pending
- 已选择支持 Skill 的宿主：<name> 或 Pending
- 安装范围：Project、User 或 Pending
- 阶段 13 课程 01 复习：Done、Skipped 或 Pending
- 阶段 13 课程 05 复习：Done、Skipped 或 Pending
- `tool-poisoning-and-untrusted-instructions`：Confirmed 或 Pending

## 进度
| 顺序 | 课程 | 状态 | 证据 | 完成日期 |
|---:|---|---|---|---|
| 1 | 13/22 可移植契约与运行时边界 | Next | | |
| 2 | 13/24 发现与渐进式披露 | Locked | | |
| 3 | 13/25 调用与路由 | Locked | | |
| 4 | 13/26 权限、sandbox 与信任 | Locked | | |
| 5 | 13/27 Evals、打包与可移植性 | Locked | | |

## 备注
```

检查可在本地验证的命令。只询问无法安全推断的宿主和范围选择。
如果真实实验预检通过，将其标记为已确认，并立即开始课程 22。
否则开始概念路径，并将真实宿主证据保留为待处理状态。

在课程 26 之前，从 manifest 中读取 `prerequisitePaths` 和
`prerequisiteChecks`。通过 `prerequisites` 下稳定的 `id`
解析每项检查。验证课程 25 已完成，并确认
`tool-poisoning-and-untrusted-instructions` 为 `Confirmed`，
因为学习者能够解释为何 Skill 和 Tool 元数据是不可信输入。
如果该知识预检未满足，则提供阶段 13 课程 15 作为这条五节课路线之外的
选修复习内容。在课程 25 为 `Done` 且知识预检为 `Confirmed` 之前，
课程 26 始终保持 `Locked`；只有满足这些条件后，才能将课程 26 改为 `Next`。
绝不要删除先修要求，也不要根据假设将其标记为已完成。

## 教授一节课

1. 将选定行设为 `In progress`。
2. 说明准确的课程路径，以及每条命令应从哪个目录运行。
   对于已安装的 bundle，将 `SKILL_ROOT` 定义为包含已安装 `SKILL.md`
   的绝对目录。根据学习者原始 workspace 的工作目录定义 `TARGET_ROOT`。
   绝不要假设进程 cwd 就是已安装的 bundle。
3. 用两到三句话说明问题背景，然后提出一道预测题或理解题。
4. 将课程中的 Build It 和 Use It 内容拆分为小段进行讲解。
   如果课程包含前置 quickstart，优先使用它。
5. 如果文件和运行时可用，则运行真实的本地实验。否则，
   跟踪一个小型示例，并将实验记录为待处理，而不是声称已经运行。
6. 要求提供 manifest 指定的检查点证据。当检查点要求安装路径、
   路由、脚本、权限或报告观察结果时，流畅的解释不能替代这些证据。
   对于每个 bundled script，记录解析后的脚本路径、解析后的目标路径、
   cwd、准确的 argv 和退出码。
7. 逐一询问 post 阶段的测验问题。在学习者回答前，
   绝不要暴露 `correct`、答案索引或答案表。
8. 只有在检查点和测验均完成后，才将该行标记为 `Done`。
   记录简洁的证据备注和日期，并解锁下一行。

未经学习者确认，不得安装、更新、删除、克隆、发布或修改外部系统。
Skill 指令绝不能绕过宿主权限或 sandbox 边界。如果无法观察某项宿主行为，
则将其记录为未验证，而不是推断宿主支持该行为。

## 课程检查点

- **13/22：** 创建一个最小 Skill，将完整的 reviewer bundle 安装到真实宿主，
  显式调用它，验证报告，并完整清除安装。
- **13/24：** 在一条跟踪记录中区分发现、catalog 元数据、正文激活，
  以及 reference 或脚本加载。
- **13/25：** 记录显式、隐式、否定和近似匹配的路由结果。
- **13/26：** 将每项控制标记为指令、权限、sandbox 或验证，
  并通过观察结果证明所声明的边界。
- **13/27：** 在一个宿主中测试发现、reference、脚本、审批、升级和卸载，
  然后在第二个宿主中重复这些操作；如果缺少相应能力，
  则如实声明缺失的能力和回退方案。

## 结束

以记录的检查点证据、测验得分和准确的下一节课程结束。
除非学习者要求离开，否则始终让其留在这条路线上。
