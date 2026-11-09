# sbx policy init、allow network、deny network 与 check network

> 一个全局预设，加上两个范围中的允许和拒绝规则，决定每一次连接，拒绝优先，`check network` 询问同一个授权器但不发送任何东西。

你的智能体报告 `npm install` 因连接错误失败，而沙箱不保留能说明原因的 shell 历史。问题是哪条规则做了决定。`sbx policy` 分两半回答：`ls` 看已有的规则，`check network` 看某一个主机会得到的判定。

读完本节后，你能初始化策略、在正确的范围中添加规则，并预测对任意主机的判定。

## 预设与全局策略 {#s-sbx-policy-init-allow-deny-and-check-network-the-preset-and-the-global-policy}

**policy init：** 设置第一条全局策略，不是每个沙箱的默认值 {{help-sbx sbx policy init}}。它在第一个沙箱之前运行一次，取值为 `allow-all`、`balanced` 或 `deny-all`，`sbx policy reset` 或 `sbx daemon start --policy` 重新开始 {{help-sbx sbx daemon start}}。capture 主机在 v0.47.0 上选择了 `balanced`，随后 `sbx policy ls` 显示一条策略 `local-policy`，带 `network: 194 allow`（[该 capture](manuals/docker-sandboxes-101/capture/out/03-policy-ls.txt)）。宽 JSON 列出八条 `created_via: default` 的规则：六个网络组和两条允许所有路径的文件系统规则。该列表在各版本之间会变，且没有变更日志（[冲突 C23](#s-ref-sources-and-the-conflicts-register)），所以这是 2026-10-08 记录的列表：

```listing
title: 六个 balanced 网络组中的两个
source: capture/out/03-policy-balanced.json
lang: json
note: 每个组在其第一条 resources 之后删节。其余组是 default-code-and-containers、default-os-packages、default-cloud-infrastructure 和 default-cert-validation。
---
      "id": "default-ai-services",
      "name": "default-ai-services",
      "policy_id": "local-policy",
      "scope": "global",
      "applies_to": "all",
      "resource_type": "network",
      "decision": "allow",
      "resources": [
        "api.anthropic.com:443",
        "statsig.anthropic.com:443",
        "platform.claude.com:443",
…
        "**.openai.com:443",
…
      "id": "default-package-managers",
…
        "registry.npmjs.org:443",
…
        "pypi.org:443",
…
      "provenance": {
        "created_via": "default"
      },
      "actions": [
        "net:connect:tcp"
      ]
```

## 规则语法与范围 {#s-sbx-policy-init-allow-deny-and-check-network-rule-grammar-and-scope}

**允许规则：** 逗号分隔的主机名、域名、IP 地址或 CIDR 前缀列表 {{help-sbx sbx policy allow network}}。形式有 `example.com`、`*.example.com`、`**.example.com`、`api?.example.com`、`api[12].example.com`、`example.com:443`、`[2001:db8::1]:443`、CIDR，以及表示每个主机的 `**`。单独的 `*` 和转义的 glob 会被拒绝 {{help-sbx sbx policy allow network}}。允许规则覆盖 TCP，除非 `--protocol` 另有说明；拒绝规则覆盖 TCP 和 UDP {{help-sbx sbx policy deny network}}。capture 两者都展示了：允许返回为 `(example.com [tcp])`，拒绝返回为 `(example.com [tcp,udp])`（[这些 capture](manuals/docker-sandboxes-101/capture/out)）。拒绝还警告，在 `feature.udp-egress` 打开之前，UDP 出站保持关闭。

自 v0.29.0 起就有两种范围（[冲突 C41](#s-ref-sources-and-the-conflicts-register)）：global（默认），以及 `local`，由 `--sandbox` 限定到一个沙箱 {{help-sbx sbx policy allow network}}。用 `--sandbox m101-policy` 添加的规则打印 `Rule added to policy local (scope: sandbox:m101-policy): <uuid>`，`sbx policy inspect` 显示其 scope、layer、origin 和 provenance：

```listing
title: 限定到沙箱的允许规则
source: capture/out/09-inspect-rule.json
lang: json
note: 外层 policy 对象和 remove_command 字段已删节。
---
      "id": "<uuid>",
      "name": "<uuid>",
      "policy_id": "<uuid>",
      "scope": "sandbox:m101-policy",
      "applies_to": "sandbox:m101-policy",
      "resource_type": "network",
      "decision": "allow",
      "resources": [
        "example.com"
      ],
      "origin": "scoped",
      "layer": "local",
      "status": "active",
      "editable": true,
      "sandbox_id": "m101-policy",
      "provenance": {
        "created_via": "added"
      },
      "actions": [
        "net:connect:tcp"
      ]
```

`create` 或 `run` 上的 `--deny-network HOST` 在创建时添加同样的按沙箱拒绝。帮助文本说明了在治理下这为何安全：本地拒绝只能让出站更窄，不能更宽 {{help-sbx sbx create}}。kit 添加的规则带 `created_via: provisioned`，capture 主机上的 `sbx policy ls --source org` 打印了 `No policies match the selected filters.`（[该 capture](manuals/docker-sandboxes-101/capture/out/03-policy-org.txt)）。

**拒绝优先：** 对同一主机名或 CIDR，拒绝规则压过允许规则。已允许的主机名不会再按它解析到的 IP 地址去核对 CIDR 规则 {{help-sbx sbx policy deny network}}。

CLI 拒绝与同一范围中的允许冲突的拒绝：`deny: "example.com" conflicts with existing allow rule "<uuid>"`（[该 capture](manuals/docker-sandboxes-101/capture/out/09-deny-conflict.txt)）。capture 在拒绝被接受之前，用 `sbx policy rm network --sandbox m101-policy --id <uuid> --force` 删掉了允许。在组织治理下，只有组织允许规则授予访问，而本地和 kit 拒绝规则仍然生效 {{docs-sbx Precedence}}，[组织策略](#s-org-policies-profiles-and-the-audit-log) 打印了那张表。

`policy ls` 用 `--source local|org|kit`、`--decision`、`--type`、`--created-via default|added|provisioned|approval`、`--protocol`、用于 `RULE_ID` 的 `--wide`，以及 `--json` 做过滤 {{help-sbx sbx policy ls}}。宽行带有 `METHOD` 和 `PATH` 列。文档用 `--method` 和 `--path` 标志填充它们。v0.47.0 的 `sbx policy allow network` 帮助文本没有列出这两个标志，所以本手册把本地 HTTP 规则标为未核实。[代理](#s-sbx-policy-log-and-the-proxy) 一节再回到它们。

## check network {#s-sbx-policy-init-allow-deny-and-check-network-check-network}

**policy check network：** 只读调用，运行守护进程里强制执行沙箱网络的同一个策略授权器 {{help-sbx sbx policy check}}。没有端口的主机按端口 443 评估，该命令只检查网络访问，不检查 HTTP 方法或路径 {{help-sbx sbx policy check network}}。拒绝时以 1 退出。capture 在 `m101-policy` 上下文中对 `example.com` 运行了它，分别在没有任何规则之前、允许之后，以及拒绝之后：

```listing
title: 拒绝规则之后的显式拒绝
source: capture/out/09-check-deny.json
lang: json
note: 09-check-verbose.json 中的隐式拒绝的 deny_kind 为 implicit，没有 origin，没有 rule，reason 为 "No matching allow rule (default deny)"。
---
{
  "action": "net:connect:tcp",
  "allowed": false,
  "context": "sandbox:m101-policy",
  "deny_kind": "explicit",
  "governance": {
    "active": false
  },
  "origin": "local",
  "reason": "Denied by local rule",
  "resource_type": "net:domain",
  "resource_value": "example.com:443",
  "rule": "local:<uuid>",
  "target": "example.com:443",
  "type": "network"
}
```

允许之后，同一次调用返回 `"allowed": true` 且没有 `rule` 字段（[该 capture](manuals/docker-sandboxes-101/capture/out/09-check-allowed.json)）。对 `api.anthropic.com` 的全局检查在 `"context": "global"` 下也是如此（[该 capture](manuals/docker-sandboxes-101/capture/out/03-policy-check-anthropic.json)）。两种拒绝在 `deny_kind` 上不同：`implicit` 不点名规则，`explicit` 点名 `local:<uuid>`。隐式拒绝也是沙箱会变成审批请求的那种，下一节展示。[图](#fig-3-3) 按同一顺序走查该请求。

```figure
id: fig-3-3
kind: decision
title: 一次发往 example.com:443 的请求如何被判定
claim: 匹配的拒绝立即结束走查，任一活动范围的允许接纳该主机，什么都不匹配的请求被隐式拒绝.
caption: 从上往下读。每个左侧方框是授权器问的一个问题，右侧方框是 capture 为它记录的答案。虚线玫瑰色箭头是拒绝。 From capture/out/09-check-deny.json, 09-check-allowed.json, 03-policy-check-anthropic.json, 09-check-verbose.json, and 09-blocked.txt.
```

```takeaways
- 运行一次 `sbx policy init balanced`，然后在信任该列表之前读 `sbx policy ls --wide --json`。
- 用 `--sandbox` 添加窄规则，把每个智能体都需要的主机留给全局规则。
- 在同一范围中为同一主机添加拒绝之前，先删掉允许。
- 用 `sbx policy check network --sandbox NAME host:port --json` 检查，并读 `deny_kind` 和 `rule`。
```

Sources: help-sbx sbx policy init, sbx daemon start, sbx policy allow network, sbx policy deny network, sbx policy ls, sbx policy inspect, sbx policy rm network, sbx policy check, sbx policy check network, sbx create (research/sources/help-sbx.md); docs-sbx Policy concepts, Local policy, Monitoring policies (research/sources/docs-sandboxes.md); research/conflicts-register.md rows C23, C41; capture/out/03-policy-init.txt, 03-policy-ls.txt, 03-policy-org.txt, 03-policy-balanced.json, 03-policy-check-anthropic.json, 09-allow.txt, 09-deny.txt, 09-deny-conflict.txt, 09-inspect-rule.json, 09-rm-allow.txt, 09-check-verbose.json, 09-check-allowed.json, 09-check-deny.json, 12-policy-kit.txt
