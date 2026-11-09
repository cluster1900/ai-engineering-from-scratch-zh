# sbx policy ls --source org、--profile 和审计 JSONL

> 组织在 Docker Home 中编写策略，守护进程在五分钟内拉取它们，本地规则只能收窄，每一项决策都写入一个轮转的 JSONL 文件。

你的安全团队问上周智能体到达了哪些主机、谁允许了每一个，以及开发者是否本可以放宽列表。在一台笔记本上答案是 `sbx policy log`，在一家公司里则是带审计日志的组织策略。读完本节后，你能说出组织策略在开发者机器上改变了什么，并读懂一条审计记录。

## 组织能设置什么 {#s-org-policies-profiles-and-the-audit-log-what-an-organization-can-set}

**组织策略：** 在 Docker Home 中编写的一组命名规则，应用于该组织或选定团队的每一个本地沙箱 {{docs-sbx Organization policies}}。有三种：网络访问、文件系统访问和 MCP 访问。网络规则是 HTTP（一个带方法和路径模式的目的地），或经 TCP、UDP 或两者的全部流量，并带允许或拒绝 {{docs-sbx Organization policies}}。网络策略可以要求批准，所以它允许的每个目的地会等待一次开发者确认。MCP 策略是 `MCP` 命名空间中的 Cedar，默认拒绝，其中 `forbid` 压过每一条 `permit` {{docs-sbx Policy concepts}}。一个组织最多持有 100 条策略，每条 250 条规则、400 KB {{docs-sbx Policy concepts}}。

变更在 5 分钟内到达开发者机器，`sbx policy reset` 强制拉取，代价是每一条本地规则和已记录的批准 {{docs-sbx Organization policies}}。网络规则应用于下一个请求，文件系统规则仅在创建沙箱时，MCP 注册规则在下一次 `sbx mcp add` 时。登录强制在 macOS 上把 `allowedOrgs` 列入托管的 `com.docker.sbx` profile，在 Windows 上是键 `HKLM\SOFTWARE\Policies\Docker\SBX`，在 Linux 上是 `/etc/docker-sbx/config.json` {{docs-sbx Sign-in enforcement}}。`sbx login` 随后吊销任何其他账户的凭据。这一切是单独的付费订阅 Docker AI Governance，本地使用保持免费 {{docs-sbx FAQ}}。

## 组织不能做什么 {#s-org-policies-profiles-and-the-audit-log-what-an-organization-cannot-do}

治理只收窄、从不放宽。当策略处于活动状态时，只有组织允许规则授予访问，来自每个来源的拒绝规则仍然生效 {{docs-sbx Policy concepts}}。本地和 kit 允许规则处于非活动。`--deny-network` 的帮助文本说的是同一件事：

```rule
label: 收窄规则
source: help-sbx sbx create --deny-network
---
在中央治理下，本地拒绝是安全的，因为它只能收窄出站，不能放宽。
```

本地拒绝甚至压过组织批准要求，所以请求被拦截，不会出现提示 {{docs-sbx Policy concepts}}。

| 规则 | 在组织治理下是否求值 |
|---|---|
| 组织允许 | 是 |
| 组织拒绝 | 是 |
| 本地允许 | 否 |
| 本地拒绝 | 是 |
| kit 定义的允许 | 否 |
| kit 定义的拒绝 | 是 |

治理只覆盖本地沙箱，云沙箱使用自己的账户和沙箱策略，如[云一节](#s-sbx-cloud-run-move-and-ttl)所述 {{docs-sbx Governance}}。审计记录保存元数据，从不保存提示词内容、智能体输出或参数值 {{docs-sbx AI Governance Audit Logs}}。

## 本次 capture 没有组织 {#s-org-policies-profiles-and-the-audit-log-this-capture-has-no-organization}

```listing
title: 没有治理的机器上的组织过滤器
source: capture/out/03-policy-org.txt
lang: text
note: 两条命令均按录制原样。第二条显示那一条本地策略，没有 STATUS 列，因为没有任何规则处于 inactive。
---
$ sbx policy ls --source org
No policies match the selected filters.
[exit 0]

$ sbx policy ls --include-inactive
POLICY         SOURCE   APPLIES TO   SUMMARY
local-policy   local    all          network: 194 allow; filesystem read: 1 allow; filesystem write: 1 allow
[exit 0]
```

```listing
title: 没有来自远程治理的 profile
source: capture/out/03-policy-profile-ls.txt
lang: json
note: 仅 JSON 形式。文本形式打印 “No policy profiles found”。
---
{
  "profiles": [],
  "policy_rules_unavailable": false
}
```

没有出现 `Governance: Managed by <org>` 那一行，文档把那一行当作活动策略的检验 {{docs-sbx Local audit logs}}。本次 capture 中的每一次 `policy check` 都报告 `"governance": {"active": false}`（[该 capture](manuals/docker-sandboxes-101/capture/out/09-check-verbose.json)）。**Profile：** 开发者在创建时用 `--profile` 指定的一组命名组织策略，由 `sbx policy profile ls` 列出 {{help-sbx sbx policy profile ls}}。当没有规则匹配、也没有组织治理这台机器时，代理会请求批准。它的 403 正文点名 `sbx policy approval ls`（[该 capture](manuals/docker-sandboxes-101/capture/out/09-blocked.txt)），v0.47.0 帮助树未列出的一条命令（[冲突 C16](#s-ref-sources-and-the-conflicts-register)）。

## 审计记录 {#s-org-policies-profiles-and-the-audit-log-the-audit-record}

**审计记录：** 每项策略决策或守护进程会话事件一条 JSON 对象，由守护进程写入，从不由 CLI 写入 {{docs-sbx Local audit logs}}。记录自 v0.32.0 起存在 {{rel-sbx v0.32.0}}。守护进程只为已登录、持有 AI Governance 许可、并处于强制组织策略下的用户写入它们。因此本次 capture 没有产生任何记录，计划为 capture K32 的目录列表也未录制（[冲突 C37](#s-ref-sources-and-the-conflicts-register)）。文档中的示例记录带着 `sbx policy log` 为 `m101-policy` 打印的同一条 reason 字符串：

```listing
title: 策略日志中的 reason 字符串
source: capture/out/09-policy-log.json
lang: json
note: 那一条 blocked_hosts 条目，在其 reason 之后删节。
---
  "blocked_hosts": [
    {
      "host": "example.com:443",
      "vm_name": "m101-policy",
      "proxy_type": "forward",
      "rule": "no applicable policies for op(action=net:connect:tcp, resource=net:domain:example.com:443)",
      …
      "reason": "No matching allow rule (default deny)"
```

```listing
title: 文档示例审计记录中的一次被拒绝连接
source: research/sources/docs-sandboxes.md
lang: json
note: Local audit logs 页面的示例记录，只保留正文点名的字段。user、organization 和 session 字段已删节。
---
{
  "audit_event_id": "95e7257f-93c9-4f29-bde7-88830e2dae80",
  "timestamp": "2026-05-28T19:15:00.728933Z",
  "schema_version": "1.82.0",
  "category": "AUDIT_CATEGORY_EVALUATION",
  "decision": "AUDIT_DECISION_DENY",
  …
  "resource_id": "example.com:443",
  "os": "macos",
  "app_version": "v0.31.0",
  "client_name": "sbx",
  "hostname": "host-machine",
  "deny_reason": [
    "no applicable policies for op(action=net:connect:tcp, resource=net:domain:example.com:443)"
  ],
  "action_type": "network_egress",
  "network_egress": { "protocol": "tcp" },
  "agent": "claude"
}
```

在 macOS 上，文件是 `~/Library/Logs/com.docker.sandboxes/sandboxes/auditkit/` 下的 `audit-<utc-timestamp>-<process-uuid>-<seq>.jsonl` {{docs-sbx Local audit logs}}。守护进程每 5 分钟、1000 个事件或 50 MiB 把 `.tmp` 文件定稿为 `.jsonl`，从不删除任何一个。`category` 是 management、evaluation 或 execution，`decision` 是从 `AUDIT_DECISION_ALLOW` 到 `AUDIT_DECISION_APPROVAL_DENY` 的五个值之一 {{docs-sbx Audit record reference}}。`action_type` 命名载荷，例如 `network_egress`、带 method、host、port 和 path 的 `http_request`，或 `tool_invocation`。

`client_name` 是 `sbx`，`hostname` 命名机器，这就是带 `runtime: docker-sbx` 的 GitHub Actions 运行如何出现 {{blog 2026-08-21}}。Docker Cloud 投递默认开启，事件可搜索 90 天，CSV 导出最多 1 000 000 行 {{docs-sbx View and export audit events}}。从 0.39.0 起它还转发到 Splunk Cloud、Dynatrace、Datadog 或 Sumo Logic {{docs-sbx SIEM forwarding}}。

```figure
id: fig-7-2
kind: flow
title: 从 Docker Home 到 SIEM
claim: 一次策略决策在开发者机器上变成一条 JSONL 记录，只有被强制执行的组织策略才会让守护进程写入它.
caption: 从上到下读。守护进程拉取组织策略，把它与本地拒绝规则合并，并在代理处决定每个请求。记录进入 auditkit 目录，轮转在那里定稿它，云投递再转发它。 From research/sources/docs-sandboxes.md (Local audit logs, Audit record reference) and capture/out/09-policy-log.json.
```

```takeaways
- 调试被拦截的主机之前，运行 `sbx policy ls` 并查找 `Governance:` 那一行。
- 当你需要比组织允许范围更窄的访问时，添加本地拒绝规则，不要指望本地允许规则生效。
- 只从 auditkit 目录收集 `.jsonl` 文件，并把 SIEM 字段映射钉在 `schema_version` 上。
- 文件系统策略变更后，删除并重建沙箱。
```

Sources: docs-sbx Governance, Organization policies, Policy concepts, Local policy, Monitoring policies, AI Governance Audit Logs, Local audit logs, Audit record reference, Configure audit delivery, SIEM forwarding, View and export audit events, Sign-in enforcement, FAQ (research/sources/docs-sandboxes.md); help-sbx sbx create, sbx policy ls, sbx policy profile ls (research/sources/help-sbx.md); rel-sbx v0.32.0, v0.39.0 (research/sources/sbx-releases.md); blog 2026-08-21 and research/conflicts-register.md rows C16, C28, C37, C41; capture/out/03-policy-org.txt, 03-policy-profile-ls.txt, 09-check-verbose.json, 09-policy-log.json, 09-blocked.txt
