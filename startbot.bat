@echo off
set "SCRIPT_DIR=%~dp0"
cd "%SCRIPT_DIR%"
call npm install
pause
node start.mjs
pause