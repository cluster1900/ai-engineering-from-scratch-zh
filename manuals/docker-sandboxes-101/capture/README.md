# Docker Sandboxes 与 Docker Agent 101 capture kit

手册中的每一段代码清单都从 `out/` 中的一个文件截取。本 kit 在运行它的主机上驱动真实的 `sbx`、`docker-agent` 和 `docker` 二进制，记录它们打印的内容，并掩码每次运行都会变化的值。它只用 Python 标准库。

```bash
python3 run.py                  # writes out/; replays the model cassettes in cassettes/
python3 run.py --re-record      # the same, but records every cassette anew with Docker Model Runner
python3 run.py --check          # captures again into a temporary directory and compares with out/
python3 run.py --tier a         # only the steps that need no daemon, no network, and no model
python3 run.py --tier ab        # without the model tier
python3 run.py --only K09,K10   # a subset of steps, for development; earlier steps must have left their sandboxes in place
```

一次跑完三个层级会从空的 `out/` 开始，保留那两个一次性文件，并重写 `out/README.md`。跑更少层级（包括跳过层级 M 时的默认运行）以及带 `--only` 的运行，只重写它们的步骤会写入的文件，并删除这些步骤的 `<step>-error.txt` 文件。`out/` 中的其他每个文件，包括 `out/README.md`，保持原样。`--check` 只写入它的临时目录和被忽略的 `work/`，并且从不录制 cassette。`cassettes/` 中缺失的 cassette 会报告为 drift。

这个主题无法离线 capture，而这是手册标准所要求的。`sbx` 从 Docker Hub 上的镜像启动真实的 microVM，并且需要 Docker 登录，智能体运行还需要模型。因此 kit 分了层级，当主机无法运行它们时 `run.py --check` 以退出码 0 跳过，这样仓库 CI（其中没有任何这些二进制）保持绿色。一台装有 `docker-agent`、`sbx` 和 `docker` 但没有 Docker Model Runner 或没有 `ai/qwen3` 的主机会运行层级 A 和 B，并打印 `tier m skipped`。

## 层级

| 层级 | 需要 | 在本 kit 版本中 |
|---|---|---|
| A | 已安装 `docker-agent`、`sbx` 和 `docker` 客户端；无守护进程、无网络、无模型、无密钥 | K00 版本、K01 根帮助、K16 `docker-agent version`、`doctor`、`toolsets`、`models list`、`sandbox list`、`run --dry-run`、K29 Desktop 4.94 的遗留命令（`docker sandbox`、`docker agent version`、插件列表） |
| B | 已登录的 `sbx` v0.47.0、sandboxd 守护进程、从 Docker Hub 拉镜像、出站 HTTPS 到 `example.com` 和 `mcp.deepwiki.com` | 沙箱生命周期、端口、cp、策略、带主机接收器的密钥、MCP、v2 和 v3 kit、`env plan`、skills、模板、`--clone`、prune，以及 `docker-agent share pull` |
| M | Docker Desktop 4.94.0，Docker Model Runner 在 TCP 12434 上且已拉取 `ai/qwen3:4b`，用于容器的 `docker` 守护进程、Compose、buildx 和本地仓库 | K17 到 K28：`docker-agent new`、一次智能体运行、一个团队、权限和 hook、会话、eval、五台服务器、share push 和 pull、DMR、Compose、`run --sandbox`、v3 kit 构建；K98 移除本层级创建的东西 |
| C | 花钱（Cloud Sandboxes）、GitHub token、改动 `~/.ssh/config` | 未实现；`--tier abcm` 打印一条说明并运行 A、B 和 M。步骤以层级字母 `c` 填入 `run.py` 的 `STEPS` |

层级 A 用 `DOCKER_CONTEXT=m101-no-daemon`（一个不存在的 Docker context）运行 `docker-agent doctor`、`models list` 和 `run --dry-run`，所以这些文件在每台主机上（无论有没有 Docker Desktop）都展示没有 Model Runner 的路径（`16-doctor.txt`、`16-dry-run.txt`）。K25 在 Model Runner 可达时记录同样的 `doctor`（`25-doctor.txt`）。

## 模型层级与 cassette

层级 M 的每一次智能体运行都通过主机上的 Docker Model Runner 使用 `dmr/ai/qwen3:4b`。没有 Model Runner 时，`docker-agent doctor` 为 `auto` 点名 `dmr/ai/qwen3:latest`（8B 构建）（`16-doctor.txt`）。只拉取了 4B tag 时，它点名 `dmr/docker.io/ai/qwen3:4b`（`25-doctor.txt`）。在录制主机上，两次拉取 8B tag 都在最后一个 5.03 GB blob 之后以 digest 不匹配结束（`25-model-pull-latest.txt`），所以 kit 在每一份智能体文件和 `--judge-model` 中都点名同一仓库的文档 4B tag。不涉及托管提供方，也不涉及 API 密钥。

`docker-agent run --record=cassettes/NAME` 把与模型的 HTTP 交换写入一个 YAML 文件（go-vcr v2 cassette：`docker-agent` 发出的请求和它收到的流式回复），`--fake cassettes/NAME` 通过本地假代理回放它们，完全没有模型。`serve api` 接受同样的两个标志。帮助没有说的三件事，是跑出来的：`--record` 只接受 `--record=PATH` 这种形式的值（单独一个词会被读成智能体引用）；路径相对于 `--working-dir`，所以 kit 传入绝对路径；并且对 `dmr` 提供方，除非这次运行还带 `--models-gateway http://localhost:12434/engines`，录制代理会回答 400，而显式的 `providers.*.base_url` 会绕过录制器，让 cassette 留空。文件缺失或给出 `--re-record` 时 kit 录制一份 cassette（一次输出被丢弃的录制运行）。它在录制前从 `work/cassettes/` 删除旧 cassette，录制运行把会话放在 `--data-dir work/record-data`，所以只有回放进入 `work/data/session.db`（`21-session-db.txt`）。`out/` 中的每个文件都来自 `--fake` 回放，所以任意主机上的 `--check` 都是同类比较。cassette 以 `cassettes/NAME.yaml.gz` 提交，capture 目录写成 `$CAPTURE`，家目录写成 `$HOME`。`run.py` 用运行它的主机的路径把它们解包到 `work/cassettes/`，因为回放按请求体匹配每一个请求，有些请求体带着工作目录，并且它在 `--re-record` 之后再次打包 cassette。`run.py` 用 `realpath` 解析自己的目录，并从它启动的命令的环境中移除 `PWD`。于是命令、解包后的 cassette，以及子进程报告的工作目录使用同一路径，即使 checkout 是通过诸如 macOS 上 `/tmp` 这样的符号链接到达的。它们持有 prompt、工具定义和模型文本，没有凭据：模型在 localhost 上运行，不需要密钥，请求也不携带密钥。`ai/qwen3:4b` 是思考模型，所以一次运行在每个回答之前会流式输出几千个推理 token；`--exec` 打印它们，kit 把它们删节（`[... N lines of model reasoning cut ...]`），`--json` 文件丢掉 `agent_choice_reasoning` 事件并拼接 `agent_choice` token，`*-transcript.txt` 文件按顺序列出用户消息、工具调用、工具结果和回答。

没有 `--fake` 的步骤按它们从模型出来的样子比较，带 `temperature: 0`：`eval`（`22-*`）、`serve chat`、`serve mcp --http`、`serve a2a`（`23-chat.http`、`23-mcp.http`、`23-a2a.http`）、带显式 `base_url` 的运行（`25-run-dmr.txt`），以及 `run --sandbox`（`27-*`，模型从 VM 内部调用）。它们的智能体文件要求固定回答，会变化的数字（token、费用、时长、id）被清洗。`docker-agent new` 即使给了描述也会打开 `/dev/tty`，所以 kit 在没有控制终端的情况下运行它，`17-new.txt` 记录了那次拒绝。

回放代理按请求体匹配每一个请求。当一个回合发出两次工具调用时，运行时并行执行它们并按完成顺序追加结果，于是下一次请求体每次运行都不同，回放回答 500（"requested interaction not found"）。4B 思考模型只要一条消息要两件事就会把调用打成一批，`parallel_tool_calls: false` 和一次只调用一个工具的指令都改变不了这一点（llama.cpp 忽略该标志）。因此 kit 给每一次智能体运行若干条消息，每条一次工具调用（`docker-agent run … "first" "second"`，帮助文本意义上的回合），这样录制的交换和回放保持相同。

带工具调用的录制回合在 4B 思考模型上要一到三分钟（M 系列笔记本），回放只要几秒。对每一份 cassette 做 `--re-record` 大约半小时。

## 完整运行的先决条件

- 带 Hypervisor.framework 的 Apple silicon 上的 macOS（`sysctl kern.hv_support` 为 1）。
- 来自 Homebrew cask 的 `sbx` v0.47.0，已登录（`sbx login` 由你完成，从不由 kit 完成），守护进程健康。若 `sbx daemon status` 失败，kit 会启动一次守护进程。
- 来自 Homebrew 的 `docker-agent` v1.149.0，在 `PATH` 上排在 Desktop 插件前面（`docker agent` 是捆绑的 v1.144.0，只被 K29 使用）。
- Docker Desktop 4.94.0 正在运行（Engine 29.8.2、buildx v0.37.2、Compose v5.5.1、`docker model` v1.2.6），已启用 Docker Model Runner 并在主机 TCP 端口 12434 上（`docker model status` 显示 "running"，`curl http://localhost:12434/engines/v1/models` 有应答），并且由你完成 `docker model pull ai/qwen3:4b`（约 2.5 GB）。kit 从不自己拉模型；任何加载 DMR 智能体文件的 `docker-agent` 命令都会自行拉取缺失的模型，所以 kit 拒绝启动层级 M，直到 `docker model ls` 列出 `ai/qwen3:4b`。
- Python 3.12 或更高，git，curl。
- 磁盘：`docker/sandbox-templates:shell-docker` 和一个已保存模板约 1.3 GiB（层级 B）；层级 M 的镜像 `registry:2`、`alpine:3.22`、`docker/mcp-gateway`、`docker/docker-agent:1.149.0`、`docker/sandbox-templates:shell`（压缩后 521 MB）、`docker/sandbox-kit:3`、`moby/buildkit:buildx-stable-1`，以及沙箱模板 `docker/docker-agent-sbx-templates:latest`。
- 主机上空闲的端口：18080（密钥接收器）、18081（已发布的沙箱端口）、8080、8081、8082、8083（`serve api`、`mcp`、`a2a`、`chat`）、15000（本地仓库；端口 5000 被 macOS 上的 AirPlay Receiver 占用，所以 kit 绑定 `127.0.0.1:15000`）。
- 全局网络策略要么未初始化，要么已经是 `balanced`。发现它未初始化的那次运行会执行一次 `sbx policy init balanced` 并记录 `03-policy-init.txt`。kit 从不运行 `sbx reset`、`sbx policy reset`、`sbx setup ssh`、`sbx login`、`sbx logout`，或任何带 `--cloud` 的命令，也从不更改全局策略规则或 `sbx settings` 键。

三个层级的一次完整运行，在 cassette 已回放、镜像已在场的 M 系列笔记本上大约 17 分钟（层级 B 大约八个镜像，其余给现场模型步骤：eval、五台服务器、沙箱运行、kit 构建）；首次拉取和 `--re-record` 另算。

## kit 创建和移除什么

全部命名为 `m101-*`：沙箱 `m101-demo`、`m101-demo-2`、`m101-secret`、`m101-mcp`、`m101-mcp-dyn`、`m101-kit`、`m101-from-tpl`、`m101-clone`、`m101-v3`；模板 `m101-tpl:v1`；MCP 注册 `m101-deepwiki`；变量以 `M101_` 开头的自定义密钥；网络 `m101-net` 上的容器 `m101-registry`；buildx builder `m101-builder`；Compose 项目 `m101`；镜像 `localhost:15000/m101/hello-kit:*` 和 `localhost:15000/docker/sandbox-templates:shell`；`docker-agent run --sandbox` 为 `fixtures/repo` 创建的沙箱。运行以一次清扫开始，移除先前尝试的残留，并以对它们全部执行 `sbx rm`、`sbx template rm`、`sbx mcp rm`、`sbx secret rm`、`docker rm`、`docker network rm`、`docker buildx rm` 和 `docker image rm` 结束，再加上 `docker model unload ai/qwen3:4b`，它卸载 kit 的模型而不卸载其他（`98-model-final-state.txt`、`99-final-state.txt`）。沙箱范围的策略规则随沙箱一起消失。已初始化的全局策略和已拉取的镜像留下。

`docker-agent` 把状态放在 `work/` 下：`--config-dir work/cfg`、`--data-dir work/data`（含 `session.db`）、`--cache-dir work/cache`（models.dev 目录和暂存的沙箱 kit）传给模型层级的每一条命令，所以 `~/.cagent` 或 `~/.config/cagent` 下什么都不读、不写。cassette 录制运行改为使用 `--data-dir work/record-data`。`out/` 中的命令行把这三个标志略去。

kit 存储的唯一密钥值是占位的 `m101-dummy-receiver-0000`（自定义密钥，结束时移除）和 `m101-chat-key`（`serve chat` 的 `--api-key`，该服务器运行期间有效）。不读、不写任何真实的 token、密钥或密码。

## 这些 fixture

| 路径 | 使用者 |
|---|---|
| `fixtures/repo/` | 每次运行生成：一个带两次固定日期提交的 git 仓库，所以每台主机上的 hash 相同；也是智能体运行的工作目录 |
| `fixtures/repo-clone/`、`fixtures/repo-kit/`、`fixtures/repo-sandbox/` | `repo/` 的新副本，给 `--clone`、`--kit` 和 v3 kit 沙箱，以及给 `docker-agent run --sandbox`，后者要求 `--data-dir` 在已挂载的工作区内部（`repo-sandbox/.m101-data`） |
| `fixtures/kits/hello-mixin/` | 一个 v2 mixin（`spec.yaml`、`files/workspace/HELLO.md`），安装 `tree` 并允许 `example.com` |
| `fixtures/kits/env-mixin/` | 一个带一个变量和一个允许主机的 v2 mixin，即 `sbx kit add` 接受的形态 |
| `fixtures/kits/hello-kit/kit.yaml`、`HELLO.md` | 一份带 `# syntax=docker/sandbox-kit:3` 的 v3 工作负载描述符，在 `docker/sandbox-templates:shell` 上有内联 `build:` 块，以及一项 `com.docker.sandbox/network-policy@2` 能力；v2 工具链拒绝它（`13-*`），buildx 构建并推送它（`28-*`） |
| `fixtures/env/sbxenv.yaml` | `sbx env plan` 的环境文件 |
| `fixtures/agents/greeter.yaml` | `docker-agent run --dry-run` 的智能体文件 |
| `fixtures/agents/files.yaml` | 一个带 `filesystem` 和 `shell`、跑在 `dmr/ai/qwen3:4b` 上的智能体，`temperature: 0`（K18、K21、K22、K24） |
| `fixtures/agents/files-sandbox.yaml` | 同一个智能体，带 `providers:` 块，其 `base_url` 为 `http://host.docker.internal:12434/engines/llama.cpp/v1`，用于沙箱内的运行（K27） |
| `fixtures/agents/team.yaml` | `root` 带 `sub_agents: [writer]`、`handoffs: [reviewer]` 和 `background_agents` toolset（K19） |
| `fixtures/agents/guarded.yaml` | `shell` 带 `permissions.allow`/`deny` 模式，以及带 `preempt_yolo: true` 的 `pre_tool_use` 命令 hook（K20） |
| `fixtures/agents/dmr.yaml` | Docker Model Runner 的显式 `providers:` 块，`base_url: http://localhost:12434/engines/llama.cpp/v1`（K25）；它的运行在每次 capture 上都是现场的，因为显式 `base_url` 会绕过 `--record` 代理 |
| `fixtures/agents/pong.yaml` | 回答 `pong` 的智能体，用五种方式提供服务（K23） |
| `fixtures/hooks/log-hook.sh` | hook：把它的 stdin JSON 追加到 `$M101_HOOK_LOG` 并打印一个 `allow` 决定 |
| `fixtures/evals/*.json`、`fixtures/evals/working_dirs/repo/` | 文档格式的两次 eval 会话（一次 `shell` 调用、一次 `list_directory` 调用、一条相关性陈述、一个尺寸）以及它们挂载的工作目录 |
| `fixtures/compose/compose.yaml` | 顶层 `models:` 元素、带 `use_api_socket: true` 的 `docker/mcp-gateway` 服务，以及打印其注入的 `LLM_URL` 和 `LLM_MODEL` 的 `printer` 服务 |
| `fixtures/mcp-probe.sh` | 在沙箱内运行：对 `$MCP_GATEWAY_URL` 做 `initialize`、`notifications/initialized`、`tools/list`，带 `Mcp-Session-Id` 头 |
| `cassettes/*.yaml` | 已录制的模型交换，由 `--fake` 回放：`18-files`、`19-team`、`19-background`、`20-strict`、`20-restricted`、`23-api`，合计约 16 MB，因为思考模型的每一个流式推理 token 都在里面 |

生成的目录列在 `.gitignore` 中。`work/` 持有模板 tar、kit zip、拉取的智能体文件、`docker-agent` 状态目录、服务器日志、eval 结果和 `buildkitd.toml`，并且每次运行都会重建。

## 掩码

文件在写出时被掩码，所以 `out/` 不持有用户名、id 和时间戳，`--check` 逐字节比较，本 README 末尾点名的主机事实除外。路径掩码只在路径结尾处匹配，所以家目录 `/home/dev` 会把 `/home/developer` 原样留下。用户名只作为路径段掩码，Docker 用户只在 `signed_in_as` 之后掩码，所以用户 `root` 不会改写智能体名 `root`。规则是 `run.py` 中的 `MASKS` 表、`mask_text` 中的逐行规则，以及 JSON 键集合 `SCRUB_KEYS`：

| 模式 | 记号 |
|---|---|
| 本目录经 `realpath` 后的绝对路径 | `$CAPTURE` |
| 家目录，然后是 `/` 之后作为路径段的用户名 | `$HOME`、`$USER` |
| `signed_in_as`（`sbx mcp ls --json`）或 "signed in as" 之后的 Docker Hub 用户 | `<docker-user>` |
| `m101-policy-<6hex>` 和 `m101-secret-<6hex>` 的每次运行后缀（新名字，因为守护进程按沙箱名跨 `sbx rm` 保留 `sbx policy log`） | `m101-policy`、`m101-secret` |
| UUID（沙箱 id、策略和规则 id、`SANDBOX_ID`、会话 id） | `<uuid>` |
| 12 位十六进制镜像和层 id、`kit-<hash>`、swap 容器名 | `<id>`、`-swap-<id>` |
| 64 位十六进制 digest 和容器 id | `sha256:<digest>`、`<sha256>` |
| RFC 3339 时间戳、`YYYY/MM/DD hh:mm:ss` 日志戳、策略日志 `LAST SEEN` 列、HTTP `Date` 头 | `<ts>`、`<http-date>` |
| `127.0.0.1:`、`[::1]:`、`::1:` 或 `"host_port":` 之后 49152 到 65535 的临时主机端口 | `<port>` |
| `Mcp-Session-Id` 值和 SSE 事件 id | `<session>`、`<event-id>` |
| 自定义密钥占位符 `sbx-cs-…` 和 `sk-…` | `sbx-cs-<rand>`、`sk-<rand>` |
| `PROXY_CA_CERT_B64` | `<base64>` |
| kit 安装时长、诊断字节数、空闲磁盘空间、请求计数、镜像大小、`ls -la` 日期、`df` 列、"N days ago" | `<dur>`、`<n>`、`<date>`、`<age>`、`<size>` 及同类 |
| `sbx create` 的拉取进度块（首次运行时下载，之后已在场） | `<layers>` |
| 工具调用 id（文本中的 `call_…`，JSON 中 `tool_call_id` 和 `id` 下 20 个以上字符的 id）、聊天补全 id、`sandbox-kits/` 下的 kit hash、eval 运行名 | `call_<id>`、`<call-id>`、`chatcmpl-<id>`、`sandbox-kits/<hash>`、`<run>` |
| `docker/mcp-gateway` 打印的 bearer token、网关计时、Compose 输出中的 ANSI 转义和重复进度行 | `Bearer <token>`、`<dur>`、已丢弃 |
| buildx 步骤时长和 `View build details` 链接 | `DONE <dur>`、`<url>` |
| `Container`、`Network`、`Volume`、`Image` 行之后的 Compose 进度时长 | `<dur>` |
| token、费用、时间戳、时长和序号键下的 JSON 数字（`SCRUB_KEYS`） | `"<n>"` |

`sbx policy log` 的 capture 在写出前经过过滤和排序。守护进程按沙箱名保留该日志，并且跨 `sbx rm` 保留，所以同一台机器上的第二次运行会看到第一次留下的行，并且它按时间排序行。kit 只保留它自己联系过的主机的行（`example.com:443`、`localhost:18080` 和 `gateway.docker.internal:18080` 上的接收器，以及模板每次启动都会到达的两台主机 `ports.ubuntu.com:80` 和 `download.docker.com:443`），按主机排序。集合是 `run.py` 中的 `DEMO_HOSTS` 和 `SECRET_HOSTS`。

buildx 日志（`28-buildx*.txt`）丢掉层传输行，每个步骤只保留一次。`28-manifest.json` 解码 `vnd.docker.sandbox.kit.descriptor` 注解，并把它派生的 `provides` 列表截到五个条目。

`03-policy-init.txt` 只由初始化全局策略的那次运行写出，`--check` 不比较它。在录制主机上，策略在 kit 第一次运行前几小时用同一条命令 `sbx policy init balanced` 手工初始化，所以 `out/` 中的文件持有当时打印的、kit 自己格式的该命令输出。`25-model-pull-latest.txt` 是失败的 8B 拉取的 Model Runner 日志，写一次且不比较。

## 录制环境

- sbx v0.47.0（revision 0411f50ee4700fe7bd37e6e7e3aced563e850ca9，API 0.38.0），模板 `docker/sandbox-templates:shell-docker` 镜像 id 1560168ac5fb（Ubuntu 26.04.1，内核 7.0.14，Docker Engine 29.8.1）
- docker-agent v1.149.0（Homebrew）；旁边是 Desktop 插件 `docker agent` v1.144.0
- Docker Desktop 4.94.0：client 29.2.1，Engine 29.8.2，buildx v0.37.2，Compose v5.5.1，mcp v0.44.1，model v1.2.6 带 llama.cpp b9879-metal；kit 前端 `docker/sandbox-kit:3` 解析为 sandbox-kit 3.0.0-m.8
- 模型 `ai/qwen3:4b` 在 `localhost:12434` 的 Docker Model Runner 上；`ai/qwen3:latest`（8B，5.03 GB）在录制主机上拉不下来
- macOS 26.2（25C56），arm64，Python 3.14

确切的行是 `out/README.md` 的顶部，`run.py` 在三个层级都跑时从 `sbx version`、`docker-agent version`、`docker --version` 和 `docker model ls` 写出。

`--check` 比较主题版本：`out/README.md` 的 `sbx`、`docker-agent` 和模型行，以及 `00-versions.txt` 的 `sbx version` 和 `docker-agent version` 块。它略去主机事实，即 `out/README.md` 的 `docker` 和 `host` 行，以及 `00-versions.txt` 的 `sw_vers`、`uname -m`、`sysctl kern.hv_support` 和 `python3 --version` 块（`run.py` 中的 `HOST_FACTS`）。因此仅 macOS、Python 或 Docker Desktop 更新，在这两个文件中不算 drift，下一次完整运行会记录新值。主题就是 Docker Desktop 本身的 capture，例如 `29-docker-plugins.txt` 中的插件列表，仍会随它变化。

## 录制运行展示了而文档或计划没有说的内容

- 没有附加会话的沙箱在最后一个会话结束后 30 秒自行停止（`04-auto-stop.txt`，守护进程日志："auto-stop grace period expired"）。`sbx exec`、`sbx cp` 和 `sbx ports --publish` 会再次启动它。kit 在每条录制命令之前运行 `sbx exec NAME true`，这样 "started successfully" 这一行不会随机出现。
- 对已经在同一范围有 `allow` 规则的主机做 `sbx policy deny` 会作为冲突被拒绝（`09-deny-conflict.txt`）。帮助文本说 deny 优先；守护进程不存储这一对。
- `sbx template save` 在终端外拒绝正在运行的沙箱，并要求先 `sbx stop`（`07-template-save.txt`）。本版本中 `sbx template inspect` 仅限云（`07-template-inspect.txt`）。
- `sbx kit validate` 和 `sbx kit pack` 拒绝 v3 源 kit；`sbx kit inspect` 通过 Docker 守护进程用它自己的 builder kit 构建它，并且在 Desktop 4.94.0 上用默认 overlay2 镜像存储时，该构建以 "OCI exporter is not supported for the docker driver" 失败（`13-kit-v3-inspect.txt`、`28-kit-inspect-source.txt`）。`sbx kit` 的 artifact 命令是 v1 和 v2 工具链。
- 用默认 `docker` driver 的 `docker buildx build -f kit.yaml --push` 推送 Docker schema 2 清单并丢掉每一个注解，所以仓库里没有 `vnd.docker.sandbox.kit.*` 键（`28-buildx-docker-driver.txt`、`28-manifest-docker-driver.json`）。`docker-container` builder 推送一份 OCI index，其平台清单携带四条 kit 注解和派生的 `org.opencontainers.image.*` 键（`28-buildx.txt`、`28-manifest.json`）；index 本身不携带它们，尽管规范说有 attestation 清单时它们会被提升到 index 上（`28-index.json`）。builder 容器看不到守护进程的镜像，所以 kit 把基础镜像发布到本地仓库，并在 `work/buildkitd.toml` 中把它声明为 `docker.io` 镜像（`28-builder.txt`）。
- `sbx` 以默认的 `kit.allowedSources` 值 `docker.io/` 拒绝已推送的 kit，`kit inspect` 和 `create` 都是如此（`28-kit-inspect.txt`、`28-run-kit.txt`）。kit 不更改该项设置。
- `sbx kit add` 拒绝声明静态文件的 mixin，并接受仅限于变量、安装命令和网络允许的 mixin（`12-kit-add-files.txt`、`12-kit-add.txt`）。
- 帮助自己的仓库示例 `https://registry.modelcontextprotocol.io/v0/servers/fetch-mcp/versions/latest` 回答 404（`11-mcp-add-registry.txt`）。
- 自定义密钥到达它之后创建的沙箱；已有沙箱拿不到该变量，如该命令自己的说明所说（`10-env-existing.txt`、`10-env-sentinel.txt`）。代理在发往绑定主机的请求中，无论有没有 `Bearer`，都在任意头里替换占位符（`10-receiver.log`）。
- 在沙箱内部，代理是 `gateway.docker.internal:3128`，MCP 网关是 `MCP_GATEWAY_URL=http://mcp-gateway.docker.internal/mcp`，`host.docker.internal` 通过诸如 `localhost:18080` 这样的规则到达主机（`04-env.txt`、`04-guest.txt`、`10-*`）。
- 带 `--exec` 和 `--safety strict` 时，没有模式裁决的调用会引发 `tool_call_confirmation`。没有终端来回答它时，工具结果读作 "The user rejected the tool call"。带 `--safety restricted` 时，同样的 `pwd` 调用会运行并打印 `$CAPTURE`。两种模式下 `allow` 模式都运行 `echo`，`deny` 模式以 "denied by permissions configuration" 拦住 `rm`（`20-strict.txt`、`20-restricted.txt`、`20-restricted.ndjson`）。在一条消息里要三个命令时，模型并行发出三次 shell 调用，`pre_tool_use` hook 同时跑了三次，其中两次在同一时刻追加到日志文件（`fixtures/hooks/log-hook.sh` 用一次 `printf` 写每条记录；`20-hook-stdin.jsonl` 已排序）；kit 要求每条消息一个命令。
- 在一条消息里问时，4B 思考模型在同一回合回答一次 `transfer_task` 和一次 `handoff`；kit 分两条消息问（`19-transcript.txt`）。在 `--exec` 的默认安全下，一次后台智能体运行（`run_background_agent`）会引发确认，没有终端就被拒绝，模型重复同一调用直到运行时在五次之后停掉它（"detected 5 consecutive identical calls"，`19-background.txt`）。
- Desktop 上的 Compose 5.5.1 把 `LLM_URL=http://model-runner.docker.internal/v1/` 和 `LLM_MODEL=ai/qwen3:4b` 注入服务，是 `/v1/` 根而不是 Compose 文档展示的 `/engines/v1/` 路径，并且 `GET ${LLM_URL}models` 从容器内部应答（`26-compose-up.txt`）。`docker/mcp-gateway` 服务在没有服务器的情况下启动，打印一个随机 bearer token，并对裸请求回答 401。
- `docker-agent run --sandbox` 拒绝已挂载工作区之外的 `--data-dir`、`--cache-dir` 和 `--config-dir`（"must be inside the sandbox's writable workspace"，`27-data-dir-outside.txt`），所以要保持 `~/.cagent` 不动的 kit 必须把它们放在工作区下。随后启动会打印模型网关、`models.dev` 允许列表、`docker agent sandbox allow` 主机、挂载（工作区 rw、智能体文件的目录 ro、暂存的 kit ro、配置目录 ro）、镜像和 VM 尺寸，并创建 `docker-agent-<hash>`（`27-sandbox-run.txt`、`27-sbx-ls.txt`、`27-kit-cache.txt`）。在 VM 内部，运行随后在任何模型调用之前死去：SQLite 无法在 virtiofs 工作区挂载上创建会话存储（"attempt to write a readonly database (1032)"），在同一挂载上插入一行的普通 `python3 -c 'sqlite3.connect(...)'` 也能复现（`27-sqlite-probe.txt`）。VM 被留下运行，如文档所说，kit 用它做端到端证据：`sbx exec <sandbox> docker-agent --data-dir /tmp/m101 … run --exec --last` 带上 `base_url` 为 `http://host.docker.internal:12434/engines/llama.cpp/v1` 的智能体文件，从 VM 内部回答任务，所以主机上的模型通过沙箱代理、在 `docker agent sandbox allow` 加入的 `localhost:12434` 规则下到达（`27-inside-run.txt`）。kit 随后移除该沙箱。
- 模板 `docker/docker-agent-sbx-templates:latest` 附带 `docker-agent version main`（commit 154b78f2），不是 v1.149.0 发行版，每次启动都尝试一次自更新，并在非发行版版本字符串上失败（`27-inside.txt`）。VM 内的 `docker agent sandbox list` 是空的：持久允许列表活在主机侧，作为代理规则到达，而不是作为文件。
- Desktop 4.94.0 仍列出 `sandbox v0.13.0` CLI 插件，`docker sandbox` 打印移除通知并以 1 退出（`29-docker-plugins.txt`、`29-docker-sandbox.txt`）。
- `--record NAME` 和 `--fake NAME` 给它们得到的路径追加 `.yaml`；否则 `--fake` 以 "requested cassette not found: NAME.yaml" 失败。
- 任何加载智能体文件、而该文件跑在尚未拉取的 DMR 模型上的 `docker-agent` 命令，都会自行启动 `docker model pull`，包括 `debug toolsets` 和 `run --dry-run`。在录制主机上，两次 `docker model pull ai/qwen3` 运行（8B 的 `latest` tag，Model Runner 不可达时 `doctor` 为 `auto` 点名它）在最后一个 5.03 GB blob 之后以 digest 不匹配结束，每次观察到的 hash 都不同；那些拉取的 Model Runner 日志是 `25-model-pull-latest.txt`，kit 用 `ai/qwen3:4b` 录制。
- `docker-agent share push` 到明文 HTTP `localhost:PORT` 仓库无需任何 insecure-registry 设置即可工作；清单携带 `io.docker.agent.version`、`io.docker.cagent.version`，以及 `artifactType` 为 `application/vnd.docker.agent.config.v1+json`（`24-manifest.json`）。
- `serve a2a` 只在 `/.well-known/agent-card.json` 发布 card（`/.well-known/agent.json` 回答 404）；card 把它的 JSON-RPC 端点命名为 `http://127.0.0.1:8082/invoke`，`protocolVersion` 为 1.0，对 `/` 的 POST 回答 404。用 A2A 1.0 名称的 `SendMessage` 返回处于 `TASK_STATE_COMPLETED` 的 `task`，其 artifact 携带回答，带 `adk_*` 元数据（该服务器建在 ADK A2A 库上），`GetTask` 再次返回它并带上历史（`23-a2a.http`）。`serve mcp --http` 在 `/mcp` 和 `/` 上用 SSE 分帧的 JSON-RPC 应答，报告 `protocolVersion` 2025-11-25，暴露一个唯一参数为 `message` 的工具，`tools/call` 返回 `structuredContent: {"response": …}`（`23-mcp.http`）。`serve chat` 把智能体名 `root` 列为模型 id，而不是文件名，没有 bearer token 时回答 401（`23-chat.http`）。`serve api` 需要文档所说的正文 `{"messages": [{"role": "user", "content": …}]}`；SSE 流携带与 `run --json` 相同的事件类型，包括推理 token（`23-api-run.sse`）。`serve acp` 用 `agentCapabilities` 回答 `initialize`，并用 `session/update` 通知（斜杠命令）在结果之前回答 `session/new`（`23-acp.jsonl`）。
- 跑在 `dmr/…` 上的智能体做 `docker-agent eval` 会在其容器内部失败，因为容器镜像没有 `docker` CLI 去向 Model Runner 询问端点（"exec: docker: executable file not found in $PATH"，`22-eval.txt`）；`--models-gateway http://model-runner.docker.internal/engines` 把 judge 也移到那个地址，而主机到不了（403，`22-eval-gateway.txt`）。`-e DOCKER_AGENT_MODELS_GATEWAY=http://model-runner.docker.internal/engines` 只在容器内部设置网关，judge 留在主机的 `localhost:12434`，两次 eval 都跑起来：尺寸和相关性通过，列举案例的工具调用 F1 是 0.67，因为模型加了第二次调用（`22-eval-container-env.txt`、`22-eval-run-container-env.json`）。两次 eval 加上 judge 在 4B 模型上大约要五分半钟。
