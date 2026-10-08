# Modelos de Língua de Áudio: do Whisper ao Audio Flamingo 3

> Whisper(Radford etc. (2022 ano 12 月) 让语音识别尘埃落定:68万小时弱监督多语言语音、一个简单的编码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码码

**类型：**Construir
**语言：**Python (stdlib, log-Mel espectrograma + áudio Q-ex-esqueleto)
**前置要求：**Fase 6 (Livro e Áudio), Fase 12 · 03 (Q-Former)
**时间：**Cerca de 180 minutos

## Objectivo de aprendizagem
- Desde a forma de onda  calcular o log-Mel espectrograma: janelas ∞ FFT ∞ filtros de bancos ∞ log transformar∞
- Compare encoder 选项:Whisper encoder、BEATs、AF-Whisper hybrid── compreender seus respectivos何时胜出──
- Construir áudio Q-former: fazer N 个可学习 consultas para patches de espectrograma fazer atendimento cruzado。
- 解释 cascaded(Whisper-then-LLM) vs end-to-end audio-LLM 训练:为什么 end-to-end 更适合扩展到推理能力──

## 问题
语音识别已被 Whisper 解决──音频的OCR 已商品化──但商品化止步于转写──如果模型无法推理它听到的内容:时间点、说话者、情绪、音乐结构、环境声音,那么仅靠转写无法支产品功能──

3⁄4 rotina evidente:

1. Cascade:Whisper 转写,LLM 对转录 推理――适用于纯语音场景――对音乐、环境音频、多说话人重叠、情绪会失败――

2. End-to-end audio-LLM:código de áudio vai fazer tokens de áudio 直接输入 LLM,跳过转写──保留声学信息(情绪、说话者、环境)── necessita de novos dados de treinamento──

3. Híbrido: codificador de áudio + decodificador de texto,既能转写也能推理──Qwen-Audio 和 Audio Flamingo 选择这条路线──

## 概念
### Espectograma de log-mail:输入特征

Cada codificador de áudio tem a mesma característica: log-mail espectrogramas.

1. Re-análise até 16 kHz.
2. Use a janela de 25ms ≈ 10ms hop fazer a transformação Fourier de curto prazo ≈
3. 取 FFT 结果的大小──
4.  aplicada Mel filtros bancos ((normalmente 80 个在 0-8000 Hz 上按日间隔分布的过器), mapeamento até感知频率──
5. Use log compress (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log))))) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log))))))))) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (log) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g) (g

Resultados: formação em 2D de uma matriz (T, 80) em que T é um tempo de quadros.

### Whisper's encoder

O encoder de Whisper é um Transformador de estilo ViT de 12 camadas, que irá log-Mel espectrograma como quadros de tempo 序列处理──输出: cada quadro de tempo 一个隐藏状态向量──

Para ASR, o decodificador do Whisper é um Transformador de atenção cruzada, que gerou tokens de texto em condições de saída do encoder.

对于ALMs(audio-LLMs),你希望把编码输出 作为输入交给另一个LLM──模式是:Códador de sussurros congelado, Q-ex-trainable,LLM congelado ou sintonizado──

### BEATs 和音频 codificadores especiais

O sussurro é treinado em dados de voz-proprietário.

BEATs(Chen 等,2022) é um Transformador auto-supervisionado treinado em AudioSet.

AF-Whisper(Audio Flamingo 3 的混合):将 Whisper + BEATs características concat 作为音频输入──Whisper 携带语言信号,BEATs 携带声学信号──

### Audio Q-former

Com o BLIP-2 visual Q-former 模式相同── um número fixo de consultas de aprendizagem(常见为 32 或 64) sobre os quadros de saída do codificador de áudio fazer-se cruzar-atender── estas consultas                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

訓練对齐阶段:只训练 Q-former,在音频文字对中 (AudioCaps、Clotho) 上使用对比性 +字幕损失──Instrução 阶段:end-to-end,defreeze LLM,在教学数据上训──

### É um filme de ficção científica.

SALMONN(Tang 等,2023):Susper + BEATs + Q-former + LLaMA。

Qwen-Audio(Chu 等,2023):架构类似,训练数据集更丰富,针对多轮对话 调优――MMAU 约0.60──

LTU  Ouça, Pense, Entenda ((Gong 等,2023): dados de raciocínio expresso, focado em clips de rádio  上的思想链――规模更小但更聚焦──

Audio Flamingo 3(Goel 等,2025 年 7 月):当前 open SOTA──8B LLM backbone(Qwen2 7B)、Whisper-big encoder concat BEATs、64-query Q-former, em 1000000+ pares de instrução de áudio-texto 上练──MMAU 0.72,在部分子任务 上匹配专属边界──

AF3 também introduziu a cadeia de pensamento on demand do rádio: modelo pode ser usado para produzir tokens de pensamento no final da resposta. Deixe-me identificar os instrumentos primeiro: ...)

### Cascada vs end-to-end

Tubos em cascata:

1. Whisper 将音频转写为文本.
2. Mestrado em Literatura.

                                                                                                                                                                                                                                                              
- Que humor é esta canção?
- Quem está falando, Alice ou Bob?
- Explosão ocorrida em segundos?
-  É verdade ou é um género de som? Detecção profunda de falsos  precisa de características sonoras

End-to-end 保留声学信号──Qwen-Audio 和 AF3 能原生处理音乐、环境和情绪──

### 2026 receita de produção

对于新音频理解产品:

- Cascada se: objetivo é transcrição, não há música, não há emoção.
- AF3 / Qwen-Audio-família se: música、情绪、多说话人,或复杂音频推理──

Cascada, mais fácil, mais simples, mais forte.

### MMAU:音频推理 referência

MMAU ((Massive Multimodal Audio Understanding) é um padrão de referência para 2024-2025 音频推理:

- 10.000 pares de QA de áudio-texto de trans-sesão, música, ambiente e som.
- 覆盖分類、temporal reasoning、causal reasoning、open-ended QA──
- 测试 canalizações em cascata 系统性遗漏的能力──

Open SOTA(AF3) é de 0,72; fronteira proprietária 约 0.78(Gemini 2.5 Pro、Claude Opus 4.7)。 esta diferença é menor do delta aberto versus fechado do VideoMME, indicação de áudio-LLMs está em plena maturidade。


```figure
audio-text-ctc
```

## Use-o
`code/main.py`- Não .

- Utilizando o sistema de dados de dados, o sistema de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados de dados
- Áudio Q-ex-esqueleto: given determined encoder output frames, calcula Q、K、V、attention,并输出 N 个 tokens──
- Em uma tarefa de brinquedo 上比较 cascata-vs-end-to-end.

## Entrega-o
本课会产出 `outputs/skill-audio-llm-pipeline-picker.md`△给定一个音频任务(transcrição, etiquetado musical, inferência de emoção, diário multi-falantes, classificação do ambiente), ele vai escolher cascada, AF3 de ponta a ponta ou híbrido―

## 练习
1. Para uma janela de 16 kHz 2,5ms 10ms saltar 80 Mel bins clip de 30 segundos, calcular log-Mel espectrograma dimensão... em 48 kHz

2. Por que o Whisper em música apresenta-se menos? BEATs  Captured Which Whisper  No Captured Audio Features?

3. 64 consultas vs 32 consultas de Áudio Q-former: em que tarefas complexidade?

4. 阅读AF3 Seção 4 关于关于在需求思考的内容──提出三个思想链 最有帮助的音频任务──

5. Utilize AF3 de saída para conseguir um mínimo diarização de pipeline.

## 关键术语
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
