@echo off
setlocal EnableDelayedExpansion
title [Sandban Archive] Windows Installer Compiler v1.0.0

echo =======================================================================
echo   SANDBAN ARCHIVE ^& PERSIAN OCR - AUTOMATED INSTALLER BUILD PIPELINE
echo =======================================================================
echo.

cd /d "%~dp0\.."
set "PROJECT_ROOT=%cd%"

:: 1. Environment & Prerequisite Validation
echo [*] Checking required build toolchains...
where node >nul 2>&1 || (echo [ERROR] Node.js runtime not found! && exit /b 1)

set "INNO_PATH=%ProgramFiles(x86)%\Inno Setup 6\ISCC.exe"
if not exist "!INNO_PATH!" (
    set "INNO_PATH=%ProgramFiles%\Inno Setup 6\ISCC.exe"
)
if not exist "!INNO_PATH!" (
    echo [ERROR] Inno Setup 6 compiler ISCC.exe was not detected!
    echo         Please download from https://jrsoftware.org/isdl.php
    exit /b 1
)
echo [OK] Inno Setup 6 compiler located at: !INNO_PATH!

:: 2. Prepare OCR assets
if not exist "%PROJECT_ROOT%\ocr_models\fas\fas.traineddata" (
    echo [*] Downloading Persian OCR model fas.traineddata ...
    call node "%PROJECT_ROOT%\scripts\fetch-tessdata.mjs" || exit /b 1
)

:: 3. Frontend + Electron Windows bundle
echo [*] Installing npm dependencies...
call npm install || exit /b 1
call node "%PROJECT_ROOT%\scripts\fetch-tesseract-runtime.mjs" || exit /b 1

echo [*] Building UI and Windows unpacked app...
call npm run build:ui || (echo [ERROR] Frontend packaging failed && exit /b 1)
call npx electron-builder --win dir --x64 --publish never || (
    echo [ERROR] electron-builder Windows dir target failed
    exit /b 1
)

if not exist "%PROJECT_ROOT%\dist-electron\win-unpacked\ArchiveOCR.exe" (
    echo [ERROR] Expected dist-electron\win-unpacked\ArchiveOCR.exe missing
    exit /b 1
)

:: 4. Optional: stage portable offline zip
call node "%PROJECT_ROOT%\scripts\pack-offline.mjs" || exit /b 1

:: 5. Inno Setup compile
echo [*] Triggering Inno Setup 6 compiler (LZMA2 Ultra compression)...
"!INNO_PATH!" /Qp "%PROJECT_ROOT%\installer\ArchiveApp.iss"
if %errorlevel% neq 0 (
    echo [ERROR] Inno Setup compilation encountered a critical error.
    exit /b %errorlevel%
)

echo.
echo =======================================================================
echo   BUILD COMPLETED SUCCESSFULLY: Output\ArchiveOCR_Setup_v1.0.0.exe
echo =======================================================================
exit /b 0
