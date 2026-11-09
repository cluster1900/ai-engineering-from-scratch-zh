# sbx policy log 与代理

> 每条连接都经主机上的代理离开，代理用它自己的证书应答被阻止的 HTTPS 请求，并按主机写入一行策略日志，带上匹配的规则。

智能体说 `https://example.com` 超时了。它并没有超时：代理用 90 字节 应答了它。来自沙箱的每条连接都经过主机上的代理。`sbx policy log` 为每个主机保留一行，带上判定、代理路径和规则。

读完本节后，你能读懂一行 `policy log`，说出它的代理路径，并区分被阻止的主机和慢的主机。

## 两个代理和一个 CA {#s-sbx-policy-log-and-the-proxy-two-proxies-and-one-ca}

在 `m101-demo` 内，环境携带代理地址及其证书：

```listing
title: m101-demo 环境中的代理行
source: capture/out/04-env.txt
lang: text
note: 与代理或其 CA 无关的每一行都已删节。CA 值被掩码为 <base64>。
---
HTTPS_PROXY=http://gateway.docker.internal:3128
HTTP_PROXY=http://gateway.docker.internal:3128
…
NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
NODE_USE_ENV_PROXY=1
NO_PROXY=localhost,127.0.0.1,::1,gateway.docker.internal
…
PROXY_CA_CERT_B64=<base64>
…
REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
…
SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt
```

地址是 `gateway.docker.internal:3128`，不是旧插件的 `host.docker.internal:3128`（[冲突 C26](#s-ref-sources-and-the-conflicts-register)）。文档描述两条路径。智能体通过正向代理发送 HTTP 和 HTTPS，其他 TCP 流量被透明转发。两条路径都执行网络访问策略 {{docs-sbx Networking}}。

第一个原型只是一个环境变量，智能体用 `no_proxy` 绕过了它，Kevin Wittek 在 2026-01-14 这样说 {{talk 2026-01-14 T01}}。这次 capture 向 `gateway.docker.internal:18080` 发了一个请求，这个名字在 `NO_PROXY` 中，所以 curl 跳过正向代理并打开了一条普通 TCP 连接。透明路径截获了那条连接，日志把它记为 `transparent` 并阻止（[这次 capture](manuals/docker-sandboxes-101/capture/out/10-policy-log.json)）。

**TLS 拦截：** 代理自己的证书颁发机构，以 `PROXY_CA_CERT_B64` 携带并合并进 `/etc/ssl/certs/ca-certificates.crt` {{rel-sbx v0.35.0}}。这次 capture 显示它用在哪里：

```listing
title: 一次被阻止的 HTTPS 请求，带和不带 headers
source: capture/out/09-blocked.txt
lang: text
---
$ sbx exec m101-policy sh -c 'curl -sS --max-time 10 -I https://example.com; echo exit=$?'
HTTP/1.1 200 OK

HTTP/1.1 403 Forbidden
Content-Length: 90
Content-Type: text/plain

exit=0
[exit 0]

$ sbx exec m101-policy sh -c 'curl -sS --max-time 10 https://example.com; echo; echo exit=$?'
Approval required for example.com:443.

Review and respond with:
  sbx policy approval ls

exit=0
[exit 0]
```

`HTTP/1.1 200 OK` 是代理接受 `CONNECT`。随后的 `403 Forbidden` 到达 TLS 会话内部，使用沙箱信任的证书，它 90 字节的正文就是审批消息。在 `sbx policy allow network --sandbox m101-policy example.com` 之后，同样的请求得到 `HTTP/1.0 200 Connection established`，然后是带 `server: cloudflare` 的 `HTTP/2 200`（[这次 capture](manuals/docker-sandboxes-101/capture/out/09-allowed.txt)）。

日志把那一次归类为 `forward-bypass`，一条不做检查、也不注入凭据的隧道 {{docs-sbx Monitoring policies}}。所以对 C26 的裁定是：代理只在它必须开口说话时才终止 TLS。那是被阻止的主机，或带有绑定凭据的主机，其余则做隧道。v0.47.0 的说明点名了两条路径：一条不做拦截的 CONNECT 隧道，以及透明代理中一次靠后的握手检查 {{rel-sbx v0.47.0}}。

## 阅读 policy log {#s-sbx-policy-log-and-the-proxy-reading-policy-log}

**policy log：** 显示代理允许或阻止了哪些主机，带上匹配的规则、代理类型和请求计数 {{help-sbx sbx policy log}}。它接受 `[SANDBOX]`、`--json`、`--limit` 和 `--type`，帮助文本承认文件系统日志尚不支持（[冲突 C28](#s-ref-sources-and-the-conflicts-register)）。JSON 有两个数组：

```listing
title: 拒绝规则之后 m101-policy 的日志
source: capture/out/09-policy-log-deny.json
lang: json
note: 第二行被阻止的记录、download.docker.com 那一行，以及 ports.ubuntu.com 那一行已删节。
---
{
  "blocked_hosts": [
    {
      "host": "example.com:443",
      "vm_name": "m101-policy",
      "proxy_type": "forward",
      "rule": "denied: rule \"local:<uuid>\" matched op(action=net:connect:tcp, resource=net:domain:example.com:443)",
      "last_seen": "<ts>",
      "since": "<ts>",
      "count_since": "<n>",
      "reason": "Denied by local rule"
    },
…
  "allowed_hosts": [
…
    {
      "host": "example.com:443",
      "vm_name": "m101-policy",
      "proxy_type": "forward-bypass",
      "rule": "",
      "last_seen": "<ts>",
      "since": "<ts>",
      "count_since": "<n>"
    },
```

每一行都有 `host`、`vm_name`、`proxy_type`、`rule`、`reason`、`last_seen`、`since` 和 `count_since`。被阻止的行点名操作 `op(action=net:connect:tcp, resource=net:domain:example.com:443)`，以及 `no applicable policies` 或匹配的规则。这次 capture 中允许的行带着空的 `rule`，所以日志说明主机通过了，而 [check network](#s-sbx-policy-init-allow-deny-and-check-network) 说明原因。`PROXY` 取五个值：`forward`、`forward-bypass`、`transparent`、`network` 和 `browser-open` {{docs-sbx Monitoring policies}}。[图](#fig-3-4)为两次请求做动画。

403 正文点名 `sbx policy approval ls`。文档描述 `approval ls`、`inspect` 和 `respond`。在 balanced 和 deny-all 下，一条不匹配任何规则的请求会等你审批，而不是立刻被拒绝 {{docs-sbx Local policy}}。v0.47.0 的帮助树没有 `sbx policy approval` 命令，而 `sbx policy ls --created-via approval` 存在（[冲突 C16](#s-ref-sources-and-the-conflicts-register)）。

## 主机规则看不见什么 {#s-sbx-policy-log-and-the-proxy-what-a-host-rule-cannot-see}

一条拒绝覆盖的不只是 TCP（[冲突 C27](#s-ref-sources-and-the-conflicts-register)）。一篇 2026-05-26 的文章说 UDP 和 ICMP 被阻止且无法允许 {{blog 2026-05-26 B16}}。自 v0.33.0 起，沙箱内的进程无法解析策略拒绝的域名（环回名称除外），出站 ICMP 保持被阻止 {{rel-sbx v0.33.0}}。自 v0.45.0 起，UDP 在实验设置 `feature.udp-egress` 背后跟随策略，没有规则允许时 DNS 解析会停止 {{rel-sbx v0.45.0}}。裁定是：一条拒绝覆盖 TCP、UDP 和名称查找本身，ICMP 无法被允许。客户机的 `/etc/resolv.conf` 是来自主机的只读 bind 挂载。

一条主机允许许可对该主机的每一个请求，任意方法、路径和正文。balanced 预设允许 `github.com:443` 和 `**.github.com:443`（[这次 capture](manuals/docker-sandboxes-101/capture/out/03-policy-balanced.json)）。Docker 员工在 2026-04-07 和 2026-08-10 说，已允许主机上的 issue 正文或 gist 不会被阻止 {{talk 2026-04-07 T05}}。

产品的答案是 HTTP 规则。kit 的 `network-policy@2` 条目可以用 `methods: [DELETE]` 拒绝 `hosts: [api.github.com]` {{kitcap network-policy@2}}。网络允许是上限，HTTP 规则再从中雕琢 {{docs-sbx HTTP method and path}}，`check network` 和 `policy log` 都不评估方法或路径 {{docs-sbx Local policy}}。[图](#fig-3-5)把两条规则并排放在一起。

上游代理是单独的设置：`proxy`、`proxy.sandbox`、`proxy.daemon` 和 `no_proxy` 一族，自 v0.35.0 起支持 SOCKS5 {{rel-sbx v0.35.0}}。[设置表](#s-ref-settings-keys-environment-variables-and-paths)列出这些键。

```figure
id: fig-3-4
kind: sequence
title: 对 example.com 一次被阻止和一次被允许的请求
claim: 第一次 CONNECT 在 TLS 内部被代理自己拒绝，一条允许规则之后同一次 CONNECT 变成 forward-bypass 隧道，两次都留下一行日志.
caption: 从上往下读。生命线是 m101-policy 内的 curl、正向代理、带授权器的 sandboxd、策略存储，以及 example.com。虚线 rose 箭头是拒绝，实心 teal 箭头是对规则和日志的写入。 From capture/out/09-blocked.txt, 09-policy-log.json, 09-allow.txt, 09-allowed.txt, and 09-policy-log-after.json.
```

```figure
id: fig-3-5
kind: comparison
title: api.github.com 上的一条主机允许和一条 kit HTTP 规则
claim: 一条主机允许放行对 github.com 的任意请求，包括正文，而一条 network-policy@2 条目拒绝一台主机上的一种方法，并让其余保持开放.
caption: 左侧是 balanced 预设的 default-code-and-containers 组以及它放行的一次 POST。右侧是 kit 规范中的拒绝条目以及它拦住的 DELETE。 From capture/out/03-policy-balanced.json and research/sources/kit-capabilities.md.
```

```takeaways
- 先读 `PROXY`：`forward-bypass` 表示不做检查，`transparent` 表示不注入凭据。
- 把带审批正文的 403 当作策略判定，绝不当作网络故障。
- 预期一条拒绝覆盖 TCP、UDP 和 DNS 查找，并预期 ICMP 保持被阻止。
- 用 kit 的 HTTP 规则收窄已允许的 API，因为一条主机允许会放行任意正文。
```

Sources: help-sbx sbx policy log, sbx policy allow network (research/sources/help-sbx.md); docs-sbx Architecture, Isolation layers, Default security posture, Monitoring policies, Local policy, Network access policies, Policy concepts, Upstream proxy (research/sources/docs-sandboxes.md); kitcap network-policy@2 (research/sources/kit-capabilities.md); rel-sbx v0.33.0, v0.35.0, v0.45.0, v0.47.0 (research/sources/sbx-releases.md); research/conflicts-register.md rows C16, C26, C27, C28; talk T01 (2026-01-14), T05 (2026-04-07), blog B16 (2026-05-26), HN01 (2026-08-10) from research/plan.md; capture/out/04-env.txt, 09-blocked.txt, 09-allowed.txt, 09-allow.txt, 09-policy-log.json, 09-policy-log-after.json, 09-policy-log-deny.json, 09-policy-log.txt, 10-policy-log.json, 03-policy-balanced.json
