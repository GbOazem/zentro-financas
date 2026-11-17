@echo off
cd /d "%~dp0"
if not exist ".env.local" (
  echo.
  echo ATENCAO: configure o arquivo .env.local antes de iniciar.
  echo Veja o arquivo README.md para as instrucoes do Supabase.
  echo.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js/npm nao encontrados. Instale Node.js 22 LTS e tente novamente.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 (pause & exit /b 1)
)
echo.
echo Abrindo Zentro em http://localhost:3000
call npm run dev
pause
