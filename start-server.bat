@echo off
cd /d "%~dp0"
echo Iniciando servidor na porta 8080...
npx http-server -p 8080
pause
