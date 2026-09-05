# setup_training.ps1
# Setup script for Cattle & Buffalo Breed Classification Pipeline (Windows PowerShell)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Setting up Cattle & Buffalo Breed ML Pipeline Environment" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Python
$pythonCmd = "python"
if (-not (Get-Command $pythonCmd -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python is not found on PATH. Please install Python 3.10+." -ForegroundColor Red
    exit 1
}

$pyVersion = & $pythonCmd --version
Write-Host "Found system Python: $pyVersion" -ForegroundColor Green

# 2. Virtual Environment
$venvPath = ".\.venv"
if (-not (Test-Path "$venvPath\Scripts\activate.ps1")) {
    Write-Host "Creating local virtual environment at $venvPath..." -ForegroundColor Yellow
    & $pythonCmd -m venv $venvPath
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create virtual environment." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Virtual environment already exists at $venvPath." -ForegroundColor Green
}

$venvPython = "$venvPath\Scripts\python.exe"

# 3. Upgrade pip
Write-Host "Upgrading pip..." -ForegroundColor Yellow
& $venvPython -m pip install --upgrade pip

# 4. Install PyTorch with CUDA 12.6 Support
Write-Host "Installing PyTorch with CUDA 12.6 wheels..." -ForegroundColor Yellow
& $venvPython -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126

# 5. Install other requirements
Write-Host "Installing project requirements..." -ForegroundColor Yellow
& $venvPython -m pip install -r requirements.txt

# 6. Verify Installation
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "Verifying PyTorch & CUDA Environment" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

& $venvPython -c @"
import sys
import torch
import torchvision

print(f'Python version      : {sys.version.split()[0]}')
print(f'PyTorch version     : {torch.__version__}')
print(f'Torchvision version : {torchvision.__version__}')
print(f'CUDA available      : {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'GPU Device Name     : {torch.cuda.get_device_name(0)}')
    print(f'GPU Device Count    : {torch.cuda.device_count()}')
    print(f'VRAM Allocated      : {torch.cuda.memory_allocated(0)/(1024**2):.1f} MB')
    print(f'VRAM Reserved       : {torch.cuda.memory_reserved(0)/(1024**2):.1f} MB')
else:
    print('WARNING: Running in CPU mode. GPU acceleration is not available.')
"@

Write-Host "`nSetup complete! You can now activate the environment using:" -ForegroundColor Green
Write-Host ".\.venv\Scripts\Activate.ps1" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
