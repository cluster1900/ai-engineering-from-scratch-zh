# sbx settings list

> 每项设置都有默认值、来源、用户覆盖和重启标志，有些还有环境别名，而 `sbx settings list --json` 是唯一完整的列表。

你的公司把每条连接都走代理，你第一次 `sbx run` 拉不下来模板。修复办法是一项设置，`proxy`。问题是在哪里设置它、守护进程是否必须重启，以及环境变量不一致时哪个值生效。读完本节后，你能读懂 `sbx settings list --json` 的一条记录，更改一项设置，并知道何时需要 `sbx daemon restart`。

## 一条记录 {#s-sbx-settings-list-one-record}

**设置：** 诸如 `proxy` 这样的键，带有类型、默认值、求值后的值和来源。`sbx settings list --json` 在录制用的 Mac 上打印了 31 条记录，每条都有 `key`、`type`、`default`、`value`、`source` 和 `description`，有些还有 `env_var` 或 `requires_restart`。来源是三个值之一：`default`、`envvar` 或 `override` {{help-sbx sbx settings list}}。类型是 `bool`、`int`、`float`、`string` 或 `json`，`sbx settings set KEY VALUE` 按该类型解析值 {{help-sbx sbx settings set}}。31 个键中有十三个没有 `env_var`，其中包括 `proxy`、`mcp.forceLocalGateway` 和 `skills.defaultMode`，所以环境无法设置它们，只能靠覆盖。

```listing
title: 31 条记录中的五条
source: capture/out/02-settings.json
lang: json
note: 删节为 kit.trustedSigners、proxy、proxy.sandbox、skills.defaultMode 和 ssh.defaultAgent，按文件中的顺序。
---
[
  …
  {
    "default": [
      {
        "identityRegexp": "^.*@docker\\.com$",
        "issuer": "https://accounts.google.com"
      }
    ],
    "description": "JSON array of trusted signer policies (key-based {\"key\":path} or keyless {\"issuer\":...,\"identity\":...}). Defaults to Docker employee identities (*@docker.com via https://accounts.google.com).",
    "env_var": "DOCKER_SANDBOXES_KIT_TRUSTED_SIGNERS",
    "key": "kit.trustedSigners",
    "source": "default",
    "type": "json",
    …
  },
  …
  {
    "default": "",
    "description": "Upstream proxy for sandbox, daemon, and supported CLI host egress (URL, PAC source, \"system\", or \"direct\"; empty = automatic: HTTP(S)_PROXY if set, otherwise the host OS proxy).",
    "key": "proxy",
    "requires_restart": true,
    "source": "default",
    "type": "string",
    "value": ""
  },
  …
  {
    "default": "",
    "description": "Upstream proxy for sandbox egress only (overrides proxy).",
    "env_var": "DOCKER_SANDBOXES_PROXY",
    "key": "proxy.sandbox",
    "requires_restart": true,
    "source": "default",
    "type": "string",
    "value": ""
  },
  …
  {
    "default": "readonly",
    "description": "Default for an omitted --skills flag or sbx.yaml `skills:` key: \"off\", \"readonly\", or \"readwrite\". Applies to sandboxes created after the change; existing sandboxes' mounts are never retroactively changed.",
    "key": "skills.defaultMode",
    "source": "default",
    "type": "string",
    "value": "readonly"
  },
  …
  {
    "default": "shell",
    "description": "Built-in agent used for SSH auto-created sandboxes.",
    "env_var": "DOCKER_SANDBOXES_SSH_DEFAULT_AGENT",
    "key": "ssh.defaultAgent",
    "requires_restart": true,
    "source": "default",
    "type": "string",
    "value": "shell"
  },
  …
]
```

`proxy` 记录展示了一个值的形态。它接受 URL、PAC 源、`system` 或 `direct`，空字符串表示自动：若已设置则用 `HTTP(S)_PROXY`，否则用主机 OS 代理。`proxy.sandbox` 把它收窄为仅沙箱出站，并且它是带环境别名 `DOCKER_SANDBOXES_PROXY` 的那一个。

## 优先级与重启 {#s-sbx-settings-list-precedence-and-restart}

环境变量优先于用户覆盖 {{help-sbx sbx settings set}}，所以导出的 `DOCKER_SANDBOXES_PROXY` 压过 `sbx settings set proxy.sandbox`。两者之上是组织。管理员约束也作用于已保存的覆盖，守护进程会拒绝与它们冲突的值 {{help-sbx sbx settings set}}。`sbx settings unset KEY` 移除覆盖，管理员策略仍然生效 {{help-sbx sbx settings unset}}。之后，值来自环境变量、远程默认值或内置默认值 {{help-sbx sbx settings unset}}。远程默认值是 SOURCE 列没有点名的第四种来源。

多数更改大约在五秒内生效 {{help-sbx sbx settings}}，其余需要 `sbx daemon restart`。表在 RESTART 列标出它们，表脚说明谁需要这次重启。

```listing
title: 设置表下的两条注释
source: capture/out/02-settings.txt
lang: text
note: 删节为表后的两行。
---
Some fields were truncated; use --no-trunc or --json to see them in full.

RESTART=yes: existing daemon-side consumers require `sbx daemon restart`. Supported CLI clients and new sandboxes use their current proxy settings immediately.
```

在录制用的 Mac 上，十五个键带 `"requires_restart": true`：四个 `proxy*` 键、三个 `no_proxy*` 键、六个 `ssh.*` 键、`tls.allowNegativeSerial` 和 `mcp.forceLocalGateway`。另外十六个在五秒内生效。其中一些，例如 `skills.defaultMode` 和 `sandbox.disk.dockerVolume`，在描述中说明只有更改之后创建的沙箱会看到新值。

## CLI 与文档不一致之处 {#s-sbx-settings-list-where-the-cli-and-the-docs-disagree}

文档的设置页和 CLI 列出的键不同，[设置表](#s-ref-settings-keys-environment-variables-and-paths)只打印 CLI 返回的键。四个键在 CLI 中而不在文档中：`ssh.autoCreate`、默认值为 `shell` 的 `ssh.defaultAgent`、`ssh.defaultTemplate` 和 `ssh.workspaceRoot`，如 [冲突 C20](#s-ref-sources-and-the-conflicts-register) 所记录。四个键在文档中而不在 CLI 输出中：`feature.model`、`feature.sandbox-gpu`、`feature.udp-egress` 和 `diagnostics.autoUploadErrorCooldownInDays`，如 [冲突 C19](#s-ref-sources-and-the-conflicts-register) 所记录。最后一个的文档默认值是 1 {{docs-sbx diagnostics.autoUploadErrorCooldownInDays}}。本次 capture 只对 `skills.defaultMode` 和 `kit.allowedSources` 运行了 `sbx settings get`，所以 `get` 对 `feature.*` 键回答什么仍未确定。

有一处默认值不一致。文档告诉你在 `feature.model` 之前运行 `sbx settings set platform.allowExperimentalFeatures true` {{docs-sbx Enable model selection}}，这暗示默认是 `false`。capture 打印的是 `true`，来源为 `default`，如 [冲突 C18](#s-ref-sources-and-the-conflicts-register) 所记录。

```listing
title: CLI 报告的实验性标志
source: capture/out/02-settings-experimental.json
lang: json
note: 未删节。
---
{
  "default": true,
  "description": "Allow experimental features.",
  "env_var": "DOCKER_SANDBOXES_ALLOW_EXPERIMENTAL_FEATURES",
  "key": "platform.allowExperimentalFeatures",
  "source": "default",
  "type": "bool",
  "value": true
}
```

同样的缺口也覆盖命令。`model.providers` 的描述点名 `sbx run --model <model> --provider <id>`，文档展示 `sbx run --name <SANDBOX_NAME> --model <MODEL_NAME> --provider <PROVIDER_ID>` {{docs-sbx configuration/models}}，但 v0.47.0 的 `sbx run --help` 两个标志都不列。密钥帮助文本提到后来用 `sbx mount` 添加的挂载 {{help-sbx sbx secret set}}，而帮助树没有 `sbx mount` 页。`sbx ssh proxy`、`sbx policy approval` 和 `--usb` 出现在 [冲突 C16](#s-ref-sources-and-the-conflicts-register) 列出的来源中，它们也都没有帮助页。本手册记录 `--help` 打印的内容，[命令表](#s-ref-sbx-commands)就是那份列表。

## kit 默认值 {#s-sbx-settings-list-the-kit-defaults}

六个 `kit.*` 键决定沙箱接受哪些 kit，六个都把 `default` 打成来源。`kit.allowedSources` 是 `["docker.io/"]`，`kit.allowLocalKits` 和 `kit.allowExtractedAgents` 是 `true`。`kit.requireSignature` 和 `kit.ignoreTransparencyLog` 是 `false`，`kit.trustedSigners` 通过 `https://accounts.google.com` 信任任何 `@docker.com` 身份。[Kit 签名](#s-sbx-kit-pack-push-sign-and-verify)展示签名检查如何使用它们。

```takeaways
- 阅读 `sbx settings list --json`，因为表格会截断值，而文档列出的是另一组键。
- 只有当环境别名必须压过每一次 `sbx settings set` 时，才导出它。
- 在任何 `proxy*`、`no_proxy*`、`ssh.*`、`tls.*` 或 `mcp.forceLocalGateway` 更改之后运行 `sbx daemon restart`。
- 在信任文档中的默认值之前，先检查 `sbx settings get --json KEY`。
```

Sources: help-sbx sbx settings, sbx settings list, sbx settings set, sbx settings unset, sbx secret set (research/sources/help-sbx.md); docs-sbx configuration/settings, configuration/models (research/sources/docs-sandboxes.md); conflicts C16, C18, C19, C20 (research/conflicts-register.md); research/sources/probes/sbx-settings-list.txt; capture/out/02-settings.json, 02-settings.txt, 02-settings-get.txt, 02-settings-experimental.json
