@echo off
REM Database utility wrapper for Windows

REM Activate virtual environment if it exists
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)

REM Run the Python script with all arguments
python database_utils.py %*
