# Install backend dependencies for Smart Township Access Control System
Write-Host "Installing backend dependencies..." -ForegroundColor Green

# Install packages one by one to avoid interruptions
$packages = @(
    "fastapi==0.115.6",
    "uvicorn[standard]==0.32.1",
    "sqlalchemy==2.0.36",
    "alembic==1.14.0",
    "python-jose[cryptography]==3.3.0",
    "passlib[bcrypt]==1.7.4",
    "python-multipart==0.0.20",
    "python-dotenv==1.0.1"
)

Write-Host "`nInstalling core dependencies..." -ForegroundColor Cyan
foreach ($package in $packages) {
    Write-Host "Installing $package..." -ForegroundColor Yellow
    pip install $package --quiet
}

Write-Host "`nInstalling OCR dependencies (this may take a few minutes)..." -ForegroundColor Cyan
Write-Host "Installing opencv-python-headless..." -ForegroundColor Yellow
pip install opencv-python-headless --quiet

Write-Host "Installing easyocr (large package ~100MB)..." -ForegroundColor Yellow
pip install easyocr --quiet

Write-Host "`n✓ All dependencies installed successfully!" -ForegroundColor Green
Write-Host "`nVerifying installation..." -ForegroundColor Cyan

python -c "import easyocr; importcv2; import fastapi; print('All imports OK')"

Write-Host "`nYou can now start the backend server with:" -ForegroundColor Green
Write-Host "python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor White
