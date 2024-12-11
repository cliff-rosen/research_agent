@echo off
echo Starting git backup...

git add .
if errorlevel 1 (
    echo Error: Failed to add files
    pause
    exit /b 1
)

git commit -m "backup"
if errorlevel 1 (
    echo Error: Failed to commit
    pause
    exit /b 1
)

git push
if errorlevel 1 (
    echo Error: Failed to push
    pause
    exit /b 1
)

echo Backup completed successfully
pause