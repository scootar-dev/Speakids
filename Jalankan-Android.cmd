@echo off
setlocal
cd /d "%~dp0"
where flutter >nul 2>&1
if errorlevel 1 (
  echo Pasang Flutter SDK dan tambahkan folder bin ke PATH. Lihat README.md.
  pause
  exit /b 1
)
call dart tool/setup_android.dart
if errorlevel 1 goto gagal
call flutter pub get
if errorlevel 1 goto gagal
call flutter run
if errorlevel 1 goto gagal
exit /b 0
:gagal
echo Periksa pesan di atas dan hasil flutter doctor.
pause
exit /b 1
