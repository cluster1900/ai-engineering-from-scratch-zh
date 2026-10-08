# 内容审核系统  OpenAI, Perspective, Guardia de los Llama

> Los sistemas de moderación de nivel de producción serán las lecciones 12-16 en las que se definen las políticas de seguridad 操作化。OpenAI Moderation API:`omni-moderation-latest`(2024)  Basado en GPT-4o, puede ser utilizado en una sola vez para texto + imágenes 分类; en多语言测试集上上上一版本提升42%; esquema de respuesta 返回 13 个类别 booleans  acoso, acoso/amenaza, odio, odio/amenaza, ilícito, ilícito/violento, autolesiones/intención, autolesiones/instrucciones, sexo, sexo/minores, violencia, violencia/grafica; para la mayoría de los desarrolladores 免费。Layer retirado patrones: Moderación de entrada (pre-generación) ‧ Moderación de salida (post-generación) ‧ Moderación de personalización (reglas de dominio) ‧Async llama a la latencia de contenido en el dominio; Fancillo  Interfactor Deplicencia de contenido Lígenes de seguridad (Ligodegline  Llama  Llama  Llama                                                                                                                                            

**Type:** Build
**Languages:** Python (stdlib, three-layer moderation harness)
**前置要求：**Fase 18 · 16 (Llama Guardia / Garak / PyRIT)
**Time:** ~60 minutes

## El objetivo del aprendizaje
- Describir la taxonomía de categorías de OpenAI Moderation API, así como el conjunto de MLCommons de Llama Guard 3 tiene un gran diferencia.
- 描述三级调节模式 ((输入、输出、定制),并指出每一层的一个失败模式──
-                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
- Explicar la línea de tiempo de depreciación de Azure.

##  problemas
Lecciones 12-16  Describir los ataques y las herramientas de defensa  Lección 29                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

## 概念
### API de moderación de OpenAI

`omni-moderation-latest`(2024) ・ Basado en GPT-4o― Una vez调用即可对文本 +图像 分类―对大多数开发者免费―

Categorías de esquemas de respuesta 中的 13 个布尔语):
- acoso, acoso/amenaza
- odio, odio/amenaza
- autolesiones, autolesiones/intenciones, autolesiones/instrucciones
- Sexual, sexual/minores
- violencia, violencia/grafía
- Ilícito, ilícito/violento

Apoyo multimodal 适用于 `violence`¿Qué es esto?`self-harm`Y `sexual`, pero no es aplicable `sexual/minors`; rema rema rema rema为 sólo texto

En el`code/main.py`En el código de uso, para enseñar la simplicidad, vamos a`/threatening`¿Qué es esto?`/intent`¿Qué es esto?`/instructions`Y `/graphic`Los subcategorias se doblan a los padres de nivel superior de los mismos.

En muchos idiomas, los resultados de los ensayos de prueba se incrementan en un 42% en comparación con los de la última generación.

### Guardia de los llama 3/4

已在教学16 覆盖──14 个 MLCommons peligrosas categorías(organización diferente a los 13 个响应方案 booleans de OpenAI)──支持 8 idiomas (v3)──Llama Guard 4 (2025 年 4 月) 原生支持 多模,12B──

Las taxonomías de OpenAI y Llama Guard tienen sobreposición pero también diferencias. OpenAI se convertirá en una categoría amplia de "ilícitos"; la Guardia de Llama se dividirá en "delitos violentos" y "delitos no violentos".

### API de perspectiva (Google Jigsaw)

El sistema de calificación de toxicidad de LLM como moderador 浪潮(pre-2020) Categorias:Toxicidad, SEVERE_TOXICIDAD, INSULT, PROFANITAD, THREAT, IDENTITY_ATTACK。单维度 prima score (TOXICIDAD),并带有子维度变异──

Se utiliza ampliamente como base de investigación de moderación de contenido, ya que la API 稳定、有文档, y posee muchos años de datos de calibración.

### El patrón de tres capas

1. **Input moderation.**En generación 前对用户提示 分类──如果标记,则拒绝──延迟:一次分类器调用──
2. **Output moderation.**En la entrega 前对模型输出 分类──如果标记,则替换为拒绝──延迟:代后一次分类器调用──
3. **Custom moderation.**Reglas específicas de dominio (regex, permisos, política de negocios)

Este tres niveles según el diseño es secuencial: moderación de entrada 必须在一代前完成,output moderation 在一代后运行.

### Modo de falla

- **Input only.**捕捉不到输出幻觉 (Ley 12-14 de codificación de ataques)
- **Output only.** permitir cualquier entrada hasta el modelo; aumentar el costo; exponer al atacante el razonamiento interno―
- **Custom only.**无法稳健覆盖各类类别;regexes 很脆弱──

La capa es la práctica de la aceptación.

### Descripción de Azure

Moderador de contenido de Azure: 2024 años 2 meses obsoleto, 2027 años 2 meses retirado.

### Donde esto encaja en la Fase 18

Lección 16 En el contexto del equipo rojo 中覆盖 умерен­ting toolsing。Lección 29 覆盖部署 умерен­tment──Lección 30 以当前双用途能力证据 收尾──


```figure
an-moderation-layers
```

## Usalo
`code/main.py`构建一个三层调节套:input moderator(keyword + category score) 、output moderator(对 output 使用同一分类器) 、custom moderator(dominio reglas) 。 puedes ejecutar entradas 跑过它,并观察哪一层捕捉到了什么──

##  entregarlo
本课产 出  `outputs/skill-moderation-stack.md` Dado que se determina una implementación, se recomienda la configuración de la pila de moderación: entrada, utilización de un clasificador, salida, utilización de un clasificador, uso de algunas reglas personalizadas, así como casos de borde, uso de un juez 

##  ejercicios
1. 运行                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           `code/main.py` El informe de cada caso en que la capa de contacto

2. 扩展 harness,加入针对特定类别的Perspective-API-style toxicity scoring──comparar su comportamiento de umbral con el puntaje de categoría──

3. 阅读OpenAI Moderation API docs 和 Llama Guard 3 categoría lista。将每个OpenAI categoría 映射到最接近的Llama Guard categorías。找出三个无法干净映射的类型。

4. Para la implementación de código-asistente (por ejemplo, Copilot de GitHub) diseñar la pila de moderación.

5. Moderador de contenido de Azure se retirará en 2027 años de febrero.

## 关键术语: "El hombre es un hombre"
| Term | What people say | What it actually means |
|------|-----------------|------------------------|
| OpenAI Moderation | "omni-moderation-latest" | 基于 GPT-4o 的 13-category (text) classifier，带部分 Multimodal support |
| Perspective API | "Google Jigsaw toxicity" | Pre-LLM-era toxicity scoring baseline |
| Llama Guard | "MLCommons 14-category" | Meta 的 hazard classifier（v3：8B text，8 langs；v4：12B Multimodal） |
| Input moderation | "pre-generation filter" | model call 前作用于 user prompt 的 classifier |
| Output moderation | "post-generation filter" | delivery 前作用于 model output 的 classifier |
| Custom moderation | "domain rules" | Deployment-specific rules（regex、allowlist、policy） |
| Layered moderation | "all three layers" | 标准生产部署模式 |

## 延伸阅读
- [OpenAI Moderation API docs](https://platform.openai.com/docs/api-reference/moderations) punto final de omni-moderación
- [Meta PurpleLlama + Llama Guard](https://github.com/meta-llama/PurpleLlama) Llama Guard repo
- [Google Jigsaw Perspective API](https://perspectiveapi.com/) Posibilidad de la toxicidad
- [Azure AI Content Safety](https://learn.microsoft.com/en-us/azure/ai-services/content-safety/) reemplazo de Azure
