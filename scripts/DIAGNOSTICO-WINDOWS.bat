@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0.."
if not exist "logs" mkdir "logs" >nul 2>nul
set "LOG=%CD%\logs\diagnostico-windows.txt"
(
 echo AgendaMarketingV Enterprise - Diagnostico Windows
 echo Data: %DATE% %TIME%
 echo Pasta: %CD%
 echo.
 echo === SISTEMA ===
 ver
 echo PROCESSOR_ARCHITECTURE=%PROCESSOR_ARCHITECTURE%
 echo.
 echo === NODE E NPM ===
 where node
 node --version
 where npm
 call npm --version
 echo.
 echo === ARQUIVOS ===
 if exist package.json (echo package.json OK) else (echo package.json AUSENTE)
 if exist package-lock.json (echo package-lock.json OK) else (echo package-lock.json AUSENTE)
 if exist node_modules\typescript\bin\tsc (echo TypeScript OK) else (echo TypeScript AUSENTE)
 if exist node_modules\vite\bin\vite.js (echo Vite OK) else (echo Vite AUSENTE)
 if exist node_modules\electron-builder\out\cli\cli.js (echo electron-builder OK) else (echo electron-builder AUSENTE)
 if exist node_modules\electron\dist\electron.exe (echo Electron Windows OK) else (echo Electron Windows AUSENTE)
 echo.
 echo === NPM CONFIG ===
 call npm config get registry
 call npm config get production
 call npm config get omit
) > "%LOG%" 2>&1
type "%LOG%"
echo.
echo Diagnostico salvo em:
echo %LOG%
pause
