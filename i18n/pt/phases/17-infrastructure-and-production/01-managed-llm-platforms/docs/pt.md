# 托管 LLM 平台  Bedrock, Vertex AI, Azure OpenAI

> Os modelos de desenvolvimento de sistemas de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software de software

**Type:** Learn
**语言：**Python (stdlib, comparador de custo e latência de brinquedo)
**前置要求：**Fase 11 (Engenharia de Mestrado em Ciências) e Fase 13 (Instrumentações e Protocolos)
**Time:** ~60 minutes

## Objectivo de aprendizagem
- Para explicar as estratégias de mercado versus exclusiva versus gemini-first, a estratégia é adaptada a um exemplo de produto.
- Explicar As Unidades de Transmissão Provisória (PTUs) no Azure OpenAI  forneceram o que você comprou, bem como por que Bedrock sob demanda em 405B    escala normalmente a leitura vai demorar cerca de 25 ms ⋅
- 绘制每个平台的 FinOps 归因界面(Bedrock Application Inference Profiles vs Vertex projeto-per-équipe vs Áreas de alcance de Azure + reservas de PTU) 
- 写下一条二供应商最小策略,并解释为什么单供应商锁定是2026年代价高昂的错误――

## 问题
Você escolheu o seu produto para o Claude 3.7 Sonnet. Agora você precisa de fornecer serviços. Você pode usar diretamente a API Anthropic, também pode usar através da AWS Bedrock, ou através do gateway.

Mais fundo problema é o catálogo. Se você precisar usar Claude、Llama 和 Gemini no mesmo produto, então você não pode comprá-los de um único local, a menos que aquele local simultaneamente seja Bedrock加 Vertex加 Azure OpenAI──hiperscaler não é intercâmbio   cada um deles fez diferentes apostas para quem possui um modelo de camada──

Esta aula trata de três tipos de apostas, atraso, diferença, finalizações, diferença e risco de bloqueio.

## 概念
### 3 estratégias

**AWS Bedrock** mercado.Claude (Antropic)、Llama (Meta)、Titan (AWS primeira-parte)、Estabilidade (imagem)、Cohere (embeddings)、Mistral, bem como imagem 和 embebimento 子目录──uma API, uma interface IAM, uma exportação CloudWatch──Bedrock 的押注是,客户想要可选性,胜过想要单一模型──

**Azure OpenAI** Parceria exclusiva── Você obteve GPT-4 / 4o / 5 / o-série DATACENTERs Azure DATACENTERS DALL·E、Whisper, bem como o ajuste fino do modelo OpenAI DATACENTERS Não há nenhum modelo DATACENTER DATACENTER NÃO OUTRA AÇÃO DATACENTER Não existem modelos Não existem modelos Não existem modelos Não existem em Azure DATACENTERS Não existem produtos Não existem dados Não existem dados Não existem dados Não existem dados Não existem dados Não existem dados Não existem dados Não existem dados Não existem dados Não existem dados Não existem dados Não existem dados Não existem dados Não existem dados Não existem dados 

**Vertex AI** Gemini primeiro, 余余第二──Gemini 1.5 / 2.0 / 2.5 Flash e Pro,加上 Model Garden(terceiro)──Vertex 的押注是多型式 长上下文  1M-token Gemini context 是差异化因素──

### Distância de latência abaixo da escala 

Análise artificial 运行持续基准──在等效的Llama 3.1 405B 部署上(shared on demand),Azure OpenAI mediana latencia de primeiro token 约为50 ms;Bedrock 约为75 ms── essa diferença não é AWS 失败 它是容量模型差异──Azure 销售PTUs (Provisioned Throughput Units),为您租户 预留 GPU 容量──Bedrock 的等价格──Bedrock 的等价格──也存在,但每单位 起价约$21/小时,大多数共享客户仍然停留在需求──

Capacidade compartilhada à procura 会与所有其他客户的流量竞争──Capacidade dedicada 不会── Se o seu produto SLA é TTFT < 100 ms em P99, então você quer comprar PTUs do Azure, quer comprar Bedrock Provisioned Throughput, quer aceitar em conformidade波动──

### Produto fornecido 经济性

PTUs Azure: um bloco de cálculo de inferência pré-reservado. Em relação à carga de trabalho previsível, em comparação com a demanda, o máximo de economia é de cerca de 70%.

Bedrock Provisioned Throughput: de acordo com modelo e região, cada hora $21-$50― matemática similar  break-even 大约在峰值利用的一半──需要月份承诺──

Capacidade de fornecimento vertical  baseada em Gemini SKU  venda; preços 因模型和地区而异,公开宣传更少──

### FinOps 界面  Verdadeiros factores de diferença

**Bedrock Application Inference Profiles**É o mercado mais puro.`team`- Não.`product`- Não.`feature`Profil de marcação; deixe todos os modelos de manipulação passarem por ele; CloudWatch                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         

**Vertex**归因是项目-per-team加标签-everywhere──你把每个团队建模为一个GCP项目,在每个资源上打标签,并使用BigQuery Billing Export + DataStudio做rollup──工作更多,但BigQuery 让你对成本数据执行任意SQL──

**Azure**Dependendo dos escopo de subscrição/grupo de recursos Adi tags,并把 PTU reservas 作为一等成本对象──Tags de grupos de recursos 继承, em vez de de solicitações 继承, por isso por pedido 归因需要 应用洞察的定制度,或一个会写入头条的门口──

Modelo é:Bedrock Original生最干净,Vertex 通過BigQuery 最灵活,Azure 最不透明,除非你做仪器──

### O bloqueio é um risco de 2026

Quando um modelo domina, o compromisso de hiperescalação única também pode ser aceito. Em 2026, a primeira linha de cada mês está em movimento.

O modelo de adoção da equipe é: para qualquer produto, o chamado LLM é essencial, pelo menos, usando dois provedores.

### Residência de dados, BAAs e indústria de supervisão

Bedrock: a maioria das regiões  fornece BAAs; pontos finais VPC; guarda-roupações。
Azure OpenAI:HIPAA、SOC 2、ISO 27001; residência de dados da UE;
Vertex:HIPAA、GDPR、residência de dados por região; Google Cloud compliance stack。

O número de pessoas que participam da atividade de informação é de aproximadamente um milhão de pessoas.

### Você deve lembrar-se de números

- Azure OpenAI em Llama 3.1 405B 等效场景 abaixo mediana TTFT: ~ 50 ms (utilizando PTUs) ⋅
- Cama de cama sob demanda 中位 TTFT: ~ 75 ms。
- Capa de cama Fornecida de transmissão: por unidade $21-$50/hora.
- Redução do nível de PTU do Azure: ~ 40-60% de utilização sustentada.
- Alta utilização de PTU em comparação com a demanda: até 70%


```figure
i4-platform-lanes
```

## Use-o
`code/main.py`A partir de hoje, a empresa tem uma grande capacidade de produção de produtos de qualidade e de produção de produtos de qualidade, incluindo produtos de qualidade, e também de produção de produtos de qualidade.

## Entrega-o
本课会生成 `outputs/skill-managed-platform-picker.md` fornecer um perfil de carga de trabalho (necessidade de modelos, SLA TTFT, volume diário, requisitos de conformidade), que irá recomendar a plataforma primária, o retrocesso e o plano de instrumentação FinOps.

## 练习
1. 运行 `code/main.py` Para o modelo de classe 70B, a PTU Azure em que utilização sustentada é melhor do que sob demanda?
2. Os seus produtos precisam de Claude 3.7 Sonnet e GPT-4o.
3. Uma plataforma de saúde regida  clientes requerem BAAs  EUA-Leste data residence 和 sub-100ms P99 TTFT── escolher uma plataforma,并使用三个具体功能来论证──
4. Você descobriu que esta semana o Bedrock                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
5. 阅读Azure OpenAI 和 Bedrock preços páginas。 Para 100M-token/month Claude workload, 哪个更便宜  direct Anthropic API、Bedrock on demand, ou Bedrock Provisioned Throughput?

## 关键术语
| Term | What people say | What it actually means |
|------|----------------|------------------------|
| Bedrock | "AWS LLM service" | 跨 Claude、Llama、Titan、Mistral、Cohere 的模型 marketplace |
| Azure OpenAI | "Azure's ChatGPT" | 位于 Azure datacenters 中、带企业控制能力的独家 OpenAI 模型 |
| Vertex AI | "Google's LLM" | 以 Gemini 为先的平台，Model Garden 用于 third-party models |
| PTU | "dedicated capacity" | Provisioned Throughput Unit — 预留 inference GPUs，按小时定价 |
| Application Inference Profile | "Bedrock tagging" | 带 tags 的 per-product cost/usage profile，CloudWatch-native |
| Model Garden | "Vertex catalog" | Vertex AI 的 third-party model section，独立于 Gemini |
| Two-provider minimum | "LLM redundancy" | 让每条关键 LLM 路径跨 ≥2 个 hyperscaler 运行的策略 |
| BAA | "HIPAA paperwork" | Business Associate Agreement；PHI 所必需；三者均提供 |
| Abuse monitoring | "the log watcher" | provider-side safety scan，作用于 prompts/outputs；enterprise 可 opt-out |

## 延伸阅读
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/) 权威 taxas de cartão 和 Preço de Produto Provisionado。
- [Azure OpenAI Service Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) Economia da PTU 和 cartões de taxas
- [Vertex AI Generative AI Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing) Níveis Gemini 和 Modelo Garden sobretaxas。
- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai/)  跨供应商持续延迟和吞吐量基准――
- [The AI Journal — AWS Bedrock vs Azure OpenAI CTO Guide 2026](https://theaijournal.co/2026/03/aws-bedrock-vs-azure-openai/) quadro de decisão empresarial。
- [Finout — Bedrock vs Vertex vs Azure FinOps](https://www.finout.io/blog/bedrock-vs.-vertex-vs.-azure-cognitive-a-finops-comparison-for-ai-spend) Mecânica de atribuição lado a lado.
