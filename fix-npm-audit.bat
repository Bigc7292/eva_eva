@echo off
echo Fixing npm audit issues...
echo.

echo Running npm audit fix...
npm audit fix

echo.
echo Running npm audit fix --force for remaining issues...
npm audit fix --force

echo.
echo Done! Try committing your changes now.
pause
