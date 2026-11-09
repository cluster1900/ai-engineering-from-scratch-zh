# sbx secret set、sbx secret import 和 sbx secret set-custom

> 密钥从不进入 VM：智能体看到的是哨兵值，主机钥匙串保存真正的值，代理在发往绑定主机的请求里把它换进去。

你按 2026 年的教程把 `ANTHROPIC_API_KEY` 写进了 `~/.zshrc`，沙箱里的智能体仍然没有密钥。自 v0.35.0 起，主机环境不再被读取 {{rel-sbx v0.35.0}}（[冲突 C7](#s-ref-sources-and-the-conflicts-register)）。`-e KEY` 传入的是普通变量，不是密钥，三条 `sbx secret` 命令是唯一的入口。

读完本节后，你能保存服务密钥、把自定义密钥绑定到主机，并读出代理发出了什么。

## 服务密钥 {#s-sbx-secret-set-import-and-set-custom-service-secrets}

**服务密钥：** 存在 13 个服务名之一下的值，`anthropic, copilot, cursor, devin, droid, github, google, groq, mistral, nebius, openai, openrouter, xai` {{help-sbx sbx secret set}}，比文档表格多两个（[冲突 C21](#s-ref-sources-and-the-conflicts-register)）。值来自 `-t`、stdin、`--command`，或带 1Password `op://` 引用或 AWS Secrets Manager ARN 的 `--ref`。`--oauth` 是第五种来源，在本地只对全局范围的 `openai` 有效 {{help-sbx sbx secret set}}（[冲突 C22](#s-ref-sources-and-the-conflicts-register)）。Anthropic OAuth 改由智能体自己的登录提供。自 v0.46.0 起，命令 helper 在主机上的一个新临时目录中运行 {{help-sbx sbx secret set}}，所以相对 helper 路径不再能解析（[冲突 C38](#s-ref-sources-and-the-conflicts-register)）。`--refresh` 设置缓存时间，默认 55 分钟。

范围是全局的，除非 `--sandbox` 把它收窄。`secret ls` 用 `-g`、`--sandbox`、`--service` 和 `--json` 过滤，`secret rm` 接受 `--all`、`--placeholder` 和 `--registry` {{help-sbx sbx secret rm}}。存储是 macOS Keychain、Windows Credential Manager 或 Linux Secret Service {{docs-sbx Where secrets are stored}}。没有钥匙环时，Linux 使用 `~/.config/com.docker.sandboxes` 下模式为 `0700` 的文件。kit 的批准与值分开存放，在 `~/.config/sbx/credentials.yaml` {{docs-sbx Credential bindings}}。

**secret import：** 读取一次主机环境，以末 4 位预览提供每个变量，并接受 `--all`、`--force` 和 `--dry-run` {{help-sbx sbx secret import}}。已经持有 OAuth 令牌的服务会被跳过。capture 主机上什么都没有导出：

```listing
title: 一次没有可导入内容的 import
source: capture/out/10-import-dry-run.txt
lang: text
---
$ sbx secret import --dry-run
No credential env vars detected on the host. Set e.g. OPENAI_API_KEY in your shell and re-run, or use `sbx secret set` to enter a value directly.
```

仓库凭据是第三种，"host-only by default"，只有加上 `--all-sandboxes` 或 `--sandbox` 才会到达沙箱 {{help-sbx sbx secret set}}。

## 智能体看到什么 {#s-sbx-secret-set-import-and-set-custom-what-the-agent-sees}

沙箱内的每个服务变量都是哨兵值，GitHub 的那个形状像令牌：

```listing
title: m101-demo 环境中的哨兵值
source: capture/out/04-env.txt
lang: text
note: 不是哨兵值或凭据模式的行均已删节。
---
ANTHROPIC_API_KEY=proxy-managed
…
GH_TOKEN=gho_sbxproxymanaged000000000000000000000
…
OPENAI_API_KEY=proxy-managed
…
SBX_CRED_ANTHROPIC_MODE=none
SBX_CRED_GITHUB_MODE=none
```

v0.47.0 中存在三种格式（[冲突 C35](#s-ref-sources-and-the-conflicts-register)）：八个提供商密钥用 `proxy-managed`，`GH_TOKEN` 用 `gho_sbxproxymanaged000000000000000000000`，自定义密钥用 `sbx-cs-<rand>`。GitHub 的那个是小写，而 2026-09-04 的演示显示的是 `GHO_SBX_PROXY_MANAGED` {{talk 2026-09-04 T02}}。没有 capture 到 GitHub 请求：那需要真正的令牌。

## 自定义密钥和接收器 {#s-sbx-secret-set-import-and-set-custom-custom-secrets-and-the-receiver}

**set-custom：** 一种实验性密钥，按 `--host` 目标和 `--env` 名称而不是服务来键控 {{help-sbx sbx secret set-custom}}。值来自 `--value`、`--command` 或 `--ref`，`--placeholder sk-{rand}` 设置选定的前缀。`--header` 和 `--format` 标志仅与 `--cloud` 一起适用，帮助对每一项都这样写（[冲突 C34](#s-ref-sources-and-the-conflicts-register)）。capture 把 `M101_RECV_KEY` 绑定到 `host.docker.internal` 和 `localhost`，并在主机的 `127.0.0.1:18080` 上启动了一个接收器。它为 `m101-secret` 允许了 `localhost:18080`，并在内部发现 `M101_RECV_KEY=sbx-cs-<rand>`（[capture](manuals/docker-sandboxes-101/capture/out/10-env-sentinel.txt)）。然后它发送了三个明文 HTTP 请求：

```listing
title: 主机上的接收器记下的内容
source: capture/out/10-receiver.log
lang: text
note: 第二条请求把占位符当字面量发送，已删节。它与第一条相同。
---
GET /from-variable HTTP/1.1
Host: localhost:18080
User-Agent: curl/8.18.0
Accept: */*
Authorization: Bearer m101-dummy-receiver-0000
X-Demo: m101-dummy-receiver-0000
Accept-Encoding: gzip
…
GET /no-scheme HTTP/1.1
Host: localhost:18080
…
Authorization: m101-dummy-receiver-0000
```

接收器在占位符出现的每个位置都看到了真实值：在 `Bearer` 里、在 `X-Demo` 里，以及作为整个 `Authorization` 值。它的 `Host` 是 `localhost:18080`：代理把 `host.docker.internal` 映射到 `localhost` {{docs-sbx Accessing host services from a sandbox}}。所以替换发生在明文 HTTP 上，而且是子串替换。这为自定义密钥了结了[冲突 C34](#s-ref-sources-and-the-conflicts-register)。Hacker News 声称密钥必须是整个 header，那描述的是服务密钥，由 kit 声明 header 及其格式 {{docs-sbx Services declared by kits}}。

第四个请求发往 `gateway.docker.internal:18080`，这是 `NO_PROXY` 中的一个名称，所以绕过了正向代理。透明代理以 `Empty reply from server` 阻断了它，并且没有做替换（[capture](manuals/docker-sandboxes-101/capture/out/10-swap-curl.txt)）。[图](#fig-3-6)为这四步做动画。已有沙箱 `m101-demo` 没有收到 `M101_RECV_KEY`（[capture](manuals/docker-sandboxes-101/capture/out/10-env-existing.txt)），所以自定义变量只到达新沙箱。移除是立即的：`sbx secret rm --placeholder sbx-cs-<rand> -f` 打印了 `Applied secret updates for <n> running sandbox(es)`（[capture](manuals/docker-sandboxes-101/capture/out/10-secret-rm.txt)）。

## SSH agent {#s-sbx-secret-set-import-and-set-custom-the-ssh-agent}

有一条凭据路径确实越过边界。SSH agent 转发默认开启 {{docs-sbx Credential isolation}}，客户机显示 `SSH_AUTH_SOCK=/run/ssh-agent.sock`，并带有 `SSH_AUTH_SOCK_GATEWAY=gateway.docker.internal:3129`（[capture](manuals/docker-sandboxes-101/capture/out/04-env.txt)）。密钥留在主机上，内部的任何进程都可以请该 SSH agent 签名。`sbx settings list` 中的 `ssh.agentForwardingEnabled` 把它关掉，然后执行 `sbx daemon restart` {{docs-sbx SSH agent}}。MCP 密钥也留在主机上，位于 `mcp:<server>:client_secret`，如 [sbx mcp add](#s-sbx-mcp-add-load-and-static-mcp) 所讲。

```figure
id: fig-3-6
kind: sequence
title: 一条自定义密钥从钥匙串到接收器
claim: 沙箱里始终只有 sbx-cs-<rand>，正向代理在发往绑定主机时把它换成存储的值，直连则不会替换.
caption: 从上往下读。生命线是 sbx CLI、密钥存储、m101-secret、正向代理，以及 127.0.0.1:18080 上的接收器。实心青绿箭头是对存储的写入。玫瑰色虚线箭头是被透明代理阻断的直连。 From capture/out/10-set-custom.txt, 10-env-sentinel.txt, 10-swap-curl.txt, and 10-receiver.log.
```

```takeaways
- 用 `sbx secret set` 或 `sbx secret import` 保存密钥，绝不要用 `-e KEY`。
- 在内部预期看到 `proxy-managed` 或 `sbx-cs-<rand>`，并用主机接收器测试绑定。
- 把自定义密钥绑定到确切的主机，因为代理会替换请求中任何位置的占位符。
- 对你不愿让它用你的密钥签名的智能体，关闭 `ssh.agentForwardingEnabled`。
```

Sources: help-sbx sbx secret, sbx secret set, sbx secret import, sbx secret ls, sbx secret rm, sbx secret set-custom (research/sources/help-sbx.md); docs-sbx Manage credentials, Isolation layers, Usage (research/sources/docs-sandboxes.md); rel-sbx v0.35.0, v0.46.0 (research/sources/sbx-releases.md); research/conflicts-register.md rows C7, C21, C22, C34, C35, C38; talk T02 (2026-09-04), HN01 (2026-08-10) from research/plan.md; capture/out/04-env.txt, 10-set-custom.txt, 10-secret-ls.json, 10-env-existing.txt, 10-secret-create.txt, 10-env-sentinel.txt, 10-swap-curl.txt, 10-receiver.log, 10-policy-log.json, 10-placeholder.txt, 10-import-dry-run.txt, 10-secret-rm.txt
