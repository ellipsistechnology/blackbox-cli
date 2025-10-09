@echo off
export MSYS_NO_PATHCONV=1
call npm run build
cd dev
node ../dist/index.js %*
cd ..