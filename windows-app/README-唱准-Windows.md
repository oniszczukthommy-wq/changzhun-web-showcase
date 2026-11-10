# 唱准助手 Windows 测试版

这个目录基于开源 OnKey 提交 `2f5b0e5d07ac924c769bc6fedccb186cc98b465d`，加入唱准中文界面与主题歌单、Windows QQ 音乐和网易云音乐客户端适配、播放/暂停、设备检查，以及学习完整度不确定时的提示。

## 使用

1. 打开 QQ 音乐或网易云音乐 Windows 客户端，在客户端选择歌曲。网易云需要在“设置 → 系统”中开启 **SMTC**，以向系统和第三方软件提供当前播放信息。
2. 首次播放请从歌曲开头播放到自然结束，等待唱准的后台分析完成；随后从头播放并跟唱。
3. 唱准底部的播放按钮或空格键可以控制当前播放器的播放和暂停；选歌、切歌与拖动进度仍在音乐客户端操作。
4. 首页或窗口底部的“设备检查”可查看音乐客户端状态并测试麦克风。耳机有助于减少伴奏漏入麦克风。

网易云的部分 Windows 版本不会通过系统媒体会话提供准确的歌曲时长和进度。唱准会依据已播放音频估算，并对学过的歌曲使用本地音频指纹校正；提前切歌或从中途开始时，系统无法确认是否学完。时长为估算值时会显示“完整度待确认”，这不是已完整学习的证明，系统仍可用现有片段进行跟唱和评分。

曾在一台 Windows 11 电脑上验证 QQ 音乐和网易云的歌曲识别、音频采集、播放暂停、歌曲学习与跟唱；网易云已学歌曲拖回开头后可重新定位。不同版本播放器、歌曲和设备尚需进一步验证。

## 构建说明

这是源码快照，不是可直接下载使用的安装包。需要 Windows x64、Node.js、Rust/Tauri 2 所需的编译环境、WebView2、ONNX Runtime 1.22 DirectML 及相关开发工具。项目保留上游的构建脚本：

- 根目录运行 `npm ci`，然后运行 `npm ci --prefix ui` 安装前端构建依赖。
- 按 [模型说明](src-tauri/models/README.md) 和 `scripts/requirements-models.txt` 准备 Python 模型导出环境，使用 `scripts/fetch-models.sh` 获取或导出大型模型。
- 使用 `scripts/fetch-directml.sh` 准备 DirectML 运行库，阅读脚本中的版本与校验要求。
- 在依赖齐备的 Windows 构建环境中，运行 `npx tauri build --no-bundle --config src-tauri/tauri.windows.conf.json`；本机验证使用了 Windows GNU Rust 工具链、llvm-mingw 和配置好的 ONNX Runtime 动态库/导入库。不同工具链可能需要额外配置；尚未验证全新电脑一键构建。
- 界面测试：在 `ui` 目录执行 `npm test`。本机已通过 91 项界面测试与 352 项 Windows 后端测试（7 项手动/渲染测试跳过）。

仓库保留上游原本随源码提交的 `src-tauri/models/crepe-tiny.onnx`，这是实时音高检测构建所需的小模型；其余大型模型、DirectML DLL、依赖目录、构建结果、用户录音和练习数据均未提交。

## 来源与许可

保留 [LICENSE](LICENSE)、[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) 与各模型和第三方依赖的许可及署名。原有 OnKey 文档保留在本目录中；其中的产品、平台和发布说明不一定适用于本测试版。
