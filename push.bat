@echo off
set /p msg="Please enter the commit content : "
git add .
git commit -m "%msg%"
git push origin main