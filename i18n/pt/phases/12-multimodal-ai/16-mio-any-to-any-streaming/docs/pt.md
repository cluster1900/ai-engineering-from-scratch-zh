# MIO e Modelos Multimodal de Streaming Qualquer Um

> GPT-4o  entregou uma maioria dos modelos abertos  incapazes de repetir produtos: um capaz de ouvir o som  ver o vídeo  abrir a resposta  agente. Até o final de 2024, a resposta do ecossistema aberto é MIO  Wang et al., setembro 2024)  MIO Tokenize 文本、图像、语音和音乐, train on交错序列  um transformador causal,并能从任意方式 生成任意方式.

**Type:** Learn
**Languages:** Python (stdlib, four-modality token allocator + streaming decode loop)
**Prerequisites:** Phase 12 · 11 (Chameleon), Phase 6 (Speech and Audio)
**Time:** ~120 minutes

## Objectivo de aprendizagem
- Designar um vocabulário compartilhado, usado para acomodar textos, imagens, idiomas e música Token, e não ocorrer conflitos.
- Desde compressão + 重建取舍角度 comparar SEED-Tokenizer (图像) e SpeechTokenizer residual-VQ (语音) ⋅
- 解释构建任何生成能力的四阶段课程――
- Diz-se três receitas abertas a qualquer pessoa e suas principais receitas:

## 问题
Um modelo multimodal unificado  fácil de afirmar, mas muito difícil de dimensionar a construção. Até 2024, a maioria dos sistemas "de qualquer a qualquer" são de pipeline: :vision model → 文本表示 → speech model → 音频──

工程挑战:

- Cada modalidade tem de ter um Tokenizer, compressão para ser suficientemente próximo de nenhum dano para reconstruir, e a taxa de consumo do transformador para gerar Token.
- 单一词库 必须为文本(32k+) 图像(16k+) 语音(4k+) 音乐(8k+) Distribuir espaço──最低也需要四万多条目──
- 训练数据必须覆盖每个输出输入对 (text→image、image→speech、speech→image等),或者模型必须能够组合──
- Inferência 必須足足足足快地流出 Token,以满足对话延迟 ((<500ms time-to-first-audio-byte) ⋅

## 概念
### Quatro tipos de Tokenizer

MIO de Tokenizer pilha:

- Texto: Standard BPE, vocab ~32000。
- Imagem:SEED-Tokenizer (2023)  带离散代码簿 的量化VAE,4096 条目,每张图像 32x32 个 Token──
- Discurso:SpeechTokenizer residual-VQ (2023)  将 16kHz waveform 编码为 8 层级代码书;第一层是粗粒度内容,后续层加入 prosody 和扬声器身份──
- Música: similar similar similar residual-VQ(Meta's MusicGen / Encodec família),4-8 个代码册──

Cada modalidade produz um número total de Tokens. Estes Tokens são utilizados em um vocabulário compartilhado para obter uma série de identidades diferentes:

```
text:   0..31999
image:  32000..36095  (4096 image tokens)
speech: 36096..40191  (4096 speech base tokens, plus residual layers)
music:  40192..48383  (8192 music tokens)
sep:    48384..48390  (<image>, <speech>, <music>, </...>, etc.)
```

总计: cerca de 48k vocabulário──input Embedding 和 output projeção 覆盖全部条目──

### Descódigo de streaming

语音生成使用残留-VQ──Transformer 预测 base(Layer 0) Token de fala; um quantificador residual decodificado paralelo 预测后续层── cada camada 0 Token 大约对应 16kHz 音频中的 50ms──

Streaming 模式:

1. Usuário em tempo real Tokenizer de áudio cada 50ms  emitir discurso Token。
2. MIO 在 Token 到达时消费它们(pre-fill imediato + incremental forward)
3. Token de saída 随生成流式输出; decodificador de fala paralelo 以约50-150ms 延迟将其转换为音频样本──
4. Tempo-a-primeira-áudio-byte: MIO papel de cerca de 300-500ms, perto de 250ms de GPT-4o.

Mini-Omni(arXiv:2408.16725)、GLM-4-Voice(arXiv:2412.02612) e Moshi(arXiv:2410.00037) são complementares de streaming de voz-LLM projetos.

### Programa de ensino de quatro fases

Currículo de treinamento do MIO:

1. Fase 1  alinhamento── grande escala modalidade-par corpora: texto-imagem、texto-discurso、texto-música── cada par Use its own Token vocabulary segment── training sharing vocabulary──
2. Fase 2  interligados──Multi-modalidade interligados documentos(带图像 + 视频的博客、带转录的播客等)──训练跨modality context──
3. Fase 3  fala-enhanced──额外音频数据, para melhorar a qualidade do som e não perder a capacidade de escrita──
4. Fase 4  SFT──跨 modality 的指示调整:VQA、captioning、narration、speech-to-speech dialogue──

缺少某阶段会削弱特定能力:跳过阶段 2,模型会失去跨modality context;跳过阶段 3,语音会很差──

### Cadeia de pensamento visual

MIO 引入 chain-of-visual-thought:模型发出中间图像 Token 作为推理步骤──对于 "é o gato a subir uma árvore?",模型会:

1. 发发发 `<image>`Token 来染场景 ((来自输入图像或草图) ]]
2. 发出文本分析该草图──
3. 发发出最终答案──

染出的中图像作为 scratchpad──在空间推理任务上,benchmarks 有提升──这个想法类似文本推理中的思想链──

### Qualquer concorrente

- QualquerGPT(arXiv:2402.12226): 4 种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种种
- Unified-IO 2 ((arXiv:2312.17172): aumentar as saídas de ação de visão, profundidade, normais, tarefas, maior variedade, menor dimensão,
- NExT-GPT(arXiv:2309.05519):LLM + decodificadores de difusão específicos de modalidade── não são métodos de modelo único──
- CoDi(arXiv:2305.11846):difusão compostavel; através de latente compartilhado 实现 qualquer-a-qualquer―

MIO 最接近纯标识任何-to-any. AnyGPT é o seu conceito de pré-embou.

### Orçamento de latência

Para um produto de diálogo, é importante que cada componente seja atrasado:

- Mic até áudio Token: ~50ms。
- Preencher(token + histórico de áudio): 8B modelo 上 ~ 100ms。
- Primeiro Token de saída: ~50ms
- Residual paralelo-VQ + decodificador de fala: ~ 100-150ms。

总时间到第一音频字节:最低约 ~300ms──GPT-4o 声称 ~250ms──Moshi 声称 160ms──根据公开基准,MIO/AnyGPT 位于400-600ms 范围──

### Por que qualquer um ainda é difícil

Mesmo em 2026, abrir qualquer modelo de qualquer tipo em dois eixos ainda está atrás dos fechados:

- 语音质量──residual-VQ Tokenizer 是有损的; em comparação com ElevenLabs-class voices, dialog语音听起来更机械──
- Raciocínio de modalidade cruzada. Deixar o modelo "cantando sobre o que vês" ainda é mais fácil do que tarefas de visão pura.

Estes são problemas de investigação abertos.


```figure
any-to-any-stream
```

## Use-o
`code/main.py`- Não .

- Definir a alocação de vocabulário de quatro modalidades, e imprimir-o.
- A partir de agora, o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de transferência de dados para o sistema de dados para o sistema de transferência de dados para o sistema de dados para o sistema de transferência de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados para o sistema de dados.
- 模拟文字-to-speech response 的流媒体解码,并统计延迟──
- Em circunstâncias de latência de codificação, preenchimento e decodificação, calcula o tempo de previsão para o primeiro byte de áudio.

## Entrega-o
本课产 出 `outputs/skill-any-to-any-pipeline-auditor.md` determinar uma especificação de produto de conversação (modalidades em ▌modalidades fora ▌alvo de latência), auditando as escolhas de design da família MIO e calcula o orçamento de latência

## 练习
1. Seu produto aceita entrada de fala e retorna à saída de fala.

2. SpeechTokenizer residual-VQ Use 8 个代码簿──说明为什么平行解码残留水平是必要的──相对于序列),以及它带来什么延迟节省──

3. Seu vocabulário tem 32k texto + 4k imagem + 4k fala.

4. A cadeia de pensamento visual irá emitir imagens em meio. Que tipos de problemas serão beneficiados? Que tipos serão prejudicados?

5. 阅读 Moshi(arXiv:2410.00037)。 descrever seu "monólogo interno" 技术,并与MIO的链接视觉思想比较──

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Any-to-any | "Multimodal in/out" | 一个单一模型，能够在任意方向接受并发出 text、image、speech 和 music |
| Residual-VQ | "Speech tokenizer stack" | Multi-codebook Tokenization，每一层都添加信息；base layer 是内容，后续层是 prosody |
| SEED-Tokenizer | "Image codes" | MIO 使用的离散 image Tokenizer，带 4096-entry codebook |
| Chain-of-visual-thought | "Visual scratchpad" | 模型在最终答案前生成一张中间图像作为 reasoning step |
| Time-to-first-audio-byte | "TTFAB" | 从用户语音到第一个 audio output 的延迟；<500ms 才有对话感 |
| Four-stage curriculum | "Training recipe" | Alignment -> interleaved -> speech-enhanced -> SFT，按此顺序 |

## 延伸阅读
- [Wang et al. — MIO (arXiv:2409.17692)](https://arxiv.org/abs/2409.17692)
- [Zhan et al. — AnyGPT (arXiv:2402.12226)](https://arxiv.org/abs/2402.12226)
- [Lu et al. — Unified-IO 2 (arXiv:2312.17172)](https://arxiv.org/abs/2312.17172)
- [Wu et al. — NExT-GPT (arXiv:2309.05519)](https://arxiv.org/abs/2309.05519)
- [Tang et al. — CoDi (arXiv:2305.11846)](https://arxiv.org/abs/2305.11846)
