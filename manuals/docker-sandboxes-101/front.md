# 如何阅读本手册

> 本手册中的每条命令输出都来自在一台 Mac 上对 sbx 和 docker-agent 的一次录制运行，每条规则都能追溯到一个排了等级的来源。

本手册讲解 Docker Sandboxes，即 v0.47.0 的 `sbx` CLI，以及 Docker Agent，即 v1.149.0 的 `docker-agent` CLI。它从头到尾跟随一项任务：在你信任的文件上运行你不信任的智能体。

## 本手册写给谁 {#s-front-who-this-manual-is-for}

你在真实仓库上运行 Claude Code 或 Codex 这类编程智能体，并且了解 Docker、git 和 YAML。你还没有用过 Docker Sandboxes 或 Docker Agent。

读完最后一个部分后，你能：

- 在沙箱里运行编程智能体，只给它需要的文件，并在不交出凭据的情况下拿回它的提交。
- 读懂 `sbx policy log` 的一行，说出哪条规则允许或阻止了这次连接，以及该改什么。
- 写一份智能体文件，让一组智能体使用本地工具和本地模型运行，录制它，并从 cassette 回放。
- 通过 HTTP API、MCP、ACP 和 A2A 提供同一份智能体文件，并把它作为已签名的 OCI 制品分享。
- 把 2025 年 Docker Sandboxes 插件或 cagent 材料中的任意命令对应到它现在的形式。

[沙箱课程](phases/13-tools-and-protocols/26-skill-permissions-sandboxes-and-trust)讲解一项任务何时需要进程、容器或 microVM 边界。本手册从那门课停下的地方开始，讲两个构建 microVM 边界的产品。

## 本手册是如何写成的 {#s-front-how-it-was-made}

本手册锁定 `sbx` v0.47.0，commit 为 `0411f50e`，发布于 2026-10-05，以及 `docker-agent` v1.149.0，tag commit 为 `bf4169c`，发布于 2026-10-07。这些事实于 2026-10-08 核验。`sbx` 是没有公开源码的专有二进制，所以它的帮助文本排在第一。

事实来自七个来源，按权威性排序。两个来源不一致时，以等级更高的为准，正文也会说明这一点。

| 等级 | 来源 | 本手册从中取用什么 | 来源键 |
|---|---|---|---|
| 1 | `sbx` 0.47.0 和 `docker-agent` 1.149.0 的帮助文本，按二进制打印的原文 | 每条命令、标志、默认值和路径 | `help-sbx` 或 `help-agent` 加上一条命令 |
| 2 | v1.149.0 的 `agent-schema.json` | 智能体文件的每个键、类型和默认值 | `schema` 加上一个定义 |
| 3 | tag v3.0.0-m.8 的 Sandbox Kit Spec v3 | kit 描述符和每项能力 | `kitspec` 或 `kitcap` 加上章节或能力 |
| 4 | Docker 文档，于 2026-10-08 抓取 | 帮助文本未写明的规则和限制 | `docs-sbx`、`docs-agent`、`docs-dmr`、`docs-mcp` 或 `docs-desktop` 加上页面名 |
| 5 | `sbx` 的发行说明和 `docker-agent` 的 changelog | 某项行为何时出现、改变或消失 | `rel-sbx` 或 `rel-agent` 加上版本 |
| 6 | Docker 博客文章和演讲 | 历史和定位，从不作为规则 | `blog` 或 `talk` 加上日期 |
| 7 | `capture/` 中的 capture kit | 本手册展示的每条命令输出、文件和记录 | capture 文件名 |

来源 1 到 5 原样存放在[仓库中（英文原文）](manuals/docker-sandboxes-101/research/sources)，所以每条规则都可以对照其来源核对。本手册用自己的话表述每条规则。博客文章和演讲没有收录。

这些来源在许多地方不一致。最大的是 kit 的各代（[冲突 C13](#s-ref-sources-and-the-conflicts-register)），以及每条启动路径的智能体名称和模板镜像（[C9 和 C61](#s-ref-sources-and-the-conflicts-register)）。其他还有 `sbx` 从不注入的主机密钥（[C7](#s-ref-sources-and-the-conflicts-register)），以及同一台 Mac 上的两个智能体二进制（[C48](#s-ref-sources-and-the-conflicts-register)）。[来源参考](#s-ref-sources-and-the-conflicts-register)列出了每处冲突，以及本手册打印的裁定。

## capture kit {#s-front-the-capture-kit}

capture kit 驱动真实的 `sbx`、`docker-agent` 和 `docker` 二进制，并把它们打印的内容写到[它的输出目录](manuals/docker-sandboxes-101/capture/out)。它掩码每次运行都会变化的值，只用 Python 标准库，并有三个已录制的层级：

| 层级 | 它需要什么 | 它记录什么 |
|---|---|---|
| A | 已安装 `sbx`、`docker-agent` 和 `docker` 客户端，没有守护进程、网络、模型或密钥 | 版本、根帮助、`docker-agent doctor`、`toolsets`、`models list`、一次试运行，以及旧版 Desktop 命令（文件 00、01、16、29） |
| B | `sbx` 已登录，sandboxd 守护进程，从 Docker Hub 拉取镜像，以及对 `example.com` 和 `mcp.deepwiki.com` 的 HTTPS | 沙箱生命周期、端口、`cp`、模板、`--clone`、策略、密钥、MCP、kit、`env plan` 和 skills（文件 02 到 15） |
| M | Docker Desktop 4.94.0，Docker Model Runner 在 TCP 端口 12434 上，已拉取 `ai/qwen3:4b`，再加上容器、Compose、buildx 和本地 registry | 智能体运行、团队、权限、会话、eval、五个服务器、`share`、Model Runner、Compose、`run --sandbox`，以及 v3 kit 构建（文件 17 到 28、98） |

kit 录制于一台搭载 Apple silicon、运行 macOS 26.2 的 Mac。它运行了 `sbx` v0.47.0、`docker-agent` v1.149.0、Docker Desktop 4.94.0，以及带 `ai/qwen3:4b` 的 Docker Model Runner。文档中的默认模型 `ai/qwen3:latest` 在那台 Mac 上因 digest 不匹配而两次拉取失败（[这次 capture](manuals/docker-sandboxes-101/capture/out/25-model-pull-latest.txt)）。因此每份智能体文件都指定同一仓库的 4B tag。

这个 kit 不能在 CI 中离线运行。`sbx` 在 Docker 登录之后从 Docker Hub 上的镜像启动真实的 microVM，智能体运行也需要模型。工具缺失时，`python3 capture/run.py --check` 打印 `skipped` 及原因并以 0 退出。层级 C 需要 Cloud Sandboxes、GitHub token，或对 `~/.ssh/config` 的修改。它没有录制，需要它的各节引用文档。

层级 M 的大多数运行用 `--fake` 回放已录制的 cassette，所以检查是同类对同类。eval、三个服务器、一次带显式 `base_url` 的运行，以及 `run --sandbox`，以 `temperature: 0` 现场调用模型。[kit 的 README](manuals/docker-sandboxes-101/capture/README.md)列出了这次录制运行显示出而文档未写明的内容。

## 约定 {#s-front-conventions}

`docker-agent` 在每条命令中指 Homebrew 二进制，版本 v1.149.0。`docker agent` 指 Docker Desktop 插件，在录制用的 Mac 上是 v1.144.0，只在程序打印它的地方出现。

`$CAPTURE` 代表 capture 目录，`$HOME` 代表家目录。每次运行都会变化的值显示为 `<uuid>`、`<hash>`、`<ts>` 和 `<port>` 这类占位符。层级 M 的命令行省略了指向 `capture/work/` 的 `--config-dir`、`--data-dir` 和 `--cache-dir`。

每节都在手册源文件中记录它的来源，audit 会在那里检查每个引用和数字。各节正文不显示这些来源。来源参考列出了它们。代码清单原样复制 capture 文件中的行，`…` 标出一处删节，由注释加以说明。

图在网页上有动画，Replay 按钮会重新播放各步，印刷版和减少动态效果模式显示最后一帧。

## 第一次运行 {#s-front-a-first-run}

你需要 `sbx` v0.47.0、用 `sbx login` 完成 Docker 登录，以及一条全局网络策略，只需设置一次。这次 capture 把它设为 balanced 预设：

```listing
title: 全局策略，只设置一次
source: capture/out/03-policy-init.txt
lang: text
note: 未删节。
---
$ sbx policy init balanced
Global network policy initialized to "balanced".
[exit 0]
```

然后建一个临时目录，并在其上打开一个 shell 沙箱：

```bash
mkdir -p ~/sbx-scratch
sbx run shell ~/sbx-scratch
```

`sbx run shell` 在一个新沙箱里给你一个 Bash 登录 shell，名称按默认的 `<agent>-<workdir>` 叫做 `shell-sbx-scratch` {{help-sbx sbx run}}。在里面，`pwd` 打印的路径与主机上相同。离开这个 shell，然后列出该沙箱并删除它：

```bash
sbx ls
sbx rm --force shell-sbx-scratch
```

这次 capture 用 `sbx create` 创建了它自己的 shell 沙箱，并打印这份摘要：

```listing
title: 一个新 shell 沙箱的摘要
source: capture/out/04-create.txt
lang: text
note: 镜像层被掩码为 <layers>，结尾提示已删节。
---
$ sbx create shell $CAPTURE/fixtures/repo --name m101-demo

sandbox    m101-demo
agent      shell
workspace  $CAPTURE/fixtures/repo (rw)
image      docker/sandbox-templates:shell-docker
cpu        10
memory     32 GiB

Pulling image
  <layers>
✓ Image ready
✓ Created sandbox m101-demo
…
```

在智能体这一侧，打开带主机 TCP 端口 12434 的 Docker Model Runner，并用 `docker model pull ai/qwen3:4b` 拉取模型。把这份智能体文件存为 `dmr.yaml`：

```listing
title: 一个使用本地模型的智能体
source: capture/fixtures/agents/dmr.yaml
lang: yaml
note: 未删节。
---
version: "16"

providers:
  runner:
    provider: dmr
    base_url: http://localhost:12434/engines/llama.cpp/v1

models:
  qwen:
    provider: runner
    model: ai/qwen3:4b
    temperature: 0

agents:
  root:
    model: qwen
    description: Answers with one word.
    instruction: Reply with exactly one word.
```

先运行 `docker-agent doctor`。它会找到 runner 和模型：

```listing
title: Model Runner 可达时的 doctor
source: capture/out/25-doctor.txt
lang: text
note: 只保留 Model Runner 和模型选择两个块。
---
…
Docker Model Runner
  Status: reachable, 1 model(s) pulled:
    - docker.io/ai/qwen3:4b

Model auto-selection
  auto -> dmr/docker.io/ai/qwen3:4b
…
```

然后在没有终端界面的情况下运行该智能体：

```listing
title: 来自本地模型的一个回答
source: capture/out/25-run-dmr.txt
lang: text
note: 未删节。这次 capture 按 fixtures/agents 下的路径传入该文件。
---
$ docker-agent run --exec --last fixtures/agents/dmr.yaml 'Say hello.'
Hello
[exit 0]
```

接下来打开 capture/out/27-sandbox-run.txt。这是同一种智能体运行，但是在沙箱内，[端到端一节](#s-docker-agent-run-sandbox-end-to-end)会逐行读它。

## 各部分的顺序 {#s-front-how-the-parts-are-ordered}

第 1 部分把两个产品放在同一页。第 2 到 4 部分拆开 `sbx`：沙箱及其守护进程、隔离层，以及带环境文件的 kit。第 5 和 6 部分拆开 `docker-agent`：智能体文件及其运行，然后是对外提供和分享的智能体。第 7 部分讲运维，参考部分存放查找表：

```parts
```

## 图中的颜色 {#s-front-colour-in-figures}

每种色调在每张图中都只有一个含义：

```palette
```

[图](#fig-0-1)用这次 capture 中的交换讲解八种箭头样式。

```figure
id: fig-0-1
kind: sequence
title: 阅读本手册中的时序图
claim: 八种箭头样式各自标出一种交换，每个标签都是这次 capture 中的真实命令、规则、状态或事件名.
caption: 每一编号行都从箭头的尾读到头，标签下方的说明给出样式。第 1 到 7 行来自 blocked、allow 和 allowed 这几次 capture。第 8 和 9 行来自内部运行和 cassette，第 10 行来自 auto-stop capture。
```

第 8 行的模型调用经过代理，[图](#fig-1-3)把它画成单独的一跳。

Sources: help-sbx sbx run (research/sources/help-sbx.md); manual.json; research/sources/README.md; research/plan.md; research/conflicts-register.md rows C7, C9, C13, C48, C61; capture/README.md, capture/run.py; capture/fixtures/agents/dmr.yaml; capture/cassettes/18-files.yaml.gz; capture/out/README.md, 00-versions.txt, 03-policy-init.txt, 04-auto-stop.txt, 04-create.txt, 04-workspace.txt, 09-allow.txt, 09-allowed.txt, 09-blocked.txt, 25-doctor.txt, 25-model-ls.txt, 25-model-pull-latest.txt, 25-run-dmr.txt, 27-inside-run.txt, 27-sandbox-run.txt, 29-docker-agent-plugin.txt
