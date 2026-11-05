# Evidence: cheatsheets/video-3d-vision.md

Abbreviations: P04 = phases/04-computer-vision. L12 = P04/12-video-understanding, L13 = P04/13-3d-vision-nerf, L22 = P04/22-3d-gaussian-splatting, L26 = P04/26-monocular-depth, L27 = P04/27-multi-object-tracking. d = docs/en.md, c = code/main.py.

## 视频模型 (concepts, 8)
- 2D + pool, 2D CNN per frame, average over time, cannot model motion: L12/d:46, 54
- 3D conv (T, H, W) kernels, models motion, C3D, I3D, SlowFast: L12/d:61, 66
- I3D inflate 2D kernel along time, 3x3 to 3x3x3: L12/d:63
- (2+1)D 2D spatial + 1D temporal, fewer parameters: L12/d:212, 266
- Divided attention, one over time, one over space: L12/d:81
- Uniform sampling, default for 2D+pool: L12/d:99
- Dense sampling, random contiguous window, 3D convs: L12/d:100
- Clip-level vs video-level accuracy, report both: L12/d:107-111

## 选择 3D、深度或跟踪模型 (concepts, 8)
- NeRF, MLP is the scene, hours to train: L13/d:70, 109, L22/d:19
- 3DGS explicit Gaussians, minutes to train: L22/d:21
- Depth Anything V3 relative depth, frozen DINOv2: L26/d:32, 48, 70
- ZoeDepth metric depth, sensitive to intrinsics: L26/d:32
- Marigold diffusion, 10-50 denoising steps: L26/d:80
- ByteTrack for pedestrians / cars at 30+ fps: L27/d:256
- DeepSORT / StrongSORT heavy occlusions, ReID: L27/d:258
- SAM 3.1 Object Multiplex for many instances of one class in a crowd: L27/d:257

## 基于检测的跟踪 (architecture, 8 nodes)
- Frame t: L27/d:31
- Detector, detections at t: L27/d:31
- Hungarian assignment IoU / cosine / motion: L27/d:34
- Update matched tracks: L27/d:36
- Tracks up to t-1: L27/d:32
- Kalman predict, constant velocity: L27/d:32-33, 58
- Birth new tracks: L27/d:37
- Age unmatched tracks, delete after N: L27/d:38

## 公式 (concepts, 8)
- PointNet f(P) = max MLP(p), permutation invariance: L13/d:39-45
- Positional encoding sin/cos(2^l pi p), up to L=10: L13/d:89-93
- Volume render C(r), T_i, delta_i: L13/d:97-103
- Sigma = R S S^T R^T, Sigma' = J W Sigma W^T J^T: L22/d:39, 64-71
- C_pixel = sum alpha_i T_i c_i, T_i = prod (1 - alpha_j): L22/d:79-86
- Pinhole X, Y, Z: L26/d:86-93
- AbsRel mean(|d_pred - d_gt| / d_gt), lower is better: L26/d:101
- MOTA 1 - (FN + FP + ID switches) / GT: L27/d:93

## 帧、膨胀与 (2+1)D (annotated-code, 8 lines)
- sample_uniform, sample_dense: L12/d:134, 141, L12/c:7, 16
- FramePool(num_classes=10), ResNet-18 per frame, mean over T: L12/d:153, 176
- x = torch.randn(2, 8, 3, 224, 224), (N, T, 3, H, W): L12/d:169, 177
- conv2d 3 to 64, inflate_2d_to_3d(conv2d, time_kernel=3), divide by time_kernel: L12/d:192, 200-201, 208
- Conv2Plus1D(3, 64) on torch.randn(1, 3, 8, 56, 56): L12/d:204, 230-231

## 渲染一条 NeRF 射线 (annotated-code, 8 lines)
- positional_encoding(x, L=10), (5, 3) to (5, 60): L13/d:183-186, L13/c:32
- t_vals = torch.linspace(2.0, 6.0, N), N = 64: L13/d:248-249
- delta, alpha, trans, weights, rendered, depth: L13/d:239-244, L13/c:68-69

## 深度指标与提升 (annotated-code, 8 lines)
- align_scale_shift(pred, gt), a * pred + b: L26/d:137, 193
- abs_rel_error, 0.05-0.1 for production: L26/d:101, 194
- delta_accuracy threshold=1.25, 0.9+ SOTA: L26/d:102, 125
- intr = (320.0, 320.0, 160.0, 120.0), fx, fy, cx, cy: L26/d:162, 171
- depth_to_point_cloud(depth, intr), (H, W, 3): L26/d:172-173
- pipeline depth-estimation Depth-Anything-V2-Large-hf, out["depth"] PIL grayscale to numpy: L26/d:205-212

## IoU 与匈牙利关联 (annotated-code, 10 lines)
- bbox_iou(track_boxes, det_boxes), cost = 1 - iou, 1e6 below threshold: L27/d:168-170, L27/c:50
- linear_sum_assignment(cost): L27/d:175, L27/c:54
- update when cost < 1.0: L27/d:176-178
- drop tracks older than max_age: L27/d:186, L27/c:66
- SimpleTracker iou_threshold=0.3, max_age=5: L27/d:152, L27/c:33
- tracker.step(dets, f) returns (t.id, t.bbox): L27/d:187, 211

## 命令与导出 (command-table, 8)
- pip install nerfstudio gsplat: L22/d:323
- ns-download-data example: L22/d:324
- ns-train splatfacto --data path/to/data, 10-30 minutes on RTX 4090: L22/d:325-328
- .ply raw Gaussian cloud, portable, largest file: L22/d:332
- .splat quantised format: L22/d:333
- KHR_gaussian_splatting glTF standard: L22/d:334
- UsdVolParticleField3DGaussianSplat OpenUSD: L22/d:335
- model.track(source, tracker="bytetrack.yaml"), YOLOv8 + ByteTrack: L27/d:249

## 默认值与数字 (defaults, 8)
- T 8, 16, 32, or 64, more T more signal and compute: L12/d:103
- time_kernel 3, divide by it: L12/d:189, 208
- NeRF L 10, L_dir=4: L13/d:93, 195
- 64 samples, t 2.0 to 6.0: L13/d:248-249, 257
- SH degree 3, 16 coefficients per channel, 48 floats: L22/d:39
- ~30,000 iterations: L22/d:92; ~100k to 1-5M Gaussians: L22/d:102
- iou_threshold 0.3, max_age=5: L27/d:152
- delta 1.25, within 25%: L26/d:102, 253

## 排障 (troubleshooting, 8)
- temporal pooling order-invariant, open door vs close door: L12/d:55; use motion models: L12/d:66, 73
- divide by time_kernel to keep BN statistics: L12/d:208
- NeRF blurry without positional encoding: L13/d:87, 93
- relative depth has no metric anchor, metric models need intrinsics: L26/d:29-32, 64
- reflective surfaces give plausible but wrong depth: L26/d:66
- align_scale_shift before abs_rel_error for MiDaS: L26/d:153
- ByteTrack second stage recovers ID switches near crowds, DeepSORT ReID: L27/d:51, 68
- Kalman predict continues a track through short occlusion: L27/d:58, 271

## 问题 (qa, 5)
- 3DGS same equation as NeRF volumetric render: L22/d:88
- 2D+pool reuses ImageNet backbone, within 5-10 points: L12/d:182
- IDF1 for who is who, HOTA for sports and academic comparison: L27/d:97
- no absolute scale without intrinsics, no occluded geometry: L26/d:64-65
- ByteTrack low-confidence second stage recovers short occlusions: L27/d:68
