# Terminal y Shell

> El terminal es el campo de los ingenieros de IA.

**类型：**El aprendizaje
**语言：**- ¿ Qué ?
**先修要求：**Fase 0, Lección 01
**时间：**~ 35 minutos

## El objetivo del aprendizaje

- Utiliza tubos, redirecciones y`grep`Desde la orden de la línea de trabajo
- Crear contenidos en varios paneles de sesiones de tmux duraderas, para hacer entrenamiento y GPU  monitoreo
- Uso `htop`¿Qué es esto?`nvtop`Y `nvidia-smi` Sistema de control y recursos de GPU
- Utiliza SSH`scp`Y `rsync`Ficha de transmisión entre máquinas locales y remotas

##  problemas

Usted pasa más tiempo en el terminal que cualquier editor. Entrenamiento de la ejecución, la vigilancia de la GPU, el diario, la cola de las sesiones de SSH, el manejo ambiental. Cada flujo de trabajo de la IA se conecta con la carcasa.

Este curso abarca la inteligencia artificial 工作真正需要的终端 技能──不讲 Unix 历史──不深入 Bash scripting──只讲你需要的内容──

## 概念

```mermaid
graph TD
    subgraph tmux["tmux session: training"]
        subgraph top["Top row"]
            P1["Pane 1: Training run<br/>python train.py<br/>Epoch 12/100 ..."]
            P2["Pane 2: GPU monitor<br/>watch -n1 nvidia-smi<br/>GPU: 78% | Mem: 14/24G"]
        end
        P3["Pane 3: Logs + experiments<br/>tail -f logs/train.log | grep loss"]
    end
```

Tres cosas funcionan simultáneamente. Un terminal. Puedes desprenderte, volver a casa, volver a la SSH, y luego volver a conectarte.


```figure
s0-shell-pipeline
```

## Construirlo

### Paso 1: Conoce tu cáscara

检查你正在运行哪个贝:

```bash
echo $SHELL
```

La mayoría de los sistemas usan`bash`O `zsh` ambos pueden ser  en el curso de instrucciones en cualquier uno de ellos pueden trabajar

需要知道的关键内容:

```bash
# Move around
cd ~/projects/ai-engineering-from-scratch
pwd
ls -la

# History search (most useful shortcut you'll learn)
# Ctrl+R then type part of a previous command
# Press Ctrl+R again to cycle through matches

# Clear terminal
clear   # or Ctrl+L

# Cancel a running command
# Ctrl+C

# Suspend a running command (resume with fg)
# Ctrl+Z
```

### Paso 2: Piping y redirecciones

Piping 会把命令连接起来. Así es como se maneja el diario.

```bash
# Count how many times "loss" appears in a log
cat train.log | grep "loss" | wc -l

# Extract just the loss values from training output
grep "loss:" train.log | awk '{print $NF}' > losses.txt

# Watch a log file update in real time, filtering for errors
tail -f train.log | grep --line-buffered "ERROR"

# Sort experiments by final accuracy
grep "final_accuracy" results/*.log | sort -t= -k2 -n -r

# Redirect stdout and stderr to separate files
python train.py > output.log 2> errors.log

# Redirect both to the same file
python train.py > train_full.log 2>&1
```

Necesitas tres redirecciones:

| 符号 | 作用 |
|--------|-------------|
| `>` | 将 stdout 写入文件（覆盖） |
| `>>` | 将 stdout 追加到文件 |
| `2>` | 将 stderr 写入文件 |
| `2>&1` | 将 stderr 发送到与 stdout 相同的位置 |
| `\|` | 将一个 command 的 stdout 作为 stdin 发送给下一个 command |

### 步骤 3: 后台 proceso

El entrenamiento se lleva un par de horas.

```bash
# Run in background (output still goes to terminal)
python train.py &

# Run in background, immune to hangup (closing terminal won't kill it)
nohup python train.py > train.log 2>&1 &

# Check what's running in background
jobs
ps aux | grep train.py

# Bring a background job to foreground
fg %1

# Kill a background process
kill %1
# or find its PID and kill that
kill $(pgrep -f "train.py")
```

`&`¿Qué es esto?`nohup`Y `screen`- ¿ Qué ?`tmux`的区别:

| 方法 | 关闭 terminal 后还能继续？ | 可以 reattach？ |
|--------|-------------------------|---------------|
| `command &` | 否 | 否 |
| `nohup command &` | 是 | 否（查看 log file） |
| `screen` / `tmux` | 是 | 是 |

Cualquier tarea que exceda unos minutos, todo lo que haga.

### 步骤 4: el

tmux 让你创建包含多面板的持久终端会议──这是运行管理训练最有用的单个工具──

```bash
# Install
# macOS
brew install tmux
# Ubuntu
sudo apt install tmux

# Start a named session
tmux new -s training

# Split horizontally
# Ctrl+B then "

# Split vertically
# Ctrl+B then %

# Navigate between panes
# Ctrl+B then arrow keys

# Detach (session keeps running)
# Ctrl+B then d

# Reattach
tmux attach -t training

# List sessions
tmux ls

# Kill a session
tmux kill-session -t training
```

Tipica sesión de flujo de trabajo de IA:

```bash
tmux new -s train

# Pane 1: start training
python train.py --epochs 100 --lr 1e-4

# Ctrl+B, " to split, then run GPU monitor
watch -n1 nvidia-smi

# Ctrl+B, % to split vertically, tail the logs
tail -f logs/experiment.log

# Now detach with Ctrl+B, d
# SSH out, go get coffee, come back
# tmux attach -t train
```

### Paso 5: Uso de la plataforma y la plataforma de control

```bash
# System processes (better than top)
htop

# GPU processes (if you have NVIDIA GPU)
# Install: sudo apt install nvtop (Ubuntu) or brew install nvtop (macOS)
nvtop

# Quick GPU check without nvtop
nvidia-smi

# Watch GPU usage update every second
watch -n1 nvidia-smi

# See which processes are using the GPU
nvidia-smi --query-compute-apps=pid,name,used_memory --format=csv
```

Lo usarás hasta que`htop`las claves:
- `F6`O `>`按列排序(按 memoria 排序可查找 fuga de memoria)
- `F5`切换 vista de árbol(查看 procesos infantiles)
- `F9`Matar un proceso
- `/`搜索 nombre del proceso

### Paso 6: Usar SSH  Conectar GPU de distancia  Máquina

Cuando usted alquila con GPU en la nube (Lambda, RunPod, Vast.ai)

```bash
# Basic connection
ssh user@gpu-box-ip

# With a specific key
ssh -i ~/.ssh/my_gpu_key user@gpu-box-ip

# Copy files to remote
scp model.pt user@gpu-box-ip:~/models/

# Copy files from remote
scp user@gpu-box-ip:~/results/metrics.json ./

# Sync a whole directory (faster for many files)
rsync -avz ./data/ user@gpu-box-ip:~/data/

# Port forward (access remote Jupyter/TensorBoard locally)
ssh -L 8888:localhost:8888 user@gpu-box-ip
# Now open localhost:8888 in your browser

# SSH config for convenience
# Add to ~/.ssh/config:
# Host gpu
#     HostName 192.168.1.100
#     User ubuntu
#     IdentityFile ~/.ssh/gpu_key
#
# Then just:
# ssh gpu
```

### Paso 7: AI 工作 con alias habituales

Añadir esto a tu .`~/.bashrc`O `~/.zshrc`¿Qué es esto ?

```bash
source phases/00-setup-and-tooling/10-terminal-and-shell/code/shell_aliases.sh
```

O copiar lo que quieres.

```bash
# GPU status at a glance
alias gpu='nvidia-smi --query-gpu=index,name,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader'

# Kill all Python training processes
alias killtraining='pkill -f "python.*train"'

# Quick virtual environment activate
alias ae='source .venv/bin/activate'

# Watch training loss
alias watchloss='tail -f logs/*.log | grep --line-buffered "loss"'
```

完整集合见 `code/shell_aliases.sh`¿Qué es eso?

### Paso 8:  常见 AI patrones terminales

Estos en la práctica se repiten repetidamente:

```bash
# Run training, log everything, notify when done
python train.py 2>&1 | tee train.log; echo "DONE" | mail -s "Training complete" you@email.com

# Compare two experiment logs side by side
diff <(grep "accuracy" exp1.log) <(grep "accuracy" exp2.log)

# Find the largest model files (clean up disk space)
find . -name "*.pt" -o -name "*.safetensors" | xargs du -h | sort -rh | head -20

# Download a model from Hugging Face
wget https://huggingface.co/model/resolve/main/model.safetensors

# Untar a dataset
tar xzf dataset.tar.gz -C ./data/

# Count lines in all Python files (see how big your project is)
find . -name "*.py" | xargs wc -l | tail -1

# Check disk space (training data fills disks fast)
df -h
du -sh ./data/*

# Environment variable check before training
env | grep -i cuda
env | grep -i torch
```

## Usalo

En este curso, cada instrumento se utiliza en:

| 工具 | 使用时机 |
|------|----------------|
| tmux | 每次训练运行（Phases 3+） |
| `tail -f` + `grep` | 监控训练日志 |
| `nohup` / `&` | 快速后台任务 |
| `htop` / `nvtop` | 调试慢训练、OOM errors |
| SSH + `rsync` | 在 cloud GPUs 上工作 |
| Piping + redirects | 处理实验结果 |
| Aliases | 节省重复 commands 的时间 |

##  ejercicios

1. Instala tmux, crea una sesión que contiene tres paneles y ejecuta uno de ellos `htop`, otro operar `watch -n1 date`, tercero ejecutar un script Python... Descargar y luego volver a unir...
2. ¿ Qué ?`code/shell_aliases.sh`Los alias de la capa se añaden a la configuración de la cáscara, no se usan.`source ~/.zshrc`(o `~/.bashrc`) Recargar
3. ¿ Qué ?`for i in $(seq 1 100); do echo "epoch $i loss: $(echo "scale=4; 1/$i" | bc)"; sleep 0.1; done > fake_train.log`Crear un falso diario de entrenamiento, y luego usarlo.`grep`¿Qué es esto?`tail`Y `awk`Sólo se pueden obtener valores de pérdida.
4. Por lo que tienes el derecho de acceso al servidor  Configurar una entrada de configuración SSH(o usar `localhost`练习语法) ⋅

## 关键术语: "El hombre es un hombre"

| 术语 | 人们怎么说 | 实际含义 |
|------|----------------|----------------------|
| Shell | “The terminal” | 解释你的 commands 的程序（bash、zsh、fish） |
| tmux | “Terminal multiplexer” | 一个让你在一个窗口中运行多个 terminal sessions，并支持 detach/reattach 的程序 |
| Pipe | “The bar thing” | `\|` operator，会把一个 command 的 output 作为 input 发送给另一个 command |
| PID | “Process ID” | 分配给每个运行中 process 的唯一编号，用于监控或 kill 它 |
| nohup | “No hangup” | 运行一个不受 hangup signal 影响的 command，因此关闭 terminal 不会 kill 它 |
| SSH | “Connecting to the server” | Secure Shell，一种用于在远程机器上运行 commands 的加密 protocol |
