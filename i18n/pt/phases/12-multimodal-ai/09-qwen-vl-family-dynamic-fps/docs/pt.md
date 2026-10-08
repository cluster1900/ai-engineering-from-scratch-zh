# Família Qwen-VL e Vídeo Dinâmico-FPS

> A família Qwen-VL  Qwen-VL (2023) ✓ Qwen2-VL (2024) ✓ Qwen2.5-VL (2025) ✓ Qwen3-VL (2025) ✓ é o modelo de visão aberta mais influente de 2026 ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓

**Type:** Learn
**Languages:** Python (stdlib, M-RoPE encoder + dynamic-FPS sampler)
**Prerequisites:** Phase 12 · 06 (patch-n'-pack)
**Time:** ~120 minutes

## Objectivo de aprendizagem
- 計算 M-RoPE 的三轴旋转 (temporal, altura, largura),并解释为什么三者都需要──
- Por video escolher dinâmica-FPS amostragem 策略,并推理 tokens-per-secondes com a precisão de detecção de eventos 取舍──
- 按顺序说出Qwen-VL 四代升级,以及每代启动了什么──
- 连接一个Qwen2.5VL-style JSON agent 输出格式,并从 VLM 响应中解析结构化工具调用──

## 问题
Qwen-VL foi lançado em agosto de 2023, é uma resposta direta para LLaVA-1.5 e BLIP-2.

Resolução:LLaVA-1.5 运行在 336x336──对照片还可以,但对中文发票或密集电子表格截图没有用──Qwen-VL's primeira inovação foi 448x448 和 grounded bounding-box 输出,让模型能够指向对象──

视频:Video-LLaMA 堆叠逐编码并把它们给LLM── é válido para curtas-metragens, mas não é válido para muitos minutos de vídeo, porque este tipo de vídeo o eixo de tempo é apenas um sinal──Qwen 团队 想要一个理解时间的单一编码──

结构化输出:LLaVA 输出自由格式文本──Agent 需要 JSON──Qwen-VL 使用显式 JSON 输出格式训练,包括把边界框 坐标作为文本──

Cada geração de Qwen-VL foram expandidas.

## 概念
### Qwen-VL (agosto 2023)

Primeiro passo:OpenCLIP ViT-bigG/14 作为编码器(2.5B params)、LLama-compatible Q-Former(1-step com 256 consultas)、Qwen-7B base。贡献:

- 448x448 分辨率 ()
- Grounding: usage带显式坐标 Token 输出的 image-text pairs 训练──"O gato está em <box>(112, 204), (280, 344)</box>"──
- Desde o início, realizar treinamento em chinês + inglês em vários idiomas.

O primeiro é o primeiro, que é o primeiro, que é o primeiro, que é o primeiro.

### Qwen2-VL (septembro 2024)  M-RoPE 与原生分辨率

Qwen2-VL Utilizando original vivo animação resolução ViT encoder  substituído resolução fixa + Q-Former stack──

- Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem: Origem:
- M-RoPE (Multimodal RoPE) ―― cada Token 携带 3D 位置 (t, h, w), em vez de 1D──对图像 t=0;对于视频 t = frame_index──RoPE 按每个轴的频率旋转查询/key Vector──没有位置嵌嵌表──
- Projector MLP──去掉 Q-Former; em tokens de parche combinado 上使用2 layer MLP──
- 带动态 FPS 的视频──默认以1-2 FPS 采样视频,但模型接受任意数──

Resultado:Qwen2-VL-7B em vários Multimodal 基准上追平 GPT-4o, e DocVQA 上超过它(94.5 vs 88.4)。 A mudança de estrutura é um passo decisivo。

### Qwen2.5-VL(2025 年 2 月)  FPS dinâmico + tempo absoluto

Qwen2.5VL de grande transformação é o vídeo.

- 绝对时间 Token──不使用位置索引(frame 0, 1, 2...),而使用实际时间──"À 0:04, o gato salta". 模型会看到与框架代币 交错的 交错的`<time>0.04</time>`- Os tokens.
- FPS dinâmico, material de velocidade lenta, em 1 FPS, cenário de movimento, em 4+ FPS, em
- Atenção Espacial  Adotar janelas (block 内局部) para aumentar a pronóstico; Cada隔几层加入全球关注──
- 显式 JSON 输出格式──使用工具-call 数据训练:"{\"tool\": \"clique\", \"coords\": [380, 220]}"──开箱即代理-ready──
- MRoPE-v2 escalado.

基准:Qwen2.5-VL-72B 在多数视频基准上超过GPT-4o,在文档上追平Gemini 2.0,并为GUI grounding 设定开放模型SOTA(ScreenSpot: 84% de precisão vs GPT-4o's 38%)。

### Qwen3-VL (novembro 2025)

Qwen3-VL é uma vez um aumento de volume de atualização, foco é integração em vez de reinventar: maior LLM espinha dorsal ((Qwen3-72B) 、 expandimento de treinamento dados、 melhoria de OCR, bem como através do modo de pensamento Qwen3    obter raciocínio mais forte.

Esta teoria é uma das principais fontes de dados que são utilizadas para a construção de sistemas de computadores.

### M-RoPE matematicamente

经典 RoPE 使用成对坐标,按位置 `m`旋转维度为 `d` `q`- Não .

```
q_rot[2i]   = q[2i]   * cos(m * theta_i) - q[2i+1] * sin(m * theta_i)
q_rot[2i+1] = q[2i]   * sin(m * theta_i) + q[2i+1] * cos(m * theta_i)
theta_i     = 10000^(-2i/d)
```

M-RoPE vai esconder dim 切分为三条带――假设 `d = 96` Distribuir 32 dims 给 temporal、32 给 height、32 给 width── cada banda 按自己的轴位置旋转──位于 (t=5, h=10, w=20) 的补丁 会在其三条带上分别应用旋转`R_t(5)`- Não.`R_h(10)`- Não.`R_w(20)`- Não.

Tokens de texto`t = text_index, h = 0, w = 0`(ou um tipo de seleção), para manter a sua capacidade de utilização.`t = frame_time, h = row, w = col`△ single imagem utilização `t = 0`- Não.

Benefício: um código de localização é um código de localização que pode ser usado para processar textos, imagens e vídeos, sem necessidade de um código de localização diferente.

### Dinâmica-FPS 采样逻辑

给定一个时长为 `T`秒的视频和目标 Token  orçamento `B`- Não .

1. 计算你能承担最大FPS:`fps_max = B / (T * tokens_per_frame)`- Não.
2. De`{1, 2, 4, 8}`中选择满足 `fps <= fps_max`O objetivo é o FPS.
3. Se movimento forte, seção de fluxo óptico ou claro, escolha FPS mais alto.
4. 按选定FPS 均采样;在之间插入 `<time>t</time>`- Os tokens.

Qwen2.5VL 会隐式训练这种逻辑;推理时用户通过 `fps`参数控制── uma sequência de 60 segundos de movimento, com 4 FPS、 por 81 tokens 计算, igual a 19440 tokens, em contexto de 32k 中可管理──

### Output de agente estruturado

Qwen2.5-VL de agente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

```
{
  "tool": "mouse_click",
  "coords": [1024, 512],
  "button": "left",
  "modifier": null
}
```

解析是确定性的:对模型输出执行 JSON.parse。相比之下,自由格式的"click at (1024, 512) "需要 regex 和歧义处理──这个转变解释了为什么Qwen2.5-VL's ScreenSpot 分数从Qwen2-VL's 55% 跃升到84%.──


```figure
mm-mrope-axes
```

## Use-o
`code/main.py`实现:

- Para a sequência de texto misturado, parches de imagem e quadros de vídeo  realizar M-RoPE  localização calculação 
- Dinâmico-FPS amostragem:给定 (durada, orçamento, movimento_nível), seleccionar FPS 并输出 frame timestamps──
- Uma edição de brinquedo Qwen2.5VL JSON-output parser, usado para processar respostas de chamadas de ferramentas.

Operá-lo, depois em um vídeo de 5 minutos, coloca o FPS fixo em FPS dinâmico, percebe a diferença.

## Entrega-o
本课产 出 `outputs/skill-qwen-vl-pipeline-designer.md` fornecer uma tarefa de vídeo (monitoring, agente, reconhecimento de ação, acessibilidade), que irá emitir Qwen2.5 VL  configuração  orçamento de quadro  estratégia FPS  padrão de atenção de janela  modo de saída de agente) e estimativa de atraso 

## 练习
1. 計算 hidden 48(每条 band 16,base theta 10000)时,位于 (t=3, h=5, w=7) do parche do M-RoPE 旋转──展示每条 band 中前三对的旋转角度──

2. Uma secção de 10 minutos de segurança de vídeo de câmera, em 1 FPS irá produzir quanto? em 384 resolução  e 3x piscina abaixo, o total de tokens número é quanto? Qwen2.5-VL  padrão 32k contexto  pode processá-lo?

3. Por 30 segundos, o programa de programação de 30 segundos, o agente de interface de 30 segundos, o FPS é escolhido.

4. Qwen2.5VL  completamente eliminado Q-Former──Why Simple MLP In 2025 Year可行, mas in 2023 Year不可行?

5. O que acontece com o JSON malformado? Qwen cookbook 推什么恢复策略?

## 关键术语
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| M-RoPE | "Multimodal RoPE" | hidden dim 中带 temporal、height 和 width bands 的 3D rotary position embedding |
| Dynamic FPS | "Smart sampling" | 根据运动、时长和 Token 预算为每个视频选择的帧采样率 |
| Absolute time token | "Timestamp token" | 在序列中交错插入的 `<time>t</time>`，让模型看到实际秒数而不是帧索引 |
| Window attention | "Local attention" | 为提速而限制在小窗口内的 spatial self-attention；周期性加入 global attention |
| Structured agent output | "JSON mode" | 通过训练数据监督教 VLM 输出可解析 JSON，其中包含 coords 和 tool names |
| min_pixels / max_pixels | "Resolution bounds" | Qwen2.5-VL 的每请求控制项，用来约束总像素数，从而约束 Token 数 |
| Grounding | "Point-at-it" | 将 bounding-box 坐标作为文本 Token 输出；自 Qwen-VL v1 起使用 |

## 延伸阅读
- [Bai et al. — Qwen-VL (arXiv:2308.12966)](https://arxiv.org/abs/2308.12966)
- [Wang et al. — Qwen2-VL (arXiv:2409.12191)](https://arxiv.org/abs/2409.12191)
- [Qwen Team — Qwen2.5-VL Technical Report (arXiv:2502.13923)](https://arxiv.org/abs/2502.13923)
- [Qwen Team — Qwen3-VL (arXiv:2511.21631)](https://arxiv.org/abs/2511.21631)
- [Zhu et al. — InternVL3 (arXiv:2504.10479)](https://arxiv.org/abs/2504.10479)
