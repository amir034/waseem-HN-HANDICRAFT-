@echo off
cd /d "%~dp0"
echo Uploading 44 project files to GitHub (node_modules is NOT included)...
git add .
git commit -m "Update website with Blob login fix" 2>nul
git push origin main --force-with-lease
if errorlevel 1 (
  echo.
  echo Push failed. Sign in with GitHub username and a Personal Access Token.
  echo Create token: https://github.com/settings/tokens
  pause
) else (
  echo.
  echo Done! Vercel will redeploy automatically.
  pause
)
