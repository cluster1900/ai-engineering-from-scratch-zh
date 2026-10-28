# rea doctor 与 Ghidra provider

> rea doctor 为 Ghidra 作用域跑九项检查，只有安装目录、版本、analyzeHeadless、原生反编译器与 JDK 21 全部通过时，provider 才可用。

你用 `npm` 装了 rea，用 Homebrew 装了 Ghidra，第一次 `rea function` 以 `provider_unavailable` 结束。消息让你跑 `rea doctor`。报告为 Ghidra 作用域有九项检查，每项有名字、`ok` 标志，以及它找到的路径或版本。第一项失败的检查点名修法。

读完本节后，你能读懂一份 doctor 报告，点名失败的检查，并从它的 remediation 文本修好安装。

## Ghidra provider 需要什么 {#s-rea-doctor-and-the-ghidra-provider-what-the-ghidra-provider-needs}

**Ghidra provider：** 经 `analyzeHeadless` 驱动已有 Ghidra 安装的 rea 适配器。它需要环境里的两个绝对路径，`GHIDRA_INSTALL_DIR` 与 `JAVA_HOME`，并拒绝相对路径。策略固定版本：`SUPPORTED_GHIDRA_VERSION = "12.1.4"` 与 `SUPPORTED_GHIDRA_JAVA_MAJOR = 21`。实践中，provider 接受 Ghidra 12.1.x，以及安装在 `application.java.min` 与 `application.java.max` 声明范围内的 64 位完整 JDK {{install Ghidra}}。安装还必须在 `Ghidra/Features/Decompiler/os/<platform>/` 下持有主机的原生反编译器。REA 不构建或安装原生工具，也不改 Gatekeeper 隔离设置 {{install Ghidra}}。

在捕获用的 Mac 上，Homebrew 把两个工具都放好了：

```listing
title: the Ghidra and JDK paths on the capture Mac
source: capture/out/00-versions.txt
lang: text
note: Cut to the Ghidra and Java blocks. The rea, node, clang, llvm-objdump, macOS, and WABT blocks are cut.
---
…
GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec
application.build.date=2026-Sep-21 2017 GMT
application.version=12.1.4
application.release.name=PUBLIC

JAVA_HOME=/opt/homebrew/opt/openjdk@21
$ /opt/homebrew/opt/openjdk@21/bin/java -version
openjdk version "21.0.12.1" 2026-08-18
OpenJDK Runtime Environment Homebrew (build 21.0.12.1)
OpenJDK 64-Bit Server VM Homebrew (build 21.0.12.1, mixed mode, sharing)
[exit 0]
…
```

安装文档给任何主机同样的步骤：解压 Ghidra，在 REA 之外安装 JDK，并导出两个绝对路径 {{install Ghidra}}。在带 Homebrew 的 Mac 上，那是：

```bash
export GHIDRA_INSTALL_DIR=/opt/homebrew/Cellar/ghidra/12.1.4/libexec
export JAVA_HOME=/opt/homebrew/opt/openjdk@21
rea doctor --provider ghidra --format json
```

`--provider ghidra` 把报告收窄到一个作用域。没有它时，报告还覆盖 Hopper、IDA、JADX 与 Kuna provider、已安装的 skill，以及机器上的 agent 注册。

## 九项检查 {#s-rea-doctor-and-the-ghidra-provider-the-nine-checks}

```listing
title: the doctor report for the Ghidra scope
source: capture/out/01-doctor-ghidra.json
lang: json
note: Cut to the head, the first check, and the two checks that read the install. The other six checks are cut.
---
{
  "healthy": true,
  "environment_healthy": false,
  "scope": {
    "mode": "explicit",
    "clients": [],
    "providers": [
      "ghidra"
    ],
    "skill": false,
    "target": null
  },
  "scope_checks": [
    {
      "name": "node",
      "ok": true,
      "classification": "healthy",
      "detail": "22.22.0",
      "details": {
        "runtime": "node",
        "version": "22.22.0"
      }
    },
    …
    {
      "name": "ghidra-native_decompiler",
      "ok": true,
      "classification": "healthy",
      "detail": "/opt/homebrew/Cellar/ghidra/12.1.4/libexec/Ghidra/Features/Decompiler/os/mac_arm_64/decompile reports mach-o arm64, which matches darwin/arm64"
    },
    {
      "name": "ghidra-java",
      "ok": true,
      "classification": "healthy",
      "detail": "21.0.12.1; 64-bit; JDK; /opt/homebrew/Cellar/openjdk@21/21.0.12.1/libexec/openjdk.jdk/Contents/Home; accepted a 64-bit full JDK 21 or newer"
    }
  ]
}
```

`inspectGhidraInstallation` 在不导入任何东西的情况下跑八项 Ghidra 检查。顺序是 `configuration`、`platform`、`architecture`、`installation`、`version`、`headless`、`native_decompiler` 与 `java`，doctor 给每个名字加上 `ghidra-` 前缀。`node` 检查排在最前。下表点名每一项读什么，以及失败时返回的代码。

| Check | What it reads | On the capture Mac | Failure code |
|---|---|---|---|
| `node` | the Node version | `22.22.0` | `missing_dependency` |
| `ghidra` | `GHIDRA_INSTALL_DIR`, set and absolute | `/opt/homebrew/Cellar/ghidra/12.1.4/libexec` | `not_configured` |
| `ghidra-platform` | the host OS | `darwin` | `unsupported_host` |
| `ghidra-architecture` | the host CPU | `arm64` | `unsupported_host` |
| `ghidra-installation` | `Ghidra/application.properties` under the install | the properties file | `executable_missing` |
| `ghidra-version` | `application.version` against 12.1.x | `12.1.4` | `unsupported_version` or `version_unresolved` |
| `ghidra-headless` | `support/analyzeHeadless`, or `.bat` on Windows | `support/analyzeHeadless` | `executable_missing` |
| `ghidra-native_decompiler` | `Ghidra/Features/Decompiler/os/mac_arm_64/decompile` and its executable header | `mach-o arm64`, which matches `darwin/arm64` | `executable_missing` |
| `ghidra-java` | the JDK, its major version against `application.java.min`, 64-bit, `javac` present | `21.0.12.1`, 64-bit, JDK | one code for each failed property |


原生反编译器检查读取 `decompile` 二进制的可执行头，并与主机比较。因此为另一平台构建的会报告为不兼容，即使目录名看起来对 {{install Ghidra}}。doctor 检查平台、架构与 Ghidra 12.1.x 版本。它也检查 `support/analyzeHeadless` 或 `support/analyzeHeadless.bat`、安装的 Java major 范围、64 位 JDK，以及 `javac` 或 `javac.exe` {{install Ghidra}}。[图](#fig-2-2) 按顺序画出这九项。

```figure
id: fig-2-2
kind: flow
title: the nine checks of rea doctor for the Ghidra scope
claim: rea doctor runs nine checks for the Ghidra scope in a fixed order, and on the capture Mac every one passed with the path or version it found.
caption: Read left to right, then down, and the two boxes at the bottom are the report's two verdicts. From capture/out/01-doctor-ghidra.json and 00-commands.txt, with the order from src/ghidra/GhidraInstallation.ts at the tag.
```

## healthy 与 environment_healthy {#s-rea-doctor-and-the-ghidra-provider-healthy-and-environment-healthy}

报告有两个裁决。`healthy` 是所选作用域的裁决，这里是带 `providers: ["ghidra"]` 的 `explicit`，`scope_checks` 只列出该作用域里的检查。`environment_healthy` 是全审计集合的裁决。只有当 provider 之外的每一项检查都通过、每一个已配置的 provider 都通过，并且至少一个 provider 可用时，它才为 true。

在捕获用的 Mac 上 `healthy` 为 true，`environment_healthy` 为 false。那里没有配置 Hopper、IDA 与 Kuna，所以公式忽略它们，而 Ghidra 已配置并通过。因此 false 裁决来自 Ghidra 作用域之外的一项检查。那项检查在捕获的 `--filter-output` 去掉的集合里，它点名该用户的 skill 安装与 agent 注册（[捕获](manuals/reverse-engineering-101/capture/README.md)）。退出状态跟着作用域。`rea doctor` 返回了 0（[捕获](manuals/reverse-engineering-101/capture/out/00-commands.txt)），因为缺少可选 provider 只对不用它的任务产生一条说明 {{cli Output and exit status}}。

## 检查失败时 {#s-rea-doctor-and-the-ghidra-provider-when-a-check-fails}

捕获套件没有录到失败的 doctor，因为已安装 Ghidra。源码说明你会看到什么。未设置 `GHIDRA_INSTALL_DIR` 时，`configuration` 检查失败，detail 为 `GHIDRA_INSTALL_DIR is not set`，remediation 为 `Set GHIDRA_INSTALL_DIR to an extracted Ghidra 12.1.x release directory.`。相对路径时，detail 是 `GHIDRA_INSTALL_DIR must be absolute`。

在这样的机器上跑 `rea function --provider ghidra` 会以代码 `provider_unavailable`、类别 `unavailable` 与 `retryable: true` 失败选择。消息是 `The selected analysis provider is unavailable. Review the reported local diagnostics or run rea doctor, then retry.`。它的 `details.rejections[].diagnostics.checks[]` 持有与 doctor 相同的八项检查。[第 2.3 节](#s-rea-capabilities) 在 `rea capabilities` 里展示那些诊断，[错误参考](#s-ref-errors) 列出代码。

有一项检查在 rea 里没有修法。macOS 上每一份 Ghidra 记录都带着 limitation："macOS sessions require a matching executable Ghidra native decompiler; REA checks for it but does not build native components or change Gatekeeper quarantine state."（[捕获](manuals/reverse-engineering-101/capture/out/06-function-percent-change.json)）。若 Homebrew 构建的 `decompile` 缺失或被隔离，你修的是 Ghidra，不是 rea。

```takeaways
- 在第一条 rea 命令之前，把 `GHIDRA_INSTALL_DIR` 与 `JAVA_HOME` 导出为绝对路径。
- 跑 `rea doctor --provider ghidra --format json`，并在 `scope_checks` 里读第一个 `ok: false`。
- 按检查的 remediation 修好安装，再跑一次 doctor。
- 把 `environment_healthy` 读成整台机器的报告，把 `healthy` 读成你的作用域裁决。
```

Sources: install Ghidra (rea docs/installation.md); cli Output and exit status (rea docs/cli.md); rea at 27dc42d: src/config/environment.ts, src/ghidra/GhidraInstallationPolicy.ts, src/ghidra/GhidraReleasePolicy.ts, src/ghidra/GhidraInstallation.ts, src/ghidra/GhidraDoctor.ts, src/application/Doctor.ts, src/application/DoctorDiagnostics.ts, src/application/DoctorProviderIds.ts, src/domain/providerSelectionError.ts, src/domain/analysisErrorProjection.ts; capture/README.md; capture/out/00-commands.txt, 00-versions.txt, 01-doctor-ghidra.json, 06-function-percent-change.json
