# Inferencia de borde  Apple Neural Engine, Qualcomm Hexagon, WebGPU/WebLLM, Jetson

> 核心边缘 约束是内存带宽,而不是计算──移动DRAM 位于 50-90 GB/s;数据中心 HBM3 超过 2-3 TB/s差距为 30-50x──Decode 受记忆绑定限制,因此这个差距是决定性的──到2026年,格局分成四类──Apple M4/A18 Neural Engine 在统一内存(没有CPUNPU版) 下峰值为 38 TOPS──Qualcomm Snapdragon X Elite / 8 Gen 4 Hexagon 达到 45 TOPS──WebGPU + WebM 在 M3 Max 运行 Llama 3.1 8BLL 运行 Llama 41 tok/s 运行 8BLL 运行) 的大约是7080%;6k17.OpenAI-AGG 运行在 AG70 的 AG70 的超级G 的G 的超级互动网址                                                                                                                                                    

**类型：**Aprende
**语言：**Python(stdlib, juguete de decodificación de ancho de banda 模拟器)
**前置要求：**Fase 17 · 04(vLLM Servicios internos)
**时间：**- 60 minutos

## El objetivo del aprendizaje

- Explicar por qué la inferencia de LLM móvil está limitada al ancho de banda de memoria, mientras que la computación es un factor secundario.
- 列举四个边缘目标(Apple ANE、Qualcomm Hexagon、WebGPU/WebLLM、NVIDIA Jetson),并将每个目标匹配到一个使用案例──
- Explicar la brecha de cobertura de WebGPU en 2026 y el fallo de Safari iOS 26 en Firefox Android está en proceso de actualización.
- Para cada objetivo  seleccionar un formato de cuantificación ANE Usando el Core ML INT4 + FP16, Hexágono Usando QNN INT8/INT4, navegador Usando WebGPU Q4, Jetson Thor Usando NVFP4)。

##  problemas

Un cliente quiere un chatbot en el dispositivo: voz-primero, privado por defecto, de baja velocidad. En el MacBook Pro M3 Max, Llama 3.1 8B Q4 con ~55 tok/s 运行可接受. En el iPhone 16 Pro, el mismo modelo con 3 tok/s 运行不可接受. En el Snapdragon 8 Gen 3 de Android, en el portón central, es 7 tok/s.

La diferencia de rendimiento no es el porting 问题──它是带宽差 乘以量化格式,再乘以 NPU 是否能从用户空间 访问──2026 年的边缘推理是四个不同的问题,需要四套不同的解决方案──

## 概念

### El ancho de banda es el límite máximo real

Decode 会为每个代币 读取完整的权重 集合──一个Q4的7B模型是3.5 GB──以50 GB/s 读取3.5 GB 需要70 ms理论上限约为 ~14 tok/s──在90 GB/s(高端手机DRAM) 下,上限移动到 ~25 tok/s──低于这个数字时,再多计算也没有帮助──

Datacenter HBM3 以 3 TB/s 读取同样 3.5 GB 需1.2 ms上限是830 tok/s──同样模型,同样重量──不同的内存子系统──

### El motor neuronal de Apple (M4 / A18)

- Máximo 38 TOPS──Memoria unificada(CPU y ANE 共享同一个池)没有 copias sobrecarga──
-  A través del Core ML + `.mlmodel`编译模型访问,或通过 PyTorch 经由 Metal Performance Shaders(MPS)访问。
- Llama.cpp Metal backend utiliza MPS, no directamente utiliza ANE; native ANE  necesita conversión de Core ML。
- 2026 años de aplicaciones para iOS: utilizar pesos INT4 + activaciones FP16 de ML Core.

### Qualcomm Hexagon (Snapdragon X Elite / 8 Gen 4)

- máximo 45 TOPS── integrado en el SoC, con CPU y GPU, pero con dominio de memoria independiente──
- QNN(Red Neural de Qualcomm) SDK y AI Hub 提供 desde PyTorch/ONNX de la conversión。
- Las plantillas de chat ✓ Llama 3.2 ✓ Phi-3 ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ 

### Intel / AMD NPUs ((Lunar Lake, Ryzen AI 300)

- 40-50 TOPS──El software está atrasado de Apple/Qualcomm; OpenVINO está en proceso de mejora, pero sigue en el nicho─
- Las aplicaciones de copiloto de Windows ARM son más adecuadas para uso local en los escritorios AMD/Intel.

### WebGPU + WebLLM

-                                                                                                                                                                                                                                                               
- En M3 Max 上, Llama 3.1 8B Q4 约为 ~41 tok/s通过同一后端,大约是原生的70-80%──
- WebLLM tiene 17.6k estrellas GitHub; OpenAI compatible API JS; Apache 2.0
- 2026 cobertura:Chrome Android v121+、Safari iOS 26 GA,Firefox Android 仍在追赶──总体约为 ~70-75% de cobertura móvil──

### NVIDIA La familia Jetson

- Orin Nano Super(8GB):可容纳 Llama 3.2 3B、Phi-3,并具有不错的 tok/s。
- AGX Orin: a través de VLLM 以 ~40 tok/s 运行 gpt-oss-20b。
- Thor / T4000(JetPack 7.1): rendimiento para AGX Orin de 2x, soporte EAGLE-3 y NVFP4。
- TensorRT Edge-LLM(2026) apoya la descifrado especulativo EAGLE-3 ∞ pesos NVFP4 ∞ preempleo en pedazos ∞ optimizaciones de centros de datos 已移植到边∞

### Cada objetivo de la cuantificación 选择

| Target | Format | Notes |
|--------|--------|-------|
| Apple ANE | INT4 weights + FP16 activations | Core ML conversion path |
| Qualcomm Hexagon | QNN INT8 / INT4 | AI Hub converters |
| WebGPU / WebLLM | Q4 MLC（q4f16_1） | 使用 `mlc_llm convert_weight` + 编译后的 `.wasm`；不支持 GGUF |
| Jetson Orin Nano | Q4 GGUF 或 TRT-LLM INT4 | Memory-bound |
| Jetson AGX / Thor | NVFP4 + FP8 KV | Edge-LLM path |

### Frente arriba de largo contexto

El contexto 128K de Llama 3.1 es el centro de datos 功能── en el móvil de 8 GB de RAM, el modelo de 4 GB + 32K de tokens de 2 GB de caché KV + OS overhead = OOM──En implementaciones Edge, el contexto se mantendrá en 4K-8K, a menos que se acepte la cuantización de KV activación(Q4 KV)──

### La voz es una aplicación asesina

Los agentes de voz a la latencia  sensibles (primero token < 500 ms)  Inferencia local (local inference) 会 eliminar completamente la latencia de la red (talk-to-text)  Con las variantes de Whisper Turbo (speech-to-text) 

### Debes recordar el número

- Apple M4 / A18 ANE:38 TOPS
- Qualcomm Hexagon SD X Elite: 45 horas y más.
- WebLLM M3 Max:Llama 3.1 8B Q4 上 ~41 tok/s
- AGX Orin: a través de VLLM en gpt-oss-20b 上 ~40 tok/s
- La brecha de ancho de banda del centro de datos es de 30-50x.
- Cobertura móvil de WebGPU: ~70-75%


```figure
edge-bandwidth-pipe
```

## Usalo

`code/main.py`Utiliza el límite de ancho de banda en matemáticas para calcular los límites de rendimiento de cada borde.

##  entregarlo

本课会生成                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          `outputs/skill-edge-target-picker.md` una plataforma determinada (iOS/Android/browser/Jetson)  un modelo, así como un presupuesto de latencia/memoria, que elegirá el formato de cuantificación y la conversión 

##  ejercicios

1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` Para el modelo Q4 7B de Snapdragon 8 Gen 3 ((~77 GB/s de ancho de banda), calcular el límite de descifrado。
2. Para Android, la WebGPU necesita Chrome v121+. Para los navegadores más antiguos, se diseña una fallback a través de la misma API compatible con OpenAI.
3. ¿Qué tipo de modelo/format puede mantener menos de 4 GB de memoria activa en el iPhone 16?
4. Jetson AGX Orin 以 40 tok/s 运行 gpt-oss-20b―Jetson Nano sólo puede coger 3B―Si tus productos al mismo tiempo enfrentan ambos, ¿cómo unificar la pila de inferencias?
5. 论证WebLLM en 2026 ¿está listo para la producción──引用 cobertura, rendimiento, así como Firefox Android gap──

## 关键术语: "El hombre es un hombre"

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

- [On-Device LLMs State of the Union 2026](https://v-chandra.github.io/on-device-llms/) 格局与基准──
- [NVIDIA Jetson Edge AI](https://developer.nvidia.com/blog/getting-started-with-edge-ai-on-nvidia-jetson-llms-vlms-and-foundation-models-for-robotics/) Orin / AGX / Thor。
- [NVIDIA TensorRT Edge-LLM](https://developer.nvidia.com/blog/accelerating-llm-and-vlm-inference-for-automotive-and-robotics-with-nvidia-tensorrt-edge-llm/) 2026 puerto de borde 公告。
- [WebLLM（arXiv:2412.15803）](https://arxiv.org/html/2412.15803v2) 设计与基准──
- [Apple Core ML](https://developer.apple.com/documentation/coreml) Conversión de origen en el país.
- [Qualcomm AI Hub](https://aihub.qualcomm.com/) 为 Hexagon 预先转换的模型──
