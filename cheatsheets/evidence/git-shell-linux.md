# Evidence: cheatsheets/git-shell-linux.md

Abbreviations: P0 = phases/00-setup-and-tooling. G = P0/02-git-and-collaboration/docs/en.md, T = P0/10-terminal-and-shell/docs/en.md, A = P0/10-terminal-and-shell/code/shell_aliases.sh, L = P0/11-linux-for-ai/docs/en.md.

## git 如何移动你的工作 (architecture, 4 nodes, 5 edges)
- Working Directory: G:24
- Staging Area: G:25
- Local Repo: G:26
- Remote (GitHub): G:27
- git add, git commit, git push, git fetch, git pull: G:28-32
- Remote is your fork: G:75

## Git 任务 (task-table, 8)
- git config --global user.name: G:49
- git add file.py, git commit -m: G:57-58
- git push origin main: G:59
- git checkout -b experiment/new-optimizer: G:65
- git checkout main, git merge experiment/new-optimizer: G:69-70
- git checkout -b my-progress, git push -u origin my-progress: G:81, 106
- git log --oneline -- phases/00-setup-and-tooling: G:110
- git show --stat <hash>: G:110

## 管道与重定向 (command-table, 7)
- `>` overwrite stdout: T:105
- `>>` append stdout: T:106
- `2>` stderr to file: T:107
- `2>&1` stderr to stdout: T:108
- `|` stdout as stdin: T:109
- python train.py > train_full.log 2>&1: T:98
- python train.py 2>&1 | tee train.log: T:293

## 过滤训练日志 (annotated-code, 7 lines)
- count loss lines: T:83
- awk '{print $NF}' > losses.txt: T:86
- tail -f with --line-buffered "ERROR": T:89
- sort -t= -k2 -n -r: T:92
- diff of two logs: T:296
- count lines of Python files: T:308
- env | grep -i cuda: T:315

## tmux 会话 (task-table, 8)
- tmux new -s training: T:157
- Ctrl+B then " splits horizontally: T:160, L:245
- Ctrl+B then % splits vertically: T:163, L:244
- Ctrl+B then arrow keys: T:166, L:246
- Ctrl+B then d detaches, session keeps running: T:169, L:238
- tmux attach -t training: T:172
- tmux ls: T:175
- tmux kill-session -t training: T:178

## Linux 文件、权限与软件包 (command-table, 8)
- mkdir -p a/b/c: L:59
- rm -rf my-dir/, no undo: L:68, 71
- find . -name "*.ckpt" -size +1G: L:91
- grep -r "learning_rate" .: L:87
- chmod +x train.sh: L:109
- chmod 755 deploy.sh: L:110
- fresh GPU box apt line: L:132-143
- systemctl status, start, stop, restart, enable: L:173-177

## 在远程 GPU 机器上工作 (annotated-code, 8 lines)
- ssh -i ~/.ssh/my_gpu_key: T:235
- scp to and from remote: T:238, 241
- rsync -avz --progress, changed bytes only: L:225, 229
- ssh -L 8888:localhost:8888, open localhost:8888: T:247-248
- ~/.ssh/config Host gpu, HostName, User, IdentityFile: T:251-255
- ssh -G gpu prints settings: T:348
- ssh gpu: T:258

## 故障排查 (troubleshooting, 8)
- Permission denied, chmod +x or sudo: L:116
- Closing the laptop kills the run, tmux prevents it: L:233
- macOS sed needs an empty string after -i: L:278
- Windows \r\n breaks bash scripts, dos2unix: L:280
- Case-sensitive filesystem, Model.py and model.py: L:279
- pbcopy / pbpaste not available, use cat or less: L:274-275
- Install the Windows NVIDIA driver for CUDA in WSL2: L:265
- Models and datasets fill disks, du -sh *, clear caches: L:182, 188, 196-203

## 课程别名 (concepts, 7)
- source shell_aliases.sh: T:266
- gpu, gpumem, gpuprocs: A:9, 11, 12
- ae, uvvenv: A:30, 33
- watchloss, taillog: A:37, 41-44
- trainenv with nvidia-smi and htop panes: A:65-73
- syncto, syncfrom: A:78-100
- bigmodels, memhogs: A:50, 137-139

## 问答 (qa, 5)
- &, nohup, tmux: survive and reattach table: T:135-143
- rsync over scp for anything large: L:224, 229
- Only maintainers can push, fork so origin is your copy: G:75
- No rebase, cherry-pick or submodules: G:97
- Use sudo only when needed: L:156

## 技巧 (tips, 5)
- .gitignore for .pt, .pth, .safetensors: G:101, 108
- sudo apt update first: L:123
- tmux for anything longer than a few minutes: T:143
- Double-check the path before rm -rf: L:71
- ~/.zshrc on macOS, ~/.bashrc on Linux: L:276

## 运行、监控与释放磁盘 (command-table, 8)
- watch -n1 nvidia-smi: T:214
- nvidia-smi --query-compute-apps: T:217
- htop F6, F5, F9, /: T:221-224
- nohup python train.py > train.log 2>&1 &, survives close: T:120, 140
- df -h: L:185
- du -sh ~/.cache, pip and huggingface: L:189
- du -h --max-depth=1 biggest space hogs: L:193
- pip cache purge, sudo apt clean: L:200, 203
