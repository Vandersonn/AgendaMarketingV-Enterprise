@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title AgendaMarketingV Enterprise 1.0 RC16.6.2 - Gerar Windows
cd /d "%~dp0.."

set "LOGDIR=%CD%\logs"
set "LOG=%LOGDIR%\compilacao-windows.log"
set "TEMP_RELEASES=%CD%\releases-novas"
if not exist "%LOGDIR%" mkdir "%LOGDIR%" >nul 2>nul

cls
echo ==========================================
echo   AgendaMarketingV Enterprise 1.0 RC16.6.2
echo   Geracao Windows robusta e diagnostico
echo ==========================================
echo.
echo Pasta do projeto:
echo %CD%
echo.

> "%LOG%" echo AgendaMarketingV Enterprise RC16.6.2
>>"%LOG%" echo Data: %DATE% %TIME%
>>"%LOG%" echo Pasta: %CD%
>>"%LOG%" echo.

if not exist "package.json" (
  echo ERRO: package.json nao encontrado.
  >>"%LOG%" echo ERRO: package.json nao encontrado.
  goto :erro
)
where node >nul 2>nul || (
  echo ERRO: Node.js nao encontrado. Instale o Node.js LTS 22 ou 24.
  >>"%LOG%" echo ERRO: Node.js nao encontrado.
  goto :erro
)
where npm >nul 2>nul || (
  echo ERRO: npm nao encontrado.
  >>"%LOG%" echo ERRO: npm nao encontrado.
  goto :erro
)

for /f "delims=" %%V in ('node --version') do set "NODE_VERSION=%%V"
for /f "delims=" %%V in ('call npm --version') do set "NPM_VERSION=%%V"
echo Node: !NODE_VERSION!
echo npm: !NPM_VERSION!
>>"%LOG%" echo Node: !NODE_VERSION!
>>"%LOG%" echo npm: !NPM_VERSION!
echo.

rem Nunca aceite node_modules copiada de outro computador/sistema.
set "DEPS_OK=1"
if not exist "node_modules\typescript\bin\tsc" set "DEPS_OK=0"
if not exist "node_modules\vite\bin\vite.js" set "DEPS_OK=0"
if not exist "node_modules\electron-builder\out\cli\cli.js" set "DEPS_OK=0"
if not exist "node_modules\electron\dist\electron.exe" set "DEPS_OK=0"

if "!DEPS_OK!"=="0" (
  echo Instalando dependencias limpas para este Windows...
  >>"%LOG%" echo Instalando dependencias limpas para este Windows...
  if exist "node_modules" (
    echo Removendo instalacao incompleta...
    rmdir /s /q "node_modules" >>"%LOG%" 2>&1
    if exist "node_modules" (
      echo ERRO: nao foi possivel remover node_modules.
      >>"%LOG%" echo ERRO: nao foi possivel remover node_modules.
      goto :erro
    )
  )
  set "NODE_ENV="
  set "npm_config_production=false"
  set "npm_config_omit="
  call npm ci --include=dev --registry=https://registry.npmjs.org/ --no-audit --no-fund --foreground-scripts >>"%LOG%" 2>&1
  if errorlevel 1 (
    echo ERRO: a instalacao das dependencias falhou.
    goto :erro
  )
) else (
  echo Dependencias locais validadas.
  >>"%LOG%" echo Dependencias locais validadas.
)

if not exist "node_modules\typescript\bin\tsc" goto :deps_erro
if not exist "node_modules\vite\bin\vite.js" goto :deps_erro
if not exist "node_modules\electron-builder\out\cli\cli.js" goto :deps_erro
if not exist "node_modules\electron\dist\electron.exe" goto :deps_erro

if exist "%TEMP_RELEASES%" rmdir /s /q "%TEMP_RELEASES%"
if exist "dist" rmdir /s /q "dist"
if exist "dist-web" rmdir /s /q "dist-web"

echo.
echo 1/3 Validando TypeScript...
>>"%LOG%" echo. & >>"%LOG%" echo === TYPESCRIPT ===
node "node_modules\typescript\bin\tsc" -b >>"%LOG%" 2>&1
if errorlevel 1 goto :erro

echo 2/3 Gerando aplicacao Web...
>>"%LOG%" echo. & >>"%LOG%" echo === VITE ===
node "node_modules\vite\bin\vite.js" build >>"%LOG%" 2>&1
if errorlevel 1 goto :erro
if not exist "dist\index.html" (
  >>"%LOG%" echo ERRO: dist\index.html nao foi criado.
  goto :erro
)
xcopy "dist" "dist-web\" /E /I /H /Y >>"%LOG%" 2>&1
if errorlevel 1 goto :erro

echo 3/3 Gerando instalador e versao portatil...
>>"%LOG%" echo. & >>"%LOG%" echo === ELECTRON BUILDER ===
node "node_modules\electron-builder\out\cli\cli.js" --win nsis portable --config.directories.output="releases-novas" >>"%LOG%" 2>&1
if errorlevel 1 goto :erro

set "EXE_ENCONTRADO="
for %%F in ("%TEMP_RELEASES%\*.exe") do if exist "%%~fF" set "EXE_ENCONTRADO=1"
if not defined EXE_ENCONTRADO (
  >>"%LOG%" echo ERRO: nenhum EXE foi criado em releases-novas.
  goto :erro
)

rem So substitui a pasta final depois de toda a geracao concluir.
if exist "releases-anteriores" rmdir /s /q "releases-anteriores"
if exist "releases" ren "releases" "releases-anteriores"
ren "releases-novas" "releases"

echo.
echo ==========================================
echo   COMPILACAO CONCLUIDA COM SUCESSO
echo ==========================================
echo.
echo Executaveis:
echo %CD%\releases
dir /b "releases\*.exe"
echo.
echo Aplicacao Web:
echo %CD%\dist-web
echo.
echo Registro completo:
echo %LOG%
start "" "%CD%\releases"
pause
exit /b 0

:deps_erro
>>"%LOG%" echo ERRO: dependencias obrigatorias nao foram instaladas.
echo ERRO: dependencias obrigatorias nao foram instaladas.
goto :erro

:erro
echo.
echo ==========================================
echo   FALHA NA COMPILACAO
echo ==========================================
echo.
echo Os executaveis anteriores foram preservados.
echo Abra e envie este arquivo para diagnostico:
echo %LOG%
echo.
echo Ultimas linhas do erro:
powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Test-Path -LiteralPath '%LOG%') { Get-Content -LiteralPath '%LOG%' -Tail 35 }"
echo.
pause
exit /b 1
