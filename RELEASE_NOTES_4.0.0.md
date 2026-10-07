# Kevrai Omni v4.0.0 — 独立仓库发布与小白友好错误提示

## 主要变化

### 发布渠道
- **正式从 `Bullobis/kevrai-omni` 迁移至独立仓库 `Kevrai/kevrai`**：这是 v4.0.0 的官方发布渠道。
  - 内置更新（electron-updater）现在指向 `Kevrai/kevrai` 的 GitHub Releases。
  - 老的 `Bullobis/kevrai-omni` 保留作历史版本归档，不再发布新版本。
- **协议升级：Kevrai Omni Community License v2.1 → v2.5**（已在 Bullobis 仓库 commit `32c0741` 落地）
  - 新增 Article 20 合规审计与年度报告
  - 新增 12.10/12.11 执法成本追偿、连带责任
  - 新增 17.7/17.8 反规避模式列举、身份归属穿透
  - 新增 18.6/18.7/18.8 影子模型 / 日志训练 / 合成竞品禁令

### 小白友好错误提示
- **Python sidecar 启动失败时的错误弹框重写**（`electron/main.js`）：
  - 之前的裸 `dialog.showErrorBox` 直接把 `err.message`（英文技术栈）丢给小白用户看，看不懂。
  - 现在弹框改为中文友好诊断，包含：
    - 常见原因列表（Python 缺失、端口占用、依赖没装、二进制损坏）
    - 「打开环境准备页」按钮 → 直接跳进软件内引导页（Windows 可一键装 Python + deps）
    - 「复制日志到剪贴板」按钮 → 一键复制 15 行 stderr 摘要
    - 「打开帮助」按钮 → 打开 kevrai.dpdns.org
  - 引导页机制原本已存在（`renderer/bootstrap.html`），这次把非「缺依赖」类错误也接管过来。

### 内置更新（Auto-Update）
- **代码里已完整实现**：`electron-updater ^6.3.0` + `kevrai:check-updates` / `download-update` / `install-update` IPC + 设置按钮 + 命令面板。
- **v4.0.0 起真正生效**：`electron-builder.yml` 的 `publish` 段从 `Bullobis/kevrai-omni` 改为 `Kevrai/kevrai`。
  - `autoDownload: false` — 只检查不自动下载
  - `autoInstallOnAppQuit: true` — 用户点了「稍后」下次退出时安装
  - `provider: github` + `releaseType: release` + `vPrefixedTagName: true`
- 前提：v4.0.0 的 GitHub Release 需要带 artifacts 上传，electron-updater 才能读到 `latest.yml`。

## 安装
- Linux：`.AppImage` 与 `.deb`（amd64）。
- macOS：arm64 与 x64 的 `.dmg`。
- Windows：`.exe` 安装包与 `.zip`。

## 说明
- 版本号跳到 4.0.0 是产品发布渠道切换的语义化标记，不是破坏性 API 变更。
- 历史版本 v3.6.0 ~ v3.24.0 已作为 tag 完整保留在 `Kevrai/kevrai`，不再单独发 Release。
