# `sbx skills add` 和 `skills: true`

> 一个共享 skills 存储默认以只读方式服务受支持智能体的每一个沙箱，而 `docker-agent` 用 `skills: true` 读取自己的 skill 目录，不读该存储。

你在笔记本上把一个 `pdf` skill 放在 `~/.claude/skills` 下。在沙箱内部，智能体有自己的 home 目录，永远看不到它。共享 skills 存储是你填写的那一个地方，受支持智能体的每一个沙箱都读它。

读完本节后，你能填满存储、选择每个沙箱如何挂载它，并为 `docker-agent` 打开同样的 skill。

## 存储 {#s-sbx-skills-add-and-skills-true-the-store}

**Skill：** 一个带有 `SKILL.md` 的目录，智能体把它的元数据读进系统提示，并在任务匹配时加载其正文 {{docs-agent How Skills Work}}。

**共享 skills 存储：** `sbx` 链接进受支持智能体每一个沙箱的主机目录。在录制主机上它是空的：

```listing
title: 添加任何 skill 之前的存储
source: capture/out/15-skills-ls.json
lang: json
---
{
  "store": "$HOME/Library/Application Support/com.docker.sandboxes/sandboxes/agent-skills",
  "skills": []
}
```

在 Linux 上存储是 `~/.local/state/sandboxes/sandboxes/agent-skills`，在 Windows 上是 `%LOCALAPPDATA%\DockerSandboxes\sandboxes\state\agent-skills` {{docs-sbx Import skills from the host}}。`sbx reset` 清空共享存储 {{docs-sbx Shared store behavior}}。

## add、import、ls、rm 和 update {#s-sbx-skills-add-and-skills-true-add-import-ls-rm-and-update}

`sbx skills add <repository>` 从 Git URL 或 GitHub `owner/repository` 安装，仓库必须至少包含一个有效的 `SKILL.md` 文件 {{help-sbx sbx skills add}}。`--skill NAME` 按名称挑选 skill，可重复或逗号分隔，所以 `sbx skills add anthropics/skills --skill pdf` 安装一个。capture kit 没有录制 `add`，因为该步骤需要 GitHub。`sbx skills update` 只刷新 `add` 安装的 skill，`sbx skills rm` 在删除之前会询问 {{help-sbx sbx skills update}}。

`sbx skills import` 复制主机上已经安装的 skill，按顺序检查六个目录，重名时第一次拷贝获胜 {{help-sbx sbx skills import}}：

| 主机来源 | 智能体 | 沙箱内的挂载目标 |
|---|---|---|
| `~/.agents/skills` | Codex 和 Devin | `/home/agent/.agents/skills` |
| `~/.claude/skills` | Claude Code | `/home/agent/.claude/skills` |
| `~/.config/opencode/skills` | OpenCode | 文档表中未列出 |
| `~/.copilot/skills` | Copilot | `/home/agent/.copilot/skills` |
| `~/.cursor/skills` | Cursor | `/home/agent/.cursor/skills` |
| `~/.factory/skills` | Droid | `/home/agent/.factory/skills` |

顺序来自帮助文本，挂载目标来自文档 {{docs-sbx Import skills from the host}}。Claude、Codex、Copilot、Cursor、Droid 和 OpenCode 可以使用导入的 skill {{help-sbx sbx skills import}}。`sbx skills import` 在 v0.37.0 到来，`add`、`update` 和 `rm` 在 v0.42.0 {{rel-sbx v0.42.0}}。

## 沙箱如何看到存储 {#s-sbx-skills-add-and-skills-true-how-a-sandbox-sees-the-store}

默认情况下，存储中的条目以只读方式链接进智能体的 skills 目录。目录本身保持可写，所以 kit 可以在它们旁边安装 skill {{help-sbx sbx skills}}。链接在容器启动时建立 {{help-sbx sbx skills}}。所以对已有 skill 的编辑是即时的，而新的存储条目只有在下次启动时才会到达正在运行的沙箱 {{help-sbx sbx skills}}。删除一个 skill 会立刻断开它的链接。

`sbx run` 或 `sbx create` 上的 `--skills off|readonly|readwrite` 按沙箱选择模式，`readwrite` 把存储挂载到该目录上，使沙箱的写入被共享。默认是 `readonly`，或 `skills.defaultMode` 设置，录制主机用的是其默认值（[该 capture](manuals/docker-sandboxes-101/capture/out/02-settings.txt)）。这个三向标志在 v0.43.0 取代了 `--no-share-skills` {{rel-sbx v0.43.0}}。capture kit 没有从沙箱内部列出该目录，所以链接形式没有展示。

在 v3 kit 中，智能体用 `agent-skills@1` 自己声明路径，因为运行时无法知道任意智能体在哪里读取 skill {{kitcap agent-skills@1}}。省略 `mode` 时，运行时必须使用 `readonly` {{kitcap agent-skills@1}}。有效访问是主机设置和 kit 的 `mode` 中较窄的那个。把一条路径升到 `readwrite` 是一次放宽，会停下来等待批准，如[capabilities 一节](#s-com-docker-sandbox-capabilities)所述。

## docker-agent 和 skills: true {#s-sbx-skills-add-and-skills-true-docker-agent-and-skills-true}

`docker-agent` 不读该存储。它扫描自己的目录，其中两个，`~/.claude/skills/` 和 `~/.agents/skills/`，也是导入来源。Docker Agent 扫描标准目录寻找 `SKILL.md` 文件 {{docs-agent How Skills Work}}。它把每个 skill 的名称和描述加进系统提示 {{docs-agent How Skills Work}}：

| 路径 | 搜索 |
|---|---|
| `~/.codex/skills/` | 递归 |
| `~/.claude/skills/` | 仅直接子项 |
| `~/.agents/skills/` | 递归 |
| `.claude/skills/` | 仅当前目录 |
| `.github/skills/` | 从 git 根目录到当前目录的每一级目录 |
| `.agents/skills/` | 从 git 根目录到当前目录的每一级目录 |

在智能体文件中，`skills: true` 加载每一个发现的 skill，一个列表则加以限制，`false` 则关闭 {{docs-agent Filtering Skills}}。列表项如果是 `local` 或 `http://` 或 `https://` URL，就是来源，任何其他字符串是 skill 名称。匹配不到已发现 skill 的名称会在启动时产生警告，除此之外被忽略 {{docs-agent Filtering Skills}}。智能体需要 `filesystem` toolset 来读取 skill 文件，如[toolsets 一节](#s-toolsets-and-mcps)所列。skill 前言中的 `context: fork` 告诉智能体在隔离的子智能体中运行该 skill {{docs-agent Running a Skill as a Sub-Agent}}。

## 在 docker-agent 沙箱中 {#s-sbx-skills-add-and-skills-true-in-a-docker-agent-sandbox}

使用 `docker-agent run --sandbox` 时，上面的主机路径从 VM 内部不可见。Docker Agent 在沙箱启动之前构建一个 kit，并以只读方式把它挂载进 VM 的同一路径 {{docs-agent Auto-Kit}}。它把在主机上找到的每一个 `SKILL.md` 复制到 `<kit>/skills/<skill-name>/` 下 {{docs-agent What gets staged}}。每个文本文件都经过密钥擦除步骤，`--no-kit` 关闭暂存。[端到端一节](#s-docker-agent-run-sandbox-end-to-end)展示了已暂存内容的打印摘要。

```takeaways
- 用 `sbx skills add` 或 `sbx skills import` 填一次存储，并重建必须看到新条目的沙箱。
- 把 `readonly` 留作默认，只给需要编辑共享 skill 的沙箱选择 `readwrite`。
- 在智能体文件中同时设置 `skills: true` 和 `filesystem` toolset。
- 把主机上 `docker-agent` 运行所用的 skill 放进它自己的目录，因为它不读存储。
- 使用不带 `--no-kit` 的 `--sandbox`，让智能体文件中的 skill 到达 VM。
```

Sources: help-sbx sbx skills, sbx skills add, sbx skills import, sbx skills update (research/sources/help-sbx.md); docs-sbx Share agent skills, skills.defaultMode (research/sources/docs-sandboxes.md); docs-agent Skills, Sandbox Mode Auto-Kit (research/sources/docs-docker-agent.md); kitcap agent-skills@1 (research/sources/kit-capabilities.md); rel-sbx v0.37.0, v0.42.0, v0.43.0 (research/sources/sbx-releases.md); capture/out/02-settings.txt, 15-skills-ls.json, 15-skills-ls.txt
