param (
    [bool]$RunTests = $true
)

Write-Host "Setting up Python Virtual Environment..."
python -m venv venv

# Activate venv and install python dependencies
$VenvActivate = ".\venv\Scripts\Activate.ps1"
if (Test-Path $VenvActivate) {
    & $VenvActivate
}
else {
    Write-Host "Failed to find virtual environment activation script."
    exit 1
}

Write-Host "Upgrading pip and installing python requirements..."
python -m pip install --upgrade pip
pip install -r requirements.txt

# Install Monaco Editor / CodeMirror
Write-Host "Installing Monaco Editor and CodeMirror natively via npm..."
$StaticDir = Join-Path (Get-Location) "static"
if (-Not (Test-Path $StaticDir)) {
    New-Item -ItemType Directory -Path $StaticDir | Out-Null
}

Push-Location $StaticDir
if (-Not (Test-Path "package.json")) {
    npm init -y | Out-Null
}
npm install monaco-editor codemirror
Pop-Location

if ($RunTests) {
    Write-Host "`nRunning Environment Verification Script..."
    python verify_env.py
    
    Write-Host "`nRunning Dataset Preparation..."
    python prepare_dataset.py
}

Write-Host "`nSetup Completed Successfully!"
