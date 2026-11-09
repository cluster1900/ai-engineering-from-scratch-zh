# 术语表与图索引

> 下面每个术语在整本手册中只有一个含义，并标出定义它的章节，索引按论断列出每一幅图。

每个术语只定义一次，就在最后一列点名的那一节，并带上该节引用的来源。下面的含义来自帮助文本、schema、kit 规范，以及来源参考列出的文档。

## 术语表 {#s-ref-glossary-and-index-of-figures-glossary}

| 术语 | 在本手册中的含义 | 定义于 |
|---|---|---|
| 智能体 | `agents` 下的一个条目，带有模型、instruction、toolset，以及可选的子智能体 | [5.2](#s-agents-models-and-providers) |
| 智能体文件 | `docker-agent run` 加载的 YAML 或 HCL 文件，在 schema 中标题为 Docker Agent Configuration：`agents`、`models`、`providers`、`toolsets`，以及它们之间的规则 | [5.2](#s-agents-models-and-providers) |
| Alloy | 两个模型中间用逗号隔开的模型引用，`a,b`，运行时在一次对话中在两者之间交替 | [5.2](#s-agents-models-and-providers) |
| 证明 | 附着在 artifact 上的签名声明：kit 上的 SLSA provenance，或共享智能体上的 DSSE 发布声明 | [4.3](#s-sbx-kit-pack-push-sign-and-verify) 和 [6.4](#s-share-push-and-share-pull) |
| 审计记录 | 守护进程为每次决策在 auditkit 目录下写入的一行 JSONL，按时间、条数和大小轮转 | [7.2](#s-org-policies-profiles-and-the-audit-log) |
| 后台智能体 | 由 `run_background_agent` 启动的子智能体，在父智能体继续运行时执行 | [sub_agents、transfer_task 与 background_agents](#s-sub-agents-transfer-task-and-background-agents) |
| 绑定 | `credentials.yaml` 中的一条记录，记载一种服务的凭据机制和已批准的域名 | [3.5](#s-sbx-secret-set-import-and-set-custom) |
| 能力 | kit 向主机发出的带类型、带版本的请求，`com.docker.sandbox/<name>@N`，应答为授予、拒绝或询问 | [4.2](#s-com-docker-sandbox-capabilities) |
| Cassette | `--record` 写出的文件，保存一次运行的模型 API 交互，由 `--fake` 回放 | [5.1](#s-docker-agent-run-new-and-doctor) |
| Clone 模式 | `--clone` 工作区模式：主机仓库以只读方式挂载在 `/run/sandbox/source`，智能体在一份私有 clone 上工作，其提交通过 `sandbox-<name>` remote 返回 | [3.2](#s-clone-and-run-sandbox-source) |
| 云沙箱 | 通过 `sbx --cloud` 在 Docker 的计算上运行的沙箱，没有主机工作区，有规格和 TTL | [7.1](#s-sbx-cloud-run-move-and-ttl) |
| 委派 | `transfer_task` 工具：父智能体把任务发给子智能体，子智能体在子会话中运行并返回结果 | [sub_agents、transfer_task 与 background_agents](#s-sub-agents-transfer-task-and-background-agents) |
| 环境文件 | `sbxenv.yaml`，声明一个沙箱的智能体、kit、工作区、密钥、端口、MCP 服务器和主机命令 | [4.4](#s-sbxenv-yaml-and-sbx-env-plan) |
| 环境计划 | 应用一份环境文件会搭建的全部内容的列表，由 `sbx env plan` 打印，并在 `create` 或 `run` 动手之前批准 | [4.4](#s-sbxenv-yaml-and-sbx-env-plan) |
| Eval | `docker-agent eval` 在容器中回放并打分的已保存会话 | [5.6](#s-session-db-sessions-diff-and-eval) |
| Flavor | `flavors` 下的一个具名 YAML 补丁，在解析文件之前用 `--flavor` 应用 | [5.2](#s-agents-models-and-providers) |
| 正向代理 | 沙箱发出的 HTTP 和 HTTPS 请求所经过的主机代理。它执行策略并注入凭据 | [3.4](#s-sbx-policy-log-and-the-proxy) |
| 网关 | 沙箱看到的那一个 MCP 端点，在主机上提供服务，通过它到达每个已注册的服务器。Toolkit 网关和托管网关是同名的两件不同的东西 | [3.6](#s-sbx-mcp-add-load-and-static-mcp) |
| 治理配置 | 来自远程治理策略的具名配置，用 `--profile` 赋给一个沙箱 | [7.2](#s-org-policies-profiles-and-the-audit-log) |
| `handoff` | `handoffs:` 注入的工具。它把整段对话移交给同一会话中的另一个智能体，前一个智能体离开循环 | [sub_agents、transfer_task 与 background_agents](#s-sub-agents-transfer-task-and-background-agents) |
| Harness | 外部编码 CLI，`claude-code`、`codex`、`pi` 或 `opencode`，用它来运行智能体而不是用模型提供方 | [5.1](#s-docker-agent-run-new-and-doctor) |
| Hook | 在智能体 33 个生命周期事件之一运行的命令、builtin、模型或 evaluator | [5.5](#s-permissions-safety-and-hooks) |
| Kit | 一幅 OCI 镜像，其清单注解 `vnd.docker.sandbox.kit.descriptor` 携带它的声明。对 `sbx kit` 命令而言，是带 `spec.yaml` 的 v1 或 v2 artifact | [4.1](#s-syntax-docker-sandbox-kit-3-and-kit-yaml) |
| Kit 参数 | kit 声明的一个参数的值，以 `--kit-arg name=value` 给出 | [4.1](#s-syntax-docker-sandbox-kit-3-and-kit-yaml) |
| Kit 集合 | `kind: set` 描述符，列出若干 kit，并且从不发布 | [4.1](#s-syntax-docker-sandbox-kit-3-and-kit-yaml) |
| Mixin | `kind: mixin` 的 kit：叠加在 workload 文件系统上的一层，每次组合零个或多个 | [4.1](#s-syntax-docker-sandbox-kit-3-and-kit-yaml) |
| 模型引用 | `provider/model`、`models` 中的一个名字、`auto`、一个 alloy，或一个 `first_available` 列表 | [5.2](#s-agents-models-and-providers) |
| 模型网关 | 用 `--models-gateway` 设置的地址，模型流量经此路由，并带 Docker token | [R.6](#s-ref-providers-and-models) |
| 权限规则 | 针对工具名及其参数的 `allow`、`ask` 或 `deny` 模式，按 deny、再 allow、再 ask 求值 | [5.5](#s-permissions-safety-and-hooks) |
| 策略 | 控制沙箱能到达什么的一组规则。本地规则适用于所有沙箱或某一个 | [3.3](#s-sbx-policy-init-allow-deny-and-check-network) |
| 策略范围 | `global`，所有沙箱；或 `local`，用 `--sandbox` 点名的一个沙箱 | [3.3](#s-sbx-policy-init-allow-deny-and-check-network) |
| 预设 | `allow-all`、`balanced` 或 `deny-all`，用 `sbx policy init` 选择一次 | [3.3](#s-sbx-policy-init-allow-deny-and-check-network) |
| 提供方 | docker-agent 按 id 认识的模型 API，例如 `anthropic` 或 `dmr`，或 `providers` 下带自己的 base URL 的一个条目 | [5.2](#s-agents-models-and-providers) |
| 代理类型 | `sbx policy log` 的 `PROXY` 列：`forward`、`forward-bypass`、`transparent`、`network` 或 `browser-open` | [3.4](#s-sbx-policy-log-and-the-proxy) |
| Proxy-managed | 真实值留在主机上、由代理把哨兵值换进出站请求的凭据。也是字面哨兵值 `proxy-managed` | [3.5](#s-sbx-secret-set-import-and-set-custom) |
| 规则 | 一条策略的一条允许或拒绝条目，带有 `RULE_ID`、资源模式和协议 | [3.3](#s-sbx-policy-init-allow-deny-and-check-network) |
| 安全模式 | `strict`、`balanced`、`restricted` 或 `autonomous`：没有权限规则匹配时，运行时对一次工具调用做什么 | [5.5](#s-permissions-safety-and-hooks) |
| 沙箱 | 带有自己的内核和私有 Docker Engine 的 microVM，智能体在其中作为容器运行。它有名称、工作区、模板和生命周期 | [2.1](#s-sbx-run-create-stop-and-rm) |
| `sandboxd` | 拥有每一个本地沙箱的主机守护进程，通过 Unix socket 访问 | [2.4](#s-sandboxd-diagnose-and-reset) |
| 密钥 | `sbx secret set` 为 13 种服务之一、自定义主机或仓库存在主机钥匙串中的值。它从不进入沙箱 | [3.5](#s-sbx-secret-set-import-and-set-custom) |
| 哨兵值 | 智能体看到的、用来代替密钥的占位值，例如 `proxy-managed` | [3.5](#s-sbx-secret-set-import-and-set-custom) |
| 会话 | `session.db` 中一次对话的记录：每条消息、工具调用、子智能体运行和费用 | [5.6](#s-session-db-sessions-diff-and-eval) |
| 规格 | 可计费的云尺寸，`micro`、`small`、`medium`、`large` 或 `xl`，从 1 vCPU 和 2048 MiB 到 16 vCPU 和 32768 MiB | [7.1](#s-sbx-cloud-run-move-and-ttl) |
| Skills 存储 | `SKILL.md` skill 的共享目录，sbx 把它链进每个沙箱，默认只读 | [4.5](#s-sbx-skills-add-and-skills-true) |
| 静态集合 | 创建时用 `--static-mcp` 固定的 MCP 服务器，相对于后来用 `sbx mcp load` 附加的服务器 | [3.6](#s-sbx-mcp-add-load-and-static-mcp) |
| 子智能体 | 列在 `sub_agents` 中、父智能体用 `transfer_task` 委派给它的智能体 | [sub_agents、transfer_task 与 background_agents](#s-sub-agents-transfer-task-and-background-agents) |
| 模板 | 沙箱启动所用的容器镜像：默认的 `docker/sandbox-templates:<agent>` 镜像、已保存的快照，或已加载的 tar | [2.3](#s-sbx-template-save-and-load) |
| Toolset | `toolsets` 下的一个条目，`type` 来自 27 种内置类型，给智能体一组工具 | [5.3](#s-toolsets-and-mcps) |
| 透明代理 | 拦截 HTTP 和 HTTPS 以外的 TCP 流量的主机代理。它执行策略，什么都不注入 | [3.4](#s-sbx-policy-log-and-the-proxy) |
| TTL | 云沙箱的存活时间，默认 1 小时，从创建起有 24 小时上限 | [7.1](#s-sbx-cloud-run-move-and-ttl) |
| Workload | `kind: workload` 的 kit：带 entrypoint、cmd、env、user 和 workdir 的根文件系统，每次组合恰好一个 | [4.1](#s-syntax-docker-sandbox-kit-3-and-kit-yaml) |
| 工作区 | 沙箱按同一绝对路径挂载的主机目录，默认可读写，额外路径标为 `:ro` | [2.1](#s-sbx-run-create-stop-and-rm) |

## 图索引 {#s-ref-glossary-and-index-of-figures-index-of-figures}

每个编号链到它的图，论断是打开说明文字的那句粗体句子。

```figure-index
```

Sources: the definition paragraphs of sections 2.1 to 7.2 as research/plan.md plans them; research/sources/help-sbx.md (`sbx create claude`, `sbx template`, `sbx kit`, `sbx policy`, `sbx policy init`, `sbx policy allow network`, `sbx policy log`, `sbx secret`, `sbx secret set-custom`, `sbx mcp ls`, `sbx run`, `sbx template load`, `sbx ttl`, `sbx policy profile`, `sbx daemon status`, `sbx skills`); research/sources/help-docker-agent.md (`run`, `eval`, `serve`); research/sources/agent-schema.json (`AgentConfig`, `HooksConfig`, `HarnessConfig`, `Toolset`); research/sources/SPEC-v3-at-v3.0.0-m.8.md §1, §3.4, §7; research/sources/docs-sandboxes.md (pages architecture, configuration/credentials, governance/audit); research/sources/docs-docker-agent.md (pages concepts/models, concepts/agents, configuration/flavors, configuration/permissions, features/sessions, features/cli); the figure blocks of front.md and every file under sections/
