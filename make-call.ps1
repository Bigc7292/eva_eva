# PowerShell script to make a VAPI call

Write-Host "Making VAPI call..." -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$callName = "TestCall_$timestamp"

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer d1529b85-51d5-47c0-9332-a73d40f7d62b"
}

$body = @{
    type = "outboundPhoneCall"
    assistantId = "cfaa163c-4a47-471b-a39e-95c12d0cb738"
    phoneNumberId = "e65a9e6b-33b7-4711-ad21-90220048e38f"
    customer = @{
        number = "+971565401583"
    }
    name = $callName
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://api.vapi.ai/call" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    
    Write-Host "Call initiated successfully!" -ForegroundColor Green
    Write-Host "Call ID: $($response.id)" -ForegroundColor Yellow
    Write-Host "Status: $($response.status)" -ForegroundColor Yellow
    
    # Wait 10 seconds
    Write-Host "Waiting 10 seconds to check status..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    
    # Check status
    $statusResponse = Invoke-RestMethod -Uri "https://api.vapi.ai/call/$($response.id)" -Method Get -Headers @{"Authorization" = "Bearer d1529b85-51d5-47c0-9332-a73d40f7d62b"}
    
    Write-Host "Current status: $($statusResponse.status)" -ForegroundColor Magenta
    Write-Host "Full data:" -ForegroundColor Cyan
    $statusResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error making call: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
