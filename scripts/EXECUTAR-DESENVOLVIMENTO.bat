@echo off
setlocal EnableExtensions
chcp 65001 >nul
title AgendaMarketingV Enterprise - Desenvolvimento

cd /d "%~dp0.."

if not exist "package.json" (
  echo ERRO: package.json nao encontrado.
  pause
  exit /b 1
)

if not exist "node_modules\.bin\vite.cmd" (
  echo Instalando dependencias de desenvolvimento para Windows...
  if exist "node_modules" rmdir /s /q "node_modules"
  call npm ci --include=dev --registry=https://registry.npmjs.org/ --no-audit --no-fund
  if errorlevel 1 (
    echo Falha ao instalar dependencias.
    pause
    exit /b 1
  )
)

call npm run dev
