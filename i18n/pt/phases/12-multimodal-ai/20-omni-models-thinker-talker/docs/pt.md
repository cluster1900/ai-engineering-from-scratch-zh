# Modelos Omni: Qwen2.5-Omni e Thinker-Talker  拆分

> GPT-4o em 2024 apresentação de produto de maio é por isso que tem impacto, não por causa do modelo de fundo, mas por causa da forma do produto: uma interface de voz, você fala, o modelo vê o conteúdo que a câmera vê, e em 250ms internação de voz.

**Type:** Build
**Languages:** Python（stdlib，streaming pipeline 延迟模拟器 + VAD 循环）
**Prerequisites:** Phase 12 · 19（audio-LLMs），Phase 12 · 16（any-to-any）
**Time:** ~180 分钟

## Objectivo de aprendizagem
- 将推理管线 拆分为 Thinker (文本推理) 和 Talker (语音合成),并解释为什么并行流动 (能工作)
- 逐组件计算一次对话交互的时间到第一音频字节 (TTFAB) orçamento
- 描述 TMRoPE 在 Thinker 内部跨视觉、音频和文本的时间对齐位置编码──
- Há três tipos de diálogo: meio duplex, virar-se, duplicar-se.

## 问题
Um assistente de voz real tem de fazer muitas coisas rapidamente.

1. 听用户──实时语音 Tokenization, detecção de atividade de voz(VAD) para julgar o usuário 何时说完──
2. Opcional para ver. Em 2-4 FPS, entre em imagem de câmera, e em streaming para Thinker.
3. 思考── Based on dialog 历史组织回应──
4. Há uma série de versões de vídeo que estão disponíveis no site.

Cada passo aumenta o atraso. O tempo de conversão é de < 500ms; abaixo deste valor, o usuário não se sente mais obviamente atrasado.

Cada componente precisa de streaming. Não posso fazer todo o batch.

## 概念
### Pensador e Falador

Qwen2.5-Omni 的分解:

- Pensador: um 7B-80B 文本生成 Transformer。消费交错的文本 + 图像 + 音频 Token。输出表示要说什么的文本 Token。
- Falante: um menor de语音生成Transformer(200M-1B)。消费 Thinker 的文本输出代码加上最近的语音上下文代码──输出离散语音代码(residual-VQ 索引)。
- Decodificador de fala: um decodificador de forma de onda em streaming (SNAC、MoVQGAN família),将语音 Token 实时转换为音频样本。

Esse tipo de separação é importante. O pensador deve ser grande o suficiente para ter boa capacidade de raciocínio. O orador pode ser pequeno, porque sua tarefa é local: transformar o texto em um sinal de voz.

两者并行运行:

1. Pensador 发发出文本 Token t_i。
2. Falantes 消费 t_i(通过流),并发出语音 Token s_i、s_{i+1}、...、s_{i+k}。
3. O decodificador de fala em Token de voz até chegar consumir os mesmos, não emitir amostras de áudio.
4. Quando o pensador chegou ao texto Token t_{i+3} 时, Talker 已为 t___..t_{i+2} streaming 了音频。

### TMRoPE  时间对齐的 Multimodal 位置

Pensador 需要整合图像(例如以4 FPS到达) 音频(以50 /秒到达) 以及来自对话历史的文本──简单的序列顺序──所有图像,然后所有音频,然后文本) 将丢失时间对齐──

TMRoPE para cada Token 分配绝对时间──t=2.3s 的视觉 Token──t=2.32s 的音频 Token──来自用户文本 Token stop 位于 t=2.35s──RoPE 按时间旋转 注意;模型将将它们看作在时间同时发生──

É para que ele se vá embora e diga olá à infraestrutura capaz de trabalhar: o modelo no mesmo conceito foi visto em vídeo e em rádio.

### Transmissão 语音合成

语音 Token 必须流通──Mini-Omni(Xie & Wu, 2024) propôs modelos de linguagem que podem ouvir, falar enquanto pensam em streaming:Thinker 输出 Token 和 Talker 输出 Token 在同一个序列中交错──Talker 在 Thinker 确认下一个文本 Token 后立即启动──没有批量 边界──

Moshi(Défossez et al., 2024 年 10 月) é a mais rápida implementação aberta.

### VAD e viragem

Detecção de atividade vocal 运行在输入侧──两种模式:

- Meio duplex: usuário falar, modelo ouvir.
- Duplex completo: ambas as partes podem falar ao mesmo tempo.

Qwen2.5 Omni 默认支持半duplex,通过静音值进行转换──Full-duplex 需要应用层处理──

### Qwen3-Omni(2025 年 11 月)

后继版本──Qwen3-80B Thinker, Greater Talker,改进的TMRoPE-v2──延迟接近GPT-4o的250ms──开放权重──在OmniBench 上的基准与Gemini 2.0 Live 具有竞争力──

### Orçamento de latência de produção

对于典型流媒体 交互:

- Mic -> 音频 Token:40-80ms。
- Preencher ((impressão + histórico):7B 上 100-200ms,70B 上高得多。
- Primeiro pensador.
- Falador 处理第一个文本 Token:20ms。
- Primeiro, o token de comissão é de 40 minutos.
- Residual-VQ decodificação: 30ms.
- 语音 decodificação de forma de onda: 50-80ms。

总 TTFAB:7B 上 320-510ms,70B 上 600-900ms。 Fronteira 质量通常意味着70B+;这是边界 延迟差距的来源──

### Matemática de taxa de tokens

Para 16kHz 语音和 50 Hz 基础层语音代币,你每秒输出需要50语音代币――Talker 必须发发发 ≥50 tok/s 才能跟上――在H100上,典型 LLM throughput 为30-80 tok/s,因此小型(200-300M)Talker 足够快;7B Talker 会落后――

É por isso que haverá um modelo de conversador especializado pequeno, em vez de um modelo principal de uso direto.


```figure
l5-thinker-talker
```

## Use-o
`code/main.py`- Não .

- Usar Token simulado 发射速率模拟Tinker-Talker pipeline。
- Para a configuração de tamanho do modelo e microfone                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
- Usar VAD 静音值演示 meio duplex de turno-tomando

## Entrega-o
本课产 出 `outputs/skill-omni-streaming-budget.md`△ deu-se um real-time语音产品的目标 TTFAB 和功能集合(vision-in、bilingual、full-duplex), escolher Qwen2.5Omni、Qwen3-Omni、Moshi 或 Mini-Omni,并确定 Thinker/Talker's size。

## 练习
1. Seu objetivo TTFAB é 300ms. Em 7B Thinker e 300M Talker, escreva um texto sobre cada componente.

2. Qwen2.5-Omni Utilize TMRoPE── Descreva um prompt assim 中模型看的内容: User在 t=1s 开始说话,摄像头在 t=1.2s 捕捉到一个手势──

3. O modelo de apoio à exigência de duplex completo em escuta simultânea é emitido em freqüência.

4. 阅读 Moshi 论文 Seção 4── descrever o monólogo interno 分离, bem como por que ele evitou o pensador-falante 分离──

5.  calcular o rendimento  orçamento: Para seguir a 16kHz 语音和 50 基础层 Token/秒, o Falante 必须发发发 Token以多快速度?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| Thinker | “推理大脑” | 生成要说什么的大型文本生成 Transformer |
| Talker | “语音生成嘴巴” | 从 Thinker 文本生成离散语音 Token 的小型 Transformer |
| TTFAB | “延迟预算” | Time-to-first-audio-byte：从用户语音结束到第一个音频 sample 输出 |
| TMRoPE | “时间对齐 RoPE” | 使用跨视觉、音频、文本的绝对时间戳的位置编码 |
| Half-duplex | “Turn-taking” | 用户和模型交替；VAD 静音检测用户已说完 |
| Full-duplex | “同时进行” | 模型可以同时说话和聆听；具备 backchannel 能力 |
| Inner monologue | “Moshi 分离” | 单模型设计，其中思考流和说话流交错 |

## 延伸阅读
- [Xu et al. — Qwen2.5-Omni (arXiv:2503.20215)](https://arxiv.org/abs/2503.20215)
- [Qwen Team — Qwen3-Omni (arXiv:2509.17765)](https://arxiv.org/html/2509.17765v1)
- [Xie & Wu — Mini-Omni (arXiv:2408.16725)](https://arxiv.org/abs/2408.16725)
- [Défossez et al. — Moshi (arXiv:2410.00037)](https://arxiv.org/abs/2410.00037)
- [Zeng et al. — GLM-4-Voice (arXiv:2412.02612)](https://arxiv.org/abs/2412.02612)
