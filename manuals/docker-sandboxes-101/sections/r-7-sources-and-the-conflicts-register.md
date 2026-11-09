# 来源与冲突登记表

> 两棵帮助树、一份 schema、一份 kit 规范、随附文档、发行说明，以及一个 capture kit，并对各节触及的每一处冲突给出裁定。

固定版本是 sbx 0.47.0 和 docker-agent 1.149.0。智能体文件 schema 是版本 16，Sandbox Kit Spec 是 milestone v3.0.0-m.8。固定日期是 2026-10-07，事实于 2026-10-08 核实。下面点名的每个文件都[随附在仓库中（英文原文）](manuals/docker-sandboxes-101/research/sources)，[它的 README（英文原文）](manuals/docker-sandboxes-101/research/sources/README.md) 记录了来源、提交、行数和许可证。

## 固定版本 {#s-ref-sources-and-the-conflicts-register-the-pin}

| 项目 | 值 |
|---|---|
| sbx | v0.47.0，commit `0411f50ee4700fe7bd37e6e7e3aced563e850ca9`，Homebrew cask，于 2026-10-05 发布 |
| docker-agent | v1.149.0，Homebrew 构建，tag commit `bf4169cdd31229d52385410c52c3dcc59b497858`，于 2026-10-07 发布 |
| 智能体文件 schema | 版本 16，v1.149.0 tag 处的 `agent-schema.json` |
| Sandbox Kit Spec | v3.0.0-m.8，tag commit `129be2ff45e8f9463450eb3cf04ddcb52c2b76e5`，2026-10-02，预发布 |
| docs.docker.com | 2026-10-08 提供的 252 页，源仓库 docker/docs 位于 `2c8a358489b56cd24069cc9e3a3d9a7b376dcfe7` |
| capture 机器 | 一台 Mac，macOS，探测记录于 2026-10-08 的 06:55Z 至 06:58Z |

## 分级来源 {#s-ref-sources-and-the-conflicts-register-the-ranked-sources}

两个来源不一致时，以等级更高的为准，该节也会说明。下表重复手册的分级及其来源键。

| 等级 | 来源 | 来源键 | 用于 |
|---|---|---|---|
| 1 | sbx 0.47.0 和 docker-agent 1.149.0 打印的帮助文本 | `help-sbx`、`help-agent` 加上命令 | 每条命令、标志、默认值和路径 |
| 2 | v1.149.0 的智能体文件 schema | `schema` 加上定义 | 智能体文件的每个键、类型和默认值 |
| 3 | tag v3.0.0-m.8 处的 Sandbox Kit Spec v3 | `kitspec` 加上章节，未发布的改动用 `kitspec-main`，capability 页面用 `kitcap` | kit 描述符和每个 capability |
| 4 | 2026-10-08 获取的 Docker 文档 | `docs-sbx`、`docs-agent`、`docs-dmr`、`docs-mcp`、`docs-sbx-api`、`docs-desktop` 加上页面 | 帮助文本未陈述的规则和限制 |
| 5 | 发行说明 | `rel-sbx`、`rel-agent` 加上版本 | 某行为何时出现、改变或被移除 |
| 6 | Docker 博客和演讲，经研究文件 | `blog`、`talk` 加上日期，声明为 `null` | 仅用于历史和定位，从不用作规则 |
| 7 | capture kit | [capture 到的输出](manuals/docker-sandboxes-101/capture/out) | 展示的每条命令输出、文件和记录 |

## 随附文件 {#s-ref-sources-and-the-conflicts-register-the-vendored-files}

| 文件 | 来源 | Commit、tag 或版本 |
|---|---|---|
| `help-sbx.md`、`help-sbx-cloud.md` | 完整的 `sbx --help` 树和 `sbx --cloud --help`，程序输出 | sbx v0.47.0 `0411f50ee4700fe7bd37e6e7e3aced563e850ca9` |
| `help-docker-agent.md` | 完整的 `docker-agent --help` 树 | docker-agent v1.149.0，Commit: Homebrew |
| `help-legacy-docker-sandbox.md`、`help-legacy-docker-agent.md` | `docker sandbox` 和 `docker agent` 插件树，保留作对照 | 插件 v0.12.0 `f13b3c1a96a8be40b06473bb3db0c26dbfe1878c`，插件 v1.32.4 `bd55840ec12b55874dd9fccf88912f9b6bb3e3f3` |
| `agent-schema.json` | docker/docker-agent `agent-schema.json` | tag v1.149.0 `bf4169cdd31229d52385410c52c3dcc59b497858` |
| `docker-agent-CHANGELOG.md` | docker/docker-agent `CHANGELOG.md`，最新条目 v1.149.0，没有 v1.146.0 条目 | tag v1.149.0 `bf4169cdd31229d52385410c52c3dcc59b497858` |
| `docker-agent-README.md` | docker/docker-agent `README.md` | main `7a69c316f03c635d8d1951bc4677c59b47beedc7` |
| `SPEC-v3-at-v3.0.0-m.8.md` | docker/sandbox-kit-spec 在该 tag 的 `docs/spec/SPEC-v3.md` | tag v3.0.0-m.8 `129be2ff45e8f9463450eb3cf04ddcb52c2b76e5` |
| `SPEC-v3.md`、`kit-capabilities.md`、`kit-spec-extras.md`、`kit.schema.json` | main 上的同一份规范、20 个 capability 页面、README 和治理文件，以及 kit schema | main `4be7f4dff4d647f10c51dcdb392ce3fa18dc3e96`，2026-10-07 |
| `docs-sandboxes.md` | `/ai/sandboxes/` 下的 79 页 | docker/docs main `2c8a358489b56cd24069cc9e3a3d9a7b376dcfe7`，于 2026-10-08 提供 |
| `docs-docker-agent.md` | `/ai/docker-agent/` 下的 108 页 | 同上 |
| `docs-model-runner.md`、`docs-mcp.md`、`docs-compose-models.md`、`docs-sandboxes-api.md`、`docs-desktop-release-notes.md` | 8、10、3、44 页，以及到 4.94.0 的 Desktop 发行说明 | 同上 |
| `sbx-releases.md` | docker/sbx-releases 的 GitHub releases，仅稳定 tag v0.21.0 到 v0.47.0，正文未保留 | API 读取于 2026-10-08，仓库 main `2329d12106fee653c0890152947fdd827e00cfd0` |
| `mcp-gateway-README.md`、`model-runner-README.md`、`compose-for-agents-README.md` | 各仓库的 README | main `a34df45d4ec0e941a9853ad768c4f6cd818966b3`、`ed3e67a8205b8d068b9c65b30d3708132a231bba`、`bfd4fe952591495af757a1a737c7eacc78c75c15` |
| `probes/` | 21 次只读命令运行，带时间戳和退出码 | sbx v0.47.0，docker-agent v1.149.0，2026-10-08 |

sbx 帮助文本和发行说明是 Docker Inc. 的专有程序输出，以短引文引用。仓库 docker/docker-agent、docker/sandbox-kit-spec、docker/docs 和 docker/model-runner 是 Apache-2.0。仓库 docker/mcp-gateway 是 MIT，docker/compose-for-agents 是 Apache-2.0 或 MIT（[我们的来源记录（英文原文）](manuals/docker-sandboxes-101/research/sources/LICENSES.md)）。

## 冲突登记表 {#s-ref-sources-and-the-conflicts-register-the-conflicts-register}

[冲突登记表（英文原文）](manuals/docker-sandboxes-101/research/conflicts-register.md) 收录 122 处冲突，C1 到 C122，分九组，以及 30 条过时建议，S1 到 S30。下表保留计划中某节条目引用的、或裁定点名某节的每一个 C 行。共 94 行，每行带手册遵循的裁定。没有被任何节使用的 28 行被删去以保持表格简短，下一张表按组点名它们。它们的实质出现在下面的 S 行或登记表本身。类型一列用的是登记表自己的标签。

| 分组 | 删去的行 |
|---|---|
| A，sbx | C1, C2, C3, C5, C6, C8, C10, C11, C14, C22, C23, C24, C30 |
| B，docker-agent | C55, C57, C74 |
| C，Docker Model Runner | C78, C80, C81, C82, C85 |
| D，MCP 网关和 Toolkit | C86, C87 |
| E，Compose | C94, C95, C97 |
| F，Offload | C100 |
| G，Cloud Sandboxes | C102 |

| Id | 类型 | 何处不一致 | 裁定 |
|---|---|---|---|
| C4 | 演讲与文档 | 以 libkrun 或 Firecracker 作为 VMM，对照 Docker 自己写的 VMM | Docker 自己写的 VMM，运行在 Hypervisor.framework、WHP 和 KVM 上。libkrun 仍未核实 |
| C7 | 已移除 | 在 shell 中导出的 API 密钥，对照自 v0.35.0 起的密钥存储 | 密钥来自密钥存储。`-e KEY` 是普通变量，不是密钥 |
| C9 | 文档与 CLI | 博客里五到九个智能体名称，对照 `sbx run --help` 中的 11 个 | 帮助里的 11 个名称、8 个 `create` 子命令，以及作为别名的 `cagent` |
| C12 | 文档与仓库 | 默认 kit 卷 512 MB，对照规范文档中的 20 GiB | 两个数字及其来源都给出，没有单一默认值 |
| C13 | 文档与 CLI | v1、v2 和 v3 kit，对照只点名 v1 和 v2 的 `sbx kit` 命令 | `sbx kit` 的 artifact 命令是 v1 和 v2 工具。v3 kit 是用 Docker 工具构建的 OCI 镜像 |
| C15 | 社区与文档 | 不需要 Docker Desktop，对照必须登录 | 两者都对。不需要 Desktop，但需要 Docker 账号登录 |
| C16 | 未文档化 | 正文中的 `sbx mount`、`sbx ssh proxy`、`sbx policy approval`、`--model`、`--provider`、`--usb`，帮助树中没有 | 只取 `--help` 打印的内容，并对隐藏名称加一条说明 |
| C17 | 未文档化 | 插件时代的状态目录，对照 sbx 状态目录 | 不存在状态迁移 |
| C18 | 文档与 CLI | 文档中 `platform.allowExperimentalFeatures` 默认 `false`，CLI 中为 `true` | 取 capture 中的值和 SOURCE 列 |
| C19 | 文档与 CLI | 文档中的 `feature.*` 键，`sbx settings list` 中没有 | 只取 CLI 返回的键，并对文档中的键加一条说明 |
| C20 | 未文档化 | CLI 中有四个 `ssh.*` 键，文档中没有：`ssh.autoCreate`、`ssh.defaultAgent`、`ssh.defaultTemplate` 和 `ssh.workspaceRoot` | 收录，并附上 `sbx settings list --json` 的完整描述 |
| C21 | 文档与 CLI | 文档中 11 个内置密钥服务，CLI 中 13 个 | 13 个服务 |
| C25 | 已更名 | 插件的命名规则，对照 sbx 规则 | sbx 规则：2 到 63 个字符，字母、数字、连字符、句点，`default` 保留 |
| C26 | 未文档化 | `host.docker.internal:3128` 或 `gateway.docker.internal:3128`，对照没有地址的文档 | capture 给出的地址和变量 |
| C27 | 博客过时 | UDP 和 ICMP 永久阻断，对照 `feature.udp-egress` 背后的 UDP | UDP 规则存在于实验标志之后。ICMP 被阻断。DNS 由策略控制 |
| C28 | 实验性 | `ls` 和审计中的文件系统策略，对照不支持它们的 `policy log` | 文件系统规则在 v0.47.0 中可列出但不记录日志 |
| C29 | 演讲与文档 | 近乎瞬时启动，对照数秒 | 本手册在一台机器上自己测的时间，不用厂商数字 |
| C31 | 已移除 | `docker sandbox exec -d`，对照不受支持的 `sbx exec -d` | 第 2.2 节已说明 |
| C32 | 已更名 | 把 `docker sandbox save` 存进主机守护进程，对照运行时镜像存储 | 第 2.3 节和迁移表已说明 |
| C33 | 未文档化 | Gordon 在主机上运行，对照 `sbx reset` 会清除 Gordon 会话 | 只取帮助那一行，没有更多 |
| C34 | 社区与文档 | 自定义密钥的 header 匹配规则，对照仅 cloud 可用的 `--header` 和 `--format` | 接收器上 capture 到的请求。`--header` 和 `--format` 仅 cloud |
| C35 | 文档与 CLI | `proxy-managed` 哨兵值，对照 `GHO_SBX_PROXY_MANAGED` 和 `docker-placeholder-value` | capture 到的值 |
| C36 | 文档与文档 | cloud 需要 0.45.0，对照 0.45.1 | 0.45.1 |
| C37 | 未文档化 | 审计 JSONL 需要 0.39.0，对照对订阅只字未提 | 运行之后目录里有什么 |
| C38 | 已移除 | 相对路径的 `--command` helper，对照自 v0.46.0 起使用全新临时目录 | 可写挂载之外的绝对 helper 路径 |
| C39 | 已移除 | `-p` 绑定两个 loopback，对照自 v0.42.0 起的 `tcp4` | `tcp4` 规则 |
| C40 | 已移除 | 来自任意仓库的 kit，对照自 v0.34.0 起的 `kit.allowedSources` | 为本地仓库改了该设置，并展示了没有它时的错误 |
| C41 | 已移除 | 只有全局规则，对照自 v0.29.0 起的每沙箱策略 | 两个范围 `global` 和 `local` |
| C42 | 文档与 CLI | 通过托管块的 `ssh <name>.sbx`，对照 `sbx setup ssh` 的细节 | 帮助文本中的事实 |
| C43 | 文档与 CLI | 模板和 kit 是不同的东西，对照 kit 作为位置参数智能体 | 三个词在第 2.1 节定义一次 |
| C44 | 未文档化 | 把 TUI 当作仪表板，对照不带子命令的 `sbx` | 两个入口都算 |
| C45 | 社区与文档 | 16K 客户机页，对照 `sbx diagnose` 那一行 | diagnose 那一行 |
| C46 | 文档与 CLI | `sbx kit ls`，对照 `unknown command` | 帮助列出的十个 `sbx kit` 子命令 |
| C47 | 文档与 CLI | 带 `--cloud` 的相同动词，对照隐藏的和仅 cloud 的动词 | 每个动词标为 local、cloud 或两者 |
| C48 | 文档与 CLI | 插件 v1.32.4，对照 Homebrew 的 v1.149.0 | Homebrew 的 v1.149.0，两个版本都 capture 了 |
| C49 | 文档与文档 | Desktop 4.63 中的 Docker Agent，对照第一条发行说明在 4.64.0 | 文档写 4.63，第一条说明在 4.64.0 |
| C50 | 未文档化 | 每个 Desktop 发行版都写明捆绑版本，对照有的发行版什么都没写 | 第 7.3 节的脚注 |
| C51 | 已更名 | `cagent` 命令和文档，对照 `docker agent` 和 `/ai/docker-agent/` | 迁移行 S5 到 S9 |
| C52 | 已移除 | `cagent config`、`feedback`、`build`、`catalog`、`exec`，对照 v1.23.4 的重组 | 迁移行 S6 和 S7 |
| C53 | 已更名 | `CAGENT_*` 变量，对照自 v1.30.0 起的 `DOCKER_AGENT_*` | 新名称，并保留旧别名 |
| C54 | 已更名 | 一次完整更名，对照目录仍叫 `cagent` | 路径保持原样 |
| C56 | 文档与仓库 | 把 `handoff` 和 `transfer_task` 当作类型，对照不含它们的 27 种类型 | 不是类型。单独的行标为 implicit |
| C58 | 已更名 | `fireworks`、`together`、`moonshot`、`opencode-zen`，对照规范 id | 规范 id，并带别名列 |
| C59 | 已更名 | 把 `--yolo` 当作正道，对照 `--safety autonomous` | `--safety autonomous`，`--yolo` 是它的别名 |
| C60 | 文档与 CLI | `--sandbox` 需要 Desktop，对照 `--sbx` 默认 true | 在 Desktop 4.80.0 或更高版本上，`--sbx=false` 没有可用目标 |
| C61 | 文档与文档 | `docker/docker-agent-sbx-templates:latest`，对照 `docker/sandbox-templates:docker-agent` | 两条启动路径对应两张镜像 |
| C62 | 未文档化 | `--sandbox` 里的 `--yolo`，对照被砍掉的默认值 | 这一版中该模式仍未知。运行在打印任何内容之前就停在 "attempt to write a readonly database (1032)"（`27-sandbox-run.txt`） |
| C63 | 文档与 CLI | `<data-dir>/session.db`，对照 `serve api` 使用当前目录下的 `session.db` | 两个默认值都成立 |
| C64 | 已更名 | `serve a2a -a` 默认 `root`，对照团队的第一个智能体 | v1.149.0 的文本 |
| C65 | 文档与 CLI | `eval -c` 作为 CPU 数量和 Anthropic 评判模型，对照 10 和 `openai/gpt-5.6-terra` | 10 和 `openai/gpt-5.6-terra` |
| C66 | 文档与 CLI | `new --model` 有 30 个提供商，对照帮助中点名的四个 | `new` 在这些之中自动选择，`run --model` 接受任意提供商 |
| C67 | 文档与仓库 | 通过 `DOCKER_AGENT_*` 关闭遥测，对照 `TELEMETRY_ENABLED=false` | 两者都打印了 |
| C68 | 未文档化 | `/reference/cli/docker/agent/` 的 CLI 参考，对照 404 | 功能页面和帮助树 |
| C69 | 未文档化 | N 个 hook 内置，对照已确认的八个名称 | 只取已确认的内置 |
| C70 | 文档与文档 | 把 `serve a2a` 当作完整 A2A，对照列出的限制 | capture 到的 card，以及 capture 展示的每条限制 |
| C71 | 未文档化 | `/.well-known/agent-card.json` 上的 card，对照没有写明路径 | 给出响应的路径和 `protocolVersion` 字段 |
| C72 | 未文档化 | 把 Gordon 当作独立产品，对照 `docker ai` 调用 Docker Agent | 第 1.1 节的一句话 |
| C73 | 未文档化 | 经网关的 `ref: docker:<name>`，对照对 Toolkit 只字未提 | 两种结果都给出 |
| C75 | 未文档化 | 不带参数的 `docker agent` 运行 `run`，对照把 `getting-started` 列在最前 | 以它的帮助为准 |
| C76 | 文档与文档 | 被服务的智能体会转发预算，对照不转发 | 预算不适用于被服务的智能体 |
| C77 | 文档与 CLI | `docker model configure`，对照缺失的命令 | 哪个存在用哪个。Docker Agent 通过 `_configure` 设置 `context_size` |
| C79 | 文档与文档 | `/anthropic/v1/messages`，对照 `/v1/messages` | 返回 200 的那一个 |
| C83 | 未文档化 | `context_size` 已生效，对照 issue #4522 | runner 收到的请求体 |
| C84 | 文档与文档 | 不需要密钥，对照未认证的 API | 同一事实，第 6.5 节已说明 |
| C88 | 文档与仓库 | 仅邀请的网关，对照 MIT 网关 | 两样东西同名，第 6.5 节加以区分 |
| C89 | 文档与仓库 | `--verify-signatures` 没有默认值，对照 `true` | 取自帮助的默认值 |
| C90 | 文档与仓库 | 把仓库引用当作已支持，对照部分实现 | 在 Toolkit 中标为部分实现 |
| C91 | 文档与文档 | 一个网关包办一切，对照单独的沙箱网关 | 点名了三个网关 |
| C92 | 未文档化 | 已知的捆绑网关版本，对照最后写明的 0.42.2 | 两份输出都给出 |
| C93 | 文档过时 | Action 安装 v0.22.0，对照 v0.44.1 | 第 7.3 节的一句话 |
| C96 | 社区与文档 | Compose 会启动沙箱，对照没有此功能 | 第 6.5 节的一句话 |
| C98 | 博客过时 | 300 分钟免费 GPU，对照没有公开价格 | Offload 不在范围内 |
| C99 | 文档与文档 | 把 Offload 当作 cloud 路径，对照 `sbx --cloud` | 第 7.1 节已说明 |
| C101 | 文档与文档 | 价格写在文档里，对照博客和 `template load --help` 中的价格 | 规格取自帮助，价格取自博客并注明日期 |
| C103 | 文档与文档 | Personal 账号按量付费，对照 Personal 和 Pro | Personal 或 Pro，其余未核实 |
| C104 | 文档与文档 | cloud 上 `docker exec` 和 healthcheck 可用，对照实际到达的是 VM 文件系统 | 一条已文档化的限制 |
| C105 | 演讲与文档 | Warp Oz 运行在 Docker cloud 沙箱上，对照没有确认 | 省略 |
| C106 | 博客过时 | Kubernetes 内部的沙箱原语，对照再无其他提及 | 省略 |
| C107 | 已移除 | 插件仍在 Desktop 中，对照 4.80.0 中已移除 | capture 展示的错误文本 |
| C108 | 已移除 | `--mount-docker-socket`、`--load-local-template`、`--pull-template`，对照 sbx 中没有 | 迁移行 S1 到 S4 |
| C109 | 已更名 | `network proxy` 标志，对照没有 bypass 的 `policy` 子命令 | 迁移行 S10 和 S11，bypass 没有找到替代 |
| C110 | 已移除 | 旧的默认允许主机，对照三个预设 | 旧列表只在第 7.3 节 |
| C111 | 已移除 | Desktop 中的 `cagent`，对照 4.81.0 中已移除 | 迁移行 S8 |
| C112 | 已移除 | 守护进程环境中的密钥和 `~/.docker/sandboxes/` 下的状态，对照 sbx 存储 | 第 7.3 节的一张表 |
| C113 | 文档与 CLI | 前端提升的 index 注解（kitspec §9.3），对照带 attestation manifest 且没有注解的 index | 第 4.1 节两者都打印。注解在平台 manifest 上（`28-index.json`、`28-manifest.json`），当 index 没有注解时，消费者读的是它 |
| C114 | 文档与 CLI | 浮动的 `docker/sandbox-kit:3` 在 milestone 期间永不移动，对照解析到 3.0.0-m.8 | 第 4.1 节两者都打印（`28-buildx.txt`）。每次都需要同一 frontend 的构建应写明确切的版本 tag |
| C115 | 文档与 CLI | 把 `docker buildx build -f kit.yaml --push` 当作发布命令，对照默认 `docker` 驱动产生的没有注解的 schema 2 manifest | 第 4.1 节说用 `docker-container` builder 构建（`28-manifest-docker-driver.json`、`28-manifest.json`）。没有该注解的镜像不是 kit |
| C116 | 文档与 CLI | 开发时把本地源目录传给 `sbx`，对照 Desktop 4.94.0 上 `sbx kit inspect` 失败 | 第 4.1 节两者都打印（`13-kit-v3-inspect.txt`、`28-kit-inspect-source.txt`）。没有 capture 对目录运行 `sbx run` |
| C117 | 文档与 CLI | 在 `sbx-kit-builder` 沙箱中做源码构建，对照经主机 Docker 守护进程的构建以及 builder "not created" | 第 4.1 节和第 4.3 节打印帮助行和状态（`13-kit-builder-status.txt`）。成功的源码构建在哪里运行仍未说明 |
| C118 | 文档与仓库 | 把智能体文件配置版本 `15` 当作当前，对照 schema 枚举到 `"16"` 以及能加载的 capture 文件 | 取自 schema 的 `"16"`（第 5.2 节、R.4）。文档页面仍写 `15` |
| C119 | 文档与 CLI | 会话标题由第一条消息生成，对照五个标题为 `Running agent` 的会话 | 第 5.6 节打印这五行（`21-session-db.txt`） |
| C120 | 文档与 CLI | A2A 1.0.1 要求的 skill 名称和 mode 列表，对照一张 skill 名称为空、两个 mode 列表为空的 card | 第 6.3 节把 card 对照规则打印（`23-agent-card.json`）。客户端接受这些空值 |
| C121 | 文档与 CLI | "A2A artifact support not yet integrated"，对照 artifacts 里装着回答的任务 | 第 6.3 节说 capture 与这条限制矛盾（`23-a2a.http`） |
| C122 | 文档与 CLI | 指向 `docker sbx` 的发行说明，对照指向产品页的提示以及仍显示 `sandbox v0.13.0` 的插件列表 | 第 7.3 节打印该提示（`29-docker-sandbox.txt`、`29-docker-plugins.txt`）。插件条目仍在，命令只打印该提示 |

## 过时建议 {#s-ref-sources-and-the-conflicts-register-stale-advice}

迁移一节打印每一行。最后一列是登记表现在让你做的事。

| Id | 当时印出的建议 | 何时不再成立 | 现在这样做 |
|---|---|---|---|
| S1 | `docker sandbox run <agent>` | Desktop 4.80.0，2026-06-29 | `sbx run <agent>` |
| S2 | `docker sandbox run --mount-docker-socket kiro` | Desktop 4.58.0，2026-01-26 | 每个沙箱都有私有的 Docker Engine |
| S3 | `--load-local-template` | Desktop 4.61，2026-02-18 | `sbx template load FILE`，然后 `--pull never -t TAG` |
| S4 | `--pull-template missing` | v0.21.0，2026-03-31 | `--pull always`、`missing` 或 `never`，默认 `always` |
| S5 | `docker sandbox create cagent .` | Desktop 4.80.0 | `sbx create docker-agent .`，`cagent` 保留为别名 |
| S6 | `cagent run agent.yaml`、`cagent new`、`cagent exec` | v1.23.4，2026-02-19，以及 Desktop 4.81.0 | `docker agent run`、`docker agent new`、`docker agent run --exec` |
| S7 | `cagent push`、`pull`、`acp`、`api`、`mcp`、`a2a` | v1.23.4 | `docker agent share push` 或 `pull`，`docker agent serve acp`、`api`、`mcp`、`a2a` |
| S8 | `cagent version`、`brew install cagent` | v1.30.0，2026-03-09，以及 Desktop 4.81.0 | `docker agent version`、`brew install docker-agent`、`winget install Docker.Agent` |
| S9 | `cagent config`、`feedback`、`build`、`catalog` | v1.23.4 | 已移除。catalog 是 Hub 命名空间 `agentcatalog/*` |
| S10 | `docker sandbox network proxy S --allow-host api.example.com` | Desktop 4.80.0 | `sbx policy allow network api.example.com [--sandbox S]` |
| S11 | `docker sandbox network log --json` | Desktop 4.80.0 | `sbx policy log [S] --json` |
| S12 | `docker sandbox save S TAG` 存进主机 Docker | Desktop 4.80.0 | `sbx template save S TAG [-o FILE]` 存进运行时存储 |
| S13 | 在 `host.docker.internal:3128` 上手动设置的代理 | sbx，由守护进程配置代理 | 什么都不用做。capture 打印沙箱看到的内容 |
| S14 | `~/.zshrc` 中的 API 密钥和重启 Desktop | v0.35.0，2026-07-10 | `sbx secret set SERVICE` 或 `sbx secret import` |
| S15 | `sbx run claude --branch` | v0.31.0，2026-05-28 | `sbx run claude --clone` |
| S16 | 带 `schemaVersion: "1"` 的 kit v1 语法 | 2026-09-09 起推荐 v2，2026-09-24 发布 v3 | `sbx kit` artifact 用 v2 `spec.yaml`，OCI kit 用带 `# syntax=docker/sandbox-kit:3` 的 v3 `kit.yaml` |
| S17 | `sbx mcp catalog` | v0.45.0，2026-09-21 | `sbx mcp add --url <registry or manifest URL>` |
| S18 | `sbx mcp enable github-official --sandbox my-project` | 从未出现在帮助树中 | `sbx mcp add`，然后 `--static-mcp` 或 `sbx mcp load` |
| S19 | Docker Agent v2.x 重命名了 CLI | 从未成立 | 最新是 v1.149.0 |
| S20 | `docs.docker.com/ai/cagent/` | v1.30.0 的更名 | `docs.docker.com/ai/docker-agent/` |
| S21 | `CAGENT_MODELS_GATEWAY`、`CAGENT_CONFIG_DIR`、`CAGENT_PPROF_ADDR` | v1.30.0，仍被接受 | `DOCKER_AGENT_MODELS_GATEWAY`、`DOCKER_AGENT_CONFIG_DIR`、`DOCKER_AGENT_PPROF_ADDR` |
| S22 | `docker/sandbox-templates:cagent` | 这次更名 | `docker/sandbox-templates:docker-agent` |
| S23 | 写成 `./helper` 或 `cat token` 的 `--command` helper | v0.46.0，2026-09-28 | 可写沙箱挂载之外的绝对路径 |
| S24 | `-p 3000:8080` 绑定 IPv4 和 IPv6 | v0.42.0，2026-09-07 | 默认 `tcp4`。写成 `3000:8080/tcp` 则两者都绑 |
| S25 | 来自任意仓库的 kit | v0.34.0，2026-06-26 | 把前缀加到 `kit.allowedSources` |
| S26 | 把智能体二进制 `docker cp` 进去并在内部运行 `agent run dev-team.yaml` | sbx 和 `docker-agent` 模板 | `sbx run docker-agent .` 或 `docker agent run --sandbox agent.yaml` |
| S27 | 每个工作区一个沙箱 | 名称默认为 `<agent>-<workdir>` | 用 `--name` 给沙箱命名 |
| S28 | 支持 Windows 10 | v0.35.0，2026-07-10 | 带 Windows Hypervisor Platform 的 Windows 11 |
| S29 | 五步把 Toolkit 网关设在 `host.docker.internal:8811` | v0.38.0，2026-08-06 | `sbx mcp add` 和 `sbx mcp load`。Toolkit 网关是分开的 |
| S30 | `eval` 使用付费 Anthropic 评判模型 | v1.147.0，2026-10-05 | 默认 `openai/gpt-5.6-terra`，任意 `provider/model` 都可以 |

Sources: manual.json (pin, sources, quoteSources); research/sources/README.md (origins, commits, tags, versions, and the trim of 2026-10-08); research/sources/LICENSES.md; research/conflicts-register.md (rows C1 to C122 and S1 to S30, with the plan's citations in research/plan.md used to pick the rows); research/sources/probes/ (the probe timestamps); capture/out/13-kit-builder-status.txt, 13-kit-v3-inspect.txt, 21-session-db.txt, 23-a2a.http, 23-agent-card.json, 27-sandbox-run.txt, 28-buildx.txt, 28-index.json, 28-kit-inspect-source.txt, 28-manifest.json, 28-manifest-docker-driver.json, 29-docker-plugins.txt, 29-docker-sandbox.txt (the files that rows C62 and C113 to C122 name)
