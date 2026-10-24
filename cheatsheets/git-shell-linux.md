---
id: git-shell-linux
title: Git, Shell and Linux for AI Work
code: GS
subtitle: 提交与分支、用管道过滤日志、在 tmux 中保持运行、把文件传到 GPU 机器并修复 Linux 错误。
hue: 25
sources: phases/00-setup-and-tooling/02-git-and-collaboration, phases/00-setup-and-tooling/10-terminal-and-shell, phases/00-setup-and-tooling/11-linux-for-ai
source_hash: 33bae92371a3e28d
---

## git 如何移动你的工作
type: architecture
from: phases/00-setup-and-tooling/02-git-and-collaboration/docs/en.md

```arch
node | wd | 1,1 | Working Directory | your files | client
node | sa | 2,1 | Staging Area | next commit | queue
node | lr | 3,1 | Local Repo | commits | store
node | r | 4,1 | Remote (GitHub) | your fork | store
edge | wd | sa | git add
edge | sa | lr | git commit
edge | lr | r | git push
edge | r | lr | git fetch
edge | lr | wd | git pull
```

## Git 任务
type: task-table
from: phases/00-setup-and-tooling/02-git-and-collaboration/docs/en.md
span: 2

| 任务 | 代码 |
|---|---|
| 设置身份 | `git config --global user.name "Your Name"` |
| 保存工作 | 先 `git add file.py` 再 `git commit -m "<message>"` |
| 备份 | `git push origin main` |
| 为实验开分支 | `git checkout -b experiment/new-optimizer` |
| 合并回来 | 先 `git checkout main` 再 `git merge experiment/new-optimizer` |
| 在你的 fork 上工作 | 先 `git checkout -b my-progress` 再 `git push -u origin my-progress` |
| 某个阶段的历史 | `git log --oneline -- phases/00-setup-and-tooling` |
| 某次提交的文件 | `git show --stat <hash>` |

## 管道与重定向
type: command-table
from: phases/00-setup-and-tooling/10-terminal-and-shell/docs/en.md

| 命令 | 作用 |
|---|---|
| `>` | 把 stdout 写入文件（覆盖） |
| `>>` | 把 stdout 追加到文件 |
| `2>` | 把 stderr 写入文件 |
| `2>&1` | 把 stderr 发到 stdout 所在的地方 |
| `\|` | 把 stdout 作为下一个命令的 stdin |
| `python train.py > train_full.log 2>&1` | 两个流写入同一个文件 |
| `python train.py 2>&1 \| tee train.log` | 记录日志并显示输出 |

## 过滤训练日志
type: annotated-code
lang: bash
from: phases/00-setup-and-tooling/10-terminal-and-shell/docs/en.md

```bash
cat train.log | grep "loss" | wc -l                   # count loss lines
grep "loss:" train.log | awk '{print $NF}' > losses.txt  # last field only
tail -f train.log | grep --line-buffered "ERROR"      # live errors
grep "final_accuracy" results/*.log | sort -t= -k2 -n -r  # best run first
diff <(grep "accuracy" exp1.log) <(grep "accuracy" exp2.log)
find . -name "*.py" | xargs wc -l | tail -1           # project size
env | grep -i cuda                                    # check before a run
```

## tmux 会话
type: task-table
from: phases/00-setup-and-tooling/10-terminal-and-shell/docs/en.md, phases/00-setup-and-tooling/11-linux-for-ai/docs/en.md

| 任务 | 代码 |
|---|---|
| 启动具名会话 | `tmux new -s training` |
| 水平分屏 | 先 `Ctrl+B` 再 `"` |
| 垂直分屏 | 先 `Ctrl+B` 再 `%` |
| 在窗格间移动 | 先 `Ctrl+B` 再按方向键 |
| 分离，运行继续 | 先 `Ctrl+B` 再 `d` |
| 重新连接 | `tmux attach -t training` |
| 列出会话 | `tmux ls` |
| 结束会话 | `tmux kill-session -t training` |

## Linux 文件、权限与软件包
type: command-table
from: phases/00-setup-and-tooling/11-linux-for-ai/docs/en.md
span: 2

| 命令 | 作用 |
|---|---|
| `mkdir -p a/b/c` | 创建嵌套目录 |
| `rm -rf my-dir/` | 删除目录。无法撤销 |
| `find . -name "*.ckpt" -size +1G` | 大于 1GB 的 checkpoint |
| `grep -r "learning_rate" .` | 在此处搜索所有文件 |
| `chmod +x train.sh` | 让脚本可执行 |
| `chmod 755 deploy.sh` | 所有者完全权限，其他人读+执行 |
| `sudo apt update && sudo apt install -y build-essential git curl wget tmux htop unzip python3-venv` | 新 GPU 机器的软件包 |
| `sudo systemctl status nginx` | 检查服务。还有 `start`、`stop`、`restart`、`enable` |

## 在远程 GPU 机器上工作
type: annotated-code
lang: bash
from: phases/00-setup-and-tooling/10-terminal-and-shell/docs/en.md, phases/00-setup-and-tooling/11-linux-for-ai/docs/en.md

```bash
ssh -i ~/.ssh/my_gpu_key user@gpu-box-ip       # connect with a key
scp model.pt user@gpu-box-ip:~/models/          # copy to remote
scp user@gpu-box-ip:~/results/metrics.json ./   # copy from remote
rsync -avz --progress ./data/ user@remote:/data/  # changed bytes only
ssh -L 8888:localhost:8888 user@gpu-box-ip      # remote Jupyter on localhost:8888
# ~/.ssh/config: Host gpu, HostName, User, IdentityFile
ssh -G gpu                                      # print the settings SSH uses
ssh gpu                                         # connect by the short name
```

## 故障排查
type: troubleshooting
from: phases/00-setup-and-tooling/11-linux-for-ai/docs/en.md, phases/00-setup-and-tooling/10-terminal-and-shell/docs/en.md

| 症状 | 原因 | 修复 |
|---|---|---|
| "Permission denied" | 权限位 | `chmod +x` 或 `sudo` |
| 合上笔记本后运行中断 | SSH 会话结束 | 在 tmux 中运行 |
| `sed -i 's/a/b/' file` 在 macOS 上失败 | macOS 的 sed 需要在 `-i` 后加 `''` | `sed -i '' 's/a/b/' file` |
| Bash 脚本出错 | Windows 的 `\r\n` 换行符 | 运行 `dos2unix` |
| 只在 Linux 上找不到文件 | 文件系统区分大小写 | `Model.py` 与 `model.py` 不同 |
| 找不到 `pbcopy` | 通过 SSH 不可用 | 使用 `cat` 或 `less` |
| WSL2 中没有 CUDA | 在 WSL 里装了 Linux 驱动 | 安装 Windows 版 NVIDIA 驱动 |
| 磁盘已满 | 模型与数据集 | `du -sh *`，然后清理缓存 |

## 课程别名
type: concepts
from: phases/00-setup-and-tooling/10-terminal-and-shell/code/shell_aliases.sh, phases/00-setup-and-tooling/10-terminal-and-shell/docs/en.md

- **加载它们**：`source phases/00-setup-and-tooling/10-terminal-and-shell/code/shell_aliases.sh`
- **`gpu`、`gpumem`、`gpuprocs`**：以 CSV 形式查看 GPU 状态、显存和进程。
- **`ae`、`uvvenv`**：激活 `.venv`，或用 uv 新建一个并激活。
- **`watchloss`、`taillog <pattern>`**：跟踪 `logs/*.log` 中的某个模式。
- **`trainenv <name>`**：带 `nvidia-smi` 和 `htop` 窗格的 tmux 会话。
- **`syncto <host> <remote_path>`**：用 rsync 上传。`syncfrom` 拉回。
- **`bigmodels`、`memhogs`**：最大的模型文件、占内存最多的进程。

## 问答
type: qa
from: phases/00-setup-and-tooling/10-terminal-and-shell/docs/en.md, phases/00-setup-and-tooling/11-linux-for-ai/docs/en.md, phases/00-setup-and-tooling/02-git-and-collaboration/docs/en.md

- **`&`、`nohup` 还是 tmux？** `nohup` 和 tmux 在关闭终端后仍存活。只有 tmux 能重新连接。
- **`rsync` 还是 `scp`？** 大文件都用 `rsync`。它能续传，并只发送变化的字节。
- **为什么要 fork 课程仓库？** 只有维护者能推送。你的 fork 是 `origin`。
- **Rebase 或 submodule？** 课程用不到。
- **以 root 运行？** 不要。只在需要时使用 `sudo`。

## 技巧
type: tips
from: phases/00-setup-and-tooling/02-git-and-collaboration/docs/en.md, phases/00-setup-and-tooling/10-terminal-and-shell/docs/en.md, phases/00-setup-and-tooling/11-linux-for-ai/docs/en.md

- 把 `*.pt`、`*.pth` 和 `*.safetensors` 加入 `.gitignore`。
- 每次安装前运行 `sudo apt update`。
- 超过几分钟的任务都用 tmux。
- 运行 `rm -rf` 前仔细检查路径。
- macOS 默认用 `~/.zshrc`。大多数 Linux 服务器用 `~/.bashrc`。

## 运行、监控与释放磁盘
type: command-table
from: phases/00-setup-and-tooling/10-terminal-and-shell/docs/en.md, phases/00-setup-and-tooling/11-linux-for-ai/docs/en.md
span: 2

| 命令 | 作用 |
|---|---|
| `watch -n1 nvidia-smi` | 每秒显示 GPU 使用情况 |
| `nvidia-smi --query-compute-apps=pid,name,used_memory --format=csv` | GPU 上的进程 |
| `htop` | `F6` 排序，`F5` 树状，`F9` 结束进程，`/` 搜索 |
| `nohup python train.py > train.log 2>&1 &` | 关闭终端后仍存活的后台运行 |
| `df -h` | 所有磁盘的使用情况 |
| `du -sh ~/.cache` | pip 和 huggingface 模型存放在这里 |
| `du -h --max-depth=1 / 2>/dev/null \| sort -hr \| head -20` | 最占空间的目录 |
| `pip cache purge` 和 `sudo apt clean` | 清理缓存 |
