# Launch backend and frontend servers in separate PowerShell windows using the project venv.

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPy = Join-Path $root ".venv\Scripts\python.exe"

if (-not (Test-Path $venvPy)) {
    Write-Error "Python venv not found at $venvPy. Create/activate the venv first."
    exit 1
}

# Backend on port 5000
Start-Process -WorkingDirectory $root -FilePath powershell -ArgumentList "-NoExit", "-Command", "`"$venvPy`" backend\app.py"

# Frontend static server on port 5500
$frontendDir = Join-Path $root "frontend"
Start-Process -WorkingDirectory $frontendDir -FilePath powershell -ArgumentList "-NoExit", "-Command", "`"$venvPy`" -m http.server 5500"

Write-Host "Started backend (5000) and frontend (5500) in new windows. Open http://127.0.0.1:5500"