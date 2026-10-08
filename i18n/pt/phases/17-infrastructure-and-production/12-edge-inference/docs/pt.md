# Inferência de bordo  Apple Neural Engine, Qualcomm Hexagon, WebGPU/WebLLM, Jetson

> O limite central 约束是存储带宽,而不是计算──Mobile DRAM 位于 50-90 GB/s;datacenter HBM3 超过 2-3 TB/s差距为 30-50x──Decode 受记载限制,因此这个差距是决定性的──到2026年,格局分成四类──Apple M4/A18 Neural Engine 在统一存储中((无CPUNPU版) 下峰值为38 TOPS──Qualcomm Snapdragon X Elite / 8 Gen 4 Hexagon 达到45 TOPS──WebGPU + WebM 在 M3 Max 运行 Llama 3.1 8BLL 运行 Llama 41 tok/s 运行 8B4) 的大约是7080%;6k17.OpenAI-AGG 运行 AG-75% 通过GPS──NVIDO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO NVO  NVO N N  N  N  N    N                                                                        

**类型：**Aprenda
**语言：**Python(stdlib, brinquedo de banda larga-limitado decodificação 模拟器)
**前置要求：**Fase 17 · 04(vLLM Serviços Internos)
**时间：**- 60 minutos.

## Objectivo de aprendizagem

- Explicação de por que a inferência de LLM móvel é limitada à largura de banda de memória, enquanto a computação é o segundo fator.
- 列举四个边缘目标(Apple ANE、Qualcomm Hexagon、WebGPU/WebLLM、NVIDIA Jetson),并将每个目标匹配到一个使用案例──
- Explicar a lacuna de cobertura do WebGPU em 2026 (Firefox Android está em processo de recuperação) e a situação do Safari iOS 26:
- Para cada alvo  escolher um formato de quantização ((ANE Usando Core ML INT4 + FP16, Hexágono Usando QNN INT8/INT4, navegador Usando WebGPU Q4, Jetson Thor Usando NVFP4)。

## 问题

Um cliente quer um chatbot no dispositivo: voz-primeira, privada por padrão, offline. É aceitável no MacBook Pro M3 Max, Llama 3.1 8B Q4 com ~55 tok/s 运行可接受. No iPhone 16 Pro, o mesmo modelo com 3 tok/s 运行不可接受.

A diferença de throughput não é o porting. É uma diferença de largura de banda.

## 概念

### O largura de banda é o limite máximo real .

Decode 会为每个代币 读取完整的权重 集合──一个Q4 的 7B模型是3.5 GB──以50 GB/s 读取3.5 GB 需要70 ms理论上限约为 ~14 tok/s──在90 GB/s(高端移动DRAM) 下,上限移动到 ~25 tok/s──低于这个数字时,再多计算也没有帮助──

Datacenter HBM3 以 3 TB/s 读取同样 3.5 GB 需1.2 ms上限是830 tok/s──同样模型,同样重量──不同的内存子系统──

### Apple Neural Engine (M4 / A18)

- Máquina de memória única (CPU e ANE)
-  através do Core ML + `.mlmodel`编译模型访问,或通过 PyTorch 经由 Metal Performance Shaders(MPS)访问。
- Llama.cpp Metal backend utiliza MPS, não usa diretamente ANE; native ANE  necessita de conversão Core ML。
- 2026 anos de aplicativos iOS: usar pesos INT4 + FP16 ativasões de Core ML。

### Qualcomm Hexagon ((Snapdragon X Elite / 8 Gen 4)

- O máximo de 45 TOPS── integrados no SoC, com CPU e GPU, mas com domínio de memória independente──
- QNN(Qualcomm Neural Network)SDK 和 AI Hub 提供从PyTorch/ONNX的转换──
- Modelos de chat ✓ Lama 3.2 ✓ Phi-3 ✓ Como artefatos de igual qualidade em AI Hub ✓

### Intel / AMD NPUs ((Lunar Lake, Ryzen AI 300)

- 40-50 TOPS──O software está atrasado da Apple/Qualcomm; OpenVINO está em fase de melhoria, mas ainda está no nicho──
- O Windows ARM é mais adequado para aplicativos de copiloto; em computadores de trabalho AMD/Intel é usado em primeiro lugar em local.

### WebGPU + WebLLM

- 通過WebGPU computing shaders 在浏览器中运行模型;无需安装──
- Em M3 Max 上, Llama 3.1 8B Q4 约为 ~41 tok/s通过同一后端,大约是原生的70-80%──
- WebLLM tem 17,6k estrelas GitHub; OpenAI-compatível JS API; Apache 2.0。
- 2026 cobertura:Chrome Android v121+、Safari iOS 26 GA,Firefox Android 仍在追赶──总体约为 ~70-75% de cobertura móvel──

### NVIDIA Família Jetson

- Orin Nano Super(8GB): 可容纳 Llama 3.2 3B、Phi-3,并具有不错的 tok/s。
- AGX Orin: através do VLLM 以 ~40 tok/s 运行 gpt-oss-20b。
- Thor / T4000(JetPack 7.1): desempenho para AGX Orin 2x, suporte EAGLE-3 e NVFP4。
- TensorRT Edge-LLM(2026) apoia a decodificação especulativa EAGLE-3 ∞ pesos NVFP4 ∞ pre-reempimento em pedaços ∞ otimização do datacenter 已移植到边∞

### Cada alvo de quantização 选择

| Target | Format | Notes |
|--------|--------|-------|
| Apple ANE | INT4 weights + FP16 activations | Core ML conversion path |
| Qualcomm Hexagon | QNN INT8 / INT4 | AI Hub converters |
| WebGPU / WebLLM | Q4 MLC（q4f16_1） | 使用 `mlc_llm convert_weight` + 编译后的 `.wasm`；不支持 GGUF |
| Jetson Orin Nano | Q4 GGUF 或 TRT-LLM INT4 | Memory-bound |
| Jetson AGX / Thor | NVFP4 + FP8 KV | Edge-LLM path |

### Edge 上的长文 陷

O contexto 128K do Llama 3.1 é o centro de dados 功能── em 8 GB de RAM em dispositivos móveis, 4 GB de modelo + 32K de tokens 2 GB de cache KV + OS overhead = OOM── em implementações Edge  会把 контекст 保持在 4K-8K, excepto para aceitar a quantização KV de forma activa (Q4 KV) ─

### Voice é um aplicativo assassino

Agentes de voz para a latência  Sensibilidade  Primeiro token < 500 ms)  Inferência local 会 eliminar completamente a latência da rede Com variantes de fala-texto  Whisper Turbo 可在边上运行) 结结后,边线 inferência 就成为生产质量语音循环

### Você deve lembrar-se de números

- Apple M4 / A18 ANE:38 TOPS
- Qualcomm Hexagon SD X Elite:45 TOPS
- WebLLM M3 Max:Llama 3.1 8B Q4 上 ~41 tok/s。
- AGX Orin: através do VLLM em gpt-oss-20b 上 ~40 tok/s
- O espaço de largura de banda do datacenter é de 30-50x.
- Cobertura móvel da WebGPU: ~ 70-75%


```figure
edge-bandwidth-pipe
```

## Use-o

`code/main.py`Utilize banda-limitada matemática calcular os limites de transmissão de decodificação de cada limite.

## Entrega-o

本课会生成 `outputs/skill-edge-target-picker.md` uma plataforma determinada (iOS/Android/browser/Jetson)  modelo, bem como orçamento de latência/memória, ele vai escolher formato de quantização e pipeline de conversão

## 练习

1. 运行 `code/main.py` Para o modelo Q4 7B do Snapdragon 8 Gen 3 ((~77 GB/s largura de banda) calcula o teto de decodificação.
2. Para Android, a WebGPU precisa de Chrome v121+. Para os navegadores mais antigos, o design de um fallback é feito através da mesma API compatível com o OpenAI.
3. Seu aplicativo iOS precisa de 4K conteúdo de streaming. Qual modelo / formato pode fazer você manter menos de 4 GB de memória ativa no iPhone 16?
4. Jetson AGX Orin 以 40 tok/s 运行 gpt-oss-20b。 Jetson Nano apenas pode acomodar 3B。 Se seus produtos simultaneamente face a ambos, como unificar a pilha de inferência?
5. 论证WebLLM será pronto para produção em 2026 ──引用 覆盖,性能,以及 Firefox Android gap──

## 关键术语

| Term | What people say | What it actually means |
|------|----------------|------------------------|
| ANE | "Apple neural engine" | M-series 和 A-series 中的 on-device NPU；unified memory |
| Hexagon | "Qualcomm NPU" | Snapdragon NPU；用于访问的 QNN SDK |
| WebGPU | "browser GPU" | W3C-standardized browser GPU API；Chrome/Safari 2026 |
| WebLLM | "browser LLM runtime" | MLC-LLM project；Apache 2.0；OpenAI-compatible JS |
| Jetson | "NVIDIA edge" | Orin Nano / AGX / Thor / T4000 family |
| TRT Edge-LLM | "edge TensorRT" | TensorRT-LLM 的 2026 edge port；EAGLE-3 + NVFP4 |
| Unified memory | "shared pool" | CPU 和 NPU 看到同一块 RAM；没有 copy overhead |
| Bandwidth-bound | "memory limited" | Decode 受读取 weights 的 bytes/sec 限制 |
| Core ML | "Apple conversion" | 用于 ANE-native models 的 Apple framework |
| QNN | "Qualcomm stack" | Qualcomm Neural Network SDK |

## 延伸阅读

- [On-Device LLMs State of the Union 2026](https://v-chandra.github.io/on-device-llms/) 格局与基准――
- [NVIDIA Jetson Edge AI](https://developer.nvidia.com/blog/getting-started-with-edge-ai-on-nvidia-jetson-llms-vlms-and-foundation-models-for-robotics/) Orin / AGX / Thor。
- [NVIDIA TensorRT Edge-LLM](https://developer.nvidia.com/blog/accelerating-llm-and-vlm-inference-for-automotive-and-robotics-with-nvidia-tensorrt-edge-llm/)2026 Port Edge 公告──
- [WebLLM（arXiv:2412.15803）](https://arxiv.org/html/2412.15803v2) 设计与基准──
- [Apple Core ML](https://developer.apple.com/documentation/coreml) Conversion nativa 
- [Qualcomm AI Hub](https://aihub.qualcomm.com/) 为六角 预先转换的模型──
