# Modelos de Audio-Lenguaje: desde el susurro hasta el desarrollo de Audio Flamingo 3

> Whisper(Radford etc. (2022 12 月) 让语音识别尘埃落定:68万小时弱监督多语言语音、一个简单的编码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码

**类型：**Construir
**语言：**Python (stdlib, log-Mel espectrograma + audio Q-ex esqueleto)
**前置要求：**Fase 6 (Horo y audio), Fase 12 · 03 (Q-Former)
**时间：** 180 minutos

## El objetivo del aprendizaje
- Desde la forma de onda  calcular el log-Mel espectrograma: ventanas ∞FFT ∞filtrados ∞transformación de registro ∞
- Compare el codificador 选项:Codificador de susurros, BEATs, AF-Híbrido de susurros, comprender sus respectivos
- Construir audio Q-former: hacer N 个可学习 consultas para parches de espectrograma hacer interconexión。
- 解释 cascada(Whisper-then-LLM) vs final a final audio-LLM 训练:为什么 final a final 更适合扩展到推理能力──

##  problemas
语音识别 ya ha sido resuelto  Whisper 解决──音频的 OCR 已商品化──但商品化止步于转写──如果模型无法推理它听到的内容:时间点、说话者、情绪、音乐结构、环境声音,那么, sólo gracias a la转写无法支产品功能──

Tres líneas claras:

1. Cascada:Susurrido 转写,LLM para la transcripción 推理。 se aplica para la escena de la lengua pura。 para la música、 el ambiente 音频、多说话人重叠、情绪会失败。

2. Audio-LLM: codificador de audio de extremo a extremo, para que pueda ingresar directamente a LLM, saltar a la traducción.

3. Hybrid: codificador de audio + decodificador de texto,既能转写也能推理──Qwen-Audio 和 Audio Flamingo 选择这条路线──

## 概念
### Espectograma de registro-Mel:输入特征

Cada codificador de audio tiene la misma característica: el espectrograma de log-mail.

1. Reparación hasta 16 kHz.
2. Utiliza ventanas de 25 ms, salta 10 ms, realiza la transformación de Fourier de corto tiempo.
3. 取 FFT 结果的 magnitud──
4. 应用 Mel filtros bancos(generalmente son 80 个在 0-8000 Hz 上按日间隔分布的过器), se mapean hasta la frecuencia de percepción。
5. Usar compresión de registro de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos de datos

结果:形状为 (T, 80) de una matriz 2D, entre las cuales T es un marco de tiempo 数量──对 100 Hz frame rate 的 30 秒 clip:形状为 (3000, 80)──

### El código de susurros

El codificador de Whisper es un Transformador de estilo ViT de 12 capas, que se convertirá en un espectrograma de log-Mel como marcos de tiempo 序列处理──输出: cada marco de tiempo ‧Un vector de estado oculto──

对于ASR,Whisper 的解码器是一个跨重视变压器,它在编码输出条件下生成文本代币――标准编码器-解码器――

对于ALMs(audio-LLMs), tú quieres poner la salida del codificador 作为输入交给另一个LLM──模式是:

### Los codificadores de BEATs y de audio

El susurro se entrena en datos de voz en voz.

BEATs(Chen 等,2022) es un Transformer auto supervisado entrenado en AudioSet.

AF-Whisper(Audio Flamingo 3 的混合):将 Whisper + BEATs características concat 作为音频输入──Whisper 携带语言信号,BEATs 携带声学信号──

### Audio Q-former

Las consultas de aprendizaje fijas se hacen en los marcos de salida del codificador de audio, con frecuencia 32 o 64.

训练对齐阶段:只训练 Q-former,在音频文字对中 (AudioCaps、Clotho) 上使用对比性 +字幕损失──Instrucción 阶段:end-to-end,unfreeze LLM,在教学数据上训练──

### Esta es la historia de los que se han perdido.

SALMONN(Tang 等,2023):Susurro + BEATs + Q-former + LLaMA。

Qwen-Audio(Chu 等,2023):架构类似,训练数据集更丰富, dirigido a diálogo multicurso 调优――MMAU 约 0.60──

LTU  Escucha, piensa, entiende(Gong 等,2023): datos de razonamiento evidente, enfocado en el vídeo de audio  上的链接思想――规模更小但更聚焦──

Audio Flamingo 3(Goel 等,2025 年 7 月):当前 open SOTA──8B LLM backbone(Qwen2 7B)、Whisper-large encoder concat BEATs、64-query Q-former, en 100 000+ pares de instrucciones de audio-texto 上练──MMAU 0.72, en algunas subtareas 上匹配专利边界──

AF3 también introdujo la cadena de pensamiento a pedido de la frecuencia: modelo puede en el final respuesta pre-可选地输出思维代币让我先识别仪器: ...) ──启动思维后,复杂推理任务的准确率提升 3-5 个点──

### Cascada vs extremo a extremo

El gasoducto en cascada:

1. Susurrar 将音频转写为文本──
2. El LLM en la filosofía del texto

                                                                                                                                                                                                                                                              
- ¿Qué estómago tiene esta canción?
- ¿Quién está hablando, Alice es Bob?
- ¿La explosión ocurrió en los segundos?
- ¿Es verdadero o es generado?

De extremo a extremo 保留声学信号──Qwen-Audio 和 AF3 能原生处理音乐、环境和情绪──

### Recepta de producción 2026

对于新音频理解产品:

- Cascada si: objetivo es traducir, no hay música, no hay sentimiento de conclusión.
- AF3 / Qwen-Audio-family si: música、情绪、多说话人,或复杂音频推理──

Cascada, más fácil, más simple, más fuerte.

### MMAU:音频推理 referencia

MMAU(Masivo entendimiento multimodal de audio) es el punto de referencia de 2024-2025 音频推理:

- 10.000 个跨语音、音乐、环境声音的音频-text QA pares.
- 覆盖分类、temporal razonamiento、causal razonamiento、open-ended QA──
- 测试 tuberías en cascada 系统性遗漏 capacidad。

Open SOTA(AF3) por 0,72; frontera de propiedad 约 0.78(Gemini 2.5 Pro、Claude Opus 4.7)。 esta diferencia es menor que el delta abierto versus cerrado de VideoMME, que indica que los audio-LLMs están en madurez。


```figure
audio-text-ctc
```

## Usalo
`code/main.py`¿Qué es esto ?

- Usdlib 实现 log-Mel espectrogram 计算:windowing、naive DFT、Mel filter-bank。
- Audio Q-ex esqueleto:给定 codificador de marcos de salida, calcular Q、K、V、atención,并输出 N 个 tokens。
- En una tarea de juguete 上比较 cascada-vs-end-to-end

##  entregarlo
本课会产出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         `outputs/skill-audio-llm-pipeline-picker.md`△给定一个音频任务(transcripción, etiquetado musical, inferencia de emoción, diarización de múltiples altavoces, clasificación del entorno), que se optará por cascada, AF3 de extremo a extremo o híbrido―

##  ejercicios
1.  Para una ventana de 16 kHz  25 ms  10 ms saltar  80 Mel bins de 30 segundos clip, calcular el log-Mel espectrograma  dimensión  en 48 kHz  ¿Cómo cambiará?

2. ¿Por qué el susurro en la música es menos eficaz? ¿Qué son las características de susurro que no captan?

3. 64 preguntas vs 32 preguntas de Audio Q-former: en qué tarea de complejidad bajo 64 valor?32 ¿Para qué tareas ahorrar computación?

4. 阅读AF3 Sección 4 关于关于在需求思考的内容──提出三个 cadena de pensamiento 最有帮助的音频任务──

5. Utiliza AF3 para lograr una menor diarialización. ¿Cómo marcar el cambio de habla?

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Log-Mel spectrogram | “Mel features” | 经过 Mel filter banks 后得到的 log-magnitude values 的 2D（time, frequency）array |
| Audio Q-former | “Audio Perceiver” | 从 audio encoder output 到 fixed-length queries 的 cross-attention bottleneck，供给 LLM |
| Cascaded | “ASR-then-LLM” | Whisper 转写后由 text LLM 推理的 pipeline；会丢失声学信息 |
| End-to-end | “Audio-LLM” | 音频特征通过 Q-former 直接进入 LLM；保留声学信号 |
| BEATs | “Audio AudioSet encoder” | 在 AudioSet 上训练的 SSL Transformer；擅长音乐 + 环境声音 |
| MMAU | “Audio reasoning bench” | 跨语音、音乐、环境的 10k QA pairs；2024 eval standard |
| On-demand thinking | “Audio CoT” | 模型可以在最终答案前可选地输出 reasoning tokens，将准确率提升 3-5 pts |

## 延伸阅读
- [Radford et al. — Whisper (arXiv:2212.04356)](https://arxiv.org/abs/2212.04356)
- [Chu et al. — Qwen-Audio (arXiv:2311.07919)](https://arxiv.org/abs/2311.07919)
- [Goel et al. — Audio Flamingo 3 (arXiv:2507.08128)](https://arxiv.org/abs/2507.08128)
- [Tang et al. — SALMONN (arXiv:2310.13289)](https://arxiv.org/abs/2310.13289)
- [Gong et al. — LTU (arXiv:2305.10790)](https://arxiv.org/abs/2305.10790)
