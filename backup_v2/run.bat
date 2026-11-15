@echo off
echo ========================================================
echo   Starting Farm Shift V2 - Advanced Agricultural Intelligence
echo   Pure HTML5, CSS3, and Vanilla JavaScript Architecture
echo ========================================================

rem Start the local Python server for HTTP asset serving and API backward-compatibility
start /B python app.py

timeout /t 2 /nobreak >nul

rem Open the default web browser to the dashboard
start http://127.0.0.1:5000/

echo Farm Shift V2 is running at http://127.0.0.1:5000/
echo You can also open index.html directly in any web browser.
pause
