@echo off
echo Making VAPI call using curl...

set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

curl --tlsv1.2 -X POST ^
  https://api.vapi.ai/call ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer d1529b85-51d5-47c0-9332-a73d40f7d62b" ^
  -d "{\"type\":\"outboundPhoneCall\",\"assistantId\":\"cfaa163c-4a47-471b-a39e-95c12d0cb738\",\"phoneNumberId\":\"e65a9e6b-33b7-4711-ad21-90220048e38f\",\"customer\":{\"number\":\"+971565401583\"},\"name\":\"TestCall_%TIMESTAMP%\"}"

echo.
echo Call initiated. Check your phone.
pause
