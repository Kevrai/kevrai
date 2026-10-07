// renderer/bootstrap.js — first-run environment bootstrap page (v4.0.0).
//
// Goal: never leave a newbie staring at a technical error. This page:
//   1. Detects what is missing (Python interpreter vs pip deps vs sidecar crash)
//   2. Shows the actual sidecar stderr tail (why it failed, in plain sight)
//   3. Offers one-click buttons per platform:
//       - Windows: install Python + deps, in one click
//       - Linux/macOS: install deps via pip (Python should already be on PATH)
//   4. Retry button always available, and the page auto-retries after any
//      successful install.
"use strict";

const $ = (s) => document.querySelector(s);

function setBusy(busy) {
  document.querySelectorAll(".btn").forEach((b) => { b.disabled = busy; });
}

function appendLog(text) {
  const log = $("#bs-log");
  if (!text) return;
  log.hidden = false;
  log.textContent = (log.textContent + "\n" + text).split("\n").slice(-40).join("\n");
  log.scrollTop = log.scrollHeight;
}

function showLog() {
  const log = $("#bs-log");
  if (log) log.hidden = false;
}

function stageText(stage) {
  return ({
    download: "下载 Python 运行环境",
    extract: "解压",
    patch: "配置",
    "get-pip": "安装 pip",
    deps: "安装运行依赖",
  })[stage] || stage;
}

async function refreshStatus() {
  let st;
  try { st = await window.kevrai.bootstrapStatus(); }
  catch (e) {
    $("#bs-status").innerHTML = `<span class="err">状态检测失败：${e.message}</span>`;
    return;
  }

  const lines = [];
  if (st.python) {
    lines.push(`Python 解释器：<b class="ok">已找到</b>（${st.python}）`);
  } else {
    lines.push(`Python 解释器：<b class="err">未找到</b>`);
  }
  if (st.deps_missing) {
    lines.push(`运行依赖：<b class="warn">缺失</b>（后端启动时报 ModuleNotFoundError）`);
  } else if (st.python) {
    lines.push(`运行依赖：<b>待验证</b>（点下方按钮自动安装/验证）`);
  } else {
    lines.push(`运行依赖：<b class="err">未安装</b>`);
  }
  if (st.stderr_tail && st.stderr_tail.length) {
    lines.push(`<span class="warn">后端启动失败日志见下方</span>`);
  }
  $("#bs-status").innerHTML = lines.join("<br/>");

  const isWin = st.platform === "win32";

  // Windows only: offer one-click Python install (managed runtime).
  $("#btn-install").hidden = !!st.python || !isWin;
  $("#btn-install").disabled = !!st.python;

  // "安装运行依赖" — always visible when Python is available, so users can
  // both verify and (re)install deps from this page.
  $("#btn-deps").hidden = false;
  $("#btn-deps").disabled = !st.python;
  $("#btn-deps").textContent = st.deps_missing
    ? "一键安装运行依赖"
    : "安装/重装运行依赖";

  // Platform hint.
  if (!st.python && !isWin) {
    $("#bs-tip").innerHTML =
      "Linux / macOS：需要系统自带的 Python 3.10+。如果没有，请先安装 Python，"
      + "再回到本页点「安装运行依赖」。"
      + "<br/>命令：<code>sudo apt install python3 python3-pip</code> 或 "
      + "<code>brew install python</code>";
  } else if (!st.python && isWin) {
    $("#bs-tip").innerHTML =
      "Windows：点上方「一键安装 Python 环境」，我们下载官方 3.12 便携版"
      + "到用户目录，不污染系统。安装完成后会自动接着装依赖并重启。";
  } else {
    $("#bs-tip").innerHTML =
      "Kevrai Omni 的推理后端需要 Python 3.10+。为了保持安装包小巧，"
      + "Python 与推理引擎一样按需下载：点上方按钮即可在软件内自动完成，"
      + "全程无需命令行。下载源为国内镜像，安装位置在用户数据目录，不污染系统。";
  }

  if (st.stderr_tail && st.stderr_tail.length) {
    appendLog("--- sidecar stderr (last " + st.stderr_tail.length + " lines) ---");
    appendLog(st.stderr_tail.join("\n"));
  }
}

function wire() {
  window.kevrai.onBootstrapProgress((p) => {
    if (!p || typeof p !== "object") return;
    const bar = $("#bs-bar");
    bar.hidden = false;
    $("#bs-bar-fill").style.width = `${Math.max(0, Math.min(100, p.pct || 0))}%`;
    $("#bs-stage").textContent = `${stageText(p.stage)}… ${p.text || ""}`;
    appendLog(p.text);
  });

  $("#btn-install").addEventListener("click", async () => {
    setBusy(true);
    $("#bs-stage").textContent = "开始安装…";
    try {
      await window.kevrai.installPythonRuntime();
      $("#bs-stage").textContent = "安装完成，正在进入软件…";
    } catch (e) {
      appendLog("安装失败：" + e.message);
      $("#bs-stage").textContent = "安装失败，可查看下方日志后重试";
      setBusy(false);
    }
  });

  $("#btn-deps").addEventListener("click", async () => {
    setBusy(true);
    $("#bs-stage").textContent = "正在安装运行依赖…";
    try {
      await window.kevrai.installPythonDeps();
      $("#bs-stage").textContent = "安装完成，正在进入软件…";
    } catch (e) {
      appendLog("安装失败：" + e.message);
      $("#bs-stage").textContent = "安装失败，可查看下方日志后重试";
      setBusy(false);
    }
  });

  $("#btn-retry").addEventListener("click", async () => {
    setBusy(true);
    $("#bs-stage").textContent = "正在重新启动后端…";
    try {
      await window.kevrai.bootstrapRetry();
      $("#bs-stage").textContent = "启动成功，正在进入软件…";
    } catch (e) {
      appendLog("启动失败：" + e.message);
      $("#bs-stage").textContent = "启动仍失败：请先完成环境安装";
      setBusy(false);
      refreshStatus().catch(() => {});
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  wire();
  refreshStatus().catch(() => {});
});
