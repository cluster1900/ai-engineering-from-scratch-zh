# `sbx kit pack`、`sbx kit push --sign` 与 `sbx kit verify`

> `sbx kit` 命令为 v1 和 v2 artifact 打包、签名、推送、验证并展示 provenance，`kit add` 把 mixin 追加到正在运行的沙箱。

你写了一个安装 `tree` 并在工作区放入 `HELLO.md` 的 v2 mixin。同事想要不克隆你的仓库就用它，安全团队想知道是谁签的名。只要 kit 是 v1 或 v2，`sbx kit` 命令两件事都能覆盖。

读完本节后，你能校验并打包一个 v2 kit，并说明 `push --sign` 往清单上附着什么。你还能验证签名，并把 mixin 加到正在运行的沙箱。

## spec.yaml 与 files/ {#s-sbx-kit-pack-push-sign-and-verify-spec-yaml-and-files}

**Mixin（v2）：** 一个目录，内有 `schemaVersion` 为 `"2"`、`kind` 为 `mixin` 的 `spec.yaml`，外加可选的 `files/` 树 {{docs-sbx Use existing kits}}。capture kit 写了一个：

```listing
title: capture kit 写出的 v2 mixin
source: capture/fixtures/kits/hello-mixin/spec.yaml
lang: yaml
---
schemaVersion: "2"
kind: mixin
name: hello-mixin
description: Installs tree and adds a greeting file to the workspace.
setup:
  install:
    - command: apt-get update && apt-get install -y tree
      user: "0"
      description: Install tree
permissions:
  network:
    allow:
      - example.com
```

`files/workspace/HELLO.md` 只有一行，`sbx kit inspect` 把它报告为 mode 420 的工作区文件（[该 capture](manuals/docker-sandboxes-101/capture/out/12-inspect.json)）。v2 语法就是内置智能体使用的那套，其规范性文本在 `docker/sbx-kits-contrib` 的 `SPEC-v2.md` 中 {{docs-sbx Top-level fields}}。

## validate 与 pack {#s-sbx-kit-pack-push-sign-and-verify-validate-and-pack}

`sbx kit validate REFERENCE` 接受目录、ZIP 或 git 引用，`--json` 报告裁决和警告 {{help-sbx sbx kit validate}}：

```listing
title: 先 validate，再 pack
source: capture/out/12-validate.json
lang: json
---
{
  "reference": "./fixtures/kits/hello-mixin",
  "kind": "directory",
  "valid": true,
  "warnings": []
}
```

```listing
title: pack 写出的 ZIP
source: capture/out/12-pack.txt
lang: text
---
$ sbx kit pack ./fixtures/kits/hello-mixin -o $CAPTURE/work/hello-mixin.zip
Packed artifact to $CAPTURE/work/hello-mixin.zip
[exit 0]

$ zip listing of work/hello-mixin.zip (size, name)
       0  files/
       0  files/workspace/
      22  files/workspace/HELLO.md
     297  spec.yaml
```

对 `pack` 而言，目录必须包含有效的 `spec.yaml`，可以包含 `files/` 目录 {{help-sbx sbx kit pack}}。同一份 ZIP 用 `kind: "zip"` 通过校验（[该 capture](manuals/docker-sandboxes-101/capture/out/12-validate-zip.json)）。v3 目录两个命令都会失败，如[描述符一节](#s-syntax-docker-sandbox-kit-3-and-kit-yaml)所示。[图](#fig-4-3)画出整条路径，capture kit 没有运行的步骤用虚线框。

```figure
id: fig-4-3
kind: flow
title: 从 spec.yaml 到已签名的 artifact，再进入沙箱
claim: v2 kit 在主机上校验并打包，用两个 referrer 签名并推送，从仓库验证，再由 create 或 kit add 使用.
caption: 逐行阅读。实线框来自 validate、pack、run 和 kit-add 的 capture。虚线框遵循 sbx kit sign、push、verify 和 provenance 的帮助文本，这些命令没有实际运行。
```

## sign、push --sign 与 pull {#s-sbx-kit-pack-push-sign-and-verify-sign-push-sign-and-pull}

capture kit 这三个都没有跑，因为它没有仓库，也没有签名身份。来源是帮助文本。`sbx kit sign` 默认无密钥，OIDC token 来自 CI 提供方或浏览器登录。它从不从 `SIGSTORE_ID_TOKEN` 读取 token，所以能设置环境变量的进程无法选择 token {{help-sbx sbx kit sign}}。带 `--key` 时，它用未加密的 PEM 私钥签名。对本地目录，它把分离的签名包写到 `spec.yaml` 旁边的 `kit.sig.bundle` {{help-sbx sbx kit sign}}。

`sbx kit push DIRECTORY REFERENCE` 按 `schemaVersion` 选择 artifact 形态：`"1"` 用 ZIP，`"2"` 用 tar+gzip 层并把 spec 放进 config blob {{help-sbx sbx kit push}}。带 `--sign` 时，这次推送给清单签名，并把 Sigstore bundle 作为 OCI referrer 附着到 kit {{help-sbx sbx kit push}}。每次推送还把 SLSA provenance 证明作为 OCI referrer 附着 {{help-sbx sbx kit push}}，并且这份 provenance 只在 `--sign` 时签名 {{help-sbx sbx kit push}}。`--tlog-upload=false` 让私有 kit 不进 Rekor 日志。对 `pull` 而言，仓库必须支持 HTTPS {{help-sbx sbx kit pull}}。

同一条命令按引用给已发布的 v3 镜像签名。以源目录或 Git 引用分享的 v3 kit 无法签名 {{docs-sbx Sign and verify kits}}。

## verify、provenance 与接纳 kit 的设置 {#s-sbx-kit-pack-push-sign-and-verify-verify-provenance-and-the-settings-that-admit-a-kit}

`sbx kit verify` 用 `--key PUB` 做密钥验证，或用 `--certificate-identity` 加 `--certificate-oidc-issuer` 做无密钥签名。`--insecure-ignore-tlog` 接受私有的无密钥签名，该标志对基于密钥的验证没有改变 {{help-sbx sbx kit verify}}。`sbx kit provenance REFERENCE` 打印证明，并且只有在它验证通过且其 subject 匹配 kit 的 digest 时，才把一份证明报告为 `VERIFIED` {{help-sbx sbx kit provenance}}。

六项设置决定沙箱接受什么，在录制主机上都处于默认值：

```listing
title: 处于默认值的 kit 设置
source: capture/out/02-settings.txt
lang: text
note: description 列已删节。
---
kit.allowExtractedAgents             true                               bool     default             Admit the pinned kit references that replace fo…
kit.allowLocalKits                   true                               bool     default             Allow installing kits from local directories or…
kit.allowedSources                   ["docker.io/"]                     json     default             JSON array of allowed kit source prefixes (e.g.…
kit.ignoreTransparencyLog            false                              bool     default             Verify keyless kit signatures without requiring…
kit.requireSignature                 false                              bool     default             Require a valid signature from a trusted signer…
kit.trustedSigners                   [{"identityRegexp":"^.*@docker\…   json     default             JSON array of trusted signer policies (key-base…
```

当 `kit.requireSignature` 为 `true` 时，`sbx` 拒绝未签名的 kit、与 `kit.trustedSigners` 不匹配的签名，以及 ZIP kit {{docs-sbx Require signed kits}}。默认的 `kit.trustedSigners` 策略信任以 `@docker.com` 结尾、由 Google issuer 证明的 Docker 员工身份 {{docs-sbx kit.trustedSigners}}。[设置表](#s-ref-settings-keys-environment-variables-and-paths)列出每个键的环境变量。

## kit add 与 builder {#s-sbx-kit-pack-push-sign-and-verify-kit-add-and-the-builder}

`sbx kit add SANDBOX REFERENCE` 用加入的 mixin 重建容器，并在交换过程中保留 kit 拥有的卷，例如智能体会话状态 {{help-sbx sbx kit add}}。capture 展示了接受的情况和拒绝的情况：

```listing
title: kit add 接受 env-mixin 并拒绝 hello-mixin
source: capture/out/12-kit-add.txt
lang: text
---
$ sbx kit add m101-demo ./fixtures/kits/env-mixin
Recreating sandbox "m101-demo" to apply augmented kit list...
  Swap container m101-demo-swap-<id> started (id=<sha256>).
Kit "env-mixin" added to sandbox "m101-demo"
[exit 0]

$ sbx exec m101-demo sh -c 'env | grep M101_FROM_KIT'
M101_FROM_KIT=yes
[exit 0]
```

```listing
title: 带 files 的 mixin 被拒绝
source: capture/out/12-kit-add-files.txt
lang: text
---
$ sbx kit add m101-demo ./fixtures/kits/hello-mixin
error: kit "hello-mixin" declares files, which the kit-add recreate flow does not yet apply; recreate the sandbox from scratch via `sbx rm` + `sbx create --kit` to use this kit
[exit 1]
```

在 recreate-aware 标签之前创建的沙箱会以错误被拒绝 {{help-sbx sbx kit add}}，`long-running@1` 不能用这种方式加入 {{rel-sbx v0.47.0}}。`sbx create shell --kit ./fixtures/kits/hello-mixin` 完整应用了同一个 mixin：一条安装命令、一个工作区文件、一条允许规则（[这些 capture](manuals/docker-sandboxes-101/capture/out)）。

v3 kit 的源形态构建在名为 `sbx-kit-builder` 的共享 builder 沙箱中运行，`sbx` 在首次使用时创建它 {{help-sbx sbx kit builder}}。`sbx kit builder status` 报告它，`history` 透传到 `docker buildx history`：

```listing
title: 任何构建之前的 builder
source: capture/out/13-kit-builder-status.txt
lang: text
---
$ sbx kit builder status
Builder:      not created (the first source-form kit build creates it)
Builder kit:  docker.io/docker/sbx-kit-builder:1
Kit registry: 127.0.0.1:5411 — reachable
[exit 0]
```

```takeaways
- 在 `pack` 或 `push` 之前运行 `sbx kit validate`，使用你在 create 时会用的同一组 `--kit-arg` 值。
- 用 `--sign` 推送，并用你期望的密钥或身份与 issuer 验证。
- 在 `kit.requireSignature` 之前设置 `kit.trustedSigners`，否则只有 Docker 自己的身份能通过。
- 对变量、命令和允许规则用 `sbx kit add`，对声明 files 的 mixin 则重建。
```

Sources: help-sbx sbx kit add, builder, pack, provenance, pull, push, sign, validate, verify (research/sources/help-sbx.md); docs-sbx Kits v2, Build and distribute kits, kit settings (research/sources/docs-sandboxes.md); rel-sbx v0.47.0 (research/sources/sbx-releases.md); research/conflicts-register.md row C13; capture/fixtures/kits/hello-mixin/spec.yaml, capture/fixtures/kits/env-mixin/spec.yaml; capture/out/02-settings.txt, 12-inspect.json, 12-validate.json, 12-validate-zip.json, 12-pack.txt, 12-run-kit.txt, 12-policy-kit.txt, 12-kit-add.txt, 12-kit-add-files.txt, 13-kit-builder-status.txt
