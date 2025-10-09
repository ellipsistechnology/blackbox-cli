@echo off
call npm run build
cd dev
node ../dist/index.js %*
cd ..