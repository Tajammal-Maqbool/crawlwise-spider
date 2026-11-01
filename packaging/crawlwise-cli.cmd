@echo off
set ELECTRON_RUN_AS_NODE=1
"%~dp0..\Crawlwise Spider.exe" "%~dp0app.asar\out\main\cli.js" %*
