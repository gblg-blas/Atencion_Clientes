@echo off
setlocal
cd /d "%~dp0"
echo Preparando el sistema de turnos. La primera vez puede tardar unos minutos...
if not exist "backend\.venv\Scripts\python.exe" py -3 -m venv backend\.venv
call backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
if errorlevel 1 (echo No se pudieron instalar las dependencias de Python.& pause & exit /b 1)
if not exist "frontend\node_modules" (cd frontend & call npm install & cd ..)
if errorlevel 1 (echo No se pudieron instalar las dependencias de Angular.& pause & exit /b 1)
start "API Turnos" /min "%~dp0backend\.venv\Scripts\python.exe" -m uvicorn main:app --app-dir "%~dp0backend" --host 127.0.0.1 --port 8000
start "Interfaz Turnos" /min cmd /c "cd /d ""%~dp0frontend"" && npm start"
echo Esperando a que inicie la interfaz...
timeout /t 12 /nobreak >nul
start "" http://localhost:4200
echo Sistema abierto en http://localhost:4200
echo Para cerrar el sistema, cierra las ventanas de API Turnos e Interfaz Turnos.
pause
