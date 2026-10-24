# Evidence: cheatsheets/lora-fine-tuning.md

L08 = phases/11-llm-engineering/08-fine-tuning-lora, ADV = L08/outputs/prompt-lora-advisor.md, SKILL = L08/outputs/skill-fine-tuning-guide.md, SFT = phases/10-llms-from-scratch/06-instruction-tuning-sft, C38 = phases/19-capstone-projects/38-classifier-finetuning, C39 = phases/19-capstone-projects/39-instruction-tuning-sft

## 任务 (task-table, 8)
- get_peft_model(model, lora_config): L08/docs/en.md:445
- model.print_trainable_parameters(): L08/docs/en.md:446
- BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4"): L08/docs/en.md:454-456
- count_parameters(model): L08/docs/en.md:294-303; L08/code/lora.py:55
- model.save_pretrained("./lora-adapter"): L08/docs/en.md:500
- merge_lora_weights(model): L08/docs/en.md:309, 414
- F.cross_entropy(..., ignore_index=ignore_index): C39/code/main.py:439-443
- freeze_body(model): C38/code/main.py:173-179; C38/docs/en.md:123

## 一层中的 LoRA 路径 (architecture, 8 nodes)
- Input x: L08/docs/en.md:60
- Output y after the merge: L08/docs/en.md:65
- Frozen W, A, B feed the merge: L08/docs/en.md:60-64
- W is out x in: L08/docs/en.md:41
- A r x in, Gaussian init: L08/docs/en.md:49, 72
- B out x r, zero init: L08/docs/en.md:49, 72
- Scale alpha / r: L08/docs/en.md:76-79
- Add Wx + scaled BAx: L08/docs/en.md:79
- Merged W' = W + (alpha/r) BA: L08/docs/en.md:183

## 从零实现 LoRA (annotated-code, 13 lines)
- LoRALayer, __init__, scaling, A, B, forward: L08/docs/en.md:233-244; L08/code/lora.py:6-17
- LinearWithLoRA freeze loop and forward: L08/docs/en.md:252-264; L08/code/lora.py:20-29
- comment "BA starts at zero": L08/docs/en.md:247. "freeze W": L08/docs/en.md:267
- the __init__ body of LinearWithLoRA is summarized in one comment line (L08/docs/en.md:253-258)

## 用 PEFT 做 QLoRA (annotated-code, 11 lines)
- BitsAndBytesConfig 4 fields: L08/docs/en.md:454-459
- from_pretrained with quantization_config, device_map="auto": L08/docs/en.md:461-465 (model name replaced by <model>)
- LoraConfig task_type, r=16, lora_alpha=32, lora_dropout=0.05, target_modules: L08/docs/en.md:437-443
- get_peft_model: L08/docs/en.md:445, 467
- save_pretrained, 10-100MB: L08/docs/en.md:500, 503
- double quant meaning: L08/docs/en.md:133. query and value: L08/docs/en.md:100

## 一次 SFT 训练步 (flow, 7)
1. template <INST> ... <RESP> ...: C39/docs/en.md:22-25
2. INST_ID 256, RESP_ID 257, PAD_ID 258: C39/docs/en.md:67-69; C39/code/main.py:40-42
3. sft_collate pads to longest: C39/docs/en.md:74, 134; C39/code/main.py:397-410
4. -100 on instruction, padding, boundary: C39/docs/en.md:75-78; C39/code/main.py:414-420
5. model sees full sequence: C39/docs/en.md:46
6. shifted_loss, i predicts i+1, ignore_index=-100: C39/docs/en.md:40, 89; C39/code/main.py:432-443
7. Adam, exact-match every fifth epoch: C39/docs/en.md:103, 105

## 关键公式 (concepts, 6)
- y = Wx + BAx, W frozen: L08/docs/en.md:43-46
- scaled update: L08/docs/en.md:79
- 2 · r · d instead of d^2: L08/docs/en.md:13
- r=16 on 4096x4096, 131,072 of 16,777,216, 0.78%: L08/docs/en.md:51-54
- merge W' = W + (alpha/r) · BA, no overhead: L08/docs/en.md:183
- 8B fp16 about 56GB: L08/docs/en.md:20

## 默认值 (8)
- r 16: SKILL:51
- lora_alpha 32, 2 x rank, alpha = rank conservative: SKILL:51; ADV:35-36; L08/docs/en.md:440
- lora_dropout 0.05, 0.1 below 5K: SKILL:54; ADV:56-57
- target_modules q_proj, v_proj: ADV:40, 43
- QLoRA lr 2e-4: SKILL:53; ADV:46
- LoRA fp16 lr 5e-5: SKILL:53
- full SFT lr 2e-5, 15x lower: SFT/docs/en.md:125, 132
- epochs 1-3: SKILL:55

## 故障排查 (7)
- NaN losses, pad token: SKILL:63
- loss not decreasing, try 2e-4: SKILL:88
- overfitting fix: SKILL:95
- rank too low or wrong targets: SKILL:96-97
- general skills drop, 1e-5 to 5e-5, 1-3 epochs: SFT/docs/en.md:138, 142, 144
- model predicts instruction without mask: C39/docs/en.md:143; fix C39/docs/en.md:75-77
- OOM, paged optimizer, paged_adamw_8bit: L08/docs/en.md:135, 489

## 缩写 (8)
- LoRA: L08/docs/en.md:524
- QLoRA: L08/docs/en.md:525
- NF4 16 levels at quantiles: L08/docs/en.md:131, 528
- PEFT: L08/docs/en.md:168
- TRL: L08/docs/en.md:169
- SFT: SFT/docs/en.md:590
- ChatML: SFT/docs/en.md:82-90
- Double quantization to fp8: L08/docs/en.md:133

## 问答 (5)
- B zero at init: L08/docs/en.md:72, 247
- alpha scales update: L08/docs/en.md:82
- merge or separate: L08/docs/en.md:181-185
- mask the instruction: C39/docs/en.md:143
- when not to fine-tune: L08/docs/en.md:195-201; SKILL:34-36

## 提示 (5)
- prompt, then RAG, then fine-tune: L08/docs/en.md:195-201
- evaluate every 100 steps, best checkpoint by eval loss: SKILL:56-57
- compare base plus prompt vs base plus LoRA on 200+: SKILL:70-72
- head only on 800 examples: C38/docs/en.md:132
- raw text loss rise above 10-15%: SFT/docs/en.md:478

## 选择方法 (command-table, 5)
- full fine-tune ~56GB, VRAM >= 2x model size: L08/docs/en.md:125; ADV:22
- LoRA fp16 base ~18GB, VRAM >= model size: L08/docs/en.md:126; ADV:23
- QLoRA 4-bit ~6GB, VRAM >= model size / 4: L08/docs/en.md:127; ADV:24
- r=16 multi-domain, instruction following, chat: ADV:30
- r=32 code generation, complex reasoning, math: ADV:31
