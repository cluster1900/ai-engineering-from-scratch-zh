# Marcação de água  SynthID、Signature Stable、C2PA

> O sistema de rastreamento de conteúdo é baseado em três técnicas: A tecnologia de rastreamento de conteúdo é criada em 2026 e criada em 2026 com a publicação do Gemini 3 Pro em novembro de 2025. A análise de conteúdo é feita em conjunto com a análise de dados. A análise de conteúdo é feita em conjunto com a análise de dados. A análise de dados pode ser feita em conjunto com a análise de dados.

**Type:** Build
**Languages:** Python (stdlib, token-watermark embed + detect)
**Prerequisites:** Phase 10 · 04 (sampling), Phase 01 · 09 (information theory)
**Time:** ~75 分钟

## Objectivo de aprendizagem

- Descrever a marcação de água a nível de token (SynthID-text 风格) e o mecanismo de detecção do mesmo.
- Descreva a assinatura estável e o ataque de remoção de 2024
- Explicar o efeito do C2PA, bem como por que é associado à marcação de água 互补──
- 描述关键限制:sinal específico do modelo, paráfrase, assim como ataques de preservação de significado (arXiv:2508.20228):

## 问题

2023-2024 anos, deepfakes 和 AI Produção de conteúdo em grande escala entrar em política e consumo cenário. A marcação de água é um sinal de origem tecnológica proposta: durante a criação, marcado gerando conteúdo, depois de reexame.

## 概念

### Marca de água de texto ((SynthID-text 风格)

O mecanismo de Kirchenbauer et al. 2023 , por Google 产品化:

1. Em cada passo de decodificação, para o anterior K 个 Token fazer hash, gerar uma partição pseudorandom, vai dividir o vocabulário em "verde" e "vermelho" 集合。
2.  através da colocação de logitos verdes  δ, fazendo a amostragem  偏向绿色 集合──
3. O número de tokens verdes que contêm resultados será maior do que as expectativas em qualquer situação.

检测:对每个预写重新 hash,统计生成结果中的绿色代号,计算 z-score── watermarked text 的 z-score >0,human text 约为 0──

 características:
- 读者难以察觉 (δ 足够小,质量损失较轻)
- Em que você pode acessar o vocabulário de partição função 时可检测。
- Para parafrasear, não é fácil.

SynthID-text 于2024 年 10 月通过 Google's Responsible GenAI Toolkit 开源──

### Sinatura estável (imagem)

Fernandez et al. ICCV 2023──Fine-tune latente de difusão decodificador, faz cada张生成图像都包含一个写入 latent representation的固定二进制信息──检测通过神经 decoder 从 latent 中解码──对收割的图像,保留10% 内容) 的图像,在 FPR<1e-6 时检测率 >90%──

2024 年 5 月 "Stable Signature is Unstable" (arXiv:2405.07145):descodificador de ajuste fino pode manter a qualidade da imagem em simultâneo transferir a marca de água──对抗性的 post-generational fine-tuning 成本很低; resistência adversária dessa marca de água 有限──

### Detetor unificado SynthID ((2025 年 11 月)

Com o Gemini 3 Pro, um detector multimédia, que pode ser usado na mesma API para ler textos, imagens, áudio e vídeos.

### C2PA

Coalizão para a Provensão e Authenticidade de Conteúdo──Cryptographically signed tamper-evident metadata standard──C2PA 2.2 Explainer (2025)──C2PA manifest 会记录 provenance claims──谁创建、何时创建、做过哪些 transformations),并由创始人关键 签名──

Com marcas de água 互补:
- Metadados podem ser desligados; marcas de água (normalmente) não são fáceis.
- Metadados 信息丰富( cadeia de origem completa); marcas de água 承载 bit。
- C2PA depende da plataforma de adoção; marcas de água serão automaticamente inscritas.

Google em Busca、Ads 和 "Acerca desta imagem"

###  limitação

- **Model-specific.**SynthID irá gerar resultados de modelos habilitados com SynthID com um watermark.
- **Paraphrase.**Marcas de água do texto 无法经受 significado-preservando parafrase。
- **Transformation attacks.**arXiv:2508.20228 (2025)  demonstrou ataques de preservação de significado de marcas de água de texto e muitas marcas de água de imagem que podem ser destruídas
- **Fine-tune removal.**De acordo com "A assinatura estável é instável", ajustes de pós-geração podem ser eliminados.

### Lei da UE sobre IA Artigo 50

Artigo anteriorA primeira edição do projecto de lei de transparência de 2025, de dezembro de 2026, segundo edição do projecto de lei de março de 2026, de acordo com o[European Commission status page](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content), prévio edição final 2026 年 6 月发布) ・截至 2026 年 4 月,该 Code 仍为草案,时间线可能变化──监管层要求技术层提供这些措施──Deepfakes 必须标注──

### Está na fase 18 .

Lições 22-23 关注模型输出的内容(dados privados、signal de origem) ――Lessão 27 覆盖培训-data governance──Lessão 24 要求这些技术措施的监管框架──


```figure
an-watermark-greenlist
```

## Use-o

`code/main.py`Construir um watermark de texto de brinquedo。 Tokens is inteiro 0..N-1;watermarked sampling 会偏向 hash 定义的绿色集合。Detector 会计算绿色代币z-score。 você pode observar 1000代代币 下的检测结果, ver parafrase 如何破坏该信号,并测量人类文字 上的虚假阳性率──

## Entrega-o

本课会产出 `outputs/skill-provenance-audit.md` Determinar a sua robustez adversária e a sua cobertura de cada modalidade.

## 练习

1. 运行 `code/main.py` Relatório de geração de 1000 tokens com marcas de água com pontuações z de texto escrito por humanos―identificação de um limiar de confiança de 95%  taxa de falsos positivos―

2. 实现 um ataque de paráfrase, usando sinônimos  substituir 30% de Token──重新测量 z-score──

3. 阅读 Kirchenbauer et al. 2023 Seção 6 中关于强度的内容──为什么文字水印会在表语下失效,而图像水印能经受收割?

4. Design a use SynthID-text + C2PA metadata 部署──descrição da cadeia de origem do consumidor visto──identificação de um modo de falha de cada componente──

5. 2024 "Signature stable is unstable"  resultados indicam,fine-tuning pode ser removido marcas de água da imagem──design a um limite este ataque de implementação de medidas de controle  Por exemplo, exigir libertações assinadas de pontos de controle afinados──

## 关键术语

| Term | 人们怎么说 | 它实际含义 |
|------|------------|------------|
| SynthID | "Google's watermark" | Cross-modal provenance signal；text、image、audio、video |
| Token watermark | "Kirchenbauer-style" | Biased-sampling text watermark，可通过 green-token z-score 检测 |
| Stable Signature | "image watermark" | Fine-tuned-decoder watermark；ICCV 2023 |
| C2PA | "the metadata standard" | Cryptographically signed tamper-evident provenance metadata |
| Paraphrase robustness | "does rewording break it" | Text watermark 属性；目前有限 |
| Fine-tune removal | "adversarial unwatermark" | 通过 decoder fine-tuning 移除 image watermark 的攻击 |
| Cross-modal detector | "unified SynthID" | 2025 年 11 月跨 modalities 的 unified API |

## 延伸阅读

- [Kirchenbauer et al. — A Watermark for Large Language Models (ICML 2023, arXiv:2301.10226)](https://arxiv.org/abs/2301.10226) mecanismo de marcas de água
- [Fernandez et al. — Stable Signature (ICCV 2023, arXiv:2303.15435)](https://arxiv.org/abs/2303.15435) imagem marca de água 论文
- ["Stable Signature is Unstable" (arXiv:2405.07145)](https://arxiv.org/abs/2405.07145)Ataque de remoção
- [Google DeepMind — SynthID](https://deepmind.google/models/synthid/) Marca de água transversal
- [C2PA 2.2 Explainer (2025)](https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) Padrão de metadados
