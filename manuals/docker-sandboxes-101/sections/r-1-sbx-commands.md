# sbx 命令

> sbx 0.47.0 在 `sbx --help` 四组中的每个动词，以及它的用途、要紧的标志、作用域，和讲解它的章节。

sbx 0.47.0 的根帮助在四组中列出 31 条命令：Sandbox、Management、Experimental 和 Other {{help-sbx sbx}}。随附树保存了 115 页帮助，每个回答了 `--help` 的命令和子命令各一页。下面的表格保持根帮助的顺序。作用域说明动词在哪里运行：通过 `sandboxd` 的本地沙箱、通过 `sbx --cloud` 的云沙箱，或两者。`sbx --cloud --help` 隐藏 `daemon`、`prune`、`settings` 和 `skills`，而 `attach`、`ttl` 和 `volume` 只与 `--cloud` 一起运行（[冲突 C47](#s-ref-sources-and-the-conflicts-register)）。

三条标志适用于每条命令 {{help-sbx sbx}}。

| 全局标志 | 含义 |
|---|---|
| `--cloud` | 派发到 Docker Cloud Sandboxes API，而不是本地 `sandboxd` |
| `-D, --debug` | 启用调试日志 |
| `-h, --help` | 打印该命令的帮助 |

## 沙箱命令 {#s-ref-sbx-commands-sandbox-commands}

| 命令 | 用途 | 要紧的标志 | 作用域 | 章节 |
|---|---|---|---|---|
| `attach SANDBOX` | 把终端连接到云沙箱，若已停止则先启动它 {{help-sbx sbx attach}} | `--detach-keys`（默认 `Ctrl-\`） | 仅云端 | [§7.1](#s-sbx-cloud-run-move-and-ttl) |
| `cp SRC DST` | 在沙箱和主机之间复制文件或目录，一侧写成 `SANDBOX:PATH` {{help-sbx sbx cp}} | `-L, --follow-link` | 两者 | [§2.2](#s-sbx-exec-cp-and-ports) |
| `create AGENT\|SANDBOX_KIT [PATH...]` | 为 11 种智能体之一或从 kit 引用创建沙箱，不连接 {{help-sbx sbx create}} | `--name`（默认 `<agent>-<workdir>`）、`--clone`、`--cpus`（0 为自动）、`-m, --memory`（默认主机内存的 50%，512 MiB 到 32 GiB）、`-e, --env`、`--env-file`、`--deny-network`、`-p, --publish`、`--pull always\|missing\|never`（默认 `always`）、`--skills off\|readonly\|readwrite`（默认 `readonly`）、`--static-mcp`、`-t, --template`、`--profile`、`--kit`（实验性）、`--kit-arg`、`--kit-args-file`、`-q` | 两者 | [§2.1](#s-sbx-run-create-stop-and-rm) |
| `create <agent> [PATH...]` | 八个子命令 `claude`、`codex`、`cursor`、`devin`、`docker-agent`、`gemini`、`opencode`、`shell`，标志相同，`cagent` 是 `docker-agent` 的别名 {{help-sbx sbx create docker-agent}} | `create` 的标志 | 两者 | [§2.1](#s-sbx-run-create-stop-and-rm) |
| `create` 带 `--cloud` | 创建没有主机工作区的云沙箱，除非另行指定大小，否则为 2 CPU 和 4 GiB {{help-sbx sbx create}} | `--allow-network`、`--image-ref`、`--on-timeout stop\|restart\|delete`、`--platform`、`--ttl`、`-v, --volume`（实验性） | 仅云端 | [§7.1](#s-sbx-cloud-run-move-and-ttl) |
| `exec SANDBOX COMMAND` | 在沙箱内运行命令，若已停止则先启动 {{help-sbx sbx exec}} | `-i`、`-t`、`-u, --user`、`-w, --workdir`、`-e`、`--env-file`、`--privileged`、`--detach-keys`。不支持 `-d`。带 `--cloud` 时拒绝 `-d`、`--user` 和 `--privileged` | 两者 | [§2.2](#s-sbx-exec-cp-and-ports) |
| `ls` | 列出沙箱及其智能体、状态、已发布端口和工作区 {{help-sbx sbx ls}} | `--json`、`-q` | 两者 | [§2.1](#s-sbx-run-create-stop-and-rm) |
| `move SANDBOX` | 以文件系统镜像在主机和云之间移动沙箱 {{help-sbx sbx move}} | `--to local\|cloud`、`--name`（默认为 `moved-` 加上源名称）、`--ttl`（15s 到 24h）、`--on-timeout stop\|delete`、`-f` | 两者 | [§7.1](#s-sbx-cloud-run-move-and-ttl) |
| `ports SANDBOX` | 列出、发布或取消发布沙箱端口 {{help-sbx sbx ports}} | `--publish`、`--unpublish`、`--json`。不带协议的端口绑定 `tcp4` | 两者 | [§2.2](#s-sbx-exec-cp-and-ports) |
| `prune` | 删除所有已停止的沙箱及其沙箱作用域的密钥 {{help-sbx sbx prune}} | `--dry-run`、`--filter until=TIMESTAMP`、`-f`、`--json` | 仅本地 | [§2.1](#s-sbx-run-create-stop-and-rm) |
| `rm [SANDBOX...]` | 删除沙箱、它们的容器、git worktree、状态和作用域密钥 {{help-sbx sbx rm}} | `--all`（与 `--cloud` 一起时禁用）、`-f` | 两者 | [§2.1](#s-sbx-run-create-stop-and-rm) |
| `run [AGENT\|SANDBOX_KIT] [PATH...] [-- AGENT_ARGS...]` | 运行智能体，沙箱不存在时创建它 {{help-sbx sbx run}} | `create` 的标志，加上 `-d, --detached`、`--rm`、用于重新连接的 `--name`、`--new`（云）、`--detach-keys`（云）。`--clone` 只在创建时有效 | 两者 | [§2.1](#s-sbx-run-create-stop-and-rm) |
| `stop SANDBOX...` | 停止沙箱并保留其状态 {{help-sbx sbx stop}} | 无 | 两者 | [§2.1](#s-sbx-run-create-stop-and-rm) |
| `ttl [+DURATION] SANDBOX` | 打印或延长云沙箱的 TTL，不超过其 24 小时上限 {{help-sbx sbx ttl}} | `--json` | 仅云端 | [§7.1](#s-sbx-cloud-run-move-and-ttl) |

`run` 和 `create` 接受的 11 个智能体名称是 claude、codex、copilot、cursor、devin、docker-agent、droid、gemini、kiro、opencode 和 shell {{help-sbx sbx run}}。其中只有八个有 `create` 子命令，因为 copilot、droid 和 kiro 是公开 kit（[冲突 C9](#s-ref-sources-and-the-conflicts-register)）。

## 管理命令 {#s-ref-sbx-commands-management-commands}

| 命令 | 用途 | 要紧的标志 | 作用域 | 章节 |
|---|---|---|---|---|
| `daemon start` | 启动 `sandboxd` {{help-sbx sbx daemon start}} | `-d, --detach`、`--policy allow-all\|balanced\|deny-all` | 仅本地 | [§2.4](#s-sandboxd-diagnose-and-reset) |
| `daemon stop`、`daemon restart` | 停止或重启 `sandboxd` {{help-sbx sbx daemon}} | 无 | 仅本地 | [§2.4](#s-sandboxd-diagnose-and-reset) |
| `daemon status` | 打印守护进程状态、其套接字和日志路径 {{help-sbx sbx daemon status}} | `--json` | 仅本地 | [§2.4](#s-sandboxd-diagnose-and-reset) |
| `daemon log-level set <target> <level>` | 设置 `proxy`、`general` 或 `all` 的日志级别 {{help-sbx sbx daemon log-level set}} | 无 | 仅本地 | [§2.4](#s-sandboxd-diagnose-and-reset) |
| `diagnose` | 运行 13 项安装检查 {{help-sbx sbx diagnose}} | `--json`、`-o json\|github-issue`、`--upload` | 两者 | [§2.4](#s-sandboxd-diagnose-and-reset) 和 [§7.4](#s-kit-tck-diagnose-and-the-claims-this-manual-checked) |
| `mcp add <name> (--url \| --command)` | 从远程端点、registry URL、manifest URL、`dhi.io` 镜像或主机命令注册 MCP 服务器 {{help-sbx sbx mcp add}} | `--url`、`--command`、`--args`、`--dir`、`--local`、`--header`、`--client-id`、`--oauth-authorization-server`、`--scope`、`--no-scope`、`--resource`、`--callback-port`、`--skip-auth`、`--skip-ssrf-check`、`--disable-http2` | 两者 | [§3.6](#s-sbx-mcp-add-load-and-static-mcp) |
| `mcp auth [server-name]` | 通过托管控制平面授权或重新授权远程服务器 {{help-sbx sbx mcp auth}} | `--all`、`--scope`、`--no-scope`、`--verbose`、`--format text\|json`、`--json` | 两者 | [§3.6](#s-sbx-mcp-add-load-and-static-mcp) |
| `mcp auth rm`、`mcp auth status` | 删除托管的 OAuth 凭据，或在不启动 OAuth 的情况下显示其状态 {{help-sbx sbx mcp auth status}} | `--all`、`-f`（仅 rm）、`--format`、`--json` | 两者 | [§3.6](#s-sbx-mcp-add-load-and-static-mcp) |
| `mcp inspect <name>` | 显示一项注册、其头，以及有效的 `resource` 值 {{help-sbx sbx mcp inspect}} | `--json` | 两者 | [§3.6](#s-sbx-mcp-add-load-and-static-mcp) |
| `mcp load <name> --sandbox S` | 把已注册的服务器附加到正在运行的沙箱，并向智能体发出 `tools/list_changed` 通知 {{help-sbx sbx mcp load}} | `--sandbox`（必需） | 两者 | [§3.6](#s-sbx-mcp-add-load-and-static-mcp) |
| `mcp ls` | 列出为它们提供服务的网关下已注册的服务器 {{help-sbx sbx mcp ls}} | `--json`、`-q` | 两者 | [§3.6](#s-sbx-mcp-add-load-and-static-mcp) |
| `mcp rm <name>` | 删除一项注册 {{help-sbx sbx mcp rm}} | `-f` | 两者 | [§3.6](#s-sbx-mcp-add-load-and-static-mcp) |
| `policy init <allow-all\|balanced\|deny-all>` | 在第一个沙箱之前一次性设置全局网络策略 {{help-sbx sbx policy init}} | `--sandbox`（仅云端） | 两者 | [§3.3](#s-sbx-policy-init-allow-deny-and-check-network) |
| `policy allow network RESOURCES` | 为主机、域名、IP 地址或 CIDR 前缀添加允许规则，默认 TCP {{help-sbx sbx policy allow network}} | `--sandbox`、`--protocol tcp\|udp` | 两者 | [§3.3](#s-sbx-policy-init-allow-deny-and-check-network) |
| `policy deny network RESOURCES` | 添加拒绝规则，默认 TCP 和 UDP，优先于允许 {{help-sbx sbx policy deny network}} | `--sandbox`、`--protocol tcp\|udp` | 两者 | [§3.3](#s-sbx-policy-init-allow-deny-and-check-network) |
| `policy check network TARGET` | 询问守护进程授权器某主机和端口是否被允许，不发送任何内容 {{help-sbx sbx policy check network}} | `--sandbox`、`--protocol`、`--verbose`、`--json` | 两者 | [§3.3](#s-sbx-policy-init-allow-deny-and-check-network) |
| `policy inspect <policy-or-rule>` | 显示一条策略或一条规则及其 `RULE_ID` 和删除命令 {{help-sbx sbx policy inspect}} | `--json` | 两者 | [§3.3](#s-sbx-policy-init-allow-deny-and-check-network) |
| `policy log [SANDBOX]` | 显示代理允许或阻止了哪些主机，带规则、代理类型和计数 {{help-sbx sbx policy log}} | `--json`、`--limit`、`-q`、`--type all\|network\|filesystem`（尚不支持 filesystem 日志） | 两者 | [§3.4](#s-sbx-policy-log-and-the-proxy) |
| `policy ls [SANDBOX]` | 列出策略，每条策略一行概览，或一个沙箱的规则 {{help-sbx sbx policy ls}} | `--wide`、`--json`、`--source local\|org\|kit`、`--decision allow\|deny`、`--type`、`--created-via default\|added\|provisioned\|approval`、`--profile`、`--protocol`、`--include-inactive` | 两者 | [§3.3](#s-sbx-policy-init-allow-deny-and-check-network) 和 [§7.2](#s-org-policies-profiles-and-the-audit-log) |
| `policy profile ls` | 列出远程治理策略提供的 profile {{help-sbx sbx policy profile ls}} | `--json`、`-q` | 两者 | [§7.2](#s-org-policies-profiles-and-the-audit-log) |
| `policy reset` | 删除本地策略存储并停止守护进程，或删除云账户策略 {{help-sbx sbx policy reset}} | `-f` | 两者 | [§3.3](#s-sbx-policy-init-allow-deny-and-check-network) |
| `policy rm network` | 按 `RULE_ID` 或按资源删除一条规则 {{help-sbx sbx policy rm network}} | `--id`、`--resource`、`--sandbox`、`-f` | 两者 | [§3.3](#s-sbx-policy-init-allow-deny-and-check-network) |
| `reset` | 把 sbx 恢复到刚安装的状态，包括密钥和登录 {{help-sbx sbx reset}} | `-f`、`--preserve-secrets` | 仅本地 | [§2.4](#s-sandboxd-diagnose-and-reset) |
| `secret set [SERVICE]` | 为 13 种服务之一、动态源或 registry 凭据存储服务密钥 {{help-sbx sbx secret set}} | `-t`、stdin、`--ref`、`--command`、`--refresh`（默认 `55m`）、`--no-verify`、`--show-error`、`--oauth`（仅在本地用于 openai）、`--sandbox`、`-f`、`--registry`、`--username`、`--password-stdin`、`--registry-auth-endpoint`、`--all-sandboxes` | 两者 | [§3.5](#s-sbx-secret-set-import-and-set-custom) |
| `secret import [SERVICE]` | 导入在主机环境变量中找到的密钥，带后四位字符预览 {{help-sbx sbx secret import}} | `--all`、`--force`、`--dry-run` | 两者 | [§3.5](#s-sbx-secret-set-import-and-set-custom) |
| `secret ls` | 列出全局和沙箱作用域中已存储的密钥 {{help-sbx sbx secret ls}} | `-g`、`--sandbox`、`--service`、`--json`、`-q` | 两者 | [§3.5](#s-sbx-secret-set-import-and-set-custom) |
| `secret rm [SERVICE]` | 删除一个密钥、一个 registry 凭据或全部密钥 {{help-sbx sbx secret rm}} | `--sandbox`、`--all`、`--all-sandboxes`、`--registry`、`-f`。示例还展示了 `--placeholder`，标志列表中没有它 | 两者 | [§3.5](#s-sbx-secret-set-import-and-set-custom) |
| `secret set-custom` | 为 sbx 不认识的服务存储密钥，放在代理会替换的占位符后面 {{help-sbx sbx secret set-custom}} | `--host`（可重复）、`--env`、`--value`、`-t`、`--command`、`--ref`、`--placeholder`（`{rand}` 后缀）、`--refresh`、`--sandbox`。仅云端：`--header`、`--format`、`--name` | 两者，实验性 | [§3.5](#s-sbx-secret-set-import-and-set-custom) |
| `settings get <key>` | 打印一个求值后的值 {{help-sbx sbx settings get}} | `--json` | 仅本地 | [§2.5](#s-sbx-settings-list) |
| `settings list` | 列出每项设置及其值、类型、来源、重启标志和描述 {{help-sbx sbx settings list}} | `--json`、`--no-trunc` | 仅本地 | [§2.5](#s-sbx-settings-list) 和 [R.3](#s-ref-settings-keys-environment-variables-and-paths) |
| `settings set <key> <value>`、`settings unset <key>` | 写入或删除用户覆盖 {{help-sbx sbx settings set}} | 无 | 仅本地 | [§2.5](#s-sbx-settings-list) |
| `template save SANDBOX TAG` | 把快照保存到沙箱运行时镜像存储 {{help-sbx sbx template save}} | `-o, --output`（也可导出 tar）、`--capture-mode disk\|all`（云）、`-d, --description`（云） | 两者 | [§2.3](#s-sbx-template-save-and-load) |
| `template load FILE [NAME]` | 把 tar 加载到镜像存储，或作为云模板上传 {{help-sbx sbx template load}} | `--cpus` 和 `--memory-mib`（与 `--cloud` 一起时必需，必须命名可计费的 shape）、`--capture-mode`、`--description` | 两者 | [§2.3](#s-sbx-template-save-and-load) |
| `template ls`、`template rm TAG\|ID\|NAME` | 列出或删除模板镜像 {{help-sbx sbx template ls}} | `--json`、`-q`、`-f` | 两者 | [§2.3](#s-sbx-template-save-and-load) |
| `template inspect NAME\|ID` | 显示一个云模板的完整元数据 {{help-sbx sbx template inspect}} | `--json` | v1 中仅云端 | [§2.3](#s-sbx-template-save-and-load) |
| `tui` | 打开交互式仪表板 {{help-sbx sbx tui}} | 无 | 两者 | [§1.1](#s-sbx-and-docker-agent) |
| `volume create\|inspect\|ls\|rm` | 管理持久云卷，沙箱退出时保存为快照 {{help-sbx sbx volume}} | `--json`、`-q`、`-f` | 仅云端 | [§7.1](#s-sbx-cloud-run-move-and-ttl) |

不带命令的 `sbx` 打开交互模式，`sbx tui` 按名称打开仪表板（[冲突 C44](#s-ref-sources-and-the-conflicts-register)） {{help-sbx sbx}}。

## 实验性命令 {#s-ref-sbx-commands-experimental-commands}

这些命令各自在帮助顶部打印一行 `EXPERIMENTAL: this command may change or be removed in future releases.` {{help-sbx sbx kit}}。

| 命令 | 用途 | 要紧的标志 | 作用域 | 章节 |
|---|---|---|---|---|
| `env create [PATH...]` | 置备 `sbxenv.yaml` 的密钥和绑定并创建沙箱 {{help-sbx sbx env create}} | `-y, --auto-approve`、`--clone`、`--env-arg`、`--env-args-file`、`--kit-arg`、`--kit-args-file`、`--name`、`--skip-host-commands` | 两者，实验性 | [§4.4](#s-sbxenv-yaml-and-sbx-env-plan) |
| `env run [PATH...]` | 需要时创建，然后连接到环境沙箱 {{help-sbx sbx env run}} | `env create` 的标志，加上 `-d, --detached` | 两者，实验性 | [§4.4](#s-sbxenv-yaml-and-sbx-env-plan) |
| `env plan [PATH...]` | 打印应用该文件会改变什么，并且什么都不改 {{help-sbx sbx env plan}} | `--clone`、`--env-arg`、`--kit-arg`、`--name`、`--skip-host-commands` | 两者，实验性 | [§4.4](#s-sbxenv-yaml-and-sbx-env-plan) |
| `env exec [PATH...] -- COMMAND` | 在环境沙箱中运行命令 {{help-sbx sbx env exec}} | `exec` 的标志，加上 `--env-arg`、`--env-args-file`、`--name` | 两者，实验性 | [§4.4](#s-sbxenv-yaml-and-sbx-env-plan) |
| `env rm [PATH...]` | 删除环境沙箱及其置备的密钥 {{help-sbx sbx env rm}} | `-f`、`--prune-bindings`、`--env-arg`、`--name`、`--skip-host-commands` | 两者，实验性 | [§4.4](#s-sbxenv-yaml-and-sbx-env-plan) |
| `kit add SANDBOX REFERENCE` | 用追加到 kit 列表的 mixin 重建沙箱 {{help-sbx sbx kit add}} | `--kit-arg`、`--kit-args-file` | 两者，实验性 | [§4.3](#s-sbx-kit-pack-push-sign-and-verify) |
| `kit builder status\|rm` | 显示或删除 `sbx-kit-builder` 沙箱及其构建缓存 {{help-sbx sbx kit builder}} | `-f`（rm） | 仅本地，实验性 | [§4.3](#s-sbx-kit-pack-push-sign-and-verify) |
| `kit builder history export\|inspect\|logs\|ls\|rm\|trace` | 在 builder 沙箱内运行对应的 `docker buildx history` 命令 {{help-sbx sbx kit builder history}} | 透传 | 仅本地，实验性 | [§4.3](#s-sbx-kit-pack-push-sign-and-verify) |
| `kit inspect REFERENCE` | 从目录、ZIP、OCI 引用或 git 仓库加载并显示 kit {{help-sbx sbx kit inspect}} | `--json`、`--kit-arg`、`--kit-args-file` | 两者，实验性 | [§4.2](#s-com-docker-sandbox-capabilities) |
| `kit pack DIRECTORY` | 校验 `spec.yaml` 目录并打包为 ZIP {{help-sbx sbx kit pack}} | `-o, --output`（默认 `<name>.zip`） | 两者，实验性 | [§4.3](#s-sbx-kit-pack-push-sign-and-verify) |
| `kit provenance REFERENCE` | 打印附在 OCI kit 上的 SLSA provenance，`UNSIGNED` 或 `VERIFIED` {{help-sbx sbx kit provenance}} | `--key`、`--certificate-identity`、`--certificate-identity-regexp`、`--certificate-oidc-issuer`、`--certificate-oidc-issuer-regexp`、`--insecure-ignore-tlog`、`--json` | 两者，实验性 | [§4.3](#s-sbx-kit-pack-push-sign-and-verify) |
| `kit pull REFERENCE` | 从 HTTPS registry 拉取 v1 ZIP 或 v2 tar.gz kit 制品 {{help-sbx sbx kit pull}} | `-o, --output` | 两者，实验性 | [§4.3](#s-sbx-kit-pack-push-sign-and-verify) |
| `kit push DIRECTORY REFERENCE` | 打包并推送 `spec.yaml` kit，并把 SLSA provenance 作为 OCI referrer 附加 {{help-sbx sbx kit push}} | `--sign`、`--key`、`--identity-token`、`--identity-token-file`、`--tlog-upload`（默认 `true`） | 两者，实验性 | [§4.3](#s-sbx-kit-pack-push-sign-and-verify) |
| `kit sign REFERENCE` | 用兼容 cosign 的 Sigstore 签名对 kit 签名，默认无密钥 {{help-sbx sbx kit sign}} | `--key`、`--identity-token`、`--identity-token-file`、`--tlog-upload` | 两者，实验性 | [§4.3](#s-sbx-kit-pack-push-sign-and-verify) |
| `kit validate REFERENCE` | 检查目录、ZIP 或 git 引用是否为有效 kit {{help-sbx sbx kit validate}} | `--json`、`--kit-arg`、`--kit-args-file` | 两者，实验性 | [§4.3](#s-sbx-kit-pack-push-sign-and-verify) |
| `kit verify REFERENCE` | 验证目录、git 引用或 OCI kit 上的签名 {{help-sbx sbx kit verify}} | `--key`、四个 `--certificate-*` 标志、`--insecure-ignore-tlog`、`--json` | 两者，实验性 | [§4.3](#s-sbx-kit-pack-push-sign-and-verify) |
| `setup` | 检测主机环境中的智能体密钥并导入被接受的那些 {{help-sbx sbx setup}} | 无 | 仅本地，实验性 | [§3.5](#s-sbx-secret-set-import-and-set-custom) |
| `setup ssh`、`setup ssh remove` | 写入或删除使 `ssh <name>.sbx` 生效的 SSH 客户端配置 {{help-sbx sbx setup ssh}} | `--alias`（默认 `*.sbx`） | 仅本地，实验性 | [§2.4](#s-sandboxd-diagnose-and-reset) |
| `skills add <repository>` | 从 git 仓库或 `owner/repo` 简写把 skill 安装到共享存储 {{help-sbx sbx skills add}} | `-s, --skill`、`-f` | 仅本地，实验性 | [§4.5](#s-sbx-skills-add-and-skills-true) |
| `skills import` | 从主机上的六个智能体目录导入 skill {{help-sbx sbx skills import}} | `--dry-run`、`-f` | 仅本地，实验性 | [§4.5](#s-sbx-skills-add-and-skills-true) |
| `skills ls`、`skills rm <skill>...`、`skills update [skill]...` | 列出、删除或刷新已安装的 skill {{help-sbx sbx skills ls}} | `--json`、`-q`、`-f` | 仅本地，实验性 | [§4.5](#s-sbx-skills-add-and-skills-true) |

`sbx kit ls` 不是一条命令，探测回答了 `unknown command`（[冲突 C46](#s-ref-sources-and-the-conflicts-register)）。随附树中的六个 `kit builder history` 页面保存的是错误而不是帮助文本。守护进程无法在 capture 沙箱下绑定其套接字 {{help-sbx sbx kit builder history ls}}。

## 其他命令 {#s-ref-sbx-commands-other-commands}

| 命令 | 用途 | 要紧的标志 | 作用域 | 章节 |
|---|---|---|---|---|
| `completion` | 为 shell 生成自动补全脚本 {{help-sbx sbx}} | 其帮助页不在随附树中 | 两者 | 无 |
| `help` | 关于任意命令的帮助 {{help-sbx sbx}} | 其帮助页不在随附树中 | 两者 | 无 |
| `login` | 登录 Docker {{help-sbx sbx login}} | `--username`、`--password-stdin` | 两者 | [§1.1](#s-sbx-and-docker-agent) |
| `logout` | 停止正在运行的本地沙箱并退出登录 {{help-sbx sbx logout}} | `-y, --yes` | 仅本地 | [§1.1](#s-sbx-and-docker-agent) |
| `version` | 打印 CLI 版本，带 `--json` 时还有服务器和运行时组件版本 {{help-sbx sbx version}} | `--json` | 两者 | [§2.4](#s-sandboxd-diagnose-and-reset) |

## 正文中出现但不在树中的名称 {#s-ref-sbx-commands-names-that-appear-in-text-but-not-in-the-tree}

`secret set` 的帮助点名 `sbx mount`，文档点名 `sbx ssh proxy`、`sbx policy approval`、`--model`、`--provider` 和 `--usb`（[冲突 C16](#s-ref-sources-and-the-conflicts-register)）。它们在随附树中都没有页面。本手册只记录 `--help` 打印的内容，[§2.4](#s-sandboxd-diagnose-and-reset) 把隐藏命令点名一次。每次 `sbx ... --help` 调用在 capture 期间也尝试打开到 `login.docker.com:443` 的 TLS 连接。capture 沙箱拒绝了该连接，打印的文本没有变化（[我们的来源记录（英文原文）](manuals/docker-sandboxes-101/research/sources/help-sbx-cloud.md)）。

Sources: research/sources/help-sbx.md (every `sbx` help page, 115 pages, sbx v0.47.0 0411f50ee4700fe7bd37e6e7e3aced563e850ca9); research/sources/help-sbx-cloud.md (`sbx --cloud --help` and the network note); research/sources/probes/sbx-kit-ls.txt, sbx-version.txt; research/conflicts-register.md rows C9, C16, C44, C46, C47; manual.json (section files and ids)
