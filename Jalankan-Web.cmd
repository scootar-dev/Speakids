@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js tidak terdeteksi. Silakan pasang Node.js dari https://nodejs.org
  pause
  exit /b 1
)
echo Menjalankan server lokal SpeaKids...
node server.js
pause

