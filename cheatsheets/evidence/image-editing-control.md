# Evidence: cheatsheets/image-editing-control.md

Abbreviations: CL = phases/08-generative-ai/08-controlnet-lora-conditioning, IP = phases/08-generative-ai/09-inpainting-outpainting-editing, SD = phases/04-computer-vision/11-stable-diffusion. d = docs/en.md, c = code/main.py.

## 进入 U-Net 的控制信号 (architecture, 9 nodes, 8 edges)
- Condition image: depth, pose, edges: CL/d:26
- ControlNet clones the encoder, trains the clone: CL/d:26, 135
- Zero conv, 1×1 initialized to zero, added to the decoder: CL/d:26, 29
- Prompt: SD/d:28
- Text encoder CLIP-L or T5: SD/d:28
- Frozen SD U-Net with cross-attention to text: SD/d:31, 47, CL/d:26
- Reference image: CL/d:54
- IP-Adapter, CLIP image tokens into cross-attention: CL/d:54
- LoRA W + BA on attention weights: CL/d:16, 137

## 文生图 (annotated-code, 12 lines)
- StableDiffusionPipeline.from_pretrained with runwayml/stable-diffusion-v1-5, float16, cuda: SD/d:118-121
- float16 halves VRAM: SD/d:132
- DPMSolverMultistepScheduler.from_config(pipe.scheduler.config): SD/d:139, SD/c:50
- guidance_scale=7.5, SD default w=7.5: SD/d:59, 125
- num_inference_steps=25 matches 50 with DDIM: SD/d:126, 132
- torch.Generator("cuda").manual_seed(42), images[0], image.save("dog.png"): SD/d:127-129

## Img2img、inpaint 与 LoRA (annotated-code, 10 lines)
- img2img with image=init_image, strength=0.6, guidance_scale=7.5: SD/d:157-162
- strength 0.0 unchanged, 1.0 full regeneration: SD/d:165
- mask from Image.open("dog_mask.png").convert("L").resize((512, 512)): SD/d:178
- inpaint with mask_image=mask, white pixels regenerate: SD/d:180-188
- pipe.load_lora_weights with weight_name: SD/d:193-196
- pipe.fuse_lora(lora_scale=0.8), bakes in, prevents swapping: SD/d:197, 202
- pipe.unfuse_lora() before a different adapter: SD/d:202
- pipe.set_adapters([...], adapter_weights=[...]) per request: CL/d:148

## 代码中的任务 (task-table, 8)
- pip install diffusers transformers accelerate: SD/c:44
- StableDiffusionImg2ImgPipeline: SD/d:148
- StableDiffusionInpaintPipeline: SD/d:170, IP/d:40
- FluxFillPipeline: IP/d:40
- EulerAncestralDiscreteScheduler: SD/d:137, 140, stochastic: SD/d:98
- pipe.image_processor.preprocess(img): IP/d:149
- latents=... skips one VAE encode: IP/d:149
- latent_dist.sample() * 0.18215: SD/d:212, SD/c:63

## 感知 mask 的反向循环 (flow, 7 steps)
1. x from N(0, I): IP/c:142
2. unmasked dims get sqrt(a_bar) clean plus noise: IP/c:144-147
3. eps_hat from the denoiser: IP/c:148-149
4. DDPM mean, noise only when t > 0: IP/c:150-156
5. loop from T - 1 down to 0: IP/c:143
6. unmasked dims pinned to clean at the end: IP/c:157-159
7. outpainting inverts the mask, same objective: IP/d:96

## 公式与数字 (concepts, 8)
- CFG formula: SD/d:56
- LoRA W' = W + alpha BA, 2·d·r instead of d²: CL/d:45, 48, 50
- d=640, r=16 gives 20k instead of 410k: CL/d:48
- ControlNet composition formula: CL/d:37
- 48x compute cut from 3x512x512 to 4x64x64: SD/d:19
- 9 input channels, 4 + 4 + 1: IP/d:32-35
- SDEdit t/T 0.3, 0.6, 0.9: IP/d:46-48
- Zero-conv init starts as identity, no harm: CL/d:32

## 编辑方法对比 (comparison, 5 rows)
- Input: image, mask, prompt: IP/d:16, 32-38. SDEdit image, noise level, prompt: IP/d:44. InstructPix2Pix image and instruction: IP/d:52. RePaint image and mask: IP/d:56
- Training: 9-channel U-Net: IP/d:32. SDEdit none: IP/d:44. InstructPix2Pix fine-tune on triples: IP/d:52. RePaint none, unconditional model: IP/d:56
- Keeps: outside the mask: IP/d:16. SDEdit coarse structure: IP/d:47. InstructPix2Pix structural fidelity: IP/d:18. RePaint outside the mask: IP/d:56
- Main knob: mask and CFG: IP/d:16, 102. SDEdit t/T or strength: IP/d:44; SD/d:165. InstructPix2Pix image and text scale: IP/d:52. RePaint resample steps: IP/d:56
- Use for: remove object, replace sky: IP/d:110-111. Style of one region: IP/d:114. Make it sunset: IP/d:115. RePaint without inpaint model: IP/d:56

## 条件控制工具对比 (comparison, 4 rows)
- Controls: CL/d:60-64
- Size: CL/d:60-64
- Mechanism: CL/d:135, 137, 140, 141
- Use when: CL/d:60-64

## 默认值 (defaults, 8)
- guidance_scale 7.5: SD/d:59, SD/c:24
- num_inference_steps 25 with DPM-Solver++: SD/d:126, 132
- strength 0.6, 0.5-0.7 for style transfer: SD/d:160, 165
- c dropped 10% of the time: SD/d:53
- VAE scale 0.18215, SDXL 0.13025: SD/c:23
- rank 4-16, 64-128 for heavy fine-tunes: CL/d:48
- sum of ControlNet weights 1.0 safe default: CL/d:103
- dilate the mask by 8-16 pixels: IP/d:100

## 故障排查 (troubleshooting, 8)
- alpha 2 or 3 over-stylized, keep alpha ≤ 1.5: CL/d:102
- two ControlNets at 1.0 overshoot: CL/d:103
- SDXL LoRA no-op on SD 1.5: CL/d:104
- fuse_lora prevents swapping, unfuse_lora: SD/d:202
- seams from naive approach, dilate or proper model: IP/d:100
- high CFG on small mask, reduce CFG: IP/d:102
- SDEdit fidelity cliff 0.5 to 0.6: IP/d:103
- prompt should describe the whole image: IP/d:104

## 何时用哪个 (tips, 7)
- ControlNet-Openpose + SDXL + text: CL/d:114
- ControlNet-Scribble or ControlNet-Canny: CL/d:117
- LoRA on ~30 curated images at rank 32: CL/d:112
- SD-Inpaint or Flux-Fill for small mask removal: IP/d:110
- SAM mask then SD-Inpaint: IP/d:116
- InstructPix2Pix or Flux-Kontext: IP/d:115, no separate mask: IP/d:151
- LCM-LoRA under 1s: SD/d:233

## 问答 (qa, 6)
- zero gate, output identical to base at step 0: CL/d:98
- hot-swap, merge ~3-5% faster but freezes alpha and base: CL/d:148
- strength 1.0 full regeneration: SD/d:165, 247
- 9-channel model sees surroundings: IP/d:38, 92
- scheduler decoupled from U-Net weights: SD/d:143
- ~1.5× step cost per active ControlNet: CL/d:149
