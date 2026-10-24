# Docker para IA

> Los contenedores pueden correr en mi máquina y convertirse en el pasado.

**Type:** Build
**Languages:** Docker
**Prerequisites:** Phase 0, Lessons 01 and 03
**Time:** ~60 分钟

## Objetivos de aprendizaje

- Desde el archivo de Docker Construir la imagen de Docker de la GPU, que contiene CUDA、PyTorch y bibliotecas de IA
- Los directorios de host  como volúmenes montados, para que en los contenedores reconstruye  entre modelos de perpetuidad DATASETs y código
- Configurar NVIDIA Container Toolkit, hacer que los contenedores  interno puede acceder a las GPUs
- Utiliza Docker Compone 编排多服务 aplicaciones de IA(servidor de inferencia + base de datos vectorial)

##  problemas

Tu equipo usa PyTorch 2.1 ̊CUDA 12.4 y Python 3.12  entrenar un modelo― tus compañeros usan PyTorch 2.1 ̊CUDA 11.8 y Python 3.10― tu modelo se derrumba en sus máquinas― tu archivo de Docker está en ambos lados todo puede trabajar―

Los proyectos de IA son pesadillas de dependencia. Una pila típica incluye Python, PyTorch, drivers CUDA, cuDNN, bibliotecas C a nivel de sistema, así como paquetes especializados de versiones de compilador precisas como Flash-attn. Docker pondrá todo esto en una imagen y en cualquier lugar funcionará de la misma manera.

## 概念

Docker pondrá su código, tiempo de ejecución, bibliotecas y herramientas del sistema envueltas en una unidad aislada llamada contenedor. Puede considerarse una máquina virtual de pequeña escala, simplemente comparte el kernel del sistema operativo host, en lugar de ejecutar su propio kernel, por lo que solo se necesitan unos segundos para iniciar, en lugar de unos minutos.

```mermaid
graph TD
    subgraph without["Without Docker"]
        A1["Your machine<br/>Python 3.12<br/>CUDA 12.4<br/>PyTorch 2.3"] -->|crashes| X1["???"]
        A2["Their machine<br/>Python 3.10<br/>CUDA 11.8<br/>PyTorch 2.1"] -->|crashes| X2["???"]
        A3["Server<br/>Python 3.11<br/>CUDA 12.1<br/>PyTorch 2.2"] -->|crashes| X3["???"]
    end

    subgraph with_docker["With Docker — Same image everywhere"]
        B1["Your machine<br/>Python 3.12 | CUDA 12.4<br/>PyTorch 2.3 | Your code"]
        B2["Their machine<br/>Python 3.12 | CUDA 12.4<br/>PyTorch 2.3 | Your code"]
        B3["Server<br/>Python 3.12 | CUDA 12.4<br/>PyTorch 2.3 | Your code"]
    end
```

### ¿Por qué los proyectos de IA necesitan más Docker que la mayoría de los proyectos ?

1. **GPU drivers 很脆弱。**CUDA 12.4 código 不能在 CUDA 11.8 上运行──Docker 会隔离容器内的 CUDA toolkit, simultáneamente a través de NVIDIA Container Toolkit 共享主机GPU驱动器──

2. **Model weights 很大。**Un modelo de parámetro 7B en fp16 abajo tiene 14 GB. Usted no quiere volver a descargarlo en cada reconstrucción. Volúmenes de Docker le permiten montar un directorio de modelos de host.

3. **Multi-service architectures 很常见。**Una aplicación de IA real no es sólo un script Python. Es un servidor de inferencias para la base de datos vectorial de RAG, puede haber un frontend web.

### 关键词汇: "El lenguaje de la lengua"

| Term | What it means |
|------|---------------|
| Image | 只读 template。你的 recipe。由 Dockerfile 构建。 |
| Container | image 的运行实例。你的 kitchen。 |
| Dockerfile | 构建 image 的 instructions。逐层构建。 |
| Volume | 可在 container restarts 后保留的持久化 storage。 |
| docker-compose | 用 YAML 定义 multi-container applications 的工具。 |

### Modelos de contenedores de IA

```
Dev Container
  完整 toolkit。Editor support。Jupyter。Debugging tools。
  用于 development 和 experimentation。

Training Container
  最小化。只有 training script 和 dependencies。
  在 GPU clusters 上运行。没有 editor，没有 Jupyter。

Inference Container
  为 serving 优化。Small image。Fast cold start。
  在 production 中运行于 load balancer 后方。
```


```figure
s0-image-layers
```

## Construye el mismo

### Paso 1: Instalar el Docker

```bash
# macOS
brew install --cask docker
open /Applications/Docker.app

# Ubuntu
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
```

验证:

```bash
docker --version
docker run hello-world
```

### Paso 2: instalar NVIDIA Container Toolkit (con NVIDIA GPU de Linux)

Esto permite que los contenedores de Docker puedan acceder a su GPU. MacOS y Windows.

```bash
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

En el contenedor interno de acceso de GPU:

```bash
docker run --rm --gpus all nvidia/cuda:12.4.1-base-ubuntu22.04 nvidia-smi
```

Si ves información de la GPU, explica el kit de herramientas.

### Paso 3: Comprender las imágenes de base

选择正确的基像可以节省几个小时调试时间──

```
nvidia/cuda:12.4.1-devel-ubuntu22.04
  完整 CUDA toolkit。包含 compilers。
  Use for: 构建需要 nvcc 的 packages（flash-attn、bitsandbytes）
  Size: ~4 GB

nvidia/cuda:12.4.1-runtime-ubuntu22.04
  仅 CUDA runtime。没有 compilers。
  Use for: 运行 pre-built code
  Size: ~1.5 GB

pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime
  基于 CUDA 预装 PyTorch。
  Use for: 跳过 PyTorch install step
  Size: ~6 GB

python:3.12-slim
  没有 CUDA。仅 CPU。
  Use for: CPU inference、lightweight tools
  Size: ~150 MB
```

### Paso 4: para el desarrollo de IA 编写 Dockerfile

Es el .`code/Dockerfile`En el centro de Dockerfile.

```dockerfile
FROM --platform=linux/amd64 nvidia/cuda:12.4.1-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    software-properties-common \
    git \
    curl \
    build-essential \
    && add-apt-repository -y ppa:deadsnakes/ppa \
    && apt-get update && apt-get install -y --no-install-recommends \
    python3.12 \
    python3.12-venv \
    python3.12-dev \
    && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.12 1

RUN curl -sSL https://raw.githubusercontent.com/pypa/get-pip/3b73145063be545b649ad9ca83ea8da5fc915a4f/public/get-pip.py -o /tmp/get-pip.py \
    && echo "a341e1a43e38001c551a1508a73ff23636a11970b61d901d9a1cad2a18f57055  /tmp/get-pip.py" | sha256sum -c - \
    && python /tmp/get-pip.py \
    && rm /tmp/get-pip.py \
    && update-alternatives --install /usr/bin/pip pip /usr/local/bin/pip3.12 1

RUN python -m pip install --no-cache-dir --upgrade pip setuptools wheel

RUN python -m pip install --no-cache-dir \
    torch==2.6.0+cu124 \
    torchvision==0.21.0+cu124 \
    torchaudio==2.6.0+cu124 \
    --index-url https://download.pytorch.org/whl/cu124

RUN python -m pip install --no-cache-dir \
    numpy \
    pandas \
    scikit-learn \
    matplotlib \
    jupyter \
    transformers \
    datasets \
    accelerate \
    safetensors

WORKDIR /workspace

VOLUME ["/workspace", "/models"]

EXPOSE 8888

CMD ["python"]
```

Construirlo:

```bash
docker build -t ai-dev -f phases/00-setup-and-tooling/07-docker-for-ai/code/Dockerfile .
```

La primera vez que me llevan algunos días, descargo de CUDA base imagen + PyTorch)

**macOS / Apple Silicon（M1/M2/M3/M4）：** `FROM`En el camino`--platform=linux/amd64`Esta es la razón por la que la construcción puede tener éxito en Mac. CUDA base imagen también ofrece arm64 变体, Docker Desktop en Apple Silicon arriba se seleccionará automáticamente, pero PyTorch sólo para x86_64 发布`cu124`Las ruedas, por lo tanto `pip install torch==2.6.0+cu124`Esta capa va a fallar, el periódico.`No matching distribution found for torch==2.6.0+cu124`△ plataforma fija 会拉取 x86_64 image 并在模拟下运行:construir más lento, contenedor también sin GPU(Mac 上本来就没有 CUDA) ⋅ en Mac 上,请从下面的 `docker run`- ¡ ¡ No ! - ¡ No !`--gpus all` Para hacer GPU en Apple Silicon, por favor, con el MPS de la Lección 01 construye el curso de funcionamiento original, deje esta imagen que lleve a la GPU de NVIDIA x86_64 Linux 主机──

¿Qué es eso ?

```bash
docker run --rm -it --gpus all \
    -v $(pwd):/workspace \
    -v ~/models:/models \
    ai-dev python -c "import torch; print(f'PyTorch {torch.__version__}, CUDA: {torch.cuda.is_available()}')"
```

En el contenedor en el que se ejecuta el Jupyter:

```bash
docker run --rm -it --gpus all \
    -v $(pwd):/workspace \
    -v ~/models:/models \
    -p 8888:8888 \
    ai-dev jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root
```

### Paso 5: para el uso de datos y modelos de montajes de volumen

El volumen aumenta para la IA 工作至关重要──没有它们, tus descargas de modelos de 14 GB se van a parar después de desaparecer──

```bash
# Mount your code
-v $(pwd):/workspace

# Mount a shared models directory
-v ~/models:/models

# Mount datasets
-v ~/datasets:/data
```

En tu guión de entrenamiento, desde el camino montado

```python
from transformers import AutoModel

model = AutoModel.from_pretrained("/models/llama-7b")
```

modelo  está en su sistema de archivos host 上。 puedes reconstruir el contenedor de forma dispuesta, sin necesidad de volver a descargar。

### Paso 6: Compone Docker para aplicaciones de IA de múltiples servicios

Una aplicación RAG real  necesita servidor de inferencia 和 vector de base de datos──Docker Compose Utilize a una条命令运行两者──

¿ Qué ?`code/docker-compose.yml`¿Qué es esto ?

```yaml
services:
  ai-dev:
    build:
      context: .
      dockerfile: Dockerfile
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    volumes:
      - ../../../:/workspace
      - ~/models:/models
      - ~/datasets:/data
    ports:
      - "8888:8888"
    stdin_open: true
    tty: true
    command: jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root

  qdrant:
    image: qdrant/qdrant:v1.12.5
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  qdrant_data:
```

启动所有服务:

```bash
cd phases/00-setup-and-tooling/07-docker-for-ai/code
docker compose up -d
```

Ahora tu contenedor de desarrollo de IA puede pasar por el nombre de servicio en`http://qdrant:6333`访问 vector database──Docker Compose 会自动创建共享网络──

Desde el contenedor de IA 内测试连接:

```python
from qdrant_client import QdrantClient

client = QdrantClient(host="qdrant", port=6333)
print(client.get_collections())
```

停止所有服务:

```bash
docker compose down
```

Además`-v`También eliminará el volumen:

```bash
docker compose down -v
```

### Paso 7: comandos de Docker en uso real en AI 工作中

```bash
# List running containers
docker ps

# List all images and their sizes
docker images

# Remove unused images (reclaim disk space)
docker system prune -a

# Check GPU usage inside a running container
docker exec -it <container_id> nvidia-smi

# Copy a file from container to host
docker cp <container_id>:/workspace/results.csv ./results.csv

# View container logs
docker logs -f <container_id>
```

## Usalo

Ahora tienes un entorno de desarrollo de IA replicable.

- Uso `docker compose up`Al mismo tiempo, iniciar su entorno de desarrollo y base de datos vectorial
- Codificar modelos y datos como volúmenes montados, asegurarse de que no pierda nada entre las reconstrucciones
- Cuando una lección necesita un nuevo paquete Python, añade a un archivo de Docker y reconstruye
- Compartir tu archivo de Docker con los compañeros de equipo. Ellos tendrán el mismo entorno.

### ¿No tiene GPU?

移除                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `--gpus all`bandera y NVIDIA deploy block──contenedor  todavía se aplica para las lecciones basadas en CPU──PyTorch 会自动检测没有 CUDA,并倒退到CPU──

##  ejercicios

1. Construir un archivo de archivo, y en el contenedor 内运行 `python -c "import torch; print(torch.__version__)"`
2. Initiar la pila de docker-compuesto,并验证可从AI contenedor 访问 `http://qdrant:6333/collections`El Qdrant de arriba
3. ¿ Qué ?`flask`添加到Dockerfile,rebuild, y en el puerto 5000 上运行一个简单API server──使用 `-p 5000:5000`mapa 端口
4. Uso `docker images`测量 imagen size──尝试把 base de imagen de `devel`切换到 `runtime`,并比较大小

### 提示

**练习 1。**En el curso.`docker build -t ai-dev -f phases/00-setup-and-tooling/07-docker-for-ai/code/Dockerfile .`命令构建,再通过 `docker run --rm ai-dev`En el recipiente ejecutar la entrada de control. En el Mac, según el manual de instrucción.`--gpus all` El recipiente debe ser impreso`2.6.0`开头的版本号──

**练习 2。**En el`code/`文件中运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `docker compose up -d`, reutilizar`docker compose exec ai-dev bash`En el`ai-dev`服务中打开 shell──在其中运行 `curl http://qdrant:6333/collections`; Retorno JSON 就说明服务名能在 网络内解析

**练习 3。**En el archivo de Docker`RUN pip install flask`, reconstruir,并使用 `host="0.0.0.0"`Activa el servidor, ya que el servidor del localhost sólo está ligado dentro del contenedor no puede acceder desde fuera del contenedor ∙`http://localhost:5000`, confirmación de la terminal de la aplicación de datos

**练习 4。**运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `docker images ai-dev`, registros de tamaño 列──将 `FROM`En el`devel`改为     cambió por`runtime`, usando una nueva etiqueta construir, volver a comparar dos imágenes de tamaño; tiempo de ejecución 镜像不包含编译器和头文件──

## 关键术语: "El hombre es un hombre"

| Term | What people say | What it actually means |
|------|----------------|----------------------|
| Container | “Lightweight VM” | 使用 host kernel 的隔离进程，拥有自己的 filesystem 和 network |
| Image layer | “Cached step” | 每条 Dockerfile instruction 都会创建一个 layer。未变化的 layers 会被 cached，因此 rebuilds 很快。 |
| NVIDIA Container Toolkit | “GPU in Docker” | 一个 runtime hook，通过 `--gpus` flag 将 host GPUs 暴露给 containers |
| Volume mount | “Shared folder” | host 上映射进 container 的目录。container 停止后 changes 仍会保留。 |
| Base image | “Starting point” | 你的 Dockerfile 基于其构建的 `FROM` image。它决定了预装内容。 |
