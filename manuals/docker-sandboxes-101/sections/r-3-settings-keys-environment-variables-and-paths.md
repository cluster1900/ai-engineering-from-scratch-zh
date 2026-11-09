# 设置键、环境变量与路径

> `sbx settings list` 在 2026-10-08 打印的每个键、两个工具读取的每个环境变量，以及它们在 macOS 上使用的每条路径，各带来源。

`sbx settings list` 在 capture 机器上打印了 31 个键，每一个的 SOURCE 都是 `default`（[我们的来源记录（英文原文）](manuals/docker-sandboxes-101/research/sources/probes/sbx-settings-list.txt)）。取值按顺序来自该键的环境变量，然后是用 `sbx settings set` 写下的用户覆盖，然后是内置默认值 {{docs-sbx Settings}}。RESTART `yes` 表示已经存在的守护进程侧消费者需要 `sbx daemon restart`，而新沙箱和支持的 CLI 客户端立刻使用新值 {{help-sbx sbx settings list}}。CLI 表格会截断长描述。含义列在文档设置页有条目的地方用该页补全。页面没有条目时，该列会说明并给出 `sbx settings list --json` 的全文（[该 capture](manuals/docker-sandboxes-101/capture/out/02-settings.json)）。

## 设置键 {#s-ref-settings-keys-environment-variables-and-paths-the-settings-keys}

| 键 | 类型 | 默认值 | 重启 | 含义 |
|---|---|---|---|---|
| `claude.remoteControl` | bool | `false` | no | 让 Claude Code 的 `/remote-control` 通道用它自己的会话 token 认证，而不是由代理换入主机凭据（文档） |
| `clipboard.imagePaste` | bool | `false` | no | 让沙箱中的智能体读取主机剪贴板图像，从而用 Ctrl+V 粘贴截图（文档） |
| `diagnostics.autoUpload` | string | 空 | no | 守护进程出错后自动上传诊断的同意：`yes`、`no`，或空表示尚未决定（文档） |
| `env.rememberHostCommands` | bool | `false` | no | 环境文件的主机命令只在它们变化时再询问，第一次批准之后（文档） |
| `kit.allowExtractedAgents` | bool | `true` | no | 接纳已从 sbx 迁入 kit 的智能体所钉住的 kit 引用，即使在 `kit.allowedSources` 之外，并免除它们的 `kit.requireSignature`（文档） |
| `kit.allowLocalKits` | bool | `true` | no | 允许来自本地目录和 ZIP 文件的 kit（文档） |
| `kit.allowedSources` | json | `["docker.io/"]` | no | 允许的远程 kit 源前缀的 JSON 数组，按路径段边界匹配。`["*"]` 允许任意源（文档） |
| `kit.ignoreTransparencyLog` | bool | `false` | no | 在没有 Rekor 条目的情况下验证 keyless kit 签名，用于用 `--tlog-upload=false` 签名的 kit（文档） |
| `kit.requireSignature` | bool | `false` | no | 拒绝未签名的 kit 以及由不受信任签名者签名的 kit。ZIP kit 不能携带签名，会被拒绝（文档） |
| `kit.trustedSigners` | json | 以 `@docker.com` 结尾、经由 Google issuer 的身份 | no | 签名者策略的 JSON 数组：带 issuer 的 keyless 身份，或公钥文件（文档） |
| `mcp.forceLocalGateway` | bool | `false` | yes | 账户本会使用托管网关时，改用本地 MCP 网关（文档） |
| `model.providers` | json | `{}` | no | 供 `sbx run --model` 使用的推理端点 JSON 对象，每个带 `url`、`wire` 和 `apiKeyEnv`（文档） |
| `no_proxy` | string | 空 | yes | 沙箱、守护进程和支持的 CLI 流量共用的代理例外列表（文档） |
| `no_proxy.daemon` | string | 空 | yes | 仅守护进程和 CLI 请求的例外列表。非空值在该范围替换共用列表（文档） |
| `no_proxy.sandbox` | string | 空 | yes | 仅沙箱出站的例外列表。非空值对沙箱替换共用列表（文档） |
| `platform.allowExperimentalFeatures` | bool | `true` | no | 允许实验性功能。CLI 文本是完整的。文档说默认是 `false`（[冲突 C18](#s-ref-sources-and-the-conflicts-register)） |
| `platform.images.registryMirror` | string | 空 | no | 解析到 Docker Hub 的模板和 kit 引用的镜像主机，不带 URL scheme（文档） |
| `platform.images.useDHI` | bool | `false` | no | 对默认智能体模板使用 Docker Hardened Image 变体 `dhi/sbx-templates:<tag>`（文档） |
| `proxy` | string | 空 | yes | 沙箱、守护进程和 CLI 流量的上游代理：HTTP、HTTPS 或 SOCKS5 URL、PAC 源、`system` 或 `direct`（文档） |
| `proxy.daemon` | string | 空 | yes | 仅守护进程请求和支持的 CLI 请求的上游代理（文档） |
| `proxy.integratedAuth` | bool | `false` | yes | 用 Windows 登录身份做 NTLM 或 Kerberos 认证。在 macOS 或 Linux 上无效果（文档） |
| `proxy.sandbox` | string | 空 | yes | 仅沙箱出站的上游代理。它在该范围覆盖 `proxy`（文档） |
| `sandbox.disk.dockerVolume` | string | `10g` | no | 新沙箱的 `/var/lib/docker` volume 大小，至少 512 MiB。已有 volume 保持其大小（文档） |
| `skills.defaultMode` | string | `readonly` | no | 省略 `--skills` 时共享 skills 存储的模式：`readonly`、`readwrite` 或 `off`（文档） |
| `ssh.agentForwardingEnabled` | bool | `true` | yes | 让客户端把 SSH agent 转发进沙箱。私钥留在主机上（文档） |
| `ssh.agentSocketPath` | string | 空 | yes | 固定的主机 SSH agent socket 路径。空则使用每个客户端提供的 socket（文档） |
| `ssh.autoCreate` | bool | `false` | yes | SSH 连接时若沙箱不存在就创建它。文档没有条目（[冲突 C20](#s-ref-sources-and-the-conflicts-register)） |
| `ssh.defaultAgent` | string | `shell` | yes | SSH 自动创建的沙箱所用的内置智能体。文档没有条目 |
| `ssh.defaultTemplate` | string | 空 | yes | SSH 自动创建的沙箱的模板镜像覆盖（空则用智能体默认）。文档没有条目 |
| `ssh.workspaceRoot` | string | 空 | yes | 存放 SSH 自动创建的沙箱工作区的主机目录（空 = 无挂载、容器内部）。文档没有条目 |
| `tls.allowNegativeSerial` | bool | `false` | yes | 接受序列号为负的服务器证书，某些做 TLS 检查的代理会签发这种证书（文档） |

取值类型是 `bool`、`int`、`float`、`string` 和 `json`，与管理员约束冲突的覆盖会被拒绝 {{help-sbx sbx settings set}}。大多数更改在大约五秒内生效 {{help-sbx sbx settings}}。

## 文档点名但 CLI 未打印的键 {#s-ref-settings-keys-environment-variables-and-paths-keys-the-docs-name-that-the-cli-did-not-print}

文档设置页、三份指南和一条发行说明点名了 `sbx settings list` 未返回的键（[冲突 C19](#s-ref-sources-and-the-conflicts-register)）。本手册只在这里打印它们，别处不再出现。

| 键 | 文档用在何处 | 文档怎么说 |
|---|---|---|
| `feature.model` | 本地模型指南 | 在 `platform.allowExperimentalFeatures true` 之后执行 `sbx settings set feature.model true` 会打开 `sbx run --model` {{docs-sbx Run a local model}} |
| `feature.sandbox-gpu` | GPU 指南 | 同一对命令会揭示隐藏的 `--gpu` 标志 {{docs-sbx Turn on the feature}} |
| `feature.udp-egress` | 网络策略页 | 同一对命令允许 `sbx policy allow network --protocol udp` {{docs-sbx Allow outbound UDP}} |
| `diagnostics.autoUploadErrorCooldownInDays` | 设置页 | 整数，默认 `1`，自动上传之间的天数，仅在 `diagnostics.autoUpload` 为 `yes` 时生效 {{docs-sbx Settings}} |
| `feature.ssh` | v0.34.0 发行说明 | `sbx settings set feature.ssh true` 启用实验性的原生 SSH 端点 {{rel-sbx v0.34.0}} |

## sbx 读取的环境变量 {#s-ref-settings-keys-environment-variables-and-paths-environment-variables-that-sbx-reads}

这些变量配置主机一侧。它们从不在沙箱内设置变量，守护进程只在启动时读取它们 {{docs-sbx Settings}}。

| 变量 | 设置 |
| --- | --- |
| `DOCKER_SANDBOXES_CLIPBOARD_IMAGE_PASTE` | `clipboard.imagePaste` |
| `DOCKER_SANDBOXES_CLAUDE_REMOTE_CONTROL` | `claude.remoteControl` |
| `DOCKER_SANDBOXES_USE_DHI` | `platform.images.useDHI` |
| `DOCKER_SANDBOXES_KIT_ALLOWED_SOURCES` | `kit.allowedSources` |
| `DOCKER_SANDBOXES_KIT_ALLOW_LOCAL` | `kit.allowLocalKits` |
| `DOCKER_SANDBOXES_KIT_ALLOW_EXTRACTED_AGENTS` | `kit.allowExtractedAgents` |
| `DOCKER_SANDBOXES_KIT_REQUIRE_SIGNATURE` | `kit.requireSignature` |
| `DOCKER_SANDBOXES_KIT_TRUSTED_SIGNERS` | `kit.trustedSigners` |
| `DOCKER_SANDBOXES_KIT_IGNORE_TLOG` | `kit.ignoreTransparencyLog` |
| `DOCKER_SANDBOXES_PROXY` | `proxy.sandbox`，仅沙箱流量 |
| `DOCKER_SANDBOXES_NO_PROXY` | `no_proxy.sandbox`，仅沙箱流量 |
| `DOCKER_SANDBOXES_SSH_AUTO_CREATE` | `ssh.autoCreate` |
| `DOCKER_SANDBOXES_SSH_DEFAULT_AGENT` | `ssh.defaultAgent` |
| `DOCKER_SANDBOXES_SSH_DEFAULT_TEMPLATE` | `ssh.defaultTemplate` |
| `DOCKER_SANDBOXES_SSH_WORKSPACE_ROOT` | `ssh.workspaceRoot` |
| `DOCKER_SANDBOXES_MODEL_PROVIDERS` | `model.providers` |
| `DOCKER_SANDBOXES_ALLOW_EXPERIMENTAL_FEATURES` | `platform.allowExperimentalFeatures` |
| `DOCKER_SANDBOXES_TLS_ALLOW_NEGATIVE_SERIAL` | `tls.allowNegativeSerial` |
| `HTTP_PROXY`、`HTTPS_PROXY`、`NO_PROXY` 及其小写形式 | 未设置 `proxy` 或 `no_proxy` 时的上游代理 |
| `DOCKER_SANDBOXES_DOCKER_SIZE` | 单次创建的 Docker 数据盘大小，例如 `30g` |
| `DOCKER_SANDBOXES_ROOT_SIZE` | 单次创建的根文件系统大小，例如 `40g` |
| `DOCKER_SANDBOXES_CLONED_WORKSPACE_SIZE` | `--clone` 沙箱的私有 clone 大小 |
| `DOCKER_SANDBOXES_ENABLE_VIRTIOFS_CACHE` | `0` 关闭工作区挂载的 virtiofs 缓存 |
| `SBX_NO_TELEMETRY` | `1` 关闭 CLI 使用分析 |
| `DOCKER_ACCESS_TOKEN` | `sbx env` 命令的 Docker 身份，每个 token 带一个 state scope |
| `SBX_MCP_URL` | `none` 选择本地 MCP 数据平面，而不是托管网关 |
| `SANDBOXES_STORAGE_ROOT` | 在收录的来源中没有文档。研究笔记从 v0.29.0 发行说明中点到它，而收录的发行列表没有保留该说明正文 |

环境文件的主机生命周期命令会收到 `SBX_LIFECYCLE_PHASE`、`SBX_ENV_FILE`、`SBX_ENV_FILES`、`SBX_ENV_DIR`、`SBX_SANDBOX_NAME`、`SBX_AGENT` 和 `SBX_WORKSPACE` {{docs-sbx Environment files}}。云端创建之后它们还会收到 `SBX_SANDBOX_ID` {{help-sbx sbx env}}。

## docker-agent 读取的环境变量 {#s-ref-settings-keys-environment-variables-and-paths-environment-variables-that-docker-agent-reads}

v1.30.0 的更名把前缀从 `CAGENT_` 改成 `DOCKER_AGENT_`，旧名仍被接受（[冲突 C53](#s-ref-sources-and-the-conflicts-register)） {{rel-agent v1.30.0}}。

| 变量 | 旧名 | 含义 |
| --- | --- | --- |
| `DOCKER_AGENT_DATA_DIR` | 无 | 数据目录，与 `--data-dir` 相同。加入于 v1.147.0。 |
| `DOCKER_AGENT_CONFIG_DIR` | `CAGENT_CONFIG_DIR` | 配置目录，与 `--config-dir` 相同。加入于 v1.100.0。 |
| `DOCKER_AGENT_MODELS_GATEWAY` | `CAGENT_MODELS_GATEWAY` | 把模型流量路由过网关，与 `--models-gateway` 相同 |
| `DOCKER_AGENT_DEFAULT_MODEL` | `CAGENT_DEFAULT_MODEL` | 未给出模型时使用的模型，形式为 `provider/model` |
| `DOCKER_AGENT_HIDE_TELEMETRY_BANNER` | `CAGENT_HIDE_TELEMETRY_BANNER` | `1` 只隐藏首次运行的遥测提示 |
| `TELEMETRY_ENABLED` | 无，无前缀 | `false` 关闭遥测（[冲突 C67](#s-ref-sources-and-the-conflicts-register)） |
| `DOCKER_AGENT_AUTO_UPDATE` | 无 | `1`、`true`、`yes` 或 `on` 让独立发行的二进制自行更新。加入于 v1.74.0。 |
| `DOCKER_AGENT_NO_TOKEN_EXCHANGE` | 无 | `1` 停止把 `docker login` 的 access token 换成 Docker token |
| `DOCKER_AGENT_HUB_LOGIN_URL` | 无 | 把 token 交换指向 Docker 预发布环境，仅 HTTPS 的 `docker.com` URL |
| `DOCKER_AGENT_AUTO_INSTALL` | 无 | `false` 关闭从 aqua registry 自动安装工具 |
| `DOCKER_AGENT_TOOLS_DIR` | 无 | 已安装工具的目录，默认 `~/.cagent/tools/` |
| `DOCKER_AGENT_NO_SETUP` | 无 | `1` 在没有可用模型时停止提供设置向导 |
| `DOCKER_AGENT_BOARD_EDITOR` | `BOARD_EDITOR`，保留一个版本 | board 打开 worktree 所用的编辑器，默认 `code` |
| `DOCKER_AGENT_PPROF_ADDR` | `CAGENT_PPROF_ADDR` | Go pprof 服务器的 loopback 地址。文档仍打印旧名 |
| `DOCKER_AGENT_ENCRYPT_KEY` | 无 | `share push --key` 和 `share pull --key` 的密钥 |
| `GITHUB_TOKEN` | 无 | 提高自动安装器的 GitHub API 速率限制 |
| `CAGENT_ASKPASS_SOCKET`、`CAGENT_ASKPASS_TOKEN` | 无，仍以前缀 `CAGENT_` | `shell` toolset 的 sudo 桥，只在调用 `sudo` 的命令上设置 |
| `CAGENT_EXP_DEBUG_LAYOUT`、`CAGENT_HIDE_TELEMETRY` | 在 v1.30.0 中已更名 | 新名称在收录的来源中没有文档 |

提供商凭据变量例如 `ANTHROPIC_API_KEY` 列在 [R.6](#s-ref-providers-and-models)。

## macOS 上的路径 {#s-ref-settings-keys-environment-variables-and-paths-paths-on-macos}

capture 机器运行 macOS，所以表格先给 macOS 路径，文档写明时再给 Linux 和 Windows 形式。把 `rohitghumare` 换成你的用户名。

| 路径 | 存放内容 | 工具 |
| --- | --- | --- |
| `~/Library/Application Support/com.docker.sandboxes/` | sbx 状态目录，在 `sbx reset` 之后作为最后手段删除 | sbx |
| `.../com.docker.sandboxes/sandboxes/sandboxd/sandboxd.sock` | `sandboxd` 的 Unix socket | sbx |
| `.../com.docker.sandboxes/sandboxes/sandboxd/daemon.log` | 守护进程日志 | sbx |
| `.../com.docker.sandboxes/sandboxes/agent-skills` | 共享 skills 存储。Linux 为 `~/.local/state/sandboxes/sandboxes/agent-skills`，Windows 为 `%LOCALAPPDATA%\DockerSandboxes\sandboxes\state\agent-skills` | sbx |
| `~/Library/Logs/com.docker.sandboxes/sandboxes/auditkit/` | 守护进程写入的审计记录。Linux 为 `${XDG_STATE_HOME:-~/.local/state}/sandboxes/sandboxes/auditkit/`，Windows 为 `%LOCALAPPDATA%\DockerSandboxes\sandboxes\logs\auditkit\` | sbx |
| `~/.config/sbx/credentials.yaml` | 凭据绑定文件。Windows 为 `%APPDATA%\sbx\credentials.yaml` | sbx |
| macOS Keychain | `sbx secret set` 背后的密钥存储。Windows 使用 Credential Manager，Linux 使用 Secret Service，或者在没有这些时使用文件 `~/.config/com.docker.sandboxes` | sbx |
| `~/.sbx/run/d/containerd/containerd.sock.ttrpc` | 守护进程启动时绑定的 containerd ttrpc socket，capture 记录的错误中点到了它 | sbx |
| `~/.sbxenv.yaml` | 合并到每个项目文件之下的基础环境文件 | sbx |
| `/opt/homebrew/Caskroom/sbx/0.47.0/Sbx.app/Contents/MacOS/sbx` | Homebrew cask 的 CLI 二进制，`mkfs.erofs` 在 `Contents/libexec` 下 | sbx |
| `~/.local/state/sandboxes/`、`~/.cache/sandboxes/`、`~/.config/sandboxes/` | 三个 Linux 状态目录，设置了 `XDG_*` 时在其下。Windows 使用 `%LOCALAPPDATA%\DockerSandboxes` | sbx |
| `~/.config/cagent/config.yaml` | 用户设置、别名、全局权限和 hook、board 项目 | docker-agent |
| `~/.config/cagent/.env` | `docker agent setup` 把提供商密钥写入的 env 文件 | docker-agent |
| `~/.config/cagent/hooks.d/` | hook 的 drop-in 文件，按字典序加载 | docker-agent |
| `~/.cagent/` | 数据目录，存放 `session.db`、worktree 和 plan | docker-agent |
| `~/.cagent/session.db` | 每个会话，以 SQLite 存放 | docker-agent |
| `~/.cagent/cagent.debug.log` | 调试日志，配合 `--debug` | docker-agent |
| `~/.cagent/tools/bin/` | aqua 自动安装器下载的二进制 | docker-agent |
| `~/.cagent/plans/`、`~/.cagent/session_plans/` | 共享 plan 和按会话的 plan | docker-agent |
| `~/.cagent/memory/<config-name>/memory.db` | `memory` toolset 的默认数据库 | docker-agent |
| `~/.cagent/themes/<name>.yaml` | 自定义 TUI 主题 | docker-agent |
| `<data-dir>/runs/<pid>.json` | 用 `--listen` 启动的一次运行的发现记录 | docker-agent |
| `~/Library/Caches/cagent/` | macOS 上的缓存目录 | docker-agent |
| `~/Library/Caches/cagent/sandbox-kits/<hash>` | `run --sandbox` 暂存的 kit，按智能体引用做键 | docker-agent |
| 缓存目录下的私有文件 | 缓存的 Docker bearer token。其名称没有文档 | docker-agent |
| `~/.codex/skills/`、`~/.claude/skills/`、`~/.agents/skills/`，以及项目的 `.claude/skills/`、`.github/skills/`、`.agents/skills/` | docker-agent 发现的 `SKILL.md` 目录 | docker-agent |

docker-agent 的目录在更名之后仍使用名称 `cagent`（[冲突 C54](#s-ref-sources-and-the-conflicts-register)）。没有任何东西把插件时代的目录 `~/.docker/sandboxes/` 和 `~/.sandboxd/` 中的状态迁移到 sbx 状态目录（[冲突 C17](#s-ref-sources-and-the-conflicts-register)）。

Sources: research/sources/probes/sbx-settings-list.txt, sbx-daemon-status.txt, sbx-diagnose.txt; capture/out/02-settings.json (the full descriptions of the four `ssh.*` keys, and the environment variables of the `ssh.*`, `model.providers`, and `platform.allowExperimentalFeatures` keys); research/sources/help-sbx.md (`sbx settings`, `sbx settings list`, `sbx settings set`, `sbx env`, `sbx env create`, `sbx mcp add`, `sbx kit builder history ls`); research/sources/docs-sandboxes.md (pages configuration/settings, configuration/environment-files, troubleshooting, governance/audit, workflows/agent-skills, the credentials and local model and GPU and network policy guides); research/sources/sbx-releases.md (v0.34.0); research/sources/help-docker-agent.md (root, `board`, `setup`, `share push`); research/sources/docs-docker-agent.md (pages features/cli, configuration/user-settings, configuration/hooks, configuration/tools, configuration/sandbox, features/sessions, guides/secrets, tools/memory, tools/shell); research/sources/docker-agent-CHANGELOG.md (v1.30.0, v1.74.0, v1.100.0, v1.102.0, v1.139.0, v1.147.0); research/conflicts-register.md rows C17, C18, C19, C20, C53, C54, C67
