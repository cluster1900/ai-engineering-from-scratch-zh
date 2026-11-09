# Docker Sandboxes 与 Docker Agent 101

本手册锁定 Docker Sandboxes 的 `sbx` v0.47.0 和 Docker Agent 的 `docker-agent` v1.149.0，从第一个沙箱讲到你对外提供并分享的智能体。网页版在 [aiengineeringfromscratch.com/manual-docker-sandboxes-101.html](https://aiengineeringfromscratch.com/manual-docker-sandboxes-101.html)，课程的每个 release 都会附上 PDF `aiefs-manual-docker-sandboxes-101.pdf`。

## 内容

- 7 个部分共 33 节，之后是八个参考节。第 1 到 4 部分分别讲两个产品合在一页、沙箱及其守护进程、隔离层，以及带环境文件的 kit。第 5 到 7 部分讲智能体文件及其运行、对外提供并分享的智能体，以及运维。
- 34 张图和一张封面图，用 figure kit 根据 capture 文件绘制。它们在网页上有动画，印刷版显示最后一帧。
- `capture/` 中的 capture kit，用 Python 编写，只用标准库。它运行真实的 `sbx`、`docker-agent` 和 `docker` 二进制，并把它们打印的内容写入 `capture/out/`。
- 111 个代码清单。94 个来自 `capture/out/`，11 个来自 `capture/fixtures/`，1 个来自 `capture/run.py`，5 个来自随附的来源。
- 一份登记表，列出帮助文本、文档、仓库、发行说明、博客文章、演讲和社区讨论之间的 122 处冲突。每处冲突都有本手册给出的裁定。登记表还列出 30 条过时建议，迁移一节会给出每条建议的现行写法。
- 一份账本，记录 Docker 页面和社区中的 22 条论断，每条都有裁定和支撑它的 capture 文件。
- 21 项录制运行展示过而文档未说明的行为，列在 `capture/README.md` 中。

## 文件

| 路径 | 内容 |
|---|---|
| `manual.json` | 清单：版本锁定、各部分、配色、来源 |
| `front.md`, `sections/` | 正文，每节一个文件 |
| `figures/src/` | 图的源文件，构建为 `figures/*.svg` |
| `capture/` | kit、它的 fixture 和模型 cassette，以及录制输出（在 `capture/out/` 中） |
| `research/sources/` | 随附的帮助文本、智能体文件 schema、kit 规范、文档页面和发行说明，附带其许可证 |
| `research/*.md` | 各节引用的计划、capture 计划和冲突登记表 |

## 录制主机

kit 在一台搭载 Apple silicon、运行 macOS 26.2 的 Mac 上录制，版本如下：

| 项目 | 版本 |
|---|---|
| `sbx` | v0.47.0，revision `0411f50e`，来自 Homebrew cask |
| `docker-agent` | v1.149.0，来自 Homebrew，tag commit `bf4169c` |
| Docker Desktop | 4.94.0，带 Engine 29.8.2、buildx v0.37.2 和 Compose v5.5.1 |
| Docker Model Runner | `docker model` v1.2.6，TCP 端口 12434，模型 `ai/qwen3:4b` |
| 沙箱模板 | `docker/sandbox-templates:shell-docker`，Ubuntu 26.04.1 |
| Python | 3.14 |

文档中的默认模型 `ai/qwen3:latest` 在那台 Mac 上因 digest 不匹配而两次拉取失败。因此每个智能体文件都指定 `ai/qwen3:4b`。kit 不使用托管提供商，也不使用 API 密钥。

## capture 的层级

`sbx` 从 Docker Hub 上的镜像启动真实的 microVM，智能体运行需要模型。因此 kit 无法在 CI 中离线运行。它录制三个层级：

| 层级 | 它需要什么 | 它录制什么 |
|---|---|---|
| A | `sbx`、`docker-agent` 和 `docker` 客户端，不需要守护进程、网络、模型或密钥 | 版本、根帮助、`docker-agent doctor`、`toolsets`、`models list`、一次 dry run，以及旧版 Desktop 命令（文件 00、01、16、29） |
| B | 已登录的 `sbx`、sandboxd 守护进程、从 Docker Hub 拉取镜像，以及对 `example.com` 和 `mcp.deepwiki.com` 的 HTTPS | 沙箱生命周期、端口、`cp`、模板、`--clone`、策略、密钥、MCP、kit、`env plan` 和 skills（文件 02 到 15） |
| M | Docker Desktop 4.94.0，Docker Model Runner 在 TCP 端口 12434 上且已拉取 `ai/qwen3:4b`，外加容器、Compose、buildx 和本地 registry | 智能体运行、团队、权限、会话、eval、五个服务器、`share`、Model Runner、Compose、`run --sandbox`，以及 v3 kit 构建（文件 17 到 28、98） |

层级 C 需要 Cloud Sandboxes、GitHub token，或改动 `~/.ssh/config`。kit 不录制它，需要它的各节引用文档。

层级 M 的大多数运行用 `--fake` 重放 `capture/cassettes/` 中录制的 cassette。eval、三个服务器、一次带显式 `base_url` 的运行，以及 `run --sandbox`，会以 `temperature: 0` 现场调用模型。

## 运行 kit

```bash
cd manuals/docker-sandboxes-101
python3 capture/run.py --check
```

检查会再次录制到一个临时目录。然后它掩码每次运行都会变化的值，再把每个文件与 `capture/out/` 比较。如果未安装 `sbx`、`docker-agent` 或 `docker`，检查会打印 `skipped` 及原因并以 0 退出。如果没有 Docker Model Runner 或 `ai/qwen3:4b`，检查会运行层级 A 和 B，并打印 `tier m skipped`。

运行 `python3 capture/run.py` 可以重新录制这些文件。完整运行之前，用 `sbx login` 登录，启动 Docker Desktop，并用 `docker model pull ai/qwen3:4b` 拉取模型。kit 从不登录，也从不拉取模型。三个层级的完整运行在镜像已存在时，在 M 系列笔记本上大约需要 17 分钟。

kit 会删除它创建的沙箱、模板、容器和密钥。全局网络策略和已拉取的镜像会保留。`capture/README.md` 列出了前置条件、端口、掩码和每个 fixture。

## 构建与检查

在仓库根目录下运行：

```bash
node manuals/_shared/figkit.js build manuals/docker-sandboxes-101
node site/build-manuals.js
node scripts/audit_manuals.js --manual docker-sandboxes-101
```

在装有这些二进制的主机上，audit 会运行完整的 capture 检查，这需要登录和模型。设置 `AIEFS_CAPTURE_SKIP=1` 可跳过该检查。audit 必须报告 `TOTAL 0`。契约见 [manuals/AUTHORING.md](../AUTHORING.md)。
