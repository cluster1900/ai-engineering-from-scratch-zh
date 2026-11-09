# --clone 与 /run/sandbox/source

> 绑定模式把你的文件交给智能体，`:ro` 和无挂载模式给得更少，`--clone` 给它一份私有 clone，提交经 git remote 返回。

你让智能体通宵处理一个仓库。早上 `git diff` 是干净的，而一个新文件出现在 `.git/hooks/pre-commit` 里，任何 diff 都不会显示它。三种工作区模式决定智能体能写入你的目录树的多少。使用 `--clone` 时它什么都写不了。

读完本节后，你能为仓库选择一种工作区模式，并从 clone 模式沙箱中取出智能体的提交。

## 三种工作区模式 {#s-clone-and-run-sandbox-source-three-workspace-modes}

**直接挂载：** 工作区路径以相同绝对路径读写挂载进 VM {{help-sbx sbx create claude}}。在 `m101-demo` 中，智能体的 `pwd` 是 `$CAPTURE/fixtures/repo`，与主机上的字符串相同。`git log` 列出主机提交 `c7dfd56 second` 和 `086df68 first`（[这次 capture](manuals/docker-sandboxes-101/capture/out/04-workspace.txt)）。

挂载是 virtiofs，如 [microVM 边界](#s-sbx-diagnose-and-the-microvm-boundary) 所示，旧版插件的文件同步已经没有了（[冲突 C5](#s-ref-sources-and-the-conflicts-register)）。额外路径跟在第一条后面，`:ro` 使其中一条只读。只读参数可以命名单个文件。这样，在沙箱其他方面可写的工作区里，有一条路径够不着 {{help-sbx sbx create claude}}。

**无挂载：** `sbx create` 不带路径，所以 VM 没有主机绑定挂载。智能体在模板的工作目录中工作，Docker 的模板是 `/home/agent/workspace` {{docs-sbx Workspace isolation}}。`m101-policy` 就是这样创建的，`sbx create` 打印了 `workspace none · no workspace bind mount`（[这次 capture](manuals/docker-sandboxes-101/capture/out/09-create.txt)）。不带路径的 `sbx run` 会改为挂载当前目录，[sbx run、create、stop 和 rm](#s-sbx-run-create-stop-and-rm) 对此发出警告。

直接模式需要审查步骤。文档列出智能体能编辑的内容，例如 Git hooks、CI 配置、`package.json` 脚本和 `.claude/settings.json`。它们警告 hooks 不会出现在 `git diff` 中 {{docs-sbx Workspace isolation}}。一位 Docker Captain 在 2026-05-26 描述了这条隐蔽通道，这就是 clone 模式存在的原因 {{blog 2026-05-26 B16}}。

## Clone 模式 {#s-clone-and-run-sandbox-source-clone-mode}

**--clone：** 创建时的标志，让智能体在容器内的主机 Git 仓库私有 clone 上运行。主机仓库只读挂载 {{help-sbx sbx create}}。它在 v0.31.0 取代了 `--branch`，现在 `--branch` 会以 `--branch is no longer supported; use --clone instead` 失败 {{rel-sbx v0.31.0}}（[冲突 C6](#s-ref-sources-and-the-conflicts-register)）。当你重新连接到已有的 clone 模式沙箱时，该标志是空操作 {{help-sbx sbx run}}。capture 用它创建了 `m101-clone`：

```listing
title: 创建 clone 模式沙箱
source: capture/out/08-clone-create.txt
lang: text
note: 镜像拉取和 sbx ls 的第二行已删节。
---
$ sbx create --clone shell $CAPTURE/fixtures/repo-clone --name m101-clone
✓ Git repository detected: $CAPTURE/fixtures/repo-clone
…
  Git daemon: git://127.0.0.1:<port>/repo-clone
  Remote: sandbox-m101-clone
✓ Created sandbox m101-clone
  mount  $CAPTURE/fixtures/repo-clone → /run/sandbox/source (ro, source)
…
SANDBOX      AGENT   STATUS    PORTS                        WORKSPACE
m101-clone   shell   running   127.0.0.1:<port>->9418/tcp4   $CAPTURE/fixtures/repo-clone
```

在内部，有三件事实很突出（[这次 capture](manuals/docker-sandboxes-101/capture/out/08-clone-inside.txt)）。clone 位于相同路径 `$CAPTURE/fixtures/repo-clone`，在 `/dev/vde` 这个 ext4 卷上，它的 `origin` 是 `/run/sandbox/source`。源挂载是 `host on /run/sandbox/source type virtiofs (ro,nosuid,nodev,relatime)`，`touch /run/sandbox/source/x` 以 `Read-only file system` 失败。内部做的提交 `81e11df from sandbox` 也无法推送到 `origin`：`git push` 以 `remote unpack failed: unable to create temporary object directory` 结束（[这次 capture](manuals/docker-sandboxes-101/capture/out/08-clone-commit.txt)）。文档点明了限制：clone 模式阻止智能体改动你的主机仓库 {{docs-sbx Clone mode}}。读取仍然可以，所以仓库下未跟踪的 `.env` 在内部可读。

## 取回提交 {#s-clone-and-run-sandbox-source-getting-commits-back}

VM 中的 git-daemon 监听 9418，sbx 把它发布到 loopback 端口。随后 CLI 把一个 remote 写入主机仓库的 `.git/config`：

```listing
title: 主机上的沙箱 remote，fetch 之前和之后
source: capture/out/08-clone-host.txt
lang: text
note: core.* 配置行、ls-remote 输出和 fetch 警告已删节。
---
$ git -C $CAPTURE/fixtures/repo-clone remote -v
sandbox-m101-clone	git://127.0.0.1:<port>/repo-clone (fetch)
sandbox-m101-clone	git://127.0.0.1:<port>/repo-clone (push)
…
file:.git/config	remote.sandbox-m101-clone.fetch=+refs/heads/*:refs/remotes/sandbox-m101-clone/*
file:.git/config	remote.sandbox-m101-clone.fetch=+refs/heads/*:refs/sandboxes/m101-clone/*
…
$ git -C $CAPTURE/fixtures/repo-clone fetch sandbox-m101-clone
…
   c7dfd56..81e11df  main       -> sandbox-m101-clone/main
   c7dfd56..81e11df  main       -> refs/sandboxes/m101-clone/main
…
81e11df from sandbox
c7dfd56 second
086df68 first
```

两条 fetch refspec 意味着一次 fetch 更新两处：`refs/remotes/sandbox-m101-clone/main` 和 `refs/sandboxes/m101-clone/main`。`sbx rm` 删除 remote 和守护进程，并打印恢复命令 `git branch <local-name> refs/sandboxes/m101-clone/<branch>`。在这次 capture 中，`refs/sandboxes/m101-clone/main` 在删除后仍然存在（[这次 capture](manuals/docker-sandboxes-101/capture/out/08-clone-rm.txt)）。`sbx stop` 停止守护进程，重新启动会分配新端口并改写 remote URL {{docs-sbx Use Git with sandboxes}}。fetch 输出中的 `/root/.config/git/attributes` 警告来自 VM 内守护进程的用户，不会改变任何东西。`sbx kit add` 把 clone 放在命名的工作区卷上 {{help-sbx sbx kit add}}，也就是上面的 ext4 设备，`sbx rm` 会清理 Git worktree {{help-sbx sbx rm}}。

[图](#fig-3-2) 跟随一次提交从 clone 到主机 refs。

```figure
id: fig-3-2
kind: flow
title: 一次提交从 clone 到主机
claim: 主机仓库只读进入 VM 的 /run/sandbox/source，智能体向私有 clone 提交，git-daemon 把该 clone 作为主机 remote 回送.
caption: 从主机仓库横向读到 clone，再往下回到主机 refs。实心青绿箭头是写入两条 refs 的 fetch。虚线玫瑰色箭头是只读挂载拒绝的 push。 From capture/out/08-clone-inside.txt, 08-clone-commit.txt, and 08-clone-host.txt.
```

```takeaways
- 对任何你不放心把 `.git/hooks` 和构建脚本交给它的智能体，使用 `--clone`。
- 在 `sbx create` 时决定模式，因为不能给已有沙箱加上 `--clone`。
- 在 `sbx rm` 之前 fetch `sandbox-<name>`，或从 `refs/sandboxes/<name>/*` 恢复分支。
- 不要把 `.env` 放进被 clone 的仓库，因为只读挂载仍然会暴露它。
```

Sources: help-sbx sbx create, sbx create claude, sbx run, sbx rm, sbx kit add (research/sources/help-sbx.md); docs-sbx Isolation layers, Architecture, Use Git with sandboxes, Usage (research/sources/docs-sandboxes.md); rel-sbx v0.31.0 (research/sources/sbx-releases.md); research/conflicts-register.md rows C5, C6; blog B16 (2026-05-26) from research/plan.md; capture/out/04-workspace.txt, 08-clone-create.txt, 08-clone-inside.txt, 08-clone-commit.txt, 08-clone-host.txt, 08-clone-rm.txt, 09-create.txt
