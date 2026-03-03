# Smart Township Backend Server Startup Script
# This script sets the PYTHONPATH correctly and starts the FastAPI server

Write-Host "Starting Smart Township Access Control System Backend..." -ForegroundColor Green

# Set PYTHONPATH to the backend directory
$env:PYTHONPATH = (Get-Location).Path

# Start the server
Write-Host "Server will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "`nPress CTRL+C to stop the server`n" -ForegroundColor Yellow

# Run the server
python -m app.main
