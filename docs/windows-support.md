# Windows 支持准备

状态：已开始共享算法与网页构建兼容准备，尚无可用 Windows 安装包。现有 Mac 版本可用，不代表当前源码已支持 Windows。

## 用户目标

Windows 电脑也能使用中文网页练唱、中文歌单、QQ 音乐网页版、实时音符与反馈、曲库、录音和练唱历史。继续采用浏览器页面与本地辅助程序；不把 Windows 用户引导到 Mac 安装包。

用户已确认暂时没有 Windows 电脑，先按 Windows 11 x64 准备；首个浏览器验证组合为 Edge / Chrome。暂不承诺 Windows 10、ARM64 或其他浏览器。浏览器扩展方案仍需后续确认。

## 可复用与需要适配的部分

| 部分 | 当前实现 | Windows 工作 |
| --- | --- | --- |
| 中文页面和歌单 | 静态 Next.js 页面 | 复用，并替换系统权限提示 |
| 本机网页桥接 | Rust HTTP/SSE、回放音频接口 | 复用协议，适配系统打开网页和文件操作 |
| QQ 网页歌曲信息、暂停与跳转 | DOM 解析 + macOS Apple Events | 复用 QQ 解析，新增经用户授权的浏览器连接方式；可选扩展与辅助程序配对，需验证与确认 |
| 音乐与麦克风采集 | Swift / Core Audio 三通道输入 | WASAPI 采集、麦克风选取、重采样、时钟对齐、设备变更恢复 |
| 模型推理 | ONNX Runtime + Core ML | 独立平台依赖；先保证 CPU 正确运行，再按硬件评估加速 |
| 录音 | macOS Audio Toolbox AAC 编解码 | Windows 可用的编解码实现与浏览器回放 |
| 音频视频导出、文件对话框 | AVFoundation / AppKit 等 | 平台实现与错误反馈；不可用功能明确显示 |
| 构建和启动退出 | xcrun / Swift、Mac bundle、Unix 信号和命令 | 平台条件构建、Windows 退出保存、安装器、资源与运行库打包 |

## 实现顺序

1. 明确 Windows 系统、架构、浏览器和测试设备，确认是否使用浏览器扩展。
2. 分离平台音频、权限、编解码、浏览器控制和系统操作接口；保持 Mac 回归检查。
3. 在 Windows 实现并验证采集与三通道协议，确认采集范围和麦克风时间对齐。
4. 接通 QQ 曲目时钟和原有学习、轨道、评分、历史、回放。
5. 用 Windows 原生构建环境生成安装器，并在真实设备完成安装、授权、切换输出设备、连续练唱和退出保存检查。

## 验收条件

- 全新 Windows 环境能安装并打开中文网页，无需安装开发工具。
- 在选定浏览器中播放 QQ 歌曲，能够同时收到音乐和麦克风；不得静默扩大采集范围。
- 第一遍学习完成，下一遍显示目标音符和实时歌声音高，完成后保存结果与可回放录音。
- 权限拒绝、自动播放限制、音乐未播放、浏览器连接断开、设备切换等情况有中文指引。
- 硬件实测前只能标记“Windows 开发中”，不能以 Mac 上测试通过代替 Windows 验证。

## 参考

- [Microsoft 按应用回环采集示例](https://learn.microsoft.com/en-us/samples/microsoft/windows-classic-samples/applicationloopbackaudio-sample/)：示例要求 Windows build 20348 或更高，Windows 10 的具体版本需要另行评估，不能默认使用按进程回环。
- [ONNX Runtime 执行后端](https://onnxruntime.ai/docs/execution-providers/)：可使用 CPU 以及平台相关加速后端。
- [ONNX Runtime Windows](https://onnxruntime.ai/docs/get-started/with-windows.html)：Windows 部署与运行方式。

## 已落实的代码准备

- `crates/changzhun-core` 提供无 Swift、Core Audio、AppKit、Core ML 依赖的共享算法库，包含重采样、音准数学、音符处理、节拍、CTC 与回声消除。
- Mac 主程序通过这个共享库使用同一份实现；不是另写一份仅供 CI 测试的代码。
- 核心模块单独锁定依赖，并与当前 Mac 版本使用同一 FFT 版本。
- `.github/workflows/portable-checks.yml` 在 Windows 和 macOS runner 上执行共享算法测试，在 Windows runner 上执行网页解析测试与 Next.js 静态构建。
- 新增真实音频契约检查，验证设备回调块大小变化不改变重采样输出，以及跨八度评分规则。
- GitHub 托管 runner 的测试不涉及真实 WASAPI 设备、麦克风、QQ 声音和人工跟唱；不能代替这些硬件验收。

本地检查命令：

```sh
cargo test --manifest-path crates/changzhun-core/Cargo.toml --locked
```
