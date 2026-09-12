@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ========================================
echo   EvoSnake 一键更新 + 测试 + 上传微信
 echo ========================================
 echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [缺少 Git] 请先安装 Git for Windows。
  echo 安装完成后重新双击本文件。
  pause
  exit /b 10
)

where node >nul 2>nul
if errorlevel 1 (
  echo [缺少 Node.js] 请先安装 Node.js LTS。
  echo 安装完成后重新双击本文件。
  pause
  exit /b 11
)

echo [1/5] 拉取 GitHub 最新代码...
git pull --ff-only
if errorlevel 1 goto :fail

echo.
echo [2/5] 准备微信 CI 依赖...
if not exist "node_modules\miniprogram-ci\package.json" (
  call npm install --no-audit --no-fund
  if errorlevel 1 goto :fail
) else (
  echo miniprogram-ci 已安装，跳过。
)

echo.
echo [3/5] 运行小游戏自动测试...
call npm run test:minigame
if errorlevel 1 (
  echo.
  echo ❌ 测试失败，已阻止上传微信。
  pause
  exit /b 20
)

echo.
echo [4/5] 检查代码上传密钥...
set "KEYDIR=%USERPROFILE%\.evosnake"
set "KEYFILE=%KEYDIR%\private.wx2ce1b5022e1d37f0.key"
if not exist "%KEYFILE%" (
  if not exist "%KEYDIR%" mkdir "%KEYDIR%"
  echo.
  echo ❌ 没找到微信代码上传密钥：
  echo %KEYFILE%
  echo.
  echo 已为你创建目录并打开。
  echo 请把微信后台下载的 .key 文件复制进去，
  echo 并重命名为：private.wx2ce1b5022e1d37f0.key
  start "" "%KEYDIR%"
  pause
  exit /b 21
)

echo 密钥已找到。

echo.
echo [5/5] 上传到微信小游戏后台...
call npm run wechat:upload
if errorlevel 1 goto :fail

echo.
echo ========================================
echo ✅ 全流程完成
 echo GitHub 已同步 / 测试通过 / 微信上传成功
 echo ========================================
pause
exit /b 0

:fail
echo.
echo ❌ 流程失败，请把这个窗口的错误截图发给 ChatGPT。
pause
exit /b 1
